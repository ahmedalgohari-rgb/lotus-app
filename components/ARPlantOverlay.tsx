/**
 * AR Plant Overlay - Revolutionary Augmented Reality Features
 * "Think Different" - See your plant's needs through AR magic
 * Real-time plant health visualization through camera
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
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

interface PlantDetectionData {
  confidence: number;
  health: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  plantType?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface AROverlayProps {
  isActive: boolean;
  plantDetection: PlantDetectionData | null;
  cameraPermission: boolean;
  onFocus?: (point: { x: number; y: number }) => void;
}

const ARPlantOverlay: React.FC<AROverlayProps> = ({
  isActive,
  plantDetection,
  cameraPermission,
  onFocus,
}) => {
  // Animation values
  const scanningAnimation = useSharedValue(0);
  const detectionPulse = useSharedValue(1);
  const healthGlow = useSharedValue(0);
  const focusRing = useSharedValue(0);
  const confidenceBar = useSharedValue(0);

  // Focus point state
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

  // Start scanning animation when active
  useEffect(() => {
    if (isActive && cameraPermission) {
      // Continuous scanning sweep
      scanningAnimation.value = withRepeat(
        withTiming(height, { duration: 3000 }),
        -1,
        false
      );

      // Detection pulse
      if (plantDetection) {
        detectionPulse.value = withRepeat(
          withTiming(1.1, { duration: 1500 }),
          -1,
          true
        );

        // Health glow based on plant condition
        healthGlow.value = withRepeat(
          withTiming(1, { duration: 2000 }),
          -1,
          true
        );

        // Animate confidence bar
        confidenceBar.value = withTiming(plantDetection.confidence / 100, { duration: 1000 });
      }
    } else {
      // Reset animations
      scanningAnimation.value = withTiming(0, { duration: 300 });
      detectionPulse.value = withTiming(1, { duration: 300 });
      healthGlow.value = withTiming(0, { duration: 300 });
      confidenceBar.value = withTiming(0, { duration: 300 });
    }
  }, [isActive, cameraPermission, plantDetection]);

  // Handle tap to focus
  const handleTapToFocus = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setFocusPoint({ x: locationX, y: locationY });
    
    // Animate focus ring
    focusRing.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 800 })
    );

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Call focus callback
    onFocus?.({ x: locationX, y: locationY });

    // Clear focus point after animation
    setTimeout(() => setFocusPoint(null), 1000);
  };

  // Animated styles
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanningAnimation.value }],
    opacity: interpolate(scanningAnimation.value, [0, height * 0.2, height * 0.8, height], [0, 1, 1, 0]),
  }));

  const detectionBoxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: detectionPulse.value }],
  }));

  const healthGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(healthGlow.value, [0, 1], [0.3, 0.7]);
    return { opacity };
  });

  const confidenceBarStyle = useAnimatedStyle(() => ({
    width: interpolate(confidenceBar.value, [0, 1], [0, 120]),
  }));

  const focusRingStyle = useAnimatedStyle(() => {
    const scale = interpolate(focusRing.value, [0, 1], [0.8, 1.2]);
    const opacity = interpolate(focusRing.value, [0, 0.5, 1], [0, 1, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const getHealthColor = (health?: string) => {
    switch (health) {
      case 'healthy': return Colors.healthy;
      case 'warning': return Colors.warning;
      case 'critical': return Colors.critical;
      default: return Colors.lotusGreen;
    }
  };

  const getHealthIcon = (health?: string) => {
    switch (health) {
      case 'healthy': return '🌱';
      case 'warning': return '⚠️';
      case 'critical': return '🆘';
      default: return '🔍';
    }
  };

  if (!isActive || !cameraPermission) return null;

  return (
    <View style={styles.overlay} onTouchEnd={handleTapToFocus}>
      {/* AR Scanning Grid */}
      <View style={styles.scanningGrid}>
        {/* Horizontal lines */}
        {[...Array(6)].map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLine,
              {
                top: (height / 6) * (i + 1),
                width: '100%',
                height: 1,
              },
            ]}
          />
        ))}
        {/* Vertical lines */}
        {[...Array(4)].map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLine,
              {
                left: (width / 4) * (i + 1),
                height: '100%',
                width: 1,
              },
            ]}
          />
        ))}
      </View>

      {/* Scanning Line Animation */}
      <Animated.View style={[styles.scanLine, scanLineStyle]}>
        <LinearGradient
          colors={['transparent', Colors.lotusGreen, 'transparent']}
          style={styles.scanLineGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>

      {/* Plant Detection Box */}
      {plantDetection && plantDetection.boundingBox && (
        <Animated.View
          style={[
            styles.detectionBox,
            {
              left: plantDetection.boundingBox.x,
              top: plantDetection.boundingBox.y,
              width: plantDetection.boundingBox.width,
              height: plantDetection.boundingBox.height,
            },
            detectionBoxStyle,
          ]}
        >
          {/* Health Glow */}
          <Animated.View style={[styles.healthGlow, healthGlowStyle]}>
            <LinearGradient
              colors={[getHealthColor(plantDetection.health), 'transparent']}
              style={styles.glowGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>

          {/* Detection Border */}
          <View style={[styles.detectionBorder, { borderColor: getHealthColor(plantDetection.health) }]}>
            {/* Corner indicators */}
            <View style={[styles.corner, styles.topLeft, { borderColor: getHealthColor(plantDetection.health) }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: getHealthColor(plantDetection.health) }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: getHealthColor(plantDetection.health) }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: getHealthColor(plantDetection.health) }]} />
          </View>
        </Animated.View>
      )}

      {/* AR Information Overlay */}
      {plantDetection && (
        <View style={styles.infoOverlay}>
          {/* Plant Type */}
          {plantDetection.plantType && (
            <BlurView intensity={20} style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Text style={styles.plantTypeIcon}>{getHealthIcon(plantDetection.health)}</Text>
                <Text style={styles.plantTypeName}>{plantDetection.plantType}</Text>
              </View>
            </BlurView>
          )}

          {/* Confidence Indicator */}
          <BlurView intensity={20} style={styles.confidenceCard}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <View style={styles.confidenceBarContainer}>
              <Animated.View
                style={[
                  styles.confidenceBarFill,
                  confidenceBarStyle,
                  { backgroundColor: getHealthColor(plantDetection.health) },
                ]}
              />
            </View>
            <Text style={styles.confidenceText}>{Math.round(plantDetection.confidence)}%</Text>
          </BlurView>

          {/* Health Status */}
          <BlurView intensity={20} style={styles.healthCard}>
            <View style={[styles.healthIndicator, { backgroundColor: getHealthColor(plantDetection.health) }]}>
              <Text style={styles.healthText}>
                {plantDetection.health.toUpperCase()}
              </Text>
            </View>
          </BlurView>

          {/* Quick Recommendations */}
          {plantDetection.recommendations.length > 0 && (
            <BlurView intensity={20} style={styles.recommendationsCard}>
              <Text style={styles.recommendationsTitle}>Quick Tips</Text>
              {plantDetection.recommendations.slice(0, 2).map((rec, index) => (
                <Text key={index} style={styles.recommendationText}>
                  • {rec}
                </Text>
              ))}
            </BlurView>
          )}
        </View>
      )}

      {/* Focus Ring */}
      {focusPoint && (
        <Animated.View
          style={[
            styles.focusRing,
            {
              left: focusPoint.x - 25,
              top: focusPoint.y - 25,
            },
            focusRingStyle,
          ]}
        />
      )}

      {/* AR Controls */}
      <View style={styles.arControls}>
        <BlurView intensity={15} style={styles.controlButton}>
          <Ionicons name="scan" size={24} color={Colors.lotusGreen} />
        </BlurView>
        <BlurView intensity={15} style={styles.controlButton}>
          <Ionicons name="information-circle" size={24} color={Colors.nileBlue} />
        </BlurView>
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
    zIndex: 10,
  },
  scanningGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.2,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: Colors.lotusGreen,
    opacity: 0.3,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
  },
  scanLineGradient: {
    flex: 1,
    shadowColor: Colors.lotusGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  detectionBox: {
    position: 'absolute',
  },
  healthGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 8,
  },
  detectionBorder: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 3,
  },
  topLeft: {
    top: -3,
    left: -3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -3,
    right: -3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -3,
    left: -3,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -3,
    right: -3,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  infoOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
  },
  infoCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantTypeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  plantTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  confidenceCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  confidenceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  confidenceBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 4,
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  healthCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  healthIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  healthText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.pureWhite,
  },
  recommendationsCard: {
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  focusRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.lotusGreen,
    backgroundColor: 'transparent',
  },
  arControls: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    flexDirection: 'column',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
});

export default ARPlantOverlay;