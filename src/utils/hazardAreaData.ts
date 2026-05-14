// Utility to fetch high-risk area data for KPI tiles
// Fetches and calculates areas for gridcode values representing high-risk zones

import type { Sector, Scenario } from '../App';
import { getLayerNameForScenario } from '../config/geoserverLayers';

const GEOSERVER_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/GIZ_BBSR/ows';

export interface HazardAreaResult {
  totalAreaKm2: number;
  percentage: number;
  cityTotalAreaKm2: number;
}

/**
 * Fetches high-risk area data from GeoServer for KPI tiles
 * @param activeSector - Current sector (heat, air, flood, multihazard)
 * @param activeLayerId - Layer ID to query (unused, we use primary layer instead)
 * @param scenario - Scenario to use (baseline_2025, ssp1_2040, etc.)
 * @param selectedWardId - Optional ward filter
 * @returns HazardAreaResult with area and percentage
 */
export async function fetchHazardArea(
  activeSector: Sector,
  activeLayerId: string,
  scenario: Scenario,
  selectedWardId?: string
): Promise<HazardAreaResult | null> {
  // Determine the PRIMARY layer for this sector (not the activeLayerId which could be a sub-layer)
  const primaryLayerId = getPrimaryLayerForSector(activeSector);
  const layerName = getLayerNameForScenario(primaryLayerId, scenario);
  
  if (!layerName) {
    console.warn('⚠️ No layer name found for hazard area calculation:', primaryLayerId, scenario);
    return null;
  }

  // Determine which gridcode values represent high risk for this sector
  const highRiskGridcodes = getHighRiskGridcodes(activeSector);
  
  try {
    // Fetch total city area (all gridcodes)
    const cityTotalArea = await fetchTotalArea(layerName, selectedWardId);
    
    // Fetch high-risk area (specific gridcodes only)
    const highRiskArea = await getAreaByGridcodes(layerName, highRiskGridcodes, selectedWardId);
    
    if (cityTotalArea === 0) {
      console.warn('⚠️ City total area is 0, cannot calculate percentage');
      return {
        totalAreaKm2: highRiskArea,
        percentage: 0,
        cityTotalAreaKm2: cityTotalArea
      };
    }

    const percentage = (highRiskArea / cityTotalArea) * 100;
    
    console.log('✅ Hazard area calculation:', {
      sector: activeSector,
      highRiskArea: `${highRiskArea.toFixed(2)} km²`,
      cityTotalArea: `${cityTotalArea.toFixed(2)} km²`,
      percentage: `${percentage.toFixed(1)}%`,
      gridcodes: highRiskGridcodes
    });

    return {
      totalAreaKm2: highRiskArea,
      percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal place
      cityTotalAreaKm2: cityTotalArea
    };
  } catch (error) {
    // Layer doesn't exist or GeoServer error - return null silently for UI to show warning notification
    // No console output needed - this is expected until layers are published to GeoServer
    return null;
  }
}

/**
 * Get gridcode values that represent high risk for each sector
 */
function getHighRiskGridcodes(activeSector: Sector): number[] {
  switch (activeSector) {
    case 'heat':
      return [3, 4]; // High and Extreme
    case 'air':
      return [4, 5, 6]; // Gridcodes 4, 5, 6 for area calculation (as per AQI requirements)
    case 'flood':
      return [3, 4]; // High risk levels
    case 'multihazard':
      return [3, 4]; // High and Very High
    default:
      return [3, 4];
  }
}

/**
 * Fetch total area for a layer (all gridcodes)
 */
async function fetchTotalArea(
  layerName: string,
  selectedWardId?: string
): Promise<number> {
  let wfsUrl = `${GEOSERVER_WFS_URL}?service=WFS&version=1.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&maxFeatures=10000`;
  
  // Add ward filter if specified
  if (selectedWardId && selectedWardId !== 'all') {
    const wardNumber = parseInt(selectedWardId.split('_')[1]);
    if (!isNaN(wardNumber)) {
      const cqlFilter = `Ward=${wardNumber}`;
      wfsUrl += `&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
    }
  }

  const response = await fetch(wfsUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch total area: ${response.status} ${response.statusText}`);
  }

  // Check content type - GeoServer returns XML on error
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`GeoServer returned non-JSON response (${contentType}). Check if layer ${layerName} exists.`);
  }

  const data = await response.json();
  
  if (!data.features || data.features.length === 0) {
    console.warn('⚠️ No features found for total area calculation');
    return 0;
  }

  // Sum all Shape_Area values and convert from sqm to km²
  let totalAreaSqm = 0;
  data.features.forEach((feature: any) => {
    const props = feature.properties;
    const shapeAreaSqm = props.Shape_Area || props.SHAPE_AREA || props.shape_area || 0;
    totalAreaSqm += shapeAreaSqm;
  });

  return totalAreaSqm / 1000000; // Convert to km²
}

