/**
 * Environmental Sensitivity Layers Configuration
 * These are the 4 environmental layers displayed in the left drawer
 * 
 * ✅ Soil Classification - Connected to GeoServer
 * ⚠️ Other layers are currently PLACEHOLDERS (not yet connected to GeoServer)
 * To enable a layer: update geoserverLayer & workspace (remove PLACEHOLDER prefix)
 */

export interface EnvironmentalLayerConfig {
  id: string;
  name: string;
  geoserverLayer: string; // GeoServer layer name (without workspace)
  workspace: string; // GeoServer workspace
  opacity: number;
  unit: string;
  tooltip: string;
}

/**
 * Environmental Sensitivity Layers Configuration
 * These are the 4 environmental layers displayed in the left drawer
 * 
 * ✅ Soil Classification - Connected to GeoServer
 * ⚠️ Other layers are currently PLACEHOLDERS (not yet connected to GeoServer)
 * To enable a layer: update geoserverLayer & workspace (remove PLACEHOLDER prefix)
 */
export const ENVIRONMENTAL_LAYERS: Record<string, EnvironmentalLayerConfig> = {
  soil_classification: {
    id: 'soil_classification',
    name: 'Soil Classification',
    geoserverLayer: 'SoilClassification', // ✅ CONNECTED
    workspace: 'WorldBank_Bohol', // ✅ CONNECTED
    opacity: 0.7,
    unit: 'Soil Type',
    tooltip: 'Classification of soil types affecting sanitation infrastructure.'
  },
  groundwater_depth: {
    id: 'groundwater_depth',
    name: 'Groundwater Depth',
    geoserverLayer: 'GroundWater', // ✅ CONNECTED
    workspace: 'WorldBank_Bohol', // ✅ CONNECTED
    opacity: 0.7,
    unit: 'Depth (m)',
    tooltip: 'Depth to groundwater table affecting sanitation system design.'
  },
  geology: {
    id: 'geology',
    name: 'Geology',
    geoserverLayer: 'Geology', // ✅ CONNECTED
    workspace: 'WorldBank_Bohol', // ✅ CONNECTED
    opacity: 0.7,
    unit: 'Geological Type',
    tooltip: 'Geological formations influencing sanitation infrastructure design.'
  },
  sinkhole: {
    id: 'sinkhole',
    name: 'Sinkhole',
    geoserverLayer: 'Sinkhole', // ✅ CONNECTED
    workspace: 'WorldBank_Bohol', // ✅ CONNECTED
    opacity: 0.7,
    unit: 'Risk Level',
    tooltip: 'Areas vulnerable to sinkhole formation affecting infrastructure safety.'
  },
  groundwater_infiltration_vulnerability: {
    id: 'groundwater_infiltration_vulnerability',
    name: 'Ground Water Infiltration',
    geoserverLayer: 'GroundWater_Infiltration_Vulnerability', // ✅ CONNECTED
    workspace: 'WorldBank_Bohol', // ✅ CONNECTED
    opacity: 0.7,
    unit: 'Vulnerability',
    tooltip: 'Groundwater infiltration vulnerability affecting sanitation and groundwater contamination risk.'
  }
};

/**
 * Get Environmental layer configuration by ID
 */
export function getEnvironmentalLayerConfig(layerId: string): EnvironmentalLayerConfig | null {
  return ENVIRONMENTAL_LAYERS[layerId] || null;
}

/**
 * Get full GeoServer layer name (workspace:layer)
 */
export function getEnvironmentalLayerFullName(layerId: string): string | null {
  const config = getEnvironmentalLayerConfig(layerId);
  if (!config) return null;
  return `${config.workspace}:${config.geoserverLayer}`;
}

/**
 * Get WMS URL for Environmental layer with LGU and Barangay filtering
 * 
 * ⚠️ All layers currently return null (not yet connected to GeoServer)
 * 
 * @param layerId - Environmental layer ID
 * @param munName - Municipality name for filtering (uses MunName field)
 * @param brgyName - Barangay name for filtering (uses BrgyName field)
 * @param categoryName - Category name for filtering donut chart selections (uses Type field)
 * @returns WMS URL or null if layer not enabled
 */
export function getEnvironmentalLayerWMSUrl(
  layerId: string,
  munName?: string | null,
  brgyName?: string | null,
  categoryName?: string | null
): string | null {
  const fullLayerName = getEnvironmentalLayerFullName(layerId);
  if (!fullLayerName) return null;

  const config = getEnvironmentalLayerConfig(layerId);
  if (!config) return null;

  // Check if layer is enabled
  if (config.workspace === 'PLACEHOLDER_WORKSPACE') {
    console.warn(`⚠️ Environmental layer "${layerId}" not yet connected to GeoServer. Placeholder configuration active.`);
    return null;
  }

  // Construct WMS base URL
  const baseUrl = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/wms';
  
  let url = `${baseUrl}?service=WMS&version=1.1.0&request=GetMap&layers=${fullLayerName}&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&styles=&format=image/png&transparent=true`;
  
  const filters: string[] = [];
  
  // Apply LGU filter if provided (uses MunName field)
  if (munName && munName !== 'all') {
    const escapedMunName = munName.replace(/'/g, "''");
    filters.push(`MunName='${escapedMunName}'`);
  }
  
  // Apply Barangay filter if provided (uses BrgyName field)
  if (brgyName && brgyName !== 'all') {
    const escapedBrgyName = brgyName.replace(/'/g, "''");
    filters.push(`BrgyName='${escapedBrgyName}'`);
  }
  
  // Apply Category filter if provided (uses Type field)
  if (categoryName && categoryName !== 'all') {
    const escapedCategoryName = categoryName.replace(/'/g, "''");
    filters.push(`Type='${escapedCategoryName}'`);
  }
  
  if (filters.length > 0) {
    const cqlFilter = filters.join(' AND ');
    url += `&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
  }
  
  console.log(`✅ Generated WMS URL for Environmental layer "${layerId}":`, url);
  return url;
}

/**
 * Get all Environmental layer IDs
 */
export function getEnvironmentalLayerIds(): string[] {
  return Object.keys(ENVIRONMENTAL_LAYERS);
}