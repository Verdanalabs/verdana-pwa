# Verdana Product Brief 08 - User Journey

## Overview

Dokumen ini menjabarkan user journey lengkap untuk dua peran utama: **Supplier** (pengepul plastik) dan **Drop-off Operator** (validator di titik pengumpulan). Journey ini berfokus pada alur mobile-first yang dijalankan sebagai mobile-only PWA.

Constraint platform yang berlaku untuk seluruh journey:

- role Supplier dan PVP diakses dari browser mobile atau installed PWA
- jika diakses dari desktop atau laptop, user tidak masuk ke flow operasional
- app harus menampilkan halaman khusus yang menjelaskan bahwa akses operasional hanya tersedia di perangkat mobile

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
- Jika dibuka dari desktop, jangan tampilkan form login supplier; tampilkan blocker page

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
[Login] -> [Queue Dashboard] -> [Batch Intake] -> [Inspection] -> [Validation Review] -> [Co-sign] -> [Done]
```

---

### Stage 1 - Login & Station Context

**Goal:** Operator masuk ke app dengan role PVP dan terikat ke titik operasional yang benar.

| Step | Screen | Action | App Response |
|---|---|---|---|
| 1 | PVP Login | Masukkan email + password / SSO internal | Verifikasi kredensial |
| 2 | Station Check | Scan QR lokasi atau pilih station yang di-assigned | Simpan `pvpId` aktif untuk sesi berjalan |
| 3 | Role detection | App detect role = PVP | Arahkan ke queue dashboard PVP |

**Entry condition:** Operator belum login atau sesi sudah expired  
**Exit condition:** Operator berada di dashboard queue dengan station aktif

**Pain points to avoid:**
- Operator tidak boleh memilih station yang bukan assignment-nya tanpa override internal
- Jika station context hilang, app harus block validation supaya batch tidak salah lokasi
- Login harus cepat - idealnya cukup sekali per shift, lalu session keep-alive
- Jika operator membuka dari desktop, app harus berhenti di blocker page sebelum masuk flow station

---

### Stage 2 - Queue Dashboard

**Goal:** Operator melihat batch masuk yang menunggu diterima di titik tersebut.

| Element | Info yang ditampilkan |
|---|---|
| Active station header | Nama PVP, area, shift aktif |
| Queue list | Batch dengan status `transit` atau `pending_validation` |
| Batch summary | Batch ID, supplier name, material, estimasi berat, waktu submit |
| Priority indicator | Berdasarkan waktu tunggu dan SLA |
| Search / scan entry | Cari batch ID atau buka scanner |
| Queue counters | Waiting, in review, rejected today |

**Key moment:** Operator bisa langsung membedakan batch yang baru tiba, batch yang sedang dicek, dan batch yang butuh keputusan cepat.

**List grouping yang disarankan:**
- `Arriving`: batch masih `transit`, supplier belum check-in fisik
- `Ready to Inspect`: batch sudah tiba dan siap ditimbang
- `Needs Resolution`: batch yang punya mismatch atau catatan sebelumnya

---

### Stage 3 - Batch Intake

**Goal:** Operator mengambil batch dari antrian dan memulai proses pemeriksaan fisik.

| Step | Screen | Action | Validation |
|---|---|---|---|
| 1 | Queue / Scanner | Scan QR batch atau pilih dari daftar | Batch ID harus valid dan milik station ini |
| 2 | Intake Summary | Lihat foto awal, material claim, estimasi berat, supplier info | Data batch harus lengkap |
| 3 | Arrival Confirm | Tandai batch sudah diterima fisik di lokasi | Hanya bisa untuk status `transit` |
| 4 | Start Inspection | Tap "Start Checking" | Status berubah ke `pending_validation` |

**Entry condition:** Batch ada di queue station aktif  
**Exit condition:** Batch masuk mode inspeksi

**App behavior:**
- Saat operator membuka batch, tampilkan foto supplier sebagai referensi awal
- Jika batch sudah sedang dibuka operator lain, tampilkan lock state / warning
- Jika supplier datang tanpa QR, operator tetap bisa cari manual via batch ID atau nama supplier

**State transitions:**
```
[transit] -> [pending_validation]
```

---

### Stage 4 - Physical Inspection

**Goal:** Operator memastikan isi batch sesuai klaim supplier sebelum divalidasi.

| Check Area | Tindakan operator | Hasil yang disimpan |
|---|---|---|
| Material match | Cocokkan jenis plastik dengan submission | `conditionChecks.materialMatches` |
| Weight | Timbang batch aktual | `actualWeightKg` |
| Contamination | Cek kebersihan / campuran material | `conditionChecks.noContamination` |
| Grade | Tentukan grade final | `finalGrade` |
| Evidence | Tambah foto kondisi bila perlu | URL / upload key foto inspeksi |
| Notes | Tulis anomali atau alasan reject | `notes` |

**Validation rules:**
- `actualWeightKg` wajib diisi dan harus > 0
- `finalGrade` wajib diisi saat batch lolos inspeksi
- `notes` wajib bila ada mismatch, contamination, atau reject
- Foto inspeksi optional, tapi strongly recommended untuk kasus dispute

**Decision branches:**

| Kondisi | Keputusan operator | Next status |
|---|---|---|
| Data sesuai, material layak | Lanjut approve | `verified` |
| Ada selisih kecil tapi masih bisa diterima | Koreksi berat/grade + approve | `verified` |
| Material tidak sesuai / terlalu terkontaminasi | Reject dengan alasan | `rejected` |
| Butuh klarifikasi manual | Simpan note, tahan sementara di `pending_validation` | `pending_validation` |

**Pain points to avoid:**
- Jangan paksa operator mengetik terlalu banyak; checklist harus dominan, notes hanya saat perlu
- Form harus bisa dipakai cepat dengan satu tangan di lapangan
- Jika koneksi buruk, hasil inspeksi harus bisa retry tanpa input ulang

---

### Stage 5 - Validation Review

**Goal:** Operator meninjau ulang hasil inspeksi sebelum keputusan final dikirim.

| Section | Isi |
|---|---|
| Submitted vs actual | Perbandingan estimasi supplier dan hasil aktual |
| Risk flags | Weight mismatch, contamination, wrong material |
| Decision summary | Approve / reject |
| Required confirmation | Checklist bahwa operator sudah cek fisik barang |

**Entry condition:** Semua field inspeksi minimum sudah lengkap  
**Exit condition:** Operator memilih approve atau reject

**Approve path:**
- Tombol utama: `Validate Batch`
- App kirim `POST /batches/:id/validate`
- Jika sukses, batch pindah ke status `verified`

**Reject path:**
- Tombol sekunder: `Reject Batch`
- App wajib kirim alasan reject yang jelas dan machine-readable
- Supplier nantinya melihat status `rejected` beserta alasan

---

### Stage 6 - Co-sign & Complete

**Goal:** Operator mengunci hasil validasi dan meneruskan batch ke proses backend berikutnya.

| Action | Result |
|---|---|
| Operator lihat summary final | Data final siap dikonfirmasi |
| Tap `Co-sign & Submit` | App kirim `POST /batches/:id/cosign` |
| Response sukses | Batch status -> `minting` |
| Worker job mengambil alih | Status lanjut -> `minted` |
| Success screen | Operator kembali ke queue atau buka batch berikutnya |

**Entry condition:** Batch sudah `verified`  
**Exit condition:** Batch sukses di-co-sign dan keluar dari queue aktif

**State transitions:**
```
[pending_validation] -> [verified] -> [minting] -> [minted]
                     \-> [rejected]
