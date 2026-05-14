import { useCallback, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { getMe, type VerdanaUser } from '@/src/features/auth/services/auth-api';
import { getBatches, type ApiBatch } from '@/src/features/batch/services/batch-api';
import { type BatchSummary, type BatchStatus, type DashboardSummary } from '@/types';

function mapStatus(apiStatus: string): BatchStatus {
  switch (apiStatus) {
    case 'mint_pending':
    case 'mint_failed':
      return 'cosigned';
    default:
      return apiStatus as BatchStatus;
  }
}

const STATUS_PRIORITY: Record<string, number> = {
  pending:            0,
  accepted:           1,
  pickup_dispatched:  2,
  cosigning:          3,
  cosigned:           4,
  mint_pending:       5,
  mint_failed:        5,
  minted:             6,
};

function sortBatches(batches: ApiBatch[]): ApiBatch[] {
  return [...batches].sort((a, b) => {
    const priorityDiff = (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function toBatchSummary(b: ApiBatch): BatchSummary {
  return {
    id: b.id,
    status: mapStatus(b.status),
    materialType: b.material.toUpperCase() as BatchSummary['materialType'],
    estimatedWeightKg: b.estimated_weight_grams != null ? b.estimated_weight_grams / 1000 : 0,
    pvpName: '',
    capturedAt: b.created_at,
  };
}

function deriveDashboard(batches: ApiBatch[], user: VerdanaUser): DashboardSummary {
  const totalKg = batches.reduce((sum, b) => {
    const grams = b.actual_weight_grams ?? b.estimated_weight_grams ?? 0;
    return sum + grams / 1000;
  }, 0);

  return {
    totalKg: Math.round(totalKg * 10) / 10,
    batchCount: batches.length,
    cnftCount: batches.filter((b) => b.status === 'minted').length,
    pendingTransitCount: batches.filter((b) =>
      ['pending', 'accepted', 'pickup_dispatched', 'cosigning'].includes(b.status)
    ).length,
    reputationScore: user.reputation?.score ?? null,
    reputationTier: user.reputation?.tier as DashboardSummary['reputationTier'],
    reputationState: (user.reputation?.state as DashboardSummary['reputationState']) ?? 'unavailable',
    usdcBalance: 0,
  };
}

interface SupplierHomeData {
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  user: VerdanaUser | null;
  batches: BatchSummary[];
  dashboard: DashboardSummary | null;
  refresh: () => Promise<void>;
}

export function useSupplierHome(): SupplierHomeData {
  const { getAccessToken } = usePrivy();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<VerdanaUser | null>(null);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    try {
      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const token = await getAccessToken();
      if (!token) throw new Error('No token');

      const [meData, batchData] = await Promise.all([
        getMe(token),
        getBatches(token),
      ]);

      setUser(meData);
      setBatches(sortBatches(batchData).map(toBatchSummary));
      setDashboard(deriveDashboard(batchData, meData));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      if (mode === 'refresh') {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [getAccessToken]);

  useEffect(() => {
    void load('initial');
  }, [load]);

  const refresh = useCallback(async () => {
    await load('refresh');
  }, [load]);

  return { isLoading, isRefreshing, error, user, batches, dashboard, refresh };
}
