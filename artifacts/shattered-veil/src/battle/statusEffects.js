// ─────────────────────────────────────────────────────────────────────────────
// Pass 10 — Status Effect Cleanup Foundation
//
// Goal: provide a canonical list of status effects + a normalize/alias layer
// + central helpers, WITHOUT removing the existing `FXS` array or breaking
// any existing skill/passive/save reference.
//
// The existing 24-entry `FXS` array in Game.jsx already covers most of the
// canonical statuses (burn/bleed/poison/stun/silence/blind/slow/weaken/expose/
// curse/regen/shield/barrier/fortify/haste/empower/reflect/thorns/nullify/
// evasion/taunt/freeze/sleep/confuse). This module ADDS metadata, aliases,
// and helpers — it does NOT replace `FXS` (Pass 11 may consolidate further).
//
// Save shape: unchanged. Statuses still ride on `unit.efx[]` as
// `{ id, nm, ic, type, v, dur, tl, justApplied }`. The new helpers operate
// on that shape directly.
// ─────────────────────────────────────────────────────────────────────────────

// Old-name → canonical-id alias map. Anything in here is forward-compatible
// with the canonical list below, so old saves / hand-written references keep
// working even if a future skill/passive uses the legacy spelling.
export const STATUS_ALIASES = {
  burning:    'burn',
  scorched:   'burn',
  ignited:    'burn',
  wounded:    'bleed',
  bleeding:   'bleed',
  envenomed:  'poison',
  toxic:      'poison',
  frail:      'weaken',
  weakened:   'weaken',
  exposed:    'expose',
  cracked:    'expose',
  rooted:     'slow',
  slowed:     'slow',
  dazed:      'stun',
  stunned:    'stun',
  muted:      'silence',
  silenced:   'silence',
  blinded:    'blind',
  shielded:   'shield',
  barriered:  'barrier',
  fortified:  'fortify',
  hasted:     'haste',
  regenerating: 'regen',
  cursed:     'curse',
  // Future expansion — any unrecognized name normalizes to itself, so
  // misspellings/typos don't crash; they just won't match canonical metadata.
};

