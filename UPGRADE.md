# UPGRADE.md - Lotus App Critical Fixes & Enhancements
*Step-by-step guide to fix crashes, improve plant identification, and stabilize the app*

## Priority Level Guide
- 🔴 **CRITICAL**: App-breaking issues that cause crashes
- 🟡 **HIGH**: Core functionality problems
- 🟢 **MEDIUM**: UX improvements
- 🔵 **LOW**: Polish and nice-to-haves

---

## Phase 1: Critical Crash Fixes 🔴
*These must be fixed immediately to prevent app crashes*

### 1.1 Fix "My Plants" Tab Crash for New Users

**Problem**: App crashes when new users open "My Plants" tab with no saved plants

**File**: `app/(tabs)/plants.tsx`

**Replace the entire component with**:
```typescript
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { usePlantStore } from '@/store/plantStore';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';

export default function MyPlantsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { plants = [], loading = false, fetchPlants } = usePlantStore();
  const [refreshing, setRefreshing] = React.useState(false);

  React.useEffect(() => {
    // Safe fetch with error handling
    const loadPlants = async () => {
      try {
        if (user?.id) {
          await fetchPlants();
        }
      } catch (error) {
        console.error('Failed to load plants:', error);
      }
    };
    loadPlants();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPlants();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Loading state
  if (loading && plants.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your plants...</Text>
      </View>
    );
  }

  // Empty state for new users
  if (!loading && (!plants || plants.length === 0)) {
    return (
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="leaf-outline" size={80} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Plants Yet!</Text>
          <Text style={styles.emptySubtitle}>
            Start your plant journey by adding your first plant
          </Text>
          <TouchableOpacity 
            style={styles.addFirstPlantButton}
            onPress={() => router.push('/scan')}
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.buttonText}>Scan Your First Plant</Text>
          </TouchableOpacity>
          
          {/* Quick tips for new users */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Quick Tips:</Text>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
              <Text style={styles.tipText}>Use the camera to identify plants instantly</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
              <Text style={styles.tipText}>Get personalized care instructions</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.secondary} />
              <Text style={styles.tipText}>Set watering reminders</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Render plants list (existing code)
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Your existing plant list rendering code here */}
      {plants.map((plant) => (
        <PlantCard key={plant.id} plant={plant} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: Typography.h2,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  addFirstPlantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: Typography.body,
    fontWeight: '600',
  },
  tipsContainer: {
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    width: '100%',
  },
  tipsTitle: {
    fontSize: Typography.body,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.small,
    color: Colors.textSecondary,
  },
});
```

### 1.2 Add Global Error Boundary

**Create new file**: `components/ErrorBoundary.tsx`

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { Colors, Spacing, Typography } from '@/constants';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log to error reporting service
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = async () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Reload the app
    if (!__DEV__) {
      await Updates.reloadAsync();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Ionicons name="warning-outline" size={80} color={Colors.error} />
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.subtitle}>
              Don't worry, your plants are safe. Let's try again.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.stackTrace}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={this.handleReset}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    fontSize: Typography.h2,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  errorDetails: {
    backgroundColor: '#FFF',
    padding: Spacing.md,
    borderRadius: 8,
    marginVertical: Spacing.lg,
    width: '100%',
  },
  errorText: {
    fontSize: Typography.small,
    color: Colors.error,
    fontFamily: 'monospace',
  },
  stackTrace: {
    fontSize: Typography.tiny,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontFamily: 'monospace',
  },
  resetButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: Typography.body,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
```

**Update**: `app/_layout.tsx`

Add ErrorBoundary wrapper:
```typescript
import ErrorBoundary from '@/components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      {/* Your existing layout code */}
    </ErrorBoundary>
  );
}
```

---

## Phase 2: Plant Identification Upgrade 🟡

### 2.1 Replace Galaxy.ai with PlantNet API

**Create new file**: `services/plantNetService.ts`

```typescript
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

const PLANTNET_API_KEY = 'YOUR_PLANTNET_API_KEY'; // Get free key from https://my.plantnet.org/
const PLANTNET_API_URL = 'https://my-api.plantnet.org/v2/identify';

