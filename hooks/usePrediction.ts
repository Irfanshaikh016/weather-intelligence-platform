'use client';

import { useState, useEffect, useCallback } from 'react';
import { MLPredictionResponse } from '@/lib/ml/types';

interface UsePredictionOptions {
  locationId?: string | null;
  latitude?: number;
  longitude?: number;
}

export function usePrediction({ locationId, latitude, longitude }: UsePredictionOptions) {
  const [data, setData] = useState<MLPredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (locationId) params.set('locationId', locationId);
      if (latitude !== undefined) params.set('lat', latitude.toString());
      if (longitude !== undefined) params.set('lon', longitude.toString());

      const res = await fetch(`/api/predictions?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Prediction server returned status ${res.status}`);
      }

      const json = (await res.json()) as MLPredictionResponse;
      setData(json);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch ML prediction.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [locationId, latitude, longitude]);

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  return {
    predictionData: data,
    isLoading,
    error,
    refreshPrediction: fetchPrediction,
  };
}
