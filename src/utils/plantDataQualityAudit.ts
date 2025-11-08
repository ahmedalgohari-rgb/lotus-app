/**
 * Plant Data Quality Audit Tool
 * Tests identification quality across 20+ plants
 * Generates comprehensive data completeness report
 */

import { plantDatabaseService } from '../services/plantDatabase';
import { plantNetService } from '../services/plantnet';

export interface PlantDataQualityResult {
  plantName: string;
  scientificName: string;
  category: string;
  hasWatering: boolean;
  hasHumidity: boolean;
  hasOrientation: boolean;
  hasPlantType: boolean;
  hasPlantInfo: boolean;
  completenessScore: number;
  wateringValue?: string;
  humidityValue?: string;
  orientationValue?: string;
  plantTypeValue?: string;
  infoLength?: number;
}

export interface DataQualityReport {
  totalPlantsTested: number;
  timestamp: string;
  overallCompleteness: number;
  categoryBreakdown: {
    category: string;
    plantsCount: number;
    avgCompleteness: number;
  }[];
  detailedResults: PlantDataQualityResult[];
  dataFieldStats: {
    watering: { present: number; percentage: number };
    humidity: { present: number; percentage: number };
    orientation: { present: number; percentage: number };
    plantType: { present: number; percentage: number };
    plantInfo: { present: number; percentage: number };
  };
  recommendations: string[];
}

/**
 * Test plants to audit - 20+ diverse specimens
 */
const TEST_PLANTS = [
  // Succulents (5)
  { id: 'snake_plant', name: 'Snake Plant', category: 'succulent' },
  { id: 'aloe_vera', name: 'Aloe Vera', category: 'succulent' },
  { id: 'jade_plant', name: 'Jade Plant', category: 'succulent' },
  { id: 'string_of_pearls', name: 'String of Pearls', category: 'succulent' },
  { id: 'zebra_haworthia', name: 'Zebra Haworthia', category: 'succulent' },

  // Tropicals (5)
  { id: 'golden_pothos', name: 'Golden Pothos', category: 'tropical' },
  { id: 'monstera_deliciosa', name: 'Monstera Deliciosa', category: 'tropical' },
  { id: 'philodendron_brasil', name: 'Philodendron Brasil', category: 'tropical' },
  { id: 'calathea_ornata', name: 'Calathea Ornata', category: 'tropical' },
  { id: 'bird_of_paradise', name: 'Bird of Paradise', category: 'tropical' },

  // Flowering (3)
  { id: 'peace_lily', name: 'Peace Lily', category: 'flowering' },
  { id: 'african_violet', name: 'African Violet', category: 'flowering' },
  { id: 'anthurium', name: 'Anthurium', category: 'flowering' },

  // Foliage (4)
  { id: 'rubber_plant', name: 'Rubber Plant', category: 'foliage' },
  { id: 'spider_plant', name: 'Spider Plant', category: 'foliage' },
  { id: 'ficus_benjamina', name: 'Ficus Benjamina', category: 'foliage' },
  { id: 'dracaena_marginata', name: 'Dracaena Marginata', category: 'foliage' },

  // Ferns (2)
  { id: 'boston_fern', name: 'Boston Fern', category: 'fern' },
  { id: 'birds_nest_fern', name: "Bird's Nest Fern", category: 'fern' },

  // Herbs (2)
  { id: 'basil', name: 'Basil', category: 'herb' },
  { id: 'mint', name: 'Mint', category: 'herb' },
];

/**
 * Check data completeness for a single plant
 */
