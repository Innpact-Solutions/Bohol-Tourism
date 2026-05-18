// WelcomeGuide — first-load onboarding tour for the Bohol Tourism Dashboard.
//
// ~120-second guided tour. Auto-runs on first load (persisted via localStorage).
// Re-launchable from the floating "Guide" button anchored to the bottom-left
// of the screen, or by dispatching the `bohol-guide:open` window event.
//
// Steps may run an imperative `action()` when entered — selecting a demo
// cluster, expanding a left-panel section, etc. — so the user can see the
// dashboard behaviour live as it's described.

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  X, ChevronRight, ChevronLeft, Sparkles,
} from 'lucide-react';
import { useTourismUI } from '../tourism/tourismStore';

const STORAGE_KEY = 'bohol_tourism_guide_seen';

// Demo cluster shown in the Cluster Assessment portion of the tour.
// Cluster 2 = "Tagbilaran Heritage Core" — Primary tier with the richest
// data across every right-panel section (hazards, climate summary,
// connectivity, recommendations, listings).
const DEMO_CLUSTER_ID = 2;

interface GuideUIHandle {
  setSelectedClusterId: (id: number | null) => void;
  setClusterMultiSelect: (ids: number[]) => void;
}

interface GuideStep {
  title: string;
  description: React.ReactNode;
  target?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Optional imperative action fired on step enter (UI demonstrations). */
  action?: (ui: GuideUIHandle) => void;
  /** Scroll the target into view inside the right panel before measuring. */
  scrollIntoView?: boolean;
}

const flyToCluster = (id: number) => {
  window.dispatchEvent(
    new CustomEvent('tourism:fly-to-cluster', { detail: { cluster_id: id } })
  );
};

const expandGroup = (id: 'sites' | 'hospitality' | 'clusters') => {
  window.dispatchEvent(
    new CustomEvent('bohol-guide:expand-group', { detail: { id } })
  );
};

const activateHazard = (sector: string, layerId: string) => {
  window.dispatchEvent(
    new CustomEvent('bohol-guide:activate-hazard', {
      detail: { sector, layerId },
    })
  );
};

const clearHazards = () => {
  window.dispatchEvent(new CustomEvent('bohol-guide:clear-hazards'));
};

