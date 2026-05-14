// ─────────────────────────────────────────────────────────────────────────
// TECHNIQUE DISPLAY SUMMARY HELPERS
// ─────────────────────────────────────────────────────────────────────────
// Pure presentation helpers only. These helpers describe targeting, real
// result text, and cosmetic landed VFX without changing skill data, battle
// state, damage, status logic, targeting rules, saves, or turn economy.
// ─────────────────────────────────────────────────────────────────────────

import {
  deriveSkillCombatMeta,
  rangeLabel,
  shapeLabel,
} from './classRoles.js';

const TARGET_LABELS = {
  enemy: 'Enemies',
  ally: 'Allies / Self',
  self: 'Self',
  allEnemies: 'All Enemies',
  allAllies: 'All Allies',
  everyone: 'Everyone',
  tile: 'Battlefield Tile',
  object: 'Terrain Object',
  mixed: 'Mixed Targets',
};

const SHAPE_METHOD_LABELS = {
  single: 'Single Target',
  line: 'Line',
  cone: 'Cone',
  burst: 'Area Around Target',
  aura: 'Area Around Self',
  ring: 'Ring',
  row: 'Row',
  column: 'Column',
  chain: 'Chain / Bounce',
  zone: 'Field Zone',
  self: 'Self',
  global: 'Whole Arena',
};

const RESULT_LABELS_BY_TYPE = {
  damage: 'Deals damage on a successful hit.',
  heal: 'Restores HP to a valid ally or self target.',
  buff: 'Applies a beneficial effect to a valid ally or self target.',
  debuff: 'Applies pressure or a harmful effect to a valid enemy target.',
  copy: 'Copies or mirrors a valid target technique when its condition is met.',
  guard: 'Improves defense or guard state for the user or allies.',
  summon: 'Creates a temporary ally, object, or field helper.',
  field: 'Creates or modifies a battlefield field zone.',
  move: 'Moves, pulls, pushes, or repositions a unit.',
};

const COSMETIC_VFX_BY_ELEMENT = {
  Fire: 'Fire impact embers / burn flare',
  Water: 'Water splash, ripple, or soothing blue glow',
  Ice: 'Ice frost burst / shatter mist',
  Lightning: 'Lightning chain spark / shock flash',
  Earth: 'Earth rock burst / dust guard ring',
  Wind: 'Wind slash gust / push trail',
  Light: 'Light heal or shield radiance',
  Dark: 'Dark drain shadow wisps',
  Void: 'Void glitch / null pulse',
  Nature: 'Nature petals, vines, or regrowth shimmer',
  Metal: 'Metal spark / pierce glint',
  Poison: 'Poison vapor droplets',
  Psychic: 'Psychic ripple / eye shimmer',
  Sound: 'Sound waveform pulse',
  Gravity: 'Gravity compression ring / pull distortion',
  Arcane: 'Arcane rune flare / prism destabilization',
  Physical: 'Physical slash or impact burst',
  Null: 'Neutral impact flash',
};

function cleanText(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function formatDistance(meta) {
  if (!meta) return '';
  const r = Number.isFinite(meta.range) ? meta.range : null;
  if (r == null) return '';
  if (r === 0) return 'self';
  if (r >= 99) return 'whole arena';
  return `${r} tile${r === 1 ? '' : 's'}`;
}

export function getTargetMethodSummary(skill = {}, classId = '') {
  const meta = deriveSkillCombatMeta(skill, classId);
  const shape = meta.shape || 'single';
  const method = SHAPE_METHOD_LABELS[shape] || shapeLabel(shape) || 'Single Target';
  const target = TARGET_LABELS[meta.targetType] || TARGET_LABELS[skill.targetType] || 'Enemies';
  const distance = formatDistance(meta);
  const range = rangeLabel({ range: meta.range });
  const parts = [method];
  if (distance && method !== 'Self' && method !== 'Whole Arena') parts.push(distance);
  if (target) parts.push(target);
  return {
    method,
    target,
    range,
    shape,
    distance,
    label: parts.filter(Boolean).join(' · '),
    meta,
  };
}

export function getTechniqueResultSummary(skill = {}) {
  const type = cleanText(skill.t || skill.type || 'damage');
  const base = RESULT_LABELS_BY_TYPE[type] || 'Applies this technique\'s listed effect when used successfully.';
  const explicit = cleanText(skill.resultSummary || skill.effectSummary || skill.ds || skill.desc);
  return {
    type,
    label: explicit || base,
    isExplicit: !!explicit,
  };
}

export function getCosmeticLandedVfx(skill = {}) {
  const element = cleanText(skill.el || skill.element || 'Null') || 'Null';
  const vfx = cleanText(skill.visualEffect || skill.impactVfx || skill.landedVfx) || COSMETIC_VFX_BY_ELEMENT[element] || COSMETIC_VFX_BY_ELEMENT.Null;
  return {
    element,
    vfx,
    label: `${element} VFX · ${vfx}`,
    visualOnly: true,
  };
}

export function getTechniqueDisplaySummary(skill = {}, classId = '') {
  const target = getTargetMethodSummary(skill, classId);
  const result = getTechniqueResultSummary(skill);
  const cosmeticVfx = getCosmeticLandedVfx(skill);
  return {
    target,
    result,
    cosmeticVfx,
    compactLabel: `${target.label} · ${cosmeticVfx.element}`,
    details: [target.label, result.label, cosmeticVfx.label].filter(Boolean),
  };
}

export const TECHNIQUE_TARGET_METHOD_LABELS = SHAPE_METHOD_LABELS;
export const TECHNIQUE_TARGET_LABELS = TARGET_LABELS;
export const TECHNIQUE_COSMETIC_VFX_BY_ELEMENT = COSMETIC_VFX_BY_ELEMENT;
