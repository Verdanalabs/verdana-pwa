# Verdana Product Brief 01 - Product Overview

## Purpose

Dokumen ini merangkum arah produk Verdana untuk aplikasi operasional lapangan yang dibangun dalam satu codebase Expo dan dideliver sebagai mobile-only PWA untuk dua role utama: Supplier dan PVP.

## Product Scope

Verdana memiliki tiga permukaan produk utama:

1. `Beta Supplier App`
   Aplikasi operasional untuk pengepul plastik. Target delivery: mobile-only PWA berbasis Expo.
2. `Beta PVP App`
   Aplikasi operasional untuk processor/validator di titik PVP. Target delivery: mobile-only PWA di codebase yang sama agar reuse logic tinggi.
3. `Dashboards`
   Panel web untuk admin, enterprise, dan ESG buyer. Belum menjadi fokus dokumen ini.

## Platform Decision

Verdana memakai Expo + React Native karena flow Supplier dan PVP sama-sama bergantung pada kapabilitas device, tetapi untuk fase ini delivery channel yang dipilih adalah web installable dengan perilaku mobile-first.

Prinsip delivery yang berlaku:

- aplikasi operasional Supplier dan PVP dibuka dari browser mobile atau installed PWA
- akses desktop/laptop tidak menjadi pengalaman operasional yang didukung
- jika dibuka dari desktop, aplikasi harus menampilkan halaman khusus yang menjelaskan bahwa app hanya tersedia di mobile
- dashboard admin, enterprise, dan buyer tetap menjadi permukaan web desktop yang terpisah

Alasan utama keputusan ini:

- kamera untuk foto batch
- lokasi GPS
- pengalaman offline/poor connection
- notifikasi
- navigasi mobile yang lebih natural
- penyimpanan lokal untuk draft dan retry sync

Repo aktif sudah memakai `Expo`, `React Native`, `expo-router`, dan bisa diexport ke web statis. Karena itu arah produk diset sebagai `mobile-only PWA` alih-alih desktop web app.

## Primary Users

### Supplier

- Pengepul atau waste collector skala kecil sampai menengah
- Bekerja di lapangan
- Butuh alur cepat, sederhana, dan tahan sinyal buruk
- Nilai utama: pencatatan batch, bukti kepemilikan data, akses aset dan reputasi

### Processor / PVP Operator

- Petugas validator di lokasi PVP
- Memeriksa batch fisik
- Menginput berat aktual dan co-sign
- Nilai utama: validasi cepat, anti-fraud, dan jejak audit

## Core Product Promise

Verdana mengubah transaksi limbah plastik yang sebelumnya informal dan paper-based menjadi alur digital yang:

- tercatat
- tervalidasi
- siap diaudit
- bisa dimonetisasi menjadi aset on-chain

## Product Outcomes

### Supplier outcomes

- daftar batch dalam hitungan menit
- lihat status batch secara real time
- punya histori dan reputasi digital
- menerima aset cNFT tanpa mengurus wallet manual

### Business outcomes

- batch lebih mudah diverifikasi
- data rantai pasok lebih rapi
- fondasi untuk marketplace dan lending
- audit trail untuk buyer dan mitra ESG

## MVP Scope

Fokus MVP tetap pada alur inti:

1. login dan onboarding
2. registrasi batch
3. drop-off ke PVP
4. validasi dan co-sign
5. status minting dan hasil aset
6. history, wallet, dan profile dasar

## Out of Scope For This Brief

- dashboard enterprise detail
- modul marketplace penuh
- lending production-grade
- smart contract detail
- analitik BI lanjutan
- pengalaman operasional desktop untuk Supplier dan PVP

## Stack Direction

### Operational app

- React Native
- Expo
- expo-router
- TypeScript
- Web export untuk mobile-only PWA

### Delivery constraints

- target utama: browser mobile dan installed PWA
- role yang mengikuti constraint ini: `supplier` dan `pvp_operator`
- desktop browser bukan target operasional
- desktop harus diarahkan ke blocker page, bukan tetap diberi akses penuh

### Backend and platform

- Core API `Go`
- PostgreSQL
- Redis queue
- Cloudflare R2
- Pinata
- Helius / Solana
- Privy untuk auth + embedded wallet saat integrasi real

## Product Principles

- Mobile-first, bukan desktop web yang dikecilkan
- Satu tugas utama per layar
- Tetap usable saat koneksi buruk
- Bahasa sederhana dan operasional
- Status batch harus selalu jelas
- Semua keputusan UI harus mendukung trust dan auditability