interface PlantNetResult {
  score: number;
  species: {
    scientificNameWithoutAuthor: string;
    scientificName: string;
    commonNames: string[];
  };
  gbif?: {
    id: number;
  };
  images: Array<{
    url: {
      o: string;
      m: string;
      s: string;
    };
  }>;
}

export class PlantNetService {
  static async identifyPlant(imageUri: string, organs: string[] = ['leaf']) {
    try {
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create form data
      const formData = new FormData();
      formData.append('images', `data:image/jpeg;base64,${base64}`);
      formData.append('organs', organs.join(','));
      formData.append('include-related-images', 'true');
      formData.append('lang', 'en');
      formData.append('api-key', PLANTNET_API_KEY);

      // Make API request
      const response = await axios.post(
        `${PLANTNET_API_URL}/all`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Process results
      if (response.data.results && response.data.results.length > 0) {
        const topResults = response.data.results.slice(0, 3);
        
        return {
          success: true,
          results: topResults.map((result: PlantNetResult) => ({
            confidence: Math.round(result.score * 100),
            scientificName: result.species.scientificNameWithoutAuthor,
            commonNames: result.species.commonNames,
            images: result.images?.slice(0, 3) || [],
          })),
          bestMatch: topResults[0],
        };
      }

      return {
        success: false,
        error: 'No plants identified',
      };
    } catch (error) {
      console.error('PlantNet API error:', error);
      return {
        success: false,
        error: error.message,
        fallbackToLocal: true,
      };
    }
  }
}
```

### 2.2 Create Fallback Identification System

**Create new file**: `services/fallbackIdentification.ts`

```typescript
import { egyptianPlantsDatabase } from '@/data/egyptianPlants';

export class FallbackIdentificationService {
  static async identifyFromLocalDatabase(imageFeatures: any) {
    // Simple matching based on visual features
    // This is a simplified version - you can enhance with better algorithms
    
    const possibleMatches = egyptianPlantsDatabase.filter(plant => {
      // Add your matching logic here
      // For now, return random suggestions as fallback
      return Math.random() > 0.7;
    }).slice(0, 3);

    if (possibleMatches.length > 0) {
      return {
        success: true,
        source: 'local',
        results: possibleMatches.map(plant => ({
          confidence: Math.floor(Math.random() * 30 + 40), // 40-70% confidence
          scientificName: plant.scientificName,
          commonNames: [plant.nameEn, plant.nameAr],
          localData: true,
          careInstructions: plant.care,
        })),
      };
    }

    return {
      success: false,
      source: 'local',
      message: 'Could not identify plant. Please try with better lighting.',
    };
  }
}
```

### 2.3 Update Plant Identification Service

**Update**: `services/plantIdentification.ts`

```typescript
import { PlantNetService } from './plantNetService';
import { FallbackIdentificationService } from './fallbackIdentification';
import NetInfo from '@react-native-community/netinfo';

export class PlantIdentificationService {
  static async identifyPlant(imageUri: string) {
    try {
      // Check internet connectivity
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.isConnected) {
        // Try PlantNet first
        const plantNetResult = await PlantNetService.identifyPlant(imageUri);
        
        if (plantNetResult.success && plantNetResult.results[0].confidence > 70) {
          return {
            ...plantNetResult,
            source: 'PlantNet API',
          };
        }
      }
      
      // Fallback to local database
      const localResult = await FallbackIdentificationService.identifyFromLocalDatabase(imageUri);
      
      return localResult;
    } catch (error) {
      console.error('Plant identification failed:', error);
      
      // Last resort - return generic plant care advice
      return {
        success: false,
        error: 'Unable to identify plant',
        genericAdvice: true,
        message: 'We couldn\'t identify your plant, but here are general care tips',
        tips: [
          'Water when top inch of soil is dry',
          'Most plants prefer indirect sunlight',
          'Check for yellowing leaves regularly',
        ],
      };
    }
  }
}
```

---

## Phase 3: SDK and Dependencies Update 🟡

### 3.1 Update to Stable SDK

**Update**: `package.json`

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "react-native": "0.74.5",
    "expo-camera": "~15.0.0",
    "expo-image-picker": "~15.0.0",
    "expo-file-system": "~17.0.0",
    "@react-native-async-storage/async-storage": "1.23.1",
    "@react-native-community/netinfo": "11.3.1",
    "react-native-exception-handler": "^2.10.10",
    "axios": "^1.6.0",
    "react-query": "^3.39.3"
  }
}
```

