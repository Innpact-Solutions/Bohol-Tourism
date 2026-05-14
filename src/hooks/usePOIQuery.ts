/**
 * Custom React Hook for POI Query API
 * 
 * Manages state and API calls for the Query Builder feature
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchPOICategories,
  fetchPOIWards,
  fetchPOIZones,
  fetchHazardColumns,
  executePOIQuery,
  mapInfraTypeToPOITable,
  mapRiskLevelToValue,
  mapHazardTypeToColumn,
  type POICategory,
  type POIWard,
  type POIZone,
  type HazardColumn,
  type POIQueryRequest,
  type POIQueryResponse,
} from '../utils/poiQueryApi';

// ============================================================================
// Hook Interfaces
// ============================================================================

export interface POIQueryFilters {
  selectedInfraTypes: string[];
  selectedSubLayers: string[];
  heatRisk: string;
  airRisk: string;
  floodRisk: string;
  multiHazardRisk: string;
  safetyRatings: string[];
  safetyRatingType: string;
  selectedWard: string;
}

export interface POIQueryMetadata {
  categories: POICategory[];
  wards: POIWard[];
  zones: POIZone[];
  hazardColumns: HazardColumn[];
}

export interface UsePOIQueryReturn {
  // Metadata
  metadata: POIQueryMetadata;
  metadataLoading: boolean;
  metadataError: Error | null;
  
  // Query execution
  results: POIQueryResponse | null;
  isExecuting: boolean;
  queryError: Error | null;
  
  // Actions
  executeQuery: (filters: POIQueryFilters) => Promise<void>;
  loadMetadata: (poiTable?: string) => Promise<void>;
}

// ============================================================================
// Custom Hook
// ============================================================================

export function usePOIQuery(geoDatabase: string = 'bbsr'): UsePOIQueryReturn {
  // Metadata state
  const [metadata, setMetadata] = useState<POIQueryMetadata>({
    categories: [],
    wards: [],
    zones: [],
    hazardColumns: [],
  });
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState<Error | null>(null);

  // Query execution state
  const [results, setResults] = useState<POIQueryResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryError, setQueryError] = useState<Error | null>(null);

  /**
   * Load metadata (categories, wards, zones, hazard columns)
   */
  const loadMetadata = useCallback(async (poiTable: string = 'Education') => {
    setMetadataLoading(true);
    setMetadataError(null);

    try {
      console.log('[usePOIQuery] Loading metadata for:', poiTable);

      // Fetch all metadata in parallel
      const [categories, wards, zones, hazardColumns] = await Promise.all([
        fetchPOICategories(geoDatabase, poiTable),
        fetchPOIWards(geoDatabase),
        fetchPOIZones(geoDatabase),
        fetchHazardColumns(geoDatabase, poiTable),
      ]);

      setMetadata({
        categories,
        wards,
        zones,
        hazardColumns,
      });

      console.log('[usePOIQuery] Metadata loaded successfully:', {
        categories: categories.length,
        wards: wards.length,
        zones: zones.length,
        hazardColumns: hazardColumns.length,
      });
    } catch (error) {
      console.error('[usePOIQuery] Failed to load metadata:', error);
      setMetadataError(error as Error);
    } finally {
      setMetadataLoading(false);
    }
  }, [geoDatabase]);

  /**
   * Execute POI query with filters
   */
  const executeQuery = useCallback(async (filters: POIQueryFilters) => {
    setIsExecuting(true);
    setQueryError(null);

    try {
      console.log('[usePOIQuery] Executing query with filters:', filters);

      // Build POI tables list from selected infrastructure types
      const poiTables = filters.selectedInfraTypes.map(mapInfraTypeToPOITable);

      // Build hazard filters
      const hazardFilters: POIQueryRequest['hazard_filters'] = {};

      // Heat stress filter
      if (filters.heatRisk && filters.heatRisk !== 'Any') {
        const minValue = mapRiskLevelToValue(filters.heatRisk);
        if (minValue !== null) {
          hazardFilters.heat_stress = {
            column: mapHazardTypeToColumn('heat'),
            min: minValue,
            max: null,
          };
        }
      }

      // Air pollution filter
      if (filters.airRisk && filters.airRisk !== 'Any') {
        const minValue = mapRiskLevelToValue(filters.airRisk);
        if (minValue !== null) {
          hazardFilters.air_quality = {
            column: mapHazardTypeToColumn('air'),
            min: minValue,
            max: null,
          };
        }
      }

      // Flood risk filter
      if (filters.floodRisk && filters.floodRisk !== 'Any') {
        const minValue = mapRiskLevelToValue(filters.floodRisk);
        if (minValue !== null) {
          hazardFilters.flood = {
            column: mapHazardTypeToColumn('flood'),
            min: minValue,
            max: null,
          };
        }
      }

      // Multi-hazard filter
      if (filters.multiHazardRisk && filters.multiHazardRisk !== 'Any') {
        const minValue = mapRiskLevelToValue(filters.multiHazardRisk);
        if (minValue !== null) {
          hazardFilters.multi_hazard = {
            column: mapHazardTypeToColumn('multi'),
            min: minValue,
            max: null,
          };
        }
      }

      // Extract ward number from ward string (e.g., "Ward 2 - Lingaraj" -> 2)
      let wardNumbers: number[] | undefined;
      if (filters.selectedWard && filters.selectedWard !== 'All Wards') {
        const wardMatch = filters.selectedWard.match(/Ward (\d+)/);
        if (wardMatch) {
          wardNumbers = [parseInt(wardMatch[1])];
        }
      }

      // Build request
      const request: POIQueryRequest = {
        geo_database: geoDatabase,
        poi_tables: poiTables,
        categories: filters.selectedSubLayers.length > 0 ? undefined : undefined, // TODO: Map sublayers to categories
        wards: wardNumbers,
        hazard_filters: Object.keys(hazardFilters).length > 0 ? hazardFilters : undefined,
        limit: 100,
        offset: 0,
      };

      // Execute query
      const response = await executePOIQuery(request);
      setResults(response);

      console.log('[usePOIQuery] Query executed successfully:', {
        total_count: response.total_count,
        query_time_ms: response.query_time_ms,
      });
    } catch (error) {
      console.error('[usePOIQuery] Query execution failed:', error);
      setQueryError(error as Error);
      setResults(null);
    } finally {
      setIsExecuting(false);
    }
  }, [geoDatabase]);

  return {
    // Metadata
    metadata,
    metadataLoading,
    metadataError,
    
    // Query execution
    results,
    isExecuting,
    queryError,
    
    // Actions
    executeQuery,
    loadMetadata,
  };
}
