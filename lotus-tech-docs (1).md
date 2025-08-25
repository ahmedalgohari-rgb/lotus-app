```

---

## Testing Strategy

### Testing Stack
```yaml
unit_testing:
  - framework: Jest
  - utilities: React Native Testing Library
  - mocking: MSW (Mock Service Worker)
  
integration_testing:
  - api: Supertest
  - database: Test containers
  
e2e_testing:
  - framework: Detox
  - platforms: iOS Simulator, Android Emulator
  
coverage:
  - target: 80% minimum
  - critical_paths: 95% minimum
```

### Unit Test Example
```typescript
// components/plant/PlantCard/PlantCard.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { PlantCard } from './PlantCard';
import { mockPlant } from '@test/fixtures';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('PlantCard', () => {
  it('should render plant information correctly', () => {
    const { getByText } = render(
      <PlantCard plant={mockPlant} />,
      { wrapper: createWrapper() }
    );
    
    expect(getByText(mockPlant.name)).toBeTruthy();
    expect(getByText(mockPlant.scientificName)).toBeTruthy();
  });
  
  it('should handle press events', async () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <PlantCard plant={mockPlant} onPress={onPress} />,
      { wrapper: createWrapper() }
    );
    
    fireEvent.press(getByTestId('plant-card'));
    
    await waitFor(() => {
      expect(onPress).toHaveBeenCalledWith(mockPlant);
    });
  });
  
  it('should display health indicator based on plant health', () => {
    const { getByTestId } = render(
      <PlantCard plant={{ ...mockPlant, health: 'critical' }} />,
      { wrapper: createWrapper() }
    );
    
    const indicator = getByTestId('health-indicator');
    expect(indicator.props.style).toContainEqual(
      expect.objectContaining({ backgroundColor: '#F44336' })
    );
  });
});
```

### API Integration Test
```typescript
// tests/api/plants.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/database';

