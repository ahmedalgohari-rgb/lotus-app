# 🌿 Lotus PWA - Technical Stack & Architecture

## Quick Reference for Claude Code

This document provides the essential technical specifications for building the Lotus PWA. Use this when working with Claude Code to maintain consistency.

---


  ⎿  🌿 Lotus Plant Care App Development Plan

     Overview

     Transform the existing React web application into a React Native mobile app following the provided HTML mockup design and technical specifications.

     Phase 1: Architecture Setup (2-3 days)

     1.1 Project Structure Migration

     - Create React Native project structure following tech docs specifications
     - Set up TypeScript configuration with proper path aliases
     - Configure ESLint/Prettier with Arabic RTL support
     - Install core dependencies (React Navigation, Zustand, React Query, Reanimated)

     1.2 Design System Implementation

     - Create design tokens from HTML mockup (colors, typography, spacing)
     - Build reusable UI components (Button, Card, Input, Typography)
     - Implement Lotus color scheme and gradient system
     - Set up responsive design patterns for different screen sizes

     Phase 2: Core Navigation & Authentication (3-4 days)

     2.1 Navigation Structure

     - Implement React Navigation v6 with bottom tabs
     - Create stack navigators for each main flow
     - Set up deep linking and screen transitions
     - Add splash screen with auto-advance logic

     2.2 Authentication System

     - Integrate existing OAuth system (Google/Apple)
     - Implement guest mode functionality
     - Create onboarding flow (3 screens with dots navigation)
     - Add authentication state management with Zustand

     Phase 3: Plant Identification & Core Features (4-5 days)

     3.1 Camera Integration

     - Set up React Native Camera with custom overlay
     - Implement corner detection frame and capture functionality
     - Add camera permissions handling
     - Create image processing and upload system

     3.2 Plant Identification

     - Connect to existing PlantNet API integration
     - Create plant result screens with confidence ratings
     - Implement window direction ratings system
     - Add care requirements display with Arabic translations

     Phase 4: Plant Management System (3-4 days)

     4.1 My Plants Dashboard

     - Create plant grid layout with cards
     - Implement care task scheduling and reminders
     - Add plant detail views with care history
     - Create add plant form with location/direction selector

     4.2 Care System

     - Build care logging functionality (water, prune, feed)
     - Implement care schedule visualization
     - Create care history tracking
     - Add care reminders and notifications

     Phase 5: Mobile Optimization & Performance (2-3 days)

     5.1 Mobile-First Features

     - Implement proper touch gestures and animations
     - Add haptic feedback for interactions
     - Optimize images and loading states
     - Create offline functionality with local storage

     5.2 Arabic/English Localization

     - Set up i18next with Arabic RTL support
     - Implement language switching
     - Add Arabic fonts and proper text rendering
     - Create bilingual UI components

     Phase 6: Integration & Testing (2-3 days)

     6.1 Backend Integration

     - Connect to existing Express.js backend APIs
     - Implement proper error handling and offline support
     - Add data synchronization
     - Test all API endpoints

     6.2 Quality Assurance

     - Add unit tests for components and services
     - Implement E2E testing for critical flows
     - Performance testing and optimization
     - Accessibility compliance (Arabic support, screen readers)

     Technical Stack Alignment

     - Framework: React Native 0.74.x (matches tech docs)
     - State Management: Zustand + React Query (already in use)
     - Navigation: React Navigation v6
     - Styling: StyleSheet + Reanimated 3
     - Camera: React Native Vision Camera
     - Storage: AsyncStorage + Keychain
     - Localization: react-i18next with Arabic support

     Key Features Implementation

     1. Splash Screen → Auto-advance after 3s
     2. Onboarding → 3-screen flow with skip functionality
     3. OAuth Login → Apple/Google + guest mode
     4. Home Guidelines → Care basics with Cairo-specific tips
     5. Camera Scan → Plant identification with overlay
     6. Plant Results → Species info + window ratings
     7. Add Plant → Custom form with compass selector
     8. My Plants → Grid view with care tasks
     9. Plant Details → Care history and actions

     Design Implementation

     - Lotus Green (#2D5F3F) primary color scheme
     - Cairo Sand (#F7F3E9) background system
     - Gradient buttons and headers
     - Arabic typography support
     - Mobile-first responsive design
     - Smooth animations and transitions

     Deliverables

     - Complete React Native mobile application
     - Arabic/English bilingual support
     - iOS and Android compatibility
     - Integrated with existing backend APIs
     - Plant identification and care management
     - Offline functionality and data sync

## Tech Stack



### Frontend (React PWA)
```javascript
// Core Dependencies
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "typescript": "^5.3.0",
  
  // PWA
  "workbox-webpack-plugin": "^7.0.0",
  "react-app-rewired": "^2.2.1",
  
  // State Management
  "zustand": "^4.4.0",  // Simple, lightweight
  
  // UI & Styling
  "styled-components": "^6.1.0",
  "@emotion/react": "^11.11.0",
  "framer-motion": "^10.16.0",  // Animations
  
  // Camera & Images
  "react-webcam": "^7.2.0",
  "react-image-crop": "^11.0.0",
  "browser-image-compression": "^2.0.0",
  
  // Forms & Validation
  "react-hook-form": "^7.48.0",
  "zod": "^3.22.0",
  
  // Auth
  "@react-oauth/google": "^0.12.0",
  "react-apple-signin-auth": "^1.0.0",
  
  // Utilities
  "axios": "^1.6.0",
  "date-fns": "^2.30.0",
  "react-query": "^3.39.0",
  "react-hot-toast": "^2.4.0"
}
```

### Backend (Lightweight API)
```javascript
// Initial MVP - Serverless Functions (Vercel/Netlify)
{
  "dependencies": {
    "@vercel/node": "^3.0.0",
    "@supabase/supabase-js": "^2.39.0",  // Auth + DB
    "openai": "^4.20.0",  // Plant identification
    "@google-cloud/vision": "^4.0.0",  // Alternative vision API
  }
}

// Plant Identification APIs
- PlantNet API (primary)
- Google Vision API (fallback)
- Pl@ntNet API (backup)
```

---

## Project Structure

```
lotus-pwa/
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── service-worker.js       # SW for offline
│   └── icons/                  # PWA icons (192x192, 512x512)
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Navigation.tsx
│   │   ├── plant/
│   │   │   ├── PlantCard.tsx
│   │   │   ├── PlantDetails.tsx
│   │   │   └── PlantIdentifier.tsx
│   │   └── camera/
│   │       ├── CameraView.tsx
│   │       └── ImageCapture.tsx
│   │
│   ├── screens/
│   │   ├── Splash.tsx
│   │   ├── Onboarding.tsx
│   │   ├── Auth.tsx
│   │   ├── Home.tsx
│   │   ├── Camera.tsx
│   │   ├── PlantResult.tsx
│   │   ├── AddPlant.tsx
│   │   ├── MyPlants.tsx
│   │   └── PlantDetail.tsx
│   │
│   ├── services/
│   │   ├── api.ts              # API client
│   │   ├── auth.ts             # Auth service
│   │   ├── plantId.ts          # Plant identification
│   │   ├── storage.ts          # Local storage
│   │   └── notifications.ts    # Push notifications
│   │
│   ├── hooks/
│   │   ├── useCamera.ts
│   │   ├── usePlants.ts
│   │   ├── useAuth.ts
│   │   └── useOffline.ts
│   │
│   ├── styles/
│   │   ├── theme.ts            # Design tokens
│   │   ├── GlobalStyles.ts
│   │   └── animations.ts
│   │
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── validators.ts
│   │
│   ├── store/
│   │   └── index.ts            # Zustand store
│   │
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   │
│   └── App.tsx
│
├── api/                        # Serverless functions
│   ├── identify.ts
│   ├── auth.ts
│   └── plants.ts
│
└── package.json
```

---

## Design System Implementation

```typescript
// src/styles/theme.ts
export const theme = {
  colors: {
    primary: '#2D5F3F',      // Lotus Green
    secondary: '#4A90A4',    // Nile Blue
    background: '#F7F3E9',   // Cairo Sand
    white: '#FFFFFF',
    gray: '#9E9E9E',
    success: '#52C41A',
    warning: '#FAAD14',
    error: '#FF4D4F',
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #2D5F3F 0%, #4A90A4 100%)',
    card: 'linear-gradient(180deg, #FFFFFF 0%, #F7F3E9 100%)',
  },
  
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Cairo", sans-serif',
    sizes: {
      display: '32px',
      h1: '24px',
      h2: '18px',
      body: '16px',
      caption: '12px',
    },
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  
  borderRadius: {
    sm: '8px',
    md: '16px',
    lg: '26px',
    full: '50%',
  },
};
```

---

## Core API Endpoints

```typescript
// Base URL: https://api.lotus-app.com/v1

// Auth
POST   /auth/signup         // OAuth signup
POST   /auth/login          // OAuth login
GET    /auth/user           // Get current user

// Plants
POST   /plants/identify     // Identify plant from image
GET    /plants/species/:id  // Get species info
GET    /plants/my-plants    // Get user's plants
POST   /plants/add          // Add plant to collection
PUT    /plants/:id          // Update plant
DELETE /plants/:id          // Remove plant

// Care
GET    /care/schedule       // Get care schedule
POST   /care/complete       // Mark care task done
GET    /care/tips/:plantId  // Get care tips
```

---

## PWA Configuration

```javascript
// public/manifest.json
{
  "name": "Lotus - Plant Care Companion",
  "short_name": "Lotus",
  "description": "Your plant care buddy in Cairo",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#2D5F3F",
  "background_color": "#F7F3E9",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Key Implementation Notes

### 1. Camera Implementation
```typescript
// Use react-webcam for camera access
const cameraConstraints = {
  width: 1280,
  height: 720,
  facingMode: "environment"  // Back camera
};

// Compress before uploading
const compressedImage = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
});
```

### 2. Offline Support
```typescript
// Cache strategy for PWA
- Cache First: Plant species data, care tips
- Network First: User data, identification
- Stale While Revalidate: Images

