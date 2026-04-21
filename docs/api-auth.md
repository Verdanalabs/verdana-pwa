# Auth API Contract

## Overview

Authentication is handled by [Privy](https://privy.io). The client SDK manages the full login/register UI, OTP, OAuth, and session tokens — the backend never handles passwords or raw credentials.

After every successful Privy login the client must call `POST /v1/auth/sync` to bootstrap or retrieve the Verdana user record. All other authenticated endpoints require the Privy access token in the `Authorization` header.

---

## Response Envelope

All responses follow a consistent envelope structure:

```json
{
  "data": { ... } | null,
  "meta": { ... } | null,
  "error": null | {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": [
      { "field": "field_name", "message": "what is wrong" }
    ]
  }
}
```

- On success: `data` is populated, `error` is `null`
- On failure: `data` is `null`, `error` is populated
- `details` is only present on `400 VALIDATION_ERROR` responses

---

## Endpoints

### GET /v1/auth/roles

Returns the list of roles available for self-registration. Call this to populate the role picker on the registration screen.

**No authentication required.**

#### Request

```
GET /v1/auth/roles
```

#### Response — 200 OK

```json
{
  "data": [
    {
      "slug": "collector",
      "label": "Supplier / Collector",
      "description": "Field worker who collects and registers recycled plastic batches."
    }
  ],
  "meta": null,
  "error": null
}
```

| Field | Type | Description |
|---|---|---|
| `slug` | `string` | Value to send as `role` in `POST /v1/auth/sync` |
| `label` | `string` | Human-readable name for display in the UI |
| `description` | `string` | Short description of the role |

> `processor` and `enterprise` roles are not self-registrable — they are assigned by an admin.

---

### POST /v1/auth/sync

Registers a new user on first login or returns the existing profile on subsequent logins. The client calls this once after every Privy login session.

**Does not require an existing user record** — verification is handled internally.

#### Request

```
POST /v1/auth/sync
Authorization: Bearer <privy_access_token>
Content-Type: application/json
```

```json
{
  "role": "collector",
  "wallet_address": "HnCKbLQsyqDJSLJCssx6rtLjhi7WuBYgWRJvfgiqcHgG",
  "display_name": "John Doe"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `role` | `string` | Required on first login | User role. One of: `collector`, `processor`, `enterprise` |
| `wallet_address` | `string` | Required on first login | Solana wallet address from Privy embedded wallet |
| `display_name` | `string` | Optional | User's display name |

> On repeat logins all fields are optional. If omitted, the existing profile is returned as-is.

---

#### Response — 201 Created (first login)

```json
{
  "data": {
    "id": "018e1b2c-4d5e-7f8a-9b0c-1d2e3f4a5b6c",
    "role": "collector",
    "display_name": "John Doe",
    "email": null,
    "wallet_address": "HnCKbLQsyqDJSLJCssx6rtLjhi7WuBYgWRJvfgiqcHgG",
    "created_at": "2026-04-12T08:00:00Z",
    "is_new": true
  },
  "meta": null,
  "error": null
}
```

#### Response — 200 OK (repeat login)

```json
{
  "data": {
    "id": "018e1b2c-4d5e-7f8a-9b0c-1d2e3f4a5b6c",
    "role": "collector",
    "display_name": "John Doe",
    "email": "john@example.com",
    "wallet_address": "HnCKbLQsyqDJSLJCssx6rtLjhi7WuBYgWRJvfgiqcHgG",
    "created_at": "2026-04-12T08:00:00Z",
    "is_new": false
  },
  "meta": null,
  "error": null
}
```

| Field | Type | Nullable | Description |
|---|---|---|---|
| `id` | `string` (UUID) | No | Verdana user ID |
| `role` | `string` | No | `collector`, `processor`, or `enterprise` |
| `display_name` | `string` | Yes | Display name, `null` if not set |
| `email` | `string` | Yes | Email from Privy, `null` if not available |
| `wallet_address` | `string` | Yes | Primary Solana wallet address, `null` if none linked |
| `created_at` | `string` (RFC3339) | No | Account creation timestamp |
| `is_new` | `boolean` | No | `true` on first login — use this to decide whether to show onboarding |

---

#### Error Responses

**401 — Missing token**
```json
{
  "data": null,
  "meta": null,
  "error": {
    "code": "MISSING_TOKEN",
    "message": "authorization bearer token is required"
  }
}
```

**401 — Invalid or expired token**
```json
{
  "data": null,
  "meta": null,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "token is invalid or expired"
  }
}
```

**400 — Validation error (first login, missing required fields)**
```json
{
  "data": null,
  "meta": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "validation failed",
    "details": [
      { "field": "role", "message": "must be one of: collector" },
      { "field": "wallet_address", "message": "is required" }
    ]
  }
}
```

**409 — Wallet already linked to another account**
```json
{
  "data": null,
  "meta": null,
  "error": {
    "code": "WALLET_ALREADY_LINKED",
    "message": "wallet address is already linked to another account"
  }
}
```

---

## Authenticated Requests

All endpoints under `/v1` (except `/v1/auth/sync`) require a valid Privy access token. Include it in every request:

```
Authorization: Bearer <privy_access_token>
```

If the token is missing or invalid the API returns:

```json
{
  "data": null,
  "meta": null,
  "error": {
    "code": "MISSING_TOKEN",
    "message": "authorization bearer token is required"
  }
}
```

If the token is valid but the user has not called `/v1/auth/sync` yet:

```json
{
  "data": null,
  "meta": null,
  "error": {
    "code": "USER_NOT_REGISTERED",
    "message": "no account found for this identity"
  }
}
```

---

## Client Integration Guide

### Recommended flow

```
1. User taps "Login" → Privy SDK handles login/OTP/OAuth
2. Privy SDK returns access token
3. Client calls POST /v1/auth/sync with the token
4. If is_new === true  → show onboarding screen
   If is_new === false → go to home screen
5. Store user.id locally for subsequent API calls
6. Attach the Privy access token to every subsequent request
   as Authorization: Bearer <token>
7. When Privy refreshes the token, use the new token automatically
   (no need to call /auth/sync again unless the session is new)
```

### Token expiry

Privy access tokens expire. Use the Privy SDK's built-in token refresh mechanism. If a request returns `401 INVALID_TOKEN`, refresh the token via Privy and retry the request once.

### Role reference

| Role | Self-registrable | Description |
|---|---|---|
| `collector` | Yes | Field worker who collects and registers plastic batches |
| `processor` | No — admin assigned | Drop-off site worker who receives, weighs, and co-signs batches |
| `enterprise` | No — admin assigned | Enterprise / B2B user |
