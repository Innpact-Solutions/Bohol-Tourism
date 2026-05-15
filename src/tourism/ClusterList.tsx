// Tourism module — Cluster list view (sidebar Clusters tab)
// Shows clusters as cards with priority badges (P1..P5), tier, name, LGU, area, key counts.

import React from 'react';
import { useTourismData } from './TourismContext';
import { useTourismUI } from './tourismStore';
import type { ClusterFeature } from './types';

const TIER_BADGE_BG: Record<string, string> = {
  Primary:   '#B47228',
  Emerging:  '#C84A35',
  Satellite: '#5C7A87',
};

export function ClusterList() {
  const { clusters } = useTourismData();
  const ui = useTourismUI();
  if (!clusters) return null;

  // Filter and sort
  const filtered: ClusterFeature[] = [];
  clusters.features.forEach((f) => {
    const p = f.properties;
    if (ui.lgu !== 'All' && p.lgu !== ui.lgu) return;
    if (ui.tier !== 'All' && p.tier !== ui.tier) return;
    // If category or search active, only show clusters with matching members.
    if (ui.categories.size > 0 || ui.search) {
      // Need membership data — use the assigned anchor/secondary names list (stored in anchors_names)
      // For richer matching, the right panel uses membership. Here we keep it lightweight.
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
      <div className="p-6 text-center italic text-stone-500 text-[12px]">
        No clusters match current filters.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {filtered.map((f) => {
        const p = f.properties;
        const selected = ui.selectedClusterId === p.cluster_id;
        const tierLow = p.tier.toLowerCase();
        const badgeColor = TIER_BADGE_BG[p.tier] || '#888';
        const badgeText = p.priority ? `P${p.priority}` : '';
        const landKm2 = (p as any).area_land ?? p.area_km2;
        const isMarine = ((p as any).pct_water ?? 0) > 50;

        return (
          <button
            key={p.cluster_id}
            onClick={() => ui.setSelectedClusterId(p.cluster_id)}
            className={`text-left flex gap-3.5 items-start px-5 py-3.5 border-b border-stone-300 transition-colors ${
              selected ? 'bg-slate-900 text-stone-50' : 'bg-white hover:bg-stone-100'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-serif font-semibold text-[13px] ${
                badgeText ? 'text-stone-50' : 'text-stone-500 border border-dashed border-stone-300 bg-transparent'
              }`}
              style={badgeText ? { background: badgeColor } : {}}
            >
              {badgeText}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[9.5px] font-semibold uppercase tracking-[0.22em] mb-0.5 ${selected ? 'text-stone-50/55' : 'text-stone-500'}`}>
                {p.tier}
              </div>
              <div className={`font-serif text-[14px] font-medium leading-tight tracking-tight ${selected ? 'text-stone-50' : 'text-slate-900'}`}>
                {p.name}
              </div>
              <div className={`mt-1 font-mono text-[11px] ${selected ? 'text-stone-50/60' : 'text-stone-500'}`}>
                {p.lgu} · {landKm2.toFixed(2)} km² land
                {isMarine && (
                  <span className="ml-1.5 inline-block px-1.5 py-0.5 align-baseline text-[8.5px] uppercase tracking-widest bg-cyan-800 text-stone-50">marine</span>
                )}
              </div>
              <div className={`mt-1.5 font-mono text-[11px] flex gap-3 ${selected ? 'text-stone-50/60' : 'text-stone-600'}`}>
                <span>
                  <strong className={selected ? 'text-stone-50' : 'text-slate-900'}>{p.n_anchor}</strong>{' '}
                  anchor{p.n_anchor !== 1 ? 's' : ''}
                </span>
                <span>
                  <strong className={selected ? 'text-stone-50' : 'text-slate-900'}>{p.n_sec}</strong> secondary
                </span>
                <span>
                  <strong className={selected ? 'text-stone-50' : 'text-slate-900'}>{p.n_prem}</strong> hotels
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
