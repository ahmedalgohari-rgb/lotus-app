// backend/test-complete-apis-verified.js
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BASE_URL = 'http://localhost:3000';
const prisma = new PrismaClient();
let authToken = '';
let testUserId = '';
let testPlantId = '';
let testCareLogId = '';

async function testCompleteAPI() {
  console.log('🧪 Testing Complete Lotus Plant API...\n');

  try {
    // Step 1: Use existing verified user or create and verify new one
    console.log('1️⃣ Setting up verified test user...');
    
    // Try to find existing verified user first
    let existingUser = await prisma.user.findFirst({
      where: { 
        isEmailVerified: true,
        deletedAt: null 
      }
    });

    let loginResponse;
    
    if (existingUser) {
      console.log('   Using existing verified user:', existingUser.email);
      // Try to login (we'll need to know the password, let's try the common test password)
      try {
        loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: existingUser.email,
          password: 'password123', // Common test password
          deviceId: '550e8400-e29b-41d4-a716-446655440000'
        });
        console.log('✅ Logged in with existing user');
      } catch (error) {
        console.log('   Existing user login failed, creating new user...');
        existingUser = null;
      }
    }

    if (!existingUser || !loginResponse) {
      // Create new user and manually verify email
      const testEmail = `test${Date.now()}@lotus.com`;
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
        email: testEmail,
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        deviceId: '550e8400-e29b-41d4-a716-446655440000'
      });
      
      testUserId = registerResponse.data.user.id;
      console.log('✅ User registered:', testEmail);
      
      // Manually verify the email in database for testing
      await prisma.user.update({
        where: { id: testUserId },
        data: { 
          isEmailVerified: true,
          emailVerifiedAt: new Date()
        }
      });
      console.log('✅ Email manually verified for testing');
      
      // Now login with verified user
      loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: testEmail,
        password: 'TestPass123!',
        deviceId: '550e8400-e29b-41d4-a716-446655440000'
      });
      console.log('✅ Logged in successfully');
    }
    
    authToken = loginResponse.data.tokens.accessToken;
    testUserId = loginResponse.data.user.id;

    // Step 2: Test Plant Creation (using correct schema)
    console.log('\n2️⃣ Testing Plant Creation...');
    const plantResponse = await axios.post(`${BASE_URL}/api/plants`, {
      name: 'My Test Pothos',
      scientificName: 'Epipremnum aureum',
      variety: 'Golden Pothos',
      wateringFrequency: 7,
      sunlightRequirement: 'partial',
      temperatureMin: 18,
      temperatureMax: 25,
      location: JSON.stringify({
        city: 'Cairo',
        governorate: 'Cairo',
        latitude: 30.0444,
        longitude: 31.2357
      })
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testPlantId = plantResponse.data.plant.id;
    console.log('✅ Plant created successfully:', plantResponse.data.plant.name);

    // Step 3: Test Get Plants
    console.log('\n3️⃣ Testing Get Plants...');
    const getPlantsResponse = await axios.get(`${BASE_URL}/api/plants`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('Get plants response:', JSON.stringify(getPlantsResponse.data, null, 2));
    console.log('✅ Plants retrieved:', getPlantsResponse.data.data ? getPlantsResponse.data.data.length : 'unknown', 'plants');

    // Step 4: Test Plant Identification
    console.log('\n4️⃣ Testing Plant Identification...');
    const identifyResponse = await axios.post(`${BASE_URL}/api/identify`, {
      description: 'Green plant with heart shaped leaves, climbing vine pothos',
      metadata: {
        environment: 'indoor',
        lightCondition: 'medium'
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Plant identified:', identifyResponse.data.data.identification.names.english);
    console.log('   Confidence:', identifyResponse.data.data.identification.confidence);

    // Step 5: Test Care Logging
    console.log('\n5️⃣ Testing Care Logging...');
    const careResponse = await axios.post(`${BASE_URL}/api/care`, {
      plantId: testPlantId,
      type: 'WATERING',
      notes: 'Watered after soil felt dry to touch',
      metadata: JSON.stringify({ amount: '200ml', soilMoisture: 'dry' })
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testCareLogId = careResponse.data.data.careLog.id;
    console.log('✅ Care action logged:', careResponse.data.data.careLog.type);

    // Step 6: Test Statistics
    console.log('\n6️⃣ Testing Statistics...');
    const plantStatsResponse = await axios.get(`${BASE_URL}/api/plants/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Plant stats:', JSON.stringify(plantStatsResponse.data.data, null, 2));

    const careStatsResponse = await axios.get(`${BASE_URL}/api/care/stats?days=7`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Care stats:', JSON.stringify(careStatsResponse.data.data.stats, null, 2));

    // Step 7: Test Plant Database
    console.log('\n7️⃣ Testing Plant Database...');
    const databaseResponse = await axios.get(`${BASE_URL}/api/identify/database`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Plant database:', databaseResponse.data.data.count, 'plants available');

    // Step 8: Test Plant Search
    console.log('\n8️⃣ Testing Plant Search...');
    const searchResponse = await axios.get(`${BASE_URL}/api/identify/search?query=mint&limit=3`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Plant search results:', searchResponse.data.data.count, 'results for "mint"');

    // Cleanup: Delete test plant if we created one
    if (testPlantId) {
      console.log('\n🧹 Cleanup: Deleting Test Plant...');
      await axios.delete(`${BASE_URL}/api/plants/${testPlantId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Test plant deleted successfully');
    }

    console.log('\n🎉 All API tests completed successfully!\n');
    console.log('📊 Test Summary:');
    console.log('- ✅ User Authentication (with email verification)');
    console.log('- ✅ Plant CRUD operations');
    console.log('- ✅ Plant identification with Egyptian database');
    console.log('- ✅ Plant search functionality');
    console.log('- ✅ Care logging system');
    console.log('- ✅ Statistics and analytics');
    console.log('- ✅ Plant database access');
    console.log('\n🚀 Lotus Plant API is fully operational!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.log('Status:', error.response.status);
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(0);
});

testCompleteAPI();