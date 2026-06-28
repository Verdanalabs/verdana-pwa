jest.mock('@/src/shared/services/api', () => ({ apiRequest: jest.fn() }));

import { apiRequest } from '@/src/shared/services/api';
import {
  createListing,
  cancelListing,
  getMyListings,
  getListing,
  getBrowseListings,
} from '@/src/features/wallet/services/listing-api';

const mockApi = apiRequest as jest.Mock;

beforeEach(() => {
  mockApi.mockReset();
  mockApi.mockResolvedValue(undefined);
});

describe('createListing', () => {
  it('posts the listing payload as a JSON body', async () => {
    await createListing('tok', { batch_id: 'b1', price_idr: 150000, note: 'hi' });
    expect(mockApi).toHaveBeenCalledWith('/v1/market/listings', {
      method: 'POST',
      token: 'tok',
      body: JSON.stringify({ batch_id: 'b1', price_idr: 150000, note: 'hi' }),
    });
  });
});

describe('cancelListing', () => {
  it('uses PATCH on the cancel sub-path', async () => {
    await cancelListing('tok', 'l1');
    expect(mockApi).toHaveBeenCalledWith('/v1/market/listings/l1/cancel', { method: 'PATCH', token: 'tok' });
  });
});

describe('getMyListings', () => {
  it('requests the my-listings endpoint', async () => {
    await getMyListings('tok');
    expect(mockApi).toHaveBeenCalledWith('/v1/market/my-listings', { method: 'GET', token: 'tok' });
  });
});

describe('getListing', () => {
  it('builds the listing detail path', async () => {
    await getListing('tok', 'l1');
    expect(mockApi).toHaveBeenCalledWith('/v1/market/listings/l1', { method: 'GET', token: 'tok' });
  });
});

describe('getBrowseListings', () => {
  it('requests the bare catalog when no params are given', async () => {
    await getBrowseListings('tok');
    expect(mockApi).toHaveBeenCalledWith('/v1/market/listings', { method: 'GET', token: 'tok' });
  });

  it('serializes material + pagination params', async () => {
    await getBrowseListings('tok', { material: 'pet', limit: 20, offset: 40 });
    const [path] = mockApi.mock.calls[0];
    expect(path).toBe('/v1/market/listings?material=pet&limit=20&offset=40');
  });
});
