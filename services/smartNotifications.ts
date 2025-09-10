/**
 * Smart Notification System - Revolutionary Plant Care Alerts
 * "Think Different" - Notifications that feel like a caring friend
 * Cairo weather-aware, personality-driven notification system
 */

import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import aiPlantWhisperer from './aiPlantWhisperer';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface PlantNotificationData {
  plantId: string;
  plantName: string;
  plantNameAr: string;
  plantType: string;
  lastWatered: Date;
  healthStatus: 'healthy' | 'warning' | 'critical';
  userPreferences: {
    notificationStyle: 'gentle' | 'persistent' | 'minimal';
    morningPerson: boolean;
    language: 'en' | 'ar';
  };
}

interface NotificationTemplate {
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  categoryId: string;
  sound: 'default' | 'water_drop' | 'plant_chime' | 'gentle_bell';
  hapticPattern: 'success' | 'warning' | 'error' | 'gentle' | 'playful';
  priority: 'low' | 'normal' | 'high';
  actions?: Array<{
    id: string;
    title: string;
    titleAr: string;
    options?: any;
  }>;
}

class SmartNotificationSystem {
  private static instance: SmartNotificationSystem;
  private scheduledNotifications: Map<string, string> = new Map();
  private weatherData: any = null;
  private cairoSpecificTips = [
    'Cairo dust can block sunlight - clean leaves weekly',
    'Summer heat requires extra watering attention',
    'Air conditioning affects plant humidity needs',
    'Morning watering works best in Cairo\'s climate'
  ];

  static getInstance(): SmartNotificationSystem {
    if (!SmartNotificationSystem.instance) {
      SmartNotificationSystem.instance = new SmartNotificationSystem();
    }
    return SmartNotificationSystem.instance;
  }

  /**
   * Initialize notification system with permissions
   */
  async initialize(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions denied');
        return false;
      }

      // Set up notification categories with actions
      await this.setupNotificationCategories();
      
      // Start listening for notifications
      this.setupNotificationListeners();

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  /**
   * Schedule smart notifications for a plant
   */
  async scheduleSmartNotifications(plantData: PlantNotificationData): Promise<void> {
    try {
      // Cancel existing notifications for this plant
      await this.cancelPlantNotifications(plantData.plantId);

      // Get AI recommendations
      const recommendations = await aiPlantWhisperer.generateRecommendations(
        plantData.plantType,
        plantData.lastWatered,
        plantData.healthStatus,
        {
          wateringFrequency: 7,
          careConsistency: 80,
          responseToAlerts: 90
        }
      );

      // Schedule based on urgency and user preferences
      for (const recommendation of recommendations) {
        await this.scheduleRecommendationNotification(plantData, recommendation);
      }

      // Schedule gentle daily check-ins (if user prefers gentle notifications)
      if (plantData.userPreferences.notificationStyle === 'gentle') {
        await this.scheduleGentleCheckIns(plantData);
      }

      // Schedule weather-aware notifications
      await this.scheduleWeatherAwareNotifications(plantData);

    } catch (error) {
      console.error('Error scheduling smart notifications:', error);
    }
  }

  /**
   * Send immediate contextual notification
   */
  async sendContextualNotification(
    plantData: PlantNotificationData,
    context: 'watering_success' | 'plant_scanned' | 'health_improved' | 'milestone_reached'
  ): Promise<void> {
    const templates = this.getContextualTemplates(context, plantData);
    const template = templates[Math.floor(Math.random() * templates.length)];

    await this.sendNotificationWithTemplate(template, plantData);
    await this.triggerContextualHaptics(context);
  }

