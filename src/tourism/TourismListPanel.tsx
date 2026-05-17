// Tourism module — Floating list panel (right of the LeftDrawer).
// Modern compact UI showing three lists: Tourism Sites · Hospitality · Clusters.
// Bottom of the scroll area fades to transparent so the underlying map remains
// visible — giving a glassy, modern feel.

import React, { useEffect, useMemo, useState } from 'react';
import {
  X, Search, Star, MapPin, Hotel, Crown, Sparkles,
  ChevronDown, Award,
} from 'lucide-react';
import { useTourismData } from './TourismContext';
import { useTourismUI } from './tourismStore';
import { PhotoLightbox } from './PhotoGallery';
import { CATEGORY_COLORS } from './styles';

type TabId = 'sites' | 'hospitality' | 'clusters';

interface TourismListPanelProps {
  selectedLgu?: string | null;
  selectedBrgy?: string | null;
}

const TAB_THEME: Record<TabId, { accent: string; tint: string; soft: string }> = {
  sites:       { accent: '#10B981', tint: '#ECFDF5', soft: '#D1FAE5' },
  hospitality: { accent: '#F97316', tint: '#FFF7ED', soft: '#FFEDD5' },
  clusters:    { accent: '#EAB308', tint: '#FEFCE8', soft: '#FEF3C7' },
};

const TIER_BADGE: Record<string, { bg: string; fg: string }> = {
  Anchor:     { bg: '#FCD34D', fg: '#78350F' },
  Secondary:  { bg: '#FDE68A', fg: '#92400E' },
  Supportive: { bg: '#FEF3C7', fg: '#A16207' },
  Premium:    { bg: '#FED7AA', fg: '#9A3412' },
  Quality:    { bg: '#FFEDD5', fg: '#C2410C' },
  Primary:    { bg: '#FFF7ED', fg: '#E07A18' }, // canonical amber (Primary cluster)
  Emerging:   { bg: '#ECFDF5', fg: '#059669' }, // emerald (Emerging cluster)
  Satellite:  { bg: '#EFF6FF', fg: '#2563EB' }, // canonical blue   (Satellite cluster)
};

const norm = (v?: string | null): string | null => {
  if (!v) return null;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === 'all' || s.toLowerCase() === 'all lgus' || s.toLowerCase() === 'all barangays') return null;
  return s;
};

