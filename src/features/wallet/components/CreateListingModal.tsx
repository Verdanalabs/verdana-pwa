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
import type { CNFT } from '@/types';

interface CreateListingModalProps {
  asset: CNFT | null;
  visible: boolean;
  onClose: () => void;
  onSubmit: (params: { batch_id: string; price_idr: number; note?: string }) => Promise<void>;
}

function formatIDR(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('id-ID').format(Number(digits));
}

export function CreateListingModal({ asset, visible, onClose, onSubmit }: CreateListingModalProps) {
  const c = useThemeColors();
  const [priceRaw, setPriceRaw] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePriceChange(text: string) {
    const digits = text.replace(/\D/g, '');
    setPriceRaw(digits);
  }

  function handleClose() {
    setPriceRaw('');
    setNote('');
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    if (!asset) return;
    const priceNum = Number(priceRaw);
    if (!priceNum || priceNum <= 0) {
      setError('Price must be greater than 0');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        batch_id: asset.batchId,
        price_idr: priceNum,
        note: note.trim() || undefined,
      });
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  }

  if (!asset) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: c.foreground }]}>List Asset for Sale</Text>
              <Text style={[styles.sheetSubtitle, { color: c.textMuted }]}>
                {asset.materialType} · {asset.weightKg.toFixed(1)} kg
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

          {/* Price input */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Asking Price (IDR)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: c.background, borderColor: error && !priceRaw ? c.error ?? '#ef4444' : c.border }]}>
              <Text style={[styles.inputPrefix, { color: c.textMuted }]}>Rp</Text>
              <TextInput
                style={[styles.input, { color: c.foreground }]}
                value={formatIDR(priceRaw)}
                onChangeText={handlePriceChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={c.textFaint}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Note input */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>
              Note <Text style={{ color: c.textFaint }}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: c.background, borderColor: c.border, color: c.foreground }]}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Clean PET, dry, ready to ship"
              placeholderTextColor={c.textFaint}
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
            />
          </View>

          {/* Error */}
          {error ? (
            <Text style={[styles.errorText, { color: c.error ?? '#ef4444' }]}>{error}</Text>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: c.accent }, loading && styles.disabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={c.accentContrast} size="small" />
            ) : (
              <Text style={[styles.submitBtnText, { color: c.accentContrast }]}>List Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    paddingBottom: 40,
    gap: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sheetTitle: {
    fontSize: FontSize.xl,
    fontFamily: Font.bold,
  },
  sheetSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    gap: 8,
  },
  inputPrefix: {
    fontSize: FontSize.md,
    fontFamily: Font.medium,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: Font.medium,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: FontSize.md,
    fontFamily: Font.regular,
    minHeight: 90,
  },
  errorText: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    fontSize: FontSize.md,
    fontFamily: Font.semiBold,
  },
  disabled: {
    opacity: 0.5,
  },
});
