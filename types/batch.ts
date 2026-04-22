export type BatchStatus =
  | 'pending'
  | 'accepted'
  | 'cosigning'
  | 'cosigned'
  | 'mint_pending'
  | 'mint_failed'
  | 'minted';

export type MaterialType = 'PET' | 'HDPE' | 'LDPE' | 'PP' | 'PS' | 'PVC' | 'OTHER';

export type BatchGrade = 'A' | 'B' | 'C';

export interface BatchTimeline {
  status: BatchStatus;
  timestamp: string;
  note?: string;
  actor?: string;
}

export interface Batch {
  id: string;
  status: BatchStatus;
  materialType: MaterialType;
  grade: BatchGrade;
  estimatedWeightKg: number;
  actualWeightKg?: number;
  gpsLat: number;
  gpsLng: number;
  pvpId: string;
  pvpName: string;
  photoUrl: string;
  capturedAt: string;
  submittedAt?: string;
  validatedAt?: string;
  mintedAt?: string;
  cnftId?: string;
  timeline: BatchTimeline[];
}

export interface BatchSummary {
  id: string;
  status: BatchStatus;
  materialType: MaterialType;
  estimatedWeightKg: number;
  pvpName: string;
  capturedAt: string;
}
