const fs = require('fs');
const path = require('path');

/**
 * Remove duplicate plant IDs from batch files that already exist in the main database
 */

const DUPLICATES_TO_REMOVE = [
  'alocasia_polly',
  'christmas_cactus',
  'croton',
  'elephant_bush',
  'peperomia_rosso',
  'philodendron_birkin',
  'venus_flytrap'
];

const BATCH_FILES = [
  'new_plants_batch13.csv',
  'new_plants_batch14.csv'
];

console.log('🗑️  Removing duplicate plant IDs from batch files...\n');

let totalRemoved = 0;

BATCH_FILES.forEach(filename => {
  const filepath = path.join(__dirname, filename);

  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return;
  }

  // Read file
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');

  // Keep header
  const header = lines[0];
  const dataLines = lines.slice(1);

  // Filter out duplicates
  const cleanedLines = dataLines.filter(line => {
    if (!line.trim()) return true; // Keep empty lines

    const plantId = line.split(',')[0];
    const isDuplicate = DUPLICATES_TO_REMOVE.includes(plantId);

    if (isDuplicate) {
      console.log(`   ❌ Removed: ${plantId} from ${filename}`);
      totalRemoved++;
    }

    return !isDuplicate;
  });

  // Write cleaned file back
  const cleanedContent = [header, ...cleanedLines].join('\n');
  fs.writeFileSync(filepath, cleanedContent, 'utf8');

  console.log(`   ✅ Cleaned: ${filename}\n`);
});

console.log(`\n✨ Done! Removed ${totalRemoved} duplicate entries.`);
console.log(`\n📊 Summary:`);
console.log(`   - Original duplicates: 7`);
console.log(`   - Removed: ${totalRemoved}`);
console.log(`   - Remaining unique plants in batches: ~${403 - totalRemoved}`);
