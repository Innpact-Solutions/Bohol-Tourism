/**
 * ============================================================================
 * GEOSERVER LAYER CONFIGURATION TEMPLATE
 * ============================================================================
 * 
 * This file defines all GeoServer layers used in the dashboard.
 * 
 * STRUCTURE:
 * 1. WMS/WMTS URLs
 * 2. Layer scenario mapping (historical years + future projections)
 * 3. Layer definitions with metadata
 * 4. Helper functions for dynamic layer loading
 * 
 * CUSTOMIZATION GUIDE:
 * - Update GEOSERVER_WMS_URL with your GeoServer URL
 * - Replace workspace name (e.g., 'GIZ_BBSR') with your workspace
 * - Update layer names to match your GeoServer published layers
 * - Configure scenario mappings for layers with time series data
 * - Set appropriate default opacity for each layer
 * 
 * ============================================================================
 */

import { GEOSERVER_CONFIG, SCENARIO_CONFIG } from './cityConfig';

/**
 * GEOSERVER SERVICE URLS
 */
export const GEOSERVER_WMS_URL = GEOSERVER_CONFIG.wmsUrl;
export const GEOSERVER_WMTS_URL = GEOSERVER_CONFIG.wmtsUrl;

/**
 * LAYER INTERFACE
 * Defines the structure of a GeoServer layer
 */
export interface GeoServerLayer {
  id: string;              // Internal layer ID (used in code)
  name: string;            // Display name (shown in UI)
  geoserverLayer: string;  // GeoServer layer name (workspace:layername)
  sector: string;          // Sector category (heat/air/flood/multihazard/road/base)
  opacity: number;         // Default opacity (0.0 to 1.0)
}

/**
 * SCENARIO MAPPING
 * Maps layer IDs to scenario-specific GeoServer layer names
 * 
 * PATTERN:
 * layerId: {
 *   'year': 'workspace:LayerName_Year',
 *   'scenario_id': 'workspace:LayerName_Scenario',
 * }
 * 
 * EXAMPLE for Heat Stress with projections:
 * heat_hhi: {
 *   '2015': 'GIZ_CITY:HHI_2015',           // Historical
 *   '2024': 'GIZ_CITY:HHI_2024',           // Latest historical
 *   'baseline_2025': 'GIZ_CITY:HHI_2025',  // Baseline
 *   'ssp1_2040': 'GIZ_CITY:HHI_2040_SSP1', // Future projection
 * }
 * 
 * EXAMPLE for static layers (no time series):
 * air_aqi: {
 *   'baseline_2025': 'GIZ_CITY:Air_AQI',  // Same for all scenarios
 * }
 */
