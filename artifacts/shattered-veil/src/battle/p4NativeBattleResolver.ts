import { applyP4ActionEconomy, canUseP4Action, createP4ActionEconomyState, P4_ACTION_COSTS, type P4ActionEconomyState, type P4ActionId } from './p4ActionEconomyState';
import { applyP4UnitMove, chooseP4EnemyMoveToward, makeP4MovementAnimationPlan, resolveP4MovementPath } from './p4MovementController';

export type P4Tile = { x: number; y: number };
export type P4BattleUnit = { id: string; name?: string; pos?: P4Tile; chp?: number; hp?: number; mhp?: number; spd?: number; st?: { spd?: number }; classId?: string; cls?: string; class?: string; kind?: string; isBoss?: boolean; lastMovePath?: P4Tile[]; [key: string]: unknown };
export type P4NativeBattleState = { actionEconomy: P4ActionEconomyState; player: P4BattleUnit; enemies: P4BattleUnit[]; arena: unknown; turnOwner: 'player' | 'enemy' | 'ally' | 'none'; phase: 'idle' | 'moving' | 'targeting' | 'enemy_moving' | 'ended'; selectedAction?: P4ActionId | null; movementPlan?: ReturnType<typeof makeP4MovementAnimationPlan> | null; log: string[] };

export function createP4NativeBattleState(input: { player: P4BattleUnit; enemies?: P4BattleUnit[]; arena: unknown; turnOwner?: P4NativeBattleState['turnOwner']; log?: string[] }): P4NativeBattleState {
  const turnOwner = input.turnOwner || 'player';
  return { actionEconomy: createP4ActionEconomyState(turnOwner), player: input.player, enemies: input.enemies || [], arena: input.arena, turnOwner, phase: turnOwner === 'player' ? 'idle' : 'enemy_moving', selectedAction: null, movementPlan: null, log: input.log || [] };
}

export function startP4PlayerTurn(state: P4NativeBattleState): P4NativeBattleState {
  return { ...state, turnOwner: 'player', phase: 'idle', selectedAction: null, movementPlan: null, actionEconomy: createP4ActionEconomyState('player'), log: [...state.log, 'PLAYER|Action economy refreshes to 100%.'] };
}

export function pureP4EndTurn(state: P4NativeBattleState): P4NativeBattleState {
  if (state.turnOwner !== 'player') return state;
  const actionEconomy = applyP4ActionEconomy(state.actionEconomy, 'end_turn');
  return { ...state, actionEconomy, turnOwner: 'enemy', phase: 'enemy_moving', selectedAction: null, movementPlan: null, log: [...state.log, 'PLAYER|Turn passed. No guard, defend, buff, heal, damage reduction, or hidden benefit was applied.'] };
}

export function spendP4Action(state: P4NativeBattleState, actionId: P4ActionId): P4NativeBattleState {
  const allowed = canUseP4Action(state.actionEconomy, actionId);
  if (!allowed.ok) return { ...state, log: [...state.log, `PLAYER|${allowed.reason}`] };
  const actionEconomy = applyP4ActionEconomy(state.actionEconomy, actionId);
  const meta = P4_ACTION_COSTS[actionId];
  return { ...state, actionEconomy, turnOwner: actionEconomy.turnPassed ? 'enemy' : state.turnOwner, phase: actionEconomy.turnPassed ? 'enemy_moving' : state.phase, log: [...state.log, `PLAYER|${meta.label} action economy spent: ${meta.note}`] };
}

export function beginP4Move(state: P4NativeBattleState, kind: 'basic_move' | 'strategic_step'): P4NativeBattleState {
  const allowed = canUseP4Action(state.actionEconomy, kind);
  if (!allowed.ok) return { ...state, log: [...state.log, `PLAYER|${allowed.reason}`] };
  return { ...state, phase: 'moving', selectedAction: kind, movementPlan: null, log: [...state.log, kind === 'basic_move' ? 'PLAYER|Move selected: choose one adjacent tile. Costs 30% AP per tile.' : 'PLAYER|Strategic Step selected: choose a tile up to 5 spaces away. Costs 30% AP once.'] };
}

function p4Distance(a?: P4Tile, b?: P4Tile) { return !a || !b ? Number.POSITIVE_INFINITY : Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }

export function commitP4Move(state: P4NativeBattleState, destination: P4Tile): P4NativeBattleState {
  const actionId = state.selectedAction;
  if (state.turnOwner !== 'player' || (actionId !== 'basic_move' && actionId !== 'strategic_step')) return state;
  const maxDistance = actionId === 'basic_move' ? 1 : 5;
  const dist = p4Distance(state.player.pos, destination);
  if (dist < 1 || dist > maxDistance) return { ...state, log: [...state.log, actionId === 'basic_move' ? 'PLAYER|Move can only advance one adjacent tile.' : 'PLAYER|Strategic Step can move up to 5 tiles only.'] };
  const allowed = canUseP4Action(state.actionEconomy, actionId);
  if (!allowed.ok) return { ...state, log: [...state.log, `PLAYER|${allowed.reason}`] };
  const moved = applyP4UnitMove(state.player, destination, state.arena as never, { moveValue: maxDistance, origin: state.player.pos });
  if (!moved.ok) return { ...state, log: [...state.log, `PLAYER|${moved.reason}`] };
  const actionEconomy = applyP4ActionEconomy(state.actionEconomy, actionId);
  const path = actionId === 'basic_move' ? [state.player.pos, destination].filter(Boolean) as P4Tile[] : resolveP4MovementPath(state.player, destination, state.arena as never, { moveValue: 5, origin: state.player.pos });
  return { ...state, player: moved.unit, actionEconomy, phase: actionEconomy.turnPassed ? 'enemy_moving' : 'idle', turnOwner: actionEconomy.turnPassed ? 'enemy' : 'player', selectedAction: null, movementPlan: makeP4MovementAnimationPlan(state.player.id, path, { stepMs: actionId === 'basic_move' ? 120 : 70 }), log: [...state.log, actionId === 'basic_move' ? `PLAYER|Moved one tile for 30% AP. Remaining AP: ${actionEconomy.remainingAp}%.` : `PLAYER|Strategic Step completed for 30% AP. Remaining AP: ${actionEconomy.remainingAp}%.`] };
}

export function planP4EnemyMovement(state: P4NativeBattleState): P4NativeBattleState {
  if (state.turnOwner !== 'enemy') return state;
  const livingEnemies = state.enemies.filter((enemy) => (enemy.chp ?? enemy.hp ?? enemy.mhp ?? 1) > 0);
  if (!livingEnemies.length) return startP4PlayerTurn(state);
  const enemy = livingEnemies[0];
  const plan = chooseP4EnemyMoveToward(enemy, state.player, state.arena as never, { allowLateral: false });
  const enemies = state.enemies.map((entry) => entry.id === enemy.id ? { ...entry, pos: plan.destination, lastMovePath: plan.path } : entry);
  return { ...state, enemies, movementPlan: makeP4MovementAnimationPlan(enemy.id, plan.path, { stepMs: 120 }), phase: 'enemy_moving', log: [...state.log, `ENEMY|${enemy.name || 'Enemy'} ${plan.reason}`] };
}

export function finishP4EnemyMovement(state: P4NativeBattleState): P4NativeBattleState {
  if (state.turnOwner !== 'enemy') return state;
  return startP4PlayerTurn({ ...state, movementPlan: null });
}
