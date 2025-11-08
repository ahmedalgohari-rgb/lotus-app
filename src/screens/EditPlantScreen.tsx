import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { logger } from '../utils/logger';

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
import { getCareRecommendations, getCareRecommendationTranslated, getCurrentSeason, getPersonalizedCareRecommendations } from '../utils/careMap';

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
  const [isCareGuideExpanded, setIsCareGuideExpanded] = useState(false);
  const [isCareTipsExpanded, setIsCareTipsExpanded] = useState(false);

  useEffect(() => {
    const foundPlant = plants.find(p => p.id === plantId);
    if (foundPlant) {
      setPlant(foundPlant);
      setLocation(foundPlant.location);
      setWindowDirection(foundPlant.window_direction);
    }
    setIsLoading(false);
  }, [plantId, plants]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const updates: Partial<Plant> = {
        location,
        window_direction: windowDirection,
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

  const getCareMapRecommendations = () => {
    const currentSeason = getCurrentSeason();
    const careRecs = getCareRecommendations(location, windowDirection, currentSeason);
    return getCareRecommendationTranslated(careRecs, isRTL);
  };

  // Load enhanced care recommendations with real-time updates
  const loadEnhancedCare = async () => {
    if (!plant) {
      logger.warn('Cannot load enhanced care: missing plant');
      return;
    }

    // Use species_id if available, otherwise use a default generic plant
    const plantId = plant.species_id || 'snake_plant';

    if (!plant.species_id) {
      logger.warn(`Plant ${plant.id} missing species_id, using default: ${plantId}`);
    }

    setIsLoadingCare(true);
    try {
      logger.info(`🌿 Loading enhanced care for ${plantId} in ${location} (${windowDirection})`);

      const recommendation = await getPersonalizedCareRecommendations(
        plantId,
        location as 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony' | 'office',
        windowDirection as 'north' | 'east' | 'south' | 'west',
        true // Include weather
      );

      setEnhancedCare(recommendation);
      logger.info(`✅ Enhanced care loaded: ${recommendation.score.stars} (${recommendation.score.scoreText})`);
    } catch (error) {
      logger.error('Error loading enhanced care:', error);
      // Graceful fallback - keep using old care map display
    } finally {
      setIsLoadingCare(false);
    }
  };

  // Load enhanced care when plant is loaded or when location/direction changes
  useEffect(() => {
    if (plant) {
      loadEnhancedCare();
    }
  }, [plant?.id, location, windowDirection]);

  if (isLoading || !plant) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{isRTL ? 'إعادة توجيه النبتة' : 'Reorient Plant'}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.forwardButton}
          >
            <Ionicons name="arrow-forward" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Plant Preview Section */}
        <View style={styles.previewSection}>
          <View style={styles.identificationInfo}>
            <Text style={styles.identifiedName}>
              {plant?.common_name || plant?.nickname || 'My Plant'}
            </Text>
            {plant?.scientific_name && (
              <Text style={styles.scientificName}>
                {plant.scientific_name}
              </Text>
            )}

            {/* Plant Care Information - Collapsible Section */}
            {(plant?.plant_info || plant?.plant_type) && (
              <View style={styles.careInfoSection}>
                <TouchableOpacity
                  style={styles.careHeader}
                  onPress={() => setIsCareGuideExpanded(!isCareGuideExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.careTitle}>
                    {isRTL ? 'دليل العناية' : 'Care Guide'}
                  </Text>
                  <Ionicons
                    name={isCareGuideExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>

                {isCareGuideExpanded && (
                  <View>
                    {plant.plant_info && (
                      <Text style={styles.plantDescription}>
                        {plant.plant_info}
                      </Text>
                    )}

                    <View style={styles.careDetails}>
                      {plant.plant_type && (
                        <View style={styles.careItem}>
                          <Ionicons name="leaf" size={16} color={COLORS.primary} />
                          <Text style={styles.careLabel}>
                            {isRTL ? 'النوع' : 'Type'}
                          </Text>
                          <Text style={styles.careValue}>
                            {plant.plant_type.charAt(0).toUpperCase() + plant.plant_type.slice(1)}
                          </Text>
                        </View>
                      )}

                      {plant.watering_schedule && (
                        <View style={styles.careItem}>
                          <Ionicons name="water" size={16} color={COLORS.primary} />
                          <Text style={styles.careLabel}>
                            {isRTL ? 'الري' : 'Watering'}
                          </Text>
                          <Text style={styles.careValue}>
                            {plant.watering_schedule}
                          </Text>
                        </View>
                      )}

                      {plant.preferred_humidity && (
                        <View style={styles.careItem}>
                          <Ionicons name="cloud" size={16} color={COLORS.primary} />
                          <Text style={styles.careLabel}>
                            {isRTL ? 'الرطوبة' : 'Humidity'}
                          </Text>
                          <Text style={styles.careValue}>
                            {plant.preferred_humidity.charAt(0).toUpperCase() + plant.preferred_humidity.slice(1)}
                          </Text>
                        </View>
                      )}

                      {plant.preferred_orientation && (
                        <View style={styles.careItem}>
                          <Ionicons name="sunny" size={16} color={COLORS.primary} />
                          <Text style={styles.careLabel}>
                            {isRTL ? 'الإضاءة' : 'Light'}
                          </Text>
                          <Text style={styles.careValue}>
                            {plant.preferred_orientation}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Adjusted Care Tips Section - Collapsible */}
          {enhancedCare && (
            <View style={styles.careInfoSection}>
              <TouchableOpacity
                style={styles.careHeader}
                onPress={() => setIsCareTipsExpanded(!isCareTipsExpanded)}
                activeOpacity={0.7}
              >
                <Text style={styles.careTitle}>
                  {isRTL ? 'نصائح العناية المخصصة' : 'Adjusted Care Tips'}
                </Text>
                <Ionicons
                  name={isCareTipsExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

              {isCareTipsExpanded && (
                <View style={styles.careTipsContent}>
                  <View style={styles.tipCard}>
                    <Ionicons name="water-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.tipText}>
                      {enhancedCare.adjusted.watering}
                    </Text>
                  </View>

                  <View style={styles.tipCard}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.tipText}>
                      {enhancedCare.adjusted.wateringFrequency}
                    </Text>
                  </View>

                  {enhancedCare.tips.length > 0 && (
                    <View style={styles.tipCard}>
                      <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
                      <Text style={styles.tipText}>
                        {enhancedCare.tips[0]}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>
            {isRTL ? 'ضبط الموقع' : 'Customize Location'}
          </Text>
          {/* Plant Location */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('addPlant.plantLocation')}</Text>
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
                  <Text style={[
                    styles.optionText,
                    location === loc.value && styles.optionTextSelected,
                  ]}>
                    {loc.label}
                  </Text>
                  <Text style={[
                    styles.optionTextAr,
                    location === loc.value && styles.optionTextArSelected,
                  ]}>
                    {loc.labelAr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Window Direction */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('addPlant.windowDirection')}</Text>
            
            <View style={styles.compassContainer}>
              <View style={styles.compass}>
                {WINDOW_DIRECTIONS.map((direction) => (
                  <TouchableOpacity
                    key={direction.value}
                    style={[
                      styles.compassDirection,
                      (styles as any)[`compass${direction.value.charAt(0).toUpperCase() + direction.value.slice(1)}`],
                      windowDirection === direction.value && styles.compassDirectionSelected,
                    ]}
                    onPress={() => setWindowDirection(direction.value)}
                  >
                    {(direction.value === 'north' || direction.value === 'south') ? (
                      <View style={styles.compassBilingualContainer}>
                        {direction.value === 'north' ? (
                          <>
                            <Text style={[
                              styles.compassEnglishLetter,
                              windowDirection === direction.value && styles.compassTextSelected,
                            ]}>
                              {direction.value.charAt(0).toUpperCase()}
                            </Text>
                            <Text style={[
                              styles.compassArabicText,
                              windowDirection === direction.value && styles.compassTextSelected,
                              { fontFamily: 'DecotypeNaskhSwashes' }
                            ]}>
                              {direction.labelAr}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text style={[
                              styles.compassArabicText,
                              windowDirection === direction.value && styles.compassTextSelected,
                              { fontFamily: 'DecotypeNaskhSwashes' }
                            ]}>
                              {direction.labelAr}
                            </Text>
                            <Text style={[
                              styles.compassEnglishLetter,
                              windowDirection === direction.value && styles.compassTextSelected,
                            ]}>
                              {direction.value.charAt(0).toUpperCase()}
                            </Text>
                          </>
                        )}
                      </View>
                    ) : (
                      <Text style={[
                        styles.compassText,
                        windowDirection === direction.value && styles.compassTextSelected,
                      ]}>
                        {direction.value.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
                
                <View style={styles.compassCenter}>
                  <Text style={styles.compassCenterIcon}>🧭</Text>
                </View>
              </View>
              
              <Text style={styles.selectedDirection}>
                {t('addPlant.selectedDirection')} {t(`addPlant.directions.${windowDirection}`)}
              </Text>
            </View>
          </View>

          {/* 🌿 Smart Placement Analysis (Phase 15.0) - Matching AddPlantScreen */}
          {enhancedCare ? (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Smart Placement Analysis</Text>

              {/* Placement Score Card with Color-Coded Background */}
              <View style={[
                styles.placementScoreCard,
                enhancedCare.score.score <= 2 && styles.placementScoreDanger,
                enhancedCare.score.score === 3 && styles.placementScoreWarning,
                enhancedCare.score.score >= 4 && styles.placementScoreGood,
              ]}>
                <View style={styles.placementScoreHeader}>
                  <Text style={styles.placementScoreStars}>{enhancedCare.score.stars}</Text>
                  <Text style={styles.placementScoreText}>{enhancedCare.score.scoreText}</Text>
                </View>

                {/* Weather Conditions Inline */}
                {enhancedCare.weatherContext && (
                  <Text style={styles.weatherConditions}>
                    📍 Cairo: {enhancedCare.weatherContext.temperature}°C, {enhancedCare.weatherContext.humidity}% humidity
                  </Text>
                )}
              </View>

              {/* Warnings */}
              {enhancedCare.warnings.length > 0 && (
                <View style={styles.warningsContainer}>
                  {enhancedCare.warnings.map((warning, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.warningCard,
                        warning.type === 'danger' && styles.warningCardDanger,
                      ]}
                    >
                      <Text style={styles.warningIcon}>{warning.icon}</Text>
                      <Text style={styles.warningText}>{warning.message}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : isLoadingCare ? (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Analyzing placement...</Text>
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>🌿 Checking Cairo weather...</Text>
              </View>
            </View>
          ) : (
              // Fallback to old care map while loading
              <View style={styles.tipsContainer}>
                {(() => {
                  const careMap = getCareMapRecommendations();
                  return (
                    <>
                      <View style={styles.tipCard}>
                        <Ionicons name="water-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.tipText}>
                          Watering: {careMap.watering}
                        </Text>
                      </View>

                      <View style={styles.tipCard}>
                        <Ionicons name="sunny-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.tipText}>
                          Light: {careMap.light} near {careMap.placement}
                        </Text>
                      </View>

                      <View style={styles.tipCard}>
                        <Ionicons name="cloud-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.tipText}>
                          Humidity: {careMap.humidity}
                        </Text>
                      </View>
                    </>
                  );
                })()}
              </View>
            )}

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButtonLarge,
              isSaving && styles.saveButtonLargeDisabled,
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={24}
              color={isSaving ? COLORS.textSecondary : COLORS.white}
            />
            <Text style={[
              styles.saveButtonLargeText,
              isSaving && styles.saveButtonLargeTextDisabled,
            ]}>
              {isSaving ? t('common.loading') : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Merged styles from AddPlantScreen and EditPlantScreen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: FIBONACCI.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: 'relative',
    height: ELEMENT_SIZES.INPUT_MD,
  },
  backButton: {
    paddingHorizontal: FIBONACCI.LG,
    paddingVertical: FIBONACCI.SM,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forwardButton: {
    paddingHorizontal: FIBONACCI.LG,
    paddingVertical: FIBONACCI.SM,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.MD,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  form: {
    padding: FIBONACCI.LG,
  },
  formGroup: {
    marginBottom: FIBONACCI.XL,
  },
  label: {
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: FIBONACCI.XXS,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: FIBONACCI.MD,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    padding: FIBONACCI.MD,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    borderWidth: 2,
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
  optionTextAr: {
    fontSize: TYPOGRAPHY.SM,
    fontWeight: '400',
    color: COLORS.text,
  },
  optionTextArSelected: {
    color: COLORS.white,
  },
  compassContainer: {
    alignItems: 'center',
  },
  compass: {
    width: GOLDEN_RECTANGLES.LARGE.width,
    height: GOLDEN_RECTANGLES.LARGE.width,
    position: 'relative',
    backgroundColor: COLORS.background,
    borderRadius: GOLDEN_RECTANGLES.LARGE.width / 2,
    marginBottom: FIBONACCI.MD,
  },
  compassDirection: {
    position: 'absolute',
    width: ELEMENT_SIZES.BUTTON_MD,
    height: ELEMENT_SIZES.BUTTON_MD,
    backgroundColor: COLORS.white,
    borderRadius: ELEMENT_SIZES.BUTTON_MD / 2,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassDirectionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  compassNorth: {
    top: -FIBONACCI.SM,
    left: '50%',
    marginLeft: -(FIBONACCI.XXXL / 2),
    width: FIBONACCI.XXXL,
    height: ELEMENT_SIZES.BUTTON_MD,
    borderRadius: FIBONACCI.LG,
    paddingHorizontal: FIBONACCI.XS,
    paddingTop: FIBONACCI.XXS,
    paddingBottom: FIBONACCI.XS,
  },
  compassEast: {
    right: 0,
    top: '50%',
    marginTop: -(ELEMENT_SIZES.BUTTON_MD / 2),
  },
  compassSouth: {
    bottom: -FIBONACCI.SM,
    left: '50%',
    marginLeft: -(FIBONACCI.XXXL / 2),
    width: FIBONACCI.XXXL,
    height: ELEMENT_SIZES.BUTTON_MD,
    borderRadius: FIBONACCI.LG,
    paddingHorizontal: FIBONACCI.XS,
    paddingTop: FIBONACCI.XXS,
    paddingBottom: FIBONACCI.XS,
  },
  compassWest: {
    left: 0,
    top: '50%',
    marginTop: -(ELEMENT_SIZES.BUTTON_MD / 2),
  },
  compassText: {
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
    color: COLORS.text,
  },
  compassTextSelected: {
    color: COLORS.white,
  },
  compassBilingualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: FIBONACCI.XXS,
    width: '100%',
    height: '100%',
  },
  compassArabicText: {
    fontSize: TYPOGRAPHY.SM + 1,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    width: '100%',
    includeFontPadding: false,
    lineHeight: FIBONACCI.LG,
    marginLeft: FIBONACCI.MD,
  },
  compassEnglishLetter: {
    fontSize: TYPOGRAPHY.MD,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  compassCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -FIBONACCI.XL / 2,
    marginLeft: -FIBONACCI.XL / 2,
    width: FIBONACCI.XL,
    height: FIBONACCI.XL,
    backgroundColor: COLORS.primary,
    borderRadius: FIBONACCI.XL / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassCenterIcon: {
    fontSize: FIBONACCI.LG,
  },
  selectedDirection: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.primary,
    fontWeight: '500',
  },
  tipsContainer: {
    gap: FIBONACCI.MD,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: FIBONACCI.MD,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    gap: FIBONACCI.MD,
  },
  tipText: {
    flex: 1,
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.text,
    lineHeight: FIBONACCI.LG,
  },
  saveButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: FIBONACCI.MD,
    paddingHorizontal: FIBONACCI.LG,
    borderRadius: ELEMENT_SIZES.RADIUS_LG,
    gap: FIBONACCI.SM,
    marginTop: FIBONACCI.MD,
    height: ELEMENT_SIZES.BUTTON_MD,
  },
  saveButtonLargeDisabled: {
    backgroundColor: COLORS.border,
  },
  saveButtonLargeText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
  },
  saveButtonLargeTextDisabled: {
    color: COLORS.textSecondary,
  },
  bottomPadding: {
    height: FIBONACCI.LG,
  },

  // 🌿 Phase 15.0: Smart Placement Analysis Styles (Matching AddPlantScreen)
  placementScoreCard: {
    backgroundColor: COLORS.background,
    padding: FIBONACCI.MD, // 13px
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px
    marginBottom: FIBONACCI.MD, // 13px
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  placementScoreDanger: {
    backgroundColor: '#FFEBEE',
    borderColor: COLORS.error,
  },
  placementScoreWarning: {
    backgroundColor: '#FFF3E0',
    borderColor: COLORS.warning,
  },
  placementScoreGood: {
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.success,
  },
  placementScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: FIBONACCI.SM, // 8px
    marginBottom: FIBONACCI.XS, // 5px
  },
  placementScoreStars: {
    fontSize: TYPOGRAPHY.XL, // 24px
    letterSpacing: 2,
  },
  placementScoreText: {
    fontSize: TYPOGRAPHY.LG, // 21px
    fontWeight: '700',
    color: COLORS.text,
  },
  weatherConditions: {
    fontSize: TYPOGRAPHY.XS, // 12px
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Warnings Section (Matching AddPlantScreen)
  warningsContainer: {
    gap: FIBONACCI.SM, // 8px
    marginBottom: FIBONACCI.MD, // 13px
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: FIBONACCI.MD, // 13px
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px
    gap: FIBONACCI.SM, // 8px
  },
  warningCardDanger: {
    backgroundColor: '#FFEBEE',
  },
  warningIcon: {
    fontSize: TYPOGRAPHY.MD, // 18px
  },
  warningText: {
    flex: 1,
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.text,
    lineHeight: FIBONACCI.LG, // 21px
  },

  // Loading State
  loadingContainer: {
    padding: FIBONACCI.LG, // 21px
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.textSecondary,
  },

  // Plant Preview Section (matching AddPlantScreen)
  previewSection: {
    paddingHorizontal: FIBONACCI.LG, // 21px
    paddingTop: FIBONACCI.LG, // 21px
  },
  previewImage: {
    width: '100%',
    height: GOLDEN_RECTANGLES.LARGE.height, // Golden ratio height
    borderRadius: ELEMENT_SIZES.RADIUS_LG, // 21px
    marginBottom: FIBONACCI.MD, // 13px
  },
  identificationInfo: {
    backgroundColor: COLORS.background,
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px
    padding: FIBONACCI.MD, // 13px
    marginBottom: FIBONACCI.MD, // 13px
  },
  identifiedName: {
    fontSize: TYPOGRAPHY.LG, // 21px
    fontWeight: '700',
    color: COLORS.success,
    textAlign: 'center',
    marginBottom: FIBONACCI.XXS, // 3px
  },
  scientificName: {
    fontSize: TYPOGRAPHY.SM, // 14px
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: FIBONACCI.MD, // 13px
  },

  // Care Guide Section
  careInfoSection: {
    backgroundColor: COLORS.white,
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  careHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: FIBONACCI.MD, // 13px
    backgroundColor: COLORS.background,
  },
  careTitle: {
    fontSize: TYPOGRAPHY.BASE, // 16px
    fontWeight: '600',
    color: COLORS.primary,
  },
  plantDescription: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.text,
    lineHeight: FIBONACCI.LG, // 21px
    padding: FIBONACCI.MD, // 13px
    paddingTop: FIBONACCI.SM, // 8px
    textAlign: 'center',
  },
  careDetails: {
    padding: FIBONACCI.MD, // 13px
    paddingTop: FIBONACCI.SM, // 8px
    gap: FIBONACCI.SM, // 8px
  },
  careItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: FIBONACCI.MD, // 13px
    borderRadius: ELEMENT_SIZES.RADIUS_SM, // 8px
    gap: FIBONACCI.SM, // 8px
  },
  careLabel: {
    fontSize: TYPOGRAPHY.SM, // 14px
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: FIBONACCI.XS, // 5px
  },
  careValue: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },

  // Care Tips Content (for collapsible Adjusted Care Tips)
  careTipsContent: {
    padding: FIBONACCI.MD, // 13px
    paddingTop: FIBONACCI.SM, // 8px
    gap: FIBONACCI.MD, // 13px
  },

  // Section Title (matching AddPlantScreen)
  sectionTitle: {
    fontSize: TYPOGRAPHY.LG, // 21px
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: FIBONACCI.LG, // 21px
  },
});