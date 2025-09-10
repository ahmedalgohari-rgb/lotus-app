/**
 * Plant Growth Loader - Revolutionary Loading Animation
 * "Think Different" - Loading states that tell a story of growth
 * Organic, plant-inspired loading experience
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants';
import Text from './Text';

const { width } = Dimensions.get('window');

interface PlantGrowthLoaderProps {
  isVisible: boolean;
  message?: string;
  messageAr?: string;
  size?: 'small' | 'medium' | 'large';
  theme?: 'plant' | 'water' | 'scan';
}

const PlantGrowthLoader: React.FC<PlantGrowthLoaderProps> = ({
  isVisible,
  message = 'Growing...',
  messageAr = 'ينمو...',
  size = 'medium',
  theme = 'plant',
}) => {
  // Animation shared values
  const seedScale = useSharedValue(0);
  const stemHeight = useSharedValue(0);
  const leaf1Scale = useSharedValue(0);
  const leaf2Scale = useSharedValue(0);
  const leaf3Scale = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const sparkleAnimation = useSharedValue(0);
  const waterDrop = useSharedValue(0);

  // Start growth animation when visible
  useEffect(() => {
    if (isVisible) {
      // Seed appears first
      seedScale.value = withTiming(1, { duration: 300 });

      // Stem grows
      stemHeight.value = withDelay(
        500,
        withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
      );

      // Leaves appear sequentially
      leaf1Scale.value = withDelay(
        1000,
        withSpring(1, { damping: 15, stiffness: 200 })
      );

      leaf2Scale.value = withDelay(
        1300,
        withSpring(1, { damping: 15, stiffness: 200 })
      );

      leaf3Scale.value = withDelay(
        1600,
        withSpring(1, { damping: 15, stiffness: 200 })
      );

      // Continuous glow animation
      glowIntensity.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        true
      );

      // Sparkle effects
      sparkleAnimation.value = withRepeat(
        withSequence(
          withDelay(2000, withTiming(1, { duration: 400 })),
          withTiming(0, { duration: 600 })
        ),
        -1,
        false
      );

      // Water drop animation for water theme
      if (theme === 'water') {
        waterDrop.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1000 }),
            withTiming(0, { duration: 200 })
          ),
          -1,
          false
        );
      }
    } else {
      // Reset all animations
      seedScale.value = withTiming(0, { duration: 200 });
      stemHeight.value = withTiming(0, { duration: 200 });
      leaf1Scale.value = withTiming(0, { duration: 200 });
      leaf2Scale.value = withTiming(0, { duration: 200 });
      leaf3Scale.value = withTiming(0, { duration: 200 });
      glowIntensity.value = withTiming(0, { duration: 200 });
      sparkleAnimation.value = withTiming(0, { duration: 200 });
      waterDrop.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible, theme]);

  const getSizes = () => {
    switch (size) {
      case 'small':
        return { container: 60, plant: 40 };
      case 'large':
        return { container: 120, plant: 100 };
      case 'medium':
      default:
        return { container: 80, plant: 60 };
    }
  };

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
          secondary: '#90EE90',
          accent: Colors.morningMist,
        };
      default:
        return {
          primary: Colors.lotusGreen,
          secondary: Colors.sageGreen,
          accent: Colors.cairoSand,
        };
    }
  };

  const sizes = getSizes();
  const themeColors = getThemeColors();

  // Animated styles
  const seedAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: seedScale.value }],
  }));

  const stemAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(stemHeight.value, [0, 1], [0, sizes.plant * 0.6]);
    return { height };
  });

  const leaf1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: leaf1Scale.value }, { rotate: '-15deg' }],
  }));

  const leaf2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: leaf2Scale.value }, { rotate: '15deg' }],
  }));

  const leaf3AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: leaf3Scale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowIntensity.value, [0, 1], [0.3, 0.7]);
    return { opacity };
  });

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleAnimation.value,
    transform: [
      { scale: sparkleAnimation.value },
      { rotate: `${sparkleAnimation.value * 360}deg` }
    ],
  }));

  const waterDropAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(waterDrop.value, [0, 1], [-10, sizes.plant * 0.8]);
    const opacity = interpolate(waterDrop.value, [0, 0.2, 0.8, 1], [1, 1, 1, 0]);
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  if (!isVisible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(247, 243, 233, 0.9)' }]}>
      <View style={[styles.container, { width: sizes.container, height: sizes.container }]}>
        {/* Glow Effect */}
        <Animated.View style={[styles.glow, glowAnimatedStyle]}>
          <LinearGradient
            colors={[themeColors.primary, 'transparent']}
            style={styles.glowGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Plant Container */}
        <View style={styles.plantContainer}>
          {/* Soil Base */}
          <View style={[styles.soil, { backgroundColor: '#8B4513' }]} />

          {/* Seed */}
          <Animated.View style={[styles.seed, seedAnimatedStyle, { backgroundColor: '#D2691E' }]} />

          {/* Stem */}
          <Animated.View 
            style={[
              styles.stem, 
              stemAnimatedStyle, 
              { backgroundColor: themeColors.primary }
            ]} 
          />

          {/* Leaves */}
          <View style={styles.leavesContainer}>
            <Animated.View style={[styles.leaf, styles.leaf1, leaf1AnimatedStyle]}>
              <Text style={[styles.leafEmoji, { color: themeColors.primary }]}>🌿</Text>
            </Animated.View>
            
            <Animated.View style={[styles.leaf, styles.leaf2, leaf2AnimatedStyle]}>
              <Text style={[styles.leafEmoji, { color: themeColors.secondary }]}>🍃</Text>
            </Animated.View>
            
            <Animated.View style={[styles.leaf, styles.leaf3, leaf3AnimatedStyle]}>
              <Text style={[styles.leafEmoji, { color: themeColors.primary }]}>🌱</Text>
            </Animated.View>
          </View>

          {/* Water Drop (for water theme) */}
          {theme === 'water' && (
            <Animated.View style={[styles.waterDrop, waterDropAnimatedStyle]}>
              <Text style={styles.waterDropEmoji}>💧</Text>
            </Animated.View>
          )}

          {/* Success Sparkles */}
          <Animated.View style={[styles.sparkles, sparkleAnimatedStyle]}>
            <Text style={styles.sparkleText}>✨</Text>
            <Text style={[styles.sparkleText, { marginLeft: 15 }]}>⭐</Text>
            <Text style={[styles.sparkleText, { marginLeft: -25, marginTop: 10 }]}>💫</Text>
          </Animated.View>
        </View>
      </View>

      {/* Loading Message */}
      <View style={styles.messageContainer}>
        <Text style={[styles.message, { color: themeColors.primary }]}>
          {message}
        </Text>
        <Text style={[styles.messageAr, { color: themeColors.secondary }]}>
          {messageAr}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 50,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 50,
  },
  plantContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  soil: {
    position: 'absolute',
    bottom: 0,
    width: 50,
    height: 8,
    borderRadius: 4,
  },
  seed: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stem: {
    position: 'absolute',
    bottom: 8,
    width: 3,
    borderRadius: 1.5,
  },
  leavesContainer: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaf: {
    position: 'absolute',
  },
  leaf1: {
    top: 10,
    left: -8,
  },
  leaf2: {
    top: 15,
    right: -8,
  },
  leaf3: {
    top: 5,
  },
  leafEmoji: {
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  waterDrop: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
  },
  waterDropEmoji: {
    fontSize: 12,
  },
  sparkles: {
    position: 'absolute',
    top: -15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleText: {
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  messageContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  messageAr: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default PlantGrowthLoader;