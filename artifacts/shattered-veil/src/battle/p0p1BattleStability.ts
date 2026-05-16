let started = false;
let frame = 0;
let observer: MutationObserver | null = null;
let timer: number | null = null;

const textOf = (el: Element | null) => (el?.textContent || '').replace(/\s+/g, ' ').trim();

function markOverflowSafe() {
  document.querySelectorAll('.battle-bg .battle-info-card, .battle-bg .battle-log-card, .battle-bg .battle-actions-card, .battle-bg .sv-arena-panel').forEach((el) => {
    (el as HTMLElement).dataset.svP0p1OverflowSafe = '1';
  });
}

function suppressBadApPills() {
  document.querySelectorAll('.battle-bg button').forEach((btn) => {
    const text = textOf(btn);
    if (/^(🏃\s*)?Flee$/i.test(text) || /End Turn|Turn Passed|Equip Item|Draw Weapon|Swap Skill/i.test(text)) {
      (btn as HTMLElement).classList.add('sv-p0p1-suppress-pill');
      btn.querySelectorAll('.sv-ap-cost-pill').forEach((pill) => pill.remove());
    }
  });
}

function hideRedundantChainButtons() {
  document.querySelectorAll('.battle-bg button').forEach((btn) => {
    const text = textOf(btn);
    if (/^Chain$/i.test(text) || /^Veilbreak Chain$/i.test(text)) {
      (btn as HTMLElement).classList.add('sv-p0p1-chain-hidden');
      (btn as HTMLElement).setAttribute('aria-hidden', 'true');
    }
  });
}

function classifySmallMetaChip(el: HTMLElement, text: string) {
  if (/\b\d+\s*\/\s*\d+\b|\b\d+\s*%\b|Ready|Charging|Primed|Cooldown|Chain\s*\d/i.test(text)) {
    el.classList.add('sv-p0p1-meta-chip');
  }
}

function polishVeilbreakAndInteractionRows() {
  const interactions: HTMLElement[] = [];
  document.querySelectorAll('.battle-bg span, .battle-bg div, .battle-bg button').forEach((node) => {
    const el = node as HTMLElement;
    const text = textOf(el);
    if (!text || text.length > 100) return;
    if (/Veilbreak|Veil Expansion|Break the Veil/i.test(text)) {
      el.classList.add('sv-p0p1-veilbreak-accent');
      if (/\d+\s*\/\s*\d+|Ready|Charging|Chain/i.test(text)) el.classList.add('sv-p0p1-veilbreak-counter');
      el.parentElement?.classList.add('sv-p0p1-tight-row');
    }
    if (/Skill Interaction|Interaction Ready|Primed/i.test(text)) {
      el.classList.add('sv-p0p1-skill-interaction');
      interactions.push(el);
    }
    if (/Attunement|Timer|Tags|Round\s+\d+|Your Turn|Enemy Turn/i.test(text)) {
      el.parentElement?.classList.add('sv-p0p1-tight-row');
      classifySmallMetaChip(el, text);
    }
  });
  cloneInteractionNearVeilbreak(interactions[0]);
}

function cloneInteractionNearVeilbreak(source?: HTMLElement) {
  const rail = document.querySelector('.battle-bg .battle-info-card, .battle-bg .sv-battle-control-rail') as HTMLElement | null;
  if (!rail || !source) return;
  const text = textOf(source);
  if (!text || text.length > 100) return;
  let clone = rail.querySelector(':scope > .sv-p0p1-interaction-clone') as HTMLElement | null;
  if (!clone) {
    clone = document.createElement('div');
    clone.className = 'sv-p0p1-skill-interaction sv-p0p1-interaction-clone';
    const anchor = rail.querySelector('.sv-p0p1-veilbreak-accent') as HTMLElement | null;
    if (anchor?.parentElement?.parentElement === rail) rail.insertBefore(clone, anchor.parentElement.nextSibling);
    else rail.appendChild(clone);
  }
  clone.textContent = text;
}

function stabilizeBattleTitle() {
  const candidates = Array.from(document.querySelectorAll('.battle-bg h1, .battle-bg h2, .battle-bg .battle-title, .battle-bg .battle-header')) as HTMLElement[];
  candidates.forEach((el) => {
    if (/^Battle$/i.test(textOf(el))) {
      el.dataset.svBattleTitle = '1';
      el.textContent = 'Rift Battle';
    }
  });
}

function keepArenaTitleCentered() {
  const panel = document.querySelector('.battle-bg .sv-arena-panel') as HTMLElement | null;
  if (!panel) return;
  Array.from(panel.querySelectorAll('div, span')).forEach((node) => {
    const el = node as HTMLElement;
    const text = textOf(el);
    if (text.length >= 8 && text.length <= 70 && /battlefield|shrine|foundation|arena|rift|outpost/i.test(text)) {
      el.style.textAlign = 'center';
      el.style.width = '100%';
    }
  });
}

function removeStickyStrategicHeaderControls() {
  document.querySelectorAll('.battle-bg .sv-arena-panel button').forEach((btn) => {
    const text = textOf(btn);
    if (/Strategic View|Show|Hide|\d+\s*x\s*\d+/i.test(text)) {
      const el = btn as HTMLElement;
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
    }
  });
}

function run() {
  if (!document.querySelector('.battle-bg')) return;
  markOverflowSafe();
  suppressBadApPills();
  hideRedundantChainButtons();
  polishVeilbreakAndInteractionRows();
  stabilizeBattleTitle();
  keepArenaTitleCentered();
  removeStickyStrategicHeaderControls();
}

function runSoon() {
  window.cancelAnimationFrame(frame);
  frame = window.requestAnimationFrame(run);
}

export function startP0P1BattleStabilityPolish() {
  if (started || typeof window === 'undefined' || typeof document === 'undefined') return;
  started = true;
  runSoon();
  observer = new MutationObserver(runSoon);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'disabled'] });
  document.addEventListener('click', runSoon, { passive: true });
  window.addEventListener('resize', runSoon, { passive: true });
  timer = window.setInterval(runSoon, 600);
}

export function stopP0P1BattleStabilityPolish() {
  if (!started) return;
  started = false;
  window.cancelAnimationFrame(frame);
  observer?.disconnect();
  observer = null;
  if (timer != null) window.clearInterval(timer);
  timer = null;
  document.removeEventListener('click', runSoon);
  window.removeEventListener('resize', runSoon);
}
