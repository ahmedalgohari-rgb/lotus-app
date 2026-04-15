/**
 * Notification Service
 *
 * Manages local push notifications for plant care reminders.
 * Uses "Check soil" interval (shorter than watering) for proactive nudges.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plant } from '../types';
import { extractCheckSoilDays, extractMaxWateringDays } from '../utils/careTextUtils';
import { logger } from '../utils/logger';

const STORAGE_KEYS = {
  ENABLED: 'notifications_enabled',
  PROMPT_SHOWN: 'notifications_prompt_shown',
  NOTIFICATION_IDS: 'notification_ids',
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permission from the user.
 * Stores the result in AsyncStorage.
 */
export async function requestPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    await AsyncStorage.setItem(STORAGE_KEYS.ENABLED, JSON.stringify(granted));
    logger.info('Notification permission', { status, granted });
    return granted;
  } catch (error) {
    logger.error('Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Check if notifications are enabled (user granted + app preference).
 */
export async function isEnabled(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENABLED);
    if (stored !== 'true') return false;

    // Also verify iOS permission is still granted
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Check if the notification prompt has already been shown.
 */
export async function hasPromptBeenShown(): Promise<boolean> {
  const shown = await AsyncStorage.getItem(STORAGE_KEYS.PROMPT_SHOWN);
  return shown === 'true';
}

/**
 * Mark the notification prompt as shown.
 */
export async function markPromptShown(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PROMPT_SHOWN, 'true');
}

/**
 * Get the stored notification ID map { plantId: notificationId }.
 */
async function getNotificationIds(): Promise<Record<string, string>> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_IDS);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save the notification ID map.
 */
async function saveNotificationIds(ids: Record<string, string>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_IDS, JSON.stringify(ids));
}

/**
 * Calculate the check-soil days for a plant.
 * Uses care text if available, otherwise derives from watering schedule.
 */
export function getCheckSoilDaysForPlant(
  checkSoilText?: string,
  wateringText?: string,
  wateringSchedule?: string
): number {
  // Try soil check text first, then watering text, then watering schedule
  return extractCheckSoilDays(
    checkSoilText || '',
    wateringText || wateringSchedule || ''
  );
}

/**
 * Schedule a local notification for a plant's soil check.
 * Returns the notification identifier.
 */
export async function scheduleForPlant(
  plant: Plant,
  checkSoilDays: number
): Promise<string | null> {
  try {
    const enabled = await isEnabled();
    if (!enabled) return null;

    // Cancel any existing notification for this plant
    await cancelForPlant(plant.id);

    // Calculate trigger time based on next_watering_at
    let triggerSeconds: number;
    if (plant.next_watering_at) {
      const wateringDate = new Date(plant.next_watering_at);
      const now = new Date();
      // Soil check should be checkSoilDays before the watering date
      // But since checkSoilDays IS the soil check interval from last action,
      // we schedule it checkSoilDays from now (or from last watering)
      const daysUntilWatering = Math.ceil(
        (wateringDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      // Schedule soil check 2 days before watering is due, or at least 1 day from now
      const daysUntilCheck = Math.max(1, daysUntilWatering - 2);
      triggerSeconds = daysUntilCheck * 24 * 60 * 60;
    } else {
      // No watering date set — schedule checkSoilDays from now
      triggerSeconds = checkSoilDays * 24 * 60 * 60;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to check your plant!',
        body: `Check the soil on ${plant.nickname} — it might need water soon.`,
        data: { plantId: plant.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: triggerSeconds,
      },
    });

    // Store the mapping
    const ids = await getNotificationIds();
    ids[plant.id] = notificationId;
    await saveNotificationIds(ids);

    logger.info('Scheduled notification', {
      plantId: plant.id,
      nickname: plant.nickname,
      checkSoilDays,
      triggerSeconds,
      notificationId,
    });

    return notificationId;
  } catch (error) {
    logger.error('Failed to schedule notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification for a specific plant.
 */
export async function cancelForPlant(plantId: string): Promise<void> {
  try {
    const ids = await getNotificationIds();
    const notificationId = ids[plantId];
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      delete ids[plantId];
      await saveNotificationIds(ids);
      logger.info('Cancelled notification', { plantId, notificationId });
    }
  } catch (error) {
    logger.error('Failed to cancel notification:', error);
  }
}

/**
 * Cancel all notifications and reschedule for all plants.
 * Called on app launch to ensure notifications are fresh.
 */
export async function rescheduleAll(plants: Plant[]): Promise<void> {
  try {
    const enabled = await isEnabled();
    if (!enabled) return;

    // Cancel all existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    await saveNotificationIds({});

    // Schedule for each plant that has a watering date
    for (const plant of plants) {
      if (plant.next_watering_at) {
        // Derive check soil days from watering schedule
        const wateringDays = extractMaxWateringDays(plant.watering_schedule || '');
        const checkDays = Math.max(1, wateringDays - 2);
        await scheduleForPlant(plant, checkDays);
      }
    }

    logger.info('Rescheduled all notifications', { plantCount: plants.length });
  } catch (error) {
    logger.error('Failed to reschedule all notifications:', error);
  }
}
