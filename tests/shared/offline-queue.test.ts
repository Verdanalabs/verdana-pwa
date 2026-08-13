import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MAX_QUEUED_BATCHES,
  OfflineQueueFullError,
  enqueueOfflineBatch,
  getOfflineQueue,
  removeOfflineBatch,
  updateOfflineBatchStatus,
} from '@/src/features/batch/state/offline-queue';
import {
  MAX_QUEUED_WEIGHS,
  WeighQueueFullError,
  enqueueWeigh,
  getWeighQueue,
} from '@/src/features/pvp/state/pvp-weigh-queue';
import type { BatchDraft } from '@/src/features/batch/state/batch-draft-context';

const draft = {
  photoUri: 'data:image/jpeg;base64,AAAA',
  capturedAt: '2026-08-09T00:00:00.000Z',
  materialType: 'ORGANIC',
  estimatedWeightKg: '10',
  grade: 'C',
} as unknown as BatchDraft;

function weighEntry(batchId: string) {
  return {
    batchId,
    actualWeightGrams: 10_000,
    latitude: -3.2241,
    longitude: 104.6482,
    gpsAccuracyM: 12,
    weighedAt: '2026-08-09T00:00:00.000Z',
    photoDataUri: 'data:image/jpeg;base64,AAAA',
    sha256Hex: '0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0',
    photoCapturedAt: '2026-08-09T00:00:00.000Z',
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('offline batch queue', () => {
  it('round-trips a queued batch', async () => {
    const queued = await enqueueOfflineBatch(draft);
    const queue = await getOfflineQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].id).toBe(queued.id);
    expect(queue[0].status).toBe('pending');
  });

  it('records a failure reason so the banner can show it', async () => {
    const queued = await enqueueOfflineBatch(draft);
    await updateOfflineBatchStatus(queued.id, 'failed', 'Photo upload failed (503)');
    const [item] = await getOfflineQueue();
    expect(item.status).toBe('failed');
    expect(item.error).toBe('Photo upload failed (503)');
  });

  it('removes a synced batch', async () => {
    const queued = await enqueueOfflineBatch(draft);
    await removeOfflineBatch(queued.id);
    expect(await getOfflineQueue()).toHaveLength(0);
  });

  // Each item carries a base64 photo, and web AsyncStorage is localStorage with
  // roughly 5 MB for the whole origin.
  it('refuses to grow past the cap instead of exhausting storage', async () => {
    for (let i = 0; i < MAX_QUEUED_BATCHES; i += 1) {
      await enqueueOfflineBatch(draft);
    }
    await expect(enqueueOfflineBatch(draft)).rejects.toBeInstanceOf(OfflineQueueFullError);
    expect(await getOfflineQueue()).toHaveLength(MAX_QUEUED_BATCHES);
  });

  it('reports a storage rejection rather than silently dropping the batch', async () => {
    // Swapped by hand rather than with jest.spyOn: restoring a spy on the
    // AsyncStorage mock leaves behind a no-op setItem, which silently breaks
    // every later test in the file.
    const original = AsyncStorage.setItem;
    AsyncStorage.setItem = jest.fn().mockRejectedValue(new Error('QuotaExceededError'));
    try {
      await expect(enqueueOfflineBatch(draft)).rejects.toBeInstanceOf(OfflineQueueFullError);
    } finally {
      AsyncStorage.setItem = original;
    }
  });
});

describe('pvp weigh queue', () => {
  it('round-trips a queued weighing with its proof photo', async () => {
    await enqueueWeigh(weighEntry('batch-1'));
    const [item] = await getWeighQueue();
    expect(item.batchId).toBe('batch-1');
    expect(item.status).toBe('pending');
    expect(item.photoDataUri).toBeTruthy();
    expect(item.sha256Hex).toHaveLength(64);
  });

  // The API accepts one weighing per batch, so a duplicate would only fail on
  // reconnect and leave a permanently failed row in the banner.
  it('does not queue the same batch twice', async () => {
    const first = await enqueueWeigh(weighEntry('batch-1'));
    const second = await enqueueWeigh(weighEntry('batch-1'));
    expect(second.id).toBe(first.id);
    expect(await getWeighQueue()).toHaveLength(1);
  });

  it('refuses to grow past the cap', async () => {
    for (let i = 0; i < MAX_QUEUED_WEIGHS; i += 1) {
      await enqueueWeigh(weighEntry(`batch-${i}`));
    }
    await expect(enqueueWeigh(weighEntry('one-too-many'))).rejects.toBeInstanceOf(WeighQueueFullError);
    expect(await getWeighQueue()).toHaveLength(MAX_QUEUED_WEIGHS);
  });
});
