// ============================================================================
// Battle Rework Pass 11 — Class Roles + Skill Range/Shape Metadata Layer
// ----------------------------------------------------------------------------
// Distinct role + range + field identity for every player class, plus light
// helpers that stamp generated skills with range/shape so the existing
// procedural skill pipeline (mkSkills in Game.jsx) does not need a rewrite.
//
// IMPORTANT — non-breaking:
//   - Existing `inter[]` interactions per class are unchanged. They already
//     use canonical statuses from Pass 10 and define class playstyle.
//   - `mkPassives` and `mkUltPool` are unchanged. They are already
//     class-themed and canonical-status-aware.
//   - Save shape unchanged — no new persisted fields required. Range/shape
//     metadata is recomputed at battle time via `stampSkillCombatMeta` so
//     old saves keep working.
//   - All numbers TEMPORARY. Final per-class numeric tuning lands after
//     playtesting (see TODO Pass 12).
// ============================================================================

// ---- Role catalog ---------------------------------------------------------
// Every class gets one PRIMARY role tag. No two classes share a primary role
// to keep identities distinct in the UI.
export const ROLE_META = {
  tank:           { label: "Tank",                color: "#7da9ff", shortLabel: "TANK",   ic: "🛡" },
  bulwark:        { label: "Barrier Bulwark",     color: "#a0c4ff", shortLabel: "BULWARK",ic: "🧱" },
  fieldTank:      { label: "Field Tank",          color: "#90a4ae", shortLabel: "F.TANK", ic: "🌀" },
  bruiser:        { label: "Sustain Bruiser",     color: "#ff9a76", shortLabel: "BRUISER",ic: "🔥" },
  critStriker:    { label: "Crit Striker",        color: "#ffd54f", shortLabel: "CRIT",   ic: "👊" },
  assassin:       { label: "Assassin",            color: "#ce93d8", shortLabel: "STALK",  ic: "🗡" },
  duelist:        { label: "DoT Duelist",         color: "#b388ff", shortLabel: "DUEL",   ic: "⚔️" },
  rangerProj:     { label: "Ranger / Projectile", color: "#81c784", shortLabel: "RANGE",  ic: "🏹" },
  longCaster:     { label: "Long-Range Caster",   color: "#d500f9", shortLabel: "L.CAST", ic: "🔮" },
  burstCaster:    { label: "Burst Caster",        color: "#ff7043", shortLabel: "BURST",  ic: "💥" },
  longDebuff:     { label: "Void Debuffer",       color: "#7e57c2", shortLabel: "DEBUF",  ic: "🕳️" },
  healer:         { label: "Healer / Support",    color: "#ffd54f", shortLabel: "HEAL",   ic: "✝️" },
  sustainSupport: { label: "Sustain Support",     color: "#4fc3f7", shortLabel: "SUST",   ic: "🌊" },
  buffSupport:    { label: "Buff Support",        color: "#26a69a", shortLabel: "BUFF",   ic: "🎵" },
  tempoControl:   { label: "Tempo Controller",    color: "#9575cd", shortLabel: "TEMPO",  ic: "⏳" },
  statusControl:  { label: "Status Controller",   color: "#ab47bc", shortLabel: "STATUS", ic: "🌙" },
  areaDisruptor:  { label: "Area Disruptor",      color: "#26c6da", shortLabel: "AREA",   ic: "🔔" },
  debuffControl:  { label: "Debuff Controller",   color: "#8e24aa", shortLabel: "CTRL",   ic: "🎭" },
  mirror:         { label: "Mirror Controller",   color: "#4dd0e1", shortLabel: "MIRROR", ic: "❄️" },
  adaptive:       { label: "Adaptive Shifter",    color: "#ff8a65", shortLabel: "ADAPT",  ic: "🐉" },
  riskReward:     { label: "Risk / Reward",       color: "#ffd600", shortLabel: "WILD",   ic: "🎲" },
};

