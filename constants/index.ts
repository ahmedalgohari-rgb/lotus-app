/**
 * Lotus App Design System
 * Centralized export for all design tokens
 */

// Import everything first
import { Colors as ColorsImport, type ColorKey } from './colors';
import { 
  FontFamily, 
  FontSize, 
  FontWeight, 
  LineHeight, 
  Typography, 
  type TypographyKey 
} from './typography';
import { 
  Spacing, 
  Layout, 
  BorderRadius, 
  Shadow,
  type SpacingKey,
  type LayoutKey,
  type BorderRadiusKey,
  type ShadowKey
} from './spacing';
import { 
  LotusDesignSystem,
  ComponentPatterns,
  IconSystem,
  BrandGuidelines,
  AccessibilityGuidelines,
  AnimationGuidelines,
  LayoutPatterns,
  UsageGuidelines
} from './designSystem';

// Re-export everything
export { ColorsImport as Colors, type ColorKey };
export { 
  FontFamily, 
  FontSize, 
  FontWeight, 
  LineHeight, 
  Typography, 
  type TypographyKey 
};
export { 
  Spacing, 
  Layout, 
  BorderRadius, 
  Shadow,
  type SpacingKey,
  type LayoutKey,
  type BorderRadiusKey,
  type ShadowKey
};
export { 
  LotusDesignSystem,
  ComponentPatterns,
  IconSystem,
  BrandGuidelines,
  AccessibilityGuidelines,
  AnimationGuidelines,
  LayoutPatterns,
  UsageGuidelines
};

// Common theme object for easy access
export const Theme = {
  colors: ColorsImport,
  typography: Typography,
  spacing: Spacing,
  layout: Layout,
  borderRadius: BorderRadius,
  shadow: Shadow,
  designSystem: LotusDesignSystem,
} as const;

// Screen dimensions helper (will be populated by responsive utils)
export const Screen = {
  width: 0,  // Will be set by responsive utils
  height: 0, // Will be set by responsive utils
} as const;