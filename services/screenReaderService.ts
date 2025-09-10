/**
 * Screen Reader Optimization Service
 * Enhanced accessibility for visual impairments with intelligent announcements
 */
import { AccessibilityInfo } from 'react-native';
import { getPlantHealthLabel, getWateringStatusLabel } from '@/utils/accessibility';

interface AnnouncementOptions {
  priority: 'low' | 'medium' | 'high';
  interrupt: boolean;
  language?: 'en' | 'ar';
  delay?: number;
}

interface PlantAnnouncementData {
  plantName: string;
  health: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL';
  wateringStatus: string | null;
  careActions?: string[];
  confidence?: number;
  isNewPlant?: boolean;
}

class ScreenReaderService {
  private static instance: ScreenReaderService;
  private currentLanguage: 'en' | 'ar' = 'en';
  private isScreenReaderEnabled = false;
  private announcementQueue: Array<{
    message: string;
    options: AnnouncementOptions;
    timestamp: number;
  }> = [];

  constructor() {
    this.initializeScreenReader();
  }

  public static getInstance(): ScreenReaderService {
    if (!ScreenReaderService.instance) {
      ScreenReaderService.instance = new ScreenReaderService();
    }
    return ScreenReaderService.instance;
  }

  /**
   * Initialize screen reader detection and settings
   */
  private async initializeScreenReader() {
    try {
      // Check if screen reader is enabled (may not work in Expo Go)
      if (AccessibilityInfo && typeof AccessibilityInfo.isScreenReaderEnabled === 'function') {
        this.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        
        // Listen for screen reader changes
        if (typeof AccessibilityInfo.addEventListener === 'function') {
          AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
            this.isScreenReaderEnabled = enabled;
            if (enabled) {
              this.announce(
                this.currentLanguage === 'ar' 
                  ? 'تم تفعيل قارئ الشاشة. تطبيق لوتس جاهز للاستخدام.'
                  : 'Screen reader enabled. Lotus app is ready to use.',
                { priority: 'medium', interrupt: false }
              );
            }
          });
        }
      }
    } catch (error) {
      console.warn('Screen reader detection not available in Expo Go:', error);
      this.isScreenReaderEnabled = false;
    }
  }

  /**
   * Set current language for announcements
   */
  setLanguage(language: 'en' | 'ar') {
    this.currentLanguage = language;
  }

  /**
   * Make a screen reader announcement
   */
  async announce(
    message: string, 
    options: Partial<AnnouncementOptions> = {}
  ): Promise<void> {
    if (!this.isScreenReaderEnabled) return;

    const fullOptions: AnnouncementOptions = {
      priority: 'medium',
      interrupt: false,
      language: this.currentLanguage,
      delay: 0,
      ...options,
    };

    // Add to queue if needed
    if (fullOptions.delay && fullOptions.delay > 0) {
      setTimeout(() => {
        this.performAnnouncement(message);
      }, fullOptions.delay);
    } else {
      this.performAnnouncement(message);
    }
  }

  /**
   * Perform the actual announcement
   */
  private performAnnouncement(message: string) {
    try {
      // Check if the method exists (may not be available in Expo Go)
      if (AccessibilityInfo && typeof AccessibilityInfo.announceForAccessibility === 'function') {
        AccessibilityInfo.announceForAccessibility(message);
      } else {
        // Fallback for Expo Go - just log the message
        console.log('Screen reader announcement:', message);
      }
    } catch (error) {
      console.warn('Screen reader announcement not available in Expo Go:', error);
    }
  }

  /**
   * Announce plant identification results
   */
  announceIdentificationResult(
    plantData: PlantAnnouncementData,
    isGuaranteed: boolean = false
  ) {
    const { plantName, health, confidence, isNewPlant } = plantData;
    
    const messages = {
      en: [
        isGuaranteed ? 'Plant successfully identified with guarantee.' : 'Plant identified.',
        `This is ${plantName}.`,
        confidence ? `Confidence: ${Math.round(confidence * 100)} percent.` : '',
        `Health status: ${getPlantHealthLabel(health, 'en')}.`,
        isNewPlant ? 'This is a new plant in your collection.' : '',
        'Swipe right to hear care instructions, or double tap to add to your garden.',
      ].filter(Boolean).join(' '),
      
      ar: [
        isGuaranteed ? 'تم التعرف على النبات بضمان النجاح.' : 'تم التعرف على النبات.',
        `هذا نبات ${plantName}.`,
        confidence ? `مستوى الثقة: ${Math.round(confidence * 100)} بالمائة.` : '',
        `حالة الصحة: ${getPlantHealthLabel(health, 'ar')}.`,
        isNewPlant ? 'هذا نبات جديد في مجموعتك.' : '',
        'اسحب يميناً لسماع تعليمات العناية، أو انقر مرتين للإضافة لحديقتك.',
      ].filter(Boolean).join(' ')
    };

    this.announce(messages[this.currentLanguage], {
      priority: 'high',
      interrupt: true,
    });
  }

  /**
   * Announce plant care instructions
   */
  announceCareInstructions(plantData: {
    plantName: string;
    watering: string;
    light: string;
    environment: string;
    cairoTips?: string;
  }) {
    const messages = {
      en: [
        `Care instructions for ${plantData.plantName}:`,
        `Watering: ${plantData.watering}`,
        `Light requirements: ${plantData.light}`,
        `Environment: ${plantData.environment}`,
        plantData.cairoTips ? `Cairo specific tip: ${plantData.cairoTips}` : '',
      ].filter(Boolean).join('. '),
      
      ar: [
        `تعليمات العناية بـ ${plantData.plantName}:`,
        `الري: ${plantData.watering}`,
        `متطلبات الإضاءة: ${plantData.light}`,
        `البيئة: ${plantData.environment}`,
        plantData.cairoTips ? `نصيحة خاصة بالقاهرة: ${plantData.cairoTips}` : '',
      ].filter(Boolean).join('. ')
    };

    this.announce(messages[this.currentLanguage], {
      priority: 'medium',
      interrupt: false,
    });
  }

  /**
   * Announce watering activity
   */
  announceWateringAction(plantName: string, success: boolean) {
    const messages = {
      en: success 
        ? `Successfully watered ${plantName}. Next watering reminder set.`
        : `Failed to log watering for ${plantName}. Please try again.`,
      ar: success
        ? `تم سقي ${plantName} بنجاح. تم تعيين تذكير الري التالي.`
        : `فشل في تسجيل سقي ${plantName}. يرجى المحاولة مرة أخرى.`
    };

    this.announce(messages[this.currentLanguage], {
      priority: 'medium',
      interrupt: false,
    });
  }

  /**
   * Announce collection status updates
   */
  announceCollectionUpdate(action: 'added' | 'removed', plantName: string) {
    const messages = {
      en: {
        added: `${plantName} has been added to your plant collection.`,
        removed: `${plantName} has been removed from your collection.`,
      },
      ar: {
        added: `تمت إضافة ${plantName} لمجموعة نباتاتك.`,
        removed: `تم حذف ${plantName} من مجموعتك.`,
      }
    };

    this.announce(messages[this.currentLanguage][action], {
      priority: 'medium',
      interrupt: false,
    });
  }

  /**
   * Announce navigation changes
   */
  announceNavigation(screenName: string, additionalInfo?: string) {
    const screenNames = {
      en: {
        home: 'Home screen',
        scan: 'Plant scanner',
        plants: 'My plants',
        profile: 'Profile',
        onboarding: 'Getting started',
        auth: 'Sign in',
      },
      ar: {
        home: 'الشاشة الرئيسية',
        scan: 'ماسح النباتات',
        plants: 'نباتاتي',
        profile: 'الملف الشخصي',
        onboarding: 'البدء',
        auth: 'تسجيل الدخول',
      }
    };

    const baseName = screenNames[this.currentLanguage][screenName] || screenName;
    const fullMessage = additionalInfo ? `${baseName}. ${additionalInfo}` : baseName;

    this.announce(fullMessage, {
      priority: 'low',
      interrupt: false,
      delay: 500, // Slight delay for navigation transitions
    });
  }

  /**
   * Announce error states with helpful context
   */
  announceError(errorType: 'network' | 'camera' | 'identification' | 'general', details?: string) {
    const errorMessages = {
      en: {
        network: 'Network connection error. Please check your internet connection and try again.',
        camera: 'Camera access error. Please ensure camera permissions are granted.',
        identification: 'Plant identification failed. Try taking another photo with better lighting.',
        general: 'An error occurred. Please try again.',
      },
      ar: {
        network: 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.',
        camera: 'خطأ في الوصول للكاميرا. يرجى التأكد من منح صلاحيات الكاميرا.',
        identification: 'فشل في تحديد النبات. حاول التقاط صورة أخرى بإضاءة أفضل.',
        general: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
      }
    };

    const message = errorMessages[this.currentLanguage][errorType];
    const fullMessage = details ? `${message} ${details}` : message;

    this.announce(fullMessage, {
      priority: 'high',
      interrupt: true,
    });
  }

  /**
   * Announce progress updates
   */
  announceProgress(stage: string, progress?: number) {
    const progressMessages = {
      en: {
        scanning: 'Scanning plant...',
        processing: 'Processing image...',
        identifying: 'Identifying plant species...',
        saving: 'Saving to your collection...',
        loading: 'Loading your plants...',
      },
      ar: {
        scanning: 'جاري مسح النبات...',
        processing: 'جاري معالجة الصورة...',
        identifying: 'جاري تحديد نوع النبات...',
        saving: 'جاري الحفظ في مجموعتك...',
        loading: 'جاري تحميل نباتاتك...',
      }
    };

    let message = progressMessages[this.currentLanguage][stage] || stage;
    
    if (progress !== undefined) {
      const progressText = this.currentLanguage === 'ar' 
        ? `${Math.round(progress)} بالمائة مكتمل`
        : `${Math.round(progress)} percent complete`;
      message = `${message} ${progressText}.`;
    }

    this.announce(message, {
      priority: 'low',
      interrupt: false,
    });
  }

  /**
   * Announce contextual help
   */
  announceHelp(helpText: string, context?: string) {
    const prefix = {
      en: context ? `Help for ${context}: ` : 'Help: ',
      ar: context ? `مساعدة لـ ${context}: ` : 'مساعدة: '
    };

    this.announce(prefix[this.currentLanguage] + helpText, {
      priority: 'medium',
      interrupt: false,
    });
  }

  /**
   * Provide detailed plant card information for screen readers
   */
  describePlantCard(plant: {
    names: { english: string; arabic: string };
    healthStatus: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL';
    nextWateringDate: string | null;
    location?: string;
    nickName?: string;
  }): string {
    const plantName = plant.nickName || plant.names[this.currentLanguage === 'ar' ? 'arabic' : 'english'];
    const healthLabel = getPlantHealthLabel(plant.healthStatus, this.currentLanguage);
    const wateringLabel = getWateringStatusLabel(plant.nextWateringDate, this.currentLanguage);
    
    const descriptions = {
      en: [
        `Plant: ${plantName}`,
        `Health: ${healthLabel}`,
        `Watering: ${wateringLabel}`,
        plant.location ? `Location: ${plant.location}` : '',
        'Double tap to open plant details, or swipe right for quick actions.',
      ].filter(Boolean).join('. '),
      
      ar: [
        `النبات: ${plantName}`,
        `الصحة: ${healthLabel}`,
        `الري: ${wateringLabel}`,
        plant.location ? `المكان: ${plant.location}` : '',
        'انقر مرتين لفتح تفاصيل النبات، أو اسحب يميناً للإجراءات السريعة.',
      ].filter(Boolean).join('. ')
    };

    return descriptions[this.currentLanguage];
  }

  /**
   * Announce first-time user guidance
   */
  announceFirstTimeGuidance(context: 'onboarding' | 'scan' | 'plants') {
    const guidance = {
      en: {
        onboarding: 'Welcome to Lotus! This setup will personalize your plant care experience. Swipe right to continue through each step.',
        scan: 'Welcome to the plant scanner! Point your camera at any plant and the app will identify it for you. Your first scan is guaranteed to succeed.',
        plants: 'This is your plant collection. When you add plants, they will appear here with care reminders and health status.',
      },
      ar: {
        onboarding: 'أهلاً بك في لوتس! هذا الإعداد سيخصص تجربة العناية بالنباتات. اسحب يميناً للمتابعة خلال كل خطوة.',
        scan: 'أهلاً بك في ماسح النباتات! وجه الكاميرا نحو أي نبات وسيحدده التطبيق لك. مسحتك الأولى مضمونة النجاح.',
        plants: 'هذه مجموعة نباتاتك. عند إضافة النباتات، ستظهر هنا مع تذكيرات العناية وحالة الصحة.',
      }
    };

    this.announce(guidance[this.currentLanguage][context], {
      priority: 'medium',
      interrupt: false,
      delay: 1000, // Give time for screen to load
    });
  }
}

// Export singleton instance
export const screenReaderService = ScreenReaderService.getInstance();

// Utility functions for common screen reader tasks
export const ScreenReaderUtils = {
  /**
   * Create comprehensive accessibility label for complex UI elements
   */
  createAccessibilityLabel: (
    primary: string,
    secondary?: string,
    status?: string,
    actions?: string[]
  ): string => {
    const parts = [primary];
    if (secondary) parts.push(secondary);
    if (status) parts.push(status);
    if (actions && actions.length > 0) {
      parts.push('Available actions: ' + actions.join(', '));
    }
    return parts.join('. ');
  },

  /**
   * Format time-based information for screen readers
   */
  formatTimeForScreenReader: (date: string | Date, language: 'en' | 'ar' = 'en'): string => {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (language === 'ar') {
      if (diffDays < 0) return `منذ ${Math.abs(diffDays)} يوم`;
      if (diffDays === 0) return 'اليوم';
      if (diffDays === 1) return 'غداً';
      return `خلال ${diffDays} أيام`;
    } else {
      if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
      if (diffDays === 0) return 'today';
      if (diffDays === 1) return 'tomorrow';
      return `in ${diffDays} days`;
    }
  },
};

export default screenReaderService;