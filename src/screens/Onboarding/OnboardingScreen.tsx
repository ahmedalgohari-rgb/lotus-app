import React, { FC, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Layout, Typography } from '@/constants';
import { Button, Gradient, ScreenTitle, BodyText } from '@/components';
import { useAuthActions } from '@/store';

const { width: SCREEN_WIDTH } = Dimensions.get('screen');

interface OnboardingSlide {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  emoji: string;
  backgroundColor: string[];
}

const onboardingSlides: OnboardingSlide[] = [
  {
    id: '1',
    titleEn: 'Identify Any Plant',
    titleAr: 'تعرف على أي نبتة',
    descriptionEn: 'Simply point your camera at any plant and discover its name, care needs, and growing tips instantly.',
    descriptionAr: 'ببساطة وجه الكاميرا على أي نبتة واكتشف اسمها واحتياجات العناية بها ونصائح الزراعة فوراً.',
    emoji: '📱🌿',
    backgroundColor: Colors.primaryGradient,
  },
  {
    id: '2',
    titleEn: 'Smart Care Reminders',
    titleAr: 'تذكير ذكي للعناية',
    descriptionEn: 'Never forget to water your plants again. Get personalized care schedules based on Cairo\'s climate.',
    descriptionAr: 'لا تنسى سقي نباتاتك مرة أخرى. احصل على جداول عناية شخصية بناءً على مناخ القاهرة.',
    emoji: '⏰💧',
    backgroundColor: Colors.backgroundGradient,
  },
  {
    id: '3',
    titleEn: 'Perfect Plant Placement',
    titleAr: 'موضع النبتة المثالي',
    descriptionEn: 'Find the best window direction for each plant in your home. Optimize growth with our placement guide.',
    descriptionAr: 'اعثر على أفضل اتجاه نافذة لكل نبتة في منزلك. حسّن النمو مع دليل الوضع الخاص بنا.',
    emoji: '🏠🧭',
    backgroundColor: [...Colors.primaryGradient].reverse(),
  },
];

interface OnboardingScreenProps {}

export const OnboardingScreen: FC<OnboardingScreenProps> = () => {
  const navigation = useNavigation();
  const { setHasSeenOnboarding } = useAuthActions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = (): void => {
    if (currentIndex < onboardingSlides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex });
      setCurrentIndex(nextIndex);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = (): void => {
    handleGetStarted();
  };

  const handleGetStarted = (): void => {
    setHasSeenOnboarding(true);
    navigation.navigate('Auth' as never);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const renderSlide = ({ item }: { item: OnboardingSlide }): React.JSX.Element => (
    <View style={styles.slide}>
      <Gradient 
        colors={item.backgroundColor}
        variant="custom"
        style={styles.slideGradient}
      >
        <View style={styles.slideContent}>
          {/* Emoji Hero */}
          <View style={styles.emojiContainer}>
            <ScreenTitle style={styles.emoji}>{item.emoji}</ScreenTitle>
          </View>

          {/* Content */}
          <View style={styles.textContent}>
            {/* English Title */}
            <ScreenTitle style={styles.titleEn}>
              {item.titleEn}
            </ScreenTitle>

            {/* Arabic Title */}
            <ScreenTitle style={styles.titleAr}>
              {item.titleAr}
            </ScreenTitle>

            {/* English Description */}
            <BodyText style={styles.descriptionEn}>
              {item.descriptionEn}
            </BodyText>

            {/* Arabic Description */}
            <BodyText style={styles.descriptionAr}>
              {item.descriptionAr}
            </BodyText>
          </View>
        </View>
      </Gradient>
    </View>
  );

  const renderDots = (): React.JSX.Element => (
    <View style={styles.dotsContainer}>
      {onboardingSlides.map((_, index) => {
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity,
                backgroundColor: index === currentIndex ? Colors.pureWhite : 'rgba(255, 255, 255, 0.5)',
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Skip Button */}
      <View style={styles.skipContainer}>
        <Button
          title="Skip / تخطي"
          variant="secondary"
          size="small"
          onPress={handleSkip}
          style={styles.skipButton}
        />
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingSlides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        {/* Dots Indicator */}
        {renderDots()}

        {/* Next/Get Started Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={
              currentIndex === onboardingSlides.length - 1 
                ? 'Get Started / ابدأ الآن' 
                : 'Next / التالي'
            }
            onPress={handleNext}
            style={styles.nextButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lotusGreen,
  },

  // Skip button
  skipContainer: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + Layout.screenPadding : Layout.screenPadding * 2,
    right: Layout.screenPadding,
    zIndex: 10,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    minWidth: 100,
  },

  // Slide styles
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  slideGradient: {
    flex: 1,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding * 2,
  },

  // Emoji hero
  emojiContainer: {
    marginBottom: Layout.screenPadding * 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
  },

  // Text content
  textContent: {
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  titleEn: {
    color: Colors.pureWhite,
    textAlign: 'center',
    marginBottom: Layout.sm,
  },
  titleAr: {
    color: Colors.pureWhite,
    textAlign: 'center',
    fontSize: 22,
    marginBottom: Layout.sectionSpacing,
  },
  descriptionEn: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: Typography.body.fontSize * 1.5,
    marginBottom: Layout.sm,
  },
  descriptionAr: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },

  // Bottom navigation
  bottomNavigation: {
    paddingVertical: Layout.screenPadding * 2,
    paddingHorizontal: Layout.screenPadding,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },

  // Dots indicator
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.sectionSpacing,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },

  // Button
  buttonContainer: {
    width: '100%',
    maxWidth: 280,
  },
  nextButton: {
    width: '100%',
  },
});

export default OnboardingScreen;
