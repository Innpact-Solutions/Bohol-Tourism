/**
 * Legend Loader Utility
 * 
 * Provides helper functions to get legend data for layers.
 * Uses embedded legend data instead of CSV loading.
 */

import { LEGEND_DATA, type LegendEntry } from '../data/legendDefinitions';

// Cache for legend definitions (initialized immediately from embedded data)
let legendCache: Map<string, LegendEntry[]> | null = null;

/**
 * Initialize the legend cache from embedded data
 */
export function loadLegendDefinitions(): Promise<void> {
  if (legendCache) {
    console.log('✅ Legend cache already loaded');
    return Promise.resolve();
  }

  console.log('🚀 Initializing legend cache from embedded data...');
  
  try {
    // Convert the LEGEND_DATA object to a Map
    legendCache = new Map(Object.entries(LEGEND_DATA));
    
    console.log('✅ Legend cache initialized successfully!');
    console.log('📊 Total layers in cache:', legendCache.size);
    console.log('🔑 Available layer names:', Array.from(legendCache.keys()));
    
    return Promise.resolve();
  } catch (error) {
    console.error('❌ Error initializing legend cache:', error);
    legendCache = new Map();
    return Promise.reject(error);
  }
}

/**
 * Get legend entries for a specific layer
 */
export function getLayerLegend(layerName: string): LegendEntry[] {
  if (!legendCache) {
    console.warn('⚠️ Legend cache not initialized yet - initializing now...');
    loadLegendDefinitions();
    // After sync initialization, try again
    if (!legendCache) {
      return [];
    }
  }
  
  const entries = legendCache.get(layerName) || [];
  if (entries.length === 0) {
    console.warn(`⚠️ No legend entries found for layer: ${layerName}`);
  }
  return entries;
}

/**
 * Get hazard info (color + label + description) for a specific gridcode value
 */
export function getHazardInfo(
  layerName: string,
  gridcode: number
): { color: string; label: string; description: string } | null {
  const legend = getLayerLegend(layerName);
  const entry = legend.find(e => e.gridcode === gridcode);
  
  if (entry) {
    return {
      color: entry.color,
      label: entry.label,
      description: entry.description
    };
  }
  
  return null;
}

/**
 * Get all available layer names
 */
export function getAllLayerNames(): string[] {
  if (!legendCache) {
    loadLegendDefinitions();
    if (!legendCache) {
      return [];
    }
  }
  return Array.from(legendCache.keys());
}

/**
 * Check if legend is loaded
 */
export function isLegendLoaded(): boolean {
  return legendCache !== null;
}

/**
 * Map UI layer IDs to GeoServer layer names
 * This handles the conversion from UI identifiers (e.g., 'heat_hhi') to actual layer names (e.g., 'HHI_2025')
 */
export function getGeoServerLayerName(layerId: string, scenario: string = 'baseline_2025'): string | null {
  // Map scenarios to suffixes
  const scenarioMap: Record<string, string> = {
    'baseline_2025': '2025',
    'ssp1_2040': 'SSP1_2040',
    'ssp2_2040': 'SSP2_2040',
    'ssp5_2040': 'SSP5_2040',
  };

  const suffix = scenarioMap[scenario] || '2025';

  // Map layer IDs to GeoServer layer names
  const layerMapping: Record<string, string> = {
    // Heat Stress - with scenario support
    'heat_ast': `AST_${suffix}`,
    'heat_hhi': `HHI_${suffix}`,
    'heat_wbt': `WBT_${suffix}`,
    'heat_lst': `LST_${suffix}`,
    'heat_wbgt': `WBGT_${suffix}`,
    
    // Heat Stress - baseline only (no scenario support)
    'heat_rh': 'RH_2025',
    'heat_uhi': 'UHI_2025',
    
    // Air Pollution - no scenario support
    'air_no2': 'Air_NO2',
    'air_pm25': 'Air_PM25',
    'air_pm10': 'Air_PM10',
    'air_co': 'Air_CO',
    'air_so2': 'Air_SO2',
    'air_o3': 'Air_O3',
    'air_aqi': 'Air_AQI',
    'air': 'Air_AQI', // Main air layer defaults to AQI
    
    // Flood - no scenario support
    'flood': 'Flood_Hazard',
    'flood_pluvial': 'Flood_Hazard',
    'flood_fluvial': 'Flood_Hazard',
    'flood_fhi': 'Flood_Hazard',
    
    // Multi-Hazard - no scenario support
    'multihazard': 'Multi_Hazard_BBSR',
    'multihazard_assessment': 'Multi_Hazard_BBSR',
    
    // ✅ CWIS Climate Hazard Layers
    // ⚠️ Urban Waterlogging remains disabled (GeoServer not connected)
    'storm_surge': 'StormSurge', // ✅ CONNECTED
    'flood_hazard': 'FloodHazard', // ✅ CONNECTED
    'heat_stress_index': 'HS_HSI', // ✅ CONNECTED
    'land_surface_temperature': 'HS_LST', // ✅ CONNECTED
    'urban_heat_island': 'HS_UHI', // ✅ CONNECTED
    'wet_bulb_temperature': 'HS_WBT', // ✅ CONNECTED
    // 'urban_waterlogging': 'UrbanWaterlogging', // ⚠️ DISABLED
    
    // ✅ ENVIRONMENTAL SENSITIVITY LAYERS
    'soil_classification': 'SoilClassification', // ✅ CONNECTED
    'groundwater_depth': 'GroundWater', // ✅ CONNECTED
    'geology': 'Geology', // ✅ CONNECTED
    'sinkhole': 'Sinkhole', // ✅ CONNECTED
    'groundwater_infiltration_vulnerability': 'GroundWater_Infiltration_Vulnerability', // ✅ CONNECTED
    
    // Base Layers - no scenario support
    'elevation': 'elevation',
    'builtup_density': 'Builtup_Density',
  };

  return layerMapping[layerId] || null;
}

/**
 * Get legend for UI layer (handles scenario mapping automatically)
 */
export function getUILayerLegend(layerId: string, scenario: string = 'baseline_2025'): LegendEntry[] {
  console.log('🔎 getUILayerLegend called with:', { layerId, scenario });
  
  const geoServerLayerName = getGeoServerLayerName(layerId, scenario);
  console.log('🗺️ Mapped to GeoServer layer:', geoServerLayerName);
  
  if (!geoServerLayerName) {
    console.warn(`⚠️ Unknown layer ID: ${layerId}`);
    return [];
  }
  
  const entries = getLayerLegend(geoServerLayerName);
  console.log('📋 Legend entries found:', entries.length);
  
  return entries;
}

/**
 * Get hazard info for UI layer (handles scenario mapping automatically)
 */
export function getUILayerHazardInfo(
  layerId: string,
  gridcode: number,
  scenario: string = 'baseline_2025'
): { color: string; label: string; description: string } | null {
  const geoServerLayerName = getGeoServerLayerName(layerId, scenario);
  if (!geoServerLayerName) {
    return null;
  }
  
  return getHazardInfo(geoServerLayerName, gridcode);
}

// Auto-initialize on module load
loadLegendDefinitions();