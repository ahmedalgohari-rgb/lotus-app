import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '../i18n';

import {
  COLORS,
  FIBONACCI,
  TYPOGRAPHY,
  ELEMENT_SIZES,
} from '../constants';
import { useStore } from '../store';
import type { IdentificationResult } from '../types';
import { authService, dbService } from '../services/supabase';
import { createPlantIdService } from '../services/plant-identification';
import AuthModal from '../components/AuthModal';
import MatchBadge from '../components/MatchBadge';
import GenericCareCard from '../components/GenericCareCard';
import PlantRequestButton from '../components/PlantRequestButton';
import { getPlantImage } from '../assets/plantImages';
import { logger, timer } from '../utils/logger';
import { useRTL } from '../utils/rtl';
import { processCapturedPhoto } from '../utils/imageProcessor';
import { trackPlantResultViewed, trackAuthModalShown } from '../services/analytics';
import TagInfoModal, { getLightIcon, getLightColor, TagInfoType } from '../components/TagInfoModal';
import TraitPill from '../components/TraitPill';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface PlantResultScreenProps {
  route: {
    params: {
      identificationResult: IdentificationResult;
      capturedImage?: string;  // Camera photo URI (optional)
      plantDatabaseId?: string;  // Database plant ID (optional, e.g., "euphorbia_trigona")
      fromSearch?: boolean;  // Flag indicating navigation from search
    };
  };
}

