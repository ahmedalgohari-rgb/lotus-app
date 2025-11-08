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

import { useTranslation } from 'react-i18next';
import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';
import { authService, dbService } from '../services/supabase';
import { useStore } from '../store';
import NameCollectionModal from '../components/NameCollectionModal';
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
    } catch (error) {
      logger.error('Google sign in error:', error);
      logger.groupEnd();
      Alert.alert('Sign In Failed', 'Please try again.');
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authService.signInWithApple();
      if (error) throw error;

      if (data && 'user' in data && data.user) {
        // Check if user has a first_name in their profile
        const { data: profileData } = await dbService.getProfile(data.user.id);
        const hasFirstName = profileData?.first_name && profileData.first_name.trim().length > 0;

        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: profileData?.first_name || data.user.user_metadata?.name || data.user.email,
          first_name: profileData?.first_name,
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        };

        if (!hasFirstName) {
          // New user without first_name - show name collection modal
          setPendingUser(userData);
          setShowNameCollection(true);
          setIsLoading(false);
        } else {
          // Existing user with first_name - proceed normally
          setUser(userData);
          setAuthenticated(true);
          setIsLoading(false);
          handlePostAuthNavigation();
        }
      }
    } catch (error) {
      logger.error('Apple sign in error:', error);
      Alert.alert('Sign In Failed', 'Please try again.');
    } finally {
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
    } catch (error) {
      logger.error('Facebook sign in error:', error);
      logger.groupEnd();
      Alert.alert('Sign In Failed', 'Please try again.');
      setIsLoading(false);
    }
  };

  const handleGuestMode = async () => {
    await signInAsGuest();
    handlePostAuthNavigation();
  };

  const handleTestUserSignIn = async () => {
    setIsLoading(true);
    logger.group('🧪 Test User Sign-In (Ahmad)');

    try {
      // Sign in with real Supabase credentials (bypasses RLS)
      logger.info('Attempting to sign in with test@lotus.com...');
      const { data, error } = await authService.signIn('test@lotus.com', 'testpassword123');

      // Log detailed error for debugging
      if (error) {
        logger.error('Sign in error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        throw new Error(`Sign in failed: ${error.message}`);
      }

      if (!data?.user) {
        throw new Error('No user data returned from sign in');
      }

      // Successfully signed in with existing Supabase account
      const supabaseUser = data.user;
      logger.info('Supabase user object:', {
        id: supabaseUser.id,
        email: supabaseUser.email,
        confirmed: supabaseUser.email_confirmed_at,
      });

      const testUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || 'test@lotus.com',
        name: 'Ahmad', // Display name as "Ahmad" for test user
        first_name: 'Ahmad',
        avatar_url: null,
        created_at: supabaseUser.created_at,
      };

      logger.success('✅ Ahmad (test user) signed in successfully!');
      setUser(testUser);
      updateUserName('Ahmad');
      setAuthenticated(true);

      logger.groupEnd();
      setIsLoading(false);
      handlePostAuthNavigation();
    } catch (error: any) {
      logger.error('❌ Test sign in error:', error);
      logger.error('Error details:', error.message || error);
      logger.groupEnd();

      // Show helpful error message
      const errorMessage = error.message || 'Unknown error';
      Alert.alert(
        'Sign In Failed',
        `Could not sign in as Ahmad (test user).\n\nError: ${errorMessage}\n\nPlease check:\n1. Account exists in Supabase\n2. Email is confirmed\n3. Password is correct: testpassword123`
      );
      setIsLoading(false);
    }
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
    <SafeAreaView style={styles.container} testID="auth-screen">
      {/* Name Collection Modal */}
      <NameCollectionModal
        visible={showNameCollection}
        onSubmit={handleNameSubmit}
      />

      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Test User Sign In Button - Top Left */}
        <View style={styles.testUserContainer}>
          <TouchableOpacity
            onPress={handleTestUserSignIn}
            testID="test-user-login-button"
            style={styles.testUserButton}
          >
            <Text style={styles.testUserText}>Sign in as Ahmad</Text>
          </TouchableOpacity>
        </View>

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
            {/* Logo and Taglines */}
            <View style={styles.heroSection}>
              <Image
                source={require('../../assets/lotus-logo-new.png')}
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
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={24} color={COLORS.primary} />
              <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.facebookButton}
              onPress={handleFacebookSignIn}
              disabled={isLoading}
            >
              <Ionicons name="logo-facebook" size={24} color={COLORS.primary} />
              <Text style={styles.facebookButtonText}>{t('auth.continueWithFacebook')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.appleButton}
              disabled={true}
            >
              <View style={styles.appleButtonContent}>
                <Ionicons name="logo-apple" size={24} color={COLORS.primary} />
                <Text style={styles.appleButtonText}>{t('auth.continueWithApple')}</Text>
                <View style={styles.comingSoonContainer}>
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

            {/* Legal Text */}
            <View style={styles.legalSection}>
              <Text style={styles.legalText}>
                {t('auth.termsAgreement')}
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
  testUserContainer: {
    position: 'absolute',
    top: 50,
    left: 24,
    zIndex: 1,
  },
  testUserButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: FIBONACCI.LG,
    paddingVertical: FIBONACCI.SM,
    borderRadius: FIBONACCI.LG,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  testUserText: {
    fontSize: TYPOGRAPHY.BASE,
    color: COLORS.white,
    fontWeight: '500',
  },
  skipContainer: {
    position: 'absolute',
    top: 50,
    right: 24,
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
    paddingHorizontal: SCREEN_WIDTH * 0.08,
    paddingTop: SCREEN_HEIGHT * 0.08,
    paddingBottom: SCREEN_HEIGHT * 0.03,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: SCREEN_HEIGHT * 0.005, // Minimal - children have golden ratio spacing
  },
  logo: {
    fontSize: SCREEN_HEIGHT * 0.1,
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  logoImage: {
    width: SCREEN_WIDTH * 0.70,
    height: SCREEN_HEIGHT * 0.32,
    marginBottom: SCREEN_HEIGHT * 0.008, // Golden ratio base unit
    // Professional shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  appName: {
    fontSize: SCREEN_HEIGHT * 0.05,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SCREEN_HEIGHT * 0.013, // Golden ratio: 0.008 * 1.618
    letterSpacing: 5,
  },
  tagline: {
    fontSize: SCREEN_HEIGHT * 0.02,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: SCREEN_HEIGHT * 0.026,
    fontWeight: '500',
    opacity: 0.95,
    marginBottom: SCREEN_HEIGHT * 0.021, // Golden ratio: 0.013 * 1.618
  },
  authButtons: {
    marginTop: SCREEN_HEIGHT * 0.005, // Minimal since tagline has golden ratio spacing
    marginBottom: SCREEN_HEIGHT * 0.01,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    height: ELEMENT_SIZES.BUTTON_MD,
    borderRadius: FIBONACCI.XL,
    marginBottom: FIBONACCI.LG, // 21px - Fibonacci spacing to fit content on one page
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: FIBONACCI.SM,
    elevation: 4,
  },
  googleButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
    marginLeft: FIBONACCI.MD,
  },
  facebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    height: ELEMENT_SIZES.BUTTON_MD,
    borderRadius: FIBONACCI.XL,
    marginBottom: FIBONACCI.LG, // 21px - Fibonacci spacing to fit content on one page
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
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
    backgroundColor: COLORS.white,
    height: ELEMENT_SIZES.BUTTON_MD,
    borderRadius: FIBONACCI.XL,
    marginBottom: FIBONACCI.LG, // 21px - Fibonacci spacing to fit content on one page
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
    marginTop: 'auto',
    paddingTop: SCREEN_HEIGHT * 0.015,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    paddingBottom: FIBONACCI.MD,
  },
  legalText: {
    fontSize: TYPOGRAPHY.XXS,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.BASE,
    opacity: 0.65,
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
});