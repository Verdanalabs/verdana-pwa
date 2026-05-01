import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { usePrivy } from '@privy-io/react-auth';
import { getOfflineQueue, enqueueOfflineBatch, removeOfflineBatch, updateOfflineBatchStatus, OfflineBatch } from '../state/offline-queue';
import { BatchDraft } from '../state/batch-draft-context';
import { useAuth } from '../../auth/state/auth-context';
import * as batchApi from '../services/batch-api';

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineBatch[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { getAccessToken } = usePrivy();

  const loadQueue = useCallback(async () => {
    const q = await getOfflineQueue();
    setQueue(q);
  }, []);

  const addToQueue = async (draft: BatchDraft) => {
    await enqueueOfflineBatch(draft);
    await loadQueue();
  };

  const syncQueue = useCallback(async () => {
    if (isSyncing || !isAuthenticated) return;
    
    const token = await getAccessToken();
    if (!token) return;
    
    const currentQueue = await getOfflineQueue();
    const pending = currentQueue.filter(b => b.status === 'pending' || b.status === 'failed');
    if (pending.length === 0) return;

    setIsSyncing(true);
    
    for (const item of pending) {
      try {
        await updateOfflineBatchStatus(item.id, 'syncing');

        const { draft } = item;
        if (!user?.id) throw new Error('Missing collector profile');
        if (!draft.photoUri) throw new Error('Missing queued photo');
        if (!draft.pvpSiteId) throw new Error('Missing PVP site');
        if (!draft.materialType) throw new Error('Missing material type');

        const tempId = crypto.randomUUID();
        const { upload_url, storage_key } = await batchApi.createUploadUrl(token, {
          batch_id: tempId,
          content_type: 'image/jpeg',
          filename: 'photo.jpg',
        });

        const blob = await uriToBlob(draft.photoUri);
        const uploadRes = await fetch(upload_url, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': 'image/jpeg' },
        });
        if (!uploadRes.ok) throw new Error(`Photo upload failed (${uploadRes.status})`);

        await batchApi.createBatch(token, {
          collector_user_id: user.id,
          pvp_site_id: draft.pvpSiteId,
          material: draft.materialType.toLowerCase(),
          estimated_weight_grams: Math.round(parseFloat(draft.estimatedWeightKg) * 1000),
          origin_latitude: draft.originLat ?? 0,
          origin_longitude: draft.originLng ?? 0,
          media: [{
            storage_key,
            media_kind: 'photo',
            mime_type: 'image/jpeg',
            captured_at: draft.capturedAt,
          }],
        });

        await removeOfflineBatch(item.id);
      } catch (err: unknown) {
        await updateOfflineBatchStatus(item.id, 'failed', err instanceof Error ? err.message : 'Unknown error');
      }
    }
    
    setIsSyncing(false);
    await loadQueue();
  }, [getAccessToken, isAuthenticated, isSyncing, loadQueue, user?.id]);

  useEffect(() => {
    loadQueue();
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        syncQueue();
      }
    });
    return () => unsubscribe();
  }, [loadQueue, syncQueue]);

  return {
    queue,
    isSyncing,
    addToQueue,
    syncQueue,
    refreshQueue: loadQueue,
  };
}
