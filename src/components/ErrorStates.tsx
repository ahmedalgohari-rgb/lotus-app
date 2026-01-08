import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

interface TipItemProps {
  icon: string;
  text: string;
}

const TipItem: React.FC<TipItemProps> = ({ icon, text }) => (
  <View style={styles.tipItem}>
    <Text style={styles.tipIcon}>{icon}</Text>
    <Text style={styles.tipText}>{text}</Text>
  </View>
);

interface NotAPlantErrorProps {
  onRetry: () => void;
  onViewTips?: () => void;
}

export const NotAPlantError: React.FC<NotAPlantErrorProps> = ({ onRetry, onViewTips }) => {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.errorContainer}>
      <Text style={styles.icon}>📷</Text>

      <Text style={styles.title}>
        {t('errors.notAPlant.title', 'Not a Plant')}
      </Text>

      <Text style={styles.subtitle}>
        {t('errors.notAPlant.subtitle', "We couldn't find a plant in your photo. Try:")}
      </Text>

      <View style={styles.tipsList}>
        <TipItem
          icon="📷"
          text={t('errors.notAPlant.tips.closer', 'Get closer to the leaves')}
        />
        <TipItem
          icon="💡"
          text={t('errors.notAPlant.tips.lighting', 'Improve lighting')}
        />
        <TipItem
          icon="🎯"
          text={t('errors.notAPlant.tips.focus', 'Focus on one plant at a time')}
        />
        <TipItem
          icon="🍃"
          text={t('errors.notAPlant.tips.wholePlant', 'Show the whole plant')}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={onRetry}
        >
          <Text style={styles.primaryButtonText}>
            {t('errors.notAPlant.tryAgain', 'Try Again')}
          </Text>
        </TouchableOpacity>

        {onViewTips && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onViewTips}
          >
            <Text style={styles.secondaryButtonText}>
              {t('errors.notAPlant.viewTips', 'View Tips')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

interface LowConfidenceErrorProps {
  bestGuess: {
    species: string;
    confidence: number;
  };
  onRetry: () => void;
  onSkip: () => void;
}

export const LowConfidenceError: React.FC<LowConfidenceErrorProps> = ({
  bestGuess,
  onRetry,
  onSkip
}) => {
  const { t } = useTranslation();
  const confidence = Math.round(bestGuess.confidence);

  return (
    <ScrollView contentContainerStyle={styles.errorContainer}>
      <Text style={styles.icon}>🤔</Text>

      <Text style={styles.title}>
        {t('errors.lowConfidence.title', 'We Found a Plant')}
      </Text>

      <Text style={styles.subtitle}>
        {t('errors.lowConfidence.subtitle', "But We're Not Sure Which One")}
      </Text>

      <View style={styles.guessCard}>
        <Text style={styles.guessLabel}>
          {t('errors.lowConfidence.bestGuess', 'Our best guess:')}
        </Text>
        <Text style={styles.guessName}>
          {bestGuess.species}
        </Text>
        <Text style={styles.confidenceText}>
          {t('errors.lowConfidence.confidence', '{{percent}}% confident', { percent: confidence })}
        </Text>
        <View style={styles.confidenceBarContainer}>
          <View
            style={[
              styles.confidenceFill,
              { width: `${confidence}%` }
            ]}
          />
        </View>
      </View>

      <Text style={styles.explanation}>
        {t('errors.lowConfidence.explanation', 'This might be too small or blurry to identify clearly. Try:')}
      </Text>

      <View style={styles.tipsList}>
        <TipItem
          icon="📸"
          text={t('errors.lowConfidence.tips.clearer', 'Take a clearer photo')}
        />
        <TipItem
          icon="🍃"
          text={t('errors.lowConfidence.tips.moreLeaves', 'Show more leaves')}
        />
        <TipItem
          icon="💡"
          text={t('errors.lowConfidence.tips.lighting', 'Better lighting')}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={onRetry}
        >
          <Text style={styles.primaryButtonText}>
            {t('errors.lowConfidence.tryAgain', 'Try Again')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onSkip}
        >
          <Text style={styles.secondaryButtonText}>
            {t('errors.lowConfidence.useAnyway', 'Use This Anyway')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

interface ServiceErrorProps {
  errorType: 'RATE_LIMITED' | 'API_DOWN' | 'NETWORK_ERROR' | 'CONFIG_ERROR' | 'UNKNOWN';
  errorCode?: string;
  errorMessage?: string;
  onRetry: () => void;
  onGoHome: () => void;
}

export const ServiceError: React.FC<ServiceErrorProps> = ({
  errorType,
  errorCode,
  errorMessage,
  onRetry,
  onGoHome
}) => {
  const { t } = useTranslation();

  const getErrorDetails = () => {
    switch (errorType) {
      case 'RATE_LIMITED':
        return {
          title: t('errors.service.rateLimit.title', 'Too Many Requests'),
          message: t('errors.service.rateLimit.message', "You've identified many plants quickly. Please wait a few moments and try again."),
          icon: '⏳',
        };
      case 'API_DOWN':
        return {
          title: t('errors.service.apiDown.title', 'Service Temporarily Down'),
          message: t('errors.service.apiDown.message', 'The plant identification service is currently unavailable. Please try again in a few moments.'),
          icon: '⚠️',
        };
      case 'NETWORK_ERROR':
        return {
          title: t('errors.service.network.title', 'No Internet Connection'),
          message: t('errors.service.network.message', 'Please check your internet connection and try again.'),
          icon: '📡',
        };
      case 'CONFIG_ERROR':
        return {
          title: t('errors.service.config.title', 'Configuration Error'),
          message: t('errors.service.config.message', 'There is a configuration issue. Please contact support.'),
          icon: '⚙️',
        };
      default:
        return {
          title: t('errors.service.unknown.title', 'Something Went Wrong'),
          message: errorMessage || t('errors.service.unknown.message', 'An unexpected error occurred. Please try again.'),
          icon: '❌',
        };
    }
  };

  const { title, message, icon } = getErrorDetails();

  return (
    <ScrollView contentContainerStyle={styles.errorContainer}>
      <Text style={styles.icon}>{icon}</Text>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.message}>{message}</Text>

      {errorCode && (
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>
            {t('errors.service.errorCode', 'Error Code:')}
          </Text>
          <Text style={styles.code}>{errorCode}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={onRetry}
        >
          <Text style={styles.primaryButtonText}>
            {t('errors.service.tryAgain', 'Try Again')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onGoHome}
        >
          <Text style={styles.secondaryButtonText}>
            {t('errors.service.goHome', 'Go Home')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.supportText}>
        {t('errors.service.support', 'Still having issues? Contact us at support@lotus.app')}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },

  icon: {
    fontSize: 80,
    marginBottom: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },

  tipsList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },

  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  tipIcon: {
    fontSize: 20,
    marginRight: 12,
  },

  tipText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },

  buttonContainer: {
    width: '100%',
    gap: 12,
  },

  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButton: {
    backgroundColor: '#10B981',
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#10B981',
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },

  guessCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },

  guessLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },

  guessName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },

  confidenceText: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 8,
    fontWeight: '500',
  },

  confidenceBarContainer: {
    height: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 4,
    overflow: 'hidden',
  },

  confidenceFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },

  explanation: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },

  message: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },

  codeContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  codeLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  code: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'monospace',
    fontWeight: '600',
  },

  supportText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
});
