const { device, element, by, expect } = require('detox');

describe('Lotus App - Starter Tests', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { 
        camera: 'YES',
        photos: 'YES',
        notifications: 'YES'
      }
    });
  });

  beforeEach(async () => {
    
  });

  it('should launch and show authentication screen', async () => {
    await expect(element(by.id('auth-screen'))).toBeVisible();
    await expect(element(by.text('LOTUS'))).toBeVisible();
  });

  it('should have functional guest login button', async () => {
    await expect(element(by.id('guest-login-button'))).toBeVisible();
    await element(by.id('guest-login-button')).tap();
    
    // Should show main app navigation
    await expect(element(by.text('البيت'))).toBeVisible();
  });

  it('should display all OAuth sign-in options', async () => {
    // Reset to auth screen
    
    
    await expect(element(by.text('Continue with Google'))).toBeVisible();
    await expect(element(by.text('Continue with Apple'))).toBeVisible();
    await expect(element(by.text('Continue with Email'))).toBeVisible();
  });

  it('should show app branding and tagline', async () => {
    await expect(element(by.text('🌿'))).toBeVisible();
    await expect(element(by.text('LOTUS'))).toBeVisible();
    await expect(element(by.text('Care for your plants.'))).toBeVisible();
  });

  it('should have properly configured app permissions', async () => {
    // Enter guest mode to test permission requirements
    await element(by.id('guest-login-button')).tap();
    
    // Navigate to scan screen which requires camera permissions
    await element(by.text('صور')).tap();
    
    // Should show camera capture options without permission errors
    await expect(element(by.text('Take Photo'))).toBeVisible();
    await expect(element(by.text('Choose from Gallery'))).toBeVisible();
  });
});