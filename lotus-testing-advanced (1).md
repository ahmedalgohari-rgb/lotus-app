```

---

## Test Data Management

### Test Data Strategy
```yaml
test_data_principles:
  - Isolated: Each test has its own data
  - Repeatable: Same data produces same results
  - Realistic: Mirrors production data patterns
  - Compliant: Follows data privacy regulations
  - Versioned: Test data evolves with schema
```

### Test Data Factory
```typescript
// test/factories/plantFactory.ts
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import { Plant, PlantHealth, CareLog } from '@types/models';

export const plantFactory = Factory.define<Plant>(({ sequence, params }) => ({
  id: params.id || `plant-${sequence}`,
  userId: params.userId || 'test-user-id',
  name: params.name || faker.person.firstName() + "'s Plant",
  scientificName: params.scientificName || faker.science.unit().name,
  commonNames: params.commonNames || [
    faker.word.noun(),
    faker.word.noun(),
  ],
  imageUrl: params.imageUrl || faker.image.nature(),
  health: params.health || faker.helpers.arrayElement<PlantHealth>([
    'healthy',
    'warning',
    'critical',
  ]),
  location: params.location || {
    latitude: faker.location.latitude(),
    longitude: faker.location.longitude(),
  },
  careSettings: {
    wateringFrequency: faker.number.int({ min: 1, max: 14 }),
    sunlightRequirement: faker.helpers.arrayElement(['full', 'partial', 'shade']),
    temperatureRange: {
      min: faker.number.int({ min: 10, max: 20 }),
      max: faker.number.int({ min: 20, max: 35 }),
    },
    humidity: faker.helpers.arrayElement(['low', 'moderate', 'high']),
  },
  lastWateredAt: faker.date.recent({ days: 7 }),
  lastFertilizedAt: faker.date.recent({ days: 30 }),
  lastPrunedAt: faker.date.recent({ days: 60 }),
  addedAt: faker.date.past({ years: 1 }),
  notes: params.notes || faker.lorem.paragraph(),
  tags: faker.helpers.arrayElements(['indoor', 'outdoor', 'flowering', 'succulent'], 2),
}));

export const careLogFactory = Factory.define<CareLog>(({ sequence, params }) => ({
  id: params.id || `care-log-${sequence}`,
  plantId: params.plantId || `plant-${sequence}`,
  userId: params.userId || 'test-user-id',
  type: params.type || faker.helpers.arrayElement(['water', 'fertilize', 'prune', 'repot']),
  amount: params.amount || faker.number.int({ min: 50, max: 500 }),
  notes: params.notes || faker.lorem.sentence(),
  imageUrls: params.imageUrls || [],
  createdAt: params.createdAt || faker.date.recent({ days: 30 }),
}));

// Usage in tests
describe('Plant Service', () => {
  it('should handle bulk plant operations', () => {
    // Generate test data
    const plants = plantFactory.buildList(100, {
      userId: 'bulk-test-user',
      health: 'healthy',
    });
    
    // Test bulk operations
    const result = await plantService.bulkUpdate(plants);
    expect(result).toHaveLength(100);
  });
  
  it('should test with specific scenarios', () => {
    // Plant that needs water
    const thirstyPlant = plantFactory.build({
      lastWateredAt: new Date('2024-01-01'),
      careSettings: {
        wateringFrequency: 3, // Every 3 days
      },
    });
    
    expect(plantService.needsWater(thirstyPlant)).toBe(true);
  });
});
```

### Database Seeding
```typescript
// test/seeders/testSeeder.ts
import { PrismaClient } from '@prisma/client';
import { plantFactory, userFactory, careLogFactory } from '../factories';

export class TestSeeder {
  constructor(private prisma: PrismaClient) {}
  
  async seed(scenario: 'minimal' | 'standard' | 'stress'): Promise<void> {
    console.log(`🌱 Seeding database with ${scenario} dataset...`);
    
    switch (scenario) {
      case 'minimal':
        await this.seedMinimal();
        break;
      case 'standard':
        await this.seedStandard();
        break;
      case 'stress':
        await this.seedStress();
        break;
    }
    
    console.log('✅ Seeding complete');
  }
  
  private async seedMinimal(): Promise<void> {
    // Create 1 user with 3 plants
    const user = await this.prisma.user.create({
      data: userFactory.build({
        email: 'test@example.com',
        plants: {
          create: plantFactory.buildList(3),
        },
      }),
    });
    
    // Add some care logs
    for (const plant of user.plants) {
      await this.prisma.careLog.createMany({
        data: careLogFactory.buildList(5, { plantId: plant.id }),
      });
    }
  }
  
