import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import {
  addProcessingStage,
  completeProcessing,
  getProcessingBatch,
  type ProcessingBatch,
} from '@/src/features/processing/services/processing-api';

const STAGES = ['sorting', 'washing', 'shredding', 'drying'];
const GRADES = ['A', 'B', 'C'];

export default function ProcessingBatchScreen() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = usePvpAuth();

  const [batch, setBatch] = useState<ProcessingBatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stage, setStage] = useState('sorting');
  const [stageNotes, setStageNotes] = useState('');
  const [finalKg, setFinalKg] = useState('');
  const [finalGrade, setFinalGrade] = useState('A');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id || !token) return;
    try {
      const data = await getProcessingBatch(token, id);
      setBatch(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [id, token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleAddStage() {
    if (!token || !id) return;
    setBusy(true);
    setError(null);
    try {
      await addProcessingStage(token, id, { stage, notes: stageNotes || undefined });
      setStageNotes('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add stage.');
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    if (!token || !id) return;
    const grams = Math.round(parseFloat(finalKg) * 1000);
    if (grams < 0 || Number.isNaN(grams)) {
      setError('Enter a valid final weight.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await completeProcessing(token, id, { final_weight_grams: grams, final_grade: finalGrade });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete.');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.center}><ActivityIndicator color={c.accent} /></View>
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

  const isInProgress = batch?.status === 'in_progress';

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
        <Text style={[styles.topTitle, { color: c.foreground }]}>Processing Batch</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Row label="Material" value={batch!.material.toUpperCase()} />
          <Row label="Initial" value={`${(batch!.initial_weight_grams / 1000).toFixed(1)} kg`} />
          {batch!.final_weight_grams != null && <Row label="Final" value={`${(batch!.final_weight_grams / 1000).toFixed(1)} kg`} />}
          {batch!.yield_percent != null && <Row label="Yield" value={`${batch!.yield_percent}%`} />}
          {batch!.final_grade && <Row label="Final Grade" value={batch!.final_grade} />}
          <Row label="Status" value={batch!.status.replace(/_/g, ' ')} />
        </View>

        {/* Stage history */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Stages</Text>
          {batch!.stages && batch!.stages.length > 0 ? (
            batch!.stages.map((s) => (
              <View key={s.id} style={styles.stageRow}>
                <Ionicons name="checkmark-circle" size={16} color={c.accent} />
                <Text style={[styles.stageText, { color: c.foreground }]}>{s.stage}</Text>
                {s.notes ? <Text style={[styles.stageNotes, { color: c.textMuted }]}>· {s.notes}</Text> : null}
              </View>
            ))
          ) : (
            <Text style={[styles.muted, { color: c.textMuted }]}>No stages recorded yet.</Text>
          )}
        </View>

        {isInProgress && (
          <>
            {/* Add stage */}
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Record Stage</Text>
              <View style={styles.chips}>
                {STAGES.map((s) => {
                  const active = s === stage;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, { borderColor: active ? c.accent : c.border, backgroundColor: active ? `${c.accent}18` : c.background }]}
                      onPress={() => setStage(s)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, { color: active ? c.accent : c.textSecondary }]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                value={stageNotes}
                onChangeText={setStageNotes}
                placeholder="Notes (optional)"
                placeholderTextColor={c.textFaint}
                style={[styles.notesInput, { color: c.foreground, borderColor: c.border, backgroundColor: c.background }]}
              />
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: c.accent }]}
                onPress={handleAddStage}
                disabled={busy}
                activeOpacity={0.85}
              >
                <Text style={[styles.secondaryBtnLabel, { color: c.accent }]}>Add Stage</Text>
              </TouchableOpacity>
            </View>

            {/* Complete result */}
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Final Result</Text>
              <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.background }]}>
                <TextInput
                  value={finalKg}
                  onChangeText={setFinalKg}
                  placeholder="0.0"
                  placeholderTextColor={c.textFaint}
                  keyboardType="decimal-pad"
                  style={[styles.input, { color: c.foreground }]}
                />
                <Text style={[styles.unit, { color: c.textSecondary }]}>kg</Text>
              </View>
              <View style={styles.chips}>
                {GRADES.map((g) => {
                  const active = g === finalGrade;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, { borderColor: active ? c.accent : c.border, backgroundColor: active ? `${c.accent}18` : c.background }]}
                      onPress={() => setFinalGrade(g)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, { color: active ? c.accent : c.textSecondary }]}>Grade {g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: finalKg.trim() ? c.accent : c.border }]}
                onPress={handleComplete}
                disabled={!finalKg.trim() || busy}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryBtnLabel, { color: finalKg.trim() ? c.accentContrast : c.textMuted }]}>Complete Processing</Text>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: FontSize.sm, fontFamily: Font.regular, flex: 1 },
  rowValue: { fontSize: FontSize.sm, fontFamily: Font.medium, flex: 2, textAlign: 'right' },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stageText: { fontSize: FontSize.sm, fontFamily: Font.semiBold, textTransform: 'capitalize' },
  stageNotes: { fontSize: FontSize.sm, fontFamily: Font.regular, flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: FontSize.sm, fontFamily: Font.semiBold, textTransform: 'capitalize' },
  notesInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 48, fontSize: FontSize.sm, fontFamily: Font.regular },
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
