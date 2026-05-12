import { useEffect } from 'react';
import Game from './Game.jsx';
import './mobile-ui-patch.css';

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
      frame = requestAnimationFrame(polishMobileLabels);
    };
    run();
    const observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('touchmove', lockWorldMapTouch, { passive: false });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('touchmove', lockWorldMapTouch);
    };
  }, []);

  return <Game />;
}

export default App;
