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
  assetPhotoIndex: '/data/tourism/asset_photo_index.json',
  assetPhotoBase:  '/data/tourism/asset_photos',
  accommodationsBooking: '/data/tourism/accommodations_booking.geojson',
  accommodationBookingPhotoIndex: '/data/tourism/accommodation_booking_photo_index.json',
  accommodationBookingPhotoBase:  '/data/tourism/accommodation_photos',
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

// Per-cluster recommendations — keyed by cluster_id. Overrides the tier-level
// list above when an entry exists.
export const TOURISM_INTERVENTIONS_BY_CLUSTER: Record<number, { headline?: string; items: string[] }> = {
  1: {
    headline: 'Alona Beach Strip (Built-up 24.6% · Green 72.1% → 82%)',
    items: [
      'Proposed sewerage system for entire cluster',
      'Mandatory green roofs on hotels with ≥150 m² flat roof',
      'Well-designed banca berthing facility at the west end (organised island-hop launch)',
      'Shared low-speed Alona Road: pedestrian spine + e-trike + cycle hub at east entry',
      'Soft-loan for community homestays',
    ],
  },
  2: {
    headline: 'Tagbilaran Heritage Core (Built-up 51.6% · Green 47.6% → 65%) — most built-up + hottest + worst urban flood',
    items: [
      'Expand green cover from 47.6% → 65% (depave + sponge-park at Plaza Rizal + CBD canopy)',
      'Mandatory green roofs on BQ Mall, schools, hospitals, government offices, hotels',
      'Proposed stormwater drainage network with integrated NBS (bioswales + bioretention + tree pits)',
      'Proposed sewerage system for entire cluster',
      'Heritage urban-design kit: unified wayfinding, restored paving, heritage lighting, façade conservation, street furniture',
      'E-rickshaw hubs at port + Plaza Rizal + Dao terminal; ferry berth at port',
      'Sound-and-light at Cathedral + virtual guided tour for heritage precinct',
      'Soft-loan for adaptive-reuse heritage homestays',
    ],
  },
  3: {
    headline: 'Panglao West Coast Beaches (Built-up 17.7% · Green 82% → 90%)',
    items: [
      'Gazette hazard / setback line before any new permit',
      'Mangrove + beach-forest restoration (+5–10 ha)',
      'Shaded boardwalk linking Doljo / Hermit / Talisay',
      'Cycle lane on inland access road; e-trike + cycle node at Doljo entry',
      'Soft-loan for community homestays in Doljo',
    ],
  },
  4: {
    headline: 'Napaling Reef & Sardine Run (Built-up 4% · Green 94.9% → 96%)',
    items: [
      'Mooring buoys + no-anchor zone on the sardine drop-off',
      'Sealed septic / packaged STP for all stays',
      'Cycle lane + shaded pedestrian path along access road',
      'Small dive-operator berthing facility + rinse pavilion at Bil-isan',
      'Soft-loan for dive-operator-led homestays at Bil-isan',
    ],
  },
  5: {
    headline: 'Hinagdanan Cave Area (Built-up 4.7% · Green 94.6% → 96%)',
    items: [
      'Ban open septic; sealed / packaged STP only',
      'Proposed stormwater drainage network with integrated NBS (bioretention + rain gardens); no recharge pits (karst aquifer)',
      'Cycle lane on Dauis–Hinagdanan road; e-trike shuttle to cave',
      '"Karst Trail" single ticket: cave → monastery → Dap-Dap → Sibukaw',
      'Soft-loan for homestays along Dauis–Hinagdanan road',
    ],
  },
  6: {
    headline: 'Dauis Church & Waterfront (Built-up 27% · Green 70.5% → 82%) — heritage waterfront with heat + surge mix; 0 hotels today',
    items: [
      'Expand green cover from 70.5% → 82% (dense canopy on church plaza + mangrove fringe along waterfront)',
      'Green roofs on civic + school buildings',
      'Proposed sewerage system for entire cluster',
      'Elevate Dauis Bridge approaches; shaded waterfront promenade + cycle track',
      'Heritage urban-design kit: signage, lighting, plaza paving, façade treatment, street furniture',
      'E-trike + cycle hub at church plaza; tourism ferry berthing facility (Dauis ↔ Tagbilaran)',
      'Soft-loan for community homestays + plaza food-cluster',
    ],
  },
  7: {
    headline: 'Panglao Town Heritage (Built-up 5.7% · Green 94.3% → 96%) — heritage core with 75% flood + 3rd hottest',
    items: [
      'Expand green cover from 94.3% → 96% (coastal mangrove greenbelt + pocket parks with detention)',
      'Proposed stormwater drainage network with integrated NBS (bioswales + community park with detention basin on largest open parcel)',
      'Elevated walkways Church → Watchtower → Shell Museum; cycle lane + e-trike loop on non-flood land',
      'Heritage urban-design kit: signage, lighting, paving, packable plaza night-market (flood-aware)',
      'Virtual guided tour for heritage precinct',
      'Soft-loan for heritage-conservation homestays',
    ],
  },
  8: {
    headline: 'Blood Compact Shrine (Built-up 13.2% · Green 86.8% → 92%)',
    items: [
      'Off-road coach drop-off bay + shaded waiting + public toilets',
      'Continuous shade trees + tree pits along entire highway frontage',
      'Cycle track + shaded pedestrian path, 3.3 km link to Heritage Core',
      'Heritage urban-design touch-up: NHCP Sandugo interpretation, signage, lighting',
    ],
  },
  9: {
    headline: 'Balicasag Marine Sanctuary (Built-up 35% · Green 65% → 80%)',
    items: [
      'Solar + battery microgrid (retire diesel gensets)',
      'Packaged wastewater treatment for the single existing stay',
      'Well-designed arrival jetty + briefing pavilion + reef-safe rinse station on existing footprint',
      'Daily banca cap at Alona jetty',
      'Reframe as "marine-conservation experience"',
    ],
  },
};
