import { useCallback, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { createUploadUrl, pvpWeighBatch } from '@/src/features/batch/services/batch-api';
import { ApiError } from '@/src/shared/services/api';
import { dataUriToBlob } from '@/src/shared/lib/photo-watermark';
import {
  getWeighQueue,
  removeQueuedWeigh,
  updateQueuedWeighStatus,
  type QueuedWeigh,
} from '@/src/features/pvp/state/pvp-weigh-queue';

export function usePvpWeighQueue() {
  const { token } = usePvpAuth();
  const [queue, setQueue] = useState<QueuedWeigh[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshQueue = useCallback(async () => {
    setQueue(await getWeighQueue());
  }, []);

  const syncQueue = useCallback(async () => {
    if (isSyncing || !token) return;

    const current = await getWeighQueue();
    const pending = current.filter((item) => item.status === 'pending' || item.status === 'failed');
    if (pending.length === 0) return;

    setIsSyncing(true);

    for (const item of pending) {
      try {
        await updateQueuedWeighStatus(item.id, 'syncing');

        const upload = await createUploadUrl(token, {
          batch_id: item.batchId,
          content_type: 'image/jpeg',
          filename: `scale-proof-${item.batchId}.jpg`,
        });
        const putRes = await fetch(upload.upload_url, {
          method: 'PUT',
          headers: { 'Content-Type': 'image/jpeg' },
          body: dataUriToBlob(item.photoDataUri),
        });
        if (!putRes.ok) throw new Error(`Proof photo upload failed (${putRes.status})`);

        await pvpWeighBatch(token, item.batchId, {
          actual_weight_grams: item.actualWeightGrams,
          latitude: item.latitude,
          longitude: item.longitude,
          gps_accuracy_m: item.gpsAccuracyM,
          weighed_at: item.weighedAt,
          media: [{
            storage_key: upload.storage_key,
            media_kind: 'scale_proof',
            mime_type: 'image/jpeg',
            sha256_hex: item.sha256Hex,
            captured_at: item.photoCapturedAt,
          }],
        });

        await removeQueuedWeigh(item.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sync failed';
        // A 4xx will fail identically on every retry — a rejected discrepancy, a
        // batch someone else already weighed. Leave it marked failed with the
        // server's reason so the operator can act, instead of retrying forever.
        await updateQueuedWeighStatus(item.id, 'failed', message);
        if (err instanceof ApiError && err.status && err.status >= 400 && err.status < 500) {
          continue;
        }
      }
    }

    setIsSyncing(false);
    await refreshQueue();
  }, [isSyncing, refreshQueue, token]);

  useEffect(() => {
    void refreshQueue();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        void syncQueue();
      }
    });
    return () => unsubscribe();
  }, [refreshQueue, syncQueue]);

  return { queue, isSyncing, syncQueue, refreshQueue };
}
