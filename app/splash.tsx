/**
 * Lotus Splash Screen
 * Beautiful animated intro with Lotus branding and auth checking
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Layout } from '@/constants';
// Removed auth store imports to prevent native module issues
// import { useAuthStore, useHasSeenOnboarding } from '@/store/authStore';
import Text from '@/components/Text';
import LotusLogo from '@/components/LotusLogo';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const router = useRouter();
  // Removed auth state checks to prevent crashes - will go directly to onboarding
  // const { isAuthenticated, isLoading } = useAuthStore();
  // const hasSeenOnboarding = useHasSeenOnboarding();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  useEffect(() => {
    // Show splash for 2.5 seconds then go to onboarding
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 2500); // Show splash for 2.5 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <LinearGradient
      colors={Colors.backgroundGradient}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.content}>
        {/* Animated Lotus Icon */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LotusLogo size="hero" variant="default" showText={false} />
        </Animated.View>

        {/* Animated Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>LOTUS</Text>
          
          {/* Arabic tagline */}
          <Text style={styles.taglineArabic}>نبتتك معانا</Text>
          
          {/* English tagline */}
          <Text style={styles.taglineEnglish}>Your plant buddy</Text>
        </Animated.View>

        {/* Loading indicator */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.loadingDot} />
          <View style={[styles.loadingDot, styles.loadingDotDelay]} />
          <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
  },
  logoContainer: {
    marginBottom: Layout.sectionSpacing,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Layout.sectionSpacing,
  },
  title: {
    ...Typography.appTitle,
    color: Colors.lotusGreen,
    marginBottom: Layout.componentSpacing,
    textAlign: 'center',
    letterSpacing: 2,
  },
  taglineArabic: {
    ...Typography.arabicTitle,
    color: Colors.nileBlue,
    marginBottom: Layout.sm,
    textAlign: 'center',
  },
  taglineEnglish: {
    ...Typography.bodySecondary,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Layout.xl,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.lotusGreen,
    marginHorizontal: 4,
    opacity: 0.7,
  },
  loadingDotDelay: {
    opacity: 0.5,
  },
  loadingDotDelay2: {
    opacity: 0.3,
  },
});

export default SplashScreen;