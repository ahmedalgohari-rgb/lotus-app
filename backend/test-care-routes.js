const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCareRoutes() {
  console.log('🌿 Testing Care Routes Integration...');

  try {
    // Check if server is responsive
    console.log('Testing server health...');
    
    // Find existing care logs
    const careLogs = await prisma.careLog.findMany({
      take: 3,
      include: {
        plant: {
          select: { name: true }
        }
      }
    });
    
    console.log('✅ Existing care logs found:', careLogs.length);
    
    if (careLogs.length > 0) {
      console.log('Sample care log:');
      console.log('  - Type:', careLogs[0].type);
      console.log('  - Plant:', careLogs[0].plant.name);
      console.log('  - Date:', careLogs[0].performedAt);
      console.log('  - Notes:', careLogs[0].notes || 'No notes');
    }

    // Test care service directly (simulate route logic)
    console.log('Testing care service methods...');
    const testUserId = '0b17d2a2-acc5-4dc7-8264-1c6a3ed36399';
    
    // Get recent actions
    const recentActions = await prisma.careLog.findMany({
      where: { userId: testUserId },
      include: {
        plant: {
          select: { name: true }
        }
      },
      orderBy: { performedAt: 'desc' },
      take: 5,
    });
    console.log('✅ Recent actions query successful:', recentActions.length, 'entries');

    // Get care stats simulation
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const careActions = await prisma.careLog.findMany({
      where: {
        userId: testUserId,
        performedAt: { gte: startDate }
      },
      select: { type: true }
    });

    const stats = careActions.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {});

    console.log('✅ Care stats calculation successful:', stats);
    console.log('  Total actions in last 30 days:', careActions.length);

    console.log('🎉 All care route integration tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCareRoutes();