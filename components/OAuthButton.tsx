/**
 * Professional OAuth Button Component
 * Follows Apple HIG and Google Material Design guidelines
 */
import React from 'react';
import { TouchableOpacity, View, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G, ClipPath, Defs, Rect } from 'react-native-svg';
import Text from './Text';
import { Colors, Typography, Layout, Shadow } from '@/constants';

interface OAuthButtonProps {
  provider: 'apple' | 'google';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

export default function OAuthButton({ 
  provider, 
  onPress, 
  disabled = false, 
  loading = false,
  style 
}: OAuthButtonProps) {
  const isApple = provider === 'apple';
  const isGoogle = provider === 'google';

  const buttonStyle = isApple ? styles.appleButton : styles.googleButton;
  const textStyle = isApple ? styles.appleText : styles.googleText;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        buttonStyle,
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {/* Provider Icon */}
        <View style={styles.iconContainer}>
          {loading ? (
            <ActivityIndicator 
              size="small" 
              color={isApple ? Colors.pureWhite : Colors.textPrimary} 
            />
          ) : (
            <>
              {isApple && <AppleIcon />}
              {isGoogle && <GoogleIcon />}
            </>
          )}
        </View>

        {/* Button Text */}
        <Text style={[styles.text, textStyle]}>
          {loading ? 'Signing in...' : `Continue with ${isApple ? 'Apple' : 'Google'}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// Apple Logo Component (Official Apple guidelines)
function AppleIcon() {
  return (
    <Svg width={20} height={24} viewBox="0 0 20 24" fill="none">
      <Path
        d="M15.7 2.3c-.9-1.1-2.4-1.9-3.8-1.8-.2 2.1.6 4.2 1.4 5.6.9 1.4 2.3 2.4 3.7 2.3.2-2.1-.3-4.2-1.3-6.1zM17.2 8.5c-2.1-.1-3.9.9-4.9.9s-2.6-.8-4.3-.8c-2.2 0-4.2 1.3-5.3 3.3-2.3 4-.6 9.9 1.6 13.1 1.1 1.6 2.4 3.3 4.1 3.2 1.6-.1 2.2-1 4.1-1 1.9 0 2.4 1 4.1 1 1.7 0 2.9-1.5 3.9-3.1.7-1 1.2-2.1 1.5-3.3-3.2-1.2-3.8-5.7-.8-7.3-.8-1.2-2-1.9-3.2-2z"
        fill={Colors.pureWhite}
      />
    </Svg>
  );
}

// Google Logo Component (Official Google branding)
function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <G clipPath="url(#clip0)">
        <Path
          d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z"
          fill="#4285F4"
        />
        <Path
          d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z"
          fill="#34A853"
        />
        <Path
          d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49L4.405 11.9z"
          fill="#FBBC04"
        />
        <Path
          d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51L4.405 8.1C5.19 5.737 7.395 3.977 10 3.977z"
          fill="#EA4335"
        />
      </G>
      <Defs>
        <ClipPath id="clip0">
          <Rect width="20" height="20" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    height: Layout.buttonHeight,
    borderRadius: Layout.buttonHeight / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Layout.xs,
    ...Shadow.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.lg,
  },
  iconContainer: {
    marginRight: Layout.sm,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Typography.buttonPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  // Apple-specific styles (following Apple HIG)
  appleButton: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#000000',
  },
  appleText: {
    color: Colors.pureWhite,
  },
  // Google-specific styles (following Material Design)
  googleButton: {
    backgroundColor: Colors.pureWhite,
    borderWidth: 1,
    borderColor: '#DADCE0',
  },
  googleText: {
    color: '#3C4043',
  },
  disabled: {
    opacity: 0.5,
  },
});