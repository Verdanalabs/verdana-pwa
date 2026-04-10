import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardSummary } from '@/types';
import { Font, FontSize } from '@/constants/typography';
import { useThemeColors } from '@/store/theme-context';

interface MetricTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
}

function MetricTile({ icon, iconColor, iconBg, label, value, sub }: MetricTileProps) {
  const c = useThemeColors();

  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: c.surface, shadowColor: c.shadowColor, borderColor: c.border, borderWidth: 1 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: c.foreground }]}>{value}</Text>
        {sub ? (
          <Text style={[styles.sub, { color: c.textFaint }]}>{sub}</Text>
        ) : null}
      </View>
      <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
}

interface DashboardMetricsProps {
  data: DashboardSummary;
}

export function DashboardMetrics({ data }: DashboardMetricsProps) {
  const c = useThemeColors();

  return (
    <View style={styles.container}>
      <MetricTile
        icon="shield-checkmark-outline"
        iconColor={c.accent}
        iconBg={`${c.accent}22`}
        label="Reputation Score"
        value={data.reputationScore.toFixed(1)}
        sub="/ 100"
      />
      <MetricTile
        icon="logo-usd"
        iconColor={c.accent}
        iconBg={`${c.accent}22`}
        label="USDC Balance"
        value={`$${data.usdcBalance.toLocaleString('en-US')}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  value: {
    fontSize: FontSize['2xl'],
    fontFamily: Font.bold,
    lineHeight: 28,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  sub: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    marginBottom: 2,
  },
  label: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
    marginTop: 4,
  },
});
