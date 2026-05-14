type AssetKind = 'image' | 'audio';

type AssetPreloadEntry = {
  readonly id: string;
  readonly path: string;
  readonly kind: AssetKind;
  readonly priority: number;
  readonly reason: string;
};

type PreloadOptions = {
  readonly baseUrl?: string;
  readonly maxConcurrent?: number;
  readonly connection?: Pick<NetworkInformationLite, 'saveData' | 'effectiveType'>;
};

type NetworkInformationLite = {
  readonly saveData?: boolean;
  readonly effectiveType?: string;
};

type RuntimeAsset = {
  readonly url: string;
  readonly kind: AssetKind;
  readonly priority: number;
  readonly reason: string;
};

const loadedAssetUrls = new Set<string>();
const linkedPreloadUrls = new Set<string>();

export const HIGH_PRIORITY_IMAGE_ASSETS: readonly AssetPreloadEntry[] = [
  { id: 'battle-courtyard', path: 'battle/bg_courtyard.jpg', kind: 'image', priority: 1, reason: 'Default battlefield background.' },
  { id: 'battle-rift', path: 'battle/bg_rift.jpg', kind: 'image', priority: 2, reason: 'Rift battlefield background.' },
  { id: 'battle-forest', path: 'battle/bg_forest.jpg', kind: 'image', priority: 3, reason: 'Forest battlefield background.' },
  { id: 'battle-abyss', path: 'battle/bg_abyss.jpg', kind: 'image', priority: 4, reason: 'Boss/abyss battlefield background.' },
];

// Placeholder-ready manifest for future high-quality music/audio. Keep empty
// until actual verified files exist in public/audio or equivalent. This avoids
// broken network requests while giving future PRs a typed place to route HQ
// variants and replace lower-quality placeholders safely.
export const HIGH_QUALITY_AUDIO_ASSETS: readonly AssetPreloadEntry[] = [];

export const PRELOAD_ASSETS: readonly AssetPreloadEntry[] = [
  ...HIGH_PRIORITY_IMAGE_ASSETS,
  ...HIGH_QUALITY_AUDIO_ASSETS,
];

function normalizeBaseUrl(baseUrl = '/'): string {
  if (!baseUrl) return '/';
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

function assetUrl(path: string, baseUrl?: string): string {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  return `${normalizeBaseUrl(baseUrl)}${cleanPath}`;
}

function shouldUseLightPreload(opts: PreloadOptions): boolean {
  const connection = opts.connection;
  if (!connection) return false;
  if (connection.saveData) return true;
  return /(^|-)2g$/i.test(String(connection.effectiveType || ''));
}

function isPreloadableUrl(url: string): boolean {
  if (!url) return false;
  if (/^(data|blob|about):/i.test(url)) return false;
  if (/^#/.test(url)) return false;
  return true;
}

function toAbsoluteUrl(url: string): string | null {
  if (typeof window === 'undefined') return null;
  if (!isPreloadableUrl(url)) return null;
  try {
    return new URL(url, window.location.href).href;
  } catch (_) {
    return null;
  }
}

function ensurePreloadLink(url: string, kind: AssetKind): void {
  if (typeof document === 'undefined') return;
  if (!isPreloadableUrl(url) || linkedPreloadUrls.has(`${kind}:${url}`)) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = kind === 'audio' ? 'audio' : 'image';
  link.href = url;
  link.dataset.svAssetPreload = '1';
  document.head.appendChild(link);
  linkedPreloadUrls.add(`${kind}:${url}`);
}

function preloadImage(url: string): Promise<void> {
  if (loadedAssetUrls.has(url)) return Promise.resolve();
  ensurePreloadLink(url, 'image');
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      loadedAssetUrls.add(url);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = url;
  });
}

function preloadAudio(url: string): Promise<void> {
  if (loadedAssetUrls.has(url)) return Promise.resolve();
  ensurePreloadLink(url, 'audio');
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    const done = () => {
      loadedAssetUrls.add(url);
      audio.removeEventListener('loadedmetadata', done);
      audio.removeEventListener('canplaythrough', done);
      audio.removeEventListener('error', done);
      resolve();
    };
    audio.addEventListener('loadedmetadata', done, { once: true });
    audio.addEventListener('canplaythrough', done, { once: true });
    audio.addEventListener('error', done, { once: true });
    audio.src = url;
    try { void audio.load(); } catch (_) { resolve(); }
  });
}

async function preloadUrl(url: string, kind: AssetKind): Promise<void> {
  if (kind === 'audio') return preloadAudio(url);
  return preloadImage(url);
}

