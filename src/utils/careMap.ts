// 🌿 Care Map - Dynamic Plant Care Recommendations
// Based on Room Location + Season for optimal indoor plant care

import { logger } from './logger';

// Re-export all types and functions from the new modular structure
// This maintains backward compatibility with existing imports
export {
  // Room Modifiers
  ROOM_MODIFIERS,
  getRoomModifiers,
  WEATHER_AWARE_ROOM_MODIFIERS,
  getWeatherAwareRoomModifiers,
} from './care/roomModifiers';

export {
  // Direction Modifiers
  DIRECTION_MODIFIERS,
  getDirectionModifiers,
  WEATHER_AWARE_DIRECTION_MODIFIERS,
  getWeatherAwareDirectionModifiers,
} from './care/directionModifiers';

export {
  // Placement Scoring
  calculatePlacementScore,
  calculateWeatherAwarePlacementScore,
} from './care/placementScoring';

export {
  // Weather Integration (main function)
  getPersonalizedCareRecommendations,
} from './care/weatherIntegration';

// ============================================
// Legacy Care Matrix and Helper Functions
// These functions are kept in careMap.ts for backward compatibility
// ============================================

export interface CareRecommendation {
  light: string;
  placement: string;
  watering: string;
  humidity: string;
}

export interface CareMapData {
  [key: string]: CareRecommendation;
}

// Comprehensive Care Matrix - Room + Season combinations
const CARE_MATRIX: CareMapData = {
  // Living Room combinations
  'living_room_winter': {
    light: 'needs bright indirect light throughout the day',
    placement: 'your window',
    watering: 'water lightly to moderately when soil feels dry',
    humidity: 'keep at medium humidity levels',
  },
  'living_room_spring': {
    light: 'thrives with bright indirect light',
    placement: 'your window',
    watering: 'water moderately when top soil is dry',
    humidity: 'maintain medium humidity',
  },
  'living_room_summer': {
    light: 'prefers bright indirect light, avoid direct sun',
    placement: 'your window',
    watering: 'check daily and water when needed',
    humidity: 'keep humidity at medium levels',
  },
  'living_room_autumn': {
    light: 'enjoys bright indirect light',
    placement: 'your window',
    watering: 'water moderately as growth slows',
    humidity: 'maintain medium humidity',
  },

  // Bedroom combinations
  'bedroom_winter': {
    light: 'tolerates low to medium indirect light well',
    placement: 'your window',
    watering: 'water lightly when soil surface is dry',
    humidity: 'prefers lower humidity levels',
  },
  'bedroom_spring': {
    light: 'does well with low to medium indirect light',
    placement: 'your window',
    watering: 'water lightly to moderately when needed',
    humidity: 'keep humidity on the lower side',
  },
  'bedroom_summer': {
    light: 'needs protection from direct summer sun',
    placement: 'your window',
    watering: 'check daily but avoid overwatering',
    humidity: 'maintain low humidity',
  },
  'bedroom_autumn': {
    light: 'adapts to lower light conditions',
    placement: 'your window',
    watering: 'reduce watering as temperatures cool',
    humidity: 'keep humidity low',
  },

  // Kitchen combinations
  'kitchen_winter': {
    light: 'thrives with artificial light and gentle natural light',
    placement: 'your window away from cooking heat',
    watering: 'water lightly, humidity from cooking helps',
    humidity: 'benefits from natural cooking humidity',
  },
  'kitchen_spring': {
    light: 'does well with kitchen lighting and window light',
    placement: 'your window but away from stove',
    watering: 'water moderately, kitchen humidity is helpful',
    humidity: 'enjoys the higher humidity from cooking',
  },
  'kitchen_summer': {
    light: 'needs protection from cooking heat and direct sun',
    placement: 'your window',
    watering: 'water regularly, heat can dry soil quickly',
    humidity: 'loves the steam and humidity from cooking',
  },
  'kitchen_autumn': {
    light: 'adapts well to kitchen conditions',
    placement: 'your window',
    watering: 'moderate watering with good drainage',
    humidity: 'benefits from natural kitchen moisture',
  },

  // Bathroom combinations
  'bathroom_winter': {
    light: 'thrives in low light and artificial bathroom lighting',
    placement: 'away from direct window but near light source',
    watering: 'water sparingly, high humidity reduces need',
    humidity: 'loves the steam and high humidity from showers',
  },
  'bathroom_spring': {
    light: 'does well with ambient bathroom light',
    placement: 'near window but protected from direct sun',
    watering: 'water lightly, bathroom humidity helps',
    humidity: 'perfect environment with natural bathroom steam',
  },
  'bathroom_summer': {
    light: 'prefers artificial light over harsh window light',
    placement: 'away from hot windows',
    watering: 'monitor carefully, humidity can mask soil dryness',
    humidity: 'ideal high humidity environment',
  },
  'bathroom_autumn': {
    light: 'comfortable with low natural and artificial light',
    placement: 'stable spot away from temperature changes',
    watering: 'reduce watering, high humidity compensates',
    humidity: 'excellent natural humidity from daily use',
  },

  // Balcony combinations
  'balcony_winter': {
    light: 'enjoys direct sunlight and bright outdoor conditions',
    placement: 'protected sunny spot',
    watering: 'water moderately, outdoor air can be drying',
    humidity: 'needs extra attention due to dry outdoor air',
  },
  'balcony_spring': {
    light: 'loves the bright spring sunshine',
    placement: 'sunny area of balcony',
    watering: 'water frequently as growth accelerates',
    humidity: 'may need misting due to outdoor conditions',
  },
  'balcony_summer': {
    light: 'needs protection from intense afternoon sun',
    placement: 'covered or shaded area',
    watering: 'check daily, Cairo heat dries soil quickly',
    humidity: 'requires frequent misting in dry summer air',
  },
  'balcony_autumn': {
    light: 'perfect conditions with gentle autumn sun',
    placement: 'sunny spot as temperatures cool',
    watering: 'water frequently while still warm',
    humidity: 'monitor for dryness as humidity drops',
  },
};

