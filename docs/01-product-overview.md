# Verdana Product Brief 01 - Product Overview

## Purpose

Dokumen ini merangkum arah produk Verdana setelah stack frontend supplier digeser dari Mobile PWA menjadi React Native berbasis Expo.

## Product Scope

Verdana memiliki tiga permukaan produk utama:

1. `Beta Supplier App`
   Aplikasi mobile utama untuk pengepul plastik. Stack target: React Native + Expo.
2. `Beta PVP App`
   Aplikasi untuk processor/validator di titik PVP. Untuk fase brief ini diasumsikan tetap mobile-friendly dan bisa dibuat di stack yang sama agar reuse logic lebih tinggi.
3. `Dashboards`
   Panel web untuk admin, enterprise, dan ESG buyer. Belum menjadi fokus dokumen ini.

## Why React Native

Perubahan dari PWA ke React Native layak dilakukan karena flow supplier sangat bergantung pada kapabilitas device:

- kamera untuk foto batch
- lokasi GPS
- pengalaman offline/poor connection
- notifikasi
- navigasi mobile yang lebih natural
- penyimpanan lokal untuk draft dan retry sync

Repo aktif juga sudah memakai `Expo`, `React Native`, dan `expo-router`, jadi brief baru sebaiknya mengikuti kondisi implementasi saat ini.

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

## Stack Direction

### Mobile app

- React Native
- Expo
- expo-router
- TypeScript

### Backend and platform

- Core API `Go`
- PostgreSQL
- Redis queue
- Cloudflare R2
- Pinata
- Helius / Solana
- Privy untuk auth + embedded wallet saat integrasi real

## Product Principles

- Mobile-first, bukan web yang dipaksa kecil
- Satu tugas utama per layar
- Tetap usable saat koneksi buruk
- Bahasa sederhana dan operasional
- Status batch harus selalu jelas
- Semua keputusan UI harus mendukung trust dan auditability
