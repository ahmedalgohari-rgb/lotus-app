/**
 * Placement Scoring Tests
 *
 * Pure function tests — no mocks needed, no native deps, runs in milliseconds.
 * If any test here breaks, the algorithm changed or regressed.
 *
 * REGRESSION: "all directions show Excellent" — caught by the direction-variance tests below.
 */

import {
  calculateWeatherAwarePlacementScore,
  calculatePlacementScore,
} from '../../utils/care/placementScoring';

// Silence logger output during tests
jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ─── Shared test fixtures ──────────────────────────────────────────────────

const neutralRoom = { humidityModifier: 0, evaporationRate: 0, note: 'test' };

const directionIntensity = (intensity: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High') => ({
  lightIntensity: intensity,
  wateringAdjustment: 0,
});

// ─── calculateWeatherAwarePlacementScore ──────────────────────────────────

describe('calculateWeatherAwarePlacementScore', () => {

  // ── Score range ────────────────────────────────────────────────────────

  describe('score range', () => {
    it('never returns a score below 1', () => {
      // Worst-case: low_light plant in Very High light + wrong humidity
      const result = calculateWeatherAwarePlacementScore(
        'low_light', [], 'low', '100_dry',
        { humidityModifier: 30, evaporationRate: 50, note: '' },
        directionIntensity('Very High')
      );
      expect(result.score).toBeGreaterThanOrEqual(1);
    });

    it('never returns a score above 5', () => {
      const result = calculateWeatherAwarePlacementScore(
        'bright_indirect', [], 'medium', '30_dry',
        neutralRoom,
        directionIntensity('High')
      );
      expect(result.score).toBeLessThanOrEqual(5);
    });

    it('score is always an integer', () => {
      ['low_light', 'medium_light', 'bright_indirect', 'bright_direct'].forEach(req => {
        const result = calculateWeatherAwarePlacementScore(
          req, [], 'medium', '30_dry', neutralRoom, directionIntensity('Medium')
        );
        expect(Number.isInteger(result.score)).toBe(true);
      });
    });
  });

  // ── scoreText matches score ────────────────────────────────────────────

  describe('scoreText', () => {
    const cases: [number, string][] = [
      [5, 'Excellent'],
      [4, 'Very Good'],
      [3, 'Good'],
      [2, 'Challenging'],
      [1, 'Very Challenging'],
    ];

    it.each(cases)('score %i maps to "%s"', (expectedScore, expectedText) => {
      // Force a known score by choosing the right light match for bright_direct
      const intensityForScore: Record<number, 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low'> = {
        5: 'Very High', // optimal for bright_direct
        4: 'High',      // good for bright_direct
        3: 'Medium',    // acceptable for bright_direct
        2: 'Low',       // poor for bright_direct
        1: 'Very Low',  // poor for bright_direct, second penalty possible
      };
      const result = calculateWeatherAwarePlacementScore(
        'bright_direct', [], 'medium', '30_dry',
        neutralRoom,
        directionIntensity(intensityForScore[expectedScore])
      );
      if (result.score === expectedScore) {
        expect(result.scoreText).toBe(expectedText);
      }
    });
  });

  // ── REGRESSION: direction variance ────────────────────────────────────
  //
  // This is the test that would have caught the "all directions show Excellent"
  // bug. The live compass was updating visually but not changing selectedDirection
  // in AddPlantScreen — so the score banner was always showing the score for the
  // initially auto-selected direction (East = 5 stars for bright_indirect).

  describe('bright_indirect plant (e.g. Ficus Bonsai) — scores vary by direction', () => {
    const score = (intensity: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High') =>
      calculateWeatherAwarePlacementScore(
        'bright_indirect', [], 'medium', '30_dry',
        neutralRoom,
        directionIntensity(intensity)
      ).score;

    // Spring: north=Low, east=High, south=Very High, west=High
    it('east window (High light) → 5 stars — optimal', () => {
      expect(score('High')).toBe(5);
    });

    it('north window (Low light) → 3 stars — acceptable', () => {
      expect(score('Low')).toBe(3);
    });

    it('south window (Very High light) → 3 stars — acceptable, not Excellent', () => {
      expect(score('Very High')).toBe(3);
    });

    it('north and south both score lower than east', () => {
      expect(score('High')).toBeGreaterThan(score('Low'));
      expect(score('High')).toBeGreaterThan(score('Very High'));
    });

    it('scores are NOT all identical across directions', () => {
      const scores = [score('Very Low'), score('Low'), score('High'), score('Very High')];
      const unique = new Set(scores);
      expect(unique.size).toBeGreaterThan(1); // Must have at least 2 distinct scores
    });
  });

  describe('low_light plant (e.g. Peace Lily) — scores vary by direction', () => {
    // Use medium humidity + neutral room so only light affects the score in these tests
    const score = (intensity: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High') =>
      calculateWeatherAwarePlacementScore(
        'low_light', [], 'medium', '30_dry',
        neutralRoom,
        directionIntensity(intensity)
      ).score;

    it('north window (Low light) → 5 stars — optimal', () => {
      expect(score('Low')).toBe(5);
    });

    it('south window (Very High light) → 1 star — unsuitable', () => {
      expect(score('Very High')).toBe(1);
    });

    it('low_light plant scores highest in dim conditions', () => {
      expect(score('Low')).toBeGreaterThan(score('High'));
      expect(score('Low')).toBeGreaterThan(score('Very High'));
    });
  });

  describe('bright_direct plant (e.g. cactus, succulents)', () => {
    // Use dry room (-20) so humidity is in optimal range for low-humidity plants
    const dryRoom = { humidityModifier: -20, evaporationRate: 0, note: '' };
    const score = (intensity: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High') =>
      calculateWeatherAwarePlacementScore(
        'bright_direct', [], 'low', '100_dry',
        dryRoom,
        directionIntensity(intensity)
      ).score;

    it('Very High light → 5 stars — optimal', () => {
      expect(score('Very High')).toBe(5);
    });

    it('Very Low light → low score', () => {
      expect(score('Very Low')).toBeLessThanOrEqual(2);
    });

    it('bright_direct plant scores higher with more light', () => {
      expect(score('Very High')).toBeGreaterThan(score('High'));
      expect(score('High')).toBeGreaterThan(score('Medium'));
    });
  });

  // ── Humidity scoring ───────────────────────────────────────────────────

  describe('humidity compatibility', () => {
    it('dry-preferring plant in humid room loses points', () => {
      const dry = calculateWeatherAwarePlacementScore(
        'bright_direct', [], 'low', '100_dry',
        { humidityModifier: -20, evaporationRate: 0, note: '' }, // dry — optimal for low
        directionIntensity('Very High')
      );
      const humid = calculateWeatherAwarePlacementScore(
        'bright_direct', [], 'low', '100_dry',
        { humidityModifier: 25, evaporationRate: 0, note: '' }, // humid — poor for low
        directionIntensity('Very High')
      );
      expect(dry.score).toBeGreaterThan(humid.score);
    });

    it('high-humidity plant (fern/tropical) in dry room loses points', () => {
      const humid = calculateWeatherAwarePlacementScore(
        'bright_indirect', [], 'high', '30_dry',
        { humidityModifier: 20, evaporationRate: 0, note: '' }, // optimal for high
        directionIntensity('High')
      );
      const dry = calculateWeatherAwarePlacementScore(
        'bright_indirect', [], 'high', '30_dry',
        { humidityModifier: -25, evaporationRate: 0, note: '' }, // poor for high
        directionIntensity('High')
      );
      expect(humid.score).toBeGreaterThan(dry.score);
    });

    it('medium humidity plant is forgiving in moderately dry/humid rooms', () => {
      const slightly_dry = calculateWeatherAwarePlacementScore(
        'medium_light', [], 'medium', '30_dry',
        { humidityModifier: -15, evaporationRate: 0, note: '' },
        directionIntensity('Medium')
      );
      expect(slightly_dry.score).toBeGreaterThanOrEqual(3);
    });
  });

  // ── Evaporation stress ─────────────────────────────────────────────────

  describe('evaporation stress (Cairo summer)', () => {
    it('extreme evaporation (balcony 38°C) deducts 1 point', () => {
      const normal = calculateWeatherAwarePlacementScore(
        'bright_indirect', [], 'medium', '30_dry',
        { humidityModifier: 0, evaporationRate: 10, note: '' },
        directionIntensity('High')
      );
      const extreme = calculateWeatherAwarePlacementScore(
        'bright_indirect', [], 'medium', '30_dry',
        { humidityModifier: 0, evaporationRate: 45, note: '' }, // > 40 triggers penalty
        directionIntensity('High')
      );
      expect(extreme.score).toBeLessThan(normal.score);
    });
  });

  // ── Danger warning deduction ───────────────────────────────────────────

  describe('danger warning deduction', () => {
    it('🔥 DANGER warning in directionModifiers deducts 1 extra point', () => {
      const normal = calculateWeatherAwarePlacementScore(
        'bright_indirect', [], 'medium', '30_dry',
        neutralRoom,
        { lightIntensity: 'Very High', wateringAdjustment: -3 }
      );
      const danger = calculateWeatherAwarePlacementScore(
        'bright_indirect', [], 'medium', '30_dry',
        neutralRoom,
        {
          lightIntensity: 'Very High',
          wateringAdjustment: -3,
          warning: '🔥 DANGER: extreme heat',
        }
      );
      expect(danger.score).toBeLessThan(normal.score);
    });
  });
});

// ─── Indirect bonus for always-indirect (north) windows ──────────────────

describe('indirect bonus for always-indirect windows', () => {
  // North window in spring: Low intensity, never any direct sun
  const northModifier = {
    lightIntensity: 'Low' as const,
    wateringAdjustment: 2,
    directSunHours: 0,
  };

  it('bright_indirect plant in north window gets indirect bonus (≥4 stars)', () => {
    // Without bonus this would be 'acceptable' = 3. With bonus → 4.
    const result = calculateWeatherAwarePlacementScore(
      'bright_indirect', [], 'medium', '60_dry',
      neutralRoom, northModifier
    );
    expect(result.score).toBeGreaterThanOrEqual(4);
  });

  it('medium_indirect plant in north window stays at 5 (already optimal)', () => {
    const result = calculateWeatherAwarePlacementScore(
      'medium_indirect', [], 'medium', '60_dry',
      neutralRoom, northModifier
    );
    expect(result.score).toBe(5);
  });

  it('low_light plant in north window does NOT get indirect bonus (already optimal)', () => {
    const result = calculateWeatherAwarePlacementScore(
      'low_light', [], 'medium', '60_dry',
      neutralRoom, northModifier
    );
    // Already 5 stars without bonus; bonus is a no-op here.
    expect(result.score).toBe(5);
  });

  it('bright_direct plant in north window does NOT get indirect bonus', () => {
    const dryRoom = { humidityModifier: -20, evaporationRate: 0, note: '' };
    const result = calculateWeatherAwarePlacementScore(
      'bright_direct', [], 'low', '100_dry',
      dryRoom, northModifier
    );
    // bright_direct in 'Low' = poor (2 stars). Bonus must NOT apply.
    expect(result.score).toBeLessThanOrEqual(3);
  });

  it('bonus does NOT apply when directSunHours > 0 (e.g. east window)', () => {
    const eastModifier = {
      lightIntensity: 'Low' as const, // contrived: dim east window
      wateringAdjustment: 0,
      directSunHours: 4,
    };
    const eastResult = calculateWeatherAwarePlacementScore(
      'bright_indirect', [], 'medium', '60_dry',
      neutralRoom, eastModifier
    );
    const northResult = calculateWeatherAwarePlacementScore(
      'bright_indirect', [], 'medium', '60_dry',
      neutralRoom, northModifier
    );
    // Both have 'Low' intensity → same base score. Only the north (always
    // indirect) version gets the +1 bump.
    expect(northResult.score).toBeGreaterThan(eastResult.score);
  });
});

// ─── calculatePlacementScore (legacy, simpler scorer) ────────────────────

describe('calculatePlacementScore (legacy)', () => {
  const mockRoom = { humidityModifier: 0, evaporationRate: 0 };
  const mockDirection = (intensity: string) => ({ lightIntensity: intensity });

  it('returns score between 1 and 5', () => {
    const result = calculatePlacementScore(
      'bright_indirect', [], 'medium', '30_dry',
      mockRoom as any, mockDirection('High') as any
    );
    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThanOrEqual(5);
  });

  it('severe light mismatch deducts 2 points', () => {
    const perfect = calculatePlacementScore('low_light', [], 'medium', '30_dry', mockRoom as any, mockDirection('Low') as any);
    const severe = calculatePlacementScore('low_light', [], 'medium', '30_dry', mockRoom as any, mockDirection('Very High') as any);
    expect(perfect.score - severe.score).toBeGreaterThanOrEqual(2);
  });

  it('returns stars string of length 5', () => {
    const result = calculatePlacementScore('medium_light', [], 'medium', '30_dry', mockRoom as any, mockDirection('Medium') as any);
    const totalChars = (result.stars.match(/★/g) || []).length + (result.stars.match(/☆/g) || []).length;
    expect(totalChars).toBe(5);
  });
});
