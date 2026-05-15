import { P4_ACTION_COSTS } from './p4ActionEconomyState';

let p4RuntimeStarted = false;
let p4RuntimeFrame = 0;
let p4RuntimeObserver: MutationObserver | null = null;
let p4RuntimeTimer: number | null = null;
let p4MoveMode: 'basic_move' | 'strategic_step' | null = null;
let p4RuntimeAp = 100;
let p4LastTurnText = '';
let p4StrategicStepUsed = false;
let p4MoveTilesSpent = 0;

const textOf = (el: Element | null) => (el?.textContent || '').replace(/\s+/g, ' ').trim();

function runSoon() {
  window.cancelAnimationFrame(p4RuntimeFrame);
  p4RuntimeFrame = window.requestAnimationFrame(() => ensureP4RuntimeControls());
}

function battleActionsCard() {
  return document.querySelector('.battle-bg .battle-actions-card') as HTMLElement | null;
}

function battleArenaPanel() {
  return document.querySelector('.battle-bg .sv-arena-panel') as HTMLElement | null;
}

function battleTurnText() {
  return textOf(document.querySelector('.battle-bg .battle-turn-head:not(.sv-chronicle-turn-clone), .battle-bg .sv-turn-head-v101'));
}

function isPlayerTurn() {
  const text = battleTurnText();
  return /Your Turn/i.test(text) && !/Enemy Turn/i.test(text);
}

function resetForNewTurnIfNeeded() {
  const turnText = battleTurnText();
  if (!document.querySelector('.battle-bg')) {
    p4MoveMode = null;
    p4RuntimeAp = 100;
    p4LastTurnText = '';
    p4StrategicStepUsed = false;
    p4MoveTilesSpent = 0;
    return;
  }
  if (turnText !== p4LastTurnText) {
    p4LastTurnText = turnText;
    p4MoveMode = null;
    p4RuntimeAp = isPlayerTurn() ? 100 : 0;
    p4StrategicStepUsed = false;
    p4MoveTilesSpent = 0;
    const arena = battleArenaPanel();
    if (arena) delete arena.dataset.svP4MoveKind;
  }
}

function tacticalStepButton() {
  return Array.from(document.querySelectorAll('.battle-bg button'))
    .find((button) => /Tactical Step|Basic Move/i.test(textOf(button)) && !button.closest('.sv-p4-movement-options')) as HTMLButtonElement | undefined;
}

function isArenaMovementModeOn() {
  return !!document.querySelector('.battle-bg .sv-arena-grid.sv-arena-movement-mode');
}

function triggerExistingTacticalStep(kind: 'basic_move' | 'strategic_step') {
  const btn = tacticalStepButton();
  if (!btn || btn.disabled) return false;
  if (!isArenaMovementModeOn()) btn.click();
  p4MoveMode = kind;
  const arena = battleArenaPanel();
  if (arena) arena.dataset.svP4MoveKind = kind;
  window.setTimeout(runSoon, 60);
  window.setTimeout(runSoon, 180);
  return true;
}

function updateActionEconomyMirror() {
  const bar = document.querySelector('.battle-bg .sv-action-economy-bar') as HTMLElement | null;
  const state = bar?.querySelector('.sv-action-economy-state') as HTMLElement | null;
  const fill = bar?.querySelector('.sv-action-economy-fill') as HTMLElement | null;
  if (!bar || !state || !fill || !isPlayerTurn()) return;
  const existingAp = Number.parseInt((state.textContent || '').match(/\d+/)?.[0] || '100', 10);
  if (Number.isFinite(existingAp) && existingAp < p4RuntimeAp) p4RuntimeAp = existingAp;
  state.textContent = `${p4RuntimeAp}% · ${p4RuntimeAp >= 65 ? 'Open' : p4RuntimeAp >= 35 ? 'Limited' : p4RuntimeAp > 0 ? 'Last sliver' : 'Spent'}`;
  fill.style.width = `${Math.max(0, Math.min(100, p4RuntimeAp))}%`;
}

