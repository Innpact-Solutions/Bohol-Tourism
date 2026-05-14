/**
 * React hook for fetching road safety hazard overlay analysis data
 */

import { useState, useEffect } from 'react';
import { 
  fetchRoadSafetyAnalysis, 
  RoadSafetyAnalysisResponse,
  RoadSafetyQueryFilters 
} from '../utils/roadSafetyAnalysis';

interface UseRoadSafetyDataResult {
  data: RoadSafetyAnalysisResponse | null;
  loading: boolean;
  error: string | null;
}

/**
 * UPDATED: Hook to fetch and manage road safety analysis data with filters
 * Now supports ward, road name, and vehicle type filters from backend
 * @param activeLayerId - Current active layer ID (e.g., 'heat_hhi', 'air_pm25')
 * @param scenario - Current scenario (e.g., 'baseline_2025', 'ssp1_2040')
 * @param filters - Optional filters (ward, road_name, vehicle_type)
 * @returns Object with data, loading state, and error
 */
export function useRoadSafetyData(
  activeLayerId: string,
  scenario: string,
  filters?: RoadSafetyQueryFilters
): UseRoadSafetyDataResult {
  const [data, setData] = useState<RoadSafetyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API with filters
  useEffect(() => {
    let isCancelled = false;
    const abortController = new AbortController();
    
    const loadData = async () => {
      // Only fetch for supported layers
      const supportedLayers = [
        // Heat Stress
        'heat_ast', 'heat_hhi', 'heat_wbt', 'heat_rh', 'heat_lst', 'heat_wbgt', 'heat_uhi',
        // Air Pollution
        'air_pm25', 'air_pm10', 'air_no2', 'air_co', 'air_so2', 'air_o3', 'air_aqi',
        // Flood
        'flood', 'flood_fhi', 'flood_pluvial', 'flood_fluvial',
        // Multi-Hazard
        'multihazard', 'multihazard_assessment'
      ];
      
      if (!supportedLayers.includes(activeLayerId)) {
        console.warn('⚠️ Road safety analysis not supported for layer:', activeLayerId);
        if (!isCancelled) {
          setData(null);
          setError(null); // Not an error, just unsupported
          setLoading(false);
        }
        return;
      }

      console.log('🔍 [useRoadSafetyData] Fetching with filters:', {
        activeLayerId,
        scenario,
        ward: filters?.ward,
        road_name: filters?.road_name,
        vehicle_type: filters?.vehicle_type
      });

      if (!isCancelled) {
        setLoading(true);
        setError(null);
        setData(null); // Clear stale data immediately
      }

      try {
        const result = await fetchRoadSafetyAnalysis(activeLayerId, scenario, filters, abortController.signal);
        if (!isCancelled) {
          console.log('✅ [useRoadSafetyData] Data received:', {
            analysis_id: result.analysis_id,
            roads_count: result.metadata.roads_count,
            total_length: result.total_length_km,
            ward_filter: result.ward_filter,
            road_name_filter: result.road_name_filter,
            vehicle_type_filter: result.vehicle_type_filter
          });
          setData(result);
        }
      } catch (err) {
        if (!isCancelled && err.name !== 'AbortError') {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMessage);
          setData(null);
          console.error('❌ Failed to load road safety data:', errorMessage);
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
  }, [activeLayerId, scenario, filters?.ward, filters?.road_name, filters?.vehicle_type]);

  return { 
    data, 
    loading, 
    error 
  };
}