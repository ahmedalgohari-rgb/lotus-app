# 🌿 Lotus API Contracts & Data Models

## Essential Data Models & API Contracts for Claude Code

---

## TypeScript Interfaces

```typescript
// User Models
interface User {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'apple' | 'email';
  createdAt: Date;
  preferences: {
    language: 'en' | 'ar';
    notifications: boolean;
    measurementUnit: 'metric' | 'imperial';
  };
}

// Plant Models
interface Plant {
  id: string;
  userId: string;
  speciesId: string;
  nickname: string;
  location: 'living_room' | 'bedroom' | 'kitchen' | 'bathroom' | 'balcony';
  windowDirection: 'north' | 'east' | 'south' | 'west';
  imageUrl: string;
  health: 'healthy' | 'warning' | 'critical';
  addedDate: Date;
  lastWatered: Date;
  nextWatering: Date;
  careHistory: CareEvent[];
}

interface PlantSpecies {
  id: string;
  nameEn: string;
  nameAr: string;
  scientificName: string;
  family: string;
  wateringFrequency: number; // days
  wateringMethod: ('top' | 'bottom')[];
  lightRequirement: 'low' | 'medium' | 'bright_indirect' | 'direct';
  windowRatings: {
    north: number; // 1-5 stars
    east: number;
    south: number;
    west: number;
  };
  temperatureRange: {
    min: number;
    max: number;
  };
  humidity: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'moderate' | 'hard';
  cairoTip: string;
  toxicToPets: boolean;
}

interface IdentificationResult {
  speciesId: string;
  confidence: number; // 0-100
  commonName: string;
  scientificName: string;
  suggestions: PlantSpecies[];
}

interface CareEvent {
  id: string;
  type: 'water' | 'fertilize' | 'prune' | 'repot';
  date: Date;
  notes?: string;
  completed: boolean;
}
```

---

## API Endpoints Detail

### 1. Authentication

```typescript
// POST /api/auth/oauth
Request: {
  provider: 'google' | 'apple';
  token: string;
}
Response: {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// GET /api/auth/me
Headers: {
  Authorization: 'Bearer {token}';
}
Response: {
  user: User;
}
```

### 2. Plant Identification

```typescript
// POST /api/plants/identify
Request: FormData {
  image: File;
  location?: string; // For geo-specific results
}
Response: {
  success: boolean;
  result: IdentificationResult;
  careGuide: {
    watering: string;
    light: string;
    temperature: string;
    windowPositions: WindowRating[];
  };
}

// Real PlantNet API integration
const identifyPlant = async (imageBase64: string) => {
  const response = await fetch('https://my-api.plantnet.org/v2/identify', {
    method: 'POST',
    headers: {
      'Api-Key': process.env.PLANTNET_API_KEY,
    },
    body: {
      images: [imageBase64],
      organs: ['leaf'],
      'include-related-images': false,
    }
  });
  return response.json();
};
```

### 3. Plant Management

```typescript
// GET /api/plants/my-plants
Response: {
  plants: Plant[];
  todaysTasks: CareEvent[];
  upcomingTasks: CareEvent[];
}

// POST /api/plants
Request: {
  speciesId: string;
  nickname: string;
  location: string;
  windowDirection: string;
  imageUrl?: string;
}
Response: {
  plant: Plant;
  message: 'Plant added successfully';
}

// PUT /api/plants/:id
Request: Partial<Plant>
Response: {
  plant: Plant;
  message: 'Plant updated successfully';
}

// POST /api/plants/:id/care
Request: {
  type: 'water' | 'fertilize' | 'prune';
  notes?: string;
}
Response: {
  event: CareEvent;
  nextScheduled: Date;
}
```

### 4. Care Guidelines

```typescript
// GET /api/care/species/:speciesId
Response: {
  species: PlantSpecies;
  generalTips: string[];
  cairoSpecific: {
    summer: string[];
    winter: string[];
    dustCare: string;
  };
  commonProblems: {
    issue: string;
    solution: string;
    prevention: string;
  }[];
}

// GET /api/care/schedule
Response: {
  today: {
    plantId: string;
    plantName: string;
    task: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  thisWeek: CareEvent[];
  overdue: CareEvent[];
}
```

---

## Local Storage Schema (IndexedDB)

