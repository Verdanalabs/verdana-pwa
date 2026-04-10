import type { BatchGrade, MaterialType } from './batch';

export type CNFTStatus = 'verified' | 'listed' | 'collateral' | 'burned';

export interface CNFT {
  id: string;
  batchId: string;
  mintAddress: string;
  materialType: MaterialType;
  weightKg: number;
  grade: BatchGrade;
  status: CNFTStatus;
  mintedAt: string;
  imageUrl?: string;
}

export interface WalletSummary {
  address: string;
  usdcBalance: number;
  cnftCount: number;
  cnfts: CNFT[];
}
