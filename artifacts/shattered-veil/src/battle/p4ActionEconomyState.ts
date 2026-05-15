export type P4ActionKind =
  | 'free'
  | 'main'
  | 'minor'
  | 'utility'
  | 'movement'
  | 'end'
  | 'danger';

export type P4ActionId =
  | 'inspect'
  | 'tab_switch'
  | 'drawer'
  | 'inventory_prep'
  | 'strategic_view'
  | 'basic_move'
  | 'strategic_step'
  | 'steady_strike'
  | 'flurry_strike'
  | 'focus_breath'
  | 'veil_anchor'
  | 'brace_field'
  | 'overchannel'
  | 'field_sever'
  | 'guard'
  | 'basic_attack'
  | 'veil_magic'
  | 'veilbreak'
  | 'equipped_consumable'
  | 'flee'
  | 'end_turn';

export type P4ActionCostMeta = {
  id: P4ActionId;
  kind: P4ActionKind;
  cost: number;
  label: string;
  note: string;
  endsTurn: boolean;
  consumesMainAction: boolean;
  hiddenEffect: false;
};

export type P4ActionEconomyState = {
  maxAp: number;
  remainingAp: number;
  mainActionSpent: boolean;
  movementTilesSpent: number;
  strategicStepUsed: boolean;
  moved: boolean;
  turnOwner: 'player' | 'enemy' | 'ally' | 'none';
  turnPassed: boolean;
  history: Array<{ id: P4ActionId; cost: number; remainingAp: number }>;
};

export const P4_ACTION_COSTS: Record<P4ActionId, P4ActionCostMeta> = {
  inspect: { id: 'inspect', kind: 'free', cost: 0, label: '0%', note: 'Information only.', endsTurn: false, consumesMainAction: false, hiddenEffect: false },
  tab_switch: { id: 'tab_switch', kind: 'free', cost: 0, label: '0%', note: 'Command-window switch only.', endsTurn: false, consumesMainAction: false, hiddenEffect: false },
  drawer: { id: 'drawer', kind: 'free', cost: 0, label: '0%', note: 'Opens a utility drawer.', endsTurn: false, consumesMainAction: false, hiddenEffect: false },
  inventory_prep: { id: 'inventory_prep', kind: 'free', cost: 0, label: '0%', note: 'Inventory preparation is free.', endsTurn: false, consumesMainAction: false, hiddenEffect: false },
  strategic_view: { id: 'strategic_view', kind: 'free', cost: 0, label: '0%', note: 'Zero-cost battlefield inspection mode.', endsTurn: false, consumesMainAction: false, hiddenEffect: false },
  basic_move: { id: 'basic_move', kind: 'movement', cost: 30, label: '30%', note: 'Move one adjacent tile. Can be repeated tile-by-tile while action economy remains.', endsTurn: false, consumesMainAction: false, hiddenEffect: false },
  strategic_step: { id: 'strategic_step', kind: 'movement', cost: 30, label: '30%', note: 'Instant reposition up to 5 tiles. Uses the movement system but does not consume the main action.', endsTurn: false, consumesMainAction: false, hiddenEffect: false },
  steady_strike: { id: 'steady_strike', kind: 'main', cost: 60, label: '60%', note: 'Reliable basic strike; can pair with a light tactic.', endsTurn: false, consumesMainAction: true, hiddenEffect: false },
  flurry_strike: { id: 'flurry_strike', kind: 'main', cost: 80, label: '80%', note: 'Multi-hit pressure; leaves a small tactical remainder.', endsTurn: false, consumesMainAction: true, hiddenEffect: false },
  focus_breath: { id: 'focus_breath', kind: 'minor', cost: 25, label: '25%', note: 'Light focus action.', endsTurn: false, consumesMainAction: false, hiddenEffect: false },
  veil_anchor: { id: 'veil_anchor', kind: 'minor', cost: 35, label: '35%', note: 'Minor setup; leaves room for another minor tactic.', endsTurn: false, consumesMainAction: false, hiddenEffect: false },
  brace_field: { id: 'brace_field', kind: 'minor', cost: 35, label: '35%', note: 'Minor defensive field response.', endsTurn: false, consumesMainAction: false, hiddenEffect: false },
  overchannel: { id: 'overchannel', kind: 'utility', cost: 50, label: '50%', note: 'Risk/reward power setup.', endsTurn: false, consumesMainAction: false, hiddenEffect: false },
  field_sever: { id: 'field_sever', kind: 'utility', cost: 65, label: '65%', note: 'Heavy field-control utility.', endsTurn: false, consumesMainAction: false, hiddenEffect: false },
  guard: { id: 'guard', kind: 'minor', cost: 50, label: '50%', note: 'Defensive half-turn action.', endsTurn: false, consumesMainAction: false, hiddenEffect: false },
  basic_attack: { id: 'basic_attack', kind: 'main', cost: 100, label: '100%', note: 'Primary combat action.', endsTurn: true, consumesMainAction: true, hiddenEffect: false },
  veil_magic: { id: 'veil_magic', kind: 'main', cost: 100, label: '100%', note: 'Primary Veil Magic action.', endsTurn: true, consumesMainAction: true, hiddenEffect: false },
  veilbreak: { id: 'veilbreak', kind: 'main', cost: 100, label: '100%', note: 'Full-turn field/ultimate action.', endsTurn: true, consumesMainAction: true, hiddenEffect: false },
  equipped_consumable: { id: 'equipped_consumable', kind: 'main', cost: 100, label: '100%', note: 'Equipped battle consumable.', endsTurn: true, consumesMainAction: true, hiddenEffect: false },
  flee: { id: 'flee', kind: 'danger', cost: 100, label: '100%', note: 'Full-turn escape attempt.', endsTurn: true, consumesMainAction: true, hiddenEffect: false },
  end_turn: { id: 'end_turn', kind: 'end', cost: 100, label: 'End', note: 'Pure pass turn. No guard, defend, buff, heal, damage reduction, or hidden effect.', endsTurn: true, consumesMainAction: false, hiddenEffect: false },
};

