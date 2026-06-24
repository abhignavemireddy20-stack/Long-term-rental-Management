/**
 * useRealtime — A custom React hook that provides automatic data refresh
 * from the Supabase-backed API at a configurable interval.
 * 
 * This gives the app "real-time" feel without WebSockets by polling
 * the backend (which now reads from Supabase PostgreSQL).
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';

interface UseRealtimeOptions<T> {
  url: string;
  params?: Record<string, any>;
  intervalMs?: number;       // Polling interval in ms (default: 15000 = 15s)
  enabled?: boolean;         // Whether polling is active (default: true)
  transform?: (data: any) => T;  // Optional data transformer
}

interface UseRealtimeResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;       // Manual refresh trigger
  lastUpdated: Date | null;  // Timestamp of last successful fetch
}

export function useRealtime<T = any>({
  url,
  params,
  intervalMs = 15000,
  enabled = true,
  transform,
}: UseRealtimeOptions<T>): UseRealtimeResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await api.get(url, { params });
      
      if (isMountedRef.current) {
        const result = transform ? transform(res.data) : res.data;
        setData(result);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.response?.data?.error || 'Failed to fetch data');
      }
    } finally {
      if (isMountedRef.current && isInitial) {
        setLoading(false);
      }
    }
  }, [url, JSON.stringify(params)]);

  const refresh = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (!enabled) return;

    // Initial load
    fetchData(true);

    // Set up polling interval
    if (intervalMs > 0) {
      intervalRef.current = setInterval(() => {
        fetchData(false);
      }, intervalMs);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, enabled, intervalMs]);

  return { data, loading, error, refresh, lastUpdated };
}

export default useRealtime;
