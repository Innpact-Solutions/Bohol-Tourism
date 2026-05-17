// Tourism module — manages MapLibre sources & layers for tourism.
// Three source groups:
//   tourism-clusters  → 3 polygon layers (Primary / Emerging / Satellite)
//   tourism-sites     → 3 point layers (Anchor / Secondary / Supportive)  *colors by site_cat*
//   tourism-assets    → 2 point layers (Premium / Quality)

import { useEffect, useRef, useState } from 'react';
import type maplibregl from 'maplibre-gl';
import { useTourismData } from './TourismContext';
import { useTourismUI } from './tourismStore';
import {
  clusterFillPaint,
  clusterOutlineCasingPaint,
  clusterOutlinePaint,
  clusterPulsePaint,
  clusterHoverHaloPaint,
  clusterHoverOutlinePaint,
  clusterHoverFillPaint,
  anchorSitePaint,
  secondarySitePaint,
  supportiveSitePaint,
  premiumAssetPaint,
  qualityAssetPaint,
  CATEGORY_COLORS,
} from './styles';

// Per-category clustering: each site category gets its OWN clustered source
// so points of different categories never cluster together. The main
// SRC.sites source stays non-clustered and is used by the per-tier
// (Anchor/Secondary/Supportive) layers to render every individual point
// at all zoom levels.
const SITE_CATS: Array<{
  cat: string;
  color: string;
  slug: string;
  srcId: string;
  bubbleId: string;
  countId: string;
}> = [
  { cat: 'Beach',              color: CATEGORY_COLORS.Beach,                slug: 'beach' },
  { cat: 'Marine',             color: CATEGORY_COLORS.Marine,               slug: 'marine' },
  { cat: 'Nature / Viewpoint', color: CATEGORY_COLORS['Nature / Viewpoint'], slug: 'nature' },
  { cat: 'Heritage',           color: CATEGORY_COLORS.Heritage,             slug: 'heritage' },
  { cat: 'Faith',              color: CATEGORY_COLORS.Faith,                slug: 'faith' },
  { cat: 'Urban Park',         color: CATEGORY_COLORS['Urban Park'],        slug: 'urbanpark' },
].map(({ cat, color, slug }) => ({
  cat, color, slug,
  srcId:    `tourism-sites-cat-${slug}`,
  bubbleId: `tourism-sites-cat-${slug}-cluster`,
  countId:  `tourism-sites-cat-${slug}-cluster-count`,
}));

// Hospitality asset clustering — split into two per-tier sources so Premium
// and Quality cluster INDEPENDENTLY and dissolve at DIFFERENT zoom levels.
//   Quality  → clusterMaxZoom 13  (dissolves earlier, around zoom 14)
//   Premium  → clusterMaxZoom 15  (dissolves later,   around zoom 16)
// Cluster color matches the corresponding point color for visual consistency.
const ASSET_PREMIUM_COLOR = '#6D28D9'; // deep violet — Premium
const ASSET_QUALITY_COLOR = '#A78BFA'; // light lavender — Quality
const ASSET_CLUSTER_PREMIUM_MAX_ZOOM = 15;
const ASSET_CLUSTER_QUALITY_MAX_ZOOM = 13;

const BOOKING_COLOR = '#2563EB'; // blue-600 for Booking.com accommodations

const SRC = {
  clusters:              'tourism-clusters',
  sites:                 'tourism-sites',
  assetsPremium:         'tourism-assets-premium-src',
  assetsQuality:         'tourism-assets-quality-src',
  bookingAccommodations: 'tourism-booking-accommodations',
} as const;

const LYR = {
  // Cluster tiers
  clusterPrimaryFill:      'tourism-cluster-primary-fill',
  clusterPrimaryPulse:     'tourism-cluster-primary-pulse',
  clusterPrimaryCasing:    'tourism-cluster-primary-casing',
  clusterPrimaryOutline:   'tourism-cluster-primary-outline',
  clusterEmergingFill:     'tourism-cluster-emerging-fill',
  clusterEmergingPulse:    'tourism-cluster-emerging-pulse',
  clusterEmergingCasing:   'tourism-cluster-emerging-casing',
  clusterEmergingOutline:  'tourism-cluster-emerging-outline',
  clusterSatelliteFill:    'tourism-cluster-satellite-fill',
  clusterSatellitePulse:   'tourism-cluster-satellite-pulse',
  clusterSatelliteCasing:  'tourism-cluster-satellite-casing',
  clusterSatelliteOutline: 'tourism-cluster-satellite-outline',
  // Hover highlight (single layer set, filter-driven)
  clusterHoverFill:    'tourism-cluster-hover-fill',
  clusterHoverHalo:    'tourism-cluster-hover-halo',
  clusterHoverOutline: 'tourism-cluster-hover-outline',
  // Site tiers
  anchor:     'tourism-sites-anchor',
  secondary:  'tourism-sites-secondary',
  supportive: 'tourism-sites-supportive',
  // (Per-category site cluster bubble + count layers are generated from
  //  SITE_CATS at mount time — see bubbleId / countId there.)
  // Asset point clusters — one per tier (separate sources, separate shades,
  // staggered dissolve zooms).
  assetsPremiumCluster:      'tourism-assets-premium-cluster',
  assetsPremiumClusterCount: 'tourism-assets-premium-cluster-count',
  assetsQualityCluster:      'tourism-assets-quality-cluster',
  assetsQualityClusterCount: 'tourism-assets-quality-cluster-count',
  // Assets
  premium: 'tourism-assets-premium',
  quality: 'tourism-assets-quality',
  // Booking.com accommodations
  bookingAccommodations: 'tourism-booking-accommodations',
} as const;

