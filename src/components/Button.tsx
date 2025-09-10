import React from 'react';
import { TouchableOpacity, StyleSheet, TouchableOpacityProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/colors';
import { GRADIENTS } from '@/constants/gradients';
import { BORDER_RADIUS, SPACING } from '@/constants/spacing';
import Text from './Text';

type Props = {
  variant?: 'primary' | 'secondary';
  title: string;
} & TouchableOpacityProps;

const Button: React.FC<Props> = ({ variant = 'primary', title, style, ...props }) => {
  if (variant === 'primary') {
    return (
      <TouchableOpacity style={[styles.base, style]} {...props}>
        <LinearGradient
          colors={GRADIENTS.primary}
          style={styles.primaryContainer}
        >
          <Text variant="h2" style={styles.primaryText}>
            {title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.base, styles.secondaryContainer, style]} {...props}>
      <Text variant="h2" style={styles.secondaryText}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.m,
    borderRadius: BORDER_RADIUS.medium,
  },
  primaryContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.medium,
  },
  primaryText: {
    color: COLORS.white,
  },
  secondaryContainer: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  secondaryText: {
    color: COLORS.primary,
  },
});

export default Button;
