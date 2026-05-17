#!/usr/bin/env node
// Precompute driving distance + duration from each cluster's lead anchor to
// the three Bohol gateway POIs (airport, port, bus terminal) using Google
// Distance Matrix API.
//
// Usage:
//   GOOGLE_PLACES_API_KEY=xxx node scripts/fetch_connectivity_distances.mjs
//
// Output:
//   public/data/tourism/cluster_connectivity.json
//
// Cost: 9 origins × 3 destinations = 27 elements × $0.005 = ~$0.14 one-time
// (Distance Matrix API Basic SKU; fully covered by the $200/month Maps free credit).

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TOURISM_DIR = path.join(ROOT, 'public', 'data', 'tourism');
const MEMBERSHIP_PATH = path.join(TOURISM_DIR, 'cluster_membership.json');
const SITES_PATH      = path.join(TOURISM_DIR, 'sites.geojson');
const OUT_PATH        = path.join(TOURISM_DIR, 'cluster_connectivity.json');

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) {
  console.error('ERROR: set GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY) in env.');
  process.exit(1);
}

// Same coords used by the frontend Connectivity card (TourismAnalyticsPanel.tsx).
const DESTINATIONS = [
  { key: 'airport', label: "Bohol-Panglao Int'l Airport", lat: 9.6691, lng: 123.8503 },
  { key: 'port',    label: 'Tagbilaran City Port',        lat: 9.6452, lng: 123.8546 },
  { key: 'bus',     label: 'Dao Integrated Bus Terminal', lat: 9.6491, lng: 123.8722 },
];

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, 'utf8'));
}

function findAnchorCoords(sitesFC, anchorName, anchorLgu) {
  const f = sitesFC.features.find(
    (s) => s.properties?.name === anchorName && s.properties?.lgu === anchorLgu,
  );
  const c = f?.geometry?.coordinates;
  if (!c || typeof c[0] !== 'number' || typeof c[1] !== 'number') return null;
  return { lng: c[0], lat: c[1] };
}

async function main() {
  const membership = await readJson(MEMBERSHIP_PATH);
  const sitesFC    = await readJson(SITES_PATH);

  // Build origins list — one per cluster (lead anchor).
  const origins = [];
  for (const cm of membership) {
    const anchor = cm.anchors?.[0];
    if (!anchor) {
      console.warn(`Cluster ${cm.cluster_id} (${cm.name}): no anchor — skipping`);
      origins.push({ cluster_id: cm.cluster_id, name: cm.name, anchor: null, coords: null });
      continue;
    }
    const coords = findAnchorCoords(sitesFC, anchor.name, anchor.lgu);
    if (!coords) {
      console.warn(`Cluster ${cm.cluster_id}: anchor "${anchor.name}" coords not found — skipping`);
      origins.push({ cluster_id: cm.cluster_id, name: cm.name, anchor: anchor.name, coords: null });
      continue;
    }
    origins.push({ cluster_id: cm.cluster_id, name: cm.name, anchor: anchor.name, coords });
  }

  const withCoords = origins.filter((o) => o.coords);
  console.log(`Resolved ${withCoords.length}/${origins.length} cluster anchor coords.`);
  console.log(`Calling Distance Matrix: ${withCoords.length} origins × ${DESTINATIONS.length} destinations = ${withCoords.length * DESTINATIONS.length} elements`);

  // Single batched call to Routes API v2 Compute Route Matrix.
  // (Same per-element price as legacy Distance Matrix Basic SKU.)
  const body = {
    origins: withCoords.map((o) => ({
      waypoint: { location: { latLng: { latitude: o.coords.lat, longitude: o.coords.lng } } },
    })),
    destinations: DESTINATIONS.map((d) => ({
      waypoint: { location: { latLng: { latitude: d.lat, longitude: d.lng } } },
    })),
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_UNAWARE',
  };

  const res = await fetch('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,status,condition',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Routes API HTTP ${res.status}: ${await res.text()}`);
  }
  const matrix = await res.json(); // array of { originIndex, destinationIndex, distanceMeters, duration, condition, status }

  // Index by cluster_id → { airport, port, bus }
  const out = {};
  for (const o of withCoords) {
    out[String(o.cluster_id)] = {
      anchor_name: o.anchor,
      anchor_coords: o.coords,
    };
  }
  for (const cell of matrix) {
    const o = withCoords[cell.originIndex];
    const dest = DESTINATIONS[cell.destinationIndex];
    if (cell.condition === 'ROUTE_EXISTS' && cell.distanceMeters != null) {
      const seconds = parseInt(String(cell.duration).replace(/s$/, ''), 10);
      out[String(o.cluster_id)][dest.key] = {
        km:  +(cell.distanceMeters / 1000).toFixed(2),
        min: Math.round(seconds / 60),
      };
    } else {
      out[String(o.cluster_id)][dest.key] = {
        km: null, min: null,
        status: cell.condition || cell.status?.message || 'UNKNOWN',
      };
    }
  }

  // Add stubs for clusters with no resolved anchor (so the frontend still
  // sees the cluster id and renders "NA").
  for (const o of origins.filter((x) => !x.coords)) {
    out[String(o.cluster_id)] = {
      anchor_name: o.anchor,
      anchor_coords: null,
      airport: { km: null, min: null, status: 'NO_ANCHOR' },
      port:    { km: null, min: null, status: 'NO_ANCHOR' },
      bus:     { km: null, min: null, status: 'NO_ANCHOR' },
    };
  }

  await fs.writeFile(OUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${OUT_PATH}`);
  console.table(
    Object.entries(out).map(([cid, v]) => ({
      cluster_id: cid,
      anchor: v.anchor_name,
      airport_km: v.airport.km,
      port_km:    v.port.km,
      bus_km:     v.bus.km,
    })),
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
