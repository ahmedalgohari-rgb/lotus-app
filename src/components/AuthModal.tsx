import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
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

import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';
import { authService, dbService } from '../services/supabase';
import { useStore } from '../store';
import NameCollectionModal from './NameCollectionModal';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void; // Optional custom post-auth handler
}

export default function AuthModal({ visible, onClose, onAuthSuccess }: AuthModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  // DEBUG: Verify this file is loading
  console.log('🔵 AuthModal LOADED - Apple button should be CLEAN (no Coming Soon)');
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [showNameCollection, setShowNameCollection] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const { setUser, setAuthenticated, updateUserName } = useStore();
  const navigation = useNavigation();

  const handlePostAuthNavigation = () => {
    onClose();
    // Use custom handler if provided, otherwise navigate to Main
    if (onAuthSuccess) {
      onAuthSuccess();
    } else {
      navigation.navigate('Main');
    }
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
          try {
            await dbService.updateUserProfile(data.user.id, googleFirstName);
            setUser({
              ...userData,
              first_name: googleFirstName,
              name: googleFirstName,
            });
            updateUserName(googleFirstName);
            setAuthenticated(true);
            setIsLoading(false);
            handlePostAuthNavigation();
          } catch (saveError) {
            setPendingUser(userData);
            setShowNameCollection(true);
            setIsLoading(false);
          }
        } else if (!hasFirstName && !googleFirstName) {
          setPendingUser(userData);
          setShowNameCollection(true);
          setIsLoading(false);
        } else {
          setUser(userData);
          setAuthenticated(true);
          setIsLoading(false);
          handlePostAuthNavigation();
        }
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
          try {
            await dbService.updateUserProfile(data.user.id, facebookFirstName);
            setUser({
              ...userData,
              first_name: facebookFirstName,
              name: facebookFirstName,
            });
            updateUserName(facebookFirstName);
            setAuthenticated(true);
            setIsLoading(false);
            handlePostAuthNavigation();
          } catch (saveError) {
            setPendingUser(userData);
            setShowNameCollection(true);
            setIsLoading(false);
          }
        } else if (!hasFirstName && !facebookFirstName) {
          setPendingUser(userData);
          setShowNameCollection(true);
          setIsLoading(false);
        } else {
          setUser(userData);
          setAuthenticated(true);
          setIsLoading(false);
          handlePostAuthNavigation();
        }
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
        // Check if user has first_name in profile
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
          // New user - show name collection modal
          setPendingUser(userData);
          setShowNameCollection(true);
          setIsLoading(false);
        } else {
          // Existing user - proceed
          setUser(userData);
          setAuthenticated(true);
          setIsLoading(false);
          handlePostAuthNavigation();
        }
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
          Alert.alert('Success', 'Phone number verified successfully!', [
            { text: 'OK', onPress: handlePostAuthNavigation }
          ]);
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

      handlePostAuthNavigation();
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
                        <TouchableOpacity onPress={() => navigation.navigate('Auth')}>
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
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: ELEMENT_SIZES.BUTTON_MD, // 55px - Fibonacci button height
    borderRadius: FIBONACCI.XL, // 34px - Golden ratio pill shape
    backgroundColor: COLORS.white,
    marginBottom: FIBONACCI.LG, // 21px - Matching other buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: FIBONACCI.SM,
    elevation: 4,
    gap: FIBONACCI.SM, // 8px - Golden ratio icon spacing
  },
  phoneButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.BASE,
    fontWeight: '600',
  },
  phoneAuthContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: FIBONACCI.MD, // 13px - Fibonacci rounding
    padding: FIBONACCI.LG, // 21px - Fibonacci padding
    marginTop: FIBONACCI.SM, // 8px - Fibonacci spacing
    marginBottom: FIBONACCI.MD, // 13px - Fibonacci spacing
  },
  phoneAuthTitle: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.MD, // 18px - Golden ratio typography
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: FIBONACCI.MD, // 13px - Fibonacci spacing
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px - Fibonacci rounding
    paddingHorizontal: FIBONACCI.MD, // 13px - Fibonacci padding
    marginBottom: FIBONACCI.MD, // 13px - Fibonacci spacing
  },
  countryCode: {
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio typography
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: FIBONACCI.SM, // 8px - Fibonacci spacing
  },
  phoneInput: {
    flex: 1,
    height: FIBONACCI.XXL - 7, // 48px - Between XL (34) and XXL (55)
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio typography
    color: COLORS.text,
  },
  otpInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px - Fibonacci rounding
    paddingHorizontal: FIBONACCI.MD, // 13px - Fibonacci padding
    height: FIBONACCI.XXL - 7, // 48px - Between XL (34) and XXL (55)
    fontSize: TYPOGRAPHY.MD, // 18px - Golden ratio typography
    textAlign: 'center',
    color: COLORS.text,
    letterSpacing: FIBONACCI.SM, // 8px - Fibonacci letter spacing
    marginBottom: FIBONACCI.MD, // 13px - Fibonacci spacing
  },
  otpSubtitle: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.SM, // 14px - Golden ratio typography
    textAlign: 'center',
    marginBottom: FIBONACCI.MD, // 13px - Fibonacci spacing
    opacity: 0.8,
  },
  phoneAuthButtons: {
    flexDirection: 'row',
    gap: FIBONACCI.MD, // 13px - Fibonacci gap
  },
  backButton: {
    flex: 1,
    height: FIBONACCI.XXL - 7, // 48px - Between XL (34) and XXL (55)
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px - Fibonacci rounding
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio typography
    fontWeight: '500',
  },
  sendOTPButton: {
    flex: 2,
    height: FIBONACCI.XXL - 7, // 48px - Between XL (34) and XXL (55)
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px - Fibonacci rounding
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOTPButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio typography
    fontWeight: '600',
  },
  verifyButton: {
    flex: 2,
    height: FIBONACCI.XXL - 7, // 48px - Between XL (34) and XXL (55)
    borderRadius: ELEMENT_SIZES.RADIUS_MD, // 13px - Fibonacci rounding
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.BASE, // 16px - Golden ratio typography
    fontWeight: '600',
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
