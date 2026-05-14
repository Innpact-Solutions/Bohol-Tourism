/**
 * ============================================================================
 * CITY CONFIGURATION TEMPLATE
 * ============================================================================
 * 
 * This file contains all city-specific configuration for the Multi-Hazard 
 * Climate Screening & Mobility Exposure Dashboard.
 * 
 * USAGE:
 * 1. Copy this file to `/config/cityConfig.ts`
 * 2. Replace all placeholder values with your city-specific data
 * 3. Update GeoServer workspace and layer names
 * 4. Configure map bounds and initial view
 * 5. Set up API endpoints
 * 
 * ============================================================================
 */

/**
 * BASIC CITY INFORMATION
 */
export const CITY_CONFIG = {
  // City identification
  name: 'YOUR_CITY_NAME',              // e.g., 'Bhubaneswar'
  country: 'YOUR_COUNTRY',              // e.g., 'India'
  region: 'YOUR_REGION',                // e.g., 'Odisha'
  
  // Display settings
  displayName: 'YOUR_CITY_DISPLAY_NAME', // Used in UI headers
  shortCode: 'CITY_CODE',               // e.g., 'BBSR' for Bhubaneswar
  
  // Timezone
  timezone: 'YOUR_TIMEZONE',            // e.g., 'Asia/Kolkata'
};

/**
 * GEOSERVER CONFIGURATION
 * Configure your GeoServer instance and workspace
 */
export const GEOSERVER_CONFIG = {
  // GeoServer base URL (without /wms or /wmts)
  baseUrl: 'https://YOUR_GEOSERVER_URL/geoserver',
  
  // GeoServer workspace name
  workspace: 'YOUR_WORKSPACE_NAME',    // e.g., 'GIZ_BBSR'
  
  // Service URLs (auto-constructed from baseUrl and workspace)
  get wmsUrl() {
    return `${this.baseUrl}/${this.workspace}/wms`;
  },
  
  get wmtsUrl() {
    return `${this.baseUrl}/gwc/service/wmts`;
  },
  
  // Authentication (if required)
  auth: {
    required: false,
    username: '',
    password: '',
  },
};

/**
 * MAP CONFIGURATION
 * Set map bounds, initial view, and zoom levels
 */
export const MAP_CONFIG = {
  // Initial map view
  center: {
    lng: 0.0,        // Longitude - REPLACE with city center
    lat: 0.0,        // Latitude - REPLACE with city center
  },
  
  // Initial zoom level (1-22, where 22 is most zoomed in)
  initialZoom: 12,
  
  // Minimum and maximum zoom levels
  minZoom: 8,
  maxZoom: 20,
  
  // Map bounds (southwest and northeast corners)
  // This restricts the map area to your city
  bounds: {
    southwest: { lng: 0.0, lat: 0.0 },  // REPLACE with actual bounds
    northeast: { lng: 0.0, lat: 0.0 },  // REPLACE with actual bounds
  },
  
  // 3D buildings configuration
  buildings3D: {
    enabled: true,
    defaultHeight: 10,     // Default height in meters if not in data
    extrusionOpacity: 0.8,
    extrusionColor: '#E0E0E0',
  },
};

/**
 * BASEMAP STYLES
 * MapLibre basemap style URLs
 */
export const BASEMAP_STYLES = {
  default: 'mapbox://styles/mapbox/light-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
  
  // Or use custom style JSON URL
  // custom: 'https://your-style-server.com/style.json',
};

/**
 * LAYER NAMING CONVENTIONS
 * Define how layer names are constructed in your GeoServer
 */
export const LAYER_NAMING = {
  // Prefix pattern for layer names
  // Examples:
  //   '{workspace}:{layerName}' -> 'GIZ_BBSR:HHI_2025'
  //   '{layerName}' -> 'HHI_2025'
  pattern: '{workspace}:{layerName}',
  
  // Separator for multi-part layer names
  separator: '_',
  
  // Year format in layer names
  // Examples: 'YYYY' -> '2025', 'YY' -> '25'
  yearFormat: 'YYYY',
};

