import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { getPvpSites, type PvpSite } from '@/src/features/pvp/services/pvp-api';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface PvpSiteWithDistance extends PvpSite {
  distanceKm: number | null;
}

interface UsePvpSitesResult {
  sites: PvpSiteWithDistance[];
  isLoading: boolean;
  error: string | null;
}

interface UsePvpSitesOptions {
  userLat?: number | null;
  userLng?: number | null;
  // Pass a static token for non-Privy users (e.g. PVP operators).
  // If omitted, token is fetched from Privy.
  token?: string | null;
}

export function usePvpSites(options: UsePvpSitesOptions = {}): UsePvpSitesResult {
  const { userLat, userLng, token: staticToken } = options;
  const { getAccessToken } = usePrivy();
  const [sites, setSites] = useState<PvpSiteWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const token = staticToken ?? (await getAccessToken());
        if (!token) throw new Error('Not authenticated');

        const data = await getPvpSites(token);
        if (cancelled) return;

        const withDistance: PvpSiteWithDistance[] = data.map((site) => ({
          ...site,
          distanceKm:
            userLat != null && userLng != null
              ? haversineKm(userLat, userLng, site.latitude, site.longitude)
              : null,
        }));

        withDistance.sort((a, b) => {
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        });

        setSites(withDistance);
      } catch {
        if (!cancelled) setError('Failed to load drop-off points.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [getAccessToken, userLat, userLng, staticToken]);

  return { sites, isLoading, error };
}
