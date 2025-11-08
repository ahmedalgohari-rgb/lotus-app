/**
 * Smart Logger Utility for Lotus Plant Care App
 *
 * Automatically disables debug/info logs in production builds
 * while preserving warnings and errors for critical issues.
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.debug('User action:', data);  // Only in dev
 *   logger.info('API response:', res);    // Only in dev
 *   logger.warn('API slow:', time);       // Always shown
 *   logger.error('API failed:', err);     // Always shown
 */

const isDevelopment = __DEV__;

export const logger = {
  /**
   * Debug logs - Development only
   * Use for detailed debugging and troubleshooting
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('🔍 DEBUG:', ...args);
    }
  },

  /**
   * Info logs - Development only
   * Use for general information and flow tracking
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('ℹ️  INFO:', ...args);
    }
  },

  /**
   * Warning logs - Always shown
   * Use for recoverable issues and fallback scenarios
   */
  warn: (...args: any[]) => {
    console.warn('⚠️  WARN:', ...args);
  },

  /**
   * Error logs - Always shown
   * Use for critical errors and failures
   */
  error: (...args: any[]) => {
    console.error('❌ ERROR:', ...args);
  },

  /**
   * Success logs - Development only
   * Use for successful operations (helps with debugging)
   */
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('✅ SUCCESS:', ...args);
    }
  },

  /**
   * Network logs - Development only
   * Use for API calls and network operations
   */
  network: (...args: any[]) => {
    if (isDevelopment) {
      console.log('🌐 NETWORK:', ...args);
    }
  },

  /**
   * Performance logs - Development only
   * Use for timing and performance metrics
   */
  perf: (...args: any[]) => {
    if (isDevelopment) {
      console.log('⚡ PERF:', ...args);
    }
  },

  /**
   * Table logs - Development only
   * Use for structured data display
   */
  table: (data: any) => {
    if (isDevelopment && console.table) {
      console.table(data);
    }
  },

  /**
   * Group logs - Development only
   * Use for organizing related logs
   */
  group: (label: string, collapsed: boolean = false) => {
    if (isDevelopment) {
      if (collapsed) {
        console.groupCollapsed(label);
      } else {
        console.group(label);
      }
    }
  },

  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },
};

/**
 * Conditional logger - only logs if condition is true
 */
export const logIf = (condition: boolean, ...args: any[]) => {
  if (condition && isDevelopment) {
    console.log(...args);
  }
};

/**
 * Timer utility for performance measurement
 */
export const timer = {
  timers: new Map<string, number>(),

  start: (label: string) => {
    if (isDevelopment) {
      timer.timers.set(label, Date.now());
    }
  },

  end: (label: string) => {
    if (isDevelopment) {
      const startTime = timer.timers.get(label);
      if (startTime) {
        const duration = Date.now() - startTime;
        logger.perf(`${label}: ${duration}ms`);
        timer.timers.delete(label);
      }
    }
  },
};

export default logger;
