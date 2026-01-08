/**
 * Plant Identification Service
 *
 * Modular, provider-agnostic plant identification system.
 * Switch providers via environment variable (zero code changes).
 *
 * @module plant-identification
 */

// Export main interface
export type {
  IPlantIdentificationService,
  IdentificationResult,
  ProviderAttribution,
  RateLimitConfig,
} from './IPlantIdentificationService';

// Export factory
export {
  PlantIdServiceFactory,
  createPlantIdService,
  type PlantIdProvider,
  type FactoryConfig,
} from './PlantIdServiceFactory';

// Export adapters (for direct use if needed)
export { PlantNetAdapter } from './adapters/PlantNetAdapter';