// Helper function to translate care values based on language
const translateCareValue = (value: string, type: 'light' | 'placement' | 'watering' | 'humidity', isRTL: boolean): string => {
  if (!isRTL) return value;

  const translations: Record<'light' | 'placement' | 'watering' | 'humidity', Record<string, string>> = {
    light: {
      'Bright Indirect': 'ضوء ساطع غير مباشر',
      'Low–Medium Indirect': 'ضوء خفيف - متوسط غير مباشر',
      'Low Indirect / Artificial': 'ضوء خفيف غير مباشر / صناعي',
      'Low Light / Artificial': 'ضوء خفيف / صناعي',
      'Direct Sun / Bright': 'شمس مباشرة / ضوء ساطع',
    },
    placement: {
      'South Window': 'شباك جنوبي',
      'South / East Window': 'شباك جنوبي / شرقي',
      'North / Shaded Window': 'شباك شمالي / مظلل',
      'East Window': 'شباك شرقي',
      'NE / Shaded Window': 'شباك شمال شرق / مظلل',
      'East / Indirect Window': 'شباك شرقي / غير مباشر',
      'Indirect East': 'شرق غير مباشر',
      'Shaded / NE Window': 'شباك مظلل / شمال شرق',
      'South Window / Open': 'شباك جنوبي / مفتوح',
      'East / South Window': 'شباك شرقي / جنوبي',
      'Shaded North / Covered': 'شمال مظلل / مغطى',
    },
    watering: {
      'Light': 'ري خفيف',
      'Light–Moderate': 'ري خفيف - متوسط',
      'Moderate': 'ري معتدل',
      'Moderate–Daily Check': 'ري معتدل - فحص يومي',
      'Frequent': 'ري متكرر',
      'Daily Check': 'فحص يومي',
    },
    humidity: {
      'Low': 'رطوبة منخفضة',
      'Low–Medium': 'رطوبة منخفضة - متوسطة',
      'Medium': 'رطوبة متوسطة',
      'Medium–High (cooking)': 'رطوبة متوسطة - عالية (طبخ)',
      'High': 'رطوبة عالية',
      'High (steam)': 'رطوبة عالية (بخار)',
      'Low–Medium (outdoor dry air)': 'رطوبة منخفضة - متوسطة (هواء خارجي جاف)',
      'Low (harsh dry air)': 'رطوبة منخفضة (هواء جاف قاسي)',
    },
  };

  return translations[type][value] || value;
};

