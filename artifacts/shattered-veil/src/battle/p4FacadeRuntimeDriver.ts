import { getP4IntegrationSnapshot, getP4ActionCost } from './p4IntegrationFacade';
import { inferP4ActionIdFromText } from './actionEconomy';

let started = false;
let frame = 0;
let timer: number | null = null;
let observer: MutationObserver | null = null;

const textOf = (el: Element | null) => (el?.textContent || '').replace(/\s+/g, ' ').trim();

function isBattleScreen() {
  return !!document.querySelector('.battle-bg');
}

function syncActionEconomyBar() {
  const snap = getP4IntegrationSnapshot();
  const bar = document.querySelector('.battle-bg .sv-action-economy-bar') as HTMLElement | null;
  if (!bar) return;
  const fill = bar.querySelector('.sv-action-economy-fill') as HTMLElement | null;
  const state = bar.querySelector('.sv-action-economy-state') as HTMLElement | null;
  const ap = Math.max(0, Math.min(100, snap.ap.remaining));
  bar.dataset.svP4FacadeAp = String(ap);
  bar.dataset.svP4FacadeOk = snap.validation.ok ? '1' : '0';
  if (fill) fill.style.width = `${ap}%`;
  if (state) {
    const label = ap >= 100 ? 'Ready' : ap >= 65 ? 'Open' : ap >= 35 ? 'Limited' : ap > 0 ? 'Last sliver' : 'Spent';
    state.textContent = `${ap}% · ${label}`;
  }
}

function syncButtons() {
  const snap = getP4IntegrationSnapshot();
  document.querySelectorAll('.battle-bg button').forEach((node) => {
    const button = node as HTMLButtonElement;
    const actionId = inferP4ActionIdFromText(textOf(button), String(button.className || ''), button);
    const cost = getP4ActionCost(actionId);
    if (!cost) return;
    const isMove = actionId === 'basic_move';
    const isStep = actionId === 'strategic_step';
    const blocksForAp = cost.cost > 0 && snap.ap.remaining < cost.cost;
    const blocksForStep = isStep && snap.ap.strategicStepUsed;
    const blocks = blocksForAp || blocksForStep;
    button.dataset.svP4FacadeAction = actionId;
    button.dataset.svP4FacadeCost = String(cost.cost);
    button.classList.toggle('sv-p4-facade-blocked', blocks);
    button.classList.toggle('sv-p4-facade-affordable', !blocks && cost.cost > 0);
    if ((isMove || isStep) && blocks) {
      button.setAttribute('aria-disabled', 'true');
      button.title = blocksForStep ? 'Strategic Step has already been used this turn.' : 'Not enough action economy.';
    } else if ((isMove || isStep) && button.getAttribute('aria-disabled') === 'true') {
      button.removeAttribute('aria-disabled');
      button.title = cost.note;
    }
  });
}

function syncValidationBanner() {
  const snap = getP4IntegrationSnapshot();
  const log = document.querySelector('.battle-bg .blog-sel, .battle-bg .battle-log-card') as HTMLElement | null;
  if (!log || snap.validation.ok || !snap.validation.warnings.length) return;
  const id = snap.validation.warnings.join('|').slice(0, 160);
  if (log.querySelector(`[data-sv-p4-facade-warning="${CSS.escape(id)}"]`)) return;
  const row = document.createElement('div');
  row.className = 'battle-log-entry sv-p4-facade-warning';
  row.dataset.svP4FacadeWarning = id;
  row.textContent = `P4 Validation: ${snap.validation.warnings[0]}`;
  log.insertBefore(row, log.firstChild);
}

function installStyles() {
  if (document.getElementById('sv-p4-facade-driver-style')) return;
  const style = document.createElement('style');
  style.id = 'sv-p4-facade-driver-style';
  style.textContent = `
    .battle-bg .sv-p4-facade-blocked{opacity:.48!important;filter:grayscale(.35)!important;}
    .battle-bg .sv-p4-facade-affordable{box-shadow:0 0 12px rgba(115,184,255,.12)!important;}
    .battle-bg .sv-p4-facade-warning{color:rgba(255,218,139,.96)!important;border-left:2px solid rgba(255,216,107,.7)!important;padding-left:7px!important;background:rgba(255,216,107,.055)!important;}
  `;
  document.head.appendChild(style);
}

function sync() {
  if (!isBattleScreen()) return;
  installStyles();
  syncActionEconomyBar();
  syncButtons();
  syncValidationBanner();
}

function runSoon() {
  window.cancelAnimationFrame(frame);
  frame = window.requestAnimationFrame(sync);
}

export function startP4FacadeRuntimeDriver() {
  if (started || typeof window === 'undefined' || typeof document === 'undefined') return;
  started = true;
  installStyles();
  runSoon();
  window.addEventListener('sv:p4-integration-snapshot', runSoon as EventListener);
  window.addEventListener('sv:p4-final-battle-state', runSoon as EventListener);
  observer = new MutationObserver(runSoon);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled', 'style'] });
  timer = window.setInterval(runSoon, 500);
}

export function stopP4FacadeRuntimeDriver() {
  if (!started || typeof window === 'undefined') return;
  started = false;
  window.cancelAnimationFrame(frame);
  window.removeEventListener('sv:p4-integration-snapshot', runSoon as EventListener);
  window.removeEventListener('sv:p4-final-battle-state', runSoon as EventListener);
  observer?.disconnect();
  observer = null;
  if (timer != null) window.clearInterval(timer);
  timer = null;
}

if (typeof window !== 'undefined') {
  window.setTimeout(() => startP4FacadeRuntimeDriver(), 0);
}
