import React from 'react';

/**
 * Performance monitoring utilities for tracking app performance
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface MemorySnapshot {
  timestamp: number;
  jsHeapSizeLimit?: number;
  totalJSHeapSize?: number;
  usedJSHeapSize?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private memorySnapshots: MemorySnapshot[] = [];
  private readonly maxSnapshots = 100;

  /**
   * Start timing a performance metric
   */
  startTiming(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };
    
    this.metrics.set(name, metric);
    console.log(`⏱️ Started timing: ${name}`);
  }

  /**
   * End timing a performance metric
   */
  endTiming(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`⚠️ No timing found for: ${name}`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    console.log(`✅ Completed timing: ${name} - ${metric.duration.toFixed(2)}ms`);
    
    return metric.duration;
  }

  /**
   * Time a function execution
   */
  async timeFunction<T>(
    name: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startTiming(name, metadata);
    
    try {
      const result = await fn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  /**
   * Get metrics by name pattern
   */
  getMetricsByPattern(pattern: string): PerformanceMetric[] {
    const regex = new RegExp(pattern);
    return this.getMetrics().filter(m => regex.test(m.name));
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    console.log('🧹 Cleared performance metrics');
  }

  /**
   * Take a memory snapshot
   */
  takeMemorySnapshot(): void {
    const snapshot: MemorySnapshot = {
      timestamp: Date.now()
    };

    // Add performance.memory if available (Chrome/V8)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      snapshot.jsHeapSizeLimit = memory.jsHeapSizeLimit;
      snapshot.totalJSHeapSize = memory.totalJSHeapSize;
      snapshot.usedJSHeapSize = memory.usedJSHeapSize;
    }

    this.memorySnapshots.push(snapshot);

    // Keep only the latest snapshots
    if (this.memorySnapshots.length > this.maxSnapshots) {
      this.memorySnapshots = this.memorySnapshots.slice(-this.maxSnapshots);
    }

    console.log('📊 Memory snapshot taken:', snapshot);
  }

  /**
   * Get memory snapshots
   */
  getMemorySnapshots(): MemorySnapshot[] {
    return this.memorySnapshots;
  }

  /**
   * Get memory trend (increase/decrease over time)
   */
  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' | 'unknown' {
    if (this.memorySnapshots.length < 5) return 'unknown';

    const recent = this.memorySnapshots.slice(-5);
    const usedMemory = recent.map(s => s.usedJSHeapSize).filter(Boolean);
    
    if (usedMemory.length < 2) return 'unknown';

    const first = usedMemory[0]!;
    const last = usedMemory[usedMemory.length - 1]!;
    const change = (last - first) / first;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    averages: Record<string, number>;
    slowest: PerformanceMetric[];
    memoryTrend: string;
    totalMetrics: number;
  } {
    const metrics = this.getMetrics();
    const averages: Record<string, number> = {};
    const metricGroups: Record<string, number[]> = {};

    // Group metrics by name
    metrics.forEach(metric => {
      if (!metricGroups[metric.name]) {
        metricGroups[metric.name] = [];
      }
      metricGroups[metric.name].push(metric.duration!);
    });

    // Calculate averages
    Object.entries(metricGroups).forEach(([name, durations]) => {
      averages[name] = durations.reduce((a, b) => a + b, 0) / durations.length;
    });

    // Find slowest operations
    const slowest = metrics
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    return {
      averages,
      slowest,
      memoryTrend: this.getMemoryTrend(),
      totalMetrics: metrics.length
    };
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const report = this.generateReport();
    
    console.group('📊 Performance Summary');
    console.log('Total metrics:', report.totalMetrics);
    console.log('Memory trend:', report.memoryTrend);
    
    console.group('⏱️ Average Durations');
    Object.entries(report.averages).forEach(([name, avg]) => {
      console.log(`${name}: ${avg.toFixed(2)}ms`);
    });
    console.groupEnd();
    
    if (report.slowest.length > 0) {
      console.group('🐌 Slowest Operations');
      report.slowest.slice(0, 5).forEach(metric => {
        console.log(`${metric.name}: ${metric.duration!.toFixed(2)}ms`);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor() {
  const startTiming = (name: string, metadata?: Record<string, any>) => {
    performanceMonitor.startTiming(name, metadata);
  };

  const endTiming = (name: string) => {
    return performanceMonitor.endTiming(name);
  };

  const timeFunction = async <T>(
    name: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>
  ) => {
    return performanceMonitor.timeFunction(name, fn, metadata);
  };

  return {
    startTiming,
    endTiming,
    timeFunction
  };
}

/**
 * Decorator for timing function execution
 */
export function timed(name?: string) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;
    const timerName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = (async function (this: any, ...args: any[]) {
      return performanceMonitor.timeFunction(
        timerName,
        () => originalMethod.apply(this, args)
      );
    }) as T;

    return descriptor;
  };
}

/**
 * Performance monitoring for React components
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || Component.displayName || Component.name;
  
  const PerformanceMonitoredComponent = React.forwardRef<any, P>((props, ref) => {
    React.useEffect(() => {
      performanceMonitor.startTiming(`${displayName}.mount`);
      
      return () => {
        performanceMonitor.endTiming(`${displayName}.mount`);
      };
    }, []);

    return React.createElement(Component, { ...props, ref } as any);
  });

  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  return PerformanceMonitoredComponent;
}