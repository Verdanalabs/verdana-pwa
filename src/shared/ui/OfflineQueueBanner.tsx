import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { withAlpha, Alpha } from '@/src/shared/theme/color';

export interface OfflineQueueBannerProps {
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
  onSyncNow: () => void;
  /** What is waiting, in the plural. "batches", "weighings". */
  itemLabel: string;
  failedMessages?: string[];
}

/**
 * Tells the operator that work is sitting on the device.
 *
 * Without this, a queued record is invisible: the submit screen says it saved
 * and nothing ever says whether it left the phone. Renders nothing when the
 * queue is empty.
 */
export function OfflineQueueBanner({
  pendingCount,
  failedCount,
  isSyncing,
  onSyncNow,
  itemLabel,
  failedMessages = [],
}: OfflineQueueBannerProps) {
  const c = useThemeColors();

  if (pendingCount === 0 && failedCount === 0) return null;

  const hasFailures = failedCount > 0;
  // The failed variant uses the danger tone pair rather than a tint of the raw
  // error colour: a 10% tint lightens the ground in dark mode and drops the
  // message text under AA.
  const background = hasFailures ? c.toneBg.danger : c.surface;
  const borderColor = hasFailures ? c.toneFg.danger : c.border;
  const iconColor = hasFailures ? c.toneFg.danger : c.accentInk;
  const titleColor = hasFailures ? c.toneFg.danger : c.foreground;
  const captionColor = hasFailures ? c.toneFg.danger : c.textMuted;

  return (
    <View style={[styles.card, { backgroundColor: background, borderColor }]}>
      <View style={[styles.iconWell, { backgroundColor: withAlpha(iconColor, Alpha.soft) }]}>
        {isSyncing ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Ionicons name={hasFailures ? 'alert-circle-outline' : 'cloud-upload-outline'} size={20} color={iconColor} />
        )}
      </View>

      <View style={styles.textCol}>
        <Text style={[styles.title, { color: titleColor }]}>
          {isSyncing
            ? `Syncing ${itemLabel}…`
            : hasFailures
              ? `${failedCount} ${itemLabel} could not sync`
              : `${pendingCount} ${itemLabel} waiting to sync`}
        </Text>

        {hasFailures && failedMessages.length > 0 ? (
          failedMessages.slice(0, 2).map((message, i) => (
            <Text key={i} style={[styles.caption, { color: captionColor }]} numberOfLines={2}>
              {message}
            </Text>
          ))
        ) : (
          <Text style={[styles.caption, { color: captionColor }]}>
            {isSyncing
              ? 'Keep this screen open until it finishes.'
              : 'They upload automatically once you are back online.'}
          </Text>
        )}

        {!isSyncing && (
          <TouchableOpacity onPress={onSyncNow} activeOpacity={0.7} hitSlop={8}>
            <Text style={[styles.action, { color: hasFailures ? c.toneFg.danger : c.accentInk }]}>
              {hasFailures ? 'Try again' : 'Sync now'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  iconWell: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 4 },
  title: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  caption: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 19 },
  action: { fontSize: FontSize.sm, fontFamily: Font.semiBold, marginTop: 2 },
});
