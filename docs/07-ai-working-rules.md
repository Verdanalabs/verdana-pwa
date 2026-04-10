# Verdana Product Brief 07 - AI Working Rules

## Purpose

Dokumen ini menjadi aturan kerja untuk AI agent atau engineer yang mengeksekusi brief Verdana di repo ini.

## Scope Discipline

- Fokus utama saat ini adalah **React Native mobile app** berbasis Expo
- Target platform primer: **Android**, iOS sebagai kompatibilitas berikutnya
- Expo Web hanya untuk preview internal — bukan target pengalaman utama
- Jangan membuat asumsi web/browser API — semua harus native-first

> **Catatan perubahan scope:** Brief awal menyebut "frontend web PWA". Keputusan ini diubah karena repo aktif sudah berbasis Expo + React Native dan flow supplier sangat bergantung pada kapabilitas device (kamera, GPS, offline). Dokumen ini mencerminkan kondisi implementasi aktual.

## Architecture Discipline

- Gunakan arsitektur yang menjaga separation antara `UI`, `state`, `API client`, dan `domain logic`
- Pisahkan feature berdasarkan domain bisnis di `features/`
- Reuse komponen di `components/ui/` hanya jika semantics-nya sama lintas supplier dan PVP
- Hindari coupling ke API browser — semua storage, kamera, lokasi harus lewat abstraction

## Implementation Rules

- Gunakan **TypeScript** — semua file `.ts` atau `.tsx`, tidak ada plain JS
- Semua warna wajib diambil dari `useThemeColors()` — jangan hardcode warna di komponen
- Semua font wajib dari `@/constants/typography` — jangan hardcode `fontFamily` string
- Semua status batch wajib pakai enum `BatchStatus` dari `@/types`
- Semua screen harus punya loading, empty, error, dan success state bila relevan
- Mock data dipusatkan di `mocks/` — jangan tersebar di komponen
- Jangan gunakan `Colors` lama dari `constants/colors.ts` untuk komponen baru — gunakan `themes.ts`

## Theme Rules

- Default mode: **dark**
- Toggle mode tersedia via `useTheme().toggle()`
- `ThemeProvider` sudah dipasang di `app/_layout.tsx` — jangan duplikasi
- Hero card selalu pakai background gelap di kedua mode — teksnya pakai konstanta putih lokal, bukan `c.foreground`
- Setiap komponen baru wajib support kedua mode — uji di dark dan light sebelum selesai

## Routing Rules

- Gunakan `expo-router` dengan group yang eksplisit
- Route yang belum ada: push dengan `as never` sebagai temporary type cast
- Saat route batch dan PVP dibuat, ganti `as never` dengan path yang sesungguhnya
- Jangan buat route baru tanpa screen yang jelas tujuannya

## Font Rules

- Font: **Space Grotesk** (via `@expo-google-fonts/space-grotesk`)
- Di-load di `app/_layout.tsx` sebelum SplashScreen hilang
- Import selalu: `import { Font, FontSize } from '@/constants/typography'`

## Copywriting Rules

- Semua teks UI wajib **English** — tidak ada bahasa Indonesia di komponen
- Tulis untuk user lapangan, bukan developer — hindari jargon teknis dan internal
- Gunakan terminology yang sudah disepakati (lihat `docs/03-ui-rules.md`):
  - "PVP" → **"Drop-off Point"** di semua label yang dilihat supplier
  - "cNFT" → **"Asset"** atau **"Digital Asset"**
  - "Minting" → **"Processing..."**
- Status label wajib dari `BATCH_STATUS_LABEL` di `@/constants/batch-status.ts` — jangan hardcode string status di komponen

## Mock-First Rules

- Jangan blok pekerjaan frontend karena backend belum final
- Gunakan mock data, mock auth, dan mock API contract untuk menyelesaikan flow dulu
- Semua keputusan UI, state, dan routing harus bisa berjalan tanpa backend nyata
- API contract di `docs/05-api-contract.md` cukup jelas agar integrasi backend nanti tinggal mengganti adapter

## Data and API Rules

- Semua contract ditulis eksplisit sebelum integrasi
- Jangan membuat shape response berbeda-beda antar screen
- Batch detail harus menjadi source utama timeline dan status
- Upload file harus lewat abstraction service, bukan langsung tersebar di komponen

## Testing Rules

- Uji minimal flow auth mock
- Uji dark mode dan light mode di semua screen baru
- Uji create batch draft
- Uji validasi form
- Uji state transition batch
- Uji rendering StatusBadge di semua status

## Documentation Rules

- Bila arsitektur berubah, update brief 01–07 dahulu sebelum implementasi besar
- Bila ada keputusan yang menyalahi brief, tulis exception secara eksplisit di doc yang relevan
- Jangan campur requirement supplier dan dashboard enterprise dalam satu dokumen teknis
- Backlog di `06-feature-backlog.md` wajib diupdate saat item selesai

## Non-Goals

- Jangan mendesain smart contract dari brief ini
- Jangan membahas infra deployment terlalu detail bila belum dibutuhkan
- Jangan over-engineer marketplace dan lending sebelum core batch flow stabil
- Jangan membuat web/PWA-specific code (Next.js, localStorage, browser API)

## Definition of Done

Sebuah pekerjaan dianggap selesai bila:

1. Sesuai brief React Native mobile-first
2. Berjalan baik di Android (simulasi Expo Go atau build)
3. Support dark mode dan light mode — teks terbaca di kedua mode
4. State utama tertangani (loading, empty, error, success)
5. Routing dan data flow konsisten
6. Warna dan font menggunakan token dari sistem, bukan hardcode
7. Dokumentasi di `docs/` ikut diperbarui bila ada keputusan baru
