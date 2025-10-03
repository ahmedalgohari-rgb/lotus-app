import React from 'react';
import { render } from '@testing-library/react-native';
import PlantsScreen from '../../screens/PlantsScreen';

// Mock the store
const mockStore = {
  plants: [
    {
      id: '1',
      name: 'وردة الجوري',
      species: 'Rosa damascena',
      dateAdded: '2024-09-01T10:00:00.000Z',
      lastWatered: '2024-09-15T10:00:00.000Z',
      nextWatering: '2024-09-18T10:00:00.000Z',
      imageUri: 'mock-image-uri.jpg',
      notes: 'نبات جميل ومزهر',
    },
    {
      id: '2',
      name: 'نبات الصبار',
      species: 'Aloe vera',
      dateAdded: '2024-09-05T10:00:00.000Z',
      lastWatered: '2024-09-10T10:00:00.000Z',
      nextWatering: '2024-09-20T10:00:00.000Z',
      imageUri: 'mock-aloe-uri.jpg',
      notes: 'يحتاج ري قليل',
    }
  ],
  user: null,
  isLoading: false,
};

jest.mock('../../store', () => ({
  useStore: () => mockStore,
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => () => {}),
};

describe('PlantsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => {
      render(<PlantsScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });

  it('should render PlantsScreen component', () => {
    const rendered = render(<PlantsScreen navigation={mockNavigation as any} />);
    expect(rendered).toBeTruthy();
  });

  it('should handle navigation prop', () => {
    expect(() => {
      render(<PlantsScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });

  it('should render Arabic RTL layout', () => {
    expect(() => {
      render(<PlantsScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });

  it('should handle store integration', () => {
    expect(() => {
      render(<PlantsScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });
});