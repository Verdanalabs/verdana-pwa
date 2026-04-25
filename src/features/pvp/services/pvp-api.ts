import { apiRequest } from '@/src/shared/services/api';

export interface PvpSite {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
}

export interface CreatePvpSitePayload {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  radius_meters?: number;
}

export function getPvpSites(token: string): Promise<PvpSite[]> {
  return apiRequest<PvpSite[]>('/v1/pvp-sites', { token });
}

export function createPvpSite(payload: CreatePvpSitePayload, token: string): Promise<PvpSite> {
  return apiRequest<PvpSite>('/v1/pvp-sites', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}
