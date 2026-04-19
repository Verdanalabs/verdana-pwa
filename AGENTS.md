# AGENTS.md

## Purpose

This project is an Expo Router app with supplier and PVP operational flows.

The codebase was refactored to be:

- maintainable
- scalable
- readable
- feature-oriented

When adding or changing code, preserve that structure. Do not drift back to fat route files, duplicated theme systems, or mixed ownership.

## Core Rules

1. Keep `app/` route-only.
2. Put screen implementations in `src/features/*`.
3. Put shared UI, theme, navigation, and platform helpers in `src/shared/*`.
4. Put app-wide provider composition in `src/providers/*`.
5. Scope state to the smallest area that needs it.
6. Prefer small, local changes over broad rewrites.
7. Preserve existing route paths and UI behavior unless the task explicitly changes them.

## Folder Ownership

### `app/`

Use `app/` only for:

- Expo Router route files
- route groups
- layouts
- redirects
- modal declarations

Route files should stay thin.

Good:

```tsx
export { default } from '@/src/features/wallet/screens/WalletScreen';
```

Bad:

- large JSX screens in `app/`
- feature logic in `app/`
- screen-local styles in `app/`
- direct mock/data shaping in `app/`

### `src/features/`

Use `src/features/<feature>/` for product code that belongs to one domain or flow.

Current features:

- `app`
- `auth`
- `batch`
- `history`
- `profile`
- `pvp`
- `supplier-home`
- `wallet`

Within a feature, colocate the code that changes together.

Typical layout:

```text
src/features/<feature>/
  screens/
  components/
  state/
  hooks/
```

Do not create folders just because they are common in other projects. Add `components`, `hooks`, or `state` only when the feature actually needs them.

### `src/shared/`

Use `src/shared/` for code reused across multiple features.

Current shared areas:

- `navigation`
- `platform`
- `theme`
- `ui`

If a component is only used by one feature, keep it inside that feature.

### `src/providers/`

App-wide providers are composed in `src/providers/AppProviders.tsx`.

Only true app-wide concerns belong there.

Current app-wide concerns:

- theme
- supplier auth
- PVP auth

Feature flow state should not be moved into app providers without a real cross-app need.

## State Rules

Use the smallest reasonable scope.

- local `useState` for screen-local UI state
- feature context/provider for multi-screen feature flows
- app provider only for true global state

Important existing rule:

- `BatchDraftProvider` is intentionally scoped to `app/batch/_layout.tsx`

Do not move batch draft state back to the root layout.

If you add a new multi-step flow, follow the same pattern:

- create feature-local state in `src/features/<flow>/state`
- mount the provider in the flow layout, not the app root

## Theme Rules

There is one active theme system.

Use:

- `@/src/shared/theme/theme-context`
- `@/src/shared/theme/tokens`
- `@/src/shared/theme/typography`

Do not reintroduce:

- `constants/colors.ts`
- `constants/theme.ts`
- old themed wrapper components

When styling:

- use semantic theme tokens from `useThemeColors()`
- keep typography from `Font` and `FontSize`
- avoid creating a second token system

Hardcoded colors are acceptable only when they are truly intentional and very local, such as a single status accent that is not part of the shared token set. Default to theme tokens first.

## Import Rules

Use the `@/*` alias.

Prefer explicit project imports from `src`, for example:

- `@/src/features/auth/state/auth-context`
- `@/src/shared/ui/PrimaryButton`

Top-level legacy files like `store/*`, `constants/*`, and some old component paths currently exist only as compatibility re-exports.

Rules:

- do not use legacy re-export paths for new code
- import from the real `src/...` location for new work
- if touching older code, prefer migrating imports toward `src/...`

## Feature Boundary Rules

- features may import from `src/shared/*`
- features may import from their own local files
- features should not casually import implementation details from other features

Allowed cross-feature usage should be rare and obvious.

If two features need the same thing, move it to `src/shared/*` instead of making one feature depend on another feature's internals.

## Screens and Components

Prefer this split:

- route file in `app/`
- screen in `src/features/.../screens`
- local section components in `src/features/.../components`
- shared primitives in `src/shared/ui`

Do not split components too aggressively.

Good split:

- `WalletScreen`
- `AssetFilterChip`
- `AssetStatusPill`

Bad split:

- tiny one-line wrapper components with no reuse or clarity benefit

## Expo Router Rules

- preserve route paths unless the task explicitly changes routing
- keep layout guards in layouts
- keep flow-specific providers in flow layouts
- keep modal presentation decisions in route layouts or route declarations

Current important layouts:

- `app/_layout.tsx`: root shell, fonts, platform gate, global stack
- `app/batch/_layout.tsx`: batch flow provider scope
- auth and tab layouts: redirect/guard behavior

Be careful when changing any layout because it can affect multiple flows.

## Data and Mocks

Current data is still mock-backed in places.

Rules:

- do not shape mock data inside route files
- keep mock-backed screen logic inside features
- if introducing an API later, hide that behind feature hooks or services instead of wiring network calls directly into route files

If you add new mock data, keep it consistent with existing domain types.

## Type Safety

This repo uses strict TypeScript.

Before finishing work:

- avoid `any`
- prefer explicit unions and domain types
- align mock objects with `types/*`
- handle nullable route and data values carefully

## Verification

For code changes, run:

```bash
npm run lint
npx tsc --noEmit
```

If you add or change runtime dependencies, update the lockfile properly with `npm install`.

If a flow is touched, also sanity-check the impacted route behavior.

High-risk areas in this project:

- auth redirects
- PVP state transitions
- batch multi-step draft flow
- wallet detail to batch detail linking
- desktop/mobile platform gating

## What Not To Do

- do not put large screens back in `app/`
- do not create a second theme system
- do not move feature flow state to the app root without a strong reason
- do not add generic top-level folders when the code belongs to a feature
- do not import from legacy compatibility files for new code
- do not rewrite working UI just to satisfy a structural cleanup

## Preferred Development Workflow

When adding a feature:

1. Identify the owning feature.
2. Add or update the screen in `src/features/<feature>/screens`.
3. Add local feature components next to it if needed.
4. Add shared primitives only if at least two features need them.
5. Keep `app/` as a thin wrapper.
6. Keep state scoped appropriately.
7. Verify with lint and type-check.

## In Doubt

When choosing between two valid implementations:

- choose the smaller change
- choose the feature-local placement
- choose the clearer ownership boundary
- choose readability over abstraction

The project should feel boring to navigate: predictable folders, predictable ownership, predictable imports.
