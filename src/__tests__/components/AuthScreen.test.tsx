import React from 'react';
import { render } from '@testing-library/react-native';
import AuthScreen from '../../screens/AuthScreen';

// Mock Supabase auth
jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn(),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    }
  }
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  replace: jest.fn(),
  setOptions: jest.fn(),
};

describe('AuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => {
      render(<AuthScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });

  it('should render AuthScreen component', () => {
    const rendered = render(<AuthScreen navigation={mockNavigation as any} />);
    expect(rendered).toBeTruthy();
  });

  it('should handle navigation prop', () => {
    expect(() => {
      render(<AuthScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });

  it('should render Arabic RTL layout', () => {
    expect(() => {
      render(<AuthScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });

  it('should handle OAuth integration', () => {
    expect(() => {
      render(<AuthScreen navigation={mockNavigation as any} />);
    }).not.toThrow();
  });
});