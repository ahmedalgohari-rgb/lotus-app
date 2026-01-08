/**
 * Plant Identification Service Interface
 *
 * This interface defines the contract for all plant identification providers.
 * By abstracting the provider behind this interface, we can swap providers
 * (PlantNet, Plant.id, Google Vision, etc.) without changing app code.
 *
 * BUSINESS JUSTIFICATION:
 * - PlantNet is non-commercial and may terminate service anytime
 * - Modular architecture allows instant provider switching (zero downtime)
 * - Enables A/B testing different providers for accuracy/cost optimization
 * - Future-proofs against vendor lock-in and API deprecation
 *
 * @see PlantNetAdapter for PlantNet implementation
 * @see PlantIdAdapter for Plant.id implementation
 */

// Re-export the legacy IdentificationResult from types
// This maintains backward compatibility with existing app code
// Future providers can use this same format or extend it
export type { IdentificationResult } from '../../types';

/**
 * Attribution/watermark configuration for legal compliance
 */
export interface ProviderAttribution {
  /** Logo image source (require('path/to/logo.png')) */
  logo: any;

  /** Whether attribution is legally required (PlantNet: yes, Google: no) */
  required: boolean;

  /** Where to position the watermark */
  position: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';

  /** Logo dimensions (width × height in pixels) */
  dimensions: {
    width: number;
    height: number;
  };

  /** Optional link URL when watermark is tapped */
  linkUrl?: string;
}

/**
 * Rate limiting configuration for API usage control
 */
export interface RateLimitConfig {
  /** Maximum requests allowed per time window */
  maxRequests: number;

  /** Time window in hours (e.g., 1 = per hour, 24 = per day) */
  windowHours: number;

  /** Grace period for soft limits (optional) */
  gracePeriodMinutes?: number;
}

/**
 * Main service interface - all plant ID providers must implement this
 */
export interface IPlantIdentificationService {
  /**
   * Identify a plant from an image
   *
   * @param imageUri - Local file URI (e.g., "file:///path/to/image.jpg")
   * @param language - Language for result names ('en' or 'ar')
   * @returns Normalized identification result with confidence score
   * @throws Error if API call fails or rate limit exceeded
   */
  identifyPlant(imageUri: string, language?: 'en' | 'ar'): Promise<IdentificationResult>;

  /**
   * Get attribution/watermark configuration for legal compliance
   * Used by UI to dynamically render correct provider logo
   *
   * @returns Attribution configuration (logo, position, etc.)
   */
  getAttribution(): ProviderAttribution;

  /**
   * Get rate limiting configuration
   * Used by rate limiter to enforce provider-specific limits
   *
   * @returns Rate limit configuration (max requests, window)
   */
  getRateLimits(): RateLimitConfig;

  /**
   * Get human-readable provider name
   * Used for logging, analytics, and debugging
   *
   * @returns Provider name (e.g., "PlantNet", "Plant.id", "Google Vision")
   */
  getProviderName(): string;

  /**
   * Check if provider is available/healthy (optional)
   * Can be used for failover logic or health checks
   *
   * @returns True if provider is reachable and operational
   */
  checkHealth?(): Promise<boolean>;
}
