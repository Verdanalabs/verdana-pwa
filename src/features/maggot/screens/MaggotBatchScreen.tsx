import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { addFeeding, addHarvest, getMaggotBatch, type MaggotBatch } from '@/src/features/maggot/services/maggot-api';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function MaggotBatchScreen() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = usePvpAuth();

  const [batch, setBatch] = useState<MaggotBatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fedOn, setFedOn] = useState(today());
  const [feedKg, setFeedKg] = useState('');
  const [maggotKg, setMaggotKg] = useState('');
  const [frassKg, setFrassKg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id || !token) return;
    try {
      const data = await getMaggotBatch(token, id);
      setBatch(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [id, token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleAddFeeding() {
    if (!token || !id) return;
    const grams = Math.round(parseFloat(feedKg) * 1000);
    if (!grams || grams <= 0) { setError('Enter a valid feeding quantity.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fedOn)) { setError('Date must be YYYY-MM-DD.'); return; }
    setBusy(true);
    setError(null);
    try {
      await addFeeding(token, id, { fed_on: fedOn, quantity_grams: grams });
      setFeedKg('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add feeding.');
    } finally {
      setBusy(false);
    }
  }

  async function handleHarvest() {
    if (!token || !id) return;
    const mg = Math.round(parseFloat(maggotKg) * 1000);
    const fr = Math.round(parseFloat(frassKg) * 1000);
    if (Number.isNaN(mg) || Number.isNaN(fr) || mg < 0 || fr < 0) { setError('Enter valid harvest weights.'); return; }
    setBusy(true);
    setError(null);
    try {
      await addHarvest(token, id, { maggot_weight_grams: mg, frass_weight_grams: fr });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record harvest.');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.center}><ActivityIndicator color={c.accentInk} /></View>
      </SafeAreaView>
    );
  }

  if (error && !batch) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={c.error} />
          <Text style={[styles.muted, { color: c.textMuted }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const harvested = !!batch?.harvest;

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
        <Text style={[styles.topTitle, { color: c.foreground }]}>Maggot Batch</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Row label="Organic input" value={`${(batch!.organic_weight_grams / 1000).toFixed(1)} kg`} />
          <Row label="Status" value={harvested ? 'harvested' : 'feeding'} />
          {batch!.harvest && <Row label="Maggot" value={`${(batch!.harvest.maggot_weight_grams / 1000).toFixed(1)} kg`} />}
          {batch!.harvest && <Row label="Frass" value={`${(batch!.harvest.frass_weight_grams / 1000).toFixed(1)} kg`} />}
          {batch!.yield_percent != null && <Row label="Yield" value={`${batch!.yield_percent}%`} />}
        </View>

        {/* Feeding history */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Feeding Logs</Text>
          {batch!.feedings && batch!.feedings.length > 0 ? (
            batch!.feedings.map((f) => (
              <View key={f.id} style={styles.row}>
                <Text style={[styles.rowLabel, { color: c.textMuted }]}>{f.fed_on}</Text>
                <Text style={[styles.rowValue, { color: c.foreground }]}>{(f.quantity_grams / 1000).toFixed(1)} kg</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.muted, { color: c.textMuted }]}>No feedings recorded yet.</Text>
          )}
        </View>

        {!harvested && (
          <>
            {/* Add feeding */}
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Log Feeding</Text>
              <TextInput
                value={fedOn}
                onChangeText={setFedOn}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={c.textFaint}
                style={[styles.textInput, { color: c.foreground, borderColor: c.border, backgroundColor: c.background }]}
              />
              <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.background }]}>
                <TextInput
                  value={feedKg}
                  onChangeText={setFeedKg}
                  placeholder="0.0"
                  placeholderTextColor={c.textFaint}
                  keyboardType="decimal-pad"
                  style={[styles.input, { color: c.foreground }]}
                />
                <Text style={[styles.unit, { color: c.textSecondary }]}>kg</Text>
              </View>
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: c.accentInk }]}
                onPress={handleAddFeeding}
                disabled={busy}
                activeOpacity={0.85}
              >
                <Text style={[styles.secondaryBtnLabel, { color: c.accentInk }]}>Add Feeding</Text>
              </TouchableOpacity>
            </View>

            {/* Harvest */}
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Harvest</Text>
              <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Maggot weight</Text>
              <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.background }]}>
                <TextInput
                  value={maggotKg}
                  onChangeText={setMaggotKg}
                  placeholder="0.0"
                  placeholderTextColor={c.textFaint}
                  keyboardType="decimal-pad"
                  style={[styles.input, { color: c.foreground }]}
                />
                <Text style={[styles.unit, { color: c.textSecondary }]}>kg</Text>
              </View>
              <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Frass weight</Text>
              <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.background }]}>
                <TextInput
                  value={frassKg}
                  onChangeText={setFrassKg}
                  placeholder="0.0"
                  placeholderTextColor={c.textFaint}
                  keyboardType="decimal-pad"
                  style={[styles.input, { color: c.foreground }]}
                />
                <Text style={[styles.unit, { color: c.textSecondary }]}>kg</Text>
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: maggotKg.trim() || frassKg.trim() ? c.accent : c.border }]}
                onPress={handleHarvest}
                disabled={(!maggotKg.trim() && !frassKg.trim()) || busy}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryBtnLabel, { color: maggotKg.trim() || frassKg.trim() ? c.accentContrast : c.textMuted }]}>Record Harvest</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {error && batch && (
          <View style={[styles.errorCard, { backgroundColor: `${c.error}12`, borderColor: `${c.error}25` }]}>
            <Ionicons name="alert-circle-outline" size={16} color={c.error} />
            <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: FontSize.lg, fontFamily: Font.bold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { fontSize: FontSize.sm, fontFamily: Font.regular },
  content: { padding: 20, gap: 14, paddingBottom: 32 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  sectionTitle: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  fieldLabel: { fontSize: FontSize.sm, fontFamily: Font.regular, marginBottom: -6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: FontSize.sm, fontFamily: Font.regular, flex: 1 },
  rowValue: { fontSize: FontSize.sm, fontFamily: Font.medium, flex: 2, textAlign: 'right' },
  textInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 48, fontSize: FontSize.md, fontFamily: Font.medium },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 56 },
  input: { flex: 1, fontSize: FontSize['2xl'], fontFamily: Font.bold },
  unit: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  secondaryBtn: { height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  primaryBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  errorCard: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  errorText: { flex: 1, fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
});
