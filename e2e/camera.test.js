const { device, element, by, expect } = require('detox');

describe('Camera Functionality', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { 
        camera: 'YES',
        photos: 'YES'
      }
    });
    await element(by.id('guest-login-button')).tap();
  });

  it('should navigate to scan screen and show camera options', async () => {
    // Navigate to scan tab
    await element(by.text('صور')).tap(); // Arabic "Scan" tab
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check scan screen elements are visible
    await expect(element(by.text('Identify Plant'))).toBeVisible();
    await expect(element(by.text('Gallery'))).toBeVisible();
  });

  it('should display camera permission prompt elements', async () => {
    // Make sure we're on scan screen
    await element(by.text('صور')).tap();
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for camera-related elements
    await expect(element(by.text('Identify Plant'))).toBeVisible();
    // Note: Actual camera functionality testing requires simulator camera setup
  });

  it('should show gallery option for plant photos', async () => {
    // Make sure we're on scan screen
    await element(by.text('صور')).tap();
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check gallery option is available
    await expect(element(by.text('Gallery'))).toBeVisible();
  });

  it('should display plant identification tips', async () => {
    // Make sure we're on scan screen
    await element(by.text('صور')).tap();
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for tips button (actual tips text might be in modal)
    await expect(element(by.text('Tips'))).toBeVisible();
  });
});
