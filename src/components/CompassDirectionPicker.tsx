import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import PressSpring from './PressSpring';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES, WINDOW_DIRECTIONS } from '../constants';
import { useCompass } from '../hooks/useCompass';

interface CompassDirectionPickerProps {
  selectedDirection: string;
  onDirectionChange: (direction: any) => void;
  bestDirection: string | null;
  isRTL: boolean;
}

export default function CompassDirectionPicker({
  selectedDirection,
  onDirectionChange,
  bestDirection,
  isRTL,
}: CompassDirectionPickerProps) {
  const { t } = useTranslation();
  const { heading, cardinalDirection, isAvailable, start, stop } = useCompass();
  const [isLiveMode, setIsLiveMode] = useState(false);

  // Track cumulative rotation to avoid 360→0 wraparound spin
  const cumulativeRotation = useRef(0);
  const lastHeading = useRef(0);
  const rotationValue = useSharedValue(0);

  // Pulsing dot for live mode center
  const pulseOpacity = useSharedValue(1);

  // Start compass when entering live mode
  useEffect(() => {
    if (isLiveMode && isAvailable) {
      start();
      // Start pulsing animation
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      stop();
      pulseOpacity.value = 1;
    }
    return () => stop();
  }, [isLiveMode, isAvailable]);

  // Auto-enter live mode if magnetometer is available
  useEffect(() => {
    if (isAvailable) {
      setIsLiveMode(true);
    }
  }, [isAvailable]);

  // Update rotation when heading changes (with wraparound handling)
  useEffect(() => {
    if (heading === null || !isLiveMode) return;

    // Calculate shortest angular distance
    let delta = heading - lastHeading.current;
    // Normalize to -180..180
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    cumulativeRotation.current += delta;
    lastHeading.current = heading;

    // Negate because we rotate the compass opposite to heading
    rotationValue.value = withSpring(-cumulativeRotation.current, {
      damping: 20,
      stiffness: 90,
      mass: 0.5,
    });
  }, [heading, isLiveMode]);

  const compassRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationValue.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const handleConfirmDirection = useCallback(() => {
    onDirectionChange(cardinalDirection);
    setIsLiveMode(false);
  }, [cardinalDirection, onDirectionChange]);

  const handleManualSelect = useCallback((direction: string) => {
    onDirectionChange(direction);
  }, [onDirectionChange]);

  const switchToManual = useCallback(() => {
    setIsLiveMode(false);
    stop();
  }, [stop]);

  const switchToLive = useCallback(() => {
    setIsLiveMode(true);
  }, []);

  // ─── Compass Rose (shared between live and manual modes) ───────
  const renderCompassRose = (isAnimated: boolean) => {
    const compassContent = (
      <>
        {/* Light green background circle — circumference intersects direction circle centers (radius 86) */}
        <View style={styles.compassBackground} />
        {WINDOW_DIRECTIONS.map((direction) => (
          <PressSpring
            key={direction.value}
            style={[
              styles.compassDirection,
              (styles as any)[`compass${direction.value.charAt(0).toUpperCase() + direction.value.slice(1)}`],
              !isAnimated && selectedDirection === direction.value && styles.compassDirectionSelected,
              isAnimated && cardinalDirection === direction.value && styles.compassDirectionHighlight,
            ]}
            onPress={() => !isAnimated && handleManualSelect(direction.value)}
            disabled={isAnimated}
            pressedScale={0.88}
          >
            <Text style={[
              styles.compassText,
              !isAnimated && selectedDirection === direction.value && styles.compassTextSelected,
              isAnimated && cardinalDirection === direction.value && styles.compassTextSelected,
            ]}>
              {direction.value.charAt(0).toUpperCase()}
            </Text>
            {bestDirection === direction.value && (
              <View style={styles.compassRecommendedBadge}>
                <Text style={styles.compassRecommendedText}>R</Text>
              </View>
            )}
          </PressSpring>
        ))}
        {/* Center */}
        {isAnimated ? (
          <Animated.View style={[styles.compassCenter, pulseStyle]}>
            <View style={styles.liveDot} />
          </Animated.View>
        ) : (
          <View style={styles.compassCenter}>
            <Ionicons name="compass-outline" size={34} color={COLORS.white} />
          </View>
        )}
      </>
    );

    if (isAnimated) {
      return (
        <Animated.View style={[styles.compass, compassRotationStyle]}>
          {compassContent}
        </Animated.View>
      );
    }

    return <View style={styles.compass}>{compassContent}</View>;
  };

  // ─── Live Mode ─────────────────────────────────────────────────
  if (isLiveMode) {
    const facingDirection = WINDOW_DIRECTIONS.find(d => d.value === cardinalDirection);
    const facingLabel = isRTL
      ? facingDirection?.labelAr || ''
      : facingDirection?.label || '';

    return (
      <View style={styles.container}>
        {/* Instruction */}
        <Text style={[styles.instruction, isRTL && styles.textRTL]}>
          {t('addPlant.compass.pointAtWindow')}
        </Text>

        {/* Live rotating compass */}
        <View style={styles.compassContainer}>
          {/* Direction indicator arrow at top */}
          <View style={styles.indicatorArrow}>
            <Ionicons name="caret-down" size={20} color={COLORS.primary} />
          </View>
          {renderCompassRose(true)}
        </View>

        {/* Facing direction */}
        <View style={styles.facingContainer}>
          <Text style={[styles.facingLabel, isRTL && styles.textRTL]}>
            {t('addPlant.compass.youAreFacing')}
          </Text>
          <Text style={[styles.facingDirection, isRTL && styles.textRTL]}>
            {facingLabel}
          </Text>
        </View>

        {/* Light quality hint */}
        <Text style={[styles.lightHint, isRTL && styles.textRTL]}>
          {t(`addPlant.compass.lightHints.${cardinalDirection}`)}
        </Text>

        {/* Confirm button */}
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmDirection}
          activeOpacity={0.7}
        >
          <Text style={styles.confirmButtonText}>
            {t('addPlant.compass.confirmDirection')}
          </Text>
        </TouchableOpacity>

        {/* Switch to manual */}
        <TouchableOpacity onPress={switchToManual} style={styles.modeToggle}>
          <Text style={[styles.modeToggleText, isRTL && styles.textRTL]}>
            {t('addPlant.compass.selectManually')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Manual Mode ───────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, isRTL && styles.textRTL]}>
        {isRTL ? 'ما هو اتجاه الشباك؟' : 'What is the window direction?'}
      </Text>

      <View style={styles.compassContainer}>
        {renderCompassRose(false)}
        <Text style={styles.selectedDirectionText}>
          {t('addPlant.selectedDirection')} {t(`addPlant.directions.${selectedDirection}`)}
        </Text>
      </View>

      {/* Light quality hint for selected direction */}
      <Text style={[styles.lightHint, isRTL && styles.textRTL]}>
        {t(`addPlant.compass.lightHints.${selectedDirection}`)}
      </Text>

      {/* Switch to live compass (only if available) */}
      {isAvailable && (
        <TouchableOpacity onPress={switchToLive} style={styles.modeToggle}>
          <Ionicons name="compass" size={16} color={COLORS.primary} style={{ marginRight: FIBONACCI.XS }} />
          <Text style={[styles.modeToggleText, isRTL && styles.textRTL]}>
            {t('addPlant.compass.useLiveCompass')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginHorizontal: FIBONACCI.MD,
  },

  // Instruction text for live mode
  instruction: {
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: FIBONACCI.LG,
  },

  // Section title for manual mode
  sectionTitle: {
    fontSize: TYPOGRAPHY.MD,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: FIBONACCI.MD,
    textAlign: 'center',
  },

  // Compass container
  compassContainer: {
    alignItems: 'center',
  },

  // Direction indicator arrow (fixed above compass in live mode)
  indicatorArrow: {
    marginBottom: -FIBONACCI.XS,
    zIndex: 1,
  },

  // Compass rose — perfect circle for smooth rotation
  compass: {
    width: 200,
    height: 200,
    position: 'relative',
    backgroundColor: COLORS.background,
    borderRadius: 100,
    marginBottom: FIBONACCI.SM,
  },

  // Light green background circle — radius 86, centered in 200×200 compass
  compassBackground: {
    position: 'absolute',
    width: 172,
    height: 172,
    borderRadius: 86,
    top: 14,
    left: 14,
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
  },

  // Direction buttons — uniform circles
  compassDirection: {
    position: 'absolute',
    width: 44,
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassDirectionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    transform: [{ scale: 1.1 }],
  },
  compassDirectionHighlight: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },

  // Compass positions — centered on 200px circle
  compassNorth: {
    top: -8,
    left: 78,
  },
  compassEast: {
    right: -8,
    top: 78,
  },
  compassSouth: {
    bottom: -8,
    left: 78,
  },
  compassWest: {
    left: -8,
    top: 78,
  },

  // Direction text
  compassText: {
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
    color: COLORS.text,
  },
  compassTextSelected: {
    color: COLORS.white,
  },

  // Center of compass
  compassCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -ELEMENT_SIZES.ICON_LG / 2,
    marginLeft: -ELEMENT_SIZES.ICON_LG / 2,
    width: ELEMENT_SIZES.ICON_LG,
    height: ELEMENT_SIZES.ICON_LG,
    backgroundColor: COLORS.primary,
    borderRadius: ELEMENT_SIZES.ICON_LG / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Pulsing green dot for live mode
  liveDot: {
    width: FIBONACCI.MD,
    height: FIBONACCI.MD,
    borderRadius: FIBONACCI.MD / 2,
    backgroundColor: COLORS.success,
  },

  // Recommended badge
  compassRecommendedBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: FIBONACCI.MD,
    height: FIBONACCI.MD,
    borderRadius: FIBONACCI.MD / 2,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  compassRecommendedText: {
    color: '#FFFFFF',
    fontSize: FIBONACCI.SM,
    fontWeight: '700',
  },

  // Selected direction text (manual mode)
  selectedDirectionText: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: FIBONACCI.SM,
  },

  // Facing direction display (live mode)
  facingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: FIBONACCI.SM,
    marginTop: FIBONACCI.MD,
  },
  facingLabel: {
    fontSize: TYPOGRAPHY.BASE,
    color: COLORS.textSecondary,
  },
  facingDirection: {
    fontSize: TYPOGRAPHY.LG,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Light quality hint
  lightHint: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: FIBONACCI.SM,
    paddingHorizontal: FIBONACCI.XL,
    fontStyle: 'italic',
  },

  // Confirm button (live mode)
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: FIBONACCI.MD,
    paddingHorizontal: FIBONACCI.XL,
    borderRadius: FIBONACCI.LG,
    alignItems: 'center',
    marginTop: FIBONACCI.LG,
  },
  confirmButtonText: {
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Mode toggle link
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: FIBONACCI.MD,
    paddingVertical: FIBONACCI.SM,
  },
  modeToggleText: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // RTL text alignment
  textRTL: {
    textAlign: 'right',
  },
});
