// ─────────────────────────────────────────────────────────────────────────
// CLASS MOVEMENT SUMMARY HELPERS
// ─────────────────────────────────────────────────────────────────────────
// Pure display helpers that combine class identity metadata with arena
// movement labels. These do not change class balance, movement rules,
// battle state, character creation, saves, or turn economy.
// ─────────────────────────────────────────────────────────────────────────

import { CLASS_ROLES, getRoleMeta } from './classRoles.js';
import { getMovementSummaryForClass } from './arena/arenaMovementDisplay.js';

export function getClassMovementSummary(classId, opts = {}) {
  const id = String(classId || '').toLowerCase();
  const role = CLASS_ROLES[id] || null;
  const roleMeta = getRoleMeta(role?.role);
  const movement = getMovementSummaryForClass(id, opts);
  return {
    classId: id,
    role,
    roleMeta,
    movement,
    label: movement.label,
    shortLabel: movement.shortLabel,
    descriptor: movement.descriptor,
    help: movement.help,
    statLine: `${movement.label} · ${roleMeta?.label || 'Class'}`,
  };
}

export function getClassMovementBadge(classId, opts = {}) {
  const summary = getClassMovementSummary(classId, opts);
  return {
    text: summary.label,
    title: summary.help,
    descriptor: summary.descriptor,
    value: summary.movement.value,
  };
}

export function getAllClassMovementSummaries(opts = {}) {
  return Object.keys(CLASS_ROLES).map(classId => getClassMovementSummary(classId, opts));
}
