# 🧪 Lotus App - Testing & Quality Assurance Guide
*Comprehensive testing strategy and implementation guidelines*

## Table of Contents
1. [Testing Philosophy](#testing-philosophy)
2. [Test Pyramid Strategy](#test-pyramid-strategy)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [E2E Testing](#e2e-testing)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)
8. [Accessibility Testing](#accessibility-testing)
9. [Test Data Management](#test-data-management)
10. [Continuous Testing](#continuous-testing)
11. [Bug Tracking & QA Process](#bug-tracking--qa-process)

---

## Testing Philosophy

### Core Principles
```yaml
principles:
  - Test behavior, not implementation
  - Write tests before fixing bugs
  - Maintain test independence
  - Keep tests simple and focused
  - Ensure deterministic results
  - Optimize for fast feedback
```

### Testing Mindset
- **Shift-left testing**: Test early in development cycle
- **Risk-based testing**: Focus on critical user paths
- **Continuous improvement**: Learn from production issues
- **Collaborative QA**: Developers and QA work together

---

## Test Pyramid Strategy

```
         /\
        /E2E\        (5%)  - Critical user journeys
       /------\
      /  API   \     (15%) - Service integration
     /----------\
    / Integration\   (25%) - Component integration
   /--------------\
  /   Unit Tests   \ (55%) - Business logic & utilities
 /------------------\
```

### Coverage Goals
```yaml
coverage_targets:
  overall: 80%
  critical_paths: 95%
  new_code: 90%
  
excluded_from_coverage:
  - "*.styles.ts"
  - "*.constants.ts"
  - "*.types.ts"
  - "index.ts files"
```

---

## Unit Testing

### React Native Component Testing
```typescript
// __tests__/components/PlantHealthIndicator.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@contexts/ThemeContext';

import { PlantHealthIndicator } from '@components/plant/PlantHealthIndicator';

describe('PlantHealthIndicator', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };
  
  describe('Visual States', () => {
    it('should display green indicator for healthy plants', () => {
      const { getByTestId } = renderWithTheme(
        <PlantHealthIndicator health="healthy" />
      );
      
      const indicator = getByTestId('health-indicator');
      const style = indicator.props.style;
      
      expect(style).toContainEqual(
        expect.objectContaining({ 
          backgroundColor: '#4CAF50' 
        })
      );
    });
    
    it('should display yellow indicator for plants needing attention', () => {
      const { getByTestId } = renderWithTheme(
        <PlantHealthIndicator health="warning" />
      );
      
      const indicator = getByTestId('health-indicator');
      expect(indicator.props.style).toContainEqual(
        expect.objectContaining({ 
          backgroundColor: '#FFC107' 
        })
      );
    });
    
    it('should pulse animation for critical health', () => {
      const { getByTestId } = renderWithTheme(
        <PlantHealthIndicator health="critical" animated />
      );
      
      const indicator = getByTestId('health-indicator-animated');
      expect(indicator).toBeTruthy();
    });
  });
  
  describe('Accessibility', () => {
    it('should have proper accessibility label', () => {
      const { getByLabelText } = renderWithTheme(
        <PlantHealthIndicator health="healthy" />
      );
      
      expect(getByLabelText('Plant health: Healthy')).toBeTruthy();
    });
    
    it('should have correct role for screen readers', () => {
      const { getByTestId } = renderWithTheme(
        <PlantHealthIndicator health="warning" />
      );
      
      const indicator = getByTestId('health-indicator');
      expect(indicator.props.accessibilityRole).toBe('image');
    });
  });
});
```

### Hook Testing
```typescript
// __tests__/hooks/usePlantWatering.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { usePlantWatering } from '@hooks/usePlantWatering';
import { plantService } from '@services/api/plants';

jest.mock('@services/api/plants');

describe('usePlantWatering', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  it('should water plant successfully', async () => {
    const mockPlant = { id: '1', lastWateredAt: new Date() };
    (plantService.waterPlant as jest.Mock).mockResolvedValue(mockPlant);
    
    const { result } = renderHook(
      () => usePlantWatering('1'),
      { wrapper }
    );
    
    act(() => {
      result.current.waterPlant();
    });
    
    await waitFor(() => {
      expect(result.current.isWatering).toBe(false);
    });
    
    expect(result.current.lastWateredAt).toEqual(mockPlant.lastWateredAt);
    expect(plantService.waterPlant).toHaveBeenCalledWith('1');
  });
  
  it('should handle watering errors gracefully', async () => {
    const error = new Error('Network error');
    (plantService.waterPlant as jest.Mock).mockRejectedValue(error);
    
    const { result } = renderHook(
      () => usePlantWatering('1'),
      { wrapper }
    );
    
    act(() => {
      result.current.waterPlant();
    });
    
    await waitFor(() => {
      expect(result.current.error).toEqual(error);
    });
    
    expect(result.current.isWatering).toBe(false);
  });
  
  it('should prevent double watering', async () => {
    const { result } = renderHook(
      () => usePlantWatering('1'),
      { wrapper }
    );
    
    act(() => {
      result.current.waterPlant();
      result.current.waterPlant(); // Second call
    });
    
    expect(plantService.waterPlant).toHaveBeenCalledTimes(1);
  });
});
```

### Service Testing
```typescript
// __tests__/services/plantIdentification.test.ts
import { plantIdentificationService } from '@services/plantIdentification';
import { mockAxios } from '@test/mocks/axios';

describe('PlantIdentificationService', () => {
  beforeEach(() => {
    mockAxios.reset();
  });
  
  describe('identifyPlant', () => {
    it('should identify plant with high confidence', async () => {
      const mockResponse = {
        results: [
          {
            species: {
              scientificName: 'Epipremnum aureum',
              commonNames: ['Money Plant', 'Pothos'],
            },
            score: 0.92,
          },
        ],
      };
      
      mockAxios.onPost('/identify').reply(200, mockResponse);
      
      const result = await plantIdentificationService.identify(
        'base64_image_data'
      );
      
      expect(result).toEqual({
        scientificName: 'Epipremnum aureum',
        commonNames: ['Money Plant', 'Pothos'],
        confidence: 0.92,
      });
    });
    
    it('should reject low confidence identifications', async () => {
      const mockResponse = {
        results: [
          {
            species: { scientificName: 'Unknown species' },
            score: 0.45,
          },
        ],
      };
      
      mockAxios.onPost('/identify').reply(200, mockResponse);
      
      await expect(
        plantIdentificationService.identify('base64_image_data')
      ).rejects.toThrow('Confidence too low for reliable identification');
    });
    
    it('should handle API errors', async () => {
      mockAxios.onPost('/identify').reply(500);
      
      await expect(
        plantIdentificationService.identify('base64_image_data')
      ).rejects.toThrow('Plant identification service unavailable');
    });
  });
});
```

### Snapshot Testing
```typescript
// __tests__/screens/PlantDetail.snapshot.test.tsx
import React from 'react';
import renderer from 'react-test-renderer';

import { PlantDetailScreen } from '@screens/PlantDetail';
import { mockPlant } from '@test/fixtures';

describe('PlantDetailScreen Snapshots', () => {
  it('should match snapshot for healthy plant', () => {
    const tree = renderer.create(
      <PlantDetailScreen 
        route={{ params: { plant: mockPlant } }} 
      />
    ).toJSON();
    
    expect(tree).toMatchSnapshot();
  });
  
  it('should match snapshot for plant needing water', () => {
    const thirstyPlant = {
      ...mockPlant,
      needsWater: true,
      lastWateredAt: new Date('2024-01-01'),
    };
    
    const tree = renderer.create(
      <PlantDetailScreen 
        route={{ params: { plant: thirstyPlant } }} 
      />
    ).toJSON();
    
    expect(tree).toMatchSnapshot();
  });
});
```

---

## Integration Testing

### API Integration Tests
```typescript
// __tests__/integration/plantCareFlow.test.ts
import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';

describe('Plant Care Flow Integration', () => {
  let authToken: string;
  let userId: string;
  let plantId: string;
  
  beforeAll(async () => {
    // Setup test user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
      });
    
    authToken = userResponse.body.data.token;
    userId = userResponse.body.data.user.id;
    
    // Create test plant
    const plantResponse = await request(app)
      .post('/api/plants')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Pothos',
        scientificName: 'Epipremnum aureum',
      });
    
    plantId = plantResponse.body.data.id;
  });
  
  afterAll(async () => {
    await prisma.plant.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await redis.flushdb();
    await prisma.$disconnect();
  });
  
  describe('Watering Flow', () => {
    it('should complete full watering cycle', async () => {
      // 1. Check plant needs water
      const statusResponse = await request(app)
        .get(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(statusResponse.body.data.needsWater).toBe(true);
      
      // 2. Water the plant
      const waterResponse = await request(app)
        .post(`/api/plants/${plantId}/water`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 200, // ml
          notes: 'Soil was dry',
        });
      
      expect(waterResponse.status).toBe(200);
      expect(waterResponse.body.success).toBe(true);
      
      // 3. Verify water logged
      const logsResponse = await request(app)
        .get(`/api/plants/${plantId}/care-logs`)
        .set('Authorization', `Bearer ${authToken}`);
      
      const waterLog = logsResponse.body.data.find(
        (log: any) => log.type === 'WATERING'
      );
      
      expect(waterLog).toBeDefined();
      expect(waterLog.amount).toBe(200);
      
      // 4. Check plant no longer needs water
      const updatedStatus = await request(app)
        .get(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(updatedStatus.body.data.needsWater).toBe(false);
      
      // 5. Verify notification scheduled
      const notifications = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);
      
      const waterReminder = notifications.body.data.find(
        (n: any) => n.type === 'WATER_REMINDER' && n.plantId === plantId
      );
      
      expect(waterReminder).toBeDefined();
      expect(new Date(waterReminder.scheduledFor)).toBeInstanceOf(Date);
    });
  });
  
  describe('Disease Detection Flow', () => {
    it('should diagnose and treat plant disease', async () => {
      // 1. Upload diseased plant photo
      const diagnosisResponse = await request(app)
        .post(`/api/plants/${plantId}/diagnose`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', '__tests__/fixtures/diseased-plant.jpg')
        .field('symptoms', 'yellow leaves, brown spots');
      
      expect(diagnosisResponse.status).toBe(200);
      expect(diagnosisResponse.body.data.issues).toBeInstanceOf(Array);
      
      const diagnosis = diagnosisResponse.body.data.issues[0];
      expect(diagnosis).toHaveProperty('condition');
      expect(diagnosis).toHaveProperty('confidence');
      expect(diagnosis).toHaveProperty('treatment');
      
      // 2. Apply treatment
      const treatmentResponse = await request(app)
        .post(`/api/plants/${plantId}/treatments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          diagnosisId: diagnosisResponse.body.data.id,
          treatmentApplied: diagnosis.treatment.id,
          notes: 'Applied fungicide as recommended',
        });
      
      expect(treatmentResponse.status).toBe(201);
      
      // 3. Schedule follow-up
      const followUpResponse = await request(app)
        .post(`/api/plants/${plantId}/follow-ups`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          diagnosisId: diagnosisResponse.body.data.id,
          scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      
      expect(followUpResponse.status).toBe(201);
    });
  });
});
```

### Database Integration Tests
```typescript
// __tests__/integration/database.test.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('Database Operations', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  
  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
  });
  
  describe('Transactions', () => {
    it('should rollback on failure', async () => {
      const createUser = jest.fn();
      const createPlant = jest.fn();
      
      createPlant.mockRejectedValue(new Error('Plant creation failed'));
      
      try {
        await prisma.$transaction(async (tx) => {
          await createUser();
          await createPlant(); // This will fail
        });
      } catch (error) {
        expect(error.message).toBe('Plant creation failed');
      }
      
      expect(createUser).toHaveBeenCalled();
      expect(createPlant).toHaveBeenCalled();
      // Verify rollback happened (user not created)
    });
  });
  
  describe('Cascading Deletes', () => {
    it('should delete related records', async () => {
      const testUserId = 'test-user-id';
      
      // Create user with plants
      await prisma.user.create({
        data: {
          id: testUserId,
          email: 'cascade@test.com',
          plants: {
            create: [
              { name: 'Plant 1' },
              { name: 'Plant 2' },
            ],
          },
        },
      });
      
      // Delete user
      await prisma.user.delete({
        where: { id: testUserId },
      });
      
      // Verify plants are also deleted
      const plants = await prisma.plant.findMany({
        where: { userId: testUserId },
      });
      
      expect(plants).toHaveLength(0);
    });
  });
});
```

---

## E2E Testing

### Detox Configuration
```javascript
// .detoxrc.js
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/LotusApp.app',
      build: 'xcodebuild -workspace ios/LotusApp.xcworkspace -scheme LotusApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8081],
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14 Pro',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_6_API_33',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
};
```

### Critical User Journey Tests
```typescript
// e2e/tests/criticalPaths.e2e.ts
import { by, device, element, expect, waitFor } from 'detox';

