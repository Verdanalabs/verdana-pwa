# Verdana Product Brief 06 - Feature Backlog

## Prioritization Rules

- `P0`: wajib untuk demo alur inti
- `P1`: penting setelah alur inti stabil
- `P2`: enhancement dan ekspansi

## P0 - Core Mobile MVP

- Supplier login mock
- Onboarding profile supplier
- Supplier home dashboard dengan mock data
- Register batch 4 step
- Camera capture dan retake
- GPS capture dan pilih PVP terdekat
- Submit batch dan success state
- History list dan filter dasar
- Batch detail dengan timeline
- PVP login mock
- PVP queue
- PVP validate batch
- Co-sign success flow
- Wallet summary dasar
- Profile screen dasar

## P0 - Technical Foundations

- Route structure `expo-router`
- Shared design tokens
- Domain types untuk batch, user, wallet, pvp
- Mock API layer
- Persisted batch draft
- Error state dan loading state standar

## P1 - Integration Readiness

- Privy integration
- Secure token storage
- Presigned photo upload
- Real Core API integration
- Mint status refresh
- Pull to refresh
- Empty, error, and offline states lengkap
- Analytics event tracking

## P1 - Product Quality

- Push notification untuk status batch
- Retry upload bila koneksi gagal
- Better filter dan search history
- Supplier reputation breakdown
- PVP history screen

## P2 - Growth Features

- Marketplace listing flow
- Lending / collateral flow
- CO2 impact metrics
- Multi-role switch dalam satu app
- Enterprise dashboard handoff

## Suggested Delivery Phases

### Phase 1

- auth mock
- home
- register batch
- history
- batch detail

### Phase 2

- pvp flow
- wallet
- profile
- persisted draft

### Phase 3

- backend integration
- storage upload
- notifications
- observability

## Dependencies

- camera flow bergantung pada permission handling
- submit batch bergantung pada upload contract
- wallet screen bergantung pada user bootstrap contract
- minting status bergantung pada backend status lifecycle yang konsisten

## Success Criteria

- Supplier bisa menyelesaikan registrasi batch end-to-end
- PVP bisa memvalidasi dan trigger minting status
- Semua state penting bisa divisualisasikan tanpa backend nyata terlebih dahulu
