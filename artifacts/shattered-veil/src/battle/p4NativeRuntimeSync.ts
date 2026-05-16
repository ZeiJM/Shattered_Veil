import {
  beginP4Move,
  commitP4Move,
  createP4NativeBattleState,
  finishP4EnemyMovement,
  planP4EnemyMovement,
  pureP4EndTurn,
  type P4NativeBattleState,
  type P4Tile,
} from './p4NativeBattleResolver';

let started = false;
let frame = 0;
let observer: MutationObserver | null = null;
let timer: number | null = null;
let lastTurn = '';
let selectedMove: 'basic_move' | 'strategic_step' | null = null;
let nativeState: P4NativeBattleState | null = null;

const textOf = (el: Element | null) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

function isBattle() { return !!document.querySelector('.battle-bg'); }
function turnText() { return textOf(document.querySelector('.battle-bg .battle-turn-head:not(.sv-chronicle-turn-clone), .battle-bg .sv-turn-head-v101')); }
function isPlayerTurn() { const t = turnText(); return /Your Turn/i.test(t) && !/Enemy Turn/i.test(t); }
function grid() { return document.querySelector('.battle-bg .sv-arena-grid') as HTMLElement | null; }
function rows() { return Array.from(grid()?.querySelectorAll(':scope > .sv-arena-hex-row') || []) as HTMLElement[]; }

function tileCoords(tile: Element | null): P4Tile | null {
  if (!tile) return null;
  const row = tile.closest('.sv-arena-hex-row') as HTMLElement | null;
  if (!row) return null;
  const y = rows().indexOf(row);
  const x = Array.from(row.querySelectorAll(':scope > .sv-arena-tile')).indexOf(tile);
  return x >= 0 && y >= 0 ? { x, y } : null;
}

function readArena() {
  const shape = rows().map((row) => Array.from(row.querySelectorAll(':scope > .sv-arena-tile')).map((tile) => tile.classList.contains('sv-arena-tile-void') ? 0 : 1));
  const cols = Math.max(1, ...shape.map((r) => r.length || 1));
  return { template: { id: 'live_dom', name: 'Live Battlefield' }, cols, rows: Math.max(1, shape.length), shape: shape.length ? shape : [[1]], terrainMap: {}, objectMap: {} };
}

function playerPos(): P4Tile { return tileCoords(document.querySelector('.battle-bg .sv-arena-unit.is-player')?.closest('.sv-arena-tile') || null) || { x: 0, y: 0 }; }
function enemies() {
  return Array.from(document.querySelectorAll('.battle-bg .sv-arena-unit.is-enemy')).map((node, i) => ({
    id: (node as HTMLElement).dataset.svUnitId || `enemy_${i}`,
    name: (node as HTMLElement).title || `Enemy ${i + 1}`,
    pos: tileCoords(node.closest('.sv-arena-tile')) || { x: 0, y: 0 },
    kind: 'enemy',
  }));
}

function resetNativeForTurn() {
  const owner = isPlayerTurn() ? 'player' : 'enemy';
  nativeState = createP4NativeBattleState({ player: { id: 'player', pos: playerPos(), kind: 'player' }, enemies: enemies(), arena: readArena(), turnOwner: owner });
  if (owner === 'enemy') nativeState = planP4EnemyMovement(nativeState);
  selectedMove = null;
  lastTurn = turnText();
}

function syncNative() {
  if (!isBattle()) { nativeState = null; lastTurn = ''; selectedMove = null; return null; }
  if (!nativeState || turnText() !== lastTurn) resetNativeForTurn();
  if (!nativeState) return null;
  nativeState = { ...nativeState, player: { ...nativeState.player, pos: playerPos() }, enemies: enemies(), arena: readArena(), turnOwner: isPlayerTurn() ? 'player' : nativeState.turnOwner };
  return nativeState;
}

function barEls() {
  const bar = document.querySelector('.battle-bg .sv-action-economy-bar') as HTMLElement | null;
  return { bar, state: bar?.querySelector('.sv-action-economy-state') as HTMLElement | null, fill: bar?.querySelector('.sv-action-economy-fill') as HTMLElement | null };
}

