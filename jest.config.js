/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/(*.)+(spec|test).(ts|tsx|js)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
    '<rootDir>/lotus-app-backup-20250920/',
    '<rootDir>/src/__tests__/setup.ts'
  ],
  watchPathIgnorePatterns: [
    '<rootDir>/lotus-app-backup-20250920/'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@expo|expo|expo-modules-core|@expo/vector-icons|@react-navigation|react-native-vector-icons|zustand|@react-native-async-storage|react-native-safe-area-context|expo-linear-gradient|expo-camera|expo-image-picker|expo-image-manipulator)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts'
  ],
  coverageDirectory: '<rootDir>/coverage',
  verbose: true,
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
  },
};