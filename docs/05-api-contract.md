# Verdana Product Brief 05 - API Contract

## Purpose

Dokumen ini mendefinisikan kontrak API minimum agar mobile React Native bisa dibangun lebih dulu tanpa ambigu.

## General Rules

- Semua response JSON
- Semua waktu menggunakan ISO 8601 UTC
- Semua ID string
- Error harus konsisten dan machine-readable

## Authentication

### POST `/auth/verify`

Tujuan:

- verifikasi token login
- create or get user
- return session bootstrap data

Request:

```json
{
  "provider": "google",
  "idToken": "string",
  "role": "supplier"
}
```

Response:

```json
{
  "user": {
    "id": "usr_001",
    "role": "supplier",
    "name": "Tio Rahardian",
    "walletAddress": "9xBf3mk2...3kR7mP"
  },
  "accessToken": "jwt-or-session-token",
  "refreshToken": "refresh-token"
}
```

## Supplier Endpoints

### GET `/me`

Return bootstrap profile supplier.

### GET `/me/dashboard`

Return dashboard summary:

```json
{
  "totalKg": 3247,
  "batchCount": 47,
  "cnftCount": 33,
  "usdcBalance": 2450,
  "reputationScore": 95.2,
  "pendingTransitCount": 2,
  "latestBatches": []
}
```

### POST `/batches`

Create batch metadata.

Request:

```json
{
  "materialType": "PET",
  "estimatedWeightKg": 150,
  "grade": "A",
  "gpsLat": -6.527,
  "gpsLng": 107.081,
  "pvpId": "PVP-001",
  "photoUploadKey": "uploads/batch-temp-001.jpg",
  "capturedAt": "2026-04-10T08:12:00Z"
}
```

Response:

```json
{
  "id": "B-0047",
  "status": "transit"
}
```

### GET `/batches`

Query params:

- `status`
- `materialType`
- `cursor`
- `limit`

### GET `/batches/:id`

Return batch detail, timeline, and on-chain data if available.

### POST `/batches/:id/checkin`

Optional endpoint jika geofenced arrival dipakai.

### POST `/batches/:id/photo-upload-url`

Saran untuk mobile:

- backend memberi presigned upload URL
- app upload file langsung ke storage

Response example:

```json
{
  "uploadUrl": "https://storage.example/upload",
  "uploadKey": "uploads/batch-temp-001.jpg",
  "expiresAt": "2026-04-10T08:30:00Z"
}
```

## PVP Endpoints

### GET `/pvp/queue`

Return incoming queue for operator.

### POST `/batches/:id/validate`

Request:

```json
{
  "actualWeightKg": 312,
  "finalGrade": "A",
  "conditionChecks": {
    "materialMatches": true,
    "noContamination": true
  },
  "notes": "optional"
}
```

Response:

```json
{
  "id": "B-0046",
  "status": "verified"
}
```

### POST `/batches/:id/cosign`

Request:

```json
{
  "actorRole": "processor",
  "confirmed": true
}
```

Response:

```json
{
  "id": "B-0046",
  "status": "minting",
  "mintJobId": "job_001"
}
```

## Wallet Endpoints

### GET `/wallet`

Return wallet summary and balances.

### GET `/wallet/cnfts`

Return list of cNFT owned by current user.

### GET `/wallet/cnfts/:id`

Return cNFT detail.

## Event and Status Contract

Client harus mengerti enum berikut:

- `draft`
- `submitted`
- `transit`
- `pending_validation`
- `verified`
- `minting`
- `minted`
- `listed`
- `collateral`
- `rejected`

## Error Shape

```json
{
  "error": {
    "code": "BATCH_INVALID_WEIGHT",
    "message": "Actual weight exceeds allowed threshold",
    "details": {}
  }
}
```

## Mobile-Specific Contract Notes

- endpoint upload wajib efisien untuk file besar
- response detail batch harus cukup lengkap agar screen detail tidak butuh banyak round trip
- pagination wajib cursor-based untuk history panjang
- backend perlu mendukung polling ringan atau push-friendly status refresh untuk minting

---

## Priority 2 — Inventory & Marketplace Orders (implemented)

Live in `core-api` behind the standard `{ data, meta, error }` envelope and `Authorization: Bearer <token>`. Material values are lowercase (`pet|hdpe|ldpe|pp|mix`).

### Inventory

Inventory items are auto-generated (one per batch) when a batch reaches `minted`.

| Method | Path | Notes |
| ------ | ---- | ----- |
| GET  | `/v1/inventory` | Owner's items. Query: `material`, `status` (`in_stock\|reserved\|sold\|depleted`), `limit` (≤50), `offset`. `meta` carries `{offset,limit,count}`. |
| GET  | `/v1/inventory/{itemID}` | Item + `movements[]` (stock-movement ledger). Owner-scoped (403 otherwise). |
| POST | `/v1/inventory/{itemID}/movements` | Manual adjustment. Body `{ "delta_grams": number, "reason"?: string }`; negative draws down (cannot go below 0; reaching 0 → `depleted`). |
| GET  | `/v1/inventory/analytics` | `{ total_items, total_grams, by_material[], by_status[], by_grade[] }` (buckets: `{ key, item_count, total_grams }`). |

Inventory item shape: `{ id, batch_id, owner_user_id, material, weight_grams, grade?, category?, status, asset_id?, created_at }`.

### Marketplace Orders

Layered on existing `/v1/market/listings`. Order lifecycle: `pending → confirmed → completed`, plus `cancelled`.

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/v1/market/listings/{listingID}/orders` | Buyer places an order (listing must be `active`, buyer ≠ seller; one open order per listing). Body `{ "note"?: string }`. |
| GET  | `/v1/market/orders` | Caller's orders. `?role=selling` for orders on the caller's listings; default = orders the caller placed. |
| GET  | `/v1/market/orders/{orderID}` | Party-only (buyer or seller). |
| POST | `/v1/market/orders/{orderID}/confirm` | Seller only; `pending → confirmed`. |
| POST | `/v1/market/orders/{orderID}/complete` | Either party; `confirmed → completed`. Marks listing sold + inventory sold (outbound movement), transactionally. |
| POST | `/v1/market/orders/{orderID}/cancel` | Either party; from `pending`/`confirmed`. |

Order shape: `{ id, listing_id, buyer_user_id, seller_user_id, price_idr, status, note?, created_at, confirmed_at?, completed_at?, cancelled_at?, batch_id?, material?, weight_grams? }`.
