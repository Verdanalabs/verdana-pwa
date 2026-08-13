import { apiRequest } from '@/src/shared/services/api';
import type { ProofPhoto } from '@/src/features/maggot/services/maggot-api';

// Service 3 — Processing Management (Anorganic).

export type { ProofPhoto };

export interface ProcessingStage {
  id: string;
  stage: string;
  notes?: string;
  recorded_at: string;
  proof?: ProofPhoto;
}

export interface ProcessingBatch {
  id: string;
  material: string;
  initial_weight_grams: number;
  final_weight_grams?: number;
  final_grade?: string;
  yield_percent?: number;
  status: string;
  created_at: string;
  /** The intake weighing that opened the run. */
  intake_proof?: ProofPhoto;
  /** The completion weighing the yield is measured against. */
  final_proof?: ProofPhoto;
  stages?: ProcessingStage[];
}

export function listProcessingBatches(token: string): Promise<ProcessingBatch[]> {
  return apiRequest<ProcessingBatch[]>('/v1/processing/batches', { token });
}

export function getProcessingBatch(token: string, id: string): Promise<ProcessingBatch> {
  return apiRequest<ProcessingBatch>(`/v1/processing/batches/${id}`, { token });
}

export function createProcessingBatch(
  token: string,
  payload: { material: string; initial_weight_grams: number; proof?: ProofPhoto },
): Promise<ProcessingBatch> {
  return apiRequest<ProcessingBatch>('/v1/processing/batches', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function addProcessingStage(
  token: string,
  id: string,
  payload: { stage: string; notes?: string; proof?: ProofPhoto },
): Promise<ProcessingStage> {
  return apiRequest<ProcessingStage>(`/v1/processing/batches/${id}/stages`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function completeProcessing(
  token: string,
  id: string,
  payload: { final_weight_grams: number; final_grade?: string; proof?: ProofPhoto },
): Promise<ProcessingBatch> {
  return apiRequest<ProcessingBatch>(`/v1/processing/batches/${id}/result`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}
