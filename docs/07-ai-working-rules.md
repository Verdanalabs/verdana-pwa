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
- `app/` hanya untuk routing, layout, redirect, dan modal declaration
- Semua screen implementasi harus ada di `src/features/`
- Reuse komponen di `src/shared/ui/` hanya jika semantics-nya sama lintas supplier dan PVP
- Theme, navigation, dan platform helpers harus hidup di `src/shared/*`
- App-wide provider composition hanya di `src/providers/AppProviders.tsx`
- Hindari coupling ke browser API mentah; storage, kamera, lokasi, dan capability web/PWA harus lewat abstraction

## Implementation Rules

- Gunakan **TypeScript**; semua file `.ts` atau `.tsx`, tidak ada plain JS
- Semua warna wajib diambil dari `useThemeColors()`
- Semua font wajib dari `@/src/shared/theme/typography`
- Semua status batch wajib pakai enum `BatchStatus` dari `@/types`
- Semua screen harus punya loading, empty, error, dan success state bila relevan
- Mock data dipusatkan di `mocks/`
- Jangan gunakan legacy `store/*`, `constants/*`, atau path shared lama untuk kode baru jika versi `src/...` sudah ada
- Jangan gunakan `Colors` lama dari `constants/colors.ts` atau `constants/theme.ts`; gunakan token theme aktif
- Jangan menaruh screen besar, business logic, atau mock shaping di file route `app/*`

## Theme Rules

- Default mode: **dark**
- Toggle mode tersedia via `useTheme().toggle()`
- `ThemeProvider` dipasang lewat `src/providers/AppProviders.tsx`
- Hero card selalu pakai background gelap di kedua mode
- Setiap komponen baru wajib support dark dan light mode
- Gunakan hanya sistem theme aktif:
  - `@/src/shared/theme/theme-context`
  - `@/src/shared/theme/tokens`
  - `@/src/shared/theme/typography`

## Routing Rules

- Gunakan `expo-router` dengan group yang eksplisit
- `app/` harus tetap tipis, idealnya hanya `export { default } from ...`
- Layout guard tetap ada di layout route, bukan dipindah ke screen feature
- Flow state provider dipasang di flow layout, bukan root app
- Jangan buat route baru tanpa screen yang jelas tujuannya
- Platform guard untuk desktop harus ditempatkan di layer routing yang melindungi seluruh flow operasional

## Font Rules

- Font: **Space Grotesk** via `@expo-google-fonts/space-grotesk`
- Di-load di `app/_layout.tsx` sebelum SplashScreen hilang
- Import baru selalu: `import { Font, FontSize } from '@/src/shared/theme/typography'`

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
- Mock data tidak boleh dibentuk di route file; tempatkan di feature hook, service, atau screen feature

## Data and API Rules

- Semua contract ditulis eksplisit sebelum integrasi
- Jangan membuat shape response berbeda-beda antar screen
- Batch detail harus menjadi source utama timeline dan status
- Upload file harus lewat abstraction service, bukan langsung tersebar di komponen
- Jika dua feature butuh hal yang sama, pindahkan ke `src/shared/*`, bukan import internal antar-feature sembarangan

## Testing Rules

- Uji minimal flow auth mock
- Uji dark mode dan light mode di semua screen baru
- Uji create batch draft
- Uji validasi form
- Uji state transition batch
- Uji rendering StatusBadge di semua status
- Uji akses mobile browser vs desktop blocker untuk role Supplier dan PVP

## Documentation Rules

- Bila arsitektur berubah, update `AGENTS.md` dan brief terkait terlebih dahulu atau dalam PR yang sama
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
9. Struktur file tetap mengikuti `app/` route-only dan `src/` feature-first architecture
