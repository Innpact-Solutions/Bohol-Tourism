// React hook to fetch hazard area data from preloaded context

import type { Sector } from '../App';
import { useHazardDataForSector } from '../contexts/HazardDataContext';
import type { HazardAreaResult } from '../utils/hazardAreaData';

/**
 * Hook to get preloaded hazard area data for a specific sector
 * Data is preloaded on app start for instant access
 */
export function useHazardAreaData(activeSector: Sector): HazardAreaResult | null {
  return useHazardDataForSector(activeSector);
}
