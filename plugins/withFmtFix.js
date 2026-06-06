const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Config plugin: patches Podfile post_install with two build fixes.
 *
 * Fix 1 (Xcode 16+): fmt library requires C++17.
 * Fix 2 (Xcode 26 beta): libtool warns-as-error on empty object files
 *   (libwebp, libdav1d, etc.) — suppress with -no_warning_for_no_symbols.
 *
 * Both fixes live in one loop so they survive `npx expo prebuild --clean`.
 */
const withFmtFix = (config) => {
  config = withDangerousMod(config, [
    "ios",
    async (mod) => {
      const podfilePath = path.join(mod.modRequest.platformProjectRoot, "Podfile");
      let podfile = fs.readFileSync(podfilePath, "utf8");

      const combinedFix = `
    # Fix fmt C++17 build error (Xcode 16+) and libtool empty-object warning (Xcode 26 beta)
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['OTHER_LIBTOOLFLAGS'] = '-no_warning_for_no_symbols'
        if target.name == 'fmt'
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        end
      end
    end`;

      if (!podfile.includes("OTHER_LIBTOOLFLAGS")) {
        podfile = podfile.replace(
          /(\s*end\s*\nend\s*)$/,
          `${combinedFix}\n$1`
        );
        fs.writeFileSync(podfilePath, podfile, "utf8");
        console.log("[withFmtFix] Patched Podfile with fmt C++17 + libtool fixes");
      }

      return mod;
    },
  ]);

  return config;
};

module.exports = withFmtFix;
