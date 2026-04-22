import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardSummary } from '@/types';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';

const TIER_CONFIG = {
  bronze:   { label: 'Bronze',   color: '#cd7f32' },
  silver:   { label: 'Silver',   color: '#a8a9ad' },
  gold:     { label: 'Gold',     color: '#f5c518' },
  platinum: { label: 'Platinum', color: '#67e8f9' },
};

function getScoreLabel(score: number) {
  if (score >= 90) return 'Excellent standing';
  if (score >= 75) return 'Good standing';
  if (score >= 50) return 'Fair standing';
  return 'Needs improvement';
}

interface DashboardMetricsProps {
  data: DashboardSummary;
  tier?: keyof typeof TIER_CONFIG;
}

export function DashboardMetrics({ data, tier = 'silver' }: DashboardMetricsProps) {
  const c = useThemeColors();
  const score = data.reputationScore;
  const pct = Math.min(score / 100, 1);
  const tierCfg = TIER_CONFIG[tier];

  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: pct,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.surface,
          borderColor: c.border,
          shadowColor: c.shadowColor,
        },
      ]}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.iconLabelRow}>
          <View style={[styles.iconWrap, { backgroundColor: `${c.accent}20` }]}>
            <Ionicons name="shield-checkmark" size={18} color={c.accent} />
          </View>
          <Text style={[styles.label, { color: c.textMuted }]}>Reputation Score</Text>
        </View>

        <View style={[styles.tierBadge, { backgroundColor: `${tierCfg.color}18`, borderColor: `${tierCfg.color}40` }]}>
          <View style={[styles.tierDot, { backgroundColor: tierCfg.color }]} />
          <Text style={[styles.tierText, { color: tierCfg.color }]}>{tierCfg.label}</Text>
        </View>
      </View>

      {/* Score */}
      <View style={styles.scoreRow}>
        <Text style={[styles.scoreValue, { color: c.foreground }]}>
          {score.toFixed(1)}
        </Text>
        <Text style={[styles.scoreMax, { color: c.textFaint }]}>/ 100</Text>
      </View>

      {/* Progress bar */}
      <View style={[styles.trackBg, { backgroundColor: `${c.accent}18` }]}>
        <Animated.View
          style={[
            styles.trackFill,
            {
              backgroundColor: c.accent,
              width: barAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Footer row */}
      <View style={styles.footerRow}>
        <Text style={[styles.scoreLabel, { color: c.textFaint }]}>
          {getScoreLabel(score)}
        </Text>
        <Text style={[styles.pctText, { color: c.accent }]}>
          {Math.round(pct * 100)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },
  tierText: {
    fontSize: FontSize.xs,
    fontFamily: Font.semiBold,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  scoreValue: {
    fontSize: FontSize['4xl'],
    fontFamily: Font.bold,
    lineHeight: 44,
  },
  scoreMax: {
    fontSize: FontSize.md,
    fontFamily: Font.regular,
    marginBottom: 6,
  },
  trackBg: {
    height: 7,
    borderRadius: 99,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 99,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    fontFamily: Font.regular,
  },
  pctText: {
    fontSize: FontSize.xs,
    fontFamily: Font.semiBold,
  },
});
