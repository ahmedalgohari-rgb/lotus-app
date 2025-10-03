const { device, expect } = require('detox');

describe('Minimal E2E Infrastructure Test', () => {
  it('should confirm Detox can launch and control the app', async () => {
    // This test passes if:
    // 1. The app launches without crashing
    // 2. Detox can communicate with the app
    // 3. Basic device interaction works
    
    console.log('🚀 Testing E2E infrastructure...');
    
    // Wait for app to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test basic device tap functionality
    await device.tap({ x: 200, y: 400 });
    console.log('✅ Device tap successful');
    
    // Wait to ensure app responds
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test passed - infrastructure is working
    console.log('✅ E2E infrastructure functional');
  });
});