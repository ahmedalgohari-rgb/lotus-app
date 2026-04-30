import { Platform } from 'react-native';
import { WeatherData } from '../types';
import i18n from '../i18n';
import { logger } from '../utils/logger';
import { getNativeWeather, NativeWeatherResult } from '../../modules/lotus-weather';
import { getCurrentSeason } from '../utils/season';

// 🔒 SECURITY: Weather data fetched via secure Edge Function (Apple WeatherKit)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1`;

interface WeatherApiResponse {
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
  };
}

/**
 * Localized weather condition descriptions
 * Maps WeatherKit condition codes → Arabic & English
 */
const WEATHER_CONDITIONS: Record<string, { en: string; ar: string }> = {
  // Clear / Sunny
  clear:           { en: 'Clear',              ar: 'صافي' },
  mostlyclear:     { en: 'Mostly Clear',       ar: 'صافي غالباً' },
  hot:             { en: 'Hot',                 ar: 'حر' },

  // Cloudy
  partlycloudy:    { en: 'Partly Cloudy',      ar: 'غيوم جزئية' },
  mostlycloudy:    { en: 'Mostly Cloudy',      ar: 'غائم غالباً' },
  cloudy:          { en: 'Cloudy',              ar: 'غائم' },
  foggy:           { en: 'Foggy',              ar: 'ضباب' },
  haze:            { en: 'Hazy',               ar: 'شبورة' },
  smoky:           { en: 'Smoky',              ar: 'دخان' },

  // Wind / Dust
  breezy:          { en: 'Breezy',             ar: 'نسيم' },
  windy:           { en: 'Windy',              ar: 'رياح' },
  blowingdust:     { en: 'Dusty',              ar: 'تراب' },

  // Rain
  drizzle:         { en: 'Drizzle',            ar: 'رذاذ' },
  rain:            { en: 'Rain',               ar: 'مطر' },
  heavyrain:       { en: 'Heavy Rain',         ar: 'مطر غزير' },
  thunderstorms:   { en: 'Thunderstorms',      ar: 'رعد وبرق' },
  strongstorms:    { en: 'Strong Storms',      ar: 'عواصف قوية' },
  hail:            { en: 'Hail',               ar: 'بَرَد' },
  tropicalstorm:   { en: 'Tropical Storm',     ar: 'عاصفة استوائية' },
  hurricane:       { en: 'Hurricane',          ar: 'إعصار' },

  // Wintry (rare in Egypt)
  freezingrain:    { en: 'Freezing Rain',      ar: 'مطر متجمد' },
  freezingdrizzle: { en: 'Freezing Drizzle',   ar: 'رذاذ متجمد' },
  snow:            { en: 'Snow',               ar: 'ثلج' },
  flurries:        { en: 'Flurries',           ar: 'رقاقات ثلج' },
  sleet:           { en: 'Sleet',              ar: 'مطر ثلجي' },
  blizzard:        { en: 'Blizzard',           ar: 'عاصفة ثلجية' },
  blowingsnow:     { en: 'Blowing Snow',       ar: 'ثلوج عاصفة' },
  frigid:          { en: 'Frigid',             ar: 'برد شديد' },
  sunflurries:     { en: 'Sun Flurries',       ar: 'صافي مع رقاقات' },
};

/**
 * Get localized weather description from condition code
 */
function getLocalizedCondition(conditionCode: string): string {
  const isArabic = i18n.language === 'ar';
  const code = conditionCode.toLowerCase();
  const match = WEATHER_CONDITIONS[code];
  if (match) {
    return isArabic ? match.ar : match.en;
  }
  // Fallback: return the raw code prettified
  return isArabic ? 'صافي' : 'Clear';
}

export class WeatherService {
  private static readonly BASE_URL = 'https://weatherkit.apple.com/api/v1'; // Apple WeatherKit
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours - refreshes at midnight
  private static readonly REQUEST_TIMEOUT = 30000; // 30 seconds (Edge Function + API call)
  private static readonly MAX_RETRIES = 2; // Reduce retries (timeout is longer now)
  
  private static cachedWeather: WeatherData | null = null;
  private static lastFetch: Date | null = null;
  