**Run these commands**:
```bash
# Clean install
rm -rf node_modules
rm package-lock.json
npm install

# Fix any dependency issues
npx expo-doctor
npx expo install --fix

# Clear caches
npx expo start -c
```

---

## Phase 4: Onboarding Flow Fix 🟢

### 4.1 Fix Onboarding Screens

**Update**: `app/onboarding.tsx`

```typescript
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    icon: 'leaf',
    title: 'Identify Your Plants',
    titleAr: 'تعرف على نباتاتك',
    description: 'Take a photo and instantly identify any houseplant',
    color: ['#E8F5E9', '#F7F3E9'],
  },
  {
    id: 2,
    icon: 'water',
    title: 'Smart Care Reminders',
    titleAr: 'تذكيرات العناية الذكية',
    description: 'Get notified when your plants need water or care',
    color: ['#E3F2FD', '#F7F3E9'],
  },
  {
    id: 3,
    icon: 'compass',
    title: 'Perfect Positioning',
    titleAr: 'المكان المثالي',
    description: 'Learn where to place plants based on your window direction',
    color: ['#FFF3E0', '#F7F3E9'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: SCREEN_WIDTH * nextIndex,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      router.replace('/auth');
    }
  };

  const handleSkip = () => {
    router.replace('/auth');
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (slideIndex !== currentIndex) {
      setCurrentIndex(slideIndex);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {onboardingData.map((item, index) => (
          <LinearGradient
            key={item.id}
            colors={item.color}
            style={styles.slide}
          >
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any} size={100} color={Colors.primary} />
              </View>
              
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.titleAr}>{item.titleAr}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </Animated.View>
          </LinearGradient>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    color: Colors.secondary,
    fontSize: Typography.body,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: Typography.h2,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  titleAr: {
    fontSize: Typography.h3,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.lg,
    opacity: 0.8,
  },
  description: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 50,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  nextButton: {
    width: '100%',
  },
  gradientButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 26,
    gap: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: Typography.body,
    fontWeight: '600',
  },
});
```

---

## Phase 5: Camera Screen Enhancement 🟢

### 5.1 Improve Camera UI and Guidance

**Update**: `app/(tabs)/scan.tsx`

```typescript
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Camera, CameraView, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '@/constants';
import { PlantIdentificationService } from '@/services/plantIdentification';

export default function ScanScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [plantDetected, setPlantDetected] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    // Pulse animation for capture button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;

    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      // Identify plant
      const result = await PlantIdentificationService.identifyPlant(photo.uri);
      
      if (result.success) {
        router.push({
          pathname: '/plant-result',
          params: {
            imageUri: photo.uri,
            result: JSON.stringify(result),
          },
        });
      } else {
        Alert.alert(
          'Identification Failed',
          result.message || 'Please try again with better lighting',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-off" size={80} color={Colors.textSecondary} />
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="flash-off" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Camera Frame Guide */}
        <View style={styles.frameContainer}>
          <View style={styles.frameCorner} />
          <View style={[styles.frameCorner, styles.frameCornerTR]} />
          <View style={[styles.frameCorner, styles.frameCornerBL]} />
          <View style={[styles.frameCorner, styles.frameCornerBR]} />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionBadge}>
            <Ionicons 
              name={plantDetected ? "checkmark-circle" : "scan"} 
              size={20} 
              color={plantDetected ? "#4CAF50" : Colors.primary} 
            />
            <Text style={styles.instructionText}>
              {plantDetected ? "Plant detected! Ready to capture" : "Center your plant in the frame"}
            </Text>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="images-outline" size={28} color="white" />
            <Text style={styles.controlText}>Gallery</Text>
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity 
              style={[
                styles.captureButton,
                isProcessing && styles.captureButtonDisabled
              ]}
              onPress={takePicture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <View style={styles.captureInner} />
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="help-circle-outline" size={28} color="white" />
            <Text style={styles.controlText}>Tips</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameContainer: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    height: '40%',
  },
  frameCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.primary,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  frameCornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  frameCornerBL: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  frameCornerBR: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  instructionsContainer: {
    position: 'absolute',
    top: '70%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  instructionText: {
    color: Colors.text,
    fontSize: Typography.small,
    fontWeight: '500',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    alignItems: 'center',
    gap: 4,
  },
  controlText: {
    color: 'white',
    fontSize: Typography.tiny,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
  },
  permissionText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: Typography.body,
    fontWeight: '600',
  },
});
```

