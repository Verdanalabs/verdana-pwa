import { MOCK_PVP_OPERATOR, MOCK_PVP_STATIONS } from '@/mocks';
import type { PvpOperatorProfile, PvpStation } from '@/types';

export function getMockPvpOperator(): PvpOperatorProfile {
  return MOCK_PVP_OPERATOR;
}

export function getMockPvpStations(): readonly PvpStation[] {
  return MOCK_PVP_STATIONS;
}

export function createMockPvpOperator(overrides: Partial<PvpOperatorProfile>): PvpOperatorProfile {
  return {
    ...MOCK_PVP_OPERATOR,
    ...overrides,
  };
}