const layerScenarioMap: Record<string, Record<string, string>> = {
  /**
   * HEAT STRESS LAYERS
   * Typically have both historical data and future projections
   */
  heat_hhi: {
    // Historical years (customize based on available data)
    '2015': '{workspace}:HHI_2015',
    '2024': '{workspace}:HHI_2024',
    // Future scenarios
    baseline_2025: '{workspace}:HHI_2025',
    ssp1_2040: '{workspace}:HHI_2040_SSP1',
    ssp2_2040: '{workspace}:HHI_2040_SSP2',
    ssp5_2040: '{workspace}:HHI_2040_SSP5',
  },
  
  heat_lst: {
    '2015': '{workspace}:LST_2015',
    '2024': '{workspace}:LST_2024',
    baseline_2025: '{workspace}:LST_2025',
    ssp1_2040: '{workspace}:LST_2040_SSP1',
    ssp2_2040: '{workspace}:LST_2040_SSP2',
    ssp5_2040: '{workspace}:LST_2040_SSP5',
  },
  
  heat_ast: {
    '2015': '{workspace}:AST_2015',
    '2024': '{workspace}:AST_2024',
    baseline_2025: '{workspace}:AST_2025',
    ssp1_2040: '{workspace}:AST_2040_SSP1',
    ssp2_2040: '{workspace}:AST_2040_SSP2',
    ssp5_2040: '{workspace}:AST_2040_SSP5',
  },
  
  heat_wbt: {
    '2015': '{workspace}:WBT_2015',
    '2024': '{workspace}:WBT_2024',
    baseline_2025: '{workspace}:WBT_2025',
    ssp1_2040: '{workspace}:WBT_2040_SSP1',
    ssp2_2040: '{workspace}:WBT_2040_SSP2',
    ssp5_2040: '{workspace}:WBT_2040_SSP5',
  },
  
  heat_wbgt: {
    '2015': '{workspace}:WBGT_2015',
    '2024': '{workspace}:WBGT_2024',
    baseline_2025: '{workspace}:WBGT_2025',
    ssp1_2040: '{workspace}:WBGT_2040_SSP1',
    ssp2_2040: '{workspace}:WBGT_2040_SSP2',
    ssp5_2040: '{workspace}:WBGT_2040_SSP5',
  },
  
  heat_uhi: {
    '2015': '{workspace}:UHI_2015',
    '2024': '{workspace}:UHI_2024',
    baseline_2025: '{workspace}:UHI_2025',
    // UHI typically has no future projections
    ssp1_2040: '{workspace}:UHI_2025',
    ssp2_2040: '{workspace}:UHI_2025',
    ssp5_2040: '{workspace}:UHI_2025',
  },
  
  heat_rh: {
    '2015': '{workspace}:RH_2015',
    '2024': '{workspace}:RH_2024',
    baseline_2025: '{workspace}:RH_2025',
    ssp1_2040: '{workspace}:RH_2025',
    ssp2_2040: '{workspace}:RH_2025',
    ssp5_2040: '{workspace}:RH_2025',
  },
  
  /**
   * AIR POLLUTION LAYERS
   * Typically baseline only (no historical or future projections)
   */
  air_aqi: {
    baseline_2025: '{workspace}:Air_AQI',
    ssp1_2040: '{workspace}:Air_AQI',
    ssp2_2040: '{workspace}:Air_AQI',
    ssp5_2040: '{workspace}:Air_AQI',
  },
  
  air_co: {
    baseline_2025: '{workspace}:Air_CO',
    ssp1_2040: '{workspace}:Air_CO',
    ssp2_2040: '{workspace}:Air_CO',
    ssp5_2040: '{workspace}:Air_CO',
  },
  
  air_no2: {
    baseline_2025: '{workspace}:Air_NO2',
    ssp1_2040: '{workspace}:Air_NO2',
    ssp2_2040: '{workspace}:Air_NO2',
    ssp5_2040: '{workspace}:Air_NO2',
  },
  
  air_o3: {
    baseline_2025: '{workspace}:Air_O3',
    ssp1_2040: '{workspace}:Air_O3',
    ssp2_2040: '{workspace}:Air_O3',
    ssp5_2040: '{workspace}:Air_O3',
  },
  
  air_pm10: {
    baseline_2025: '{workspace}:Air_PM10',
    ssp1_2040: '{workspace}:Air_PM10',
    ssp2_2040: '{workspace}:Air_PM10',
    ssp5_2040: '{workspace}:Air_PM10',
  },
  
  air_pm25: {
    baseline_2025: '{workspace}:Air_PM25',
    ssp1_2040: '{workspace}:Air_PM25',
    ssp2_2040: '{workspace}:Air_PM25',
    ssp5_2040: '{workspace}:Air_PM25',
  },
  
  air_so2: {
    baseline_2025: '{workspace}:Air_SO2',
    ssp1_2040: '{workspace}:Air_SO2',
    ssp2_2040: '{workspace}:Air_SO2',
    ssp5_2040: '{workspace}:Air_SO2',
  },
  
  /**
   * FLOOD LAYER
   * Baseline only
   */
  flood_fhi: {
    baseline_2025: '{workspace}:Flood_Hazard',
    ssp1_2040: '{workspace}:Flood_Hazard',
    ssp2_2040: '{workspace}:Flood_Hazard',
    ssp5_2040: '{workspace}:Flood_Hazard',
  },
  
  /**
   * MULTI-HAZARD ASSESSMENT
   * Baseline only
   */
  multihazard_assessment: {
    baseline_2025: '{workspace}:Multi_Hazard',
    ssp1_2040: '{workspace}:Multi_Hazard',
    ssp2_2040: '{workspace}:Multi_Hazard',
    ssp5_2040: '{workspace}:Multi_Hazard',
  },
};

