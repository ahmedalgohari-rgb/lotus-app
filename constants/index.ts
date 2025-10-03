// App Constants

export const COLORS = {
  primary: '#2D5F3F', // Lotus Green
  secondary: '#4A90A4', // Nile Blue
  background: '#F7F3E9', // Cairo Sand
  white: '#FFFFFF',
  text: '#2C2C2C',
  textSecondary: '#6B6B6B',
  success: '#52C41A',
  warning: '#FAAD14',
  error: '#FF4D4F',
  border: '#E8E8E8',
};

export const PLANT_LOCATIONS = [
  { value: 'living_room', label: 'Living Room', labelAr: 'غرفة المعيشة' },
  { value: 'bedroom', label: 'Bedroom', labelAr: 'غرفة النوم' },
  { value: 'kitchen', label: 'Kitchen', labelAr: 'المطبخ' },
  { value: 'bathroom', label: 'Bathroom', labelAr: 'الحمام' },
  { value: 'balcony', label: 'Balcony', labelAr: 'الشرفة' },
] as const;

export const WINDOW_DIRECTIONS = [
  { value: 'north', label: 'North', labelAr: 'شمال', emoji: '⬆️' },
  { value: 'east', label: 'East', labelAr: 'شرق', emoji: '➡️' },
  { value: 'south', label: 'South', labelAr: 'جنوب', emoji: '⬇️' },
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

export const CACHE_KEYS = {
  USER_PLANTS: 'user_plants',
  PLANT_SPECIES: 'plant_species',
  USER_PROFILE: 'user_profile',
} as const;