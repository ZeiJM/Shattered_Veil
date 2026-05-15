import { P4_ACTION_COSTS } from './p4ActionEconomyState';

let p4RuntimeStarted = false;
let p4RuntimeFrame = 0;
let p4RuntimeObserver: MutationObserver | null = null;
let p4RuntimeTimer: number | null = null;

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

function tacticalStepButton() {
  return Array.from(document.querySelectorAll('.battle-bg button'))
    .find((button) => /Tactical Step|Basic Move/i.test(textOf(button)) && !button.closest('.sv-p4-movement-options')) as HTMLButtonElement | undefined;
}

function isArenaMovementModeOn() {
  return !!document.querySelector('.battle-bg .sv-arena-grid.sv-arena-movement-mode');
}

function triggerExistingTacticalStep() {
  const btn = tacticalStepButton();
  if (!btn || btn.disabled) return false;
  btn.click();
  window.setTimeout(runSoon, 60);
  window.setTimeout(runSoon, 180);
  return true;
}

function ensureP4MovementOptions() {
  const actions = battleActionsCard();
  if (!actions) return;
  let panel = actions.querySelector(':scope > .sv-p4-movement-options') as HTMLElement | null;
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'sv-p4-movement-options';
    panel.innerHTML = `
      <div class="sv-p4-movement-copy">
        <span class="sv-p4-movement-title">Movement Options</span>
        <span class="sv-p4-movement-state">Basic Move and Strategic Step share the same movement range.</span>
      </div>
      <div class="sv-p4-movement-row">
        <button type="button" class="bt battle-action-btn sv-p4-basic-move" data-sv-p4-action="basic_move">
          <span class="sv-p4-move-name">👣 Basic Move</span>
          <span class="sv-p4-move-note">Move stat range · 0% AP</span>
        </button>
        <button type="button" class="bt battle-action-btn sv-p4-strategic-step" data-sv-p4-action="strategic_step">
          <span class="sv-p4-move-name">🌀 Strategic Step</span>
          <span class="sv-p4-move-note">Same range · 35% AP</span>
        </button>
      </div>
    `;
    panel.querySelector('.sv-p4-basic-move')?.addEventListener('click', () => {
      const on = triggerExistingTacticalStep();
      if (!on) return;
      const arena = battleArenaPanel();
      if (arena) arena.dataset.svP4MoveKind = 'basic_move';
    });
    panel.querySelector('.sv-p4-strategic-step')?.addEventListener('click', () => {
      const on = triggerExistingTacticalStep();
      if (!on) return;
      const arena = battleArenaPanel();
      if (arena) arena.dataset.svP4MoveKind = 'strategic_step';
    });
  }

  const firstGrid = actions.querySelector('.battle-section[style*="block"] .battle-action-grid, .battle-action-grid') as HTMLElement | null;
  if (panel.parentElement !== actions) actions.appendChild(panel);
  if (firstGrid && panel.nextElementSibling !== firstGrid) {
    actions.insertBefore(panel, firstGrid);
  }

  const movementOn = isArenaMovementModeOn();
  panel.classList.toggle('is-selecting', movementOn);
  const state = panel.querySelector('.sv-p4-movement-state') as HTMLElement | null;
  if (state) state.textContent = movementOn
    ? 'Select a highlighted tile on the arena. Tap the movement button again to cancel.'
    : 'Basic Move and Strategic Step share the same movement range.';
  const basic = panel.querySelector('.sv-p4-basic-move') as HTMLButtonElement | null;
  const step = panel.querySelector('.sv-p4-strategic-step') as HTMLButtonElement | null;
  const source = tacticalStepButton();
  const disabled = !source || source.disabled;
  if (basic) {
    basic.disabled = disabled;
    basic.title = P4_ACTION_COSTS.basic_move.note;
  }
  if (step) {
    step.disabled = disabled;
    step.title = P4_ACTION_COSTS.strategic_step.note;
  }
}

function blockUnarmedArenaMove(ev: Event) {
  const target = ev.target as Element | null;
  if (!target) return;
  if (!target.closest('.battle-bg .sv-arena-tile')) return;
  if (target.closest('.sv-arena-unit')) return;
  const grid = target.closest('.sv-arena-grid') as HTMLElement | null;
  if (!grid) return;
  if (grid.classList.contains('sv-arena-movement-mode')) return;
  if (grid.classList.contains('sv-arena-targeting-mode')) return;
  ev.preventDefault();
  ev.stopPropagation();
  if (typeof (ev as Event & { stopImmediatePropagation?: () => void }).stopImmediatePropagation === 'function') {
    (ev as Event & { stopImmediatePropagation: () => void }).stopImmediatePropagation();
  }
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
  document.addEventListener('click', blockUnarmedArenaMove, true);
  document.addEventListener('pointerup', blockUnarmedArenaMove, true);
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
  document.removeEventListener('click', blockUnarmedArenaMove, true);
  document.removeEventListener('pointerup', blockUnarmedArenaMove, true);
}