  private async seedStandard(): Promise<void> {
    // Create 10 users with 10 plants each
    const users = await Promise.all(
      Array.from({ length: 10 }, async (_, i) => {
        return this.prisma.user.create({
          data: userFactory.build({
            email: `user${i}@example.com`,
            plants: {
              create: plantFactory.buildList(10),
            },
          }),
        });
      })
    );
    
    // Add care logs and diagnoses
    for (const user of users) {
      for (const plant of user.plants) {
        await this.prisma.careLog.createMany({
          data: careLogFactory.buildList(20, { plantId: plant.id }),
        });
        
        // Add some diagnoses for sick plants
        if (plant.health !== 'healthy') {
          await this.prisma.diagnosis.create({
            data: diagnosisFactory.build({ plantId: plant.id }),
          });
        }
      }
    }
  }
  
  private async seedStress(): Promise<void> {
    // Create 1000 users with 50 plants each
    console.log('Creating stress test dataset (this may take a while)...');
    
    const batchSize = 100;
    for (let batch = 0; batch < 10; batch++) {
      const users = userFactory.buildList(batchSize);
      
      await this.prisma.user.createMany({ data: users });
      
      // Create plants in batches
      for (const user of users) {
        const plants = plantFactory.buildList(50, { userId: user.id });
        await this.prisma.plant.createMany({ data: plants });
        
        // Create care logs in batches
        const careLogs = plants.flatMap(plant =>
          careLogFactory.buildList(100, { plantId: plant.id })
        );
        
        await this.prisma.careLog.createMany({ data: careLogs });
      }
      
      console.log(`Batch ${batch + 1}/10 complete`);
    }
  }
  
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    // Delete in correct order to respect foreign keys
    await this.prisma.careLog.deleteMany();
    await this.prisma.diagnosis.deleteMany();
    await this.prisma.plant.deleteMany();
    await this.prisma.user.deleteMany();
    
    console.log('✅ Cleanup complete');
  }
}

// CLI tool for seeding
// Usage: npm run seed:test -- --scenario=standard
if (require.main === module) {
  const args = process.argv.slice(2);
  const scenario = args.find(arg => arg.startsWith('--scenario='))
    ?.split('=')[1] as 'minimal' | 'standard' | 'stress' || 'standard';
  
  const prisma = new PrismaClient();
  const seeder = new TestSeeder(prisma);
  
  seeder
    .seed(scenario)
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
```

### Test Data Privacy
```typescript
// test/utils/dataAnonymizer.ts
export class DataAnonymizer {
  private readonly faker = faker;
  
  anonymizeUser(user: User): User {
    return {
      ...user,
      email: this.anonymizeEmail(user.email),
      name: this.faker.person.fullName(),
      phone: this.faker.phone.number(),
      address: this.anonymizeAddress(user.address),
      // Keep structural data
      id: user.id,
      createdAt: user.createdAt,
      settings: user.settings,
    };
  }
  
  anonymizePlant(plant: Plant): Plant {
    return {
      ...plant,
      name: this.faker.word.noun() + ' Plant',
      notes: this.faker.lorem.paragraph(),
      location: this.anonymizeLocation(plant.location),
      // Keep botanical data
      scientificName: plant.scientificName,
      careSettings: plant.careSettings,
    };
  }
  
  private anonymizeEmail(email: string): string {
    const [, domain] = email.split('@');
    return `${this.faker.internet.userName()}@${domain}`;
  }
  
  private anonymizeLocation(location: Location): Location {
    // Anonymize to city level, not exact coordinates
    return {
      latitude: Math.round(location.latitude * 10) / 10,
      longitude: Math.round(location.longitude * 10) / 10,
      city: location.city,
      country: location.country,
    };
  }
  
  anonymizeProductionDump(dumpFile: string): void {
    // Process production database dump for testing
    const data = JSON.parse(fs.readFileSync(dumpFile, 'utf-8'));
    
    const anonymized = {
      users: data.users.map(u => this.anonymizeUser(u)),
      plants: data.plants.map(p => this.anonymizePlant(p)),
      careLogs: data.careLogs, // No PII in care logs
    };
    
    fs.writeFileSync(
      dumpFile.replace('.json', '.anonymized.json'),
      JSON.stringify(anonymized, null, 2)
    );
  }
}
```

---

## Continuous Testing

### CI/CD Test Pipeline
```yaml
# .github/workflows/continuous-testing.yml
name: Continuous Testing Pipeline

on:
  push:
    branches: [main, develop, 'release/*']
  pull_request:
    types: [opened, synchronize, reopened]
  schedule:
    - cron: '0 2 * * *' # Nightly regression tests

jobs:
  # Fast feedback tests (run on every commit)
  quick-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --prefer-offline
      
      - name: Lint code
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unit

  # Integration tests (run on PR)
  integration-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    if: github.event_name == 'pull_request'
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup database
        run: |
          npm run db:push
          npm run db:seed:test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: API tests
        run: npm run test:api

  # E2E tests (run on main branch)
  e2e-tests:
    strategy:
      matrix:
        platform: [ios, android]
        device: [phone, tablet]
    
    runs-on: macos-latest
    timeout-minutes: 45
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: |
          npm ci
          npx detox build --configuration ${{ matrix.platform }}.sim.release
      
      - name: Run E2E tests
        run: |
          npx detox test --configuration ${{ matrix.platform }}.sim.release \
            --device-name "${{ matrix.device }}" \
            --take-screenshots failing \
            --record-videos failing
      
      - name: Upload artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-artifacts-${{ matrix.platform }}-${{ matrix.device }}
          path: |
            artifacts/
            .detox/

  # Performance tests (nightly)
  performance-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    if: github.event.schedule == '0 2 * * *'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run load tests
        run: |
          k6 run performance/loadTest.js \
            --out influxdb=http://metrics.lotus-app.com/k6
        env:
          API_URL: ${{ secrets.STAGING_API_URL }}
      
      - name: Analyze results
        run: npm run perf:analyze
      
      - name: Comment on PR if regression
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '⚠️ Performance regression detected! Check the [performance report]()'
            })

  # Security tests (weekly)
  security-tests:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 3 * * 1'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run OWASP dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'lotus-app'
          path: '.'
          format: 'ALL'
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Run security tests
        run: npm run test:security
      
      - name: Upload security report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: security-report.html
