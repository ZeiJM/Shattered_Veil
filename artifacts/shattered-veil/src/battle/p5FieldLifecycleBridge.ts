type P5LifecycleSnapshot = {
  active: boolean;
  phase: 'idle' | 'staged' | 'active' | 'expired' | 'deactivated';
  field: unknown | null;
  selectedMpSpend: number;
  activatedAt: number;
  affectedIndexes: number[];
  occupants: string[];
  duration: unknown | null;
  influence: unknown | null;
  effectPlans: unknown | null;
  updatedAt: number;
  reason: string;
};

declare global {
  interface Window {
    __SV_P5_FIELD_STATE__?: P5LifecycleSnapshot;
  }
}

let started = false;
let lastActive = false;
let snapshot: P5LifecycleSnapshot = {
  active: false,
  phase: 'idle',
  field: null,
  selectedMpSpend: 0,
  activatedAt: 0,
  affectedIndexes: [],
  occupants: [],
  duration: null,
  influence: null,
  effectPlans: null,
  updatedAt: 0,
  reason: 'initial',
};

function numberFrom(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function arrayFrom<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function asDetail(event: Event) {
  return event instanceof CustomEvent && event.detail && typeof event.detail === 'object' ? event.detail as Record<string, unknown> : {};
}

function publish(next: Partial<P5LifecycleSnapshot>, reason: string) {
  const previousActive = snapshot.active;
  const active = typeof next.active === 'boolean' ? next.active : snapshot.active;
  const phase = next.phase || (active ? 'active' : snapshot.field ? 'staged' : 'idle');
  snapshot = {
    ...snapshot,
    ...next,
    active,
    phase,
    updatedAt: Date.now(),
    reason,
  };
  window.__SV_P5_FIELD_STATE__ = snapshot;
  window.dispatchEvent(new CustomEvent('sv:p5-field-lifecycle-state', { detail: snapshot }));
  if (!previousActive && active) {
    window.dispatchEvent(new CustomEvent('sv:p5-field-lifecycle-activated', { detail: snapshot }));
  }
  if (previousActive && !active) {
    window.dispatchEvent(new CustomEvent('sv:p5-field-lifecycle-deactivated', { detail: snapshot }));
  }
  lastActive = active;
}

function onConfig(event: Event) {
  const detail = asDetail(event);
  publish({
    active: false,
    phase: 'staged',
    field: detail.field ?? null,
    selectedMpSpend: numberFrom(detail.selectedMpSpend),
    activatedAt: 0,
    affectedIndexes: [],
    occupants: [],
    effectPlans: null,
  }, 'config');
}

function onActivated(event: Event) {
  const detail = asDetail(event);
  publish({
    active: true,
    phase: 'active',
    field: detail.field ?? snapshot.field,
    selectedMpSpend: numberFrom(detail.selectedMpSpend, snapshot.selectedMpSpend),
    activatedAt: numberFrom(detail.activatedAt, Date.now()),
  }, 'activated');
}

function onState(event: Event) {
  const detail = asDetail(event);
  const active = detail.active === true;
  const duration = detail.duration ?? null;
  const phase = active ? 'active' : (lastActive ? 'deactivated' : detail.field ? 'staged' : 'idle');
  publish({
    active,
    phase,
    field: detail.field ?? null,
    selectedMpSpend: numberFrom(detail.selectedMpSpend, snapshot.selectedMpSpend),
    activatedAt: numberFrom(detail.activatedAt, snapshot.activatedAt),
    affectedIndexes: arrayFrom<number>(detail.affectedIndexes),
    occupants: arrayFrom<string>(detail.occupants),
    influence: detail.influence ?? null,
    duration,
    effectPlans: detail.effectPlans ?? null,
  }, 'state');
}

function onInfluence(event: Event) {
  const detail = asDetail(event);
  publish({ influence: detail }, 'influence');
}

function onDuration(event: Event) {
  const detail = asDetail(event);
  publish({ duration: detail }, 'duration');
}

function onEffectPlans(event: Event) {
  const detail = asDetail(event);
  publish({ effectPlans: detail }, 'effect-plans');
}

export function getP5FieldLifecycleSnapshot() {
  return snapshot;
}

export function startP5FieldLifecycleBridge() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.__SV_P5_FIELD_STATE__ = snapshot;
  window.addEventListener('sv:p5-veilbreak-field-config', onConfig as EventListener);
  window.addEventListener('sv:p5-veilbreak-activated', onActivated as EventListener);
  window.addEventListener('sv:p5-veilbreak-field-state', onState as EventListener);
  window.addEventListener('sv:p5-field-influence-state', onInfluence as EventListener);
  window.addEventListener('sv:p5-field-duration-state', onDuration as EventListener);
  window.addEventListener('sv:p5-field-effect-plans', onEffectPlans as EventListener);
  publish({}, 'started');
}

export function stopP5FieldLifecycleBridge() {
  if (!started || typeof window === 'undefined') return;
  started = false;
  window.removeEventListener('sv:p5-veilbreak-field-config', onConfig as EventListener);
  window.removeEventListener('sv:p5-veilbreak-activated', onActivated as EventListener);
  window.removeEventListener('sv:p5-veilbreak-field-state', onState as EventListener);
  window.removeEventListener('sv:p5-field-influence-state', onInfluence as EventListener);
  window.removeEventListener('sv:p5-field-duration-state', onDuration as EventListener);
  window.removeEventListener('sv:p5-field-effect-plans', onEffectPlans as EventListener);
  publish({ active: false, phase: 'deactivated' }, 'stopped');
}
