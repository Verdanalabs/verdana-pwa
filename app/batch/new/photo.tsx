import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Font, FontSize } from '@/constants/typography';
import { useBatchDraft } from '@/store/batch-draft-context';
import { useThemeColors } from '@/store/theme-context';

const MOCK_PHOTOS = [
  require('@/assets/carousle/01-image.jpg'),
  require('@/assets/carousle/02-image.jpg'),
  require('@/assets/carousle/03-image.jpg'),
];

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

  const activePhoto = draft.photoUri ?? 'mock-0';
  const activeIndex = Number(activePhoto.replace('mock-', '')) || 0;

  function selectPhoto(index: number) {
    setPhoto({
      photoUri: `mock-${index}`,
      capturedAt: new Date().toISOString(),
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => {
              resetDraft();
              router.back();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={c.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={resetDraft}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={18} color={c.foreground} />
          </TouchableOpacity>
        </View>

        <StepHeader
          step="Step 1 of 4"
          title="Capture the batch photo."
          body="Take one clear photo so the batch is easy to identify before it moves to the drop-off point."
        />

        <View style={[styles.previewCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Image source={MOCK_PHOTOS[activeIndex]} style={styles.previewImage} contentFit="cover" />
          <View style={styles.previewMeta}>
            <View style={[styles.metaPill, { backgroundColor: `${c.accent}16`, borderColor: `${c.accent}20` }]}>
              <Ionicons name="camera-outline" size={14} color={c.accent} />
              <Text style={[styles.metaPillText, { color: c.textSecondary }]}>Batch photo ready</Text>
            </View>
            <Text style={[styles.previewHint, { color: c.textMuted }]}>
              {draft.capturedAt
                ? `Captured ${new Date(draft.capturedAt).toLocaleString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}`
                : 'Pick a sample photo to continue this mock flow.'}
            </Text>
          </View>
        </View>

        <View style={styles.photoRow}>
          {MOCK_PHOTOS.map((photo, index) => {
            const selected = activeIndex === index;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.thumbWrap,
                  {
                    borderColor: selected ? c.accent : c.border,
                    backgroundColor: c.surface,
                  },
                ]}
                onPress={() => selectPhoto(index)}
                activeOpacity={0.8}
              >
                <Image source={photo} style={styles.thumbImage} contentFit="cover" />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoCardWrap}>
          <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="information-circle-outline" size={18} color={c.accent} />
            <Text style={[styles.infoText, { color: c.textSecondary }]}>
              In the real flow this step will open the camera, support retake, and allow a gallery fallback.
            </Text>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
          <PrimaryButton
            label="Continue to Details"
            onPress={() => router.push('/batch/new/details')}
            disabled={!draft.photoUri}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screen: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 6,
  },
  stepText: {
    fontSize: FontSize.sm,
    fontFamily: Font.semiBold,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontFamily: Font.bold,
    lineHeight: 28,
  },
  body: {
    fontSize: FontSize.md,
    fontFamily: Font.regular,
    lineHeight: 22,
    maxWidth: 310,
  },
  previewCard: {
    margin: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 300,
  },
  previewMeta: {
    padding: 14,
    gap: 8,
  },
  metaPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaPillText: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  previewHint: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
  },
  thumbWrap: {
    flex: 1,
    height: 88,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  infoCardWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
});
