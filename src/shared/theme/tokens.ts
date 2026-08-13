import { BatchStatus } from '@/types';

/**
 * Verdana brand tokens — see brand.md at the workspace root.
 *
 * Light is the default theme. The one rule: Neon (`accent`, #85F23D) measures
 * 1.42:1 on Lush White, so it is a FILL colour and never text on a light
 * ground. Use `accentInk` for accent-coloured text and `accentContrast` for a
 * label sitting on top of a neon fill.
 */

export type ThemeMode = 'dark' | 'light';

/** Semantic tone shared by every status vocabulary in the app. */
export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'accent';

export interface ThemeColors {
  // ── Backgrounds ──
  background: string;
  backgroundElevated: string;
  backgroundSoft: string;
  surface: string;
  surfaceStrong: string;

  // ── Borders ──
  border: string;
  borderStrong: string;

  // ── Text ──
  foreground: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;

  // ── Accent (neon) ──
  accent: string;           // fills, bars, dots — never text on a light ground
  accentStrong: string;     // hover / glow / large display type
  accentContrast: string;   // label ON an accent fill
  accentInk: string;        // accent-COLOURED text

  // ── Panel: the signature dark green card ──
  panelBg: string;
  panelFg: string;

  // ── CTA / Hero card ──
  ctaBg: string;            // fallback solid (used for avatar, etc.)
  ctaFg: string;
  ctaMuted: string;
  ctaBorder: string;
  ctaShadow: string;

  // ── Hero gradient (stays dark in both themes — brandbook panel motif) ──
  heroGradient: [string, string, string];   // 3-stop gradient
  heroAccentNumber: string;                 // color for big metric number
  heroGlowColor: string;                    // subtle radial glow tint
  heroBeamColor: string;                    // diagonal beam overlay

  // ── Status badges (always paired with an icon + label, never colour alone) ──
  statusBg: Record<BatchStatus, string>;
  statusFg: Record<BatchStatus, string>;

  // ── Material chips. Keyed loosely because the API returns codes outside the
  //    MaterialType union (PVC, PS). Previously duplicated in three places:
  //    MaterialBadge, PvpBatchDetailScreen and PvpDashboardScreen.
  materialBg: Record<string, string>;
  materialFg: Record<string, string>;

  // ── Semantic tones. One colour system for the many status vocabularies
  //    (InventoryStatus, OrderStatus, …) that each used to ship their own
  //    DARK/LIGHT map. Map a status to a tone; never invent new colours.
  toneBg: Record<Tone, string>;
  toneFg: Record<Tone, string>;

  // ── Supplier reputation tiers. Was duplicated verbatim in
  //    SupplierAnalyticsScreen and DashboardMetrics.
  tierFg: Record<string, string>;

  // ── Center FAB gradient (was hardcoded in SupplierTabBar/PvpTabBar) ──
  fabGradient: [string, string, string];

  // ── Misc ──
  white: string;            // Lush White — the brand's white
  black: string;            // Dark Green — the brand's black
  error: string;
  warning: string;
  info: string;
  success: string;
  shadowColor: string;
}

// ────────────────────────────────────────────────
//  LIGHT  (default)
// ────────────────────────────────────────────────
export const LightColors: ThemeColors = {
  background:         '#fdfffd',
  backgroundElevated: '#f1fee1',
  backgroundSoft:     '#ffffff',
  surface:            '#ffffff',
  surfaceStrong:      '#f1fee1',

  border:             '#dde2db',
  borderStrong:       '#b3bcae',

  foreground:         '#152d07',
  textSecondary:      '#203d0d',
  textMuted:          '#485b3d',
  textFaint:          '#66765d',

  accent:             '#85f23d',
  accentStrong:       '#b5f23d',
  accentContrast:     '#152d07',
  accentInk:          '#203d0d',

  panelBg:            '#152d07',
  panelFg:            '#f1fee1',

  // Hero card (avatar fallback) — a panel
  ctaBg:    '#152d07',
  ctaFg:    '#f1fee1',
  ctaMuted: 'rgba(241,254,225,0.65)',
  ctaBorder:'rgba(133,242,61,0.22)',
  ctaShadow:'rgba(21,45,7,0.20)',

  // Hero gradient — the panel stays dark in light mode (brandbook motif)
  heroGradient:      ['#2f4621', '#203d0d', '#152d07'] as [string, string, string],
  heroAccentNumber:  '#85f23d',
  heroGlowColor:     'rgba(133,242,61,0.08)',
  heroBeamColor:     'rgba(133,242,61,0.04)',

  statusBg: {
    pending:            '#fdf3d6',
    accepted:           '#daeff5',
    pickup_dispatched:  '#e8f5f9',
    cosigning:          '#fbeccc',
    cosigned:           '#d9f0e0',
    mint_pending:       '#e8f7d4',
    mint_failed:        '#fbe0e1',
    minted:             '#85f23d',
  },
  statusFg: {
    pending:            '#8a5a00',
    accepted:           '#155e75',
    pickup_dispatched:  '#155e75',
    cosigning:          '#7a5210',
    cosigned:           '#1e6b2e',
    mint_pending:       '#3c6b13',
    mint_failed:        '#a4262c',
    minted:             '#152d07',
  },

  materialBg: {
    PET:     '#daeff5',
    HDPE:    '#d9f0e0',
    LDPE:    '#d5efec',
    PP:      '#fdf3d6',
    MIX:     '#e6e3f2',
    ORGANIC: '#ede7d3',
    PVC:     '#fbe0e1',
    PS:      '#e9e3f5',
  },
  materialFg: {
    PET:     '#155e75',
    HDPE:    '#1e6b2e',
    LDPE:    '#125b57',
    PP:      '#8a5a00',
    MIX:     '#4a3c8c',
    ORGANIC: '#6f4e00',
    PVC:     '#a4262c',
    PS:      '#5b3e9b',
  },

  toneBg: {
    neutral: '#f1fee1',
    info:    '#daeff5',
    warning: '#fdf3d6',
    success: '#d9f0e0',
    danger:  '#fbe0e1',
    accent:  '#85f23d',
  },
  toneFg: {
    neutral: '#203d0d',
    info:    '#155e75',
    warning: '#8a5a00',
    success: '#1e6b2e',
    danger:  '#a4262c',
    accent:  '#152d07',
  },

  tierFg: {
    starter:       '#6f4e00',
    active:        '#155e75',
    reliable:      '#203d0d',
    top_collector: '#125b57',
  },

  fabGradient: ['#b5f23d', '#85f23d', '#5fa828'] as [string, string, string],

  white:       '#fdfffd',
  black:       '#152d07',
  error:       '#a4262c',
  warning:     '#8a5a00',
  info:        '#155e75',
  success:     '#1e6b2e',
  shadowColor: '#152d07',
};

