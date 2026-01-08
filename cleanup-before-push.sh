#!/bin/bash
#
# Lotus Project Cleanup Script
# Run this before pushing to GitHub to remove unnecessary files
#
# SAFE TO RUN: Only deletes generated/backup files, never source code
#

echo "🧹 Starting Lotus cleanup..."
echo ""

# Track what we delete
DELETED_SIZE=0

# 1. Delete backup JSON files (keep latest one as safety)
echo "📦 Cleaning up backup JSON files..."
BACKUP_COUNT=$(ls src/data/plantCareDatabase.backup.*.json 2>/dev/null | wc -l | tr -d ' ')
if [ "$BACKUP_COUNT" -gt 0 ]; then
  # Keep the most recent backup, delete the rest
  LATEST_BACKUP=$(ls -t src/data/plantCareDatabase.backup.*.json | head -1)
  echo "  Keeping: $LATEST_BACKUP"

  for file in src/data/plantCareDatabase.backup.*.json; do
    if [ "$file" != "$LATEST_BACKUP" ]; then
      SIZE=$(du -sh "$file" | awk '{print $1}')
      rm "$file"
      echo "  ✓ Deleted: $file ($SIZE)"
    fi
  done
  echo "  Deleted $(($BACKUP_COUNT - 1)) old backups, kept 1 latest"
else
  echo "  No backup files found"
fi
echo ""

# 2. Delete archive directory
echo "📁 Cleaning up archive directory..."
if [ -d "archive" ]; then
  ARCHIVE_SIZE=$(du -sh archive | awk '{print $1}')
  rm -rf archive
  echo "  ✓ Deleted archive/ ($ARCHIVE_SIZE)"
else
  echo "  No archive directory found"
fi
echo ""

# 3. Delete icon design archive
echo "🎨 Cleaning up icon design archive..."
if [ -d "icon_design_archive" ]; then
  ICON_SIZE=$(du -sh icon_design_archive | awk '{print $1}')
  rm -rf icon_design_archive
  echo "  ✓ Deleted icon_design_archive/ ($ICON_SIZE)"
else
  echo "  No icon_design_archive directory found"
fi
echo ""

# 4. Delete Python icon generation scripts
echo "🐍 Cleaning up Python scripts..."
PYTHON_FILES=$(ls *.py 2>/dev/null | wc -l | tr -d ' ')
if [ "$PYTHON_FILES" -gt 0 ]; then
  for file in *.py; do
    if [ -f "$file" ]; then
      rm "$file"
      echo "  ✓ Deleted: $file"
    fi
  done
else
  echo "  No Python files found"
fi
echo ""

# 5. Clean build artifacts (just in case)
echo "🔨 Cleaning build artifacts..."
if [ -d "ios/build" ]; then
  BUILD_SIZE=$(du -sh ios/build 2>/dev/null | awk '{print $1}')
  rm -rf ios/build
  echo "  ✓ Deleted ios/build/ ($BUILD_SIZE)"
fi

if [ -d "android/build" ]; then
  ANDROID_BUILD=$(du -sh android/build 2>/dev/null | awk '{print $1}')
  rm -rf android/build
  echo "  ✓ Deleted android/build/ ($ANDROID_BUILD)"
fi

if [ -d "android/app/build" ]; then
  APP_BUILD=$(du -sh android/app/build 2>/dev/null | awk '{print $1}')
  rm -rf android/app/build
  echo "  ✓ Deleted android/app/build/ ($APP_BUILD)"
fi
echo ""

# 6. Clean Metro bundler cache
echo "⚡ Cleaning Metro cache..."
if [ -d ".metro-cache" ]; then
  METRO_SIZE=$(du -sh .metro-cache 2>/dev/null | awk '{print $1}')
  rm -rf .metro-cache
  echo "  ✓ Deleted .metro-cache/ ($METRO_SIZE)"
fi
echo ""

# Summary
echo "✅ Cleanup complete!"
echo ""
echo "📊 What's protected (won't be pushed to GitHub):"
echo "  • ios/Pods/ (1.1GB) - .gitignore ✓"
echo "  • node_modules/ (648MB) - .gitignore ✓"
echo "  • .expo/ cache - .gitignore ✓"
echo ""
echo "🚀 Ready to push to GitHub!"
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Stage changes: git add ."
echo "  3. Commit: git commit -m 'feat: Add modular plant ID architecture'"
echo "  4. Push to dev: git push origin dev"
