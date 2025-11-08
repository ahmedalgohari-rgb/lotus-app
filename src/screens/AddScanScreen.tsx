import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';
import PlantCard from '../components/PlantCard';
import SearchBar from '../components/SearchBar';
import { plantDatabaseService } from '../services/plantDatabase';
import { Plant, PlantMatch } from '../types';
import { useRTL } from '../utils/rtl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  // Debounced search function - minimum 1 character (strict substring matching)
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    // Require minimum 1 character for search (strict substring matching prevents too many results)
    if (trimmedQuery.length < 1) {
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

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const handlePlantPress = (plant: Plant) => {
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
        plant_type: plant.care.plant_type,
        watering_schedule: wateringMap[plant.care.watering.schedule] || plant.care.watering.description,
        preferred_humidity: plant.care.humidity || 'Medium',
        preferred_orientation: lightMap[plant.care.light.requirement] || plant.care.light.description,
        suggestions: [],
      },
      capturedImage: (plant as any).image_url || null, // Use kaynuna database image
      fromSearch: true, // Flag to indicate this came from search
    });
  };

  const handleIdentifyPress = () => {
    // Navigate to camera screen (current ScanScreen)
    navigation.navigate('Camera');
  };

  // Render header component (non-virtualized, always visible)
  const renderHeader = () => (
    <>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={[styles.title, isRTL && styles.titleRTL]}>{t('addScan.title')}</Text>
        <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
          {t('addScan.subtitle')}
        </Text>
      </View>

      {/* Search + Identify Row */}
      <View style={[styles.searchRow, isRTL && styles.searchRowRTL]}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            onClear={handleClearSearch}
          />
        </View>

        <Text style={[styles.orText, isRTL && styles.orTextRTL]}>{t('addScan.or')}</Text>

        <TouchableOpacity
          style={styles.identifyButton}
          onPress={handleIdentifyPress}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={20} color={COLORS.text} />
          <Text style={[styles.identifyButtonText, isRTL && styles.identifyButtonTextRTL]}>{t('addScan.identify')}</Text>
        </TouchableOpacity>
      </View>

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
  );

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
        // Performance optimizations
        removeClippedSubviews={true}
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
    marginBottom: FIBONACCI.XL,
  },
  searchRowRTL: {
    flexDirection: 'row-reverse',
  },
  searchContainer: {
    flex: 1,
  },
  orText: {
    fontSize: TYPOGRAPHY.BASE,
    color: COLORS.textSecondary,
    marginHorizontal: FIBONACCI.MD,
    fontWeight: '500',
  },
  orTextRTL: {
    textAlign: 'center',
  },
  identifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4D03F', // Yellow color from reference design
    paddingHorizontal: FIBONACCI.LG,
    paddingVertical: FIBONACCI.MD,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    height: ELEMENT_SIZES.BUTTON_MD, // 55px - match search bar height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  identifyButtonText: {
    fontSize: TYPOGRAPHY.MD, // 18px - bigger text
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: FIBONACCI.XS,
  },
  identifyButtonTextRTL: {
    textAlign: 'center',
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
});
