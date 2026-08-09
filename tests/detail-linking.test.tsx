import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import WalletAssetDetailScreen from '@/src/features/wallet/screens/WalletAssetDetailScreen';
import { getBatch } from '@/src/features/batch/services/batch-api';
import { renderWithProviders } from './test-utils';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockUseLocalSearchParams = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    back: (...args: unknown[]) => mockBack(...args),
  },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

// Both screens were rewritten from fixture data to live API calls, so the old
// version of this suite rendered an error state and asserted copy that no longer
// exists anywhere. The screen needs a token and a batch before it renders
// anything to press.
// The value is built once in the factory rather than per call. The screen's
// load effect depends on getAccessToken, so handing back a fresh jest.fn each
// render re-runs the effect on every render and the screen never leaves its
// loading state. jest.setup.ts has the same shape, which is why the shared mock
// is not reused here.
jest.mock('@privy-io/react-auth', () => {
  const privy = {
    ready: true,
    authenticated: true,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    getAccessToken: jest.fn(async () => 'test-token'),
  };
  return { usePrivy: () => privy };
});

jest.mock('@/src/features/batch/services/batch-api', () => ({
  getBatch: jest.fn(),
}));

const mockGetBatch = getBatch as jest.Mock;

const BATCH_ID = '9f1c5b02-1f4a-4f0e-9a3d-2b8c7d6e5f40';

function mintedBatch() {
  return {
    id: BATCH_ID,
    status: 'minted',
    material: 'pet',
    collector_user_id: 'collector-1',
    estimated_weight_grams: 12000,
    actual_weight_grams: 11500,
    created_at: '2026-01-02T03:04:05Z',
    updated_at: '2026-01-02T03:04:05Z',
    media: [],
    cnft_record: {
      asset_id: 'AsSeT1111111111111111111111111111111111111',
      tx_signature: 'SiG1111111111111111111111111111111111111111',
      minted_at: '2026-01-02T04:00:00Z',
      merkle_tree: 'TrEE111111111111111111111111111111111111111',
      leaf_index: 7,
    },
  };
}

describe('wallet asset detail linking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: BATCH_ID });
    mockGetBatch.mockResolvedValue(mintedBatch());
  });

  it('loads the asset for the id in the route', async () => {
    renderWithProviders(<WalletAssetDetailScreen />);

    await waitFor(() => {
      expect(mockGetBatch).toHaveBeenCalledWith('test-token', BATCH_ID);
    });
  });

  it('navigates from the asset menu to its linked batch', async () => {
    renderWithProviders(<WalletAssetDetailScreen />);

    // The Ionicons mock renders the icon name as text, so the header menu
    // button is reachable by its glyph name.
    fireEvent.press(await screen.findByText('ellipsis-horizontal'));
    fireEvent.press(await screen.findByText('View Batch'));

    expect(mockPush).toHaveBeenCalledWith(`/batch/${BATCH_ID}`);
  });

  it('shows the not-found state when the batch has never been minted', async () => {
    mockGetBatch.mockResolvedValue({ ...mintedBatch(), cnft_record: undefined });

    renderWithProviders(<WalletAssetDetailScreen />);

    await waitFor(() => {
      expect(screen.getByText('Asset not found')).toBeTruthy();
    });
  });

  // BatchDetailScreen offers no "View Asset" action; its only router push is to
  // /batch/approve-cosign. The reverse link still exists from WalletScreen and
  // MarketplaceScreen. The wallet surfaces are placeholders until the devnet
  // phase, so this stays a todo rather than being deleted or back-filled.
  it.todo('navigates from batch detail back to its linked asset, once the devnet wallet work lands');
});
