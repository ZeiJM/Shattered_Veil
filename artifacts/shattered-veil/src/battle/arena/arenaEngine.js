// ─────────────────────────────────────────────────────────────────────────
// BIG ARENA FOUNDATION — ENGINE HELPERS (Pass 2, foundation only)
// ─────────────────────────────────────────────────────────────────────────
// Pure functions only. No React, no global state, no calls into Game.jsx.
// Nothing in this module mutates or reads battle state — callers pass
// arena + tile data in and receive new arrays out. These exist so future
// passes can wire movement / range / AoE without rewriting the helpers.
// ─────────────────────────────────────────────────────────────────────────

import { TERRAIN, OBJECTS, pickArenaTemplate } from "./arenaMaps.js";

const inBounds = (arena, x, y) =>
  x >= 0 && y >= 0 && x < arena.cols && y < arena.rows && arena.shape[y] && arena.shape[y][x] === 1;

const keyOf = (x, y) => x + "," + y;

// Resolve final arena template + initial state from a battle context.
// Pass 2 keeps this read-only — call sites use the result for the visual
// preview only; combat math is unchanged.
export function getArenaTemplateForBattle(ctx = {}) {
  return pickArenaTemplate(ctx);
}

export function createInitialArenaState(ctx = {}) {
  const tpl = pickArenaTemplate(ctx);
  // Index terrain + destructibles by tile key for O(1) lookup.
  const terrainMap = {};
  (tpl.terrain || []).forEach(t => { if (TERRAIN[t.type]) terrainMap[keyOf(t.x, t.y)] = t.type; });
  const objectMap = {};
  (tpl.destructibles || []).forEach(o => { if (OBJECTS[o.key]) objectMap[keyOf(o.x, o.y)] = { ...o, hp: OBJECTS[o.key].hp }; });
  return {
    template: tpl,
    cols: tpl.cols,
    rows: tpl.rows,
    shape: tpl.shape,
    terrainMap,
    objectMap,
    // Veilbreak-field overlay foundation. All optional; callers may leave null.
    activeField: null,           // { name, element, owner }
    activeFieldOwner: null,      // 'player' | 'enemy' | null
    activeFieldDuration: 0,
    fieldZones: [],              // [{ x, y }, ...]
    fieldIntensity: 0,           // 0..1
    fieldAttunementPreview: 0,   // future-derived stat preview
    fieldClashState: null,       // null | { kind, summary }
  };
}

export function getValidTiles(arena) {
  const out = [];
  for (let y = 0; y < arena.rows; y++) {
    for (let x = 0; x < arena.cols; x++) {
      if (inBounds(arena, x, y)) out.push({ x, y });
    }
  }
  return out;
}

export function getTerrainAt(tile, arena) {
  if (!tile || !arena) return null;
  const t = arena.terrainMap?.[keyOf(tile.x, tile.y)] || "normal";
  return { key: t, ...(TERRAIN[t] || TERRAIN.normal) };
}

export function getObjectsAt(tile, arena) {
  if (!tile || !arena) return [];
  const o = arena.objectMap?.[keyOf(tile.x, tile.y)];
  return o ? [{ ...o, def: OBJECTS[o.key] }] : [];
}

export function isTileBlocked(tile, arena, opts = {}) {
  if (!tile || !arena) return true;
  if (!inBounds(arena, tile.x, tile.y)) return true;
  if (opts.ignoreObjects) return false;
  const objs = getObjectsAt(tile, arena);
  return objs.some(o => o.def?.blocksMovement);
}

// Breadth-first movement range from an origin tile.
// Costs come from terrain.moveCost (default 1). Blocked tiles are skipped.
// Returns an array of { x, y, cost } reachable within `moveStat` cost.
export function getMovementRange(origin, moveStat, arena, opts = {}) {
  if (!origin || !arena || !Number.isFinite(moveStat) || moveStat <= 0) return [];
  const blockedKeys = new Set((opts.occupied || []).map(p => keyOf(p.x, p.y)));
  const seen = new Map();
  seen.set(keyOf(origin.x, origin.y), 0);
  const out = [];
  const q = [{ x: origin.x, y: origin.y, c: 0 }];
  while (q.length) {
    const cur = q.shift();
    if (cur.c > 0) out.push({ x: cur.x, y: cur.y, cost: cur.c });
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (!inBounds(arena, nx, ny)) continue;
      if (blockedKeys.has(keyOf(nx, ny))) continue;
      if (isTileBlocked({ x: nx, y: ny }, arena)) continue;
      const terrain = getTerrainAt({ x: nx, y: ny }, arena);
      const step = terrain?.moveCost || 1;
      const nc = cur.c + step;
      if (nc > moveStat) continue;
      const k = keyOf(nx, ny);
      if (seen.has(k) && seen.get(k) <= nc) continue;
      seen.set(k, nc);
      q.push({ x: nx, y: ny, c: nc });
    }
  }
  return out;
}