// Canonical status list — everything the player can see in the manual or
// on a unit's efx row. Categories drive UI styling + cleanse targeting.
//
// Field-category statuses (anchored, overchanneled, braced) are currently
// represented at the `btl.tacticalBuffs` layer, not on `efx`. They are listed
// here so the manual / Combat Profile can refer to them by canonical name.
export const CANONICAL_STATUSES = [
  // ── Damage-over-time ────────────────────────────────────────────────────
  { id:'burn',    name:'Burn',    category:'dot', isDebuff:true, canCleanse:true,
    tickTiming:'endTurn', description:'Burning damage at end of turn.',
    visualClass:'sv-status-dot', iconLabel:'🔥' },
  { id:'bleed',   name:'Bleed',   category:'dot', isDebuff:true, canCleanse:true,
    tickTiming:'endTurn', description:'Bleeding damage at end of turn.',
    visualClass:'sv-status-dot', iconLabel:'🩸' },
  { id:'poison',  name:'Poison',  category:'dot', isDebuff:true, canCleanse:true,
    tickTiming:'endTurn', description:'Toxin damage at end of turn — long duration.',
    visualClass:'sv-status-dot', iconLabel:'☠️' },

  // ── Control ─────────────────────────────────────────────────────────────
  { id:'slow',    name:'Slow',    category:'control', isDebuff:true, canCleanse:true,
    description:'Reduced speed and movement.', visualClass:'sv-status-control', iconLabel:'🐌' },
  { id:'stun',    name:'Stun',    category:'control', isDebuff:true, canCleanse:true,
    description:"Skips the unit's next action.", visualClass:'sv-status-control', iconLabel:'⚡' },
  { id:'silence', name:'Silence', category:'control', isDebuff:true, canCleanse:true,
    description:'Cannot cast Veil Magic.', visualClass:'sv-status-control', iconLabel:'🤐' },
  { id:'blind',   name:'Blind',   category:'control', isDebuff:true, canCleanse:true,
    description:'Reduced accuracy.', visualClass:'sv-status-control', iconLabel:'🌑' },

  // ── Vulnerability ───────────────────────────────────────────────────────
  { id:'weaken',  name:'Weaken',  category:'vulnerability', isDebuff:true, canCleanse:true,
    description:'Lower attack output.', visualClass:'sv-status-vulnerability', iconLabel:'💔' },
  { id:'expose',  name:'Expose',  category:'vulnerability', isDebuff:true, canCleanse:true,
    description:'Takes more damage.', visualClass:'sv-status-vulnerability', iconLabel:'🔓' },
  { id:'curse',   name:'Curse',   category:'vulnerability', isDebuff:true, canCleanse:true,
    description:'Multiple weaknesses, hard to cleanse.', visualClass:'sv-status-vulnerability', iconLabel:'👁️' },

  // ── Defensive ───────────────────────────────────────────────────────────
  { id:'shield',  name:'Shield',  category:'defensive', isBuff:true,
    description:'Absorbs incoming damage.', visualClass:'sv-status-defensive', iconLabel:'🛡️' },
  { id:'barrier', name:'Barrier', category:'defensive', isBuff:true,
    description:'Brief, larger absorption.', visualClass:'sv-status-defensive', iconLabel:'🔮' },
  { id:'fortify', name:'Fortify', category:'defensive', isBuff:true,
    description:'Increased defense.', visualClass:'sv-status-defensive', iconLabel:'🏰' },

  // ── Recovery / Support ──────────────────────────────────────────────────
  { id:'regen',   name:'Regen',   category:'recovery', isBuff:true,
    tickTiming:'endTurn', description:'Restores HP at end of turn.',
    visualClass:'sv-status-buff', iconLabel:'💚' },
  { id:'cleanse', name:'Cleanse', category:'recovery', isBuff:true,
    description:'Removes a debuff.', visualClass:'sv-status-buff', iconLabel:'✨' },
  { id:'haste',   name:'Haste',   category:'recovery', isBuff:true,
    description:'Faster, more move.', visualClass:'sv-status-buff', iconLabel:'💨' },
  { id:'empower', name:'Empower', category:'recovery', isBuff:true,
    description:'Increased attack output.', visualClass:'sv-status-buff', iconLabel:'⬆️' },

  // ── Reactive / Special ──────────────────────────────────────────────────
  { id:'reflect', name:'Reflect', category:'reactive', isBuff:true,
    description:'Returns part of incoming damage.', visualClass:'sv-status-buff', iconLabel:'🪞' },
  { id:'thorns',  name:'Thorns',  category:'reactive', isBuff:true,
    description:'Damages attackers in melee.', visualClass:'sv-status-buff', iconLabel:'🌹' },
  { id:'nullify', name:'Nullify', category:'reactive', isBuff:true,
    description:'Negates the next debuff.', visualClass:'sv-status-buff', iconLabel:'⭕' },
  { id:'evasion', name:'Evasion', category:'reactive', isBuff:true,
    description:'Higher dodge chance.', visualClass:'sv-status-buff', iconLabel:'👻' },
  { id:'veilflare_focus', name:'Veilflare Focus', category:'reactive', isBuff:true,
    description:'+10% crit, +Field Attunement, +20% next Veil Magic / Veilbreak (consumed once).',
    visualClass:'sv-status-field', iconLabel:'✦' },

  // ── Field / Arena Special ───────────────────────────────────────────────
  { id:'fractured',     name:'Fractured',     category:'field', isDebuff:true,
    description:'Standing on a broken-Veil tile.', visualClass:'sv-status-field', iconLabel:'⚡' },
  { id:'anchored',      name:'Anchored',      category:'field', isBuff:true,
    description:'Veil Anchor active — bonus Field Attunement on next clash.',
    visualClass:'sv-status-field', iconLabel:'⚓' },
  { id:'overchanneled', name:'Overchanneled', category:'field', isBuff:true,
    description:'Next Veil Magic / Veilbreak supercharged.',
    visualClass:'sv-status-field', iconLabel:'🩸' },
  { id:'braced',        name:'Braced',        category:'field', isBuff:true,
    description:'Reduced incoming field tick.',
    visualClass:'sv-status-field', iconLabel:'🛡' },

  // ── Legacy / transitional (kept for compatibility, not deprecated yet) ──
  // TODO Pass 11: review whether `freeze` collapses into Slow+Stun, and
  // whether `confuse` / `taunt` need the new Controller/AI hooks.
  { id:'freeze',  name:'Freeze',  category:'control', isDebuff:true, canCleanse:true,
    description:'Skips actions briefly.', visualClass:'sv-status-control', iconLabel:'❄️' },
  { id:'sleep',   name:'Sleep',   category:'control', isDebuff:true, canCleanse:true,
    description:'Skips actions until hit.', visualClass:'sv-status-control', iconLabel:'💤' },
  { id:'confuse', name:'Confuse', category:'control', isDebuff:true, canCleanse:true,
    description:'May target allies.', visualClass:'sv-status-control', iconLabel:'💫' },
  { id:'taunt',   name:'Taunt',   category:'control', isDebuff:true, canCleanse:true,
    description:'Forces target prioritization.', visualClass:'sv-status-control', iconLabel:'😤' },
];

