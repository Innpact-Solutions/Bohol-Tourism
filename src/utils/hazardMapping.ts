/**
 * Utility functions for mapping layer IDs to hazard table names
 */

/**
 * Convert layer ID to hazard table name for API requests
 * @param layerId - Layer ID (e.g., 'heat_ast', 'air_pm25')
 * @returns Hazard table name (e.g., 'AST_2025', 'Air_PM25') or null if not found
 */
export function getHazardTableFromLayerId(layerId: string): string | null {
  const mapping: Record<string, string> = {
    // Heat Stress (baseline only)
    'heat_ast': 'AST_2025',
    'heat_hhi': 'HHI_2025',
    'heat_rh': 'RH_2025',
    'heat_wbt': 'WBT_2025',
    'heat_lst': 'LST_2025',
    'heat_wbgt': 'WBGT_2025',
    'heat_uhi': 'UHI_2025',
    
    // Air Pollution (no year suffix)
    'air_no2': 'Air_NO2',
    'air_pm25': 'Air_PM25',
    'air_pm10': 'Air_PM10',
    'air_co': 'Air_CO',
    'air_so2': 'Air_SO2',
    'air_o3': 'Air_O3',
    'air_aqi': 'Air_AQI', // Corrected from Air_PM25 to Air_AQI
    
    // Flood (single table)
    'flood': 'Flood_Hazard',
    'flood_pluvial': 'Flood_Hazard',
    'flood_fluvial': 'Flood_Hazard',
    'flood_fhi': 'Flood_Hazard',
    
    // Multi-Hazard (single table)
    'multihazard': 'Multi_Hazard_BBSR',
    'multihazard_assessment': 'Multi_Hazard_BBSR',
  };

  return mapping[layerId] || null;
}

/**
 * Convert layer ID and scenario to hazard table name for API requests
 * @param layerId - Layer ID (e.g., 'heat_ast', 'air_pm25')
 * @param scenario - Scenario (e.g., 'baseline_2025', 'ssp1_2040', 'ssp2_2040', 'ssp5_2040')
 * @returns Hazard table name (e.g., 'AST_2025', 'AST_SSP1_2040', 'Air_PM25') or null if not found
 */
export function getHazardTableFromLayerIdAndScenario(layerId: string, scenario: string): string | null {
  // Map scenarios to suffixes
  const scenarioMap: Record<string, string> = {
    'baseline_2025': '2025',
    'ssp1_2040': 'SSP1_2040',
    'ssp2_2040': 'SSP2_2040',
    'ssp5_2040': 'SSP5_2040',
  };

  const suffix = scenarioMap[scenario] || '2025';

  // Map layer IDs to hazard table prefixes
  const layerPrefixMap: Record<string, string> = {
    // Heat Stress - with scenario support (full SSP scenarios)
    'heat_ast': 'AST',
    'heat_hhi': 'HHI',
    'heat_wbt': 'WBT',
    'heat_lst': 'LST',
    'heat_wbgt': 'WBGT',
  };

  const prefix = layerPrefixMap[layerId];
  
  // Heat stress layers with full scenario support - use scenario suffix
  if (prefix) {
    return `${prefix}_${suffix}`;
  }
  
  // RH and UHI - ONLY have baseline (2025) versions, no SSP scenarios
  if (layerId === 'heat_rh') {
    return 'RH_2025';
  }
  if (layerId === 'heat_uhi') {
    return 'UHI_2025';
  }
  
  // Air Pollution - no year suffix, just Air_ prefix (no scenario support)
  const airPollutionMap: Record<string, string> = {
    'air_no2': 'Air_NO2',
    'air_pm25': 'Air_PM25',
    'air_pm10': 'Air_PM10',
    'air_co': 'Air_CO',
    'air_so2': 'Air_SO2',
    'air_o3': 'Air_O3',
    'air_aqi': 'Air_AQI', // Corrected from Air_PM25 to Air_AQI
  };
  
  if (airPollutionMap[layerId]) {
    return airPollutionMap[layerId];
  }
  
  // Flood - single table for all flood types (no scenario support)
  const floodLayers = ['flood', 'flood_pluvial', 'flood_fluvial', 'flood_fhi'];
  if (floodLayers.includes(layerId)) {
    return 'Flood_Hazard';
  }
  
  // Multi-Hazard - single table (no scenario support)
  const multiHazardLayers = ['multihazard', 'multihazard_assessment'];
  if (multiHazardLayers.includes(layerId)) {
    return 'Multi_Hazard_BBSR';
  }

  return null;
}

/**
 * Get human-readable name for hazard layer
 * @param layerId - Layer ID
 * @returns Human-readable layer name
 */
export function getHazardLayerName(layerId: string): string {
  const names: Record<string, string> = {
    'heat_ast': 'Apparent Surface Temperature',
    'heat_hhi': 'Heat Hazard Index',
    'heat_rh': 'Relative Humidity',
    'heat_wbt': 'Wet Bulb Temperature',
    'heat_lst': 'Land Surface Temperature',
    'heat_wbgt': 'Wet Bulb Globe Temperature',
    'heat_uhi': 'Urban Heat Island',
    'air_no2': 'Nitrogen Dioxide (NO₂)',
    'air_pm25': 'Particulate Matter (PM2.5)',
    'air_pm10': 'Particulate Matter (PM10)',
    'air_co': 'Carbon Monoxide (CO)',
    'air_so2': 'Sulfur Dioxide (SO₂)',
    'air_o3': 'Ozone (O₃)',
    'air_aqi': 'Air Quality Index',
    'flood_pluvial': 'Pluvial Flooding',
  };

  return names[layerId] || layerId;
}