# OAuth Authentication API Documentation

This document describes the OAuth authentication endpoints for Google and Apple sign-in, along with progressive authentication features.

## Base URL
```
http://localhost:3000/api (development)
https://api.lotus-app.com (production)
```

## Authentication Headers
For protected endpoints, include the JWT token:
```
Authorization: Bearer <access_token>
```

---

## OAuth Endpoints

### 1. Google OAuth Sign-in
**POST** `/oauth/google`

Sign in or register using Google OAuth.

#### Request Body
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...",
  "deviceId": "device-uuid-or-identifier"
}
```

#### Response (200 OK)
```json
{
  "message": "Login successful",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "Ahmed",
    "lastName": "Algohari",
    "role": "USER"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  },
  "isNewUser": false
}
```

#### Error Response (400 Bad Request)
```json
{
  "error": "Invalid Google token"
}
```

---

### 2. Apple OAuth Sign-in
**POST** `/oauth/apple`

Sign in or register using Apple ID.

#### Request Body
```json
{
  "idToken": "eyJraWQiOiJlWGF1bm1MIiwiYWxnIjoiUlMyNTYifQ...",
  "deviceId": "device-uuid-or-identifier",
  "clientId": "com.lotus.app" // Optional, uses default from env
}
```

#### Response (200 OK)
```json
{
  "message": "Account created successfully with Apple ID",
  "user": {
    "id": "user-uuid",
    "email": "user@privaterelay.appleid.com",
    "firstName": null,
    "lastName": null,
    "role": "USER"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  },
  "isNewUser": true
}
```

---

### 3. Link OAuth Provider
**POST** `/oauth/link`
*Requires Authentication*

Link a Google or Apple account to existing user account.

#### Request Body
```json
{
  "provider": "google", // or "apple"
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ..."
}
```

#### Response (200 OK)
```json
{
  "message": "Google account linked successfully"
}
```

#### Error Response (400 Bad Request)
```json
{
  "error": "This Google account is already linked to another user"
}
```

---

### 4. Unlink OAuth Provider
**DELETE** `/oauth/unlink`
*Requires Authentication*

Unlink a Google or Apple account from user account.

#### Request Body
```json
{
  "provider": "google" // or "apple"
}
```

#### Response (200 OK)
```json
{
  "message": "Google account unlinked successfully"
}
```

#### Error Response (400 Bad Request)
```json
{
  "error": "Cannot unlink the only authentication method. Please set a password first."
}
```

---

### 5. Get OAuth Providers
**GET** `/oauth/providers`
*Requires Authentication*

Get user's linked OAuth providers.

#### Response (200 OK)
```json
{
  "providers": [
    {
      "provider": "google",
      "email": "user@gmail.com",
      "createdAt": "2025-08-29T23:30:00.000Z"
    },
    {
      "provider": "apple",
      "email": "user@privaterelay.appleid.com",
      "createdAt": "2025-08-29T23:35:00.000Z"
    }
  ]
}
```

---

### 6. Set Password for OAuth User
**POST** `/oauth/set-password`
*Requires Authentication*

Set a password for users who only have OAuth authentication.

#### Request Body
```json
{
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!"
}
```

#### Response (200 OK)
```json
{
  "message": "Password set successfully. You can now also sign in with email and password."
}
```

---

## Progressive Authentication Endpoints

### 1. Get Authentication Methods
**POST** `/auth/methods`

Discover available authentication methods for an email address.

#### Request Body
```json
{
  "email": "user@example.com"
}
```

#### Response (200 OK)
```json
{
  "email": "user@example.com",
  "userExists": true,
  "methods": [
    {
      "type": "email",
      "available": true,
      "verified": true
    },
    {
      "type": "google",
      "available": true,
      "verified": true,
      "addedAt": "2025-08-29T23:30:00.000Z"
    },
    {
      "type": "apple",
      "available": false
    }
  ],
  "userInfo": {
    "firstName": "Ahmed",
    "lastName": "Algohari",
    "avatarUrl": "https://lh3.googleusercontent.com/a/...",
    "primaryAuthProvider": "multiple"
  }
}
```

---

### 2. Verify Provider Credential
**POST** `/auth/verify-provider`

Verify a credential for a specific provider before login.

#### Request Body
```json
{
  "provider": "google", // "google", "apple", or "email"
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ..." // ID token or password
}
```

#### Response (200 OK)
```json
{
  "provider": "google",
  "valid": true,
  "userInfo": {
    "email": "user@gmail.com",
    "firstName": "Ahmed",
    "lastName": "Algohari",
    "avatarUrl": "https://lh3.googleusercontent.com/a/..."
  },
  "requiresDeviceId": true
}
```

---

### 3. Check Email Exists
**POST** `/auth/check-email`

Simple endpoint to check if an email is already registered.

#### Request Body
```json
{
  "email": "user@example.com"
}
```

#### Response (200 OK)
```json
{
  "email": "user@example.com",
  "exists": true,
  "userInfo": {
    "firstName": "Ahmed",
    "lastName": "Algohari",
    "avatarUrl": "https://lh3.googleusercontent.com/a/...",
    "authProvider": "google"
  }
}
```

---

### 4. Get OAuth Configuration
**GET** `/auth/oauth-config`

Get OAuth client configuration for frontend setup.

#### Response (200 OK)
```json
{
  "google": {
    "clientId": "123456789-abcdef.apps.googleusercontent.com",
    "enabled": true
  },
  "apple": {
    "clientId": "com.lotus.app",
    "enabled": true
  }
}
```

---

## Rate Limiting

All OAuth endpoints have rate limiting applied:

- **OAuth login endpoints**: 10 requests per 15 minutes per IP
- **Provider management** (link/unlink): 5 requests per 15 minutes per IP
- **Progressive auth endpoints**: 20 requests per 15 minutes per IP

## Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid input data |
| `401` | Unauthorized - Invalid or expired token |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error |

## Security Features

### Token Security
- JWT access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Refresh tokens are stored as httpOnly cookies
- Device-based session management

### OAuth Security
- Google ID tokens verified with Google's public keys
- Apple ID tokens verified with Apple's public keys
- Provider data is encrypted and stored securely
- Cross-provider account linking protection

### Privacy Protection
- User enumeration protection on authentication methods endpoint
- Consistent responses for non-existent users
- Secure error messages that don't leak sensitive information

## Database Schema

### Users Table (Updated)
```sql
-- New OAuth fields added
google_id VARCHAR UNIQUE,
apple_id VARCHAR UNIQUE,
auth_provider VARCHAR DEFAULT 'email', -- 'email', 'google', 'apple', 'multiple'
provider_verified BOOLEAN DEFAULT false,
password_hash VARCHAR -- Now optional for OAuth-only users
```

### OAuth Providers Table (New)
```sql
CREATE TABLE oauth_providers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR NOT NULL, -- 'google', 'apple'
  provider_id VARCHAR NOT NULL, -- ID from OAuth provider
  email VARCHAR NOT NULL,
  access_token VARCHAR,
  refresh_token VARCHAR,
  token_expiry TIMESTAMP,
  scope VARCHAR,
  provider_data TEXT, -- JSON string of additional data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(provider, provider_id),
  UNIQUE(provider, email)
);
```

## Setup Instructions

### 1. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domains to authorized origins
6. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

### 2. Apple Sign In Setup
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Register a new App ID
3. Enable Sign In with Apple capability
4. Create a Service ID for web authentication
5. Generate a private key and download it
6. Set Apple environment variables in `.env`

### 3. Environment Variables
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Apple OAuth
APPLE_CLIENT_ID=com.your-app.service-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY_PATH=./certs/AuthKey_YOUR_KEY_ID.p8
```

