import React from 'react';
import { Text as RNText, StyleSheet, TextProps } from 'react-native';
import { TYPOGRAPHY } from '@/constants/typography';

interface Props extends TextProps {
  variant?: keyof typeof TYPOGRAPHY;
}

const Text: React.FC<Props> = ({ variant = 'body', style, ...props }) => {
  return <RNText style={[TYPOGRAPHY[variant], style]} {...props} />;
};

export default Text;
