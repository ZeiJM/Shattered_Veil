import { inferP4ActionIdFromText } from './actionEconomy';
import { applyP4ActionEconomy, canUseP4Action, createP4ActionEconomyState, P4_ACTION_COSTS, type P4ActionEconomyState, type P4ActionId } from './p4ActionEconomyState';

let started = false;
let frame = 0;
let timer: number | null = null;
let observer: MutationObserver | null = null;
let economy: P4ActionEconomyState = createP4ActionEconomyState('player');
let lastTurn = '';

const textOf = (el: Element | null) => (el?.textContent || '').replace(/\s+/g, ' ').trim();

function isPlayerTurn() {
  const turn = textOf(document.querySelector('.battle-bg .battle-turn-head:not(.sv-chronicle-turn-clone), .battle-bg .sv-turn-head-v101'));
  return /Your Turn/i.test(turn) && !/Enemy Turn/i.test(turn);
}

function currentTurnKey() {
  const turn = textOf(document.querySelector('.battle-bg .battle-turn-head:not(.sv-chronicle-turn-clone), .battle-bg .sv-turn-head-v101'));
  return turn || (isPlayerTurn() ? 'player' : 'enemy');
}

function resetForTurnIfNeeded() {
  if (!document.querySelector('.battle-bg')) {
    economy = createP4ActionEconomyState('player');
    lastTurn = '';
    return;
  }
  const key = currentTurnKey();
  if (key !== lastTurn) {
    lastTurn = key;
    economy = createP4ActionEconomyState(isPlayerTurn() ? 'player' : 'enemy');
  }
}

function labelFor(ap: number) {
  if (ap >= 100) return 'Ready';
  if (ap >= 65) return 'Open';
  if (ap >= 35) return 'Limited';
  if (ap > 0) return 'Last sliver';
  return 'Spent';
}

function syncUi() {
  resetForTurnIfNeeded();
  const bar = document.querySelector('.battle-bg .sv-action-economy-bar') as HTMLElement | null;
  if (!bar) return;
  const state = bar.querySelector('.sv-action-economy-state') as HTMLElement | null;
  const fill = bar.querySelector('.sv-action-economy-fill') as HTMLElement | null;
  const player = isPlayerTurn();
  const ap = player ? economy.remainingAp : 0;
  bar.dataset.svNativeP4Ap = String(ap);
  bar.dataset.svNativeP4MainSpent = economy.mainActionSpent ? '1' : '0';
  bar.dataset.svNativeP4StrategicStepUsed = economy.strategicStepUsed ? '1' : '0';
  if (state) state.textContent = player ? `${ap}% · ${labelFor(ap)}` : 'Enemy turn';
  if (fill) fill.style.width = `${Math.max(0, Math.min(100, ap))}%`;

  document.querySelectorAll('.battle-bg button').forEach((node) => {
    const button = node as HTMLButtonElement;
    if (!button.closest('.battle-action-btn, .battle-aux-row, .sv-p4-combat-movement')) return;
    const actionId = inferP4ActionIdFromText(textOf(button), String(button.className || ''), button);
    const meta = P4_ACTION_COSTS[actionId];
    if (!meta) return;
    const blocked = player && meta.cost > 0 && !canUseP4Action(economy, actionId).ok && actionId !== 'end_turn' && actionId !== 'flee';
    button.classList.toggle('sv-native-p4-blocked', blocked);
    button.dataset.svNativeP4Action = actionId;
    button.dataset.svNativeP4Cost = String(meta.cost);
  });
}

function runSoon() {
  window.cancelAnimationFrame(frame);
  frame = window.requestAnimationFrame(syncUi);
}

function applyAction(actionId: P4ActionId) {
  if (!isPlayerTurn()) return;
  const allowed = canUseP4Action(economy, actionId);
  if (!allowed.ok && actionId !== 'end_turn') return;
  economy = applyP4ActionEconomy(economy, actionId);
  window.dispatchEvent(new CustomEvent('sv:p4-native-action', { detail: { actionId, economy } }));
  runSoon();
}

function onClickCapture(ev: Event) {
  const button = (ev.target as Element | null)?.closest?.('button') as HTMLButtonElement | null;
  if (!button || !button.closest('.battle-bg')) return;
  const actionId = inferP4ActionIdFromText(textOf(button), String(button.className || ''), button);
  if (!P4_ACTION_COSTS[actionId]) return;

  if (actionId === 'end_turn') {
    economy = applyP4ActionEconomy(economy, 'end_turn');
    window.dispatchEvent(new CustomEvent('sv:p4-native-end-turn', { detail: { source: 'native-runtime-wiring', economy } }));
    runSoon();
    return;
  }

  if (actionId === 'basic_move' || actionId === 'strategic_step') {
    // Movement AP is committed by the movement click, not by opening movement mode.
    runSoon();
    return;
  }

  const meta = P4_ACTION_COSTS[actionId];
  if (meta.cost > 0) applyAction(actionId);
}

function onMoveCommitted(ev: Event) {
  const detail = (ev as CustomEvent).detail || {};
  const actionId = detail.actionId === 'strategic_step' ? 'strategic_step' : detail.actionId === 'basic_move' ? 'basic_move' : null;
  if (!actionId) return;
  applyAction(actionId);
}

export function startP4NativeRuntimeWiring() {
  if (started || typeof window === 'undefined' || typeof document === 'undefined') return;
  started = true;
  runSoon();
  observer = new MutationObserver(runSoon);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled', 'style'] });
  document.addEventListener('click', onClickCapture, true);
  document.addEventListener('pointerup', runSoon, { passive: true });
  window.addEventListener('sv:p4-runtime-move-committed', onMoveCommitted as EventListener);
  timer = window.setInterval(runSoon, 300);
}

export function stopP4NativeRuntimeWiring() {
  if (!started) return;
  started = false;
  window.cancelAnimationFrame(frame);
  observer?.disconnect();
  observer = null;
  if (timer != null) window.clearInterval(timer);
  timer = null;
  document.removeEventListener('click', onClickCapture, true);
  window.removeEventListener('sv:p4-runtime-move-committed', onMoveCommitted as EventListener);
}
