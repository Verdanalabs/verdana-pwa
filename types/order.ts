export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  listing_id: string;
  buyer_user_id: string;
  seller_user_id: string;
  price_idr: number;
  status: OrderStatus;
  note?: string;
  created_at: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  // Enriched from listing + batch
  batch_id?: string;
  material?: string;
  weight_grams?: number;
}
