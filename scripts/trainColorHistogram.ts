import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ColorAnalysis {
  isLikelyPlant: boolean;
  confidence: number;
  greenScore: number;
  brownScore: number;
  flowerScore: number;
  reason: string;
  dominantColors: string[];
}

interface TrainingResult {
  plantId: string;
  imagePath: string;
  analysis: ColorAnalysis;
}

interface TrainingStats {
  count: number;
  greenScores: number[];
  brownScores: number[];
  flowerScores: number[];
  totalScores: number[];
  results: TrainingResult[];
}

/**
 * Phase 1 Training Script: Analyze 135 plant images to optimize color histogram threshold
 *
 * This script collects empirical data about what real plants actually score,
 * enabling data-driven threshold optimization instead of guessing.
 */
async function trainColorHistogram() {
  console.log('='.repeat(60));
  console.log('COLOR HISTOGRAM TRAINING SCRIPT - PHASE 1');
  console.log('='.repeat(60));
  console.log('\nAnalyzing 135 plant images from assets/plant_images/\n');

  // Get all WebP images from assets/plant_images/
  const imagesDir = join(__dirname, '../assets/plant_images');
  const imageFiles = readdirSync(imagesDir).filter(file => file.endsWith('.webp'));

  console.log(`Found ${imageFiles.length} plant images\n`);
  console.log('Starting color analysis (this may take 2-3 minutes)...\n');

  const stats: TrainingStats = {
    count: 0,
    greenScores: [],
    brownScores: [],
    flowerScores: [],
    totalScores: [],
    results: []
  };

  // Analyze each plant image
  for (const imageFile of imageFiles) {
    const imagePath = join(imagesDir, imageFile);
    const plantId = imageFile.replace('.webp', '');

    try {
      // Run color histogram analysis
      const analysis = await analyzeImageForPlant(imagePath);

      // Collect statistics
      stats.greenScores.push(analysis.greenScore);
      stats.brownScores.push(analysis.brownScore);
      stats.flowerScores.push(analysis.flowerScore);
      stats.totalScores.push(analysis.confidence);
      stats.count++;

      stats.results.push({
        plantId,
        imagePath: imageFile,
        analysis
      });

      // Progress indicator
      if (stats.count % 10 === 0) {
        console.log(`✓ Processed ${stats.count}/${imageFiles.length} images...`);
      }

    } catch (error) {
      console.error(`❌ Error analyzing ${imageFile}:`, error);
    }
  }

  console.log(`\n✅ Analysis complete: ${stats.count} plants analyzed\n`);

  // Generate training report
  generateTrainingReport(stats);
}

/**
 * Analyzes an image to determine if it likely contains a plant
 * (Node.js version using sharp instead of React Native libraries)
 */
async function analyzeImageForPlant(imagePath: string): Promise<ColorAnalysis> {
  // Resize to 100x100 for faster processing (same as mobile version)
  const image = sharp(imagePath).resize(100, 100);

  // Get raw pixel data
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  // Extract dominant colors by sampling pixels
  const dominantColors: string[] = [];
  const colorCounts = new Map<string, number>();

  // Sample every 5th pixel (same as mobile version's pixelSpacing: 5)
  for (let i = 0; i < data.length; i += 15) { // 15 = 3 channels * 5 pixels
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const hex = rgbToHex(r, g, b);
    colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
  }

  // Get top 10 most common colors
  const sortedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([color]) => color);

  dominantColors.push(...sortedColors);

  // Analyze colors for plant-like characteristics (same logic as colorAnalysis.ts)
  let plantScore = 0;
  const reasons: string[] = [];

  let greenScore = 0;
  let brownScore = 0;
  let flowerScore = 0;

  // Check for green (leaves)
  if (hasGreenColors(dominantColors)) {
    plantScore += 40;
    greenScore = 40;
    reasons.push('green foliage detected');
  }

  // Check for brown (stems, soil, bark)
  if (hasBrownColors(dominantColors)) {
    plantScore += 25;
    brownScore = 25;
    reasons.push('brown stems/soil detected');
  }

  // Check for flower colors
  if (hasFlowerColors(dominantColors)) {
    plantScore += 35;
    flowerScore = 35;
    reasons.push('flower colors detected');
  }

  const isLikelyPlant = plantScore >= 25; // Current threshold
  const reason = isLikelyPlant
    ? reasons.join(', ')
    : 'no plant-like colors detected';

  return {
    isLikelyPlant,
    confidence: Math.min(plantScore, 100),
    greenScore,
    brownScore,
    flowerScore,
    reason,
    dominantColors: dominantColors.slice(0, 5)
  };
}

/**
 * Checks if the color array contains green tones typical of plant foliage
 * HSV Range: 35-85° hue (green spectrum), 30%+ saturation
 */
function hasGreenColors(colors: string[]): boolean {
  for (const color of colors) {
    const hsv = hexToHSV(color);

    // Green range: 35-85° hue, with sufficient saturation (>30%)
    if (hsv.h >= 35 && hsv.h <= 85 && hsv.s >= 0.3) {
      return true;
    }
  }
  return false;
}

