/**
 * Direction Modifiers Tests
 *
 * Validates the 16 direction × season combinations and weather-aware scaling.
 * Pure data tests — no mocks needed.
 *
 * Key invariants:
 * - South/West summer → Very High light (Cairo's intense sun)
 * - North is always Low or Medium (never Very High)
 * - Extreme heat (≥38°C) on south/west triggers 🔥 DANGER
 */

import {
  DIRECTION_MODIFIERS,
  getDirectionModifiers,
  WEATHER_AWARE_DIRECTION_MODIFIERS,
  getWeatherAwareDirectionModifiers,
  scaleDirectionForLatitude,
} from '../../utils/care/directionModifiers';

import type { WeatherData } from '../../types';

jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ─── Minimal weather stubs ─────────────────────────────────────────────────

const cairoSpring: WeatherData = {
  temperature: 26, humidity: 40, condition: 'sunny', windSpeed: 12,
  location: 'Cairo', description: 'Clear', uvIndex: 7,
  tempMin: 18, tempMax: 32,
};

const cairoSummerExtreme: WeatherData = {
  temperature: 40, humidity: 25, condition: 'sunny', windSpeed: 8,
  location: 'Cairo', description: 'Hot', uvIndex: 12,
  tempMin: 30, tempMax: 42,
};

const cairoSummerModerate: WeatherData = {
  temperature: 30, humidity: 30, condition: 'sunny', windSpeed: 10,
  location: 'Cairo', description: 'Warm', uvIndex: 8,
  tempMin: 24, tempMax: 34,
};

const cairoWinter: WeatherData = {
  temperature: 16, humidity: 55, condition: 'cloudy', windSpeed: 15,
  location: 'Cairo', description: 'Mild', uvIndex: 3,
  tempMin: 10, tempMax: 20,
};

// ─── Static DIRECTION_MODIFIERS ────────────────────────────────────────────

describe('DIRECTION_MODIFIERS (static 16-scenario table)', () => {
  it('covers all 16 direction × season combinations', () => {
    const directions = ['north', 'east', 'south', 'west'];
    const seasons = ['winter', 'spring', 'summer', 'autumn'];
    directions.forEach(dir => {
      seasons.forEach(season => {
        const key = `${dir}_${season}`;
        expect(DIRECTION_MODIFIERS[key]).toBeDefined();
        expect(DIRECTION_MODIFIERS[key].lightIntensity).toBeDefined();
      });
    });
  });

  it('north window is never Very High intensity in any season', () => {
    ['north_winter', 'north_spring', 'north_summer', 'north_autumn'].forEach(key => {
      expect(DIRECTION_MODIFIERS[key].lightIntensity).not.toBe('Very High');
    });
  });

  it('south summer and west summer are Very High intensity', () => {
    expect(DIRECTION_MODIFIERS['south_summer'].lightIntensity).toBe('Very High');
    expect(DIRECTION_MODIFIERS['west_summer'].lightIntensity).toBe('Very High');
  });

  it('south winter is High (gentler winter sun)', () => {
    expect(DIRECTION_MODIFIERS['south_winter'].lightIntensity).toBe('High');
  });

  it('east spring is High (the golden window)', () => {
    expect(DIRECTION_MODIFIERS['east_spring'].lightIntensity).toBe('High');
  });

  it('watering adjustment is more negative (water sooner) in summer for south/west', () => {
    expect(DIRECTION_MODIFIERS['south_summer'].wateringAdjustment).toBeLessThan(0);
    expect(DIRECTION_MODIFIERS['west_summer'].wateringAdjustment).toBeLessThan(0);
  });

  it('watering adjustment is positive (water later) for north in winter', () => {
    expect(DIRECTION_MODIFIERS['north_winter'].wateringAdjustment).toBeGreaterThan(0);
  });
});

// ─── getDirectionModifiers ─────────────────────────────────────────────────

describe('getDirectionModifiers', () => {
  it('returns correct modifier for known key', () => {
    const result = getDirectionModifiers('east', 'spring');
    expect(result.lightIntensity).toBe('High');
    expect(result.direction).toBe('east');
    expect(result.season).toBe('spring');
  });

  it('falls back to east_spring for unknown direction', () => {
    const result = getDirectionModifiers('southeast', 'spring');
    expect(result).toEqual(DIRECTION_MODIFIERS['east_spring']);
  });

  it('falls back to east_spring for unknown season', () => {
    const result = getDirectionModifiers('north', 'monsoon');
    expect(result).toEqual(DIRECTION_MODIFIERS['east_spring']);
  });
});

// ─── Weather-Aware Direction Modifiers ─────────────────────────────────────

describe('WEATHER_AWARE_DIRECTION_MODIFIERS', () => {
  it('covers all 16 direction × season combinations', () => {
    const directions = ['north', 'east', 'south', 'west'];
    const seasons = ['winter', 'spring', 'summer', 'autumn'];
    directions.forEach(dir => {
      seasons.forEach(season => {
        const key = `${dir}_${season}`;
        expect(WEATHER_AWARE_DIRECTION_MODIFIERS[key]).toBeDefined();
        expect(typeof WEATHER_AWARE_DIRECTION_MODIFIERS[key].getModifiers).toBe('function');
      });
    });
  });
});

