import React from 'react';
import { screen } from '@testing-library/react-native';
import { CarbonImpactBadge } from '@/src/shared/ui/CarbonImpactBadge';
import { renderWithProviders } from '../test-utils';
import { fetchCo2Factors, readCachedCo2Factors } from '@/src/shared/services/co2-factors';

jest.mock('@/src/shared/services/co2-factors', () => {
  const actual = jest.requireActual('@/src/shared/services/co2-factors');
  return {
    ...actual,
    fetchCo2Factors: jest.fn(),
    readCachedCo2Factors: jest.fn(),
    writeCachedCo2Factors: jest.fn().mockResolvedValue(undefined),
  };
});

const mockFetch = fetchCo2Factors as jest.MockedFunction<typeof fetchCo2Factors>;
const mockReadCache = readCachedCo2Factors as jest.MockedFunction<typeof readCachedCo2Factors>;

const LIVE_ROWS = [
  { material: 'organic', kg_co2e_per_kg: 0.65, methodology: 'IPCC 2006 Vol.5 Waste' },
  { material: 'pet', kg_co2e_per_kg: 2.1, methodology: 'US EPA WARM' },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockReadCache.mockResolvedValue(null);
  mockFetch.mockResolvedValue(LIVE_ROWS as never);
});

describe('CarbonImpactBadge', () => {
  it('shows the prompt when no weight has been entered', async () => {
    renderWithProviders(<CarbonImpactBadge weightInput="" material="organic" />);

    expect(await screen.findByText('Carbon impact')).toBeTruthy();
    expect(screen.getByText(/Enter a weight/i)).toBeTruthy();
  });

  // The acceptance figure from the client spec: 10 kg of organic at 0.65.
  it('shows 6.50 kg CO2e for 10 kg of organic', async () => {
    renderWithProviders(<CarbonImpactBadge weightInput="10" material="organic" />);

    expect(await screen.findByText('+6.50 kg CO2e')).toBeTruthy();
    // Cites the methodology the endpoint returned, which also proves the live
    // path ran rather than the component quietly falling back to the bundle.
    expect(screen.getByText('IPCC 2006 Vol.5 Waste')).toBeTruthy();
    expect(screen.queryByText(/Offline estimate/i)).toBeNull();
  });

  it('reads the comma decimal separator an Indonesian keyboard produces', async () => {
    renderWithProviders(<CarbonImpactBadge weightInput="2,5" material="pet" />);

    expect(await screen.findByText('+5.25 kg CO2e')).toBeTruthy();
  });

  it('always shows two decimals, including a whole result', async () => {
    renderWithProviders(<CarbonImpactBadge weightInput="20" material="organic" />);

    expect(await screen.findByText('+13.00 kg CO2e')).toBeTruthy();
  });

  it('stays empty rather than showing a negative offset', async () => {
    renderWithProviders(<CarbonImpactBadge weightInput="-4" material="organic" />);

    expect(await screen.findByText('Carbon impact')).toBeTruthy();
    expect(screen.queryByText(/kg CO2e/)).toBeNull();
  });

  it('names the material when no factor is published for it', async () => {
    renderWithProviders(<CarbonImpactBadge weightInput="10" material="unobtanium" />);

    expect(await screen.findByText('Emission factor unavailable')).toBeTruthy();
    expect(screen.getByText(/UNOBTANIUM/)).toBeTruthy();
  });

  it('asks for a category when none is selected yet', async () => {
    renderWithProviders(<CarbonImpactBadge weightInput="10" material={null} />);

    expect(await screen.findByText(/Select a waste category/i)).toBeTruthy();
  });

  // A dead factors endpoint must not stop an operator submitting: core-api
  // recomputes the offset from the same table when it mints.
  it('falls back to the bundled table when the endpoint fails', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));

    renderWithProviders(<CarbonImpactBadge weightInput="10" material="organic" />);

    expect(await screen.findByText('+6.50 kg CO2e')).toBeTruthy();
    expect(screen.getByText(/Offline estimate/i)).toBeTruthy();
  });
});
