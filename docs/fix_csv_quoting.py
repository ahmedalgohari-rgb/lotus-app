#!/usr/bin/env python3
"""
Fix CSV quoting issues - properly quote all fields to ensure 22 columns
"""

import csv
import sys

INPUT_FILE = 'database_complete_detailed.csv'
OUTPUT_FILE = 'database_complete_detailed_FIXED.csv'

print('🔧 Fixing CSV quoting issues...\n')

# Create backup
import shutil
from datetime import datetime
timestamp = datetime.now().strftime('%Y-%m-%dT%H-%M-%S')
backup_file = f'database_complete_detailed.backup.{timestamp}.csv'
shutil.copy(INPUT_FILE, backup_file)
print(f'✅ Backup created: {backup_file}\n')

# Read and rewrite with proper quoting
rows_fixed = 0
rows_total = 0

with open(INPUT_FILE, 'r', encoding='utf-8') as infile, \
     open(OUTPUT_FILE, 'w', encoding='utf-8', newline='') as outfile:

    # Use csv.QUOTE_ALL to quote every field
    writer = csv.writer(outfile, quoting=csv.QUOTE_ALL)

    # Read line by line to handle malformed rows
    reader = csv.reader(infile)

    for row_num, row in enumerate(reader, 1):
        rows_total += 1

        if len(row) != 22:
            print(f'   ⚠️  Line {row_num}: {len(row)} columns (expected 22) - {row[0] if row else "empty"}')
            rows_fixed += 1

            # Try to fix by taking only first 22 columns if more, padding if less
            if len(row) > 22:
                row = row[:22]
            elif len(row) < 22:
                row.extend([''] * (22 - len(row)))

        writer.writerow(row)

print(f'\n✨ CSV Fixed!')
print(f'   Total rows: {rows_total}')
print(f'   Rows fixed: {rows_fixed}')
print(f'   Output: {OUTPUT_FILE}')
print(f'\n⚠️  NEXT: Review {OUTPUT_FILE} then replace original')
