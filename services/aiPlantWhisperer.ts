/**
 * AI Plant Whisperer - Revolutionary Plant Intelligence System
 * "Think Different" - AI that truly understands your plants
 * Personal plant assistant with personality and Cairo-specific knowledge
 */

export interface PlantPersonality {
  name: string;
  nameAr: string;
  personality: 'cheerful' | 'wise' | 'dramatic' | 'calm' | 'playful';
  avatar: string;
  characteristics: string[];
  cairoTips: string[];
}

export interface PlantRecommendation {
  type: 'watering' | 'lighting' | 'nutrition' | 'positioning' | 'pruning' | 'emergency';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  action: string;
  actionAr: string;
  confidence: number;
  reasoning: string;
  cairoSpecific: boolean;
}

export interface PlantHealthPrediction {
  currentHealth: number; // 0-100
  predictedHealth: number; // 0-100 in 7 days
  riskFactors: string[];
  opportunities: string[];
  timeline: {
    day: number;
    health: number;
    events: string[];
  }[];
}

export interface CairoEnvironmentData {
  temperature: number;
  humidity: number;
  lightHours: number;
  season: 'winter' | 'spring' | 'summer' | 'autumn';
  dustLevel: 'low' | 'medium' | 'high';
  airQuality: number;
}

class AIPlantWhisperer {
  private plantPersonalities: Record<string, PlantPersonality> = {
    'golden_pothos': {
      name: 'Golden Pothos',
      nameAr: 'البوتس الذهبي',
      personality: 'cheerful',
      avatar: '🌿✨',
      characteristics: ['Forgiving', 'Fast-growing', 'Air-purifying', 'Low-maintenance'],
      cairoTips: [
        'Loves Cairo\'s bright indirect light',
        'Appreciates extra humidity during summer',
        'Great for dusty Cairo apartments - naturally air-purifying'
      ]
    },
    'snake_plant': {
      name: 'Snake Plant',
      nameAr: 'نبات الأفعى',
      personality: 'wise',
      avatar: '🐍🌱',
      characteristics: ['Drought-tolerant', 'Night oxygen producer', 'Architectural', 'Nearly indestructible'],
      cairoTips: [
        'Perfect for Cairo\'s dry climate',
        'Thrives in air-conditioned rooms',
        'Handles dust and neglect like a champion'
      ]
    },
    'aloe_vera': {
      name: 'Aloe Vera',
      nameAr: 'الصبار',
      personality: 'calm',
      avatar: '🌵💚',
      characteristics: ['Medicinal', 'Succulent', 'Heat-tolerant', 'Multi-purpose'],
      cairoTips: [
        'Natural remedy for Cairo\'s harsh sun',
        'Stores water for hot Egyptian summers',
        'Traditional Egyptian plant - grandmother approved!'
      ]
    }
  };

  private cairoEnvironmentData: CairoEnvironmentData = {
    temperature: 28, // Current Cairo temp
    humidity: 45,
    lightHours: 11,
    season: 'summer',
    dustLevel: 'high',
    airQuality: 65
  };

