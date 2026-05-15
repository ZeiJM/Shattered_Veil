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
  if (!direct || /innate/i.test(direct)) return -100;
  if (/no stat bonus|passive only|first strike|when struck|chance|appl(?:y|ies)|damage|turns|cost|hp|mp|atk|mag|def|spd|\+\d|%/i.test(direct)) return -50;
  if (direct.length < 4 || direct.length > 70) return -25;

  let score = 0;
  if (/^[A-Za-z][A-Za-z'’\- ]+$/.test(direct)) score += 20;
  if (/[A-Z][a-z]/.test(direct)) score += 8;
  if (el.tagName === 'B' || el.tagName === 'STRONG') score += 8;
  const style = window.getComputedStyle(el);
  const weight = Number.parseInt(style.fontWeight || '400', 10);
  if (weight >= 650) score += 8;
  const fontSize = Number.parseFloat(style.fontSize || '0');
  if (fontSize >= 10) score += 5;
  if (/ranger|marked|briar|wind|verdant|dus[kc]|ember|heart|lineage|blood|channel|skin|step|quarrel/i.test(direct)) score += 6;
  return score;
}

function appendInnateSuffix(titleEl: HTMLElement) {
  const direct = directTextOf(titleEl) || textOf(titleEl);
  if (!direct || /\(\s*innate\s*\)/i.test(direct)) return;
  titleEl.dataset.svInlineInnateTitle = '1';

  const span = document.createElement('span');
  span.className = 'sv-inline-innate-suffix';
  span.textContent = ' (Innate)';
  titleEl.appendChild(span);
}

function polishCreateInnateCards() {
  const root = document.querySelector('.create-bg');
  if (!root) return;

  const innateBadges = Array.from(root.querySelectorAll('[data-sv-innate-badge="1"], span, div'))
    .filter((el) => /^★?\s*innate\s*$/i.test(textOf(el)));

  innateBadges.forEach((badgeNode) => {
    const badge = badgeNode as HTMLElement;
    const card = badge.closest('[data-sv-innate-fixed="1"], .cd, button, [class*="card"], [class*="Card"]') as HTMLElement | null;
    if (!card || card.dataset.svInlineInnateProcessed === '1') {
      if (badge.dataset.svInnateBadge === '1') badge.style.display = 'none';
      return;
    }

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
      appendInnateSuffix(best);
      card.dataset.svInlineInnateProcessed = '1';
    }

    badge.dataset.svInlineInnateHidden = '1';
    badge.style.display = 'none';
    badge.setAttribute('aria-hidden', 'true');
    card.style.paddingTop = '';
  });
}

function runSoon() {
  window.cancelAnimationFrame(createInlineInnateFrame);
  createInlineInnateFrame = window.requestAnimationFrame(polishCreateInnateCards);
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
