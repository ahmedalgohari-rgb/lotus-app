### Secrets Management
```typescript
// services/secretsManager.ts
import { 
  SecretsManagerClient, 
  GetSecretValueCommand,
  RotateSecretCommand 
} from '@aws-sdk/client-secrets-manager';

export class SecretsManager {
  private client: SecretsManagerClient;
  private cache: Map<string, { value: string; expiry: number }> = new Map();
  
  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION,
    });
  }
  
  async getSecret(secretName: string): Promise<string> {
    // Check cache first
    const cached = this.cache.get(secretName);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }
    
    try {
      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });
      
      const response = await this.client.send(command);
      const secret = response.SecretString!;
      
      // Cache for 5 minutes
      this.cache.set(secretName, {
        value: secret,
        expiry: Date.now() + 5 * 60 * 1000,
      });
      
      return secret;
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretName}:`, error);
      throw error;
    }
  }
  
  async rotateSecret(secretName: string): Promise<void> {
    const command = new RotateSecretCommand({
      SecretId: secretName,
      RotationLambdaARN: process.env.ROTATION_LAMBDA_ARN,
      RotationRules: {
        AutomaticallyAfterDays: 30,
      },
    });
    
    await this.client.send(command);
    
    // Clear cache after rotation
    this.cache.delete(secretName);
  }
  
  // Load all application secrets
  async loadApplicationSecrets(): Promise<void> {
    const secrets = [
      'lotus-app/database',
      'lotus-app/jwt',
      'lotus-app/api-keys',
      'lotus-app/encryption',
    ];
    
    for (const secretName of secrets) {
      const secretData = await this.getSecret(secretName);
      const parsed = JSON.parse(secretData);
      
      // Set environment variables
      Object.entries(parsed).forEach(([key, value]) => {
        process.env[key] = value as string;
      });
    }
  }
}

export const secretsManager = new SecretsManager();
```

---

## Deployment Strategy

### Environment Configuration
```yaml
# deployment/environments.yaml
environments:
  development:
    api_url: https://dev-api.lotus-app.com
    database: lotus_dev
    features:
      plant_doctor: true
      community: true
      premium: false
    monitoring:
      level: debug
      sampling_rate: 1.0
    
  staging:
    api_url: https://staging-api.lotus-app.com
    database: lotus_staging
    features:
      plant_doctor: true
      community: true
      premium: true
    monitoring:
      level: info
      sampling_rate: 0.5
    
  production:
    api_url: https://api.lotus-app.com
    database: lotus_prod
    features:
      plant_doctor: true
      community: false
      premium: true
    monitoring:
      level: warning
      sampling_rate: 0.1
```

### Blue-Green Deployment
```typescript
// deployment/blueGreenDeploy.ts
export class BlueGreenDeployment {
  private readonly elbClient = new ELBv2Client({ region: process.env.AWS_REGION });
  private readonly ecsClient = new ECSClient({ region: process.env.AWS_REGION });
  
