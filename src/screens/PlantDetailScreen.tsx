import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  LayoutAnimation,
  UIManager,
  Platform,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getPlantImage } from '../assets/plantImages';

import {
  COLORS,
  PLANT_LOCATIONS,
  WINDOW_DIRECTIONS,
  CARE_EVENT_TYPES,
  HEALTH_STATUS,
  FIBONACCI,
  TYPOGRAPHY,
  ELEMENT_SIZES,
  GOLDEN_RECTANGLES,
} from '../constants';
import { useStore } from '../store';
import { calculateHealthStatus, getHealthColor } from '../utils/plantHealth';
import { dbService } from '../services/supabase';
import { Plant, CareEvent, EnhancedCareRecommendation } from '../types';
import { plantDatabaseService, Plant as DbPlant } from '../services/plantDatabase';
import { getPersonalizedCareRecommendations } from '../utils/careMap';
import { useRTL } from '../utils/rtl';
import { logger } from '../utils/logger';
import {
  extractMaxWateringDays,
  extractCheckSoilDays,
  formatWateringSchedule,
  formatLightValue,
  translateWateringTip,
  translateCheckSoilTip,
  translateSeasonalTip,
} from '../utils/careTextUtils';
import * as NotificationService from '../services/notifications';
import { trackCareAction } from '../services/analytics';
import TagInfoModal, { getLightIcon, getLightColor, TagInfoType } from '../components/TagInfoModal';
import TraitPill from '../components/TraitPill';

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
  const [enhancedCare, setEnhancedCare] = useState<EnhancedCareRecommendation | null>(null);
  const [isLoadingCare, setIsLoadingCare] = useState(false);
  const [capturedImageFailed, setCapturedImageFailed] = useState(false);
  const [remoteImageFailed, setRemoteImageFailed] = useState(false);
  const [isCareGuideExpanded, setIsCareGuideExpanded] = useState(true); // Expanded by default
  const [dbPlant, setDbPlant] = useState<DbPlant | null>(null);
  const [tagInfoVisible, setTagInfoVisible] = useState(false);
  const [tagInfoType, setTagInfoType] = useState<TagInfoType>('light');
  const [tagInfoLightKey, setTagInfoLightKey] = useState<string | undefined>();

  const openTagInfo = (type: TagInfoType, lightKey?: string) => {
    setTagInfoType(type);
    setTagInfoLightKey(lightKey);
    setTagInfoVisible(true);
  };

  // Action button press scale animations
  const waterScale = useRef(new Animated.Value(1)).current;
  const fertilizeScale = useRef(new Animated.Value(1)).current;
  const moveScale = useRef(new Animated.Value(1)).current;
  const repotScale = useRef(new Animated.Value(1)).current;

  // Care guide expand/collapse opacity
  const careGuideOpacity = useRef(new Animated.Value(1)).current;

  const animateButtonIn = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const animateButtonOut = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const navigation = useNavigation();
  const route = useRoute();
  const { plantId } = route.params as RouteParams;
  const { plants, updatePlant, user, gardenLocation } = useStore();
  const isRTL = useRTL();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  // Helper function to translate plant type
  const translatePlantType = (type: string): string => {
    if (!type) return type;
    const typeKey = type.toLowerCase().replace(/\s+/g, '');
    // Try to get translation, fallback to capitalized original if not found
    const translated = t(`care.plantTypes.${typeKey}`, { defaultValue: '' });
    return translated || (type.charAt(0).toUpperCase() + type.slice(1));
  };

  // Helper function to translate watering schedule
  const translateWateringSchedule = (schedule: string): string => {
    if (!schedule) return schedule;
    // Extract percentage from patterns like "75% dry", "100_dry", "60 dry"
    const match = schedule.match(/(\d+)%?\s*dry/i);
    if (match) {
      const percentage = match[1];
      const translated = t(`care.watering.dry${percentage}`, { defaultValue: '' });
      return translated || formatWateringSchedule(schedule);
    }
    return formatWateringSchedule(schedule);
  };

  // Helper function to translate humidity level
  const translateHumidity = (humidity: string): string => {
    if (!humidity) return humidity;
    const key = humidity.toLowerCase();
    const translated = t(`care.humidity.${key}`, { defaultValue: '' });
    return translated || (humidity.charAt(0).toUpperCase() + humidity.slice(1));
  };

  // Helper function to translate light value
  const translateLight = (light: string): string => {
    if (!light) return light;
    // Convert "bright_direct" to "brightDirect" for translation key lookup
    const key = light.replace(/_(.)/g, (_, char) => char.toUpperCase());
    const translated = t(`care.light.${key}`, { defaultValue: '' });
    return translated || formatLightValue(light);
  };

  useEffect(() => {
    const foundPlant = plants.find(p => p.id === plantId);
    if (foundPlant) {
      setPlant(foundPlant);
      setEditableNickname(foundPlant.nickname);
      // Look up the full database entry for rich plant info
      if (foundPlant.species_id) {
        const dbEntry = plantDatabaseService.getPlantById(foundPlant.species_id);
        setDbPlant(dbEntry);
      }
    }
    setIsLoading(false);
  }, [plantId, plants]);

  useEffect(() => {
    setCapturedImageFailed(false);
    setRemoteImageFailed(false);
  }, [plantId]);

  // Load enhanced care recommendations when plant data is available
  useEffect(() => {
    logger.debug('🔍 PlantDetailScreen - plant data:', {
      hasPlant: !!plant,
      plantId: plant?.id,
      speciesId: plant?.species_id,
      location: plant?.location,
      direction: plant?.window_direction
    });

    if (plant && plant.species_id) {
      logger.debug('✅ Calling loadEnhancedCare for species:', plant.species_id);
      loadEnhancedCare();
    } else {
      logger.debug('⚠️ NOT calling loadEnhancedCare - missing plant or species_id');
    }
  }, [plant?.id, plant?.species_id, plant?.location, plant?.window_direction]);

  // Load care history when component mounts
  useEffect(() => {
    if (plantId) {
      loadCareHistory();
      logger.debug('📋 Loading care history for plant:', plantId);
    }
  }, [plantId]);

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
        gardenLocation
      );

      setEnhancedCare(recommendation);
      logger.debug('✅ Enhanced care SET:', {
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
      Alert.alert(t('common.error'), t('plantDetail.updateNicknameFailed'));
    }
  };

  const handleToggleEdit = () => {
    LayoutAnimation.spring();
    if (isEditingNickname) {
      handleSaveNickname();
    }
    setIsEditingNickname(!isEditingNickname);
  };

  const handleToggleCareGuide = () => {
    const willExpand = !isCareGuideExpanded;
    if (willExpand) {
      setIsCareGuideExpanded(true);
      careGuideOpacity.setValue(0);
      Animated.timing(careGuideOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(careGuideOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setIsCareGuideExpanded(false));
    }
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
        // Extract max watering days from adjusted care tips (e.g., "12-16 days" -> 16)
        const wateringDays = enhancedCare?.adjusted?.watering
          ? extractMaxWateringDays(enhancedCare.adjusted.watering)
          : 7; // Fallback to 7 days if no care data
        nextWatering.setDate(nextWatering.getDate() + wateringDays);

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

        // Reschedule notification for this plant
        const checkDays = extractCheckSoilDays(
          enhancedCare?.adjusted?.wateringFrequency || '',
          enhancedCare?.adjusted?.watering || ''
        );
        NotificationService.scheduleForPlant(updatedPlant, checkDays);
      }

      trackCareAction({
        action: eventType,
        plantName: plant.nickname,
      });

      // Refresh care history
      await loadCareHistory();

      const careEventType = CARE_EVENT_TYPES.find(c => c.value === eventType);
      const actionName = isRTL ? (careEventType?.labelAr || eventType) : (careEventType?.label || eventType);
      Alert.alert(t('plantDetail.actionDoneTitle'), t('plantDetail.actionDoneMessage', { action: actionName, name: plant.nickname }));
    } catch (error) {
      logger.error('Error recording care action:', error);
      Alert.alert(t('common.error'), t('plantDetail.recordCareFailed'));
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
    return date.toLocaleDateString(dateLocale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(dateLocale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: i18n.language !== 'ar',
    });
  };

  if (isLoading || !plant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const daysUntilWatering = getDaysUntilWatering();

  // Cascading header image: captured → local database → remote URL → branded fallback
  function getHeaderSource() {
    if (plant.captured_image_uri && !capturedImageFailed) return { uri: plant.captured_image_uri };
    const local = getPlantImage(plant.plant_id);
    if (local) return local;
    if (plant.image_url && !remoteImageFailed) return { uri: plant.image_url };
    return null;
  }
  const headerSource = getHeaderSource();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerImageContainer}>
          {headerSource ? (
            <Image
              source={headerSource}
              style={styles.headerImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
              onError={() => {
                if (plant.captured_image_uri && !capturedImageFailed) {
                  setCapturedImageFailed(true);
                } else {
                  setRemoteImageFailed(true);
                }
              }}
            />
          ) : (
            <View style={[styles.headerImage, styles.headerImageFallback]}>
              <Ionicons name="leaf" size={64} color={COLORS.primary} style={{ opacity: 0.35 }} />
            </View>
          )}
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
            <View style={[styles.newHealthBadge, { backgroundColor: getHealthColor(calculateHealthStatus(plant)) }]}>
              <Text style={styles.newHealthBadgeText}>
                {(() => {
                  const status = calculateHealthStatus(plant);
                  const found = HEALTH_STATUS.find(h => h.value === status);
                  return isRTL ? (found?.labelAr ?? status) : (found?.label ?? status.replace('_', ' '));
                })()}
              </Text>
            </View>
          </View>
        </View>

        {/* Plant Header Info */}
        <View style={styles.content}>
          <Text style={[styles.plantName, isRTL && styles.plantNameRTL]}>{plant.common_name || 'Unknown Plant'}</Text>
          {/* Alternate language name */}
          {(() => {
            const altName = isRTL
              ? (dbPlant?.names.common[0] || plant.common_name)
              : dbPlant?.names.arabic[0];
            // Only show if different from primary name
            if (altName && altName !== (plant.common_name || 'Unknown Plant')) {
              return (
                <Text style={[styles.plantNameAlt, isRTL && styles.plantNameAltRTL]}>
                  {altName}
                </Text>
              );
            }
            return null;
          })()}
          <Text style={[styles.plantSubtitle, isRTL && styles.plantSubtitleRTL]}>
            {getLocationLabel(plant.location)} • {getDirectionLabel(plant.window_direction)} window
          </Text>

          {/* Plant Trait Tags */}
          {dbPlant ? (
            <View style={[styles.traitTagsRow, isRTL && styles.traitTagsRowRTL]}>
              {dbPlant.care?.difficulty && (
                <TraitPill label={t(`tags.${dbPlant.care.difficulty}`)} />
              )}
              {dbPlant.care?.plant_type && (
                <TraitPill label={t(`tags.${dbPlant.care.plant_type}`)} />
              )}
              {dbPlant.care?.light?.requirement && (
                <TraitPill
                  label={t(`tags.${dbPlant.care.light.requirement}`)}
                  icon={<Ionicons name={getLightIcon(dbPlant.care.light.requirement)} size={14} color={getLightColor(dbPlant.care.light.requirement)} />}
                  onPress={() => openTagInfo('light', dbPlant.care!.light!.requirement)}
                />
              )}
              {dbPlant.characteristics?.pet_safe !== undefined && (
                <TraitPill
                  label={dbPlant.characteristics.pet_safe ? t('tags.petSafe') : t('tags.petToxic')}
                  icon={<Text style={{ fontSize: 13 }}>{dbPlant.characteristics.pet_safe ? '🐶' : '🚫'}</Text>}
                  danger={!dbPlant.characteristics.pet_safe}
                  onPress={() => openTagInfo(dbPlant.characteristics!.pet_safe ? 'petSafe' : 'petToxic')}
                />
              )}
            </View>
          ) : plant.plant_type ? (
            <View style={[styles.plantTypeBadge, isRTL && styles.plantTypeBadgeRTL]}>
              <Ionicons name="leaf" size={14} color={COLORS.primary} />
              <Text style={styles.plantTypeBadgeText}>{translatePlantType(plant.plant_type)}</Text>
            </View>
          ) : null}

          {/* Care Schedule - Most actionable info first */}
          <View style={styles.scheduleContainer}>
            <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>{t('plantDetail.careSchedule')}</Text>
            <View style={styles.scheduleCard}>
              <View style={[styles.scheduleItem, isRTL && styles.scheduleItemRTL]}>
                <Text style={[styles.scheduleLabel, isRTL && styles.scheduleLabelRTL]}>{t('plantDetail.lastWatered')}</Text>
                <Text style={[styles.scheduleValue, plant.last_watered_at && styles.scheduleValueSuccess, isRTL && styles.scheduleValueRTL]}>
                  {plant.last_watered_at ? formatDate(plant.last_watered_at) : t('plantDetail.never')}
                </Text>
              </View>

              <View style={[styles.scheduleItem, isRTL && styles.scheduleItemRTL]}>
                <Text style={[styles.scheduleLabel, isRTL && styles.scheduleLabelRTL]}>{t('plantDetail.nextWateringLabel')}</Text>
                <Text style={[
                  styles.scheduleValue,
                  daysUntilWatering !== null && daysUntilWatering <= 0 && styles.scheduleOverdue,
                  daysUntilWatering !== null && daysUntilWatering === 1 && styles.scheduleWarning,
                  isRTL && styles.scheduleValueRTL
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

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>{t('plantDetail.quickActions')}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButtonWrapper}
                onPress={() => handleCareAction('water')}
                onPressIn={() => animateButtonIn(waterScale)}
                onPressOut={() => animateButtonOut(waterScale)}
                activeOpacity={1}
              >
                <Animated.View style={[styles.actionButton, { transform: [{ scale: waterScale }] }]}>
                  <Ionicons name="water-outline" size={30} color={COLORS.primary} />
                  <Text style={[styles.actionText, isRTL && styles.actionTextRTL]}>{t('plantDetail.water')}</Text>
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButtonWrapper}
                onPress={() => handleCareAction('fertilize')}
                onPressIn={() => animateButtonIn(fertilizeScale)}
                onPressOut={() => animateButtonOut(fertilizeScale)}
                activeOpacity={1}
              >
                <Animated.View style={[styles.actionButton, { transform: [{ scale: fertilizeScale }] }]}>
                  <Ionicons name="leaf-outline" size={30} color={COLORS.primary} />
                  <Text style={[styles.actionText, isRTL && styles.actionTextRTL]}>{t('plantDetail.feed')}</Text>
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButtonWrapper}
                onPress={() => navigation.navigate('EditPlant', { plantId: plant.id })}
                onPressIn={() => animateButtonIn(moveScale)}
                onPressOut={() => animateButtonOut(moveScale)}
                activeOpacity={1}
              >
                <Animated.View style={[styles.actionButton, { transform: [{ scale: moveScale }] }]}>
                  <Ionicons name="navigate-outline" size={30} color={COLORS.primary} />
                  <Text style={[styles.actionText, isRTL && styles.actionTextRTL]}>{t('plantDetail.move')}</Text>
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButtonWrapper}
                onPress={() => handleCareAction('repot')}
                onPressIn={() => animateButtonIn(repotScale)}
                onPressOut={() => animateButtonOut(repotScale)}
                activeOpacity={1}
              >
                <Animated.View style={[styles.actionButton, { transform: [{ scale: repotScale }] }]}>
                  <Ionicons name="flower-outline" size={30} color={COLORS.primary} />
                  <Text style={[styles.actionText, isRTL && styles.actionTextRTL]}>{t('plantDetail.repot')}</Text>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Plant Info — About + Care Tips (expanded by default) */}
          {(enhancedCare || plant.preferred_humidity || dbPlant || plant.scientific_name) && (
            <View style={styles.careGuideSection}>
              <TouchableOpacity
                style={[styles.careGuideHeader, isRTL && styles.careGuideHeaderRTL]}
                onPress={handleToggleCareGuide}
                activeOpacity={0.7}
              >
                <Text style={[styles.careGuideTitle, isRTL && styles.careGuideTitleRTL]}>
                  {t('plantDetail.careGuide')}
                </Text>
                <Ionicons
                  name={isCareGuideExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>

              {isCareGuideExpanded && (
                <Animated.View style={[styles.careGuideDetails, { opacity: careGuideOpacity }]}>
                  {/* ── About This Plant ── */}
                  {(plant.scientific_name || dbPlant) && (
                    <>
                      <Text style={[styles.careGuideSectionLabel, isRTL && styles.careGuideSectionLabelRTL]}>
                        {t('plantDetail.aboutPlant')}
                      </Text>

                      {/* Scientific name */}
                      {(plant.scientific_name || dbPlant?.names.scientific[0]) && (
                        <View style={[styles.careGuideItem, isRTL && styles.careGuideItemRTL]}>
                          <Ionicons name="flask-outline" size={20} color={COLORS.primary} />
                          <View style={styles.careGuideItemContent}>
                            <Text style={[styles.careGuideLabel, isRTL && styles.careGuideLabelRTL]}>
                              {t('plantDetail.scientificName')}
                            </Text>
                            <Text style={[styles.careGuideValue, styles.scientificNameText, isRTL && styles.careGuideValueRTL]}>
                              {plant.scientific_name || dbPlant?.names.scientific[0]}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Family */}
                      {(plant.family || dbPlant?.characteristics.family) && (
                        <View style={[styles.careGuideItem, isRTL && styles.careGuideItemRTL]}>
                          <Ionicons name="git-branch-outline" size={20} color={COLORS.primary} />
                          <View style={styles.careGuideItemContent}>
                            <Text style={[styles.careGuideLabel, isRTL && styles.careGuideLabelRTL]}>
                              {t('plantDetail.familyLabel')}
                            </Text>
                            <Text style={[styles.careGuideValue, isRTL && styles.careGuideValueRTL]}>
                              {plant.family || dbPlant?.characteristics.family}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Light requirement */}
                      {dbPlant?.care.light && (
                        <View style={[styles.careGuideItem, isRTL && styles.careGuideItemRTL]}>
                          <Ionicons name="sunny-outline" size={20} color={COLORS.primary} />
                          <View style={styles.careGuideItemContent}>
                            <Text style={[styles.careGuideLabel, isRTL && styles.careGuideLabelRTL]}>
                              {t('plantDetail.lightLabel')}
                            </Text>
                            <Text style={[styles.careGuideValue, isRTL && styles.careGuideValueRTL]}>
                              {t(`care.light.${dbPlant.care.light.requirement}`, { defaultValue: dbPlant.care.light.description })}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Soil */}
                      {dbPlant?.care.soil && (
                        <View style={[styles.careGuideItem, isRTL && styles.careGuideItemRTL]}>
                          <Ionicons name="earth-outline" size={20} color={COLORS.primary} />
                          <View style={styles.careGuideItemContent}>
                            <Text style={[styles.careGuideLabel, isRTL && styles.careGuideLabelRTL]}>
                              {t('plantDetail.soilLabel')}
                            </Text>
                            <Text style={[styles.careGuideValue, isRTL && styles.careGuideValueRTL]}>
                              {t(`care.soil.${dbPlant.care.soil}`, { defaultValue: formatLightValue(dbPlant.care.soil) })}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Temperature range */}
                      {dbPlant?.care.temperature && (
                        <View style={[styles.careGuideItem, isRTL && styles.careGuideItemRTL]}>
                          <Ionicons name="thermometer-outline" size={20} color={COLORS.primary} />
                          <View style={styles.careGuideItemContent}>
                            <Text style={[styles.careGuideLabel, isRTL && styles.careGuideLabelRTL]}>
                              {t('plantDetail.temperatureLabel')}
                            </Text>
                            <Text style={[styles.careGuideValue, isRTL && styles.careGuideValueRTL]}>
                              {dbPlant.care.temperature.min}°C – {dbPlant.care.temperature.max}°C
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Plant description */}
                      {(dbPlant?.care.plant_info || plant.plant_info) && (
                        <Text style={[styles.plantInfoDescription, isRTL && styles.plantInfoDescriptionRTL]}>
                          {isRTL && dbPlant?.care.plant_info_arabic
                            ? dbPlant.care.plant_info_arabic
                            : (dbPlant?.care.plant_info || plant.plant_info)}
                        </Text>
                      )}

                      {/* Divider between About and Care Tips */}
                      {(enhancedCare || plant.preferred_humidity) && (
                        <View style={styles.careGuideDivider} />
                      )}
                    </>
                  )}

                  {/* ── Care Tips ── */}
                  {(enhancedCare || plant.preferred_humidity) && (
                    <>
                      <Text style={[styles.careGuideSectionLabel, isRTL && styles.careGuideSectionLabelRTL]}>
                        {t('plantDetail.careTips')}
                      </Text>

                      {/* Personalized watering tip */}
                      {enhancedCare && (
                        <View style={[styles.careGuideItem, isRTL && styles.careGuideItemRTL]}>
                          <Ionicons name="water-outline" size={20} color={COLORS.primary} />
                          <Text style={[styles.careGuideValue, isRTL && styles.careGuideValueRTL]}>
                            {translateWateringTip(enhancedCare.adjusted.watering, t)}
                          </Text>
                        </View>
                      )}

                      {/* Check soil tip */}
                      {enhancedCare && (
                        <View style={[styles.careGuideItem, isRTL && styles.careGuideItemRTL]}>
                          <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                          <Text style={[styles.careGuideValue, isRTL && styles.careGuideValueRTL]}>
                            {translateCheckSoilTip(enhancedCare.adjusted.wateringFrequency, t)}
                          </Text>
                        </View>
                      )}

                      {/* Humidity */}
                      {(plant.preferred_humidity || dbPlant?.care.humidity) && (
                        <View style={[styles.careGuideItem, isRTL && styles.careGuideItemRTL]}>
                          <Ionicons name="cloud-outline" size={20} color={COLORS.primary} />
                          <Text style={[styles.careGuideValue, isRTL && styles.careGuideValueRTL]}>
                            {t('plantDetail.careLabels.humidity')} {translateHumidity(plant.preferred_humidity || dbPlant?.care.humidity || '')}
                          </Text>
                        </View>
                      )}

                      {/* Seasonal tip */}
                      {enhancedCare && enhancedCare.tips.length > 0 && (
                        <View style={[styles.careGuideItem, isRTL && styles.careGuideItemRTL]}>
                          <Ionicons name="leaf-outline" size={20} color={COLORS.primary} />
                          <Text style={[styles.careGuideValue, isRTL && styles.careGuideValueRTL]}>
                            {translateSeasonalTip(enhancedCare.tips[0], t)}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </Animated.View>
              )}
            </View>
          )}

          {/* Care History */}
          <View style={styles.historyContainer}>
            <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>{t('plantDetail.careHistory')}</Text>
            
            {careHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyHistoryText}>{t('plantDetail.noCareEvents')}</Text>
                <Text style={styles.emptyHistorySubtext}>
                  {t('plantDetail.noCareEventsSubtext')}
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
                          {isRTL ? (eventType?.labelAr || event.event_type) : (eventType?.label || event.event_type)}
                        </Text>
                        <Text style={styles.historyDate}>
                          {t('plantDetail.eventAt', { date: formatDate(event.completed_at), time: formatTime(event.completed_at) })}
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

      <TagInfoModal
        visible={tagInfoVisible}
        type={tagInfoType}
        activeLightKey={tagInfoLightKey}
        onClose={() => setTagInfoVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerImageContainer: {
    height: GOLDEN_RECTANGLES.LARGE.width, // 233px — golden rectangle
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: GOLDEN_RECTANGLES.LARGE.width, // 233px
  },
  headerImageFallback: {
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: FIBONACCI.MD,
    justifyContent: 'space-between',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: FIBONACCI.XL,
  },
  headerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: FIBONACCI.SM,
    borderRadius: 9999,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: TYPOGRAPHY.LG,
    fontWeight: '600',
    color: 'white',
  },
  headerTitleInput: {
    fontSize: TYPOGRAPHY.LG,
    fontWeight: '600',
    color: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'white',
    paddingBottom: 2,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: FIBONACCI.MD,
  },
  newHealthBadge: {
    position: 'absolute',
    bottom: FIBONACCI.MD,
    right: FIBONACCI.MD,
    paddingHorizontal: FIBONACCI.MD,
    paddingVertical: FIBONACCI.XXS,
    borderRadius: 9999,
  },
  newHealthBadgeText: {
    color: 'white',
    fontSize: TYPOGRAPHY.SM,
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
    fontSize: TYPOGRAPHY.XXL,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: FIBONACCI.XXS,
  },
  plantNameRTL: {
    textAlign: 'right',
  },
  plantNameAlt: {
    fontSize: TYPOGRAPHY.BASE,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginBottom: FIBONACCI.XXS,
  },
  plantNameAltRTL: {
    textAlign: 'right',
  },
  plantSubtitle: {
    fontSize: TYPOGRAPHY.BASE,
    color: COLORS.textSecondary,
    marginBottom: FIBONACCI.MD,
  },
  plantSubtitleRTL: {
    textAlign: 'right',
  },
  plantTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.background,
    paddingHorizontal: FIBONACCI.SM,
    paddingVertical: FIBONACCI.XS,
    borderRadius: FIBONACCI.MD,
    marginBottom: FIBONACCI.LG,
    gap: FIBONACCI.XS,
  },
  plantTypeBadgeRTL: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  plantTypeBadgeText: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.primary,
    fontWeight: '500',
  },
  traitTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: FIBONACCI.LG,
  },
  traitTagsRowRTL: {
    flexDirection: 'row-reverse',
  },
  actionsContainer: {
    marginBottom: FIBONACCI.XL,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.LG,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: FIBONACCI.MD,
  },
  sectionTitleRTL: {
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: FIBONACCI.SM,
  },
  actionButtonWrapper: {
    flex: 1,
  },
  actionButton: {
    backgroundColor: COLORS.background,
    borderRadius: FIBONACCI.MD,
    paddingVertical: FIBONACCI.MD,
    paddingHorizontal: FIBONACCI.XS,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: FIBONACCI.XXXL,
  },
  actionText: {
    marginTop: FIBONACCI.SM,
    fontSize: TYPOGRAPHY.XS,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  actionTextRTL: {
    textAlign: 'center',
  },
  scheduleContainer: {
    marginBottom: FIBONACCI.XL,
  },
  scheduleCard: {
    backgroundColor: COLORS.background,
    borderRadius: FIBONACCI.MD,
    padding: FIBONACCI.LG,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: FIBONACCI.MD,
  },
  scheduleItemRTL: {
    flexDirection: 'row-reverse',
  },
  scheduleLabel: {
    fontSize: TYPOGRAPHY.BASE,
    color: COLORS.textSecondary,
  },
  scheduleLabelRTL: {
    textAlign: 'right',
  },
  scheduleValue: {
    fontSize: TYPOGRAPHY.BASE,
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
  scheduleWarning: {
    color: COLORS.warning,
  },
  progressContainer: {
    marginTop: FIBONACCI.LG,
    alignItems: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    gap: FIBONACCI.SM,
    marginBottom: FIBONACCI.SM,
  },
  progressDot: {
    width: FIBONACCI.SM,
    height: FIBONACCI.SM,
    borderRadius: FIBONACCI.SM / 2,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  progressLabel: {
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.textSecondary,
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
    height: FIBONACCI.MD, // 13px - Just enough for tab bar clearance
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
  careGuideHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  careGuideTitle: {
    fontSize: TYPOGRAPHY.BASE, // 16px
    fontWeight: '600',
    color: COLORS.primary,
  },
  careGuideTitleRTL: {
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
    padding: FIBONACCI.MD,
    borderRadius: ELEMENT_SIZES.RADIUS_SM,
    gap: FIBONACCI.SM,
  },
  careGuideItemRTL: {
    flexDirection: 'row-reverse',
  },
  careGuideItemContent: {
    flex: 1,
  },
  careGuideLabel: {
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.textSecondary,
    marginBottom: FIBONACCI.XXS,
  },
  careGuideLabelRTL: {
    textAlign: 'right',
  },
  careGuideValue: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.text,
    flex: 1,
  },
  careGuideValueRTL: {
    textAlign: 'right',
  },
  careGuideSectionLabel: {
    fontSize: TYPOGRAPHY.XS,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: FIBONACCI.XS,
    marginTop: FIBONACCI.XXS,
  },
  careGuideSectionLabelRTL: {
    textAlign: 'right',
  },
  careGuideDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: FIBONACCI.SM,
  },
  scientificNameText: {
    fontStyle: 'italic',
  },
  plantInfoDescription: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.LG,
    marginTop: FIBONACCI.XS,
    paddingHorizontal: FIBONACCI.XS,
  },
  plantInfoDescriptionRTL: {
    textAlign: 'right',
  },
});