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

function arenaRows() {
  return Array.from(arenaGrid()?.querySelectorAll(':scope > .sv-arena-hex-row') || []) as HTMLElement[];
}

function tileCoords(tile: Element | null) {
  if (!tile) return null;
  const row = tile.closest('.sv-arena-hex-row') as HTMLElement | null;
  if (!row) return null;
  const rows = arenaRows();
  const y = rows.indexOf(row);
  const x = Array.from(row.querySelectorAll(':scope > .sv-arena-tile')).indexOf(tile);
  return x >= 0 && y >= 0 ? { x, y } : null;
}

function tileAt(x: number, y: number) {
  const row = arenaRows()[y];
  return row?.querySelectorAll(':scope > .sv-arena-tile')?.[x] as HTMLElement | undefined;
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
    const special = (tile as HTMLElement).dataset.svSpecialTile === '1' ? ' · special terrain' : '';
    hint.textContent = `Occupied: ${label}${special}`;
  });
}

function manhattanPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const path: Array<{ x: number; y: number }> = [];
  let x = from.x;
  let y = from.y;
  const sx = to.x >= from.x ? 1 : -1;
  const sy = to.y >= from.y ? 1 : -1;
  while (x !== to.x) { x += sx; path.push({ x, y }); }
  while (y !== to.y) { y += sy; path.push({ x, y }); }
  return path;
}

function pulseTravelPath(previous: Element, current: Element) {
  const from = tileCoords(previous);
  const to = tileCoords(current);
  if (!from || !to) return;
  const path = manhattanPath(from, to).slice(0, 7);
  path.forEach((step, index) => {
    const tile = tileAt(step.x, step.y);
    if (!tile) return;
    tile.dataset.svP2TravelStep = String(index + 1);
    tile.style.setProperty('--sv-p2-step-delay', `${index * 55}ms`);
    tile.classList.add('sv-p2-travel-step');
    window.setTimeout(() => {
      tile.classList.remove('sv-p2-travel-step');
      delete tile.dataset.svP2TravelStep;
      tile.style.removeProperty('--sv-p2-step-delay');
    }, 900 + index * 55);
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
      pulseTravelPath(previous, tile);
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

function addStrategicViewHint() {
  const panel = arenaPanel();
  if (!panel) return;
  let hint = panel.querySelector(':scope > .sv-p2-strategic-hint') as HTMLElement | null;
  if (!hint) {
    hint = document.createElement('div');
    hint.className = 'sv-p2-strategic-hint';
    panel.appendChild(hint);
  }
  const on = panel.dataset.svStrategicView === 'on';
  hint.textContent = on ? 'Strategic View: tap a tile to inspect terrain, objects, or occupied units.' : 'Strategic View is off — movement and targeting stay focused.';
  hint.dataset.svStrategicView = on ? 'on' : 'off';
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
  addStrategicViewHint();
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
