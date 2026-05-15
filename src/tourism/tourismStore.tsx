// Tourism module — UI state store (filters, selection)
// Uses React context. Kept separate from TourismContext (which loads data).

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type LGUFilter = 'All' | 'Tagbilaran City' | 'Dauis' | 'Panglao';
export type TierFilter = 'All' | 'Primary' | 'Emerging' | 'Satellite';

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
  showSupportive: boolean;
  showQuality: boolean;

  // Mutators
  setLgu: (v: LGUFilter) => void;
  setTier: (v: TierFilter) => void;
  toggleCategory: (c: string) => void;
  setSearch: (s: string) => void;
  setSelectedClusterId: (id: number | null) => void;
  setHighlightedSiteUid: (uid: string | null) => void;
  setActiveTab: (t: 'clusters' | 'attractions') => void;
  setShowSupportive: (v: boolean) => void;
  setShowQuality: (v: boolean) => void;
  clearAllFilters: () => void;
  hasActiveFilters: () => boolean;
}

const TourismUIContext = createContext<TourismUIState | null>(null);

export function TourismUIProvider({ children }: { children: ReactNode }) {
  const [lgu, setLgu] = useState<LGUFilter>('All');
  const [tier, setTier] = useState<TierFilter>('All');
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [highlightedSiteUid, setHighlightedSiteUid] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'clusters' | 'attractions'>('clusters');
  const [showSupportive, setShowSupportive] = useState(false);
  const [showQuality, setShowQuality] = useState(false);

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
    activeTab, showSupportive, showQuality,
    setLgu, setTier, toggleCategory, setSearch,
    setSelectedClusterId, setHighlightedSiteUid,
    setActiveTab, setShowSupportive, setShowQuality,
    clearAllFilters, hasActiveFilters,
  };
  return <TourismUIContext.Provider value={value}>{children}</TourismUIContext.Provider>;
}

export function useTourismUI(): TourismUIState {
  const ctx = useContext(TourismUIContext);
  if (!ctx) throw new Error('useTourismUI must be used inside TourismUIProvider');
  return ctx;
}