// Helper function to determine current season
export const getCurrentSeason = (): string => {
  const month = new Date().getMonth(); // 0-11

  // Egyptian seasons (Cairo climate)
  if (month >= 11 || month <= 1) return 'winter'; // Dec, Jan, Feb
  if (month >= 2 && month <= 4) return 'spring'; // Mar, Apr, May
  if (month >= 5 && month <= 8) return 'summer'; // Jun, Jul, Aug, Sep
  return 'autumn'; // Oct, Nov
};

// Main function to get care recommendations
export const getCareRecommendations = (
  room: string,
  windowDirection: string,
  season: string = getCurrentSeason()
): CareRecommendation => {
  const key = `${room}_${season}`;
  let recommendation = CARE_MATRIX[key];

  if (!recommendation) {
    // Fallback to living room spring as default
    logger.warn(`No care recommendations found for ${room} + ${season}, using default`);
    recommendation = CARE_MATRIX['living_room_spring'];
  }

  // Adjust placement based on window direction and season
  const adjustedPlacement = getAdjustedPlacement(room, windowDirection, season);

  return {
    ...recommendation,
    placement: adjustedPlacement,
  };
};

// Function to adjust placement based on window direction and season
const getAdjustedPlacement = (room: string, windowDirection: string, season: string): string => {
  // Summer: Prefer north/shaded to avoid harsh sun
  if (season === 'summer') {
    if (windowDirection === 'south' || windowDirection === 'west') {
      return room === 'balcony' ? 'covered area away from direct sun' : 'north-facing window or shaded area';
    }
    return 'near your window but avoid direct afternoon sun';
  }

  // Winter: Prefer south for maximum light
  if (season === 'winter') {
    if (windowDirection === 'south') {
      return 'directly by your south window for maximum winter light';
    }
    if (windowDirection === 'north') {
      return 'as close to your north window as possible';
    }
    return `close to your ${windowDirection} window`;
  }

  // Spring/Autumn: Most directions work well
  if (windowDirection === 'east') {
    return 'by your east window for gentle morning light';
  }
  if (windowDirection === 'west') {
    return 'near your west window but watch for afternoon heat';
  }
  if (windowDirection === 'south') {
    return 'by your south window with some light filtering';
  }

  return `near your ${windowDirection} window`;
};

// Function to get translated care recommendations based on current language
export const getCareRecommendationTranslated = (
  recommendation: CareRecommendation,
  isRTL: boolean
): CareRecommendation => {
  return {
    light: translateCareValue(recommendation.light, 'light', isRTL),
    placement: translateCareValue(recommendation.placement, 'placement', isRTL),
    watering: translateCareValue(recommendation.watering, 'watering', isRTL),
    humidity: translateCareValue(recommendation.humidity, 'humidity', isRTL),
  };
};

// Function to get all available seasons
export const getSeasons = () => ['winter', 'spring', 'summer', 'autumn'];

// Function to get season display name based on current language
export const getSeasonDisplayName = (season: string, isRTL: boolean): string => {
  const seasonNames = {
    winter: isRTL ? 'الشتاء' : 'Winter',
    spring: isRTL ? 'الربيع' : 'Spring',
    summer: isRTL ? 'الصيف' : 'Summer',
    autumn: isRTL ? 'الخريف' : 'Autumn',
  };

  return seasonNames[season as keyof typeof seasonNames] || season;
};
