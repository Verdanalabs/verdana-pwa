import { useCallback, useEffect, useRef, useState } from 'react';
import { getOneSignalClient, getPushSupportState, type PushSupportState } from '@/src/features/notifications/services/onesignal-client';
import { registerNotificationSubscription } from '@/src/features/notifications/services/notification-api';

type PushStatus = PushSupportState | 'loading' | 'registering' | 'error';

interface UsePushNotificationsParams {
  userId?: string | null;
  role: 'collector' | 'processor';
  email?: string | null;
  getAccessToken: () => Promise<string | null>;
}

export function usePushNotifications({ userId, role, email, getAccessToken }: UsePushNotificationsParams) {
  const [status, setStatus] = useState<PushStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const registeredSubscriptionRef = useRef<string | null>(null);

  const syncSubscription = useCallback(async () => {
    setError(null);
    const OneSignal = await getOneSignalClient();
    if (!OneSignal) {
      setStatus(await getPushSupportState());
      return;
    }

    const supportState = await getPushSupportState();
    setStatus(supportState);
    if (!userId || supportState === 'unsupported' || supportState === 'unconfigured') return;

    await OneSignal.login(userId);
    OneSignal.User.addTag('role', role);
    if (email) OneSignal.User.addEmail(email);

    const subscriptionId = OneSignal.User.PushSubscription.id;
    if (supportState !== 'granted' || !subscriptionId || registeredSubscriptionRef.current === subscriptionId) return;

    const token = await getAccessToken();
    if (!token) return;

    setStatus('registering');
    await registerNotificationSubscription(token, {
      platform: 'web',
      provider: 'onesignal',
      subscription_id: subscriptionId,
    });
    registeredSubscriptionRef.current = subscriptionId;
    setStatus('granted');
  }, [email, getAccessToken, role, userId]);

  const requestPermission = useCallback(async () => {
    setError(null);
    const OneSignal = await getOneSignalClient();
    if (!OneSignal) {
      setStatus(await getPushSupportState());
      return false;
    }

    try {
      setStatus('registering');
      const accepted = await OneSignal.Notifications.requestPermission();
      if (accepted) {
        await OneSignal.User.PushSubscription.optIn();
      }
      await syncSubscription();
      return accepted;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable notifications');
      setStatus('error');
      return false;
    }
  }, [syncSubscription]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        await syncSubscription();
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to register push notifications');
        setStatus('error');
      }
    }
    void run();
    return () => { cancelled = true; };
  }, [syncSubscription]);

  return { status, error, requestPermission, refresh: syncSubscription };
}
