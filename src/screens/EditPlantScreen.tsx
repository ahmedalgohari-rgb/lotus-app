import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { logger } from '../utils/logger';
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
import { Plant, EnhancedCareRecommendation } from '../types';
import { useRTL } from '../utils/rtl';
import { useTranslation } from 'react-i18next';
import { getPersonalizedCareRecommendations } from '../utils/careMap';
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
  plantId: string;
}

export default function EditPlantScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { plantId } = route.params as RouteParams;
  const { plants, updatePlant } = useStore();
  const isRTL = useRTL();

  const [plant, setPlant] = useState<Plant | null>(null);
  const [location, setLocation] = useState<Plant['location']>('living_room');
  const [windowDirection, setWindowDirection] = useState<Plant['window_direction']>('east');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [enhancedCare, setEnhancedCare] = useState<EnhancedCareRecommendation | null>(null);
  const [isLoadingCare, setIsLoadingCare] = useState(false);
  const [showFullCareGuide, setShowFullCareGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [bestLocation, setBestLocation] = useState<string | null>(null);
  const [bestDirection, setBestDirection] = useState<string | null>(null);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const foundPlant = plants.find(p => p.id === plantId);
    if (foundPlant) {
      setPlant(foundPlant);
      setLocation(foundPlant.location);
      setWindowDirection(foundPlant.window_direction);
    }
    setIsLoading(false);
  }, [plantId, plants]);

  // Auto-detect best location and direction when plant loads
  useEffect(() => {
    const findBestPlacement = async () => {
      if (!plant || !plant.species_id) {
        setBestLocation(null);
        setBestDirection(null);
        return;
      }

      // Test all combinations to find the best placement
      let highestScore = 0;
      let bestLoc = location;
      let bestDir = windowDirection;

      for (const loc of PLANT_LOCATIONS) {
        for (const dir of WINDOW_DIRECTIONS) {
          try {
            const recommendation = await getPersonalizedCareRecommendations(
              plant.species_id,
              loc.value as any,
              dir.value as any,
              false
            );
            if (recommendation.score.score > highestScore) {
              highestScore = recommendation.score.score;
              bestLoc = loc.value as any;
              bestDir = dir.value as any;
            }
          } catch (error) {
            // Skip errors, continue testing
          }
        }
      }

      setBestLocation(bestLoc);
      setBestDirection(bestDir);
      logger.info(`✅ Auto-selected best placement: ${bestLoc} + ${bestDir} (score: ${highestScore})`);
    };

    findBestPlacement();
  }, [plant]);

  useEffect(() => {
    if (enhancedCare) {
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
  }, [enhancedCare?.score.score]);

  useEffect(() => {
    if (currentStep !== 1) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [currentStep]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Calculate new next watering based on new location's care tips
      const nextWatering = new Date();
      const wateringDays = enhancedCare?.adjusted?.watering
        ? extractMaxWateringDays(enhancedCare.adjusted.watering)
        : 7;
      nextWatering.setDate(nextWatering.getDate() + wateringDays);

      const updates: Partial<Plant> = {
        location,
        window_direction: windowDirection,
        next_watering_at: nextWatering.toISOString(),
        updated_at: new Date().toISOString(),
      };

      await dbService.updatePlant(plantId, updates);
      updatePlant(plantId, updates);

      Alert.alert(
        t('common.success'),
        t('edit.saveSuccess'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      logger.error('Error saving plant:', error);
      Alert.alert(t('common.error'), t('edit.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  // Load enhanced care recommendations with real-time updates
  useEffect(() => {
    const loadEnhancedCare = async () => {
      if (!plant) {
        setEnhancedCare(null);
        return;
      }

      // Use species_id if available, otherwise use a default generic plant
      const plantDbId = plant.species_id || 'snake_plant';

      if (!plant.species_id) {
        logger.warn(`Plant ${plant.id} missing species_id, using default: ${plantDbId}`);
      }

      setIsLoadingCare(true);
      try {
        logger.info(`🌿 Loading enhanced care for ${plantDbId} in ${location} (${windowDirection})`);

        const recommendation = await getPersonalizedCareRecommendations(
          plantDbId,
          location as any,
          windowDirection as any,
          true // Include weather
        );

        setEnhancedCare(recommendation);
        logger.info(`✅ Enhanced care loaded: ${recommendation.score.stars} (${recommendation.score.scoreText})`);
      } catch (error) {
        logger.error('Error loading enhanced care:', error);
        setEnhancedCare(null);
      } finally {
        setIsLoadingCare(false);
      }
    };

    loadEnhancedCare();
  }, [plant, location, windowDirection]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.formGroup}>
            <Text style={styles.sectionTitle}>{t('addPlant.whereWillPlantLive')}</Text>
            <View style={styles.optionsGrid}>
              {PLANT_LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc.value}
                  style={[
                    styles.optionCard,
                    location === loc.value && styles.optionCardSelected,
                  ]}
                  onPress={() => setLocation(loc.value)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[
                      styles.optionText,
                      location === loc.value && styles.optionTextSelected,
                    ]}>
                      {isRTL ? loc.labelAr : loc.label}
                    </Text>
                    {bestLocation === loc.value && (
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
                      windowDirection === direction.value && styles.compassDirectionSelected,
                    ]}
                    onPress={() => setWindowDirection(direction.value)}
                  >
                    {(direction.value === 'north' || direction.value === 'south') ? (
                      <View style={styles.compassBilingualContainer}>
                        {direction.value === 'north' ? (
                          <>
                            <Text style={[styles.compassEnglishLetter, windowDirection === direction.value && styles.compassTextSelected]}>
                              {direction.value.charAt(0).toUpperCase()}
                            </Text>
                            <Text style={[styles.compassArabicText, windowDirection === direction.value && styles.compassTextSelected]}>
                              {direction.labelAr}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text style={[styles.compassArabicText, windowDirection === direction.value && styles.compassTextSelected]}>
                              {direction.labelAr}
                            </Text>
                            <Text style={[styles.compassEnglishLetter, windowDirection === direction.value && styles.compassTextSelected]}>
                              {direction.value.charAt(0).toUpperCase()}
                            </Text>
                          </>
                        )}
                      </View>
                    ) : (
                      <Text style={[styles.compassText, windowDirection === direction.value && styles.compassTextSelected]}>
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
                {t('addPlant.selectedDirection')} {t(`addPlant.directions.${windowDirection}`)}
              </Text>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.formGroup}>
            {enhancedCare && (
              <View style={styles.tipsContainer}>
                {enhancedCare.warnings.map((warning, idx) => (
                  <View key={`warn-${idx}`} style={[styles.tipCard, warning.type === 'danger' && styles.tipCardDanger]}>
                    <Ionicons name={warning.type === 'danger' ? 'alert-circle-outline' : 'information-circle-outline'} size={20} color={warning.type === 'danger' ? COLORS.error : COLORS.primary} />
                    <Text style={styles.tipText}>{warning.message}</Text>
                  </View>
                ))}
                <View style={styles.tipCard}>
                  <Ionicons name="water-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.tipText}>{enhancedCare.adjusted.watering}</Text>
                </View>
                <View style={styles.tipCard}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.tipText}>{enhancedCare.adjusted.wateringFrequency}</Text>
                </View>
                {enhancedCare.tips.length > 0 && (
                  <View style={styles.tipCard}>
                    <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.tipText}>{enhancedCare.tips[0]}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  if (isLoading || !plant) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* 1. FIXED HEADER BANNER */}
        <View style={styles.layoutHeader}>
          <View style={styles.headerCard}>
            <View style={styles.headerContentRow}>
              <PlantImage
                plantId={plant.species_id || plant.plant_id}
                capturedImageUri={plant.captured_image_uri}
                imageUrl={plant.image_url}
                plantName={plant.common_name || plant.nickname}
                size={FIBONACCI.XXL}
                style={styles.headerImage}
              />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>✓ {plant.common_name || plant.nickname}</Text>
                <Text style={styles.headerSubtitle}>{plant.plant_type || 'Plant'}</Text>
              </View>
            </View>

            {showFullCareGuide && plant.plant_info && (
              <View style={styles.descriptionExpanded}>
                <Text style={styles.plantDescription}>
                  {plant.plant_info}
                </Text>
              </View>
            )}

            {plant.plant_info && (
              <TouchableOpacity onPress={() => setShowFullCareGuide(!showFullCareGuide)} style={styles.viewMoreButton}>
                <Ionicons
                  name={showFullCareGuide ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 2. HERO: LOCATION RATING (FIXED) */}
        <View style={styles.layoutHero}>
          {(enhancedCare || isLoadingCare) && (
            <View style={styles.heroContainer}>
              {isLoadingCare ? (
                <View style={styles.heroLoadingState}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.heroLoadingText}>{t('addPlant.calculatingScore')}</Text>
                </View>
              ) : enhancedCare && (
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <LinearGradient
                    colors={getScoreGradient(enhancedCare.score.score)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroGradientCard}
                  >
                    {/* Headline */}
                    <Text style={styles.heroHeadline}>{t('addPlant.locationRating')}</Text>

                    {/* Main Row: Stars + Score Text */}
                    <View style={styles.heroMainRow}>
                      <Text style={styles.heroStars}>{enhancedCare.score.stars}</Text>
                      <Text style={styles.heroScoreText}>{
                        enhancedCare.score.score === 5 ? t('addPlant.scores.excellent') :
                        enhancedCare.score.score === 4 ? t('addPlant.scores.veryGood') :
                        enhancedCare.score.score === 3 ? t('addPlant.scores.good') :
                        enhancedCare.score.score === 2 ? t('addPlant.scores.challenging') :
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
          style={styles.layoutContentScrollView}
          contentContainerStyle={styles.layoutContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
              ((currentStep === 1 && !location) || (currentStep === 2 && !windowDirection) || isSaving) && styles.footerButtonPrimaryDisabled
            ]}
            disabled={
              (currentStep === 1 && !location) ||
              (currentStep === 2 && !windowDirection) ||
              isSaving
            }
            onPress={currentStep === 3 ? handleSave : () => setCurrentStep(currentStep + 1)}
          >
            <Text style={[
              styles.footerButtonText,
              styles.footerButtonPrimaryText,
              ((currentStep === 1 && !location) || (currentStep === 2 && !windowDirection) || isSaving) && styles.footerButtonPrimaryTextDisabled
            ]}>
              {currentStep === 3 ? (isSaving ? t('common.loading') : (isRTL ? 'حفظ التغييرات' : 'Save Changes')) : (isRTL ? 'التالي' : 'Next')}
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
    margin: FIBONACCI.MD,
    padding: FIBONACCI.MD,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: FIBONACCI.SM,
  },
  headerImage: {
    width: FIBONACCI.XXL,
    height: FIBONACCI.XXL,
    borderRadius: FIBONACCI.XXL / 2, // 27.5px (was 30 hardcoded - circular image)
    marginRight: FIBONACCI.LG, // Increased from MD (13) to LG (21) for more space
    flexShrink: 0, // Prevent image from shrinking
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center', // Center text vertically with image
    paddingRight: FIBONACCI.MD, // Add padding to prevent text from reaching edge
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
    color: COLORS.success,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.textSecondary,
  },
  viewMoreButton: {
    alignSelf: 'center',
    paddingVertical: FIBONACCI.SM,
    paddingHorizontal: FIBONACCI.MD,
    marginTop: FIBONACCI.XXS,
  },
  plantDescription: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.text,
    lineHeight: FIBONACCI.LG,
  },
  // New Layout Styles
  layoutHeader: {
    paddingBottom: FIBONACCI.LG,
    justifyContent: 'center',
  },
  layoutHero: {
    justifyContent: 'center',
    paddingHorizontal: FIBONACCI.MD,
  },
  layoutContentScrollView: {
    flex: 1,
  },
  layoutContentContainer: {
    justifyContent: 'center',
    paddingVertical: FIBONACCI.MD,
    paddingBottom: FIBONACCI.XXL, // 55px (was 100px hardcoded - now uses Fibonacci for proper scaling)
  },
  stepContentContainer: {
    justifyContent: 'center',
  },
  formGroup: {
    marginHorizontal: FIBONACCI.MD,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.MD,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: FIBONACCI.MD,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: FIBONACCI.SM,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    padding: FIBONACCI.MD,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  optionCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: TYPOGRAPHY.SM,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.white,
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
    width: FIBONACCI.XXL, // 55px (was 63 hardcoded - Fibonacci-compliant)
    height: FIBONACCI.XXL, // 55px
    backgroundColor: COLORS.white,
    borderRadius: FIBONACCI.XXL / 2, // 27.5px (was 31.5 hardcoded - circular button)
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassDirectionNS: {
    width: FIBONACCI.XXXL,
    height: FIBONACCI.XXL,
    borderRadius: FIBONACCI.XL, // 34px (was 35 hardcoded - Fibonacci-compliant)
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
    gap: FIBONACCI.SM,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: FIBONACCI.MD,
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
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.text,
    lineHeight: FIBONACCI.LG,
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
  // Location Rating Hero - COMPACT PREMIUM DESIGN
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
    fontSize: TYPOGRAPHY.LG, // 21px (was 20 hardcoded - Fibonacci typography scale)
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
    height: ELEMENT_SIZES.BUTTON_MD, // 55px (was hardcoded - uses standard button height)
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
  recommendedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: FIBONACCI.MD, // 13px
    height: FIBONACCI.MD,
    borderRadius: FIBONACCI.MD / 2,
    backgroundColor: '#EF4444', // Red
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
    fontSize: FIBONACCI.SM, // 8px
    fontWeight: '700',
  },
  compassRecommendedBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: FIBONACCI.MD,
    height: FIBONACCI.MD,
    borderRadius: FIBONACCI.MD / 2,
    backgroundColor: '#EF4444',
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
    fontSize: FIBONACCI.SM,
    fontWeight: '700',
  },
});