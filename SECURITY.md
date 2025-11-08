# Security Policy

## Overview

This document outlines the security measures and best practices implemented in the Lotus Plant Care App. Security is a top priority, and we've implemented multiple layers of protection to safeguard user data and prevent abuse.

---

## 🔒 Security Features

### 1. Row-Level Security (RLS)

**Implementation:** All database tables use PostgreSQL Row-Level Security policies via Supabase.

**Protection:**
- Users can only access their own plants, care events, and profile data
- Plant species data is read-only for all users
- Storage bucket policies ensure users can only modify their own images

**Policies:**
```sql
-- Plants table: Users can only view/edit their own plants
CREATE POLICY "Users can view their own plants" ON plants
  FOR SELECT USING (auth.uid() = user_id);

-- Profiles table: Users can only view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
```

**Migration:** See `supabase/migrations/001_security_audit_fixes.sql`

---

### 2. API Key Protection

**Problem Prevented:** Exposed API keys in the front-end can lead to unauthorized usage and unexpected charges.

**Implementation:**
- All API keys stored in `.env` file (gitignored)
- `.env.example` template provided with placeholder values
- API keys never committed to git repository
- Environment variables prefixed with `EXPO_PUBLIC_` for Expo compatibility

**Best Practices:**
- Rotate API keys every 90 days
- Use separate keys for development and production
- Add IP restrictions in PlantNet dashboard
- Monitor API usage regularly for anomalies

**Files:**
- `.env` - Local environment variables (gitignored)
- `.env.example` - Template with security guidelines

---

### 3. Client-Side Rate Limiting

**Purpose:** Protects against excessive API calls that could:
- Rack up costs from third-party APIs
- Overload backend services
- Accidentally DoS the application

**Implementation:**
- PlantNet API: 10 scans per hour
- Plant operations: 50 operations per hour
- Weather API: 10 requests per 10 minutes (with caching)

**User Experience:**
- Clear rate limit messages with retry times
- Automatic reset every hour
- Remaining requests displayed to users

**Files:**
- `src/utils/rateLimiter.ts` - Rate limiting utility
- `src/services/plantnet.ts` - PlantNet rate limiting
- `src/services/supabase.ts` - Database operation rate limiting

**Example:**
```typescript
import { plantScanLimiter } from '../utils/rateLimiter';

const check = await plantScanLimiter.checkLimit();
if (!check.allowed) {
  // Show error: "Try again in 15 minutes"
}
```

---

### 4. Image Upload Validation

**Vulnerabilities Prevented:**
- Malicious file uploads (executables disguised as images)
- Oversized images that waste storage and bandwidth
- Invalid file types that could crash the app

**Validation Rules:**
- **File types:** JPEG, PNG, WebP only
- **Max file size:** 5MB
- **Max dimensions:** 4000x4000px
- **Min dimensions:** 100x100px
- **Auto-resize:** Images larger than 4000px are automatically resized

**Files:**
- `src/utils/validation.ts` - Image validation utilities
- `src/services/supabase.ts` - Upload validation integration

**Example:**
```typescript
const validation = await validateImageForUpload(uri, mimeType);
if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}
```

---

### 5. Input Sanitization

**Protection:** Prevents injection attacks and enforces business logic constraints.

**Implementation:**
- Text inputs trimmed and length-limited
- Plant nicknames: Max 100 characters, alphanumeric + Arabic
- Plant notes: Max 1000 characters
- Enum validation for locations, window directions, health statuses
- URL validation for image URLs

**Files:**
- `src/utils/validation.ts` - Validation and sanitization functions

**Example:**
```typescript
const result = validatePlantNickname(userInput);
if (!result.isValid) {
  alert(result.error); // "Input exceeds maximum length"
}
```

---

### 6. Database Query Optimization

**Security Benefit:** Reduces data exposure and improves performance.

**Implementation:**
- Replaced all `SELECT *` queries with specific column selections
- Only fetch data that's actually displayed in the UI
- Reduces risk of accidentally exposing sensitive fields

**Example:**
```typescript
// Before (insecure):
.select('*')

// After (secure):
.select('id, nickname, image_url, health_status')
```

---

## 🚨 Known Limitations

The following security features require external infrastructure and are **NOT** implemented:

### 1. Server-Side Rate Limiting
**Status:** ❌ Not implemented  
**Reason:** Requires backend API or edge functions  
**Risk:** Malicious users could bypass client-side rate limits  
**Mitigation:** RLS policies prevent unauthorized data access

### 2. DDoS Protection
**Status:** ❌ Not implemented  
**Reason:** Requires Cloudflare or similar service  
**Recommendation:** Add Cloudflare when deploying to production

### 3. API Key Proxy
**Status:** ❌ Not implemented  
**Reason:** Requires serverless functions to hide keys  
**Risk:** API keys exposed in client-side code  
**Mitigation:** IP restrictions on PlantNet API, RLS on Supabase

### 4. HTTPS Enforcement
**Status:** ✅ Enforced by Expo and Supabase  
**Note:** All API calls use HTTPS by default

---

## 📋 Security Checklist

Before deploying to production, ensure:

- [ ] All API keys rotated and stored in `.env`
- [ ] `.env` file is gitignored (never committed)
- [ ] Supabase RLS policies enabled on all tables
- [ ] PlantNet API has IP restrictions configured
- [ ] Rate limits tested and working
- [ ] Image upload validation tested with various file types
- [ ] Billing alerts configured for API usage
- [ ] Error logging and monitoring set up
- [ ] HTTPS enforced on all API endpoints
- [ ] User input validation tested with malicious inputs

---

## 🔍 Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do NOT** open a public GitHub issue
2. Email the maintainer directly with details
3. Include steps to reproduce the vulnerability
4. Allow 48 hours for initial response

**Responsible Disclosure:**
- We will acknowledge your report within 48 hours
- We will provide regular updates on the fix
- We will credit you in the security advisory (if desired)

---

## 📚 Additional Resources

- [Supabase Row-Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Expo Security Best Practices](https://docs.expo.dev/guides/security/)
- [PlantNet API Documentation](https://my.plantnet.org/doc)

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-08 | Initial security audit and implementation |

---

**Last Updated:** November 8, 2025  
**Security Audit Status:** ✅ Completed  
**Next Review:** February 8, 2026 (3 months)
