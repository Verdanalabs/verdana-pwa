# Dev Progress Report

Dokumen ini mencatat progress pengerjaan integrasi API dan perbaikan UI selama sesi development.

> **Last updated:** 2026-04-22
> **Developer:** habdil
> **Branch:** main

---

## Status Ringkas

| Area | Status | Catatan |
|------|--------|---------|
| Auth Sync (login) | ✅ Done | Berjalan normal |
| Auth Onboarding (display_name) | ⚠️ Blocked | Bug di backend, lihat detail bawah |
| Home Screen — real API | ✅ Done | `/v1/users/me` + `/v1/batches` terintegrasi |
| Logout | ✅ Done | Via Privy `signOut()` |
| Reputation Score UI | ✅ Done | Redesign full-width + animated progress bar |
| Empty & Loading State (Home) | ✅ Done | Skeleton + empty state batch |

---

## Yang Sudah Dikerjakan

### 1. Docs & Planning
- ✅ Rapikan `All-API-MVP.md` jadi proper markdown
- ✅ Buat `API-Integration-Checklist.md` — workflow prioritas integrasi step by step

---

### 2. Auth & Onboarding

**File yang diubah:**
- `src/features/auth/state/auth-context.tsx`
- `src/features/auth/screens/SupplierOnboardingScreen.tsx`
- `src/features/auth/services/auth-api.ts`

**Yang dilakukan:**
- ✅ Hapus field **Operating Area** dan **Material Criteria** dari onboarding screen (tidak ada di API)
- ✅ Fix `completeOnboarding` — sebelumnya tidak di-`await`, menyebabkan navigate ke home sebelum API selesai
- ✅ Fix payload sync kedua — tambah `role` dan `wallet_address` ke request body (sesuai spec)
- ✅ Tambah `getMe()` di `auth-api.ts` untuk `GET /v1/users/me`
- ✅ Tambah loading state + error handling di onboarding submit

**⚠️ Known Bug — Backend:**
> `POST /v1/auth/sync` menerima `display_name` tapi **tidak menyimpannya ke database**.
> Bukti dari log:
> ```
> Request  → display_name: "Habdil Iqrawardana" ✅
> Response → display_name: null ❌ (is_new berubah false, artinya request diterima)
> ```
> **Action:** Fix di handler backend — field `display_name` tidak di-include dalam query UPDATE.
> Frontend sudah benar, tidak perlu diubah.

---

### 3. API Client

**File yang diubah:**
- `src/shared/services/api.ts`

**Yang dilakukan:**
- ✅ Tambah HTTP status check (`res.ok`) — sebelumnya response gagal bisa lolos tanpa error
- ✅ Tambah `console.log` untuk setiap request & response (memudahkan debug)

---

### 4. Batch API

**File baru:**
- `src/features/batch/services/batch-api.ts`

**Yang dilakukan:**
- ✅ Implement `getBatches(token, status?)` → `GET /v1/batches`
- ✅ Define `ApiBatch` interface sesuai response backend

---

### 5. Home Screen Integration

**File yang diubah:**
- `src/features/supplier-home/index.tsx`
- `src/features/supplier-home/components/DashboardMetrics.tsx`
- `src/features/supplier-home/components/LatestBatches.tsx`

**File baru:**
- `src/features/supplier-home/hooks/useSupplierHome.ts`

**Yang dilakukan:**
- ✅ Buat hook `useSupplierHome` — fetch `/v1/users/me` + `/v1/batches` paralel
- ✅ Derive `DashboardSummary` dari data batch real (total kg, batch count, in transit, assets)
- ✅ Nama user dari `GET /v1/users/me` → `display_name`
- ✅ Redesign **Reputation Score** card — full width, animated progress bar, tier badge
- ✅ Hapus **USDC Balance** card (belum ada di API)
- ✅ Tambah skeleton loading state untuk seluruh home screen
- ✅ Tambah `isLoading` prop di `LatestBatches` → skeleton 3 card
- ✅ Empty state batch sudah ada sebelumnya, tetap dipertahankan

**Data yang masih mock (belum ada di API):**
| Field | Keterangan |
|-------|-----------|
| `tier` | Bronze/Silver/Gold/Platinum |
| `operationalArea` | Area operasional supplier |
| `reputationScore` | Score 0-100 |

---

### 6. Logout

**File yang diubah:**
- `src/features/app/screens/ModalScreen.tsx`

**Yang dilakukan:**
- ✅ Implement tombol **Log Out** → panggil `signOut()` dari `useAuth()` + redirect ke welcome screen
- Tidak perlu API endpoint khusus — logout handled by Privy client-side

---

## Next Step (Prioritas)

Sesuai `API-Integration-Checklist.md`:

| Step | Task | Blocked? |
|------|------|---------|
| ⚠️ | Fix backend: `display_name` tidak tersimpan di `/v1/auth/sync` | Backend |
| Step 4 | Integrate `GET /v1/pvp-sites` | Tidak |
| Step 5 | Integrate `POST /v1/media/upload-url` + upload file ke R2 | Tidak |
| Step 6 | Integrate `POST /v1/batches` (batch creation) | Butuh Step 5 |
| Step 6 | Integrate `GET /v1/batches/{id}` (detail batch) | Tidak |
| Step 7 | Integrate `POST /v1/batches/{id}/cosign` | Butuh Step 4+6 |

---

## Catatan Teknis

### Pola API Request
Semua API call pakai `apiRequest<T>()` dari `src/shared/services/api.ts`:
```ts
// Contoh pola
export function getBatches(token: string): Promise<ApiBatch[]> {
  return apiRequest<ApiBatch[]>('/v1/batches', { token });
}
```

### Cara Dapat Token
```ts
const { getAccessToken } = usePrivy();
const token = await getAccessToken();
```

### Mock yang Masih Aktif
```
mocks/batches.ts          → belum diganti (list batch sudah real, tapi detail masih mock)
mocks/pvp.ts              → belum diganti
mocks/supplier.ts         → sebagian (tier, operationalArea, reputationScore)
mocks/wallet.ts           → belum diganti
```

### Environment
```
EXPO_PUBLIC_API_BASE_URL  = https://verdana-fd03-staging.kubeletto.app
EXPO_PUBLIC_PRIVY_APP_ID  = cmnvepvl303zo0cjy11fkqy8o
```

---

*Dokumen ini di-update setiap sesi. Lihat juga `API-Integration-Checklist.md` untuk checklist lengkap.*
