import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import {
  COLORS,
  FIBONACCI,
  TYPOGRAPHY,
  ELEMENT_SIZES,
} from '../constants';
import { useStore } from '../store';
import type { IdentificationResult } from '../types';
import { authService, dbService } from '../services/supabase';
import NameCollectionModal from '../components/NameCollectionModal';
import { logger, timer } from '../utils/logger';
import { useRTL } from '../utils/rtl';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface PlantResultScreenProps {
  route: {
    params: {
      identificationResult: IdentificationResult;
      capturedImage: string;
    };
  };
}

export default function PlantResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const isRTL = useRTL();

  const { identificationResult, capturedImage } = route.params as PlantResultScreenProps['route']['params'];

  const { user, isAuthenticated, isGuest, setUser, setAuthenticated, updateUserName } = useStore();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [showNameCollection, setShowNameCollection] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);

  // Animation for phone modal slide-up and fade-in
  const phoneModalSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const phoneModalFadeAnim = useRef(new Animated.Value(0)).current;

  // Animate phone modal when it appears/disappears
  useEffect(() => {
    if (showPhoneAuth) {
      // Parallel animations: fade in overlay + slide up card
      Animated.parallel([
        Animated.timing(phoneModalFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(phoneModalSlideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    } else {
      // Parallel animations: fade out overlay + slide down card
      Animated.parallel([
        Animated.timing(phoneModalFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(phoneModalSlideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showPhoneAuth]);

  const handlePostAuthSuccess = () => {
    // Close all modals
    setShowAuthPrompt(false);
    setShowPhoneAuth(false);
    setShowNameCollection(false);

    // Navigate to AddPlant screen with the identification result
    if (identificationResult) {
      navigation.navigate('AddPlant', {
        identificationResult,
        capturedImage,
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    logger.group('🔐 Google Sign-In Flow (Modal)');
    timer.start('google-signin-modal');

    try {
      logger.debug('Initiating Google OAuth from modal...');
      const { data, error } = await authService.signInWithGoogle();
      if (error) throw error;

      if (data && 'user' in data && data.user) {
        logger.debug('Google OAuth successful', { userId: data.user.id, email: data.user.email });

        const { data: profileData } = await dbService.getProfile(data.user.id);
        const hasFirstName = profileData?.first_name && profileData.first_name.trim().length > 0;

        const googleFullName = data.user.user_metadata?.name;
        const googleFirstName = googleFullName?.split(' ')[0]?.trim();

        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: profileData?.first_name || googleFullName || data.user.email,
          first_name: profileData?.first_name || googleFirstName,
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        };

        if (!hasFirstName && googleFirstName) {
          // Auto-save Google-provided name
          logger.info('Auto-saving Google-provided name', { firstName: googleFirstName });
          try {
            await dbService.updateUserProfile(data.user.id, googleFirstName);
            setUser({
              ...userData,
              first_name: googleFirstName,
              name: googleFirstName,
            });
            updateUserName(googleFirstName);
            setAuthenticated(true);
            logger.success('User authenticated with auto-saved name');
            timer.end('google-signin-modal');
            logger.groupEnd();
            setIsLoading(false);
            handlePostAuthSuccess();
          } catch (saveError) {
            logger.error('Error auto-saving Google name:', saveError);
            setPendingUser(userData);
            setShowNameCollection(true);
            logger.groupEnd();
            setIsLoading(false);
          }
        } else if (!hasFirstName && !googleFirstName) {
          // Show name collection modal
          logger.info('Showing name collection modal');
          setPendingUser(userData);
          setShowNameCollection(true);
          timer.end('google-signin-modal');
          logger.groupEnd();
          setIsLoading(false);
        } else {
          // Existing user with first_name
          logger.success('Returning user authenticated', { firstName: userData.first_name });
          setUser(userData);
          setAuthenticated(true);
          timer.end('google-signin-modal');
          logger.groupEnd();
          setIsLoading(false);
          handlePostAuthSuccess();
        }
      }
    } catch (error) {
      logger.error('Google sign in error:', error);
      logger.groupEnd();
      Alert.alert('Sign In Failed', 'Please try again.');
      setIsLoading(false);
    }
  };

  const handlePhoneSignIn = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setIsLoading(true);
    try {
      const fullPhoneNumber = `+20${phoneNumber}`;
      const { error } = await authService.signInWithOtp(fullPhoneNumber);
      if (error) throw error;

      Alert.alert('OTP Sent', `A verification code has been sent to ${fullPhoneNumber}.`);
      setIsVerifyingOTP(true);
    } catch (error) {
      logger.error('Phone auth error:', error);
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      const fullPhoneNumber = `+20${phoneNumber}`;
      const { data, error } = await authService.verifyOtp(fullPhoneNumber, otpCode);
      if (error) throw error;

      if (data && data.user) {
        const { data: profileData } = await dbService.getProfile(data.user.id);
        const hasFirstName = profileData?.first_name && profileData.first_name.trim().length > 0;

        const userData = {
          id: data.user.id,
          phone: data.user.phone,
          name: profileData?.first_name || data.user.user_metadata?.name || `User ${data.user.phone?.slice(-4)}`,
          first_name: profileData?.first_name,
          created_at: data.user.created_at,
        };

        if (!hasFirstName) {
          setPendingUser(userData);
          setShowNameCollection(true);
          setIsLoading(false);
        } else {
          setUser(userData);
          setAuthenticated(true);
          setIsLoading(false);
          resetPhoneAuth();
          handlePostAuthSuccess();
        }
      } else {
        Alert.alert('Error', 'Could not verify OTP. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      logger.error('OTP verification error:', error);
      Alert.alert('Error', 'Verification failed. Invalid code or server error.');
      setIsLoading(false);
    }
  };

  const handleNameSubmit = async (firstName: string) => {
    if (!pendingUser) return;

    setIsLoading(true);
    try {
      const { error } = await dbService.updateUserProfile(pendingUser.id, firstName);
      if (error) throw error;

      const updatedUser = {
        ...pendingUser,
        first_name: firstName,
        name: firstName,
      };

      setUser(updatedUser);
      updateUserName(firstName);
      setAuthenticated(true);
      setShowNameCollection(false);
      setPendingUser(null);
      handlePostAuthSuccess();
    } catch (error) {
      logger.error('Error saving user name:', error);
      Alert.alert('Error', 'Failed to save your name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPhoneAuth = () => {
    setShowPhoneAuth(false);
    setIsVerifyingOTP(false);
    setPhoneNumber('');
    setOtpCode('');
  };

  const saveToMyPlants = () => {
    if (isGuest || !isAuthenticated || !user) {
      setShowAuthPrompt(true);
      return;
    }

    if (identificationResult) {
      navigation.navigate('AddPlant', {
        identificationResult,
        capturedImage,
      });
    }
  };

  const handleSignInPress = () => {
    setShowAuthPrompt(false);
    navigation.navigate('Auth');
  };

  const retryCapture = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Name Collection Modal */}
      <NameCollectionModal
        visible={showNameCollection}
        onSubmit={handleNameSubmit}
      />

      {/* Inline Authentication Modal */}
      <Modal
        visible={showAuthPrompt}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAuthPrompt(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalGradient}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAuthPrompt(false)}
            >
              <Ionicons name="close" size={FIBONACCI.LG} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.modalContent}>
              {/* Auth Buttons */}
              <View style={styles.authButtons}>
                <TouchableOpacity
                  style={styles.phoneButton}
                  onPress={() => {
                    console.log('📱 Phone button pressed!');
                    logger.debug('Opening phone auth modal');
                    setShowPhoneAuth(true);
                  }}
                  disabled={isLoading}
                >
                  <Ionicons name="call" size={FIBONACCI.LG} color={COLORS.primary} />
                  <Text style={styles.phoneButtonText}>{t('auth.continueWithPhone')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <Ionicons name="logo-google" size={FIBONACCI.LG} color={COLORS.primary} />
                  <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.appleButton} disabled={true}>
                  <View style={styles.appleButtonContent}>
                    <Ionicons name="logo-apple" size={FIBONACCI.LG} color={COLORS.primary} />
                    <Text style={styles.appleButtonText}>{t('auth.continueWithApple')}</Text>
                    <View style={styles.comingSoonBadge}>
                      <Text style={styles.comingSoonText}>{t('auth.comingSoon')}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Loading State */}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.white} />
                  <Text style={styles.loadingText}>{t('auth.signingIn')}</Text>
                </View>
              )}

              {/* Already a member? Sign in */}
              <TouchableOpacity onPress={handleSignInPress} style={styles.signInLink}>
                <Text style={styles.signInText}>{t('auth.alreadyMember')}</Text>
              </TouchableOpacity>

              {/* Maybe later */}
              <TouchableOpacity
                onPress={() => setShowAuthPrompt(false)}
                style={styles.maybeLaterButton}
              >
                <Text style={styles.maybeLaterText}>{t('auth.maybeLater')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Phone Auth Modal - Nested INSIDE Auth Modal with Slide Animation */}
          {showPhoneAuth && (
            <Animated.View style={[styles.phoneModalOverlay, { opacity: phoneModalFadeAnim }]}>
              <Animated.View
                style={[
                  styles.phoneModalContent,
                  {
                    transform: [{ translateY: phoneModalSlideAnim }],
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.phoneAuthCard}>
                  {!isVerifyingOTP ? (
                    <>
                      <Text style={styles.phoneModalTitle}>Enter your phone number</Text>
                      <View style={styles.phoneModalInputContainer}>
                        <Text style={styles.phoneModalCountryCode}>+20</Text>
                        <TextInput
                          style={styles.phoneModalInput}
                          placeholder="1xxxxxxxxx"
                          placeholderTextColor={COLORS.textSecondary}
                          value={phoneNumber}
                          onChangeText={setPhoneNumber}
                          keyboardType="phone-pad"
                          maxLength={10}
                          autoFocus
                        />
                      </View>
                      <View style={styles.phoneModalButtons}>
                        <TouchableOpacity
                          style={styles.phoneModalBackButton}
                          onPress={resetPhoneAuth}
                          disabled={isLoading}
                        >
                          <Text style={styles.phoneModalBackButtonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.phoneModalSendButton}
                          onPress={handlePhoneSignIn}
                          disabled={isLoading || !phoneNumber.trim()}
                        >
                          {isLoading ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                          ) : (
                            <Text style={styles.phoneModalSendButtonText}>Send Code</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.phoneModalTitle}>Enter verification code</Text>
                      <Text style={styles.phoneModalSubtitle}>Sent to +20{phoneNumber}</Text>
                      <TextInput
                        style={styles.phoneModalOtpInput}
                        placeholder="123456"
                        placeholderTextColor={COLORS.textSecondary}
                        value={otpCode}
                        onChangeText={setOtpCode}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                      />
                      <View style={styles.phoneModalButtons}>
                        <TouchableOpacity
                          style={styles.phoneModalBackButton}
                          onPress={resetPhoneAuth}
                          disabled={isLoading}
                        >
                          <Text style={styles.phoneModalBackButtonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.phoneModalSendButton}
                          onPress={handleOTPVerification}
                          disabled={isLoading || !otpCode.trim()}
                        >
                          {isLoading ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                          ) : (
                            <Text style={styles.phoneModalSendButtonText}>Verify</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          )}
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.headerTitleRTL]}>{t('plantResult.title')}</Text>
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
          <View style={styles.imageContainer}>
            {capturedImage && <Image source={{ uri: capturedImage }} style={styles.resultImage} />}
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {identificationResult.confidence}% confidence
              </Text>
            </View>
          </View>

          <View style={styles.plantInfo}>
            <Text style={[styles.plantName, isRTL && styles.plantNameRTL]}>{identificationResult.common_name}</Text>
            <Text style={[styles.scientificName, isRTL && styles.scientificNameRTL]}>
              {identificationResult.scientific_name}
            </Text>
            {identificationResult.family && (
              <Text style={[styles.familyName, isRTL && styles.familyNameRTL]}>Family: {identificationResult.family}</Text>
            )}
          </View>

          {/* Plant Description */}
          {identificationResult.plant_info && (
            <View style={styles.careSection}>
              <Text style={[styles.careTitle, isRTL && styles.careTitleRTL]}>{t('plantResult.plantStory')}</Text>
              <Text style={[styles.plantDescription, isRTL && styles.plantDescriptionRTL]}>
                {identificationResult.plant_info}
              </Text>
            </View>
          )}

          {/* Unlock Plant's Full Potential */}
          <View style={styles.careSection}>
            <Text style={styles.careTitle}>{t('plantResult.unlockPotential')}</Text>
            
            <View style={styles.careDetails}>
              <View style={styles.unlockItem}>
                <Ionicons name="heart-outline" size={20} color={COLORS.primary} style={styles.unlockIcon} />
                <Text style={styles.unlockLabel}>{t('plantResult.features.saveToGarden')}</Text>
                {isGuest && <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />}
              </View>

              <View style={styles.unlockItem}>
                <Ionicons name="water-outline" size={20} color={COLORS.primary} style={styles.unlockIcon} />
                <Text style={styles.unlockLabel}>{t('plantResult.features.smartWatering')}</Text>
                {isGuest && <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />}
              </View>

              <View style={styles.unlockItem}>
                <Ionicons name="compass-outline" size={20} color={COLORS.primary} style={styles.unlockIcon} />
                <Text style={styles.unlockLabel}>{t('plantResult.features.placementTips')}</Text>
                {isGuest && <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />}
              </View>

              <View style={styles.unlockItem}>
                <Ionicons name="book-outline" size={20} color={COLORS.primary} style={styles.unlockIcon} />
                <Text style={styles.unlockLabel}>{t('plantResult.features.careGuides')}</Text>
                {isGuest && <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />}
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveToMyPlants}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {isAuthenticated && !isGuest ? t('plantResult.buttons.saveAuth') : t('plantResult.buttons.saveGuest')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.retryButton} onPress={retryCapture}>
              <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              <Text style={styles.retryButtonText}>{t('plantResult.buttons.tryAnother')}</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Ionicons name="information-circle" size={FIBONACCI.MD} color={COLORS.textSecondary} />
            <Text style={styles.footerText}>{t('plantResult.imageProcessingNote')}</Text>
          </View>
        </ScrollView>
      )}
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
    flexGrow: 1,
  },
  imageContainer: {
    marginBottom: FIBONACCI.SM, // 8px
  },
  resultImage: {
    width: '100%',
    height: FIBONACCI.HUGE, // 144px
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px
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
    marginBottom: FIBONACCI.MD, // 13px - Reduced spacing
  },
  plantName: {
    fontSize: TYPOGRAPHY.XXL, // 34px
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
  careSection: {
    marginBottom: FIBONACCI.MD, // 13px - Reduced spacing
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
    marginTop: FIBONACCI.SM, // 8px - Small top margin
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

  // Inline Authentication Modal Styles - Pure Fibonacci Golden Ratio System
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
    position: 'relative', // Allow absolute positioning for nested phone modal
  },
  modalGradient: {
    borderTopLeftRadius: FIBONACCI.LG, // 21px - Golden ratio rounded corners
    borderTopRightRadius: FIBONACCI.LG, // 21px
    paddingTop: FIBONACCI.XXL, // 55px - Fibonacci top padding
    paddingHorizontal: FIBONACCI.XL, // 34px - Fibonacci horizontal padding
    paddingBottom: FIBONACCI.XXXL, // 89px - Extra safe area padding (Fibonacci)
  },
  closeButton: {
    position: 'absolute',
    top: FIBONACCI.LG, // 21px - Fibonacci positioning
    right: FIBONACCI.LG, // 21px - Fibonacci positioning
    width: ELEMENT_SIZES.ICON_MD, // 34px - Standard icon size (Fibonacci)
    height: ELEMENT_SIZES.ICON_MD, // 34px
    borderRadius: FIBONACCI.MD + 4, // 17px - Perfect circle (half of 34)
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Subtle white background
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalContent: {
    marginTop: FIBONACCI.MD, // 13px - Fibonacci spacing
  },
  authButtons: {
    gap: FIBONACCI.LG, // 21px - Fibonacci button gaps
    marginBottom: FIBONACCI.XL, // 34px - Fibonacci section spacing
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    height: ELEMENT_SIZES.BUTTON_MD, // 55px - Fibonacci button height
    borderRadius: FIBONACCI.XL, // 34px - Pill shape
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: FIBONACCI.SM,
    elevation: 4,
    gap: FIBONACCI.SM, // 8px - Icon spacing
  },
  phoneButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio typography
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    height: ELEMENT_SIZES.BUTTON_MD, // 55px - Fibonacci button height
    borderRadius: FIBONACCI.XL, // 34px - Pill shape
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: FIBONACCI.SM,
    elevation: 4,
  },
  googleButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio typography
    fontWeight: '600',
    marginLeft: FIBONACCI.MD,
  },
  appleButton: {
    backgroundColor: COLORS.white,
    height: ELEMENT_SIZES.BUTTON_MD, // 55px - Fibonacci button height
    borderRadius: FIBONACCI.XL, // 34px - Pill shape
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: FIBONACCI.SM,
    elevation: 4,
    position: 'relative',
  },
  appleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  appleButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio typography
    fontWeight: '600',
    marginLeft: FIBONACCI.MD,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -FIBONACCI.SM, // -8px - Anchored to Apple button top edge
    right: FIBONACCI.SM, // 8px - Closer to right edge
    backgroundColor: '#2D5F3F', // Lotus Green - dark teal/green
    paddingHorizontal: FIBONACCI.SM, // 8px - Compact padding
    paddingVertical: FIBONACCI.XXS, // 3px - Minimal vertical padding
    borderRadius: FIBONACCI.MD, // 13px - Pill-shaped badge
    shadowColor: '#000',
    shadowOffset: { width: 0, height: FIBONACCI.XXS }, // 3px - Subtle depth
    shadowOpacity: 0.2,
    shadowRadius: FIBONACCI.XS, // 5px - Soft shadow
    elevation: 3,
  },
  comingSoonText: {
    fontSize: 8,
    color: '#FFFFFF', // Pure white for maximum brightness
    fontWeight: '700',
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: FIBONACCI.MD, // 13px - Fibonacci tappable area
    marginTop: FIBONACCI.SM, // 8px - Fibonacci spacing after buttons
  },
  signInText: {
    fontSize: TYPOGRAPHY.SM, // 14px - Golden ratio typography
    color: COLORS.white,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  maybeLaterButton: {
    alignItems: 'center',
    paddingVertical: FIBONACCI.MD, // 13px - Fibonacci tappable area
    marginTop: FIBONACCI.LG, // 21px - Fibonacci spacing from sign in link
  },
  maybeLaterText: {
    fontSize: TYPOGRAPHY.SM, // 14px - Consistent with sign in text
    color: COLORS.white,
    fontWeight: '500',
    opacity: 0.8, // Slightly muted to de-emphasize
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: FIBONACCI.LG,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.white,
    marginTop: FIBONACCI.SM,
    opacity: 0.8,
  },

  // Phone Auth Modal Styles (Nested Inside Auth Modal)
  phoneModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  phoneModalContent: {
    width: '90%',
    maxWidth: 400,
  },
  phoneAuthCard: {
    backgroundColor: COLORS.white,
    borderRadius: FIBONACCI.LG, // 21px - Golden ratio rounding
    padding: FIBONACCI.XL, // 34px - Generous padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: FIBONACCI.SM }, // 8px shadow
    shadowOpacity: 0.25,
    shadowRadius: FIBONACCI.LG, // 21px blur
    elevation: 10,
  },
  phoneModalTitle: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.MD, // 18px - Golden ratio typography
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: FIBONACCI.LG, // 21px - Golden ratio spacing
  },
  phoneModalSubtitle: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.SM, // 14px - Golden ratio typography
    textAlign: 'center',
    marginBottom: FIBONACCI.MD, // 13px - Golden ratio spacing
  },
  phoneModalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px - Golden ratio rounding
    paddingHorizontal: FIBONACCI.MD, // 13px - Golden ratio padding
    marginBottom: FIBONACCI.LG, // 21px - Golden ratio spacing
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  phoneModalCountryCode: {
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio typography
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: FIBONACCI.SM, // 8px - Fibonacci spacing
  },
  phoneModalInput: {
    flex: 1,
    height: ELEMENT_SIZES.INPUT_MD, // 55px - Fibonacci input height
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio typography
    color: COLORS.text,
  },
  phoneModalOtpInput: {
    backgroundColor: COLORS.background,
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px - Golden ratio rounding
    paddingHorizontal: FIBONACCI.MD, // 13px - Golden ratio padding
    height: ELEMENT_SIZES.INPUT_MD, // 55px - Fibonacci input height
    fontSize: TYPOGRAPHY.MD, // 18px - Golden ratio typography
    textAlign: 'center',
    color: COLORS.text,
    letterSpacing: FIBONACCI.SM, // 8px - Fibonacci letter spacing
    marginBottom: FIBONACCI.LG, // 21px - Golden ratio spacing
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  phoneModalButtons: {
    flexDirection: 'row',
    gap: FIBONACCI.MD, // 13px - Golden ratio gap
  },
  phoneModalBackButton: {
    flex: 1,
    height: ELEMENT_SIZES.BUTTON_MD, // 55px - Fibonacci button height
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px - Golden ratio rounding
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneModalBackButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio typography
    fontWeight: '500',
  },
  phoneModalSendButton: {
    flex: 2,
    height: ELEMENT_SIZES.BUTTON_MD, // 55px - Fibonacci button height
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px - Golden ratio rounding
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneModalSendButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio typography
    fontWeight: '600',
  },
});