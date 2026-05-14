/**
 * ============================================================================
 * CITY CONFIGURATION
 * ============================================================================
 * 
 * Active city configuration for the dashboard.
 * This is a working example - customize for your city.
 * 
 * See cityConfig.template.ts for detailed documentation.
 * ============================================================================
 */

export const CITY_CONFIG = {
  name: 'Bohol',
  country: 'Philippines',
  region: 'Central Visayas',
  displayName: 'Bohol Citywide Inclusive Sanitation (CWIS) Planning & Decision Support Dashboard',
  shortCode: 'BOHOL',
  timezone: 'Asia/Manila',
};

export const GEOSERVER_CONFIG = {
  baseUrl: 'https://your-geoserver.com/geoserver',
  workspace: 'BOHOL_CWIS',
  
  get wmsUrl() {
    return `${this.baseUrl}/${this.workspace}/wms`;
  },
  
  get wmtsUrl() {
    return `${this.baseUrl}/gwc/service/wmts`;
  },
  
  auth: {
    required: false,
    username: '',
    password: '',
  },
};

export const MAP_CONFIG = {
  center: {
    lng: 124.1139,  // Bohol (Tagbilaran City area)
    lat: 9.8399,
  },
  initialZoom: 11,
  minZoom: 8,
  maxZoom: 20,
  bounds: {
    southwest: { lng: 123.7, lat: 9.4 },
    northeast: { lng: 124.6, lat: 10.2 },
  },
  buildings3D: {
    enabled: true,
    defaultHeight: 10,
    extrusionOpacity: 0.8,
    extrusionColor: '#E0E0E0',
  },
};

export const BASEMAP_STYLES = {
  default: 'mapbox://styles/mapbox/light-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
};

export const LAYER_NAMING = {
  pattern: '{workspace}:{layerName}',
  separator: '_',
  yearFormat: 'YYYY',
};

export const SCENARIO_CONFIG = {
  historicalYears: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  baselineYear: 2025,
  scenarios: [
    {
      id: 'baseline_2025',
      name: 'Baseline 2025',
      year: 2025,
      description: 'Current baseline scenario',
    },
    {
      id: 'ssp1_2040',
      name: 'SSP1-2.6 (2040)',
      year: 2040,
      description: 'Sustainability scenario - Low emissions',
    },
    {
      id: 'ssp2_2040',
      name: 'SSP2-4.5 (2040)',
      year: 2040,
      description: 'Middle-of-the-road scenario - Medium emissions',
    },
    {
      id: 'ssp5_2040',
      name: 'SSP5-8.5 (2040)',
      year: 2040,
      description: 'Fossil-fueled development - High emissions',
    },
  ],
};

export const HAZARD_SECTORS = {
  heatStress: {
    enabled: true,
    hasScenarios: true,
    hasHistorical: true,
    layers: ['heat_hhi', 'heat_lst', 'heat_ast', 'heat_wbt', 'heat_wbgt', 'heat_uhi', 'heat_rh'],
  },
  airPollution: {
    enabled: true,
    hasScenarios: false,
    hasHistorical: false,
    layers: ['air_aqi', 'air_pm25', 'air_pm10', 'air_no2', 'air_so2', 'air_co', 'air_o3'],
  },
  flood: {
    enabled: true,
    hasScenarios: false,
    hasHistorical: false,
    layers: ['flood_fhi'],
  },
  multiHazard: {
    enabled: true,
    hasScenarios: false,
    hasHistorical: false,
    layers: ['multihazard_assessment'],
  },
  roadSafety: {
    enabled: true,
    hasScenarios: false,
    hasHistorical: false,
    layers: ['irap_vehicle', 'irap_motorcycle', 'irap_bicycle', 'irap_pedestrian'],
  },
};

export const INFRASTRUCTURE_CONFIG = {
  education: {
    enabled: true,
    categories: ['primary_schools', 'secondary_schools', 'higher_education', 'vocational_training'],
  },
  healthcare: {
    enabled: true,
    categories: ['hospitals', 'clinics', 'health_centers', 'pharmacies'],
  },
  publicAmenities: {
    enabled: true,
    categories: ['parks', 'libraries', 'community_centers', 'sports_facilities'],
  },
  transport: {
    enabled: true,
    categories: ['bus_stops', 'railway_stations', 'airports', 'taxi_stands'],
  },
  baseLayers: {
    roadNetwork: true,
    buildings: true,
    greenCover: true,
    builtUp: true,
    elevation: true,
    slumSettlements: true,
    municipalBoundary: true,
    waterbodies: true,
  },
};

export const API_CONFIG = {
  baseUrl: 'https://your-api.com',
  endpoints: {
    buildingHazard: '/api/building-hazard',
    areaKPI: '/api/area-kpi',
    poiQuery: '/api/poi-query',
    roadNetwork: '/api/road-network',
    roadSafety: '/api/road-safety',
    historicalTrends: '/api/historical-trends',
    imdHeatCalendar: '/api/imd-heat-calendar',
  },
  timeout: 30000,
  retry: {
    attempts: 3,
    delay: 1000,
  },
};

export const WARD_CONFIG = {
  divisionType: 'ward',
  totalWards: 0,
  labelField: 'Ward',
  enableFiltering: true,
};

export const EXPORT_CONFIG = {
  formats: ['csv', 'xlsx', 'geojson', 'pdf'],
  maxRecords: 10000,
  enableChartDownload: true,
};

export const FEATURE_FLAGS = {
  tutorial: true,
  comparison: true,
  scenarioPlanning: true,
  historicalTrends: true,
  climateProjections: true,
  imdHeatAnalytics: true,
  buildingAnalysis: true,
  roadSafetyAnalysis: true,
  poiQueries: true,
  opacityControl: true,
  layerOrdering: true,
  wardFiltering: true,
  buildings3D: true,
  terrain3D: false,
};

export const BRANDING_CONFIG = {
  organization: 'Your Organization',
  logo: {
    header: '/logo-header.png',
    footer: '/logo-footer.png',
  },
  colors: {
    primary: '#2563EB',
    secondary: '#14B8A6',
    accent: '#E3000F',
    heat: '#EF4444',
    air: '#8B5CF6',
    flood: '#3B82F6',
    multiHazard: '#F59E0B',
    roadSafety: '#14B8A6',
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} Your Organization`,
    credits: 'Developed by Your Team',
  },
};

export const DEFAULTS = {
  layerOpacity: 0.7,
  defaultSector: 'heat',
  defaultLayer: 'heat_hhi',
  defaultScenario: 'baseline_2025',
  defaultBaseLayers: ['road_network_base', 'municipal_boundary'],
};

export function validateCityConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (GEOSERVER_CONFIG.workspace === 'YOUR_WORKSPACE') {
    errors.push('GEOSERVER_CONFIG.workspace must be updated');
  }
  
  if (MAP_CONFIG.center.lng === 0 && MAP_CONFIG.center.lat === 0) {
    errors.push('MAP_CONFIG.center must be updated with city coordinates');
  }
  
  if (GEOSERVER_CONFIG.baseUrl.includes('your-geoserver.com')) {
    errors.push('GEOSERVER_CONFIG.baseUrl must be updated');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}