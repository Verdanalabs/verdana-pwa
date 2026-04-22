# API Integration Checklist & Workflow

Dokumen ini berisi status integrasi API dan urutan pengerjaan yang direkomendasikan.

> **Legend:** ✅ Done · 🔄 In Progress · ⬜ Not Started

---

## Status Overview

| Layer | Status |
|-------|--------|
| API Client (`apiRequest`) | ✅ Done |
| Auth Token Handling (Privy) | ✅ Done |
| Auth Sync (`/v1/auth/sync`) | ✅ Done |
| Batch APIs | ⬜ Not Started |
| PVP Site APIs | ⬜ Not Started |
| Media Upload | ⬜ Not Started |
| User Profile | ⬜ Not Started |
| Config & Waitlist | ⬜ Not Started |
| Admin APIs | ⬜ Not Started |

---

## Workflow Integrasi (Urutan Prioritas)

Ikuti urutan ini karena tiap step saling bergantung satu sama lain.

---

### STEP 1 — Foundation (Sudah Done)

> Infrastruktur dasar sudah siap, tidak perlu diubah.

- [x] Setup `apiRequest<T>()` generic helper → `src/shared/services/api.ts`
- [x] Setup environment variable `EXPO_PUBLIC_API_BASE_URL`
- [x] Privy provider setup → `src/providers/AppProviders.tsx`
- [x] Auth context + login flow → `src/features/auth/state/auth-context.tsx`
- [x] `POST /v1/auth/sync` → `src/features/auth/services/auth-api.ts`
- [x] Onboarding flow (panggil sync ulang dengan `display_name`)

---

### STEP 2 — User Profile

> Dibutuhkan agar app bisa fetch ulang data user tanpa harus re-sync.

- [ ] Implement `GET /v1/users/me`
  - Buat fungsi `getMe(token)` di `src/features/auth/services/auth-api.ts`
  - Panggil di `AuthContext` saat user sudah login & token tersedia
  - Replace data user yang saat ini disimpan dari response `sync` saja
- [ ] Pastikan `VerdanaUser` type mencakup semua field dari response `/v1/users/me`

---

### STEP 3 — Auth Roles

> Diperlukan agar role selection saat onboarding/register tidak hardcoded.

- [ ] Implement `GET /v1/auth/roles`
  - Buat fungsi `getRoles()` di `src/features/auth/services/auth-api.ts`
  - Panggil di screen role selection (onboarding)
  - Replace array role yang saat ini hardcoded di UI

---

### STEP 4 — PVP Sites

> Data PVP site dibutuhkan sebelum batch bisa dibuat (karena cosign butuh `pvp_site_id`).

- [ ] Implement `GET /v1/pvp-sites`
  - Buat file `src/features/pvp/services/pvp-api.ts`
  - Buat fungsi `getPvpSites(token)`
  - Buat hook `usePvpSites()` yang memanggil fungsi tersebut
  - Replace mock di `src/shared/services/mock/pvp-data.ts`
  - Update screen yang menggunakan mock PVP data:
    - `PvpDashboardScreen.tsx`
    - `PvpFacilityScreen.tsx`

---

### STEP 5 — Media Upload

> Harus diintegrate sebelum batch creation, karena batch butuh `storage_key` dari upload.

- [ ] Implement `POST /v1/media/upload-url`
  - Buat file `src/features/media/services/media-api.ts`
  - Buat fungsi `getUploadUrl(token, payload)` → returns `upload_url` + `storage_key`
  - Buat fungsi `uploadFileToR2(uploadUrl, file)` → PUT langsung ke presigned URL
  - Update `BatchPhotoStepScreen.tsx`:
    - Ganti mock URI (`'mock-0'`, `'mock-1'`) dengan upload sungguhan
    - Simpan `storage_key` ke batch draft state

---

### STEP 6 — Batch Creation

> Inti dari fitur collector. Bergantung pada Step 4 (PVP) dan Step 5 (Media).

- [ ] Implement `POST /v1/batches`
  - Buat file `src/features/batch/services/batch-api.ts`
  - Buat fungsi `createBatch(token, payload)`
  - Payload harus include `media[]` dengan `storage_key` dari Step 5
  - Update `BatchReviewStepScreen.tsx`:
    - Ganti mock reset dengan call `createBatch()`
    - Handle loading state & error
