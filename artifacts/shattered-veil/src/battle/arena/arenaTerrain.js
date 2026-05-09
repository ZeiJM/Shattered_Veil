// ─────────────────────────────────────────────────────────────────────────
// BIG ARENA — TERRAIN BONUSES (Pass 6)
// ─────────────────────────────────────────────────────────────────────────
// Pure data + helpers. NO React, NO imports from Game.jsx, NO mutation of
// any battle state. Callers pass primitives in and get primitives out.
//
// Keep all bonuses MODEST and READABLE (5–10% range). Each bonus also
// carries a flavor name (e.g. "Ember Vein") and short log lines so we can
// show clear feedback when the bonus actually triggers.
//
// Soft-enforced: damage math, save shape, character creation, world map,
// towns, succession, chat, and the backend remain unchanged. If any helper
// receives malformed data it returns a safe no-op.
// ─────────────────────────────────────────────────────────────────────────

import { TERRAIN } from "./arenaMaps.js";

// ── Element helpers (defensive: never throw) ─────────────────────────────
const lc = (s) => String(s == null ? "" : s).toLowerCase();
const inSet = (val, set) => !!val && set.has(lc(val));

const FIRE_ELS    = new Set(["fire", "flame", "ember", "phoenix"]);
const NATURE_ELS  = new Set(["wood", "nature", "plant", "leaf"]);
const WATER_ELS   = new Set(["water", "ice", "tide", "frost"]);
const EARTH_ELS   = new Set(["earth", "stone", "metal", "iron", "sand"]);
const LIGHTNING_ELS = new Set(["lightning", "thunder", "spark", "storm"]);
const SOUND_ELS   = new Set(["sound", "echo", "song"]);
const HOLY_ELS    = new Set(["light", "holy", "divine"]);
const DARK_ELS    = new Set(["dark", "shadow", "void", "abyss", "curse"]);
const PHYSICAL_ELS = new Set(["physical", "null"]); // Strikes default here.
const SUPPORT_FX  = new Set(["regen","shield","fortify","haste","empower","barrier","evasion","reflect","nullify","thorns","heal"]);
const CURSE_FX    = new Set(["curse","poison","bleed","weaken","expose","silence","sleep","blind","stun"]);

// Class buckets used for soft class affinity. The Game.jsx skill catalog
// keys classes by short ids (e.g. "monk","priest","mage","rune"...). We
// only group LOOSELY here — no exhaustive matrix, more buckets in later
// passes.
const PHYSICAL_CLASS_IDS = new Set(["monk","fight","samurai","gladiator","blade","ronin","fist","warrior","gravity","rune","puppet"]);
const CASTER_CLASS_IDS   = new Set(["mage","sorcerer","arcane","sound","witch","summoner","element","puppet"]);
const SUPPORT_CLASS_IDS  = new Set(["priest","healer","cleric","bard","druid"]);

// ── Public reflection helpers ────────────────────────────────────────────

// Coarse archetype: "physical" | "caster" | "support" | "hybrid" | null.
// SAFE: returns null when unit / class id is missing.
export function getUnitClassAffinity(unit) {
  if (!unit) return null;
  const cid = lc(unit.cid || unit.cl || unit.classId || "");
  if (!cid) return null;
  const phys = PHYSICAL_CLASS_IDS.has(cid);
  const cast = CASTER_CLASS_IDS.has(cid);
  const supp = SUPPORT_CLASS_IDS.has(cid);
  if (phys && cast) return "hybrid";
  if (phys) return "physical";
  if (cast) return "caster";
  if (supp) return "support";
  return null;
}

// Returns a flat array of element strings (lowercased) the unit is
// "natively aligned" with. Reads multiple optional fields with safe
// fallbacks. Never throws.
export function getUnitElementAffinity(unit) {
  if (!unit) return [];
  const out = [];
  const push = (v) => { const s = lc(v); if (s && s !== "null" && !out.includes(s)) out.push(s); };
  push(unit.el);
  push(unit.el2);
  push(unit.tempBattleEl);
  push(unit.tempBattleEl2);
  (unit.tempBonusEls || []).forEach(push);
  (unit.bonusEls || []).forEach(push);
  return out;
}

