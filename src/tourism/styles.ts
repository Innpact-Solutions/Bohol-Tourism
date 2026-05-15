// Tourism module — color tokens + MapLibre paint expressions
// Single source of truth for tourism styling. Match standalone dashboard palette.

export const TIER_COLORS = {
  Primary:   { stroke: '#B47228', fillOpacity: 0.22 },
  Emerging:  { stroke: '#C84A35', fillOpacity: 0.16 },
  Satellite: { stroke: '#5C7A87', fillOpacity: 0.14 },
} as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Beach:               '#D9A33A',
  Marine:              '#2D7A8C',
  'Nature / Viewpoint':'#4F8454',
  Heritage:            '#A8482E',
  Faith:               '#5E4F8C',
  'Urban Park':        '#7E8B47',
  'Other Attraction':  '#8A8275',
  EXCLUDED:            '#BBB',
};

export const TIER_LABEL_COLOR: Record<string, string> = {
  Anchor:     '#1F2738',
  Secondary:  '#4A4137',
  Supportive: '#7E7567',
};

// MapLibre paint expressions ---------------------------------------------

// Cluster polygon fill — categorized by tier
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
    'Primary',   TIER_COLORS.Primary.fillOpacity,
    'Emerging',  TIER_COLORS.Emerging.fillOpacity,
    'Satellite', TIER_COLORS.Satellite.fillOpacity,
    0.1,
  ] as any,
};

export const clusterOutlinePaint = {
  'line-color': [
    'match',
    ['get', 'tier'],
    'Primary',   TIER_COLORS.Primary.stroke,
    'Emerging',  TIER_COLORS.Emerging.stroke,
    'Satellite', TIER_COLORS.Satellite.stroke,
    '#888',
  ] as any,
  'line-width': 2,
  'line-opacity': 0.85,
  'line-dasharray': [
    'case',
    ['==', ['get', 'tier'], 'Satellite'],
    ['literal', [4, 3]],
    ['literal', [1]],
  ] as any,
};

// Sites — color by category, size by tier
const categoryColorExpr = [
  'match',
  ['get', 'site_cat'],
  ...Object.entries(CATEGORY_COLORS).flatMap(([k, v]) => [k, v]),
  '#8A8275',
] as any;

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

// Premium hospitality — filled triangle look approximated with filled circle in orange
export const premiumAssetPaint = {
  'circle-radius': 4,
  'circle-color': '#C47A1F',
  'circle-stroke-width': 0,
  'circle-opacity': 0.85,
};

// Quality hospitality — outline only
export const qualityAssetPaint = {
  'circle-radius': 3,
  'circle-color': 'transparent',
  'circle-stroke-color': '#C47A1F',
  'circle-stroke-width': 1.3,
  'circle-opacity': 0.8,
};
