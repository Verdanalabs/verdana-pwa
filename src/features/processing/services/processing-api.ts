import { apiRequest } from '@/src/shared/services/api';

// Service 3 — Processing Management (Anorganic).

export interface ProcessingStage {
  id: string;
  stage: string;
  notes?: string;
  recorded_at: string;
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
  payload: { material: string; initial_weight_grams: number },
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
  payload: { stage: string; notes?: string },
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
  payload: { final_weight_grams: number; final_grade?: string },
): Promise<ProcessingBatch> {
  return apiRequest<ProcessingBatch>(`/v1/processing/batches/${id}/result`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}