describe('Plants API', () => {
  let authToken: string;
  let userId: string;
  
  beforeAll(async () => {
    // Setup test user and get auth token
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
      });
    
    authToken = response.body.data.token;
    userId = response.body.data.user.id;
  });
  
  afterAll(async () => {
    // Cleanup
    await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });
  
  describe('POST /api/plants', () => {
    it('should create a new plant', async () => {
      const response = await request(app)
        .post('/api/plants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Plant',
          scientificName: 'Testus plantus',
          imageUrl: 'https://example.com/plant.jpg',
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'Test Plant',
        scientificName: 'Testus plantus',
      });
    });
    
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/plants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

### E2E Test Example
```typescript
// e2e/flows/addPlant.test.ts
import { device, element, by, expect } from 'detox';

describe('Add Plant Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    await device.setURLBlacklist(['.*api.mixpanel.com.*']);
  });
  
  beforeEach(async () => {
    await device.reloadReactNative();
  });
  
  it('should complete plant identification flow', async () => {
    // Navigate to camera
    await element(by.id('tab-camera')).tap();
    
    // Grant camera permission if needed
    await device.setPermissions({ camera: 'YES', photos: 'YES' });
    
    // Take photo (mock in test environment)
    await element(by.id('capture-button')).tap();
    
    // Wait for identification
    await waitFor(element(by.id('identification-result')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Verify plant identified
    await expect(element(by.text('We found it!'))).toBeVisible();
    
    // Add to garden
    await element(by.id('add-to-garden-button')).tap();
    
    // Verify navigation to home
    await expect(element(by.id('home-screen'))).toBeVisible();
    
    // Verify plant added
    await expect(element(by.id('plant-card-0'))).toBeVisible();
  });
});
```

---

## Performance Guidelines

### Mobile Performance Optimization
```typescript
// Lazy loading screens
const HomeScreen = lazy(() => import('@screens/Home'));
const PlantDetailScreen = lazy(() => import('@screens/PlantDetail'));

// Image optimization
import FastImage from 'react-native-fast-image';

export const OptimizedImage: FC<{ uri: string }> = ({ uri }) => (
  <FastImage
    source={{
      uri,
      priority: FastImage.priority.normal,
      cache: FastImage.cacheControl.immutable,
    }}
    resizeMode={FastImage.resizeMode.cover}
  />
);

// List optimization
import { FlashList } from '@shopify/flash-list';

export const PlantList: FC = () => {
  const { data: plants } = usePlants();
  
  return (
    <FlashList
      data={plants}
      renderItem={({ item }) => <PlantCard plant={item} />}
      estimatedItemSize={200}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
    />
  );
};
```

### API Performance
```typescript
// Response caching
app.get('/api/plants', 
  cache('5 minutes'),
  async (req, res) => {
    // Handler
  }
);

// Database query optimization
const plants = await prisma.plant.findMany({
  where: { userId },
  include: {
    careLog: {
      take: 1,
      orderBy: { createdAt: 'desc' },
    },
  },
  orderBy: { createdAt: 'desc' },
});

// Pagination
const getPaginatedPlants = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  
  const [plants, total] = await Promise.all([
    prisma.plant.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.plant.count(),
  ]);
  
  return {
    data: plants,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
```

### Bundle Size Optimization
```javascript
// metro.config.js
module.exports = {
  transformer: {
    minifierPath: 'metro-minify-terser',
    minifierConfig: {
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
      compress: {
        drop_console: true,
      },
    },
  },
};

// babel.config.js
module.exports = {
  plugins: [
    ['transform-remove-console', { exclude: ['error', 'warn'] }],
    'lodash',
  ],
};
```

---

## Security Implementation

### Authentication Flow
```typescript
// middleware/auth.middleware.ts
import jwt from 'jsonwebtoken';

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token required',
      },
    });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = await getUserById(payload.userId);
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token expired',
        },
      });
    }
    
    return res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid access token',
      },
    });
  }
};
```

### Input Validation
```typescript
// validators/plant.validator.ts
import { z } from 'zod';

export const createPlantSchema = z.object({
  name: z.string().min(1).max(100),
  scientificName: z.string().optional(),
  imageUrl: z.string().url().optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  careSettings: z.object({
    wateringFrequency: z.number().min(1).max(365),
    sunlightRequirement: z.enum(['full', 'partial', 'shade']),
    soilType: z.string().optional(),
  }).optional(),
});

export type CreatePlantDto = z.infer<typeof createPlantSchema>;

// Usage in controller
export const createPlant = async (req: Request, res: Response) => {
  try {
    const validatedData = createPlantSchema.parse(req.body);
    const plant = await plantService.create(validatedData);
    
    res.status(201).json({
      success: true,
      data: plant,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        },
      });
    }
    throw error;
  }
};
```

### Secure Storage (Mobile)
```typescript
// services/storage/secureStorage.ts
import * as Keychain from 'react-native-keychain';
import CryptoJS from 'crypto-js';

class SecureStorage {
  private readonly serviceName = 'com.lotus.app';
  
  async setItem(key: string, value: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        this.serviceName,
        key,
        value
      );
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
      throw error;
    }
  }
  
  async getItem(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(
        this.serviceName
      );
      
      if (credentials && credentials.username === key) {
        return credentials.password;
      }
      
      return null;
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return null;
    }
  }
  
  async removeItem(key: string): Promise<void> {
    try {
      await Keychain.resetInternetCredentials(this.serviceName);
    } catch (error) {
      console.error('SecureStorage removeItem error:', error);
    }
  }
  
  // Encrypt sensitive data
  encrypt(text: string, key: string): string {
    return CryptoJS.AES.encrypt(text, key).toString();
  }
  
  decrypt(ciphertext: string, key: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}

export const secureStorage = new SecureStorage();
```

---

## Deployment & CI/CD

### GitHub Actions Workflow
```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  build-android:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Android release
        run: |
          cd android
          ./gradlew assembleRelease
        env:
          RELEASE_KEYSTORE: ${{ secrets.ANDROID_KEYSTORE }}
          RELEASE_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          RELEASE_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
      
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-release.apk
          path: android/app/build/outputs/apk/release/app-release.apk

  build-ios:
    needs: test
    runs-on: macos-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          npm ci
          cd ios && pod install
      
      - name: Build iOS release
        run: |
          cd ios
          xcodebuild -workspace LotusApp.xcworkspace \
            -scheme LotusApp \
            -configuration Release \
            -archivePath build/LotusApp.xcarchive \
            archive
      
      - name: Export IPA
        run: |
          cd ios
          xcodebuild -exportArchive \
            -archivePath build/LotusApp.xcarchive \
            -exportPath build \
            -exportOptionsPlist ExportOptions.plist

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: me-south-1
      
      - name: Build Docker image
        run: |
          docker build -t lotus-backend .
          docker tag lotus-backend:latest ${{ secrets.ECR_REGISTRY }}/lotus-backend:latest
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}
          docker push ${{ secrets.ECR_REGISTRY }}/lotus-backend:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster lotus-cluster \
            --service lotus-backend-service \
            --force-new-deployment
```

### Docker Configuration
```dockerfile
# Dockerfile (Backend)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production
RUN npx prisma generate

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

---

## Monitoring & Observability

### Logging Strategy
```typescript
// utils/logger.ts
import winston from 'winston';
import * as Sentry from '@sentry/node';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

// Sentry integration
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

export { logger, Sentry };
```

### Performance Monitoring
```typescript
// Mobile performance tracking
import analytics from '@react-native-firebase/analytics';
import performance from '@react-native-firebase/perf';

export const trackScreenView = async (screenName: string) => {
  await analytics().logScreenView({
    screen_name: screenName,
    screen_class: screenName,
  });
};

export const trackAPICall = async (
  url: string,
  method: string,
  responseTime: number
) => {
  const metric = await performance().newHttpMetric(url, method);
  metric.setResponseTime(responseTime);
  await metric.stop();
};
```

---

## Documentation Standards

### Code Documentation
```typescript
/**
 * Identifies a plant species from an uploaded image
 * @param imageUri - Local URI of the plant image
 * @param metadata - Optional metadata about the image
 * @returns Promise<PlantIdentification> - Identified plant with confidence score
 * @throws {PlantNotIdentifiedError} When confidence is below threshold
 * @example
 * const result = await identifyPlant('file://path/to/image.jpg', {
 *   location: { latitude: 30.0444, longitude: 31.2357 }
 * });
 */
export async function identifyPlant(
  imageUri: string,
  metadata?: ImageMetadata
): Promise<PlantIdentification> {
  // Implementation
}
```

### API Documentation (OpenAPI)
```yaml
openapi: 3.0.0
info:
  title: Lotus Plant Care API
  version: 1.0.0
  description: API for plant identification and care management

paths:
  /api/plants/identify:
    post:
      summary: Identify plant from image
      tags: [Plants]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                image:
                  type: string
                  format: binary
                metadata:
                  type: object
                  properties:
                    location:
                      $ref: '#/components/schemas/Location'
      responses:
        200:
          description: Plant identified successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PlantIdentification'
```

---

## Version Control Strategy

### Git Workflow
```bash
# Branch naming convention
feature/JIRA-123-plant-identification
bugfix/JIRA-456-camera-crash
hotfix/JIRA-789-api-timeout
release/v1.2.0

# Commit message format
feat: add plant identification feature
fix: resolve camera crash on Android 12
docs: update API documentation
refactor: optimize image processing
test: add unit tests for plant service
chore: update dependencies
```

### Release Process
```bash
# Version bumping (semantic versioning)
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.1 -> 1.1.0
npm version major  # 1.1.0 -> 2.0.0

# Tag and release
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0
```

---

*Document Version: 1.0.0*
*Last Updated: Development Phase*
*Next Review: Post-Sprint 1*# 🌿 Lotus App - Technical Documentation
*Complete technical specification for plant care application development*

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Development Environment Setup](#development-environment-setup)
4. [Project Structure](#project-structure)
5. [Core Libraries & Dependencies](#core-libraries--dependencies)
6. [Coding Standards & Practices](#coding-standards--practices)
7. [API Design](#api-design)
8. [State Management](#state-management)
9. [Component Architecture](#component-architecture)
10. [Testing Strategy](#testing-strategy)
11. [Performance Guidelines](#performance-guidelines)
12. [Security Implementation](#security-implementation)
13. [Deployment & CI/CD](#deployment--cicd)

---

## Architecture Overview

### System Architecture
```
┌─────────────────────────────────────────────────┐
│                Mobile Clients                    │
│  ┌─────────────┐         ┌─────────────┐       │
│  │   iOS App   │         │ Android App  │       │
│  │(React Native)│        │(React Native)│       │
│  └──────┬──────┘         └──────┬──────┘       │
└─────────┼────────────────────────┼──────────────┘
          │         HTTPS           │
          └───────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │      API Gateway          │
        │    (AWS API Gateway)      │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │    Application Server     │
        │      (Node.js/Express)    │
        └──┬──────────┬──────────┬──┘
           │          │          │
    ┌──────▼───┐ ┌───▼───┐ ┌───▼────┐
    │PostgreSQL│ │  S3   │ │ Redis  │
    │    DB    │ │Storage│ │ Cache  │
    └──────────┘ └───────┘ └────────┘
```

### Application Layers
```
Presentation Layer (React Native)
    ↓
Business Logic Layer (Custom Hooks/Services)
    ↓
Data Access Layer (API Client/Cache)
    ↓
Backend Services (REST API)
    ↓
Data Persistence (PostgreSQL/S3)
```

---

## Tech Stack

### Frontend (Mobile)
```yaml
framework: React Native
version: 0.74.x
language: TypeScript 5.x
state_management: Zustand + React Query
navigation: React Navigation v6
styling: StyleSheet + Reanimated 3
```

### Backend
```yaml
runtime: Node.js 20 LTS
framework: Express.js 4.x
language: TypeScript 5.x
orm: Prisma 5.x
validation: Zod
authentication: JWT + Refresh Tokens
```

### Infrastructure
```yaml
cloud_provider: AWS
hosting:
  - backend: AWS ECS (Fargate)
  - database: AWS RDS (PostgreSQL 15)
  - storage: AWS S3
  - cdn: CloudFront
  - cache: ElastiCache (Redis)
monitoring: CloudWatch + Sentry
```

### AI/ML Services
```yaml
plant_identification: 
  - primary: PlantNet API
  - fallback: Custom TensorFlow Lite model
  - confidence_threshold: 0.75
disease_detection:
  - service: Custom ML model
  - framework: TensorFlow.js
  - hosted: AWS Lambda
```

---

## Development Environment Setup

### Prerequisites
```bash
# Required versions
node >= 20.0.0
npm >= 10.0.0
java >= 17 (for Android)
cocoapods >= 1.15 (for iOS)
xcode >= 15.0 (for iOS)
android-studio >= 2024.1
```

### Initial Setup Script
```bash
#!/bin/bash
# setup.sh - Development environment setup

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# iOS setup
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "🍎 Setting up iOS..."
  cd ios && pod install && cd ..
fi

# Android setup
echo "🤖 Setting up Android..."
cd android && ./gradlew clean && cd ..

# Environment configuration
echo "⚙️ Setting up environment..."
cp .env.example .env.local

# Git hooks
echo "🪝 Installing git hooks..."
npx husky install

# Database setup (if running locally)
echo "💾 Setting up database..."
npm run db:migrate
npm run db:seed

echo "✅ Setup complete! Run 'npm start' to begin."
```

### Environment Variables
```env
# .env.example
NODE_ENV=development
API_URL=http://localhost:3000
APP_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/lotus_dev

# AWS Services
AWS_REGION=me-south-1
S3_BUCKET=lotus-app-assets
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# Third-party APIs
PLANTNET_API_KEY=xxx
OPENWEATHER_API_KEY=xxx

# Authentication
JWT_SECRET=xxx
JWT_REFRESH_SECRET=xxx
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Monitoring
SENTRY_DSN=xxx
ANALYTICS_KEY=xxx

# Feature Flags
ENABLE_PLANT_DOCTOR=true
ENABLE_COMMUNITY=false
ENABLE_PREMIUM=false
```

---

## Project Structure

### Frontend (React Native)
```
lotus-mobile/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.styles.ts
│   │   │   │   ├── Button.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Card/
│   │   │   ├── Input/
│   │   │   └── Typography/
│   │   ├── plant/
│   │   │   ├── PlantCard/
│   │   │   ├── PlantIdentifier/
│   │   │   └── PlantHealthIndicator/
│   │   └── layout/
│   │       ├── Header/
│   │       ├── TabBar/
│   │       └── SafeArea/
│   ├── screens/              # Screen components
│   │   ├── Home/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── HomeScreen.styles.ts
│   │   │   ├── HomeScreen.hooks.ts
│   │   │   └── HomeScreen.test.tsx
│   │   ├── Camera/
│   │   ├── PlantDetail/
│   │   ├── PlantDoctor/
│   │   └── Settings/
│   ├── navigation/           # Navigation configuration
│   │   ├── RootNavigator.tsx
│   │   ├── TabNavigator.tsx
│   │   ├── types.ts
│   │   └── linking.ts
│   ├── services/             # API and external services
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── plants.ts
│   │   │   ├── auth.ts
│   │   │   └── types.ts
│   │   ├── storage/
│   │   │   ├── secureStorage.ts
│   │   │   └── asyncStorage.ts
│   │   └── analytics/
│   ├── hooks/                # Custom React hooks
│   │   ├── usePlants.ts
│   │   ├── useAuth.ts
│   │   ├── useCamera.ts
│   │   └── useNotifications.ts
│   ├── store/                # State management
│   │   ├── auth.store.ts
│   │   ├── plants.store.ts
│   │   ├── ui.store.ts
│   │   └── types.ts
│   ├── utils/                # Utility functions
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── platform.ts
│   ├── constants/            # App constants
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   └── config.ts
│   ├── localization/         # i18n
│   │   ├── i18n.ts
│   │   ├── ar/
│   │   └── en/
│   └── types/                # TypeScript types
│       ├── models.ts
│       ├── api.ts
│       └── navigation.ts
├── assets/                    # Static assets
├── android/                   # Android-specific code
├── ios/                       # iOS-specific code
├── __tests__/                # Test files
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── jest.config.js
└── package.json
```

### Backend (Node.js)
```
lotus-backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── plants.controller.ts
│   │   └── health.controller.ts
│   ├── services/             # Business logic
│   │   ├── auth.service.ts
│   │   ├── plant.service.ts
│   │   ├── identification.service.ts
│   │   └── notification.service.ts
│   ├── models/               # Data models
│   │   ├── user.model.ts
│   │   ├── plant.model.ts
│   │   └── care-log.model.ts
│   ├── routes/               # API routes
│   │   ├── auth.routes.ts
│   │   ├── plants.routes.ts
│   │   └── index.ts
│   ├── middleware/           # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── rateLimit.middleware.ts
│   ├── utils/                # Utilities
│   │   ├── logger.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   ├── config/               # Configuration
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── aws.ts
│   ├── jobs/                 # Background jobs
│   │   ├── notifications.job.ts
│   │   └── cleanup.job.ts
│   └── app.ts               # Express app setup
├── prisma/                   # Database schema
│   ├── schema.prisma
│   └── migrations/
├── tests/                    # Test files
├── .env.example
├── .eslintrc.js
├── tsconfig.json
└── package.json
```

---

## Core Libraries & Dependencies

### Frontend Dependencies
```json
{
  "dependencies": {
    // Core
    "react": "18.2.0",
    "react-native": "0.74.0",
    
    // Navigation
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-navigation/stack": "^6.3.0",
    
    // State Management
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.0.0",
    
    // UI & Animation
    "react-native-reanimated": "^3.8.0",
    "react-native-gesture-handler": "^2.15.0",
    "react-native-svg": "^15.0.0",
    "lottie-react-native": "^6.5.0",
    
    // Camera & Images
    "react-native-vision-camera": "^3.9.0",
    "react-native-fast-image": "^8.6.0",
    "react-native-image-crop-picker": "^0.40.0",
    
    // Storage
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-keychain": "^8.1.0",
    
    // Utilities
    "react-native-config": "^1.5.0",
    "react-native-device-info": "^10.12.0",
    "react-native-permissions": "^4.1.0",
    
    // Forms & Validation
    "react-hook-form": "^7.50.0",
    "zod": "^3.22.0",
    
    // Localization
    "react-i18next": "^14.0.0",
    "i18next": "^23.8.0",
    
    // Analytics & Monitoring
    "@sentry/react-native": "^5.19.0",
    "react-native-mixpanel": "^2.3.0",
    
    // Networking
    "axios": "^1.6.0",
    "socket.io-client": "^4.7.0"
  },
  "devDependencies": {
    // TypeScript
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.73.0",
    
    // Testing
    "@testing-library/react-native": "^12.4.0",
    "jest": "^29.7.0",
    "detox": "^20.18.0",
    
    // Linting & Formatting
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "prettier": "^3.2.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.2.0",
    
    // Development Tools
    "react-native-flipper": "^0.212.0",
    "reactotron-react-native": "^5.1.0"
  }
}
```

### Backend Dependencies
```json
{
  "dependencies": {
    // Core
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    
    // Database
    "@prisma/client": "^5.9.0",
    "redis": "^4.6.0",
    
    // Authentication
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    
    // Validation
    "zod": "^3.22.0",
    "express-validator": "^7.0.0",
    
    // File Processing
    "multer": "^1.4.5",
    "sharp": "^0.33.0",
    
    // AWS SDK
    "@aws-sdk/client-s3": "^3.500.0",
    "@aws-sdk/client-ses": "^3.500.0",
    
    // ML/AI
    "@tensorflow/tfjs-node": "^4.17.0",
    "axios": "^1.6.0",
    
    // Jobs & Scheduling
    "bull": "^4.12.0",
    "node-cron": "^3.0.3",
    
    // Monitoring
    "@sentry/node": "^7.99.0",
    "winston": "^3.11.0",
    "morgan": "^1.10.0",
    
    // Utilities
    "dotenv": "^16.4.0",
    "uuid": "^9.0.1",
    "date-fns": "^3.3.0"
  },
  "devDependencies": {
    // TypeScript
    "typescript": "^5.3.0",
    "@types/node": "^20.11.0",
    "@types/express": "^4.17.21",
    
    // Testing
    "jest": "^29.7.0",
    "supertest": "^6.3.4",
    "@types/jest": "^29.5.11",
    
    // Development
    "nodemon": "^3.0.3",
    "ts-node": "^10.9.2",
    "prisma": "^5.9.0",
    
    // Code Quality
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "prettier": "^3.2.0"
  }
}
```

---

## Coding Standards & Practices

### TypeScript Configuration
```typescript
// tsconfig.json (Mobile)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "jsx": "react-native",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": "./src",
    "paths": {
      "@components/*": ["components/*"],
      "@screens/*": ["screens/*"],
      "@services/*": ["services/*"],
      "@hooks/*": ["hooks/*"],
      "@utils/*": ["utils/*"],
      "@types/*": ["types/*"],
      "@constants/*": ["constants/*"]
    }
  }
}
```

### ESLint Rules
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    '@react-native-community',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  rules: {
    // TypeScript
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    
    // React
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // General
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Import sorting
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling'],
      'newlines-between': 'always',
      'alphabetize': { 'order': 'asc' }
    }]
  }
};
```

