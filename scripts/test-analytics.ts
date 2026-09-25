import {
  calculateAverageTemperature,
  calculateMaximumTemperature,
  calculateMinimumTemperature,
  calculateAverageHumidity,
  calculateTotalPrecipitation,
  calculateMaximumWindSpeed,
  calculateAverageWindSpeed,
  calculateConditionDistribution,
  computeWeatherAnalytics,
} from '../lib/analytics/weather';
import { WeatherObservation } from '../types/weather';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ Passed: ${message}`);
  }
}

console.log('--- RUNNING WEATHER ANALYTICS INTEGRITY TESTS ---');

// Test 1: Temperature Metrics against known values (20, 25, 30)
const sampleObservations: WeatherObservation[] = [
  {
    id: 1,
    location_id: 'test-loc-1',
    recorded_at: '2026-09-25T10:00:00Z',
    temperature: 20,
    feels_like: 21,
    humidity: 50,
    pressure: 1012,
    wind_speed: 10,
    wind_direction: 180,
    precipitation: 1.5,
    cloud_cover: 20,
    visibility: 10,
    uv_index: 3,
    weather_code: 0, // Clear
  },
  {
    id: 2,
    location_id: 'test-loc-1',
    recorded_at: '2026-09-25T11:00:00Z',
    temperature: 25,
    feels_like: 26,
    humidity: 60,
    pressure: 1011,
    wind_speed: 20,
    wind_direction: 190,
    precipitation: 2.5,
    cloud_cover: 50,
    visibility: 8,
    uv_index: 5,
    weather_code: 2, // Partly Cloudy
  },
  {
    id: 3,
    location_id: 'test-loc-1',
    recorded_at: '2026-09-25T12:00:00Z',
    temperature: 30,
    feels_like: 32,
    humidity: 70,
    pressure: 1010,
    wind_speed: 15,
    wind_direction: 200,
    precipitation: 0.2,
    cloud_cover: 80,
    visibility: 9,
    uv_index: 6,
    weather_code: 61, // Rain
  },
];

const avgTemp = calculateAverageTemperature(sampleObservations);
assert(avgTemp === 25, `Average temperature should be 25°C, got ${avgTemp}`);

const maxTemp = calculateMaximumTemperature(sampleObservations);
assert(maxTemp === 30, `Maximum temperature should be 30°C, got ${maxTemp}`);

const minTemp = calculateMinimumTemperature(sampleObservations);
assert(minTemp === 20, `Minimum temperature should be 20°C, got ${minTemp}`);

const avgHum = calculateAverageHumidity(sampleObservations);
assert(avgHum === 60, `Average humidity should be 60%, got ${avgHum}`);

const totalPrecip = calculateTotalPrecipitation(sampleObservations);
assert(totalPrecip === 4.2, `Total precipitation should be 4.2mm, got ${totalPrecip}`);

const maxWind = calculateMaximumWindSpeed(sampleObservations);
assert(maxWind === 20, `Maximum wind speed should be 20 km/h, got ${maxWind}`);

const avgWind = calculateAverageWindSpeed(sampleObservations);
assert(avgWind === 15, `Average wind speed should be 15 km/h, got ${avgWind}`);

// Test 2: Condition Distribution
const dist = calculateConditionDistribution(sampleObservations);
assert(dist.length === 3, `Expected 3 distinct condition categories, got ${dist.length}`);
assert(dist.some((d) => d.condition === 'Clear' && d.count === 1), 'Clear sky count matches');
assert(dist.some((d) => d.condition === 'Rain' && d.count === 1), 'Rain count matches');

// Test 3: computeWeatherAnalytics integration
const analytics = computeWeatherAnalytics(sampleObservations, '24h');
assert(analytics.average_temperature === 25, 'Analytics average_temperature matches');
assert(analytics.observation_count === 3, 'Observation count matches');

console.log('--- ALL WEATHER ANALYTICS TESTS PASSED SUCCESSFULLY ---');