async function preloadEntry(entry: AssetPreloadEntry, opts: PreloadOptions): Promise<void> {
  const url = assetUrl(entry.path, opts.baseUrl);
  return preloadUrl(url, entry.kind);
}

function extractCssUrls(value: string): string[] {
  const urls: string[] = [];
  const re = /url\((['"]?)(.*?)\1\)/gi;
  let match: RegExpExecArray | null = re.exec(value);
  while (match) {
    if (match[2]) urls.push(match[2]);
    match = re.exec(value);
  }
  return urls;
}

function discoverRenderedAssets(): RuntimeAsset[] {
  if (typeof document === 'undefined' || typeof window === 'undefined') return [];
  const found = new Map<string, RuntimeAsset>();
  const add = (url: string | null | undefined, kind: AssetKind, priority: number, reason: string) => {
    const absolute = url ? toAbsoluteUrl(url) : null;
    if (!absolute) return;
    const key = `${kind}:${absolute}`;
    const existing = found.get(key);
    if (!existing || priority < existing.priority) {
      found.set(key, { url: absolute, kind, priority, reason });
    }
  };

  document.querySelectorAll('img[src]').forEach((node) => {
    const img = node as HTMLImageElement;
    img.decoding = 'async';
    if (img.closest('.battle-bg, .map-bg, .create-bg')) img.loading = 'eager';
    add(img.currentSrc || img.src, 'image', img.closest('.battle-bg, .map-bg, .create-bg') ? 1 : 4, 'Rendered image asset.');
  });

  document.querySelectorAll('audio[src], source[src]').forEach((node) => {
    const el = node as HTMLMediaElement & { src?: string };
    add(el.src || '', 'audio', 2, 'Rendered audio/music asset.');
  });

  document.querySelectorAll('.battle-bg [style], .map-bg [style], .create-bg [style], .sv-arena-grid').forEach((node) => {
    const el = node as HTMLElement;
    const style = window.getComputedStyle(el);
    const inlineBackground = el.style.backgroundImage || el.style.getPropertyValue('--sv-arena-bg-img');
    const computedBackground = style.backgroundImage || style.getPropertyValue('--sv-arena-bg-img');
    [...extractCssUrls(inlineBackground), ...extractCssUrls(computedBackground)].forEach((url) => {
      add(url, 'image', el.closest('.battle-bg') ? 1 : 3, 'Rendered CSS background asset.');
    });
  });

  return [...found.values()].sort((a, b) => a.priority - b.priority);
}

async function preloadRuntimeAssets(options: PreloadOptions = {}): Promise<void> {
  if (typeof window === 'undefined') return;
  const lightMode = shouldUseLightPreload(options);
  const maxConcurrent = Math.max(1, Math.min(options.maxConcurrent || 2, 4));
  const queue = discoverRenderedAssets()
    .filter((entry) => !lightMode || entry.priority <= 2)
    .slice(0, lightMode ? 10 : 32);

  let cursor = 0;
  const workers = Array.from({ length: Math.min(maxConcurrent, queue.length) }, async () => {
    while (cursor < queue.length) {
      const entry = queue[cursor++];
      await preloadUrl(entry.url, entry.kind);
    }
  });
  await Promise.all(workers);
}

export async function preloadGameAssets(options: PreloadOptions = {}): Promise<void> {
  if (typeof window === 'undefined') return;
  const maxConcurrent = Math.max(1, Math.min(options.maxConcurrent || 2, 4));
  const lightMode = shouldUseLightPreload(options);
  const queue = [...PRELOAD_ASSETS]
    .filter((entry) => !lightMode || entry.priority <= 2)
    .sort((a, b) => a.priority - b.priority);

  let cursor = 0;
  const workers = Array.from({ length: Math.min(maxConcurrent, queue.length) }, async () => {
    while (cursor < queue.length) {
      const entry = queue[cursor++];
      await preloadEntry(entry, options);
    }
  });
  await Promise.all(workers);
}

export function scheduleGameAssetPreload(baseUrl?: string): void {
  if (typeof window === 'undefined') return;
  const nav = window.navigator as Navigator & { connection?: NetworkInformationLite };
  const options: PreloadOptions = {
    baseUrl,
    maxConcurrent: 2,
    connection: nav.connection,
  };
  const run = () => {
    void preloadGameAssets(options).then(() => preloadRuntimeAssets(options));
  };
  const rerunDiscovery = () => {
    void preloadRuntimeAssets(options);
  };
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
  if (typeof idle === 'function') {
    idle(run, { timeout: 1600 });
    idle(rerunDiscovery, { timeout: 3600 });
  } else {
    window.setTimeout(run, 700);
    window.setTimeout(rerunDiscovery, 2600);
  }
}