describe('Critical User Journeys', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', camera: 'YES', photos: 'YES' },
    });
  });
  
  beforeEach(async () => {
    await device.reloadReactNative();
  });
  
  describe('New User Onboarding', () => {
    it('should complete onboarding and add first plant', async () => {
      // Skip if already onboarded
      try {
        await waitFor(element(by.id('onboarding-welcome')))
          .toBeVisible()
          .withTimeout(2000);
      } catch {
        // Already onboarded, skip test
        return;
      }
      
      // Welcome screen
      await expect(element(by.id('onboarding-welcome'))).toBeVisible();
      await element(by.id('get-started-button')).tap();
      
      // Permission screen
      await expect(element(by.text('Camera Access'))).toBeVisible();
      await element(by.id('grant-permissions-button')).tap();
      
      // Location setup (Cairo)
      await expect(element(by.text('Set Your Location'))).toBeVisible();
      await element(by.id('location-input')).typeText('Cairo');
      await element(by.id('location-confirm')).tap();
      
      // Language preference
      await element(by.id('language-arabic')).tap();
      await element(by.id('continue-button')).tap();
      
      // Add first plant
      await expect(element(by.id('empty-garden'))).toBeVisible();
      await element(by.id('add-first-plant')).tap();
      
      // Camera screen
      await waitFor(element(by.id('camera-viewfinder')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Take photo
      await element(by.id('capture-button')).tap();
      
      // Wait for identification
      await waitFor(element(by.id('plant-identified')))
        .toBeVisible()
        .withTimeout(10000);
      
      // Confirm and add
      await element(by.id('add-to-garden')).tap();
      
      // Verify plant added
      await expect(element(by.id('plant-card-0'))).toBeVisible();
    });
  });
  
  describe('Daily Plant Care', () => {
    it('should water multiple plants', async () => {
      // Navigate to garden
      await element(by.id('tab-home')).tap();
      
      // Find plants needing water
      await waitFor(element(by.id('needs-water-badge')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Water first plant
      await element(by.id('plant-card-0')).tap();
      await element(by.id('water-button')).tap();
      
      // Confirm watering
      await element(by.id('confirm-water')).tap();
      
      // Verify water animation
      await expect(element(by.id('water-success-animation'))).toBeVisible();
      
      // Go back and water second plant
      await element(by.id('back-button')).tap();
      await element(by.id('plant-card-1')).tap();
      await element(by.id('water-button')).tap();
      await element(by.id('confirm-water')).tap();
      
      // Verify badges updated
      await element(by.id('back-button')).tap();
      await expect(element(by.id('needs-water-badge'))).not.toBeVisible();
    });
  });
  
  describe('Plant Health Check', () => {
    it('should diagnose sick plant', async () => {
      // Select sick plant
      await element(by.id('tab-home')).tap();
      await element(by.id('plant-card-sick')).tap();
      
      // Navigate to plant doctor
      await element(by.id('diagnose-button')).tap();
      
      // Take photo of problem
      await element(by.id('camera-button')).tap();
      await element(by.id('capture-button')).tap();
      
      // Add symptoms
      await element(by.id('symptoms-input')).typeText('Yellow leaves with brown spots');
      await element(by.id('submit-diagnosis')).tap();
      
      // Wait for diagnosis
      await waitFor(element(by.id('diagnosis-results')))
        .toBeVisible()
        .withTimeout(8000);
      
      // View treatment
      await element(by.id('view-treatment')).tap();
      await expect(element(by.text('Recommended Treatment'))).toBeVisible();
      
      // Mark as treated
      await element(by.id('mark-treated')).tap();
      await expect(element(by.id('treatment-success'))).toBeVisible();
    });
  });
});
```

### Visual Regression Testing
```typescript
// e2e/tests/visualRegression.e2e.ts
import { device, element, by } from 'detox';
import { takeScreenshot } from '../helpers/screenshot';

describe('Visual Regression Tests', () => {
  const screens = [
    { name: 'home', id: 'home-screen' },
    { name: 'plant-detail', id: 'plant-detail-screen' },
    { name: 'camera', id: 'camera-screen' },
    { name: 'settings', id: 'settings-screen' },
  ];
  
  beforeAll(async () => {
    await device.launchApp();
  });
  
  screens.forEach(({ name, id }) => {
    it(`should match ${name} screen appearance`, async () => {
      // Navigate to screen
      if (name !== 'home') {
        await element(by.id(`tab-${name.split('-')[0]}`)).tap();
      }
      
      await waitFor(element(by.id(id)))
        .toBeVisible()
        .withTimeout(5000);
      
      // Take screenshot
      const screenshot = await takeScreenshot(name);
      
      // Compare with baseline
      expect(screenshot).toMatchImageSnapshot({
        failureThreshold: 0.01,
        failureThresholdType: 'percent',
      });
    });
  });
  
  it('should match dark mode appearance', async () => {
    // Enable dark mode
    await element(by.id('tab-settings')).tap();
    await element(by.id('theme-toggle')).tap();
    
    // Take screenshots of key screens
    const darkScreenshots = ['home', 'plant-detail'];
    
    for (const screen of darkScreenshots) {
      await element(by.id(`tab-${screen.split('-')[0]}`)).tap();
      const screenshot = await takeScreenshot(`${screen}-dark`);
      expect(screenshot).toMatchImageSnapshot();
    }
  });
});
```

---

## Performance Testing

### Load Testing
```typescript
// performance/loadTest.ts
import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    errors: ['rate<0.1'],              // Error rate under 10%
  },
};

