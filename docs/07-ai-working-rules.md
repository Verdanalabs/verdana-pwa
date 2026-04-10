# Verdana Product Brief 07 - AI Working Rules

## Purpose

Dokumen ini menjadi aturan kerja untuk AI agent atau engineer yang mengeksekusi brief Verdana di repo ini.

## Scope Discipline

- Fokus hanya pada mobile React Native berbasis Expo kecuali diminta lain
- Jangan mengembalikan brief ke asumsi `Next.js PWA`
- Perlakukan web Expo hanya sebagai target preview internal

## Architecture Discipline

- Gunakan `expo-router` untuk routing
- Pisahkan feature berdasarkan domain bisnis, bukan berdasarkan jenis file semata
- Reuse komponen lintas supplier dan PVP hanya jika semantics-nya sama
- Jangan memasukkan ketergantungan web-only untuk flow inti mobile

## Implementation Rules

- Gunakan TypeScript
- Gunakan native-first APIs melalui Expo modules saat tersedia
- Hindari hard-coded mock tersebar; pusatkan di `mocks/` atau service mock layer
- Semua status batch harus memakai enum tunggal yang konsisten
- Semua screen harus punya loading, empty, error, dan success state bila relevan

## UX Rules

- Prioritaskan Android ergonomics
- Jangan membuat layar padat seperti dashboard admin
- Form multi-step wajib bisa di-resume
- Semua CTA harus jelas satu aksi utama
- Istilah blockchain jangan mendominasi onboarding supplier

## Data and API Rules

- Semua contract ditulis eksplisit sebelum integrasi
- Jangan membuat shape response berbeda-beda antar screen
- Batch detail harus menjadi source utama timeline dan status
- Upload file harus lewat abstraction service, bukan langsung tersebar di komponen

## Testing Rules

- Uji minimal flow auth mock
- Uji create batch draft
- Uji validasi form
- Uji state transition batch
- Uji rendering status badge

## Documentation Rules

- Bila arsitektur berubah, update brief 01-07 dahulu sebelum implementasi besar
- Bila ada keputusan yang menyalahi brief, tulis exception secara eksplisit
- Jangan campur requirement supplier dan dashboard enterprise dalam satu dokumen teknis

## Non-Goals

- Jangan mendesain smart contract dari brief ini
- Jangan membahas infra deployment terlalu detail bila belum dibutuhkan implementasi app
- Jangan over-engineer marketplace dan lending sebelum core batch flow stabil

## Definition of Done

Sebuah pekerjaan dianggap selesai bila:

1. sesuai brief React Native
2. state utama tertangani
3. routing dan data flow konsisten
4. ada verifikasi dasar atau test yang relevan
5. dokumentasi ikut diperbarui bila keputusan berubah
