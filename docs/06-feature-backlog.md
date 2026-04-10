# Verdana Product Brief 06 - Feature Backlog

## Prioritization Rules

- `P0`: wajib untuk demo alur inti
- `P1`: penting setelah alur inti stabil
- `P2`: enhancement dan ekspansi

## Status Legend

- `done` - sudah diimplementasi
- `partial` - sudah ada skeleton/placeholder
- `todo` - belum dimulai

---

## P0 - Core Mobile MVP

### Supplier

| Item | Status |
|---|---|
| Supplier login mock | done |
| Onboarding profile supplier | done |
| Supplier home dashboard dengan mock data | done |
| Home screen UI polish (QuickActions, MaterialBadge, FAB gradient) | done |
| User-friendly status labels (English, non-technical) | done |
| Copywriting - semua UI copy English + terminology rules | done |
| User journey document (`docs/08-user-journey.md`) | done |
| Register batch 4 step | todo |
| Camera capture dan retake | todo |
| GPS capture dan pilih Drop-off Point terdekat | todo |
| Submit batch dan success state | todo |
| History list dan filter dasar | done |
| Batch detail dengan timeline | done |

### PVP

| Item | Status |
|---|---|
| PVP login mock | todo |
| PVP queue | todo |
| PVP validate batch | todo |
| Co-sign success flow | todo |

### Wallet & Profile

| Item | Status |
|---|---|
| Wallet summary dasar | done |
| Asset detail (`/wallet/cnft/[id]`) | done |
| Profile screen dasar | done |

---

## P0 - Technical Foundations

| Item | Status |
|---|---|
| Route structure `expo-router` | done |
| Shared design tokens (colors, typography) | done |
| Dark mode / light mode support | done |
| Font system (Space Grotesk) | done |
| ThemeContext + useThemeColors | done |
| Domain types untuk batch, user, wallet, pvp | done |
| Mock data layer (`mocks/`) | done |
| Error state dan loading state standar | todo |
| Persisted batch draft | todo |

---

## P1 - Integration Readiness

| Item | Status |
|---|---|
| Privy integration | todo |
| Secure token storage | todo |
| Presigned photo upload | todo |
| Real Core API integration | todo |
| Mint status refresh | todo |
| Pull to refresh | todo |
| Empty, error, and offline states lengkap | todo |
| Analytics event tracking | todo |

## P1 - Product Quality

| Item | Status |
|---|---|
| Push notification untuk status batch | todo |
| Retry upload bila koneksi gagal | todo |
| Better filter dan search history | todo |
| Supplier reputation breakdown | todo |
| PVP history screen | todo |

---

## P2 - Growth Features

| Item | Status |
|---|---|
| Marketplace listing flow | todo |
| Lending / collateral flow | todo |
| CO2 impact metrics | todo |
| Multi-role switch dalam satu app | todo |
| Enterprise dashboard handoff | todo |

---

## Delivery Phases

### Phase 1 - In Progress

- done home supplier dashboard
- done design system + dark/light mode
- done auth mock
- todo register batch
- done history
- done batch detail

### Phase 2

- todo pvp flow
- done wallet
- done profile
- todo persisted draft

### Phase 3

- todo backend integration
- todo storage upload
- todo notifications
- todo observability

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
