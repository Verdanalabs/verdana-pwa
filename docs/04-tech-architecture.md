# Verdana Product Brief 04 - Tech Architecture

## Target Architecture

Dokumen ini mencerminkan arsitektur aktual repo yang sedang dibangun.

## Frontend Applications

### Mobile app

Stack aktual:

- React Native
- Expo `~54.0.33`
- TypeScript
- expo-router `~6.0.23`

Target platform:

- Android sebagai prioritas utama
- iOS sebagai kompatibilitas tahap berikutnya
- Web Expo hanya sebagai preview internal

### Codebase Structure (Aktual)

```
verdana-apps/
├── app/                          # expo-router pages
│   ├── _layout.tsx               # Root layout — font loading + ThemeProvider
│   ├── modal.tsx
│   └── (supplier-tabs)/          # Bottom tab group (Supplier)
│       ├── _layout.tsx           # CustomTabBar dengan FAB center
│       ├── home.tsx              # → mount SupplierHomeScreen
│       ├── history.tsx           # placeholder
│       ├── wallet.tsx            # placeholder
│       └── profile.tsx           # placeholder
│
├── features/                     # Domain-based feature modules
│   └── supplier-home/
│       ├── index.tsx             # SupplierHomeScreen — screen utama
│       └── components/
│           ├── HeroCard.tsx      # Gradient card + shimmer animation
│           ├── DashboardMetrics.tsx
│           ├── QuickActions.tsx
│           └── LatestBatches.tsx
│
├── components/
│   └── ui/                       # Shared reusable UI components
│       ├── StatusBadge.tsx
│       ├── MaterialBadge.tsx
│       ├── BatchCard.tsx
│       ├── QuickActionCard.tsx
│       ├── PrimaryButton.tsx
│       └── CustomTabBar.tsx      # Custom tab bar dengan FAB
│
├── constants/
│   ├── colors.ts                 # Legacy — gunakan themes.ts untuk warna baru
│   ├── themes.ts                 # Dark + light palette (sumber kebenaran warna)
│   ├── typography.ts             # Font family + font size tokens
│   └── batch-status.ts          # Label bahasa Indonesia per status
│
├── store/
│   └── theme-context.tsx         # ThemeProvider, useTheme, useThemeColors
│
├── types/
│   ├── batch.ts                  # BatchStatus, Batch, BatchSummary
│   ├── user.ts                   # SupplierProfile, DashboardSummary
│   ├── wallet.ts                 # CNFT, WalletSummary
│   └── index.ts
│
├── mocks/
│   ├── supplier.ts               # MOCK_SUPPLIER, MOCK_DASHBOARD
│   ├── batches.ts                # MOCK_BATCHES, MOCK_BATCH_SUMMARIES
│   └── index.ts
│
└── docs/                         # Product briefs (dokumen ini)
```

## Packages Aktual

### Dependencies utama

```json
"expo": "~54.0.33",
"expo-router": "~6.0.23",
"expo-linear-gradient": "installed",
"react-native": "0.81.5",
"react-native-reanimated": "~4.1.1",
"react-native-safe-area-context": "~5.6.0",
"@expo/vector-icons": "^15.0.3",
"@react-navigation/bottom-tabs": "^7.4.0"
```

### Font packages

```json
"@expo-google-fonts/space-grotesk": "installed"
```

Space Grotesk di-load di `app/_layout.tsx` via `useFonts()` sebelum SplashScreen hilang.

## Theme System

Theme dikelola via React Context di `@/store/theme-context.tsx`.

```ts
// Gunakan di dalam komponen
const c = useThemeColors();        // dapat ThemeColors object
const { isDark, toggle } = useTheme(); // dapat mode + toggle fn

// Default: dark mode
// Toggle: ikon matahari/bulan di top bar home screen
```

File sumber:
- `constants/themes.ts` — `DarkColors` dan `LightColors` (type `ThemeColors`)
- `store/theme-context.tsx` — `ThemeProvider`, `useTheme`, `useThemeColors`

**Aturan warna:**
- Semua warna wajib ambil dari `useThemeColors()` — jangan import `Colors` lama
- Hero card adalah pengecualian: selalu pakai background gelap di kedua mode, sehingga teksnya pakai konstanta putih lokal

## Runtime Modules

### Required native capabilities

- camera
- media library picker
- location
- secure storage
- network state
- push notification

### Recommended Expo modules (belum semua terinstall)

- `expo-router` ✅
- `expo-camera` — belum
- `expo-image-picker` — belum
- `expo-location` — belum
- `expo-secure-store` — belum
- `expo-notifications` — belum
- `expo-file-system` — belum
- `expo-linear-gradient` ✅

## State Management

Pemisahan state aktual:

| Layer | Solusi saat ini |
|---|---|
| Theme | `ThemeContext` di `store/theme-context.tsx` |
| Mock data | Konstanta di `mocks/` |
| Server state | Belum — akan pakai API layer saat integrasi backend |
| Persisted draft | Belum — akan pakai `expo-secure-store` atau `AsyncStorage` |

Domain store yang direncanakan:
- `auth`
- `supplier`
- `pvp`
- `batch-draft`
- `wallet`

## Backend Architecture

Komponen backend tetap mengikuti arah awal (belum diimplementasi):

- Core API `Go`
- PostgreSQL
- Redis queue
- Cloudflare R2
- Pinata
- Helius / Solana
- Privy

## Routing Strategy

Struktur `expo-router` aktual:

```
app/(supplier-tabs)/home     → SupplierHomeScreen
app/(supplier-tabs)/history  → placeholder
app/(supplier-tabs)/wallet   → placeholder
app/(supplier-tabs)/profile  → placeholder
```

Route yang direncanakan (belum dibuat):
```
app/(auth)/welcome
app/(auth)/login
app/(auth)/onboarding-profile
app/batch/new/photo
app/batch/new/details
app/batch/new/location
app/batch/new/review
app/batch/[id]
app/pvp/dashboard
app/pvp/validate/[batchId]
app/pvp/cosign/[batchId]/success
app/pvp/history
```

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

Aturan minimum:

- draft batch tersimpan lokal
- queue sync sederhana untuk submit tertunda
- tandai data sebagai `syncing`, `synced`, atau `failed`
- jangan hilangkan foto draft jika app tertutup

## Authentication Strategy

Tahap saat ini (mock):

- auth shell lokal
- mock embedded wallet

Tahap real (belum):

- Privy login
- token verification via Core API
- secure token storage di device

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
