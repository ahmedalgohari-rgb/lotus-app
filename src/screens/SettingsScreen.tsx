import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useRTL, rtlStyles } from '../utils/rtl';

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  isRTL: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  isRTL,
}) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
    <View style={[styles.settingsItemContent, rtlStyles.row(isRTL)]}>
      <Ionicons
        name={icon as any}
        size={24}
        color="#4A90E2"
        style={[rtlStyles.marginRight(12, isRTL)]}
      />
      <View style={styles.settingsItemText}>
        <Text style={[styles.settingsItemTitle, rtlStyles.textLeft(isRTL)]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingsItemSubtitle, rtlStyles.textLeft(isRTL)]}>
            {subtitle}
          </Text>
        )}
      </View>
      {showArrow && (
        <Ionicons
          name={isRTL ? "chevron-back" : "chevron-forward"}
          size={20}
          color="#8E8E93"
        />
      )}
    </View>
  </TouchableOpacity>
);

const LanguageSelector: React.FC<{ isRTL: boolean }> = ({ isRTL }) => {
  const { t } = useTranslation();
  const { language, setLanguage } = useStore();

  const languages = [
    { code: 'en', name: t('settings.languages.en'), flag: '🇺🇸' },
    { code: 'ar', name: t('settings.languages.ar'), flag: '🇪🇬' },
  ];

  const handleLanguageChange = async (langCode: 'en' | 'ar') => {
    try {
      await setLanguage(langCode);
      Alert.alert(
        t('common.success'),
        t('settings.languageChanged'),
        [{ text: t('common.done') }]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('errors.loadError'));
    }
  };

  return (
    <View style={styles.languageSelector}>
      <Text style={[styles.sectionTitle, rtlStyles.textLeft(isRTL)]}>
        {t('settings.changeLanguage')}
      </Text>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.languageOption,
            language === lang.code && styles.selectedLanguage,
          ]}
          onPress={() => handleLanguageChange(lang.code as 'en' | 'ar')}
        >
          <View style={[styles.languageContent, rtlStyles.row(isRTL)]}>
            <Text style={styles.languageFlag}>{lang.flag}</Text>
            <Text
              style={[
                styles.languageName,
                language === lang.code && styles.selectedLanguageText,
                rtlStyles.textLeft(isRTL),
              ]}
            >
              {lang.name}
            </Text>
            {language === lang.code && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#4A90E2"
                style={rtlStyles.marginLeft(8, isRTL)}
              />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { user, clearStorage, setAuthenticated } = useStore();
  const isRTL = useRTL();

  const handleSignOut = () => {
    Alert.alert(
      t('settings.signOut'),
      t('settings.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.signOut'),
          style: 'destructive',
          onPress: async () => {
            await clearStorage();
            setAuthenticated(false);
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      t('settings.about'),
      t('settings.aboutMessage'),
      [{ text: t('common.close') }]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, rtlStyles.textLeft(isRTL)]}>
          {t('settings.title')}
        </Text>
        {user && (
          <Text style={[styles.userInfo, rtlStyles.textLeft(isRTL)]}>
            {user.name || user.email}
          </Text>
        )}
      </View>

      {/* Language Settings */}
      <View style={styles.section}>
        <LanguageSelector isRTL={isRTL} />
      </View>

      {/* Account Settings */}
      {user && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, rtlStyles.textLeft(isRTL)]}>
            {t('settings.account')}
          </Text>

          <SettingsItem
            icon="person-outline"
            title={t('settings.profile')}
            subtitle={t('settings.profileSubtitle')}
            onPress={() => {}}
            isRTL={isRTL}
          />

          <SettingsItem
            icon="notifications-outline"
            title={t('settings.notifications')}
            subtitle={t('settings.notificationsSubtitle')}
            onPress={() => {}}
            isRTL={isRTL}
          />
        </View>
      )}

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, rtlStyles.textLeft(isRTL)]}>
          {t('settings.about')}
        </Text>

        <SettingsItem
          icon="information-circle-outline"
          title={t('settings.about')}
          subtitle={t('settings.version') + ' 2.0.0'}
          onPress={handleAbout}
          isRTL={isRTL}
        />

        <SettingsItem
          icon="help-circle-outline"
          title={t('settings.helpSupport')}
          subtitle={t('settings.helpSupportSubtitle')}
          onPress={() => {}}
          isRTL={isRTL}
        />
      </View>

      {/* Sign Out */}
      {user && (
        <View style={styles.section}>
          <SettingsItem
            icon="log-out-outline"
            title={t('settings.signOut')}
            onPress={handleSignOut}
            showArrow={false}
            isRTL={isRTL}
          />
        </View>
      )}

      <View style={styles.footer}>
        <Text style={[styles.footerText, rtlStyles.textLeft(isRTL)]}>
          🌿 Made with love for Cairo plant parents
        </Text>
        <Text style={[styles.footerText, rtlStyles.textLeft(isRTL)]}>
          مصنوع بحب لمحبي النباتات في القاهرة 🇪🇬
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginHorizontal: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  settingsItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  settingsItemContent: {
    alignItems: 'center',
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  languageSelector: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  languageOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: '#F8F9FA',
  },
  selectedLanguage: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  languageContent: {
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  selectedLanguageText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    marginVertical: 2,
    textAlign: 'center',
  },
});