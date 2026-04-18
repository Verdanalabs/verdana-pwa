import type { PvpOperatorProfile, PvpStation } from '@/types';

export const MOCK_PVP_STATIONS: PvpStation[] = [
  { id: 'PVP-001', name: 'Makassar Selatan', area: 'Makassar' },
  { id: 'PVP-002', name: 'Makassar Utara', area: 'Makassar' },
  { id: 'PVP-003', name: 'Gowa Sentral', area: 'Gowa' },
  { id: 'PVP-004', name: 'Maros Barat', area: 'Maros' },
];

export const MOCK_PVP_OPERATOR: PvpOperatorProfile = {
  id: 'pvp_mock_001',
  role: 'pvp_operator',
  name: 'Operator Demo',
  walletAddress: '7xKf2mk9...4nR8mQ',
  stationId: 'PVP-001',
  stationName: 'Makassar Selatan',
  area: 'Makassar',
  createdAt: '2026-04-17T08:00:00Z',
};
