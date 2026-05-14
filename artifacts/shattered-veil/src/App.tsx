import { useEffect } from 'react';
import Game from './Game.jsx';
import { getPowerLevelSummaryForArenaUnit } from './battle/powerLevelSummary.js';
import './mobile-ui-patch.css';
import './arena-mobile-polish.css';
import './arena-floating-info.css';
import './power-level-ui.css';

function polishMobileLabels() {
  const textOf = (el: Element) => (el.textContent || '').replace(/\s+/g, ' ').trim();

  document.querySelectorAll('.battle-bg button, .battle-bg span, .battle-bg div').forEach((el) => {
    const text = textOf(el);
    if (el.tagName === 'BUTTON' && /^chain$/i.test(text)) {
      (el as HTMLElement).style.display = 'none';
      return;
    }
    if (text === 'Combat') el.textContent = 'Combat Arts';
    else if (text === 'Combat Options') el.textContent = 'Combat Arts';
    else if (text === 'Tactical') el.textContent = 'Battle Tactics';
    else if (text === 'Tactical Options') el.textContent = 'Battle Tactics';
  });

  document.querySelectorAll('.map-bg button, .map-bg span, .map-bg div').forEach((el) => {
    const text = textOf(el);
    if (/^\??\s*controls$/i.test(text)) el.textContent = 'Input Help';
    else if (/^find me$/i.test(text)) el.textContent = 'Center Player';
  });

  document.querySelectorAll('.create-bg span, .create-bg div').forEach((el) => {
    const text = textOf(el).toUpperCase();
    if (!text.includes('INNATE')) return;
    const badge = el as HTMLElement;
    const card = badge.closest('.cd, button, [class$="card"], [class$="Card"], [class*="card"], [class*="Card"]') as HTMLElement | null;
    if (!card || card === badge || card.dataset.svInnateFixed === '1') return;
    card.dataset.svInnateFixed = '1';
    card.style.position = card.style.position || 'relative';
    card.style.paddingTop = '32px';
    badge.style.position = 'absolute';
    badge.style.top = '6px';
    badge.style.right = '8px';
    badge.style.zIndex = '5';
    badge.style.pointerEvents = 'none';
    badge.style.whiteSpace = 'nowrap';
    badge.style.fontSize = '7px';
    badge.style.lineHeight = '1.05';
    badge.style.padding = '2px 7px';
    badge.style.borderRadius = '999px';
  });
}

function markBattleHeaderLayout() {
  const textOf = (el: Element) => (el.textContent || '').replace(/\s+/g, ' ').trim();
  const signalSetOf = (text: string) => {
    const signals = new Set<string>();
    if (/Veilbreak|Veil Expansion/i.test(text)) signals.add('veilbreak');
    if (/Skill Interaction/i.test(text)) signals.add('skill');
    if (/Attunement/i.test(text)) signals.add('attunement');
    if (/\bTags?\b/i.test(text)) signals.add('tags');
    if (/\b(Round|Turn|Timer)\b/i.test(text)) signals.add('timer');
    return signals;
  };
  const clearMarks = () => {
    document.querySelectorAll('[data-sv-battle-header-row], [data-sv-battle-header-card]').forEach((el) => {
      delete (el as HTMLElement).dataset.svBattleHeaderRow;
      delete (el as HTMLElement).dataset.svBattleHeaderCard;
    });
  };

  clearMarks();

  const candidates = [
    ...Array.from(document.querySelectorAll('.battle-bg .battle-info-card')),
    ...Array.from(document.querySelectorAll('.battle-bg .cd')),
  ];

  candidates.forEach((card) => {
    const cardEl = card as HTMLElement;
    if (cardEl.dataset.svBattleHeaderCard === '1') return;
    if (cardEl.querySelector('[data-sv-battle-header-card="1"]')) return;
    if (cardEl.parentElement?.closest('[data-sv-battle-header-card="1"]')) return;

    const cardText = textOf(card);
    const signals = signalSetOf(cardText);
    const hasPrimaryHeaderSignal = signals.has('veilbreak') || signals.has('skill');
    const hasCompactHeaderCluster = signals.has('attunement') && (signals.has('tags') || signals.has('timer'));
    const hasActionOrLogSignals = /Combat Arts|Veil Magic|Battle Tactics|Battle Log|Combat Options|Tactical Options/i.test(cardText);
    if ((!hasPrimaryHeaderSignal && !hasCompactHeaderCluster) || hasActionOrLogSignals) return;

    cardEl.dataset.svBattleHeaderCard = '1';

    Array.from(card.children).forEach((child) => {
      const row = child as HTMLElement;
      const rowText = textOf(row);
      if (!rowText) return;
      const rowSignals = signalSetOf(rowText);
      if (rowSignals.has('veilbreak')) row.dataset.svBattleHeaderRow = 'veilbreak';
      else if (rowSignals.has('skill')) row.dataset.svBattleHeaderRow = 'skill';
      else if (rowSignals.has('attunement')) row.dataset.svBattleHeaderRow = 'attunement';
      else if (rowSignals.has('tags')) row.dataset.svBattleHeaderRow = 'tags';
      else if (rowSignals.has('timer')) row.dataset.svBattleHeaderRow = 'timer';
    });
  });
}

