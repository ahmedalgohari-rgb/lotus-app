#!/bin/sh
set -e

# Install npm dependencies (needed for Expo autolinking + native modules)
# Note: Xcode Cloud provides Node.js and CocoaPods pre-installed
cd "$CI_WORKSPACE"
npm install

# Install CocoaPods dependencies
cd "$CI_WORKSPACE/ios"
pod install
