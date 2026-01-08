#!/bin/bash
# Update Metro Bundler IP in .env file
# Run this script whenever your Mac's IP address changes

echo "🔍 Finding your Mac's local IP address..."

# Get the current IP (excludes localhost)
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$CURRENT_IP" ]; then
  echo "❌ Could not find your Mac's IP address. Make sure you're connected to WiFi."
  exit 1
fi

echo "📍 Your Mac's IP: $CURRENT_IP"

# Update .env file
if [ -f ".env" ]; then
  # Check if EXPO_PUBLIC_METRO_HOST exists
  if grep -q "EXPO_PUBLIC_METRO_HOST" .env; then
    # Update existing line
    sed -i '' "s/EXPO_PUBLIC_METRO_HOST=.*/EXPO_PUBLIC_METRO_HOST=$CURRENT_IP/" .env
    echo "✅ Updated EXPO_PUBLIC_METRO_HOST in .env to $CURRENT_IP"
  else
    # Add new line
    echo "" >> .env
    echo "# Metro Bundler URL (for physical device development)" >> .env
    echo "EXPO_PUBLIC_METRO_HOST=$CURRENT_IP" >> .env
    echo "✅ Added EXPO_PUBLIC_METRO_HOST=$CURRENT_IP to .env"
  fi
else
  echo "❌ .env file not found!"
  exit 1
fi

echo ""
echo "🎯 Next steps:"
echo "   1. Rebuild your app from Xcode"
echo "   2. Make sure your iPhone is on the same WiFi network"
echo "   3. The app will connect to: $CURRENT_IP:8082"
echo ""
echo "💡 Tip: Run this script whenever you switch WiFi networks!"
