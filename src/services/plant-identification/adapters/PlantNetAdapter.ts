/**
 * PlantNet Provider Adapter
 *
 * Wraps the existing PlantNet service to conform to IPlantIdentificationService.
 * This adapter allows PlantNet to be swapped with other providers without changing app code.
 *
 * BUSINESS CONTEXT:
 * - PlantNet is a non-commercial research project (no SLA, no guarantees)
 * - Free API with 10 requests/hour rate limit per user
 * - Requires legal attribution (watermark) per Terms of Service
 * - High risk of service termination for commercial apps
 *
 * @see https://my.plantnet.org Terms of Service
 */

import { plantNetService } from '../../plantnet';
import type { IdentificationResult } from '../../../types';
import type {
  IPlantIdentificationService,
  ProviderAttribution,
  RateLimitConfig,
} from '../IPlantIdentificationService';

export class PlantNetAdapter implements IPlantIdentificationService {
  /**
   * Identify a plant using PlantNet API
   *
   * @param imageUri - Local file URI (e.g., "file:///path/to/image.jpg")
   * @returns Normalized identification result
   * @throws Error if PlantNet API fails or rate limit exceeded
   */
  async identifyPlant(imageUri: string, language: 'en' | 'ar' = 'en'): Promise<IdentificationResult> {
    // Call existing PlantNet service (keeps all existing logic intact)
    const result = await plantNetService.identifyPlant(imageUri, 'leaf', language);

    // Handle null response (no plant detected or API error)
    if (!result) {
      throw new Error('PlantNet could not identify this image. Please try another photo.');
    }

    // Return result as-is (already matches legacy IdentificationResult format)
    // The plantNetService returns complete care data from our database
    return result;
  }

  /**
   * Get PlantNet attribution configuration
   * PlantNet REQUIRES visible attribution per Terms of Service
   *
   * @returns Attribution config with PlantNet logo and positioning
   */
  getAttribution(): ProviderAttribution {
    return {
      logo: require('../../../assets/logos/powered-by-plantnet.png'),
      required: true, // PlantNet Terms require attribution
      position: 'bottom-right',
      dimensions: {
        width: 90, // ~10% of screen width (375px)
        height: 18, // Maintains 5:1 aspect ratio
      },
      linkUrl: 'https://plantnet.org', // Optional: Link to PlantNet when tapped
    };
  }

  /**
   * Get PlantNet rate limiting configuration
   * PlantNet enforces 10 requests/hour per user via Edge Function
   *
   * @returns Rate limit config (10 req/hour)
   */
  getRateLimits(): RateLimitConfig {
    return {
      maxRequests: 10, // PlantNet's free tier limit
      windowHours: 1, // Per hour
      gracePeriodMinutes: 5, // Allow 5min grace before hard block
    };
  }

  /**
   * Get provider name for logging and analytics
   *
   * @returns "PlantNet"
   */
  getProviderName(): string {
    return 'PlantNet';
  }

  /**
   * Check if PlantNet API is reachable (optional health check)
   * Can be used for failover logic to backup providers
   *
   * @returns True if PlantNet is operational
   */
  async checkHealth(): Promise<boolean> {
    try {
      // Simple health check: PlantNet Edge Function should respond
      const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const response = await fetch(`${SUPABASE_URL}/functions/v1/identify-plant`, {
        method: 'HEAD', // HEAD request doesn't count against rate limit
      });
      return response.ok || response.status === 405; // 405 = Method Not Allowed (function exists)
    } catch (error) {
      return false; // Network error or function unreachable
    }
  }
}
