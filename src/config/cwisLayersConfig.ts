/**
 * CWIS Climate Hazard Layers Configuration
 * Maps CWIS hazard layer IDs to their GeoServer WMS layer names
 * 
 * ✅ Storm Surge layer connected to GeoServer
 * ⚠️ Other layers remain placeholders (not yet connected)
 */

export interface CWISLayerConfig {
  id: string;
  name: string;
  geoserverLayer: string;
  workspace: string;
  opacity: number;
  unit: string;
  tooltip: string;
}

/**
 * CWIS Climate Hazard Layers Configuration
 * These are the 6 CWIS hazard layers displayed in the left drawer
 * 
 * ✅ Storm Surge, Flood Hazard, Heat Stress Index, LST, UHI, Wet-Bulb: CONNECTED to GeoServer
 * ⚠️ Urban Waterlogging: PLACEHOLDER (not yet connected)
 */
export const CWIS_HAZARD_LAYERS: Record<string, CWISLayerConfig> = {
  flood_hazard: {
    id: 'flood_hazard',
    name: 'Urban Flooding',
    geoserverLayer: 'Flood', // ✅ CONNECTED
    workspace: 'WorldBank_Bohol', // ✅ CONNECTED
    opacity: 0.7,
    unit: 'Hazard Level',
    tooltip: 'Areas at risk of flooding during extreme weather events.'
  },
  storm_surge: {
    id: 'storm_surge',
    name: 'Storm Surge',
    geoserverLayer: 'StormSurge', // ✅ CONNECTED
    workspace: 'WorldBank_Bohol', // ✅ CONNECTED
    opacity: 0.7,
    unit: 'Inundation Depth',
    tooltip: 'Coastal areas vulnerable to storm surge inundation.'
  },
  urban_waterlogging: {
    id: 'urban_waterlogging',
    name: 'Urban Waterlogging',
    geoserverLayer: 'PLACEHOLDER_UrbanWaterlogging',
    workspace: 'PLACEHOLDER_WORKSPACE',
    opacity: 0.7,
    unit: 'Waterlogging Susceptibility',
    tooltip: 'Urban areas prone to water accumulation and poor drainage.'
  },
  heat_stress_index: {
    id: 'heat_stress_index',
    name: 'Heat Stress Index',
    geoserverLayer: 'HS_HSI', // ✅ CONNECTED
    workspace: 'WorldBank_Bohol', // ✅ CONNECTED
    opacity: 0.7,
    unit: 'Composite Heat Stress Score',
    tooltip: 'Composite index combining temperature, humidity and urban heat factors to assess heat stress risk.'
  },
  land_surface_temperature: {
    id: 'land_surface_temperature',
    name: 'Land Surface Temperature',
    geoserverLayer: 'HS_LST', // ✅ CONNECTED
    workspace: 'WorldBank_Bohol', // ✅ CONNECTED
    opacity: 0.7,
    unit: '°C (Degrees Celsius)',
    tooltip: 'Shows how hot urban surfaces become due to buildings, roads, and low greenery.'
  },
  urban_heat_island: {
    id: 'urban_heat_island',
    name: 'Urban Heat Island',
    geoserverLayer: 'HS_UHI', // ✅ CONNECTED
    workspace: 'WorldBank_Bohol', // ✅ CONNECTED
    opacity: 0.7,
    unit: '°C (Anomaly)',
    tooltip: 'Shows excess heating caused by dense buildings and paved surfaces.'
  },
  wet_bulb_temperature: {
    id: 'wet_bulb_temperature',
    name: 'Wet Bulb Temperature',
    geoserverLayer: 'HS_WBT', // ✅ CONNECTED
    workspace: 'WorldBank_Bohol', // ✅ CONNECTED
    opacity: 0.7,
    unit: '°C (Wet-Bulb)',
    tooltip: 'Temperature considering humidity effects; critical for human heat stress assessment.'
  }
};

/**
 * Get CWIS layer configuration by ID
 */
export function getCWISLayerConfig(layerId: string): CWISLayerConfig | null {
  return CWIS_HAZARD_LAYERS[layerId] || null;
}

/**
 * Get full GeoServer layer name (workspace:layer)
 */
export function getCWISLayerFullName(layerId: string): string | null {
  const config = getCWISLayerConfig(layerId);
  if (!config) return null;
  return `${config.workspace}:${config.geoserverLayer}`;
}

/**
 * Get WMS URL for CWIS layer
 * 
 * ✅ Storm Surge: Generates proper WMS URL
 * ⚠️ Other layers: Returns null (not yet connected)
 */
export function getCWISLayerWMSUrl(
  layerId: string,
  munName?: string | null,
  brgyName?: string | null,
  categoryFilter?: string | null,
  categoryField?: string | null
): string | null {
  const fullLayerName = getCWISLayerFullName(layerId);
  if (!fullLayerName) return null;

  const config = getCWISLayerConfig(layerId);
  if (!config) return null;

  // Check if this is a placeholder layer
  if (config.workspace === 'PLACEHOLDER_WORKSPACE') {
    console.warn(`⚠️ CWIS layer "${layerId}" not yet connected to GeoServer. Placeholder configuration active.`);
    return null;
  }

  const baseUrl = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/wms';
  
  // Use EPSG:32651 (UTM Zone 51N) as per the GeoServer configuration
  let url = `${baseUrl}?service=WMS&version=1.1.0&request=GetMap&layers=${fullLayerName}&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&styles=&format=image/png&transparent=true`;
  
  const filters: string[] = [];
  
  // Apply LGU filter if provided
  if (munName && munName !== 'all') {
    const escapedMunName = munName.replace(/'/g, "''");
    filters.push(`MunName='${escapedMunName}'`);
  }
  
  // Apply Barangay filter if provided
  if (brgyName && brgyName !== 'all') {
    const escapedBrgyName = brgyName.replace(/'/g, "''");
    filters.push(`BrgyName='${escapedBrgyName}'`);
  }

  // Apply donut category filter if provided
  if (categoryFilter && categoryField) {
    const escapedCategory = categoryFilter.replace(/'/g, "''");
    filters.push(`${categoryField}='${escapedCategory}'`);
  }
  
  if (filters.length > 0) {
    const cqlFilter = filters.join(' AND ');
    url += `&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
  }
  
  console.log(`✅ Generated WMS URL for CWIS layer "${layerId}":`, url);
  return url;
}

/**
 * Get all CWIS layer IDs
 */
export function getCWISLayerIds(): string[] {
  return Object.keys(CWIS_HAZARD_LAYERS);
}