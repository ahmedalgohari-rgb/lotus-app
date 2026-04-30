import { useState, useEffect, useRef, useCallback } from 'react';
import { Magnetometer } from 'expo-sensors';

type CardinalDirection = 'north' | 'east' | 'south' | 'west';

interface CompassState {
  heading: number | null;
  cardinalDirection: CardinalDirection;
  isAvailable: boolean;
  start: () => void;
  stop: () => void;
}

const BUFFER_SIZE = 5;

function headingToCardinal(heading: number): CardinalDirection {
  if (heading >= 315 || heading < 45) return 'north';
  if (heading >= 45 && heading < 135) return 'east';
  if (heading >= 135 && heading < 225) return 'south';
  return 'west';
}

export function useCompass(): CompassState {
  const [isAvailable, setIsAvailable] = useState(false);
  const [heading, setHeading] = useState<number | null>(null);
  const [cardinalDirection, setCardinalDirection] = useState<CardinalDirection>('east');
  const subscriptionRef = useRef<ReturnType<typeof Magnetometer.addListener> | null>(null);

  // Circular mean buffer for smoothing
  const sinBuffer = useRef<number[]>([]);
  const cosBuffer = useRef<number[]>([]);

  useEffect(() => {
    Magnetometer.isAvailableAsync().then(setIsAvailable);
  }, []);

  const processReading = useCallback((data: { x: number; y: number; z: number }) => {
    // Heading = clockwise angle from magnetic north
    // Negate x because magnetometer measures field direction (not phone heading)
    // When phone faces east, field appears from -x → atan2(-(-x), y) = atan2(x, y) would be wrong
    let angle = Math.atan2(-data.x, data.y) * (180 / Math.PI);
    // Normalize to 0-360
    angle = (angle + 360) % 360;

    // Add to circular mean buffers
    const rad = (angle * Math.PI) / 180;
    sinBuffer.current.push(Math.sin(rad));
    cosBuffer.current.push(Math.cos(rad));
    if (sinBuffer.current.length > BUFFER_SIZE) {
      sinBuffer.current.shift();
      cosBuffer.current.shift();
    }

    // Calculate circular mean
    const avgSin = sinBuffer.current.reduce((a, b) => a + b, 0) / sinBuffer.current.length;
    const avgCos = cosBuffer.current.reduce((a, b) => a + b, 0) / cosBuffer.current.length;
    let smoothed = Math.atan2(avgSin, avgCos) * (180 / Math.PI);
    smoothed = (smoothed + 360) % 360;

    setHeading(Math.round(smoothed));
    setCardinalDirection(headingToCardinal(smoothed));
  }, []);

  const start = useCallback(() => {
    if (subscriptionRef.current) return;
    sinBuffer.current = [];
    cosBuffer.current = [];
    Magnetometer.setUpdateInterval(100);
    subscriptionRef.current = Magnetometer.addListener(processReading);
  }, [processReading]);

  const stop = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, []);

  return { heading, cardinalDirection, isAvailable, start, stop };
}
