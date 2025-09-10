/**
 * Visual Hierarchy Enhancement System
 * Professional visual design patterns for improved UX
 */
import { Colors, Typography, Layout } from './index';

// Enhanced shadow system for depth and hierarchy
export const EnhancedShadows = {
  // Subtle shadows for cards and surfaces
  subtle: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Medium shadows for important elements
  medium: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Strong shadows for floating elements
  strong: {
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // Focus shadows for interactive states
  focus: {
    shadowColor: Colors.lotusGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Success state shadows
  success: {
    shadowColor: '#10B981', // Success green
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Warning state shadows
  warning: {
    shadowColor: '#F59E0B', // Warning amber
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Error state shadows
  error: {
    shadowColor: '#EF4444', // Error red
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
} as const;

// Visual emphasis levels for consistent hierarchy
export const EmphasisLevels = {
  // Primary emphasis - main actions, hero content
  primary: {
    scale: 1.0,
    opacity: 1.0,
    fontWeight: '700' as const,
    shadow: EnhancedShadows.strong,
    borderWidth: 0,
  },
  
  // Secondary emphasis - supporting content
  secondary: {
    scale: 0.95,
    opacity: 0.9,
    fontWeight: '600' as const,
    shadow: EnhancedShadows.medium,
    borderWidth: 0,
  },
  
  // Tertiary emphasis - supplementary content
  tertiary: {
    scale: 0.9,
    opacity: 0.8,
    fontWeight: '500' as const,
    shadow: EnhancedShadows.subtle,
    borderWidth: 1,
  },
  
  // Minimal emphasis - background content
  minimal: {
    scale: 0.85,
    opacity: 0.7,
    fontWeight: '400' as const,
    shadow: null,
    borderWidth: 1,
  },
} as const;

// Spacing system for consistent visual rhythm
export const VisualSpacing = {
  // Micro spacing for tight elements
  micro: Layout.xs, // 4px
  
  // Small spacing for related elements
  small: Layout.sm, // 8px
  
  // Medium spacing for section separation
  medium: Layout.md, // 16px
  
  // Large spacing for major sections
  large: Layout.lg, // 24px
  
  // Extra large spacing for screen sections
  extraLarge: Layout.xl, // 32px
  
  // Huge spacing for major visual breaks
  huge: Layout['2xl'], // 48px
} as const;

// Color intensity system for visual hierarchy
export const ColorIntensity = {
  // High contrast for primary content
  primary: {
    text: Colors.textPrimary,
    background: Colors.lotusGreen,
    opacity: 1.0,
  },
  
  // Medium contrast for secondary content
  secondary: {
    text: Colors.textSecondary,
    background: Colors.nileBlue,
    opacity: 0.9,
  },
  
  // Low contrast for supporting content
  supporting: {
    text: Colors.textTertiary,
    background: Colors.surface,
    opacity: 0.8,
  },
  
  // Minimal contrast for background elements
  background: {
    text: Colors.textDisabled,
    background: Colors.backgroundSecondary,
    opacity: 0.6,
  },
} as const;

// Animation configurations for smooth interactions
export const MotionConfig = {
  // Quick interactions (buttons, toggles)
  quick: {
    duration: 150,
    timing: 'ease-out' as const,
  },
  
  // Standard interactions (modals, sheets)
  standard: {
    duration: 250,
    timing: 'ease-in-out' as const,
  },
  
  // Smooth interactions (page transitions)
  smooth: {
    duration: 350,
    timing: 'ease-in-out' as const,
  },
  
  // Slow interactions (complex animations)
  slow: {
    duration: 500,
    timing: 'ease-in-out' as const,
  },
} as const;

// Component hierarchy styles
export const ComponentHierarchy = {
  // Hero sections - highest visual priority
  hero: {
    ...EmphasisLevels.primary,
    fontSize: Typography.fontSize.xl,
    marginBottom: VisualSpacing.huge,
    textAlign: 'center' as const,
  },
  
  // Section headers - high visual priority
  sectionHeader: {
    ...EmphasisLevels.secondary,
    fontSize: Typography.fontSize.lg,
    marginBottom: VisualSpacing.large,
    marginTop: VisualSpacing.extraLarge,
  },
  
  // Content blocks - medium visual priority
  contentBlock: {
    ...EmphasisLevels.tertiary,
    fontSize: Typography.fontSize.md,
    marginBottom: VisualSpacing.medium,
    lineHeight: 1.6,
  },
  
  // Supporting text - lower visual priority
  supportingText: {
    ...EmphasisLevels.minimal,
    fontSize: Typography.fontSize.sm,
    marginBottom: VisualSpacing.small,
    lineHeight: 1.4,
  },
  
  // Captions and metadata - minimal visual priority
  caption: {
    ...EmphasisLevels.minimal,
    fontSize: Typography.fontSize.xs,
    marginBottom: VisualSpacing.micro,
    lineHeight: 1.3,
  },
} as const;

// Card design patterns for consistent layouts
export const CardPatterns = {
  // Standard content cards
  content: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.large,
    padding: Layout.cardPadding,
    marginBottom: VisualSpacing.medium,
    ...EnhancedShadows.subtle,
  },
  
  // Interactive cards (buttons, links)
  interactive: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.large,
    padding: Layout.cardPadding,
    marginBottom: VisualSpacing.medium,
    ...EnhancedShadows.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  // Featured cards (highlights, promotions)
  featured: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.large,
    padding: Layout.cardPadding + 4,
    marginBottom: VisualSpacing.large,
    ...EnhancedShadows.strong,
    borderWidth: 2,
    borderColor: Colors.lotusGreen + '20', // 20% opacity
  },
  
  // Minimal cards (background content)
  minimal: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.cardPadding - 4,
    marginBottom: VisualSpacing.small,
    borderWidth: 1,
    borderColor: Colors.border + '40', // 40% opacity
  },
} as const;

// Layout patterns for consistent spacing
export const LayoutPatterns = {
  // Screen container with proper margins
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Layout.screenPadding,
  },
  
  // Section with proper spacing
  section: {
    marginBottom: VisualSpacing.extraLarge,
  },
  
  // Content container with max width
  content: {
    maxWidth: 600, // Optimal reading width
    alignSelf: 'center' as const,
    width: '100%',
  },
  
  // Form layout with consistent spacing
  form: {
    gap: VisualSpacing.medium,
  },
  
  // List layout with proper separators
  list: {
    gap: VisualSpacing.small,
  },
} as const;

// Interactive state styles
export const InteractiveStates = {
  // Default state
  default: {
    opacity: 1.0,
    transform: [{ scale: 1.0 }],
    ...EnhancedShadows.subtle,
  },
  
  // Hover/focus state
  focused: {
    opacity: 1.0,
    transform: [{ scale: 1.02 }],
    ...EnhancedShadows.focus,
  },
  
  // Pressed state
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
    ...EnhancedShadows.medium,
  },
  
  // Disabled state
  disabled: {
    opacity: 0.6,
    transform: [{ scale: 1.0 }],
    shadow: null,
  },
  
  // Loading state
  loading: {
    opacity: 0.8,
    transform: [{ scale: 1.0 }],
    ...EnhancedShadows.subtle,
  },
} as const;

// Icon sizing for visual hierarchy
export const IconSizes = {
  tiny: 12,
  small: 16,
  medium: 20,
  large: 24,
  extraLarge: 32,
  huge: 48,
  hero: 64,
} as const;

// Export utility functions
export const VisualHierarchyUtils = {
  /**
   * Get emphasis level styles
   */
  getEmphasis: (level: keyof typeof EmphasisLevels) => EmphasisLevels[level],
  
  /**
   * Get spacing value
   */
  getSpacing: (size: keyof typeof VisualSpacing) => VisualSpacing[size],
  
  /**
   * Get card pattern styles
   */
  getCardPattern: (pattern: keyof typeof CardPatterns) => CardPatterns[pattern],
  
  /**
   * Get layout pattern styles
   */
  getLayoutPattern: (pattern: keyof typeof LayoutPatterns) => LayoutPatterns[pattern],
  
  /**
   * Get interactive state styles
   */
  getInteractiveState: (state: keyof typeof InteractiveStates) => InteractiveStates[state],
  
  /**
   * Combine multiple visual hierarchy elements
   */
  combineStyles: (...styles: any[]) => Object.assign({}, ...styles),
};