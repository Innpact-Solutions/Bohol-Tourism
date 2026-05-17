// React hook for fetching per-cluster NDVI (green cover) breakdown.
// Endpoint: GET ${VITE_API_BASE_URL}/api/cluster-ndvi/:cluster_id
//
// Mirrors the cache + retry pattern of useClusterHazards.

import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env as any)?.VITE_API_BASE_URL
  ?? 'https://bohol-cwis-api.azurewebsites.net';

export interface NdviBreakdownItem {
  gridcode: number;
  class: string | null;
  color: string | null;
  area_km2: number;
  pct: number;
}

export interface ClusterNdviResponse {
  classes: Array<{ gridcode: number; class: string | null; color: string | null }>;
  cluster: {
    cluster_id: number;
    name: string;
    tier: string;
    lgu: string;
    total_km2: number;
    breakdown: NdviBreakdownItem[];
  };
}

const cache = new Map<number, ClusterNdviResponse>();
const inflight = new Map<number, Promise<ClusterNdviResponse>>();

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

async function fetchNdvi(clusterId: number): Promise<ClusterNdviResponse> {
  if (cache.has(clusterId)) return cache.get(clusterId)!;
  if (inflight.has(clusterId)) return inflight.get(clusterId)!;
  const url = `${API_BASE}/api/cluster-ndvi/${clusterId}`;
  const p = fetchWithRetry(url)
    .then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = (await r.json()) as ClusterNdviResponse;
      cache.set(clusterId, json);
      return json;
    })
    .finally(() => { inflight.delete(clusterId); });
  inflight.set(clusterId, p);
  return p;
}

export function useClusterNdvi(clusterId: number | null) {
  const [data, setData] = useState<ClusterNdviResponse | null>(
    clusterId != null ? cache.get(clusterId) ?? null : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clusterId == null) {
      setData(null); setError(null); setLoading(false);
      return;
    }
    const cached = cache.get(clusterId);
    if (cached) { setData(cached); setError(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchNdvi(clusterId)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'fetch failed');
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [clusterId]);

  return { data, loading, error };
}

/**
 * Convenience: derive Built-up % and Green % from the cluster breakdown.
 *
 * Built-up  = gridcodes 2 + 3 (Bare / built-up + Sparse vegetation;
 *             NDVI 0–0.4 — essentially non-canopy land)
 * Green     = gridcodes 4 + 5 + 6 (Moderate + Dense + Very dense vegetation)
 *
 * Water (gridcode 1) is intentionally excluded — the two values describe
 * land cover composition, so they may sum to <100% when a cluster polygon
 * contains water.
 */
export function deriveLandCover(resp: ClusterNdviResponse | null) {
  if (!resp || !resp.cluster.breakdown.length) {
    return { builtupPct: null as number | null, greenPct: null as number | null };
  }
  let builtup = 0;
  let green = 0;
  for (const b of resp.cluster.breakdown) {
    if (b.gridcode === 2 || b.gridcode === 3) builtup += b.pct;
    else if (b.gridcode === 4 || b.gridcode === 5 || b.gridcode === 6) green += b.pct;
    // gridcode 1 (water) intentionally ignored
  }
  return {
    builtupPct: Number(builtup.toFixed(1)),
    greenPct:   Number(green.toFixed(1)),
  };
}
