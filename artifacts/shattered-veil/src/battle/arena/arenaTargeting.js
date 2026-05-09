// ─────────────────────────────────────────────────────────────────────────
// BIG ARENA — TARGETING + RANGE LAYER (Pass 4, additive only)
// ─────────────────────────────────────────────────────────────────────────
// Pure functions only. No React, no global state, no calls into Game.jsx.
// Existing skills do not yet carry range/shape metadata — these helpers
// INFER safe defaults from the existing fields ({t, el, aoe, fx, pow, mp}).
// Combat math, damage formulas, and existing battle flow stay untouched
// in this pass. Targeting is soft-enforced (visual + safe gate) only.
// ─────────────────────────────────────────────────────────────────────────

import { OBJECTS, TERRAIN } from "./arenaMaps.js";

const inBounds = (arena, x, y) =>
  x >= 0 && y >= 0 && x < arena.cols && y < arena.rows && arena.shape[y] && arena.shape[y][x] === 1;
const keyOf = (x, y) => x + "," + y;
const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0);

// ── Default metadata shape ──────────────────────────────────────────────
// {
//   range: number,                    // Manhattan tiles from caster
//   shape: 'single'|'line'|'cone'|'burst'|'self'|'aura'|'zone'|'global',
//   radius: number,                   // for burst / aura / zone / cone width
//   targetType: 'enemy'|'ally'|'self'|'tile'|'emptyTile'|'object'|'any',
//   requiresLineOfSight: boolean,
//   canTargetObjects: boolean,
//   terrainInteraction: string|null,
//   needsTarget: boolean,             // false for self/aura/global → no aim step
// }
export const DEFAULT_SKILL_META = Object.freeze({
  range: 4,
  shape: "single",
  radius: 0,
  targetType: "enemy",
  requiresLineOfSight: false,
  canTargetObjects: false,
  terrainInteraction: null,
  needsTarget: true,
});

// Heal / regen verb sniff used to retag heal-flagged buffs.
const HEAL_NAME_RX = /(heal|mend|restore|salve|balm|renewal|recovery|rejuven|grace|cleans|hymn|prayer)/i;
const SUPPORT_NAME_RX = /(ward|aegis|aura|mantle|bolster|focus|surge|rally|barrier|shield|shroud|bulwark)/i;

