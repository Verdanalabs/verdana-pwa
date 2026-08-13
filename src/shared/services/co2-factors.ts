import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '@/src/shared/services/api';
import type { CarbonFactors } from '@/src/shared/lib/carbon';

export interface Co2FactorRow {
  material: string;
  kg_co2e_per_kg: number;
  methodology?: string;
  updated_at: string;
}

interface Co2FactorsResponse {
  factors: Co2FactorRow[];
}

const CACHE_KEY = '@verdana:co2_factors';

/**
 * The dMRV LCA table, mirroring migrations 000033 and 000036 in
 * database-migrations. Every plastic carries one conservative factor.
 *
 * Bundled so an operator at a site with no signal still sees an offset estimate.
 * The figure of record is the one the server computes at metadata time, so a
 * stale bundle shows a slightly wrong preview rather than minting a wrong claim.
 * Sources: IPCC 2006 Guidelines Vol.5 (Waste), US EPA WARM, Verra AMS-III.F.
 */
export const DEFAULT_FACTORS: CarbonFactors = {
  organic: 0.65,
  pet: 1.80,
  hdpe: 1.80,
  ldpe: 1.80,
  pp: 1.80,
  mix: 1.80,
  cardboard: 1.30,
  metal: 1.10,
  glass: 0.25,
};

export function rowsToFactors(rows: Co2FactorRow[]): CarbonFactors {
  const out: CarbonFactors = {};
  for (const row of rows) {
    if (typeof row.kg_co2e_per_kg === 'number' && row.kg_co2e_per_kg >= 0) {
      out[row.material.toLowerCase()] = row.kg_co2e_per_kg;
    }
  }
  return out;
}

/** Public endpoint — the estimate is shown before any authenticated action. */
export async function fetchCo2Factors(): Promise<Co2FactorRow[]> {
  const res = await apiRequest<Co2FactorsResponse>('/v1/config/co2-factors');
  return res.factors ?? [];
}

export async function readCachedCo2Factors(): Promise<Co2FactorRow[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Co2FactorRow[]) : null;
  } catch {
    return null;
  }
}

export async function writeCachedCo2Factors(rows: Co2FactorRow[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(rows));
  } catch {
    // A full storage quota must not break a weight screen.
  }
}
