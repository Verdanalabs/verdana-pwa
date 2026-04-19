import { useState } from 'react';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaterialBadge } from '@/src/shared/ui/MaterialBadge';
import { StatusBadge } from '@/src/shared/ui/StatusBadge';
import { BATCH_STATUS_LABEL } from '@/src/shared/lib/batch-status';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { getMockBatchById } from '@/src/shared/services/mock/batch-data';
import { getMockWalletAssetByBatchId } from '@/src/shared/services/mock/wallet-data';
import type { BatchStatus } from '@/types';

const BATCH_PHOTO_FALLBACKS: Record<string, number> = {
  'B-0047': require('@/assets/carousle/01-image.jpg'),
  'B-0046': require('@/assets/carousle/02-image.jpg'),
  'B-0045': require('@/assets/carousle/03-image.jpg'),
  'B-0044': require('@/assets/carousle/01-image.jpg'),
};

function formatDateTime(iso?: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDropOffName(name: string) {
  return name.replace(/\s+Drop-off$/i, '').trim();
}

function TimelineItem({
  status,
  timestamp,
  note,
  isLast,
}: {
  status: BatchStatus;
  timestamp: string;
  note?: string;
  isLast: boolean;
}) {
  const c = useThemeColors();

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, { backgroundColor: c.accent }]} />
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: c.border }]} />}
      </View>

      <View style={styles.timelineCopy}>
        <Text style={[styles.timelineTitle, { color: c.foreground }]}>{BATCH_STATUS_LABEL[status]}</Text>
        <Text style={[styles.timelineTime, { color: c.textMuted }]}>{formatDateTime(timestamp)}</Text>
        {!!note && <Text style={[styles.timelineNote, { color: c.textSecondary }]}>{note}</Text>}
      </View>
    </View>
  );
}