// Index by id for O(1) lookups.
const _byId = new Map(CANONICAL_STATUSES.map(s => [s.id, s]));

// Normalize anything (string, object with .id, alias) → canonical id string.
// Unknown ids return their own lowercased form so logs still read sensibly.
export function normalizeStatusEffect(input) {
  if (!input) return null;
  const raw = typeof input === 'string' ? input : (input.id || input.name || '');
  const n = String(raw).toLowerCase().trim();
  if (!n) return null;
  return STATUS_ALIASES[n] || n;
}

// Look up canonical metadata. Returns null if unknown.
export function getStatusMeta(input) {
  const id = normalizeStatusEffect(input);
  if (!id) return null;
  return _byId.get(id) || null;
}

// Player-friendly tooltip text.
export function getStatusTooltip(input) {
  const m = getStatusMeta(input);
  if (!m) {
    const id = normalizeStatusEffect(input);
    return id ? id.charAt(0).toUpperCase() + id.slice(1) : '';
  }
  return m.name + ' — ' + (m.description || '') + (m.canCleanse ? ' (cleansable)' : '');
}

// CSS classes for chip rendering.
export function getStatusVisualClass(input) {
  const m = getStatusMeta(input);
  if (!m) return 'sv-status-chip';
  return [
    'sv-status-chip',
    m.visualClass || '',
    m.isBuff ? 'sv-status-buff' : '',
    m.isDebuff ? 'sv-status-debuff' : '',
  ].filter(Boolean).join(' ');
}

// True if `unit` carries the given status (alias-aware).
export function hasStatus(unit, statusId) {
  if (!unit || !Array.isArray(unit.efx)) return false;
  const id = normalizeStatusEffect(statusId);
  if (!id) return false;
  return unit.efx.some(e => normalizeStatusEffect(e.id) === id);
}

// Compute the chance a given status will land on `target`. ctx may carry
// `statusPower` (source) and `statusResist` (target) and `isBoss` flag.
// Boss units resist hard control (stun/silence/sleep/freeze) more.
export function calculateStatusChance(_source, target, status, ctx = {}) {
  const meta = getStatusMeta(status);
  const base = (status && typeof status.chance === 'number') ? status.chance
             : (typeof ctx.baseChance === 'number') ? ctx.baseChance
             : 0.6;
  const sp = ctx.statusPower != null ? ctx.statusPower : 0;
  const sr = ctx.statusResist != null ? ctx.statusResist : 0;
  let extra = 0;
  const hardControl = ['stun', 'silence', 'sleep', 'freeze'];
  if ((ctx.isBoss || target?.boss) && meta && hardControl.includes(meta.id)) extra += 0.20;
  return Math.max(0.05, Math.min(0.95, base + sp - sr - extra));
}

// Gate function — short-circuits before any roll.
export function canApplyStatus(_source, target, status, _ctx = {}) {
  if (!target) return false;
  if (typeof target.hp === 'number' && target.hp <= 0) return false;
  // Nullify negates the next debuff.
  const meta = getStatusMeta(status);
  if (meta && meta.isDebuff && hasStatus(target, 'nullify')) {
    // consume the nullify charge
    removeStatusEffect(target, 'nullify');
    return false;
  }
  return true;
}

