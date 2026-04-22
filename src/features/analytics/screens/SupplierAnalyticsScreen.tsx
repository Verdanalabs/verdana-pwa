import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/react-auth';
import { getMe, type VerdanaUser } from '@/src/features/auth/services/auth-api';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { getBatches, type ApiBatch } from '@/src/features/batch/services/batch-api';

type StatusBucket = 'pending' | 'accepted' | 'cosigning' | 'cosigned' | 'minted';

interface AnalyticsSummary {
  totalKg: number;
  totalBatches: number;
  mintedAssets: number;
  activeBatches: number;
  mintedRate: number;
  last7DaysCount: number;
  last30DaysCount: number;
  last7DaysKg: number;
  last30DaysKg: number;
}

const TIER_CONFIG = {
  starter: { label: 'Starter', color: '#c08457' },
  active: { label: 'Active', color: '#93c5fd' },
  reliable: { label: 'Reliable', color: '#b5f23d' },
  top_collector: { label: 'Top Collector', color: '#67e8f9' },
} as const;

function useSupplierAnalytics() {
  const { getAccessToken } = usePrivy();
  const [user, setUser] = useState<VerdanaUser | null>(null);
  const [batches, setBatches] = useState<ApiBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const token = await getAccessToken();
        if (!token) throw new Error('Not authenticated');

        const [me, data] = await Promise.all([
          getMe(token),
          getBatches(token),
        ]);

        if (!cancelled) {
          setUser(me);
          setBatches(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load analytics');
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
  }, [getAccessToken]);

  return { user, batches, isLoading, error };
}

function toKg(batch: ApiBatch) {
  return (batch.actual_weight_grams ?? batch.estimated_weight_grams ?? 0) / 1000;
}

function toStatusBucket(status: string): StatusBucket {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'accepted':
      return 'accepted';
    case 'cosigning':
      return 'cosigning';
    case 'minted':
      return 'minted';
    case 'cosigned':
    case 'mint_pending':
    case 'mint_failed':
    default:
      return 'cosigned';
  }
}

