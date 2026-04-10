# Verdana Product Brief 03 - UI Rules

## Design Intent

UI Verdana harus terasa operasional, terpercaya, dan cepat dipahami oleh user lapangan. Jangan mendesain seperti dashboard web yang diperkecil.

## Core Principles

- Satu layar untuk satu keputusan utama
- CTA primer selalu jelas dan tunggal
- Status batch harus mudah terbaca dalam 2 detik
- Hindari istilah teknis blockchain di alur inti supplier
- Gunakan bahasa tindakan, bukan jargon

## Mobile Layout Rules

- Gunakan safe area di semua layar
- Bottom tab hanya untuk destination utama
- Form panjang wajib dipecah menjadi step
- Tombol primer ditempatkan di area thumb-friendly bawah
- Semua list dan card harus tetap terbaca di lebar ponsel kecil

## Navigation Rules

- Supplier memakai bottom tab dengan FAB center untuk aksi utama (Register Batch)
- Screen detail memakai stack navigation
- Proses penting seperti submit, validation, dan success memakai full-screen flow
- Jangan campur banyak modal untuk alur kritikal

## Visual Rules

### Typography

- Font utama: **Space Grotesk** (via `@expo-google-fonts/space-grotesk`)
- Scale: `xs(11)` `sm(12)` `base(14)` `md(15)` `lg(16)` `xl(18)` `2xl(22)` `3xl(28)` `4xl(36)`
- Import selalu dari `@/constants/typography` — jangan hardcode fontFamily
- Heading harus ringkas
- Data penting seperti `kg`, status, dan batch ID harus punya penekanan visual lebih tinggi

```ts
// @/constants/typography
Font.regular   = 'SpaceGrotesk_400Regular'
Font.medium    = 'SpaceGrotesk_500Medium'
Font.semiBold  = 'SpaceGrotesk_600SemiBold'
Font.bold      = 'SpaceGrotesk_700Bold'
```

### Color System — Dark / Light Mode

Warna dikelola via **ThemeContext** (`@/store/theme-context`). Default: **dark mode**.

Jangan pernah hardcode warna langsung di komponen — selalu gunakan `useThemeColors()`.

```ts
const c = useThemeColors();
// c.background, c.surface, c.foreground, c.accent, dll.
```

#### Dark Mode Palette (`:root` — default)

| Token | Value | Keterangan |
|---|---|---|
| `background` | `#070e07` | Latar utama |
| `surface` | `#0d160d` | Card / panel |
| `surfaceStrong` | `#101b10` | Card elevated |
| `border` | `#1a2e1a` | Border halus |
| `foreground` | `#ffffff` | Teks utama |
| `textSecondary` | `#cfd6cf` | Teks sekunder |
| `textMuted` | `#8f9790` | Teks muted |
| `textFaint` | `#5f6b63` | Teks sangat redup |
| `accent` | `#b5f23d` | Lime — warna aksen utama |
| `accentContrast` | `#070e07` | Teks di atas accent bg |

#### Light Mode Palette (`html[data-theme="light"]`)

| Token | Value | Keterangan |
|---|---|---|
| `background` | `#f2f7ed` | Sage muda |
| `surface` | `#f7fbf2` | Off-white hijau |
| `border` | `#cfe3bb` | Border sage |
| `foreground` | `#253d27` | Teks hijau gelap |
| `textSecondary` | `#426048` | |
| `textMuted` | `#6e8072` | |
| `accent` | `#96cc2e` | Lime lebih calm |
| `accentContrast` | `#091406` | |

### Hero Card

Hero card selalu pakai **background gelap** (gradient) di kedua mode — sehingga teksnya selalu putih, bukan mengikuti `foreground` tema.

```ts
// Konstanta khusus hero card — tidak bergantung pada theme mode
const HERO_TEXT       = '#ffffff'
const HERO_TEXT_MUTED = 'rgba(255,255,255,0.55)'
const HERO_DIVIDER    = 'rgba(255,255,255,0.1)'
```

Hero gradient:
- **Dark mode**: `['#182e18', '#0d160d', '#070e07']`
- **Light mode**: `['#243d28', '#1c3220', '#112518']`

Hero card memakai animasi shimmer `Animated.loop` diagonal yang subtle — jangan matikan animasi ini.

### Color — Status System

Minimal warna status per mode dikelola di `@/constants/themes.ts`:

