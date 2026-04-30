import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';
import PlantCard from '../components/PlantCard';
import SearchBar from '../components/SearchBar';
import { plantDatabaseService } from '../services/plantDatabase';
import { Plant, PlantMatch } from '../types';
import { useRTL } from '../utils/rtl';

interface AddScanScreenProps {
  navigation: any;
}

export default function AddScanScreen({ navigation }: AddScanScreenProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const [searchQuery, setSearchQuery] = useState('');
  const [popularPlants, setPopularPlants] = useState<Plant[]>([]);
  const [searchResults, setSearchResults] = useState<PlantMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Track keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleCancelSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    Keyboard.dismiss();
  }, []);

  useEffect(() => {
    // Load popular plants (hardcoded for Phase 1)
    const allPlants = plantDatabaseService.getAllPlants();

    // Popular plant IDs - all available on kaynuna.co
    const popularIds = [
      'snake_plant',      // Easy care, air purifying
      'golden_pothos',    // Beginner-friendly, trailing
      'peace_lily',       // Flowering, low light tolerant
      'jade_plant',       // Succulent, good luck plant
      'calathea',         // Beautiful leaf patterns
      'aglaonema',        // Colorful, easy care
      'maranta',          // Prayer plant, unique movement
    ];
    const popular = allPlants.filter(plant => popularIds.includes(plant.id));

    setPopularPlants(popular);
  }, []);

  // Debounced search function - minimum 2 characters
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    // Require minimum 2 characters for search to reduce unnecessary re-renders
    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timeoutId = setTimeout(() => {
      const results = plantDatabaseService.searchPlants({ text: searchQuery });
      setSearchResults(results);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  const handlePlantPress = useCallback((plant: Plant) => {
    // Format watering schedule for display
    const wateringMap: Record<string, string> = {
      '100_dry': '100% Dry - Water when completely dry',
      '60_dry': '60% Dry - Water when mostly dry',
      '30_dry': '30% Dry - Water when slightly dry'
    };

    // Format light requirement for display
    const lightMap: Record<string, string> = {
      'bright_direct': 'Indoor/Outdoor - South Window (Direct Sun)',
      'bright_indirect': 'Indoor - East/West Window (Bright Indirect)',
      'medium_indirect': 'Indoor - East Window (Medium Light)',
      'low_light': 'Indoor - North Window (Low Light)',
    };

    // Navigate to PlantResult screen to show plant details first
    // User can learn about the plant, then decide to add it to garden
    // Use plant data directly - no need to search since we already have it!
    navigation.navigate('PlantResult', {
      identificationResult: {
        confidence: 100, // From database, so 100% confidence
        common_name: plant.names.common[0], // Use plant's actual name
        scientific_name: plant.names.scientific[0],
        family: plant.characteristics.family,
        genus: plant.names.scientific[0]?.split(' ')[0], // Extract genus from scientific name
        plant_info: plant.care.plant_info, // Use plant's actual description
        // 🌐 Arabic content from database
        common_name_arabic: plant.names.arabic?.[0],
        plant_info_arabic: plant.care.plant_info_arabic,
        plant_type: plant.care.plant_type,
        watering_schedule: wateringMap[plant.care.watering.schedule] || plant.care.watering.description,
        preferred_humidity: plant.care.humidity || 'Medium',
        preferred_orientation: lightMap[plant.care.light.requirement] || plant.care.light.description,
        suggestions: [],
        // Add database_match object to indicate this is a perfect database match
        database_match: {
          found: true,
          confidence: 100, // Perfect match since user selected from database
          match_type: 'exact', // Exact match - user manually selected this plant
          plant_id: plant.id,
          primary_plant_name: plant.names.common[0],
          primary_plant_info: plant.care.plant_info,
          // 🌐 Arabic content from database
          primary_plant_name_arabic: plant.names.arabic?.[0],
          primary_plant_info_arabic: plant.care.plant_info_arabic,
          alternatives: [], // No alternatives needed for manual selection
        },
        care_available: true, // This plant has full care information in our database
      },
      capturedImage: undefined, // No camera photo - this is a database plant
      plantDatabaseId: plant.id, // Database plant ID (e.g., "euphorbia_trigona") for local WebP lookup
      fromSearch: true, // Flag to indicate this came from search
    });
  }, [navigation]);

  const handleIdentifyPress = () => {
    // Navigate to camera screen (current ScanScreen)
    navigation.navigate('Camera');
  };

  // Render section title and empty state only (no search bar)
  const renderHeader = useCallback(() => (
    <>
      {/* Section Title */}
      <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
        {isSearching ? t('addScan.searchResults') : t('addScan.popularPlants')}
      </Text>

      {/* Empty Search Results */}
      {isSearching && searchQuery.trim().length > 0 && searchResults.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, isRTL && styles.emptyTextRTL]}>{t('addScan.noResults', { query: searchQuery })}</Text>
        </View>
      )}
    </>
  ), [isSearching, searchQuery, searchResults.length, isRTL, t]);

  // Render individual plant card (virtualized)
  const renderPlantCard = useCallback(({ item }: { item: Plant }) => (
    <PlantCard
      plant={item}
      onPress={() => handlePlantPress(item)}
    />
  ), [handlePlantPress]);

  // Get items to display (either search results or popular plants)
  const plantsToDisplay = isSearching
    ? searchResults.map(result => result.plant)
    : popularPlants;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Section - Outside FlatList */}
      <View style={styles.staticHeader}>
        <Text style={[styles.title, isRTL && styles.titleRTL]}>{t('addScan.title')}</Text>
        <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
          {t('addScan.subtitle')}
        </Text>
      </View>

      {/* Search Row - Camera integrated inside SearchBar */}
      <View style={[styles.searchRow, isRTL && styles.searchRowRTL]}>
        <View style={[styles.searchContainer, isKeyboardVisible && styles.searchContainerExpanded]}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            onClear={handleClearSearch}
            onCameraPress={!isKeyboardVisible ? handleIdentifyPress : undefined}
          />
        </View>

        {isKeyboardVisible && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelSearch}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Plant List - Only section title and results */}
      <FlatList
        data={plantsToDisplay}
        renderItem={renderPlantCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !isSearching && popularPlants.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading plants...</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        // Keyboard behavior - dismiss on scroll, handle taps
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        // Performance optimizations
        removeClippedSubviews={false}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={7}
        windowSize={5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  staticHeader: {
    paddingHorizontal: FIBONACCI.LG,
    marginTop: FIBONACCI.LG,
    marginBottom: FIBONACCI.MD,
  },
  scrollContent: {
    paddingHorizontal: FIBONACCI.LG,
    paddingBottom: FIBONACCI.XXL,
  },
  header: {
    marginTop: FIBONACCI.LG,
    marginBottom: FIBONACCI.XL,
  },
  title: {
    fontSize: TYPOGRAPHY.XXL, // 34px
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: FIBONACCI.MD,
  },
  titleRTL: {
    textAlign: 'right',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.LG, // 21px line height
  },
  subtitleRTL: {
    textAlign: 'right',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: FIBONACCI.LG,
    marginBottom: FIBONACCI.LG,
  },
  searchRowRTL: {
    flexDirection: 'row-reverse',
  },
  searchContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.XL, // 26px
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: FIBONACCI.LG,
  },
  sectionTitleRTL: {
    textAlign: 'right',
  },
  emptyState: {
    paddingVertical: FIBONACCI.XXL,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.BASE,
    color: COLORS.textSecondary,
  },
  emptyTextRTL: {
    textAlign: 'center',
  },
  searchContainerExpanded: {
    flex: 1,
    marginRight: FIBONACCI.MD,
  },
  cancelButton: {
    paddingHorizontal: FIBONACCI.MD,
    paddingVertical: FIBONACCI.SM,
  },
  cancelText: {
    fontSize: TYPOGRAPHY.BASE,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
