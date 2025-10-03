#!/bin/bash

set -e

# Build the app with EAS
eas build --local --profile detox --platform ios --non-interactive

# Find the build artifact
BUILD_ARCHIVE=$(find . -name "build-*.tar.gz" -print -quit)

# Extract the archive
tar -xzf $BUILD_ARCHIVE -C ./bin

# Find the app and move it
find ./bin -name "*.app" -depth 1 -exec mv {} ./bin/Lotus.app \;

# Clean up
rm $BUILD_ARCHIVE
