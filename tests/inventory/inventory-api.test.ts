jest.mock('@/src/shared/services/api', () => ({ apiRequest: jest.fn() }));

import { apiRequest } from '@/src/shared/services/api';
import {
  getInventory,
  getInventoryItem,
  adjustStock,
  getInventoryAnalytics,
} from '@/src/features/inventory/services/inventory-api';

const mockApi = apiRequest as jest.Mock;

beforeEach(() => {
  mockApi.mockReset();
  mockApi.mockResolvedValue(undefined);
});

describe('getInventory', () => {
  it('requests the bare endpoint when no filters are given', async () => {
    await getInventory('tok');
    expect(mockApi).toHaveBeenCalledWith('/v1/inventory', { method: 'GET', token: 'tok' });
  });

  it('serializes a single filter', async () => {
    await getInventory('tok', { status: 'in_stock' });
    expect(mockApi).toHaveBeenCalledWith('/v1/inventory?status=in_stock', { method: 'GET', token: 'tok' });
  });

  it('serializes all filters together', async () => {
    await getInventory('tok', { material: 'pet', status: 'sold', limit: 10, offset: 20 });
    const [path] = mockApi.mock.calls[0];
    expect(path).toBe('/v1/inventory?material=pet&status=sold&limit=10&offset=20');
  });

  it('omits limit/offset when they are zero (falsy)', async () => {
    await getInventory('tok', { limit: 0, offset: 0 });
    expect(mockApi).toHaveBeenCalledWith('/v1/inventory', { method: 'GET', token: 'tok' });
  });

  it('returns whatever the api layer resolves', async () => {
    const items = [{ id: 'a' }];
    mockApi.mockResolvedValue(items);
    await expect(getInventory('tok')).resolves.toBe(items);
  });
});

describe('getInventoryItem', () => {
  it('builds the item path', async () => {
    await getInventoryItem('tok', 'item-1');
    expect(mockApi).toHaveBeenCalledWith('/v1/inventory/item-1', { method: 'GET', token: 'tok' });
  });
});

describe('adjustStock', () => {
  it('posts the delta and reason as a JSON body', async () => {
    await adjustStock('tok', 'item-1', { delta_grams: -500, reason: 'spoilage' });
    expect(mockApi).toHaveBeenCalledWith('/v1/inventory/item-1/movements', {
      method: 'POST',
      token: 'tok',
      body: JSON.stringify({ delta_grams: -500, reason: 'spoilage' }),
    });
  });

  it('supports a positive delta without a reason', async () => {
    await adjustStock('tok', 'item-1', { delta_grams: 250 });
    const [, init] = mockApi.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ delta_grams: 250 });
  });
});

describe('getInventoryAnalytics', () => {
  it('requests the analytics endpoint', async () => {
    await getInventoryAnalytics('tok');
    expect(mockApi).toHaveBeenCalledWith('/v1/inventory/analytics', { method: 'GET', token: 'tok' });
  });
});
