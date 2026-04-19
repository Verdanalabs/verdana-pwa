import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { getMockCosignBatch } from '@/src/shared/services/mock/batch-data';

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function PvpPendingTab() {
  const c = useThemeColors();
  const { operator } = usePvpAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const cosignBatch = getMockCosignBatch();

  if (!cosignBatch) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <View style={styles.centerState}>
          <Ionicons name="time-outline" size={48} color={c.textMuted} />
          <Text style={[styles.stateTitle, { color: c.foreground }]}>No pending co-sign</Text>
          <Text style={[styles.stateSub, { color: c.textMuted }]}>There is no active co-sign session right now.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cancelled) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <View style={styles.centerState}>
          <Ionicons name="close-circle-outline" size={48} color={c.textMuted} />
          <Text style={[styles.stateTitle, { color: c.foreground }]}>Session cancelled</Text>
          <Text style={[styles.stateSub, { color: c.textMuted }]}>
            The co-sign session for {cosignBatch.id} was cancelled.
          </Text>
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: c.border }]}
            onPress={() => setCancelled(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.resetBtnText, { color: c.textSecondary }]}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (confirmed) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <View style={styles.centerState}>
          <View style={[styles.successCircle, { borderColor: '#10b981' }]}>
            <Ionicons name="checkmark" size={40} color="#10b981" />
          </View>
          <Text style={[styles.stateTitle, { color: c.foreground }]}>Co-sign confirmed</Text>
          <Text style={[styles.stateSub, { color: c.textMuted }]}>
            Batch {cosignBatch.id} has been co-signed. Minting job queued.
          </Text>
          <TouchableOpacity
            style={[styles.resetBtn, { borderColor: c.border }]}
            onPress={() => setConfirmed(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.resetBtnText, { color: c.textSecondary }]}>Reset demo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: c.foreground }]}>AWAITING CO-SIGN</Text>
          <Text style={[styles.pageSub, { color: c.textSecondary }]}>
            {cosignBatch.id} · Supplier notified
          </Text>
        </View>

        {/* Wait indicator */}
        <View style={styles.waitSection}>
          <View style={[styles.waitOuter, { borderColor: c.accent + '30' }]}>
            <View style={[styles.waitMiddle, { borderColor: c.accent + '60' }]}>
              <View style={[styles.waitInner, { borderColor: c.accent, backgroundColor: c.surface }]}>
                <Text style={[styles.waitLabel, { color: c.accent }]}>WAIT</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.waitTitle, { color: c.foreground }]}>WAITING FOR CONFIRMATION</Text>
          <Text style={[styles.waitSub, { color: c.textSecondary }]}>
            Notification sent to supplier.{'\n'}Waiting for their digital signature.
          </Text>
        </View>

        {/* Detail card */}
        <View style={[styles.detailCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          {[
            { label: 'SUPPLIER', value: `Supplier #${cosignBatch.id}` },
            { label: 'BATCH', value: cosignBatch.id },
            { label: 'ACTUAL WEIGHT', value: `${cosignBatch.actualWeightKg ?? cosignBatch.estimatedWeightKg} Kg` },
            { label: 'MATERIAL', value: `${cosignBatch.materialType} plastic` },
            { label: 'PVP ID', value: operator?.stationId ?? '—' },
            { label: 'SENT AT', value: timeLabel(cosignBatch.submittedAt ?? '') },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={[styles.detailRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }]}
            >
              <Text style={[styles.detailLabel, { color: c.textMuted }]}>{row.label}</Text>
              <Text style={[styles.detailValue, { color: c.foreground }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Dev simulate button */}
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: c.accent }]}
          onPress={() => setConfirmed(true)}
          activeOpacity={0.85}
        >
          <Text style={[styles.confirmBtnText, { color: c.accentContrast }]}>
            DEMO: SUPPLIER CONFIRMED
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: c.border }]}
          onPress={() => setCancelled(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelBtnText, { color: c.textSecondary }]}>Cancel session</Text>
        </TouchableOpacity>

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
  pageTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    letterSpacing: 0.8,
  },
  pageSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
  },
  waitSection: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  waitOuter: {
    width: 140,
    height: 140,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitMiddle: {
    width: 112,
    height: 112,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitInner: {
    width: 84,
    height: 84,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitLabel: {
    fontFamily: Font.bold,
    fontSize: FontSize.md,
    letterSpacing: 1,
  },
  waitTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  waitSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.md,
    lineHeight: 22,
    textAlign: 'center',
  },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
  },
  confirmBtn: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontFamily: Font.bold,
    fontSize: FontSize.md,
    letterSpacing: 0.5,
  },
  cancelBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: Font.medium,
    fontSize: FontSize.md,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
    textAlign: 'center',
  },
  stateSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  resetBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  resetBtnText: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
  },
});
