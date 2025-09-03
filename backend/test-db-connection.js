// Test database connection
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🌿 Testing Lotus Database Connection...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test connection by creating a simple query
    const userCount = await prisma.user.count();
    console.log('✅ Database connection successful!');
    console.log(`📊 Current user count: ${userCount}`);
    
    // Test creating a user
    console.log('\n📝 Testing user creation...');
    const testUser = await prisma.user.create({
      data: {
        email: 'test@lotus.com',
        passwordHash: 'hashed_password_here',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER'
      }
    });
    
    console.log('✅ Test user created:', {
      id: testUser.id,
      email: testUser.email,
      name: `${testUser.firstName} ${testUser.lastName}`
    });
    
    // Clean up test user
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('🧹 Test user cleaned up');
    
    console.log('\n🎉 Database is ready for Lotus app!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();