function formatWeight(value: number) {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 1 })} kg`;
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
}

function AnalyticsSkeleton() {
  const c = useThemeColors();

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={[styles.backButton, { backgroundColor: c.surface, borderColor: c.border }]} />
        <View style={styles.headerCopy}>
          <SkeletonBox width={110} height={24} radius={8} />
          <SkeletonBox width={210} height={12} radius={6} />
          <SkeletonBox width={180} height={12} radius={6} />
        </View>
      </View>

      <View style={[styles.heroCard, { borderColor: c.border }]}>
        <SkeletonBox width="30%" height={12} radius={6} />
        <SkeletonBox width="42%" height={34} radius={8} />
        <SkeletonBox width="70%" height={13} radius={6} />
        <View style={styles.heroMetricRow}>
          {[0, 1].map((item) => (
            <View key={item} style={[styles.heroMetricCard, { borderColor: 'rgba(255,255,255,0.08)' }]}>
              <SkeletonBox width="44%" height={22} radius={8} />
              <SkeletonBox width="58%" height={12} radius={6} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statGrid}>
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <SkeletonBox width="44%" height={12} radius={6} />
            <SkeletonBox width="50%" height={20} radius={7} />
            <SkeletonBox width="66%" height={11} radius={6} />
          </View>
        ))}
      </View>

      {[0, 1, 2].map((section) => (
        <View key={section} style={[styles.sectionCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <SkeletonBox width={140} height={16} radius={6} />
          {[0, 1, 2].map((row) => (
            <View key={row} style={styles.breakdownRow}>
              <SkeletonBox width="24%" height={12} radius={6} />
              <View style={[styles.breakdownTrack, { backgroundColor: c.backgroundSoft }]}>
                <View style={[styles.breakdownFill, { width: `${30 + row * 18}%`, backgroundColor: c.border }]} />
              </View>
              <SkeletonBox width={26} height={12} radius={6} />
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

export default function SupplierAnalyticsScreen() {
  const c = useThemeColors();
  const { user, batches, isLoading, error } = useSupplierAnalytics();

  const analytics = useMemo(() => {
    const now = Date.now();
    const last7 = now - (7 * 24 * 60 * 60 * 1000);
    const last30 = now - (30 * 24 * 60 * 60 * 1000);

    const summary: AnalyticsSummary = {
      totalKg: batches.reduce((sum, batch) => sum + toKg(batch), 0),
      totalBatches: batches.length,
      mintedAssets: batches.filter((batch) => batch.status === 'minted').length,
      activeBatches: batches.filter((batch) => ['pending', 'accepted', 'cosigning'].includes(batch.status)).length,
      mintedRate: batches.length === 0 ? 0 : Math.round((batches.filter((batch) => batch.status === 'minted').length / batches.length) * 100),
      last7DaysCount: batches.filter((batch) => new Date(batch.created_at).getTime() >= last7).length,
      last30DaysCount: batches.filter((batch) => new Date(batch.created_at).getTime() >= last30).length,
      last7DaysKg: batches
        .filter((batch) => new Date(batch.created_at).getTime() >= last7)
        .reduce((sum, batch) => sum + toKg(batch), 0),
      last30DaysKg: batches
        .filter((batch) => new Date(batch.created_at).getTime() >= last30)
        .reduce((sum, batch) => sum + toKg(batch), 0),
    };

    const statusCounts: Record<StatusBucket, number> = {
      pending: 0,
      accepted: 0,
      cosigning: 0,
      cosigned: 0,
      minted: 0,
    };

    const materialCounts = batches.reduce<Record<string, number>>((acc, batch) => {
      const material = batch.material.toUpperCase();
      acc[material] = (acc[material] ?? 0) + 1;
      return acc;
    }, {});

    batches.forEach((batch) => {
      statusCounts[toStatusBucket(batch.status)] += 1;
    });

    const statusEntries = Object.entries(statusCounts).map(([status, count]) => ({
      key: status as StatusBucket,
      label: status === 'cosigning'
        ? 'Needs Approval'
        : status === 'cosigned'
          ? 'Co-signed'
          : status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }));

    const materialEntries = Object.entries(materialCounts)
      .sort((left, right) => right[1] - left[1])
      .map(([material, count]) => ({ material, count }));

    const recentBatches = [...batches]
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .slice(0, 4)
      .map((batch) => ({
        id: batch.id,
        material: batch.material.toUpperCase(),
        status: toStatusBucket(batch.status),
        createdAt: batch.created_at,
        weightKg: toKg(batch),
      }));

    return { summary, statusEntries, materialEntries, recentBatches };
  }, [batches]);

  const reputation = user?.reputation ?? null;
  const tierCfg = reputation?.tier ? TIER_CONFIG[reputation.tier as keyof typeof TIER_CONFIG] : null;
  const reputationScore = reputation?.score ?? null;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <AnalyticsSkeleton />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.errorWrap}>
          <Ionicons name="analytics-outline" size={34} color={c.textMuted} />
          <Text style={[styles.errorTitle, { color: c.foreground }]}>Analytics unavailable</Text>
          <Text style={[styles.errorText, { color: c.textMuted }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: c.accent }]}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={[styles.retryButtonText, { color: c.accentContrast }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const maxStatusCount = Math.max(1, ...analytics.statusEntries.map((entry) => entry.count));
  const maxMaterialCount = Math.max(1, ...analytics.materialEntries.map((entry) => entry.count), 1);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color={c.foreground} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: c.foreground }]}>Analytics</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>Operational trends from your real batch activity.</Text>
          </View>
        </View>

        <LinearGradient
          colors={c.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderColor: c.border }]}
        >
          <View style={[styles.heroGlow, { backgroundColor: c.heroGlowColor }]} />
          <Text style={styles.heroEyebrow}>Collection Velocity</Text>
          <Text style={[styles.heroValue, { color: c.heroAccentNumber }]}>{formatWeight(analytics.summary.totalKg)}</Text>
          <Text style={styles.heroText}>
            {analytics.summary.mintedRate}% of your submitted batches have already become on-chain assets.
          </Text>

          <View style={styles.heroMetricRow}>
            <View style={styles.heroMetricCard}>
              <Text style={styles.heroMetricValue}>{analytics.summary.last7DaysCount}</Text>
              <Text style={styles.heroMetricLabel}>Batches in 7 days</Text>
            </View>
            <View style={styles.heroMetricCard}>
              <Text style={styles.heroMetricValue}>{formatWeight(analytics.summary.last30DaysKg)}</Text>
              <Text style={styles.heroMetricLabel}>Weight in 30 days</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statGrid}>
          <View style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>Reputation</Text>
            <Text style={[styles.statValue, { color: c.foreground }]}>
              {reputation?.state === 'available' && reputationScore != null ? reputationScore : 'Locked'}
            </Text>
            <Text style={[styles.statHint, { color: c.textFaint }]}>
              {reputation?.state === 'available' ? tierCfg?.label ?? 'Active reputation' : 'Unlocks after 3 batches'}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>Total Batches</Text>
            <Text style={[styles.statValue, { color: c.foreground }]}>{analytics.summary.totalBatches}</Text>
            <Text style={[styles.statHint, { color: c.textFaint }]}>All submissions so far</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>Minted Assets</Text>
            <Text style={[styles.statValue, { color: c.foreground }]}>{analytics.summary.mintedAssets}</Text>
            <Text style={[styles.statHint, { color: c.textFaint }]}>Reached `minted` status</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>Active Now</Text>
            <Text style={[styles.statValue, { color: c.foreground }]}>{analytics.summary.activeBatches}</Text>
            <Text style={[styles.statHint, { color: c.textFaint }]}>Pending or in transit</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>Last 7 Days</Text>
            <Text style={[styles.statValue, { color: c.foreground }]}>{formatWeight(analytics.summary.last7DaysKg)}</Text>
            <Text style={[styles.statHint, { color: c.textFaint }]}>
              {analytics.summary.last7DaysCount} recent batch{analytics.summary.last7DaysCount === 1 ? '' : 'es'}
            </Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Reputation Signal</Text>
          <Text style={[styles.sectionText, { color: c.textMuted }]}>Based on completion rate, recent activity, reliability, and collected volume.</Text>

          <View style={[styles.reputationPanel, { backgroundColor: c.backgroundSoft, borderColor: c.border }]}>
            <View style={styles.reputationTopRow}>
              <View style={styles.reputationTitleWrap}>
                <View style={[styles.reputationIcon, { backgroundColor: `${c.accent}20` }]}>
                  <Ionicons name="shield-checkmark" size={18} color={c.accent} />
                </View>
                <View style={styles.reputationCopy}>
                  <Text style={[styles.reputationLabel, { color: c.textMuted }]}>Current score</Text>
                  <Text style={[styles.reputationValue, { color: c.foreground }]}>
                    {reputation?.state === 'available' && reputationScore != null ? `${reputationScore} / 100` : 'Not available yet'}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.reputationBadge,
                  tierCfg
                    ? { backgroundColor: `${tierCfg.color}18`, borderColor: `${tierCfg.color}40` }
                    : { backgroundColor: c.surface, borderColor: c.border },
                ]}
              >
                {tierCfg ? <View style={[styles.reputationBadgeDot, { backgroundColor: tierCfg.color }]} /> : null}
                <Text style={[styles.reputationBadgeText, { color: tierCfg ? tierCfg.color : c.textMuted }]}>
                  {tierCfg?.label ?? 'Warming Up'}
                </Text>
              </View>
            </View>

            <Text style={[styles.reputationNote, { color: c.textSecondary }]}>
              {reputation?.state === 'available'
                ? 'Your score is live and updates from real batch outcomes.'
                : 'Complete at least 3 batches before the system publishes your score.'}
            </Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Status Breakdown</Text>
          <Text style={[styles.sectionText, { color: c.textMuted }]}>Shows how your current pipeline is distributed from pending to minted.</Text>

          <View style={styles.breakdownList}>
            {analytics.statusEntries.map((entry) => (
              <View key={entry.key} style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: c.foreground }]}>{entry.label}</Text>
                <View style={[styles.breakdownTrack, { backgroundColor: c.backgroundSoft }]}>
                  <View
                    style={[
                      styles.breakdownFill,
                      {
                        width: `${Math.max(8, (entry.count / maxStatusCount) * 100)}%`,
                        backgroundColor: entry.key === 'minted' ? c.accent : c.heroGradient[0],
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.breakdownCount, { color: c.textSecondary }]}>{entry.count}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Material Mix</Text>
          <Text style={[styles.sectionText, { color: c.textMuted }]}>Which plastic types dominate your collection activity.</Text>

          <View style={styles.breakdownList}>
            {analytics.materialEntries.length > 0 ? analytics.materialEntries.map((entry) => (
              <View key={entry.material} style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: c.foreground }]}>{entry.material}</Text>
                <View style={[styles.breakdownTrack, { backgroundColor: c.backgroundSoft }]}>
                  <View
                    style={[
                      styles.breakdownFill,
                      {
                        width: `${Math.max(8, (entry.count / maxMaterialCount) * 100)}%`,
                        backgroundColor: c.info,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.breakdownCount, { color: c.textSecondary }]}>{entry.count}</Text>
              </View>
            )) : (
              <Text style={[styles.emptyText, { color: c.textMuted }]}>No material data yet.</Text>
            )}
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Recent Activity</Text>
          <Text style={[styles.sectionText, { color: c.textMuted }]}>Latest submitted batches so you can scan momentum at a glance.</Text>

          <View style={styles.activityList}>
            {analytics.recentBatches.length > 0 ? analytics.recentBatches.map((batch) => (
              <View key={batch.id} style={[styles.activityCard, { backgroundColor: c.backgroundSoft, borderColor: c.border }]}>
                <View style={styles.activityTop}>
                  <View>
                    <Text style={[styles.activityTitle, { color: c.foreground }]}>
                      {batch.material} | {batch.weightKg.toFixed(1)} kg
                    </Text>
                    <Text style={[styles.activityMeta, { color: c.textMuted }]}>
                      {formatShortDate(batch.createdAt)} | #{batch.id.slice(0, 8).toUpperCase()}
                    </Text>
                  </View>
                  <View style={[
                    styles.activityStatus,
                    {
                      backgroundColor: batch.status === 'minted' ? c.statusBg.minted : c.background,
                      borderColor: batch.status === 'minted' ? c.statusBg.minted : c.border,
                    },
                  ]}>
                    <Text style={[
                      styles.activityStatusText,
                      {
                        color: batch.status === 'minted' ? c.statusFg.minted : c.textSecondary,
                      },
                    ]}>
                      {batch.status === 'cosigning' ? 'Needs Approval' : batch.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </View>
            )) : (
              <Text style={[styles.emptyText, { color: c.textMuted }]}>No batch activity yet.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 18, paddingBottom: 36 },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: 5, paddingTop: 2 },
  title: { fontSize: FontSize['2xl'], fontFamily: Font.bold, lineHeight: 28 },
  subtitle: { fontSize: FontSize.md, fontFamily: Font.regular, lineHeight: 22, maxWidth: 280 },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 18,
    gap: 10,
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    top: -110,
    right: -90,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  heroValue: {
    fontSize: FontSize['4xl'],
    fontFamily: Font.bold,
    lineHeight: 40,
  },
  heroText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
    maxWidth: 300,
  },
  heroMetricRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  heroMetricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 4,
  },
  heroMetricValue: {
    color: '#ffffff',
    fontSize: FontSize.xl,
    fontFamily: Font.bold,
  },
  heroMetricLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  statLabel: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontFamily: Font.bold,
    lineHeight: 24,
  },
  statHint: {
    fontSize: FontSize.xs,
    fontFamily: Font.regular,
    lineHeight: 16,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 14,
  },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: Font.bold },
  sectionText: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  reputationPanel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  reputationTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  reputationTitleWrap: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  reputationIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reputationCopy: {
    flex: 1,
    gap: 2,
  },
  reputationLabel: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  reputationValue: {
    fontSize: FontSize.xl,
    fontFamily: Font.bold,
    lineHeight: 26,
  },
  reputationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reputationBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  reputationBadgeText: {
    fontSize: FontSize.xs,
    fontFamily: Font.semiBold,
  },
  reputationNote: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
  },
  breakdownList: { gap: 12 },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breakdownLabel: {
    width: 88,
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  breakdownTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 999,
  },
  breakdownCount: {
    width: 24,
    textAlign: 'right',
    fontSize: FontSize.sm,
    fontFamily: Font.semiBold,
  },
  activityList: { gap: 10 },
  activityCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  activityTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
  },
  activityTitle: {
    fontSize: FontSize.md,
    fontFamily: Font.bold,
  },
  activityMeta: {
    marginTop: 4,
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  activityStatus: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activityStatusText: {
    fontSize: FontSize.xs,
    fontFamily: Font.semiBold,
    textTransform: 'capitalize',
  },
  emptyText: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  errorTitle: { fontSize: FontSize.xl, fontFamily: Font.bold },
  errorText: { fontSize: FontSize.md, fontFamily: Font.regular, textAlign: 'center', lineHeight: 22 },
  retryButton: {
    marginTop: 8,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: FontSize.md,
    fontFamily: Font.semiBold,
  },
});