  /**
   * Generate AI-powered plant recommendations
   */
  async generateRecommendations(
    plantType: string,
    lastWatered: Date,
    healthStatus: 'healthy' | 'warning' | 'critical',
    userBehavior: {
      wateringFrequency: number; // days
      careConsistency: number; // 0-100
      responseToAlerts: number; // 0-100
    }
  ): Promise<PlantRecommendation[]> {
    const personality = this.plantPersonalities[plantType] || this.plantPersonalities['golden_pothos'];
    const recommendations: PlantRecommendation[] = [];

    // AI Analysis: Water needs
    const daysSinceWatered = Math.floor((Date.now() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceWatered > 7) {
      recommendations.push({
        type: 'watering',
        urgency: daysSinceWatered > 14 ? 'critical' : 'high',
        title: `${personality.name} is thirsty!`,
        titleAr: `${personality.nameAr} عطشان!`,
        message: this.generatePersonalizedMessage(personality, 'thirsty'),
        messageAr: 'نباتك يحتاج الماء الآن - التربة جافة جداً',
        action: 'Water now',
        actionAr: 'اسق النبات الآن',
        confidence: 95,
        reasoning: `Cairo's dry climate (${this.cairoEnvironmentData.humidity}% humidity) increases water needs`,
        cairoSpecific: true
      });
    }

    // AI Analysis: Cairo dust protection
    if (this.cairoEnvironmentData.dustLevel === 'high') {
      recommendations.push({
        type: 'positioning',
        urgency: 'low',
        title: 'Dust protection needed',
        titleAr: 'حماية من الغبار مطلوبة',
        message: 'Cairo\'s dust is blocking your plant\'s ability to photosynthesize effectively',
        messageAr: 'غبار القاهرة يمنع النبات من التمثيل الضوئي بفعالية',
        action: 'Wipe leaves gently',
        actionAr: 'امسح الأوراق برفق',
        confidence: 88,
        reasoning: 'High dust levels detected in Cairo environment',
        cairoSpecific: true
      });
    }

    // AI Analysis: Seasonal care
    if (this.cairoEnvironmentData.season === 'summer' && this.cairoEnvironmentData.temperature > 30) {
      recommendations.push({
        type: 'positioning',
        urgency: 'medium',
        title: 'Hot Cairo summer protection',
        titleAr: 'حماية من حرارة صيف القاهرة',
        message: 'Move away from direct afternoon sun - Cairo summers can be harsh',
        messageAr: 'ابعد النبات عن شمس العصر المباشرة - صيف القاهرة قاس',
        action: 'Relocate to cooler spot',
        actionAr: 'انقل لمكان أبرد',
        confidence: 92,
        reasoning: `Current temperature ${this.cairoEnvironmentData.temperature}°C exceeds optimal range`,
        cairoSpecific: true
      });
    }

    // AI Analysis: Predictive care based on user behavior
    if (userBehavior.careConsistency < 60) {
      recommendations.push({
        type: 'watering',
        urgency: 'low',
        title: 'Smart reminder suggestion',
        titleAr: 'اقتراح تذكير ذكي',
        message: this.generatePersonalizedMessage(personality, 'consistency'),
        messageAr: 'لنضع جدول عناية منتظم لنبتتك',
        action: 'Set up smart schedule',
        actionAr: 'ضع جدول ذكي',
        confidence: 78,
        reasoning: 'User behavior analysis suggests irregular care patterns',
        cairoSpecific: false
      });
    }

    return recommendations.sort((a, b) => this.getUrgencyValue(b.urgency) - this.getUrgencyValue(a.urgency));
  }

  /**
   * Predict plant health trajectory using AI
   */
  async predictPlantHealth(
    plantType: string,
    currentHealth: number,
    careHistory: Array<{ date: Date; action: string; result: 'positive' | 'neutral' | 'negative' }>,
    environmentalFactors: Partial<CairoEnvironmentData> = {}
  ): Promise<PlantHealthPrediction> {
    const env = { ...this.cairoEnvironmentData, ...environmentalFactors };
    
    // AI prediction algorithm (simplified)
    const healthTrend = this.calculateHealthTrend(careHistory);
    const environmentalImpact = this.calculateEnvironmentalImpact(env);
    
    const predictedHealth = Math.max(0, Math.min(100, 
      currentHealth + healthTrend + environmentalImpact
    ));

    const riskFactors = [];
    const opportunities = [];

    // Risk assessment
    if (env.dustLevel === 'high') {
      riskFactors.push('High dust levels in Cairo air');
    }
    if (env.temperature > 35) {
      riskFactors.push('Extreme heat conditions');
    }
    if (careHistory.filter(h => h.result === 'negative').length > 3) {
      riskFactors.push('Recent care inconsistencies detected');
    }

    // Opportunity identification
    if (env.humidity < 40) {
      opportunities.push('Increase humidity for better growth');
    }
    if (env.lightHours > 10) {
      opportunities.push('Excellent light conditions for photosynthesis');
    }

    // Generate 7-day timeline
    const timeline = this.generateHealthTimeline(currentHealth, predictedHealth);

    return {
      currentHealth,
      predictedHealth,
      riskFactors,
      opportunities,
      timeline
    };
  }

  /**
   * Generate conversational plant chat responses
   */
  async chatWithPlant(
    plantType: string,
    userMessage: string,
    context: {
      plantHealth: number;
      lastWatered: Date;
      userName: string;
    }
  ): Promise<{ response: string; responseAr: string; emotion: string }> {
    const personality = this.plantPersonalities[plantType] || this.plantPersonalities['golden_pothos'];
    const daysSinceWatered = Math.floor((Date.now() - context.lastWatered.getTime()) / (1000 * 60 * 60 * 24));

    // AI Chat Response Generation
    const responses = this.generateChatResponse(personality, userMessage, context, daysSinceWatered);
    
    return responses;
  }

  /**
   * Smart scheduling based on Cairo conditions and user behavior
   */
  async generateSmartSchedule(
    plantType: string,
    userPreferences: {
      morningPerson: boolean;
      weekendCare: boolean;
      reminderStyle: 'gentle' | 'persistent' | 'minimal';
    }
  ): Promise<{
    watering: { days: number[]; time: string; message: string };
    inspection: { days: number[]; time: string; message: string };
    fertilizing: { frequency: 'weekly' | 'monthly' | 'seasonal'; message: string };
  }> {
    const personality = this.plantPersonalities[plantType] || this.plantPersonalities['golden_pothos'];
    
    // AI-optimized schedule based on plant needs and Cairo climate
    const wateringDays = this.calculateOptimalWateringDays(plantType, this.cairoEnvironmentData);
    const inspectionDays = [0, 3, 6]; // Sunday, Wednesday, Saturday
    
    return {
      watering: {
        days: wateringDays,
        time: userPreferences.morningPerson ? '08:00' : '18:00',
        message: `Time to water your ${personality.name}! Cairo's dry air means it needs regular hydration.`
      },
      inspection: {
        days: inspectionDays,
        time: userPreferences.morningPerson ? '09:00' : '19:00',
        message: `Quick plant check! Look for dust on leaves (common in Cairo) and soil moisture.`
      },
      fertilizing: {
        frequency: 'monthly',
        message: `Monthly feeding for your ${personality.name} - Egyptian soil benefits from regular nutrients.`
      }
    };
  }

  // Helper methods
  private generatePersonalizedMessage(personality: PlantPersonality, context: string): string {
    const messages = {
      thirsty: {
        cheerful: `Hi there! Your ${personality.name} is feeling a bit parched and would love some water! 🌿💧`,
        wise: `The ancient wisdom of your ${personality.name} says: "Water is life, especially in Cairo's dry climate."`,
        dramatic: `Your ${personality.name} is dramatically wilting! "Water... water... I fade away!" 🎭`,
        calm: `Your peaceful ${personality.name} gently reminds you it's watering time. No rush, but soon would be nice.`,
        playful: `Your playful ${personality.name} is doing the "thirsty dance" - time for some H2O fun! 💃🌱`
      },
      consistency: {
        cheerful: `Your ${personality.name} loves routine! How about we set up a happy care schedule together? 😊`,
        wise: `Consistency is the key to growth, both for plants and their caretakers. Let wisdom guide your schedule.`,
        dramatic: `Your ${personality.name} needs DRAMA-FREE regular care! No more soap opera watering, please! 🎭`,
        calm: `A gentle routine brings peace to both you and your ${personality.name}. Shall we create one?`,
        playful: `Let's make plant care a fun game! Your ${personality.name} loves predictable play dates! 🎮`
      }
    };

    return messages[context][personality.personality] || messages[context].cheerful;
  }

  private generateChatResponse(
    personality: PlantPersonality,
    userMessage: string,
    context: any,
    daysSinceWatered: number
  ): { response: string; responseAr: string; emotion: string } {
    // Simple AI chat logic (in real implementation, this would use more sophisticated NLP)
    const isThirsty = daysSinceWatered > 5;
    const isHealthy = context.plantHealth > 70;

    if (userMessage.toLowerCase().includes('water')) {
      if (isThirsty) {
        return {
          response: `Yes! I'd love some water, ${context.userName}! My soil is getting quite dry in this Cairo heat. 💧`,
          responseAr: `نعم! أريد بعض الماء يا ${context.userName}! تربتي جافة جداً في حر القاهرة هذا 💧`,
          emotion: 'thirsty'
        };
      } else {
        return {
          response: `I'm actually well-hydrated right now, thanks! Check back in a few days. 😊`,
          responseAr: `أنا مروي جيداً الآن، شكراً! تحقق مني بعد بضعة أيام 😊`,
          emotion: 'content'
        };
      }
    }

    if (userMessage.toLowerCase().includes('health') || userMessage.toLowerCase().includes('feel')) {
      if (isHealthy) {
        return {
          response: `I'm feeling fantastic! Cairo's bright light and your care are perfect for me! 🌟`,
          responseAr: `أشعر بالروعة! ضوء القاهرة المشرق وعنايتك مثاليان لي! 🌟`,
          emotion: 'happy'
        };
      } else {
        return {
          response: `I could use a little TLC. Maybe check my water and dust my leaves? Cairo can be dusty! 😔`,
          responseAr: `يمكنني أن أستخدم القليل من الحب. ربما تحقق من مائي وامسح أوراقي؟ القاهرة قد تكون مغبرة! 😔`,
          emotion: 'needs_care'
        };
      }
    }

    // Default friendly response
    return {
      response: `Hello ${context.userName}! I'm your ${personality.name}, and I love chatting with you! 🌱💚`,
      responseAr: `مرحباً ${context.userName}! أنا ${personality.nameAr}، وأحب الدردشة معك! 🌱💚`,
      emotion: 'friendly'
    };
  }

  private calculateHealthTrend(careHistory: Array<{ date: Date; action: string; result: 'positive' | 'neutral' | 'negative' }>): number {
    if (careHistory.length === 0) return 0;

    const recent = careHistory.slice(-10); // Last 10 actions
    const positive = recent.filter(h => h.result === 'positive').length;
    const negative = recent.filter(h => h.result === 'negative').length;

    return (positive - negative) * 2; // Health points
  }

  private calculateEnvironmentalImpact(env: CairoEnvironmentData): number {
    let impact = 0;

    // Temperature impact
    if (env.temperature > 35) impact -= 5;
    else if (env.temperature < 15) impact -= 3;
    else if (env.temperature >= 20 && env.temperature <= 28) impact += 2;

    // Humidity impact
    if (env.humidity < 30) impact -= 3;
    else if (env.humidity > 60) impact += 2;

    // Dust impact
    if (env.dustLevel === 'high') impact -= 2;

    return impact;
  }

  private generateHealthTimeline(currentHealth: number, predictedHealth: number): Array<{ day: number; health: number; events: string[] }> {
    const timeline = [];
    const healthDiff = predictedHealth - currentHealth;
    const dailyChange = healthDiff / 7;

    for (let day = 0; day < 7; day++) {
      const health = Math.round(currentHealth + (dailyChange * day));
      const events = [];

      if (day === 2) events.push('Dust cleaning recommended');
      if (day === 4) events.push('Watering scheduled');
      if (day === 6) events.push('Weekly health check');

      timeline.push({ day, health, events });
    }

    return timeline;
  }

  private calculateOptimalWateringDays(plantType: string, env: CairoEnvironmentData): number[] {
    // Different plants have different needs in Cairo's climate
    const baseSchedules = {
      'golden_pothos': [1, 4], // Monday, Thursday
      'snake_plant': [0], // Sunday (drought tolerant)
      'aloe_vera': [6], // Saturday (succulent)
    };

    let schedule = baseSchedules[plantType] || baseSchedules['golden_pothos'];

    // Adjust for Cairo's extreme conditions
    if (env.temperature > 30 && env.humidity < 40) {
      // Add extra watering day for hot, dry conditions
      schedule = [...schedule, 3]; // Add Wednesday
    }

    return schedule.sort();
  }

  private getUrgencyValue(urgency: string): number {
    switch (urgency) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }
}

export default new AIPlantWhisperer();