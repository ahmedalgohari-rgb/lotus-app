import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri } from 'expo-auth-session';
import { Plant, PlantSpecies, CareEvent, User } from '../types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

const redirectTo = makeRedirectUri();
console.log('Generated Redirect URI for Supabase:', redirectTo);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helpers
export const authService = {
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
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

  // Storage
  uploadImage: async (file: { uri: string; type: string; name: string }, bucket: string = 'plant-images') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: fileName,
      } as any);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, formData, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
      
      return { data: { ...data, publicUrl: urlData.publicUrl }, error: null };
    } catch (error) {
      console.error('Upload error:', error);
      return { data: null, error };
    }
  },
};