function enhancePowerLevelTooltips() {
  const textOf = (el: Element) => (el.textContent || '').replace(/\s+/g, ' ').trim();

  document.querySelectorAll('.battle-bg .sv-arena-tooltip').forEach((tooltip) => {
    const tip = tooltip as HTMLElement;
    const unitLine = Array.from(tip.querySelectorAll('.sv-arena-tooltip-line')).find((line) => {
      const text = textOf(line);
      return /\((enemy|you|ally|friend|pet|summon)\)/i.test(text) || /\bHP\s+\d+%/i.test(text);
    }) as HTMLElement | undefined;
    const existing = tip.querySelector('.sv-power-level-readout');
    if (!unitLine) {
      if (existing) existing.remove();
      delete tip.dataset.svPowerLevelSignature;
      return;
    }

    const text = textOf(unitLine);
    const fieldActive = /Veilbreak field/i.test(textOf(tip));
    const signature = `${text}|field:${fieldActive ? '1' : '0'}`;
    if (existing && tip.dataset.svPowerLevelSignature === signature) return;
    if (existing) existing.remove();

    const hpMatch = text.match(/HP\s+(\d+)%/i);
    const hpPct = hpMatch ? Math.max(1, Math.min(100, Number(hpMatch[1]))) : 100;
    const isEnemy = /\(enemy\)/i.test(text);
    const isPlayer = /\(you\)/i.test(text);
    const isPet = /\((pet|summon)\)/i.test(text);

    const unit = {
      kind: isPet ? 'pet' : isEnemy ? 'enemy' : isPlayer ? 'player' : 'ally',
      hpPct,
      label: text,
      isBoss: /boss|elite|lord|wyrm|dragon|veil/i.test(text),
    };

    const power = getPowerLevelSummaryForArenaUnit(unit, { activeField: fieldActive });
    const readout = document.createElement('div');
    readout.className = `sv-power-level-readout is-${power.band}`;
    readout.title = power.help;
    readout.style.setProperty('--sv-power-level-color', power.color);

    const eyebrow = document.createElement('span');
    eyebrow.className = 'sv-power-level-eyebrow';
    eyebrow.textContent = 'Power Level';

    const value = document.createElement('span');
    value.className = 'sv-power-level-value';
    value.textContent = power.formatted;

    const band = document.createElement('span');
    band.className = 'sv-power-level-band';
    band.textContent = power.bandLabel;

    readout.append(eyebrow, value, band);
    tip.insertBefore(readout, unitLine);
    tip.dataset.svPowerLevelSignature = signature;
  });
}

function positionArenaFloatingInfo() {
  document.querySelectorAll('.battle-bg .sv-arena-panel').forEach((panel) => {
    const panelEl = panel as HTMLElement;
    const footer = panelEl.querySelector('.sv-arena-footer') as HTMLElement | null;
    const tooltip = footer?.querySelector('.sv-arena-tooltip') as HTMLElement | null;
    const activeTile = panelEl.querySelector('.sv-arena-tile.is-hover') as HTMLElement | null;

    if (!footer || !tooltip || !activeTile) {
      if (footer) {
        delete footer.dataset.svFloatingTileInfo;
        delete footer.dataset.svInfoSide;
        delete footer.dataset.svInfoEdge;
        footer.style.removeProperty('--sv-info-x');
        footer.style.removeProperty('--sv-info-y');
      }
      return;
    }

    const panelRect = panelEl.getBoundingClientRect();
    const tileRect = activeTile.getBoundingClientRect();
    if (!panelRect.width || !panelRect.height || !tileRect.width || !tileRect.height) return;

    const x = tileRect.left - panelRect.left + tileRect.width / 2;
    const y = tileRect.top - panelRect.top + tileRect.height / 2;
    const edge = x < panelRect.width * 0.28 ? 'left' : x > panelRect.width * 0.72 ? 'right' : 'center';
    const side = y < Math.min(170, panelRect.height * 0.42) ? 'below' : 'above';

    footer.dataset.svFloatingTileInfo = '1';
    footer.dataset.svInfoSide = side;
    footer.dataset.svInfoEdge = edge;
    footer.style.setProperty('--sv-info-x', `${Math.round(x)}px`);
    footer.style.setProperty('--sv-info-y', `${Math.round(y)}px`);
  });
}

function lockWorldMapTouch(ev: TouchEvent) {
  const target = ev.target as Element | null;
  if (!target || !target.closest('.map-bg')) return;
  const interactiveMap = target.closest('[class*="map-grid"], [class*="MapGrid"], [class*="world-grid"], [class*="WorldGrid"], canvas, svg');
  if (!interactiveMap) return;
  ev.preventDefault();
}

function App() {
  useEffect(() => {
    let frame = 0;
    const run = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        polishMobileLabels();
        markBattleHeaderLayout();
        enhancePowerLevelTooltips();
        positionArenaFloatingInfo();
      });
    };
    run();
    const observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    document.addEventListener('touchmove', lockWorldMapTouch, { passive: false });
    document.addEventListener('pointermove', run, { passive: true });
    document.addEventListener('pointerdown', run, { passive: true });
    window.addEventListener('resize', run, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('touchmove', lockWorldMapTouch);
      document.removeEventListener('pointermove', run);
      document.removeEventListener('pointerdown', run);
      window.removeEventListener('resize', run);
    };
  }, []);

  return <Game />;
}

export default App;
