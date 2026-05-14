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
  readonly connection?: Pick<NetworkInformation, 'saveData' | 'effectiveType'>;
};

type NetworkInformation = {
  readonly saveData?: boolean;
  readonly effectiveType?: string;
};

const loadedAssetUrls = new Set<string>();

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

function preloadImage(url: string): Promise<void> {
  if (loadedAssetUrls.has(url)) return Promise.resolve();
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

async function preloadEntry(entry: AssetPreloadEntry, opts: PreloadOptions): Promise<void> {
  const url = assetUrl(entry.path, opts.baseUrl);
  if (entry.kind === 'audio') return preloadAudio(url);
  return preloadImage(url);
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
  const nav = window.navigator as Navigator & { connection?: NetworkInformation };
  const run = () => {
    void preloadGameAssets({
      baseUrl,
      maxConcurrent: 2,
      connection: nav.connection,
    });
  };
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
  if (typeof idle === 'function') {
    idle(run, { timeout: 1600 });
  } else {
    window.setTimeout(run, 700);
  }
}
