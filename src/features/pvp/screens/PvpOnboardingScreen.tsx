import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

import * as Location from 'expo-location';

type LocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'granted'; lat: number; lng: number }
  | { status: 'denied' };

function LocationStatusCard({
  location,
  onRefresh,
}: {
  location: LocationState;
  onRefresh: () => void;
}) {
  const c = useThemeColors();

  if (location.status === 'loading') {
    return (
      <View style={[styles.statusCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={styles.statusTop}>
          <View style={styles.statusTitleRow}>
            <ActivityIndicator size="small" color={c.accent} />
            <Text style={[styles.statusTitle, { color: c.foreground }]}>Capturing location</Text>
          </View>
        </View>
        <Text style={[styles.statusBody, { color: c.textMuted }]}>
          Getting your current coordinates for this station.
        </Text>
      </View>
    );
  }

  if (location.status === 'granted') {
    return (
      <View style={[styles.statusCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={styles.statusTop}>
          <View style={styles.statusTitleRow}>
            <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
            <Text style={[styles.statusTitle, { color: c.foreground }]}>Location confirmed</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
            <Text style={[styles.statusAction, { color: c.accent }]}>Refresh</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.statusCoords, { color: c.textSecondary }]}>
          {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </Text>
        <Text style={[styles.statusBody, { color: c.textMuted }]}>
          This location will be used as the active operating point for your PVP station.
        </Text>
      </View>
    );
  }

  if (location.status === 'denied') {
    return (
      <View style={[styles.statusCard, { backgroundColor: c.surface, borderColor: c.error }]}>
        <View style={styles.statusTop}>
          <View style={styles.statusTitleRow}>
            <Ionicons name="alert-circle" size={18} color={c.error} />
            <Text style={[styles.statusTitle, { color: c.foreground }]}>Location access required</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
            <Text style={[styles.statusAction, { color: c.accent }]}>Try again</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.statusBody, { color: c.textMuted }]}>
          Allow location permission in your browser or device settings to finish station setup.
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.locationPrompt, { backgroundColor: c.surface, borderColor: c.border }]}
      onPress={onRefresh}
      activeOpacity={0.85}
    >
      <View style={[styles.locationPromptIcon, { backgroundColor: `${c.accent}14` }]}>
        <Ionicons name="locate-outline" size={18} color={c.accent} />
      </View>
      <View style={styles.locationPromptCopy}>
        <Text style={[styles.locationPromptTitle, { color: c.foreground }]}>Use current location</Text>
        <Text style={[styles.locationPromptText, { color: c.textMuted }]}>
          Capture this station&apos;s live coordinates.
        </Text>
      </View>
      <Ionicons name="arrow-forward" size={16} color={c.textMuted} />
    </TouchableOpacity>
  );
}

