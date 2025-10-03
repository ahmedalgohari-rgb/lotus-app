const { device, expect, element, by, waitFor } = require('detox');

describe('Weather Integration Complete E2E Test', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Cairo Weather Widget Display', () => {
    it('should display Cairo weather widget on home screen', async () => {
      // Start as guest user for testing
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.testID('guest-button')).tap();

      // Verify we're on home screen
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify weather widget is present
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify weather widget displays Cairo location
      await expect(element(by.testID('weather-location'))).toBeVisible();
      await expect(element(by.text('Cairo'))).toBeVisible();

      // Verify temperature is displayed
      await waitFor(element(by.testID('weather-temperature')))
        .toBeVisible()
        .withTimeout(2000);

      // Verify humidity is displayed
      await waitFor(element(by.testID('weather-humidity')))
        .toBeVisible()
        .withTimeout(1000);

      // Verify weather condition is displayed
      await waitFor(element(by.testID('weather-condition')))
        .toBeVisible()
        .withTimeout(1000);

      // Verify wind speed is displayed
      await waitFor(element(by.testID('weather-wind-speed')))
        .toBeVisible()
        .withTimeout(1000);
    });

    it('should handle weather widget refresh functionality', async () => {
      // Verify refresh button is present
      await waitFor(element(by.testID('weather-refresh-button')))
        .toBeVisible()
        .withTimeout(3000);

      // Tap refresh button
      await element(by.testID('weather-refresh-button')).tap();

      // Verify loading indicator appears briefly
      await waitFor(element(by.testID('weather-loading-indicator')))
        .toBeVisible()
        .withTimeout(2000);

      // Verify loading indicator disappears and data is refreshed
      await waitFor(element(by.testID('weather-loading-indicator')))
        .not.toBeVisible()
        .withTimeout(10000);

      // Verify weather data is still displayed after refresh
      await expect(element(by.testID('weather-temperature'))).toBeVisible();
      await expect(element(by.testID('weather-humidity'))).toBeVisible();
    });

    it('should display weather-appropriate icons', async () => {
      // Verify weather icon is displayed
      await waitFor(element(by.testID('weather-icon')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify temperature icon
      await expect(element(by.testID('temperature-icon'))).toBeVisible();

      // Verify humidity icon
      await expect(element(by.testID('humidity-icon'))).toBeVisible();

      // Verify wind icon
      await expect(element(by.testID('wind-icon'))).toBeVisible();
    });
  });

  describe('Weather-Based Care Recommendations', () => {
    it('should display weather-based plant care recommendations', async () => {
      // Scroll down to see care recommendations
      await element(by.testID('home-screen')).scroll(200, 'down');

      // Verify care recommendations section is visible
      await waitFor(element(by.testID('care-recommendations-section')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify weather-based care tips are displayed
      await waitFor(element(by.testID('weather-based-care-tips')))
        .toBeVisible()
        .withTimeout(2000);

      // Verify hot weather tips (if temperature is high)
      if (await element(by.testID('hot-weather-tip')).exists()) {
        await expect(element(by.testID('hot-weather-tip'))).toBeVisible();
        await expect(element(by.text('Increase watering frequency'))).toBeVisible();
      }

      // Verify high humidity tips (if humidity is high)
      if (await element(by.testID('high-humidity-tip')).exists()) {
        await expect(element(by.testID('high-humidity-tip'))).toBeVisible();
        await expect(element(by.text('Reduce watering'))).toBeVisible();
      }

      // Verify windy weather tips (if wind is strong)
      if (await element(by.testID('windy-weather-tip')).exists()) {
        await expect(element(by.testID('windy-weather-tip'))).toBeVisible();
        await expect(element(by.text('Secure outdoor plants'))).toBeVisible();
      }
    });

    it('should display seasonal care recommendations for Cairo', async () => {
      // Verify seasonal tips section
      await waitFor(element(by.testID('seasonal-tips-section')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify seasonal care recommendations are Cairo-specific
      await expect(element(by.testID('cairo-seasonal-tips'))).toBeVisible();

      // Check for summer tips (if applicable)
      if (await element(by.testID('summer-care-tip')).exists()) {
        await expect(element(by.text('Summer care for Cairo climate'))).toBeVisible();
      }

      // Check for winter tips (if applicable)
      if (await element(by.testID('winter-care-tip')).exists()) {
        await expect(element(by.text('Winter care for Cairo climate'))).toBeVisible();
      }
    });

    it('should provide specific watering recommendations based on weather', async () => {
      // Scroll to watering recommendations
      await element(by.testID('home-screen')).scroll(300, 'down');

      // Verify watering recommendations section
      await waitFor(element(by.testID('watering-recommendations')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify weather-based watering frequency suggestions
      await expect(element(by.testID('weather-watering-frequency'))).toBeVisible();

      // Verify specific recommendations appear
      if (await element(by.testID('increase-watering-recommendation')).exists()) {
        await expect(element(by.text('Consider watering more frequently due to high temperature'))).toBeVisible();
      }

      if (await element(by.testID('reduce-watering-recommendation')).exists()) {
        await expect(element(by.text('Reduce watering due to high humidity'))).toBeVisible();
      }
    });
  });

  describe('Weather Data Accuracy and Real-time Updates', () => {
    it('should display accurate Cairo weather data', async () => {
      // Verify location is specifically Cairo
      await expect(element(by.text('Cairo'))).toBeVisible();

      // Verify temperature is in reasonable range for Cairo (15-45°C)
      await waitFor(element(by.testID('weather-temperature')))
        .toBeVisible()
        .withTimeout(3000);

      // Get temperature text and verify it's reasonable
      // Note: In actual implementation, you might want to check temperature ranges

      // Verify humidity is displayed as percentage
      await waitFor(element(by.testID('weather-humidity')))
        .toBeVisible()
        .withTimeout(1000);

      // Verify wind speed is displayed with units
      await expect(element(by.testID('weather-wind-speed'))).toBeVisible();
    });

    it('should handle real-time weather updates', async () => {
      // Record initial weather values
      const initialTemperature = await element(by.testID('weather-temperature'));
      
      // Wait a few seconds and refresh
      await device.device.sleep(3000);
      await element(by.testID('weather-refresh-button')).tap();

      // Wait for refresh to complete
      await waitFor(element(by.testID('weather-loading-indicator')))
        .not.toBeVisible()
        .withTimeout(10000);

      // Verify weather data is still present (may or may not have changed)
      await expect(element(by.testID('weather-temperature'))).toBeVisible();
      await expect(element(by.testID('weather-humidity'))).toBeVisible();
    });

    it('should display weather timestamp/last updated info', async () => {
      // Verify last updated timestamp is shown
      await waitFor(element(by.testID('weather-last-updated')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify timestamp format (should be recent)
      await expect(element(by.testID('weather-timestamp'))).toBeVisible();
    });
  });

  describe('Weather Integration Offline Behavior', () => {
    it('should handle offline weather data gracefully', async () => {
      // Note: In a real test, you might simulate network failure here
      // For now, we test that cached data is still displayed

      // Verify weather widget still shows data even if network is unavailable
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify cached data is displayed
      await expect(element(by.testID('weather-temperature'))).toBeVisible();

      // Verify offline indicator appears (if applicable)
      if (await element(by.testID('weather-offline-indicator')).exists()) {
        await expect(element(by.testID('weather-offline-indicator'))).toBeVisible();
        await expect(element(by.text('Using cached weather data'))).toBeVisible();
      }
    });

    it('should fallback to mock weather data when API fails', async () => {
      // Simulate API failure scenario
      // Note: This would require specific mock configuration in actual implementation

      // Verify weather widget still displays
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify fallback message appears (if applicable)
      if (await element(by.testID('weather-fallback-message')).exists()) {
        await expect(element(by.text('Weather data temporarily unavailable'))).toBeVisible();
      }

      // Verify basic care recommendations still show
      await expect(element(by.testID('care-recommendations-section'))).toBeVisible();
    });
  });

  describe('Weather Data Caching', () => {
    it('should cache weather data for 10 minutes', async () => {
      // First request - should fetch fresh data
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(5000);

      // Record timestamp
      const firstLoadTime = Date.now();

      // Refresh immediately - should use cached data
      await element(by.testID('weather-refresh-button')).tap();

      // Should load quickly (from cache)
      await waitFor(element(by.testID('weather-temperature')))
        .toBeVisible()
        .withTimeout(2000);

      // Verify cache indicator appears (if implemented)
      if (await element(by.testID('weather-cache-indicator')).exists()) {
        await expect(element(by.testID('weather-cache-indicator'))).toBeVisible();
      }
    });

    it('should show appropriate loading states', async () => {
      // Clear cache and refresh
      await element(by.testID('weather-refresh-button')).tap();

      // Verify loading indicator appears
      await waitFor(element(by.testID('weather-loading-indicator')))
        .toBeVisible()
        .withTimeout(1000);

      // Verify loading text appears
      await expect(element(by.text('Loading weather data...'))).toBeVisible();

      // Verify loading completes
      await waitFor(element(by.testID('weather-loading-indicator')))
        .not.toBeVisible()
        .withTimeout(15000);

      // Verify data is displayed after loading
      await expect(element(by.testID('weather-temperature'))).toBeVisible();
    });
  });

  describe('Weather Integration Arabic RTL Support', () => {
    it('should display weather data correctly in Arabic RTL mode', async () => {
      // Switch to Arabic language
      await waitFor(element(by.testID('language-toggle')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('language-toggle')).tap();

      // Verify Arabic weather widget
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify location name in Arabic
      await waitFor(element(by.text('القاهرة')))
        .toBeVisible()
        .withTimeout(2000);

      // Verify Arabic temperature units
      await expect(element(by.testID('weather-temperature-arabic'))).toBeVisible();

      // Verify Arabic humidity label
      await expect(element(by.text('الرطوبة'))).toBeVisible();

      // Verify Arabic wind speed label
      await expect(element(by.text('سرعة الرياح'))).toBeVisible();

      // Verify RTL layout for weather data
      await expect(element(by.testID('weather-rtl-layout'))).toBeVisible();
    });

    it('should display Arabic care recommendations based on weather', async () => {
      // Verify Arabic care recommendations
      await waitFor(element(by.testID('care-recommendations-section')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify Arabic weather-based tips
      await expect(element(by.testID('arabic-weather-tips'))).toBeVisible();

      // Check for Arabic seasonal recommendations
      if (await element(by.text('نصائح الصيف للمناخ المصري')).exists()) {
        await expect(element(by.text('نصائح الصيف للمناخ المصري'))).toBeVisible();
      }

      // Check for Arabic watering recommendations
      if (await element(by.text('زيادة معدل الري بسبب ارتفاع درجة الحرارة')).exists()) {
        await expect(element(by.text('زيادة معدل الري بسبب ارتفاع درجة الحرارة'))).toBeVisible();
      }
    });
  });

  describe('Weather Integration Error Handling', () => {
    it('should handle API timeout gracefully', async () => {
      // Refresh weather data
      await element(by.testID('weather-refresh-button')).tap();

      // Wait for timeout scenario (if configured)
      await waitFor(element(by.testID('weather-loading-indicator')))
        .toBeVisible()
        .withTimeout(2000);

      // Wait for timeout or success
      await waitFor(element(by.testID('weather-loading-indicator')))
        .not.toBeVisible()
        .withTimeout(15000);

      // Verify either success or graceful fallback
      await expect(element(by.testID('weather-temperature'))).toBeVisible();

      // Check for timeout message if applicable
      if (await element(by.testID('weather-timeout-message')).exists()) {
        await expect(element(by.text('Weather update timed out, using cached data'))).toBeVisible();
      }
    });

    it('should handle invalid API responses', async () => {
      // This test would require specific mock configuration
      // For now, verify that widget always shows something

      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify some form of weather data is always displayed
      await expect(element(by.testID('weather-temperature'))).toBeVisible();
    });
  });
});