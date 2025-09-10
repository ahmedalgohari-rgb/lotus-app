/**
 * Lotus App Spacing System
 * Based on 8px grid system from HTML mockup
 */

export const Spacing = {
  // Base unit: 8px
  xs: 4,   // 0.5 * base
  sm: 8,   // 1 * base
  md: 12,  // 1.5 * base  
  lg: 16,  // 2 * base
  xl: 20,  // 2.5 * base
  '2xl': 24, // 3 * base
  '3xl': 32, // 4 * base
  '4xl': 40, // 5 * base
  '5xl': 48, // 6 * base
  '6xl': 56, // 7 * base
  '7xl': 64, // 8 * base
} as const;

// Layout-specific spacing values from mockup
export const Layout = {
  // Base spacing units from Spacing (commonly used)
  xs: 4,   // 0.5 * base
  sm: 8,   // 1 * base
  md: 12,  // 1.5 * base  
  lg: 16,  // 2 * base
  xl: 20,  // 2.5 * base
  '2xl': 24, // 3 * base
  '3xl': 32, // 4 * base
  '4xl': 40, // 5 * base
  
  // Screen padding (from HTML mockup: 20px)
  screenPadding: 20,
  screenPaddingHorizontal: 20,
  screenPaddingVertical: 20,
  
  // Card spacing
  cardPadding: 12,      // Plant card internal padding
  cardMargin: 16,       // Gap between cards
  cardGap: 16,          // Grid gap
  
  // Section spacing
  sectionSpacing: 24,   // Space between sections
  componentSpacing: 12, // Space between related components
  
  // Navigation
  bottomTabHeight: 80,  // Including safe area
  headerHeight: 56,     // Standard header height
  statusBarHeight: 44,  // Status bar space
  
  // Button dimensions
  buttonHeight: 52,         // Primary button height
  buttonHeightMedium: 48,   // Medium button height
  buttonHeightSmall: 40,    // Small button height
  buttonRadius: 26,         // Fully rounded (height/2)
  buttonRadiusMedium: 12,   // OAuth buttons, secondary buttons
  buttonRadiusSmall: 8,     // Small button radius
  
  // Input dimensions  
  inputHeight: 48,
  inputRadius: 12,
  
  // Card dimensions
  cardRadius: 16,
  cardRadiusSmall: 12,
  
  // Border radius (commonly used)
  borderRadius: 12,
  
  // Plant specific
  plantImageHeight: 140,    // Grid view
  plantImageHeightLarge: 200, // Detail view
  
  // Camera
  cameraFrameSize: 280,     // Camera overlay frame
  cameraCornerSize: 40,     // Corner indicators
  captureButtonSize: 72,    // Capture button
  captureButtonInner: 56,   // Inner circle
  
  // Compass
  compassSize: 200,         // Direction selector
  compassDirectionSize: 40, // Direction buttons
  compassCenterSize: 60,    // Center icon
  
  // Floating Action Button
  fabSize: 60,
  fabBottomOffset: 100,     // From bottom of screen
  fabRightOffset: 20,       // From right edge
  
  // Lists and grids
  listItemSpacing: 16,
  gridGap: 16,
  
  // Modal and overlay
  modalPadding: 20,
  overlayRadius: 20,
  
  // Divider
  dividerThickness: 1,
  dividerSpacing: 20,
} as const;

// Border radius values
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  full: 9999, // For fully rounded elements
} as const;

// Shadow/Elevation values
export const Shadow = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

// Type definitions
export type SpacingKey = keyof typeof Spacing;
export type LayoutKey = keyof typeof Layout;
export type BorderRadiusKey = keyof typeof BorderRadius;
export type ShadowKey = keyof typeof Shadow;