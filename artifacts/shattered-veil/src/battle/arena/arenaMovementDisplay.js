// ─────────────────────────────────────────────────────────────────────────
// ARENA MOVEMENT DISPLAY HELPERS
// ─────────────────────────────────────────────────────────────────────────
// Pure presentation helpers only. These do not change movement rules,
// battle state, targeting, or turn economy. UI surfaces should use these
// helpers when showing movement values so character creation, stat panels,
// battle tooltips, and arena previews stay aligned with getUnitMoveRange().
// ─────────────────────────────────────────────────────────────────────────

import { getUnitMoveRange } from './arenaEngine.js';

export function getMovementDescriptor(moveValue = 0) {
  const mv = Number.isFinite(moveValue) ? moveValue : 0;
  if (mv <= 2) return 'Slow';
  if (mv === 3) return 'Steady';
  if (mv === 4) return 'Agile';
  return 'Swift';
}

export function getMovementTone(moveValue = 0) {
  const mv = Number.isFinite(moveValue) ? moveValue : 0;
  if (mv <= 2) return 'Rooted / low mobility';
  if (mv === 3) return 'Balanced mobility';
  if (mv === 4) return 'Mobile skirmisher';
  return 'High mobility';
}

export function getMovementSummaryFromValue(moveValue = 0) {
  const mv = Math.max(1, Math.min(7, Math.floor(Number.isFinite(moveValue) ? moveValue : 3)));
  return {
    value: mv,
    descriptor: getMovementDescriptor(mv),
    tone: getMovementTone(mv),
    shortLabel: `Move ${mv}`,
    label: `Move ${mv} · ${getMovementDescriptor(mv)}`,
    help: `${getMovementDescriptor(mv)} — ${getMovementTone(mv)}. Movement is measured in arena tiles.`,
  };
}

export function getMovementSummaryForUnit(unit = {}) {
  const moveValue = getUnitMoveRange({
    spd: unit.spd ?? unit.st?.spd ?? 0,
    classId: unit.classId ?? unit.cls ?? unit.class ?? unit.id ?? '',
    isBoss: !!unit.isBoss,
    kind: unit.kind || 'player',
  });
  return getMovementSummaryFromValue(moveValue);
}

export function getMovementSummaryForClass(classId, opts = {}) {
  const moveValue = getUnitMoveRange({
    spd: opts.spd ?? 0,
    classId,
    isBoss: false,
    kind: 'player',
  });
  return getMovementSummaryFromValue(moveValue);
}
