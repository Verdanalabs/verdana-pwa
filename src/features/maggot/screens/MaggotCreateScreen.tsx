import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { NoticeCard } from '@/src/shared/ui/NoticeCard';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { createMaggotBatch } from '@/src/features/maggot/services/maggot-api';

export default function MaggotCreateScreen() {
  const c = useThemeColors();
  const { token } = usePvpAuth();
  const [weightKg, setWeightKg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!token) return;
    const grams = Math.round(parseFloat(weightKg) * 1000);
    if (!grams || grams <= 0) {
      setError('Enter a valid organic waste weight.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const batch = await createMaggotBatch(token, { organic_weight_grams: grams });
      router.replace(`/maggot/${batch.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create batch.');
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: c.foreground }]}>New Maggot Batch</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.label, { color: c.foreground }]}>Organic Waste Weight</Text>
          <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.background }]}>
            <TextInput
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="0.0"
              placeholderTextColor={c.textFaint}
              keyboardType="decimal-pad"
              style={[styles.input, { color: c.foreground }]}
            />
            <Text style={[styles.unit, { color: c.textSecondary }]}>kg</Text>
          </View>
        </View>

        {error && (
          <NoticeCard tone="danger">{error}</NoticeCard>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
        {isSubmitting ? (
          <View style={styles.loadingRow}><ActivityIndicator color={c.accentInk} /></View>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: weightKg.trim() ? c.accent : c.border }]}
            onPress={handleCreate}
            disabled={!weightKg.trim()}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnLabel, { color: weightKg.trim() ? c.accentContrast : c.textMuted }]}>Create Batch</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: FontSize.lg, fontFamily: Font.bold },
  content: { padding: 20, gap: 14 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  label: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 56 },
  input: { flex: 1, fontSize: FontSize['2xl'], fontFamily: Font.bold },
  unit: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  errorCard: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  errorText: { flex: 1, fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, borderTopWidth: 1 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 16 },
  primaryBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
});
