import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { EnhancedPlantNetService } from './enhancedPlantNetService';
import { supabase } from '../utils/enhancedSupabase';

interface PerformanceMetrics {
  plantNetAvgTime: number;
  supabaseAvgTime: number;
  cacheHitRate: number;
  networkQuality: 'excellent' | 'good' | 'poor' | 'offline';
  recommendedSettings: {
    imageQuality: number;
    cacheEnabled: boolean;
    retryCount: number;
    timeoutMs: number;
  };
}

export class PerformanceOptimizer {
  private static metrics: PerformanceMetrics = {
    plantNetAvgTime: 800,
    supabaseAvgTime: 320,
    cacheHitRate: 0,
    networkQuality: 'good',
    recommendedSettings: {
      imageQuality: 0.7,
      cacheEnabled: true,
      retryCount: 3,
      timeoutMs: 8000,
    }
  };

  /**
   * Initialize performance optimizations on app start
   */
  static async initializeOptimizations() {
    console.log('🚀 Initializing performance optimizations...');
    
    try {
      // 1. Load cached metrics
      await this.loadPerformanceMetrics();
      
      // 2. Assess network quality
      await this.assessNetworkQuality();
      
      // 3. Optimize settings based on device/network
      await this.optimizeSettingsForEnvironment();
      
      // 4. Preload critical data
      await this.preloadCriticalData();
      
      // 5. Setup performance monitoring
      this.startPerformanceMonitoring();
      
      console.log('✅ Performance optimizations initialized');
      console.log('📊 Current metrics:', this.metrics);
      
    } catch (error) {
      console.error('❌ Failed to initialize performance optimizations:', error);
    }
  }

  /**
   * Assess network quality and adjust settings
   */
  private static async assessNetworkQuality() {
    try {
      const netInfo = await NetInfo.fetch();
      
      if (!netInfo.isConnected) {
        this.metrics.networkQuality = 'offline';
        return;
      }

      // Test actual speed with a small API call
      const startTime = Date.now();
      try {
        const response = await fetch('https://httpbin.org/bytes/1024', { 
          method: 'GET',
          timeout: 3000 
        });
        const responseTime = Date.now() - startTime;
        
        if (responseTime < 200) {
          this.metrics.networkQuality = 'excellent';
        } else if (responseTime < 500) {
          this.metrics.networkQuality = 'good';
        } else {
          this.metrics.networkQuality = 'poor';
        }
        
      } catch {
        this.metrics.networkQuality = 'poor';
      }

      console.log(`📶 Network quality assessed: ${this.metrics.networkQuality}`);
      
    } catch (error) {
      console.warn('Network assessment failed:', error);
      this.metrics.networkQuality = 'good'; // Default fallback
    }
  }

  /**
   * Optimize settings based on environment
   */
  private static async optimizeSettingsForEnvironment() {
    const { networkQuality } = this.metrics;
    
    switch (networkQuality) {
      case 'excellent':
        this.metrics.recommendedSettings = {
          imageQuality: 0.8,
          cacheEnabled: true,
          retryCount: 2,
          timeoutMs: 5000,
        };
        break;
        
      case 'good':
        this.metrics.recommendedSettings = {
          imageQuality: 0.7,
          cacheEnabled: true,
          retryCount: 3,
          timeoutMs: 8000,
        };
        break;
        
      case 'poor':
        this.metrics.recommendedSettings = {
          imageQuality: 0.5,
          cacheEnabled: true,
          retryCount: 4,
          timeoutMs: 12000,
        };
        break;
        
      case 'offline':
        this.metrics.recommendedSettings = {
          imageQuality: 0.7,
          cacheEnabled: true,
          retryCount: 0,
          timeoutMs: 1000,
        };
        break;
    }
    
    console.log('⚙️ Settings optimized for', networkQuality, 'network');
  }

  /**
   * Preload critical data for better UX
   */
  private static async preloadCriticalData() {
    try {
      console.log('📦 Preloading critical data...');
      
      // Preload user profile if authenticated
      const { data: { user } } = await supabase.raw.auth.getUser();
      if (user) {
        // Cache user's recent plants
        await supabase.query('plants', 'select', {
          select: 'id,nickname,scientific_name,image_url,last_watered_at',
          eq: { column: 'user_id', value: user.id },
          order: { column: 'created_at', options: { ascending: false } },
          limit: 10
        }, 'recent_plants');
      }
      
      // Preload common plant data
      await EnhancedPlantNetService.preloadCommonPlants();
      
      console.log('✅ Critical data preloaded');
      
    } catch (error) {
      console.warn('Preloading failed (non-critical):', error);
    }
  }

  /**
   * Start performance monitoring
   */
  private static startPerformanceMonitoring() {
    // Monitor API response times every 5 minutes
    setInterval(async () => {
      await this.collectPerformanceMetrics();
      await this.adjustSettingsBasedOnMetrics();
    }, 5 * 60 * 1000);
    
    console.log('📊 Performance monitoring started');
  }

