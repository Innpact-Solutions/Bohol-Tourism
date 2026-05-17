// Tourism module — popup content shown when clicking a site/asset on the map.
// Rendered into a MapLibre Popup via createRoot in usePopupBinding.

import React, { useState } from 'react';
import { Star, MapPin, ExternalLink, Camera } from 'lucide-react';
import { PhotoCarousel, PhotoLightbox } from './PhotoGallery';
import { CATEGORY_COLORS } from './styles';

interface PopupPOI {
  uid?: string;
  bk_id?: string;
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
  // Booking.com accommodation fields
  address?: string;
  price?: string;
  source?: string;
  url?: string;
}

interface Props {
  poi: PopupPOI;
  photos: string[];
}

function tierBadge(tier: string): { bg: string; fg: string } {
  switch (tier) {
    case 'Anchor':     return { bg: '#FCD34D', fg: '#78350F' };
    case 'Secondary':  return { bg: '#FDE68A', fg: '#92400E' };
    case 'Supportive': return { bg: '#FEF3C7', fg: '#A16207' };
    case 'Premium':    return { bg: '#FED7AA', fg: '#9A3412' };
    case 'Quality':    return { bg: '#FFEDD5', fg: '#C2410C' };
    default:           return { bg: '#E2E8F0', fg: '#475569' };
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
  const accent = tierBadge(tier);
  const isAsset = !!poi.asset_tier;
  const isBooking = !!poi.bk_id;
  // Hospitality assets fall back to the compact, image-less card only when no
  // photo is available (e.g. older deploys before the Google Places backfill
  // ran). When photos are present, hotels render the same hero-image layout
  // as tourism sites for visual parity.
  const compact = isAsset && photos.length === 0 && !isBooking;

  // ── Booking.com accommodation card ──────────────────────────────────────
  if (isBooking) {
    const bookingRating = poi.rating && poi.rating !== 'NULL' && Number(poi.rating) > 0 ? Number(poi.rating) : null;
    const bookingPrice = poi.price && poi.price !== 'NULL' && poi.price !== 'N/A' ? poi.price : null;

    return (
      <div
        className="w-[300px] text-[#0F172A]"
        style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
      >
        {/* Photo header */}
        <div className="relative">
          {photos.length > 0 ? (
            <PhotoCarousel
              photos={photos}
              altPrefix={poi.name || 'Accommodation'}
              height={160}
              onZoom={(i) => { setLbIdx(i); setLightbox(true); }}
            />
          ) : (
            <div
              className="h-[120px] flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #DBEAFE 0%, #E2E8F0 100%)' }}
            >
              <Camera className="w-7 h-7 text-[#94A3B8]" />
            </div>
          )}
          <div
            className="absolute inset-0 pointer-events-none z-[5]"
            style={{
              background: 'linear-gradient(to bottom, rgba(15,23,42,0) 30%, rgba(15,23,42,0.85) 100%)',
            }}
          />
          {/* Booking.com badge */}
          <div
            className="absolute top-2 left-2 px-1.5 py-[2px] rounded text-[8.5px] uppercase tracking-wider font-bold z-[6] pointer-events-none"
            style={{ color: '#fff', background: '#2563EB' }}
          >
            Booking.com
          </div>
          {/* Title */}
          <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 pt-8 pointer-events-none z-[6]">
            <div
              className="text-[16px] font-semibold leading-snug text-white"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
            >
              {poi.name || '—'}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-3.5 py-3 space-y-2.5">
          {/* Rating + Price row */}
          <div className="flex items-center gap-2 flex-wrap">
            {bookingRating !== null && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#EFF6FF] border border-[#93C5FD]">
                <Star className="w-3.5 h-3.5 fill-[#2563EB] text-[#2563EB]" />
                <span className="text-[12px] font-semibold text-[#1D4ED8]">{bookingRating.toFixed(1)}</span>
              </div>
            )}
            {bookingPrice && (
              <span className="px-2 py-1 rounded-md bg-[#F0FDF4] border border-[#86EFAC] text-[12px] font-semibold text-[#166534]">
                {bookingPrice}
              </span>
            )}
          </div>

          {/* Address */}
          {poi.address && (
            <div className="flex items-start gap-1.5 text-[11.5px] text-[#475569] leading-snug">
              <MapPin className="w-3.5 h-3.5 mt-[1px] flex-shrink-0 text-[#94A3B8]" />
              <span className="flex-1">{poi.address}</span>
            </div>
          )}

          {/* CTA — Booking.com link */}
          {poi.url && (
            <a
              href={poi.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 text-[12px] font-semibold rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View on Booking.com
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

  if (compact) {
    return (
      <div
        className="w-[240px] text-[#0F172A]"
        style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
      >
        {/* Compact header — tier badge, category dot, title; no photo */}
        <div className="px-3 pt-2.5 pb-2 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-1.5 mb-1">
            {tier && (
              <span
                className="px-1 py-[1px] rounded text-[8.5px] uppercase tracking-wider font-bold flex-shrink-0"
                style={{ color: accent.fg, background: accent.bg }}
              >
                {tier}
              </span>
            )}
            <span
              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: catColor }}
            />
            <span className="text-[10.5px] font-medium text-[#64748B] leading-none truncate">
              {cat || 'Asset'}
            </span>
          </div>
          <div className="text-[13.5px] font-semibold leading-snug text-[#0F172A]">
            {poi.name || '—'}
          </div>
        </div>

        {/* Body */}
        <div className="px-3 py-2.5 space-y-2">
          {/* Rating row */}
          {rating !== null ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FFF7ED] border border-[#FCD34D]">
                <Star className="w-3 h-3 fill-[#D97706] text-[#D97706]" />
                <span className="text-[11px] font-semibold text-[#B45309]">{rating.toFixed(1)}</span>
              </div>
              {nRatings !== null && (
                <span className="text-[10.5px] text-[#64748B]">
                  {nRatings.toLocaleString()} {nRatings === 1 ? 'review' : 'reviews'}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[10.5px] italic text-[#94A3B8]">Not yet rated</span>
          )}

          {/* Location */}
          {(poi.vicinity || poi.brgy || poi.lgu) && (
            <div className="flex items-start gap-1.5 text-[11px] text-[#475569] leading-snug">
              <MapPin className="w-3 h-3 mt-[2px] flex-shrink-0 text-[#94A3B8]" />
              <span className="flex-1">
                {poi.vicinity || [poi.brgy, poi.lgu].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          {/* CTA */}
          {poi.gmap_url && (
            <a
              href={poi.gmap_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center justify-center gap-1.5 w-full px-2.5 py-1.5 text-[11.5px] font-semibold rounded-md bg-[#B45309] hover:bg-[#92400E] text-white transition-colors shadow-sm"
            >
              <ExternalLink className="w-3 h-3" />
              Open in Google Maps
            </a>
          )}
        </div>
      </div>
    );
  }

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
            height={160}
            onZoom={(i) => { setLbIdx(i); setLightbox(true); }}
          />
        ) : (
          <div
            className="h-[120px] flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${catColor}33 0%, #E2E8F0 100%)` }}
          >
            <Camera className="w-7 h-7 text-[#94A3B8]" />
          </div>
        )}

        {/* Gradient overlay for readability */}
        <div
          className="absolute inset-0 pointer-events-none z-[5]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(15,23,42,0) 30%, rgba(15,23,42,0.85) 100%)',
          }}
        />

        {/* Tier badge (top-left) — matches Tourism Directory styling */}
        {tier && (
          <div
            className="absolute top-2 left-2 px-1 py-[1px] rounded text-[8.5px] uppercase tracking-wider font-bold z-[6] pointer-events-none"
            style={{
              color: accent.fg,
              background: accent.bg,
            }}
          >
            {tier}
          </div>
        )}

        {/* Title block over image */}
        <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 pt-8 pointer-events-none z-[6]">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: catColor, boxShadow: '0 0 0 1.5px rgba(255,255,255,0.85)' }}
            />
            <span className="text-[11px] font-medium text-white/90 leading-none">
              {cat || (isAsset ? 'Asset' : 'Site')}
            </span>
          </div>
          <div
            className="text-[16px] font-semibold leading-snug text-white"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
          >
            {poi.name || '—'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-3.5 py-3 space-y-2.5">
        {/* Rating row */}
        {rating !== null ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#FFF7ED] border border-[#FCD34D]">
              <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
              <span className="text-[12px] font-semibold text-[#B45309]">{rating.toFixed(1)}</span>
            </div>
            {nRatings !== null && (
              <span className="text-[11px] text-[#64748B]">
                {nRatings.toLocaleString()} {nRatings === 1 ? 'review' : 'reviews'}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] italic text-[#94A3B8]">Not yet rated</span>
        )}

        {/* Location */}
        {(poi.vicinity || poi.brgy || poi.lgu) && (
          <div className="flex items-start gap-1.5 text-[11.5px] text-[#475569] leading-snug">
            <MapPin className="w-3.5 h-3.5 mt-[1px] flex-shrink-0 text-[#94A3B8]" />
            <span className="flex-1">
              {poi.vicinity || [poi.brgy, poi.lgu].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {/* Brgy/LGU chips when vicinity is shown above */}
        {poi.vicinity && (poi.brgy || poi.lgu) && (
          <div className="flex flex-wrap gap-1">
            {poi.brgy && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                {poi.brgy}
              </span>
            )}
            {poi.lgu && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
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
            className="mt-0.5 inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 text-[12px] font-semibold rounded-md bg-[#B45309] hover:bg-[#92400E] text-white transition-colors shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
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
