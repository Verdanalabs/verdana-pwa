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

export async function getOfflineQueue(): Promise<OfflineBatch[]> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read offline queue', err);
    return [];
  }
}

export async function enqueueOfflineBatch(draft: BatchDraft): Promise<OfflineBatch> {
  const queue = await getOfflineQueue();
  const newBatch: OfflineBatch = {
    id: Crypto.randomUUID(),
    draft,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  
  queue.push(newBatch);
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  return newBatch;
}

export async function removeOfflineBatch(id: string): Promise<void> {
  const queue = await getOfflineQueue();
  const filtered = queue.filter(b => b.id !== id);
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
}

export async function updateOfflineBatchStatus(id: string, status: OfflineBatch['status'], error?: string): Promise<void> {
  const queue = await getOfflineQueue();
  const idx = queue.findIndex(b => b.id === id);
  if (idx >= 0) {
    queue[idx].status = status;
    if (error) queue[idx].error = error;
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }
}
