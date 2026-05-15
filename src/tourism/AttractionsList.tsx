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
  Anchor: '#1F2738',
  Secondary: '#4A4137',
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
    return <div className="p-6 text-center italic text-stone-500 text-[12px]">
      No attractions match the current filters.
    </div>;
  }

  return (
    <div className="flex flex-col">
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
            className={`relative flex flex-col px-5 py-3 border-b border-stone-300 cursor-pointer transition-colors ${
              highlighted ? 'bg-amber-50' : 'bg-white hover:bg-stone-100'
            }`}
            onClick={() => {
              ui.setHighlightedSiteUid(p.uid);
              // Flying / opening popup will be handled by a separate effect in TourismLayers
              // For now, just highlight in list. We'll wire the fly-to in a small companion hook.
              window.dispatchEvent(new CustomEvent('tourism:fly-to-site', { detail: { uid: p.uid } }));
            }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: catColor }} />
            <div className="flex gap-3">
              {hero ? (
                <div
                  className="w-16 h-16 shrink-0 bg-center bg-cover border border-stone-300 cursor-zoom-in"
                  style={{ backgroundImage: `url("${hero}")` }}
                  onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
                />
              ) : (
                <div className="w-16 h-16 shrink-0 bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-400 text-lg">
                  ○
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <div className="font-serif text-[13px] font-medium leading-tight flex-1 line-clamp-2">
                    {p.name || '—'}
                  </div>
                  {showTierBadge && (
                    <span
                      className="px-1.5 py-px text-[8.5px] uppercase tracking-widest font-semibold shrink-0 mt-0.5 text-stone-50"
                      style={{ background: TIER_BADGE_BG[tier] || '#E3DAC8', color: TIER_BADGE_BG[tier] ? '#F6F1E8' : '#4A4137' }}
                    >
                      {tier}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[12.5px] font-medium flex items-center gap-1.5">
                  {rating ? (
                    <>
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span className="text-slate-900">{rating}</span>
                      {nRatings && (
                        <span className="text-stone-500 font-normal text-[11.5px]">
                          {nRatings.toLocaleString()} reviews
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-stone-500 italic text-[11.5px] font-normal">No rating</span>
                  )}
                </div>
                <div className="mt-0.5 font-mono text-[10.5px] text-stone-500">
                  {p.site_cat} · {p.lgu}{p.brgy ? ` / ${p.brgy}` : ''}
                </div>
              </div>
            </div>
            {photos.length > 1 && (
              <div className="mt-1.5 flex gap-1 ml-[76px]">
                {photos.slice(1, 5).map((url, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 bg-center bg-cover border border-stone-300 cursor-zoom-in hover:scale-110 transition-transform"
                    style={{ backgroundImage: `url("${url}")` }}
                    onClick={(e) => { e.stopPropagation(); openLightbox(i + 1); }}
                    title={`Photo ${i + 2}`}
                  />
                ))}
                {photos.length > 5 && (
                  <div
                    className="w-9 h-9 bg-stone-100 border border-stone-300 flex items-center justify-center text-[11px] text-stone-500 font-mono cursor-zoom-in"
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
