import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { logger } from './logger';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  version?: string; // Cache version for invalidation
  maxEntries?: number; // Maximum cache entries
}

const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes
const DEFAULT_MAX_ENTRIES = 100;
const CACHE_VERSION = '1.0.0';

/**
 * Comprehensive API response caching system
 */
export class ApiCache {
  private cacheKey: string;
  private defaultTTL: number;
  private maxEntries: number;
  private version: string;

  constructor(
    cacheKey: string,
    options: CacheOptions = {}
  ) {
    this.cacheKey = `api_cache_${cacheKey}`;
    this.defaultTTL = options.ttl || DEFAULT_TTL;
    this.maxEntries = options.maxEntries || DEFAULT_MAX_ENTRIES;
    this.version = options.version || CACHE_VERSION;
  }

  /**
   * Generate cache key from parameters
   */
  private generateKey(params: any): string {
    const serialized = JSON.stringify(params, Object.keys(params).sort());
    return CryptoJS.SHA1(serialized).toString();
  }

  /**
   * Get cached data
   */
  async get<T>(key: string | any): Promise<T | null> {
    try {
      const cacheKey = typeof key === 'string' ? key : this.generateKey(key);
      const fullKey = `${this.cacheKey}_${cacheKey}`;
      
      const cached = await AsyncStorage.getItem(fullKey);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Check version compatibility
      if (entry.version !== this.version) {
        await this.delete(cacheKey);
        return null;
      }

      // Check expiration
      if (Date.now() > entry.expiresAt) {
        await this.delete(cacheKey);
        return null;
      }

      return entry.data;
    } catch (error) {
      logger.error('❌ Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  async set<T>(key: string | any, data: T, ttl?: number): Promise<void> {
    try {
      const cacheKey = typeof key === 'string' ? key : this.generateKey(key);
      const fullKey = `${this.cacheKey}_${cacheKey}`;
      const expirationTime = ttl || this.defaultTTL;
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + expirationTime,
        version: this.version
      };

      await AsyncStorage.setItem(fullKey, JSON.stringify(entry));

      // Clean up old entries if needed
      await this.cleanup();
    } catch (error) {
      logger.error('❌ Cache set error:', error);
    }
  }

  /**
   * Delete cached entry
   */
  async delete(key: string | any): Promise<void> {
    try {
      const cacheKey = typeof key === 'string' ? key : this.generateKey(key);
      const fullKey = `${this.cacheKey}_${cacheKey}`;
      await AsyncStorage.removeItem(fullKey);
    } catch (error) {
      logger.error('❌ Cache delete error:', error);
    }
  }

  /**
   * Clear all cache entries for this cache instance
   */
  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cacheKey));


      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      logger.error('❌ Cache clear error:', error);
    }
  }

  /**
   * Get or set pattern - fetch if not cached
   */
  async getOrSet<T>(
    key: string | any,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFunction();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Clean up expired entries and manage cache size
   */
  private async cleanup(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cacheKey));
      
      if (cacheKeys.length <= this.maxEntries) return;

      // Get all cache entries with timestamps
      const entries: Array<{ key: string; timestamp: number; expired: boolean }> = [];
      
      for (const key of cacheKeys) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry<any> = JSON.parse(cached);
            entries.push({
              key,
              timestamp: entry.timestamp,
              expired: Date.now() > entry.expiresAt
            });
          }
        } catch (error) {
          // Invalid entry, mark for deletion
          entries.push({ key, timestamp: 0, expired: true });
        }
      }

      // Remove expired entries first
      const expiredKeys = entries.filter(e => e.expired).map(e => e.key);
      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
      }

      // If still over limit, remove oldest entries
      const remainingEntries = entries.filter(e => !e.expired);
      if (remainingEntries.length > this.maxEntries) {
        const sorted = remainingEntries.sort((a, b) => a.timestamp - b.timestamp);
        const toRemove = sorted.slice(0, remainingEntries.length - this.maxEntries);
        const keysToRemove = toRemove.map(e => e.key);

        await AsyncStorage.multiRemove(keysToRemove);
      }
    } catch (error) {
      logger.error('❌ Cache cleanup error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    totalSizeKB: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cacheKey));
      
      let totalSize = 0;
      let expiredCount = 0;
      const timestamps: number[] = [];
      
      for (const key of cacheKeys) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (cached) {
            totalSize += cached.length;
            const entry: CacheEntry<any> = JSON.parse(cached);
            timestamps.push(entry.timestamp);
            
            if (Date.now() > entry.expiresAt) {
              expiredCount++;
            }
          }
        } catch (error) {
          expiredCount++;
        }
      }

      return {
        totalEntries: cacheKeys.length,
        expiredEntries: expiredCount,
        totalSizeKB: Math.round(totalSize / 1024),
        oldestEntry: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null,
        newestEntry: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null
      };
    } catch (error) {
      logger.error('❌ Cache stats error:', error);
      return {
        totalEntries: 0,
        expiredEntries: 0,
        totalSizeKB: 0,
        oldestEntry: null,
        newestEntry: null
      };
    }
  }
}

// Pre-configured cache instances for different services
export const plantNetCache = new ApiCache('plantnet', {
  ttl: 30 * 60 * 1000, // 30 minutes - plant identification results don't change often
  maxEntries: 50
});

export const weatherCache = new ApiCache('weather', {
  ttl: 10 * 60 * 1000, // 10 minutes - weather data updates frequently
  maxEntries: 20
});

export const plantDataCache = new ApiCache('plant_data', {
  ttl: 24 * 60 * 60 * 1000, // 24 hours - plant care data is static
  maxEntries: 100
});

/**
 * Utility function to create cache-aware API calls
 */
export function createCachedApiCall<TParams, TResult>(
  cache: ApiCache,
  apiFunction: (params: TParams) => Promise<TResult>,
  keyGenerator?: (params: TParams) => string,
  ttl?: number
) {
  return async (params: TParams): Promise<TResult> => {
    const cacheKey = keyGenerator ? keyGenerator(params) : params;
    
    return cache.getOrSet(
      cacheKey,
      () => apiFunction(params),
      ttl
    );
  };
}