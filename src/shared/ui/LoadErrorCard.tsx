import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { PrimaryButton } from './PrimaryButton';

interface LoadErrorCardProps {
  message?: string;
  onRetry?: () => void;
}

export function LoadErrorCard({ message, onRetry }: LoadErrorCardProps) {
  const c = useThemeColors();
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Ionicons name="alert-circle-outline" size={22} color={c.error} />
      <Text style={[styles.title, { color: c.foreground }]}>Something went wrong</Text>
      <Text style={[styles.text, { color: c.textMuted }]}>
        {message ?? 'Could not load this content. Please try again.'}
      </Text>
      {onRetry ? (
        <View style={styles.btnWrap}>
          <PrimaryButton label="Retry" variant="outline" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 18, alignItems: 'flex-start', gap: 10 },
  title: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  text: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  btnWrap: { alignSelf: 'stretch', marginTop: 4 },
});
