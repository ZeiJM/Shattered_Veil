import { getMovementRange, getUnitMoveRange } from './arena/arenaEngine.js';
import { getMovementSummaryForUnit } from './arena/arenaMovementDisplay.js';

const keyOf = (x, y) => x + ',' + y;
const sameTile = (a, b) => !!a && !!b && a.x === b.x && a.y === b.y;
const neighborsOf = (tile) => [
  { x: tile.x + 1, y: tile.y },
  { x: tile.x - 1, y: tile.y },
  { x: tile.x, y: tile.y + 1 },
  { x: tile.x, y: tile.y - 1 },
];

export function getP4UnitMoveValue(unit = {}) {
  return getUnitMoveRange({
    spd: unit.spd ?? unit.st?.spd ?? 0,
    classId: unit.classId ?? unit.cls ?? unit.class ?? unit.id ?? '',
    isBoss: !!unit.isBoss,
    kind: unit.kind || 'player',
  });
}

export function getP4MovementSummary(unit = {}) {
  return getMovementSummaryForUnit(unit);
}

export function getP4ReachableMoveTiles(unit = {}, arena, opts = {}) {
  const origin = unit.pos || opts.origin;
  const moveValue = opts.moveValue ?? getP4UnitMoveValue(unit);
  return getMovementRange(origin, moveValue, arena, opts);
}

export function isP4TileReachable(unit = {}, destination, arena, opts = {}) {
  if (!destination) return false;
  return getP4ReachableMoveTiles(unit, arena, opts).some((tile) => sameTile(tile, destination));
}

export function resolveP4MovementPath(unit = {}, destination, arena, opts = {}) {
  const origin = unit.pos || opts.origin;
  if (!origin || !destination || !arena) return [];
  if (sameTile(origin, destination)) return [origin];

  const reachable = getP4ReachableMoveTiles(unit, arena, opts);
  const allowed = new Map(reachable.map((tile) => [keyOf(tile.x, tile.y), tile.cost]));
  if (!allowed.has(keyOf(destination.x, destination.y))) return [];

  const queue = [{ tile: origin, path: [origin] }];
  const seen = new Set([keyOf(origin.x, origin.y)]);
  while (queue.length) {
    const cur = queue.shift();
    for (const next of neighborsOf(cur.tile)) {
      const k = keyOf(next.x, next.y);
      if (seen.has(k)) continue;
      if (!allowed.has(k) && !sameTile(next, destination)) continue;
      const path = [...cur.path, next];
      if (sameTile(next, destination)) return path;
      seen.add(k);
      queue.push({ tile: next, path });
    }
  }
  return [];
}

export function applyP4UnitMove(unit = {}, destination, arena, opts = {}) {
  const path = resolveP4MovementPath(unit, destination, arena, opts);
  if (!path.length) {
    return { ok: false, reason: 'Destination is outside movement range.', unit, path: [] };
  }
  const finalTile = path[path.length - 1];
  return {
    ok: true,
    reason: '',
    unit: { ...unit, pos: { x: finalTile.x, y: finalTile.y }, lastMovePath: path },
    path,
  };
}

export function chooseP4EnemyMoveToward(enemy = {}, target = {}, arena, opts = {}) {
  const origin = enemy.pos;
  const targetPos = target.pos || target;
  if (!origin || !targetPos || !arena) return { destination: origin, path: [origin].filter(Boolean), reason: 'Missing enemy, target, or arena.' };
  const reachable = getP4ReachableMoveTiles(enemy, arena, opts);
  if (!reachable.length) return { destination: origin, path: [origin], reason: 'No reachable movement tiles.' };
  const currentDist = Math.abs(origin.x - targetPos.x) + Math.abs(origin.y - targetPos.y);
  const best = reachable
    .map((tile) => ({ tile, dist: Math.abs(tile.x - targetPos.x) + Math.abs(tile.y - targetPos.y), cost: tile.cost || 0 }))
    .filter((entry) => entry.dist < currentDist || opts.allowLateral)
    .sort((a, b) => a.dist - b.dist || a.cost - b.cost)[0];
  const destination = best?.tile || origin;
  return {
    destination,
    path: sameTile(destination, origin) ? [origin] : resolveP4MovementPath(enemy, destination, arena, opts),
    reason: best ? 'Moved toward nearest target.' : 'Already holding position.',
  };
}

export function makeP4MovementAnimationPlan(unitId, path = [], opts = {}) {
  return {
    unitId,
    path: path.map((tile, index) => ({ ...tile, index, atMs: index * (opts.stepMs || 120) })),
    stepMs: opts.stepMs || 120,
    totalMs: Math.max(0, path.length - 1) * (opts.stepMs || 120),
  };
}