// ---- Range identity (default skill range bias per class) ------------------
// 1 = melee, 2 = lunging, 3-4 = medium, 5-6 = long, 7+ = artillery.
// Values are baseline defaults applied to procedurally generated skills when
// the skill itself does not declare a range. Skill type (heal/buff/aoe) and
// element can shift this — see inferSkillRange below.
export const RANGE_TIER = {
  melee:    { min: 1, max: 2, label: "Close Range" },
  short:    { min: 2, max: 3, label: "Close Range" },
  medium:   { min: 3, max: 5, label: "Mid Range" },
  long:     { min: 5, max: 7, label: "Long Range" },
  global:   { min: 99, max: 99, label: "Arena-Wide" }, // Veilbreak / ult only
};

// ---- Per-class identity table --------------------------------------------
// One distinct PRIMARY role per class. `roleSummary` is the short tooltip
// blurb used by the class pick card. `vbTheme` is the Veilbreak field flavor
// the (existing) Veilbreak chain layer can read in a future pass.
//
// `weakness` is intentional and visible to the player so each class has a
// readable tradeoff.
export const CLASS_ROLES = {
  paladin: {
    role: "tank",
    roleSummary: "Holy steel bulwark. Front-line guard chains, smite windows on stunned foes, and party-warding heals.",
    primaryStats: ["HP", "DEF", "Guard Strength"],
    rangeIdentity: "melee",
    preferredShape: "single",
    terrainAffinity: ["hallowed", "metal"],
    fieldIdentity: "Hallowed Bulwark — allies inside gain Fortify pulses; enemies take a small Light tick.",
    weakness: "Low Speed, low burst against unstunned targets.",
    vbTheme: { tone: "hallowed", color: "#fff176" },
  },
  assassin: {
    role: "assassin",
    roleSummary: "Nightblade flanker. High Crit, high Evasion, executes Blinded or bleeding prey.",
    primaryStats: ["SPD", "Crit Rate", "Evasion"],
    rangeIdentity: "melee",
    preferredShape: "single",
    terrainAffinity: ["shadow"],
    fieldIdentity: "Veil of Shadow — short field that grants Evasion to allies and Blind tick to enemies inside.",
    weakness: "Lowest defense among melee. Punished by AoE.",
    vbTheme: { tone: "shadow", color: "#ce93d8" },
  },
  sorcerer: {
    role: "longCaster",
    roleSummary: "Pure Arcane archmage. Long range, big bursts, MP overflow combos.",
    primaryStats: ["MAG", "Status Power", "Veil Generation"],
    rangeIdentity: "long",
    preferredShape: "burst",
    terrainAffinity: ["charged"],
    fieldIdentity: "Arcane Storm — hostile zone that deals small Arcane ticks and amplifies caster crit.",
    weakness: "Fragile in melee. Vulnerable to Silence.",
    vbTheme: { tone: "arcane", color: "#d500f9" },
  },
  priest: {
    role: "healer",
    roleSummary: "Beacon priest. Cleanses, Shields, Regen — and judgment Light damage on cursed foes.",
    primaryStats: ["MAG", "Healing Power", "Status Resist"],
    rangeIdentity: "medium",
    preferredShape: "single",
    terrainAffinity: ["hallowed"],
    fieldIdentity: "Hallowed Sanctum — friendly zone: Regen + Cleanse pulses, dampens incoming Curse/Bleed.",
    weakness: "Low solo damage outside Light judgment combos.",
    vbTheme: { tone: "hallowed", color: "#ffd54f" },
  },
  ranger: {
    role: "rangerProj",
    roleSummary: "Versatile skirmisher. Long-range projectiles, Poison/Slow setup, Quick Draw double-tap.",
    primaryStats: ["SPD", "Accuracy", "ATK"],
    rangeIdentity: "long",
    preferredShape: "line",
    terrainAffinity: ["verdant", "stormcharged"],
    fieldIdentity: "Bramblewind — line zone: Slow + Bleed tick on the line; allies in line gain Accuracy.",
    weakness: "Weaker close-up. Needs setup turns to peak.",
    vbTheme: { tone: "verdant", color: "#66bb6a" },
  },
  koen: {
    role: "burstCaster",
    roleSummary: "Blazing twin — Fire/Nature DoT amplifier. Stacks Burn + Poison for large bloom hits.",
    primaryStats: ["MAG", "Status Power"],
    rangeIdentity: "medium",
    preferredShape: "burst",
    terrainAffinity: ["scorched", "verdant"],
    fieldIdentity: "Petalfire Bloom — burst zone: Burn tick on enemies, refreshes existing Burn/Poison once.",
    weakness: "Fragile. Loses tempo against Cleanse-heavy comps.",
    vbTheme: { tone: "scorched", color: "#ff8a65" },
  },
  shouei: {
    role: "mirror",
    roleSummary: "Cold twin — copies enemy techniques, freezes prey, then shatters.",
    primaryStats: ["MAG", "Status Resist"],
    rangeIdentity: "medium",
    preferredShape: "single",
    terrainAffinity: ["frozen"],
    fieldIdentity: "Mirror Frost — neutral zone: applies Slow to enemies, copied skills cost less while inside.",
    weakness: "Combos are conditional. Empty Copy slot is dead weight.",
    vbTheme: { tone: "frozen", color: "#4dd0e1" },
  },
  phoenix: {
    role: "bruiser",
    roleSummary: "Ash-forged Fire knight. Sustains through Burn pressure, rebirth, and desperation power.",
    primaryStats: ["HP", "ATK", "MAG"],
    rangeIdentity: "melee",
    preferredShape: "single",
    terrainAffinity: ["scorched"],
    fieldIdentity: "Pyre Renewal — friendly zone: Regen pulses, Fire damage gains a small power boost.",
    weakness: "Mediocre control tools. Loses to pure-burst snipers.",
    vbTheme: { tone: "scorched", color: "#ff7043" },
  },
  chrono: {
    role: "tempoControl",
    roleSummary: "Time savant. Slow + Stun lock, Haste rotation, denies enemy turns.",
    primaryStats: ["SPD", "MAG"],
    rangeIdentity: "medium",
    preferredShape: "single",
    terrainAffinity: ["temporal"],
    fieldIdentity: "Time Distortion — neutral zone: enemies get Slow tick, allies get Haste tick.",
    weakness: "Bosses resist hard control more often, blunting peak windows.",
    vbTheme: { tone: "temporal", color: "#7e57c2" },
  },
  dream: {
    role: "statusControl",
    roleSummary: "Psychic medium. Sleep / Confuse / Curse stacker, devours afflicted prey.",
    primaryStats: ["MAG", "Status Power"],
    rangeIdentity: "medium",
    preferredShape: "single",
    terrainAffinity: ["shadow", "veiled"],
    fieldIdentity: "Lucid Devourer — hostile zone: Sleep + Curse tick, mind statuses last 1 extra turn inside.",
    weakness: "Bosses resist hard control. Low raw damage without afflictions.",
    vbTheme: { tone: "veiled", color: "#ab47bc" },
  },
  voidmage: {
    role: "longDebuff",
    roleSummary: "Void savant. Long-range Curse + Silence, devours buffed targets.",
    primaryStats: ["MAG", "Status Power"],
    rangeIdentity: "long",
    preferredShape: "single",
    terrainAffinity: ["veiled"],
    fieldIdentity: "Abyss Maw — hostile zone: Curse + Weaken tick; enemy buffs decay one turn faster inside.",
    weakness: "Frailest caster. Low burst without setup.",
    vbTheme: { tone: "veiled", color: "#4a148c" },
  },
  rune: {
    role: "bulwark",
    roleSummary: "Earth/Metal wardsmith. Layered Shield + Fortify, then crushing seal-breaker blows.",
    primaryStats: ["DEF", "Guard Strength", "HP"],
    rangeIdentity: "melee",
    preferredShape: "single",
    terrainAffinity: ["metal", "earthen"],
    fieldIdentity: "Sealed Bulwark — friendly zone: Shield refresh on guard, enemies attacking into it take Thorns.",
    weakness: "Slow. Falls behind without time to stack wards.",
    vbTheme: { tone: "metal", color: "#78909c" },
  },
  bard: {
    role: "buffSupport",
    roleSummary: "Battle minstrel. Spreads Haste / Empower, controls tempo with Resonance.",
    primaryStats: ["MAG", "Healing Power", "SPD"],
    rangeIdentity: "medium",
    preferredShape: "cone",
    terrainAffinity: ["resonant"],
    fieldIdentity: "Resonant Chorus — friendly zone: refreshes a buff on allies inside each turn.",
    weakness: "Solo damage is the lowest among hybrids.",
    vbTheme: { tone: "resonant", color: "#26a69a" },
  },
  gravity: {
    role: "fieldTank",
    roleSummary: "Worldweight juggernaut. Bends space, denies movement, Guard becomes a damage source.",
    primaryStats: ["HP", "DEF", "Guard Strength"],
    rangeIdentity: "melee",
    preferredShape: "burst",
    terrainAffinity: ["dense"],
    fieldIdentity: "Singularity Press — hostile zone: enemies inside lose 1 Move, take a small Gravity tick.",
    weakness: "Lowest Speed in the roster. Vulnerable to ranged kiting.",
    vbTheme: { tone: "dense", color: "#455a64" },
  },
  sound: {
    role: "areaDisruptor",
    roleSummary: "Cathedral-echo specialist. Cone disruption, Silence windows, reflect crescendos.",
    primaryStats: ["MAG", "Status Power"],
    rangeIdentity: "medium",
    preferredShape: "cone",
    terrainAffinity: ["resonant"],
    fieldIdentity: "Cathedral Echo — neutral zone: enemies inside have a small chance to be Silenced each turn.",
    weakness: "Soft-control reliant. Punished by Nullify.",
    vbTheme: { tone: "resonant", color: "#26a69a" },
  },
  puppet: {
    role: "debuffControl",
    roleSummary: "Soul-thread controller. Stacks Curse + Bleed + Weaken, drains afflicted prey.",
    primaryStats: ["MAG", "Status Power"],
    rangeIdentity: "medium",
    preferredShape: "single",
    terrainAffinity: ["shadow"],
    fieldIdentity: "Soulthread Web — hostile zone: enemies inside take +1 turn on existing debuffs (clamped).",
    weakness: "Slow ramp. Needs targets to stay alive long enough to bleed.",
    vbTheme: { tone: "shadow", color: "#8e24aa" },
  },
  tide: {
    role: "sustainSupport",
    roleSummary: "Sea-choir mage. Heals through Water/Sound, walls with Shield/Barrier, drowns with Slow.",
    primaryStats: ["MAG", "Healing Power", "DEF"],
    rangeIdentity: "medium",
    preferredShape: "zone",
    terrainAffinity: ["flooded", "resonant"],
    fieldIdentity: "Tideborn Sanctum — friendly zone: Regen pulses, allies inside gain mild Status Resist.",
    weakness: "Damage is mediocre without Slow setup.",
    vbTheme: { tone: "flooded", color: "#0288d1" },
  },
  monk: {
    role: "critStriker",
    roleSummary: "Stone-body brawler. Crit-focused close range, Flurry synergy, Guard counter loops.",
    primaryStats: ["ATK", "Crit Rate", "Move"],
    rangeIdentity: "melee",
    preferredShape: "single",
    terrainAffinity: ["earthen"],
    fieldIdentity: "Iron Stance — friendly zone: melee crit chance up while inside; enemy Move reduced by 1.",
    weakness: "Tiny MP pool. Skill spam is unaffordable.",
    vbTheme: { tone: "earthen", color: "#8d6e63" },
  },
  primal: {
    role: "adaptive",
    roleSummary: "Wildform shifter. Rolls 4 elements per run; the active element bends range and shape.",
    primaryStats: ["ATK", "MAG", "Adaptive"],
    rangeIdentity: "medium",
    preferredShape: "single",
    terrainAffinity: ["any"],
    fieldIdentity: "Wildform Surge — neutral zone: ticks the currently-active rolled element on enemies inside.",
    weakness: "Run RNG. A bad elemental roll undermines a kit.",
    vbTheme: { tone: "wild", color: "#ff6f00" },
  },
  hexblade: {
    role: "duelist",
    roleSummary: "Cursed duelist. Stacks Poison/Bleed/Curse, then cashes them in a brutal finisher.",
    primaryStats: ["ATK", "MAG", "Status Power"],
    rangeIdentity: "short",
    preferredShape: "single",
    terrainAffinity: ["shadow"],
    fieldIdentity: "Hex Brand Field — hostile zone: refreshes one DoT on enemies inside (clamped per turn).",
    weakness: "Cleanse-heavy comps neutralize the cashout window.",
    vbTheme: { tone: "shadow", color: "#7b1fa2" },
  },
  gambler: {
    role: "riskReward",
    roleSummary: "Luck-bent skirmisher. Lucky rolls swing huge; bad rolls hurt — Bounce Back smooths the worst.",
    primaryStats: ["LCK", "SPD"],
    rangeIdentity: "medium",
    preferredShape: "single",
    terrainAffinity: ["charged"],
    fieldIdentity: "Wild Fortune — neutral zone: lucky rolls inside the field shift slightly toward higher results.",
    weakness: "Variance. The worst rolls can stall a turn.",
    vbTheme: { tone: "charged", color: "#ffd600" },
  },
};