export function createP4ActionEconomyState(turnOwner: P4ActionEconomyState['turnOwner'] = 'player'): P4ActionEconomyState {
  return {
    maxAp: 100,
    remainingAp: 100,
    mainActionSpent: false,
    movementTilesSpent: 0,
    strategicStepUsed: false,
    moved: false,
    turnOwner,
    turnPassed: false,
    history: [],
  };
}

export function canUseP4Action(state: P4ActionEconomyState, actionId: P4ActionId) {
  const meta = P4_ACTION_COSTS[actionId];
  if (!meta) return { ok: false, reason: 'Unknown action.' };
  if (state.turnOwner !== 'player') return { ok: false, reason: 'Not player turn.' };
  if (state.turnPassed) return { ok: false, reason: 'Turn already passed.' };
  if (meta.consumesMainAction && state.mainActionSpent) return { ok: false, reason: 'Main action already spent.' };
  if (actionId === 'strategic_step' && state.strategicStepUsed) return { ok: false, reason: 'Strategic Step already used this turn.' };
  if (meta.cost > state.remainingAp) return { ok: false, reason: 'Not enough action economy.' };
  return { ok: true, reason: '' };
}

export function applyP4ActionEconomy(state: P4ActionEconomyState, actionId: P4ActionId): P4ActionEconomyState {
  const meta = P4_ACTION_COSTS[actionId];
  const allowed = canUseP4Action(state, actionId);
  if (!allowed.ok || !meta) return state;
  const remainingAp = actionId === 'end_turn' ? 0 : Math.max(0, state.remainingAp - meta.cost);
  return {
    ...state,
    remainingAp,
    mainActionSpent: state.mainActionSpent || meta.consumesMainAction,
    movementTilesSpent: state.movementTilesSpent + (actionId === 'basic_move' ? 1 : 0),
    strategicStepUsed: state.strategicStepUsed || actionId === 'strategic_step',
    moved: state.moved || actionId === 'basic_move' || actionId === 'strategic_step',
    turnPassed: state.turnPassed || meta.endsTurn || remainingAp <= 0,
    history: [...state.history, { id: actionId, cost: meta.cost, remainingAp }],
  };
}

export function shouldAutoPassP4Turn(state: P4ActionEconomyState, availableActions: P4ActionId[] = []) {
  if (state.turnOwner !== 'player' || state.turnPassed) return false;
  const usablePaidActions = availableActions
    .filter((id) => P4_ACTION_COSTS[id]?.cost > 0 && id !== 'end_turn' && id !== 'flee')
    .some((id) => canUseP4Action(state, id).ok);
  return !usablePaidActions;
}

// Browser-only bootstrap: this module is already loaded by battle helpers.
// Start the native runtime AP wiring without touching the app entrypoint.
if (typeof window !== 'undefined') {
  window.setTimeout(() => {
    import('./p4NativeRuntimeWiring')
      .then((mod) => mod.startP4NativeRuntimeWiring?.())
      .catch(() => undefined);
  }, 0);
}
