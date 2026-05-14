import {
  explainActionEconomyBalance,
  getActionEconomyStateLabel,
  getActionEconomyWidth,
  getBattleActionEconomyMeta,
} from './actionEconomy';

let remainingAp = 100;
let lastTurnSignature = '';
let lastWasPlayerTurn = false;
let bridgeStarted = false;
let bridgeObserver: MutationObserver | null = null;
let bridgeTimer: number | null = null;
let bridgeFrame = 0;
let autoEndInFlight = false;

const textOf = (el: Element | null) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
const clampAp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function isPlayerTurn() {
  const head = document.querySelector('.battle-bg .sv-turn-head-v101, .battle-bg .battle-turn-head');
  const text = textOf(head);
  return /Your Turn/i.test(text) && !/Enemy Turn/i.test(text);
}

function turnSignature() {
  return isPlayerTurn() ? 'player-turn' : 'enemy-turn';
}

function ensureStateForTurn() {
  const playerTurn = isPlayerTurn();
  const sig = turnSignature();
  if (!document.querySelector('.battle-bg')) {
    remainingAp = 100;
    lastTurnSignature = '';
    lastWasPlayerTurn = false;
    autoEndInFlight = false;
    return false;
  }
  if (playerTurn && (!lastWasPlayerTurn || sig !== lastTurnSignature)) {
    remainingAp = 100;
    autoEndInFlight = false;
  }
  if (!playerTurn) {
    remainingAp = 100;
    autoEndInFlight = false;
  }
  lastWasPlayerTurn = playerTurn;
  lastTurnSignature = sig;
  return playerTurn;
}

function runSoon() {
  window.cancelAnimationFrame(bridgeFrame);
  bridgeFrame = window.requestAnimationFrame(() => ensureBattleActionEconomy());
}

function spendAp(cost: number) {
  remainingAp = clampAp(remainingAp - cost);
  updateActionEconomyUi();
  window.setTimeout(runSoon, 80);
  window.setTimeout(runSoon, 320);
}

function blockOverBudgetAction(ev: MouseEvent, metaCost: number) {
  if (metaCost <= remainingAp) return false;
  ev.preventDefault();
  ev.stopPropagation();
  ev.stopImmediatePropagation();
  const bar = document.querySelector('.battle-bg .sv-action-economy-bar') as HTMLElement | null;
  bar?.classList.add('is-denied');
  window.setTimeout(() => bar?.classList.remove('is-denied'), 420);
  return true;
}

function markInventoryUtilityRows() {
  document.querySelectorAll('.battle-bg .battle-aux-dropdown > div').forEach((row) => {
    const rowEl = row as HTMLElement;
    const text = textOf(rowEl);
    if (!/(Equip|Draw)\s*→|\bEquipped\b/i.test(text)) return;
    rowEl.dataset.svInventoryUtility = '1';
    rowEl.dataset.svActionKind = 'free';
    rowEl.dataset.svApCost = '0';
    rowEl.title = '0% AP — inventory preparation is free.';
    rowEl.querySelectorAll(':scope > .sv-ap-cost-pill').forEach((pill) => pill.remove());
    const pill = document.createElement('span');
    pill.className = 'sv-ap-cost-pill sv-ap-cost-pill-row';
    pill.textContent = '0%';
    pill.title = 'Inventory preparation is free.';
    rowEl.appendChild(pill);
  });
}

function rewriteInventoryUtilityCopy() {
  document.querySelectorAll('.battle-bg .battle-aux-dropdown div').forEach((node) => {
    const el = node as HTMLElement;
    const direct = Array.from(el.childNodes).find((child) => child.nodeType === Node.TEXT_NODE && /ends turn/i.test(child.textContent || ''));
    if (direct) direct.textContent = (direct.textContent || '').replace(/\s*\(ends turn\)/gi, ' (0% AP)');
  });
}

function isDecoratableActionButton(button: HTMLElement) {
  if (!button.closest('.battle-bg')) return false;
  if (button.closest('.sv-action-economy-bar')) return false;
  if (button.classList.contains('battle-tab')) return true;
  if (button.classList.contains('battle-help-chip')) return true;
  if (button.classList.contains('battle-action-btn')) return true;
  if (button.closest('.battle-aux-row')) return true;
  if (button.dataset.svZeroCostToggle === '1') return true;
  return false;
}

