import { I18nManager } from 'react-native';
import { useStore } from '../store';

// RTL-aware style utilities
export const useRTL = () => {
  const { isRTL } = useStore();
  return isRTL;
};

// Apply RTL transformations to styles
export const applyRTL = (styles: any, isRTL: boolean) => {
  if (!isRTL) return styles;

  const rtlStyles = { ...styles };

  // Transform directional properties
  if (styles.paddingLeft !== undefined) {
    rtlStyles.paddingRight = styles.paddingLeft;
    delete rtlStyles.paddingLeft;
  }
  
  if (styles.paddingRight !== undefined) {
    rtlStyles.paddingLeft = styles.paddingRight;
    delete rtlStyles.paddingRight;
  }

  if (styles.marginLeft !== undefined) {
    rtlStyles.marginRight = styles.marginLeft;
    delete rtlStyles.marginLeft;
  }
  
  if (styles.marginRight !== undefined) {
    rtlStyles.marginLeft = styles.marginRight;
    delete rtlStyles.marginRight;
  }

  if (styles.left !== undefined) {
    rtlStyles.right = styles.left;
    delete rtlStyles.left;
  }
  
  if (styles.right !== undefined) {
    rtlStyles.left = styles.right;
    delete rtlStyles.right;
  }

  // Transform flexDirection
  if (styles.flexDirection === 'row') {
    rtlStyles.flexDirection = 'row-reverse';
  } else if (styles.flexDirection === 'row-reverse') {
    rtlStyles.flexDirection = 'row';
  }

  // Transform textAlign
  if (styles.textAlign === 'left') {
    rtlStyles.textAlign = 'right';
  } else if (styles.textAlign === 'right') {
    rtlStyles.textAlign = 'left';
  }

  return rtlStyles;
};

// Hook for creating RTL-aware styles
export const useRTLStyles = (styles: any) => {
  const isRTL = useRTL();
  return applyRTL(styles, isRTL);
};

// Direction-aware flexDirection
export const getFlexDirection = (direction: 'row' | 'row-reverse', isRTL: boolean) => {
  if (!isRTL) return direction;
  return direction === 'row' ? 'row-reverse' : 'row';
};

// Direction-aware text alignment
export const getTextAlign = (align: 'left' | 'right' | 'center', isRTL: boolean) => {
  if (!isRTL || align === 'center') return align;
  return align === 'left' ? 'right' : 'left';
};

// Common RTL-aware style patterns
export const rtlStyles = {
  row: (isRTL: boolean) => ({
    flexDirection: getFlexDirection('row', isRTL) as 'row' | 'row-reverse',
  }),
  
  textLeft: (isRTL: boolean) => ({
    textAlign: getTextAlign('left', isRTL) as 'left' | 'right' | 'center',
  }),
  
  textRight: (isRTL: boolean) => ({
    textAlign: getTextAlign('right', isRTL) as 'left' | 'right' | 'center',
  }),
  
  paddingLeft: (value: number, isRTL: boolean) => (
    isRTL ? { paddingRight: value } : { paddingLeft: value }
  ),
  
  paddingRight: (value: number, isRTL: boolean) => (
    isRTL ? { paddingLeft: value } : { paddingRight: value }
  ),
  
  marginLeft: (value: number, isRTL: boolean) => (
    isRTL ? { marginRight: value } : { marginLeft: value }
  ),
  
  marginRight: (value: number, isRTL: boolean) => (
    isRTL ? { marginLeft: value } : { marginRight: value }
  ),
};

// Force RTL for the entire app (call this when language changes)
export const forceRTL = (enable: boolean) => {
  if (I18nManager.isRTL !== enable) {
    I18nManager.forceRTL(enable);
    // Note: In production, this would require an app restart
    // For development, we'll handle it at the component level
  }
};