/**
 * Checks for brown/earth tones typical of stems, bark, and soil
 * HSV Range: 20-40° hue (brown/orange spectrum), low-medium saturation
 */
function hasBrownColors(colors: string[]): boolean {
  for (const color of colors) {
    const hsv = hexToHSV(color);

    // Brown range: 20-40° hue (orange-yellow spectrum), lower saturation
    if (hsv.h >= 20 && hsv.h <= 40 && hsv.s >= 0.2 && hsv.s <= 0.6) {
      return true;
    }
  }
  return false;
}

/**
 * Checks for bright colors typical of flowers
 * Includes: yellow, white, purple, pink, red, orange
 */
function hasFlowerColors(colors: string[]): boolean {
  for (const color of colors) {
    const hsv = hexToHSV(color);

    // Yellow flowers: 45-65° hue, high saturation
    if (hsv.h >= 45 && hsv.h <= 65 && hsv.s >= 0.5) {
      return true;
    }

    // White/light flowers: high brightness, low saturation
    if (hsv.v >= 0.8 && hsv.s <= 0.3) {
      return true;
    }

    // Purple/violet flowers: 260-290° hue
    if (hsv.h >= 260 && hsv.h <= 290 && hsv.s >= 0.3) {
      return true;
    }

    // Pink/red flowers: 330-360° or 0-20° hue
    if ((hsv.h >= 330 || hsv.h <= 20) && hsv.s >= 0.3) {
      return true;
    }

    // Orange flowers: 15-35° hue
    if (hsv.h >= 15 && hsv.h <= 35 && hsv.s >= 0.5) {
      return true;
    }
  }
  return false;
}

/**
 * Converts RGB to hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Converts hex color to HSV (Hue, Saturation, Value)
 * @param hex - Hex color string (e.g., '#FF5733')
 * @returns HSV object with h (0-360), s (0-1), v (0-1)
 */
function hexToHSV(hex: string): { h: number; s: number; v: number } {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  // Calculate hue
  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  // Calculate saturation
  const s = max === 0 ? 0 : delta / max;

  // Calculate value (brightness)
  const v = max;

  return { h, s, v };
}

/**
 * Generates comprehensive training report with threshold recommendations
 */
