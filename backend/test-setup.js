// Simple test to verify Node.js setup
console.log('🌿 Lotus Backend Setup Test');
console.log('Node.js version:', process.version);
console.log('Current working directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV || 'development');

// Test if basic imports work
try {
  require('express');
  console.log('✅ Express is available');
} catch (e) {
  console.log('❌ Express not found:', e.message);
}

try {
  require('@prisma/client');
  console.log('✅ Prisma Client is available');
} catch (e) {
  console.log('❌ Prisma Client not found:', e.message);
}

try {
  require('jsonwebtoken');
  console.log('✅ JWT is available');
} catch (e) {
  console.log('❌ JWT not found:', e.message);
}

console.log('✅ Basic Node.js setup is working!');