// ────────────────────────────────────────────────
//  DARK
// ────────────────────────────────────────────────
export const DarkColors: ThemeColors = {
  background:         '#152d07',
  backgroundElevated: '#203d0d',
  backgroundSoft:     '#203d0d',
  surface:            '#203d0d',
  surfaceStrong:      '#27391b',

  border:             '#2f4621',
  borderStrong:       '#415733',

  // Muted/faint clear AA on surfaceStrong (the lightest dark ground), not just
  // on background.
  foreground:         '#f1fee1',
  textSecondary:      '#c5d4b5',
  textMuted:          '#afbfa0',
  textFaint:          '#99aa8a',

  accent:             '#85f23d',
  accentStrong:       '#b5f23d',
  accentContrast:     '#152d07',
  accentInk:          '#85f23d',   // legible as text on this ground (10.47:1)

  panelBg:            '#203d0d',
  panelFg:            '#f1fee1',

  // Hero card (avatar fallback) — neon fill with a dark green label
  ctaBg:    '#85f23d',
  ctaFg:    '#152d07',
  ctaMuted: 'rgba(21,45,7,0.62)',
  ctaBorder:'rgba(133,242,61,0.18)',
  ctaShadow:'rgba(0,0,0,0.6)',

  heroGradient:      ['#2f4621', '#203d0d', '#152d07'] as [string, string, string],
  heroAccentNumber:  '#85f23d',
  heroGlowColor:     'rgba(133,242,61,0.06)',
  heroBeamColor:     'rgba(133,242,61,0.03)',

  statusBg: {
    pending:            '#3a2e08',
    accepted:           '#0e3038',
    pickup_dispatched:  '#0e3038',
    cosigning:          '#3a2e08',
    cosigned:           '#123322',
    mint_pending:       '#25400f',
    mint_failed:        '#3a1010',
    minted:             '#85f23d',
  },
  statusFg: {
    pending:            '#ffc94d',
    accepted:           '#74d7ff',
    pickup_dispatched:  '#a9e6ff',
    cosigning:          '#ffdb8a',
    cosigned:           '#5fd98a',
    mint_pending:       '#b5f23d',
    mint_failed:        '#ff6b6b',
    minted:             '#152d07',
  },

  materialBg: {
    PET:     '#0e3038',
    HDPE:    '#123322',
    LDPE:    '#0e3330',
    PP:      '#3a2e08',
    MIX:     '#241f3a',
    ORGANIC: '#33280e',
    PVC:     '#3a1010',
    PS:      '#2a1f3d',
  },
  materialFg: {
    PET:     '#74d7ff',
    HDPE:    '#5fd98a',
    LDPE:    '#5fd9ce',
    PP:      '#ffc94d',
    MIX:     '#b9a9ff',
    ORGANIC: '#e0be72',
    PVC:     '#ff6b6b',
    PS:      '#c4a9ff',
  },

  toneBg: {
    neutral: '#2f4621',
    info:    '#0e3038',
    warning: '#3a2e08',
    success: '#123322',
    danger:  '#3a1010',
    accent:  '#85f23d',
  },
  toneFg: {
    neutral: '#f1fee1',
    info:    '#74d7ff',
    warning: '#ffc94d',
    success: '#5fd98a',
    danger:  '#ff6b6b',
    accent:  '#152d07',
  },

  tierFg: {
    starter:       '#e0be72',
    active:        '#74d7ff',
    reliable:      '#85f23d',
    top_collector: '#5fd9ce',
  },

  fabGradient: ['#c8f542', '#85f23d', '#4a8f1e'] as [string, string, string],

  white:       '#fdfffd',
  black:       '#152d07',
  error:       '#ff6b6b',
  warning:     '#ffc94d',
  info:        '#74d7ff',
  success:     '#5fd98a',
  shadowColor: '#000000',
};
