#!/usr/bin/env python3
import csv

with open('database_complete_detailed_FIXED.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    rows = list(reader)

bad_rows = [(i+1, len(row)) for i, row in enumerate(rows) if len(row) != 22]

print(f'✅ Total rows: {len(rows)}')
print(f'✅ Rows with 22 columns: {len(rows) - len(bad_rows)}')
print(f'❌ Bad rows: {len(bad_rows)}')

if bad_rows:
    print('\nProblematic rows:')
    for line, cols in bad_rows[:10]:
        print(f'  Line {line}: {cols} columns')
else:
    print('\n🎉 All rows have exactly 22 columns!')
