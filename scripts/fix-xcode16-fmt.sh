#!/bin/bash
# Fix for Xcode 16 + fmt library consteval compatibility issue
# Run this after `pod install` or when you get FMT_STRING consteval errors

FMT_BASE_H="ios/Pods/fmt/include/fmt/base.h"

if [ ! -f "$FMT_BASE_H" ]; then
    echo "❌ fmt library not found at $FMT_BASE_H"
    echo "   Run 'pod install' first, then run this script."
    exit 1
fi

# Check if already patched
if grep -q "Fix for Xcode 16 consteval" "$FMT_BASE_H"; then
    echo "✅ Already patched - fmt library is ready for Xcode 16"
    exit 0
fi

# Find the line after "#endif" that follows FMT_CONSTEXPR20 definition
# and insert our fix there
sed -i '' '/^#  define FMT_CONSTEXPR20$/,/^#endif$/{
    /^#endif$/a\
\
// Fix for Xcode 16 consteval compatibility - override after detection\
#undef FMT_USE_CONSTEVAL\
#undef FMT_CONSTEVAL\
#undef FMT_CONSTEXPR20\
#define FMT_USE_CONSTEVAL 0\
#define FMT_CONSTEVAL\
#define FMT_CONSTEXPR20
}' "$FMT_BASE_H"

# Verify the patch was applied
if grep -q "Fix for Xcode 16 consteval" "$FMT_BASE_H"; then
    echo "✅ Successfully patched fmt library for Xcode 16 compatibility"
    echo "   You can now run: npx expo run:ios"
else
    echo "❌ Patch failed - please apply manually or check the script"
    exit 1
fi
