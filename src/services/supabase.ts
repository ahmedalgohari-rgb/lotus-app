import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri } from 'expo-auth-session';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { Plant, PlantSpecies, CareEvent, User } from '../types';
import { plantOperationsLimiter, RateLimiter } from '../utils/rateLimiter';
import { validateImageForUpload, resizeImageIfNeeded } from '../utils/validation';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

const redirectTo = makeRedirectUri();
console.log("Redirect URI for Supabase config:", redirectTo);


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
  console.log('Auth state changed:', event, session?.user?.email);
});

// Auth helpers
export const authService = {
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { data, error };
  },

  signInWithApple: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
      },
    });
    return { data, error };
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

  signInWithOtp: async (phone: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { data, error };
  },

  verifyOtp: async (phone: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
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
      .select('id, user_id, species_id, nickname, location, window_direction, image_url, health_status, last_watered_at, next_watering_at, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  addPlant: async (plant: Omit<Plant, 'id' | 'created_at' | 'updated_at'>) => {
    // Security: Check rate limit before operation
    const rateLimitCheck = await plantOperationsLimiter.checkLimit();
    if (!rateLimitCheck.allowed) {
      const retryTime = RateLimiter.formatRetryTime(rateLimitCheck.retryAfter);
      return {
        data: null,
        error: {
          message: `Too many plant operations. Please wait ${retryTime} before trying again.`,
          details: `Rate limit: ${rateLimitCheck.remaining} operations remaining`,
          hint: 'This limit resets every hour to protect the database',
        } as any,
      };
    }

    const { data, error } = await supabase
      .from('plants')
      .insert([plant])
      .select()
      .single();

    // Record successful operation
    if (!error) {
      await plantOperationsLimiter.recordRequest();
    }

    return { data, error };
  },

  updatePlant: async (id: string, updates: Partial<Plant>) => {
    // Security: Check rate limit before operation
    const rateLimitCheck = await plantOperationsLimiter.checkLimit();
    if (!rateLimitCheck.allowed) {
      const retryTime = RateLimiter.formatRetryTime(rateLimitCheck.retryAfter);
      return {
        data: null,
        error: {
          message: `Too many plant operations. Please wait ${retryTime} before trying again.`,
          details: `Rate limit: ${rateLimitCheck.remaining} operations remaining`,
          hint: 'This limit resets every hour to protect the database',
        } as any,
      };
    }

    const { data, error } = await supabase
      .from('plants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    // Record successful operation
    if (!error) {
      await plantOperationsLimiter.recordRequest();
    }

    return { data, error };
  },

  deletePlant: async (id: string) => {
    // Security: Check rate limit before operation
    const rateLimitCheck = await plantOperationsLimiter.checkLimit();
    if (!rateLimitCheck.allowed) {
      const retryTime = RateLimiter.formatRetryTime(rateLimitCheck.retryAfter);
      return {
        error: {
          message: `Too many plant operations. Please wait ${retryTime} before trying again.`,
          details: `Rate limit: ${rateLimitCheck.remaining} operations remaining`,
          hint: 'This limit resets every hour to protect the database',
        } as any,
      };
    }

    const { error } = await supabase
      .from('plants')
      .delete()
      .eq('id', id);

    // Record successful operation
    if (!error) {
      await plantOperationsLimiter.recordRequest();
    }

    return { error };
  },

  // Plant Species
  getPlantSpecies: async () => {
    const { data, error } = await supabase
      .from('plant_species')
      .select('id, name_en, name_ar, scientific_name, watering_frequency_days, light_requirement, window_ratings, care_tips_en, care_tips_ar, cairo_specific_tips, created_at')
      .order('name_en');
    return { data, error };
  },

  getPlantSpeciesById: async (id: string) => {
    const { data, error } = await supabase
      .from('plant_species')
      .select('id, name_en, name_ar, scientific_name, watering_frequency_days, light_requirement, window_ratings, care_tips_en, care_tips_ar, cairo_specific_tips, created_at')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Care Events
  getCareEvents: async (plantId: string) => {
    const { data, error } = await supabase
      .from('care_events')
      .select('id, plant_id, user_id, event_type, completed_at, notes, created_at')
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
      .select('id, first_name, last_name, avatar_url, language, created_at, updated_at')
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

  // Storage
  uploadImage: async (file: { uri: string; type: string; name: string }, bucket: string = 'plant-images') => {
    try {
      // Security: Validate image before upload
      console.log('🔒 Validating image for upload...');
      const validation = await validateImageForUpload(file.uri, file.type);

      if (!validation.isValid) {
        const errorMessage = validation.errors.join(', ');
        console.error('❌ Image validation failed:', errorMessage);
        throw new Error(`Image validation failed: ${errorMessage}`);
      }

      // Log warnings (e.g., large images)
      if (validation.warnings.length > 0) {
        console.warn('⚠️ Image warnings:', validation.warnings.join(', '));
      }

      // Security: Resize image if needed (prevents uploading huge images)
      const resizedUri = await resizeImageIfNeeded(file.uri);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const base64 = await readAsStringAsync(resizedUri, {
        encoding: EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer for proper binary upload
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log(`✅ Uploading validated image (${validation.dimensions?.width}x${validation.dimensions?.height}, ${(validation.fileSize || 0 / 1024).toFixed(0)}KB)...`);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, bytes.buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          console.error(`Supabase Storage Error: Bucket '${bucket}' not found. Please create it in your Supabase project dashboard.`);
        }
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      if (!data.publicUrl) {
        throw new Error('Failed to get public URL for the uploaded image.');
      }

      console.log('✅ Image upload successful');
      return data.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  },
};