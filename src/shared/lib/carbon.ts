/**
 * Carbon offset arithmetic for the dMRV logging flow.
 *
 * The factor is kg CO2e avoided per kg of waste diverted, sourced from
 * material_co2_factors. The server recomputes the same product when it builds
 * the token metadata, so this is a preview of a number that is decided
 * elsewhere — keep the rounding identical or the badge and the token disagree.
 */

/** Waste category keys as the API returns them, lowercase material_type. */
export type CarbonFactors = Record<string, number>;

export function computeOffsetKg(weightKg: number, factorKgPerKg: number): number {
  if (!Number.isFinite(weightKg) || !Number.isFinite(factorKgPerKg)) return 0;
  if (weightKg <= 0 || factorKgPerKg <= 0) return 0;
  return Math.round(weightKg * factorKgPerKg * 100) / 100;
}

/** Always two decimals — "6.50", never "6.5". */
export function formatOffsetKg(offsetKg: number): string {
  if (!Number.isFinite(offsetKg) || offsetKg < 0) return '0.00';
  return offsetKg.toFixed(2);
}

/**
 * Materials are uppercase in the app's own types (`PET`, `ORGANIC`) and
 * lowercase in the database enum, and the API returns codes outside the
 * MaterialType union. Lookup normalises rather than assuming.
 */
export function factorFor(factors: CarbonFactors, material: string | null | undefined): number | null {
  if (!material) return null;
  const key = material.trim().toLowerCase();
  const value = factors[key];
  return typeof value === 'number' && value > 0 ? value : null;
}
