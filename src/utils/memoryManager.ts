// ✅ FIX: Use legacy FileSystem API to avoid deprecation errors
import * as FileSystem from 'expo-file-system/legacy';
import React from 'react';
import { logger } from './logger';

export interface MemoryStats {
  totalMemoryMB: number;
  usedMemoryMB: number;
  freeMemoryMB: number;
  cacheSize: number;
  tempFilesCount: number;
}

/**
 * Memory management utilities for better app performance
 */
export class MemoryManager {
  private static tempFiles: Set<string> = new Set();
  private static imageCache: Map<string, { uri: string; timestamp: number }> = new Map();
  private static readonly MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 20; // Maximum cached images

  /**
   * Register temporary file for cleanup
   */
  static registerTempFile(uri: string): void {
    this.tempFiles.add(uri);
  }

  /**
   * Clean up all temporary files
   */
  static async cleanupTempFiles(): Promise<void> {
    const cleanupPromises = Array.from(this.tempFiles).map(async (uri) => {
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        this.tempFiles.delete(uri);
      } catch (error) {
        logger.warn('⚠️ Failed to delete temp file:', uri, error);
        // Remove from set anyway to prevent memory leaks
        this.tempFiles.delete(uri);
      }
    });

    await Promise.allSettled(cleanupPromises);
  }

  /**
   * Clean up old cached images from memory
   */
  static cleanupImageCache(): void {
    const now = Date.now();
    const entriesToRemove: string[] = [];

    // Find expired entries
    for (const [key, value] of this.imageCache.entries()) {
      if (now - value.timestamp > this.MAX_CACHE_AGE) {
        entriesToRemove.push(key);
      }
    }

    // Remove expired entries
    entriesToRemove.forEach(key => {
      this.imageCache.delete(key);
    });

    // If still over limit, remove oldest entries
    if (this.imageCache.size > this.MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(this.imageCache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = sortedEntries.slice(0, this.imageCache.size - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => {
        this.imageCache.delete(key);
      });
    }
  }

  /**
   * Add image to memory cache
   */
  static cacheImage(key: string, uri: string): void {
    this.imageCache.set(key, { uri, timestamp: Date.now() });
    
    // Trigger cleanup if cache is getting large
    if (this.imageCache.size > this.MAX_CACHE_SIZE) {
      this.cleanupImageCache();
    }
  }

  /**
   * Get cached image
   */
  static getCachedImage(key: string): string | null {
    const cached = this.imageCache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.MAX_CACHE_AGE) {
      this.imageCache.delete(key);
      return null;
    }

    return cached.uri;
  }

  /**
   * Force garbage collection (if possible)
   */
  static forceGarbageCollection(): void {
    try {
      // Clean up our own caches first
      this.cleanupImageCache();
      
      // Clean up temp files
      this.cleanupTempFiles();

      // Try to force GC (this is platform dependent and may not work)
      if (global.gc) {
        global.gc();
      }
    } catch (error) {
      logger.warn('⚠️ Garbage collection failed:', error);
    }
  }

  /**
   * Get memory usage statistics
   */
  static async getMemoryStats(): Promise<MemoryStats> {
    try {
      // Get app cache directory info (if available)
      let cacheSize = 0;
      const cacheDir = (FileSystem as any).cacheDirectory;
      if (cacheDir) {
        try {
          const cacheInfo = await FileSystem.getInfoAsync(cacheDir);
          cacheSize = (cacheInfo.exists && 'size' in cacheInfo) ? cacheInfo.size : 0;
        } catch (error) {
          // Cache directory not accessible
          cacheSize = 0;
        }
      }

      return {
        totalMemoryMB: 0, // Not available in React Native
        usedMemoryMB: 0,  // Not available in React Native
        freeMemoryMB: 0,  // Not available in React Native
        cacheSize: Math.round(cacheSize / (1024 * 1024)), // Convert to MB
        tempFilesCount: this.tempFiles.size
      };
    } catch (error) {
      logger.error('❌ Failed to get memory stats:', error);
      return {
        totalMemoryMB: 0,
        usedMemoryMB: 0,
        freeMemoryMB: 0,
        cacheSize: 0,
        tempFilesCount: this.tempFiles.size
      };
    }
  }

  /**
   * Memory pressure handler - called when app is running low on memory
   */
  static handleMemoryPressure(): void {
    // Clean up all caches
    this.cleanupImageCache();
    this.imageCache.clear();

    // Clean up temp files
    this.cleanupTempFiles();

    // Force garbage collection
    this.forceGarbageCollection();
  }

  /**
   * Initialize memory manager with cleanup intervals
   */
  static initialize(): void {
    // Clean up caches every 5 minutes
    setInterval(() => {
      this.cleanupImageCache();
    }, 5 * 60 * 1000);

    // Clean up temp files every 10 minutes
    setInterval(() => {
      this.cleanupTempFiles();
    }, 10 * 60 * 1000);
  }

  /**
   * Clean up all memory manager resources
   */
  static cleanup(): void {
    this.cleanupImageCache();
    this.imageCache.clear();
    this.cleanupTempFiles();
  }
}

/**
 * React hook for memory management
 */
export function useMemoryManager() {
  const cleanup = () => {
    MemoryManager.cleanupImageCache();
  };

  const forceCleanup = () => {
    MemoryManager.handleMemoryPressure();
  };

  const getStats = () => {
    return MemoryManager.getMemoryStats();
  };

  return {
    cleanup,
    forceCleanup,
    getStats
  };
}

/**
 * HOC for automatic memory cleanup on component unmount
 */
export function withMemoryCleanup<P extends object>(Component: React.ComponentType<P>) {
  const MemoryCleanupComponent = React.forwardRef<any, P>((props, ref) => {
    React.useEffect(() => {
      return () => {
        MemoryManager.cleanupImageCache();
      };
    }, []);

    return React.createElement(Component, { ...props, ref } as any);
  });

  MemoryCleanupComponent.displayName = `withMemoryCleanup(${Component.displayName || Component.name})`;
  return MemoryCleanupComponent;
}