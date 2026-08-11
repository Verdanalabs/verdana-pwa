import { apiRequest } from '@/src/shared/services/api';

// Service 4 — Organic Processing (Maggot).

/** Watermarked photo of the scale. Optional — a feeding logged without a camera is still a valid record. */
export interface ProofPhoto {
  storage_key: string;
  sha256_hex: string;
  captured_at?: string;
}

export interface FeedingLog {
  id: string;
  fed_on: string; // YYYY-MM-DD
  quantity_grams: number;
  proof?: ProofPhoto;
}

export interface Harvest {
  maggot_weight_grams: number;
  frass_weight_grams: number;
  harvested_at: string;
  proof?: ProofPhoto;
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
  payload: { fed_on: string; quantity_grams: number; proof?: ProofPhoto },
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
  payload: { maggot_weight_grams: number; frass_weight_grams: number; proof?: ProofPhoto },
): Promise<Harvest> {
  return apiRequest<Harvest>(`/v1/maggot/batches/${id}/harvest`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}
