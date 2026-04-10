export type CNFTStatus = 'verified' | 'listed' | 'collateral' | 'burned';

export interface CNFT {
  id: string;
  batchId: string;
  mintAddress: string;
  materialType: string;
  weightKg: number;
  grade: string;
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
