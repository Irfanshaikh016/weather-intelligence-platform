export interface Location {
  id: string;
  city: string;
  country: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CurrentWeather {
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  precipitation: number;
  cloud_cover: number;
  visibility: number;
  uv_index: number;
  weather_code: number;
  condition: string;
  icon: string;
  is_day: boolean;
  timestamp: string;
}

export interface HourlyWeather {
  time: string;
  timestamp: number;
  temperature: number;
  feels_like?: number;
  humidity: number;
  precipitation: number;
  precipitation_probability: number;
  weather_code: number;
  condition: string;
  icon: string;
  wind_speed: number;
  wind_direction: number;
  visibility: number;
}

export interface DailyWeather {
  date: string;
  timestamp: number;
  min_temperature: number;
  max_temperature: number;
  precipitation: number;
  precipitation_probability: number;
  weather_code: number;
  condition: string;
  icon: string;
  sunrise: string;
  sunset: string;
  max_wind_speed: number;
  day_length_seconds?: number;
}

export interface WeatherObservation {
  id: number;
  location_id: string;
  recorded_at: string;
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  precipitation: number;
  precipitation_probability?: number | null;
  cloud_cover: number;
  visibility: number;
  uv_index: number;
  weather_code: number;
  created_at?: string;
}

export interface WeatherConditionCount {
  condition: string;
  count: number;
  percentage: number;
  weather_code: number;
}

export interface WeatherAnalytics {
  average_temperature: number;
  max_temperature: number;
  min_temperature: number;
  average_humidity: number;
  max_humidity: number;
  min_humidity: number;
  total_precipitation: number;
  max_wind_speed: number;
  average_wind_speed: number;
  condition_distribution: WeatherConditionCount[];
  period: '24h' | '7d' | '30d' | 'custom';
  observation_count: number;
  trends?: {
    temperature_trend: 'warming' | 'cooling' | 'stable';
    precipitation_trend: 'increasing' | 'decreasing' | 'dry';
    humidity_trend: 'humidifying' | 'drying' | 'stable';
    wind_trend: 'gusty' | 'calm' | 'stable';
  };
  comparison?: {
    previous_period_label: string;
    avg_temp_diff: number;
    total_precip_diff: number;
    avg_humidity_diff: number;
  };
}

export interface WeatherHistory {
  location_id: string;
  range: '24h' | '7d' | '30d' | 'custom';
  start_date: string;
  end_date: string;
  observations: WeatherObservation[];
  analytics: WeatherAnalytics;
}

export interface WeatherData {
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
    city?: string;
    country?: string;
    region?: string;
  };
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  alerts?: WeatherAlert[];
  fetched_at: string;
}

export interface WeatherAlert {
  id: string;
  event: string;
  headline: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  description: string;
  effective: string;
  expires: string;
}

export interface LocationSearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code?: string;
  admin1?: string;
  timezone: string;
  elevation?: number;
}

export type LiveStatus = 'LIVE' | 'UPDATING' | 'STALE' | 'ERROR';
