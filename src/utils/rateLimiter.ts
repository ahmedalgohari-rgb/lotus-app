/**
 * Rate Limiter Utility
 *
 * Implements client-side rate limiting to protect against API abuse.
 * Uses AsyncStorage to persist rate limit data across app sessions.
 *
 * Security Benefits:
 * - Prevents excessive API calls that could rack up costs
 * - Protects against accidental DoS of backend services
 * - Improves user experience with clear rate limit messages
 * - Reduces risk of hitting API quota limits
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key prefix for rate limit data
const RATE_LIMIT_PREFIX = '@lotus:rateLimit:';

// Rate limit configurations
export const RATE_LIMITS = {
  // PlantNet API: 10 scans per hour (well below the 500/day limit)
  PLANT_SCAN: {
    key: 'plantScan',
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'You\'ve reached your hourly scan limit. Please try again in a few minutes.',
  },

  // Plant CRUD operations: 50 operations per hour
  PLANT_OPERATIONS: {
    key: 'plantOperations',
    maxRequests: 50,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many plant operations. Please wait a moment and try again.',
  },

  // Weather API: 10 requests per 10 minutes (we already cache for 10 min)
  WEATHER_API: {
    key: 'weatherApi',
    maxRequests: 10,
    windowMs: 10 * 60 * 1000, // 10 minutes
    message: 'Weather data is temporarily unavailable. Using cached data.',
  },
};

interface RateLimitData {
  requests: number[];  // Array of timestamps
  resetTime: number;   // When the current window resets
}

/**
 * Rate Limiter Class
 * Manages rate limiting for different API endpoints
 */
export class RateLimiter {
  private key: string;
  private maxRequests: number;
  private windowMs: number;
  private message: string;

  constructor(config: typeof RATE_LIMITS.PLANT_SCAN) {
    this.key = config.key;
    this.maxRequests = config.maxRequests;
    this.windowMs = config.windowMs;
    this.message = config.message;
  }

  /**
   * Get the storage key for this rate limiter
   */
  private getStorageKey(): string {
    return `${RATE_LIMIT_PREFIX}${this.key}`;
  }

  /**
   * Load rate limit data from AsyncStorage
   */
  private async loadData(): Promise<RateLimitData> {
    try {
      const data = await AsyncStorage.getItem(this.getStorageKey());
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load rate limit data:', error);
    }

    // Return default data if nothing found
    return {
      requests: [],
      resetTime: Date.now() + this.windowMs,
    };
  }

  /**
   * Save rate limit data to AsyncStorage
   */
  private async saveData(data: RateLimitData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.getStorageKey(), JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save rate limit data:', error);
    }
  }

  /**
   * Clean up old request timestamps that are outside the current window
   */
  private cleanupOldRequests(requests: number[], now: number): number[] {
    const cutoff = now - this.windowMs;
    return requests.filter(timestamp => timestamp > cutoff);
  }

  /**
   * Check if a request can be made
   * Returns { allowed: true } if request is allowed
   * Returns { allowed: false, retryAfter: number, message: string } if rate limited
   */
  async checkLimit(): Promise<
    | { allowed: true }
    | { allowed: false; retryAfter: number; message: string; remaining: number }
  > {
    const now = Date.now();
    const data = await this.loadData();

    // Check if we need to reset the window
    if (now >= data.resetTime) {
      data.requests = [];
      data.resetTime = now + this.windowMs;
    }

    // Clean up old requests
    const validRequests = this.cleanupOldRequests(data.requests, now);

    // Check if limit exceeded
    if (validRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const retryAfter = Math.ceil((oldestRequest + this.windowMs - now) / 1000); // seconds

      return {
        allowed: false,
        retryAfter,
        message: this.message,
        remaining: 0,
      };
    }

    return { allowed: true };
  }

  /**
   * Record a successful request
   * Should be called after a request is made
   */
  async recordRequest(): Promise<void> {
    const now = Date.now();
    const data = await this.loadData();

    // Clean up old requests
    data.requests = this.cleanupOldRequests(data.requests, now);

    // Add new request
    data.requests.push(now);

    // Save updated data
    await this.saveData(data);
  }

  /**
   * Get current rate limit status
   * Useful for displaying remaining requests to users
   */
  async getStatus(): Promise<{
    remaining: number;
    total: number;
    resetTime: number;
    resetIn: number; // seconds
  }> {
    const now = Date.now();
    const data = await this.loadData();

    // Clean up old requests
    const validRequests = this.cleanupOldRequests(data.requests, now);

    const remaining = Math.max(0, this.maxRequests - validRequests.length);
    const resetTime = data.resetTime;
    const resetIn = Math.ceil((resetTime - now) / 1000);

    return {
      remaining,
      total: this.maxRequests,
      resetTime,
      resetIn: Math.max(0, resetIn),
    };
  }

  /**
   * Reset rate limit data (useful for testing or admin override)
   */
  async reset(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getStorageKey());
    } catch (error) {
      console.error('Failed to reset rate limit data:', error);
    }
  }

  /**
   * Format retry time for user display
   */
  static formatRetryTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }

    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}

/**
 * Create rate limiter instances for different APIs
 */
export const plantScanLimiter = new RateLimiter(RATE_LIMITS.PLANT_SCAN);
export const plantOperationsLimiter = new RateLimiter(RATE_LIMITS.PLANT_OPERATIONS);
export const weatherApiLimiter = new RateLimiter(RATE_LIMITS.WEATHER_API);

/**
 * Helper function to wrap an async function with rate limiting
 *
 * Example usage:
 * const rateLimitedScan = withRateLimit(plantScanLimiter, scanPlantFunction);
 * await rateLimitedScan(imageUri);
 */
export async function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  limiter: RateLimiter,
  fn: T
): Promise<T> {
  return (async (...args: Parameters<T>) => {
    const check = await limiter.checkLimit();

    if (!check.allowed) {
      const error = new Error(check.message) as any;
      error.isRateLimitError = true;
      error.retryAfter = check.retryAfter;
      error.remaining = check.remaining;
      throw error;
    }

    try {
      const result = await fn(...args);
      await limiter.recordRequest();
      return result;
    } catch (error) {
      // Don't record failed requests in rate limit
      throw error;
    }
  }) as T;
}

/**
 * Type guard to check if an error is a rate limit error
 */
export function isRateLimitError(error: any): error is Error & {
  isRateLimitError: true;
  retryAfter: number;
  remaining: number;
} {
  return error?.isRateLimitError === true;
}
