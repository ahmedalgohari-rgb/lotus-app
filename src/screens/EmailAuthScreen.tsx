import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants';
import { authService } from '../services/supabase';
import { useStore } from '../store';

interface EmailAuthScreenProps {
  navigation: any;
}

export default function EmailAuthScreen({ navigation }: EmailAuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { setUser, setAuthenticated } = useStore();

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = isSignUp 
        ? await authService.signUp(email, password)
        : await authService.signIn(email, password);
        
      if (error) throw error;
      
      if (isSignUp) {
        // Handle sign up - show confirmation message
        Alert.alert(
          'Check Your Email! 📧',
          `We've sent a confirmation link to ${email}. Please check your email (including spam folder) and click the link to complete your Lotus account setup.`,
          [
            { 
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
        return;
      }
      
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
      console.error('Email auth error:', error);
      Alert.alert('Authentication Failed', 'Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        {/* Back Button */}
        <View style={styles.backContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Logo and Title */}
          <View style={styles.heroSection}>
            <Text style={styles.logo}>🌿</Text>
            <Text style={styles.appName}>LOTUS</Text>
            <Text style={styles.tagline}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(45, 95, 63, 0.6)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(45, 95, 63, 0.6)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={styles.authButton}
              onPress={handleEmailAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.authButtonText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchModeButton}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.switchModeText}>
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Sign Up"
                }
              </Text>
            </TouchableOpacity>
          </View>

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
  backContainer: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 1,
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
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 16,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 16,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 18,
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.95,
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: COLORS.white,
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 24,
    fontSize: 16,
    color: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authButton: {
    backgroundColor: COLORS.white,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  switchModeButton: {
    alignItems: 'center',
    padding: 16,
  },
  switchModeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
  legalSection: {
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