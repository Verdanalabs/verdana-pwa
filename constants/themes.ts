import { BatchStatus } from '@/types';

export type ThemeMode = 'dark' | 'light';

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

  // ── Accent (lime) ──
  accent: string;
  accentStrong: string;
  accentContrast: string;   // text on accent bg

  // ── CTA / Hero card ──
  ctaBg: string;            // fallback solid (used for avatar, etc.)
  ctaFg: string;
  ctaMuted: string;
  ctaBorder: string;
  ctaShadow: string;

  // ── Hero gradient ──
  heroGradient: [string, string, string];   // 3-stop gradient
  heroAccentNumber: string;                 // color for big metric number
  heroGlowColor: string;                    // subtle radial glow tint
  heroBeamColor: string;                    // diagonal beam overlay

  // ── Status badges ──
  statusBg: Record<BatchStatus, string>;
  statusFg: Record<BatchStatus, string>;

  // ── Misc ──
  white: string;
  black: string;
  error: string;
  warning: string;
  info: string;
  shadowColor: string;
}

// ────────────────────────────────────────────────
//  DARK  (default)
// ────────────────────────────────────────────────
export const DarkColors: ThemeColors = {
  background:         '#070e07',
  backgroundElevated: '#081117',
  backgroundSoft:     '#0d160d',
  surface:            '#0d160d',
  surfaceStrong:      '#101b10',

  border:             '#1a2e1a',
  borderStrong:       '#294229',

  foreground:         '#ffffff',
  textSecondary:      '#cfd6cf',
  textMuted:          '#8f9790',
  textFaint:          '#5f6b63',

  accent:             '#b5f23d',
  accentStrong:       '#c8f542',
  accentContrast:     '#070e07',

  // Hero card (avatar fallback)
  ctaBg:    '#b5f23d',
  ctaFg:    '#ffffff',
  ctaMuted: 'rgba(255,255,255,0.55)',
  ctaBorder:'rgba(181, 242, 61, 0.18)',
  ctaShadow:'rgba(0,0,0,0.6)',

  // Hero gradient — turunan dari surface & background yang sudah ada
  heroGradient:      ['#182e18', '#0d160d', '#070e07'] as [string, string, string],
  heroAccentNumber:  '#b5f23d',
  heroGlowColor:     'rgba(181,242,61,0.06)',
  heroBeamColor:     'rgba(181,242,61,0.03)',

  statusBg: {
    draft:              '#1a2e1a',
    submitted:          '#0c1f3a',
    transit:            '#2a1f08',
    pending_validation: '#1a2e1a',
    verified:           '#0c2a1f',
    minting:            '#162a10',
    minted:             '#b5f23d',
    listed:             '#1f1040',
    collateral:         '#2a1500',
    rejected:           '#2a0808',
  },
  statusFg: {
    draft:              '#8f9790',
    submitted:          '#60a5fa',
    transit:            '#fbbf24',
    pending_validation: '#cfd6cf',
    verified:           '#34d399',
    minting:            '#b5f23d',
    minted:             '#070e07',
    listed:             '#c4b5fd',
    collateral:         '#fb923c',
    rejected:           '#f87171',
  },

  white:       '#ffffff',
  black:       '#000000',
  error:       '#f87171',
  warning:     '#fbbf24',
  info:        '#60a5fa',
  shadowColor: '#000000',
};

// ────────────────────────────────────────────────
//  LIGHT
// ────────────────────────────────────────────────
export const LightColors: ThemeColors = {
  background:         '#f2f7ed',
  backgroundElevated: '#e6f0da',
  backgroundSoft:     '#f7fbf2',
  surface:            '#f7fbf2',
  surfaceStrong:      '#ecf4e4',

  border:             '#cfe3bb',
  borderStrong:       '#b0cc98',

  foreground:         '#253d27',
  textSecondary:      '#426048',
  textMuted:          '#6e8072',
  textFaint:          '#98a99e',

  accent:             '#96cc2e',
  accentStrong:       '#a8de3a',
  accentContrast:     '#091406',

  // Hero card (avatar fallback)
  ctaBg:    '#1c3220',
  ctaFg:    '#f0f7ec',
  ctaMuted: 'rgba(240,247,236,0.65)',
  ctaBorder:'rgba(150,204,46,0.22)',
  ctaShadow:'rgba(28,50,32,0.20)',

  // Hero gradient — turunan dari ctaBg yang sudah ada
  heroGradient:      ['#243d28', '#1c3220', '#112518'] as [string, string, string],
  heroAccentNumber:  '#a8de3a',
  heroGlowColor:     'rgba(150,204,46,0.08)',
  heroBeamColor:     'rgba(150,204,46,0.04)',

  statusBg: {
    draft:              '#e8f0e0',
    submitted:          '#dbeafe',
    transit:            '#fef3c7',
    pending_validation: '#ecf4e4',
    verified:           '#d1fae5',
    minting:            '#dcfce7',
    minted:             '#96cc2e',
    listed:             '#ede9fe',
    collateral:         '#ffedd5',
    rejected:           '#fee2e2',
  },
  statusFg: {
    draft:              '#6e8072',
    submitted:          '#1d4ed8',
    transit:            '#92400e',
    pending_validation: '#426048',
    verified:           '#065f46',
    minting:            '#166534',
    minted:             '#091406',
    listed:             '#5b21b6',
    collateral:         '#9a3412',
    rejected:           '#991b1b',
  },

  white:       '#ffffff',
  black:       '#000000',
  error:       '#ef4444',
  warning:     '#f59e0b',
  info:        '#3b82f6',
  shadowColor: '#253d27',
};
