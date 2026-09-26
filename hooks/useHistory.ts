'use client';

import { useState, useEffect, useCallback } from 'react';
import { WeatherHistory } from '@/types/weather';
import { isValidUUID } from '@/lib/validation';
import { computeWeatherAnalytics } from '@/lib/analytics/weather';

interface UseHistoryProps {
  locationId: string | null;
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

export function useHistory({ locationId, initialRange = '24h' }: UseHistoryProps) {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>(initialRange);
  const [history, setHistory] = useState<WeatherHistory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If no locationId or invalid UUID, set empty history asynchronously without triggering synchronous effect render
    if (!locationId || !isValidUUID(locationId)) {
      Promise.resolve().then(() => {
        setHistory(createEmptyHistory(locationId || '', range));
        setError(null);
        setIsLoading(false);
      });
      return;
    }

    let active = true;

    const params = new URLSearchParams({
      locationId,
      range,
    });

    fetch(`/api/history?${params.toString()}`)
      .then((res) => {
        // If 404 or 400 (e.g. location has no records yet), treat as empty historical dataset
        if (res.status === 404 || res.status === 400) {
          return createEmptyHistory(locationId, range);
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch history (${res.status})`);
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
  }, [locationId, range]);

  const refreshHistory = useCallback(async () => {
    if (!locationId || !isValidUUID(locationId)) {
      setHistory(createEmptyHistory(locationId || '', range));
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        locationId,
        range,
      });

      const res = await fetch(`/api/history?${params.toString()}`);
      if (res.status === 404 || res.status === 400) {
        setHistory(createEmptyHistory(locationId, range));
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to fetch history (${res.status})`);
      }
      const data: WeatherHistory = await res.json();
      setHistory(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching historical data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [locationId, range]);

  return {
    history,
    range,
    setRange,
    isLoading,
    error,
    refreshHistory,
  };
}
