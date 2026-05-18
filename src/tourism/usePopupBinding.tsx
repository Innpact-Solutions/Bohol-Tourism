// Tourism module — popup binding hook
// Listens for clicks on tourism map layers and shows a MapLibre Popup with React content.
// Also responds to "tourism:fly-to-site" custom events from the attractions list.

import { useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import { useTourismData } from './TourismContext';
import { useTourismUI } from './tourismStore';
import { TourismPopupContent } from './TourismPopup';
import { TourismClusterPopupContent } from './TourismClusterPopup';
import { TOURISM_LAYER_IDS } from './TourismLayers';

export function useTourismPopups(map: maplibregl.Map | null, active: boolean) {
  const { sites, assets, clusters, accommodationsBooking, getPhotosFor, getAssetPhotosFor, getBookingPhotosFor, getMembershipFor } = useTourismData();
  const { selectedClusterId, setSelectedClusterId, setClusterMultiSelect } = useTourismUI();
  // Imperative handle filled by the effect below — lets a separate effect
  // close the currently-open popup when the user deselects the cluster from
  // somewhere else (e.g. the right-side detail panel's close button).
  const closeCurrentPopupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // When the selection is cleared (and a popup is open), close it. The
    // popup's own 'close' handler will then animate the map back to the
    // pre-selection view.
    if (selectedClusterId == null) {
      closeCurrentPopupRef.current?.();
    }
  }, [selectedClusterId]);

  useEffect(() => {
    if (!map || !active || !sites || !assets) return;

    let currentPopup: maplibregl.Popup | null = null;
    let currentRoot: Root | null = null;

    // ── Selection-driven camera memory ───────────────────────────────────────
    // When the user picks a cluster/site from the Tourism Directory we
    // smoothly flyTo it. We remember the previous camera so closing the
    // popup (or deselecting) animates the view back to where it was.
    type CameraSnapshot = { center: [number, number]; zoom: number; bearing: number; pitch: number };
    let prevView: CameraSnapshot | null = null;
    // Set briefly while we tear down a popup as part of switching to a new
    // selection — prevents the popup's 'close' handler from restoring the
    // view between back-to-back selections.
    let suppressRestore = false;
    const FLY_DURATION = 1100;

    const captureView = () => {
      if (prevView) return;
      const c = map.getCenter();
      prevView = {
        center: [c.lng, c.lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      };
    };
    const restoreView = () => {
      if (suppressRestore) return;
      const v = prevView;
      if (!v) return;
      prevView = null;
      try {
        map.flyTo({
          center: v.center,
          zoom: v.zoom,
          bearing: v.bearing,
          pitch: v.pitch,
          duration: FLY_DURATION,
          essential: true,
        });
      } catch { /* noop */ }
    };
    const closeCurrentForSwitch = () => {
      if (!currentPopup) return;
      suppressRestore = true;
      try { currentPopup.remove(); } catch { /* noop */ }
      currentRoot?.unmount();
      currentPopup = null;
      currentRoot = null;
      suppressRestore = false;
    };
    // Expose a normal (restore-honoring) close so the deselection effect can
    // dismiss the popup and animate the map back to the original view.
    closeCurrentPopupRef.current = () => {
      if (!currentPopup) return;
      try { currentPopup.remove(); } catch { /* noop */ }
    };

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

    // Compute the top-edge anchor point of a polygon/multipolygon cluster
    // feature. Returns [centroidX, maxY] in lng/lat so a popup anchored at
    // 'bottom' floats just above the cluster instead of covering it.
    const clusterTopAnchor = (feat: any): [number, number] | null => {
      const geom = feat?.geometry;
      if (!geom) return null;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const visit = (coords: any) => {
        if (typeof coords?.[0] === 'number') {
          const [x, y] = coords as [number, number];
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
          return;
        }
        if (Array.isArray(coords)) coords.forEach(visit);
      };
      visit(geom.coordinates);
      if (!isFinite(minX) || !isFinite(maxY)) return null;
      return [(minX + maxX) / 2, maxY];
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
      closeCurrentForSwitch();
      const container = document.createElement('div');
      const root = createRoot(container);
      // Sites use the curated local photo bank; assets (hotels/restaurants)
      // use the Google Places backfill index; booking accommodations use the
      // booking photo index. asset_tier identifies assets, bk_id identifies booking.
      const photos = props?.bk_id
        ? getBookingPhotosFor(props.bk_id)
        : props?.asset_tier
          ? getAssetPhotosFor(props.uid)
          : getPhotosFor(props.uid);
      root.render(<TourismPopupContent poi={props} photos={photos} />);

      const popup = new maplibregl.Popup({
        offset: 14, maxWidth: '320px', className: 'tourism-popup',
        closeButton: true, closeOnClick: false,
      })
        .setLngLat(lngLat)
        .setDOMContent(container)
        .addTo(map);

      popup.on('close', () => { root.unmount(); restoreView(); });
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

      // Photos: collect across anchor + secondary + supportive sites of the
      // cluster, with site name and tier so the popup can label each slide.
      const photos: Array<{ url: string; siteName: string; tier: 'Anchor' | 'Secondary' | 'Supportive' }> = [];
      if (mem && sites) {
        const tiers: Array<{ key: 'anchors' | 'secondary' | 'supportive'; label: 'Anchor' | 'Secondary' | 'Supportive' }> = [
          { key: 'anchors',    label: 'Anchor' },
          { key: 'secondary',  label: 'Secondary' },
          { key: 'supportive', label: 'Supportive' },
        ];
        for (const t of tiers) {
          const refs = (mem as any)[t.key] as Array<{ name: string; lgu: string }> | undefined;
          if (!refs) continue;
          for (const d of refs) {
            const siteFeat = sites.features.find((s: any) =>
              s.properties.name === d.name && s.properties.lgu === d.lgu
            );
            const uid = (siteFeat?.properties as any)?.uid;
            if (!uid) continue;
            for (const url of getPhotosFor(uid)) {
              photos.push({ url, siteName: d.name, tier: t.label });
            }
          }
        }
      }

      if (currentPopup) {
        closeCurrentForSwitch();
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
        // Anchor at bottom so the popup floats ABOVE the given lngLat —
        // callers pass the top edge of the cluster polygon, so the popup
        // sits over empty space outside the cluster rather than covering it.
        anchor: 'bottom',
        offset: 14, maxWidth: '260px', className: 'tourism-popup tourism-cluster-popup',
        closeButton: true, closeOnClick: false,
      })
        .setLngLat(lngLat)
        .setDOMContent(container)
        .addTo(map);

      // Activate this cluster in the right-side analytics panel.
      // Restrict the multi-select to just this cluster so any filtered
      // visuals (charts/tables) focus on the clicked cluster only.
      setSelectedClusterId(cid);
      setClusterMultiSelect([cid]);

      popup.on('close', () => {
        root.unmount();
        restoreView();
        // Only clear the cluster filter when the user actually closed the
        // popup (clicked × or pressed Esc). Programmatic closes triggered
        // by closeCurrentForSwitch set suppressRestore=true — we keep the
        // selection intact in that case so the next cluster popup can show.
        if (!suppressRestore) {
          // Restore default: all clusters selected, no detail focus —
          // mirrors Header.handleClusterClear.
          const allIds = (clusters?.features ?? [])
            .map((f: any) => f?.properties?.cluster_id)
            .filter((id: any): id is number => typeof id === 'number');
          setClusterMultiSelect(allIds);
          setSelectedClusterId(null);
        }
      });
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
      // Anchor the popup at the polygon's top edge (centroid X, maxY) so it
      // floats above the cluster rather than covering it.
      const top = clusterTopAnchor(f);
      showClusterPopup(f.properties, top ?? [e.lngLat.lng, e.lngLat.lat]);
    };

    const layers = [
      TOURISM_LAYER_IDS.anchor,
      TOURISM_LAYER_IDS.secondary,
      TOURISM_LAYER_IDS.supportive,
      TOURISM_LAYER_IDS.premium,
      TOURISM_LAYER_IDS.quality,
      TOURISM_LAYER_IDS.bookingAccommodations,
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
      captureView();
      map.flyTo({
        center: hit.lngLat,
        zoom: 12,
        duration: FLY_DURATION,
        curve: 1.4,
        essential: true,
      });
      setTimeout(() => showPopup(hit.props, hit.lngLat), FLY_DURATION + 50);
    };
    window.addEventListener('tourism:fly-to-site', onFly as any);

    // Listen for fly-to-cluster events from the Tourism Directory.
    // Zooms to level 12 centered on the cluster and opens its popup,
    // mirroring the site fly-to-site behaviour.
    const onFlyCluster = (e: any) => {
      const clusterId = e.detail?.cluster_id;
      if (clusterId == null || !clusters) return;
      const feat = clusters.features.find(
        (f: any) => f.properties?.cluster_id === clusterId
      );
      if (!feat) return;

      // Compute the polygon's bbox centroid (works for Polygon and MultiPolygon).
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const visit = (coords: any) => {
        if (typeof coords?.[0] === 'number') {
          const [x, y] = coords as [number, number];
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
          return;
        }
        if (Array.isArray(coords)) coords.forEach(visit);
      };
      visit((feat.geometry as any).coordinates);
      if (!isFinite(minX) || !isFinite(minY)) return;
      const center: [number, number] = [(minX + maxX) / 2, (minY + maxY) / 2];
      // Popup anchor: top edge of the polygon (centroid X, maxY) so the
      // card sits above the cluster instead of covering it.
      const topAnchor: [number, number] = [(minX + maxX) / 2, maxY];

      captureView();
      map.flyTo({
        center,
        zoom: 12,
        duration: FLY_DURATION,
        curve: 1.4,
        essential: true,
      });
      setTimeout(() => showClusterPopup(feat.properties, topAnchor), FLY_DURATION + 50);
    };
    window.addEventListener('tourism:fly-to-cluster', onFlyCluster as any);

    // Fly to a Booking.com accommodation from the list panel
    const onFlyBooking = (e: any) => {
      const { bk_id, lngLat, props } = e.detail || {};
      if (!bk_id || !lngLat) return;
      captureView();
      map.flyTo({
        center: lngLat,
        zoom: 14,
        duration: FLY_DURATION,
        curve: 1.4,
        essential: true,
      });
      setTimeout(() => showPopup(props, lngLat), FLY_DURATION + 50);
    };
    window.addEventListener('tourism:fly-to-booking', onFlyBooking as any);

    return () => {
      layers.forEach((id) => map.off('click', id, onLayerClick));
      clusterFillLayers.forEach((id) => map.off('click', id, onClusterFillClick));
      window.removeEventListener('tourism:fly-to-site', onFly as any);
      window.removeEventListener('tourism:fly-to-cluster', onFlyCluster as any);
      window.removeEventListener('tourism:fly-to-booking', onFlyBooking as any);
      if (currentPopup) currentPopup.remove();
      currentRoot?.unmount();
      closeCurrentPopupRef.current = null;
    };
  }, [map, active, sites, assets, clusters, accommodationsBooking, getPhotosFor, getAssetPhotosFor, getBookingPhotosFor, getMembershipFor]);
}
