/**
 * Building Hazard Configuration
 * Maps hazard layers to their table names for the Building Hazard API
 */

import type { Sector } from '../App';
import { geoserverLayers } from '../config/geoserverLayers';

export type ScenarioType = 'baseline' | 'ssp1' | 'ssp2' | 'ssp5';

/**
 * Extract table name from GeoServer layer name
 * Example: "GIZ_BBSR:HHI_2025" -> "HHI_2025"
 */
function extractTableName(geoserverLayer: string): string {
  const parts = geoserverLayer.split(':');
  return parts.length > 1 ? parts[1] : geoserverLayer;
}

/**
 * Get hazard table name for Building Hazard API
 * Maps layer IDs + scenarios to the correct GeoServer table names
 */
export function getBuildingHazardTableName(
  layerId: string,
  scenario: ScenarioType | null,
  sector: Sector
): string | null {
  // Heat Stress sector - layers have scenario variants
  if (sector === 'heat') {
    const baseLayerConfig = geoserverLayers[layerId];
    
    if (!baseLayerConfig) {
      console.warn('[buildingHazardConfig] Layer not found:', layerId);
      return null;
    }

    // Extract base table name from baseline layer
    const baseTableName = extractTableName(baseLayerConfig.geoserverLayer);
    
    // HHI layers
    if (layerId === 'heat_hhi') {
      if (scenario === 'baseline') return 'HHI_2025';
      if (scenario === 'ssp1') return 'HHI_SSP1_2040';
      if (scenario === 'ssp2') return 'HHI_SSP2_2040';
      if (scenario === 'ssp5') return 'HHI_SSP5_2040';
    }
    
    // LST layers
    if (layerId === 'heat_lst') {
      if (scenario === 'baseline') return 'LST_2025';
      if (scenario === 'ssp1') return 'LST_SSP1_2040';
      if (scenario === 'ssp2') return 'LST_SSP2_2040';
      if (scenario === 'ssp5') return 'LST_SSP5_2040';
    }
    
    // AST layers
    if (layerId === 'heat_ast') {
      if (scenario === 'baseline') return 'AST_2025';
      if (scenario === 'ssp1') return 'AST_SSP1_2040';
      if (scenario === 'ssp2') return 'AST_SSP2_2040';
      if (scenario === 'ssp5') return 'AST_SSP5_2040';
    }
    
    // WBT layers
    if (layerId === 'heat_wbt') {
      if (scenario === 'baseline') return 'WBT_2025';
      if (scenario === 'ssp1') return 'WBT_SSP1_2040';
      if (scenario === 'ssp2') return 'WBT_SSP2_2040';
      if (scenario === 'ssp5') return 'WBT_SSP5_2040';
    }
    
    // WBGT layers
    if (layerId === 'heat_wbgt') {
      if (scenario === 'baseline') return 'WBGT_2025';
      if (scenario === 'ssp1') return 'WBGT_SSP1_2040';
      if (scenario === 'ssp2') return 'WBGT_SSP2_2040';
      if (scenario === 'ssp5') return 'WBGT_SSP5_2040';
    }
    
    // RH - only baseline available
    if (layerId === 'heat_rh') {
      return 'RH_2025';
    }
    
    // UHI - only baseline available
    if (layerId === 'heat_uhi') {
      return 'UHI_2025';
    }
  }

  // Air Pollution sector - no scenario variants
  if (sector === 'air') {
    if (layerId === 'air_aqi') return 'Air_AQI';
    if (layerId === 'air_pm25') return 'Air_PM25';
    if (layerId === 'air_pm10') return 'Air_PM10';
    if (layerId === 'air_co') return 'Air_CO';
    if (layerId === 'air_no2') return 'Air_NO2';
    if (layerId === 'air_o3') return 'Air_O3';
    if (layerId === 'air_so2') return 'Air_SO2';
  }

  // Flood sector - no scenario variants
  if (sector === 'flood') {
    if (layerId === 'flood_fhi') return 'Flood_Hazard';
  }

  // Multi-Hazard sector - no scenario variants
  if (sector === 'multihazard') {
    if (layerId === 'multihazard_assessment') return 'Multi_Hazard_BBSR';
  }

  return null;
}

/**
 * Get geo database name (currently only BBSR)
 */
export function getGeoDatabase(): string {
  return 'bbsr';
}

/**
 * Get building table name
 */
export function getBuildingTableName(): string {
  return 'Buildings';
}
