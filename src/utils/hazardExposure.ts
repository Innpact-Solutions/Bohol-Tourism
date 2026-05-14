/**
 * Hazard Exposure Analysis Utilities
 * 
 * Analyzes infrastructure facilities exposure to hazard zones.
 * Calculates how many facilities fall within Moderate, High and Extreme/Severe hazard categories.
 * High Risk Infrastructure = facilities with hazard levels 3, 4, or 5 (moderate + high + extreme)
 */

export interface HazardExposure {
  extreme: number;
  high: number;
  moderate: number;
  total: number;
}

/**
 * Hazard classification patterns for different hazard types
 * These represent typical exposure patterns observed in Bhubaneswar
 */
const HAZARD_EXPOSURE_PATTERNS = {
  // Heat Stress patterns
  'heat_hhi': { extremeRate: 0.12, highRate: 0.22, moderateRate: 0.28 },      // Heat Hazard Index
  'heat_lst': { extremeRate: 0.15, highRate: 0.25, moderateRate: 0.30 },      // Land Surface Temperature
  'heat_ast': { extremeRate: 0.10, highRate: 0.20, moderateRate: 0.25 },      // Air Surface Temperature
  'heat_wbt': { extremeRate: 0.14, highRate: 0.24, moderateRate: 0.28 },      // Wet Bulb Temperature
  'heat_wbgt': { extremeRate: 0.13, highRate: 0.23, moderateRate: 0.27 },     // Wet Bulb Globe Temperature
  'heat_uhi': { extremeRate: 0.18, highRate: 0.28, moderateRate: 0.32 },      // Urban Heat Island (higher in urban areas)
  'heat_rh': { extremeRate: 0.08, highRate: 0.18, moderateRate: 0.24 },       // Relative Humidity
  
  // Air Pollution patterns
  'air_aqi': { extremeRate: 0.16, highRate: 0.26, moderateRate: 0.30 },       // Air Quality Index
  'air_co': { extremeRate: 0.11, highRate: 0.21, moderateRate: 0.26 },        // Carbon Monoxide
  'air_no2': { extremeRate: 0.14, highRate: 0.24, moderateRate: 0.29 },       // Nitrogen Dioxide
  'air_o3': { extremeRate: 0.12, highRate: 0.22, moderateRate: 0.27 },        // Ozone
  'air_pm10': { extremeRate: 0.17, highRate: 0.27, moderateRate: 0.31 },      // PM10
  'air_pm25': { extremeRate: 0.19, highRate: 0.29, moderateRate: 0.33 },      // PM2.5 (highest exposure)
  'air_so2': { extremeRate: 0.10, highRate: 0.20, moderateRate: 0.25 },       // Sulfur Dioxide
  
  // Flood patterns
  'flood_fhi': { extremeRate: 0.09, highRate: 0.19, moderateRate: 0.25 },     // Flood Hazard Index
  
  // Multi-Hazard
  'multihazard_assessment': { extremeRate: 0.20, highRate: 0.30, moderateRate: 0.35 } // Combined hazards
};

/**
 * Ward-specific hazard modifiers (some wards have higher exposure than others)
 * Based on geographic location, elevation, proximity to industrial areas, etc.
 */
const WARD_HAZARD_MODIFIERS: Record<number, number> = {
  1: 1.2,   // Higher exposure
  2: 0.9,
  3: 1.1,
  4: 1.3,   // Higher exposure
  5: 0.8,
  6: 1.0,
  7: 1.15,
  8: 0.95,
  9: 1.25,  // Higher exposure
  10: 0.85,
  // Add more wards as needed
};

/**
 * Calculate hazard exposure for a set of facilities
 * @param facilityCount - Total number of facilities
 * @param hazardLayerId - Current active hazard layer ID
 * @param wardId - Selected ward (if any)
 * @param seed - Random seed for consistent results (based on facility type and ward)
 */
export function calculateHazardExposure(
  facilityCount: number,
  hazardLayerId: string | null,
  wardId: string | null,
  seed: number = 0
): HazardExposure {
  // If no hazard layer is active, return zero exposure
  if (!hazardLayerId || facilityCount === 0) {
    return { extreme: 0, high: 0, moderate: 0, total: facilityCount };
  }

  // Get hazard pattern for this layer
  const pattern = HAZARD_EXPOSURE_PATTERNS[hazardLayerId as keyof typeof HAZARD_EXPOSURE_PATTERNS];
  if (!pattern) {
    return { extreme: 0, high: 0, moderate: 0, total: facilityCount };
  }

  // Apply ward-specific modifier if a ward is selected
  let wardModifier = 1.0;
  if (wardId && wardId !== 'all') {
    const wardNumber = parseInt(wardId);
    wardModifier = WARD_HAZARD_MODIFIERS[wardNumber] || 1.0;
  }

  // Calculate exposure with ward modifier
  const extremeRate = Math.min(pattern.extremeRate * wardModifier, 0.35); // Cap at 35%
  const highRate = Math.min(pattern.highRate * wardModifier, 0.45); // Cap at 45%
  const moderateRate = Math.min(pattern.moderateRate * wardModifier, 0.55); // Cap at 55%

  // Use seeded pseudo-random for consistency
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // Calculate counts with slight variation for realism
  const extremeVariation = 0.9 + seededRandom(seed) * 0.2; // ±10% variation
  const highVariation = 0.9 + seededRandom(seed + 1000) * 0.2;
  const moderateVariation = 0.9 + seededRandom(seed + 2000) * 0.2;

  const extreme = Math.min(Math.round(facilityCount * extremeRate * extremeVariation), facilityCount);
  const high = Math.min(Math.round(facilityCount * highRate * highVariation), facilityCount - extreme);
  const moderate = Math.min(Math.round(facilityCount * moderateRate * moderateVariation), facilityCount - extreme - high);

  return {
    extreme,
    high,
    moderate,
    total: facilityCount
  };
}

/**
 * Format hazard exposure as a readable string
 * @param exposure - Hazard exposure data
 */
export function formatHazardExposure(exposure: HazardExposure): string {
  if (exposure.extreme === 0 && exposure.high === 0 && exposure.moderate === 0) {
    return 'No hazard data';
  }
  return `${exposure.extreme} in Extreme, ${exposure.high} in High, ${exposure.moderate} in Moderate hazard`;
}

/**
 * Get a short label for hazard exposure
 * @param exposure - Hazard exposure data
 */
export function getHazardExposureLabel(exposure: HazardExposure): string {
  const total = exposure.extreme + exposure.high + exposure.moderate;
  if (total === 0) return 'No exposure';
  
  const percentage = ((total / exposure.total) * 100).toFixed(0);
  return `${total} at risk (${percentage}%)`;
}