// ---- Helpers --------------------------------------------------------------

export function getClassRole(classId) {
  if (!classId) return null;
  return CLASS_ROLES[classId] || null;
}

export function getRoleMeta(role) {
  if (!role) return ROLE_META.tank;
  return ROLE_META[role] || ROLE_META.tank;
}

// Infer a default range tier for a generated skill given its type/aoe/element
// and the owner class's range identity. NEVER returns Infinity. Always
// returns finite numbers safe for arena math.
//
// Returns { min, max, default } where `default` is the canonical engine value
// to use when picking exactly one number.
export function inferSkillRange(skill, classId) {
  if (!skill) return { min: 1, max: 1, default: 1 };
  const role = CLASS_ROLES[classId];
  const baseTier = (role && RANGE_TIER[role.rangeIdentity]) || RANGE_TIER.medium;
  const t = skill.t;

  // Self-targeting buffs sit at range 0.
  if (t === "buff") return { min: 0, max: 0, default: 0 };
  // Heals are a comfortable medium reach.
  if (t === "heal") return { min: 0, max: 4, default: 3 };
  // Debuffs read like cast skills regardless of class identity.
  if (t === "debuff") return { min: 2, max: 4, default: 3 };
  // Copy skills (Shōuei) — short cast.
  if (t === "copy") return { min: 0, max: 4, default: 3 };

  // Damage skills follow class range identity, with element nudges:
  let { min, max } = baseTier;

  // AoE skills sit one tier shorter (you stand inside the burst).
  if (skill.aoe) { min = Math.max(1, min - 1); max = Math.max(min, max - 1); }

  // Element overrides — tiny conservative nudges only.
  const el = skill.el;
  if (el === "Wind" || el === "Lightning") max = Math.max(max, baseTier.max + 1);
  if (el === "Earth" || el === "Metal") { min = Math.max(1, min - 1); max = Math.max(min, max - 1); }

  const def = Math.max(min, Math.min(max, Math.round((min + max) / 2)));
  return { min, max, default: def };
}

