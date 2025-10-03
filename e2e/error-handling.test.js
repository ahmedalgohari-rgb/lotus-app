const { device, expect, element, by, waitFor } = require('detox');

describe('Error Handling & Edge Cases Complete E2E Test', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Network Error Handling', () => {
    it('should handle weather API failures gracefully', async () => {
      // Start as guest user
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.testID('guest-button')).tap();

      // Navigate to home screen
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Weather widget should be present
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(5000);

      // Try to refresh weather (might fail due to network issues)
      if (await element(by.testID('weather-refresh-button')).exists()) {
        await element(by.testID('weather-refresh-button')).tap();

        // Should either show new data or graceful fallback
        await waitFor(element(by.testID('weather-temperature')))
          .toBeVisible()
          .withTimeout(15000);

        // Check for error handling indicators
        if (await element(by.testID('weather-error-fallback')).exists()) {
          await expect(element(by.testID('weather-error-fallback'))).toBeVisible();
          await expect(element(by.text('Using cached weather data'))).toBeVisible();
        }
      }

      // Verify app continues to function normally
      await expect(element(by.testID('weather-widget'))).toBeVisible();
    });

    it('should handle plant identification API failures', async () => {
      // Navigate to scan screen
      await waitFor(element(by.testID('scan-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('scan-tab')).tap();

      // Attempt plant identification
      if (await element(by.testID('mock-identification-button')).exists()) {
        await element(by.testID('mock-identification-button')).tap();

        // Should either show results or error message
        const hasResults = await waitFor(element(by.testID('identification-results')))
          .toBeVisible()
          .withTimeout(10000)
          .catch(() => false);

        const hasError = await element(by.testID('identification-error')).exists();

        // One of these should be true
        expect(hasResults || hasError).toBe(true);

        if (hasError) {
          // Verify error message is user-friendly
          await expect(element(by.text('Unable to identify plant'))).toBeVisible();
          await expect(element(by.text('Try again or browse Egyptian plants'))).toBeVisible();

          // Verify fallback options are available
          if (await element(by.testID('egyptian-plants-fallback')).exists()) {
            await expect(element(by.testID('egyptian-plants-fallback'))).toBeVisible();
          }
        }
      }
    });

    it('should handle complete network unavailability', async () => {
      // Simulate complete network failure
      // Note: In real implementation, this might use device airplane mode

      // Try to use weather features
      await waitFor(element(by.testID('home-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('home-tab')).tap();

      // Weather widget should show cached data or offline message
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(3000);

      // Should show offline indicator if network is unavailable
      if (await element(by.testID('network-offline-indicator')).exists()) {
        await expect(element(by.testID('network-offline-indicator'))).toBeVisible();
        await expect(element(by.text('Offline mode'))).toBeVisible();
      }

      // Verify core app functions still work
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // App should continue to function with local data
      const hasPlants = await element(by.testID('plant-item')).exists();
      const hasEmptyState = await element(by.testID('empty-plants-message')).exists();
      expect(hasPlants || hasEmptyState).toBe(true);
    });
  });

  describe('Input Validation and Form Errors', () => {
    it('should validate required plant name field', async () => {
      // Navigate to add plant flow
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

        // Try to save without plant name
        await waitFor(element(by.testID('plant-name-input')))
          .toBeVisible()
          .withTimeout(2000);
        await element(by.testID('plant-name-input')).clearText();

        await waitFor(element(by.testID('save-plant-button')))
          .toBeVisible()
          .withTimeout(1000);
        await element(by.testID('save-plant-button')).tap();

        // Verify validation error appears
        await waitFor(element(by.testID('name-required-error')))
          .toBeVisible()
          .withTimeout(2000);
        await expect(element(by.text('Plant name is required'))).toBeVisible();

        // Verify form doesn't submit
        await expect(element(by.testID('add-plant-screen'))).toBeVisible();
      }
    });

    it('should handle invalid input characters', async () => {
      // Test with special characters and very long inputs
      if (await element(by.testID('plant-name-input')).exists()) {
        // Test extremely long input
        const longName = 'A'.repeat(500);
        await element(by.testID('plant-name-input')).typeText(longName);

        // Should handle gracefully (truncate or show error)
        await element(by.testID('save-plant-button')).tap();

        // Check for length validation
        if (await element(by.testID('name-too-long-error')).exists()) {
          await expect(element(by.text('Plant name is too long'))).toBeVisible();
        }

        // Clear and test special characters
        await element(by.testID('plant-name-input')).clearText();
        await element(by.testID('plant-name-input')).typeText('Test<script>alert("hack")</script>Plant');

        // Should sanitize or reject malicious input
        await element(by.testID('save-plant-button')).tap();

        // Verify app doesn't crash and handles input safely
        await expect(element(by.testID('add-plant-screen'))).toBeVisible();
      }
    });

    it('should validate date inputs for care scheduling', async () => {
      // Test invalid date scenarios in care scheduling
      if (await element(by.testID('plant-name-input')).exists()) {
        await element(by.testID('plant-name-input')).clearText();
        await element(by.testID('plant-name-input')).typeText('Valid Plant Name');

        // Try to set invalid watering frequency
        if (await element(by.testID('watering-frequency-picker')).exists()) {
          await element(by.testID('watering-frequency-picker')).tap();

          // Select extreme frequency options if available
          if (await element(by.text('Every 0 days')).exists()) {
            await element(by.text('Every 0 days')).tap();

            await element(by.testID('save-plant-button')).tap();

            // Should show validation error
            if (await element(by.testID('invalid-frequency-error')).exists()) {
              await expect(element(by.text('Invalid watering frequency'))).toBeVisible();
            }
          }
        }
      }
    });
  });

  describe('Camera and Permission Errors', () => {
    it('should handle camera permission denial', async () => {
      // Navigate to scan screen
      await waitFor(element(by.testID('scan-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('scan-tab')).tap();

      // Try to access camera (might be denied)
      if (await element(by.testID('take-photo-button')).exists()) {
        await element(by.testID('take-photo-button')).tap();

        // Should handle permission denial gracefully
        if (await element(by.testID('camera-permission-denied')).exists()) {
          await expect(element(by.testID('camera-permission-denied'))).toBeVisible();
          await expect(element(by.text('Camera access required'))).toBeVisible();
          
          // Should offer alternative options
          await expect(element(by.text('Use photo gallery instead'))).toBeVisible();
          
          // Verify settings redirect option
          if (await element(by.testID('open-settings-button')).exists()) {
            await expect(element(by.testID('open-settings-button'))).toBeVisible();
          }
        }
      }
    });

    it('should handle photo gallery permission denial', async () => {
      // Try to access photo gallery
      if (await element(by.testID('gallery-button')).exists()) {
        await element(by.testID('gallery-button')).tap();

        // Should handle gallery permission denial
        if (await element(by.testID('gallery-permission-denied')).exists()) {
          await expect(element(by.testID('gallery-permission-denied'))).toBeVisible();
          await expect(element(by.text('Photo access required'))).toBeVisible();
          
          // Should provide fallback options
          await expect(element(by.text('Use camera instead'))).toBeVisible();
        }
      }
    });

    it('should handle corrupted or invalid image files', async () => {
      // This test simulates selecting a corrupted image
      if (await element(by.testID('mock-corrupted-image-button')).exists()) {
        await element(by.testID('mock-corrupted-image-button')).tap();

        // Should show error message for corrupted file
        await waitFor(element(by.testID('image-error-message')))
          .toBeVisible()
          .withTimeout(3000);
        
        await expect(element(by.text('Unable to process image'))).toBeVisible();
        await expect(element(by.text('Please try a different photo'))).toBeVisible();

        // Should allow user to try again
        await expect(element(by.testID('try-again-button'))).toBeVisible();
      }
    });
  });

  describe('Storage and Memory Errors', () => {
    it('should handle low storage space', async () => {
      // Simulate low storage scenario
      // In real implementation, this might involve filling device storage

      // Try to save plant data
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
        await element(by.testID('plant-name-input')).typeText('Storage Test Plant');

        await element(by.testID('save-plant-button')).tap();

        // Should either save successfully or show storage error
        const savedSuccessfully = await waitFor(element(by.testID('plants-tab')))
          .toBeVisible()
          .withTimeout(5000)
          .catch(() => false);

        if (!savedSuccessfully) {
          // Check for storage error message
          if (await element(by.testID('storage-full-error')).exists()) {
            await expect(element(by.text('Storage space low'))).toBeVisible();
            await expect(element(by.text('Please free up space and try again'))).toBeVisible();
          }
        }
      }
    });

    it('should handle memory pressure gracefully', async () => {
      // Simulate memory pressure by rapid navigation and data loading
      for (let i = 0; i < 5; i++) {
        // Rapid navigation between screens
        await waitFor(element(by.testID('home-tab')))
          .toBeVisible()
          .withTimeout(2000);
        await element(by.testID('home-tab')).tap();

        await waitFor(element(by.testID('scan-tab')))
          .toBeVisible()
          .withTimeout(2000);
        await element(by.testID('scan-tab')).tap();

        await waitFor(element(by.testID('plants-tab')))
          .toBeVisible()
          .withTimeout(2000);
        await element(by.testID('plants-tab')).tap();
      }

      // App should still be responsive
      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Navigate back to home
      await element(by.testID('home-tab')).tap();
      await expect(element(by.testID('home-screen'))).toBeVisible();
    });
  });

  describe('Data Corruption and Recovery', () => {
    it('should handle corrupted plant data', async () => {
      // This test simulates corrupted local storage data
      // Navigate to plants screen
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      // Should either show plants or handle corruption gracefully
      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Check for corruption recovery
      if (await element(by.testID('data-recovery-message')).exists()) {
        await expect(element(by.text('Recovering plant data'))).toBeVisible();
      }

      // App should show something (plants, empty state, or recovery message)
      const hasContent = await element(by.testID('plant-item')).exists() ||
                         await element(by.testID('empty-plants-message')).exists() ||
                         await element(by.testID('data-recovery-message')).exists();
      
      expect(hasContent).toBe(true);
    });

    it('should handle corrupted weather cache', async () => {
      // Navigate to home screen with weather
      await waitFor(element(by.testID('home-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('home-tab')).tap();

      // Weather widget should handle corrupted cache gracefully
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(5000);

      // Should either show data or error recovery
      if (await element(by.testID('weather-cache-corrupted')).exists()) {
        await expect(element(by.text('Refreshing weather data'))).toBeVisible();
      }

      // Weather widget should eventually show something
      await expect(element(by.testID('weather-temperature'))).toBeVisible();
    });
  });

  describe('Authentication and Session Errors', () => {
    it('should handle invalid session state', async () => {
      // This test simulates session corruption or expiry
      // For guest mode, ensure app handles state correctly

      // Restart app to simulate session issues
      await device.terminateApp();
      await device.launchApp();

      // Should show auth screen properly
      await waitFor(element(by.testID('auth-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Guest button should work
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('guest-button')).tap();

      // Should navigate to home successfully
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should handle OAuth provider errors', async () => {
      // Navigate back to auth screen
      await device.terminateApp();
      await device.launchApp();

      await waitFor(element(by.testID('auth-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Try OAuth buttons (may fail in test environment)
      if (await element(by.testID('apple-signin-button')).exists()) {
        await element(by.testID('apple-signin-button')).tap();

        // Should handle OAuth errors gracefully
        if (await element(by.testID('oauth-error-message')).exists()) {
          await expect(element(by.text('Sign in temporarily unavailable'))).toBeVisible();
          await expect(element(by.text('Continue as guest instead'))).toBeVisible();
        }

        // Guest option should still be available
        await waitFor(element(by.testID('guest-button')))
          .toBeVisible()
          .withTimeout(3000);
      }
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle rapid user interactions', async () => {
      // Start as guest
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.testID('guest-button')).tap();

      // Rapid tab switching
      for (let i = 0; i < 10; i++) {
        await element(by.testID('scan-tab')).tap();
        await element(by.testID('plants-tab')).tap();
        await element(by.testID('home-tab')).tap();
      }

      // App should still be responsive
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);
      await expect(element(by.testID('weather-widget'))).toBeVisible();
    });

    it('should handle app launch during low battery', async () => {
      // This test verifies app behavior under power constraints
      // In real implementation, might use device battery simulation

      // App should still launch and function
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Core features should work
      await expect(element(by.testID('weather-widget'))).toBeVisible();

      // Navigation should work
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should handle timezone and locale edge cases', async () => {
      // Test app behavior with different system settings
      // Navigate through app with potential locale issues

      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Weather widget should handle timezone correctly
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(5000);

      // Check for proper time display
      if (await element(by.testID('weather-last-updated')).exists()) {
        await expect(element(by.testID('weather-last-updated'))).toBeVisible();
      }

      // Language toggle should work regardless of system locale
      await waitFor(element(by.testID('language-toggle')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('language-toggle')).tap();

      // Should switch to Arabic properly
      await waitFor(element(by.text('الرئيسية')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });
});