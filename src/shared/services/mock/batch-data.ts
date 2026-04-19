import { MOCK_BATCHES, MOCK_BATCH_SUMMARIES } from '@/mocks';
import type { Batch, BatchSummary } from '@/types';

export function getMockBatches(): readonly Batch[] {
  return MOCK_BATCHES;
}

export function getMockBatchSummaries(): readonly BatchSummary[] {
  return MOCK_BATCH_SUMMARIES;
}

export function getMockBatchById(id?: string): Batch | undefined {
  return MOCK_BATCHES.find((batch) => batch.id === id);
}

export function getLatestMockBatchId(): string {
  return MOCK_BATCH_SUMMARIES[0]?.id ?? 'B-0047';
}

export function getMockCosignBatch(): Batch | undefined {
  return MOCK_BATCHES.find((batch) => batch.status === 'transit') ?? MOCK_BATCHES[0];
}
