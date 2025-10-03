// Basic Jest setup for testing

// Global variables
global.__DEV__ = true;

// Mock react-native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: {
      ...RN.Platform,
      OS: 'ios',
      select: jest.fn((obj) => obj.ios),
    },
  };
});

// Mock @react-navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn(() => true),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }: any) => children,
}));

// Mock React Native Safe Area Context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  SafeAreaProvider: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock Expo Linear Gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children,
}));

// Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}));

// Mock expo modules
jest.mock('expo-camera', () => ({
  Camera: {
    Constants: {
      Type: {
        back: 0,
        front: 1,
      },
    },
    requestCameraPermissionsAsync: jest.fn(() => 
      Promise.resolve({ status: 'granted' })
    ),
  },
  useCameraPermissions: jest.fn(() => [
    { granted: true, canAskAgain: true, status: 'granted' },
    jest.fn(() => Promise.resolve({ granted: true, status: 'granted' }))
  ]),
  CameraView: 'CameraView',
  CameraType: { back: 'back', front: 'front' },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => 
    Promise.resolve({ status: 'granted' })
  ),
  launchImageLibraryAsync: jest.fn(() => 
    Promise.resolve({ 
      cancelled: false, 
      assets: [{ uri: 'mock-image-uri' }] 
    })
  ),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(() => 
    Promise.resolve({
      uri: 'mock-manipulated-uri',
      width: 500,
      height: 500
    })
  ),
  ImageFormat: {
    JPEG: 'jpeg',
    PNG: 'png'
  },
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png'
  }
}));

jest.mock('expo-localization', () => ({
  locale: 'en-US',
  isRTL: false,
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithOAuth: jest.fn(() => Promise.resolve({ data: null, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  })),
}));

// Mock i18next with proper Arabic translations for testing
const mockTranslations: Record<string, string> = {
  'home.guestWelcome': '🌿 مرحباً بك في لوتس',
  'auth.guestMode': 'وضع الضيف',
  'home.careBasics': 'أساسيات العناية',
  'home.weatherTitle': 'طقس القاهرة',
  'home.quickActions': 'إجراءات سريعة',
  'home.cairoTips': 'نصائح القاهرة',
  'scan.title': 'مسح النبات',
  'plants.title': 'نباتاتي',
  'auth.subtitle': 'اعتني بنباتاتك بذكاء',
  'common.retry': 'إعادة المحاولة',
  'tips.cairo.seasonal': 'نصائح موسمية للقاهرة',
  'tips.cairo.summer': 'صيف القاهرة: اسقي أكتر في الشهور الحارة',
  'tips.cairo.winter': 'شتا القاهرة: قلل الري في الشهور الباردة',
  'نصائح العناية': 'نصائح العناية',
  'الري': 'الري',
  'الإضاءة': 'الإضاءة',
  'الرطوبة': 'الرطوبة',
  'نصائح موسمية': 'نصائح موسمية',
  'متابعة كضيف': 'متابعة كضيف',
  'تسجيل الدخول بـ Apple': 'تسجيل الدخول بـ Apple',
  'تسجيل الدخول بـ Google': 'تسجيل الدخول بـ Google',
  'اكتشف نباتاتك': 'اكتشف نباتاتك',
  'جدولة العناية': 'جدولة العناية',
  'نصائح القاهرة': 'نصائح القاهرة',
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => mockTranslations[key] || key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'ar',
      dir: () => 'rtl',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

// Global test timeout
jest.setTimeout(10000);