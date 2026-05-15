// Tourism Analytics Panel — right-side analytics for the Tourism dashboard.
// Typography matches the left drawer / TourismInsightsPanel:
//   font: DM Sans, eyebrow = 9px bold uppercase tracking-[0.16em],
//   titles = 12.5px font-semibold, body = 12px, muted = #64748B / #94A3B8.

import React, { useMemo } from 'react';
import { MapPin, X, Star } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTourismData } from './TourismContext';
import { useTourismUI } from './tourismStore';
import { CATEGORY_COLORS, TIER_COLORS } from './styles';
import { TOURISM_INTERVENTIONS } from '../config/tourismConfig';

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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  caption,
  accent,
}: {
  label: string;
  value: string;
  caption: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-md bg-white border border-[#E2E8F0] px-2.5 py-2"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="text-[11px] font-medium text-[#64748B]">
        {label}
      </div>
      <div className="text-[16px] font-semibold text-[#0F172A] leading-tight mt-0.5 tabular-nums">
        {value}
      </div>
      <div className="text-[10px] text-[#94A3B8] mt-0.5 truncate">{caption}</div>
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
// Cluster detail (rendered above KPIs when a cluster is selected)
// ---------------------------------------------------------------------------

const TIER_BG: Record<string, string> = {
  Primary: '#E07A18', Emerging: '#C2185B', Satellite: '#0891B2',
};

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
  const waterKm2 = p.area_water;
  const interventions = TOURISM_INTERVENTIONS[p.tier] || TOURISM_INTERVENTIONS.Satellite;
  const tierColor = TIER_BG[p.tier] || '#64748B';

  const counts = [
    { n: p.n_anchor, l: 'Anchors' },
    { n: p.n_sec,    l: 'Secondary' },
    { n: p.n_supp,   l: 'Supportive' },
    { n: p.n_prem,   l: 'Premium' },
    { n: p.n_qual,   l: 'Quality' },
    { n: typeof landKm2 === 'number' ? landKm2.toFixed(2) : landKm2, l: 'Land km²' },
  ];

  return (
    <div className="px-3 pt-3 pb-2">
      <div className="rounded-md bg-white border border-[#E2E8F0] overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2.5 border-b border-[#E2E8F0] relative" style={{ borderLeft: `3px solid ${tierColor}` }}>
          <button
            onClick={() => ui.setSelectedClusterId(null)}
            className="absolute top-1.5 right-1.5 text-[#94A3B8] hover:text-[#0F172A] transition-colors p-1"
            aria-label="Close cluster detail"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
              style={{ background: tierColor }}
            >
              {p.tier}
            </span>
            {p.priority && (
              <span className="text-[10px] text-[#64748B]">· Priority P{p.priority}</span>
            )}
          </div>
          <div className="text-[13px] font-semibold text-[#0F172A] leading-tight pr-6">
            {p.name}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            {p.lgu}{typeof landKm2 === 'number' ? ` · ${landKm2.toFixed(2)} km² land` : ''}
            {mem.potential_score != null && ` · Potential ${mem.potential_score.toFixed(1)}`}
          </div>
        </div>

        {/* Counts grid */}
        <div className="grid grid-cols-3">
          {counts.map((s, i) => (
            <div
              key={i}
              className={`px-2 py-2 text-center ${i % 3 !== 2 ? 'border-r' : ''} ${i < 3 ? 'border-b' : ''} border-[#E2E8F0]`}
            >
              <div className="text-[15px] font-semibold text-[#0F172A] leading-none tabular-nums">{s.n}</div>
              <div className="text-[10px] text-[#64748B] mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Marine area */}
        {waterKm2 != null && waterKm2 >= 0.1 && (
          <div className="px-3 py-2 border-t border-[#E2E8F0] text-[11px] text-[#475569]" style={{ borderLeft: '3px solid #0891B2' }}>
            <span className="font-semibold text-[#0891B2]">Marine area:</span> {waterKm2.toFixed(2)} km² ({p.pct_water}% of polygon)
          </div>
        )}

        {/* Anchors */}
        {mem.anchors.length > 0 && (
          <DetailSection title="Anchor Destinations">
            <DestList items={mem.anchors} max={8} />
          </DetailSection>
        )}

        {/* Secondary */}
        {mem.secondary.length > 0 && (
          <DetailSection title="Secondary Destinations">
            <DestList items={mem.secondary} max={8} />
          </DetailSection>
        )}

        {/* Premium */}
        {mem.premium && mem.premium.length > 0 && (
          <DetailSection title="Top Premium Hospitality" helper="inside polygon">
            <DestList
              items={[...mem.premium].sort((a, b) => (b.score || 0) - (a.score || 0))}
              max={6}
            />
          </DetailSection>
        )}

        {/* Photo gallery removed */}

        {/* Barangay coverage */}
        {mem.barangays && mem.barangays.length > 0 && (
          <DetailSection title="Barangay Coverage">
            {mem.barangays.map((b, i) => (
              <div key={i} className="mb-1.5 last:mb-0">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#0F172A]">{b.brgy}</span>
                  <span className="text-[10px] text-[#64748B] tabular-nums">
                    {b.pct}%{b.pop_2024 ? ` · ${Number(b.pop_2024).toLocaleString()}` : ''}
                  </span>
                </div>
                <div className="h-1 bg-[#F1F5F9] mt-0.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: tierColor }} />
                </div>
              </div>
            ))}
          </DetailSection>
        )}

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

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export function TourismAnalyticsPanel() {
  const { sites, assets, loading, error } = useTourismData();

  const stats = useMemo(() => {
    if (!sites || !assets) return null;

    const tierCounts: Record<string, number> = { Anchor: 0, Secondary: 0, Supportive: 0 };
    const catCounts: Record<string, number> = {};
    for (const cat of CAT_ORDER) catCounts[cat] = 0;

    let topScore = 0;
    let topName = '—';
    for (const f of sites.features) {
      const p = f.properties || {};
      if (p.perf_tier && p.perf_tier in tierCounts) tierCounts[p.perf_tier]++;
      if (p.site_cat && p.site_cat in catCounts) catCounts[p.site_cat]++;
      if (typeof p.perf_score === 'number' && p.perf_score > topScore) {
        topScore = p.perf_score;
        topName = p.name || '—';
      }
    }

    const assetCounts: Record<string, number> = { Premium: 0, Quality: 0 };
    for (const f of assets.features) {
      const t = f.properties?.asset_tier;
      if (t && t in assetCounts) assetCounts[t]++;
    }

    const activeCats = CAT_ORDER.filter(c => (catCounts[c] || 0) > 0).length;

    const donutData = CAT_ORDER
      .map(c => ({ name: c, value: catCounts[c] || 0, color: CATEGORY_COLORS[c] || '#94A3B8' }))
      .filter(d => d.value > 0);

    return {
      tierCounts,
      catCounts,
      assetCounts,
      totalSites: sites.features.length,
      totalAssets: assets.features.length,
      topScore,
      topName,
      activeCats,
      donutData,
    };
  }, [sites, assets]);

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
      {/* 1. Header */}
      <div className="px-4 py-3 bg-white border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center bg-[#CCFBF1] border border-[#0F766E]/30 flex-shrink-0">
            <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-[#0F766E]">
              Analysis Panel
            </div>
            <div className="text-[12.5px] font-semibold text-[#0F172A] leading-tight">
              Tourism Analytics
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              Tagbilaran · Dauis · Panglao
            </div>
          </div>
        </div>
      </div>

      {/* Cluster detail (only when a cluster is selected) */}
      <ClusterDetailSection />

      {/* 2. KPI grid */}
      <div className="px-3 pt-3 pb-2 grid grid-cols-2 gap-2">
        <StatCard
          label="Ranked Sites"
          value={stats.totalSites.toLocaleString()}
          caption="Anchor + Secondary + Supportive"
          accent="#E07A18"
        />
        <StatCard
          label="Hospitality"
          value={stats.totalAssets.toLocaleString()}
          caption="Premium + Quality"
          accent="#C47A1F"
        />
        <StatCard
          label="Top Score"
          value={stats.topScore ? stats.topScore.toFixed(1) : '—'}
          caption={stats.topName.length > 22 ? stats.topName.slice(0, 22) + '…' : stats.topName}
          accent="#0F766E"
        />
        <StatCard
          label="Categories"
          value={`${stats.activeCats}/6`}
          caption="Distinct site types"
          accent="#7E8B47"
        />
      </div>

      {/* 3. Active layer callout */}
      <div className="px-3 pb-3">
        <div className="rounded-md bg-white border border-[#E2E8F0] px-2.5 py-2 flex items-start gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-[#B45309]">
              Active Layer
            </div>
            <div className="text-[12.5px] font-semibold text-[#0F172A] leading-tight">
              Tourism Site Distribution
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5">
              Ranked attractions by category &amp; performance tier
            </div>
          </div>
        </div>
      </div>

      {/* 4. Donut chart */}
      <div className="px-3 pb-3">
        <div className="rounded-md bg-white border border-[#E2E8F0] px-3 py-2.5">
          <div className="text-[12.5px] font-semibold text-[#0F172A] mb-1.5">
            Category Distribution
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.donutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={62}
                  paddingAngle={2}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {stats.donutData.map(d => (
                    <Cell key={d.name} fill={d.color} />
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
                  }}
                  formatter={(value: number, name: string) => [`${value} sites`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-2.5 gap-y-1 justify-center mt-1">
            {stats.donutData.map(d => (
              <div key={d.name} className="flex items-center gap-1 text-[10px] text-[#64748B]">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: d.color }}
                />
                <span>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Per-category breakdown rows */}
      <div className="px-3 pb-3">
        <SectionLabel>Sites by Category</SectionLabel>
        <div className="space-y-1.5">
          {CAT_ORDER.map(cat => (
            <CategoryRow
              key={cat}
              label={cat}
              count={stats.catCounts[cat] || 0}
              total={stats.totalSites}
              color={CATEGORY_COLORS[cat] || '#94A3B8'}
            />
          ))}
        </div>
      </div>

      {/* 6. Tier breakdown rows */}
      <div className="px-3 pb-3">
        <SectionLabel>Performance Tiers</SectionLabel>
        <div className="space-y-1.5">
          {TIER_ORDER.map(tier => (
            <CategoryRow
              key={tier}
              label={tier}
              count={stats.tierCounts[tier]}
              total={stats.totalSites}
              color={TIER_ACCENT[tier]}
            />
          ))}
        </div>
      </div>

      {/* 7. Hospitality */}
      <div className="px-3 pb-3">
        <SectionLabel>Hospitality Stock</SectionLabel>
        <div className="space-y-1.5">
          <CategoryRow
            label="Premium"
            count={stats.assetCounts.Premium || 0}
            total={stats.totalAssets}
            color="#C47A1F"
          />
          <CategoryRow
            label="Quality"
            count={stats.assetCounts.Quality || 0}
            total={stats.totalAssets}
            color="#E5A55A"
          />
        </div>
      </div>
    </div>
  );
}
