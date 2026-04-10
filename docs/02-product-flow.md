# Verdana Product Brief 02 - Product Flow

## Flow Summary

Brief ini menggantikan flow lama yang diasumsikan untuk PWA menjadi flow React Native berbasis `expo-router`.

## App Surfaces

### Supplier app

Route groups yang disarankan:

- `(auth)`
- `(supplier-tabs)`
- `batch`
- `wallet`
- `profile`

### PVP app

Opsi fase awal:

- tetap dalam satu codebase Expo dengan route group terpisah
- role-based access setelah login

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

React Native adjustment:

- jangan pakai asumsi `localStorage`
- simpan session di secure/local device storage abstraction
- gunakan native loading state dan deep link safe redirect

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

Native adjustments:

- kamera menggunakan modul Expo, bukan browser camera API
- GPS menggunakan modul location native
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
9. Mobile app receives updated status from API / polling / push event

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
- browser API diubah menjadi native Expo module
- `localStorage` diubah menjadi storage abstraction mobile
- map, camera, permission, dan upload flow harus dianggap native-first
- push notification dapat masuk roadmap karena lebih relevan di app native
