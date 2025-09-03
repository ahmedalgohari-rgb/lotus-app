# 🌱 Lotus Plant Care API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000/api`  
**Authentication:** Bearer Token (JWT)

## 📚 Table of Contents
1. [Authentication](#-authentication)
2. [Plant Management](#-plant-management)
3. [Care Logging](#-care-logging)
4. [Plant Identification](#-plant-identification)
5. [Statistics](#-statistics)
6. [Error Handling](#-error-handling)
7. [Rate Limiting](#-rate-limiting)
8. [Response Format](#-response-format)

---

## 🔐 Authentication

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "firstName": "أحمد",
  "lastName": "محمد",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm0x1y2z3-a4b5-c6d7-e8f9-g0h1i2j3k4l5",
      "email": "user@example.com",
      "firstName": "أحمد",
      "lastName": "محمد",
      "isEmailVerified": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "message": {
      "en": "Registration successful! Please check your email to verify your account.",
      "ar": "تم التسجيل بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك."
    }
  }
}
```

### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm0x1y2z3-a4b5-c6d7-e8f9-g0h1i2j3k4l5",
      "email": "user@example.com",
      "firstName": "أحمد",
      "lastName": "محمد",
      "isEmailVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "accessTokenExpiresAt": "2024-01-15T11:00:00.000Z",
      "refreshTokenExpiresAt": "2024-01-22T10:30:00.000Z"
    }
  }
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🌿 Plant Management

All plant endpoints require authentication header:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Get All User Plants
```http
GET /plants
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "plants": [
      {
        "id": "plant-uuid-123",
        "name": "البوتس الذهبي",
        "scientificName": "Epipremnum aureum",
        "variety": "Golden Pothos",
        "wateringFrequency": 7,
        "fertilizingFrequency": 30,
        "sunlightRequirement": "partial",
        "temperatureMin": 18,
        "temperatureMax": 25,
        "humidityRequirement": "moderate",
        "primaryImageUrl": "https://example.com/image.jpg",
        "location": "{\"city\":\"Cairo\",\"governorate\":\"Cairo\",\"latitude\":30.0444,\"longitude\":31.2357}",
        "healthStatus": "GOOD",
        "healthScore": 85.5,
        "lastWateredAt": "2024-01-10T09:00:00.000Z",
        "lastFertilizedAt": "2024-01-05T09:00:00.000Z",
        "lastPrunedAt": null,
        "lastRepottedAt": "2023-12-01T10:00:00.000Z",
        "acquisitionDate": "2024-01-01T00:00:00.000Z",
        "source": "Local nursery",
        "age": 15,
        "createdAt": "2024-01-01T10:00:00.000Z",
        "updatedAt": "2024-01-10T09:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

### Create New Plant
```http
POST /plants
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "نبات الثعبان الجديد",
  "scientificName": "Sansevieria trifasciata",
  "variety": "Mother-in-Law's Tongue",
  "wateringFrequency": 14,
  "fertilizingFrequency": 60,
  "sunlightRequirement": "low",
  "temperatureMin": 15,
  "temperatureMax": 30,
  "humidityRequirement": "low",
  "location": "{\"city\":\"Alexandria\",\"governorate\":\"Alexandria\",\"latitude\":31.2001,\"longitude\":29.9187}",
  "acquisitionDate": "2024-01-15T00:00:00.000Z",
  "source": "Garden center"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Plant added successfully",
  "data": {
    "plant": {
      "id": "plant-uuid-456",
      "name": "نبات الثعبان الجديد",
      "scientificName": "Sansevieria trifasciata",
      "variety": "Mother-in-Law's Tongue",
      "wateringFrequency": 14,
      "fertilizingFrequency": 60,
      "sunlightRequirement": "low",
      "temperatureMin": 15,
      "temperatureMax": 30,
      "humidityRequirement": "low",
      "location": "{\"city\":\"Alexandria\",\"governorate\":\"Alexandria\",\"latitude\":31.2001,\"longitude\":29.9187}",
      "healthStatus": "GOOD",
      "acquisitionDate": "2024-01-15T00:00:00.000Z",
      "source": "Garden center",
      "userId": "user-uuid-123",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get Single Plant
```http
GET /plants/{plantId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "plant-uuid-123",
    "name": "البوتس الذهبي",
    "scientificName": "Epipremnum aureum",
    "careHistory": [
      {
        "id": "care-uuid-789",
        "type": "WATERING",
        "performedAt": "2024-01-10T09:00:00.000Z",
        "notes": "Watered thoroughly"
      }
    ],
    "nextCareActions": [
      {
        "type": "WATERING",
        "dueDate": "2024-01-17T09:00:00.000Z",
        "isOverdue": false
      }
    ]
  }
}
```

### Update Plant
```http
PUT /plants/:id
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "البوتس الذهبي - محدث",
  "wateringFrequency": 5,
  "temperatureMax": 28,
  "location": "{\"city\":\"Giza\",\"governorate\":\"Giza\",\"latitude\":30.0131,\"longitude\":31.2089}"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Plant updated successfully",
  "data": {
    "plant": {
      "id": "plant-uuid-123",
      "name": "البوتس الذهبي - محدث",
      "scientificName": "Epipremnum aureum",
      "wateringFrequency": 5,
      "temperatureMax": 28,
      "location": "{\"city\":\"Giza\",\"governorate\":\"Giza\",\"latitude\":30.0131,\"longitude\":31.2089}",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### Delete Plant
```http
DELETE /plants/:id
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Plant deleted successfully"
}
```

### Plant Statistics
```http
GET /plants/stats
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 12,
      "indoor": 8,
      "outdoor": 4
    }
  }
}
```

---

## 🚰 Care Logging

### Log Care Action
```http
POST /care
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "plantId": "plant-uuid-123",
  "type": "WATERING",
  "notes": "تم ري النبات بكمية كافية - Plant was dry, gave thorough watering",
  "metadata": "{\"amount\":\"200ml\",\"soilCondition\":\"dry\"}",
  "imageUrl": "https://example.com/care-image.jpg",
  "performedAt": "2024-01-15T10:30:00.000Z"
}
```

**Available Care Types:**
- `WATERING` - سقي (watered)
- `FERTILIZING` - تسميد (fertilized)  
- `PRUNING` - تقليم (pruned)
- `REPOTTING` - إعادة زراعة (repotted)
- `OBSERVATION` - ملاحظة (moved/observed)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Care action logged successfully",
  "data": {
    "careLog": {
      "id": "care-uuid-789",
      "userId": "user-uuid-123",
      "plantId": "plant-uuid-123",
      "type": "WATERING",
      "notes": "تم ري النبات بكمية كافية - Plant was dry, gave thorough watering",
      "metadata": "{\"amount\":\"200ml\",\"soilCondition\":\"dry\"}",
      "imageUrl": "https://example.com/care-image.jpg",
      "performedAt": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Get Plant Care History
```http
GET /care/plant/:plantId?limit=20
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "careHistory": [
      {
        "id": "care-uuid-789",
        "type": "WATERING",
        "notes": "تم ري النبات بكمية كافية",
        "metadata": "{\"amount\":\"200ml\",\"soilCondition\":\"dry\"}",
        "imageUrl": "https://example.com/care-image.jpg",
        "performedAt": "2024-01-15T10:30:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": "care-uuid-788",
        "type": "FERTILIZING",
        "notes": "تم تسميد النبات - Added liquid fertilizer",
        "performedAt": "2024-01-10T09:00:00.000Z",
        "createdAt": "2024-01-10T09:00:00.000Z"
      }
    ],
    "count": 2
  }
}
```

### Get Recent Care Actions
```http
GET /care/recent?limit=10
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "recentActions": [
      {
        "id": "care-uuid-789",
        "plantId": "plant-uuid-123",
        "plantName": "البوتس الذهبي",
        "type": "WATERING",
        "notes": "Plant was dry, gave thorough watering",
        "performedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "count": 1
  }
}
```

### Care Statistics
```http
GET /care/stats?days=30
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalActions": 45,
      "wateringActions": 25,
      "fertilizingActions": 8,
      "pruningActions": 5,
      "repottingActions": 2,
      "observationActions": 5,
      "averageActionsPerDay": 1.5,
      "mostActiveDay": "2024-01-10"
    }
  }
}
```

### Get Specific Care Log
```http
GET /care/:id
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Update Care Log
```http
PUT /care/:id
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "notes": "Updated notes - تم تحديث الملاحظات",
  "metadata": "{\"amount\":\"250ml\",\"soilCondition\":\"slightly_dry\"}"
}
```

### Delete Care Log
```http
DELETE /care/:id
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 🔍 Plant Identification

### Identify Plant by Description
```http
POST /identify
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "description": "نبات أوراقه خضراء على شكل قلب، ينمو كنبات متسلق",
  "metadata": {
    "location": {
      "latitude": 30.0444,
      "longitude": 31.2357
    },
    "environment": "indoor",
    "lightCondition": "medium"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Plant identification completed",
  "data": {
    "identification": {
      "names": {
        "arabic": "البوتس",
        "english": "Pothos",
        "scientific": "Epipremnum aureum"
      },
      "confidence": 0.85,
      "care": {
        "water": "Every 5-7 days",
        "light": "Indirect sunlight",
        "environment": "indoor"
      }
    },
    "metadata": {
      "searchTerm": "نبات أوراقه خضراء على شكل قلب، ينمو كنبات متسلق",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "userId": "user-uuid-123",
      "location": {
        "latitude": 30.0444,
        "longitude": 31.2357
      },
      "environment": "indoor",
      "lightCondition": "medium"
    }
  }
}
```

### Get Plant Database
```http
GET /identify/database
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Plant database retrieved successfully",
  "data": {
    "plants": [
      {
        "id": "pothos",
        "names": {
          "arabic": "البوتس",
          "english": "Pothos",
          "scientific": "Epipremnum aureum"
        },
        "care": {
          "water": "Every 5-7 days",
          "light": "Indirect sunlight",
          "environment": "indoor"
        }
      },
      {
        "id": "snake_plant",
        "names": {
          "arabic": "نبات الثعبان",
          "english": "Snake Plant",
          "scientific": "Sansevieria trifasciata"
        },
        "care": {
          "water": "Every 2-3 weeks",
          "light": "Low to bright light",
          "environment": "indoor"
        }
      }
    ],
    "count": 25
  }
}
```

### Search Plants
```http
GET /identify/search?query=نعناع&limit=5
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Plant search completed",
  "data": {
    "plants": [
      {
        "id": "mint",
        "names": {
          "arabic": "النعناع",
          "english": "Mint",
          "scientific": "Mentha"
        },
        "care": {
          "water": "Keep soil moist",
          "light": "Partial sunlight",
          "environment": "outdoor"
        },
        "matchScore": 1.0
      }
    ],
    "count": 1,
    "query": "نعناع"
  }
}
```

### Get Database Statistics
```http
GET /identify/stats
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Database statistics retrieved successfully",
  "data": {
    "stats": {
      "totalPlants": 25,
      "indoorPlants": 18,
      "outdoorPlants": 7,
      "categories": {
        "houseplants": 12,
        "herbs": 6,
        "succulents": 4,
        "flowers": 3
      }
    }
  }
}
```

### Get Plant Care Information
```http
GET /identify/care/:plantId
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Plant care information retrieved successfully",
  "data": {
    "plant": {
      "id": "pothos",
      "names": {
        "arabic": "البوتس",
        "english": "Pothos",
        "scientific": "Epipremnum aureum"
      },
      "care": {
        "water": "Every 5-7 days",
        "light": "Indirect sunlight",
        "environment": "indoor",
        "temperature": "18-25°C",
        "humidity": "Medium"
      }
    },
    "plantId": "pothos"
  }
}
```

---

## 📊 Statistics

### System Health Check
```http
GET /health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

---

## ❌ Error Handling

### Error Response Format
All error responses follow this consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": {
      "en": "Validation failed",
      "ar": "فشل في التحقق من البيانات"
    },
    "details": [
      {
        "field": "email",
        "message": {
          "en": "Invalid email format",
          "ar": "تنسيق البريد الإلكتروني غير صحيح"
        }
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_123456789"
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 401 | `UNAUTHORIZED` | Authentication required |
| 401 | `INVALID_TOKEN` | JWT token is invalid/expired |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 404 | `PLANT_NOT_FOUND` | Plant not found |
| 409 | `EMAIL_ALREADY_EXISTS` | Email already registered |
| 409 | `PLANT_NAME_EXISTS` | Plant name already exists |
| 422 | `UNPROCESSABLE_ENTITY` | Business logic validation failed |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_SERVER_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

---

## ⚡ Rate Limiting

### Current Limits

| Endpoint Category | Rate Limit | Window |
|------------------|------------|---------|
| Authentication | 5 requests | 15 minutes |
| General API | 100 requests | 1 minute |
| Plant Identification | 20 requests | 1 minute |
| File Uploads | 10 requests | 1 minute |

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
Retry-After: 60
```

---

## 📋 Response Format

### Success Response Structure
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": {
    "en": "Operation completed successfully",
    "ar": "تمت العملية بنجاح"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Pagination Structure
```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 🛡️ Security Considerations

### Authentication
- JWT tokens expire after 15 minutes (access) and 7 days (refresh)
- All sensitive endpoints require authentication
- Device-based token management
- Automatic token rotation on refresh

### Input Validation
- All inputs validated using Zod schemas
- SQL injection prevention via Prisma ORM
- XSS protection through input sanitization
- File type validation for image uploads

### API Security
- CORS properly configured
- Rate limiting on all endpoints
- Content Security Policy headers
- Request size limits (10MB for images)

---

## 🚀 Development & Testing

### Environment Variables Required
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secure-jwt-secret"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret"
NODE_ENV="development"
PORT="3000"
CORS_ORIGIN="http://localhost:3000"
```

### Test the API
```bash
# Start the server
npm run dev

# Run comprehensive API tests
node test-complete-apis-final.js
```

---

## 📚 Code Examples

### Frontend Integration (React)
```typescript
// utils/apiClient.ts
const API_BASE = 'http://localhost:3000/api';

class ApiClient {
  private accessToken: string | null = null;

  async login(email: string, password: string, deviceId: string) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, deviceId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      this.accessToken = data.data.tokens.accessToken;
      localStorage.setItem('accessToken', this.accessToken);
      return data.data;
    }
    
    throw new Error(data.error.message.en);
  }

  async getPlants() {
    const response = await fetch(`${API_BASE}/plants`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.json();
  }

  async logCare(plantId: string, type: string, notes: string) {
    const response = await fetch(`${API_BASE}/care`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plantId,
        type,
        notes,
        metadata: JSON.stringify({ timestamp: Date.now() })
      })
    });
    
    return response.json();
  }
}

export const apiClient = new ApiClient();
```

---

*API Documentation Version: 1.0.0*  
*Last Updated: Backend Development Complete*  
*Next Review: Post-Frontend Integration*

---

## 📞 Support

For API support and questions:
- **Documentation Issues**: Update this document
- **Bug Reports**: Create detailed test cases
- **Feature Requests**: Follow Egyptian user needs priority

**Happy Gardening! 🌿**