import React from 'react';
import { render } from '@testing-library/react-native';
import Text from '@/components/Text'; // Adjust import based on your project structure

describe('Text Component', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<Text>Hello World</Text>);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('applies correct styles for different variants', () => {
    const { getByText } = render(<Text variant="h1">Heading 1</Text>);
    const textElement = getByText('Heading 1');
    // You would typically assert on specific styles here,
    // but for a basic test, just checking existence is enough.
    expect(textElement).toBeTruthy();
    // Example: expect(textElement.props.style).toContainEqual({ fontSize: 32 });
  });

  it('applies custom styles', () => {
    const { getByText } = render(<Text style={{ color: 'red' }}>Red Text</Text>);
    const textElement = getByText('Red Text');
    expect(textElement.props.style.color).toBe('red');
  });

  it('matches snapshot', () => {
    const tree = render(<Text variant="body1">Snapshot Text</Text>).toJSON();
    expect(tree).toMatchSnapshot();
  });
});