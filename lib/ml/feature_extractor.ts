import { WeatherObservation, CurrentWeather } from '@/types/weather';
import { MLFeatureVector } from './types';

/**
 * Extracts the 32-dimensional feature vector for ML inference
 * using strictly past and current observations up to time T.
 * NO future data leakage.
 */
export function extractMLFeatures(
  current: CurrentWeather,
  recentHistory: WeatherObservation[] = [],
  currentTime: Date = new Date()
): MLFeatureVector {
  // Sort recent history ascending by timestamp
  const sorted = [...recentHistory].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  // Time & Cyclical features
  const hour = currentTime.getHours();
  const dayOfWeek = (currentTime.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  
  // Day of year calculation
  const startOfYear = new Date(currentTime.getFullYear(), 0, 0);
  const diff = currentTime.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const month = currentTime.getMonth() + 1;

  const isDay = current.is_day ? 1 : 0;
  const hourSin = Math.sin((2 * Math.PI * hour) / 24.0);
  const hourCos = Math.cos((2 * Math.PI * hour) / 24.0);

  // Helper to extract lag values from sorted historical array
  // Index -1 is the most recent past observation, -2 is 2nd most recent, etc.
  const n = sorted.length;
  const getLag = (offset: number, fallback: number, key: keyof WeatherObservation) => {
    const idx = n - offset;
    if (idx >= 0 && idx < n) {
      const val = sorted[idx][key];
      return typeof val === 'number' && !isNaN(val) ? val : fallback;
    }
    return fallback;
  };

  const tempLag1 = getLag(1, current.temperature, 'temperature');
  const tempLag2 = getLag(2, tempLag1, 'temperature');
  const tempLag3 = getLag(3, tempLag2, 'temperature');
  const tempLag6 = getLag(6, tempLag3, 'temperature');

  const humLag1 = getLag(1, current.humidity, 'humidity');
  const humLag3 = getLag(3, humLag1, 'humidity');
  const windLag1 = getLag(1, current.wind_speed, 'wind_speed');
  const precipLag1 = getLag(1, current.precipitation, 'precipitation');

  // Rolling features including current observation at T
  const pastTemps = sorted.slice(-11).map((o) => Number(o.temperature) || current.temperature);
  pastTemps.push(current.temperature);

  const pastHums = sorted.slice(-2).map((o) => Number(o.humidity) || current.humidity);
  pastHums.push(current.humidity);

  const pastWinds = sorted.slice(-2).map((o) => Number(o.wind_speed) || current.wind_speed);
  pastWinds.push(current.wind_speed);

  const pastPrecip = sorted.slice(-2).map((o) => Number(o.precipitation) || current.precipitation);
  pastPrecip.push(current.precipitation);

  const mean = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const tempRolling3 = mean(pastTemps.slice(-3));
  const tempRolling6 = mean(pastTemps.slice(-6));
  const tempRolling12 = mean(pastTemps.slice(-12));

  const humRolling3 = mean(pastHums.slice(-3));
  const windRolling3 = mean(pastWinds.slice(-3));
  const precipRollingSum3 = sum(pastPrecip.slice(-3));

  return {
    temperature: current.temperature,
    feels_like: current.feels_like,
    humidity: current.humidity,
    pressure: current.pressure,
    wind_speed: current.wind_speed,
    wind_direction: current.wind_direction,
    precipitation: current.precipitation,
    cloud_cover: current.cloud_cover,
    visibility: current.visibility,
    uv_index: current.uv_index,
    weather_code: current.weather_code,
    hour,
    day_of_week: dayOfWeek,
    day_of_year: dayOfYear,
    month,
    is_day: isDay,
    hour_sin: hourSin,
    hour_cos: hourCos,
    temperature_lag_1: tempLag1,
    temperature_lag_2: tempLag2,
    temperature_lag_3: tempLag3,
    temperature_lag_6: tempLag6,
    humidity_lag_1: humLag1,
    humidity_lag_3: humLag3,
    wind_speed_lag_1: windLag1,
    precipitation_lag_1: precipLag1,
    temperature_rolling_mean_3: tempRolling3,
    temperature_rolling_mean_6: tempRolling6,
    temperature_rolling_mean_12: tempRolling12,
    humidity_rolling_mean_3: humRolling3,
    wind_rolling_mean_3: windRolling3,
    precipitation_rolling_sum_3: precipRollingSum3,
  };
}
