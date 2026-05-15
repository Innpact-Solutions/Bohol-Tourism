// Tourism module — manages MapLibre sources & layers for tourism.
// Three source groups:
//   tourism-clusters  → 3 polygon layers (Primary / Emerging / Satellite)
//   tourism-sites     → 3 point layers (Anchor / Secondary / Supportive)  *colors by site_cat*
//   tourism-assets    → 2 point layers (Premium / Quality)

import { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';
import { useTourismData } from './TourismContext';
import {
  clusterFillPaint,
  clusterOutlinePaint,
  clusterPulsePaint,
  clusterHoverHaloPaint,
  clusterHoverOutlinePaint,
  clusterHoverFillPaint,
  premiumAssetPaint,
  qualityAssetPaint,
  CATEGORY_COLORS,
} from './styles';
import { registerTourismIcons, tourismIconImageExpr } from './tourismIcons';

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

// Asset clustering (Premium vs Quality)
const assetsClusterProperties: any = {
  cnt_Premium: ['+', ['case', ['==', ['get', 'asset_tier'], 'Premium'], 1, 0]],
  cnt_Quality: ['+', ['case', ['==', ['get', 'asset_tier'], 'Quality'], 1, 0]],
};
const dominantAssetColorExpr: any = [
  'case',
  ['>=',
    ['to-number', ['coalesce', ['get', 'cnt_Premium'], 0]],
    ['to-number', ['coalesce', ['get', 'cnt_Quality'], 0]],
  ], '#C47A1F',
  '#E5A55A',
];

const SRC = {
  clusters: 'tourism-clusters',
  sites:    'tourism-sites',
  assets:   'tourism-assets',
} as const;

const LYR = {
  // Cluster tiers
  clusterPrimaryFill:      'tourism-cluster-primary-fill',
  clusterPrimaryPulse:     'tourism-cluster-primary-pulse',
  clusterPrimaryOutline:   'tourism-cluster-primary-outline',
  clusterEmergingFill:     'tourism-cluster-emerging-fill',
  clusterEmergingPulse:    'tourism-cluster-emerging-pulse',
  clusterEmergingOutline:  'tourism-cluster-emerging-outline',
  clusterSatelliteFill:    'tourism-cluster-satellite-fill',
  clusterSatellitePulse:   'tourism-cluster-satellite-pulse',
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
  // Asset point clusters
  assetsCluster:      'tourism-assets-cluster',
  assetsClusterCount: 'tourism-assets-cluster-count',
  // Assets
  premium: 'tourism-assets-premium',
  quality: 'tourism-assets-quality',
} as const;

interface Props {
  map:         maplibregl.Map | null;
  visible:     boolean;
  showAnchor?: boolean;
  showSecondary?: boolean;
  showSupportive?: boolean;
  showPremium?: boolean;
  showQuality?: boolean;
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
}

// Normalize header "all"/empty values to null
const norm = (v?: string | null): string | null => {
  if (!v) return null;
  const t = v.trim();
  if (!t || t.toLowerCase() === 'all' || t === 'All LGUs') return null;
  return t;
};

const tierFilter = (tier: string) => ['==', ['get', 'tier'], tier] as any;

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
}: Props) {
  const { clusters, sites, assets } = useTourismData();

  // Resolve per-tier category arrays, falling back to the legacy global one.
  const catsAnchor     = anchorCategories     ?? enabledSiteCategories;
  const catsSecondary  = secondaryCategories  ?? enabledSiteCategories;
  const catsSupportive = supportiveCategories ?? enabledSiteCategories;

  useEffect(() => {
    if (!map || !clusters || !sites || !assets) return;

    const mount = () => {
      // Make sure tourism category icons are registered before the
      // per-tier symbol layers reference them (fire-and-forget; the icons
      // load asynchronously and the symbol layers update on next render).
      registerTourismIcons(map);

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
      if (!map.getSource(SRC.assets)) {
        map.addSource(SRC.assets, {
          type: 'geojson',
          data: assets as any,
          cluster: true,
          clusterMaxZoom: 12,
          clusterRadius: 45,
          clusterProperties: assetsClusterProperties,
        } as any);
      }

      // Cluster — Primary / Emerging / Satellite, each as fill + pulse glow + outline.
      // Pulse layer sits between fill and outline; its width/opacity is animated
      // in a separate RAF effect to create a soft "breathing" highlight.
      const addClusterStack = (fillId: string, pulseId: string, outlineId: string, tier: string) => {
        if (!map.getLayer(fillId)) {
          map.addLayer({
            id: fillId,
            type: 'fill',
            source: SRC.clusters,
            paint: clusterFillPaint as any,
            filter: tierFilter(tier),
          });
        }
        if (!map.getLayer(pulseId)) {
          map.addLayer({
            id: pulseId,
            type: 'line',
            source: SRC.clusters,
            paint: clusterPulsePaint as any,
            filter: tierFilter(tier),
          });
        }
        if (!map.getLayer(outlineId)) {
          map.addLayer({
            id: outlineId,
            type: 'line',
            source: SRC.clusters,
            paint: clusterOutlinePaint as any,
            filter: tierFilter(tier),
          });
        }
      };
      addClusterStack(LYR.clusterPrimaryFill,   LYR.clusterPrimaryPulse,   LYR.clusterPrimaryOutline,   'Primary');
      addClusterStack(LYR.clusterEmergingFill,  LYR.clusterEmergingPulse,  LYR.clusterEmergingOutline,  'Emerging');
      addClusterStack(LYR.clusterSatelliteFill, LYR.clusterSatellitePulse, LYR.clusterSatelliteOutline, 'Satellite');

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
      // Tier sizes — Anchor largest, Supportive smallest. Applied via
      // `icon-size` on the per-tier symbol layers below.
      const TIER_ICON_SIZE: Record<'Anchor' | 'Secondary' | 'Supportive', any> = {
        Anchor:     ['interpolate', ['linear'], ['zoom'], 9, 0.55, 13, 0.75, 16, 0.95],
        Secondary:  ['interpolate', ['linear'], ['zoom'], 9, 0.40, 13, 0.55, 16, 0.72],
        Supportive: ['interpolate', ['linear'], ['zoom'], 9, 0.28, 13, 0.40, 16, 0.55],
      };
      const siteSymbolLayout = (size: any) => ({
        'icon-image':              tourismIconImageExpr,
        'icon-size':               size,
        'icon-allow-overlap':      true,
        'icon-ignore-placement':   true,
        'icon-anchor':             'center' as const,
        'icon-pitch-alignment':    'map' as const,
        'icon-rotation-alignment': 'viewport' as const,
      });

      if (!map.getLayer(LYR.supportive)) {
        map.addLayer({
          id: LYR.supportive,
          type: 'symbol',
          source: SRC.sites,
          layout: siteSymbolLayout(TIER_ICON_SIZE.Supportive) as any,
          filter: perfTierFilter('Supportive', catsSupportive, selectedLgu, selectedBrgy),
        });
      }
      if (!map.getLayer(LYR.secondary)) {
        map.addLayer({
          id: LYR.secondary,
          type: 'symbol',
          source: SRC.sites,
          layout: siteSymbolLayout(TIER_ICON_SIZE.Secondary) as any,
          filter: perfTierFilter('Secondary', catsSecondary, selectedLgu, selectedBrgy),
        });
      }
      if (!map.getLayer(LYR.anchor)) {
        map.addLayer({
          id: LYR.anchor,
          type: 'symbol',
          source: SRC.sites,
          layout: siteSymbolLayout(TIER_ICON_SIZE.Anchor) as any,
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
            paint: {
              'circle-color': color,
              'circle-radius': [
                'step', ['get', 'point_count'],
                14, 10,
                18, 25,
                22,
              ] as any,
              'circle-stroke-color': '#FFFFFF',
              'circle-stroke-width': 2.5,
              'circle-stroke-opacity': 0.95,
              'circle-opacity': 0.95,
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
              'text-allow-overlap': true,
              'text-ignore-placement': true,
            } as any,
            paint: {
              'text-color': '#FFFFFF',
              'text-halo-color': 'rgba(0,0,0,0.45)',
              'text-halo-width': 1.1,
            } as any,
          });
        }
      }

      // Hospitality
      if (!map.getLayer(LYR.quality)) {
        map.addLayer({
          id: LYR.quality,
          type: 'circle',
          source: SRC.assets,
          paint: qualityAssetPaint as any,
          filter: assetTierFilter('Quality', selectedLgu, selectedBrgy),
        });
      }
      if (!map.getLayer(LYR.premium)) {
        map.addLayer({
          id: LYR.premium,
          type: 'circle',
          source: SRC.assets,
          paint: premiumAssetPaint as any,
          filter: ['==', ['get', 'asset_tier'], 'Premium'],
        });
      }

      // Asset point clusters — orange bubble + white count label.
      if (!map.getLayer(LYR.assetsCluster)) {
        map.addLayer({
          id: LYR.assetsCluster,
          type: 'circle',
          source: SRC.assets,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': dominantAssetColorExpr,
            'circle-radius': [
              'step', ['get', 'point_count'],
              13, 10,
              17, 25,
              21,
            ] as any,
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-width': 2.5,
            'circle-stroke-opacity': 0.95,
            'circle-opacity': 0.95,
          } as any,
        });
      }
      if (!map.getLayer(LYR.assetsClusterCount)) {
        map.addLayer({
          id: LYR.assetsClusterCount,
          type: 'symbol',
          source: SRC.assets,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['to-string', ['get', 'point_count']],
            'text-size': 12,
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          } as any,
          paint: {
            'text-color': '#FFFFFF',
            'text-halo-color': 'rgba(0,0,0,0.45)',
            'text-halo-width': 1.1,
          } as any,
        });
      }

      // After (re)creating asset layers, ensure their filter reflects current LGU/Brgy
      if (map.getLayer(LYR.premium)) map.setFilter(LYR.premium, assetTierFilter('Premium', selectedLgu, selectedBrgy));
      if (map.getLayer(LYR.quality)) map.setFilter(LYR.quality, assetTierFilter('Quality', selectedLgu, selectedBrgy));

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
          LYR.supportive, LYR.secondary, LYR.anchor,
          ...SITE_CATS.flatMap(c => [c.bubbleId, c.countId]),
          LYR.quality, LYR.premium,
          LYR.assetsCluster, LYR.assetsClusterCount,
        ];
        pointLayerIds.forEach((id) => {
          if (!map.getLayer(id)) return;
          if (firstLabelId && map.getLayer(firstLabelId)) {
            map.moveLayer(id, firstLabelId);
          } else {
            map.moveLayer(id); // no label found → push to absolute top
          }
        });
      } catch (err) {
        console.warn('Tourism layer reorder failed:', err);
      }
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

    const clusterFillIds = [LYR.clusterPrimaryFill, LYR.clusterEmergingFill, LYR.clusterSatelliteFill];
    const siteIds  = [LYR.anchor, LYR.secondary, LYR.supportive];
    const assetIds = [LYR.premium, LYR.quality];

    clusterFillIds.forEach(id => map.on('click', id, onCluster));
    siteIds.forEach(id      => map.on('click', id, onSite));
    assetIds.forEach(id     => map.on('click', id, onAsset));

    // Click a per-category site cluster bubble → zoom in to its expansion
    // zoom. Each category has its own source, so the handler must look up
    // the matching source from the layer id.
    const siteBubbleIds = SITE_CATS.map(c => c.bubbleId);
    const bubbleIdToSrc: Record<string, string> = Object.fromEntries(
      SITE_CATS.map(c => [c.bubbleId, c.srcId]),
    );
    const onSiteClusterClick = (e: any) => {
      const f = e.features?.[0];
      if (!f) return;
      const cid = f.properties?.cluster_id;
      const srcId = bubbleIdToSrc[(e as any).features?.[0]?.layer?.id]
        ?? bubbleIdToSrc[(f as any).layer?.id];
      const src: any = srcId ? map.getSource(srcId) : null;
      if (cid == null || !src?.getClusterExpansionZoom) return;
      src.getClusterExpansionZoom(cid, (err: any, zoom: number) => {
        if (err) return;
        const geom: any = f.geometry;
        map.easeTo({
          center: geom?.coordinates,
          zoom: Math.min((zoom ?? map.getZoom()) + 0.2, 18),
          duration: 500,
        });
      });
    };
    siteBubbleIds.forEach(id => map.on('click', id, onSiteClusterClick));

    // Click an asset point-cluster bubble → zoom in to its expansion zoom.
    const onAssetClusterClick = (e: any) => {
      const f = e.features?.[0];
      if (!f) return;
      const cid = f.properties?.cluster_id;
      const src: any = map.getSource(SRC.assets);
      if (cid == null || !src?.getClusterExpansionZoom) return;
      src.getClusterExpansionZoom(cid, (err: any, zoom: number) => {
        if (err) return;
        const geom: any = f.geometry;
        map.easeTo({
          center: geom?.coordinates,
          zoom: Math.min((zoom ?? map.getZoom()) + 0.2, 18),
          duration: 500,
        });
      });
    };
    map.on('click', LYR.assetsCluster, onAssetClusterClick);

    const setPointer  = () => { map.getCanvas().style.cursor = 'pointer'; };
    const clearPointer = () => { map.getCanvas().style.cursor = ''; };
    [...clusterFillIds, ...siteIds, ...assetIds, ...siteBubbleIds, LYR.assetsCluster].forEach(id => {
      map.on('mouseenter', id, setPointer);
      map.on('mouseleave', id, clearPointer);
    });

    // Cluster hover highlight: update filter to match hovered cluster_id.
    const NEVER: any = ['==', ['get', 'cluster_id'], '__NONE__'];
    const setHoverFilter = (filter: any) => {
      [LYR.clusterHoverFill, LYR.clusterHoverHalo, LYR.clusterHoverOutline].forEach(id => {
        if (map.getLayer(id)) {
          try { map.setFilter(id, filter); } catch { /* noop */ }
        }
      });
    };
    const onClusterHover = (e: any) => {
      const f = e.features?.[0];
      const cid = f?.properties?.cluster_id;
      if (cid != null) {
        setHoverFilter(['==', ['get', 'cluster_id'], cid]);
      }
    };
    const onClusterLeave = () => setHoverFilter(NEVER);
    clusterFillIds.forEach(id => {
      map.on('mousemove', id, onClusterHover);
      map.on('mouseleave', id, onClusterLeave);
    });

    return () => {
      clusterFillIds.forEach(id => map.off('click', id, onCluster));
      siteIds.forEach(id      => map.off('click', id, onSite));
      assetIds.forEach(id     => map.off('click', id, onAsset));
      siteBubbleIds.forEach(id => map.off('click', id, onSiteClusterClick));
      map.off('click', LYR.assetsCluster, onAssetClusterClick);
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
  }, [map, clusters, sites, assets, onClusterClick, onSiteClick, onAssetClick]);

  // Per-sub-layer visibility
  useEffect(() => {
    if (!map) return;
    const setVis = (id: string, on: boolean) => {
      if (!map.getLayer(id)) return;
      map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
    };

    setVis(LYR.clusterPrimaryFill,      visible && showClusterPrimary);
    setVis(LYR.clusterPrimaryPulse,     visible && showClusterPrimary);
    setVis(LYR.clusterPrimaryOutline,   visible && showClusterPrimary);
    setVis(LYR.clusterEmergingFill,     visible && showClusterEmerging);
    setVis(LYR.clusterEmergingPulse,    visible && showClusterEmerging);
    setVis(LYR.clusterEmergingOutline,  visible && showClusterEmerging);
    setVis(LYR.clusterSatelliteFill,    visible && showClusterSatellite);
    setVis(LYR.clusterSatellitePulse,   visible && showClusterSatellite);
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

    setVis(LYR.premium, visible && showPremium);
    setVis(LYR.quality, visible && showQuality);

    // Asset point clusters: show whenever any hospitality tier is on.
    const anyAssetOn = !!(showPremium || showQuality);
    setVis(LYR.assetsCluster,      visible && anyAssetOn);
    setVis(LYR.assetsClusterCount, visible && anyAssetOn);
  }, [
    map, visible,
    showAnchor, showSecondary, showSupportive,
    showPremium, showQuality,
    showClusterPrimary, showClusterEmerging, showClusterSatellite,
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
