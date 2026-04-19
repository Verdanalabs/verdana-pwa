import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/src/shared/ui/PrimaryButton';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { useBatchDraft } from '@/src/features/batch/state/batch-draft-context';

const DROP_OFF_OPTIONS = [
  { id: 'east-bekasi', label: 'East Bekasi Drop-off', distanceKm: 2.3, gpsLat: -6.521, gpsLng: 107.075 },
  { id: 'tambun', label: 'Tambun Drop-off', distanceKm: 5.1, gpsLat: -6.53, gpsLng: 107.09 },
  { id: 'cikarang', label: 'Cikarang Drop-off', distanceKm: 7.4, gpsLat: -6.31, gpsLng: 107.17 },
];

function StepHeader({ step, title, body }: { step: string; title: string; body: string }) {
  const c = useThemeColors();

  return (
    <View style={styles.header}>
      <Text style={[styles.stepText, { color: c.accent }]}>{step}</Text>
      <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      <Text style={[styles.body, { color: c.textSecondary }]}>{body}</Text>
    </View>
  );
}

export default function BatchLocationRoute() {
  const c = useThemeColors();
  const { draft, setLocation } = useBatchDraft();

  const initialOption =
    DROP_OFF_OPTIONS.find((option) => option.label === draft.dropOffPoint) ?? DROP_OFF_OPTIONS[0];
  const [selectedId, setSelectedId] = useState(initialOption.id);

  const selected = DROP_OFF_OPTIONS.find((option) => option.id === selectedId) ?? DROP_OFF_OPTIONS[0];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={c.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <StepHeader
            step="Step 3 of 4"
            title="Choose the drop-off point."
            body="We will attach the nearest drop-off point to this batch so the route stays clear."
          />

          <View style={[styles.mapCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.mapTop}>
              <View style={[styles.mapIcon, { backgroundColor: `${c.accent}16` }]}>
                <Ionicons name="location-outline" size={20} color={c.accent} />
              </View>
              <View style={styles.mapCopy}>
                <Text style={[styles.mapLabel, { color: c.textSecondary }]}>Selected Drop-off Point</Text>
                <Text style={[styles.mapTitle, { color: c.foreground }]}>{selected.label}</Text>
              </View>
            </View>
            <View style={styles.mapMetaRow}>
              <View style={[styles.metaPill, { backgroundColor: c.background, borderColor: c.border }]}>
                <Ionicons name="navigate-outline" size={14} color={c.accent} />
                <Text style={[styles.metaText, { color: c.textSecondary }]}>{selected.distanceKm.toFixed(1)} km away</Text>
              </View>
              <View style={[styles.metaPill, { backgroundColor: c.background, borderColor: c.border }]}>
                <Ionicons name="pin-outline" size={14} color={c.accent} />
                <Text style={[styles.metaText, { color: c.textSecondary }]}>
                  {selected.gpsLat.toFixed(3)}, {selected.gpsLng.toFixed(3)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.optionsWrap}>
            {DROP_OFF_OPTIONS.map((option) => {
              const isSelected = option.id === selectedId;
              return (
                <Pressable
                  key={option.id}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: c.surface,
                      borderColor: isSelected ? c.accent : c.border,
                    },
                  ]}
                  onPress={() => setSelectedId(option.id)}
                >
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionTitle, { color: c.foreground }]}>{option.label}</Text>
                    <Text style={[styles.optionBody, { color: c.textSecondary }]}>
                      Direct drop-off route with mock verification at arrival.
                    </Text>
                  </View>
                  <View style={styles.optionMeta}>
                    <Text style={[styles.optionDistance, { color: c.textSecondary }]}>
                      {option.distanceKm.toFixed(1)} km
                    </Text>
                    <View
                      style={[
                        styles.radio,
                        {
                          borderColor: isSelected ? c.accent : c.border,
                          backgroundColor: isSelected ? c.accent : 'transparent',
                        },
                      ]}
                    >
                      {isSelected ? <Ionicons name="checkmark" size={12} color={c.accentContrast} /> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
          <PrimaryButton
            label="Continue to Review"
            onPress={() => {
              setLocation({
                dropOffPoint: selected.label,
                gpsLat: selected.gpsLat,
                gpsLng: selected.gpsLng,
                distanceKm: selected.distanceKm,
              });
              router.push('/batch/new/review');
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screen: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 6,
  },
  stepText: {
    fontSize: FontSize.sm,
    fontFamily: Font.semiBold,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontFamily: Font.bold,
    lineHeight: 28,
  },
  body: {
    fontSize: FontSize.md,
    fontFamily: Font.regular,
    lineHeight: 22,
    maxWidth: 320,
  },
  mapCard: {
    marginHorizontal: 20,
    marginTop: 22,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 16,
  },
  mapTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  mapIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCopy: {
    flex: 1,
    gap: 4,
  },
  mapLabel: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  mapTitle: {
    fontSize: FontSize.lg,
    fontFamily: Font.semiBold,
  },
  mapMetaRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  metaPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  optionsWrap: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 12,
  },
  optionCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  optionCopy: {
    flex: 1,
    gap: 6,
  },
  optionTitle: {
    fontSize: FontSize.md,
    fontFamily: Font.semiBold,
  },
  optionBody: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
  },
  optionMeta: {
    alignItems: 'flex-end',
    gap: 10,
  },
  optionDistance: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
});
