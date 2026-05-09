// ─────────────────────────────────────────────────────────────────────────────
// Pass 10 — Derived Combat Stats
//
// Foundation layer for the new arena combat system. These helpers compute
// derived battle stats on top of the existing core stats (HP/MP/ATK/DEF/MAG/
// SPD/LCK) without changing the save shape.
//
// All formulas are TEMPORARY scaffolding — full balance pass comes in Pass 11
// (per-class identity, gear scaling, bloodmark integration). Each helper:
//   • takes (unit, ctx) where unit can be a player (with `.st`) or an enemy
//   • uses safe fallbacks if data is missing
//   • clamps output to a sane range so a malformed unit never crashes battle
//
// Re-exports `getFieldAttunement` from veilbreakChain so callers have one
// canonical import surface for derived combat stats.
// ─────────────────────────────────────────────────────────────────────────────

import { getFieldAttunement as _vbGetAttunement } from './arena/veilbreakChain.js';

// Safe stat read — accepts either { st: { atk, mag, ... } } (player projection)
// or a flat enemy { atk, mag, ... }. Falls back to provided default.
function _statOf(unit, key, fallback = 0) {
  if (!unit) return fallback;
  if (unit.st && Number.isFinite(unit.st[key])) return unit.st[key];
  if (Number.isFinite(unit[key])) return unit[key];
  return fallback;
}

// Crit Rate — 0..1. Base 5% + LCK + armor + Veilflare Focus + passive/terrain.
// TODO Pass 11: per-class crit specialization (Monk crit identity), gear
// `critRate` field, terrain-derived crit bonuses on hallowed/charged tiles.
export function getCritChance(unit, ctx = {}) {
  const lck = _statOf(unit, 'lck', 0);
  const base = 0.05;
  const luck = Math.min(0.25, lck * 0.012);
  const armor = ctx.armorCritChance || 0;
  const focus = ctx.hasVeilflareFocus ? 0.10 : 0;
  const passive = ctx.passiveCritBonus || 0;
  const terrain = ctx.terrainCritBonus || 0;
  return Math.max(0, Math.min(0.6, base + luck + armor + focus + passive + terrain));
}

// Crit Damage — multiplier (1.5..3.5). Base 1.5x + armor + tiny ATK/LCK scaling.
// TODO Pass 11: gear `critDamage` field, crit-on-status passives.
export function getCritDamageMultiplier(unit, ctx = {}) {
  const atk = _statOf(unit, 'atk', 0);
  const lck = _statOf(unit, 'lck', 0);
  const armor = ctx.armorCritDmgBoost || 0;
  const stat = Math.min(0.20, atk * 0.0008 + lck * 0.0012);
  return Math.max(1.5, Math.min(3.5, 1.5 + armor + stat));
}

// Accuracy — 0.30..1.00. Base 90% + small SPD/LCK; reduced by target Blind.
// TODO Pass 11: per-skill accuracy override, ranged vs melee distinction.
export function getAccuracy(unit, ctx = {}) {
  const spd = _statOf(unit, 'spd', 0);
  const lck = _statOf(unit, 'lck', 0);
  const blindPen = ctx.targetBlind ? -0.30 : 0;
  return Math.max(0.30, Math.min(1.0, 0.90 + Math.min(0.10, spd * 0.003) + Math.min(0.05, lck * 0.002) + blindPen));
}

// Evasion — 0..0.40. Base small + SPD/LCK + passive.
// TODO Pass 11: Silkweb covenant evasion bonus, Wind affinity bonus.
export function getEvasion(unit, ctx = {}) {
  const spd = _statOf(unit, 'spd', 0);
  const lck = _statOf(unit, 'lck', 0);
  const passive = ctx.passiveEvasion || 0;
  return Math.max(0, Math.min(0.40, 0.02 + spd * 0.003 + lck * 0.002 + passive));
}

// Move — 1..7 tiles per turn. Base 3 + SPD scaling, slow/haste modifiers.
// TODO Pass 11: per-class movement identity (rogue/scout +move, tank -move).
export function getMoveStat(unit, ctx = {}) {
  const spd = _statOf(unit, 'spd', 0);
  let m = 3 + Math.floor(spd / 30);
  if (ctx.slowed) m = Math.max(1, m - 1);
  if (ctx.haste) m = m + 1;
  return Math.max(1, Math.min(7, m));
}

// Field Attunement — re-export the Pass 8 helper so callers have one surface.
export function getFieldAttunement(unit, ctx = {}) {
  try { return _vbGetAttunement(unit, ctx); } catch (_e) { return 5; }
}

