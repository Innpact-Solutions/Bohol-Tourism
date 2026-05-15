// Tourism module — popup content shown when clicking a cluster polygon on the map.
// Compact card: hero image with next/prev nav + cluster name. Nothing else.

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  name: string;
  photos: string[];
}

export function TourismClusterPopupContent({ name, photos }: Props) {
  const [idx, setIdx] = useState(0);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i - 1 + photos.length) % photos.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i + 1) % photos.length);
  };

  return (
    <div className="w-[240px] text-[#0F172A]">
      {photos.length > 0 && (
        <div className="relative w-full bg-stone-900 overflow-hidden" style={{ height: 130 }}>
          {photos.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover select-none"
              style={{
                opacity: i === idx ? 1 : 0,
                transition: 'opacity 220ms ease',
                zIndex: i === idx ? 1 : 0,
              }}
            />
          ))}
          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous photo"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-black/45 hover:bg-black/70 text-white backdrop-blur-sm transition-colors shadow z-10"
              >
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
              <button
                onClick={next}
                aria-label="Next photo"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-black/45 hover:bg-black/70 text-white backdrop-blur-sm transition-colors shadow z-10"
              >
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
              <div className="absolute bottom-1.5 right-1.5 bg-black/45 text-white text-[9.5px] px-1.5 py-0.5 rounded backdrop-blur-sm z-10 tabular-nums">
                {idx + 1} / {photos.length}
              </div>
            </>
          )}
        </div>
      )}

      <div className="px-2.5 py-2">
        <div className="text-[13.5px] font-semibold leading-snug text-[#0F172A] pr-5">
          {name}
        </div>
      </div>
    </div>
  );
}
