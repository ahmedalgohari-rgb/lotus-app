const { withXcodeProject } = require("expo/config-plugins");

/**
 * Config plugin to disable User Script Sandboxing in Xcode 16+.
 *
 * Xcode 16 defaults ENABLE_USER_SCRIPT_SANDBOXING to YES, which blocks
 * Expo's expo-configure-project.sh from running during the build phase.
 * This plugin sets it to NO for all build configurations.
 *
 * Survives `npx expo prebuild --clean`.
 */
const withDisableSandbox = (config) => {
  return withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    const buildConfigs = project.pbxXCBuildConfigurationSection();

    for (const key in buildConfigs) {
      const config = buildConfigs[key];
      if (config.buildSettings) {
        config.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = "NO";
      }
    }

    console.log("[withDisableSandbox] Set ENABLE_USER_SCRIPT_SANDBOXING = NO for all build configs");
    return mod;
  });
};

module.exports = withDisableSandbox;
