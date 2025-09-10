/**
 * Onboarding Data Configuration
 * Culturally appropriate options for Egyptian/MENA users
 */
import { OnboardingStep, PlantInterest, PlantGoal } from '../types/onboarding';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    titleEn: 'Welcome to Lotus! 🌿',
    titleAr: 'مرحباً بك في لوتس! 🌿',
    subtitleEn: 'Let\'s personalize your plant care journey',
    subtitleAr: 'دعنا نخصص رحلتك في العناية بالنباتات',
    type: 'confirmation',
    required: true,
    illustration: 'welcome-lotus',
    tips: {
      en: 'This will take just 2 minutes and help us give you the best plant recommendations',
      ar: 'سيستغرق هذا دقيقتين فقط وسيساعدنا في تقديم أفضل توصيات النباتات لك'
    }
  },
  {
    id: 'experience',
    titleEn: 'What\'s your plant experience?',
    titleAr: 'ما مستوى خبرتك في النباتات؟',
    subtitleEn: 'Help us match you with the right plants',
    subtitleAr: 'ساعدنا في اختيار النباتات المناسبة لك',
    type: 'selection',
    required: true,
    multiSelect: false,
    illustration: 'experience-levels',
    options: [
      {
        id: 'beginner',
        labelEn: 'Beginner 🌱',
        labelAr: 'مبتدئ 🌱',
        icon: 'seedling',
        description: {
          en: 'New to plants, want easy-care options',
          ar: 'جديد على النباتات، أريد خيارات سهلة العناية'
        },
        recommended: true
      },
      {
        id: 'intermediate',
        labelEn: 'Some Experience 🪴',
        labelAr: 'بعض الخبرة 🪴',
        icon: 'potted-plant',
        description: {
          en: 'I\'ve kept plants alive before',
          ar: 'لدي خبرة في الحفاظ على النباتات'
        }
      },
      {
        id: 'expert',
        labelEn: 'Plant Parent 🌳',
        labelAr: 'خبير نباتات 🌳',
        icon: 'tree',
        description: {
          en: 'Experienced with various plant types',
          ar: 'لدي خبرة واسعة مع أنواع مختلفة من النباتات'
        }
      }
    ]
  },
  {
    id: 'space',
    titleEn: 'Where will your plants live?',
    titleAr: 'أين ستعيش نباتاتك؟',
    subtitleEn: 'This helps us recommend suitable plants',
    subtitleAr: 'هذا يساعدنا في اقتراح النباتات المناسبة',
    type: 'selection',
    required: true,
    multiSelect: true,
    illustration: 'living-spaces',
    options: [
      {
        id: 'apartment',
        labelEn: 'Apartment',
        labelAr: 'شقة',
        icon: 'apartment',
        description: {
          en: 'Limited space, indoor focus',
          ar: 'مساحة محدودة، تركيز داخلي'
        }
      },
      {
        id: 'house',
        labelEn: 'House',
        labelAr: 'منزل',
        icon: 'house',
        description: {
          en: 'Indoor and outdoor options',
          ar: 'خيارات داخلية وخارجية'
        }
      },
      {
        id: 'office',
        labelEn: 'Office',
        labelAr: 'مكتب',
        icon: 'office-building',
        description: {
          en: 'Professional environment',
          ar: 'بيئة مهنية'
        }
      },
      {
        id: 'balcony',
        labelEn: 'Balcony/Terrace',
        labelAr: 'شرفة/تراس',
        icon: 'balcony',
        description: {
          en: 'Outdoor space with sun exposure',
          ar: 'مساحة خارجية مع التعرض للشمس'
        }
      }
    ]
  },
  {
    id: 'light',
    titleEn: 'How much natural light do you have?',
    titleAr: 'كم من الضوء الطبيعي لديك؟',
    subtitleEn: 'Light is crucial for plant health',
    subtitleAr: 'الضوء أساسي لصحة النباتات',
    type: 'selection',
    required: true,
    multiSelect: false,
    illustration: 'light-conditions',
    options: [
      {
        id: 'low',
        labelEn: 'Low Light ☁️',
        labelAr: 'إضاءة منخفضة ☁️',
        icon: 'cloud',
        description: {
          en: 'North-facing windows, limited direct sun',
          ar: 'نوافذ شمالية، شمس مباشرة محدودة'
        }
      },
      {
        id: 'medium',
        labelEn: 'Medium Light ⛅',
        labelAr: 'إضاءة متوسطة ⛅',
        icon: 'partly-sunny',
        description: {
          en: 'East or west windows, some direct sun',
          ar: 'نوافذ شرقية أو غربية، بعض الشمس المباشرة'
        },
        recommended: true
      },
      {
        id: 'high',
        labelEn: 'Bright Light ☀️',
        labelAr: 'إضاءة ساطعة ☀️',
        icon: 'sunny',
        description: {
          en: 'South-facing windows, direct sunlight',
          ar: 'نوافذ جنوبية، ضوء الشمس المباشر'
        }
      },
      {
        id: 'mixed',
        labelEn: 'Mixed Conditions 🌤️',
        labelAr: 'ظروف متنوعة 🌤️',
        icon: 'partly-cloudy',
        description: {
          en: 'Different rooms with varying light',
          ar: 'غرف مختلفة مع إضاءة متنوعة'
        }
      }
    ]
  },
  {
    id: 'interests',
    titleEn: 'What plants interest you most?',
    titleAr: 'ما النباتات التي تثير اهتمامك أكثر؟',
    subtitleEn: 'Choose any that appeal to you',
    subtitleAr: 'اختر أي منها يعجبك',
    type: 'selection',
    required: false,
    multiSelect: true,
    illustration: 'plant-types',
    options: [
      {
        id: 'indoor-green',
        labelEn: 'Indoor Greenery',
        labelAr: 'نباتات خضراء داخلية',
        icon: 'leaf',
        description: {
          en: 'Leafy plants that purify air',
          ar: 'نباتات ورقية تنقي الهواء'
        }
      },
      {
        id: 'succulents',
        labelEn: 'Succulents & Cacti',
        labelAr: 'عصاريات وصبار',
        icon: 'cactus',
        description: {
          en: 'Low-maintenance, drought-tolerant',
          ar: 'قليلة الصيانة، تتحمل الجفاف'
        },
        recommended: true
      },
      {
        id: 'flowering',
        labelEn: 'Flowering Plants',
        labelAr: 'نباتات مزهرة',
        icon: 'flower',
        description: {
          en: 'Beautiful blooms and colors',
          ar: 'أزهار جميلة وألوان رائعة'
        }
      },
      {
        id: 'herbs',
        labelEn: 'Herbs & Edibles',
        labelAr: 'أعشاب وخضروات',
        icon: 'herb',
        description: {
          en: 'Fresh herbs for cooking',
          ar: 'أعشاب طازجة للطبخ'
        }
      },
      {
        id: 'hanging',
        labelEn: 'Hanging Plants',
        labelAr: 'نباتات معلقة',
        icon: 'hanging-plant',
        description: {
          en: 'Trailing and cascading varieties',
          ar: 'أصناف متدلية ومتسلقة'
        }
      },
      {
        id: 'large-plants',
        labelEn: 'Statement Plants',
        labelAr: 'نباتات كبيرة',
        icon: 'palm-tree',
        description: {
          en: 'Large plants as room features',
          ar: 'نباتات كبيرة كميزة للغرفة'
        }
      }
    ]
  },
  {
    id: 'goals',
    titleEn: 'What are your plant goals?',
    titleAr: 'ما أهدافك مع النباتات؟',
    subtitleEn: 'We\'ll help you achieve them',
    subtitleAr: 'سنساعدك في تحقيقها',
    type: 'selection',
    required: false,
    multiSelect: true,
    illustration: 'plant-goals',
    options: [
      {
        id: 'air-purify',
        labelEn: 'Purify Air',
        labelAr: 'تنقية الهواء',
        icon: 'air-purifier',
        description: {
          en: 'Improve indoor air quality',
          ar: 'تحسين جودة الهواء الداخلي'
        }
      },
      {
        id: 'stress-relief',
        labelEn: 'Reduce Stress',
        labelAr: 'تقليل التوتر',
        icon: 'meditation',
        description: {
          en: 'Create a calming environment',
          ar: 'خلق بيئة هادئة ومريحة'
        },
        recommended: true
      },
      {
        id: 'decoration',
        labelEn: 'Home Decoration',
        labelAr: 'تزيين المنزل',
        icon: 'decoration',
        description: {
          en: 'Beautiful natural decor',
          ar: 'ديكور طبيعي جميل'
        }
      },
      {
        id: 'learning',
        labelEn: 'Learn Plant Care',
        labelAr: 'تعلم العناية بالنباتات',
        icon: 'graduation-cap',
        description: {
          en: 'Develop gardening skills',
          ar: 'تطوير مهارات البستنة'
        }
      },
      {
        id: 'cooking',
        labelEn: 'Fresh Herbs for Cooking',
        labelAr: 'أعشاب طازجة للطبخ',
        icon: 'chef-hat',
        description: {
          en: 'Grow ingredients for meals',
          ar: 'زراعة مكونات للوجبات'
        }
      }
    ]
  }
];

