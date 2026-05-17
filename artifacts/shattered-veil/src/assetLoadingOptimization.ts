import { detectCurrentAssetScreen, getAssetPreloadProfile } from './assetPreloadManifest';

let started = false;
let frame = 0;
let observer: MutationObserver | null = null;
let timer: number | null = null;
const seenUrls = new Set<string>();
const loadedUrls = new Set<string>();
const failedUrls = new Set<string>();
const mediaReadyUrls = new Set<string>();
const mediaFailedUrls = new Set<string>();
let lastScreen = 'general';

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

function urlsFromMedia(el: HTMLMediaElement) {
  const urls: string[] = [];
  if (el.currentSrc) urls.push(el.currentSrc);
  if (el.src) urls.push(el.src);
  el.querySelectorAll('source').forEach((source) => {
    const src = source.getAttribute('src');
    if (src) urls.push(src);
  });
  return Array.from(new Set(urls)).filter((url) => !url.startsWith('data:') && !url.startsWith('blob:'));
}

function urlsFromElement(el: Element) {
  const urls: string[] = [];
  if (el instanceof HTMLImageElement) {
    if (el.currentSrc) urls.push(el.currentSrc);
    if (el.src) urls.push(el.src);
  }
  if (el instanceof HTMLAudioElement || el instanceof HTMLVideoElement) {
    urls.push(...urlsFromMedia(el));
  }
  const style = getComputedStyle(el as HTMLElement);
  urls.push(...urlsFromBackground(style.backgroundImage), ...urlsFromBackground(style.borderImageSource));
  return Array.from(new Set(urls));
}

function preload(url: string, priority: 'high' | 'auto' = 'auto') {
  if (!url || seenUrls.has(url) || failedUrls.has(url)) return;
  seenUrls.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.fetchPriority = priority;
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

function preloadFromSelectors(selectors: string[], limit: number, priority: 'high' | 'auto') {
  const urls: string[] = [];
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      urls.push(...urlsFromElement(el));
      if (el instanceof HTMLImageElement) {
        el.decoding = 'async';
        if (priority === 'high') {
          el.loading = 'eager';
          el.fetchPriority = 'high';
        }
      }
      if (el instanceof HTMLAudioElement || el instanceof HTMLVideoElement) {
        el.preload = priority === 'high' ? 'metadata' : 'none';
      }
    });
  });
  Array.from(new Set(urls)).slice(0, limit).forEach((url) => preload(url, priority));
}

function preloadPriorityProfile() {
  const screen = detectCurrentAssetScreen();
  lastScreen = screen;
  document.documentElement.dataset.svAssetPreloadScreen = screen;
  const profile = getAssetPreloadProfile(screen);
  preloadFromSelectors(profile.prioritySelectors, profile.maxPriorityUrls, 'high');
  preloadFromSelectors(profile.secondarySelectors, profile.maxSecondaryUrls, 'auto');
}

function discoverAssetUrls() {
  document.querySelectorAll('img').forEach((img) => {
    const el = img as HTMLImageElement;
    if (el.currentSrc) preload(el.currentSrc);
    if (el.src) preload(el.src);
  });
  document.querySelectorAll<HTMLElement>('[style], .battle-bg, .map-bg, .create-bg, .town-bg, .home-bg, .sv-arena-panel, .sv-arena-tile').forEach((el) => {
    const style = getComputedStyle(el);
    [...urlsFromBackground(style.backgroundImage), ...urlsFromBackground(style.borderImageSource)].forEach((url) => preload(url));
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

function markMediaAssets() {
  document.querySelectorAll('audio, video').forEach((media) => {
    const el = media as HTMLMediaElement;
    const urls = urlsFromMedia(el);
    el.dataset.svMediaAssetTracked = '1';
    if (!el.preload || el.preload === 'auto') el.preload = 'metadata';
    const ready = el.readyState >= HTMLMediaElement.HAVE_METADATA || urls.some((url) => mediaReadyUrls.has(url));
    const failed = urls.some((url) => mediaFailedUrls.has(url));
    el.classList.toggle('sv-media-asset-ready', ready);
    el.classList.toggle('sv-media-asset-failed', failed);
    urls.forEach((url) => {
      if (ready) mediaReadyUrls.add(url);
      if (failed) mediaFailedUrls.add(url);
    });
  });
}

function wireMediaEvents() {
  document.querySelectorAll('audio, video').forEach((media) => {
    const el = media as HTMLMediaElement;
    if (el.dataset.svMediaEventsWired === '1') return;
    el.dataset.svMediaEventsWired = '1';
    const markReady = () => {
      urlsFromMedia(el).forEach((url) => mediaReadyUrls.add(url));
      document.documentElement.dataset.svMediaLoadTick = String(Date.now());
      markMediaAssets();
    };
    const markFailed = () => {
      urlsFromMedia(el).forEach((url) => mediaFailedUrls.add(url));
      document.documentElement.dataset.svMediaLoadTick = String(Date.now());
      markMediaAssets();
    };
    el.addEventListener('loadedmetadata', markReady, { passive: true });
    el.addEventListener('canplaythrough', markReady, { passive: true });
    el.addEventListener('error', markFailed, { passive: true });
    el.querySelectorAll('source').forEach((source) => source.addEventListener('error', markFailed, { passive: true }));
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
  preloadPriorityProfile();
  discoverAssetUrls();
  prioritizeVisibleImages();
  wireMediaEvents();
  markMediaAssets();
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
  window.addEventListener('popstate', runSoon, { passive: true });
  timer = window.setInterval(() => {
    const screen = detectCurrentAssetScreen();
    if (screen !== lastScreen) runSoon();
    else {
      markMediaAssets();
      markLoadedAssets();
    }
  }, 1200);
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
  window.removeEventListener('popstate', runSoon);
}
