import { OpenMeteoForecastResponse, OpenMeteoGeocodingResponse } from './types';
import { LocationSearchResult } from '@/types/weather';

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
