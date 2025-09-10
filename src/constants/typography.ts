/**
 * Lotus App Typography System
 * Based on the HTML mockup font specifications with Arabic support
 */

import { Platform } from 'react-native';

export const FontFamily = {
  // System fonts with Arabic support
  primary: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'System',
  }),
  
  // Arabic fonts
  arabic: Platform.select({
    ios: 'SF Arabic',
    android: 'Noto Sans Arabic',
    default: 'System',
  }),
  
  // Fallback system font
  system: Platform.select({
    ios: '-apple-system',
    android: 'Roboto',
    default: 'System',
  }),
} as const;

export const FontSize = {
  // Hero sizes
  hero: 32, // App title
  
  // Heading sizes
  title: 24, // Screen titles
  subtitle: 20, // Arabic titles
  heading: 18, // Section headers
  
  // Body text
  body: 16, // Regular text
  bodySmall: 14, // Secondary text
  caption: 12, // Hints/tips
  small: 10, // Very small text
  
  // Button text
  buttonLarge: 16,
  buttonMedium: 14,
  buttonSmall: 12,
} as const;

export const FontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

// Typography styles based on mockup
export const Typography = {
  // App title (splash screen)
  appTitle: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.hero,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.hero * LineHeight.tight,
  },
  
  // Screen titles
  screenTitle: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.title,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.title * LineHeight.normal,
  },
  
  // Arabic titles
  arabicTitle: {
    fontFamily: FontFamily.arabic,
    fontSize: FontSize.subtitle,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.subtitle * LineHeight.normal,
    writingDirection: 'rtl' as const,
  },
  
  // Section headers
  sectionHeader: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.heading,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.heading * LineHeight.normal,
  },
  
  // Body text
  body: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.body * LineHeight.normal,
  },
  
  // Secondary body text
  bodySecondary: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.bodySmall * LineHeight.normal,
  },
  
  // Caption text
  caption: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.caption * LineHeight.normal,
  },
  
  // Button text
  buttonPrimary: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.buttonLarge,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.buttonLarge * LineHeight.tight,
  },
  
  buttonSecondary: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.buttonLarge,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.buttonLarge * LineHeight.tight,
  },
  
  // Plant names
  plantName: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.body * LineHeight.tight,
  },
  
  // Scientific names (italic)
  scientificName: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.regular,
    fontStyle: 'italic' as const,
    lineHeight: FontSize.bodySmall * LineHeight.normal,
  },
  
  // Care tips
  careTip: {
    fontFamily: FontFamily.primary,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.regular,
    fontStyle: 'italic' as const,
    lineHeight: FontSize.caption * LineHeight.relaxed,
  },
} as const;

// Type for typography keys
export type TypographyKey = keyof typeof Typography;