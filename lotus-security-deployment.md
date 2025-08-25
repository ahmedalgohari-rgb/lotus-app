security_layers:
  application:
    - Input validation
    - Output encoding
    - Authentication/Authorization
    - Session management
    - Error handling
    
  network:
    - HTTPS/TLS
    - Certificate pinning
    - API gateway
    - Rate limiting
    - DDoS protection
    
  infrastructure:
    - Firewall rules
    - VPC isolation
    - Secrets management
    - Audit logging
    - Intrusion detection
    
  data:
    - Encryption at rest
    - Encryption in transit
    - Data anonymization
    - Backup encryption
    - Key rotation
```

---

## Authentication & Authorization

### JWT Implementation
```typescript
// services/authService.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { authenticator } from 'otplib';

export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';
  private readonly TOKEN_VERSION = 1;
  
  // Generate secure tokens
  async generateTokens(userId: string, deviceId: string) {
    const tokenId = crypto.randomBytes(16).toString('hex');
    
    const accessToken = jwt.sign(
      {
        userId,
        deviceId,
        tokenId,
        type: 'access',
        version: this.TOKEN_VERSION,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        issuer: 'lotus-app',
        audience: 'lotus-api',
        algorithm: 'HS256',
      }
    );
    
    const refreshToken = jwt.sign(
      {
        userId,
        deviceId,
        tokenId,
        type: 'refresh',
        version: this.TOKEN_VERSION,
      },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        issuer: 'lotus-app',
        audience: 'lotus-api',
        algorithm: 'HS256',
      }
    );
    
    // Store refresh token in database
    await this.storeRefreshToken(userId, refreshToken, deviceId);
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
  
  // Verify and decode token
  async verifyToken(token: string, type: 'access' | 'refresh') {
    const secret = type === 'access' 
      ? process.env.JWT_SECRET! 
      : process.env.JWT_REFRESH_SECRET!;
    
    try {
      const decoded = jwt.verify(token, secret, {
        issuer: 'lotus-app',
        audience: 'lotus-api',
      }) as JWTPayload;
      
      // Check token version
      if (decoded.version !== this.TOKEN_VERSION) {
        throw new Error('Token version mismatch');
      }
      
      // Check token type
      if (decoded.type !== type) {
        throw new Error('Invalid token type');
      }
      
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(decoded.tokenId);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }
      
      return decoded;
    } catch (error) {
      throw new AuthenticationError('Invalid token');
    }
  }
  
  // Password hashing with salt
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
  
  // Password validation
  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  // Two-factor authentication
  generateTOTPSecret(): string {
    return authenticator.generateSecret();
  }
  
  verifyTOTP(token: string, secret: string): boolean {
    return authenticator.verify({
      token,
      secret,
      window: 1, // Allow 1 step before/after
    });
  }
  
  // Rate limiting for auth attempts
  async checkRateLimit(identifier: string, action: string): Promise<boolean> {
    const key = `rate_limit:${action}:${identifier}`;
    const limit = this.getRateLimit(action);
    
    const attempts = await redis.incr(key);
    
    if (attempts === 1) {
      await redis.expire(key, limit.window);
    }
    
    if (attempts > limit.max) {
      const ttl = await redis.ttl(key);
      throw new RateLimitError(`Too many attempts. Try again in ${ttl} seconds`);
    }
    
    return true;
  }
  
  private getRateLimit(action: string) {
    const limits = {
      login: { max: 5, window: 900 }, // 5 attempts per 15 minutes
      register: { max: 3, window: 3600 }, // 3 attempts per hour
      password_reset: { max: 3, window: 3600 }, // 3 attempts per hour
      verify_otp: { max: 5, window: 300 }, // 5 attempts per 5 minutes
    };
    
    return limits[action] || { max: 10, window: 60 };
  }
}
```

### RBAC Implementation
```typescript
// middleware/authorization.ts
import { Request, Response, NextFunction } from 'express';

export enum Role {
  USER = 'USER',
  PREMIUM = 'PREMIUM',
  ADMIN = 'ADMIN',
}

