// Fresh KPI Area Calculation Utility
// Calculates total area for KPI #1 in each hazard section

import type { Sector, Scenario } from '../App';
import { getLayerNameForScenario } from '../config/geoserverLayers';

const GEOSERVER_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/GIZ_BBSR/ows';

export interface KPIAreaResult {
  totalAreaKm2: number;
  percentage: number;
}

/**
 * Get primary layer ID for each sector
 */
function getPrimaryLayerId(sector: Sector): string {
  switch (sector) {
    case 'heat':
      return 'heat_hhi';
    case 'air':
      return 'air_aqi';
    case 'flood':
      return 'flood_fhi';
    case 'multihazard':
      return 'multihazard_assessment';
    default:
      return 'heat_hhi';
  }
}

/**
 * Get gridcode values for high-risk areas per sector
 */
function getHighRiskGridcodes(sector: Sector): number[] {
  switch (sector) {
    case 'heat':
      return [3, 4]; // Gridcode 3 and 4
    case 'air':
      return [4, 5, 6]; // Gridcode 4, 5, and 6
    case 'flood':
      return [3, 4]; // Gridcode 3 and 4
    case 'multihazard':
      return [3, 4]; // Gridcode 3 and 4
    default:
      return [3, 4];
  }
}

/**
 * Fetch area data for KPI #1 in each hazard section
 */
export async function fetchKPIAreaData(
  sector: Sector,
  scenario: Scenario,
  selectedWardId?: string
): Promise<KPIAreaResult | null> {
  try {
    // Get primary layer for this sector
    const primaryLayerId = getPrimaryLayerId(sector);
    const layerName = getLayerNameForScenario(primaryLayerId, scenario);
    
    if (!layerName) {
      console.warn('⚠️ No layer name found for KPI calculation:', sector, scenario);
      return null;
    }

    // Get high-risk gridcodes for this sector
    const highRiskGridcodes = getHighRiskGridcodes(sector);
    
    // Build CQL filter for ward if needed
    let wardFilter = '';
    if (selectedWardId && selectedWardId !== 'all') {
      const wardNumber = parseInt(selectedWardId.split('_')[1]);
      wardFilter = `Ward=${wardNumber}`;
    }

    // Fetch total area (all gridcodes)
    const totalArea = await fetchTotalArea(layerName, wardFilter);
    
    // Fetch high-risk area (specific gridcodes)
    const highRiskArea = await fetchFilteredArea(layerName, highRiskGridcodes, wardFilter);
    
    if (totalArea === 0) {
      console.warn('⚠️ Total area is 0 for:', sector);
      return {
        totalAreaKm2: highRiskArea,
        percentage: 0
      };
    }

    const percentage = (highRiskArea / totalArea) * 100;
    
    console.log('✅ KPI Area Calculation:', {
      sector,
      layer: layerName,
      gridcodes: highRiskGridcodes,
      highRiskArea: `${highRiskArea.toFixed(2)} km²`,
      totalArea: `${totalArea.toFixed(2)} km²`,
      percentage: `${percentage.toFixed(1)}%`,
      ward: selectedWardId || 'all'
    });

    return {
      totalAreaKm2: highRiskArea,
      percentage: Math.round(percentage * 10) / 10 // Round to 1 decimal
    };
  } catch (error) {
    // Silently handle fetch errors - expected when backend is unavailable
    console.log('ℹ️  KPI area data not available (backend not connected)');
    return null;
  }
}

/**
 * Fetch total area from layer (all gridcodes)
 */
async function fetchTotalArea(layerName: string, wardFilter: string): Promise<number> {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: layerName,
    outputFormat: 'application/json',
    propertyName: 'Shape_Area'
  });

  if (wardFilter) {
    params.append('CQL_FILTER', wardFilter);
  }

  const url = `${GEOSERVER_WFS_URL}?${params.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`GeoServer error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.features || data.features.length === 0) {
    return 0;
  }

  // Sum all Shape_Area values and convert sqm to km²
  const totalAreaSqm = data.features.reduce((sum: number, feature: any) => {
    const area = feature.properties?.Shape_Area || 0;
    return sum + area;
  }, 0);

  return totalAreaSqm / 1_000_000; // Convert to km²
}

/**
 * Fetch area filtered by specific gridcodes
 */
async function fetchFilteredArea(
  layerName: string,
  gridcodes: number[],
  wardFilter: string
): Promise<number> {
  // Build CQL filter for gridcodes
  const gridcodeFilter = gridcodes.length === 1 
    ? `gridcode=${gridcodes[0]}`
    : `gridcode IN (${gridcodes.join(',')})`;

  // Combine ward filter and gridcode filter
  const cqlFilter = wardFilter 
    ? `${wardFilter} AND ${gridcodeFilter}`
    : gridcodeFilter;

  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: layerName,
    outputFormat: 'application/json',
    propertyName: 'Shape_Area,gridcode',
    CQL_FILTER: cqlFilter
  });

  const url = `${GEOSERVER_WFS_URL}?${params.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`GeoServer error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.features || data.features.length === 0) {
    return 0;
  }

  // Sum Shape_Area for filtered features and convert sqm to km²
  const filteredAreaSqm = data.features.reduce((sum: number, feature: any) => {
    const area = feature.properties?.Shape_Area || 0;
    return sum + area;
  }, 0);

  return filteredAreaSqm / 1_000_000; // Convert to km²
}