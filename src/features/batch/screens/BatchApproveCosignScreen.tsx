import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { usePrivy } from '@privy-io/react-auth';
import * as Location from 'expo-location';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { getBatch, cosignBatch, type ApiBatchDetail } from '@/src/features/batch/services/batch-api';

function Row({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

function BatchApproveCosignSkeleton() {
  const c = useThemeColors();

  return (
    <>
      <View style={styles.topBar}>
        <View style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border }]} />
        <SkeletonBox width={130} height={20} radius={7} />
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <SkeletonBox width="46%" height={16} radius={6} />
          <SkeletonBox width="82%" height={12} radius={6} />
          <SkeletonBox width="70%" height={12} radius={6} />
        </View>

        {[0, 1].map((section) => (
          <View key={section} style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <SkeletonBox width={110} height={16} radius={6} />
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.row}>
                <SkeletonBox width="32%" height={12} radius={6} />
                <SkeletonBox width="28%" height={14} radius={6} />
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

export default function BatchApproveCosignScreen() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { getAccessToken } = usePrivy();

  const [batch, setBatch] = useState<ApiBatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const data = await getBatch(token, id);
        if (!cancelled) setBatch(data);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load batch');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, getAccessToken]);

  const [approveStep, setApproveStep] = useState<string | null>(null);

  async function acquireLocationWithRetry(): Promise<Location.LocationObject> {
    // Accept a position cached within the last 10 s to avoid a cold-start GPS fix.
    try {
      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch {
      // First attempt failed (likely kCLErrorLocationUnknown while GPS is acquiring).
      // Retry up to 2 more times with a short delay.
    }

    const MAX_RETRIES = 2;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      setApproveStep(`Getting location… (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));
      try {
        return await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (err) {
        if (attempt === MAX_RETRIES) throw err;
      }
    }
    // Unreachable, but satisfies TypeScript.
    throw new Error('Unable to acquire GPS location.');
  }

  async function handleApprove() {
    if (!batch || !user) return;
    setIsApproving(true);
    setApproveError(null);
    setApproveStep('Checking location permission…');

    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Aktifkan izin lokasi supaya sistem bisa memvalidasi kamu berada dekat processor.');
      }

      setApproveStep('Getting your location…');
      let location: Location.LocationObject;
      try {
        location = await acquireLocationWithRetry();
      } catch {
        throw new Error('Could not get your GPS location. Please step outside or try again in a moment.');
      }

      setApproveStep('Submitting…');
      await cosignBatch(token, batch.id, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setDone(true);
    } catch (e) {
      setApproveError(e instanceof Error ? e.message : 'Failed to approve. Please try again.');
    } finally {
      setIsApproving(false);
      setApproveStep(null);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}25` }]}>
            <Ionicons name="checkmark-circle" size={52} color={c.accent} />
          </View>
          <Text style={[styles.successTitle, { color: c.foreground }]}>Co-sign Approved!</Text>
          <Text style={[styles.successSub, { color: c.textSecondary }]}>
            Your batch has been co-signed. The asset will be minted shortly.
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: c.accent }]}
            onPress={() => router.replace('/(supplier-tabs)/history' as never)}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneBtnLabel, { color: c.accentContrast }]}>View History</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <BatchApproveCosignSkeleton />
      </SafeAreaView>
    );
  }

  if (loadError || !batch) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={36} color={c.error ?? '#ef4444'} />
          <Text style={[styles.errorTitle, { color: c.foreground }]}>Batch not found</Text>
          <Text style={[styles.errorSub, { color: c.textMuted }]}>{loadError}</Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={[styles.backLink, { color: c.accent }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const estKg = batch.estimated_weight_grams != null
    ? (batch.estimated_weight_grams / 1000).toFixed(1)
    : '—';
  const actualKg = batch.actual_weight_grams != null
    ? (batch.actual_weight_grams / 1000).toFixed(1)
    : '—';
  const shortId = batch.id.slice(0, 8).toUpperCase();
  const isCosigning = batch.status === 'cosigning';

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
        <Text style={[styles.topTitle, { color: c.foreground }]}>Approve Co-sign</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status header */}
        <View style={[styles.statusCard, {
          backgroundColor: isCosigning ? '#8b5cf610' : `${c.surface}`,
          borderColor: isCosigning ? '#8b5cf640' : c.border,
        }]}>
          <View style={styles.statusRow}>
            <Ionicons
              name={isCosigning ? 'hourglass-outline' : 'information-circle-outline'}
              size={20}
              color={isCosigning ? '#8b5cf6' : c.textSecondary}
            />
            <Text style={[styles.statusCardTitle, { color: isCosigning ? '#8b5cf6' : c.foreground }]}>
              {isCosigning
                ? 'Processor has weighed your batch'
                : `Batch status: ${batch.status.replace(/_/g, ' ')}`}
            </Text>
          </View>
          {isCosigning && (
            <Text style={[styles.statusCardBody, { color: c.textSecondary }]}>
              Review the actual weight below. If it looks correct, tap Approve to complete the co-sign.
            </Text>
          )}
        </View>

        {/* Batch info */}
        <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Batch Details</Text>
          <Row label="Batch ID" value={shortId} />
          <Row label="Material" value={batch.material.toUpperCase()} />
          <Row label="Est. Weight" value={`${estKg} kg`} />
        </View>

        {/* Weight comparison */}
        {isCosigning && (
          <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Weight Comparison</Text>
            <Row label="You Estimated" value={`${estKg} kg`} />
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <View style={styles.actualRow}>
              <Text style={[styles.rowLabel, { color: c.textMuted }]}>Processor Measured</Text>
              <Text style={[styles.actualValue, { color: c.accent }]}>{actualKg} kg</Text>
            </View>
          </View>
        )}

        {approveError && (
          <View style={[styles.errorCard, { backgroundColor: '#ef444412', borderColor: '#ef444425' }]}>
            <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
            <Text style={[styles.errorCardText, { color: '#ef4444' }]}>{approveError}</Text>
          </View>
        )}

        {!isCosigning && (
          <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.rowLabel, { color: c.textMuted }]}>
              This batch is not currently awaiting your co-sign approval.
            </Text>
          </View>
        )}
      </ScrollView>

      {isCosigning && (
        <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
          {isApproving ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={c.accent} />
              <Text style={[styles.loadingText, { color: c.textSecondary }]}>
                {approveStep ?? 'Approving…'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.approveBtn, { backgroundColor: c.accent }]}
              onPress={handleApprove}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={c.accentContrast} />
              <Text style={[styles.approveBtnLabel, { color: c.accentContrast }]}>Approve Co-sign</Text>
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
  statusCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusCardTitle: { fontFamily: Font.semiBold, fontSize: FontSize.md, flex: 1 },
  statusCardBody: { fontFamily: Font.regular, fontSize: FontSize.sm, lineHeight: 20 },
  infoCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  sectionTitle: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: FontSize.sm, fontFamily: Font.regular, flex: 1 },
  rowValue: { fontSize: FontSize.sm, fontFamily: Font.medium, flex: 2, textAlign: 'right' },
  divider: { height: 1, marginVertical: 4 },
  actualRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actualValue: { fontSize: FontSize.xl, fontFamily: Font.bold },
  errorCard: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  errorCardText: { flex: 1, fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, borderTopWidth: 1 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 54 },
  loadingText: { fontSize: FontSize.md, fontFamily: Font.medium },
  approveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 16, gap: 10 },
  approveBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 16 },
  successIcon: { width: 96, height: 96, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: FontSize['2xl'], fontFamily: Font.bold, textAlign: 'center' },
  successSub: { fontSize: FontSize.md, fontFamily: Font.regular, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  doneBtn: { marginTop: 8, height: 52, borderRadius: 16, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  doneBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  errorTitle: { fontSize: FontSize.xl, fontFamily: Font.bold },
  errorSub: { fontSize: FontSize.md, fontFamily: Font.regular, textAlign: 'center', lineHeight: 22 },
  backLink: { fontSize: FontSize.md, fontFamily: Font.semiBold },
});
