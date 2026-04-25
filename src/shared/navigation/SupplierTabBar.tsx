import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PlatformPressable } from '@react-navigation/elements';
import { CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useTheme, useThemeColors } from '@/src/shared/theme/theme-context';

const FAB_GRADIENT_DARK:  [string, string, string] = ['#e8ff7a', '#b5f23d', '#5a9e10'];
const FAB_GRADIENT_LIGHT: [string, string, string] = ['#d4f06a', '#96cc2e', '#3d7010'];

const LEFT_TABS  = [
  { name: 'home', path: '/(supplier-tabs)/home', label: 'Home', icon: 'home-outline' as const, active: 'home' as const },
  { name: 'history', path: '/(supplier-tabs)/history', label: 'History', icon: 'time-outline' as const, active: 'time' as const },
];
const RIGHT_TABS = [
  { name: 'wallet', path: '/(supplier-tabs)/wallet', label: 'Wallet', icon: 'wallet-outline' as const, active: 'wallet' as const },
  { name: 'profile', path: '/(supplier-tabs)/profile', label: 'Profile', icon: 'person-outline' as const, active: 'person' as const },
];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets     = useSafeAreaInsets();
  const router     = useRouter(); // used by FAB
  const c          = useThemeColors();
  const { isDark } = useTheme();
  const routes = state.routes.map((r) => r.name);

  const focused = (name: string) => routes[state.index] === name;

  function go(name: string, path: string) {
    const idx = routes.indexOf(name);
    if (idx === -1) return;

    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes[idx].key,
      canPreventDefault: true,
    });

    if (focused(name) || event.defaultPrevented) return;

    navigation.dispatch({
      ...CommonActions.navigate(state.routes[idx]),
      target: state.key,
    });
  }

  function longPress(name: string) {
    const idx = routes.indexOf(name);
    if (idx === -1) return;

    navigation.emit({
      type: 'tabLongPress',
      target: state.routes[idx].key,
    });
  }

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          paddingBottom: insets.bottom || 12,
          shadowColor: c.shadowColor,
        },
      ]}
      >
      {LEFT_TABS.map((tab) => (
        <PlatformPressable
          key={tab.name}
          style={styles.tab}
          href={tab.path}
          accessibilityRole="tab"
          onPress={() => go(tab.name, tab.path)}
          onLongPress={() => longPress(tab.name)}
        >
          <Ionicons
            name={focused(tab.name) ? tab.active : tab.icon}
            size={22}
            color={focused(tab.name) ? c.accent : c.textFaint}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: focused(tab.name) ? c.accent : c.textFaint },
              focused(tab.name) && styles.tabLabelActive,
            ]}
          >
            {tab.label}
          </Text>
        </PlatformPressable>
      ))}

      {/* FAB */}
      <View style={styles.fabWrap}>
        <TouchableOpacity
          style={[styles.fab, { shadowColor: c.accent }]}
          onPress={() => router.push('/batch/new/photo' as never)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isDark ? FAB_GRADIENT_DARK : FAB_GRADIENT_LIGHT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color={c.accentContrast} />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={[styles.fabLabel, { color: c.textFaint }]}>Register</Text>
      </View>

      {RIGHT_TABS.map((tab) => (
        <PlatformPressable
          key={tab.name}
          style={styles.tab}
          href={tab.path}
          accessibilityRole="tab"
          onPress={() => go(tab.name, tab.path)}
          onLongPress={() => longPress(tab.name)}
        >
          <Ionicons
            name={focused(tab.name) ? tab.active : tab.icon}
            size={22}
            color={focused(tab.name) ? c.accent : c.textFaint}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: focused(tab.name) ? c.accent : c.textFaint },
              focused(tab.name) && styles.tabLabelActive,
            ]}
          >
            {tab.label}
          </Text>
        </PlatformPressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    alignItems: 'flex-start',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontFamily: Font.medium,
  },
  tabLabelActive: {
    fontFamily: Font.semiBold,
  },
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    marginTop: -22,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.65,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabel: {
    fontSize: FontSize.xs,
    fontFamily: Font.medium,
  },
});
