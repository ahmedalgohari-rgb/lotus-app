/**
 * Room Modifiers Module
 *
 * Manages room-based environmental care adjustments including:
 * - AC effects on humidity and evaporation
 * - Bathroom steam effects
 * - Kitchen cooking heat and steam
 * - Balcony outdoor conditions
 * - Office climate control
 */

import { logger } from '../logger';
import {
  RoomModifier,
  WeatherAwareRoomModifier,
  WeatherData
} from '../../types';

/**
 * Static Room Modifiers - Environmental factors for each room type
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
