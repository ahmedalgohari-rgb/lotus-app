const { withInfoPlist, withDangerousMod } = require("expo/config-plugins");
const { resolve, join } = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

/**
 * Config plugin to fix ITMS-90022 and ITMS-90713 and ITMS-91111:
 * 1. Sets CFBundleIconName in Info.plist
 * 2. Generates all required icon sizes from the 1024x1024 source
 * 3. Writes a complete Contents.json with all required entries
 */

// All icon sizes required by Apple for iPhone submission
const ICON_SIZES = [
  { size: 40, scale: 2, name: "icon-40@2x.png" },
  { size: 40, scale: 3, name: "icon-40@3x.png" },
  { size: 60, scale: 2, name: "icon-60@2x.png" },
  { size: 60, scale: 3, name: "icon-60@3x.png" },
  { size: 76, scale: 2, name: "icon-76@2x.png" },
  { size: 83.5, scale: 2, name: "icon-83.5@2x.png" },
  { size: 1024, scale: 1, name: "icon-1024.png" },
];

const withAppIcon = (config) => {
  // Set CFBundleIconName in Info.plist (fixes ITMS-90713)
  config = withInfoPlist(config, (mod) => {
    mod.modResults.CFBundleIconName = "AppIcon";
    return mod;
  });

  // Generate all icon sizes and write Contents.json
  config = withDangerousMod(config, [
    "ios",
    async (mod) => {
      const projectRoot = mod.modRequest.projectRoot;
      const platformRoot = mod.modRequest.platformProjectRoot;
      const projectName = mod.modRequest.projectName;

      const appIconSetDir = join(
        platformRoot,
        projectName,
        "Images.xcassets",
        "AppIcon.appiconset"
      );

      // Source icon (1024x1024)
      const sourceIcon = resolve(projectRoot, "assets", "icon.png");

      if (!fs.existsSync(sourceIcon)) {
        console.log("[withAppIcon] WARNING: assets/icon.png not found!");
        return mod;
      }

      if (!fs.existsSync(appIconSetDir)) {
        fs.mkdirSync(appIconSetDir, { recursive: true });
      }

      console.log("[withAppIcon] Generating all required icon sizes...");

      const images = [];

      for (const icon of ICON_SIZES) {
        const pixelSize = Math.round(icon.size * icon.scale);
        const destPath = join(appIconSetDir, icon.name);

        try {
          execSync(
            `sips -z ${pixelSize} ${pixelSize} "${sourceIcon}" --out "${destPath}" 2>/dev/null`
          );
          console.log(`[withAppIcon] Generated ${icon.name} (${pixelSize}x${pixelSize})`);
        } catch (e) {
          console.log(`[withAppIcon] WARNING: Failed to generate ${icon.name}: ${e.message}`);
        }

        if (icon.size === 1024) {
          // Universal 1024 entry (required for modern Xcode + "Any Appearance")
          images.push({
            filename: icon.name,
            idiom: "universal",
            platform: "ios",
            size: "1024x1024",
          });
        } else {
          images.push({
            filename: icon.name,
            idiom: "iphone",
            scale: `${icon.scale}x`,
            size: `${icon.size}x${icon.size}`,
          });
          // Also add iPad entries for 76 and 83.5
          if (icon.size === 76 || icon.size === 83.5) {
            images.push({
              filename: icon.name,
              idiom: "ipad",
              scale: `${icon.scale}x`,
              size: `${icon.size}x${icon.size}`,
            });
          }
        }
      }

      const contentsJson = {
        images,
        info: {
          version: 1,
          author: "expo",
        },
      };

      const contentsPath = join(appIconSetDir, "Contents.json");
      fs.writeFileSync(contentsPath, JSON.stringify(contentsJson, null, 2));
      console.log(
        `[withAppIcon] Written Contents.json with ${images.length} entries`
      );

      return mod;
    },
  ]);

  return config;
};

module.exports = withAppIcon;