export enum Permission {
  READ_PLANTS = 'read:plants',
  WRITE_PLANTS = 'write:plants',
  DELETE_PLANTS = 'delete:plants',
  READ_DIAGNOSES = 'read:diagnoses',
  WRITE_DIAGNOSES = 'write:diagnoses',
  UNLIMITED_PLANTS = 'unlimited:plants',
  ADMIN_USERS = 'admin:users',
  ADMIN_CONTENT = 'admin:content',
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.READ_PLANTS,
    Permission.WRITE_PLANTS,
    Permission.DELETE_PLANTS,
    Permission.READ_DIAGNOSES,
  ],
  [Role.PREMIUM]: [
    Permission.READ_PLANTS,
    Permission.WRITE_PLANTS,
    Permission.DELETE_PLANTS,
    Permission.READ_DIAGNOSES,
    Permission.WRITE_DIAGNOSES,
    Permission.UNLIMITED_PLANTS,
  ],
  [Role.ADMIN]: [
    // Admins have all permissions
    ...Object.values(Permission),
  ],
};

export const authorize = (...requiredPermissions: Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }
    
    const userPermissions = rolePermissions[user.role as Role] || [];
    const hasPermission = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );
    
    if (!hasPermission) {
      // Log unauthorized access attempt
      await auditLog.log({
        userId: user.id,
        action: 'UNAUTHORIZED_ACCESS',
        resource: req.path,
        permissions: requiredPermissions,
        timestamp: new Date(),
      });
      
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }
    
    next();
  };
};

// Resource-based authorization
export const authorizeResource = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const resourceId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }
    
    // Check resource ownership
    const owns = await checkResourceOwnership(userId, resourceType, resourceId);
    
    if (!owns && req.user?.role !== Role.ADMIN) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Access denied to this resource' },
      });
    }
    
    next();
  };
};
```

---

## Data Protection

### Encryption Implementation
```typescript
// services/encryptionService.ts
import crypto from 'crypto';
import { KMSClient, DecryptCommand, EncryptCommand } from '@aws-sdk/client-kms';

export class EncryptionService {
  private kmsClient = new KMSClient({ region: process.env.AWS_REGION });
  private readonly algorithm = 'aes-256-gcm';
  