```

**Success state yang perlu ada:**
- Badge bahwa validation sukses
- Ringkasan batch final: ID, supplier, berat aktual, grade final
- CTA: `Back to Queue`
- CTA sekunder: `Open Next Batch`

**Failure handling:**
- Jika validate sukses tapi cosign gagal, batch tetap `verified` dan muncul di group `Needs Resolution`
- Jika request timeout, tampilkan state retry tanpa menghapus data input operator
- Semua error harus mengacu ke error code backend, bukan pesan generik saja

---

### PVP Daily Flow Summary

| Phase | Tujuan operasional | KPI / indikator |
|---|---|---|
| Start shift | Login dan set station context | Ready time per shift |
| Intake | Batch diterima dan masuk inspeksi | Arrival-to-check time |
| Inspection | Data aktual tercatat dengan benar | Validation accuracy |
| Finalization | Batch dikirim ke processing berikutnya | Queue completion rate |

### PVP Notifications / System Events

| Event | Dampak di UI operator |
|---|---|
| Batch baru menuju station | Muncul di queue `Arriving` |
| Supplier tiba / check-in | Naik prioritas ke `Ready to Inspect` |
| Validation sukses | Batch hilang dari queue aktif |
| Cosign gagal | Batch muncul di `Needs Resolution` |
| Batch rejected | Pindah ke riwayat rejected hari ini |

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
