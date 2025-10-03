import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { COLORS } from '../constants';
import { useStore } from '../store';
import { authService } from '../services/supabase';
import type { IdentificationResult } from '../types';

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
  
  const { identificationResult, capturedImage } = route.params as PlantResultScreenProps['route']['params'];
  
  const { user, isAuthenticated, isGuest, setUser, setAuthenticated } = useStore();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [isLoading, setIsLoading] = useState(false);

  // Debug logging for auth state
  useEffect(() => {
    console.log('🔍 PlantResultScreen - showAuthPrompt state changed to:', showAuthPrompt);
  }, [showAuthPrompt]);

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
        setShowAuthPrompt(false);
        
        // Auto-save plant after successful auth
        setTimeout(() => {
          navigation.navigate('AddPlant', {
            identificationResult,
            capturedImage,
          });
        }, 500);
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
        setShowAuthPrompt(false);
        
        // Auto-save plant after successful auth
        setTimeout(() => {
          navigation.navigate('AddPlant', {
            identificationResult,
            capturedImage,
          });
        }, 500);
      }
    } catch (error) {
      console.error('Apple sign in error:', error);
      Alert.alert('Sign In Failed', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneAuth = async () => {
    Alert.alert('Phone Authentication', 'Phone authentication coming soon!');
  };

  const saveToMyPlants = () => {
    console.log('🔍 saveToMyPlants called from PlantResultScreen');
    console.log('🔍 isAuthenticated:', isAuthenticated, 'isGuest:', isGuest);
    console.log('🔍 user:', user);
    
    if (isGuest) {
      // Guest users need to create account to save plants
      console.log('🚨 Guest user detected - showing auth modal overlay');
      setAuthMode('signup');
      setShowAuthPrompt(true);
      return;
    }

    if (!isAuthenticated || !user) {
      // Unauthenticated users should not be here, but redirect to auth just in case
      console.log('🚨 Unauthenticated user detected - showing auth modal');
      setAuthMode('signup');
      setShowAuthPrompt(true);
      return;
    }

    console.log('🔍 Authenticated user, navigating to AddPlant...');
    if (identificationResult) {
      // Navigate to AddPlant screen with identification result
      navigation.navigate('AddPlant', {
        identificationResult,
        capturedImage,
      });
    }
  };

  const handleSignInPress = () => {
    console.log('🔍 Sign in pressed');
    setAuthMode('signin');
    setShowAuthPrompt(true);
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === 'signup' ? 'signin' : 'signup');
  };

  const retryCapture = () => {
    // Navigate back to camera screen
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plant Identified!</Text>
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
          {capturedImage && <Image source={{ uri: capturedImage }} style={styles.resultImage} />}
          
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {identificationResult.confidence}% confidence
            </Text>
          </View>

          <View style={styles.plantInfo}>
            <Text style={styles.plantName}>{identificationResult.common_name}</Text>
            <Text style={styles.scientificName}>
              {identificationResult.scientific_name}
            </Text>
            {identificationResult.family && (
              <Text style={styles.familyName}>Family: {identificationResult.family}</Text>
            )}
          </View>

          {/* Plant Description */}
          {identificationResult.plant_info && (
            <View style={styles.careSection}>
              <Text style={styles.careTitle}>Your Plant's Story</Text>
              <Text style={styles.plantDescription}>
                {identificationResult.plant_info}
              </Text>
            </View>
          )}

          {/* Unlock Plant's Full Potential */}
          <View style={styles.careSection}>
            <Text style={styles.careTitle}>Unlock Your Plant's Full Potential:</Text>
            
            <View style={styles.careDetails}>
              <View style={styles.unlockItem}>
                <Ionicons name="heart-outline" size={20} color={COLORS.primary} style={styles.unlockIcon} />
                <Text style={styles.unlockLabel}>Save to My Garden</Text>
                {isGuest && <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />}
              </View>
              
              <View style={styles.unlockItem}>
                <Ionicons name="water-outline" size={20} color={COLORS.primary} style={styles.unlockIcon} />
                <Text style={styles.unlockLabel}>Smart Watering Tips</Text>
                {isGuest && <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />}
              </View>
              
              <View style={styles.unlockItem}>
                <Ionicons name="compass-outline" size={20} color={COLORS.primary} style={styles.unlockIcon} />
                <Text style={styles.unlockLabel}>Placement Tips</Text>
                {isGuest && <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />}
              </View>
              
              <View style={styles.unlockItem}>
                <Ionicons name="book-outline" size={20} color={COLORS.primary} style={styles.unlockIcon} />
                <Text style={styles.unlockLabel}>Detailed Care Guides</Text>
                {isGuest && <Ionicons name="lock-closed" size={16} color={COLORS.textSecondary} />}
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={() => {
                console.log('🚨 BUTTON PRESS DETECTED! User:', user?.id, 'isAuthenticated:', isAuthenticated);
                console.log('🚨 About to call saveToMyPlants...');
                saveToMyPlants();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {isAuthenticated && !isGuest ? 'Add to My Plants' : 'Save my plant'}
              </Text>
            </TouchableOpacity>

            {isGuest && (
              <TouchableOpacity onPress={handleSignInPress}>
                <Text style={styles.signInText}>
                  Already a member? Sign in
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.retryButton} onPress={retryCapture}>
              <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              <Text style={styles.retryButtonText}>Try Another</Text>
            </TouchableOpacity>
          </View>
          
          {/* Footer */}
          <View style={styles.footer}>
            <Ionicons name="information-circle" size={16} color={COLORS.textSecondary} />
            <Text style={styles.footerText}>Image processing complete, but quality could improved</Text>
          </View>
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* Authentication Modal - Matches AuthScreen Design */}
      {showAuthPrompt && (
        <Modal
          visible={showAuthPrompt}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAuthPrompt(false)}
          presentationStyle="overFullScreen"
        >
        <View style={styles.authModalOverlay}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.authModalGradient}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.authCloseButton}
              onPress={() => setShowAuthPrompt(false)}
            >
              <Text style={styles.authCloseText}>×</Text>
            </TouchableOpacity>

            {/* Logo and Header */}
            <View style={styles.authHeader}>
              <Text style={styles.logo}>🌿</Text>
              <Text style={styles.appName}>LOTUS</Text>
              <Text style={styles.tagline}>
                {authMode === 'signup'
                  ? 'Unlock your plant\'s full potential with personalized care guides'
                  : 'Continue your plant care journey'
                }
              </Text>
            </View>

            {/* Auth Buttons - Order: Phone, Google, Apple */}
            <View style={styles.authButtons}>
              <TouchableOpacity
                style={styles.phoneButton}
                onPress={handlePhoneAuth}
                disabled={isLoading}
              >
                <Ionicons name="call" size={20} color={COLORS.primary} />
                <Text style={styles.phoneButtonText}>Continue with Phone</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color={COLORS.primary} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
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

            {/* Mode Switch Option */}
            <TouchableOpacity onPress={switchAuthMode} style={styles.switchModeButton}>
              <Text style={styles.switchModeText}>
                {authMode === 'signup'
                  ? 'Already a member? Sign in'
                  : 'New to Lotus? Create account'
                }
              </Text>
            </TouchableOpacity>

            {/* Skip Option */}
            <TouchableOpacity onPress={() => setShowAuthPrompt(false)} style={styles.skipButton}>
              <Text style={styles.skipText}>Maybe later</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
        </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerButton: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  confidenceText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  plantInfo: {
    marginBottom: 24,
  },
  plantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 16,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  familyName: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  careSection: {
    marginBottom: 24,
  },
  careTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  plantDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  careDetails: {
    gap: 12,
  },
  unlockItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockIcon: {
    marginRight: 12,
  },
  unlockLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  actionButtons: {
    gap: 16,
    marginBottom: 24,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    gap: 8,
  },
  retryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bottomPadding: {
    height: 20,
  },

  // Auth Modal Styles - Matches AuthScreen Design
  authModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authModalGradient: {
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    paddingHorizontal: SCREEN_WIDTH * 0.08,
    paddingTop: SCREEN_HEIGHT * 0.06,
    paddingBottom: SCREEN_HEIGHT * 0.04,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 25,
  },
  authCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  authCloseText: {
    fontSize: 24,
    fontWeight: '300',
    color: COLORS.white,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: SCREEN_HEIGHT * 0.04,
  },
  logo: {
    fontSize: SCREEN_HEIGHT * 0.08,
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  appName: {
    fontSize: SCREEN_HEIGHT * 0.05,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SCREEN_HEIGHT * 0.02,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: SCREEN_HEIGHT * 0.02,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: SCREEN_HEIGHT * 0.028,
    fontWeight: '500',
    opacity: 0.95,
  },
  authButtons: {
    marginTop: SCREEN_HEIGHT * 0.02,
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
    marginTop: SCREEN_HEIGHT * 0.03,
    paddingHorizontal: SCREEN_WIDTH * 0.02,
  },
  legalText: {
    fontSize: 12,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
  },
  legalLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  switchModeButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
  switchModeText: {
    fontSize: 15,
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '500',
    textAlign: 'center',
  },
  signInText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.secondary,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
});