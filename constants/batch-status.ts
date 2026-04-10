import { BatchStatus } from '@/types';

export const BATCH_STATUS_LABEL: Record<BatchStatus, string> = {
  draft:              'Draft',
  submitted:          'Sent',
  transit:            'On the Way',
  pending_validation: 'Being Checked',
  verified:           'Approved',
  minting:            'Processing...',
  minted:             'Asset Ready',
  listed:             'For Sale',
  collateral:         'Locked',
  rejected:           'Not Accepted',
};

export const BATCH_STATUS_ORDER: BatchStatus[] = [
  'draft',
  'submitted',
  'transit',
  'pending_validation',
  'verified',
  'minting',
  'minted',
];
