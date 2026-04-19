import { MOCK_DASHBOARD, MOCK_SUPPLIER } from '@/mocks';
import type { DashboardSummary, SupplierProfile } from '@/types';

export function getMockSupplier(): SupplierProfile {
  return MOCK_SUPPLIER;
}

export function getMockDashboardSummary(): DashboardSummary {
  return MOCK_DASHBOARD;
}

export function createMockSupplierProfile(overrides: Partial<SupplierProfile>): SupplierProfile {
  return {
    ...MOCK_SUPPLIER,
    ...overrides,
  };
}