export function getSkillElementAffinity(skill) {
  if (!skill) return "";
  return lc(skill.el || skill.element || "");
}

// ── Bonus catalogue ──────────────────────────────────────────────────────
// One entry per terrain key that has an implemented bonus. Terrain keys
// not listed here are tooltip-only / visual-only and pass through cleanly.
//
// Field meanings:
//   flavor     — display name (e.g. "Ember Vein")
//   tagline    — single-line tooltip used by ArenaBoard
//   logFlavor  — flavorful battle-log line played when the bonus triggers
//   logResult  — short mechanical line (kept terse to avoid log spam)
//   benefits   — readable "who benefits" string for tooltips
//   bonusType  — "dmgMult" | "healMult" | "critAdd" | "veilExtra" | "hpCost" | "tooltipOnly"
//   bonusValue — number (multiplier delta, additive crit %, flat veil chain steps, etc.)
//   triggerTiming — "damage" | "heal" | "veilGain" | "tooltip"
//   matches    — function (caster, action, ctx) => bool, the gate
//   riskEffect — short string describing the risk (or null)
//   rarity     — "common" | "uncommon" | "rare"
// ─────────────────────────────────────────────────────────────────────────
export const TERRAIN_BONUSES = {
  scorched: {
    flavor: "Ember Vein",
    tagline: "Fire skills smoulder hotter underfoot.",
    logFlavor: (n) => "🔥 The Ember Vein flared beneath " + n + ".",
    logResult: "Fire damage increased slightly.",
    benefits: "Fire skills (+8% damage)",
    bonusType: "dmgMult", bonusValue: 1.08,
    triggerTiming: "damage", rarity: "rare",
    matches: (caster, action) => action && action.kind === "skill" && inSet(action.el, FIRE_ELS),
    riskEffect: null,
  },
  forest: {
    flavor: "Verdant Pulse",
    tagline: "Quiet sap-light. Healing finds deeper roots here.",
    logFlavor: (n) => "🌿 The Verdant Pulse answered " + n + "'s mending.",
    logResult: "Healing increased slightly.",
    benefits: "Heal/support skills (+8% healing)",
    bonusType: "healMult", bonusValue: 1.08,
    triggerTiming: "heal", rarity: "rare",
    matches: (caster, action) => action && (action.kind === "heal" || (action.kind === "skill" && inSet(action.skillType, new Set(["heal"])))),
    riskEffect: null,
  },
  water: {
    flavor: "Stillwater Mirror",
    tagline: "Reflective stillness — Lightning skills crack sharper here.",
    logFlavor: (n) => "💧 The Stillwater Mirror amplified " + n + "'s spark.",
    logResult: "Lightning damage increased slightly.",
    benefits: "Lightning skills (+6% damage)",
    bonusType: "dmgMult", bonusValue: 1.06,
    triggerTiming: "damage", rarity: "common",
    matches: (caster, action) => action && action.kind === "skill" && inSet(action.el, LIGHTNING_ELS),
    riskEffect: null,
  },
  stone: {
    flavor: "Runed Flagstone",
    tagline: "Old runic seams. Earth and Metal techniques root well.",
    logFlavor: (n) => "⛰ The Runed Flagstone steadied " + n + "'s strike.",
    logResult: "Earth/Metal damage increased slightly.",
    benefits: "Earth/Metal skills (+6% damage)",
    bonusType: "dmgMult", bonusValue: 1.06,
    triggerTiming: "damage", rarity: "common",
    matches: (caster, action) => action && action.kind === "skill" && inSet(action.el, EARTH_ELS),
    riskEffect: null,
  },
  highGround: {
    flavor: "Moonlit Crest",
    tagline: "A raised vantage. Ranged techniques find sharper lines.",
    logFlavor: (n) => "🌙 The Moonlit Crest sharpened " + n + "'s reach.",
    logResult: "Ranged damage increased slightly.",
    benefits: "Ranged skills (+5% damage)",
    bonusType: "dmgMult", bonusValue: 1.05,
    triggerTiming: "damage", rarity: "uncommon",
    matches: (caster, action) => action && action.kind === "skill" && Number.isFinite(action.range) && action.range >= 4,
    riskEffect: null,
  },
  brokenVeil: {
    flavor: "Broken Veil Font",
    tagline: "The Veil thins. Veil Magic surges into the chain.",
    logFlavor: (n) => "✦ Broken Veil light surged into " + n + "'s chain.",
    logResult: "Veil chain advanced an extra step.",
    benefits: "Veil Magic skills (chain +1 on cast)",
    bonusType: "veilExtra", bonusValue: 1,
    triggerTiming: "veilGain", rarity: "rare",
    matches: (caster, action) => action && action.kind === "skill",
    riskEffect: null,
  },
  hallowed: {
    flavor: "Hallowed Ring",
    tagline: "Old prayer-marks. Restoration blooms stronger here.",
    logFlavor: (n) => "✧ The Hallowed Ring strengthened " + n + "'s recovery.",
    logResult: "Healing increased slightly.",
    benefits: "Heal/support skills (+8% healing)",
    bonusType: "healMult", bonusValue: 1.08,
    triggerTiming: "heal", rarity: "rare",
    matches: (caster, action) => action && (action.kind === "heal" || (action.kind === "skill" && inSet(action.skillType, new Set(["heal"])))),
    riskEffect: null,
  },
  shadowed: {
    flavor: "Shadowed Seal",
    tagline: "Light is reluctant. Dark and Void resonate here.",
    logFlavor: (n) => "🌑 The Shadowed Seal deepened " + n + "'s shadow.",
    logResult: "Dark/Void damage increased slightly.",
    benefits: "Dark/Void skills (+8% damage)",
    bonusType: "dmgMult", bonusValue: 1.08,
    triggerTiming: "damage", rarity: "uncommon",
    matches: (caster, action) => action && action.kind === "skill" && inSet(action.el, DARK_ELS),
    riskEffect: null,
  },
  stormcharged: {
    flavor: "Storm Sigil",
    tagline: "Static crackles in the air. Lightning skills find the edge.",
    logFlavor: (n) => "⚡ The Storm Sigil sharpened " + n + "'s strike.",
    logResult: "Critical chance briefly raised.",
    benefits: "Lightning/Sound skills (+6% crit chance)",
    bonusType: "critAdd", bonusValue: 0.06,
    triggerTiming: "damage", rarity: "rare",
    matches: (caster, action) => action && action.kind === "skill" && (inSet(action.el, LIGHTNING_ELS) || inSet(action.el, SOUND_ELS)),
    riskEffect: null,
  },
  gravityWell: {
    flavor: "Gravity Well",
    tagline: "Heavier than it looks. Movement is reluctant here.",
    logFlavor: null, // tooltip-only this pass
    logResult: null,
    benefits: "Movement (+1 step cost — already enforced)",
    bonusType: "tooltipOnly", bonusValue: 0,
    triggerTiming: "tooltip", rarity: "rare",
    matches: () => false,
    riskEffect: "Movement reluctant. Already costs +1.",
    // TODO Pass 7+: enemy AI seeking gravity wells; movement-skill knockback interactions.
  },
  bloodstone: {
    flavor: "Bloodstone Scar",
    tagline: "Drinks the wounded. Physical attacks bite deeper at a price.",
    logFlavor: (n) => "🩸 Bloodstone answered " + n + " with power and pain.",
    logResult: "Physical damage increased — caster paid in blood.",
    benefits: "Physical strikes (+8% damage, lose 2 HP)",
    bonusType: "dmgMult", bonusValue: 1.08,
    triggerTiming: "damage", rarity: "rare",
    matches: (caster, action) => action && action.kind === "strike" && inSet(action.el || "Null", PHYSICAL_ELS),
    riskEffect: "Caster pays 2 HP per triggered strike (cannot reduce HP below 1).",
    // Implemented as a separate hpCost helper below.
  },
};

