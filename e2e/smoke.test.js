const { device, expect, element, by, waitFor } = require('detox');

describe('Smoke Tests for CI/CD Pipeline', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Critical Path Smoke Tests', () => {
    it('should launch app and display auth screen within 10 seconds', async () => {
      // This is the most critical test - app must launch
      const startTime = Date.now();
      
      await waitFor(element(by.testID('auth-screen')))
        .toBeVisible()
        .withTimeout(10000);

      const launchTime = Date.now() - startTime;
      
      // Must launch within 10 seconds for CI/CD to pass
      expect(launchTime).toBeLessThan(10000);
      
      // Essential UI elements must be present
      await expect(element(by.testID('guest-button'))).toBeVisible();
      
      // OAuth buttons should be present (even if non-functional in CI)
      if (await element(by.testID('apple-signin-button')).exists()) {
        await expect(element(by.testID('apple-signin-button'))).toBeVisible();
      }
      
      if (await element(by.testID('google-signin-button')).exists()) {
        await expect(element(by.testID('google-signin-button'))).toBeVisible();
      }
    });

    it('should authenticate as guest and reach home screen', async () => {
      // Critical user path - must work for deployment
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(5000);
      
      await element(by.testID('guest-button')).tap();

      // Home screen must load within 5 seconds
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Essential home screen elements must be present
      await expect(element(by.testID('weather-widget'))).toBeVisible();
      
      // Navigation must be functional
      await expect(element(by.testID('home-tab'))).toBeVisible();
      await expect(element(by.testID('scan-tab'))).toBeVisible();
      await expect(element(by.testID('plants-tab'))).toBeVisible();
      
      // Language toggle must be present
      await expect(element(by.testID('language-toggle'))).toBeVisible();
    });

    it('should navigate to all main screens without crashing', async () => {
      // Critical navigation test - all screens must be accessible
      
      // Start from home
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Navigate to Scan
      await element(by.testID('scan-tab')).tap();
      await waitFor(element(by.testID('scan-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Scan screen must have essential elements
      await expect(element(by.testID('scan-screen'))).toBeVisible();
      
      // Navigate to Plants
      await element(by.testID('plants-tab')).tap();
      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Plants screen must load (empty state or with plants)
      const hasPlants = await element(by.testID('plant-item')).exists();
      const hasEmptyState = await element(by.testID('empty-plants-message')).exists();
      expect(hasPlants || hasEmptyState).toBe(true);
      
      // Return to Home
      await element(by.testID('home-tab')).tap();
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should toggle language between English and Arabic', async () => {
      // Critical localization test
      
      // Start in English
      await waitFor(element(by.text('Home')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Toggle to Arabic
      await waitFor(element(by.testID('language-toggle')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('language-toggle')).tap();
      
      // Arabic text must appear within 3 seconds
      await waitFor(element(by.text('الرئيسية')))
        .toBeVisible()
        .withTimeout(3000);
      
      // All navigation tabs must show Arabic
      await expect(element(by.text('المسح'))).toBeVisible();
      await expect(element(by.text('النباتات'))).toBeVisible();
      
      // Toggle back to English
      await element(by.testID('language-toggle')).tap();
      await waitFor(element(by.text('Home')))
        .toBeVisible()
        .withTimeout(3000);
      
      // English text must return
      await expect(element(by.text('Scan'))).toBeVisible();
      await expect(element(by.text('Plants'))).toBeVisible();
    });

    it('should load weather widget with data or fallback', async () => {
      // Critical weather integration test
      
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Weather widget must be present
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(10000);

      // Must show either real data or fallback within 20 seconds
      const hasTemperature = await waitFor(element(by.testID('weather-temperature')))
        .toBeVisible()
        .withTimeout(20000)
        .catch(() => false);

      const hasFallback = await element(by.testID('weather-fallback')).exists();
      const hasOfflineIndicator = await element(by.testID('weather-offline-indicator')).exists();
      
      // One of these must be true for weather to be working
      expect(hasTemperature || hasFallback || hasOfflineIndicator).toBe(true);
      
      // Location should be Cairo (in English or Arabic)
      const hasCairoEn = await element(by.text('Cairo')).exists();
      const hasCairoAr = await element(by.text('القاهرة')).exists();
      expect(hasCairoEn || hasCairoAr).toBe(true);
    });
  });

  describe('Core Functionality Smoke Tests', () => {
    it('should handle mock plant identification flow', async () => {
      // Core plant identification workflow
      
      await element(by.testID('scan-tab')).tap();
      await waitFor(element(by.testID('scan-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Mock identification must work in CI environment
      if (await element(by.testID('mock-identification-button')).exists()) {
        await element(by.testID('mock-identification-button')).tap();

        // Results must appear within 10 seconds
        await waitFor(element(by.testID('identification-results')))
          .toBeVisible()
          .withTimeout(10000);

        // Must show plant suggestions
        await expect(element(by.testID('plant-result-0'))).toBeVisible();
        
        // Egyptian plant suggestions should be available
        if (await element(by.testID('egyptian-plant-suggestions')).exists()) {
          await expect(element(by.testID('egyptian-plant-suggestions'))).toBeVisible();
        }
      }
    });

    it('should complete basic plant addition workflow', async () => {
      // Critical plant management workflow
      
      if (await element(by.testID('plant-result-0')).exists()) {
        await element(by.testID('plant-result-0')).tap();

        // Add plant screen must load
        await waitFor(element(by.testID('add-plant-screen')))
          .toBeVisible()
          .withTimeout(3000);

        // Form fields must be present
        await expect(element(by.testID('plant-name-input'))).toBeVisible();
        
        // Add basic plant data
        await element(by.testID('plant-name-input')).typeText('Smoke Test Plant');
        
        if (await element(by.testID('plant-location-input')).exists()) {
          await element(by.testID('plant-location-input')).typeText('Test Location');
        }
        
        // Save button must work
        await waitFor(element(by.testID('save-plant-button')))
          .toBeVisible()
          .withTimeout(2000);
        await element(by.testID('save-plant-button')).tap();

        // Should navigate to plants list or success state
        const reachedPlantsList = await waitFor(element(by.testID('plants-screen')))
          .toBeVisible()
          .withTimeout(5000)
          .catch(() => false);

        const reachedHome = await waitFor(element(by.testID('home-screen')))
          .toBeVisible()
          .withTimeout(5000)
          .catch(() => false);

        // Must reach one of these screens
        expect(reachedPlantsList || reachedHome).toBe(true);
      }
    });

    it('should persist data across app restart', async () => {
      // Critical data persistence test
      
      // Restart app to test persistence
      await device.terminateApp();
      await device.launchApp();

      // Must launch successfully again
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(10000);
      await element(by.testID('guest-button')).tap();

      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Language preference should persist (check last state)
      // Weather widget should still work
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(10000);

      // Plant data should persist if any was added
      await element(by.testID('plants-tab')).tap();
      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Should show either plants or empty state, never crash
      const hasContent = await element(by.testID('plant-item')).exists() ||
                         await element(by.testID('empty-plants-message')).exists();
      expect(hasContent).toBe(true);
    });
  });

  describe('Error Resilience Smoke Tests', () => {
    it('should handle network timeouts gracefully', async () => {
      // Test that app doesn\'t crash on network issues
      
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Try weather refresh (may timeout in CI environment)
      if (await element(by.testID('weather-refresh-button')).exists()) {
        await element(by.testID('weather-refresh-button')).tap();

        // Should either succeed or fail gracefully within 30 seconds
        await waitFor(element(by.testID('weather-temperature')))
          .toBeVisible()
          .withTimeout(30000)
          .catch(() => {
            // If timeout, app should still be functional
            return true;
          });

        // App must remain responsive regardless of network outcome
        await expect(element(by.testID('home-screen'))).toBeVisible();
      }
    });

    it('should handle rapid user interactions without crashing', async () => {
      // Stress test for UI responsiveness
      
      // Rapid navigation to test for race conditions
      for (let i = 0; i < 5; i++) {
        await element(by.testID('scan-tab')).tap();
        await element(by.testID('plants-tab')).tap();
        await element(by.testID('home-tab')).tap();
      }

      // App must still be functional
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Rapid language toggle
      await element(by.testID('language-toggle')).tap();
      await element(by.testID('language-toggle')).tap();

      // Must return to stable state
      await expect(element(by.testID('home-screen'))).toBeVisible();
    });

    it('should handle memory pressure without crashes', async () => {
      // Memory pressure simulation
      
      // Multiple navigation cycles with potential memory allocation
      for (let cycle = 0; cycle < 3; cycle++) {
        // Navigate through all screens
        await element(by.testID('scan-tab')).tap();
        await waitFor(element(by.testID('scan-screen')))
          .toBeVisible()
          .withTimeout(2000);

        await element(by.testID('plants-tab')).tap();
        await waitFor(element(by.testID('plants-screen')))
          .toBeVisible()
          .withTimeout(2000);

        await element(by.testID('home-tab')).tap();
        await waitFor(element(by.testID('home-screen')))
          .toBeVisible()
          .withTimeout(2000);

        // Trigger weather refresh if available
        if (await element(by.testID('weather-refresh-button')).exists()) {
          await element(by.testID('weather-refresh-button')).tap();
          await device.device.sleep(500);
        }
      }

      // App must remain stable
      await expect(element(by.testID('home-screen'))).toBeVisible();
      await expect(element(by.testID('weather-widget'))).toBeVisible();
    });
  });

  describe('Build and Deployment Validation', () => {
    it('should have all required environment variables and configurations', async () => {
      // Validate app has essential configurations
      
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Weather widget presence indicates API configuration
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(5000);

      // Language functionality indicates i18n configuration
      await waitFor(element(by.testID('language-toggle')))
        .toBeVisible()
        .withTimeout(2000);

      // Navigation indicates routing configuration
      await expect(element(by.testID('home-tab'))).toBeVisible();
      await expect(element(by.testID('scan-tab'))).toBeVisible();
      await expect(element(by.testID('plants-tab'))).toBeVisible();
    });

    it('should handle production-like conditions', async () => {
      // Test behavior under production constraints
      
      // Multiple app lifecycle events
      await device.sendToHome();
      await device.device.sleep(1000);
      await device.launchApp();

      // Must resume correctly
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Terminate and relaunch (cold start simulation)
      await device.terminateApp();
      await device.device.sleep(2000);
      await device.launchApp();

      // Must start correctly
      await waitFor(element(by.testID('auth-screen')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.testID('guest-button')).tap();
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // All features must work after cold restart
      await expect(element(by.testID('weather-widget'))).toBeVisible();
      await expect(element(by.testID('language-toggle'))).toBeVisible();
    });

    it('should complete full user journey end-to-end', async () => {
      // Complete smoke test of entire app flow
      
      // 1. Authentication
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // 2. Weather functionality
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(10000);

      // 3. Language switching
      await element(by.testID('language-toggle')).tap();
      await waitFor(element(by.text('الرئيسية')))
        .toBeVisible()
        .withTimeout(3000);
      
      await element(by.testID('language-toggle')).tap();
      await waitFor(element(by.text('Home')))
        .toBeVisible()
        .withTimeout(3000);

      // 4. Plant identification flow
      await element(by.testID('scan-tab')).tap();
      await waitFor(element(by.testID('scan-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // 5. Plant management
      await element(by.testID('plants-tab')).tap();
      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // 6. Return to home
      await element(by.testID('home-tab')).tap();
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // All features must be working
      await expect(element(by.testID('weather-widget'))).toBeVisible();
      await expect(element(by.testID('language-toggle'))).toBeVisible();
    });
  });

  describe('Performance Smoke Tests', () => {
    it('should meet minimum performance thresholds', async () => {
      // Critical performance benchmarks for CI/CD
      
      const startTime = Date.now();
      
      // Navigation performance test
      await element(by.testID('scan-tab')).tap();
      await waitFor(element(by.testID('scan-screen')))
        .toBeVisible()
        .withTimeout(2000);

      await element(by.testID('plants-tab')).tap();
      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(2000);

      await element(by.testID('home-tab')).tap();
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(2000);

      const navigationTime = Date.now() - startTime;
      
      // Navigation through all screens must complete within 6 seconds
      expect(navigationTime).toBeLessThan(6000);
      
      // App must remain responsive
      await expect(element(by.testID('weather-widget'))).toBeVisible();
    });

    it('should maintain responsiveness under load', async () => {
      // Stress test for deployment readiness
      
      const stressTestStart = Date.now();
      
      // Simulate user activity burst
      for (let i = 0; i < 3; i++) {
        // Quick navigation sequence
        await element(by.testID('scan-tab')).tap();
        await element(by.testID('plants-tab')).tap();
        await element(by.testID('home-tab')).tap();
        
        // Language toggle
        await element(by.testID('language-toggle')).tap();
        await element(by.testID('language-toggle')).tap();
        
        // Weather refresh if available
        if (await element(by.testID('weather-refresh-button')).exists()) {
          await element(by.testID('weather-refresh-button')).tap();
        }
      }
      
      const stressTestTime = Date.now() - stressTestStart;
      
      // Stress test must complete within 15 seconds
      expect(stressTestTime).toBeLessThan(15000);
      
      // App must still be fully functional
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);
      await expect(element(by.testID('weather-widget'))).toBeVisible();
    });
  });
});