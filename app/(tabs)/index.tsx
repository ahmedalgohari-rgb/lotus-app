/**
 * Lotus Home Screen - Clean MVP Design
 * "Think Different" plant care experience
 * Inspired by the crazy ones who change things
 */
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Layout } from '@/constants';
import { useUser } from '@/store/authStore';
import { useRTL } from '@/hooks/useRTL';
import Text from '@/components/Text';
import LotusLogo from '@/components/LotusLogo';

const { width } = Dimensions.get('window');

// Simple guidelines data for clean MVP design
const guidelines = [
  {
    icon: '💧',
    textEn: 'Most plants need water every 5-7 days',
    textAr: 'معظم النباتات تحتاج الماء كل 5-7 أيام'
  },
  {
    icon: '☀️',
    textEn: 'Check light needs for each plant',
    textAr: 'تحقق من احتياجات الضوء لكل نبات'
  },
  {
    icon: '🧭',
    textEn: 'Window direction matters for plant health',
    textAr: 'اتجاه النافذة مهم لصحة النبات'
  }
];

const HomeScreen = () => {
  const router = useRouter();
  const user = useUser();
  const { t } = useTranslation();
  const { isRTL, textAlign, flexDirection, toggleLanguage } = useRTL();

  const handleScanPress = () => {
    router.push('/scan');
  };

  const handleLanguageToggle = () => {
    toggleLanguage();
  };

  const renderGuideline = (guideline, index) => (
    <View key={index} style={[styles.guideline, { flexDirection }]}>
      <Text style={styles.guidelineIcon}>{guideline.icon}</Text>
      <Text style={[styles.guidelineText, { textAlign }]}>
        {isRTL ? guideline.textAr : guideline.textEn}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Status Bar Space */}
      <View style={styles.statusBar} />
      
      {/* Header with Logo and Greeting */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <LotusLogo size="small" showText={false} />
          
          {/* Language Toggle */}
          <TouchableOpacity 
            style={styles.languageToggle}
            onPress={handleLanguageToggle}
          >
            <Text style={styles.languageToggleText}>
              {isRTL ? 'EN' : 'ع'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.headerContent, { alignItems: textAlign === 'right' ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.greeting, { textAlign }]}>
            Hello, {user?.firstName || 'أحمد'}! 👋
          </Text>
          
          <Text style={[styles.title, { textAlign }]}>
            Plant Care Basics
          </Text>
          
          <Text style={[styles.titleArabic, { textAlign }]}>
            أساسيات العناية
          </Text>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {/* Care Guidelines */}
        <View style={styles.guidelines}>
          {guidelines.map(renderGuideline)}
        </View>

        {/* Cairo Tip */}
        <View style={[styles.cairoTip, { alignItems: textAlign === 'right' ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.cairoTipLabel, { textAlign }]}>
            📍 Cairo Tip:
          </Text>
          <Text style={[styles.cairoTipText, { textAlign }]}>
            {isRTL ? 'المزيد من الماء في حرارة الصيف' : 'More water in summer heat'}
          </Text>
        </View>

        {/* Primary CTA */}
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={handleScanPress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.lotusGreen, Colors.nileBlue]}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.ctaText}>
              {isRTL ? 'ابدأ المسح ←' : 'Start Scanning →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cairoSand,
  },
  statusBar: {
    height: 44,
    backgroundColor: Colors.cairoSand,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.lotusGreen,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.lotusGreen,
    marginBottom: 4,
  },
  titleArabic: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.lotusGreen,
    marginBottom: 0,
  },
  languageToggle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.pureWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  languageToggleText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  guidelines: {
    marginBottom: 40,
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pureWhite,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: Colors.lotusGreen,
  },
  guidelineIcon: {
    fontSize: 24,
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  guidelineText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  cairoTip: {
    backgroundColor: Colors.pureWhite,
    borderRadius: 12,
    padding: 18,
    marginBottom: 40,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: Colors.nileBlue,
  },
  cairoTipLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.nileBlue,
    marginBottom: 4,
  },
  cairoTipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  ctaButton: {
    marginBottom: 40,
    shadowColor: Colors.lotusGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaGradient: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.pureWhite,
    letterSpacing: 0.5,
  },
});

export default HomeScreen;