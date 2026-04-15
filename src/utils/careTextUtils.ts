/**
 * Care Text Utilities
 *
 * Shared helper functions for parsing and translating plant care text.
 * Used by PlantDetailScreen, AddPlantScreen, and other care-related components.
 */

import { TFunction } from 'i18next';

/**
 * Extract maximum watering days from text like "Water every 12-16 days"
 *
 * @param wateringText - Text containing watering interval
 * @returns Maximum days from the range, or 7 as default
 *
 * @example
 * extractMaxWateringDays("Water every 12-16 days") // returns 16
 * extractMaxWateringDays("Water every 14 days") // returns 14
 * extractMaxWateringDays("Keep soil moist") // returns 7 (default)
 */
export function extractMaxWateringDays(wateringText: string): number {
  if (!wateringText) return 7;

  // Match patterns like "12-16 days" or "14 days"
  const rangeMatch = wateringText.match(/(\d+)-(\d+)\s*days?/i);
  if (rangeMatch) {
    return parseInt(rangeMatch[2], 10);
  }

  const singleMatch = wateringText.match(/(\d+)\s*days?/i);
  if (singleMatch) {
    return parseInt(singleMatch[1], 10);
  }

  return 7;
}

/**
 * Translate care tip: "Water every 11-15 days (60%dry)"
 *
 * @param tip - Raw care tip text
 * @param t - i18next translation function
 * @returns Translated tip or original if pattern not matched
 */
export function translateWateringTip(tip: string, t: TFunction): string {
  if (!tip) return tip;

  // Pattern: "Water every 11-15 days (60%dry)" or "Water every 14 days (75% dry)"
  const match = tip.match(/water every (\d+)-(\d+) days \((\d+)%\s*dry\)/i);
  if (match) {
    const [, minDays, maxDays, percentage] = match;
    return t('care.waterEveryDays', {
      minDays,
      maxDays,
      percentage
    });
  }

  return tip;
}

/**
 * Translate: "Check soil every 9 days"
 *
 * @param tip - Raw care tip text
 * @param t - i18next translation function
 * @returns Translated tip or original if pattern not matched
 */
export function translateCheckSoilTip(tip: string, t: TFunction): string {
  if (!tip) return tip;

  const match = tip.match(/check soil every (\d+) days?/i);
  if (match) {
    const days = match[1];
    return t('care.checkSoilDays', { days });
  }

  return tip;
}

/**
 * Translate seasonal tips: "Maximum winter light", "Afternoon warmth"
 *
 * @param tip - Raw seasonal tip text
 * @param t - i18next translation function
 * @returns Translated tip or original if no mapping found
 */
export function translateSeasonalTip(tip: string, t: TFunction): string {
  if (!tip) return tip;
  const tipLower = tip.toLowerCase();

  if (tipLower.includes('afternoon warmth') || tipLower.includes('afternoon sun')) {
    return t('care.afternoonWarmth');
  }
  if (tipLower.includes('maximum winter light') || tipLower.includes('winter light')) {
    return t('care.maximumWinterLight');
  }
  if (tipLower.includes('morning light')) {
    return t('care.morningLight');
  }

  return tip;
}

/**
 * Extract check soil interval from text like "Check soil every 8 days"
 *
 * @param checkSoilText - Text containing soil check interval
 * @param fallbackWateringText - Optional watering text to derive soil check from (watering days - 2)
 * @returns Number of days for soil check interval
 *
 * @example
 * extractCheckSoilDays("Check soil every 8 days") // returns 8
 * extractCheckSoilDays("", "Water every 10-14 days") // returns 8 (10-2)
 * extractCheckSoilDays("") // returns 5 (default)
 */
export function extractCheckSoilDays(checkSoilText: string, fallbackWateringText?: string): number {
  if (checkSoilText) {
    const match = checkSoilText.match(/check soil every (\d+) days?/i);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  // Derive from watering text: soil check = min watering days - 2
  if (fallbackWateringText) {
    const rangeMatch = fallbackWateringText.match(/(\d+)-(\d+)\s*days?/i);
    if (rangeMatch) {
      return Math.max(1, parseInt(rangeMatch[1], 10) - 2);
    }
    const singleMatch = fallbackWateringText.match(/(\d+)\s*days?/i);
    if (singleMatch) {
      return Math.max(1, parseInt(singleMatch[1], 10) - 2);
    }
  }

  return 5; // safe default
}

/**
 * Format watering schedule (100_dry -> 100% dry, 100%dry -> 100% dry)
 *
 * @param schedule - Raw watering schedule string
 * @returns Formatted schedule string
 */
export function formatWateringSchedule(schedule: string): string {
  if (!schedule) return schedule;

  return schedule
    .replace(/_/g, ' ')
    .replace(/(\d+)%\s*dry/gi, '$1% dry')
    .replace(/(\d+)\s+dry/i, '$1% dry');
}

/**
 * Format light/orientation values (bright_direct -> Bright direct)
 *
 * @param value - Raw light value string
 * @returns Formatted string with proper capitalization
 */
export function formatLightValue(value: string): string {
  if (!value) return value;

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
