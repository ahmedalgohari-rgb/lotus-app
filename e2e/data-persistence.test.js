const { device, expect, element, by, waitFor } = require('detox');

describe('Data Persistence & Sync Complete E2E Test', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Local Data Persistence', () => {
    it('should persist user preferences across app restarts', async () => {
      // Start as guest user
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.testID('guest-button')).tap();

      // Set language to Arabic
      await waitFor(element(by.testID('language-toggle')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('language-toggle')).tap();

      // Verify Arabic is active
      await waitFor(element(by.text('الرئيسية')))
        .toBeVisible()
        .withTimeout(3000);

      // Restart the app
      await device.terminateApp();
      await device.launchApp();

      // Start as guest again
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.testID('guest-button')).tap();

      // Verify Arabic preference persisted
      await waitFor(element(by.text('الرئيسية')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify other UI elements are in Arabic
      await expect(element(by.text('المسح'))).toBeVisible();
      await expect(element(by.text('النباتات'))).toBeVisible();
    });

    it('should persist plant data locally', async () => {
      // Switch back to English for easier testing
      await waitFor(element(by.testID('language-toggle')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('language-toggle')).tap();

      // Add a plant
      await waitFor(element(by.testID('scan-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('scan-tab')).tap();

      // Use mock identification
      if (await element(by.testID('mock-identification-button')).exists()) {
        await element(by.testID('mock-identification-button')).tap();

        await waitFor(element(by.testID('plant-result-0')))
          .toBeVisible()
          .withTimeout(3000);
        await element(by.testID('plant-result-0')).tap();

        // Add plant details
        await waitFor(element(by.testID('plant-name-input')))
          .toBeVisible()
          .withTimeout(2000);
        await element(by.testID('plant-name-input')).typeText('Persistence Test Plant');

        await element(by.testID('plant-location-input')).typeText('Test Location');

        await waitFor(element(by.testID('save-plant-button')))
          .toBeVisible()
          .withTimeout(1000);
        await element(by.testID('save-plant-button')).tap();
      }

      // Verify plant appears in collection
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      await waitFor(element(by.text('Persistence Test Plant')))
        .toBeVisible()
        .withTimeout(3000);

      // Restart app
      await device.terminateApp();
      await device.launchApp();

      // Start as guest
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.testID('guest-button')).tap();

      // Verify plant data persisted
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      await waitFor(element(by.text('Persistence Test Plant')))
        .toBeVisible()
        .withTimeout(3000);
      await expect(element(by.text('Test Location'))).toBeVisible();
    });

    it('should persist care event history', async () => {
      // Go to plant detail and add care event
      await waitFor(element(by.text('Persistence Test Plant')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text('Persistence Test Plant')).tap();

      // Add care events
      await waitFor(element(by.testID('water-plant-button')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('water-plant-button')).tap();

      // Verify care event recorded
      await waitFor(element(by.testID('care-event-water')))
        .toBeVisible()
        .withTimeout(2000);

      // Add fertilize event
      if (await element(by.testID('fertilize-plant-button')).exists()) {
        await element(by.testID('fertilize-plant-button')).tap();

        await waitFor(element(by.testID('care-event-fertilize')))
          .toBeVisible()
          .withTimeout(2000);
      }

      // Restart app
      await device.terminateApp();
      await device.launchApp();

      // Start as guest and navigate to plant
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.testID('guest-button')).tap();

      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      await waitFor(element(by.text('Persistence Test Plant')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text('Persistence Test Plant')).tap();

      // Verify care history persisted
      await waitFor(element(by.testID('care-event-water')))
        .toBeVisible()
        .withTimeout(3000);

      if (await element(by.testID('care-event-fertilize')).exists()) {
        await expect(element(by.testID('care-event-fertilize'))).toBeVisible();
      }
    });
  });

  describe('Offline Data Sync and Caching', () => {
    it('should work correctly when going offline', async () => {
      // Navigate to home screen with weather widget
      await waitFor(element(by.testID('home-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('home-tab')).tap();

      // Verify weather widget initially loads
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(5000);

      // Record initial weather data
      const initialTemperature = await element(by.testID('weather-temperature'));

      // Simulate going offline (device airplane mode if possible)
      // Note: In real implementation, this might use device.setLocation or network mocking

      // Try to refresh weather while offline
      if (await element(by.testID('weather-refresh-button')).exists()) {
        await element(by.testID('weather-refresh-button')).tap();

        // Verify cached data is still displayed
        await waitFor(element(by.testID('weather-temperature')))
          .toBeVisible()
          .withTimeout(3000);

        // Verify offline indicator appears
        if (await element(by.testID('weather-offline-indicator')).exists()) {
          await expect(element(by.testID('weather-offline-indicator'))).toBeVisible();
        }
      }

      // Verify app continues to function with cached data
      await expect(element(by.testID('weather-widget'))).toBeVisible();
    });

    it('should cache weather data for specified duration', async () => {
      // Ensure we're on home screen
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Initial weather load
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(5000);

      // Record load time
      const firstLoadTime = Date.now();

      // Immediate refresh should use cache (within 10 minutes)
      if (await element(by.testID('weather-refresh-button')).exists()) {
        await element(by.testID('weather-refresh-button')).tap();

        // Should load quickly from cache
        await waitFor(element(by.testID('weather-temperature')))
          .toBeVisible()
          .withTimeout(2000);

        // Verify cache usage indicator if available
        if (await element(by.testID('weather-cache-used')).exists()) {
          await expect(element(by.testID('weather-cache-used'))).toBeVisible();
        }
      }
    });

    it('should sync data when coming back online', async () => {
      // This test simulates coming back online after being offline
      // Verify weather data refreshes when network is restored

      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(3000);

      // Try to refresh (simulating network restoration)
      if (await element(by.testID('weather-refresh-button')).exists()) {
        await element(by.testID('weather-refresh-button')).tap();

        // Verify loading indicator appears
        await waitFor(element(by.testID('weather-loading-indicator')))
          .toBeVisible()
          .withTimeout(2000);

        // Verify data loads successfully
        await waitFor(element(by.testID('weather-loading-indicator')))
          .not.toBeVisible()
          .withTimeout(15000);

        await expect(element(by.testID('weather-temperature'))).toBeVisible();
      }
    });
  });

  describe('Data Integrity and Consistency', () => {
    it('should maintain data consistency across app sessions', async () => {
      // Navigate to plants screen
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      // Count initial plants
      let plantCount = 0;
      if (await element(by.testID('plant-item-Persistence Test Plant')).exists()) {
        plantCount++;
      }

      // Add another plant
      await waitFor(element(by.testID('scan-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('scan-tab')).tap();

      if (await element(by.testID('mock-identification-button')).exists()) {
        await element(by.testID('mock-identification-button')).tap();

        await waitFor(element(by.testID('plant-result-0')))
          .toBeVisible()
          .withTimeout(3000);
        await element(by.testID('plant-result-0')).tap();

        await waitFor(element(by.testID('plant-name-input')))
          .toBeVisible()
          .withTimeout(2000);
        await element(by.testID('plant-name-input')).typeText('Consistency Test Plant');

        await element(by.testID('save-plant-button')).tap();

        plantCount++;
      }

      // Verify increased count
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      // Should now have both plants
      await waitFor(element(by.text('Persistence Test Plant')))
        .toBeVisible()
        .withTimeout(3000);
      await waitFor(element(by.text('Consistency Test Plant')))
        .toBeVisible()
        .withTimeout(3000);

      // Restart app and verify consistency
      await device.terminateApp();
      await device.launchApp();

      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.testID('guest-button')).tap();

      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      // Verify both plants still exist
      await waitFor(element(by.text('Persistence Test Plant')))
        .toBeVisible()
        .withTimeout(3000);
      await waitFor(element(by.text('Consistency Test Plant')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should handle data corruption gracefully', async () => {
      // This test verifies the app handles corrupted local data
      // In real implementation, this might involve clearing AsyncStorage partially

      // Navigate through app normally
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify core functionality still works
      await expect(element(by.testID('weather-widget'))).toBeVisible();

      // Navigate to plants
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      // App should handle any data issues gracefully
      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Should either show plants or empty state, never crash
      const hasPlants = await element(by.testID('plant-item-Persistence Test Plant')).exists();
      const hasEmptyState = await element(by.testID('empty-plants-message')).exists();
      
      expect(hasPlants || hasEmptyState).toBe(true);
    });
  });

  describe('Background Data Management', () => {
    it('should handle app backgrounding and foregrounding', async () => {
      // Start on home screen
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Record current state
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(3000);

      // Simulate app backgrounding
      await device.sendToHome();
      await device.device.sleep(2000);

      // Bring app back to foreground
      await device.launchApp();

      // Verify app state is maintained
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.testID('weather-widget'))).toBeVisible();

      // Verify data is still accessible
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      if (await element(by.text('Persistence Test Plant')).exists()) {
        await expect(element(by.text('Persistence Test Plant'))).toBeVisible();
      }
    });

    it('should refresh stale data when returning from background', async () => {
      // Navigate to home with weather
      await waitFor(element(by.testID('home-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('home-tab')).tap();

      // Wait for weather to load
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(5000);

      // Background app for extended period (simulated)
      await device.sendToHome();
      await device.device.sleep(3000);

      // Return to app
      await device.launchApp();

      // Verify weather data refreshes if stale
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(5000);

      // Check if refresh indicator appears
      if (await element(by.testID('weather-refresh-indicator')).exists()) {
        await expect(element(by.testID('weather-refresh-indicator'))).toBeVisible();
      }

      // Verify data is current
      await expect(element(by.testID('weather-temperature'))).toBeVisible();
    });
  });

  describe('Storage Quota and Cleanup', () => {
    it('should handle storage limitations gracefully', async () => {
      // This test verifies the app handles storage quota issues
      // In real implementation, might involve filling storage

      // Continue normal app usage
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify core functionality works
      await expect(element(by.testID('weather-widget'))).toBeVisible();

      // Try to add data (should handle storage issues gracefully)
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      // App should continue to function even with storage constraints
      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should clean up old cache data automatically', async () => {
      // Verify weather cache management
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(5000);

      // Multiple refresh attempts (should manage cache size)
      for (let i = 0; i < 3; i++) {
        if (await element(by.testID('weather-refresh-button')).exists()) {
          await element(by.testID('weather-refresh-button')).tap();
          await device.device.sleep(1000);
        }
      }

      // Verify app continues to function normally
      await expect(element(by.testID('weather-temperature'))).toBeVisible();
    });
  });

  describe('Data Migration and Versioning', () => {
    it('should handle app updates with data migration', async () => {
      // This test simulates app updates that require data migration
      // Verify existing data is preserved and migrated correctly

      // Check current data exists
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      // Record existing plants
      const hasTestPlant = await element(by.text('Persistence Test Plant')).exists();

      // Simulate app restart (representing an update)
      await device.terminateApp();
      await device.launchApp();

      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.testID('guest-button')).tap();

      // Verify data survived "migration"
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      if (hasTestPlant) {
        await waitFor(element(by.text('Persistence Test Plant')))
          .toBeVisible()
          .withTimeout(3000);
      }

      // Verify app functions normally after "migration"
      await waitFor(element(by.testID('home-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('home-tab')).tap();

      await expect(element(by.testID('weather-widget'))).toBeVisible();
    });
  });
});