### Code Style Guide

#### Component Structure
```typescript
// PlantCard.tsx - Example component structure
import React, { FC, memo, useCallback } from 'react';
import { View, Text, Image, Pressable } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { PlantHealthIndicator } from '@components/plant';
import { usePlantActions } from '@hooks/usePlantActions';
import { Plant } from '@types/models';
import { formatDate } from '@utils/date';

import { styles } from './PlantCard.styles';

interface PlantCardProps {
  plant: Plant;
  onPress?: (plant: Plant) => void;
  testID?: string;
}

export const PlantCard: FC<PlantCardProps> = memo(({ 
  plant, 
  onPress,
  testID = 'plant-card'
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { waterPlant, isWatering } = usePlantActions(plant.id);
  
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(plant);
    } else {
      navigation.navigate('PlantDetail', { plantId: plant.id });
    }
  }, [plant, onPress, navigation]);
  
  const handleWaterPress = useCallback(async () => {
    try {
      await waterPlant();
    } catch (error) {
      console.error('Failed to water plant:', error);
    }
  }, [waterPlant]);
  
  return (
    <Pressable 
      style={styles.container}
      onPress={handlePress}
      testID={testID}
    >
      <Image 
        source={{ uri: plant.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      
      <PlantHealthIndicator 
        health={plant.health}
        style={styles.healthIndicator}
      />
      
      <View style={styles.content}>
        <Text style={styles.name}>{plant.name}</Text>
        <Text style={styles.scientificName}>{plant.scientificName}</Text>
        
        <Text style={styles.lastWatered}>
          {t('plant.lastWatered', { 
            date: formatDate(plant.lastWateredAt) 
          })}
        </Text>
        
        <Pressable 
          style={styles.waterButton}
          onPress={handleWaterPress}
          disabled={isWatering}
        >
          <Text style={styles.waterButtonText}>💧</Text>
        </Pressable>
      </View>
    </Pressable>
  );
});

PlantCard.displayName = 'PlantCard';
```

