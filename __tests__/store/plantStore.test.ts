import { act } from '@testing-library/react-native';
import { usePlantStore } from '@/store/plantStore';
import { useAuthStore } from '@/store/authStore';
import { supabase, sharedChainableMock } from '@/utils/supabase';
import { schedulePlantCareNotification } from '@/utils/notifications';


jest.mock('@/utils/notifications', () => ({
  schedulePlantCareNotification: jest.fn(),
}));

describe('plantStore', () => {
  const MOCK_USER_ID = 'user123';
  const MOCK_PLANT = {
    id: 'plant1',
    user_id: MOCK_USER_ID,
    nickname: 'My Pothos',
    scientific_name: 'Epipremnum aureum',
    common_name: 'Pothos',
    image_url: null,
    location: 'Living Room',
    window_direction: 'East',
    added_at: new Date().toISOString(),
    last_watered_at: new Date().toISOString(),
    next_watering_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    usePlantStore.setState({ plants: [], loading: false, error: null });
    useAuthStore.setState({ user: { id: MOCK_USER_ID, email: 'test@example.com', firstName: 'Test', lastName: 'User', provider: 'email' as const, preferences: { language: 'en' as const, notifications: true, measurementUnit: 'metric' as const }, createdAt: new Date().toISOString() } }); // Mock authenticated user
    jest.clearAllMocks();
  });

  it('initial state is correct', () => {
    const { plants, loading, error } = usePlantStore.getState();
    expect(plants).toEqual([]);
    expect(loading).toBe(false);
    expect(error).toBeNull();
  });

  it('fetchPlants fetches plants for the authenticated user', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: () => ({
        eq: () => Promise.resolve({ data: [MOCK_PLANT], error: null }),
      }),
    });

    await act(async () => {
      await usePlantStore.getState().fetchPlants();
    });

    const { plants, loading, error } = usePlantStore.getState();
    expect(plants).toEqual([MOCK_PLANT]);
    expect(loading).toBe(false);
    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('plants');
  });

  it('addPlant adds a new plant and schedules notification', async () => {
    const newPlantData = {
      nickname: 'New Plant',
      scientific_name: null,
      common_name: null,
      image_url: null,
      location: null,
      window_direction: null,
    };
    (supabase.from as jest.Mock).mockReturnValue({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { ...newPlantData, id: 'newId', user_id: MOCK_USER_ID }, error: null }),
        }),
      }),
    });

    await act(async () => {
      await usePlantStore.getState().addPlant(newPlantData);
    });

    const { plants, loading, error } = usePlantStore.getState();
    expect(plants).toHaveLength(1);
    expect(plants[0].nickname).toBe('New Plant');
    expect(loading).toBe(false);
    expect(error).toBeNull();
    expect(schedulePlantCareNotification).toHaveBeenCalledTimes(1);
    expect(schedulePlantCareNotification).toHaveBeenCalledWith(
      'New Plant',
      'water',
      expect.any(Date)
    );
  });

  it('updatePlant updates an existing plant and reschedules notification', async () => {
    usePlantStore.setState({ plants: [MOCK_PLANT] });
    const updatedNickname = 'Updated Pothos';
    const updatedPlantData = { ...MOCK_PLANT, nickname: updatedNickname, last_watered_at: new Date().toISOString() };

    (supabase.from as jest.Mock).mockReturnValue({
      update: () => ({
        eq: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: updatedPlantData, error: null }),
            }),
          }),
        }),
      }),
    });

    await act(async () => {
      await usePlantStore.getState().updatePlant(updatedPlantData);
    });

    const { plants, loading, error } = usePlantStore.getState();
    expect(plants).toHaveLength(1);
    expect(plants[0].nickname).toBe(updatedNickname);
    expect(loading).toBe(false);
    expect(error).toBeNull();
    expect(schedulePlantCareNotification).toHaveBeenCalledTimes(1);
    expect(schedulePlantCareNotification).toHaveBeenCalledWith(
      updatedNickname,
      'water',
      expect.any(Date)
    );
  });

  it('deletePlant removes a plant', async () => {
    usePlantStore.setState({ plants: [MOCK_PLANT] });
    (supabase.from as jest.Mock).mockReturnValue({
      delete: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
    });

    await act(async () => {
      await usePlantStore.getState().deletePlant(MOCK_PLANT.id);
    });

    const { plants, loading, error } = usePlantStore.getState();
    expect(plants).toHaveLength(0);
    expect(loading).toBe(false);
    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('plants');
  });
});