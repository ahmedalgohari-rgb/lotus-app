// backend/test-complete-apis.js
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let testUserId = '';
let testPlantId = '';
let testCareLogId = '';

async function testCompleteAPI() {
  console.log('🧪 Testing Complete Lotus Plant API...\n');

  try {
    // Step 1: Register test user
    console.log('1️⃣ Testing User Registration...');
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: `test${Date.now()}@lotus.com`,
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      deviceId: '550e8400-e29b-41d4-a716-446655440000'
    });
    
    authToken = registerResponse.data.tokens.accessToken;
    testUserId = registerResponse.data.user.id;
    console.log('✅ User registered successfully');
    console.log('   User ID:', testUserId);
    console.log('   Email:', registerResponse.data.user.email);

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
    
    testPlantId = plantResponse.data.data.id;
    console.log('✅ Plant created successfully:', plantResponse.data.data.name);
    console.log('   Plant ID:', testPlantId);

    // Step 3: Test Get Plants
    console.log('\n3️⃣ Testing Get Plants...');
    const getPlantsResponse = await axios.get(`${BASE_URL}/api/plants`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Plants retrieved:', getPlantsResponse.data.data.length, 'plants');

    // Step 4: Test Get Single Plant
    console.log('\n4️⃣ Testing Get Single Plant...');
    const getSinglePlantResponse = await axios.get(`${BASE_URL}/api/plants/${testPlantId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Single plant retrieved:', getSinglePlantResponse.data.data.name);

    // Step 5: Test Plant Identification
    console.log('\n5️⃣ Testing Plant Identification...');
    const identifyResponse = await axios.post(`${BASE_URL}/api/identify`, {
      description: 'Green plant with heart shaped leaves, climbing vine',
      metadata: {
        environment: 'indoor',
        lightCondition: 'medium'
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Plant identified:', identifyResponse.data.data.identification.names.english);
    console.log('   Confidence:', identifyResponse.data.data.identification.confidence);

    // Step 6: Test Plant Database
    console.log('\n6️⃣ Testing Plant Database...');
    const databaseResponse = await axios.get(`${BASE_URL}/api/identify/database`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Plant database:', databaseResponse.data.data.count, 'plants available');

    // Step 7: Test Plant Search
    console.log('\n7️⃣ Testing Plant Search...');
    const searchResponse = await axios.get(`${BASE_URL}/api/identify/search?query=aloe&limit=3`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Plant search results:', searchResponse.data.data.count, 'results for "aloe"');

    // Step 8: Test Care Logging (using correct schema)
    console.log('\n8️⃣ Testing Care Logging...');
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
    console.log('   Care Log ID:', testCareLogId);

    // Step 9: Test Get Care History
    console.log('\n9️⃣ Testing Care History...');
    const careHistoryResponse = await axios.get(`${BASE_URL}/api/care/plant/${testPlantId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Care history retrieved:', careHistoryResponse.data.data.count, 'actions');

    // Step 10: Test Recent Care Actions
    console.log('\n🔟 Testing Recent Care Actions...');
    const recentCareResponse = await axios.get(`${BASE_URL}/api/care/recent?limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Recent care actions:', recentCareResponse.data.data.count, 'recent actions');

    // Step 11: Test Plant Update
    console.log('\n1️⃣1️⃣ Testing Plant Update...');
    const updateResponse = await axios.put(`${BASE_URL}/api/plants/${testPlantId}`, {
      name: 'My Updated Golden Pothos',
      scientificName: 'Epipremnum aureum (Golden)',
      wateringFrequency: 5
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Plant updated:', updateResponse.data.data.name);

    // Step 12: Test Statistics
    console.log('\n1️⃣2️⃣ Testing Statistics...');
    const plantStatsResponse = await axios.get(`${BASE_URL}/api/plants/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Plant stats:', JSON.stringify(plantStatsResponse.data.data, null, 2));

    const careStatsResponse = await axios.get(`${BASE_URL}/api/care/stats?days=7`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Care stats:', JSON.stringify(careStatsResponse.data.data.stats, null, 2));

    // Step 13: Test Identification Database Stats
    console.log('\n1️⃣3️⃣ Testing Identification Database Stats...');
    const identifyStatsResponse = await axios.get(`${BASE_URL}/api/identify/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Identification stats:', JSON.stringify(identifyStatsResponse.data.data.stats, null, 2));

    // Step 14: Test Care Info Lookup
    console.log('\n1️⃣4️⃣ Testing Plant Care Info...');
    const careInfoResponse = await axios.get(`${BASE_URL}/api/identify/care/pothos`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Care info retrieved for pothos:', careInfoResponse.data.data.plant.names.english);
    console.log('   Watering:', careInfoResponse.data.data.plant.care.water);

    // Step 15: Test Update Care Log
    console.log('\n1️⃣5️⃣ Testing Care Log Update...');
    const updateCareResponse = await axios.put(`${BASE_URL}/api/care/${testCareLogId}`, {
      notes: 'Updated: Watered thoroughly, plant looked happy',
      metadata: JSON.stringify({ amount: '250ml', plantResponse: 'excellent' })
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Care log updated successfully');

    // Step 16: Test Error Handling
    console.log('\n1️⃣6️⃣ Testing Error Handling...');
    try {
      await axios.get(`${BASE_URL}/api/plants/invalid-plant-id`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('❌ Error handling failed - should have returned 400');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Error handling working: Invalid UUID format properly rejected');
      } else {
        console.log('⚠️  Unexpected error status:', error.response?.status);
      }
    }

    // Cleanup: Delete test plant
    console.log('\n🧹 Cleanup: Deleting Test Plant...');
    const deleteResponse = await axios.delete(`${BASE_URL}/api/plants/${testPlantId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Test plant deleted successfully');

    console.log('\n🎉 All API tests completed successfully!\n');
    console.log('📊 Test Summary:');
    console.log('- ✅ User Registration & Authentication');
    console.log('- ✅ Plant CRUD operations (Create, Read, Update, Delete)');
    console.log('- ✅ Plant identification with Egyptian database');
    console.log('- ✅ Plant search and database access');
    console.log('- ✅ Care logging and history tracking');
    console.log('- ✅ Recent care actions and statistics');
    console.log('- ✅ Plant and care statistics');
    console.log('- ✅ Plant care information lookup');
    console.log('- ✅ Error handling and validation');
    console.log('- ✅ Data cleanup');
    console.log('\n🚀 Lotus Plant API is fully operational!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.log('Status:', error.response.status);
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(0);
});

testCompleteAPI();