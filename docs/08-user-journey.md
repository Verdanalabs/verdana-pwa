# Verdana Product Brief 08 - User Journey

## Overview

Dokumen ini menjabarkan user journey lengkap untuk dua peran utama: **Supplier** (pengepul plastik) dan **Drop-off Operator** (validator di titik pengumpulan). Journey ini berfokus pada alur mobile-first di React Native app.

> **Terminology note:** Secara internal peran validator disebut "PVP". Di UI yang dilihat supplier, semua referensi ke titik pengumpulan menggunakan **"Drop-off Point"** - bukan "PVP". Lihat `docs/03-ui-rules.md` untuk tabel lengkap terminology.

---

## Role 1: Supplier

### Journey Map

```
[First Open] -> [Auth] -> [Home] -> [Register Batch] -> [Drop-off] -> [Track Status] -> [Receive Asset]
```

---

### Stage 1 - First Open & Auth

**Goal:** Supplier masuk ke app dan siap beroperasi.

| Step | Screen | Action | App Response |
|---|---|---|---|
| 1 | Welcome | Swipe intro carousel, tap "Get Started" | Navigate ke login |
| 2 | Login | Login with Email / Google / WhatsApp | Auth + wallet creation di background |
| 3 | Onboarding | Isi nama, area operasional, tipe material | Simpan profil, arahkan ke Home |

**Entry condition:** Belum punya akun Verdana  
**Exit condition:** Profil supplier selesai, sampai di Home tab

**Pain points to avoid:**
- Jangan minta terlalu banyak data di onboarding - cukup nama, area, material utama
- Wallet dibuat otomatis di background - supplier tidak perlu tahu detail wallet
- Welcome screen harus terasa ringan - full-screen visual intro, satu CTA utama, tanpa action stack yang ramai

---

### Stage 2 - Supplier Home

**Goal:** Supplier mendapat gambaran cepat status operasional hari ini.

| Element | Info yang ditampilkan |
|---|---|
| Top bar | Nama supplier + tier + area operasional |
| Hero card | Total berat batch aktif, estimasi nilai USDC |
| Metrics | Reputation score, USDC balance |
| Quick actions | Register Batch, History, Wallet, Analytics |
| Latest batches | 3 batch terbaru dengan status badge |

**Key moment:** Supplier melihat batch yang masih "Being Checked" atau "On the Way" - dia tahu langkah berikutnya tanpa harus menebak.

---

### Stage 3 - Register Batch (4-Step Flow)

**Goal:** Supplier mendokumentasikan batch plastik yang akan disetor.

| Step | Screen | Action | Validation |
|---|---|---|---|
| 1 | Photo | Foto batch dengan kamera | Minimal 1 foto, bisa retake |
| 2 | Details | Pilih tipe material, estimasi berat | Wajib isi semua field |
| 3 | Location | Capture GPS, pilih Drop-off Point terdekat | GPS wajib aktif |
| 4 | Review | Cek semua data, tap Submit | Konfirmasi sebelum kirim |

**Entry condition:** Supplier tap "+" di tab bar atau "Register" di Quick Actions  
**Exit condition:** Batch berhasil di-submit -> status: `submitted`

**Native requirements:**
- Kamera via Expo Camera
- GPS via Expo Location
- Draft tersimpan lokal bila app ditutup di tengah jalan
- Upload foto mendukung retry bila koneksi terputus

**State transitions:**
```
[draft] -> [submitted] -> [transit]
```

---

### Stage 4 - Drop-off ke Drop-off Point

**Goal:** Supplier mengantarkan fisik material ke titik drop-off.

| Action | App State |
|---|---|
| Supplier dalam perjalanan | Status batch: `transit` |
| Supplier tiba di titik drop-off | Menunggu operator memvalidasi |
| Operator mulai validasi | Status: `pending_validation` |

**Touchpoint:** Supplier bisa lihat status real-time di History screen atau notifikasi push.

---

### Stage 5 - Track Batch Status

