import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

interface SupabaseConfig {
  enableCaching: boolean;
  connectionPooling: boolean;
  autoRetry: boolean;
  maxRetries: number;
  timeoutMs: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  key: string;
}

class EnhancedSupabaseClient {
  private client: SupabaseClient;
  private cache = new Map<string, CacheEntry>();
  private config: SupabaseConfig;
  private connectionPool: AbortController[] = [];
  
  // Cache durations for different data types (in milliseconds)
  private readonly CACHE_DURATIONS = {
    profiles: 5 * 60 * 1000,      // 5 minutes
    plants: 2 * 60 * 1000,       // 2 minutes
    care_logs: 30 * 1000,        // 30 seconds
    static: 24 * 60 * 60 * 1000, // 24 hours
  };

  constructor(config: Partial<SupabaseConfig> = {}) {
    this.config = {
      enableCaching: true,
      connectionPooling: true,
      autoRetry: true,
      maxRetries: 3,
      timeoutMs: 5000,
      ...config
    };

    // Enhanced client configuration
    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'x-lotus-client': 'mobile-v1.0',
          'x-lotus-cache': this.config.enableCaching ? 'enabled' : 'disabled',
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10, // Throttle real-time events
        },
      },
    });

    this.setupPerformanceMonitoring();
    this.startConnectionOptimizations();
  }

  /**
   * Enhanced query with caching and performance monitoring
   */
  async query<T>(
    table: string,
    operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert',
    options: any = {},
    cacheKey?: string
  ): Promise<{ data: T[] | null; error: any; fromCache?: boolean; responseTime?: number }> {
    const startTime = Date.now();
    
    try {
      // Check cache for read operations
      if (operation === 'select' && this.config.enableCaching && cacheKey) {
        const cachedResult = this.getFromCache(cacheKey, table as keyof typeof this.CACHE_DURATIONS);
        if (cachedResult) {
          console.log(`🚀 Supabase cache hit for ${table}: ${Date.now() - startTime}ms`);
          return { ...cachedResult, fromCache: true, responseTime: Date.now() - startTime };
        }
      }

      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected && operation === 'select' && this.config.enableCaching) {
        const offlineData = await this.getOfflineData(table);
        if (offlineData) {
          return { data: offlineData, error: null, fromCache: true, responseTime: Date.now() - startTime };
        }
      }

      // Execute query with retry logic
      const result = await this.executeWithRetry(async () => {
        const query = this.buildQuery(table, operation, options);
        return await this.executeQuery(query);
      });

      // Cache successful read results
      if (operation === 'select' && result.data && !result.error && cacheKey) {
        this.setCache(cacheKey, result, table as keyof typeof this.CACHE_DURATIONS);
      }

      const responseTime = Date.now() - startTime;
      console.log(`⚡ Supabase ${operation} on ${table}: ${responseTime}ms`);
      
      return { ...result, responseTime, fromCache: false };

    } catch (error) {
      console.error(`❌ Supabase ${operation} on ${table} failed:`, error);
      
      // Return cached data as fallback for read operations
      if (operation === 'select' && this.config.enableCaching && cacheKey) {
        const staleData = this.getFromCache(cacheKey, table as keyof typeof this.CACHE_DURATIONS, true);
        if (staleData) {
          console.log('📦 Returning stale cached data as fallback');
          return { ...staleData, fromCache: true, error: null };
        }
      }

      return { data: null, error, responseTime: Date.now() - startTime };
    }
  }

  /**
   * Optimized authentication with caching
   */
  async signIn(email: string, password: string) {
    const startTime = Date.now();
    
    try {
      const result = await this.executeWithRetry(async () => {
        return await this.client.auth.signInWithPassword({ email, password });
      });

      if (result.data?.user && !result.error) {
        // Cache user profile
        await this.cacheUserProfile(result.data.user);
      }

      console.log(`🔐 Supabase auth response time: ${Date.now() - startTime}ms`);
      return result;

    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Batch operations for better performance
   */
  async batchQuery<T>(operations: Array<{
    table: string;
    operation: 'select' | 'insert' | 'update' | 'delete';
    options: any;
    cacheKey?: string;
  }>): Promise<Array<{ data: T[] | null; error: any; fromCache?: boolean }>> {
    const startTime = Date.now();
    
    try {
      // Execute all operations in parallel
      const promises = operations.map(op => 
        this.query<T>(op.table, op.operation, op.options, op.cacheKey)
      );
      
      const results = await Promise.all(promises);
      console.log(`📊 Supabase batch (${operations.length} ops): ${Date.now() - startTime}ms`);
      
      return results;
    } catch (error) {
      console.error('Batch operation failed:', error);
      throw error;
    }
  }

  /**
   * Real-time subscriptions with optimization
   */
  subscribeToTable(
    table: string,
    callback: (payload: any) => void,
    filter?: string
  ) {
    const channel = this.client
      .channel(`${table}-changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table,
          filter 
        }, 
        (payload) => {
          // Invalidate cache when data changes
          this.invalidateTableCache(table);
          callback(payload);
        }
      )
      .subscribe();

    console.log(`📡 Subscribed to ${table} changes`);
    return channel;
  }

  /**
   * Connection pooling management
   */
  private startConnectionOptimizations() {
    if (!this.config.connectionPooling) return;

    // Clean up old connections periodically
    setInterval(() => {
      this.connectionPool = this.connectionPool.filter(controller => !controller.signal.aborted);
      console.log(`🔧 Active connections: ${this.connectionPool.length}`);
    }, 60000); // Every minute
  }

  /**
   * Performance monitoring setup
   */
  private setupPerformanceMonitoring() {
    // Monitor slow queries
    const originalFrom = this.client.from;
    this.client.from = (table: string) => {
      const query = originalFrom.call(this.client, table);
      const startTime = Date.now();
      
      // Wrap query execution
      const originalExecute = query.select;
      query.select = function(...args: any[]) {
        const result = originalExecute.apply(this, args);
        
        result.then(() => {
          const duration = Date.now() - startTime;
          if (duration > 1000) { // Log slow queries
            console.warn(`🐌 Slow Supabase query on ${table}: ${duration}ms`);
          }
        });
        
        return result;
      };
      
      return query;
    };
  }

  /**
   * Execute with retry logic and exponential backoff
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await Promise.race([
          operation(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), this.config.timeoutMs)
          )
        ]);
      } catch (error) {
        lastError = error;
        
        if (attempt < this.config.maxRetries) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Supabase retry ${attempt} in ${backoffTime}ms`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Smart caching with TTL
   */
  private setCache(key: string, data: any, table: keyof typeof this.CACHE_DURATIONS) {
    const ttl = this.CACHE_DURATIONS[table] || this.CACHE_DURATIONS.static;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key
    });

    // Set expiration
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  private getFromCache(key: string, table: keyof typeof this.CACHE_DURATIONS, allowStale = false): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const ttl = this.CACHE_DURATIONS[table] || this.CACHE_DURATIONS.static;
    const isExpired = Date.now() - entry.timestamp > ttl;

    if (isExpired && !allowStale) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private invalidateTableCache(table: string) {
    // Remove all cache entries for the table
    for (const [key, entry] of this.cache.entries()) {
      if (key.includes(table)) {
        this.cache.delete(key);
      }
    }
    console.log(`🗑️ Invalidated cache for table: ${table}`);
  }

  /**
   * Build query based on operation type
   */
  private buildQuery(table: string, operation: string, options: any) {
    let query = this.client.from(table);
    
    switch (operation) {
      case 'select':
        query = query.select(options.select || '*');
        if (options.eq) query = query.eq(options.eq.column, options.eq.value);
        if (options.order) query = query.order(options.order.column, options.order.options);
        if (options.limit) query = query.limit(options.limit);
        break;
      
      case 'insert':
        query = query.insert(options.data);
        break;
        
      case 'update':
        query = query.update(options.data);
        if (options.eq) query = query.eq(options.eq.column, options.eq.value);
        break;
        
      case 'delete':
        if (options.eq) query = query.delete().eq(options.eq.column, options.eq.value);
        break;
    }
    
    return query;
  }

  private async executeQuery(query: any) {
    const controller = new AbortController();
    
    if (this.config.connectionPooling) {
      this.connectionPool.push(controller);
    }

    try {
      // Note: Supabase doesn't support AbortController directly, 
      // but we track connections for monitoring
      return await query;
    } finally {
      if (this.config.connectionPooling) {
        controller.abort();
      }
    }
  }

  /**
   * Cache user profile for offline access
   */
  private async cacheUserProfile(user: any) {
    try {
      await AsyncStorage.setItem('cached_user_profile', JSON.stringify({
        user,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache user profile:', error);
    }
  }

  /**
   * Get offline data from AsyncStorage
   */
  private async getOfflineData(table: string): Promise<any[] | null> {
    try {
      const cached = await AsyncStorage.getItem(`offline_${table}`);
      if (cached) {
        const data = JSON.parse(cached);
        console.log(`📦 Retrieved offline data for ${table}`);
        return data;
      }
    } catch (error) {
      console.warn('Failed to get offline data:', error);
    }
    return null;
  }

  /**
   * Get the underlying Supabase client for direct access
   */
  get raw() {
    return this.client;
  }
}

// Create enhanced client instance
export const supabase = new EnhancedSupabaseClient({
  enableCaching: true,
  connectionPooling: true,
  autoRetry: true,
  maxRetries: 3,
  timeoutMs: 8000,
});

// Export the raw client for backwards compatibility
export const supabaseRaw = supabase.raw;