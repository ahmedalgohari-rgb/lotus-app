/**
 * Comprehensive Lotus Design System
 * Professional design tokens, patterns, and component guidelines
 */
import { Platform } from 'react-native';
import { Colors } from './colors';
import { Layout } from './spacing';

// ==========================================
// COMPONENT PATTERNS
// ==========================================

export const ComponentPatterns = {
  // Primary action buttons (plant-related actions)
  primaryAction: {
    backgroundColor: Colors.lotusGreen,
    borderRadius: Layout.buttonRadiusMedium,
    height: Layout.buttonHeight,
    paddingHorizontal: Layout.lg,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  // Secondary action buttons
  secondaryAction: {
    backgroundColor: Colors.pureWhite,
    borderRadius: Layout.buttonRadiusMedium,
    borderWidth: 1,
    borderColor: Colors.lotusGreen,
    height: Layout.buttonHeight,
    paddingHorizontal: Layout.lg,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  // OAuth buttons (brand-compliant)
  oauthButton: {
    height: Layout.buttonHeight,
    borderRadius: Layout.buttonHeight / 2,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginVertical: Layout.xs,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  // Input fields
  inputField: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.pureWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.buttonRadiusSmall,
    paddingHorizontal: Layout.md,
    fontSize: 16,
    color: Colors.textPrimary,
  },

  // Card containers
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.cardRadius,
    padding: Layout.cardPadding,
    marginBottom: Layout.cardMargin,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Plant identification frame
  cameraFrame: {
    borderWidth: 2,
    borderColor: Colors.lotusGreen,
    borderRadius: Layout.sm,
    opacity: 0.8,
  },

  // Navigation tabs
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? Layout.bottomTabHeight : 60,
    paddingTop: Layout.xs,
    paddingBottom: Platform.OS === 'ios' ? 24 : Layout.xs,
  },
};

// ==========================================
// ICON SYSTEM
// ==========================================

export const IconSystem = {
  tabs: {
    home: { library: 'Ionicons', name: 'home' },
    scan: { library: 'MaterialIcons', name: 'center-focus-strong' },
    plants: { library: 'MaterialIcons', name: 'local-florist' },
    profile: { library: 'Ionicons', name: 'person' },
  },
  camera: {
    back: { library: 'Ionicons', name: 'chevron-back' },
    flash: { library: 'Ionicons', name: 'flash' },
    gallery: { library: 'Ionicons', name: 'images' },
    tips: { library: 'Ionicons', name: 'help-circle' },
    capture: { library: 'MaterialIcons', name: 'camera-alt' },
  },
  plants: {
    add: { library: 'Ionicons', name: 'add' },
    water: { library: 'MaterialIcons', name: 'opacity' },
    care: { library: 'MaterialIcons', name: 'eco' },
    health: { library: 'MaterialIcons', name: 'favorite' },
  },
  actions: {
    edit: { library: 'Ionicons', name: 'create-outline' },
    delete: { library: 'Ionicons', name: 'trash-outline' },
    settings: { library: 'Ionicons', name: 'settings-outline' },
    language: { library: 'Ionicons', name: 'language-outline' },
  },
};

// ==========================================
// BRAND GUIDELINES
// ==========================================

export const BrandGuidelines = {
  logo: {
    sizes: {
      small: 32,
      medium: 64,
      large: 96,
      hero: 128,
    },
    variants: {
      default: ['#A8E6CF', '#7FD3C3', '#6BB6FF'],
      light: ['#E3F2FD', '#A8E6CF', '#7FD3C3'],
      dark: ['#1A4A3A', '#2D5F3F', '#4A90A4'],
    },
    usage: {
      primary: 'Use default variant for main app screens',
      light: 'Use light variant on dark backgrounds',
      dark: 'Use dark variant on light backgrounds or overlays',
    },
  },
  
  gradients: {
    primary: Colors.primaryGradient, // Lotus green gradient
    secondary: Colors.secondaryGradient, // Nile blue gradient
    surface: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,1)'],
    overlay: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)'],
  },

  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
  },
};

// ==========================================
// ACCESSIBILITY GUIDELINES
// ==========================================

