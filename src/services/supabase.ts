import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { Plant, PlantSpecies, CareEvent, User } from '../types';
import { logger } from '../utils/logger';

// Complete the browser session on Android
WebBrowser.maybeCompleteAuthSession();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn('Missing Supabase environment variables');
}

const redirectTo = makeRedirectUri({
  scheme: 'lotus',
  path: 'auth/callback',
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // This should be false for React Native
  },
});

// Listen for auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  // Auth state monitoring
});

// Auth helpers
export const authService = {
  signInWithGoogle: async () => {
    try {
      // Get the OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true, // We'll handle the browser manually
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        logger.error('Google OAuth URL generation failed:', error);
        return { data: null, error };
      }

      if (!data?.url) {
        logger.error('No OAuth URL returned from Supabase');
        return { data: null, error: { message: 'No OAuth URL returned', name: 'OAuthError', status: 500 } as any };
      }

      // Open the OAuth URL in the browser
      logger.debug('Opening Google OAuth browser with URL:', data.url);
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success') {
        logger.debug('Google OAuth browser returned successfully');

        // Poll for session with 500ms intervals (max 10 seconds)
        // This fixes the race condition where the deep link handler hasn't set the session yet
        logger.debug('Polling for session (max 10 seconds)...');
        const maxAttempts = 20; // 20 attempts * 500ms = 10 seconds max
        let sessionData = null;

        for (let i = 0; i < maxAttempts; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const result = await supabase.auth.getSession();

          if (result.data.session) {
            sessionData = result;
            logger.debug(`Session found after ${(i + 1) * 500}ms`);
            break;
          }
        }

        if (!sessionData?.data?.session) {
          logger.error('No session found after OAuth completion (timeout after 10 seconds)');
          return { data: null, error: { message: 'OAuth timeout - session not created within 10 seconds', name: 'TimeoutError', status: 408 } as any };
        }

        if (sessionData.error) {
          logger.error('Failed to get session after OAuth:', sessionData.error);
          return { data: null, error: sessionData.error };
        }

        logger.debug('Google OAuth successful, session retrieved');
        return {
          data: {
            user: sessionData.data.session.user,
            session: sessionData.data.session
          },
          error: null
        };
      } else if (result.type === 'cancel') {
        logger.info('User cancelled Google OAuth');
        return { data: null, error: { message: 'User cancelled OAuth', name: 'UserCancelled', status: 400 } as any };
      } else {
        logger.error('Google OAuth failed with type:', result.type);
        return { data: null, error: { message: 'OAuth browser session failed', name: 'BrowserError', status: 500 } as any };
      }
    } catch (err) {
      logger.error('Google OAuth error:', err);
      return { data: null, error: err as any };
    }
  },

  signInWithApple: async () => {
    try {
      // Get the OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo,
          skipBrowserRedirect: true, // We'll handle the browser manually
        },
      });

      if (error) {
        logger.error('Apple OAuth URL generation failed:', error);
        return { data: null, error };
      }

      if (!data?.url) {
        logger.error('No OAuth URL returned from Supabase');
        return { data: null, error: { message: 'No OAuth URL returned', name: 'OAuthError', status: 500 } as any };
      }

      // Open the OAuth URL in the browser
      logger.debug('Opening Apple OAuth browser with URL:', data.url);
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success') {
        logger.debug('Apple OAuth browser returned successfully');

        // Poll for session with 500ms intervals (max 10 seconds)
        // This fixes the race condition where the deep link handler hasn't set the session yet
        logger.debug('Polling for session (max 10 seconds)...');
        const maxAttempts = 20; // 20 attempts * 500ms = 10 seconds max
        let sessionData = null;

        for (let i = 0; i < maxAttempts; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const result = await supabase.auth.getSession();

          if (result.data.session) {
            sessionData = result;
            logger.debug(`Session found after ${(i + 1) * 500}ms`);
            break;
          }
        }

        if (!sessionData?.data?.session) {
          logger.error('No session found after OAuth completion (timeout after 10 seconds)');
          return { data: null, error: { message: 'OAuth timeout - session not created within 10 seconds', name: 'TimeoutError', status: 408 } as any };
        }

        if (sessionData.error) {
          logger.error('Failed to get session after OAuth:', sessionData.error);
          return { data: null, error: sessionData.error };
        }

        logger.debug('Apple OAuth successful, session retrieved');
        return {
          data: {
            user: sessionData.data.session.user,
            session: sessionData.data.session
          },
          error: null
        };
      } else if (result.type === 'cancel') {
        logger.info('User cancelled Apple OAuth');
        return { data: null, error: { message: 'User cancelled OAuth', name: 'UserCancelled', status: 400 } as any };
      } else {
        logger.error('Apple OAuth failed with type:', result.type);
        return { data: null, error: { message: 'OAuth browser session failed', name: 'BrowserError', status: 500 } as any };
      }
    } catch (err) {
      logger.error('Apple OAuth error:', err);
      return { data: null, error: err as any };
    }
  },

  signInWithFacebook: async () => {
    try {
      // Get the OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo,
          skipBrowserRedirect: true, // We'll handle the browser manually
          queryParams: {
            scope: 'email,public_profile',
          },
        },
      });

      if (error) {
        logger.error('Facebook OAuth URL generation failed:', error);
        return { data: null, error };
      }

      if (!data?.url) {
        logger.error('No OAuth URL returned from Supabase');
        return { data: null, error: { message: 'No OAuth URL returned', name: 'OAuthError', status: 500 } as any };
      }

      // Open the OAuth URL in the browser
      logger.debug('Opening Facebook OAuth browser with URL:', data.url);
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success') {
        logger.debug('Facebook OAuth browser returned successfully');

        // Poll for session with 500ms intervals (max 10 seconds)
        // This fixes the race condition where the deep link handler hasn't set the session yet
        logger.debug('Polling for session (max 10 seconds)...');
        const maxAttempts = 20; // 20 attempts * 500ms = 10 seconds max
        let sessionData = null;

        for (let i = 0; i < maxAttempts; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const result = await supabase.auth.getSession();

          if (result.data.session) {
            sessionData = result;
            logger.debug(`Session found after ${(i + 1) * 500}ms`);
            break;
          }
        }

        if (!sessionData?.data?.session) {
          logger.error('No session found after OAuth completion (timeout after 10 seconds)');
          return { data: null, error: { message: 'OAuth timeout - session not created within 10 seconds', name: 'TimeoutError', status: 408 } as any };
        }

        if (sessionData.error) {
          logger.error('Failed to get session after OAuth:', sessionData.error);
          return { data: null, error: sessionData.error };
        }

        logger.debug('Facebook OAuth successful, session retrieved');
        return {
          data: {
            user: sessionData.data.session.user,
            session: sessionData.data.session
          },
          error: null
        };
      } else if (result.type === 'cancel') {
        logger.info('User cancelled Facebook OAuth');
        return { data: null, error: { message: 'User cancelled OAuth', name: 'UserCancelled', status: 400 } as any };
      } else {
        logger.error('Facebook OAuth failed with type:', result.type);
        return { data: null, error: { message: 'OAuth browser session failed', name: 'BrowserError', status: 500 } as any };
      }
    } catch (err) {
      logger.error('Facebook OAuth error:', err);
      return { data: null, error: err as any };
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      }
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },
};

