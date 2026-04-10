import type { WalletSummary } from '@/types';

export const MOCK_WALLET: WalletSummary = {
  address: '9xBf3mk2...3kR7mP',
  usdcBalance: 2450,
  cnftCount: 3,
  cnfts: [
    {
      id: 'asset_001',
      batchId: 'B-0046',
      mintAddress: 'CnfT9fE2...9Ka18P',
      materialType: 'HDPE',
      weightKg: 308,
      grade: 'A',
      status: 'verified',
      mintedAt: '2026-04-08T15:30:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'asset_002',
      batchId: 'B-0044',
      mintAddress: 'Dx82jkL1...6jQ14A',
      materialType: 'PET',
      weightKg: 198,
      grade: 'A',
      status: 'listed',
      mintedAt: '2026-04-07T12:00:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'asset_003',
      batchId: 'B-0039',
      mintAddress: 'Qe19LmN7...2pX43H',
      materialType: 'PP',
      weightKg: 126,
      grade: 'B',
      status: 'collateral',
      mintedAt: '2026-04-02T10:20:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=900&q=80',
    },
  ],
};
