# Verdana Product Brief 08 - User Journey

## Overview

Dokumen ini menjabarkan user journey lengkap untuk dua peran utama: **Supplier** (pengepul plastik) dan **Drop-off Operator** (validator di titik pengumpulan). Journey ini berfokus pada alur mobile-first di React Native app.

> **Terminology note:** Secara internal peran validator disebut "PVP". Di UI yang dilihat supplier, semua referensi ke titik pengumpulan menggunakan **"Drop-off Point"** — bukan "PVP". Lihat `docs/03-ui-rules.md` untuk tabel lengkap terminology.

---

## Role 1: Supplier

### Journey Map

```
[First Open] → [Auth] → [Home] → [Register Batch] → [Drop-off] → [Track Status] → [Receive cNFT]
```

---

### Stage 1 — First Open & Auth

**Goal:** Supplier masuk ke app dan siap beroperasi.

| Step | Screen | Action | App Response |
|---|---|---|---|
| 1 | Welcome | Tap "Get Started" | Navigate ke login |
| 2 | Login | Pilih Google / WhatsApp | Auth + wallet creation di background |
| 3 | Onboarding | Isi nama, area operasional, tipe material | Simpan profil, arahkan ke Home |

**Entry condition:** Belum punya akun Verdana  
**Exit condition:** Profil supplier selesai, sampai di Home tab

**Pain points to avoid:**
- Jangan minta terlalu banyak data di onboarding — cukup nama, area, material utama
- Wallet dibuat otomatis di background — supplier tidak perlu tahu detail wallet

---

### Stage 2 — Supplier Home

**Goal:** Supplier mendapat gambaran cepat status operasional hari ini.

| Element | Info yang ditampilkan |
|---|---|
| Top bar | Nama supplier + tier + area operasional |
| Hero card | Total berat batch aktif, estimasi nilai USDC |
| Metrics | Reputation score, USDC balance |
| Quick actions | Register Batch, History, Wallet, Analytics |
| Latest batches | 3 batch terbaru dengan status badge |

**Key moment:** Supplier melihat batch yang masih "pending validation" — dia tahu harus segera drop-off ke PVP.

---

### Stage 3 — Register Batch (4-Step Flow)

**Goal:** Supplier mendokumentasikan batch plastik yang akan disetor.

| Step | Screen | Action | Validation |
|---|---|---|---|
| 1 | Photo | Foto batch dengan kamera | Minimal 1 foto, bisa retake |
| 2 | Details | Pilih tipe material, estimasi berat | Wajib isi semua field |
| 3 | Location | Capture GPS, pilih PVP terdekat | GPS wajib aktif |
| 4 | Review | Cek semua data, tap Submit | Konfirmasi sebelum kirim |

**Entry condition:** Supplier tap "+" di tab bar atau "Register" di Quick Actions  
**Exit condition:** Batch berhasil di-submit → status: `submitted`

**Native requirements:**
- Kamera via Expo Camera
- GPS via Expo Location
- Draft tersimpan lokal bila app ditutup di tengah jalan
- Upload foto mendukung retry bila koneksi terputus

**State transitions:**
```
[draft] → [submitted] → [transit]
```

---

### Stage 4 — Drop-off ke PVP

**Goal:** Supplier mengantarkan fisik material ke titik PVP.

| Action | App State |
|---|---|
| Supplier dalam perjalanan | Status batch: `transit` |
| Supplier tiba di PVP | Menunggu PVP memvalidasi |
| PVP mulai validasi | Status: `pending_validation` |

**Touchpoint:** Supplier bisa lihat status real-time di History screen atau notifikasi push.

---

### Stage 5 — Track Batch Status

**Goal:** Supplier memantau perjalanan batch dari submit sampai minted.

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
| `rejected` | Not Accepted | Batch tidak diterima — lihat alasan |

**Key moment:** Notifikasi "Your batch has been minted" — supplier tap untuk lihat cNFT.

---

### Stage 6 — Receive & View cNFT

**Goal:** Supplier melihat aset digital hasil batch yang sudah terverifikasi.

