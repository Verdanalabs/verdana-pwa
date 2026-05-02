import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

export default function PvpOnboardingRoute() {
  const c = useThemeColors();
  const { invite, completeOnboarding } = usePvpAuth();

  const [fullName, setFullName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = fullName.trim().length > 1 && facilityName.trim().length > 1 && phone.trim().length > 5 && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await completeOnboarding({
        fullName: fullName.trim(),
        facilityName: facilityName.trim(),
        phone: phone.trim(),
      });
      router.replace('/pvp/pending-approval' as never);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}> 
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.heroBadge, { borderColor: `${c.accent}26`, backgroundColor: `${c.accent}10` }]}> 
            <Text style={[styles.heroBadgeText, { color: c.accent }]}>PVP REGISTRATION</Text>
          </View>

          <Text style={[styles.title, { color: c.foreground }]}>Lengkapi profil operator</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>Data ini akan ditinjau admin Verdana sebelum akses PVP kamu aktif.</Text>
        </View>

        {invite && (
          <View style={[styles.siteCard, { backgroundColor: c.surface, borderColor: c.border }]}> 
            <View style={[styles.siteIcon, { backgroundColor: `${c.accent}14` }]}> 
              <Ionicons name="business-outline" size={18} color={c.accent} />
            </View>
            <View style={styles.siteCopy}>
              <Text style={[styles.siteLabel, { color: c.textMuted }]}>Assigned PVP site</Text>
              <Text style={[styles.siteName, { color: c.foreground }]}>{invite.pvp_site.name}</Text>
              {invite.pvp_site.address ? <Text style={[styles.siteAddress, { color: c.textMuted }]}>{invite.pvp_site.address}</Text> : null}
            </View>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textSecondary }]}>Full name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Rini Prasetyo"
              placeholderTextColor={c.textFaint}
              style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.foreground }]}
              autoCapitalize="words"
              textContentType="name"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textSecondary }]}>Facility name</Text>
            <TextInput
              value={facilityName}
              onChangeText={setFacilityName}
              placeholder="PVP Bekasi-01"
              placeholderTextColor={c.textFaint}
              style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.foreground }]}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.textSecondary }]}>Phone number</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="0812 3456 7890"
              placeholderTextColor={c.textFaint}
              style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.foreground }]}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
            />
          </View>
        </View>

        {submitError && (
          <View style={[styles.errorCard, { backgroundColor: `${c.error}10`, borderColor: `${c.error}22` }]}> 
            <Ionicons name="alert-circle-outline" size={16} color={c.error} />
            <Text style={[styles.submitError, { color: c.error }]}>{submitError}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: canSubmit ? c.accent : c.surface, borderColor: canSubmit ? c.accent : c.border }]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color={c.accentContrast} />
          ) : (
            <>
              <Text style={[styles.submitBtnText, { color: canSubmit ? c.accentContrast : c.textMuted }]}>Submit for approval</Text>
              <Ionicons name="arrow-forward" size={18} color={canSubmit ? c.accentContrast : c.textMuted} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 34, paddingBottom: 32, gap: 24 },
  hero: { gap: 12 },
  heroBadge: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  heroBadgeText: { fontFamily: Font.semiBold, fontSize: FontSize.xs, letterSpacing: 0.4 },
  title: { fontFamily: Font.bold, fontSize: FontSize['4xl'], lineHeight: 40 },
  subtitle: { fontFamily: Font.regular, fontSize: FontSize.md, lineHeight: 24, maxWidth: 340 },
  siteCard: { borderRadius: 18, borderWidth: 1, padding: 16, flexDirection: 'row', gap: 12 },
  siteIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  siteCopy: { flex: 1, gap: 4 },
  siteLabel: { fontFamily: Font.medium, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.7 },
  siteName: { fontFamily: Font.semiBold, fontSize: FontSize.md },
  siteAddress: { fontFamily: Font.regular, fontSize: FontSize.sm, lineHeight: 20 },
  form: { gap: 16 },
  field: { gap: 8 },
  label: { fontFamily: Font.medium, fontSize: FontSize.sm },
  input: { height: 54, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, fontFamily: Font.regular, fontSize: FontSize.md },
  errorCard: { borderRadius: 14, borderWidth: 1, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  submitError: { flex: 1, fontFamily: Font.regular, fontSize: FontSize.sm, lineHeight: 20 },
  submitBtn: { height: 54, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 'auto' },
  submitBtnText: { fontFamily: Font.semiBold, fontSize: FontSize.md },
});
