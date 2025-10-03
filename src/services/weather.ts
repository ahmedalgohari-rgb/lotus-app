import { WeatherData } from '../types';
import i18n from '../i18n';
const CAIRO_COORDS = {
  lat: 30.0444,
  lon: 31.2357
};

interface OpenWeatherResponse {
  main: {
    temp: number;
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
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private static readonly REQUEST_TIMEOUT = 10000; // 10 seconds
  private static readonly MAX_RETRIES = 3;
  
  private static cachedWeather: WeatherData | null = null;
  private static lastFetch: Date | null = null;
  
  /**
   * Get current weather data for Cairo with caching and retry logic
   */
  static async getCurrentWeather(): Promise<WeatherData | null> {
    try {
      // Check cache first
      if (this.isCacheValid()) {
        console.log('Using cached weather data');
        return this.cachedWeather;
      }

      const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
      if (!apiKey) {
        console.warn('OpenWeather API key not configured');
        return this.getMockWeatherData();
      }

      // Attempt API call with retry logic
      const weatherData = await this.fetchWithRetry(apiKey);
      
      // Cache successful response
      if (weatherData) {
        this.cachedWeather = weatherData;
        this.lastFetch = new Date();
      }
      
      return weatherData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('Weather API temporarily unavailable, using fallback data:', errorMessage);
      
      // Return cached data if available, otherwise mock data
      if (this.cachedWeather) {
        console.log('Using stale cached weather data due to API error');
        return this.cachedWeather;
      }
      
      console.log('Using mock weather data as fallback');
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
   * Fetch weather data with timeout and retry logic
   */
  private static async fetchWithRetry(apiKey: string): Promise<WeatherData | null> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`Weather API attempt ${attempt}/${this.MAX_RETRIES}`);
        
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
        
        // Use current app language for weather API
        const currentLang = i18n.language === 'ar' ? 'ar' : 'en';
        
        const response = await fetch(
          `${this.BASE_URL}/weather?lat=${CAIRO_COORDS.lat}&lon=${CAIRO_COORDS.lon}&appid=${apiKey}&units=metric&lang=${currentLang}`,
          {
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache',
            },
          }
        );
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
        }

        const data: OpenWeatherResponse = await response.json();
        console.log('Weather API call successful');
        return this.transformWeatherData(data);
        
      } catch (error: unknown) {
        lastError = error as Error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`Weather API attempt ${attempt}/${this.MAX_RETRIES} failed:`, errorMessage);
        
        // Don't retry on abort (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Weather API request timed out, switching to fallback data');
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.MAX_RETRIES) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5s delay
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Weather API failed after all retries');
  }

  /**
   * Transform OpenWeather API response to our WeatherData type
   */
  private static transformWeatherData(data: OpenWeatherResponse): WeatherData {
    const temp = Math.round(data.main.temp);
    const humidity = data.main.humidity;
    const condition = data.weather[0]?.main.toLowerCase() || 'clear';

    return {
      temperature: temp,
      humidity: humidity,
      condition: this.mapWeatherCondition(condition),
      description: data.weather[0]?.description || (i18n.language === 'ar' ? 'صافي' : 'Clear'),
      windSpeed: data.wind.speed,
      lastUpdated: new Date(),
      location: i18n.language === 'ar' ? 'القاهرة' : 'Cairo',
      careRecommendation: this.generateCareRecommendation(temp, humidity, condition)
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
   */
  private static getMockWeatherData(): WeatherData {
    // Simulate typical Cairo weather
    const temp = 28; // Typical Cairo temperature
    const humidity = 45; // Typical Cairo humidity
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
    console.log('Weather cache cleared');
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