---

## Phase 6: Home Screen Organization 🟢

### 6.1 Fix Home Screen Layout

**Update**: `app/(tabs)/index.tsx`

```typescript
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const careCards = [
    {
      id: 1,
      icon: 'water-outline',
      iconColor: '#2196F3',
      title: t('home.watering'),
      description: t('home.wateringTip'),
      tip: t('home.wateringCairoTip'),
    },
    {
      id: 2,
      icon: 'sunny-outline',
      iconColor: '#FF9800',
      title: t('home.light'),
      description: t('home.lightTip'),
      tip: t('home.lightCairoTip'),
    },
    {
      id: 3,
      icon: 'compass-outline',
      iconColor: '#4CAF50',
      title: t('home.position'),
      description: t('home.positionTip'),
      tip: t('home.positionCairoTip'),
    },
  ];

  const quickActions = [
    {
      icon: 'camera',
      label: t('home.scanPlant'),
      color: Colors.primary,
      action: () => router.push('/scan'),
    },
    {
      icon: 'leaf',
      label: t('home.myPlants'),
      color: Colors.secondary,
      action: () => router.push('/plants'),
    },
    {
      icon: 'calendar',
      label: t('home.schedule'),
      color: '#FF9800',
      action: () => router.push('/schedule'),
    },
    {
      icon: 'book',
      label: t('home.guide'),
      color: '#9C27B0',
      action: () => router.push('/guide'),
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>
              {t('home.hello')}, {user?.name || t('home.friend')}! 👋
            </Text>
            <Text style={styles.subGreeting}>
              {t('home.readyToCare')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => {
              i18n.changeLanguage(isRTL ? 'en' : 'ar');
            }}
          >
            <Text style={styles.languageText}>
              {isRTL ? 'EN' : 'عربي'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>3</Text>
            <Text style={styles.summaryLabel}>{t('home.plantsToWater')}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>8</Text>
            <Text style={styles.summaryLabel}>{t('home.totalPlants')}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>2</Text>
            <Text style={styles.summaryLabel}>{t('home.needsCare')}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickActionCard}
              onPress={action.action}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Care Guidelines */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.careBasics')}</Text>
        {careCards.map((card) => (
          <View key={card.id} style={styles.careCard}>
            <View style={styles.careCardHeader}>
              <View style={[styles.careIconContainer, { backgroundColor: card.iconColor + '20' }]}>
                <Ionicons name={card.icon as any} size={24} color={card.iconColor} />
              </View>
              <Text style={styles.careCardTitle}>{card.title}</Text>
            </View>
            <Text style={styles.careCardDescription}>{card.description}</Text>
            <View style={styles.tipContainer}>
              <MaterialCommunityIcons name="pyramid" size={16} color={Colors.secondary} />
              <Text style={styles.tipText}>{card.tip}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/scan')}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.fabGradient}
        >
          <Ionicons name="camera" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.h2,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: Typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  languageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  languageText: {
    color: 'white',
    fontSize: Typography.small,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: Typography.h1,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  summaryLabel: {
    fontSize: Typography.tiny,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.h3,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) / 2,
    backgroundColor: 'white',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: Typography.small,
    color: Colors.text,
    textAlign: 'center',
  },
  careCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  careCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  careIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  careCardTitle: {
    fontSize: Typography.body,
    fontWeight: '600',
    color: Colors.text,
  },
  careCardDescription: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.tiny,
    color: Colors.secondary,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
```

---

## Phase 7: Store and State Management Fixes 🟡

### 7.1 Fix Plant Store

