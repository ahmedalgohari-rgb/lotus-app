import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { COLORS, FIBONACCI, TYPOGRAPHY } from '../constants';
import PlantImage from './PlantImage';
import { useRTL } from '../utils/rtl';

// Ribbon uses static SVG paths + animated wrapper (translateY + opacity)
// This avoids useAnimatedProps worklet issues with SVG string attributes

const { width: W, height: H } = Dimensions.get('window');

// ─── Lotus-themed colors ─────────────────────────────────────────
const RIBBON_COLOR = '#2D5F3F';         // Lotus Green
const RIBBON_COLOR_LIGHT = '#4A8B5C';   // Lighter green for gradient feel
const FLASH_COLOR = '#2D5F3F';          // Green flash (Strava uses orange)
const ICON_COLORS = ['#FFFFFF', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.35)'];

// ─── Icon types for the shower ───────────────────────────────────
const ICON_NAMES: Array<keyof typeof Ionicons.glyphMap> = [
  'leaf', 'water', 'leaf', 'heart', 'leaf', 'water',
  'leaf', 'sunny', 'leaf', 'heart', 'water', 'leaf',
];
const ICON_SIZES = [18, 24, 30, 36, 22, 28, 20, 32, 26, 34, 22, 28];

// ─── Pre-computed Ribbon SVG Paths ───────────────────────────────
// Static S-curve ribbon — animated via translateY + opacity from Reanimated
// The ribbon flows: top-right → center-left → bottom-right (like Strava)
const T = 70; // ribbon thickness

// Main ribbon path
const RIBBON_PATH = `M ${W * 0.85} ${-80}
  C ${W * 1.1} ${H * 0.15}, ${-W * 0.15} ${H * 0.35}, ${W * 0.15} ${H * 0.5}
  C ${W * 0.45} ${H * 0.65}, ${W * 1.2} ${H * 0.78}, ${W * 0.5} ${H + 80}
  L ${W * 0.5 + T} ${H + 80}
  C ${W * 1.2 + T} ${H * 0.78}, ${W * 0.45 + T} ${H * 0.65}, ${W * 0.15 + T} ${H * 0.5}
  C ${-W * 0.15 + T} ${H * 0.35}, ${W * 1.1 + T} ${H * 0.15}, ${W * 0.85 + T} ${-80}
  Z`;

// Secondary ribbon (slightly offset for depth)
const RIBBON_PATH_2 = `M ${W * 0.88} ${-60}
  C ${W * 1.05} ${H * 0.18}, ${-W * 0.1} ${H * 0.38}, ${W * 0.18} ${H * 0.52}
  C ${W * 0.48} ${H * 0.67}, ${W * 1.15} ${H * 0.8}, ${W * 0.55} ${H + 60}
  L ${W * 0.55 + T * 0.6} ${H + 60}
  C ${W * 1.15 + T * 0.6} ${H * 0.8}, ${W * 0.48 + T * 0.6} ${H * 0.67}, ${W * 0.18 + T * 0.6} ${H * 0.52}
  C ${-W * 0.1 + T * 0.6} ${H * 0.38}, ${W * 1.05 + T * 0.6} ${H * 0.18}, ${W * 0.88 + T * 0.6} ${-60}
  Z`;

// ─── Floating Icon Component ─────────────────────────────────────
function FloatingIcon({ config, visible }: {
  config: {
    icon: keyof typeof Ionicons.glyphMap;
    size: number;
    startX: number;
    startY: number;
    color: string;
    delay: number;
    drift: number;
  };
  visible: boolean;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (!visible) {
      opacity.value = 0;
      translateY.value = 0;
      translateX.value = 0;
      rotate.value = 0;
      scale.value = 0.5;
      return;
    }

    // Fade in at random delay
    opacity.value = withDelay(config.delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(600, withTiming(0, { duration: 400 })) // fade out
      )
    );
    // Drift downward slowly (gravity feel)
    translateY.value = withDelay(config.delay,
      withTiming(50 + Math.random() * 40, { duration: 1200, easing: Easing.in(Easing.quad) })
    );
    // Slight horizontal drift
    translateX.value = withDelay(config.delay,
      withTiming(config.drift, { duration: 1200 })
    );
    // Gentle rotation
    rotate.value = withDelay(config.delay,
      withTiming((Math.random() - 0.5) * 30, { duration: 1200 })
    );
    // Scale in with bounce
    scale.value = withDelay(config.delay,
      withSpring(1, { damping: 10, stiffness: 100 })
    );
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: config.startX,
    top: config.startY,
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={config.icon} size={config.size} color={config.color} />
    </Animated.View>
  );
}

