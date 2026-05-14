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

type AssetDiagnostics = {
  readonly rendered: RuntimeAsset[];
  readonly loaded: string[];
  readonly preloadLinked: string[];
  readonly missingVariants: string[];
  readonly appliedUpgrades: string[];
  readonly generatedAt: string;
};

const loadedAssetUrls = new Set<string>();
const linkedPreloadUrls = new Set<string>();
const missingVariantUrls = new Set<string>();
const appliedUpgradeUrls = new Set<string>();
let lastDiagnostics: AssetDiagnostics | null = null;

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

function isSameOriginUrl(url: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch (_) {
    return false;
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

function publishAssetDiagnostics(rendered: RuntimeAsset[] = lastDiagnostics?.rendered || []): AssetDiagnostics {
  const diagnostics: AssetDiagnostics = {
    rendered: rendered.slice(0, 80),
    loaded: [...loadedAssetUrls].sort(),
    preloadLinked: [...linkedPreloadUrls].sort(),
    missingVariants: [...missingVariantUrls].sort(),
    appliedUpgrades: [...appliedUpgradeUrls].sort(),
    generatedAt: new Date().toISOString(),
  };
  lastDiagnostics = diagnostics;
  if (typeof window !== 'undefined') {
    (window as Window & { __SV_ASSET_DIAGNOSTICS__?: AssetDiagnostics }).__SV_ASSET_DIAGNOSTICS__ = diagnostics;
  }
  return diagnostics;
}

export function getAssetDiagnostics(): AssetDiagnostics {
  return publishAssetDiagnostics();
}

function imageLoads(url: string): Promise<boolean> {
  if (loadedAssetUrls.has(url)) return Promise.resolve(true);
  if (missingVariantUrls.has(url)) return Promise.resolve(false);
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      loadedAssetUrls.add(url);
      publishAssetDiagnostics();
      resolve(true);
    };
    img.onerror = () => {
      missingVariantUrls.add(url);
      publishAssetDiagnostics();
      resolve(false);
    };
    img.src = url;
  });
}

function preloadImage(url: string): Promise<void> {
  if (loadedAssetUrls.has(url)) return Promise.resolve();
  ensurePreloadLink(url, 'image');
  return imageLoads(url).then(() => undefined);
}

function preloadAudio(url: string): Promise<void> {
  if (loadedAssetUrls.has(url)) return Promise.resolve();
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    const done = () => {
      loadedAssetUrls.add(url);
      publishAssetDiagnostics();
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

  const rendered = [...found.values()].sort((a, b) => a.priority - b.priority);
  publishAssetDiagnostics(rendered);
  return rendered;
}

function buildImageUpgradeCandidates(url: string): string[] {
  if (!isSameOriginUrl(url)) return [];
  const parsed = new URL(url, window.location.href);
  const path = parsed.pathname;
  const match = path.match(/^(.*?)(\.(?:png|jpe?g|webp|avif))$/i);
  if (!match) return [];
  const base = match[1];
  const ext = match[2];
  if (/(?:@2x|\.hq|_hq|\.high|_high|\.HD|_HD)$/i.test(base)) return [];
  const candidates = [`${base}@2x${ext}`, `${base}.hq${ext}`, `${base}_hq${ext}`];
  if (!/\.webp$/i.test(ext)) candidates.push(`${base}.webp`);
  if (!/\.avif$/i.test(ext)) candidates.push(`${base}.avif`);
  return candidates.map((candidatePath) => {
    const next = new URL(parsed.href);
    next.pathname = candidatePath;
    return next.href;
  });
}

async function findFirstLoadedImageVariant(url: string): Promise<string | null> {
  for (const candidate of buildImageUpgradeCandidates(url)) {
    if (appliedUpgradeUrls.has(candidate)) return candidate;
    const ok = await imageLoads(candidate);
    if (ok) return candidate;
  }
  return null;
}

function replaceCssUrlValue(value: string, fromUrl: string, toUrl: string): string {
  return value.replace(/url\((['"]?)(.*?)\1\)/gi, (full, quote: string, raw: string) => {
    const absolute = toAbsoluteUrl(raw);
    if (absolute !== fromUrl) return full;
    const q = quote || '"';
    return `url(${q}${toUrl}${q})`;
  });
}

async function applySafeImageUpgrades(): Promise<void> {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const visibleImages = Array.from(document.querySelectorAll('.battle-bg img[src], .map-bg img[src], .create-bg img[src]')).slice(0, 12) as HTMLImageElement[];
  for (const img of visibleImages) {
    const current = toAbsoluteUrl(img.currentSrc || img.src);
    if (!current) continue;
    const upgrade = await findFirstLoadedImageVariant(current);
    if (!upgrade || upgrade === current) continue;
    img.dataset.svOriginalAsset = current;
    img.dataset.svUpgradedAsset = upgrade;
    img.src = upgrade;
    appliedUpgradeUrls.add(upgrade);
    publishAssetDiagnostics();
  }

  const backgroundNodes = Array.from(document.querySelectorAll('.battle-bg [style], .map-bg [style], .create-bg [style], .sv-arena-grid')).slice(0, 20) as HTMLElement[];
  for (const el of backgroundNodes) {
    const currentValue = el.style.backgroundImage || el.style.getPropertyValue('--sv-arena-bg-img');
    const urls = extractCssUrls(currentValue).map(toAbsoluteUrl).filter((url): url is string => !!url);
    for (const url of urls) {
      const upgrade = await findFirstLoadedImageVariant(url);
      if (!upgrade || upgrade === url) continue;
      const property = el.style.getPropertyValue('--sv-arena-bg-img') ? '--sv-arena-bg-img' : 'background-image';
      const nextValue = replaceCssUrlValue(currentValue, url, upgrade);
      el.style.setProperty(property, nextValue);
      el.dataset.svUpgradedBackground = upgrade;
      appliedUpgradeUrls.add(upgrade);
      publishAssetDiagnostics();
      break;
    }
  }
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
  publishAssetDiagnostics(queue);
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
    if (!shouldUseLightPreload(options)) void applySafeImageUpgrades();
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
