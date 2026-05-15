// Tourism module — UI state store (filters, selection)
// Uses React context. Kept separate from TourismContext (which loads data).

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

export type LGUFilter = 'All' | 'Tagbilaran City' | 'Dauis' | 'Panglao';
export type TierFilter = 'All' | 'Primary' | 'Emerging' | 'Satellite';
export type SiteTier = 'Anchor' | 'Secondary' | 'Supportive';
const SITE_TIERS: SiteTier[] = ['Anchor', 'Secondary', 'Supportive'];

interface TourismUIState {
  // Filters
  lgu: LGUFilter;
  tier: TierFilter;
  categories: Set<string>;
  search: string;
  // Selection
  selectedClusterId: number | null;
  highlightedSiteUid: string | null;
  // View
  activeTab: 'clusters' | 'attractions';

  // Tourism Sites — by performance tier
  showAnchor: boolean;
  showSecondary: boolean;
  showSupportive: boolean;

  // Hospitality — by asset tier
  showPremium: boolean;
  showQuality: boolean;

  // Tourism Clusters — by cluster tier
  showClusterPrimary: boolean;
  showClusterEmerging: boolean;
  showClusterSatellite: boolean;

  // Site point visibility by category (Beach, Marine, etc.) — per-tier sets.
  // Each tier (Anchor / Secondary / Supportive) has its own independent
  // category selection so curating one does not affect another.
  enabledSiteCategoriesByTier: Record<SiteTier, Set<string>>;
  // Derived union of all per-tier sets — used by the legend for display only.
  enabledSiteCategories: Set<string>;
  toggleSiteCategoryForTier: (c: string, tier: SiteTier) => void;
  setAllSiteCategoriesForTier: (on: boolean, tier: SiteTier) => void;

  // Mutators
  setLgu: (v: LGUFilter) => void;
  setTier: (v: TierFilter) => void;
  toggleCategory: (c: string) => void;
  setSearch: (s: string) => void;
  setSelectedClusterId: (id: number | null) => void;
  setHighlightedSiteUid: (uid: string | null) => void;
  setActiveTab: (t: 'clusters' | 'attractions') => void;
  setShowAnchor: (v: boolean) => void;
  setShowSecondary: (v: boolean) => void;
  setShowSupportive: (v: boolean) => void;
  setShowPremium: (v: boolean) => void;
  setShowQuality: (v: boolean) => void;
  setShowClusterPrimary: (v: boolean) => void;
  setShowClusterEmerging: (v: boolean) => void;
  setShowClusterSatellite: (v: boolean) => void;
  clearAllFilters: () => void;
  hasActiveFilters: () => boolean;
}

const TourismUIContext = createContext<TourismUIState | null>(null);

export const TOURISM_SITE_CATEGORIES = [
  'Beach',
  'Marine',
  'Nature / Viewpoint',
  'Heritage',
  'Faith',
  'Urban Park',
] as const;

