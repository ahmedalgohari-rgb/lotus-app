import { create } from 'zustand';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from './authStore'; // To get the user ID
import { schedulePlantCareNotification } from '@/utils/notifications'; // Import notification utility

type Plant = {
  id: string;
  user_id: string;
  nickname: string;
  scientific_name: string | null;
  common_name: string | null;
  image_url: string | null;
  location: string | null;
  window_direction: string | null;
  added_at: string;
  last_watered_at: string | null;
  next_watering_at: string | null;
  created_at: string;
  updated_at: string;
};

type PlantState = {
  plants: Plant[];
  loading: boolean;
  error: string | null;
  fetchPlants: () => Promise<void>;
  addPlant: (plant: Omit<Plant, 'id' | 'user_id' | 'added_at' | 'created_at' | 'updated_at' | 'last_watered_at' | 'next_watering_at'>) => Promise<void>;
  updatePlant: (plant: Partial<Plant>) => Promise<void>;
  deletePlant: (plantId: string) => Promise<void>;
};

// Helper to calculate next watering date (simplified: 7 days from now)
const calculateNextWatering = (lastWatered: Date | null): Date => {
  const date = lastWatered ? new Date(lastWatered) : new Date();
  date.setDate(date.getDate() + 7); // Assuming watering every 7 days
  return date;
};

export const usePlantStore = create<PlantState>((set, get) => ({
  plants: [],
  loading: false,
  error: null,
  fetchPlants: async () => {
    set({ loading: true, error: null });
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      set({ error: 'User not authenticated', loading: false });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      set({ plants: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  addPlant: async (plant) => {
    set({ loading: true, error: null });
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      set({ error: 'User not authenticated', loading: false });
      return;
    }

    const now = new Date();
    const nextWatering = calculateNextWatering(now);

    try {
      const { data, error } = await supabase
        .from('plants')
        .insert({
          ...plant,
          user_id: userId,
          added_at: now.toISOString(),
          last_watered_at: now.toISOString(), // Assume watered on add
          next_watering_at: nextWatering.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ plants: [...state.plants, data], loading: false }));
      schedulePlantCareNotification(data.nickname, 'water', nextWatering);
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  updatePlant: async (plant) => {
    set({ loading: true, error: null });
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      set({ error: 'User not authenticated', loading: false });
      return;
    }

    let updatedPlantData: Partial<Plant> = { ...plant };
    if (plant.last_watered_at) {
      updatedPlantData.next_watering_at = calculateNextWatering(new Date(plant.last_watered_at)).toISOString();
    }

    try {
      const { data, error } = await supabase
        .from('plants')
        .update(updatedPlantData)
        .eq('id', plant.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        plants: state.plants.map((p) => (p.id === data.id ? data : p)),
        loading: false,
      }));

      if (data.next_watering_at && plant.last_watered_at) { // Reschedule notification if watered
        schedulePlantCareNotification(data.nickname, 'water', new Date(data.next_watering_at));
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  deletePlant: async (plantId) => {
    set({ loading: true, error: null });
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      set({ error: 'User not authenticated', loading: false });
      return;
    }
    try {
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', plantId)
        .eq('user_id', userId);

      if (error) throw error;

      set((state) => ({
        plants: state.plants.filter((p) => p.id !== plantId),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));