#!/usr/bin/env node

/**
 * Database Validation Script
 *
 * Validates plantCareDatabase.json for:
 * - Schema correctness
 * - Data quality (missing fields, invalid values)
 * - Genus extraction accuracy
 * - Scientific name formatting
 *
 * Usage: npm run validate-db
 */

const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../src/data/plantCareDatabase.json');

// Load database
function loadDatabase() {
  const content = fs.readFileSync(JSON_PATH, 'utf-8');
  return JSON.parse(content);
}

// Validate genus matches scientific name
function validateGenus(plant) {
  const scientificName = plant.names.scientific[0];
  const genus = plant.characteristics?.genus;

  if (!scientificName) {
    return { valid: false, error: 'Missing scientific name' };
  }

  if (!genus) {
    return { valid: false, error: 'Missing genus field' };
  }

  // Extract genus (skip × symbol for hybrids)
  const parts = scientificName.split(/\s+/);
  const extractedGenus = parts[0] === '×' ? parts[1] : parts[0];

  if (extractedGenus !== genus) {
    return {
      valid: false,
      error: `Genus mismatch: "${genus}" vs "${extractedGenus}" from "${scientificName}"`
    };
  }

  return { valid: true };
}

// Validate required fields
function validateRequiredFields(plant) {
  const errors = [];

  if (!plant.id) errors.push('Missing id');
  if (!plant.names?.common?.[0]) errors.push('Missing common name');
  if (!plant.names?.scientific?.[0]) errors.push('Missing scientific name');
  if (!plant.names?.arabic?.[0]) errors.push('Missing Arabic name');
  if (!plant.care?.plant_info) errors.push('Missing plant_info');
  if (!plant.care?.plant_type) errors.push('Missing plant_type');
  if (!plant.care?.difficulty) errors.push('Missing difficulty');
  if (!plant.characteristics?.family) errors.push('Missing family');

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

// Validate scientific name format
function validateScientificName(plant) {
  const scientificName = plant.names.scientific[0];

  // Should start with capital letter (Genus) or × for hybrids
  if (!/^([A-Z]|×\s)/.test(scientificName)) {
    return {
      valid: false,
      error: `Scientific name should start with capital letter or × for hybrids: "${scientificName}"`
    };
  }

  // Should not be a common name (heuristic: contains non-Latin chars or all caps)
  if (/[^A-Za-z\s'\-×.]/.test(scientificName)) {
    return {
      valid: false,
      error: `Scientific name contains invalid characters: "${scientificName}"`
    };
  }

  return { valid: true };
}

// Main validation
function validateDatabase() {
  console.log('🔍 Validating plantCareDatabase.json...\n');

  const db = loadDatabase();
  const plants = db.plants;

  let totalErrors = 0;
  let totalWarnings = 0;

  const issues = {
    genusMismatch: [],
    missingFields: [],
    invalidScientificName: [],
    missingArabic: [],
    missingPlantInfo: []
  };

  plants.forEach(plant => {
    // Skip invalid entries (like CSV headers) - be thorough about filtering
    if (!plant.id) return;
    if (plant.id === 'database_complete_detailed') return;
    if (plant.id === 'Plant ID') return;
    if (plant.id.trim() === '') return;

    // Validate genus
    const genusCheck = validateGenus(plant);
    if (!genusCheck.valid) {
      issues.genusMismatch.push({ id: plant.id, error: genusCheck.error });
      totalErrors++;
    }

    // Validate required fields
    const fieldsCheck = validateRequiredFields(plant);
    if (!fieldsCheck.valid) {
      issues.missingFields.push({ id: plant.id, errors: fieldsCheck.errors });
      totalErrors += fieldsCheck.errors.length;
    }

    // Validate scientific name
    const sciNameCheck = validateScientificName(plant);
    if (!sciNameCheck.valid) {
      issues.invalidScientificName.push({ id: plant.id, error: sciNameCheck.error });
      totalErrors++;
    }

    // Check for quality issues (warnings)
    if (!plant.care?.plant_info_arabic) {
      issues.missingArabic.push(plant.id);
      totalWarnings++;
    }

    if (plant.care?.plant_info?.length < 20) {
      issues.missingPlantInfo.push(plant.id);
      totalWarnings++;
    }
  });

  // Print results
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total Plants: ${plants.filter(p => p.id && p.id !== 'database_complete_detailed' && p.id !== 'Plant ID').length}`);
  console.log(`Errors: ${totalErrors}`);
  console.log(`Warnings: ${totalWarnings}`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (issues.genusMismatch.length > 0) {
    console.log('❌ GENUS MISMATCH:');
    issues.genusMismatch.forEach(issue => {
      console.log(`   ${issue.id}: ${issue.error}`);
    });
    console.log('');
  }

  if (issues.invalidScientificName.length > 0) {
    console.log('❌ INVALID SCIENTIFIC NAMES:');
    issues.invalidScientificName.forEach(issue => {
      console.log(`   ${issue.id}: ${issue.error}`);
    });
    console.log('');
  }

  if (issues.missingFields.length > 0) {
    console.log('❌ MISSING REQUIRED FIELDS:');
    issues.missingFields.forEach(issue => {
      console.log(`   ${issue.id}: ${issue.errors.join(', ')}`);
    });
    console.log('');
  }

  if (issues.missingArabic.length > 0) {
    console.log(`⚠️  MISSING ARABIC INFO (${issues.missingArabic.length} plants):`);
    console.log(`   ${issues.missingArabic.slice(0, 5).join(', ')}${issues.missingArabic.length > 5 ? '...' : ''}`);
    console.log('');
  }

  if (issues.missingPlantInfo.length > 0) {
    console.log(`⚠️  SHORT PLANT INFO (${issues.missingPlantInfo.length} plants):`);
    console.log(`   ${issues.missingPlantInfo.slice(0, 5).join(', ')}${issues.missingPlantInfo.length > 5 ? '...' : ''}`);
    console.log('');
  }

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('✅ Database is valid! No errors or warnings found.');
  } else if (totalErrors === 0) {
    console.log(`✅ No errors found! (${totalWarnings} warnings can be addressed later)`);
  } else {
    console.log(`❌ Found ${totalErrors} errors. Please fix before committing.`);
    process.exit(1);
  }
}

// Run validation
try {
  validateDatabase();
} catch (error) {
  console.error('\n❌ Validation failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
