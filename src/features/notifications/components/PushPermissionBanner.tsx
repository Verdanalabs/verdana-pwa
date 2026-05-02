import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';

interface PushPermissionBannerProps {
  status: string;
  error?: string | null;
  title: string;
  body: string;
  onEnable: () => void;
}

export function PushPermissionBanner({ status, error, title, body, onEnable }: PushPermissionBannerProps) {
  const c = useThemeColors();

  if (status === 'granted' || status === 'unsupported' || status === 'unconfigured' || status === 'loading') {
    return null;
  }

  const isBusy = status === 'registering';
  const isDenied = status === 'denied';

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: isDenied ? c.error : c.border }]}> 
      <View style={[styles.iconWrap, { backgroundColor: isDenied ? `${c.error}18` : `${c.accent}18` }]}> 
        <Ionicons name={isDenied ? 'notifications-off-outline' : 'notifications-outline'} size={20} color={isDenied ? c.error : c.accent} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: c.foreground }]}>{isDenied ? 'Notifications are blocked' : title}</Text>
        <Text style={[styles.body, { color: c.textSecondary }]}> 
          {isDenied ? 'Enable notifications in your browser settings to receive Verdana updates.' : error ?? body}
        </Text>
      </View>
      {!isDenied && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: c.accent }]}
          onPress={onEnable}
          activeOpacity={0.86}
          disabled={isBusy}
        >
          {isBusy ? <ActivityIndicator size="small" color={c.accentContrast} /> : <Text style={[styles.buttonText, { color: c.accentContrast }]}>Enable</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 3 },
  title: { fontFamily: Font.semiBold, fontSize: FontSize.sm },
  body: { fontFamily: Font.regular, fontSize: FontSize.xs, lineHeight: 17 },
  button: {
    minHeight: 40,
    minWidth: 76,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  buttonText: { fontFamily: Font.bold, fontSize: FontSize.xs },
});
