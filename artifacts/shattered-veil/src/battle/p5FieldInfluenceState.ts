import type { P5VeilbreakField } from './p5VeilbreakFields';

export type P5FieldInfluenceKind = 'benefit' | 'hazard' | 'neutral';

export type P5UnitFieldInfluence = {
  unitId: string;
  fieldId: string;
  fieldName: string;
  owner: P5VeilbreakField['owner'];
  kind: P5FieldInfluenceKind;
  recurringEffect: string;
  enteredAt: number;
  lastSeenAt: number;
  active: boolean;
  logLine: string;
};

export type P5FieldInfluenceSnapshot = {
  field: P5VeilbreakField | null;
  activeInfluences: P5UnitFieldInfluence[];
  entered: P5UnitFieldInfluence[];
  exited: P5UnitFieldInfluence[];
  updatedAt: number;
};

function recurringEffectFor(field: P5VeilbreakField | null | undefined) {
  const tag = field?.elementTags?.[0] || 'Null';
  const map: Record<string, string> = {
    Fire: 'dot',
    Dark: 'dot',
    Curse: 'dot',
    Water: 'regen',
    Nature: 'regen',
    Light: 'regen',
    Holy: 'regen',
    Earth: 'shield',
    Metal: 'shield',
    Wind: 'veil_gen',
    Lightning: 'crit_boost',
    Sound: 'crit_boost',
    Ice: 'slow',
    Void: 'silence_chance',
  };
  return map[tag] || 'veil_gen';
}

function influenceKind(field: P5VeilbreakField, unitId: string): P5FieldInfluenceKind {
  const lower = String(unitId || '').toLowerCase();
  const isPlayer = lower.includes('player') || lower.includes('hero') || lower.includes('you');
  const isEnemy = lower.includes('enemy') || lower.includes('foe') || lower.includes('boss');
  if (field.owner === 'player' && isEnemy) return 'hazard';
  if (field.owner === 'player' && isPlayer) return 'benefit';
  if (field.owner === 'enemy' && isPlayer) return 'hazard';
  if (field.owner === 'enemy' && isEnemy) return 'benefit';
  return 'neutral';
}

function logLineFor(influence: Omit<P5UnitFieldInfluence, 'logLine'>) {
  if (influence.kind === 'benefit') return `${influence.unitId} is empowered by ${influence.fieldName}.`;
  if (influence.kind === 'hazard') return `${influence.unitId} is pressured by ${influence.fieldName}.`;
  return `${influence.unitId} is inside ${influence.fieldName}.`;
}

export function buildP5FieldInfluence(field: P5VeilbreakField, unitId: string, now = Date.now()): P5UnitFieldInfluence {
  const base = {
    unitId,
    fieldId: field.fieldId,
    fieldName: field.fieldName,
    owner: field.owner,
    kind: influenceKind(field, unitId),
    recurringEffect: recurringEffectFor(field),
    enteredAt: now,
    lastSeenAt: now,
    active: true,
  };
  return { ...base, logLine: logLineFor(base) };
}

export function updateP5FieldInfluences(opts: {
  field: P5VeilbreakField | null;
  previous?: Map<string, P5UnitFieldInfluence> | null;
  occupants?: string[];
  now?: number;
}): { snapshot: P5FieldInfluenceSnapshot; next: Map<string, P5UnitFieldInfluence> } {
  const now = opts.now || Date.now();
  const field = opts.field || null;
  const previous = opts.previous || new Map<string, P5UnitFieldInfluence>();
  const occupants = new Set(opts.occupants || []);
  const next = new Map<string, P5UnitFieldInfluence>();
  const entered: P5UnitFieldInfluence[] = [];
  const exited: P5UnitFieldInfluence[] = [];

  if (field) {
    occupants.forEach((unitId) => {
      const prior = previous.get(unitId);
      if (prior && prior.fieldId === field.fieldId) {
        next.set(unitId, { ...prior, lastSeenAt: now, active: true });
      } else {
        const influence = buildP5FieldInfluence(field, unitId, now);
        next.set(unitId, influence);
        entered.push(influence);
      }
    });
  }

  previous.forEach((prior, unitId) => {
    if (!occupants.has(unitId)) exited.push({ ...prior, active: false, lastSeenAt: now });
  });

  return {
    snapshot: {
      field,
      activeInfluences: Array.from(next.values()),
      entered,
      exited,
      updatedAt: now,
    },
    next,
  };
}

export function describeP5InfluenceSnapshot(snapshot: P5FieldInfluenceSnapshot | null | undefined) {
  if (!snapshot?.field) return 'No active Veilbreak field influence.';
  const active = snapshot.activeInfluences.length;
  const entered = snapshot.entered.length;
  const exited = snapshot.exited.length;
  return `${snapshot.field.fieldName}: ${active} active influence(s), ${entered} entered, ${exited} exited.`;
}
