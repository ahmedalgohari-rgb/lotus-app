/**
 * Revolutionary Animated Plant Card
 * "Think Different" - Living, breathing plant interactions
 * Inspired by Apple's micro-interaction philosophy
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants';
import Text from './Text';

const { width } = Dimensions.get('window');

interface PlantCardProps {
  plantName: string;
  plantNameAr: string;
  healthStatus: 'healthy' | 'warning' | 'critical';
  lastWatered: string;
  onPress: () => void;
  onWater: () => void;
  style?: any;
}

const AnimatedPlantCard: React.FC<PlantCardProps> = ({
  plantName,
  plantNameAr,
  healthStatus,
  lastWatered,
  onPress,
  onWater,
  style,
}) => {
  // Shared values for animations
  const pulseAnimation = useSharedValue(1);
  const pressAnimation = useSharedValue(1);
  const waterRipple = useSharedValue(0);
  const sparkleAnimation = useSharedValue(0);
  const healthGlow = useSharedValue(0);

  // Start the living pulse animation
  useEffect(() => {
    // Different pulse rates based on plant health
    const pulseSpeed = healthStatus === 'healthy' ? 2000 : 
                     healthStatus === 'warning' ? 1500 : 1000;
    
    pulseAnimation.value = withRepeat(
      withTiming(1.02, { duration: pulseSpeed }),
      -1,
      true
    );

    // Health glow animation
    healthGlow.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      true
    );
  }, [healthStatus]);

  // Trigger celebration sparkles for healthy plants
  useEffect(() => {
    if (healthStatus === 'healthy') {
      sparkleAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        false
      );
    }
  }, [healthStatus]);

  const triggerHapticFeedback = () => {
    const hapticType = healthStatus === 'healthy' ? 
      Haptics.ImpactFeedbackStyle.Light :
      healthStatus === 'warning' ? 
        Haptics.ImpactFeedbackStyle.Medium :
        Haptics.ImpactFeedbackStyle.Heavy;
    
    Haptics.impactAsync(hapticType);
  };

  const handlePress = () => {
    pressAnimation.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    runOnJS(triggerHapticFeedback)();
    runOnJS(onPress)();
  };

  const handleWaterPress = () => {
    // Water ripple effect
    waterRipple.value = withSequence(
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 200 })
    );
    runOnJS(triggerHapticFeedback)();
    runOnJS(onWater)();
  };

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: pulseAnimation.value * pressAnimation.value },
    ],
  }));

  const healthGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      healthGlow.value,
      [0, 1],
      healthStatus === 'healthy' ? [0.3, 0.6] :
      healthStatus === 'warning' ? [0.2, 0.4] : [0.1, 0.3]
    );

    return {
      opacity,
    };
  });

  const waterRippleStyle = useAnimatedStyle(() => {
    const scale = interpolate(waterRipple.value, [0, 1], [1, 3]);
    const opacity = interpolate(waterRipple.value, [0, 0.5, 1], [0, 0.6, 0]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleAnimation.value,
    transform: [
      { scale: sparkleAnimation.value },
      { rotate: `${sparkleAnimation.value * 180}deg` }
    ],
  }));

  const getHealthColor = () => {
    switch (healthStatus) {
      case 'healthy': return Colors.healthy;
      case 'warning': return Colors.warning;
      case 'critical': return Colors.critical;
      default: return Colors.healthy;
    }
  };

  const getHealthEmoji = () => {
    switch (healthStatus) {
      case 'healthy': return '🌱';
      case 'warning': return '⚠️';
      case 'critical': return '🆘';
      default: return '🌱';
    }
  };

  return (
    <Animated.View style={[styles.container, cardAnimatedStyle, style]}>
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.9}
        style={styles.cardContainer}
      >
        {/* Health Glow Background */}
        <Animated.View style={[styles.healthGlow, healthGlowStyle]}>
          <LinearGradient
            colors={[getHealthColor(), 'transparent']}
            style={styles.glowGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Main Card Content */}
        <View style={styles.cardContent}>
          {/* Plant Header */}
          <View style={styles.plantHeader}>
            <View style={styles.plantInfo}>
              <Text style={styles.plantName}>{plantName}</Text>
              <Text style={styles.plantNameAr}>{plantNameAr}</Text>
            </View>
            
            {/* Health Status with Animation */}
            <View style={[styles.healthStatus, { backgroundColor: getHealthColor() }]}>
              <Text style={styles.healthEmoji}>{getHealthEmoji()}</Text>
            </View>
          </View>

          {/* Care Info */}
          <View style={styles.careInfo}>
            <Text style={styles.lastWatered}>Last watered: {lastWatered}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.waterButton, { backgroundColor: Colors.nileBlue }]}
              onPress={handleWaterPress}
              activeOpacity={0.8}
            >
              {/* Water Ripple Effect */}
              <Animated.View style={[styles.waterRipple, waterRippleStyle]} />
              
              <Text style={styles.waterButtonText}>💧 Water</Text>
            </TouchableOpacity>
          </View>

          {/* Success Sparkles for Healthy Plants */}
          {healthStatus === 'healthy' && (
            <Animated.View style={[styles.sparkles, sparkleStyle]}>
              <Text style={styles.sparkleText}>✨</Text>
            </Animated.View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.pureWhite,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  healthGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  glowGradient: {
    flex: 1,
    opacity: 0.3,
  },
  cardContent: {
    padding: 20,
    zIndex: 1,
  },
  plantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  plantNameAr: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  healthStatus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  healthEmoji: {
    fontSize: 18,
  },
  careInfo: {
    marginBottom: 16,
  },
  lastWatered: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  waterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  waterRipple: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginTop: -10,
    marginLeft: -10,
  },
  waterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.pureWhite,
  },
  sparkles: {
    position: 'absolute',
    top: 10,
    right: 50,
    zIndex: 2,
  },
  sparkleText: {
    fontSize: 20,
  },
});

export default AnimatedPlantCard;