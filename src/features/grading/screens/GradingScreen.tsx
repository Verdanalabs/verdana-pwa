import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { NoticeCard } from '@/src/shared/ui/NoticeCard';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { createUploadUrl } from '@/src/features/batch/services/batch-api';
import { createGrading, listBatchGradings, type Grading, type GradingMedia } from '@/src/features/grading/services/grading-api';

const CATEGORIES = ['PET', 'HDPE', 'LDPE', 'PP', 'MIX', 'ORGANIC', 'CARDBOARD', 'METAL', 'GLASS'];
const GRADES = ['A', 'B', 'C'];

// Web file picker — returns a data URL, or null if cancelled. PVP app runs as web.
function pickImageDataUrl(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export default function GradingScreen() {
  const c = useThemeColors();
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  const { token } = usePvpAuth();

  const [history, setHistory] = useState<Grading[]>([]);
  const [category, setCategory] = useState('PET');
  const [grade, setGrade] = useState('A');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [contaminationNotes, setContaminationNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddPhoto() {
    const dataUrl = await pickImageDataUrl();
    if (dataUrl) setPhotos((prev) => [...prev, dataUrl]);
  }

  const load = useCallback(async () => {
    if (!batchId || !token) return;
    try {
      const data = await listBatchGradings(token, batchId);
      setHistory(data);
    } catch {
      // history is non-critical; ignore load errors
    }
  }, [batchId, token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleSubmit() {
    if (!token || !batchId) return;
    setBusy(true);
    setError(null);
    try {
      // Upload inspection photos (if any) via presigned URL → R2, collect storage keys.
      const media: GradingMedia[] = [];
      for (const dataUrl of photos) {
        const { upload_url, storage_key } = await createUploadUrl(token, {
          batch_id: batchId,
          content_type: 'image/jpeg',
          filename: 'grading.jpg',
        });
        const blob = await dataUrlToBlob(dataUrl);
        const uploadRes = await fetch(upload_url, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': 'image/jpeg' },
        });
        if (!uploadRes.ok) throw new Error(`Photo upload failed (${uploadRes.status})`);
        media.push({ storage_key, mime_type: 'image/jpeg' });
      }

      await createGrading(token, batchId, {
        category: category.toLowerCase(),
        grade,
        inspection_notes: inspectionNotes || undefined,
        contamination_notes: contaminationNotes || undefined,
        media: media.length > 0 ? media : undefined,
      });
      setInspectionNotes('');
      setContaminationNotes('');
      setPhotos([]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save grading.');
    } finally {
      setBusy(false);
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
        <Text style={[styles.topTitle, { color: c.foreground }]}>Grade Material</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.label, { color: c.foreground }]}>Category</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((m) => {
              const active = m === category;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, { borderColor: active ? c.accent : c.border, backgroundColor: active ? `${c.accent}18` : c.background }]}
                  onPress={() => setCategory(m)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, { color: active ? c.accent : c.textSecondary }]}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.label, { color: c.foreground }]}>Grade</Text>
          <View style={styles.chips}>
            {GRADES.map((g) => {
              const active = g === grade;
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, { borderColor: active ? c.accent : c.border, backgroundColor: active ? `${c.accent}18` : c.background }]}
                  onPress={() => setGrade(g)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, { color: active ? c.accent : c.textSecondary }]}>Grade {g}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.label, { color: c.foreground }]}>Quality Notes</Text>
          <TextInput
            value={inspectionNotes}
            onChangeText={setInspectionNotes}
            placeholder="Inspection notes (optional)"
            placeholderTextColor={c.textFaint}
            multiline
            style={[styles.notesInput, { color: c.foreground, borderColor: c.border, backgroundColor: c.background }]}
          />
          <TextInput
            value={contaminationNotes}
            onChangeText={setContaminationNotes}
            placeholder="Contamination records (optional)"
            placeholderTextColor={c.textFaint}
            multiline
            style={[styles.notesInput, { color: c.foreground, borderColor: c.border, backgroundColor: c.background }]}
          />
        </View>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.label, { color: c.foreground }]}>Inspection Photos</Text>
          {photos.length > 0 && (
            <View style={styles.photoRow}>
              {photos.map((uri, i) => (
                <View key={i} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                  <TouchableOpacity
                    style={[styles.thumbRemove, { backgroundColor: c.error }]}
                    onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={12} color={c.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={[styles.addPhotoBtn, { borderColor: c.accentInk }]}
            onPress={handleAddPhoto}
            activeOpacity={0.85}
          >
            <Ionicons name="camera-outline" size={18} color={c.accentInk} />
            <Text style={[styles.addPhotoLabel, { color: c.accentInk }]}>Add Photo</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <NoticeCard tone="danger">{error}</NoticeCard>
        )}

        {history.length > 0 && (
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.label, { color: c.foreground }]}>Grading History</Text>
            {history.map((g) => (
              <View key={g.id} style={styles.row}>
                <Text style={[styles.rowLabel, { color: c.textMuted }]}>
                  {g.category.toUpperCase()} · Grade {g.grade}
                </Text>
                <Text style={[styles.rowValue, { color: c.foreground }]}>{g.created_at.slice(0, 10)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
        {busy ? (
          <View style={styles.loadingRow}><ActivityIndicator color={c.accentInk} /></View>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: c.accent }]}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnLabel, { color: c.accentContrast }]}>Save Grading</Text>
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
  content: { padding: 20, gap: 14, paddingBottom: 32 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  label: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: FontSize.sm, fontFamily: Font.semiBold },
  notesInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, minHeight: 56, fontSize: FontSize.sm, fontFamily: Font.regular },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumbWrap: { position: 'relative' },
  thumb: { width: 72, height: 72, borderRadius: 12 },
  thumbRemove: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, borderWidth: 1 },
  addPhotoLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: FontSize.sm, fontFamily: Font.medium, flex: 2 },
  rowValue: { fontSize: FontSize.sm, fontFamily: Font.regular, flex: 1, textAlign: 'right' },
  errorCard: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  errorText: { flex: 1, fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, borderTopWidth: 1 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54 },
  primaryBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
});
