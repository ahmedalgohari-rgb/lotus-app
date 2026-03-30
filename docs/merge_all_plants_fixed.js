const fs = require('fs');
const path = require('path');

/**
 * Merge existing database with new plant batches
 * - Uses proper header from batch files (not malformed header from existing DB)
 * - Preserves all 137 existing plants WITH image URLs
 * - Adds ~347 new plants from batches 1-14
 */

const EXISTING_DB = 'database_complete_detailed.csv';
const BATCH_COUNT = 14;
const OUTPUT_FILE = 'database_complete_detailed_MERGED.csv';

console.log('🌿 Merging plant databases with corrected header...\n');

// Step 1: Get proper header from batch 1
const batch1Path = path.join(__dirname, 'new_plants_batch1.csv');
const batch1Content = fs.readFileSync(batch1Path, 'utf8');
const properHeader = batch1Content.split('\n')[0];
console.log(`✅ Using proper header from batch files\n`);

// Step 2: Create backup of original database
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = `database_complete_detailed.backup.${timestamp}.csv`;
fs.copyFileSync(EXISTING_DB, backupFile);
console.log(`✅ Backup created: ${backupFile}\n`);

// Step 3: Read existing database (skip malformed header, keep data rows)
const existingContent = fs.readFileSync(EXISTING_DB, 'utf8');
const existingLines = existingContent.split('\n').filter(line => line.trim());
const existingPlants = existingLines.slice(1); // Skip malformed header

console.log(`📖 Existing database: ${existingPlants.length} plants (WITH image URLs)`);

// Step 4: Read all batch files
let newPlants = [];
for (let i = 1; i <= BATCH_COUNT; i++) {
  const batchFile = `new_plants_batch${i}.csv`;
  const batchPath = path.join(__dirname, batchFile);

  if (!fs.existsSync(batchPath)) {
    console.log(`⚠️  Batch ${i} not found, skipping...`);
    continue;
  }

  const batchContent = fs.readFileSync(batchPath, 'utf8');
  const batchLines = batchContent.split('\n').filter(line => line.trim());
  const batchData = batchLines.slice(1); // Skip header

  newPlants = newPlants.concat(batchData);
  console.log(`   ✅ Batch ${i}: ${batchData.length} plants`);
}

console.log(`\n📖 New batches total: ${newPlants.length} plants (no image URLs - for matching only)\n`);

// Step 5: Combine with PROPER header
const mergedLines = [
  properHeader,
  ...existingPlants,
  ...newPlants,
  '' // trailing newline
];

const mergedContent = mergedLines.join('\n');

// Step 6: Write merged file
fs.writeFileSync(OUTPUT_FILE, mergedContent, 'utf8');

console.log(`\n✨ Merge complete!`);
console.log(`\n📊 Final Database Summary:`);
console.log(`   - Header: Proper CSV column names ✅`);
console.log(`   - Existing plants (WITH image URLs): ${existingPlants.length}`);
console.log(`   - New plants (for PlantNet matching): ${newPlants.length}`);
console.log(`   - Total plants: ${existingPlants.length + newPlants.length}`);
console.log(`\n📁 Output file: ${OUTPUT_FILE}`);
console.log(`\n⚠️  NEXT STEPS:`);
console.log(`   1. Review ${OUTPUT_FILE} to verify merge`);
console.log(`   2. Replace original: mv ${OUTPUT_FILE} ${EXISTING_DB}`);
console.log(`   3. Run: npm run validate-db`);
console.log(`   4. Run: npm run sync-db`);
