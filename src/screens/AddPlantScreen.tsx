import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { COLORS, PLANT_LOCATIONS, WINDOW_DIRECTIONS } from '../constants';
import { useStore } from '../store';
import { dbService } from '../services/supabase';
import { IdentificationResult } from '../types';
import { getCareRecommendations, getCareRecommendationTranslated, getCurrentSeason } from '../utils/careMap';
import { useRTL } from '../utils/rtl';

interface RouteParams {
  identificationResult?: IdentificationResult;
  capturedImage?: string;
}

export default function AddPlantScreen() {
  const [nickname, setNickname] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('living_room');
  const [selectedDirection, setSelectedDirection] = useState('east');
  const [isLoading, setIsLoading] = useState(false);

  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { identificationResult, capturedImage } = (route.params as RouteParams) || {};
  const { user, addPlant } = useStore();
  const isRTL = useRTL();

  // Generate dynamic Care Map recommendations based on selected room, window direction and current season
  const getCareMapRecommendations = () => {
    const currentSeason = getCurrentSeason();
    const careRecs = getCareRecommendations(selectedLocation as any, selectedDirection as any, currentSeason);
    
    // Translate the entire recommendation object
    return getCareRecommendationTranslated(careRecs, isRTL);
  };

  // Initialize nickname with plant name for better UX
  React.useEffect(() => {
    if (identificationResult && !nickname) {
      setNickname(identificationResult.common_name || 'My Plant');
    }
    
    // Debug: Log the identification result to see what data we have
    if (identificationResult) {
      console.log('🔍 AddPlantScreen - Identification Result:', JSON.stringify(identificationResult, null, 2));
      console.log('🌿 Plant Info:', identificationResult.plant_info);
      console.log('🏷️ Plant Type:', identificationResult.plant_type);
      console.log('💧 Watering Schedule:', identificationResult.watering_schedule);
      console.log('☁️ Humidity:', identificationResult.preferred_humidity);
      console.log('☀️ Orientation:', identificationResult.preferred_orientation);
    }
  }, [identificationResult]);

  const handleSave = async () => {
    // Check if user is guest or not authenticated - require signup for plant saving
    if (!user || user.id.startsWith('guest-')) {
      Alert.alert(
        'Sign up to Lotus to save your plant 🌿', 
        'Create an account to save plants to your collection and get personalized care reminders.',
        [
          { 
            text: 'Not Now', 
            style: 'cancel'
            // Just closes the popup - user stays on the screen
          },
          { 
            text: 'Yes', 
            onPress: () => {
              // Navigate to the auth screen for signup
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' as never }],
              });
            }
          }
        ]
      );
      return;
    }

    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname for your plant');
      return;
    }

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
          console.error('Error uploading image:', uploadError);
          Alert.alert('Image Upload Failed', 'The plant data will be saved without the image.');
        }
      }

      // Calculate next watering date (default 7 days)
      const nextWatering = new Date();
      nextWatering.setDate(nextWatering.getDate() + 7);

      const newPlant = {
        user_id: user.id,
        nickname: nickname.trim(),
        location: selectedLocation as 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony',
        window_direction: selectedDirection as 'north' | 'east' | 'south' | 'west',
        image_url: imageUrl,
        next_watering_at: nextWatering.toISOString(),
        // TODO: The following properties should be handled by the database:
        // id: should be auto-generated as a UUID by the database.
        // health_status: 'healthy', // Add this column to your 'plants' table in Supabase.
        // created_at: should be set by a default value in the database (e.g., now()).
        // updated_at: should be set by a default value or trigger in the database.
      };

      // Save to database (authenticated users only)
      const { data, error } = await dbService.addPlant(newPlant);
      
      if (error) throw error;
      if (data) {
        addPlant(data);
        Alert.alert(
          'Plant Added! 🌿',
          `${nickname} has been added to your garden`,
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('🚀 Navigating back to main tabs after save');
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
                      index: 2, // Navigate to Plants tab
                    }
                  }],
                });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error saving plant:', error);
      Alert.alert('Error', 'Failed to save plant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('addPlant.title')}</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isLoading || !nickname.trim()}
          >
            <Text style={[
              styles.saveButton,
              (!nickname.trim() || isLoading) && styles.saveButtonDisabled
            ]}>
              {isLoading ? t('common.loading') : t('common.save')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plant Preview */}
        {(identificationResult || capturedImage) && (
          <View style={styles.previewSection}>
            {capturedImage && (
              <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            )}
            
            {identificationResult && (
              <View style={styles.identificationInfo}>
                <Text style={styles.identifiedName}>
                  ✓ {identificationResult.common_name}
                </Text>
                <Text style={styles.scientificName}>
                  {identificationResult.scientific_name}
                </Text>
                <Text style={styles.confidence}>
                  {identificationResult.confidence}% match
                </Text>
                
                {/* Plant Care Information */}
                {(identificationResult.plant_info || identificationResult.plant_type) && (
                  <View style={styles.careInfoSection}>
                    <Text style={styles.careTitle}>{t('plantDetail.careGuide')}</Text>
                    
                    {identificationResult.plant_info && (
                      <Text style={styles.plantDescription}>
                        {identificationResult.plant_info}
                      </Text>
                    )}
                    
                    <View style={styles.careDetails}>
                      {identificationResult.plant_type && (
                        <View style={styles.careItem}>
                          <Ionicons name="leaf" size={16} color={COLORS.primary} />
                          <Text style={styles.careLabel}>{t('plantDetail.careLabels.type')}</Text>
                          <Text style={styles.careValue}>
                            {identificationResult.plant_type.charAt(0).toUpperCase() + identificationResult.plant_type.slice(1)}
                          </Text>
                        </View>
                      )}
                      
                      {identificationResult.watering_schedule && (
                        <View style={styles.careItem}>
                          <Ionicons name="water" size={16} color={COLORS.primary} />
                          <Text style={styles.careLabel}>{t('plantDetail.careLabels.watering')}</Text>
                          <Text style={styles.careValue}>
                            {identificationResult.watering_schedule}
                          </Text>
                        </View>
                      )}
                      
                      {identificationResult.preferred_humidity && (
                        <View style={styles.careItem}>
                          <Ionicons name="cloud" size={16} color={COLORS.primary} />
                          <Text style={styles.careLabel}>{t('plantDetail.careLabels.humidity')}</Text>
                          <Text style={styles.careValue}>
                            {identificationResult.preferred_humidity.charAt(0).toUpperCase() + identificationResult.preferred_humidity.slice(1)}
                          </Text>
                        </View>
                      )}
                      
                      {identificationResult.preferred_orientation && (
                        <View style={styles.careItem}>
                          <Ionicons name="sunny" size={16} color={COLORS.primary} />
                          <Text style={styles.careLabel}>{t('plantDetail.careLabels.light')}</Text>
                          <Text style={styles.careValue}>
                            {identificationResult.preferred_orientation}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>{t('addPlant.customizeTitle')}</Text>

          {/* Plant Nickname */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('addPlant.plantNickname')}</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder={
                identificationResult 
                  ? `e.g. My ${identificationResult.common_name}`
                  : 'e.g. Living Room Plant'
              }
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          {/* Plant Location */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('addPlant.plantLocation')}</Text>
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
                  <Text style={[
                    styles.optionText,
                    selectedLocation === location.value && styles.optionTextSelected,
                  ]}>
                    {location.label}
                  </Text>
                  <Text style={[
                    styles.optionTextAr,
                    selectedLocation === location.value && styles.optionTextArSelected,
                  ]}>
                    {location.labelAr}
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
                      selectedDirection === direction.value && styles.compassDirectionSelected,
                    ]}
                    onPress={() => setSelectedDirection(direction.value)}
                  >
                    <Text style={[
                      styles.compassText,
                      selectedDirection === direction.value && styles.compassTextSelected,
                    ]}>
                      {direction.value.charAt(0).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                <View style={styles.compassCenter}>
                  <Text style={styles.compassCenterIcon}>🧭</Text>
                </View>
              </View>
              
              <Text style={styles.selectedDirection}>
                {t('addPlant.selectedDirection')} {t(`addPlant.directions.${selectedDirection}`)}
              </Text>
            </View>
          </View>

          {/* Care Map */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Care Map</Text>
            
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
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButtonLarge,
              (!nickname.trim() || isLoading) && styles.saveButtonLargeDisabled,
            ]}
            onPress={handleSave}
            disabled={isLoading || !nickname.trim()}
          >
            <Ionicons 
              name="checkmark-circle-outline" 
              size={24} 
              color={(!nickname.trim() || isLoading) ? COLORS.textSecondary : COLORS.white} 
            />
            <Text style={[
              styles.saveButtonLargeText,
              (!nickname.trim() || isLoading) && styles.saveButtonLargeTextDisabled,
            ]}>
              {isLoading ? t('common.loading') : t('addPlant.saveToCollection')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  saveButtonDisabled: {
    color: COLORS.textSecondary,
  },
  previewSection: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  identificationInfo: {
    alignItems: 'center',
  },
  identifiedName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  confidence: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  formGroup: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  optionCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
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
    width: 200,
    height: 200,
    position: 'relative',
    backgroundColor: COLORS.background,
    borderRadius: 100,
    marginBottom: 16,
  },
  compassDirection: {
    position: 'absolute',
    width: 40,
    height: 40,
    backgroundColor: COLORS.white,
    borderRadius: 20,
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
    top: 0,
    left: '50%',
    marginLeft: -20,
  },
  compassEast: {
    right: 0,
    top: '50%',
    marginTop: -20,
  },
  compassSouth: {
    bottom: 0,
    left: '50%',
    marginLeft: -20,
  },
  compassWest: {
    left: 0,
    top: '50%',
    marginTop: -20,
  },
  compassText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  compassTextSelected: {
    color: COLORS.white,
  },
  compassCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compassCenterIcon: {
    fontSize: 24,
  },
  selectedDirection: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  tipsContainer: {
    gap: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    gap: 16, // Add space between icon and text
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 24, // Increased spacing
    fontFamily: 'Helvetica', // Force system font for emoji rendering
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  saveButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    marginTop: 16,
  },
  saveButtonLargeDisabled: {
    backgroundColor: COLORS.border,
  },
  saveButtonLargeText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonLargeTextDisabled: {
    color: COLORS.textSecondary,
  },
  bottomPadding: {
    height: 20,
  },
  // Plant Care Information Styles
  careInfoSection: {
    marginTop: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  careTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 12,
  },
  plantDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  careDetails: {
    gap: 12,
  },
  careItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  careLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
    minWidth: 70,
  },
  careValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
});