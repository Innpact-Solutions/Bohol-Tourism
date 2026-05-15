// Tourism module — color tokens + MapLibre paint expressions
// Single source of truth for tourism styling. Match standalone dashboard palette.

export const TIER_COLORS = {
  // Vivid amber
  Primary:   { stroke: '#E07A18', fillOpacity: 0.22 },
  // Deep violet — different hue family from amber/teal so it never reads as "reddish-orange"
  Emerging:  { stroke: '#6D28D9', fillOpacity: 0.16 },
  // Strong blue — high-contrast cool tone, far more visible than the previous muted teal
  Satellite: { stroke: '#2563EB', fillOpacity: 0.18 },
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Beach:               '#D9A33A',
  Marine:              '#2D7A8C',
  'Nature / Viewpoint':'#4F8454',
  Heritage:            '#800000',
  Faith:               '#DC2626',
  'Urban Park':        '#7E8B47',
  EXCLUDED:            '#BBB',
};

export const TIER_LABEL_COLOR: Record<string, string> = {
  Anchor:     '#1F2738',
  Secondary:  '#4A4137',
  Supportive: '#7E7567',
};

// MapLibre paint expressions ---------------------------------------------

// Cluster polygon fill — categorized by tier.
// Each tier gets a distinct opacity so the visual hierarchy is clear:
// Primary = boldest, Emerging = mid, Satellite = subtle.
export const clusterFillPaint = {
  'fill-color': [
    'match',
    ['get', 'tier'],
    'Primary',   TIER_COLORS.Primary.stroke,
    'Emerging',  TIER_COLORS.Emerging.stroke,
    'Satellite', TIER_COLORS.Satellite.stroke,
    '#888',
  ] as any,
  'fill-opacity': [
    'match',
    ['get', 'tier'],
    'Primary',   0.22,
    'Emerging',  0.16,
    'Satellite', 0.18,
    0.10,
  ] as any,
  'fill-antialias': true,
};

// Cluster outline casing — dark navy stroke drawn UNDER the white outline so the
// white reads crisply against any basemap (light, satellite, terrain). This is the
// classic "highway casing" trick: wide dark line + narrower light line on top.
export const clusterOutlineCasingPaint = {
  'line-color': '#0F172A',
  'line-width': [
    'interpolate', ['linear'], ['zoom'],
    6,  5.0,
    9,  7.0,
    13, 9.5,
    16, 12.0,
  ] as any,
  'line-opacity': 0.9,
  'line-blur': 0,
  'line-join': 'round' as const,
  'line-cap': 'round' as const,
};

// Cluster outline — crisp thick WHITE stroke drawn on top of the dark casing.
// Tier identity is carried by the fill color (and by the legend swatch).
export const clusterOutlinePaint = {
  'line-color': '#FFFFFF',
  'line-width': [
    'interpolate', ['linear'], ['zoom'],
    6,  3.0,
    9,  4.5,
    13, 6.0,
    16, 8.0,
  ] as any,
  'line-opacity': 1,
  'line-blur': 0,
  'line-join': 'round' as const,
  'line-cap': 'round' as const,
};

// Pulse glow — a wide, soft, blurred line drawn under each cluster outline.
// Its line-width and line-opacity are animated from TourismLayers to create
// a gentle "breathing" glow around active clusters.
export const clusterPulsePaint = {
  'line-color': [
    'match',
    ['get', 'tier'],
    'Primary',   TIER_COLORS.Primary.stroke,
    'Emerging',  TIER_COLORS.Emerging.stroke,
    'Satellite', TIER_COLORS.Satellite.stroke,
    '#888',
  ] as any,
  'line-width': 6,
  'line-opacity': 0.22,
  'line-blur': 4,
  'line-join': 'round' as const,
  'line-cap': 'round' as const,
};

// Hover overlay — thick bright outline drawn only over the currently-hovered
// cluster polygon. Filter is updated dynamically from TourismLayers.
export const clusterHoverOutlinePaint = {
  'line-color': [
    'match',
    ['get', 'tier'],
    'Primary',   TIER_COLORS.Primary.stroke,
    'Emerging',  TIER_COLORS.Emerging.stroke,
    'Satellite', TIER_COLORS.Satellite.stroke,
    '#222',
  ] as any,
  'line-width': [
    'interpolate', ['linear'], ['zoom'],
    9, 3.5, 13, 5, 16, 6.5,
  ] as any,
  'line-opacity': 1,
  'line-blur': 0,
  'line-join': 'round' as const,
  'line-cap': 'round' as const,
};

