// Simple dependency installer for Node.js without npm
const fs = require('fs');
const https = require('https');
const path = require('path');
const { spawn } = require('child_process');

console.log('🌿 Lotus Backend - Manual Dependency Installer');
console.log('Node.js version:', process.version);

// Check if we can use a working npm installation
function checkNpm() {
  return new Promise((resolve) => {
    const npm = spawn('npm', ['--version'], { stdio: 'pipe' });
    npm.on('close', (code) => {
      resolve(code === 0);
    });
    npm.on('error', () => {
      resolve(false);
    });
  });
}

async function main() {
  const hasNpm = await checkNpm();
  
  if (hasNpm) {
    console.log('✅ npm is available, proceeding with normal installation');
    console.log('Run: npm install');
  } else {
    console.log('❌ npm is not working properly');
    console.log('');
    console.log('Manual setup options:');
    console.log('1. Download and install Node.js v22.11.0 LTS from https://nodejs.org/');
    console.log('2. Or use the existing Node.js v22.11.0 installation at:');
    console.log('   C:\\Users\\AbdElMohsenA2\\OneDrive - Vodafone Group\\Documents\\node\\');
    console.log('');
    console.log('Add to your system PATH:');
    console.log('   C:\\Users\\AbdElMohsenA2\\OneDrive - Vodafone Group\\Documents\\node');
    console.log('');
    console.log('Then run: npm install');
  }
}

main().catch(console.error);