```javascript
// Database: LotusDB
// Version: 1

// Stores
const stores = {
  plants: {
    keyPath: 'id',
    indexes: ['userId', 'speciesId', 'health']
  },
  species: {
    keyPath: 'id',
    indexes: ['nameEn', 'nameAr', 'difficulty']
  },
  careEvents: {
    keyPath: 'id',
    indexes: ['plantId', 'date', 'type', 'completed']
  },
  pendingSync: {
    keyPath: 'id',
    indexes: ['type', 'timestamp']
  }
};

// Usage
const db = await openDB('LotusDB', 1, {
  upgrade(db) {
    // Create stores
    const plantStore = db.createObjectStore('plants', { keyPath: 'id' });
    plantStore.createIndex('userId', 'userId');
    // ... other stores
  }
});
```

---

## Service Worker Caching Strategy

```javascript
// service-worker.js
const CACHE_NAME = 'lotus-v1';

// Cache strategies by route
const cacheStrategies = {
  // Cache First - Static assets
  cacheFirst: [
    /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    /\.(?:js|css)$/,
    /^https:\/\/fonts\.googleapis\.com/,
  ],
  
  // Network First - API calls
  networkFirst: [
    /\/api\/auth/,
    /\/api\/plants\/identify/,
    /\/api\/plants\/my-plants/,
  ],
  
  // Stale While Revalidate - Species data
  staleWhileRevalidate: [
    /\/api\/care\/species/,
    /\/api\/care\/guidelines/,
  ],
};
```

---

## Mock Data for Development

```javascript
// mockData.js
export const mockPlants = [
  {
    id: '1',
    speciesId: 'pothos',
    nickname: 'Living Room Beauty',
    location: 'living_room',
    windowDirection: 'east',
    health: 'healthy',
    lastWatered: new Date('2024-12-18'),
    nextWatering: new Date('2024-12-23'),
    imageUrl: '/mock/pothos.jpg',
  },
  // ... more mock plants
];

export const mockSpecies = {
  'pothos': {
    id: 'pothos',
    nameEn: 'Golden Pothos',
    nameAr: 'البوتس الذهبي',
    scientificName: 'Epipremnum aureum',
    wateringFrequency: 7,
    wateringMethod: ['top', 'bottom'],
    lightRequirement: 'bright_indirect',
    windowRatings: {
      north: 5,
      east: 4,
      south: 2,
      west: 3,
    },
    cairoTip: 'Needs more water during Cairo summer heat (May-September)',
  },
  // ... more species
};
```

---

## Error Handling

```typescript
// Standard error response
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Error codes
enum ErrorCode {
  // Auth errors
  AUTH_INVALID_TOKEN = 'AUTH001',
  AUTH_EXPIRED_TOKEN = 'AUTH002',
  
  // Plant errors
  PLANT_NOT_FOUND = 'PLANT001',
  PLANT_IDENTIFICATION_FAILED = 'PLANT002',
  PLANT_LIMIT_REACHED = 'PLANT003',
  
  // Network errors
  NETWORK_OFFLINE = 'NET001',
  NETWORK_TIMEOUT = 'NET002',
}

// Error handler
const handleApiError = (error: ApiError) => {
  switch(error.error.code) {
    case ErrorCode.AUTH_INVALID_TOKEN:
      // Redirect to login
      break;
    case ErrorCode.NETWORK_OFFLINE:
      // Show offline message
      break;
    default:
      // Show generic error
  }
};
```

---

## Rate Limiting

```javascript
// API rate limits
const rateLimits = {
  '/api/plants/identify': {
    requests: 10,
    window: '1h',
    message: 'Too many identification requests. Please try again later.'
  },
  '/api/auth/oauth': {
    requests: 5,
    window: '15m',
    message: 'Too many login attempts.'
  },
};
```

---

## Environment-Specific Configs

```javascript
// config.js
const config = {
  development: {
    API_URL: 'http://localhost:3001',
    USE_MOCK_DATA: true,
    LOG_LEVEL: 'debug',
  },
  production: {
    API_URL: 'https://api.lotus-app.com',
    USE_MOCK_DATA: false,
    LOG_LEVEL: 'error',
  },
};

export default config[process.env.NODE_ENV || 'development'];
```

---

*Reference this document when implementing API calls and data handling in Claude Code.*