function assessPlantData(plant: any): PlantDataQualityResult {
  const hasWatering = !!(plant.care?.watering?.schedule || plant.care?.watering?.frequency);
  const hasHumidity = !!plant.care?.humidity;
  const hasOrientation = !!plant.care?.light?.requirement;
  const hasPlantType = !!plant.care?.plant_type;
  const hasPlantInfo = !!plant.care?.plant_info && plant.care.plant_info.length > 20;

  const totalFields = 5;
  const presentFields = [hasWatering, hasHumidity, hasOrientation, hasPlantType, hasPlantInfo]
    .filter(Boolean).length;
  const completenessScore = Math.round((presentFields / totalFields) * 100);

  return {
    plantName: plant.names?.common?.[0] || plant.id,
    scientificName: plant.names?.scientific?.[0] || 'Unknown',
    category: plant.care?.plant_type || 'unknown',
    hasWatering,
    hasHumidity,
    hasOrientation,
    hasPlantType,
    hasPlantInfo,
    completenessScore,
    wateringValue: plant.care?.watering?.schedule || plant.care?.watering?.frequency,
    humidityValue: plant.care?.humidity,
    orientationValue: plant.care?.light?.requirement,
    plantTypeValue: plant.care?.plant_type,
    infoLength: plant.care?.plant_info?.length || 0,
  };
}

/**
 * Run comprehensive data quality audit
 */
export async function runPlantDataQualityAudit(): Promise<DataQualityReport> {
  console.log('🔍 Starting comprehensive plant data quality audit...');
  console.log(`📊 Testing ${TEST_PLANTS.length} plants across multiple categories`);

  const results: PlantDataQualityResult[] = [];
  const categoryStats: Record<string, { count: number; totalScore: number }> = {};

  // Test each plant
  for (const testPlant of TEST_PLANTS) {
    console.log(`\n🌿 Testing: ${testPlant.name} (${testPlant.category})`);

    // Get plant from database
    const plant = plantDatabaseService.getPlantById(testPlant.id);

    if (plant) {
      const assessment = assessPlantData(plant);
      results.push(assessment);

      // Track category stats
      if (!categoryStats[testPlant.category]) {
        categoryStats[testPlant.category] = { count: 0, totalScore: 0 };
      }
      categoryStats[testPlant.category].count++;
      categoryStats[testPlant.category].totalScore += assessment.completenessScore;

      console.log(`  ✓ Completeness: ${assessment.completenessScore}%`);
      console.log(`  - Watering: ${assessment.hasWatering ? '✓' : '✗'}`);
      console.log(`  - Humidity: ${assessment.hasHumidity ? '✓' : '✗'}`);
      console.log(`  - Orientation: ${assessment.hasOrientation ? '✓' : '✗'}`);
      console.log(`  - Plant Type: ${assessment.hasPlantType ? '✓' : '✗'}`);
      console.log(`  - Plant Info: ${assessment.hasPlantInfo ? '✓' : '✗'} (${assessment.infoLength} chars)`);
    } else {
      console.log(`  ✗ Plant not found in database`);
      results.push({
        plantName: testPlant.name,
        scientificName: 'Not in database',
        category: testPlant.category,
        hasWatering: false,
        hasHumidity: false,
        hasOrientation: false,
        hasPlantType: false,
        hasPlantInfo: false,
        completenessScore: 0,
      });
    }
  }

  // Calculate overall statistics
  const totalPlants = results.length;
  const overallCompleteness = Math.round(
    results.reduce((sum, r) => sum + r.completenessScore, 0) / totalPlants
  );

  // Category breakdown
  const categoryBreakdown = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    plantsCount: stats.count,
    avgCompleteness: Math.round(stats.totalScore / stats.count),
  }));

  // Data field statistics
  const dataFieldStats = {
    watering: {
      present: results.filter(r => r.hasWatering).length,
      percentage: Math.round((results.filter(r => r.hasWatering).length / totalPlants) * 100),
    },
    humidity: {
      present: results.filter(r => r.hasHumidity).length,
      percentage: Math.round((results.filter(r => r.hasHumidity).length / totalPlants) * 100),
    },
    orientation: {
      present: results.filter(r => r.hasOrientation).length,
      percentage: Math.round((results.filter(r => r.hasOrientation).length / totalPlants) * 100),
    },
    plantType: {
      present: results.filter(r => r.hasPlantType).length,
      percentage: Math.round((results.filter(r => r.hasPlantType).length / totalPlants) * 100),
    },
    plantInfo: {
      present: results.filter(r => r.hasPlantInfo).length,
      percentage: Math.round((results.filter(r => r.hasPlantInfo).length / totalPlants) * 100),
    },
  };

  // Generate recommendations
  const recommendations: string[] = [];
  if (dataFieldStats.watering.percentage < 90) {
    recommendations.push(`Add watering schedules for ${100 - dataFieldStats.watering.percentage}% of plants`);
  }
  if (dataFieldStats.humidity.percentage < 90) {
    recommendations.push(`Add humidity requirements for ${100 - dataFieldStats.humidity.percentage}% of plants`);
  }
  if (dataFieldStats.orientation.percentage < 90) {
    recommendations.push(`Add light/orientation data for ${100 - dataFieldStats.orientation.percentage}% of plants`);
  }
  if (dataFieldStats.plantInfo.percentage < 80) {
    recommendations.push(`Improve plant descriptions for ${100 - dataFieldStats.plantInfo.percentage}% of plants`);
  }
  if (overallCompleteness < 85) {
    recommendations.push(`Overall data completeness is ${overallCompleteness}% - target 90%+`);
  }

  return {
    totalPlantsTested: totalPlants,
    timestamp: new Date().toISOString(),
    overallCompleteness,
    categoryBreakdown,
    detailedResults: results,
    dataFieldStats,
    recommendations,
  };
}

