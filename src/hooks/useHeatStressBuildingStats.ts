/**
 * Hook: fetch building counts overlaid on the Heat Stress Index (HS_HSI) from
 * the backend API (majority-area spatial join, pre-computed in `ovl_bldg_hsi`).
 *
 * Calls GET /api/heat-stress-buildings/stats
 * Optional filters: munName, brgyName
 */
/// <reference types="vite/client" />
import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://bohol-cwis-api.azurewebsites.net';

export interface HsiBucket {
  hsi_type: string;
  hsi_gridcode: number; // 1=Low, 2=Moderate, 3=High, 4=Extreme
  hsi_color: string;
  count: number;
}

export interface HeatStressBuildingStatsResponse {
  total: number;
  highCount: number;
  extremeCount: number;
  highAndExtreme: number;
  breakdown: HsiBucket[];
}

interface UseHeatStressBuildingStatsResult {
  data: HeatStressBuildingStatsResponse | null;
  loading: boolean;
  error: string | null;
}

export function useHeatStressBuildingStats(
  munName?: string | null,
  brgyName?: string | null
): UseHeatStressBuildingStatsResult {
  const [data, setData] = useState<HeatStressBuildingStatsResponse | null>(null);
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

        const url = `${API_BASE_URL}/api/heat-stress-buildings/stats${params.toString() ? `?${params}` : ''}`;
        console.log('[useHeatStressBuildingStats] fetching:', url);
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: HeatStressBuildingStatsResponse = await res.json();
        if (!cancelled) setData(json);
      } catch (err: unknown) {
        if (!cancelled && (err as Error).name !== 'AbortError') {
          console.error('[useHeatStressBuildingStats] error:', err);
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
