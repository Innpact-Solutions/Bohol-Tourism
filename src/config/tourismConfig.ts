// Tourism module — paths and feature flags.
// Kept separate from cityConfig.ts so the existing exports are not perturbed.

export const TOURISM_ENABLED = true;

export const TOURISM_PATHS = {
  clusters:   '/data/tourism/clusters.geojson',
  sites:      '/data/tourism/sites.geojson',
  assets:     '/data/tourism/assets.geojson',
  membership: '/data/tourism/cluster_membership.json',
  photoIndex: '/data/tourism/photo_index.json',
  photoBase:  '/data/tourism/photos',
} as const;

// Initial map view tuned for the 3-LGU tourism study area
export const TOURISM_MAP_VIEW = {
  center: { lng: 123.82, lat: 9.60 } as const,
  zoom: 11.5,
};

// What appears in the legend / detail panel as "recommended interventions"
export const TOURISM_INTERVENTIONS: Record<string, string[]> = {
  Primary: [
    'Full intervention stack — highest investment priority',
    'Pedestrian connectivity, signage, cycle infrastructure',
    'Cluster-scale stormwater + nature-based solutions',
    'E-mobility hubs (e-rickshaw + cycle rental)',
    'Sewerage and SWM upgrades sequenced first',
    'Soft-lending for community homestays',
  ],
  Emerging: [
    'Targeted infrastructure to support growth trajectory',
    'Selective pedestrian + signage upgrades',
    'Soft-lending priority for community-based hospitality',
    'Smaller-scale sanitation and SWM upgrades',
    'Cycle rental docking points',
  ],
  Satellite: [
    'Light-touch community-led interventions',
    'Signage and pedestrian safety upgrades',
    'Sanitation gap-filling where residential density overlaps',
    'Capacity-building support for local operators',
  ],
};
