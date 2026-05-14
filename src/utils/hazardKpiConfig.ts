/**
 * Configuration for Hazard KPI API Integration
 * Maps layer names to hazard tables and defines thresholds
 */

export type HazardType = 'heat-stress' | 'air' | 'flood' | 'multi';
export type Scenario = 'baseline' | 'ssp1' | 'ssp2' | 'ssp5';

/**
 * Threshold gridcodes for each hazard type
 * Higher values = more dangerous
 */
export const HAZARD_THRESHOLDS: Record<HazardType, number[]> = {
  'heat-stress': [3, 4],
  'air': [4, 5, 6],
  'flood': [3, 4],
  'multi': [3, 4]
};

/**
 * Map Heat Stress scenarios to hazard table names
 */
export const HEAT_STRESS_TABLES: Record<Scenario, string> = {
  baseline: 'HHI_2025',
  ssp1: 'HHI_SSP1_2040',
  ssp2: 'HHI_SSP2_2040',
  ssp5: 'HHI_SSP5_2040'
};

/**
 * Map other hazard types to their table names
 */
export const HAZARD_TABLES: Record<string, string> = {
  air: 'Air_AQI',
  flood: 'Flood_Hazard',
  multi: 'Multi_Hazard_BBSR'
};

/**
 * Get hazard table name from layer name
 * @param layerName - The active layer name (e.g., "UHI Effect", "Heat Wave Vulnerability")
 * @param scenario - The scenario (only for heat-stress)
 * @param sector - The active sector
 */
export function getHazardTableName(
  layerName: string,
  scenario: Scenario | null,
  sector: string
): string | null {
  switch (sector) {
    case 'heat':
      // All heat stress layers use the same table based on scenario
      if (!scenario) return HEAT_STRESS_TABLES.baseline;
      return HEAT_STRESS_TABLES[scenario];
    
    case 'air':
      return HAZARD_TABLES.air;
    
    case 'flood':
      return HAZARD_TABLES.flood;
    
    case 'multi':
    case 'multihazard': // Support both naming conventions
      return HAZARD_TABLES.multi;
    
    default:
      return null;
  }
}

/**
 * Get hazard type from sector
 */
export function getHazardType(sector: string): HazardType | null {
  switch (sector) {
    case 'heat':
      return 'heat-stress';
    case 'air':
      return 'air';
    case 'flood':
      return 'flood';
    case 'multi':
    case 'multihazard': // Support both naming conventions
      return 'multi';
    default:
      return null;
  }
}

/**
 * Get threshold gridcodes for a sector
 */
export function getThreshold(sector: string): number[] | null {
  const hazardType = getHazardType(sector);
  if (!hazardType) return null;
  return HAZARD_THRESHOLDS[hazardType];
}

/**
 * Check if a sector/layer should show KPIs
 */
export function shouldShowKPIs(sector: string): boolean {
  // Show KPIs for heat, air, flood, multi hazard sectors
  // Do not show for road-safety or other infrastructure-only views
  return ['heat', 'air', 'flood', 'multi', 'multihazard'].includes(sector);
}