  /**
   * Get current weather data with native WeatherKit (preferred) or Edge Function fallback
   */
  static async getCurrentWeather(): Promise<WeatherData | null> {
    try {
      // Check cache first
      if (this.isCacheValid()) {
        return this.cachedWeather;
      }

      // Try native WeatherKit first (iOS 16+, uses device location)
      if (Platform.OS === 'ios') {
        try {
          // 10-second timeout to prevent hanging — falls back to edge function
          const nativeData = await Promise.race([
            this.fetchNativeWeather(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000))
          ]);
          if (nativeData) {
            this.cachedWeather = nativeData;
            this.lastFetch = new Date();
            return nativeData;
          }
          logger.info('Native WeatherKit timed out, falling back to edge function');
        } catch (nativeError: unknown) {
          const msg = nativeError instanceof Error ? nativeError.message : String(nativeError);
          logger.info('Native WeatherKit unavailable, falling back to edge function:', msg);
        }
      }

      // Fallback: Edge Function (Cairo weather)
      if (!SUPABASE_URL) {
        logger.warn('Supabase URL not configured');
        return this.getMockWeatherData();
      }

      const weatherData = await this.fetchWithRetry();

      if (weatherData) {
        this.cachedWeather = weatherData;
        this.lastFetch = new Date();
      }

      return weatherData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn('Weather API temporarily unavailable, using fallback data:', errorMessage);

      if (this.cachedWeather) {
        return this.cachedWeather;
      }

      return this.getMockWeatherData();
    }
  }

  /**
   * Fetch weather via native Apple WeatherKit (uses device GPS location)
   */
  private static async fetchNativeWeather(): Promise<WeatherData> {
    const result: NativeWeatherResult = await getNativeWeather();

    const temp = result.temperature;
    const humidity = result.humidity;
    const condition = this.mapWeatherKitCondition(result.conditionCode);

    return {
      temperature: temp,
      tempMin: result.temperatureMin,
      tempMax: result.temperatureMax,
      humidity,
      condition,
      description: getLocalizedCondition(result.conditionCode),
      windSpeed: result.windSpeed,
      windGust: result.windGust,
      uvIndex: result.uvIndex,
      uvCategory: result.uvCategory,
      pressure: result.pressure,
      lastUpdated: new Date(),
      location: result.locationName,
      careRecommendation: this.generateCareRecommendation(temp, humidity, condition)
    };
  }

  /**
   * Map WeatherKit condition codes to app's simplified conditions
   */
  private static mapWeatherKitCondition(conditionCode: string): 'sunny' | 'cloudy' | 'rainy' | 'hot' | 'mild' {
    const code = conditionCode.toLowerCase();

    // Rainy conditions
    if (['rain', 'heavyrain', 'drizzle', 'thunderstorms', 'strongstorms',
         'freezingrain', 'freezingdrizzle', 'hail', 'tropicalstorm', 'hurricane'].some(c => code.includes(c.toLowerCase()))) {
      return 'rainy';
    }

    // Cloudy conditions
    if (['cloudy', 'mostlycloudy', 'partlycloudy', 'foggy', 'haze', 'smoky',
         'breezy', 'windy', 'blowingdust'].some(c => code.includes(c.toLowerCase()))) {
      return 'cloudy';
    }

    // Sunny/clear conditions
    if (['clear', 'mostlyclear', 'hot', 'sunflurries'].some(c => code.includes(c.toLowerCase()))) {
      return 'sunny';
    }

    // Snow/wintry (unlikely in Egypt, but complete mapping)
    if (['snow', 'flurries', 'sleet', 'blizzard', 'blowingsnow', 'frigid'].some(c => code.includes(c.toLowerCase()))) {
      return 'mild';
    }

    return 'mild';
  }

  /**
   * Check if cached weather data is still valid
   */
  private static isCacheValid(): boolean {
    if (!this.cachedWeather || !this.lastFetch) {
      return false;
    }
    
    const now = new Date();
    const timeDiff = now.getTime() - this.lastFetch.getTime();
    return timeDiff < this.CACHE_DURATION;
  }

  /**
   * 🔒 SECURE: Fetch weather via Edge Function (API key protected)
   */
  private static async fetchWithRetry(): Promise<WeatherData | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

        // Use current app language
        const currentLang = i18n.language === 'ar' ? 'ar' : 'en';

        // Call secure Edge Function (Apple WeatherKit)
        const response = await fetch(
          `${EDGE_FUNCTION_URL}/get-weather-apple?lang=${currentLang}`,
          {
            signal: controller.signal,
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'apikey': SUPABASE_ANON_KEY,
              'Cache-Control': 'no-cache',
            },
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Weather Edge Function error: ${response.status}`);
        }

        const data: WeatherApiResponse = await response.json();
        return this.transformWeatherData(data);

      } catch (error: unknown) {
        lastError = error as Error;

        // Don't retry on abort (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.MAX_RETRIES) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5s delay
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Weather API failed after all retries');
  }

  /**
   * Transform Weather API response to our WeatherData type
   * Uses (high + low) / 2 for daily average temperature
   */
  private static transformWeatherData(data: WeatherApiResponse): WeatherData {
    const tempHigh = data.main.temp_max;
    const tempLow = data.main.temp_min;
    const tempAverage = Math.round((tempHigh + tempLow) / 2);
    const humidity = data.main.humidity;
    const condition = data.weather[0]?.main.toLowerCase() || 'clear';

    logger.debug('Weather calculation', {
      high: tempHigh,
      low: tempLow,
      average: tempAverage,
      current: Math.round(data.main.temp)
    });

    return {
      temperature: tempAverage,
      tempMin: tempLow,
      tempMax: tempHigh,
      humidity,
      condition: this.mapWeatherCondition(condition),
      description: getLocalizedCondition(data.weather[0]?.main || 'clear'),
      windSpeed: data.wind.speed,
      lastUpdated: new Date(),
      location: i18n.language === 'ar' ? 'القاهرة' : 'Cairo', // Edge function fallback uses Cairo
      careRecommendation: this.generateCareRecommendation(tempAverage, humidity, condition)
    };
  }

  /**
   * Map OpenWeather conditions to our simplified conditions
   */
  private static mapWeatherCondition(condition: string): 'sunny' | 'cloudy' | 'rainy' | 'hot' | 'mild' {
    switch (condition) {
      case 'rain':
      case 'drizzle':
      case 'thunderstorm':
        return 'rainy';
      case 'clouds':
        return 'cloudy';
      case 'clear':
        return 'sunny';
      default:
        return 'mild';
    }
  }

  /**
   * Generate care recommendations based on current weather
   */
  private static generateCareRecommendation(temp: number, humidity: number, condition: string): {
    type: 'increase' | 'normal' | 'reduce';
    message: string;
    adjustment: number;
  } {
    const isArabic = i18n.language === 'ar';
    
    // Cairo-specific recommendations
    if (temp > 35) {
      return {
        type: 'increase',
        message: isArabic ? 'الجو حار جداً - زود الري والرش' : 'Very hot weather - increase watering and misting',
        adjustment: 1.5 // Increase watering by 50%
      };
    }

    if (temp > 30 && humidity < 40) {
      return {
        type: 'increase',
        message: isArabic ? 'الجو حار وناشف - النباتات محتاجة مياه أكتر' : 'Hot and dry weather - plants need more water',
        adjustment: 1.3 // Increase watering by 30%
      };
    }

    if (condition === 'rain' || humidity > 80) {
      return {
        type: 'reduce',
        message: isArabic ? 'الجو رطب أو مطر - قلل الري' : 'Humid weather or rain - reduce watering',
        adjustment: 0.7 // Reduce watering by 30%
      };
    }

    if (temp < 15) {
      return {
        type: 'reduce',
        message: isArabic ? 'الجو بارد - النباتات محتاجة مياه أقل' : 'Cool weather - plants need less water',
        adjustment: 0.8 // Reduce watering by 20%
      };
    }

    // Normal weather
    return {
      type: 'normal',
      message: isArabic ? 'الجو معتدل - جدول ري عادي' : 'Pleasant weather - normal watering schedule',
      adjustment: 1.0 // Normal watering
    };
  }

  /**
   * Get mock weather data for development/fallback
   * Uses seasonal temperatures for Cairo based on official astronomical dates
   */
  private static getMockWeatherData(): WeatherData {
    const season = getCurrentSeason();
    let temp: number;
    let tempMin: number;
    let tempMax: number;
    let humidity: number;

    if (season === 'summer') {
      temp = 35; tempMin = 28; tempMax = 42;
      humidity = 35;
    } else if (season === 'winter') {
      temp = 18; tempMin = 10; tempMax = 22;
      humidity = 60;
    } else {
      // Spring/Autumn: Pleasant
      temp = 25; tempMin = 18; tempMax = 32;
      humidity = 45;
    }

    const isArabic = i18n.language === 'ar';

    return {
      temperature: temp,
      tempMin,
      tempMax,
      humidity: humidity,
      condition: 'sunny',
      description: getLocalizedCondition('clear'),
      windSpeed: 10,
      windGust: 15,
      uvIndex: season === 'summer' ? 8 : season === 'winter' ? 2 : 5,
      uvCategory: season === 'summer' ? 'veryHigh' : season === 'winter' ? 'low' : 'moderate',
      pressure: 1013,
      lastUpdated: new Date(),
      location: isArabic ? 'القاهرة' : 'Cairo',
      careRecommendation: this.generateCareRecommendation(temp, humidity, 'clear')
    };
  }

  /**
   * Get weather-based watering adjustment for a specific plant
   */
  static getWateringAdjustment(weather: WeatherData, plantType?: string): number {
    let baseAdjustment = weather.careRecommendation.adjustment;

    // Additional adjustments for specific plant types
    if (plantType) {
      switch (plantType.toLowerCase()) {
        case 'succulent':
        case 'cactus':
          // Succulents need less water in humid conditions
          if (weather.humidity > 60) {
            baseAdjustment *= 0.8;
          }
          break;
        case 'fern':
        case 'tropical':
          // Tropical plants need more humidity
          if (weather.humidity < 50) {
            baseAdjustment *= 1.2;
          }
          break;
        default:
          // Keep base adjustment
          break;
      }
    }

    return Math.max(0.5, Math.min(2.0, baseAdjustment)); // Clamp between 0.5x and 2x
  }

  /**
   * Clear cached weather data (useful for debugging or forced refresh)
   */
  static clearCache(): void {
    this.cachedWeather = null;
    this.lastFetch = null;
  }

  /**
   * Force refresh weather data (useful when language changes)
   */
  static async refreshForLanguageChange(): Promise<WeatherData | null> {
    this.clearCache();
    return await this.getCurrentWeather();
  }

  /**
   * Get cache info for debugging
   */
  static getCacheInfo(): { hasCachedData: boolean; lastFetch: Date | null; isValid: boolean } {
    return {
      hasCachedData: this.cachedWeather !== null,
      lastFetch: this.lastFetch,
      isValid: this.isCacheValid()
    };
  }

  /**
   * Get seasonal care tips based on official astronomical dates
   */
  static getSeasonalTips(): string[] {
    const season = getCurrentSeason();
    const isArabic = i18n.language === 'ar';

    if (season === 'summer') {
      return isArabic ? [
        'الصيف: اسقي أكتر في الشهور الحارة',
        'تجنب الري وقت الضهر في الحر الشديد',
        'اعمل ظل للنباتات على البلكونة',
        'رش الأوراق في المساء عشان الرطوبة'
      ] : [
        'Summer: Water more during hot months',
        'Avoid watering at noon during extreme heat',
        'Provide shade for balcony plants',
        'Mist leaves in the evening for humidity'
      ];
    } else if (season === 'winter') {
      return isArabic ? [
        'الشتا: قلل الري في الشهور الباردة',
        'ادخل النباتات الحساسة من البرد',
        'تجنب الري الزيادة عشان العفن',
        'حط النباتات في أماكن مشمسة'
      ] : [
        'Winter: Reduce watering in cold months',
        'Bring cold-sensitive plants indoors',
        'Avoid overwatering to prevent root rot',
        'Place plants in sunny locations'
      ];
    } else { // Spring/Autumn
      return isArabic ? [
        'الجو معتدل - وقت مثالي للنباتات',
        'نضف الورق من التراب والغبار',
        'وقت كويس لنقل النباتات وتقليمها',
        'راقب النباتات عشان العواصف الترابية'
      ] : [
        'Pleasant weather - ideal time for plants',
        'Clean leaves from dust and dirt',
        'Good time to repot plants and prune',
        'Watch for dust storms affecting plants'
      ];
    }
  }
}

export default WeatherService;