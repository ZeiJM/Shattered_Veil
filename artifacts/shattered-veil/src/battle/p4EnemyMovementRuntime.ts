let started = false;
let frame = 0;
let timer: number | null = null;
let observer: MutationObserver | null = null;
let lastEnemyTurnKey = '';
let animating = false;

const textOf = (el: Element | null) => (el?.textContent || '').replace(/\s+/g, ' ').trim();

function isEnemyTurn() {
  const turn = textOf(document.querySelector('.battle-bg .battle-turn-head:not(.sv-chronicle-turn-clone), .battle-bg .sv-turn-head-v101'));
  return /Enemy Turn/i.test(turn) && !/Your Turn/i.test(turn);
}

function currentTurnKey() {
  return textOf(document.querySelector('.battle-bg .battle-turn-head:not(.sv-chronicle-turn-clone), .battle-bg .sv-turn-head-v101')) || 'enemy-turn';
}

function arenaGrid() {
  return document.querySelector('.battle-bg .sv-arena-grid') as HTMLElement | null;
}

function tileList() {
  const grid = arenaGrid();
  return Array.from(grid?.querySelectorAll('.sv-arena-tile') || []) as HTMLElement[];
}

function rowWidth() {
  const grid = arenaGrid();
  const firstRow = grid?.querySelector(':scope > .sv-arena-hex-row') as HTMLElement | null;
  const count = firstRow?.querySelectorAll('.sv-arena-tile').length || 0;
  return count > 0 ? count : Math.max(1, Math.round(Math.sqrt(tileList().length || 1)));
}

function indexOfTile(tile: Element | null) {
  if (!tile) return -1;
  return tileList().indexOf(tile as HTMLElement);
}

