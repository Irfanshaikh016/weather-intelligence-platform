'use client';

import { useState, useEffect, useCallback } from 'react';
import { WeatherHistory } from '@/types/weather';

interface UseHistoryProps {
  locationId: string | null;
  initialRange?: '24h' | '7d' | '30d';
}

export function useHistory({ locationId, initialRange = '24h' }: UseHistoryProps) {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>(initialRange);
  const [history, setHistory] = useState<WeatherHistory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationId) return;

    let active = true;

    const params = new URLSearchParams({
      locationId,
      range,
    });

    fetch(`/api/history?${params.toString()}`)
      .then((res) => {
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
    if (!locationId) return;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        locationId,
        range,
      });

      const res = await fetch(`/api/history?${params.toString()}`);
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
