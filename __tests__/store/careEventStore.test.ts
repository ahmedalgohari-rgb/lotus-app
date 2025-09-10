import { act } from '@testing-library/react-native';
import { useCareEventStore } from '@/store/careEventStore';
import { useAuthStore } from '@/store/authStore';
import { supabase, sharedChainableMock } from '@/utils/supabase';



describe('careEventStore', () => {
  const MOCK_USER_ID = 'user123';
  const MOCK_PLANT_ID = 'plant123';
  const MOCK_CARE_EVENT = {
    id: 'event1',
    plant_id: MOCK_PLANT_ID,
    user_id: MOCK_USER_ID,
    event_type: 'water',
    event_date: new Date().toISOString(),
    notes: null,
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    useCareEventStore.setState({ careEvents: [], loading: false, error: null });
    useAuthStore.setState({ user: { id: MOCK_USER_ID, email: 'test@example.com', firstName: 'Test', lastName: 'User', provider: 'email' as const, preferences: { language: 'en' as const, notifications: true, measurementUnit: 'metric' as const }, createdAt: new Date().toISOString() } }); // Mock authenticated user
    jest.clearAllMocks();
  });

  it('initial state is correct', () => {
    const { careEvents, loading, error } = useCareEventStore.getState();
    expect(careEvents).toEqual([]);
    expect(loading).toBe(false);
    expect(error).toBeNull();
  });

  it('fetchCareEvents fetches care events for a specific plant and user', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [MOCK_CARE_EVENT], error: null }),
          }),
        }),
      }),
    });

    await act(async () => {
      await useCareEventStore.getState().fetchCareEvents(MOCK_PLANT_ID);
    });

    const { careEvents, loading, error } = useCareEventStore.getState();
    expect(careEvents).toEqual([MOCK_CARE_EVENT]);
    expect(loading).toBe(false);
    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('care_events');
  });

  it('addCareEvent adds a new care event', async () => {
    const newCareEventData = {
      plant_id: MOCK_PLANT_ID,
      event_type: 'prune' as 'prune',
      event_date: new Date().toISOString(),
      notes: 'Trimmed some leaves',
    };
    (supabase.from as jest.Mock).mockReturnValue({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { ...newCareEventData, id: 'newId', user_id: MOCK_USER_ID }, error: null }),
        }),
      }),
    });

    await act(async () => {
      await useCareEventStore.getState().addCareEvent(newCareEventData);
    });

    const { careEvents, loading, error } = useCareEventStore.getState();
    expect(careEvents).toHaveLength(1);
    expect(careEvents[0].event_type).toBe('prune');
    expect(loading).toBe(false);
    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('care_events');
  });
});