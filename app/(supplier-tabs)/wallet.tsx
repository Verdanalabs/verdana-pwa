import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Font, FontSize } from '@/constants/typography';
import { useThemeColors } from '@/store/theme-context';

export default function WalletRoute() {
  const c = useThemeColors();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <View style={styles.center}>
        <Text style={[styles.title, { color: c.foreground }]}>Wallet</Text>
        <Text style={[styles.hint, { color: c.textMuted }]}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  title:  { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  hint:   { fontSize: FontSize.sm, fontFamily: Font.regular },
});
