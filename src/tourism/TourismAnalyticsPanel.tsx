// Tourism Analytics Panel — right-side analytics for the Tourism dashboard.
// Typography matches the left drawer / TourismInsightsPanel:
//   font: DM Sans, eyebrow = 9px bold uppercase tracking-[0.16em],
//   titles = 12.5px font-semibold, body = 12px, muted = #64748B / #94A3B8.

import React, { useMemo, useState } from 'react';
import { MapPin, X, Star, Landmark, BedDouble, Layers, AlertTriangle, Umbrella, Fish, Mountain, Church, Trees, ChevronDown, ChevronUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList, PieChart, Pie } from 'recharts';
import { useTourismData } from './TourismContext';
import { useTourismUI } from './tourismStore';
import { useClusterHazards } from './useClusterHazards';
import { useClusterHazardsSummary } from './useClusterHazardsSummary';
import { useHazardLayerBreakdown } from './useHazardLayerBreakdown';
import type { HazardSummary } from './useClusterHazards';
import { CATEGORY_COLORS, TIER_COLORS } from './styles';
import { TOURISM_INTERVENTIONS } from '../config/tourismConfig';
import { geoserverLayers } from '../config/geoserverLayers';
import { ENVIRONMENTAL_LAYERS } from '../config/environmentalLayers';

const FONT = 'DM Sans, Segoe UI, sans-serif';

const TIER_ORDER = ['Anchor', 'Secondary', 'Supportive'] as const;
const TIER_ACCENT: Record<typeof TIER_ORDER[number], string> = {
  Anchor:     TIER_COLORS.Primary.stroke,    // #E07A18
  Secondary:  TIER_COLORS.Emerging.stroke,   // #C2185B
  Supportive: TIER_COLORS.Satellite.stroke,  // #0891B2
};

const CAT_ORDER = [
  'Beach',
  'Marine',
  'Nature / Viewpoint',
  'Heritage',
  'Faith',
  'Urban Park',
] as const;