// Status Power — 0..0.35. Bonus to status-application chance.
// TODO Pass 11: per-class status identity (Controller bonus), gear scaling.
export function getStatusPower(unit, ctx = {}) {
  const mag = _statOf(unit, 'mag', 0);
  const lck = _statOf(unit, 'lck', 0);
  return Math.max(0, Math.min(0.35, mag * 0.004 + lck * 0.003));
}

// Status Resist — 0..0.65. Reduces incoming status chance. Bosses get +0.15.
// TODO Pass 11: per-status resist profiles (boss immune to stun, etc).
export function getStatusResist(unit, ctx = {}) {
  const def = _statOf(unit, 'def', 0);
  const mag = _statOf(unit, 'mag', 0);
  const lvl = _statOf(unit, 'level', _statOf(unit, 'lvl', 1));
  let r = def * 0.002 + mag * 0.0015 + Math.min(0.10, lvl * 0.003);
  if (ctx.isBoss || unit?.boss) r += 0.15;
  return Math.max(0, Math.min(0.65, r));
}

// Guard Strength — flat damage-mitigation value. Used by Guard / Brace.
// TODO Pass 11: per-class guard identity (tanks scale much higher).
export function getGuardStrength(unit, _ctx = {}) {
  const def = _statOf(unit, 'def', 0);
  const atk = _statOf(unit, 'atk', 0);
  const mag = _statOf(unit, 'mag', 0);
  return Math.max(0, def * 0.5 + Math.max(atk, mag) * 0.15);
}

// Healing Power — flat amount added to base heal.
// TODO Pass 11: per-class support identity, gear `healPower` field.
export function getHealingPower(unit, _ctx = {}) {
  const mag = _statOf(unit, 'mag', 0);
  const lck = _statOf(unit, 'lck', 0);
  return Math.max(0, mag * 0.6 + lck * 0.2);
}

// Veil Generation modifier — multiplier on Veilbreak charge gain.
// TODO Pass 11: covenant/passive bonuses, field-tile generation rate.
export function getVeilGenerationModifier(unit, _ctx = {}) {
  const mag = _statOf(unit, 'mag', 0);
  const lck = _statOf(unit, 'lck', 0);
  return Math.max(0.5, Math.min(2.0, 1.0 + mag * 0.003 + lck * 0.002));
}

// Bundle helper — useful for the Combat Profile UI strip.
export function getDerivedCombatStats(unit, ctx = {}) {
  return {
    critRate: getCritChance(unit, ctx),
    critDamage: getCritDamageMultiplier(unit, ctx),
    accuracy: getAccuracy(unit, ctx),
    evasion: getEvasion(unit, ctx),
    move: getMoveStat(unit, ctx),
    fieldAttunement: getFieldAttunement(unit, ctx),
    statusPower: getStatusPower(unit, ctx),
    statusResist: getStatusResist(unit, ctx),
    guardStrength: getGuardStrength(unit, ctx),
    healingPower: getHealingPower(unit, ctx),
    veilGenMod: getVeilGenerationModifier(unit, ctx),
  };
}

// One-shot crit roll convenience.
export function rollCrit(unit, ctx = {}) {
  return Math.random() < getCritChance(unit, ctx);
}

// Short, player-friendly tooltip strings for the Stats screen.
export const DERIVED_STAT_TOOLTIPS = {
  critRate:        'Crit Rate — chance for an enhanced strike. Built from LCK, gear, and Veilflare Focus.',
  critDamage:      'Crit Damage — multiplier on a critical hit. Built from base 1.5x + ATK/LCK + gear.',
  accuracy:        'Accuracy — chance your attacks connect. Reduced when targets carry Blind.',
  evasion:         'Evasion — chance to dodge incoming attacks. Built from SPD/LCK + passives.',
  move:            'Move — tiles you can travel per turn on the arena board.',
  fieldAttunement: 'Field Attunement — strength in Veilbreak field clashes. Higher wins the clash.',
  statusPower:     'Status Power — improves the chance and potency of effects you apply.',
  statusResist:    'Status Resist — reduces the chance enemy effects land on you. Bosses naturally have more.',
  guardStrength:   'Guard Strength — how much damage your Guard / Brace mitigates.',
  healingPower:    'Healing Power — bonus added to heals you cast.',
  veilGenMod:      'Veil Generation — multiplier on Veilbreak charge gained from your actions.',
};