function toCoord(index: number) {
  const cols = rowWidth();
  return { x: index % cols, y: Math.floor(index / cols), index };
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function findPlayerUnit() {
  return document.querySelector('.battle-bg .sv-arena-unit.is-player, .battle-bg .sv-arena-unit[data-side="player"]') as HTMLElement | null;
}

function findEnemyUnit() {
  const enemies = Array.from(document.querySelectorAll('.battle-bg .sv-arena-unit')) as HTMLElement[];
  return enemies.find((unit) => !unit.classList.contains('is-player') && !/player/i.test(unit.dataset.side || '') && !/ally/i.test(unit.dataset.side || '')) || null;
}

function occupiedTileIndexes() {
  return new Set((Array.from(document.querySelectorAll('.battle-bg .sv-arena-unit')) as HTMLElement[])
    .map((unit) => indexOfTile(unit.closest('.sv-arena-tile')))
    .filter((index) => index >= 0));
}

function chooseEnemyStep(enemyTile: HTMLElement, playerTile: HTMLElement) {
  const enemyIndex = indexOfTile(enemyTile);
  const playerIndex = indexOfTile(playerTile);
  const tiles = tileList();
  const cols = rowWidth();
  if (enemyIndex < 0 || playerIndex < 0 || !cols) return null;
  const enemy = toCoord(enemyIndex);
  const player = toCoord(playerIndex);
  const occupied = occupiedTileIndexes();
  const candidates = [enemyIndex + 1, enemyIndex - 1, enemyIndex + cols, enemyIndex - cols]
    .filter((index) => index >= 0 && index < tiles.length)
    .filter((index) => !occupied.has(index) && index !== playerIndex)
    .map((index) => ({ index, coord: toCoord(index), tile: tiles[index] }))
    .filter((entry) => entry.tile && entry.tile.offsetParent !== null)
    .sort((a, b) => dist(a.coord, player) - dist(b.coord, player));
  const best = candidates[0];
  if (!best || dist(best.coord, player) >= dist(enemy, player)) return null;
  return best;
}

function installStyles() {
  if (document.getElementById('sv-p4-enemy-move-style')) return;
  const style = document.createElement('style');
  style.id = 'sv-p4-enemy-move-style';
  style.textContent = `
    .battle-bg .sv-p4-enemy-step-origin{box-shadow:inset 0 0 0 2px rgba(255,109,109,.32)!important;}
    .battle-bg .sv-p4-enemy-step-dest{box-shadow:inset 0 0 0 2px rgba(255,216,107,.58),0 0 14px rgba(255,216,107,.24)!important;}
    .battle-bg .sv-arena-unit.sv-p4-enemy-moving{transition:transform .42s cubic-bezier(.2,.82,.25,1),filter .42s ease!important;filter:drop-shadow(0 0 12px rgba(255,77,77,.35))!important;z-index:12!important;}
    .battle-bg .sv-arena-unit[data-sv-p4-committed="1"]{filter:drop-shadow(0 0 7px rgba(255,90,90,.18));}
  `;
  document.head.appendChild(style);
}

function appendUnitToTile(unit: HTMLElement, tile: HTMLElement) {
  const existingUnitLayer = tile.querySelector(':scope > .sv-arena-unit-layer, :scope > .sv-unit-layer') as HTMLElement | null;
  const parent = existingUnitLayer || tile;
  parent.appendChild(unit);
  unit.dataset.svP4Committed = '1';
}

function animateEnemyStep() {
  if (animating || !isEnemyTurn()) return;
  const key = currentTurnKey();
  if (key === lastEnemyTurnKey) return;
  const enemy = findEnemyUnit();
  const player = findPlayerUnit();
  const enemyTile = enemy?.closest('.sv-arena-tile') as HTMLElement | null;
  const playerTile = player?.closest('.sv-arena-tile') as HTMLElement | null;
  if (!enemy || !enemyTile || !playerTile) return;
  const step = chooseEnemyStep(enemyTile, playerTile);
  if (!step) {
    lastEnemyTurnKey = key;
    window.dispatchEvent(new CustomEvent('sv:p4-enemy-movement-committed', { detail: { moved: false, reason: 'Enemy holds position.' } }));
    return;
  }

  lastEnemyTurnKey = key;
  animating = true;
  installStyles();
  enemyTile.classList.add('sv-p4-enemy-step-origin');
  step.tile.classList.add('sv-p4-enemy-step-dest');
  const from = enemy.getBoundingClientRect();
  const to = step.tile.getBoundingClientRect();
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  enemy.classList.add('sv-p4-enemy-moving');
  enemy.style.transform = `translate(${dx}px, ${dy}px)`;
  window.dispatchEvent(new CustomEvent('sv:p4-enemy-movement-planned', {
    detail: { moved: true, fromIndex: indexOfTile(enemyTile), toIndex: step.index, dx, dy, reason: 'Enemy advances toward the player.' },
  }));
  window.setTimeout(() => {
    enemy.style.transform = '';
    appendUnitToTile(enemy, step.tile);
    enemy.classList.remove('sv-p4-enemy-moving');
    enemyTile.classList.remove('sv-p4-enemy-step-origin');
    step.tile.classList.remove('sv-p4-enemy-step-dest');
    window.dispatchEvent(new CustomEvent('sv:p4-enemy-movement-committed', {
      detail: { moved: true, fromIndex: indexOfTile(enemyTile), toIndex: step.index, reason: 'Enemy committed one tile toward the player.' },
    }));
    animating = false;
  }, 520);
}

function runSoon() {
  window.cancelAnimationFrame(frame);
  frame = window.requestAnimationFrame(animateEnemyStep);
}

export function startP4EnemyMovementRuntime() {
  if (started || typeof window === 'undefined' || typeof document === 'undefined') return;
  started = true;
  installStyles();
  runSoon();
  observer = new MutationObserver(runSoon);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  document.addEventListener('click', runSoon, { passive: true });
  timer = window.setInterval(runSoon, 350);
}

export function stopP4EnemyMovementRuntime() {
  if (!started) return;
  started = false;
  window.cancelAnimationFrame(frame);
  observer?.disconnect();
  observer = null;
  if (timer != null) window.clearInterval(timer);
  timer = null;
}
