// Tourism module — Filters block in the sidebar.
// LGU buttons, Category multi-select chips, Tier buttons, Search box, clear-all bar.

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
  'Faith', 'Urban Park', 'Other Attraction',
];

export function TourismFilters() {
  const ui = useTourismUI();
  const { sites } = useTourismData();

  // Count per category, scoped to current LGU
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
      className={`px-2.5 py-1.5 text-[11.5px] border transition-colors inline-flex items-center gap-1.5 ${
        active
          ? 'border-slate-900 text-stone-50'
          : 'border-stone-300 bg-white hover:bg-stone-100 text-stone-700'
      }`}
      style={active && color ? { background: color, borderColor: color } : active ? { background: '#1F2738' } : {}}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-col gap-3.5 px-4 py-3 border-b border-stone-300">
      {/* Search */}
      <div className="relative flex items-center bg-white border border-stone-300 focus-within:border-amber-700 focus-within:ring-2 focus-within:ring-amber-700/20 transition-all">
        <Search className="w-3.5 h-3.5 ml-3 text-stone-500 shrink-0" />
        <input
          type="text"
          value={ui.search}
          onChange={(e) => ui.setSearch(e.target.value)}
          placeholder="Search attractions by name…"
          className="flex-1 bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-stone-500 placeholder:italic"
        />
        {ui.search && (
          <button onClick={() => ui.setSearch('')} className="px-3 text-stone-500 hover:text-slate-900">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* LGU */}
      <div>
        <div className="font-serif text-[10.5px] font-semibold uppercase tracking-[0.26em] text-stone-700 mb-2">
          LGU
        </div>
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
        <div className="flex items-center justify-between mb-2">
          <span className="font-serif text-[10.5px] font-semibold uppercase tracking-[0.26em] text-stone-700">
            Category
          </span>
          <span className="font-mono text-[9.5px] text-stone-500">multi-select</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = ui.categories.has(cat);
            const color = CATEGORY_COLORS[cat];
            return (
              <Chip key={cat} active={active} color={color} onClick={() => ui.toggleCategory(cat)}>
                {!active && <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
                <span>{cat}</span>
                <span className="opacity-60 text-[10px] font-mono">{categoryCounts[cat] || 0}</span>
              </Chip>
            );
          })}
        </div>
      </div>

      {/* Tier */}
      <div>
        <div className="font-serif text-[10.5px] font-semibold uppercase tracking-[0.26em] text-stone-700 mb-2">
          Cluster Tier
        </div>
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
        <div className="flex items-center gap-2 px-3 py-2 -mx-4 bg-slate-900 text-stone-50">
          <span className="font-serif text-[10px] font-medium uppercase tracking-[0.22em] text-stone-50/55">
            Filtered
          </span>
          <div className="flex-1 flex flex-wrap gap-1.5">
            {ui.lgu !== 'All' && (
              <span className="px-2 py-0.5 bg-stone-50/15 text-[11px]">{ui.lgu}</span>
            )}
            {Array.from(ui.categories).map((c) => (
              <span key={c} className="px-2 py-0.5 bg-stone-50/15 text-[11px]">{c}</span>
            ))}
            {ui.tier !== 'All' && (
              <span className="px-2 py-0.5 bg-stone-50/15 text-[11px]">{ui.tier} clusters</span>
            )}
            {ui.search && (
              <span className="px-2 py-0.5 bg-stone-50/15 text-[11px]">"{ui.search}"</span>
            )}
          </div>
          <button
            onClick={ui.clearAllFilters}
            className="px-2.5 py-1 border border-stone-50/30 hover:bg-stone-50/15 text-[10.5px] uppercase tracking-wider transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
