/**
 * Colour helpers for the Verdana theme. See brand.md at the workspace root.
 *
 * Use these instead of writing 8-digit hex literals like `#f59e0b30` inline —
 * those bake in a colour that can't follow the theme.
 */

/** Apply an alpha (0–1) to a `#rgb` / `#rrggbb` token value. */
export function withAlpha(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  let hex = color.trim().replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((ch) => ch + ch).join("");
  if (hex.length === 8) hex = hex.slice(0, 6);
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return color;
  const suffix = Math.round(a * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${hex}${suffix}`;
}

/** Conventional alpha steps, so tints stay consistent across screens. */
export const Alpha = {
  faint: 0.05,
  subtle: 0.1,
  soft: 0.18,
  medium: 0.3,
  strong: 0.45,
} as const;