| Status | Dark bg | Dark text | Light bg | Light text |
|---|---|---|---|---|
| `draft` | `#1a2e1a` | `#8f9790` | `#e8f0e0` | `#6e8072` |
| `submitted` | `#0c1f3a` | `#60a5fa` | `#dbeafe` | `#1d4ed8` |
| `transit` | `#2a1f08` | `#fbbf24` | `#fef3c7` | `#92400e` |
| `pending_validation` | `#1a2e1a` | `#cfd6cf` | `#ecf4e4` | `#426048` |
| `verified` | `#0c2a1f` | `#34d399` | `#d1fae5` | `#065f46` |
| `minting` | `#162a10` | `#b5f23d` | `#dcfce7` | `#166534` |
| `minted` | `#b5f23d` | `#070e07` | `#96cc2e` | `#091406` |
| `listed` | `#1f1040` | `#c4b5fd` | `#ede9fe` | `#5b21b6` |
| `collateral` | `#2a1500` | `#fb923c` | `#ffedd5` | `#9a3412` |
| `rejected` | `#2a0808` | `#f87171` | `#fee2e2` | `#991b1b` |

## Form Rules

- Gunakan komponen native yang familiar
- Validasi tampil inline, bukan hanya toast
- Field wajib diberi label jelas
- Angka berat harus pakai keyboard numerik
- Permission denial harus punya recovery path yang jelas

## Camera and Photo Rules

- Preview foto wajib besar dan jelas
- Tampilkan timestamp dan state capture
- Jika kamera gagal, sediakan fallback ke image picker
- Jangan paksa user mengulang flow dari awal saat retake

## Location Rules

- Jelaskan kenapa lokasi dibutuhkan
- Bila permission lokasi ditolak, user tetap bisa lanjut dengan konfirmasi manual bila bisnis mengizinkan
- Tampilkan Drop-off Point terpilih dan jarak secara jelas — gunakan label "Drop-off Point", bukan "PVP"

## Wallet and Web3 Rules

- Wallet address dipersingkat
- Hindari menampilkan hash panjang sebagai elemen dominan
- Istilah seperti `cNFT`, `minting`, `on-chain` boleh muncul di layar detail, bukan di langkah pendaftaran awal

## Copy Rules

- Gunakan bahasa **English** untuk semua copywriting di app
- Kalimat pendek, bahasa sehari-hari — bukan istilah teknis atau internal
- Supplier adalah pekerja lapangan — tulis seperti berbicara kepada mereka, bukan kepada developer

### Terminology yang wajib dipakai di UI

| Internal / Technical | User-facing (UI) | Alasan |
|---|---|---|
| PVP | Drop-off Point | Supplier nggak tahu akronim internal |
| cNFT | Asset / Digital Asset | Jargon blockchain terlalu teknis |
| Minting | Processing... | Supplier tidak perlu tahu proses on-chain |
| Pending Validation | Being Checked | Natural dan langsung dipahami |
| In Transit | On the Way | Bahasa percakapan |
| Submitted | Sent | Lebih familiar |
| Collateral | Locked | Sederhana |
| Rejected | Not Accepted | Lebih halus |

### Status Labels (`@/constants/batch-status.ts`)

| Status | Label |
|---|---|
| `draft` | Draft |
| `submitted` | Sent |
| `transit` | On the Way |
| `pending_validation` | Being Checked |
| `verified` | Approved |
| `minting` | Processing... |
| `minted` | Asset Ready |
| `listed` | For Sale |
| `collateral` | Locked |
| `rejected` | Not Accepted |

### CTA contoh

- `Register Batch`
- `Take Photo`
- `See All`
- `View Details`
- `Co-sign & Submit`

## Accessibility Rules

- Kontras warna minimum harus aman
- Semua icon penting harus punya label teks
- Target sentuh minimum harus nyaman di ponsel
- Jangan andalkan warna saja untuk membedakan status

## Empty and Error States

- Empty state harus mengarahkan ke aksi berikutnya
- Error state harus menyebut apa yang gagal dan apa yang bisa dilakukan user
- Offline state harus jelas bila sinkronisasi tertunda

## Component Priorities

Komponen inti yang harus konsisten:

| Komponen | Path |
|---|---|
| `StatusBadge` | `@/components/ui/StatusBadge` |
| `MaterialBadge` | `@/components/ui/MaterialBadge` |
| `BatchCard` | `@/components/ui/BatchCard` |
| `QuickActionCard` | `@/components/ui/QuickActionCard` |
| `PrimaryButton` | `@/components/ui/PrimaryButton` |
| `CustomTabBar` | `@/components/ui/CustomTabBar` |
