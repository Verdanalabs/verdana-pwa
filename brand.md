# Verdana Brand & Design System

Single source of truth for the visual identity across `verdana-frontend`, `verdana-admin`, and `verdana-pwa`.
Derived from `Brandbook.pdf` (workspace root). Where the brandbook is silent, this document decides — and says so.

Every contrast figure below is measured (WCAG 2.1 relative luminance), not estimated. Re-verify with `scripts/check-contrast.mjs`.

---

## 1. Palette

### Brandbook colours

| Name | Hex | Role |
|---|---|---|
| Lush White | `#FDFFFD` | page canvas (light) |
| Neon | `#85F23D` | accent — **fills only in light mode** |
| Lush Green | `#203D0D` | elevated surface (dark), accent text (light) |
| Dark Green | `#152D07` | page canvas (dark), primary text (light) |

### Observed in the brandbook but unlabelled — adopted

| Name | Hex | Role |
|---|---|---|
| Paper | `#F1FEE1` | text on dark green surfaces |
| Neon Bright | `#B5F23D` | hover, glow, large display type on dark |

The brandbook's swatch page labels Neon `#85F23D`; its own display type renders `#B5F23D`. **`#85F23D` is canonical.** `#B5F23D` survives as `--accent-strong`.

---

## 2. The rule that governs everything

> **Neon is never text on a light background.**

| Pairing | Ratio | |
|---|---|---|
| Neon on Lush White | **1.42:1** | unusable |
| Neon on Dark Green | 10.47:1 | excellent |
| Neon on Lush Green | 8.51:1 | excellent |
| Dark Green **on** Neon | 10.47:1 | excellent — this is the CTA |

There is no single neon that works as text on both grounds. Darkening it until it passes on white (`#358500`, 4.64:1) kills the hue and then fails on dark (3.20:1). So the accent splits into three tokens:

| Token | Light | Dark | Use |
|---|---|---|---|
| `--accent` | `#85F23D` | `#85F23D` | fills, bars, dots, chart marks, focus rings |
| `--accent-contrast` | `#152D07` | `#152D07` | the label **on top of** an accent fill |
| `--accent-ink` | `#203D0D` | `#85F23D` | accent-*coloured text* |

**The signature CTA is a neon pill with a dark green label.** Not neon text.

Never write `--primary: #85F23D` into a shadcn-style scale. It makes every button label and every accent-coloured string unreadable in light mode.

---

## 3. Tokens

Light is the **default** (`:root`). Dark is opt-in via `html[data-theme="dark"]`.

### Light

| Token | Value | Contrast on bg |
|---|---|---|
| `--background` | `#FDFFFD` | — |
| `--background-elevated` | `#F1FEE1` | — |
| `--surface` | `#FFFFFF` | — |
| `--surface-strong` | `#F1FEE1` | — |
| `--foreground` | `#152D07` | 14.82:1 |
| `--text-secondary` | `#203D0D` | 12.05:1 |
| `--text-muted` | `#66765D` | 4.84:1 (AA) |
| `--text-faint` | `#84927D` | 3.27:1 — large text / non-text only |
| `--border` | `#DDE2DB` | — |
| `--border-strong` | `#B3BCAE` | — |
| `--accent` | `#85F23D` | fills only |
| `--accent-strong` | `#B5F23D` | hover / glow |
| `--accent-contrast` | `#152D07` | 10.47:1 on accent |
| `--accent-ink` | `#203D0D` | 12.05:1 |
| `--panel-bg` | `#152D07` | the signature panel |
| `--panel-fg` | `#F1FEE1` | 14.18:1 on panel |

### Dark

| Token | Value | Contrast on bg |
|---|---|---|
| `--background` | `#152D07` | — |
| `--background-elevated` | `#203D0D` | — |
| `--surface` | `#203D0D` | — |
| `--surface-strong` | `#2F4621` | — |
| `--foreground` | `#F1FEE1` | 14.18:1 |
| `--text-secondary` | `#C5D4B5` | 9.54:1 |
| `--text-muted` | `#A4B595` | 6.82:1 (AA) |
| `--text-faint` | `#8EA07F` | 5.31:1 |
| `--border` | `#2F4621` | — |
| `--border-strong` | `#415733` | — |
| `--accent` | `#85F23D` | 10.47:1 — usable as text here |
| `--accent-strong` | `#B5F23D` | 11.16:1 |
| `--accent-contrast` | `#152D07` | — |
| `--accent-ink` | `#85F23D` | 10.47:1 |
| `--panel-bg` | `#203D0D` | — |
| `--panel-fg` | `#F1FEE1` | 11.53:1 |

The light ramp is Dark Green mixed toward Lush White; the dark ramp is Dark Green mixed toward Paper. Both stay in the brand hue rather than drifting to neutral grey.

Ratios above are quoted against `--background`, but every text token is verified against **all three** surface levels. That matters in dark mode: `--surface-strong` is the lightest ground, so a value that passes on the page background can still fail on an elevated card. The dark muted/faint values are set from that constraint, not from the page background.

---

## 3a. The mark

