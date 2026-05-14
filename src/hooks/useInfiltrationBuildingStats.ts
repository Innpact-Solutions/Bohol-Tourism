/**
 * Hook: fetch building counts overlaid on the GroundWater Infiltration
 * Vulnerability layer from the backend API (majority-area spatial join,
 * pre-computed in `ovl_bldg_gwi`).
 *
 * Calls GET /api/infiltration-buildings/stats
 * Optional filters: munName, brgyName
 */
/// <reference types="vite/client" />
import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://bohol-cwis-api.azurewebsites.net';

export interface GwiBucket {
  gwi_type: string;
  gwi_gridcode: number; // 2=Low, 3=Moderate, 4=High, 5=Very High
  gwi_color: string;
  count: number;
}

export interface InfiltrationBuildingStatsResponse {
  total: number;
  highCount: number;
  veryHighCount: number;
  highAndVeryHigh: number;
  breakdown: GwiBucket[];
}

interface UseInfiltrationBuildingStatsResult {
  data: InfiltrationBuildingStatsResponse | null;
  loading: boolean;
  error: string | null;
}

export function useInfiltrationBuildingStats(
  munName?: string | null,
  brgyName?: string | null
): UseInfiltrationBuildingStatsResult {
  const [data, setData] = useState<InfiltrationBuildingStatsResponse | null>(null);
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

        const url = `${API_BASE_URL}/api/infiltration-buildings/stats${params.toString() ? `?${params}` : ''}`;
        console.log('[useInfiltrationBuildingStats] fetching:', url);
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: InfiltrationBuildingStatsResponse = await res.json();
        if (!cancelled) setData(json);
      } catch (err: unknown) {
        if (!cancelled && (err as Error).name !== 'AbortError') {
          console.error('[useInfiltrationBuildingStats] error:', err);
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
