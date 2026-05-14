import { useState, useEffect, useRef } from 'react';
import type { FstpFacilityState } from '../components/ModulePanel';

export interface FstpBandStat {
  band: string;
  count: number;
  color: string;
}

export interface FstpMunStat {
  mun: string;
  band_counts: Record<string, number>;
  total: number;
}

export interface FstpUseTypeStat {
  use_type: string;
  count: number;
}

export interface FstpBuildingStats {
  total_buildings: number;
  covered: number;
  uncovered: number;
  coverage_pct: number;
  by_band: FstpBandStat[];
  by_municipality: FstpMunStat[];
  by_use_type: FstpUseTypeStat[];
  precomputed: boolean;
}

// Mirrors the facility-name resolution logic in MapCanvas
const COMBINED_NAME_MAP: Record<string, string> = {
  '1,2':   'JAICA + USAID',
  '1,3':   'Existing + JAICA',
  '2,3':   'Existing + USAID',
  '1,2,3': 'All Three FSTPs',
};

export function resolveFacilityNm(enabled: FstpFacilityState[]): string | null {
  if (enabled.length === 0) return null;
  if (enabled.length === 1) return enabled[0].facilityName;
  const key = enabled.map(f => f.facilityId).sort((a, b) => a - b).join(',');
  return COMBINED_NAME_MAP[key] ?? null;
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? '';

export function useFstpBuildingStats(activeFstpLayers: FstpFacilityState[]) {
  const [data, setData]       = useState<FstpBuildingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Abort controller ref so we can cancel in-flight requests
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const enabled = activeFstpLayers.filter(f => f.enabled);
    const facilityNm = resolveFacilityNm(enabled);
    const allBands = Array.from(new Set(enabled.flatMap(f => f.activeBands)));
    const scenario = enabled[0]?.scenario ?? 'Normal';

    if (!facilityNm || allBands.length === 0) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Cancel previous request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const params = new URLSearchParams({
      facility_nm: facilityNm,
      scenario,
      bands: allBands.join(','),
    });

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/fstp-building-stats?${params}`, { signal: ctrl.signal })
      .then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error ?? `HTTP ${r.status}`); });
        return r.json();
      })
      .then((json: FstpBuildingStats) => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setError(err.message ?? 'Failed to load stats');
        setLoading(false);
      });

    return () => ctrl.abort();
  }, [
    // Re-fetch whenever the set of enabled facilities, their scenarios, or bands changes
    JSON.stringify(
      activeFstpLayers
        .filter(f => f.enabled)
        .map(f => ({ id: f.facilityId, scenario: f.scenario, bands: [...f.activeBands].sort() }))
        .sort((a, b) => a.id - b.id)
    ),
  ]);

  return { data, loading, error };
}
