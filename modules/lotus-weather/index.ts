import { requireNativeModule } from 'expo-modules-core';

export interface NativeWeatherResult {
  temperature: number;
  temperatureMin: number;
  temperatureMax: number;
  humidity: number;
  windSpeed: number;
  conditionCode: string;
  description: string;
  locationName: string;
  latitude: number;
  longitude: number;
}

const LotusWeatherModule = requireNativeModule('LotusWeatherModule');

export async function getNativeWeather(): Promise<NativeWeatherResult> {
  return await LotusWeatherModule.getWeather();
}
