/**
 * Lazy Loading Screen Component
 * Shows loading indicator while heavy screens are being loaded
 */
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants';
import Text from '@/components/Text';

interface LazyScreenProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function LazyScreen({ children, fallback }: LazyScreenProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    // Simulate async loading of heavy components
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100); // Small delay to show loading state

    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return fallback || (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
});