import { getP4MovementHandoffState, type P4MovementCommit } from './p4MovementStateHandoff';

export type P4BattleMovementSnapshot = {
  version: number;
  playerMovesThisTurn: number;
  strategicStepUsed: boolean;
  enemyMovesThisTurn: number;
  latestPlayerMove?: P4MovementCommit;
  latestEnemyMove?: P4MovementCommit;
  timeline: P4MovementCommit[];
  updatedAt: number;
};

const MAX_TIMELINE = 60;
let started = false;
let snapshot: P4BattleMovementSnapshot = {
  version: 0,
  playerMovesThisTurn: 0,
  strategicStepUsed: false,
  enemyMovesThisTurn: 0,
  timeline: [],
  updatedAt: Date.now(),
};

function isEnemyTurnText(text: string) {
  return /Enemy Turn/i.test(text) && !/Your Turn/i.test(text);
}

function currentTurnText() {
  return (document.querySelector('.battle-bg .battle-turn-head:not(.sv-chronicle-turn-clone), .battle-bg .sv-turn-head-v101')?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();
}

let lastTurnText = '';

function resetTurnScopedCountersIfNeeded() {
  if (typeof document === 'undefined' || !document.querySelector('.battle-bg')) return;
  const text = currentTurnText();
  if (!text || text === lastTurnText) return;
  const wasEnemy = isEnemyTurnText(lastTurnText);
  const nowEnemy = isEnemyTurnText(text);
  lastTurnText = text;
  snapshot = {
    ...snapshot,
    version: snapshot.version + 1,
    playerMovesThisTurn: nowEnemy ? snapshot.playerMovesThisTurn : 0,
    strategicStepUsed: nowEnemy ? snapshot.strategicStepUsed : false,
    enemyMovesThisTurn: nowEnemy && !wasEnemy ? 0 : snapshot.enemyMovesThisTurn,
    updatedAt: Date.now(),
  };
  emitSnapshot();
}

function emitSnapshot() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('sv:p4-battle-movement-snapshot', { detail: { snapshot: getP4BattleMovementSnapshot() } }));
}

function applyCommit(commit: P4MovementCommit) {
  const timeline = [...snapshot.timeline, commit].slice(-MAX_TIMELINE);
  snapshot = {
    ...snapshot,
    version: snapshot.version + 1,
    playerMovesThisTurn: commit.kind === 'player_move' ? snapshot.playerMovesThisTurn + 1 : snapshot.playerMovesThisTurn,
    strategicStepUsed: commit.kind === 'player_strategic_step' ? true : snapshot.strategicStepUsed,
    enemyMovesThisTurn: commit.kind === 'enemy_move' ? snapshot.enemyMovesThisTurn + 1 : snapshot.enemyMovesThisTurn,
    latestPlayerMove: commit.kind === 'player_move' || commit.kind === 'player_strategic_step' ? commit : snapshot.latestPlayerMove,
    latestEnemyMove: commit.kind === 'enemy_move' ? commit : snapshot.latestEnemyMove,
    timeline,
    updatedAt: Date.now(),
  };
  emitSnapshot();
}

function handleHandoffChange(ev: Event) {
  const commit = (ev as CustomEvent).detail?.commit as P4MovementCommit | undefined;
  if (!commit) return;
  applyCommit(commit);
}

export function getP4BattleMovementSnapshot(): P4BattleMovementSnapshot {
  return {
    ...snapshot,
    timeline: [...snapshot.timeline],
    latestPlayerMove: snapshot.latestPlayerMove ? { ...snapshot.latestPlayerMove } : undefined,
    latestEnemyMove: snapshot.latestEnemyMove ? { ...snapshot.latestEnemyMove } : undefined,
  };
}

export function rebuildP4BattleMovementSnapshotFromHandoff() {
  const handoff = getP4MovementHandoffState();
  snapshot = {
    version: snapshot.version + 1,
    playerMovesThisTurn: handoff.commits.filter((c) => c.kind === 'player_move').length,
    strategicStepUsed: handoff.commits.some((c) => c.kind === 'player_strategic_step'),
    enemyMovesThisTurn: handoff.commits.filter((c) => c.kind === 'enemy_move').length,
    latestPlayerMove: handoff.latestPlayer,
    latestEnemyMove: handoff.latestEnemy,
    timeline: handoff.commits.slice(-MAX_TIMELINE),
    updatedAt: Date.now(),
  };
  emitSnapshot();
  return getP4BattleMovementSnapshot();
}

export function startP4BattleMovementSnapshot() {
  if (started || typeof window === 'undefined' || typeof document === 'undefined') return;
  started = true;
  rebuildP4BattleMovementSnapshotFromHandoff();
  window.addEventListener('sv:p4-movement-state-changed', handleHandoffChange as EventListener);
  window.setInterval(resetTurnScopedCountersIfNeeded, 500);
}

export function stopP4BattleMovementSnapshot() {
  if (!started || typeof window === 'undefined') return;
  started = false;
  window.removeEventListener('sv:p4-movement-state-changed', handleHandoffChange as EventListener);
}

if (typeof window !== 'undefined') {
  window.setTimeout(() => startP4BattleMovementSnapshot(), 0);
}
