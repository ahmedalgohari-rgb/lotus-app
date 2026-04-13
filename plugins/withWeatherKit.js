const { withInfoPlist, withEntitlementsPlist } = require("expo/config-plugins");

/**
 * Config plugin to enable native WeatherKit + CoreLocation:
 * 1. Adds NSLocationWhenInUseUsageDescription to Info.plist
 * 2. Adds com.apple.developer.weatherkit entitlement
 */
const withWeatherKit = (config) => {
  // Add location permission description to Info.plist
  config = withInfoPlist(config, (mod) => {
    mod.modResults.NSLocationWhenInUseUsageDescription =
      "Lotus uses your location to provide accurate weather-based plant care recommendations for your area.";
    return mod;
  });

  // Add WeatherKit entitlement
  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults["com.apple.developer.weatherkit"] = true;
    return mod;
  });

  return config;
};

module.exports = withWeatherKit;
