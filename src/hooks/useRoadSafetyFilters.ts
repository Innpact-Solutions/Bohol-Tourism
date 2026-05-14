import { useState, useEffect } from 'react';
import { 
  fetchRoadSafetyFilters, 
  RoadSafetyFilters,
  RoadSafetyQueryFilters 
} from '../utils/roadSafetyAnalysis';
import { getHazardTableFromLayerIdAndScenario } from '../utils/hazardMapping';

/**
 * Hook for managing road safety filters
 * Fetches available filters and manages filter state
 */
export function useRoadSafetyFilters(activeLayerId: string | null, scenario: string) {
  const [availableFilters, setAvailableFilters] = useState<RoadSafetyFilters>({
    wards: [],
    road_names: [],
    vehicle_types: ['vehicle', 'motorcycle', 'pedestrian', 'bicyclist'],
    zones: []
  });
  
  const [appliedFilters, setAppliedFilters] = useState<RoadSafetyQueryFilters>({
    ward: null,
    road_name: null,
    vehicle_type: null
  });
  
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filtersError, setFiltersError] = useState<string | null>(null);

  // Fetch available filters when layer or scenario changes
  useEffect(() => {
    if (!activeLayerId) return;

    // Only fetch filters if the layer has a hazard table mapping (i.e., it's a valid road safety layer)
    const hazardTable = getHazardTableFromLayerIdAndScenario(activeLayerId, scenario);
    if (!hazardTable) {
      // Not a road safety layer, skip fetching
      return;
    }

    const loadFilters = async () => {
      setIsLoadingFilters(true);
      setFiltersError(null);

      try {
        const filters = await fetchRoadSafetyFilters(activeLayerId, scenario);
        setAvailableFilters(filters);
      } catch (error) {
        // Silently handle - filters endpoint is optional, defaults are used
        setFiltersError(null); // Don't show error to user
        // Keep default filters on error
      } finally {
        setIsLoadingFilters(false);
      }
    };

    loadFilters();
  }, [activeLayerId, scenario]);

  // Update filter values
  const updateFilter = (filterType: keyof RoadSafetyQueryFilters, value: string | null) => {
    setAppliedFilters(prev => ({
      ...prev,
      [filterType]: value === 'all' || value === '' ? null : value
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setAppliedFilters({
      ward: null,
      road_name: null,
      vehicle_type: null
    });
  };

  // Check if any filters are applied
  const hasActiveFilters = !!(
    appliedFilters.ward || 
    appliedFilters.road_name || 
    appliedFilters.vehicle_type
  );

  return {
    availableFilters,
    appliedFilters,
    isLoadingFilters,
    filtersError,
    updateFilter,
    resetFilters,
    hasActiveFilters
  };
}