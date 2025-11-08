// 🌿 Care Map - Dynamic Plant Care Recommendations
// Based on Room Location + Season for optimal indoor plant care

import { logger } from './logger';
import {
  RoomModifier,
  DirectionModifier,
  EnhancedCareRecommendation,
  PlacementScore,
  CareWarning,
  WeatherAwareRoomModifier,
  WeatherAwareDirectionModifier,
  WeatherData,
  WeatherContext,
  EnvironmentalContext
} from '../types';
import { plantDatabaseService } from '../services/plantDatabase';
import { WeatherService } from '../services/weather';

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
const translateCareValue = (value: string, type: 'light' | 'placement' | 'watering' | 'humidity', isRTL: boolean) => {
  if (!isRTL) return value;
  
  const translations = {
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

// ============================================
// Phase 15.0: Enhanced Care Recommendation System
// ============================================

/**
 * Room Modifiers - Environmental factors for each room type
 * Considers AC effect, steam, cooking heat, humidity, and evaporation rates
 */
export const ROOM_MODIFIERS: Record<string, RoomModifier> = {
  living_room: {
    room: 'living_room',
    acEffect: true,
    humidityModifier: -15, // AC dries air 15% more
    evaporationRate: 20, // Faster soil drying (20% increase)
    note: 'AC creates drier conditions than normal',
  },
  bedroom: {
    room: 'bedroom',
    acEffect: true,
    humidityModifier: -10, // Moderate AC drying
    evaporationRate: 15, // Moderate soil drying (15% increase)
    note: 'Bedroom AC runs at night, moderate drying',
  },
  kitchen: {
    room: 'kitchen',
    cookingHeat: true,
    humidityModifier: 10, // Steam from cooking adds humidity
    evaporationRate: 25, // Heat accelerates evaporation (25% increase)
    note: 'Cooking heat and steam create variable conditions',
  },
  bathroom: {
    room: 'bathroom',
    steamEffect: true,
    humidityModifier: 25, // High humidity from showers
    evaporationRate: -20, // Humidity slows evaporation (20% decrease)
    note: 'High humidity from showers reduces watering needs',
  },
  balcony: {
    room: 'balcony',
    humidityModifier: -25, // Outdoor air very dry in Cairo
    evaporationRate: 40, // Wind + sun = rapid evaporation (40% increase)
    note: 'Cairo heat and wind dry soil very quickly',
  },
  office: {
    room: 'office',
    acEffect: true,
    humidityModifier: -15, // Office AC maintains dry conditions
    evaporationRate: 20, // Consistent drying (20% increase)
    note: 'Office AC maintains consistent dry conditions',
  },
};

/**
 * Get room modifier for a specific room
 */
export const getRoomModifiers = (room: string): RoomModifier => {
  const modifier = ROOM_MODIFIERS[room];

  if (!modifier) {
    logger.warn(`No room modifiers found for ${room}, using living_room defaults`);
    return ROOM_MODIFIERS.living_room;
  }

  return modifier;
};

/**
 * Direction Modifiers - Light intensity and watering adjustments for each direction × season combination
 * 16 scenarios total: 4 directions × 4 seasons
 */
export const DIRECTION_MODIFIERS: Record<string, DirectionModifier> = {
  // ======================================
  // North Window (consistent gentle light)
  // ======================================
  north_winter: {
    direction: 'north',
    season: 'winter',
    lightIntensity: 'Low',
    wateringAdjustment: 3, // Water 3 days later
    benefit: 'Consistent gentle light',
  },
  north_spring: {
    direction: 'north',
    season: 'spring',
    lightIntensity: 'Low',
    wateringAdjustment: 2, // Water 2 days later
    benefit: 'Stable conditions',
  },
  north_summer: {
    direction: 'north',
    season: 'summer',
    lightIntensity: 'Medium',
    wateringAdjustment: 1, // Water 1 day later
    benefit: 'Protected from harsh sun',
  },
  north_autumn: {
    direction: 'north',
    season: 'autumn',
    lightIntensity: 'Low',
    wateringAdjustment: 2, // Water 2 days later
    benefit: 'Cool and stable',
  },

  // ======================================
  // East Window (gentle morning sun)
  // ======================================
  east_winter: {
    direction: 'east',
    season: 'winter',
    lightIntensity: 'Medium',
    wateringAdjustment: 2, // Water 2 days later
    benefit: 'Gentle morning warmth',
  },
  east_spring: {
    direction: 'east',
    season: 'spring',
    lightIntensity: 'High',
    wateringAdjustment: 0, // Normal watering schedule
    benefit: 'Perfect morning light ✓',
  },
  east_summer: {
    direction: 'east',
    season: 'summer',
    lightIntensity: 'High',
    wateringAdjustment: -1, // Water 1 day earlier
    benefit: 'Morning sun before peak heat',
  },
  east_autumn: {
    direction: 'east',
    season: 'autumn',
    lightIntensity: 'Medium',
    wateringAdjustment: 1, // Water 1 day later
    benefit: 'Balanced conditions',
  },

  // ======================================
  // South Window (intense direct sun)
  // ======================================
  south_winter: {
    direction: 'south',
    season: 'winter',
    lightIntensity: 'High',
    wateringAdjustment: 0, // Normal watering schedule
    benefit: 'Maximum winter light',
  },
  south_spring: {
    direction: 'south',
    season: 'spring',
    lightIntensity: 'Very High',
    wateringAdjustment: -1, // Water 1 day earlier
    warning: '⚠️ Watch for leaf burn',
  },
  south_summer: {
    direction: 'south',
    season: 'summer',
    lightIntensity: 'Very High',
    wateringAdjustment: -2, // Water 2 days earlier
    warning: '⚠️ Direct sun can scorch leaves',
  },
  south_autumn: {
    direction: 'south',
    season: 'autumn',
    lightIntensity: 'High',
    wateringAdjustment: -1, // Water 1 day earlier
    warning: '⚠️ Monitor for heat stress',
  },

  // ======================================
  // West Window (hot afternoon sun)
  // ======================================
  west_winter: {
    direction: 'west',
    season: 'winter',
    lightIntensity: 'Medium',
    wateringAdjustment: 1, // Water 1 day later
    benefit: 'Afternoon warmth',
  },
  west_spring: {
    direction: 'west',
    season: 'spring',
    lightIntensity: 'High',
    wateringAdjustment: -1, // Water 1 day earlier
    warning: '⚠️ Afternoon heat can be intense',
  },
  west_summer: {
    direction: 'west',
    season: 'summer',
    lightIntensity: 'Very High',
    wateringAdjustment: -2, // Water 2 days earlier
    warning: '⚠️ Peak afternoon heat stress',
  },
  west_autumn: {
    direction: 'west',
    season: 'autumn',
    lightIntensity: 'High',
    wateringAdjustment: 0, // Normal watering schedule
    warning: 'Warm afternoons',
  },
};

/**
 * Get direction modifier for a specific direction and season
 */
export const getDirectionModifiers = (direction: string, season: string): DirectionModifier => {
  const key = `${direction}_${season}`;
  const modifier = DIRECTION_MODIFIERS[key];

  if (!modifier) {
    logger.warn(`No direction modifiers found for ${key}, using east_spring defaults`);
    return DIRECTION_MODIFIERS.east_spring; // Safe default with balanced conditions
  }

  return modifier;
};

// ============================================
// WEATHER-AWARE MODIFIERS (Phase 15.0)
// Room and direction modifiers that scale dynamically based on current Cairo weather
// ============================================

/**
 * Weather-Aware Room Modifiers - Dynamic scaling based on temperature
 * AC effects compound in extreme heat, steam effects compete with dry air
 */
export const WEATHER_AWARE_ROOM_MODIFIERS: Record<string, WeatherAwareRoomModifier> = {
  living_room: {
    room: 'living_room',
    getModifiers: (weather: WeatherData) => {
      // AC effect scales with temperature
      if (weather.temperature >= 35) {
        // Summer extreme heat: AC runs constantly at max capacity
        return {
          humidityModifier: -30, // Much drier than baseline (-15%)
          evaporationRate: 35,   // Faster evaporation (+20% baseline)
          note: 'AC running at max capacity in extreme heat creates very dry conditions',
        };
      } else if (weather.temperature >= 25) {
        // Spring/Autumn: AC runs moderately
        return {
          humidityModifier: -15, // Standard AC effect
          evaporationRate: 20,   // Moderate evaporation
          note: 'AC creates moderately dry conditions',
        };
      } else {
        // Winter: AC barely runs
        return {
          humidityModifier: -5,  // Minimal drying
          evaporationRate: 5,    // Slow evaporation
          note: 'AC runs minimally in cool weather, near-normal humidity',
        };
      }
    },
  },

  bedroom: {
    room: 'bedroom',
    getModifiers: (weather: WeatherData) => {
      if (weather.temperature >= 35) {
        return {
          humidityModifier: -25, // AC runs at night + during day
          evaporationRate: 30,
          note: 'Bedroom AC runs continuously in extreme heat',
        };
      } else if (weather.temperature >= 25) {
        return {
          humidityModifier: -10, // Moderate night AC
          evaporationRate: 15,
          note: 'Bedroom AC runs at night, moderate drying',
        };
      } else {
        return {
          humidityModifier: -3,  // Minimal AC use
          evaporationRate: 3,
          note: 'Bedroom AC rarely needed in cool weather',
        };
      }
    },
  },

  kitchen: {
    room: 'kitchen',
    getModifiers: (weather: WeatherData) => {
      if (weather.temperature >= 35) {
        // Extreme heat: Cooking heat compounds outdoor heat
        return {
          humidityModifier: 5,   // Steam helps but outdoor air is very dry
          evaporationRate: 40,   // Heat accelerates evaporation dramatically
          note: 'Cooking heat + outdoor heat creates intense evaporation, steam helps slightly',
        };
      } else if (weather.temperature >= 25) {
        return {
          humidityModifier: 10,  // Steam from cooking adds humidity
          evaporationRate: 25,   // Moderate heat-driven evaporation
          note: 'Cooking heat and steam create variable conditions',
        };
      } else {
        // Cool weather: Steam effect dominates
        return {
          humidityModifier: 15,  // Steam adds more humidity in cool air
          evaporationRate: 15,   // Lower evaporation
          note: 'Cooking steam adds humidity in cool weather',
        };
      }
    },
  },

  bathroom: {
    room: 'bathroom',
    getModifiers: (weather: WeatherData) => {
      // Bathroom steam competes with outdoor air dryness
      if (weather.temperature >= 35 && weather.humidity < 25) {
        // Extreme heat + dry air: Steam can't fully compensate
        return {
          humidityModifier: 10,  // Reduced from +25% (dry outdoor air wins)
          evaporationRate: -10,  // Reduced from -20% (steam still helps)
          note: 'Shower steam helps, but outdoor air is very dry',
        };
      } else if (weather.humidity < 30) {
        // Moderately dry: Steam provides good benefit
        return {
          humidityModifier: 20,  // Good steam effect
          evaporationRate: -15,  // Slows evaporation well
          note: 'Shower steam provides good humidity boost',
        };
      } else {
        // Normal or humid weather: Full steam effect
        return {
          humidityModifier: 25,  // Maximum steam benefit
          evaporationRate: -20,  // Significant evaporation reduction
          note: 'High humidity from showers greatly reduces watering needs',
        };
      }
    },
  },

  balcony: {
    room: 'balcony',
    getModifiers: (weather: WeatherData) => {
      // Balcony conditions directly mirror outdoor weather
      if (weather.temperature >= 38) {
        // Extreme heat: Dangerous evaporation
        return {
          humidityModifier: -40,  // Extremely dry outdoor air
          evaporationRate: 60,    // Rapid soil drying (wind + heat)
          note: 'Cairo summer heat + wind creates extreme drying - check plants twice daily',
        };
      } else if (weather.temperature >= 32) {
        // Hot: High evaporation
        return {
          humidityModifier: -30,  // Very dry outdoor air
          evaporationRate: 45,    // Fast evaporation
          note: 'Cairo heat and wind dry soil very quickly',
        };
      } else if (weather.temperature >= 25) {
        // Warm: Moderate evaporation
        return {
          humidityModifier: -20,  // Dry outdoor air
          evaporationRate: 30,    // Moderate evaporation
          note: 'Outdoor conditions dry soil faster than indoors',
        };
      } else {
        // Cool: Slow evaporation
        return {
          humidityModifier: -10,  // Mild dryness
          evaporationRate: 15,    // Slow evaporation
          note: 'Cool weather reduces outdoor evaporation',
        };
      }
    },
  },

  office: {
    room: 'office',
    getModifiers: (weather: WeatherData) => {
      // Office AC runs consistently during work hours
      if (weather.temperature >= 35) {
        return {
          humidityModifier: -28,  // Constant AC in extreme heat
          evaporationRate: 32,
          note: 'Office AC maintains very dry conditions during extreme heat',
        };
      } else if (weather.temperature >= 25) {
        return {
          humidityModifier: -15,  // Standard office AC
          evaporationRate: 20,
          note: 'Office AC maintains consistent dry conditions',
        };
      } else {
        return {
          humidityModifier: -8,   // Light AC use
          evaporationRate: 10,
          note: 'Office AC runs lightly in cool weather',
        };
      }
    },
  },
};

/**
 * Get weather-aware room modifiers (dynamic scaling based on current weather)
 */
export const getWeatherAwareRoomModifiers = (
  room: string,
  weather: WeatherData
): { humidityModifier: number; evaporationRate: number; note: string } => {
  const modifier = WEATHER_AWARE_ROOM_MODIFIERS[room];

  if (!modifier) {
    logger.warn(`No weather-aware room modifiers found for ${room}, using living_room defaults`);
    return WEATHER_AWARE_ROOM_MODIFIERS.living_room.getModifiers(weather);
  }

  return modifier.getModifiers(weather);
};

/**
 * Weather-Aware Direction Modifiers - Dynamic scaling based on temperature and conditions
 * South window in 38°C is scorching, but gentle in winter
 * 16 scenarios: 4 directions × 4 seasons, each scaling with weather
 */
export const WEATHER_AWARE_DIRECTION_MODIFIERS: Record<string, WeatherAwareDirectionModifier> = {
  // ======================================
  // NORTH WINDOW (Consistent gentle light, least affected by weather)
  // ======================================
  north_winter: {
    direction: 'north',
    season: 'winter',
    getModifiers: (weather: WeatherData) => {
      return {
        lightIntensity: 'Low',
        wateringAdjustment: 3, // Cool weather = slower evaporation
        benefit: 'Consistent gentle light, perfect for low-light plants',
      };
    },
  },
  north_spring: {
    direction: 'north',
    season: 'spring',
    getModifiers: (weather: WeatherData) => {
      return {
        lightIntensity: 'Low',
        wateringAdjustment: 2,
        benefit: 'Stable conditions year-round',
      };
    },
  },
  north_summer: {
    direction: 'north',
    season: 'summer',
    getModifiers: (weather: WeatherData) => {
      return {
        lightIntensity: 'Medium',
        wateringAdjustment: 1,
        benefit: 'Protected from harsh summer sun',
      };
    },
  },
  north_autumn: {
    direction: 'north',
    season: 'autumn',
    getModifiers: (weather: WeatherData) => {
      return {
        lightIntensity: 'Low',
        wateringAdjustment: 2,
        benefit: 'Cool and stable conditions',
      };
    },
  },

  // ======================================
  // EAST WINDOW (Gentle morning sun, moderately weather-affected)
  // ======================================
  east_winter: {
    direction: 'east',
    season: 'winter',
    getModifiers: (weather: WeatherData) => {
      return {
        lightIntensity: 'Medium',
        wateringAdjustment: 2,
        benefit: 'Gentle morning warmth without afternoon heat',
      };
    },
  },
  east_spring: {
    direction: 'east',
    season: 'spring',
    getModifiers: (weather: WeatherData) => {
      return {
        lightIntensity: 'High',
        wateringAdjustment: 0,
        benefit: '✓ Perfect morning light - ideal for most plants',
      };
    },
  },
  east_summer: {
    direction: 'east',
    season: 'summer',
    getModifiers: (weather: WeatherData) => {
      if (weather.temperature >= 38) {
        // Extreme heat: Even morning sun adds stress
        return {
          lightIntensity: 'High',
          wateringAdjustment: -2, // Check more frequently
          warning: '⚠️ Extreme heat: Monitor plants daily even with morning-only sun',
        };
      } else if (weather.temperature >= 32) {
        return {
          lightIntensity: 'High',
          wateringAdjustment: -1,
          benefit: 'Morning sun before peak heat - good choice in summer',
        };
      } else {
        return {
          lightIntensity: 'High',
          wateringAdjustment: 0,
          benefit: 'Gentle morning sun, comfortable temperature',
        };
      }
    },
  },
  east_autumn: {
    direction: 'east',
    season: 'autumn',
    getModifiers: (weather: WeatherData) => {
      return {
        lightIntensity: 'Medium',
        wateringAdjustment: 1,
        benefit: 'Balanced autumn conditions',
      };
    },
  },

  // ======================================
  // SOUTH WINDOW (Most weather-sensitive: Gentle in winter, scorching in summer)
  // ======================================
  south_winter: {
    direction: 'south',
    season: 'winter',
    getModifiers: (weather: WeatherData) => {
      return {
        lightIntensity: 'High',
        wateringAdjustment: 0,
        benefit: '✓ Maximum winter light - excellent for sun-loving plants',
      };
    },
  },
  south_spring: {
    direction: 'south',
    season: 'spring',
    getModifiers: (weather: WeatherData) => {
      if (weather.temperature >= 32) {
        // Warm spring day: South window getting intense
        return {
          lightIntensity: 'Very High',
          wateringAdjustment: -2,
          warning: '⚠️ Warm spring day: South window getting intense, watch for leaf burn',
        };
      } else {
        return {
          lightIntensity: 'Very High',
          wateringAdjustment: -1,
          warning: '⚠️ Watch for leaf burn on sensitive plants',
        };
      }
    },
  },
  south_summer: {
    direction: 'south',
    season: 'summer',
    getModifiers: (weather: WeatherData) => {
      if (weather.temperature >= 38) {
        // EXTREME DANGER: South window in 38°C+
        return {
          lightIntensity: 'Very High',
          wateringAdjustment: -3, // Check every 3 days less than normal
          warning: '🔥 DANGER: South window in extreme heat can scorch leaves. Move plant 5 feet back or use sheer curtain immediately!',
        };
      } else if (weather.temperature >= 35) {
        // Very hot: South window dangerous
        return {
          lightIntensity: 'Very High',
          wateringAdjustment: -2,
          warning: '⚠️ Very hot: Direct south sun can stress plants. Consider moving away from window during peak hours (12-4pm)',
        };
      } else {
        // Hot but manageable
        return {
          lightIntensity: 'Very High',
          wateringAdjustment: -2,
          warning: '⚠️ Direct sun can scorch leaves. Monitor daily for stress signs',
        };
      }
    },
  },
  south_autumn: {
    direction: 'south',
    season: 'autumn',
    getModifiers: (weather: WeatherData) => {
      if (weather.temperature >= 32) {
        return {
          lightIntensity: 'High',
          wateringAdjustment: -1,
          warning: '⚠️ Still warm: Monitor for heat stress',
        };
      } else {
        return {
          lightIntensity: 'High',
          wateringAdjustment: 0,
          benefit: 'Autumn sun is gentler, good for light-loving plants',
        };
      }
    },
  },

  // ======================================
  // WEST WINDOW (Hot afternoon sun, weather-intensified)
  // ======================================
  west_winter: {
    direction: 'west',
    season: 'winter',
    getModifiers: (weather: WeatherData) => {
      return {
        lightIntensity: 'Medium',
        wateringAdjustment: 1,
        benefit: 'Afternoon warmth without intense summer heat',
      };
    },
  },
  west_spring: {
    direction: 'west',
    season: 'spring',
    getModifiers: (weather: WeatherData) => {
      if (weather.temperature >= 30) {
        return {
          lightIntensity: 'High',
          wateringAdjustment: -1,
          warning: '⚠️ Afternoon heat intensifying - monitor plants after 3pm',
        };
      } else {
        return {
          lightIntensity: 'High',
          wateringAdjustment: 0,
          benefit: 'Warm afternoon light, manageable in spring',
        };
      }
    },
  },
  west_summer: {
    direction: 'west',
    season: 'summer',
    getModifiers: (weather: WeatherData) => {
      if (weather.temperature >= 38) {
        // Extreme heat: West window is second-worst after south
        return {
          lightIntensity: 'Very High',
          wateringAdjustment: -3,
          warning: '🔥 DANGER: West window in extreme heat = peak afternoon heat stress. Move plant away from window or use heavy curtains 2-6pm!',
        };
      } else if (weather.temperature >= 35) {
        return {
          lightIntensity: 'Very High',
          wateringAdjustment: -2,
          warning: '⚠️ Very hot afternoons: West window can stress plants. Provide shade 3-6pm',
        };
      } else {
        return {
          lightIntensity: 'Very High',
          wateringAdjustment: -2,
          warning: '⚠️ Peak afternoon heat stress - not ideal for sensitive plants',
        };
      }
    },
  },
  west_autumn: {
    direction: 'west',
    season: 'autumn',
    getModifiers: (weather: WeatherData) => {
      if (weather.temperature >= 30) {
        return {
          lightIntensity: 'High',
          wateringAdjustment: -1,
          warning: 'Still warm afternoons - monitor after 3pm',
        };
      } else {
        return {
          lightIntensity: 'High',
          wateringAdjustment: 0,
          benefit: 'Warm autumn afternoons, less intense than summer',
        };
      }
    },
  },
};

/**
 * Get weather-aware direction modifiers (dynamic scaling based on current weather)
 */
export const getWeatherAwareDirectionModifiers = (
  direction: string,
  season: string,
  weather: WeatherData
): {
  lightIntensity: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  wateringAdjustment: number;
  warning?: string;
  benefit?: string;
} => {
  const key = `${direction}_${season}`;
  const modifier = WEATHER_AWARE_DIRECTION_MODIFIERS[key];

  if (!modifier) {
    logger.warn(`No weather-aware direction modifiers found for ${key}, using east_spring defaults`);
    return WEATHER_AWARE_DIRECTION_MODIFIERS.east_spring.getModifiers(weather);
  }

  return modifier.getModifiers(weather);
};

/**
 * Calculate Placement Score (1-5 stars) based on plant needs vs environmental conditions
 * Considers light tolerance, watering stress, and humidity compatibility
 */
export const calculatePlacementScore = (
  plantLightRequirement: string,
  plantLightTolerance: string[],
  plantHumidity: string,
  plantWateringSchedule: string,
  room: RoomModifier,
  direction: DirectionModifier
): { score: 1 | 2 | 3 | 4 | 5; scoreText: string; stars: string } => {
  let score = 5; // Start with perfect score

  // ======================================
  // Light Compatibility Check
  // ======================================
  const lightIntensity = direction.lightIntensity;

  // Map light requirements to intensity levels
  const lightRequirementMap: Record<string, string[]> = {
    low_light: ['Very Low', 'Low'],
    medium_light: ['Low', 'Medium', 'High'],
    bright_indirect: ['Medium', 'High', 'Very High'],
    bright_direct: ['High', 'Very High'],
  };

  // Check if current light intensity matches plant's requirement or tolerance
  const requiredLights = lightRequirementMap[plantLightRequirement] || ['Medium'];
  const toleratedLights = plantLightTolerance.flatMap(
    (tolerance) => lightRequirementMap[tolerance] || []
  );
  const allAcceptableLights = [...new Set([...requiredLights, ...toleratedLights])];

  if (!allAcceptableLights.includes(lightIntensity)) {
    // Light mismatch - deduct points based on severity
    if (
      (plantLightRequirement === 'low_light' && lightIntensity === 'Very High') ||
      (plantLightRequirement === 'bright_direct' && lightIntensity === 'Very Low')
    ) {
      score -= 2; // Severe mismatch
    } else {
      score -= 1; // Moderate mismatch
    }
  }

  // ======================================
  // Watering Stress Check
  // ======================================
  // High evaporation rate + plants that prefer to dry out = potential stress
  if (room.evaporationRate > 30 && plantWateringSchedule === '100_dry') {
    score -= 1; // Risk of soil drying too quickly
  }

  // Very negative evaporation (bathroom) + plants that prefer drier conditions
  if (room.evaporationRate < -15 && plantWateringSchedule === '100_dry') {
    score -= 1; // Risk of overwatering in humid environment
  }

  // ======================================
  // Humidity Compatibility Check
  // ======================================
  // High humidity plants in dry environments
  if (plantHumidity === 'high' && room.humidityModifier < -15) {
    score -= 1; // Dry air not ideal for humidity-loving plants
  }

  // Low humidity plants in very humid environments
  if (plantHumidity === 'low' && room.humidityModifier > 20) {
    score -= 1; // Too much humidity for desert plants
  }

  // ======================================
  // Ensure score is within 1-5 range
  // ======================================
  score = Math.max(1, Math.min(5, score)) as 1 | 2 | 3 | 4 | 5;

  // Map score to text
  const scoreTextMap: Record<number, string> = {
    1: 'Very Challenging',
    2: 'Challenging',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  const scoreText = scoreTextMap[score];
  const stars = '★'.repeat(score) + '☆'.repeat(5 - score);

  return { score, scoreText, stars };
};

/**
 * Weather-Aware Placement Score Calculator
 * Works with dynamic modifier objects from getWeatherAwareRoomModifiers() and getWeatherAwareDirectionModifiers()
 */
export const calculateWeatherAwarePlacementScore = (
  plantLightRequirement: string,
  plantLightTolerance: string[],
  plantHumidity: string,
  plantWateringSchedule: string,
  roomModifiers: { humidityModifier: number; evaporationRate: number; note: string },
  directionModifiers: {
    lightIntensity: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
    wateringAdjustment: number;
    warning?: string;
    benefit?: string;
  }
): PlacementScore => {
  let score = 5; // Start with perfect score
  const reasons: string[] = [];

  // ======================================
  // Light Compatibility Check
  // ======================================
  const lightIntensity = directionModifiers.lightIntensity;

  // Map light requirements to intensity levels
  const lightRequirementMap: Record<string, string[]> = {
    low_light: ['Very Low', 'Low'],
    medium_light: ['Low', 'Medium', 'High'],
    bright_indirect: ['Medium', 'High', 'Very High'],
    bright_direct: ['High', 'Very High'],
  };

  // Check if current light intensity matches plant's requirement or tolerance
  const requiredLights = lightRequirementMap[plantLightRequirement] || ['Medium'];
  const toleratedLights = plantLightTolerance.flatMap(
    (tolerance) => lightRequirementMap[tolerance] || []
  );
  const allAcceptableLights = [...new Set([...requiredLights, ...toleratedLights])];

  if (!allAcceptableLights.includes(lightIntensity)) {
    // Light mismatch - deduct points based on severity
    if (
      (plantLightRequirement === 'low_light' && lightIntensity === 'Very High') ||
      (plantLightRequirement === 'bright_direct' && lightIntensity === 'Very Low')
    ) {
      score -= 2; // Severe mismatch
      reasons.push(`Light mismatch: Plant needs ${plantLightRequirement} but receives ${lightIntensity}`);
    } else {
      score -= 1; // Moderate mismatch
      reasons.push(`Moderate light mismatch`);
    }
  }

  // ======================================
  // Watering Stress Check (Weather-Aware)
  // ======================================
  // Extreme evaporation rates from weather-aware modifiers
  if (roomModifiers.evaporationRate > 40) {
    // Extreme evaporation (e.g., balcony in 38°C)
    score -= 1;
    reasons.push('Extreme evaporation rate may stress plant');
  } else if (roomModifiers.evaporationRate > 30 && plantWateringSchedule === '100_dry') {
    // High evaporation + plants that prefer to dry out
    score -= 1;
    reasons.push('High evaporation may dry soil too quickly');
  }

  // Very negative evaporation (bathroom) + plants that prefer drier conditions
  if (roomModifiers.evaporationRate < -15 && plantWateringSchedule === '100_dry') {
    score -= 1;
    reasons.push('Humid environment may cause overwatering risk');
  }

  // ======================================
  // Humidity Compatibility Check (Weather-Aware)
  // ======================================
  // More aggressive penalties for extreme humidity mismatches
  if (plantHumidity === 'high' && roomModifiers.humidityModifier < -25) {
    // Extreme dry conditions (e.g., AC in 38°C heat)
    score -= 2;
    reasons.push('Very dry conditions unsuitable for humidity-loving plant');
  } else if (plantHumidity === 'high' && roomModifiers.humidityModifier < -15) {
    score -= 1;
    reasons.push('Dry air not ideal for this plant');
  }

  // Low humidity plants in very humid environments
  if (plantHumidity === 'low' && roomModifiers.humidityModifier > 20) {
    score -= 1;
    reasons.push('Too much humidity for desert/succulent plant');
  }

  // ======================================
  // Direction-Specific Warnings (Weather-Aware)
  // ======================================
  // If direction has a danger warning (🔥), further penalize
  if (directionModifiers.warning?.includes('🔥 DANGER')) {
    score -= 1;
    reasons.push('Extreme heat/light conditions detected');
  }

  // ======================================
  // Ensure score is within 1-5 range
  // ======================================
  score = Math.max(1, Math.min(5, score)) as 1 | 2 | 3 | 4 | 5;

  // Map score to text
  const scoreTextMap: Record<number, string> = {
    1: 'Very Challenging',
    2: 'Challenging',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  const scoreText = scoreTextMap[score];
  const stars = '★'.repeat(score) + '☆'.repeat(5 - score);

  // Log scoring reasoning
  if (reasons.length > 0) {
    logger.info(`Placement scored ${score}/5: ${reasons.join(', ')}`);
  }

  return { score, scoreText, stars };
};

// ============================================
// PERSONALIZED CARE RECOMMENDATION ENGINE (Phase 15.0)
// Main function that combines Database → Weather → Room/Direction
// ============================================

/**
 * Get Personalized Care Recommendations with Weather-Aware Modifiers
 *
 * This is the main function that implements the 3-layer intelligence system:
 * Layer 1: Plant-specific care from database
 * Layer 2: Current weather establishes environmental baseline
 * Layer 3: Room and direction modifiers scale based on weather
 *
 * @param plantId - Plant species ID (e.g., "snake_plant")
 * @param room - Room type (living_room, bedroom, kitchen, bathroom, balcony, office)
 * @param direction - Window direction (north, east, south, west)
 * @param includeWeather - Whether to fetch and apply weather data (default: true)
 * @returns Complete care recommendation with placement score, warnings, and tips
 */
export async function getPersonalizedCareRecommendations(
  plantId: string,
  room: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony' | 'office',
  direction: 'north' | 'east' | 'south' | 'west',
  includeWeather: boolean = true
): Promise<EnhancedCareRecommendation> {

  logger.info(`🌿 Getting personalized care for ${plantId} in ${room} (${direction} window)`);

  // ======================================
  // LAYER 1: Plant-Specific Care from Database
  // ======================================
  const plant = plantDatabaseService.getPlantById(plantId);

  if (!plant) {
    logger.error(`Plant ${plantId} not found in database`);
    throw new Error(`Plant "${plantId}" not found. Please check plant database.`);
  }

  const season = getCurrentSeason();
  logger.info(`Current season: ${season}`);

  // ======================================
  // LAYER 2 & 3: Weather-Aware Environmental Modifiers
  // ======================================
  let weather: WeatherData | null = null;
  let roomModifiers: { humidityModifier: number; evaporationRate: number; note: string };
  let directionModifiers: {
    lightIntensity: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
    wateringAdjustment: number;
    warning?: string;
    benefit?: string;
  };

  // if (includeWeather) {
  //   try {
  //     // Fetch current Cairo weather
  //     weather = await WeatherService.getCurrentWeather();

  //     if (!weather) {
  //       logger.warn('Weather service returned null, using static modifiers');
  //       throw new Error('Weather unavailable');
  //     }

  //     logger.info(`✅ Weather fetched: ${weather.temperature}°C, ${weather.humidity}% humidity`);

  //     // Layer 2: Weather establishes baseline
  //     // Layer 3: Room/Direction modifiers SCALE with weather
  //     roomModifiers = getWeatherAwareRoomModifiers(room, weather);
  //     directionModifiers = getWeatherAwareDirectionModifiers(direction, season, weather);

  //     logger.info(`Weather-aware modifiers applied (AC scaled with ${weather.temperature}°C)`);
  //   } catch (error) {
  //     logger.warn('Weather service unavailable, using static modifiers', error);

  //     // Fallback to static modifiers
  //     const staticRoom = getRoomModifiers(room);
  //     const staticDirection = getDirectionModifiers(direction, season);

  //     roomModifiers = {
  //       humidityModifier: staticRoom.humidityModifier,
  //       evaporationRate: staticRoom.evaporationRate,
  //       note: staticRoom.note
  //     };

  //     directionModifiers = {
  //       lightIntensity: staticDirection.lightIntensity,
  //       wateringAdjustment: staticDirection.wateringAdjustment,
  //       warning: staticDirection.warning,
  //       benefit: staticDirection.benefit
  //     };
  //   }
  // } else {
    // Use static modifiers without weather
    logger.info('Weather integration disabled, using static modifiers');
    const staticRoom = getRoomModifiers(room);
    const staticDirection = getDirectionModifiers(direction, season);

    roomModifiers = {
      humidityModifier: staticRoom.humidityModifier,
      evaporationRate: staticRoom.evaporationRate,
      note: staticRoom.note
    };

    directionModifiers = {
      lightIntensity: staticDirection.lightIntensity,
      wateringAdjustment: staticDirection.wateringAdjustment,
      warning: staticDirection.warning,
      benefit: staticDirection.benefit
    };
  // }

  // ======================================
  // Calculate Placement Score
  // ======================================
  const score = calculateWeatherAwarePlacementScore(
    plant.care.light.requirement,
    plant.care.light.tolerance || [],
    plant.care.humidity,
    plant.care.watering.schedule,
    roomModifiers,
    directionModifiers
  );

  logger.info(`Placement score: ${score.stars} (${score.scoreText})`);

  // ======================================
  // Generate Adjusted Care Recommendations
  // ======================================
  const baseWateringDays = parseInt(plant.care.watering.frequency.split('-')[0]) || 10;
  const adjustedWateringDays = Math.max(
    2, // Minimum 2 days
    baseWateringDays + directionModifiers.wateringAdjustment
  );

  const adjustedWatering = {
    watering: `Water every ${adjustedWateringDays}-${adjustedWateringDays + 4} days (${plant.care.watering.schedule.replaceAll('_', '%')})`,
    wateringFrequency: `Check soil every ${Math.max(2, adjustedWateringDays - 2)} days`,
    placement: directionModifiers.benefit || directionModifiers.warning || `${direction} window in ${room}`,
    humidity: `${plant.care.humidity} humidity preference (current room: ${roomModifiers.humidityModifier > 0 ? 'adds' : 'reduces'} ${Math.abs(roomModifiers.humidityModifier)}% humidity)`,
    reasoning: `Adjusted from base ${baseWateringDays} days by ${directionModifiers.wateringAdjustment} days due to ${directionModifiers.warning ? 'challenging' : 'favorable'} conditions`
  };

  // ======================================
  // Generate Warnings
  // ======================================
  const warnings: CareWarning[] = [];

  // Direction warnings (weather-aware)
  if (directionModifiers.warning) {
    const isDanger = directionModifiers.warning.includes('🔥 DANGER');
    warnings.push({
      type: isDanger ? 'danger' : 'warning',
      message: directionModifiers.warning,
      icon: isDanger ? '🔥' : '⚠️'
    });
  }

  // Room warnings
  if (roomModifiers.evaporationRate > 40) {
    warnings.push({
      type: 'danger',
      message: `Extreme evaporation in ${room}: Check plants twice daily`,
      icon: '💧'
    });
  }

  // Score-based warnings
  if (score.score <= 2) {
    warnings.push({
      type: 'danger',
      message: `This placement is very challenging for ${plant.names.common[0]}. Consider moving to a different location.`,
      icon: '⚠️'
    });
  } else if (score.score === 3) {
    warnings.push({
      type: 'info',
      message: `This placement is acceptable but not ideal. Monitor plant closely for stress.`,
      icon: 'ℹ️'
    });
  }

  // ======================================
  // Generate Tips
  // ======================================
  const tips: string[] = [];

  // Direction benefits
  if (directionModifiers.benefit && !directionModifiers.warning) {
    tips.push(directionModifiers.benefit);
  }

  // Room-specific tips
  tips.push(roomModifiers.note);

  // Weather-specific tips
  if (weather) {
    if (weather.temperature >= 38) {
      tips.push('Extreme heat: Mist plants daily and monitor soil moisture closely');
    } else if (weather.temperature <= 15) {
      tips.push('Cool weather: Reduce watering frequency as plants grow slower');
    }

    if (weather.humidity < 20) {
      tips.push('Very dry air: Consider using a humidifier or pebble tray');
    }
  }

  // Plant-specific care tips (if available in database)
  // Note: Current plant database may not have tips field, this is for future enhancement
  if (plant.care && 'tips' in plant.care && Array.isArray((plant.care as any).tips)) {
    tips.push(...(plant.care as any).tips.slice(0, 2)); // Add up to 2 plant-specific tips
  }

  // ======================================
  // Build Weather Context (if available)
  // ======================================
  const weatherContext: WeatherContext | undefined = weather ? {
    temperature: weather.temperature,
    humidity: weather.humidity,
    condition: weather.condition,
    lastUpdated: weather.lastUpdated,
    impact: `Current ${weather.temperature}°C with ${weather.humidity}% humidity ${weather.temperature >= 35 ? 'increases' : weather.temperature <= 18 ? 'decreases' : 'moderately affects'} watering needs`
  } : undefined;

  // ======================================
  // Build Environmental Context (if weather available)
  // ======================================
  const environmentalContext: EnvironmentalContext | undefined = weather ? {
    weather,
    room: {
      type: room,
      humidityModifier: roomModifiers.humidityModifier,
      evaporationRate: roomModifiers.evaporationRate,
      note: roomModifiers.note
    },
    direction: {
      type: direction,
      season: season as 'winter' | 'spring' | 'summer' | 'autumn',
      lightIntensity: directionModifiers.lightIntensity,
      wateringAdjustment: directionModifiers.wateringAdjustment,
      note: directionModifiers.benefit || directionModifiers.warning || ''
    }
  } : undefined;

  // ======================================
  // Return Complete Care Recommendation
  // ======================================
  const recommendation: EnhancedCareRecommendation = {
    score,
    plant: {
      id: plant.id,
      name: plant.names.common[0],
      scientificName: plant.names.scientific[0],
      baseWatering: `${plant.care.watering.frequency} (${plant.care.watering.schedule})`,
      lightRequirement: plant.care.light.requirement,
      lightTolerance: plant.care.light.tolerance || [],
      humidityPreference: plant.care.humidity
    },
    environment: {
      room,
      direction,
      season,
      roomFactor: roomModifiers.note,
      directionFactor: directionModifiers.warning || directionModifiers.benefit || `${directionModifiers.lightIntensity} light`,
      weatherConditions: weather ? `${weather.temperature}°C, ${weather.humidity}% humidity` : undefined
    },
    adjusted: adjustedWatering,
    warnings,
    tips,
    reasoning: {
      score: `Placement scored ${score.scoreText} (${score.stars}) based on light compatibility, humidity match, and watering stress factors`,
      watering: adjustedWatering.reasoning,
      placement: `${direction} window provides ${directionModifiers.lightIntensity} light. ${roomModifiers.note}`
    },
    weatherContext,
    environmentalContext
  };

  logger.info(`✅ Personalized care recommendation generated successfully`);
  return recommendation;
}