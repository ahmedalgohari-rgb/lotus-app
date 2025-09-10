import { act } from '@testing-library/react-native';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/utils/supabase'; // Import the actual supabase client



const mockUser = {
  id: 'user123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  provider: 'email' as const,
  preferences: {
    language: 'en' as const,
    notifications: true,
    measurementUnit: 'metric' as const,
  },
  createdAt: new Date().toISOString(),
};

describe('authStore', () => {
  beforeEach(() => {
    // Reset the store and mocks before each test
    useAuthStore.setState({ isAuthenticated: false, isLoading: false, user: null, accessToken: null, refreshToken: null, hasSeenOnboarding: false, isGuest: false, error: null });
    jest.clearAllMocks();
  });

  it('initial state is correct', () => {
    const { isAuthenticated, isLoading, user, accessToken } = useAuthStore.getState();
    expect(isAuthenticated).toBe(false);
    expect(isLoading).toBe(false);
    expect(user).toBeNull();
    expect(accessToken).toBeNull();
  });

  it('initializeAuth creates guest user', () => {
    act(() => {
      useAuthStore.getState().initializeAuth();
    });

    const { isAuthenticated, isLoading, user, accessToken, isGuest } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
    expect(isLoading).toBe(false);
    expect(isGuest).toBe(true);
    expect(accessToken).toBeNull();
    expect(user).toEqual(expect.objectContaining({
      provider: 'guest',
      email: 'guest@lotus.app',
      firstName: 'Guest',
      lastName: 'User',
      preferences: {
        language: 'en',
        notifications: false,
        measurementUnit: 'metric',
      },
    }));
  });

  it('logout clears authenticated state', () => {
    // First initialize with guest user
    act(() => {
      useAuthStore.getState().initializeAuth();
    });

    // Verify guest user is created
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // Then logout
    act(() => {
      useAuthStore.getState().logout();
    });

    const { isAuthenticated, isLoading, user, accessToken, isGuest } = useAuthStore.getState();
    expect(isAuthenticated).toBe(false);
    expect(isLoading).toBe(false);
    expect(isGuest).toBe(false);
    expect(user).toBeNull();
    expect(accessToken).toBeNull();
  });

  it('setUser updates user state correctly', () => {
    act(() => {
      useAuthStore.getState().setUser(mockUser);
    });

    const { isAuthenticated, user, isGuest } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
    expect(isGuest).toBe(false);
    expect(user).toEqual(mockUser);
  });

  it('loginAsGuest creates guest user', () => {
    act(() => {
      useAuthStore.getState().loginAsGuest();
    });

    const { isAuthenticated, user, isGuest, accessToken } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
    expect(isGuest).toBe(true);
    expect(accessToken).toBeNull();
    expect(user).toEqual(expect.objectContaining({
      provider: 'guest',
      email: 'guest@lotus.app',
    }));
  });
});