// ── Skill → metadata inference ──────────────────────────────────────────
// `skill` is the existing skill object: { n, el, t, pow, mp, fx, fx2, aoe, ... }
// `actor` is optional — used to widen range for high-MAG ranged casters.
export function getSkillMeta(skill, actor = null) {
  if (!skill) return { ...DEFAULT_SKILL_META };
  const n = String(skill.n || skill.name || "").trim();
  const t = skill.t || skill.kind || "damage";
  const el = skill.el || "Null";
  const aoe = !!skill.aoe;
  const elemental = el && el !== "Null" && el !== "Physical";

  // Heal / regen ─ ally-target single OR small burst.
  if (t === "heal" || HEAL_NAME_RX.test(n)) {
    return {
      ...DEFAULT_SKILL_META,
      range: 4,
      shape: aoe ? "burst" : "single",
      radius: aoe ? 1 : 0,
      targetType: aoe ? "ally" : "ally",
      requiresLineOfSight: false,
      canTargetObjects: false,
      needsTarget: !aoe, // aoe heal centers on caster
    };
  }

  // Self buff (Guard-like) ─ no target required.
  if (t === "buff") {
    const auraLike = aoe || /aura|mantle|hymn|aegis/i.test(n);
    return {
      ...DEFAULT_SKILL_META,
      range: 0,
      shape: auraLike ? "aura" : "self",
      radius: auraLike ? 1 : 0,
      targetType: "self",
      requiresLineOfSight: false,
      canTargetObjects: false,
      needsTarget: false,
    };
  }

  // Debuff / curse / hex ─ usually single target enemy at projectile range.
  if (t === "debuff") {
    return {
      ...DEFAULT_SKILL_META,
      range: 5,
      shape: aoe ? "burst" : "single",
      radius: aoe ? 1 : 0,
      targetType: "enemy",
      requiresLineOfSight: false,
      canTargetObjects: false,
      needsTarget: !aoe || true, // aoe debuff still wants a center
    };
  }

  // Mirror / Copy ─ requires touching an enemy skill to copy.
  if (t === "copy") {
    return {
      ...DEFAULT_SKILL_META,
      range: 4,
      shape: "single",
      radius: 0,
      targetType: "enemy",
      requiresLineOfSight: false,
      canTargetObjects: false,
      needsTarget: true,
    };
  }

  // Damage skills ─ infer shape from name + aoe flag.
  if (t === "damage") {
    if (aoe) {
      const ringy = /nova|ring|wave|pulse|expand/i.test(n);
      const liney = /lance|beam|line|bolt|pierce|arrow|bullet|ray/i.test(n);
      const coney = /cone|fan|gust|spray|breath|sweep|cleave/i.test(n);
      if (liney) return { ...DEFAULT_SKILL_META, range: 5, shape: "line", radius: 5, targetType: "tile", canTargetObjects: true, requiresLineOfSight: true };
      if (coney) return { ...DEFAULT_SKILL_META, range: 3, shape: "cone", radius: 3, targetType: "tile", canTargetObjects: true, requiresLineOfSight: false };
      return { ...DEFAULT_SKILL_META, range: 4, shape: "burst", radius: ringy ? 2 : 1, targetType: "tile", canTargetObjects: true, requiresLineOfSight: false };
    }
    // Single-target damage. Elemental → projectile reach 5; physical/Null → adjacent 1.
    return {
      ...DEFAULT_SKILL_META,
      range: elemental ? 5 : 1,
      shape: "single",
      radius: 0,
      targetType: "enemy",
      requiresLineOfSight: elemental,
      canTargetObjects: true,
      needsTarget: true,
    };
  }

  // Unknown skill — conservative single-target default.
  return { ...DEFAULT_SKILL_META };
}

// Veilbreak / ult ─ visual-only this pass, treated as global.
export function getUltMeta() {
  return { ...DEFAULT_SKILL_META, range: 99, shape: "global", radius: 99, targetType: "any", requiresLineOfSight: false, needsTarget: false };
}

// Strike / weapon meta from current weapon shape.
export function getStrikeMeta(weapon) {
  if (!weapon) return { ...DEFAULT_SKILL_META, range: 1, shape: "single", radius: 0, targetType: "enemy", requiresLineOfSight: false, canTargetObjects: true, needsTarget: true };
  const elemental = weapon.el && weapon.el !== "Null" && weapon.el !== "Physical";
  return {
    ...DEFAULT_SKILL_META,
    range: elemental ? 4 : 1,
    shape: "single",
    radius: 0,
    targetType: "enemy",
    requiresLineOfSight: elemental,
    canTargetObjects: true,
    needsTarget: true,
  };
}

// Top-level resolver. `ctx` carries the action being aimed:
// { act: 'strike'|'w2'|'skill'|'copy'|'ult'|'mend'|'guard'|'flee'|...,
//   skill?: object, weapon?: object, ult?: object, copied?: object, actor?: object }
export function getActionMeta(ctx = {}) {
  const { act, skill, weapon, ult, copied, actor } = ctx;
  if (act === "strike" || act === "w2") return getStrikeMeta(weapon);
  if (act === "skill") return getSkillMeta(skill, actor);
  if (act === "copy") return getSkillMeta(copied || { t: "copy" }, actor);
  if (act === "ult") return getUltMeta(ult);
  if (act === "guard") return { ...DEFAULT_SKILL_META, range: 0, shape: "self", radius: 0, targetType: "self", needsTarget: false };
  if (act === "mend") return { ...DEFAULT_SKILL_META, range: 0, shape: "self", radius: 0, targetType: "self", needsTarget: false };
  return { ...DEFAULT_SKILL_META };
}

