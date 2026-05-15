// Tourism site map icons — colored badges with category glyphs.
//
// Each tourism site category renders as a small filled circle (in the
// category's brand color, matching the Tourism Sites panel on the left) with
// a white lucide-style glyph centered on top. Built as inline SVG → loaded
// into MapLibre via map.addImage() so the icon symbol layers can reference
// them by ID.

import { CATEGORY_COLORS } from './styles';

// Inner SVG path markup for each category — sourced from lucide-react icons.
// All paths assume a 24×24 viewBox and currentColor stroke; we render with
// white stroke on top of the category-colored disk.
const CATEGORY_GLYPHS: Record<string, string> = {
  // Umbrella → Beach
  Beach: `
    <path d="M22 12a10.06 10.06 1 0 0-20 0Z"/>
    <path d="M12 12v8a2 2 0 0 0 4 0"/>
    <path d="M12 2v1"/>`,
  // Fish → Marine
  Marine: `
    <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/>
    <path d="M18 12v.5"/>
    <path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/>
    <path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33"/>
    <path d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4"/>
    <path d="m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98"/>`,
  // Mountain → Nature / Viewpoint
  'Nature / Viewpoint': `
    <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>`,
  // Landmark → Heritage
  Heritage: `
    <line x1="3" x2="21" y1="22" y2="22"/>
    <line x1="6" x2="6" y1="18" y2="11"/>
    <line x1="10" x2="10" y1="18" y2="11"/>
    <line x1="14" x2="14" y1="18" y2="11"/>
    <line x1="18" x2="18" y1="18" y2="11"/>
    <polygon points="12 2 20 7 4 7"/>`,
  // Church → Faith
  Faith: `
    <path d="M10 9h4"/>
    <path d="M12 7v5"/>
    <path d="M14 22v-4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v4"/>
    <path d="M18 22V5.618a1 1 0 0 0-.553-.894l-4.553-2.277a2 2 0 0 0-1.788 0L6.553 4.724A1 1 0 0 0 6 5.618V22"/>
    <path d="m18 7 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.618a1 1 0 0 1 .553-.894L6 7"/>`,
  // Trees → Urban Park
  'Urban Park': `
    <path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/>
    <path d="M7 16v6"/>
    <path d="M13 19v3"/>
    <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>`,
};

// Map site_cat → MapLibre image id. Used by the symbol layers' icon-image
// expression and by registerTourismIcons() to register matching images.
export const TOURISM_ICON_IDS: Record<string, string> = {
  Beach:               'tourism-icon-beach',
  Marine:              'tourism-icon-marine',
  'Nature / Viewpoint':'tourism-icon-nature',
  Heritage:            'tourism-icon-heritage',
  Faith:               'tourism-icon-faith',
  'Urban Park':        'tourism-icon-urbanpark',
};

const ICON_PX = 64; // base raster size; icon-size in style expressions scales it per tier

function buildSvgDataUrl(color: string, innerGlyph: string): string {
  // Render at 2× for crisp display on high-DPI screens via { pixelRatio: 2 }.
  const px = ICON_PX * 2;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="27" fill="${color}" stroke="#FFFFFF" stroke-width="3.5"/>
  <g transform="translate(16 16)"
     fill="none"
     stroke="#FFFFFF"
     stroke-width="2.6"
     stroke-linecap="round"
     stroke-linejoin="round">
    ${innerGlyph}
  </g>
</svg>`.trim();
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load tourism icon: ${src.slice(0, 60)}…`));
    img.src = src;
  });
}

// Module-level guard so we only ever register the icons once per map.
const REGISTERED = new WeakSet<any>();

/**
 * Register all tourism site icons into the given map. Idempotent — safe to
 * call repeatedly; subsequent calls become no-ops.
 */
export async function registerTourismIcons(map: any): Promise<void> {
  if (!map || REGISTERED.has(map)) return;
  REGISTERED.add(map);

  const entries = Object.entries(TOURISM_ICON_IDS) as Array<[string, string]>;
  await Promise.all(entries.map(async ([cat, iconId]) => {
    if (map.hasImage && map.hasImage(iconId)) return;
    const color = CATEGORY_COLORS[cat] || '#8A8275';
    const glyph = CATEGORY_GLYPHS[cat] || '';
    try {
      const img = await loadImage(buildSvgDataUrl(color, glyph));
      if (map.hasImage && !map.hasImage(iconId)) {
        map.addImage(iconId, img, { pixelRatio: 2 });
      }
    } catch (err) {
      // Non-fatal — site will fall back to no icon if loading fails.
      // eslint-disable-next-line no-console
      console.warn('[tourism] icon register failed for', cat, err);
    }
  }));
}

// MapLibre style expression: site_cat → icon-image. Wire this into the
// per-tier symbol layers' `icon-image` paint property.
export const tourismIconImageExpr: any = [
  'match',
  ['get', 'site_cat'],
  'Beach',                TOURISM_ICON_IDS.Beach,
  'Marine',               TOURISM_ICON_IDS.Marine,
  'Nature / Viewpoint',   TOURISM_ICON_IDS['Nature / Viewpoint'],
  'Heritage',             TOURISM_ICON_IDS.Heritage,
  'Faith',                TOURISM_ICON_IDS.Faith,
  'Urban Park',           TOURISM_ICON_IDS['Urban Park'],
  // Fallback — Heritage badge color is close enough to neutral; any feature
  // missing site_cat just gets the heritage marker rather than vanishing.
  TOURISM_ICON_IDS.Heritage,
];
