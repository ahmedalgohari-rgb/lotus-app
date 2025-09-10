import React, { FC, ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants';

interface GradientProps {
  variant?: 'primary' | 'background' | 'onboarding' | 'custom';
  colors?: string[];
  children: ReactNode;
  style?: ViewStyle;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export const Gradient: FC<GradientProps> = ({
  variant = 'primary',
  colors,
  children,
  style,
  start,
  end,
}) => {
  const getGradientColors = (): string[] => {
    if (colors) return colors;
    
    switch (variant) {
      case 'background':
        return Colors.backgroundGradient;
      case 'onboarding':
        return Colors.onboardingGradient;
      case 'primary':
      default:
        return Colors.primaryGradient;
    }
  };

  const getGradientDirection = () => {
    if (start && end) return { start, end };
    
    switch (variant) {
      case 'background':
      case 'onboarding':
        return {
          start: { x: 0, y: 0 },
          end: { x: 0, y: 1 }, // 180deg gradient
        };
      case 'primary':
      default:
        return {
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 }, // 135deg gradient
        };
    }
  };

  const { start: gradientStart, end: gradientEnd } = getGradientDirection();

  return (
    <LinearGradient
      colors={getGradientColors()}
      start={gradientStart}
      end={gradientEnd}
      style={style}
    >
      {children}
    </LinearGradient>
  );
};

export default Gradient;