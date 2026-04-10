import { SupplierProfile, DashboardSummary } from '@/types';

export const MOCK_SUPPLIER: SupplierProfile = {
  id: 'usr_001',
  role: 'supplier',
  name: 'Tio Rahardian',
  email: 'tio@example.com',
  walletAddress: '9xBf3mk2...3kR7mP',
  createdAt: '2025-01-15T08:00:00Z',
  tier: 'silver',
  operationalArea: 'Bekasi, West Java',
  primaryMaterial: 'PET',
  reputationScore: 95.2,
  totalBatches: 47,
  totalKg: 3247,
};

export const MOCK_DASHBOARD: DashboardSummary = {
  totalKg: 3247,
  batchCount: 47,
  cnftCount: 33,
  usdcBalance: 2450,
  reputationScore: 95.2,
  pendingTransitCount: 2,
};