/**
 * Fetch area for specific gridcode values
 */
async function getAreaByGridcodes(
  layerName: string,
  gridcodes: number[],
  selectedWardId?: string
): Promise<number> {
  // Build CQL filter for gridcodes
  // Try multiple property name variations (gridcode, GRIDCODE, Gridcode, etc.)
  let cqlFilters: string[] = [];
  
  // Add gridcode filter with multiple property name variations
  let gridcodeFilter: string;
  if (gridcodes.length === 1) {
    gridcodeFilter = `(gridcode=${gridcodes[0]} OR GRIDCODE=${gridcodes[0]} OR Gridcode=${gridcodes[0]})`;
  } else {
    const gridcodeList = gridcodes.join(',');
    gridcodeFilter = `(gridcode IN (${gridcodeList}) OR GRIDCODE IN (${gridcodeList}) OR Gridcode IN (${gridcodeList}))`;
  }
  cqlFilters.push(gridcodeFilter);
  
  // Add ward filter if specified
  if (selectedWardId && selectedWardId !== 'all') {
    const wardNumber = parseInt(selectedWardId.split('_')[1]);
    if (!isNaN(wardNumber)) {
      cqlFilters.push(`Ward=${wardNumber}`);
    }
  }

  const cqlFilter = cqlFilters.join(' AND ');
  
  let wfsUrl = `${GEOSERVER_WFS_URL}?service=WFS&version=1.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&maxFeatures=10000&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;

  console.log('🔍 Fetching area with CQL filter:', cqlFilter);

  const response = await fetch(wfsUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch area by gridcodes: ${response.status} ${response.statusText}`);
  }

  // Check content type - GeoServer returns XML on error
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`GeoServer returned non-JSON response (${contentType}). Check if layer ${layerName} exists or CQL filter is valid.`);
  }

  const data = await response.json();
  
  if (!data.features || data.features.length === 0) {
    // This is normal - some wards may not have areas with certain gridcode values
    console.log(`ℹ️ No features found for gridcodes ${gridcodes.join(', ')} in selected area (this is expected if those risk levels don't exist)`);
    return 0;
  }

  console.log(`✅ Found ${data.features.length} features with gridcodes ${gridcodes.join(', ')}`);

  // Sum Shape_Area values and convert from sqm to km²
  let totalAreaSqm = 0;
  data.features.forEach((feature: any) => {
    const props = feature.properties;
    const shapeAreaSqm = props.Shape_Area || props.SHAPE_AREA || props.shape_area || 0;
    totalAreaSqm += shapeAreaSqm;
  });

  return totalAreaSqm / 1000000; // Convert to km²
}

/**
 * Cache for hazard area data to avoid repeated API calls
 */
const hazardAreaCache = new Map<string, { data: HazardAreaResult; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedHazardArea(
  activeSector: Sector,
  activeLayerId: string,
  scenario: Scenario,
  selectedWardId?: string
): HazardAreaResult | null {
  // Use PRIMARY layer for cache key, not the activeLayerId
  const primaryLayerId = getPrimaryLayerForSector(activeSector);
  const cacheKey = `${activeSector}_${primaryLayerId}_${scenario}_${selectedWardId || 'all'}`;
  const cached = hazardAreaCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('📦 Using cached hazard area data for:', cacheKey);
    return cached.data;
  }
  
  return null;
}

export function setCachedHazardArea(
  activeSector: Sector,
  activeLayerId: string,
  scenario: Scenario,
  selectedWardId: string | undefined,
  data: HazardAreaResult
): void {
  // Use PRIMARY layer for cache key, not the activeLayerId
  const primaryLayerId = getPrimaryLayerForSector(activeSector);
  const cacheKey = `${activeSector}_${primaryLayerId}_${scenario}_${selectedWardId || 'all'}`;
  hazardAreaCache.set(cacheKey, { data, timestamp: Date.now() });
}

/**
 * Get the primary layer ID for a given sector
 */
function getPrimaryLayerForSector(sector: Sector): string {
  switch (sector) {
    case 'heat':
      return 'heat_hhi'; // Heat Stress Hazard Index
    case 'air':
      return 'air_aqi'; // Air Quality Index
    case 'flood':
      return 'flood_fhi'; // Flood Hazard Index
    case 'multihazard':
      return 'multihazard_assessment'; // Multi-Hazard Assessment
    default:
      return 'heat_hhi';
  }
}