function paintAp() {
  const state = syncNative();
  const { bar, state: label, fill } = barEls();
  if (!bar || !label || !fill) return;
  if (!isPlayerTurn()) { label.textContent = 'Enemy turn'; fill.style.width = '0%'; return; }
  const ap = clamp(state?.actionEconomy.remainingAp ?? 100);
  const word = ap >= 100 ? 'Ready' : ap >= 65 ? 'Open' : ap >= 35 ? 'Limited' : ap > 0 ? 'Last sliver' : 'Spent';
  label.textContent = `${ap}% · ${word}`;
  fill.style.width = `${ap}%`;
  bar.dataset.svP4NativeAp = String(ap);
}

function onMoveButton(ev: Event) {
  const btn = (ev.target as Element | null)?.closest?.('[data-sv-p4-action="basic_move"], [data-sv-p4-action="strategic_step"]') as HTMLElement | null;
  if (!btn) return;
  const action = btn.dataset.svP4Action as 'basic_move' | 'strategic_step';
  const state = syncNative();
  if (!state || state.turnOwner !== 'player') return;
  nativeState = beginP4Move(state, action);
  selectedMove = nativeState.selectedAction === action ? action : null;
  window.setTimeout(paintAp, 30);
}

function distance(a: P4Tile | null, b: P4Tile | null) { return !a || !b ? Infinity : Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }

function onTileClick(ev: Event) {
  if (!selectedMove) return;
  const tile = (ev.target as Element | null)?.closest?.('.battle-bg .sv-arena-tile') as HTMLElement | null;
  if (!tile || !grid()?.classList.contains('sv-arena-movement-mode')) return;
  const dest = tileCoords(tile);
  const from = playerPos();
  const d = distance(from, dest);
  if (!dest) return;
  if (selectedMove === 'basic_move' && d !== 1) return;
  if (selectedMove === 'strategic_step' && (d < 1 || d > 5)) return;
  const state = syncNative();
  if (!state) return;
  nativeState = commitP4Move({ ...state, selectedAction: selectedMove }, dest);
  if (nativeState.turnOwner === 'enemy') nativeState = finishP4EnemyMovement(planP4EnemyMovement(nativeState));
  selectedMove = null;
  window.setTimeout(paintAp, 70);
  window.setTimeout(runSoon, 110);
}

function onPassTurn() {
  const state = syncNative();
  if (!state || state.turnOwner !== 'player') return;
  nativeState = pureP4EndTurn(state);
  nativeState = finishP4EnemyMovement(planP4EnemyMovement(nativeState));
  selectedMove = null;
  window.setTimeout(paintAp, 30);
}

function runSoon() { window.cancelAnimationFrame(frame); frame = window.requestAnimationFrame(() => { syncNative(); paintAp(); }); }

export function startP4NativeRuntimeSync() {
  if (started || typeof window === 'undefined' || typeof document === 'undefined') return;
  started = true;
  runSoon();
  observer = new MutationObserver(runSoon);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'disabled'] });
  document.addEventListener('click', onMoveButton, true);
  document.addEventListener('click', onTileClick, true);
  window.addEventListener('sv:battle-pass-turn', onPassTurn as EventListener);
  document.addEventListener('sv:battle-pass-turn', onPassTurn as EventListener);
  timer = window.setInterval(runSoon, 250);
}

export function stopP4NativeRuntimeSync() {
  if (!started) return;
  started = false;
  window.cancelAnimationFrame(frame);
  observer?.disconnect();
  observer = null;
  if (timer != null) window.clearInterval(timer);
  timer = null;
  document.removeEventListener('click', onMoveButton, true);
  document.removeEventListener('click', onTileClick, true);
  window.removeEventListener('sv:battle-pass-turn', onPassTurn as EventListener);
  document.removeEventListener('sv:battle-pass-turn', onPassTurn as EventListener);
}
