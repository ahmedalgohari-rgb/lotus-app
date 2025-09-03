const { createPlantSchema, updatePlantSchema } = require('./src/schemas/plant.schemas.ts');

// Test valid plant data
console.log('🧪 Testing Plant Validation Schemas...');

try {
  // Test create schema
  console.log('Testing create schema...');
  const validPlantData = {
    name: 'Test Plant',
    scientificName: 'Test species',
    wateringFrequency: 7,
    sunlightRequirement: 'full',
    temperatureMin: 18,
    temperatureMax: 25,
  };
  
  const result = createPlantSchema.parse(validPlantData);
  console.log('✅ Create validation passed:', result.name);
  
  // Test update schema
  console.log('Testing update schema...');
  const updateData = {
    name: 'Updated Plant Name',
    temperatureMax: 30,
  };
  
  const updateResult = updatePlantSchema.parse(updateData);
  console.log('✅ Update validation passed:', updateResult.name);
  
  console.log('🎉 All validation tests passed!');

} catch (error) {
  console.error('❌ Validation test failed:', error.message);
}