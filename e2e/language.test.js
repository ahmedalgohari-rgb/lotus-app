const { device, element, by, expect } = require('detox');

describe('Language Switching', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true});
    // Enter guest mode to access main app
    await element(by.id('guest-login-button')).tap();
  });

  it('should display language toggle button', async () => {
    // Make sure we're on home screen
    await element(by.text('البيت')).tap();
    
    // Check language toggle is visible - shows 'عربي' when in English mode
    await expect(element(by.text('عربي'))).toBeVisible();
  });

  it('should switch to Arabic and show RTL layout', async () => {
    // Tap the language toggle button
    await element(by.text('عربي')).tap();
    
    // Wait for language change to take effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // After switching to Arabic, button should show 'EN'
    await expect(element(by.text('EN'))).toBeVisible();
    
    // Check that Arabic text is now displayed
    await expect(element(by.text('أهلاً بيك في لوتس'))).toBeVisible(); // Arabic welcome
  });

  it('should switch back to English', async () => {
    // Tap the language toggle button (now showing 'EN')
    await element(by.text('EN')).tap();
    
    // Wait for language change to take effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Button should show 'عربي' again
    await expect(element(by.text('عربي'))).toBeVisible();
    
    // Check that English text is displayed
    await expect(element(by.text('Welcome to Lotus'))).toBeVisible();
  });

  it('should maintain navigation labels in Arabic mode', async () => {
    // Switch to Arabic
    await element(by.text('عربي')).tap();
    
    // Wait for language change
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check that navigation tabs are in Arabic
    await expect(element(by.text('البيت'))).toBeVisible(); // Home
    await expect(element(by.text('صور'))).toBeVisible(); // Scan
    await expect(element(by.text('نباتاتي'))).toBeVisible(); // Plants
  });

  it('should maintain navigation labels in English mode', async () => {
    // Switch back to English
    await element(by.text('EN')).tap();
    
    // Wait for language change
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Navigation should still work with Arabic labels (this is expected behavior)
    await expect(element(by.text('البيت'))).toBeVisible(); // Navigation labels stay Arabic
    await expect(element(by.text('صور'))).toBeVisible();
    await expect(element(by.text('نباتاتي'))).toBeVisible();
  });
});
