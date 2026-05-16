import {
  buildP5VeilbreakField,
  describeP5Field,
  diffP5FieldOccupancy,
  getP5AffordableFieldUpgrades,
  getP5FieldTileIndexes,
  P5_FIELD_RANGE_UPGRADES,
  type P5VeilbreakField,
} from './p5VeilbreakFields';
import {
  describeP5InfluenceSnapshot,
  updateP5FieldInfluences,
  type P5UnitFieldInfluence,
} from './p5FieldInfluenceState';
import {
  createP5FieldDurationState,
  describeP5FieldTick,
  latestP5FieldTick,
  tickP5FieldDuration,
  type P5FieldDurationState,
} from './p5FieldTickState';
import {
  buildP5FieldEffectPlans,
  describeP5FieldEffectPlans,
} from './p5FieldEffectPlans';

let started = false;
let frame = 0;
let timer: number | null = null;
let observer: MutationObserver | null = null;
let activeField: P5VeilbreakField | null = null;
let durationState: P5FieldDurationState | null = null;
let fieldActivated = false;
let activatedAt = 0;
let lastTickId = '';
let lastEffectPlanTickId = '';
let lastOccupants = new Set<string>();
let lastInfluences = new Map<string, P5UnitFieldInfluence>();
let lastInfluenceSummary = '';
let lastSummary = '';
let selectedMpSpend = 0;

function textOf(el: Element | null) {
  return (el?.textContent || '').replace(/\s+/g, ' ').trim();
}

function isBattleScreen() {
  return !!document.querySelector('.battle-bg');
}

function currentTurnKey() {
  return textOf(document.querySelector('.battle-bg .battle-turn-head:not(.sv-chronicle-turn-clone), .battle-bg .sv-turn-head-v101')) || 'unknown-turn';
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
  const maxAffordable = getP5AffordableFieldUpgrades(mp).sort((a, b) => b.radiusBonus - a.radiusBonus)[0];
  const mpSpend = selectedMpSpend > 0 && mp >= selectedMpSpend ? selectedMpSpend : (maxAffordable?.mpCost || 0);
  const vbLabel = textOf(document.querySelector('.battle-bg [class*="veilbreak"], .battle-bg [class*="Veilbreak"]')) || 'Veilbreak Field';
  return buildP5VeilbreakField({
    ult: { name: vbLabel.slice(0, 72) || 'Veilbreak Field' },
    owner: 'player',
    originIndex,
    mpSpentOnRange: mpSpend,
  });
}

function resetFieldRuntimeState() {
  durationState = createP5FieldDurationState(activeField);
  lastTickId = '';
  lastEffectPlanTickId = '';
  lastSummary = '';
  lastInfluenceSummary = '';
  lastInfluences = new Map<string, P5UnitFieldInfluence>();
  lastOccupants = new Set<string>();
}

function rebuildField() {
  activeField = inferFieldFromDom();
  resetFieldRuntimeState();
  runSoon();
}

function activateFieldFromVeilbreak(sourceText = 'Veilbreak') {
  activeField = inferFieldFromDom();
  if (!activeField) return;
  fieldActivated = true;
  activatedAt = Date.now();
  resetFieldRuntimeState();
  appendLog(`Veilbreak Field activated: ${activeField.fieldName} · ${activeField.radius} radius · ${activeField.mpSpentOnRange || 0} MP widening selected.`, `activate_${activatedAt}`);
  window.dispatchEvent(new CustomEvent('sv:p5-veilbreak-activated', {
    detail: {
      field: activeField,
      sourceText,
      selectedMpSpend: activeField.mpSpentOnRange || 0,
      radius: activeField.radius,
      activatedAt,
    },
  }));
  runSoon();
}

function isVeilbreakActivationButton(target: EventTarget | null) {
  const el = target instanceof Element ? target.closest('button, [role="button"]') as HTMLElement | null : null;
  if (!el || !el.closest('.battle-bg')) return null;
  if (el.closest('#sv-p5-field-controls')) return null;
  const txt = textOf(el);
  if (!/veil\s*break|veilbreak|expansion/i.test(txt)) return null;
  if (/range|widen|base/i.test(txt)) return null;
  return el;
}

function onBattleClick(ev: Event) {
  const btn = isVeilbreakActivationButton(ev.target);
  if (!btn) return;
  window.setTimeout(() => activateFieldFromVeilbreak(textOf(btn)), 60);
}

function ensureField() {
  if (activeField && activeField.originIndex >= 0) return activeField;
  activeField = inferFieldFromDom();
  durationState = createP5FieldDurationState(activeField);
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
    tile.classList.remove('sv-p5-vb-field-tile', 'sv-p5-vb-field-origin', 'sv-p5-vb-field-pulse');
    delete tile.dataset.svP5FieldRadius;
    delete tile.dataset.svP5FieldName;
  });
}

