#!/usr/bin/env node

/**
 * Add Genus Column to CSV
 *
 * Reads database_complete_detailed.csv and adds a Genus column
 * between Scientific Name and Family columns.
 *
 * Auto-extracts genus from scientific names.
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '../docs/database_complete_detailed.csv');
const OUTPUT_PATH = path.join(__dirname, '../docs/database_complete_detailed_with_genus.csv');

/**
 * Extract genus from scientific name
 */
function extractGenus(scientificName) {
  if (!scientificName || scientificName.trim() === '') return '';

  const normalized = scientificName.trim();
  const firstWord = normalized.split(/\s+/)[0];

  // Validate it's a capitalized Latin word (genus format)
  if (/^[A-Z][a-z]+$/.test(firstWord)) {
    return firstWord;
  }

  return '';
}

function addGenusColumn() {
  console.log('📖 Reading CSV...');
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n');

  const outputLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim()) continue;

    // Parse CSV (simple split - handles most cases)
    const cols = line.split(',');

    // Header row - add "Genus" column header after Scientific Name
    const isHeaderRow = cols[0] === 'Plant ID';
    if (isHeaderRow) {
      const newCols = [
        ...cols.slice(0, 3),
        'Genus',
        ...cols.slice(3)
      ];
      outputLines.push(newCols.join(','));
      continue;
    }

    // Data rows
    const scientificName = cols[2];
    const genus = extractGenus(scientificName);

    // Insert genus after scientific name
    const newCols = [
      ...cols.slice(0, 3),
      genus,
      ...cols.slice(3)
    ];

    outputLines.push(newCols.join(','));

    const plantId = cols[0];
    if (genus) {
      console.log(`   + ${plantId}: ${genus}`);
    } else {
      console.log(`   ! ${plantId}: Could not extract genus from "${scientificName}"`);
    }
  }

  // Write output
  console.log('\n💾 Writing to database_complete_detailed_with_genus.csv...');
  fs.writeFileSync(OUTPUT_PATH, outputLines.join('\n'), 'utf-8');

  console.log('\n✅ Done!');
  console.log(`   Output: ${OUTPUT_PATH}`);
  console.log('\n📋 Next steps:');
  console.log('   1. Review the new CSV file');
  console.log('   2. If it looks good, replace the original:');
  console.log('      mv docs/database_complete_detailed_with_genus.csv docs/database_complete_detailed.csv');
  console.log('   3. Run: npm run sync-db');
}

try {
  addGenusColumn();
} catch (error) {
  console.error('❌ Failed:', error.message);
  process.exit(1);
}