  /**
   * Collect and analyze performance metrics
   */
  private static async collectPerformanceMetrics() {
    try {
      // Get cached metrics
      const cachedMetrics = await AsyncStorage.getItem('performance_metrics');
      if (cachedMetrics) {
        const stored = JSON.parse(cachedMetrics);
        
        // Calculate cache hit rate
        const totalRequests = stored.totalPlantNetRequests || 0;
        const cacheHits = stored.plantNetCacheHits || 0;
        this.metrics.cacheHitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;
        
        // Update average response times
        if (stored.plantNetTimes && stored.plantNetTimes.length > 0) {
          this.metrics.plantNetAvgTime = stored.plantNetTimes.reduce((a: number, b: number) => a + b) / stored.plantNetTimes.length;
        }
        
        if (stored.supabaseTimes && stored.supabaseTimes.length > 0) {
          this.metrics.supabaseAvgTime = stored.supabaseTimes.reduce((a: number, b: number) => a + b) / stored.supabaseTimes.length;
        }
      }
      
    } catch (error) {
      console.warn('Failed to collect performance metrics:', error);
    }
  }

  /**
   * Dynamically adjust settings based on performance
   */
  private static async adjustSettingsBasedOnMetrics() {
    const { plantNetAvgTime, supabaseAvgTime, cacheHitRate } = this.metrics;
    
    // If PlantNet is consistently slow, reduce image quality
    if (plantNetAvgTime > 2000) {
      this.metrics.recommendedSettings.imageQuality = Math.max(0.4, this.metrics.recommendedSettings.imageQuality - 0.1);
      this.metrics.recommendedSettings.timeoutMs = Math.min(15000, this.metrics.recommendedSettings.timeoutMs + 2000);
      console.log('📉 Reduced image quality due to slow PlantNet responses');
    }
    
    // If cache hit rate is low, extend cache duration
    if (cacheHitRate < 0.3) {
      console.log('📈 Low cache hit rate detected, consider extending cache duration');
    }
    
    // If Supabase is slow, increase retry count
    if (supabaseAvgTime > 1000) {
      this.metrics.recommendedSettings.retryCount = Math.min(5, this.metrics.recommendedSettings.retryCount + 1);
      console.log('🔄 Increased retry count due to slow Supabase responses');
    }
    
    // Save updated metrics
    await this.savePerformanceMetrics();
  }

  /**
   * Get current performance recommendations
   */
  static getRecommendations(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Force a performance assessment
   */
  static async performanceAudit(): Promise<{
    score: number;
    recommendations: string[];
    metrics: PerformanceMetrics;
  }> {
    await this.collectPerformanceMetrics();
    await this.assessNetworkQuality();
    
    const score = this.calculatePerformanceScore();
    const recommendations = this.generateRecommendations();
    
    return {
      score,
      recommendations,
      metrics: this.metrics
    };
  }

  /**
   * Calculate overall performance score (0-100)
   */
  private static calculatePerformanceScore(): number {
    let score = 100;
    
    // Penalize slow API responses
    if (this.metrics.plantNetAvgTime > 1500) score -= 20;
    if (this.metrics.supabaseAvgTime > 800) score -= 15;
    
    // Reward good cache hit rate
    score += this.metrics.cacheHitRate * 20;
    
    // Network quality factor
    const networkPenalty = {
      'excellent': 0,
      'good': -5,
      'poor': -20,
      'offline': -30
    };
    score += networkPenalty[this.metrics.networkQuality];
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate performance improvement recommendations
   */
  private static generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.plantNetAvgTime > 1500) {
      recommendations.push('Consider reducing image quality for faster PlantNet responses');
    }
    
    if (this.metrics.supabaseAvgTime > 800) {
      recommendations.push('Enable aggressive caching for Supabase queries');
    }
    
    if (this.metrics.cacheHitRate < 0.4) {
      recommendations.push('Extend cache duration to improve hit rate');
    }
    
    if (this.metrics.networkQuality === 'poor') {
      recommendations.push('Optimize for slow network conditions with smaller payloads');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal! 🚀');
    }
    
    return recommendations;
  }

  /**
   * Save performance metrics to storage
   */
  private static async savePerformanceMetrics() {
    try {
      await AsyncStorage.setItem('lotus_performance_metrics', JSON.stringify({
        ...this.metrics,
        lastUpdated: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save performance metrics:', error);
    }
  }

  /**
   * Load performance metrics from storage
   */
  private static async loadPerformanceMetrics() {
    try {
      const stored = await AsyncStorage.getItem('lotus_performance_metrics');
      if (stored) {
        const data = JSON.parse(stored);
        this.metrics = { ...this.metrics, ...data };
        console.log('📊 Loaded cached performance metrics');
      }
    } catch (error) {
      console.warn('Failed to load performance metrics:', error);
    }
  }
}

// Auto-initialize on import
PerformanceOptimizer.initializeOptimizations();