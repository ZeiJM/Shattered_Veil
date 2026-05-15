let createInlineInnateStarted = false;
let createInlineInnateFrame = 0;
let createInlineInnateObserver: MutationObserver | null = null;

const textOf = (el: Element | null) => (el?.textContent || '').replace(/\s+/g, ' ').trim();

function directTextOf(el: Element) {
  return Array.from(el.childNodes)
    .filter((child) => child.nodeType === Node.TEXT_NODE)
    .map((child) => child.textContent || '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleScore(el: HTMLElement) {
  const direct = directTextOf(el) || textOf(el);
  if (!direct || /\binnate\b/i.test(direct)) return -100;
  if (/no stat bonus|passive only|answers|learns|wraps|passes|chance|appl(?:y|ies)|damage|turns|cost|hp|mp|atk|mag|def|spd|\+\d|%/i.test(direct)) return -60;
  if (direct.length < 4 || direct.length > 64) return -25;

  let score = 0;
  if (/^[A-Za-z][A-Za-z'’\- ]+$/.test(direct)) score += 24;
  if (/[A-Z][a-z]/.test(direct)) score += 8;
  if (el.tagName === 'B' || el.tagName === 'STRONG') score += 10;
  const style = window.getComputedStyle(el);
  const weight = Number.parseInt(style.fontWeight || '400', 10);
  if (weight >= 650) score += 10;
  const fontSize = Number.parseFloat(style.fontSize || '0');
  if (fontSize >= 10) score += 6;
  if (/assassin|ranger|black|edge|smoke|skin|twin|tempo|venom|conduit|marked|briar|wind|verdant|channel|step|quarrel/i.test(direct)) score += 10;
  return score;
}

function makeInlineBadge() {
  const badge = document.createElement('span');
  badge.className = 'sv-inline-innate-badge';
  badge.textContent = 'Innate';
  badge.setAttribute('aria-label', 'Innate bloodmark');
  return badge;
}

function appendInnateBadge(titleEl: HTMLElement) {
  titleEl.querySelectorAll(':scope > .sv-inline-innate-suffix').forEach((node) => node.remove());
  if (titleEl.querySelector(':scope > .sv-inline-innate-badge')) return;
  titleEl.dataset.svInlineInnateTitle = '1';
  titleEl.appendChild(makeInlineBadge());
}

function removeLiteralInnateText(root: HTMLElement) {
  Array.from(root.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE && /\(?\s*innate\s*\)?/i.test(child.textContent || '')) {
      child.textContent = (child.textContent || '').replace(/\s*\(?\s*innate\s*\)?/gi, '');
    }
  });
  root.querySelectorAll('.sv-inline-innate-suffix').forEach((node) => node.remove());
}

function polishLineageHeading(root: Element) {
  Array.from(root.querySelectorAll('span, div, b, strong')).forEach((el) => {
    const txt = textOf(el);
    if (/^shared across the old houses$/i.test(txt)) {
      const note = el as HTMLElement;
      note.classList.add('sv-lineage-flow-note');
      const parent = note.parentElement as HTMLElement | null;
      parent?.classList.add('sv-lineage-flow-row');
    }
  });
}

function polishCreateInnateCards() {
  const root = document.querySelector('.create-bg');
  if (!root) return;
  polishLineageHeading(root);

  const innateBadges = Array.from(root.querySelectorAll('[data-sv-innate-badge="1"], [data-sv-inline-innate-hidden="1"], span, div'))
    .filter((el) => /^★?\s*innate\s*$/i.test(textOf(el)) || /^\(?\s*innate\s*\)?$/i.test(textOf(el)));

  innateBadges.forEach((badgeNode) => {
    const badge = badgeNode as HTMLElement;
    const card = badge.closest('[data-sv-innate-fixed="1"], .cd, button, [class*="card"], [class*="Card"]') as HTMLElement | null;
    if (!card) {
      badge.style.display = 'none';
      return;
    }

    removeLiteralInnateText(card);

    const candidates = Array.from(card.querySelectorAll('b, strong, span, div'))
      .map((node) => node as HTMLElement)
      .filter((node) => node !== badge && !node.contains(badge) && !badge.contains(node));

    let best: HTMLElement | null = null;
    let bestScore = -999;
    candidates.forEach((candidate) => {
      const score = titleScore(candidate);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    });

    if (best && bestScore > 0) {
      appendInnateBadge(best);
      card.dataset.svInlineInnateProcessed = '1';
    }

    badge.dataset.svInlineInnateHidden = '1';
    badge.style.display = 'none';
    badge.setAttribute('aria-hidden', 'true');
    card.style.paddingTop = '';
  });
}

function splitMapCoordinates() {
  const root = document.querySelector('.map-bg');
  if (!root) return;
  const candidates = Array.from(root.querySelectorAll('button, div, span')).map((node) => node as HTMLElement);
  candidates.forEach((el) => {
    if (el.dataset.svCoordsSplit === '1') return;
    if (el.querySelector('.sv-map-coords')) return;
    const direct = directTextOf(el);
    const match = direct.match(/^(.{3,40}?)\s*[·•\-–—:]?\s*\(?\s*(-?\d{1,3})\s*,\s*(-?\d{1,3})\s*\)?\s*$/);
    if (!match) return;
    if (/HP|MP|XP|ATK|MAG|DEF|SPD|CRIT|EVA|ACC|FRAG|SHD/i.test(direct)) return;
    const textNode = Array.from(el.childNodes).find((child) => child.nodeType === Node.TEXT_NODE && /\d{1,3}\s*,\s*-?\d{1,3}/.test(child.textContent || ''));
    if (!textNode) return;
    textNode.textContent = (textNode.textContent || '').replace(/\s*[·•\-–—:]?\s*\(?\s*-?\d{1,3}\s*,\s*-?\d{1,3}\s*\)?\s*$/, '');
    const coords = document.createElement('span');
    coords.className = 'sv-map-coords';
    coords.textContent = `${match[2]}, ${match[3]}`;
    el.appendChild(coords);
    el.classList.add('sv-map-location-with-coords');
    el.dataset.svCoordsSplit = '1';
  });
}

function runSoon() {
  window.cancelAnimationFrame(createInlineInnateFrame);
  createInlineInnateFrame = window.requestAnimationFrame(() => {
    polishCreateInnateCards();
    splitMapCoordinates();
  });
}

export function startCreateInlineInnateTitlePolish() {
  if (createInlineInnateStarted || typeof window === 'undefined' || typeof document === 'undefined') return;
  createInlineInnateStarted = true;
  runSoon();
  createInlineInnateObserver = new MutationObserver(runSoon);
  createInlineInnateObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'data-sv-innate-badge', 'data-sv-innate-fixed'],
  });
}

export function stopCreateInlineInnateTitlePolish() {
  if (!createInlineInnateStarted) return;
  createInlineInnateStarted = false;
  window.cancelAnimationFrame(createInlineInnateFrame);
  createInlineInnateObserver?.disconnect();
  createInlineInnateObserver = null;
}