export const AccessibilityGuidelines = {
  touchTargets: {
    minimum: 44, // iOS/Android minimum
    preferred: Layout.buttonHeight, // Our standard
  },
  
  colors: {
    contrast: {
      normal: 4.5, // WCAG AA
      large: 3.0,  // WCAG AA for large text
    },
    validated: {
      // These color combinations meet WCAG AA standards
      primaryOnLight: { text: Colors.pureWhite, background: Colors.lotusGreen },
      darkOnLight: { text: Colors.textPrimary, background: Colors.surface },
      lightOnDark: { text: Colors.pureWhite, background: Colors.textPrimary },
    },
  },

  rtl: {
    supported: true,
    textAlign: 'auto', // Use 'left' | 'right' | 'center' | 'auto'
    layoutDirection: 'locale', // Automatic RTL detection
  },

  semanticColors: {
    success: '#52C41A',
    warning: '#FAAD14',
    error: '#FF4D4F',
    info: Colors.nileBlue,
  },
};

// ==========================================
// ANIMATION GUIDELINES
// ==========================================

export const AnimationGuidelines = {
  durations: {
    fast: 150,
    normal: 300,
    slow: 500,
    entrance: 800,
  },
  
  easing: {
    standard: [0.4, 0.0, 0.2, 1], // Material Design standard
    accelerate: [0.4, 0.0, 1, 1],
    decelerate: [0.0, 0.0, 0.2, 1],
    sharp: [0.4, 0.0, 0.6, 1],
  },

  patterns: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
      duration: 300,
    },
    slideUp: {
      from: { transform: [{ translateY: 50 }] },
      to: { transform: [{ translateY: 0 }] },
      duration: 400,
    },
    scaleIn: {
      from: { transform: [{ scale: 0.8 }], opacity: 0 },
      to: { transform: [{ scale: 1 }], opacity: 1 },
      duration: 300,
    },
  },
};

// ==========================================
// LAYOUT PATTERNS
// ==========================================

export const LayoutPatterns = {
  screen: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Layout.statusBarHeight,
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  bottomSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Layout.overlayRadius,
    borderTopRightRadius: Layout.overlayRadius,
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Layout.xl,
  },

  fab: {
    position: 'absolute' as const,
    bottom: Layout.fabBottomOffset,
    right: Layout.fabRightOffset,
    width: Layout.fabSize,
    height: Layout.fabSize,
    borderRadius: Layout.fabSize / 2,
    backgroundColor: Colors.lotusGreen,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    ...BrandGuidelines.shadows.lg,
  },

  list: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Layout.fabBottomOffset + 20, // Space for FAB
  },
};

// ==========================================
// USAGE GUIDELINES
// ==========================================

export const UsageGuidelines = {
  colors: {
    primary: 'Use lotusGreen for plant-related actions and primary CTAs',
    secondary: 'Use nileBlue for secondary actions and links',
    surface: 'Use surface for card backgrounds and elevated content',
    background: 'Use background for main screen backgrounds',
  },

  typography: {
    hierarchy: 'Follow typography scale for consistent text hierarchy',
    arabic: 'Use arabic-specific styles for RTL content',
    emphasis: 'Use fontWeight for emphasis, avoid all-caps except for buttons',
  },

  spacing: {
    consistency: 'Use Layout constants for consistent spacing',
    rhythm: 'Maintain vertical rhythm with consistent line heights',
    grid: 'All spacing values are based on 8px grid system',
  },

  components: {
    buttons: 'Use ComponentPatterns.primaryAction for main actions',
    cards: 'Use ComponentPatterns.card for content containers',
    inputs: 'Use ComponentPatterns.inputField for form inputs',
  },

  icons: {
    consistency: 'Use IconSystem for consistent iconography',
    size: 'Standard sizes: 16, 20, 24, 32px',
    color: 'Match icon color to text color for consistency',
  },
};

// Export everything as a unified design system
export const LotusDesignSystem = {
  ComponentPatterns,
  IconSystem,
  BrandGuidelines,
  AccessibilityGuidelines,
  AnimationGuidelines,
  LayoutPatterns,
  UsageGuidelines,
};