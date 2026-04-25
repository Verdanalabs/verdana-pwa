import type { BatchGrade, MaterialType } from './batch';

export type CNFTStatus = 'minted';

export interface CNFT {
  id: string;
  batchId: string;
  assetId: string;
  materialType: MaterialType;
  weightKg: number;
  grade?: BatchGrade | null;
  status: CNFTStatus;
  mintedAt: string;
  imageUrl?: string;
  txSignature?: string;
  merkleTree?: string;
  leafIndex?: number;
}

export interface WalletSummary {
  address: string;
  cnftCount: number;
  cnfts: CNFT[];
}
