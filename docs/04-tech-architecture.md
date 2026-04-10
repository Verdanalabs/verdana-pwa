# Verdana Product Brief 04 - Tech Architecture

## Target Architecture

Dokumen ini menyesuaikan arsitektur lama agar selaras dengan repo aktif yang sudah berbasis Expo.

## Frontend Applications

### Mobile app

Stack target:

- React Native
- Expo
- TypeScript
- expo-router

Target platform:

- Android sebagai prioritas utama
- iOS sebagai kompatibilitas tahap berikutnya
- Web Expo hanya sebagai preview internal, bukan target pengalaman utama supplier

### Suggested codebase structure

Satu monorepo aplikasi mobile dengan pemisahan berdasarkan domain:

- `app/`
- `components/`
- `features/`
- `services/`
- `store/`
- `types/`
- `mocks/`

## Runtime Modules

### Required native capabilities

- camera
- media library picker
- location
- secure storage
- network state
- push notification

### Recommended Expo modules

- `expo-router`
- `expo-camera`
- `expo-image-picker`
- `expo-location`
- `expo-secure-store`
- `expo-notifications`
- `expo-file-system`

## State Management

Gunakan pemisahan state berikut:

- server state untuk data API
- local UI state untuk screen/form
- persisted draft state untuk proses batch yang belum selesai

Minimum domain store:

- `auth`
- `supplier`
- `pvp`
- `batch-draft`
- `wallet`

## Backend Architecture

Komponen backend tetap mengikuti arah awal:

- Core API `Go`
- PostgreSQL
- Redis queue
- Cloudflare R2
- Pinata
- Helius / Solana
- Privy

## Data Flow

1. Mobile app ambil auth token
2. Mobile app kirim metadata batch ke Core API
3. Foto upload ke media storage
4. Core API menyimpan batch
5. PVP update data validasi
6. Core API enqueue mint job
7. Worker mint cNFT
8. Core API expose status terbaru ke app

## Networking Strategy

- Semua call lewat API layer terpusat
- Typed request/response model
- Retry policy untuk request yang aman
- Upload harus mendukung progress dan retry
- Draft batch tetap ada walau upload gagal sementara

## Offline Strategy

Untuk React Native ini penting, dan tidak dibahas cukup kuat di dokumen lama.

Aturan minimum:

- draft batch tersimpan lokal
- queue sync sederhana untuk submit tertunda
- tandai data sebagai `syncing`, `synced`, atau `failed`
- jangan hilangkan foto draft jika app tertutup

## Authentication Strategy

Tahap mock:

- auth shell lokal
- mock embedded wallet

Tahap real:

- Privy login
- token verification via Core API
- secure token storage di device

## Routing Strategy

Gunakan `expo-router` dengan group yang eksplisit:

- `app/(auth)`
- `app/(supplier-tabs)`
- `app/batch`
- `app/pvp`

## Suggested Domain Ownership

- `features/auth`
- `features/supplier-home`
- `features/batch-registration`
- `features/batch-history`
- `features/batch-detail`
- `features/wallet`
- `features/pvp-validation`

## Observability

Minimum event tracking:

- login success/fail
- batch draft started
- photo captured
- batch submitted
- validation completed
- mint status updated

Minimum error logging:

- camera permission denied
- location unavailable
- upload failed
- API timeout

## Migration Notes From Old Stack

- hapus asumsi `Next.js pages/app router`
- hapus asumsi browser-only APIs
- ganti penyimpanan lokal browser dengan storage mobile
- pindahkan fokus dari responsive web ke native device workflow
