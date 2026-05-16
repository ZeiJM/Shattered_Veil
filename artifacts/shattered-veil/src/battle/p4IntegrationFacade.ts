import { getP4BattleMovementSnapshot, type P4BattleMovementSnapshot } from './p4BattleMovementSnapshot';
import { P4_ACTION_COSTS, type P4ActionId } from './p4ActionEconomyState';

declare global {
  interface Window {
    __SV_P4_BATTLE_STATE__?: {
      movement: P4BattleMovementSnapshot;
      lastMessage?: string;
      validation?: {
        ok: boolean;
        warnings: string[];
        playerMovesThisTurn: number;
        strategicStepUsed: boolean;
        enemyMovesThisTurn: number;
        updatedAt: number;
      };
      updatedAt: number;
    };
  }
}

export type P4IntegrationSnapshot = {
  movement: P4BattleMovementSnapshot;
  ap: {
    remaining: number;
    playerMovesThisTurn: number;
    strategicStepUsed: boolean;
    canMove: boolean;
    canStrategicStep: boolean;
  };
  validation: {
    ok: boolean;
    warnings: string[];
  };
  lastMessage?: string;
  updatedAt: number;
};

function fallbackValidation(snapshot: P4BattleMovementSnapshot) {
  const warnings: string[] = [];
  if (snapshot.playerMovesThisTurn > 3) warnings.push('Player movement count exceeds the intended 30% AP budget.');
  if (snapshot.enemyMovesThisTurn > 1) warnings.push('More than one enemy movement was recorded this enemy turn.');
  return { ok: warnings.length === 0, warnings };
}

export function getP4IntegrationSnapshot(): P4IntegrationSnapshot {
  const movement = window.__SV_P4_BATTLE_STATE__?.movement || getP4BattleMovementSnapshot();
  const validation = window.__SV_P4_BATTLE_STATE__?.validation || fallbackValidation(movement);
  const spentOnMoves = movement.playerMovesThisTurn * P4_ACTION_COSTS.basic_move.cost + (movement.strategicStepUsed ? P4_ACTION_COSTS.strategic_step.cost : 0);
  const remaining = Math.max(0, 100 - spentOnMoves);
  return {
    movement,
    ap: {
      remaining,
      playerMovesThisTurn: movement.playerMovesThisTurn,
      strategicStepUsed: movement.strategicStepUsed,
      canMove: remaining >= P4_ACTION_COSTS.basic_move.cost,
      canStrategicStep: !movement.strategicStepUsed && remaining >= P4_ACTION_COSTS.strategic_step.cost,
    },
    validation: { ok: validation.ok, warnings: [...(validation.warnings || [])] },
    lastMessage: window.__SV_P4_BATTLE_STATE__?.lastMessage,
    updatedAt: Date.now(),
  };
}

export function getP4ActionCost(actionId: P4ActionId) {
  return P4_ACTION_COSTS[actionId];
}

export function publishP4IntegrationSnapshot() {
  if (typeof window === 'undefined') return getP4IntegrationSnapshot();
  const snapshot = getP4IntegrationSnapshot();
  window.dispatchEvent(new CustomEvent('sv:p4-integration-snapshot', { detail: snapshot }));
  return snapshot;
}

let started = false;
let timer: number | null = null;

export function startP4IntegrationFacade() {
  if (started || typeof window === 'undefined') return;
  started = true;
  publishP4IntegrationSnapshot();
  window.addEventListener('sv:p4-final-battle-state', publishP4IntegrationSnapshot as EventListener);
  window.addEventListener('sv:p4-battle-movement-snapshot', publishP4IntegrationSnapshot as EventListener);
  timer = window.setInterval(publishP4IntegrationSnapshot, 750);
}

export function stopP4IntegrationFacade() {
  if (!started || typeof window === 'undefined') return;
  started = false;
  window.removeEventListener('sv:p4-final-battle-state', publishP4IntegrationSnapshot as EventListener);
  window.removeEventListener('sv:p4-battle-movement-snapshot', publishP4IntegrationSnapshot as EventListener);
  if (timer != null) window.clearInterval(timer);
  timer = null;
}

if (typeof window !== 'undefined') {
  window.setTimeout(() => startP4IntegrationFacade(), 0);
}
