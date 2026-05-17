export type AssetPreloadScreen = 'battle' | 'map' | 'create' | 'town' | 'home' | 'general';

export type AssetPreloadProfile = {
  screen: AssetPreloadScreen;
  rootSelectors: string[];
  prioritySelectors: string[];
  secondarySelectors: string[];
  maxPriorityUrls: number;
  maxSecondaryUrls: number;
};

export const P3_ASSET_PRELOAD_PROFILES: AssetPreloadProfile[] = [
  {
    screen: 'battle',
    rootSelectors: ['.battle-bg'],
    prioritySelectors: ['.battle-bg img', '.battle-bg .sv-arena-panel', '.battle-bg .sv-arena-grid', '.battle-bg .sv-arena-tile', '.battle-bg [style]'],
    secondarySelectors: ['.battle-bg .battle-actions-card', '.battle-bg .battle-info-card', '.battle-bg .battle-log-card'],
    maxPriorityUrls: 18,
    maxSecondaryUrls: 12,
  },
  {
    screen: 'map',
    rootSelectors: ['.map-bg'],
    prioritySelectors: ['.map-bg img', '.map-bg [style]', '.map-bg button'],
    secondarySelectors: ['.map-bg .card', '.map-bg .panel', '.map-bg [class*="bubble"]'],
    maxPriorityUrls: 16,
    maxSecondaryUrls: 10,
  },
  {
    screen: 'create',
    rootSelectors: ['.create-bg'],
    prioritySelectors: ['.create-bg img', '.create-bg [style]', '.create-bg button'],
    secondarySelectors: ['.create-bg .card', '.create-bg [class*="bloodmark"], .create-bg [class*="class"]'],
    maxPriorityUrls: 18,
    maxSecondaryUrls: 12,
  },
  {
    screen: 'town',
    rootSelectors: ['.town-bg'],
    prioritySelectors: ['.town-bg img', '.town-bg [style]'],
    secondarySelectors: ['.town-bg button', '.town-bg .card', '.town-bg [class*="bubble"]'],
    maxPriorityUrls: 14,
    maxSecondaryUrls: 10,
  },
  {
    screen: 'home',
    rootSelectors: ['.home-bg'],
    prioritySelectors: ['.home-bg img', '.home-bg [style]'],
    secondarySelectors: ['.home-bg button', '.home-bg .card', '.home-bg [class*="panel"]'],
    maxPriorityUrls: 12,
    maxSecondaryUrls: 8,
  },
  {
    screen: 'general',
    rootSelectors: ['body'],
    prioritySelectors: ['img[loading="eager"]', '[data-sv-critical-asset="1"]'],
    secondarySelectors: ['img', '[style]'],
    maxPriorityUrls: 12,
    maxSecondaryUrls: 12,
  },
];

export function detectCurrentAssetScreen(): AssetPreloadScreen {
  if (typeof document === 'undefined') return 'general';
  for (const profile of P3_ASSET_PRELOAD_PROFILES) {
    if (profile.screen !== 'general' && profile.rootSelectors.some((selector) => document.querySelector(selector))) return profile.screen;
  }
  return 'general';
}

export function getAssetPreloadProfile(screen: AssetPreloadScreen) {
  return P3_ASSET_PRELOAD_PROFILES.find((profile) => profile.screen === screen) || P3_ASSET_PRELOAD_PROFILES[P3_ASSET_PRELOAD_PROFILES.length - 1];
}
