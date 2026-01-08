import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  LayoutAnimation,
  Linking,
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

import {
  COLORS,
  PLANT_LOCATIONS,
  WINDOW_DIRECTIONS,
  FIBONACCI,
  TYPOGRAPHY,
  ELEMENT_SIZES,
  GOLDEN_RECTANGLES,
} from '../constants';
import { useStore } from '../store';
import { dbService } from '../services/supabase';
import { IdentificationResult, EnhancedCareRecommendation, Plant } from '../types';
import { getPersonalizedCareRecommendations } from '../utils/careMap';
import { plantDatabaseService } from '../services/plantDatabase';
import { useRTL } from '../utils/rtl';
import AuthModal from '../components/AuthModal';
import { logger } from '../utils/logger';
import PlantImage from '../components/PlantImage';

const getScoreGradient = (score: number): [string, string] => {
  switch (score) {
    case 5: return ['#D9F7BE', '#52C41A']; // Excellent - Brand Success Green (Lotus)
    case 4: return ['#FEF3C7', '#F59E0B']; // Very Good - Cream to Gold
    case 3: return ['#FEF3C7', '#F59E0B']; // Good - Light yellow to Amber
    case 2: return ['#FED7AA', '#F97316']; // Challenging - Peach to Orange
    case 1: return ['#FEE2E2', '#EF4444']; // Not Recommended - Pink to Red
    default: return ['#F3F4F6', '#D1D5DB']; // Fallback - Gray
  }
};