  // Encrypt sensitive data
  async encryptData(data: string, context?: Record<string, string>): Promise<EncryptedData> {
    // Generate data encryption key
    const dataKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    // Encrypt data with DEK
    const cipher = crypto.createCipheriv(this.algorithm, dataKey, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Encrypt DEK with KMS
    const encryptedDataKey = await this.encryptWithKMS(dataKey, context);
    
    return {
      ciphertext: encrypted,
      encryptedKey: encryptedDataKey,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: this.algorithm,
      context,
    };
  }
  
  // Decrypt sensitive data
  async decryptData(encryptedData: EncryptedData): Promise<string> {
    // Decrypt DEK with KMS
    const dataKey = await this.decryptWithKMS(
      encryptedData.encryptedKey,
      encryptedData.context
    );
    
    // Decrypt data with DEK
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(dataKey, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // Field-level encryption for database
  encryptField(value: string, fieldName: string): string {
    const key = this.deriveFieldKey(fieldName);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV, auth tag, and ciphertext
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
  
  decryptField(encryptedValue: string, fieldName: string): string {
    const [ivHex, authTagHex, ciphertext] = encryptedValue.split(':');
    
    const key = this.deriveFieldKey(fieldName);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  private deriveFieldKey(fieldName: string): Buffer {
    const masterKey = Buffer.from(process.env.FIELD_ENCRYPTION_KEY!, 'hex');
    return crypto.pbkdf2Sync(fieldName, masterKey, 100000, 32, 'sha256');
  }
  
  // Encrypt files
  async encryptFile(filePath: string): Promise<void> {
    const input = fs.createReadStream(filePath);
    const output = fs.createWriteStream(`${filePath}.encrypted`);
    
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    // Write header with encrypted key and IV
    const encryptedKey = await this.encryptWithKMS(key);
    const header = Buffer.concat([
      Buffer.from(encryptedKey, 'hex'),
      iv,
    ]);
    
    output.write(header);
    
    // Encrypt file content
    input.pipe(cipher).pipe(output);
    
    return new Promise((resolve, reject) => {
      output.on('finish', resolve);
      output.on('error', reject);
    });
  }
}
```

### Data Anonymization
```typescript
// services/dataAnonymizer.ts
export class DataAnonymizer {
  // PII detection patterns
  private readonly piiPatterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/g,
    creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
  };
  
  // Anonymize user data for analytics
  anonymizeUser(user: User): AnonymizedUser {
    return {
      id: this.hashId(user.id),
      country: user.address?.country,
      city: this.generalizeLocation(user.address?.city),
      ageGroup: this.generalizeAge(user.age),
      plantCount: this.generalizePlantCount(user.plants?.length),
      accountAge: this.getAccountAge(user.createdAt),
      isPremium: user.role === 'PREMIUM',
    };
  }
  
  // Remove PII from text
  sanitizeText(text: string): string {
    let sanitized = text;
    
    for (const [type, pattern] of Object.entries(this.piiPatterns)) {
      sanitized = sanitized.replace(pattern, `[${type.toUpperCase()}_REDACTED]`);
    }
    
    return sanitized;
  }
  
  // K-anonymity implementation
  applyKAnonymity(records: any[], k: number = 5): any[] {
    const groups = this.groupByQuasiIdentifiers(records);
    
    return groups
      .filter(group => group.length >= k)
      .flatMap(group => this.generalizeGroup(group));
  }
  
  private hashId(id: string): string {
    return crypto
      .createHash('sha256')
      .update(id + process.env.ANONYMIZATION_SALT)
      .digest('hex')
      .substring(0, 16);
  }
  
  private generalizeLocation(city?: string): string {
    if (!city) return 'Unknown';
    // Return region instead of specific city
    return this.cityToRegion[city] || 'Other';
  }
  
  private generalizeAge(age?: number): string {
    if (!age) return 'Unknown';
    if (age < 18) return 'Under 18';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    if (age < 65) return '55-64';
    return '65+';
  }
  
  private generalizePlantCount(count?: number): string {
    if (!count) return '0';
    if (count === 1) return '1';
    if (count <= 5) return '2-5';
    if (count <= 10) return '6-10';
    if (count <= 20) return '11-20';
    return '20+';
  }
}
```

---

## API Security

### Input Validation & Sanitization
```typescript
// middleware/validation.ts
import { body, param, query, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';
import sqlstring from 'sqlstring';

export class ValidationMiddleware {
  // Sanitize all inputs
  static sanitizeInputs = (req: Request, res: Response, next: NextFunction) => {
    // Sanitize body
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }
    
    // Sanitize query params
    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }
    
    // Sanitize route params
    if (req.params) {
      req.params = this.sanitizeObject(req.params);
    }
    
    next();
  };
  
  private static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      // Remove HTML/JS
      let sanitized = DOMPurify.sanitize(obj, { ALLOWED_TAGS: [] });
      
      // Escape SQL
      sanitized = sqlstring.escape(sanitized).slice(1, -1);
      
      // Remove null bytes
      sanitized = sanitized.replace(/\0/g, '');
      
      return sanitized;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        // Validate key name
        if (/^[a-zA-Z0-9_]+$/.test(key)) {
          sanitized[key] = this.sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };
  
  // Validation rules for plant endpoints
  static validatePlant = [
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Plant name must be between 1 and 100 characters'),
    
    body('scientificName')
      .optional()
      .trim()
      .matches(/^[A-Z][a-z]+ [a-z]+$/)
      .withMessage('Invalid scientific name format'),
    
    body('location.latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Invalid latitude'),
    
    body('location.longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Invalid longitude'),
    
    body('careSettings.wateringFrequency')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Watering frequency must be between 1 and 365 days'),
    
    this.handleValidationErrors,
  ];
  
  // File upload validation
  static validateFileUpload = (
    allowedTypes: string[],
    maxSize: number
  ) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({
          error: { code: 'NO_FILE', message: 'No file provided' },
        });
      }
      
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        fs.unlinkSync(file.path); // Delete uploaded file
        return res.status(400).json({
          error: { code: 'INVALID_FILE_TYPE', message: 'File type not allowed' },
        });
      }
      
      // Check file size
      if (file.size > maxSize) {
        fs.unlinkSync(file.path); // Delete uploaded file
        return res.status(413).json({
          error: { code: 'FILE_TOO_LARGE', message: `File size exceeds ${maxSize} bytes` },
        });
      }
      
      // Scan for malware (if configured)
      if (process.env.ENABLE_MALWARE_SCAN === 'true') {
        this.scanForMalware(file.path)
          .then(isSafe => {
            if (!isSafe) {
              fs.unlinkSync(file.path);
              return res.status(400).json({
                error: { code: 'MALWARE_DETECTED', message: 'File contains malware' },
              });
            }
            next();
          })
          .catch(next);
      } else {
        next();
      }
    };
  };
  
  private static handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array(),
        },
      });
    }
    
    next();
  };
}
```

### Rate Limiting
```typescript
// middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL);