const STEPS: GuideStep[] = [
  // ── Intro ──────────────────────────────────────────────────────────
  {
    title: 'Welcome',
    description: (
      <>
        A <strong>2-minute tour</strong> of the Bohol Tourism Potential &
        Development Insights Dashboard — covering <strong>Tagbilaran,
        Dauis, and Panglao</strong>.
      </>
    ),
    placement: 'center',
  },
  {
    title: 'Filter your area',
    description: (
      <>
        Narrow the view by <strong>LGU</strong>, <strong>Barangay</strong>, or
        <strong> Tourism Cluster</strong>. The map and every panel update
        instantly.
      </>
    ),
    target: '[data-guide="area-filters"]',
    placement: 'bottom',
  },

  // ── Left panel — Tourism Directory layers ──────────────────────────
  {
    title: 'Tourism Sites',
    description: (
      <>
        Attractions classified by performance tier:
        <ul className="mt-1.5 ml-4 list-disc space-y-0.5 text-[12px]">
          <li><strong>Anchor</strong> — flagship destinations.</li>
          <li><strong>Secondary</strong> — established supporting sites.</li>
          <li><strong>Supportive</strong> — smaller community attractions.</li>
        </ul>
        Categories: Beach · Marine · Nature · Heritage · Faith · Urban Park.
      </>
    ),
    target: '[data-guide-group="sites"]',
    placement: 'right',
    action: () => expandGroup('sites'),
  },
  {
    title: 'Stays and Dining',
    description: (
      <>
        Hospitality assets grouped into:
        <ul className="mt-1.5 ml-4 list-disc space-y-0.5 text-[12px]">
          <li><strong>Premium</strong> — high-end hotels, restaurants, cafés.</li>
          <li><strong>Quality</strong> — mid-tier rated venues.</li>
          <li><strong>Tourist Homes</strong> — short-term rentals & vacation stays.</li>
        </ul>
        Counts update with your area filter.
      </>
    ),
    target: '[data-guide-group="hospitality"]',
    placement: 'right',
    action: () => expandGroup('hospitality'),
  },
  {
    title: 'Tourism Clusters',
    description: (
      <>
        Geographic zones grouping nearby attractions, stays, and amenities
        into a single development unit:
        <ul className="mt-1.5 ml-4 list-disc space-y-0.5 text-[12px]">
          <li><strong>Primary</strong> — established, high visitation.</li>
          <li><strong>Emerging</strong> — growing, high potential.</li>
          <li><strong>Satellite</strong> — supporting nearby zones.</li>
        </ul>
      </>
    ),
    target: '[data-guide-group="clusters"]',
    placement: 'right',
    action: () => expandGroup('clusters'),
  },
  {
    title: 'Climate Hazards',
    description: (
      <>
        Climate risk overlays sit alongside any tourism layer on the map.
        We'll switch each one on in turn so you can see them in action.
      </>
    ),
    target: '[data-guide="climate-hazards"]',
    placement: 'right',
  },
  {
    title: 'Flood Hazard',
    description: (
      <>
        Areas exposed to <strong>urban flooding</strong>, graded by severity.
        The Flood Hazard Index layer is now live on the map across
        Tagbilaran, Dauis, and Panglao.
      </>
    ),
    target: '[data-tutorial="map-canvas"]',
    placement: 'left',
    action: () => activateHazard('flood', 'flood_fhi'),
  },
  {
    title: 'Heat Stress',
    description: (
      <>
        <strong>Urban heat stress</strong> driven by built-up density, low
        green cover, and limited canopy. The Heat Hazard Index is now active
        — hotter cores stand out in red.
      </>
    ),
    target: '[data-tutorial="map-canvas"]',
    placement: 'left',
    action: () => activateHazard('heat', 'heat_hhi'),
  },
  {
    title: 'Sinkhole Risk',
    description: (
      <>
        Karst geology in Bohol makes parts of Dauis and Panglao prone to{' '}
        <strong>sinkhole formation</strong>. The Sinkhole risk layer is now
        active — useful for siting stays and infrastructure.
      </>
    ),
    target: '[data-tutorial="map-canvas"]',
    placement: 'left',
    action: () => activateHazard('env_vulnerability', 'sinkhole'),
  },

  // ── Map ────────────────────────────────────────────────────────────
  {
    title: 'Map interactions',
    description: (
      <>
        Pan, zoom, and click any <strong>site</strong>, <strong>stay</strong>,
        or <strong>cluster</strong> for a popup with photos, ratings, hazard
        exposure, and connectivity.
      </>
    ),
    target: '[data-tutorial="map-canvas"]',
    placement: 'left',    action: () => clearHazards(),  },
  {
    title: 'Tourism Directory',
    description: (
      <>
        Floating list of every <strong>Site</strong>, <strong>Hotel</strong>,
        and <strong>Cluster</strong> in the selected area. Click a row to fly
        the map to it.
      </>
    ),
    target: '[data-tourism-directory]',
    placement: 'right',
  },

  // ── Right panel — global Tourism Analytics view ────────────────────
  {
    title: 'Tourism Analytics — Overview',
    description: (
      <>
        With no cluster selected, the right panel shows an{' '}
        <strong>area-wide rollup</strong>: total Tourism Sites, Stays &
        Dining, Clusters, and clusters under high hazard exposure.
      </>
    ),
    target: '[data-guide="ta-overview"]',
    placement: 'left',
    scrollIntoView: true,
    action: (ui) => ui.setSelectedClusterId(null),
  },
  {
    title: 'Climate Hazards Across Clusters',
    description: (
      <>
        Stacked summary of how many clusters fall in <strong>High</strong>,
        <strong> Medium</strong>, and <strong>Low</strong> exposure for each
        hazard — heat, flood, sinkhole.
      </>
    ),
    target: '[data-guide="ta-hazards"]',
    placement: 'left',
    scrollIntoView: true,
  },
  {
    title: 'Site Distribution',
    description: (
      <>
        Vertical bar chart of every tourism site across categories — Beach,
        Marine, Nature, Heritage, Faith, Urban Park — for the current area
        filter.
      </>
    ),
    target: '[data-guide="ta-distribution"]',
    placement: 'left',
    scrollIntoView: true,
  },
  {
    title: 'Hospitality Mix',
    description: (
      <>
        Share of <strong>Premium</strong>, <strong>Quality</strong>, and{' '}
        <strong>Tourist Home</strong> assets in your area filter.
      </>
    ),
    target: '[data-guide="ta-hospitality"]',
    placement: 'left',
    scrollIntoView: true,
  },

  // ── Right panel — Cluster Assessment view ──────────────────────────
  {
    title: 'Cluster Assessment',
    description: (
      <>
        Selecting a cluster on the map (or in the filter dropdown) loads its{' '}
        <strong>full assessment</strong> in the right panel. Let's open one
        now — <em>Tagbilaran Heritage Core</em>.
      </>
    ),
    target: '[data-tutorial="right-panel"]',
    placement: 'left',
    action: (ui) => {
      ui.setClusterMultiSelect([DEMO_CLUSTER_ID]);
      ui.setSelectedClusterId(DEMO_CLUSTER_ID);
      flyToCluster(DEMO_CLUSTER_ID);
    },
  },
  {
    title: 'Header & Key Metrics',
    description: (
      <>
        Cluster name, tier badge, LGU, plus a 4-up KPI grid:{' '}
        <strong>Land Area</strong> (with built-up / green %),{' '}
        <strong>Tourism Sites</strong>, <strong>Road Length</strong> (by
        class), and <strong>Stay & Dining</strong> totals.
      </>
    ),
    target: '[data-guide="ca-header"]',
    placement: 'left',
    scrollIntoView: true,
  },
  {
    title: 'Site Distribution (cluster)',
    description: (
      <>
        Bar chart of the cluster's tourism sites by category — how it leans
        toward heritage, beach, marine, etc.
      </>
    ),
    target: '[data-guide="ca-distribution"]',
    placement: 'left',
    scrollIntoView: true,
  },
  {
    title: 'Stay & Dining Breakdown',
    description: (
      <>
        Premium and Quality assets split into <strong>Hotels</strong>,{' '}
        <strong>Restaurants</strong>, and <strong>Cafés</strong>, plus
        Tourist Homes inside the cluster.
      </>
    ),
    target: '[data-guide="ca-stays"]',
    placement: 'left',
    scrollIntoView: true,
  },
  {
    title: 'Hazard Exposure',
    description: (
      <>
        Land-area share of the cluster under <strong>High / Medium / Low</strong>{' '}
        exposure for each hazard, followed by a plain-English{' '}
        <strong>Climate Risk Summary</strong>.
      </>
    ),
    target: '[data-guide="ca-hazards"]',
    placement: 'left',
    scrollIntoView: true,
  },
  {
    title: 'Connectivity',
    description: (
      <>
        Distance and drive time from the cluster's lead anchor to airport,
        seaport, hospital, market, and other key facilities.
      </>
    ),
    target: '[data-guide="ca-connectivity"]',
    placement: 'left',
    scrollIntoView: true,
  },
  {
    title: 'Recommended Interventions',
    description: (
      <>
        Tier-specific planning actions for the cluster — green-cover targets,
        infrastructure, heritage urban-design kits, soft-loan programmes.
      </>
    ),
    target: '[data-guide="ca-recommendations"]',
    placement: 'left',
    scrollIntoView: true,
  },
  {
    title: 'Top Performers',
    description: (
      <>
        Ranked lists of the cluster's <strong>Anchor</strong>,{' '}
        <strong>Secondary</strong>, and <strong>Supportive</strong> sites
        with ratings — click any to fly the map there.
      </>
    ),
    target: '[data-guide="ca-listings"]',
    placement: 'left',
    scrollIntoView: true,
  },

  // ── Wrap up ────────────────────────────────────────────────────────
  {
    title: 'Photos everywhere',
    description: (
      <>
        Every <strong>site, cluster, stay, and dining venue</strong> includes
        a <strong>photo gallery</strong> in its popup and detail panel. Click
        any thumbnail to enlarge.
      </>
    ),
    target: '[data-tutorial="map-canvas"]',
    placement: 'left',
    // Clear the demo cluster so the user lands back on the global overview.
    action: (ui) => ui.setSelectedClusterId(null),
  },
  {
    title: "You're ready",
    description: (
      <>
        Tour complete. Replay it anytime from the <strong>Guide</strong>{' '}
        button in the header, next to the cluster filter.
      </>
    ),
    placement: 'center',
  },
];

