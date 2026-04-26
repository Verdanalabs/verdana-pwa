import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { acceptBatch, getBatch, type ApiBatchDetail } from '@/src/features/batch/services/batch-api';
import { ApiError } from '@/src/shared/services/api';
import { runtimeConfig } from '@/src/shared/config/runtime-config';

const API_BASE = runtimeConfig.apiBaseUrl;

function mediaUrl(storageKey: string) {
  return `${API_BASE}/v1/media/${storageKey}`;
}

const MATERIAL_COLOR: Record<string, string> = {
  PET: '#3b82f6',
  HDPE: '#10b981',
  LDPE: '#f59e0b',
  PP: '#f97316',
  PVC: '#ef4444',
  PS: '#8b5cf6',
};

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function statusLabel(status: string) {
  switch (status) {
    case 'pending':      return 'PENDING REVIEW';
    case 'accepted':     return 'READY TO WEIGH';
    case 'cosigning':    return 'AWAITING SIGN';
    case 'cosigned':     return 'COSIGNED';
    case 'mint_pending': return 'MINTING...';
    case 'minted':       return 'MINTED';
    default:             return status.toUpperCase();
  }
}

function statusColor(status: string, accent: string) {
  switch (status) {
    case 'pending':      return '#f59e0b';
    case 'accepted':     return accent;
    case 'cosigning':    return '#8b5cf6';
    case 'cosigned':     return '#3b82f6';
    case 'minted':       return '#10b981';
    default:             return '#6b7280';
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  const c = useThemeColors();

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <View style={[styles.topBarBtn, { backgroundColor: c.surface, borderColor: c.border }]} />
      </View>

      <View style={styles.headingBlock}>
        <SkeletonBox width={90} height={28} radius={8} />
        <SkeletonBox width={92} height={24} radius={12} />
        <SkeletonBox width="82%" height={14} radius={7} />
      </View>

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={[styles.photoPlaceholder, { backgroundColor: c.border }]} />
        <View style={{ padding: 14, gap: 8 }}>
          <SkeletonBox width={60} height={22} radius={11} />
          <SkeletonBox width="44%" height={12} radius={6} />
        </View>
      </View>

      <View style={styles.infoGrid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <SkeletonBox width="52%" height={12} radius={6} />
            <SkeletonBox width="58%" height={18} radius={7} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ── Detail row ────────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────

interface TimelineEntry { label: string; timestamp?: string; }

function deriveTimeline(batch: ApiBatchDetail): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    { label: 'Batch Registered', timestamp: batch.created_at },
  ];
  if (batch.weighed_at) {
    entries.push({ label: 'Weighed at PVP', timestamp: batch.weighed_at });
  }
  if (batch.cosign_event?.signed_at) {
    entries.push({ label: 'Co-signed', timestamp: batch.cosign_event.signed_at });
  }
  if (batch.cnft_record?.minted_at) {
    entries.push({ label: 'cNFT Asset Minted', timestamp: batch.cnft_record.minted_at });
  }
  return entries;
}

function TimelineItem({ label, timestamp, isLast }: { label: string; timestamp?: string; isLast: boolean }) {
  const c = useThemeColors();
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, { backgroundColor: c.accent }]} />
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: c.border }]} />}
      </View>
      <View style={styles.timelineCopy}>
        <Text style={[styles.timelineTitle, { color: c.foreground }]}>{label}</Text>
        <Text style={[styles.timelineTime, { color: c.textMuted }]}>{formatDateTime(timestamp)}</Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PvpBatchDetailScreen() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = usePvpAuth();

  const [batch, setBatch] = useState<ApiBatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || !token) return;
    setError(null);
    try {
      const data = await getBatch(token, id);
      setBatch(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load batch');
    } finally {
      setIsLoading(false);
    }
  }, [id, token]);

  useFocusEffect(useCallback(() => {
    setIsLoading(true);
    void load();
  }, [load]));

  const handleAccept = useCallback(async () => {
    if (!token || !batch) return;
    setIsAccepting(true);
    setActionError(null);
    try {
      await acceptBatch(token, batch.id);
      await load();
    } catch (e) {
      if (e instanceof ApiError) {
        setActionError(e.message);
      } else {
        setActionError('Failed to accept batch');
      }
    } finally {
      setIsAccepting(false);
    }
  }, [batch, load, token]);

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length <= 1) {
      router.replace('/(pvp-tabs)/dashboard' as never);
      return;
    }
    router.back();
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <DetailSkeleton />
      </SafeAreaView>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !batch) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={c.textMuted} />
          <Text style={[styles.missingTitle, { color: c.foreground }]}>Batch not found</Text>
          <Text style={[styles.missingText, { color: c.textMuted }]}>
            {error ?? 'We could not find the batch you selected.'}
          </Text>
          <TouchableOpacity
            style={[styles.goBackBtn, { backgroundColor: c.accent }]}
            onPress={handleBack}
            activeOpacity={0.85}
          >
            <Text style={[styles.goBackBtnLabel, { color: c.accentContrast }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const isPending = batch.status === 'pending';
  const isAccepted = batch.status === 'accepted';
  const isCosigning = batch.status === 'cosigning';
  const sColor = statusColor(batch.status, c.accent);
  const matColor = MATERIAL_COLOR[batch.material.toUpperCase()] ?? c.accent;
  const photoMedia = batch.media.find((m) => m.media_kind === 'photo');
  const photoUri = photoMedia ? mediaUrl(photoMedia.storage_key) : null;
  const estimatedKg = batch.estimated_weight_grams != null
    ? (batch.estimated_weight_grams / 1000).toFixed(1) : '-';
  const actualKg = batch.actual_weight_grams != null
    ? (batch.actual_weight_grams / 1000).toFixed(1) : '-';
  const sid = shortId(batch.id);
  const timeline = deriveTimeline(batch);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.topBarBtn, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={c.foreground} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: c.foreground }]}>Batch Detail</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* Heading */}
        <View style={styles.headingBlock}>
          <View style={styles.headingTop}>
            <Text style={[styles.batchId, { color: c.foreground }]}>{sid}</Text>
            <View style={[styles.statusPill, { backgroundColor: `${sColor}14`, borderColor: `${sColor}30` }]}>
              <Text style={[styles.statusPillText, { color: sColor }]}>{statusLabel(batch.status)}</Text>
            </View>
          </View>
          <Text style={[styles.headingSub, { color: c.textSecondary }]}>
            Review the batch details and take the appropriate action from this screen.
          </Text>
        </View>

        {/* Action error */}
        {actionError && (
          <View style={[styles.errorBanner, { backgroundColor: `${c.error}10`, borderColor: `${c.error}24` }]}>
            <Ionicons name="alert-circle-outline" size={16} color={c.error} />
            <Text style={[styles.errorBannerText, { color: c.error }]}>{actionError}</Text>
          </View>
        )}

        {/* Status-appropriate call-to-action card */}
        {isPending && (
          <View style={[styles.actionCard, { backgroundColor: '#f59e0b0c', borderColor: '#f59e0b30' }]}>
            <View style={styles.actionCardHeader}>
              <Ionicons name="document-text-outline" size={18} color="#f59e0b" />
              <Text style={[styles.actionCardTitle, { color: '#f59e0b' }]}>Pending review</Text>
            </View>
            <Text style={[styles.actionCardBody, { color: c.textSecondary }]}>
              This batch has been submitted by the supplier and is waiting for your review. Accept it to allow physical drop-off.
            </Text>
          </View>
        )}

        {isAccepted && (
          <View style={[styles.actionCard, { backgroundColor: `${c.accent}0c`, borderColor: `${c.accent}30` }]}>
            <View style={styles.actionCardHeader}>
              <Ionicons name="scale-outline" size={18} color={c.accent} />
              <Text style={[styles.actionCardTitle, { color: c.accent }]}>Ready for weigh-in</Text>
            </View>
            <Text style={[styles.actionCardBody, { color: c.textSecondary }]}>
              Batch has been accepted. The supplier can now present their QR code at the drop-off point. Scan and weigh to continue.
            </Text>
          </View>
        )}

        {isCosigning && (
          <View style={[styles.actionCard, { backgroundColor: '#8b5cf60c', borderColor: '#8b5cf630' }]}>
            <View style={styles.actionCardHeader}>
              <Ionicons name="hourglass-outline" size={18} color="#8b5cf6" />
              <Text style={[styles.actionCardTitle, { color: '#8b5cf6' }]}>Awaiting supplier approval</Text>
            </View>
            <Text style={[styles.actionCardBody, { color: c.textSecondary }]}>
              You have weighed this batch. The supplier needs to review and co-sign before minting can proceed.
            </Text>
          </View>
        )}

        {/* Photo card */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoImage} resizeMode="cover" />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: c.border }]}>
              <Ionicons name="image-outline" size={40} color={c.textMuted} />
            </View>
          )}
          <View style={{ padding: 14, gap: 8 }}>
            <View style={[styles.materialBadge, { backgroundColor: `${matColor}16`, borderColor: `${matColor}30` }]}>
              <Text style={[styles.materialBadgeText, { color: matColor }]}>{batch.material.toUpperCase()}</Text>
            </View>
            <Text style={[styles.photoTimestamp, { color: c.textMuted }]}>
              Captured {formatDateTime(photoMedia?.captured_at ?? batch.created_at)}
            </Text>
          </View>
        </View>

        {/* Info grid */}
        <View style={styles.infoGrid}>
          <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.infoLabel, { color: c.textMuted }]}>Estimated Weight</Text>
            <Text style={[styles.infoValue, { color: c.foreground }]}>{estimatedKg} kg</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.infoLabel, { color: c.textMuted }]}>Actual Weight</Text>
            <Text style={[styles.infoValue, { color: c.foreground }]}>{actualKg}</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.infoLabel, { color: c.textMuted }]}>Status</Text>
            <Text style={[styles.infoValue, { color: c.foreground }]}>{batch.status.replace(/_/g, ' ')}</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.infoLabel, { color: c.textMuted }]}>Material</Text>
            <Text style={[styles.infoValue, { color: c.foreground }]}>{batch.material.toUpperCase()}</Text>
          </View>
        </View>

        {/* Batch details card */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, padding: 16, gap: 14 }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Batch Details</Text>
          <DetailRow label="Batch ID" value={batch.id} />
          <DetailRow label="Submitted" value={formatDateTime(batch.created_at)} />
          <DetailRow label="Weighed" value={formatDateTime(batch.weighed_at)} />
          <DetailRow label="Asset Ready" value={formatDateTime(batch.cnft_record?.minted_at)} />
          <DetailRow label="Asset ID" value={batch.cnft_record?.asset_id ?? '-'} />
        </View>

        {/* Timeline card */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, padding: 16, gap: 14 }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Timeline</Text>
          <View style={styles.timelineWrap}>
            {timeline.map((item, index) => (
              <TimelineItem
                key={item.label}
                label={item.label}
                timestamp={item.timestamp}
                isLast={index === timeline.length - 1}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky footer for primary actions */}
      {(isPending || isAccepted) && (
        <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
          {isPending && (
            <TouchableOpacity
              style={[styles.footerBtn, { backgroundColor: '#f59e0b' }]}
              onPress={() => { void handleAccept(); }}
              activeOpacity={0.85}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.footerBtnLabel}>Accept Batch</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {isAccepted && (
            <TouchableOpacity
              style={[styles.footerBtn, { backgroundColor: c.accent }]}
              onPress={() => router.push(`/pvp/cosign?id=${batch.id}` as never)}
              activeOpacity={0.85}
            >
              <Ionicons name="qr-code-outline" size={20} color={c.accentContrast} />
              <Text style={[styles.footerBtnLabel, { color: c.accentContrast }]}>Scan QR & Weigh</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 18, paddingBottom: 36 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarBtn: {
    width: 42, height: 42, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  topBarTitle: { fontFamily: Font.bold, fontSize: FontSize.md, letterSpacing: 0.3 },
  headingBlock: { gap: 8 },
  headingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  batchId: { fontSize: FontSize['2xl'], fontFamily: Font.bold },
  headingSub: { fontSize: FontSize.md, fontFamily: Font.regular, lineHeight: 22, maxWidth: 300 },
  statusPill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  statusPillText: { fontFamily: Font.bold, fontSize: FontSize.xs, letterSpacing: 0.2 },

  errorBanner: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  errorBannerText: { flex: 1, fontFamily: Font.regular, fontSize: FontSize.sm, lineHeight: 20 },

  actionCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  actionCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionCardTitle: { fontFamily: Font.semiBold, fontSize: FontSize.md },
  actionCardBody: { fontFamily: Font.regular, fontSize: FontSize.sm, lineHeight: 20 },
  actionCardBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 46, borderRadius: 14, gap: 8,
  },
  actionCardBtnLabel: { fontSize: FontSize.sm, fontFamily: Font.semiBold, color: '#fff' },

  card: { borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  photoImage: { width: '100%', height: 220 },
  photoPlaceholder: { width: '100%', height: 220, alignItems: 'center', justifyContent: 'center' },
  photoTimestamp: { fontSize: FontSize.sm, fontFamily: Font.regular },
  materialBadge: {
    alignSelf: 'flex-start', borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  materialBadgeText: { fontFamily: Font.bold, fontSize: FontSize.xs },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoCard: {
    width: '48%', flexGrow: 1,
    borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 13,
    gap: 10, minHeight: 98, justifyContent: 'space-between',
  },
  infoLabel: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 18 },
  infoValue: { fontSize: FontSize.lg, fontFamily: Font.semiBold, lineHeight: 26 },

  sectionTitle: { fontSize: FontSize.lg, fontFamily: Font.bold },
  detailRow: { gap: 4 },
  detailLabel: { fontSize: FontSize.sm, fontFamily: Font.regular },
  detailValue: { fontSize: FontSize.sm, fontFamily: Font.medium, lineHeight: 20 },

  timelineWrap: { gap: 4 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineRail: { alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 999, marginTop: 5 },
  timelineLine: { width: 2, flex: 1, marginTop: 6, minHeight: 34, borderRadius: 999 },
  timelineCopy: { flex: 1, paddingBottom: 14, gap: 3 },
  timelineTitle: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  timelineTime: { fontSize: FontSize.sm, fontFamily: Font.regular },

  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 10 },
  missingTitle: { fontSize: FontSize.xl, fontFamily: Font.bold },
  missingText: { fontSize: FontSize.md, fontFamily: Font.regular, textAlign: 'center' },
  goBackBtn: { marginTop: 8, height: 48, borderRadius: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  goBackBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },

  footer: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, borderTopWidth: 1 },
  footerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 54, borderRadius: 16, gap: 10,
  },
  footerBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold, color: '#fff' },
});