interface Props {
  map:         maplibregl.Map | null;
  visible:     boolean;
  showAnchor?: boolean;
  showSecondary?: boolean;
  showSupportive?: boolean;
  showPremium?: boolean;
  showQuality?: boolean;
  showBookingAccommodations?: boolean;
  showClusterPrimary?: boolean;
  showClusterEmerging?: boolean;
  showClusterSatellite?: boolean;
  enabledSiteCategories?: string[];          // (legacy) used for all tiers when per-tier arrays not provided
  anchorCategories?: string[];               // sites visible in Anchor tier (overrides enabledSiteCategories)
  secondaryCategories?: string[];            // sites visible in Secondary tier
  supportiveCategories?: string[];           // sites visible in Supportive tier
  selectedLgu?: string | null;      // LGU filter from Header (MunName); 'all'/null = no filter
  selectedBrgy?: string | null;     // Barangay filter from Header (BrgyName); 'all'/null = no filter
  onClusterClick?: (cluster_id: number) => void;
  onSiteClick?:    (uid: string) => void;
  onAssetClick?:   (uid: string) => void;
  onBookingClick?: (bk_id: string) => void;
}

// Normalize header "all"/empty values to null
const norm = (v?: string | null): string | null => {
  if (!v) return null;
  const t = v.trim();
  if (!t || t.toLowerCase() === 'all' || t === 'All LGUs') return null;
  return t;
};

const tierFilter = (tier: string) => ['==', ['get', 'tier'], tier] as any;

// Cluster filter — restrict by tier and (optionally) by LGU. Clusters carry
// an `lgu` property (one of Tagbilaran City / Dauis / Panglao); we ignore
// barangay since a cluster usually spans multiple barangays.
const clusterTierFilter = (tier: string, lgu?: string | null) => {
  const base: any[] = ['all', ['==', ['get', 'tier'], tier]];
  const l = norm(lgu);
  if (l) base.push(['==', ['get', 'lgu'], l]);
  return base as any;
};

const perfTierFilter = (
  tier: string,
  enabledCats?: string[],
  lgu?: string | null,
  brgy?: string | null,
) => {
  const base: any[] = [
    'all',
    // Exclude features representing a clustered super-point
    ['!', ['has', 'point_count']],
    ['!=', ['get', 'site_cat'], 'EXCLUDED'],
    ['==', ['get', 'perf_tier'], tier],
  ];
  if (enabledCats && enabledCats.length > 0) {
    base.push(['in', ['get', 'site_cat'], ['literal', enabledCats]]);
  } else if (enabledCats) {
    base.push(['==', ['get', 'site_cat'], '__NONE__']);
  }
  const l = norm(lgu);
  if (l)  base.push(['==', ['get', 'lgu'],  l]);
  const b = norm(brgy);
  if (b)  base.push(['==', ['get', 'brgy'], b]);
  return base as any;
};

const assetTierFilter = (
  tier: string,
  lgu?: string | null,
  brgy?: string | null,
) => {
  const base: any[] = [
    'all',
    // Exclude features representing a clustered super-point
    ['!', ['has', 'point_count']],
    ['==', ['get', 'asset_tier'], tier],
  ];
  const l = norm(lgu);
  if (l)  base.push(['==', ['get', 'lgu'],  l]);
  const b = norm(brgy);
  if (b)  base.push(['==', ['get', 'brgy'], b]);
  return base as any;
};

