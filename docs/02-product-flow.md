# Verdana Product Brief 02 - Product Flow

## Flow Summary

Brief ini mendefinisikan flow produk untuk satu codebase `Expo + expo-router` yang dideliver sebagai mobile-only PWA untuk role Supplier dan PVP.

Constraint platform yang berlaku untuk seluruh flow:

- flow operasional hanya didukung di browser mobile dan installed PWA
- desktop browser harus dialihkan ke halaman blocker khusus
- semua keputusan UI, routing, dan capability harus mobile-first

## App Surfaces

### Supplier app

Route groups yang disarankan:

- `(auth)`
- `(supplier-tabs)`
- `batch`
- `wallet`
- `profile`

### PVP app

Pendekatan fase awal:

- tetap dalam satu codebase Expo dengan route group terpisah
- role-based access setelah login
- delivery channel sama dengan Supplier: mobile-only PWA

## Supplier Primary Flow

### 1. Authentication and onboarding

Screen sequence:

1. `/(auth)/welcome`
2. `/(auth)/login`
3. `/(auth)/onboarding-profile`

User actions:

- pilih login Google / WhatsApp / Email
- wallet dibuat di background
- isi nama, area operasional, tipe material utama

Platform adjustment:

- jangan pakai asumsi desktop web flow
- simpan session di storage abstraction yang aman untuk mobile web/PWA
- gunakan loading state, redirect, dan deep link yang aman untuk browser mobile/PWA

### 2. Supplier home

Screen: `/(supplier-tabs)/home`

Tujuan:

- melihat ringkasan performa
- melihat batch terbaru
- masuk cepat ke `register batch`, `history`, dan `wallet`

State penting:

- pending transit
- menunggu validasi PVP
- minting
- minted

### 3. Register batch

Screen sequence:

1. `/batch/new/photo`
2. `/batch/new/details`
3. `/batch/new/location`
4. `/batch/new/review`

Device-oriented adjustments:

- kamera menggunakan modul Expo, bukan browser camera API langsung
- GPS menggunakan modul location native atau abstraction yang setara
- draft form perlu bisa disimpan lokal bila user keluar app
- upload foto harus mendukung retry ketika jaringan kembali normal

### 4. Batch tracking

Screen sequence:

- `/(supplier-tabs)/history`
- `/batch/[id]`

Tujuan:

- lihat histori
- filter berdasarkan material dan status
- lihat timeline status per batch

### 5. Wallet and assets

Screen sequence:

- `/(supplier-tabs)/wallet`
- `/wallet/cnft/[id]`

Tujuan:

- lihat wallet address
- lihat cNFT milik supplier
- lihat status listed / collateral / verified

### 6. Profile

Screen: `/(supplier-tabs)/profile`

Tujuan:

- tampilkan tier supplier
- tampilkan reputasi
- tampilkan metode sign-in

## PVP Primary Flow

### 1. PVP login

Screen:

- `/(auth)/pvp-login`

Platform notes:

- hanya untuk mobile browser / installed PWA
- bila diakses dari desktop, arahkan ke blocker page yang sama dengan Supplier

### 2. Queue dashboard

Screen:

- `/pvp/dashboard`

### 3. Validate batch

Screen:

- `/pvp/validate/[batchId]`

### 4. Co-sign success

Screen:

- `/pvp/cosign/[batchId]/success`

### 5. Validation history

Screen:

- `/pvp/history`

## System Flow

1. Supplier login
2. Supplier register batch with photo and GPS
3. Core API creates batch record
4. Supplier delivers material to PVP
5. PVP operator validates actual weight
6. Co-sign event locks batch data
7. Mint job enters queue
8. Worker uploads metadata and mints cNFT
9. Mobile PWA receives updated status from API / polling / push event

## State Machine

Batch states minimum:

- `draft`
- `submitted`
- `transit`
- `pending_validation`
- `verified`
- `minting`
- `minted`
- `listed`
- `collateral`
- `rejected`

## Key Stack Adjustments From Old Docs

- `Next.js route` diubah menjadi `expo-router` path
- delivery target ditetapkan sebagai mobile-only PWA, bukan desktop web app
- desktop access harus diblok dengan dedicated page
- browser API yang dipakai harus aman untuk mobile web/PWA dan dibungkus via abstraction
- storage diubah menjadi storage abstraction yang tidak mengunci kita ke satu platform
- map, camera, permission, dan upload flow harus dianggap mobile-first
- push notification tetap relevan untuk roadmap PWA/app
