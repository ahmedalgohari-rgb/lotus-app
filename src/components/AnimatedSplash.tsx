import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EASE_OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

interface AnimatedSplashProps {
  onComplete: () => void;
}

export default function AnimatedSplash({ onComplete }: AnimatedSplashProps) {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.94);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800, easing: EASE_OUT_EXPO });

    logoScale.value = withSequence(
      withTiming(1.0, { duration: 1100, easing: EASE_OUT_EXPO }),
      withDelay(
        200,
        withSequence(
          withTiming(1.025, { duration: 400, easing: EASE_IN_OUT }),
          withTiming(1.0, { duration: 400, easing: EASE_IN_OUT })
        )
      )
    );

    overlayOpacity.value = withDelay(
      2150,
      withTiming(0, { duration: 350, easing: EASE_OUT_EXPO }, (finished) => {
        if (finished) runOnJS(onComplete)();
      })
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.container, overlayStyle]}
    >
      <Animated.Image
        source={require('../../assets/splash-lotus.png')}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.warmSand,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logo: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
  },
});