describe('getWeatherAwareDirectionModifiers', () => {

  // ── North: unaffected by heat ──────────────────────────────────────────

  describe('north window', () => {
    it('stays Low intensity in spring regardless of heat', () => {
      const result = getWeatherAwareDirectionModifiers('north', 'spring', cairoSpring);
      expect(result.lightIntensity).toBe('Low');
    });

    it('stays Medium in summer (protected from harsh sun)', () => {
      const result = getWeatherAwareDirectionModifiers('north', 'summer', cairoSummerExtreme);
      expect(result.lightIntensity).toBe('Medium');
    });

    it('never triggers danger warning', () => {
      const result = getWeatherAwareDirectionModifiers('north', 'summer', cairoSummerExtreme);
      expect(result.warning ?? '').not.toContain('🔥');
    });
  });

  // ── South: most weather-sensitive window ──────────────────────────────

  describe('south window', () => {
    it('spring → Very High light', () => {
      const result = getWeatherAwareDirectionModifiers('south', 'spring', cairoSpring);
      expect(result.lightIntensity).toBe('Very High');
    });

    it('extreme summer heat (≥38°C) → 🔥 DANGER warning', () => {
      const result = getWeatherAwareDirectionModifiers('south', 'summer', cairoSummerExtreme);
      expect(result.warning).toContain('🔥 DANGER');
    });

    it('extreme summer → most aggressive watering adjustment (-3)', () => {
      const result = getWeatherAwareDirectionModifiers('south', 'summer', cairoSummerExtreme);
      expect(result.wateringAdjustment).toBeLessThanOrEqual(-3);
    });

    it('winter → High (gentler, beneficial)', () => {
      const result = getWeatherAwareDirectionModifiers('south', 'winter', cairoWinter);
      expect(result.lightIntensity).toBe('High');
      expect(result.benefit).toBeDefined();
    });

    it('moderate summer heat (30°C) → warning but NOT 🔥 DANGER', () => {
      const result = getWeatherAwareDirectionModifiers('south', 'summer', cairoSummerModerate);
      if (result.warning) {
        expect(result.warning).not.toContain('🔥 DANGER');
      }
    });
  });

  // ── West: afternoon sun ────────────────────────────────────────────────

  describe('west window', () => {
    it('extreme summer heat (≥38°C) → 🔥 DANGER warning', () => {
      const result = getWeatherAwareDirectionModifiers('west', 'summer', cairoSummerExtreme);
      expect(result.warning).toContain('🔥 DANGER');
    });

    it('winter → Medium intensity (manageable)', () => {
      const result = getWeatherAwareDirectionModifiers('west', 'winter', cairoWinter);
      expect(result.lightIntensity).toBe('Medium');
    });
  });

  // ── East: gentle morning sun ───────────────────────────────────────────

  describe('east window', () => {
    it('spring → High intensity', () => {
      const result = getWeatherAwareDirectionModifiers('east', 'spring', cairoSpring);
      expect(result.lightIntensity).toBe('High');
    });

    it('never triggers 🔥 DANGER even in extreme heat', () => {
      const result = getWeatherAwareDirectionModifiers('east', 'summer', cairoSummerExtreme);
      expect(result.warning ?? '').not.toContain('🔥 DANGER');
    });
  });

  // ── Fallback ───────────────────────────────────────────────────────────

  describe('fallback', () => {
    it('unknown key returns east_spring defaults', () => {
      const result = getWeatherAwareDirectionModifiers('northeast', 'spring', cairoSpring);
      const eastSpring = getWeatherAwareDirectionModifiers('east', 'spring', cairoSpring);
      expect(result.lightIntensity).toBe(eastSpring.lightIntensity);
    });
  });
});

// ─── Directional light ranking ─────────────────────────────────────────────
//
// Validates the real-world expectation: in summer Cairo, south and west
// windows are harshest (Very High), north is gentlest (Medium).

describe('summer light intensity ranking (Cairo)', () => {
  const intensityRank = { 'Very Low': 0, 'Low': 1, 'Medium': 2, 'High': 3, 'Very High': 4 };

  it('north summer < east summer in light intensity', () => {
    const north = getWeatherAwareDirectionModifiers('north', 'summer', cairoSummerExtreme);
    const east = getWeatherAwareDirectionModifiers('east', 'summer', cairoSummerExtreme);
    expect(intensityRank[north.lightIntensity]).toBeLessThan(intensityRank[east.lightIntensity]);
  });

  it('south summer ≥ east summer in light intensity', () => {
    const south = getWeatherAwareDirectionModifiers('south', 'summer', cairoSummerExtreme);
    const east = getWeatherAwareDirectionModifiers('east', 'summer', cairoSummerExtreme);
    expect(intensityRank[south.lightIntensity]).toBeGreaterThanOrEqual(intensityRank[east.lightIntensity]);
  });
});

