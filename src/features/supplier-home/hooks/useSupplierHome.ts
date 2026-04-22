import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { getMe, type VerdanaUser } from '@/src/features/auth/services/auth-api';
import { getBatches, type ApiBatch } from '@/src/features/batch/services/batch-api';
import { type BatchSummary } from '@/types';
import { type DashboardSummary } from '@/types';

// Map API batch status → UI BatchStatus
function mapStatus(apiStatus: string): BatchSummary['status'] {
  switch (apiStatus) {
    case 'registered': return 'transit';
    case 'cosigned':   return 'verified';
    default:           return 'transit';
  }
}

function toBatchSummary(b: ApiBatch): BatchSummary {
  return {
    id: b.id,
    status: mapStatus(b.status),
    materialType: b.material as BatchSummary['materialType'],
    estimatedWeightKg: b.estimated_weight_grams / 1000,
    pvpName: b.pvp_site_id ?? 'Unknown Site',
    capturedAt: b.created_at,
  };
}

function deriveDashboard(batches: ApiBatch[]): DashboardSummary {
  const totalKg = batches.reduce((sum, b) => {
    const grams = b.actual_weight_grams ?? b.estimated_weight_grams;
    return sum + grams / 1000;
  }, 0);

  return {
    totalKg: Math.round(totalKg * 10) / 10,
    batchCount: batches.length,
    cnftCount: batches.filter((b) => b.status === 'cosigned').length,
    pendingTransitCount: batches.filter((b) => b.status === 'registered').length,
    // Not available from API yet — kept as placeholder
    reputationScore: 0,
    usdcBalance: 0,
  };
}

interface SupplierHomeData {
  isLoading: boolean;
  error: string | null;
  user: VerdanaUser | null;
  batches: BatchSummary[];
  dashboard: DashboardSummary | null;
}

export function useSupplierHome(): SupplierHomeData {
  const { getAccessToken } = usePrivy();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<VerdanaUser | null>(null);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const token = await getAccessToken();
        if (!token) throw new Error('No token');

        const [meData, batchData] = await Promise.all([
          getMe(token),
          getBatches(token),
        ]);

        if (cancelled) return;

        setUser(meData);
        setBatches(batchData.map(toBatchSummary));
        setDashboard(deriveDashboard(batchData));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load data');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [getAccessToken]);

  return { isLoading, error, user, batches, dashboard };
}