/**
 * LAYER DEFINITIONS
 * Complete metadata for all layers
 * 
 * CUSTOMIZE:
 * - Update geoserverLayer with your actual workspace:layername
 * - Adjust opacity as needed (0.0 = transparent, 1.0 = opaque)
 * - Keep ID and sector values aligned with your code
 */
export const geoserverLayers: Record<string, GeoServerLayer> = {
  /**
   * HEAT STRESS SECTOR
   */
  heat_hhi: {
    id: 'heat_hhi',
    name: 'Heat Stress Hazard Index (HHI)',
    geoserverLayer: '{workspace}:HHI_2025',
    sector: 'heat',
    opacity: 0.7,
  },
  heat_lst: {
    id: 'heat_lst',
    name: 'Land Surface Temperature (LST)',
    geoserverLayer: '{workspace}:LST_2025',
    sector: 'heat',
    opacity: 0.7,
  },
  heat_ast: {
    id: 'heat_ast',
    name: 'Air Surface Temperature',
    geoserverLayer: '{workspace}:AST_2025',
    sector: 'heat',
    opacity: 0.7,
  },
  heat_wbt: {
    id: 'heat_wbt',
    name: 'Wet-Bulb Temperature (WBT)',
    geoserverLayer: '{workspace}:WBT_2025',
    sector: 'heat',
    opacity: 0.7,
  },
  heat_wbgt: {
    id: 'heat_wbgt',
    name: 'Wet-Bulb Globe Temperature (WBGT)',
    geoserverLayer: '{workspace}:WBGT_2025',
    sector: 'heat',
    opacity: 0.7,
  },
  heat_uhi: {
    id: 'heat_uhi',
    name: 'Urban Heat Island (UHI)',
    geoserverLayer: '{workspace}:UHI_2025',
    sector: 'heat',
    opacity: 0.7,
  },
  heat_rh: {
    id: 'heat_rh',
    name: 'Relative Humidity (RH)',
    geoserverLayer: '{workspace}:RH_2025',
    sector: 'heat',
    opacity: 0.7,
  },
  
  /**
   * AIR POLLUTION SECTOR
   */
  air_aqi: {
    id: 'air_aqi',
    name: 'Air Quality Index (AQI)',
    geoserverLayer: '{workspace}:Air_AQI',
    sector: 'air',
    opacity: 0.7,
  },
  air_co: {
    id: 'air_co',
    name: 'CO (Carbon Monoxide)',
    geoserverLayer: '{workspace}:Air_CO',
    sector: 'air',
    opacity: 0.7,
  },
  air_no2: {
    id: 'air_no2',
    name: 'NO₂ (Nitrogen Dioxide)',
    geoserverLayer: '{workspace}:Air_NO2',
    sector: 'air',
    opacity: 0.7,
  },
  air_o3: {
    id: 'air_o3',
    name: 'O₃ (Ozone)',
    geoserverLayer: '{workspace}:Air_O3',
    sector: 'air',
    opacity: 0.7,
  },
  air_pm10: {
    id: 'air_pm10',
    name: 'PM10',
    geoserverLayer: '{workspace}:Air_PM10',
    sector: 'air',
    opacity: 0.7,
  },
  air_pm25: {
    id: 'air_pm25',
    name: 'PM2.5',
    geoserverLayer: '{workspace}:Air_PM25',
    sector: 'air',
    opacity: 0.7,
  },
  air_so2: {
    id: 'air_so2',
    name: 'SO₂ (Sulfur Dioxide)',
    geoserverLayer: '{workspace}:Air_SO2',
    sector: 'air',
    opacity: 0.7,
  },
  
  /**
   * FLOOD SECTOR
   */
  flood_fhi: {
    id: 'flood_fhi',
    name: 'Flood Hazard Index',
    geoserverLayer: '{workspace}:Flood_Hazard',
    sector: 'flood',
    opacity: 0.7,
  },
  
  /**
   * MULTI-HAZARD SECTOR
   */
  multihazard_assessment: {
    id: 'multihazard_assessment',
    name: 'Multi-Hazard Assessment',
    geoserverLayer: '{workspace}:Multi_Hazard',
    sector: 'multihazard',
    opacity: 0.7,
  },
  
  /**
   * BASE LAYERS / INFRASTRUCTURE
   */
  road_network_base: {
    id: 'road_network_base',
    name: 'Road Network',
    geoserverLayer: '{workspace}:Road_Network',
    sector: 'base',
    opacity: 1.0,
  },
  slum_settlements: {
    id: 'slum_settlements',
    name: 'Slum Settlements',
    geoserverLayer: '{workspace}:Slum',
    sector: 'base',
    opacity: 0.7,
  },
  green_cover: {
    id: 'green_cover',
    name: 'Green Cover',
    geoserverLayer: '{workspace}:Green_Cover',
    sector: 'base',
    opacity: 0.7,
  },
  built_up: {
    id: 'built_up',
    name: 'Built-up Areas',
    geoserverLayer: '{workspace}:Builtup',
    sector: 'base',
    opacity: 0.7,
  },
  buildings: {
    id: 'buildings',
    name: 'Buildings',
    geoserverLayer: '{workspace}:Buildings',
    sector: 'base',
    opacity: 0.7,
  },
  elevation: {
    id: 'elevation',
    name: 'Elevation',
    geoserverLayer: '{workspace}:Elevation',
    sector: 'base',
    opacity: 0.7,
  },
  municipal_boundary: {
    id: 'municipal_boundary',
    name: 'Municipal Boundary',
    geoserverLayer: '{workspace}:Municipal_Boundary',
    sector: 'base',
    opacity: 1.0,
  },
  waterbodies: {
    id: 'waterbodies',
    name: 'Water Bodies',
    geoserverLayer: '{workspace}:Waterbodies',
    sector: 'base',
    opacity: 0.7,
  },
};

