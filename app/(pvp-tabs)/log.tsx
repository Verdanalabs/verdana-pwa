import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Font, FontSize } from '@/constants/typography';
import { useThemeColors } from '@/store/theme-context';
import { MOCK_BATCHES } from '@/mocks';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  minted:  { label: 'MINTED',  color: '#10b981' },
  verified: { label: 'VERIFIED', color: '#3b82f6' },
  pending_validation: { label: 'PENDING', color: '#f59e0b' },
  transit: { label: 'TRANSIT', color: '#6b7280' },
  rejected: { label: 'REJECTED', color: '#ef4444' },
};

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function PvpLogTab() {
  const c = useThemeColors();

  const logs = [...MOCK_BATCHES].sort(
    (a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime()
  );

  const validated = logs.filter((b) => b.status === 'minted' || b.status === 'verified');
  const totalKg = validated.reduce((s, b) => s + (b.actualWeightKg ?? b.estimatedWeightKg), 0);
  const rejected = logs.filter((b) => b.status === 'rejected');

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Text style={[styles.pageTitle, { color: c.foreground }]}>VALIDATION LOG</Text>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{validated.length}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>VALIDATED</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: c.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: c.accent }]}>{totalKg.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>TOTAL KG</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: c.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{rejected.length}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>REJECTED</Text>
          </View>
        </View>

        {/* Log entries */}
        <View style={styles.logList}>
          {logs.map((batch) => {
            const cfg = STATUS_CONFIG[batch.status] ?? { label: batch.status.toUpperCase(), color: c.textMuted };
            const weight = batch.actualWeightKg ?? batch.estimatedWeightKg;
            return (
              <View
                key={batch.id}
                style={[styles.logRow, { borderLeftColor: cfg.color, backgroundColor: c.surface, borderColor: c.border }]}
              >
                <View style={styles.logLeft}>
                  <Text style={[styles.logTime, { color: c.textMuted }]}>
                    {timeLabel(batch.validatedAt ?? batch.submittedAt ?? '')}
                  </Text>
                </View>
                <View style={styles.logBody}>
                  <View style={styles.logTop}>
                    <Text style={[styles.logSupplier, { color: c.foreground }]}>
                      Supplier #{batch.id}
                    </Text>
                    <Text style={[styles.logWeight, { color: c.foreground }]}>{weight}</Text>
                  </View>
                  <View style={styles.logBottom}>
                    <Text style={[styles.logMeta, { color: c.textMuted }]}>
                      {batch.id} · {batch.materialType}
                    </Text>
                    <View style={styles.logStatusRow}>
                      <Text style={[styles.logStatus, { color: cfg.color }]}>{cfg.label}</Text>
                      <Text style={[styles.logKg, { color: c.textMuted }]}>Kg</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
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
    gap: 20,
  },
  pageTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    letterSpacing: 0.8,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  statDivider: {
    width: 1,
    marginVertical: 12,
  },
  statValue: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
  },
  statLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  logList: { gap: 10 },
  logRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  logLeft: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  logTime: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
  },
  logBody: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 14,
    gap: 4,
  },
  logTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logSupplier: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
  logWeight: {
    fontFamily: Font.bold,
    fontSize: FontSize.lg,
  },
  logBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logMeta: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
  },
  logStatusRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  logStatus: {
    fontFamily: Font.bold,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  logKg: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
  },
});
