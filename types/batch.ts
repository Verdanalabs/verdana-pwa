export type BatchStatus =
  | 'draft'
  | 'submitted'
  | 'transit'
  | 'pending_validation'
  | 'verified'
  | 'minting'
  | 'minted'
  | 'listed'
  | 'collateral'
  | 'rejected';

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
