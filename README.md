# Verdana PWA

Expo Router app for Verdana supplier and PVP operational flows.

## Commands

```bash
npm install
npm run start
npm run lint
npm run web
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
