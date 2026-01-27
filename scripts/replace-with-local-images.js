#!/usr/bin/env node

/**
 * Replace CDN URLs with Local WebP Image References
 *
 * This script replaces all CDN image URLs with local WebP file references
 * Format: "local://plant_id.webp"
 *
 * Why: Makes CSV self-documenting while forcing app to use bundled images
 *
 * Usage: node scripts/replace-with-local-images.js
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../docs/database_complete_detailed.csv');
const BACKUP_PATH = path.join(__dirname, '../docs/database_complete_detailed.backup-before-local-refs.csv');

console.log('🔄 Replacing CDN URLs with Local WebP References...\n');

// Create backup
console.log('📦 Creating backup...');
fs.copyFileSync(CSV_PATH, BACKUP_PATH);
console.log(`   ✅ Backup saved: ${path.basename(BACKUP_PATH)}\n`);

// Read CSV
console.log('📖 Reading CSV...');
const content = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = content.split('\n');
console.log(`   Found ${lines.length} lines\n`);

// Process lines
console.log('🔧 Replacing with local WebP references...');
const processedLines = lines.map((line, index) => {
  // Skip empty lines
  if (!line.trim()) return line;

  // Keep header rows (lines 0-2) as-is
  if (index <= 2) {
    return line;
  }

  // For data rows: parse CSV respecting quotes
  const values = parseCSVLine(line);

  // Get plant ID (column 0) and replace Image URL (column 21)
  if (values.length >= 22 && values[0] && values[0] !== 'Plant ID') {
    const plantId = values[0].trim();

    // Replace CDN URL with local WebP reference
    values[21] = `local://${plantId}.webp`;

    console.log(`   ✓ ${plantId}: local://${plantId}.webp`);
  }

  // Rebuild CSV line with proper quoting
  return values.map(val => {
    // Quote fields that contain commas or quotes
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }).join(',');
});

// Write back
console.log('\n💾 Writing updated CSV...');
fs.writeFileSync(CSV_PATH, processedLines.join('\n'), 'utf-8');
console.log(`   ✅ Updated: ${CSV_PATH}\n`);

console.log('✅ Done!');
console.log('\n📋 Summary:');
console.log('   • All CDN URLs replaced with local:// references');
console.log('   • Format: local://plant_id.webp');
console.log('   • CSV now self-documenting for bundled images');
console.log('\n📋 Next steps:');
console.log('   1. Run: npm run sync-db');
console.log('   2. PlantImage component already ignores URLs (uses plantId)');
console.log('   3. Test: Images load instantly from bundled WebP files');

/**
 * Parse a single CSV line respecting quoted fields
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.replace(/\r/g, '').trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.replace(/\r/g, '').trim());
  return values;
}
