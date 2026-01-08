/**
 * Weather Integration Module
 *
 * Provides the main personalized care recommendation engine that combines:
 * - Plant-specific care from database (Layer 1)
 * - Current weather conditions (Layer 2)
 * - Room and direction modifiers that scale with weather (Layer 3)
 *
 * This is the primary function used by screens to get complete care recommendations.
 */

import { logger } from '../logger';
import {
  EnhancedCareRecommendation,
  CareWarning,
  WeatherData,
  WeatherContext,
  EnvironmentalContext
} from '../../types';
import { plantDatabaseService } from '../../services/plantDatabase';
import { WeatherService } from '../../services/weather';
import { getCurrentSeason } from '../careMap';
import {
  getRoomModifiers,
  getWeatherAwareRoomModifiers
} from './roomModifiers';
import {
  getDirectionModifiers,
  getWeatherAwareDirectionModifiers
} from './directionModifiers';
import { calculateWeatherAwarePlacementScore } from './placementScoring';

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
  // }
  // FIX: Use season-based modifiers (no API required) for AC seasonal scaling
  // This provides temperature-aware AC behavior based on Egyptian seasons
  logger.info(`Using season-based modifiers for ${season}`);

  // Get base static modifiers
  const staticRoom = getRoomModifiers(room);
  const staticDirection = getDirectionModifiers(direction, season);

  // Apply seasonal scaling to AC rooms (living room, bedroom, office)
  const hasAC = staticRoom.acEffect === true;
  let seasonalHumidityModifier = staticRoom.humidityModifier;
  let seasonalEvaporationRate = staticRoom.evaporationRate;

  if (hasAC) {
    // Scale AC effect based on season (Cairo climate)
    if (season === 'summer') {
      // June-September: Hot weather, AC runs at max capacity
      seasonalHumidityModifier = staticRoom.humidityModifier * 2; // Double AC drying effect
      seasonalEvaporationRate = staticRoom.evaporationRate * 1.75; // Much faster evaporation
      logger.info(`🌞 Summer AC scaling applied: ${room} AC at max (×2 humidity, ×1.75 evaporation)`);
    } else if (season === 'winter') {
      // December-February: Cool weather, AC barely runs
      seasonalHumidityModifier = staticRoom.humidityModifier * 0.33; // Minimal AC effect
      seasonalEvaporationRate = staticRoom.evaporationRate * 0.25; // Much slower evaporation
      logger.info(`❄️ Winter AC scaling applied: ${room} AC minimal (×0.33 humidity, ×0.25 evaporation)`);
    } else {
      // Spring/Autumn: Moderate weather, AC runs normally
      // Use base values (no scaling)
      logger.info(`🍂 Spring/Autumn: ${room} using standard AC settings`);
    }
  }

  roomModifiers = {
    humidityModifier: seasonalHumidityModifier,
    evaporationRate: seasonalEvaporationRate,
    note: hasAC
      ? `${staticRoom.note} (${season === 'summer' ? 'AC at max in summer heat' : season === 'winter' ? 'AC minimal in winter' : 'AC moderate'})`
      : staticRoom.note
  };

  directionModifiers = {
    lightIntensity: staticDirection.lightIntensity,
    wateringAdjustment: staticDirection.wateringAdjustment,
    warning: staticDirection.warning,
    benefit: staticDirection.benefit
  };

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

  // Weather-specific tips (currently disabled as weather API is not in use)
  // if (weather) {
  //   if (weather.temperature >= 38) {
  //     tips.push('Extreme heat: Mist plants daily and monitor soil moisture closely');
  //   } else if (weather.temperature <= 15) {
  //     tips.push('Cool weather: Reduce watering frequency as plants grow slower');
  //   }

  //   if (weather.humidity < 20) {
  //     tips.push('Very dry air: Consider using a humidifier or pebble tray');
  //   }
  // }

  // Plant-specific care tips (if available in database)
  // Note: Current plant database may not have tips field, this is for future enhancement
  if (plant.care && 'tips' in plant.care && Array.isArray((plant.care as any).tips)) {
    tips.push(...(plant.care as any).tips.slice(0, 2)); // Add up to 2 plant-specific tips
  }

  // ======================================
  // Build Weather Context (if available)
  // Currently disabled as weather API is not in use
  // ======================================
  const weatherContext: WeatherContext | undefined = undefined;
  // weather ? {
  //   temperature: weather.temperature,
  //   humidity: weather.humidity,
  //   condition: weather.condition,
  //   lastUpdated: weather.lastUpdated,
  //   impact: `Current ${weather.temperature}°C with ${weather.humidity}% humidity ${weather.temperature >= 35 ? 'increases' : weather.temperature <= 18 ? 'decreases' : 'moderately affects'} watering needs`
  // } : undefined;

  // ======================================
  // Build Environmental Context (if weather available)
  // Currently disabled as weather API is not in use
  // ======================================
  const environmentalContext: EnvironmentalContext | undefined = undefined;
  // weather ? {
  //   weather,
  //   room: {
  //     type: room,
  //     humidityModifier: roomModifiers.humidityModifier,
  //     evaporationRate: roomModifiers.evaporationRate,
  //     note: roomModifiers.note
  //   },
  //   direction: {
  //     type: direction,
  //     season: season as 'winter' | 'spring' | 'summer' | 'autumn',
  //     lightIntensity: directionModifiers.lightIntensity,
  //     wateringAdjustment: directionModifiers.wateringAdjustment,
  //     note: directionModifiers.benefit || directionModifiers.warning || ''
  //   }
  // } : undefined;

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
      weatherConditions: undefined // weather ? `${weather.temperature}°C, ${weather.humidity}% humidity` : undefined
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
