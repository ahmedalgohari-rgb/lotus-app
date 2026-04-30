/**
 * Climate Lookup Module
 *
 * Provides seasonal climate averages for Egyptian cities.
 * Used by the care recommendation engine to give location-aware advice
 * instead of hardcoded Cairo data.
 *
 * Data source: Historical weather averages (temperature °C, humidity %)
 * Coverage: Egypt first, expandable to Middle East
 */

import { WeatherData } from '../../types';
import { Season } from '../season';

interface SeasonalClimate {
  temperature: number;    // Average temp °C
  tempMin: number;
  tempMax: number;
  humidity: number;       // Average humidity %
  windSpeed: number;      // Average wind speed m/s
  uvIndex: number;        // Average UV index (1-12+)
}

interface CityClimate {
  name: string;
  nameAr: string;
  lat: number;
  lon: number;
  seasons: Record<Season, SeasonalClimate>;
}

/**
 * Egyptian cities with historical seasonal climate averages.
 * Ordered roughly north → south for readability.
 */
const EGYPT_CITIES: CityClimate[] = [
  {
    name: 'Alexandria',
    nameAr: 'الإسكندرية',
    lat: 31.2001,
    lon: 29.9187,
    seasons: {
      winter:  { temperature: 14, tempMin: 9,  tempMax: 19, humidity: 70, windSpeed: 4.5, uvIndex: 3 },
      spring:  { temperature: 21, tempMin: 15, tempMax: 27, humidity: 60, windSpeed: 4.2, uvIndex: 7 },
      summer:  { temperature: 27, tempMin: 23, tempMax: 31, humidity: 65, windSpeed: 4.0, uvIndex: 9 },
      autumn:  { temperature: 22, tempMin: 17, tempMax: 28, humidity: 63, windSpeed: 3.8, uvIndex: 5 },
    },
  },
  {
    name: 'Port Said',
    nameAr: 'بورسعيد',
    lat: 31.2653,
    lon: 32.3019,
    seasons: {
      winter:  { temperature: 14, tempMin: 9,  tempMax: 19, humidity: 68, windSpeed: 4.0, uvIndex: 3 },
      spring:  { temperature: 20, tempMin: 14, tempMax: 26, humidity: 58, windSpeed: 3.8, uvIndex: 7 },
      summer:  { temperature: 27, tempMin: 23, tempMax: 31, humidity: 63, windSpeed: 3.5, uvIndex: 9 },
      autumn:  { temperature: 22, tempMin: 17, tempMax: 28, humidity: 62, windSpeed: 3.5, uvIndex: 5 },
    },
  },
  {
    name: 'Damietta',
    nameAr: 'دمياط',
    lat: 31.4175,
    lon: 31.8144,
    seasons: {
      winter:  { temperature: 13, tempMin: 8,  tempMax: 18, humidity: 70, windSpeed: 3.8, uvIndex: 3 },
      spring:  { temperature: 20, tempMin: 14, tempMax: 26, humidity: 60, windSpeed: 3.5, uvIndex: 7 },
      summer:  { temperature: 27, tempMin: 23, tempMax: 31, humidity: 65, windSpeed: 3.2, uvIndex: 9 },
      autumn:  { temperature: 22, tempMin: 16, tempMax: 28, humidity: 63, windSpeed: 3.3, uvIndex: 5 },
    },
  },
  {
    name: 'Mansoura',
    nameAr: 'المنصورة',
    lat: 31.0409,
    lon: 31.3785,
    seasons: {
      winter:  { temperature: 13, tempMin: 7,  tempMax: 19, humidity: 65, windSpeed: 2.8, uvIndex: 3 },
      spring:  { temperature: 22, tempMin: 15, tempMax: 29, humidity: 50, windSpeed: 3.0, uvIndex: 8 },
      summer:  { temperature: 29, tempMin: 23, tempMax: 35, humidity: 55, windSpeed: 2.8, uvIndex: 10 },
      autumn:  { temperature: 23, tempMin: 17, tempMax: 30, humidity: 55, windSpeed: 2.5, uvIndex: 6 },
    },
  },
  {
    name: 'Tanta',
    nameAr: 'طنطا',
    lat: 30.7865,
    lon: 31.0004,
    seasons: {
      winter:  { temperature: 13, tempMin: 7,  tempMax: 19, humidity: 63, windSpeed: 2.5, uvIndex: 3 },
      spring:  { temperature: 22, tempMin: 14, tempMax: 29, humidity: 48, windSpeed: 2.8, uvIndex: 8 },
      summer:  { temperature: 29, tempMin: 23, tempMax: 35, humidity: 52, windSpeed: 2.5, uvIndex: 10 },
      autumn:  { temperature: 23, tempMin: 16, tempMax: 30, humidity: 53, windSpeed: 2.3, uvIndex: 6 },
    },
  },
  {
    name: 'Ismailia',
    nameAr: 'الإسماعيلية',
    lat: 30.5965,
    lon: 32.2715,
    seasons: {
      winter:  { temperature: 14, tempMin: 8,  tempMax: 20, humidity: 55, windSpeed: 2.5, uvIndex: 4 },
      spring:  { temperature: 23, tempMin: 15, tempMax: 31, humidity: 40, windSpeed: 3.0, uvIndex: 8 },
      summer:  { temperature: 30, tempMin: 24, tempMax: 36, humidity: 42, windSpeed: 3.0, uvIndex: 10 },
      autumn:  { temperature: 24, tempMin: 17, tempMax: 31, humidity: 48, windSpeed: 2.5, uvIndex: 6 },
    },
  },
  {
    name: 'Cairo',
    nameAr: 'القاهرة',
    lat: 30.0444,
    lon: 31.2357,
    seasons: {
      winter:  { temperature: 14, tempMin: 8,  tempMax: 20, humidity: 55, windSpeed: 2.5, uvIndex: 4 },
      spring:  { temperature: 24, tempMin: 16, tempMax: 32, humidity: 38, windSpeed: 3.0, uvIndex: 9 },
      summer:  { temperature: 30, tempMin: 24, tempMax: 36, humidity: 40, windSpeed: 2.8, uvIndex: 11 },
      autumn:  { temperature: 24, tempMin: 17, tempMax: 31, humidity: 45, windSpeed: 2.5, uvIndex: 6 },
    },
  },
  {
    name: 'Suez',
    nameAr: 'السويس',
    lat: 29.9668,
    lon: 32.5498,
    seasons: {
      winter:  { temperature: 15, tempMin: 8,  tempMax: 21, humidity: 48, windSpeed: 3.0, uvIndex: 4 },
      spring:  { temperature: 24, tempMin: 16, tempMax: 33, humidity: 32, windSpeed: 3.5, uvIndex: 9 },
      summer:  { temperature: 31, tempMin: 25, tempMax: 38, humidity: 35, windSpeed: 3.5, uvIndex: 11 },
      autumn:  { temperature: 25, tempMin: 18, tempMax: 33, humidity: 40, windSpeed: 3.0, uvIndex: 6 },
    },
  },
  {
    name: 'Fayoum',
    nameAr: 'الفيوم',
    lat: 29.3084,
    lon: 30.8441,
    seasons: {
      winter:  { temperature: 13, tempMin: 6,  tempMax: 20, humidity: 52, windSpeed: 2.2, uvIndex: 4 },
      spring:  { temperature: 24, tempMin: 14, tempMax: 33, humidity: 35, windSpeed: 2.8, uvIndex: 9 },
      summer:  { temperature: 31, tempMin: 23, tempMax: 38, humidity: 35, windSpeed: 2.5, uvIndex: 11 },
      autumn:  { temperature: 24, tempMin: 16, tempMax: 32, humidity: 42, windSpeed: 2.2, uvIndex: 6 },
    },
  },
  {
    name: 'Minya',
    nameAr: 'المنيا',
    lat: 28.0871,
    lon: 30.7500,
    seasons: {
      winter:  { temperature: 12, tempMin: 5,  tempMax: 20, humidity: 50, windSpeed: 2.0, uvIndex: 4 },
      spring:  { temperature: 25, tempMin: 14, tempMax: 35, humidity: 30, windSpeed: 2.5, uvIndex: 9 },
      summer:  { temperature: 32, tempMin: 23, tempMax: 40, humidity: 28, windSpeed: 2.5, uvIndex: 11 },
      autumn:  { temperature: 25, tempMin: 15, tempMax: 34, humidity: 38, windSpeed: 2.0, uvIndex: 6 },
    },
  },
  {
    name: 'Hurghada',
    nameAr: 'الغردقة',
    lat: 27.2579,
    lon: 33.8116,
    seasons: {
      winter:  { temperature: 17, tempMin: 11, tempMax: 23, humidity: 42, windSpeed: 3.5, uvIndex: 5 },
      spring:  { temperature: 25, tempMin: 18, tempMax: 32, humidity: 30, windSpeed: 4.0, uvIndex: 9 },
      summer:  { temperature: 32, tempMin: 27, tempMax: 38, humidity: 32, windSpeed: 4.0, uvIndex: 11 },
      autumn:  { temperature: 27, tempMin: 21, tempMax: 33, humidity: 38, windSpeed: 3.5, uvIndex: 7 },
    },
  },
  {
    name: 'Sharm El Sheikh',
    nameAr: 'شرم الشيخ',
    lat: 27.9158,
    lon: 34.3300,
    seasons: {
      winter:  { temperature: 18, tempMin: 13, tempMax: 23, humidity: 40, windSpeed: 3.0, uvIndex: 5 },
      spring:  { temperature: 26, tempMin: 20, tempMax: 33, humidity: 28, windSpeed: 3.5, uvIndex: 10 },
      summer:  { temperature: 33, tempMin: 28, tempMax: 39, humidity: 30, windSpeed: 3.5, uvIndex: 12 },
      autumn:  { temperature: 28, tempMin: 22, tempMax: 34, humidity: 35, windSpeed: 3.0, uvIndex: 7 },
    },
  },
  {
    name: 'Luxor',
    nameAr: 'الأقصر',
    lat: 25.6872,
    lon: 32.6396,
    seasons: {
      winter:  { temperature: 15, tempMin: 6,  tempMax: 24, humidity: 40, windSpeed: 2.0, uvIndex: 5 },
      spring:  { temperature: 28, tempMin: 17, tempMax: 39, humidity: 22, windSpeed: 2.5, uvIndex: 10 },
      summer:  { temperature: 35, tempMin: 25, tempMax: 42, humidity: 18, windSpeed: 2.5, uvIndex: 12 },
      autumn:  { temperature: 27, tempMin: 17, tempMax: 37, humidity: 30, windSpeed: 2.0, uvIndex: 7 },
    },
  },
  {
    name: 'Aswan',
    nameAr: 'أسوان',
    lat: 24.0889,
    lon: 32.8998,
    seasons: {
      winter:  { temperature: 17, tempMin: 8,  tempMax: 25, humidity: 30, windSpeed: 2.2, uvIndex: 5 },
      spring:  { temperature: 30, tempMin: 20, tempMax: 40, humidity: 15, windSpeed: 3.0, uvIndex: 11 },
      summer:  { temperature: 36, tempMin: 27, tempMax: 44, humidity: 14, windSpeed: 3.0, uvIndex: 12 },
      autumn:  { temperature: 29, tempMin: 19, tempMax: 38, humidity: 22, windSpeed: 2.5, uvIndex: 8 },
    },
  },
];