export function TourismLayers({
  map,
  visible,
  showAnchor = true,
  showSecondary = true,
  showSupportive = false,
  showPremium = true,
  showQuality = false,
  showBookingAccommodations = false,
  showClusterPrimary = true,
  showClusterEmerging = true,
  showClusterSatellite = true,
  enabledSiteCategories,
  anchorCategories,
  secondaryCategories,
  supportiveCategories,
  selectedLgu = null,
  selectedBrgy = null,
  onClusterClick,
  onSiteClick,
  onAssetClick,
  onBookingClick,
}: Props) {
  const { clusters, sites, assets, accommodationsBooking } = useTourismData();
  const dataReady = !!(clusters && sites && assets);
  const catsAnchor     = anchorCategories     ?? enabledSiteCategories;
  const catsSecondary  = secondaryCategories  ?? enabledSiteCategories;
  const catsSupportive = supportiveCategories ?? enabledSiteCategories;

  // Selection highlight plumbing — the hover-highlight layers double as a
  // selection-highlight layer when no hover is active. Refs let the long-lived
  // hover handlers see the latest selectedClusterId without re-binding.
  const { selectedClusterId } = useTourismUI();
  // Bumped after every successful mount() so the visibility effect re-runs
  // and re-applies the latest show* props to layers that were just created.
  // Without this, the visibility effect would run once with stale (or pre-
  // mount) values and never re-trigger on prop changes that happened before
  // the layers existed.
  const [layersReadyTick, setLayersReadyTick] = useState(0);
  const selectedClusterIdRef = useRef<number | null>(selectedClusterId);
  const hoveringRef = useRef(false);
  const applySelectionHighlightRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    selectedClusterIdRef.current = selectedClusterId;
    applySelectionHighlightRef.current?.();
  }, [selectedClusterId]);

  useEffect(() => {
    if (!map || !clusters || !sites || !assets) return;

    const mount = () => {
      // Sources
      if (!map.getSource(SRC.clusters)) map.addSource(SRC.clusters, { type: 'geojson', data: clusters as any });
      if (!map.getSource(SRC.sites)) {
        // SRC.sites is NON-clustered — it powers the individual per-tier
        // (Anchor/Secondary/Supportive) point layers so singleton points are
        // always visible at every zoom. Per-category clustering happens in
        // the SITE_CATS sources below, which mix-proof clusters by category.
        map.addSource(SRC.sites, {
          type: 'geojson',
          data: sites as any,
        } as any);
      }
      // Per-category sources — one per site category. Clustering is disabled
      // so every individual point renders at every zoom; the per-tier
      // (Anchor/Secondary/Supportive) layers above already drive the visuals.
      for (const { cat, srcId } of SITE_CATS) {
        if (map.getSource(srcId)) continue;
        const fc = {
          type: 'FeatureCollection',
          features: (sites as any).features.filter(
            (f: any) => f?.properties?.site_cat === cat,
          ),
        };
        map.addSource(srcId, {
          type: 'geojson',
          data: fc as any,
        } as any);
      }
      // Two per-tier clustered sources so Premium / Quality cluster
      // independently. Each filters its features by asset_tier and uses a
      // different clusterMaxZoom so they break apart into individual points
      // at different zoom levels (Quality first, then Premium).
      const assetFeatures: any[] = (assets as any)?.features ?? [];
      if (!map.getSource(SRC.assetsPremium)) {
        map.addSource(SRC.assetsPremium, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: assetFeatures.filter(
              (f) => f?.properties?.asset_tier === 'Premium',
            ),
          } as any,
          cluster: true,
          clusterMaxZoom: ASSET_CLUSTER_PREMIUM_MAX_ZOOM,
          clusterRadius: 50,
        } as any);
      }
      if (!map.getSource(SRC.assetsQuality)) {
        map.addSource(SRC.assetsQuality, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: assetFeatures.filter(
              (f) => f?.properties?.asset_tier === 'Quality',
            ),
          } as any,
          cluster: true,
          clusterMaxZoom: ASSET_CLUSTER_QUALITY_MAX_ZOOM,
          clusterRadius: 40,
        } as any);
      }

      // Cluster — Primary / Emerging / Satellite, each as fill + pulse glow + outline.
      // Add layers in three passes (all fills, then all pulses, then all outlines) so
      // outlines from earlier tiers are never obscured by fills/pulses of later tiers
      // when polygons overlap.
      const addClusterFill = (fillId: string, tier: string) => {
        if (!map.getLayer(fillId)) {
          map.addLayer({
            id: fillId,
            type: 'fill',
            source: SRC.clusters,
            paint: clusterFillPaint as any,
            filter: clusterTierFilter(tier, selectedLgu),
          });
        }
      };
      const addClusterPulse = (pulseId: string, tier: string) => {
        if (!map.getLayer(pulseId)) {
          map.addLayer({
            id: pulseId,
            type: 'line',
            source: SRC.clusters,
            paint: clusterPulsePaint as any,
            filter: clusterTierFilter(tier, selectedLgu),
          });
        }
      };
      const addClusterCasing = (casingId: string, tier: string) => {
        if (!map.getLayer(casingId)) {
          map.addLayer({
            id: casingId,
            type: 'line',
            source: SRC.clusters,
            paint: clusterOutlineCasingPaint as any,
            filter: clusterTierFilter(tier, selectedLgu),
          });
        }
      };
      const addClusterOutline = (outlineId: string, tier: string) => {
        if (!map.getLayer(outlineId)) {
          map.addLayer({
            id: outlineId,
            type: 'line',
            source: SRC.clusters,
            paint: clusterOutlinePaint as any,
            filter: clusterTierFilter(tier, selectedLgu),
          });
        }
      };
      addClusterFill(LYR.clusterPrimaryFill,   'Primary');
      addClusterFill(LYR.clusterEmergingFill,  'Emerging');
      addClusterFill(LYR.clusterSatelliteFill, 'Satellite');
      addClusterPulse(LYR.clusterPrimaryPulse,   'Primary');
      addClusterPulse(LYR.clusterEmergingPulse,  'Emerging');
      addClusterPulse(LYR.clusterSatellitePulse, 'Satellite');
      addClusterCasing(LYR.clusterPrimaryCasing,   'Primary');
      addClusterCasing(LYR.clusterEmergingCasing,  'Emerging');
      addClusterCasing(LYR.clusterSatelliteCasing, 'Satellite');
      addClusterOutline(LYR.clusterPrimaryOutline,   'Primary');
      addClusterOutline(LYR.clusterEmergingOutline,  'Emerging');
      addClusterOutline(LYR.clusterSatelliteOutline, 'Satellite');

      // Hover highlight layers — filter starts as never-match; updated on mouseenter/leave.
      const NEVER: any = ['==', ['get', 'cluster_id'], '__NONE__'];
      if (!map.getLayer(LYR.clusterHoverFill)) {
        map.addLayer({
          id: LYR.clusterHoverFill,
          type: 'fill',
          source: SRC.clusters,
          paint: clusterHoverFillPaint as any,
          filter: NEVER,
        });
      }
      if (!map.getLayer(LYR.clusterHoverHalo)) {
        map.addLayer({
          id: LYR.clusterHoverHalo,
          type: 'line',
          source: SRC.clusters,
          paint: clusterHoverHaloPaint as any,
          filter: NEVER,
        });
      }
      if (!map.getLayer(LYR.clusterHoverOutline)) {
        map.addLayer({
          id: LYR.clusterHoverOutline,
          type: 'line',
          source: SRC.clusters,
          paint: clusterHoverOutlinePaint as any,
          filter: NEVER,
        });
      }

      // Site sub-layers — Anchor on top, then Secondary, then Supportive
      if (!map.getLayer(LYR.supportive)) {
        map.addLayer({
          id: LYR.supportive,
          type: 'circle',
          source: SRC.sites,
          paint: supportiveSitePaint as any,
          filter: perfTierFilter('Supportive', catsSupportive, selectedLgu, selectedBrgy),
        });
      }
      if (!map.getLayer(LYR.secondary)) {
        map.addLayer({
          id: LYR.secondary,
          type: 'circle',
          source: SRC.sites,
          paint: secondarySitePaint as any,
          filter: perfTierFilter('Secondary', catsSecondary, selectedLgu, selectedBrgy),
        });
      }
      if (!map.getLayer(LYR.anchor)) {
        map.addLayer({
          id: LYR.anchor,
          type: 'circle',
          source: SRC.sites,
          paint: anchorSitePaint as any,
          filter: perfTierFilter('Anchor', catsAnchor, selectedLgu, selectedBrgy),
        });
      }

      // Per-category site point clusters — one bubble + count pair per
      // category, drawn from its own clustered source so clusters only ever
      // contain points of a single type.
      for (const { color, srcId, bubbleId, countId } of SITE_CATS) {
        if (!map.getLayer(bubbleId)) {
          map.addLayer({
            id: bubbleId,
            type: 'circle',
            source: srcId,
            filter: ['has', 'point_count'],
            // Start hidden — the visibility effect turns this on only when at
            // least one site tier toggle is active.
            layout: { visibility: 'none' } as any,
            paint: {
              'circle-color': color,
              'circle-radius': [
                'step', ['get', 'point_count'],
                11, 10,
                15, 25,
                18,
              ] as any,
              'circle-stroke-color': '#FFFFFF',
              'circle-stroke-width': 2,
              'circle-stroke-opacity': 0.95,
              'circle-opacity': 0.78,
            } as any,
          });
        }
        if (!map.getLayer(countId)) {
          map.addLayer({
            id: countId,
            type: 'symbol',
            source: srcId,
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['to-string', ['get', 'point_count']],
              'text-size': 12,
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              // allow-overlap keeps the cluster number always rendered;
              // ignore-placement: false makes it CLAIM collision space, so
              // basemap / ward labels that overlap it get hidden — but ONLY
              // those overlapping ones, other labels stay visible.
              'text-allow-overlap': true,
              'text-ignore-placement': false,
              'text-padding': 4,
              // Start hidden — visibility effect turns this on with the bubble.
              visibility: 'none',
            } as any,
            paint: {
              'text-color': '#FFFFFF',
              'text-halo-color': 'rgba(0,0,0,0.45)',
              'text-halo-width': 1.1,
            } as any,
          });
        }
      }

      // Hospitality — individual (un-clustered) points read from each tier's
      // own clustered source. The `!has point_count` filter hides points
      // that are still aggregated into a cluster at the current zoom.
      // Start hidden so the only way these become visible is via the
      // visibility effect — guarantees points + cluster bubble + cluster
      // count toggle together as one logical layer.
      if (!map.getLayer(LYR.quality)) {
        map.addLayer({
          id: LYR.quality,
          type: 'circle',
          source: SRC.assetsQuality,
          layout: { visibility: 'none' } as any,
          paint: qualityAssetPaint as any,
          filter: assetTierFilter('Quality', selectedLgu, selectedBrgy),
        });
      }
      if (!map.getLayer(LYR.premium)) {
        map.addLayer({
          id: LYR.premium,
          type: 'circle',
          source: SRC.assetsPremium,
          layout: { visibility: 'none' } as any,
          paint: premiumAssetPaint as any,
          filter: assetTierFilter('Premium', selectedLgu, selectedBrgy),
        });
      }

      // Asset point clusters — one bubble + count per tier, each in its own
      // shade. Different sources → different clusterMaxZoom → the two tiers
      // dissolve at DIFFERENT zoom levels (Quality first, then Premium).
      const addAssetClusterStack = (
        bubbleId: string,
        countId: string,
        srcId: string,
        color: string,
      ) => {
        if (!map.getLayer(bubbleId)) {
          map.addLayer({
            id: bubbleId,
            type: 'circle',
            source: srcId,
            filter: ['has', 'point_count'],
            // Start hidden — the visibility effect enables this only when the
            // corresponding hospitality tier toggle is on.
            layout: { visibility: 'none' } as any,
            paint: {
              'circle-color': color,
              'circle-radius': [
                'step', ['get', 'point_count'],
                9, 10,
                11, 25,
                13,
              ] as any,
              'circle-stroke-color': '#FFFFFF',
              'circle-stroke-width': 2,
              'circle-stroke-opacity': 0.95,
              'circle-opacity': 0.78,
            } as any,
          });
        }
        // Cluster count label — shown only when 2+ points are aggregated.
        // Text sized so digits always sit inside the bubble (which is 9/11/13 px
        // radius). `allow-overlap: true` guarantees the number is never culled
        // by colliding basemap labels.
        if (!map.getLayer(countId)) {
          map.addLayer({
            id: countId,
            type: 'symbol',
            source: srcId,
            filter: ['all', ['has', 'point_count'], ['>=', ['get', 'point_count'], 2]],
            layout: {
              'text-field': ['to-string', ['get', 'point_count']],
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-size': [
                'step', ['get', 'point_count'],
                9.5, 10,
                10.5, 25,
                11.5,
              ] as any,
              'text-allow-overlap': true,
              'text-ignore-placement': true,
              visibility: 'none',
            } as any,
            paint: {
              'text-color': '#FFFFFF',
              'text-halo-color': 'rgba(0,0,0,0.55)',
              'text-halo-width': 1.1,
            } as any,
          });
        }
      };
      addAssetClusterStack(
        LYR.assetsQualityCluster,
        LYR.assetsQualityClusterCount,
        SRC.assetsQuality,
        ASSET_QUALITY_COLOR,
      );
      addAssetClusterStack(
        LYR.assetsPremiumCluster,
        LYR.assetsPremiumClusterCount,
        SRC.assetsPremium,
        ASSET_PREMIUM_COLOR,
      );

      // Update count text in site-category clusters too (shrunk + bolder halo).
      for (const { countId } of SITE_CATS) {
        if (map.getLayer(countId)) {
          try {
            map.setLayoutProperty(countId, 'text-size', 10.5);
            map.setPaintProperty(countId, 'text-halo-color', 'rgba(0,0,0,0.55)');
            map.setPaintProperty(countId, 'text-halo-width', 1.2);
          } catch { /* noop */ }
        }
      }

      // After (re)creating asset layers, ensure their filter reflects current LGU/Brgy
      if (map.getLayer(LYR.premium)) map.setFilter(LYR.premium, assetTierFilter('Premium', selectedLgu, selectedBrgy));
      if (map.getLayer(LYR.quality)) map.setFilter(LYR.quality, assetTierFilter('Quality', selectedLgu, selectedBrgy));

      // ── Booking.com accommodations — simple circle layer, no clustering.
      if (accommodationsBooking && !map.getSource(SRC.bookingAccommodations)) {
        map.addSource(SRC.bookingAccommodations, {
          type: 'geojson',
          data: accommodationsBooking as any,
        });
      }
      if (map.getSource(SRC.bookingAccommodations) && !map.getLayer(LYR.bookingAccommodations)) {
        map.addLayer({
          id: LYR.bookingAccommodations,
          type: 'circle',
          source: SRC.bookingAccommodations,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 3, 14, 7],
            'circle-color': BOOKING_COLOR,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5,
            'circle-opacity': 0.85,
          },
        });
      }

      // ── Layer order: keep tourism POINTS just below basemap labels, on top of everything else.
      // Find the first basemap symbol/label layer and move all tourism point layers below it.
      try {
        const style = map.getStyle();
        const layers = style?.layers || [];
        const firstLabelId = layers.find((l: any) => {
          const lid = l.id.toLowerCase();
          if (lid.startsWith('tourism-')) return false;
          // Match the existing basemap-label heuristic used in MapCanvas
          if (l.id === 'labels' || l.id === 'satellite-labels') return true;
          return l.type === 'symbol';
        })?.id;

        const pointLayerIds = [
          LYR.bookingAccommodations,
          LYR.supportive, LYR.secondary, LYR.anchor,
          ...SITE_CATS.flatMap(c => [c.bubbleId, c.countId]),
          LYR.quality, LYR.premium,
          LYR.assetsQualityCluster, LYR.assetsQualityClusterCount,
          LYR.assetsPremiumCluster, LYR.assetsPremiumClusterCount,
        ];
        pointLayerIds.forEach((id) => {
          if (!map.getLayer(id)) return;
          if (firstLabelId && map.getLayer(firstLabelId)) {
            map.moveLayer(id, firstLabelId);
          } else {
            map.moveLayer(id); // no label found → push to absolute top
          }
        });

        // Lift cluster COUNT labels above basemap labels so the number is
        // never hidden by city / road names. We push them to absolute top
        // (no beforeId) AFTER the rest of the tourism layers were placed.
        const countLayerIds = [
          ...SITE_CATS.map(c => c.countId),
          LYR.assetsQualityClusterCount,
          LYR.assetsPremiumClusterCount,
        ];
        // Place cluster count layers JUST BELOW the first basemap label
        // layer (instead of at the absolute top). MapLibre places symbols
        // in style order, so lower layers reserve collision space first.
        // Putting counts below basemap/ward labels means the counts claim
        // space first and any basemap/ward label that would overlap them
        // is automatically hidden — while every other label stays visible.
        countLayerIds.forEach((id) => {
          if (!map.getLayer(id)) return;
          if (firstLabelId && map.getLayer(firstLabelId)) {
            map.moveLayer(id, firstLabelId);
          } else {
            map.moveLayer(id);
          }
        });
      } catch (err) {
        console.warn('Tourism layer reorder failed:', err);
      }

      // Apply the current visibility props now that layers exist. The
      // separate visibility useEffect below also runs, but mount() can be
      // deferred via map.once('load', …) so initial state must be applied
      // here to prevent layers from flashing on with their default 'visible'.
      const initVis = (id: string, on: boolean) => {
        if (!map.getLayer(id)) return;
        map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
      };
      initVis(LYR.clusterPrimaryFill,      visible && showClusterPrimary);
      initVis(LYR.clusterPrimaryPulse,     visible && showClusterPrimary);
      initVis(LYR.clusterPrimaryCasing,    visible && showClusterPrimary);
      initVis(LYR.clusterPrimaryOutline,   visible && showClusterPrimary);
      initVis(LYR.clusterEmergingFill,     visible && showClusterEmerging);
      initVis(LYR.clusterEmergingPulse,    visible && showClusterEmerging);
      initVis(LYR.clusterEmergingCasing,   visible && showClusterEmerging);
      initVis(LYR.clusterEmergingOutline,  visible && showClusterEmerging);
      initVis(LYR.clusterSatelliteFill,    visible && showClusterSatellite);
      initVis(LYR.clusterSatellitePulse,   visible && showClusterSatellite);
      initVis(LYR.clusterSatelliteCasing,  visible && showClusterSatellite);
      initVis(LYR.clusterSatelliteOutline, visible && showClusterSatellite);
      initVis(LYR.anchor,     visible && showAnchor);
      initVis(LYR.secondary,  visible && showSecondary);
      initVis(LYR.supportive, visible && showSupportive);
      const anySiteOn = !!(showAnchor || showSecondary || showSupportive);
      SITE_CATS.forEach(({ bubbleId, countId }) => {
        initVis(bubbleId, visible && anySiteOn);
        initVis(countId,  visible && anySiteOn);
      });
      initVis(LYR.premium, visible && showPremium);
      initVis(LYR.quality, visible && showQuality);
      initVis(LYR.assetsQualityCluster,      visible && showQuality);
      initVis(LYR.assetsQualityClusterCount, visible && showQuality);
      initVis(LYR.assetsPremiumCluster,      visible && showPremium);
      initVis(LYR.assetsPremiumClusterCount, visible && showPremium);
      initVis(LYR.bookingAccommodations, visible && showBookingAccommodations);
      // Signal the visibility effect to re-run with the latest props now
      // that all layers actually exist. Resolves a race where the effect
      // ran before mount() finished and so could not apply the prop values.
      setLayersReadyTick((t) => t + 1);
    };

    if (map.isStyleLoaded()) mount();
    else map.once('load', mount);

    // Click + cursor handlers
    const onCluster = (e: any) => {
      const f = e.features?.[0];
      if (f && onClusterClick) onClusterClick(f.properties.cluster_id);
    };
    const onSite = (e: any) => {
      const f = e.features?.[0];
      if (f && onSiteClick) onSiteClick(f.properties.uid);
    };
    const onAsset = (e: any) => {
      const f = e.features?.[0];
      if (f && onAssetClick) onAssetClick(f.properties.uid);
    };
    const onBooking = (e: any) => {
      const f = e.features?.[0];
      if (f && onBookingClick) onBookingClick(f.properties.bk_id);
    };

    const clusterFillIds = [LYR.clusterPrimaryFill, LYR.clusterEmergingFill, LYR.clusterSatelliteFill];
    const siteIds  = [LYR.anchor, LYR.secondary, LYR.supportive];
    const assetIds = [LYR.premium, LYR.quality];

    clusterFillIds.forEach(id => map.on('click', id, onCluster));
    siteIds.forEach(id      => map.on('click', id, onSite));
    assetIds.forEach(id     => map.on('click', id, onAsset));
    if (map.getLayer(LYR.bookingAccommodations)) map.on('click', LYR.bookingAccommodations, onBooking);

    // Click a per-category site cluster bubble → zoom to its expansion zoom
    // (i.e. the next level at which the cluster breaks apart). Each category
    // has its own clustered source, so we close over the right source per
    // layer instead of relying on `feature.layer.id` (not always populated).
    // The handler is attached to BOTH the bubble circle layer and the count
    // text layer so clicking the number works the same as clicking the disc.
    const siteBubbleIds = SITE_CATS.map(c => c.bubbleId);
    const expandCluster = (srcId: string) => (e: any) => {
      // eslint-disable-next-line no-console
      console.log('[tourism cluster click]', srcId, {
        features: e.features?.length,
        firstProps: e.features?.[0]?.properties,
        firstLayer: e.features?.[0]?.layer?.id,
      });
      const src: any = map.getSource(srcId);
      // Some clicks land on the count symbol whose feature lacks cluster_id
      // (rare). Re-query the bubble layer at the click point to be safe.
      let f = e.features?.[0];
      if (!f || f.properties?.cluster_id == null) {
        try {
          const queried = map.queryRenderedFeatures(e.point, {
            layers: [
              ...SITE_CATS.map(c => c.bubbleId),
              LYR.assetsPremiumCluster,
              LYR.assetsQualityCluster,
            ].filter(id => !!map.getLayer(id)),
          });
          f = queried.find((q: any) => q.properties?.cluster_id != null) || f;
        } catch { /* noop */ }
      }
      if (!f) return;
      const cid = f.properties?.cluster_id;
      const geom: any = f.geometry;
      const center = geom?.coordinates;
      if (cid == null || !src?.getClusterExpansionZoom || !center) {
        // Fallback: just zoom in by 1 toward the click point.
        map.easeTo({ center: e.lngLat, zoom: Math.min(map.getZoom() + 1, 18), duration: 500 });
        return;
      }
      src.getClusterExpansionZoom(cid, (err: any, zoom: number) => {
        const currentZoom = map.getZoom();
        const expansion = err || typeof zoom !== 'number' ? currentZoom : zoom;
        const target = Math.min(Math.max(expansion + 0.25, currentZoom + 1), 18);
        map.easeTo({ center, zoom: target, duration: 600 });
      });
    };
    // Bind to both bubble + count layers for each tier/category.
    const siteClusterHandlers: Array<[string, (e: any) => void]> = SITE_CATS.flatMap(
      (c) => {
        const h = expandCluster(c.srcId);
        return [
          [c.bubbleId, h] as [string, (e: any) => void],
          [c.countId,  h] as [string, (e: any) => void],
        ];
      },
    );
    siteClusterHandlers.forEach(([id, h]) => map.on('click', id, h));

    // Click an asset point-cluster bubble → zoom to its expansion zoom.
    const premiumExpand = expandCluster(SRC.assetsPremium);
    const qualityExpand = expandCluster(SRC.assetsQuality);
    const assetClusterHandlers: Array<[string, (e: any) => void]> = [
      [LYR.assetsPremiumCluster,      premiumExpand],
      [LYR.assetsPremiumClusterCount, premiumExpand],
      [LYR.assetsQualityCluster,      qualityExpand],
      [LYR.assetsQualityClusterCount, qualityExpand],
    ];
    assetClusterHandlers.forEach(([id, h]) => map.on('click', id, h));
    const assetBubbleIds = [LYR.assetsPremiumCluster, LYR.assetsQualityCluster];

    // Diagnostic fallback: capture every map click and log which tourism
    // cluster layers (if any) were hit. This also acts as a backup expander
    // in case the layer-specific bindings somehow miss.
    const diagnosticClick = (e: any) => {
      const allClusterLayers = [
        ...siteBubbleIds,
        ...SITE_CATS.map(c => c.countId),
        LYR.assetsPremiumCluster, LYR.assetsPremiumClusterCount,
        LYR.assetsQualityCluster, LYR.assetsQualityClusterCount,
      ].filter(id => !!map.getLayer(id));
      const hits = map.queryRenderedFeatures(e.point, { layers: allClusterLayers });
      if (hits.length) {
        // eslint-disable-next-line no-console
        console.log('[tourism diag] map click hit cluster layers:',
          hits.map((h: any) => ({ layer: h.layer?.id, cluster_id: h.properties?.cluster_id, point_count: h.properties?.point_count })));
      }
    };
    map.on('click', diagnosticClick);

    const setPointer  = () => { map.getCanvas().style.cursor = 'pointer'; };
    const clearPointer = () => { map.getCanvas().style.cursor = ''; };
    const pointerLayerIds = [
      ...clusterFillIds, ...siteIds, ...assetIds,
      ...siteBubbleIds, ...SITE_CATS.map(c => c.countId),
      ...assetBubbleIds, LYR.assetsPremiumClusterCount, LYR.assetsQualityClusterCount,
      LYR.bookingAccommodations,
    ];
    pointerLayerIds.forEach(id => {
      map.on('mouseenter', id, setPointer);
      map.on('mouseleave', id, clearPointer);
    });

    // Cluster hover highlight: update filter to match hovered cluster_id.
    // When nothing is hovered, fall back to the currently-selected cluster
    // (driven by the left panel / Tourism Directory) so the selection stays
    // visually highlighted on the map.
    const NEVER: any = ['==', ['get', 'cluster_id'], '__NONE__'];
    const setHoverFilter = (filter: any) => {
      [LYR.clusterHoverFill, LYR.clusterHoverHalo, LYR.clusterHoverOutline].forEach(id => {
        if (map.getLayer(id)) {
          try { map.setFilter(id, filter); } catch { /* noop */ }
        }
      });
    };
    const filterForSelection = () => {
      const sid = selectedClusterIdRef.current;
      return sid == null ? NEVER : (['==', ['get', 'cluster_id'], sid] as any);
    };
    // Expose so the selectedClusterId effect below can re-apply when there's
    // no active hover.
    applySelectionHighlightRef.current = () => {
      if (!hoveringRef.current) setHoverFilter(filterForSelection());
    };
    const onClusterHover = (e: any) => {
      const f = e.features?.[0];
      const cid = f?.properties?.cluster_id;
      if (cid != null) {
        hoveringRef.current = true;
        setHoverFilter(['==', ['get', 'cluster_id'], cid]);
      }
    };
    const onClusterLeave = () => {
      hoveringRef.current = false;
      setHoverFilter(filterForSelection());
    };
    // Initial paint: reflect the current selection (if any).
    setHoverFilter(filterForSelection());
    clusterFillIds.forEach(id => {
      map.on('mousemove', id, onClusterHover);
      map.on('mouseleave', id, onClusterLeave);
    });

    return () => {
      clusterFillIds.forEach(id => map.off('click', id, onCluster));
      siteIds.forEach(id      => map.off('click', id, onSite));
      assetIds.forEach(id     => map.off('click', id, onAsset));
      if (map.getLayer(LYR.bookingAccommodations)) map.off('click', LYR.bookingAccommodations, onBooking);
      siteClusterHandlers.forEach(([id, h]) => map.off('click', id, h));
      assetClusterHandlers.forEach(([id, h]) => map.off('click', id, h));
      map.off('click', diagnosticClick);
      clusterFillIds.forEach(id => {
        map.off('mousemove', id, onClusterHover);
        map.off('mouseleave', id, onClusterLeave);
      });
      // Tear down tourism layers + sources so re-mount (HMR or prop change)
      // re-creates them with the latest cluster config.
      const allLayerIds = [
        ...Object.values(LYR),
        ...SITE_CATS.flatMap(c => [c.bubbleId, c.countId]),
      ];
      allLayerIds.forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      const allSrcIds = [
        ...Object.values(SRC),
        ...SITE_CATS.map(c => c.srcId),
      ];
      allSrcIds.forEach((sid) => {
        if (map.getSource(sid)) map.removeSource(sid);
      });
    };
  }, [map, clusters, sites, assets, accommodationsBooking, onClusterClick, onSiteClick, onAssetClick, onBookingClick]);

  // Per-sub-layer visibility
  useEffect(() => {
    if (!map) return;
    const setVis = (id: string, on: boolean) => {
      if (!map.getLayer(id)) return;
      map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
    };

    setVis(LYR.clusterPrimaryFill,      visible && showClusterPrimary);
    setVis(LYR.clusterPrimaryPulse,     visible && showClusterPrimary);
    setVis(LYR.clusterPrimaryCasing,    visible && showClusterPrimary);
    setVis(LYR.clusterPrimaryOutline,   visible && showClusterPrimary);
    setVis(LYR.clusterEmergingFill,     visible && showClusterEmerging);
    setVis(LYR.clusterEmergingPulse,    visible && showClusterEmerging);
    setVis(LYR.clusterEmergingCasing,   visible && showClusterEmerging);
    setVis(LYR.clusterEmergingOutline,  visible && showClusterEmerging);
    setVis(LYR.clusterSatelliteFill,    visible && showClusterSatellite);
    setVis(LYR.clusterSatellitePulse,   visible && showClusterSatellite);
    setVis(LYR.clusterSatelliteCasing,  visible && showClusterSatellite);
    setVis(LYR.clusterSatelliteOutline, visible && showClusterSatellite);

    setVis(LYR.anchor,     visible && showAnchor);
    setVis(LYR.secondary,  visible && showSecondary);
    setVis(LYR.supportive, visible && showSupportive);

    // Per-category site point clusters: show whenever any site tier is on.
    const anySiteOn = !!(showAnchor || showSecondary || showSupportive);
    SITE_CATS.forEach(({ bubbleId, countId }) => {
      setVis(bubbleId, visible && anySiteOn);
      setVis(countId,  visible && anySiteOn);
    });

    // Hospitality tiers are treated as one logical layer per tier:
    // the unclustered point + the cluster bubble + the cluster count
    // all share the SAME visibility state, so they appear and disappear
    // together. When the tier is off, every one of its 3 sub-layers is
    // forced to 'none' regardless of zoom.
    const premiumOn = !!(visible && showPremium);
    const qualityOn = !!(visible && showQuality);
    setVis(LYR.premium,                   premiumOn);
    setVis(LYR.assetsPremiumCluster,      premiumOn);
    setVis(LYR.assetsPremiumClusterCount, premiumOn);
    setVis(LYR.quality,                   qualityOn);
    setVis(LYR.assetsQualityCluster,      qualityOn);
    setVis(LYR.assetsQualityClusterCount, qualityOn);
    setVis(LYR.bookingAccommodations, !!(visible && showBookingAccommodations));
  }, [
    map, visible, dataReady,
    showAnchor, showSecondary, showSupportive,
    showPremium, showQuality, showBookingAccommodations,
    showClusterPrimary, showClusterEmerging, showClusterSatellite,
    layersReadyTick,
  ]);

  // Animate the cluster pulse glow: oscillate line-width and line-opacity
  // with a sine wave to produce a gentle "breathing" highlight around clusters.
  useEffect(() => {
    if (!map) return;
    if (!visible) return;
    if (!showClusterPrimary && !showClusterEmerging && !showClusterSatellite) return;

    const pulseIds = [
      LYR.clusterPrimaryPulse,
      LYR.clusterEmergingPulse,
      LYR.clusterSatellitePulse,
    ];

    let rafId = 0;
    const start = performance.now();
    const PERIOD_MS = 2200; // one full pulse cycle

    const tick = (now: number) => {
      // phase ∈ [0, 1)
      const phase = ((now - start) % PERIOD_MS) / PERIOD_MS;
      // smooth sine 0→1→0
      const t = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
      const width   = 6 + t * 10;        // 6 → 16 px
      const opacity = 0.18 + t * 0.42;   // 0.18 → 0.60
      const blur    = 3 + t * 4;         // 3 → 7 px
      pulseIds.forEach((id) => {
        if (!map.getLayer(id)) return;
        try {
          map.setPaintProperty(id, 'line-width', width);
          map.setPaintProperty(id, 'line-opacity', opacity);
          map.setPaintProperty(id, 'line-blur', blur);
        } catch { /* noop */ }
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [map, visible, showClusterPrimary, showClusterEmerging, showClusterSatellite]);

  // Update site + asset filters when enabled categories or LGU/Brgy change
  useEffect(() => {
    if (!map) return;
    // Cluster tier layers — filter by tier + selected LGU
    const clusterTiers: Array<[string, string]> = [
      [LYR.clusterPrimaryFill,      'Primary'],
      [LYR.clusterPrimaryPulse,     'Primary'],
      [LYR.clusterPrimaryCasing,    'Primary'],
      [LYR.clusterPrimaryOutline,   'Primary'],
      [LYR.clusterEmergingFill,     'Emerging'],
      [LYR.clusterEmergingPulse,    'Emerging'],
      [LYR.clusterEmergingCasing,   'Emerging'],
      [LYR.clusterEmergingOutline,  'Emerging'],
      [LYR.clusterSatelliteFill,    'Satellite'],
      [LYR.clusterSatellitePulse,   'Satellite'],
      [LYR.clusterSatelliteCasing,  'Satellite'],
      [LYR.clusterSatelliteOutline, 'Satellite'],
    ];
    clusterTiers.forEach(([id, tier]) => {
      if (!map.getLayer(id)) return;
      try {
        map.setFilter(id, clusterTierFilter(tier, selectedLgu));
      } catch (err) {
        console.warn(`Failed to update filter for ${id}:`, err);
      }
    });
    const tiers: Array<[string, string, string[] | undefined]> = [
      [LYR.anchor,     'Anchor',     catsAnchor],
      [LYR.secondary,  'Secondary',  catsSecondary],
      [LYR.supportive, 'Supportive', catsSupportive],
    ];
    tiers.forEach(([id, tier, cats]) => {
      if (!map.getLayer(id)) return;
      try {
        map.setFilter(id, perfTierFilter(tier, cats, selectedLgu, selectedBrgy));
      } catch (err) {
        console.warn(`Failed to update filter for ${id}:`, err);
      }
    });
    const assetTiers: Array<[string, string]> = [
      [LYR.premium, 'Premium'],
      [LYR.quality, 'Quality'],
    ];
    assetTiers.forEach(([id, tier]) => {
      if (!map.getLayer(id)) return;
      try {
        map.setFilter(id, assetTierFilter(tier, selectedLgu, selectedBrgy));
      } catch (err) {
        console.warn(`Failed to update filter for ${id}:`, err);
      }
    });
  }, [map, catsAnchor, catsSecondary, catsSupportive, selectedLgu, selectedBrgy]);

  return null;
}

export const TOURISM_SOURCE_IDS = SRC;
export const TOURISM_LAYER_IDS  = LYR;