export default function () {
  const BASE_URL = 'https://api.lotus-app.com';
  
  // User login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'Test123!',
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.json('data.token') !== '',
  });
  
  errorRate.add(loginRes.status !== 200);
  
  const token = loginRes.json('data.token');
  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  
  // Get plants
  const plantsRes = http.get(`${BASE_URL}/api/plants`, params);
  check(plantsRes, {
    'plants fetched': (r) => r.status === 200,
    'has plants array': (r) => Array.isArray(r.json('data')),
  });
  
  // Simulate plant identification
  const identifyRes = http.post(
    `${BASE_URL}/api/plants/identify`,
    {
      image: 'base64_sample_image',
    },
    params
  );
  
  check(identifyRes, {
    'identification successful': (r) => r.status === 200,
    'confidence above threshold': (r) => r.json('data.confidence') > 0.7,
  });
  
  sleep(1);
}
```

### React Native Performance Monitoring
```typescript
// utils/performanceMonitor.ts
import { InteractionManager } from 'react-native';
import performance from 'react-native-performance';

class PerformanceMonitor {
  private metrics: Map<string, any> = new Map();
  
  measureScreenLoad(screenName: string): void {
    const startTime = performance.now();
    
    InteractionManager.runAfterInteractions(() => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      this.recordMetric(`screen_load_${screenName}`, loadTime);
      
      if (loadTime > 1000) {
        console.warn(`Slow screen load: ${screenName} took ${loadTime}ms`);
      }
    });
  }
  
  measureAPICall(endpoint: string, startTime: number): void {
    const duration = performance.now() - startTime;
    this.recordMetric(`api_call_${endpoint}`, duration);
    
    if (duration > 2000) {
      console.warn(`Slow API call: ${endpoint} took ${duration}ms`);
    }
  }
  
  measureImageLoad(imageUrl: string, startTime: number): void {
    const duration = performance.now() - startTime;
    this.recordMetric('image_load', duration);
  }
  
  measureMemoryUsage(): void {
    if (global.performance && global.performance.memory) {
      const memoryInfo = global.performance.memory;
      this.recordMetric('memory_usage', {
        usedJSHeapSize: memoryInfo.usedJSHeapSize,
        totalJSHeapSize: memoryInfo.totalJSHeapSize,
        limit: memoryInfo.jsHeapSizeLimit,
      });
    }
  }
  
  private recordMetric(name: string, value: any): void {
    this.metrics.set(name, {
      value,
      timestamp: new Date().toISOString(),
    });
    
    // Send to analytics
    this.sendToAnalytics(name, value);
  }
  
  private sendToAnalytics(metricName: string, value: any): void {
    // Implementation for sending to analytics service
  }
  
  getMetrics(): Map<string, any> {
    return this.metrics;
  }
  