```

### Test Monitoring Dashboard
```typescript
// monitoring/testDashboard.ts
interface TestMetrics {
  coverage: {
    unit: number;
    integration: number;
    e2e: number;
    overall: number;
  };
  execution: {
    duration: number;
    passRate: number;
    flakyTests: string[];
  };
  trends: {
    coverageHistory: DataPoint[];
    executionTimeHistory: DataPoint[];
    failureRateHistory: DataPoint[];
  };
}

export class TestMonitor {
  async collectMetrics(): Promise<TestMetrics> {
    const coverage = await this.getCoverageMetrics();
    const execution = await this.getExecutionMetrics();
    const trends = await this.getTrendData();
    
    return { coverage, execution, trends };
  }
  
  async detectFlakyTests(): Promise<string[]> {
    const testRuns = await this.getRecentTestRuns(100);
    const testResults = new Map<string, boolean[]>();
    
    for (const run of testRuns) {
      for (const test of run.tests) {
        if (!testResults.has(test.name)) {
          testResults.set(test.name, []);
        }
        testResults.get(test.name)!.push(test.passed);
      }
    }
    
    const flakyTests: string[] = [];
    
    for (const [testName, results] of testResults) {
      const passRate = results.filter(r => r).length / results.length;
      
      // Test is flaky if it passes between 10% and 90% of the time
      if (passRate > 0.1 && passRate < 0.9) {
        flakyTests.push(testName);
      }
    }
    
    return flakyTests;
  }
  
  async generateReport(): Promise<void> {
    const metrics = await this.collectMetrics();
    const report = {
      timestamp: new Date().toISOString(),
      ...metrics,
      recommendations: this.generateRecommendations(metrics),
    };
    
    // Send to monitoring service
    await this.sendToDatadog(report);
    
    // Generate HTML report
    await this.generateHTMLReport(report);
  }
}
```

---

## Bug Tracking & QA Process

### Bug Report Template
```markdown
<!-- .github/ISSUE_TEMPLATE/bug_report.md -->
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug, needs-triage
assignees: ''
---

## Bug Description
A clear and concise description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots/Videos
If applicable, add screenshots or videos.

## Environment
- App Version: [e.g., 1.2.0]
- Device: [e.g., iPhone 14 Pro]
- OS: [e.g., iOS 17.0]
- Language: [Arabic/English]

## Additional Context
Any other context about the problem.

## Logs
```
Paste any relevant logs here
```
# 🧪 Lotus App - Advanced Testing Strategy
*Performance, Security, Accessibility Testing & QA Process*

