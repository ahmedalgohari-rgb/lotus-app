const { device, element, by, expect } = require('detox');

describe('Basic App Flow', () => {
  beforeEach(async () => {
    
  });

  it('should launch app and show authentication screen', async () => {
    // App should start with auth screen
    await expect(element(by.id('auth-screen'))).toBeVisible();
    await expect(element(by.text('LOTUS'))).toBeVisible();
  });

  it('should complete guest login flow', async () => {
    // Tap guest login
    await element(by.id('guest-login-button')).tap();
    
    // Wait for authentication and navigation transition
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Should navigate to main app
    await expect(element(by.text('البيت'))).toBeVisible();
    await expect(element(by.text('صور'))).toBeVisible();
    await expect(element(by.text('نباتاتي'))).toBeVisible();
  });

  it('should navigate through all main screens', async () => {
    // Start with guest login
    await element(by.id('guest-login-button')).tap();
    
    // Wait for initial navigation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test Home screen
    await element(by.text('البيت')).tap();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await expect(element(by.text('Welcome to Lotus'))).toBeVisible();
    
    // Test Scan screen
    await element(by.text('صور')).tap();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await expect(element(by.text('Identify Plant'))).toBeVisible();
    
    // Test Plants screen
    await element(by.text('نباتاتي')).tap();
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Check for either "My Plants" or "No plants yet" since it's a guest user
    try {
      await expect(element(by.text('My Plants (0)'))).toBeVisible();
    } catch {
      await expect(element(by.text('No plants yet'))).toBeVisible();
    }
    
    // Return to home
    await element(by.text('البيت')).tap();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await expect(element(by.text('Welcome to Lotus'))).toBeVisible();
  });

  it('should display weather information on home screen', async () => {
    // Enter guest mode
    await element(by.id('guest-login-button')).tap();
    
    // Wait for navigation transition
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Navigate to home
    await element(by.text('البيت')).tap();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check weather widget is present
    await expect(element(by.text('Cairo Weather'))).toBeVisible();
  });

  it('should show plant care basics', async () => {
    // Enter guest mode
    await element(by.id('guest-login-button')).tap();
    
    // Wait for navigation transition
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Navigate to home
    await element(by.text('البيت')).tap();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check care basics are displayed
    await expect(element(by.text('Plant Care Basics'))).toBeVisible();
    await expect(element(by.text('Watering'))).toBeVisible();
    await expect(element(by.text('Light'))).toBeVisible();
  });

  it('should handle language toggle functionality', async () => {
    // Enter guest mode
    await element(by.id('guest-login-button')).tap();
    
    // Wait for navigation transition
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check language toggle is available
    await expect(element(by.text('عربي'))).toBeVisible();
    
    // Toggle to Arabic
    await element(by.text('عربي')).tap();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await expect(element(by.text('EN'))).toBeVisible();
    
    // Toggle back to English
    await element(by.text('EN')).tap();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await expect(element(by.text('عربي'))).toBeVisible();
  });
});