export const EGYPTIAN_PLANT_RECOMMENDATIONS: PlantInterest[] = [
  {
    id: 'pothos',
    nameEn: 'Golden Pothos',
    nameAr: 'بوتس ذهبي',
    icon: 'leaf',
    category: 'indoor'
  },
  {
    id: 'snake-plant',
    nameEn: 'Snake Plant',
    nameAr: 'نبات الثعبان',
    icon: 'snake-plant',
    category: 'succulent'
  },
  {
    id: 'aloe-vera',
    nameEn: 'Aloe Vera',
    nameAr: 'صبار الألوة',
    icon: 'aloe',
    category: 'succulent'
  },
  {
    id: 'rubber-plant',
    nameEn: 'Rubber Plant',
    nameAr: 'نبات المطاط',
    icon: 'tree',
    category: 'indoor'
  },
  {
    id: 'mint',
    nameEn: 'Mint',
    nameAr: 'نعناع',
    icon: 'mint',
    category: 'herbs'
  },
  {
    id: 'basil',
    nameEn: 'Basil',
    nameAr: 'ريحان',
    icon: 'basil',
    category: 'herbs'
  },
  {
    id: 'jasmine',
    nameEn: 'Jasmine',
    nameAr: 'ياسمين',
    icon: 'flower',
    category: 'flowering'
  },
  {
    id: 'bougainvillea',
    nameEn: 'Bougainvillea',
    nameAr: 'جهنمية',
    icon: 'flower',
    category: 'outdoor'
  }
];