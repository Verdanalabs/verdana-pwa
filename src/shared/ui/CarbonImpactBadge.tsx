import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { withAlpha, Alpha } from '@/src/shared/theme/color';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { NoticeCard } from '@/src/shared/ui/NoticeCard';
import { computeOffsetKg, factorFor, formatOffsetKg } from '@/src/shared/lib/carbon';
import { parseWeightKg } from '@/src/shared/lib/weight';
import { useCo2Factors } from '@/src/shared/hooks/useCo2Factors';

/**
 * Live CO2e offset for a weight being typed.
 *
 * The filled state is a neon FILL with a dark green label. The client brief
 * asked for neon text, but neon measures 1.42:1 on the light canvas — see
 * brand.md. Fill plus `accentContrast` is the brand's signature treatment and
 * the only legible one.
 *
 * This never blocks submission. The offset shown is a preview; core-api
 * recomputes it from the same factor table when it builds the token metadata.
 */
export function CarbonImpactBadge({
  weightInput,
  material,
}: {
  weightInput: string;
  material: string | null | undefined;
}) {
  const c = useThemeColors();
  const { factors, methodologies, isLoading, error, source, retry } = useCo2Factors();

  const parsed = parseWeightKg(weightInput);
  const factor = factorFor(factors, material);

  // ── Loading: factors still resolving, and nothing cached to show ──
  if (isLoading && Object.keys(factors).length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <SkeletonBox width={38} height={38} radius={12} />
        <View style={styles.textCol}>
          <SkeletonBox width={120} height={16} radius={6} />
          <SkeletonBox width={180} height={12} radius={6} />
        </View>
      </View>
    );
  }

  // ── Error: no factor for this material and nothing to fall back on ──
  if (!factor) {
    return (
      <NoticeCard
        tone="warning"
        footer={
          error ? (
            <TouchableOpacity onPress={retry} activeOpacity={0.7} hitSlop={8}>
              <Text style={[styles.retry, { color: c.toneFg.warning }]}>Try again</Text>
            </TouchableOpacity>
          ) : undefined
        }
      >
        <>
          <Text style={[styles.title, { color: c.toneFg.warning }]}>Emission factor unavailable</Text>
          <Text style={[styles.caption, { color: c.toneFg.warning }]}>
            {material
              ? `No CO2e factor is published for ${material.toUpperCase()} yet. You can still submit — the offset is calculated when the record is minted.`
              : 'Select a waste category to see the CO2e estimate.'}
          </Text>
        </>
      </NoticeCard>
    );
  }

  // ── Empty: category known, no usable weight yet ──
  if (!parsed.ok) {
    return (
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={[styles.iconWell, { backgroundColor: withAlpha(c.accent, Alpha.soft) }]}>
          <Ionicons name="leaf-outline" size={20} color={c.accentInk} />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: c.foreground }]}>Carbon impact</Text>
          <Text style={[styles.caption, { color: c.textMuted }]}>
            Enter a weight to see the CO2e avoided by this batch.
          </Text>
        </View>
      </View>
    );
  }

  // ── Filled ──
  const offsetKg = computeOffsetKg(parsed.kg, factor);
  const methodology = material ? methodologies[material.toLowerCase()] : undefined;

  return (
    <View style={styles.filledWrap}>
      <View style={[styles.card, styles.filledCard, { backgroundColor: c.accent, borderColor: c.accent }]}>
        <View style={[styles.iconWell, { backgroundColor: withAlpha(c.accentContrast, Alpha.subtle) }]}>
          <Ionicons name="leaf" size={20} color={c.accentContrast} />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.offset, { color: c.accentContrast }]}>
            +{formatOffsetKg(offsetKg)} kg CO2e
          </Text>
          <Text style={[styles.filledCaption, { color: c.accentContrast }]}>
            Emissions avoided at {factor} kg CO2e per kg
          </Text>
        </View>
      </View>

      <Text style={[styles.footnote, { color: c.textMuted }]}>
        {source === 'live'
          ? methodology ?? 'IPCC 2006 Vol.5 Waste · US EPA WARM · Verra AMS-III.F'
          : 'Offline estimate from the bundled LCA table. The final figure is calculated when the record is minted.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  filledWrap: { gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  filledCard: { alignItems: 'center' },
  iconWell: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 4 },
  title: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  caption: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 19 },
  offset: { fontSize: FontSize.xl, fontFamily: Font.bold },
  filledCaption: { fontSize: FontSize.sm, fontFamily: Font.medium, lineHeight: 18 },
  footnote: { fontSize: FontSize.xs, fontFamily: Font.regular, lineHeight: 16 },
  retry: { fontSize: FontSize.sm, fontFamily: Font.semiBold, marginTop: 2 },
});
