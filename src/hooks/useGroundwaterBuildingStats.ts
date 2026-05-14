/**
 * Hook: fetch building counts per groundwater depth level from the API.
 *
 * Calls GET /api/groundwater-buildings/stats
 * Optional filters: munName, brgyName
 */
/// <reference types="vite/client" />
import { useState, useEffect } from 'react';

// In development, requests go through the Vite proxy (/api → localhost:8080).
// In production, VITE_API_BASE_URL points to the deployed backend.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://bohol-cwis-api.azurewebsites.net';

export interface DepthUseBreakdown {
  use_type: string;
  count: number;
}

export interface DepthBucket {
  gw_type: string;
  gw_gridcode: number;
  gw_color: string;
  count: number;
  use_type_breakdown: DepthUseBreakdown[];
}

export interface GroundwaterBuildingStatsResponse {
  total: number;
  breakdown: DepthBucket[];
}

interface UseGroundwaterBuildingStatsResult {
  data: GroundwaterBuildingStatsResponse | null;
  loading: boolean;
  error: string | null;
}

export function useGroundwaterBuildingStats(
  munName?: string | null,
  brgyName?: string | null
): UseGroundwaterBuildingStatsResult {
  const [data, setData] = useState<GroundwaterBuildingStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const params = new URLSearchParams();
        if (munName && munName !== 'all') params.set('munName', munName);
        if (brgyName && brgyName !== 'all') params.set('brgyName', brgyName);

        const url = `${API_BASE_URL}/api/groundwater-buildings/stats${params.toString() ? `?${params}` : ''}`;
        console.log('[useGroundwaterBuildingStats] fetching:', url);
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: GroundwaterBuildingStatsResponse = await res.json();
        if (!cancelled) setData(json);
      } catch (err: unknown) {
        console.error('[useGroundwaterBuildingStats] error:', err);
        if (!cancelled && (err as Error).name !== 'AbortError') {
          setError((err as Error).message ?? 'Unknown error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [munName, brgyName]);

  return { data, loading, error };
}
