import { Mixpanel } from 'mixpanel-react-native';

const MIXPANEL_TOKEN = '9193eaec1fc2103e33791fae13c3e1f8';

const mixpanel = new Mixpanel(MIXPANEL_TOKEN, true); // true = trackAutomaticEvents

// Initialize once on app startup
mixpanel.init();

// Route events to EU data residency (project 4017234 lives on eu.mixpanel.com).
// Default server is US — without this, events are dropped on the wrong region.
mixpanel.setServerURL('https://api-eu.mixpanel.com');

/**
 * Identify a user after auth — links all future events to this user ID.
 * Call this after sign-in/sign-up.
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  mixpanel.identify(userId);
  if (properties) {
    mixpanel.getPeople().set(properties);
  }
}

/**
 * Reset identity on sign-out — future events are anonymous.
 */
export function resetUser() {
  mixpanel.reset();
}

/**
 * Set a user property that persists across sessions (e.g., language, plant count).
 */
export function setUserProperty(key: string, value: any) {
  mixpanel.getPeople().set(key, value);
}

/**
 * Increment a numeric user property (e.g., total_plants_added).
 */
export function incrementUserProperty(key: string, amount: number = 1) {
  mixpanel.getPeople().increment(key, amount);
}

// ─── Core Events ─────────────────────────────────────────────

export function trackAppOpened() {
  mixpanel.track('App Opened');
}

export function trackScreenViewed(screenName: string) {
  mixpanel.track('Screen Viewed', { screen: screenName });
}

export function trackPlantScanned(properties: {
  result: 'identified' | 'not_found' | 'error';
  confidence?: number;
  scientificName?: string;
  commonName?: string;
}) {
  mixpanel.track('Plant Scanned', properties);
}

export function trackPlantResultViewed(properties: {
  commonName?: string;
  scientificName?: string;
  confidence?: number;
  matchType?: string;
  isCurated?: boolean;
}) {
  mixpanel.track('Plant Result Viewed', properties);
}

export function trackPlantAdded(properties: {
  commonName?: string;
  location?: string;
  windowDirection?: string;
  isCurated?: boolean;
  matchType?: string;
  source?: 'scan' | 'search' | 'manual';
  plantCount?: number;
  isFirstPlant?: boolean;
}) {
  mixpanel.track('Plant Added', properties);
  incrementUserProperty('total_plants_added');
}

export function trackGardenLocationSet(properties: {
  hasLocation: boolean;
  source?: 'prompt' | 'settings' | 'first_open';
}) {
  mixpanel.track('Garden Location Set', properties);
}

export function trackCareReminderEngagement(properties: {
  action: 'tapped' | 'dismissed' | 'snoozed';
  daysOverdue?: number;
}) {
  mixpanel.track('Care Reminder Engagement', properties);
}

export function trackPlantDeleted(properties: {
  commonName?: string;
  daysOwned?: number;
}) {
  mixpanel.track('Plant Deleted', properties);
}

export function trackCareAction(properties: {
  action: 'water' | 'fertilize' | 'prune' | 'repot';
  plantName?: string;
  daysOverdue?: number;
}) {
  mixpanel.track('Care Action', properties);
  incrementUserProperty(`total_${properties.action}_actions`);
}

export function trackAuthCompleted(properties: {
  method: 'google' | 'apple' | 'facebook';
  isNewUser?: boolean;
}) {
  mixpanel.track('Auth Completed', properties);
}

export function trackAuthModalShown(properties: {
  trigger: 'add_plant' | 'scan_result' | 'save_plant' | 'other';
}) {
  mixpanel.track('Auth Modal Shown', properties);
}

export function trackScanInitiated(properties: {
  source: 'camera' | 'gallery';
}) {
  mixpanel.track('Scan Initiated', properties);
}

export function trackNotificationResponse(properties: {
  action: 'enabled' | 'skipped' | 'denied';
}) {
  mixpanel.track('Notification Permission', properties);
}

export function trackLanguageChanged(properties: {
  from: string;
  to: string;
}) {
  mixpanel.track('Language Changed', properties);
  setUserProperty('language', properties.to);
}

export default mixpanel;
