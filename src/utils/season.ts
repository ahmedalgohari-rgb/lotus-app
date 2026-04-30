/**
 * Season Utilities
 *
 * Official astronomical season dates for Egypt / Northern Hemisphere.
 * Single source of truth used by store, HomeScreen, weather service, and careMap.
 */

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

/**
 * Capitalized season variant used for display and care matrix keys.
 */
export type DisplaySeason = 'Winter' | 'Spring' | 'Summer' | 'Autumn';

/**
 * Determine the current astronomical season.
 *
 * Winter : Dec 21 - Mar 20
 * Spring : Mar 21 - Jun 20
 * Summer : Jun 21 - Sep 22
 * Autumn : Sep 23 - Dec 20
 */
export function getCurrentSeason(): Season {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const day = now.getDate();

  if ((month === 11 && day >= 21) || month === 0 || month === 1 || (month === 2 && day <= 20)) {
    return 'winter';
  }
  if ((month === 2 && day >= 21) || month === 3 || month === 4 || (month === 5 && day <= 20)) {
    return 'spring';
  }
  if ((month === 5 && day >= 21) || month === 6 || month === 7 || (month === 8 && day <= 22)) {
    return 'summer';
  }
  return 'autumn';
}

/**
 * Return the display-formatted season name (capitalized).
 */
export function getDisplaySeason(): DisplaySeason {
  const season = getCurrentSeason();
  return (season.charAt(0).toUpperCase() + season.slice(1)) as DisplaySeason;
}
