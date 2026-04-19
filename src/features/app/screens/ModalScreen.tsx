import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';

export default function ModalScreen() {
  const c = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}> 
      <Text style={[styles.title, { color: c.foreground }]}>This is a modal</Text>
      <Link href="/" dismissTo style={styles.link}>
        <Text style={[styles.linkText, { color: c.accent }]}>Go to home screen</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
});
