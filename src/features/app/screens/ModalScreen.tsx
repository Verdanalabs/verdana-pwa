import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { useAuth } from '@/src/features/auth/state/auth-context';

export default function ModalScreen() {
  const c = useThemeColors();
  const { signOut } = useAuth();

  function handleLogout() {
    signOut();
    router.replace('/(auth)/welcome');
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.foreground }]}>Settings</Text>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: c.error }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={[styles.logoutText, { color: '#fff' }]}>Log Out</Text>
      </TouchableOpacity>
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
    marginBottom: 32,
  },
  logoutButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
});
