import React, { useRef, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
import { Colors } from '@/constants';
import Text from '@/components/Text';
import Button from '@/components/Button';
import { useRouter } from 'expo-router';

const OnboardingScreen = () => {
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();
  const router = useRouter();

  const handlePageChange = (pageNumber: number) => {
    setPage(pageNumber);
  };

  const goToNextPage = () => {
    if (page < 2) {
      const nextPage = page + 1;
      setPage(nextPage);
      scrollRef.current?.scrollTo({ x: nextPage * width, animated: true });
    } else {
      router.replace('/auth');
    }
  };

  const skipOnboarding = () => {
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.pagerView}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={e => {
          const x = e.nativeEvent.contentOffset.x;
          const newPage = Math.round(x / width);
          if (newPage !== page) {
            setPage(newPage);
          }
        }}
        scrollEventThrottle={16}
      >
        <View style={[styles.page, { width }]}>
          <Text style={styles.icon}>🌱</Text>
          <Text style={styles.title}>Identify Your Plants</Text>
          <Text style={styles.description}>
            Take a photo and instantly identify any houseplant
          </Text>
        </View>
        <View style={[styles.page, { width }]}>
          <Text style={styles.icon}>💧</Text>
          <Text style={styles.title}>Smart Care Reminders</Text>
          <Text style={styles.description}>
            Get notified when your plants need water or care
          </Text>
        </View>
        <View style={[styles.page, { width }]}>
          <Text style={styles.icon}>🧭</Text>
          <Text style={styles.title}>Perfect Positioning</Text>
          <Text style={styles.description}>
            Learn where to place plants based on your window direction
          </Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {[...Array(3)].map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === page ? Colors.lotusGreen : Colors.mediumGray }]}
            />
          ))}
        </View>
        <Button
          title={page === 2 ? 'Get Started' : 'Continue →'}
          onPress={goToNextPage}
        />
        <Text style={styles.skipButton} onPress={skipOnboarding}>Skip</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cairoSand,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    fontSize: 80,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.lotusGreen,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  footer: {
    padding: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  skipButton: {
    textAlign: 'center',
    marginTop: 20,
    color: Colors.nileBlue,
  }
});

export default OnboardingScreen;