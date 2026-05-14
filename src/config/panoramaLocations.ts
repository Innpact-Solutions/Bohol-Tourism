/**
 * ═══════════════════════════════════════════════════════════════
 * 360° PANORAMA PIN LOCATIONS CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 *
 * Add 360° photo locations here. Each entry defines:
 *  - id         : Unique identifier
 *  - title      : Display name shown in the viewer header
 *  - description: Short description shown below the title
 *  - imageUrl   : URL or path to the equirectangular 360° image
 *                 Can be an absolute URL (https://...) or a relative
 *                 path under /public (e.g. "/panoramas/water_treatment.jpg")
 *  - coordinates: [longitude, latitude] of the pin on the map
 *  - thumbnail  : (optional) small preview image URL for the popup
 *
 * ─── HOW TO ADD A NEW 360 IMAGE ─────────────────────────────────
 * 1. Copy your equirectangular image into: public/panoramas/
 * 2. Add a new entry to PANORAMA_LOCATIONS below.
 * 3. The pin will automatically appear on the map on next reload.
 * ═══════════════════════════════════════════════════════════════
 */

export interface PanoramaLocation {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  coordinates: [number, number]; // [longitude, latitude]
  thumbnail?: string;
}

/**
 * List of 360° panorama pin locations.
 *
 * Replace the sample entries below with your actual locations and image URLs.
 * The imageUrl can be:
 *   - A public asset path: "/panoramas/your-image.jpg"  (put image in /public/panoramas/)
 *   - An absolute URL:     "https://your-server.com/image.jpg"
 */
