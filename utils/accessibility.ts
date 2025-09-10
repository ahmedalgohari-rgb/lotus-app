/**
 * Accessibility Utilities
 * Helper functions and constants for WCAG 2.1 AA compliance
 */

// WCAG 2.1 AA minimum touch target size (44px)
export const MIN_TOUCH_TARGET_SIZE = 44;

// Accessibility role mappings
export const AccessibilityRoles = {
  button: 'button',
  link: 'link',
  text: 'text',
  image: 'image',
  imagebutton: 'imagebutton',
  header: 'header',
  summary: 'summary',
  list: 'list',
  listitem: 'listitem',
  tab: 'tab',
  tablist: 'tablist',
  search: 'search',
  menu: 'menu',
  menuitem: 'menuitem',
  alert: 'alert',
  combobox: 'combobox',
  progressbar: 'progressbar',
  slider: 'slider',
  switch: 'switch',
  checkbox: 'checkbox',
  radio: 'radio',
} as const;

// Accessibility states
export const AccessibilityStates = {
  disabled: 'disabled',
  selected: 'selected',
  checked: 'checked',
  expanded: 'expanded',
  busy: 'busy',
} as const;

/**
 * Generate accessibility label for plant health status
 */
export const getPlantHealthLabel = (
  healthStatus: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL',
  language: 'en' | 'ar' = 'en'
): string => {
  const labels = {
    en: {
      HEALTHY: 'Plant is healthy',
      NEEDS_ATTENTION: 'Plant needs attention',
      CRITICAL: 'Plant is in critical condition',
    },
    ar: {
      HEALTHY: 'النبات بصحة جيدة',
      NEEDS_ATTENTION: 'النبات يحتاج عناية',
      CRITICAL: 'النبات في حالة حرجة',
    },
  };
  
  return labels[language][healthStatus];
};

/**
 * Generate accessibility label for plant watering status
 */
export const getWateringStatusLabel = (
  nextWateringDate: string | null,
  language: 'en' | 'ar' = 'en'
): string => {
  if (!nextWateringDate) {
    return language === 'ar' ? 'لا يوجد موعد للسقي' : 'No watering schedule';
  }
  
  const nextDate = new Date(nextWateringDate);
  const now = new Date();
  const daysDiff = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) {
    const overdueDays = Math.abs(daysDiff);
    return language === 'ar' 
      ? `متأخر عن موعد السقي ${overdueDays} يوم`
      : `Watering overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`;
  } else if (daysDiff === 0) {
    return language === 'ar' ? 'يحتاج سقي اليوم' : 'Needs watering today';
  } else if (daysDiff === 1) {
    return language === 'ar' ? 'يحتاج سقي غداً' : 'Needs watering tomorrow';
  } else {
    return language === 'ar' 
      ? `يحتاج سقي خلال ${daysDiff} أيام`
      : `Needs watering in ${daysDiff} days`;
  }
};

/**
 * Generate accessibility hint for interactive elements
 */
export const getAccessibilityHint = (
  action: string,
  language: 'en' | 'ar' = 'en'
): string => {
  const hints = {
    en: {
      tap: 'Tap to activate',
      doubleTap: 'Double tap to activate',
      longPress: 'Long press for options',
      swipe: 'Swipe to navigate',
      scan: 'Opens camera to scan plant',
      water: 'Log watering for this plant',
      edit: 'Edit plant information',
      delete: 'Remove plant from collection',
      navigate: 'Navigate to details',
      toggle: 'Toggle setting',
      close: 'Close dialog',
      back: 'Go back to previous screen',
      next: 'Continue to next step',
      skip: 'Skip this step',
    },
    ar: {
      tap: 'انقر للتفعيل',
      doubleTap: 'انقر مرتين للتفعيل',
      longPress: 'اضغط مطولاً للخيارات',
      swipe: 'اسحب للتصفح',
      scan: 'يفتح الكاميرا لمسح النبات',
      water: 'سجل سقي هذا النبات',
      edit: 'تحرير معلومات النبات',
      delete: 'حذف النبات من المجموعة',
      navigate: 'انتقل للتفاصيل',
      toggle: 'تبديل الإعداد',
      close: 'إغلاق الحوار',
      back: 'العودة للشاشة السابقة',
      next: 'المتابعة للخطوة التالية',
      skip: 'تخطي هذه الخطوة',
    },
  };
  
  return hints[language][action] || (language === 'ar' ? 'انقر للتفعيل' : 'Tap to activate');
};

/**
 * Ensure minimum touch target size
 */
export const ensureTouchTarget = (size: number): number => {
  return Math.max(size, MIN_TOUCH_TARGET_SIZE);
};

/**
 * Color contrast utilities
 */
export const ContrastLevels = {
  AA_NORMAL: 4.5,      // WCAG AA for normal text
  AA_LARGE: 3.0,       // WCAG AA for large text (18pt+ or 14pt+ bold)
  AAA_NORMAL: 7.0,     // WCAG AAA for normal text
  AAA_LARGE: 4.5,      // WCAG AAA for large text
} as const;

/**
 * Convert hex color to RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Calculate relative luminance
 */
export const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const srgb = c / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Check if color combination meets WCAG contrast requirements
 */
export const meetsContrastRequirement = (
  color1: string, 
  color2: string, 
  level: keyof typeof ContrastLevels = 'AA_NORMAL'
): boolean => {
  const ratio = getContrastRatio(color1, color2);
  return ratio >= ContrastLevels[level];
};

/**
 * Focus management utilities
 */
export const FocusManager = {
  /**
   * Set focus to element with proper timing
   */
  setFocus: (ref: React.RefObject<any>, delay: number = 100) => {
    setTimeout(() => {
      if (ref.current?.focus) {
        ref.current.focus();
      }
    }, delay);
  },
  
  /**
   * Trap focus within a container
   */
  trapFocus: (containerRef: React.RefObject<any>) => {
    // This would be implemented with actual focus trapping logic
    // For React Native, this involves managing focus order manually
    console.log('Focus trapped in container:', containerRef.current);
  },
  
  /**
   * Restore focus to previous element
   */
  restoreFocus: (previousRef: React.RefObject<any>) => {
    if (previousRef.current?.focus) {
      previousRef.current.focus();
    }
  },
};

/**
 * Screen reader announcements
 */
export const announceToScreenReader = (message: string, language: 'en' | 'ar' = 'en') => {
  // In React Native, this would use AccessibilityInfo.announceForAccessibility
  console.log(`Screen reader announcement (${language}):`, message);
};

/**
 * Semantic roles for common UI patterns
 */
export const SemanticPatterns = {
  card: {
    role: AccessibilityRoles.button,
    accessible: true,
  },
  listItem: {
    role: AccessibilityRoles.listitem,
    accessible: true,
  },
  tab: {
    role: AccessibilityRoles.tab,
    accessible: true,
  },
  dialog: {
    role: AccessibilityRoles.alert,
    accessible: true,
  },
  button: {
    role: AccessibilityRoles.button,
    accessible: true,
  },
} as const;

/**
 * Generate comprehensive accessibility props
 */
export const getAccessibilityProps = (
  label: string,
  hint?: string,
  role?: string,
  state?: { [key: string]: boolean | string }
) => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityRole: role || AccessibilityRoles.button,
  ...state && { accessibilityState: state },
});

export type AccessibilityRole = keyof typeof AccessibilityRoles;
export type AccessibilityState = keyof typeof AccessibilityStates;