/**
 * HELPER: Get layer name for specific scenario
 * 
 * @param layerId - Internal layer ID
 * @param scenario - Scenario ID or year string
 * @returns GeoServer layer name or null
 */
export function getLayerNameForScenario(layerId: string, scenario: string): string | null {
  if (layerScenarioMap[layerId] && layerScenarioMap[layerId][scenario]) {
    return layerScenarioMap[layerId][scenario].replace('{workspace}', GEOSERVER_CONFIG.workspace);
  }
  
  // Fallback to default layer name
  const defaultLayer = geoserverLayers[layerId]?.geoserverLayer;
  return defaultLayer ? defaultLayer.replace('{workspace}', GEOSERVER_CONFIG.workspace) : null;
}

/**
 * HELPER: Build WMS/WMTS tile URL
 * 
 * @param layerName - GeoServer layer name (workspace:layer)
 * @param wardNumber - Optional ward filter
 * @param forceWMS - Force WMS instead of WMTS
 * @param categoryName - Optional category filter
 * @returns Tile URL string
 */
export function getWMSTileUrl(
  layerName: string,
  wardNumber?: number | null,
  forceWMS?: boolean,
  categoryName?: string | null
): string {
  const wmsUrl = GEOSERVER_CONFIG.wmsUrl;
  const wmtsBaseUrl = GEOSERVER_CONFIG.wmtsUrl;
  
  // Force WMS for certain layers that don't support WMTS
  const requiresWMS = layerName.includes('Multi_Hazard');
  
  // Use WMS if filtering is needed (WMTS doesn't support CQL filters)
  if (forceWMS || requiresWMS || wardNumber !== null || categoryName !== null) {
    let url = `${wmsUrl}?service=WMS&version=1.1.0&request=GetMap&layers=${layerName}&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&styles=&format=image/png&transparent=true`;
    
    // Build CQL filter
    const filters: string[] = [];
    
    if (wardNumber !== null && wardNumber !== undefined) {
      filters.push(`Ward=${wardNumber}`);
    }
    
    if (categoryName !== null && categoryName !== undefined) {
      const escapedCategory = categoryName.replace(/'/g, "''");
      filters.push(`Type='${escapedCategory}'`);
    }
    
    if (filters.length > 0) {
      const cqlFilter = filters.join(' AND ');
      url += `&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
    }
    
    return url;
  }
  
  // Use WMTS for better performance
  const wmtsUrl = `${wmtsBaseUrl}?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=${layerName}&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=image/png&TILECOL={x}&TILEROW={y}`;
  
  return wmtsUrl;
}

/**
 * HELPER: Replace workspace placeholder in layer names
 * Useful for dynamic layer name construction
 */
export function replaceWorkspace(layerPattern: string): string {
  return layerPattern.replace('{workspace}', GEOSERVER_CONFIG.workspace);
}
