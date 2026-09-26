'use client';

import { useState, useEffect, useCallback } from 'react';
import { WeatherHistory } from '@/types/weather';
import { isValidUUID } from '@/lib/validation';
import { computeWeatherAnalytics } from '@/lib/analytics/weather';

interface UseHistoryProps {
  locationId: string | null;
  latitude?: number;
  longitude?: number;
  initialRange?: '24h' | '7d' | '30d';
}

function createEmptyHistory(locId: string, range: '24h' | '7d' | '30d'): WeatherHistory {
  return {
    location_id: locId,
    range,
    start_date: new Date().toISOString(),
    end_date: new Date().toISOString(),
    observations: [],
    analytics: computeWeatherAnalytics([], range),
  };
}

export function useHistory({ locationId, latitude, longitude, initialRange = '24h' }: UseHistoryProps) {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>(initialRange);
  const [history, setHistory] = useState<WeatherHistory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no locationId or invalid UUID and no coordinates, set empty history
    const validUuid = locationId && isValidUUID(locationId) ? locationId : 'b1b51075-8025-4202-b054-e0eb29241511';

    let active = true;

    const params = new URLSearchParams({
      locationId: validUuid,
      range,
    });

    if (latitude !== undefined && longitude !== undefined) {
      params.append('lat', latitude.toString());
      params.append('lon', longitude.toString());
    }

    fetch(`/api/history?${params.toString()}`)
      .then((res) => {
        if (!res.ok) {
          return createEmptyHistory(validUuid, range);
        }
        return res.json();
      })
      .then((data: WeatherHistory) => {
        if (active) {
          setHistory(data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          const msg = err instanceof Error ? err.message : 'Error fetching historical data';
          setError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [locationId, latitude, longitude, range]);

  const refreshHistory = useCallback(async () => {
    const validUuid = locationId && isValidUUID(locationId) ? locationId : 'b1b51075-8025-4202-b054-e0eb29241511';

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        locationId: validUuid,
        range,
      });

      if (latitude !== undefined && longitude !== undefined) {
        params.append('lat', latitude.toString());
        params.append('lon', longitude.toString());
      }

      const res = await fetch(`/api/history?${params.toString()}`);
      if (!res.ok) {
        setHistory(createEmptyHistory(validUuid, range));
        return;
      }
      const data: WeatherHistory = await res.json();
      setHistory(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching historical data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [locationId, latitude, longitude, range]);

  return {
    history,
    range,
    setRange,
    isLoading,
    error,
    refreshHistory,
  };
}
