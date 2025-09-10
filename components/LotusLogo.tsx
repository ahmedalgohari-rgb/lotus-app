/**
 * Professional Lotus Logo Component
 * Uses the actual Lotus logo PNG provided
 */
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Text from './Text';
import { Colors, Typography } from '@/constants';

interface LotusLogoProps {
  size?: 'small' | 'medium' | 'large' | 'hero';
  variant?: 'default' | 'light' | 'dark';
  showText?: boolean;
}

const sizeMap = {
  small: 32,
  medium: 64,
  large: 96,
  hero: 128,
};

const textSizeMap = {
  small: 8,
  medium: 12,
  large: 16,
  hero: 20,
};

export default function LotusLogo({ 
  size = 'medium', 
  variant = 'default',
  showText = true 
}: LotusLogoProps) {
  const logoSize = sizeMap[size];
  const textSize = textSizeMap[size];

  return (
    <View style={[styles.container, { width: logoSize, height: logoSize }]}>
      <Image 
        source={require('../assets/images/lotus-logo.png')}
        style={[
          styles.logoImage,
          { 
            width: logoSize, 
            height: logoSize,
          }
        ]}
        resizeMode="contain"
      />
      
      {/* Optional text below logo */}
      {showText && size !== 'small' && (
        <View style={styles.textContainer}>
          <Text 
            style={[
              styles.logoText, 
              { 
                fontSize: textSize,
                color: variant === 'dark' ? Colors.pureWhite : Colors.textPrimary,
                fontWeight: size === 'hero' ? '700' : '600'
              }
            ]}
          >
            LOTUS
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    // Image will be sized by the width/height props
  },
  textContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  logoText: {
    ...Typography.caption,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});