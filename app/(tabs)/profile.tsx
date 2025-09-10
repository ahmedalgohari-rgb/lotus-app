import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActionSheetIOS, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Layout } from '@/constants';
import { useUser, useIsAuthenticated, useIsGuest, useAuthActions } from '@/store/authStore';
import { useRTL } from '@/hooks/useRTL';
import Text from '@/components/Text';
import LotusLogo from '@/components/LotusLogo';

const ProfileScreen = () => {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const isGuest = useIsGuest();
  const { logout, updateUser } = useAuthActions();
  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  const handleSignIn = () => {
    router.push('/auth');
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.signOut') || 'Sign Out',
      t('profile.signOutConfirmation') || 'Are you sure you want to sign out?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        { 
          text: t('profile.signOut') || 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/auth');
          }
        },
      ]
    );
  };

  const handleLanguageToggle = () => {
    const currentLang = i18n.language;
    const languages = [
      { label: 'English', value: 'en', flag: '🇺🇸' },
      { label: 'العربية', value: 'ar', flag: '🇪🇬' }
    ];

    if (Platform.OS === 'ios') {
      const options = languages.map(lang => `${lang.flag} ${lang.label}`);
      options.push(t('profile.cancel') || 'Cancel');

      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t('profile.selectLanguage') || 'Select Language',
          options,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          if (buttonIndex < languages.length) {
            changeLanguage(languages[buttonIndex].value);
          }
        }
      );
    } else {
      // Android Alert fallback
      Alert.alert(
        t('profile.selectLanguage') || 'Select Language',
        t('profile.choosePreferredLanguage') || 'Choose your preferred language',
        [
          { text: '🇺🇸 English', onPress: () => changeLanguage('en') },
          { text: '🇪🇬 العربية', onPress: () => changeLanguage('ar') },
          { text: t('profile.cancel') || 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const changeLanguage = async (languageCode: string) => {
    if (isChangingLanguage) return;
    
    setIsChangingLanguage(true);
    try {
      await i18n.changeLanguage(languageCode);
      
      // Update user preferences if authenticated
      if (user && !isGuest) {
        updateUser({
          preferences: {
            ...user.preferences,
            language: languageCode as 'en' | 'ar'
          }
        });
      }

      // Show success message
      Alert.alert(
        t('profile.languageChanged') || 'Language Changed',
        t('profile.languageChangedMessage') || `Language changed to ${languageCode === 'ar' ? 'Arabic' : 'English'}`,
        [{ text: t('common.ok') || 'OK' }]
      );
    } catch (error) {
      console.error('Language change error:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('profile.languageChangeError') || 'Failed to change language. Please try again.',
        [{ text: t('common.ok') || 'OK' }]
      );
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const handleAbout = () => {
    Alert.alert(
      t('profile.aboutLotus') || 'About Lotus',
      t('profile.aboutDescription') || 'Lotus Plant Care App v1.0\n\nYour intelligent plant companion for healthier, happier plants.',
      [{ text: t('common.ok') || 'OK' }]
    );
  };

  const renderUserInfo = () => (
    <View style={styles.userSection}>
      <LotusLogo size="large" showText={false} />
      <View style={styles.userDetails}>
        <Text style={styles.userName}>
          {isGuest 
            ? (t('profile.guestUser') || 'Guest User')
            : user?.firstName 
              ? `${user.firstName} ${user.lastName || ''}` 
              : (t('profile.lotusUser') || 'Lotus User')
          }
        </Text>
        <Text style={styles.userEmail}>
          {isGuest ? (t('profile.notSignedIn') || 'Not signed in') : user?.email || (t('profile.noEmail') || 'No email')}
        </Text>
        {isGuest && (
          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <LinearGradient
              colors={[Colors.lotusGreen, Colors.nileBlue]}
              style={styles.signInGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.signInText}>{t('auth.signIn') || 'Sign In'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderMenuItem = (
    icon: keyof typeof Ionicons.glyphMap, 
    title: string, 
    onPress: () => void, 
    color?: string
  ) => (
    <TouchableOpacity style={[styles.menuItem, isRTL && styles.menuItemRTL]} onPress={onPress}>
      <View style={[styles.menuItemLeft, isRTL && styles.menuItemLeftRTL]}>
        <Ionicons name={icon} size={24} color={color || Colors.textPrimary} />
        <Text style={[styles.menuItemText, isRTL && styles.menuItemTextRTL, color && { color }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title') || 'Profile'}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Info Section */}
        {renderUserInfo()}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {renderMenuItem(
            'language', 
            `${t('profile.language') || 'Language'} / اللغة ${i18n.language === 'ar' ? '🇪🇬' : '🇺🇸'}`, 
            handleLanguageToggle
          )}
          {renderMenuItem('notifications', t('profile.notifications') || 'Notifications', () => Alert.alert(t('common.comingSoon') || 'Coming Soon!'))}
          {renderMenuItem('help-circle', t('profile.helpSupport') || 'Help & Support', () => Alert.alert(t('common.comingSoon') || 'Coming Soon!'))}
          {renderMenuItem('information-circle', t('profile.aboutLotus') || 'About Lotus', handleAbout)}
        </View>

        {/* Sign Out Button */}
        {isAuthenticated && !isGuest && (
          <View style={styles.signOutSection}>
            {renderMenuItem('log-out', t('profile.signOut') || 'Sign Out', handleLogout, Colors.critical)}
          </View>
        )}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>{t('profile.appVersion') || 'Lotus Plant Care v1.0'}</Text>
          <Text style={styles.appDescription}>
            {t('profile.appDescription') || 'Your intelligent plant companion for healthier, happier plants.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Layout.lg,
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: Layout.md,
  },
  headerTitle: {
    ...Typography.screenTitle,
    color: Colors.lotusGreen,
  },
  scrollView: {
    flex: 1,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: Layout.xl,
    paddingHorizontal: Layout.screenPadding,
    backgroundColor: Colors.surface,
    marginHorizontal: Layout.screenPadding,
    marginBottom: Layout.lg,
    borderRadius: 12,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  userDetails: {
    alignItems: 'center',
    marginTop: Layout.md,
  },
  userName: {
    ...Typography.sectionHeader,
    color: Colors.textPrimary,
    marginBottom: Layout.xs,
  },
  userEmail: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Layout.md,
  },
  signInButton: {
    marginTop: Layout.sm,
  },
  signInGradient: {
    paddingHorizontal: Layout.xl,
    paddingVertical: Layout.sm,
    borderRadius: 20,
  },
  signInText: {
    ...Typography.buttonPrimary,
    color: Colors.pureWhite,
  },
  menuSection: {
    backgroundColor: Colors.surface,
    marginHorizontal: Layout.screenPadding,
    borderRadius: 12,
    marginBottom: Layout.lg,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.md,
    paddingHorizontal: Layout.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemRTL: {
    flexDirection: 'row-reverse',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemLeftRTL: {
    flexDirection: 'row-reverse',
  },
  menuItemText: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginLeft: Layout.md,
  },
  menuItemTextRTL: {
    marginLeft: 0,
    marginRight: Layout.md,
    textAlign: 'right',
  },
  signOutSection: {
    backgroundColor: Colors.surface,
    marginHorizontal: Layout.screenPadding,
    borderRadius: 16,
    marginBottom: Layout.lg,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: Layout.xl,
    paddingHorizontal: Layout.screenPadding,
  },
  appVersion: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Layout.xs,
  },
  appDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ProfileScreen;