/**
 * Road Safety Hazard Analysis API Client
 */

import { getHazardTableFromLayerIdAndScenario } from './hazardMapping';

const API_BASE_URL = 'https://geo-view-x-backend-0-1-gvdsbcb9d5cghqdw.centralindia-01.azurewebsites.net/';
const API_USERNAME = 'admin';
const API_PASSWORD = 'vYLnb)VEhhX7y8+Gbr+CnCUe';

// Generate Basic Auth header
const getAuthHeader = (): string => {
  const credentials = btoa(`${API_USERNAME}:${API_PASSWORD}`);
  return `Basic ${credentials}`;
};

// NEW: Available filters response
export interface RoadSafetyFilters {
  wards: string[];
  road_names: string[];
  vehicle_types: string[];
  zones: string[];
}

// NEW: Filters for API requests
export interface RoadSafetyQueryFilters {
  ward?: string | null;
  road_name?: string | null;
  vehicle_type?: string | null;
}

// Response interfaces matching NEW API structure
export interface RoadSafetyByRoad {
  road_name: string;
  total_km: number;
  [key: string]: number | string; // Dynamic gridcode properties
}

export interface RoadSafetyByGridcode {
  gridcode: number;
  hazard_type: string;
  color_code: string;
  length_km: number;
}

// NEW: Safety rating breakdown with hazard gridcode cross-tabulation
export interface RoadSafetyBySafetyRating {
  star_rating: number;
  star_label: string;
  total_km: number;
  [key: string]: number | string; // Dynamic gridcode properties (e.g., "0": 0.8, "1": 4.5836, "2": 19.0729)
}

// NEW: Safety scores by gridcode and vehicle type
export interface RoadSafetySafetyScore {
  gridcode: number;
  hazard_type: string;
  avg_vehicle?: number;
  avg_motorcycle?: number;
  avg_pedestrian?: number;
  avg_bicyclist?: number;
  avg_score: number; // The specific vehicle type average when filtered
}

// NEW: Ward breakdown
export interface RoadSafetyWardBreakdown {
  ward: string;
  total_km: number;
  by_gridcode: Record<string, number>;
}

export interface RoadSafetyMetadata {
  total_length_km: number;
  roads_count: number;
  gridcodes: number[];
  segment_count?: number;
  wards_count?: number;
  filters?: RoadSafetyQueryFilters;
}

// Backend API raw response structure
interface RoadSafetyAPIResponse {
  analysis_id: number;
  analysis_name: string;
  hazard_table: string;
  last_computed_at: string;
  filters?: RoadSafetyQueryFilters;
  data: {
    by_road: Array<{
      road_name: string;
      total_km: number;
      [key: string]: number | string; // Dynamic gridcode columns
    }>;
    by_gridcode: RoadSafetyByGridcode[];
    by_safety_rating?: RoadSafetyBySafetyRating[]; // NEW: Safety rating breakdown with hazard cross-tabulation
    ward_breakdown?: RoadSafetyWardBreakdown[];
    safety_scores?: RoadSafetySafetyScore[];
    gridcode_types: Record<string, string>;
    gridcode_colors: Record<string, string>;
    metadata: RoadSafetyMetadata;
  };
}

// Normalized response for consumption by components
export interface RoadSafetyAnalysisResponse {
  analysis_id: number;
  analysis_name: string;
  hazard_table: string;
  ward_filter: number | null;
  road_name_filter: string | null;
  vehicle_type_filter: string | null;
  total_length_km: number;
  created_at: string;
  by_gridcode: RoadSafetyByGridcode[];
  by_road: RoadSafetyByRoad[];
  by_safety_rating: RoadSafetyBySafetyRating[]; // NEW: Include safety rating breakdown
  ward_breakdown: RoadSafetyWardBreakdown[];
  safety_scores: RoadSafetySafetyScore[];
  gridcode_colors: Record<string, string>;
  gridcode_types: Record<string, string>;
  gridcodes: number[];
  metadata: RoadSafetyMetadata;
}