#### Service Layer Pattern
```typescript
// services/api/plants.ts
import { apiClient } from './client';
import { Plant, PlantCreateDto, PlantUpdateDto } from '@types/models';

export class PlantService {
  private readonly baseUrl = '/plants';
  
  async getAll(): Promise<Plant[]> {
    const response = await apiClient.get<Plant[]>(this.baseUrl);
    return response.data;
  }
  
  async getById(id: string): Promise<Plant> {
    const response = await apiClient.get<Plant>(`${this.baseUrl}/${id}`);
    return response.data;
  }
  
  async create(data: PlantCreateDto): Promise<Plant> {
    const response = await apiClient.post<Plant>(this.baseUrl, data);
    return response.data;
  }
  
  async update(id: string, data: PlantUpdateDto): Promise<Plant> {
    const response = await apiClient.patch<Plant>(
      `${this.baseUrl}/${id}`, 
      data
    );
    return response.data;
  }
  
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
  
  async identify(imageUri: string): Promise<Plant> {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'plant.jpg'
    } as any);
    
    const response = await apiClient.post<Plant>(
      `${this.baseUrl}/identify`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  }
}

export const plantService = new PlantService();
```

#### Custom Hook Pattern
```typescript
// hooks/usePlants.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { plantService } from '@services/api/plants';
import { Plant, PlantCreateDto } from '@types/models';

export const usePlants = () => {
  return useQuery({
    queryKey: ['plants'],
    queryFn: () => plantService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePlant = (id: string) => {
  return useQuery({
    queryKey: ['plants', id],
    queryFn: () => plantService.getById(id),
    enabled: !!id,
  });
};

export const useCreatePlant = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: PlantCreateDto) => plantService.create(data),
    onSuccess: (newPlant) => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      queryClient.setQueryData(['plants', newPlant.id], newPlant);
    },
  });
};

export const useIdentifyPlant = () => {
  return useMutation({
    mutationFn: (imageUri: string) => plantService.identify(imageUri),
  });
};
```

