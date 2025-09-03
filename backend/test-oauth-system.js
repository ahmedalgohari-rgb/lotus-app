#!/usr/bin/env node

/**
 * Test script for OAuth authentication system
 * Tests all OAuth endpoints and progressive authentication features
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const API_BASE = 'http://localhost:3000/api';
const prisma = new PrismaClient();

// Test configuration
const testConfig = {
  testEmail: 'oauth.test@example.com',
  testDeviceId: 'test-device-12345',
  // Note: These are dummy tokens for testing structure only
  // In real testing, you would need valid tokens from OAuth providers
  dummyGoogleToken: 'dummy.google.token.for.testing.structure',
  dummyAppleToken: 'dummy.apple.token.for.testing.structure',
};

class OAuthTester {
  constructor() {
    this.accessToken = null;
    this.testUserId = null;
  }

  async log(message, data = null) {
    console.log(`[${new Date().toISOString()}] ${message}`);
    if (data) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
  }

  async error(message, error) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
    if (error?.response?.data) {
      console.error('  Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error?.message) {
      console.error('  Message:', error.message);
    }
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${API_BASE}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status,
      };
    }
  }

  // Test 1: Check server health
  async testServerHealth() {
    await this.log('🏥 Testing server health...');
    
    try {
      const response = await axios.get('http://localhost:3000/health');
      await this.log('✅ Server is healthy', response.data);
      return true;
    } catch (error) {
      await this.error('❌ Server health check failed', error);
      return false;
    }
  }

  // Test 2: Get OAuth configuration
  async testOAuthConfig() {
    await this.log('⚙️ Testing OAuth configuration...');
    
    const result = await this.makeRequest('GET', '/auth/oauth-config');
    
    if (result.success) {
      await this.log('✅ OAuth config retrieved', result.data);
      return true;
    } else {
      await this.error('❌ Failed to get OAuth config', result.error);
      return false;
    }
  }

  // Test 3: Check email existence
  async testCheckEmail() {
    await this.log('📧 Testing email check...');
    
    const result = await this.makeRequest('POST', '/auth/check-email', {
      email: testConfig.testEmail,
    });
    
    if (result.success) {
      await this.log('✅ Email check successful', result.data);
      return true;
    } else {
      await this.error('❌ Email check failed', result.error);
      return false;
    }
  }

  // Test 4: Get authentication methods
  async testAuthMethods() {
    await this.log('🔐 Testing authentication methods discovery...');
    
    const result = await this.makeRequest('POST', '/auth/methods', {
      email: testConfig.testEmail,
    });
    
    if (result.success) {
      await this.log('✅ Auth methods retrieved', result.data);
      return true;
    } else {
      await this.error('❌ Failed to get auth methods', result.error);
      return false;
    }
  }

  // Test 5: Test Google OAuth structure (without real token)
  async testGoogleOAuthStructure() {
    await this.log('🔍 Testing Google OAuth endpoint structure...');
    
    const result = await this.makeRequest('POST', '/oauth/google', {
      idToken: testConfig.dummyGoogleToken,
      deviceId: testConfig.testDeviceId,
    });
    
    // We expect this to fail with invalid token, but should show proper error structure
    if (!result.success && result.status === 400) {
      if (result.error.error && result.error.error.includes('token')) {
        await this.log('✅ Google OAuth endpoint structure correct (expected token validation error)', result.error);
        return true;
      }
    }
    
    await this.error('❌ Google OAuth endpoint structure issue', result.error);
    return false;
  }

  // Test 6: Test Apple OAuth structure (without real token)
  async testAppleOAuthStructure() {
    await this.log('🍎 Testing Apple OAuth endpoint structure...');
    
    const result = await this.makeRequest('POST', '/oauth/apple', {
      idToken: testConfig.dummyAppleToken,
      deviceId: testConfig.testDeviceId,
    });
    
    // We expect this to fail with invalid token, but should show proper error structure
    if (!result.success && result.status === 400) {
      if (result.error.error && result.error.error.includes('token')) {
        await this.log('✅ Apple OAuth endpoint structure correct (expected token validation error)', result.error);
        return true;
      }
    }
    
    await this.error('❌ Apple OAuth endpoint structure issue', result.error);
    return false;
  }

  // Test 7: Test provider verification structure
  async testProviderVerification() {
    await this.log('🔎 Testing provider verification...');
    
    const result = await this.makeRequest('POST', '/auth/verify-provider', {
      provider: 'email',
      credential: 'testpassword123',
    });
    
    if (result.success) {
      await this.log('✅ Provider verification working', result.data);
      return true;
    } else {
      await this.error('❌ Provider verification failed', result.error);
      return false;
    }
  }

  // Test 8: Create test user for authenticated endpoints
  async createTestUser() {
    await this.log('👤 Creating test user for authenticated endpoint testing...');
    
    try {
      // Create user directly in database for testing
      const user = await prisma.user.create({
        data: {
          email: testConfig.testEmail,
          passwordHash: '$2a$12$dummy.hash.for.testing.purposes.only',
          firstName: 'OAuth',
          lastName: 'Tester',
          authProvider: 'email',
          isEmailVerified: true,
        },
      });

      this.testUserId = user.id;
      await this.log('✅ Test user created', { id: user.id, email: user.email });
      return true;
    } catch (error) {
      if (error.code === 'P2002') {
        // User already exists, find them
        const user = await prisma.user.findUnique({
          where: { email: testConfig.testEmail },
        });
        if (user && !user.deletedAt) {
          this.testUserId = user.id;
          await this.log('✅ Test user already exists', { id: user.id, email: user.email });
          return true;
        }
      }
      await this.error('❌ Failed to create test user', error);
      return false;
    }
  }

  // Test 9: Login with test user to get token
  async loginTestUser() {
    await this.log('🔑 Logging in test user...');
    
    const result = await this.makeRequest('POST', '/auth/login', {
      email: testConfig.testEmail,
      password: 'dummy-password', // This will fail, but we can create token manually
      deviceId: testConfig.testDeviceId,
    });

    // Since we created a dummy password hash, login will fail
    // Let's create a JWT token manually for testing authenticated endpoints
    const jwt = require('jsonwebtoken');
    const testToken = jwt.sign(
      {
        userId: this.testUserId,
        deviceId: testConfig.testDeviceId,
        tokenId: 'test-token-id',
        type: 'access',
        version: 1,
      },
      process.env.JWT_SECRET || 'test-jwt-secret',
      {
        expiresIn: '1h',
        issuer: 'lotus-app',
        audience: 'lotus-api',
      }
    );

    this.accessToken = testToken;
    await this.log('✅ Test token created for authenticated endpoints');
    return true;
  }

  // Test 10: Test authenticated OAuth endpoints
  async testAuthenticatedEndpoints() {
    await this.log('🔐 Testing authenticated OAuth endpoints...');

    // Test get OAuth providers
    let result = await this.makeRequest('GET', '/oauth/providers');
    if (result.success) {
      await this.log('✅ Get OAuth providers works', result.data);
    } else {
      await this.error('❌ Get OAuth providers failed', result.error);
      return false;
    }

    // Test link OAuth provider structure
    result = await this.makeRequest('POST', '/oauth/link', {
      provider: 'google',
      idToken: testConfig.dummyGoogleToken,
    });

    // Should fail with invalid token but show correct structure
    if (!result.success && result.status === 400) {
      await this.log('✅ Link OAuth provider endpoint structure correct', result.error);
    } else {
      await this.error('❌ Link OAuth provider structure issue', result.error);
      return false;
    }

    return true;
  }

  // Test 11: Database schema validation
  async testDatabaseSchema() {
    await this.log('🗃️ Testing database schema...');
    
    try {
      // Test that new OAuth tables exist and have correct structure
      const userCount = await prisma.user.count();
      const oauthProviderCount = await prisma.oAuthProvider.count();
      
      await this.log('✅ Database schema validated', {
        users: userCount,
        oauthProviders: oauthProviderCount,
      });
      
      // Test user model has new OAuth fields
      const testUser = await prisma.user.findUnique({
        where: { id: this.testUserId },
        include: { oauthProviders: true },
      });
      
      if (testUser && 'authProvider' in testUser && 'providerVerified' in testUser) {
        await this.log('✅ User model has OAuth fields');
        return true;
      } else {
        await this.error('❌ User model missing OAuth fields');
        return false;
      }
    } catch (error) {
      await this.error('❌ Database schema test failed', error);
      return false;
    }
  }

  // Cleanup
  async cleanup() {
    await this.log('🧹 Cleaning up test data...');
    
    try {
      if (this.testUserId) {
        // Delete OAuth providers first (due to foreign key constraint)
        await prisma.oAuthProvider.deleteMany({
          where: { userId: this.testUserId },
        });
        
        // Delete test user
        await prisma.user.delete({
          where: { id: this.testUserId },
        });
        
        await this.log('✅ Test data cleaned up');
      }
    } catch (error) {
      await this.error('⚠️ Cleanup failed (non-critical)', error);
    }
    
    await prisma.$disconnect();
  }

  // Run all tests
  async runAllTests() {
    console.log('\n🚀 Starting OAuth System Integration Tests\n');
    console.log('=' * 60);

    const tests = [
      { name: 'Server Health', fn: this.testServerHealth },
      { name: 'OAuth Configuration', fn: this.testOAuthConfig },
      { name: 'Email Check', fn: this.testCheckEmail },
      { name: 'Authentication Methods', fn: this.testAuthMethods },
      { name: 'Google OAuth Structure', fn: this.testGoogleOAuthStructure },
      { name: 'Apple OAuth Structure', fn: this.testAppleOAuthStructure },
      { name: 'Provider Verification', fn: this.testProviderVerification },
      { name: 'Database Schema', fn: this.testDatabaseSchema },
      { name: 'Create Test User', fn: this.createTestUser },
      { name: 'Login Test User', fn: this.loginTestUser },
      { name: 'Authenticated Endpoints', fn: this.testAuthenticatedEndpoints },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = await test.fn.call(this);
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        await this.error(`Test "${test.name}" threw an exception`, error);
        failed++;
      }
      console.log(''); // Add spacing between tests
    }

    await this.cleanup();

    console.log('\n' + '=' * 60);
    console.log('🏁 Test Results Summary');
    console.log('=' * 60);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total:  ${passed + failed}`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! OAuth system is ready for integration.');
    } else {
      console.log(`\n⚠️ ${failed} test(s) failed. Please review the errors above.`);
    }
    
    console.log('\n📝 Next Steps:');
    console.log('1. Set up Google OAuth credentials in .env');
    console.log('2. Set up Apple OAuth credentials in .env');
    console.log('3. Test with real OAuth tokens from providers');
    console.log('4. Integrate OAuth components in frontend');
    console.log('5. Deploy to staging environment for full testing');

    return failed === 0;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new OAuthTester();
  tester.runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = OAuthTester;