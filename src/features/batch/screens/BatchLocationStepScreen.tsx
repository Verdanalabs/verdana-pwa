import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { PrimaryButton } from '@/src/shared/ui/PrimaryButton';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { useBatchDraft } from '@/src/features/batch/state/batch-draft-context';
import { usePvpSites } from '@/src/features/pvp/hooks/usePvpSites';

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

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  const { sites, isLoading, error } = usePvpSites({ userLat, userLng });

  const [selectedId, setSelectedId] = useState<string | null>(
    draft.dropOffPoint ? sites.find((s) => s.name === draft.dropOffPoint)?.id ?? null : null
  );

  const selected = sites.find((s) => s.id === selectedId) ?? sites[0] ?? null;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLat(loc.coords.latitude);
      setUserLng(loc.coords.longitude);
    })();
  }, []);

  // Auto-select first site once loaded
  useEffect(() => {
    if (!selectedId && sites.length > 0) {
      setSelectedId(sites[0].id);
    }
  }, [sites, selectedId]);

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

          {selected && (
            <View style={[styles.mapCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.mapTop}>
                <View style={[styles.mapIcon, { backgroundColor: `${c.accent}16` }]}>
                  <Ionicons name="location-outline" size={20} color={c.accent} />
                </View>
                <View style={styles.mapCopy}>
                  <Text style={[styles.mapLabel, { color: c.textSecondary }]}>Selected Drop-off Point</Text>
                  <Text style={[styles.mapTitle, { color: c.foreground }]}>{selected.name}</Text>
                </View>
              </View>
              <View style={styles.mapMetaRow}>
                {selected.distanceKm != null && (
                  <View style={[styles.metaPill, { backgroundColor: c.background, borderColor: c.border }]}>
                    <Ionicons name="navigate-outline" size={14} color={c.accent} />
                    <Text style={[styles.metaText, { color: c.textSecondary }]}>
                      {selected.distanceKm.toFixed(1)} km away
                    </Text>
                  </View>
                )}
                <View style={[styles.metaPill, { backgroundColor: c.background, borderColor: c.border }]}>
                  <Ionicons name="pin-outline" size={14} color={c.accent} />
                  <Text style={[styles.metaText, { color: c.textSecondary }]}>
                    {selected.latitude.toFixed(3)}, {selected.longitude.toFixed(3)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.optionsWrap}>
            {isLoading && (
              <View style={styles.centerState}>
                <ActivityIndicator color={c.accent} />
                <Text style={[styles.stateText, { color: c.textSecondary }]}>Loading drop-off points...</Text>
              </View>
            )}

            {!isLoading && error && (
              <View style={styles.centerState}>
                <Ionicons name="alert-circle-outline" size={24} color={c.error} />
                <Text style={[styles.stateText, { color: c.textSecondary }]}>{error}</Text>
              </View>
            )}

            {!isLoading && !error && sites.map((site) => {
              const isSelected = site.id === selectedId;
              return (
                <Pressable
                  key={site.id}
                  style={[
                    styles.optionCard,
                    { backgroundColor: c.surface, borderColor: isSelected ? c.accent : c.border },
                  ]}
                  onPress={() => setSelectedId(site.id)}
                >
                  <View style={styles.optionCopy}>
                    <Text style={[styles.optionTitle, { color: c.foreground }]}>{site.name}</Text>
                    {site.address && (
                      <Text style={[styles.optionBody, { color: c.textSecondary }]}>{site.address}</Text>
                    )}
                  </View>
                  <View style={styles.optionMeta}>
                    {site.distanceKm != null && (
                      <Text style={[styles.optionDistance, { color: c.textSecondary }]}>
                        {site.distanceKm.toFixed(1)} km
                      </Text>
                    )}
                    <View
                      style={[
                        styles.radio,
                        {
                          borderColor: isSelected ? c.accent : c.border,
                          backgroundColor: isSelected ? c.accent : 'transparent',
                        },
                      ]}
                    >
                      {isSelected && <Ionicons name="checkmark" size={12} color={c.accentContrast} />}
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
            disabled={!selected}
            onPress={() => {
              if (!selected) return;
              setLocation({
                dropOffPoint: selected.name,
                pvpSiteId: selected.id,
                originLat: userLat ?? selected.latitude,
                originLng: userLng ?? selected.longitude,
                gpsLat: selected.latitude,
                gpsLng: selected.longitude,
                distanceKm: selected.distanceKm ?? 0,
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
  topBar: { paddingHorizontal: 20, paddingTop: 8 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingBottom: 20 },
  header: { paddingHorizontal: 20, paddingTop: 18, gap: 6 },
  stepText: { fontSize: FontSize.sm, fontFamily: Font.semiBold },
  title: { fontSize: FontSize['2xl'], fontFamily: Font.bold, lineHeight: 28 },
  body: { fontSize: FontSize.md, fontFamily: Font.regular, lineHeight: 22, maxWidth: 320 },
  mapCard: {
    marginHorizontal: 20,
    marginTop: 22,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 16,
  },
  mapTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  mapIcon: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  mapCopy: { flex: 1, gap: 4 },
  mapLabel: { fontSize: FontSize.sm, fontFamily: Font.medium },
  mapTitle: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  mapMetaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metaPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: { fontSize: FontSize.sm, fontFamily: Font.medium },
  optionsWrap: { paddingHorizontal: 20, paddingTop: 18, gap: 12 },
  centerState: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  stateText: { fontSize: FontSize.sm, fontFamily: Font.regular },
  optionCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  optionCopy: { flex: 1, gap: 6 },
  optionTitle: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  optionBody: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  optionMeta: { alignItems: 'flex-end', gap: 10 },
  optionDistance: { fontSize: FontSize.sm, fontFamily: Font.medium },
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
