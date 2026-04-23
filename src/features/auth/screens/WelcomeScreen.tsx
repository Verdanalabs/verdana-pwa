import { useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';


const CAROUSEL_SLIDES = [
  {
    image: require('@/assets/carousle/02-image.jpg'),
    title: 'Record plastic\nwith more clarity',
    caption: 'Start each batch with a cleaner visual record from the field.',
  },
  {
    image: require('@/assets/carousle/03-image.jpg'),
    title: 'Follow material\nas it moves',
    caption: 'Keep every step easier to track from collection to drop-off.',
  },
  {
    image: require('@/assets/carousle/01-image.jpg'),
    title: 'Stay close\nto asset progress',
    caption: 'See your batch journey in one simple mobile flow.',
  },
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function WelcomeRoute() {
  const c = useThemeColors();
  const scrollRef = useRef<ScrollView | null>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % CAROUSEL_SLIDES.length;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
    }, 3800);

    return () => clearInterval(interval);
  }, []);

  function handleMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
  }

  const activeSlide = CAROUSEL_SLIDES[activeIndex];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Full-screen carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        style={StyleSheet.absoluteFill}
        contentContainerStyle={styles.carouselContent}
      >
        {CAROUSEL_SLIDES.map((slide) => (
          <Image
            key={slide.title}
            source={slide.image}
            style={styles.slideImage}
            contentFit="cover"
          />
        ))}
      </ScrollView>

      {/* Full gradient overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.72)', 'rgba(0,0,0,0.96)']}
        locations={[0, 0.35, 0.68, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Bottom content */}
      <View style={styles.bottom}>
        {/* Copy */}
        <View style={styles.copyBlock}>
          <Text style={styles.title}>{activeSlide.title}</Text>
          <Text style={styles.caption}>{activeSlide.caption}</Text>
        </View>

        {/* Progress dots */}
        <View style={styles.progressRow}>
          {CAROUSEL_SLIDES.map((slide, index) => (
            <View
              key={slide.title}
              style={[
                styles.progressDot,
                index === activeIndex ? styles.progressDotActive : styles.progressDotIdle,
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: c.accent }]}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaLabel}>Get started</Text>
        </TouchableOpacity>

        {/* Footer */}
        <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
          <Text style={styles.footerText}>
            Already have access?{' '}
            <Text style={styles.footerLink}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#050805',
  },
  carouselContent: {
    alignItems: 'stretch',
  },
  slideImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  brandName: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 26,
    paddingBottom: 40,
    gap: 0,
  },
  copyBlock: {
    gap: 10,
    marginBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 40,
    fontFamily: Font.bold,
    letterSpacing: -0.6,
  },
  caption: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: FontSize.md,
    lineHeight: 22,
    fontFamily: Font.regular,
    maxWidth: '85%',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  progressDot: {
    borderRadius: 999,
  },
  progressDotActive: {
    width: 22,
    height: 5,
    backgroundColor: '#ffffff',
  },
  progressDotIdle: {
    width: 5,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  ctaButton: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ctaLabel: {
    fontSize: FontSize.xl,
    fontFamily: Font.bold,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  footerText: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.55)',
  },
  footerLink: {
    fontFamily: Font.semiBold,
    color: 'rgba(255,255,255,0.9)',
  },
});
