import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BatchDraftProvider, useBatchDraft } from '@/src/features/batch/state/batch-draft-context';

function BatchDraftHarness() {
  const { draft, setPhoto, setDetails, setLocation, resetDraft } = useBatchDraft();

  return (
    <View>
      <Text testID="draft">{JSON.stringify(draft)}</Text>

      <Pressable onPress={() => setPhoto({ photoUri: 'mock-1', capturedAt: '2026-04-19T13:00:00Z' })}>
        <Text>photo</Text>
      </Pressable>
      <Pressable onPress={() => setDetails({ materialType: 'PET', estimatedWeightKg: '42', grade: 'A' })}>
        <Text>details</Text>
      </Pressable>
      <Pressable onPress={() => setLocation({ dropOffPoint: 'East Bekasi Drop-off', pvpSiteId: 'site-1', originLat: -6.51, originLng: 107.06, gpsLat: -6.52, gpsLng: 107.07, distanceKm: 2.3 })}>
        <Text>location</Text>
      </Pressable>
      <Pressable onPress={resetDraft}>
        <Text>reset</Text>
      </Pressable>
    </View>
  );
}

function readDraft() {
  return JSON.parse(screen.getByTestId('draft').props.children as string);
}

describe('BatchDraftProvider', () => {
  it('stores and resets the multi-step batch draft state', () => {
    render(
      <BatchDraftProvider>
        <BatchDraftHarness />
      </BatchDraftProvider>
    );

    expect(readDraft()).toMatchObject({
      photoUri: null,
      materialType: null,
      dropOffPoint: null,
    });

    fireEvent.press(screen.getByText('photo'));
    fireEvent.press(screen.getByText('details'));
    fireEvent.press(screen.getByText('location'));

    expect(readDraft()).toMatchObject({
      photoUri: 'mock-1',
      capturedAt: '2026-04-19T13:00:00Z',
      materialType: 'PET',
      estimatedWeightKg: '42',
      grade: 'A',
      dropOffPoint: 'East Bekasi Drop-off',
      gpsLat: -6.52,
      gpsLng: 107.07,
      distanceKm: 2.3,
    });

    fireEvent.press(screen.getByText('reset'));

    expect(readDraft()).toMatchObject({
      photoUri: null,
      capturedAt: null,
      materialType: null,
      estimatedWeightKg: '',
      grade: null,
      dropOffPoint: null,
      gpsLat: null,
      gpsLng: null,
      distanceKm: null,
    });
  });
});