// Category icon + short label (matches the left tourism directory)
const CAT_META: Record<string, { icon: LucideIcon; short: string }> = {
  'Beach':              { icon: Umbrella, short: 'Beach' },
  'Marine':             { icon: Fish,     short: 'Marine' },
  'Nature / Viewpoint': { icon: Mountain, short: 'Nature' },
  'Heritage':           { icon: Landmark, short: 'Heritage' },
  'Faith':              { icon: Church,   short: 'Faith' },
  'Urban Park':         { icon: Trees,    short: 'Urban' },
};

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
  accent,
  tint,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  caption: string;
  accent: string;
  tint: string;
}) {
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
      <div className="text-[10px] text-[#64748B] mt-1 truncate">{caption}</div>
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
      className="rounded-md bg-white border border-[#E2E8F0] px-2.5 py-2"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          <span className="text-[12.5px] font-semibold text-[#0F172A] truncate">{label}</span>
        </div>
        <div className="flex items-baseline gap-1.5 flex-shrink-0">
          <span className="text-[12.5px] font-semibold text-[#0F172A] tabular-nums">
            {count.toLocaleString()}
          </span>
          <span className="text-[10px] tabular-nums" style={{ color }}>
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
// Active layers callout — small pill list of currently-visible map layers
// ---------------------------------------------------------------------------

function ActiveLayersCallout() {
  const ui = useTourismUI();
  const items: Array<{ label: string; color: string }> = [];
  if (ui.showAnchor)            items.push({ label: 'Anchor sites',      color: '#1F2738' });
  if (ui.showSecondary)         items.push({ label: 'Secondary sites',   color: '#4A4137' });
  if (ui.showSupportive)        items.push({ label: 'Supportive sites',  color: '#7E7567' });
  if (ui.showPremium)           items.push({ label: 'Premium hospitality', color: '#7C3AED' });
  if (ui.showQuality)           items.push({ label: 'Quality hospitality', color: '#A78BFA' });
  if (ui.showClusterPrimary)    items.push({ label: 'Primary clusters',   color: TIER_COLORS.Primary.stroke });
  if (ui.showClusterEmerging)   items.push({ label: 'Emerging clusters',  color: TIER_COLORS.Emerging.stroke });
  if (ui.showClusterSatellite)  items.push({ label: 'Satellite clusters', color: TIER_COLORS.Satellite.stroke });

  return (
    <div className="px-3 pb-1">
      <div className="rounded-lg bg-white border border-[#E2E8F0] px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-[11px] font-semibold text-[#0F172A]">
            Active layers
          </div>
          <div className="text-[10px] text-[#94A3B8] tabular-nums">
            {items.length}
          </div>
        </div>
        {items.length === 0 ? (
          <div className="text-[10.5px] text-[#94A3B8]">No layers visible</div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {items.map((it) => (
              <span
                key={it.label}
                className="inline-flex items-center gap-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.5 text-[10px] text-[#334155]"
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: it.color }}
                />
                {it.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const TIER_BG: Record<string, string> = {
  Primary: '#E07A18', Emerging: '#C2185B', Satellite: '#0891B2',
};

// CWIS hazard layers (storm surge, flood, urban waterlogging) are not in
// `geoserverLayers` — they are handled separately in MapCanvas via
// `getCWISLayerConfig`. Mirror the mapping here so the analytics pie can
// resolve them to their full WFS layer names and display titles.
const CWIS_HAZARD_LAYERS: Record<string, { name: string; layer: string }> = {
  storm_surge:        { name: 'Storm Surge',        layer: 'WorldBank_Bohol:StormSurge' },
  flood_hazard:       { name: 'Flood Hazard',       layer: 'WorldBank_Bohol:Flood_Hazard' },
  urban_waterlogging: { name: 'Urban Waterlogging', layer: 'WorldBank_Bohol:Urban_Waterlogging' },
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
        <div className="text-[12.5px] font-semibold text-[#0F172A] mb-1.5 text-center">
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
  const { clusters, getMembershipFor } = useTourismData();
  const ui = useTourismUI();

  const cluster = ui.selectedClusterId != null
    ? clusters?.features.find((f: any) => f.properties.cluster_id === ui.selectedClusterId)
    : undefined;
  const mem = ui.selectedClusterId != null ? getMembershipFor(ui.selectedClusterId) : undefined;

  if (!cluster || !mem) return null;
  const p: any = cluster.properties;
  const landKm2 = p.area_land ?? p.area_km2;
  const interventions = TOURISM_INTERVENTIONS[p.tier] || TOURISM_INTERVENTIONS.Satellite;
  const tierColor = TIER_BG[p.tier] || '#64748B';

  const nAnchor = Number(p.n_anchor || 0);
  const nOther  = Number(p.n_sec  || 0) + Number(p.n_supp || 0);
  const nHosp   = Number(p.n_prem || 0) + Number(p.n_qual || 0);
  const landStr = typeof landKm2 === 'number' ? `${landKm2.toFixed(2)}` : (landKm2 ?? '—');

  return (
    <div className="px-3 pt-3 pb-2">
      {/* Section heading — "Cluster Assessment" title with cluster name below */}
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-wide text-[#475569]">
            Cluster Assessment
          </div>
          <div
            className="text-[12.5px] font-semibold text-[#0F172A] truncate mt-0.5"
            title={p.name}
          >
            {p.name}
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

      {/* Meta row — tier badge + priority + LGU + potential */}
      <div className="flex items-center flex-wrap gap-1.5 mb-2 text-[10.5px] text-[#64748B]">
        <span
          className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
          style={{ background: tierColor }}
        >
          {p.tier}
        </span>
        {p.priority && <span>Priority P{p.priority}</span>}
        {p.lgu && <><span className="text-[#CBD5E1]">·</span><span>{p.lgu}</span></>}
        {mem.potential_score != null && (
          <><span className="text-[#CBD5E1]">·</span><span>Potential {mem.potential_score.toFixed(1)}</span></>
        )}
      </div>

      {/* KPI grid — same StatCard style as main panel */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <StatCard
          icon={Star}
          label="Anchor Tourist Sites"
          value={nAnchor.toLocaleString()}
          caption="Headline destinations"
          accent="#D97706"
          tint="#FEF3C7"
        />
        <StatCard
          icon={MapPin}
          label="Other Sites"
          value={nOther.toLocaleString()}
          caption="Secondary · Supportive"
          accent="#0EA5E9"
          tint="#E0F2FE"
        />
        <StatCard
          icon={BedDouble}
          label="Hospitality and F&B"
          value={nHosp.toLocaleString()}
          caption="Premium · Quality"
          accent="#6D28D9"
          tint="#F5F3FF"
        />
        <StatCard
          icon={Mountain}
          label="Land Area"
          value={landStr === '—' ? '—' : `${landStr}`}
          caption="Square kilometres (km²)"
          accent="#16A34A"
          tint="#DCFCE7"
        />
      </div>

      {/* Detail card — holds destinations, hazards, interventions */}
      <div className="rounded-md bg-white border border-[#E2E8F0] overflow-hidden">
        {mem.anchors.length > 0 && (
          <DetailSection title="Anchor Destinations">
            <CollapsibleDestList items={mem.anchors} initial={3} />
          </DetailSection>
        )}

        {mem.secondary.length > 0 && (
          <DetailSection title="Secondary Destinations">
            <CollapsibleDestList items={mem.secondary} initial={3} />
          </DetailSection>
        )}

        {mem.premium && mem.premium.length > 0 && (
          <DetailSection title="Top Premium Hospitality" helper="inside polygon">
            <CollapsibleDestList
              items={[...mem.premium].sort((a, b) => (b.score || 0) - (a.score || 0))}
              initial={3}
            />
          </DetailSection>
        )}

        {/* Hazard exposure */}
        <ClusterHazardExposure clusterId={p.cluster_id} tierColor={tierColor} />

        {/* Interventions */}
        <DetailSection title="Recommended Interventions">
          <ul className="space-y-1">
            {interventions.map((line, i) => (
              <li key={i} className="flex gap-1.5 text-[11.5px] text-[#475569] leading-snug">
                <span className="text-[8px] mt-1 flex-shrink-0" style={{ color: tierColor }}>◆</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </DetailSection>
      </div>
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
  { key: 'heat_stress', label: 'Heat Stress', accent: '#D97706' },
  { key: 'flood',       label: 'Flood Risk',  accent: '#0EA5E9' },
  { key: 'sinkhole',    label: 'Sinkhole',    accent: '#7C3AED' },
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
  const dominant = summary.dominant_class ?? '—';
  const breakdown = summary.breakdown ?? [];

  return (
    <div
      className="rounded-md bg-white border border-[#E2E8F0] px-2.5 py-2"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      {/* Header row — label, dominant chip, headline % */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12px] font-semibold text-[#0F172A] truncate">{label}</span>
          {dominant !== '—' && (
            <span
              className="text-[9.5px] tracking-wide font-semibold px-1.5 py-[1px] rounded"
              style={{ background: accent + '1A', color: accent }}
            >
              {dominant}
            </span>
          )}
        </div>
        <div className="text-right leading-none flex-shrink-0">
          <div className="text-[13.5px] font-semibold tabular-nums" style={{ color: accent }}>
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
  const { sites, assets, clusters, loading, error } = useTourismData();
  const { data: hazardRows } = useClusterHazardsSummary();
  const { lgu } = useTourismUI();

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
    let assetTotal = 0;
    for (const f of assets.features) {
      const p = f.properties || {};
      if (!matchLgu(p)) continue;
      assetTotal++;
      const t = p.asset_tier;
      if (t && t in assetCounts) assetCounts[t]++;
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

    const activeCats = CAT_ORDER.filter(c => (catCounts[c] || 0) > 0).length;

    const donutData = CAT_ORDER
      .map(c => ({ name: c, value: catCounts[c] || 0, color: CATEGORY_COLORS[c] || '#94A3B8' }))
      .filter(d => d.value > 0);

    return {
      tierCounts,
      catCounts,
      assetCounts,
      totalSites: siteTotal,
      totalAssets: assetTotal,
      totalClusters: clusterTotal,
      clusterTierCounts,
      topScore,
      topName,
      activeCats,
      donutData,
    };
  }, [sites, assets, clusters, lguFilter]);

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
            <div className="text-[13px] font-semibold text-[#0F172A] leading-tight tracking-tight">
              Tourism Analytics
            </div>
            <div className="text-[10.5px] text-[#64748B] mt-0.5 leading-tight">
              {lguFilter ?? 'Tagbilaran · Dauis · Panglao'}
            </div>
          </div>
        </div>
      </div>

      {/* Cluster detail (only when a cluster is selected) */}
      <ClusterDetailSection />

      {/* 2. KPI grid — modern card design */}
      <div className="px-3 pt-3 pb-2 grid grid-cols-2 gap-2">
        <StatCard
          icon={MapPin}
          label="Tourism Sites"
          value={stats.totalSites.toLocaleString()}
          caption="Anchor · Secondary · Supportive"
          accent="#E07A18"
          tint="#FFF7ED"
        />
        <StatCard
          icon={BedDouble}
          label="Hospitality & F&B"
          value={stats.totalAssets.toLocaleString()}
          caption="Hotels · Restaurants · Cafés"
          accent="#6D28D9"
          tint="#F5F3FF"
        />
        <StatCard
          icon={Layers}
          label="Tourism Clusters"
          value={stats.totalClusters.toLocaleString()}
          caption="Primary · Emerging · Satellite"
          accent="#2563EB"
          tint="#EFF6FF"
        />
        <StatCard
          icon={AlertTriangle}
          label="High Climate Hazard"
          value={highHazardCount == null ? '…' : `${highHazardCount}/${stats.totalClusters}`}
          caption="Heat · Flood · Sinkhole ≥ 25%"
          accent="#DC2626"
          tint="#FEF2F2"
        />
      </div>

      {/* 3. Active layers callout */}
      <ActiveLayersCallout />

      {/* 4. Site distribution — vertical bar chart */}
      <div className="px-3 pt-1 pb-3">
        <div className="rounded-lg bg-white border border-[#E2E8F0] px-3 pt-2.5 pb-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-[12.5px] font-semibold text-[#0F172A]">
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
        <SectionLabel>Hospitality Stock</SectionLabel>
        <div className="space-y-1.5">
          <CategoryRow
            label="Premium"
            count={stats.assetCounts.Premium || 0}
            total={stats.totalAssets}
            color="#6D28D9"
          />
          <CategoryRow
            label="Quality"
            count={stats.assetCounts.Quality || 0}
            total={stats.totalAssets}
            color="#A78BFA"
          />
        </div>
      </div>

      {/* 6. Hazard distribution — only when a Climate & Hazard layer is on */}
      <HazardDistributionPie activeLayerId={activeLayerId} activeHazardLayerId={activeHazardLayerId} />
    </div>
  );
}
