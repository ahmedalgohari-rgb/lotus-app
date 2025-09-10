import { create } from 'zustand';
import { supabase } from '@/utils/supabase';
import { useAuthStore } from './authStore'; // To get the user ID

type CareEvent = {
  id: string;
  plant_id: string;
  user_id: string;
  event_type: 'water' | 'prune' | 'feed';
  event_date: string;
  notes: string | null;
  created_at: string;
};

type CareEventState = {
  careEvents: CareEvent[];
  loading: boolean;
  error: string | null;
  fetchCareEvents: (plantId: string) => Promise<void>;
  addCareEvent: (event: Omit<CareEvent, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
};

export const useCareEventStore = create<CareEventState>((set, get) => ({
  careEvents: [],
  loading: false,
  error: null,
  fetchCareEvents: async (plantId) => {
    set({ loading: true, error: null });
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      set({ error: 'User not authenticated', loading: false });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('care_events')
        .select('*')
        .eq('plant_id', plantId)
        .eq('user_id', userId)
        .order('event_date', { ascending: false });

      if (error) throw error;

      set({ careEvents: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  addCareEvent: async (event) => {
    set({ loading: true, error: null });
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      set({ error: 'User not authenticated', loading: false });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('care_events')
        .insert({ ...event, user_id: userId })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ careEvents: [data, ...state.careEvents], loading: false }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));