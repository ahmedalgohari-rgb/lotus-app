#!/bin/sh
set -e

# Xcode Cloud's shell has a minimal PATH — add Homebrew for both Intel and Apple Silicon
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# Install Node.js if npm isn't already available
if ! command -v npm &>/dev/null; then
    brew install node
fi

# Install npm dependencies (needed for Expo autolinking + lotus-weather native module)
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install

# Install CocoaPods dependencies
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install
