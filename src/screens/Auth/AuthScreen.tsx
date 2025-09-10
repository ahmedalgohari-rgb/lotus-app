import React, { FC, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Layout, Typography } from '@/constants';
import { 
  Button, 
  Gradient, 
  ScreenTitle, 
  BodyText, 
  Input, 
  Card 
} from '@/components';
import { useAuthActions } from '@/store';
import { oAuthService } from '@/services/auth/oAuthService';

interface AuthScreenProps {} 

export const AuthScreen: FC<AuthScreenProps> = () => {
  const navigation = useNavigation();
  const { login, loginAsGuest } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleSignIn = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      const result = await oAuthService.signInWithGoogle();
      
      if (result.success && result.user && result.tokens) {
        login(result.user, result.tokens);
        navigation.navigate('Main' as never);
      } else {
        oAuthService.showOAuthError(
          result.error || 'Unknown error occurred',
          'google'
        );
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      const result = await oAuthService.signInWithApple();
      
      if (result.success && result.user && result.tokens) {
        login(result.user, result.tokens);
        navigation.navigate('Main' as never);
      } else {
        oAuthService.showOAuthError(
          result.error || 'Unknown error occurred',
          'apple'
        );
      }
    } catch (error) {
      console.error('Apple sign-in error:', error);
      Alert.alert('Error', 'Failed to sign in with Apple');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = (): void => {
    Alert.alert(
      'Guest Mode / الوضع الضيف',
      'You can use Lotus without an account, but your data won\'t be synced across devices.\n\nيمكنك استخدام لوتس بدون حساب، لكن بياناتك لن تتزامن عبر الأجهزة.',
      [
        {
          text: 'Cancel / إلغاء',
          style: 'cancel',
        },
        {
          text: 'Continue as Guest / متابعة كضيف',
          onPress: () => {
            loginAsGuest();
            navigation.navigate('Main' as never);
          },
        },
      ]
    );
  };

  const handleEmailSignIn = (): void => {
    // Mock email authentication for now
    Alert.alert(
      'Coming Soon / قريباً',
      'Email authentication will be available soon.\n\nمصادقة البريد الإلكتروني ستكون متاحة قريباً.',
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Hero Section */}
      <View style={styles.hero}>
        <Gradient variant="primary" style={styles.heroGradient}>
          <View style={styles.heroContent}>
            <ScreenTitle style={styles.heroEmoji}>🌿</ScreenTitle>
            <ScreenTitle style={styles.heroTitle}>LOTUS</ScreenTitle>
          </View>
        </Gradient>
      </View>

      {/* Auth Form */}
      <ScrollView 
        style={styles.formContainer}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.authCard}>
          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <ScreenTitle style={styles.welcomeTitle}>
              Welcome!
            </ScreenTitle>
            <ScreenTitle style={styles.welcomeTitleAr}>
              أهلاً بك!
            </ScreenTitle>
            <BodyText style={styles.welcomeSubtext}>
              Sign in to save your plants and get personalized care reminders
            </BodyText>
            <BodyText style={styles.welcomeSubtextAr}>
              سجل الدخول لحفظ نباتاتك والحصول على تذكيرات عناية شخصية
            </BodyText>
          </View>

          {/* OAuth Buttons */}
          <View style={styles.oauthSection}>
            <Button
              title="🍎 Continue with Apple"
              variant="oauth-apple"
              onPress={handleAppleSignIn}
              disabled={isLoading}
              loading={isLoading}
              style={styles.oauthButton}
            />
            
            <Button
              title="🔍 Continue with Google"
              variant="oauth-google"
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              loading={isLoading}
              style={styles.oauthButton}
            />
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <BodyText style={styles.dividerText}>or / أو</BodyText>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Form */}
          <View style={styles.emailSection}>
            <Input
              label="Email"
              labelArabic="البريد الإلكتروني"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <Input
              label="Password"
              labelArabic="كلمة المرور"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button
              title="Sign In / تسجيل الدخول"
              onPress={handleEmailSignIn}
              disabled={!email || !password || isLoading}
              style={styles.emailSignInButton}
            />
          </View>

          {/* Guest Mode */}
          <View style={styles.guestSection}>
            <Button
              title="Continue as Guest / متابعة كضيف"
              variant="secondary"
              onPress={handleGuestMode}
              disabled={isLoading}
              style={styles.guestButton}
            />
          </View>

          {/* Terms */}
          <View style={styles.termsSection}>
            <BodyText style={styles.termsText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </BodyText>
            <BodyText style={styles.termsTextAr}>
              بالمتابعة، توافق على شروط الخدمة وسياسة الخصوصية
            </BodyText>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Hero section
  hero: {
    height: '35%',
    minHeight: 200,
  },
  heroGradient: {
    flex: 1,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 48,
    color: Colors.pureWhite,
    marginBottom: Layout.sm,
  },
  heroTitle: {
    color: Colors.pureWhite,
    fontSize: 32,
    letterSpacing: 2,
  },

  // Form container
  formContainer: {
    flex: 1,
    marginTop: -Layout.sectionSpacing,
  },
  formContent: {
    paddingBottom: Layout.screenPadding,
  },
  authCard: {
    marginHorizontal: Layout.screenPadding,
    paddingVertical: Layout.sectionSpacing,
    paddingHorizontal: Layout.screenPadding,
  },

  // Welcome section
  welcomeSection: {
    alignItems: 'center',
    marginBottom: Layout.sectionSpacing * 1.5,
  },
  welcomeTitle: {
    color: Colors.lotusGreen,
    marginBottom: Layout.xs,
  },
  welcomeTitleAr: {
    color: Colors.lotusGreen,
    fontSize: 20,
    marginBottom: Layout.screenPadding,
  },
  welcomeSubtext: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: Layout.xs,
    lineHeight: Typography.body.fontSize * 1.4,
  },
  welcomeSubtextAr: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },

  // OAuth section
  oauthSection: {
    marginBottom: Layout.sectionSpacing,
  },
  oauthButton: {
    marginBottom: Layout.cardPadding,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.sectionSpacing,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Layout.screenPadding,
    color: Colors.textSecondary,
    fontSize: Typography.caption.fontSize,
  },

  // Email section
  emailSection: {
    marginBottom: Layout.sectionSpacing,
  },
  emailSignInButton: {
    marginTop: Layout.sm,
  },

  // Guest section
  guestSection: {
    marginBottom: Layout.sectionSpacing,
  },
  guestButton: {
    // Styling handled by Button component
  },

  // Terms section
  termsSection: {
    alignItems: 'center',
  },
  termsText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: Typography.caption.fontSize,
    lineHeight: Typography.caption.fontSize * 1.4,
    marginBottom: Layout.xs,
  },
  termsTextAr: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
});

export default AuthScreen;
