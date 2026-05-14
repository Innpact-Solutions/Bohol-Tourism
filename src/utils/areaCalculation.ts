// GeoServer area calculation utilities

import type { Sector, Scenario } from '../App';
import { getLayerNameForScenario } from '../config/geoserverLayers';
import { CWIS_HAZARD_LAYERS as CWIS_LAYERS } from '../config/cwisLayersConfig';
import { ENVIRONMENTAL_LAYERS } from '../config/environmentalLayers';

// ⚠️ DEPRECATED: Old GIZ_BBSR workspace removed - area calculations disabled until new Bohol layers connected
// GeoServer WFS URL for fetching feature data
const GEOSERVER_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows';

// Color definitions (matching FloatingLegendPanel and RightPanel)
export const HEAT_COLORS = {
  low: '#91CF60',
  moderate: '#FFFFBF',
  high: '#FC8D59',
  extreme: '#D73027'
};

export const AQI_COLORS = {
  good: '#00B050',
  moderate: '#FFFF00',
  unhealthySensitive: '#FF7E00',
  unhealthy: '#FF0000',
  veryUnhealthy: '#8F3F97',
  hazardous: '#7E0023'
};

export const FLOOD_COLORS = {
  noRisk: '#FFFFD9',
  low: '#97D6B9',
  moderate: '#1F80B8',
  high: '#081D58',
  veryHigh: '#081D58'
};

export const MULTI_HAZARD_COLORS = {
  low: '#1A9850',
  moderate: '#91CF60',
  high: '#F46D43',
  veryHigh: '#D73027'
};

export interface AreaDistributionData {
  name: string;
  value: number;
  color: string;
  percentage?: string;
  gridcode?: number;
}

// Fetch and calculate area distribution from GeoServer
export async function fetchAreaDistribution(
  activeSector: Sector,
  activeLayerId: string,
  scenario: Scenario,
  selectedWardId?: string,
  year?: number // Optional year for historical trends
): Promise<AreaDistributionData[]> {
  // Get the GeoServer layer name
  let layerName: string | null;
  
  // If year is provided, construct year-based layer name (for Historical Trends)
  if (year !== undefined) {
    // ⚠️ DEPRECATED: Old GIZ_BBSR year-based layers removed
    // Extract layer type from activeLayerId (e.g., 'heat_hhi' -> 'HHI')
    // const layerType = activeLayerId.split('_')[1]?.toUpperCase();
    // if (layerType) {
    //   layerName = `GIZ_BBSR:${layerType}_${year}`;
    //   console.log('🔍 Using year-based layer name:', layerName);
    // } else {
    //   layerName = getLayerNameForScenario(activeLayerId, scenario);
    // }
    console.warn('⚠️ Historical year-based layers not yet connected for Bohol. Placeholder data.');
    return []; // Return empty - historical trends will show "No data available"
  } else {
    // Use scenario-based layer name (for main dashboard)
    layerName = getLayerNameForScenario(activeLayerId, scenario);

    // Fallback: check CWIS layers (flood_hazard, storm_surge)
    if (!layerName) {
      const cwisLayer = CWIS_LAYERS[activeLayerId];
      if (cwisLayer && !cwisLayer.geoserverLayer.startsWith('PLACEHOLDER')) {
        layerName = `${cwisLayer.workspace}:${cwisLayer.geoserverLayer}`;
        console.log('🔍 Using CWIS layer name:', layerName);
      }
    }

    // Fallback: check environmental layers (soil_classification, groundwater_depth, etc.)
    if (!layerName) {
      const envLayer = ENVIRONMENTAL_LAYERS[activeLayerId];
      if (envLayer && !envLayer.geoserverLayer.startsWith('PLACEHOLDER')) {
        layerName = `${envLayer.workspace}:${envLayer.geoserverLayer}`;
        console.log('🔍 Using environmental layer name:', layerName);
      }
    }
  }
  
  if (!layerName) {
    console.warn('⚠️ No layer name found for:', activeLayerId, scenario, year);
    return [];
  }

  console.log('🔍 Fetching area distribution for:', layerName, 'Ward filter:', selectedWardId);

  // Build WFS GetFeature request URL
  let wfsUrl = `${GEOSERVER_WFS_URL}?service=WFS&version=1.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&maxFeatures=10000`;
  
  // Add CQL filter for ward if needed
  if (selectedWardId && selectedWardId !== 'all') {
    const wardNumber = parseInt(selectedWardId.split('_')[1]);
    if (!isNaN(wardNumber)) {
      const cqlFilter = `Ward=${wardNumber}`;
      wfsUrl += `&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
      console.log('🔍 Applying ward filter to area calculation:', cqlFilter);
    }
  }

  try {
    const response = await fetch(wfsUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Check if response is JSON (not XML error)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`⚠️ Layer ${layerName} returned non-JSON response (likely doesn't exist). Skipping.`);
      return [];
    }
    
    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.warn('⚠️ No features found in layer:', layerName);
      return [];
    }

    console.log(`✅ Fetched ${data.features.length} features from ${layerName}`);
    console.log('📋 Sample feature properties:', data.features[0]?.properties);
    console.log('🔑 Available property keys:', Object.keys(data.features[0]?.properties || {}));

    // Calculate area distribution based on sector
    const distribution = calculateAreaDistribution(data.features, activeSector, activeLayerId);
    return distribution;
  } catch (error) {
    // Check if it's a JSON parse error (XML response)
    const isJsonError = error instanceof SyntaxError && error.message.includes('JSON');
    // Check if it's a network error
    const isNetworkError = error instanceof TypeError && error.message === 'Failed to fetch';
    
    let errorMessage;
    if (isJsonError) {
      errorMessage = `Layer ${layerName} not available (returned XML instead of JSON - layer may not exist in GeoServer)`;
    } else if (isNetworkError) {
      errorMessage = `Network error fetching ${layerName} (may not exist or server timeout)`;
    } else {
      errorMessage = `Error fetching area data: ${error}`;
    }
    
    console.warn(`⚠️ ${errorMessage}`);
    return []; // Return empty array instead of throwing - chart will show "No data"
  }
}

// Calculate area distribution from features
function calculateAreaDistribution(
  features: any[],
  activeSector: Sector,
  activeLayerId: string
): AreaDistributionData[] {
  // Group features by category and sum areas, track gridcode for ordering
  const areaByCategory: Record<string, { area: number; gridcode: number; color: string }> = {};
  let featuresWithoutCategory = 0;

  features.forEach(feature => {
    const props = feature.properties;
    
    // Get Shape_Area (in square meters) and convert to square kilometers
    const shapeAreaSqm = props.Shape_Area || props.SHAPE_AREA || props.shape_area || 0;
    const areaKm2 = shapeAreaSqm / 1000000; // Convert sqm to km²

    // Get gridcode for ordering
    const gridcode = props.gridcode || props.GRIDCODE || 0;

    // Get color from color_code field
    const color = props.color_code || props.COLOR_CODE || props.Color_Code || '#94A3B8';

    // Determine category field based on sector and layer
    let category = getCategoryFromProperties(props, activeSector, activeLayerId);
    
    if (category) {
      if (!areaByCategory[category]) {
        areaByCategory[category] = { area: 0, gridcode, color };
      }
      areaByCategory[category].area += areaKm2;
    } else {
      featuresWithoutCategory++;
    }
  });

  if (featuresWithoutCategory > 0) {
    console.warn(`⚠️ ${featuresWithoutCategory} features had no category field`);
  }

  console.log('📊 Area by category (km²):', Object.fromEntries(
    Object.entries(areaByCategory).map(([k, v]) => [k, v.area])
  ));
  
  console.log('🔍 Server returned these categories:', Object.keys(areaByCategory));

  // Convert to array format with colors
  return formatAreaData(areaByCategory, activeSector, activeLayerId);
}