## Table of Contents
1. [Performance Testing](#performance-testing)
2. [Security Testing](#security-testing)
3. [Accessibility Testing](#accessibility-testing)
4. [Test Data Management](#test-data-management)
5. [Continuous Testing](#continuous-testing)
6. [Bug Tracking & QA Process](#bug-tracking--qa-process)

---

## Performance Testing

### Performance Testing Strategy
```yaml
performance_goals:
  app_launch: < 2 seconds
  screen_transition: < 300ms
  api_response: < 500ms (p95)
  image_load: < 1 second
  memory_usage: < 200MB
  battery_drain: < 5% per hour active use
  fps: 60fps (animations)
  crash_rate: < 0.1%
```

### Mobile Performance Testing

#### React Native Performance Profiling
```typescript
// performance/ProfilerComponent.tsx
import React, { Profiler, ProfilerOnRenderCallback } from 'react';
import { performanceReporter } from '@utils/performanceReporter';

const onRenderCallback: ProfilerOnRenderCallback = (
  id, // Component name
  phase, // "mount" or "update"
  actualDuration, // Time spent rendering
  baseDuration, // Estimated time without memoization
  startTime, // When rendering began
  commitTime, // When rendering committed
  interactions // Set of interactions
) => {
  performanceReporter.reportRenderMetrics({
    componentId: id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  });
  
  // Alert on slow renders
  if (actualDuration > 16.67) { // More than 1 frame at 60fps
    console.warn(`Slow render detected: ${id} took ${actualDuration}ms`);
  }
};

export const PerformanceProfiler: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
};
```

#### Memory Leak Detection
```typescript
// performance/memoryLeakDetector.ts
import { DeviceEventEmitter } from 'react-native';

class MemoryLeakDetector {
  private subscriptions: Set<any> = new Set();
  private timers: Set<NodeJS.Timeout> = new Set();
  private intervals: Set<NodeJS.Timeout> = new Set();
  
  startMonitoring(): void {
    if (__DEV__) {
      this.monitorEventListeners();
      this.monitorTimers();
      this.monitorAsyncOperations();
    }
  }
  
  private monitorEventListeners(): void {
    const originalAddListener = DeviceEventEmitter.addListener;
    const originalRemoveListener = DeviceEventEmitter.removeListener;
    
    DeviceEventEmitter.addListener = (...args) => {
      const subscription = originalAddListener.apply(DeviceEventEmitter, args);
      this.subscriptions.add(subscription);
      
      console.log(`Event listener added. Total: ${this.subscriptions.size}`);
      return subscription;
    };
    
    DeviceEventEmitter.removeListener = (...args) => {
      originalRemoveListener.apply(DeviceEventEmitter, args);
      console.log(`Event listener removed. Total: ${this.subscriptions.size}`);
    };
  }
  
  private monitorTimers(): void {
    const originalSetTimeout = global.setTimeout;
    const originalClearTimeout = global.clearTimeout;
    const originalSetInterval = global.setInterval;
    const originalClearInterval = global.clearInterval;
    
    global.setTimeout = ((callback: any, delay: number, ...args: any[]) => {
      const timer = originalSetTimeout(() => {
        this.timers.delete(timer);
        callback(...args);
      }, delay);
      
      this.timers.add(timer);
      return timer;
    }) as any;
    
    global.clearTimeout = ((timer: NodeJS.Timeout) => {
      this.timers.delete(timer);
      originalClearTimeout(timer);
    }) as any;
    
    // Similar implementation for setInterval/clearInterval
  }
  
  private monitorAsyncOperations(): void {
    const pendingPromises = new Set<Promise<any>>();
    
    const trackPromise = (promise: Promise<any>) => {
      pendingPromises.add(promise);
      promise.finally(() => pendingPromises.delete(promise));
      
      if (pendingPromises.size > 100) {
        console.warn(`High number of pending promises: ${pendingPromises.size}`);
      }
    };
    
    // Monkey-patch fetch to track network requests
    const originalFetch = global.fetch;
    global.fetch = (...args) => {
      const promise = originalFetch(...args);
      trackPromise(promise);
      return promise;
    };
  }
  
  generateReport(): MemoryReport {
    return {
      eventListeners: this.subscriptions.size,
      activeTimers: this.timers.size,
      activeIntervals: this.intervals.size,
      timestamp: new Date().toISOString(),
    };
  }
}

export const memoryLeakDetector = new MemoryLeakDetector();
```

#### Load Testing Script
```typescript
// performance/loadTest.k6.ts
import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export const plantIdentificationTime = new Trend('plant_identification_time');
export const errorRate = new Rate('errors');

export const options = {
  scenarios: {
    // Scenario 1: Regular load
    regular_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '10m',
    },
    // Scenario 2: Peak hours
    peak_hours: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '5m', target: 300 },
        { duration: '2m', target: 0 },
      ],
    },
    // Scenario 3: Stress test
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 500,
      stages: [
        { duration: '5m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '5m', target: 300 },
        { duration: '5m', target: 400 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    plant_identification_time: ['p(95)<3000'],
    errors: ['rate<0.05'], // 5% error rate threshold
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.API_URL || 'https://api.lotus-app.com';

export default function () {
  // Test plant identification endpoint (most resource-intensive)
  const startTime = Date.now();
  
  const identifyResponse = http.post(
    `${BASE_URL}/api/plants/identify`,
    JSON.stringify({
      image: generateMockImageBase64(),
      metadata: {
        location: { latitude: 30.0444, longitude: 31.2357 },
        capturedAt: new Date().toISOString(),
      },
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      timeout: '10s',
    }
  );
  
  const identificationTime = Date.now() - startTime;
  plantIdentificationTime.add(identificationTime);
  
  const success = check(identifyResponse, {
    'status is 200': (r) => r.status === 200,
    'has identification result': (r) => r.json('data.identifications') !== undefined,
    'confidence above threshold': (r) => r.json('data.identifications.0.confidence') > 0.7,
    'response time < 3s': (r) => identificationTime < 3000,
  });
  
  errorRate.add(!success);
  
  // Simulate user browsing pattern
  sleep(randomBetween(1, 3));
  
  // Get user's plants
  const plantsResponse = http.get(`${BASE_URL}/api/plants`, {
    headers: { 'Authorization': `Bearer ${getAuthToken()}` },
  });
  
  check(plantsResponse, {
    'plants fetched': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(randomBetween(2, 5));
}

function generateMockImageBase64(): string {
  // Return a small base64 encoded image for testing
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
```

### Backend Performance Testing

#### Database Query Performance
```typescript
// performance/databasePerformance.test.ts
import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

describe('Database Performance', () => {
  let prisma: PrismaClient;
  
  beforeAll(() => {
    prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
      ],
    });
    
    prisma.$on('query', (e) => {
      if (e.duration > 100) {
        console.warn(`Slow query detected (${e.duration}ms): ${e.query}`);
      }
    });
  });
  
  describe('Query Optimization', () => {
    it('should fetch user plants efficiently', async () => {
      const userId = 'test-user-id';
      
      const start = performance.now();
      
      const plants = await prisma.plant.findMany({
        where: { userId },
        include: {
          careLog: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              type: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              careLog: true,
              diagnoses: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      expect(plants).toBeDefined();
    });
    
    it('should use indexes efficiently', async () => {
      // Test that indexes are being used
      const explain = await prisma.$queryRaw`
        EXPLAIN ANALYZE
        SELECT * FROM plants
        WHERE user_id = 'test-user-id'
        AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 20;
      `;
      
      // Check that index scan is being used
      expect(explain[0].QUERY_PLAN).toContain('Index Scan');
    });
  });
  
  describe('N+1 Query Prevention', () => {
    it('should avoid N+1 queries with proper includes', async () => {
      let queryCount = 0;
      
      prisma.$on('query', () => {
        queryCount++;
      });
      
      // This should result in a single query with joins
      await prisma.user.findUnique({
        where: { id: 'test-user-id' },
        include: {
          plants: {
            include: {
              careLog: {
                take: 1,
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });
      
      // Should be 1 query, not N+1
      expect(queryCount).toBe(1);
    });
  });
});
```

---

## Security Testing

### Security Test Suite
```typescript
// security/securityTests.ts
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '@/app';

describe('Security Tests', () => {
  describe('Authentication & Authorization', () => {
    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/api/plants')
        .expect(401);
      
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
    
    it('should reject expired tokens', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Expired token
      
      const response = await request(app)
        .get('/api/plants')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      
      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
    });
    
    it('should prevent access to other users resources', async () => {
      const userAToken = await getAuthToken('userA@test.com');
      const userBPlantId = 'plant-belonging-to-user-b';
      
      const response = await request(app)
        .delete(`/api/plants/${userBPlantId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(403);
      
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
    
    it('should rate limit authentication attempts', async () => {
      const email = 'test@example.com';
      
      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email, password: 'wrong-password' });
      }
      
      // Next attempt should be rate limited
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'correct-password' })
        .expect(429);
      
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
  
  describe('Input Validation & Sanitization', () => {
    it('should prevent SQL injection', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .post('/api/plants')
        .set('Authorization', `Bearer ${getValidToken()}`)
        .send({
          name: maliciousInput,
          scientificName: 'Test Plant',
        })
        .expect(400);
      
      // Should be caught by validation, not executed
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      
      // Verify users table still exists
      const usersExist = await checkTableExists('users');
      expect(usersExist).toBe(true);
    });
    
    it('should prevent XSS attacks', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      const response = await request(app)
        .post('/api/plants')
        .set('Authorization', `Bearer ${getValidToken()}`)
        .send({
          name: xssPayload,
          notes: '<img src=x onerror=alert("XSS")>',
        });
      
      if (response.status === 201) {
        // If created, verify it's sanitized
        expect(response.body.data.name).not.toContain('<script>');
        expect(response.body.data.notes).not.toContain('onerror');
      }
    });
    
    it('should validate file uploads', async () => {
      const maliciousFile = Buffer.from('<?php system($_GET["cmd"]); ?>');
      
      const response = await request(app)
        .post('/api/plants/identify')
        .set('Authorization', `Bearer ${getValidToken()}`)
        .attach('image', maliciousFile, 'malicious.php')
        .expect(400);
      
      expect(response.body.error.code).toBe('INVALID_FILE_TYPE');
    });
    
    it('should enforce file size limits', async () => {
      const largeFile = Buffer.alloc(50 * 1024 * 1024); // 50MB
      
      const response = await request(app)
        .post('/api/plants/identify')
        .set('Authorization', `Bearer ${getValidToken()}`)
        .attach('image', largeFile, 'large.jpg')
        .expect(413);
      
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');
    });
  });
  
  describe('OWASP Top 10 Vulnerabilities', () => {
    it('should prevent IDOR (Insecure Direct Object Reference)', async () => {
      const userToken = await getAuthToken('user@test.com');
      
      // Try to access admin endpoint with user token
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
      
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
    
    it('should have secure headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      // Check security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toContain('max-age=');
      expect(response.headers['content-security-policy']).toBeDefined();
    });
    
    it('should prevent XXE (XML External Entity) attacks', async () => {
      const xxePayload = `
        <?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE foo [
          <!ENTITY xxe SYSTEM "file:///etc/passwd">
        ]>
        <plant>
          <name>&xxe;</name>
        </plant>
      `;
      
      const response = await request(app)
        .post('/api/plants/import')
        .set('Authorization', `Bearer ${getValidToken()}`)
        .set('Content-Type', 'application/xml')
        .send(xxePayload)
        .expect(400);
      
      expect(response.body.error.code).toBe('INVALID_XML');
    });
  });
  
  describe('Cryptography & Secrets', () => {
    it('should not expose sensitive information in errors', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrong-password',
        })
        .expect(401);
      
      // Should not reveal if email exists
      expect(response.body.error.message).toBe('Invalid credentials');
      expect(response.body.error.message).not.toContain('User not found');
      expect(response.body.error.message).not.toContain('Password incorrect');
    });
    
    it('should hash passwords properly', async () => {
      // This would be tested in unit tests for the auth service
      const hashedPassword = await hashPassword('TestPassword123!');
      
      expect(hashedPassword).not.toBe('TestPassword123!');
      expect(hashedPassword.length).toBeGreaterThan(50);
      expect(hashedPassword).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt format
    });
    
    it('should not log sensitive data', async () => {
      const logSpy = jest.spyOn(console, 'log');
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
        });
      
      // Check that password wasn't logged
      const logs = logSpy.mock.calls.flat().join(' ');
      expect(logs).not.toContain('TestPassword123!');
      expect(logs).not.toContain('password');
      
      logSpy.mockRestore();
    });
  });
});
```

### Penetration Testing Checklist
```yaml
# security/pentest-checklist.yaml
penetration_testing:
  authentication:
    - [ ] Brute force protection
    - [ ] Password complexity requirements
    - [ ] Session management
    - [ ] JWT token security
    - [ ] Multi-factor authentication (if applicable)
    
  authorization:
    - [ ] Role-based access control
    - [ ] Resource ownership validation
    - [ ] Admin vs user separation
    - [ ] API endpoint permissions
    
  input_validation:
    - [ ] SQL injection prevention
    - [ ] NoSQL injection prevention
    - [ ] XSS prevention
    - [ ] XXE prevention
    - [ ] Command injection prevention
    - [ ] Path traversal prevention
    
  file_handling:
    - [ ] File type validation
    - [ ] File size limits
    - [ ] Malware scanning
    - [ ] Safe file storage
    - [ ] Image processing security
    
  api_security:
    - [ ] Rate limiting
    - [ ] API versioning
    - [ ] CORS configuration
    - [ ] GraphQL specific security (if used)
    
  mobile_specific:
    - [ ] Certificate pinning
    - [ ] Root/jailbreak detection
    - [ ] Secure storage
    - [ ] Code obfuscation
    - [ ] Anti-tampering measures
    
  infrastructure:
    - [ ] HTTPS enforcement
    - [ ] Security headers
    - [ ] DNS security
    - [ ] CDN security
    - [ ] Cloud configuration
