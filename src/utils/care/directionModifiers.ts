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
  // North never receives direct sun in the Northern Hemisphere — physical fact.
  // ======================================
  north_winter: {
    direction: 'north',
    season: 'winter',
    lightIntensity: 'Low',
    wateringAdjustment: 3, // Water 3 days later
    directSunHours: 0,
    benefit: 'Consistent gentle light',
  },
  north_spring: {
    direction: 'north',
    season: 'spring',
    lightIntensity: 'Low',
    wateringAdjustment: 2, // Water 2 days later
    directSunHours: 0,
    benefit: 'Stable conditions',
  },
  north_summer: {
    direction: 'north',
    season: 'summer',
    lightIntensity: 'Medium',
    wateringAdjustment: 1, // Water 1 day later
    directSunHours: 0,
    benefit: 'Protected from harsh sun',
  },
  north_autumn: {
    direction: 'north',
    season: 'autumn',
    lightIntensity: 'Low',
    wateringAdjustment: 2, // Water 2 days later
    directSunHours: 0,
    benefit: 'Cool and stable',
  },

  // ======================================
  // East Window (gentle morning sun) — symmetric with west at equinoxes
  // ======================================
  east_winter: {
    direction: 'east',
    season: 'winter',
    lightIntensity: 'Medium',
    wateringAdjustment: 2,
    directSunHours: 4,
    benefit: 'Gentle morning warmth',
  },
  east_spring: {
    direction: 'east',
    season: 'spring',
    lightIntensity: 'High',
    wateringAdjustment: 0,
    directSunHours: 5,
    benefit: 'Perfect morning light ✓',
  },
  east_summer: {
    direction: 'east',
    season: 'summer',
    lightIntensity: 'High',
    wateringAdjustment: -1,
    directSunHours: 5,
    benefit: 'Morning sun before peak heat',
  },
  east_autumn: {
    direction: 'east',
    season: 'autumn',
    lightIntensity: 'Medium',
    wateringAdjustment: 1,
    directSunHours: 4,
    benefit: 'Balanced conditions',
  },

  // ======================================
  // South Window — peak hours in winter (low solar arc), least in summer
  // (sun directly overhead, briefly hits south wall)
  // ======================================
  south_winter: {
    direction: 'south',
    season: 'winter',
    lightIntensity: 'High',
    wateringAdjustment: 0,
    directSunHours: 6,
    benefit: 'Maximum winter light',
  },
  south_spring: {
    direction: 'south',
    season: 'spring',
    lightIntensity: 'Very High',
    wateringAdjustment: -1,
    directSunHours: 4,
    warning: '⚠️ Watch for leaf burn',
  },
  south_summer: {
    direction: 'south',
    season: 'summer',
    lightIntensity: 'Very High',
    wateringAdjustment: -2,
    directSunHours: 3,
    warning: '⚠️ Direct sun can scorch leaves',
  },
  south_autumn: {
    direction: 'south',
    season: 'autumn',
    lightIntensity: 'High',
    wateringAdjustment: -1,
    directSunHours: 5,
    warning: '⚠️ Monitor for heat stress',
  },

  // ======================================
  // West Window — peaks in summer (long, hot afternoon, low-angle penetration)
  // ======================================
  west_winter: {
    direction: 'west',
    season: 'winter',
    lightIntensity: 'Medium',
    wateringAdjustment: 1,
    directSunHours: 4,
    benefit: 'Afternoon warmth',
  },
  west_spring: {
    direction: 'west',
    season: 'spring',
    lightIntensity: 'High',
    wateringAdjustment: -1,
    directSunHours: 5,
    warning: '⚠️ Afternoon heat can be intense',
  },
  west_summer: {
    direction: 'west',
    season: 'summer',
    lightIntensity: 'Very High',
    // West summer is harsher than south summer in Cairo: low-angle penetration
    // deep into the room + peak afternoon heat stacks evaporative stress.
    wateringAdjustment: -3,
    directSunHours: 6,
    warning: '🔥 DANGER: Hot afternoon sun penetrates deep into room — leaf scorch and heat stress risk',
  },
  west_autumn: {
    direction: 'west',
    season: 'autumn',
    lightIntensity: 'High',
    wateringAdjustment: 0,
    directSunHours: 4,
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

// ──────────────────────────────────────────────────────────────────────────
// Latitude scaling
// ──────────────────────────────────────────────────────────────────────────

const INTENSITY_LEVELS: DirectionModifier['lightIntensity'][] =
  ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

function shiftIntensity(
  current: DirectionModifier['lightIntensity'],
  shift: number
): DirectionModifier['lightIntensity'] {
  const idx = INTENSITY_LEVELS.indexOf(current);
  const newIdx = Math.max(0, Math.min(INTENSITY_LEVELS.length - 1, idx + shift));
  return INTENSITY_LEVELS[newIdx];
}

/**
 * Adjust direction modifier for the user's latitude.
 *
 * Cairo (~30°N) is the baseline (no shift). Higher latitudes (Berlin, Stockholm)
 * get less intense sun; lower latitudes (Khartoum) get more intense sun.
 * Southern Hemisphere flips N↔S so the equator-facing wall behaves like
 * Northern "south".
 */
export function scaleDirectionForLatitude(
  modifier: DirectionModifier,
  lat: number
): DirectionModifier {
  let result: DirectionModifier = { ...modifier };

  // Hemisphere flip: in S Hemisphere, "south" is equator-facing (= Northern "south")
  if (lat < 0) {
    if (modifier.direction === 'north') {
      const swapped = DIRECTION_MODIFIERS[`south_${modifier.season}`];
      if (swapped) result = { ...swapped, direction: 'north', season: modifier.season };
    } else if (modifier.direction === 'south') {
      const swapped = DIRECTION_MODIFIERS[`north_${modifier.season}`];
      if (swapped) result = { ...swapped, direction: 'south', season: modifier.season };
    }
  }

  // Intensity scaling by distance from 30° baseline
  const absLat = Math.abs(lat);
  const distFromBaseline = absLat - 30;
  let shift = 0;
  if (distFromBaseline >= 35) shift = -2;        // Oslo, Stockholm (~65°)
  else if (distFromBaseline >= 15) shift = -1;   // Berlin, Paris, London (~45-52°)
  else if (distFromBaseline <= -15) shift = +1;  // Khartoum, equator-ish (~15°)

  if (shift !== 0) {
    result.lightIntensity = shiftIntensity(result.lightIntensity, shift);
  }

  return result;
}

/**
 * Approximate direct-sun hours for a (direction, season) at the given latitude.
 * North windows always return 0 (Northern Hemisphere physics, flipped for South).
 */
export function getDirectSunHoursForLatitude(
  direction: 'north' | 'east' | 'south' | 'west',
  season: string,
  lat: number = 30
): number {
  // Hemisphere flip
  let effectiveDirection = direction;
  if (lat < 0) {
    if (direction === 'north') effectiveDirection = 'south';
    else if (direction === 'south') effectiveDirection = 'north';
  }
  const key = `${effectiveDirection}_${season}`;
  const base = DIRECTION_MODIFIERS[key];
  if (!base) return 0;
  return base.directSunHours;
}

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
      // West summer is harsher than south summer in Cairo: low-angle penetration
      // deep into the room + peak afternoon heat.
      if (weather.temperature >= 38 || (weather.temperature >= 33 && uvIndex >= 11)) {
        return {
          lightIntensity: 'Very High',
          wateringAdjustment: -3,
          warning: `🔥 DANGER: West window in extreme heat (UV ${uvIndex}) = peak afternoon stress. Move plant away or use heavy curtains 2-6pm!`,
        };
      } else if (weather.temperature >= 35 || uvIndex >= 10) {
        return {
          lightIntensity: 'Very High',
          wateringAdjustment: -3,
          warning: `🔥 DANGER: Very hot afternoons (UV ${uvIndex}): hot afternoon sun penetrates deep into room — leaf scorch risk. Provide shade 3-6pm`,
        };
      } else {
        return {
          lightIntensity: 'Very High',
          wateringAdjustment: -3,
          warning: '🔥 DANGER: Hot afternoon sun penetrates deep into room — leaf scorch and heat stress risk',
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
 * Get weather-aware direction modifiers (dynamic scaling based on current weather).
 *
 * @param lat - Optional user latitude. If provided, scales intensity by distance
 *              from the 30°N baseline and flips N↔S in the Southern Hemisphere.
 *              Defaults to Cairo (30°N) → no scaling.
 *
 * Always returns `directSunHours` (injected from the static table) so callers
 * can show "Plant needs ☀☀ / Window gives ☀☀☀" comparisons and tip cards.
 */
export const getWeatherAwareDirectionModifiers = (
  direction: string,
  season: string,
  weather: WeatherData,
  lat?: number
): {
  lightIntensity: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  wateringAdjustment: number;
  directSunHours: number;
  warning?: string;
  benefit?: string;
} => {
  const key = `${direction}_${season}`;
  const modifier = WEATHER_AWARE_DIRECTION_MODIFIERS[key];

  const base = modifier
    ? modifier.getModifiers(weather)
    : (() => {
        logger.warn(`No weather-aware direction modifiers found for ${key}, using east_spring defaults`);
        return WEATHER_AWARE_DIRECTION_MODIFIERS.east_spring.getModifiers(weather);
      })();

  // Inject directSunHours from the static physical table (latitude-aware).
  const directSunHours = getDirectSunHoursForLatitude(
    direction as 'north' | 'east' | 'south' | 'west',
    season,
    lat ?? 30
  );

  let result = {
    ...base,
    directSunHours,
  };

  // Apply latitude intensity scaling if user is far from Cairo baseline.
  if (lat !== undefined && lat !== 30) {
    const staticBase = DIRECTION_MODIFIERS[key];
    if (staticBase) {
      const scaled = scaleDirectionForLatitude(staticBase, lat);
      // Only the intensity is latitude-sensitive; watering/warnings stay
      // weather-derived. Trust the larger of (scaled static intensity,
      // weather-aware intensity) when scaling makes things gentler — the
      // weather-derived warning still applies physically.
      // For high latitudes (negative shift), the scaled value is the right cap.
      // For low latitudes (positive shift), bump the weather-aware value up.
      result.lightIntensity = scaled.lightIntensity;
    }
  }

  return result;
};