// Terrain keys that have an implemented bonus (used by visual layer to
// add the rare-bonus glow class without lighting up tooltip-only tiles).
export const ACTIVE_BONUS_TERRAINS = Object.keys(TERRAIN_BONUSES).filter(
  k => TERRAIN_BONUSES[k].bonusType !== "tooltipOnly"
);

// ── Lookup helpers ───────────────────────────────────────────────────────

// Resolve the terrain key under a given tile. Safe-defaults to "normal".
export function getTerrainKeyAt(arenaState, x, y) {
  if (!arenaState || !arenaState.terrainMap) return "normal";
  return arenaState.terrainMap[x + "," + y] || "normal";
}

// Returns the bonus def (catalogue entry) for a terrain key, or null.
export function getTerrainBonusDef(terrainKey) {
  if (!terrainKey) return null;
  return TERRAIN_BONUSES[terrainKey] || null;
}

// Returns the TERRAIN catalogue entry for a key, or the "normal" fallback.
export function getTerrainInfo(terrainKey) {
  if (!terrainKey) return TERRAIN.normal;
  return TERRAIN[terrainKey] || TERRAIN.normal;
}

// ── Action descriptors ───────────────────────────────────────────────────
// Callers build a tiny `action` object and pass it to the matchers.
// This keeps the helper agnostic of Game.jsx skill shape.
//
// Recognised shape:
//   { kind: "skill"|"strike"|"heal"|"copy"|"ult", el, skillType, range }
// ─────────────────────────────────────────────────────────────────────────
export function describeActionFromSkill(skill, opts = {}) {
  if (!skill) return null;
  return {
    kind: opts.kind || "skill",
    el: skill.el || "",
    skillType: skill.t || "",
    range: Number.isFinite(opts.range) ? opts.range : null,
  };
}

