import { getP4BattleMovementSnapshot, type P4BattleMovementSnapshot } from './p4BattleMovementSnapshot';

declare global {
  interface Window {
    __SV_P4_BATTLE_STATE__?: {
      movement: P4BattleMovementSnapshot;
      lastMessage?: string;
      validation?: P4ValidationStatus;
      updatedAt: number;
    };
  }
}

type P4ValidationStatus = {
  ok: boolean;
  warnings: string[];
  playerMovesThisTurn: number;
  strategicStepUsed: boolean;
  enemyMovesThisTurn: number;
  updatedAt: number;
};

let started = false;
let lastVersion = -1;
let frame = 0;
let timer: number | null = null;
const recentLogMessages = new Map<string, number>();

function logContainer() {
  return document.querySelector('.battle-bg .blog-sel, .battle-bg .battle-log-card') as HTMLElement | null;
}

function normalizeLogId(message: string) {
  return message.replace(/\s+/g, ' ').trim().slice(0, 120);
}

function appendP4Log(message: string) {
  const log = logContainer();
  if (!log || !message) return;
  const id = normalizeLogId(message);
  const now = Date.now();
  const prior = recentLogMessages.get(id) || 0;
  if (now - prior < 2500) return;
  recentLogMessages.set(id, now);
  if (recentLogMessages.size > 28) {
    Array.from(recentLogMessages.keys()).slice(0, 8).forEach((key) => recentLogMessages.delete(key));
  }
  if (log.querySelector(`[data-sv-p4-log-id="${CSS.escape(id)}"]`)) return;
  const row = document.createElement('div');
  row.className = 'battle-log-entry sv-p4-runtime-log';
  row.dataset.svP4LogId = id;
  row.textContent = message;
  log.insertBefore(row, log.firstChild);
}

function messageForSnapshot(snapshot: P4BattleMovementSnapshot) {
  const latest = snapshot.timeline[snapshot.timeline.length - 1];
  if (!latest) return '';
  if (latest.kind === 'player_move') return `Movement: You moved one tile. Move count this turn: ${snapshot.playerMovesThisTurn}.`;
  if (latest.kind === 'player_strategic_step') return 'Movement: Strategic Step used. Repositioned up to 5 tiles for 30% AP.';
  if (latest.kind === 'enemy_move') return latest.toIndex != null
    ? `Enemy Movement: Enemy advanced to tile ${latest.toIndex}.`
    : `Enemy Movement: ${latest.reason || 'Enemy held position.'}`;
  return latest.reason || '';
}

function validateSnapshot(snapshot: P4BattleMovementSnapshot): P4ValidationStatus {
  const warnings: string[] = [];
  if (snapshot.playerMovesThisTurn > 3) warnings.push('Player has spent more than 90% AP on tile movement this turn.');
  if (snapshot.enemyMovesThisTurn > 1) warnings.push('More than one enemy movement was recorded this enemy turn.');
  if (snapshot.timeline.length > 55) warnings.push('Movement timeline is near cap and should be trimmed soon.');
  return {
    ok: warnings.length === 0,
    warnings,
    playerMovesThisTurn: snapshot.playerMovesThisTurn,
    strategicStepUsed: snapshot.strategicStepUsed,
    enemyMovesThisTurn: snapshot.enemyMovesThisTurn,
    updatedAt: Date.now(),
  };
}

function publishSnapshot(snapshot: P4BattleMovementSnapshot, message?: string) {
  const validation = validateSnapshot(snapshot);
  window.__SV_P4_BATTLE_STATE__ = {
    movement: snapshot,
    lastMessage: message || window.__SV_P4_BATTLE_STATE__?.lastMessage,
    validation,
    updatedAt: Date.now(),
  };
  window.dispatchEvent(new CustomEvent('sv:p4-final-battle-state', { detail: window.__SV_P4_BATTLE_STATE__ }));
  if (!validation.ok) {
    validation.warnings.forEach((warning) => appendP4Log(`P4 Check: ${warning}`));
  }
}

function syncFromSnapshot() {
  if (typeof document === 'undefined' || !document.querySelector('.battle-bg')) return;
  const snapshot = getP4BattleMovementSnapshot();
  if (snapshot.version === lastVersion) return;
  lastVersion = snapshot.version;
  const message = messageForSnapshot(snapshot);
  if (message) appendP4Log(message);
  publishSnapshot(snapshot, message);
}

function runSoon() {
  window.cancelAnimationFrame(frame);
  frame = window.requestAnimationFrame(syncFromSnapshot);
}

function handleSnapshot() {
  runSoon();
}

function installStyles() {
  if (document.getElementById('sv-p4-final-handoff-style')) return;
  const style = document.createElement('style');
  style.id = 'sv-p4-final-handoff-style';
  style.textContent = `
    .battle-bg .sv-p4-runtime-log{
      color:rgba(206,231,255,.94)!important;
      border-left:2px solid rgba(115,184,255,.55)!important;
      padding-left:7px!important;
      background:rgba(86,178,255,.055)!important;
    }
  `;
  document.head.appendChild(style);
}

export function startP4FinalHandoffRuntime() {
  if (started || typeof window === 'undefined' || typeof document === 'undefined') return;
  started = true;
  installStyles();
  runSoon();
  window.addEventListener('sv:p4-battle-movement-snapshot', handleSnapshot as EventListener);
  timer = window.setInterval(runSoon, 500);
}

export function stopP4FinalHandoffRuntime() {
  if (!started || typeof window === 'undefined') return;
  started = false;
  window.cancelAnimationFrame(frame);
  window.removeEventListener('sv:p4-battle-movement-snapshot', handleSnapshot as EventListener);
  if (timer != null) window.clearInterval(timer);
  timer = null;
}

if (typeof window !== 'undefined') {
  window.setTimeout(() => startP4FinalHandoffRuntime(), 0);
}
