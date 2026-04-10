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
import { Font, FontSize } from '@/constants/typography';
import { useThemeColors } from '@/store/theme-context';

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
const FRAME_WIDTH = SCREEN_WIDTH;
const FRAME_HEIGHT = Dimensions.get('window').height;

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
      scrollRef.current?.scrollTo({ x: nextIndex * FRAME_WIDTH, animated: true });
    }, 3800);

    return () => clearInterval(interval);
  }, []);

  function handleMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / FRAME_WIDTH);
    activeIndexRef.current = nextIndex;
    setActiveIndex(nextIndex);
  }

  const activeSlide = CAROUSEL_SLIDES[activeIndex];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <View style={styles.screen}>
        <View style={styles.heroFrame}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            onMomentumScrollEnd={handleMomentumScrollEnd}
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

          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.24)', 'rgba(0,0,0,0.82)', '#040804']}
            locations={[0.3, 0.56, 0.82, 1]}
            style={styles.overlay}
          >
            <View style={styles.copyBlock}>
              <Text style={styles.title}>{activeSlide.title}</Text>
              <Text style={styles.caption}>{activeSlide.caption}</Text>
            </View>

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

            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: c.accent }]}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.85}
            >
              <Text style={[styles.ctaLabel, { color: c.accentContrast }]}>Get started</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.7}>
              <Text style={styles.footerTextOverlay}>
                Already have access? <Text style={styles.footerLinkOverlay}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: '#040804',
  },
  heroFrame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    overflow: 'hidden',
    backgroundColor: '#050805',
  },
  carouselContent: {
    alignItems: 'stretch',
  },
  slideImage: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'flex-end',
    paddingHorizontal: 26,
    paddingBottom: 34,
  },
  copyBlock: {
    gap: 8,
    marginBottom: 14,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 28,
    fontFamily: Font.bold,
    letterSpacing: -0.4,
    maxWidth: '72%',
  },
  caption: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    lineHeight: 15,
    fontFamily: Font.regular,
    maxWidth: '80%',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  progressDot: {
    borderRadius: 999,
  },
  progressDotActive: {
    width: 18,
    height: 5,
    backgroundColor: '#ffffff',
  },
  progressDotIdle: {
    width: 5,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.36)',
  },
  ctaButton: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ctaLabel: {
    fontSize: FontSize.sm,
    fontFamily: Font.semiBold,
  },
  footerTextOverlay: {
    fontSize: 13,
    fontFamily: Font.regular,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.68)',
  },
  footerLinkOverlay: {
    fontFamily: Font.semiBold,
    color: '#ffffff',
  },
});
