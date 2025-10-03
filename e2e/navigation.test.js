const { device, element, by, expect } = require('detox');

describe('Navigation Flow', () => {
  beforeAll(async () => {
    // Go to guest mode to access main app
    
    await element(by.id('guest-login-button')).tap();
  });

  it('should display bottom tab navigation', async () => {
    // Check if bottom tabs are visible (Arabic text)
    await expect(element(by.text('البيت'))).toBeVisible(); // "Home" in Arabic
    await expect(element(by.text('صور'))).toBeVisible(); // "Scan" in Arabic  
    await expect(element(by.text('نباتاتي'))).toBeVisible(); // "Plants" in Arabic
  });

  it('should navigate to scan screen', async () => {
    // Tap scan tab
    await element(by.text('صور')).tap();
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Should show scan screen with proper elements
    await expect(element(by.text('Identify Plant'))).toBeVisible();
    await expect(element(by.text('Gallery'))).toBeVisible();
  });

  it('should navigate to plants screen', async () => {
    // Tap plants tab
    await element(by.text('نباتاتي')).tap();
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Should show plants screen - check for either case
    try {
      await expect(element(by.text('My Plants (0)'))).toBeVisible();
    } catch {
      await expect(element(by.text('No plants yet'))).toBeVisible();
    }
  });

  it('should navigate back to home screen', async () => {
    // Tap home tab
    await element(by.text('البيت')).tap();
    
    // Should show home screen
    await expect(element(by.text('Welcome to Lotus'))).toBeVisible();
    await expect(element(by.text('Plant Care Basics'))).toBeVisible();
  });

  it('should display weather widget on home screen', async () => {
    // Make sure we're on home screen
    await element(by.text('البيت')).tap();
    
    // Check weather widget elements - these depend on weather service
    // Using more generic checks that work with mock data
    await expect(element(by.text('Cairo Weather'))).toBeVisible();
  });

  it('should display care tips on home screen', async () => {
    // Make sure we're on home screen
    await element(by.text('البيت')).tap();
    
    // Check care tips section with correct English titles
    await expect(element(by.text('Watering'))).toBeVisible();
    await expect(element(by.text('Light'))).toBeVisible();
    await expect(element(by.text('Position'))).toBeVisible();
    await expect(element(by.text('Humidity'))).toBeVisible();
  });
});