  /**
   * Schedule celebration notification for plant milestones
   */
  async scheduleCelebrationNotification(
    plantData: PlantNotificationData,
    milestone: string
  ): Promise<void> {
    const template: NotificationTemplate = {
      title: `🎉 ${plantData.plantName} Achievement!`,
      titleAr: `🎉 إنجاز ${plantData.plantNameAr}!`,
      body: `Your plant has reached a milestone: ${milestone}! Keep up the great care! 🌟`,
      bodyAr: `لقد وصلت نبتتك لإنجاز: ${milestone}! استمر في العناية الرائعة! 🌟`,
      categoryId: 'celebration',
      sound: 'plant_chime',
      hapticPattern: 'success',
      priority: 'normal',
      actions: [
        {
          id: 'view_plant',
          title: 'View Plant',
          titleAr: 'عرض النبتة',
        },
        {
          id: 'share_success',
          title: 'Share Success',
          titleAr: 'شارك النجاح',
        }
      ]
    };

    await this.sendNotificationWithTemplate(template, plantData);
    
    // Trigger celebration haptics
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 200);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 400);
  }

  /**
   * Send weather-aware notification
   */
  async sendWeatherAwareNotification(plantData: PlantNotificationData): Promise<void> {
    // Simulate weather data (in real implementation, fetch from weather API)
    const weather = {
      temperature: 32,
      humidity: 35,
      condition: 'hot_dry',
      dustLevel: 'high'
    };

    let template: NotificationTemplate;

    if (weather.condition === 'hot_dry' && weather.temperature > 30) {
      template = {
        title: `☀️ Cairo Heat Alert for ${plantData.plantName}`,
        titleAr: `☀️ تنبيه حرارة القاهرة لـ ${plantData.plantNameAr}`,
        body: `It's ${weather.temperature}°C today! Your plant might need extra water and shade.`,
        bodyAr: `الحرارة اليوم ${weather.temperature}°م! قد تحتاج نبتتك لماء إضافي وظل.`,
        categoryId: 'weather_alert',
        sound: 'gentle_bell',
        hapticPattern: 'warning',
        priority: 'high',
        actions: [
          {
            id: 'water_now',
            title: 'Water Now',
            titleAr: 'اسق الآن',
          }
        ]
      };
    } else if (weather.dustLevel === 'high') {
      template = {
        title: `🌪️ Cairo Dust Alert`,
        titleAr: `🌪️ تنبيه غبار القاهرة`,
        body: `High dust levels today. Consider cleaning your ${plantData.plantName}'s leaves.`,
        bodyAr: `مستوى غبار عالي اليوم. فكر في تنظيف أوراق ${plantData.plantNameAr}.`,
        categoryId: 'dust_alert',
        sound: 'gentle_bell',
        hapticPattern: 'gentle',
        priority: 'normal',
        actions: [
          {
            id: 'clean_leaves',
            title: 'Clean Leaves',
            titleAr: 'نظف الأوراق',
          }
        ]
      };
    } else {
      return; // No weather alert needed
    }

    await this.sendNotificationWithTemplate(template, plantData);
  }

  /**
   * Trigger haptic feedback based on context
   */
  private async triggerContextualHaptics(context: string): Promise<void> {
    switch (context) {
      case 'watering_success':
        // Success pattern: medium -> light -> light
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 150);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 300);
        break;
      
      case 'plant_scanned':
        // Scan pattern: light pulse
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      
      case 'health_improved':
        // Improvement pattern: gentle success
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      
      case 'milestone_reached':
        // Celebration pattern: strong -> medium -> light -> light
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 200);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 350);
        break;
    }
  }

  /**
   * Setup notification categories with interactive actions
   */
  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('watering_reminder', [
      {
        identifier: 'water_now',
        buttonTitle: 'Water Now',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'snooze',
        buttonTitle: 'Remind Later',
        options: { opensAppToForeground: false },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('health_alert', [
      {
        identifier: 'check_plant',
        buttonTitle: 'Check Plant',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'get_help',
        buttonTitle: 'Get Help',
        options: { opensAppToForeground: true },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('celebration', [
      {
        identifier: 'view_plant',
        buttonTitle: 'View Plant',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'share_success',
        buttonTitle: 'Share',
        options: { opensAppToForeground: false },
      },
    ]);
  }

  /**
   * Setup notification event listeners
   */
  private setupNotificationListeners(): void {
    // Handle notification received while app is running
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // Trigger gentle haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });

    // Handle notification response (user tap or action)
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle notification responses and actions
   */
  private async handleNotificationResponse(response: any): Promise<void> {
    const { actionIdentifier, notification } = response;
    const plantId = notification.request.content.data?.plantId;

    switch (actionIdentifier) {
      case 'water_now':
        // Navigate to plant and mark as watered
        // This would integrate with your navigation system
        console.log('Water now action for plant:', plantId);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      
      case 'snooze':
        // Reschedule notification for later
        await this.snoozeNotification(plantId, 2); // 2 hours
        break;
      
      case 'check_plant':
        // Navigate to plant details
        console.log('Check plant action for plant:', plantId);
        break;
    }
  }

  /**
   * Generate contextual notification templates
   */
  private getContextualTemplates(
    context: string,
    plantData: PlantNotificationData
  ): NotificationTemplate[] {
    const templates: Record<string, NotificationTemplate[]> = {
      watering_success: [
        {
          title: `💧 Great job!`,
          titleAr: `💧 أحسنت!`,
          body: `${plantData.plantName} is happy and hydrated! Next watering in 5-7 days.`,
          bodyAr: `${plantData.plantNameAr} سعيد ومروي! الري التالي خلال 5-7 أيام.`,
          categoryId: 'success',
          sound: 'water_drop',
          hapticPattern: 'success',
          priority: 'normal',
        }
      ],
      plant_scanned: [
        {
          title: `🔍 Plant Analysis Complete`,
          titleAr: `🔍 تحليل النبات مكتمل`,
          body: `Your ${plantData.plantName} looks healthy! Check the detailed report.`,
          bodyAr: `${plantData.plantNameAr} يبدو بصحة جيدة! تحقق من التقرير المفصل.`,
          categoryId: 'analysis',
          sound: 'plant_chime',
          hapticPattern: 'gentle',
          priority: 'normal',
        }
      ],
      health_improved: [
        {
          title: `📈 Health Improvement!`,
          titleAr: `📈 تحسن في الصحة!`,
          body: `${plantData.plantName}'s health has improved! Your care is working perfectly.`,
          bodyAr: `صحة ${plantData.plantNameAr} تحسنت! عنايتك تعمل بشكل مثالي.`,
          categoryId: 'improvement',
          sound: 'plant_chime',
          hapticPattern: 'success',
          priority: 'normal',
        }
      ],
      milestone_reached: [
        {
          title: `🏆 Plant Milestone!`,
          titleAr: `🏆 إنجاز النبات!`,
          body: `Congratulations! ${plantData.plantName} has been thriving for 30 days!`,
          bodyAr: `مبروك! ${plantData.plantNameAr} ينمو بقوة منذ 30 يوماً!`,
          categoryId: 'milestone',
          sound: 'plant_chime',
          hapticPattern: 'success',
          priority: 'high',
        }
      ],
    };

    return templates[context] || [];
  }

  /**
   * Send notification using template
   */
  private async sendNotificationWithTemplate(
    template: NotificationTemplate,
    plantData: PlantNotificationData
  ): Promise<void> {
    const isArabic = plantData.userPreferences.language === 'ar';
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: isArabic ? template.titleAr : template.title,
        body: isArabic ? template.bodyAr : template.body,
        categoryIdentifier: template.categoryId,
        data: { plantId: plantData.plantId, context: template.categoryId },
        sound: template.sound,
      },
      trigger: null, // Send immediately
    });

    // Trigger haptic feedback
    await this.triggerHapticByPattern(template.hapticPattern);
  }

  /**
   * Trigger haptic feedback by pattern name
   */
  private async triggerHapticByPattern(pattern: string): Promise<void> {
    switch (pattern) {
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'gentle':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'playful':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 100);
        break;
    }
  }

  /**
   * Schedule gentle daily check-ins
   */
  private async scheduleGentleCheckIns(plantData: PlantNotificationData): Promise<void> {
    const checkInTime = plantData.userPreferences.morningPerson ? 9 : 19; // 9 AM or 7 PM

    await Notifications.scheduleNotificationAsync({
      content: {
        title: plantData.userPreferences.language === 'ar' ? 
          `🌱 مرحباً من ${plantData.plantNameAr}` : 
          `🌱 Hello from ${plantData.plantName}`,
        body: plantData.userPreferences.language === 'ar' ?
          'كيف حالك اليوم؟ أتمنى أن نقضي وقتاً لطيفاً معاً!' :
          'How are you today? Hope we can spend some nice time together!',
        data: { plantId: plantData.plantId, type: 'gentle_checkin' },
      },
      trigger: {
        hour: checkInTime,
        minute: 0,
        repeats: true,
      },
    });
  }

  /**
   * Schedule weather-aware notifications
   */
  private async scheduleWeatherAwareNotifications(plantData: PlantNotificationData): Promise<void> {
    // This would integrate with a weather API
    // For now, we'll schedule based on typical Cairo patterns
    
    // Hot summer day notification (June-September)
    const now = new Date();
    if (now.getMonth() >= 5 && now.getMonth() <= 8) { // June to September
      await Notifications.scheduleNotificationAsync({
        content: {
          title: plantData.userPreferences.language === 'ar' ? 
            '☀️ تحذير حرارة الصيف' : 
            '☀️ Summer Heat Alert',
          body: plantData.userPreferences.language === 'ar' ?
            'صيف القاهرة حار! تأكد من أن نباتك في مكان بارد ومروي جيداً' :
            'Cairo summer is hot! Make sure your plant is in a cool spot and well watered',
          data: { plantId: plantData.plantId, type: 'weather_alert' },
        },
        trigger: {
          hour: 11, // 11 AM when heat starts building up
          minute: 0,
          repeats: true,
        },
      });
    }
  }

  /**
   * Schedule recommendation notification
   */
  private async scheduleRecommendationNotification(
    plantData: PlantNotificationData,
    recommendation: any
  ): Promise<void> {
    let triggerTime;
    const now = new Date();

    switch (recommendation.urgency) {
      case 'critical':
        triggerTime = { seconds: 5 }; // Almost immediately
        break;
      case 'high':
        triggerTime = { minutes: 30 };
        break;
      case 'medium':
        triggerTime = { hours: 2 };
        break;
      case 'low':
      default:
        triggerTime = { hours: 24 };
        break;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: plantData.userPreferences.language === 'ar' ? 
          recommendation.titleAr : recommendation.title,
        body: plantData.userPreferences.language === 'ar' ? 
          recommendation.messageAr : recommendation.message,
        categoryIdentifier: 'plant_recommendation',
        data: { 
          plantId: plantData.plantId, 
          recommendationType: recommendation.type,
          urgency: recommendation.urgency
        },
      },
      trigger: triggerTime,
    });

    // Store notification ID for later cancellation
    this.scheduledNotifications.set(`${plantData.plantId}_${recommendation.type}`, notificationId);
  }

  /**
   * Cancel all notifications for a plant
   */
  private async cancelPlantNotifications(plantId: string): Promise<void> {
    const keysToRemove: string[] = [];
    
    for (const [key, notificationId] of this.scheduledNotifications.entries()) {
      if (key.startsWith(plantId)) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.scheduledNotifications.delete(key));
  }

  /**
   * Snooze notification for specified hours
   */
  private async snoozeNotification(plantId: string, hours: number): Promise<void> {
    // Implement snooze logic
    console.log(`Snoozing notifications for plant ${plantId} for ${hours} hours`);
  }
}

export default SmartNotificationSystem.getInstance();