**Source of truth: `verdana-frontend/public/logo.png`.** Every favicon, app icon
and in-app mark derives from it via `scripts/build-favicons.py`.

**Never re-trace it into SVG paths.** That was tried and the traced outline was
visibly not the mark: the slab read blockier, the blade geometry differed, and
the `currentColor` variant collapsed the duotone gradient into one flat colour,
which renders as a plain dark square at small sizes. The traced files have been
deleted; do not reintroduce them.

The mark carries its own dark-green-to-lime gradient on a transparent
background, so it sits correctly on both the light canvas and the dark green
panel with no recolouring. Use `logo.png` for in-app marks. `icon-192.png` and
`icon-512.png` bake in a white tile and belong only in favicons and launcher
icons, never on the dark panel.

## 3b. Notice cards

An alert, warning or confirmation card uses the **`toneBg` / `toneFg` pair**,
never a low-alpha tint of the raw tone.

Tinting the tone against its own colour is the obvious construction and it
fails: a 10% wash *lightens* the ground in dark mode, and `--danger` `#FF6B6B`
on that ground measures **3.89:1**, under AA. The tone pairs are designed
together and clear AA on all three surface levels.

In the PWA this is `src/shared/ui/NoticeCard.tsx`. The contrast gate asserts the
tone pairs and the tinted grounds that remain in use.

## 4. Semantic & data-viz

**Not in the brandbook.** Defined here because the product needs them.

A green-dominant brand cannot use green for "success" without colliding with the accent — success is a desaturated forest green, clearly distinct from Neon. All values ≥4.5:1 as text on their own ground.

| Role | Light (on `#FDFFFD`) | Dark (on `#152D07`) |
|---|---|---|
| `--danger` | `#A4262C` (7.23:1) | `#FF6B6B` (5.37:1) |
| `--warning` | `#8A5A00` (5.90:1) | `#FFC94D` (9.72:1) |
| `--info` | `#155E75` (7.23:1) | `#74D7FF` (9.15:1) |
| `--success` | `#1E6B2E` (6.54:1) | `#5FD98A` (8.35:1) |

**Status is never signalled by colour alone.** Every status carries an icon and a text label. This is both an accessibility requirement and an existing project rule (`verdana-pwa/docs/03-ui-rules.md`).

### Chart series

Hue-separated and colour-blind safe, neon first:

```
1  #85F23D   accent
2  #155E75 / #74D7FF   (light / dark)
3  #8A5A00 / #FFC94D
4  #A4262C / #FF6B6B
5  #1E6B2E / #5FD98A
6  #B3BCAE / #718563
```

---

## 5. Typography

| Role | Face | Notes |
|---|---|---|
| Display | **DM Serif Display, italic 400** | always italic — the brandbook uses no upright serif |
| Body / UI | **Hanken Grotesk** 400/500/600/700 | freely licensed; stands in for the brandbook's commercial HK Grotesk |

Display type in the brandbook runs 10–13% of viewport height, frequently split across two lines with a thin horizontal rule between them. Reserve that scale for hero and section openers; do not use italic serif for UI labels or data.

Radius scale, anchored on the brandbook panel:

```
--radius-panel  2rem     the signature dark green panel
--radius-card   1rem
--radius-pill   999px
```

---

## 6. Layout motifs

- **The panel.** A Dark Green rounded rectangle (`--radius-panel`) floating on a pale canvas is the brand's primary compositional device. Use it for heroes, CTAs, and feature groupings.
- **Whitespace as a feature.** The brandbook states this explicitly. Prefer removing an element over shrinking it.
- **Photography breaks the frame.** Botanical imagery overlaps and escapes the panel edge rather than sitting inside it.
- **The rule.** A thin horizontal line between stacked display words is a recurring brandbook device.
- **Texture.** The light canvas carries a faint organic texture, not flat white.

---

## 7. Voice

From the brandbook's Core Philosophy:

- **The Elegance of the Essential** — trim the excess; the visual language carries no dead weight.
- **Rooted in Reality** — push decentralised technology, stay anchored in real-world utility.
- **Illuminating the Complex** — telemetry and market data are vast and chaotic; design brings clarity, prioritising readability and human focus over decorative clutter.

Tone: direct, confident, precise. No fluff.

---

## 8. Do / Don't

| Don't | Do |
|---|---|
| Neon text on a light background | Neon fill with a `--accent-contrast` label |
| `--primary: #85F23D` in a generic colour scale | the three-token accent split |
| Near-black `#070e07` as the dark ground | Dark Green `#152D07` |
| Hardcode a hex in a component | reference a token |
| Signal status with colour alone | icon + label + colour |
| Upright DM Serif Display | italic only |
| Green for "success" that reads as the accent | `--success`, visibly distinct from Neon |

---

## 9. Where these live

| Repo | File |
|---|---|
| `verdana-frontend` | `src/app/globals.css` |
| `verdana-admin` | `src/app/globals.css` |
| `verdana-pwa` | `src/shared/theme/tokens.ts` |

All three already share the token *vocabulary* (`--background`, `--surface`, `--accent`, …), so applying this document is a value swap, not a rename.

Verify with `scripts/check-contrast.mjs`. Any hex outside these three files is a defect.
