import { apiRequest } from '@/src/shared/services/api';

// Service 4 — Organic Processing (Maggot).

export interface FeedingLog {
  id: string;
  fed_on: string; // YYYY-MM-DD
  quantity_grams: number;
}

export interface Harvest {
  maggot_weight_grams: number;
  frass_weight_grams: number;
  harvested_at: string;
}

export interface MaggotBatch {
  id: string;
  organic_weight_grams: number;
  status: string;
  created_at: string;
  feedings?: FeedingLog[];
  harvest?: Harvest;
  yield_percent?: number;
}

export function listMaggotBatches(token: string): Promise<MaggotBatch[]> {
  return apiRequest<MaggotBatch[]>('/v1/maggot/batches', { token });
}

export function getMaggotBatch(token: string, id: string): Promise<MaggotBatch> {
  return apiRequest<MaggotBatch>(`/v1/maggot/batches/${id}`, { token });
}

export function createMaggotBatch(
  token: string,
  payload: { organic_weight_grams: number },
): Promise<MaggotBatch> {
  return apiRequest<MaggotBatch>('/v1/maggot/batches', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function addFeeding(
  token: string,
  id: string,
  payload: { fed_on: string; quantity_grams: number },
): Promise<FeedingLog> {
  return apiRequest<FeedingLog>(`/v1/maggot/batches/${id}/feedings`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function addHarvest(
  token: string,
  id: string,
  payload: { maggot_weight_grams: number; frass_weight_grams: number },
): Promise<Harvest> {
  return apiRequest<Harvest>(`/v1/maggot/batches/${id}/harvest`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}