---

## API Design

### RESTful Endpoints
```yaml
# Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

# Plants
GET    /api/plants                 # Get user's plants
POST   /api/plants                 # Add new plant
GET    /api/plants/:id             # Get plant details
PATCH  /api/plants/:id             # Update plant
DELETE /api/plants/:id             # Remove plant
POST   /api/plants/identify        # Identify plant from image
GET    /api/plants/:id/care-logs   # Get care history

# Plant Care
POST   /api/plants/:id/water       # Log watering
POST   /api/plants/:id/fertilize   # Log fertilizing
POST   /api/plants/:id/prune       # Log pruning
POST   /api/plants/:id/diagnose    # Diagnose health issues

# User
GET    /api/users/profile
PATCH  /api/users/profile
POST   /api/users/upload-avatar
DELETE /api/users/account

# Notifications
GET    /api/notifications
PATCH  /api/notifications/:id/read
POST   /api/notifications/settings
```

### Request/Response Examples
```typescript
// POST /api/plants/identify
// Request
{
  "image": "base64_encoded_image_data",
  "metadata": {
    "location": {
      "latitude": 30.0444,
      "longitude": 31.2357
    },
    "capturedAt": "2024-01-15T10:30:00Z"
  }
}

// Response
{
  "success": true,
  "data": {
    "identifications": [
      {
        "scientificName": "Epipremnum aureum",
        "commonNames": {
          "en": "Money Plant",
          "ar": "نبات البوتس"
        },
        "confidence": 0.92,
        "careInfo": {
          "wateringFrequency": 5,
          "sunlightRequirement": "indirect",
          "temperatureRange": {
            "min": 18,
            "max": 30
          },
          "humidity": "moderate"
        }
      }
    ],
    "imageUrl": "https://cdn.lotus.app/plants/abc123.jpg"
  }
}
```

### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
  };
}

// Example
{
  "success": false,
  "error": {
    "code": "PLANT_NOT_FOUND",
    "message": "The requested plant could not be found",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/plants/xyz789"
  }
}
```

---

## State Management

### Zustand Store Structure
```typescript
// store/plants.store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { Plant } from '@types/models';

interface PlantsState {
  plants: Plant[];
  selectedPlant: Plant | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setPlants: (plants: Plant[]) => void;
  addPlant: (plant: Plant) => void;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  deletePlant: (id: string) => void;
  selectPlant: (plant: Plant | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePlantsStore = create<PlantsState>()(
  devtools(
    persist(
      (set) => ({
        plants: [],
        selectedPlant: null,
        isLoading: false,
        error: null,
        
        setPlants: (plants) => set({ plants }),
        
        addPlant: (plant) => 
          set((state) => ({ 
            plants: [...state.plants, plant] 
          })),
        
        updatePlant: (id, updates) =>
          set((state) => ({
            plants: state.plants.map((p) =>
              p.id === id ? { ...p, ...updates } : p
            ),
          })),
        
        deletePlant: (id) =>
          set((state) => ({
            plants: state.plants.filter((p) => p.id !== id),
          })),
        
        selectPlant: (plant) => set({ selectedPlant: plant }),
        
        setLoading: (isLoading) => set({ isLoading }),
        
        setError: (error) => set({ error }),
      }),
      {
        name: 'plants-storage',
        partialize: (state) => ({ plants: state.plants }),
      }
    )
  )
);
```

### React Query Configuration
```typescript
// utils/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
    },
  },
});
```

---

## Component Architecture

### Design System Implementation
```typescript
// constants/theme.ts
export const theme = {
  colors: {
    primary: '#2D5F3F',
    secondary: '#4A90A4',
    background: '#F7F3E9',
    surface: '#FFFFFF',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#9E9E9E',
      inverse: '#FFFFFF',
    },
  },
  
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  typography: {
    display: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '700' as const,
    },
    h1: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const,
    },
    h2: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
    },
  },
  
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 5,
    },
  },
};

