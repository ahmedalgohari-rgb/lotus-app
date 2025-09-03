const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPlantService() {
  console.log('🌱 Testing Plant Service...');

  try {
    // Test data
    const testUserId = '0b17d2a2-acc5-4dc7-8264-1c6a3ed36399';
    
    // Create test plant
    console.log('Creating test plant...');
    const newPlant = await prisma.plant.create({
      data: {
        name: 'My Test Plant',
        scientificName: 'Epipremnum aureum',
        variety: 'Golden Pothos',
        userId: testUserId,
        location: JSON.stringify({
          city: 'Cairo',
          governorate: 'Cairo',
          latitude: 30.0444,
          longitude: 31.2357,
        }),
      },
    });
    console.log('✅ Plant created:', newPlant.id);

    // Read plants
    console.log('Fetching plants...');
    const plants = await prisma.plant.findMany({
      where: { userId: testUserId, deletedAt: null }
    });
    console.log('✅ Plants found:', plants.length);

    // Update plant
    console.log('Updating plant...');
    const updatedPlant = await prisma.plant.update({
      where: { id: newPlant.id },
      data: { scientificName: 'Epipremnum aureum (Golden)' }
    });
    console.log('✅ Plant updated:', updatedPlant.scientificName);

    // Delete plant (soft delete)
    console.log('Deleting plant...');
    await prisma.plant.update({
      where: { id: newPlant.id },
      data: { deletedAt: new Date() }
    });
    console.log('✅ Plant deleted');

    console.log('🎉 All plant service tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPlantService();