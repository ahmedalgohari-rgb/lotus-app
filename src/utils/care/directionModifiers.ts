/**
 * Direction Modifiers Module
 *
 * Manages window direction-based care adjustments including:
 * - Light intensity by direction and season
 * - Watering frequency adjustments
 * - Weather-aware direction modifiers that scale with temperature
 * - Direction-specific warnings and benefits
 */

import { logger } from '../logger';
import {
  DirectionModifier,
  WeatherAwareDirectionModifier,
  WeatherData
} from '../../types';

/**
 * Static Direction Modifiers - Light intensity and watering adjustments for each direction × season combination
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
      const uvIndex = weather.uvIndex || 10;
      // UV ≥ 11 (Aswan, Sharm) = extreme burn risk even at moderate temps
      if (weather.temperature >= 38 || (weather.temperature >= 33 && uvIndex >= 11)) {
        return {
          lightIntensity: 'Very High',
          wateringAdjustment: -3,
          warning: `🔥 DANGER: South window in extreme heat (UV ${uvIndex}) can scorch leaves. Move plant back or use sheer curtain immediately!`,
        };
      } else if (weather.temperature >= 35 || uvIndex >= 10) {
        return {
          lightIntensity: 'Very High',
          wateringAdjustment: -2,
          warning: `⚠️ Very hot (UV ${uvIndex}): Direct south sun can stress plants. Consider moving away from window during peak hours (12-4pm)`,
        };
      } else {
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
      const uvIndex = weather.uvIndex || 10;
      if (weather.temperature >= 38 || (weather.temperature >= 33 && uvIndex >= 11)) {
        return {
          lightIntensity: 'Very High',
          wateringAdjustment: -3,
          warning: `🔥 DANGER: West window in extreme heat (UV ${uvIndex}) = peak afternoon stress. Move plant away or use heavy curtains 2-6pm!`,
        };
      } else if (weather.temperature >= 35 || uvIndex >= 10) {
        return {
          lightIntensity: 'Very High',
          wateringAdjustment: -2,
          warning: `⚠️ Very hot afternoons (UV ${uvIndex}): West window can stress plants. Provide shade 3-6pm`,
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
