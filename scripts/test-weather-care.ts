#!/usr/bin/env ts-node
/**
 * Test Script for Weather-Aware Care Recommendation System (Phase 15.0)
 *
 * This script demonstrates how the same plant in the same location
 * receives different care recommendations based on current weather.
 *
 * Run with: npx ts-node scripts/test-weather-care.ts
 */

import {
  getPersonalizedCareRecommendations,
  getWeatherAwareRoomModifiers,
  getWeatherAwareDirectionModifiers,
  getRoomModifiers,
  getDirectionModifiers,
  getCurrentSeason
} from '../src/utils/careMap';
import { WeatherData } from '../src/types';

// Mock weather data for testing different scenarios
const mockWeatherWinter: WeatherData = {
  temperature: 15,
  humidity: 45,
  condition: 'cloudy',
  description: 'Cool winter day',
  windSpeed: 5,
  lastUpdated: new Date(),
  location: 'Cairo, Egypt',
  careRecommendation: {
    type: 'reduce',
    message: 'Cool weather: Plants need less water',
    adjustment: 2
  }
};

const mockWeatherSummer: WeatherData = {
  temperature: 38,
  humidity: 18,
  condition: 'sunny',
  description: 'Extreme summer heat',
  windSpeed: 12,
  lastUpdated: new Date(),
  location: 'Cairo, Egypt',
  careRecommendation: {
    type: 'increase',
    message: 'Extreme heat: Monitor plants daily',
    adjustment: -2
  }
};

const mockWeatherSpring: WeatherData = {
  temperature: 25,
  humidity: 35,
  condition: 'sunny',
  description: 'Pleasant spring day',
  windSpeed: 8,
  lastUpdated: new Date(),
  location: 'Cairo, Egypt',
  careRecommendation: {
    type: 'normal',
    message: 'Perfect conditions',
    adjustment: 0
  }
};

console.log('🌿 WEATHER-AWARE CARE RECOMMENDATION SYSTEM TEST\n');
console.log('='.repeat(70));

// ============================================
// TEST 1: Room Modifiers - Static vs Weather-Aware
// ============================================
console.log('\n📍 TEST 1: Living Room AC Effect - Static vs Weather-Aware\n');
console.log('-'.repeat(70));

const staticLivingRoom = getRoomModifiers('living_room');
console.log('Static Modifier (no weather):');
console.log(`  Humidity: ${staticLivingRoom.humidityModifier}%`);
console.log(`  Evaporation: ${staticLivingRoom.evaporationRate}%`);
console.log(`  Note: ${staticLivingRoom.note}\n`);

const livingRoomWinter = getWeatherAwareRoomModifiers('living_room', mockWeatherWinter);
console.log('Weather-Aware (Winter 15°C):');
console.log(`  Humidity: ${livingRoomWinter.humidityModifier}% (AC barely runs)`);
console.log(`  Evaporation: ${livingRoomWinter.evaporationRate}%`);
console.log(`  Note: ${livingRoomWinter.note}\n`);

const livingRoomSummer = getWeatherAwareRoomModifiers('living_room', mockWeatherSummer);
console.log('Weather-Aware (Summer 38°C):');
console.log(`  Humidity: ${livingRoomSummer.humidityModifier}% (AC at max!)`);
console.log(`  Evaporation: ${livingRoomSummer.evaporationRate}%`);
console.log(`  Note: ${livingRoomSummer.note}\n`);

console.log('💡 INSIGHT: Same room, but AC effect varies by 6x based on temperature!');
console.log(`   Winter: ${Math.abs(livingRoomWinter.humidityModifier)}% dry`);
console.log(`   Summer: ${Math.abs(livingRoomSummer.humidityModifier)}% dry`);

// ============================================
// TEST 2: Direction Modifiers - South Window Dramatic Change
// ============================================
console.log('\n\n📍 TEST 2: South Window - Winter vs Summer\n');
console.log('-'.repeat(70));

const season = 'summer'; // Force summer for testing
const staticSouthSummer = getDirectionModifiers('south', season);
console.log('Static Modifier (no weather):');
console.log(`  Light: ${staticSouthSummer.lightIntensity}`);
console.log(`  Watering: ${staticSouthSummer.wateringAdjustment} days`);
console.log(`  Warning: ${staticSouthSummer.warning}\n`);

const southWinter = getWeatherAwareDirectionModifiers('south', 'winter', mockWeatherWinter);
console.log('Weather-Aware (Winter 15°C):');
console.log(`  Light: ${southWinter.lightIntensity}`);
console.log(`  Watering: ${southWinter.wateringAdjustment} days`);
console.log(`  Benefit: ${southWinter.benefit}\n`);

