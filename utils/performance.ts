/**
 * Performance Monitoring Utilities
 * Track app performance metrics for optimization
 */

interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  componentName: string;
  action: string;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private isDevelopment = __DEV__;

  /**
   * Start measuring performance for a specific action
   */
  startMeasure(key: string, componentName: string, action: string): void {
    if (!this.isDevelopment) return;

    this.metrics.set(key, {
      startTime: Date.now(),
      componentName,
      action,
    });
  }

  /**
   * End measuring and log performance
   */
  endMeasure(key: string): number | null {
    if (!this.isDevelopment) return null;

    const metric = this.metrics.get(key);
    if (!metric) {
      console.warn(`Performance: No start measurement found for key: ${key}`);
      return null;
    }

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log performance if it takes longer than expected
    if (duration > 100) { // Log if > 100ms
      console.log(`⚡ Performance: ${metric.componentName}.${metric.action} took ${duration}ms`);
    }

    this.metrics.delete(key);
    return duration;
  }

  /**
   * Measure async function performance
   */
  async measureAsync<T>(
    key: string,
    componentName: string,
    action: string,
    asyncFn: () => Promise<T>
  ): Promise<T> {
    this.startMeasure(key, componentName, action);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      this.endMeasure(key);
    }
  }

  /**
   * Measure component render performance
   */
  measureRender(componentName: string): { start: () => void; end: () => void } {
    const key = `render-${componentName}-${Date.now()}`;
    
    return {
      start: () => this.startMeasure(key, componentName, 'render'),
      end: () => this.endMeasure(key),
    };
  }

  /**
   * Track memory usage (development only)
   */
  logMemoryUsage(context: string): void {
    if (!this.isDevelopment) return;

    // Note: React Native doesn't have performance.memory
    // This would need a native module for real memory tracking
    console.log(`📊 Memory check: ${context}`);
  }

  /**
   * Track navigation performance
   */
  trackNavigation(fromScreen: string, toScreen: string): void {
    if (!this.isDevelopment) return;
    
    const key = `nav-${fromScreen}-to-${toScreen}`;
    this.startMeasure(key, 'Navigation', `${fromScreen} → ${toScreen}`);
    
    // Auto-end after reasonable navigation time
    setTimeout(() => {
      this.endMeasure(key);
    }, 1000);
  }

  /**
   * Track API call performance
   */
  trackApiCall(endpoint: string, method: string): {
    success: (duration?: number) => void;
    error: (error: any) => void;
  } {
    const key = `api-${method}-${endpoint}-${Date.now()}`;
    this.startMeasure(key, 'API', `${method} ${endpoint}`);

    return {
      success: (duration?: number) => {
        const measuredDuration = this.endMeasure(key);
        if (duration || measuredDuration) {
          const actualDuration = duration || measuredDuration || 0;
          if (actualDuration > 2000) { // Log slow API calls
            console.warn(`🐌 Slow API: ${method} ${endpoint} took ${actualDuration}ms`);
          }
        }
      },
      error: (error: any) => {
        this.endMeasure(key);
        console.error(`❌ API Error: ${method} ${endpoint}`, error);
      },
    };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience hooks for React components
export const usePerformanceTracker = (componentName: string) => {
  const measureRender = React.useCallback(() => {
    return performanceMonitor.measureRender(componentName);
  }, [componentName]);

  const trackAction = React.useCallback((action: string, asyncFn: () => Promise<any>) => {
    const key = `${componentName}-${action}-${Date.now()}`;
    return performanceMonitor.measureAsync(key, componentName, action, asyncFn);
  }, [componentName]);

  return { measureRender, trackAction };
};

export default performanceMonitor;