export function TourismUIProvider({ children }: { children: ReactNode }) {
  const [lgu, setLgu] = useState<LGUFilter>('All');
  const [tier, setTier] = useState<TierFilter>('All');
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [highlightedSiteUid, setHighlightedSiteUid] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'clusters' | 'attractions'>('clusters');

  // Sub-layer visibility (defaults: site tiers on; hospitality + cluster layers off)
  const [showAnchor, setShowAnchorRaw] = useState(true);
  const [showSecondary, setShowSecondaryRaw] = useState(true);
  const [showSupportive, setShowSupportiveRaw] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [showClusterPrimary, setShowClusterPrimary] = useState(false);
  const [showClusterEmerging, setShowClusterEmerging] = useState(false);
  const [showClusterSatellite, setShowClusterSatellite] = useState(false);

  // Site point visibility by category — per-tier. Default: all categories
  // enabled for every tier.
  const initialByTier = (): Record<SiteTier, Set<string>> => ({
    Anchor:     new Set(TOURISM_SITE_CATEGORIES),
    Secondary:  new Set(TOURISM_SITE_CATEGORIES),
    Supportive: new Set(TOURISM_SITE_CATEGORIES),
  });
  const [enabledSiteCategoriesByTier, setEnabledSiteCategoriesByTier] =
    useState<Record<SiteTier, Set<string>>>(initialByTier);

  // Per-tier "touched" flag: first interaction isolates to just the clicked
  // category for that tier; afterwards each click toggles individually.
  const [siteCategoriesTouchedByTier, setSiteCategoriesTouchedByTier] =
    useState<Record<SiteTier, boolean>>({ Anchor: false, Secondary: false, Supportive: false });

  const toggleSiteCategoryForTier = (c: string, tier: SiteTier) => {
    const touched = siteCategoriesTouchedByTier[tier];
    setEnabledSiteCategoriesByTier(prev => {
      const cur = prev[tier];
      let nextSet: Set<string>;
      if (!touched) {
        // First-time click: isolate to just this category for this tier
        nextSet = new Set([c]);
      } else {
        nextSet = new Set(cur);
        if (nextSet.has(c)) nextSet.delete(c); else nextSet.add(c);
      }
      return { ...prev, [tier]: nextSet };
    });
    if (!touched) {
      setSiteCategoriesTouchedByTier(prev => ({ ...prev, [tier]: true }));
    }
  };

  const setAllSiteCategoriesForTier = (on: boolean, tier: SiteTier) => {
    setEnabledSiteCategoriesByTier(prev => ({
      ...prev,
      [tier]: on ? new Set(TOURISM_SITE_CATEGORIES) : new Set(),
    }));
    setSiteCategoriesTouchedByTier(prev => ({ ...prev, [tier]: false }));
  };

  // Derived union for legend display
  const enabledSiteCategories = useMemo(() => {
    const out = new Set<string>();
    SITE_TIERS.forEach(t => enabledSiteCategoriesByTier[t].forEach(c => out.add(c)));
    return out;
  }, [enabledSiteCategoriesByTier]);

  // Wrap tier setters: turning a tier ON resets ONLY that tier's categories
  // to all-on and re-arms the first-click isolate behaviour for it.
  const resetTierCategoriesOnEnable = (currentlyOn: boolean, next: boolean, tier: SiteTier) => {
    if (!currentlyOn && next) {
      setEnabledSiteCategoriesByTier(prev => ({ ...prev, [tier]: new Set(TOURISM_SITE_CATEGORIES) }));
      setSiteCategoriesTouchedByTier(prev => ({ ...prev, [tier]: false }));
    }
  };
  const setShowAnchor = (v: boolean) => {
    resetTierCategoriesOnEnable(showAnchor, v, 'Anchor');
    setShowAnchorRaw(v);
  };
  const setShowSecondary = (v: boolean) => {
    resetTierCategoriesOnEnable(showSecondary, v, 'Secondary');
    setShowSecondaryRaw(v);
  };
  const setShowSupportive = (v: boolean) => {
    resetTierCategoriesOnEnable(showSupportive, v, 'Supportive');
    setShowSupportiveRaw(v);
  };

  const toggleCategory = (c: string) => {
    setCategories(prev => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  };

  const clearAllFilters = () => {
    setLgu('All');
    setTier('All');
    setCategories(new Set());
    setSearch('');
  };

  const hasActiveFilters = () =>
    lgu !== 'All' || tier !== 'All' || categories.size > 0 || search.length > 0;

  const value: TourismUIState = {
    lgu, tier, categories, search,
    selectedClusterId, highlightedSiteUid,
    activeTab,
    showAnchor, showSecondary, showSupportive,
    showPremium, showQuality,
    showClusterPrimary, showClusterEmerging, showClusterSatellite,
    enabledSiteCategoriesByTier, enabledSiteCategories,
    toggleSiteCategoryForTier, setAllSiteCategoriesForTier,
    setLgu, setTier, toggleCategory, setSearch,
    setSelectedClusterId, setHighlightedSiteUid,
    setActiveTab,
    setShowAnchor, setShowSecondary, setShowSupportive,
    setShowPremium, setShowQuality,
    setShowClusterPrimary, setShowClusterEmerging, setShowClusterSatellite,
    clearAllFilters, hasActiveFilters,
  };
  return <TourismUIContext.Provider value={value}>{children}</TourismUIContext.Provider>;
}

export function useTourismUI(): TourismUIState {
  const ctx = useContext(TourismUIContext);
  if (!ctx) throw new Error('useTourismUI must be used inside TourismUIProvider');
  return ctx;
}
