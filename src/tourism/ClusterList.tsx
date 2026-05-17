// Tourism module — Cluster list view (sidebar Clusters tab)
// Light theme · unified DM Sans typography.

import React from 'react';
import { useTourismData } from './TourismContext';
import { useTourismUI } from './tourismStore';
import { TIER_COLORS } from './styles';
import type { ClusterFeature } from './types';

// Tier badge stroke/text color — canonical TIER_COLORS (single source of truth).
const TIER_BADGE_BG: Record<string, string> = {
  Primary:   TIER_COLORS.Primary.stroke,   // #E07A18 amber
  Emerging:  TIER_COLORS.Emerging.stroke,  // #059669 emerald
  Satellite: TIER_COLORS.Satellite.stroke, // #2563EB blue
};

// Soft tier tints (matching hue, light value) for chip/row backgrounds.
const TIER_TINT_BG: Record<string, string> = {
  Primary:   '#FFF7ED', // amber-50
  Emerging:  '#ECFDF5', // emerald-50
  Satellite: '#EFF6FF', // blue-50
};

export function ClusterList() {
  const { clusters } = useTourismData();
  const ui = useTourismUI();
  if (!clusters) return null;

  const filtered: ClusterFeature[] = [];
  clusters.features.forEach((f) => {
    const p = f.properties;
    if (ui.lgu !== 'All' && p.lgu !== ui.lgu) return;
    if (ui.tier !== 'All' && p.tier !== ui.tier) return;
    if (ui.categories.size > 0 || ui.search) {
      const haystack = (p.anchors_names || '').toLowerCase() + ' ' + p.name.toLowerCase();
      if (ui.search && !haystack.includes(ui.search.toLowerCase())) return;
    }
    filtered.push(f as ClusterFeature);
  });

  const order: Record<string, number> = { Primary: 0, Emerging: 1, Satellite: 2 };
  filtered.sort((a, b) => {
    const ot = order[a.properties.tier] - order[b.properties.tier];
    if (ot !== 0) return ot;
    const pa = a.properties.priority || 999;
    const pb = b.properties.priority || 999;
    if (pa !== pb) return pa - pb;
    return (b.properties.n_prem || 0) - (a.properties.n_prem || 0);
  });

  if (filtered.length === 0) {
    return (
      <div className="p-6 text-center italic text-[#94A3B8] text-[12px]">
        No clusters match current filters.
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ fontFamily: 'DM Sans, Segoe UI, sans-serif' }}>
      {filtered.map((f) => {
        const p = f.properties;
        const selected = ui.selectedClusterId === p.cluster_id;
        const badgeColor = TIER_BADGE_BG[p.tier] || '#94A3B8';
        const tintBg = TIER_TINT_BG[p.tier] || '#F1F5F9';
        const badgeText = p.priority ? `P${p.priority}` : '';
        const landKm2 = (p as any).area_land ?? p.area_km2;
        const isMarine = ((p as any).pct_water ?? 0) > 50;

        return (
          <button
            key={p.cluster_id}
            onClick={() => ui.setSelectedClusterId(p.cluster_id)}
            className={`text-left flex gap-3 items-start px-4 py-3 border-b border-[#E2E8F0] transition-colors ${
              selected ? 'bg-[#F1F5F9]' : 'bg-white hover:bg-[#F8FAFC]'
            }`}
            style={selected ? { boxShadow: `inset 3px 0 0 0 ${badgeColor}` } : undefined}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold"
              style={badgeText
                ? { background: badgeColor, color: '#fff' }
                : { background: tintBg, color: '#94A3B8', border: '1px dashed #CBD5E1' }}
            >
              {badgeText || '—'}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[9.5px] font-semibold uppercase tracking-[0.18em] mb-0.5"
                style={{ color: badgeColor }}
              >
                {p.tier}
              </div>
              <div className="text-[13px] font-semibold leading-tight text-[#0F172A] truncate">
                {p.name}
              </div>
              <div className="mt-0.5 text-[11px] text-[#64748B] tabular-nums">
                {p.lgu} · {landKm2.toFixed(2)} km² land
                {isMarine && (
                  <span className="ml-1.5 inline-block px-1.5 py-0.5 align-baseline text-[9px] uppercase tracking-widest font-semibold rounded-sm bg-[#CFFAFE] text-[#0E7490] border border-[#0891B2]/30">
                    Marine
                  </span>
                )}
              </div>
              <div className="mt-1 text-[11px] flex gap-3 text-[#64748B] tabular-nums">
                <span>
                  <strong className="text-[#0F172A] font-semibold">{p.n_anchor}</strong>{' '}
                  anchor{p.n_anchor !== 1 ? 's' : ''}
                </span>
                <span>
                  <strong className="text-[#0F172A] font-semibold">{p.n_sec}</strong> secondary
                </span>
                <span>
                  <strong className="text-[#0F172A] font-semibold">{p.n_prem}</strong> hotels
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