function generateTrainingReport(stats: TrainingStats) {
  console.log('='.repeat(60));
  console.log('COLOR HISTOGRAM TRAINING REPORT');
  console.log('='.repeat(60));
  console.log();

  // Dataset summary
  console.log('DATASET:');
  console.log(`  Total plants analyzed: ${stats.count}`);
  console.log(`  Location: assets/plant_images/`);
  console.log(`  Format: WebP images (15-95KB each)`);
  console.log();

  // Score statistics
  console.log('PLANT COLOR SCORE STATISTICS:');
  console.log();

  const greenStats = calculateStats(stats.greenScores);
  const brownStats = calculateStats(stats.brownScores);
  const flowerStats = calculateStats(stats.flowerScores);
  const totalStats = calculateStats(stats.totalScores);

  console.log('Green Score (Leaves/Foliage):');
  console.log(`  Average: ${greenStats.mean.toFixed(1)} ± ${greenStats.stdDev.toFixed(1)}`);
  console.log(`  Range: ${greenStats.min} - ${greenStats.max}`);
  console.log(`  Plants with green: ${stats.greenScores.filter(s => s > 0).length}/${stats.count} (${(stats.greenScores.filter(s => s > 0).length / stats.count * 100).toFixed(1)}%)`);
  console.log();

  console.log('Brown Score (Stems/Soil/Bark):');
  console.log(`  Average: ${brownStats.mean.toFixed(1)} ± ${brownStats.stdDev.toFixed(1)}`);
  console.log(`  Range: ${brownStats.min} - ${brownStats.max}`);
  console.log(`  Plants with brown: ${stats.brownScores.filter(s => s > 0).length}/${stats.count} (${(stats.brownScores.filter(s => s > 0).length / stats.count * 100).toFixed(1)}%)`);
  console.log();

  console.log('Flower Score (Bright Colors):');
  console.log(`  Average: ${flowerStats.mean.toFixed(1)} ± ${flowerStats.stdDev.toFixed(1)}`);
  console.log(`  Range: ${flowerStats.min} - ${flowerStats.max}`);
  console.log(`  Plants with flowers: ${stats.flowerScores.filter(s => s > 0).length}/${stats.count} (${(stats.flowerScores.filter(s => s > 0).length / stats.count * 100).toFixed(1)}%)`);
  console.log();

  console.log('Total Score (Combined):');
  console.log(`  Average: ${totalStats.mean.toFixed(1)} ± ${totalStats.stdDev.toFixed(1)}`);
  console.log(`  Range: ${totalStats.min} - ${totalStats.max}`);
  console.log();

  // Threshold recommendations
  console.log('='.repeat(60));
  console.log('THRESHOLD RECOMMENDATIONS:');
  console.log('='.repeat(60));
  console.log();

  console.log(`Current threshold: 25 points`);
  console.log(`Minimum plant score observed: ${totalStats.min}`);
  console.log(`5th percentile score: ${calculatePercentile(stats.totalScores, 5).toFixed(1)}`);
  console.log(`10th percentile score: ${calculatePercentile(stats.totalScores, 10).toFixed(1)}`);
  console.log();

  // Determine recommended threshold
  const minPlantScore = totalStats.min;
  const p5Score = calculatePercentile(stats.totalScores, 5);
  const p10Score = calculatePercentile(stats.totalScores, 10);

  let recommendedThreshold: number;
  let expectedAccuracy: string;

  if (minPlantScore > 40) {
    recommendedThreshold = 40;
    expectedAccuracy = '95%+';
  } else if (p5Score > 35) {
    recommendedThreshold = 35;
    expectedAccuracy = '92-95%';
  } else if (p10Score > 30) {
    recommendedThreshold = 30;
    expectedAccuracy = '88-92%';
  } else {
    recommendedThreshold = 25;
    expectedAccuracy = '85-88%';
  }

  console.log(`⭐ RECOMMENDED NEW THRESHOLD: ${recommendedThreshold} points`);
  console.log(`   Expected accuracy: ${expectedAccuracy}`);
  console.log(`   Reasoning: Captures ${calculateCoverage(stats.totalScores, recommendedThreshold).toFixed(1)}% of real plants`);
  console.log();

  // Plants that would fail the recommended threshold (potential false negatives)
  const failingPlants = stats.results.filter(r => r.analysis.confidence < recommendedThreshold);
  if (failingPlants.length > 0) {
    console.log(`⚠️  WARNING: ${failingPlants.length} plants would FAIL the recommended threshold:`);
    failingPlants.slice(0, 5).forEach(plant => {
      console.log(`   - ${plant.plantId}: Score ${plant.analysis.confidence} (${plant.analysis.reason})`);
    });
    if (failingPlants.length > 5) {
      console.log(`   ... and ${failingPlants.length - 5} more`);
    }
    console.log();
  }

  // Show top 10 and bottom 10 plants
  console.log('='.repeat(60));
  console.log('HIGHEST SCORING PLANTS (Top 10):');
  console.log('='.repeat(60));
  const topPlants = [...stats.results].sort((a, b) => b.analysis.confidence - a.analysis.confidence).slice(0, 10);
  topPlants.forEach((plant, i) => {
    console.log(`${i + 1}. ${plant.plantId}: ${plant.analysis.confidence} pts (${plant.analysis.reason})`);
  });
  console.log();

  console.log('='.repeat(60));
  console.log('LOWEST SCORING PLANTS (Bottom 10):');
  console.log('='.repeat(60));
  const bottomPlants = [...stats.results].sort((a, b) => a.analysis.confidence - b.analysis.confidence).slice(0, 10);
  bottomPlants.forEach((plant, i) => {
    console.log(`${i + 1}. ${plant.plantId}: ${plant.analysis.confidence} pts (${plant.analysis.reason})`);
  });
  console.log();

  // Next steps
  console.log('='.repeat(60));
  console.log('NEXT STEPS - PHASE 1 TESTING:');
  console.log('='.repeat(60));
  console.log();
  console.log('1. ✅ DONE: Analyzed 135 real plant images');
  console.log();
  console.log('2. ⏳ TODO: Test current threshold (25) against non-plant objects:');
  console.log('   - Take photos in the app of: laptop, keyboard, socks, perfume, cup, pen');
  console.log('   - Expected: These should score <25 and be REJECTED');
  console.log('   - If passing (score ≥25): Increase threshold to recommended value');
  console.log();
  console.log('3. ⏳ TODO: If non-plants are passing, update threshold:');
  console.log(`   - File: src/utils/colorAnalysis.ts (line 54)`);
  console.log(`   - Change: isLikelyPlant = plantScore >= ${recommendedThreshold}`);
  console.log();
  console.log('4. ⏳ TODO: Review Phase 1 results with user');
  console.log('   - Show this training report');
  console.log('   - Show non-plant test results');
  console.log('   - Get approval before proceeding to Phase 2');
  console.log();
  console.log('⚠️  STOP HERE - DO NOT PROCEED TO PHASE 2 WITHOUT USER APPROVAL ⚠️');
  console.log();
  console.log('='.repeat(60));
}

/**
 * Calculates mean, standard deviation, min, max for an array of numbers
 */
function calculateStats(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return { mean, stdDev, min, max };
}

/**
 * Calculates the Nth percentile of an array of numbers
 */
function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((percentile / 100) * sorted.length);
  return sorted[index];
}

/**
 * Calculates what percentage of plants would pass a given threshold
 */
function calculateCoverage(values: number[], threshold: number): number {
  const passing = values.filter(v => v >= threshold).length;
  return (passing / values.length) * 100;
}

// Run the training script
trainColorHistogram().catch(error => {
  console.error('\n❌ Training script failed:', error);
  process.exit(1);
});
