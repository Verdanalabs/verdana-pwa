# Verdana Product Brief 06 - Feature Backlog

## Prioritization Rules

- `P0`: wajib untuk demo alur inti
- `P1`: penting setelah alur inti stabil
- `P2`: enhancement dan ekspansi

## Status Legend

- `✅ done` — sudah diimplementasi
- `🔧 partial` — sudah ada skeleton/placeholder
- `⬜ todo` — belum dimulai

---

## P0 - Core Mobile MVP

### Supplier

| Item | Status |
|---|---|
| Supplier login mock | ⬜ todo |
| Onboarding profile supplier | ⬜ todo |
| Supplier home dashboard dengan mock data | ✅ done |
| Register batch 4 step | ⬜ todo |
| Camera capture dan retake | ⬜ todo |
| GPS capture dan pilih PVP terdekat | ⬜ todo |
| Submit batch dan success state | ⬜ todo |
| History list dan filter dasar | 🔧 partial (placeholder screen) |
| Batch detail dengan timeline | ⬜ todo |

### PVP

| Item | Status |
|---|---|
| PVP login mock | ⬜ todo |
| PVP queue | ⬜ todo |
| PVP validate batch | ⬜ todo |
| Co-sign success flow | ⬜ todo |

### Wallet & Profile

| Item | Status |
|---|---|
| Wallet summary dasar | 🔧 partial (placeholder screen) |
| Profile screen dasar | 🔧 partial (placeholder screen) |

---

## P0 - Technical Foundations

| Item | Status |
|---|---|
| Route structure `expo-router` | ✅ done |
| Shared design tokens (colors, typography) | ✅ done |
| Dark mode / light mode support | ✅ done |
| Font system (Space Grotesk) | ✅ done |
| ThemeContext + useThemeColors | ✅ done |
| Domain types untuk batch, user, wallet, pvp | ✅ done |
| Mock data layer (`mocks/`) | ✅ done |
| Error state dan loading state standar | ⬜ todo |
| Persisted batch draft | ⬜ todo |

---

## P1 - Integration Readiness

| Item | Status |
|---|---|
| Privy integration | ⬜ todo |
| Secure token storage | ⬜ todo |
| Presigned photo upload | ⬜ todo |
| Real Core API integration | ⬜ todo |
| Mint status refresh | ⬜ todo |
| Pull to refresh | ⬜ todo |
| Empty, error, and offline states lengkap | ⬜ todo |
| Analytics event tracking | ⬜ todo |

## P1 - Product Quality

| Item | Status |
|---|---|
| Push notification untuk status batch | ⬜ todo |
| Retry upload bila koneksi gagal | ⬜ todo |
| Better filter dan search history | ⬜ todo |
| Supplier reputation breakdown | ⬜ todo |
| PVP history screen | ⬜ todo |

---

## P2 - Growth Features

| Item | Status |
|---|---|
| Marketplace listing flow | ⬜ todo |
| Lending / collateral flow | ⬜ todo |
| CO2 impact metrics | ⬜ todo |
| Multi-role switch dalam satu app | ⬜ todo |
| Enterprise dashboard handoff | ⬜ todo |

---

## Delivery Phases

### Phase 1 — In Progress

- ✅ home supplier dashboard
- ✅ design system + dark/light mode
- ⬜ auth mock
- ⬜ register batch
- ⬜ history
- ⬜ batch detail

### Phase 2

- ⬜ pvp flow
- ⬜ wallet
- ⬜ profile
- ⬜ persisted draft

### Phase 3

- ⬜ backend integration
- ⬜ storage upload
- ⬜ notifications
- ⬜ observability

---

## Dependencies

- camera flow bergantung pada permission handling
- submit batch bergantung pada upload contract
- wallet screen bergantung pada user bootstrap contract
- minting status bergantung pada backend status lifecycle yang konsisten

## Success Criteria

- Supplier bisa menyelesaikan registrasi batch end-to-end
- PVP bisa memvalidasi dan trigger minting status
- Semua state penting bisa divisualisasikan tanpa backend nyata terlebih dahulu
