/**
 * Contextual Help System
 * Provides just-in-time guidance and smart tooltips throughout the app
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HelpTip {
  id: string;
  screen: string;
  element?: string;
  titleEn: string;
  titleAr: string;
  contentEn: string;
  contentAr: string;
  type: 'tooltip' | 'walkthrough' | 'hint' | 'warning';
  priority: 'low' | 'medium' | 'high';
  conditions?: {
    firstTime?: boolean;
    userType?: 'beginner' | 'intermediate' | 'expert';
    errorState?: boolean;
    feature?: string;
  };
  actions?: Array<{
    labelEn: string;
    labelAr: string;
    action: 'dismiss' | 'gotIt' | 'showMore' | 'tryNow';
  }>;
}

interface HelpState {
  shownTips: string[];
  dismissedTips: string[];
  helpEnabled: boolean;
  walkthroughCompleted: string[];
  lastShownDate: { [tipId: string]: string };
  userInteractionCount: { [screen: string]: number };
}

// Comprehensive help tips database
const HELP_TIPS: HelpTip[] = [
  // Home Screen Tips
  {
    id: 'home_first_visit',
    screen: 'home',
    titleEn: 'Welcome to Lotus! 🌿',
    titleAr: 'أهلاً بك في لوتس! 🌿',
    contentEn: 'Your plant care journey starts here. Tap the scan button to identify your first plant!',
    contentAr: 'رحلة العناية بالنباتات تبدأ هنا. انقر على زر المسح لتحديد أول نبتة لك!',
    type: 'walkthrough',
    priority: 'high',
    conditions: { firstTime: true },
    actions: [
      { labelEn: 'Take a Tour', labelAr: 'جولة تعريفية', action: 'showMore' },
      { labelEn: 'Start Scanning', labelAr: 'ابدأ المسح', action: 'tryNow' }
    ]
  },
  {
    id: 'home_care_tips',
    screen: 'home',
    element: 'care_tips',
    titleEn: 'Daily Care Tips',
    titleAr: 'نصائح العناية اليومية',
    contentEn: 'These tips change daily and are personalized based on your plants and Cairo weather.',
    contentAr: 'هذه النصائح تتغير يومياً وهي مخصصة بناءً على نباتاتك وطقس القاهرة.',
    type: 'tooltip',
    priority: 'medium',
    conditions: { userType: 'beginner' },
    actions: [
      { labelEn: 'Got it', labelAr: 'فهمت', action: 'gotIt' }
    ]
  },

  // Scan Screen Tips
  {
    id: 'scan_first_time',
    screen: 'scan',
    titleEn: 'Perfect Plant Photos 📸',
    titleAr: 'صور مثالية للنباتات 📸',
    contentEn: 'For best results: use natural light, clean leaves, and center the plant in the frame.',
    contentAr: 'للحصول على أفضل النتائج: استخدم الضوء الطبيعي، نظف الأوراق، واضع النبات في منتصف الإطار.',
    type: 'walkthrough',
    priority: 'high',
    conditions: { firstTime: true },
    actions: [
      { labelEn: 'Show Tips', labelAr: 'عرض النصائح', action: 'showMore' },
      { labelEn: 'Start Scanning', labelAr: 'ابدأ المسح', action: 'tryNow' }
    ]
  },
  {
    id: 'scan_guarantee',
    screen: 'scan',
    titleEn: 'First Scan Guarantee ⭐',
    titleAr: 'ضمان المسح الأول ⭐',
    contentEn: 'Don\'t worry - we guarantee your first plant identification will be successful!',
    contentAr: 'لا تقلق - نضمن نجاح تحديد هوية نبتتك الأولى!',
    type: 'hint',
    priority: 'high',
    conditions: { firstTime: true },
    actions: [
      { labelEn: 'Great!', labelAr: 'رائع!', action: 'gotIt' }
    ]
  },
  {
    id: 'scan_no_plant_detected',
    screen: 'scan',
    titleEn: 'No Plant Detected',
    titleAr: 'لم يتم اكتشاف نبات',
    contentEn: 'Point your camera at a plant with visible leaves. The app will automatically detect when ready.',
    contentAr: 'وجه الكاميرا نحو نبات بأوراق ظاهرة. التطبيق سيكتشف تلقائياً عندما يكون جاهزاً.',
    type: 'warning',
    priority: 'high',
    conditions: { errorState: true, feature: 'plant_detection' },
    actions: [
      { labelEn: 'Try Again', labelAr: 'حاول مرة أخرى', action: 'tryNow' }
    ]
  },

  // Plants Collection Tips
  {
    id: 'plants_empty_state',
    screen: 'plants',
    titleEn: 'Start Your Plant Collection 🌱',
    titleAr: 'ابدأ مجموعة نباتاتك 🌱',
    contentEn: 'Scan your first plant to begin tracking its care schedule and health.',
    contentAr: 'امسح نبتتك الأولى لتبدأ في تتبع جدول العناية وصحتها.',
    type: 'hint',
    priority: 'medium',
    actions: [
      { labelEn: 'Scan Now', labelAr: 'امسح الآن', action: 'tryNow' }
    ]
  },
  {
    id: 'plants_watering_overdue',
    screen: 'plants',
    element: 'overdue_plants',
    titleEn: 'Plants Need Water! 💧',
    titleAr: 'النباتات تحتاج ماء! 💧',
    contentEn: 'These plants are overdue for watering. Tap the water drop to log care.',
    contentAr: 'هذه النباتات متأخرة عن موعد الري. انقر على قطرة الماء لتسجيل العناية.',
    type: 'warning',
    priority: 'high',
    conditions: { feature: 'overdue_care' },
    actions: [
      { labelEn: 'Water Now', labelAr: 'اسق الآن', action: 'tryNow' },
      { labelEn: 'Remind Later', labelAr: 'ذكرني لاحقاً', action: 'dismiss' }
    ]
  },

  // Profile Screen Tips
  {
    id: 'profile_personalization',
    screen: 'profile',
    titleEn: 'Personalize Your Experience',
    titleAr: 'خصص تجربتك',
    contentEn: 'Update your plant care preferences to get better recommendations.',
    contentAr: 'حدث تفضيلات العناية بالنباتات للحصول على توصيات أفضل.',
    type: 'tooltip',
    priority: 'medium',
    conditions: { userType: 'beginner' },
    actions: [
      { labelEn: 'Update Now', labelAr: 'حدث الآن', action: 'tryNow' },
      { labelEn: 'Maybe Later', labelAr: 'ربما لاحقاً', action: 'dismiss' }
    ]
  },

  // Feature Discovery Tips
  {
    id: 'quick_actions',
    screen: 'plants',
    element: 'plant_card',
    titleEn: 'Quick Actions Available',
    titleAr: 'إجراءات سريعة متاحة',
    contentEn: 'Long press on any plant card for quick watering and care options.',
    contentAr: 'اضغط مطولاً على أي بطاقة نبات للري السريع وخيارات العناية.',
    type: 'hint',
    priority: 'low',
    actions: [
      { labelEn: 'Try it', labelAr: 'جربها', action: 'tryNow' },
      { labelEn: 'Got it', labelAr: 'فهمت', action: 'gotIt' }
    ]
  },

  // Language and Accessibility
  {
    id: 'language_switch',
    screen: 'home',
    element: 'language_toggle',
    titleEn: 'Switch Languages Anytime',
    titleAr: 'غير اللغة في أي وقت',
    contentEn: 'Tap the language button to switch between English and Arabic.',
    contentAr: 'انقر على زر اللغة للتبديل بين الإنجليزية والعربية.',
    type: 'tooltip',
    priority: 'low',
    actions: [
      { labelEn: 'Got it', labelAr: 'فهمت', action: 'gotIt' }
    ]
  }
];

class ContextualHelpService {
  private static readonly STORAGE_KEY = 'lotus_help_state';
  private static readonly MAX_TIPS_PER_SESSION = 2;
  private static readonly COOLDOWN_HOURS = 24;

  /**
   * Initialize help state for new users
   */
  async initializeHelpState(): Promise<HelpState> {
    try {
      const existingState = await this.getHelpState();
      if (existingState) {
        return existingState;
      }

      const initialState: HelpState = {
        shownTips: [],
        dismissedTips: [],
        helpEnabled: true,
        walkthroughCompleted: [],
        lastShownDate: {},
        userInteractionCount: {},
      };

      await this.saveHelpState(initialState);
      return initialState;
    } catch (error) {
      console.error('Error initializing help state:', error);
      throw error;
    }
  }

  /**
   * Get relevant help tips for a screen based on context
   */
  async getRelevantTips(
    screen: string,
    context: {
      isFirstTime?: boolean;
      userType?: 'beginner' | 'intermediate' | 'expert';
      errorState?: boolean;
      feature?: string;
      element?: string;
    }
  ): Promise<HelpTip[]> {
    try {
      const state = await this.getHelpState();
      if (!state || !state.helpEnabled) {
        return [];
      }

      // Increment interaction count for this screen
      await this.recordInteraction(screen);

      // Filter tips based on screen and context
      const relevantTips = HELP_TIPS.filter(tip => {
        // Must match screen
        if (tip.screen !== screen) return false;

        // Check if already dismissed permanently
        if (state.dismissedTips.includes(tip.id)) return false;

        // Check cooldown period
        if (this.isInCooldown(tip.id, state)) return false;

        // Check if already shown too many times
        if (this.isOverShownLimit(tip.id, state)) return false;

        // Check specific element matching
        if (context.element && tip.element && tip.element !== context.element) {
          return false;
        }

        // Check conditions
        if (tip.conditions) {
          const conditions = tip.conditions;
          
          if (conditions.firstTime && !context.isFirstTime) return false;
          if (conditions.userType && conditions.userType !== context.userType) return false;
          if (conditions.errorState && !context.errorState) return false;
          if (conditions.feature && conditions.feature !== context.feature) return false;
        }

        return true;
      });

      // Sort by priority and limit results
      const sortedTips = relevantTips.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      return sortedTips.slice(0, ContextualHelpService.MAX_TIPS_PER_SESSION);
    } catch (error) {
      console.error('Error getting relevant tips:', error);
      return [];
    }
  }

  /**
   * Mark a tip as shown
   */
  async markTipShown(tipId: string): Promise<void> {
    try {
      const state = await this.getHelpState();
      if (!state) return;

      const updatedState: HelpState = {
        ...state,
        shownTips: [...new Set([...state.shownTips, tipId])],
        lastShownDate: {
          ...state.lastShownDate,
          [tipId]: new Date().toISOString(),
        },
      };

      await this.saveHelpState(updatedState);
    } catch (error) {
      console.error('Error marking tip shown:', error);
    }
  }

  /**
   * Dismiss a tip permanently or temporarily
   */
  async dismissTip(tipId: string, permanently: boolean = false): Promise<void> {
    try {
      const state = await this.getHelpState();
      if (!state) return;

      const updatedState: HelpState = {
        ...state,
        dismissedTips: permanently 
          ? [...new Set([...state.dismissedTips, tipId])]
          : state.dismissedTips,
        lastShownDate: permanently
          ? state.lastShownDate
          : { ...state.lastShownDate, [tipId]: new Date().toISOString() },
      };

      await this.saveHelpState(updatedState);
    } catch (error) {
      console.error('Error dismissing tip:', error);
    }
  }

  /**
   * Mark a walkthrough as completed
   */
  async completeWalkthrough(walkthroughId: string): Promise<void> {
    try {
      const state = await this.getHelpState();
      if (!state) return;

      const updatedState: HelpState = {
        ...state,
        walkthroughCompleted: [...new Set([...state.walkthroughCompleted, walkthroughId])],
      };

      await this.saveHelpState(updatedState);
    } catch (error) {
      console.error('Error completing walkthrough:', error);
    }
  }

  /**
   * Toggle help system on/off
   */
  async toggleHelp(enabled: boolean): Promise<void> {
    try {
      const state = await this.getHelpState();
      if (!state) return;

      const updatedState: HelpState = {
        ...state,
        helpEnabled: enabled,
      };

      await this.saveHelpState(updatedState);
    } catch (error) {
      console.error('Error toggling help:', error);
    }
  }

  /**
   * Reset help state (for testing or user preference)
   */
  async resetHelpState(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ContextualHelpService.STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting help state:', error);
    }
  }

  /**
   * Get help statistics for analytics
   */
  async getHelpStats(): Promise<{
    totalTipsShown: number;
    dismissedTips: number;
    walkthroughsCompleted: number;
    helpEnabled: boolean;
  }> {
    try {
      const state = await this.getHelpState();
      return {
        totalTipsShown: state?.shownTips.length || 0,
        dismissedTips: state?.dismissedTips.length || 0,
        walkthroughsCompleted: state?.walkthroughCompleted.length || 0,
        helpEnabled: state?.helpEnabled ?? true,
      };
    } catch (error) {
      console.error('Error getting help stats:', error);
      return { totalTipsShown: 0, dismissedTips: 0, walkthroughsCompleted: 0, helpEnabled: true };
    }
  }

  // Private helper methods
  private async getHelpState(): Promise<HelpState | null> {
    try {
      const stateJson = await AsyncStorage.getItem(ContextualHelpService.STORAGE_KEY);
      return stateJson ? JSON.parse(stateJson) : null;
    } catch (error) {
      console.error('Error getting help state:', error);
      return null;
    }
  }

  private async saveHelpState(state: HelpState): Promise<void> {
    try {
      await AsyncStorage.setItem(ContextualHelpService.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving help state:', error);
      throw error;
    }
  }

  private async recordInteraction(screen: string): Promise<void> {
    try {
      const state = await this.getHelpState();
      if (!state) return;

      const updatedState: HelpState = {
        ...state,
        userInteractionCount: {
          ...state.userInteractionCount,
          [screen]: (state.userInteractionCount[screen] || 0) + 1,
        },
      };

      await this.saveHelpState(updatedState);
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  }

  private isInCooldown(tipId: string, state: HelpState): boolean {
    const lastShown = state.lastShownDate[tipId];
    if (!lastShown) return false;

    const lastShownDate = new Date(lastShown);
    const now = new Date();
    const hoursSince = (now.getTime() - lastShownDate.getTime()) / (1000 * 60 * 60);

    return hoursSince < ContextualHelpService.COOLDOWN_HOURS;
  }

  private isOverShownLimit(tipId: string, state: HelpState): boolean {
    const timesShown = state.shownTips.filter(id => id === tipId).length;
    return timesShown >= 3; // Max 3 times per tip
  }
}

export const contextualHelpService = new ContextualHelpService();
export type { HelpState };