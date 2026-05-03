// App Constants

export const COLORS = {
  primary: '#2D5F3F', // Lotus Green
  secondary: '#4A90A4', // Nile Blue
  background: '#F7F3E9', // Cairo Sand
  white: '#FFFFFF',
  black: '#000000',
  text: '#2C2C2C',
  textSecondary: '#6B6B6B',
  lightGray: '#F5F5F5',
  success: '#52C41A',
  warning: '#FAAD14',
  error: '#FF4D4F',
  border: '#E8E8E8',
  shadow: '#000000',
  warmSand: '#D4C5B0',
};

/**
 * Score-to-gradient mapping for the placement rating hero card.
 * Shared by AddPlantScreen and EditPlantScreen.
 */
export function getScoreGradient(score: number): [string, string] {
  switch (score) {
    case 5: return ['#D9F7BE', '#52C41A'];
    case 4: return ['#FEF3C7', '#F59E0B'];
    case 3: return ['#FEF3C7', '#F59E0B'];
    case 2: return ['#FED7AA', '#F97316'];
    case 1: return ['#FEE2E2', '#EF4444'];
    default: return ['#F3F4F6', '#D1D5DB'];
  }
}

export const PLANT_LOCATIONS = [
  { value: 'living_room', label: 'Living Room', labelAr: 'أوضة المعيشة' },
  { value: 'bedroom', label: 'Bedroom', labelAr: 'أوضة النوم' },
  { value: 'kitchen', label: 'Kitchen', labelAr: 'المطبخ' },
  { value: 'bathroom', label: 'Bathroom', labelAr: 'الحمام' },
  { value: 'balcony', label: 'Balcony', labelAr: 'البلكونة' },
  { value: 'office', label: 'Office', labelAr: 'المكتب' },
] as const;

export const WINDOW_DIRECTIONS = [
  { value: 'north', label: 'North', labelAr: 'بحري', emoji: '⬆️' }, // Egyptian: bahri (north)
  { value: 'east', label: 'East', labelAr: 'شرق', emoji: '➡️' },
  { value: 'south', label: 'South', labelAr: 'قبلي', emoji: '⬇️' }, // Egyptian: qibli (south)
  { value: 'west', label: 'West', labelAr: 'غرب', emoji: '⬅️' },
] as const;

export const CARE_EVENT_TYPES = [
  { value: 'water', label: 'Water', labelAr: 'سقي', emoji: '💧' },
  { value: 'fertilize', label: 'Fertilize', labelAr: 'تسميد', emoji: '🌱' },
  { value: 'prune', label: 'Prune', labelAr: 'تقليم', emoji: '✂️' },
  { value: 'repot', label: 'Repot', labelAr: 'إعادة زراعة', emoji: '🪴' },
] as const;

export const HEALTH_STATUS = [
  { value: 'healthy', label: 'Healthy', labelAr: 'صحية', color: COLORS.success },
  { value: 'needs_attention', label: 'Needs Attention', labelAr: 'تحتاج عناية', color: COLORS.warning },
  { value: 'critical', label: 'Critical', labelAr: 'حالة حرجة', color: COLORS.error },
] as const;

export const API_ENDPOINTS = {
  PLANTNET: 'https://my-api.plantnet.org/v2/identify',
} as const;

export const IMAGE_CONFIG = {
  MAX_SIZE: 500 * 1024, // 500KB
  QUALITY: 0.7,
  WIDTH: 800,
  FORMAT: 'jpeg',
} as const;

export const SEASONS = [
  { value: 'winter', label: 'Winter', labelAr: 'الشتاء', emoji: '❄️' },
  { value: 'spring', label: 'Spring', labelAr: 'الربيع', emoji: '🌸' },
  { value: 'summer', label: 'Summer', labelAr: 'الصيف', emoji: '☀️' },
  { value: 'autumn', label: 'Autumn', labelAr: 'الخريف', emoji: '🍂' },
] as const;

export const CARE_CATEGORIES = [
  { value: 'light', label: 'Light', labelAr: 'إضاءة', emoji: '💡' },
  { value: 'placement', label: 'Placement', labelAr: 'الموقع', emoji: '📍' },
  { value: 'watering', label: 'Watering', labelAr: 'ري', emoji: '💧' },
  { value: 'humidity', label: 'Humidity', labelAr: 'رطوبة', emoji: '💨' },
] as const;

export const CACHE_KEYS = {
  USER_PLANTS: 'user_plants',
  PLANT_SPECIES: 'plant_species',
  USER_PROFILE: 'user_profile',
} as const;

// Golden Ratio Design System
export {
  PHI,
  PHI_INVERSE,
  FIBONACCI,
  TYPOGRAPHY,
  LAYOUT_RATIO,
  GOLDEN_RECTANGLES,
  ELEMENT_SIZES,
  applyGoldenRatio,
  splitByGoldenRatio,
  getNextFibonacci,
  getPreviousFibonacci,
} from './goldenRatio';