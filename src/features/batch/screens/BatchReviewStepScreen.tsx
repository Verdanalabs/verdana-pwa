import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/react-auth';
import { PrimaryButton } from '@/src/shared/ui/PrimaryButton';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { useBatchDraft } from '@/src/features/batch/state/batch-draft-context';
import { createUploadUrl, createBatch } from '@/src/features/batch/services/batch-api';

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

async function dataUriToBlob(dataUri: string): Promise<Blob> {
  const res = await fetch(dataUri);
  return res.blob();
}

export default function BatchReviewRoute() {
  const c = useThemeColors();
  const { draft, resetDraft } = useBatchDraft();
  const { user } = useAuth();
  const { getAccessToken } = usePrivy();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = !!draft.photoUri && !!draft.materialType && !!draft.grade && !!draft.dropOffPoint && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit || !user) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      // 1. Get a presigned upload URL (use a temp UUID as path prefix)
      const tempId = crypto.randomUUID();
      const { upload_url, storage_key } = await createUploadUrl(token, {
        batch_id: tempId,
        content_type: 'image/jpeg',
        filename: 'photo.jpg',
      });

      // 2. Upload photo directly to R2
      const blob = await dataUriToBlob(draft.photoUri!);
      const uploadRes = await fetch(upload_url, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' },
      });
      if (!uploadRes.ok) throw new Error(`Photo upload failed (${uploadRes.status})`);

      // 3. Create the batch
      const weightGrams = Math.round(parseFloat(draft.estimatedWeightKg) * 1000);
      if (!draft.pvpSiteId) throw new Error('No PVP site selected');
      const batch = await createBatch(token, {
        collector_user_id: user.id,
        pvp_site_id: draft.pvpSiteId,
        material: draft.materialType!.toLowerCase(),
        estimated_weight_grams: weightGrams,
        origin_latitude: draft.originLat ?? 0,
        origin_longitude: draft.originLng ?? 0,
        media: [{
          storage_key,
          media_kind: 'photo',
          mime_type: 'image/jpeg',
          captured_at: draft.capturedAt ?? undefined,
        }],
      });

      resetDraft();
      router.replace(`/batch/success?id=${batch.id}` as never);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit batch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            {draft.photoUri ? (
              <Image source={{ uri: draft.photoUri }} style={styles.previewImage} contentFit="cover" />
            ) : (
              <View style={[styles.previewImage, { backgroundColor: c.border, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="image-outline" size={40} color={c.textMuted} />
              </View>
            )}
            <View style={styles.previewMeta}>
              <View style={[styles.metaPill, { backgroundColor: `${c.accent}16`, borderColor: `${c.accent}20` }]}>
                <Ionicons name="checkmark-circle-outline" size={14} color={c.accent} />
                <Text style={[styles.metaText, { color: c.textSecondary }]}>Ready for submission</Text>
              </View>
              <Text style={[styles.previewHint, { color: c.textMuted }]}>
                {draft.capturedAt
                  ? `Captured ${new Date(draft.capturedAt).toLocaleString('en-US', {
                      day: 'numeric', month: 'short',
                      hour: 'numeric', minute: '2-digit',
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

          {submitError && (
            <View style={[styles.errorCard, { backgroundColor: `${c.error}14`, borderColor: `${c.error}30` }]}>
              <Ionicons name="alert-circle-outline" size={16} color={c.error} />
              <Text style={[styles.errorText, { color: c.error }]}>{submitError}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
          {isSubmitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={c.accent} />
              <Text style={[styles.loadingText, { color: c.textSecondary }]}>Uploading and creating batch...</Text>
            </View>
          ) : (
            <PrimaryButton
              label="Submit Batch"
              onPress={handleSubmit}
              disabled={!canSubmit}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screen: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingTop: 8 },
  iconButton: {
    width: 42, height: 42,
    borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingBottom: 20 },
  header: { paddingHorizontal: 20, paddingTop: 18, gap: 6 },
  stepText: { fontSize: FontSize.sm, fontFamily: Font.semiBold },
  title: { fontSize: FontSize['2xl'], fontFamily: Font.bold, lineHeight: 28 },
  body: { fontSize: FontSize.md, fontFamily: Font.regular, lineHeight: 22, maxWidth: 320 },
  previewCard: {
    margin: 20, marginBottom: 14,
    borderWidth: 1, borderRadius: 24, overflow: 'hidden',
  },
  previewImage: { width: '100%', height: 280 },
  previewMeta: { padding: 14, gap: 8 },
  metaPill: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  metaText: { fontSize: FontSize.sm, fontFamily: Font.medium },
  previewHint: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  summaryCard: {
    marginHorizontal: 20, borderRadius: 22, borderWidth: 1, padding: 16, gap: 14,
  },
  summaryTitle: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  detailRow: { gap: 6 },
  detailLabel: { fontSize: FontSize.sm, fontFamily: Font.medium },
  detailValue: { fontSize: FontSize.md, fontFamily: Font.semiBold, lineHeight: 22 },
  errorCard: {
    marginHorizontal: 20, marginTop: 16,
    borderRadius: 14, borderWidth: 1, padding: 14,
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
  },
  errorText: { flex: 1, fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  loadingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 54,
  },
  loadingText: { fontSize: FontSize.md, fontFamily: Font.medium },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, borderTopWidth: 1,
  },
});
