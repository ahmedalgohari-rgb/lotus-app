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
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES, WINDOW_DIRECTIONS } from '../constants';
import { useCompass } from '../hooks/useCompass';
import LightComparisonCard from './LightComparisonCard';

interface CompassDirectionPickerProps {
  selectedDirection: string;
  onDirectionChange: (direction: any) => void;
  bestDirection: string | null;
  isRTL: boolean;
  // Educational comparison panel inputs (optional for backwards compatibility).
  plantLightRequirement?: string;
  currentDirectionIntensity?: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  currentDirectSunHours?: number;
  currentSeason?: 'winter' | 'spring' | 'summer' | 'autumn';
}

export default function CompassDirectionPicker({
  selectedDirection,
  onDirectionChange,
  bestDirection,
  isRTL,
  plantLightRequirement,
  currentDirectionIntensity,
  currentDirectSunHours,
  currentSeason,
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

  // Stream cardinal direction to parent while in live mode so the score banner updates in real-time.
  // cardinalDirection only switches between 4 values (N/E/S/W) so this fires at most a few times per rotation.
  const lastStreamedDirection = useRef<string | null>(null);
  useEffect(() => {
    if (!isLiveMode || !cardinalDirection) return;
    if (cardinalDirection === lastStreamedDirection.current) return;
    lastStreamedDirection.current = cardinalDirection;
    onDirectionChange(cardinalDirection);
  }, [cardinalDirection, isLiveMode]);

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
        {WINDOW_DIRECTIONS.map((direction) => {
          const isSelected = !isAnimated && selectedDirection === direction.value;
          const isHighlighted = isAnimated && cardinalDirection === direction.value;
          const positionKey = `compass${direction.value.charAt(0).toUpperCase() + direction.value.slice(1)}`;
          return (
            <TouchableOpacity
              key={direction.value}
              testID={`direction-${direction.value}`}
              style={[
                styles.compassDirection,
                (styles as any)[positionKey],
                isSelected && styles.compassDirectionSelected,
                isHighlighted && styles.compassDirectionHighlight,
              ]}
              onPress={() => !isAnimated && handleManualSelect(direction.value)}
              disabled={isAnimated}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.compassText,
                (isSelected || isHighlighted) && styles.compassTextSelected,
              ]}>
                {direction.value.charAt(0).toUpperCase()}
              </Text>
              {bestDirection === direction.value && (
                <View style={styles.compassRecommendedBadge}>
                  <Text style={styles.compassRecommendedText}>R</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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

  // Comparison card visibility: only show when we have plant + direction data.
  const comparisonCard = plantLightRequirement && currentDirectionIntensity ? (
    <LightComparisonCard
      plantLightRequirement={plantLightRequirement}
      windowIntensity={currentDirectionIntensity}
      directSunHours={currentDirectSunHours}
      direction={selectedDirection as 'north' | 'east' | 'south' | 'west'}
      season={currentSeason}
      isRTL={isRTL}
    />
  ) : null;

  // ─── Live Mode ─────────────────────────────────────────────────
  if (isLiveMode) {
    const facingDirection = WINDOW_DIRECTIONS.find(d => d.value === cardinalDirection);
    const facingLabel = isRTL
      ? facingDirection?.labelAr || ''
      : facingDirection?.label || '';

    return (
      <View style={styles.container}>
        {/* Educational comparison panel — replaces the old lightHint line.
            Compact enough to fit above the compass on iPhone 13 mini. */}
        {comparisonCard}

        {/* Live rotating compass */}
        <View style={styles.compassContainer}>
          <View style={styles.indicatorArrow}>
            <Ionicons name="caret-down" size={20} color={COLORS.primary} />
          </View>
          {renderCompassRose(true)}
        </View>

        {/* Facing direction (acts as the "you are pointing at this" feedback) */}
        <View style={styles.facingContainer}>
          <Text style={[styles.facingLabel, isRTL && styles.textRTL]}>
            {t('addPlant.compass.youAreFacing')}
          </Text>
          <Text style={[styles.facingDirection, isRTL && styles.textRTL]}>
            {facingLabel}
          </Text>
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          testID="confirm-direction"
          style={styles.confirmButton}
          onPress={handleConfirmDirection}
          activeOpacity={0.7}
        >
          <Text style={styles.confirmButtonText}>
            {t('addPlant.compass.confirmDirection')}
          </Text>
        </TouchableOpacity>

        {/* Switch to manual — kept inline so it's always visible */}
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
      {/* Educational comparison panel — also shows the selected-direction
          context, so we no longer need a separate lightHint line. */}
      {comparisonCard}

      <View style={styles.compassContainer}>
        {renderCompassRose(false)}
        <Text style={styles.selectedDirectionText}>
          {t('addPlant.selectedDirection')} {t(`addPlant.directions.${selectedDirection}`)}
        </Text>
      </View>

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

  // (instruction + sectionTitle removed — the comparison card carries
  //  enough context that a separate header is just visual noise.)

  // Compass container
  compassContainer: {
    alignItems: 'center',
  },

  // Direction indicator arrow (fixed above compass in live mode)
  indicatorArrow: {
    marginBottom: FIBONACCI.XXS,
    zIndex: 1,
  },

  // Compass rose — perfect circle for smooth rotation.
  // Shrunk from 200 → 168 so the whole compass step (card + compass +
  // facing label + confirm + manual toggle) fits in one viewport on
  // iPhone 13 mini.
  compass: {
    width: 168,
    height: 168,
    position: 'relative',
    backgroundColor: COLORS.background,
    borderRadius: 84,
    marginBottom: FIBONACCI.XS,
  },

  // Light green background circle — radius 72, centered in 168×168 compass
  compassBackground: {
    position: 'absolute',
    width: 144,
    height: 144,
    borderRadius: 72,
    top: 12,
    left: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
  },

  // Direction buttons — uniform circles, smaller to match shrunk compass
  compassDirection: {
    position: 'absolute',
    width: 38,
    height: 38,
    backgroundColor: COLORS.white,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassDirectionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  compassDirectionHighlight: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },

  // Compass positions — centered on 168px circle (button radius 19, compass radius 84)
  compassNorth: {
    top: -6,
    left: 65,
  },
  compassEast: {
    right: -6,
    top: 65,
  },
  compassSouth: {
    top: 136,
    left: 65,
  },
  compassWest: {
    left: -6,
    top: 65,
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
    marginTop: FIBONACCI.XS,
  },

  // Facing direction display (live mode)
  facingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: FIBONACCI.SM,
    marginTop: FIBONACCI.SM,
  },
  facingLabel: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.textSecondary,
  },
  facingDirection: {
    fontSize: TYPOGRAPHY.MD,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Confirm button (live mode) — tighter padding
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: FIBONACCI.SM,
    paddingHorizontal: FIBONACCI.XL,
    borderRadius: FIBONACCI.LG,
    alignItems: 'center',
    marginTop: FIBONACCI.SM,
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
    marginTop: FIBONACCI.XS,
    paddingVertical: FIBONACCI.XS,
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