  async deploy(version: string): Promise<void> {
    console.log(`Starting blue-green deployment for version ${version}`);
    
    try {
      // 1. Deploy to green environment
      await this.deployToEnvironment('green', version);
      
      // 2. Run health checks
      await this.runHealthChecks('green');
      
      // 3. Run smoke tests
      await this.runSmokeTests('green');
      
      // 4. Switch traffic gradually
      await this.switchTraffic();
      
      // 5. Monitor for errors
      await this.monitorDeployment();
      
      // 6. Complete or rollback
      const success = await this.validateDeployment();
      
      if (success) {
        await this.completeDeployment();
        console.log('Deployment successful');
      } else {
        await this.rollback();
        throw new Error('Deployment failed, rolled back');
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      await this.rollback();
      throw error;
    }
  }
  
  private async switchTraffic(): Promise<void> {
    const stages = [
      { percentage: 10, duration: 300000 },  // 10% for 5 minutes
      { percentage: 25, duration: 300000 },  // 25% for 5 minutes
      { percentage: 50, duration: 300000 },  // 50% for 5 minutes
      { percentage: 75, duration: 300000 },  // 75% for 5 minutes
      { percentage: 100, duration: 0 },      // 100%
    ];
    
    for (const stage of stages) {
      await this.updateTargetGroupWeights(stage.percentage);
      
      if (stage.duration > 0) {
        console.log(`Traffic at ${stage.percentage}%, waiting ${stage.duration}ms`);
        await this.sleep(stage.duration);
        
        // Check metrics during each stage
        const healthy = await this.checkMetrics();
        if (!healthy) {
          throw new Error(`Unhealthy metrics at ${stage.percentage}% traffic`);
        }
      }
    }
  }
  
  private async runHealthChecks(environment: string): Promise<void> {
    const healthEndpoint = `https://${environment}-api.lotus-app.com/health`;
    
    for (let i = 0; i < 10; i++) {
      const response = await fetch(healthEndpoint);
      
      if (response.ok) {
        const health = await response.json();
        
        if (health.status === 'healthy') {
          console.log(`Health check passed for ${environment}`);
          return;
        }
      }
      
      console.log(`Health check attempt ${i + 1} failed, retrying...`);
      await this.sleep(5000);
    }
    
    throw new Error(`Health checks failed for ${environment}`);
  }
  
  private async runSmokeTests(environment: string): Promise<void> {
    const tests = [
      this.testAuthentication,
      this.testPlantIdentification,
      this.testDatabaseConnection,
      this.testCacheConnection,
    ];
    
    for (const test of tests) {
      await test(environment);
    }
  }
  
  private async monitorDeployment(): Promise<void> {
    const metrics = [
      { name: 'ErrorRate', threshold: 0.01 },
      { name: 'ResponseTime', threshold: 500 },
      { name: 'CPUUtilization', threshold: 80 },
      { name: 'MemoryUtilization', threshold: 80 },
    ];
    
    for (const metric of metrics) {
      const value = await this.getMetricValue(metric.name);
      
      if (value > metric.threshold) {
        throw new Error(`Metric ${metric.name} exceeded threshold: ${value} > ${metric.threshold}`);
      }
    }
  }
}
```

---

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/cicd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [created]

env:
  NODE_VERSION: '20'
  AWS_REGION: 'me-south-1'

jobs:
  # Code Quality
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Security audit
        run: npm audit --audit-level=moderate

  # Testing
  test:
    needs: quality
    runs-on: ubuntu-latest
    
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
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup test database
        run: |
          npm run db:push
          npm run db:seed:test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run tests
        run: npm run test:ci
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests

  # Build Mobile Apps
  build-mobile:
    needs: test
    strategy:
      matrix:
        platform: [ios, android]
    
    runs-on: ${{ matrix.platform == 'ios' && 'macos-latest' || 'ubuntu-latest' }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies
        run: |
          npm ci
          cd ${{ matrix.platform }} && npm ci
      
      - name: Setup Java (Android)
        if: matrix.platform == 'android'
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      
      - name: Build Android
        if: matrix.platform == 'android'
        run: |
          cd android
          ./gradlew assembleRelease
        env:
          KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
      
      - name: Setup Xcode (iOS)
        if: matrix.platform == 'ios'
        uses: maxim-lobanov/setup-xcode@v1
        with:
          xcode-version: latest-stable
      
      - name: Install CocoaPods (iOS)
        if: matrix.platform == 'ios'
        run: |
          cd ios
          pod install
      
      - name: Build iOS
        if: matrix.platform == 'ios'
        run: |
          cd ios
          xcodebuild -workspace LotusApp.xcworkspace \
            -scheme LotusApp \
            -configuration Release \
            -archivePath build/LotusApp.xcarchive \
            archive
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.platform }}-build
          path: |
            android/app/build/outputs/apk/release/*.apk
            ios/build/*.xcarchive

  # Build and Deploy Backend
  deploy-backend:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/lotus-backend:$IMAGE_TAG .
          docker push $ECR_REGISTRY/lotus-backend:$IMAGE_TAG
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster lotus-cluster \
            --service lotus-backend \
            --force-new-deployment \
            --region ${{ env.AWS_REGION }}
      
      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster lotus-cluster \
            --services lotus-backend \
            --region ${{ env.AWS_REGION }}

  # Deploy to Production
  deploy-production:
    needs: [build-mobile, deploy-backend]
    if: github.event_name == 'release'
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Production deployment script
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production
RUN npm install -g @prisma/client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:20-alpine

RUN apk add --no-cache tini

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
```

---

## Release Management

### Version Control Strategy
```yaml
# release/strategy.yaml
branching_model:
  main: Production-ready code
  develop: Integration branch
  feature/*: New features
  bugfix/*: Bug fixes
  hotfix/*: Emergency fixes
  release/*: Release preparation

versioning:
  format: MAJOR.MINOR.PATCH
  rules:
    - MAJOR: Breaking changes
    - MINOR: New features
    - PATCH: Bug fixes
  
release_process:
  1. Create release branch from develop
  2. Update version numbers
  3. Run full test suite
  4. Build release candidates
  5. Deploy to staging
  6. Perform UAT
  7. Merge to main
  8. Tag release
  9. Deploy to production
  10. Merge back to develop
```

### Release Notes Generator
```typescript
// scripts/generateReleaseNotes.ts
import { Octokit } from '@octokit/rest';
import { execSync } from 'child_process';

export class ReleaseNotesGenerator {
  private octokit: Octokit;
  
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }
  
  async generate(fromTag: string, toTag: string): Promise<string> {
    const commits = this.getCommits(fromTag, toTag);
    const pullRequests = await this.getPullRequests(fromTag, toTag);
    const issues = await this.getClosedIssues(fromTag, toTag);
    
    return this.formatReleaseNotes({
      version: toTag,
      date: new Date().toISOString(),
      commits,
      pullRequests,
      issues,
    });
  }
  
  private getCommits(fromTag: string, toTag: string): Commit[] {
    const log = execSync(
      `git log ${fromTag}..${toTag} --pretty=format:"%H|%s|%an|%ae"`,
      { encoding: 'utf-8' }
    );
    
    return log.split('\n').map(line => {
      const [hash, subject, author, email] = line.split('|');
      return {
        hash,
        subject,
        author,
        email,
        type: this.getCommitType(subject),
      };
    });
  }
  
  private getCommitType(subject: string): string {
    if (subject.startsWith('feat:')) return 'feature';
    if (subject.startsWith('fix:')) return 'bugfix';
    if (subject.startsWith('docs:')) return 'documentation';
    if (subject.startsWith('perf:')) return 'performance';
    if (subject.startsWith('security:')) return 'security';
    return 'other';
  }
  
  private formatReleaseNotes(data: ReleaseData): string {
    return `
# Release ${data.version}
*Released on ${data.date}*

## 🎉 New Features
${this.formatSection(data.commits.filter(c => c.type === 'feature'))}

## 🐛 Bug Fixes
${this.formatSection(data.commits.filter(c => c.type === 'bugfix'))}

## 🔒 Security Updates
${this.formatSection(data.commits.filter(c => c.type === 'security'))}

## ⚡ Performance Improvements
${this.formatSection(data.commits.filter(c => c.type === 'performance'))}

## 📝 Documentation
${this.formatSection(data.commits.filter(c => c.type === 'documentation'))}

## Contributors
${this.formatContributors(data.commits)}
`;
  }
}
```

---

## Disaster Recovery

### Backup Strategy
```yaml
# disaster-recovery/backup-strategy.yaml
backup_configuration:
  database:
    frequency: hourly
    retention:
      hourly: 24
      daily: 7
      weekly: 4
      monthly: 12
    method: automated_snapshots
    encryption: true
    cross_region_copy: true
    
  files:
    frequency: daily
    retention: 30_days
    storage: s3_glacier
    encryption: true
    
  code:
    repository: github
    branches: all
    tags: all
    
recovery_objectives:
  rpo: 1_hour  # Recovery Point Objective
  rto: 4_hours # Recovery Time Objective
  
testing:
  frequency: quarterly
  scenarios:
    - database_failure
    - region_failure
    - data_corruption
    - security_breach
```

### Disaster Recovery Procedures
```typescript
// disaster-recovery/procedures.ts
export class DisasterRecovery {
  async executeRecovery(scenario: string): Promise<void> {
    console.log(`Initiating disaster recovery for: ${scenario}`);
    
    switch (scenario) {
      case 'database_failure':
        await this.recoverDatabase();
        break;
      case 'region_failure':
        await this.failoverToBackupRegion();
        break;
      case 'data_corruption':
        await this.restoreFromBackup();
        break;
      case 'security_breach':
        await this.securityIncidentResponse();
        break;
      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }
  }
  
  private async recoverDatabase(): Promise<void> {
    // 1. Identify latest clean backup
    const backup = await this.identifyLatestBackup();
    
    // 2. Create new database instance
    const newDb = await this.createDatabaseInstance();
    
    // 3. Restore from backup
    await this.restoreDatabase(newDb, backup);
    
    // 4. Verify data integrity
    await this.verifyDataIntegrity(newDb);
    
    // 5. Update connection strings
    await this.updateConnectionStrings(newDb);
    
    // 6. Restart services
    await this.restartServices();
  }
  
  private async failoverToBackupRegion(): Promise<void> {
    // 1. Activate standby infrastructure
    await this.activateStandbyRegion();
    
    // 2. Update DNS records
    await this.updateDNSRecords();
    
    // 3. Verify services
    await this.verifyServices();
    
    // 4. Notify team
    await this.notifyTeam('Region failover completed');
  }
  
  private async securityIncidentResponse(): Promise<void> {
    // 1. Isolate affected systems
    await this.isolateSystems();
    
    // 2. Revoke all tokens
    await this.revokeAllTokens();
    
    // 3. Force password resets
    await this.forcePasswordResets();
    
    // 4. Rotate all secrets
    await this.rotateSecrets();
    
    // 5. Deploy patched version
    await this.deployPatchedVersion();
    
    // 6. Audit and monitor
    await this.enableEnhancedMonitoring();
  }
}
```

---

*Document Version: 1.0.0*
*Last Updated: Security & Deployment Phase*
*Next Review: Pre-Production Launch*security_layers:
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
    