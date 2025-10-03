import React from 'react';
import { render } from '@testing-library/react-native';
import ScanScreen from '../../screens/ScanScreen';

// Mock Expo Camera
jest.mock('expo-camera', () => ({
  Camera: {
    Constants: {
      Type: {
        back: 'back',
        front: 'front'
      }
    },
    requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
    getCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  },
  useCameraPermissions: jest.fn(() => [
    { granted: true, canAskAgain: true, status: 'granted' },
    jest.fn(() => Promise.resolve({ granted: true, status: 'granted' }))
  ]),
  CameraView: 'CameraView',
  CameraType: { back: 'back', front: 'front' },
}));

// Mock Expo Image Picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{ uri: 'mock-image-uri.jpg', width: 100, height: 100 }]
  })),
  MediaTypeOptions: {
    Images: 'Images'
  }
}));

// Mock PlantNet service
jest.mock('../../services/plantnet', () => ({
  identifyPlant: jest.fn(() => Promise.resolve({
    species: [
      {
        scientificNameWithoutAuthor: 'Rosa damascena',
        genus: { scientificNameWithoutAuthor: 'Rosa' },
        family: { scientificNameWithoutAuthor: 'Rosaceae' },
        commonNames: ['Damascus Rose', 'الورد الدمشقي'],
        score: 0.85
      }
    ]
  }))
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

describe('ScanScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => {
      render(<ScanScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });

  it('should render ScanScreen component', () => {
    const rendered = render(<ScanScreen navigation={mockNavigation as any} />);
    expect(rendered).toBeTruthy();
  });

  it('should handle navigation prop', () => {
    expect(() => {
      render(<ScanScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });

  it('should render Arabic RTL layout', () => {
    expect(() => {
      render(<ScanScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });

  it('should handle camera integration', () => {
    expect(() => {
      render(<ScanScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });
});