/**
 * PanoramaViewerModal
 * ─────────────────────────────────────────────────────────────────
 * Full-screen 360° panorama viewer modal powered by Pannellum.
 * Rendered via a React Portal at document.body so it covers the
 * entire app (header, panels, map). The viewer is sized to preserve
 * the image's native aspect ratio (letterbox/pillarbox).
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';

/* ── Props ───────────────────────────────────────────────────── */
interface PanoramaViewerModalProps {
  imageUrl: string;
  title: string;
  description?: string;
  thumbnail?: string;
  onClose: () => void;
}

/* ── Dynamic script + CSS loader ────────────────────────────── */
const PANNELLUM_CSS_ID    = 'pannellum-css';
const PANNELLUM_SCRIPT_ID = 'pannellum-script';
let pannellumLoadPromise: Promise<void> | null = null;

function loadPannellum(): Promise<void> {
  if (pannellumLoadPromise) return pannellumLoadPromise;
  if (typeof window !== 'undefined' && window.pannellum) {
    pannellumLoadPromise = Promise.resolve();
    return pannellumLoadPromise;
  }
  pannellumLoadPromise = new Promise((resolve, reject) => {
    if (!document.getElementById(PANNELLUM_CSS_ID)) {
      const link = document.createElement('link');
      link.id   = PANNELLUM_CSS_ID;
      link.rel  = 'stylesheet';
      link.href = '/pannellum.css';
      document.head.appendChild(link);
    }
    if (document.getElementById(PANNELLUM_SCRIPT_ID)) {
      if (window.pannellum) { resolve(); return; }
      const check = setInterval(() => { if (window.pannellum) { clearInterval(check); resolve(); } }, 50);
      return;
    }
    const script   = document.createElement('script');
    script.id      = PANNELLUM_SCRIPT_ID;
    script.src     = '/pannellum.js';
    script.onload  = () => resolve();
    script.onerror = () => reject(new Error('Failed to load pannellum.js'));
    document.head.appendChild(script);
  });
  return pannellumLoadPromise;
}

/* ── Compute viewer box size preserving image aspect ratio ───── */
function computeBoxSize(imgW: number, imgH: number): { w: number; h: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const imgAspect = imgW / imgH;
  const vpAspect  = vw / vh;
  if (imgAspect > vpAspect) {
    // wider than viewport → fill width, letterbox top/bottom
    return { w: vw, h: vw / imgAspect };
  }
  // taller than viewport → fill height, pillarbox sides
  return { w: vh * imgAspect, h: vh };
}

