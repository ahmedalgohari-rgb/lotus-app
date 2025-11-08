/**
 * Golden Ratio Design System for Lotus App
 *
 * The golden ratio (φ ≈ 1.618) is a mathematical proportion found throughout nature
 * that creates aesthetically pleasing and harmonious designs. This file defines
 * our design system based on:
 *
 * 1. Fibonacci Sequence for spacing (each number is the sum of the previous two)
 * 2. Golden Ratio for layout proportions (61.8% / 38.2% splits)
 * 3. Modular scale for typography (each size ≈ 1.618× the previous)
 */

// The golden ratio constant
export const PHI = 1.618;

// Inverse of golden ratio (for minor sections)
export const PHI_INVERSE = 0.618;

/**
 * Fibonacci Spacing Scale
 * Use these values for margins, padding, gaps, and other spacing needs.
 * Each value is the sum of the previous two, creating natural visual rhythm.
 */
export const FIBONACCI = {
  XXS: 3,   // Extra extra small spacing
  XS: 5,    // Extra small spacing
  SM: 8,    // Small spacing
  MD: 13,   // Medium spacing (default for most gaps)
  LG: 21,   // Large spacing (section margins)
  XL: 34,   // Extra large spacing (major sections)
  XXL: 55,  // Extra extra large spacing (screen sections)
  XXXL: 89, // Major divisions
  HUGE: 144, // Largest structural elements
} as const;

/**
 * Golden Ratio Typography Scale
 * Each font size is approximately 1.618× the previous size.
 * This creates a harmonious visual hierarchy.
 */
export const TYPOGRAPHY = {
  XXS: 10,  // Tiny text (captions, metadata)
  XS: 12,   // Extra small (helper text)
  SM: 14,   // Small (secondary text)
  BASE: 16, // Base size (body text, inputs)
  MD: 18,   // Medium (subheadings)
  LG: 21,   // Large (section titles)
  XL: 26,   // Extra large (page titles)
  XXL: 34,  // Extra extra large (hero text)
  XXXL: 42, // Major headlines
  HUGE: 55, // Display text
} as const;

/**
 * Layout Proportions
 * Use these ratios for dividing screen space harmoniously.
 *
 * Example: For a 1000px container
 * - MAJOR section = 618px (61.8%)
 * - MINOR section = 382px (38.2%)
 */
export const LAYOUT_RATIO = {
  MAJOR: 0.618,  // 61.8% - Primary content area
  MINOR: 0.382,  // 38.2% - Secondary content area
  FULL: 1.0,     // 100% - Full width/height
} as const;

/**
 * Golden Rectangle Dimensions
 * Pre-calculated dimensions that maintain golden ratio proportions.
 * Useful for cards, images, and containers.
 */
export const GOLDEN_RECTANGLES = {
  // Small rectangles (width × height)
  SMALL: {
    width: 89,
    height: 55,
  },
  // Medium rectangles
  MEDIUM: {
    width: 144,
    height: 89,
  },
  // Large rectangles
  LARGE: {
    width: 233,
    height: 144,
  },
  // Extra large rectangles
  XLARGE: {
    width: 377,
    height: 233,
  },
} as const;

/**
 * Standard UI Element Sizes
 * Common component sizes based on Fibonacci numbers.
 */
export const ELEMENT_SIZES = {
  // Button heights
  BUTTON_SM: FIBONACCI.XL,      // 34px - Small buttons
  BUTTON_MD: FIBONACCI.XXL,     // 55px - Standard buttons
  BUTTON_LG: FIBONACCI.XXXL,    // 89px - Large buttons

  // Input heights
  INPUT_SM: FIBONACCI.XL,       // 34px - Compact inputs
  INPUT_MD: FIBONACCI.XXL,      // 55px - Standard inputs
  INPUT_LG: FIBONACCI.XXXL,     // 89px - Large inputs

  // Icon sizes
  ICON_XS: FIBONACCI.MD,        // 13px - Tiny icons
  ICON_SM: FIBONACCI.LG,        // 21px - Small icons
  ICON_MD: FIBONACCI.XL,        // 34px - Standard icons
  ICON_LG: FIBONACCI.XXL,       // 55px - Large icons
  ICON_XL: FIBONACCI.XXXL,      // 89px - Extra large icons

  // Avatar/Image sizes
  AVATAR_SM: FIBONACCI.XXL,     // 55px - Small avatars
  AVATAR_MD: FIBONACCI.XXXL,    // 89px - Medium avatars
  AVATAR_LG: FIBONACCI.HUGE,    // 144px - Large avatars

  // Border radius (for rounded corners)
  RADIUS_SM: FIBONACCI.SM,      // 8px - Subtle rounding
  RADIUS_MD: FIBONACCI.MD,      // 13px - Standard rounding
  RADIUS_LG: FIBONACCI.LG,      // 21px - Pronounced rounding
  RADIUS_XL: FIBONACCI.XL,      // 34px - Extra rounded
} as const;

/**
 * Helper function to calculate a dimension based on golden ratio
 * @param size The base size
 * @param ratio The ratio to apply (default: PHI)
 * @returns The calculated size rounded to nearest integer
 */
export const applyGoldenRatio = (size: number, ratio: number = PHI): number => {
  return Math.round(size * ratio);
};

/**
 * Helper function to split a container into major and minor sections
 * @param totalSize Total size of the container (width or height)
 * @returns Object with major and minor section sizes
 */
export const splitByGoldenRatio = (totalSize: number) => {
  return {
    major: Math.round(totalSize * LAYOUT_RATIO.MAJOR),
    minor: Math.round(totalSize * LAYOUT_RATIO.MINOR),
  };
};

/**
 * Get the next size up in the Fibonacci sequence
 * @param currentSize Current Fibonacci value
 * @returns Next Fibonacci value or the same if at max
 */
export const getNextFibonacci = (currentSize: number): number => {
  const fibValues = Object.values(FIBONACCI);
  const currentIndex = fibValues.indexOf(currentSize);
  if (currentIndex === -1 || currentIndex === fibValues.length - 1) {
    return currentSize;
  }
  return fibValues[currentIndex + 1];
};

/**
 * Get the previous size down in the Fibonacci sequence
 * @param currentSize Current Fibonacci value
 * @returns Previous Fibonacci value or the same if at min
 */
export const getPreviousFibonacci = (currentSize: number): number => {
  const fibValues = Object.values(FIBONACCI);
  const currentIndex = fibValues.indexOf(currentSize);
  if (currentIndex <= 0) {
    return currentSize;
  }
  return fibValues[currentIndex - 1];
};
