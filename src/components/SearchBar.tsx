import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FIBONACCI, TYPOGRAPHY, ELEMENT_SIZES } from '../constants';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, onClear, placeholder }: SearchBarProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Ionicons
        name="search"
        size={ELEMENT_SIZES.ICON_SM}
        color={COLORS.textSecondary}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || t('addScan.searchPlaceholder')}
        placeholderTextColor={COLORS.text}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && onClear && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Ionicons
            name="close-circle"
            size={ELEMENT_SIZES.ICON_SM}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    paddingHorizontal: FIBONACCI.LG,
    paddingVertical: Platform.OS === 'ios' ? FIBONACCI.MD : FIBONACCI.SM,
    height: ELEMENT_SIZES.BUTTON_MD, // 55px height - match Identify button
  },
  icon: {
    marginRight: FIBONACCI.MD,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.MD, // 18px - bigger text
    fontWeight: '500',
    color: COLORS.text,
    padding: 0, // Remove default padding
  },
  clearButton: {
    padding: FIBONACCI.XS,
    marginLeft: FIBONACCI.SM,
  },
});
