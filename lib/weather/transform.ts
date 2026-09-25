import {
  WeatherData,
  CurrentWeather,
  HourlyWeather,
  DailyWeather,
} from '@/types/weather';
import { OpenMeteoForecastResponse } from './types';
import { getWeatherCodeInfo } from './weather-codes';

export function transformOpenMeteoForecast(
  data: OpenMeteoForecastResponse,
  metadata?: { city?: string; country?: string; region?: string }
): WeatherData {
  const currentRaw = data.current;
  const hourlyRaw = data.hourly;
  const dailyRaw = data.daily;

  // Process Current Weather
  const currentCode = currentRaw?.weather_code ?? 0;
  const currentCodeInfo = getWeatherCodeInfo(currentCode);

  const current: CurrentWeather = {
    temperature: Math.round((currentRaw?.temperature_2m ?? 0) * 10) / 10,
    feels_like: Math.round((currentRaw?.apparent_temperature ?? currentRaw?.temperature_2m ?? 0) * 10) / 10,
    humidity: Math.round(currentRaw?.relative_humidity_2m ?? 0),
    pressure: Math.round(currentRaw?.pressure_msl ?? currentRaw?.surface_pressure ?? 1013),
    wind_speed: Math.round((currentRaw?.wind_speed_10m ?? 0) * 10) / 10,
    wind_direction: Math.round(currentRaw?.wind_direction_10m ?? 0),
    precipitation: Math.round((currentRaw?.precipitation ?? 0) * 10) / 10,
    cloud_cover: Math.round(currentRaw?.cloud_cover ?? 0),
    visibility: Math.round(((hourlyRaw?.visibility?.[0] ?? 10000) / 1000) * 10) / 10, // km
    uv_index: Math.round((currentRaw?.uv_index ?? 0) * 10) / 10,
    weather_code: currentCode,
    condition: currentCodeInfo.label,
    icon: currentCodeInfo.icon,
    is_day: (currentRaw?.is_day ?? 1) === 1,
    timestamp: currentRaw?.time ?? new Date().toISOString(),
  };

  // Process Hourly Weather (next 24 hours from current index)
  const hourly: HourlyWeather[] = [];
  if (hourlyRaw && Array.isArray(hourlyRaw.time)) {
    // Find index closest to now or start from first index if historical/forecast
    let startIndex = 0;
    const nowMs = Date.now();
    for (let i = 0; i < hourlyRaw.time.length; i++) {
      const itemTime = new Date(hourlyRaw.time[i]).getTime();
      if (itemTime >= nowMs - 3600000) {
        startIndex = i;
        break;
      }
    }

    const endIndex = Math.min(startIndex + 24, hourlyRaw.time.length);
    for (let i = startIndex; i < endIndex; i++) {
      const code = hourlyRaw.weather_code?.[i] ?? 0;
      const codeInfo = getWeatherCodeInfo(code);
      const timeStr = hourlyRaw.time[i];

      hourly.push({
        time: timeStr,
        timestamp: new Date(timeStr).getTime(),
        temperature: Math.round((hourlyRaw.temperature_2m?.[i] ?? 0) * 10) / 10,
        feels_like: hourlyRaw.apparent_temperature?.[i] !== undefined 
          ? Math.round(hourlyRaw.apparent_temperature[i] * 10) / 10 
          : undefined,
        humidity: Math.round(hourlyRaw.relative_humidity_2m?.[i] ?? 0),
        precipitation: Math.round((hourlyRaw.precipitation?.[i] ?? 0) * 10) / 10,
        precipitation_probability: Math.round(hourlyRaw.precipitation_probability?.[i] ?? 0),
        weather_code: code,
        condition: codeInfo.label,
        icon: codeInfo.icon,
        wind_speed: Math.round((hourlyRaw.wind_speed_10m?.[i] ?? 0) * 10) / 10,
        wind_direction: Math.round(hourlyRaw.wind_direction_10m?.[i] ?? 0),
        visibility: Math.round(((hourlyRaw.visibility?.[i] ?? 10000) / 1000) * 10) / 10,
      });
    }
  }

  // Process 7-day Daily Forecast
  const daily: DailyWeather[] = [];
  if (dailyRaw && Array.isArray(dailyRaw.time)) {
    const count = Math.min(7, dailyRaw.time.length);
    for (let i = 0; i < count; i++) {
      const code = dailyRaw.weather_code?.[i] ?? 0;
      const codeInfo = getWeatherCodeInfo(code);
      const dateStr = dailyRaw.time[i];
      const sunrise = dailyRaw.sunrise?.[i] ?? '';
      const sunset = dailyRaw.sunset?.[i] ?? '';

      let dayLengthSeconds = 0;
      if (sunrise && sunset) {
        dayLengthSeconds = Math.max(0, Math.floor((new Date(sunset).getTime() - new Date(sunrise).getTime()) / 1000));
      }

      daily.push({
        date: dateStr,
        timestamp: new Date(dateStr).getTime(),
        min_temperature: Math.round((dailyRaw.temperature_2m_min?.[i] ?? 0) * 10) / 10,
        max_temperature: Math.round((dailyRaw.temperature_2m_max?.[i] ?? 0) * 10) / 10,
        precipitation: Math.round((dailyRaw.precipitation_sum?.[i] ?? 0) * 10) / 10,
        precipitation_probability: Math.round(dailyRaw.precipitation_probability_max?.[i] ?? 0),
        weather_code: code,
        condition: codeInfo.label,
        icon: codeInfo.icon,
        sunrise,
        sunset,
        max_wind_speed: Math.round((dailyRaw.wind_speed_10m_max?.[i] ?? 0) * 10) / 10,
        day_length_seconds: dayLengthSeconds,
      });
    }
  }

  return {
    location: {
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      city: metadata?.city,
      country: metadata?.country,
      region: metadata?.region,
    },
    current,
    hourly,
    daily,
    alerts: [], // Open-Meteo standard endpoint does not inject external severe alerts, cleanly handled in UI
    fetched_at: new Date().toISOString(),
  };
}
