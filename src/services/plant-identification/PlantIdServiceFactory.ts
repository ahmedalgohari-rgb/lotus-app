/**
 * Plant Identification Service Factory
 *
 * This factory creates the appropriate plant ID provider based on configuration.
 * Allows instant provider switching via environment variable (zero code changes).
 *
 * USAGE:
 * ```typescript
 * // Create service instance (provider determined by env config)
 * const plantIdService = PlantIdServiceFactory.create();
 *
 * // Use standardized interface (works with any provider)
 * const result = await plantIdService.identifyPlant(imageUri);
 * const attribution = plantIdService.getAttribution();
 * ```
 *
 * PROVIDER SWITCHING:
 * Change EXPO_PUBLIC_PLANT_ID_PROVIDER in .env:
 * - 'plantnet' → PlantNet API (current, free, non-commercial)
 * - 'plantid' → Plant.id API (commercial-friendly, paid after 1000/mo)
 * - 'google' → Google Cloud Vision (general-purpose, paid after 1000/mo)
 *
 * BUSINESS VALUE:
 * - Zero downtime when PlantNet shuts down → Change 1 env var, redeploy
 * - A/B test providers → Route 50% to PlantNet, 50% to Plant.id
 * - Cost optimization → Compare pricing as you scale
 * - Future-proof → Add new providers without touching app code
 */

import { IPlantIdentificationService } from './IPlantIdentificationService';
import { PlantNetAdapter } from './adapters/PlantNetAdapter';
// import { PlantIdAdapter } from './adapters/PlantIdAdapter'; // Future: Phase 2
// import { GoogleVisionAdapter } from './adapters/GoogleVisionAdapter'; // Future: Alternative

/**
 * Available plant identification providers
 */
export type PlantIdProvider = 'plantnet' | 'plantid' | 'google';

/**
 * Factory configuration options
 */
export interface FactoryConfig {
  /** Override environment variable (useful for testing) */
  provider?: PlantIdProvider;

  /** Enable fallback to backup provider on failure */
  enableFallback?: boolean;

  /** Backup provider to use if primary fails */
  fallbackProvider?: PlantIdProvider;
}

/**
 * Plant Identification Service Factory
 * Creates provider instances based on configuration
 */
export class PlantIdServiceFactory {
  private static instance: IPlantIdentificationService | null = null;
  private static currentProvider: PlantIdProvider | null = null;

  /**
   * Create or retrieve plant identification service instance
   * Uses singleton pattern to avoid recreating service on every call
   *
   * @param config - Optional configuration (defaults to env vars)
   * @returns Plant identification service implementing IPlantIdentificationService
   */
  static create(config?: FactoryConfig): IPlantIdentificationService {
    // Determine which provider to use
    const provider = this.resolveProvider(config?.provider);

    // Return cached instance if provider hasn't changed
    if (this.instance && this.currentProvider === provider) {
      return this.instance;
    }

    // Create new instance for the selected provider
    this.instance = this.createProvider(provider);
    this.currentProvider = provider;

    console.log(`[PlantIdServiceFactory] ✅ Created provider: ${provider}`);
    return this.instance;
  }

  /**
   * Create a fresh instance (bypasses singleton cache)
   * Useful for testing or when you need multiple provider instances
   *
   * @param provider - Provider type to create
   * @returns New service instance
   */
  static createFresh(provider?: PlantIdProvider): IPlantIdentificationService {
    const resolvedProvider = this.resolveProvider(provider);
    return this.createProvider(resolvedProvider);
  }

  /**
   * Resolve which provider to use based on config and environment
   *
   * @param override - Optional override provider
   * @returns Resolved provider name
   */
  private static resolveProvider(override?: PlantIdProvider): PlantIdProvider {
    // 1. Use override if provided (for testing)
    if (override) {
      return override;
    }

    // 2. Read from environment variable
    const envProvider = process.env.EXPO_PUBLIC_PLANT_ID_PROVIDER as PlantIdProvider | undefined;
    if (envProvider && this.isValidProvider(envProvider)) {
      return envProvider;
    }

    // 3. Default to PlantNet (current production provider)
    console.warn(
      '[PlantIdServiceFactory] ⚠️  No provider configured, defaulting to PlantNet. ' +
      'Set EXPO_PUBLIC_PLANT_ID_PROVIDER in .env to configure.'
    );
    return 'plantnet';
  }

  /**
   * Create provider instance based on provider type
   *
   * @param provider - Provider type
   * @returns Service instance
   */
  private static createProvider(provider: PlantIdProvider): IPlantIdentificationService {
    switch (provider) {
      case 'plantnet':
        return new PlantNetAdapter();

      case 'plantid':
        // TODO: Phase 2 - Implement Plant.id adapter
        throw new Error(
          'Plant.id provider not yet implemented. ' +
          'Set EXPO_PUBLIC_PLANT_ID_PROVIDER=plantnet or implement PlantIdAdapter.'
        );

      case 'google':
        // TODO: Alternative - Implement Google Vision adapter
        throw new Error(
          'Google Vision provider not yet implemented. ' +
          'Set EXPO_PUBLIC_PLANT_ID_PROVIDER=plantnet or implement GoogleVisionAdapter.'
        );

      default:
        throw new Error(
          `Unknown provider: ${provider}. ` +
          `Valid options: plantnet, plantid, google`
        );
    }
  }

  /**
   * Check if provider string is valid
   *
   * @param provider - Provider string to validate
   * @returns True if valid provider
   */
  private static isValidProvider(provider: string): provider is PlantIdProvider {
    return ['plantnet', 'plantid', 'google'].includes(provider);
  }

  /**
   * Reset factory (clear singleton cache)
   * Useful for testing or when switching providers at runtime
   */
  static reset(): void {
    this.instance = null;
    this.currentProvider = null;
    console.log('[PlantIdServiceFactory] 🔄 Factory reset');
  }

  /**
   * Get current active provider name
   *
   * @returns Current provider or null if not initialized
   */
  static getCurrentProvider(): PlantIdProvider | null {
    return this.currentProvider;
  }
}

/**
 * Convenience function to create service instance
 * Use this in your app code for cleaner imports
 *
 * @example
 * import { createPlantIdService } from '@/services/plant-identification';
 * const service = createPlantIdService();
 * const result = await service.identifyPlant(imageUri);
 */
export function createPlantIdService(config?: FactoryConfig): IPlantIdentificationService {
  return PlantIdServiceFactory.create(config);
}
