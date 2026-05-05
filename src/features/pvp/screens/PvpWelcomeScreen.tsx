import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

export default function PvpWelcomeScreen() {
  const c = useThemeColors();
  const { operator, activeSite } = usePvpAuth();
  const name = operator?.display_name?.split(' ')[0] ?? 'Operator';
  const siteName = activeSite?.name ?? 'your PVP site';

  function continueToDashboard() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('verdana:pvp-walkthrough-seen', '1');
    }
    router.replace('/(pvp-tabs)/dashboard' as never);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}> 
      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: `${c.accent}14`, borderColor: `${c.accent}28` }]}> 
          <Ionicons name="checkmark-circle" size={18} color={c.accent} />
          <Text style={[styles.badgeText, { color: c.accent }]}>Account approved</Text>
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: c.foreground }]}>Selamat datang, {name}.</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>Kamu terdaftar di {siteName}. Berikut alur harian PVP yang perlu kamu ikuti.</Text>
        </View>

        <View style={styles.steps}>
          <View style={[styles.stepCard, { backgroundColor: c.surface, borderColor: c.border }]}> 
            <View style={[styles.stepIcon, { backgroundColor: `${c.accent}14` }]}> 
              <Ionicons name="albums-outline" size={20} color={c.accent} />
            </View>
            <View style={styles.stepCopy}>
              <Text style={[styles.stepTitle, { color: c.foreground }]}>1. Pantau antrian masuk</Text>
              <Text style={[styles.stepText, { color: c.textMuted }]}>Batch dari pengepul akan muncul di Queue. Review, lalu accept sebelum penimbangan.</Text>
            </View>
          </View>

          <View style={[styles.stepCard, { backgroundColor: c.surface, borderColor: c.border }]}> 
            <View style={[styles.stepIcon, { backgroundColor: `${c.accent}14` }]}> 
              <Ionicons name="scale-outline" size={20} color={c.accent} />
            </View>
            <View style={styles.stepCopy}>
              <Text style={[styles.stepTitle, { color: c.foreground }]}>2. Timbang dan konfirmasi</Text>
              <Text style={[styles.stepText, { color: c.textMuted }]}>Masukkan berat aktual. Sistem akan menunggu tanda tangan kolektor sebelum minting.</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: c.accent }]} onPress={continueToDashboard} activeOpacity={0.85}>
          <Text style={[styles.primaryBtnText, { color: c.accentContrast }]}>Open dashboard</Text>
          <Ionicons name="arrow-forward" size={18} color={c.accentContrast} />
        </TouchableOpacity>

        <TouchableOpacity onPress={continueToDashboard} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: c.textMuted }]}>Skip walkthrough</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 44, paddingBottom: 28, gap: 26 },
  badge: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeText: { fontFamily: Font.semiBold, fontSize: FontSize.sm },
  header: { gap: 10 },
  title: { fontFamily: Font.bold, fontSize: FontSize['4xl'], lineHeight: 42 },
  subtitle: { fontFamily: Font.regular, fontSize: FontSize.md, lineHeight: 24, maxWidth: 360 },
  steps: { gap: 12 },
  stepCard: { borderRadius: 18, borderWidth: 1, padding: 16, flexDirection: 'row', gap: 14 },
  stepIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepCopy: { flex: 1, gap: 5 },
  stepTitle: { fontFamily: Font.semiBold, fontSize: FontSize.md },
  stepText: { fontFamily: Font.regular, fontSize: FontSize.sm, lineHeight: 20 },
  primaryBtn: { marginTop: 'auto', height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  primaryBtnText: { fontFamily: Font.semiBold, fontSize: FontSize.md },
  skipText: { textAlign: 'center', fontFamily: Font.medium, fontSize: FontSize.sm },
});