// ─── Props Interface ─────────────────────────────────────────────
interface PlantAddedCelebrationProps {
  visible: boolean;
  plantName: string;
  plantNameAr?: string;
  plantImage: {
    imageUrl?: string;
    capturedImageUri?: string;
    plantId?: string;
  };
  onDismiss: () => void;
}

// ─── Main Component ──────────────────────────────────────────────
export default function PlantAddedCelebration({
  visible,
  plantName,
  plantNameAr,
  plantImage,
  onDismiss,
}: PlantAddedCelebrationProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Generate icon configs for the shower
  const iconConfigs = useMemo(() => {
    if (!visible) return [];
    return Array.from({ length: 24 }, (_, i) => ({
      icon: ICON_NAMES[i % ICON_NAMES.length],
      size: ICON_SIZES[i % ICON_SIZES.length],
      startX: Math.random() * (W - 40),
      startY: H * 0.15 + Math.random() * (H * 0.65),
      color: ICON_COLORS[i % ICON_COLORS.length],
      delay: 300 + Math.random() * 400, // staggered appearance
      drift: (Math.random() - 0.5) * 30,
    }));
  }, [visible]);

  // ─── Shared Values ──────────────────────────────────────────
  // Whole-screen fade-out for smooth exit
  const fadeOut = useSharedValue(1);

  // Phase 1: Green flash takeover
  const flashOpacity = useSharedValue(0);
  const flashScale = useSharedValue(0.3);

  // Phase 2: Black background
  const bgOpacity = useSharedValue(0);

  // Phase 3: Icons shower
  const iconsVisible = useSharedValue(0);

  // Phase 4: Ribbon (slides in from above + gentle sway)
  const ribbonOpacity = useSharedValue(0);
  const ribbonTranslateY = useSharedValue(-H * 0.3);
  const ribbonTranslateX = useSharedValue(0);

  // Phase 5: Center content
  const iconScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const arabicOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const photoScale = useSharedValue(0);
  const photoOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0);

  // ─── Haptics ────────────────────────────────────────────────
  const hapticHeavy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);
  const hapticSuccess = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  const hapticLight = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // ─── Helper to track timeouts for cleanup ───────────────────
  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  // ─── Animation Orchestrator ─────────────────────────────────
  useEffect(() => {
    if (!visible) {
      // Reset everything
      fadeOut.value = 1;
      flashOpacity.value = 0;
      flashScale.value = 0.3;
      bgOpacity.value = 0;
      iconsVisible.value = 0;
      ribbonOpacity.value = 0;
      ribbonTranslateY.value = -H * 0.3;
      ribbonTranslateX.value = 0;
      iconScale.value = 0;
      titleOpacity.value = 0;
      titleTranslateY.value = 30;
      arabicOpacity.value = 0;
      subtitleOpacity.value = 0;
      photoScale.value = 0;
      photoOpacity.value = 0;
      badgeScale.value = 0;
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      return;
    }

    // ═══ PHASE 1: GREEN FLASH (0–400ms) ═══
    // Liquid blob expands from center, filling the screen green
    hapticHeavy();
    flashScale.value = withTiming(3, { duration: 400, easing: Easing.out(Easing.cubic) });
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(100, withTiming(0, { duration: 300 }))
    );

    // ═══ PHASE 2: BLACK BG REVEALS (200–500ms) ═══
    bgOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));

    // ═══ PHASE 3: ICON SHOWER (300–1400ms) ═══
    // 24 themed icons appear scattered, floating with gravity
    scheduleTimeout(() => {
      iconsVisible.value = 1;
      hapticSuccess();
    }, 300);

    // ═══ PHASE 4: CENTER CONTENT (500–1200ms) ═══
    // Plant photo + leaf icon appear center
    photoScale.value = withDelay(500, withSpring(1, { damping: 12, stiffness: 100 }));
    photoOpacity.value = withDelay(500, withTiming(1, { duration: 300 }));
    iconScale.value = withDelay(600, withSpring(1, { damping: 8, stiffness: 120 }));

    // Checkmark badge
    badgeScale.value = withDelay(900, withSpring(1, { damping: 8, stiffness: 150 }));
    scheduleTimeout(hapticLight, 900);

    // Title text
    titleOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
    titleTranslateY.value = withDelay(800, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

    // Arabic name
    arabicOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));

    // Subtitle
    subtitleOpacity.value = withDelay(1200, withTiming(1, { duration: 300 }));

    // ═══ PHASE 5: RIBBON SWEEPS IN (1200–2200ms) ═══
    ribbonOpacity.value = withDelay(1200, withTiming(0.85, { duration: 600 }));
    ribbonTranslateY.value = withDelay(1200,
      withTiming(0, { duration: 1000, easing: Easing.out(Easing.cubic) })
    );

    // Ribbon gentle sway (continuous after entrance)
    scheduleTimeout(() => {
      ribbonTranslateX.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(-10, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }, 2200);

    // ═══ PHASE 6: FADE OUT + AUTO-DISMISS (3500ms+) ═══
    // Smooth fade-out before navigating — no jarring screen flash
    scheduleTimeout(() => {
      fadeOut.value = withTiming(0, { duration: 500, easing: Easing.in(Easing.cubic) });
    }, 3500);
    timerRef.current = setTimeout(onDismiss, 4000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [visible]);

  // ─── Animated Styles ────────────────────────────────────────

  // Green flash blob
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    transform: [{ scale: flashScale.value }],
  }));

  // Black background
  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  // Ribbon wrapper (slides in + sways)
  const ribbonStyle = useAnimatedStyle(() => ({
    opacity: ribbonOpacity.value,
    transform: [
      { translateY: ribbonTranslateY.value },
      { translateX: ribbonTranslateX.value },
    ],
  }));

  // Plant photo
  const photoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: photoScale.value }],
    opacity: photoOpacity.value,
  }));

  // Center leaf icon
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  // Checkmark badge
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  // Title
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  // Arabic name
  const arabicStyle = useAnimatedStyle(() => ({
    opacity: arabicOpacity.value,
  }));

  // Subtitle
  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  // Whole-screen fade-out
  const fadeOutStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  // ─── Handlers ───────────────────────────────────────────────
  const handleDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Fade out smoothly, then navigate
    fadeOut.value = withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) });
    setTimeout(onDismiss, 400);
  }, [onDismiss]);

  if (!visible) return null;

  // Arabic mode: AR name big, EN name small. English mode: EN big, AR small.
  const primaryName = isRTL && plantNameAr ? plantNameAr : plantName;
  const secondaryName = isRTL ? plantName : plantNameAr;
  const PHOTO_SIZE = FIBONACCI.HUGE; // 144px

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.fullScreen, fadeOutStyle]}>
        {/* Layer 1: Green flash blob (renders BELOW black bg) */}
        <Animated.View style={[styles.flashBlob, flashStyle]} />

        {/* Layer 2: Black background (fades in ON TOP of flash) */}
        <Animated.View style={[styles.blackBg, bgStyle]} />

        {/* Layer 3: Floating icon shower */}
        <View style={styles.iconShowerContainer} pointerEvents="none">
          {iconConfigs.map((config, i) => (
            <FloatingIcon
              key={`icon-${i}`}
              config={config}
              visible={iconsVisible.value === 1 || visible}
            />
          ))}
        </View>

        {/* Layer 4: SVG Ribbon (slides in from above, sways gently) */}
        <Animated.View style={[styles.ribbonContainer, ribbonStyle]} pointerEvents="none">
          <Svg width={W} height={H + 160} style={StyleSheet.absoluteFill}>
            {/* Depth shadow ribbon */}
            <Path d={RIBBON_PATH_2} fill={RIBBON_COLOR_LIGHT} opacity={0.25} />
            {/* Main ribbon */}
            <Path d={RIBBON_PATH} fill={RIBBON_COLOR} />
          </Svg>
        </Animated.View>

        {/* Layer 5: Center content */}
        <View style={styles.centerContent}>
          {/* Plant photo with ring */}
          <Animated.View style={[styles.photoRing, photoStyle]}>
            <View style={styles.photoInner}>
              <PlantImage
                imageUrl={plantImage.imageUrl}
                capturedImageUri={plantImage.capturedImageUri}
                plantId={plantImage.plantId}
                plantName={plantName}
                size={PHOTO_SIZE}
                style={{ borderRadius: PHOTO_SIZE / 2 }}
              />
            </View>
            {/* Checkmark badge */}
            <Animated.View style={[styles.badge, badgeStyle]}>
              <Ionicons name="checkmark" size={FIBONACCI.LG} color={COLORS.white} />
            </Animated.View>
          </Animated.View>

          {/* Leaf icon above text */}
          <Animated.View style={[styles.leafIcon, iconStyle]}>
            <Ionicons name="leaf" size={FIBONACCI.XL} color={COLORS.success} />
          </Animated.View>

          {/* Plant name — big and bold like "Nice work!" */}
          <Animated.View style={titleStyle}>
            <Text style={styles.plantName}>{primaryName}</Text>
          </Animated.View>

          {/* Arabic / secondary name */}
          {secondaryName ? (
            <Animated.View style={arabicStyle}>
              <Text style={styles.secondaryName}>{secondaryName}</Text>
            </Animated.View>
          ) : null}

          {/* Subtitle */}
          <Animated.View style={subtitleStyle}>
            <Text style={styles.subtitle}>{t('celebration.addedToGarden')}</Text>
          </Animated.View>

        </View>

        {/* Tap anywhere to dismiss */}
        <TouchableOpacity
          style={styles.dismissArea}
          onPress={handleDismiss}
          activeOpacity={1}
        />
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const PHOTO_SIZE = FIBONACCI.HUGE; // 144px
const RING_SIZE = 172; // Photo + ring border + gap
const BADGE_SIZE = FIBONACCI.XL; // 34px

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },

  // Black background layer
  blackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },

  // Green flash blob (circular, expands from center)
  flashBlob: {
    position: 'absolute',
    width: Math.max(W, H),
    height: Math.max(W, H),
    borderRadius: Math.max(W, H) / 2,
    backgroundColor: FLASH_COLOR,
    alignSelf: 'center',
    top: (H - Math.max(W, H)) / 2,
    left: (W - Math.max(W, H)) / 2,
  },

  // Icon shower
  iconShowerContainer: {
    ...StyleSheet.absoluteFillObject,
  },

  // SVG ribbon
  ribbonContainer: {
    ...StyleSheet.absoluteFillObject,
  },

  // Center content
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: FIBONACCI.XXL, // offset slightly upward
  },

  // Photo ring
  photoRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 4,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: FIBONACCI.LG,
  },
  photoInner: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    overflow: 'hidden',
  },

  // Checkmark badge
  badge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000000',
  },

  // Leaf icon
  leafIcon: {
    marginBottom: FIBONACCI.SM,
  },

  // Plant name — massive like Strava's "Nice work!"
  plantName: {
    fontSize: TYPOGRAPHY.XXXL, // 42px — hero size
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    paddingHorizontal: FIBONACCI.XL,
  },

  // Secondary name
  secondaryName: {
    fontSize: TYPOGRAPHY.XL, // 26px
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: FIBONACCI.SM,
  },

  // Subtitle
  subtitle: {
    fontSize: TYPOGRAPHY.SM,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: FIBONACCI.SM,
  },

  // Dismiss area (behind center content, catches taps on black bg)
  dismissArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
});