## Integration Examples

### Frontend Integration (React)
```javascript
// Google Sign-In
const handleGoogleLogin = async (googleResponse) => {
  const response = await fetch('/api/oauth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idToken: googleResponse.credential,
      deviceId: getDeviceId()
    })
  });
  
  const data = await response.json();
  if (data.tokens) {
    localStorage.setItem('accessToken', data.tokens.accessToken);
    // Handle successful login
  }
};

// Progressive Authentication
const checkAuthMethods = async (email) => {
  const response = await fetch('/api/auth/methods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  const methods = await response.json();
  // Show appropriate login options based on methods.methods
};
```

### Mobile Integration (React Native)
```javascript
// Apple Sign-In
import { appleAuth } from '@invertase/react-native-apple-authentication';

const handleAppleLogin = async () => {
  const appleAuthRequestResponse = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
  });

  const response = await fetch('/api/oauth/apple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idToken: appleAuthRequestResponse.identityToken,
      deviceId: getDeviceId()
    })
  });
  
  const data = await response.json();
  // Handle response
};
```

## Testing

Use the provided test scripts to verify OAuth functionality:
```bash
# Test Google OAuth (requires valid Google ID token)
npm run test:oauth:google

# Test Apple OAuth (requires valid Apple ID token)  
npm run test:oauth:apple

# Test progressive authentication
npm run test:progressive-auth
```