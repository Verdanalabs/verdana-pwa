import { useCallback, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createListing, cancelListing, getMyListings, type CreateListingParams } from '../services/listing-api';
import type { Listing } from '@/types';

interface UseListingsResult {
  // Map of batch_id → active Listing (for quick lookup per asset card)
  listingByBatchId: Record<string, Listing>;
  isLoading: boolean;
  create: (params: CreateListingParams) => Promise<void>;
  cancel: (listingId: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useListings(): UseListingsResult {
  const { getAccessToken } = usePrivy();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    const data = await getMyListings(token);
    setListings(data);
  }, [getAccessToken]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const token = await getAccessToken();
        if (!token || cancelled) return;
        const data = await getMyListings(token);
        if (!cancelled) setListings(data);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [getAccessToken]);

  const listingByBatchId: Record<string, Listing> = {};
  for (const l of listings) {
    // Keep only the most recent listing per batch (active takes priority)
    if (!listingByBatchId[l.batch_id] || l.status === 'active') {
      listingByBatchId[l.batch_id] = l;
    }
  }

  const create = useCallback(async (params: CreateListingParams) => {
    const token = await getAccessToken();
    if (!token) throw new Error('Not authenticated');
    const newListing = await createListing(token, params);
    setListings((prev) => [newListing, ...prev]);
  }, [getAccessToken]);

  const cancel = useCallback(async (listingId: string) => {
    const token = await getAccessToken();
    if (!token) throw new Error('Not authenticated');
    await cancelListing(token, listingId);
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: 'cancelled' as const } : l))
    );
  }, [getAccessToken]);

  return { listingByBatchId, isLoading, create, cancel, reload };
}
