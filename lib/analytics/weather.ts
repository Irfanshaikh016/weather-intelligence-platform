import { WeatherObservation, WeatherAnalytics, WeatherConditionCount, HourlyWeather } from '@/types/weather';
import { getWeatherCategory } from '@/lib/weather/weather-codes';

export function calculateAverageTemperature(observations: WeatherObservation[]): number {
  if (observations.length === 0) return 0;
  const sum = observations.reduce((acc, curr) => acc + (Number(curr.temperature) || 0), 0);
  return Math.round((sum / observations.length) * 10) / 10;
}

export function calculateMaximumTemperature(observations: WeatherObservation[]): number {
  if (observations.length === 0) return 0;
  const max = Math.max(...observations.map((o) => Number(o.temperature) || 0));
  return Math.round(max * 10) / 10;
}

export function calculateMinimumTemperature(observations: WeatherObservation[]): number {
  if (observations.length === 0) return 0;
  const min = Math.min(...observations.map((o) => Number(o.temperature) || 0));
  return Math.round(min * 10) / 10;
}

export function calculateAverageHumidity(observations: WeatherObservation[]): number {
  if (observations.length === 0) return 0;
  const sum = observations.reduce((acc, curr) => acc + (Number(curr.humidity) || 0), 0);
  return Math.round((sum / observations.length) * 10) / 10;
}

export function calculateTotalPrecipitation(observations: WeatherObservation[]): number {
  if (observations.length === 0) return 0;
  const sum = observations.reduce((acc, curr) => acc + (Number(curr.precipitation) || 0), 0);
  return Math.round(sum * 10) / 10;
}

export function calculateMaximumWindSpeed(observations: WeatherObservation[]): number {
  if (observations.length === 0) return 0;
  const max = Math.max(...observations.map((o) => Number(o.wind_speed) || 0));
  return Math.round(max * 10) / 10;
}

export function calculateAverageWindSpeed(observations: WeatherObservation[]): number {
  if (observations.length === 0) return 0;
  const sum = observations.reduce((acc, curr) => acc + (Number(curr.wind_speed) || 0), 0);
  return Math.round((sum / observations.length) * 10) / 10;
}

export function calculateConditionDistribution(observations: WeatherObservation[]): WeatherConditionCount[] {
  if (observations.length === 0) return [];

  const counts: Record<string, { count: number; sampleCode: number }> = {};
  for (const obs of observations) {
    const category = getWeatherCategory(obs.weather_code);
    if (!counts[category]) {
      counts[category] = { count: 0, sampleCode: obs.weather_code };
    }
    counts[category].count += 1;
  }

  const total = observations.length;
  return Object.entries(counts).map(([condition, data]) => ({
    condition,
    count: data.count,
    percentage: Math.round((data.count / total) * 100),
    weather_code: data.sampleCode,
  })).sort((a, b) => b.count - a.count);
}

export function calculateForecastConditionDistribution(hourly: HourlyWeather[]): WeatherConditionCount[] {
  if (hourly.length === 0) return [];

  const counts: Record<string, { count: number; sampleCode: number }> = {};
  for (const h of hourly) {
    const category = getWeatherCategory(h.weather_code);
    if (!counts[category]) {
      counts[category] = { count: 0, sampleCode: h.weather_code };
    }
    counts[category].count += 1;
  }

  const total = hourly.length;
  return Object.entries(counts)
    .map(([condition, data]) => ({
      condition,
      count: data.count,
      percentage: Math.round((data.count / total) * 100),
      weather_code: data.sampleCode,
    }))
    .sort((a, b) => b.count - a.count);
}

