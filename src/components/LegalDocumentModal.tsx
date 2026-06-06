import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LegalDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  documentType: 'terms' | 'privacy';
}

const LegalDocumentModal: React.FC<LegalDocumentModalProps> = ({
  visible,
  onClose,
  documentType,
}) => {
  const isTerms = documentType === 'terms';
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isTerms ? t('legal.termsOfService') : t('legal.privacyPolicy')}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.content}>
            <Text style={styles.lastUpdated}>Last Updated: November 9, 2025</Text>

            {isTerms ? <TermsOfServiceContent /> : <PrivacyPolicyContent />}
          </View>
        </ScrollView>

        {/* Footer with Accept Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.acceptButton} onPress={onClose}>
            <Text style={styles.acceptButtonText}>{t('legal.iUnderstand')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// Terms of Service Content Component
const TermsOfServiceContent: React.FC = () => (
  <>
    <Text style={styles.sectionTitle}>Introduction</Text>
    <Text style={styles.paragraph}>
      These Terms of Service ("Terms") constitute a legally binding agreement between you ("User") and Lotus Plant Care ("we," "us," or "our"). By accessing or using the Lotus Plant Care mobile application ("Application" or "Service"), you agree to be bound by these Terms.
    </Text>

    <Text style={styles.sectionTitle}>1. Description of Service</Text>
    <Text style={styles.paragraph}>
      Lotus Plant Care is a mobile application that provides AI-powered plant identification services, plant care reminders and recommendations, plant care tracking and logging, weather-based care recommendations, and personal plant journal functionality.
    </Text>

    <Text style={styles.sectionTitle}>2. Acceptance of Terms</Text>
    <Text style={styles.paragraph}>
      By using the Application, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service, our Privacy Policy, and all applicable laws and regulations.
    </Text>
    <Text style={styles.paragraph}>
      <Text style={styles.bold}>Age Requirement:</Text> You must be at least 13 years of age to use the Application. Users under 18 years of age should obtain parental or guardian consent before using the Application.
    </Text>

    <Text style={styles.sectionTitle}>3. User Accounts</Text>
    <Text style={styles.paragraph}>
      You may create an account using Google account authentication, Facebook account authentication, or email and password registration.
    </Text>
    <Text style={styles.paragraph}>
      You are responsible for maintaining the confidentiality of your account credentials and all activities that occur under your account.
    </Text>

    <Text style={styles.sectionTitle}>4. Acceptable Use Policy</Text>
    <Text style={styles.paragraph}>
      You may use the Application to track and manage your plant collection, capture and store plant photographs, and utilize plant identification features.
    </Text>
    <Text style={styles.paragraph}>
      You may NOT upload inappropriate, offensive, or illegal content, attempt to hack or exploit the Application, or engage in spam or abusive behavior.
    </Text>

    <Text style={styles.sectionTitle}>5. Intellectual Property Rights</Text>
    <Text style={styles.paragraph}>
      You retain all ownership rights to content you create. By uploading content to the Application, you grant us a limited license to store, display, and process it for plant identification purposes.
    </Text>

    <Text style={styles.sectionTitle}>6. Disclaimers</Text>
    <Text style={styles.paragraph}>
      THE APPLICATION IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. Plant identification accuracy typically ranges from 70-95%. We are not professional horticulturists and are not liable for plant health outcomes.
    </Text>

    <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
    <Text style={styles.paragraph}>
      TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR LOSS OF DATA, PLANT DEATH OR DAMAGE, OR ANY INDIRECT DAMAGES. Our maximum aggregate liability shall not exceed $50 USD.
    </Text>

    <Text style={styles.sectionTitle}>8. Termination</Text>
    <Text style={styles.paragraph}>
      You may terminate your account at any time. We may suspend or terminate your account for violations of these Terms.
    </Text>

    <Text style={styles.sectionTitle}>9. Governing Law</Text>
    <Text style={styles.paragraph}>
      These Terms shall be governed by the laws of Egypt. Disputes will be resolved in the courts of Cairo, Egypt.
    </Text>

    <Text style={styles.sectionTitle}>10. Contact</Text>
    <Text style={styles.paragraph}>
      For questions regarding these Terms, contact us at ahmedalgohari.rgb@gmail.com
    </Text>
  </>
);

// Privacy Policy Content Component
const PrivacyPolicyContent: React.FC = () => (
  <>
    <Text style={styles.sectionTitle}>Introduction</Text>
    <Text style={styles.paragraph}>
      This Privacy Policy governs the manner in which Lotus Plant Care ("we," "us," or "our") collects, uses, maintains, and discloses information collected from users ("you" or "your") of the Lotus Plant Care mobile application.
    </Text>

    <Text style={styles.sectionTitle}>1. Information We Collect</Text>
    <Text style={styles.paragraph}>
      <Text style={styles.bold}>Account Information:</Text> Email address, name, profile picture (if using OAuth), and authentication data.
    </Text>
    <Text style={styles.paragraph}>
      <Text style={styles.bold}>Plant Data:</Text> Plant photos, names, care logs, location, window direction, and care notes.
    </Text>
    <Text style={styles.paragraph}>
      <Text style={styles.bold}>Technical Information:</Text> Device type, session tokens, and cached data.
    </Text>

    <Text style={styles.sectionTitle}>2. Information We DON'T Collect</Text>
    <Text style={styles.paragraph}>
      We do NOT collect your precise GPS location, contacts, browsing history, data from other apps, payment information, or any data when you use guest mode.
    </Text>

    <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
    <Text style={styles.paragraph}>
      We use your data to authenticate users, store plant data, identify plants using PlantNet AI, generate care recommendations, display weather data, and sync across devices.
    </Text>

    <Text style={styles.sectionTitle}>4. How We Share Your Information</Text>
    <Text style={styles.paragraph}>
      We share data with service providers: Supabase (storage), PlantNet API (plant identification), OpenWeather API (weather data), and authentication providers (Google, Facebook) if you use OAuth.
    </Text>
    <Text style={styles.paragraph}>
      We do NOT sell your data, share with advertisers, or share your plant data with other users.
    </Text>

    <Text style={styles.sectionTitle}>5. Data Security</Text>
    <Text style={styles.paragraph}>
      All data transmission is encrypted using HTTPS. We implement OAuth 2.0 authentication and Supabase Row Level Security to ensure users can only access their own data.
    </Text>

    <Text style={styles.sectionTitle}>6. Your Rights</Text>
    <Text style={styles.paragraph}>
      You have the right to access, edit, delete, and export your data at any time. Contact us at ahmedalgohari.rgb@gmail.com to exercise these rights.
    </Text>

    <Text style={styles.sectionTitle}>7. GDPR Compliance</Text>
    <Text style={styles.paragraph}>
      EU users have additional rights under GDPR, including the right to data portability, the right to be forgotten, and the right to lodge a complaint with a supervisory authority.
    </Text>

    <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
    <Text style={styles.paragraph}>
      The Application is not intended for children under 13 years old. We do not knowingly collect information from children under 13.
    </Text>

    <Text style={styles.sectionTitle}>9. Contact</Text>
    <Text style={styles.paragraph}>
      For questions regarding this Privacy Policy, contact us at ahmedalgohari.rgb@gmail.com
    </Text>
  </>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  content: {
    paddingTop: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
    marginBottom: 12,
  },
  bold: {
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LegalDocumentModal;
