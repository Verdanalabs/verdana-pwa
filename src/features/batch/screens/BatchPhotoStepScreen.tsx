import { useCallback, useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/src/shared/ui/PrimaryButton';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useBatchDraft } from '@/src/features/batch/state/batch-draft-context';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { CameraOverlay } from '@/src/shared/ui/CameraOverlay';

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

export default function BatchPhotoRoute() {
  const c = useThemeColors();
  const { draft, setPhoto, resetDraft } = useBatchDraft();
  const [showCamera, setShowCamera] = useState(false);

  // Auto-open camera on first mount if no photo yet
  useEffect(() => {
    if (!draft.photoUri) {
      setShowCamera(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = useCallback((uri: string) => {
    setShowCamera(false);
    setPhoto({ photoUri: uri, capturedAt: new Date().toISOString() });
  }, [setPhoto]);

  const hasPhoto = !!draft.photoUri;

  return (
    <>
      {showCamera && (
        <CameraOverlay
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.screen}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Top bar */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: c.surface, borderColor: c.border }]}
                onPress={() => { resetDraft(); router.back(); }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={18} color={c.foreground} />
              </TouchableOpacity>
              {hasPhoto && (
                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: c.surface, borderColor: c.border }]}
                  onPress={resetDraft}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh-outline" size={18} color={c.foreground} />
                </TouchableOpacity>
              )}
            </View>

            <StepHeader
              step="Step 1 of 4"
              title="Capture the batch photo."
              body="Take one clear photo of the waste/material so the batch is easy to identify before drop-off."
            />

            {hasPhoto ? (
              <View style={[styles.previewCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Image
                  source={{ uri: draft.photoUri! }}
                  style={styles.previewImage}
                  contentFit="cover"
                />
                <View style={styles.previewMeta}>
                  <View style={[styles.metaPill, { backgroundColor: `${c.accent}16`, borderColor: `${c.accent}20` }]}>
                    <Ionicons name="checkmark-circle" size={14} color={c.accent} />
                    <Text style={[styles.metaPillText, { color: c.textSecondary }]}>Photo captured</Text>
                  </View>
                  {draft.capturedAt && (
                    <Text style={[styles.previewHint, { color: c.textMuted }]}>
                      {new Date(draft.capturedAt).toLocaleString('en-US', {
                        day: 'numeric', month: 'short',
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}
                onPress={() => setShowCamera(true)}
                activeOpacity={0.8}
              >
                <View style={[styles.emptyIconWrap, { backgroundColor: `${c.accent}18` }]}>
                  <Ionicons name="camera-outline" size={32} color={c.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: c.foreground }]}>No photo yet</Text>
                <Text style={[styles.emptyHint, { color: c.textMuted }]}>Tap to open the camera</Text>
              </TouchableOpacity>
            )}

            {hasPhoto && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionButtonOutline, { backgroundColor: c.surface, borderColor: c.border }]}
                  onPress={() => setShowCamera(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera-outline" size={18} color={c.foreground} />
                  <Text style={[styles.actionButtonOutlineLabel, { color: c.foreground }]}>Retake</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
            <PrimaryButton
              label="Continue to Details"
              onPress={() => router.push('/batch/new/details')}
              disabled={!hasPhoto}
            />
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  iconButton: {
    width: 42, height: 42,
    borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20, paddingTop: 18, gap: 6,
  },
  stepText: { fontSize: FontSize.sm, fontFamily: Font.semiBold },
  title: { fontSize: FontSize['2xl'], fontFamily: Font.bold, lineHeight: 28 },
  body: { fontSize: FontSize.md, fontFamily: Font.regular, lineHeight: 22, maxWidth: 310 },
  previewCard: {
    margin: 20, marginBottom: 14,
    borderWidth: 1, borderRadius: 24, overflow: 'hidden',
  },
  previewImage: { width: '100%', height: 320 },
  previewMeta: { padding: 14, gap: 8 },
  metaPill: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  metaPillText: { fontSize: FontSize.sm, fontFamily: Font.medium },
  previewHint: { fontSize: FontSize.sm, fontFamily: Font.regular },
  emptyCard: {
    margin: 20, marginBottom: 14,
    borderWidth: 1.5, borderRadius: 24, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 60, gap: 12,
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 99,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  emptyHint: { fontSize: FontSize.sm, fontFamily: Font.regular },
  actionRow: { paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', gap: 10 },
  actionButton: {
    height: 50, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  actionButtonLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  actionButtonOutline: {
    height: 50, borderRadius: 16, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  actionButtonOutlineLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  footer: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, borderTopWidth: 1,
  },
});
