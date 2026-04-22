import { apiRequest } from '@/src/shared/services/api';

export interface VerdanaUser {
  id: string;
  role: string;
  display_name: string | null;
  email: string | null;
  wallet_address: string | null;
  created_at: string;
  is_new: boolean;
}

interface SyncPayload {
  role?: string;
  wallet_address?: string | null;
  display_name?: string;
}

export function syncUser(token: string, payload: SyncPayload): Promise<VerdanaUser> {
  return apiRequest<VerdanaUser>('/v1/auth/sync', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function getMe(token: string): Promise<VerdanaUser> {
  return apiRequest<VerdanaUser>('/v1/users/me', { token });
}