export function computeWeatherAnalytics(
  observations: WeatherObservation[],
  period: '24h' | '7d' | '30d' | 'custom' = '24h',
  previousPeriodObservations?: WeatherObservation[]
): WeatherAnalytics {
  if (observations.length === 0) {
    return {
      average_temperature: 0,
      max_temperature: 0,
      min_temperature: 0,
      average_humidity: 0,
      max_humidity: 0,
      min_humidity: 0,
      total_precipitation: 0,
      max_wind_speed: 0,
      average_wind_speed: 0,
      condition_distribution: [],
      period,
      observation_count: 0,
    };
  }

  const avgTemp = calculateAverageTemperature(observations);
  const maxTemp = calculateMaximumTemperature(observations);
  const minTemp = calculateMinimumTemperature(observations);
  const avgHumidity = calculateAverageHumidity(observations);
  const maxHumidity = Math.max(...observations.map((o) => Number(o.humidity) || 0));
  const minHumidity = Math.min(...observations.map((o) => Number(o.humidity) || 0));
  const totalPrecip = calculateTotalPrecipitation(observations);
  const maxWind = calculateMaximumWindSpeed(observations);
  const avgWind = calculateAverageWindSpeed(observations);
  const conditionDist = calculateConditionDistribution(observations);

  // Compute Trends
  let tempTrend: 'warming' | 'cooling' | 'stable' = 'stable';
  let precipTrend: 'increasing' | 'decreasing' | 'dry' = 'dry';
  let humTrend: 'humidifying' | 'drying' | 'stable' = 'stable';
  let windTrend: 'gusty' | 'calm' | 'stable' = 'stable';

  if (observations.length >= 2) {
    // Compare first half vs second half chronologically
    const sorted = [...observations].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const firstAvgTemp = calculateAverageTemperature(firstHalf);
    const secondAvgTemp = calculateAverageTemperature(secondHalf);
    if (secondAvgTemp - firstAvgTemp > 0.5) tempTrend = 'warming';
    else if (firstAvgTemp - secondAvgTemp > 0.5) tempTrend = 'cooling';

    const firstPrecip = calculateTotalPrecipitation(firstHalf);
    const secondPrecip = calculateTotalPrecipitation(secondHalf);
    if (secondPrecip > 0 && secondPrecip > firstPrecip) precipTrend = 'increasing';
    else if (firstPrecip > 0 && secondPrecip < firstPrecip) precipTrend = 'decreasing';
    else precipTrend = 'dry';

    const firstHum = calculateAverageHumidity(firstHalf);
    const secondHum = calculateAverageHumidity(secondHalf);
    if (secondHum - firstHum > 3) humTrend = 'humidifying';
    else if (firstHum - secondHum > 3) humTrend = 'drying';

    const secondMaxWind = calculateMaximumWindSpeed(secondHalf);
    if (secondMaxWind > 25) windTrend = 'gusty';
    else if (secondMaxWind < 10) windTrend = 'calm';
  }

  let comparison: WeatherAnalytics['comparison'] | undefined;
  if (previousPeriodObservations && previousPeriodObservations.length > 0) {
    const prevAvgTemp = calculateAverageTemperature(previousPeriodObservations);
    const prevPrecip = calculateTotalPrecipitation(previousPeriodObservations);
    const prevHumidity = calculateAverageHumidity(previousPeriodObservations);

    const labels: Record<string, string> = {
      '24h': 'previous 24 hours',
      '7d': 'previous 7 days',
      '30d': 'previous 30 days',
      custom: 'previous period',
    };

    comparison = {
      previous_period_label: labels[period] || 'previous period',
      avg_temp_diff: Math.round((avgTemp - prevAvgTemp) * 10) / 10,
      total_precip_diff: Math.round((totalPrecip - prevPrecip) * 10) / 10,
      avg_humidity_diff: Math.round((avgHumidity - prevHumidity) * 10) / 10,
    };
  }

  return {
    average_temperature: avgTemp,
    max_temperature: maxTemp,
    min_temperature: minTemp,
    average_humidity: avgHumidity,
    max_humidity: maxHumidity,
    min_humidity: minHumidity,
    total_precipitation: totalPrecip,
    max_wind_speed: maxWind,
    average_wind_speed: avgWind,
    condition_distribution: conditionDist,
    period,
    observation_count: observations.length,
    trends: {
      temperature_trend: tempTrend,
      precipitation_trend: precipTrend,
      humidity_trend: humTrend,
      wind_trend: windTrend,
    },
    comparison,
  };
}