// Cache for API responses (5 minute TTL)
const roadSafetyCache = new Map<string, { data: RoadSafetyAnalysisResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * NEW: Fetch available filters for road safety analysis
 * @param activeLayerId - Current active layer ID
 * @param scenario - Current scenario
 * @returns Available filter options
 */
export async function fetchRoadSafetyFilters(
  activeLayerId: string,
  scenario: string
): Promise<RoadSafetyFilters> {
  const hazardTable = getHazardTableFromLayerIdAndScenario(activeLayerId, scenario);
  
  if (!hazardTable) {
    throw new Error(`No hazard table mapping for layer: ${activeLayerId}, scenario: ${scenario}`);
  }

  const url = `${API_BASE_URL}analysis/road-safety/hazard/${hazardTable}/filters`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      timeout: 10000, // 10 second timeout for filters
    });

    if (response.ok) {
      return await response.json();
    }

    // If endpoint returns 404 or 500, silently return fallback
    if (response.status === 404 || response.status >= 500) {
      console.warn(`⚠️ [Road Safety] Filters endpoint unavailable (${response.status}). Using defaults.`);
      return {
        wards: [],
        road_names: [],
        vehicle_types: ['vehicle', 'motorcycle', 'pedestrian', 'bicyclist'],
        zones: []
      };
    }

    throw new Error(`Failed to fetch filters: ${response.status}`);
  } catch (error) {
    // Silently handle unavailable filters endpoint - return default filters
    // This is expected behavior as the filters endpoint may not be implemented
    return {
      wards: [],
      road_names: [],
      vehicle_types: ['vehicle', 'motorcycle', 'pedestrian', 'bicyclist'],
      zones: []
    };
  }
}

/**
 * UPDATED: Fetch road safety hazard overlay analysis with filters
 * @param activeLayerId - Current active layer ID (e.g., 'heat_hhi', 'air_pm25')
 * @param scenario - Current scenario (e.g., 'baseline_2025', 'ssp1_2040')
 * @param filters - Optional filters (ward, road_name, vehicle_type)
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Road safety analysis data
 */
export async function fetchRoadSafetyAnalysis(
  activeLayerId: string,
  scenario: string,
  filters?: RoadSafetyQueryFilters,
  signal?: AbortSignal
): Promise<RoadSafetyAnalysisResponse> {
  // Get hazard table from layer ID and scenario
  const hazardTable = getHazardTableFromLayerIdAndScenario(activeLayerId, scenario);
  
  if (!hazardTable) {
    throw new Error(`No hazard table mapping for layer: ${activeLayerId}, scenario: ${scenario}`);
  }

  // Generate cache key
  const wardFilter = filters?.ward && filters.ward !== 'all' ? filters.ward : 'all';
  const roadNameFilter = filters?.road_name || null;
  const vehicleTypeFilter = filters?.vehicle_type || null;
  const cacheKey = `road_safety|${hazardTable}|${wardFilter}|${roadNameFilter}|${vehicleTypeFilter}`;

  // Check cache
  const cached = roadSafetyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('✅ Using cached road safety data for', cacheKey);
    return cached.data;
  }

  // Build URL with proper query parameters
  const url = new URL(`${API_BASE_URL}analysis/road-safety/hazard/${hazardTable}/chart-data`);
  
  // Add ward parameter if specified
  if (filters?.ward && filters.ward !== 'all') {
    const wardNumber = filters.ward.replace('ward_', '');
    url.searchParams.append('ward', wardNumber);
    console.log(`📍 [Road Safety] Ward filter applied: ${wardNumber} (from: ${filters.ward})`);
  }

  // Add road name parameter if specified (URLSearchParams auto-encodes)
  if (filters?.road_name) {
    url.searchParams.append('road_name', filters.road_name);
    console.log(`🛣️  [Road Safety] Road name filter applied: ${filters.road_name}`);
  }

  // Add vehicle type parameter if specified
  if (filters?.vehicle_type) {
    url.searchParams.append('vehicle_type', filters.vehicle_type);
    console.log(`🚗 [Road Safety] Vehicle type filter applied: ${filters.vehicle_type}`);
  }

  console.log('🌐 [Road Safety API] Requesting URL:', url.toString());
  console.log('📋 [Road Safety API] Filters applied:', {
    ward: filters?.ward || 'none',
    road_name: filters?.road_name || 'none',
    vehicle_type: filters?.vehicle_type || 'none'
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      signal: signal,
    });

    // SUCCESS: Analysis exists
    if (response.ok) {
      const apiData: RoadSafetyAPIResponse = await response.json();
      return processAndCacheRoadSafetyData(apiData, hazardTable, filters, cacheKey);
    }

    // EXPECTED: Analysis doesn't exist yet (404)
    if (response.status === 404) {
      console.log('⚠️ [Road Safety] Analysis not found. Creating...');
      return await createAndRetryRoadSafetyAnalysis(hazardTable, filters, cacheKey);
    }

    // ERROR: Other status codes
    const errorText = await response.text();
    console.error('❌ [Road Safety] API Error Response:', errorText);
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);

  } catch (error) {
    // Silent error handling - UI will show warning banner
    return generateFallbackRoadSafetyData(hazardTable, filters);
  }
}

/**
 * Create a new road safety analysis
 * @param hazardTable - Hazard table name
 * @returns Created analysis response
 */
