import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Text from '@/components/Text';
import Button from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

const LoginScreen = () => {
  const { loginAsGuest } = useAuthStore();
  const router = useRouter();

  const handleGuestLogin = () => {
    loginAsGuest();
    router.replace('/(tabs)'); // Navigate to main app after guest login
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: makeRedirectUri(),
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, makeRedirectUri());

        if (res.type === 'success') {
          // Supabase handles session automatically after successful OAuth
          // The auth store listener will update the state automatically
          router.replace('/(tabs)');
        } else {
          Alert.alert('Login Cancelled', 'OAuth process was cancelled.');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>🌿</Text>
        <Text style={styles.title}>LOTUS</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Welcome!</Text>
        <Text style={styles.welcomeTextAr}>أهلاً بك</Text>
        <Text style={styles.description}>
          Sign up to save your plants and get care reminders
        </Text>
        <Button
          title="Continue with Apple"
          variant="secondary"
          style={styles.oauthButton}
          onPress={() => handleOAuthLogin('apple')}
        />
        <Button
          title="Continue with Google"
          variant="secondary"
          style={styles.oauthButton}
          onPress={() => handleOAuthLogin('google')}
        />
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>
        <Button
          title="Continue as Guest"
          variant="primary"
          onPress={handleGuestLogin}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.pureWhite,
  },
  hero: {
    height: '40%',
    backgroundColor: Colors.lotusGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 64,
    color: Colors.pureWhite,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.pureWhite,
  },
  content: {
    flex: 1,
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: Colors.pureWhite,
    marginTop: -30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.lotusGreen,
    marginBottom: 8,
  },
  welcomeTextAr: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.lotusGreen,
    marginBottom: 20,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  oauthButton: {
    marginBottom: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.mediumGray,
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.textSecondary,
  },
});

export default LoginScreen;