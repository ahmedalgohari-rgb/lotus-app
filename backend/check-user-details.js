const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserDetails() {
  try {
    const user = await prisma.user.findFirst();
    if (user) {
      console.log('User email:', user.email);
      console.log('Password hash starts with:', user.passwordHash.substring(0, 10));
      console.log('User created at:', user.createdAt);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserDetails();