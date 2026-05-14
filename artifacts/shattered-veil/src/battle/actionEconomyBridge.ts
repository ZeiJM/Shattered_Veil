import {
  explainActionEconomyBalance,
  getActionEconomyStateLabel,
  getActionEconomyWidth,
  getBattleActionEconomyMeta,
} from './actionEconomy';

let remainingAp = 100;
let lastTurnSignature = '';
let lastWasPlayerTurn = false;

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
    return false;
  }
  if (playerTurn && (!lastWasPlayerTurn || sig !== lastTurnSignature)) {
    remainingAp = 100;
  }
  if (!playerTurn) {
    remainingAp = 100;
  }
  lastWasPlayerTurn = playerTurn;
  lastTurnSignature = sig;
  return playerTurn;
}

function spendAp(cost: number) {
  remainingAp = clampAp(remainingAp - cost);
  updateActionEconomyUi();
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

function ensureCostPill(button: HTMLElement) {
  const meta = getBattleActionEconomyMeta(button);
  button.dataset.svActionKind = meta.kind;
  button.dataset.svApCost = String(meta.cost);
  button.title = button.title || meta.note;

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
      if (meta.cost <= 0) return;
      if (meta.kind !== 'end' && meta.kind !== 'danger' && blockOverBudgetAction(ev, meta.cost)) return;
      spendAp(meta.cost);
    }, { capture: true });
  });
}

function findGuardLikeButton() {
  return actionButtons().find((button) => {
    if ((button as HTMLButtonElement).disabled) return false;
    const text = textOf(button);
    return /Guard|Defend|Brace/i.test(text) && !/Brace Field/i.test(text);
  }) as HTMLButtonElement | undefined;
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
  end.title = 'Ends your turn. Uses Guard/Defend automatically when available.';
  end.addEventListener('click', () => {
    if (!isPlayerTurn()) return;
    const guard = findGuardLikeButton();
    if (guard) {
      guard.click();
      spendAp(100);
      return;
    }
    spendAp(100);
    end.disabled = true;
    end.textContent = '⏭ Turn Ended';
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
    ? '100% per turn. Primary actions spend the turn; lighter tactics and Strategic View support tactical play.'
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
  decorateButtons();
  updateActionEconomyUi();
}
