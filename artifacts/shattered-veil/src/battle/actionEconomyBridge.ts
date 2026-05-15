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

function battleControlRail() {
  const rail = document.querySelector('.battle-bg .battle-info-card') as HTMLElement | null;
  if (!rail) return null;
  rail.classList.add('sv-battle-control-rail');
  rail.dataset.svBattleControlRail = '1';
  return rail;
}

function battleActionsCard() {
  return document.querySelector('.battle-bg .battle-actions-card') as HTMLElement | null;
}

function battleLogCard() {
  return document.querySelector('.battle-bg .battle-log-card') as HTMLElement | null;
}

function battleArenaPanel() {
  return document.querySelector('.battle-bg .sv-arena-panel') as HTMLElement | null;
}

function requestPurePassTurn() {
  if (!isPlayerTurn()) return false;
  autoEndInFlight = true;
  remainingAp = 0;
  window.dispatchEvent(new CustomEvent('sv:battle-pass-turn', { detail: { source: 'action-economy' } }));
  document.dispatchEvent(new CustomEvent('sv:battle-pass-turn', { detail: { source: 'action-economy' } }));
  updateActionEconomyUi();
  window.setTimeout(runSoon, 100);
  return true;
}

function syncChronicleTurnClone() {
  const logCard = battleLogCard();
  const head = document.querySelector('.battle-bg .battle-actions-card .battle-turn-head, .battle-bg .battle-turn-head:not(.sv-chronicle-turn-clone)') as HTMLElement | null;
  if (!logCard || !head) return;

  let clone = logCard.querySelector(':scope > .sv-chronicle-turn-clone') as HTMLElement | null;
  if (!clone) {
    clone = document.createElement('div');
    clone.className = 'battle-turn-head sv-chronicle-turn-clone';
    logCard.insertBefore(clone, logCard.firstChild);
  }

  const turn = /Enemy Turn/i.test(textOf(head)) ? 'Enemy Turn' : (/Your Turn/i.test(textOf(head)) ? 'Your Turn' : 'Battle Turn');
  const timer = textOf(head.querySelector('.sv-turn-timer')) || '';
  const note = /Enemy Turn/i.test(textOf(head)) ? 'Await enemy actions.' : '';
  clone.innerHTML = '';
  const turnEl = document.createElement('span');
  turnEl.className = 'sv-chronicle-turn-label';
  turnEl.textContent = turn;
  const timerEl = document.createElement('span');
  timerEl.className = 'sv-turn-timer sv-chronicle-timer';
  timerEl.textContent = timer;
  clone.append(turnEl, timerEl);
  if (note) {
    const noteEl = document.createElement('span');
    noteEl.className = 'sv-chronicle-turn-note';
    noteEl.textContent = note;
    clone.append(noteEl);
  }
}

function updateLeftStrategicViewCard() {
  const panel = battleArenaPanel();
  const card = document.querySelector('.battle-bg .sv-left-strategic-view-card') as HTMLElement | null;
  if (!panel || !card) return;
  const isOn = panel.dataset.svStrategicView === 'on';
  const state = card.querySelector('.sv-left-strategic-state') as HTMLElement | null;
  const button = card.querySelector('.sv-left-strategic-toggle') as HTMLButtonElement | null;
  if (state) state.textContent = isOn
    ? 'ON · inspect only; movement clicks are locked.'
    : 'OFF · grid accepts movement and targeting.';
  if (button) {
    button.textContent = isOn ? 'Turn Off' : 'Turn On';
    button.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    button.title = isOn ? 'Turn Strategic View off' : 'Turn Strategic View on';
  }
}

function ensureLeftStrategicViewCard() {
  const rail = battleControlRail();
  const panel = battleArenaPanel();
  if (!rail || !panel) return;
  if (!panel.dataset.svStrategicView) panel.dataset.svStrategicView = 'off';

  let card = rail.querySelector(':scope > .sv-left-strategic-view-card') as HTMLElement | null;
  if (!card) {
    card = document.createElement('section');
    card.className = 'sv-left-strategic-view-card';
    card.innerHTML = `
      <div class="sv-left-strategic-copy">
        <span class="sv-left-strategic-title">Strategic View</span>
        <span class="sv-left-strategic-state"></span>
      </div>
      <button type="button" class="sv-left-strategic-toggle" data-sv-zero-cost-toggle="1"></button>
    `;
    const button = card.querySelector('.sv-left-strategic-toggle') as HTMLButtonElement | null;
    button?.addEventListener('click', () => {
      const arenaPanel = battleArenaPanel();
      if (!arenaPanel) return;
      const next = arenaPanel.dataset.svStrategicView === 'on' ? 'off' : 'on';
      arenaPanel.dataset.svStrategicView = next;
      updateLeftStrategicViewCard();
      window.dispatchEvent(new CustomEvent('sv:strategic-view-toggle', { detail: { state: next } }));
      window.setTimeout(runSoon, 50);
    });
    const aux = rail.querySelector(':scope > .battle-aux-shared') as HTMLElement | null;
    rail.insertBefore(card, aux || null);
  }
  updateLeftStrategicViewCard();
}

