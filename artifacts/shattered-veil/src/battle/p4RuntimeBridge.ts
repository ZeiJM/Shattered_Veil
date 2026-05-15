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
const clampAp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function runSoon() {
  window.cancelAnimationFrame(p4RuntimeFrame);
  p4RuntimeFrame = window.requestAnimationFrame(() => ensureP4RuntimeControls());
}

function battleActionsCard() {
  return document.querySelector('.battle-bg .battle-actions-card') as HTMLElement | null;
}

function battleControlRail() {
  return document.querySelector('.battle-bg .sv-battle-control-rail, .battle-bg .battle-info-card') as HTMLElement | null;
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

function legacyTacticalStepButton() {
  return Array.from(document.querySelectorAll('.battle-bg button'))
    .find((button) => /Tactical Step/i.test(textOf(button)) && !button.closest('.sv-p4-combat-movement')) as HTMLButtonElement | undefined;
}

function isArenaMovementModeOn() {
  return !!document.querySelector('.battle-bg .sv-arena-grid.sv-arena-movement-mode');
}

function triggerExistingMovementHook(kind: 'basic_move' | 'strategic_step') {
  const btn = legacyTacticalStepButton();
  if (!btn || btn.disabled) return false;
  if (!isArenaMovementModeOn()) btn.click();
  p4MoveMode = kind;
  const arena = battleArenaPanel();
  if (arena) arena.dataset.svP4MoveKind = kind;
  updateActionEconomyMirror();
  window.setTimeout(runSoon, 60);
  window.setTimeout(runSoon, 180);
  return true;
}

function activeCombatGrid() {
  const actions = battleActionsCard();
  if (!actions) return null;
  const visibleSections = Array.from(actions.querySelectorAll('.battle-section')).filter((section) => {
    const el = section as HTMLElement;
    return getComputedStyle(el).display !== 'none' && !el.classList.contains('battle-aux-shared');
  }) as HTMLElement[];
  const combat = visibleSections.find((section) => /combat/i.test(textOf(section.querySelector('.battle-section-title'))));
  return (combat || visibleSections[0] || actions).querySelector('.battle-action-grid') as HTMLElement | null;
}

function legacyTacticalCardWrap() {
  const button = legacyTacticalStepButton();
  return button?.closest('.battle-action-card-wrap') as HTMLElement | null;
}

function hideLegacyTacticalStep() {
  const wrap = legacyTacticalCardWrap();
  if (wrap) {
    wrap.dataset.svP4HiddenTacticalStep = '1';
    wrap.style.display = 'none';
  }
}

function commandTabLabel(key: string) {
  if (key === 'combat') return { icon: '⚔️', title: 'Combat Arts', hint: 'Weapon arts, movement, and direct pressure.' };
  if (key === 'magic') return { icon: '✦', title: 'Veil Magic', hint: 'Spells, Veil techniques, and magic pressure.' };
  return { icon: '♟', title: 'Battle Tactics', hint: 'Field tools, Strategic View, and tactical setup.' };
}

function polishLeftCommandTabs() {
  document.querySelectorAll('.battle-bg [data-sv-tab-proxy]').forEach((btn) => {
    const b = btn as HTMLElement;
    if (b.dataset.svP4PolishedTab === '1') return;
    const meta = commandTabLabel(b.dataset.svTabProxy || '');
    b.dataset.svP4PolishedTab = '1';
    b.title = meta.hint;
    b.innerHTML = `<span class="sv-command-tab-icon">${meta.icon}</span><span class="sv-command-tab-title">${meta.title}</span><span class="sv-command-tab-pop">${meta.title}<small>${meta.hint}</small></span>`;
  });
}

function restoreAuxiliaryActionsPlacement() {
  const rail = battleControlRail();
  const aux = rail?.querySelector(':scope > .sv-left-aux-proxy-card') as HTMLElement | null;
  const bar = rail?.querySelector(':scope > .sv-action-economy-bar') as HTMLElement | null;
  if (!rail || !aux) return;
  aux.style.display = '';
  aux.style.order = '25';
  if (bar && aux.previousElementSibling !== bar) {
    rail.insertBefore(aux, bar.nextSibling);
  }
}

function updateActionEconomyMirror() {
  const bar = document.querySelector('.battle-bg .sv-action-economy-bar') as HTMLElement | null;
  const state = bar?.querySelector('.sv-action-economy-state') as HTMLElement | null;
  const fill = bar?.querySelector('.sv-action-economy-fill') as HTMLElement | null;
  if (!bar || !state || !fill) return;
  if (!isPlayerTurn()) {
    state.textContent = 'Enemy turn';
    fill.style.width = '0%';
    return;
  }
  const existingAp = Number.parseInt((state.textContent || '').match(/\d+/)?.[0] || '100', 10);
  if (Number.isFinite(existingAp) && existingAp < p4RuntimeAp) p4RuntimeAp = existingAp;
  p4RuntimeAp = clampAp(p4RuntimeAp);
  const label = p4RuntimeAp >= 100 ? 'Ready' : p4RuntimeAp >= 65 ? 'Open' : p4RuntimeAp >= 35 ? 'Limited' : p4RuntimeAp > 0 ? 'Last sliver' : 'Spent';
  state.textContent = `${p4RuntimeAp}% · ${label}`;
  fill.style.width = `${p4RuntimeAp}%`;
  bar.dataset.svP4RuntimeAp = String(p4RuntimeAp);
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

function ensureCombatMovementButtons() {
  resetForNewTurnIfNeeded();
  hideLegacyTacticalStep();
  const grid = activeCombatGrid();
  if (!grid) return;
  let wrap = grid.querySelector(':scope > .sv-p4-combat-movement') as HTMLElement | null;
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'battle-action-card-wrap sv-p4-combat-movement';
    wrap.innerHTML = `
      <button type="button" class="bt battle-action-btn sv-p4-basic-move" data-sv-p4-action="basic_move">
        <div class="sv-p4-card-head">👣 Move</div>
        <div class="sv-p4-card-body">1 tile · 30% AP · repeat while AP remains</div>
      </button>
      <button type="button" class="bt battle-action-btn sv-p4-strategic-step" data-sv-p4-action="strategic_step">
        <div class="sv-p4-card-head">🌀 Strategic Step</div>
        <div class="sv-p4-card-body">Up to 5 tiles instantly · 30% AP once</div>
      </button>
    `;
    wrap.querySelector('.sv-p4-basic-move')?.addEventListener('click', () => {
      if (p4RuntimeAp < P4_ACTION_COSTS.basic_move.cost) return;
      triggerExistingMovementHook('basic_move');
    });
    wrap.querySelector('.sv-p4-strategic-step')?.addEventListener('click', () => {
      if (p4RuntimeAp < P4_ACTION_COSTS.strategic_step.cost || p4StrategicStepUsed) return;
      triggerExistingMovementHook('strategic_step');
    });
  }
  if (wrap.parentElement !== grid) grid.insertBefore(wrap, grid.firstChild);

  const movementOn = isArenaMovementModeOn();
  wrap.classList.toggle('is-selecting', movementOn);
  wrap.dataset.svP4RuntimeAp = String(p4RuntimeAp);
  const basic = wrap.querySelector('.sv-p4-basic-move') as HTMLButtonElement | null;
  const step = wrap.querySelector('.sv-p4-strategic-step') as HTMLButtonElement | null;
  const legacy = legacyTacticalStepButton();
  const sourceDisabled = !legacy || legacy.disabled;
  if (basic) {
    basic.disabled = sourceDisabled || !isPlayerTurn() || p4RuntimeAp < P4_ACTION_COSTS.basic_move.cost;
    basic.title = P4_ACTION_COSTS.basic_move.note;
  }
  if (step) {
    step.disabled = sourceDisabled || !isPlayerTurn() || p4RuntimeAp < P4_ACTION_COSTS.strategic_step.cost || p4StrategicStepUsed;
    step.title = P4_ACTION_COSTS.strategic_step.note;
  }
}

function tileDistanceFromPlayer(tile: Element) {
  const player = document.querySelector('.battle-bg .sv-arena-unit.is-player') as HTMLElement | null;
  const playerTile = player?.closest('.sv-arena-tile') as HTMLElement | null;
  if (!playerTile) return null;
  const grid = document.querySelector('.battle-bg .sv-arena-grid') as HTMLElement | null;
  const rows = Array.from(grid?.querySelectorAll(':scope > .sv-arena-hex-row') || []);
  const firstRowTiles = rows[0]?.querySelectorAll('.sv-arena-tile').length || 0;
  const tiles = Array.from(grid?.querySelectorAll('.sv-arena-tile') || []);
  const tileIndex = tiles.indexOf(tile);
  const playerIndex = tiles.indexOf(playerTile);
  if (tileIndex < 0 || playerIndex < 0 || firstRowTiles <= 0) return null;
  const tx = tileIndex % firstRowTiles;
  const ty = Math.floor(tileIndex / firstRowTiles);
  const px = playerIndex % firstRowTiles;
  const py = Math.floor(playerIndex / firstRowTiles);
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

function installRuntimeStyles() {
  if (document.getElementById('sv-p4-runtime-style')) return;
  const style = document.createElement('style');
  style.id = 'sv-p4-runtime-style';
  style.textContent = `
    .battle-bg .sv-p4-movement-options { display: none !important; }
    .battle-bg .sv-p4-combat-movement {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(160px, 1fr)) !important;
      gap: 7px !important;
      grid-column: 1 / -1 !important;
    }
    .battle-bg .sv-p4-combat-movement > button {
      min-height: 72px !important;
      border-radius: 16px !important;
      text-align: left !important;
      padding: 10px 12px !important;
      border: 1px solid rgba(115,184,255,0.35) !important;
      background: radial-gradient(circle at 10% 0%, rgba(104,187,255,0.18), transparent 48%), rgba(14,24,52,0.92) !important;
      color: #f3f7ff !important;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 8px 18px rgba(0,0,0,0.18) !important;
    }
    .battle-bg .sv-p4-combat-movement .sv-p4-card-head { font-size: 13px !important; font-weight: 900 !important; color: #f8fbff !important; }
    .battle-bg .sv-p4-combat-movement .sv-p4-card-body { margin-top: 4px !important; font-size: 9px !important; color: rgba(222,235,255,0.78) !important; }
    .battle-bg .sv-p4-combat-movement.is-selecting > button { box-shadow: 0 0 18px rgba(86,178,255,0.22), inset 0 0 0 1px rgba(255,255,255,0.08) !important; }
    .battle-bg [data-sv-p4-hidden-tactical-step="1"] { display: none !important; }
    .battle-bg .sv-left-aux-proxy-card { display: block !important; order: 25 !important; }
    .battle-bg .sv-left-command-tabs { order: 30 !important; }
    .battle-bg .sv-left-command-tab-row { display: grid !important; grid-template-columns: 1fr !important; gap: 7px !important; }
    .battle-bg .sv-left-command-tab-row > button {
      position: relative !important;
      min-height: 44px !important;
      border-radius: 15px !important;
      padding: 8px 10px !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      color: #f7edc9 !important;
      background: radial-gradient(circle at 0% 0%, rgba(255,216,107,0.18), transparent 48%), linear-gradient(135deg, rgba(49,36,83,0.96), rgba(12,18,42,0.98)) !important;
      border: 1px solid rgba(255,216,107,0.34) !important;
      box-shadow: 0 7px 16px rgba(0,0,0,0.16), inset 0 0 0 1px rgba(255,255,255,0.05) !important;
    }
    .battle-bg .sv-left-command-tab-row > button.is-active { border-color: rgba(255,216,107,0.76) !important; box-shadow: 0 0 18px rgba(255,216,107,0.20) !important; }
    .battle-bg .sv-command-tab-icon { font-size: 17px !important; filter: drop-shadow(0 0 6px rgba(255,216,107,0.25)); }
    .battle-bg .sv-command-tab-title { font-family: 'Cinzel', serif !important; font-size: 10px !important; font-weight: 900 !important; letter-spacing: 0.06em !important; text-transform: uppercase !important; }
    .battle-bg .sv-command-tab-pop {
      position: absolute !important;
      left: calc(100% + 8px) !important;
      top: 50% !important;
      transform: translateY(-50%) scale(0.96) !important;
      min-width: 190px !important;
      padding: 8px 10px !important;
      border-radius: 12px !important;
      background: rgba(8,12,28,0.96) !important;
      border: 1px solid rgba(255,216,107,0.35) !important;
      color: #ffe6a0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
      z-index: 30 !important;
      box-shadow: 0 10px 24px rgba(0,0,0,0.32) !important;
    }
    .battle-bg .sv-command-tab-pop small { display: block !important; margin-top: 3px !important; color: rgba(230,236,255,0.76) !important; font-family: inherit !important; font-size: 8px !important; letter-spacing: 0 !important; text-transform: none !important; }
    .battle-bg .sv-left-command-tab-row > button:hover .sv-command-tab-pop,
    .battle-bg .sv-left-command-tab-row > button:focus .sv-command-tab-pop,
    .battle-bg .sv-left-command-tab-row > button:active .sv-command-tab-pop { opacity: 1 !important; transform: translateY(-50%) scale(1) !important; }
  `;
  document.head.appendChild(style);
}

export function ensureP4RuntimeControls() {
  if (!document.querySelector('.battle-bg')) return;
  installRuntimeStyles();
  polishLeftCommandTabs();
  restoreAuxiliaryActionsPlacement();
  ensureCombatMovementButtons();
  updateActionEconomyMirror();
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
  p4RuntimeTimer = window.setInterval(runSoon, 250);
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
