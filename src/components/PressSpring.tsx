import React from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface PressSpringProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
  pressedScale?: number;
  children: React.ReactNode;
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 220,
  mass: 0.6,
};

export default function PressSpring({
  style,
  wrapperStyle,
  pressedScale = 0.96,
  children,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressSpringProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[wrapperStyle, animatedStyle]}>
      <Pressable
        {...rest}
        disabled={disabled}
        onPressIn={(e) => {
          if (!disabled) scale.value = withSpring(pressedScale, SPRING_CONFIG);
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withSpring(1, SPRING_CONFIG);
          onPressOut?.(e);
        }}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
