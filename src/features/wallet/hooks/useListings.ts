import { useCallback, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createListing, cancelListing, getMyListings, type CreateListingParams } from '../services/listing-api';
import { ApiError } from '@/src/shared/services/api';
import type { Listing } from '@/types';

interface UseListingsResult {
  // Map of batch_id → active Listing (for quick lookup per asset card)
  listingByBatchId: Record<string, Listing>;
  isLoading: boolean;
  /** Set only for failures worth surfacing. A role with no seller view is not one. */
  error: string | null;
  create: (params: CreateListingParams) => Promise<void>;
  cancel: (listingId: string) => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * The signed-in account's own listings, for deciding whether one of their
 * assets is already on sale.
 *
 * Only a collector can hold listings, so /market/my-listings answers 403 for
 * every other role. That is a fact about the account, not a failure: the
 * correct result is an empty map, and the marketplace browse tab keeps working.
 * It used to reject instead, and nothing caught it, so opening the market as a
 * processor threw an unhandled rejection and the whole screen crashed.
 */
export function useListings(): UseListingsResult {
  const { getAccessToken } = usePrivy();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async (): Promise<Listing[] | null> => {
    const token = await getAccessToken();
    if (!token) return null;
    try {
      const data = await getMyListings(token);
      setError(null);
      return data;
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setError(null);
        return [];
      }
      setError(e instanceof Error ? e.message : 'Could not load your listings.');
      return [];
    }
  }, [getAccessToken]);

  const reload = useCallback(async () => {
    const data = await fetchListings();
    if (data) setListings(data);
  }, [fetchListings]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const data = await fetchListings();
        if (!cancelled && data) setListings(data);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fetchListings]);

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

  return { listingByBatchId, isLoading, error, create, cancel, reload };
}
