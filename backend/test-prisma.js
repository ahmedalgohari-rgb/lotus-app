// Test Prisma setup
console.log('Testing Prisma...');

try {
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma Client imported successfully');
  
  const prisma = new PrismaClient();
  console.log('✅ Prisma Client created successfully');
  
  console.log('Database URL:', process.env.DATABASE_URL || 'file:./dev.db');
} catch (error) {
  console.log('❌ Prisma Client error:', error.message);
}