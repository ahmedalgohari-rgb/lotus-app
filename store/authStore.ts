import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { OnboardingProfile } from '../types/onboarding';

// User type definition
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  provider: 'google' | 'apple' | 'email' | 'guest';
  preferences: {
    language: 'en' | 'ar';
    notifications: boolean;
    measurementUnit: 'metric' | 'imperial';
  };
  createdAt: string;
  avatarUrl?: string;
  onboardingProfile?: OnboardingProfile;
}

// Authentication store state
interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  isGuest: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  setUserProfile: (profile: OnboardingProfile) => void;
  login: (user: User, tokens: { accessToken: string; refreshToken: string }) => void;
  loginAsGuest: () => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  clearError: () => void;
  
  // Supabase Auth integration methods
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, userData: { firstName: string; lastName: string }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => void;
}

// Create the auth store with persistence
export const useAuthStore = create<AuthState>()(
  // Temporarily disabled persistence to avoid AsyncStorage issues in Expo Go
  // persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasSeenOnboarding: false,
      isGuest: false,
      accessToken: null,
      refreshToken: null,
      error: null,

      // Actions
      setUser: (user) => 
        set({ 
          user,
          isAuthenticated: !!user,
          isGuest: user?.provider === 'guest',
        }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      setError: (error) =>
        set({ error }),

      setHasSeenOnboarding: (hasSeenOnboarding) =>
        set({ hasSeenOnboarding }),

      setUserProfile: (profile) =>
        set((state) => ({
          user: state.user ? {
            ...state.user,
            onboardingProfile: profile,
            preferences: {
              ...state.user.preferences,
              language: profile.language,
            }
          } : null,
        })),

      login: (user, tokens) =>
        set({
          user,
          isAuthenticated: true,
          isGuest: user.provider === 'guest',
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          error: null,
          isLoading: false,
        }),

      loginAsGuest: () => {
        const guestUser: User = {
          id: `guest_${Date.now()}`,
          email: 'guest@lotus.app',
          firstName: 'Guest',
          lastName: 'User',
          provider: 'guest',
          preferences: {
            language: 'en',
            notifications: false,
            measurementUnit: 'metric',
          },
          createdAt: new Date().toISOString(),
        };
        
        set({
          user: guestUser,
          isAuthenticated: true,
          isGuest: true,
          accessToken: null,
          refreshToken: null,
          error: null,
          isLoading: false,
        });
      },

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isGuest: false,
          accessToken: null,
          refreshToken: null,
          error: null,
          isLoading: false
        }),

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
          });
        }
      },

      clearError: () =>
        set({ error: null }),

      // Supabase Auth integration methods
      signInWithEmail: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          if (!data.user) throw new Error('No user data returned');
          
          // Transform Supabase user to our User type
          const lotusUser: User = {
            id: data.user.id,
            email: data.user.email || '',
            firstName: data.user.user_metadata?.firstName || data.user.user_metadata?.full_name?.split(' ')[0] || '',
            lastName: data.user.user_metadata?.lastName || data.user.user_metadata?.full_name?.split(' ')[1] || '',
            provider: 'email',
            preferences: {
              language: 'en',
              notifications: true,
              measurementUnit: 'metric',
            },
            createdAt: data.user.created_at || new Date().toISOString(),
            avatarUrl: data.user.user_metadata?.avatar_url,
          };
          
          set({
            user: lotusUser,
            isAuthenticated: true,
            isGuest: false,
            accessToken: data.session?.access_token || null,
            refreshToken: data.session?.refresh_token || null,
            error: null,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signUpWithEmail: async (email: string, password: string, userData: { firstName: string; lastName: string }) => {
        try {
          set({ isLoading: true, error: null });
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                full_name: `${userData.firstName} ${userData.lastName}`,
              },
            },
          });
          
          if (error) throw error;
          if (!data.user) throw new Error('No user data returned');
          
          // Transform Supabase user to our User type
          const lotusUser: User = {
            id: data.user.id,
            email: data.user.email || '',
            firstName: userData.firstName,
            lastName: userData.lastName,
            provider: 'email',
            preferences: {
              language: 'en',
              notifications: true,
              measurementUnit: 'metric',
            },
            createdAt: data.user.created_at || new Date().toISOString(),
          };
          
          set({
            user: lotusUser,
            isAuthenticated: true,
            isGuest: false,
            accessToken: data.session?.access_token || null,
            refreshToken: data.session?.refresh_token || null,
            error: null,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signInWithGoogle: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Use Supabase OAuth with proper redirect URL
          const redirectUrl = 'lotus://auth/callback';
          
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectUrl,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            },
          });
          
          if (error) throw error;
          
          // Open OAuth URL in browser
          if (data.url) {
            const { Linking } = await import('react-native');
            await Linking.openURL(data.url);
          }
          
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Google sign-in failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signInWithApple: async () => {
        try {
          set({ isLoading: true, error: null });
          
          // Use Supabase OAuth with proper redirect URL
          const redirectUrl = 'lotus://auth/callback';
          
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
              redirectTo: redirectUrl,
            },
          });
          
          if (error) throw error;
          
          // Open OAuth URL in browser
          if (data.url) {
            const { Linking } = await import('react-native');
            await Linking.openURL(data.url);
          }
          
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Apple sign-in failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signOut: async () => {
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          
          set({
            user: null,
            isAuthenticated: false,
            isGuest: false,
            accessToken: null,
            refreshToken: null,
            error: null,
          });
        } catch (error: any) {
          console.error('Sign out error:', error);
        }
      },

      initializeAuth: () => {
        // For Expo Go compatibility, just initialize with guest mode
        const guestUser: User = {
          id: `guest_${Date.now()}`,
          email: 'guest@lotus.app',
          firstName: 'Guest',
          lastName: 'User',
          provider: 'guest',
          preferences: {
            language: 'en',
            notifications: false,
            measurementUnit: 'metric',
          },
          createdAt: new Date().toISOString(),
        };
        
        set({
          user: guestUser,
          isAuthenticated: true,
          isGuest: true,
          accessToken: null,
          refreshToken: null,
          error: null,
          isLoading: false,
          hasSeenOnboarding: true, // Skip onboarding for quick testing
        });
      },
    })
    // Temporarily disabled persistence config to avoid AsyncStorage issues in Expo Go
    // , {
    //   name: 'lotus-auth-store',
    //   storage: createJSONStorage(() => AsyncStorage),
    //   // Only persist certain fields
    //   partialize: (state) => ({
    //     user: state.user,
    //     isAuthenticated: state.isAuthenticated,
    //     hasSeenOnboarding: state.hasSeenOnboarding,
    //     isGuest: state.isGuest,
    //     accessToken: state.accessToken,
    //     refreshToken: state.refreshToken,
    //   }),
    // }
  // )
);

// Selector hooks for better performance
export const useUser = (): User | null => useAuthStore((state) => state.user);
export const useIsAuthenticated = (): boolean => useAuthStore((state) => state.isAuthenticated);
export const useIsGuest = (): boolean => useAuthStore((state) => state.isGuest);
export const useAuthLoading = (): boolean => useAuthStore((state) => state.isLoading);
export const useAuthError = (): string | null => useAuthStore((state) => state.error);
export const useHasSeenOnboarding = (): boolean => useAuthStore((state) => state.hasSeenOnboarding);

// Auth actions hook
export const useAuthActions = () => {
  const {
    setUser,
    setTokens,
    setLoading,
    setError,
    setHasSeenOnboarding,
    login,
    loginAsGuest,
    logout,
    updateUser,
    clearError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
    initializeAuth,
  } = useAuthStore();

  return {
    setUser,
    setTokens,
    setLoading,
    setError,
    setHasSeenOnboarding,
    login,
    loginAsGuest,
    logout,
    updateUser,
    clearError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
    initializeAuth,
  };
};