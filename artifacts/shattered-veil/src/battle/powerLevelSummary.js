// ─────────────────────────────────────────────────────────────────────────
// POWER LEVEL SUMMARY HELPERS
// ─────────────────────────────────────────────────────────────────────────
// Pure display math for the battle-field Power Level UI. This is a relative
// hype/readability indicator only. It does not replace stats, alter damage,
// change targeting, mutate battle state, or create a hidden combat mechanic.
// ─────────────────────────────────────────────────────────────────────────

const BAND_META = [
  { key: 'suppressed', label: 'Suppressed', min: 0, color: '#6aa7ff', glow: 'cool-blue' },
  { key: 'stable', label: 'Stable', min: 900, color: '#5fffd2', glow: 'teal' },
  { key: 'strong', label: 'Strong', min: 2200, color: '#ffd76a', glow: 'gold' },
  { key: 'dangerous', label: 'Dangerous', min: 5200, color: '#ff7a3d', glow: 'orange' },
  { key: 'overwhelming', label: 'Overwhelming', min: 11000, color: '#d78cff', glow: 'violet' },
  { key: 'mythic', label: 'Mythic', min: 22000, color: '#ffffff', glow: 'white-violet' },
];

function n(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function stat(unit, key, fallback = 0) {
  return n(unit?.[key] ?? unit?.st?.[key] ?? unit?.stats?.[key], fallback);
}

function pct(unit, fallback = NaN) {
  return n(unit?.hpPct ?? unit?.healthPct ?? unit?.hpPercent ?? unit?.pctHp, fallback);
}

function ratio(current, max, fallback = 1) {
  const cur = n(current, NaN);
  const cap = n(max, NaN);
  if (!Number.isFinite(cur) || !Number.isFinite(cap) || cap <= 0) return fallback;
  return Math.max(0, Math.min(1.5, cur / cap));
}

function countEffects(list) {
  if (!list) return 0;
  if (Array.isArray(list)) return list.length;
  if (typeof list === 'object') return Object.keys(list).length;
  return 0;
}

function hasAny(unit, keys) {
  return keys.some(k => !!unit?.[k] || !!unit?.status?.[k] || !!unit?.statuses?.[k] || !!unit?.effects?.[k]);
}

function getBand(value, flags = {}) {
  let band = BAND_META[0];
  for (const b of BAND_META) {
    if (value >= b.min) band = b;
  }
  if (flags.sealed && value < 5200) return { ...band, key: 'sealed-' + band.key, label: 'Sealed ' + band.label };
  if (flags.boss && value >= 5200) return { ...band, label: 'Boss · ' + band.label };
  if (flags.released && value >= 2200) return { ...band, label: 'Released · ' + band.label };
  return band;
}

function kindDefaults(kind = 'ally') {
  const k = String(kind || '').toLowerCase();
  if (k === 'enemy' || k === 'boss' || k === 'enemyboss') {
    return { hpMax: 100, mpMax: 18, atk: 28, mag: 22, def: 22, spd: 18, lck: 12 };
  }
  if (k === 'pet' || k === 'summon') {
    return { hpMax: 100, mpMax: 14, atk: 18, mag: 16, def: 16, spd: 18, lck: 10 };
  }
  if (k === 'player') {
    return { hpMax: 100, mpMax: 24, atk: 24, mag: 24, def: 20, spd: 20, lck: 18 };
  }
  return { hpMax: 100, mpMax: 22, atk: 22, mag: 22, def: 20, spd: 18, lck: 14 };
}

export function normalizeArenaUnitForPowerLevel(unit = {}, battleContext = {}) {
  const kind = String(unit.kind || unit.type || 'ally').toLowerCase();
  const defaults = kindDefaults(kind);
  const hpPct = pct(unit, NaN);
  const hpMax = stat(unit, 'hpMax', stat(unit, 'maxHp', defaults.hpMax));
  const hp = n(unit.hp ?? unit.curHp ?? unit.currentHp, Number.isFinite(hpPct) ? hpPct : hpMax);
  const mpMax = stat(unit, 'mpMax', stat(unit, 'maxMp', defaults.mpMax));
  const mp = n(unit.mp ?? unit.curMp ?? unit.currentMp, mpMax);
  const label = String(unit.label || unit.name || unit.nm || '').trim();
  const bossHint = /boss|elite|lord|wyrm|dragon|veil|avatar|ancient|primordial/i.test(label);

  return {
    ...unit,
    kind,
    hp,
    hpMax,
    mp,
    mpMax,
    atk: stat(unit, 'atk', defaults.atk),
    mag: stat(unit, 'mag', defaults.mag),
    def: stat(unit, 'def', defaults.def),
    spd: stat(unit, 'spd', defaults.spd),
    lck: stat(unit, 'lck', defaults.lck),
    crit: stat(unit, 'crit', stat(unit, 'crt', 0)),
    evasion: stat(unit, 'evasion', stat(unit, 'eva', 0)),
    guard: stat(unit, 'guard', 0),
    support: stat(unit, 'support', stat(unit, 'sup', 0)),
    isBoss: !!unit.isBoss || kind === 'boss' || kind === 'enemyboss' || bossHint,
    inField: !!unit.inField || !!unit.fieldBuff || !!battleContext.activeField,
  };
}

export function getPowerLevelSummary(unit = {}, battleContext = {}) {
  const unitHpPct = pct(unit, NaN);
  const hpMax = stat(unit, 'hpMax', stat(unit, 'maxHp', Number.isFinite(unitHpPct) ? 100 : stat(unit, 'hp', 1)));
  const mpMax = stat(unit, 'mpMax', stat(unit, 'maxMp', stat(unit, 'mp', 0)));
  const hpNow = unit.hp ?? unit.curHp ?? unit.currentHp ?? (Number.isFinite(unitHpPct) ? unitHpPct : hpMax);
  const mpNow = unit.mp ?? unit.curMp ?? unit.currentMp;
  const hpRatio = ratio(hpNow, hpMax, 1);
  const mpRatio = ratio(mpNow, mpMax, mpMax > 0 ? 1 : 0);

  const core =
    stat(unit, 'hp', hpMax) * 1.1 +
    hpMax * 0.9 +
    mpMax * 1.35 +
    stat(unit, 'atk') * 42 +
    stat(unit, 'mag') * 42 +
    stat(unit, 'def') * 36 +
    stat(unit, 'spd') * 34 +
    stat(unit, 'lck') * 22 +
    stat(unit, 'crit') * 28 +
    stat(unit, 'evasion') * 24 +
    stat(unit, 'guard') * 34 +
    stat(unit, 'support') * 30;

  const equipmentScore =
    n(unit.powerBonus) +
    n(unit.gearPower) +
    n(unit.armorPower) +
    n(unit.weaponPower) +
    countEffects(unit.equipment) * 120 +
    countEffects(unit.armor) * 90 +
    countEffects(unit.bloodmarks) * 160;

  const buffCount = countEffects(unit.buffs || unit.positiveStatuses || unit.boosts);
  const debuffCount = countEffects(unit.debuffs || unit.negativeStatuses || unit.afflictions);
  const statusCount = countEffects(unit.statuses || unit.status || unit.effects);

  const flags = {
    boss: !!unit.isBoss || unit.kind === 'boss' || unit.kind === 'enemyBoss' || unit.kind === 'enemyboss',
    sealed: !!unit.sealed || !!unit.selfSeal || hasAny(unit, ['seal', 'sealed', 'suppressed']),
    released: !!unit.sealReleased || !!unit.released || hasAny(unit, ['release', 'unsealed', 'awakened']),
    field: !!battleContext.activeField || !!unit.inField || !!unit.fieldBuff,
    guard: !!unit.guarding || !!unit.guardState,
    summon: unit.kind === 'pet' || unit.kind === 'summon',
  };

  let multiplier = 1;
  multiplier *= 0.72 + hpRatio * 0.34;
  multiplier *= 1 + mpRatio * 0.08;
  multiplier *= 1 + buffCount * 0.07;
  multiplier *= 1 - Math.min(0.38, debuffCount * 0.06);
  multiplier *= 1 + Math.min(0.18, statusCount * 0.015);
  if (flags.boss) multiplier *= 1.35;
  if (flags.sealed) multiplier *= 0.62;
  if (flags.released) multiplier *= 1.45;
  if (flags.field) multiplier *= 1.12;
  if (flags.guard) multiplier *= 1.08;
  if (flags.summon) multiplier *= 0.82;

  const raw = Math.max(1, Math.round((core + equipmentScore + 180) * multiplier));
  const value = Math.max(1, Math.round(raw / 10) * 10);
  const band = getBand(value, flags);

  return {
    value,
    formatted: value.toLocaleString(),
    label: `POWER LEVEL ${value.toLocaleString()}`,
    band: band.key,
    bandLabel: band.label,
    color: band.color,
    glow: band.glow,
    flags,
    visualOnly: true,
    help: 'Relative battle strength indicator based on current stats, gear, seals, buffs, debuffs, fields, and battle conditions. Display only.',
  };
}

export function getPowerLevelSummaryForArenaUnit(unit = {}, battleContext = {}) {
  return getPowerLevelSummary(normalizeArenaUnitForPowerLevel(unit, battleContext), battleContext);
}

export function comparePowerLevels(unitA = {}, unitB = {}, battleContext = {}) {
  const a = getPowerLevelSummary(unitA, battleContext);
  const b = getPowerLevelSummary(unitB, battleContext);
  const diff = a.value - b.value;
  return {
    a,
    b,
    diff,
    ratio: b.value > 0 ? a.value / b.value : 1,
    label: diff === 0 ? 'Even power' : diff > 0 ? 'Advantage' : 'Threatened',
  };
}

export const POWER_LEVEL_BANDS = BAND_META;
