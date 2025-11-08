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

interface RouteParams {
  identificationResult?: IdentificationResult;
  capturedImage?: string;
}

export default function AddPlantScreen() {
  const [nickname, setNickname] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('living_room');
  const [selectedDirection, setSelectedDirection] = useState('east');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalVisible, setAuthModalVisible] = useState(false);
  const [showFullCareGuide, setShowFullCareGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [dbPlant, setDbPlant] = useState<Plant | null>(null);

  const [enhancedCareRec, setEnhancedCareRec] = useState<EnhancedCareRecommendation | null>(null);
  const [careLoading, setCareLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { identificationResult, capturedImage } = (route.params as RouteParams) || {};
  const { user, addPlant } = useStore();
  const isRTL = useRTL();

  useEffect(() => {
    if (identificationResult) {
      const allPlants = plantDatabaseService.getAllPlants();
      const foundPlant = allPlants.find(p => 
        p.names.common.some(name => name.toLowerCase() === identificationResult.common_name.toLowerCase())
      );

      if (foundPlant) {
        setDbPlant(foundPlant);
        setNickname(foundPlant.names.common[0] || 'My Plant');
      } else {
        console.warn(`Plant "${identificationResult.common_name}" not found in local DB, falling back to snake_plant.`);
        setDbPlant(plantDatabaseService.getPlantById('snake_plant'));
        setNickname(identificationResult.common_name || 'My Plant');
      }
    }
  }, [identificationResult]);

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

  const handleSave = async () => {
    if (!user || user.id.startsWith('guest-')) {
      setAuthModalVisible(true);
      return;
    }

    const finalNickname = nickname.trim() || (dbPlant?.names.common[0] || 'My Plant');

    setIsLoading(true);

    try {
      let imageUrl = '';
      if (capturedImage) {
        try {
          imageUrl = await dbService.uploadImage({
            uri: capturedImage,
            type: 'image/jpeg',
            name: `plant-${Date.now()}.jpg`,
          });
        } catch (uploadError) {
          logger.error('Error uploading image:', uploadError);
          Alert.alert('Image Upload Failed', 'The plant data will be saved without the image.');
        }
      }

      const nextWatering = new Date();
      nextWatering.setDate(nextWatering.getDate() + 7);

      const newPlant = {
        user_id: user.id,
        nickname: finalNickname,
        location: selectedLocation as any,
        window_direction: selectedDirection as any,
        image_url: imageUrl,
        next_watering_at: nextWatering.toISOString(),
        common_name: dbPlant?.names.common[0] || null,
        scientific_name: dbPlant?.names.scientific[0] || null,
        plant_type: dbPlant?.care.plant_type || null,
        watering_schedule: dbPlant?.care.watering.schedule || null,
        preferred_humidity: dbPlant?.care.humidity || null,
        preferred_orientation: dbPlant?.care.light.requirement || null,
        species_id: dbPlant?.id || null,
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
                  <Text style={[styles.optionText, selectedLocation === location.value && styles.optionTextSelected]}>
                    {isRTL ? location.labelAr : location.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.formGroup}>
            <Text style={styles.sectionTitle}>{t('addPlant.windowDirection')}</Text>
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
            <View style={{ marginTop: FIBONACCI.LG }}>
              <Text style={styles.label}>{t('addPlant.plantNickname')}</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder={dbPlant ? (isRTL ? `مثلاً: ${dbPlant.names.arabic?.[0] || dbPlant.names.common[0]} بتاعتي` : `e.g. My ${dbPlant.names.common[0]}`) : (isRTL ? 'مثلاً: زرعة الصالة' : 'e.g. Living Room Plant')}
                placeholderTextColor={COLORS.textSecondary}
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
        {/* 1. FIXED HEADER BANNER */}
        <View style={styles.layoutHeader}>
            <View style={styles.headerCard}>
                <View style={styles.headerContentRow}>
                    <Image
                        source={{ uri: capturedImage || 'https://i.imgur.com/2n3nS2Y.png' }}
                        style={styles.headerImage}
                    />
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>✓ {isRTL && dbPlant?.names.arabic ? dbPlant.names.arabic[0] : (dbPlant?.names.common[0] || 'Snake Plant')}</Text>
                        <Text style={styles.headerSubtitle}>{dbPlant?.care.plant_type || 'Succulent'}</Text>
                    </View>
                </View>

                {showFullCareGuide && dbPlant && (
                <View style={styles.descriptionExpanded}>
                    <Text style={styles.plantDescription}>
                    {isRTL && dbPlant.care.plant_info_arabic ? dbPlant.care.plant_info_arabic : dbPlant.care.plant_info}
                    </Text>
                </View>
                )}

                <TouchableOpacity onPress={() => setShowFullCareGuide(!showFullCareGuide)} style={styles.viewMoreButton}>
                    <Ionicons 
                        name={showFullCareGuide ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color={COLORS.primary} 
                    />
                </TouchableOpacity>
            </View>
        </View>

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
        <View style={styles.layoutContent}>
            <View style={styles.stepContentContainer}>
                {renderStepContent()}
            </View>
        </View>

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
    borderRadius: 30,
    marginRight: FIBONACCI.MD,
  },
  headerTextContainer: {
    flex: 1,
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
    paddingBottom: FIBONACCI.LG, // 21px
    justifyContent: 'center',
  },
  layoutHero: {
    justifyContent: 'center',
    paddingHorizontal: FIBONACCI.MD,
  },
  layoutContent: {
    flex: 1, // Takes remaining space (50%)
    justifyContent: 'center',
    paddingVertical: FIBONACCI.MD, // Added for breathing room
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
    gap: FIBONACCI.SM, // 8px
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
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    paddingHorizontal: FIBONACCI.MD,
    fontSize: TYPOGRAPHY.BASE,
    color: COLORS.text,
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
});
