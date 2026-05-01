import { apiRequest } from '@/src/shared/services/api';

export function registerNotificationSubscription(
  token: string,
  payload: { platform: string; provider: string; subscription_id: string },
): Promise<{ id: string; platform: string; created_at: string }> {
  return apiRequest('/v1/notifications/register', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}
