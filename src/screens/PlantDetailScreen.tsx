import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ImageBackground,
  TextInput,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
  COLORS,
  PLANT_LOCATIONS,
  WINDOW_DIRECTIONS,
  CARE_EVENT_TYPES,
  CARE_CATEGORIES,
  FIBONACCI,
  TYPOGRAPHY,
  ELEMENT_SIZES,
} from '../constants';
import { useStore } from '../store';
import { dbService } from '../services/supabase';
import { Plant, CareEvent, CareRecommendation, EnhancedCareRecommendation } from '../types';
import { getCareRecommendations, getCareRecommendationTranslated, getCurrentSeason, getSeasonDisplayName, getPersonalizedCareRecommendations } from '../utils/careMap';
import { useRTL } from '../utils/rtl';
import { logger } from '../utils/logger';

interface RouteParams {
  plantId: string;
}

export default function PlantDetailScreen() {
  if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }
  const [plant, setPlant] = useState<Plant | null>(null);
  const [careHistory, setCareHistory] = useState<CareEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editableNickname, setEditableNickname] = useState('');
  const [isCareGuideExpanded, setIsCareGuideExpanded] = useState(false);
  const [enhancedCare, setEnhancedCare] = useState<EnhancedCareRecommendation | null>(null);
  const [isLoadingCare, setIsLoadingCare] = useState(false);
  const [isCareTipsExpanded, setIsCareTipsExpanded] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const { plantId } = route.params as RouteParams;
  const { plants, updatePlant, user } = useStore();
  const isRTL = useRTL();
  const { t } = useTranslation();

  useEffect(() => {
    const foundPlant = plants.find(p => p.id === plantId);
    if (foundPlant) {
      setPlant(foundPlant);
      setEditableNickname(foundPlant.nickname);
    }
    setIsLoading(false);
  }, [plantId, plants]);

  // Load enhanced care recommendations when plant data is available
  useEffect(() => {
    console.log('🔍 PlantDetailScreen - plant data:', {
      hasPlant: !!plant,
      plantId: plant?.id,
      speciesId: plant?.species_id,
      location: plant?.location,
      direction: plant?.window_direction
    });

    if (plant && plant.species_id) {
      console.log('✅ Calling loadEnhancedCare for species:', plant.species_id);
      loadEnhancedCare();
    } else {
      console.log('⚠️ NOT calling loadEnhancedCare - missing plant or species_id');
    }
  }, [plant?.id, plant?.species_id, plant?.location, plant?.window_direction]);

  const loadCareHistory = async () => {
    try {
      const { data, error } = await dbService.getCareEvents(plantId);
      if (error) throw error;
      if (data) setCareHistory(data);
    } catch (error) {
      logger.error('Error loading care history:', error);
    }
  };

  const loadEnhancedCare = async () => {
    if (!plant || !plant.species_id) {
      logger.warn('Cannot load enhanced care: missing plant or species_id');
      return;
    }

    setIsLoadingCare(true);
    try {
      logger.info(`🌿 Loading enhanced care for ${plant.species_id}`);

      const recommendation = await getPersonalizedCareRecommendations(
        plant.species_id,
        plant.location as 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony' | 'office',
        plant.window_direction as 'north' | 'east' | 'south' | 'west',
        true // Include weather
      );

      setEnhancedCare(recommendation);
      console.log('✅ Enhanced care SET:', {
        hasRecommendation: !!recommendation,
        stars: recommendation?.score?.stars,
        score: recommendation?.score?.scoreText,
        hasAdjusted: !!recommendation?.adjusted,
        watering: recommendation?.adjusted?.watering
      });
      logger.info(`✅ Enhanced care loaded: ${recommendation.score.stars} (${recommendation.score.scoreText})`);
    } catch (error) {
      logger.error('Error loading enhanced care:', error);
      // Graceful fallback - keep using old care map display
    } finally {
      setIsLoadingCare(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!plant || !editableNickname.trim() || editableNickname.trim() === plant.nickname) {
      return; // No changes to save
    }

    const oldNickname = plant.nickname;
    const newNickname = editableNickname.trim();

    try {
      // Update database
      await dbService.updatePlant(plant.id, { nickname: newNickname });

      // Update global store
      updatePlant(plant.id, { nickname: newNickname });

    } catch (error) {
      logger.error('Error updating nickname:', error);
      // Revert optimistic update on error
      const revertedPlant = { ...plant, nickname: oldNickname };
      setPlant(revertedPlant);
      updatePlant(plant.id, { nickname: oldNickname });
      Alert.alert('Error', 'Failed to update nickname.');
    }
  };

  const handleToggleEdit = () => {
    LayoutAnimation.spring();
    if (isEditingNickname) {
      handleSaveNickname();
    }
    setIsEditingNickname(!isEditingNickname);
  };

  const handleCareAction = async (eventType: 'water' | 'fertilize' | 'prune' | 'repot') => {
    if (!plant || !user) return;

    try {
      const now = new Date().toISOString();
      
      // Add care event
      await dbService.addCareEvent({
        plant_id: plant.id,
        user_id: user.id,
        event_type: eventType,
        completed_at: now,
      });

      // Update plant if watering
      if (eventType === 'water') {
        const nextWatering = new Date();
        nextWatering.setDate(nextWatering.getDate() + 7); // Default 7 days
        
        const updatedPlant = {
          ...plant,
          last_watered_at: now,
          next_watering_at: nextWatering.toISOString(),
        };

        await dbService.updatePlant(plant.id, {
          last_watered_at: now,
          next_watering_at: nextWatering.toISOString(),
        });

        updatePlant(plant.id, updatedPlant);
        setPlant(updatedPlant);
      }

      // Refresh care history
      await loadCareHistory();

      const actionName = CARE_EVENT_TYPES.find(c => c.value === eventType)?.label || eventType;
      Alert.alert('✅ Done!', `${actionName} completed for ${plant.nickname}`);
    } catch (error) {
      logger.error('Error recording care action:', error);
      Alert.alert('Error', 'Failed to record care action. Please try again.');
    }
  };

  const getLocationLabel = (location: string) => {
    const found = PLANT_LOCATIONS.find(l => l.value === location);
    return found ? found.label : location;
  };

  const getDirectionLabel = (direction: string) => {
    const found = WINDOW_DIRECTIONS.find(d => d.value === direction);
    return found ? found.label : direction;
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return COLORS.success;
      case 'needs_attention': return COLORS.warning;
      case 'critical': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getDaysUntilWatering = () => {
    if (!plant?.next_watering_at) return null;
    const today = new Date();
    const wateringDate = new Date(plant.next_watering_at);
    const diffTime = wateringDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get dynamic care recommendations based on plant's room and current season
  const getCareMapRecommendations = (): CareRecommendation => {
    if (!plant) return { light: '', placement: '', watering: '', humidity: '' };

    const currentSeason = getCurrentSeason();
    const baseRecommendations = getCareRecommendations(plant.location, currentSeason);
    const translatedRecommendations = getCareRecommendationTranslated(baseRecommendations, isRTL);

    return translatedRecommendations;
  };

  if (isLoading || !plant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading plant details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const daysUntilWatering = getDaysUntilWatering();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={{ uri: plant.image_url || undefined }}
          style={styles.headerImage}
          resizeMode="cover"
        >
          <View style={styles.headerOverlay}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              {isEditingNickname ? (
                <TextInput
                  style={styles.headerTitleInput}
                  value={editableNickname}
                  onChangeText={setEditableNickname}
                  autoFocus={true}
                  onBlur={handleToggleEdit}
                />
              ) : (
                <Text style={styles.headerTitleText}>{editableNickname}</Text>
              )}
              <TouchableOpacity onPress={handleToggleEdit} style={styles.headerButton}>
                <Ionicons name={isEditingNickname ? "checkmark" : "create-outline"} size={24} color="white" />
              </TouchableOpacity>
            </View>
            <View style={[styles.newHealthBadge, { backgroundColor: getHealthColor(plant.health_status) }]}>
              <Text style={styles.newHealthBadgeText}>
                {plant.health_status.replace('_', ' ')}
              </Text>
            </View>
          </View>
        </ImageBackground>

        {/* Plant Info */}
        <View style={styles.content}>
          <Text style={[styles.plantName, isRTL && styles.plantNameRTL]}>{plant.common_name || 'Unknown Plant'}</Text>
          <Text style={[styles.plantSubtitle, isRTL && styles.plantSubtitleRTL]}>
            {getLocationLabel(plant.location)} • {getDirectionLabel(plant.window_direction)} window
          </Text>

          {/* Collapsible Care Guide Section */}
          {(plant.plant_info || plant.plant_type || plant.watering_schedule || plant.preferred_humidity || plant.preferred_orientation) && (
            <View style={styles.careGuideSection}>
              <TouchableOpacity
                style={styles.careGuideHeader}
                onPress={() => setIsCareGuideExpanded(!isCareGuideExpanded)}
                activeOpacity={0.7}
              >
                <Text style={[styles.careGuideTitle, isRTL && styles.careGuideTitleRTL]}>
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
                    <Text style={[styles.careGuideDescription, isRTL && styles.careGuideDescriptionRTL]}>
                      {plant.plant_info}
                    </Text>
                  )}

                  <View style={styles.careGuideDetails}>
                    {plant.plant_type && (
                      <View style={[styles.careGuideItem, isRTL && styles.careGuideItemRTL]}>
                        <Ionicons name="leaf" size={16} color={COLORS.primary} />
                        <Text style={[styles.careGuideLabel, isRTL && styles.careGuideLabelRTL]}>
                          {isRTL ? 'النوع' : 'Type'}
                        </Text>
                        <Text style={[styles.careGuideValue, isRTL && styles.careGuideValueRTL]}>
                          {plant.plant_type.charAt(0).toUpperCase() + plant.plant_type.slice(1)}
                        </Text>
                      </View>
                    )}

                    {plant.watering_schedule && (
                      <View style={[styles.careGuideItem, isRTL && styles.careGuideItemRTL]}>
                        <Ionicons name="water" size={16} color={COLORS.primary} />
                        <Text style={[styles.careGuideLabel, isRTL && styles.careGuideLabelRTL]}>
                          {isRTL ? 'الري' : 'Watering'}
                        </Text>
                        <Text style={[styles.careGuideValue, isRTL && styles.careGuideValueRTL]}>
                          {plant.watering_schedule}
                        </Text>
                      </View>
                    )}

                    {plant.preferred_humidity && (
                      <View style={[styles.careGuideItem, isRTL && styles.careGuideItemRTL]}>
                        <Ionicons name="cloud" size={16} color={COLORS.primary} />
                        <Text style={[styles.careGuideLabel, isRTL && styles.careGuideLabelRTL]}>
                          {isRTL ? 'الرطوبة' : 'Humidity'}
                        </Text>
                        <Text style={[styles.careGuideValue, isRTL && styles.careGuideValueRTL]}>
                          {plant.preferred_humidity.charAt(0).toUpperCase() + plant.preferred_humidity.slice(1)}
                        </Text>
                      </View>
                    )}

                    {plant.preferred_orientation && (
                      <View style={[styles.careGuideItem, isRTL && styles.careGuideItemRTL]}>
                        <Ionicons name="sunny" size={16} color={COLORS.primary} />
                        <Text style={[styles.careGuideLabel, isRTL && styles.careGuideLabelRTL]}>
                          {isRTL ? 'الإضاءة' : 'Light'}
                        </Text>
                        <Text style={[styles.careGuideValue, isRTL && styles.careGuideValueRTL]}>
                          {plant.preferred_orientation}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Adjusted Care Tips Section - Collapsible */}
          {enhancedCare && (
            <View style={styles.careGuideSection}>
              <TouchableOpacity
                style={styles.careGuideHeader}
                onPress={() => setIsCareTipsExpanded(!isCareTipsExpanded)}
                activeOpacity={0.7}
              >
                <Text style={styles.careGuideTitle}>
                  {isRTL ? 'نصائح العناية المخصصة' : 'Adjusted Care Tips'}
                </Text>
                <Ionicons
                  name={isCareTipsExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

              {isCareTipsExpanded && (
                <View style={styles.careGuideDetails}>
                  <View style={styles.careGuideItem}>
                    <Ionicons name="water-outline" size={20} color={COLORS.primary} />
                    <Text style={[styles.careGuideValue, { flex: 1, marginLeft: FIBONACCI.MD }]}>
                      {enhancedCare.adjusted.watering}
                    </Text>
                  </View>

                  <View style={styles.careGuideItem}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                    <Text style={[styles.careGuideValue, { flex: 1, marginLeft: FIBONACCI.MD }]}>
                      {enhancedCare.adjusted.wateringFrequency}
                    </Text>
                  </View>

                  {enhancedCare.tips.length > 0 && (
                    <View style={styles.careGuideItem}>
                      <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
                      <Text style={[styles.careGuideValue, { flex: 1, marginLeft: FIBONACCI.MD }]}>
                        {enhancedCare.tips[0]}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>{t('plantDetail.quickActions')}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCareAction('water')}
              >
                <Ionicons name="water-outline" size={30} color={COLORS.primary} />
                <Text style={[styles.actionText, isRTL && styles.actionTextRTL]}>{t('plantDetail.water')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCareAction('fertilize')}
              >
                <Ionicons name="leaf-outline" size={30} color={COLORS.primary} />
                <Text style={[styles.actionText, isRTL && styles.actionTextRTL]}>{t('plantDetail.feed')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('EditPlant', { plantId: plant.id })}
              >
                <Ionicons name="navigate-outline" size={30} color={COLORS.primary} />
                <Text style={[styles.actionText, isRTL && styles.actionTextRTL]}>{t('plantDetail.move')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCareAction('repot')}
              >
                <Ionicons name="flower-outline" size={30} color={COLORS.primary} />
                <Text style={[styles.actionText, isRTL && styles.actionTextRTL]}>{t('plantDetail.repot')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Care Schedule */}
          <View style={styles.scheduleContainer}>
            <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>{t('plantDetail.careSchedule')}</Text>
            <View style={styles.scheduleCard}>
              <View style={styles.scheduleItem}>
                <Text style={[styles.scheduleLabel, isRTL && styles.scheduleLabelRTL]}>{t('plantDetail.lastWatered')}</Text>
                <Text style={[styles.scheduleValue, plant.last_watered_at && styles.scheduleValueSuccess, isRTL && styles.scheduleValueRTL]}>
                  {plant.last_watered_at ? formatDate(plant.last_watered_at) : t('plantDetail.never')}
                </Text>
              </View>

              <View style={styles.scheduleItem}>
                <Text style={styles.scheduleLabel}>{t('plantDetail.nextWateringLabel')}</Text>
                <Text style={[
                  styles.scheduleValue,
                  daysUntilWatering !== null && daysUntilWatering <= 0 && styles.scheduleOverdue
                ]}>
                  {daysUntilWatering !== null ? (
                    daysUntilWatering <= 0 ? t('plantDetail.now') :
                    daysUntilWatering === 1 ? t('plantDetail.tomorrow') :
                    t('plantDetail.inXDays', { days: daysUntilWatering })
                  ) : (
                    t('plantDetail.notSet')
                  )}
                </Text>
              </View>

              {/* Progress Dots */}
              <View style={styles.progressContainer}>
                <View style={styles.progressDots}>
                  {[...Array(7)].map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.progressDot,
                        index < (7 - (daysUntilWatering || 0)) && styles.progressDotActive
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.progressLabel}>{t('plantDetail.wateringCycle')}</Text>
              </View>
            </View>
          </View>

          {/* Plant Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>{t('plantDetail.plantDetails')}</Text>

            <View style={styles.detailCard}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📍</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>{t('plantDetail.location')}</Text>
                  <Text style={styles.detailValue}>{getLocationLabel(plant.location)}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🧭</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>{t('plantDetail.window')}</Text>
                  <Text style={styles.detailValue}>{getDirectionLabel(plant.window_direction)}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📅</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>{t('plantDetail.added')}</Text>
                  <Text style={styles.detailValue}>{formatDate(plant.created_at)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Care History */}
          <View style={styles.historyContainer}>
            <Text style={styles.sectionTitle}>{t('plantDetail.careHistory')}</Text>
            
            {careHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyHistoryText}>No care events yet</Text>
                <Text style={styles.emptyHistorySubtext}>
                  Start caring for your plant to build a history
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {careHistory.slice(0, 10).map((event) => {
                  const eventType = CARE_EVENT_TYPES.find(c => c.value === event.event_type);
                  return (
                    <View key={event.id} style={styles.historyItem}>
                      <Text style={styles.historyIcon}>{eventType?.emoji || '•'}</Text>
                      <View style={styles.historyContent}>
                        <Text style={styles.historyText}>
                          {eventType?.label || event.event_type} completed
                        </Text>
                        <Text style={styles.historyDate}>
                          {formatDate(event.completed_at)} at {formatTime(event.completed_at)}
                        </Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    height: 256,
    justifyContent: 'flex-end',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
    justifyContent: 'space-between',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
  },
  headerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 9999,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  headerTitleInput: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    paddingBottom: 2,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  newHealthBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  newHealthBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    padding: FIBONACCI.LG,
  },
  plantName: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  plantNameRTL: {
    textAlign: 'right',
  },
  plantSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  plantSubtitleRTL: {
    textAlign: 'right',
  },
  actionsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 16,
  },
  sectionTitleRTL: {
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionTextRTL: {
    textAlign: 'center',
  },
  scheduleContainer: {
    marginBottom: 32,
  },
  scheduleCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: FIBONACCI.LG,
    marginTop: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scheduleLabelRTL: {
    textAlign: 'right',
  },
  scheduleValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  scheduleValueRTL: {
    textAlign: 'left',
  },
  scheduleValueSuccess: {
    color: COLORS.success,
  },
  scheduleOverdue: {
    color: COLORS.error,
  },
  progressContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  detailsContainer: {
    marginBottom: FIBONACCI.XL, // 34px - Fibonacci
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderRadius: ELEMENT_SIZES.RADIUS_LG, // 21px - Fibonacci
    padding: FIBONACCI.LG, // 21px
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: FIBONACCI.MD, // 13px
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: FIBONACCI.LG, // 21px - Fibonacci
    marginRight: FIBONACCI.MD, // 13px
    fontFamily: 'Helvetica',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.textSecondary,
    marginBottom: FIBONACCI.XXS, // 3px
  },
  detailValue: {
    fontSize: TYPOGRAPHY.BASE, // 16px
    fontWeight: '600',
    color: COLORS.text,
  },
  historyContainer: {
    marginBottom: FIBONACCI.XL, // 34px - Fibonacci
  },
  emptyHistory: {
    backgroundColor: COLORS.background,
    padding: FIBONACCI.XL, // 34px - Fibonacci
    borderRadius: ELEMENT_SIZES.RADIUS_LG, // 21px
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: TYPOGRAPHY.BASE, // 16px
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: FIBONACCI.SM, // 8px
  },
  emptyHistorySubtext: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  historyList: {
    gap: FIBONACCI.MD, // 13px - Golden ratio
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: FIBONACCI.MD, // 13px
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px
  },
  historyIcon: {
    fontSize: FIBONACCI.LG, // 21px - Fibonacci
    marginRight: FIBONACCI.MD, // 13px
    fontFamily: 'Helvetica',
  },
  historyContent: {
    flex: 1,
  },
  historyText: {
    fontSize: TYPOGRAPHY.BASE, // 16px
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: FIBONACCI.XXS, // 3px
  },
  historyDate: {
    fontSize: TYPOGRAPHY.XS, // 12px
    color: COLORS.textSecondary,
  },
  bottomPadding: {
    height: FIBONACCI.XL, // 34px - Fibonacci
  },

  // Collapsible Care Guide Styles
  careGuideSection: {
    backgroundColor: COLORS.white,
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: FIBONACCI.LG, // 21px
  },
  careGuideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: FIBONACCI.MD, // 13px
    backgroundColor: COLORS.background,
  },
  careGuideTitle: {
    fontSize: TYPOGRAPHY.BASE, // 16px
    fontWeight: '600',
    color: COLORS.primary,
  },
  careGuideTitleRTL: {
    textAlign: 'right',
  },
  careGuideDescription: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.text,
    lineHeight: FIBONACCI.LG, // 21px
    padding: FIBONACCI.MD, // 13px
    paddingTop: FIBONACCI.SM, // 8px
    textAlign: 'center',
  },
  careGuideDescriptionRTL: {
    textAlign: 'right',
  },
  careGuideDetails: {
    padding: FIBONACCI.MD, // 13px
    paddingTop: FIBONACCI.SM, // 8px
    gap: FIBONACCI.SM, // 8px
  },
  careGuideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: FIBONACCI.MD, // 13px
    borderRadius: ELEMENT_SIZES.RADIUS_SM, // 8px
    gap: FIBONACCI.SM, // 8px
  },
  careGuideItemRTL: {
    flexDirection: 'row-reverse',
  },
  careGuideLabel: {
    fontSize: TYPOGRAPHY.SM, // 14px
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: FIBONACCI.XS, // 5px
  },
  careGuideLabelRTL: {
    textAlign: 'right',
    marginLeft: 0,
    marginRight: FIBONACCI.XS,
  },
  careGuideValue: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  careGuideValueRTL: {
    textAlign: 'left',
  },
});