```

---

## Accessibility Testing

### Accessibility Test Suite
```typescript
// accessibility/a11yTests.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  describe('Screen Reader Support', () => {
    it('should have accessible labels for all interactive elements', () => {
      const { getByLabelText, getAllByRole } = render(<HomeScreen />);
      
      // Check main navigation
      expect(getByLabelText('My Garden')).toBeTruthy();
      expect(getByLabelText('Camera')).toBeTruthy();
      expect(getByLabelText('Plant Doctor')).toBeTruthy();
      expect(getByLabelText('Settings')).toBeTruthy();
      
      // Check all buttons have labels
      const buttons = getAllByRole('button');
      buttons.forEach(button => {
        expect(button.props.accessibilityLabel).toBeTruthy();
      });
    });
    
    it('should provide meaningful hints for complex interactions', () => {
      const { getByTestId } = render(<PlantCard plant={mockPlant} />);
      
      const card = getByTestId('plant-card');
      expect(card.props.accessibilityHint).toBe(
        'Double tap to view plant details'
      );
      
      const waterButton = getByTestId('quick-water-button');
      expect(waterButton.props.accessibilityHint).toBe(
        'Double tap to water this plant'
      );
    });
    
    it('should announce state changes', () => {
      const { getByTestId } = render(<WaterButton plantId="123" />);
      
      const button = getByTestId('water-button');
      
      // Before watering
      expect(button.props.accessibilityValue).toEqual({
        text: 'Not watered today',
      });
      
      // Simulate watering
      fireEvent.press(button);
      
      // After watering
      waitFor(() => {
        expect(button.props.accessibilityValue).toEqual({
          text: 'Watered just now',
        });
      });
    });
  });
  
  describe('Arabic Accessibility', () => {
    it('should support RTL screen readers', () => {
      i18n.changeLanguage('ar');
      
      const { getByText, getByTestId } = render(<HomeScreen />);
      
      const header = getByTestId('screen-header');
      expect(header.props.style.direction).toBe('rtl');
      
      const arabicText = getByText('حديقتي');
      expect(arabicText.props.accessibilityLanguage).toBe('ar-EG');
    });
    
    it('should have Arabic accessibility labels', () => {
      i18n.changeLanguage('ar');
      
      const { getByLabelText } = render(<PlantCard plant={mockPlant} />);
      
      expect(getByLabelText('بطاقة النبات')).toBeTruthy();
      expect(getByLabelText('سقي النبات')).toBeTruthy();
      expect(getByLabelText('صحة النبات: جيدة')).toBeTruthy();
    });
  });
  
  describe('Visual Accessibility', () => {
    it('should meet color contrast requirements', () => {
      const { getByTestId } = render(<Button variant="primary">Test</Button>);
      
      const button = getByTestId('button');
      const backgroundColor = button.props.style.backgroundColor;
      const textColor = button.props.children[0].props.style.color;
      
      const contrastRatio = getContrastRatio(backgroundColor, textColor);
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5); // WCAG AA standard
    });
    
    it('should support high contrast mode', () => {
      AccessibilityInfo.isHighContrastEnabled = true;
      
      const { getByTestId } = render(<PlantCard plant={mockPlant} />);
      
      const card = getByTestId('plant-card');
      expect(card.props.style.borderWidth).toBe(2);
      expect(card.props.style.borderColor).toBe('#000000');
    });
    
    it('should scale text properly', async () => {
      const { getByText, rerender } = render(<HomeScreen />);
      
      // Normal text size
      let title = getByText('My Garden');
      expect(title.props.style.fontSize).toBe(24);
      
      // Simulate accessibility text scaling
      AccessibilityInfo.isBoldTextEnabled = true;
      Text.defaultProps = { ...Text.defaultProps, maxFontSizeMultiplier: 2 };
      
      rerender(<HomeScreen />);
      
      title = getByText('My Garden');
      expect(title.props.style.fontSize).toBeLessThanOrEqual(48); // Max 2x scaling
      expect(title.props.style.fontWeight).toBe('bold');
    });
  });
  
  describe('Gesture Accessibility', () => {
    it('should provide alternatives to complex gestures', () => {
      const { getByTestId, getByLabelText } = render(
        <PlantGallery plants={mockPlants} />
      );
      
      // Swipe gesture has button alternative
      const gallery = getByTestId('plant-gallery');
      expect(gallery.props.accessibilityRole).toBe('adjustable');
      
      // Alternative navigation buttons
      expect(getByLabelText('Previous plant')).toBeTruthy();
      expect(getByLabelText('Next plant')).toBeTruthy();
    });
    
    it('should have sufficient touch targets', () => {
      const { getAllByRole } = render(<HomeScreen />);
      
      const touchables = getAllByRole('button');
      touchables.forEach(touchable => {
        const { width, height } = touchable.props.style;
        expect(width).toBeGreaterThanOrEqual(44); // iOS minimum
        expect(height).toBeGreaterThanOrEqual(44);
      });
    });
  });
  
  describe('Focus Management', () => {
    it('should manage focus order correctly', () => {
      const { getByTestId } = render(<LoginScreen />);
      
      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');
      
      expect(emailInput.props.accessibilityElementsHidden).toBe(false);
      expect(passwordInput.props.accessibilityElementsHidden).toBe(false);
      expect(loginButton.props.accessibilityElementsHidden).toBe(false);
      
      // Tab order
      expect(emailInput.props.tabIndex).toBe(1);
      expect(passwordInput.props.tabIndex).toBe(2);
      expect(loginButton.props.tabIndex).toBe(3);
    });
    
    it('should trap focus in modals', () => {
      const { getByTestId } = render(<ConfirmDialog isOpen={true} />);
      
      const modal = getByTestId('modal');
      expect(modal.props.accessibilityViewIsModal).toBe(true);
      expect(modal.props.accessibilityLiveRegion).toBe('polite');
    });
  });
});
```

### Automated Accessibility Testing
```typescript
// accessibility/automatedA11y.ts
import { AccessibilityInfo, NativeModules } from 'react-native';

