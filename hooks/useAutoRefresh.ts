'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { LiveStatus } from '@/types/weather';

interface UseAutoRefreshOptions<T> {
  intervalMs?: number;
  staleAfterMs?: number;
  fetchFn: () => Promise<T>;
  enabled?: boolean;
}

export function useAutoRefresh<T>({
  intervalMs = 5 * 60 * 1000, // 5 minutes default
  staleAfterMs = 10 * 60 * 1000, // 10 minutes considered stale
  fetchFn,
  enabled = true,
}: UseAutoRefreshOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<LiveStatus>('UPDATING');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const isFetchingRef = useRef<boolean>(false);
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const executeFetch = useCallback(async (isInitial = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isInitial) {
      setIsRefreshing(true);
      setStatus('UPDATING');
    }

    try {
      const result = await fetchFnRef.current();
      setData(result);
      setError(null);
      setLastUpdated(new Date());
      setStatus('LIVE');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch updated data';
      setError(msg);
      setStatus('ERROR');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Periodic interval & initial run
  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const runInitial = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        const result = await fetchFnRef.current();
        if (isMounted) {
          setData(result);
          setError(null);
          setLastUpdated(new Date());
          setStatus('LIVE');
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch updated data';
          setError(msg);
          setStatus('ERROR');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
        isFetchingRef.current = false;
      }
    };

    runInitial();

    const intervalTimer = setInterval(() => {
      executeFetch(false);
    }, intervalMs);

    const staleTimer = setInterval(() => {
      setLastUpdated((currentLast) => {
        if (currentLast && Date.now() - currentLast.getTime() > staleAfterMs) {
          setStatus((prev) => (prev === 'LIVE' ? 'STALE' : prev));
        }
        return currentLast;
      });
    }, 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalTimer);
      clearInterval(staleTimer);
    };
  }, [enabled, intervalMs, staleAfterMs, executeFetch]);

  const manualRefresh = useCallback(() => {
    return executeFetch(false);
  }, [executeFetch]);

  return {
    data,
    status,
    lastUpdated,
    error,
    isLoading,
    isRefreshing,
    refresh: manualRefresh,
  };
}
