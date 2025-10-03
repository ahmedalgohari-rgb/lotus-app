const { device, element, by, expect } = require('detox');

describe('Debug Tests', () => {
  it('should launch app and wait for elements', async () => {
    console.log('App launched, waiting for elements...');
    
    // Wait a bit for the app to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      // Check if SafeAreaView is visible (should be there)
      await expect(element(by.id('auth-screen'))).toBeVisible();
      console.log('✅ auth-screen found');
    } catch (e) {
      console.log('❌ auth-screen not found:', e.message);
    }
    
    try {
      // Check for LOTUS text
      await expect(element(by.text('LOTUS'))).toBeVisible();
      console.log('✅ LOTUS text found');
    } catch (e) {
      console.log('❌ LOTUS text not found:', e.message);
    }
    
    try {
      // Check for guest button
      await expect(element(by.id('guest-login-button'))).toBeVisible();
      console.log('✅ guest-login-button found');
    } catch (e) {
      console.log('❌ guest-login-button not found:', e.message);
    }
    
    try {
      // Try alternative text search
      await expect(element(by.text('Skip'))).toBeVisible();
      console.log('✅ Skip text found');
    } catch (e) {
      console.log('❌ Skip text not found:', e.message);
    }
  });
});