// IndexedDB for local storage
- User's plants collection
- Care history
- Pending syncs
```

### 3. State Management
```typescript
// Zustand store structure
interface AppStore {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  
  // Plants
  myPlants: Plant[];
  selectedPlant: Plant | null;
  
  // UI
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (provider: 'google' | 'apple') => Promise<void>;
  addPlant: (plant: Plant) => void;
  identifyPlant: (image: Blob) => Promise<PlantResult>;
}
```

### 4. Routing Structure
```typescript
// React Router v6
<Routes>
  <Route path="/" element={<Splash />} />
  <Route path="/onboarding" element={<Onboarding />} />
  <Route path="/auth" element={<Auth />} />
  <Route path="/home" element={<Home />} />
  <Route path="/camera" element={<Camera />} />
  <Route path="/identify" element={<PlantResult />} />
  <Route path="/add-plant" element={<AddPlant />} />
  <Route path="/my-plants" element={<MyPlants />} />
  <Route path="/plant/:id" element={<PlantDetail />} />
</Routes>
```

---

## Environment Variables

```bash
# .env.local
REACT_APP_API_URL=http://localhost:3001
REACT_APP_PLANTNET_API_KEY=your_key
REACT_APP_GOOGLE_CLIENT_ID=your_client_id
REACT_APP_APPLE_CLIENT_ID=your_client_id
REACT_APP_SUPABASE_URL=your_url
REACT_APP_SUPABASE_ANON_KEY=your_key
```

---

## Deployment Configuration

```yaml
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/service-worker.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache"
        }
      ]
    }
  ]
}
```

---

## Quick Start Commands

```bash
# Setup
npx create-react-app lotus-pwa --template typescript
cd lotus-pwa
npm install [dependencies]

# Development
npm start

# Build PWA
npm run build

# Test PWA locally
npx serve -s build

# Deploy to Vercel
vercel --prod
```

---

## Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: > 90
- **Bundle Size**: < 200KB (initial)
- **Image Loading**: Progressive with blur-up
- **Offline Support**: Core features work offline

---

## Testing Strategy

```javascript
// Essential tests only for MVP
- Camera permission handling
- Image upload and compression
- Plant identification flow
- Offline mode functionality
- PWA installation
- OAuth flow
```

---

*Use this document when prompting Claude Code for implementation details. Reference specific sections for consistency.*