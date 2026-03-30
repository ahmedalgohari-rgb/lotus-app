#!/usr/bin/env python3
"""
Rebuild CSV with proper quoting from original backup + batch files
"""

import csv
import glob
from datetime import datetime

print('🔄 Rebuilding CSV from source files with proper quoting...\n')

# Use the earliest backup (before our merging attempts)
EXISTING_DB_BACKUP = 'database_complete_detailed.backup.2026-02-12T00-38-40.csv'
OUTPUT_FILE = 'database_complete_detailed_CLEAN.csv'

print(f'📖 Reading existing plants from: {EXISTING_DB_BACKUP}')

# Read existing database (handle malformed rows gracefully)
existing_plants = []
with open(EXISTING_DB_BACKUP, 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.reader(f)
    header = next(reader)  # Skip header

    for row_num, row in enumerate(reader, 2):
        # Take first 22 columns, pad if less
        if len(row) >= 22:
            row = row[:22]
        else:
            row.extend([''] * (22 - len(row)))

        existing_plants.append(row)

print(f'   ✅ Loaded {len(existing_plants)} existing plants\n')

# Read all batch files
print('📖 Reading new plants from batch files...')
new_plants = []

for i in range(1, 15):  # batches 1-14
    batch_file = f'new_plants_batch{i}.csv'
    try:
        with open(batch_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)  # Skip header

            batch_rows = list(reader)
            new_plants.extend(batch_rows)
            print(f'   ✅ Batch {i}: {len(batch_rows)} plants')
    except FileNotFoundError:
        continue

print(f'\n📖 Total new plants: {len(new_plants)}\n')

# Write properly quoted CSV
header_row = ['Plant ID', 'Common Name', 'Scientific Name', 'Genus', 'Family',
              'Arabic Name', 'Difficulty', 'Type', 'Pet Safe', 'Watering',
              'Light Requirement', 'Light Description', 'Soil Type',
              'Temperature Range', 'Humidity', 'Fertilizer',
              'Plant Info (English)', 'Plant Info (Arabic)',
              'Cairo Suitability', 'Summer Care', 'Winter Care', 'Image URL']

with open(OUTPUT_FILE, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f, quoting=csv.QUOTE_ALL)

    # Write header
    writer.writerow(header_row)

    # Write existing plants
    writer.writerows(existing_plants)

    # Write new plants
    writer.writerows(new_plants)

print(f'✨ Clean CSV created!')
print(f'   Output: {OUTPUT_FILE}')
print(f'   Total rows: {len(existing_plants) + len(new_plants) + 1} (including header)')
print(f'   Expected: ~482 rows (137 existing + 344 new + 1 header)')
