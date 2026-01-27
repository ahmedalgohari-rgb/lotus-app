#!/usr/bin/env node

/**
 * Clear Image URLs from CSV
 *
 * This script removes all CDN image URLs from the CSV to force
 * the app to use local bundled WebP images instead.
 *
 * Why: Local images load instantly (0ms), CDN images take 1-5 seconds
 * on slow connections. We have 136 WebP images bundled in the app.
 *
 * Usage: node scripts/clear-image-urls.js
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../docs/database_complete_detailed.csv');
const BACKUP_PATH = path.join(__dirname, '../docs/database_complete_detailed.backup-before-url-clear.csv');

console.log('🔄 Clearing Image URLs from CSV...\n');

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
console.log('🔧 Clearing image URLs...');
const processedLines = lines.map((line, index) => {
  // Skip empty lines
  if (!line.trim()) return line;

  // Keep header rows (lines 0-2) as-is
  if (index <= 2) {
    return line;
  }

  // For data rows: parse CSV respecting quotes, clear last column (Image URL)
  const values = parseCSVLine(line);

  // Clear the last column (Image URL = column 21, index 21)
  if (values.length >= 22) {
    values[21] = ''; // Clear image URL

    // Log the plant ID for visibility
    if (values[0] && values[0] !== 'Plant ID') {
      console.log(`   ✓ Cleared URL for: ${values[0]}`);
    }
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
console.log('\n📋 Next steps:');
console.log('   1. Run: npm run sync-db');
console.log('   2. Verify: All plants now use local bundled images');
console.log('   3. Test: Images load instantly (0ms) with no network requests');

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
