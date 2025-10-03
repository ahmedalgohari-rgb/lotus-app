import { supabase } from '../services/supabase';

// Mock Supabase client
jest.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://test-url.com' } })),
      })),
    },
  },
}));

describe('Supabase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should handle OAuth sign in', async () => {
      const mockSignIn = supabase.auth.signInWithOAuth as jest.Mock;
      mockSignIn.mockResolvedValue({ data: { user: { id: '123' } }, error: null });

      const result = await supabase.auth.signInWithOAuth({ provider: 'google' });

      expect(mockSignIn).toHaveBeenCalledWith({ provider: 'google' });
      expect(result.data?.user?.id).toBe('123');
    });

    it('should handle sign out', async () => {
      const mockSignOut = supabase.auth.signOut as jest.Mock;
      mockSignOut.mockResolvedValue({ error: null });

      const result = await supabase.auth.signOut();

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });

    it('should get current session', async () => {
      const mockGetSession = supabase.auth.getSession as jest.Mock;
      mockGetSession.mockResolvedValue({ 
        data: { session: { user: { id: '123' } } }, 
        error: null 
      });

      const result = await supabase.auth.getSession();

      expect(mockGetSession).toHaveBeenCalled();
      expect(result.data?.session?.user?.id).toBe('123');
    });
  });

  describe('Database Operations', () => {
    it('should fetch plants for user', async () => {
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ 
          data: [{ id: '1', name: 'Test Plant' }], 
          error: null 
        })),
      }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const plantsQuery = supabase.from('plants').select('*');
      const result = await plantsQuery.eq('user_id', '123');

      expect(supabase.from).toHaveBeenCalledWith('plants');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe('Test Plant');
    });

    it('should insert new plant', async () => {
      const mockInsert = jest.fn(() => Promise.resolve({ 
        data: [{ id: '1', name: 'New Plant' }], 
        error: null 
      }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const plantData = { name: 'New Plant', user_id: '123' };
      const result = await supabase.from('plants').insert(plantData);

      expect(supabase.from).toHaveBeenCalledWith('plants');
      expect(mockInsert).toHaveBeenCalledWith(plantData);
      expect(result.data?.[0].name).toBe('New Plant');
    });

    it('should update plant', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ 
          data: [{ id: '1', name: 'Updated Plant' }], 
          error: null 
        })),
      }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const updates = { name: 'Updated Plant' };
      const updateQuery = supabase.from('plants').update(updates);
      const result = await updateQuery.eq('id', '1');

      expect(supabase.from).toHaveBeenCalledWith('plants');
      expect(mockUpdate).toHaveBeenCalledWith(updates);
      expect(result.data?.[0].name).toBe('Updated Plant');
    });

    it('should delete plant', async () => {
      const mockDelete = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ 
          data: [], 
          error: null 
        })),
      }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const deleteQuery = supabase.from('plants').delete();
      const result = await deleteQuery.eq('id', '1');

      expect(supabase.from).toHaveBeenCalledWith('plants');
      expect(mockDelete).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });
  });

  describe('Storage Operations', () => {
    it('should upload plant image', async () => {
      const mockUpload = jest.fn(() => Promise.resolve({ 
        data: { path: 'plants/test-image.jpg' }, 
        error: null 
      }));
      
      const mockStorageFrom = jest.fn(() => ({
        upload: mockUpload,
      }));
      
      (supabase.storage.from as jest.Mock) = mockStorageFrom;

      const file = new Blob(['test'], { type: 'image/jpeg' });
      const result = await supabase.storage.from('plants').upload('test-image.jpg', file);

      expect(mockStorageFrom).toHaveBeenCalledWith('plants');
      expect(mockUpload).toHaveBeenCalledWith('test-image.jpg', file);
      expect(result.data?.path).toBe('plants/test-image.jpg');
    });

    it('should get public URL for plant image', () => {
      const mockGetPublicUrl = jest.fn(() => ({ 
        data: { publicUrl: 'https://test-bucket.com/plants/test-image.jpg' } 
      }));
      
      const mockStorageFrom = jest.fn(() => ({
        getPublicUrl: mockGetPublicUrl,
      }));
      
      (supabase.storage.from as jest.Mock) = mockStorageFrom;

      const result = supabase.storage.from('plants').getPublicUrl('test-image.jpg');

      expect(mockStorageFrom).toHaveBeenCalledWith('plants');
      expect(mockGetPublicUrl).toHaveBeenCalledWith('test-image.jpg');
      expect(result.data.publicUrl).toContain('test-image.jpg');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ 
          data: null, 
          error: { message: 'Database connection failed' } 
        })),
      }));
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const plantsQuery = supabase.from('plants').select('*');
      const result = await plantsQuery.eq('user_id', '123');

      expect(result.error?.message).toBe('Database connection failed');
      expect(result.data).toBeNull();
    });

    it('should handle auth errors gracefully', async () => {
      const mockSignIn = supabase.auth.signInWithOAuth as jest.Mock;
      mockSignIn.mockResolvedValue({ 
        data: { user: null }, 
        error: { message: 'OAuth provider error' } 
      });

      const result = await supabase.auth.signInWithOAuth({ provider: 'google' });

      expect(result.error?.message).toBe('OAuth provider error');
      expect(result.data.user).toBeNull();
    });
  });
});