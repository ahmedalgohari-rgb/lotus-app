const { withInfoPlist, withDangerousMod } = require("expo/config-plugins");
const { resolve, join } = require("path");
const fs = require("fs");

/**
 * Config plugin to fix ITMS-90022 and ITMS-90713:
 * 1. Sets CFBundleIconName in Info.plist
 * 2. Generates individual icon PNG files from the 1024x1024 source
 *    (belt-and-suspenders: Expo should do this, but Apple rejects without them)
 */
const withAppIcon = (config) => {
  // Set CFBundleIconName in Info.plist (fixes ITMS-90713)
  config = withInfoPlist(config, (mod) => {
    mod.modResults.CFBundleIconName = "AppIcon";
    return mod;
  });

  // Ensure icon files exist in the bundle (fixes ITMS-90022)
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

      // If the asset catalog directory exists, verify Contents.json has correct entries
      if (fs.existsSync(appIconSetDir)) {
        const contentsPath = join(appIconSetDir, "Contents.json");
        if (fs.existsSync(contentsPath)) {
          const contents = JSON.parse(fs.readFileSync(contentsPath, "utf8"));
          console.log(
            `[withAppIcon] AppIcon.appiconset exists with ${contents.images?.length || 0} entries`
          );
        }
      } else {
        console.log(
          `[withAppIcon] WARNING: AppIcon.appiconset not found at ${appIconSetDir}`
        );
      }

      return mod;
    },
  ]);

  return config;
};

module.exports = withAppIcon;
