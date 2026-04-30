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
import { useStore } from '../store';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onCameraPress?: () => void;
  placeholder?: string;
}

const SearchBar = React.memo(function SearchBar({ value, onChangeText, onClear, onCameraPress, placeholder }: SearchBarProps) {
  const { t } = useTranslation();
  const language = useStore((state) => state.language);
  const isRTL = language === 'ar';

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <Ionicons
        name="search"
        size={ELEMENT_SIZES.ICON_SM}
        color={COLORS.textSecondary}
        style={isRTL ? styles.iconRTL : styles.icon}
      />
      <TextInput
        style={[styles.input, isRTL && styles.inputRTL]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || t('addScan.searchPlaceholder')}
        placeholderTextColor={COLORS.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        blurOnSubmit={false}
        textAlign={isRTL ? 'right' : 'left'}
      />
      {value.length > 0 && onClear && (
        <TouchableOpacity onPress={onClear} style={[styles.clearButton, isRTL && styles.clearButtonRTL]}>
          <Ionicons
            name="close-circle"
            size={ELEMENT_SIZES.ICON_SM}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      )}
      {onCameraPress && (
        <>
          <View style={styles.divider} />
          <TouchableOpacity
            onPress={onCameraPress}
            style={styles.cameraButton}
            activeOpacity={0.6}
          >
            <Ionicons name="camera" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
});

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: ELEMENT_SIZES.RADIUS_MD,
    paddingLeft: FIBONACCI.LG,
    paddingRight: FIBONACCI.MD,
    paddingVertical: Platform.OS === 'ios' ? FIBONACCI.SM : FIBONACCI.XS,
    height: ELEMENT_SIZES.BUTTON_MD, // 55px height
  },
  containerRTL: {
    flexDirection: 'row-reverse',
    paddingLeft: FIBONACCI.MD,
    paddingRight: FIBONACCI.LG,
  },
  icon: {
    marginRight: FIBONACCI.MD,
  },
  iconRTL: {
    marginLeft: FIBONACCI.MD,
    marginRight: 0,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.BASE, // 16px
    fontWeight: '500',
    color: COLORS.text,
    padding: 0,
  },
  inputRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  clearButton: {
    padding: FIBONACCI.XS,
    marginLeft: FIBONACCI.SM,
  },
  clearButtonRTL: {
    marginLeft: 0,
    marginRight: FIBONACCI.SM,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.textSecondary,
    opacity: 0.25,
    marginHorizontal: FIBONACCI.MD,
  },
  cameraButton: {
    padding: FIBONACCI.SM,
    borderRadius: ELEMENT_SIZES.RADIUS_SM,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
