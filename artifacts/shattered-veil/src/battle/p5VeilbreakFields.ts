export type P5FieldOwner = 'player' | 'enemy' | 'ally' | 'neutral';

export type P5FieldRangeUpgrade = {
  id: 'widen_field_i' | 'widen_field_ii';
  name: string;
  mpCost: number;
  radiusBonus: number;
  summary: string;
};

export type P5VeilbreakField = {
  fieldId: string;
  fieldName: string;
  owner: P5FieldOwner;
  originIndex: number;
  radius: number;
  baseRadius: number;
  maxRadius: number;
  affectedArea: 'around_owner';
  consumesMainAction: true;
  actionCost: 100;
  mpSpentOnRange: number;
  upgrades: P5FieldRangeUpgrade[];
  entryEffect: string;
  exitEffect: string;
  elementTags: string[];
  visualTheme: string;
  createdAt: number;
};

export const P5_FIELD_BASE_RADIUS = 1;
export const P5_FIELD_MAX_RADIUS = 3;

export const P5_FIELD_RANGE_UPGRADES: P5FieldRangeUpgrade[] = [
  {
    id: 'widen_field_i',
    name: 'Widen Field I',
    mpCost: 8,
    radiusBonus: 1,
    summary: 'Spend 8 MP to expand a Veilbreak field from radius 1 to radius 2.',
  },
  {
    id: 'widen_field_ii',
    name: 'Widen Field II',
    mpCost: 16,
    radiusBonus: 2,
    summary: 'Spend 16 MP to expand a Veilbreak field from radius 1 to radius 3.',
  },
];

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function safeId(value: unknown) {
  return String(value || 'veilbreak_field').replace(/\W+/g, '_').toLowerCase();
}

export function getP5FieldRadius(baseRadius = P5_FIELD_BASE_RADIUS, radiusBonus = 0) {
  return clamp(baseRadius + radiusBonus, P5_FIELD_BASE_RADIUS, P5_FIELD_MAX_RADIUS);
}

export function getP5FieldUpgradeForMp(mpSpent = 0) {
  const spend = Math.max(0, Math.floor(Number(mpSpent) || 0));
  const upgrade = [...P5_FIELD_RANGE_UPGRADES]
    .filter((option) => spend >= option.mpCost)
    .sort((a, b) => b.radiusBonus - a.radiusBonus)[0];
  return upgrade || null;
}

export function getP5AffordableFieldUpgrades(currentMp = 0) {
  const mp = Math.max(0, Math.floor(Number(currentMp) || 0));
  return P5_FIELD_RANGE_UPGRADES.filter((option) => mp >= option.mpCost);
}

export function buildP5VeilbreakField(input: {
  ult?: { id?: string; name?: string; el?: string; visualTheme?: string } | null;
  owner?: P5FieldOwner;
  originIndex?: number;
  mpSpentOnRange?: number;
  visualTheme?: string;
} = {}): P5VeilbreakField {
  const ult = input.ult || null;
  const upgrade = getP5FieldUpgradeForMp(input.mpSpentOnRange || 0);
  const radius = getP5FieldRadius(P5_FIELD_BASE_RADIUS, upgrade?.radiusBonus || 0);
  const element = ult?.el || 'Null';
  return {
    fieldId: 'p5_' + safeId(ult?.id || ult?.name || element),
    fieldName: ult?.name || 'Veilbreak Field',
    owner: input.owner || 'player',
    originIndex: typeof input.originIndex === 'number' ? input.originIndex : -1,
    radius,
    baseRadius: P5_FIELD_BASE_RADIUS,
    maxRadius: P5_FIELD_MAX_RADIUS,
    affectedArea: 'around_owner',
    consumesMainAction: true,
    actionCost: 100,
    mpSpentOnRange: Math.max(0, Math.floor(Number(input.mpSpentOnRange) || 0)),
    upgrades: P5_FIELD_RANGE_UPGRADES,
    entryEffect: 'Inside Veilbreak field: receives the field\'s recurring influence while standing in the zone.',
    exitEffect: 'Left Veilbreak field: recurring field influence no longer applies.',
    elementTags: [element],
    visualTheme: input.visualTheme || ult?.visualTheme || String(element).toLowerCase(),
    createdAt: Date.now(),
  };
}

export function getP5FieldTileIndexes(opts: {
  originIndex: number;
  radius: number;
  cols: number;
  tileCount: number;
  validIndexes?: Set<number> | number[] | null;
}) {
  const originIndex = Math.floor(opts.originIndex);
  const radius = clamp(opts.radius, P5_FIELD_BASE_RADIUS, P5_FIELD_MAX_RADIUS);
  const cols = Math.max(1, Math.floor(opts.cols || 1));
  const tileCount = Math.max(0, Math.floor(opts.tileCount || 0));
  if (originIndex < 0 || originIndex >= tileCount) return [];
  const valid = opts.validIndexes instanceof Set
    ? opts.validIndexes
    : Array.isArray(opts.validIndexes)
      ? new Set(opts.validIndexes)
      : null;
  const origin = { x: originIndex % cols, y: Math.floor(originIndex / cols) };
  const indexes: number[] = [];
  for (let index = 0; index < tileCount; index += 1) {
    if (valid && !valid.has(index)) continue;
    const coord = { x: index % cols, y: Math.floor(index / cols) };
    const distance = Math.abs(coord.x - origin.x) + Math.abs(coord.y - origin.y);
    if (distance <= radius) indexes.push(index);
  }
  return indexes;
}

export function diffP5FieldOccupancy(previous: Iterable<string>, current: Iterable<string>) {
  const prev = new Set(previous || []);
  const next = new Set(current || []);
  const entered: string[] = [];
  const exited: string[] = [];
  next.forEach((id) => { if (!prev.has(id)) entered.push(id); });
  prev.forEach((id) => { if (!next.has(id)) exited.push(id); });
  return { entered, exited };
}

export function describeP5Field(field: P5VeilbreakField | null | undefined) {
  if (!field) return '';
  return `${field.fieldName}: radius ${field.radius}, ${field.actionCost}% main action, ${field.mpSpentOnRange || 0} MP spent on range.`;
}

export function describeP5FieldUpgradeOptions(currentMp = 0) {
  const affordable = getP5AffordableFieldUpgrades(currentMp);
  if (!affordable.length) return 'No field range upgrade currently affordable.';
  return affordable.map((option) => `${option.name}: ${option.mpCost} MP, +${option.radiusBonus} radius`).join(' · ');
}
