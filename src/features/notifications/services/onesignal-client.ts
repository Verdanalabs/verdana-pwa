import { Platform } from 'react-native';
import { runtimeConfig } from '@/src/shared/config/runtime-config';

type OneSignalClient = typeof import('react-onesignal').default;

let initPromise: Promise<OneSignalClient | null> | null = null;

export type PushSupportState = 'unconfigured' | 'unsupported' | 'default' | 'granted' | 'denied';

export function isPushConfigured() {
  return runtimeConfig.oneSignalAppId.trim().length > 0;
}

export async function getOneSignalClient(): Promise<OneSignalClient | null> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  if (!isPushConfigured()) return null;

  if (!initPromise) {
    initPromise = import('react-onesignal').then(async ({ default: OneSignal }) => {
      await OneSignal.init({
        appId: runtimeConfig.oneSignalAppId,
        autoRegister: false,
        autoResubscribe: true,
        allowLocalhostAsSecureOrigin: true,
        notificationClickHandlerAction: 'focus',
        notificationClickHandlerMatch: 'origin',
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        serviceWorkerParam: { scope: '/' },
        welcomeNotification: { disable: true, message: '' },
      });
      OneSignal.Notifications.addEventListener('click', (event) => {
        const data = event.notification.additionalData as { batch_id?: string; type?: string } | undefined;
        if (!data?.batch_id || typeof window === 'undefined') return;
        if (runtimeConfig.appVariant === 'pvp') {
          window.location.assign(`/pvp/batch-detail?id=${encodeURIComponent(data.batch_id)}`);
          return;
        }
        if (data.type === 'cosign_request') {
          window.location.assign(`/batch/approve-cosign?id=${encodeURIComponent(data.batch_id)}`);
          return;
        }
        window.location.assign(`/batch/${encodeURIComponent(data.batch_id)}`);
      });
      return OneSignal;
    }).catch(() => null);
  }

  return initPromise;
}

export async function getPushSupportState(): Promise<PushSupportState> {
  if (!isPushConfigured()) return 'unconfigured';
  const OneSignal = await getOneSignalClient();
  if (!OneSignal || !OneSignal.Notifications.isPushSupported()) return 'unsupported';
  if (OneSignal.Notifications.permission) return 'granted';
  return OneSignal.Notifications.permissionNative ?? 'default';
}

export async function logoutOneSignalUser() {
  const OneSignal = await getOneSignalClient();
  await OneSignal?.logout();
}
