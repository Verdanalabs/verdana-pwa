import { MOCK_WALLET } from '@/mocks';
import type { CNFT, WalletSummary } from '@/types';

export function getMockWalletSummary(): WalletSummary {
  return MOCK_WALLET;
}

export function getMockWalletAssets(): readonly CNFT[] {
  return MOCK_WALLET.cnfts;
}

export function getMockWalletAssetById(id?: string): CNFT | undefined {
  return MOCK_WALLET.cnfts.find((asset) => asset.id === id);
}

export function getMockWalletAssetByBatchId(batchId?: string): CNFT | undefined {
  return MOCK_WALLET.cnfts.find((asset) => asset.batchId === batchId);
}
