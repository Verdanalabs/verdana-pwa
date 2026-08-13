import { useEffect, useState } from 'react';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * A location fix for stamping onto a proof photo, when having one is better
 * than nothing but not worth blocking on.
 *
 * The facility does not move and the photo it feeds is optional, so a denied or
 * slow fix resolves to null and the watermark drops its coordinate line. It is
 * omitted rather than written as zeroes, which would read as a real position in
 * the Gulf of Guinea.
 *
 * Weighing a collected batch is the opposite case and does not use this: there
 * the coordinates are evidence of where the handover happened, so that screen
 * blocks until it has them.
 */
export function useBestEffortGps(): Coordinates | null {
  const [gps, setGps] = useState<Coordinates | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        const { latitude, longitude } = pos.coords;
        // (0, 0) is the null island a failed fix reports; treat it as no fix.
        if (!latitude || !longitude) return;
        setGps({ latitude, longitude });
      },
      () => { /* no fix; the watermark omits the coordinate line */ },
      { timeout: 10000, enableHighAccuracy: true },
    );

    return () => { cancelled = true; };
  }, []);

  return gps;
}
