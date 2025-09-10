/**
 * Supabase Mock for Jest Tests
 * Provides mock implementation of Supabase client for testing
 */

const mockSupabaseAuth = {
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signInWithOAuth: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChange: jest.fn(),
  getUser: jest.fn(),
  getSession: jest.fn(),
};

// Create a shared chainable mock instance
const sharedChainableMock = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  then: jest.fn().mockResolvedValue({ data: [], error: null }),
};

// Make all methods return the shared mock object for chaining
Object.keys(sharedChainableMock).forEach(key => {
  if (key !== 'then') {
    sharedChainableMock[key].mockReturnValue(sharedChainableMock);
  }
});

const mockSupabaseFrom = jest.fn(() => sharedChainableMock);

export const supabase = {
  auth: mockSupabaseAuth,
  from: mockSupabaseFrom,
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      remove: jest.fn(),
    })),
  },
};

// Export individual mocks for direct testing
export { mockSupabaseAuth, mockSupabaseFrom, sharedChainableMock };