// Infer the default shape for a generated skill given its type/aoe/element
// and the class's preferred shape. Returns one of:
//   single | line | cone | burst | aura | zone | self
export function inferSkillShape(skill, classId) {
  if (!skill) return "single";
  const t = skill.t;
  if (t === "buff") return "self";
  if (t === "heal") return skill.aoe ? "aura" : "single";
  if (t === "debuff") return "single";
  if (t === "copy") return "single";

  // Damage:
  if (skill.aoe) {
    const role = CLASS_ROLES[classId];
    return (role && role.preferredShape) || "burst";
  }
  // Single-target damage — element gives a tiny shape hint for the chip strip.
  if (skill.el === "Lightning" || skill.el === "Light") return "line";
  if (skill.el === "Wind" || skill.el === "Sound") return "cone";
  return "single";
}

// Pure derive: returns the canonical combat-meta tags for a skill WITHOUT
// mutating it. Safe to call from React render. Existing explicit fields on
// the skill (including a deliberate 0 for `range`/`rangeMin`/`rangeMax`) are
// preserved in the returned object.
export function deriveSkillCombatMeta(skill, classId) {
  const out = {};
  if (!skill || typeof skill !== "object") {
    return { range: 1, rangeMin: 1, rangeMax: 1, shape: "single", targetType: "enemy" };
  }
  const r = inferSkillRange(skill, classId);
  out.range    = Number.isFinite(skill.range)    ? skill.range    : r.default;
  out.rangeMin = Number.isFinite(skill.rangeMin) ? skill.rangeMin : r.min;
  out.rangeMax = Number.isFinite(skill.rangeMax) ? skill.rangeMax : r.max;
  out.shape    = (typeof skill.shape === "string" && skill.shape) ? skill.shape : inferSkillShape(skill, classId);
  out.targetType = (typeof skill.targetType === "string" && skill.targetType)
    ? skill.targetType
    : ((skill.t === "buff" || skill.t === "heal") ? "ally" : "enemy");
  return out;
}

