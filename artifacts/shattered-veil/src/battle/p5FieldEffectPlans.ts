import type { P5FieldTickRecord } from './p5FieldTickState';

export type P5FieldEffectPlan = {
  planId: string;
  tickId: string;
  unitId: string;
  kind: 'benefit' | 'hazard' | 'neutral';
  recurringEffect: string;
  effectType: 'hp_damage' | 'hp_regen' | 'mp_regen' | 'crit_boost' | 'slow' | 'silence_pressure' | 'veil_magic_gain' | 'none';
  magnitude: 'minor' | 'moderate';
  mechanical: false;
  summary: string;
};

export type P5FieldEffectPlanSnapshot = {
  tickId: string;
  fieldId: string;
  fieldName: string;
  plans: P5FieldEffectPlan[];
  updatedAt: number;
};

function effectTypeFor(recurringEffect: string, kind: P5FieldEffectPlan['kind']): P5FieldEffectPlan['effectType'] {
  if (kind === 'neutral') return 'none';
  if (recurringEffect === 'dot') return kind === 'hazard' ? 'hp_damage' : 'veil_magic_gain';
  if (recurringEffect === 'regen') return kind === 'benefit' ? 'hp_regen' : 'slow';
  if (recurringEffect === 'shield') return kind === 'benefit' ? 'mp_regen' : 'slow';
  if (recurringEffect === 'crit_boost') return kind === 'benefit' ? 'crit_boost' : 'slow';
  if (recurringEffect === 'slow') return kind === 'hazard' ? 'slow' : 'mp_regen';
  if (recurringEffect === 'silence_chance') return kind === 'hazard' ? 'silence_pressure' : 'veil_magic_gain';
  if (recurringEffect === 'veil_gen') return kind === 'benefit' ? 'veil_magic_gain' : 'silence_pressure';
  return kind === 'benefit' ? 'veil_magic_gain' : 'none';
}

function summaryFor(plan: Omit<P5FieldEffectPlan, 'summary'>) {
  const effect = plan.effectType.replace(/_/g, ' ');
  if (plan.effectType === 'none') return `${plan.unitId} is inside the field, but no resolver effect is planned.`;
  return `${plan.unitId}: planned ${plan.magnitude} ${effect} from ${plan.recurringEffect} field influence.`;
}

export function buildP5FieldEffectPlans(tick: P5FieldTickRecord | null | undefined): P5FieldEffectPlanSnapshot | null {
  if (!tick) return null;
  const plans = tick.effects.map((effect, index) => {
    const base = {
      planId: `${tick.tickId}_${effect.unitId}_${index}`,
      tickId: tick.tickId,
      unitId: effect.unitId,
      kind: effect.kind,
      recurringEffect: effect.recurringEffect,
      effectType: effectTypeFor(effect.recurringEffect, effect.kind),
      magnitude: tick.remainingTurns <= 1 ? 'minor' : 'moderate',
      mechanical: false as const,
    };
    return { ...base, summary: summaryFor(base) };
  });
  return {
    tickId: tick.tickId,
    fieldId: tick.fieldId,
    fieldName: tick.fieldName,
    plans,
    updatedAt: Date.now(),
  };
}

export function describeP5FieldEffectPlans(snapshot: P5FieldEffectPlanSnapshot | null | undefined) {
  if (!snapshot) return '';
  if (!snapshot.plans.length) return `${snapshot.fieldName}: no units currently receive field effects.`;
  return `${snapshot.fieldName}: ${snapshot.plans.length} planned recurring field effect(s).`;
}
