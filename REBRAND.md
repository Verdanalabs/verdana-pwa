# Verdana Brandbook Rollout — Status & Backlog

Rebranding `verdana-frontend`, `verdana-admin`, and `verdana-pwa` to the identity in
`Brandbook.pdf`. Design system: [`brand.md`](brand.md). Gate: `node scripts/check-contrast.mjs`.

**Last verified:** 161 contrast checks, 0 failures · all three repos typecheck and lint clean ·
`core-api` builds, vets clean, 8/8 CORS tests pass.

---

## 1. Decisions locked

| # | Decision | Rationale |
|---|---|---|
| 1 | **Light is the default theme** everywhere | The brandbook is light-first: Lush White canvas, Dark Green panels, "whitespace as a feature" |
| 2 | **`#85F23D` is canonical Neon**; `#B5F23D` becomes `--accent-strong` | The swatch page labels `#85F23D`; the brandbook's own display type renders `#B5F23D`. Both survive, with distinct roles |
| 3 | **Hanken Grotesk** replaces Space Grotesk | The brandbook's HK Grotesk is commercial; Hanken is the freely-licensed sibling. DM Serif Display already matched |
| 4 | `verdana-frontend` reset to `origin/main` | User-confirmed; 10 unpushed commits preserved under tag `archive/editorial-redesign` |
| 5 | PWA `white`/`black` resolve to Lush White / Dark Green | So `c.white` is brand-correct wherever it appears |

---

## 2. The rule that shaped the architecture

**Neon `#85F23D` measures 1.42:1 on the light canvas.** It can never be text there,
and no darkened variant works on both grounds (`#358500` reaches 4.64:1 on white but
falls to 3.20:1 on dark). So the accent is three tokens, not one:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--accent` | `#85F23D` | `#85F23D` | fills, bars, dots, chart marks |
| `--accent-contrast` | `#152D07` | `#152D07` | the label **on** an accent fill |
| `--accent-ink` | `#203D0D` | `#85F23D` | accent-*coloured text*, focus rings, interactive borders |

Always-dark surfaces carry `data-panel` (web) — the tokens re-point to their on-dark
values, including `--accent-ink` → Neon.

---

## 3. What changed

### Foundation (new files)

| File | Purpose |
|---|---|
| `brand.md` | Single source of truth — palette, the neon rule, both token sets, semantics, motifs, voice |
| `scripts/check-contrast.mjs` | Reads live tokens from all three repos; asserts AA and the accent invariant |
| `scripts/build-brand-assets.py` | Rasterises 12 icon sizes from the mark |
| `assets/brand/verdana-mark.svg` | The V mark, traced from the brandbook (`currentColor`) |
| `assets/brand/verdana-mark-duotone.svg` | Gradient variant for dark surfaces |

### verdana-admin

- `globals.css` — full token rewrite; light on `:root`, dark on `[data-theme="dark"]`
- **Zinc ramp inverted** — the legacy panels are authored for dark surfaces, so light (now default) carries the inverted ramp. Steps 400–600 raised to clear AA
- New primitives: `Card`, `Tabs` (with `role="tab"`), `Tone` (Alert/Badge/ToneButton), `VerdanaMark`
- ~63 raw `emerald`/`amber`/`red` utilities → semantic tokens
- `CHART_COLORS` → theme-aware `--chart-1..6`
- DM Serif Display italic on all page and panel headings (was loaded but unused)
- `/` boilerplate route → redirect to `/admin`; Next/Vercel SVGs deleted; `icon.svg` + `apple-icon.png` added

### verdana-frontend

- Reset to `origin/main`; merge conflict resolved
- `globals.css` — token rewrite + `[data-panel]` scoping block
- `lib/theme.ts` — shared theme helper (init script, toggle, and sync were duplicating logic)
- Hero marked `data-panel`; `bg-black/55` → brand green overlay
- `BetaWaitlistPage` tokenised — it hardcoded `#070e07` + white and ignored the theme entirely
- Navbar logo → inline `VerdanaMark` SVG (was a PNG)
- Deleted `Globe.tsx`, `ui/world-map.tsx` (never imported) and the `cobe` dependency

