import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';

export default function BatchSuccessScreen() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();

  const shortId = id ? id.slice(0, 8).toUpperCase() : '-';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}25` }]}>
          <Ionicons name="checkmark-circle" size={52} color={c.accent} />
        </View>

        <View style={styles.headingBlock}>
          <Text style={[styles.title, { color: c.foreground }]}>Batch Submitted!</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Your batch is now waiting for PVP review. The QR handoff will be available after the operator accepts the batch.
          </Text>
        </View>

        <View style={[styles.idCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.idLabel, { color: c.textMuted }]}>Batch ID</Text>
          <Text style={[styles.idValue, { color: c.foreground }]}>{shortId}</Text>
          <Text style={[styles.idFull, { color: c.textFaint }]}>{id}</Text>
        </View>

        <View style={[styles.noticeCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.noticeIcon, { backgroundColor: `${c.accent}16` }]}>
            <Ionicons name="time-outline" size={22} color={c.accent} />
          </View>
          <View style={styles.noticeCopy}>
            <Text style={[styles.noticeTitle, { color: c.foreground }]}>Pending PVP review</Text>
            <Text style={[styles.noticeBody, { color: c.textSecondary }]}>
              You can track this batch from Home while the PVP team reviews the request.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: c.accent }]}
          onPress={() => router.replace('/(supplier-tabs)/home' as never)}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryLabel, { color: c.accentContrast }]}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 16 },
  iconWrap: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  headingBlock: { gap: 10, alignItems: 'center' },
  title: {
    fontSize: FontSize['2xl'],
    fontFamily: Font.bold,
    textAlign: 'center',
    lineHeight: 30,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontFamily: Font.regular,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  idCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 6 },
  idLabel: {
    fontSize: FontSize.xs,
    fontFamily: Font.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  idValue: { fontSize: FontSize.xl, fontFamily: Font.bold },
  idFull: { fontSize: FontSize.xs, fontFamily: Font.regular },
  noticeCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
  },
  noticeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeCopy: { flex: 1, gap: 6 },
  noticeTitle: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  noticeBody: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
});
