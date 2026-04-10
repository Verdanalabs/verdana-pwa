import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/colors';

interface QuickActionCardProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onPress?: () => void;
  variant?: 'default' | 'primary';
}

export function QuickActionCard({
  icon,
  label,
  description,
  onPress,
  variant = 'default',
}: QuickActionCardProps) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[styles.card, isPrimary && styles.primaryCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, isPrimary && styles.iconWrapPrimary]}>{icon}</View>
      <Text style={[styles.label, isPrimary && styles.labelPrimary]}>{label}</Text>
      {description ? (
        <Text style={[styles.description, isPrimary && styles.descriptionPrimary]}>
          {description}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  primaryCard: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapPrimary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  labelPrimary: {
    color: Colors.white,
  },
  description: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  descriptionPrimary: {
    color: 'rgba(255,255,255,0.8)',
  },
});
