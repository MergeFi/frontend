'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchOracleReading, fetchAllOracleReadings } from '@/lib/api';
import type { OracleReading } from '@/types';
import { ORACLE_REFRESH_INTERVAL_MS } from '@/lib/constants';

export function useOracleReading(key: string | null) {
  const [reading,  setReading]  = useState<OracleReading | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!key) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOracleReading(key);
      setReading(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch oracle reading');
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    void load();
    if (!key) return;
    const interval = setInterval(() => { void load(); }, ORACLE_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load, key]);

  return { reading, loading, error, refetch: load };
}

export function useAllOracleReadings() {
  const [readings, setReadings] = useState<OracleReading[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllOracleReadings();
      setReadings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch oracle readings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => { void load(); }, ORACLE_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return { readings, loading, error, refetch: load };
}
