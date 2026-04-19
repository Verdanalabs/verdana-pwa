import React from 'react';
import { TouchableOpacity } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import WalletAssetDetailScreen from '@/src/features/wallet/screens/WalletAssetDetailScreen';
import BatchDetailScreen from '@/src/features/batch/screens/BatchDetailScreen';
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

describe('wallet and batch detail linking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates from wallet asset detail to its linked batch', () => {
    mockUseLocalSearchParams.mockReturnValue({ id: 'asset_001' });

    renderWithProviders(<WalletAssetDetailScreen />);

    fireEvent.press(screen.getByText('Open the original batch record and follow the full timeline.'));

    expect(mockPush).toHaveBeenCalledWith('/batch/B-0046');
  });

  it('navigates from batch detail menu to its linked asset', () => {
    mockUseLocalSearchParams.mockReturnValue({ id: 'B-0046' });

    const view = renderWithProviders(<BatchDetailScreen />);

    fireEvent.press(view.UNSAFE_getAllByType(TouchableOpacity)[1]);
    fireEvent.press(screen.getByText('View Asset'));

    expect(mockPush).toHaveBeenCalledWith('/wallet/cnft/asset_001');
  });
});
