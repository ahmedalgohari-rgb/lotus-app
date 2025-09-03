const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCareService() {
  console.log('🌿 Testing Care Service...');

  try {
    // Use existing test user and get a plant
    const testUserId = '0b17d2a2-acc5-4dc7-8264-1c6a3ed36399';
    
    // Find an existing plant
    const plant = await prisma.plant.findFirst({
      where: { userId: testUserId, deletedAt: null }
    });

    if (!plant) {
      console.log('❌ No plants found for testing');
      return;
    }

    console.log('Using plant:', plant.name, plant.id);

    // Create test care log
    console.log('Creating care log...');
    const careLog = await prisma.careLog.create({
      data: {
        type: 'WATERING',
        notes: 'Watered thoroughly, soil was dry',
        userId: testUserId,
        plantId: plant.id,
        performedAt: new Date(),
      },
    });
    console.log('✅ Care log created:', careLog.id);

    // Read care history
    console.log('Fetching care history...');
    const careHistory = await prisma.careLog.findMany({
      where: { plantId: plant.id, userId: testUserId },
      orderBy: { performedAt: 'desc' },
      take: 5,
    });
    console.log('✅ Care history found:', careHistory.length, 'entries');

    // Get recent care actions with plant names
    console.log('Fetching recent care actions...');
    const recentActions = await prisma.careLog.findMany({
      where: { userId: testUserId },
      include: {
        plant: {
          select: { name: true }
        }
      },
      orderBy: { performedAt: 'desc' },
      take: 3,
    });
    console.log('✅ Recent actions found:', recentActions.length, 'entries');
    if (recentActions.length > 0) {
      console.log('  Latest action:', recentActions[0].type, 'for', recentActions[0].plant.name);
    }

    // Update plant last watered date
    console.log('Updating plant last watered date...');
    await prisma.plant.update({
      where: { id: plant.id },
      data: { lastWateredAt: careLog.performedAt }
    });
    console.log('✅ Plant last watered date updated');

    console.log('🎉 All care service tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCareService();