import { apiRequest } from '@/src/shared/services/api';

export interface PvpActiveSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export interface PvpLoginResponse {
  token: string;
  id: string;
  display_name: string | null;
  email: string | null;
  role: string;
  active_site?: PvpActiveSite;
}

export function pvpLogin(email: string, password: string): Promise<PvpLoginResponse> {
  return apiRequest<PvpLoginResponse>('/v1/auth/pvp-login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
