import React, { FC, ReactNode } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors, Layout, Shadow } from '@/constants';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'plant' | 'care' | 'elevated';
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export const Card: FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  testID,
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: Colors.pureWhite,
      borderRadius: Layout.cardRadius,
      overflow: 'hidden',
    };

    switch (variant) {
      case 'plant':
        return {
          ...baseStyle,
          ...Shadow.sm,
          marginBottom: Layout.cardMargin,
        };
      case 'care':
        return {
          ...baseStyle,
          ...Shadow.sm,
          padding: Layout.cardPadding,
          marginBottom: Layout.cardMargin,
        };
      case 'elevated':
        return {
          ...baseStyle,
          ...Shadow.lg,
          padding: Layout.screenPadding,
        };
      default:
        return {
          ...baseStyle,
          ...Shadow.sm,
          padding: Layout.cardPadding,
        };
    }
  };

  const cardStyle = getCardStyle();

  if (onPress) {
    return (
      <TouchableOpacity
        style={[cardStyle, style]}
        onPress={onPress}
        activeOpacity={0.98}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyle, style]} testID={testID}>
      {children}
    </View>
  );
};

export default Card;