interface WelcomeGuideProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeGuide({ open, onClose }: WelcomeGuideProps) {
  return open ? <GuideTour onClose={onClose} /> : null;
}

function GuideTour({ onClose }: { onClose: () => void }) {
  const ui = useTourismUI();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [borderRadius, setBorderRadius] = useState<string>('10px');
  const lastActionStep = useRef<number>(-1);

  const step = STEPS[stepIndex];

  // Run the step's imperative action (cluster select, expand group, etc.)
  // exactly once when the step changes.
  useEffect(() => {
    if (lastActionStep.current === stepIndex) return;
    lastActionStep.current = stepIndex;
    if (step.action) {
      step.action({
        setSelectedClusterId: ui.setSelectedClusterId,
        setClusterMultiSelect: ui.setClusterMultiSelect,
      });
    }
    if (step.scrollIntoView && step.target) {
      // Defer to let any state-driven re-render finish before scrolling.
      setTimeout(() => {
        const el = document.querySelector(step.target!) as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    }
  }, [stepIndex, step, ui]);

  useLayoutEffect(() => {
    const measure = () => {
      if (!step.target) {
        setRect(null);
        return;
      }
      const el = document.querySelector(step.target) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      setRect(el.getBoundingClientRect());
      const cs = window.getComputedStyle(el);
      setBorderRadius(cs.borderRadius || '10px');
    };
    // Slightly longer delay so cluster-select fly + render settles.
    const t = setTimeout(measure, step.scrollIntoView ? 260 : 80);
    const t2 = setTimeout(measure, step.scrollIntoView ? 700 : 300);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [stepIndex, step.target, step.scrollIntoView]);

  const isLast = stepIndex === STEPS.length - 1;
  const isFirst = stepIndex === 0;

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    clearHazards();
    ui.setSelectedClusterId(null);
    onClose();
  };

  const next = () => (isLast ? finish() : setStepIndex(stepIndex + 1));
  const back = () => !isFirst && setStepIndex(stepIndex - 1);

  const tooltipStyle = computeTooltipStyle(step.placement, rect);

  const clipPath = rect
    ? `polygon(
        0% 0%, 0% 100%,
        ${rect.left - 6}px 100%,
        ${rect.left - 6}px ${rect.top - 6}px,
        ${rect.right + 6}px ${rect.top - 6}px,
        ${rect.right + 6}px ${rect.bottom + 6}px,
        ${rect.left - 6}px ${rect.bottom + 6}px,
        ${rect.left - 6}px 100%,
        100% 100%, 100% 0%
      )`
    : undefined;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div
        className="absolute inset-0 bg-black/65 transition-all duration-300 pointer-events-auto"
        style={{ clipPath }}
      />

      {rect && (
        <div
          className="absolute pointer-events-none transition-all duration-300"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            borderRadius,
            boxShadow:
              '0 0 0 2px rgba(37, 99, 235, 0.85), 0 0 0 6px rgba(37, 99, 235, 0.18), 0 0 40px 4px rgba(37, 99, 235, 0.3)',
          }}
        />
      )}

      <div className="absolute pointer-events-auto" style={tooltipStyle}>
        <div className="w-[340px] max-w-[92vw] bg-white rounded-xl shadow-2xl border border-[#E5E7EB] overflow-hidden">
          <div className="px-4 pt-3 pb-2.5 border-b border-[#E5E7EB] bg-gradient-to-r from-[#EFF6FF] to-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-[13.5px] font-semibold text-[#0F172A] truncate">
                  {step.title}
                </h3>
              </div>
              <button
                onClick={finish}
                aria-label="Close guide"
                className="shrink-0 p-1 rounded hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-[#2563EB] bg-[#DBEAFE] px-1.5 py-0.5 rounded">
                {stepIndex + 1} / {STEPS.length}
              </span>
              <div className="flex-1 flex items-center gap-1">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 rounded-full transition-all ${
                      i === stepIndex
                        ? 'w-4 bg-[#2563EB]'
                        : i < stepIndex
                        ? 'w-1.5 bg-[#3B82F6]'
                        : 'w-1.5 bg-[#CBD5E1]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 py-3 text-[12.5px] leading-relaxed text-[#334155]">
            {step.description}
          </div>

          <div className="px-4 pb-3 flex items-center justify-between">
            <button
              onClick={finish}
              className="text-[11px] font-medium text-[#64748B] hover:text-[#0F172A] transition"
            >
              Skip
            </button>
            <div className="flex items-center gap-1.5">
              <button
                onClick={back}
                disabled={isFirst}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-medium rounded-md text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                onClick={next}
                className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold rounded-md bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white hover:from-[#1D4ED8] hover:to-[#2563EB] shadow-md shadow-blue-500/25 transition"
              >
                {isLast ? 'Finish' : 'Next'}
                {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Auto-opens on every load so the latest guide is always surfaced. The
 * `STORAGE_KEY` flag is still written on finish/skip to support future
 * once-only behaviour if we ever want to opt back in.
 */
export function shouldAutoStartGuide(): boolean {
  return true;
}

function computeTooltipStyle(
  placement: GuideStep['placement'] = 'bottom',
  rect: DOMRect | null
): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = 340;
  const cardH = 260;
  const pad = 16;

  if (!rect || placement === 'center') {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  const clampX = (x: number) => Math.max(pad, Math.min(x, vw - cardW - pad));
  const clampY = (y: number) => Math.max(pad, Math.min(y, vh - cardH - pad));

  switch (placement) {
    case 'right': {
      const left = rect.right + pad;
      if (left + cardW + pad > vw) {
        return { left: clampX(rect.left - cardW - pad), top: clampY(rect.top) };
      }
      return { left, top: clampY(rect.top) };
    }
    case 'left': {
      const left = rect.left - cardW - pad;
      if (left < pad) {
        return { left: clampX(rect.right + pad), top: clampY(rect.top) };
      }
      return { left, top: clampY(rect.top) };
    }
    case 'top': {
      const top = rect.top - cardH - pad;
      if (top < pad) {
        return {
          top: clampY(rect.bottom + pad),
          left: clampX(rect.left + rect.width / 2 - cardW / 2),
        };
      }
      return {
        top,
        left: clampX(rect.left + rect.width / 2 - cardW / 2),
      };
    }
    case 'bottom':
    default: {
      const top = rect.bottom + pad;
      if (top + cardH + pad > vh) {
        return {
          top: clampY(rect.top - cardH - pad),
          left: clampX(rect.left + rect.width / 2 - cardW / 2),
        };
      }
      return {
        top,
        left: clampX(rect.left + rect.width / 2 - cardW / 2),
      };
    }
  }
}