/**
 * CLIMATE SCENARIOS
 * Define available climate scenarios and time periods
 */
export const SCENARIO_CONFIG = {
  // Historical data years available
  historicalYears: [
    2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024
  ],
  
  // Baseline year
  baselineYear: 2025,
  
  // Future projection scenarios (SSP = Shared Socioeconomic Pathways)
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

/**
 * HAZARD SECTORS
 * Define which hazard sectors are available for your city
 */
export const HAZARD_SECTORS = {
  heatStress: {
    enabled: true,
    hasScenarios: true,      // Has future projections
    hasHistorical: true,     // Has historical data
    layers: [
      'heat_hhi',   // Heat Hazard Index
      'heat_lst',   // Land Surface Temperature
      'heat_ast',   // Air Surface Temperature
      'heat_wbt',   // Wet-Bulb Temperature
      'heat_wbgt',  // Wet-Bulb Globe Temperature
      'heat_uhi',   // Urban Heat Island
      'heat_rh',    // Relative Humidity
    ],
  },
  
  airPollution: {
    enabled: true,
    hasScenarios: false,     // Baseline only
    hasHistorical: false,
    layers: [
      'air_aqi',    // Air Quality Index
      'air_pm25',   // PM2.5
      'air_pm10',   // PM10
      'air_no2',    // Nitrogen Dioxide
      'air_so2',    // Sulfur Dioxide
      'air_co',     // Carbon Monoxide
      'air_o3',     // Ozone
    ],
  },
  
  flood: {
    enabled: true,
    hasScenarios: false,     // Baseline only
    hasHistorical: false,
    layers: [
      'flood_fhi',  // Flood Hazard Index
    ],
  },
  
  multiHazard: {
    enabled: true,
    hasScenarios: false,     // Baseline only
    hasHistorical: false,
    layers: [
      'multihazard_assessment',
    ],
  },
  
  roadSafety: {
    enabled: true,
    hasScenarios: false,
    hasHistorical: false,
    layers: [
      'irap_vehicle',      // Vehicle Occupant Safety
      'irap_motorcycle',   // Motorcyclist Safety
      'irap_bicycle',      // Bicyclist Safety
      'irap_pedestrian',   // Pedestrian Safety
    ],
  },
};

/**
 * INFRASTRUCTURE LAYERS
 * Define infrastructure and base layers available
 */
export const INFRASTRUCTURE_CONFIG = {
  // Educational facilities
  education: {
    enabled: true,
    categories: [
      'primary_schools',
      'secondary_schools',
      'higher_education',
      'vocational_training',
    ],
  },
  
  // Healthcare facilities
  healthcare: {
    enabled: true,
    categories: [
      'hospitals',
      'clinics',
      'health_centers',
      'pharmacies',
    ],
  },
  
  // Public amenities
  publicAmenities: {
    enabled: true,
    categories: [
      'parks',
      'libraries',
      'community_centers',
      'sports_facilities',
    ],
  },
  
  // Transport infrastructure
  transport: {
    enabled: true,
    categories: [
      'bus_stops',
      'railway_stations',
      'airports',
      'taxi_stands',
    ],
  },
  
  // Base layers
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

/**
 * API ENDPOINTS
 * Configure custom API endpoints for data queries
 */
export const API_CONFIG = {
  // Base API URL
  baseUrl: 'https://YOUR_API_URL',
  
  // Endpoint paths
  endpoints: {
    // Building hazard analysis
    buildingHazard: '/api/building-hazard',
    
    // Area-based KPI calculations
    areaKPI: '/api/area-kpi',
    
    // POI (Point of Interest) queries
    poiQuery: '/api/poi-query',
    
    // Road network analysis
    roadNetwork: '/api/road-network',
    
    // Road safety analysis
    roadSafety: '/api/road-safety',
    
    // Historical trends
    historicalTrends: '/api/historical-trends',
    
    // IMD heat calendar data
    imdHeatCalendar: '/api/imd-heat-calendar',
  },
  
  // API timeout (milliseconds)
  timeout: 30000,
  
  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000,
  },
};

/**
 * WARD/DISTRICT CONFIGURATION
 * Define administrative boundaries (wards, districts, zones)
 */
export const WARD_CONFIG = {
  // Type of administrative division
  divisionType: 'ward',  // 'ward', 'district', 'zone', etc.
  
  // Total number of divisions
  totalWards: 0,         // REPLACE with actual number
  
  // Ward/district labels
  labelField: 'Ward',    // GeoServer field name for ward labels
  
  // Ward filtering
  enableFiltering: true,
};

/**
 * DATA EXPORT CONFIGURATION
 */
export const EXPORT_CONFIG = {
  // Allowed export formats
  formats: ['csv', 'xlsx', 'geojson', 'pdf'],
  
  // Maximum export size (number of records)
  maxRecords: 10000,
  
  // Enable chart download
  enableChartDownload: true,
};

/**
 * FEATURE FLAGS
 * Enable/disable specific features
 */
export const FEATURE_FLAGS = {
  // Core features
  tutorial: true,
  comparison: true,
  scenarioPlanning: true,
  
  // Analytics features
  historicalTrends: true,
  climateProjections: true,
  imdHeatAnalytics: true,
  
  // Advanced features
  buildingAnalysis: true,
  roadSafetyAnalysis: true,
  poiQueries: true,
  
  // UI features
  opacityControl: true,
  layerOrdering: true,
  wardFiltering: true,
  
  // 3D features
  buildings3D: true,
  terrain3D: false,
};

/**
 * BRANDING CONFIGURATION
 */
export const BRANDING_CONFIG = {
  // Organization name
  organization: 'YOUR_ORGANIZATION',
  
  // Logo URLs
  logo: {
    header: '/path/to/header-logo.png',
    footer: '/path/to/footer-logo.png',
  },
  
  // Color scheme
  colors: {
    primary: '#2563EB',      // Blue
    secondary: '#14B8A6',    // Teal
    accent: '#E3000F',       // Red (iRAP color)
    
    // Hazard colors
    heat: '#EF4444',
    air: '#8B5CF6',
    flood: '#3B82F6',
    multiHazard: '#F59E0B',
    roadSafety: '#14B8A6',
  },
  
  // Footer text
  footer: {
    copyright: `© ${new Date().getFullYear()} YOUR_ORGANIZATION`,
    credits: 'Developed by YOUR_TEAM',
  },
};

/**
 * DEFAULT VALUES
 * Default values for various settings
 */
export const DEFAULTS = {
  // Default opacity for layers
  layerOpacity: 0.7,
  
  // Default sector to show on load
  defaultSector: 'heat',
  
  // Default layer within sector
  defaultLayer: 'heat_hhi',
  
  // Default scenario
  defaultScenario: 'baseline_2025',
  
  // Default base layers (active on load)
  defaultBaseLayers: ['road_network_base', 'municipal_boundary'],
};

/**
 * VALIDATION HELPER
 * Validates that configuration is complete
 */
export function validateCityConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (CITY_CONFIG.name === 'YOUR_CITY_NAME') {
    errors.push('CITY_CONFIG.name must be updated');
  }
  
  if (GEOSERVER_CONFIG.workspace === 'YOUR_WORKSPACE_NAME') {
    errors.push('GEOSERVER_CONFIG.workspace must be updated');
  }
  
  if (MAP_CONFIG.center.lng === 0 && MAP_CONFIG.center.lat === 0) {
    errors.push('MAP_CONFIG.center must be updated with city coordinates');
  }
  
  if (GEOSERVER_CONFIG.baseUrl.includes('YOUR_GEOSERVER_URL')) {
    errors.push('GEOSERVER_CONFIG.baseUrl must be updated');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
