// Tourism module — Reusable photo gallery
// Two modes:
//   - Inline carousel (in popups, attraction rows)
//   - Lightbox dialog (full-screen viewer with prev/next)
//
// Uses Radix Dialog for the lightbox and a simple manual carousel
// (avoids embla complexity for our needs).

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogClose } from '../components/ui/dialog';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

interface PhotoCarouselProps {
  photos: string[];           // photo URLs
  altPrefix?: string;
  className?: string;
  height?: number;
  onZoom?: (idx: number) => void;
}

/** Inline carousel — used in popups and attraction list rows */
export function PhotoCarousel({ photos, altPrefix = 'Photo', className = '', height = 160, onZoom }: PhotoCarouselProps) {
  const [idx, setIdx] = useState(0);
  if (photos.length === 0) return null;

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i + 1) % photos.length); };
  const zoom = (e: React.MouseEvent) => { e.stopPropagation(); onZoom?.(idx); };

  return (
    <div
      className={`relative w-full overflow-hidden border border-stone-300 bg-stone-100 ${className}`}
      style={{ height }}
    >
      <div
        className="w-full h-full bg-center bg-cover cursor-zoom-in transition-[background-image] duration-200"
        style={{ backgroundImage: `url("${photos[idx]}")` }}
        onClick={zoom}
        role="img"
        aria-label={`${altPrefix} ${idx + 1} of ${photos.length}`}
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-white/70 hover:bg-white/95 text-white transition-colors"
            aria-label="Previous photo"
          ><ChevronLeft className="w-4 h-4"/></button>
          <button
            onClick={next}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-white/70 hover:bg-white/95 text-white transition-colors"
            aria-label="Next photo"
          ><ChevronRight className="w-4 h-4"/></button>
          <div className="absolute top-1.5 right-2 px-1.5 py-0.5 text-[10px] font-mono text-white bg-white/70 tracking-wider">
            {idx + 1} / {photos.length}
          </div>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, i) => (
              <span key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/50'}`}/>
            ))}
          </div>
        </>
      )}
      {onZoom && (
        <div className="absolute bottom-1.5 right-2 px-1.5 py-0.5 text-[10px] text-white bg-white/70 flex items-center gap-1 pointer-events-none">
          <ZoomIn className="w-3 h-3"/> click to zoom
        </div>
      )}
    </div>
  );
}

interface LightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: string[];
  startIndex?: number;
  caption?: string;
}

/** Full-screen lightbox with prev/next keyboard nav */
export function PhotoLightbox({ open, onOpenChange, photos, startIndex = 0, caption = '' }: LightboxProps) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => { if (open) setIdx(startIndex); }, [open, startIndex]);

  const navPrev = useCallback(() => setIdx(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const navNext = useCallback(() => setIdx(i => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  navPrev();
      if (e.key === 'ArrowRight') navNext();
      if (e.key === 'Escape')     onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, navPrev, navNext, onOpenChange]);

  if (photos.length === 0) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] !p-0 !bg-white/95 !border-0 !rounded-none">
        <div className="relative w-full h-[90vh] flex items-center justify-center">
          {caption && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/60 text-white text-base font-serif font-medium max-w-[80vw] text-center">
              {caption}
            </div>
          )}
          <DialogClose className="absolute top-4 right-5 text-white hover:opacity-80 z-10">
            <X className="w-7 h-7"/>
          </DialogClose>
          {photos.length > 1 && (
            <>
              <button onClick={navPrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/30 text-white"
                aria-label="Previous photo">
                <ChevronLeft className="w-7 h-7"/>
              </button>
              <button onClick={navNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/30 text-white"
                aria-label="Next photo">
                <ChevronRight className="w-7 h-7"/>
              </button>
              <div className="absolute bottom-7 left-1/2 -translate-x-1/2 px-3.5 py-1.5 text-white font-mono text-sm bg-black/50 tracking-wider">
                {idx + 1} / {photos.length}
              </div>
            </>
          )}
          <img src={photos[idx]} alt={caption || `Photo ${idx + 1}`}
            className="max-w-[95vw] max-h-[88vh] object-contain shadow-2xl" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
