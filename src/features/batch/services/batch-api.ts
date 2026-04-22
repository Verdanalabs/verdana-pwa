import { apiRequest } from '@/src/shared/services/api';

export interface ApiBatch {
  id: string;
  status: string;
  material: string;
  collector_user_id: string;
  processor_user_id: string | null;
  pvp_site_id: string | null;
  estimated_weight_grams: number;
  actual_weight_grams: number | null;
  created_at: string;
  updated_at: string;
}

export function getBatches(token: string, status?: string): Promise<ApiBatch[]> {
  const query = status ? `?status=${status}` : '';
  return apiRequest<ApiBatch[]>(`/v1/batches${query}`, { token });
}
