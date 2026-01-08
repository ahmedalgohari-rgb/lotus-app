/**
 * Placement Scoring Module
 *
 * Calculates placement scores (1-5 stars) based on:
 * - Light compatibility (plant requirements vs. window direction)
 * - Humidity compatibility (plant preferences vs. room conditions)
 * - Watering stress factors (evaporation rates vs. plant needs)
 * - Weather-aware scoring with dynamic adjustments
 */

import { logger } from '../logger';
import {
  RoomModifier,
  DirectionModifier,
  PlacementScore
} from '../../types';

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
  const finalScore = Math.max(1, Math.min(5, score)) as 1 | 2 | 3 | 4 | 5;

  // Map score to text
  const scoreTextMap: Record<number, 'Very Challenging' | 'Challenging' | 'Good' | 'Very Good' | 'Excellent'> = {
    1: 'Very Challenging',
    2: 'Challenging',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  const scoreText = scoreTextMap[finalScore];
  const stars = '★'.repeat(finalScore) + '☆'.repeat(5 - finalScore);

  return { score: finalScore, scoreText, stars };
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
  // Light Compatibility Check (ENHANCED for Window Direction USP)
  // ======================================
  const lightIntensity = directionModifiers.lightIntensity;

  // Define OPTIMAL, GOOD, ACCEPTABLE, POOR, and UNSUITABLE light levels for each plant type
  const lightPreferenceMap: Record<string, {
    optimal: string[];      // Perfect match = 5 stars
    good: string[];         // Good match = 4 stars
    acceptable: string[];   // Acceptable = 3 stars
    poor: string[];         // Poor = 2 stars
    // Anything else = 1 star (unsuitable)
  }> = {
    low_light: {
      optimal: ['Very Low', 'Low'],
      good: ['Medium'],
      acceptable: [],
      poor: ['High'],
    },
    medium_light: {
      optimal: ['Medium'],
      good: ['Low', 'High'],
      acceptable: ['Very Low'],
      poor: [],
    },
    bright_indirect: {
      optimal: ['High'],              // 5 stars - Perfect bright indirect (south/east windows)
      good: ['Medium'],                // 4 stars - Adequate light (filtered, central rooms)
      acceptable: ['Very High', 'Low'], // 3 stars - Too bright or too dim (direct sun or dark corners)
      poor: ['Very Low'],              // 2 stars - Too dark (closets, bathrooms without windows)
    },
    bright_direct: {
      optimal: ['Very High'],          // 5 stars - Full direct sun (balcony, south window)
      good: ['High'],                  // 4 stars - Bright light (east window)
      acceptable: ['Medium'],          // 3 stars - Moderate light (struggling)
      poor: ['Low', 'Very Low'],       // 2 stars - Too dark (will not thrive)
    },
  };

  const preferences = lightPreferenceMap[plantLightRequirement] || lightPreferenceMap.medium_light;

  // Award points based on how well the light matches plant's preference
  if (preferences.optimal.includes(lightIntensity)) {
    // Perfect match - no deduction, keep score at 5
    reasons.push(`✓ Optimal light: ${lightIntensity} perfect for ${plantLightRequirement}`);
  } else if (preferences.good.includes(lightIntensity)) {
    score -= 1; // Good match = 4 stars
    reasons.push(`Good light match: ${lightIntensity} works well for ${plantLightRequirement}`);
  } else if (preferences.acceptable.includes(lightIntensity)) {
    score -= 2; // Acceptable = 3 stars
    reasons.push(`Acceptable light: ${lightIntensity} is okay for ${plantLightRequirement}`);
  } else if (preferences.poor.includes(lightIntensity)) {
    score -= 3; // Poor match = 2 stars
    reasons.push(`⚠ Poor light match: ${lightIntensity} not ideal for ${plantLightRequirement}`);
  } else {
    score -= 4; // Unsuitable = 1 star
    reasons.push(`❌ Unsuitable light: ${lightIntensity} incompatible with ${plantLightRequirement}`);
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
  // Humidity Compatibility Check (Comprehensive - ALL plant types)
  // ======================================
  // Define humidity preference ranges for low/medium/high plants
  const humidityPreferenceMap: Record<string, {
    optimal: [number, number];   // [min, max] room humidity modifier for perfect match
    good: [number, number];      // [min, max] for good match
    poor: [number, number];      // [min, max] for poor match
  }> = {
    low: {
      optimal: [-30, -15],  // Dry rooms perfect for succulents/cacti (balcony, AC rooms, office)
      good: [-10, 5],       // Moderately dry rooms acceptable
      poor: [15, 30]        // Humid rooms bad (kitchen, bathroom)
    },
    medium: {
      optimal: [-10, 10],   // Moderate humidity rooms perfect (kitchen, bedroom)
      good: [-20, 20],      // Slightly dry or humid acceptable (living room, office)
      poor: [-30, 30]       // Extreme humidity bad (bathroom, balcony in summer)
    },
    high: {
      optimal: [10, 30],    // Humid rooms perfect for ferns/tropicals (kitchen, bathroom)
      good: [-5, 10],       // Moderate rooms acceptable
      poor: [-25, -15]      // Very dry rooms bad (AC rooms, office, balcony)
    }
  };

  // Apply humidity scoring for ALL plant types (low, medium, high)
  const roomHumidity = roomModifiers.humidityModifier;
  const humidityPrefs = humidityPreferenceMap[plantHumidity] || humidityPreferenceMap.medium;

  if (roomHumidity >= humidityPrefs.optimal[0] && roomHumidity <= humidityPrefs.optimal[1]) {
    // Perfect match - no deduction
    reasons.push(`✓ Optimal humidity: Room (${roomHumidity >= 0 ? '+' : ''}${roomHumidity}%) perfect for ${plantHumidity} humidity plant`);
  } else if (roomHumidity >= humidityPrefs.good[0] && roomHumidity <= humidityPrefs.good[1]) {
    // Good match - minor deduction
    score -= 1;
    reasons.push(`Good humidity: Room (${roomHumidity >= 0 ? '+' : ''}${roomHumidity}%) works for ${plantHumidity} humidity plant`);
  } else {
    // Poor/extreme mismatch - major penalty
    const isExtreme = Math.abs(roomHumidity) >= 25;
    score -= isExtreme ? 2 : 2;  // FIX: Changed from 1.5 to 2 (integer only)
    reasons.push(`⚠ ${isExtreme ? 'Poor' : 'Acceptable'} humidity: Room ${roomHumidity >= 0 ? 'too humid' : 'too dry'} for ${plantHumidity} humidity plant`);
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
  // Ensure score is within 1-5 range (and round to integer)
  // ======================================
  const finalScore = Math.round(Math.max(1, Math.min(5, score))) as 1 | 2 | 3 | 4 | 5;

  // Map score to text
  const scoreTextMap: Record<number, 'Very Challenging' | 'Challenging' | 'Good' | 'Very Good' | 'Excellent'> = {
    1: 'Very Challenging',
    2: 'Challenging',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  const scoreText = scoreTextMap[finalScore];
  const stars = '★'.repeat(finalScore) + '☆'.repeat(5 - finalScore);

  // Log scoring reasoning
  if (reasons.length > 0) {
    logger.info(`Placement scored ${finalScore}/5: ${reasons.join(', ')}`);
  }

  return { score: finalScore, scoreText, stars };
};