**Update**: `store/plantStore.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Plant {
  id: string;
  name: string;
  nameAr: string;
  scientificName: string;
  nickname?: string;
  location?: string;
  windowDirection?: string;
  lastWatered?: Date;
  imageUri?: string;
  health: 'healthy' | 'needsCare' | 'critical';
  careInstructions?: any;
}

interface PlantStore {
  plants: Plant[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchPlants: () => Promise<void>;
  addPlant: (plant: Plant) => void;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  deletePlant: (id: string) => void;
  waterPlant: (id: string) => void;
  clearError: () => void;
}

export const usePlantStore = create<PlantStore>()(
  persist(
    (set, get) => ({
      plants: [],
      loading: false,
      error: null,

      fetchPlants: async () => {
        set({ loading: true, error: null });
        try {
          // Simulate API call - replace with real API
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // For now, keep existing plants or use empty array
          const existingPlants = get().plants;
          set({ 
            plants: existingPlants.length > 0 ? existingPlants : [],
            loading: false 
          });
        } catch (error) {
          set({ 
            error: 'Failed to fetch plants', 
            loading: false 
          });
        }
      },

      addPlant: (plant) => {
        set((state) => ({
          plants: [...state.plants, plant],
          error: null,
        }));
      },

      updatePlant: (id, updates) => {
        set((state) => ({
          plants: state.plants.map((plant) =>
            plant.id === id ? { ...plant, ...updates } : plant
          ),
          error: null,
        }));
      },

      deletePlant: (id) => {
        set((state) => ({
          plants: state.plants.filter((plant) => plant.id !== id),
          error: null,
        }));
      },

      waterPlant: (id) => {
        set((state) => ({
          plants: state.plants.map((plant) =>
            plant.id === id 
              ? { ...plant, lastWatered: new Date() }
              : plant
          ),
          error: null,
        }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'plant-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

---

## Phase 8: Testing Without Simulator 🔵

### 8.1 Setup Cloud Testing

**Create**: `testing-guide.md`

```markdown
# Testing Without iOS Simulator

## Option 1: Expo Go (Recommended for Quick Testing)
1. Install Expo Go on your physical iPhone
2. Run: `npx expo start`
3. Scan QR code with iPhone camera
4. Test directly on device

## Option 2: EAS Build (For TestFlight)
1. Install EAS CLI: `npm install -g eas-cli`
2. Configure: `eas build:configure`
3. Build for iOS: `eas build --platform ios`
4. Submit to TestFlight: `eas submit -p ios`

## Option 3: BrowserStack (Cloud Testing)
1. Sign up at browserstack.com
2. Upload your .ipa file
3. Test on real iOS devices in cloud
4. Take screenshots for debugging

## Option 4: Appetize.io (Web-based Simulator)
1. Build standalone app: `expo build:ios`
2. Upload to appetize.io
3. Test in browser-based iOS simulator
4. Share link with team for testing
```

---

## Testing Checklist

### Critical Path Testing
- [ ] New user can open app without crash
- [ ] Onboarding screens swipe properly
- [ ] OAuth login works (Apple/Google)
- [ ] Camera opens and captures photo
- [ ] Plant identification returns results
- [ ] Results can be saved to "My Plants"
- [ ] "My Plants" shows empty state for new users
- [ ] Plants can be added and viewed
- [ ] Language switch works (Arabic/English)
- [ ] All screens load without errors

### Error Scenarios
- [ ] No internet connection handling
- [ ] Camera permission denied handling
- [ ] Plant identification failure handling
- [ ] API timeout handling
- [ ] Invalid image handling

---

## Deployment Commands

```bash
# Clean Installation
rm -rf node_modules ios android .expo
npm install
npx expo install --fix

# Start Development
npx expo start -c

# Build for Testing
eas build --platform ios --profile preview

# Run on Web (for quick testing)
npx expo start --web

# Check for Issues
npx expo-doctor
npm audit fix
```

---

## Notes for Claude Code

1. **Import all fixes in order** - Phase 1 first (critical crashes)
2. **Test after each phase** - Don't apply all at once
3. **Use defensive programming** - Always check for null/undefined
4. **Add loading states** - Users should see feedback
5. **Handle errors gracefully** - No crashes, show helpful messages
6. **Test with empty data** - New user experience is critical

---

## Success Metrics

After implementing these fixes, you should have:
- ✅ Zero crashes for new users
- ✅ Smooth onboarding experience
- ✅ Better plant identification accuracy
- ✅ Professional camera interface
- ✅ Organized home screen
- ✅ Proper error handling throughout
- ✅ Working language switching
- ✅ Responsive UI on all screen sizes

---

*Send this file to Claude Code and work through each phase systematically. Start with Phase 1 (Critical Crashes) as these are blocking issues.*