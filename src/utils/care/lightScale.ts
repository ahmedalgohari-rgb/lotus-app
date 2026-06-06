/**
 * Unified Light Scale
 *
 * Single 4-tier vocabulary used everywhere the user sees a "light" reference:
 * - The Add-Plant comparison card
 * - The PlantDetail comparison card
 * - The location rating banner subtitle
 * - Direction hints
 *
 * The 4 tiers come from the plant database's existing `light.requirement` field:
 *
 *   1. Low Light       — north windows, dim corners
 *   2. Medium Light    — partly-shaded interiors
 *   3. Bright Indirect — near a window without direct sun (or filtered sun)
 *   4. Full Sun        — direct sun for several hours
 *
 * Note: scoring math still uses the 5-level intensity scale internally
 * (Very Low → Very High) for finer gradations. This module only governs
 * what the user *sees*. Two scales internally, one scale on screen.
 */

export type LightTier = 1 | 2 | 3 | 4;

export const LIGHT_TIER_KEYS = {
  1: 'lightScale.lowLight',
  2: 'lightScale.mediumLight',
  3: 'lightScale.brightIndirect',
  4: 'lightScale.fullSun',
} as const;

/**
 * Map a plant's `light.requirement` (database vocabulary, 6 categories)
 * to the unified 4-tier display scale.
 */
export function plantNeedToTier(requirement?: string): LightTier {
  switch (requirement) {
    case 'low_light':
      return 1;
    case 'low_to_medium':
    case 'medium_indirect':
    case 'medium_light':
      return 2;
    case 'bright_indirect':
      return 3;
    case 'bright_direct':
      return 4;
    default:
      return 2;
  }
}

/**
 * Map the room/direction `lightIntensity` (5-level scoring scale)
 * to the unified 4-tier display scale.
 *
 * Collapsing: Very Low and Low both display as "Low Light";
 * High and Very High both display as the right-most tier appropriate
 * for the direction. We bias by `directSunHours` so a "High" reading
 * with no direct sun (a really sunny north window in summer — rare but
 * possible) reads as "Bright Indirect", not "Full Sun".
 */
export function windowGivesToTier(
  intensity?: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High',
  directSunHours: number = 0
): LightTier {
  switch (intensity) {
    case 'Very Low':
    case 'Low':
      return 1;
    case 'Medium':
      return 2;
    case 'High':
      // High light without any direct sun = Bright Indirect.
      // High light with direct sun = also Bright Indirect (it's filtered/morning).
      return 3;
    case 'Very High':
      // Very High needs direct-sun hours to count as Full Sun;
      // otherwise it's still very bright but indirect.
      return directSunHours >= 3 ? 4 : 3;
    default:
      return 2;
  }
}

/**
 * Per-direction × season placement advice.
 * Returns an i18n key the caller can `t()`.
 *
 * Keep these short — they render under the comparison card.
 */
export function getPlacementAdviceKey(
  direction: 'north' | 'east' | 'south' | 'west',
  season: 'winter' | 'spring' | 'summer' | 'autumn',
  plantTier: LightTier,
  windowTier: LightTier
): string {
  const overLit = windowTier > plantTier;
  const underLit = windowTier < plantTier;

  // North windows: never have direct sun. Distance never helps for indirect plants;
  // only matters for sun-loving plants that can't get enough.
  if (direction === 'north') {
    if (underLit) return 'placement.north.underLit'; // place at the glass
    return 'placement.north.match';                  // match — keep near window
  }

  // South in summer: brief but harsh overhead sun.
  if (direction === 'south' && season === 'summer') {
    if (overLit) return 'placement.south.summerOverLit';   // 1-2m back
    if (underLit) return 'placement.south.summerUnderLit'; // place at glass
    return 'placement.south.summerMatch';
  }
  // South in winter: best window in Cairo — gentle, all day.
  if (direction === 'south' && season === 'winter') {
    return overLit ? 'placement.south.winterOverLit' : 'placement.south.winterMatch';
  }
  // South spring/autumn
  if (direction === 'south') {
    if (overLit) return 'placement.south.shoulderOverLit';
    return 'placement.south.shoulderMatch';
  }

  // West in summer: deep low-angle penetration. The killer.
  if (direction === 'west' && season === 'summer') {
    if (overLit) return 'placement.west.summerOverLit';   // 2m+ back, shade 2-6pm
    if (underLit) return 'placement.west.summerUnderLit';
    return 'placement.west.summerMatch';
  }
  if (direction === 'west') {
    if (overLit) return 'placement.west.shoulderOverLit';
    return 'placement.west.shoulderMatch';
  }

  // East: gentle morning sun — easiest direction.
  if (direction === 'east') {
    if (underLit) return 'placement.east.underLit';
    if (overLit) return 'placement.east.overLit';
    return 'placement.east.match';
  }

  return 'placement.generic.match';
}
