import type { BatchStatus } from '@/types';

export const BATCH_STATUS_LABEL: Record<BatchStatus, string> = {
  pending:            'Pending',
  accepted:           'Accepted',
  pickup_dispatched:  'On the Way',
  cosigning:          'Needs Approval',
  cosigned:           'Co-signed',
  mint_pending:       'Minting...',
  mint_failed:        'Mint Failed',
  minted:             'Asset Ready',
};

export const BATCH_STATUS_ORDER: BatchStatus[] = [
  'pending',
  'accepted',
  'pickup_dispatched',
  'cosigning',
  'cosigned',
  'mint_pending',
  'mint_failed',
  'minted',
];
