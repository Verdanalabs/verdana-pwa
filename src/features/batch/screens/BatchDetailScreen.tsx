import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/react-auth';
import QRCode from 'react-native-qrcode-svg';
import { MaterialBadge } from '@/src/shared/ui/MaterialBadge';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { StatusBadge } from '@/src/shared/ui/StatusBadge';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { getBatch, type ApiBatchDetail } from '@/src/features/batch/services/batch-api';
import type { BatchStatus } from '@/types';

import { runtimeConfig } from '@/src/shared/config/runtime-config';

const API_BASE = runtimeConfig.apiBaseUrl;

function mediaUrl(storageKey: string) {
  return `${API_BASE}/v1/media/${storageKey}`;
}

function statusToUi(status: string): BatchStatus {
  switch (status) {
    case 'pending':      return 'pending';
    case 'accepted':     return 'accepted';
    case 'cosigning':    return 'cosigning';
    case 'cosigned':     return 'cosigned';
    case 'mint_pending': return 'mint_pending';
    case 'mint_failed':  return 'mint_failed';
    case 'minted':       return 'minted';
    default:             return 'pending';
  }
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

interface TimelineEntry { label: string; timestamp?: string; }

function deriveTimeline(batch: ApiBatchDetail): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    { label: 'Batch Registered', timestamp: batch.created_at },
  ];
  if (batch.weighed_at) {
    entries.push({ label: 'Co-signed at Drop-off', timestamp: batch.weighed_at });
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

function BatchDetailSkeleton() {
  const c = useThemeColors();

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={[styles.headerButton, { backgroundColor: c.surface, borderColor: c.border }]} />
        <View style={styles.headerRight}>
          <View style={[styles.headerButton, { backgroundColor: c.surface, borderColor: c.border }]} />
        </View>
      </View>

      <View style={styles.headingBlock}>
        <View style={styles.headingTop}>
          <SkeletonBox width={90} height={28} radius={8} />
          <SkeletonBox width={92} height={24} radius={12} />
        </View>
        <SkeletonBox width="82%" height={14} radius={7} />
        <SkeletonBox width="66%" height={14} radius={7} />
      </View>

      <View style={[styles.photoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={[styles.photo, { backgroundColor: c.border }]} />
        <View style={styles.photoMeta}>
          <SkeletonBox width={60} height={22} radius={11} />
          <SkeletonBox width="44%" height={12} radius={6} />
        </View>
      </View>

      <View style={styles.infoGrid}>
        {[0, 1].map((row) => (
          <View key={row} style={styles.infoGridRow}>
            {[0, 1].map((card) => (
              <View key={card} style={[styles.infoCard, styles.infoCardHalf, { backgroundColor: c.surface, borderColor: c.border }]}>
                <SkeletonBox width="52%" height={12} radius={6} />
                <SkeletonBox width="58%" height={18} radius={7} />
              </View>
            ))}
          </View>
        ))}
      </View>

      {[0, 1].map((section) => (
        <View key={section} style={[styles.detailCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <SkeletonBox width={110} height={18} radius={6} />
          {[0, 1, 2].map((row) => (
            <View key={row} style={styles.detailRow}>
              <SkeletonBox width="30%" height={12} radius={6} />
              <SkeletonBox width="72%" height={14} radius={6} />
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

export default function BatchDetailRoute() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAccessToken } = usePrivy();

  const [batch, setBatch] = useState<ApiBatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load batch');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, getAccessToken]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <BatchDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (error || !batch) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <View style={styles.missingWrap}>
          <Text style={[styles.missingTitle, { color: c.foreground }]}>Batch not found</Text>
          <Text style={[styles.missingText, { color: c.textMuted }]}>
            {error ?? 'We could not find the batch you selected.'}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: c.accent }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={[styles.backButtonLabel, { color: c.accentContrast }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const uiStatus = statusToUi(batch.status);
  const photoMedia = batch.media.find((m) => m.media_kind === 'photo');
  const photoUri = photoMedia ? mediaUrl(photoMedia.storage_key) : null;
  const estimatedKg = batch.estimated_weight_grams != null
    ? (batch.estimated_weight_grams / 1000).toFixed(1)
    : '-';
  const actualKg = batch.actual_weight_grams != null
    ? (batch.actual_weight_grams / 1000).toFixed(1)
    : '-';
  const shortId = batch.id.slice(0, 8).toUpperCase();
  const timeline = deriveTimeline(batch);
  const isAwaitingSupplierApproval = batch.status === 'cosigning';
  const canShowDropOffQr = batch.status === 'accepted';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={c.foreground} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: c.surface, borderColor: c.border }]}
              onPress={() => setMenuOpen(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={c.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headingBlock}>
          <View style={styles.headingTop}>
            <Text style={[styles.batchId, { color: c.foreground }]}>{shortId}</Text>
            <StatusBadge status={uiStatus} />
          </View>
          <Text style={[styles.headingText, { color: c.textSecondary }]}>
            Review the batch record, material details, and every status update in one place.
          </Text>
        </View>

        {canShowDropOffQr && (
          <View style={[styles.qrCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.qrBox, { backgroundColor: c.background, borderColor: c.border }]}>
              <QRCode value={batch.id} size={220} backgroundColor="transparent" color={c.foreground} />
            </View>
            <Text style={[styles.qrCardTitle, { color: c.foreground, textAlign: 'center' }]}>Drop-off QR</Text>
            <Text style={[styles.qrCardHint, { color: c.textMuted }]}>
              Show this code to the PVP operator at drop-off. #{shortId}
            </Text>
          </View>
        )}

        {!canShowDropOffQr && batch.status === 'pending' && (
          <View style={[styles.qrCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.qrUnavailable, { backgroundColor: c.background, borderColor: c.border }]}>
              <Ionicons name="time-outline" size={28} color={c.textMuted} />
              <Text style={[styles.qrUnavailableText, { color: c.textSecondary }]}>
                QR handoff will appear here after the PVP operator accepts this batch.
              </Text>
            </View>
          </View>
        )}

        {isAwaitingSupplierApproval && (
          <View style={[styles.approvalCard, { backgroundColor: '#8b5cf610', borderColor: '#8b5cf640' }]}>
            <View style={styles.approvalCardHeader}>
              <Ionicons name="hourglass-outline" size={18} color="#8b5cf6" />
              <Text style={[styles.approvalCardTitle, { color: '#8b5cf6' }]}>Supplier approval required</Text>
            </View>
            <Text style={[styles.approvalCardBody, { color: c.textSecondary }]}>
              PVP has already weighed this batch. Review the measured weight and continue to the approval screen to co-sign.
            </Text>
            <TouchableOpacity
              style={[styles.approvalCardButton, { backgroundColor: '#8b5cf6' }]}
              onPress={() => router.push(`/batch/approve-cosign?id=${batch.id}` as never)}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.approvalCardButtonLabel}>Approve Co-sign</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.photoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={[styles.photo, { backgroundColor: c.border, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="image-outline" size={40} color={c.textMuted} />
            </View>
          )}
          <View style={styles.photoMeta}>
            <MaterialBadge material={batch.material.toUpperCase() as never} />
            <Text style={[styles.photoTime, { color: c.textMuted }]}>
              Captured {formatDateTime(photoMedia?.captured_at ?? batch.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoGridRow}>
            <View style={[styles.infoCard, styles.infoCardHalf, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Estimated Weight</Text>
              <Text style={[styles.infoValue, { color: c.foreground }]}>{estimatedKg} kg</Text>
            </View>
            <View style={[styles.infoCard, styles.infoCardHalf, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Actual Weight</Text>
              <Text style={[styles.infoValue, { color: c.foreground }]}>{actualKg}</Text>
            </View>
          </View>
          <View style={styles.infoGridRow}>
            <View style={[styles.infoCard, styles.infoCardHalf, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Status</Text>
              <Text style={[styles.infoValue, { color: c.foreground }]}>{batch.status.replace(/_/g, ' ')}</Text>
            </View>
            <View style={[styles.infoCard, styles.infoCardHalf, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Material</Text>
              <Text style={[styles.infoValue, { color: c.foreground }]}>{batch.material.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.detailCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Batch Details</Text>
          <DetailRow label="Batch ID" value={batch.id} />
          <DetailRow label="Submitted" value={formatDateTime(batch.created_at)} />
          <DetailRow label="Co-signed" value={formatDateTime(batch.weighed_at)} />
          <DetailRow label="Asset Ready" value={formatDateTime(batch.cnft_record?.minted_at)} />
          <DetailRow label="Asset ID" value={batch.cnft_record?.asset_id ?? '-'} />
          {batch.batch_metadata?.ipfs_cid && (
            <DetailRow label="IPFS CID" value={batch.batch_metadata.ipfs_cid} />
          )}
        </View>

        <View style={[styles.detailCard, { backgroundColor: c.surface, borderColor: c.border }]}>
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

      <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuOpen(false)}>
          <Pressable
            style={[styles.actionSheet, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => {}}
          >
            <Text style={[styles.actionTitle, { color: c.foreground }]}>Batch Actions</Text>
            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.8}
              onPress={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(batch.id);
                }
                setMenuOpen(false);
              }}
            >
              <Ionicons name="copy-outline" size={18} color={c.textSecondary} />
              <Text style={[styles.actionLabel, { color: c.foreground }]}>Copy Batch ID</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionRow} activeOpacity={0.8} onPress={() => setMenuOpen(false)}>
              <Ionicons name="close-outline" size={18} color={c.textSecondary} />
              <Text style={[styles.actionLabel, { color: c.foreground }]}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {isAwaitingSupplierApproval && (
        <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
          <TouchableOpacity
            style={[styles.footerButton, { backgroundColor: '#8b5cf6' }]}
            onPress={() => router.push(`/batch/approve-cosign?id=${batch.id}` as never)}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.footerButtonLabel}>Approve Co-sign</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 18, paddingBottom: 36 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerRight: { flexDirection: 'row', gap: 10 },
  headerButton: {
    width: 42, height: 42, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  headingBlock: { gap: 8 },
  headingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  batchId: { fontSize: FontSize['2xl'], fontFamily: Font.bold },
  headingText: { fontSize: FontSize.md, fontFamily: Font.regular, lineHeight: 22, maxWidth: 300 },
  qrCard: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 14, alignItems: 'center' },
  qrCardTitle: { fontSize: FontSize.lg, fontFamily: Font.bold },
  qrCardHint: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20, textAlign: 'center' },
  qrUnavailable: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 160,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  qrUnavailableText: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20, textAlign: 'center' },
  photoCard: { borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  photo: { width: '100%', height: 220 },
  photoMeta: { padding: 14, gap: 8 },
  photoTime: { fontSize: FontSize.sm, fontFamily: Font.regular },
  infoGrid: { gap: 10 },
  infoGridRow: { flexDirection: 'row', gap: 10 },
  infoCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 13, gap: 10, minHeight: 98, justifyContent: 'space-between' },
  infoCardHalf: { flex: 1 },
  infoLabel: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 18 },
  infoValue: { fontSize: FontSize.lg, fontFamily: Font.semiBold, lineHeight: 26 },
  detailCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 14 },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: Font.bold },
  approvalCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  approvalCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  approvalCardTitle: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  approvalCardBody: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  approvalCardButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 46, borderRadius: 14, gap: 8,
  },
  approvalCardButtonLabel: { fontSize: FontSize.sm, fontFamily: Font.semiBold, color: '#fff' },
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
  missingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 10 },
  missingTitle: { fontSize: FontSize.xl, fontFamily: Font.bold },
  missingText: { fontSize: FontSize.md, fontFamily: Font.regular, textAlign: 'center' },
  backButton: { marginTop: 8, height: 48, borderRadius: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  backButtonLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  qrBox: { borderWidth: 1, borderRadius: 18, padding: 20, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', padding: 20 },
  actionSheet: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 6 },
  actionTitle: { fontSize: FontSize.lg, fontFamily: Font.bold, marginBottom: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  actionLabel: { fontSize: FontSize.md, fontFamily: Font.medium },
  footer: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, borderTopWidth: 1 },
  footerButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 54, borderRadius: 16, gap: 10,
  },
  footerButtonLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold, color: '#fff' },
});