- [ ] Implement `GET /v1/batches`
  - Buat fungsi `getBatches(token, status?)`
  - Buat hook `useBatches(status?)` 
  - Update `HistoryScreen.tsx`:
    - Ganti `getMockBatches()` dengan hook real
- [ ] Implement `GET /v1/batches/{batchID}`
  - Buat fungsi `getBatchDetail(token, batchId)`
  - Update detail screen jika ada
    
---

### STEP 7 — Batch Cosign

> Bergantung pada Step 4 (PVP Sites) dan Step 6 (Batch sudah terbuat).

- [ ] Implement `POST /v1/batches/{batchID}/cosign`
  - Buat fungsi `cosignBatch(token, batchId, payload)`
  - Payload: `processor_user_id`, `pvp_site_id`, `actual_weight_grams`, signatures, dll.
  - Update PVP cosign flow di `pvp-auth-context.tsx`:
    - Ganti `simulateApprove()` dengan call ke endpoint cosign sungguhan
    - Handle error `GEOFENCE_VIOLATION` (400) dan `INVALID_COLLECTOR_SIGNATURE` (422)

---

### STEP 8 — Config & Waitlist

> Tidak blocking fitur utama, bisa dikerjakan paralel dengan step lain.

- [ ] Implement `GET /v1/config/launch-date`
  - Buat file `src/features/config/services/config-api.ts`
  - Gunakan di landing/splash screen jika ada countdown
- [ ] Implement `GET /v1/waitlist`
  - Fetch data roles dan launch date untuk halaman waitlist
- [ ] Implement `POST /v1/waitlist`
  - Buat fungsi `joinWaitlist(email, roleId)`
  - Update waitlist form screen

---

### STEP 9 — Health Checks (Opsional)

> Berguna untuk monitoring & debugging di production.

- [ ] Implement `GET /healthz`
  - Bisa dipanggil saat app startup untuk cek koneksi server
- [ ] Implement `GET /readyz`
  - Untuk cek dependency (Postgres, Redis, Solana) sebelum operasi penting

---

### STEP 10 — Admin APIs

> Hanya untuk user dengan role admin. Implement terakhir.

- [ ] Implement `POST /v1/admin/users`
  - Buat file `src/features/admin/services/admin-api.ts`
  - Buat fungsi `createAdminUser(token, payload)`
- [ ] Implement `POST /v1/admin/pvp-sites`
  - Buat fungsi `createPvpSite(token, payload)`

---

## File yang Perlu Dibuat

```
src/
├── features/
│   ├── auth/
│   │   └── services/
│   │       └── auth-api.ts          ✅ exists — tambahkan getMe(), getRoles()
│   ├── batch/
│   │   └── services/
│   │       └── batch-api.ts         ⬜ buat baru
│   ├── pvp/
│   │   └── services/
│   │       └── pvp-api.ts           ⬜ buat baru
│   ├── media/
│   │   └── services/
│   │       └── media-api.ts         ⬜ buat baru
│   ├── config/
│   │   └── services/
│   │       └── config-api.ts        ⬜ buat baru
│   └── admin/
│       └── services/
│           └── admin-api.ts         ⬜ buat baru
└── shared/
    └── services/
        ├── api.ts                   ✅ exists — sudah siap dipakai
        └── mock/                    🗑️ hapus per-file setelah diganti real API
            ├── batch-data.ts
            ├── pvp-data.ts
            ├── supplier-data.ts
            └── wallet-data.ts
```

---

## Mock yang Harus Dihapus Setelah Integrasi

| Mock File | Diganti Oleh | Hapus di Step |
|-----------|-------------|---------------|
| `mocks/batches.ts` | `GET /v1/batches` | Step 6 |
| `mocks/pvp.ts` | `GET /v1/pvp-sites` | Step 4 |
| `mocks/supplier.ts` | `GET /v1/users/me` | Step 2 |
| `mocks/wallet.ts` | Data dari user profile | Step 2 |
| `src/shared/services/mock/batch-data.ts` | `batch-api.ts` | Step 6 |
| `src/shared/services/mock/pvp-data.ts` | `pvp-api.ts` | Step 4 |
| `src/shared/services/mock/supplier-data.ts` | `auth-api.ts` | Step 2 |
| `src/shared/services/mock/wallet-data.ts` | user profile data | Step 2 |

---

*Last updated: 2026-04-22*
