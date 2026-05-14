import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { usePvpBatchFeed } from '@/src/features/pvp/hooks/usePvpBatchFeed';
import { PushPermissionBanner } from '@/src/features/notifications/components/PushPermissionBanner';
import { usePushNotifications } from '@/src/features/notifications/hooks/usePushNotifications';
import type { PvpBatchListItem } from '@/src/features/batch/services/batch-api';

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

function weightKg(item: PvpBatchListItem) {
  const grams = item.actual_weight_grams ?? item.estimated_weight_grams ?? 0;
  return grams / 1000;
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 60) return `${diff} min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function DashboardSkeleton() {
  const c = useThemeColors();

  return (
    <View style={styles.scroll}>
      <View style={styles.header}>
        <SkeletonBox width={120} height={12} radius={999} />
        <SkeletonBox width="72%" height={38} radius={10} />
        <SkeletonBox width="48%" height={14} radius={7} />
      </View>

      <View style={[styles.heroCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <SkeletonBox width="36%" height={12} radius={6} />
        <SkeletonBox width="62%" height={28} radius={10} />
        <SkeletonBox width="54%" height={14} radius={7} />

        <View style={styles.heroMetricsRow}>
          {[0, 1, 2].map((item) => (
            <View
              key={item}
              style={[styles.heroMetricCard, { backgroundColor: c.backgroundSoft, borderColor: c.border }]}
            >
              <SkeletonBox width={54} height={26} radius={8} />
              <SkeletonBox width={72} height={10} radius={5} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.quickActionsRow}>
        {[0, 1].map((item) => (
          <View key={item} style={[styles.quickActionCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <SkeletonBox width={24} height={24} radius={8} />
            <SkeletonBox width="65%" height={14} radius={6} />
            <SkeletonBox width="82%" height={10} radius={5} />
          </View>
        ))}
      </View>

      {[0, 1].map((section) => (
        <View key={section} style={styles.section}>
          <SkeletonBox width={150} height={16} radius={6} />
          <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <SkeletonBox width="60%" height={14} radius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

function QuickActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const c = useThemeColors();

  return (
    <TouchableOpacity
      style={[styles.quickActionCard, { backgroundColor: c.surface, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${c.accent}12` }]}>
        <Ionicons name={icon} size={18} color={c.accent} />
      </View>
      <Text style={[styles.quickActionTitle, { color: c.foreground }]}>{title}</Text>
      <Text style={[styles.quickActionSubtitle, { color: c.textMuted }]}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function PriorityCard({ item }: { item: PvpBatchListItem }) {
  const c = useThemeColors();
  const matColor = MATERIAL_COLOR[item.material.toUpperCase()] ?? c.accent;
  const isAccepted = item.status === 'accepted';
  const isDispatched = item.status === 'pickup_dispatched';

  return (
    <TouchableOpacity
      style={[styles.priorityCard, { backgroundColor: c.surface, borderColor: c.border }]}
      activeOpacity={0.82}
      onPress={() => router.push(`/pvp/batch-detail?id=${item.id}` as never)}
    >
      <View style={styles.priorityTop}>
        <View style={styles.priorityIdentity}>
          <View style={[styles.priorityMaterialBadge, { backgroundColor: `${matColor}18`, borderColor: `${matColor}40` }]}>
            <Text style={[styles.priorityMaterialText, { color: matColor }]}>
              {item.material.toUpperCase()}
            </Text>
          </View>
          <View style={styles.priorityCopy}>
            <Text style={[styles.priorityTitle, { color: c.foreground }]}>Batch #{shortId(item.id)}</Text>
            <Text style={[styles.prioritySub, { color: c.textMuted }]}>
              {timeLabel(item.created_at)} | {timeAgo(item.created_at)} ago
            </Text>
          </View>
        </View>

        <View style={[styles.priorityStatusPill, {
          backgroundColor: isDispatched ? '#8b5cf618' : isAccepted ? `${c.accent}18` : '#f59e0b18',
          borderColor: isDispatched ? '#8b5cf635' : isAccepted ? `${c.accent}35` : '#f59e0b35',
        }]}>
          <Text style={[styles.priorityStatusText, { color: isDispatched ? '#8b5cf6' : isAccepted ? c.accent : '#f59e0b' }]}>
            {isDispatched ? 'EN ROUTE' : isAccepted ? 'ACCEPTED' : 'PENDING'}
          </Text>
        </View>
      </View>

      <View style={styles.priorityMetaRow}>
        <View style={styles.priorityMetaItem}>
          <Text style={[styles.priorityMetaLabel, { color: c.textFaint }]}>Estimated weight</Text>
          <Text style={[styles.priorityMetaValue, { color: c.foreground }]}>{weightKg(item).toFixed(1)} kg</Text>
        </View>
        <View style={styles.priorityMetaItem}>
          <Text style={[styles.priorityMetaLabel, { color: c.textFaint }]}>Next step</Text>
          <Text style={[styles.priorityMetaValue, { color: c.foreground }]}>
            {isDispatched ? 'Scan & weigh' : isAccepted ? 'Dispatch' : 'Review request'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={c.textMuted} style={{ alignSelf: 'center' }} />
      </View>
    </TouchableOpacity>
  );
}

function ActivityCard({ item }: { item: PvpBatchListItem }) {
  const c = useThemeColors();
  const isMinted = item.status === 'minted';
  const color = isMinted ? '#10b981' : '#8b5cf6';
  const activityAt = item.weighed_at ?? item.created_at;

  return (
    <View style={[styles.activityCard, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.activityIconWrap, { backgroundColor: `${color}16` }]}>
        <Ionicons
          name={isMinted ? 'checkmark-done-outline' : 'hourglass-outline'}
          size={16}
          color={color}
        />
      </View>
      <View style={styles.activityBody}>
        <Text style={[styles.activityTitle, { color: c.foreground }]}>
          {isMinted ? `Asset minted | ${shortId(item.id)}` : `Awaiting supplier sign | ${shortId(item.id)}`}
        </Text>
        <Text style={[styles.activitySub, { color: c.textMuted }]}>
          {item.material.toUpperCase()} | {weightKg(item).toFixed(1)} kg | {timeLabel(activityAt)}
        </Text>
      </View>
    </View>
  );
}

export default function PvpDashboardTab() {
  const c = useThemeColors();
  const { operator, activeSite, token } = usePvpAuth();
  const { batches, isLoading, isRefreshing, error, reload } = usePvpBatchFeed();
  const push = usePushNotifications({
    userId: operator?.id,
    role: 'processor',
    email: operator?.email,
    getAccessToken: async () => token,
  });

  const pending = batches.filter((batch) => batch.status === 'pending');
  const readyToWeigh = batches.filter((batch) => batch.status === 'accepted' || batch.status === 'pickup_dispatched');
  const awaitingSign = batches.filter((batch) => batch.status === 'cosigning');
  const completedToday = batches.filter((batch) => batch.status === 'minted');
  const totalKgToday = completedToday.reduce((sum, batch) => sum + weightKg(batch), 0);

  const priorityItems = [...pending]
    .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
    .slice(0, 3);

  const recentActivity = [...batches]
    .filter((batch) => ['cosigning', 'minted'].includes(batch.status))
    .sort((left, right) => (
      new Date(right.weighed_at ?? right.created_at).getTime() - new Date(left.weighed_at ?? left.created_at).getTime()
    ))
    .slice(0, 4);

  const operatorFirstName = operator?.display_name?.split(' ')[0] ?? 'Operator';
  const siteLabel = activeSite?.name ?? 'PVP Site';
  const operatorLabel = operator?.display_name ?? 'Not assigned';
  const siteIdLabel = activeSite?.id ? shortId(activeSite.id) : 'NO SITE';
  const focusCount = readyToWeigh.length > 0 ? readyToWeigh.length : pending.length;
  const focusLabel = readyToWeigh.length > 0 ? 'batches ready to weigh' : 'new requests to review';

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: c.background }]}>
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { void reload(); }}
              tintColor={c.accent}
            />
          )}
        >
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: c.accent }]}>PVP DASHBOARD</Text>
            <Text style={[styles.pageTitle, { color: c.foreground }]}>Good shift, {operatorFirstName}</Text>
            <Text style={[styles.pageSubtitle, { color: c.textMuted }]}> 
              Keep the queue moving from intake to co-sign with a clean operating view.
            </Text>
          </View>

          <PushPermissionBanner
            status={push.status}
            error={push.error}
            title="Enable PVP alerts"
            body="Get notified when collectors send batches to your site and when approval status changes."
            onEnable={() => { void push.requestPermission(); }}
          />

          <LinearGradient
            colors={[c.heroGradient[0], c.heroGradient[1], c.heroGradient[2]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { borderColor: c.border }]}
          >
            <View style={styles.radarWrap} pointerEvents="none">
              <View style={[styles.radarRingLarge, { borderColor: 'rgba(181,242,61,0.10)' }]} />
              <View style={[styles.radarRingMedium, { borderColor: 'rgba(181,242,61,0.14)' }]} />
              <View style={[styles.radarRingSmall, { borderColor: 'rgba(181,242,61,0.18)' }]} />
              <View style={[styles.radarSweep, { backgroundColor: 'rgba(181,242,61,0.08)' }]} />
              <View style={[styles.radarCore, { backgroundColor: 'rgba(181,242,61,0.16)', borderColor: 'rgba(181,242,61,0.24)' }]} />
              <View style={[styles.radarPulse, { backgroundColor: 'rgba(181,242,61,0.18)' }]} />
            </View>

            <View style={styles.heroTop}>
              <View style={styles.heroHeading}>
                <View style={[styles.siteStatusPill, { backgroundColor: 'rgba(22,163,74,0.14)', borderColor: 'rgba(22,163,74,0.24)' }]}>
                  <View style={styles.siteStatusDot} />
                  <Text style={styles.siteStatusText}>ACTIVE SITE</Text>
                </View>
                <Text style={[styles.heroTitle, { color: c.white }]}>{siteLabel}</Text>
                <Text style={[styles.heroSub, { color: c.ctaMuted }]}>
                  {siteIdLabel} | Operator: {operatorLabel}
                </Text>
              </View>

              <View style={[styles.heroDatePill, { borderColor: 'rgba(255,255,255,0.12)' }]}>
                <Text style={[styles.heroDateText, { color: c.white }]}>{todayLabel()}</Text>
              </View>
            </View>

            <View style={styles.focusRow}>
              <Text style={[styles.focusValue, { color: c.heroAccentNumber }]}>{focusCount}</Text>
              <Text style={[styles.focusLabel, { color: c.white }]}>{focusLabel}</Text>
            </View>

            <View style={styles.heroMetricsRow}>
              <View style={[styles.heroMetricCard, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={[styles.heroMetricValue, { color: c.white }]}>{pending.length}</Text>
                <Text style={[styles.heroMetricLabel, { color: c.ctaMuted }]}>Pending</Text>
              </View>
              <View style={[styles.heroMetricCard, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={[styles.heroMetricValue, { color: c.white }]}>{awaitingSign.length}</Text>
                <Text style={[styles.heroMetricLabel, { color: c.ctaMuted }]}>Awaiting sign</Text>
              </View>
              <View style={[styles.heroMetricCard, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={[styles.heroMetricValue, { color: c.white }]}>{totalKgToday.toFixed(1)}</Text>
                <Text style={[styles.heroMetricLabel, { color: c.ctaMuted }]}>Kg minted</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.quickActionsRow}>
            <QuickActionCard
              icon="qr-code-outline"
              title="Scan Batch"
              subtitle="Jump straight into physical handoff and weigh-in."
              onPress={() => router.push('/pvp/qr-scan' as never)}
            />
            <QuickActionCard
              icon="time-outline"
              title="Open Queue"
              subtitle="Review pending requests and ready-to-weigh batches."
              onPress={() => router.push('/(pvp-tabs)/pending' as never)}
            />
          </View>

          {error && (
            <View style={[styles.errorCard, { backgroundColor: `${c.error}10`, borderColor: `${c.error}24` }]}>
              <Ionicons name="alert-circle-outline" size={16} color={c.error} />
              <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionTop}>
              <View>
                <Text style={[styles.sectionTitle, { color: c.foreground }]}>Priority Queue</Text>
                <Text style={[styles.sectionSubtitle, { color: c.textMuted }]}>
                  Show the next batches that need your attention now.
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(pvp-tabs)/pending' as never)} activeOpacity={0.7}>
                <Text style={[styles.sectionLink, { color: c.accent }]}>View all</Text>
              </TouchableOpacity>
            </View>

            {priorityItems.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Ionicons name="checkmark-circle-outline" size={22} color={c.textMuted} />
                <Text style={[styles.emptyTitle, { color: c.foreground }]}>Queue is clear</Text>
                <Text style={[styles.emptyText, { color: c.textMuted }]}>
                  New pending and accepted batches will appear here as they arrive.
                </Text>
              </View>
            ) : (
              priorityItems.map((item) => <PriorityCard key={item.id} item={item} />)
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTop}>
              <View>
                <Text style={[styles.sectionTitle, { color: c.foreground }]}>Recent Activity</Text>
                <Text style={[styles.sectionSubtitle, { color: c.textMuted }]}>
                  Latest progress from weigh-in through supplier approval and minting.
                </Text>
              </View>
            </View>

            {recentActivity.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Ionicons name="document-text-outline" size={22} color={c.textMuted} />
                <Text style={[styles.emptyTitle, { color: c.foreground }]}>No activity yet</Text>
                <Text style={[styles.emptyText, { color: c.textMuted }]}>
                  Weighed and minted batches will appear here once operations begin.
                </Text>
              </View>
            ) : (
              recentActivity.map((item) => <ActivityCard key={item.id} item={item} />)
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 22,
  },
  header: { gap: 8 },
  eyebrow: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.6,
  },
  pageTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize['3xl'],
    lineHeight: 32,
  },
  pageSubtitle: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 20,
    maxWidth: '92%',
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  radarWrap: {
    position: 'absolute',
    width: 220,
    height: 220,
    right: -58,
    top: -34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRingLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
  },
  radarRingMedium: {
    position: 'absolute',
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 1,
  },
  radarRingSmall: {
    position: 'absolute',
    width: 98,
    height: 98,
    borderRadius: 49,
    borderWidth: 1,
  },
  radarSweep: {
    position: 'absolute',
    width: 110,
    height: 2,
    borderRadius: 999,
    transform: [{ rotate: '-28deg' }, { translateX: 18 }],
  },
  radarCore: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
  radarPulse: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroHeading: {
    flex: 1,
    gap: 8,
  },
  siteStatusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  siteStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#16a34a',
  },
  siteStatusText: {
    color: '#8ff3b2',
    fontFamily: Font.semiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
    lineHeight: 28,
  },
  heroSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  heroDatePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  heroDateText: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  focusValue: {
    fontFamily: Font.bold,
    fontSize: 40,
    lineHeight: 40,
  },
  focusLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.md,
    marginBottom: 6,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroMetricCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
  },
  heroMetricValue: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
  },
  heroMetricLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    minHeight: 136,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
  quickActionSubtitle: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  section: {
    gap: 12,
  },
  sectionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize.lg,
  },
  sectionSubtitle: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 18,
    marginTop: 3,
    maxWidth: 260,
  },
  sectionLink: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  priorityCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  priorityTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  priorityIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityMaterialBadge: {
    minWidth: 54,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  priorityMaterialText: {
    fontFamily: Font.bold,
    fontSize: FontSize.xs,
  },
  priorityCopy: {
    flex: 1,
    gap: 3,
  },
  priorityTitle: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
  prioritySub: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
  },
  priorityStatusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  priorityStatusText: {
    fontFamily: Font.bold,
    fontSize: FontSize.xs,
    letterSpacing: 0.2,
  },
  priorityMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityMetaItem: {
    flex: 1,
    gap: 4,
  },
  priorityMetaLabel: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
  },
  priorityMetaValue: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
  },
  activityCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityBody: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  activitySub: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
  emptyText: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 260,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  errorText: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