// Extract category from feature properties
function getCategoryFromProperties(props: any, activeSector: Sector, activeLayerId: string): string | null {
  // First, log all available fields for the first feature (for debugging)
  if (!getCategoryFromProperties.hasLogged) {
    console.log('🔍 All available fields:', Object.keys(props));
    console.log('🔍 Sample Type field value:', props.Type || props.type);
    console.log('🔍 Sample gridcode value:', props.gridcode || props.GRIDCODE);
    console.log('🔍 Active layer ID:', activeLayerId);
    getCategoryFromProperties.hasLogged = true;
  }

  // Primary field: Type (contains category name like "Low", "Moderate", etc.)
  if (props.Type !== undefined && props.Type !== null) {
    const typeValue = String(props.Type).trim();
    console.log('📝 Type field value:', typeValue);
    // Filter out NA, N/A, null, undefined, empty string
    if (typeValue && typeValue !== 'NA' && typeValue !== 'N/A' && typeValue !== 'null' && typeValue !== 'undefined') {
      return typeValue;
    }
  }

  // Fallback: try lowercase
  if (props.type !== undefined && props.type !== null) {
    const typeValue = String(props.type).trim();
    console.log('📝 type field value:', typeValue);
    if (typeValue && typeValue !== 'NA' && typeValue !== 'N/A' && typeValue !== 'null' && typeValue !== 'undefined') {
      return typeValue;
    }
  }

  // Fallback: try other common category field names
  const categoryFields = [
    'Category', 'CATEGORY', 'category',
    'Class', 'CLASS', 'class',
    'Risk_Level', 'risk_level', 'RISK_LEVEL'
  ];

  for (const field of categoryFields) {
    if (props[field] !== undefined && props[field] !== null) {
      const value = String(props[field]).trim();
      if (value && value !== 'NA' && value !== 'N/A' && value !== 'null' && value !== 'undefined') {
        console.log(`📝 Found category in ${field}:`, value);
        return value;
      }
    }
  }

  // Last resort: categorize based on gridcode if Type field is missing
  if (props.gridcode !== undefined) {
    console.log('⚠️ No Type field found, using gridcode:', props.gridcode);
    return categorizeByGridcode(props.gridcode, activeSector, activeLayerId);
  }
  if (props.GRIDCODE !== undefined) {
    console.log('⚠️ No Type field found, using GRIDCODE:', props.GRIDCODE);
    return categorizeByGridcode(props.GRIDCODE, activeSector, activeLayerId);
  }

  console.warn('❌ No category field found in properties');
  return null;
}

// Add hasLogged flag to the function
(getCategoryFromProperties as any).hasLogged = false;

// Categorize based on gridcode value - now layer-aware for different heat layers
function categorizeByGridcode(gridcode: number, activeSector: Sector, activeLayerId: string = ''): string {
  if (activeSector === 'heat') {
    // HHI has 4 classes with Low/Moderate/High/Extreme
    const isHHI = activeLayerId === 'heat_hhi' || activeLayerId.includes('hhi');
    
    // RH has 5 classes with different labels
    const isRH = activeLayerId === 'heat_rh' || activeLayerId.includes('_rh');
    
    // UHI has 5 classes with different labels
    const isUHI = activeLayerId === 'heat_uhi' || activeLayerId.includes('uhi');
    
    if (isHHI) {
      // HHI: 4 classes
      if (gridcode === 1) return 'Low';
      if (gridcode === 2) return 'Moderate';
      if (gridcode === 3) return 'High';
      if (gridcode === 4) return 'Extreme';
    } else if (isRH) {
      // RH: 5 classes with custom labels
      if (gridcode === 1) return 'Extremely Dry';
      if (gridcode === 2) return 'Very Dry';
      if (gridcode === 3) return 'Moderate RH';
      if (gridcode === 4) return 'Elevated RH';
      if (gridcode === 5) return 'High RH';
    } else if (isUHI) {
      // UHI: 5 classes with custom labels
      if (gridcode === 1) return 'Negligible';
      if (gridcode === 2) return 'Mild';
      if (gridcode === 3) return 'Moderate';
      if (gridcode === 4) return 'High';
      if (gridcode === 5) return 'Extreme';
    } else {
      // LST, AST, WBT, WBGT: 5 classes with Safe/Caution/Moderate/High/Extreme
      if (gridcode === 1) return 'Safe';
      if (gridcode === 2) return 'Caution';
      if (gridcode === 3) return 'Moderate';
      if (gridcode === 4) return 'High';
      if (gridcode === 5) return 'Extreme';
    }
  } else if (activeSector === 'air') {
    if (gridcode === 1) return 'Good';
    if (gridcode === 2) return 'Moderate';
    if (gridcode === 3) return 'Unhealthy (S)';
    if (gridcode === 4) return 'Unhealthy';
    if (gridcode === 5) return 'Very Unhealthy';
    if (gridcode === 6) return 'Hazardous';
  } else if (activeSector === 'flood') {
    if (gridcode === 0) return 'No Risk';
    if (gridcode === 1) return 'Low';
    if (gridcode === 2) return 'Moderate';
    if (gridcode === 3) return 'High';
  } else if (activeSector === 'climate_hazard') {
    // Flood/storm surge: gridcode 0-4
    if (gridcode === 0) return 'No Risk';
    if (gridcode === 1) return 'Low';
    if (gridcode === 2) return 'Moderate';
    if (gridcode === 3) return 'High';
    if (gridcode === 4) return 'Very High';
  } else if (activeSector === 'base_layers' || activeSector === 'env_vulnerability') {
    // Generic gridcode label — Type field is preferred and usually present
    return `Class ${gridcode}`;
  } else {
    // Multi-hazard
    if (gridcode === 1) return 'Low';
    if (gridcode === 2) return 'Moderate';
    if (gridcode === 3) return 'High';
    if (gridcode === 4) return 'Very High';
  }
  
  return `Level ${gridcode}`;
}

