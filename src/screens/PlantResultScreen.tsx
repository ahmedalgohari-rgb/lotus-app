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
import NameCollectionModal from '../components/NameCollectionModal';
import MatchBadge from '../components/MatchBadge';
import PartialMatchCard from '../components/PartialMatchCard';
import GenericCareCard from '../components/GenericCareCard';
import PlantRequestButton from '../components/PlantRequestButton';
import CultivarPicker from '../components/CultivarPicker';
import { getPlantImage } from '../assets/plantImages';
import { logger, timer } from '../utils/logger';
import { useRTL } from '../utils/rtl';
import { processCapturedPhoto } from '../utils/imageProcessor';

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
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [showNameCollection, setShowNameCollection] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);

  // 🌿 CULTIVAR REFINER: Optional refinement for species with multiple varieties
  const [showCultivarRefiner, setShowCultivarRefiner] = useState(false);

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
  const getMatchScenario = (): 'full' | 'genus' | 'family' | 'none' => {
    if (!identificationResult?.database_match?.found) {
      return 'none';
    }

    const { confidence, match_type } = identificationResult.database_match;

    // FULL_MATCH: Exact or high-confidence genus match
    if (confidence >= 85) {
      return 'full';
    }

    // GENUS_MATCH: All genus matches show alternatives (any confidence)
    if (match_type === 'genus') {
      return 'genus';
    }

    // FAMILY_MATCH: Common name match or low-confidence genus
    if (match_type === 'common_name' || (confidence >= 60 && confidence < 70)) {
      return 'family';
    }

    return 'none';
  };

  const matchScenario = identificationResult ? getMatchScenario() : 'none';
  const dbMatch = identificationResult?.database_match;
  const currentLang = getCurrentLanguage(); // 🌐 FIX: Get current language for localization

  // 🐛 DEBUG: Log what data we have
  useEffect(() => {
    console.log('=== PLANT RESULT DEBUG ===');
    console.log('Current Language:', currentLang);
    console.log('English Name:', identificationResult?.common_name);
    console.log('Arabic Name:', identificationResult?.common_name_arabic);
    console.log('English Info:', identificationResult?.plant_info?.substring(0, 30));
    console.log('Arabic Info:', identificationResult?.plant_info_arabic?.substring(0, 30));
    console.log('DB Match Found:', dbMatch?.found);
    console.log('DB Match Arabic Name:', dbMatch?.primary_plant_name_arabic);
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

  useEffect(() => {
    if (plantDatabaseId && dbMatch?.all_cultivars) {
      // User selected a specific cultivar - update the displayed info
      const selectedCultivar = dbMatch.all_cultivars.find(c => c.plant_id === plantDatabaseId);
      if (selectedCultivar) {
        // Fetch the full plant data from database
        const plantData = require('../data/plantCareDatabase.json');
        const fullPlantData = plantData.plants.find((p: any) => p.id === plantDatabaseId);

        if (fullPlantData) {
          // 🌐 LOCALIZATION: Use Arabic name/info when language is Arabic
          const plantName = currentLang === 'ar' && fullPlantData.names.arabic?.length > 0
            ? fullPlantData.names.arabic[0]
            : fullPlantData.names.common[0];

          const plantInfo = currentLang === 'ar' && fullPlantData.care?.plant_info_arabic
            ? fullPlantData.care.plant_info_arabic
            : (fullPlantData.care?.plant_info || identificationResult.plant_info);

          setDisplayedPlantName(plantName);
          setDisplayedPlantInfo(plantInfo);
          logger.debug('🌿 Updated display to cultivar:', plantDatabaseId, { lang: currentLang });
        }
      }
    }
  }, [plantDatabaseId, currentLang]);

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

  // 🌿 CULTIVAR REFINER: User manually refines to a specific variety
  const handleCultivarRefine = (plantId: string) => {
    logger.info('🌿 User refined to cultivar:', plantId);

    // Navigate to PlantResult with the specific cultivar selected
    // This reloads the screen with the refined plant data
    const selectedCultivar = identificationResult?.database_match?.all_cultivars?.find(
      c => c.plant_id === plantId
    );

    if (selectedCultivar) {
      navigation.replace('PlantResult', {
        identificationResult,
        capturedImage,
        plantDatabaseId: plantId, // This will override the default selection
      });
    }
  };

  const handlePostAuthSuccess = () => {
    // Close all modals
    setShowAuthPrompt(false);
    setShowPhoneAuth(false);
    setShowNameCollection(false);

    // Navigate to AddPlant screen with the identification result
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

  const handleFacebookSignIn = async () => {
    setIsLoading(true);
    logger.group('🔐 Facebook Sign-In Flow (Modal)');
    timer.start('facebook-signin-modal');

    try {
      logger.debug('Initiating Facebook OAuth from modal...');
      const { data, error } = await authService.signInWithFacebook();
      if (error) throw error;

      if (data && 'user' in data && data.user) {
        logger.debug('Facebook OAuth successful', { userId: data.user.id, email: data.user.email });

        const { data: profileData } = await dbService.getProfile(data.user.id);
        const hasFirstName = profileData?.first_name && profileData.first_name.trim().length > 0;

        const facebookFullName = data.user.user_metadata?.name || data.user.user_metadata?.full_name;
        const facebookFirstName = facebookFullName?.split(' ')[0]?.trim();

        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: profileData?.first_name || facebookFullName || data.user.email,
          first_name: profileData?.first_name || facebookFirstName,
          avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture?.data?.url,
          created_at: data.user.created_at,
        };

        if (!hasFirstName && facebookFirstName) {
          // Auto-save Facebook-provided name
          logger.info('Auto-saving Facebook-provided name', { firstName: facebookFirstName });
          try {
            await dbService.updateUserProfile(data.user.id, facebookFirstName);
            setUser({
              ...userData,
              first_name: facebookFirstName,
              name: facebookFirstName,
            });
            updateUserName(facebookFirstName);
            setAuthenticated(true);
            logger.success('User authenticated with auto-saved name');
            timer.end('facebook-signin-modal');
            logger.groupEnd();
            setIsLoading(false);
            handlePostAuthSuccess();
          } catch (saveError) {
            logger.error('Error auto-saving Facebook name:', saveError);
            setPendingUser(userData);
            setShowNameCollection(true);
            logger.groupEnd();
            setIsLoading(false);
          }
        } else if (!hasFirstName && !facebookFirstName) {
          // Show name collection modal
          logger.info('Showing name collection modal');
          setPendingUser(userData);
          setShowNameCollection(true);
          timer.end('facebook-signin-modal');
          logger.groupEnd();
          setIsLoading(false);
        } else {
          // Existing user with first_name
          logger.success('Returning user authenticated', { firstName: userData.first_name });
          setUser(userData);
          setAuthenticated(true);
          timer.end('facebook-signin-modal');
          logger.groupEnd();
          setIsLoading(false);
          handlePostAuthSuccess();
        }
      }
    } catch (error: any) {
      logger.error('Facebook sign in error:', error);
      logger.groupEnd();

      // Don't show error alert if user intentionally cancelled
      if (error?.name !== 'UserCancelled' && error?.message !== 'User cancelled OAuth') {
        Alert.alert('Sign In Failed', 'Please try again.');
      }

      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    logger.group('🔐 Apple Sign-In Flow (Modal)');
    timer.start('apple-signin-modal');

    try {
      logger.debug('Initiating Apple OAuth from modal...');
      const { data, error } = await authService.signInWithApple();
      if (error) throw error;

      if (data && 'user' in data && data.user) {
        logger.debug('Apple OAuth successful', { userId: data.user.id, email: data.user.email });

        const { data: profileData } = await dbService.getProfile(data.user.id);
        const hasFirstName = profileData?.first_name && profileData.first_name.trim().length > 0;

        const appleFullName = data.user.user_metadata?.name || data.user.user_metadata?.full_name;
        const appleFirstName = appleFullName?.split(' ')[0]?.trim();

        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: profileData?.first_name || appleFullName || data.user.email,
          first_name: profileData?.first_name || appleFirstName,
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        };

        if (!hasFirstName && appleFirstName) {
          // Auto-save Apple-provided name
          logger.info('Auto-saving Apple-provided name', { firstName: appleFirstName });
          try {
            await dbService.updateUserProfile(data.user.id, appleFirstName);
            setUser({
              ...userData,
              first_name: appleFirstName,
              name: appleFirstName,
            });
            updateUserName(appleFirstName);
            setAuthenticated(true);
            logger.success('User authenticated with auto-saved name');
            timer.end('apple-signin-modal');
            logger.groupEnd();
            setIsLoading(false);
            handlePostAuthSuccess();
          } catch (saveError) {
            logger.error('Error auto-saving Apple name:', saveError);
            setPendingUser(userData);
            setShowNameCollection(true);
            logger.groupEnd();
            setIsLoading(false);
          }
        } else if (!hasFirstName && !appleFirstName) {
          // Show name collection modal
          logger.info('Showing name collection modal');
          setPendingUser(userData);
          setShowNameCollection(true);
          timer.end('apple-signin-modal');
          logger.groupEnd();
          setIsLoading(false);
        } else {
          // Existing user with first_name
          logger.success('Returning user authenticated', { firstName: userData.first_name });
          setUser(userData);
          setAuthenticated(true);
          timer.end('apple-signin-modal');
          logger.groupEnd();
          setIsLoading(false);
          handlePostAuthSuccess();
        }
      }
    } catch (error: any) {
      logger.error('Apple sign in error:', error);
      logger.groupEnd();

      // Don't show error alert if user intentionally cancelled
      if (error?.name !== 'UserCancelled' && error?.message !== 'User cancelled OAuth') {
        Alert.alert('Sign In Failed', 'Please try again.');
      }

      setIsLoading(false);
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
    } catch (error: any) {
      logger.error('Google sign in error:', error);
      logger.groupEnd();

      // Don't show error alert if user intentionally cancelled
      if (error?.name !== 'UserCancelled' && error?.message !== 'User cancelled OAuth') {
        Alert.alert('Sign In Failed', 'Please try again.');
      }

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

  const handleSignInPress = () => {
    setShowAuthPrompt(false);
    navigation.navigate('Auth');
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
      {/* Name Collection Modal */}
      <NameCollectionModal
        visible={showNameCollection}
        onSubmit={handleNameSubmit}
      />

      {/* Cultivar picker removed - now using inline refiner card */}

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
                  style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                  onPress={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <Ionicons name="logo-google" size={FIBONACCI.LG} color={COLORS.primary} />
                  <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.facebookButton, isLoading && styles.buttonDisabled]}
                  onPress={handleFacebookSignIn}
                  disabled={isLoading}
                >
                  <Ionicons name="logo-facebook" size={FIBONACCI.LG} color={COLORS.primary} />
                  <Text style={styles.facebookButtonText}>{t('auth.continueWithFacebook')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.appleButton, isLoading && styles.buttonDisabled]}
                  onPress={handleAppleSignIn}
                  disabled={isLoading}
                >
                  <Ionicons name="logo-apple" size={FIBONACCI.LG} color={COLORS.primary} />
                  <Text style={styles.appleButtonText}>{t('auth.continueWithApple')}</Text>
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
          <View style={styles.imageContainer}>
            <Image
              source={
                // PRIORITY FIX: When user scans a plant, ONLY show their photo!
                // Stock database images only for plants selected from search (no scan)
                capturedImage ? { uri: capturedImage } :
                plantDatabaseId && !capturedImage ? getPlantImage(plantDatabaseId) :
                { uri: 'https://i.imgur.com/2n3nS2Y.png' }
              }
              style={styles.resultImage}
              resizeMode="cover"
            />
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
            <Text style={[styles.scientificName, isRTL && styles.scientificNameRTL]}>
              {identificationResult.scientific_name}
            </Text>
            {identificationResult.family && (
              <Text style={[styles.familyName, isRTL && styles.familyNameRTL]}>Family: {identificationResult.family}</Text>
            )}
          </View>

          {/* 🌿 OPTIONAL CULTIVAR REFINER: Show when multiple varieties exist */}
          {dbMatch?.multiple_cultivars && dbMatch.all_cultivars && dbMatch.all_cultivars.length > 1 && (
            <View style={styles.refinerCard}>
              <TouchableOpacity
                style={styles.refinerHeader}
                onPress={() => setShowCultivarRefiner(!showCultivarRefiner)}
                activeOpacity={0.7}
              >
                <View style={styles.refinerTitleContainer}>
                  <Ionicons name="leaf-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.refinerTitle}>Refine Your Match</Text>
                </View>
                <Ionicons
                  name={showCultivarRefiner ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>

              {showCultivarRefiner && (
                <View style={styles.refinerContent}>
                  <Text style={styles.refinerSubtitle}>
                    We detected a {identificationResult.common_name}.{'\n'}
                    Which picture matches yours?
                  </Text>

                  <View style={styles.cultivarGrid}>
                    {dbMatch.all_cultivars.map((cultivar) => (
                      <TouchableOpacity
                        key={cultivar.plant_id}
                        style={[
                          styles.cultivarOption,
                          cultivar.is_selected && styles.cultivarOptionSelected
                        ]}
                        onPress={() => handleCultivarRefine(cultivar.plant_id)}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={getPlantImage(cultivar.plant_id)}
                          style={styles.cultivarImage}
                          resizeMode="cover"
                        />
                        <View style={styles.cultivarInfo}>
                          <Text style={styles.cultivarName} numberOfLines={2}>
                            {cultivar.plant_name}
                          </Text>
                          {cultivar.is_selected && (
                            <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Low Confidence Warning (15-40%) - Encourage users to retake for better results */}
          {dbMatch && dbMatch.confidence < 40 && dbMatch.confidence >= 15 && capturedImage && (
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

          {/* Match Scenario: GENUS_MATCH (70-84% confidence) */}
          {matchScenario === 'genus' && (
            <>
              <View style={styles.careSection}>
                <Text style={[styles.careTitle, isRTL && styles.careTitleRTL]}>
                  ℹ️ {t('plantResult.matchTypes.genus')}
                </Text>
                <Text style={[styles.careDescription, isRTL && styles.careDescriptionRTL]}>
                  {t('plantResult.matchMessages.genusMatch')}
                </Text>
              </View>

              {dbMatch?.alternatives && dbMatch.alternatives.length > 0 && (
                <PartialMatchCard
                  genusName={identificationResult.genus || ''}
                  alternatives={dbMatch.alternatives}
                  onAlternativePress={(plantId) => {
                    isProceedingToSave.current = true; // Don't delete cloud image - user is saving!
                    // Navigate to AddPlant with selected database plant
                    navigation.navigate('AddPlant', { plantDatabaseId: plantId });
                  }}
                />
              )}
            </>
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
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveToMyPlants}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {isAuthenticated && !isGuest ? t('plantResult.buttons.saveAuth') : t('plantResult.buttons.saveGuest')}
              </Text>
            </TouchableOpacity>

            {/* Only show "Try Another" button if user came from camera scan (not from search) */}
            {capturedImage && (
              <TouchableOpacity style={styles.retryButton} onPress={retryCapture}>
                <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                <Text style={styles.retryButtonText}>{t('plantResult.buttons.tryAnother')}</Text>
              </TouchableOpacity>
            )}

            {/* Show request button for partial/no matches */}
            {(matchScenario === 'genus' || matchScenario === 'family' || matchScenario === 'none') && (
              <PlantRequestButton
                plantName={identificationResult.common_name}
                scientificName={identificationResult.scientific_name}
                buttonText={
                  matchScenario === 'genus'
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
    paddingBottom: FIBONACCI.XL, // 34px - Moderate bottom spacing for thumb zone optimization
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
  facebookButton: {
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
  facebookButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio typography
    fontWeight: '600',
    marginLeft: FIBONACCI.MD,
  },
  appleButton: {
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
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextDisabled: {
    color: '#999',
  },

  // Dynamic Provider Attribution Watermark (adapts to active provider)
  // Positioned based on provider preferences (PlantNet, Plant.id, Google Vision, etc.)
  // Only displayed if provider requires attribution
  providerAttribution: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent white for readability
    paddingHorizontal: FIBONACCI.SM, // 8px - Compact padding
    paddingVertical: FIBONACCI.XXS + 2, // 5px - Minimal vertical padding
    borderRadius: FIBONACCI.XS, // 5px - Subtle rounded corners
    shadowColor: '#000',
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