// All tiles within Manhattan range, valid only.
export function getSkillRangeTiles(origin, range, arena) {
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

// Area shape resolver. Supported shapes: 'single', 'burst', 'ring', 'line', 'cone'.
// `dir` (only used by line/cone) is one of 'N','S','E','W' or {dx,dy}.
export function getAreaShapeTiles(origin, shape, radius, arena, opts = {}) {
  if (!origin || !arena) return [];
  const r = Math.max(0, Math.floor(radius || 0));
  const acc = [];
  const push = (x, y) => { if (inBounds(arena, x, y)) acc.push({ x, y }); };
  if (shape === "single" || r === 0) { push(origin.x, origin.y); return acc; }
  if (shape === "burst") {
    for (let y = origin.y - r; y <= origin.y + r; y++) {
      for (let x = origin.x - r; x <= origin.x + r; x++) {
        const md = Math.abs(x - origin.x) + Math.abs(y - origin.y);
        if (md <= r) push(x, y);
      }
    }
    return acc;
  }
  if (shape === "ring") {
    for (let y = origin.y - r; y <= origin.y + r; y++) {
      for (let x = origin.x - r; x <= origin.x + r; x++) {
        const md = Math.abs(x - origin.x) + Math.abs(y - origin.y);
        if (md === r) push(x, y);
      }
    }
    return acc;
  }
  const dirMap = { N: { dx: 0, dy: -1 }, S: { dx: 0, dy: 1 }, E: { dx: 1, dy: 0 }, W: { dx: -1, dy: 0 } };
  const dir = (typeof opts.dir === "string" ? dirMap[opts.dir] : opts.dir) || dirMap.E;
  if (shape === "line") {
    for (let i = 1; i <= r; i++) push(origin.x + dir.dx * i, origin.y + dir.dy * i);
    return acc;
  }
  if (shape === "cone") {
    // simple cone: each step out adds one perpendicular spread
    const perp = { dx: dir.dy, dy: dir.dx };
    for (let i = 1; i <= r; i++) {
      for (let s = -i; s <= i; s++) {
        push(origin.x + dir.dx * i + perp.dx * s, origin.y + dir.dy * i + perp.dy * s);
      }
    }
    return acc;
  }
  return acc;
}

// Derived movement stat for an arena unit.
// Pass 3 — temporary formula. Future passes can replace this with a real
// `mv` field on player/enemies and rebalance per class.
export function getUnitMoveRange({ spd = 0, classId = "", isBoss = false, kind = "player" } = {}) {
  let mv = 3;
  if (Number.isFinite(spd)) {
    if (spd >= 19) mv += 2;
    else if (spd >= 14) mv += 1;
    else if (spd <= 8) mv -= 1;
  }
  // Slow tank classes cap at 2 for now.
  if (["gravity", "monk", "rune"].includes(classId)) mv = Math.min(mv, 2);
  if (isBoss) mv += 1;
  if (kind === "pet") mv = Math.max(2, mv - 1);
  return Math.max(1, mv);
}

// Convenience: assign units to spawn slots without overlap.
export function assignSpawns(units, slots) {
  const out = [];
  const used = new Set();
  units.forEach((u, i) => {
    let slot = slots[i % slots.length];
    let n = 0;
    while (slot && used.has(keyOf(slot.x, slot.y)) && n < slots.length) {
      slot = slots[(i + ++n) % slots.length];
    }
    if (slot) {
      used.add(keyOf(slot.x, slot.y));
      out.push({ ...u, pos: { x: slot.x, y: slot.y } });
    }
  });
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// FUTURE TODOs (do not implement in this pass):
//  - Add line-of-sight raycast for ranged skills/objects with blocksLOS.
//  - Add skill-shape data to every skill in Game.jsx skill catalogue.
//  - Hook getMovementRange into a real movement stat (mv) on entities.
//  - Implement applyTerrainBonus(skillResult, terrain, attackerEl) helper.
//  - Implement applyRareTileTrigger(state, tile) on actions over rare tiles.
//  - Implement Veilbreak field activation: setActiveField(state, ult) → state'.
//  - Implement Field Clash: resolveFieldClash(stateA, stateB) → outcome.
//  - Derive Field Attunement from MAG + class affinity + bloodmark.
// ─────────────────────────────────────────────────────────────────────────
