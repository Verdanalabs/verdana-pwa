import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { BatchGrade, MaterialType } from '@/types';

export interface BatchDraft {
  photoUri: string | null;
  capturedAt: string | null;
  materialType: MaterialType | null;
  estimatedWeightKg: string;
  grade: BatchGrade | null;
  dropOffPoint: string | null;
  pvpSiteId: string | null;
  // User's actual GPS at time of location step (used as batch origin)
  originLat: number | null;
  originLng: number | null;
  // Selected PVP site coordinates (for display/distance)
  gpsLat: number | null;
  gpsLng: number | null;
  distanceKm: number | null;
}

interface BatchDraftContextValue {
  draft: BatchDraft;
  setPhoto: (payload: { photoUri: string; capturedAt: string }) => void;
  setDetails: (payload: { materialType: MaterialType; estimatedWeightKg: string; grade: BatchGrade }) => void;
  setLocation: (payload: { dropOffPoint: string; pvpSiteId: string; originLat: number; originLng: number; gpsLat: number; gpsLng: number; distanceKm: number }) => void;
  resetDraft: () => void;
}

const INITIAL_DRAFT: BatchDraft = {
  photoUri: null,
  capturedAt: null,
  materialType: null,
  estimatedWeightKg: '',
  grade: null,
  dropOffPoint: null,
  pvpSiteId: null,
  originLat: null,
  originLng: null,
  gpsLat: null,
  gpsLng: null,
  distanceKm: null,
};

const BatchDraftContext = createContext<BatchDraftContextValue>({
  draft: INITIAL_DRAFT,
  setPhoto: () => {},
  setDetails: () => {},
  setLocation: () => {},
  resetDraft: () => {},
});

export function BatchDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BatchDraft>(INITIAL_DRAFT);

  const value = useMemo<BatchDraftContextValue>(() => ({
    draft,
    setPhoto: ({ photoUri, capturedAt }) => {
      setDraft((prev) => ({ ...prev, photoUri, capturedAt }));
    },
    setDetails: ({ materialType, estimatedWeightKg, grade }) => {
      setDraft((prev) => ({ ...prev, materialType, estimatedWeightKg, grade }));
    },
    setLocation: ({ dropOffPoint, pvpSiteId, originLat, originLng, gpsLat, gpsLng, distanceKm }) => {
      setDraft((prev) => ({ ...prev, dropOffPoint, pvpSiteId, originLat, originLng, gpsLat, gpsLng, distanceKm }));
    },
    resetDraft: () => setDraft(INITIAL_DRAFT),
  }), [draft]);

  return <BatchDraftContext.Provider value={value}>{children}</BatchDraftContext.Provider>;
}

export function useBatchDraft() {
  return useContext(BatchDraftContext);
}
