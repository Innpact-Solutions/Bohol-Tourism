// Tourism module — popup binding hook
// Listens for clicks on tourism map layers and shows a MapLibre Popup with React content.
// Also responds to "tourism:fly-to-site" custom events from the attractions list.

import { useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import { useTourismData } from './TourismContext';
import { TourismPopupContent } from './TourismPopup';
import { TourismClusterPopupContent } from './TourismClusterPopup';
import { TOURISM_LAYER_IDS } from './TourismLayers';

export function useTourismPopups(map: maplibregl.Map | null, active: boolean) {
  const { sites, assets, clusters, getPhotosFor, getMembershipFor } = useTourismData();

  useEffect(() => {
    if (!map || !active || !sites || !assets) return;

    let currentPopup: maplibregl.Popup | null = null;
    let currentRoot: Root | null = null;

    // After a popup mounts, measure it against obstructing UI panels (header,
    // footer, directory, legend, etc.) and pan the map so the popup sits
    // fully inside the visible, unobstructed area. Shared by site/asset and
    // cluster popups.
    const panPopupIntoView = () => {
      if (!currentPopup) return;
      const popupEl = currentPopup.getElement() as HTMLElement | null;
      const mapEl = map.getContainer();
      if (!popupEl || !mapEl) return;
      const pr = popupEl.getBoundingClientRect();
      const mr = mapEl.getBoundingClientRect();
      const MARGIN = 12;

      const obstacles: DOMRect[] = [];
      const selectors = [
        '[data-tourism-directory]',
        '[data-floating-legend]',
        '[data-header]',
        '[data-footer]',
        '.tourism-directory-panel',
        '.floating-legend-panel',
      ];
      selectors.forEach((sel) => {
        document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
          if (el === popupEl || popupEl.contains(el)) return;
          obstacles.push(el.getBoundingClientRect());
        });
      });

      let visLeft = mr.left, visRight = mr.right, visTop = mr.top, visBottom = mr.bottom;
      obstacles.forEach((o) => {
        if (o.right <= mr.left || o.left >= mr.right || o.bottom <= mr.top || o.top >= mr.bottom) return;
        const overlapW = Math.min(o.right, mr.right) - Math.max(o.left, mr.left);
        const overlapH = Math.min(o.bottom, mr.bottom) - Math.max(o.top, mr.top);
        if (overlapW < overlapH) {
          if (o.left - mr.left < mr.right - o.right) visLeft = Math.max(visLeft, o.right);
          else visRight = Math.min(visRight, o.left);
        } else {
          if (o.top - mr.top < mr.bottom - o.bottom) visTop = Math.max(visTop, o.bottom);
          else visBottom = Math.min(visBottom, o.top);
        }
      });

      let dx = 0, dy = 0;
      if (pr.left   < visLeft   + MARGIN) dx = pr.left   - (visLeft   + MARGIN);
      if (pr.right  > visRight  - MARGIN) dx = pr.right  - (visRight  - MARGIN);
      if (pr.top    < visTop    + MARGIN) dy = pr.top    - (visTop    + MARGIN);
      if (pr.bottom > visBottom - MARGIN) dy = pr.bottom - (visBottom - MARGIN);

      if (dx !== 0 || dy !== 0) {
        map.panBy([dx, dy], { duration: 350 });
      }
    };

    const findPOIByUid = (uid: string): { props: any; lngLat: [number, number] } | null => {
      const site = sites.features.find((f: any) => f.properties.uid === uid);
      if (site) {
        const c = (site.geometry as any).coordinates;
        return { props: site.properties, lngLat: [c[0], c[1]] };
      }
      const asset = assets.features.find((f: any) => f.properties.uid === uid);
      if (asset) {
        const c = (asset.geometry as any).coordinates;
        return { props: asset.properties, lngLat: [c[0], c[1]] };
      }
      return null;
    };

    const showPopup = (props: any, lngLat: [number, number]) => {
      if (currentPopup) {
        currentPopup.remove();
        currentRoot?.unmount();
        currentRoot = null;
      }
      const container = document.createElement('div');
      const root = createRoot(container);
      const photos = getPhotosFor(props.uid);
      root.render(<TourismPopupContent poi={props} photos={photos} />);

      const popup = new maplibregl.Popup({
        offset: 14, maxWidth: '320px', className: 'tourism-popup',
        closeButton: true, closeOnClick: false,
      })
        .setLngLat(lngLat)
        .setDOMContent(container)
        .addTo(map);

      popup.on('close', () => { root.unmount(); });
      currentPopup = popup;
      currentRoot = root;

      // Wait one frame so the popup has measurable dimensions.
      requestAnimationFrame(() => requestAnimationFrame(panPopupIntoView));
    };

    const onLayerClick = (e: any) => {
      const f = e.features?.[0];
      if (!f) return;
      const coords = (f.geometry as any).coordinates as [number, number];
      showPopup(f.properties, coords);
    };

    // ── Cluster polygon popup ──────────────────────────────────────────────
    // Compact card: hero photo of an anchor in this cluster + cluster name.
    const showClusterPopup = (clusterProps: any, lngLat: [number, number]) => {
      const cid: number = clusterProps?.cluster_id;
      if (cid == null) return;
      const mem = getMembershipFor(cid);

      // Photos: prefer anchor sites in the cluster; if none have photos,
      // fall back to secondary, then supportive. First non-empty wins.
      const photos: string[] = [];
      if (mem && sites) {
        const tiers: Array<keyof typeof mem> = ['anchors', 'secondary', 'supportive'];
        for (const tier of tiers) {
          if (photos.length) break;
          const refs = (mem as any)[tier] as Array<{ name: string; lgu: string }> | undefined;
          if (!refs) continue;
          for (const d of refs) {
            const siteFeat = sites.features.find((s: any) =>
              s.properties.name === d.name && s.properties.lgu === d.lgu
            );
            const uid = (siteFeat?.properties as any)?.uid;
            if (!uid) continue;
            for (const url of getPhotosFor(uid)) photos.push(url);
          }
        }
      }

      if (currentPopup) {
        currentPopup.remove();
        currentRoot?.unmount();
        currentRoot = null;
      }
      const container = document.createElement('div');
      const root = createRoot(container);
      root.render(
        <TourismClusterPopupContent
          name={clusterProps.name || mem?.name || `Cluster ${cid}`}
          photos={photos}
        />
      );

      const popup = new maplibregl.Popup({
        offset: 14, maxWidth: '260px', className: 'tourism-popup tourism-cluster-popup',
        closeButton: true, closeOnClick: false,
      })
        .setLngLat(lngLat)
        .setDOMContent(container)
        .addTo(map);

      popup.on('close', () => { root.unmount(); });
      currentPopup = popup;
      currentRoot = root;

      requestAnimationFrame(() => requestAnimationFrame(panPopupIntoView));
    };

    const onClusterFillClick = (e: any) => {
      // Cluster polygons can sit under point clusters; if a tourism point
      // layer was clicked, defer to its own handler (don't show cluster popup).
      const pointLayerIds = [
        TOURISM_LAYER_IDS.anchor,
        TOURISM_LAYER_IDS.secondary,
        TOURISM_LAYER_IDS.supportive,
        TOURISM_LAYER_IDS.premium,
        TOURISM_LAYER_IDS.quality,
      ].filter((id) => !!map.getLayer(id));
      const pointHits = pointLayerIds.length
        ? map.queryRenderedFeatures(e.point, { layers: pointLayerIds })
        : [];
      if (pointHits.length) return;

      const f = e.features?.[0];
      if (!f) return;
      showClusterPopup(f.properties, [e.lngLat.lng, e.lngLat.lat]);
    };

    const layers = [
      TOURISM_LAYER_IDS.anchor,
      TOURISM_LAYER_IDS.secondary,
      TOURISM_LAYER_IDS.supportive,
      TOURISM_LAYER_IDS.premium,
      TOURISM_LAYER_IDS.quality,
    ];
    layers.forEach((id) => map.on('click', id, onLayerClick));

    const clusterFillLayers = [
      TOURISM_LAYER_IDS.clusterPrimaryFill,
      TOURISM_LAYER_IDS.clusterEmergingFill,
      TOURISM_LAYER_IDS.clusterSatelliteFill,
    ];
    clusterFillLayers.forEach((id) => map.on('click', id, onClusterFillClick));

    // Listen for fly-to-site events from the attractions list
    const onFly = (e: any) => {
      const uid = e.detail?.uid;
      if (!uid) return;
      const hit = findPOIByUid(uid);
      if (!hit) return;
      map.flyTo({ center: hit.lngLat, zoom: 12, duration: 800 });
      setTimeout(() => showPopup(hit.props, hit.lngLat), 850);
    };
    window.addEventListener('tourism:fly-to-site', onFly as any);

    // Listen for fly-to-cluster events
    const onFlyCluster = (e: any) => {
      const clusterId = e.detail?.cluster_id;
      const bounds = e.detail?.bounds;
      if (!bounds) return;
      map.fitBounds(bounds, { padding: 80, duration: 800 });
    };
    window.addEventListener('tourism:fly-to-cluster', onFlyCluster as any);

    return () => {
      layers.forEach((id) => map.off('click', id, onLayerClick));
      clusterFillLayers.forEach((id) => map.off('click', id, onClusterFillClick));
      window.removeEventListener('tourism:fly-to-site', onFly as any);
      window.removeEventListener('tourism:fly-to-cluster', onFlyCluster as any);
      if (currentPopup) currentPopup.remove();
      currentRoot?.unmount();
    };
  }, [map, active, sites, assets, clusters, getPhotosFor, getMembershipFor]);
}
