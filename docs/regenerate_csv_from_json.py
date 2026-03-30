#!/usr/bin/env python3
"""
Regenerate CSV from the validated JSON database
"""

import json
import csv

JSON_PATH = '../src/data/plantCareDatabase.json'
OUTPUT_CSV = 'database_complete_detailed_FROM_JSON.csv'

print('🔄 Regenerating CSV from validated JSON database...\n')

# Load JSON
with open(JSON_PATH, 'r', encoding='utf-8') as f:
    db = json.load(f)

plants = db['plants']
print(f'📖 Loaded {len(plants)} plants from JSON\n')

# CSV Header
header = ['Plant ID', 'Common Name', 'Scientific Name', 'Genus', 'Family',
          'Arabic Name', 'Difficulty', 'Type', 'Pet Safe', 'Watering',
          'Light Requirement', 'Light Description', 'Soil Type',
          'Temperature Range', 'Humidity', 'Fertilizer',
          'Plant Info (English)', 'Plant Info (Arabic)',
          'Cairo Suitability', 'Summer Care', 'Winter Care', 'Image URL']

# Convert JSON to CSV rows
rows = []
for plant in plants:
    row = [
        plant['id'],
        plant['names']['common'][0] if plant['names']['common'] else '',
        plant['names']['scientific'][0] if plant['names']['scientific'] else '',
        plant['characteristics'].get('genus', ''),
        plant['characteristics'].get('family', ''),
        plant['names']['arabic'][0] if plant['names']['arabic'] else '',
        plant['care'].get('difficulty', ''),
        plant['care'].get('plant_type', ''),
        'yes' if plant['care'].get('pet_safe', False) else 'no',
        (plant['care'].get('watering', {}).get('frequency', '') + ': ' +
         plant['care'].get('watering', {}).get('description', '')),
        plant['care'].get('light', {}).get('requirement', ''),
        plant['care'].get('light', {}).get('description', ''),
        plant['care'].get('soil', ''),  # soil, not soil_type
        # Format temperature as "min-max°C (optimal: X°C)"
        (f"{plant['care'].get('temperature', {}).get('min', '')}-"
         f"{plant['care'].get('temperature', {}).get('max', '')}°C "
         f"(optimal: {plant['care'].get('temperature', {}).get('optimal', '')}°C)"
         if plant['care'].get('temperature') else ''),
        plant['care'].get('humidity', ''),
        plant['care'].get('fertilizer', ''),
        plant['care'].get('plant_info', ''),
        plant['care'].get('plant_info_arabic', ''),
        plant['characteristics'].get('cairo_suitability', ''),
        # Extract from seasonal_care nested object
        plant['characteristics'].get('seasonal_care', {}).get('summer', ''),
        plant['characteristics'].get('seasonal_care', {}).get('winter', ''),
        plant['image_url'] if 'image_url' in plant else ''
    ]
    rows.append(row)

# Write CSV with proper quoting
with open(OUTPUT_CSV, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f, quoting=csv.QUOTE_ALL)
    writer.writerow(header)
    writer.writerows(rows)

print(f'✅ CSV regenerated successfully!')
print(f'   Output: {OUTPUT_CSV}')
print(f'   Total rows: {len(rows) + 1} (including header)')
print(f'   All fields properly quoted')
print(f'\n✨ This CSV can now be opened in Numbers without errors!')