// Type-safe theme hook
import { theme } from '@constants/theme';

export const useTheme = () => {
  return theme;
};
```

### Reusable Component Examples
```typescript
// components/common/Button/Button.tsx
import React, { FC } from 'react';
import { 
  Pressable, 
  Text, 
  ActivityIndicator, 
  PressableProps,
  ViewStyle,
  TextStyle 
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';

import { useTheme } from '@hooks/useTheme';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  style,
  textStyle,
  onPressIn,
  onPressOut,
  ...props
}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = (event: any) => {
    scale.value = withSpring(0.98);
    onPressIn?.(event);
  };
  
  const handlePressOut = (event: any) => {
    scale.value = withSpring(1);
    onPressOut?.(event);
  };
  
  const styles = getButtonStyles(theme, variant, size, fullWidth, disabled);
  
  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle, style]}
      disabled={disabled || loading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? '#FFFFFF' : theme.colors.primary} 
        />
      ) : (
        <Text style={[styles.text, textStyle]}>
          {children}
        </Text>
      )}
    </AnimatedPressable>
  );
};

const getButtonStyles = (
  theme: any, 
  variant: string, 
  size: string, 
  fullWidth: boolean,
  disabled: boolean
) => {
  // Style computation logic
  return {
    container: {
      // ... styles
    },
    text: {
      // ... styles
    }
  };
};