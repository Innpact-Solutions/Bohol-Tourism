// Tourism Insights — right-panel section that shows the cluster / attractions
// lists that previously lived in the left drawer. Reuses ClusterList and
// AttractionsList components (which already read filters from useTourismUI).

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Palmtree } from 'lucide-react';
import { ClusterList } from './ClusterList';
import { AttractionsList } from './AttractionsList';
import { useTourismUI } from './tourismStore';
import { useTourismData } from './TourismContext';

export function TourismInsightsPanel() {
  const ui = useTourismUI();
  const { clusters, sites, loading } = useTourismData();
  const [expanded, setExpanded] = useState(true);

  if (loading) {
    return (
      <div className="px-4 py-3 text-[12px] text-[#64748B] border-b border-[#E2E8F0]">
        Loading tourism insights…
      </div>
    );
  }

  const clusterCount = clusters?.features.length ?? 0;
  const attractionCount = sites?.features.filter(f => (f.properties as any).site_cat !== 'EXCLUDED').length ?? 0;

  return (
    <div className="border-b border-[#E2E8F0] bg-white" style={{ fontFamily: 'DM Sans, Segoe UI, sans-serif' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors text-left flex items-center justify-between border-b border-[#E2E8F0]"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center bg-[#FCD34D33] border border-[#D97706]/40">
            <Palmtree className="w-3.5 h-3.5 text-[#B45309]" />
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#B45309]">Tourism Insights</div>
            <div className="text-[12.5px] font-semibold text-[#0F172A]">Clusters &amp; Attractions</div>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-[#64748B]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[#64748B]" />
        )}
      </button>

      {expanded && (
        <div className="flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-[#E2E8F0] bg-white px-3">
            <button
              onClick={() => ui.setActiveTab('clusters')}
              className={`py-2 mr-5 -mb-px border-b-2 font-bold uppercase tracking-[0.16em] text-[11px] transition-colors ${
                ui.activeTab === 'clusters'
                  ? 'text-[#B45309] border-[#B45309]'
                  : 'text-[#64748B] border-transparent hover:text-[#B45309]'
              }`}
            >
              Clusters
              <span className="ml-1.5 text-[10px] font-normal text-[#94A3B8] tabular-nums">{clusterCount}</span>
            </button>
            <button
              onClick={() => ui.setActiveTab('attractions')}
              className={`py-2 -mb-px border-b-2 font-bold uppercase tracking-[0.16em] text-[11px] transition-colors ${
                ui.activeTab === 'attractions'
                  ? 'text-[#B45309] border-[#B45309]'
                  : 'text-[#64748B] border-transparent hover:text-[#B45309]'
              }`}
            >
              Attractions
              <span className="ml-1.5 text-[10px] font-normal text-[#94A3B8] tabular-nums">{attractionCount}</span>
            </button>
          </div>

          {/* Scrollable list */}
          <div className="max-h-[420px] overflow-y-auto bg-white">
            {ui.activeTab === 'clusters' ? <ClusterList /> : <AttractionsList />}
          </div>
        </div>
      )}
    </div>
  );
}
