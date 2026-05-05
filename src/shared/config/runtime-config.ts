import Constants from 'expo-constants';

type RuntimeExtra = {
  appVariant?: string;
  apiBaseUrl?: string;
  privyAppId?: string;
  collectorAppUrl?: string;
  pvpAppUrl?: string;
  oneSignalAppId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as RuntimeExtra;

export const runtimeConfig = {
  appVariant: extra.appVariant ?? process.env.EXPO_PUBLIC_APP_VARIANT ?? 'collector',
  apiBaseUrl: extra.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
  privyAppId: extra.privyAppId ?? process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? '',
  collectorAppUrl: extra.collectorAppUrl ?? process.env.EXPO_PUBLIC_COLLECTOR_APP_URL ?? '',
  pvpAppUrl: extra.pvpAppUrl ?? process.env.EXPO_PUBLIC_PVP_APP_URL ?? '',
  oneSignalAppId: extra.oneSignalAppId ?? process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? '',
};
