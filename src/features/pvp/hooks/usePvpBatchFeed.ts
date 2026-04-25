import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getPvpBatches, type PvpBatchListItem } from '@/src/features/batch/services/batch-api';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

interface UsePvpBatchFeedResult {
  batches: PvpBatchListItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function usePvpBatchFeed(): UsePvpBatchFeedResult {
  const { token } = usePvpAuth();
  const [batches, setBatches] = useState<PvpBatchListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!token) {
      setBatches([]);
      setError('Not authenticated');
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await getPvpBatches(token);
      setBatches(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load PVP batches');
    } finally {
      if (mode === 'refresh') {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    void load('initial');
  }, [load]);

  useFocusEffect(useCallback(() => {
    void load('refresh');
  }, [load]));

  const reload = useCallback(async () => {
    await load('refresh');
  }, [load]);

  return { batches, isLoading, isRefreshing, error, reload };
}
