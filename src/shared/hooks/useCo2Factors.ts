import { useCallback, useEffect, useRef, useState } from 'react';
import type { CarbonFactors } from '@/src/shared/lib/carbon';
import {
  DEFAULT_FACTORS,
  fetchCo2Factors,
  readCachedCo2Factors,
  rowsToFactors,
  writeCachedCo2Factors,
  type Co2FactorRow,
} from '@/src/shared/services/co2-factors';

/** Where the numbers currently on screen came from. Surfaced so the operator is told when an estimate is not live. */
export type Co2FactorSource = 'live' | 'cached' | 'bundled';

export interface UseCo2FactorsResult {
  factors: CarbonFactors;
  methodologies: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  source: Co2FactorSource;
  retry: () => void;
}

function methodologyMap(rows: Co2FactorRow[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    if (row.methodology) out[row.material.toLowerCase()] = row.methodology;
  }
  return out;
}

export function useCo2Factors(): UseCo2FactorsResult {
  const [factors, setFactors] = useState<CarbonFactors>(DEFAULT_FACTORS);
  const [methodologies, setMethodologies] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<Co2FactorSource>('bundled');
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      // Cache first so the badge has real numbers on the first frame; the live
      // fetch overwrites them a moment later if it succeeds.
      const cached = await readCachedCo2Factors();
      if (!cancelled && cached && cached.length > 0) {
        setFactors(rowsToFactors(cached));
        setMethodologies(methodologyMap(cached));
        setSource('cached');
      }

      try {
        const rows = await fetchCo2Factors();
        if (cancelled) return;
        if (rows.length > 0) {
          setFactors(rowsToFactors(rows));
          setMethodologies(methodologyMap(rows));
          setSource('live');
          void writeCachedCo2Factors(rows);
        }
      } catch (e) {
        if (cancelled) return;
        // Not fatal: the bundled table still produces an estimate, and the
        // canonical figure is computed server-side at mint time either way.
        setError(e instanceof Error ? e.message : 'Could not refresh emission factors.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { factors, methodologies, isLoading, error, source, retry };
}
