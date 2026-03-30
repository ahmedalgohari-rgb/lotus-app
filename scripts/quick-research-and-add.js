#!/usr/bin/env node

/**
 * Quick Research and Add Tool
 *
 * For real-time testing: When user scans an unknown plant,
 * use this script to quickly research and add it to the database.
 *
 * Usage: node scripts/quick-research-and-add.js "Scientific Name" "Common Name"
 * Example: node scripts/quick-research-and-add.js "Monstera adansonii" "Swiss Cheese Vine"
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../docs/database_complete_detailed.csv');

// Get arguments
const scientificName = process.argv[2];
const commonName = process.argv[3];

if (!scientificName) {
  console.error('❌ Error: Scientific name required');
  console.log('Usage: node scripts/quick-research-and-add.js "Scientific Name" "Common Name"');
  process.exit(1);
}

console.log('🔍 Quick Research Mode Activated!');
console.log(`\nPlant: ${commonName || scientificName}`);
console.log(`Scientific: ${scientificName}\n`);

// Extract genus
const genus = scientificName.split(' ')[0];

console.log('📋 Research Checklist:');
console.log('1. Search: "' + scientificName + ' care guide watering light"');
console.log('2. Find reliable source (Greg, PictureThis, Houseplant Alley)');
console.log('3. Extract care data\n');

console.log('📝 Data Template for CSV:');
console.log('---');

const plantId = (commonName || scientificName)
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, '')
  .replace(/\s+/g, '_');

const template = [
  plantId,
  commonName || scientificName,
  scientificName,
  genus,
  '[FAMILY]', // e.g., Araceae, Cactaceae
  '[ARABIC NAME]', // e.g., نبات السويسري
  '[DIFFICULTY]', // beginner, intermediate, expert
  '[TYPE]', // foliage, cactus, succulent, palm, fern
  '[PET_SAFE]', // yes or no
  '[WATERING]', // e.g., "weekly: Water when top 2 inches dry"
  '[LIGHT_REQ]', // bright_indirect, medium_indirect, etc.
  '[LIGHT_DESC]', // e.g., "Bright indirect light"
  '[SOIL]', // well_draining_potting, cactus_mix, etc.
  '[TEMP_RANGE]', // e.g., "15-27°C (optimal: 22°C)"
  '[HUMIDITY]', // low, medium, high
  '[FERTILIZER]', // monthly, bi_monthly, etc.
  '[PLANT_INFO_EN]', // English description (2-3 sentences)
  '[PLANT_INFO_AR]', // Arabic description
  '[CAIRO_SUIT]', // excellent, good, challenging
  '[SUMMER_CARE]', // Cairo summer tips
  '[WINTER_CARE]', // Cairo winter tips
  '' // Image URL (empty for now)
].join(',');

console.log(template);
console.log('---\n');

console.log('✅ Next Steps:');
console.log('1. Research the plant online');
console.log('2. Fill in the bracketed values');
console.log('3. Add the row to: docs/database_complete_detailed.csv');
console.log('4. Run: npm run sync-db');
console.log('5. User scans again → Gets full care data! 🌿');

console.log('\n💡 Quick Reference:');
console.log('WATERING CODES:');
console.log('  daily → "daily: Water description"');
console.log('  weekly → "weekly: Water when top 2 inches dry"');
console.log('  bi_weekly → "bi_weekly: Let top half dry"');
console.log('  monthly → "monthly: Drought tolerant"');

console.log('\nLIGHT CODES:');
console.log('  bright_direct, bright_indirect, medium_indirect, low_indirect');

console.log('\nPLANT TYPES:');
console.log('  foliage, cactus, succulent, palm, fern, orchid, bromeliad, tropical');

console.log('\n🚀 Ready to research! Start with WebSearch...\n');
