export type ListingStatus = 'active' | 'cancelled' | 'sold';

export interface Listing {
  id: string;
  batch_id: string;
  seller_user_id: string;
  price_idr: number;
  status: ListingStatus;
  note?: string;
  expires_at?: string;
  listed_at: string;
  // Enriched from backend
  material: string;
  weight_grams?: number;
  asset_id?: string;
}
