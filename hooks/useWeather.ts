'use client';

import { useCallback } from 'react';
import { WeatherData, Location } from '@/types/weather';
import { useAutoRefresh } from './useAutoRefresh';

interface UseWeatherProps {
  location: Location | null;
}

export function useWeather({ location }: UseWeatherProps) {
  const fetchWeather = useCallback(async (): Promise<WeatherData> => {
    if (!location) {
      throw new Error('No location selected.');
    }

    const params = new URLSearchParams({
      lat: location.latitude.toString(),
      lon: location.longitude.toString(),
      city: location.city,
      country: location.country || '',
      region: location.region || '',
    });

    const response = await fetch(`/api/weather?${params.toString()}`);
    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.message || `Weather request failed with status ${response.status}`);
    }

    return response.json();
  }, [location]);

  const {
    data: weatherData,
    status,
    lastUpdated,
    error,
    isLoading,
    isRefreshing,
    refresh,
  } = useAutoRefresh<WeatherData>({
    fetchFn: fetchWeather,
    enabled: Boolean(location),
    intervalMs: 5 * 60 * 1000, // 5 minutes
    staleAfterMs: 10 * 60 * 1000,
  });

  return {
    weatherData,
    status,
    lastUpdated,
    error,
    isLoading,
    isRefreshing,
    refresh,
  };
}
