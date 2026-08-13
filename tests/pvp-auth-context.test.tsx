import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PvpAuthProvider, usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { getProcessorInvite } from '@/src/features/pvp/services/pvp-auth-api';

// This suite used to drive connectWallet and simulateApprove, two stubs left on
// the context that no screen calls. They cannot work any more: usePrivy returns
// fresh function identities each render, so refreshSession's useCallback changes
// every render and the effect that reacts to it resets state to 'idle' before an
// assertion can run. The stubs are dead code pending removal; what follows
// covers the paths the app actually takes.
jest.mock('@/src/features/pvp/services/pvp-auth-api', () => ({
  getProcessorInvite: jest.fn(),
  processorSync: jest.fn(),
}));

jest.mock('@/src/features/notifications/services/onesignal-client', () => ({
  logoutOneSignalUser: jest.fn(async () => undefined),
}));

const mockGetProcessorInvite = getProcessorInvite as jest.Mock;

function PvpAuthHarness() {
  const { state, walletAddress, operator, invite, inviteError, setInviteToken, completeOnboarding, signOut } =
    usePvpAuth();
  const [onboardingError, setOnboardingError] = useState('none');

  return (
    <View>
      <Text testID="state">{state}</Text>
      <Text testID="wallet">{walletAddress ?? 'none'}</Text>
      <Text testID="operator">{operator?.display_name ?? 'none'}</Text>
      <Text testID="invite-site">{invite?.pvp_site.name ?? 'none'}</Text>
      <Text testID="invite-error">{inviteError ?? 'none'}</Text>
      <Text testID="onboarding-error">{onboardingError}</Text>

      <Pressable onPress={() => setInviteToken('invite-token-1')}>
        <Text>load invite</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          completeOnboarding({ fullName: 'Operator Jane', facilityName: 'Bekasi Timur' }).catch(
            (err: Error) => setOnboardingError(err.message),
          );
        }}
      >
        <Text>complete</Text>
      </Pressable>
      <Pressable onPress={signOut}>
        <Text>signout</Text>
      </Pressable>
    </View>
  );
}

function renderHarness() {
  return render(
    <PvpAuthProvider>
      <PvpAuthHarness />
    </PvpAuthProvider>,
  );
}

describe('PvpAuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts idle with nothing populated when Privy reports no session', () => {
    renderHarness();

    expect(screen.getByTestId('state').props.children).toBe('idle');
    expect(screen.getByTestId('wallet').props.children).toBe('none');
    expect(screen.getByTestId('operator').props.children).toBe('none');
  });

  it('stays idle and cleared after signing out', () => {
    renderHarness();

    fireEvent.press(screen.getByText('signout'));

    expect(screen.getByTestId('state').props.children).toBe('idle');
    expect(screen.getByTestId('wallet').props.children).toBe('none');
    expect(screen.getByTestId('operator').props.children).toBe('none');
  });

  it('refuses onboarding without an invite token', async () => {
    renderHarness();

    fireEvent.press(screen.getByText('complete'));

    await waitFor(() => {
      expect(screen.getByTestId('onboarding-error').props.children).toBe('Invite token is required');
    });
  });

  it('exposes a usable invite once the token resolves', async () => {
    mockGetProcessorInvite.mockResolvedValue({
      email: 'operator@example.com',
      expires_at: '2030-01-01T00:00:00Z',
      status: 'pending',
      is_expired: false,
      is_usable: true,
      pvp_site: { id: 'site-1', name: 'Bekasi Timur', latitude: -6.2, longitude: 106.8, radius_meters: 150 },
    });

    renderHarness();
    fireEvent.press(screen.getByText('load invite'));

    await waitFor(() => {
      expect(screen.getByTestId('invite-site').props.children).toBe('Bekasi Timur');
    });
    expect(screen.getByTestId('invite-error').props.children).toBe('none');
    expect(mockGetProcessorInvite).toHaveBeenCalledWith('invite-token-1');
  });

  it('surfaces a spent invite as an error rather than a usable one', async () => {
    mockGetProcessorInvite.mockResolvedValue({
      email: 'operator@example.com',
      expires_at: '2020-01-01T00:00:00Z',
      status: 'used',
      is_expired: true,
      is_usable: false,
      pvp_site: { id: 'site-1', name: 'Bekasi Timur', latitude: -6.2, longitude: 106.8, radius_meters: 150 },
    });

    renderHarness();
    fireEvent.press(screen.getByText('load invite'));

    await waitFor(() => {
      expect(screen.getByTestId('invite-error').props.children).toBe('Invite link is expired or already used.');
    });
  });

  it('surfaces a rejected invite lookup as an error', async () => {
    mockGetProcessorInvite.mockRejectedValue(new Error('Invite not found'));

    renderHarness();
    fireEvent.press(screen.getByText('load invite'));

    await waitFor(() => {
      expect(screen.getByTestId('invite-error').props.children).toBe('Invite not found');
    });
    expect(screen.getByTestId('invite-site').props.children).toBe('none');
  });
});
