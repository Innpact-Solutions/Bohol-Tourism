// Tourism module — popup content shown when clicking a cluster polygon on the map.
// Compact card: hero image gallery (cycling across anchor / secondary / supportive
// sites of the cluster) with per-photo site name + tier badge, and cluster name.

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PhotoLightbox } from './PhotoGallery';

export interface ClusterPopupPhoto {
  url: string;
  siteName: string;
  tier: 'Anchor' | 'Secondary' | 'Supportive' | string;
}

interface Props {
  name: string;
  photos: ClusterPopupPhoto[];
}

const tierStyle = (tier: string) => {
  switch (tier) {
    case 'Anchor':     return 'bg-[#7C3AED] text-white';      // violet
    case 'Secondary':  return 'bg-[#2563EB] text-white';      // blue
    case 'Supportive': return 'bg-[#0EA5E9] text-white';      // sky
    default:           return 'bg-black/55 text-white';
  }
};

export function TourismClusterPopupContent({ name, photos }: Props) {
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i - 1 + photos.length) % photos.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i + 1) % photos.length);
  };
  const openLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightbox(true);
  };

  const current = photos[idx];

  return (
    <div className="w-[260px] text-[#0F172A]">
      {photos.length > 0 && (
        <div
          className="relative w-full bg-stone-900 overflow-hidden cursor-zoom-in"
          style={{ height: 150 }}
          onClick={openLightbox}
          role="button"
          aria-label="Open photo full screen"
        >
          {photos.map((p, i) => (
            <img
              key={`${p.url}-${i}`}
              src={p.url}
              alt={p.siteName}
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover select-none"
              style={{
                opacity: i === idx ? 1 : 0,
                transition: 'opacity 220ms ease',
                zIndex: i === idx ? 1 : 0,
              }}
            />
          ))}

          {/* Tier badge (top-left) */}
          {current && (
            <div className="absolute top-1.5 left-1.5 z-10">
              <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded shadow ${tierStyle(current.tier)}`}>
                {current.tier}
              </span>
            </div>
          )}

          {/* Site name caption (bottom strip) */}
          {current && (
            <div className="absolute left-0 right-0 bottom-0 z-10 px-2 py-1.5 bg-gradient-to-t from-black/80 via-black/45 to-transparent">
              <div className="text-[11px] font-medium text-white leading-tight line-clamp-2">
                {current.siteName}
              </div>
            </div>
          )}

          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous photo"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-black/45 hover:bg-black/70 text-white backdrop-blur-sm transition-colors shadow z-20"
              >
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
              <button
                onClick={next}
                aria-label="Next photo"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-black/45 hover:bg-black/70 text-white backdrop-blur-sm transition-colors shadow z-20"
              >
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>
      )}

      <div className="px-2.5 py-2">
        <div className="text-[13.5px] font-semibold leading-snug text-[#0F172A]">
          {name}
        </div>
      </div>

      <PhotoLightbox
        open={lightbox}
        onOpenChange={setLightbox}
        photos={photos.map((p) => p.url)}
        startIndex={idx}
        caption={current ? `${current.siteName} — ${name}` : name}
      />
    </div>
  );
}
