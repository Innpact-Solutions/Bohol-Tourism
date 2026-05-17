#!/usr/bin/env node
// Backfill one photo per tourism asset using the Google Places API (New).
//
// Usage:
//   GOOGLE_PLACES_API_KEY=xxx node scripts/fetch_asset_photos.mjs            # full run
//   GOOGLE_PLACES_API_KEY=xxx node scripts/fetch_asset_photos.mjs --limit=5  # dry-run on N items
//   GOOGLE_PLACES_API_KEY=xxx node scripts/fetch_asset_photos.mjs --force    # re-fetch items already in index
//
// Outputs (under public/data/tourism/):
//   asset_photos/<uid>.jpg                        — 800px-wide JPEG, one per asset
//   asset_photo_index.json                        — { [uid]: {name, lgu, place_id, photos:[{file,attribution,attribution_url}]} }
//   asset_search_cache.json                       — { [uid]: {place_id, photoName, error?} } (debug + resume cache)
//
// Costs (Places API New, 2026 pricing — fits inside the $200/mo free credit):
//   Place Details "Pro" SKU (photos field): ~$25 / 1000  → ~$10 for 398 assets
//   Place Photo:                            ~$7  / 1000  → ~$2.80 for 398 assets

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TOURISM_DIR = path.join(ROOT, 'public', 'data', 'tourism');
const ASSETS_PATH = path.join(TOURISM_DIR, 'assets.geojson');
const PHOTOS_DIR  = path.join(TOURISM_DIR, 'asset_photos');
const INDEX_PATH  = path.join(TOURISM_DIR, 'asset_photo_index.json');
const CACHE_PATH  = path.join(TOURISM_DIR, 'asset_search_cache.json');

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error('ERROR: set GOOGLE_PLACES_API_KEY in env (do not commit the key).');
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const PHOTO_MAX_WIDTH = 800;
const SLEEP_MS = 120;                       // ≈8 QPS, well below Google quotas
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function readJson(p, fallback) {
  try { return JSON.parse(await fs.readFile(p, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return fallback; throw e; }
}
async function writeJson(p, obj) {
  await fs.writeFile(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

async function placeDetails(placeId) {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'id,displayName,photos',
    },
  });
  if (!res.ok) throw new Error(`Place Details ${res.status}: ${await res.text()}`);
  return res.json();
}

async function placePhotoBytes(photoName) {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${PHOTO_MAX_WIDTH}&skipHttpRedirect=true`;
  const res = await fetch(url, { headers: { 'X-Goog-Api-Key': API_KEY } });
  if (!res.ok) throw new Error(`Place Photo ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const photoUri = json.photoUri;
  if (!photoUri) throw new Error('Place Photo response missing photoUri');
  const img = await fetch(photoUri);
  if (!img.ok) throw new Error(`CDN fetch ${img.status}`);
  const buf = Buffer.from(await img.arrayBuffer());
  return buf;
}

async function main() {
  await fs.mkdir(PHOTOS_DIR, { recursive: true });
  const assetsFC = await readJson(ASSETS_PATH, null);
  if (!assetsFC || !Array.isArray(assetsFC.features)) {
    console.error('Could not read assets.geojson'); process.exit(1);
  }
  const index = await readJson(INDEX_PATH, {});
  const cache = await readJson(CACHE_PATH, {});

  const todo = assetsFC.features.filter(f => {
    const uid = f?.properties?.uid;
    if (!uid) return false;
    if (!force && index[uid]) return false;
    return true;
  });
  const slice = todo.slice(0, LIMIT);
  console.log(`Assets total=${assetsFC.features.length}  pending=${todo.length}  processing=${slice.length}`);

  let ok = 0, skipped = 0, failed = 0;
  for (const [i, f] of slice.entries()) {
    const p = f.properties || {};
    const { uid, name, lgu, place_id } = p;
    process.stdout.write(`[${i + 1}/${slice.length}] ${uid} ${name?.slice(0, 40)} … `);

    if (!place_id) { console.log('SKIP (no place_id)'); skipped++; continue; }
    try {
      const details = await placeDetails(place_id);
      const photo = details.photos?.[0];
      if (!photo?.name) { console.log('SKIP (no photo)'); skipped++; cache[uid] = { place_id, error: 'no photo' }; continue; }

      const bytes = await placePhotoBytes(photo.name);
      const file = `${uid}.jpg`;
      await fs.writeFile(path.join(PHOTOS_DIR, file), bytes);

      const attr  = photo.authorAttributions?.[0];
      index[uid] = {
        name, lgu, place_id,
        photos: [{
          file,
          attribution: attr?.displayName || 'Google user',
          attribution_url: attr?.uri || null,
        }],
      };
      cache[uid] = { place_id, photoName: photo.name };
      ok++;
      console.log('OK');
    } catch (err) {
      failed++;
      cache[uid] = { place_id, error: String(err.message || err) };
      console.log(`FAIL ${err.message || err}`);
    }

    // Persist incrementally so a crash never loses progress.
    if ((i + 1) % 10 === 0) {
      await writeJson(INDEX_PATH, index);
      await writeJson(CACHE_PATH, cache);
    }
    await sleep(SLEEP_MS);
  }

  await writeJson(INDEX_PATH, index);
  await writeJson(CACHE_PATH, cache);
  console.log(`\nDone. ok=${ok} skipped=${skipped} failed=${failed}  total-indexed=${Object.keys(index).length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
