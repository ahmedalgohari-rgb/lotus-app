import { WeatherData } from '../types';
import i18n from '../i18n';
import { logger } from '../utils/logger';

// 🔒 SECURITY: API key moved to secure Edge Function
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1`;

const CAIRO_COORDS = {
  lat: 30.0444,
  lon: 31.2357
};

interface OpenWeatherResponse {
  main: {
    temp: number;
    temp_min: number;      // Minimum temperature for the day
    temp_max: number;      // Maximum temperature for the day
    humidity: number;
    feels_like: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  name: string;
  dt: number;
}

export class WeatherService {
  private static readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours - refreshes at midnight
  private static readonly REQUEST_TIMEOUT = 30000; // 30 seconds (Edge Function + API call)
  private static readonly MAX_RETRIES = 2; // Reduce retries (timeout is longer now)
  
  private static cachedWeather: WeatherData | null = null;
  private static lastFetch: Date | null = null;
  
  /**
   * Get current weather data for Cairo with caching and retry logic
   */
  static async getCurrentWeather(): Promise<WeatherData | null> {
    try {
      // Check cache first
      if (this.isCacheValid()) {
        return this.cachedWeather;
      }

      if (!SUPABASE_URL) {
        logger.warn('Supabase URL not configured');
        return this.getMockWeatherData();
      }

      // 🔒 SECURE: Call weather via Edge Function (no API key exposed)
      const weatherData = await this.fetchWithRetry();
      
      // Cache successful response
      if (weatherData) {
        this.cachedWeather = weatherData;
        this.lastFetch = new Date();
      }
      
      return weatherData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn('Weather API temporarily unavailable, using fallback data:', errorMessage);

      // Return cached data if available, otherwise mock data
      if (this.cachedWeather) {
        return this.cachedWeather;
      }

      return this.getMockWeatherData();
    }
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

        // Call secure Edge Function instead of OpenWeather directly
        const response = await fetch(
          `${EDGE_FUNCTION_URL}/get-weather?lang=${currentLang}`,
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

        const data: OpenWeatherResponse = await response.json();
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
   * Transform OpenWeather API response to our WeatherData type
   * Uses (high + low) / 2 for daily average temperature
   */
  private static transformWeatherData(data: OpenWeatherResponse): WeatherData {
    // Calculate daily average temperature: (high + low) / 2
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
      temperature: tempAverage,  // Use calculated daily average
      humidity: humidity,
      condition: this.mapWeatherCondition(condition),
      description: data.weather[0]?.description || (i18n.language === 'ar' ? 'صافي' : 'Clear'),
      windSpeed: data.wind.speed,
      lastUpdated: new Date(),
      location: i18n.language === 'ar' ? 'القاهرة' : 'Cairo',
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
   * Generate care recommendations based on Cairo weather
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
        message: isArabic ? 'الجو حار جداً في القاهرة - زود الري والرش' : 'Very hot weather in Cairo - increase watering and misting',
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

    // Normal Cairo weather
    return {
      type: 'normal',
      message: isArabic ? 'الجو معتدل في القاهرة - جدول ري عادي' : 'Pleasant weather in Cairo - normal watering schedule',
      adjustment: 1.0 // Normal watering
    };
  }

  /**
   * Get mock weather data for development/fallback
   * Uses seasonal temperatures for Cairo
   */
  private static getMockWeatherData(): WeatherData {
    // Use seasonal temperature for Cairo
    const month = new Date().getMonth(); // 0-11
    let temp: number;
    let humidity: number;

    if (month >= 5 && month <= 9) {
      // Summer (June-October): Hot
      temp = 35;
      humidity = 35;
    } else if (month >= 11 || month <= 2) {
      // Winter (December-March): Mild/Cool
      temp = 18; // Realistic winter average
      humidity = 60;
    } else {
      // Spring/Fall: Pleasant
      temp = 25;
      humidity = 45;
    }

    const isArabic = i18n.language === 'ar';
    
    return {
      temperature: temp,
      humidity: humidity,
      condition: 'sunny',
      description: isArabic ? 'صافي' : 'Clear',
      windSpeed: 10,
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
   * Get seasonal care tips for Cairo
   */
  static getSeasonalTips(): string[] {
    const month = new Date().getMonth(); // 0-11
    const isArabic = i18n.language === 'ar';
    
    if (month >= 5 && month <= 8) { // June-September (Summer)
      return isArabic ? [
        'صيف القاهرة: اسقي أكتر في الشهور الحارة',
        'تجنب الري وقت الضهر في الحر الشديد',
        'اعمل ظل للنباتات على البلكونة',
        'رش الأوراق في المساء عشان الرطوبة'
      ] : [
        'Cairo Summer: Water more during hot months',
        'Avoid watering at noon during extreme heat',
        'Provide shade for balcony plants',
        'Mist leaves in the evening for humidity'
      ];
    } else if (month >= 11 || month <= 2) { // December-February (Winter)
      return isArabic ? [
        'شتا القاهرة: قلل الري في الشهور الباردة',
        'ادخل النباتات الحساسة من البرد',
        'تجنب الري الزيادة عشان العفن',
        'حط النباتات في أماكن مشمسة'
      ] : [
        'Cairo Winter: Reduce watering in cold months',
        'Bring cold-sensitive plants indoors',
        'Avoid overwatering to prevent root rot',
        'Place plants in sunny locations'
      ];
    } else { // Spring/Fall
      return isArabic ? [
        'الجو معتدل في القاهرة - وقت مثالي للنباتات',
        'نضف الورق من التراب والغبار',
        'وقت كويس لنقل النباتات وتقليمها',
        'راقب النباتات عشان العواصف الترابية'
      ] : [
        'Pleasant weather in Cairo - ideal time for plants',
        'Clean leaves from dust and dirt',
        'Good time to repot plants and prune',
        'Watch for dust storms affecting plants'
      ];
    }
  }
}

export default WeatherService;