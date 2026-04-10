import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DashboardSummary } from '@/types';
import { Font, FontSize } from '@/constants/typography';
import { useThemeColors } from '@/store/theme-context';

// Hero card selalu pakai background gelap di kedua mode
// jadi teks selalu putih, bukan ngikut theme foreground
const HERO_TEXT        = '#ffffff';
const HERO_TEXT_MUTED  = 'rgba(255,255,255,0.55)';
const HERO_DIVIDER     = 'rgba(255,255,255,0.1)';

interface HeroCardProps {
  data: DashboardSummary;
  supplierName: string;
}

export function HeroCard({ data, supplierName }: HeroCardProps) {
  const c         = useThemeColors();
  const firstName = supplierName.split(' ')[0];

  // ── Shimmer animation ──
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerAnim]);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-320, 320],
  });

  const shimmerTranslateY = shimmerAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-80, 80],
  });

  return (
    <View style={styles.shadow}>
      <LinearGradient
        colors={c.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: c.border }]}
      >
        {/* ── Glow orb top-right ── */}
        <View style={[styles.glowOrb, { backgroundColor: c.heroGlowColor }]} />

        {/* ── Animated shimmer overlay ── */}
        <Animated.View
          style={[
            styles.shimmerWrap,
            {
              transform: [
                { translateX: shimmerTranslateX },
                { translateY: shimmerTranslateY },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              'transparent',
              `${c.heroAccentNumber}08`,
              `${c.heroAccentNumber}14`,
              `${c.heroAccentNumber}08`,
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>

        {/* ── Content ── */}
        <View style={styles.content}>
          {/* Header row */}
          <View style={styles.topRow}>
            <View style={styles.topLeft}>
              <Text style={[styles.greeting, { color: HERO_TEXT }]}>
                Good morning, {firstName} 👋
              </Text>
              <Text style={[styles.subtext, { color: HERO_TEXT_MUTED }]}>
                Here's your collection overview
              </Text>
            </View>

            <View
              style={[
                styles.trendBadge,
                {
                  backgroundColor: `${c.heroAccentNumber}15`,
                  borderColor: `${c.heroAccentNumber}30`,
                  borderWidth: 1,
                },
              ]}
            >
              <Ionicons name="trending-up" size={12} color={c.heroAccentNumber} />
              <Text style={[styles.trendText, { color: c.heroAccentNumber }]}>+12%</Text>
            </View>
          </View>

          {/* Big number */}
          <View style={styles.metricRow}>
            <Text style={[styles.bigNumber, { color: c.heroAccentNumber }]}>
              {data.totalKg.toLocaleString('en-US')}
            </Text>
            <Text style={[styles.unit, { color: HERO_TEXT_MUTED }]}>kg collected</Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: HERO_DIVIDER }]} />

          {/* Sub metrics */}
          <View style={styles.subRow}>
            <View style={styles.subItem}>
              <Text style={[styles.subValue, { color: HERO_TEXT }]}>{data.batchCount}</Text>
              <Text style={[styles.subLabel, { color: HERO_TEXT_MUTED }]}>Total Batches</Text>
            </View>
            <View style={[styles.subSep, { backgroundColor: HERO_DIVIDER }]} />
            <View style={styles.subItem}>
              <Text style={[styles.subValue, { color: HERO_TEXT }]}>{data.cnftCount}</Text>
              <Text style={[styles.subLabel, { color: HERO_TEXT_MUTED }]}>Assets</Text>
            </View>
            <View style={[styles.subSep, { backgroundColor: HERO_DIVIDER }]} />
            <View style={styles.subItem}>
              <Text style={[styles.subValue, { color: HERO_TEXT }]}>{data.pendingTransitCount}</Text>
              <Text style={[styles.subLabel, { color: HERO_TEXT_MUTED }]}>In Transit</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Glow orb
  glowOrb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -50,
  },

  // Shimmer overlay
  shimmerWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerGradient: {
    flex: 1,
    transform: [{ rotate: '-25deg' }, { scaleX: 2 }],
  },

  // Content
  content: {
    padding: 22,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topLeft: {
    flex: 1,
    gap: 4,
    paddingRight: 8,
  },
  greeting: {
    fontSize: FontSize.lg,
    fontFamily: Font.semiBold,
  },
  subtext: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
  },
  trendText: {
    fontSize: FontSize.xs,
    fontFamily: Font.semiBold,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  bigNumber: {
    fontSize: FontSize['4xl'],
    fontFamily: Font.bold,
    lineHeight: 42,
  },
  unit: {
    fontSize: FontSize.md,
    fontFamily: Font.medium,
    marginBottom: 5,
  },
  divider: {
    height: 1,
  },
  subRow: {
    flexDirection: 'row',
  },
  subItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  subSep: {
    width: 1,
  },
  subValue: {
    fontSize: FontSize.xl,
    fontFamily: Font.bold,
  },
  subLabel: {
    fontSize: FontSize.xs,
    fontFamily: Font.regular,
    textAlign: 'center',
  },
});