// ── Geometry primitives (all return [{x,y,...}]) ────────────────────────
export function getTilesInRange(origin, range, arena) {
  if (!origin || !arena || !Number.isFinite(range) || range <= 0) return [];
  const out = [];
  for (let y = origin.y - range; y <= origin.y + range; y++) {
    for (let x = origin.x - range; x <= origin.x + range; x++) {
      if (!inBounds(arena, x, y)) continue;
      const md = Math.abs(x - origin.x) + Math.abs(y - origin.y);
      if (md > 0 && md <= range) out.push({ x, y, dist: md });
    }
  }
  return out;
}

export function getBurstTiles(center, radius, arena) {
  if (!center || !arena) return [];
  const r = Math.max(0, Math.floor(radius || 0));
  const out = [];
  for (let y = center.y - r; y <= center.y + r; y++) {
    for (let x = center.x - r; x <= center.x + r; x++) {
      if (!inBounds(arena, x, y)) continue;
      if (Math.abs(x - center.x) + Math.abs(y - center.y) <= r) out.push({ x, y });
    }
  }
  return out;
}

export function getAuraTiles(origin, radius, arena) {
  return getBurstTiles(origin, radius, arena);
}

export function getGlobalTiles(arena) {
  if (!arena) return [];
  const out = [];
  for (let y = 0; y < arena.rows; y++) {
    for (let x = 0; x < arena.cols; x++) if (inBounds(arena, x, y)) out.push({ x, y });
  }
  return out;
}

// Direction from origin toward target, normalized to a cardinal step.
function cardinalDirToward(origin, target) {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  if (Math.abs(dx) >= Math.abs(dy)) return { dx: sign(dx) || 1, dy: 0 };
  return { dx: 0, dy: sign(dy) || 1 };
}

export function getLineTiles(origin, target, range, arena) {
  if (!origin || !target || !arena) return [];
  const r = Math.max(1, Math.floor(range || 1));
  const dir = cardinalDirToward(origin, target);
  const out = [];
  for (let i = 1; i <= r; i++) {
    const x = origin.x + dir.dx * i;
    const y = origin.y + dir.dy * i;
    if (!inBounds(arena, x, y)) break;
    out.push({ x, y });
  }
  return out;
}

export function getConeTiles(origin, target, range, arena) {
  if (!origin || !target || !arena) return [];
  const r = Math.max(1, Math.floor(range || 1));
  const dir = cardinalDirToward(origin, target);
  const perp = { dx: dir.dy, dy: dir.dx };
  const out = [];
  for (let i = 1; i <= r; i++) {
    for (let s = -i; s <= i; s++) {
      const x = origin.x + dir.dx * i + perp.dx * s;
      const y = origin.y + dir.dy * i + perp.dy * s;
      if (inBounds(arena, x, y)) out.push({ x, y });
    }
  }
  return out;
}

// ── Line of sight (Bresenham over arena tiles) ──────────────────────────
// A tile blocks LoS if it carries an object with blocksLineOfSight = true.
// Origin and final target tiles are NEVER treated as blockers themselves.
export function hasLineOfSight(origin, target, arena) {
  if (!origin || !target || !arena) return true;
  if (origin.x === target.x && origin.y === target.y) return true;
  let x0 = origin.x, y0 = origin.y;
  const x1 = target.x, y1 = target.y;
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  // Walk between tiles; skip endpoints.
  // Safety bound is generous (3× the largest reasonable arena edge) but if
  // we ever exhaust it we fail CLOSED rather than open — better to grey out
  // a tile than to falsely promise sight through a wall.
  const maxSteps = (arena.cols + arena.rows) * 3;
  let safety = 0;
  while (safety++ < maxSteps) {
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 <  dx) { err += dx; y0 += sy; }
    if (x0 === x1 && y0 === y1) return true;
    if (!inBounds(arena, x0, y0)) return false;
    const o = arena.objectMap?.[keyOf(x0, y0)];
    if (o && OBJECTS[o.key]?.blocksLineOfSight) return false;
  }
  return false;
}

