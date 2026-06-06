/**
 * CompassDirectionPicker Tests
 *
 * Tests the component contract: "does onDirectionChange fire with the right
 * value at the right time?" — pure callback verification, no DOM assertions.
 *
 * Uses react-test-renderer directly (not @testing-library/react-native) because
 * the project test environment is jsdom + react-native-web, which causes
 * @testing-library/react-native's DOM queries to miss native component props.
 * react-test-renderer is environment-agnostic and queries the React fiber tree.
 *
 * REGRESSION COVERED:
 * "All directions show Excellent" — the score banner always showed the
 * auto-selected direction's score because onDirectionChange was only called
 * on Confirm. The fix streams onDirectionChange in real-time as cardinalDirection
 * changes. These tests verify that contract.
 */

import React from 'react';
import { act, create } from 'react-test-renderer';
import CompassDirectionPicker from '../../components/CompassDirectionPicker';

// ─── Mock react-native-reanimated ──────────────────────────────────────────

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  // Pass-through wrapper — renders children, satisfies react-test-renderer's type check
  const AnimatedView = ({ children }: any) => React.createElement(React.Fragment, null, children);
  return {
    __esModule: true, // required so babel's _interopRequireDefault resolves .default correctly
    default: { call: () => {}, View: AnimatedView },
    useSharedValue: jest.fn((v: any) => ({ value: v })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn((v: any) => v),
    withRepeat: jest.fn((v: any) => v),
    withTiming: jest.fn((v: any) => v),
    withSequence: jest.fn((...args: any[]) => args[0]),
    createAnimatedComponent: (c: any) => c,
  };
});

// ─── Mock expo-sensors ────────────────────────────────────────────────────

jest.mock('expo-sensors', () => ({
  Magnetometer: {
    isAvailableAsync: jest.fn(() => Promise.resolve(true)),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    setUpdateInterval: jest.fn(),
  },
}));

// ─── Controllable useCompass mock ─────────────────────────────────────────

const mockCompassState = {
  heading: 0 as number | null,
  cardinalDirection: 'east' as 'north' | 'east' | 'south' | 'west',
  isAvailable: false,
  start: jest.fn(),
  stop: jest.fn(),
};

