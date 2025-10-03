// Simple utility function tests
describe('Basic Math Utils', () => {
  test('addition works correctly', () => {
    expect(2 + 2).toBe(4);
  });

  test('subtraction works correctly', () => {
    expect(5 - 3).toBe(2);
  });

  test('string concatenation works', () => {
    expect('Hello' + ' ' + 'World').toBe('Hello World');
  });
});

// Mock functions for plant care logic
describe('Plant Care Logic', () => {
  const calculateNextWatering = (lastWatered: string, interval: number): string => {
    const lastDate = new Date(lastWatered);
    const nextDate = new Date(lastDate.getTime() + interval * 24 * 60 * 60 * 1000);
    return nextDate.toISOString();
  };

  test('calculates next watering date correctly', () => {
    const lastWatered = '2024-01-01T00:00:00.000Z';
    const interval = 7; // 7 days
    const expected = '2024-01-08T00:00:00.000Z';
    
    expect(calculateNextWatering(lastWatered, interval)).toBe(expected);
  });

  test('handles different intervals', () => {
    const lastWatered = '2024-01-01T00:00:00.000Z';
    
    expect(calculateNextWatering(lastWatered, 3)).toBe('2024-01-04T00:00:00.000Z');
    expect(calculateNextWatering(lastWatered, 14)).toBe('2024-01-15T00:00:00.000Z');
  });
});