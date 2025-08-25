# 🌿 Lotus App - Technical Documentation
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
      refetchOn