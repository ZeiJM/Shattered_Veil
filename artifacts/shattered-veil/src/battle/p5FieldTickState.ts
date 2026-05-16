import type { P5VeilbreakField } from './p5VeilbreakFields';
import type { P5FieldInfluenceSnapshot, P5UnitFieldInfluence } from './p5FieldInfluenceState';

export type P5FieldTickRecord = {
  tickId: string;
  fieldId: string;
  fieldName: string;
  turnKey: string;
  remainingTurns: number;
  activeInfluenceCount: number;
  effects: Array<{
    unitId: string;
    kind: P5UnitFieldInfluence['kind'];
    recurringEffect: string;
    mechanical: false;
    summary: string;
  }>;
  expired: boolean;
  createdAt: number;
};

export type P5FieldDurationState = {
  field: P5VeilbreakField | null;
  remainingTurns: number;
  duration: number;
  lastTurnKey: string;
  ticks: P5FieldTickRecord[];
  expired: boolean;
  updatedAt: number;
};

const MAX_TICKS = 12;

function durationFor(field: P5VeilbreakField | null | undefined) {
  if (!field) return 0;
  return Math.max(2, Math.min(5, field.radius + 1));
}

function effectSummary(item: P5UnitFieldInfluence) {
  const label = item.kind === 'benefit' ? 'benefits from' : item.kind === 'hazard' ? 'is pressured by' : 'stands within';
  return `${item.unitId} ${label} ${item.fieldName} (${item.recurringEffect}).`;
}

export function createP5FieldDurationState(field: P5VeilbreakField | null): P5FieldDurationState {
  const duration = durationFor(field);
  return {
    field,
    remainingTurns: duration,
    duration,
    lastTurnKey: '',
    ticks: [],
    expired: false,
    updatedAt: Date.now(),
  };
}

export function tickP5FieldDuration(opts: {
  state: P5FieldDurationState | null | undefined;
  field: P5VeilbreakField | null;
  influence: P5FieldInfluenceSnapshot | null;
  turnKey: string;
  now?: number;
}): P5FieldDurationState {
  const now = opts.now || Date.now();
  const field = opts.field || null;
  let state = opts.state || createP5FieldDurationState(field);
  if (!field) return { ...state, field: null, remainingTurns: 0, expired: true, updatedAt: now };
  if (!state.field || state.field.fieldId !== field.fieldId) state = createP5FieldDurationState(field);
  const turnKey = opts.turnKey || 'unknown-turn';
  if (!turnKey || turnKey === state.lastTurnKey || state.expired) return { ...state, updatedAt: now };
  const activeInfluences = opts.influence?.activeInfluences || [];
  const remainingTurns = Math.max(0, state.remainingTurns - 1);
  const expired = remainingTurns <= 0;
  const tick: P5FieldTickRecord = {
    tickId: `${field.fieldId}_${turnKey}_${now}`,
    fieldId: field.fieldId,
    fieldName: field.fieldName,
    turnKey,
    remainingTurns,
    activeInfluenceCount: activeInfluences.length,
    effects: activeInfluences.map((item) => ({
      unitId: item.unitId,
      kind: item.kind,
      recurringEffect: item.recurringEffect,
      mechanical: false,
      summary: effectSummary(item),
    })),
    expired,
    createdAt: now,
  };
  return {
    ...state,
    field,
    remainingTurns,
    lastTurnKey: turnKey,
    ticks: [...state.ticks, tick].slice(-MAX_TICKS),
    expired,
    updatedAt: now,
  };
}

export function latestP5FieldTick(state: P5FieldDurationState | null | undefined) {
  if (!state?.ticks?.length) return null;
  return state.ticks[state.ticks.length - 1] || null;
}

export function describeP5FieldTick(tick: P5FieldTickRecord | null | undefined) {
  if (!tick) return '';
  const effectText = tick.activeInfluenceCount === 1 ? '1 unit influenced' : `${tick.activeInfluenceCount} units influenced`;
  return `${tick.fieldName} pulses — ${effectText}, ${tick.remainingTurns} turn(s) remain.`;
}
