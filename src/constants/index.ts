/**
 * Lotus App Design System
 * Centralized export for all design tokens
 */

export { Colors, type ColorKey } from './colors';
export { 
  FontFamily, 
  FontSize, 
  FontWeight, 
  LineHeight, 
  Typography, 
  type TypographyKey 
} from './typography';
export { 
  Spacing, 
  Layout, 
  BorderRadius, 
  Shadow,
  type SpacingKey,
  type LayoutKey,
  type BorderRadiusKey,
  type ShadowKey
} from './spacing';

// Common theme object for easy access
export const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  layout: Layout,
  borderRadius: BorderRadius,
  shadow: Shadow,
} as const;

// Screen dimensions helper (will be populated by responsive utils)
export const Screen = {
  width: 0,  // Will be set by responsive utils
  height: 0, // Will be set by responsive utils
} as const;