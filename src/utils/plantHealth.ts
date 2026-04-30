/**
 * Plant Health Utilities
 *
 * Shared health status calculation used by PlantsScreen and PlantDetailScreen.
 */

import { COLORS } from '../constants';
import type { Plant } from '../types';

export type HealthStatus = 'healthy' | 'needs_attention' | 'critical';

/**
 * Calculate a plant's health status based on placement score and watering state.
 *
 * - Critical: placement score < 3
 * - Healthy: placement >= 3, has been watered, and not overdue
 * - Needs attention: everything else
 */
export function calculateHealthStatus(plant: Plant): HealthStatus {
  const placementScore = plant.placement_score || 0;
  const hasBeenWatered = !!plant.last_watered_at;
  const isWateringOverdue = plant.next_watering_at
    ? new Date(plant.next_watering_at) < new Date()
    : false;

  if (placementScore < 3) {
    return 'critical';
  }

  if (placementScore >= 3 && hasBeenWatered && !isWateringOverdue) {
    return 'healthy';
  }

  return 'needs_attention';
}

/**
 * Map a health status string to the corresponding color from the design system.
 */
export function getHealthColor(status: string): string {
  switch (status) {
    case 'healthy': return COLORS.success;
    case 'needs_attention': return COLORS.warning;
    case 'critical': return COLORS.error;
    default: return COLORS.textSecondary;
  }
}
