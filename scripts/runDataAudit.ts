#!/usr/bin/env ts-node
/**
 * Run Plant Data Quality Audit
 * Usage: npx ts-node scripts/runDataAudit.ts
 */

import { runPlantDataQualityAudit, printDataQualityReport } from '../src/utils/plantDataQualityAudit';

async function main() {
  console.log('🚀 Starting Plant Data Quality Audit...\n');

  try {
    const report = await runPlantDataQualityAudit();
    printDataQualityReport(report);

    // Also save to file for reference
    const fs = require('fs');
    const path = require('path');
    const outputPath = path.join(__dirname, '../plant-data-quality-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved to: ${outputPath}`);

  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

main();
