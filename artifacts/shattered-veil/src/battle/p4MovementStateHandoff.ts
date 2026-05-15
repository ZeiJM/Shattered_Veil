export type P4MovementCommitKind = 'player_move' | 'player_strategic_step' | 'enemy_move';

export type P4MovementCommit = {
  id: string;
  kind: P4MovementCommitKind;
  unitId?: string;
  fromIndex?: number;
  toIndex?: number;
  remainingAp?: number;
  moveTilesSpent?: number;
  strategicStepUsed?: boolean;
  reason?: string;
  at: number;
};

export type P4MovementHandoffState = {
  commits: P4MovementCommit[];
  latestByUnit: Record<string, P4MovementCommit>;
  latestPlayer?: P4MovementCommit;
  latestEnemy?: P4MovementCommit;
};

const MAX_COMMITS = 40;
let state: P4MovementHandoffState = { commits: [], latestByUnit: {} };
let started = false;
let seq = 0;

function nextId(kind: P4MovementCommitKind) {
  seq += 1;
  return `${kind}-${Date.now()}-${seq}`;
}

function emitChange(commit: P4MovementCommit) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('sv:p4-movement-state-changed', { detail: { commit, state: getP4MovementHandoffState() } }));
}

export function getP4MovementHandoffState(): P4MovementHandoffState {
  return {
    commits: [...state.commits],
    latestByUnit: { ...state.latestByUnit },
    latestPlayer: state.latestPlayer ? { ...state.latestPlayer } : undefined,
    latestEnemy: state.latestEnemy ? { ...state.latestEnemy } : undefined,
  };
}

export function recordP4MovementCommit(input: Omit<P4MovementCommit, 'id' | 'at'> & { id?: string; at?: number }) {
  const commit: P4MovementCommit = {
    ...input,
    id: input.id || nextId(input.kind),
    at: input.at || Date.now(),
  };
  const commits = [...state.commits, commit].slice(-MAX_COMMITS);
  const latestByUnit = { ...state.latestByUnit };
  if (commit.unitId) latestByUnit[commit.unitId] = commit;
  state = {
    commits,
    latestByUnit,
    latestPlayer: commit.kind === 'player_move' || commit.kind === 'player_strategic_step' ? commit : state.latestPlayer,
    latestEnemy: commit.kind === 'enemy_move' ? commit : state.latestEnemy,
  };
  emitChange(commit);
  return commit;
}

function handlePlayerMove(ev: Event) {
  const detail = (ev as CustomEvent).detail || {};
  const actionId = detail.actionId === 'strategic_step' ? 'player_strategic_step' : detail.actionId === 'basic_move' ? 'player_move' : null;
  if (!actionId) return;
  recordP4MovementCommit({
    kind: actionId,
    unitId: 'player',
    remainingAp: Number.isFinite(detail.remainingAp) ? detail.remainingAp : undefined,
    moveTilesSpent: Number.isFinite(detail.moveTilesSpent) ? detail.moveTilesSpent : undefined,
    strategicStepUsed: !!detail.strategicStepUsed,
    reason: actionId === 'player_move' ? 'Player moved one tile.' : 'Player used Strategic Step.',
  });
}

function handleEnemyMove(ev: Event) {
  const detail = (ev as CustomEvent).detail || {};
  recordP4MovementCommit({
    kind: 'enemy_move',
    unitId: detail.unitId || 'enemy',
    fromIndex: Number.isFinite(detail.fromIndex) ? detail.fromIndex : undefined,
    toIndex: Number.isFinite(detail.toIndex) ? detail.toIndex : undefined,
    reason: detail.reason || (detail.moved === false ? 'Enemy held position.' : 'Enemy moved.'),
  });
}

export function startP4MovementStateHandoff() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('sv:p4-runtime-move-committed', handlePlayerMove as EventListener);
  window.addEventListener('sv:p4-enemy-movement-committed', handleEnemyMove as EventListener);
}

export function stopP4MovementStateHandoff() {
  if (!started || typeof window === 'undefined') return;
  started = false;
  window.removeEventListener('sv:p4-runtime-move-committed', handlePlayerMove as EventListener);
  window.removeEventListener('sv:p4-enemy-movement-committed', handleEnemyMove as EventListener);
}

if (typeof window !== 'undefined') {
  window.setTimeout(() => startP4MovementStateHandoff(), 0);
}
