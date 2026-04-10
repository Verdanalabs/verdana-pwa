import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}

export function MetricCard({ label, value, unit, highlight }: MetricCardProps) {
  return (
    <View style={[styles.card, highlight && styles.highlighted]}>
      <Text style={[styles.value, highlight && styles.valueHighlight]}>
        {value}
        {unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
      <Text style={[styles.label, highlight && styles.labelHighlight]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 80,
  },
  highlighted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  valueHighlight: {
    color: Colors.white,
  },
  unit: {
    fontSize: 13,
    fontWeight: '400',
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  labelHighlight: {
    color: 'rgba(255,255,255,0.8)',
  },
});
