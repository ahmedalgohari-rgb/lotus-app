import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';
import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES, LAYOUT_RATIO, PHI } from '../constants';
import { authService, dbService } from '../services/supabase';
import { useStore } from '../store';
import NameCollectionModal from '../components/NameCollectionModal';
import LegalDocumentModal from '../components/LegalDocumentModal';
import { logger, timer } from '../utils/logger';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface AuthScreenProps {
  navigation: any;
  route?: any;
}

export default function AuthScreen({ navigation, route }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showNameCollection, setShowNameCollection] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalDocumentType, setLegalDocumentType] = useState<'terms' | 'privacy'>('terms');
  const { setUser, setAuthenticated, signInAsGuest, updateUserName } = useStore();

  // Get return navigation parameters
  const { t } = useTranslation();
  const returnTo = route?.params?.returnTo;
  const identificationResult = route?.params?.identificationResult;
  const capturedImage = route?.params?.capturedImage;

  const handlePostAuthNavigation = () => {
    // ✅ Navigation handled automatically by NavigationContainer's key-based re-mount
    // When isAuthenticated/isGuest state changes, the entire nav tree rebuilds automatically
    // and shows the correct screens. No manual navigation needed.
    logger.debug('✅ Auth state updated - NavigationContainer will auto-navigate');
  };

  const handleOpenTerms = () => {
    setLegalDocumentType('terms');
    setShowLegalModal(true);
  };

  const handleOpenPrivacy = () => {
    setLegalDocumentType('privacy');
    setShowLegalModal(true);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    logger.group('🔐 Google Sign-In Flow');
    timer.start('google-signin');

    try {
      logger.debug('Initiating Google OAuth...');
      const { data, error } = await authService.signInWithGoogle();
      if (error) throw error;

      if (data && 'user' in data && data.user) {
        logger.debug('Google OAuth successful', { userId: data.user.id, email: data.user.email });

        // Check if user has a first_name in their profile
        const { data: profileData } = await dbService.getProfile(data.user.id);
        const hasFirstName = profileData?.first_name && profileData.first_name.trim().length > 0;

        // Try to extract first name from Google's full name
        const googleFullName = data.user.user_metadata?.name;
        const googleFirstName = googleFullName?.split(' ')[0]?.trim();

        logger.debug('Profile status', {
          hasStoredName: hasFirstName,
          googleProvidedName: !!googleFirstName,
          fullName: googleFullName
        });

        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: profileData?.first_name || googleFullName || data.user.email,
          first_name: profileData?.first_name || googleFirstName,
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        };

        if (!hasFirstName && googleFirstName) {
          // Google provided a name - auto-save it and skip modal
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
            timer.end('google-signin');
            logger.groupEnd();
            setIsLoading(false);
            handlePostAuthNavigation();
          } catch (saveError) {
            logger.error('Error auto-saving Google name:', saveError);
            // Fall back to showing modal
            setPendingUser(userData);
            setShowNameCollection(true);
            logger.groupEnd();
            setIsLoading(false);
          }
        } else if (!hasFirstName && !googleFirstName) {
          // No first_name in profile and Google didn't provide one - show modal
          logger.info('Showing name collection modal');
          setPendingUser(userData);
          setShowNameCollection(true);
          timer.end('google-signin');
          logger.groupEnd();
          setIsLoading(false);
        } else {
          // Existing user with first_name - proceed normally
          logger.success('Returning user authenticated', { firstName: userData.first_name });
          setUser(userData);
          setAuthenticated(true);
          timer.end('google-signin');
          logger.groupEnd();
          setIsLoading(false);
          handlePostAuthNavigation();
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

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    logger.group('🔐 Apple Sign-In Flow');
    timer.start('apple-signin');

    try {
      logger.debug('Initiating Apple OAuth...');
      const { data, error } = await authService.signInWithApple();
      if (error) throw error;

      if (data && 'user' in data && data.user) {
        logger.debug('Apple OAuth successful', { userId: data.user.id, email: data.user.email });

        // Check if user has a first_name in their profile
        const { data: profileData } = await dbService.getProfile(data.user.id);
        const hasFirstName = profileData?.first_name && profileData.first_name.trim().length > 0;

        // Extract name from Apple's user_metadata (Apple sends name on first sign-in)
        const appleFullName = data.user.user_metadata?.full_name
          || data.user.user_metadata?.name
          || (data.user.user_metadata?.first_name && data.user.user_metadata?.last_name
            ? `${data.user.user_metadata.first_name} ${data.user.user_metadata.last_name}`
            : data.user.user_metadata?.first_name);
        const appleFirstName = data.user.user_metadata?.first_name
          || appleFullName?.split(' ')[0]?.trim();

        logger.debug('Profile status', {
          hasStoredName: hasFirstName,
          appleProvidedName: !!appleFirstName,
          fullName: appleFullName
        });

        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: profileData?.first_name || appleFullName || data.user.email,
          first_name: profileData?.first_name || appleFirstName,
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        };

        if (!hasFirstName && appleFirstName) {
          // Apple provided a name - auto-save it and skip modal (Apple guideline requirement)
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
            timer.end('apple-signin');
            logger.groupEnd();
            setIsLoading(false);
            handlePostAuthNavigation();
          } catch (saveError) {
            logger.error('Error auto-saving Apple name:', saveError);
            // Apple didn't provide name or save failed — proceed without name
            // Do NOT show name modal (Apple guideline: don't ask for info Apple already provides)
            setUser(userData);
            setAuthenticated(true);
            logger.groupEnd();
            setIsLoading(false);
            handlePostAuthNavigation();
          }
        } else if (!hasFirstName && !appleFirstName) {
          // Apple didn't provide a name (happens on repeat sign-ins) — proceed without asking
          // Apple guideline: never ask for name/email after Sign in with Apple
          logger.info('No name from Apple (repeat sign-in), proceeding without name');
          setUser(userData);
          setAuthenticated(true);
          timer.end('apple-signin');
          logger.groupEnd();
          setIsLoading(false);
          handlePostAuthNavigation();
        } else {
          // Existing user with first_name - proceed normally
          logger.success('Returning user authenticated', { firstName: userData.first_name });
          setUser(userData);
          setAuthenticated(true);
          timer.end('apple-signin');
          logger.groupEnd();
          setIsLoading(false);
          handlePostAuthNavigation();
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

  const handleFacebookSignIn = async () => {
    setIsLoading(true);
    logger.group('🔐 Facebook Sign-In Flow');
    timer.start('facebook-signin');

    try {
      logger.debug('Initiating Facebook OAuth...');
      const { data, error } = await authService.signInWithFacebook();
      if (error) throw error;

      if (data && 'user' in data && data.user) {
        logger.debug('Facebook OAuth successful', { userId: data.user.id, email: data.user.email });

        // Check if user has a first_name in their profile
        const { data: profileData } = await dbService.getProfile(data.user.id);
        const hasFirstName = profileData?.first_name && profileData.first_name.trim().length > 0;

        // Try to extract first name from Facebook's full name
        const facebookFullName = data.user.user_metadata?.name || data.user.user_metadata?.full_name;
        const facebookFirstName = facebookFullName?.split(' ')[0]?.trim();

        logger.debug('Profile status', {
          hasStoredName: hasFirstName,
          facebookProvidedName: !!facebookFirstName,
          fullName: facebookFullName
        });

        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: profileData?.first_name || facebookFullName || data.user.email,
          first_name: profileData?.first_name || facebookFirstName,
          avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture?.data?.url,
          created_at: data.user.created_at,
        };

        if (!hasFirstName && facebookFirstName) {
          // Facebook provided a name - auto-save it and skip modal
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
            timer.end('facebook-signin');
            logger.groupEnd();
            setIsLoading(false);
            handlePostAuthNavigation();
          } catch (saveError) {
            logger.error('Error auto-saving Facebook name:', saveError);
            // Fall back to showing modal
            setPendingUser(userData);
            setShowNameCollection(true);
            logger.groupEnd();
            setIsLoading(false);
          }
        } else if (!hasFirstName && !facebookFirstName) {
          // No first_name in profile and Facebook didn't provide one - show modal
          logger.info('Showing name collection modal');
          setPendingUser(userData);
          setShowNameCollection(true);
          timer.end('facebook-signin');
          logger.groupEnd();
          setIsLoading(false);
        } else {
          // Existing user with first_name - proceed normally
          logger.success('Returning user authenticated', { firstName: userData.first_name });
          setUser(userData);
          setAuthenticated(true);
          timer.end('facebook-signin');
          logger.groupEnd();
          setIsLoading(false);
          handlePostAuthNavigation();
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

  const handleGuestMode = async () => {
    await signInAsGuest();
    handlePostAuthNavigation();
  };

  const handleNameSubmit = async (firstName: string) => {
    if (!pendingUser) return;

    setIsLoading(true);
    try {
      // Update user profile in Supabase
      const { error } = await dbService.updateUserProfile(pendingUser.id, firstName);
      if (error) throw error;

      // Update user in store
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

      // Note: NavigationContainer will auto-navigate via key-based re-mount
      // No manual navigation needed - state change triggers automatic navigation
    } catch (error) {
      logger.error('Error saving user name:', error);
      Alert.alert('Error', 'Failed to save your name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']} testID="auth-screen">
      {/* Name Collection Modal */}
      <NameCollectionModal
        visible={showNameCollection}
        onSubmit={handleNameSubmit}
      />

      {/* Legal Document Modal */}
      <LegalDocumentModal
        visible={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        documentType={legalDocumentType}
      />

      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Skip Button - Top Right */}
        <View style={styles.skipContainer}>
          <TouchableOpacity
            onPress={handleGuestMode}
            testID="guest-login-button"
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content with ScrollView */}
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Centered Content Wrapper */}
            <View style={styles.centeredContent}>
              {/* Logo and Taglines */}
              <View style={styles.heroSection}>
                <Image
                  source={require('../../assets/lotus-logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <Text style={styles.appName}>LOTUS</Text>
                <Text style={styles.tagline}>
                  {t('auth.tagline')}
                </Text>
              </View>

              {/* Auth Buttons */}
              <View style={styles.authButtons}>
            <TouchableOpacity
              style={[styles.googleButton, isLoading && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={24} color={COLORS.primary} />
              <Text style={styles.googleButtonText}>
                {t('auth.continueWithGoogle')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.facebookButton, isLoading && styles.buttonDisabled]}
              onPress={handleFacebookSignIn}
              disabled={isLoading}
            >
              <Ionicons name="logo-facebook" size={24} color={COLORS.primary} />
              <Text style={styles.facebookButtonText}>
                {t('auth.continueWithFacebook')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.appleButton, isLoading && styles.buttonDisabled]}
              onPress={handleAppleSignIn}
              disabled={isLoading}
            >
              <Ionicons name="logo-apple" size={24} color={COLORS.primary} />
              <Text style={styles.appleButtonText}>
                {t('auth.continueWithApple')}
              </Text>
            </TouchableOpacity>
          </View>
            </View>
            {/* End Centered Content Wrapper */}

            {/* Loading State */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.white} />
                <Text style={styles.loadingText}>{t('auth.signingIn')}</Text>
              </View>
            )}

            {/* Legal Text */}
            <View style={styles.legalSection}>
              <Text style={styles.legalText}>
                By continuing you agree to our{' '}
                <Text style={styles.termsLink} onPress={handleOpenTerms}>
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text style={styles.termsLink} onPress={handleOpenPrivacy}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  skipContainer: {
    position: 'absolute',
    top: FIBONACCI.XXL,                         // 55px - Fibonacci spacing from top
    right: FIBONACCI.LG,                        // 21px - Fibonacci spacing from right
    zIndex: 1,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: FIBONACCI.LG,
    paddingVertical: FIBONACCI.SM,
    borderRadius: FIBONACCI.LG,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipText: {
    fontSize: TYPOGRAPHY.BASE,
    color: COLORS.white,
    fontWeight: '500',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: FIBONACCI.XL,           // 34px - Golden ratio horizontal padding
    paddingTop: FIBONACCI.XXXL,                // 89px - Space for Skip button
    paddingBottom: FIBONACCI.LG,               // 21px - Bottom breathing room
    justifyContent: 'space-between',           // Push legal text to bottom
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',                  // Vertically center logo + buttons
    paddingTop: FIBONACCI.XL,                  // 34px - Slight offset from absolute center
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: FIBONACCI.SM,                // 8px - Minimal gap to buttons
  },
  logo: {
    fontSize: FIBONACCI.HUGE,                  // 144px - Large logo emoji
    marginBottom: FIBONACCI.LG,                // 21px
  },
  logoImage: {
    width: SCREEN_WIDTH * 0.70,                // 70% width - bold brand presence
    height: SCREEN_HEIGHT * 0.27,              // Taller for impact
    marginBottom: FIBONACCI.SM,                // 8px - Tight spacing to "LOTUS"
    shadowColor: '#000',
    shadowOffset: { width: 0, height: FIBONACCI.SM },
    shadowOpacity: 0.15,
    shadowRadius: FIBONACCI.LG,                // 21px shadow blur
  },
  appName: {
    fontSize: TYPOGRAPHY.HUGE,                 // 55px - Display text from typography scale
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: FIBONACCI.SM,                // 8px - Tight spacing to tagline
    letterSpacing: FIBONACCI.XS,               // 5px letter spacing
  },
  tagline: {
    fontSize: TYPOGRAPHY.MD,                   // 18px - Medium from typography scale
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.XL,                 // 26px line height
    fontWeight: '500',
    opacity: 0.95,
    marginBottom: FIBONACCI.XL,                // 34px - Space before buttons
  },
  authButtons: {
    marginTop: FIBONACCI.XS,                   // 5px - Minimal top margin
    marginBottom: FIBONACCI.SM,                // 8px - Bottom margin
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    height: ELEMENT_SIZES.BUTTON_MD,            // 55px - Standard button height
    borderRadius: ELEMENT_SIZES.RADIUS_LG,      // 21px - Pronounced rounding
    marginBottom: FIBONACCI.MD,                 // 13px - Consistent gap between buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: FIBONACCI.XXS },
    shadowOpacity: 0.12,
    shadowRadius: FIBONACCI.SM,
    elevation: 4,
  },
  googleButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.BASE,                  // 16px - Body text
    fontWeight: '600',
    marginLeft: FIBONACCI.MD,                   // 13px - Icon to text gap
  },
  facebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    height: ELEMENT_SIZES.BUTTON_MD,
    borderRadius: ELEMENT_SIZES.RADIUS_LG,
    marginBottom: FIBONACCI.MD,                 // 13px - Same as Google button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: FIBONACCI.XXS },
    shadowOpacity: 0.12,
    shadowRadius: FIBONACCI.SM,
    elevation: 4,
  },
  facebookButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
    marginLeft: FIBONACCI.MD,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    height: ELEMENT_SIZES.BUTTON_MD,
    borderRadius: ELEMENT_SIZES.RADIUS_LG,
    marginBottom: 0,                            // Last button - no bottom margin
    shadowColor: '#000',
    shadowOffset: { width: 0, height: FIBONACCI.XXS },
    shadowOpacity: 0.12,
    shadowRadius: FIBONACCI.SM,
    elevation: 4,
  },
  appleButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
    marginLeft: FIBONACCI.MD,
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
  legalSection: {
    paddingTop: FIBONACCI.LG,                   // 21px - Space above legal text
    paddingHorizontal: FIBONACCI.MD,            // 13px - Horizontal padding
    paddingBottom: FIBONACCI.MD,                // 13px - Bottom padding
  },
  legalText: {
    fontSize: TYPOGRAPHY.XS,                    // 12px - Extra small for legal text
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.MD,                  // 18px line height
    opacity: 0.7,
  },
  legalLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  comingSoonContainer: {
    position: 'absolute',
    top: -FIBONACCI.SM, // -8px - Anchored to Apple button top edge matching October 10th
    right: FIBONACCI.SM, // 8px - Closer to right edge matching October 10th design
    backgroundColor: '#2D5F3F', // Lotus Green - dark teal/green matching target design
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
    color: '#FFFFFF', // Pure white for maximum brightness matching October 10th
    fontWeight: '700',
  },
  // Terms & Conditions Checkbox Styles
  termsContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.08,
    marginBottom: FIBONACCI.LG,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
    marginRight: FIBONACCI.SM,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: TYPOGRAPHY.SM,
    color: COLORS.white,
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
    color: COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextDisabled: {
    color: '#999',
  },
});