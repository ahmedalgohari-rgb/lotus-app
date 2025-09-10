/**
 * TouchableAccessible Component
 * WCAG 2.1 AA compliant touchable component with proper accessibility features
 */
import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { 
  MIN_TOUCH_TARGET_SIZE,
  AccessibilityRole,
  getAccessibilityProps,
  ensureTouchTarget
} from '@/utils/accessibility';

interface TouchableAccessibleProps extends Omit<TouchableOpacityProps, 'accessibilityRole'> {
  label: string;
  hint?: string;
  role?: AccessibilityRole;
  minSize?: number;
  children: React.ReactNode;
  state?: { [key: string]: boolean | string };
  onPress?: () => void;
}

const TouchableAccessible: React.FC<TouchableAccessibleProps> = ({
  label,
  hint,
  role = 'button',
  minSize = MIN_TOUCH_TARGET_SIZE,
  children,
  style,
  state,
  onPress,
  disabled = false,
  ...props
}) => {
  // Calculate minimum dimensions
  const minDimensions = ensureTouchTarget(minSize);
  
  // Create accessibility props
  const accessibilityProps = getAccessibilityProps(
    label,
    hint,
    role,
    { disabled, ...state }
  );

  const containerStyle: ViewStyle = [
    styles.container,
    {
      minWidth: minDimensions,
      minHeight: minDimensions,
    },
    style,
  ].filter(Boolean) as ViewStyle;

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
      {...accessibilityProps}
      {...props}
    >
      <View style={styles.content}>
        {children}
      </View>
    </TouchableOpacity>
  );
};

// Hook for creating accessible touchable components
export const useAccessibleTouch = (
  label: string,
  onPress: () => void,
  options?: {
    hint?: string;
    role?: AccessibilityRole;
    minSize?: number;
    state?: { [key: string]: boolean | string };
  }
) => {
  return {
    onPress,
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: options?.hint,
    accessibilityRole: options?.role || 'button',
    accessibilityState: { disabled: false, ...options?.state },
    style: {
      minWidth: ensureTouchTarget(options?.minSize || MIN_TOUCH_TARGET_SIZE),
      minHeight: ensureTouchTarget(options?.minSize || MIN_TOUCH_TARGET_SIZE),
    },
  };
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    // Minimum touch target size as per WCAG 2.5.5
    minWidth: MIN_TOUCH_TARGET_SIZE,
    minHeight: MIN_TOUCH_TARGET_SIZE,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TouchableAccessible;