// Categorize HHI value into risk levels
function categorizeHHI(hhiValue: number): string {
  if (hhiValue < 3) return 'Low';
  if (hhiValue < 6) return 'Moderate';
  if (hhiValue < 8) return 'High';
  return 'Extreme';
}

// Categorize AQI value into air quality levels
function categorizeAQI(aqiValue: number): string {
  if (aqiValue <= 50) return 'Good';
  if (aqiValue <= 100) return 'Moderate';
  if (aqiValue <= 150) return 'Unhealthy (S)';
  if (aqiValue <= 200) return 'Unhealthy';
  if (aqiValue <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

// Categorize flood values
function categorizeFlood(floodValue: number): string {
  if (floodValue === 0) return 'No Risk';
  if (floodValue === 1) return 'Low';
  if (floodValue === 2) return 'Moderate';
  return 'High';
}

// Generic categorization based on sector
function categorizeGeneric(value: number, activeSector: Sector): string {
  if (activeSector === 'heat') {
    return categorizeHHI(value);
  } else if (activeSector === 'air') {
    return categorizeAQI(value);
  } else if (activeSector === 'flood') {
    return categorizeFlood(value);
  } else {
    // Multi-hazard
    if (value === 1) return 'Low';
    if (value === 2) return 'Moderate';
    if (value === 3) return 'High';
    return 'Very High';
  }
}

// Normalize category names to match legend
function normalizeCategory(rawCategory: string | number, activeSector: Sector): string {
  const normalized = String(rawCategory).trim();

  // Heat stress categories
  if (activeSector === 'heat') {
    if (/low|1/i.test(normalized)) return 'Low';
    if (/moderate|2/i.test(normalized)) return 'Moderate';
    if (/^high|3/i.test(normalized) && !/extreme|very/i.test(normalized)) return 'High';
    if (/extreme|very.*high|4/i.test(normalized)) return 'Extreme';
  }

  // Air quality categories
  if (activeSector === 'air') {
    if (/good|1/i.test(normalized)) return 'Good';
    if (/^moderate|2/i.test(normalized)) return 'Moderate';
    if (/unhealthy.*sensitive|3/i.test(normalized)) return 'Unhealthy (S)';
    if (/^unhealthy|4/i.test(normalized) && !/sensitive|very/i.test(normalized)) return 'Unhealthy';
    if (/very.*unhealthy|5/i.test(normalized)) return 'Very Unhealthy';
    if (/hazardous|6/i.test(normalized)) return 'Hazardous';
  }

  // Flood categories
  if (activeSector === 'flood') {
    if (/no.*risk|safe|0/i.test(normalized)) return 'No Risk';
    if (/^low|waterlog|1/i.test(normalized)) return 'Low';
    if (/moderate|susceptible|2/i.test(normalized)) return 'Moderate';
    if (/high|3|4/i.test(normalized)) return 'High';
  }

  // Multi-hazard categories
  if (activeSector === 'multihazard') {
    if (/low|minimal|1/i.test(normalized)) return 'Low';
    if (/^moderate|manageable|2/i.test(normalized)) return 'Moderate';
    if (/^high|significant|3/i.test(normalized)) return 'High';
    if (/very.*high|severe|4/i.test(normalized)) return 'Very High';
  }

  return normalized;
}

// Format area data with correct colors
function formatAreaData(
  areaByCategory: Record<string, { area: number; gridcode: number; color: string }>,
  activeSector: Sector,
  activeLayerId: string
): AreaDistributionData[] {
  console.log('🔍 Categories in areaByCategory:', Object.keys(areaByCategory));
  console.log('🔍 Active layer ID:', activeLayerId);
  
  // NEW APPROACH: Use whatever categories the server returns (matches floating legend)
  // Sort by gridcode and use the actual server data
  const result = Object.entries(areaByCategory).map(([name, data]) => ({
    name,
    value: Math.round(data.area * 100) / 100, // Round to 2 decimal places
    color: data.color, // Use color from server (color_code field)
    gridcode: data.gridcode
  })).sort((a, b) => a.gridcode - b.gridcode); // Sort by gridcode ascending

  console.log('✅ Formatted area data (from server, matching floating legend):', result);
  return result;
}