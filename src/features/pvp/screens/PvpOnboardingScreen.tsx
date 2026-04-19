import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Location = require('expo-location');

type LocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'granted'; lat: number; lng: number }
  | { status: 'denied' };

export default function PvpOnboardingRoute() {
  const c = useThemeColors();
  const { completeOnboarding } = usePvpAuth();

  const [name, setName] = useState('');
  const [stationName, setStationName] = useState('');
  const [location, setLocation] = useState<LocationState>({ status: 'idle' });

  const canSubmit =
    name.trim().length > 0 &&
    stationName.trim().length > 0 &&
    location.status === 'granted';

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

  function handleSubmit() {
    if (!canSubmit || location.status !== 'granted') return;
    completeOnboarding({
      name: name.trim(),
      stationName: stationName.trim(),
      lat: location.lat,
      lng: location.lng,
    });
    router.replace('/(pvp-tabs)/dashboard' as never);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="storefront-outline" size={32} color={c.accent} />
          </View>
          <Text style={[styles.title, { color: c.foreground }]}>Register your station</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Set up your drop-off point so suppliers can find and deliver to you.
          </Text>
        </View>

        <View style={styles.form}>
          {/* Nama Operator */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textSecondary }]}>Your name</Text>
            <View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="person-outline" size={18} color={c.textMuted} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full name"
                placeholderTextColor={c.textFaint}
                style={[styles.input, { color: c.foreground }]}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Nama Titik PVP */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textSecondary }]}>Station name</Text>
            <View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="business-outline" size={18} color={c.textMuted} />
              <TextInput
                value={stationName}
                onChangeText={setStationName}
                placeholder="e.g. Gudang Pak Budi Makassar"
                placeholderTextColor={c.textFaint}
                style={[styles.input, { color: c.foreground }]}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Lokasi GPS */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textSecondary }]}>Station location</Text>

            {location.status === 'idle' && (
              <TouchableOpacity
                style={[styles.locationBtn, { backgroundColor: c.surface, borderColor: c.border }]}
                onPress={handleGetLocation}
                activeOpacity={0.8}
              >
                <Ionicons name="locate-outline" size={20} color={c.accent} />
                <Text style={[styles.locationBtnText, { color: c.accent }]}>
                  Use my current location
                </Text>
              </TouchableOpacity>
            )}

            {location.status === 'loading' && (
              <View style={[styles.locationBtn, { backgroundColor: c.surface, borderColor: c.border }]}>
                <ActivityIndicator size="small" color={c.accent} />
                <Text style={[styles.locationBtnText, { color: c.textSecondary }]}>
                  Getting location...
                </Text>
              </View>
            )}

            {location.status === 'granted' && (
              <View style={[styles.locationResult, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={styles.locationResultTop}>
                  <View style={styles.locationResultLeft}>
                    <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                    <Text style={[styles.locationResultLabel, { color: '#16a34a' }]}>
                      Location captured
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleGetLocation} activeOpacity={0.7}>
                    <Text style={[styles.locationRefresh, { color: c.accent }]}>Refresh</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.locationCoords, { color: c.textMuted }]}>
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </Text>
              </View>
            )}

            {location.status === 'denied' && (
              <View style={[styles.locationResult, { backgroundColor: c.surface, borderColor: '#dc2626' }]}>
                <View style={styles.locationResultLeft}>
                  <Ionicons name="close-circle" size={18} color="#dc2626" />
                  <Text style={[styles.locationResultLabel, { color: '#dc2626' }]}>
                    Location permission denied
                  </Text>
                </View>
                <Text style={[styles.locationHint, { color: c.textMuted }]}>
                  Please allow location access in your browser or device settings, then try again.
                </Text>
                <TouchableOpacity onPress={handleGetLocation} activeOpacity={0.7}>
                  <Text style={[styles.locationRefresh, { color: c.accent }]}>Try again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: canSubmit ? c.accent : c.surface }]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={!canSubmit}
        >
          <Text style={[styles.submitBtnText, { color: canSubmit ? c.accentContrast : c.textMuted }]}>
            Start operating
          </Text>
          <Ionicons name="arrow-forward" size={18} color={canSubmit ? c.accentContrast : c.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    gap: 32,
  },
  header: { gap: 12 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: FontSize['3xl'],
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: Font.regular,
    fontSize: FontSize.md,
    lineHeight: 24,
  },
  form: { gap: 20 },
  field: { gap: 8 },
  label: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
  },
  inputWrap: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: FontSize.md,
  },
  locationBtn: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationBtnText: {
    fontFamily: Font.medium,
    fontSize: FontSize.md,
  },
  locationResult: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  locationResultTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationResultLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
  },
  locationCoords: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    letterSpacing: 0.2,
  },
  locationHint: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  locationRefresh: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
  },
  submitBtn: {
    height: 54,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitBtnText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.lg,
  },
});