function afterP4MoveCommitted(kind: 'basic_move' | 'strategic_step') {
  const cost = P4_ACTION_COSTS[kind].cost;
  p4RuntimeAp = Math.max(0, p4RuntimeAp - cost);
  if (kind === 'basic_move') p4MoveTilesSpent += 1;
  if (kind === 'strategic_step') p4StrategicStepUsed = true;
  p4MoveMode = null;
  const arena = battleArenaPanel();
  if (arena) delete arena.dataset.svP4MoveKind;
  updateActionEconomyMirror();
  window.setTimeout(runSoon, 80);
}

function ensureP4MovementOptions() {
  resetForNewTurnIfNeeded();
  const actions = battleActionsCard();
  if (!actions) return;
  let panel = actions.querySelector(':scope > .sv-p4-movement-options') as HTMLElement | null;
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'sv-p4-movement-options';
    panel.innerHTML = `
      <div class="sv-p4-movement-copy">
        <span class="sv-p4-movement-title">Movement Options</span>
        <span class="sv-p4-movement-state">Move one tile for 30%, or Strategic Step up to 5 tiles for 30%.</span>
      </div>
      <div class="sv-p4-movement-row">
        <button type="button" class="bt battle-action-btn sv-p4-basic-move" data-sv-p4-action="basic_move">
          <span class="sv-p4-move-name">👣 Move</span>
          <span class="sv-p4-move-note">1 tile · 30% AP</span>
        </button>
        <button type="button" class="bt battle-action-btn sv-p4-strategic-step" data-sv-p4-action="strategic_step">
          <span class="sv-p4-move-name">🌀 Strategic Step</span>
          <span class="sv-p4-move-note">Up to 5 tiles · 30% AP</span>
        </button>
      </div>
    `;
    panel.querySelector('.sv-p4-basic-move')?.addEventListener('click', () => {
      if (p4RuntimeAp < P4_ACTION_COSTS.basic_move.cost) return;
      triggerExistingTacticalStep('basic_move');
    });
    panel.querySelector('.sv-p4-strategic-step')?.addEventListener('click', () => {
      if (p4RuntimeAp < P4_ACTION_COSTS.strategic_step.cost || p4StrategicStepUsed) return;
      triggerExistingTacticalStep('strategic_step');
    });
  }

  const firstGrid = actions.querySelector('.battle-section[style*="block"] .battle-action-grid, .battle-action-grid') as HTMLElement | null;
  if (panel.parentElement !== actions) actions.appendChild(panel);
  if (firstGrid && panel.nextElementSibling !== firstGrid) {
    actions.insertBefore(panel, firstGrid);
  }

  const movementOn = isArenaMovementModeOn();
  panel.classList.toggle('is-selecting', movementOn);
  panel.dataset.svP4RuntimeAp = String(p4RuntimeAp);
  const state = panel.querySelector('.sv-p4-movement-state') as HTMLElement | null;
  if (state) {
    state.textContent = movementOn
      ? (p4MoveMode === 'strategic_step'
        ? 'Strategic Step: choose a highlighted tile up to 5 spaces away. Costs 30% once.'
        : 'Move: choose one adjacent tile. Costs 30% per tile; repeat while AP remains.')
      : `AP ${p4RuntimeAp}% · Move tiles used ${p4MoveTilesSpent}${p4StrategicStepUsed ? ' · Strategic Step used' : ''}`;
  }
  const basic = panel.querySelector('.sv-p4-basic-move') as HTMLButtonElement | null;
  const step = panel.querySelector('.sv-p4-strategic-step') as HTMLButtonElement | null;
  const source = tacticalStepButton();
  const sourceDisabled = !source || source.disabled;
  if (basic) {
    basic.disabled = sourceDisabled || !isPlayerTurn() || p4RuntimeAp < P4_ACTION_COSTS.basic_move.cost;
    basic.title = P4_ACTION_COSTS.basic_move.note;
  }
  if (step) {
    step.disabled = sourceDisabled || !isPlayerTurn() || p4RuntimeAp < P4_ACTION_COSTS.strategic_step.cost || p4StrategicStepUsed;
    step.title = P4_ACTION_COSTS.strategic_step.note;
  }
  updateActionEconomyMirror();
}

