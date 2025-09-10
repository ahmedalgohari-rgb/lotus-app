import React from 'react';
import { TextInput, StyleSheet, TextInputProps, I18nManager } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize } from '@/constants';

type Props = TextInputProps;

const Input: React.FC<Props> = ({ style, ...props }) => {
  return (
    <TextInput
      style={[styles.base, style]}
      placeholderTextColor={Colors.textSecondary}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    height: 48,
    backgroundColor: Colors.pureWhite,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
});

export default Input;
