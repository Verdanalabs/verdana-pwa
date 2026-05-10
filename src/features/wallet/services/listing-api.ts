import { apiRequest } from '@/src/shared/services/api';
import type { Listing } from '@/types';

export interface CreateListingParams {
  batch_id: string;
  price_idr: number;
  note?: string;
  expires_at?: string;
}

export async function createListing(token: string, params: CreateListingParams): Promise<Listing> {
  return apiRequest<Listing>('/v1/market/listings', {
    method: 'POST',
    token,
    body: JSON.stringify(params),
  });
}

export async function cancelListing(token: string, listingId: string): Promise<{ id: string; status: string }> {
  return apiRequest<{ id: string; status: string }>(`/v1/market/listings/${listingId}/cancel`, {
    method: 'PATCH',
    token,
  });
}

export async function getMyListings(token: string): Promise<Listing[]> {
  return apiRequest<Listing[]>('/v1/market/my-listings', {
    method: 'GET',
    token,
  });
}

export async function getBrowseListings(token: string, params?: { material?: string; limit?: number; offset?: number }): Promise<Listing[]> {
  const query = new URLSearchParams();
  if (params?.material) query.set('material', params.material);
  if (params?.limit)    query.set('limit', String(params.limit));
  if (params?.offset)   query.set('offset', String(params.offset));
  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<Listing[]>(`/v1/market/listings${qs}`, {
    method: 'GET',
    token,
  });
}
