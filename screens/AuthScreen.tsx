import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants';
import { authService } from '../services/supabase';
import { useStore } from '../store';

interface AuthScreenProps {
  navigation: any;
}

export default function AuthScreen({ navigation }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setAuthenticated } = useStore();
  
  console.log('AuthScreen loaded with email button');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authService.signInWithGoogle();
      if (error) throw error;
      
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email,
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        });
        setAuthenticated(true);
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
      
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email,
          avatar_url: data.user.user_metadata?.avatar_url,
          created_at: data.user.created_at,
        });
        setAuthenticated(true);
      }
    } catch (error) {
      console.error('Apple sign in error:', error);
      Alert.alert('Sign In Failed', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setUser({
      id: guestId,
      name: 'Guest User',
      created_at: new Date().toISOString(),
    });
    setAuthenticated(true);
  };

  const handleEmailSignIn = () => {
    navigation.navigate('EmailAuth');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Skip Button */}
        <View style={styles.skipContainer}>
          <TouchableOpacity onPress={handleGuestMode}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Logo and Taglines */}
          <View style={styles.heroSection}>
            <Text style={styles.logo}>🌿</Text>
            <Text style={styles.appName}>LOTUS</Text>
            <Text style={styles.tagline}>
              Care for your plants.{'\n'}
              Grow with nature.{'\n'}
              Perfect for Cairo's climate.
            </Text>
          </View>

          {/* Auth Buttons */}
          <View style={styles.authButtons}>
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
              onPress={handleAppleSignIn}
              disabled={isLoading}
            >
              <Ionicons name="logo-apple" size={20} color={COLORS.primary} />
              <Text style={styles.appleButtonText}>Continue with Apple</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <Text style={styles.dividerText}>or</Text>
            </View>

            <TouchableOpacity
              style={styles.emailButton}
              onPress={handleEmailSignIn}
              disabled={isLoading}
            >
              <Text style={styles.emailButtonText}>Continue with Email</Text>
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
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingTop: 120,
    paddingBottom: 50,
  },
  heroSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 80,
    marginBottom: 24,
  },
  appName: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 32,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 20,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
    opacity: 0.95,
  },
  authButtons: {
    marginTop: 40,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    height: 56,
    borderRadius: 28,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  emailButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: 'transparent',
  },
  emailButtonText: {
    color: COLORS.white,
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
    marginTop: 40,
    paddingHorizontal: 16,
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
});