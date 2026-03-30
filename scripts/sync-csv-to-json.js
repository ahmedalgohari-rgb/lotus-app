#!/usr/bin/env node

/**
 * CSV → JSON Database Sync Script
 *
 * This script is the SINGLE SOURCE OF TRUTH for database updates.
 * It reads from database_complete_detailed.csv and generates plantCareDatabase.json
 *
 * Usage: node scripts/sync-csv-to-json.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const CSV_PATH = path.join(__dirname, '../docs/database_complete_detailed.csv');
const JSON_PATH = path.join(__dirname, '../src/data/plantCareDatabase.json');
const BACKUP_DIR = path.join(__dirname, '../src/data');

// CSV Column Indices (0-based) - Updated with Genus column
const COL = {
  PLANT_ID: 0,
  COMMON_NAME: 1,
  SCIENTIFIC_NAME: 2,
  GENUS: 3,           // NEW: Genus column added
  FAMILY: 4,          // Shifted from 3 to 4
  ARABIC_NAME: 5,     // Shifted from 4 to 5
  DIFFICULTY: 6,
  TYPE: 7,
  PET_SAFE: 8,
  WATERING_FULL: 9,
  LIGHT_REQ: 10,
  LIGHT_DESC: 11,
  SOIL_TYPE: 12,
  TEMP_RANGE: 13,
  HUMIDITY: 14,
  FERTILIZER: 15,
  PLANT_INFO_EN: 16,
  PLANT_INFO_AR: 17,
  CAIRO_SUIT: 18,
  SUMMER_CARE: 19,
  WINTER_CARE: 20,
  IMAGE_URL: 21
};

/**
 * Extract genus from scientific name
 * "Dracaena reflexa" → "Dracaena"
 * "Aglaonema 'Brilliant'" → "Aglaonema"
 */
function extractGenus(scientificName) {
  if (!scientificName || scientificName.trim() === '') return null;

  const normalized = scientificName.trim();
  const firstWord = normalized.split(/\s+/)[0];

  // Validate it's a capitalized Latin word (genus format)
  if (/^[A-Z][a-z]+$/.test(firstWord)) {
    return firstWord;
  }

  return null;
}

/**
 * Parse watering info from CSV format
 * "weekly: Water when top 3 inches are dry. Don't overwater."
 */
function parseWatering(wateringFull) {
  const match = wateringFull.match(/^(\w+):\s*(.+)$/);
  if (!match) {
    return {
      frequency: 'weekly',
      schedule: '60_dry',
      description: wateringFull,
      arabic_description: wateringFull
    };
  }

  const frequency = match[1].toLowerCase();
  const description = match[2];

  // Map frequency to schedule
  const scheduleMap = {
    'daily': '30_dry',
    'weekly': '60_dry',
    'bi_weekly': '75_dry',
    'every_2_weeks': '75_dry',
    'monthly': '100_dry'
  };

  return {
    frequency,
    schedule: scheduleMap[frequency] || '60_dry',
    description,
    arabic_description: description // Will be updated from CSV if available
  };
}

/**
 * Parse temperature range
 * "15-30°C (optimal: 22°C)" → { min: 15, max: 30, optimal: 22 }
 */
function parseTemperature(tempRange) {
  const match = tempRange.match(/(\d+)-(\d+)°C.*?(\d+)°C/);
  if (!match) {
    return { min: 15, max: 30, optimal: 22 };
  }

  return {
    min: parseInt(match[1]),
    max: parseInt(match[2]),
    optimal: parseInt(match[3])
  };
}

/**
 * Create backup of existing JSON
 */
function createBackup() {
  if (!fs.existsSync(JSON_PATH)) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = path.join(BACKUP_DIR, `plantCareDatabase.backup.${timestamp}.json`);

  fs.copyFileSync(JSON_PATH, backupPath);
  console.log(`✅ Backup created: ${path.basename(backupPath)}`);
}

/**
 * Parse a single CSV line respecting quoted fields
 * Handles commas inside quoted strings: "text, with comma"
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      // Skip the quote character itself
    } else if (char === ',' && !inQuotes) {
      // Column delimiter found outside quotes
      values.push(current.replace(/\r/g, '').trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Push the last value
  values.push(current.replace(/\r/g, '').trim());

  return values;
}

/**
 * Read and parse CSV
 */
function readCSV() {
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  // Skip header rows:
  // Row 0 (index 0): Plant ID,Common Name,... (headers)
  // Row 1 (index 1): Plant ID,Common Name,... (headers with units - duplicate)
  // Row 2+ (index 2+): Actual plant data
  return lines
    .slice(2) // Skip first 2 header rows
    .filter(line => {
      const firstCol = line.split(',')[0].trim();
      // Skip any remaining header-like rows
      return firstCol !== 'Plant ID' && firstCol !== 'database_complete_detailed';
    })
    .map(line => parseCSVLine(line));
}

/**
 * Load existing JSON to preserve data not in CSV
 */
function loadExistingJSON() {
  if (!fs.existsSync(JSON_PATH)) return { plants: [], categories: {}, families: {} };

  const content = fs.readFileSync(JSON_PATH, 'utf-8');
  return JSON.parse(content);
}

