/**
 * CultivarPicker Component
 *
 * A best-in-class modal for selecting between multiple plant cultivars
 * when PlantNet identifies a species with multiple varieties in our database.
 *
 * Design Philosophy:
 * - Large photos for easy visual distinction
 * - Smooth animations for premium feel
 * - Golden ratio spacing (Fibonacci system)
 * - Accessible touch targets
 * - Clear "skip" option for uncertain users
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import {
  COLORS,
  FIBONACCI,
  TYPOGRAPHY,
  ELEMENT_SIZES,
} from '../constants';
import { getPlantImage } from '../assets/plantImages';
import { useRTL } from '../utils/rtl';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - FIBONACCI.XL * 2 - FIBONACCI.MD) / 2; // 2-column grid with spacing
const CARD_HEIGHT = CARD_WIDTH * 1.4; // Golden ratio-ish aspect

interface CultivarOption {
  plant_id: string;
  plant_name: string;
  scientific_name?: string;
  distinguishing_feature?: string; // e.g., "Yellow-edged leaves"
}

interface CultivarPickerProps {
  visible: boolean;
  speciesName: string; // e.g., "Dracaena reflexa"
  genusName: string; // e.g., "Dracaena"
  cultivars: CultivarOption[];
  onSelect: (plantId: string) => void;
  onSkip: () => void;
  onClose: () => void;
}

export default function CultivarPicker({
  visible,
  speciesName,
  genusName,
  cultivars,
  onSelect,
  onSkip,
  onClose,
}: CultivarPickerProps) {
  const isRTL = useRTL();

  // Animations
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef(
    cultivars.map(() => new Animated.Value(0))
  ).current;

  // Update card animations when cultivars change
  useEffect(() => {
    // Reset animations when cultivars change
    if (cultivars.length !== cardAnimations.length) {
      cardAnimations.length = 0;
      cultivars.forEach(() => cardAnimations.push(new Animated.Value(0)));
    }
  }, [cultivars]);

  useEffect(() => {
    if (visible) {
      // Parallel: Fade in backdrop + Slide up modal
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start(() => {
        // Stagger card animations after modal appears
        const animations = cultivars.map((_, index) =>
          Animated.spring(cardAnimations[index] || new Animated.Value(0), {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
            delay: index * 50,
          })
        );
        Animated.stagger(80, animations).start();
      });
    } else {
      // Reset animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Reset card animations
      cardAnimations.forEach(anim => anim.setValue(0));
    }
  }, [visible]);

  const handleSelect = (plantId: string) => {
    // Quick fade out, then callback
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => onSelect(plantId));
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop with blur */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Modal Content */}
      <Animated.View
        style={[
          styles.modalContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <LinearGradient
          colors={[COLORS.background, '#FFFFFF']}
          style={styles.modalContent}
        >
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="leaf" size={24} color={COLORS.primary} />
            </View>
            <Text style={[styles.title, isRTL && styles.titleRTL]}>
              Which variety is yours?
            </Text>
            <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
              We found {cultivars.length} varieties of{' '}
              <Text style={styles.speciesHighlight}>{genusName}</Text>
            </Text>
          </View>

          {/* Cultivar Grid */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            <View style={styles.grid}>
              {cultivars.map((cultivar, index) => {
                const animValue = cardAnimations[index] || new Animated.Value(1);

                return (
                  <Animated.View
                    key={cultivar.plant_id}
                    style={[
                      styles.cardWrapper,
                      {
                        opacity: animValue,
                        transform: [
                          {
                            scale: animValue.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.8, 1],
                            }),
                          },
                          {
                            translateY: animValue.interpolate({
                              inputRange: [0, 1],
                              outputRange: [30, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.card}
                      activeOpacity={0.85}
                      onPress={() => handleSelect(cultivar.plant_id)}
                    >
                      {/* Plant Image */}
                      <View style={styles.imageContainer}>
                        <Image
                          source={getPlantImage(cultivar.plant_id)}
                          style={styles.plantImage}
                          resizeMode="cover"
                        />
                        {/* Gradient overlay for text readability */}
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.7)']}
                          style={styles.imageGradient}
                        />
                      </View>

                      {/* Plant Info */}
                      <View style={styles.cardInfo}>
                        <Text
                          style={[styles.plantName, isRTL && styles.plantNameRTL]}
                          numberOfLines={2}
                        >
                          {cultivar.plant_name}
                        </Text>
                        {cultivar.distinguishing_feature && (
                          <Text
                            style={[styles.feature, isRTL && styles.featureRTL]}
                            numberOfLines={1}
                          >
                            {cultivar.distinguishing_feature}
                          </Text>
                        )}
                      </View>

                      {/* Select Indicator */}
                      <View style={styles.selectIndicator}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                        <Text style={styles.selectText}>Select</Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>

          {/* Skip Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkip}
              activeOpacity={0.7}
            >
              <Ionicons name="help-circle-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.skipText}>Not sure? Use general care</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.85, // Golden ratio: 85% of screen
    borderTopLeftRadius: FIBONACCI.XL, // 34px
    borderTopRightRadius: FIBONACCI.XL,
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
    paddingTop: FIBONACCI.SM, // 8px for handle bar
    paddingBottom: FIBONACCI.XXXL, // 89px for safe area + footer
  },
  handleBar: {
    width: FIBONACCI.XXL, // 55px
    height: FIBONACCI.XS, // 5px
    backgroundColor: COLORS.border,
    borderRadius: FIBONACCI.XXS, // 3px
    alignSelf: 'center',
    marginBottom: FIBONACCI.MD, // 13px
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: FIBONACCI.XL, // 34px
    paddingBottom: FIBONACCI.LG, // 21px
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerIcon: {
    width: FIBONACCI.XXL, // 55px
    height: FIBONACCI.XXL,
    borderRadius: FIBONACCI.XL, // 34px - circle
    backgroundColor: `${COLORS.primary}15`, // 15% opacity
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: FIBONACCI.MD, // 13px
  },
  title: {
    fontSize: TYPOGRAPHY.XL, // 26px
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: FIBONACCI.XS, // 5px
  },
  titleRTL: {
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.BASE, // 16px
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  subtitleRTL: {
    textAlign: 'center',
  },
  speciesHighlight: {
    fontStyle: 'italic',
    color: COLORS.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    marginTop: FIBONACCI.MD, // 13px
  },
  gridContainer: {
    paddingHorizontal: FIBONACCI.LG, // 21px
    paddingBottom: FIBONACCI.LG, // 21px
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: FIBONACCI.MD, // 13px
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: FIBONACCI.XS, // 5px
  },
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: FIBONACCI.MD, // 13px
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: FIBONACCI.SM, // 8px
  },
  plantName: {
    fontSize: TYPOGRAPHY.SM, // 14px
    fontWeight: '700',
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  plantNameRTL: {
    textAlign: 'right',
  },
  feature: {
    fontSize: TYPOGRAPHY.XXS, // 10px
    color: 'rgba(255,255,255,0.85)',
    marginTop: FIBONACCI.XXS, // 3px
  },
  featureRTL: {
    textAlign: 'right',
  },
  selectIndicator: {
    position: 'absolute',
    top: FIBONACCI.SM, // 8px
    right: FIBONACCI.SM, // 8px
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: FIBONACCI.SM, // 8px
    paddingVertical: FIBONACCI.XXS, // 3px
    borderRadius: FIBONACCI.MD, // 13px
    gap: FIBONACCI.XXS, // 3px
    opacity: 0, // Hidden by default
  },
  selectText: {
    fontSize: TYPOGRAPHY.XXS, // 10px
    fontWeight: '600',
    color: COLORS.white,
  },
  footer: {
    paddingHorizontal: FIBONACCI.XL, // 34px
    paddingTop: FIBONACCI.MD, // 13px
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: FIBONACCI.MD, // 13px
    gap: FIBONACCI.XS, // 5px
  },
  skipText: {
    fontSize: TYPOGRAPHY.SM, // 14px
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