// Default city when no garden location is set
const DEFAULT_CITY = EGYPT_CITIES.find(c => c.name === 'Cairo')!;

/**
 * Calculate distance between two coordinates using the Haversine formula.
 * Returns distance in kilometers.
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the nearest Egyptian city to the given coordinates.
 */
export function getNearestCity(lat: number, lon: number): CityClimate {
  let nearest = DEFAULT_CITY;
  let minDistance = Infinity;

  for (const city of EGYPT_CITIES) {
    const distance = haversineDistance(lat, lon, city.lat, city.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = city;
    }
  }

  return nearest;
}

/**
 * Get seasonal climate data as WeatherData for the care engine.
 *
 * This is the key function: it converts historical seasonal averages
 * into the WeatherData format that the existing weather-aware modifiers expect.
 *
 * @param season - Current astronomical season
 * @param gardenLocation - User's garden coordinates (null = Cairo default)
 * @returns WeatherData with seasonal averages for the nearest city
 */
export function getSeasonalWeatherData(
  season: Season,
  gardenLocation: { lat: number; lon: number; name?: string } | null
): WeatherData {
  const city = gardenLocation
    ? getNearestCity(gardenLocation.lat, gardenLocation.lon)
    : DEFAULT_CITY;

  const climate = city.seasons[season];

  return {
    temperature: climate.temperature,
    tempMin: climate.tempMin,
    tempMax: climate.tempMax,
    humidity: climate.humidity,
    condition: getSeasonalCondition(season, climate.temperature),
    description: `${city.name} ${season} average`,
    windSpeed: climate.windSpeed,
    uvIndex: climate.uvIndex,
    lastUpdated: new Date(),
    location: gardenLocation?.name || city.name,
    careRecommendation: {
      type: climate.temperature >= 30 ? 'increase' : climate.temperature < 16 ? 'reduce' : 'normal',
      message: `${city.name} ${season} seasonal care`,
      adjustment: climate.temperature >= 35 ? 1.5 : climate.temperature >= 30 ? 1.3 : climate.temperature < 16 ? 0.7 : 1.0,
    },
  };
}

/**
 * Get the city name for display purposes.
 */
export function getClimateLocationName(
  gardenLocation: { lat: number; lon: number; name?: string } | null,
  lang: 'en' | 'ar' = 'en'
): string {
  if (!gardenLocation) {
    return lang === 'ar' ? DEFAULT_CITY.nameAr : DEFAULT_CITY.name;
  }

  const city = getNearestCity(gardenLocation.lat, gardenLocation.lon);
  return lang === 'ar' ? city.nameAr : city.name;
}

/**
 * Map season + temperature to a general weather condition.
 */
function getSeasonalCondition(
  season: Season,
  temperature: number
): 'sunny' | 'cloudy' | 'rainy' | 'hot' | 'mild' {
  if (temperature >= 35) return 'hot';
  if (season === 'summer') return 'sunny';
  if (season === 'winter' && temperature < 16) return 'mild';
  if (season === 'spring' || season === 'autumn') return 'sunny';
  return 'sunny';
}

/**
 * Get all available city names (for future city picker UI).
 */
export function getAvailableCities(lang: 'en' | 'ar' = 'en'): string[] {
  return EGYPT_CITIES.map(c => lang === 'ar' ? c.nameAr : c.name);
}