/**
 * Convert CSV row to JSON plant object
 */
function csvRowToPlant(row, existingPlant = null) {
  const plantId = row[COL.PLANT_ID];
  const scientificName = row[COL.SCIENTIFIC_NAME];
  const genus = row[COL.GENUS] || extractGenus(scientificName); // Read from CSV, fallback to extraction

  // Parse watering
  const watering = parseWatering(row[COL.WATERING_FULL]);

  // Temperature
  const temperature = parseTemperature(row[COL.TEMP_RANGE]);

  return {
    id: plantId,
    names: {
      scientific: [scientificName],
      common: [row[COL.COMMON_NAME]],
      arabic: [row[COL.ARABIC_NAME]],
      aliases: existingPlant?.names?.aliases || [
        scientificName.toLowerCase(),
        row[COL.COMMON_NAME].toLowerCase()
      ]
    },
    care: {
      plant_info: row[COL.PLANT_INFO_EN],
      plant_info_arabic: row[COL.PLANT_INFO_AR],
      plant_type: row[COL.TYPE],
      difficulty: row[COL.DIFFICULTY],
      watering: {
        ...watering,
        arabic_description: existingPlant?.care?.watering?.arabic_description || watering.description
      },
      light: {
        requirement: row[COL.LIGHT_REQ],
        tolerance: existingPlant?.care?.light?.tolerance || [row[COL.LIGHT_REQ]],
        description: row[COL.LIGHT_DESC],
        arabic_description: existingPlant?.care?.light?.arabic_description || row[COL.LIGHT_DESC]
      },
      humidity: row[COL.HUMIDITY],
      temperature,
      soil: row[COL.SOIL_TYPE],
      fertilizer: row[COL.FERTILIZER]
    },
    characteristics: {
      family: row[COL.FAMILY],
      genus: genus,
      origin: existingPlant?.characteristics?.origin || 'Various',
      mature_size: existingPlant?.characteristics?.mature_size || {
        height: 'varies',
        spread: 'varies'
      },
      growth_rate: existingPlant?.characteristics?.growth_rate || 'medium',
      air_purifying: existingPlant?.characteristics?.air_purifying || false,
      pet_safe: row[COL.PET_SAFE] === 'yes',
      flowering: existingPlant?.characteristics?.flowering || false,
      propagation: existingPlant?.characteristics?.propagation || 'cuttings'
    },
    egyptian_specific: {
      cairo_suitability: row[COL.CAIRO_SUIT],
      indoor_outdoor: existingPlant?.egyptian_specific?.indoor_outdoor || 'indoor',
      seasonal_care: {
        summer: row[COL.SUMMER_CARE],
        winter: row[COL.WINTER_CARE],
        summer_arabic: existingPlant?.egyptian_specific?.seasonal_care?.summer_arabic || row[COL.SUMMER_CARE],
        winter_arabic: existingPlant?.egyptian_specific?.seasonal_care?.winter_arabic || row[COL.WINTER_CARE]
      },
      local_availability: existingPlant?.egyptian_specific?.local_availability || {
        source: 'Plant Cult Cairo',
        url: ''
      }
    },
    image_url: row[COL.IMAGE_URL]
  };
}

/**
 * Main sync function
 */
function syncDatabase() {
  console.log('🔄 Starting CSV → JSON Database Sync...\n');

  // Create backup
  createBackup();

  // Load existing data
  const existingDB = loadExistingJSON();
  const existingPlantsMap = new Map(
    existingDB.plants.map(plant => [plant.id, plant])
  );

  // Read CSV
  console.log('📖 Reading CSV...');
  const csvRows = readCSV();
  console.log(`   Found ${csvRows.length} plants in CSV\n`);

  // Convert to JSON
  console.log('🔧 Converting to JSON format...');
  const plants = csvRows.map(row => {
    const plantId = row[COL.PLANT_ID];
    const existingPlant = existingPlantsMap.get(plantId);

    if (existingPlant) {
      console.log(`   ✓ Updating: ${plantId}`);
    } else {
      console.log(`   + Adding: ${plantId}`);
    }

    return csvRowToPlant(row, existingPlant);
  });

  // Build final database
  const database = {
    plants,
    categories: existingDB.categories,
    families: existingDB.families
  };

  // Write to file
  console.log('\n💾 Writing to plantCareDatabase.json...');
  fs.writeFileSync(
    JSON_PATH,
    JSON.stringify(database, null, 2),
    'utf-8'
  );

  // Summary
  console.log('\n✅ Sync Complete!');
  console.log(`   Total plants: ${plants.length}`);
  console.log(`   With genus info: ${plants.filter(p => p.characteristics.genus).length}`);
  console.log(`   Missing genus: ${plants.filter(p => !p.characteristics.genus).length}`);

  // Show plants with missing genus
  const missingGenus = plants.filter(p => !p.characteristics.genus);
  if (missingGenus.length > 0) {
    console.log('\n⚠️  Plants with missing genus (check scientific names):');
    missingGenus.forEach(p => {
      console.log(`   - ${p.id}: "${p.names.scientific[0]}"`);
    });
  }
}

// Run sync
try {
  syncDatabase();
} catch (error) {
  console.error('\n❌ Sync failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