export default function PvpOnboardingRoute() {
  const c = useThemeColors();
  const { completeOnboarding } = usePvpAuth();

  const [stationName, setStationName] = useState('');
  const [location, setLocation] = useState<LocationState>({ status: 'idle' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = stationName.trim().length > 0 && location.status === 'granted' && !isSubmitting;

  async function handleGetLocation() {
    setLocation({ status: 'loading' });
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocation({ status: 'denied' });
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLocation({ status: 'granted', lat: pos.coords.latitude, lng: pos.coords.longitude });
  }

  async function handleSubmit() {
    if (!canSubmit || location.status !== 'granted') return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await completeOnboarding({
        stationName: stationName.trim(),
        lat: location.lat,
        lng: location.lng,
      });
      router.replace('/(pvp-tabs)/dashboard' as never);
    } catch {
      setSubmitError('Failed to register station. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={[styles.heroBadge, { borderColor: `${c.accent}26`, backgroundColor: `${c.accent}10` }]}>
            <Text style={[styles.heroBadgeText, { color: c.accent }]}>PVP SETUP</Text>
          </View>

          <Text style={[styles.title, { color: c.foreground }]}>Register your station</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Create one active drop-off point with a clear name and verified location.
          </Text>

          <LinearGradient
            colors={[c.heroGradient[0], c.heroGradient[1], c.heroGradient[2]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroPanel, { borderColor: c.border }]}
          >
            <View style={styles.heroPanelTop}>
              <View>
                <Text style={[styles.heroPanelEyebrow, { color: c.ctaMuted }]}>ACTIVE STATION</Text>
                <Text style={[styles.heroPanelValue, { color: c.white }]}>
                  {stationName.trim() || 'Not named yet'}
                </Text>
              </View>
              <View style={[styles.heroIconWrap, { backgroundColor: c.white + '12', borderColor: c.white + '18' }]}>
                <Ionicons name="business-outline" size={22} color={c.white} />
              </View>
            </View>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <Text style={[styles.heroMetaLabel, { color: c.ctaMuted }]}>Name</Text>
                <Text style={[styles.heroMetaValue, { color: c.white }]}>
                  {stationName.trim() ? 'Ready' : 'Required'}
                </Text>
              </View>
              <View style={[styles.heroMetaDivider, { backgroundColor: c.white + '16' }]} />
              <View style={styles.heroMetaItem}>
                <Text style={[styles.heroMetaLabel, { color: c.ctaMuted }]}>Location</Text>
                <Text style={[styles.heroMetaValue, { color: c.white }]}>
                  {location.status === 'granted' ? 'Verified' : 'Pending'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Station details</Text>
            <Text style={[styles.sectionText, { color: c.textMuted }]}>
              Keep the name specific enough for operators and suppliers to recognize it quickly.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textSecondary }]}>Station name</Text>
            <View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={[styles.inputIconWrap, { backgroundColor: c.backgroundSoft }]}>
                <Ionicons name="business-outline" size={16} color={c.textMuted} />
              </View>
              <TextInput
                value={stationName}
                onChangeText={setStationName}
                placeholder="e.g. Verdana Collection Point Bekasi"
                placeholderTextColor={c.textFaint}
                style={[styles.input, { color: c.foreground }]}
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Station location</Text>
            <Text style={[styles.sectionText, { color: c.textMuted }]}>
              Capture your current position once so this site can operate from the right place.
            </Text>
          </View>

          <LocationStatusCard location={location} onRefresh={handleGetLocation} />
        </View>

        {submitError && (
          <View style={[styles.errorCard, { backgroundColor: `${c.error}10`, borderColor: `${c.error}22` }]}>
            <Ionicons name="alert-circle-outline" size={16} color={c.error} />
            <Text style={[styles.submitError, { color: c.error }]}>{submitError}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor: canSubmit ? c.accent : c.surface,
              borderColor: canSubmit ? c.accent : c.border,
            },
          ]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={!canSubmit}
        >
          {isSubmitting
            ? <ActivityIndicator color={c.accentContrast} />
            : <>
                <Text style={[styles.submitBtnText, { color: canSubmit ? c.accentContrast : c.textMuted }]}>
                  Start operating
                </Text>
                <Ionicons name="arrow-forward" size={18} color={canSubmit ? c.accentContrast : c.textMuted} />
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32, gap: 28 },
  hero: { gap: 14 },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroBadgeText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.4,
  },
  title: { fontFamily: Font.bold, fontSize: FontSize['4xl'], lineHeight: 40 },
  subtitle: { fontFamily: Font.regular, fontSize: FontSize.md, lineHeight: 24, maxWidth: '92%' },
  heroPanel: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 18,
    overflow: 'hidden',
  },
  heroPanelTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  heroPanelEyebrow: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
  },
  heroPanelValue: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    lineHeight: 24,
    marginTop: 6,
  },
  heroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetaItem: {
    flex: 1,
    gap: 3,
  },
  heroMetaLabel: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
  },
  heroMetaValue: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
  },
  heroMetaDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 12,
  },
  section: { gap: 12 },
  sectionHeader: { gap: 4 },
  sectionTitle: { fontFamily: Font.semiBold, fontSize: FontSize.lg },
  sectionText: { fontFamily: Font.regular, fontSize: FontSize.sm, lineHeight: 20 },
  field: { gap: 8 },
  label: { fontFamily: Font.medium, fontSize: FontSize.sm },
  inputWrap: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: { flex: 1, fontFamily: Font.regular, fontSize: FontSize.md },
  locationPrompt: {
    minHeight: 76,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationPromptIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPromptCopy: {
    flex: 1,
    gap: 2,
  },
  locationPromptTitle: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
  locationPromptText: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  statusCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  statusTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusTitle: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
  statusAction: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
  },
  statusCoords: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
  },
  statusBody: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  errorCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  submitError: { fontFamily: Font.regular, fontSize: FontSize.sm, flex: 1, lineHeight: 18 },
  submitBtn: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitBtnText: { fontFamily: Font.semiBold, fontSize: FontSize.lg },
});