function paintField(field: P5VeilbreakField) {
  clearFieldClasses();
  const tiles = tileList();
  affectedIndexes(field).forEach((index, pulseIndex) => {
    const tile = tiles[index];
    if (!tile) return;
    tile.classList.add('sv-p5-vb-field-tile', 'sv-p5-vb-field-pulse');
    tile.dataset.svP5FieldRadius = String(field.radius);
    tile.dataset.svP5FieldName = field.fieldName;
    tile.style.setProperty('--sv-p5-field-delay', `${(pulseIndex % 7) * 130}ms`);
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

function controlsMount() {
  return document.querySelector('.battle-bg .sv-left-rail, .battle-bg .battle-side-panel, .battle-bg .sv-battle-command-rail, .battle-bg') as HTMLElement | null;
}

function installControls() {
  if (!isBattleScreen()) return;
  const mount = controlsMount();
  if (!mount) return;
  let panel = document.getElementById('sv-p5-field-controls') as HTMLElement | null;
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'sv-p5-field-controls';
    panel.className = 'sv-p5-field-controls';
    panel.innerHTML = `
      <div class="sv-p5-field-controls-title">Veilbreak Field Range</div>
      <div class="sv-p5-field-controls-sub">Choose MP widening before activation.</div>
      <div class="sv-p5-field-controls-buttons"></div>
    `;
    mount.appendChild(panel);
  }
  const buttons = panel.querySelector('.sv-p5-field-controls-buttons') as HTMLElement | null;
  if (!buttons) return;
  const mp = currentMp();
  const options = [{ id: 'base', name: 'Base', mpCost: 0, radiusBonus: 0, summary: 'Radius 1 field.' }, ...P5_FIELD_RANGE_UPGRADES];
  buttons.innerHTML = '';
  options.forEach((option) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sv-p5-field-upgrade-btn';
    btn.dataset.svP5FieldMp = String(option.mpCost);
    btn.textContent = option.mpCost > 0 ? `${option.name} · ${option.mpCost} MP` : 'Base · 0 MP';
    btn.title = option.summary;
    const affordable = mp >= option.mpCost;
    const selected = selectedMpSpend === option.mpCost;
    btn.classList.toggle('is-selected', selected);
    btn.classList.toggle('is-locked', !affordable);
    btn.disabled = !affordable;
    btn.addEventListener('click', () => {
      selectedMpSpend = option.mpCost;
      fieldActivated = false;
      clearFieldClasses();
      appendLog(`Veilbreak Field Range: ${option.name} selected. Activate Veilbreak to create the field.`, `range_${Date.now()}_${option.mpCost}`);
      rebuildField();
    });
    buttons.appendChild(btn);
  });
}

function syncField() {
  if (!isBattleScreen()) return;
  installControls();
  if (!fieldActivated) {
    clearFieldClasses();
    const stagedField = activeField || inferFieldFromDom();
    window.dispatchEvent(new CustomEvent('sv:p5-veilbreak-field-config', {
      detail: { field: stagedField, selectedMpSpend, active: false },
    }));
    return;
  }
  const field = ensureField();
  if (!field) return;
  paintField(field);
  const occupants = occupantsInside(field);
  const diff = diffP5FieldOccupancy(lastOccupants, occupants);
  if (diff.entered.length) appendLog(`Veilbreak Field: ${diff.entered.length} unit(s) entered ${field.fieldName}.`, `enter_${field.createdAt}_${diff.entered.join('_')}`);
  if (diff.exited.length) appendLog(`Veilbreak Field: ${diff.exited.length} unit(s) left ${field.fieldName}.`, `exit_${field.createdAt}_${diff.exited.join('_')}`);
  lastOccupants = occupants;
  const influence = updateP5FieldInfluences({ field, previous: lastInfluences, occupants: Array.from(occupants) });
  lastInfluences = influence.next;
  durationState = tickP5FieldDuration({ state: durationState, field, influence: influence.snapshot, turnKey: currentTurnKey() });
  const tick = latestP5FieldTick(durationState);
  const effectPlans = buildP5FieldEffectPlans(tick);
  if (tick && tick.tickId !== lastTickId) {
    lastTickId = tick.tickId;
    appendLog(`Field Tick: ${describeP5FieldTick(tick)}`, `tick_${tick.tickId}`);
    if (tick.expired) {
      appendLog(`Veilbreak Field expired: ${field.fieldName} faded.`, `expired_${tick.tickId}`);
      fieldActivated = false;
      clearFieldClasses();
    }
  }
  if (effectPlans && effectPlans.tickId !== lastEffectPlanTickId) {
    lastEffectPlanTickId = effectPlans.tickId;
    appendLog(`Field Effects: ${describeP5FieldEffectPlans(effectPlans)}`, `effect_plan_${effectPlans.tickId}`);
    window.dispatchEvent(new CustomEvent('sv:p5-field-effect-plans', { detail: effectPlans }));
  }
  influence.snapshot.entered.forEach((item) => appendLog(`Field Influence: ${item.logLine}`, `influence_enter_${item.enteredAt}_${item.unitId}`));
  influence.snapshot.exited.forEach((item) => appendLog(`Field Influence ended: ${item.unitId} left ${item.fieldName}.`, `influence_exit_${item.lastSeenAt}_${item.unitId}`));
  const influenceSummary = describeP5InfluenceSnapshot(influence.snapshot);
  if (influenceSummary && influenceSummary !== lastInfluenceSummary) {
    lastInfluenceSummary = influenceSummary;
    appendLog(`Field Influence: ${influenceSummary}`, `influence_summary_${field.createdAt}_${influence.snapshot.activeInfluences.length}`);
  }
  const summary = describeP5Field(field);
  if (summary && summary !== lastSummary) {
    lastSummary = summary;
    appendLog(`Veilbreak Field ready — ${summary}`, `summary_${field.createdAt}_${field.radius}`);
  }
  window.dispatchEvent(new CustomEvent('sv:p5-veilbreak-field-state', {
    detail: { field, active: fieldActivated, activatedAt, selectedMpSpend: field.mpSpentOnRange || 0, occupants: Array.from(occupants), affectedIndexes: affectedIndexes(field), influence: influence.snapshot, duration: durationState, effectPlans },
  }));
  window.dispatchEvent(new CustomEvent('sv:p5-field-influence-state', { detail: influence.snapshot }));
  window.dispatchEvent(new CustomEvent('sv:p5-field-duration-state', { detail: durationState }));
}

function installStyles() {
  if (document.getElementById('sv-p5-veilbreak-field-style')) return;
  const style = document.createElement('style');
  style.id = 'sv-p5-veilbreak-field-style';
  style.textContent = `
    @keyframes svP5FieldPulse{0%,100%{filter:brightness(1);opacity:.82}50%{filter:brightness(1.28);opacity:1}}
    @keyframes svP5FieldRune{0%{transform:scale(.75) rotate(0deg);opacity:.12}50%{transform:scale(1.08) rotate(10deg);opacity:.42}100%{transform:scale(.75) rotate(0deg);opacity:.12}}
    .battle-bg .sv-p5-vb-field-tile{position:relative!important;box-shadow:inset 0 0 0 2px rgba(184,125,255,.24),0 0 16px rgba(155,93,255,.13)!important;}
    .battle-bg .sv-p5-vb-field-pulse{animation:svP5FieldPulse 2.6s ease-in-out infinite!important;animation-delay:var(--sv-p5-field-delay,0ms)!important;}
    .battle-bg .sv-p5-vb-field-tile::after{content:"";position:absolute;inset:18%;border-radius:999px;border:1px solid rgba(222,195,255,.28);background:radial-gradient(circle,rgba(204,160,255,.18),rgba(120,70,255,.04) 58%,transparent 70%);pointer-events:none;animation:svP5FieldRune 3.1s ease-in-out infinite;animation-delay:var(--sv-p5-field-delay,0ms);}
    .battle-bg .sv-p5-vb-field-origin{box-shadow:inset 0 0 0 2px rgba(244,219,139,.68),0 0 20px rgba(244,219,139,.22)!important;}
    .battle-bg .sv-p5-vb-field-log{color:rgba(230,212,255,.95)!important;border-left:2px solid rgba(184,125,255,.64)!important;padding-left:7px!important;background:rgba(155,93,255,.055)!important;}
    .battle-bg .sv-p5-field-controls{margin:8px 0;padding:9px;border:1px solid rgba(184,125,255,.28);border-radius:14px;background:linear-gradient(135deg,rgba(38,26,70,.72),rgba(19,16,34,.82));box-shadow:0 8px 22px rgba(0,0,0,.22);color:rgba(246,239,255,.96);font-size:12px;}
    .battle-bg .sv-p5-field-controls-title{font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:rgba(244,219,139,.96);font-size:11px;}
    .battle-bg .sv-p5-field-controls-sub{opacity:.78;font-size:11px;margin:2px 0 7px;}
    .battle-bg .sv-p5-field-controls-buttons{display:flex;flex-wrap:wrap;gap:6px;}
    .battle-bg .sv-p5-field-upgrade-btn{border:1px solid rgba(184,125,255,.32);border-radius:999px;background:rgba(255,255,255,.06);color:rgba(246,239,255,.94);padding:5px 8px;font-size:11px;cursor:pointer;}
    .battle-bg .sv-p5-field-upgrade-btn.is-selected{border-color:rgba(244,219,139,.75);box-shadow:0 0 12px rgba(244,219,139,.18);color:rgba(255,239,184,.98);}
    .battle-bg .sv-p5-field-upgrade-btn.is-locked{opacity:.42;cursor:not-allowed;}
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
  document.addEventListener('click', onBattleClick, true);
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
  document.removeEventListener('click', onBattleClick, true);
  observer?.disconnect();
  observer = null;
  clearFieldClasses();
  document.getElementById('sv-p5-field-controls')?.remove();
  if (timer != null) window.clearInterval(timer);
  timer = null;
  activeField = null;
  durationState = null;
  fieldActivated = false;
  activatedAt = 0;
  lastTickId = '';
  lastEffectPlanTickId = '';
  lastOccupants = new Set<string>();
  lastInfluences = new Map<string, P5UnitFieldInfluence>();
}

if (typeof window !== 'undefined') {
  window.setTimeout(() => startP5VeilbreakFieldRuntime(), 0);
}
