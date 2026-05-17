let started = false;
let frame = 0;
let observer: MutationObserver | null = null;
let timer: number | null = null;
const seenUrls = new Set<string>();
const loadedUrls = new Set<string>();
const failedUrls = new Set<string>();

function normalizeUrl(url: string) {
  return url.trim().replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
}

function urlsFromBackground(value: string) {
  const out: string[] = [];
  const matches = value.matchAll(/url\((["']?)(.*?)\1\)/g);
  for (const match of matches) {
    const url = normalizeUrl(match[2] || '');
    if (url && !url.startsWith('data:') && !url.startsWith('blob:')) out.push(url);
  }
  return out;
}

function preload(url: string) {
  if (!url || seenUrls.has(url) || failedUrls.has(url)) return;
  seenUrls.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    loadedUrls.add(url);
    document.documentElement.dataset.svAssetLoadTick = String(Date.now());
    markLoadedAssets();
  };
  img.onerror = () => {
    failedUrls.add(url);
    document.documentElement.dataset.svAssetLoadTick = String(Date.now());
    markLoadedAssets();
  };
  img.src = url;
}

function discoverAssetUrls() {
  document.querySelectorAll('img').forEach((img) => {
    const el = img as HTMLImageElement;
    if (el.currentSrc) preload(el.currentSrc);
    if (el.src) preload(el.src);
  });
  document.querySelectorAll<HTMLElement>('[style], .battle-bg, .map-bg, .create-bg, .town-bg, .home-bg, .sv-arena-panel, .sv-arena-tile').forEach((el) => {
    const style = getComputedStyle(el);
    [...urlsFromBackground(style.backgroundImage), ...urlsFromBackground(style.borderImageSource)].forEach(preload);
  });
}

function markLoadedAssets() {
  document.querySelectorAll('img').forEach((img) => {
    const el = img as HTMLImageElement;
    const url = el.currentSrc || el.src;
    el.dataset.svAssetTracked = '1';
    el.classList.toggle('sv-asset-loaded', !!url && loadedUrls.has(url));
    el.classList.toggle('sv-asset-failed', !!url && failedUrls.has(url));
    if (el.complete && el.naturalWidth > 0) el.classList.add('sv-asset-loaded');
  });
  document.querySelectorAll<HTMLElement>('.battle-bg, .map-bg, .create-bg, .town-bg, .home-bg, .sv-arena-panel, .sv-arena-tile, [style]').forEach((el) => {
    const urls = urlsFromBackground(getComputedStyle(el).backgroundImage);
    if (!urls.length) return;
    el.dataset.svBackgroundAssetTracked = '1';
    const allLoaded = urls.every((url) => loadedUrls.has(url));
    const anyFailed = urls.some((url) => failedUrls.has(url));
    el.classList.toggle('sv-background-assets-loaded', allLoaded);
    el.classList.toggle('sv-background-asset-failed', anyFailed);
  });
}

function prioritizeVisibleImages() {
  document.querySelectorAll('img').forEach((img) => {
    const el = img as HTMLImageElement;
    const rect = el.getBoundingClientRect();
    const visible = rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.top <= window.innerHeight;
    if (visible) {
      el.loading = 'eager';
      el.fetchPriority = 'high';
    } else if (!el.loading) {
      el.loading = 'lazy';
    }
    el.decoding = 'async';
  });
}

function run() {
  discoverAssetUrls();
  prioritizeVisibleImages();
  markLoadedAssets();
}

function runSoon() {
  window.cancelAnimationFrame(frame);
  frame = window.requestAnimationFrame(run);
}

export function startAssetLoadingOptimization() {
  if (started || typeof window === 'undefined' || typeof document === 'undefined') return;
  started = true;
  runSoon();
  observer = new MutationObserver(runSoon);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset', 'style', 'class'] });
  window.addEventListener('resize', runSoon, { passive: true });
  document.addEventListener('visibilitychange', runSoon, { passive: true });
  timer = window.setInterval(runSoon, 1200);
}

export function stopAssetLoadingOptimization() {
  if (!started) return;
  started = false;
  window.cancelAnimationFrame(frame);
  observer?.disconnect();
  observer = null;
  if (timer != null) window.clearInterval(timer);
  timer = null;
  window.removeEventListener('resize', runSoon);
  document.removeEventListener('visibilitychange', runSoon);
}
