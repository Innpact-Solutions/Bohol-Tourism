// Hook: fetches the aggregate per-class breakdown for each hazard layer
// (heat_stress, flood, sinkhole) across all tourism clusters. Used by the
// right-panel hazard pie chart to show the share of total cluster area in
// each hazard class.

import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env as any)?.VITE_API_BASE_URL
  ?? 'https://bohol-cwis-api.azurewebsites.net';

export interface HazardClassBreakdownItem {
  gridcode: number | null;
  class: string | null;
  color: string | null;
  area_km2: number;
  pct: number;
}

export interface HazardClassBreakdown {
  heat_stress: HazardClassBreakdownItem[];
  flood: HazardClassBreakdownItem[];
  sinkhole: HazardClassBreakdownItem[];
}

let cache: HazardClassBreakdown | null = null;
let inflight: Promise<HazardClassBreakdown> | null = null;

function fetchBreakdown(): Promise<HazardClassBreakdown> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  const url = `${API_BASE}/api/cluster-hazards/class-breakdown`;
  inflight = fetch(url)
    .then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      cache = json.hazards as HazardClassBreakdown;
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useHazardClassBreakdown() {
  const [data, setData] = useState<HazardClassBreakdown | null>(cache);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache) {
      setData(cache);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchBreakdown()
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Failed to fetch');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