export function TourismListPanel({ selectedLgu, selectedBrgy }: TourismListPanelProps) {
  const { sites, assets, clusters, accommodationsBooking, getPhotosFor, getAssetPhotosFor, getBookingPhotosFor } = useTourismData();
  const ui = useTourismUI();

  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<TabId>('sites');
  const [search, setSearch] = useState('');

  // Auto-switch the active tab whenever the user interacts with a different
  // section in the left side panel (e.g. clicking Hospitality there focuses
  // the Hotels tab here).
  useEffect(() => {
    if (ui.activeSection && ui.activeSection !== tab) {
      setTab(ui.activeSection);
      if (collapsed) setCollapsed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.activeSection]);
  const [lb, setLb] = useState<{ open: boolean; photos: string[]; idx: number; caption: string }>({
    open: false, photos: [], idx: 0, caption: '',
  });

  const lgu = norm(selectedLgu);
  const brgy = norm(selectedBrgy);

  // ── derive filtered lists ────────────────────────────────────────────────
  // Each list mirrors what's visible on the map: the layer-on/off state and
  // per-tier category filters from the left side panel are applied here too.
  const sitesList = useMemo(() => {
    if (!sites) return [];
    const q = search.trim().toLowerCase();
    const allowedTiers = new Set<string>();
    if (ui.showAnchor)     allowedTiers.add('Anchor');
    if (ui.showSecondary)  allowedTiers.add('Secondary');
    if (ui.showSupportive) allowedTiers.add('Supportive');
    // If the whole Sites layer is off, show every tier in the directory
    // (the user is browsing the list independently of map visibility).
    const sitesLayerOff = allowedTiers.size === 0;

    const arr = sites.features.filter((f: any) => {
      const p = f.properties;
      if (p.site_cat === 'EXCLUDED') return false;
      if (!sitesLayerOff && !allowedTiers.has(p.perf_tier)) return false;
      // Per-tier category filter only applies when that tier is actually on.
      if (!sitesLayerOff) {
        const allowedCats = ui.enabledSiteCategoriesByTier?.[p.perf_tier as 'Anchor' | 'Secondary' | 'Supportive'];
        if (allowedCats && !allowedCats.has(p.site_cat)) return false;
      }
      if (lgu && p.lgu !== lgu) return false;
      if (brgy && p.brgy !== brgy) return false;
      if (q && !(p.name || '').toLowerCase().includes(q)) return false;
      return true;
    });
    arr.sort((a: any, b: any) => {
      const sa = a.properties.perf_score || 0;
      const sb = b.properties.perf_score || 0;
      if (sb !== sa) return sb - sa;
      return (Number(b.properties.n_ratings) || 0) - (Number(a.properties.n_ratings) || 0);
    });
    return arr;
  }, [sites, lgu, brgy, search,
      ui.showAnchor, ui.showSecondary, ui.showSupportive,
      ui.enabledSiteCategoriesByTier]);

  const hospitalityList = useMemo(() => {
    if (!assets) return [];
    const q = search.trim().toLowerCase();
    const allowedTiers = new Set<string>();
    if (ui.showPremium) allowedTiers.add('Premium');
    if (ui.showQuality) allowedTiers.add('Quality');
    // Layer fully off → show every hotel/F&B record (still honoring LGU / Brgy / search).
    const hospitalityLayerOff = allowedTiers.size === 0;

    const arr = assets.features.filter((f: any) => {
      const p = f.properties;
      if (!hospitalityLayerOff && !allowedTiers.has(p.asset_tier)) return false;
      if (lgu && p.lgu !== lgu) return false;
      if (brgy && p.brgy !== brgy) return false;
      if (q && !(p.name || '').toLowerCase().includes(q)) return false;
      return true;
    });
    const tierOrder: Record<string, number> = { Premium: 0, Quality: 1 };
    arr.sort((a: any, b: any) => {
      const ta = tierOrder[a.properties.asset_tier] ?? 9;
      const tb = tierOrder[b.properties.asset_tier] ?? 9;
      if (ta !== tb) return ta - tb;
      const sa = a.properties.perf_score || 0;
      const sb = b.properties.perf_score || 0;
      if (sb !== sa) return sb - sa;
      return (Number(b.properties.n_ratings) || 0) - (Number(a.properties.n_ratings) || 0);
    });
    return arr;
  }, [assets, lgu, brgy, search, ui.showPremium, ui.showQuality]);

  const bookingList = useMemo(() => {
    if (!accommodationsBooking) return [];
    const q = search.trim().toLowerCase();
    const arr = accommodationsBooking.features.filter((f: any) => {
      const p = f.properties;
      if (q && !(p.name || '').toLowerCase().includes(q)) return false;
      return true;
    });
    arr.sort((a: any, b: any) => {
      const ra = Number(a.properties.rating) || 0;
      const rb = Number(b.properties.rating) || 0;
      return rb - ra;
    });
    return arr;
  }, [accommodationsBooking, search]);

  const clusterList = useMemo(() => {
    if (!clusters) return [];
    const q = search.trim().toLowerCase();
    const allowedTiers = new Set<string>();
    if (ui.showClusterPrimary)   allowedTiers.add('Primary');
    if (ui.showClusterEmerging)  allowedTiers.add('Emerging');
    if (ui.showClusterSatellite) allowedTiers.add('Satellite');
    // Layer fully off → show every cluster.
    const clustersLayerOff = allowedTiers.size === 0;

    const arr = clusters.features.filter((f: any) => {
      const p = f.properties;
      if (!clustersLayerOff && !allowedTiers.has(p.tier)) return false;
      if (lgu && p.lgu !== lgu) return false;
      if (q) {
        const hay = ((p.anchors_names || '') + ' ' + (p.name || '')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const order: Record<string, number> = { Primary: 0, Emerging: 1, Satellite: 2 };
    arr.sort((a: any, b: any) => {
      const ot = (order[a.properties.tier] ?? 9) - (order[b.properties.tier] ?? 9);
      if (ot !== 0) return ot;
      return (a.properties.priority || 999) - (b.properties.priority || 999);
    });
    return arr;
  }, [clusters, lgu, search,
      ui.showClusterPrimary, ui.showClusterEmerging, ui.showClusterSatellite]);

  const counts: Record<TabId, number> = {
    sites: sitesList.length,
    hospitality: hospitalityList.length + (ui.showBookingAccommodations ? bookingList.length : 0),
    clusters: clusterList.length,
  };

  if (!sites && !assets && !clusters) return null;

  const activeAccent = TAB_THEME[tab].accent;

  return (
    <div
      data-tourism-directory
      className="absolute top-2 left-2 z-30 flex flex-col overflow-hidden"
      style={{
        width: collapsed ? 'auto' : 280,
        maxWidth: collapsed ? 220 : 280,
        height: collapsed ? 'auto' : '50vh',
        maxHeight: '50vh',
        fontFamily: 'DM Sans, Segoe UI, sans-serif',
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(10px) saturate(140%)',
        WebkitBackdropFilter: 'blur(10px) saturate(140%)',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 4px 16px -6px rgba(15,23,42,0.12)',
      }}
    >
      {/* ── Header (also acts as the collapse toggle) ──────────────────── */}
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-between px-2 py-1.5 hover:bg-white/30 transition-colors w-full text-left"
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand directory' : 'Collapse directory'}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="w-1 h-3.5 rounded-full shrink-0"
            style={{ background: activeAccent }}
          />
          <h2 className="text-[12px] font-semibold tracking-tight text-[#0F172A]/85">
            Tourism Directory
          </h2>
          {(lgu || brgy) && (
            <span className="text-[10px] text-[#64748B] truncate max-w-[140px]">
              · {brgy || lgu}
            </span>
          )}
        </div>
        <ChevronDown
          className="w-3.5 h-3.5 text-[#94A3B8] transition-transform shrink-0"
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
        />
      </button>

      {!collapsed && (
        <>
      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="px-1.5 pb-1.5">
        <div className="flex items-center gap-0.5">
          {(['sites', 'hospitality', 'clusters'] as TabId[]).map(t => {
            const active = tab === t;
            const theme = TAB_THEME[t];
            const labelMap: Record<TabId, string> = {
              sites: 'Sites',
              hospitality: 'Hotels',
              clusters: 'Clusters',
            };
            return (
              <button
                key={t}
                onClick={() => { setTab(t); ui.setActiveSection(t); }}
                className="flex-1 flex items-center justify-center gap-1 px-1.5 py-1 rounded text-[10.5px] font-semibold transition-all"
                style={
                  active
                    ? {
                        background: theme.tint,
                        color: theme.accent,
                        boxShadow: `inset 0 -2px 0 0 ${theme.accent}`,
                      }
                    : { color: '#64748B', background: 'transparent' }
                }
              >
                <span>{labelMap[t]}</span>
                <span
                  className="px-1 py-[1px] rounded-full text-[9px] tabular-nums font-bold"
                  style={
                    active
                      ? { background: theme.accent, color: '#fff' }
                      : { background: '#E2E8F0', color: '#64748B' }
                  }
                >
                  {counts[t]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="px-1.5 pb-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#94A3B8]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${tab}…`}
            className="w-full pl-7 pr-6 py-1 text-[11px] bg-white/70 border-0 border-b border-[#E2E8F0] rounded-sm outline-none focus:border-[#94A3B8] focus:bg-white/90 transition-colors placeholder:text-[#94A3B8] text-[#0F172A]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded flex items-center justify-center text-[#94A3B8] hover:text-[#0F172A]"
              aria-label="Clear search"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Body (scrollable with bottom fade mask) ────────────────────── */}
      <div className="relative flex-1 min-h-0 px-1">
        <div
          className="absolute inset-0 left-1 right-1 overflow-y-auto pr-0.5 pb-6 custom-scroll"
          style={{
            maskImage:
              'linear-gradient(to bottom, black 0, black calc(100% - 32px), transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 0, black calc(100% - 32px), transparent 100%)',
          }}
        >
          {tab === 'sites' && (
            <SitesList items={sitesList} getPhotosFor={getPhotosFor} onOpenLightbox={setLb} ui={ui} />
          )}
          {tab === 'hospitality' && (
            <HospitalityList
              items={hospitalityList}
              bookingItems={ui.showBookingAccommodations ? bookingList : []}
              getAssetPhotosFor={getAssetPhotosFor}
              getBookingPhotosFor={getBookingPhotosFor}
              onOpenLightbox={setLb}
              ui={ui}
            />
          )}
          {tab === 'clusters' && <ClustersList items={clusterList} ui={ui} />}
        </div>
      </div>
        </>
      )}

      <PhotoLightbox
        open={lb.open}
        onOpenChange={(o) => setLb(s => ({ ...s, open: o }))}
        photos={lb.photos}
        startIndex={lb.idx}
        caption={lb.caption}
      />
    </div>
  );
}

// ── Sub-lists ────────────────────────────────────────────────────────────────

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="py-10 text-center italic text-[#94A3B8] text-[12px]">
      {label}
    </div>
  );
}

function SitesList({
  items, getPhotosFor, onOpenLightbox, ui,
}: {
  items: any[];
  getPhotosFor: (uid: string) => string[];
  onOpenLightbox: (s: { open: boolean; photos: string[]; idx: number; caption: string }) => void;
  ui: any;
}) {
  if (items.length === 0) return <EmptyRow label="No tourism sites match the current filters." />;
  return (
    <div className="flex flex-col">
      {items.map((f: any) => {
        const p = f.properties;
        const photos = getPhotosFor(p.uid);
        const hero = photos[0];
        const catColor = CATEGORY_COLORS[p.site_cat] || '#8A8275';
        const tier = p.perf_tier;
        const showTier = tier && tier !== 'Minor' && tier !== 'Unrated';
        const rating = p.rating && p.rating !== 'NULL' && p.rating !== 0 ? p.rating : null;
        const nRatings =
          p.n_ratings && p.n_ratings !== 'NULL' && Number(p.n_ratings) > 0 ? Number(p.n_ratings) : null;
        const highlighted = ui.highlightedSiteUid === p.uid;

        return (
          <button
            key={p.uid}
            onClick={() => {
              ui.setHighlightedSiteUid(p.uid);
              window.dispatchEvent(new CustomEvent('tourism:fly-to-site', { detail: { uid: p.uid } }));
            }}
            className={`relative w-full text-left flex gap-2 items-center px-1.5 py-1.5 rounded-md transition-colors ${
              highlighted ? 'bg-[#FFFBEB]' : 'hover:bg-white/70'
            }`}
          >
            <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r" style={{ background: catColor }} />
            {hero ? (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLightbox({ open: true, photos, idx: 0, caption: p.name || '' });
                }}
                className="w-10 h-10 shrink-0 bg-center bg-cover rounded ml-1 cursor-zoom-in"
                style={{ backgroundImage: `url("${hero}")` }}
              />
            ) : (
              <div className="w-10 h-10 shrink-0 bg-[#F1F5F9] rounded ml-1 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1.5">
                <div className="text-[11.5px] font-semibold leading-tight flex-1 line-clamp-1 text-[#0F172A]">
                  {p.name || '—'}
                </div>
                {showTier && (
                  <span
                    className="px-1 py-[1px] text-[8.5px] uppercase tracking-wider font-bold shrink-0 mt-0.5 rounded"
                    style={{
                      background: TIER_BADGE[tier]?.bg || '#E2E8F0',
                      color: TIER_BADGE[tier]?.fg || '#475569',
                    }}
                  >
                    {tier}
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#64748B] truncate">
                {rating ? (
                  <>
                    <Star className="w-2.5 h-2.5 fill-[#D97706] text-[#D97706]" />
                    <span className="font-medium text-[#0F172A] tabular-nums">{rating}</span>
                    {nRatings && (
                      <span className="text-[#94A3B8] tabular-nums">
                        ({nRatings.toLocaleString()})
                      </span>
                    )}
                    <span className="text-[#CBD5E1]">·</span>
                  </>
                ) : null}
                <span className="truncate">{p.site_cat} · {p.lgu}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function HospitalityList({
  items, bookingItems, getAssetPhotosFor, getBookingPhotosFor, onOpenLightbox, ui,
}: {
  items: any[];
  bookingItems: any[];
  getAssetPhotosFor: (uid: string) => string[];
  getBookingPhotosFor: (bk_id: string) => string[];
  onOpenLightbox: (s: { open: boolean; photos: string[]; idx: number; caption: string }) => void;
  ui: any;
}) {
  if (items.length === 0 && bookingItems.length === 0) return <EmptyRow label="No hospitality assets match the current filters." />;
  return (
    <div className="flex flex-col">
      {items.map((f: any) => {
        const p = f.properties;
        const tier = p.asset_tier;
        const tierTheme = TIER_BADGE[tier] || { bg: '#E2E8F0', fg: '#475569' };
        const accent = tier === 'Premium' ? '#EA580C' : '#F59E0B';
        const rating = p.rating && p.rating !== 'NULL' && p.rating !== 0 ? p.rating : null;
        const nRatings =
          p.n_ratings && p.n_ratings !== 'NULL' && Number(p.n_ratings) > 0 ? Number(p.n_ratings) : null;
        const highlighted = ui.highlightedSiteUid === p.uid;
        const photos = getAssetPhotosFor(p.uid);
        const hero = photos[0];

        return (
          <button
            key={p.uid}
            onClick={() => {
              ui.setHighlightedSiteUid(p.uid);
              window.dispatchEvent(new CustomEvent('tourism:fly-to-site', { detail: { uid: p.uid } }));
            }}
            className={`relative w-full text-left flex gap-2 items-center px-1.5 py-1.5 rounded-md transition-colors ${
              highlighted ? 'bg-[#FFF7ED]' : 'hover:bg-white/70'
            }`}
          >
            <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r" style={{ background: accent }} />
            {hero ? (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLightbox({ open: true, photos, idx: 0, caption: p.name || '' });
                }}
                className="w-10 h-10 shrink-0 bg-center bg-cover rounded ml-1 cursor-zoom-in"
                style={{ backgroundImage: `url(\"${hero}\")` }}
              />
            ) : (
              <div
                className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center ml-1"
                style={{ background: tierTheme.bg }}
              >
                {tier === 'Premium' ? (
                  <Crown className="w-3.5 h-3.5" style={{ color: tierTheme.fg }} />
                ) : (
                  <Hotel className="w-3.5 h-3.5" style={{ color: tierTheme.fg }} />
                )}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1.5">
                <div className="text-[11.5px] font-semibold leading-tight flex-1 line-clamp-1 text-[#0F172A]">
                  {p.name || '—'}
                </div>
                {tier && (
                  <span
                    className="px-1 py-[1px] text-[8.5px] uppercase tracking-wider font-bold shrink-0 mt-0.5 rounded"
                    style={{ background: tierTheme.bg, color: tierTheme.fg }}
                  >
                    {tier}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#64748B] truncate">
                {rating ? (
                  <>
                    <Star className="w-2.5 h-2.5 fill-[#D97706] text-[#D97706]" />
                    <span className="font-medium text-[#0F172A] tabular-nums">{rating}</span>
                    {nRatings && (
                      <span className="text-[#94A3B8] tabular-nums">
                        ({nRatings.toLocaleString()})
                      </span>
                    )}
                    <span className="text-[#CBD5E1]">·</span>
                  </>
                ) : null}
                <span className="truncate">{p.asset_cat || p.subcat || '—'} · {p.lgu}</span>
              </div>
            </div>
          </button>
        );
      })}

      {/* ── Airbnb accommodations ── */}
      {bookingItems.length > 0 && items.length > 0 && (
        <div className="flex items-center gap-2 px-1.5 pt-2 pb-1">
          <div className="h-px flex-1 bg-[#E2E8F0]" />
          <span className="text-[9px] font-semibold text-[#FF5A5F] uppercase tracking-wider">Airbnb</span>
          <div className="h-px flex-1 bg-[#E2E8F0]" />
        </div>
      )}
      {bookingItems.map((f: any) => {
        const p = f.properties;
        const photos = getBookingPhotosFor(p.bk_id);
        const hero = photos[0];
        const rating = p.rating && p.rating !== 'NULL' && Number(p.rating) > 0 ? Number(p.rating) : null;
        const price = p.price && p.price !== 'NULL' && p.price !== 'N/A' ? p.price : null;
        const coords = f.geometry?.coordinates;

        return (
          <button
            key={p.bk_id}
            onClick={() => {
              if (coords) {
                window.dispatchEvent(new CustomEvent('tourism:fly-to-booking', {
                  detail: { bk_id: p.bk_id, lngLat: [coords[0], coords[1]], props: p },
                }));
              }
            }}
            className="relative w-full text-left flex gap-2 items-center px-1.5 py-1.5 rounded-md transition-colors hover:bg-white/70"
          >
            <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r" style={{ background: '#FF5A5F' }} />
            {hero ? (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLightbox({ open: true, photos, idx: 0, caption: p.name || '' });
                }}
                className="w-10 h-10 shrink-0 bg-center bg-cover rounded ml-1 cursor-zoom-in"
                style={{ backgroundImage: `url("${hero}")` }}
              />
            ) : (
              <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center ml-1 bg-[#FFE4E6]">
                <Hotel className="w-3.5 h-3.5 text-[#FF5A5F]" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1.5">
                <div className="text-[11.5px] font-semibold leading-tight flex-1 line-clamp-1 text-[#0F172A]">
                  {p.name || '—'}
                </div>
                <span
                  className="px-1 py-[1px] text-[8px] uppercase tracking-wider font-bold shrink-0 mt-0.5 rounded"
                  style={{ background: '#FFE4E6', color: '#BE123C' }}
                >
                  Airbnb
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#64748B] truncate">
                {rating ? (
                  <>
                    <Star className="w-2.5 h-2.5 fill-[#2563EB] text-[#2563EB]" />
                    <span className="font-medium text-[#0F172A] tabular-nums">{rating.toFixed(1)}</span>
                    <span className="text-[#CBD5E1]">·</span>
                  </>
                ) : null}
                {price ? (
                  <span className="font-medium text-[#166534]">{price}</span>
                ) : (
                  <span className="truncate">{p.address || '—'}</span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ClustersList({ items, ui }: { items: any[]; ui: any }) {
  if (items.length === 0) return <EmptyRow label="No clusters match the current filters." />;

  // Group items by tier (Primary → Emerging → Satellite).
  const TIER_ORDER: Array<'Primary' | 'Emerging' | 'Satellite'> = ['Primary', 'Emerging', 'Satellite'];
  const grouped: Record<string, any[]> = { Primary: [], Emerging: [], Satellite: [], Other: [] };
  items.forEach((f: any) => {
    const t = f.properties?.tier;
    if (t === 'Primary' || t === 'Emerging' || t === 'Satellite') grouped[t].push(f);
    else grouped.Other.push(f);
  });

  const TIER_ACCENT: Record<string, string> = {
    Primary:   '#B47228',
    Emerging:  '#C84A35',
    Satellite: '#5C7A87',
  };

  const renderRow = (f: any) => {
        const p = f.properties;
        const tier = p.tier;
        const tierTheme = TIER_BADGE[tier] || { bg: '#E2E8F0', fg: '#475569' };
        const accent = TIER_ACCENT[tier] ?? '#5C7A87';
        const selected = ui.selectedClusterId === p.cluster_id;
        const priority = p.priority ? `P${p.priority}` : '';
        const nAnchor = p.n_anchor ?? 0;
        const nSecondary = p.n_secondary ?? 0;
        const nPremium = p.n_prem ?? 0;

        return (
          <button
            key={p.cluster_id}
            onClick={() => {
              ui.setSelectedClusterId(p.cluster_id);
              window.dispatchEvent(
                new CustomEvent('tourism:fly-to-cluster', { detail: { cluster_id: p.cluster_id } })
              );
            }}
            className={`relative w-full text-left flex gap-2 items-center px-1.5 py-1.5 rounded-md transition-colors ${
              selected ? 'bg-[#FEFCE8]' : 'hover:bg-white/70'
            }`}
          >
            <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r" style={{ background: accent }} />
            <div
              className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ml-1"
              style={
                priority
                  ? { background: accent, color: '#fff' }
                  : { background: tierTheme.bg, color: tierTheme.fg }
              }
            >
              {priority || <Sparkles className="w-3.5 h-3.5" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1.5">
                <div className="text-[11.5px] font-semibold leading-tight flex-1 line-clamp-1 text-[#0F172A]">
                  {p.name || '—'}
                </div>
                {tier && (
                  <span
                    className="px-1 py-[1px] text-[8.5px] uppercase tracking-wider font-bold shrink-0 mt-0.5 rounded"
                    style={{ background: tierTheme.bg, color: tierTheme.fg }}
                  >
                    {tier}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#64748B] tabular-nums">
                {nAnchor > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Award className="w-2.5 h-2.5 text-[#D97706]" />
                    {nAnchor}
                  </span>
                )}
                {nSecondary > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 text-[#F59E0B]" />
                    {nSecondary}
                  </span>
                )}
                {nPremium > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5 text-[#EA580C]" />
                    {nPremium}
                  </span>
                )}
                <span className="text-[#CBD5E1]">·</span>
                <span className="truncate">{p.lgu || '—'}</span>
              </div>
            </div>
          </button>
        );
  };

  return (
    <div className="flex flex-col">
      {TIER_ORDER.map((tier) => {
        const list = grouped[tier];
        if (!list || list.length === 0) return null;
        const accent = TIER_ACCENT[tier];
        return (
          <div key={tier} className="mb-1.5">
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-1.5 py-1 mb-0.5 backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.85)' }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: accent }}
                />
                <span
                  className="text-[9.5px] uppercase tracking-[0.08em] font-bold"
                  style={{ color: accent }}
                >
                  {tier} clusters
                </span>
              </div>
              <span className="text-[9.5px] font-semibold tabular-nums text-[#94A3B8]">
                {list.length}
              </span>
            </div>
            {list.map(renderRow)}
          </div>
        );
      })}
      {grouped.Other.length > 0 && grouped.Other.map(renderRow)}
    </div>
  );
}
