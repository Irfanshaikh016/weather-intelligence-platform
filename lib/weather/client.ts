import { OpenMeteoForecastResponse, OpenMeteoGeocodingResponse } from './types';
import { LocationSearchResult, WeatherObservation } from '@/types/weather';

const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'WeatherIntelligencePlatform/2.0 (contact: support@weather-intel.app)',
};

export interface FetchWeatherOptions {
  latitude: number;
  longitude: number;
  timezone?: string;
}

export async function fetchWeatherFromOpenMeteo(
  options: FetchWeatherOptions
): Promise<OpenMeteoForecastResponse> {
  const { latitude, longitude, timezone = 'auto' } = options;

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'uv_index',
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'visibility',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'apparent_temperature_max',
      'apparent_temperature_min',
      'sunrise',
      'sunset',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
    ].join(','),
    timezone,
    forecast_days: '7',
  });

  const url = `${FORECAST_BASE_URL}?${params.toString()}`;

  const response = await fetch(url, {
    headers: DEFAULT_HEADERS,
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Network response was not ok');
    throw new Error(`Open-Meteo Forecast Error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as OpenMeteoForecastResponse;
  return data;
}

export async function fetchHistoricalFromOpenMeteo(options: {
  latitude: number;
  longitude: number;
  locationId?: string;
  range: '24h' | '7d' | '30d' | 'custom';
}): Promise<WeatherObservation[]> {
  const { latitude, longitude, locationId = '', range } = options;

  let pastDays = 1;
  if (range === '7d') pastDays = 7;
  else if (range === '30d') pastDays = 30;

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    past_days: pastDays.toString(),
    forecast_days: '1',
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'precipitation_probability',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'surface_pressure',
      'cloud_cover',
      'visibility',
      'uv_index',
    ].join(','),
    timezone: 'auto',
  });

  const url = `${FORECAST_BASE_URL}?${params.toString()}`;

  const response = await fetch(url, {
    headers: DEFAULT_HEADERS,
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const hourly = data.hourly;
  if (!hourly || !Array.isArray(hourly.time)) {
    return [];
  }

  const nowMs = Date.now();
  const hoursToSlice = range === '24h' ? 24 : range === '7d' ? 168 : 720;

  const observations: WeatherObservation[] = [];
  for (let i = 0; i < hourly.time.length; i++) {
    const timeStr = hourly.time[i];
    const itemMs = new Date(timeStr).getTime();
    if (itemMs <= nowMs) {
      observations.push({
        id: i + 1,
        location_id: locationId,
        recorded_at: new Date(timeStr).toISOString(),
        temperature: hourly.temperature_2m?.[i] ?? 0,
        feels_like: hourly.apparent_temperature?.[i] ?? hourly.temperature_2m?.[i] ?? 0,
        humidity: hourly.relative_humidity_2m?.[i] ?? 0,
        pressure: hourly.surface_pressure?.[i] ?? 1013,
        wind_speed: hourly.wind_speed_10m?.[i] ?? 0,
        wind_direction: hourly.wind_direction_10m?.[i] ?? 0,
        precipitation: hourly.precipitation?.[i] ?? 0,
        precipitation_probability: hourly.precipitation_probability?.[i] ?? null,
        cloud_cover: hourly.cloud_cover?.[i] ?? 0,
        visibility: hourly.visibility?.[i] ? hourly.visibility[i] / 1000 : 10,
        uv_index: hourly.uv_index?.[i] ?? 0,
        weather_code: hourly.weather_code?.[i] ?? 0,
      });
    }
  }

  return observations.slice(-hoursToSlice);
}

export async function searchLocationsFromOpenMeteo(
  query: string,
  count = 10
): Promise<LocationSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    name: query.trim(),
    count: count.toString(),
    language: 'en',
    format: 'json',
  });

  const url = `${GEOCODING_BASE_URL}?${params.toString()}`;

  const response = await fetch(url, {
    headers: DEFAULT_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo Geocoding Error (${response.status})`);
  }

  const data = (await response.json()) as OpenMeteoGeocodingResponse;
  if (!data.results) {
    return [];
  }

  return data.results.map((res) => ({
    id: res.id,
    name: res.name,
    latitude: res.latitude,
    longitude: res.longitude,
    country: res.country || '',
    country_code: res.country_code,
    admin1: res.admin1,
    timezone: res.timezone || 'UTC',
    elevation: res.elevation,
  }));
}