// Hover halo — a soft white glow drawn under the hover outline so the
// highlight reads on any underlying basemap color.
export const clusterHoverHaloPaint = {
  'line-color': '#FFFFFF',
  'line-width': [
    'interpolate', ['linear'], ['zoom'],
    9, 7, 13, 9.5, 16, 12,
  ] as any,
  'line-opacity': 0.65,
  'line-blur': 2.5,
  'line-join': 'round' as const,
  'line-cap': 'round' as const,
};

export const clusterHoverFillPaint = {
  'fill-color': [
    'match',
    ['get', 'tier'],
    'Primary',   TIER_COLORS.Primary.stroke,
    'Emerging',  TIER_COLORS.Emerging.stroke,
    'Satellite', TIER_COLORS.Satellite.stroke,
    '#888',
  ] as any,
  'fill-opacity': 0.12,
};

// Sites — color by category, sized & styled by performance tier
const categoryColorExpr = [
  'match',
  ['get', 'site_cat'],
  ...Object.entries(CATEGORY_COLORS).flatMap(([k, v]) => [k, v]),
  '#8A8275',
] as any;

// Anchor sites — large, vivid, prominent white halo for max contrast on grey base.
export const anchorSitePaint = {
  'circle-radius': [
    'interpolate', ['linear'], ['zoom'],
    9, 6.5,
    13, 9,
    16, 12,
  ] as any,
  'circle-color': categoryColorExpr,
  'circle-stroke-color': '#FFFFFF',
  'circle-stroke-width': 2.4,
  'circle-stroke-opacity': 0.95,
  'circle-opacity': 1,
  'circle-pitch-alignment': 'map' as const,
};

// Secondary sites — medium, clean white ring.
export const secondarySitePaint = {
  'circle-radius': [
    'interpolate', ['linear'], ['zoom'],
    9, 4.5,
    13, 6.5,
    16, 8.5,
  ] as any,
  'circle-color': categoryColorExpr,
  'circle-stroke-color': '#FFFFFF',
  'circle-stroke-width': 1.6,
  'circle-stroke-opacity': 0.9,
  'circle-opacity': 0.95,
  'circle-pitch-alignment': 'map' as const,
};

// Supportive sites — small, soft, with a subtle mid-grey ring for a refined feel.
export const supportiveSitePaint = {
  'circle-radius': [
    'interpolate', ['linear'], ['zoom'],
    9, 3,
    13, 4.5,
    16, 6,
  ] as any,
  'circle-color': categoryColorExpr,
  'circle-stroke-color': '#FFFFFF',
  'circle-stroke-width': 1,
  'circle-stroke-opacity': 0.85,
  'circle-opacity': 0.82,
  'circle-blur': 0.08,
  'circle-pitch-alignment': 'map' as const,
};

// Legacy combined paint (kept for back-compat with any external imports)
export const sitePointPaint = {
  'circle-radius': [
    'match',
    ['get', 'perf_tier'],
    'Anchor',     8,
    'Secondary',  6,
    'Supportive', 4.5,
    3,
  ] as any,
  'circle-color': categoryColorExpr,
  'circle-stroke-color': '#1F2738',
  'circle-stroke-width': [
    'match',
    ['get', 'perf_tier'],
    'Anchor',     2,
    'Secondary',  1.4,
    'Supportive', 1.2,
    1,
  ] as any,
  'circle-opacity': 0.95,
};

// Premium hospitality — deep violet filled marker with white outline.
// Same color as the Premium cluster bubble for visual consistency.
export const premiumAssetPaint = {
  'circle-radius': [
    'interpolate', ['linear'], ['zoom'],
    9, 4,
    13, 5.5,
    16, 7,
  ] as any,
  'circle-color': '#6D28D9',
  'circle-stroke-color': '#FFFFFF',
  'circle-stroke-width': 1.8,
  'circle-stroke-opacity': 0.95,
  'circle-opacity': 0.98,
  'circle-pitch-alignment': 'map' as const,
};

// Quality hospitality — light lavender filled marker with white outline.
// Same color as the Quality cluster bubble for visual consistency.
export const qualityAssetPaint = {
  'circle-radius': [
    'interpolate', ['linear'], ['zoom'],
    9, 3,
    13, 4,
    16, 5.5,
  ] as any,
  'circle-color': '#A78BFA',
  'circle-stroke-color': '#FFFFFF',
  'circle-stroke-width': 1.8,
  'circle-stroke-opacity': 0.95,
  'circle-opacity': 0.98,
  'circle-pitch-alignment': 'map' as const,
};
