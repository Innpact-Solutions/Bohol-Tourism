/**
 * React Hook for Building Hazard Data
 * Fetches building counts by hazard severity levels
 */

import { useState, useEffect } from 'react';
import type { Sector } from '../App';
import {
  getBuildingHazardData,
  GridcodeBracket,
  BuildingHazardResponse
} from '../utils/buildingHazardApi';
import {
  getBuildingHazardTableName,
  getGeoDatabase,
  getBuildingTableName,
  ScenarioType
} from '../utils/buildingHazardConfig';

// Feature flag to enable/disable Building Hazard API calls
const ENABLE_BUILDING_HAZARD_API = true;

export interface BuildingHazardState {
  data: GridcodeBracket[];
  totalBuildings: number;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch building hazard data based on active layer and ward
 */
export function useBuildingHazard(
  sector: Sector,
  activeLayerId: string,
  scenario: ScenarioType | null,
  selectedWard: string | null
): BuildingHazardState {
  const [state, setState] = useState<BuildingHazardState>({
    data: [],
    totalBuildings: 0,
    loading: false,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Get hazard table name
        const hazardTable = getBuildingHazardTableName(activeLayerId, scenario, sector);
        
        if (!hazardTable) {
          setState({
            data: [],
            totalBuildings: 0,
            loading: false,
            error: null
          });
          return;
        }

        const geoDatabase = getGeoDatabase();
        const buildingTable = getBuildingTableName();

        // Fetch building hazard data
        const response: BuildingHazardResponse = await getBuildingHazardData(
          geoDatabase,
          hazardTable,
          buildingTable,
          selectedWard || undefined
        );

        if (!isMounted) return;

        setState({
          data: response.by_gridcode || [],
          totalBuildings: response.total_buildings || 0,
          loading: false,
          error: null
        });

      } catch (error) {
        if (!isMounted) return;
        
        // Gracefully handle errors - return empty data instead of breaking UI
        // Suppress all console output to avoid error spam when API is unavailable
        setState({
          data: [],
          totalBuildings: 0,
          loading: false,
          error: null // Don't expose error to UI
        });
      }
    }

    // Only fetch if we have a valid layer and the feature flag is enabled
    if (activeLayerId && sector && ENABLE_BUILDING_HAZARD_API) {
      fetchData();
    } else {
      setState({
        data: [],
        totalBuildings: 0,
        loading: false,
        error: null
      });
    }

    return () => {
      isMounted = false;
    };
  }, [sector, activeLayerId, scenario, selectedWard]);

  return state;
}