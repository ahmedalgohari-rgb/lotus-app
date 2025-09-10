import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Layout } from '@/constants';
import Text from '@/components/Text';
import Button from '@/components/Button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Provides fallback UI and retry functionality
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service (e.g., Sentry) in production
    if (!__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
      // TODO: Send to error monitoring service
      // Sentry.captureException(error, { extra: errorInfo });
    } else {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      
      if (Fallback && this.state.error) {
        return <Fallback error={this.state.error} retry={this.handleRetry} />;
      }

      return <DefaultErrorFallback error={this.state.error} retry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<{ error: Error | null; retry: () => void }> = ({ 
  error, 
  retry 
}) => (
  <View style={styles.container}>
    <View style={styles.content}>
      <Text variant="h2" style={styles.title}>
        Oops! Something went wrong
      </Text>
      
      <Text variant="body" style={styles.message}>
        We're sorry, but something unexpected happened. Please try again.
      </Text>
      
      {__DEV__ && error && (
        <View style={styles.errorDetails}>
          <Text variant="caption" style={styles.errorText}>
            {error.message}
          </Text>
        </View>
      )}
      
      <Button 
        title="Try Again" 
        onPress={retry}
        variant="primary"
        style={styles.retryButton}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.screenPadding,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Layout.md,
  },
  message: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.lg,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: Colors.lightGray,
    padding: Layout.sm,
    borderRadius: Layout.borderRadius,
    marginBottom: Layout.lg,
    width: '100%',
  },
  errorText: {
    color: Colors.error,
    fontFamily: 'monospace',
  },
  retryButton: {
    width: '100%',
  },
});

export default ErrorBoundary;