# Verdana Core API Specification

Comprehensive API specification for the Verdana Core backend, intended for frontend integration.

---

## Base URL

| Environment | URL |
|-------------|-----|
| Production  | `https://api.verdanaprotocol.io` |
| Staging     | `https://staging-api.verdanaprotocol.io` |

All versioned endpoints are prefixed with `/v1`.

---

## Response Envelope

All API responses follow a consistent JSON envelope:

```json
{
  "data": { ... } | null,
  "meta": { ... } | null,
  "error": null | {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": [
      { "field": "field_name", "message": "error description" }
    ]
  }
}
```

| State | Behavior |
|-------|----------|
| **Success** | `data` is populated, `error` is `null` |
| **Validation Error (400)** | `data` is `null`, `error` has a `details` array |
| **Other Errors** | `data` is `null`, `error` has `code` and `message` |

---

## Authentication

Verdana uses **Privy** for authentication.

- **Public Endpoints** — No headers required.
- **Authenticated Endpoints** — Require a Privy Access Token:

```
Authorization: Bearer <privy_access_token>
```

> Returns `401 Unauthorized` if token is missing or invalid.

---

## 1. System & Config

### `GET /healthz`

Basic health check.

- **Auth:** None

**Response:**
```json
{
  "data": {
    "status": "ok",
    "service": "core-api",
    "version": "1.0.0"
  },
  "meta": null,
  "error": null
}
```

---

### `GET /readyz`

Dependency readiness check (Postgres, Redis, Solana).

- **Auth:** None

**Response:**
```json
{
  "data": {
    "status": "ready",
    "checks": {
      "postgres": "ok",
      "redis": "ok",
      "solana": "ok"
    }
  },
  "meta": null,
  "error": null
}
```

---

### `GET /v1/config/launch-date`

Returns the scheduled application launch date.

- **Auth:** None

**Response:**
```json
{
  "data": {
    "launch_at": "2026-06-01T00:00:00Z",
    "updated_at": "2026-04-12T10:00:00Z"
  },
  "meta": null,
  "error": null
}
```

---

## 2. Waitlist

### `GET /v1/waitlist`

Returns waitlist landing page data, including available roles and launch date.

- **Auth:** None

**Response:**
```json
{
  "data": {
    "launch_at": "2026-06-01T00:00:00Z",
    "roles": [
      {
        "id": "uuid",
        "slug": "collector",
        "display_name": "Collector",
        "sort_order": 1
      }
    ]
  },
  "meta": null,
  "error": null
}
```

---

### `POST /v1/waitlist`

Join the waitlist.

- **Auth:** None *(Rate limited by IP)*

**Request Body:**
```json
{
  "email": "user@example.com",
  "role_id": "uuid"
}
```

**Response `201 Created`:**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role_id": "uuid",
    "created_at": "2026-04-17T12:00:00Z"
  },
  "meta": null,
  "error": null
}
```

---

## 3. Auth & Profiles

### `GET /v1/auth/roles`

Lists roles available for self-registration.

- **Auth:** None

**Response:**
```json
{
  "data": [
    {
      "slug": "collector",
      "label": "Supplier / Collector",
      "description": "Field worker..."
    }
  ],
  "meta": null,
  "error": null
}
```

---

### `POST /v1/auth/sync`

Synchronizes Privy identity with Verdana profile. Should be called **after every login**.

- **Auth:** Bearer Token (Privy JWT)

**Request Body:**
```json
{
  "role": "collector",
  "wallet_address": "SolanaAddress...",
  "display_name": "John Doe"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "role": "collector",
    "display_name": "John Doe",
    "email": "john@example.com",
    "wallet_address": "SolanaAddress...",
    "created_at": "2026-04-17T12:00:00Z",
    "is_new": true
  },
  "meta": null,
  "error": null
}
```

---

### `GET /v1/users/me`

Returns the authenticated user's own profile.

- **Auth:** Bearer Token

> **Response:** Same shape as `/v1/auth/sync` (without `is_new`).

---

## 4. PVP Sites (Point of Verification)

### `GET /v1/pvp-sites`

Lists all active recycling/verification sites.

- **Auth:** Bearer Token

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Verdana HQ Site",
      "address": "123 Green St",
      "latitude": -6.123,
      "longitude": 106.123,
      "radius_meters": 500,
      "is_active": true,
      "created_at": "..."
    }
  ],
  "meta": null,
  "error": null
}
```

---

## 5. Media & Uploads

### `POST /v1/media/upload-url`

Generates a presigned R2/S3 URL for direct file upload.

- **Auth:** Bearer Token
- **Allowed Content-Types:** `image/jpeg`, `image/png`, `image/webp`, `video/mp4`

**Request Body:**
```json
{
  "batch_id": "uuid",
  "content_type": "image/jpeg",
  "filename": "batch_photo.jpg"
}
```

**Response:**
```json
{
  "data": {
    "upload_url": "https://...",
    "storage_key": "batches/uuid/random-id.jpg",
    "expires_at": "2026-04-17T13:00:00Z"
  },
  "meta": null,
  "error": null
}
```

