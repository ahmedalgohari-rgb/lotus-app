const fs = require('fs');
const path = require('path');

/**
 * Remove ALL duplicate plant IDs across batch files
 * Keep only the first occurrence of each plant ID
 */

const BATCH_COUNT = 14;

console.log('🔍 Scanning all batch files for duplicates...\n');

// Step 1: Read all batches and track plant IDs
const seenPlantIds = new Set();
const duplicatesToRemove = {}; // { batchNum: [plantIds...] }

for (let i = 1; i <= BATCH_COUNT; i++) {
  const batchFile = `new_plants_batch${i}.csv`;
  const batchPath = path.join(__dirname, batchFile);

  if (!fs.existsSync(batchPath)) continue;

  const content = fs.readFileSync(batchPath, 'utf8');
  const lines = content.split('\n');
  const dataLines = lines.slice(1); // Skip header

  duplicatesToRemove[i] = [];

  dataLines.forEach(line => {
    if (!line.trim()) return;

    const plantId = line.split(',')[0];

    if (seenPlantIds.has(plantId)) {
      // This is a duplicate - mark for removal
      duplicatesToRemove[i].push(plantId);
      console.log(`   ❌ Duplicate found: ${plantId} in batch ${i} (keeping first occurrence)`);
    } else {
      // First time seeing this plant ID
      seenPlantIds.add(plantId);
    }
  });
}

console.log(`\n📊 Found ${Object.values(duplicatesToRemove).flat().length} duplicate entries to remove.\n`);

// Step 2: Remove duplicates from each batch
let totalRemoved = 0;

for (let i = 1; i <= BATCH_COUNT; i++) {
  if (duplicatesToRemove[i].length === 0) continue;

  const batchFile = `new_plants_batch${i}.csv`;
  const batchPath = path.join(__dirname, batchFile);

  const content = fs.readFileSync(batchPath, 'utf8');
  const lines = content.split('\n');
  const header = lines[0];
  const dataLines = lines.slice(1);

  const cleanedLines = dataLines.filter(line => {
    if (!line.trim()) return true;

    const plantId = line.split(',')[0];
    return !duplicatesToRemove[i].includes(plantId);
  });

  const cleanedContent = [header, ...cleanedLines].join('\n');
  fs.writeFileSync(batchPath, cleanedContent, 'utf8');

  totalRemoved += duplicatesToRemove[i].length;
  console.log(`   ✅ Cleaned batch ${i}: removed ${duplicatesToRemove[i].length} duplicates`);
}

console.log(`\n✨ Done! Removed ${totalRemoved} total duplicate entries.`);
console.log(`   Unique plants across all batches: ${seenPlantIds.size}`);
