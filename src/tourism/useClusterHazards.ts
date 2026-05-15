// React hook for fetching per-cluster hazard exposure from the backend.
// Endpoint: GET ${VITE_API_BASE_URL}/api/cluster-hazards/:cluster_id
//
// Lightweight in-memory cache keyed by cluster_id so re-selecting a previously
// viewed cluster is instant. The hook gracefully handles the API being
// unreachable (e.g. during local dev without the backend running) by surfacing
// an `error` string — the consuming UI shows a "No data" placeholder.

import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env as any)?.VITE_API_BASE_URL
  ?? 'https://bohol-cwis-api.azurewebsites.net';

export interface HazardBreakdownItem {
  class: string | null;
  gridcode: number | null;
  color: string | null;
  area_km2: number;
  pct: number;
}

export interface HazardSummary {
  available: boolean;
  headline_pct?: number;
  dominant_class?: string | null;
  breakdown?: HazardBreakdownItem[];
}

export interface ClusterHazardsResponse {
  cluster_id: number;
  name: string;
  tier: string;
  lgu: string;
  land_area_km2: number;
  hazards: {
    heat_stress: HazardSummary;
    flood: HazardSummary;
    sinkhole: HazardSummary;
  };
}

const cache = new Map<number, ClusterHazardsResponse>();
const inflight = new Map<number, Promise<ClusterHazardsResponse>>();

async function fetchHazards(clusterId: number): Promise<ClusterHazardsResponse> {
  if (cache.has(clusterId)) return cache.get(clusterId)!;
  if (inflight.has(clusterId)) return inflight.get(clusterId)!;

  const url = `${API_BASE}/api/cluster-hazards/${clusterId}`;
  const p = fetch(url)
    .then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = (await r.json()) as ClusterHazardsResponse;
      cache.set(clusterId, json);
      return json;
    })
    .finally(() => {
      inflight.delete(clusterId);
    });
  inflight.set(clusterId, p);
  return p;
}

export function useClusterHazards(clusterId: number | null) {
  const [data, setData] = useState<ClusterHazardsResponse | null>(
    clusterId != null ? cache.get(clusterId) ?? null : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clusterId == null) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    const cached = cache.get(clusterId);
    if (cached) {
      setData(cached);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchHazards(clusterId)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'fetch failed');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clusterId]);

  return { data, loading, error };
}