export default function PlantResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const isRTL = useRTL();

  const { identificationResult, capturedImage, plantDatabaseId } = route.params as PlantResultScreenProps['route']['params'];

  const { user, isAuthenticated, isGuest, setUser, setAuthenticated, updateUserName } = useStore();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // 🏷️ TAG INFO: Tap-to-learn modal for light & pet safety tags
  const [tagInfoVisible, setTagInfoVisible] = useState(false);
  const [tagInfoType, setTagInfoType] = useState<TagInfoType>('light');
  const [tagInfoLightKey, setTagInfoLightKey] = useState<string | undefined>();

  const openTagInfo = (type: TagInfoType, lightKey?: string) => {
    setTagInfoType(type);
    setTagInfoLightKey(lightKey);
    setTagInfoVisible(true);
  };

  // 🏷️ TRAIT TAGS: Quick-glance plant attributes (difficulty, type, light, pet safety)
  const [plantTraits, setPlantTraits] = useState<{
    difficulty?: string;
    type?: string;
    lightRequirement?: string;
    petSafe?: boolean;
  } | null>(null);

  // ⚡ NEW: Background image processing & upload state
  const [imageProcessing, setImageProcessing] = useState<{
    processedUri: string | null;
    cloudUrl: string | null;
    status: 'idle' | 'processing' | 'uploading' | 'complete' | 'failed';
    error: Error | null;
  }>({
    processedUri: null,
    cloudUrl: null,
    status: 'idle',
    error: null
  });

  // Determine match scenario based on database_match object
  const getMatchScenario = (): 'full' | 'genus_auto' | 'family' | 'none' => {
    if (!identificationResult?.database_match?.found) {
      return 'none';
    }

    const { confidence, match_type } = identificationResult.database_match;

    // genus_auto: auto-selected closest match — show as confident but with subtle badge
    if (match_type === 'genus_auto') {
      return 'genus_auto';
    }

    // Backward compat: old genus matches treated as genus_auto (no picker)
    if (match_type === 'genus') {
      return 'genus_auto';
    }

    // FULL_MATCH: Exact or high-confidence match
    if (confidence >= 85) {
      return 'full';
    }

    // FAMILY_MATCH: Common name match or low-confidence
    if (match_type === 'common_name' || (confidence >= 60 && confidence < 70)) {
      return 'family';
    }

    return 'none';
  };

  const matchScenario = identificationResult ? getMatchScenario() : 'none';
  const dbMatch = identificationResult?.database_match;
  const currentLang = getCurrentLanguage(); // 🌐 FIX: Get current language for localization

  useEffect(() => {
    trackPlantResultViewed({
      commonName: identificationResult?.common_name,
      scientificName: identificationResult?.scientific_name,
      confidence: identificationResult?.confidence,
      matchType: dbMatch?.match_type,
      isCurated: identificationResult?.care_available,
    });
  }, []);

  // 🌿 CULTIVAR OVERRIDE: When user refines to a specific cultivar, use its data
  // 🌐 LOCALIZATION: Use Arabic content when language is Arabic
  const [displayedPlantInfo, setDisplayedPlantInfo] = useState(
    currentLang === 'ar' && identificationResult?.plant_info_arabic
      ? identificationResult.plant_info_arabic
      : identificationResult?.plant_info
  );
  const [displayedPlantName, setDisplayedPlantName] = useState(
    currentLang === 'ar' && identificationResult?.common_name_arabic
      ? identificationResult.common_name_arabic
      : identificationResult?.common_name
  );
  // Alternate language name (shown below primary name in italic)
  const [displayedPlantNameAlt, setDisplayedPlantNameAlt] = useState(
    currentLang === 'ar'
      ? identificationResult?.common_name
      : identificationResult?.common_name_arabic
  );

  // 🏷️ Load plant traits on initial mount (for non-cultivar plants)
  useEffect(() => {
    const plantId = plantDatabaseId || dbMatch?.plant_id;
    if (!plantId) return;

    const plantData = require('../data/plantCareDatabase.json');
    const fullPlant = plantData.plants.find((p: any) => p.id === plantId);
    if (fullPlant) {
      setPlantTraits({
        difficulty: fullPlant.care?.difficulty,
        type: fullPlant.care?.plant_type,
        lightRequirement: fullPlant.care?.light?.requirement,
        petSafe: fullPlant.characteristics?.pet_safe,
      });
    }
  }, []);

  // Card fade-in on mount (opacity 0→1, translateY 8→0, 300ms ease-out)
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(8)).current;

  // Press scale for action buttons
  const saveButtonScale = useRef(new Animated.Value(1)).current;
  const retryButtonScale = useRef(new Animated.Value(1)).current;

  const animateButtonIn = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const animateButtonOut = (scale: Animated.Value) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  // Card fade-in on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ⚡ OPTIMIZATION: Process & upload image in background immediately on mount
  useEffect(() => {
    if (capturedImage && user && imageProcessing.status === 'idle') {
      processAndUploadImage();
    }
  }, [capturedImage, user]);

  // ⚡ Background image processing & upload
  const processAndUploadImage = async () => {
    if (!capturedImage || !user) return;

    try {
      // Step 1: Process to WebP (2-3s in background)
      setImageProcessing(prev => ({ ...prev, status: 'processing' }));
      logger.info('⚡ Starting background image processing...');

      const processedUri = await processCapturedPhoto(capturedImage, user.id);

      logger.info('✅ Image processed to WebP', { processedUri });

      // Step 2: Upload to cloud (2-5s in background)
      setImageProcessing(prev => ({
        ...prev,
        processedUri,
        status: 'uploading'
      }));
      logger.info('⚡ Starting background cloud upload...');

      const cloudUrl = await dbService.uploadImage({
        uri: processedUri,
        type: 'image/webp',
        name: `plant_${user.id}_${Date.now()}.webp`
      }, 'plant-images');

      // Step 3: Complete!
      setImageProcessing({
        processedUri,
        cloudUrl,
        status: 'complete',
        error: null
      });

      logger.info('✅ Background processing & upload complete!', {
        processedUri,
        cloudUrl
      });
    } catch (error) {
      logger.error('❌ Background processing/upload failed:', error);
      setImageProcessing(prev => ({
        ...prev,
        status: 'failed',
        error: error as Error
      }));
    }
  };

  // ⚡ CLEANUP: Track if user is proceeding to save (don't delete in that case)
  const isProceedingToSave = useRef(false);

  // ⚡ CLEANUP: Delete uploaded image ONLY if user goes back without saving
  useEffect(() => {
    return () => {
      // User navigated away - only delete if they DIDN'T proceed to AddPlant
      if (imageProcessing.cloudUrl && imageProcessing.status === 'complete' && !isProceedingToSave.current) {
        logger.info('🗑️ User left screen without saving - deleting unused upload');
        dbService.deleteUploadedImage(imageProcessing.cloudUrl).catch(err => {
          logger.warn('Failed to delete uploaded image:', err);
        });
      }
    };
  }, [imageProcessing.cloudUrl, imageProcessing.status]);

  const handlePostAuthSuccess = () => {
    if (identificationResult) {
      isProceedingToSave.current = true;
      navigation.navigate('AddPlant', {
        identificationResult,
        capturedImage,
        plantDatabaseId,
        processedImageUri: imageProcessing.processedUri,
        cloudImageUrl: imageProcessing.cloudUrl,
      });
    }
  };

  const saveToMyPlants = () => {
    if (isGuest || !isAuthenticated || !user) {
      trackAuthModalShown({ trigger: 'scan_result' });
      setShowAuthPrompt(true);
      return;
    }

    if (identificationResult) {
      isProceedingToSave.current = true; // Don't delete cloud image - user is saving!
      navigation.navigate('AddPlant', {
        identificationResult,
        capturedImage,
        plantDatabaseId,
        // ⚡ NEW: Pass pre-processed URIs (already done in background!)
        processedImageUri: imageProcessing.processedUri,
        cloudImageUrl: imageProcessing.cloudUrl,
      });
    }
  };

  const retryCapture = async () => {
    // ⚡ CLEANUP: Delete uploaded image before going back
    if (imageProcessing.cloudUrl) {
      logger.info('🗑️ User clicked "Take Another" - deleting upload');
      try {
        await dbService.deleteUploadedImage(imageProcessing.cloudUrl);
      } catch (error) {
        logger.warn('Failed to delete uploaded image:', error);
      }
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <AuthModal
        visible={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        onAuthSuccess={handlePostAuthSuccess}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerCloseButton}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        {/* Dynamic title based on source: scanned vs database-selected */}
        <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>
          {capturedImage ? t('plantResult.title') : t('plantResult.titleDatabase')}
        </Text>
        <View style={styles.headerButton} />
      </View>

      {/* Plant Results Content */}
      {identificationResult && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
          scrollEnabled={true}
        >
          <Animated.View style={{ opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }}>
          <View style={styles.imageContainer}>
            {(() => {
              const imgSrc = capturedImage ? { uri: capturedImage } : (plantDatabaseId ? getPlantImage(plantDatabaseId) : null);
              return imgSrc ? (
                <Image source={imgSrc} style={styles.resultImage} resizeMode="cover" />
              ) : (
                <View style={[styles.resultImage, styles.resultImageFallback]}>
                  <Ionicons name="leaf" size={48} color={COLORS.primary} style={{ opacity: 0.35 }} />
                </View>
              );
            })()}
            {/* Removed "Identified by AI" badge - PlantNet logo below is sufficient */}
            {/* Provider Attribution Watermark (Dynamic based on active provider) */}
            {/* Required by some providers' Terms of Service (e.g., PlantNet) */}
            {capturedImage && (() => {
              const plantIdService = createPlantIdService();
              const attribution = plantIdService.getAttribution();

              // Only render if attribution is required by provider
              if (!attribution.required) return null;

              return (
                <View style={[
                  styles.providerAttribution,
                  attribution.position === 'top-right' && styles.topRight,
                  attribution.position === 'top-left' && styles.topLeft,
                  attribution.position === 'bottom-right' && styles.bottomRight,
                  attribution.position === 'bottom-left' && styles.bottomLeft,
                ]}>
                  <Image
                    source={attribution.logo}
                    style={[
                      styles.providerLogo,
                      { width: attribution.dimensions.width, height: attribution.dimensions.height }
                    ]}
                    resizeMode="contain"
                  />
                </View>
              );
            })()}
          </View>

          <View style={styles.plantInfo}>
            <Text style={[styles.plantName, isRTL && styles.plantNameRTL]}>{displayedPlantName}</Text>
            {displayedPlantNameAlt && (
              <Text style={[styles.scientificName, isRTL && styles.scientificNameRTL]}>
                {displayedPlantNameAlt}
              </Text>
            )}
            <Text style={[styles.scientificName, isRTL && styles.scientificNameRTL]}>
              {identificationResult.scientific_name}
            </Text>
            {identificationResult.family && (
              <Text style={[styles.familyName, isRTL && styles.familyNameRTL]}>{t('plantResult.familyLabel')} {identificationResult.family}</Text>
            )}
          </View>

          {/* 🏷️ TRAIT TAGS: Quick-glance pills for difficulty, type, light, pet safety */}
          {plantTraits && (
            <View style={[styles.traitTagsContainer, isRTL && styles.traitTagsContainerRTL]}>
              {plantTraits.difficulty && (
                <TraitPill label={t(`tags.${plantTraits.difficulty}`)} />
              )}
              {plantTraits.type && (
                <TraitPill label={t(`tags.${plantTraits.type}`)} />
              )}
              {plantTraits.lightRequirement && (
                <TraitPill
                  label={t(`tags.${plantTraits.lightRequirement}`)}
                  icon={<Ionicons name={getLightIcon(plantTraits.lightRequirement)} size={14} color={getLightColor(plantTraits.lightRequirement)} />}
                  onPress={() => openTagInfo('light', plantTraits.lightRequirement)}
                />
              )}
              {plantTraits.petSafe !== undefined && (
                <TraitPill
                  label={plantTraits.petSafe ? t('tags.petSafe') : t('tags.petToxic')}
                  icon={<Text style={{ fontSize: 13 }}>{plantTraits.petSafe ? '🐶' : '🚫'}</Text>}
                  danger={!plantTraits.petSafe}
                  onPress={() => openTagInfo(plantTraits.petSafe ? 'petSafe' : 'petToxic')}
                />
              )}
            </View>
          )}

          {/* Low Confidence Warning (30-60%) - Surface uncertainty so users can verify or retake */}
          {dbMatch && dbMatch.confidence < 60 && dbMatch.confidence >= 30 && capturedImage && (
            <View style={styles.lowConfidenceWarning}>
              <Ionicons name="camera-outline" size={20} color={COLORS.warning} />
              <Text style={[styles.lowConfidenceText, isRTL && styles.lowConfidenceTextRTL]}>
                {isRTL
                  ? `التعرف التلقائي منخفض الثقة (${dbMatch.confidence}%). حاول التقاط صورة أوضح للنبات في إضاءة جيدة للحصول على نتائج أفضل.`
                  : `Low confidence identification (${dbMatch.confidence}%). Try taking a clearer photo in good lighting for better results.`}
              </Text>
            </View>
          )}

          {/* Match Scenario: FULL_MATCH (≥85% confidence) - No message shown, users don't need to know about our database */}

          {/* Closest match badge — shown when genus_auto was used */}
          {matchScenario === 'genus_auto' && (
            <View style={styles.closestMatchBadge}>
              <Ionicons name="leaf-outline" size={14} color={COLORS.primary} />
              <Text style={[styles.closestMatchText, isRTL && styles.closestMatchTextRTL]}>
                {t('plantResult.closestMatch')}
              </Text>
            </View>
          )}

          {/* 🐛 DEV ONLY: Match path debug panel */}
          {__DEV__ && dbMatch && (
            <View style={styles.debugPanel}>
              <Text style={styles.debugText}>🐛 match_type: {dbMatch.match_type}</Text>
              <Text style={styles.debugText}>scenario: {matchScenario}</Text>
              <Text style={styles.debugText}>plant_id: {dbMatch.plant_id ?? 'null'}</Text>
              <Text style={styles.debugText}>db confidence: {dbMatch.confidence}</Text>
            </View>
          )}

          {/* Match Scenario: FAMILY_MATCH (<70% confidence or common_name) */}
          {matchScenario === 'family' && (
            <View style={styles.careSection}>
              <Text style={[styles.careTitle, isRTL && styles.careTitleRTL]}>
                ⚠️ {t('plantResult.matchTypes.family')}
              </Text>
              <Text style={[styles.careDescription, isRTL && styles.careDescriptionRTL]}>
                {t('plantResult.matchMessages.familyMatch')}
              </Text>
            </View>
          )}

          {/* Match Scenario: NO_MATCH (not in database) */}
          {matchScenario === 'none' && (
            <>
              <View style={styles.careSection}>
                <Text style={[styles.careTitle, isRTL && styles.careTitleRTL]}>
                  🔍 {t('plantResult.matchTypes.none')}
                </Text>
                <Text style={[styles.careDescription, isRTL && styles.careDescriptionRTL]}>
                  {t('plantResult.matchMessages.noMatch')}
                </Text>
              </View>

              <GenericCareCard
                plantFamily={identificationResult.family}
                scientificName={identificationResult.scientific_name}
              />
            </>
          )}

          {/* Plant Description */}
          {displayedPlantInfo && (
            <View style={styles.careSection}>
              <Text style={[styles.careTitle, isRTL && styles.careTitleRTL]}>{t('plantResult.plantStory')}</Text>
              <Text style={[styles.plantDescription, isRTL && styles.plantDescriptionRTL]}>
                {displayedPlantInfo}
              </Text>
            </View>
          )}

          {/* Unlock Plant's Full Potential - Only show for guest users */}
          {isGuest && (
            <View style={styles.careSection}>
              <Text style={styles.careTitle}>{t('plantResult.unlockPotential')}</Text>

              <View style={styles.careDetails}>
                <View style={styles.unlockItem}>
                  <Ionicons name="heart-outline" size={20} color={COLORS.primary} style={styles.unlockIcon} />
                  <Text style={styles.unlockLabel}>{t('plantResult.features.saveToGarden')}</Text>
                  <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />
                </View>

                <View style={styles.unlockItem}>
                  <Ionicons name="water-outline" size={20} color={COLORS.primary} style={styles.unlockIcon} />
                  <Text style={styles.unlockLabel}>{t('plantResult.features.smartWatering')}</Text>
                  <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />
                </View>

                <View style={styles.unlockItem}>
                  <Ionicons name="compass-outline" size={20} color={COLORS.primary} style={styles.unlockIcon} />
                  <Text style={styles.unlockLabel}>{t('plantResult.features.placementTips')}</Text>
                  <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />
                </View>

                <View style={styles.unlockItem}>
                  <Ionicons name="book-outline" size={20} color={COLORS.primary} style={styles.unlockIcon} />
                  <Text style={styles.unlockLabel}>{t('plantResult.features.careGuides')}</Text>
                  <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />
                </View>
              </View>
            </View>
          )}

          <View style={styles.actionButtons}>
            <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveToMyPlants}
                activeOpacity={0.8}
                onPressIn={() => animateButtonIn(saveButtonScale)}
                onPressOut={() => animateButtonOut(saveButtonScale)}
              >
                <Text style={styles.saveButtonText}>
                  {isAuthenticated && !isGuest ? t('plantResult.buttons.saveAuth') : t('plantResult.buttons.saveGuest')}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Only show "Try Another" button if user came from camera scan (not from search) */}
            {capturedImage && (
              <Animated.View style={{ transform: [{ scale: retryButtonScale }] }}>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={retryCapture}
                  onPressIn={() => animateButtonIn(retryButtonScale)}
                  onPressOut={() => animateButtonOut(retryButtonScale)}
                >
                  <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.retryButtonText}>{t('plantResult.buttons.tryAnother')}</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Show request button for partial/no matches */}
            {(matchScenario === 'genus_auto' || matchScenario === 'family' || matchScenario === 'none') && (
              <PlantRequestButton
                plantName={identificationResult.common_name}
                scientificName={identificationResult.scientific_name}
                buttonText={
                  matchScenario === 'genus_auto'
                    ? t('plantRequest.requestSpecific')
                    : t('plantRequest.requestCare')
                }
                variant={matchScenario === 'none' ? 'primary' : 'secondary'}
              />
            )}
          </View>

          {/* Footer - Only show image processing note for scanned plants (when capturedImage exists) */}
          {capturedImage && (
            <View style={styles.footer}>
              <Ionicons name="information-circle" size={FIBONACCI.MD} color={COLORS.textSecondary} />
              <Text style={styles.footerText}>{t('plantResult.imageProcessingNote')}</Text>
            </View>
          )}
          </Animated.View>
        </ScrollView>
      )}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: FIBONACCI.MD, // 13px - Golden ratio
    paddingVertical: FIBONACCI.MD, // 13px
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    height: ELEMENT_SIZES.INPUT_MD, // 55px - Fibonacci
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.MD, // 18px - Golden ratio
    fontWeight: '600',
    color: COLORS.text,
  },
  headerTitleRTL: {
    textAlign: 'center',
  },
  headerCloseButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButton: {
    width: FIBONACCI.LG, // 21px - Fibonacci
    height: FIBONACCI.LG, // 21px
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: FIBONACCI.MD, // 13px - Golden ratio
    paddingVertical: FIBONACCI.SM, // 8px - Reduced vertical padding
    paddingBottom: FIBONACCI.XL, // 34px - Moderate bottom spacing for thumb zone optimization
  },
  imageContainer: {
    marginBottom: FIBONACCI.SM, // 8px
  },
  resultImage: {
    width: '100%',
    height: FIBONACCI.HUGE,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
  },
  resultImageFallback: {
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidenceBadge: {
    position: 'absolute',
    top: FIBONACCI.SM, // 8px
    left: FIBONACCI.SM, // 8px
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: FIBONACCI.SM, // 8px
    paddingVertical: FIBONACCI.XXS, // 3px
    borderRadius: ELEMENT_SIZES.RADIUS_SM, // 8px
    zIndex: 1,
  },
  confidenceText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.XS, // 12px - Golden ratio
    fontWeight: '600',
  },
  plantInfo: {
    marginBottom: FIBONACCI.LG, // 21px (was 13px - better spacing for large screens)
  },
  plantName: {
    fontSize: TYPOGRAPHY.XL, // 26px (was 34px XXL - too large for 6.9" screens)
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: FIBONACCI.XXS, // 3px
  },
  plantNameRTL: {
    textAlign: 'right',
  },
  scientificName: {
    fontSize: TYPOGRAPHY.BASE, // 16px
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginBottom: FIBONACCI.XXS, // 3px
  },
  scientificNameRTL: {
    textAlign: 'right',
  },
  familyName: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.textSecondary,
  },
  familyNameRTL: {
    textAlign: 'right',
  },
  traitTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  traitTagsContainerRTL: {
    flexDirection: 'row-reverse',
  },
  lowConfidenceWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(250, 173, 20, 0.1)', // Light amber background (COLORS.warning with opacity)
    padding: FIBONACCI.MD, // 13px
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning, // Amber accent
    marginTop: FIBONACCI.SM, // 8px
    marginBottom: FIBONACCI.MD, // 13px
    gap: FIBONACCI.SM, // 8px spacing between icon and text
  },
  lowConfidenceText: {
    flex: 1,
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.text,
    lineHeight: TYPOGRAPHY.BASE * 1.5, // 24px line height for readability
  },
  lowConfidenceTextRTL: {
    textAlign: 'right',
  },
  closestMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: FIBONACCI.XXS,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    borderRadius: ELEMENT_SIZES.RADIUS_SM,
    paddingHorizontal: FIBONACCI.SM,
    paddingVertical: FIBONACCI.XXS,
    marginBottom: FIBONACCI.MD,
  },
  closestMatchText: {
    fontSize: TYPOGRAPHY.XS,
    color: COLORS.primary,
    fontWeight: '500',
  },
  closestMatchTextRTL: {
    textAlign: 'right',
  },
  debugPanel: {
    backgroundColor: '#000000CC',
    borderRadius: 6,
    padding: 8,
    marginBottom: FIBONACCI.SM,
    gap: 2,
  },
  debugText: {
    color: '#00FF00',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  careSection: {
    marginBottom: FIBONACCI.LG, // 21px (was 13px - better section separation)
  },
  careTitle: {
    fontSize: TYPOGRAPHY.LG, // 21px
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: FIBONACCI.SM, // 8px - Reduced spacing
  },
  careTitleRTL: {
    textAlign: 'right',
  },
  plantDescription: {
    fontSize: TYPOGRAPHY.BASE, // 16px
    lineHeight: TYPOGRAPHY.XL, // 26px
    color: COLORS.textSecondary,
  },
  plantDescriptionRTL: {
    textAlign: 'right',
  },
  careDescription: {
    fontSize: TYPOGRAPHY.BASE, // 16px
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.BASE * 1.5, // 24px
  },
  careDescriptionRTL: {
    textAlign: 'right',
  },
  careDetails: {
    gap: FIBONACCI.SM, // 8px - Reduced spacing for compactness
  },
  unlockItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockIcon: {
    marginRight: FIBONACCI.MD, // 13px - Golden ratio
  },
  unlockLabel: {
    flex: 1,
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio
    color: COLORS.text,
  },
  actionButtons: {
    gap: FIBONACCI.SM, // 8px - Reduced spacing
    marginTop: FIBONACCI.XXL, // 55px - Ergonomic thumb-zone spacing after content
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: FIBONACCI.MD, // 13px
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px - Fibonacci
    height: ELEMENT_SIZES.BUTTON_MD, // 55px - Fibonacci button height
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio
    fontWeight: '600',
  },
  bottomText: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.SM, // 14px - Golden ratio
    color: COLORS.textSecondary,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: FIBONACCI.MD, // 13px
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px - Fibonacci
    gap: FIBONACCI.SM, // 8px - Fibonacci
    height: ELEMENT_SIZES.BUTTON_MD, // 55px - Fibonacci button height
  },
  retryButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: FIBONACCI.XS, // 5px - Fibonacci micro-spacing
    marginTop: FIBONACCI.SM, // 8px - Fibonacci spacing
    paddingBottom: FIBONACCI.SM, // 8px - Small bottom padding
  },
  footerText: {
    fontSize: TYPOGRAPHY.XXS, // 10px - Smallest Fibonacci typography
    color: COLORS.textSecondary,
    flex: 1,
    flexWrap: 'wrap',
  },

  // Dynamic Provider Attribution Watermark (adapts to active provider)
  // Positioned based on provider preferences (PlantNet, Plant.id, Google Vision, etc.)
  // Only displayed if provider requires attribution
  providerAttribution: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent white for readability
    paddingHorizontal: FIBONACCI.SM, // 8px - Compact padding
    paddingVertical: FIBONACCI.XS, // 5px - Minimal vertical padding
    borderRadius: FIBONACCI.XS, // 5px - Subtle rounded corners
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3, // Android shadow
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Positioning styles for different corners
  topRight: {
    top: FIBONACCI.SM, // 8px from top
    right: FIBONACCI.SM, // 8px from right
  },
  topLeft: {
    top: FIBONACCI.SM, // 8px from top
    left: FIBONACCI.SM, // 8px from left
  },
  bottomRight: {
    bottom: FIBONACCI.SM, // 8px from bottom
    right: FIBONACCI.SM, // 8px from right
  },
  bottomLeft: {
    bottom: FIBONACCI.SM, // 8px from bottom
    left: FIBONACCI.SM, // 8px from left
  },
  providerLogo: {
    opacity: 1, // Full opacity for clear attribution
    // Width and height set dynamically by attribution.dimensions
  },

  // 🌿 CULTIVAR REFINER CARD: Optional inline refiner (not blocking)
  refinerCard: {
    backgroundColor: COLORS.white,
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: FIBONACCI.MD, // 13px
    overflow: 'hidden',
  },
  refinerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: FIBONACCI.MD, // 13px
    backgroundColor: COLORS.background,
  },
  refinerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FIBONACCI.SM, // 8px
  },
  refinerTitle: {
    fontSize: TYPOGRAPHY.BASE, // 16px
    fontWeight: '600',
    color: COLORS.text,
  },
  refinerContent: {
    padding: FIBONACCI.MD, // 13px
    paddingTop: FIBONACCI.SM, // 8px
  },
  refinerSubtitle: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.textSecondary,
    marginBottom: FIBONACCI.MD, // 13px
    lineHeight: TYPOGRAPHY.SM * 1.5, // 21px
  },
  cultivarGrid: {
    gap: FIBONACCI.SM, // 8px
  },
  cultivarOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: FIBONACCI.SM, // 8px
    backgroundColor: COLORS.background,
    borderRadius: ELEMENT_SIZES.RADIUS_SM, // 8px
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cultivarOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`, // 10% opacity
  },
  cultivarImage: {
    width: FIBONACCI.XXL, // 55px
    height: FIBONACCI.XXL, // 55px
    borderRadius: FIBONACCI.SM, // 8px
    marginRight: FIBONACCI.MD, // 13px
  },
  cultivarInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cultivarName: {
    flex: 1,
    fontSize: TYPOGRAPHY.SM, // 14px
    fontWeight: '500',
    color: COLORS.text,
  },
});