jest.mock('@/src/shared/services/api', () => ({ apiRequest: jest.fn() }));

import { apiRequest } from '@/src/shared/services/api';
import {
  createOrder,
  getOrders,
  getOrder,
  confirmOrder,
  completeOrder,
  cancelOrder,
} from '@/src/features/wallet/services/order-api';

const mockApi = apiRequest as jest.Mock;

beforeEach(() => {
  mockApi.mockReset();
  mockApi.mockResolvedValue(undefined);
});

describe('createOrder', () => {
  it('posts a note when supplied', async () => {
    await createOrder('tok', 'l1', { note: 'please' });
    expect(mockApi).toHaveBeenCalledWith('/v1/market/listings/l1/orders', {
      method: 'POST',
      token: 'tok',
      body: JSON.stringify({ note: 'please' }),
    });
  });

  it('defaults to an empty object body when no params are passed', async () => {
    await createOrder('tok', 'l1');
    const [, init] = mockApi.mock.calls[0];
    expect(init.body).toBe('{}');
  });
});

describe('getOrders', () => {
  it('defaults to the buyer view with no query string', async () => {
    await getOrders('tok');
    expect(mockApi).toHaveBeenCalledWith('/v1/market/orders', { method: 'GET', token: 'tok' });
  });

  it('adds role=selling for the seller view', async () => {
    await getOrders('tok', 'selling');
    expect(mockApi).toHaveBeenCalledWith('/v1/market/orders?role=selling', { method: 'GET', token: 'tok' });
  });

  it('treats explicit buying as the default (no query string)', async () => {
    await getOrders('tok', 'buying');
    expect(mockApi).toHaveBeenCalledWith('/v1/market/orders', { method: 'GET', token: 'tok' });
  });
});

describe('order detail + transitions', () => {
  it('getOrder builds the detail path', async () => {
    await getOrder('tok', 'o1');
    expect(mockApi).toHaveBeenCalledWith('/v1/market/orders/o1', { method: 'GET', token: 'tok' });
  });

  it('confirmOrder posts to the confirm sub-path', async () => {
    await confirmOrder('tok', 'o1');
    expect(mockApi).toHaveBeenCalledWith('/v1/market/orders/o1/confirm', { method: 'POST', token: 'tok' });
  });

  it('completeOrder posts to the complete sub-path', async () => {
    await completeOrder('tok', 'o1');
    expect(mockApi).toHaveBeenCalledWith('/v1/market/orders/o1/complete', { method: 'POST', token: 'tok' });
  });

  it('cancelOrder posts to the cancel sub-path', async () => {
    await cancelOrder('tok', 'o1');
    expect(mockApi).toHaveBeenCalledWith('/v1/market/orders/o1/cancel', { method: 'POST', token: 'tok' });
  });
});
