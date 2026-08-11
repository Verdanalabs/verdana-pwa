import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

/**
 * Weighings recorded while the site had no signal.
 *
 * The watermarked photo travels with the record because the watermark is the
 * evidence — re-taking it later would stamp the wrong time and place. It is
 * stored as a data URI, which is why the queue is capped.
 */
export interface QueuedWeigh {
  id: string;
  batchId: string;
  actualWeightGrams: number;
  latitude: number;
  longitude: number;
  gpsAccuracyM: number;
  weighedAt: string;
  photoDataUri: string;
  sha256Hex: string;
  photoCapturedAt: string;
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

const QUEUE_KEY = '@verdana:offline_pvp_weighs';

export const MAX_QUEUED_WEIGHS = 10;

export class WeighQueueFullError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeighQueueFullError';
  }
}

export async function getWeighQueue(): Promise<QueuedWeigh[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read PVP weigh queue', err);
    return [];
  }
}

async function writeQueue(queue: QueuedWeigh[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueWeigh(
  entry: Omit<QueuedWeigh, 'id' | 'createdAt' | 'status' | 'error'>,
): Promise<QueuedWeigh> {
  const queue = await getWeighQueue();

  // One weighing per batch — the API rejects a second one anyway, and a
  // duplicate here would just fail loudly on reconnect.
  const existing = queue.find((item) => item.batchId === entry.batchId);
  if (existing) return existing;

  if (queue.length >= MAX_QUEUED_WEIGHS) {
    throw new WeighQueueFullError(
      `${queue.length} weighings are already waiting to sync, which is the maximum this device can hold. Reconnect to upload them first.`,
    );
  }

  const queued: QueuedWeigh = {
    ...entry,
    id: Crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  try {
    await writeQueue([...queue, queued]);
  } catch {
    throw new WeighQueueFullError(
      'This device has run out of space for offline weighings. Reconnect to upload the queued ones first.',
    );
  }

  return queued;
}

export async function removeQueuedWeigh(id: string): Promise<void> {
  const queue = await getWeighQueue();
  await writeQueue(queue.filter((item) => item.id !== id));
}

export async function updateQueuedWeighStatus(
  id: string,
  status: QueuedWeigh['status'],
  error?: string,
): Promise<void> {
  const queue = await getWeighQueue();
  const idx = queue.findIndex((item) => item.id === id);
  if (idx < 0) return;
  queue[idx].status = status;
  queue[idx].error = error;
  await writeQueue(queue);
}