export const PANORAMA_LOCATIONS: PanoramaLocation[] = [
  // ── DJI Aerial Survey – Bohol CWIS Field Capture (24 Mar 2026) ───
  {
    id: 'dji-0149',
    title: 'President Carlos P. Garcia Park, Tagbilaran City',
    description: 'DJI FC3582 aerial capture · 24 Mar 2026 · 07:38',
    imageUrl: '/panoramas/DJI_0149.webp',
    thumbnail: '/panoramas/DJI_0149_thumb.jpg',
    coordinates: [123.85749358333332, 9.66036763888889],
  },
  {
    id: 'dji-0152',
    title: 'Tagbilaran City',
    description: 'DJI FC3582 aerial capture · 24 Mar 2026 · 07:46',
    imageUrl: '/panoramas/DJI_0152.webp',
    thumbnail: '/panoramas/DJI_0152_thumb.jpg',
    coordinates: [123.85593897222222, 9.661931194444445],
  },
  {
    id: 'dji-0156',
    title: 'Tagbilaran City',
    description: 'DJI FC3582 aerial capture · 24 Mar 2026 · 07:49',
    imageUrl: '/panoramas/DJI_0156.webp',
    thumbnail: '/panoramas/DJI_0156_thumb.jpg',
    coordinates: [123.85594113888888, 9.661930972222223],
  },
  {
    id: 'dji-0172',
    title: 'Tagbilaran City',
    description: 'DJI FC3582 aerial capture · 24 Mar 2026 · 07:52',
    imageUrl: '/panoramas/DJI_0172.webp',
    thumbnail: '/panoramas/DJI_0172_thumb.jpg',
    coordinates: [123.8532846111111, 9.656101333333334],
  },
  {
    id: 'dji-0183',
    title: 'Bohol Provincial Capitol, Tagbilaran City',
    description: 'DJI FC3582 aerial capture · 24 Mar 2026 · 07:57',
    imageUrl: '/panoramas/DJI_0183.webp',
    thumbnail: '/panoramas/DJI_0183_thumb.jpg',
    coordinates: [123.85912011111111, 9.659391944444446],
  },
  {
    id: 'dji-0203',
    title: 'Badjao Community, Dauis',
    description: 'DJI FC3582 aerial capture · 24 Mar 2026 · 08:36',
    imageUrl: '/panoramas/DJI_0203.webp',
    thumbnail: '/panoramas/DJI_0203_thumb.jpg',
    coordinates: [123.84966141666666, 9.638553805555555],
  },
  {
    id: 'dji-0258',
    title: 'Tagbilaran City',
    description: 'DJI FC3582 aerial capture · 24 Mar 2026 · 08:49',
    imageUrl: '/panoramas/DJI_0258.webp',
    thumbnail: '/panoramas/DJI_0258_thumb.jpg',
    coordinates: [123.85097622222222, 9.654322444444444],
  },
  {
    id: 'dji-0275',
    title: 'Mangrove, Tagbilaran City',
    description: 'DJI FC3582 aerial capture · 24 Mar 2026 · 09:18',
    imageUrl: '/panoramas/DJI_0275.webp',
    thumbnail: '/panoramas/DJI_0275_thumb.jpg',
    coordinates: [123.85066425, 9.674355277777778],
  },
  {
    id: 'dji-0225',
    title: 'Dauis Bridge',
    description: 'DJI FC3582 aerial capture · 24 Mar 2026 · 08:40',
    imageUrl: '/panoramas/DJI_0225.webp',
    thumbnail: '/panoramas/DJI_0225_thumb.jpg',
    coordinates: [123.85348697222221, 9.636312472222222],
  },
  {
    id: 'dji-0283',
    title: 'Proposed STP Site',
    description: 'DJI FC3582 aerial capture · 24 Mar 2026 · 09:45',
    imageUrl: '/panoramas/DJI_0283.webp',
    thumbnail: '/panoramas/DJI_0283_thumb.jpg',
    coordinates: [123.8730546111111, 9.6946345],
  },
  {
    id: 'dji-0291',
    title: 'Tagbilaran City',
    description: 'DJI FC3582 aerial capture · 24 Mar 2026 · 13:41',
    imageUrl: '/panoramas/DJI_0291.webp',
    thumbnail: '/panoramas/DJI_0291_thumb.jpg',
    coordinates: [123.87066569444444, 9.658535361111111],
  },


  {
    id: 'dji-0371',
    title: 'DJI_0371',
    description: 'DJI FC3582 aerial capture · 25 Mar 2026 · 11:42',
    imageUrl: '/panoramas/DJI_0371.webp',
    thumbnail: '/panoramas/DJI_0371_thumb.jpg',
    coordinates: [123.8376545, 9.6351125],
  },
  {
    id: 'dji-0375',
    title: 'DJI_0375',
    description: 'DJI FC3582 aerial capture · 25 Mar 2026 · 11:45',
    imageUrl: '/panoramas/DJI_0375.webp',
    thumbnail: '/panoramas/DJI_0375_thumb.jpg',
    coordinates: [123.838570972222, 9.63952630555556],
  },
  {
    id: 'dji-0378',
    title: 'DJI_0378',
    description: 'DJI FC3582 aerial capture · 25 Mar 2026 · 11:49',
    imageUrl: '/panoramas/DJI_0378.webp',
    thumbnail: '/panoramas/DJI_0378_thumb.jpg',
    coordinates: [123.843435638889, 9.6313895],
  },
  {
    id: 'dji-0379',
    title: 'DJI_0379',
    description: 'DJI FC3582 aerial capture · 25 Mar 2026 · 11:51',
    imageUrl: '/panoramas/DJI_0379.webp',
    thumbnail: '/panoramas/DJI_0379_thumb.jpg',
    coordinates: [123.847552805556, 9.63050211111111],
  },
  {
    id: 'dji-0385',
    title: 'DJI_0385',
    description: 'DJI FC3582 aerial capture · 25 Mar 2026 · 12:15',
    imageUrl: '/panoramas/DJI_0385.webp',
    thumbnail: '/panoramas/DJI_0385_thumb.jpg',
    coordinates: [123.866349833333, 9.62344008333333],
  },
  {
    id: 'dji-0388',
    title: 'DJI_0388',
    description: 'DJI FC3582 aerial capture · 25 Mar 2026 · 12:35',
    imageUrl: '/panoramas/DJI_0388.webp',
    thumbnail: '/panoramas/DJI_0388_thumb.jpg',
    coordinates: [123.827766666667, 9.58193075],
  },
  {
    id: 'dji-0389',
    title: 'DJI_0389',
    description: 'DJI FC3582 aerial capture · 25 Mar 2026 · 13:11',
    imageUrl: '/panoramas/DJI_0389.webp',
    thumbnail: '/panoramas/DJI_0389_thumb.jpg',
    coordinates: [123.771378083333, 9.55026755555556],
  },
  {
    id: 'dji-0393',
    title: 'DJI_0393',
    description: 'DJI FC3582 aerial capture · 25 Mar 2026 · 13:14',
    imageUrl: '/panoramas/DJI_0393.webp',
    thumbnail: '/panoramas/DJI_0393_thumb.jpg',
    coordinates: [123.773564805556, 9.54801419444444],
  },
  {
    id: 'dji-0396',
    title: 'DJI_0396',
    description: 'DJI FC3582 aerial capture · 25 Mar 2026 · 13:29',
    imageUrl: '/panoramas/DJI_0396.webp',
    thumbnail: '/panoramas/DJI_0396_thumb.jpg',
    coordinates: [123.75390525, 9.56679611111111],
  },
  {
    id: 'dji-0404',
    title: 'DJI_0404',
    description: 'DJI FC3582 aerial capture · 25 Mar 2026 · 14:13',
    imageUrl: '/panoramas/DJI_0404.webp',
    thumbnail: '/panoramas/DJI_0404_thumb.jpg',
    coordinates: [123.753248083333, 9.60032422222222],
  },
  {
    id: 'dji-0407',
    title: 'DJI_0407',
    description: 'DJI FC3582 aerial capture · 25 Mar 2026 · 14:36',
    imageUrl: '/panoramas/DJI_0407.webp',
    thumbnail: '/panoramas/DJI_0407_thumb.jpg',
    coordinates: [123.791130055556, 9.58501877777778],
  },
];

/**
 * GeoJSON FeatureCollection built automatically from PANORAMA_LOCATIONS.
 * Used directly as the MapLibre GeoJSON source data.
 */
export const PANORAMA_GEOJSON = {
  type: 'FeatureCollection' as const,
  features: PANORAMA_LOCATIONS.map((loc) => ({
    type: 'Feature' as const,
    geometry: {
      type: 'Point' as const,
      coordinates: loc.coordinates,
    },
    properties: {
      id: loc.id,
      title: loc.title,
      description: loc.description,
      imageUrl: loc.imageUrl,
      thumbnail: loc.thumbnail ?? null,
    },
  })),
};
