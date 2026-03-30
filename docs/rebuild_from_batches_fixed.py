#!/usr/bin/env python3
"""
Rebuild CSV from batch files - handling embedded newlines properly
"""

import csv
import re

print('🔄 Rebuilding CSV from batch files (handling embedded newlines)...\n')

EXISTING_DB_BACKUP = 'database_complete_detailed.backup.2026-02-12T00-38-40.csv'
OUTPUT_FILE = 'database_complete_detailed_REBUILT.csv'

# Read existing plants
print(f'📖 Reading existing plants from backup...')
existing_plants = []

with open(EXISTING_DB_BACKUP, 'r', encoding='utf-8') as f:
    # Read raw content and fix any embedded newlines
    content = f.read()

    # Parse with csv module
    reader = csv.reader(content.splitlines())
    header = next(reader)

    for row in reader:
        if len(row) >= 22:
            existing_plants.append(row[:22])
        elif len(row) > 0:
            # Pad short rows
            row.extend([''] * (22 - len(row)))
            existing_plants.append(row)

print(f'   ✅ Loaded {len(existing_plants)} existing plants\n')

# Read batch files - read raw content line by line
print('📖 Reading new plants from batch files...')
new_plants = []

for batch_num in range(1, 15):
    batch_file = f'new_plants_batch{batch_num}.csv'

    try:
        with open(batch_file, 'r', encoding='utf-8') as f:
            # Read entire content
            content = f.read()

            # Split into lines
            lines = content.splitlines()

            # Skip header
            if lines and 'Plant ID' in lines[0]:
                lines = lines[1:]

            # Parse each line as CSV
            batch_plants = []
            for line in lines:
                if line.strip():
                    try:
                        # Try to parse as single row
                        row = next(csv.reader([line]))
                        if len(row) >= 22:
                            batch_plants.append(row[:22])
                    except:
                        # Skip malformed lines
                        continue

            new_plants.extend(batch_plants)
            print(f'   ✅ Batch {batch_num}: {len(batch_plants)} plants')

    except FileNotFoundError:
        continue

print(f'\n📖 Total new plants: {len(new_plants)}\n')

# Write combined CSV with proper quoting
header_row = ['Plant ID', 'Common Name', 'Scientific Name', 'Genus', 'Family',
              'Arabic Name', 'Difficulty', 'Type', 'Pet Safe', 'Watering',
              'Light Requirement', 'Light Description', 'Soil Type',
              'Temperature Range', 'Humidity', 'Fertilizer',
              'Plant Info (English)', 'Plant Info (Arabic)',
              'Cairo Suitability', 'Summer Care', 'Winter Care', 'Image URL']

with open(OUTPUT_FILE, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f, quoting=csv.QUOTE_ALL)
    writer.writerow(header_row)
    writer.writerows(existing_plants)
    writer.writerows(new_plants)

print(f'✨ Rebuilt CSV created!')
print(f'   Output: {OUTPUT_FILE}')
print(f'   Existing: {len(existing_plants)} plants')
print(f'   New: {len(new_plants)} plants')
print(f'   Total: {len(existing_plants) + len(new_plants) + 1} rows (with header)')
