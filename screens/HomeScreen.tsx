import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { useStore } from '../store';

const careCards = [
  {
    id: 'watering',
    icon: 'water-outline',
    title: 'Watering',
    titleAr: 'السقي',
    description: 'Most plants need water every 5-7 days',
    tip: 'Tip: Check soil moisture first',
    cairoTip: 'Cairo Tip: More water needed in summer heat',
  },
  {
    id: 'light',
    icon: 'sunny-outline',
    title: 'Light',
    titleAr: 'الإضاءة',
    description: 'Bright indirect light is best for most plants',
    tip: 'Tip: Rotate plants weekly for even growth',
    cairoTip: 'Cairo Tip: North windows are ideal',
  },
  {
    id: 'position',
    icon: 'navigate-outline',
    title: 'Position',
    titleAr: 'الموقع',
    description: 'Window direction matters for plant health',
    tip: 'Tip: East & North are best for most plants',
    cairoTip: 'Cairo Tip: Avoid south-facing windows in summer',
  },
  {
    id: 'humidity',
    icon: 'leaf-outline',
    title: 'Humidity',
    titleAr: 'الرطوبة',
    description: 'Most houseplants prefer 40-60% humidity',
    tip: 'Tip: Group plants together to increase humidity',
    cairoTip: 'Cairo Tip: Use humidifier in winter',
  },
];

export default function HomeScreen() {
  const { user } = useStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getGreetingAr = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء الخير';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>
              {getGreeting()}, {user?.first_name || 'Plant Lover'}! 👋
            </Text>
            <Text style={styles.greetingTextAr}>
              {getGreetingAr()}, مُحب النباتات!
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* App Introduction */}
        <View style={styles.introSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🌿</Text>
            <Text style={styles.appName}>LOTUS</Text>
          </View>
          <Text style={styles.tagline}>Your Plant Care Companion</Text>
          <Text style={styles.taglineAr}>رفيقك في العناية بالنباتات</Text>
          <Text style={styles.description}>
            Identify plants with your camera, get personalized care tips, 
            and never forget to water again!
          </Text>
        </View>

        {/* Care Guidelines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plant Care Basics</Text>
          <Text style={styles.sectionTitleAr}>أساسيات العناية بالنباتات</Text>
          
          {careCards.map((card) => (
            <View key={card.id} style={styles.careCard}>
              <View style={styles.cardHeader}>
                <Ionicons name={card.icon as any} size={32} color={COLORS.primary} style={styles.cardIcon} />
                <View style={styles.cardTitles}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardTitleAr}>{card.titleAr}</Text>
                </View>
              </View>
              
              <Text style={styles.cardDescription}>{card.description}</Text>
              <Text style={styles.cardTip}>{card.tip}</Text>
              <Text style={styles.cairoTip}>{card.cairoTip}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionTitleAr}>إجراءات سريعة</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="camera-outline" size={32} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Identify Plant</Text>
              <Text style={styles.actionButtonTextAr}>تحديد النبات</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButtonSecondary}>
              <Ionicons name="leaf-outline" size={32} color={COLORS.primary} />
              <Text style={styles.actionButtonSecondaryText}>My Plants</Text>
              <Text style={styles.actionButtonSecondaryTextAr}>نباتاتي</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weather Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weather Tips for Plants</Text>
          <Text style={styles.sectionTitleAr}>نصائح الطقس للنبات</Text>

          <View style={styles.cairoTipsCard}>
            <Text style={styles.cairoTipsTitle}>☀️ Weather Alert</Text>
            <Text style={styles.cairoTipsSubtitle}>تنبيه الطقس</Text>

            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>• Sunny Day: Check soil moisture.</Text>
              <Text style={styles.tipItem}>• High Humidity: Reduce watering.</Text>
              <Text style={styles.tipItem}>• Windy Day: Protect delicate plants.</Text>
            </View>
          </View>
        </View>

        {/* Seasonal Tips for Cairo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seasonal Tips for Cairo</Text>
          <Text style={styles.sectionTitleAr}>نصايح موسمية للقاهرة</Text>
          
          <View style={styles.cairoTipsCard}>
            <Text style={styles.cairoTipsTitle}>🏛️ Living in Cairo?</Text>
            <Text style={styles.cairoTipsSubtitle}>هل تعيش في القاهرة؟</Text>
            
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>• Water more frequently in summer (May-Sept)</Text>
              <Text style={styles.tipItem}>• Wipe leaves weekly due to dust</Text>
              <Text style={styles.tipItem}>• Use humidifiers in winter</Text>
              <Text style={styles.tipItem}>• North-facing windows are ideal</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  greetingTextAr: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  introSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  taglineAr: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 12,
    textAlign: 'right',
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  sectionTitleAr: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'right',
  },
  careCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    marginRight: 16,
  },
  cardTitles: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  cardTitleAr: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  cardDescription: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  cardTip: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  cairoTip: {
    fontSize: 14,
    color: COLORS.warning,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  actionButtonTextAr: {
    color: COLORS.white,
    fontSize: 14,
    marginTop: 2,
    textAlign: 'right',
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonSecondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  actionButtonSecondaryTextAr: {
    color: COLORS.primary,
    fontSize: 14,
    marginTop: 2,
    textAlign: 'right',
  },
  cairoTipsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cairoTipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  cairoTipsSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    textAlign: 'right',
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 20,
  },
});