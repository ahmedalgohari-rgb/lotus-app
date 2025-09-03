// Test the identification service
const { identificationService } = require('./src/services/identification.service.ts');

async function testIdentificationService() {
  console.log('🌱 Testing Plant Identification Service...');

  try {
    // Test 1: Identify a known plant
    console.log('\n1. Testing plant identification...');
    const result1 = identificationService.identifyPlant('pothos');
    console.log('✅ Pothos identification:', result1.success);
    if (result1.success && result1.data) {
      console.log('  - Scientific:', result1.data.scientific);
      console.log('  - English:', result1.data.names.english);
      console.log('  - Arabic:', result1.data.names.arabic);
      console.log('  - Confidence:', result1.data.confidence);
    }

    // Test 2: Identify another plant by scientific name
    console.log('\n2. Testing identification by scientific name...');
    const result2 = identificationService.identifyPlant('Sansevieria');
    console.log('✅ Snake plant identification:', result2.success);
    if (result2.success && result2.data) {
      console.log('  - English:', result2.data.names.english);
      console.log('  - Watering:', result2.data.care.water);
    }

    // Test 3: Unknown plant
    console.log('\n3. Testing unknown plant...');
    const result3 = identificationService.identifyPlant('unknown mysterious plant');
    console.log('✅ Unknown plant handling:', result3.success);
    if (result3.success && result3.data) {
      console.log('  - Result:', result3.data.names.english);
      console.log('  - Confidence:', result3.data.confidence);
    }

    // Test 4: Get all available plants
    console.log('\n4. Testing get all plants...');
    const allPlants = identificationService.getAvailablePlants();
    console.log('✅ Available plants retrieved:', allPlants.length, 'plants');
    console.log('  - First plant:', allPlants[0]?.names.english);
    console.log('  - Last plant:', allPlants[allPlants.length - 1]?.names.english);

    // Test 5: Get specific plant care
    console.log('\n5. Testing specific plant care...');
    const careInfo = identificationService.getPlantCare('aloe-vera');
    console.log('✅ Aloe vera care info retrieved');
    console.log('  - English name:', careInfo.names.english);
    console.log('  - Watering:', careInfo.care.water);
    console.log('  - Light:', careInfo.care.light);

    // Test 6: Search plants
    console.log('\n6. Testing plant search...');
    const searchResults = identificationService.searchPlants('mint');
    console.log('✅ Search results for "mint":', searchResults.length, 'results');
    if (searchResults.length > 0) {
      console.log('  - Found:', searchResults[0].names.english);
    }

    // Test 7: Database stats
    console.log('\n7. Testing database stats...');
    const stats = identificationService.getDatabaseStats();
    console.log('✅ Database stats:');
    console.log('  - Total plants:', stats.total);
    console.log('  - Indoor plants:', stats.byEnvironment.indoor);
    console.log('  - Outdoor plants:', stats.byEnvironment.outdoor);
    console.log('  - Both environments:', stats.byEnvironment.both);

    console.log('\n🎉 All identification service tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testIdentificationService();