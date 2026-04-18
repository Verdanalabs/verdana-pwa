# Verdana Product Brief 07 - AI Working Rules

## Purpose

Dokumen ini menjadi aturan kerja untuk AI agent atau engineer yang mengeksekusi brief Verdana di repo ini.

## Scope Discipline

- Fokus utama saat ini adalah **mobile-only PWA operasional** berbasis Expo untuk dua role: `supplier` dan `pvp_operator`
- Target platform primer: browser mobile dan installed PWA
- Desktop browser bukan target pengalaman operasional
- Jika app operasional dibuka dari desktop, harus tampil blocker page khusus
- Jangan membuat asumsi desktop web flow; semua harus mobile-first

> Catatan scope saat ini: repo aktif memakai Expo + React Native dan diexport ke web sebagai mobile-only PWA. Keputusan ini berlaku untuk dua role operasional, yaitu Supplier dan PVP, karena keduanya sama-sama bekerja di konteks lapangan dan membutuhkan capability device seperti kamera, GPS, offline tolerance, dan akses cepat dari ponsel.

## Architecture Discipline

- Gunakan arsitektur yang menjaga separation antara `UI`, `state`, `API client`, dan `domain logic`
- Pisahkan feature berdasarkan domain bisnis di `features/`
- Reuse komponen di `components/ui/` hanya jika semantics-nya sama lintas supplier dan PVP
- Hindari coupling ke browser API mentah; storage, kamera, lokasi, dan capability web/PWA harus lewat abstraction

## Implementation Rules

- Gunakan **TypeScript**; semua file `.ts` atau `.tsx`, tidak ada plain JS
- Semua warna wajib diambil dari `useThemeColors()`
- Semua font wajib dari `@/constants/typography`
- Semua status batch wajib pakai enum `BatchStatus` dari `@/types`
- Semua screen harus punya loading, empty, error, dan success state bila relevan
- Mock data dipusatkan di `mocks/`
- Jangan gunakan `Colors` lama dari `constants/colors.ts` untuk komponen baru; gunakan `themes.ts`

## Theme Rules

- Default mode: **dark**
- Toggle mode tersedia via `useTheme().toggle()`
- `ThemeProvider` sudah dipasang di `app/_layout.tsx`
- Hero card selalu pakai background gelap di kedua mode
- Setiap komponen baru wajib support dark dan light mode

## Routing Rules

- Gunakan `expo-router` dengan group yang eksplisit
- Route yang belum ada boleh push dengan `as never` sebagai temporary type cast
- Saat route batch dan PVP dibuat, ganti `as never` dengan path yang sesungguhnya
- Jangan buat route baru tanpa screen yang jelas tujuannya
- Platform guard untuk desktop harus ditempatkan di layer routing yang melindungi seluruh flow operasional

## Font Rules

- Font: **Space Grotesk** via `@expo-google-fonts/space-grotesk`
- Di-load di `app/_layout.tsx` sebelum SplashScreen hilang
- Import selalu: `import { Font, FontSize } from '@/constants/typography'`

## Copywriting Rules

- Semua teks UI wajib **English**
- Tulis untuk user lapangan, bukan developer
- Gunakan terminology yang sudah disepakati di `docs/03-ui-rules.md`
- "PVP" menjadi **"Drop-off Point"** di semua label yang dilihat supplier
- "cNFT" menjadi **"Asset"** atau **"Digital Asset"**
- "Minting" menjadi **"Processing..."**
- Status label wajib dari `BATCH_STATUS_LABEL` di `@/constants/batch-status.ts`

## Mock-First Rules

- Jangan blok pekerjaan frontend karena backend belum final
- Gunakan mock data, mock auth, dan mock API contract untuk menyelesaikan flow dulu
- Semua keputusan UI, state, dan routing harus bisa berjalan tanpa backend nyata
- API contract di `docs/05-api-contract.md` diperlakukan sebagai acuan integrasi

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
- Uji akses mobile browser vs desktop blocker untuk role Supplier dan PVP

## Documentation Rules

- Bila arsitektur berubah, update brief 01-07 dahulu sebelum implementasi besar
- Bila ada keputusan yang menyalahi brief, tulis exception secara eksplisit di doc yang relevan
- Jangan campur requirement supplier dan dashboard enterprise dalam satu dokumen teknis
- Backlog di `06-feature-backlog.md` wajib diupdate saat item selesai

## Non-Goals

- Jangan mendesain smart contract dari brief ini
- Jangan membahas infra deployment terlalu detail bila belum dibutuhkan
- Jangan over-engineer marketplace dan lending sebelum core batch flow stabil
- Jangan membangun pengalaman desktop operasional untuk Supplier atau PVP di permukaan app ini
- Jangan membuat web/PWA-specific code yang mengunci implementasi ke desktop browser atau framework lain seperti Next.js

## Definition of Done

Sebuah pekerjaan dianggap selesai bila:

1. Sesuai brief mobile-only PWA untuk Supplier dan PVP
2. Berjalan baik di browser mobile atau installed PWA
3. Support dark mode dan light mode
4. State utama tertangani: loading, empty, error, success
5. Routing dan data flow konsisten
6. Warna dan font menggunakan token dari sistem
7. Desktop access ke flow operasional tertangani dengan blocker page
8. Dokumentasi di `docs/` ikut diperbarui bila ada keputusan baru