async function createRoadSafetyAnalysis(hazardTable: string): Promise<{ id: number }> {
  const createUrl = `${API_BASE_URL}analysis/road-safety`;
  
  const body = {
    name: `RoadSafety_${hazardTable}`,
    geo_database: 'bbsr',
    road_safety_table: 'Road_Safety',
    hazard_table: hazardTable,
    description: 'Road Safety analysis'
  };

  console.log('📝 [Road Safety] Creating analysis with body:', body);

  try {
    const response = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      mode: 'cors',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Road Safety] POST failed:', errorText);
      throw new Error(`POST failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const created = await response.json();
    console.log(`✅ [Road Safety] Analysis created with ID: ${created.id}`);
    return created;
  } catch (error) {
    console.error('❌ [Road Safety] POST error:', error);
    throw error;
  }
}

/**
 * Create analysis and retry GET with exponential backoff
 * @param hazardTable - Hazard table name
 * @param filters - Optional filters
 * @param cacheKey - Cache key for storing result
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Road safety analysis data
 */
async function createAndRetryRoadSafetyAnalysis(
  hazardTable: string,
  filters: RoadSafetyQueryFilters | undefined,
  cacheKey: string,
  maxRetries: number = 3
): Promise<RoadSafetyAnalysisResponse> {
  try {
    // Step 1: Create the analysis
    const created = await createRoadSafetyAnalysis(hazardTable);
    console.log(`⏳ [Road Safety] Analysis created with ID ${created.id}. Waiting for computation...`);
    
    // Step 2: Wait for backend to process (2 seconds initial wait)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Retry GET with exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Build URL with proper query parameters
        const url = new URL(`${API_BASE_URL}analysis/road-safety/hazard/${hazardTable}/chart-data`);
        
        if (filters?.ward && filters.ward !== 'all') {
          const wardNumber = filters.ward.replace('ward_', '');
          url.searchParams.append('ward', wardNumber);
        }

        if (filters?.road_name) {
          url.searchParams.append('road_name', filters.road_name);
        }

        if (filters?.vehicle_type) {
          url.searchParams.append('vehicle_type', filters.vehicle_type);
        }

        console.log(`🔄 [Road Safety] Retry attempt ${attempt}/${maxRetries}...`);
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        });
        
        if (response.ok) {
          console.log(`✅ [Road Safety] Data retrieved successfully on attempt ${attempt}`);
          const apiData: RoadSafetyAPIResponse = await response.json();
          return processAndCacheRoadSafetyData(apiData, hazardTable, filters, cacheKey);
        }
        
        // Still processing (404) or processing (202)
        if ((response.status === 404 || response.status === 202) && attempt < maxRetries) {
          const waitTime = 1000 * attempt; // 1s, 2s, 3s
          console.log(`⏳ [Road Safety] Analysis still processing. Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // Other error
        const errorText = await response.text();
        throw new Error(`GET failed: ${response.status} ${response.statusText} - ${errorText}`);
        
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`Failed to retrieve data after ${maxRetries} retries. Please try again or contact support.`);
        }
      }
    }
    
    throw new Error('Analysis creation failed after retries');
  } catch (error) {
    console.error('❌ [Road Safety] Create and retry failed:', error);
    console.warn('⚠️ [Road Safety] Falling back to mock data due to creation failure');
    // Return fallback data instead of throwing
    return generateFallbackRoadSafetyData(hazardTable, filters);
  }
}

/**
 * Process and cache API response data
 * @param apiData - Raw API response
 * @param hazardTable - Hazard table name
 * @param filters - Filters
 * @param cacheKey - Cache key
 * @returns Normalized road safety analysis data
 */