class AccessibilityAuditor {
  async auditScreen(screenName: string): Promise<A11yAuditResult> {
    const issues: A11yIssue[] = [];
    
    // Check for screen reader support
    const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    
    if (__DEV__ && !isScreenReaderEnabled) {
      console.warn('Testing without screen reader enabled');
    }
    
    // Get all elements on screen
    const elements = await this.getAllElements();
    
    for (const element of elements) {
      // Check for missing labels
      if (element.isInteractive && !element.accessibilityLabel) {
        issues.push({
          type: 'missing-label',
          severity: 'error',
          element: element.testID,
          message: 'Interactive element missing accessibility label',
        });
      }
      
      // Check touch target size
      if (element.isInteractive) {
        const { width, height } = element.bounds;
        if (width < 44 || height < 44) {
          issues.push({
            type: 'small-touch-target',
            severity: 'warning',
            element: element.testID,
            message: `Touch target too small: ${width}x${height}px`,
          });
        }
      }
      
      // Check color contrast
      if (element.hasText) {
        const contrastRatio = this.calculateContrast(
          element.textColor,
          element.backgroundColor
        );
        
        if (contrastRatio < 4.5) {
          issues.push({
            type: 'low-contrast',
            severity: 'error',
            element: element.testID,
            message: `Contrast ratio ${contrastRatio.toFixed(2)} below WCAG AA`,
          });
        }
      }
      
      // Check for proper roles
      if (element.isInteractive && !element.accessibilityRole) {
        issues.push({
          type: 'missing-role',
          severity: 'warning',
          element: element.testID,
          message: 'Element missing accessibility role',
        });
      }
    }
    
    return {
      screenName,
      passed: issues.length === 0,
      issues,
      timestamp: new Date().toISOString(),
    };
  }
  
  private calculateContrast(foreground: string, background: string): number {
    // WCAG contrast calculation implementation
    const l1 = this.getRelativeLuminance(foreground);
    const l2 = this.getRelativeLuminance(background);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  private getRelativeLuminance(color: string): number {
    // Convert hex to RGB and calculate relative luminance
    const rgb = this.hexToRgb(color);
    const [r, g, b] = rgb.map(val => {
      val = val / 255;
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
}

export const a11yAuditor = new AccessibilityAuditor();
            