// ── Valid target tiles for a given skill cast ───────────────────────────
// Returns a list of { x, y, kind:'unit'|'object'|'tile', unit?, object? }.
// Soft-enforced: callers may still let players target out-of-range as a
// fallback if metadata is missing — see the safe-fallback note in Pass 4.
export function getValidTargetTiles(caster, meta, arenaState) {
  if (!caster || !meta || !arenaState) return [];
  const { range, targetType, requiresLineOfSight, canTargetObjects, shape, needsTarget } = meta;
  if (!needsTarget || shape === "self" || shape === "aura" || shape === "global") {
    return [{ x: caster.x, y: caster.y, kind: "self" }];
  }
  // Honour an explicit range:0 (means "caster's own tile only") instead of
  // forcing min 1 — keeps targeted self-cast actions correct.
  const reach = (range > 0)
    ? getTilesInRange(caster, range, arenaState)
    : [{ x: caster.x, y: caster.y, dist: 0 }];
  const units = arenaState.units || {};
  const enemiesById = units.enemies || {};
  const enemyKeys = new Map();
  Object.entries(enemiesById).forEach(([id, p]) => {
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) enemyKeys.set(keyOf(p.x, p.y), { id, pos: p });
  });
  const allyKeys = new Map();
  if (units.player) allyKeys.set(keyOf(units.player.x, units.player.y), { id: "player", pos: units.player });
  if (units.ally)   allyKeys.set(keyOf(units.ally.x,   units.ally.y),   { id: "ally",   pos: units.ally });
  if (units.pet)    allyKeys.set(keyOf(units.pet.x,    units.pet.y),    { id: "pet",    pos: units.pet });

  const out = [];
  reach.forEach(t => {
    const k = keyOf(t.x, t.y);
    const e = enemyKeys.get(k);
    const a = allyKeys.get(k);
    const obj = arenaState.objectMap?.[k];
    if (requiresLineOfSight && !hasLineOfSight(caster, t, arenaState)) return;
    if (targetType === "enemy" && e) out.push({ ...t, kind: "unit", unitKind: "enemy", id: e.id });
    else if (targetType === "ally" && a) out.push({ ...t, kind: "unit", unitKind: "ally", id: a.id });
    else if (targetType === "self") { /* handled above */ }
    else if (targetType === "tile") out.push({ ...t, kind: "tile" });
    else if (targetType === "emptyTile" && !e && !a && !obj) out.push({ ...t, kind: "emptyTile" });
    else if (targetType === "object" && obj) out.push({ ...t, kind: "object", object: obj });
    else if (targetType === "any") out.push({ ...t, kind: e ? "unit" : a ? "unit" : obj ? "object" : "tile", id: e?.id || a?.id });
    if (canTargetObjects && obj && targetType !== "object") {
      // also allow object collateral targeting in preview only
      out.push({ ...t, kind: "object", object: obj, secondary: true });
    }
  });
  return out;
}

// ── Affected tiles for a chosen target ──────────────────────────────────
export function getAffectedTiles(caster, target, meta, arenaState) {
  if (!caster || !meta || !arenaState) return [];
  if (!target) target = { x: caster.x, y: caster.y };
  const { shape, radius, range } = meta;
  if (shape === "self") return [{ x: caster.x, y: caster.y }];
  if (shape === "aura") return getAuraTiles(caster, Math.max(1, radius || 1), arenaState);
  if (shape === "global") return getGlobalTiles(arenaState);
  if (shape === "burst") return getBurstTiles(target, Math.max(0, radius || 0), arenaState);
  if (shape === "line")  return getLineTiles(caster, target, Math.max(1, range || 1), arenaState);
  if (shape === "cone")  return getConeTiles(caster, target, Math.max(1, range || 1), arenaState);
  if (shape === "zone")  return getBurstTiles(target, Math.max(1, radius || 1), arenaState);
  return [{ x: target.x, y: target.y }];
}

