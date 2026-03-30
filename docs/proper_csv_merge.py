#!/usr/bin/env python3
"""
Proper CSV merge using csv module to handle embedded newlines
"""

import csv

print('🔄 Merging CSVs properly with csv module...\n')

EXISTING_BACKUP = 'database_complete_detailed.backup.2026-02-12T00-38-40.csv'
OUTPUT_FILE = 'database_complete_detailed_PROPER.csv'

# Read existing plants
existing_plants = []
with open(EXISTING_BACKUP, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    for row in reader:
        if len(row) == 22:
            existing_plants.append(row)

print(f'📖 Existing plants: {len(existing_plants)}')

# Read all batch files
new_plants = []
for i in range(1, 15):
    batch_file = f'new_plants_batch{i}.csv'
    try:
        with open(batch_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)  # Skip header

            batch_count = 0
            for row in reader:
                if len(row) == 22:
                    new_plants.append(row)
                    batch_count += 1

            print(f'   ✅ Batch {i}: {batch_count} plants')
    except FileNotFoundError:
        continue

print(f'\n📖 Total new plants: {len(new_plants)}')

# Write merged CSV
with open(OUTPUT_FILE, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(header)
    writer.writerows(existing_plants)
    writer.writerows(new_plants)

print(f'\n✨ Properly merged CSV created!')
print(f'   Output: {OUTPUT_FILE}')
print(f'   Total: {len(existing_plants) + len(new_plants)} plants')