// ─── directSunHours field ───────────────────────────────────────────────────

describe('directSunHours field', () => {
  it('north has 0 direct sun hours in all seasons (Northern Hemisphere physics)', () => {
    ['winter', 'spring', 'summer', 'autumn'].forEach(s => {
      expect(DIRECTION_MODIFIERS[`north_${s}`].directSunHours).toBe(0);
    });
  });

  it('south has more direct sun in winter than summer (sun arcs higher in summer)', () => {
    expect(DIRECTION_MODIFIERS.south_winter.directSunHours)
      .toBeGreaterThan(DIRECTION_MODIFIERS.south_summer.directSunHours);
  });

  it('west summer has at least as much direct sun as south summer or east summer', () => {
    expect(DIRECTION_MODIFIERS.west_summer.directSunHours)
      .toBeGreaterThanOrEqual(DIRECTION_MODIFIERS.south_summer.directSunHours);
    expect(DIRECTION_MODIFIERS.west_summer.directSunHours)
      .toBeGreaterThanOrEqual(DIRECTION_MODIFIERS.east_summer.directSunHours);
  });

  it('weather-aware getter injects directSunHours into the result', () => {
    const result = getWeatherAwareDirectionModifiers('south', 'winter', cairoWinter);
    expect(typeof result.directSunHours).toBe('number');
    expect(result.directSunHours).toBe(DIRECTION_MODIFIERS.south_winter.directSunHours);
  });

  it('weather-aware north window always has 0 directSunHours', () => {
    ['winter', 'spring', 'summer', 'autumn'].forEach(s => {
      const result = getWeatherAwareDirectionModifiers('north', s, cairoSpring);
      expect(result.directSunHours).toBe(0);
    });
  });
});

// ─── Latitude scaling ───────────────────────────────────────────────────────

describe('scaleDirectionForLatitude', () => {
  it('Cairo (30°N) returns baseline modifier unchanged', () => {
    const baseline = DIRECTION_MODIFIERS.south_spring;
    expect(scaleDirectionForLatitude(baseline, 30).lightIntensity)
      .toBe(baseline.lightIntensity);
  });

  it('Berlin (52°N) reduces intensity by one level', () => {
    const baseline = DIRECTION_MODIFIERS.south_summer; // Very High
    expect(scaleDirectionForLatitude(baseline, 52).lightIntensity).toBe('High');
  });

  it('Stockholm (~60°N) reduces intensity by two levels', () => {
    const baseline = DIRECTION_MODIFIERS.south_summer; // Very High
    expect(scaleDirectionForLatitude(baseline, 65).lightIntensity).toBe('Medium');
  });

  it('Khartoum (15°N) increases intensity by one level', () => {
    const baseline = DIRECTION_MODIFIERS.east_spring; // High
    expect(scaleDirectionForLatitude(baseline, 15).lightIntensity).toBe('Very High');
  });

  it('Sydney (-33°S) flips north and south windows', () => {
    const sydneyNorth = scaleDirectionForLatitude(DIRECTION_MODIFIERS.north_summer, -33);
    expect(sydneyNorth.lightIntensity).toBe(DIRECTION_MODIFIERS.south_summer.lightIntensity);
  });
});

describe('getWeatherAwareDirectionModifiers with latitude', () => {
  it('Cairo (30°N) baseline produces same intensity as no-lat call', () => {
    const noLat = getWeatherAwareDirectionModifiers('south', 'summer', cairoSummerModerate);
    const cairo = getWeatherAwareDirectionModifiers('south', 'summer', cairoSummerModerate, 30);
    expect(cairo.lightIntensity).toBe(noLat.lightIntensity);
  });

  it('Berlin (52°N) south window is dimmer than Cairo south window in summer', () => {
    const intensityRank = { 'Very Low': 0, 'Low': 1, 'Medium': 2, 'High': 3, 'Very High': 4 };
    const cairo = getWeatherAwareDirectionModifiers('south', 'summer', cairoSummerModerate, 30);
    const berlin = getWeatherAwareDirectionModifiers('south', 'summer', cairoSummerModerate, 52);
    expect(intensityRank[berlin.lightIntensity])
      .toBeLessThan(intensityRank[cairo.lightIntensity]);
  });
});

// ─── west_summer vs south_summer rebalance ──────────────────────────────────

describe('west_summer vs south_summer rebalance', () => {
  it('west_summer wateringAdjustment is more urgent (more negative) than south_summer', () => {
    expect(DIRECTION_MODIFIERS.west_summer.wateringAdjustment)
      .toBeLessThan(DIRECTION_MODIFIERS.south_summer.wateringAdjustment);
  });

  it('west_summer warning explicitly mentions afternoon penetration or scorch danger', () => {
    expect(DIRECTION_MODIFIERS.west_summer.warning).toMatch(/afternoon|penetrat|scorch|🔥/i);
  });
});
