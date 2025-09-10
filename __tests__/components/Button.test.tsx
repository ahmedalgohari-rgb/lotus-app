import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '@/components/Button'; // Adjust import based on your project structure

describe('Button Component', () => {
  it('renders correctly with primary variant', () => {
    const { getByText } = render(<Button title="Primary Button" variant="primary" />);
    expect(getByText('Primary Button')).toBeTruthy();
  });

  it('renders correctly with secondary variant', () => {
    const { getByText } = render(<Button title="Secondary Button" variant="secondary" />);
    expect(getByText('Secondary Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<Button title="Test Button" onPress={mockOnPress} />);
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<Button title="Disabled Button" onPress={mockOnPress} disabled />);
    fireEvent.press(getByText('Disabled Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('matches snapshot for primary variant', () => {
    const tree = render(<Button title="Snapshot Primary" variant="primary" />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('matches snapshot for secondary variant', () => {
    const tree = render(<Button title="Snapshot Secondary" variant="secondary" />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});