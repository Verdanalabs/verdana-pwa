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
|-- app/                          # expo-router routes, layouts, redirects only
|   |-- _layout.tsx               # Root shell: fonts, platform gate, global stack
|   |-- index.tsx                 # root redirect
|   |-- (auth)/
|   |-- (supplier-tabs)/
|   |-- (pvp-tabs)/
|   |-- batch/                    # batch flow layout + thin route wrappers
|   |-- pvp/                      # pvp flow layout + thin route wrappers
|   |-- modal.tsx
|   `-- desktop-blocked.tsx
|
|-- src/
|   |-- providers/
|   |   `-- AppProviders.tsx      # Theme + supplier auth + PVP auth
|   |-- shared/
|   |   |-- navigation/
|   |   |-- platform/
|   |   |-- theme/
|   |   `-- ui/
|   `-- features/
|       |-- app/
|       |-- auth/
|       |-- batch/
|       |-- history/
|       |-- profile/
|       |-- pvp/
|       |-- supplier-home/
|       `-- wallet/
|
|-- constants/                    # compatibility re-exports where still needed
|   |-- themes.ts
|   |-- typography.ts
|   `-- batch-status.ts
|
|-- store/                        # compatibility re-exports where still needed
|   |-- auth-context.tsx
|   |-- batch-draft-context.tsx
|   |-- pvp-auth-context.tsx
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

Theme dikelola via React Context di `@/src/shared/theme/theme-context.tsx`.

```ts
const c = useThemeColors();
const { isDark, toggle } = useTheme();
```

File sumber:

- `src/shared/theme/tokens.ts` - `DarkColors` dan `LightColors`
- `src/shared/theme/theme-context.tsx` - `ThemeProvider`, `useTheme`, `useThemeColors`
- `src/shared/theme/typography.ts` - `Font` dan `FontSize`

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
| Theme | `ThemeContext` di `src/shared/theme/theme-context.tsx` |
| Mock data | Konstanta di `mocks/` |
| Server state | Belum, akan pakai API layer saat integrasi backend |
| Persisted draft | Belum, akan pakai `expo-secure-store` atau `AsyncStorage` |

Domain state yang aktif / direncanakan:

- `auth`
- `supplier-home`
- `history`
- `pvp`
- `batch-draft`
- `wallet`
- `profile`

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
app/(auth)/welcome
app/(auth)/login
app/(auth)/onboarding-profile
app/(auth)/pvp-login
app/(supplier-tabs)/home
app/(supplier-tabs)/history
app/(supplier-tabs)/wallet
app/(supplier-tabs)/profile
app/(pvp-tabs)/dashboard
app/(pvp-tabs)/log
app/(pvp-tabs)/pending
app/(pvp-tabs)/facility
app/batch/new/photo
app/batch/new/details
app/batch/new/location
app/batch/new/review
app/batch/[id]
app/pvp/pending-approval
app/pvp/onboarding
app/pvp/qr-scan
```

Route penting yang sudah dijaga perilakunya:

```
app/_layout.tsx                 # global stack + platform blocker
app/batch/_layout.tsx           # BatchDraftProvider scope
app/(supplier-tabs)/_layout.tsx # supplier auth guard + SupplierTabBar
app/(pvp-tabs)/_layout.tsx      # pvp active-state guard + PvpTabBar
app/pvp/_layout.tsx             # pending/onboarding/qr flow stack
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
