import { useState, useEffect } from 'react';

export interface FleetClassStat {
  dslg_class: string;
  count: number;
  pct: number;
}

export interface FleetMunStat {
  mun_name: string;
  classes: Record<string, number>;
  total: number;
}

export interface FleetUseTypeStat {
  use_type: string;
  classes: Record<string, number>;
  total: number;
}

export interface FleetStats {
  total_buildings: number;
  classified: number;
  unclassified: number;
  by_class: FleetClassStat[];
  by_municipality: FleetMunStat[];
  by_use_type: FleetUseTypeStat[];
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? '';

export function useFleetStats() {
  const [data, setData] = useState<FleetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/fleet-stats`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message ?? 'Failed to load fleet stats');
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  return { data, loading, error };
}
