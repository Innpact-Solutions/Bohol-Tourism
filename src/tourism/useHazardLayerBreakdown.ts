// Hook: fetches a hazard layer directly from GeoServer WFS, aggregates
// features by their `Type` field, sums `Shape_Area`, and reads the slice
// color from the `color_code` field. Used by the right-panel hazard pie.

import { useEffect, useState } from 'react';

const GEOSERVER_WFS = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows';

export interface HazardLayerSlice {
  class: string;
  color: string;
  area: number;   // sum of Shape_Area in source units
  pct: number;    // share of total area, 0–100
}

// Module-level cache keyed by GeoServer layer name (e.g. "WorldBank_Bohol:Sinkhole").
const cache = new Map<string, HazardLayerSlice[]>();
const inflight = new Map<string, Promise<HazardLayerSlice[]>>();

function buildUrl(layerName: string): string {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '1.0.0',
    request: 'GetFeature',
    typeName: layerName,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    propertyName: 'Type,Shape_Area,color_code',
  });
  return `${GEOSERVER_WFS}?${params.toString()}`;
}

async function fetchHazardLayer(layerName: string): Promise<HazardLayerSlice[]> {
  if (cache.has(layerName)) return cache.get(layerName)!;
  if (inflight.has(layerName)) return inflight.get(layerName)!;

  const p = fetch(buildUrl(layerName))
    .then(async (r) => {
      if (!r.ok) throw new Error(`WFS HTTP ${r.status}`);
      const json = await r.json();
      const buckets = new Map<string, { color: string; area: number }>();
      for (const f of json?.features || []) {
        const props = f?.properties || {};
        const type = props.Type ?? props.type ?? '—';
        const colorRaw = props.color_code ?? props.Color_Code ?? props.color ?? '#94A3B8';
        const color = String(colorRaw).startsWith('#') ? String(colorRaw) : `#${colorRaw}`;
        const area =
          Number(props.Shape_Area ?? props.shape_area ?? props.SHAPE_Area ?? props.area_m2 ?? 0) || 0;
        const key = String(type);
        const cur = buckets.get(key) || { color, area: 0 };
        cur.area += area;
        // keep the first non-fallback color encountered
        if (!cur.color || cur.color === '#94A3B8') cur.color = color;
        buckets.set(key, cur);
      }
      let total = 0;
      for (const v of buckets.values()) total += v.area;
      const slices: HazardLayerSlice[] = [];
      for (const [name, v] of buckets) {
        slices.push({
          class: name,
          color: v.color,
          area: v.area,
          pct: total > 0 ? (v.area / total) * 100 : 0,
        });
      }
      // sort by area desc for stable visual order
      slices.sort((a, b) => b.area - a.area);
      cache.set(layerName, slices);
      return slices;
    })
    .finally(() => {
      inflight.delete(layerName);
    });
  inflight.set(layerName, p);
  return p;
}

export function useHazardLayerBreakdown(layerName: string | null | undefined) {
  const [data, setData] = useState<HazardLayerSlice[] | null>(
    layerName ? cache.get(layerName) ?? null : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!layerName) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    const cached = cache.get(layerName);
    if (cached) {
      setData(cached);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchHazardLayer(layerName)
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
  }, [layerName]);

  return { data, loading, error };
}
