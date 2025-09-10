/**
 * Lotus Onboarding Flow
 * Enhanced progressive onboarding for world-class user activation
 */
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Layout } from '@/constants';
import { useAuthActions } from '@/store/authStore';
import Text from '@/components/Text';
import Button from '@/components/Button';
// Removed complex imports temporarily

const { width, height } = Dimensions.get('window');
const ONBOARDING_SCREENS = 3;

interface OnboardingScreenData {
  icon: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  isLastScreen?: boolean;
}

const onboardingData: OnboardingScreenData[] = [
  {
    icon: '🌱',
    titleEn: 'Identify Your Plants',
    titleAr: 'تعرف على نباتاتك',
    descriptionEn: 'Take a photo and\ninstantly identify\nany houseplant',
  },
  {
    icon: '💧',
    titleEn: 'Smart Care Reminders',
    titleAr: 'تذكيرات العناية الذكية',
    descriptionEn: 'Get notified when\nyour plants need\nwater or care',
  },
  {
    icon: '🧭',
    titleEn: 'Perfect Positioning',
    titleAr: 'المكان المثالي',
    descriptionEn: 'Learn where to place\nplants based on your\nwindow direction',
    isLastScreen: true,
  },
];

const OnboardingScreen = () => {
  const router = useRouter();
  const { setHasSeenOnboarding } = useAuthActions();
  const [currentScreen, setCurrentScreen] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [currentScreen]);

  const handleSkip = () => {
    setHasSeenOnboarding(true);
    router.replace('/auth');
  };

  const handleContinue = () => {
    if (currentScreen < ONBOARDING_SCREENS - 1) {
      const nextScreen = currentScreen + 1;
      setCurrentScreen(nextScreen);
      scrollViewRef.current?.scrollTo({
        x: nextScreen * width,
        animated: true,
      });
    } else {
      // Go to auth after onboarding
      setHasSeenOnboarding(true);
      router.replace('/auth');
    }
  };

  const renderProgressDots = () => (
    <View style={styles.dotsContainer}>
      {Array.from({ length: ONBOARDING_SCREENS }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor:
                index === currentScreen ? Colors.lotusGreen : Colors.mediumGray,
            },
          ]}
        />
      ))}
    </View>
  );

  const renderOnboardingScreen = (data: OnboardingScreenData, index: number) => (
    <View key={index} style={styles.screenContainer}>
      <LinearGradient
        colors={Colors.backgroundGradient}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Skip Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon with animation */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.icon}>{data.icon}</Text>
          </Animated.View>

          {/* Titles */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.titleEnglish}>{data.titleEn}</Text>
            <Text style={styles.titleArabic}>{data.titleAr}</Text>
          </Animated.View>

          {/* Description */}
          <Animated.View
            style={[
              styles.descriptionContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.description}>{data.descriptionEn}</Text>
          </Animated.View>

          {/* Progress Dots */}
          {renderProgressDots()}
        </View>

        {/* Bottom Button */}
        <View style={styles.footer}>
          <Button
            title={data.isLastScreen ? 'Get Started' : 'Continue →'}
            onPress={handleContinue}
            style={styles.continueButton}
          />
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false} // Disable swipe, only button navigation
        style={styles.scrollView}
      >
        {onboardingData.map((data, index) => renderOnboardingScreen(data, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  screenContainer: {
    width,
    height,
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
  },
  header: {
    paddingTop: Layout.statusBarHeight + Layout.lg,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingVertical: Layout.sm,
    paddingHorizontal: Layout.lg,
  },
  skipText: {
    ...Typography.buttonSecondary,
    color: Colors.nileBlue,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.lg,
  },
  iconContainer: {
    marginBottom: Layout['4xl'],
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  icon: {
    fontSize: 80,
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Layout['2xl'],
  },
  titleEnglish: {
    ...Typography.screenTitle,
    color: Colors.lotusGreen,
    textAlign: 'center',
    marginBottom: Layout.sm,
  },
  titleArabic: {
    ...Typography.arabicTitle,
    color: Colors.lotusGreen,
    textAlign: 'center',
  },
  descriptionContainer: {
    alignItems: 'center',
    marginBottom: Layout['4xl'],
  },
  description: {
    ...Typography.bodySecondary,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    paddingBottom: Layout.screenPadding + 20,
    paddingHorizontal: Layout.screenPadding,
  },
  continueButton: {
    marginTop: Layout.lg,
  },
});

export default OnboardingScreen;