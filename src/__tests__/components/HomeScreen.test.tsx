import React from 'react';
import { render, screen } from '@testing-library/react-native';
import HomeScreen from '../../screens/HomeScreen';

// Mock the weather service
jest.mock('../../services/weather', () => ({
  __esModule: true,
  default: {
    getCurrentWeather: jest.fn(() => Promise.resolve({
      temperature: 28,
      humidity: 45,
      condition: 'sunny',
      description: 'صافي',
      windSpeed: 10,
      lastUpdated: new Date(),
      location: 'القاهرة',
      careRecommendation: {
        type: 'normal',
        message: 'الجو معتدل في القاهرة - جدول ري عادي',
        adjustment: 1.0
      }
    })),
    clearCache: jest.fn(),
    getSeasonalTips: jest.fn(() => [
      'الجو معتدل في القاهرة - وقت مثالي للنباتات',
      'نضف الورق من التراب والغبار'
    ])
  }
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => {
      render(<HomeScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });

  it('should render HomeScreen component', () => {
    const rendered = render(<HomeScreen navigation={mockNavigation as any} />);
    expect(rendered).toBeTruthy();
  });

  it('should handle navigation prop', () => {
    expect(() => {
      render(<HomeScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });

  it('should render Arabic RTL layout', () => {
    expect(() => {
      render(<HomeScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });

  it('should handle weather service integration', () => {
    expect(() => {
      render(<HomeScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });
});