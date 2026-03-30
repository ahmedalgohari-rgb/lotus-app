#!/usr/bin/env node

const jwt = require('jsonwebtoken');
const fs = require('fs');

const TEAM_ID = '496VC2V7M6';
const KEY_ID = '3W2TH8LCN4';
const CLIENT_ID = 'com.gohari.lotusplantcare'; // Services ID for OAuth
const P8_FILE_PATH = '/Users/ahmedalgohari/Downloads/Apple Auth Key.p8';

try {
  console.log('\n🍎 Generating Apple OAuth JWT (v2 - with debugging)...\n');

  const privateKey = fs.readFileSync(P8_FILE_PATH, 'utf8');

  console.log('Private Key Preview:');
  console.log(privateKey.substring(0, 100) + '...\n');

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: TEAM_ID,
    iat: now,
    exp: now + 15777000, // 6 months
    aud: 'https://appleid.apple.com',
    sub: CLIENT_ID,
  };

  console.log('JWT Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');

  const token = jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: KEY_ID,
      typ: 'JWT',
    },
  });

  // Verify the token
  const parts = token.split('.');
  console.log('JWT Structure:');
  console.log(`- Header: ${parts[0].length} chars`);
  console.log(`- Payload: ${parts[1].length} chars`);
  console.log(`- Signature: ${parts[2].length} chars`);
  console.log(`- Total length: ${token.length} chars\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 COPY THIS ENTIRE TOKEN (including the dots!):\n');
  console.log(token);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Save to file for easy copying
  fs.writeFileSync('/Users/ahmedalgohari/Lotus/apple-jwt-secret.txt', token);
  console.log('✅ Token also saved to: apple-jwt-secret.txt\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