// Helper function to extract maximum watering days from text like "Water every 12-16 days"
const extractMaxWateringDays = (wateringText: string): number => {
  if (!wateringText) return 7; // Default fallback

  // Match patterns like "12-16 days" or "14 days"
  const rangeMatch = wateringText.match(/(\d+)-(\d+)\s*days?/i);
  if (rangeMatch) {
    return parseInt(rangeMatch[2], 10); // Return the max value (16 from "12-16")
  }

  const singleMatch = wateringText.match(/(\d+)\s*days?/i);
  if (singleMatch) {
    return parseInt(singleMatch[1], 10); // Return single value (14 from "14 days")
  }

  return 7; // Fallback to 7 days if no pattern found
};

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
  const { user, addPlant } = useStore();
  const isRTL = useRTL();

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
        setNickname(plant.names.common[0] || 'My Plant');
        logger.info('✅ Loaded plant from direct selection', { plantId: plantDatabaseId });
      }
    } else if (identificationResult?.database_match?.found && identificationResult.database_match.plant_id) {
      // CASE 2: PlantNet matched to database plant (curated)
      const plant = plantDatabaseService.getPlantById(identificationResult.database_match.plant_id);
      if (plant) {
        setDbPlant(plant);
        setNickname(plant.names.common[0] || 'My Plant');
        logger.info('✅ Loaded plant from database match', {
          plantId: identificationResult.database_match.plant_id,
          matchType: identificationResult.database_match.match_type,
          confidence: identificationResult.database_match.confidence
        });
      }
    } else if (identificationResult && !identificationResult.care_available) {
      // CASE 3: PlantNet identified but NOT in database (identified-only)
      setDbPlant(null); // No database plant available
      setNickname(identificationResult.common_name || 'My Plant');
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
              false // Don't include weather for comparison
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
          true
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

    const finalNickname = nickname.trim() || (dbPlant?.names.common[0] || 'My Plant');

    setIsLoading(true);

    try {
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

        // Only set care fields if plant is curated (in database)
        plant_type: isCurated ? (dbPlant?.care.plant_type || null) : 'unknown',
        watering_schedule: isCurated ? (dbPlant?.care.watering.schedule || null) : null,
        preferred_humidity: isCurated ? (dbPlant?.care.humidity || null) : null,
        preferred_orientation: isCurated ? (dbPlant?.care.light.requirement || null) : null,
        species_id: dbPlant?.id || null,

        // NEW: Database matching metadata
        is_curated: isCurated,
        identification_confidence: identificationResult?.confidence || matchConfidence,
        match_type: matchType,
      };

      const { data, error } = await dbService.addPlant(newPlant as any);
      
      if (error) throw error;
      if (data) {
        addPlant(data);
        Alert.alert(
          'Plant Added! 🌿',
          `${finalNickname} has been added to your garden`,
          [
            {
              text: 'OK',
              onPress: () => {
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
              },
            },
          ]
        );
      }
    } catch (error) {
      logger.error('Error saving plant:', error);
      Alert.alert('Error', 'Failed to save plant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.formGroup}>
            <Text style={styles.sectionTitle}>{t('addPlant.whereWillPlantLive')}</Text>
            <View style={styles.optionsGrid}>
              {PLANT_LOCATIONS.map((location) => (
                <TouchableOpacity
                  key={location.value}
                  style={[
                    styles.optionCard,
                    selectedLocation === location.value && styles.optionCardSelected,
                  ]}
                  onPress={() => setSelectedLocation(location.value)}
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
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.formGroup}>
            <Text style={styles.sectionTitle}>{isRTL ? 'ما هو اتجاه الشباك؟' : 'What is the window direction?'}</Text>
            <View style={styles.compassContainer}>
              <View style={styles.compass}>
                {WINDOW_DIRECTIONS.map((direction) => (
                  <TouchableOpacity
                    key={direction.value}
                    style={[
                      styles.compassDirection,
                      (direction.value === 'north' || direction.value === 'south') && styles.compassDirectionNS,
                      (styles as any)[`compass${direction.value.charAt(0).toUpperCase() + direction.value.slice(1)}`],
                      selectedDirection === direction.value && styles.compassDirectionSelected,
                    ]}
                    onPress={() => setSelectedDirection(direction.value)}
                  >
                    {(direction.value === 'north' || direction.value === 'south') ? (
                      <View style={styles.compassBilingualContainer}>
                        {direction.value === 'north' ? (
                          <>
                            <Text style={[styles.compassEnglishLetter, selectedDirection === direction.value && styles.compassTextSelected]}>
                              {direction.value.charAt(0).toUpperCase()}
                            </Text>
                            <Text style={[styles.compassArabicText, selectedDirection === direction.value && styles.compassTextSelected]}>
                              {direction.labelAr}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text style={[styles.compassArabicText, selectedDirection === direction.value && styles.compassTextSelected]}>
                              {direction.labelAr}
                            </Text>
                            <Text style={[styles.compassEnglishLetter, selectedDirection === direction.value && styles.compassTextSelected]}>
                              {direction.value.charAt(0).toUpperCase()}
                            </Text>
                          </>
                        )}
                      </View>
                    ) : (
                      <Text style={[styles.compassText, selectedDirection === direction.value && styles.compassTextSelected]}>
                        {direction.value.charAt(0).toUpperCase()}
                      </Text>
                    )}
                    {bestDirection === direction.value && (
                      <View style={styles.compassRecommendedBadge}>
                        <Text style={styles.compassRecommendedText}>R</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                <View style={styles.compassCenter}>
                  <Ionicons name="compass-outline" size={34} color={COLORS.white} />
                </View>
              </View>
              <Text style={styles.selectedDirection}>
                {t('addPlant.selectedDirection')} {t(`addPlant.directions.${selectedDirection}`)}
              </Text>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.formGroup}>
            {enhancedCareRec && (
              <View style={styles.tipsContainer}>
                {enhancedCareRec.warnings.map((warning, idx) => (
                  <View key={`warn-${idx}`} style={[styles.tipCard, warning.type === 'danger' && styles.tipCardDanger]}>
                    <Ionicons name={warning.type === 'danger' ? 'alert-circle-outline' : 'information-circle-outline'} size={20} color={warning.type === 'danger' ? COLORS.error : COLORS.primary} />
                    <Text style={styles.tipText}>{warning.message}</Text>
                  </View>
                ))}
                <View style={styles.tipCard}>
                  <Ionicons name="water-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.tipText}>{enhancedCareRec.adjusted.watering}</Text>
                </View>
                <View style={styles.tipCard}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.tipText}>{enhancedCareRec.adjusted.wateringFrequency}</Text>
                </View>
                {enhancedCareRec.tips.length > 0 && (
                  <View style={styles.tipCard}>
                    <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.tipText}>{enhancedCareRec.tips[0]}</Text>
                  </View>
                )}
              </View>
            )}
            <View style={{ marginTop: FIBONACCI.SM }}>
              <Text style={styles.label}>{t('addPlant.plantNickname')}</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder={dbPlant ? (isRTL ? `مثلاً: ${dbPlant.names.arabic?.[0] || dbPlant.names.common[0]} بتاعتي` : `e.g. My ${dbPlant.names.common[0]}`) : (isRTL ? 'مثلاً: زرعة الصالة' : 'e.g. Living Room Plant')}
                placeholderTextColor={COLORS.textSecondary}
                onFocus={() => {
                  // 🔧 FIX: Auto-scroll nickname into view when keyboard opens
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }}
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
                          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                            ✓ {isRTL && dbPlant?.names.arabic ? dbPlant.names.arabic[0] : (dbPlant?.names.common[0] || 'Snake Plant')}
                          </Text>
                          <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
                            {dbPlant?.care.plant_type || 'Succulent'}
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
          scrollEnabled={currentStep === 3} // Only allow scrolling in Step 3 (for nickname visibility)
        >
            <View style={styles.stepContentContainer}>
                {renderStepContent()}
            </View>
        </ScrollView>

        {/* 4. FIXED FOOTER NAVIGATION */}
        <View style={styles.fixedFooter}>
            <TouchableOpacity
                style={[styles.footerButton, styles.footerButtonSecondary]}
                onPress={() => {
                    if (currentStep === 1) {
                        // On first step, go back to previous screen
                        navigation.goBack();
                    } else {
                        // On later steps, go to previous step
                        setCurrentStep(currentStep - 1);
                    }
                }}
            >
                <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                <Text style={[styles.footerButtonText, styles.footerButtonSecondaryText]}>
                    {isRTL ? 'رجوع' : 'Back'}
                </Text>
            </TouchableOpacity>

            <View style={styles.footerProgress}>
                <View style={[styles.stepDot, currentStep >= 1 && styles.stepDotActive]} />
                <View style={[styles.stepDot, currentStep >= 2 && styles.stepDotActive]} />
                <View style={[styles.stepDot, currentStep >= 3 && styles.stepDotActive]} />
            </View>

            <TouchableOpacity
                style={[
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
            >
                <Text style={[
                    styles.footerButtonText,
                    styles.footerButtonPrimaryText,
                    ((currentStep === 1 && !selectedLocation) || (currentStep === 2 && !selectedDirection) || (currentStep === 3 && !nickname.trim()) || isLoading) && styles.footerButtonPrimaryTextDisabled
                ]}>
                    {currentStep === 3 ? (isLoading ? t('common.loading') : t('addPlant.saveToCollection')) : (isRTL ? 'التالي' : 'Next')}
                </Text>
                {currentStep < 3 && <Ionicons name="arrow-forward" size={20} color={COLORS.white} />}
            </TouchableOpacity>
          </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBF6',
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
    borderRadius: 30,      // Original border radius
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
  viewMoreButton: {
    alignSelf: 'center',
    paddingVertical: FIBONACCI.SM,
    paddingHorizontal: FIBONACCI.MD,
    marginTop: FIBONACCI.XXS,
  },
  fullCareGuideExpanded: {
    marginTop: FIBONACCI.SM,
    marginBottom: FIBONACCI.SM,
    paddingTop: FIBONACCI.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  plantDescription: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.text,
    lineHeight: FIBONACCI.LG,
  },
  // New Layout Styles
  layoutHeader: {
    paddingTop: FIBONACCI.XL,     // 34px - Creates visual breathing room at top
    paddingBottom: FIBONACCI.XXL, // 55px - Golden ratio to top (34:55 ≈ 1:1.6) - Fills negative space
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
    justifyContent: 'center',
    paddingVertical: FIBONACCI.MD, // Added for breathing room
    paddingBottom: FIBONACCI.MD, // Minimal padding for Steps 1 & 2
  },
  step3ExtraPadding: {
    paddingBottom: 350, // 🔧 Extra padding for Step 3 keyboard clearance (ensures input visible above keyboard)
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
    padding: FIBONACCI.MD, // 13px
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    position: 'relative',
  },
  optionCardContent: {
    alignItems: 'center',
    width: '100%',
  },
  optionCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: TYPOGRAPHY.SM, // 14px
    fontWeight: '600',
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.white,
  },
  optionTextAr: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.textSecondary,
    marginTop: FIBONACCI.XXS,
  },
  optionTextArSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  compassContainer: {
    alignItems: 'center',
  },
  compass: {
    width: GOLDEN_RECTANGLES.LARGE.width,
    height: GOLDEN_RECTANGLES.LARGE.height,
    position: 'relative',
    backgroundColor: COLORS.background,
    borderRadius: 110,
    marginBottom: FIBONACCI.SM,
  },
  compassDirection: {
    position: 'absolute',
    width: 63,
    height: 63,
    backgroundColor: COLORS.white,
    borderRadius: 31.5,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassDirectionNS: {
    width: FIBONACCI.XXXL,
    height: FIBONACCI.XXL,
    borderRadius: 35,
  },
  compassDirectionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    transform: [{ scale: 1.1 }],
  },
  compassNorth: {
    top: -5,
    left: '50%',
    marginLeft: -40,
  },
  compassEast: {
    right: -FIBONACCI.XS,
    top: '50%',
    marginTop: -31.5,
  },
  compassSouth: {
    bottom: -5,
    left: '50%',
    marginLeft: -40,
  },
  compassWest: {
    left: -FIBONACCI.XS,
    top: '50%',
    marginTop: -31.5,
  },
  compassText: {
    fontSize: TYPOGRAPHY.BASE,
    color: COLORS.text,
  },
  compassTextSelected: {
    color: COLORS.white,
  },
  compassBilingualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    flex: 1,
    paddingHorizontal: 6,
  },
  compassArabicText: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.text,
    textAlign: 'center',
    fontFamily: 'TharwatEmaraRuqaa',
    letterSpacing: 0.5,
  },
  compassEnglishLetter: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  compassCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -ELEMENT_SIZES.ICON_LG / 2,
    marginLeft: -ELEMENT_SIZES.ICON_LG / 2,
    width: ELEMENT_SIZES.ICON_LG,
    height: ELEMENT_SIZES.ICON_LG,
    backgroundColor: COLORS.primary,
    borderRadius: ELEMENT_SIZES.ICON_LG / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDirection: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: FIBONACCI.SM,
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
    shadowColor: '#000',
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
    fontSize: 20,
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
  descriptionExpanded: {
    marginTop: FIBONACCI.SM,
    marginBottom: FIBONACCI.SM,
    paddingTop: FIBONACCI.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: FIBONACCI.SM,
    paddingHorizontal: FIBONACCI.MD,
    borderRadius: ELEMENT_SIZES.RADIUS_LG,
    gap: FIBONACCI.SM,
    height: 55,
  },
  footerButtonPrimary: {
    backgroundColor: COLORS.primary,
    flex: 1,
  },
  footerButtonPrimaryDisabled: {
    backgroundColor: COLORS.border,
  },
  footerButtonSecondary: {
    backgroundColor: 'transparent',
    minWidth: 100,
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
    top: -6,
    right: -6,
    width: FIBONACCI.MD, // 13px using Fibonacci
    height: FIBONACCI.MD, // 13px using Fibonacci
    borderRadius: FIBONACCI.MD / 2, // Circular
    backgroundColor: '#EF4444', // Red color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
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
  compassRecommendedBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: FIBONACCI.MD, // 13px using Fibonacci
    height: FIBONACCI.MD, // 13px using Fibonacci
    borderRadius: FIBONACCI.MD / 2, // Circular
    backgroundColor: '#EF4444', // Red color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  compassRecommendedText: {
    color: '#FFFFFF',
    fontSize: FIBONACCI.SM, // 8px using Fibonacci
    fontWeight: '700',
  },
});
