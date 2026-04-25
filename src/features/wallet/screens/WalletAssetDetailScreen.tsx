import { useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/react-auth';
import { MaterialBadge } from '@/src/shared/ui/MaterialBadge';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { getMe, type VerdanaUser } from '@/src/features/auth/services/auth-api';
import { getBatch, type ApiBatchDetail } from '@/src/features/batch/services/batch-api';
import type { CNFTStatus, MaterialType } from '@/types';

import { runtimeConfig } from '@/src/shared/config/runtime-config';

const API_BASE = runtimeConfig.apiBaseUrl;

function mediaUrl(storageKey: string) {
  return `${API_BASE}/v1/media/${storageKey}`;
}

function toMaterialType(material: string): MaterialType {
  switch (material.toUpperCase()) {
    case 'PET':
    case 'HDPE':
    case 'LDPE':
    case 'PP':
    case 'PS':
    case 'PVC':
      return material.toUpperCase() as MaterialType;
    default:
      return 'OTHER';
  }
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function AssetStatusPill({ status }: { status: CNFTStatus }) {
  const c = useThemeColors();

  const map: Record<CNFTStatus, { label: string; bg: string; fg: string }> = {
    minted: { label: 'Asset Ready', bg: c.statusBg.minted, fg: c.statusFg.minted },
  };

  return (
    <View style={[styles.statusPill, { backgroundColor: map[status].bg }]}>
      <Text style={[styles.statusPillText, { color: map[status].fg }]}>{map[status].label}</Text>
    </View>
  );
}

function WalletAssetDetailSkeleton() {
  const c = useThemeColors();

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={[styles.headerButton, { backgroundColor: c.surface, borderColor: c.border }]} />
        <View style={[styles.headerButton, { backgroundColor: c.surface, borderColor: c.border }]} />
      </View>

      <View style={[styles.heroCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={[styles.heroImage, styles.heroFallback, { backgroundColor: c.border }]} />
        <View style={styles.heroBody}>
          <View style={styles.heroTop}>
            <View style={styles.heroTopLeft}>
              <SkeletonBox width="48%" height={28} radius={8} />
              <SkeletonBox width={64} height={22} radius={11} />
            </View>
            <SkeletonBox width={88} height={26} radius={13} />
          </View>
          <SkeletonBox width="88%" height={14} radius={7} />
          <SkeletonBox width="72%" height={14} radius={7} />
        </View>
      </View>

      <View style={styles.infoRow}>
        {[0, 1].map((item) => (
          <View key={item} style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <SkeletonBox width="44%" height={12} radius={6} />
            <SkeletonBox width="58%" height={18} radius={7} />
          </View>
        ))}
      </View>

      {[0, 1, 2].map((section) => (
        <View key={section} style={[styles.detailCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <SkeletonBox width={120} height={18} radius={6} />
          {[0, 1, 2].map((row) => (
            <View key={row} style={styles.detailRow}>
              <SkeletonBox width="28%" height={12} radius={6} />
              <SkeletonBox width="74%" height={14} radius={6} />
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

export default function AssetDetailRoute() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAccessToken } = usePrivy();
  const [walletUser, setWalletUser] = useState<VerdanaUser | null>(null);
  const [batch, setBatch] = useState<ApiBatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const token = await getAccessToken();
        if (!token) throw new Error('Not authenticated');

        const [meData, batchData] = await Promise.all([
          getMe(token),
          getBatch(token, id),
        ]);

        if (cancelled) return;
        setWalletUser(meData);
        setBatch(batchData);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load asset');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [getAccessToken, id]);

  const asset = useMemo(() => {
    if (!batch?.cnft_record?.minted_at) return null;

    const photo = batch.media.find((item) => item.media_kind === 'photo');
    const assetId = batch.cnft_record.asset_id ?? batch.id;

    return {
      batchId: batch.id,
      assetId,
      mintedAt: batch.cnft_record.minted_at,
      materialType: toMaterialType(batch.material),
      weightKg: (batch.actual_weight_grams ?? batch.estimated_weight_grams ?? 0) / 1000,
      status: 'minted' as const,
      imageUrl: photo ? mediaUrl(photo.storage_key) : undefined,
      txSignature: batch.cnft_record.tx_signature,
      merkleTree: batch.cnft_record.merkle_tree,
      leafIndex: batch.cnft_record.leaf_index,
    };
  }, [batch]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <WalletAssetDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!asset || !batch) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <View style={styles.missingWrap}>
          <Text style={[styles.missingTitle, { color: c.foreground }]}>Asset not found</Text>
          <Text style={[styles.missingText, { color: c.textMuted }]}>
            {error ?? 'We could not find the asset you selected.'}
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: c.accent }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryButtonText, { color: c.accentContrast }]}>Go Back</Text>
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

        <View style={[styles.heroCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          {asset.imageUrl ? (
            <Image source={{ uri: asset.imageUrl }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroFallback, { backgroundColor: c.border }]}>
              <Ionicons name="image-outline" size={40} color={c.textMuted} />
            </View>
          )}
          <View style={styles.heroBody}>
            <View style={styles.heroTop}>
              <View style={styles.heroTopLeft}>
                <Text style={[styles.assetId, { color: c.foreground }]}>{shortAddress(asset.assetId)}</Text>
                <MaterialBadge material={asset.materialType} />
              </View>
              <AssetStatusPill status={asset.status} />
            </View>

            <Text style={[styles.heroText, { color: c.textSecondary }]}>
              This asset is linked to a verified supplier batch and stays available in your wallet.
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.infoLabel, { color: c.textMuted }]}>Weight</Text>
            <Text style={[styles.infoValue, { color: c.foreground }]}>{asset.weightKg.toFixed(1)} kg</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.infoLabel, { color: c.textMuted }]}>Material</Text>
            <Text style={[styles.infoValue, { color: c.foreground }]}>{asset.materialType}</Text>
          </View>
        </View>

        <View style={[styles.detailCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Asset Details</Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Asset ID</Text>
            <Text style={[styles.detailValue, { color: c.foreground }]}>{asset.assetId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Batch ID</Text>
            <Text style={[styles.detailValue, { color: c.foreground }]}>{asset.batchId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Minted</Text>
            <Text style={[styles.detailValue, { color: c.foreground }]}>{formatDateTime(asset.mintedAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Transaction</Text>
            <Text style={[styles.detailValue, { color: c.foreground }]}>{asset.txSignature ?? '-'}</Text>
          </View>
        </View>

        <View style={[styles.detailCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Wallet Info</Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Wallet Address</Text>
            <Text style={[styles.detailValue, { color: c.foreground }]}>{walletUser?.wallet_address ?? '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Merkle Tree</Text>
            <Text style={[styles.detailValue, { color: c.foreground }]}>{asset.merkleTree ?? '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Short View</Text>
            <Text style={[styles.detailValue, { color: c.foreground }]}>
              {walletUser?.wallet_address ? shortAddress(walletUser.wallet_address) : '-'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Leaf Index</Text>
            <Text style={[styles.detailValue, { color: c.foreground }]}>
              {asset.leafIndex != null ? String(asset.leafIndex) : '-'}
            </Text>
          </View>
        </View>

        <View style={[styles.detailCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Status</Text>
          <Text style={[styles.statusExplanation, { color: c.textSecondary }]}>
            This asset has been minted successfully and is now tied to the original verified batch.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.linkCard, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={() => router.push(`/batch/${batch.id}` as never)}
          activeOpacity={0.8}
        >
          <View style={styles.linkCopy}>
            <Text style={[styles.linkLabel, { color: c.textMuted }]}>Linked Batch</Text>
            <Text style={[styles.linkValue, { color: c.foreground }]}>{batch.id}</Text>
            <Text style={[styles.linkHint, { color: c.textSecondary }]}>
              Open the original batch record and follow the full timeline.
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={c.textFaint} />
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuOpen(false)}>
          <Pressable
            style={[styles.actionSheet, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => {}}
          >
            <Text style={[styles.actionTitle, { color: c.foreground }]}>Asset Actions</Text>

            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.8}
              onPress={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(asset.assetId);
                }
                setMenuOpen(false);
              }}
            >
              <Ionicons name="copy-outline" size={18} color={c.textSecondary} />
              <Text style={[styles.actionLabel, { color: c.foreground }]}>Copy Asset ID</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.8}
              onPress={() => {
                if (asset.txSignature && typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(asset.txSignature);
                }
                setMenuOpen(false);
              }}
            >
              <Ionicons name="link-outline" size={18} color={c.textSecondary} />
              <Text style={[styles.actionLabel, { color: c.foreground }]}>Copy Transaction</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.8}
              onPress={() => {
                setMenuOpen(false);
                router.push(`/batch/${batch.id}` as never);
              }}
            >
              <Ionicons name="document-text-outline" size={18} color={c.textSecondary} />
              <Text style={[styles.actionLabel, { color: c.foreground }]}>View Batch</Text>
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
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  heroCard: {
    borderWidth: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: {
    padding: 14,
    gap: 10,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  heroTopLeft: {
    flex: 1,
    gap: 6,
  },
  assetId: {
    fontSize: FontSize['2xl'],
    fontFamily: Font.bold,
  },
  heroText: {
    fontSize: FontSize.md,
    fontFamily: Font.regular,
    lineHeight: 22,
    maxWidth: 300,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: FontSize.xs,
    fontFamily: Font.semiBold,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  infoCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    minHeight: 94,
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 18,
  },
  infoValue: {
    fontSize: FontSize.lg,
    fontFamily: Font.semiBold,
    lineHeight: 24,
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: 20,
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
    lineHeight: 20,
    fontFamily: Font.medium,
  },
  statusExplanation: {
    fontSize: FontSize.md,
    lineHeight: 22,
    fontFamily: Font.regular,
  },
  linkCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  linkCopy: {
    flex: 1,
    gap: 4,
  },
  linkLabel: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  linkValue: {
    fontSize: FontSize.lg,
    fontFamily: Font.semiBold,
  },
  linkHint: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    fontFamily: Font.regular,
    maxWidth: 260,
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
  primaryButton: {
    marginTop: 8,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
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