// Different rate limits for different endpoints
export const rateLimiters = {
  // General API rate limit
  general: rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:general:',
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  }),
  
  // Strict limit for auth endpoints
  auth: rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:auth:',
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    skipSuccessfulRequests: true, // Don't count successful logins
    keyGenerator: (req) => {
      // Use email or IP for key
      return req.body?.email || req.ip;
    },
  }),
  
  // Plant identification (resource intensive)
  identification: rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:identify:',
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 identifications per minute
    keyGenerator: (req) => req.user?.id || req.ip,
  }),
  
  // File upload limit
  upload: rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:upload:',
    }),
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 uploads per minute
    keyGenerator: (req) => req.user?.id || req.ip,
  }),
};

// Dynamic rate limiting based on user tier
export const dynamicRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const userTier = req.user?.tier || 'free';
  
  const limits = {
    free: { windowMs: 60000, max: 60 },
    premium: { windowMs: 60000, max: 300 },
    admin: { windowMs: 60000, max: 1000 },
  };
  
  const limit = limits[userTier];
  
  rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: `rl:dynamic:${userTier}:`,
    }),
    windowMs: limit.windowMs,
    max: limit.max,
    keyGenerator: (req) => req.user?.id || req.ip,
  })(req, res, next);
};
```

---

## Mobile App Security

### React Native Security
```typescript
// security/mobileSecurityManager.ts
import {
  isJailBroken,
  isPinOrFingerprintSet,
  isEmulator,
} from 'react-native-device-info';
import RNSecureStorage from 'react-native-secure-storage';
import CryptoJS from 'crypto-js';
import { Certificate } from 'react-native-cert-pinner';

export class MobileSecurityManager {
  // Check device security
  async checkDeviceSecurity(): Promise<SecurityStatus> {
    const checks = {
      isJailbroken: await isJailBroken(),
      hasScreenLock: await isPinOrFingerprintSet(),
      isEmulator: await isEmulator(),
      isDebuggable: __DEV__,
    };
    
    const risks = [];
    
    if (checks.isJailbroken) {
      risks.push('Device is jailbroken/rooted');
    }
    
    if (!checks.hasScreenLock) {
      risks.push('No screen lock configured');
    }
    
    if (checks.isEmulator && !__DEV__) {
      risks.push('Running on emulator');
    }
    
    return {
      isSecure: risks.length === 0,
      risks,
      checks,
    };
  }
  
  // Certificate pinning
  configureCertificatePinning() {
    Certificate.configure([
      {
        url: 'api.lotus-app.com',
        pins: [
          'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
          'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=', // Backup pin
        ],
      },
    ]);
  }
  
  // Secure storage
  async secureStore(key: string, value: any): Promise<void> {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(value),
      await this.getDeviceKey()
    ).toString();
    
