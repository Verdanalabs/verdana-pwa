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

- Supplier memakai bottom tab
- Screen detail memakai stack navigation
- Proses penting seperti submit, validation, dan success memakai full-screen flow
- Jangan campur banyak modal untuk alur kritikal

## Visual Rules

### Typography

- Pakai skala tipografi sederhana dan konsisten
- Heading harus ringkas
- Data penting seperti `kg`, status, dan batch ID harus punya penekanan visual lebih tinggi

### Color

- Hijau untuk success atau minted
- Kuning atau amber untuk transit / attention
- Abu untuk state netral
- Merah hanya untuk error, reject, atau destructive action
- Jangan jadikan ungu sebagai warna dominan produk bila tidak punya alasan brand yang kuat

### Status system

Minimal warna status:

- `draft`: abu muda
- `submitted`: biru muda
- `transit`: amber
- `pending_validation`: abu tua
- `verified`: biru
- `minting`: hijau dengan activity indicator
- `minted`: hijau solid
- `listed`: ungu
- `collateral`: oranye
- `rejected`: merah

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
- Tampilkan PVP terpilih dan jarak secara jelas

## Wallet and Web3 Rules

- Wallet address dipersingkat
- Hindari menampilkan hash panjang sebagai elemen dominan
- Istilah seperti `cNFT`, `minting`, `on-chain` boleh muncul di layar detail, bukan di langkah pendaftaran awal

## Copy Rules

- Gunakan bahasa Indonesia operasional
- Kalimat pendek
- CTA contoh:
  - `Lanjut`
  - `Ambil Foto`
  - `Kirim Batch`
  - `Lihat Detail`
  - `Co-sign & Mint`

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

- `StatusBadge`
- `MaterialBadge`
- `BatchCard`
- `QuickActionCard`
- `StepIndicator`
- `PrimaryButton`
- `MetricCard`
- `TimelineItem`
