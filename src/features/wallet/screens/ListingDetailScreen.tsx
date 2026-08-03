import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/react-auth';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { MaterialBadge } from '@/src/shared/ui/MaterialBadge';
import { PrimaryButton } from '@/src/shared/ui/PrimaryButton';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { LoadErrorCard } from '@/src/shared/ui/LoadErrorCard';
import { getListing } from '@/src/features/wallet/services/listing-api';
import { createOrder } from '@/src/features/wallet/services/order-api';
import type { Listing } from '@/types';

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ListingDetailScreen() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAccessToken } = usePrivy();
  const { user } = useAuth();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const token = await getAccessToken();
      if (!token || !id) return;
      setListing(await getListing(token, id));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load listing');
    }
  }, [getAccessToken, id]);

  const reload = useCallback(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleBuy = useCallback(async () => {
    if (!listing) return;
    try {
      setSubmitting(true);
      setError(null);
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const order = await createOrder(token, listing.id);
      router.replace(`/wallet/orders/${order.id}` as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  }, [getAccessToken, listing]);

  const material = listing?.material.toUpperCase() ?? '';
  const isOwn = listing != null && user != null && listing.seller_user_id === user.id;
  const isActive = listing?.status === 'active';
  const isReserved = listing?.status === 'reserved';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Listing</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loadError && !loading ? (
          <LoadErrorCard message={loadError} onRetry={reload} />
        ) : loading || !listing ? (
          <View style={{ gap: 14 }}>
            <SkeletonBox width="100%" height={140} radius={18} />
            <SkeletonBox width="60%" height={18} radius={8} />
          </View>
        ) : (
          <>
            <View style={[styles.heroCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.heroTop}>
                <Text style={[styles.heroTitle, { color: c.foreground }]}>{material}</Text>
                <View style={[styles.priceTag, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}44` }]}>
                  <Text style={[styles.priceTagText, { color: c.accentInk }]}>{formatIDR(listing.price_idr)}</Text>
                </View>
              </View>
              <Text style={[styles.heroWeight, { color: c.textSecondary }]}>
                {listing.weight_grams ? `${(listing.weight_grams / 1000).toFixed(1)} kg` : '— kg'}
              </Text>
              <MaterialBadge material={material as never} />
              {listing.note ? <Text style={[styles.note, { color: c.textMuted }]}>{listing.note}</Text> : null}
              {listing.asset_id ? (
                <Text style={[styles.assetText, { color: c.textMuted }]}>Asset {listing.asset_id}</Text>
              ) : null}
              <Text style={[styles.metaText, { color: c.textFaint }]}>Listed {formatDate(listing.listed_at)}</Text>
            </View>

            {error ? <Text style={[styles.errorText, { color: c.error }]}>{error}</Text> : null}

            {isOwn ? (
              <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.infoText, { color: c.textMuted }]}>This is your own listing.</Text>
              </View>
            ) : isReserved ? (
              <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.infoText, { color: c.textMuted }]}>This listing is reserved while another order is in progress.</Text>
              </View>
            ) : !isActive ? (
              <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.infoText, { color: c.textMuted }]}>This listing is no longer available.</Text>
              </View>
            ) : (
              <PrimaryButton label="Place Order" onPress={handleBuy} loading={submitting} />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  heroCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 12 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: FontSize.xl, fontFamily: Font.bold },
  heroWeight: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  priceTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceTagText: { fontSize: FontSize.sm, fontFamily: Font.bold },
  note: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  assetText: { fontSize: FontSize.sm, fontFamily: Font.regular },
  metaText: { fontSize: FontSize.xs, fontFamily: Font.regular },
  errorText: { fontSize: FontSize.sm, fontFamily: Font.regular },
  infoCard: { borderWidth: 1, borderRadius: 14, padding: 16 },
  infoText: { fontSize: FontSize.sm, fontFamily: Font.regular },
});
