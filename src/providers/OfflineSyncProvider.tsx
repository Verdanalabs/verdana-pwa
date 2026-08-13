import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { appVariant } from '@/src/shared/config/app-variant';
import { useOfflineQueue } from '@/src/features/batch/hooks/useOfflineQueue';
import { usePvpWeighQueue } from '@/src/features/pvp/hooks/usePvpWeighQueue';

/**
 * Drives the offline queue for whichever variant is running.
 *
 * The collector queue used to sync only while the batch review screen was
 * mounted, so a batch saved offline sat on the device until the operator
 * happened to walk back into that exact screen. Mounted at the app root, the
 * connectivity listener is always live.
 *
 * Consumers read the queue through this context rather than calling the hooks
 * again — a second call means a second NetInfo listener and two sync loops
 * racing over the same records.
 */
export interface OfflineSyncValue {
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
  failedMessages: string[];
  /** Plural noun for the queued records, for banner copy. */
  itemLabel: string;
  syncNow: () => void;
}

const EMPTY: OfflineSyncValue = {
  pendingCount: 0,
  failedCount: 0,
  isSyncing: false,
  failedMessages: [],
  itemLabel: 'items',
  syncNow: () => {},
};

const OfflineSyncContext = createContext<OfflineSyncValue>(EMPTY);

export function useOfflineSync(): OfflineSyncValue {
  return useContext(OfflineSyncContext);
}

function CollectorOfflineSync({ children }: { children: ReactNode }) {
  const { queue, isSyncing, syncQueue } = useOfflineQueue();

  const value = useMemo<OfflineSyncValue>(() => ({
    pendingCount: queue.filter((item) => item.status === 'pending' || item.status === 'syncing').length,
    failedCount: queue.filter((item) => item.status === 'failed').length,
    isSyncing,
    failedMessages: queue.filter((item) => item.status === 'failed').map((item) => item.error ?? 'Sync failed'),
    itemLabel: 'batches',
    syncNow: () => { void syncQueue(); },
  }), [queue, isSyncing, syncQueue]);

  return <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>;
}

function PvpOfflineSync({ children }: { children: ReactNode }) {
  const { queue, isSyncing, syncQueue } = usePvpWeighQueue();

  const value = useMemo<OfflineSyncValue>(() => ({
    pendingCount: queue.filter((item) => item.status === 'pending' || item.status === 'syncing').length,
    failedCount: queue.filter((item) => item.status === 'failed').length,
    isSyncing,
    failedMessages: queue.filter((item) => item.status === 'failed').map((item) => item.error ?? 'Sync failed'),
    itemLabel: 'weighings',
    syncNow: () => { void syncQueue(); },
  }), [queue, isSyncing, syncQueue]);

  return <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>;
}

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  return appVariant === 'collector'
    ? <CollectorOfflineSync>{children}</CollectorOfflineSync>
    : <PvpOfflineSync>{children}</PvpOfflineSync>;
}