**Goal:** Supplier memantau perjalanan batch dari submit sampai asset ready.

**Screen:** History list + Batch detail

| Status | Label di UI | Makna untuk supplier |
|---|---|---|
| `draft` | Draft | Belum dikirim |
| `submitted` | Sent | Sudah terkirim |
| `transit` | On the Way | Dalam perjalanan ke Drop-off Point |
| `pending_validation` | Being Checked | Operator sedang cek fisik barang |
| `verified` | Approved | Disetujui, menunggu diproses |
| `minting` | Processing... | Sedang diproses di background |
| `minted` | Asset Ready | Aset digital siap dilihat di wallet |
| `rejected` | Not Accepted | Batch tidak diterima - lihat alasan |

**Key moment:** Notifikasi bahwa batch sudah selesai diproses dan asset siap dilihat.

---

### Stage 6 - Receive & View Asset

**Goal:** Supplier melihat aset digital hasil batch yang sudah terverifikasi.

| Step | Screen | Info |
|---|---|---|
| Notifikasi | Push notification | Asset sudah siap dilihat |
| Wallet tab | List asset milik supplier | Tampilkan gambar, material, berat, nilai |
| Asset detail | `/wallet/cnft/[id]` | Status: listed / collateral / verified |

---

## Role 2: Drop-off Operator (internal: PVP)

### Journey Map

```
[Login] -> [Queue Dashboard] -> [Validate Batch] -> [Co-sign] -> [Done]
```

### Stage 1 - Login

**Goal:** Operator masuk ke app dengan role yang tepat.

| Step | Screen | Action |
|---|---|---|
| 1 | PVP Login | Masukkan kredensial / scan QR lokasi |
| 2 | Role detection | App detect role = PVP, arahkan ke queue dashboard |

### Stage 2 - Queue Dashboard

**Goal:** Operator melihat antrian batch yang perlu divalidasi.

| Element | Info |
|---|---|
| Queue list | Batch yang sudah `transit` menuju titik ini |
| Batch summary | Supplier name, material, estimasi berat, waktu submit |
| Priority indicator | Berdasarkan waktu tunggu |

### Stage 3 - Validate Batch

**Goal:** Operator mencocokkan fisik material dengan data yang disubmit supplier.

| Step | Action | Validasi |
|---|---|---|
| 1 | Scan batch atau pilih dari queue | Match dengan batch ID |
| 2 | Input berat aktual | Harus diisi |
| 3 | Foto kondisi material (opsional) | Bukti tambahan |
| 4 | Catatan tambahan | Bila ada anomali |
| 5 | Tap "Validate" | Konfirmasi sebelum kirim |

### Stage 4 - Co-sign & Complete

**Goal:** Operator mengunci data batch dan trigger processing berikutnya.

| Action | Result |
|---|---|
| Tap "Co-sign & Submit" | Batch status -> `verified` |
| Worker job mengambil alih | Status -> `minting` -> `minted` |
| Operator melihat success screen | Konfirmasi batch selesai diproses |

---

## Journey Status vs Backlog

| Journey Stage | Backlog Item | Status |
|---|---|---|
| Supplier Home | Home dashboard dengan mock data | done |
| Auth | Supplier login mock | done |
| Auth | Onboarding profile supplier | done |
| Register Batch | Register batch 4 step | todo |
| Register Batch | Camera capture dan retake | todo |
| Register Batch | GPS capture dan pilih Drop-off Point terdekat | todo |
| Register Batch | Submit batch dan success state | todo |
| Track Status | History list dan filter dasar | done |
| Track Status | Batch detail dengan timeline | done |
| Receive Asset | Wallet summary dasar | done |
| Receive Asset | Asset detail (`/wallet/cnft/[id]`) | done |
| Profile | Profile screen dasar | done |
| PVP | PVP login mock | todo |
| PVP | PVP queue | todo |
| PVP | PVP validate batch | todo |
| PVP | Co-sign success flow | todo |
