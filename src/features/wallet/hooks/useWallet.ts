import { useCallback, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { getMe, type VerdanaUser } from '@/src/features/auth/services/auth-api';
import {
  getBatch,
  getBatches,
  type ApiBatchDetail,
} from '@/src/features/batch/services/batch-api';
import type { CNFT, MaterialType, WalletSummary } from '@/types';

import { runtimeConfig } from '@/src/shared/config/runtime-config';

const API_BASE = runtimeConfig.apiBaseUrl;

function mediaUrl(storageKey: string) {
  return `${API_BASE}/v1/media/${storageKey}`;
}

function toMaterialType(material: string): MaterialType {
  switch (material.toUpperCase()) {
    case 'PET':
    case 'HDPE':
    case 'LDPE':
    case 'PP':
    case 'PS':
    case 'PVC':
      return material.toUpperCase() as MaterialType;
    default:
      return 'OTHER';
  }
}

function toWalletAsset(batch: ApiBatchDetail): CNFT | null {
  const mintedAt = batch.cnft_record?.minted_at;
  if (!mintedAt) return null;

  const photo = batch.media.find((item) => item.media_kind === 'photo');
  const assetId = batch.cnft_record?.asset_id ?? batch.id;

  return {
    id: assetId,
    batchId: batch.id,
    assetId,
    materialType: toMaterialType(batch.material),
    weightKg: (batch.actual_weight_grams ?? batch.estimated_weight_grams ?? 0) / 1000,
    status: 'minted',
    mintedAt,
    imageUrl: photo ? mediaUrl(photo.storage_key) : undefined,
    txSignature: batch.cnft_record?.tx_signature,
    merkleTree: batch.cnft_record?.merkle_tree,
    leafIndex: batch.cnft_record?.leaf_index,
  };
}

async function buildWalletSummary(token: string): Promise<{ wallet: WalletSummary; user: VerdanaUser }> {
  const [user, mintedBatches] = await Promise.all([
    getMe(token),
    getBatches(token, 'minted'),
  ]);

  const details = await Promise.all(
    mintedBatches.map((batch) => getBatch(token, batch.id)),
  );

  const cnfts = details
    .map(toWalletAsset)
    .filter((asset): asset is CNFT => asset !== null)
    .sort((left, right) => (
      new Date(right.mintedAt).getTime() - new Date(left.mintedAt).getTime()
    ));

  return {
    user,
    wallet: {
      address: user.wallet_address ?? '-',
      cnftCount: cnfts.length,
      cnfts,
    },
  };
}

interface UseWalletResult {
  wallet: WalletSummary | null;
  user: VerdanaUser | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useWallet(): UseWalletResult {
  const { getAccessToken } = usePrivy();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [user, setUser] = useState<VerdanaUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const result = await buildWalletSummary(token);
    setUser(result.user);
    setWallet(result.wallet);
  }, [getAccessToken]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const token = await getAccessToken();
        if (!token) throw new Error('Not authenticated');

        const result = await buildWalletSummary(token);
        if (cancelled) return;

        setUser(result.user);
        setWallet(result.wallet);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load wallet');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken]);

  const refresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to refresh wallet');
    } finally {
      setIsRefreshing(false);
    }
  }, [reload]);

  return { wallet, user, isLoading, isRefreshing, error, reload: refresh };
}
