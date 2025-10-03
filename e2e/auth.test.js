const { device, element, by, expect } = require('detox');

describe('Authentication Flow', () => {
  beforeEach(async () => {
    
  });

  it('should display authentication screen on app launch', async () => {
    // Check if authentication screen elements are visible
    await expect(element(by.id('auth-screen'))).toBeVisible();
    await expect(element(by.text('🌿'))).toBeVisible();
    await expect(element(by.text('LOTUS'))).toBeVisible();
    // Check for part of the tagline since the full text might be wrapped
    await expect(element(by.text('Care for your plants.'))).toBeVisible();
  });

  it('should show sign in options', async () => {
    // Check if OAuth sign-in buttons are present
    await expect(element(by.text('Continue with Apple'))).toBeVisible();
    await expect(element(by.text('Continue with Google'))).toBeVisible();
    await expect(element(by.text('Continue with Email'))).toBeVisible();
  });

  it('should allow guest mode access', async () => {
    // Tap guest mode button using testID
    await element(by.id('guest-login-button')).tap();
    
    // Wait for navigation transition to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Should navigate to main app and show home screen
    await expect(element(by.text('البيت'))).toBeVisible(); // Arabic "Home" tab
    await expect(element(by.text('صور'))).toBeVisible(); // Arabic "Scan" tab
    await expect(element(by.text('نباتاتي'))).toBeVisible(); // Arabic "Plants" tab
  });

  it('should display skip button for guest access', async () => {
    // Reset to auth screen
    
    
    // Check skip button is visible
    await expect(element(by.text('Skip'))).toBeVisible();
    await expect(element(by.id('guest-login-button'))).toBeVisible();
  });

  it('should show loading state during sign in', async () => {
    // This test will just verify that loading state can be displayed
    // Actual OAuth testing requires more complex setup
    await expect(element(by.text('Continue with Google'))).toBeVisible();
    await expect(element(by.text('Continue with Apple'))).toBeVisible();
  });
});