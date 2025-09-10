/**
 * Enhanced Progressive Onboarding Component
 * World-class user activation following Duolingo/Headspace patterns
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import Text from './Text';
import Button from './Button';
import LotusLogo from './LotusLogo';
import { Colors, Typography, Layout, AnimationGuidelines } from '@/constants';
import { OnboardingProfile, OnboardingStep, OnboardingState } from '../types/onboarding';
import { ONBOARDING_STEPS } from '../data/onboardingData';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

interface EnhancedOnboardingProps {
  onComplete: (profile: OnboardingProfile) => void;
  onSkip?: () => void;
}

export default function EnhancedOnboarding({ onComplete, onSkip }: EnhancedOnboardingProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    totalSteps: ONBOARDING_STEPS.length,
    profile: {
      language: i18n.language as 'en' | 'ar',
    },
    isComplete: false,
    canProceed: false,
    recommendations: [],
  });

  const [progressAnimation] = useState(new Animated.Value(0));
  const [stepAnimation] = useState(new Animated.Value(1));

  const currentStepData = ONBOARDING_STEPS[state.currentStep];
  const isRTL = i18n.language === 'ar';

  // Animate progress bar
  useEffect(() => {
    const progress = (state.currentStep + 1) / state.totalSteps;
    Animated.timing(progressAnimation, {
      toValue: progress,
      duration: AnimationGuidelines.durations.normal,
      useNativeDriver: false,
    }).start();
  }, [state.currentStep]);

  // Step transition animation
  const animateStepTransition = useCallback(() => {
    Animated.sequence([
      Animated.timing(stepAnimation, {
        toValue: 0.8,
        duration: AnimationGuidelines.durations.fast,
        useNativeDriver: true,
      }),
      Animated.timing(stepAnimation, {
        toValue: 1,
        duration: AnimationGuidelines.durations.normal,
        useNativeDriver: true,
      }),
    ]).start();
  }, [stepAnimation]);

  const handleOptionSelect = useCallback((optionId: string, multiSelect?: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setState(prevState => {
      const updatedProfile = { ...prevState.profile };
      const stepId = currentStepData.id;

      if (multiSelect) {
        // Handle multi-select options
        const currentValues = (updatedProfile[stepId as keyof OnboardingProfile] as string[]) || [];
        const isSelected = currentValues.includes(optionId);
        
        if (isSelected) {
          updatedProfile[stepId as keyof OnboardingProfile] = currentValues.filter(id => id !== optionId) as any;
        } else {
          updatedProfile[stepId as keyof OnboardingProfile] = [...currentValues, optionId] as any;
        }
      } else {
        // Handle single select
        updatedProfile[stepId as keyof OnboardingProfile] = optionId as any;
      }

      // Check if we can proceed
      const canProceed = currentStepData.required ? 
        (multiSelect ? 
          ((updatedProfile[stepId as keyof OnboardingProfile] as string[])?.length || 0) > 0 :
          !!updatedProfile[stepId as keyof OnboardingProfile]
        ) : true;

      return {
        ...prevState,
        profile: updatedProfile,
        canProceed,
      };
    });
  }, [currentStepData]);

  const handleNext = useCallback(async () => {
    if (!state.canProceed && currentStepData.required) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateStepTransition();

    if (state.currentStep < state.totalSteps - 1) {
      setState(prevState => ({
        ...prevState,
        currentStep: prevState.currentStep + 1,
        canProceed: !ONBOARDING_STEPS[prevState.currentStep + 1].required, // Default for next step
      }));
    } else {
      // Onboarding complete - generate recommendations
      await completeOnboarding();
    }
  }, [state, currentStepData, animateStepTransition]);

  const handleBack = useCallback(() => {
    if (state.currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateStepTransition();
      
      setState(prevState => ({
        ...prevState,
        currentStep: prevState.currentStep - 1,
        canProceed: true, // Previous steps were already validated
      }));
    }
  }, [state.currentStep, animateStepTransition]);

  const completeOnboarding = async () => {
    try {
      // Show success animation
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Create final profile
      const finalProfile: OnboardingProfile = {
        experience: state.profile.experience || 'beginner',
        interests: (state.profile.interests as string[]) || [],
        spaceType: state.profile.space || 'apartment',
        lightConditions: state.profile.light || 'medium',
        climate: 'mediterranean', // Default for Egypt
        goals: (state.profile.goals as string[]) || [],
        language: state.profile.language || 'en',
        name: state.profile.name,
      } as OnboardingProfile;

      // Save profile and complete
      onComplete(finalProfile);
      
    } catch (error) {
      console.error('Onboarding completion error:', error);
      Alert.alert('Error', 'Failed to save your preferences. Please try again.');
    }
  };

  const handleSkip = useCallback(() => {
    Alert.alert(
      isRTL ? 'تخطي الإعداد' : 'Skip Setup',
      isRTL ? 'هل أنت متأكد؟ سيساعدك الإعداد في الحصول على توصيات نباتات أفضل.' : 'Are you sure? Setup helps us give you better plant recommendations.',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { 
          text: isRTL ? 'تخطي' : 'Skip', 
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSkip?.();
          }
        },
      ]
    );
  }, [isRTL, onSkip]);

  const isOptionSelected = useCallback((optionId: string) => {
    const stepId = currentStepData.id;
    const value = state.profile[stepId as keyof OnboardingProfile];
    
    if (Array.isArray(value)) {
      return value.includes(optionId);
    }
    return value === optionId;
  }, [state.profile, currentStepData]);

  const renderOption = useCallback((option: any, index: number) => {
    const isSelected = isOptionSelected(option.id);
    const isRecommended = option.recommended;

    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.optionCard,
          isSelected && styles.optionCardSelected,
          isRecommended && !isSelected && styles.optionCardRecommended,
        ]}
        onPress={() => handleOptionSelect(option.id, currentStepData.multiSelect)}
        activeOpacity={0.8}
      >
        <View style={styles.optionContent}>
          <View style={styles.optionHeader}>
            <Ionicons 
              name={getIconName(option.icon)} 
              size={24} 
              color={isSelected ? Colors.pureWhite : Colors.lotusGreen} 
            />
            {isRecommended && !isSelected && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>
                  {isRTL ? 'مُوصى' : 'Popular'}
                </Text>
              </View>
            )}
            {isSelected && (
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color={Colors.pureWhite} 
              />
            )}
          </View>
          
          <Text style={[
            styles.optionTitle,
            isSelected && styles.optionTitleSelected
          ]}>
            {isRTL ? option.labelAr : option.labelEn}
          </Text>
          
          {option.description && (
            <Text style={[
              styles.optionDescription,
              isSelected && styles.optionDescriptionSelected
            ]}>
              {isRTL ? option.description.ar : option.description.en}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [isOptionSelected, handleOptionSelect, currentStepData.multiSelect, isRTL]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F7F3E9', '#E8F5E8']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleBack} disabled={state.currentStep === 0}>
              <Ionicons 
                name={isRTL ? "chevron-forward" : "chevron-back"} 
                size={24} 
                color={state.currentStep === 0 ? Colors.border : Colors.textPrimary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipButton}>
                {isRTL ? 'تخطي' : 'Skip'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  {
                    width: progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {state.currentStep + 1} {isRTL ? 'من' : 'of'} {state.totalSteps}
            </Text>
          </View>
        </View>

        {/* Content */}
        <Animated.View 
          style={[
            styles.content,
            { transform: [{ scale: stepAnimation }] }
          ]}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Step Header */}
            <View style={styles.stepHeader}>
              <LotusLogo size="medium" variant="default" showText={false} />
              
              <Text style={styles.stepTitle}>
                {isRTL ? currentStepData.titleAr : currentStepData.titleEn}
              </Text>
              
              <Text style={styles.stepSubtitle}>
                {isRTL ? currentStepData.subtitleAr : currentStepData.subtitleEn}
              </Text>

              {currentStepData.tips && (
                <View style={styles.tipContainer}>
                  <Ionicons name="bulb-outline" size={16} color={Colors.nileBlue} />
                  <Text style={styles.tipText}>
                    {isRTL ? currentStepData.tips.ar : currentStepData.tips.en}
                  </Text>
                </View>
              )}
            </View>

            {/* Options */}
            {currentStepData.options && (
              <View style={styles.optionsContainer}>
                {currentStepData.options.map(renderOption)}
              </View>
            )}
          </ScrollView>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            variant="primary"
            title={state.currentStep === state.totalSteps - 1 ? 
              (isRTL ? 'ابدأ الآن' : 'Get Started') : 
              (isRTL ? 'التالي' : 'Continue')
            }
            onPress={handleNext}
            disabled={!state.canProceed && currentStepData.required}
            style={styles.continueButton}
          />
          
          {currentStepData.multiSelect && state.canProceed && (
            <Text style={styles.selectionHint}>
              {isRTL ? 'يمكنك اختيار أكثر من خيار' : 'You can select multiple options'}
            </Text>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

// Helper function to map icon names
function getIconName(iconId: string): any {
  const iconMap: { [key: string]: any } = {
    'seedling': 'leaf-outline',
    'potted-plant': 'flower-outline',
    'tree': 'tree-outline',
    'apartment': 'business-outline',
    'house': 'home-outline',
    'office-building': 'business-outline',
    'balcony': 'partly-sunny-outline',
    'cloud': 'cloudy-outline',
    'partly-sunny': 'partly-sunny-outline',
    'sunny': 'sunny-outline',
    'partly-cloudy': 'partly-sunny-outline',
    'leaf': 'leaf-outline',
    'cactus': 'flower-outline',
    'flower': 'rose-outline',
    'herb': 'leaf-outline',
    'hanging-plant': 'leaf-outline',
    'palm-tree': 'tree-outline',
    'air-purifier': 'leaf-outline',
    'meditation': 'heart-outline',
    'decoration': 'color-palette-outline',
    'graduation-cap': 'school-outline',
    'chef-hat': 'restaurant-outline',
  };
  
  return iconMap[iconId] || 'ellipse-outline';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    paddingTop: Layout.statusBarHeight,
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Layout.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.lg,
  },
  skipButton: {
    ...Typography.buttonSecondary,
    color: Colors.nileBlue,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.lotusGreen,
    borderRadius: 3,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Layout.xs,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Layout.xl,
  },
  stepHeader: {
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Layout.xl,
  },
  stepTitle: {
    ...Typography.screenTitle,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Layout.lg,
    marginBottom: Layout.sm,
  },
  stepSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.lg,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Layout.sm,
    borderRadius: Layout.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.nileBlue,
  },
  tipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Layout.xs,
    flex: 1,
  },
  optionsContainer: {
    paddingHorizontal: Layout.screenPadding,
    gap: Layout.sm,
  },
  optionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.cardRadius,
    padding: Layout.md,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionCardSelected: {
    backgroundColor: Colors.lotusGreen,
    borderColor: Colors.lotusGreen,
  },
  optionCardRecommended: {
    borderColor: Colors.nileBlue,
    borderWidth: 2,
  },
  optionContent: {
    alignItems: 'flex-start',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Layout.xs,
  },
  recommendedBadge: {
    backgroundColor: Colors.nileBlue,
    paddingHorizontal: Layout.xs,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recommendedText: {
    ...Typography.caption,
    color: Colors.pureWhite,
    fontSize: 10,
    fontWeight: '600',
  },
  optionTitle: {
    ...Typography.sectionHeader,
    color: Colors.textPrimary,
    marginBottom: Layout.xs,
  },
  optionTitleSelected: {
    color: Colors.pureWhite,
  },
  optionDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  optionDescriptionSelected: {
    color: Colors.pureWhite,
    opacity: 0.9,
  },
  footer: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Layout.screenPadding + (Layout.bottomTabHeight || 0),
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    marginBottom: Layout.sm,
  },
  selectionHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});