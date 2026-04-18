# Verdana Product Brief 04 - Tech Architecture

## Target Architecture

Dokumen ini mencerminkan arsitektur aktual repo yang sedang dibangun.

## Frontend Applications

### Operational app

Stack aktual:

- React Native
- Expo `~54.0.33`
- TypeScript
- expo-router `~6.0.23`

Target platform:

- Browser mobile sebagai target utama
- Installed PWA sebagai mode yang diutamakan di lapangan
- Desktop browser tidak didukung untuk flow operasional Supplier dan PVP
- Jika diakses dari desktop, render blocker page khusus

### Codebase Structure (Aktual)

```
verdana-apps/
|-- app/                          # expo-router pages
|   |-- _layout.tsx               # Root layout: font loading + ThemeProvider
|   |-- modal.tsx
|   `-- (supplier-tabs)/          # Bottom tab group (Supplier)
|       |-- _layout.tsx           # CustomTabBar dengan FAB center
|       |-- home.tsx              # mount SupplierHomeScreen
|       |-- history.tsx           # placeholder
|       |-- wallet.tsx            # placeholder
|       `-- profile.tsx           # placeholder
|
|-- features/                     # Domain-based feature modules
|   `-- supplier-home/
|       |-- index.tsx             # SupplierHomeScreen
|       `-- components/
|           |-- HeroCard.tsx
|           |-- DashboardMetrics.tsx
|           |-- QuickActions.tsx
|           `-- LatestBatches.tsx
|
|-- components/
|   `-- ui/                       # Shared reusable UI components
|       |-- StatusBadge.tsx
|       |-- MaterialBadge.tsx
|       |-- BatchCard.tsx
|       |-- QuickActionCard.tsx
|       |-- PrimaryButton.tsx
|       `-- CustomTabBar.tsx
|
|-- constants/
|   |-- colors.ts                 # Legacy, gunakan themes.ts untuk warna baru
|   |-- themes.ts                 # Dark + light palette
|   |-- typography.ts             # Font family + font size tokens
|   `-- batch-status.ts
|
|-- store/
|   `-- theme-context.tsx
|
|-- types/
|   |-- batch.ts
|   |-- user.ts
|   |-- wallet.ts
|   `-- index.ts
|
|-- mocks/
|   |-- supplier.ts
|   |-- batches.ts
|   `-- index.ts
|
`-- docs/
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
const c = useThemeColors();
const { isDark, toggle } = useTheme();
```

File sumber:

- `constants/themes.ts` - `DarkColors` dan `LightColors`
- `store/theme-context.tsx` - `ThemeProvider`, `useTheme`, `useThemeColors`

Aturan warna:

- semua warna wajib ambil dari `useThemeColors()`
- hero card adalah pengecualian yang boleh memakai konstanta putih lokal

## Runtime Modules

### Required device capabilities

- camera
- media library picker
- location
- secure/local storage abstraction
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
- `expo-linear-gradient`

## State Management

Pemisahan state aktual:

| Layer | Solusi saat ini |
|---|---|
| Theme | `ThemeContext` di `store/theme-context.tsx` |
| Mock data | Konstanta di `mocks/` |
| Server state | Belum, akan pakai API layer saat integrasi backend |
| Persisted draft | Belum, akan pakai `expo-secure-store` atau `AsyncStorage` |

Domain store yang direncanakan:

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

## Routing Strategy

Struktur `expo-router` aktual:

```
app/(supplier-tabs)/home
app/(supplier-tabs)/history
app/(supplier-tabs)/wallet
app/(supplier-tabs)/profile
```

Route yang direncanakan:

```
app/(auth)/welcome
app/(auth)/login
app/(auth)/onboarding-profile
app/(auth)/pvp-login
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

1. Mobile PWA ambil auth token
2. Mobile PWA kirim metadata batch ke Core API
3. Foto upload ke media storage
4. Core API menyimpan batch
5. PVP update data validasi
6. Core API enqueue mint job
7. Worker mint cNFT
8. Core API expose status terbaru ke app

## Networking Strategy

- semua call lewat API layer terpusat
- typed request/response model
- retry policy untuk request yang aman
- upload harus mendukung progress dan retry
- draft batch tetap ada walau upload gagal sementara

## Offline Strategy

Aturan minimum:

- draft batch tersimpan lokal
- queue sync sederhana untuk submit tertunda
- tandai data sebagai `syncing`, `synced`, atau `failed`
- jangan hilangkan foto draft jika app tertutup

## Authentication Strategy

Tahap saat ini:

- auth shell lokal
- mock embedded wallet

Tahap real:

- Privy login
- token verification via Core API
- secure token storage via device-safe abstraction

## Access Control Strategy

Aturan akses platform:

- role `supplier` dan `pvp_operator` hanya didukung di mobile browser / installed PWA
- detection dilakukan di layer root routing agar seluruh screen operasional ikut terlindungi
- jika device terdeteksi desktop, app render blocker page alih-alih screen operasional
- dashboard desktop untuk role non-operasional harus dipisah dari permukaan ini

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