    await RNSecureStorage.set(key, encrypted, {
      accessible: RNSecureStorage.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      authenticatePrompt: 'Authenticate to access Lotus app data',
      service: 'com.lotus.app',
    });
  }
  
  async secureRetrieve(key: string): Promise<any> {
    const encrypted = await RNSecureStorage.get(key);
    
    if (!encrypted) return null;
    
    const decrypted = CryptoJS.AES.decrypt(
      encrypted,
      await this.getDeviceKey()
    ).toString(CryptoJS.enc.Utf8);
    
    return JSON.parse(decrypted);
  }
  
  // Anti-tampering
  async verifyAppIntegrity(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      // Check bundle ID and code signature
      const bundleId = await DeviceInfo.getBundleId();
      if (bundleId !== 'com.lotus.app') {
        return false;
      }
    } else {
      // Android: Check package signature
      const signature = await this.getAppSignature();
      const expectedSignature = process.env.ANDROID_APP_SIGNATURE;
      
      if (signature !== expectedSignature) {
        return false;
      }
    }
    
    return true;
  }
  
  // Code obfuscation settings (configured in build)
  getObfuscationConfig() {
    return {
      android: {
        enableProguardInReleaseBuilds: true,
        enableHermes: true,
      },
      ios: {
        stripSymbols: true,
        bitcodeEnabled: true,
      },
    };
  }
}
```

---

## Infrastructure Security

### AWS Security Configuration
```yaml
# infrastructure/security-config.yaml
aws_security:
  vpc:
    enable_flow_logs: true
    enable_dns_hostnames: true
    enable_dns_support: true
    
  security_groups:
    web_tier:
      ingress:
        - protocol: tcp
          port: 443
          source: 0.0.0.0/0
        - protocol: tcp
          port: 80
          source: 0.0.0.0/0
      egress:
        - protocol: -1
          port: -1
          destination: 0.0.0.0/0
    
    app_tier:
      ingress:
        - protocol: tcp
          port: 3000
          source: web_tier_sg
      egress:
        - protocol: tcp
          port: 5432
          destination: db_tier_sg
        - protocol: tcp
          port: 6379
          destination: cache_tier_sg
    
    db_tier:
      ingress:
        - protocol: tcp
          port: 5432
          source: app_tier_sg
      egress: []
  
  iam_roles:
    app_server:
      policies:
        - s3:GetObject
        - s3:PutObject
        - kms:Decrypt
        - kms:Encrypt
        - secretsmanager:GetSecretValue
    
    lambda_functions:
      policies:
        - logs:CreateLogGroup
        - logs:CreateLogStream
        - logs:PutLogEvents
        - s3:GetObject
  
  s3_buckets:
    user_uploads:
      versioning: true
      encryption: AES256
      public_access_block: true
      lifecycle_rules:
        - transition_to_ia: 30
        - transition_to_glacier: 90
        - expiration: 365
    
  rds:
    encryption: true
    backup_retention: 30
    multi_az: true
    deletion_protection: true
    
  monitoring:
    cloudtrail: true
    config: true
    guardduty: true
    security_hub: true
    inspector: true
```

### Secrets Management
```typescript
// services/secretsManager.ts
import { 
  SecretsManagerClient, 
  GetSecretValueCommand,
  RotateSecretCommand 
}# 🔒 Lotus App - Security Implementation & Deployment
*Comprehensive security measures and CI/CD pipeline configuration*

## Table of Contents
1. [Security Implementation](#security-implementation)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [API Security](#api-security)
5. [Mobile App Security](#mobile-app-security)
6. [Infrastructure Security](#infrastructure-security)
7. [Deployment Strategy](#deployment-strategy)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Release Management](#release-management)
10. [Disaster Recovery](#disaster-recovery)

---

## Security Implementation

### Security Architecture Overview
```yaml
security_layers:
  application:
    - Input validation
    - Output encoding
    - Authentication/Authorization
    - Session management
    - Error handling
    
  network:
    - HTTPS/TLS
    - Certificate pinning
    - API gateway
    - Rate limiting
    - DDoS protection
    
  infrastructure:
    - Firewall rules
    - VPC isolation
    - Secrets management
    - Audit logging
    - Intrusion detection
    
  data:
    - Encryption at rest
    - Encryption in transit
    - Data anonymization
    