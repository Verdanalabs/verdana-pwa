export type UserRole = 'supplier' | 'pvp_operator';

export type SupplierTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  walletAddress: string;
  createdAt: string;
}

export interface SupplierProfile extends User {
  role: 'supplier';
  tier: SupplierTier;
  operationalArea: string;
  primaryMaterial: string;
  reputationScore: number;
  totalBatches: number;
  totalKg: number;
}

export interface PvpStation {
  id: string;
  name: string;
  area: string;
}

export interface PvpOperatorProfile extends User {
  role: 'pvp_operator';
  stationId: string;
  stationName: string;
  lat: number;
  lng: number;
}

export interface DashboardSummary {
  totalKg: number;
  batchCount: number;
  cnftCount: number;
  usdcBalance: number;
  reputationScore: number;
  pendingTransitCount: number;
}
