import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { getMockBatches } from '@/src/shared/services/mock/batch-data';

const MATERIAL_COLOR: Record<string, string> = {
  PET: '#3b82f6',
  HDPE: '#10b981',
  PP: '#f59e0b',
  PVC: '#ef4444',
};

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h`;
}

export default function PvpDashboardTab() {
  const c = useThemeColors();
  const { operator } = usePvpAuth();
  const batches = getMockBatches();

  const arriving = batches.filter((b) => b.status === 'transit');
  const readyToInspect = batches.filter((b) => b.status === 'pending_validation');
  const doneToday = batches.filter((b) => b.status === 'minted' || b.status === 'verified');

  const queue = [...arriving, ...readyToInspect];
  const totalKgToday = doneToday.reduce((sum, b) => sum + (b.actualWeightKg ?? b.estimatedWeightKg), 0);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={[styles.stationName, { color: c.foreground }]}>
                {operator?.stationName?.toUpperCase()}
              </Text>
              <View style={[styles.openBadge, { backgroundColor: '#16a34a20', borderColor: '#16a34a40' }]}>
                <View style={[styles.openDot, { backgroundColor: '#16a34a' }]} />
                <Text style={[styles.openText, { color: '#16a34a' }]}>OPEN</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.headerSub, { color: c.textSecondary }]}>
            {operator?.stationId} · Operator: {operator?.name}
          </Text>
          <Text style={[styles.headerDate, { color: c.textMuted }]}>{today}</Text>
        </View>

        {/* Counters */}
        <View style={[styles.countersCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.counterItem}>
            <Text style={[styles.counterValue, { color: c.accent }]}>{queue.length}</Text>
            <Text style={[styles.counterLabel, { color: c.textMuted }]}>QUEUE</Text>
          </View>
          <View style={[styles.counterDivider, { backgroundColor: c.border }]} />
          <View style={styles.counterItem}>
            <Text style={[styles.counterValue, { color: c.accent }]}>{readyToInspect.length}</Text>
            <Text style={[styles.counterLabel, { color: c.textMuted }]}>PROCESSING</Text>
          </View>
          <View style={[styles.counterDivider, { backgroundColor: c.border }]} />
          <View style={styles.counterItem}>
            <Text style={[styles.counterValue, { color: c.accent }]}>{totalKgToday.toLocaleString()}</Text>
            <Text style={[styles.counterLabel, { color: c.textMuted }]}>KG TODAY</Text>
          </View>
        </View>

        {/* Incoming Queue */}
        <View style={styles.section}>
          <View style={styles.sectionTop}>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>INCOMING QUEUE</Text>
            <Text style={[styles.sectionCount, { color: c.accent }]}>{queue.length} waiting</Text>
          </View>

          {queue.length === 0 ? (
            <View style={[styles.emptyQueue, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>No batches in queue</Text>
            </View>
          ) : (
            queue.map((batch, index) => {
              const isUrgent = batch.status === 'transit';
              const matColor = MATERIAL_COLOR[batch.materialType] ?? c.accent;
              const submittedAt = batch.submittedAt ?? batch.capturedAt;

              return (
                <TouchableOpacity
                  key={batch.id}
                  style={[styles.queueCard, { backgroundColor: c.surface, borderColor: c.border }]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.queueIndex, { backgroundColor: c.accent }]}>
                    <Text style={[styles.queueIndexText, { color: c.accentContrast }]}>
                      {index + 1}
                    </Text>
                  </View>

                  <View style={styles.queueBody}>
                    <View style={styles.queueTop}>
                      <View>
                        <Text style={[styles.queueSupplier, { color: c.foreground }]}> 
                          Supplier #{batch.id}
                        </Text>
                        <Text style={[styles.queueTime, { color: c.textMuted }]}> 
                          {timeLabel(submittedAt)} · {timeAgo(submittedAt)} ago
                        </Text>
                      </View>
                      {isUrgent && (
                        <View style={[styles.urgentBadge, { backgroundColor: '#ef444420' }]}>
                          <Text style={[styles.urgentText, { color: '#ef4444' }]}>URGENT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.queueMeta, { color: c.textSecondary }]}>
                      <Text style={{ color: matColor }}>{batch.materialType}</Text>
                      {' · Est. '}{batch.estimatedWeightKg} Kg · {batch.id}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Today's Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>TODAY&apos;S ACTIVITY</Text>

          {doneToday.length === 0 ? (
            <View style={[styles.emptyQueue, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>No activity yet</Text>
            </View>
          ) : (
            doneToday.map((batch) => {
              const isMinted = batch.status === 'minted';
              const dotColor = isMinted ? '#10b981' : '#3b82f6';
              return (
                <View key={batch.id} style={styles.activityItem}>
                  <View style={[styles.activityDot, { backgroundColor: dotColor }]} />
                  <View style={styles.activityBody}>
                    <Text style={[styles.activityTitle, { color: c.foreground }]}>
                      {isMinted ? `cNFT ${batch.cnftId ?? batch.id} minted` : `Co-sign approved · ${batch.id}`}
                    </Text>
                    <Text style={[styles.activitySub, { color: c.textMuted }]}>
                      {batch.materialType} {batch.actualWeightKg ?? batch.estimatedWeightKg} Kg
                      {batch.validatedAt ? ` · ${timeLabel(batch.validatedAt)}` : ''}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 24,
  },
  header: { gap: 4 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  stationName: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
    lineHeight: 28,
    letterSpacing: 0.4,
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  openText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  headerDate: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
  },
  countersCard: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  counterItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  counterDivider: {
    width: 1,
    marginVertical: 12,
  },
  counterValue: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
  },
  counterLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  section: { gap: 12 },
  sectionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize.md,
    letterSpacing: 0.6,
  },
  sectionCount: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
  },
  queueCard: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  queueIndex: {
    width: 40,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueIndexText: {
    fontFamily: Font.bold,
    fontSize: FontSize.md,
  },
  queueBody: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  queueTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  queueSupplier: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
  queueTime: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  urgentBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  urgentText: {
    fontFamily: Font.bold,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  queueMeta: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 5,
  },
  activityBody: { gap: 2 },
  activityTitle: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
  },
  activitySub: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
  },
  emptyQueue: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
  },
});
