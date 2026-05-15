// Tourism module — manages MapLibre sources & layers for the tourism sector.
// Mounts 4 sources (clusters, sites, premium assets, quality assets) and corresponding layers.
// Visibility is controlled via the `visible` prop; sector-level orchestration lives in MapCanvas.

import { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';
import { useTourismData } from './TourismContext';
import {
  clusterFillPaint,
  clusterOutlinePaint,
  sitePointPaint,
  premiumAssetPaint,
  qualityAssetPaint,
} from './styles';

const SRC = {
  clusters: 'tourism-clusters',
  sites:    'tourism-sites',
  assets:   'tourism-assets',
} as const;

const LYR = {
  clusterFill:    'tourism-cluster-fill',
  clusterOutline: 'tourism-cluster-outline',
  sites:          'tourism-sites-pts',
  premium:        'tourism-assets-premium',
  quality:        'tourism-assets-quality',
} as const;

interface Props {
  map:         maplibregl.Map | null;
  visible:     boolean;
  showQuality?: boolean;   // toggle for quality hospitality (off by default)
  showSupportive?: boolean; // toggle for supportive sites
  onClusterClick?: (cluster_id: number) => void;
  onSiteClick?:    (uid: string) => void;
  onAssetClick?:   (uid: string) => void;
}

export function TourismLayers({
  map,
  visible,
  showQuality = false,
  showSupportive = false,
  onClusterClick,
  onSiteClick,
  onAssetClick,
}: Props) {
  const { clusters, sites, assets } = useTourismData();

  // Mount sources & layers when map + data are both ready
  useEffect(() => {
    if (!map || !clusters || !sites || !assets) return;

    // Ensure style is loaded
    const mount = () => {
      // Sources
      if (!map.getSource(SRC.clusters)) {
        map.addSource(SRC.clusters, { type: 'geojson', data: clusters as any });
      }
      if (!map.getSource(SRC.sites)) {
        map.addSource(SRC.sites, { type: 'geojson', data: sites as any });
      }
      if (!map.getSource(SRC.assets)) {
        map.addSource(SRC.assets, { type: 'geojson', data: assets as any });
      }

      // Cluster fill
      if (!map.getLayer(LYR.clusterFill)) {
        map.addLayer({
          id: LYR.clusterFill,
          type: 'fill',
          source: SRC.clusters,
          paint: clusterFillPaint as any,
        });
      }
      // Cluster outline
      if (!map.getLayer(LYR.clusterOutline)) {
        map.addLayer({
          id: LYR.clusterOutline,
          type: 'line',
          source: SRC.clusters,
          paint: clusterOutlinePaint as any,
        });
      }
      // Sites
      if (!map.getLayer(LYR.sites)) {
        map.addLayer({
          id: LYR.sites,
          type: 'circle',
          source: SRC.sites,
          paint: sitePointPaint as any,
          filter: ['!=', ['get', 'site_cat'], 'EXCLUDED'],
        });
      }
      // Premium hospitality
      if (!map.getLayer(LYR.premium)) {
        map.addLayer({
          id: LYR.premium,
          type: 'circle',
          source: SRC.assets,
          paint: premiumAssetPaint as any,
          filter: ['==', ['get', 'asset_tier'], 'Premium'],
        });
      }
      // Quality hospitality
      if (!map.getLayer(LYR.quality)) {
        map.addLayer({
          id: LYR.quality,
          type: 'circle',
          source: SRC.assets,
          paint: qualityAssetPaint as any,
          filter: ['==', ['get', 'asset_tier'], 'Quality'],
        });
      }
    };

    if (map.isStyleLoaded()) mount();
    else map.once('load', mount);

    // Click handlers
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
    map.on('click', LYR.clusterFill, onCluster);
    map.on('click', LYR.sites,       onSite);
    map.on('click', LYR.premium,     onAsset);
    map.on('click', LYR.quality,     onAsset);

    // Cursor
    const setPointer  = () => { map.getCanvas().style.cursor = 'pointer'; };
    const clearPointer = () => { map.getCanvas().style.cursor = ''; };
    [LYR.clusterFill, LYR.sites, LYR.premium, LYR.quality].forEach(id => {
      map.on('mouseenter', id, setPointer);
      map.on('mouseleave', id, clearPointer);
    });

    return () => {
      map.off('click', LYR.clusterFill, onCluster);
      map.off('click', LYR.sites,       onSite);
      map.off('click', LYR.premium,     onAsset);
      map.off('click', LYR.quality,     onAsset);
    };
  }, [map, clusters, sites, assets, onClusterClick, onSiteClick, onAssetClick]);

  // Visibility / sub-toggle effect
  useEffect(() => {
    if (!map) return;
    const setVis = (id: string, on: boolean) => {
      if (!map.getLayer(id)) return;
      map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
    };
    setVis(LYR.clusterFill,    visible);
    setVis(LYR.clusterOutline, visible);
    setVis(LYR.sites,          visible);
    setVis(LYR.premium,        visible);
    setVis(LYR.quality,        visible && showQuality);

    // Supportive — use filter, not layer visibility (sub-toggle on sites layer)
    if (map.getLayer(LYR.sites)) {
      const baseFilter: any = ['!=', ['get', 'site_cat'], 'EXCLUDED'];
      const noSupportive: any = ['all',
        baseFilter,
        ['!=', ['get', 'perf_tier'], 'Supportive'],
      ];
      map.setFilter(LYR.sites, showSupportive ? baseFilter : noSupportive);
    }
  }, [map, visible, showQuality, showSupportive]);

  return null;  // pure side-effect component
}

export const TOURISM_SOURCE_IDS = SRC;
export const TOURISM_LAYER_IDS = LYR;
