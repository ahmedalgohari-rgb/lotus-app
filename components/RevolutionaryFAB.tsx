/**
 * Revolutionary Floating Action Button
 * "Think Different" - Organic, breathing FAB that reacts to user context
 * Inspired by nature's growth patterns
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants';
import Text from './Text';

const { width, height } = Dimensions.get('window');

interface FABProps {
  onPress: () => void;
  icon?: string;
  label?: string;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  theme?: 'plant' | 'water' | 'scan';
  isActive?: boolean;
}

const RevolutionaryFAB: React.FC<FABProps> = ({
  onPress,
  icon = 'camera',
  label = 'Scan Plant',
  position = 'bottom-right',
  theme = 'plant',
  isActive = true,
}) => {
  // Animation values
  const breathingScale = useSharedValue(1);
  const pressScale = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const particleAnimation = useSharedValue(0);
  const rotationValue = useSharedValue(0);

  // State for interaction feedback
  const [isPressed, setIsPressed] = useState(false);

  // Start breathing animation
  useEffect(() => {
    if (isActive) {
      breathingScale.value = withRepeat(
        withTiming(1.05, { duration: 2000 }),
        -1,
        true
      );

      glowIntensity.value = withRepeat(
        withTiming(1, { duration: 3000 }),
        -1,
        true
      );

      // Subtle rotation for organic feel
      rotationValue.value = withRepeat(
        withTiming(5, { duration: 4000 }),
        -1,
        true
      );
    }
  }, [isActive]);

  const triggerHapticSuccess = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 100);
  };

  const handlePressIn = () => {
    setIsPressed(true);
    pressScale.value = withTiming(0.9, { duration: 100 });
    rippleScale.value = withTiming(1, { duration: 300 });
  };

  const handlePressOut = () => {
    setIsPressed(false);
    pressScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    rippleScale.value = withTiming(0, { duration: 200 });
  };

  const handlePress = () => {
    // Success animation
    particleAnimation.value = withSequence(
      withTiming(1, { duration: 400 }),
      withTiming(0, { duration: 600 })
    );

    runOnJS(triggerHapticSuccess)();
    runOnJS(onPress)();
  };

  // Animated styles
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breathingScale.value * pressScale.value },
      { rotate: `${rotationValue.value}deg` },
    ],
  }));

  const rippleStyle = useAnimatedStyle(() => {
    const scale = interpolate(rippleScale.value, [0, 1], [1, 2.5]);
    const opacity = interpolate(rippleScale.value, [0, 0.5, 1], [0, 0.3, 0]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowIntensity.value, [0, 1], [0.4, 0.8]);
    return { opacity };
  });

  const particleStyle = useAnimatedStyle(() => {
    const translateY = interpolate(particleAnimation.value, [0, 1], [0, -30]);
    const opacity = interpolate(particleAnimation.value, [0, 0.3, 1], [0, 1, 0]);
    const scale = interpolate(particleAnimation.value, [0, 1], [0.8, 1.2]);

    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  const getThemeColors = () => {
    switch (theme) {
      case 'water':
        return {
          primary: Colors.nileBlue,
          secondary: '#87CEEB',
          accent: '#E0F6FF',
        };
      case 'scan':
        return {
          primary: Colors.lotusGreen,
          secondary: Colors.sageGreen,
          accent: Colors.morningMist,
        };
      default:
        return {
          primary: Colors.lotusGreen,
          secondary: Colors.nileBlue,
          accent: Colors.cairoSand,
        };
    }
  };

  const themeColors = getThemeColors();

  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      bottom: 30,
      zIndex: 1000,
    };

    switch (position) {
      case 'bottom-left':
        return { ...baseStyle, left: 20 };
      case 'bottom-center':
        return { ...baseStyle, alignSelf: 'center', left: width / 2 - 35 };
      case 'bottom-right':
      default:
        return { ...baseStyle, right: 20 };
    }
  };

  return (
    <View style={getPositionStyle()}>
      {/* Success Particles */}
      <Animated.View style={[styles.particles, particleStyle]}>
        <Text style={styles.particleText}>✨</Text>
        <Text style={[styles.particleText, { marginLeft: 20 }]}>🌱</Text>
        <Text style={[styles.particleText, { marginLeft: -10 }]}>💚</Text>
      </Animated.View>

      <Animated.View style={[styles.fabContainer, fabAnimatedStyle]}>
        {/* Glow Effect */}
        <Animated.View style={[styles.glow, glowStyle]}>
          <LinearGradient
            colors={[themeColors.primary, 'transparent']}
            style={styles.glowGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Ripple Effect */}
        <Animated.View style={[styles.ripple, rippleStyle]}>
          <LinearGradient
            colors={[themeColors.accent, 'transparent']}
            style={styles.rippleGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        <TouchableOpacity
          style={styles.fab}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <BlurView intensity={20} style={styles.fabBlur}>
            <LinearGradient
              colors={[themeColors.primary, themeColors.secondary]}
              style={styles.fabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons 
                name={icon as any} 
                size={28} 
                color={Colors.pureWhite}
                style={styles.fabIcon}
              />
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>

        {/* Label */}
        {label && (
          <View style={styles.labelContainer}>
            <BlurView intensity={15} style={styles.labelBlur}>
              <Text style={styles.labelText}>{label}</Text>
            </BlurView>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 45,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 45,
  },
  ripple: {
    position: 'absolute',
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    borderRadius: 50,
  },
  rippleGradient: {
    flex: 1,
    borderRadius: 50,
  },
  fab: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  fabBlur: {
    flex: 1,
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  labelContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  labelBlur: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  particles: {
    position: 'absolute',
    top: -40,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particleText: {
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default RevolutionaryFAB;