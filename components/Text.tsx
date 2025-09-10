import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { Typography } from '@/constants';

/**
 * Typography variants available in the design system
 */
type TypographyVariant = 'appTitle' | 'screenTitle' | 'arabicTitle' | 'sectionHeader' | 'body' | 'bodySecondary' | 'caption' | 'buttonPrimary' | 'buttonSecondary' | 'plantName' | 'scientificName' | 'careTip';

interface LotusTextProps extends TextProps {
  /** Typography variant from design system */
  variant?: TypographyVariant;
  /** Text color from design system */
  color?: string;
  /** Center align text */
  center?: boolean;
  /** Bold text weight */
  bold?: boolean;
}

/**
 * Enhanced Text component with Lotus design system integration
 * Memoized for performance optimization
 */
const Text: React.FC<LotusTextProps> = React.memo(({ 
  variant = 'body', 
  color, 
  center = false,
  bold = false,
  style, 
  ...props 
}) => {
  // Simple style handling to avoid array/object type conflicts
  const baseStyle = Typography[variant] || Typography.body;
  
  const combinedStyle = {
    ...baseStyle,
    ...(color && { color }),
    ...(center && { textAlign: 'center' as const }),
    ...(bold && { fontWeight: 'bold' as const }),
    ...(typeof style === 'object' && !Array.isArray(style) ? style : {})
  };

  return <RNText style={combinedStyle} {...props} />;
});

export default Text;