export function describeActionFromStrike(weapon) {
  return {
    kind: "strike",
    el: (weapon && weapon.el) || "Null",
    skillType: "strike",
    range: 1,
  };
}

// ── Match resolution ─────────────────────────────────────────────────────
// Returns the bonus def IF it currently applies to (caster, action) on the
// given terrain. Always returns null when defeated, missing, or unmatched.
export function getTerrainBonusForUnit(unit, terrainKey, action) {
  if (!unit || !terrainKey) return null;
  // Defeated units never trigger.
  if (Number.isFinite(unit.hp) && unit.hp <= 0) return null;
  if (Number.isFinite(unit.chp) && unit.chp <= 0) return null;
  const def = getTerrainBonusDef(terrainKey);
  if (!def || def.bonusType === "tooltipOnly") return null;
  try {
    return def.matches(unit, action) ? def : null;
  } catch (e) {
    return null;
  }
}

// Same as above but specialised for skill casts. Convenience pass-through.
export function getTerrainBonusForSkill(skill, caster, terrainKey, ctx = {}) {
  return getTerrainBonusForUnit(caster, terrainKey, describeActionFromSkill(skill, ctx));
}

// Returns an array of (def) entries for all currently-relevant bonuses for
// a unit/action — currently always one or zero, but the shape leaves room
// for stacked bonuses in future passes.
export function getActiveTerrainBonusesFor(unit, terrainKey, action) {
  const def = getTerrainBonusForUnit(unit, terrainKey, action);
  return def ? [def] : [];
}

// ── Application helpers ──────────────────────────────────────────────────

// Hard clamp on what any single bonus can do — prevents accidental future
// data entry from breaking damage math.
const CLAMPS = {
  dmgMult:   { min: 0.85, max: 1.20 },
  healMult:  { min: 0.85, max: 1.20 },
  critAdd:   { min: 0.0,  max: 0.12 },
  veilExtra: { min: 0,    max: 1    },
  hpCost:    { min: 0,    max: 8    },
};

export function clampBonusValue(bonusType, value) {
  const c = CLAMPS[bonusType];
  if (!c || !Number.isFinite(value)) return value;
  return Math.max(c.min, Math.min(c.max, value));
}

