import React from 'react';
import { TouchableOpacity, StyleSheet, TouchableOpacityProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants';
import { Layout } from '@/constants';
import Text from '@/components/Text';
import { MIN_TOUCH_TARGET_SIZE, ensureTouchTarget } from '@/utils/accessibility';

interface ButtonProps extends TouchableOpacityProps {
  /** Button visual variant */
  variant?: 'primary' | 'secondary';
  /** Button text content */
  title: string;
  /** Loading state indicator */
  loading?: boolean;
  /** Custom button size */
  size?: 'small' | 'medium' | 'large';
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint for screen readers */
  accessibilityHint?: string;
}

/**
 * Enhanced Button component with Lotus design system integration
 * Memoized for performance optimization
 */
const Button: React.FC<ButtonProps> = React.memo(({ 
  variant = 'primary', 
  title, 
  loading = false, 
  size = 'medium',
  style,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  ...props 
}) => {
  // Ensure WCAG compliance for touch targets
  const getSizeStyles = () => {
    const baseHeight = size === 'small' ? 40 : size === 'large' ? 56 : 48;
    return {
      minHeight: ensureTouchTarget(baseHeight),
      paddingHorizontal: size === 'small' ? Layout.md : size === 'large' ? Layout.xl : Layout.lg,
    };
  };

  const accessibilityProps = {
    accessible: true,
    accessibilityRole: 'button' as const,
    accessibilityLabel: accessibilityLabel || title,
    accessibilityHint,
    accessibilityState: { disabled: disabled || loading },
  };
  if (variant === 'primary') {
    return (
      <TouchableOpacity 
        style={[styles.base, getSizeStyles(), style]} 
        disabled={disabled || loading}
        {...accessibilityProps}
        {...props}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.primaryContainer}
        >
          <Text variant="h2" style={styles.primaryText}>
            {loading ? 'Loading...' : title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.base, styles.secondaryContainer, getSizeStyles(), style]} 
      disabled={disabled || loading}
      {...accessibilityProps}
      {...props}
    >
      <Text variant="h2" style={styles.secondaryText}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  base: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.md,
    borderRadius: Layout.borderRadius,
  },
  primaryContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Layout.borderRadius,
  },
  primaryText: {
    color: Colors.white,
  },
  secondaryContainer: {
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  secondaryText: {
    color: Colors.primary,
  },
});

export default Button;
