import { apiRequest } from '@/src/shared/services/api';

export interface ApiBatch {
  id: string;
  status: string;
  material: string;
  collector_user_id: string;
  processor_user_id: string | null;
  pvp_site_id: string | null;
  estimated_weight_grams: number;
  actual_weight_grams: number | null;
  created_at: string;
  updated_at: string;
}

export interface ApiBatchMedia {
  id: string;
  media_kind: string;
  storage_key: string;
  mime_type?: string;
  sha256_hex?: string;
  captured_at?: string;
  created_at: string;
}

export interface ApiBatchDetail {
  id: string;
  status: string;
  material: string;
  collector_user_id: string;
  collector_wallet?: string;
  processor_user_id?: string;
  processor_wallet?: string;
  pvp_site_id?: string;
  estimated_weight_grams?: number;
  actual_weight_grams?: number;
  created_at: string;
  updated_at: string;
  weighed_at?: string;
  delivered_at?: string;
  origin_latitude?: number;
  origin_longitude?: number;
  collector_gps_lat?: number;
  collector_gps_lng?: number;
  pickup_gps_lat?: number;
  pickup_gps_lng?: number;
  pickup_gps_at?: string;
  collector_cosign_gps_lat?: number;
  collector_cosign_gps_lng?: number;
  proximity_check_passed?: boolean;
  proximity_distance_m?: number;
  media: ApiBatchMedia[];
  cosign_event?: {
    signed_at: string;
    payload_hash: string;
  };
  cnft_record?: {
    asset_id?: string;
    tx_signature?: string;
    minted_at?: string;
    merkle_tree?: string;
    leaf_index?: number;
  };
  batch_metadata?: {
    status: string;
    ipfs_cid?: string;
    last_error?: string;
  };
}

export interface UploadUrlResponse {
  upload_url: string;
  storage_key: string;
  expires_at: string;
}

export interface CreateBatchPayload {
  collector_user_id: string;
  pvp_site_id?: string;
  material: string;
  estimated_weight_grams: number;
  origin_latitude: number;
  origin_longitude: number;
  collector_gps_lat?: number;
  collector_gps_lng?: number;
  collector_gps_accuracy_m?: number;
  media: {
    storage_key: string;
    media_kind: string;
    mime_type: string;
    captured_at?: string | null;
    sha256_hex?: string;
  }[];
}

export interface PvpBatchListItem {
  id: string;
  status: string;
  material: string;
  collector_user_id: string;
  processor_user_id?: string;
  estimated_weight_grams?: number;
  actual_weight_grams?: number;
  created_at: string;
  weighed_at?: string;
}

export interface PvpWeighPayload {
  actual_weight_grams: number;
  latitude: number;
  longitude: number;
  gps_accuracy_m?: number;
  weighed_at: string;
}

export function getBatch(token: string, id: string): Promise<ApiBatchDetail> {
  return apiRequest<ApiBatchDetail>(`/v1/batches/${id}`, { token });
}

export function getBatches(token: string, status?: string): Promise<ApiBatch[]> {
  const query = status ? `?status=${status}` : '';
  return apiRequest<ApiBatch[]>(`/v1/batches${query}`, { token });
}

export function createUploadUrl(
  token: string,
  payload: { batch_id: string; content_type: string; filename: string },
): Promise<UploadUrlResponse> {
  return apiRequest<UploadUrlResponse>('/v1/media/upload-url', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function createBatch(token: string, payload: CreateBatchPayload): Promise<ApiBatch> {
  return apiRequest<ApiBatch>('/v1/batches', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export interface CosignPayload {
  latitude: number;
  longitude: number;
  schema_version?: number;
  collector_signature?: string;
  processor_signature?: string;
}

export function cosignBatch(token: string, batchId: string, payload: CosignPayload): Promise<ApiBatchDetail> {
  return apiRequest<ApiBatchDetail>(`/v1/batches/${batchId}/cosign`, {
    method: 'POST',
    token,
    body: JSON.stringify({ schema_version: 1, ...payload }),
  });
}

export function acceptBatch(token: string, batchId: string): Promise<{ id: string; status: string }> {
  return apiRequest<{ id: string; status: string }>(`/v1/batches/${batchId}/accept`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({}),
  });
}

export function dispatchBatch(token: string, batchId: string): Promise<{ id: string; status: string }> {
  return apiRequest<{ id: string; status: string }>(`/v1/batches/${batchId}/dispatch`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({}),
  });
}

export function pvpWeighBatch(token: string, batchId: string, payload: PvpWeighPayload): Promise<ApiBatchDetail> {
  return apiRequest<ApiBatchDetail>(`/v1/batches/${batchId}/pvp-weigh`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });
}

export function getPvpBatches(token: string, status?: string): Promise<PvpBatchListItem[]> {
  const query = status ? `?status=${status}` : '';
  return apiRequest<PvpBatchListItem[]>(`/v1/pvp/batches${query}`, { token });
}

export function getPvpSites(token: string): Promise<{ id: string; name: string; latitude: number; longitude: number; radius_meters: number }[]> {
  return apiRequest(`/v1/pvp-sites`, { token });
}
