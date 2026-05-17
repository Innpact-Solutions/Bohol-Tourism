// React hook for fetching per-cluster road-network breakdown.
// Endpoint: GET ${VITE_API_BASE_URL}/api/cluster-roads/:cluster_id
//
// Mirrors the cache + retry pattern of useClusterNdvi.

import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env as any)?.VITE_API_BASE_URL
  ?? 'https://bohol-cwis-api.azurewebsites.net';

export interface RoadBreakdownItem {
  category: string;
  length_km: number;
  pct: number;
}

export interface ClusterRoadsResponse {
  categories: string[];
  cluster: {
    cluster_id: number;
    name: string;
    tier: string;
    lgu: string;
    total_km: number;
    breakdown: RoadBreakdownItem[];
  };
}

const cache = new Map<number, ClusterRoadsResponse>();
const inflight = new Map<number, Promise<ClusterRoadsResponse>>();

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

async function fetchRoads(clusterId: number): Promise<ClusterRoadsResponse> {
  if (cache.has(clusterId)) return cache.get(clusterId)!;
  if (inflight.has(clusterId)) return inflight.get(clusterId)!;
  const url = `${API_BASE}/api/cluster-roads/${clusterId}`;
  const p = fetchWithRetry(url)
    .then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = (await r.json()) as ClusterRoadsResponse;
      cache.set(clusterId, json);
      return json;
    })
    .finally(() => { inflight.delete(clusterId); });
  inflight.set(clusterId, p);
  return p;
}

export function useClusterRoads(clusterId: number | null) {
  const [data, setData] = useState<ClusterRoadsResponse | null>(
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
    fetchRoads(clusterId)
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
 * Convenience: derive the three KPI footer buckets.
 *  - National Road %
 *  - Municipal Road %
 *  - Other Road % (sum of every remaining category — Barangay, Private,
 *    Provincial, Trail, etc). All three percentages sum to 100%.
 */
export function deriveRoadShares(resp: ClusterRoadsResponse | null) {
  if (!resp || !resp.cluster.breakdown.length) {
    return {
      totalKm:      null as number | null,
      nationalPct:  null as number | null,
      municipalPct: null as number | null,
      otherPct:     null as number | null,
    };
  }
  let nat = 0;
  let mun = 0;
  let oth = 0;
  for (const b of resp.cluster.breakdown) {
    if (b.category === 'National Road') nat += b.pct;
    else if (b.category === 'Municipal Road') mun += b.pct;
    else oth += b.pct;
  }
  return {
    totalKm:      resp.cluster.total_km,
    nationalPct:  Number(nat.toFixed(1)),
    municipalPct: Number(mun.toFixed(1)),
    otherPct:     Number(oth.toFixed(1)),
  };
}
