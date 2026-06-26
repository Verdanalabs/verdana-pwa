import { apiRequest } from '@/src/shared/services/api';
import type { Order } from '@/types';

export async function createOrder(token: string, listingId: string, params?: { note?: string }): Promise<Order> {
  return apiRequest<Order>(`/v1/market/listings/${listingId}/orders`, {
    method: 'POST',
    token,
    body: JSON.stringify(params ?? {}),
  });
}

export async function getOrders(token: string, role: 'buying' | 'selling' = 'buying'): Promise<Order[]> {
  const qs = role === 'selling' ? '?role=selling' : '';
  return apiRequest<Order[]>(`/v1/market/orders${qs}`, { method: 'GET', token });
}

export async function getOrder(token: string, orderId: string): Promise<Order> {
  return apiRequest<Order>(`/v1/market/orders/${orderId}`, { method: 'GET', token });
}

export async function confirmOrder(token: string, orderId: string): Promise<Order> {
  return apiRequest<Order>(`/v1/market/orders/${orderId}/confirm`, { method: 'POST', token });
}

export async function completeOrder(token: string, orderId: string): Promise<Order> {
  return apiRequest<Order>(`/v1/market/orders/${orderId}/complete`, { method: 'POST', token });
}

export async function cancelOrder(token: string, orderId: string): Promise<Order> {
  return apiRequest<Order>(`/v1/market/orders/${orderId}/cancel`, { method: 'POST', token });
}
