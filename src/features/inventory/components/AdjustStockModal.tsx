import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';

interface AdjustStockModalProps {
  visible: boolean;
  currentWeightGrams: number;
  onClose: () => void;
  onSubmit: (params: { delta_grams: number; reason?: string }) => Promise<void>;
}

type Mode = 'add' | 'remove';

export function AdjustStockModal({ visible, currentWeightGrams, onClose, onSubmit }: AdjustStockModalProps) {
  const c = useThemeColors();
  const [mode, setMode] = useState<Mode>('add');
  const [amountKg, setAmountKg] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setMode('add');
    setAmountKg('');
    setReason('');
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    const kg = Number(amountKg);
    if (!kg || kg <= 0) {
      setError('Enter an amount greater than 0');
      return;
    }
    const grams = Math.round(kg * 1000);
    const delta = mode === 'add' ? grams : -grams;
    if (currentWeightGrams + delta < 0) {
      setError('Cannot remove more than current stock');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await onSubmit({ delta_grams: delta, reason: reason.trim() || undefined });
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: c.foreground }]}>Adjust Stock</Text>
              <Text style={[styles.sheetSubtitle, { color: c.textMuted }]}>
                Current: {(currentWeightGrams / 1000).toFixed(1)} kg
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: c.background, borderColor: c.border }]}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={18} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Mode toggle */}
          <View style={[styles.toggle, { backgroundColor: c.background, borderColor: c.border }]}>
            {(['add', 'remove'] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.toggleBtn, mode === m && { backgroundColor: c.accent }]}
                onPress={() => setMode(m)}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleText, { color: mode === m ? c.accentContrast : c.textSecondary }]}>
                  {m === 'add' ? 'Add' : 'Remove'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Amount (kg)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: c.background, borderColor: c.border }]}>
              <TextInput
                style={[styles.input, { color: c.foreground }]}
                value={amountKg}
                onChangeText={setAmountKg}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor={c.textFaint}
                returnKeyType="done"
              />
              <Text style={[styles.inputSuffix, { color: c.textMuted }]}>kg</Text>
            </View>
          </View>

          {/* Reason */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>
              Reason <Text style={{ color: c.textFaint }}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: c.background, borderColor: c.border, color: c.foreground }]}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Damaged units removed"
              placeholderTextColor={c.textFaint}
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
            />
          </View>

          {error ? <Text style={[styles.errorText, { color: c.error }]}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: c.accent }, loading && styles.disabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={c.accentContrast} size="small" />
            ) : (
              <Text style={[styles.submitBtnText, { color: c.accentContrast }]}>Save Adjustment</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    paddingBottom: 40,
    gap: 18,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sheetTitle: { fontSize: FontSize.xl, fontFamily: Font.bold },
  sheetSubtitle: { fontSize: FontSize.sm, fontFamily: Font.regular, marginTop: 4 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  toggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, padding: 4, gap: 4 },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10 },
  toggleText: { fontSize: FontSize.sm, fontFamily: Font.semiBold },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: FontSize.sm, fontFamily: Font.medium },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    gap: 8,
  },
  input: { flex: 1, fontSize: FontSize.md, fontFamily: Font.medium },
  inputSuffix: { fontSize: FontSize.md, fontFamily: Font.medium },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: FontSize.md,
    fontFamily: Font.regular,
    minHeight: 90,
  },
  errorText: { fontSize: FontSize.sm, fontFamily: Font.regular },
  submitBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  submitBtnText: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  disabled: { opacity: 0.5 },
});