---

## 6. Batches

### `GET /v1/batches`

Lists batches relevant to the user (as collector or processor).

- **Auth:** Bearer Token
- **Query Params:** `status` *(optional)* — filter by status (e.g., `registered`, `cosigned`)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "registered",
      "material": "PET",
      "collector_user_id": "uuid",
      "processor_user_id": null,
      "pvp_site_id": null,
      "estimated_weight_grams": 5000,
      "actual_weight_grams": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "meta": null,
  "error": null
}
```

---

### `POST /v1/batches`

Registers a new batch of recycled material.

- **Auth:** Bearer Token

**Request Body:**
```json
{
  "collector_user_id": "uuid",
  "estimated_weight_grams": 5000,
  "material": "PET",
  "origin_latitude": -6.456,
  "origin_longitude": 106.456,
  "media": [
    {
      "storage_key": "batches/...",
      "media_kind": "pickup_photo",
      "mime_type": "image/jpeg",
      "sha256_hex": "...",
      "captured_at": "2026-04-17T12:00:00Z"
    }
  ]
}
```

> **Response:** Full Batch Detail (same as `GET /v1/batches/{batchID}`).

---

### `GET /v1/batches/{batchID}`

Returns full details of a specific batch, including media, cosign info, and on-chain record if available.

- **Auth:** Bearer Token

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "status": "registered",
    "material": "PET",
    "collector_user_id": "uuid",
    "collector_wallet": "...",
    "processor_user_id": "...",
    "processor_wallet": "...",
    "pvp_site_id": "...",
    "estimated_weight_grams": 5000,
    "actual_weight_grams": 5100,
    "origin_latitude": -6.456,
    "origin_longitude": 106.456,
    "media": [
      {
        "id": "uuid",
        "media_kind": "pickup_photo",
        "storage_key": "...",
        "mime_type": "image/jpeg",
        "sha256_hex": "...",
        "captured_at": "...",
        "created_at": "..."
      }
    ],
    "cosign_event": {
      "collector_signature": "...",
      "processor_signature": "...",
      "payload_hash": "...",
      "payload_json": { },
      "signed_at": "..."
    },
    "batch_metadata": {
      "status": "pinned",
      "ipfs_cid": "...",
      "metadata_json": { }
    },
    "cnft_record": {
      "asset_id": "...",
      "tx_signature": "...",
      "minted_at": "..."
    },
    "created_at": "...",
    "updated_at": "..."
  },
  "meta": null,
  "error": null
}
```

---

### `POST /v1/batches/{batchID}/cosign`

Submits a dual-signature co-sign for a batch.

- **Auth:** Bearer Token

**Request Body:**
```json
{
  "processor_user_id": "uuid",
  "pvp_site_id": "uuid",
  "actual_weight_grams": 5100,
  "weighed_at": "2026-04-17T14:00:00Z",
  "latitude": -6.123,
  "longitude": 106.123,
  "collector_signature": "...",
  "processor_signature": "...",
  "schema_version": 1
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "status": "cosigned"
  },
  "meta": {
    "prepare_metadata_job_id": 123
  },
  "error": null
}
```

**Errors:**

| Code | Status | Description |
|------|--------|-------------|
| `GEOFENCE_VIOLATION` | 400 | Latitude/longitude outside PVP site radius |
| `INVALID_COLLECTOR_SIGNATURE` | 422 | Signature verification failed |

---

## 7. Admin

> Requires **Admin Permissions**.

### `POST /v1/admin/users`

Manually creates a user.

**Request Body:**
```json
{
  "display_name": "Admin User",
  "email": "admin@verdana.io",
  "role": "processor",
  "wallet_address": "...",
  "wallet_provider": "..."
}
```

**Response `201 Created`:**
```json
{
  "data": {
    "id": "uuid",
    "display_name": "Admin User"
  },
  "meta": null,
  "error": null
}
```

---

### `POST /v1/admin/pvp-sites`

Creates a new PVP site.

**Request Body:** `name`, `address`, `latitude`, `longitude`, `radius_meters`

**Response `201 Created`:**
```json
{
  "data": {
    "id": "uuid",
    "name": "..."
  },
  "meta": null,
  "error": null
}
```

---

## Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Malformed request or failing field validation |
| `MISSING_TOKEN` | 401 | Authorization header missing or malformed |
| `INVALID_TOKEN` | 401 | Privy token is expired or invalid |
| `UNAUTHORIZED` | 401 | Authentication required |
| `USER_NOT_REGISTERED` | 401 | Valid token but no Verdana user profile found |
| `BATCH_NOT_FOUND` | 404 | Resource does not exist |
| `ALREADY_REGISTERED` | 409 | Email already on waitlist |
| `WALLET_ALREADY_LINKED` | 409 | Wallet address already in use |
| `GEOFENCE_VIOLATION` | 400 | Co-sign location outside PVP radius |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
