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

// Retry transient gateway errors (502/503/504) which typically indicate the
// Azure App Service backend is cold-starting. Total wait ≈ 0.8s + 2s + 4s.
const RETRY_DELAYS_MS = [800, 2000, 4000];
const TRANSIENT_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

async function fetchWithRetry(url: string): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r;
      if (!TRANSIENT_STATUSES.has(r.status) || attempt === RETRY_DELAYS_MS.length) {
        return r;
      }
      lastErr = new Error(`HTTP ${r.status}`);
    } catch (e) {
      lastErr = e;
      if (attempt === RETRY_DELAYS_MS.length) throw e;
    }
    await new Promise((res) => setTimeout(res, RETRY_DELAYS_MS[attempt]));
  }
  throw lastErr ?? new Error('fetch failed');
}

async function fetchHazards(clusterId: number): Promise<ClusterHazardsResponse> {
  if (cache.has(clusterId)) return cache.get(clusterId)!;
  if (inflight.has(clusterId)) return inflight.get(clusterId)!;

  const url = `${API_BASE}/api/cluster-hazards/${clusterId}`;
  const p = fetchWithRetry(url)
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
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (clusterId == null) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    const cached = cache.get(clusterId);
    if (cached && reloadTick === 0) {
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
  }, [clusterId, reloadTick]);

  const refetch = () => {
    if (clusterId != null) cache.delete(clusterId);
    setReloadTick((t) => t + 1);
  };

  return { data, loading, error, refetch };
}