// ── Units on a set of affected tiles ────────────────────────────────────
export function getUnitsOnAffectedTiles(affectedTiles, arenaUnits) {
  if (!Array.isArray(affectedTiles) || !arenaUnits) return [];
  const tileSet = new Set(affectedTiles.map(t => keyOf(t.x, t.y)));
  const out = [];
  if (arenaUnits.player && tileSet.has(keyOf(arenaUnits.player.x, arenaUnits.player.y))) out.push({ kind: "player", id: "player", pos: arenaUnits.player });
  if (arenaUnits.ally && tileSet.has(keyOf(arenaUnits.ally.x, arenaUnits.ally.y)))       out.push({ kind: "ally",   id: "ally",   pos: arenaUnits.ally });
  if (arenaUnits.pet  && tileSet.has(keyOf(arenaUnits.pet.x,  arenaUnits.pet.y)))         out.push({ kind: "pet",    id: "pet",    pos: arenaUnits.pet });
  Object.entries(arenaUnits.enemies || {}).forEach(([id, p]) => {
    if (p && tileSet.has(keyOf(p.x, p.y))) out.push({ kind: "enemy", id, pos: p });
  });
  return out;
}

// ── LoS-blocked preview tiles (for highlighting "can't see" tiles) ──────
export function getLosBlockedTiles(caster, meta, arenaState) {
  if (!caster || !meta || !arenaState) return [];
  if (!meta.requiresLineOfSight) return [];
  const reach = getTilesInRange(caster, Math.max(1, meta.range || 1), arenaState);
  return reach.filter(t => !hasLineOfSight(caster, t, arenaState));
}

// ── Convenient label helpers for HUD badges ─────────────────────────────
export function describeShape(meta) {
  if (!meta) return "—";
  const r = Math.max(0, Math.floor(meta.radius || 0));
  switch (meta.shape) {
    case "single": return "Single";
    case "line":   return "Line " + (meta.range || r || 1);
    case "cone":   return "Cone " + (meta.range || r || 1);
    case "burst":  return "Burst " + r;
    case "aura":   return "Aura " + r;
    case "zone":   return "Zone " + r;
    case "self":   return "Self";
    case "global": return "Global";
    default:       return meta.shape || "—";
  }
}

export function describeTarget(meta) {
  if (!meta) return "—";
  switch (meta.targetType) {
    case "enemy":     return "Enemy";
    case "ally":      return "Ally";
    case "self":      return "Self";
    case "tile":      return "Tile";
    case "emptyTile": return "Empty Tile";
    case "object":    return "Object";
    case "any":       return "Any";
    default:          return meta.targetType || "—";
  }
}

// ─────────────────────────────────────────────────────────────────────────
// FUTURE TODOs (do not implement in this pass):
//   - Full skill-by-skill range balancing per class identity.
//   - Author skill metadata directly on each skill in mkSkills (drop the
//     inference fallback once every skill carries explicit range/shape).
//   - Hard range enforcement (refuse out-of-range clicks even when the
//     player cancels targeting).
//   - True enemy AI movement + range selection on the arena layer.
//   - Destructible object damage resolution + onDestroy triggers.
//   - Terrain bonus triggers when a skill lands on rare terrain.
//   - Veilbreak field area control + Field Clash territory split.
//   - Status effects that interact with movement / range (root, knockback).
//   - Boss-specific arena mechanics (canyon edges, bridges, phase walls).
// ─────────────────────────────────────────────────────────────────────────

// Re-export the terrain table for callers that need it without importing
// arenaMaps directly (keeps the targeting module a single import point).
export { TERRAIN as TARGETING_TERRAIN };