function actionButtons() {
  return Array.from(document.querySelectorAll('.battle-bg button'))
    .map((node) => node as HTMLElement)
    .filter(isDecoratableActionButton);
}

function rawBattleButtons() {
  return Array.from(document.querySelectorAll('.battle-bg button'))
    .map((node) => node as HTMLButtonElement)
    .filter((button) => !button.disabled && !button.closest('.sv-action-economy-bar'));
}

function shouldSuppressVisiblePill(button: HTMLElement) {
  const text = textOf(button);
  if (button.classList.contains('sv-end-turn-btn')) return true;
  if (button.closest('.battle-aux-row')) return true;
  if (/^\s*(🏃\s*)?Flee\s*$/i.test(text)) return true;
  if (/End Turn|Turn Ended/i.test(text)) return true;
  return false;
}

function ensureCostPill(button: HTMLElement) {
  const meta = getBattleActionEconomyMeta(button);
  button.dataset.svActionKind = meta.kind;
  button.dataset.svApCost = String(meta.cost);
  button.title = button.title || meta.note;
  if (shouldSuppressVisiblePill(button)) {
    button.querySelectorAll(':scope > .sv-ap-cost-pill').forEach((pill) => pill.remove());
    return;
  }
  if (meta.cost <= 0 && meta.kind !== 'end') return;
  if (button.classList.contains('battle-tab') || button.classList.contains('battle-help-chip')) return;
  if (button.querySelector(':scope > .sv-ap-cost-pill')) return;

  const pill = document.createElement('span');
  pill.className = 'sv-ap-cost-pill';
  pill.textContent = meta.label;
  pill.title = meta.note;
  button.appendChild(pill);
}

function decorateButtons() {
  actionButtons().forEach((button) => {
    ensureCostPill(button);
    if (button.classList.contains('sv-end-turn-btn')) return;
    if (button.dataset.svApHandler === '1') return;
    button.dataset.svApHandler = '1';
    button.addEventListener('click', (ev) => {
      const playerTurn = isPlayerTurn();
      if (!playerTurn) return;
      const meta = getBattleActionEconomyMeta(button);
      if (meta.cost <= 0) {
        window.setTimeout(runSoon, 80);
        return;
      }
      if (meta.kind !== 'end' && meta.kind !== 'danger' && blockOverBudgetAction(ev, meta.cost)) return;
      spendAp(meta.cost);
    }, { capture: true });
  });
}

function findGuardLikeButton() {
  return rawBattleButtons().find((button) => {
    const text = textOf(button);
    return /\b(Guard|Defend)\b/i.test(text) || (/\bBrace\b/i.test(text) && !/Brace Field/i.test(text));
  });
}

function canAffordAnyNonDangerAction() {
  if (!isPlayerTurn()) return false;
  return actionButtons().some((button) => {
    if ((button as HTMLButtonElement).disabled) return false;
    if (button.classList.contains('sv-end-turn-btn')) return false;
    const meta = getBattleActionEconomyMeta(button);
    if (meta.kind === 'danger' || meta.kind === 'end') return false;
    if (meta.cost <= 0) return false;
    return meta.cost <= remainingAp;
  });
}

function tryAutoEndIfNoActionsRemain() {
  if (autoEndInFlight || !isPlayerTurn()) return;
  if (remainingAp <= 0) {
    const guard = findGuardLikeButton();
    if (guard) {
      autoEndInFlight = true;
      guard.click();
      return;
    }
  }
  if (remainingAp > 0 && !canAffordAnyNonDangerAction()) {
    const guard = findGuardLikeButton();
    if (guard) {
      autoEndInFlight = true;
      guard.click();
    }
  }
}

function ensureEndTurnButton() {
  const auxRow = document.querySelector('.battle-bg .battle-aux-row') as HTMLElement | null;
  if (!auxRow) return;
  if (auxRow.querySelector(':scope > .sv-end-turn-btn')) return;

  const flee = Array.from(auxRow.querySelectorAll('button')).find((button) => /Flee/i.test(textOf(button))) as HTMLElement | undefined;
  const end = document.createElement('button');
  end.type = 'button';
  end.className = 'bt bs sv-end-turn-btn';
  end.dataset.svApCost = '100';
  end.dataset.svActionKind = 'end';
  end.textContent = '⏭ End Turn';
  end.title = 'Ends your turn by triggering Guard/Defend when that engine action is available.';
  end.addEventListener('click', () => {
    if (!isPlayerTurn()) return;
    const guard = findGuardLikeButton();
    if (guard) {
      autoEndInFlight = true;
      guard.click();
      spendAp(100);
      return;
    }
    const bar = document.querySelector('.battle-bg .sv-action-economy-bar') as HTMLElement | null;
    bar?.classList.add('is-denied');
    window.setTimeout(() => bar?.classList.remove('is-denied'), 420);
    end.title = 'No Guard/Defend action is currently exposed by the battle engine. Engine-level skip-turn refactor is still required.';
  });

  if (flee?.nextSibling) auxRow.insertBefore(end, flee.nextSibling);
  else auxRow.appendChild(end);
}

