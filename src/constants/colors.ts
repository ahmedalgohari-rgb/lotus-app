/**
 * Lotus App Color System
 * Based on the HTML mockup design tokens
 */

export const Colors = {
  // Primary Brand Colors
  lotusGreen: '#2D5F3F',
  sageGreen: '#7FA68A',
  nileBlue: '#4A90A4',
  cairoSand: '#F7F3E9',
  morningMist: '#FAFFF7',
  
  // Base Colors
  pureWhite: '#FFFFFF',
  softGray: '#F8F8F8',
  lightGray: '#F0F0F0',
  mediumGray: '#E8E8E8',
  
  // Text Colors
  textPrimary: '#2C2C2C',
  textSecondary: '#6B6B6B',
  
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

// Type for color keys
export type ColorKey = keyof typeof Colors;