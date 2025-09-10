/**
 * Lotus App Color System
 * Based on the HTML mockup design tokens
 */

// Base color palette
const baseColors = {
  // Primary Brand Colors
  lotusGreen: '#2D5F3F',
  sageGreen: '#7FA68A',
  nileBlue: '#4A90A4',
  cairoSand: '#F7F3E9',
  morningMist: '#FAFFF7',
  
  // Base Colors
  pureWhite: '#FFFFFF',
  white: '#FFFFFF', // alias for pureWhite
  softGray: '#F8F8F8',
  lightGray: '#F0F0F0',
  mediumGray: '#E8E8E8',
  gray: '#E8E8E8', // alias for mediumGray
  
  // Status Colors
  healthy: '#52C41A',
  warning: '#FAAD14',
  critical: '#FF4D4F',
  
  // Gradients (represented as arrays for react-native-linear-gradient)
  primaryGradient: ['#2D5F3F', '#4A90A4'], // lotus-green to nile-blue
  backgroundGradient: ['#F7F3E9', '#E8F5E9'], // cairo-sand to light green
  onboardingGradient: ['#F7F3E9', '#E8F5E9'], // 180deg gradient
  
  // Semantic Colors
  success: '#52C41A',
  error: '#FF4D4F',
  warning: '#FAAD14',
  info: '#4A90A4',
  
  // Surface Colors
  surface: '#FFFFFF',
  surfaceVariant: '#F8F8F8',
  background: '#F7F3E9',
  
  // Border Colors
  border: '#E8E8E8',
  borderFocus: '#2D5F3F',
  
  // Shadow Colors
  shadowLight: 'rgba(0, 0, 0, 0.06)',
  shadowMedium: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(45, 95, 63, 0.25)',
  
  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

// Theme-aware colors structure (for compatibility with Expo templates)
export const Colors = {
  // Flat structure (backward compatibility)
  ...baseColors,
  // Theme-specific colors for useThemeColor hook
  light: {
    text: '#2C2C2C',
    background: '#F7F3E9',
    tint: '#2D5F3F',
    icon: '#6B6B6B',
    tabIconDefault: '#6B6B6B',
    tabIconSelected: '#2D5F3F',
  },
  dark: {
    text: '#ECEDEE',
    background: '#2D5F3F',
    tint: '#7FA68A',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#7FA68A',
  },
  // Additional semantic colors (avoid duplicates from baseColors spread)
  textPrimary: '#2C2C2C',
  textSecondary: '#6B6B6B',
  primary: '#2D5F3F',
  secondary: '#4A90A4',
  // Add missing colors referenced in components
  black: '#000000',
} as const;

// Legacy export for backward compatibility
export const COLORS = Colors;

// Type for color keys
export type ColorKey = keyof typeof Colors;