function tileDistanceFromPlayer(tile: Element) {
  const player = document.querySelector('.battle-bg .sv-arena-unit.is-player') as HTMLElement | null;
  const playerTile = player?.closest('.sv-arena-tile') as HTMLElement | null;
  if (!playerTile) return null;
  const tiles = Array.from(document.querySelectorAll('.battle-bg .sv-arena-grid .sv-arena-tile'));
  const tileIndex = tiles.indexOf(tile);
  const playerIndex = tiles.indexOf(playerTile);
  const grid = document.querySelector('.battle-bg .sv-arena-grid') as HTMLElement | null;
  const rows = Array.from(grid?.querySelectorAll(':scope > .sv-arena-hex-row') || []);
  const cols = rows[0]?.querySelectorAll('.sv-arena-tile').length || 0;
  if (tileIndex < 0 || playerIndex < 0 || cols <= 0) return null;
  const tx = tileIndex % cols;
  const ty = Math.floor(tileIndex / cols);
  const px = playerIndex % cols;
  const py = Math.floor(playerIndex / cols);
  return Math.abs(tx - px) + Math.abs(ty - py);
}

function gateP4MovementClick(ev: Event) {
  const target = ev.target as Element | null;
  if (!target) return;
  const tile = target.closest('.battle-bg .sv-arena-tile') as HTMLElement | null;
  if (!tile || target.closest('.sv-arena-unit')) return;
  const grid = target.closest('.sv-arena-grid') as HTMLElement | null;
  if (!grid) return;
  if (grid.classList.contains('sv-arena-targeting-mode')) return;
  if (!grid.classList.contains('sv-arena-movement-mode')) {
    ev.preventDefault();
    ev.stopPropagation();
    if (typeof (ev as Event & { stopImmediatePropagation?: () => void }).stopImmediatePropagation === 'function') (ev as Event & { stopImmediatePropagation: () => void }).stopImmediatePropagation();
    return;
  }
  if (!p4MoveMode) return;
  const dist = tileDistanceFromPlayer(tile);
  if (p4MoveMode === 'basic_move' && dist !== 1) {
    ev.preventDefault();
    ev.stopPropagation();
    if (typeof (ev as Event & { stopImmediatePropagation?: () => void }).stopImmediatePropagation === 'function') (ev as Event & { stopImmediatePropagation: () => void }).stopImmediatePropagation();
    return;
  }
  if (p4MoveMode === 'strategic_step' && (dist == null || dist < 1 || dist > 5)) {
    ev.preventDefault();
    ev.stopPropagation();
    if (typeof (ev as Event & { stopImmediatePropagation?: () => void }).stopImmediatePropagation === 'function') (ev as Event & { stopImmediatePropagation: () => void }).stopImmediatePropagation();
    return;
  }
  const kind = p4MoveMode;
  window.setTimeout(() => afterP4MoveCommitted(kind), 40);
}

export function ensureP4RuntimeControls() {
  if (!document.querySelector('.battle-bg')) return;
  ensureP4MovementOptions();
}

export function startP4RuntimeBridge() {
  if (p4RuntimeStarted || typeof window === 'undefined' || typeof document === 'undefined') return;
  p4RuntimeStarted = true;
  runSoon();
  p4RuntimeObserver = new MutationObserver(runSoon);
  p4RuntimeObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'disabled', 'style', 'data-sv-strategic-view'],
  });
  document.addEventListener('click', runSoon, { passive: true });
  document.addEventListener('pointerup', runSoon, { passive: true });
  document.addEventListener('click', gateP4MovementClick, true);
  document.addEventListener('pointerup', gateP4MovementClick, true);
  p4RuntimeTimer = window.setInterval(runSoon, 900);
}

export function stopP4RuntimeBridge() {
  if (!p4RuntimeStarted) return;
  p4RuntimeStarted = false;
  window.cancelAnimationFrame(p4RuntimeFrame);
  p4RuntimeObserver?.disconnect();
  p4RuntimeObserver = null;
  if (p4RuntimeTimer != null) window.clearInterval(p4RuntimeTimer);
  p4RuntimeTimer = null;
  document.removeEventListener('click', gateP4MovementClick, true);
  document.removeEventListener('pointerup', gateP4MovementClick, true);
}
