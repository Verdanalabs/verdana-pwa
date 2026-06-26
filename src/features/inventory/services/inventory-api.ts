import { apiRequest } from '@/src/shared/services/api';

export type InventoryStatus = 'in_stock' | 'reserved' | 'sold' | 'depleted';

export interface InventoryItem {
  id: string;
  batch_id: string;
  owner_user_id: string;
  material: string;
  weight_grams: number;
  grade?: string;
  category?: string;
  status: InventoryStatus;
  asset_id?: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  movement_type: string;
  delta_grams: number;
  balance_after_grams: number;
  reason?: string;
  created_at: string;
}

export interface InventoryItemDetail extends InventoryItem {
  movements: StockMovement[];
}

export interface InventoryBucket {
  key: string;
  item_count: number;
  total_grams: number;
}

export interface InventoryAnalytics {
  total_items: number;
  total_grams: number;
  by_material: InventoryBucket[];
  by_status: InventoryBucket[];
  by_grade: InventoryBucket[];
  by_category: InventoryBucket[];
}

export interface InventoryFilters {
  material?: string;
  status?: InventoryStatus;
  limit?: number;
  offset?: number;
}

export async function getInventory(token: string, filters?: InventoryFilters): Promise<InventoryItem[]> {
  const query = new URLSearchParams();
  if (filters?.material) query.set('material', filters.material);
  if (filters?.status) query.set('status', filters.status);
  if (filters?.limit) query.set('limit', String(filters.limit));
  if (filters?.offset) query.set('offset', String(filters.offset));
  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<InventoryItem[]>(`/v1/inventory${qs}`, { method: 'GET', token });
}

export async function getInventoryItem(token: string, itemId: string): Promise<InventoryItemDetail> {
  return apiRequest<InventoryItemDetail>(`/v1/inventory/${itemId}`, { method: 'GET', token });
}

export async function adjustStock(
  token: string,
  itemId: string,
  params: { delta_grams: number; reason?: string },
): Promise<InventoryItem> {
  return apiRequest<InventoryItem>(`/v1/inventory/${itemId}/movements`, {
    method: 'POST',
    token,
    body: JSON.stringify(params),
  });
}

export async function getInventoryAnalytics(token: string): Promise<InventoryAnalytics> {
  return apiRequest<InventoryAnalytics>('/v1/inventory/analytics', { method: 'GET', token });
}
