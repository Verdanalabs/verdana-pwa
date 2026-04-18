import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { PlatformPressable } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Font, FontSize } from '@/constants/typography';
import { useThemeColors } from '@/store/theme-context';

const LEFT_TABS = [
  { name: 'dashboard', path: '/(pvp-tabs)/dashboard', label: 'Dashboard', icon: 'grid-outline'   as const, active: 'grid'     as const },
  { name: 'log', path: '/(pvp-tabs)/log', label: 'Log', icon: 'list-outline' as const, active: 'list' as const },
];
const RIGHT_TABS = [
  { name: 'pending', path: '/(pvp-tabs)/pending', label: 'Pending', icon: 'time-outline' as const, active: 'time' as const },
  { name: 'facility', path: '/(pvp-tabs)/facility', label: 'Facility', icon: 'business-outline' as const, active: 'business' as const },
];

export function PvpCustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const c      = useThemeColors();
  const routes = state.routes.map((r) => r.name);

  const focused = (name: string) => routes[state.index] === name;

  function go(name: string, path: string) {
    const idx = routes.indexOf(name);
    if (idx === -1) return;

    navigation.emit({
      type: 'tabPress',
      target: state.routes[idx].key,
      canPreventDefault: true,
    });

    if (!focused(name)) {
      router.replace(path as never);
    }
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

      {/* FAB — QR Scan */}
      <View style={styles.fabWrap}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: c.accent, shadowColor: c.accent }]}
          onPress={() => router.push('/pvp/qr-scan' as never)}
          activeOpacity={0.85}
        >
          <Ionicons name="qr-code-outline" size={26} color={c.accentContrast} />
        </TouchableOpacity>
        <Text style={[styles.fabLabel, { color: c.textFaint }]}>Scan</Text>
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
  fabLabel: {
    fontSize: FontSize.xs,
    fontFamily: Font.medium,
  },
});
