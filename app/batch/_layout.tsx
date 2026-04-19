import { Stack } from 'expo-router';
import { BatchDraftProvider } from '@/src/features/batch/state/batch-draft-context';

export default function BatchLayout() {
  return (
    <BatchDraftProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </BatchDraftProvider>
  );
}
