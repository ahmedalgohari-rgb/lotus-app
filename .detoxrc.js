/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.eas': {
      type: 'ios.app',
      bundleId: 'com.lotus.plantcare',
      binaryPath: 'lotusapp.app'
    },
    'expo.go': {
      type: 'ios.app',
      bundleId: 'host.exp.Exponent',
      binaryPath: '/Applications/Expo Go.app',
      launchArgs: {
        'exp-url': 'exp://localhost:8081'
      }
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 16 Pro'
      }
    }
  },
  configurations: {
    'ios.sim.eas': {
      device: 'simulator',
      app: 'ios.eas'
    },
    'expo.go.sim': {
      device: 'simulator',
      app: 'expo.go'
    }
  }
};