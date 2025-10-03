const { device } = require('detox');

beforeAll(async () => {
  await device.launchApp({
    permissions: { 
      camera: 'YES',
      photos: 'YES',
      notifications: 'YES'
    },
    newInstance: true
  });
});

beforeEach(async () => {
  // For Expo development builds, we restart the app instead of reloading React Native
  await device.launchApp({
    newInstance: true,
    permissions: { 
      camera: 'YES',
      photos: 'YES',
      notifications: 'YES'
    }
  });
});

afterAll(async () => {
  await device.terminateApp();
});