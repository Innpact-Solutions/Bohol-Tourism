// Hook: fetches the per-cluster hazard headline % summary in a single round
// trip. Used by the analytics KPI grid to count clusters exceeding a high
// climate hazard threshold without making one request per cluster.

import { useEffect, useState } from 'react';

const API_BASE = (import.meta.env as any)?.VITE_API_BASE_URL
  ?? 'https://bohol-cwis-api.azurewebsites.net';

export interface ClusterHazardSummary {
  cluster_id: number;
  name: string;
  tier: string;
  lgu: string;
  heat_pct: number;
  flood_pct: number;
  sinkhole_pct: number;
}

interface SummaryResponse {
  count: number;
  clusters: ClusterHazardSummary[];
}

let cache: SummaryResponse | null = null;
let inflight: Promise<SummaryResponse> | null = null;

// Retry transient Azure App Service cold-start errors.
const RETRY_DELAYS_MS = [800, 2000, 4000];
const TRANSIENT_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

async function fetchWithRetry(url: string): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r;
      if (!TRANSIENT_STATUSES.has(r.status) || attempt === RETRY_DELAYS_MS.length) return r;
      lastErr = new Error(`HTTP ${r.status}`);
    } catch (e) {
      lastErr = e;
      if (attempt === RETRY_DELAYS_MS.length) throw e;
    }
    await new Promise((res) => setTimeout(res, RETRY_DELAYS_MS[attempt]));
  }
  throw lastErr ?? new Error('fetch failed');
}

function fetchSummary(): Promise<SummaryResponse> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetchWithRetry(`${API_BASE}/api/cluster-hazards/summary`)
    .then(async (r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = (await r.json()) as SummaryResponse;
      cache = json;
      return json;
    })
    .finally(() => { inflight = null; });
  return inflight;
}

export function useClusterHazardsSummary() {
  const [data, setData] = useState<ClusterHazardSummary[] | null>(
    cache?.clusters ?? null
  );
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    setLoading(true);
    fetchSummary()
      .then((json) => {
        if (!alive) return;
        setData(json.clusters);
        setError(null);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return { data, loading, error };
}
