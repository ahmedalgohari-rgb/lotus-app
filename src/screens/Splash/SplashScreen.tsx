import React, { FC, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors, Layout, Typography } from '@/constants';
import { Gradient, AppTitle } from '@/components';
import { useIsAuthenticated, useHasSeenOnboarding } from '@/store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

interface SplashScreenProps {}

export const SplashScreen: FC<SplashScreenProps> = () => {
  const navigation = useNavigation();
  const isAuthenticated = useIsAuthenticated();
  const hasSeenOnboarding = useHasSeenOnboarding();

  // Animation values
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      startAnimation();
      
      // Auto-advance after 3 seconds
      const timer = setTimeout(() => {
        navigateToNextScreen();
      }, 3000);

      return () => clearTimeout(timer);
    }, [])
  );

  const startAnimation = (): void => {
    // Background fade in
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Logo animation sequence
    Animated.sequence([
      // Logo scale and fade in
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Title fade in
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Tagline fade in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const navigateToNextScreen = (): void => {
    if (!hasSeenOnboarding) {
      // Navigate to onboarding
      navigation.navigate('Onboarding' as never);
    } else if (!isAuthenticated) {
      // Navigate to auth
      navigation.navigate('Auth' as never);
    } else {
      // Navigate to main app
      navigation.navigate('Main' as never);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Gradient Background */}
      <Animated.View 
        style={[
          styles.gradientContainer,
          { opacity: backgroundOpacity }
        ]}
      >
        <Gradient variant="primary" style={styles.gradient}>
          <View style={styles.content}>
            {/* Logo */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  transform: [{ scale: logoScale }],
                  opacity: logoOpacity,
                }
              ]}
            >
              <View style={styles.logo}>
                <AppTitle style={styles.logoEmoji}>🌿</AppTitle>
              </View>
            </Animated.View>

            {/* App Title */}
            <Animated.View
              style={[
                styles.titleContainer,
                { opacity: titleOpacity }
              ]}
            >
              <AppTitle style={styles.appName}>LOTUS</AppTitle>
            </Animated.View>

            {/* Taglines */}
            <Animated.View
              style={[
                styles.taglineContainer,
                { opacity: taglineOpacity }
              ]}
            >
              <AppTitle style={styles.taglineArabic}>نبتتك معانا</AppTitle>
              <AppTitle style={styles.taglineEnglish}>Your plant buddy</AppTitle>
            </Animated.View>

            {/* Version Info */}
            <Animated.View
              style={[
                styles.versionContainer,
                { opacity: taglineOpacity }
              ]}
            >
              <AppTitle style={styles.versionText}>v1.0.0</AppTitle>
            </Animated.View>
          </View>

          {/* Decorative Elements */}
          <Animated.View
            style={[
              styles.decorativeElements,
              { opacity: taglineOpacity }
            ]}
          >
            {/* Floating plant emojis */}
            <View style={[styles.floatingEmoji, styles.emoji1]}>
              <AppTitle style={styles.emojiText}>🌱</AppTitle>
            </View>
            <View style={[styles.floatingEmoji, styles.emoji2]}>
              <AppTitle style={styles.emojiText}>🍃</AppTitle>
            </View>
            <View style={[styles.floatingEmoji, styles.emoji3]}>
              <AppTitle style={styles.emojiText}>🌿</AppTitle>
            </View>
            <View style={[styles.floatingEmoji, styles.emoji4]}>
              <AppTitle style={styles.emojiText}>🌾</AppTitle>
            </View>
          </Animated.View>
        </Gradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lotusGreen,
  },
  gradientContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding * 2,
  },

  // Logo styles
  logoContainer: {
    marginBottom: Layout.screenPadding * 2,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoEmoji: {
    fontSize: 60,
    color: Colors.pureWhite,
  },

  // Title styles
  titleContainer: {
    marginBottom: Layout.sectionSpacing,
  },
  appName: {
    fontSize: 42,
    fontWeight: Typography.appTitle.fontWeight,
    color: Colors.pureWhite,
    textAlign: 'center',
    letterSpacing: 4,
  },

  // Tagline styles
  taglineContainer: {
    alignItems: 'center',
    marginBottom: Layout.screenPadding * 3,
  },
  taglineArabic: {
    fontSize: 24,
    color: Colors.pureWhite,
    textAlign: 'center',
    marginBottom: Layout.sm,
    fontWeight: '600',
  },
  taglineEnglish: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '400',
    fontStyle: 'italic',
  },

  // Version info
  versionContainer: {
    position: 'absolute',
    bottom: Layout.screenPadding * 2,
    alignSelf: 'center',
  },
  versionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '300',
  },

  // Decorative elements
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingEmoji: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji1: {
    top: '15%',
    left: '10%',
  },
  emoji2: {
    top: '25%',
    right: '15%',
  },
  emoji3: {
    bottom: '30%',
    left: '15%',
  },
  emoji4: {
    bottom: '20%',
    right: '10%',
  },
  emojiText: {
    fontSize: 24,
    color: Colors.pureWhite,
  },
});

export default SplashScreen;