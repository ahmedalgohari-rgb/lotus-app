import React, { useState, useEffect } from 'react';
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
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger';
import { trackAuthModalShown, trackAuthCompleted } from '../services/analytics';

import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';
import { authService, dbService } from '../services/supabase';
import { useStore } from '../store';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void; // Optional custom post-auth handler
}

export default function AuthModal({ visible, onClose, onAuthSuccess }: AuthModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setAuthenticated, updateUserName } = useStore();
  const navigation = useNavigation();

  useEffect(() => {
    if (visible) {
      trackAuthModalShown({ trigger: 'add_plant' });
    }
  }, [visible]);

  // Best-effort save of the first name returned by an OAuth provider (Google/Apple).
  // Failures are non-blocking — sign-in proceeds either way. Apple App Review takes a dim view of
  // apps that hard-require user data after Sign in with Apple, so we never gate auth on this.
  const saveFirstNameIfAvailable = async (userId: string, firstName: string | undefined) => {
    if (!firstName) return;
    try {
      await dbService.updateUserProfile(userId, firstName);
    } catch (err) {
      logger.warn('Could not save first name to profile (non-blocking):', err);
    }
  };

  const handlePostAuthNavigation = () => {
    onClose();
    // Use custom handler if provided, otherwise navigate to Main
    if (onAuthSuccess) {
      onAuthSuccess();
    } else {
      navigation.navigate('Main');
    }
  };

  const finalizeAuth = (userData: any, firstName?: string) => {
    if (firstName) updateUserName(firstName);
    setUser(userData);
    setAuthenticated(true);
    setIsLoading(false);
    handlePostAuthNavigation();
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authService.signInWithGoogle();
      if (error) throw error;

      if (data && 'user' in data && data.user) {
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
          saveFirstNameIfAvailable(data.user.id, googleFirstName);
        }
        trackAuthCompleted({ method: 'google', isNewUser: !hasFirstName });
        finalizeAuth(userData, !hasFirstName ? googleFirstName : undefined);
      }
    } catch (error: any) {
      // Don't log or show error if user intentionally cancelled
      if (error?.name !== 'UserCancelled' && error?.message !== 'User cancelled OAuth') {
        logger.error('Google sign in error:', error);
        Alert.alert('Sign In Failed', 'Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authService.signInWithFacebook();
      if (error) throw error;

      if (data && 'user' in data && data.user) {
        const { data: profileData } = await dbService.getProfile(data.user.id);
        const hasFirstName = profileData?.first_name && profileData.first_name.trim().length > 0;
        const facebookFullName = data.user.user_metadata?.name || data.user.user_metadata?.full_name;
        const facebookFirstName = facebookFullName?.split(' ')[0]?.trim();

        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: profileData?.first_name || facebookFullName || data.user.email,
          first_name: profileData?.first_name || facebookFirstName,
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        };

        if (!hasFirstName && facebookFirstName) {
          saveFirstNameIfAvailable(data.user.id, facebookFirstName);
        }
        trackAuthCompleted({ method: 'facebook', isNewUser: !hasFirstName });
        finalizeAuth(userData, !hasFirstName ? facebookFirstName : undefined);
      }
    } catch (error: any) {
      // Don't log or show error if user intentionally cancelled
      if (error?.name !== 'UserCancelled' && error?.message !== 'User cancelled OAuth') {
        logger.error('Facebook sign in error:', error);
        Alert.alert('Sign In Failed', 'Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authService.signInWithApple();
      if (error) throw error;

      if (data && 'user' in data && data.user) {
        const { data: profileData } = await dbService.getProfile(data.user.id);
        const hasFirstName = profileData?.first_name && profileData.first_name.trim().length > 0;

        // Apple's native sign-in returns user.user_metadata.name on FIRST sign-in only.
        // Capture it so we can auto-save and skip the NameCollection prompt.
        const appleFullName = data.user.user_metadata?.name;
        const appleFirstName = appleFullName?.split(' ')[0]?.trim();

        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: profileData?.first_name || appleFullName || data.user.email,
          first_name: profileData?.first_name || appleFirstName,
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        };

        // Apple returns the name only on FIRST sign-in; subsequent logins give nothing (privacy by design).
        if (!hasFirstName && appleFirstName) {
          saveFirstNameIfAvailable(data.user.id, appleFirstName);
        }
        trackAuthCompleted({ method: 'apple', isNewUser: !hasFirstName });
        finalizeAuth(userData, !hasFirstName ? appleFirstName : undefined);
      }
    } catch (error: any) {
      // Don't log or show error if user intentionally cancelled
      if (error?.name !== 'UserCancelled' && error?.message !== 'User cancelled OAuth') {
        logger.error('Apple sign in error:', error);
        Alert.alert('Sign In Failed', 'Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
            <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientContainer}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.heroSection}>
                        <Image
                            source={require('../../assets/lotus-logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
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
                          onPress={handleAppleSignIn}
                          disabled={isLoading}
                        >
                          <Ionicons name="logo-apple" size={24} color={COLORS.primary} />
                          <Text style={styles.appleButtonText}>{t('auth.continueWithApple')}</Text>
                        </TouchableOpacity>
                    </View>

                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.white} />
                            <Text style={styles.loadingText}>{t('auth.signingIn')}</Text>
                        </View>
                    )}

                    <View style={styles.bottomLinks}>
                        <TouchableOpacity onPress={() => {
                            // Close modal first, then push AuthScreen — RN modals don't reliably
                            // dismiss when navigation happens beneath them, so without this the
                            // modal lingers on the screen below and the user gets trapped.
                            onClose();
                            setTimeout(() => navigation.navigate('Auth'), 350);
                        }}>
                            <Text style={styles.bottomLinkText}>{t('auth.alreadyMember')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.bottomLinkText}>{t('auth.maybeLater')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  gradientContainer: {
    height: SCREEN_HEIGHT * 0.80, // 80% - Spacious modal with comfortable breathing room
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.08,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: FIBONACCI.XL, // 34px - Fibonacci spacing
  },
  logoImage: {
    width: SCREEN_WIDTH * 0.3,
    height: SCREEN_HEIGHT * 0.15,
  },
  authButtons: {
    marginBottom: FIBONACCI.LG, // 21px - Fibonacci spacing
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    height: ELEMENT_SIZES.BUTTON_MD, // 55px - Fibonacci button height
    borderRadius: FIBONACCI.XL, // 34px - Golden ratio pill shape
    marginBottom: FIBONACCI.LG, // 21px - Clean Fibonacci spacing
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
    height: ELEMENT_SIZES.BUTTON_MD, // 55px - Fibonacci button height
    borderRadius: FIBONACCI.XL, // 34px - Golden ratio pill shape
    marginBottom: FIBONACCI.LG, // 21px - Clean Fibonacci spacing
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    height: ELEMENT_SIZES.BUTTON_MD, // 55px - Fibonacci button height
    borderRadius: FIBONACCI.XL, // 34px - Golden ratio pill shape
    marginBottom: FIBONACCI.LG, // 21px - Clean Fibonacci spacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
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
  comingSoonContainer: {
    position: 'absolute',
    top: -FIBONACCI.SM, // -8px - Anchored closer to Apple button top edge
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
    color: '#FFFFFF', // Pure white for maximum brightness
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: FIBONACCI.LG, // 21px - Fibonacci spacing
  },
  loadingText: {
    fontSize: TYPOGRAPHY.SM, // 14px - Golden ratio typography
    color: COLORS.white,
    marginTop: FIBONACCI.SM, // 8px - Fibonacci spacing
    opacity: 0.8,
  },
  bottomLinks: {
    paddingTop: FIBONACCI.SM, // 8px - Fibonacci padding
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    paddingBottom: FIBONACCI.SM, // 8px - Fibonacci padding
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bottomLinkText: {
    fontSize: TYPOGRAPHY.SM, // 14px - Golden ratio typography
    color: COLORS.white,
    textDecorationLine: 'underline',
  },
});
