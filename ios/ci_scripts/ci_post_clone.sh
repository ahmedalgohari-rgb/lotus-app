#!/bin/sh
set -e

# Install Homebrew packages needed for the build
brew install node@22

# Install npm dependencies (needed for Expo autolinking + native modules)
cd "$CI_WORKSPACE"
npm install

# Install CocoaPods dependencies
cd "$CI_WORKSPACE/ios"
pod install