function processAndCacheRoadSafetyData(
  apiData: RoadSafetyAPIResponse,
  hazardTable: string,
  filters: RoadSafetyQueryFilters | undefined,
  cacheKey: string
): RoadSafetyAnalysisResponse {
  console.log('✅ [Road Safety] Analysis loaded successfully');
  console.log('   Analysis ID:', apiData.analysis_id);
  console.log('   Total Length:', apiData.data.metadata.total_length_km?.toFixed(2) || 'N/A', 'km');
  console.log('   Roads Count:', apiData.data.metadata.roads_count || 0);
  console.log('   Safety Rating Data:', apiData.data.by_safety_rating ? `${apiData.data.by_safety_rating.length} ratings` : 'Not available');

  // Validate required data fields
  if (!apiData.data.by_road || !Array.isArray(apiData.data.by_road)) {
    console.error('❌ Invalid data structure: by_road missing or invalid');
    throw new Error('Invalid API response: by_road is required');
  }

  // Log safety rating structure for debugging
  if (apiData.data.by_safety_rating && apiData.data.by_safety_rating.length > 0) {
    console.log('   Sample Safety Rating Entry:', apiData.data.by_safety_rating[0]);
  }

  // Normalize API response to match RoadSafetyAnalysisResponse
  const normalizedData: RoadSafetyAnalysisResponse = {
    analysis_id: apiData.analysis_id,
    analysis_name: apiData.analysis_name,
    hazard_table: apiData.hazard_table,
    ward_filter: filters?.ward && filters.ward !== 'all' ? parseInt(filters.ward.replace('ward_', ''), 10) : null,
    road_name_filter: filters?.road_name || null,
    vehicle_type_filter: filters?.vehicle_type || null,
    total_length_km: apiData.data.metadata.total_length_km,
    created_at: apiData.last_computed_at,
    
    // Transform by_road data (already in correct format, just normalize)
    by_road: apiData.data.by_road.map(road => ({
      road_name: road.road_name,
      total_km: road.total_km,
      ...road // Include all gridcode values
    })),
    
    by_gridcode: apiData.data.by_gridcode,
    by_safety_rating: apiData.data.by_safety_rating || [], // NEW: Include safety rating breakdown
    ward_breakdown: apiData.data.ward_breakdown || [],
    safety_scores: apiData.data.safety_scores || [],
    gridcode_colors: apiData.data.gridcode_colors,
    gridcode_types: apiData.data.gridcode_types,
    gridcodes: apiData.data.metadata.gridcodes,
    metadata: apiData.data.metadata,
  };

  // Cache the response
  roadSafetyCache.set(cacheKey, { data: normalizedData, timestamp: Date.now() });
  console.log('💾 Cached road safety data for', cacheKey);

  return normalizedData;
}

/**
 * Clear the road safety cache
 */
export function clearRoadSafetyCache(): void {
  roadSafetyCache.clear();
  console.log('🗑️ Road safety cache cleared');
}

/**
 * Generate fallback mock data when backend is unavailable
 */
function generateFallbackRoadSafetyData(
  hazardTable: string,
  filters: RoadSafetyQueryFilters | undefined
): RoadSafetyAnalysisResponse {
  // Silent fallback - UI will show the warning banner
  
  // Mock gridcodes (iRAP star ratings: 1-5)
  const gridcodes = [1, 2, 3, 4, 5];
  const gridcodeColors: Record<string, string> = {
    '1': '#262626',
    '2': '#e65336',
    '3': '#eda308',
    '4': '#fdf05e',
    '5': '#93c060',
  };
  const gridcodeTypes: Record<string, string> = {
    '1': '1 Star',
    '2': '2 Star',
    '3': '3 Star',
    '4': '4 Star',
    '5': '5 Star',
  };
  
  // Generate mock road data
  const mockRoads: RoadSafetyByRoad[] = [
    { road_name: 'NH-16', total_km: 45.2, '1': 5.1, '2': 8.4, '3': 15.2, '4': 12.3, '5': 4.2 },
    { road_name: 'SH-13', total_km: 32.8, '1': 3.8, '2': 6.2, '3': 11.4, '4': 8.9, '5': 2.5 },
    { road_name: 'Janpath Road', total_km: 28.4, '1': 3.2, '2': 5.4, '3': 9.8, '4': 7.6, '5': 2.4 },
    { road_name: 'Rasulgarh Road', total_km: 24.6, '1': 2.8, '2': 4.7, '3': 8.5, '4': 6.6, '5': 2.0 },
    { road_name: 'Unit-4 Road', total_km: 18.9, '1': 2.1, '2': 3.6, '3': 6.5, '4': 5.1, '5': 1.6 },
  ];
  
  const byGridcode: RoadSafetyByGridcode[] = gridcodes.map(code => ({
    gridcode: code,
    hazard_type: gridcodeTypes[code.toString()],
    color_code: gridcodeColors[code.toString()],
    length_km: mockRoads.reduce((sum, road) => sum + (Number(road[code.toString()]) || 0), 0),
  }));
  
  const totalLength = mockRoads.reduce((sum, road) => sum + road.total_km, 0);
  
  return {
    analysis_id: -1, // Negative ID indicates mock data
    analysis_name: `RoadSafety_${hazardTable}_FALLBACK`,
    hazard_table: hazardTable,
    ward_filter: filters?.ward && filters.ward !== 'all' ? parseInt(filters.ward.replace('ward_', ''), 10) : null,
    road_name_filter: filters?.road_name || null,
    vehicle_type_filter: filters?.vehicle_type || null,
    total_length_km: totalLength,
    created_at: new Date().toISOString(),
    by_gridcode: byGridcode,
    by_road: mockRoads,
    by_safety_rating: [], // NEW: Include safety rating breakdown
    ward_breakdown: [],
    safety_scores: [],
    gridcode_colors: gridcodeColors,
    gridcode_types: gridcodeTypes,
    gridcodes: gridcodes,
    metadata: {
      total_length_km: totalLength,
      roads_count: mockRoads.length,
      gridcodes: gridcodes,
    },
  };
}