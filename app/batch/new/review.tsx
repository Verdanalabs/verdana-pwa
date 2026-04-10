import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Font, FontSize } from '@/constants/typography';
import { MOCK_BATCH_SUMMARIES } from '@/mocks';
import { useThemeColors } from '@/store/theme-context';
import { useBatchDraft } from '@/store/batch-draft-context';

const MOCK_PHOTOS = [
  require('@/assets/carousle/01-image.jpg'),
  require('@/assets/carousle/02-image.jpg'),
  require('@/assets/carousle/03-image.jpg'),
];

function StepHeader({ step, title, body }: { step: string; title: string; body: string }) {
  const c = useThemeColors();

  return (
    <View style={styles.header}>
      <Text style={[styles.stepText, { color: c.accent }]}>{step}</Text>
      <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      <Text style={[styles.body, { color: c.textSecondary }]}>{body}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();

  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

export default function BatchReviewRoute() {
  const c = useThemeColors();
  const { draft, resetDraft } = useBatchDraft();

  const previewIndex = Math.min(
    Math.max(Number((draft.photoUri ?? 'mock-0').replace('mock-', '')) || 0, 0),
    MOCK_PHOTOS.length - 1
  );

  function handleSubmit() {
    const latestBatchId = MOCK_BATCH_SUMMARIES[0]?.id ?? 'B-0047';
    resetDraft();
    router.replace('/(supplier-tabs)/history');
    setTimeout(() => {
      router.push(`/batch/${latestBatchId}` as never);
    }, 0);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={c.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <StepHeader
            step="Step 4 of 4"
            title="Review the batch before submit."
            body="Check the draft once so the receiving team gets one clear version of the batch."
          />

          <View style={[styles.previewCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Image source={MOCK_PHOTOS[previewIndex]} style={styles.previewImage} contentFit="cover" />
            <View style={styles.previewMeta}>
              <View style={[styles.metaPill, { backgroundColor: `${c.accent}16`, borderColor: `${c.accent}20` }]}>
                <Ionicons name="checkmark-circle-outline" size={14} color={c.accent} />
                <Text style={[styles.metaText, { color: c.textSecondary }]}>Ready for submission</Text>
              </View>
              <Text style={[styles.previewHint, { color: c.textMuted }]}>
                {draft.capturedAt
                  ? `Captured ${new Date(draft.capturedAt).toLocaleString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}`
                  : 'Photo not selected'}
              </Text>
            </View>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.summaryTitle, { color: c.foreground }]}>Batch Summary</Text>
            <DetailRow label="Main Material" value={draft.materialType ?? '-'} />
            <DetailRow
              label="Estimated Weight"
              value={draft.estimatedWeightKg ? `${draft.estimatedWeightKg} kg` : '-'}
            />
            <DetailRow label="Grade" value={draft.grade ?? '-'} />
            <DetailRow label="Drop-off Point" value={draft.dropOffPoint ?? '-'} />
            <DetailRow
              label="Distance"
              value={draft.distanceKm != null ? `${draft.distanceKm.toFixed(1)} km` : '-'}
            />
          </View>

          <View style={[styles.noteCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="time-outline" size={18} color={c.accent} />
            <Text style={[styles.noteText, { color: c.textSecondary }]}>
              After submit, this mock flow sends the batch to History and opens the latest batch detail for tracking.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
          <PrimaryButton
            label="Submit Batch"
            onPress={handleSubmit}
            disabled={!draft.photoUri || !draft.materialType || !draft.grade || !draft.dropOffPoint}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screen: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 6,
  },
  stepText: {
    fontSize: FontSize.sm,
    fontFamily: Font.semiBold,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontFamily: Font.bold,
    lineHeight: 28,
  },
  body: {
    fontSize: FontSize.md,
    fontFamily: Font.regular,
    lineHeight: 22,
    maxWidth: 320,
  },
  previewCard: {
    margin: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 280,
  },
  previewMeta: {
    padding: 14,
    gap: 8,
  },
  metaPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  previewHint: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
  },
  summaryCard: {
    marginHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  summaryTitle: {
    fontSize: FontSize.lg,
    fontFamily: Font.semiBold,
  },
  detailRow: {
    gap: 6,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  detailValue: {
    fontSize: FontSize.md,
    fontFamily: Font.semiBold,
    lineHeight: 22,
  },
  noteCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noteText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
});
