# ⚡ Lotus App - Performance Guidelines
*Comprehensive performance optimization strategies and implementation*

## Table of Contents
1. [Performance Targets](#performance-targets)
2. [Mobile App Performance](#mobile-app-performance)
3. [Backend Performance](#backend-performance)
4. [Database Optimization](#database-optimization)
5. [Network Optimization](#network-optimization)
6. [Image & Media Optimization](#image--media-optimization)
7. [Caching Strategy](#caching-strategy)
8. [Monitoring & Alerting](#monitoring--alerting)

---

## Performance Targets

### Key Performance Indicators
```yaml
mobile_app:
  cold_start: < 2s
  warm_start: < 500ms
  screen_transition: < 300ms
  touch_response: < 100ms
  fps: 60 (consistent)
  memory_usage: < 200MB average
  battery_drain: < 5% per hour active
  crash_rate: < 0.1%
  anr_rate: < 0.05% (Android)
  
backend_api:
  response_time_p50: < 200ms
  response_time_p95: < 500ms
  response_time_p99: < 1000ms
  throughput: > 1000 req/s
  error_rate: < 0.1%
  availability: 99.9%
  
database:
  query_time_p50: < 50ms
  query_time_p95: < 200ms
  connection_pool_usage: < 80%
  cache_hit_rate: > 90%
```

---

## Mobile App Performance

### React Native Optimization

#### Component Optimization
```typescript
// components/OptimizedPlantCard.tsx
import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import FastImage from 'react-native-fast-image';

interface PlantCardProps {
  plant: Plant;
  onPress: (id: string) => void;
}

// Memoize expensive computed values
const useWateringStatus = (lastWateredAt: Date, frequency: number) => {
  return useMemo(() => {
    const daysSinceWatering = Math.floor(
      (Date.now() - lastWateredAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return {
      needsWater: daysSinceWatering >= frequency,
      daysUntilWater: Math.max(0, frequency - daysSinceWatering),
      isOverdue: daysSinceWatering > frequency + 2,
    };
  }, [lastWateredAt, frequency]);
};

// Optimize with memo and careful prop comparison
export const OptimizedPlantCard = memo<PlantCardProps>(
  ({ plant, onPress }) => {
    const wateringStatus = useWateringStatus(
      plant.lastWateredAt,
      plant.careSettings.wateringFrequency
    );
    
    // Memoize callbacks to prevent re-renders
    const handlePress = useCallback(() => {
      onPress(plant.id);
    }, [plant.id, onPress]);
    
    return (
      <Pressable onPress={handlePress} style={styles.container}>
        {/* Use FastImage for better performance */}
        <FastImage
          source={{
            uri: plant.imageUrl,
            priority: FastImage.priority.normal,
            cache: FastImage.cacheControl.immutable,
          }}
          style={styles.image}
          resizeMode={FastImage.resizeMode.cover}
        />
        
        {/* Avoid inline styles and functions */}
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {plant.name}
          </Text>
          
          {wateringStatus.needsWater && (
            <View style={wateringStatus.isOverdue ? styles.overdueIcon : styles.waterIcon}>
              <Text>💧</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  },
  // Custom comparison function for memo
  (prevProps, nextProps) => {
    return (
      prevProps.plant.id === nextProps.plant.id &&
      prevProps.plant.lastWateredAt === nextProps.plant.lastWateredAt &&
      prevProps.plant.health === nextProps.plant.health
    );
  }
);

OptimizedPlantCard.displayName = 'OptimizedPlantCard';
```

#### List Performance
```typescript
// components/OptimizedPlantList.tsx
import React, { useCallback, useMemo } from 'react';
import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';

export const OptimizedPlantList: React.FC<{ plants: Plant[] }> = ({ plants }) => {
  // Memoize item layout for better performance
  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );
  
  // Optimize keyExtractor
  const keyExtractor = useCallback((item: Plant) => item.id, []);
  
  // Memoize render item
  const renderItem = useCallback(
    ({ item }: { item: Plant }) => <OptimizedPlantCard plant={item} />,
    []
  );
  
  // Use estimated item size for FlashList
  const estimatedItemSize = useMemo(() => {
    return ITEM_HEIGHT + ITEM_SPACING;
  }, []);
  
  return (
    <FlashList
      data={plants}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={estimatedItemSize}
      getItemLayout={getItemLayout}
      
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
      
      // Reduce memory usage
      drawDistance={200}
      
      // Item separator
      ItemSeparatorComponent={ItemSeparator}
      
      // Optimize scrolling
      scrollEventThrottle={16}
      decelerationRate="fast"
      
      // Maintain position on data updates
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      }}
    />
  );
};

const ItemSeparator = () => <View style={{ height: ITEM_SPACING }} />;
```

#### Animation Performance
```typescript
// utils/animationHelpers.ts
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  runOnUI,
} from 'react-native-reanimated';

export const useOptimizedAnimation = () => {
  const animatedValue = useSharedValue(0);
  
  // Run animations on UI thread
  const startAnimation = useCallback(() => {
    'worklet';
    animatedValue.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
      mass: 1,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    });
  }, []);
  
  // Optimize style calculations
  const animatedStyle = useAnimatedStyle(() => {
    // Perform calculations on UI thread
    const scale = interpolate(
      animatedValue.value,
      [0, 0.5, 1],
      [1