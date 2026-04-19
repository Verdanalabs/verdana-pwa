import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PvpAuthProvider, usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

function PvpAuthHarness() {
  const { state, walletAddress, operator, connectWallet, simulateApprove, completeOnboarding, signOut } = usePvpAuth();

  return (
    <View>
      <Text testID="state">{state}</Text>
      <Text testID="wallet">{walletAddress ?? 'none'}</Text>
      <Text testID="station">{operator?.stationName ?? 'none'}</Text>

      <Pressable onPress={connectWallet}>
        <Text>connect</Text>
      </Pressable>
      <Pressable onPress={simulateApprove}>
        <Text>approve</Text>
      </Pressable>
      <Pressable
        onPress={() =>
          completeOnboarding({
            name: 'Operator Jane',
            stationName: 'Bekasi Timur',
            lat: -6.2,
            lng: 106.8,
          })
        }
      >
        <Text>complete</Text>
      </Pressable>
      <Pressable onPress={signOut}>
        <Text>signout</Text>
      </Pressable>
    </View>
  );
}

describe('PvpAuthProvider', () => {
  it('handles idle to pending to approved to active and back to idle', () => {
    render(
      <PvpAuthProvider>
        <PvpAuthHarness />
      </PvpAuthProvider>
    );

    expect(screen.getByTestId('state').props.children).toBe('idle');
    expect(screen.getByTestId('wallet').props.children).toBe('none');

    fireEvent.press(screen.getByText('connect'));
    expect(screen.getByTestId('state').props.children).toBe('pending');
    expect(screen.getByTestId('wallet').props.children).toBe('7xKf2mk9...4nR8mQ');

    fireEvent.press(screen.getByText('approve'));
    expect(screen.getByTestId('state').props.children).toBe('approved');

    fireEvent.press(screen.getByText('complete'));
    expect(screen.getByTestId('state').props.children).toBe('active');
    expect(screen.getByTestId('station').props.children).toBe('Bekasi Timur');

    fireEvent.press(screen.getByText('signout'));
    expect(screen.getByTestId('state').props.children).toBe('idle');
    expect(screen.getByTestId('wallet').props.children).toBe('none');
    expect(screen.getByTestId('station').props.children).toBe('none');
  });
});
