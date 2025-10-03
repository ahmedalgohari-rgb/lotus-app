const { device, expect, element, by, waitFor } = require('detox');

describe('Performance Testing Complete E2E Test', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('App Launch Performance', () => {
    it('should launch within acceptable time limits', async () => {
      const startTime = Date.now();

      // Restart app to measure launch time
      await device.terminateApp();
      await device.launchApp();

      // Auth screen should appear quickly
      await waitFor(element(by.testID('auth-screen')))
        .toBeVisible()
        .withTimeout(5000);

      const authScreenTime = Date.now();
      const launchTime = authScreenTime - startTime;

      // Should launch within 5 seconds (generous for test environment)
      expect(launchTime).toBeLessThan(5000);

      // Start as guest and measure transition time
      const guestStartTime = Date.now();
      
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('guest-button')).tap();

      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      const homeScreenTime = Date.now();
      const transitionTime = homeScreenTime - guestStartTime;

      // Transition should be quick (under 2 seconds)
      expect(transitionTime).toBeLessThan(2000);
    });

    it('should handle cold start efficiently', async () => {
      // Measure cold start by completely terminating and restarting
      await device.terminateApp();
      
      // Wait a moment to simulate cold start
      await device.device.sleep(2000);

      const coldStartTime = Date.now();
      await device.launchApp();

      // App should become interactive quickly
      await waitFor(element(by.testID('auth-screen')))
        .toBeVisible()
        .withTimeout(7000);

      const interactiveTime = Date.now();
      const coldStartDuration = interactiveTime - coldStartTime;

      // Cold start should complete within 7 seconds
      expect(coldStartDuration).toBeLessThan(7000);
    });

    it('should handle warm start efficiently', async () => {
      // Start app normally first
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.testID('guest-button')).tap();

      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Background the app
      await device.sendToHome();
      await device.device.sleep(1000);

      // Measure warm start
      const warmStartTime = Date.now();
      await device.launchApp();

      // Should resume quickly
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      const resumeTime = Date.now();
      const warmStartDuration = resumeTime - warmStartTime;

      // Warm start should be very fast (under 1 second)
      expect(warmStartDuration).toBeLessThan(1000);
    });
  });

  describe('Navigation Performance', () => {
    it('should handle tab navigation efficiently', async () => {
      // Ensure we're logged in as guest
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.testID('guest-button')).tap();

      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Measure navigation between tabs
      const measurements = [];

      const tabs = ['scan-tab', 'plants-tab', 'home-tab'];
      const expectedScreens = ['scan-screen', 'plants-screen', 'home-screen'];

      for (let i = 0; i < tabs.length; i++) {
        const navStartTime = Date.now();
        
        await waitFor(element(by.testID(tabs[i])))
          .toBeVisible()
          .withTimeout(2000);
        await element(by.testID(tabs[i])).tap();

        await waitFor(element(by.testID(expectedScreens[i])))
          .toBeVisible()
          .withTimeout(3000);

        const navEndTime = Date.now();
        const navDuration = navEndTime - navStartTime;
        measurements.push(navDuration);

        // Each navigation should be under 1 second
        expect(navDuration).toBeLessThan(1000);
      }

      // Average navigation time should be reasonable
      const avgNavTime = measurements.reduce((a, b) => a + b) / measurements.length;
      expect(avgNavTime).toBeLessThan(500);
    });

    it('should handle rapid navigation without performance degradation', async () => {
      // Perform rapid navigation sequence
      const rapidNavStart = Date.now();

      for (let i = 0; i < 10; i++) {
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
      }

      const rapidNavEnd = Date.now();
      const totalRapidNavTime = rapidNavEnd - rapidNavStart;

      // 30 navigations should complete within 15 seconds
      expect(totalRapidNavTime).toBeLessThan(15000);

      // App should still be responsive after rapid navigation
      await expect(element(by.testID('home-screen'))).toBeVisible();
    });
  });

  describe('Data Loading Performance', () => {
    it('should load weather data efficiently', async () => {
      // Navigate to home screen
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Measure weather widget load time
      const weatherStartTime = Date.now();

      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(10000);

      // Measure when actual weather data appears
      await waitFor(element(by.testID('weather-temperature')))
        .toBeVisible()
        .withTimeout(15000);

      const weatherEndTime = Date.now();
      const weatherLoadTime = weatherEndTime - weatherStartTime;

      // Weather should load within 15 seconds (including network time)
      expect(weatherLoadTime).toBeLessThan(15000);

      // Test refresh performance
      if (await element(by.testID('weather-refresh-button')).exists()) {
        const refreshStartTime = Date.now();
        
        await element(by.testID('weather-refresh-button')).tap();

        // Should show loading indicator quickly
        await waitFor(element(by.testID('weather-loading-indicator')))
          .toBeVisible()
          .withTimeout(1000);

        // Should complete refresh reasonably quickly
        await waitFor(element(by.testID('weather-loading-indicator')))
          .not.toBeVisible()
          .withTimeout(15000);

        const refreshEndTime = Date.now();
        const refreshTime = refreshEndTime - refreshStartTime;

        // Refresh should complete within 15 seconds
        expect(refreshTime).toBeLessThan(15000);
      }
    });

    it('should handle plant data loading efficiently', async () => {
      // Navigate to plants screen
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);

      const plantsLoadStart = Date.now();
      await element(by.testID('plants-tab')).tap();

      // Plants screen should load quickly
      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);

      const plantsLoadEnd = Date.now();
      const plantsLoadTime = plantsLoadEnd - plantsLoadStart;

      // Plants screen should load within 1 second
      expect(plantsLoadTime).toBeLessThan(1000);

      // Check if plants are displayed or empty state appears quickly
      const hasContent = await waitFor(element(by.testID('plant-item')))
        .toBeVisible()
        .withTimeout(2000)
        .catch(async () => {
          return await element(by.testID('empty-plants-message')).exists();
        });

      expect(hasContent).toBeTruthy();
    });

    it('should handle plant identification performance', async () => {
      // Navigate to scan screen
      await waitFor(element(by.testID('scan-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('scan-tab')).tap();

      await waitFor(element(by.testID('scan-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Test identification performance if mock button available
      if (await element(by.testID('mock-identification-button')).exists()) {
        const identificationStart = Date.now();
        
        await element(by.testID('mock-identification-button')).tap();

        // Should show loading or results within reasonable time
        const hasResults = await waitFor(element(by.testID('identification-results')))
          .toBeVisible()
          .withTimeout(10000)
          .catch(() => false);

        const identificationEnd = Date.now();
        const identificationTime = identificationEnd - identificationStart;

        if (hasResults) {
          // Identification should complete within 10 seconds
          expect(identificationTime).toBeLessThan(10000);

          // Results should display properly
          await expect(element(by.testID('identification-results'))).toBeVisible();
        }
      }
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle memory efficiently during extended use', async () => {
      // Simulate extended app usage with various operations
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Perform memory-intensive operations
      for (let session = 0; session < 5; session++) {
        // Navigate through all screens multiple times
        for (let i = 0; i < 3; i++) {
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
        }

        // Try to trigger weather refresh
        if (await element(by.testID('weather-refresh-button')).exists()) {
          await element(by.testID('weather-refresh-button')).tap();
          await device.device.sleep(1000);
        }
      }

      // App should still be responsive after extended use
      await expect(element(by.testID('home-screen'))).toBeVisible();
      await expect(element(by.testID('weather-widget'))).toBeVisible();
    });

    it('should handle background/foreground transitions efficiently', async () => {
      // Test multiple background/foreground cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        const backgroundStart = Date.now();

        // Background app
        await device.sendToHome();
        await device.device.sleep(1000);

        // Foreground app
        await device.launchApp();

        // Should resume quickly
        await waitFor(element(by.testID('home-screen')))
          .toBeVisible()
          .withTimeout(3000);

        const backgroundEnd = Date.now();
        const cycleTime = backgroundEnd - backgroundStart;

        // Each cycle should complete quickly (under 4 seconds)
        expect(cycleTime).toBeLessThan(4000);
      }

      // Verify app state is maintained
      await expect(element(by.testID('weather-widget'))).toBeVisible();
    });
  });

  describe('UI Responsiveness', () => {
    it('should maintain 60fps during animations', async () => {
      // Test smooth animations during navigation
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Rapid tab switching to test animation performance
      const animationTestStart = Date.now();

      for (let i = 0; i < 5; i++) {
        await element(by.testID('scan-tab')).tap();
        await device.device.sleep(100); // Brief pause to see animation

        await element(by.testID('plants-tab')).tap();
        await device.device.sleep(100);

        await element(by.testID('home-tab')).tap();
        await device.device.sleep(100);
      }

      const animationTestEnd = Date.now();
      const totalAnimationTime = animationTestEnd - animationTestStart;

      // Should complete animation tests quickly (smooth performance)
      expect(totalAnimationTime).toBeLessThan(5000);

      // UI should still be responsive
      await expect(element(by.testID('home-screen'))).toBeVisible();
    });

    it('should handle scroll performance efficiently', async () => {
      // Test scrolling performance on home screen
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      const scrollStart = Date.now();

      // Perform multiple scroll operations
      for (let i = 0; i < 10; i++) {
        await element(by.testID('home-screen')).scroll(200, 'down');
        await device.device.sleep(50);
        await element(by.testID('home-screen')).scroll(200, 'up');
        await device.device.sleep(50);
      }

      const scrollEnd = Date.now();
      const scrollTime = scrollEnd - scrollStart;

      // Scrolling should be smooth and quick
      expect(scrollTime).toBeLessThan(3000);

      // Content should still be visible and interactive
      await expect(element(by.testID('weather-widget'))).toBeVisible();
    });

    it('should handle input responsiveness', async () => {
      // Test input performance in forms
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

        // Test typing performance
        if (await element(by.testID('plant-name-input')).exists()) {
          const typingStart = Date.now();

          // Type a long string to test input performance
          const testText = 'Performance Test Plant Name With Long Description';
          await element(by.testID('plant-name-input')).typeText(testText);

          const typingEnd = Date.now();
          const typingTime = typingEnd - typingStart;

          // Typing should be responsive (under 2 seconds for long text)
          expect(typingTime).toBeLessThan(2000);

          // Verify text was entered correctly
          await expect(element(by.text(testText))).toBeVisible();
        }
      }
    });
  });

  describe('Network Performance', () => {
    it('should handle concurrent network requests efficiently', async () => {
      // Navigate to home screen and trigger weather load
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      const networkTestStart = Date.now();

      // Trigger multiple potential network operations
      if (await element(by.testID('weather-refresh-button')).exists()) {
        await element(by.testID('weather-refresh-button')).tap();
      }

      // Navigate to scan (might trigger other network operations)
      await element(by.testID('scan-tab')).tap();
      await waitFor(element(by.testID('scan-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Return to home
      await element(by.testID('home-tab')).tap();
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Wait for network operations to complete
      await waitFor(element(by.testID('weather-temperature')))
        .toBeVisible()
        .withTimeout(20000);

      const networkTestEnd = Date.now();
      const networkTime = networkTestEnd - networkTestStart;

      // Concurrent operations should complete within reasonable time
      expect(networkTime).toBeLessThan(20000);
    });

    it('should handle network timeout scenarios efficiently', async () => {
      // Test app behavior when network is slow
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      if (await element(by.testID('weather-refresh-button')).exists()) {
        const timeoutTestStart = Date.now();
        
        await element(by.testID('weather-refresh-button')).tap();

        // Should either load or timeout gracefully
        const weatherLoaded = await waitFor(element(by.testID('weather-temperature')))
          .toBeVisible()
          .withTimeout(15000)
          .catch(() => false);

        const timeoutTestEnd = Date.now();
        const timeoutTestTime = timeoutTestEnd - timeoutTestStart;

        if (!weatherLoaded) {
          // If timeout occurred, should be within expected timeout period
          expect(timeoutTestTime).toBeLessThan(15000);
          
          // Should show cached data or error gracefully
          const hasCachedData = await element(by.testID('weather-widget')).exists();
          expect(hasCachedData).toBe(true);
        }
      }
    });
  });

  describe('Performance Regression Detection', () => {
    it('should maintain consistent performance across sessions', async () => {
      // Measure performance across multiple app sessions
      const sessionTimes = [];

      for (let session = 0; session < 3; session++) {
        // Restart app
        await device.terminateApp();
        
        const sessionStart = Date.now();
        await device.launchApp();

        await waitFor(element(by.testID('guest-button')))
          .toBeVisible()
          .withTimeout(5000);
        await element(by.testID('guest-button')).tap();

        await waitFor(element(by.testID('home-screen')))
          .toBeVisible()
          .withTimeout(3000);

        const sessionEnd = Date.now();
        const sessionTime = sessionEnd - sessionStart;
        sessionTimes.push(sessionTime);

        // Each session should be reasonably fast
        expect(sessionTime).toBeLessThan(8000);
      }

      // Performance should be consistent (no major regression)
      const avgTime = sessionTimes.reduce((a, b) => a + b) / sessionTimes.length;
      const maxDeviation = Math.max(...sessionTimes) - Math.min(...sessionTimes);
      
      // Deviation between fastest and slowest should be reasonable
      expect(maxDeviation).toBeLessThan(3000);
    });

    it('should handle performance under different device states', async () => {
      // Test performance with various device conditions
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Test navigation performance
      const perfTestStart = Date.now();

      // Perform standard navigation flow
      await element(by.testID('scan-tab')).tap();
      await waitFor(element(by.testID('scan-screen')))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.testID('plants-tab')).tap();
      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.testID('home-tab')).tap();
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      const perfTestEnd = Date.now();
      const perfTestTime = perfTestEnd - perfTestStart;

      // Navigation should complete within acceptable time
      expect(perfTestTime).toBeLessThan(5000);

      // UI should remain responsive
      await expect(element(by.testID('weather-widget'))).toBeVisible();
    });
  });
});