// Stamp range/shape onto a generated skill in place. Safe to call on any
// skill object — missing fields are defaulted, existing fields are preserved
// (including a deliberate `0` for any numeric field). Idempotent.
//
// IMPORTANT: do NOT call this from a React render path — call from skill
// generation (`mkSkills`) and battle entry only. For render-time display,
// use `deriveSkillCombatMeta` which does not mutate.
export function stampSkillCombatMeta(skill, classId) {
  if (!skill || typeof skill !== "object") return skill;
  const meta = deriveSkillCombatMeta(skill, classId);
  if (!Number.isFinite(skill.range))    skill.range    = meta.range;
  if (!Number.isFinite(skill.rangeMin)) skill.rangeMin = meta.rangeMin;
  if (!Number.isFinite(skill.rangeMax)) skill.rangeMax = meta.rangeMax;
  if (!(typeof skill.shape === "string" && skill.shape))           skill.shape      = meta.shape;
  if (!(typeof skill.targetType === "string" && skill.targetType)) skill.targetType = meta.targetType;
  return skill;
}

// Convenience: stamp every skill in an array.
export function stampSkillListCombatMeta(skills, classId) {
  if (!Array.isArray(skills)) return skills;
  for (const sk of skills) stampSkillCombatMeta(sk, classId);
  return skills;
}