function ensureActionEconomyBar() {
  const actionsCard = document.querySelector('.battle-bg .battle-actions-card') as HTMLElement | null;
  if (!actionsCard) return null;

  let bar = actionsCard.querySelector(':scope > .sv-action-economy-bar') as HTMLElement | null;
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'sv-action-economy-bar';
    bar.innerHTML = `
      <div class="sv-action-economy-topline">
        <span class="sv-action-economy-title">Action Economy</span>
        <span class="sv-action-economy-state"></span>
        <button type="button" class="sv-action-economy-help" aria-label="Action economy help">?</button>
      </div>
      <div class="sv-action-economy-track"><span class="sv-action-economy-fill"></span></div>
      <div class="sv-action-economy-caption"></div>
    `;
    const help = bar.querySelector('.sv-action-economy-help') as HTMLButtonElement | null;
    help?.addEventListener('click', () => {
      window.alert(explainActionEconomyBalance());
    });
    actionsCard.insertBefore(bar, actionsCard.firstChild);
  }
  return bar;
}

function updateActionEconomyUi() {
  const playerTurn = ensureStateForTurn();
  const bar = ensureActionEconomyBar();
  if (!bar) return;

  const state = bar.querySelector('.sv-action-economy-state') as HTMLElement | null;
  const fill = bar.querySelector('.sv-action-economy-fill') as HTMLElement | null;
  const caption = bar.querySelector('.sv-action-economy-caption') as HTMLElement | null;
  const ap = playerTurn ? remainingAp : 0;

  bar.dataset.svApState = playerTurn ? getActionEconomyStateLabel(ap).toLowerCase().replace(/\s+/g, '-') : 'enemy-turn';
  if (state) state.textContent = playerTurn ? `${ap}% · ${getActionEconomyStateLabel(ap)}` : 'Enemy turn';
  if (fill) fill.style.width = getActionEconomyWidth(ap);
  if (caption) caption.textContent = playerTurn
    ? '100% per turn. Primary actions spend the turn; lighter tactics, inventory prep, and Strategic View support tactical play.'
    : 'Action economy refreshes at the start of your next turn.';

  actionButtons().forEach((button) => {
    const meta = getBattleActionEconomyMeta(button);
    const shouldGate = playerTurn && meta.cost > 0 && meta.cost > remainingAp && meta.kind !== 'end' && meta.kind !== 'danger';
    button.classList.toggle('sv-ap-over-budget', shouldGate);
  });
}

export function ensureBattleActionEconomy() {
  if (!document.querySelector('.battle-bg')) return;
  ensureStateForTurn();
  ensureActionEconomyBar();
  ensureEndTurnButton();
  markInventoryUtilityRows();
  rewriteInventoryUtilityCopy();
  decorateButtons();
  updateActionEconomyUi();
  tryAutoEndIfNoActionsRemain();
}

export function startBattleActionEconomyBridge() {
  if (bridgeStarted || typeof window === 'undefined' || typeof document === 'undefined') return;
  bridgeStarted = true;
  const run = runSoon;
  run();
  bridgeObserver = new MutationObserver(run);
  bridgeObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'disabled', 'data-sv-strategic-view', 'data-sv-ap-cost'],
  });
  document.addEventListener('click', run, { passive: true });
  document.addEventListener('pointerup', run, { passive: true });
  window.addEventListener('resize', run, { passive: true });
  bridgeTimer = window.setInterval(run, 450);
}

export function stopBattleActionEconomyBridge() {
  if (!bridgeStarted) return;
  bridgeStarted = false;
  window.cancelAnimationFrame(bridgeFrame);
  bridgeObserver?.disconnect();
  bridgeObserver = null;
  if (bridgeTimer != null) window.clearInterval(bridgeTimer);
  bridgeTimer = null;
}
