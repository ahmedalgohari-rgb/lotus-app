/**
 * Lotus Authentication Screen
 * OAuth login exactly as specified in MVP/CLAUDEMVPflow.md
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Animated,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
// Temporarily using Expo-compatible auth for immediate testing
// import { appleAuth } from 'react-native-apple-authentication';
// import {
//   GoogleSignin,
//   statusCodes,
//   isErrorWithCode,
// } from '@react-native-google-signin/google-signin';
import { Colors, Typography, Layout } from '@/constants';
import { useAuthActions } from '@/store/authStore';
import Text from '@/components/Text';
import Button from '@/components/Button';
import OAuthButton from '@/components/OAuthButton';
import LotusLogo from '@/components/LotusLogo';

const { width, height } = Dimensions.get('window');

// Temporarily disabled for Expo Go compatibility
// GoogleSignin.configure({
//   webClientId: '926449283847-8dqkr9qck5j8m1j5k7kf0qvj8h4g8fqh.apps.googleusercontent.com',
//   iosClientId: '926449283847-your-ios-client-id.apps.googleusercontent.com',
//   offlineAccess: true,
//   hostedDomain: '',
//   forceCodeForRefreshToken: true,
//   accountName: '',
//   googleServicePlistPath: '',
// });

const AuthScreen = () => {
  const router = useRouter();
  const { loginAsGuest, setLoading, setError, login } = useAuthActions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Native authentication state
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  // Form state for email/password login
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Temporarily disabled for Expo Go
  // useEffect(() => {
  //   appleAuth.isSupported
  //     .then(setIsAppleAvailable)
  //     .catch(() => setIsAppleAvailable(false));
  // }, []);

  const handleAppleSignIn = async () => {
    // Demo Apple Sign-In for immediate testing
    Alert.alert(
      '🍎 Apple Sign-In Demo',
      'This demonstrates the Apple Sign-In flow. In the development build, this will show Face ID/Touch ID authentication.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue as Test User', 
          onPress: () => {
            const testUser = {
              id: 'apple_test_001',
              email: 'apple.test@lotus.app',
              firstName: 'Apple',
              lastName: 'User',
              provider: 'apple' as const,
              preferences: {
                language: 'en' as const,
                notifications: true,
                measurementUnit: 'metric' as const,
              },
              createdAt: new Date().toISOString(),
            };
            
            login(testUser, { 
              accessToken: 'demo_apple_token',
              refreshToken: 'demo_apple_refresh'
            });
            
            router.replace('/(tabs)');
          }
        }
      ]
    );
  };

  const handleGoogleSignIn = async () => {
    // Demo Google Sign-In for immediate testing
    Alert.alert(
      '🔍 Google Sign-In Demo',
      'This demonstrates the Google Sign-In flow. In the development build, this will show the native Google OAuth interface.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue as Test User', 
          onPress: () => {
            const testUser = {
              id: 'google_test_001',
              email: 'google.test@lotus.app',
              firstName: 'Google',
              lastName: 'User',
              provider: 'google' as const,
              preferences: {
                language: 'en' as const,
                notifications: true,
                measurementUnit: 'metric' as const,
              },
              createdAt: new Date().toISOString(),
              avatarUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
            };
            
            login(testUser, {
              accessToken: 'demo_google_token',
              refreshToken: 'demo_google_refresh'
            });
            
            router.replace('/(tabs)');
          }
        }
      ]
    );
  };

  const handleGuestMode = () => {
    loginAsGuest();
    router.replace('/(tabs)');
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isRegistering && (!firstName.trim() || !lastName.trim())) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Simplified email auth - just validate and go to guest mode for Expo Go
    if (email.trim() && password.length >= 6) {
      Alert.alert(
        'Email Auth Demo',
        `In development: This would ${isRegistering ? 'register' : 'sign in'} with email. For now, continuing as guest.`,
        [{ text: 'OK', onPress: () => {
          loginAsGuest();
          router.replace('/(tabs)');
        }}]
      );
    } else {
      Alert.alert('Error', password.length < 6 ? 'Password should be at least 6 characters.' : 'Please fill in all fields');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setIsRegistering(false);
  };

  const toggleEmailForm = () => {
    setShowEmailForm(!showEmailForm);
    resetForm();
  };

  return (
    <View style={styles.container}>
      {/* Background with overlay */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
          style={styles.overlay}
        >
          {/* Top Section - Logo */}
          <View style={styles.topSection}>
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: fadeAnim }],
                },
              ]}
            >
              <LotusLogo 
                size="hero" 
                variant="dark" 
                showText={true} 
              />
            </Animated.View>
          </View>

          {/* Bottom Section - Auth Options */}
          <Animated.View
            style={[
              styles.bottomSheet,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,1)']}
              style={styles.sheetGradient}
            >
              {/* Welcome Text */}
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeTitle}>Welcome!</Text>
                <Text style={styles.welcomeTitleArabic}>أهلاً بك</Text>
                
                <Text style={styles.welcomeDescription}>
                  Sign up to save your{'\n'}plants and get care{'\n'}reminders
                </Text>
              </View>

              {/* OAuth Buttons */}
              <View style={styles.authButtonsContainer}>
                {/* Apple Sign-In */}
                <OAuthButton
                  provider="apple"
                  onPress={handleAppleSignIn}
                />

                {/* Google Sign-In */}
                <OAuthButton
                  provider="google"
                  onPress={handleGoogleSignIn}
                />

                {/* Email/Password Form */}
                {showEmailForm && (
                  <View style={styles.emailForm}>
                    {isRegistering && (
                      <>
                        <TextInput
                          style={styles.input}
                          placeholder="First Name"
                          value={firstName}
                          onChangeText={setFirstName}
                          autoCapitalize="words"
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Last Name"
                          value={lastName}
                          onChangeText={setLastName}
                          autoCapitalize="words"
                        />
                      </>
                    )}
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                    
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handleEmailSubmit}
                    >
                      <Text style={styles.submitButtonText}>
                        {isRegistering ? 'Sign Up' : 'Sign In'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.toggleButton}
                      onPress={() => setIsRegistering(!isRegistering)}
                    >
                      <Text style={styles.toggleButtonText}>
                        {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Email Toggle Button */}
                <TouchableOpacity
                  style={styles.emailToggleButton}
                  onPress={toggleEmailForm}
                >
                  <Text style={styles.emailToggleText}>
                    {showEmailForm ? 'Hide Email Form' : '✉️ Continue with Email'}
                  </Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Guest Mode */}
                <TouchableOpacity
                  style={styles.guestButton}
                  onPress={handleGuestMode}
                >
                  <Text style={styles.guestButtonText}>Continue as Guest</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundImage: {
    flex: 1,
    width,
    height,
  },
  overlay: {
    flex: 1,
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Layout.statusBarHeight,
  },
  logoContainer: {
    alignItems: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: Layout.overlayRadius,
    borderTopRightRadius: Layout.overlayRadius,
    overflow: 'hidden',
  },
  sheetGradient: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Layout['2xl'],
    paddingBottom: Layout.screenPadding + 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: Layout['2xl'],
  },
  welcomeTitle: {
    ...Typography.screenTitle,
    color: Colors.lotusGreen,
    marginBottom: Layout.xs,
  },
  welcomeTitleArabic: {
    ...Typography.arabicTitle,
    color: Colors.lotusGreen,
    marginBottom: Layout.lg,
  },
  welcomeDescription: {
    ...Typography.bodySecondary,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  authButtonsContainer: {
    gap: Layout.lg,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Layout.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginHorizontal: Layout.lg,
    fontWeight: '500',
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: Layout.lg,
  },
  guestButtonText: {
    ...Typography.buttonSecondary,
    color: Colors.nileBlue,
    textDecorationLine: 'underline',
  },
  emailToggleButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    height: Layout.buttonHeight,
    borderRadius: Layout.buttonRadiusMedium,
    justifyContent: 'center',
  },
  emailToggleText: {
    ...Typography.buttonSecondary,
    color: Colors.textPrimary,
  },
  emailForm: {
    gap: Layout.md,
    padding: Layout.md,
    backgroundColor: Colors.lightGray,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.pureWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.buttonRadiusSmall,
    paddingHorizontal: Layout.md,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  submitButton: {
    height: Layout.buttonHeight,
    backgroundColor: Colors.lotusGreen,
    borderRadius: Layout.buttonRadiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    ...Typography.buttonPrimary,
    color: Colors.pureWhite,
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: Layout.sm,
  },
  toggleButtonText: {
    ...Typography.caption,
    color: Colors.nileBlue,
    textDecorationLine: 'underline',
  },
});

export default AuthScreen;