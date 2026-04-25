import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { getBatch, pvpWeighBatch, type ApiBatchDetail } from '@/src/features/batch/services/batch-api';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

function mediaUrl(key: string) {
  return `${API_BASE}/v1/media/${key}`;
}

function formatMaterial(m: string) {
  return m.toUpperCase();
}

function Row({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

function PvpCosignSkeleton() {
  const c = useThemeColors();

  return (
    <>
      <View style={styles.topBar}>
        <View style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border }]} />
        <SkeletonBox width={120} height={20} radius={7} />
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.photoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.photo, { backgroundColor: c.border }]} />
          <View style={styles.photoFooter}>
            <SkeletonBox width={90} height={24} radius={8} />
            <SkeletonBox width={110} height={26} radius={13} />
          </View>
        </View>

        {[0, 1].map((section) => (
          <View key={section} style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <SkeletonBox width={110} height={16} radius={6} />
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.row}>
                <SkeletonBox width="32%" height={12} radius={6} />
                <SkeletonBox width="34%" height={14} radius={6} />
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

export default function PvpCosignScreen() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = usePvpAuth();

  const [batch, setBatch] = useState<ApiBatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [actualWeightKg, setActualWeightKg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id || !token) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await getBatch(token!, id);
        if (!cancelled) setBatch(data);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load batch');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, token]);

  async function handleWeigh() {
    if (!batch || !token) return;

    const grams = Math.round(parseFloat(actualWeightKg) * 1000);
    if (!grams || grams <= 0) {
      setSubmitError('Enter a valid actual weight.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let lat = 0;
      let lng = 0;
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          // GPS unavailable — backend skips geofence check if 0,0
        }
      }

      await pvpWeighBatch(token, batch.id, {
        actual_weight_grams: grams,
        latitude: lat,
        longitude: lng,
        weighed_at: new Date().toISOString(),
      });

      setDone(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to submit weight. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}25` }]}>
            <Ionicons name="checkmark-circle" size={52} color={c.accent} />
          </View>
          <Text style={[styles.successTitle, { color: c.foreground }]}>Weight Submitted!</Text>
          <Text style={[styles.successSub, { color: c.textSecondary }]}>
            Batch weighed successfully. Waiting for the supplier to approve the co-sign.
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: c.accent }]}
            onPress={() => router.replace('/(pvp-tabs)/dashboard')}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneBtnLabel, { color: c.accentContrast }]}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <PvpCosignSkeleton />
      </SafeAreaView>
    );
  }

  // ── Error / not found ──────────────────────────────────────────────────────
  if (loadError || !batch) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={36} color={c.error} />
          <Text style={[styles.errorTitle, { color: c.foreground }]}>Batch not found</Text>
          <Text style={[styles.errorSub, { color: c.textMuted }]}>{loadError ?? 'Check the QR code and try again.'}</Text>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={[styles.backBtnLabel, { color: c.foreground }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const photoMedia = batch.media.find((m) => m.media_kind === 'photo');
  const photoUri = photoMedia ? mediaUrl(photoMedia.storage_key) : null;
  const estimatedKg = batch.estimated_weight_grams != null
    ? (batch.estimated_weight_grams / 1000).toFixed(1)
    : '-';
  const shortId = batch.id.slice(0, 8).toUpperCase();
  const alreadyCosigned = batch.status !== 'accepted';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: c.foreground }]}>Co-sign Batch</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <View style={[styles.photoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={[styles.photo, { backgroundColor: c.border, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="image-outline" size={40} color={c.textMuted} />
            </View>
          )}
          <View style={styles.photoFooter}>
            <Text style={[styles.batchShortId, { color: c.foreground }]}>{shortId}</Text>
            <View style={[styles.statusPill, {
              backgroundColor: alreadyCosigned ? `${c.accent}18` : `${'#f59e0b'}20`,
              borderColor: alreadyCosigned ? `${c.accent}30` : `${'#f59e0b'}40`,
            }]}>
              <Text style={[styles.statusPillText, { color: alreadyCosigned ? c.accent : '#f59e0b' }]}>
                {alreadyCosigned ? 'Already co-signed' : 'Awaiting co-sign'}
              </Text>
            </View>
          </View>
        </View>

        {/* Batch info */}
        <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Batch Info</Text>
          <Row label="Batch ID" value={batch.id} />
          <Row label="Material" value={formatMaterial(batch.material)} />
          <Row label="Estimated Weight" value={`${estimatedKg} kg`} />
          <Row label="Status" value={batch.status.replace(/_/g, ' ')} />
        </View>

        {/* Already co-signed notice */}
        {alreadyCosigned ? (
          <View style={[styles.noticeCard, { backgroundColor: `${c.accent}10`, borderColor: `${c.accent}20` }]}>
            <Ionicons name="information-circle-outline" size={18} color={c.accent} />
            <Text style={[styles.noticeText, { color: c.textSecondary }]}>
              This batch has already been co-signed and cannot be modified.
            </Text>
          </View>
        ) : (
          <>
            {/* Weight input */}
            <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Actual Weight</Text>
              <Text style={[styles.inputHint, { color: c.textMuted }]}>
                Weigh the batch and enter the confirmed weight below.
              </Text>
              <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.background }]}>
                <TextInput
                  value={actualWeightKg}
                  onChangeText={setActualWeightKg}
                  placeholder="0.0"
                  placeholderTextColor={c.textFaint}
                  keyboardType="decimal-pad"
                  style={[styles.weightInput, { color: c.foreground }]}
                />
                <Text style={[styles.unitLabel, { color: c.textSecondary }]}>kg</Text>
              </View>
            </View>

            {submitError && (
              <View style={[styles.errorCard, { backgroundColor: `${c.error}12`, borderColor: `${c.error}25` }]}>
                <Ionicons name="alert-circle-outline" size={16} color={c.error} />
                <Text style={[styles.errorCardText, { color: c.error }]}>{submitError}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {!alreadyCosigned && (
        <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
          {isSubmitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={c.accent} />
              <Text style={[styles.loadingText, { color: c.textSecondary }]}>Submitting weight...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.cosignBtn,
                { backgroundColor: actualWeightKg.trim() ? c.accent : c.border },
              ]}
              onPress={handleWeigh}
              disabled={!actualWeightKg.trim() || isSubmitting}
              activeOpacity={0.85}
            >
              <Ionicons name="scale-outline" size={20} color={actualWeightKg.trim() ? c.accentContrast : c.textMuted} />
              <Text style={[styles.cosignBtnLabel, { color: actualWeightKg.trim() ? c.accentContrast : c.textMuted }]}>
                Submit Weight
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  iconBtn: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: FontSize.lg, fontFamily: Font.bold },
  content: { padding: 20, gap: 14, paddingBottom: 24 },
  photoCard: { borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  photo: { width: '100%', height: 200 },
  photoFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  batchShortId: { fontSize: FontSize.xl, fontFamily: Font.bold },
  statusPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  statusPillText: { fontSize: FontSize.xs, fontFamily: Font.semiBold },
  infoCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  sectionTitle: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  rowLabel: { fontSize: FontSize.sm, fontFamily: Font.regular, flex: 1 },
  rowValue: { fontSize: FontSize.sm, fontFamily: Font.medium, flex: 2, textAlign: 'right' },
  inputHint: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20, marginTop: -4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 16, height: 56,
  },
  weightInput: { flex: 1, fontSize: FontSize['2xl'], fontFamily: Font.bold },
  unitLabel: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  noticeCard: {
    flexDirection: 'row', gap: 10, borderWidth: 1,
    borderRadius: 14, padding: 14, alignItems: 'flex-start',
  },
  noticeText: { flex: 1, fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  errorCard: {
    flexDirection: 'row', gap: 10, borderWidth: 1,
    borderRadius: 14, padding: 14, alignItems: 'flex-start',
  },
  errorCardText: { flex: 1, fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  footer: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, borderTopWidth: 1,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 54 },
  loadingText: { fontSize: FontSize.md, fontFamily: Font.medium },
  cosignBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 54, borderRadius: 16, gap: 10,
  },
  cosignBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  // Success state
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 16 },
  successIcon: { width: 96, height: 96, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: FontSize['2xl'], fontFamily: Font.bold, textAlign: 'center' },
  successSub: { fontSize: FontSize.md, fontFamily: Font.regular, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  doneBtn: { marginTop: 8, height: 52, borderRadius: 16, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  doneBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  // Error state
  errorTitle: { fontSize: FontSize.xl, fontFamily: Font.bold },
  errorSub: { fontSize: FontSize.md, fontFamily: Font.regular, textAlign: 'center', lineHeight: 22 },
  backBtn: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
});
