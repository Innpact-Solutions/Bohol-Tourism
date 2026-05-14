/**
 * React hook for fetching road network hazard overlay analysis data
 */

import { useState, useEffect } from 'react';
import { fetchRoadNetworkAnalysis, RoadNetworkAnalysisResponse } from '../utils/roadNetworkAnalysis';
import { getHazardTableFromLayerIdAndScenario } from '../utils/hazardMapping';

interface UseRoadNetworkDataResult {
  data: RoadNetworkAnalysisResponse | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and manage road network analysis data
 * @param activeLayerId - Current active layer ID (e.g., 'heat_ast', 'air_pm25')
 * @param scenario - Current scenario (e.g., 'baseline_2025', 'ssp1_2040')
 * @param wardId - Optional ward ID for filtering (e.g., 'ward_5' or 'all')
 * @returns Object with data, loading state, and error
 */
export function useRoadNetworkData(
  activeLayerId: string,
  scenario: string,
  wardId: string = 'all'
): UseRoadNetworkDataResult {
  const [data, setData] = useState<RoadNetworkAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const abortController = new AbortController();
    
    const loadData = async () => {
      // Get hazard table from layer ID and scenario
      const hazardTable = getHazardTableFromLayerIdAndScenario(activeLayerId, scenario);
      
      if (!hazardTable) {
        console.warn('⚠️ No hazard table mapping for layer:', activeLayerId, 'scenario:', scenario);
        if (!isCancelled) {
          setData(null);
          setError(null); // Not an error, just unsupported
          setLoading(false);
        }
        return;
      }

      if (!isCancelled) {
        setLoading(true);
        setError(null);
        setData(null); // Clear stale data immediately
      }

      try {
        const result = await fetchRoadNetworkAnalysis(hazardTable, wardId, abortController.signal);
        if (!isCancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled && err.name !== 'AbortError') {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMessage);
          setData(null);
          // Silently skip road network data if backend is unavailable
          console.debug('[Road Network] Data fetch skipped:', errorMessage);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [activeLayerId, scenario, wardId]);

  return { data, loading, error };
}