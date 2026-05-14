import { useState, useEffect } from 'react';
import { getOrCreateKPIs, getKPIData, type KPIData } from '../utils/hazardKpiApi';
import { 
  getHazardTableName, 
  getHazardType, 
  getThreshold, 
  shouldShowKPIs,
  type Scenario 
} from '../utils/hazardKpiConfig';

export interface HazardKPIState {
  coverage: KPIData | null;
  building: KPIData | null;
  infra: KPIData | null;
  roadNetwork: KPIData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch and manage Hazard KPI data
 * Automatically fetches or creates KPIs for the active hazard layer
 * Supports ward filtering
 * Note: KPIs are sector-level, not layer-level, so they don't change when switching sub-layers
 */
export function useHazardKPI(
  activeSector: string,
  activeLayer: string | null,
  scenario: Scenario | null,
  selectedWard: string | null,
  geoDatabase: string = 'bbsr'
): HazardKPIState {
  const [state, setState] = useState<HazardKPIState>({
    coverage: null,
    building: null,
    infra: null,
    roadNetwork: null,
    loading: false,
    error: null
  });

  useEffect(() => {
    // Reset state when sector/scenario/ward changes (not layer)
    setState({
      coverage: null,
      building: null,
      infra: null,
      roadNetwork: null,
      loading: false,
      error: null
    });

    // Check if we should show KPIs for this sector
    if (!shouldShowKPIs(activeSector)) {
      return;
    }

    let isMounted = true;

    async function fetchKPIs() {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Get hazard table name and type (activeLayer is only used for validation, not for table selection)
        const hazardTable = getHazardTableName(activeLayer || '', scenario, activeSector);
        const hazardType = getHazardType(activeSector);
        const threshold = getThreshold(activeSector);

        if (!hazardTable || !hazardType || !threshold) {
          throw new Error('Invalid hazard configuration');
        }

        // Get or create KPIs
        const kpis = await getOrCreateKPIs(hazardTable, hazardType, threshold, geoDatabase);

        // If ward is selected, fetch ward-specific data for each KPI
        if (selectedWard) {
          const [coverageData, buildingData, infraData, roadNetworkData] = await Promise.all([
            getKPIData(kpis.coverage.id, selectedWard),
            getKPIData(kpis.building.id, selectedWard),
            getKPIData(kpis.infra.id, selectedWard),
            getKPIData(kpis.roadNetwork.id, selectedWard)
          ]);

          if (!isMounted) return;

          setState({
            coverage: coverageData,
            building: buildingData,
            infra: infraData,
            roadNetwork: roadNetworkData,
            loading: false,
            error: null
          });
        } else {
          // Use city-wide data (no ward filter)
          if (!isMounted) return;

          setState({
            coverage: kpis.coverage,
            building: kpis.building,
            infra: kpis.infra,
            roadNetwork: kpis.roadNetwork,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        // Only log error if it's not a network/fetch error (which are expected when backend is unavailable)
        if (error instanceof Error && !error.message.includes('fetch') && error.name !== 'TypeError') {
          console.error('Error fetching hazard KPIs:', error);
        }
        if (!isMounted) return;
        
        // Silently fail - don't show error in UI for network/timeout issues
        setState({
          coverage: null,
          building: null,
          infra: null,
          roadNetwork: null,
          loading: false,
          error: null // Don't expose error to UI
        });
      }
    }

    fetchKPIs();

    return () => {
      isMounted = false;
    };
  }, [activeSector, scenario, selectedWard, geoDatabase]); // Removed activeLayer from dependencies

  return state;
}

/**
 * Format KPI value with appropriate unit and formatting
 */
export function formatKPIValue(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) return 'N/A';

  switch (unit) {
    case 'km²':
      return `${value.toFixed(1)} km²`;
    case 'km':
      return `${value.toFixed(1)} km`;
    case 'count':
      return value.toLocaleString();
    default:
      return value.toString();
  }
}

/**
 * Format KPI percentage
 */
export function formatKPIPercentage(percentage: number | null | undefined): string {
  if (percentage === null || percentage === undefined) return 'N/A';
  return `${percentage.toFixed(1)}%`;
}