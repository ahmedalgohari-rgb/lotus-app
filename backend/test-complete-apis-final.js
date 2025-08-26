// backend/test-complete-apis-final.js
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const BASE_URL = 'http://localhost:3000';
const prisma = new PrismaClient();

async function testCompleteAPI() {
  console.log('🧪 Testing Complete Lotus Plant API...\n');

  try {
    // Create and verify test user
    console.log('1️⃣ Setting up verified test user...');
    const testEmail = `test${Date.now()}@lotus.com`;
    
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: testEmail,
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      deviceId: '550e8400-e29b-41d4-a716-446655440000'
    });
    
    const testUserId = registerResponse.data.user.id;
    
    // Manually verify email for testing
    await prisma.user.update({
      where: { id: testUserId },
      data: { 
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      }
    });
    
    // Login with verified user
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testEmail,
      password: 'TestPass123!',
      deviceId: '550e8400-e29b-41d4-a716-446655440000'
    });
    
    const authToken = loginResponse.data.tokens.accessToken;
    console.log('✅ User setup completed');

    // Test Plant Creation
    console.log('\n2️⃣ Testing Plant Creation...');
    const plantResponse = await axios.post(`${BASE_URL}/api/plants`, {
      name: 'My Test Golden Pothos',
      scientificName: 'Epipremnum aureum',
      variety: 'Golden',
      wateringFrequency: 7,
      sunlightRequirement: 'partial',
      temperatureMin: 18,
      temperatureMax: 25,
      location: JSON.stringify({
        city: 'Cairo',
        governorate: 'Cairo'
      })
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const testPlantId = plantResponse.data.plant.id;
    console.log('✅ Plant created:', plantResponse.data.plant.name);

    // Test Get Plants
    console.log('\n3️⃣ Testing Get Plants...');
    const getPlantsResponse = await axios.get(`${BASE_URL}/api/plants`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Plants retrieved:', getPlantsResponse.data.plants.length, 'plants');

    // Test Get Single Plant
    console.log('\n4️⃣ Testing Get Single Plant...');
    const getSinglePlantResponse = await axios.get(`${BASE_URL}/api/plants/${testPlantId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('DEBUG - Single plant response:', JSON.stringify(getSinglePlantResponse.data, null, 2));
    console.log('✅ Single plant retrieved:', getSinglePlantResponse.data.plant.name);

    // Test Care Logging
    console.log('\n5️⃣ Testing Care Logging...');
    const careResponse = await axios.post(`${BASE_URL}/api/care`, {
      plantId: testPlantId,
      type: 'WATERING',
      notes: 'Watered thoroughly, soil was dry'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Care logged:', careResponse.data.data.careLog.type);

    // Test Care History
    console.log('\n6️⃣ Testing Care History...');
    const careHistoryResponse = await axios.get(`${BASE_URL}/api/care/plant/${testPlantId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Care history:', careHistoryResponse.data.data.careHistory.length, 'entries');

    // Test Plant Update
    console.log('\n7️⃣ Testing Plant Update...');
    const updateResponse = await axios.put(`${BASE_URL}/api/plants/${testPlantId}`, {
      name: 'My Updated Golden Pothos',
      wateringFrequency: 5
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Plant updated:', updateResponse.data.data.plant.name);

    // Test Statistics
    console.log('\n8️⃣ Testing Statistics...');
    const plantStatsResponse = await axios.get(`${BASE_URL}/api/plants/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Plant stats - Total:', plantStatsResponse.data.data.stats.total);

    const careStatsResponse = await axios.get(`${BASE_URL}/api/care/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Care stats - Total actions:', careStatsResponse.data.data.stats.totalActions);

    // Test Plant Deletion
    console.log('\n9️⃣ Testing Plant Deletion...');
    const deleteResponse = await axios.delete(`${BASE_URL}/api/plants/${testPlantId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Plant deleted successfully');

    console.log('\n🎉 Core API tests completed successfully!\n');
    console.log('📊 Test Summary:');
    console.log('- ✅ User Authentication with email verification');
    console.log('- ✅ Plant CRUD operations (Create, Read, Update, Delete)');
    console.log('- ✅ Care logging and history tracking');
    console.log('- ✅ Statistics and analytics');
    console.log('\n🚀 Lotus Plant API core functionality verified!');

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

testCompleteAPI();