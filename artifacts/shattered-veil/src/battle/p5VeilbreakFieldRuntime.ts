import {
  buildP5VeilbreakField,
  describeP5Field,
  diffP5FieldOccupancy,
  getP5AffordableFieldUpgrades,
  getP5FieldTileIndexes,
  type P5VeilbreakField,
} from './p5VeilbreakFields';

let started = false;
let frame = 0;
let timer: number | null = null;
let observer: MutationObserver | null = null;
let activeField: P5VeilbreakField | null = null;
let lastOccupants = new Set<string>();
let lastSummary = '';

function textOf(el: Element | null) {
  return (el?.textContent || '').replace(/\s+/g, ' ').trim();
}

function isBattleScreen() {
  return !!document.querySelector('.battle-bg');
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

function findPlayerUnit() {
  return document.querySelector('.battle-bg .sv-arena-unit.is-player, .battle-bg .sv-arena-unit[data-side="player"]') as HTMLElement | null;
}

function unitId(unit: HTMLElement, fallback: number) {
  return unit.dataset.unitId || unit.dataset.id || unit.getAttribute('aria-label') || textOf(unit) || `unit_${fallback}`;
}

function currentMp() {
  const candidates = Array.from(document.querySelectorAll('.battle-bg *')) as HTMLElement[];
  for (const el of candidates) {
    const txt = textOf(el);
    const match = txt.match(/\bMP\s*[: ]\s*(\d+)\s*\/\s*(\d+)/i) || txt.match(/\b(\d+)\s*\/\s*(\d+)\s*MP\b/i);
    if (match) return Number(match[1]) || 0;
  }
  return 0;
}

function inferFieldFromDom() {
  const player = findPlayerUnit();
  const originIndex = indexOfTile(player?.closest('.sv-arena-tile') || null);
  if (originIndex < 0) return null;
  const mp = currentMp();
  const upgrade = getP5AffordableFieldUpgrades(mp).sort((a, b) => b.radiusBonus - a.radiusBonus)[0];
  const vbLabel = textOf(document.querySelector('.battle-bg [class*="veilbreak"], .battle-bg [class*="Veilbreak"]')) || 'Veilbreak Field';
  return buildP5VeilbreakField({
    ult: { name: vbLabel.slice(0, 72) || 'Veilbreak Field' },
    owner: 'player',
    originIndex,
    mpSpentOnRange: upgrade?.mpCost || 0,
  });
}

function ensureField() {
  if (activeField && activeField.originIndex >= 0) return activeField;
  activeField = inferFieldFromDom();
  return activeField;
}

function affectedIndexes(field: P5VeilbreakField) {
  const tiles = tileList();
  return getP5FieldTileIndexes({
    originIndex: field.originIndex,
    radius: field.radius,
    cols: rowWidth(),
    tileCount: tiles.length,
    validIndexes: tiles.map((_, index) => index),
  });
}

function clearFieldClasses() {
  tileList().forEach((tile) => {
    tile.classList.remove('sv-p5-vb-field-tile', 'sv-p5-vb-field-origin');
    delete tile.dataset.svP5FieldRadius;
    delete tile.dataset.svP5FieldName;
  });
}

function paintField(field: P5VeilbreakField) {
  clearFieldClasses();
  const tiles = tileList();
  affectedIndexes(field).forEach((index) => {
    const tile = tiles[index];
    if (!tile) return;
    tile.classList.add('sv-p5-vb-field-tile');
    tile.dataset.svP5FieldRadius = String(field.radius);
    tile.dataset.svP5FieldName = field.fieldName;
  });
  const origin = tiles[field.originIndex];
  origin?.classList.add('sv-p5-vb-field-origin');
}

function occupantsInside(field: P5VeilbreakField) {
  const indexes = new Set(affectedIndexes(field));
  const ids = new Set<string>();
  (Array.from(document.querySelectorAll('.battle-bg .sv-arena-unit')) as HTMLElement[]).forEach((unit, i) => {
    const index = indexOfTile(unit.closest('.sv-arena-tile'));
    if (indexes.has(index)) ids.add(unitId(unit, i));
  });
  return ids;
}

function logContainer() {
  return document.querySelector('.battle-bg .blog-sel, .battle-bg .battle-log-card') as HTMLElement | null;
}

function appendLog(message: string, key: string) {
  const log = logContainer();
  if (!log || !message) return;
  if (log.querySelector(`[data-sv-p5-field-log="${CSS.escape(key)}"]`)) return;
  const row = document.createElement('div');
  row.className = 'battle-log-entry sv-p5-vb-field-log';
  row.dataset.svP5FieldLog = key;
  row.textContent = message;
  log.insertBefore(row, log.firstChild);
}

function syncField() {
  if (!isBattleScreen()) return;
  const field = ensureField();
  if (!field) return;
  paintField(field);
  const occupants = occupantsInside(field);
  const diff = diffP5FieldOccupancy(lastOccupants, occupants);
  if (diff.entered.length) appendLog(`Veilbreak Field: ${diff.entered.length} unit(s) entered ${field.fieldName}.`, `enter_${field.createdAt}_${diff.entered.join('_')}`);
  if (diff.exited.length) appendLog(`Veilbreak Field: ${diff.exited.length} unit(s) left ${field.fieldName}.`, `exit_${field.createdAt}_${diff.exited.join('_')}`);
  lastOccupants = occupants;
  const summary = describeP5Field(field);
  if (summary && summary !== lastSummary) {
    lastSummary = summary;
    appendLog(`Veilbreak Field ready — ${summary}`, `summary_${field.createdAt}_${field.radius}`);
  }
  window.dispatchEvent(new CustomEvent('sv:p5-veilbreak-field-state', { detail: { field, occupants: Array.from(occupants), affectedIndexes: affectedIndexes(field) } }));
}

function installStyles() {
  if (document.getElementById('sv-p5-veilbreak-field-style')) return;
  const style = document.createElement('style');
  style.id = 'sv-p5-veilbreak-field-style';
  style.textContent = `
    .battle-bg .sv-p5-vb-field-tile{box-shadow:inset 0 0 0 2px rgba(184,125,255,.24),0 0 16px rgba(155,93,255,.13)!important;}
    .battle-bg .sv-p5-vb-field-origin{box-shadow:inset 0 0 0 2px rgba(244,219,139,.68),0 0 20px rgba(244,219,139,.22)!important;}
    .battle-bg .sv-p5-vb-field-log{color:rgba(230,212,255,.95)!important;border-left:2px solid rgba(184,125,255,.64)!important;padding-left:7px!important;background:rgba(155,93,255,.055)!important;}
  `;
  document.head.appendChild(style);
}

function runSoon() {
  window.cancelAnimationFrame(frame);
  frame = window.requestAnimationFrame(syncField);
}

export function startP5VeilbreakFieldRuntime() {
  if (started || typeof window === 'undefined' || typeof document === 'undefined') return;
  started = true;
  installStyles();
  runSoon();
  window.addEventListener('sv:p4-final-battle-state', runSoon as EventListener);
  window.addEventListener('sv:p4-integration-snapshot', runSoon as EventListener);
  observer = new MutationObserver(runSoon);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'data-sv-p4-committed'] });
  timer = window.setInterval(runSoon, 650);
}

export function stopP5VeilbreakFieldRuntime() {
  if (!started || typeof window === 'undefined') return;
  started = false;
  window.cancelAnimationFrame(frame);
  window.removeEventListener('sv:p4-final-battle-state', runSoon as EventListener);
  window.removeEventListener('sv:p4-integration-snapshot', runSoon as EventListener);
  observer?.disconnect();
  observer = null;
  clearFieldClasses();
  if (timer != null) window.clearInterval(timer);
  timer = null;
  activeField = null;
  lastOccupants = new Set<string>();
}

if (typeof window !== 'undefined') {
  window.setTimeout(() => startP5VeilbreakFieldRuntime(), 0);
}
