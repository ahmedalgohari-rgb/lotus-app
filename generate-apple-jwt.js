#!/usr/bin/env node

/**
 * Generate Apple Sign-In JWT for Supabase
 *
 * This script creates the JWT token needed for Supabase's Apple OAuth configuration
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Apple Developer Account Values
const TEAM_ID = '496VC2V7M6';
const KEY_ID = '3W2TH8LCN4';
const CLIENT_ID = 'com.gohari.lotusplantcare'; // Your Services ID

// Path to your .p8 file
const P8_FILE_PATH = '/Users/ahmedalgohari/Downloads/Apple Auth Key.p8';

try {
  console.log('\n🍎 Generating Apple Sign-In JWT Token...\n');

  // Read the private key
  if (!fs.existsSync(P8_FILE_PATH)) {
    console.error('❌ Error: Cannot find .p8 file at:', P8_FILE_PATH);
    console.log('Please check the file path and try again.\n');
    process.exit(1);
  }

  const privateKey = fs.readFileSync(P8_FILE_PATH, 'utf8');

  // Generate JWT token (valid for 6 months)
  const now = Math.floor(Date.now() / 1000);
  const sixMonthsInSeconds = 15777000;

  const token = jwt.sign(
    {
      iss: TEAM_ID,
      iat: now,
      exp: now + sixMonthsInSeconds,
      aud: 'https://appleid.apple.com',
      sub: CLIENT_ID,
    },
    privateKey,
    {
      algorithm: 'ES256',
      header: {
        alg: 'ES256',
        kid: KEY_ID,
      },
    }
  );

  console.log('✅ JWT Token Generated Successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 Copy this token and paste it into Supabase:\n');
  console.log(token);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📍 Supabase Configuration:\n');
  console.log('1. Go to: Authentication → Providers → Apple');
  console.log('2. Client IDs: com.gohari.lotusplantcare');
  console.log('3. Secret Key: [Paste the JWT token above]');
  console.log('4. Click "Save"\n');
  console.log('⚠️  Note: This token expires in 6 months. Generate a new one then.\n');

} catch (error) {
  console.error('❌ Error generating JWT:', error.message);
  process.exit(1);
}