### verdana-pwa

- `tokens.ts` — full rewrite, plus new records: `materialBg/Fg`, `toneBg/Fg`, `fabGradient`
- **3 material colour systems → 1**; **5 status colour systems → 2** (`statusBg/Fg` + `toneBg/Fg`)
- `color.ts` — `withAlpha()` helper replacing baked 8-digit hex like `#f59e0b30`
- Font loaded on **every** platform (see bug 1 below)
- `app.json`, `app-variant.ts`, `configure-web-build.mjs`, `manifest.webmanifest` — brand colours; splash/adaptive-icon backgrounds fixed
- All app icons regenerated from the mark; Expo template leftovers deleted

### Docs

`verdana-frontend/AGENTS.md`, `verdana-admin/AGENTS.md`, `verdana-pwa/docs/03-ui-rules.md`
now point at `brand.md` and explicitly flag their superseded claims.

---

## 4. Bugs found and fixed

| # | Bug | Where |
|---|---|---|
| 1 | **Both PWA web variants rendered in the browser default sans.** `useFonts({})` on web relied on a Google Fonts link for family `Space Grotesk`, but components asked for `SpaceGrotesk_400Regular` — a name that link never defines | `verdana-pwa/app/_layout.tsx` |
| 2 | **Outline button was neon-on-white at 1.42:1** — the exact violation the brand rule predicts; made the error-state "Retry" nearly invisible | `verdana-admin/.../ui/Button.tsx` |
| 3 | **PWA light mode failed AA** — muted 3.87:1, faint 2.27:1 | `verdana-pwa/.../tokens.ts` |
| 4 | **PWA dark avatar was white-on-lime at 1.33:1** | `verdana-pwa/.../tokens.ts` |
| 5 | Dark `--text-muted` (4.31:1) and `--text-faint` (2.59:1) failed on cards — passing only against the page background | all three repos |
| 6 | Both zinc ramps' 400–600 steps too low-contrast for the muted text they carry (dark `z-600` was 1.80:1) | `verdana-admin/globals.css` |
| 7 | `--text-faint` used for real stat labels and input placeholders, not decoration | `verdana-admin` |
| 8 | Accent used as table text in three cells | `.../analytics/PerformanceTables.tsx` |
| 9 | Focus rings and hover borders used raw accent — fails 1.4.11 non-text contrast at 1.42:1 | `verdana-admin` |
| 10 | Admin dark danger `#f2545b` measured 4.39:1, just under AA | `verdana-admin/globals.css` |
| 11 | PWA app icons were an unrelated "A" glyph | `verdana-pwa/public/icon-*.svg` |
| 12 | `adaptiveIcon.backgroundColor` was `#E6F4FE` — stale Expo-template blue | `verdana-pwa/app.json` |
| 13 | `userInterfaceStyle: "automatic"` contradicted the hardcoded light default | `verdana-pwa/app.json` |
| 14 | Two `setState`-in-effect lint errors (pre-existing, failed the lint gate) | `RouteLoader.tsx`, `BetaWaitlistPage.tsx` |
| 15 | Stray hardcoded chart fill | `.../analytics/MaterialCharts.tsx` |
| 16 | **`core-api` CORS blocked every browser request when more than one origin was configured.** `AllowedOrigins: []string{raw}` wrapped the whole env string as a single origin. Now split on commas, with an empty value denying rather than falling back to `*`. Covered by `router_cors_test.go` | [`internal/http/router.go`](core-api/internal/http/router.go) |
| 17 | **Regression I introduced: the logo rendered flat dark green.** I had replaced the gradient `logo.png` with an SVG using `fill="currentColor"`, which collapses the two-tone mark to a single foreground colour. Reverted to the original asset; the SVG now carries the real sampled gradient and is never rendered with `currentColor` | `Navbar.tsx`, `ui/VerdanaMark.tsx` |
| 18 | **Regression I introduced: the hero photo was tinted green.** I had swapped the neutral `bg-black/55` overlay for a brand-green wash, which cast the photography. Reverted — the brandbook never asked for it | `HeroSection.tsx` |
| 19 | **Regression I introduced: "Get started" was white-on-Neon at 1.42:1.** My literal sweep turned `'#fff'` into `c.white`, but a label on a Neon fill must be `accentContrast`. Caught by running the app | `WelcomeScreen.tsx` |
| 20 | **`textFaint` failed AA wherever it was used as real text** (3.27:1 light). In this codebase it is *always* real text — 33 sites — so "decorative only" was a fiction. All three text levels now clear AA on every surface; dark `surfaceStrong` darkened to `#27391B` for headroom | all three repos |
| 21 | **49 accent-coloured icons were Neon on light surfaces** (1.42:1, fails 1.4.11's 3:1 for meaningful non-text). Swapped to `accentInk` in the 27 files that only ever render on a light ground | `verdana-pwa` |

### Bugs in my own tooling (fixed)

- The contrast gate matched the selector name inside a **comment**, silently validating `:root` twice instead of the dark block.
- It checked text only against `--background`, hiding every failure on cards — which is where muted text actually lives. Expanded to all surface levels (61 → 137 checks).
- Its TS parser read **nested** records, so `toneFg.accent` shadowed the top-level `accent`.

---

## 5. Found but NOT fixed — needs your call

| # | Issue | Why it's left |
|---|---|---|
| ~~A~~ | ~~`core-api` CORS broken for multiple origins~~ | ✅ **Fixed** — see bug 16. Verified end-to-end: both `:3000` and `:3001` allowed, unknown origin blocked |
| B | **`ADMIN_CONTACT_EMAIL` missing from `core-api/.env`** — the API won't boot without it | Env/secrets, your call |
| C | **Terminology mapping** — `03-ui-rules.md` mandates `PVP → Drop-off Point`, `cNFT → Asset`, `Minting → Processing…`, `Rejected → Not Accepted`. Admin violates all four | Product decision, not design. Confirm whether it applies to the internal ops tool |
| D | **PWA theme is not persisted** and doesn't follow the OS — `useState('light')`, no storage | Needs a storage dependency; you asked to be consulted before installs |
| E | **`WalletScreen.tsx` (682 lines) is unrouted** — the wallet tab renders `MarketplaceScreen` | Delete or wire up; I didn't want to silently reskin dead code |
| F | `app/inventory/_layout.tsx` has **no variant guard** while every sibling group has one | Pre-existing routing leak; a functional change |

---

## 6. Backlog status

### E0 — Foundation ✅ complete

| ID | Task | Status |
|---|---|---|
| F-1 | Reset frontend to `origin/main` | ✅ (tag `archive/editorial-redesign`) |
| F-2 | Write `brand.md` | ✅ |
| F-3 | V mark as SVG + icon export | ✅ |
| F-4 | Port token spec to all three repos | ✅ |
| F-5 | Hanken Grotesk swap | ✅ |
| F-6 | Contrast gate | ✅ 137 checks |

### E1 — verdana-frontend ✅ complete

| ID | Task | Status |
|---|---|---|
| FE-1 | Invert theme blocks, fix init script + toggle | ✅ |
| FE-2 | Navbar | ✅ mark SVG, neon CTA |
| FE-3 | HeroSection | ✅ `data-panel`, brand overlay |
| FE-4 | Product / HowItWorks / About | ✅ tokens |
| FE-5 | CTASection + Footer | ✅ `--cta-*` → panel tokens |
| FE-6 | BetaWaitlistPage | ✅ fully tokenised |
| FE-7 | BeamsBackground | ✅ |
| FE-8 | Loaders | ✅ |
| FE-9 | Delete dead code + `cobe` | ✅ |
| FE-10 | Logo / favicon | ✅ |

Verified: **0 contrast failures**, light and dark.

### E2 — verdana-admin ✅ complete

| ID | Task | Status |
|---|---|---|
| AD-1 | Zinc ramp inversion | ✅ verified both directions |
| AD-2 | Non-aliased status colours | ✅ 0 remaining |
| AD-3 | Chart palette | ✅ theme-aware |
| AD-4 | ChartCard shadow | ✅ |
| AD-5 | Input / Field | ✅ + `className` passthrough |
| AD-6 | Card / Badge / Tabs primitives | ✅ |
| AD-7 | Display type | ✅ 9 panels + headers |
| AD-8 | Retheme analytics + ops panels | ✅ |
| AD-9 | Remove boilerplate route | ✅ |
| AD-10 | Brand assets | ✅ |

Verified against live data: **0 contrast failures** across light/dark × Analytics/Operations.

### E3 / E4 — verdana-pwa 🟡 mostly complete

| ID | Task | Status |
|---|---|---|
| PW-1 | Rewrite `tokens.ts`, confirm light default | ✅ |
| PW-2 | Consolidate 3 material systems | ✅ → `materialBg/Fg` |
| PW-3 | Consolidate 5 status systems | ✅ → `statusBg/Fg` + `toneBg/Fg` |
| PW-4 | FAB gradients → tokens | ✅ |
| PW-5 | Sweep colour literals | ✅ **~232 → 6, all intentional** |
| PW-6 | Retheme shared UI | ✅ |
| PW-6b | Consolidate `TIER_CONFIG` (duplicated in 2 files) + `STATUS_CONFIG` | ✅ → `tierFg`, `statusFg` |
| PW-7 | Collector screens | 🟡 welcome + login verified light/dark; rest gated behind Privy |
| PW-8 | Decide `WalletScreen` | ⬜ see §5-E |
| PV-1..3 | PVP tabs / flows / grading | 🟡 login verified light/dark; rest gated behind Privy |
| PV-4 | Missing variant guard | ⬜ see §5-F |

**The literal sweep is finished.** The blocker was that module-scope constants and
`StyleSheet.create` blocks can't call `useThemeColors()`. Two patterns resolved it:

- **Always-dark surfaces** (camera viewfinder, hero cards that stay dark in both
  themes) import `DarkColors` directly — it's a plain object, so it works at module
  scope where hooks can't reach.
- **Alpha tints** like `#f59e0b30` became `withAlpha(c.warning, Alpha.medium)` via
  the new `shared/theme/color.ts`.

Two more duplicated colour systems surfaced and were consolidated on the way:
`STATUS_CONFIG` in `PvpLogScreen` (now derives from `statusFg`) and `TIER_CONFIG`,
which was **duplicated verbatim** in `SupplierAnalyticsScreen` and `DashboardMetrics`
(now `tierFg` in tokens, gate-checked against every surface).

**The 6 remaining literals are all intentional and named:**

| Location | Value | Why |
|---|---|---|
| `shared/config/app-variant.ts` | 4 | This *is* the manifest/theme-color source of truth |
| `shared/ui/CameraOverlay.tsx` | `VIEWFINDER_BACKDROP = '#000'` | True black behind the camera feed; a tinted backdrop casts the preview |
| `features/pvp/screens/PvpLoginScreen.tsx` | `WHATSAPP_BRAND_GREEN` | Third-party brand colour, deliberately not a Verdana token |

### E5 — Cross-cutting 🟡

| ID | Task | Status |
|---|---|---|
| X-1 | PWA icons + manifests + `app.json` | ✅ |
| X-2 | Variant config sync | ✅ |
| X-3 | Logo consolidation | ✅ regenerated from the mark |
| X-4 | Template leftovers | ✅ deleted |
| X-5 | Accessibility pass | 🟡 web ✅ gated; **native not audited** |
| X-6 | Reconcile stale docs | ✅ |
| X-7 | Terminology mapping | ⬜ see §5-C |

---

## 7. What still needs doing

1. **Verify the PWA's authenticated screens.** Both variants were run and audited,
   but only the **unauthenticated** screens are reachable — everything behind the
   tab bars gates on a real Privy session (email OTP / Google), which cannot be
   driven headlessly. Verified: desktop-blocked, collector welcome + login, PVP
   login, in light and dark. **Unverified: ~40 screens** — collector tabs, batch
   flow, wallet, inventory, and all PVP tabs and flows.

   Two things make that risk lower than it sounds: the contrast gate covers the
   token layer, and the same tokens drive every screen. But the two regressions
   found by *running* the app (bugs 19 and 21) were both invisible to static
   checks — so this is still real.

   ```
   EXPO_PUBLIC_APP_VARIANT=pvp npx expo start --web --port 8081 --clear
   ```

   Note: `--clear` is required when switching variants. Expo caches the web
   bundle and will otherwise keep serving the previous variant's config —
   `meta[name=application-name]` is the quickest way to confirm which one is live.

2. **PWA dark mode is only reachable from authenticated screens** — the toggle
   lives in `ProfileScreen` (collector) and `PvpFacilityScreen` (pvp). It is also
   not persisted and does not follow the OS. See §5-D.

3. ~~8 files mix light and dark grounds and still colour icons `c.accent`~~ —
   **done.** Resolved per-site (see §8).
2. **Decide §5 B–F** — none are blocking, but E (the 682-line unrouted `WalletScreen`)
   and F (missing variant guard) are functional issues, not cosmetic.
3. **Native a11y audit** — the contrast gate covers tokens, and the DOM scan covers web.
   React Native rendering is unverified.

---

## 8. Accent-on-surface pass (PWA)

The `--accent` split was applied to every remaining site in the PWA. Auditing the
8 "mixed ground" files turned up a larger problem than the 15 icons: my earlier
sweep matched only the JSX attribute form `color={c.accent}`, so it missed both
`color: c.accent` inside **style objects** and `tintColor=` (capital C).

| Category | Sites | Resolution |
|---|---|---|
| Icons in the 8 mixed files | 15 | → `accentInk` |
| `RefreshControl` tints elsewhere | 6 | → `accentInk` (missed: `tintColor` ≠ `color`) |
| `color: c.accent` in style objects | 47 | → `accentInk` |
| `borderColor: c.accent` | 9 | → `accentInk` |
| Stale `rgba(181,242,61,…)` — the **old** neon, hardcoded | 7 | → `withAlpha(c.accent, …)` |

**Deliberately left as Neon (5 sites):** the four QR viewfinder corners and the
verifying spinner in `PvpQrScanScreen`. They sit on a live camera feed, which is
a dark ground in *both* themes — `accentInk` would be wrong there. One of these
was a regression from the earlier sweep and has been restored.

### How each site's ground was determined

Only **four** components render a genuinely dark surface (`c.heroGradient`):
`SupplierAnalyticsScreen`, `PvpDashboardScreen`, `PvpPendingTabScreen` and
`HeroCard`. Every flagged site was checked against its enclosing container, and
none of the 47 text sites fell inside a hero — the eyebrows and metric rows that
*looked* hero-adjacent sit in the light page header or on `c.surface` cards. The
two that landed after a hero's opening tag (`SupplierAnalyticsScreen:406`,
`PvpDashboardScreen:356`) were confirmed to be after the `</LinearGradient>`
close, on `backgroundSoft` and a light section respectively.

### Why dark mode cannot regress from this

In the dark palette `accentInk` **is** `accent` (`#85f23d` — it is legible as
text on a dark ground at 10.47:1). Every `accent → accentInk` swap is therefore
a no-op in dark and only changes light. Verified live: both variants audit clean.

**Remaining, and intentional:** the WhatsApp icon (white on `#25D366`, 1.97:1) —
WhatsApp's own brand pairing, not a Verdana token.

### Verification commands

```bash
node scripts/check-contrast.mjs
```

```bash
npm --prefix verdana-admin run lint && npx --prefix verdana-admin tsc --noEmit
```

```bash
cd verdana-pwa && npm run lint && npx tsc --noEmit
```

### Note on browser QA

The Browser pane reports `document.visibilityState === "hidden"`, so CSS transitions
**freeze mid-flight** and `getComputedStyle` returns interpolated values. Any in-page
contrast scan must inject `transition: none !important` before measuring, or it will
report large numbers of phantom failures. Resolve `oklab()` colours through a probe
element too — Tailwind opacity utilities emit them and naive regex parsing breaks.
