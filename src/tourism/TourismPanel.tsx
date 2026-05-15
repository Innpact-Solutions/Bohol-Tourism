// Tourism module — main left drawer content.
// Top: filters. Middle: tabs (Clusters | Attractions). Bottom: cluster or attraction list.

import React from 'react';
import { TourismFilters } from './TourismFilters';
import { ClusterList } from './ClusterList';
import { AttractionsList } from './AttractionsList';
import { useTourismUI } from './tourismStore';
import { useTourismData } from './TourismContext';

export function TourismPanel() {
  const ui = useTourismUI();
  const { clusters, sites, loading } = useTourismData();

  // Count what's currently visible per tab
  const visibleClusters = clusters?.features.filter(f => {
    const p = f.properties as any;
    if (ui.lgu !== 'All' && p.lgu !== ui.lgu) return false;
    if (ui.tier !== 'All' && p.tier !== ui.tier) return false;
    return true;
  }).length ?? 0;
  const visibleAttractions = sites?.features.filter(f => {
    const p = f.properties as any;
    if (p.site_cat === 'EXCLUDED') return false;
    if (ui.lgu !== 'All' && p.lgu !== ui.lgu) return false;
    if (ui.categories.size > 0 && !ui.categories.has(p.site_cat)) return false;
    if (ui.search && !(p.name || '').toLowerCase().includes(ui.search.toLowerCase())) return false;
    return true;
  }).length ?? 0;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-stone-100 text-stone-500 font-serif text-base">
        Loading tourism data…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-stone-100">
      <TourismFilters />

      {/* Tabs */}
      <div className="flex border-b border-stone-300 px-4 pt-2">
        <button
          onClick={() => ui.setActiveTab('clusters')}
          className={`py-2 mr-6 -mb-px border-b-2 font-serif text-[11.5px] font-medium uppercase tracking-[0.22em] transition-colors ${
            ui.activeTab === 'clusters'
              ? 'text-slate-900 border-slate-900'
              : 'text-stone-500 border-transparent hover:text-stone-700'
          }`}
        >
          Clusters
          <span className={`ml-1.5 font-mono text-[10.5px] font-normal tracking-normal ${
            ui.activeTab === 'clusters' ? 'text-stone-700' : 'text-stone-500'
          }`}>{visibleClusters}</span>
        </button>
        <button
          onClick={() => ui.setActiveTab('attractions')}
          className={`py-2 -mb-px border-b-2 font-serif text-[11.5px] font-medium uppercase tracking-[0.22em] transition-colors ${
            ui.activeTab === 'attractions'
              ? 'text-slate-900 border-slate-900'
              : 'text-stone-500 border-transparent hover:text-stone-700'
          }`}
        >
          Attractions
          <span className={`ml-1.5 font-mono text-[10.5px] font-normal tracking-normal ${
            ui.activeTab === 'attractions' ? 'text-stone-700' : 'text-stone-500'
          }`}>{visibleAttractions}</span>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {ui.activeTab === 'clusters' ? <ClusterList /> : <AttractionsList />}
      </div>
    </div>
  );
}
