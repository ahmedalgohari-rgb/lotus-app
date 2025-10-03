import { renderHook, act } from '@testing-library/react-native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock i18n
jest.mock('../i18n', () => ({
  changeLanguage: jest.fn(() => Promise.resolve()),
}));

import { useStore } from '../store';

describe('Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state between tests
    act(() => {
      useStore.getState().clearStorage();
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.plants).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.language).toBe('en');
    expect(result.current.isRTL).toBe(false);
  });

  it('should set user correctly', () => {
    const { result } = renderHook(() => useStore());
    const mockUser = { id: '1', email: 'test@example.com' };

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('should toggle language correctly', async () => {
    const { result } = renderHook(() => useStore());

    await act(async () => {
      await result.current.setLanguage('ar');
    });

    expect(result.current.language).toBe('ar');
    expect(result.current.isRTL).toBe(true);

    await act(async () => {
      await result.current.setLanguage('en');
    });

    expect(result.current.language).toBe('en');
    expect(result.current.isRTL).toBe(false);
  });

  it('should add plant correctly', () => {
    const { result } = renderHook(() => useStore());
    const mockPlant = {
      id: '1',
      name: 'Test Plant',
      species: 'Test Species',
      dateAdded: new Date().toISOString(),
      lastWatered: null,
      nextWatering: null,
      imageUri: 'test-uri',
      notes: '',
    };

    act(() => {
      result.current.addPlant(mockPlant);
    });

    expect(result.current.plants).toHaveLength(1);
    expect(result.current.plants[0]).toEqual(mockPlant);
  });

  it('should update plant correctly', () => {
    const { result } = renderHook(() => useStore());
    const mockPlant = {
      id: '1',
      name: 'Test Plant',
      species: 'Test Species',
      dateAdded: new Date().toISOString(),
      lastWatered: null,
      nextWatering: null,
      imageUri: 'test-uri',
      notes: '',
    };

    act(() => {
      result.current.addPlant(mockPlant);
    });

    const updatedName = 'Updated Plant Name';
    act(() => {
      result.current.updatePlant('1', { name: updatedName });
    });

    expect(result.current.plants[0].name).toBe(updatedName);
  });

  it('should delete plant correctly', () => {
    const { result } = renderHook(() => useStore());
    const mockPlant = {
      id: '1',
      name: 'Test Plant',
      species: 'Test Species',
      dateAdded: new Date().toISOString(),
      lastWatered: null,
      nextWatering: null,
      imageUri: 'test-uri',
      notes: '',
    };

    act(() => {
      result.current.addPlant(mockPlant);
    });

    expect(result.current.plants).toHaveLength(1);

    act(() => {
      result.current.deletePlant('1');
    });

    expect(result.current.plants).toHaveLength(0);
  });

  it('should set loading state correctly', () => {
    const { result } = renderHook(() => useStore());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });
});