import ExpoModulesCore
import CoreLocation

#if canImport(WeatherKit)
import WeatherKit
#endif

// MARK: - Location Helper (Main Thread Safe)

private class LocationHelper: NSObject, CLLocationManagerDelegate {
  private var manager: CLLocationManager?
  private var locationContinuation: CheckedContinuation<CLLocation, Error>?

  func requestLocation() async throws -> CLLocation {
    return try await withCheckedThrowingContinuation { continuation in
      self.locationContinuation = continuation

      DispatchQueue.main.async { [weak self] in
        guard let self = self else {
          continuation.resume(throwing: LocationError.failed("LocationHelper deallocated"))
          return
        }

        let mgr = CLLocationManager()
        mgr.delegate = self
        mgr.desiredAccuracy = kCLLocationAccuracyKilometer
        self.manager = mgr

        print("[LotusWeather] CLLocationManager created on main thread")
        print("[LotusWeather] Authorization status: \(mgr.authorizationStatus.rawValue)")

        let status = mgr.authorizationStatus
        if status == .denied || status == .restricted {
          print("[LotusWeather] Location permission denied/restricted")
          self.locationContinuation?.resume(throwing: LocationError.denied)
          self.locationContinuation = nil
          return
        }

        if status == .notDetermined {
          print("[LotusWeather] Requesting location permission...")
          mgr.requestWhenInUseAuthorization()
          // Delegate will call requestLocation() after authorization
        } else {
          print("[LotusWeather] Already authorized, requesting location...")
          mgr.requestLocation()
        }
      }
    }
  }

  // MARK: CLLocationManagerDelegate

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    let status = manager.authorizationStatus
    print("[LotusWeather] Authorization changed to: \(status.rawValue)")

    switch status {
    case .authorizedWhenInUse, .authorizedAlways:
      print("[LotusWeather] Permission granted, requesting location...")
      manager.requestLocation()
    case .denied, .restricted:
      print("[LotusWeather] Permission denied by user")
      locationContinuation?.resume(throwing: LocationError.denied)
      locationContinuation = nil
    default:
      // .notDetermined — still waiting for user response
      break
    }
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let location = locations.first else { return }
    print("[LotusWeather] Got location: \(location.coordinate.latitude), \(location.coordinate.longitude)")
    locationContinuation?.resume(returning: location)
    locationContinuation = nil
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    print("[LotusWeather] Location error: \(error.localizedDescription)")
    locationContinuation?.resume(throwing: error)
    locationContinuation = nil
  }
}

private enum LocationError: Error, LocalizedError {
  case denied
  case failed(String)

  var errorDescription: String? {
    switch self {
    case .denied:
      return "Location permission denied"
    case .failed(let reason):
      return "Location failed: \(reason)"
    }
  }
}

// MARK: - Expo Module

public class LotusWeatherModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LotusWeatherModule")

    AsyncFunction("getWeather") { () -> [String: Any] in
      guard #available(iOS 16.0, *) else {
        throw NSError(
          domain: "LotusWeather",
          code: 1,
          userInfo: [NSLocalizedDescriptionKey: "WeatherKit requires iOS 16+"]
        )
      }

      return try await self.fetchWeather()
    }
  }

  @available(iOS 16.0, *)
  private func fetchWeather() async throws -> [String: Any] {
    print("[LotusWeather] Starting weather fetch...")

    // 1. Get user location
    print("[LotusWeather] Step 1: Requesting location...")
    let locationHelper = LocationHelper()
    let location = try await locationHelper.requestLocation()
    print("[LotusWeather] Step 1 complete: \(location.coordinate.latitude), \(location.coordinate.longitude)")

    // 2. Fetch weather from Apple WeatherKit
    print("[LotusWeather] Step 2: Fetching WeatherKit data...")
    let weatherService = WeatherService.shared
    let weather = try await weatherService.weather(for: location)
    print("[LotusWeather] Step 2 complete: got weather data")

    let current = weather.currentWeather
    let daily = weather.dailyForecast.first

    let tempMin = daily?.lowTemperature.value ?? current.temperature.value
    let tempMax = daily?.highTemperature.value ?? current.temperature.value
    let tempAvg = (tempMin + tempMax) / 2.0

    print("[LotusWeather] Temps: min=\(tempMin), max=\(tempMax), avg=\(tempAvg)")

    // 3. Reverse-geocode for city name
    print("[LotusWeather] Step 3: Reverse geocoding...")
    let geocoder = CLGeocoder()
    let placemarks = try? await geocoder.reverseGeocodeLocation(location)
    let locationName = placemarks?.first?.locality ?? placemarks?.first?.administrativeArea ?? ""
    print("[LotusWeather] Step 3 complete: location = '\(locationName)'")

    // 4. Map condition and build result
    let conditionCode = String(describing: current.condition)
    let description = current.condition.description

    print("[LotusWeather] Condition: \(conditionCode) - \(description)")
    print("[LotusWeather] Returning result to JS")

    return [
      "temperature": round(tempAvg),
      "temperatureMin": round(tempMin),
      "temperatureMax": round(tempMax),
      "humidity": round(current.humidity * 100), // 0-1 → 0-100
      "windSpeed": round(current.wind.speed.converted(to: .metersPerSecond).value * 10) / 10,
      "conditionCode": conditionCode,
      "description": description,
      "locationName": locationName,
      "latitude": location.coordinate.latitude,
      "longitude": location.coordinate.longitude
    ]
  }
}