jest.mock('../../hooks/useCompass', () => ({
  useCompass: () => mockCompassState,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────

const defaultProps = {
  selectedDirection: 'east',
  onDirectionChange: jest.fn(),
  bestDirection: 'east',
  isRTL: false,
};

function getByTestId(instance: any, testID: string) {
  const results = instance.findAll((n: any) => n.props?.testID === testID);
  if (!results.length) throw new Error(`No element with testID: ${testID}`);
  return results[0];
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCompassState.isAvailable = false;
  mockCompassState.cardinalDirection = 'east';
  mockCompassState.heading = 0;
});

// ── Manual mode ────────────────────────────────────────────────────────────

describe('manual mode (compass unavailable)', () => {
  it('renders all 4 direction buttons', () => {
    let renderer: any;
    act(() => { renderer = create(<CompassDirectionPicker {...defaultProps} />); });
    const root = renderer.root;
    expect(getByTestId(root, 'direction-north')).toBeTruthy();
    expect(getByTestId(root, 'direction-east')).toBeTruthy();
    expect(getByTestId(root, 'direction-south')).toBeTruthy();
    expect(getByTestId(root, 'direction-west')).toBeTruthy();
  });

  it('calls onDirectionChange when user taps a direction button', () => {
    const onDirectionChange = jest.fn();
    let renderer: any;
    act(() => { renderer = create(<CompassDirectionPicker {...defaultProps} onDirectionChange={onDirectionChange} />); });
    act(() => { getByTestId(renderer.root, 'direction-north').props.onPress(); });
    expect(onDirectionChange).toHaveBeenCalledWith('north');
  });

  it('calls onDirectionChange with correct value for each direction', () => {
    const onDirectionChange = jest.fn();
    let renderer: any;
    act(() => { renderer = create(<CompassDirectionPicker {...defaultProps} onDirectionChange={onDirectionChange} />); });
    ['north', 'east', 'south', 'west'].forEach(dir => {
      act(() => { getByTestId(renderer.root, `direction-${dir}`).props.onPress(); });
      expect(onDirectionChange).toHaveBeenCalledWith(dir);
    });
  });

  it('does not call onDirectionChange on initial render in manual mode', () => {
    const onDirectionChange = jest.fn();
    act(() => { create(<CompassDirectionPicker {...defaultProps} onDirectionChange={onDirectionChange} />); });
    expect(onDirectionChange).not.toHaveBeenCalled();
  });
});

// ── Live mode: streaming (THE REGRESSION TEST) ────────────────────────────

describe('live mode — direction streaming (regression: "all directions show Excellent")', () => {

  it('calls onDirectionChange when cardinalDirection changes in live mode', async () => {
    const onDirectionChange = jest.fn();
    mockCompassState.isAvailable = true;
    mockCompassState.cardinalDirection = 'east';

    let renderer: any;
    await act(async () => { renderer = create(<CompassDirectionPicker {...defaultProps} onDirectionChange={onDirectionChange} />); });
    expect(onDirectionChange).toHaveBeenCalledWith('east');
    const callsAfterEast = onDirectionChange.mock.calls.length;

    mockCompassState.cardinalDirection = 'north';
    await act(async () => {
      renderer.update(<CompassDirectionPicker {...defaultProps} onDirectionChange={onDirectionChange} />);
    });

    expect(onDirectionChange).toHaveBeenCalledWith('north');
    expect(onDirectionChange.mock.calls.length).toBeGreaterThan(callsAfterEast);
  });

  it('does NOT re-fire onDirectionChange when cardinal direction has not changed', async () => {
    const onDirectionChange = jest.fn();
    mockCompassState.isAvailable = true;
    mockCompassState.cardinalDirection = 'south';

    let renderer: any;
    await act(async () => { renderer = create(<CompassDirectionPicker {...defaultProps} onDirectionChange={onDirectionChange} />); });
    const callsAfterFirst = onDirectionChange.mock.calls.length;

    mockCompassState.heading = 180; // still south
    await act(async () => {
      renderer.update(<CompassDirectionPicker {...defaultProps} onDirectionChange={onDirectionChange} />);
    });

    expect(onDirectionChange.mock.calls.length).toBe(callsAfterFirst);
  });

  it('streams all 4 cardinal directions as compass rotates', async () => {
    const onDirectionChange = jest.fn();
    mockCompassState.isAvailable = true;

    const directions = ['north', 'east', 'south', 'west'] as const;
    mockCompassState.cardinalDirection = directions[0];

    let renderer: any;
    await act(async () => { renderer = create(<CompassDirectionPicker {...defaultProps} onDirectionChange={onDirectionChange} />); });

    for (const dir of directions.slice(1)) {
      mockCompassState.cardinalDirection = dir;
      await act(async () => {
        renderer.update(<CompassDirectionPicker {...defaultProps} onDirectionChange={onDirectionChange} />);
      });
    }

    directions.forEach(dir => {
      expect(onDirectionChange).toHaveBeenCalledWith(dir);
    });
  });
});

// ── Live mode: Confirm button ──────────────────────────────────────────────

describe('live mode — confirm button', () => {
  it('shows Confirm button in live mode', async () => {
    mockCompassState.isAvailable = true;
    mockCompassState.cardinalDirection = 'west';

    let renderer: any;
    await act(async () => { renderer = create(<CompassDirectionPicker {...defaultProps} />); });
    expect(getByTestId(renderer.root, 'confirm-direction')).toBeTruthy();
  });

  it('calls onDirectionChange with current cardinalDirection on Confirm press', async () => {
    const onDirectionChange = jest.fn();
    mockCompassState.isAvailable = true;
    mockCompassState.cardinalDirection = 'south';

    let renderer: any;
    await act(async () => { renderer = create(<CompassDirectionPicker {...defaultProps} onDirectionChange={onDirectionChange} />); });

    act(() => { getByTestId(renderer.root, 'confirm-direction').props.onPress(); });
    expect(onDirectionChange).toHaveBeenCalledWith('south');
  });
});

// ── RTL support ────────────────────────────────────────────────────────────

describe('RTL support', () => {
  it('renders without crashing in RTL mode', () => {
    expect(() => { act(() => { create(<CompassDirectionPicker {...defaultProps} isRTL={true} />); }); }).not.toThrow();
  });

  it('calls onDirectionChange correctly in RTL mode', () => {
    const onDirectionChange = jest.fn();
    let renderer: any;
    act(() => { renderer = create(<CompassDirectionPicker {...defaultProps} isRTL={true} onDirectionChange={onDirectionChange} />); });
    act(() => { getByTestId(renderer.root, 'direction-south').props.onPress(); });
    expect(onDirectionChange).toHaveBeenCalledWith('south');
  });
});
