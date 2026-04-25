# Verdana PWA

Expo Router app for Verdana supplier and PVP operational flows.

The repo now supports two separate web/PWA variants from the same codebase:

- `app.verdanaprotocol.com` for supplier/collector flows
- `pvp.verdanaprotocol.com` for PVP operator flows

## Commands

```bash
npm install
npm run start
npm run lint
npm run web
npm run build:web:app
npm run build:web:pvp
```

## Structure

```text
app/
  _layout.tsx
  index.tsx
  (auth)/
  (supplier-tabs)/
  (pvp-tabs)/
  batch/
  pvp/

src/
  providers/
  shared/
    navigation/
    platform/
    theme/
    ui/
  features/
    app/
    auth/
    batch/
    history/
    profile/
    pvp/
    supplier-home/
    wallet/
```

## Architecture Rules

- `app/` is routing only.
- Screen implementations live under `src/features`.
- Shared UI, theme, navigation, and platform helpers live under `src/shared`.
- App-wide providers are composed in `src/providers/AppProviders.tsx`.
- Batch draft state is scoped to `app/batch/_layout.tsx`, not the app root.
- Legacy top-level `store`, `constants`, and shared component files are compatibility re-exports where still needed.

## Feature Map

- `src/features/auth`: supplier auth and onboarding screens
- `src/features/supplier-home`: supplier dashboard home
- `src/features/history`: supplier batch history
- `src/features/wallet`: wallet list and asset detail
- `src/features/profile`: supplier profile
- `src/features/batch`: batch registration flow and batch detail
- `src/features/pvp`: PVP auth, onboarding, dashboard, queue, facility, and QR flow
- `src/features/app`: app-level supporting screens like modal and desktop-blocked

## Notes

- Route paths and current UI behavior are preserved during the refactor.
- `expo-location` is required for the PVP onboarding location capture flow.
- Lint is the current verification command for this repo.

## Variant Deployments

Build targets:

```bash
npm run build:web:app
npm run build:web:pvp
```

Deploy targets:

```bash
./deploy-app.sh
./deploy-app.sh --prod
./deploy-pvp.sh
./deploy-pvp.sh --prod
```

How it works:

- one Expo codebase
- one route tree with variant-aware access guards
- variant-specific provider stack
- variant-specific manifest and service worker generated into `dist/`
- two Cloudflare Pages projects, one per subdomain

Recommended env file layout:

- `./.env.app.staging`
- `./.env.app.production`
- `./.env.pvp.staging`
- `./.env.pvp.production`

Fallbacks:

- collector deploy falls back to `./.env.staging` or `./.env.production`
- PVP deploy also falls back to `./.env.staging` or `./.env.production`
