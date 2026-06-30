import { apiRequest } from '@/src/shared/services/api';

// Service 2 — Waste Grading.

export interface Grading {
  id: string;
  batch_id: string;
  category: string;
  grade: string;
  inspection_notes?: string;
  contamination_notes?: string;
  graded_by: string;
  created_at: string;
}

export function listBatchGradings(token: string, batchId: string): Promise<Grading[]> {
  return apiRequest<Grading[]>(`/v1/batches/${batchId}/gradings`, { token });
}

export interface GradingMedia {
  storage_key: string;
  mime_type: string;
  sha256_hex?: string;
}

export function createGrading(
  token: string,
  batchId: string,
  payload: {
    category: string;
    grade: string;
    inspection_notes?: string;
    contamination_notes?: string;
    media?: GradingMedia[];
  },
): Promise<Grading> {
  return apiRequest<Grading>(`/v1/batches/${batchId}/gradings`, {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}
