let started = false;
let frame = 0;
let observer: MutationObserver | null = null;
let timer: number | null = null;
const lastUnitTile = new WeakMap<Element, Element>();

const textOf = (el: Element | null) => (el?.textContent || '').replace(/\s+/g, ' ').trim();

function arenaPanel() {
  return document.querySelector('.battle-bg .sv-arena-panel') as HTMLElement | null;
}

function arenaGrid() {
  return document.querySelector('.battle-bg .sv-arena-grid') as HTMLElement | null;
}

function defaultStrategicViewOff() {
  const panel = arenaPanel();
  if (!panel) return;
  if (!panel.dataset.svP2StrategicDefaulted) {
    panel.dataset.svP2StrategicDefaulted = '1';
    panel.dataset.svStrategicView = 'off';
    panel.classList.add('sv-p2-strategic-defaulted');
  }
}

function syncStrategicViewButtonLabels() {
  document.querySelectorAll('.battle-bg [data-sv-zero-cost-toggle="1"], .battle-bg button').forEach((btn) => {
    const b = btn as HTMLButtonElement;
    const text = textOf(b);
    if (!/Strategic View|Turn On|Turn Off/i.test(text)) return;
    const panel = arenaPanel();
    const on = panel?.dataset.svStrategicView === 'on';
    if (/Strategic View/i.test(text) || b.dataset.svZeroCostToggle === '1') {
      b.dataset.svZeroCostToggle = '1';
      b.textContent = on ? 'Strategic View: ON' : 'Strategic View: OFF';
      b.title = on ? 'Inspection mode is active. Tap tiles to inspect terrain, objects, and units.' : '0 AP. Turn on to inspect battlefield tiles without moving.';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  });
}

function gateFreeInspection() {
  const panel = arenaPanel();
  if (!panel) return;
  const on = panel.dataset.svStrategicView === 'on';
  panel.dataset.svStrategicView = on ? 'on' : 'off';
  const grid = arenaGrid();
  if (grid && !grid.classList.contains('sv-arena-movement-mode') && !grid.classList.contains('sv-arena-targeting-mode') && !on) {
    grid.querySelectorAll('.is-hover, .is-inspected, .sv-tile-inspected').forEach((el) => {
      el.classList.remove('is-hover', 'is-inspected', 'sv-tile-inspected');
    });
  }
}

function markOccupiedAndSpecialTiles() {
  document.querySelectorAll('.battle-bg .sv-arena-tile').forEach((tile) => {
    const t = tile as HTMLElement;
    const unit = t.querySelector('.sv-arena-unit');
    if (unit) t.dataset.svOccupiedTile = '1';
    else delete t.dataset.svOccupiedTile;
    const txt = textOf(t);
    if (/shrine|rune|field|hazard|cover|water|ice|fire|void|altar|crystal|forest|stone|wall/i.test(txt) || /terrain|field|special|hazard/i.test(t.className)) {
      t.dataset.svSpecialTile = '1';
    }
  });
}

function addOccupiedPopupHints() {
  document.querySelectorAll('.battle-bg .sv-arena-tile[data-sv-occupied-tile="1"]').forEach((tile) => {
    const unit = tile.querySelector('.sv-arena-unit') as HTMLElement | null;
    if (!unit) return;
    const label = unit.getAttribute('aria-label') || unit.title || textOf(unit) || 'Occupied tile';
    let hint = tile.querySelector(':scope > .sv-p2-occupied-info') as HTMLElement | null;
    if (!hint) {
      hint = document.createElement('span');
      hint.className = 'sv-p2-occupied-info';
      tile.appendChild(hint);
    }
    hint.textContent = `Occupied: ${label}`;
  });
}

function pulseMovingUnits() {
  document.querySelectorAll('.battle-bg .sv-arena-unit').forEach((unit) => {
    const tile = unit.closest('.sv-arena-tile');
    if (!tile) return;
    const previous = lastUnitTile.get(unit);
    if (previous && previous !== tile) {
      const u = unit as HTMLElement;
      const t = tile as HTMLElement;
      u.dataset.svP2UnitMoving = '1';
      t.classList.add('sv-p2-travel-pulse');
      window.setTimeout(() => {
        delete u.dataset.svP2UnitMoving;
        t.classList.remove('sv-p2-travel-pulse');
      }, 540);
    }
    lastUnitTile.set(unit, tile);
  });
}

function hideMovementHighlightsWhenIdle() {
  const grid = arenaGrid();
  if (!grid) return;
  const active = grid.classList.contains('sv-arena-movement-mode') || grid.classList.contains('sv-arena-targeting-mode');
  if (active) return;
  grid.querySelectorAll('.is-in-move, .sv-move-highlight, .sv-arena-move-highlight').forEach((el) => {
    (el as HTMLElement).dataset.svP2IdleMoveHidden = '1';
  });
}

function run() {
  if (!document.querySelector('.battle-bg')) return;
  defaultStrategicViewOff();
  syncStrategicViewButtonLabels();
  gateFreeInspection();
  markOccupiedAndSpecialTiles();
  addOccupiedPopupHints();
  pulseMovingUnits();
  hideMovementHighlightsWhenIdle();
}

function runSoon() {
  window.cancelAnimationFrame(frame);
  frame = window.requestAnimationFrame(run);
}

export function startP2BattlefieldPolish() {
  if (started || typeof window === 'undefined' || typeof document === 'undefined') return;
  started = true;
  runSoon();
  observer = new MutationObserver(runSoon);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'data-sv-strategic-view'] });
  document.addEventListener('click', runSoon, { passive: true });
  document.addEventListener('pointerup', runSoon, { passive: true });
  window.addEventListener('resize', runSoon, { passive: true });
  timer = window.setInterval(runSoon, 500);
}

export function stopP2BattlefieldPolish() {
  if (!started) return;
  started = false;
  window.cancelAnimationFrame(frame);
  observer?.disconnect();
  observer = null;
  if (timer != null) window.clearInterval(timer);
  timer = null;
  document.removeEventListener('click', runSoon);
  document.removeEventListener('pointerup', runSoon);
  window.removeEventListener('resize', runSoon);
}
