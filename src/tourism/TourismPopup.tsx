// Tourism module — popup content shown when clicking a site/asset on the map.
// Rendered into a MapLibre Popup via createRoot in usePopupBinding.

import React, { useState } from 'react';
import { Star, MapPin, ExternalLink } from 'lucide-react';
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

export function TourismPopupContent({ poi, photos }: Props) {
  const [lightbox, setLightbox] = useState(false);
  const [lbIdx, setLbIdx] = useState(0);

  const rating = poi.rating && poi.rating !== 'NULL' && poi.rating !== 0 ? poi.rating : null;
  const nRatings =
    poi.n_ratings && poi.n_ratings !== 'NULL' && Number(poi.n_ratings) > 0
      ? Number(poi.n_ratings)
      : null;

  const cat = poi.site_cat || poi.asset_cat || '';
  const tier = poi.perf_tier || poi.asset_tier || '';
  const catColor = CATEGORY_COLORS[cat] || '#8A8275';

  return (
    <div className="font-sans text-slate-800 min-w-[240px] max-w-[280px]">
      {/* Header */}
      <div className="font-serif text-[15px] font-medium leading-tight text-slate-900 mb-1">
        {poi.name || '—'}
      </div>
      <div className="font-mono text-[10.5px] text-stone-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 flex-wrap">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: catColor }} />
        <span>{cat}</span>
        {tier && <span>· {tier}</span>}
        {poi.lgu && <span>· {poi.lgu}</span>}
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="mb-2.5">
          <PhotoCarousel
            photos={photos}
            altPrefix={poi.name || 'Photo'}
            height={140}
            onZoom={(i) => { setLbIdx(i); setLightbox(true); }}
          />
        </div>
      )}

      {/* Rating */}
      <div className="text-[13px] font-medium text-slate-900 flex items-center gap-1.5">
        {rating ? (
          <>
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{rating}</span>
            {nRatings && (
              <span className="text-stone-500 font-normal text-[11px]">
                {nRatings.toLocaleString()} reviews
              </span>
            )}
          </>
        ) : (
          <span className="text-stone-500 italic font-normal text-[11.5px]">No rating</span>
        )}
      </div>

      {/* Vicinity */}
      {poi.vicinity && (
        <div className="mt-1.5 text-[11px] text-stone-600 flex items-start gap-1">
          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-60" />
          <span>{poi.vicinity}</span>
        </div>
      )}

      {/* Actions */}
      {poi.gmap_url && (
        <a
          href={poi.gmap_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-medium bg-slate-900 hover:bg-black text-stone-50 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Open in Google Maps
        </a>
      )}

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
