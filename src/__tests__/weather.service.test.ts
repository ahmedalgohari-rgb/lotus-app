import WeatherService from '../services/weather';

// Mock fetch
global.fetch = jest.fn();

describe('Weather Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    // Clear weather service cache
    WeatherService.clearCache();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockWeatherResponse = {
    main: {
      temp: 28,
      humidity: 39,
      feels_like: 30
    },
    weather: [
      {
        main: 'Clear',
        description: 'clear sky',
        icon: '01d'
      }
    ],
    wind: {
      speed: 7.72
    },
    name: 'Cairo'
  };

  it('should return mock data when API key is not configured', async () => {
    // No API key set, should return mock data without calling fetch
    const weather = await WeatherService.getCurrentWeather();

    expect(weather).toEqual({
      temperature: 28,
      humidity: 45,
      condition: 'sunny',
      description: 'صافي',
      windSpeed: 10,
      lastUpdated: expect.any(Date),
      location: 'القاهرة',
      careRecommendation: expect.any(Object)
    });

    // Should not call fetch when no API key
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should return cached data within cache period', async () => {
    // Mock process.env to have API key for this test
    const originalEnv = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
    process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY = 'test-api-key';
    
    // Clear cache before test
    WeatherService.clearCache();
    
    const mockFetch = fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeatherResponse,
    });

    const weather1 = await WeatherService.getCurrentWeather();
    
    // Second call within cache period (should use cache, not fetch again)
    const weather2 = await WeatherService.getCurrentWeather();

    expect(weather1).toEqual(weather2);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    
    // Restore original env
    process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY = originalEnv;
  });

  it('should fetch new data after cache expiry', async () => {
    // Mock process.env to have API key for this test
    const originalEnv = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
    process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY = 'test-api-key';
    
    // Clear cache before test
    WeatherService.clearCache();
    
    const mockFetch = fetch as jest.Mock;
    
    // First call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockWeatherResponse,
    });

    await WeatherService.getCurrentWeather();

    // Advance time beyond cache period (10 minutes)
    jest.advanceTimersByTime(11 * 60 * 1000);

    // Second call after cache expiry
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockWeatherResponse, main: { ...mockWeatherResponse.main, temp: 30 } }),
    });

    const weather2 = await WeatherService.getCurrentWeather();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(weather2.temperature).toBe(30);
    
    // Restore original env
    process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY = originalEnv;
  });

});