function moveAuxiliaryActionsToRail() {
  const rail = battleControlRail();
  const aux = document.querySelector('.battle-bg .battle-aux-shared[data-battle-aux]') as HTMLElement | null;
  if (!rail || !aux) return;
  aux.classList.add('sv-left-aux-card');
  aux.dataset.svLeftRailAux = '1';
  if (aux.parentElement === rail) return;
  rail.appendChild(aux);
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

function shouldSuppressVisiblePill(button: HTMLElement) {
  const text = textOf(button);
  if (button.classList.contains('sv-end-turn-btn')) return true;
  if (button.closest('.battle-aux-row')) return true;
  if (/^\s*(🏃\s*)?Flee\s*$/i.test(text)) return true;
  if (/End Turn|Turn Passed/i.test(text)) return true;
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
  if (remainingAp <= 0 || !canAffordAnyNonDangerAction()) requestPurePassTurn();
}

function ensureEndTurnButton() {
  const auxRow = document.querySelector('.battle-bg .battle-aux-row') as HTMLElement | null;
  if (!auxRow) return;
  const existing = auxRow.querySelector(':scope > .sv-end-turn-btn') as HTMLButtonElement | null;
  if (existing) {
    if (/⏭|>>|»/.test(existing.textContent || '')) existing.textContent = /Passed/i.test(existing.textContent || '') ? 'Turn Passed' : 'End Turn';
    return;
  }

  const flee = Array.from(auxRow.querySelectorAll('button')).find((button) => /Flee/i.test(textOf(button))) as HTMLElement | undefined;
  const end = document.createElement('button');
  end.type = 'button';
  end.className = 'bt bs sv-end-turn-btn';
  end.dataset.svApCost = '100';
  end.dataset.svActionKind = 'end';
  end.textContent = 'End Turn';
  end.title = 'Pass the rest of your turn. Does not Guard, Defend, buff, heal, or apply any hidden action.';
  end.addEventListener('click', () => {
    if (!isPlayerTurn()) return;
    requestPurePassTurn();
    end.textContent = 'Turn Passed';
  });

  if (flee?.nextSibling) auxRow.insertBefore(end, flee.nextSibling);
  else auxRow.appendChild(end);
}

function ensureActionEconomyBar() {
  const actionsCard = battleActionsCard();
  const rail = battleControlRail();
  const target = rail || actionsCard;
  if (!target) return null;

  let bar = document.querySelector('.battle-bg .sv-action-economy-bar') as HTMLElement | null;
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
  }

  if (bar.parentElement !== target) {
    const strategic = target.querySelector(':scope > .sv-left-strategic-view-card, :scope > .sv-strategic-view-bar') as HTMLElement | null;
    const aux = target.querySelector(':scope > .battle-aux-shared') as HTMLElement | null;
    target.insertBefore(bar, strategic || aux || null);
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

function blockStrategicMovementInput(ev: Event) {
  const target = ev.target as Element | null;
  const panel = target?.closest?.('.battle-bg .sv-arena-panel') as HTMLElement | null;
  if (!panel || panel.dataset.svStrategicView !== 'on') return;
  if (!target?.closest('.sv-arena-tile')) return;
  ev.preventDefault();
  ev.stopPropagation();
  if (typeof (ev as Event & { stopImmediatePropagation?: () => void }).stopImmediatePropagation === 'function') {
    (ev as Event & { stopImmediatePropagation: () => void }).stopImmediatePropagation();
  }
}

export function ensureBattleActionEconomy() {
  if (!document.querySelector('.battle-bg')) return;
  ensureStateForTurn();
  syncChronicleTurnClone();
  ensureActionEconomyBar();
  ensureLeftStrategicViewCard();
  moveAuxiliaryActionsToRail();
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
  document.addEventListener('click', blockStrategicMovementInput, true);
  document.addEventListener('pointerup', blockStrategicMovementInput, true);
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
  document.removeEventListener('click', blockStrategicMovementInput, true);
  document.removeEventListener('pointerup', blockStrategicMovementInput, true);
}