| Step | Screen | Info |
|---|---|---|
| Notifikasi | Push notification | "Batch #0012 minted successfully" |
| Wallet tab | List cNFT milik supplier | Tampilkan gambar, material, berat, nilai |
| cNFT detail | `/wallet/cnft/[id]` | Status: listed / collateral / verified |

---

### Supplier Emotional Arc

```
Skeptis        Penasaran      Percaya diri    Antusias
(onboarding)  (first batch)   (batch minted)  (reputasi naik)
```

---

## Role 2: Drop-off Operator (internal: PVP)

### Journey Map

```
[Login] → [Queue Dashboard] → [Validate Batch] → [Co-sign] → [Done]
```

---

### Stage 1 — Login

**Goal:** PVP operator masuk ke app dengan role yang tepat.

| Step | Screen | Action |
|---|---|---|
| 1 | PVP Login | Masukkan kredensial / scan QR lokasi PVP |
| 2 | Role detection | App detect role = PVP, arahkan ke queue dashboard |

---

### Stage 2 — Queue Dashboard

**Goal:** PVP operator melihat antrian batch yang perlu divalidasi.

| Element | Info |
|---|---|
| Queue list | Batch yang sudah `transit` menuju PVP ini |
| Batch summary | Supplier name, material, estimasi berat, waktu submit |
| Priority indicator | Berdasarkan waktu tunggu |

---

### Stage 3 — Validate Batch

**Goal:** PVP operator mencocokkan fisik material dengan data yang disubmit supplier.

| Step | Action | Validasi |
|---|---|---|
| 1 | Scan batch atau pilih dari queue | Match dengan batch ID |
| 2 | Input berat aktual | Harus diisi |
| 3 | Foto kondisi material (opsional) | Bukti tambahan |
| 4 | Catatan tambahan | Bila ada anomali |
| 5 | Tap "Validate" | Konfirmasi sebelum kirim |

**Toleransi berat:** Bila berat aktual beda lebih dari threshold dari estimasi supplier, PVP bisa flag atau reject.

---

### Stage 4 — Co-sign & Complete

**Goal:** PVP mengunci data batch dan trigger minting.

| Action | Result |
|---|---|
| Tap "Co-sign & Submit" | Batch status → `verified` |
| Worker job mengambil alih | Status → `minting` → `minted` |
| PVP melihat success screen | Konfirmasi batch selesai diproses |

**Exit condition:** Batch keluar dari queue PVP, masuk ke history PVP.

---

## Cross-Role Touchpoints

| Moment | Supplier Experience | PVP Experience |
|---|---|---|
| Batch submitted | "Batch sent, waiting for PVP" | Batch muncul di queue |
| PVP starts validation | Status update ke `pending_validation` | Input form aktif |
| Co-sign complete | Notifikasi "Batch verified!" | Success screen |
| Minting done | Notifikasi + cNFT di wallet | History updated |

---

## Edge Cases & Error States

| Scenario | Handling |
|---|---|
| Foto gagal upload | Retry otomatis saat koneksi kembali |
| GPS tidak tersedia | Alert minta supplier aktifkan lokasi |
| Batch ditolak PVP | Supplier menerima notifikasi + alasan penolakan |
| App ditutup saat isi form | Draft tersimpan lokal, bisa dilanjut |
| Koneksi buruk saat submit | Antri di queue lokal, sync saat online |

---

## Journey Status vs Backlog

| Journey Stage | Backlog Item | Status |
|---|---|---|
| Supplier Home | Home dashboard dengan mock data | ✅ done |
| Auth | Supplier login mock | ⬜ todo |
| Register Batch | Register batch 4 step | ⬜ todo |
| Register Batch | Camera capture dan retake | ⬜ todo |
| Register Batch | GPS capture dan pilih PVP terdekat | ⬜ todo |
| Register Batch | Submit batch dan success state | ⬜ todo |
| Track Status | History list dan filter dasar | 🔧 partial |
| Track Status | Batch detail dengan timeline | ⬜ todo |
| Receive cNFT | Wallet summary dasar | 🔧 partial |
| PVP | PVP login mock | ⬜ todo |
| PVP | PVP queue | ⬜ todo |
| PVP | PVP validate batch | ⬜ todo |
| PVP | Co-sign success flow | ⬜ todo |
