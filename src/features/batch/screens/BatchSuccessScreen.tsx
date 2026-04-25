import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { useState } from 'react';

export default function BatchSuccessScreen() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const shortId = id ? id.slice(0, 8).toUpperCase() : '—';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success icon */}
        <View style={[styles.iconWrap, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}25` }]}>
          <Ionicons name="checkmark-circle" size={52} color={c.accent} />
        </View>

        {/* Heading */}
        <View style={styles.headingBlock}>
          <Text style={[styles.title, { color: c.foreground }]}>Batch Submitted!</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Your batch has been recorded on-chain and is ready for drop-off. Show the QR code to the PVP operator when you arrive.
          </Text>
        </View>

        {/* Batch ID card */}
        <View style={[styles.idCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.idLabel, { color: c.textMuted }]}>Batch ID</Text>
          <Text style={[styles.idValue, { color: c.foreground }]}>{shortId}</Text>
          <Text style={[styles.idFull, { color: c.textFaint }]}>{id}</Text>
        </View>

        {/* QR code preview card */}
        <TouchableOpacity
          style={[styles.qrCard, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={() => setQrModalOpen(true)}
          activeOpacity={0.85}
        >
          <View style={styles.qrWrap}>
            {id ? (
              <QRCode
                value={id}
                size={180}
                backgroundColor="transparent"
                color={c.foreground}
              />
            ) : (
              <View style={[styles.qrPlaceholder, { backgroundColor: c.border }]} />
            )}
          </View>
          <View style={styles.qrFooter}>
            <Text style={[styles.qrHint, { color: c.textSecondary }]}>
              Show this to the PVP operator at drop-off
            </Text>
            <View style={[styles.expandPill, { backgroundColor: `${c.accent}16`, borderColor: `${c.accent}20` }]}>
              <Ionicons name="expand-outline" size={13} color={c.accent} />
              <Text style={[styles.expandLabel, { color: c.accent }]}>Full screen</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* How it works */}
        <View style={[styles.stepsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.stepsTitle, { color: c.foreground }]}>What happens next?</Text>
          <Step n="1" label="Bring your recyclables to the drop-off point." c={c} />
          <Step n="2" label="PVP operator scans this QR code to find your batch." c={c} />
          <Step n="3" label="Operator weighs and co-signs — status updates to Verified." c={c} />
          <Step n="4" label="Your cNFT asset gets minted once verified." c={c} last />
        </View>
      </ScrollView>

      {/* Footer buttons */}
      <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: c.border, backgroundColor: c.surface }]}
          onPress={() => router.replace('/(supplier-tabs)/history')}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryLabel, { color: c.foreground }]}>Done</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: c.accent }]}
          onPress={() => router.replace(`/batch/${id}` as never)}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryLabel, { color: c.accentContrast }]}>View Batch</Text>
        </TouchableOpacity>
      </View>

      {/* QR fullscreen modal */}
      <Modal
        transparent
        visible={qrModalOpen}
        animationType="fade"
        onRequestClose={() => setQrModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setQrModalOpen(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: c.foreground }]}>Batch QR Code</Text>
            <Text style={[styles.modalSub, { color: c.textMuted }]}>{shortId}</Text>
            <View style={[styles.qrLargeWrap, { backgroundColor: c.background, borderColor: c.border }]}>
              {id && (
                <QRCode
                  value={id}
                  size={260}
                  backgroundColor="transparent"
                  color={c.foreground}
                />
              )}
            </View>
            <Text style={[styles.modalHint, { color: c.textMuted }]}>
              Ask the PVP operator to scan this code
            </Text>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: `${c.accent}16`, borderColor: `${c.accent}25` }]}
              onPress={() => setQrModalOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.closeBtnLabel, { color: c.accent }]}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Step({ n, label, c, last }: { n: string; label: string; c: any; last?: boolean }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepRail}>
        <View style={[styles.stepNum, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}25` }]}>
          <Text style={[styles.stepNumText, { color: c.accent }]}>{n}</Text>
        </View>
        {!last && <View style={[styles.stepLine, { backgroundColor: c.border }]} />}
      </View>
      <Text style={[styles.stepLabel, { color: c.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 16 },
  iconWrap: {
    alignSelf: 'center',
    width: 96, height: 96,
    borderRadius: 999, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 12,
  },
  headingBlock: { gap: 10, alignItems: 'center' },
  title: { fontSize: FontSize['2xl'], fontFamily: Font.bold, textAlign: 'center', lineHeight: 30 },
  subtitle: { fontSize: FontSize.md, fontFamily: Font.regular, textAlign: 'center', lineHeight: 22, maxWidth: 320 },
  idCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 6 },
  idLabel: { fontSize: FontSize.xs, fontFamily: Font.medium, textTransform: 'uppercase', letterSpacing: 0.8 },
  idValue: { fontSize: FontSize.xl, fontFamily: Font.bold },
  idFull: { fontSize: FontSize.xs, fontFamily: Font.regular },
  qrCard: { borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  qrWrap: { alignItems: 'center', paddingVertical: 28 },
  qrPlaceholder: { width: 180, height: 180, borderRadius: 8 },
  qrFooter: { paddingHorizontal: 18, paddingBottom: 16, gap: 10 },
  qrHint: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  expandPill: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 7,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  expandLabel: { fontSize: FontSize.xs, fontFamily: Font.semiBold },
  stepsCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 0 },
  stepsTitle: { fontSize: FontSize.md, fontFamily: Font.semiBold, marginBottom: 14 },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepRail: { alignItems: 'center', width: 28 },
  stepNum: { width: 28, height: 28, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: FontSize.sm, fontFamily: Font.bold },
  stepLine: { width: 2, height: 22, marginTop: 4, borderRadius: 999 },
  stepLabel: { flex: 1, fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20, paddingTop: 4, paddingBottom: 20 },
  footer: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20,
    borderTopWidth: 1,
  },
  secondaryBtn: {
    flex: 1, height: 52, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  secondaryLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  primaryBtn: {
    flex: 2, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%', maxWidth: 360,
    borderWidth: 1, borderRadius: 24, padding: 24,
    alignItems: 'center', gap: 12,
  },
  modalTitle: { fontSize: FontSize.xl, fontFamily: Font.bold },
  modalSub: { fontSize: FontSize.sm, fontFamily: Font.regular },
  qrLargeWrap: {
    borderWidth: 1, borderRadius: 18,
    padding: 24, marginVertical: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  modalHint: { fontSize: FontSize.sm, fontFamily: Font.regular, textAlign: 'center', maxWidth: 260 },
  closeBtn: { marginTop: 4, borderWidth: 1, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  closeBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
});