/* ── Component ───────────────────────────────────────────────── */
export function PanoramaViewerModal({
  imageUrl,
  title,
  thumbnail,
  onClose,
}: PanoramaViewerModalProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const viewerRef     = useRef<Pannellum.Viewer | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [loading,      setLoading]      = useState(true);
  const [fadeOut,      setFadeOut]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [boxSize,      setBoxSize]      = useState<{ w: number; h: number }>(() => computeBoxSize(2, 1));
  const [progress,     setProgress]     = useState(0);
  const [thumbReady,   setThumbReady]   = useState(false); // true once thumbnail is loaded into browser cache

  /* ── Preload thumbnail + refine aspect ratio ────────────── */
  useEffect(() => {
    setThumbReady(false);
    const probeUrl = thumbnail || imageUrl;
    const probe = new Image();
    probe.onload = () => {
      if (probe.naturalWidth && probe.naturalHeight) {
        setBoxSize(computeBoxSize(probe.naturalWidth, probe.naturalHeight));
      }
      setThumbReady(true); // thumbnail is now in browser cache → show blurred bg
    };
    probe.onerror = () => setThumbReady(true); // show dark bg only
    probe.src = probeUrl;

    const onResize = () => {
      if (probe.complete && probe.naturalWidth) {
        setBoxSize(computeBoxSize(probe.naturalWidth, probe.naturalHeight));
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [imageUrl, thumbnail]);

  /* ── Mount Pannellum once box size is known ─────────────── */
  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    setLoading(true);
    setFadeOut(false);
    setError(null);
    setProgress(0);

    // ── Simulated progress: ramps quickly early, slows near 90 ──
    // Pannellum's load event fires when done → we jump to 100.
    const TICK_MS  = 80;
    const rampTo90 = () => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        // Ease-out: big steps early, tiny steps near 90
        const step = Math.max(0.4, (90 - prev) * 0.045);
        return Math.min(90, prev + step);
      });
    };
    progressTimer.current = setInterval(rampTo90, TICK_MS);

    const finishLoading = () => {
      if (destroyed) return;
      if (progressTimer.current) { clearInterval(progressTimer.current); progressTimer.current = null; }
      setProgress(100);
      // Short delay so the ring completes visually, then fade out overlay
      setTimeout(() => {
        if (!destroyed) {
          setFadeOut(true);
          setTimeout(() => { if (!destroyed) setLoading(false); }, 400);
        }
      }, 200);
    };

    loadPannellum()
      .then(() => {
        if (destroyed || !containerRef.current || !window.pannellum) return;
        viewerRef.current = window.pannellum.viewer(containerRef.current, {
          type          : 'equirectangular',
          panorama      : imageUrl,
          autoLoad      : true,
          autoRotate    : 1,
          showControls  : true,
          showZoomCtrl  : false,
          showFullscreenCtrl: false,
          hfov          : 100,
          minHfov       : 50,
          maxHfov       : 120,
          strings: {
            loadButtonLabel   : '',
            loadingLabel      : '',
            bylineLabel       : '',
            noPanoramaError   : '360° image not found.',
            fileAccessError   : 'Image could not be accessed.',
            unknownError      : 'Could not load image.',
            genericWebGLError : 'WebGL not supported.',
            textureSizeError  : 'Image too large for this device.',
            malformedURLError : 'Invalid image URL.',
            ctrlZoomActivate  : 'Hold Ctrl to zoom',
            twoTouchActivate  : 'Use two fingers to interact',
            twoTouchXActivate : 'Use two fingers to pan left/right',
            twoTouchYActivate : 'Use two fingers to pan up/down',
            iOS8WebGLError    : 'WebGL not supported on iOS 8.',
          },
        });
        // Listen to Pannellum's load event
        viewerRef.current.on('load', finishLoading);
        // Safety net: if load event never fires, finish after 12 s
        setTimeout(() => { if (!destroyed && loading) finishLoading(); }, 12000);
      })
      .catch((err) => {
        if (!destroyed) {
          if (progressTimer.current) { clearInterval(progressTimer.current); progressTimer.current = null; }
          setError(err.message ?? 'Failed to load viewer');
          setLoading(false);
        }
      });

    return () => {
      destroyed = true;
      if (progressTimer.current) { clearInterval(progressTimer.current); progressTimer.current = null; }
      if (viewerRef.current) {
        try { viewerRef.current.destroy(); } catch (_) { /* ignore */ }
        viewerRef.current = null;
      }
    };
  }, [imageUrl, boxSize]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Close on Escape ─────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* ── Render via Portal so it sits above the entire app ───── */
  const modal = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center animate-in fade-in duration-150"
      style={{
        background: 'rgba(40,40,45,0.82)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Viewer box – sized to image aspect ratio */}
      <div
        className="relative overflow-hidden rounded-xl shadow-2xl bg-black"
        style={{
          width : boxSize.w,
          height: boxSize.h,
          maxWidth : '100vw',
          maxHeight: '100vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Pannellum container ──────────────────────────── */}
        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* ── Floating header ─────────────────────────────── */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2.5 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)' }}>
          <span className="text-sm font-semibold text-white/90 truncate select-none pointer-events-none">
            {title}
          </span>
          <button
            onClick={onClose}
            title="Close (Esc)"
            className="pointer-events-auto ml-4 shrink-0 p-1.5 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Suppress Pannellum's own grid/cube loader behind our overlay ── */}
        <style>{`.pnlm-load-box, .pnlm-lbar, .pnlm-lmsg { display: none !important; } .pnlm-load-button { display: none !important; }`}</style>

        {/* ── Loading overlay ──────────────────────────────── */}
        {loading && (() => {
          // SVG ring progress
          const R = 28, CIRC = 2 * Math.PI * R;
          const dashOffset = CIRC * (1 - progress / 100);

          return (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center"
              style={{
                transition: fadeOut ? 'opacity 0.4s ease' : undefined,
                opacity   : fadeOut ? 0 : 1,
              }}
            >
              {/* Solid dark base — always present, ensures no grid shows through */}
              <div className="absolute inset-0 bg-[#0c0e12]" />

              {/* Blurred thumbnail — shown only once it's fully loaded in cache */}
              {thumbReady && (thumbnail || imageUrl) && (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${thumbnail || imageUrl})`,
                    filter         : 'blur(22px) brightness(0.55)',
                    transform      : 'scale(1.1)',
                  }}
                />
              )}

              {/* Dark scrim so the ring stays legible */}
              <div className="absolute inset-0 bg-black/30" />

              {/* SVG ring + percentage */}
              <div className="relative z-10 flex flex-col items-center gap-3">
                <svg width="76" height="76" viewBox="0 0 76 76">
                  {/* Track */}
                  <circle cx="38" cy="38" r={R} fill="none"
                    stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
                  {/* Progress arc */}
                  <circle cx="38" cy="38" r={R} fill="none"
                    stroke="white" strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 38 38)"
                    style={{ transition: 'stroke-dashoffset 0.25s ease' }}
                  />
                  {/* Percentage text */}
                  <text x="38" y="43" textAnchor="middle"
                    fill="white" fontSize="13" fontWeight="600"
                    fontFamily="system-ui, sans-serif">
                    {Math.round(progress)}%
                  </text>
                </svg>
                <p className="text-[13px] font-medium text-white/80 tracking-wide select-none">
                  Loading panorama
                </p>
              </div>
            </div>
          );
        })()}

        {/* ── Error overlay ────────────────────────────────── */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10 gap-4 px-8">
            <AlertTriangle className="w-10 h-10 text-amber-400" />
            <p className="text-sm font-medium text-white text-center">Could not load panorama</p>
            <p className="text-[11px] text-slate-400 text-center max-w-sm">
              {error} — <code className="text-blue-400 break-all">{imageUrl}</code>
            </p>
            <button onClick={onClose}
              className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
