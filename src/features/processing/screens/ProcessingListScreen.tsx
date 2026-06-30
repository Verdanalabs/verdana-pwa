import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { listProcessingBatches, type ProcessingBatch } from '@/src/features/processing/services/processing-api';

export default function ProcessingListScreen() {
  const c = useThemeColors();
  const { token } = usePvpAuth();
  const [batches, setBatches] = useState<ProcessingBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let cancelled = false;
      setIsLoading(true);
      listProcessingBatches(token)
        .then((data) => { if (!cancelled) setBatches(data); })
        .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load'); })
        .finally(() => { if (!cancelled) setIsLoading(false); });
      return () => { cancelled = true; };
    }, [token]),
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: c.foreground }]}>Processing</Text>
        <View style={{ width: 42 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={c.accent} /></View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={c.error} />
          <Text style={[styles.muted, { color: c.textMuted }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={batches}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="cube-outline" size={36} color={c.textMuted} />
              <Text style={[styles.muted, { color: c.textMuted }]}>No processing batches yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
              onPress={() => router.push(`/processing/${item.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.cardRow}>
                <Text style={[styles.cardTitle, { color: c.foreground }]}>{item.material.toUpperCase()}</Text>
                <View style={[styles.pill, { backgroundColor: item.status === 'completed' ? `${c.accent}18` : '#f59e0b20' }]}>
                  <Text style={[styles.pillText, { color: item.status === 'completed' ? c.accent : '#f59e0b' }]}>
                    {item.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.cardSub, { color: c.textMuted }]}>
                Initial {(item.initial_weight_grams / 1000).toFixed(1)} kg
                {item.yield_percent != null ? ` · Yield ${item.yield_percent}%` : ''}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: c.accent }]}
          onPress={() => router.push('/processing/new')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color={c.accentContrast} />
          <Text style={[styles.primaryBtnLabel, { color: c.accentContrast }]}>New Processing Batch</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: FontSize.lg, fontFamily: Font.bold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60 },
  muted: { fontSize: FontSize.sm, fontFamily: Font.regular, textAlign: 'center' },
  list: { padding: 20, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: FontSize.md, fontFamily: Font.bold },
  cardSub: { fontSize: FontSize.sm, fontFamily: Font.regular },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: FontSize.xs, fontFamily: Font.semiBold },
  footer: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, borderTopWidth: 1 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 16, gap: 8 },
  primaryBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
});
