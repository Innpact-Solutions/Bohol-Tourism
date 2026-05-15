// Tourism module — popup content shown when clicking a site/asset on the map.
// Rendered into a MapLibre Popup via createRoot in usePopupBinding.

import React, { useState } from 'react';
import { Star, MapPin, ExternalLink, Camera } from 'lucide-react';
import { PhotoCarousel, PhotoLightbox } from './PhotoGallery';
import { CATEGORY_COLORS } from './styles';

interface PopupPOI {
  uid?: string;
  name?: string;
  site_cat?: string;
  asset_cat?: string;
  perf_tier?: string;
  asset_tier?: string;
  lgu?: string;
  brgy?: string;
  rating?: number | string;
  n_ratings?: number | string;
  vicinity?: string;
  gmap_url?: string;
}

interface Props {
  poi: PopupPOI;
  photos: string[];
}

function tierAccent(tier: string): { fg: string; bg: string; ring: string } {
  switch (tier) {
    case 'Anchor':     return { fg: '#0B1120', bg: '#FCD34D', ring: '#FCD34D' };
    case 'Secondary':  return { fg: '#FCD34D', bg: 'rgba(252,211,77,0.12)', ring: 'rgba(252,211,77,0.55)' };
    case 'Supportive': return { fg: '#94A3B8', bg: 'rgba(148,163,184,0.12)', ring: 'rgba(148,163,184,0.5)' };
    case 'Premium':    return { fg: '#0B1120', bg: '#C47A1F', ring: '#C47A1F' };
    case 'Quality':    return { fg: '#C47A1F', bg: 'rgba(196,122,31,0.12)', ring: 'rgba(196,122,31,0.55)' };
    default:           return { fg: '#E2E8F0', bg: 'rgba(226,232,240,0.10)', ring: 'rgba(226,232,240,0.30)' };
  }
}

export function TourismPopupContent({ poi, photos }: Props) {
  const [lightbox, setLightbox] = useState(false);
  const [lbIdx, setLbIdx] = useState(0);

  const rating = poi.rating && poi.rating !== 'NULL' && Number(poi.rating) > 0 ? Number(poi.rating) : null;
  const nRatings =
    poi.n_ratings && poi.n_ratings !== 'NULL' && Number(poi.n_ratings) > 0
      ? Number(poi.n_ratings)
      : null;

  const cat = poi.site_cat || poi.asset_cat || '';
  const tier = poi.perf_tier || poi.asset_tier || '';
  const catColor = CATEGORY_COLORS[cat] || '#8A8275';
  const accent = tierAccent(tier);
  const isAsset = !!poi.asset_tier;

  return (
    <div
      className="w-[300px] text-[#0F172A]"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      {/* Photo header with overlay */}
      <div className="relative">
        {photos.length > 0 ? (
          <PhotoCarousel
            photos={photos}
            altPrefix={poi.name || 'Photo'}
            height={150}
            onZoom={(i) => { setLbIdx(i); setLightbox(true); }}
          />
        ) : (
          <div
            className="h-[110px] flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${catColor}33 0%, #E2E8F0 100%)` }}
          >
            <Camera className="w-7 h-7 text-[#94A3B8]" />
          </div>
        )}

        {/* Gradient overlay for readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(15,23,42,0) 35%, rgba(15,23,42,0.78) 100%)',
          }}
        />

        {/* Tier badge */}
        {tier && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              color: accent.fg,
              background: accent.bg,
              boxShadow: `inset 0 0 0 1px ${accent.ring}`,
            }}
          >
            {tier}
          </div>
        )}

        {/* Title block over image */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 pt-6">
          <div
            className="text-[15px] font-semibold leading-tight text-white"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
          >
            {poi.name || '—'}
          </div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: catColor, boxShadow: '0 0 0 1.5px rgba(255,255,255,0.8)' }}
            />
            <span className="text-[10.5px] font-medium uppercase tracking-wider text-white/90">
              {cat || (isAsset ? 'Asset' : 'Site')}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2.5 space-y-2">
        {/* Rating */}
        <div className="flex items-center gap-2">
          {rating !== null ? (
            <>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#FCD34D]/20 border border-[#D97706]/30">
                <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                <span className="text-[12px] font-bold text-[#B45309]">{rating.toFixed(1)}</span>
              </div>
              {nRatings !== null && (
                <span className="text-[10.5px] text-[#64748B]">
                  {nRatings.toLocaleString()} {nRatings === 1 ? 'review' : 'reviews'}
                </span>
              )}
            </>
          ) : (
            <span className="text-[10.5px] italic text-[#94A3B8]">Not yet rated</span>
          )}
        </div>

        {/* Location */}
        {(poi.vicinity || poi.brgy || poi.lgu) && (
          <div className="flex items-start gap-1.5 text-[11px] text-[#475569] leading-snug">
            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-[#94A3B8]" />
            <span className="flex-1">
              {poi.vicinity || [poi.brgy, poi.lgu].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {/* Brgy/LGU chips when vicinity is shown above */}
        {poi.vicinity && (poi.brgy || poi.lgu) && (
          <div className="flex flex-wrap gap-1">
            {poi.brgy && (
              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                {poi.brgy}
              </span>
            )}
            {poi.lgu && (
              <span className="px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                {poi.lgu}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        {poi.gmap_url && (
          <a
            href={poi.gmap_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center justify-center gap-1.5 w-full px-3 py-1.5 text-[11.5px] font-semibold rounded-md bg-[#B45309] hover:bg-[#92400E] text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Open in Google Maps
          </a>
        )}
      </div>

      <PhotoLightbox
        open={lightbox}
        onOpenChange={setLightbox}
        photos={photos}
        startIndex={lbIdx}
        caption={poi.name || ''}
      />
    </div>
  );
}
