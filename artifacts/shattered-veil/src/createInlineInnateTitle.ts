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

function ensureInnateStarStyles() {
  if (document.getElementById('sv-innate-star-style')) return;
  const style = document.createElement('style');
  style.id = 'sv-innate-star-style';
  style.textContent = `
    .create-bg .sv-innate-corner-card {
      position: relative !important;
      overflow: hidden !important;
    }
    .create-bg .sv-innate-star-corner {
      position: absolute !important;
      top: -1px !important;
      right: -1px !important;
      width: 26px !important;
      height: 26px !important;
      border-bottom-left-radius: 14px !important;
      border-top-right-radius: inherit !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      pointer-events: none !important;
      z-index: 6 !important;
      color: #2b1802 !important;
      background: radial-gradient(circle at 35% 28%, #fff4a8 0%, #ffd85c 38%, #b97712 74%, #5b3104 100%) !important;
      border-left: 1px solid rgba(255,230,140,0.58) !important;
      border-bottom: 1px solid rgba(255,230,140,0.48) !important;
      box-shadow: 0 2px 10px rgba(255,202,74,0.24), inset 0 0 0 1px rgba(255,255,255,0.26) !important;
      font-size: 13px !important;
      font-weight: 900 !important;
      line-height: 1 !important;
      text-shadow: 0 1px 0 rgba(255,255,255,0.45) !important;
    }
    .create-bg .sv-inline-innate-badge,
    .create-bg [data-sv-innate-badge="1"],
    .create-bg [data-sv-inline-innate-hidden="1"] {
      display: none !important;
    }
    .create-bg .sv-innate-class-legend,
    .create-bg .sv-lineage-flow-row,
    .create-bg .sv-lineage-flow-note {
      color: rgba(255,221,132,0.96) !important;
      font-family: 'Cinzel', serif !important;
      font-weight: 900 !important;
      letter-spacing: 0.07em !important;
      text-transform: uppercase !important;
      text-shadow: 0 0 10px rgba(255,216,107,0.18) !important;
    }
    .create-bg .sv-innate-class-legend::before {
      content: '★ ' !important;
      color: #ffd95f !important;
      text-shadow: 0 0 8px rgba(255,216,107,0.36) !important;
    }
    .create-bg .sv-lineage-flow-note {
      opacity: 0.92 !important;
      font-size: 11px !important;
    }
  `;
  document.head.appendChild(style);
}

function removeLiteralInnateText(root: HTMLElement) {
  Array.from(root.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE && /\(?\s*innate\s*\)?/i.test(child.textContent || '')) {
      child.textContent = (child.textContent || '').replace(/\s*\(?\s*innate\s*\)?/gi, '');
    }
  });
  root.querySelectorAll('.sv-inline-innate-badge, .sv-inline-innate-suffix').forEach((node) => node.remove());
}

function addCornerStar(card: HTMLElement) {
  card.classList.add('sv-innate-corner-card');
  card.dataset.svInnateCornerCard = '1';
  if (card.querySelector(':scope > .sv-innate-star-corner')) return;
  const star = document.createElement('span');
  star.className = 'sv-innate-star-corner';
  star.textContent = '★';
  star.title = 'Innate class bloodmark';
  star.setAttribute('aria-label', 'Innate class bloodmark');
  card.appendChild(star);
}

function findInnateCard(fromNode: HTMLElement) {
  return fromNode.closest('[data-sv-innate-fixed="1"], .cd, button, [class*="card"], [class*="Card"]') as HTMLElement | null;
}

function polishInnateLegend(root: Element) {
  Array.from(root.querySelectorAll('span, div, b, strong')).forEach((el) => {
    const txt = textOf(el);
    if (/^innate\s+to\s+/i.test(txt)) (el as HTMLElement).classList.add('sv-innate-class-legend');
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
  ensureInnateStarStyles();
  polishInnateLegend(root);

  const markers = Array.from(root.querySelectorAll('[data-sv-innate-badge="1"], [data-sv-inline-innate-hidden="1"], .sv-inline-innate-badge, .sv-inline-innate-suffix, span, div'))
    .filter((el) => /^★?\s*innate\s*$/i.test(textOf(el)) || /^\(?\s*innate\s*\)?$/i.test(textOf(el)));

  markers.forEach((node) => {
    const marker = node as HTMLElement;
    const card = findInnateCard(marker);
    if (card) {
      removeLiteralInnateText(card);
      addCornerStar(card);
      card.style.paddingTop = '';
    }
    marker.dataset.svInlineInnateHidden = '1';
    marker.style.display = 'none';
    marker.setAttribute('aria-hidden', 'true');
  });

  root.querySelectorAll('[data-sv-innate-fixed="1"]').forEach((cardNode) => {
    const card = cardNode as HTMLElement;
    removeLiteralInnateText(card);
    addCornerStar(card);
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
