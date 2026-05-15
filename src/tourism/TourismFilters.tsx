// Tourism module — Filters block in the sidebar.
// LGU buttons, Category multi-select chips, Tier buttons, Search box, clear-all bar.
// Light theme · unified DM Sans typography.

import React from 'react';
import { Search, X } from 'lucide-react';
import { useTourismUI } from './tourismStore';
import { useTourismData } from './TourismContext';
import { CATEGORY_COLORS } from './styles';

const LGU_OPTIONS: { label: string; value: 'All' | 'Tagbilaran City' | 'Dauis' | 'Panglao' }[] = [
  { label: 'All',         value: 'All' },
  { label: 'Tagbilaran',  value: 'Tagbilaran City' },
  { label: 'Dauis',       value: 'Dauis' },
  { label: 'Panglao',     value: 'Panglao' },
];

const TIER_OPTIONS: { label: string; value: 'All' | 'Primary' | 'Emerging' | 'Satellite' }[] = [
  { label: 'All',       value: 'All' },
  { label: 'Primary',   value: 'Primary' },
  { label: 'Emerging',  value: 'Emerging' },
  { label: 'Satellite', value: 'Satellite' },
];

const CATEGORIES = [
  'Beach', 'Marine', 'Nature / Viewpoint', 'Heritage',
  'Faith', 'Urban Park',
];

const SectionLabel = ({ children, hint }: { children: React.ReactNode; hint?: string }) => (
  <div className="flex items-center justify-between mb-2">
    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#475569]">
      {children}
    </span>
    {hint && (
      <span className="text-[9.5px] text-[#94A3B8]">{hint}</span>
    )}
  </div>
);

export function TourismFilters() {
  const ui = useTourismUI();
  const { sites } = useTourismData();

  const categoryCounts: Record<string, number> = {};
  sites?.features.forEach((f) => {
    const p: any = f.properties;
    if (p.site_cat === 'EXCLUDED') return;
    if (ui.lgu !== 'All' && p.lgu !== ui.lgu) return;
    categoryCounts[p.site_cat] = (categoryCounts[p.site_cat] || 0) + 1;
  });

  const Chip = ({
    active, onClick, color, children,
  }: { active: boolean; onClick: () => void; color?: string; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors inline-flex items-center gap-1.5 ${
        active
          ? 'border-[#0891B2]/40 bg-[#ECFEFF] text-[#0E7490]'
          : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#475569]'
      }`}
      style={active && color
        ? { background: `${color}1A`, borderColor: `${color}66`, color: color }
        : undefined}
    >
      {children}
    </button>
  );

  return (
    <div
      className="flex flex-col gap-3 px-4 py-3 border-b border-[#E2E8F0] bg-white"
      style={{ fontFamily: 'DM Sans, Segoe UI, sans-serif' }}
    >
      {/* Search */}
      <div className="relative flex items-center bg-white border border-[#E2E8F0] rounded-md focus-within:border-[#0891B2] focus-within:ring-2 focus-within:ring-[#0891B2]/20 transition-all">
        <Search className="w-3.5 h-3.5 ml-3 text-[#94A3B8] shrink-0" />
        <input
          type="text"
          value={ui.search}
          onChange={(e) => ui.setSearch(e.target.value)}
          placeholder="Search attractions by name…"
          className="flex-1 bg-transparent px-3 py-2 text-[12px] text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
        />
        {ui.search && (
          <button onClick={() => ui.setSearch('')} className="px-3 text-[#94A3B8] hover:text-[#0F172A]">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* LGU */}
      <div>
        <SectionLabel>LGU</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {LGU_OPTIONS.map((o) => (
            <Chip key={o.value} active={ui.lgu === o.value} onClick={() => ui.setLgu(o.value)}>
              {o.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Category multi-select */}
      <div>
        <SectionLabel hint="multi-select">Category</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = ui.categories.has(cat);
            const color = CATEGORY_COLORS[cat];
            return (
              <Chip key={cat} active={active} color={color} onClick={() => ui.toggleCategory(cat)}>
                {!active && <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
                <span>{cat}</span>
                <span className="opacity-60 text-[10px] tabular-nums">{categoryCounts[cat] || 0}</span>
              </Chip>
            );
          })}
        </div>
      </div>

      {/* Tier */}
      <div>
        <SectionLabel>Cluster Tier</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {TIER_OPTIONS.map((o) => (
            <Chip key={o.value} active={ui.tier === o.value} onClick={() => ui.setTier(o.value)}>
              {o.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Active filter bar */}
      {ui.hasActiveFilters() && (
        <div className="flex items-center gap-2 px-3 py-2 -mx-4 bg-[#F1F5F9] border-y border-[#E2E8F0]">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#475569]">
            Filtered
          </span>
          <div className="flex-1 flex flex-wrap gap-1.5">
            {ui.lgu !== 'All' && (
              <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[11px] text-[#0F172A]">{ui.lgu}</span>
            )}
            {Array.from(ui.categories).map((c) => (
              <span key={c} className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[11px] text-[#0F172A]">{c}</span>
            ))}
            {ui.tier !== 'All' && (
              <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[11px] text-[#0F172A]">{ui.tier} clusters</span>
            )}
            {ui.search && (
              <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[11px] text-[#0F172A]">"{ui.search}"</span>
            )}
          </div>
          <button
            onClick={ui.clearAllFilters}
            className="px-2.5 py-1 rounded border border-[#E2E8F0] hover:bg-white text-[10px] uppercase tracking-wider text-[#475569] transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