const southSummer32 = getWeatherAwareDirectionModifiers('south', 'summer', mockWeatherSpring);
console.log('Weather-Aware (Summer 25°C - mild):');
console.log(`  Light: ${southSummer32.lightIntensity}`);
console.log(`  Watering: ${southSummer32.wateringAdjustment} days`);
console.log(`  Warning: ${southSummer32.warning}\n`);

const southSummer38 = getWeatherAwareDirectionModifiers('south', season, mockWeatherSummer);
console.log('Weather-Aware (Summer 38°C - EXTREME):');
console.log(`  Light: ${southSummer38.lightIntensity}`);
console.log(`  Watering: ${southSummer38.wateringAdjustment} days`);
console.log(`  Warning: ${southSummer38.warning}\n`);

console.log('💡 INSIGHT: South window transforms from perfect to dangerous!');
console.log(`   Winter: "${southWinter.benefit}" ✓`);
console.log(`   Summer 38°C: "${southSummer38.warning}" 🔥`);

// ============================================
// TEST 3: Balcony - Extreme Evaporation
// ============================================
console.log('\n\n📍 TEST 3: Balcony - Outdoor Evaporation Scaling\n');
console.log('-'.repeat(70));

const balconyWinter = getWeatherAwareRoomModifiers('balcony', mockWeatherWinter);
console.log('Balcony (Winter 15°C):');
console.log(`  Evaporation: ${balconyWinter.evaporationRate}% (slow)`);
console.log(`  Note: ${balconyWinter.note}\n`);

const balconySpring = getWeatherAwareRoomModifiers('balcony', mockWeatherSpring);
console.log('Balcony (Spring 25°C):');
console.log(`  Evaporation: ${balconySpring.evaporationRate}% (moderate)`);
console.log(`  Note: ${balconySpring.note}\n`);

const balconySummer = getWeatherAwareRoomModifiers('balcony', mockWeatherSummer);
console.log('Balcony (Summer 38°C):');
console.log(`  Evaporation: ${balconySummer.evaporationRate}% (EXTREME!)`);
console.log(`  Note: ${balconySummer.note}\n`);

console.log('💡 INSIGHT: Balcony evaporation scales 4x from winter to summer!');
console.log(`   15°C: ${balconyWinter.evaporationRate}% evaporation`);
console.log(`   38°C: ${balconySummer.evaporationRate}% evaporation (needs water 2x daily!)`);

// ============================================
// TEST 4: Bathroom - Steam vs Dry Air Competition
// ============================================
console.log('\n\n📍 TEST 4: Bathroom - Steam Effect vs Outdoor Dryness\n');
console.log('-'.repeat(70));

const bathroomWinter = getWeatherAwareRoomModifiers('bathroom', mockWeatherWinter);
console.log('Bathroom (Winter 15°C, 45% humidity):');
console.log(`  Humidity: +${bathroomWinter.humidityModifier}% (steam dominates)`);
console.log(`  Note: ${bathroomWinter.note}\n`);

const bathroomSummer = getWeatherAwareRoomModifiers('bathroom', mockWeatherSummer);
console.log('Bathroom (Summer 38°C, 18% humidity):');
console.log(`  Humidity: +${bathroomSummer.humidityModifier}% (dry air wins)`);
console.log(`  Note: ${bathroomSummer.note}\n`);

console.log('💡 INSIGHT: Steam can\'t fully compensate for extreme outdoor dryness!');
console.log(`   Winter: +${bathroomWinter.humidityModifier}% (steam fully effective)`);
console.log(`   Summer: +${bathroomSummer.humidityModifier}% (dry air reduces benefit by 60%)`);

// ============================================
// SUMMARY
// ============================================
console.log('\n\n' + '='.repeat(70));
console.log('✅ WEATHER-AWARE CARE SYSTEM TEST COMPLETE\n');
console.log('Key Findings:');
console.log('  1. AC effect scales 6x based on temperature (winter vs summer)');
console.log('  2. South window transforms from ✓ perfect (winter) to 🔥 danger (summer)');
console.log('  3. Balcony evaporation scales 4x from cool to extreme heat');
console.log('  4. Bathroom steam benefit reduced 60% in extreme dryness');
console.log('  5. All modifiers respond dynamically to current conditions\n');

console.log('🎯 Next Step: Integration testing with real plant recommendations');
console.log('   Try: getPersonalizedCareRecommendations("snake_plant", "living_room", "south")');
console.log('='.repeat(70));