// Apply (or refresh) a status on `target`. Always refreshes — no stacking
// in this pass. Returns true if applied.
export function applyStatusEffect(target, statusInput, source = null, ctx = {}) {
  if (!target) return false;
  if (!Array.isArray(target.efx)) target.efx = [];
  const meta = getStatusMeta(statusInput);
  const id = meta ? meta.id : normalizeStatusEffect(statusInput);
  if (!id) return false;
  if (!canApplyStatus(source, target, statusInput, ctx)) return false;
  const dur = Math.max(1, Math.min(8,
    ctx.duration || statusInput?.dur || statusInput?.tl || meta?.defaultDur || 3
  ));
  // Refresh — drop any existing entry with the same canonical id.
  target.efx = target.efx.filter(e => normalizeStatusEffect(e.id) !== id);
  target.efx.push({
    id, nm: meta?.name || id, ic: meta?.iconLabel || '✦',
    type: meta?.category || 'misc',
    v: ctx.value || statusInput?.v || 0,
    dur, tl: dur, justApplied: true,
  });
  return true;
}

// Remove a single status (alias-aware). Returns true if anything was removed.
export function removeStatusEffect(unit, statusId) {
  if (!unit || !Array.isArray(unit.efx)) return false;
  const id = normalizeStatusEffect(statusId);
  if (!id) return false;
  const before = unit.efx.length;
  unit.efx = unit.efx.filter(e => normalizeStatusEffect(e.id) !== id);
  return unit.efx.length < before;
}

// Cleanse — remove either a single status by id, or every cleansable status
// in a category (e.g. cleanseStatus(unit, 'dot')). Returns count removed.
export function cleanseStatus(unit, categoryOrStatusId) {
  if (!unit || !Array.isArray(unit.efx)) return 0;
  const target = String(categoryOrStatusId || '').toLowerCase();
  if (!target) return 0;
  let removed = 0;
  unit.efx = unit.efx.filter(e => {
    const m = getStatusMeta(e.id);
    if (!m) return true;
    if (m.id === target) { removed++; return false; }
    if (m.category === target && m.canCleanse) { removed++; return false; }
    return true;
  });
  return removed;
}

// Tick statuses for a given timing window. Returns an array of events the
// caller can apply (the helper does NOT mutate hp itself — callers handle
// damage/heal so they can route through the existing combat-log pipeline).
//
// Safe: returns [] if unit is missing, dead, or has no efx.
export function tickStatusEffects(unit, timing = 'endTurn', _ctx = {}) {
  if (!unit || !Array.isArray(unit.efx)) return [];
  if (typeof unit.hp === 'number' && unit.hp <= 0) return [];
  const events = [];
  unit.efx.forEach(e => {
    const m = getStatusMeta(e.id);
    if (!m) return;
    if (m.tickTiming && m.tickTiming !== timing) return;
    if (m.id === 'burn' || m.id === 'bleed') {
      events.push({ type:'dot', id:m.id, name:m.name, dmg: Math.max(1, e.v || 8) });
    } else if (m.id === 'poison') {
      events.push({ type:'dot', id:m.id, name:m.name, dmg: Math.max(1, e.v || 5) });
    } else if (m.id === 'regen') {
      events.push({ type:'heal', id:m.id, name:m.name, heal: Math.max(1, e.v || 12) });
    }
  });
  return events;
}

// Short, readable battle-log phrases. Logs should be informative but not
// spammy — callers should append the numeric impact (damage/heal) afterward.
export const STATUS_LOG_PHRASES = {
  burn:           'Burn took hold.',
  bleed:          'A bleeding wound opened.',
  poison:         'Poison weakened the target.',
  stun:           'A jarring blow stunned the target.',
  silence:        'Silence cut the Veil from their throat.',
  blind:          'Vision blurred — Blind set in.',
  slow:           'A creeping Slow settled in.',
  weaken:         'Strength ebbed — Weaken set in.',
  expose:         'Defenses cracked — Expose set in.',
  curse:          'A Curse coiled around them.',
  shield:         'A Shield flickered to life.',
  barrier:        'A Barrier shimmered into being.',
  fortify:        'Bones hardened — Fortify set in.',
  regen:          'Regen began mending wounds.',
  haste:          'Haste quickened their step.',
  empower:        'A surge of Empower lifted their swing.',
  reflect:        'A Reflect ward stood ready.',
  thorns:         'Thorns bristled across their skin.',
  nullify:        'Nullify primed against the next debuff.',
  evasion:        'A blur of Evasion settled around them.',
  veilflare_focus:'Veilflare Focus sharpened their next strike.',
  freeze:         'A killing chill — Freeze locked them in place.',
  sleep:          'They drifted into Sleep.',
  confuse:        'Confuse muddled their aim.',
  taunt:          'Taunt drew the eye.',
};
