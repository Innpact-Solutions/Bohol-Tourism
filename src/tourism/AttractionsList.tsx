// Tourism module — Attractions list (sidebar Attractions tab)
// Each row: hero photo, name, tier badge, ★ rating + Google review count,
// category + LGU + barangay context, photo thumb strip when more photos.

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useTourismData } from './TourismContext';
import { useTourismUI } from './tourismStore';
import { CATEGORY_COLORS } from './styles';
import { PhotoLightbox } from './PhotoGallery';
import type { SiteFeature } from './types';

const TIER_BADGE_BG: Record<string, string> = {
  Anchor: '#FCD34D',
  Secondary: '#FDE68A',
};
const TIER_BADGE_FG: Record<string, string> = {
  Anchor: '#78350F',
  Secondary: '#92400E',
};

export function AttractionsList() {
  const { sites, getPhotosFor } = useTourismData();
  const ui = useTourismUI();
  const [lb, setLb] = useState<{ open: boolean; photos: string[]; idx: number; caption: string }>({
    open: false, photos: [], idx: 0, caption: '',
  });

  if (!sites) return null;

  // Filter + sort
  const filtered: SiteFeature[] = sites.features.filter((f) => {
    const p = f.properties as any;
    if (p.site_cat === 'EXCLUDED') return false;
    if (ui.lgu !== 'All' && p.lgu !== ui.lgu) return false;
    if (ui.categories.size > 0 && !ui.categories.has(p.site_cat)) return false;
    if (ui.search) {
      if (!(p.name || '').toLowerCase().includes(ui.search.toLowerCase())) return false;
    }
    return true;
  }) as SiteFeature[];

  filtered.sort((a, b) => {
    const sa = (a.properties as any).perf_score || 0;
    const sb = (b.properties as any).perf_score || 0;
    if (sb !== sa) return sb - sa;
    const na = Number((a.properties as any).n_ratings || 0);
    const nb = Number((b.properties as any).n_ratings || 0);
    return nb - na;
  });

  if (filtered.length === 0) {
    return <div className="p-6 text-center italic text-[#94A3B8] text-[12px]">
      No attractions match the current filters.
    </div>;
  }

  return (
    <div className="flex flex-col" style={{ fontFamily: 'DM Sans, Segoe UI, sans-serif' }}>
      {filtered.map((f) => {
        const p = f.properties as any;
        const photos = getPhotosFor(p.uid);
        const hero = photos[0];
        const catColor = CATEGORY_COLORS[p.site_cat] || '#8A8275';
        const rating = p.rating && p.rating !== 'NULL' && p.rating !== 0 ? p.rating : null;
        const nRatings =
          p.n_ratings && p.n_ratings !== 'NULL' && Number(p.n_ratings) > 0 ? Number(p.n_ratings) : null;
        const tier = p.perf_tier;
        const showTierBadge = tier && tier !== 'Minor' && tier !== 'Unrated';
        const highlighted = ui.highlightedSiteUid === p.uid;

        const openLightbox = (startIdx: number) => {
          setLb({ open: true, photos, idx: startIdx, caption: p.name || '' });
        };

        return (
          <div
            key={p.uid}
            className={`relative flex flex-col px-4 py-3 border-b border-[#E2E8F0] cursor-pointer transition-colors ${
              highlighted ? 'bg-[#FEF3C7]' : 'bg-white hover:bg-[#F8FAFC]'
            }`}
            onClick={() => {
              ui.setHighlightedSiteUid(p.uid);
              window.dispatchEvent(new CustomEvent('tourism:fly-to-site', { detail: { uid: p.uid } }));
            }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: catColor }} />
            <div className="flex gap-3">
              {hero ? (
                <div
                  className="w-16 h-16 shrink-0 bg-center bg-cover rounded-md border border-[#E2E8F0] cursor-zoom-in"
                  style={{ backgroundImage: `url("${hero}")` }}
                  onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
                />
              ) : (
                <div className="w-16 h-16 shrink-0 bg-[#F1F5F9] rounded-md border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] text-lg">
                  ○
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <div className="text-[13px] font-semibold leading-tight flex-1 line-clamp-2 text-[#0F172A]">
                    {p.name || '—'}
                  </div>
                  {showTierBadge && (
                    <span
                      className="px-1.5 py-0.5 text-[9px] uppercase tracking-widest font-bold shrink-0 mt-0.5 rounded-sm"
                      style={{
                        background: TIER_BADGE_BG[tier] || '#E2E8F0',
                        color: TIER_BADGE_FG[tier] || '#475569',
                      }}
                    >
                      {tier}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[12px] font-medium flex items-center gap-1.5">
                  {rating ? (
                    <>
                      <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                      <span className="text-[#0F172A] tabular-nums">{rating}</span>
                      {nRatings && (
                        <span className="text-[#64748B] font-normal text-[11px] tabular-nums">
                          {nRatings.toLocaleString()} reviews
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-[#94A3B8] italic text-[11px] font-normal">No rating</span>
                  )}
                </div>
                <div className="mt-0.5 text-[11px] text-[#64748B] truncate">
                  {p.site_cat} · {p.lgu}{p.brgy ? ` / ${p.brgy}` : ''}
                </div>
              </div>
            </div>
            {photos.length > 1 && (
              <div className="mt-1.5 flex gap-1 ml-[76px]">
                {photos.slice(1, 5).map((url, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 bg-center bg-cover rounded border border-[#E2E8F0] cursor-zoom-in hover:scale-105 transition-transform"
                    style={{ backgroundImage: `url("${url}")` }}
                    onClick={(e) => { e.stopPropagation(); openLightbox(i + 1); }}
                    title={`Photo ${i + 2}`}
                  />
                ))}
                {photos.length > 5 && (
                  <div
                    className="w-9 h-9 bg-[#F1F5F9] rounded border border-[#E2E8F0] flex items-center justify-center text-[11px] text-[#64748B] tabular-nums cursor-zoom-in"
                    onClick={(e) => { e.stopPropagation(); openLightbox(5); }}
                  >
                    +{photos.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <PhotoLightbox
        open={lb.open}
        onOpenChange={(open) => setLb((s) => ({ ...s, open }))}
        photos={lb.photos}
        startIndex={lb.idx}
        caption={lb.caption}
      />
    </div>
  );
}
