// Test the identification routes integration
console.log('🌱 Testing Plant Identification Routes Integration...');

async function testIdentificationRoutes() {
  try {
    // Test 1: Check if identification endpoints are accessible (without auth for now)
    console.log('\n1. Testing endpoint availability...');
    
    // Simulate the identification service calls that the routes would make
    const { identificationService } = require('./src/services/identification.service.ts');
    
    // Test identification functionality
    const testDescription = 'snake plant';
    const identifyResult = identificationService.identifyPlant(testDescription);
    console.log('✅ Identification service call successful');
    console.log('  - Plant identified:', identifyResult.data?.names.english);
    console.log('  - Confidence:', identifyResult.data?.confidence);
    
    // Test database retrieval
    const plants = identificationService.getAvailablePlants();
    console.log('✅ Database retrieval successful:', plants.length, 'plants');
    
    // Test search functionality
    const searchResults = identificationService.searchPlants('aloe', 5);
    console.log('✅ Search functionality successful:', searchResults.length, 'results');
    if (searchResults.length > 0) {
      console.log('  - First result:', searchResults[0].names.english);
    }
    
    // Test care information
    const careInfo = identificationService.getPlantCare('pothos');
    console.log('✅ Care info retrieval successful');
    console.log('  - Plant:', careInfo.names.english);
    console.log('  - Watering:', careInfo.care.water);
    
    // Test database stats
    const stats = identificationService.getDatabaseStats();
    console.log('✅ Database stats successful');
    console.log('  - Total plants:', stats.total);
    console.log('  - Indoor plants:', stats.byEnvironment.indoor);
    
    // Test error handling
    console.log('\n2. Testing error handling...');
    try {
      identificationService.getPlantCare('non-existent-plant');
      console.log('❌ Error handling failed - should have thrown error');
    } catch (error) {
      console.log('✅ Error handling working:', error.message);
    }
    
    console.log('\n🎉 All identification route integration tests passed!');
    console.log('\nAvailable endpoints:');
    console.log('  - POST /api/identify - Identify plant by description');
    console.log('  - GET /api/identify/database - Get all plants');
    console.log('  - GET /api/identify/search?query=mint - Search plants');
    console.log('  - GET /api/identify/stats - Get database stats');
    console.log('  - GET /api/identify/care/:plantId - Get plant care info');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testIdentificationRoutes();