/**
 * Print formatted audit report to console
 */
export function printDataQualityReport(report: DataQualityReport): void {
  console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          PLANT DATA QUALITY AUDIT REPORT                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`📅 Audit Date: ${new Date(report.timestamp).toLocaleString()}`);
  console.log(`🌿 Plants Tested: ${report.totalPlantsTested}`);
  console.log(`📊 Overall Data Completeness: ${report.overallCompleteness}%\n`);

  console.log('═══ DATA FIELD STATISTICS ═══');
  console.log(`Watering Data:    ${report.dataFieldStats.watering.present}/${report.totalPlantsTested} (${report.dataFieldStats.watering.percentage}%)`);
  console.log(`Humidity Data:    ${report.dataFieldStats.humidity.present}/${report.totalPlantsTested} (${report.dataFieldStats.humidity.percentage}%)`);
  console.log(`Orientation Data: ${report.dataFieldStats.orientation.present}/${report.totalPlantsTested} (${report.dataFieldStats.orientation.percentage}%)`);
  console.log(`Plant Type Data:  ${report.dataFieldStats.plantType.present}/${report.totalPlantsTested} (${report.dataFieldStats.plantType.percentage}%)`);
  console.log(`Plant Info Data:  ${report.dataFieldStats.plantInfo.present}/${report.totalPlantsTested} (${report.dataFieldStats.plantInfo.percentage}%)\n`);

  console.log('═══ CATEGORY BREAKDOWN ═══');
  report.categoryBreakdown.forEach(cat => {
    console.log(`${cat.category.padEnd(12)}: ${cat.plantsCount} plants - ${cat.avgCompleteness}% complete`);
  });

  if (report.recommendations.length > 0) {
    console.log('\n═══ RECOMMENDATIONS ═══');
    report.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  } else {
    console.log('\n✅ All data quality metrics meet or exceed targets!');
  }

  console.log('\n═══ DETAILED RESULTS (Low Completeness Plants) ═══');
  const lowCompleteness = report.detailedResults
    .filter(r => r.completenessScore < 80)
    .sort((a, b) => a.completenessScore - b.completenessScore);

  if (lowCompleteness.length === 0) {
    console.log('✅ All plants have ≥80% data completeness!');
  } else {
    lowCompleteness.forEach(plant => {
      console.log(`\n${plant.plantName} (${plant.category}) - ${plant.completenessScore}%`);
      console.log(`  Scientific: ${plant.scientificName}`);
      console.log(`  Missing: ${[
        !plant.hasWatering && 'watering',
        !plant.hasHumidity && 'humidity',
        !plant.hasOrientation && 'orientation',
        !plant.hasPlantType && 'type',
        !plant.hasPlantInfo && 'description'
      ].filter(Boolean).join(', ')}`);
    });
  }

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    END OF REPORT                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
}