// Short human label for a skill range — used by skill cards/tooltips.
// v94 — Standardized to Shattered Veil's player-facing range language:
// Self · Close Range · Mid Range · Long Range · Arena-Wide.
export function rangeLabel(skill) {
  if (!skill) return "";
  const r = Number.isFinite(skill.range) ? skill.range : null;
  if (r === null) return "";
  if (r === 0) return "Self";
  if (r <= 1) return "Close Range";
  if (r <= 4) return "Mid Range";
  if (r <= 7) return "Long Range";
  return "Arena-Wide";
}

// v94 — Public display helper for any skill/action object. Mirrors
// rangeLabel() but accepts a plain `range` number too. Use this in any
// new UI surface so player-facing range tags stay consistent.
export function getDisplayRangeTag(skillOrRange) {
  if (skillOrRange == null) return "";
  const r = typeof skillOrRange === "number"
    ? skillOrRange
    : (Number.isFinite(skillOrRange.range) ? skillOrRange.range : null);
  if (r === null) return "";
  if (r === 0) return "Self";
  if (r <= 1) return "Close Range";
  if (r <= 4) return "Mid Range";
  if (r <= 7) return "Long Range";
  return "Arena-Wide";
}

// Short human label for a shape — used by skill cards/tooltips.
export function shapeLabel(shape) {
  if (!shape) return "";
  return ({
    single: "Single", line: "Line", cone: "Cone", burst: "Burst",
    aura: "Aura", zone: "Zone", self: "Self", global: "Global"
  })[shape] || shape;
}