// Pure preview: applies the bonus to a base value and returns the new value.
// Used by tooltips/UI to show what would happen.
export function applyTerrainBonusPreview(baseValue, bonus) {
  if (!Number.isFinite(baseValue) || !bonus) return baseValue;
  const v = clampBonusValue(bonus.bonusType, bonus.bonusValue);
  if (bonus.bonusType === "dmgMult" || bonus.bonusType === "healMult") return baseValue * v;
  if (bonus.bonusType === "critAdd") return baseValue + v;
  return baseValue;
}

// In-place-safe action result transform. Returns a NEW object when the
// bonus changes anything, otherwise the same reference. The caller is
// responsible for mutating np.chp etc. — this helper only computes.
//
// Recognised actionResult fields:
//   { damage, heal, critChance, veilExtra, hpCost }
export function applyTerrainBonusToAction(actionResult, bonus) {
  if (!actionResult || !bonus) return actionResult;
  const v = clampBonusValue(bonus.bonusType, bonus.bonusValue);
  switch (bonus.bonusType) {
    case "dmgMult":
      if (!Number.isFinite(actionResult.damage)) return actionResult;
      return { ...actionResult, damage: Math.max(1, Math.floor(actionResult.damage * v)) };
    case "healMult":
      if (!Number.isFinite(actionResult.heal)) return actionResult;
      return { ...actionResult, heal: Math.max(1, Math.floor(actionResult.heal * v)) };
    case "critAdd":
      return { ...actionResult, critChance: Math.min(0.95, (actionResult.critChance || 0) + v) };
    case "veilExtra":
      return { ...actionResult, veilExtra: (actionResult.veilExtra || 0) + v };
    case "hpCost":
      return { ...actionResult, hpCost: (actionResult.hpCost || 0) + v };
    default:
      return actionResult;
  }
}

// ── Display helpers ──────────────────────────────────────────────────────

// Short tooltip line: "Ember Vein: Fire skills gain +8% damage here."
export function describeTerrainBonus(bonus) {
  if (!bonus) return "";
  const v = clampBonusValue(bonus.bonusType, bonus.bonusValue);
  let mech = "";
  if (bonus.bonusType === "dmgMult")  mech = "+" + Math.round((v - 1) * 100) + "% damage";
  else if (bonus.bonusType === "healMult") mech = "+" + Math.round((v - 1) * 100) + "% healing";
  else if (bonus.bonusType === "critAdd")  mech = "+" + Math.round(v * 100) + "% crit";
  else if (bonus.bonusType === "veilExtra") mech = "+" + v + " Veil chain step";
  else if (bonus.bonusType === "hpCost")    mech = "−" + v + " HP risk";
  return bonus.flavor + ": " + (bonus.tagline || "") + (mech ? " (" + mech + ")" : "");
}

// Returns true if there's any currently-implemented bonus on this tile,
// regardless of who could benefit. Useful for the visual rare-bonus glow.
export function tileHasActiveBonus(arenaState, x, y) {
  const k = getTerrainKeyAt(arenaState, x, y);
  const def = getTerrainBonusDef(k);
  return !!(def && def.bonusType !== "tooltipOnly");
}

// ─────────────────────────────────────────────────────────────────────────
// FUTURE TODOs (do not implement in this pass):
//  - Enemy AI seeking terrain advantage tiles.
//  - Boss-specific arenas with scripted rare tiles.
//  - Veilbreak ult activation creating temporary terrain zones.
//  - Field Clash splitting arena terrain by ownership.
//  - Full class-affinity matrix per CLS entry (currently coarse buckets).
//  - Full element-reaction matrix (Fire+Water synergies, etc).
//  - Status-effect interactions on rare tiles (e.g. Bloodstone amplifies Bleed).
//  - Destructible-object interactions (e.g. shattered Pillar leaves Bloodstone).
//  - Tutorial / Codex page documenting all terrain bonuses.
//  - Re-tuning bonus values after the next class/skill rebalance pass.
// ─────────────────────────────────────────────────────────────────────────
