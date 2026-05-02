import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  LayoutAnimation,
  Platform,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import PressSpring from '../components/PressSpring';

import {
  COLORS,
  PLANT_LOCATIONS,
  WINDOW_DIRECTIONS,
  FIBONACCI,
  TYPOGRAPHY,
  ELEMENT_SIZES,
  getScoreGradient,
} from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store';
import { dbService } from '../services/supabase';
import { IdentificationResult, EnhancedCareRecommendation, Plant } from '../types';
import { getPersonalizedCareRecommendations } from '../utils/careMap';
import { plantDatabaseService } from '../services/plantDatabase';
import { useRTL } from '../utils/rtl';
import AuthModal from '../components/AuthModal';
import NotificationPromptModal from '../components/NotificationPromptModal';
import GardenLocationModal from '../components/GardenLocationModal';
import { logger } from '../utils/logger';
import PlantImage from '../components/PlantImage';
import {
  extractMaxWateringDays,
  extractCheckSoilDays,
  translateWateringTip,
  translateCheckSoilTip,
  translateSeasonalTip,
} from '../utils/careTextUtils';
import * as NotificationService from '../services/notifications';
import PlantAddedCelebration from '../components/PlantAddedCelebration';
import CompassDirectionPicker from '../components/CompassDirectionPicker';
import { trackPlantAdded, trackNotificationResponse } from '../services/analytics';

interface RouteParams {
  identificationResult?: IdentificationResult;
  capturedImage?: string;  // Camera photo URI (only for scanned plants) - DEPRECATED: Use processedImageUri instead
  plantDatabaseId?: string;  // Database plant ID (only for selected plants, e.g., "euphorbia_trigona")
  // ⚡ NEW: Pre-processed images from PlantResultScreen (background processing)
  processedImageUri?: string;  // Pre-processed WebP image (~50KB, ready to use)
  cloudImageUrl?: string;      // Pre-uploaded cloud URL (already in Supabase storage)
}

