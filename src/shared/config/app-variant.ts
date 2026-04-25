import { runtimeConfig } from '@/src/shared/config/runtime-config';

export type AppVariant = 'collector' | 'pvp';
export type RouteSurface = AppVariant | 'shared';

type AppVariantConfig = {
  appName: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  appleMobileWebAppTitle: string;
  serviceWorkerCacheName: string;
};

const DEFAULT_PUBLIC_URLS: Record<AppVariant, string> = {
  collector: 'https://app.verdanaprotocol.com',
  pvp: 'https://pvp.verdanaprotocol.com',
};

const APP_VARIANT_CONFIG: Record<AppVariant, AppVariantConfig> = {
  collector: {
    appName: 'Verdana App',
    shortName: 'Verdana App',
    description: 'Mobile operational app for suppliers and collectors.',
    themeColor: '#070e07',
    backgroundColor: '#070e07',
    appleMobileWebAppTitle: 'Verdana App',
    serviceWorkerCacheName: 'verdana-collector-v1',
  },
  pvp: {
    appName: 'Verdana PVP',
    shortName: 'Verdana PVP',
    description: 'Mobile operational app for PVP operators and drop-off point teams.',
    themeColor: '#070e07',
    backgroundColor: '#070e07',
    appleMobileWebAppTitle: 'Verdana PVP',
    serviceWorkerCacheName: 'verdana-pvp-v1',
  },
};

function normalizeVariant(value: string | undefined): AppVariant {
  return value?.trim().toLowerCase() === 'pvp' ? 'pvp' : 'collector';
}

export const appVariant = normalizeVariant(runtimeConfig.appVariant);
export const appVariantConfig = APP_VARIANT_CONFIG[appVariant];

export function isCollectorApp() {
  return appVariant === 'collector';
}

export function isPvpApp() {
  return appVariant === 'pvp';
}

export function getPublicAppUrl(variant: AppVariant) {
  if (variant === 'collector') {
    return runtimeConfig.collectorAppUrl || DEFAULT_PUBLIC_URLS.collector;
  }

  return runtimeConfig.pvpAppUrl || DEFAULT_PUBLIC_URLS.pvp;
}

export function getCounterpartAppUrl() {
  return getPublicAppUrl(appVariant === 'collector' ? 'pvp' : 'collector');
}

export function getGuestEntryHref(variant: AppVariant) {
  return variant === 'collector' ? '/(auth)/welcome' : '/(auth)/pvp-login';
}

export function getAuthenticatedHref(variant: AppVariant) {
  return variant === 'collector' ? '/(supplier-tabs)/home' : '/(pvp-tabs)/dashboard';
}

export function getRouteSurface(segments: string[] | undefined): RouteSurface {
  const [group, leaf] = segments ?? [];

  if (!group || group === 'index' || group === 'desktop-blocked' || group === 'modal') {
    return 'shared';
  }

  if (group === '(supplier-tabs)' || group === 'batch' || group === 'wallet') {
    return 'collector';
  }

  if (group === '(pvp-tabs)' || group === 'pvp') {
    return 'pvp';
  }

  if (group === '(auth)') {
    return leaf === 'pvp-login' ? 'pvp' : 'collector';
  }

  return 'shared';
}
