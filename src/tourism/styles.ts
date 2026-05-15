// Tourism module — color tokens + MapLibre paint expressions
// Single source of truth for tourism styling. Match standalone dashboard palette.

export const TIER_COLORS = {
  // Vivid amber — warmest, most prominent
  Primary:   { stroke: '#E07A18', fillOpacity: 0.22 },
  // Deep rose / magenta — clearly different hue family from Primary
  Emerging:  { stroke: '#C2185B', fillOpacity: 0.16 },
  // Vibrant cyan/teal — coolest, sits far from the warm tiers on the color wheel
  Satellite: { stroke: '#0891B2', fillOpacity: 0.14 },
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Beach:               '#D9A33A',
  Marine:              '#2D7A8C',
  'Nature / Viewpoint':'#4F8454',
  Heritage:            '#A8482E',
  Faith:               '#5E4F8C',
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
    'Emerging',  0.13,
    'Satellite', 0.07,
    0.08,
  ] as any,
  'fill-antialias': true,
};

// Cluster outline — each tier has a unique line treatment:
//   Primary   = bold solid (highest weight)
//   Emerging  = mid long-dash
//   Satellite = slim short-dash / dotted
// Combined with distinct colors this makes the three tiers easy to tell apart.
export const clusterOutlinePaint = {
  'line-color': [
    'match',
    ['get', 'tier'],
    'Primary',   TIER_COLORS.Primary.stroke,
    'Emerging',  TIER_COLORS.Emerging.stroke,
    'Satellite', TIER_COLORS.Satellite.stroke,
    '#888',
  ] as any,
  'line-width': [
    'interpolate', ['linear'], ['zoom'],
    9,  ['match', ['get', 'tier'], 'Primary', 2.2, 'Emerging', 1.8, 'Satellite', 1.2, 1.5],
    13, ['match', ['get', 'tier'], 'Primary', 3.4, 'Emerging', 2.6, 'Satellite', 1.8, 2.0],
    16, ['match', ['get', 'tier'], 'Primary', 4.4, 'Emerging', 3.4, 'Satellite', 2.4, 2.6],
  ] as any,
  'line-opacity': [
    'match',
    ['get', 'tier'],
    'Primary',   0.95,
    'Emerging',  0.9,
    'Satellite', 0.8,
    0.85,
  ] as any,
  'line-blur': 0.4,
  'line-dasharray': [
    'match',
    ['get', 'tier'],
    // Primary  → solid line
    'Primary',   ['literal', [1]],
    // Emerging → dash-dot-dash (clearly different from any plain dashed line)
    'Emerging',  ['literal', [4, 1.5, 1, 1.5]],
    // Satellite → fine dotted (small dot, large gap)
    'Satellite', ['literal', [0.6, 2.4]],
    ['literal', [1]],
  ] as any,
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
  'line-width': 8,
  'line-opacity': 0.35,
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

// Premium hospitality — bold filled marker (orange), with white halo.
export const premiumAssetPaint = {
  'circle-radius': [
    'interpolate', ['linear'], ['zoom'],
    9, 4,
    13, 5.5,
    16, 7,
  ] as any,
  'circle-color': '#C47A1F',
  'circle-stroke-color': '#FFFFFF',
  'circle-stroke-width': 1.8,
  'circle-stroke-opacity': 0.95,
  'circle-opacity': 0.98,
  'circle-pitch-alignment': 'map' as const,
};

// Quality hospitality — outline-only marker.
export const qualityAssetPaint = {
  'circle-radius': [
    'interpolate', ['linear'], ['zoom'],
    9, 3,
    13, 4,
    16, 5.5,
  ] as any,
  'circle-color': '#FFFFFF',
  'circle-stroke-color': '#C47A1F',
  'circle-stroke-width': 1.8,
  'circle-stroke-opacity': 0.95,
  'circle-opacity': 0.95,
  'circle-pitch-alignment': 'map' as const,
};
