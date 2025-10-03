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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants';
import { authService } from '../services/supabase';
import { useStore } from '../store';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface AuthScreenProps {
  navigation: any;
  route?: any;
}

export default function AuthScreen({ navigation, route }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const { setUser, setAuthenticated, signInAsGuest } = useStore();
  
  // Get return navigation parameters
  const returnTo = route?.params?.returnTo;
  const identificationResult = route?.params?.identificationResult;
  const capturedImage = route?.params?.capturedImage;
  
  console.log('AuthScreen loaded with email button');

  const handlePostAuthNavigation = () => {
    if (returnTo === 'ScanResults' && identificationResult) {
      // Navigate back to scan screen and show results
      navigation.navigate('Main', {
        screen: 'Scan',
        params: {
          showResult: true,
          identificationResult,
          capturedImage,
        }
      });
    } else {
      // Default navigation to main app
      navigation.navigate('Main');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authService.signInWithGoogle();
      if (error) throw error;
      
      if (data && 'user' in data && data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email,
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        });
        setAuthenticated(true);
        handlePostAuthNavigation();
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      Alert.alert('Sign In Failed', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authService.signInWithApple();
      if (error) throw error;
      
      if (data && 'user' in data && data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email,
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        });
        setAuthenticated(true);
        handlePostAuthNavigation();
      }
    } catch (error) {
      console.error('Apple sign in error:', error);
      Alert.alert('Sign In Failed', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    console.log('🚨 Skip button pressed - calling signInAsGuest()');
    signInAsGuest();
    console.log('🚨 signInAsGuest() called');
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
      console.error('Phone auth error:', error);
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
        setUser({
          id: data.user.id,
          phone: data.user.phone,
          name: data.user.user_metadata?.name || `User ${data.user.phone?.slice(-4)}`,
          created_at: data.user.created_at,
        });
        setAuthenticated(true);
        Alert.alert('Success', 'Phone number verified successfully!', [
          { text: 'OK', onPress: handlePostAuthNavigation }
        ]);
      } else {
        Alert.alert('Error', 'Could not verify OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'Verification failed. Invalid code or server error.');
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
    <SafeAreaView style={styles.container} testID="auth-screen">
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Skip Button */}
        <View style={styles.skipContainer}>
          <TouchableOpacity onPress={handleGuestMode} testID="guest-login-button">
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Logo and Taglines */}
          <View style={styles.heroSection}>
            <Text style={styles.logo}>🌿</Text>
            <Text style={styles.appName}>LOTUS</Text>
            <Text style={[styles.tagline, { opacity: showPhoneAuth ? 0.3 : 1 }]}>
              Care for your plants.{'\n'}
              Grow with nature.{'\n'}
              Perfect for Cairo's climate.
            </Text>
          </View>

          {/* Auth Buttons */}
          <View style={styles.authButtons}>
            {!showPhoneAuth ? (
              <TouchableOpacity
                style={styles.phoneButton}
                onPress={() => setShowPhoneAuth(true)}
                disabled={isLoading}
              >
                <Ionicons name="call" size={20} color={COLORS.primary} />
                <Text style={styles.phoneButtonText}>Continue with Phone</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.phoneAuthContainer}>
                {!isVerifyingOTP ? (
                  <>
                    <Text style={styles.phoneAuthTitle}>Enter your phone number</Text>
                    <View style={styles.phoneInputContainer}>
                      <Text style={styles.countryCode}>+20</Text>
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="1xxxxxxxxx"
                        placeholderTextColor={COLORS.textSecondary}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        maxLength={10}
                        autoFocus
                      />
                    </View>
                    <View style={styles.phoneAuthButtons}>
                      <TouchableOpacity
                        style={styles.backButton}
                        onPress={resetPhoneAuth}
                        disabled={isLoading}
                      >
                        <Text style={styles.backButtonText}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.sendOTPButton}
                        onPress={handlePhoneSignIn}
                        disabled={isLoading || !phoneNumber.trim()}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                          <Text style={styles.sendOTPButtonText}>Send Code</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.phoneAuthTitle}>Enter verification code</Text>
                    <Text style={styles.otpSubtitle}>Sent to +20{phoneNumber}</Text>
                    <TextInput
                      style={styles.otpInput}
                      placeholder="123456"
                      placeholderTextColor={COLORS.textSecondary}
                      value={otpCode}
                      onChangeText={setOtpCode}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                    <View style={styles.phoneAuthButtons}>
                      <TouchableOpacity
                        style={styles.backButton}
                        onPress={resetPhoneAuth}
                        disabled={isLoading}
                      >
                        <Text style={styles.backButtonText}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.verifyButton}
                        onPress={handleOTPVerification}
                        disabled={isLoading || !otpCode.trim()}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                          <Text style={styles.verifyButtonText}>Verify</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={20} color={COLORS.primary} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.appleButton}
              disabled={true}
            >
              <View style={styles.appleButtonContent}>
                <Ionicons name="logo-apple" size={20} color={COLORS.primary} />
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
                <View style={styles.comingSoonContainer}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.white} />
              <Text style={styles.loadingText}>Signing you in...</Text>
            </View>
          )}

          {/* Legal Text */}
          <View style={styles.legalSection}>
            <Text style={styles.legalText}>
              By continuing you agree to our{' '}
              <Text style={styles.legalLink}>Terms of Service</Text>.{'\n'}
              Lotus services are subject to our{' '}
              <Text style={styles.legalLink}>Privacy Policy</Text>.
            </Text>
          </View>
        </View>
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
    top: 60,
    right: 24,
    zIndex: 1,
  },
  skipText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: SCREEN_WIDTH * 0.08,
    justifyContent: 'space-between',
    paddingTop: SCREEN_HEIGHT * 0.12,
    paddingBottom: SCREEN_HEIGHT * 0.06,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: SCREEN_HEIGHT * 0.04,
  },
  logo: {
    fontSize: SCREEN_HEIGHT * 0.1,
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  appName: {
    fontSize: SCREEN_HEIGHT * 0.06,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SCREEN_HEIGHT * 0.03,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: SCREEN_HEIGHT * 0.022,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: SCREEN_HEIGHT * 0.03,
    fontWeight: '500',
    opacity: 0.95,
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  authButtons: {
    marginTop: SCREEN_HEIGHT * 0.02,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    height: 56,
    borderRadius: 28,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  appleButton: {
    backgroundColor: COLORS.white,
    height: 56,
    borderRadius: 28,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  divider: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '500',
    opacity: 0.8,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  phoneButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  phoneAuthContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginTop: 8,
  },
  phoneAuthTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: COLORS.text,
  },
  otpInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 18,
    textAlign: 'center',
    color: COLORS.text,
    letterSpacing: 8,
    marginBottom: 20,
  },
  otpSubtitle: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  phoneAuthButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  sendOTPButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOTPButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.white,
    marginTop: 8,
    opacity: 0.8,
  },
  legalSection: {
    marginTop: SCREEN_HEIGHT * 0.04,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
  },
  legalText: {
    fontSize: 13,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.8,
  },
  legalLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  comingSoonContainer: {
    position: 'absolute',
    bottom: 6,
    right: -1,
    backgroundColor: '#F4D03F',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    transform: [{ rotate: '345deg' }],
  },
  comingSoonText: {
    fontSize: 8,
    color: COLORS.secondary,
    fontWeight: '700',
  },
});