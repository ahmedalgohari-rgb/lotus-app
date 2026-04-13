const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Config plugin to fix fmt library build error on Xcode 16+.
 * Patches the Podfile post_install to set C++17 on the fmt target.
 * This survives `npx expo prebuild --clean`.
 */
const withFmtFix = (config) => {
  config = withDangerousMod(config, [
    "ios",
    async (mod) => {
      const podfilePath = path.join(mod.modRequest.platformProjectRoot, "Podfile");
      let podfile = fs.readFileSync(podfilePath, "utf8");

      const fmtFix = `
    # Fix fmt library build error on Xcode 16+
    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        target.build_configurations.each do |config|
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        end
      end
    end`;

      // Only add if not already present
      if (!podfile.includes("target.name == 'fmt'")) {
        // Insert before the last `end` in post_install
        podfile = podfile.replace(
          /(\s*end\s*\nend\s*)$/,
          `${fmtFix}\n$1`
        );
        fs.writeFileSync(podfilePath, podfile, "utf8");
        console.log("[withFmtFix] Patched Podfile with fmt C++17 fix");
      }

      return mod;
    },
  ]);

  return config;
};

module.exports = withFmtFix;
