import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { BatchDraft } from './batch-draft-context';

export interface OfflineBatch {
  id: string;
  draft: BatchDraft;
  createdAt: string;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

const OFFLINE_QUEUE_KEY = '@verdana:offline_batches';

/**
 * On web, AsyncStorage is localStorage, which allows roughly 5 MB for the whole
 * origin. Each queued item carries a base64 photo, so an unbounded queue
 * silently fills the budget and then every write in the app starts throwing.
 */
export const MAX_QUEUED_BATCHES = 10;

/** Raised when the queue is full or storage rejected the write, so callers can say so instead of dropping the batch silently. */
export class OfflineQueueFullError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OfflineQueueFullError';
  }
}

export async function getOfflineQueue(): Promise<OfflineBatch[]> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read offline queue', err);
    return [];
  }
}

async function writeQueue(queue: OfflineBatch[]): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueOfflineBatch(draft: BatchDraft): Promise<OfflineBatch> {
  const queue = await getOfflineQueue();

  if (queue.length >= MAX_QUEUED_BATCHES) {
    throw new OfflineQueueFullError(
      `You have ${queue.length} batches waiting to sync, which is the maximum this device can hold. Reconnect to upload them before adding another.`,
    );
  }

  const newBatch: OfflineBatch = {
    id: Crypto.randomUUID(),
    draft,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  try {
    await writeQueue([...queue, newBatch]);
  } catch {
    // Almost always a quota rejection. Tell the operator rather than letting the
    // screen report success for a batch that was never stored.
    throw new OfflineQueueFullError(
      'This device has run out of space for offline batches. Reconnect to upload the queued ones first.',
    );
  }

  return newBatch;
}

export async function removeOfflineBatch(id: string): Promise<void> {
  const queue = await getOfflineQueue();
  await writeQueue(queue.filter((b) => b.id !== id));
}

export async function updateOfflineBatchStatus(id: string, status: OfflineBatch['status'], error?: string): Promise<void> {
  const queue = await getOfflineQueue();
  const idx = queue.findIndex((b) => b.id === id);
  if (idx >= 0) {
    queue[idx].status = status;
    if (error) queue[idx].error = error;
    await writeQueue(queue);
  }
}