export default function AddPlantScreen() {
  const [nickname, setNickname] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('living_room');
  const [selectedDirection, setSelectedDirection] = useState('east');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalVisible, setAuthModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [dbPlant, setDbPlant] = useState<Plant | null>(null);
  const [bestLocation, setBestLocation] = useState<string | null>(null);
  const [bestDirection, setBestDirection] = useState<string | null>(null);

  const [enhancedCareRec, setEnhancedCareRec] = useState<EnhancedCareRecommendation | null>(null);
  const [careLoading, setCareLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false); // 🔧 Track keyboard state
  const [isNicknameFocused, setNicknameFocused] = useState(false); // 🎨 Track nickname input focus for color change
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null); // 🔧 Ref for programmatic scroll control

  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const {
    identificationResult,
    capturedImage,
    plantDatabaseId,
    // ⚡ NEW: Pre-processed URIs from PlantResultScreen (already done in background!)
    processedImageUri: preProcessedImageUri,
    cloudImageUrl: preUploadedCloudUrl
  } = (route.params as RouteParams) || {};
  const { user, plants, addPlant, gardenLocation, setGardenLocation } = useStore();
  const isRTL = useRTL();

  // Modal states for progressive engagement prompts
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [showGardenLocationPrompt, setShowGardenLocationPrompt] = useState(false);
  const [savedPlantData, setSavedPlantData] = useState<Plant | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // ⚡ OPTIMIZATION: Image processing & upload now happens on PlantResultScreen (background)
  // This screen receives pre-processed images, so no processing needed here!
  // Cleanup: Delete uploaded image if user goes back without saving
  useEffect(() => {
    return () => {
      // Only cleanup if user navigated away (not after successful save)
      if (preUploadedCloudUrl && !isLoading) {
        logger.info('🗑️ User left AddPlantScreen without saving - deleting cloud upload', {
          cloudUrl: preUploadedCloudUrl
        });
        dbService.deleteUploadedImage(preUploadedCloudUrl).catch(err => {
          logger.warn('Failed to cleanup cloud upload on navigation back:', err);
        });
      }
    };
  }, [preUploadedCloudUrl, isLoading]);

  // UPDATED: Trust database_match from PlantNet service (no double searching)
  useEffect(() => {
    if (plantDatabaseId) {
      // CASE 1: Direct database selection (from AddScanScreen search)
      const plant = plantDatabaseService.getPlantById(plantDatabaseId);
      if (plant) {
        setDbPlant(plant);
        // Use Arabic name when language is Arabic, fallback to English
        const plantName = isRTL && plant.names.arabic?.[0]
          ? plant.names.arabic[0]
          : (plant.names.common[0] || 'My Plant');
        setNickname(plantName);
        logger.info('✅ Loaded plant from direct selection', { plantId: plantDatabaseId });
      }
    } else if (identificationResult?.database_match?.found && identificationResult.database_match.plant_id) {
      // CASE 2: PlantNet matched to database plant (curated)
      const plant = plantDatabaseService.getPlantById(identificationResult.database_match.plant_id);
      if (plant) {
        setDbPlant(plant);
        // Use Arabic name when language is Arabic, fallback to English
        const plantName = isRTL && plant.names.arabic?.[0]
          ? plant.names.arabic[0]
          : (plant.names.common[0] || 'My Plant');
        setNickname(plantName);
        logger.info('✅ Loaded plant from database match', {
          plantId: identificationResult.database_match.plant_id,
          matchType: identificationResult.database_match.match_type,
          confidence: identificationResult.database_match.confidence
        });
      }
    } else if (identificationResult && !identificationResult.care_available) {
      // CASE 3: PlantNet identified but NOT in database (identified-only)
      setDbPlant(null); // No database plant available
      // Use Arabic name from identification result if available
      const plantName = isRTL && identificationResult.common_name_arabic
        ? identificationResult.common_name_arabic
        : (identificationResult.common_name || 'My Plant');
      setNickname(plantName);
      logger.warn('⚠️ Plant identified but not in curated database', {
        commonName: identificationResult.common_name,
        scientificName: identificationResult.scientific_name
      });
    }
  }, [identificationResult, plantDatabaseId]);

  useEffect(() => {
    if (enhancedCareRec) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [enhancedCareRec?.score.score]);

  // Auto-select best location and direction when plant loads
  useEffect(() => {
    const findBestPlacement = async () => {
      if (!dbPlant) {
        setBestLocation(null);
        setBestDirection(null);
        return;
      }

      // Test all combinations to find the best placement
      let highestScore = 0;
      let bestLoc = 'living_room';
      let bestDir = 'east';

      for (const location of PLANT_LOCATIONS) {
        for (const direction of WINDOW_DIRECTIONS) {
          try {
            const rec = await getPersonalizedCareRecommendations(
              dbPlant.id,
              location.value as any,
              direction.value as any,
              gardenLocation
            );
            if (rec.score.score > highestScore) {
              highestScore = rec.score.score;
              bestLoc = location.value;
              bestDir = direction.value;
            }
          } catch (error) {
            // Skip errors, continue testing
          }
        }
      }

      setBestLocation(bestLoc);
      setBestDirection(bestDir);
      setSelectedLocation(bestLoc);
      setSelectedDirection(bestDir);
      logger.info(`✅ Auto-selected best placement: ${bestLoc} + ${bestDir} (score: ${highestScore})`);
    };

    findBestPlacement();
  }, [dbPlant]);

  useEffect(() => {
    const fetchEnhancedCare = async () => {
      logger.info(`[DEBUG] fetchEnhancedCare called with location: ${selectedLocation}, direction: ${selectedDirection}`);
      if (!dbPlant) {
        setEnhancedCareRec(null);
        return;
      }

      setCareLoading(true);
      try {
        const recommendation = await getPersonalizedCareRecommendations(
          dbPlant.id,
          selectedLocation as any,
          selectedDirection as any,
          gardenLocation
        );
        setEnhancedCareRec(recommendation);
        logger.info(`✅ Care recommendation updated for ${dbPlant.id}: ${recommendation.score.stars}`);
      } catch (error) {
        logger.error('Error fetching enhanced care:', error);
        setEnhancedCareRec(null);
      } finally {
        setCareLoading(false);
      }
    };

    fetchEnhancedCare();
  }, [dbPlant, selectedLocation, selectedDirection]);

  useEffect(() => {
    if (currentStep !== 1) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [currentStep]);

  // 🔧 FIX: Reset scroll position when changing steps (prevents broken layout bug)
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentStep]);

  // 🔧 FIX: Hide header when keyboard opens in Step 3 (frees up space for nickname input)
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        if (currentStep === 3) {
          setKeyboardVisible(true);
        }
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [currentStep]);

  const handleSave = async () => {
    if (!user || user.id.startsWith('guest-')) {
      setAuthModalVisible(true);
      return;
    }

    // Use Arabic name when language is Arabic and nickname is empty
    const finalNickname = nickname.trim() || (
      isRTL && dbPlant?.names.arabic?.[0]
        ? dbPlant.names.arabic[0]
        : (dbPlant?.names.common[0] || 'My Plant')
    );

    setIsLoading(true);

    try {
      // 🔒 FIX: Verify Supabase session is valid before attempting save
      const { data: { session }, error: sessionError } = await dbService.supabase.auth.getSession();

      if (sessionError || !session) {
        logger.warn('⚠️ Session invalid - attempting refresh...', { sessionError });

        // Try to refresh session automatically
        const { data: { session: newSession }, error: refreshError } = await dbService.supabase.auth.refreshSession();

        if (refreshError || !newSession) {
          logger.error('❌ Session refresh failed - user needs to re-authenticate', { refreshError });
          Alert.alert(
            'Session Expired',
            'Please sign in again to save your plant.',
            [
              {
                text: 'Sign In',
                onPress: () => {
                  setIsLoading(false);
                  setAuthModalVisible(true);
                }
              }
            ]
          );
          return;
        }

        logger.info('✅ Session refreshed successfully');
      }
      // ⚡ OPTIMIZATION: Use pre-processed & pre-uploaded images from PlantResultScreen!
      // No processing or upload needed - already done in background ✨
      const capturedImageUri = preProcessedImageUri || capturedImage || '';
      let cloudImageUrl = preUploadedCloudUrl || '';

      // Fallback: If background upload failed/missing, upload now (rare case)
      if (!cloudImageUrl && preProcessedImageUri) {
        logger.warn('⚠️ Cloud URL missing - background upload may have failed, uploading now...');
        try {
          const uploadedUrl = await dbService.uploadImage({
            uri: preProcessedImageUri,
            type: 'image/webp',
            name: `plant_${user.id}_${Date.now()}.webp`
          }, 'plant-images');
          if (uploadedUrl) {
            cloudImageUrl = uploadedUrl;
            logger.info('✅ Fallback upload succeeded', { cloudImageUrl });
          }
        } catch (uploadError) {
          logger.error('❌ Fallback upload failed:', uploadError);
          // Continue with local image only - plant still saves!
        }
      }

      // ⚠️ VALIDATION: Warn if both cloud and local images are missing
      if (!cloudImageUrl && !capturedImageUri) {
        logger.warn('⚠️ No images available for plant! Both cloud and local are empty');
      } else {
        logger.info('✅ Images ready for save', {
          hasCloud: !!cloudImageUrl,
          hasLocal: !!capturedImageUri,
          source: preUploadedCloudUrl ? 'pre-uploaded (instant!)' : 'fallback upload'
        });
      }

      const nextWatering = new Date();
      // Extract max watering days from enhanced care recommendations
      const wateringDays = enhancedCareRec?.adjusted?.watering
        ? extractMaxWateringDays(enhancedCareRec.adjusted.watering)
        : 7; // Fallback to 7 days if no care data
      nextWatering.setDate(nextWatering.getDate() + wateringDays);

      // Determine if plant is curated (has database match)
      const isCurated = identificationResult?.care_available || !!plantDatabaseId || !!dbPlant;
      const matchConfidence = identificationResult?.database_match?.confidence || 100;
      const matchType = identificationResult?.database_match?.match_type || 'exact';

      const newPlant = {
        user_id: user.id,
        plant_id: plantDatabaseId || dbPlant?.id || null,  // Database plant ID (null for identified-only)
        nickname: finalNickname,
        location: selectedLocation as any,
        window_direction: selectedDirection as any,
        placement_score: enhancedCareRec?.score.score || null,  // Location rating: 1-5 stars
        image_url: cloudImageUrl || '',  // Cloud URL (permanent, backed up WebP ~50KB)
        captured_image_uri: capturedImageUri || '',  // Local cache (WebP for fast offline access)
        next_watering_at: nextWatering.toISOString(),

        // Use dbPlant data if available, otherwise use identificationResult data
        common_name: dbPlant?.names.common[0] || identificationResult?.common_name || null,
        scientific_name: dbPlant?.names.scientific[0] || identificationResult?.scientific_name || null,

        // Use data from identificationResult (already populated by PlantNet service with database match OR family fallback)
        plant_type: identificationResult?.plant_type || 'foliage', // Fallback to valid constraint value
        watering_schedule: identificationResult?.watering_schedule || null,
        preferred_humidity: identificationResult?.preferred_humidity || null,
        preferred_orientation: identificationResult?.preferred_orientation || null,
        species_id: dbPlant?.id || null,

        // NEW: Database matching metadata
        is_curated: isCurated,
        identification_confidence: identificationResult?.confidence || matchConfidence,
        match_type: matchType,
      };

      const plantCountBefore = plants.length;

      const { data, error } = await dbService.addPlant(newPlant as any);

      if (error) throw error;
      if (data) {
        addPlant(data);
        setSavedPlantData(data);

        trackPlantAdded({
          commonName: data.common_name || undefined,
          location: selectedLocation,
          windowDirection: selectedDirection,
          isCurated: isCurated,
          matchType: matchType,
          source: 'scan',
          plantCount: plants.length + 1,
          isFirstPlant: plantCountBefore === 0,
        });

        // Schedule notification for this plant (if already enabled)
        const notificationsEnabled = await NotificationService.isEnabled();
        if (notificationsEnabled) {
          const checkDays = extractCheckSoilDays(
            enhancedCareRec?.adjusted?.wateringFrequency || '',
            enhancedCareRec?.adjusted?.watering || ''
          );
          await NotificationService.scheduleForPlant(data, checkDays);
        }

        // Progressive engagement: show prompt based on plant count
        if (plantCountBefore === 0) {
          // 1st plant — offer notifications
          const promptShown = await NotificationService.hasPromptBeenShown();
          if (!promptShown) {
            setShowNotificationPrompt(true);
            return; // Don't show success alert yet — modal handles flow
          }
        } else if (plantCountBefore === 2 && !gardenLocation) {
          // 3rd plant — offer garden location
          const gardenPromptShown = await AsyncStorage.getItem('garden_location_prompt_shown');
          if (!gardenPromptShown) {
            setShowGardenLocationPrompt(true);
            return; // Don't show success alert yet — modal handles flow
          }
        }

        // Default: show success alert directly
        showSuccessAndNavigate(finalNickname);
      }
    } catch (error) {
      logger.error('Error saving plant:', error);
      Alert.alert('Error', 'Failed to save plant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccessAndNavigate = (plantName: string) => {
    // 350ms delay to avoid nested modal overlap (NotificationPrompt/GardenLocation may just have closed)
    setTimeout(() => setShowCelebration(true), 350);
  };

  const handleCelebrationDismiss = () => {
    setShowCelebration(false);
    navigation.reset({
      index: 0,
      routes: [{
        name: 'MainTabs' as never,
        state: {
          routes: [
            { name: 'Home' },
            { name: 'Scan' },
            { name: 'Plants' }
          ],
          index: 2,
        }
      }],
    });
  };

  const handleNotificationEnable = async () => {
    setShowNotificationPrompt(false);
    const granted = await NotificationService.requestPermission();
    await NotificationService.markPromptShown();
    trackNotificationResponse({ action: granted ? 'enabled' : 'denied' });
    if (granted && savedPlantData) {
      const checkDays = extractCheckSoilDays(
        enhancedCareRec?.adjusted?.wateringFrequency || '',
        enhancedCareRec?.adjusted?.watering || ''
      );
      await NotificationService.scheduleForPlant(savedPlantData, checkDays);
    }
    showSuccessAndNavigate(savedPlantData?.nickname || nickname);
  };

  const handleNotificationSkip = async () => {
    setShowNotificationPrompt(false);
    await NotificationService.markPromptShown();
    trackNotificationResponse({ action: 'skipped' });
    showSuccessAndNavigate(savedPlantData?.nickname || nickname);
  };

  const handleGardenLocationSave = async (location: { lat: number; lon: number; name: string }) => {
    setShowGardenLocationPrompt(false);
    setGardenLocation(location);
    // Save to Supabase profile
    if (user) {
      await dbService.updateProfile(user.id, {
        garden_lat: location.lat,
        garden_lon: location.lon,
        garden_name: location.name,
      });
    }
    await AsyncStorage.setItem('garden_location_prompt_shown', 'true');
    showSuccessAndNavigate(savedPlantData?.nickname || nickname);
  };

  const handleGardenLocationSkip = async () => {
    setShowGardenLocationPrompt(false);
    await AsyncStorage.setItem('garden_location_prompt_shown', 'true');
    showSuccessAndNavigate(savedPlantData?.nickname || nickname);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.formGroup}>
            <Text style={styles.sectionTitle}>{t('addPlant.whereWillPlantLive')}</Text>
            <View style={styles.optionsGrid}>
              {PLANT_LOCATIONS.map((location) => (
                <PressSpring
                  key={location.value}
                  style={[
                    styles.optionCard,
                    selectedLocation === location.value && styles.optionCardSelected,
                  ]}
                  onPress={() => setSelectedLocation(location.value)}
                  pressedScale={0.95}
                >
                  <View style={styles.optionCardContent}>
                    <Text style={[styles.optionText, selectedLocation === location.value && styles.optionTextSelected]}>
                      {isRTL ? location.labelAr : location.label}
                    </Text>
                    {bestLocation === location.value && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>R</Text>
                      </View>
                    )}
                  </View>
                </PressSpring>
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <CompassDirectionPicker
            selectedDirection={selectedDirection}
            onDirectionChange={setSelectedDirection}
            bestDirection={bestDirection}
            isRTL={isRTL}
          />
        );
      case 3:
        return (
          <View style={styles.formGroup}>
            {enhancedCareRec && (
              <View style={styles.tipsContainer}>
                {enhancedCareRec.warnings.map((warning, idx) => (
                  <View key={`warn-${idx}`} style={[styles.tipCard, warning.type === 'danger' && styles.tipCardDanger, isRTL && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name={warning.type === 'danger' ? 'alert-circle-outline' : 'information-circle-outline'} size={20} color={warning.type === 'danger' ? COLORS.error : COLORS.primary} />
                    <Text style={[styles.tipText, isRTL && { textAlign: 'right' }]}>{warning.message}</Text>
                  </View>
                ))}
                <View style={[styles.tipCard, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Ionicons name="water-outline" size={20} color={COLORS.primary} />
                  <Text style={[styles.tipText, isRTL && { textAlign: 'right' }]}>{translateWateringTip(enhancedCareRec.adjusted.watering, t)}</Text>
                </View>
                <View style={[styles.tipCard, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  <Text style={[styles.tipText, isRTL && { textAlign: 'right' }]}>{translateCheckSoilTip(enhancedCareRec.adjusted.wateringFrequency, t)}</Text>
                </View>
                {enhancedCareRec.tips.length > 0 && (
                  <View style={[styles.tipCard, isRTL && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
                    <Text style={[styles.tipText, isRTL && { textAlign: 'right' }]}>{translateSeasonalTip(enhancedCareRec.tips[0], t)}</Text>
                  </View>
                )}
              </View>
            )}
            <View style={{ marginTop: FIBONACCI.XS }}>
              <Text style={[styles.label, isRTL && { textAlign: 'right' }]}>{t('addPlant.plantNickname')}</Text>
              <TextInput
                style={[
                  styles.input,
                  isNicknameFocused && styles.inputFocused, // 🎨 Dark black text when focused/editing
                  isRTL && { textAlign: 'right' },
                ]}
                value={nickname}
                onChangeText={setNickname}
                placeholder={dbPlant ? (isRTL ? `مثلاً: ${dbPlant.names.arabic?.[0] || dbPlant.names.common[0]} بتاعتي` : `e.g. My ${dbPlant.names.common[0]}`) : (isRTL ? 'مثلاً: زرعة الصالة' : 'e.g. Living Room Plant')}
                placeholderTextColor={COLORS.textSecondary}
                onFocus={() => {
                  setNicknameFocused(true); // 🎨 Change color to dark black when user taps/focuses
                  // 🔧 Removed auto-scroll - let KeyboardAvoidingView handle it naturally for smoother transition
                }}
                onBlur={() => setNicknameFocused(false)} // 🎨 Revert to light grey when user exits
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AuthModal visible={isAuthModalVisible} onClose={() => setAuthModalVisible(false)} />
      <NotificationPromptModal
        visible={showNotificationPrompt}
        onEnable={handleNotificationEnable}
        onSkip={handleNotificationSkip}
      />
      <GardenLocationModal
        visible={showGardenLocationPrompt}
        onSave={handleGardenLocationSave}
        onSkip={handleGardenLocationSkip}
      />
      <PlantAddedCelebration
        visible={showCelebration}
        plantName={savedPlantData?.nickname || nickname || 'My Plant'}
        plantNameAr={
          dbPlant?.names.arabic?.[0] ||
          identificationResult?.common_name_arabic
        }
        plantImage={{
          imageUrl: preUploadedCloudUrl,
          capturedImageUri: preProcessedImageUri || capturedImage,
          plantId: plantDatabaseId || dbPlant?.id,
        }}
        onDismiss={handleCelebrationDismiss}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* 1. FIXED HEADER BANNER - Hidden when keyboard is open in Step 3 to save space */}
        {!(isKeyboardVisible && currentStep === 3) && (
          <View style={styles.layoutHeader}>
              <View style={styles.headerCard}>
                  <View style={styles.headerContentRow}>
                      <PlantImage
                          // ⚡ OPTIMIZATION: Use pre-processed image from PlantResultScreen (instant!)
                          // Priority: cloud URL → pre-processed local → captured original → database stock
                          imageUrl={preUploadedCloudUrl}
                          capturedImageUri={preProcessedImageUri || capturedImage}
                          plantId={!preProcessedImageUri && !capturedImage ? (plantDatabaseId || dbPlant?.id) : undefined}
                          plantName={dbPlant?.names.common[0] || identificationResult?.common_name || 'Plant'}
                          size={FIBONACCI.XXL}
                          style={styles.headerImage}
                      />
                      <View style={styles.headerTextContainer}>
                          <Text style={styles.headerTitle} numberOfLines={2} ellipsizeMode="tail">
                            ✓ {isRTL && dbPlant?.names.arabic
                              ? dbPlant.names.arabic[0]
                              : (dbPlant?.names.common[0] || identificationResult?.common_name || t('addPlant.unknownPlant'))}
                          </Text>
                          <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
                            {dbPlant?.care.plant_type || identificationResult?.scientific_name || t('addPlant.unidentified')}
                          </Text>
                      </View>
                  </View>
              </View>
          </View>
        )}


        {/* 2. HERO: LOCATION RATING (FIXED) */}
        <View style={styles.layoutHero}>
            {/* Location Rating Hero - NEW DESIGN */}
            {(enhancedCareRec || careLoading) && (
                <View style={styles.heroContainer}>
                {careLoading ? (
                    <View style={styles.heroLoadingState}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={styles.heroLoadingText}>{t('addPlant.calculatingScore')}</Text>
                    </View>
                ) : enhancedCareRec && (
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <LinearGradient
                        colors={getScoreGradient(enhancedCareRec.score.score)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroGradientCard}
                    >
                        {/* Headline */}
                        <Text style={styles.heroHeadline}>{t('addPlant.locationRating')}</Text>

                        {/* Main Row: Stars + Score Text */}
                        <View style={styles.heroMainRow}>
                        <Text style={styles.heroStars}>{enhancedCareRec.score.stars}</Text>
                        <Text style={styles.heroScoreText}>{
                          enhancedCareRec.score.score === 5 ? t('addPlant.scores.excellent') :
                          enhancedCareRec.score.score === 4 ? t('addPlant.scores.veryGood') :
                          enhancedCareRec.score.score === 3 ? t('addPlant.scores.good') :
                          enhancedCareRec.score.score === 2 ? t('addPlant.scores.challenging') :
                          t('addPlant.scores.veryChallenging')
                        }</Text>
                        </View>
                    </LinearGradient>
                    </Animated.View>
                )}
                </View>
            )}
        </View>

        {/* 3. QUESTION & CHOICE AREA (FLEX) */}
        <ScrollView
          ref={scrollViewRef} // 🔧 Ref for programmatic scroll control
          style={styles.layoutContentScrollView}
          contentContainerStyle={[
            styles.layoutContentContainer,
            currentStep === 3 && styles.step3ExtraPadding, // 🔧 Extra padding for Step 3 keyboard
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          scrollEnabled={true} // Always scrollable so all location options are reachable
        >
            <View style={styles.stepContentContainer}>
                {renderStepContent()}
            </View>
        </ScrollView>

        {/* 4. FIXED FOOTER NAVIGATION */}
        <View style={styles.fixedFooter}>
            <PressSpring
                style={[styles.footerButton, styles.footerButtonSecondary]}
                onPress={() => {
                    if (currentStep === 1) {
                        navigation.goBack();
                    } else {
                        setCurrentStep(currentStep - 1);
                    }
                }}
                pressedScale={0.97}
            >
                <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                <Text style={[styles.footerButtonText, styles.footerButtonSecondaryText]}>
                    {isRTL ? 'رجوع' : 'Back'}
                </Text>
            </PressSpring>

            <View style={styles.footerProgress}>
                <View style={[styles.stepDot, currentStep >= 1 && styles.stepDotActive]} />
                <View style={[styles.stepDot, currentStep >= 2 && styles.stepDotActive]} />
                <View style={[styles.stepDot, currentStep >= 3 && styles.stepDotActive]} />
            </View>

            <PressSpring
                style={[
                    { flex: 1 },
                    styles.footerButton,
                    styles.footerButtonPrimary,
                    ((currentStep === 1 && !selectedLocation) || (currentStep === 2 && !selectedDirection) || (currentStep === 3 && !nickname.trim()) || isLoading) && styles.footerButtonPrimaryDisabled
                ]}
                disabled={
                    (currentStep === 1 && !selectedLocation) ||
                    (currentStep === 2 && !selectedDirection) ||
                    (currentStep === 3 && !nickname.trim()) ||
                    isLoading
                }
                onPress={currentStep === 3 ? handleSave : () => setCurrentStep(currentStep + 1)}
                pressedScale={0.97}
            >
                <Text style={[
                    styles.footerButtonText,
                    styles.footerButtonPrimaryText,
                    ((currentStep === 1 && !selectedLocation) || (currentStep === 2 && !selectedDirection) || (currentStep === 3 && !nickname.trim()) || isLoading) && styles.footerButtonPrimaryTextDisabled
                ]}>
                    {currentStep === 3 ? (isLoading ? t('common.loading') : t('addPlant.saveToCollection')) : (isRTL ? 'التالي' : 'Next')}
                </Text>
                {currentStep < 3 && <Ionicons name="arrow-forward" size={20} color={COLORS.white} />}
            </PressSpring>
          </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerCard: {
    backgroundColor: COLORS.background,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    margin: FIBONACCI.MD, // 13px - Original spacing
    paddingVertical: FIBONACCI.LG, // 21px - Adds vertical density for negative space balance
    paddingHorizontal: FIBONACCI.MD, // 13px - Original horizontal padding
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: FIBONACCI.SM,
  },
  headerImage: {
    width: FIBONACCI.XXL,  // 55px - Original size (reverted from 89px)
    height: FIBONACCI.XXL, // 55px - Original size
    borderRadius: FIBONACCI.XXL / 2, // Fibonacci circular
    marginRight: FIBONACCI.LG, // 21px - Original spacing
    flexShrink: 0, // Prevent image from shrinking
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center', // Center text vertically with image
    paddingRight: FIBONACCI.MD, // Add padding to prevent text from reaching edge
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.BASE, // 16px - Original size (reverted from 21px)
    fontWeight: '600',         // Original weight (reverted from '700')
    color: COLORS.success,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.SM,   // 14px - Original size (reverted from 16px)
    color: COLORS.textSecondary,
  },
  // New Layout Styles
  layoutHeader: {
    paddingTop: FIBONACCI.XL,
    paddingBottom: FIBONACCI.SM,
    justifyContent: 'center',
  },
  layoutHero: {
    justifyContent: 'center',
    paddingHorizontal: FIBONACCI.MD,
  },
  layoutContentScrollView: {
    flex: 1, // Takes remaining space (50%)
  },
  layoutContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: FIBONACCI.MD, // Added for breathing room
    paddingBottom: FIBONACCI.XXL, // Enough clearance so bottom cards aren't hidden behind footer
  },
  step3ExtraPadding: {
    paddingBottom: FIBONACCI.LG, // 🔧 FIX: Minimal spacing (21px) - keeps buttons close to input without excessive gap
  },
  stepContentContainer: {
    justifyContent: 'center',
  },
  formGroup: {
    marginHorizontal: FIBONACCI.MD,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.MD, // 18px
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: FIBONACCI.MD, // 13px
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: FIBONACCI.SM, // 8px
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    paddingVertical: FIBONACCI.SM,
    paddingHorizontal: FIBONACCI.MD,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  optionCardContent: {
    alignItems: 'center',
    width: '100%',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(45, 80, 50, 0.1)',
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  optionText: {
    fontSize: TYPOGRAPHY.SM, // 14px
    fontWeight: '600',
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.primary,
  },
  optionTextAr: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.textSecondary,
    marginTop: FIBONACCI.XXS,
  },
  optionTextArSelected: {
    color: COLORS.primary,
  },
  tipsContainer: {
    gap: 5, // 5px (was FIBONACCI.SM = 8px) - Compressed for Step 3 to fit nickname
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: FIBONACCI.SM, // 8px (was FIBONACCI.MD = 13px) - More compact
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    gap: FIBONACCI.SM,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipCardDanger: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  tipText: {
    flex: 1,
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.text,
    lineHeight: FIBONACCI.LG,
  },
  label: {
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: FIBONACCI.SM,
  },
  input: {
    height: ELEMENT_SIZES.INPUT_MD,
    borderWidth: 2, // Bolder border so it doesn't melt into green background
    borderColor: COLORS.border,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    paddingHorizontal: FIBONACCI.MD,
    fontSize: TYPOGRAPHY.BASE,
    color: '#9CA3AF', // Light grey (Instagram comment placeholder style) - signals it's editable
    backgroundColor: COLORS.white,
  },
  inputFocused: {
    color: COLORS.text, // Dark black (#2C2C2C) - strong contrast when user is actively editing
  },
  fixedFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
    padding: FIBONACCI.MD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: FIBONACCI.SM,
  },
  // Location Quality Hero - COMPACT PREMIUM DESIGN
  heroContainer: {
    marginBottom: FIBONACCI.MD,
  },
  heroGradientCard: {
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    paddingVertical: FIBONACCI.MD,
    paddingHorizontal: FIBONACCI.MD,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  heroHeadline: {
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: FIBONACCI.XXS,
  },
  heroMainRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: FIBONACCI.XXS,
  },
  heroStars: {
    fontSize: TYPOGRAPHY.LG,
    color: '#F59E0B',
    letterSpacing: 2,
  },
  heroScoreText: {
    fontSize: TYPOGRAPHY.MD,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
    marginLeft: FIBONACCI.SM,
  },
  heroLoadingState: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: FIBONACCI.LG,
    backgroundColor: COLORS.background,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
  },
  heroLoadingText: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.textSecondary,
    marginLeft: FIBONACCI.SM,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: FIBONACCI.SM,
    paddingHorizontal: FIBONACCI.MD,
    borderRadius: ELEMENT_SIZES.RADIUS_LG,
    gap: FIBONACCI.SM,
    height: ELEMENT_SIZES.BUTTON_MD,
  },
  footerButtonPrimary: {
    backgroundColor: COLORS.primary,
    flex: 1, // fills the Animated.View wrapper which holds flex: 1
  },
  footerButtonPrimaryDisabled: {
    backgroundColor: COLORS.border,
  },
  footerButtonSecondary: {
    backgroundColor: 'transparent',
    minWidth: FIBONACCI.XXXL,
  },
  footerButtonText: {
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
  },
  footerButtonPrimaryText: {
    color: COLORS.white,
  },
  footerButtonPrimaryTextDisabled: {
    color: COLORS.textSecondary,
  },
  footerButtonSecondaryText: {
    color: COLORS.primary,
  },
  footerProgress: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: FIBONACCI.SM,
    zIndex: -1,
  },
  stepDot: {
    width: FIBONACCI.SM,
    height: FIBONACCI.SM,
    borderRadius: FIBONACCI.SM / 2,
    backgroundColor: COLORS.border,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  // Recommended badge styles
  recommendedBadge: {
    position: 'absolute',
    top: -FIBONACCI.XS,
    right: -FIBONACCI.XS,
    width: FIBONACCI.MD,
    height: FIBONACCI.MD,
    borderRadius: FIBONACCI.MD / 2, // Circular
    backgroundColor: '#EF4444', // Red color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: FIBONACCI.SM, // 8px using Fibonacci
    fontWeight: '700',
  },
});