export default function BatchDetailRoute() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const batch = getMockBatchById(id);
  const linkedAsset = getMockWalletAssetByBatchId(id);
  const [menuOpen, setMenuOpen] = useState(false);
  const batchPhoto = linkedAsset?.imageUrl
    ? { uri: linkedAsset.imageUrl }
    : id
      ? BATCH_PHOTO_FALLBACKS[id] ?? BATCH_PHOTO_FALLBACKS['B-0047']
      : BATCH_PHOTO_FALLBACKS['B-0047'];

  if (!batch) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <View style={styles.missingWrap}>
          <Text style={[styles.missingTitle, { color: c.foreground }]}>Batch not found</Text>
          <Text style={[styles.missingText, { color: c.textMuted }]}>
            We could not find the batch you selected.
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

          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => setMenuOpen(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={c.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.headingBlock}>
          <View style={styles.headingTop}>
            <Text style={[styles.batchId, { color: c.foreground }]}>{batch.id}</Text>
            <StatusBadge status={batch.status} />
          </View>
          <Text style={[styles.headingText, { color: c.textSecondary }]}>
            Review the batch record, material details, and every status update in one place.
          </Text>
        </View>

        <View style={[styles.photoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Image source={batchPhoto} style={styles.photo} contentFit="cover" />
          <View style={styles.photoMeta}>
            <MaterialBadge material={batch.materialType} />
            <Text style={[styles.photoTime, { color: c.textMuted }]}>
              Captured {formatDateTime(batch.capturedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoGridTop}>
            <View style={[styles.infoCard, styles.infoCardHalf, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Estimated Weight</Text>
              <Text style={[styles.infoValue, { color: c.foreground }]}>{batch.estimatedWeightKg} kg</Text>
            </View>
            <View style={[styles.infoCard, styles.infoCardHalf, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Actual Weight</Text>
              <Text style={[styles.infoValue, { color: c.foreground }]}>
                {batch.actualWeightKg ? `${batch.actualWeightKg} kg` : '-'}
              </Text>
            </View>
          </View>

          <View style={styles.infoGridBottom}>
            <View style={[styles.infoCard, styles.infoCardHalf, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Grade</Text>
              <Text style={[styles.infoValue, { color: c.foreground }]}>{batch.grade}</Text>
            </View>
            <View style={[styles.infoCard, styles.infoCardHalf, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Drop-off Point</Text>
              <Text style={[styles.infoValue, styles.infoValueMultiline, { color: c.foreground }]}>
                {formatDropOffName(batch.pvpName)}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.detailCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Batch Details</Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Submitted</Text>
            <Text style={[styles.detailValue, { color: c.foreground }]}>{formatDateTime(batch.submittedAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Validated</Text>
            <Text style={[styles.detailValue, { color: c.foreground }]}>{formatDateTime(batch.validatedAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Asset Ready</Text>
            <Text style={[styles.detailValue, { color: c.foreground }]}>{formatDateTime(batch.mintedAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Asset ID</Text>
            <Text style={[styles.detailValue, { color: c.foreground }]}>{batch.cnftId ?? '-'}</Text>
          </View>
        </View>

        <View style={[styles.detailCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Timeline</Text>
          <View style={styles.timelineWrap}>
            {batch.timeline.map((item, index) => (
              <TimelineItem
                key={`${item.status}-${item.timestamp}`}
                status={item.status}
                timestamp={item.timestamp}
                note={item.actor ? `Updated by ${item.actor}` : item.note}
                isLast={index === batch.timeline.length - 1}
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

            <TouchableOpacity style={styles.actionRow} activeOpacity={0.8} onPress={() => setMenuOpen(false)}>
              <Ionicons name="copy-outline" size={18} color={c.textSecondary} />
              <Text style={[styles.actionLabel, { color: c.foreground }]}>Copy Batch ID</Text>
            </TouchableOpacity>

            {linkedAsset ? (
              <TouchableOpacity
                style={styles.actionRow}
                activeOpacity={0.8}
                onPress={() => {
                  setMenuOpen(false);
                  router.push(`/wallet/cnft/${linkedAsset.id}` as never);
                }}
              >
                <Ionicons name="cube-outline" size={18} color={c.textSecondary} />
                <Text style={[styles.actionLabel, { color: c.foreground }]}>View Asset</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.actionRow} activeOpacity={0.8} onPress={() => setMenuOpen(false)}>
              <Ionicons name="location-outline" size={18} color={c.textSecondary} />
              <Text style={[styles.actionLabel, { color: c.foreground }]}>Copy Drop-off Point</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} activeOpacity={0.8} onPress={() => setMenuOpen(false)}>
              <Ionicons name="close-outline" size={18} color={c.textSecondary} />
              <Text style={[styles.actionLabel, { color: c.foreground }]}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingBlock: {
    gap: 8,
  },
  headingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  batchId: {
    fontSize: FontSize['2xl'],
    fontFamily: Font.bold,
  },
  headingText: {
    fontSize: FontSize.md,
    fontFamily: Font.regular,
    lineHeight: 22,
    maxWidth: 300,
  },
  photoCard: {
    borderWidth: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 220,
  },
  photoMeta: {
    padding: 14,
    gap: 8,
  },
  photoTime: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  infoGrid: {
    gap: 10,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    minHeight: 98,
    justifyContent: 'space-between',
  },
  infoGridTop: {
    flexDirection: 'row',
    gap: 10,
  },
  infoGridBottom: {
    flexDirection: 'row',
    gap: 10,
  },
  infoCardHalf: {
    flex: 1,
  },
  infoCardFull: {
    width: '100%',
  },
  infoLabel: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 18,
  },
  infoValue: {
    fontSize: FontSize.lg,
    fontFamily: Font.semiBold,
    lineHeight: 26,
  },
  infoValueMultiline: {
    lineHeight: 25,
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: Font.bold,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
    lineHeight: 20,
  },
  timelineWrap: {
    gap: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineRail: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 5,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 6,
    minHeight: 34,
    borderRadius: 999,
  },
  timelineCopy: {
    flex: 1,
    paddingBottom: 14,
    gap: 3,
  },
  timelineTitle: {
    fontSize: FontSize.md,
    fontFamily: Font.semiBold,
  },
  timelineTime: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  timelineNote: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
  },
  missingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  missingTitle: {
    fontSize: FontSize.xl,
    fontFamily: Font.bold,
  },
  missingText: {
    fontSize: FontSize.md,
    fontFamily: Font.regular,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 8,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonLabel: {
    fontSize: FontSize.md,
    fontFamily: Font.semiBold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  actionSheet: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  actionTitle: {
    fontSize: FontSize.lg,
    fontFamily: Font.bold,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  actionLabel: {
    fontSize: FontSize.md,
    fontFamily: Font.medium,
  },
});