// Database helpers
export const dbService = {
  // Plants
  getPlants: async (userId: string) => {
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  addPlant: async (plant: Omit<Plant, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('plants')
      .insert([plant])
      .select()
      .single();
    return { data, error };
  },

  updatePlant: async (id: string, updates: Partial<Plant>) => {
    const { data, error } = await supabase
      .from('plants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  deletePlant: async (id: string) => {
    const { error } = await supabase
      .from('plants')
      .delete()
      .eq('id', id);
    return { error };
  },

  // Plant Species
  getPlantSpecies: async () => {
    const { data, error } = await supabase
      .from('plant_species')
      .select('*')
      .order('name_en');
    return { data, error };
  },

  getPlantSpeciesById: async (id: string) => {
    const { data, error } = await supabase
      .from('plant_species')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Care Events
  getCareEvents: async (plantId: string) => {
    const { data, error } = await supabase
      .from('care_events')
      .select('*')
      .eq('plant_id', plantId)
      .order('completed_at', { ascending: false });
    return { data, error };
  },

  addCareEvent: async (event: Omit<CareEvent, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('care_events')
      .insert([event])
      .select()
      .single();
    return { data, error };
  },

  // User Profile
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateProfile: async (userId: string, updates: Partial<User>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  updateUserProfile: async (userId: string, firstName: string) => {
    // Use upsert to insert if not exists, or update if exists
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          first_name: firstName,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'id',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();
    return { data, error };
  },

  // Storage
  uploadImage: async (file: { uri: string; type: string; name: string }, bucket: string = 'plant-images') => {
    try {
      // Check if URI is already a remote URL (from search results)
      if (file.uri.startsWith('http://') || file.uri.startsWith('https://')) {
        logger.info('Using existing remote image URL:', file.uri);
        return file.uri; // Return the remote URL directly, no upload needed
      }

      // Local file - proceed with upload to Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const base64 = await readAsStringAsync(file.uri, {
        encoding: EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer for proper binary upload
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, bytes.buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          logger.error(`Supabase Storage Error: Bucket '${bucket}' not found. Please create it in your Supabase project dashboard.`);
        }
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (!data.publicUrl) {
        throw new Error('Failed to get public URL for the uploaded image.');
      }

      return data.publicUrl;
    } catch (error) {
      logger.error('Upload error:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  },
};