import { apiRequest } from '@/src/shared/services/api';

export interface PvpActiveSite {
  id: string;
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export interface ProcessorInvite {
  email: string;
  expires_at: string;
  pvp_site: PvpActiveSite;
  status: string;
  is_expired: boolean;
  is_usable: boolean;
}

export interface PvpLoginResponse {
  id: string;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  facility_name?: string | null;
  stationName?: string | null;
  role: string;
  approval_status: 'pending' | 'active' | 'rejected';
  rejection_reason?: string | null;
  active_site?: PvpActiveSite;
}

export interface ProcessorSyncPayload {
  invite_token?: string;
  display_name?: string;
  facility_name?: string;
  phone?: string;
  wallet_address?: string;
}

export function getProcessorInvite(token: string): Promise<ProcessorInvite> {
  return apiRequest<ProcessorInvite>(`/v1/auth/processor-invite?token=${encodeURIComponent(token)}`);
}

export function processorSync(token: string, payload: ProcessorSyncPayload): Promise<PvpLoginResponse> {
  return apiRequest<PvpLoginResponse>('/v1/auth/processor-sync', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}
