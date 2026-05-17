// Tourism Analytics Panel — right-side analytics for the Tourism dashboard.
// Typography matches the left drawer / TourismInsightsPanel:
//   font: DM Sans, eyebrow = 9px bold uppercase tracking-[0.16em],
//   titles = 12.5px font-semibold, body = 12px, muted = #64748B / #94A3B8.

import React, { useMemo, useState } from 'react';
import { MapPin, X, Star, Layers, AlertTriangle, ChevronDown, ChevronUp, Route, Utensils, Coffee, Mountain, BedDouble } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList, PieChart, Pie } from 'recharts';
import { useTourismData } from './TourismContext';
import { useTourismUI } from './tourismStore';
import { useClusterHazards } from './useClusterHazards';
import { useClusterNdvi, deriveLandCover } from './useClusterNdvi';
import { useClusterRoads, deriveRoadShares } from './useClusterRoads';
import { useClusterHazardsSummary } from './useClusterHazardsSummary';
import { useHazardLayerBreakdown } from './useHazardLayerBreakdown';
import type { HazardSummary } from './useClusterHazards';
import { CATEGORY_COLORS, TIER_COLORS } from './styles';
import {
  SITE_TIER_TOKENS, ASSET_TIER_TOKENS, CLUSTER_TIER_TOKENS,
  HAZARD_TOKENS, CONNECTIVITY_TOKENS, CATEGORY_ICONS, Hotel,
} from './tokens';
import { TOURISM_INTERVENTIONS, TOURISM_INTERVENTIONS_BY_CLUSTER } from '../config/tourismConfig';
import { geoserverLayers } from '../config/geoserverLayers';
import { ENVIRONMENTAL_LAYERS } from '../config/environmentalLayers';
import clusterConnectivity from '../../public/data/tourism/cluster_connectivity.json';

type ConnectivityEntry = {
  anchor_name: string | null;
  anchor_coords: { lat: number; lng: number } | null;
  airport: { km: number | null; min: number | null; status?: string };
  port:    { km: number | null; min: number | null; status?: string };
  bus:     { km: number | null; min: number | null; status?: string };
};
const CONNECTIVITY_BY_CLUSTER: Record<string, ConnectivityEntry> = clusterConnectivity as any;

// Plain-English climate-risk summary per cluster (rendered after the Hazard
// Exposure card). Keys are cluster_id from clusters.geojson.
const CLUSTER_CLIMATE_SUMMARY: Record<number, string> = {
  1: 'Some beach flooding in storms. Heat and rain flooding are low — mid-pack overall.',
  2: 'The hottest cluster by far (5× the next worst) and the most at risk of ground sinking. Also the worst for rainwater flooding.',
  3: 'Highest storm-flooding risk of any cluster — 99.8% of the area can flood in storms. Heat is near zero.',
  4: '3rd worst for storm flooding. No heat risk. The bigger worry is reef damage, not buildings.',
  5: '2nd worst for rainwater flooding and 3rd most sinkhole-prone. Cave water is at risk.',
  6: '2nd hottest cluster and 4th most at risk of sea flooding — the bridge and church are most exposed.',
  7: 'In the top 3 for every climate risk: 2nd worst flooding, 3rd hottest, 3rd most sinkhole-prone.',
  8: 'Lowest climate risk of any cluster — almost no flooding, heat, or sinking ground.',
  9: 'Storm surge is the key climate hazard here.',
};

const FONT = 'DM Sans, Segoe UI, sans-serif';

const TIER_ORDER = ['Anchor', 'Secondary', 'Supportive'] as const;
const TIER_ACCENT: Record<typeof TIER_ORDER[number], string> = {
  Anchor:     SITE_TIER_TOKENS.Anchor.accent,
  Secondary:  SITE_TIER_TOKENS.Secondary.accent,
  Supportive: SITE_TIER_TOKENS.Supportive.accent,
};

const CAT_ORDER = [
  'Beach',
  'Marine',
  'Nature / Viewpoint',
  'Heritage',
  'Faith',
  'Urban Park',
] as const;

// Category icon + short label — sourced from centralised CATEGORY_ICONS token.
const CAT_META = CATEGORY_ICONS;

// Custom X-axis tick: lucide icon over short category label.
function CategoryAxisTick(props: any) {
  const { x, y, payload } = props;
  const name = String(payload?.value || '');
  const meta = CAT_META[name];
  const short = meta?.short || name;
  const Icon = meta?.icon;
  const color = CATEGORY_COLORS[name] || '#64748B';
  return (
    <g transform={`translate(${x}, ${y})`}>
      {Icon && (
        <foreignObject x={-9} y={2} width={18} height={18} style={{ overflow: 'visible' }}>
          <div
            style={{
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
            }}
          >
            <Icon size={13} strokeWidth={2.2} />
          </div>
        </foreignObject>
      )}
      <text
        x={0}
        y={32}
        textAnchor="middle"
        fill="#475569"
        fontFamily={FONT}
        fontSize={9.5}
        fontWeight={500}
      >
        {short}
      </text>
    </g>
  );
}

// Custom tooltip: lucide icon + name + count + share badge.
function CategoryTooltip({ active, payload, total }: { active?: boolean; payload?: any[]; total: number }) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  const name: string = p.name;
  const value: number = p.value || 0;
  const meta = CAT_META[name];
  const Icon = meta?.icon;
  const color = p.color || CATEGORY_COLORS[name] || '#64748B';
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        fontFamily: FONT,
        color: '#0F172A',
        boxShadow: '0 6px 16px rgba(15,23,42,0.10)',
        padding: '8px 10px',
        minWidth: 160,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: `${color}1A`,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {Icon ? <Icon size={13} strokeWidth={2.2} /> : <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} />}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{name}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
          {value.toLocaleString()}
        </div>
        <div style={{ fontSize: 10.5, color: '#64748B' }}>sites</div>
        <div
          style={{
            marginLeft: 'auto',
            fontSize: 10.5,
            fontWeight: 600,
            color,
            background: `${color}1A`,
            borderRadius: 999,
            padding: '1px 6px',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {pct}%
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  caption,
  captionItems,
  accent,
  tint,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  caption?: string;
  captionItems?: Array<{ label: string; value: number | string }>;
  accent: string;
  tint: string;
}) {
  // When captionItems are provided, render them as a horizontally scrolling
  // ticker so each "label number" pair stays readable inside the tiny card.
  // Falls back to the static `caption` string for legacy call sites.
  const renderTicker = captionItems && captionItems.length > 0;
  const tickerContent = renderTicker ? (
    <span className="inline-flex items-center gap-1 pr-6">
      {captionItems!.map((it, i) => (
        <span key={`${it.label}-${i}`} className="inline-flex items-center gap-0.5 whitespace-nowrap">
          <span>{it.label}</span>
          <span
            className="tabular-nums font-semibold"
            style={{ color: accent }}
          >
            {it.value}
          </span>
          {i < captionItems!.length - 1 && (
            <span className="opacity-40">·</span>
          )}
        </span>
      ))}
    </span>
  ) : null;
  return (
    <div
      className="relative rounded-lg bg-white border border-[#E2E8F0] px-2.5 py-2 overflow-hidden transition-shadow hover:shadow-sm"
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] font-semibold text-[#0F172A]">
          {label}
        </div>
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: accent + '1A', color: accent }}
        >
          <Icon className="w-3 h-3" strokeWidth={2.4} />
        </div>
      </div>
      <div className="text-[17px] font-semibold leading-none tabular-nums tracking-tight text-[#0F172A]">
        {value}
      </div>
      {renderTicker ? (
        <div className="text-[10px] text-[#64748B] mt-1 overflow-hidden whitespace-nowrap">
          <div className="inline-flex animate-scroll-text">
            {tickerContent}
            {tickerContent}
          </div>
        </div>
      ) : (
        <div className="text-[10px] text-[#64748B] mt-1 truncate">{caption}</div>
      )}
    </div>
  );
}

function CategoryRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div
      className="rounded-md bg-white border border-[#E2E8F0] px-2.5 py-1.5"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          <span className="text-[11.5px] font-semibold text-[#0F172A] truncate">{label}</span>
        </div>
        <div className="flex items-baseline gap-1.5 flex-shrink-0">
          <span className="text-[11.5px] font-semibold text-[#0F172A] tabular-nums">
            {count.toLocaleString()}
          </span>
          <span className="text-[9.5px] tabular-nums" style={{ color }}>
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="h-1 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold text-[#475569] mb-1.5">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Climate hazards callout — at-a-glance Heat / Flood / Sinkhole exposure
// across all clusters, shown as a compact card with per-hazard progress bars
// (avg % across clusters) and a count of clusters above the high-hazard
// threshold (≥ 25 %).
// ---------------------------------------------------------------------------

function ClimateHazardsCallout({
  rows,
  lguFilter,
  totalClusters,
}: {
  rows: Array<{ lgu: string; heat_pct: number; flood_pct: number; sinkhole_pct: number }> | null | undefined;
  lguFilter: string | null;
  totalClusters: number;
}) {
  const HIGH = 25;
  const MODERATE = 10;
  const stats = React.useMemo(() => {
    const out = {
      heat:     { avg: 0, max: 0, high: 0, moderate: 0 },
      flood:    { avg: 0, max: 0, high: 0, moderate: 0 },
      sinkhole: { avg: 0, max: 0, high: 0, moderate: 0 },
    };
    if (!rows || rows.length === 0) return out;
    const filtered = rows.filter((r) => !lguFilter || r.lgu === lguFilter);
    if (filtered.length === 0) return out;
    let sH = 0, sF = 0, sS = 0;
    const bump = (b: { high: number; moderate: number }, v: number) => {
      if (v >= HIGH) b.high++;
      else if (v >= MODERATE) b.moderate++;
    };
    for (const r of filtered) {
      sH += r.heat_pct;     if (r.heat_pct     > out.heat.max)     out.heat.max     = r.heat_pct;
      sF += r.flood_pct;    if (r.flood_pct    > out.flood.max)    out.flood.max    = r.flood_pct;
      sS += r.sinkhole_pct; if (r.sinkhole_pct > out.sinkhole.max) out.sinkhole.max = r.sinkhole_pct;
      bump(out.heat,     r.heat_pct);
      bump(out.flood,    r.flood_pct);
      bump(out.sinkhole, r.sinkhole_pct);
    }
    out.heat.avg     = sH / filtered.length;
    out.flood.avg    = sF / filtered.length;
    out.sinkhole.avg = sS / filtered.length;
    return out;
  }, [rows, lguFilter]);

  const items = [
    { key: 'heat',     label: HAZARD_TOKENS.heat.label,     accent: HAZARD_TOKENS.heat.accent,     tint: HAZARD_TOKENS.heat.tint,     data: stats.heat },
    { key: 'flood',    label: HAZARD_TOKENS.flood.label,    accent: HAZARD_TOKENS.flood.accent,    tint: HAZARD_TOKENS.flood.tint,    data: stats.flood },
    { key: 'sinkhole', label: HAZARD_TOKENS.sinkhole.label, accent: HAZARD_TOKENS.sinkhole.accent, tint: HAZARD_TOKENS.sinkhole.tint, data: stats.sinkhole },
  ] as const;

  const loading = !rows;

  return (
    <div className="px-3 pb-1">
      <div className="rounded-lg bg-white border border-[#E2E8F0] px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-semibold text-[#0F172A]">
            Climate Hazards
          </div>
          <div className="text-[9.5px] text-[#94A3B8] tracking-wide">
            across {totalClusters} clusters
          </div>
        </div>
        {loading ? (
          <div className="text-[10.5px] text-[#94A3B8] py-1">Loading hazard exposure…</div>
        ) : (
          <div className="space-y-1.5">
            {items.map((it) => {
              const pctAvg = Math.round(it.data.avg);
              const pctMax = Math.round(it.data.max);
              const barW = Math.min(100, Math.max(0, pctAvg));
              return (
                <div key={it.key}>
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10.5px] font-medium text-[#334155] truncate">
                        {it.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span
                        className="text-[10.5px] font-semibold tabular-nums"
                        style={{ color: it.accent }}
                      >
                        {pctAvg}%
                      </span>
                      <span
                        className="text-[9px] tabular-nums px-1 py-[1px] rounded font-semibold"
                        style={{ background: it.tint, color: it.accent }}
                        title={`${it.data.high} clusters ≥ ${HIGH}%`}
                      >
                        {it.data.high} high
                      </span>
                      <span
                        className="text-[9px] tabular-nums px-1 py-[1px] rounded font-medium"
                        style={{ background: '#F1F5F9', color: '#475569' }}
                        title={`${it.data.moderate} clusters ${MODERATE}–${HIGH}%`}
                      >
                        {it.data.moderate} mod
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-[#F1F5F9] relative">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${barW}%`, background: it.accent }}
                    />
                    {/* max marker */}
                    {pctMax > pctAvg && (
                      <div
                        className="absolute top-0 h-full w-[2px] opacity-50"
                        style={{ left: `calc(${Math.min(100, pctMax)}% - 1px)`, background: it.accent }}
                        title={`Peak ${pctMax}%`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            <div className="pt-1 flex items-center justify-between text-[9px] text-[#94A3B8] tracking-wide">
              <span>Avg exposure</span>
              <span>Low &lt; {MODERATE}% · Mod {MODERATE}–{HIGH}% · High ≥ {HIGH}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const TIER_BG: Record<string, string> = {
  Primary:   CLUSTER_TIER_TOKENS.Primary.accent,
  Emerging:  CLUSTER_TIER_TOKENS.Emerging.accent,
  Satellite: CLUSTER_TIER_TOKENS.Satellite.accent,
};

// ---------------------------------------------------------------------------
// Connectivity reference points — three key transport gateways in Bohol.
// Distances are computed great-circle (haversine) from each cluster's
// lead anchor destination. Lat/lng sourced from OpenStreetMap. Colour + icon
// come from CONNECTIVITY_TOKENS so the same gateway reads identically anywhere.
// ---------------------------------------------------------------------------

const CONNECTIVITY_POIS: Array<{ key: 'airport' | 'port' | 'bus'; label: string; lat: number; lng: number; icon: LucideIcon; accent: string; tint: string }> = [
  { key: 'airport', ...CONNECTIVITY_TOKENS.airport, lat: 9.5587, lng: 123.7711 },
  { key: 'port',    ...CONNECTIVITY_TOKENS.port,    lat: 9.6452, lng: 123.8546 },
  { key: 'bus',     ...CONNECTIVITY_TOKENS.bus,     lat: 9.6491, lng: 123.8722 },
];

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// CWIS hazard layers (storm surge, flood, urban waterlogging) are not in
// `geoserverLayers` — they are handled separately in MapCanvas via
// `getCWISLayerConfig`. Mirror the mapping here so the analytics pie can
// resolve them to their full WFS layer names and display titles.
const CWIS_HAZARD_LAYERS: Record<string, { name: string; layer: string }> = {
  storm_surge:        { name: 'Storm Surge',     layer: 'WorldBank_Bohol:StormSurge' },
  flood_hazard:       { name: 'Urban Flooding',  layer: 'WorldBank_Bohol:Flood' },
  urban_waterlogging: { name: 'Urban Flooding',  layer: 'WorldBank_Bohol:Flood' },
};

// ---------------------------------------------------------------------------
// Hazard distribution pie — visible whenever any Climate & Hazard layer is
// active on the map. Fetches the active GeoServer WFS layer directly,
// groups features by `Type`, sums `Shape_Area`, and renders slice colors
// from `color_code`. No legend — pie only.
// ---------------------------------------------------------------------------

function HazardDistributionPie({
  activeLayerId,
  activeHazardLayerId,
}: {
  activeLayerId?: string | null;
  activeHazardLayerId?: string | null;
}) {
  // Resolve the WFS layer name. For most Climate & Hazard layers App.tsx
  // supplies `activeHazardLayerId` via `getLayerNameForScenario`. CWIS
  // hazards (storm_surge, flood_hazard, urban_waterlogging) and Environmental
  // layers (sinkhole, geology, …) bypass that map, so we resolve them here.
  const envCfg  = activeLayerId ? ENVIRONMENTAL_LAYERS[activeLayerId]   : undefined;
  const cwisCfg = activeLayerId ? CWIS_HAZARD_LAYERS[activeLayerId]     : undefined;
  const resolvedLayerName =
    activeHazardLayerId ||
    cwisCfg?.layer ||
    (envCfg ? `${envCfg.workspace}:${envCfg.geoserverLayer}` : '');

  const { data, loading, error } = useHazardLayerBreakdown(resolvedLayerName || null);
  // eslint-disable-next-line no-console
  console.log('🥧 [HazardPie]', { activeLayerId, activeHazardLayerId, resolvedLayerName, hasData: !!data, loading, error });
  if (!resolvedLayerName) return null;

  const title =
    (activeLayerId && geoserverLayers[activeLayerId]?.name) ||
    cwisCfg?.name ||
    envCfg?.name ||
    resolvedLayerName.split(':').pop() ||
    'Hazard Layer';

  // Descending by area so the largest wedge starts at 12 o'clock and runs clockwise.
  const slices = (data || [])
    .filter((d) => d.pct > 0)
    .slice()
    .sort((a, b) => b.pct - a.pct);

  if (loading && slices.length === 0) {
    return (
      <div className="px-3 pb-3">
        <div className="rounded-lg bg-white border border-[#E2E8F0] px-3 py-3 text-[11px] text-[#94A3B8]">
          Loading {title}…
        </div>
      </div>
    );
  }
  if (slices.length === 0) {
    if (error) {
      return (
        <div className="px-3 pb-3">
          <div className="rounded-lg bg-white border border-[#E2E8F0] px-3 py-3 text-[11px] text-rose-600">
            Could not load {title} ({error})
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="px-3 pb-3">
      <div className="rounded-lg bg-white border border-[#E2E8F0] px-3 pt-2.5 pb-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="text-[12px] font-semibold text-[#0F172A] mb-1.5 text-center">
          {title}
        </div>
        <div className="w-full h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="pct"
                nameKey="class"
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius="85%"
                startAngle={90}
                endAngle={-270}
                stroke="#fff"
                strokeWidth={1.5}
                isAnimationActive={false}
              >
                {slices.map((d, i) => (
                  <Cell key={`${d.class}-${i}`} fill={d.color || '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: 6,
                  fontSize: 11,
                  fontFamily: FONT,
                  color: '#0F172A',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                }}
                formatter={(value: number, _name, item: any) => [
                  `${value.toFixed(1)}%`,
                  item?.payload?.class || 'Class',
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ClusterDetailSection() {
  const { clusters, sites, assets, accommodationsBooking, getMembershipFor } = useTourismData();
  const ui = useTourismUI();

  const cluster = ui.selectedClusterId != null
    ? clusters?.features.find((f: any) => f.properties.cluster_id === ui.selectedClusterId)
    : undefined;
  const mem = ui.selectedClusterId != null ? getMembershipFor(ui.selectedClusterId) : undefined;

  // --- Joined data: pull asset_cat / rating / n_ratings onto Premium & Quality lists
  const assetIndex = useMemo(() => {
    const idx = new Map<string, any>();
    if (!assets) return idx;
    for (const f of assets.features) {
      const p: any = f.properties || {};
      idx.set(`${p.name}|${p.lgu}`, p);
    }
    return idx;
  }, [assets]);

  // Mirror for sites — used to enrich Anchor / Secondary / Supportive lists with
  // their Google rating + n_ratings (same display as the Premium Stays list).
  const sitesIndex = useMemo(() => {
    const idx = new Map<string, any>();
    if (!sites) return idx;
    for (const f of sites.features) {
      const p: any = f.properties || {};
      idx.set(`${p.name}|${p.lgu}`, p);
    }
    return idx;
  }, [sites]);

  const enrichDest = (list?: any[]) =>
    (list || []).map((d) => {
      const s = sitesIndex.get(`${d.name}|${d.lgu}`);
      return {
        name: d.name,
        cat: d.cat || s?.site_cat || '',
        rating:    s?.rating    as number | undefined,
        n_ratings: s?.n_ratings as number | undefined,
        score: d.score,
      };
    });

  const anchorsDetailed    = useMemo(() => enrichDest(mem?.anchors),    [mem, sitesIndex]);
  const secondaryDetailed  = useMemo(() => enrichDest(mem?.secondary),  [mem, sitesIndex]);
  const supportiveDetailed = useMemo(() => enrichDest(mem?.supportive), [mem, sitesIndex]);

  const stayBreakdown = useMemo(() => {
    const tally = (list?: any[]) => {
      const c = { Hotel: 0, Restaurant: 0, 'Café': 0, Other: 0 };
      if (!list) return c;
      for (const it of list) {
        const a = assetIndex.get(`${it.name}|${it.lgu}`);
        const cat: string = a?.asset_cat || it?.cat || '';
        if (cat.startsWith('Hotel')) c.Hotel++;
        else if (cat.startsWith('Restaurant')) c.Restaurant++;
        else if (cat.startsWith('Cafe') || cat.startsWith('Café')) c['Café']++;
        else c.Other++;
      }
      return c;
    };
    if (!mem) return null;
    return {
      premium: tally(mem.premium),
      quality: tally(mem.quality),
    };
  }, [mem, assetIndex]);

  // --- Count Airbnb (Tourist Home) listings whose point falls inside the
  // currently-selected cluster polygon. Lazy import keeps turf out of the main
  // bundle for users who never open the analytics panel.
  const [pip, setPip] = React.useState<null | ((pt: any, poly: any) => boolean)>(null);
  React.useEffect(() => {
    let alive = true;
    import('@turf/boolean-point-in-polygon').then((m) => {
      if (alive) setPip(() => (m.default || (m as any).booleanPointInPolygon) as any);
    });
    return () => { alive = false; };
  }, []);
  const airbnbCount = useMemo(() => {
    if (!cluster || !accommodationsBooking || !pip) return null;
    const geom: any = (cluster as any).geometry;
    if (!geom) return 0;
    let n = 0;
    for (const f of accommodationsBooking.features as any[]) {
      const c = f?.geometry?.coordinates;
      if (!Array.isArray(c) || typeof c[0] !== 'number' || typeof c[1] !== 'number') continue;
      try {
        if (pip({ type: 'Point', coordinates: c } as any, geom)) n++;
      } catch { /* skip invalid geometry */ }
    }
    return n;
  }, [cluster, accommodationsBooking, pip]);

  const premiumStaysDetailed = useMemo(() => {
    if (!mem?.premium) return [];
    return [...mem.premium]
      .map((d) => {
        const a = assetIndex.get(`${d.name}|${d.lgu}`);
        return {
          name: d.name,
          cat: a?.asset_cat || d.cat || '',
          rating: a?.rating as number | undefined,
          n_ratings: a?.n_ratings as number | undefined,
          score: d.score,
        };
      })
      .sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [mem, assetIndex]);

  // --- Per-cluster site category distribution (uses DestinationRef.cat which is site_cat)
  const memberSiteDist = useMemo(() => {
    if (!mem) return [] as Array<{ name: string; value: number; color: string }>;
    const counts: Record<string, number> = {};
    for (const cat of CAT_ORDER) counts[cat] = 0;
    for (const list of [mem.anchors, mem.secondary, mem.supportive]) {
      for (const d of list || []) {
        const c = String(d.cat || '');
        if (c in counts) counts[c]++;
      }
    }
    return CAT_ORDER
      .map((c) => ({ name: c, value: counts[c] || 0, color: CATEGORY_COLORS[c] || '#94A3B8' }))
      .filter((d) => d.value > 0);
  }, [mem]);
  const memberSiteTotal = memberSiteDist.reduce((s, d) => s + d.value, 0);

  // --- Lead anchor coords for connectivity distances
  const leadAnchor = useMemo(() => {
    if (!mem || !sites || mem.anchors.length === 0) return null;
    const lead = mem.anchors[0];
    const f: any = sites.features.find(
      (s: any) => s.properties?.name === lead.name && s.properties?.lgu === lead.lgu,
    );
    const coords = f?.geometry?.coordinates;
    if (!coords || typeof coords[0] !== 'number' || typeof coords[1] !== 'number') return null;
    return { name: lead.name, lng: coords[0], lat: coords[1] };
  }, [mem, sites]);

  // Driving distance + duration from precomputed Google Routes API matrix
  // (scripts/fetch_connectivity_distances.mjs → cluster_connectivity.json).
  // Falls back to great-circle haversine when no driving route exists
  // (e.g. Balicasag island) or the cluster has no resolved anchor.
  const distances = useMemo(() => {
    const cid = (cluster?.properties as any)?.cluster_id;
    const entry = cid != null ? CONNECTIVITY_BY_CLUSTER[String(cid)] : undefined;
    return CONNECTIVITY_POIS.map((poi) => {
      const cell = entry?.[poi.key];
      if (cell && typeof cell.km === 'number') {
        return { ...poi, km: cell.km, min: cell.min ?? null, source: 'drive' as const };
      }
      if (leadAnchor) {
        return { ...poi, km: haversineKm(leadAnchor, poi), min: null, source: 'air' as const };
      }
      return { ...poi, km: null as number | null, min: null, source: 'none' as const };
    });
  }, [cluster, leadAnchor]);

  // NDVI-derived land cover for the Land Area KPI footer.
  // NOTE: this hook MUST be called before any early return so React's hook
  // order stays stable across renders (cluster may be null on first paint).
  const ndviClusterId = (cluster?.properties as any)?.cluster_id ?? null;
  const ndviClusterName = String((cluster?.properties as any)?.name ?? '');
  const { data: ndviData } = useClusterNdvi(ndviClusterId);
  let { builtupPct, greenPct } = deriveLandCover(ndviData);
  // Balicasag Marine Sanctuary is an offshore island with no NDVI coverage in
  // the source raster — use curated land-cover values instead of "NA".
  if (/balicasag/i.test(ndviClusterName) && builtupPct == null && greenPct == null) {
    builtupPct = 35;
    greenPct = 65;
  }
  const fmtPct = (v: number | null) => (v == null ? 'NA' : `${v}%`);

  // Per-cluster road network from the precomputed `ovl_cluster_roads` table.
  const { data: roadsData } = useClusterRoads(ndviClusterId);
  let { totalKm: roadTotalKm, nationalPct, municipalPct, otherPct } =
    deriveRoadShares(roadsData);
  // Balicasag is an offshore island with no national/municipal roads — its
  // internal paths are all unclassified, so treat as 100% "Other".
  if (/balicasag/i.test(ndviClusterName) && nationalPct == null && municipalPct == null && otherPct == null) {
    nationalPct = 0;
    municipalPct = 0;
    otherPct = 100;
  }
  const roadTotalStr = roadTotalKm == null ? 'NA' : `${roadTotalKm.toFixed(2)} km`;

  if (!cluster || !mem) return null;
  const p: any = cluster.properties;
  const landKm2 = p.area_land ?? p.area_km2;
  const perCluster = TOURISM_INTERVENTIONS_BY_CLUSTER[p.cluster_id as number];
  const interventions = perCluster?.items ?? (TOURISM_INTERVENTIONS[p.tier] || TOURISM_INTERVENTIONS.Satellite);
  const tierColor = TIER_BG[p.tier] || '#64748B';

  const nSites = (mem.anchors?.length || 0) + (mem.secondary?.length || 0) + (mem.supportive?.length || 0);
  const nPrem  = mem.premium?.length || 0;
  const nQual  = mem.quality?.length || 0;
  const landStr = typeof landKm2 === 'number' ? landKm2.toFixed(2) : (landKm2 ?? '—');

  return (
    <div className="px-3 pt-3 pb-2">
      {/* Section heading — "Cluster Assessment" eyebrow + prominent cluster name */}
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[9.5px] font-semibold tracking-wide text-[#94A3B8] mb-1">
            Cluster Assessment
          </div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block w-1 self-stretch rounded-full flex-shrink-0"
              style={{ background: tierColor, minHeight: 22 }}
            />
            <h2
              className="text-[18px] font-bold text-[#0F172A] leading-tight tracking-tight truncate"
              title={p.name}
              style={{ letterSpacing: '-0.01em' }}
            >
              {p.name}
            </h2>
          </div>
        </div>
        <button
          onClick={() => ui.setSelectedClusterId(null)}
          className="text-[#94A3B8] hover:text-[#0F172A] transition-colors p-0.5 flex-shrink-0 mt-0.5"
          aria-label="Close cluster detail"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Meta row — tier badge + priority + LGU (Potential removed per spec) */}
      <div className="flex items-center flex-wrap gap-1.5 mb-2 text-[10.5px] text-[#64748B]">
        <span
          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
          style={{ background: tierColor }}
        >
          {p.tier}
        </span>
        {p.priority && <span>Priority P{p.priority}</span>}
        {p.lgu && <><span className="text-[#CBD5E1]">·</span><span>{p.lgu}</span></>}
      </div>

      {/* KPI grid — Land Area · Tourism Sites · Road Length · Stay & Dining */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <StatCard
          icon={Mountain}
          label="Land Area"
          value={landStr === '—' ? '—' : `${landStr} km²`}
          captionItems={[
            { label: 'Built-up', value: fmtPct(builtupPct) },
            { label: 'Green',    value: fmtPct(greenPct) },
          ]}
          accent="#16A34A"
          tint="#DCFCE7"
        />
        <StatCard
          icon={SITE_TIER_TOKENS.Anchor.icon}
          label="Tourism Sites"
          value={nSites.toLocaleString()}
          captionItems={[
            { label: 'Anchor',     value: mem.anchors?.length || 0 },
            { label: 'Secondary',  value: mem.secondary?.length || 0 },
            { label: 'Supportive', value: mem.supportive?.length || 0 },
          ]}
          accent={SITE_TIER_TOKENS.Anchor.accent}
          tint={SITE_TIER_TOKENS.Anchor.tint}
        />
        <StatCard
          icon={Route}
          label="Road Length"
          value={roadTotalStr}
          captionItems={[
            { label: 'National',  value: fmtPct(nationalPct) },
            { label: 'Municipal', value: fmtPct(municipalPct) },
            { label: 'Other',     value: fmtPct(otherPct) },
          ]}
          accent="#475569"
          tint="#F1F5F9"
        />
        <StatCard
          icon={ASSET_TIER_TOKENS.Premium.icon}
          label="Stay and Dining"
          value={(nPrem + nQual).toLocaleString()}
          captionItems={[
            { label: 'Premium',      value: nPrem },
            { label: 'Quality',      value: nQual },
            { label: 'Tourist Home', value: 'NA' },
          ]}
          accent={ASSET_TIER_TOKENS.Premium.accent}
          tint={ASSET_TIER_TOKENS.Premium.tint}
        />
      </div>

      {/* --- Layer 2: Site Distribution mini bar chart --- */}
      {memberSiteDist.length > 0 && (
        <div className="rounded-lg bg-white border border-[#E2E8F0] px-3 pt-2.5 pb-2 mb-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-baseline justify-between mb-1.5">
            <div className="text-[12px] font-semibold text-[#0F172A]">Site Distribution</div>
            <div className="text-[10px] text-[#94A3B8] tabular-nums">{memberSiteTotal} sites</div>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberSiteDist} margin={{ top: 12, right: 4, left: -22, bottom: 0 }} barCategoryGap="22%">
                <XAxis
                  dataKey="name"
                  tick={<CategoryAxisTick />}
                  height={42}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 9.5, fill: '#94A3B8', fontFamily: FONT }}
                  tickLine={false}
                  axisLine={false}
                  width={22}
                  allowDecimals={false}
                />
                <Tooltip cursor={{ fill: '#F1F5F9' }} content={<CategoryTooltip total={memberSiteTotal} />} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    style={{ fontSize: 10, fill: '#0F172A', fontFamily: FONT, fontWeight: 700 }}
                  />
                  {memberSiteDist.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* --- Layer 3: Stay & Dining detail (Premium/Quality H/R/C + Tourist Home) --- */}
      {stayBreakdown && (
        <div className="rounded-lg bg-white border border-[#E2E8F0] px-3 pt-2 pb-2.5 mb-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="text-[12px] font-semibold text-[#0F172A] mb-2">Stay &amp; Dining Breakdown</div>
          <div className="space-y-1.5">
            <StayTierRow label="Premium Stays & Dining"             accent={ASSET_TIER_TOKENS.Premium.accent}     total={nPrem} counts={stayBreakdown.premium} />
            <StayTierRow label="Quality Stays & Dining"             accent={ASSET_TIER_TOKENS.Quality.accent}     total={nQual} counts={stayBreakdown.quality} />
            <TouristHomeRow
              label={ASSET_TIER_TOKENS.TouristHome.label}
              accent={ASSET_TIER_TOKENS.TouristHome.accent}
              airbnb={airbnbCount}
            />
          </div>
        </div>
      )}

      {/* --- Layer 4: Hazard exposure (unchanged) --- */}
      <div className="rounded-md bg-white border border-[#E2E8F0] overflow-hidden mb-2">
        <ClusterHazardExposure clusterId={p.cluster_id} tierColor={tierColor} />
      </div>

      {/* --- Layer 4b: Plain-English climate summary per cluster --- */}
      {CLUSTER_CLIMATE_SUMMARY[p.cluster_id] && (
        <div
          className="rounded-lg bg-white border border-[#E2E8F0] px-3 pt-2 pb-2.5 mb-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          style={{ borderLeft: '3px solid #2563EB' }}
        >
          <div
            className="inline-flex items-center gap-1.5 mb-1.5 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide"
            style={{ background: '#2563EB', color: '#fff' }}
          >
            <span className="text-[9px]">◆</span>
            Climate Risk Summary
          </div>
          <div className="text-[11.5px] leading-snug text-[#334155]">
            {CLUSTER_CLIMATE_SUMMARY[p.cluster_id]}
          </div>
        </div>
      )}

      {/* --- Layer 5: Connectivity (from lead anchor) --- */}
      <div className="rounded-lg bg-white border border-[#E2E8F0] px-3 pt-2 pb-2.5 mb-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-[12px] font-semibold text-[#0F172A]">Connectivity</div>
          <div className="text-[9.5px] text-[#94A3B8] tracking-wide truncate ml-2 max-w-[60%] text-right" title={leadAnchor?.name || ''}>
            {leadAnchor ? `from ${leadAnchor.name}` : 'from cluster anchor'}
          </div>
        </div>
        <div className="space-y-1">
          {CONNECTIVITY_POIS.map((poi) => {
            const d = distances?.find((x) => x.key === poi.key);
            const Icon = poi.icon;
            return (
              <div
                key={poi.key}
                className="flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-2 py-1.5"
                style={{ borderLeft: `3px solid ${poi.accent}` }}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: poi.tint, color: poi.accent }}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11.5px] font-medium text-[#0F172A] truncate" title={poi.label}>
                    {poi.label}
                  </div>
                  {d?.source === 'air' && d.km != null && (
                    <div className="text-[9.5px] text-[#94A3B8] tracking-wide">straight-line</div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[12px] font-semibold tabular-nums text-[#0F172A] leading-tight">
                    {d && d.km != null ? `${d.km.toFixed(1)} km` : 'NA'}
                  </div>
                  {d?.min != null && (
                    <div className="text-[10px] text-[#64748B] tabular-nums leading-tight">{d.min} min drive</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Layer 6: Recommendations (highlighted) --- */}
      <div
        className="rounded-md border overflow-hidden mb-2"
        style={{ borderColor: `${tierColor}33`, background: `${tierColor}0D` }}
      >
        <div className="px-3 pt-2 pb-2">
          <div
            className="inline-flex items-center gap-1.5 mb-1.5 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide"
            style={{ background: tierColor, color: '#fff' }}
          >
            <span className="text-[9px]">◆</span>
            Recommended Interventions
          </div>
          <ul className="space-y-1">
            {interventions.map((line, i) => (
              <li key={i} className="flex gap-1.5 text-[11.5px] text-[#0F172A] leading-snug">
                <span className="text-[8px] mt-1 flex-shrink-0" style={{ color: tierColor }}>◆</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* --- Layer 7: Listings — single parent heading over the 3 sequential lists --- */}
      <div className="mb-1">
        <div className="flex items-center gap-2 mb-1.5 mt-1">
          <div className="h-[1px] flex-1 bg-[#E2E8F0]" />
          <div className="text-[10px] font-semibold tracking-wide text-[#475569]">
            Top Performers Inside Cluster
          </div>
          <div className="h-[1px] flex-1 bg-[#E2E8F0]" />
        </div>
        <div className="rounded-md bg-white border border-[#E2E8F0] overflow-hidden">
          {anchorsDetailed.length > 0 && (
            <DetailSection title="Anchor Destinations">
              <RatedDestList items={anchorsDetailed} initial={3} />
            </DetailSection>
          )}

          {secondaryDetailed.length > 0 && (
            <DetailSection title="Secondary Destinations">
              <RatedDestList items={secondaryDetailed} initial={3} />
            </DetailSection>
          )}

          {supportiveDetailed.length > 0 && (
            <DetailSection title="Supportive Destinations">
              <RatedDestList items={supportiveDetailed} initial={3} />
            </DetailSection>
          )}

          {premiumStaysDetailed.length > 0 && (
            <DetailSection title="Top Premium Stays & Dining" helper="inside polygon">
              <RatedDestList items={premiumStaysDetailed} initial={3} />
            </DetailSection>
          )}
        </div>
      </div>
    </div>
  );
}

// Stay & Dining tier row — shows total + Hotel/Restaurant/Café split chips.
function StayTierRow({
  label,
  accent,
  total,
  counts,
}: {
  label: string;
  accent: string;
  total: number | null;
  counts: { Hotel: number; Restaurant: number; 'Café': number; Other: number } | null;
}) {
  const chips: Array<{ label: string; value: number | string; icon: LucideIcon }> = counts
    ? [
        { label: 'Hotel',      value: counts.Hotel,        icon: Hotel },
        { label: 'Restaurant', value: counts.Restaurant,   icon: Utensils },
        { label: 'Café',       value: counts['Café'],      icon: Coffee },
      ]
    : [
        { label: 'Hotel',      value: 'NA', icon: Hotel },
        { label: 'Restaurant', value: 'NA', icon: Utensils },
        { label: 'Café',       value: 'NA', icon: Coffee },
      ];
  return (
    <div
      className="rounded-md bg-white border border-[#E2E8F0] px-2.5 py-1.5"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11.5px] font-semibold text-[#0F172A]">{label}</span>
        </div>
        <div className="text-[11.5px] font-semibold tabular-nums" style={{ color: accent }}>
          {total == null ? 'NA' : total.toLocaleString()}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {chips.map((c) => {
          const Icon = c.icon;
          return (
            <span
              key={c.label}
              className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] text-[#475569]"
            >
              <Icon className="w-2.5 h-2.5" strokeWidth={2.2} />
              <span>{c.label}</span>
              <span className="tabular-nums text-[#0F172A] font-semibold">{c.value}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Tourist Home tier row — shows only the Airbnb listing count for the cluster.
function TouristHomeRow({
  label,
  accent,
  airbnb,
}: {
  label: string;
  accent: string;
  airbnb: number | null;
}) {
  return (
    <div
      className="rounded-md bg-white border border-[#E2E8F0] px-2.5 py-1.5"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11.5px] font-semibold text-[#0F172A]">{label}</span>
        </div>
        <div className="text-[11.5px] font-semibold tabular-nums" style={{ color: accent }}>
          {airbnb == null ? 'NA' : airbnb.toLocaleString()}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] text-[#475569]">
          <BedDouble className="w-2.5 h-2.5" strokeWidth={2.2} />
          <span>Airbnb</span>
          <span className="tabular-nums text-[#0F172A] font-semibold">
            {airbnb == null ? 'NA' : airbnb.toLocaleString()}
          </span>
        </span>
      </div>
    </div>
  );
}

// Rated destination/stay list — shows Google rating + review count next to each row.
// Used for Anchor / Secondary / Supportive sites and Top Premium Stays & Dining.
function RatedDestList({
  items,
  initial = 3,
}: {
  items: Array<{ name: string; cat: string; rating?: number; n_ratings?: number; score?: number }>;
  initial?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, initial);
  const hidden = items.length - initial;

  return (
    <div>
      {visible.map((x, i) => (
        <div
          key={i}
          className="flex justify-between gap-2 py-1 text-[11.5px] border-b border-dotted border-[#E2E8F0] last:border-b-0"
        >
          <span className="flex-1 text-[#0F172A] leading-snug truncate">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
              style={{ background: CATEGORY_COLORS[x.cat] || '#94A3B8' }}
            />
            {x.name}
          </span>
          <span className="text-[10.5px] text-[#64748B] tabular-nums whitespace-nowrap flex items-center gap-1">
            {typeof x.rating === 'number' ? (
              <>
                <Star className="inline w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                <span className="font-semibold text-[#0F172A]">{x.rating.toFixed(1)}</span>
                <span className="text-[#94A3B8]">
                  · {typeof x.n_ratings === 'number' ? `${x.n_ratings.toLocaleString()} reviews` : 'NA reviews'}
                </span>
              </>
            ) : (
              <span className="text-[#94A3B8]">NA</span>
            )}
          </span>
        </div>
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 flex items-center gap-1 text-[10.5px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
        >
          {expanded
            ? (<>Show less <ChevronUp className="w-3 h-3" /></>)
            : (<>Show more <span className="text-[#94A3B8] font-normal">({hidden})</span> <ChevronDown className="w-3 h-3" /></>)
          }
        </button>
      )}
    </div>
  );
}

function DetailSection({ title, helper, children }: { title: string; helper?: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 border-t border-[#E2E8F0]">
      <div className="text-[11px] font-semibold text-[#475569] mb-1.5">
        {title}
        {helper && (
          <span className="ml-1 font-normal text-[10px] text-[#94A3B8]">{helper}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function DestList({ items, max }: { items: any[]; max: number }) {
  return (
    <div>
      {items.slice(0, max).map((x, i) => (
        <div key={i} className="flex justify-between gap-2 py-1 text-[11.5px] border-b border-dotted border-[#E2E8F0] last:border-b-0">
          <span className="flex-1 text-[#0F172A] leading-snug truncate">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
              style={{ background: CATEGORY_COLORS[x.cat] || '#94A3B8' }}
            />
            {x.name}
          </span>
          <span className="text-[10.5px] text-[#64748B] tabular-nums whitespace-nowrap">
            {x.score ? <><Star className="inline w-2.5 h-2.5 fill-amber-500 text-amber-500 -mt-0.5"/> {x.score.toFixed(1)}</> : '—'}
          </span>
        </div>
      ))}
      {items.length > max && (
        <div className="py-1 italic text-[10.5px] text-[#94A3B8]">
          …and {items.length - max} more
        </div>
      )}
    </div>
  );
}

// Destination list that shows `initial` rows by default and expands to the
// full list when the user clicks "Show more". Used by the cluster detail card.
function CollapsibleDestList({ items, initial = 3 }: { items: any[]; initial?: number }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, initial);
  const hidden = items.length - initial;

  return (
    <div>
      {visible.map((x, i) => (
        <div
          key={i}
          className="flex justify-between gap-2 py-1 text-[11.5px] border-b border-dotted border-[#E2E8F0] last:border-b-0"
        >
          <span className="flex-1 text-[#0F172A] leading-snug truncate">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
              style={{ background: CATEGORY_COLORS[x.cat] || '#94A3B8' }}
            />
            {x.name}
          </span>
          <span className="text-[10.5px] text-[#64748B] tabular-nums whitespace-nowrap">
            {x.score
              ? (<><Star className="inline w-2.5 h-2.5 fill-amber-500 text-amber-500 -mt-0.5"/> {x.score.toFixed(1)}</>)
              : '—'}
          </span>
        </div>
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 flex items-center gap-1 text-[10.5px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
        >
          {expanded
            ? (<>Show less <ChevronUp className="w-3 h-3" /></>)
            : (<>Show more <span className="text-[#94A3B8] font-normal">({hidden})</span> <ChevronDown className="w-3 h-3" /></>)
          }
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cluster hazard exposure (Heat Stress / Flood / Sinkhole)
// ---------------------------------------------------------------------------

const HAZARD_META: Array<{ key: 'heat_stress' | 'flood' | 'sinkhole'; label: string; accent: string }> = [
  { key: 'heat_stress', label: HAZARD_TOKENS.heat.label,     accent: HAZARD_TOKENS.heat.accent },
  { key: 'flood',       label: HAZARD_TOKENS.flood.label,    accent: HAZARD_TOKENS.flood.accent },
  { key: 'sinkhole',    label: HAZARD_TOKENS.sinkhole.label, accent: HAZARD_TOKENS.sinkhole.accent },
];

function ClusterHazardExposure({ clusterId, tierColor }: { clusterId: number; tierColor: string }) {
  const { data, loading, error, refetch } = useClusterHazards(clusterId);

  return (
    <DetailSection
      title="Hazard Exposure"
      helper={data ? `${data.land_area_km2.toFixed(2)} km² land` : undefined}
    >
      {loading && (
        <div className="text-[11px] text-[#94A3B8]">Computing exposure…</div>
      )}
      {error && (
        <div className="text-[11px] text-rose-600 flex items-center gap-2">
          <span>Could not load hazard data ({error}).</span>
          <button
            type="button"
            onClick={refetch}
            className="px-1.5 py-0.5 text-[10.5px] font-semibold rounded border border-rose-300 text-rose-700 hover:bg-rose-50"
          >
            Retry
          </button>
        </div>
      )}
      {data && (
        <div className="space-y-1.5">
          {HAZARD_META.map((h) => (
            <HazardRow
              key={h.key}
              label={h.label}
              accent={h.accent}
              summary={data.hazards[h.key]}
              fallbackColor={tierColor}
            />
          ))}
        </div>
      )}
    </DetailSection>
  );
}

function HazardRow({
  label,
  accent,
  summary,
  fallbackColor,
}: {
  label: string;
  accent: string;
  summary: HazardSummary;
  fallbackColor: string;
}) {
  if (!summary?.available) {
    return (
      <div
        className="rounded-md bg-white border border-[#E2E8F0] px-2.5 py-2 flex items-center justify-between"
        style={{ borderLeft: `3px solid ${accent}` }}
      >
        <span className="text-[12px] font-semibold text-[#0F172A]">{label}</span>
        <span className="text-[10px] text-[#94A3B8] tracking-wide">No data</span>
      </div>
    );
  }

  const pct = summary.headline_pct ?? 0;
  const breakdown = summary.breakdown ?? [];

  return (
    <div
      className="rounded-md bg-white border border-[#E2E8F0] px-2.5 py-2"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      {/* Header row — label, headline % */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11.5px] font-semibold text-[#0F172A] truncate">{label}</span>
        </div>
        <div className="text-right leading-none flex-shrink-0">
          <div className="text-[12px] font-semibold tabular-nums" style={{ color: accent }}>
            {pct.toFixed(1)}%
          </div>
          <div className="text-[9px] text-[#94A3B8] mt-0.5">high + extreme</div>
        </div>
      </div>

      {/* Stacked segment bar */}
      <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden flex">
        {breakdown.map((b, i) => (
          <div
            key={i}
            className="h-full"
            style={{
              width: `${Math.max(0, Math.min(100, b.pct))}%`,
              background: b.color || fallbackColor,
            }}
            title={`${b.class}: ${b.pct.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Legend chips */}
      <div className="flex flex-wrap gap-1 mt-1.5">
        {breakdown.map((b, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] text-[#475569]"
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: b.color || fallbackColor }}
            />
            <span>{b.class}</span>
            <span className="tabular-nums text-[#94A3B8]">{b.pct.toFixed(1)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export function TourismAnalyticsPanel({ selectedLguName, activeLayerId, activeHazardLayerId }: { selectedLguName?: string | null; activeLayerId?: string | null; activeHazardLayerId?: string | null } = {}) {
  const { sites, assets, clusters, accommodationsBooking, loading, error } = useTourismData();
  const { data: hazardRows } = useClusterHazardsSummary();
  const { lgu, selectedClusterId } = useTourismUI();

  // Resolve effective LGU filter — header prop takes priority, then internal store.
  const normLgu = (v?: string | null): string | null => {
    if (!v) return null;
    const t = String(v).trim();
    if (!t || t.toLowerCase() === 'all' || t === 'All LGUs') return null;
    return t;
  };
  const lguFilter = normLgu(selectedLguName) ?? normLgu(lgu);

  const stats = useMemo(() => {
    if (!sites || !assets) return null;

    const matchLgu = (p: any) => !lguFilter || p?.lgu === lguFilter;

    const tierCounts: Record<string, number> = { Anchor: 0, Secondary: 0, Supportive: 0 };
    const catCounts: Record<string, number> = {};
    for (const cat of CAT_ORDER) catCounts[cat] = 0;

    let topScore = 0;
    let topName = '—';
    let siteTotal = 0;
    for (const f of sites.features) {
      const p = f.properties || {};
      if (!matchLgu(p)) continue;
      siteTotal++;
      if (p.perf_tier && p.perf_tier in tierCounts) tierCounts[p.perf_tier]++;
      if (p.site_cat && p.site_cat in catCounts) catCounts[p.site_cat]++;
      if (typeof p.perf_score === 'number' && p.perf_score > topScore) {
        topScore = p.perf_score;
        topName = p.name || '—';
      }
    }

    const assetCounts: Record<string, number> = { Premium: 0, Quality: 0 };
    const assetCatCounts: Record<string, number> = { Hotel: 0, Restaurant: 0, 'Café': 0 };
    let assetTotal = 0;
    for (const f of assets.features) {
      const p = f.properties || {};
      if (!matchLgu(p)) continue;
      assetTotal++;
      const t = p.asset_tier;
      if (t && t in assetCounts) assetCounts[t]++;
      const cat: string = p.asset_cat || '';
      if (cat.startsWith('Hotel'))      assetCatCounts.Hotel++;
      else if (cat.startsWith('Restaurant')) assetCatCounts.Restaurant++;
      else if (cat.startsWith('Cafe') || cat.startsWith('Café')) assetCatCounts['Café']++;
    }

    let clusterTotal = 0;
    const clusterTierCounts: Record<string, number> = { Primary: 0, Emerging: 0, Satellite: 0 };
    if (clusters?.features) {
      for (const f of clusters.features) {
        const p = f.properties || {};
        if (!matchLgu(p)) continue;
        clusterTotal++;
        const t = p.tier;
        if (t && t in clusterTierCounts) clusterTierCounts[t]++;
      }
    }

    // Tourist Home (Airbnb) count — filtered by selected LGU when applicable.
    // Airbnb features have no `lgu` field; derive it from address/name text.
    const inferAirbnbLgu = (props: any): string | null => {
      const blob = `${props?.address || ''} ${props?.name || ''}`.toLowerCase();
      if (blob.includes('tagbilaran')) return 'Tagbilaran City';
      if (blob.includes('dauis'))      return 'Dauis';
      if (blob.includes('panglao'))    return 'Panglao';
      return null;
    };
    let airbnbTotal = 0;
    if (accommodationsBooking?.features) {
      for (const f of accommodationsBooking.features as any[]) {
        const p = f.properties || {};
        const featLgu = p.lgu ?? inferAirbnbLgu(p);
        if (lguFilter && featLgu !== lguFilter) continue;
        airbnbTotal++;
      }
    }

    const activeCats = CAT_ORDER.filter(c => (catCounts[c] || 0) > 0).length;

    const donutData = CAT_ORDER
      .map(c => ({ name: c, value: catCounts[c] || 0, color: CATEGORY_COLORS[c] || '#94A3B8' }))
      .filter(d => d.value > 0);

    return {
      tierCounts,
      catCounts,
      assetCounts,
      assetCatCounts,
      totalSites: siteTotal,
      totalAssets: assetTotal,
      totalClusters: clusterTotal,
      clusterTierCounts,
      topScore,
      topName,
      activeCats,
      donutData,
      airbnbTotal,
    };
  }, [sites, assets, clusters, accommodationsBooking, lguFilter]);

  // Clusters with high climate hazard: any hazard headline % >= 25%.
  const HIGH_HAZARD_THRESHOLD = 25;
  const highHazardCount = useMemo(() => {
    if (!hazardRows) return null;
    return hazardRows.filter(
      (r) =>
        (!lguFilter || r.lgu === lguFilter) &&
        (r.heat_pct >= HIGH_HAZARD_THRESHOLD ||
          r.flood_pct >= HIGH_HAZARD_THRESHOLD ||
          r.sinkhole_pct >= HIGH_HAZARD_THRESHOLD)
    ).length;
  }, [hazardRows, lguFilter]);

  // Per-hazard counts of clusters above the high-hazard threshold.
  const hazardHighCounts = useMemo(() => {
    const z = { heat: 0, flood: 0, sinkhole: 0 };
    if (!hazardRows) return z;
    for (const r of hazardRows) {
      if (lguFilter && r.lgu !== lguFilter) continue;
      if (r.heat_pct     >= HIGH_HAZARD_THRESHOLD) z.heat++;
      if (r.flood_pct    >= HIGH_HAZARD_THRESHOLD) z.flood++;
      if (r.sinkhole_pct >= HIGH_HAZARD_THRESHOLD) z.sinkhole++;
    }
    return z;
  }, [hazardRows, lguFilter]);

  if (loading) {
    return (
      <div
        className="px-4 py-3 text-[12px] text-[#64748B]"
        style={{ fontFamily: FONT }}
      >
        Loading tourism analytics…
      </div>
    );
  }
  if (error || !stats) {
    return (
      <div
        className="px-4 py-3 text-[12px] text-rose-600"
        style={{ fontFamily: FONT }}
      >
        Failed to load tourism data.
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-full" style={{ fontFamily: FONT }}>
      {/* 1. Header — compact, modern */}
      <div className="px-3.5 py-2 bg-gradient-to-r from-white to-[#F0FDFA] border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br from-[#CCFBF1] to-[#A7F3D0] border border-[#0F766E]/25 shadow-sm flex-shrink-0">
            <MapPin className="w-3 h-3 text-[#0F766E]" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold text-[#0F172A] leading-tight tracking-tight">
              Tourism Analytics
            </div>
            <div className="text-[10px] text-[#64748B] mt-0.5 leading-tight">
              {lguFilter ?? 'Tagbilaran · Dauis · Panglao'}
            </div>
          </div>
        </div>
      </div>

      {/* Cluster detail (only when a cluster is selected) */}
      <ClusterDetailSection />

      {/* When a cluster is selected, hide the global Tourism Analytics blocks below
          (per spec — nothing should render under the cluster's "Top Premium Stays & Dining"). */}
      {selectedClusterId == null && (<>
      {/* 2. KPI grid — modern card design */}
      <div className="px-3 pt-3 pb-1.5 grid grid-cols-2 gap-1.5">
        <StatCard
          icon={MapPin}
          label="Tourism Sites"
          value={stats.totalSites.toLocaleString()}
          captionItems={[
            { label: 'Anchor',     value: stats.tierCounts.Anchor },
            { label: 'Secondary',  value: stats.tierCounts.Secondary },
            { label: 'Supportive', value: stats.tierCounts.Supportive },
          ]}
          accent="#E07A18"
          tint="#FFF7ED"
        />
        <StatCard
          icon={BedDouble}
          label="Stays and Dining"
          value={(stats.totalAssets + (stats.airbnbTotal || 0)).toLocaleString()}
          captionItems={[
            { label: 'Hotels',        value: stats.assetCatCounts.Hotel },
            { label: 'Restaurants',   value: stats.assetCatCounts.Restaurant },
            { label: 'Cafés',         value: stats.assetCatCounts['Café'] },
            { label: 'Tourist Homes', value: stats.airbnbTotal || 0 },
          ]}
          accent="#6D28D9"
          tint="#F5F3FF"
        />
        <StatCard
          icon={Layers}
          label="Tourism Clusters"
          value={stats.totalClusters.toLocaleString()}
          captionItems={[
            { label: 'Primary',   value: stats.clusterTierCounts.Primary },
            { label: 'Emerging',  value: stats.clusterTierCounts.Emerging },
            { label: 'Satellite', value: stats.clusterTierCounts.Satellite },
          ]}
          accent="#2563EB"
          tint="#EFF6FF"
        />
        <StatCard
          icon={AlertTriangle}
          label="High Hazard"
          value={highHazardCount == null ? '…' : `${highHazardCount}/${stats.totalClusters}`}
          captionItems={[
            { label: 'Heat',     value: hazardHighCounts.heat },
            { label: 'Flood',    value: hazardHighCounts.flood },
            { label: 'Sinkhole', value: hazardHighCounts.sinkhole },
          ]}
          accent="#DC2626"
          tint="#FEF2F2"
        />
      </div>

      {/* 3. Climate hazards across clusters */}
      <ClimateHazardsCallout
        rows={hazardRows}
        lguFilter={lguFilter}
        totalClusters={stats.totalClusters}
      />

      {/* 4. Site distribution — vertical bar chart */}
      <div className="px-3 pt-1 pb-3">
        <div className="rounded-lg bg-white border border-[#E2E8F0] px-3 pt-2.5 pb-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-[12px] font-semibold text-[#0F172A]">
              Tourism Site Distribution
            </div>
            <div className="text-[10px] text-[#94A3B8] tabular-nums">
              {stats.totalSites.toLocaleString()} sites
            </div>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.donutData}
                margin={{ top: 14, right: 6, left: -18, bottom: 0 }}
                barCategoryGap="22%"
              >
                <defs>
                  {stats.donutData.map((d) => (
                    <linearGradient key={d.name} id={`bar-${d.name.replace(/\W+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={d.color} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={d.color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9.5, fill: '#64748B', fontFamily: FONT }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  interval={0}
                  tickFormatter={(v: string) => CAT_META[v]?.short || String(v)}
                />
                <YAxis
                  tick={{ fontSize: 9.5, fill: '#94A3B8', fontFamily: FONT }}
                  tickLine={false}
                  axisLine={false}
                  width={24}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: 6,
                    fontSize: 11,
                    fontFamily: FONT,
                    color: '#0F172A',
                    boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                  }}
                  formatter={(value: number, _name, item: any) => [
                    `${value} sites (${stats.totalSites > 0 ? ((value / stats.totalSites) * 100).toFixed(1) : '0'}%)`,
                    item?.payload?.name,
                  ]}
                  labelFormatter={() => ''}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    style={{ fontSize: 10, fill: '#0F172A', fontFamily: FONT, fontWeight: 700 }}
                  />
                  {stats.donutData.map((d) => (
                    <Cell key={d.name} fill={`url(#bar-${d.name.replace(/\W+/g, '')})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Hospitality */}
      <div className="px-3 pb-3">
        <SectionLabel>Stays and Dining</SectionLabel>
        <div className="space-y-1.5">
          {(() => {
            const stayTotal = (stats.totalAssets || 0) + (stats.airbnbTotal || 0);
            return (
              <>
                <CategoryRow
                  label="Premium Stays & Dining"
                  count={stats.assetCounts.Premium || 0}
                  total={stayTotal}
                  color="#6D28D9"
                />
                <CategoryRow
                  label="Quality Stays & Dining"
                  count={stats.assetCounts.Quality || 0}
                  total={stayTotal}
                  color="#A78BFA"
                />
                <CategoryRow
                  label="Tourist Home"
                  count={stats.airbnbTotal || 0}
                  total={stayTotal}
                  color="#94A3B8"
                />
              </>
            );
          })()}
        </div>
      </div>
      </>)}
    </div>
  );
}
