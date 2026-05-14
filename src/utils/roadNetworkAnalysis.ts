/**
 * Utility functions for fetching road network hazard overlay analysis from backend API
 */

import { getHazardTableFromLayerIdAndScenario } from './hazardMapping';
import { fetchWithTimeout } from './fetchWithTimeout';
import { getHazardInfo } from './legendLoader';

const API_BASE_URL = 'https://geo-view-x-backend-0-1-gvdsbcb9d5cghqdw.centralindia-01.azurewebsites.net/';
const API_USERNAME = 'admin';
const API_PASSWORD = 'vYLnb)VEhhX7y8+Gbr+CnCUe';
const REQUEST_TIMEOUT = 300000; // 300 seconds (5 minutes) - increased for complex spatial analysis (PostGIS operations on large datasets)
const REQUEST_TIMEOUT_WITH_WARD = 120000; // 120 seconds (2 minutes) - faster when filtering by ward

// Generate Basic Auth header
const getAuthHeader = (): string => {
  const credentials = btoa(`${API_USERNAME}:${API_PASSWORD}`);
  return `Basic ${credentials}`;
};

// Response interfaces matching NEW API structure
export interface RoadNetworkByGridcode {
  gridcode: number;
  gridcode_type: string;
  length_km: number;
  color_code: string;
}

export interface RoadNetworkByRoadType {
  road_type: string;
  total_km: number;
  [key: string]: number | string; // Dynamic gridcode properties
}

export interface WardBreakdown {
  ward: string;
  ward_name: string;
  total_length_km: number;
  by_gridcode: Record<string, number>;
}

export interface RoadNetworkMetadata {
  total_length_km: number;
  total_rows: number;
  categories_count: number;
  wards_count: number;
  gridcodes: number[];
}

// NEW: Backend API raw response structure
interface RoadNetworkAPIResponse {
  analysis_id: number;
  analysis_name: string;
  hazard_table: string;
  last_computed_at: string;
  data: {
    id: number;
    name: string;
    description: string;
    geo_database: string;
    road_table: string;
    hazard_table: string;
    last_computed_at: string;
    analysis_type: string;
    chart_data: Array<{
      category: string;
      total: number;
      [key: string]: number | string; // Dynamic gridcode columns
    }>;
    gridcode_types: Record<string, string>;
    gridcode_colors: Record<string, string>;
    ward_breakdown: WardBreakdown[];
    metadata: RoadNetworkMetadata;
  };
}

// Normalized response for consumption by components
export interface RoadNetworkAnalysisResponse {
  analysis_id: number;
  analysis_name: string;
  hazard_table: string;
  ward_filter: number | null;
  total_length_km: number;
  created_at: string;
  by_gridcode: RoadNetworkByGridcode[];
  by_road_type: RoadNetworkByRoadType[];
  gridcode_colors: Record<string, string>;
  gridcode_types: Record<string, string>;
  gridcodes: number[];
  ward_breakdown?: WardBreakdown[];
  metadata?: RoadNetworkMetadata;
}

// Cache for API responses (5 minute TTL)
const roadNetworkCache = new Map<string, { data: RoadNetworkAnalysisResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch road network hazard overlay analysis
 * @param hazardTable - Hazard layer table name (e.g., 'AST_2025', 'HHI_2025')
 * @param wardId - Optional ward ID (e.g., 'ward_5') or 'all'
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Road network analysis data
 */
export async function fetchRoadNetworkAnalysis(
  hazardTable: string,
  wardId?: string,
  signal?: AbortSignal
): Promise<RoadNetworkAnalysisResponse> {
  // Generate cache key
  const wardFilter = wardId && wardId !== 'all' ? wardId : 'all';
  const cacheKey = `${hazardTable}|${wardFilter}`;

  // Check cache
  const cached = roadNetworkCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('✅ Using cached road network data for', cacheKey);
    return cached.data;
  }

  // Build URL
  let url = `${API_BASE_URL}analysis/overlay/hazard/${hazardTable}/chart-data`;
  
  // Add ward parameter if specified
  if (wardId && wardId !== 'all') {
    const wardNumber = wardId.replace('ward_', '');
    url += `?ward=${wardNumber}`;
  }

  console.log('🔍 [Road Network] Fetching from:', url);
  console.log(`⏱️  [Road Network] Request timeout: ${REQUEST_TIMEOUT / 1000}s (${REQUEST_TIMEOUT}ms)`);

  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      timeout: wardId && wardId !== 'all' ? REQUEST_TIMEOUT_WITH_WARD : REQUEST_TIMEOUT,
      signal: signal,
    });

    console.log('📡 [Road Network] Response status:', response.status);

    // SUCCESS: Analysis exists
    if (response.ok) {
      const apiData: RoadNetworkAPIResponse = await response.json();
      console.log('✅ [Road Network] Data received successfully');
      return processAndCacheData(apiData, hazardTable, wardId, cacheKey);
    }

    // EXPECTED: Analysis doesn't exist yet (404)
    if (response.status === 404) {
      console.log('⚠️ [Road Network] Analysis not found. Creating...');
      return await createAndRetryRoadNetworkAnalysis(hazardTable, wardId, cacheKey);
    }

    // ERROR: Other status codes
    const errorText = await response.text();
    console.error('❌ [Road Network] API Error Response:', errorText);
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);

  } catch (error) {
    // Propagate error to UI - no silent fallback
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    // Add helpful context for different error types
    if (errorMsg.includes('timeout')) {
      console.debug(`[Road Network] Request timed out after ${REQUEST_TIMEOUT / 1000}s - Backend may be processing large dataset`);
      throw new Error(`Request timeout after ${REQUEST_TIMEOUT / 1000}s: The backend is processing a large road network dataset. This analysis typically takes 2-3 minutes on first request. Please try again or select a specific ward to reduce processing time.`);
    }
    
    // Handle generic "Failed to fetch" errors (CORS, network, etc.)
    if (errorMsg === 'Failed to fetch') {
      console.debug('[Road Network] Backend API unavailable - Road network analysis will be skipped');
      throw new Error('Network error: Unable to connect to backend API. Please check your internet connection or contact support if the issue persists.');
    }
    
    console.debug('[Road Network] Request failed:', error);
    throw error;
  }
}

/**
 * Create a new road network analysis
 * @param hazardTable - Hazard table name
 * @returns Created analysis response
 */
async function createRoadNetworkAnalysis(hazardTable: string): Promise<{ id: number }> {
  const createUrl = `${API_BASE_URL}analysis/overlay`;
  
  const body = {
    name: `RoadNetwork_${hazardTable}`,
    geo_database: 'bohol',
    road_table: 'Road_Network',
    hazard_table: hazardTable,
    description: 'Road Network overlay analysis'
  };

  console.log('📝 [Road Network] Creating analysis with body:', body);

  try {
    const response = await fetchWithTimeout(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      mode: 'cors',
      timeout: REQUEST_TIMEOUT,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Road Network] POST failed:', errorText);
      throw new Error(`POST failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const created = await response.json();
    console.log(`✅ [Road Network] Analysis created with ID: ${created.id}`);
    return created;
  } catch (error) {
    console.error('❌ [Road Network] POST error:', error);
    throw error;
  }
}

/**
 * Create analysis and retry GET with exponential backoff
 * @param hazardTable - Hazard table name
 * @param wardId - Optional ward ID
 * @param cacheKey - Cache key for storing result
 * @param maxRetries - Maximum number of retry attempts (default: 5)
 * @returns Road network analysis data
 */
async function createAndRetryRoadNetworkAnalysis(
  hazardTable: string,
  wardId: string | undefined,
  cacheKey: string,
  maxRetries: number = 5
): Promise<RoadNetworkAnalysisResponse> {
  // Step 1: Create the analysis
  const created = await createRoadNetworkAnalysis(hazardTable);
  console.log(`⏳ [Road Network] Analysis created with ID ${created.id}. Waiting for computation...`);
  
  // Step 2: Wait for backend to process (8 seconds initial wait for PostGIS spatial analysis)
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  // Step 3: Retry GET with exponential backoff (5s, 8s, 12s, 18s, 25s)
  const retryIntervals = [5000, 8000, 12000, 18000, 25000]; // Total: 68 seconds + initial 8s = 76s
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Build URL
    let url = `${API_BASE_URL}analysis/overlay/hazard/${hazardTable}/chart-data`;
    
    if (wardId && wardId !== 'all') {
      const wardNumber = wardId.replace('ward_', '');
      url += `?ward=${wardNumber}`;
    }

    console.log(`🔄 [Road Network] Retry attempt ${attempt}/${maxRetries}...`);
    console.log(`⏱️  [Road Network] Using ${REQUEST_TIMEOUT / 1000}s timeout for this retry`);
    
    try {
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        timeout: wardId && wardId !== 'all' ? REQUEST_TIMEOUT_WITH_WARD : REQUEST_TIMEOUT,
      });
      
      if (response.ok) {
        console.log(`✅ [Road Network] Data retrieved successfully on attempt ${attempt}`);
        const apiData: RoadNetworkAPIResponse = await response.json();
        return processAndCacheData(apiData, hazardTable, wardId, cacheKey);
      }
      
      // Still processing (404) or processing (202)
      if ((response.status === 404 || response.status === 202) && attempt < maxRetries) {
        const waitTime = retryIntervals[attempt - 1] || 5000;
        console.log(`⏳ [Road Network] Analysis still processing. Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // Other error
      const errorText = await response.text();
      throw new Error(`Request failed: ${response.status} ${response.statusText} - ${errorText}`);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      // If timeout and not final attempt, retry
      if (errorMsg.includes('timeout') && attempt < maxRetries) {
        const waitTime = retryIntervals[attempt - 1] || 5000;
        console.log(`⏳ [Road Network] Request timed out. Backend may be processing large dataset. Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (attempt === maxRetries) {
        // Final attempt failed - propagate error with helpful message
        if (errorMsg.includes('timeout')) {
          throw new Error(`Request timeout after ${REQUEST_TIMEOUT / 1000}s: The backend spatial analysis is processing a large dataset. This typically takes 2-3 minutes. Please wait and try again, or try selecting a specific ward to reduce processing time.`);
        }
        throw new Error(`Backend processing failed: Analysis created but data not ready after ${maxRetries} retries (${Math.round((Date.now() - Date.now()) / 1000)}s). ${errorMsg}`);
      }
      // Continue to next retry for non-timeout errors
    }
  }
  
  throw new Error('Analysis creation failed after all retries');
}

/**
 * Process and cache API response data
 * Uses centralized legend definitions instead of API-provided colors/types
 * @param apiData - Raw API response
 * @param hazardTable - Hazard table name
 * @param wardId - Ward ID
 * @param cacheKey - Cache key
 * @returns Normalized road network analysis data
 */
function processAndCacheData(
  apiData: RoadNetworkAPIResponse,
  hazardTable: string,
  wardId: string | undefined,
  cacheKey: string
): RoadNetworkAnalysisResponse {
  console.log('✅ [Road Network] Analysis loaded successfully');
  console.log('   Analysis ID:', apiData.analysis_id);
  console.log('   Total Length:', apiData.data.metadata.total_length_km?.toFixed(2) || 'N/A', 'km');
  console.log('   Gridcode Levels:', apiData.data.metadata.gridcodes?.length || 0);

  // Validate required data fields
  if (!apiData.data.chart_data || !Array.isArray(apiData.data.chart_data)) {
    console.error('❌ Invalid data structure: chart_data missing or invalid');
    throw new Error('Invalid API response: chart_data is required');
  }

  // Build gridcode_colors and gridcode_types from centralized legend definitions
  const gridcode_colors: Record<string, string> = {};
  const gridcode_types: Record<string, string> = {};
  
  apiData.data.metadata.gridcodes.forEach(gc => {
    const gcStr = String(gc);
    
    // Skip invalid gridcodes (0, -128, etc. are NoData/null values)
    if (gc === 0 || gc === -128 || gc < 0) {
      console.log(`⏭️ Skipping invalid gridcode ${gc} (NoData/null value)`);
      return;
    }
    
    // Try to get legend info, but don't let it break the entire flow
    try {
      const hazardInfo = getHazardInfo(hazardTable, gc);
      
      if (hazardInfo) {
        gridcode_colors[gcStr] = hazardInfo.color;
        gridcode_types[gcStr] = hazardInfo.label.trim(); // Use label from legend definitions
        console.log(`✅ Mapped gridcode ${gc} to color ${hazardInfo.color} and label "${hazardInfo.label.trim()}"`);
      } else {
        // Fallback to API-provided values or defaults
        gridcode_colors[gcStr] = apiData.data.gridcode_colors?.[gcStr] || '#ccc';
        gridcode_types[gcStr] = apiData.data.gridcode_types?.[gcStr] || `Level ${gc}`;
        console.warn(`⚠️ No legend entry found for ${hazardTable} gridcode ${gc}, using fallback`);
      }
    } catch (error) {
      // If legend lookup fails, fall back to API values
      console.error(`❌ Error looking up legend for ${hazardTable} gridcode ${gc}:`, error);
      gridcode_colors[gcStr] = apiData.data.gridcode_colors?.[gcStr] || '#ccc';
      gridcode_types[gcStr] = apiData.data.gridcode_types?.[gcStr] || `Level ${gc}`;
    }
  });

  // Normalize API response to match RoadNetworkAnalysisResponse
  const normalizedData: RoadNetworkAnalysisResponse = {
    analysis_id: apiData.analysis_id,
    analysis_name: apiData.analysis_name,
    hazard_table: apiData.hazard_table,
    ward_filter: wardId && wardId !== 'all' ? parseInt(wardId.replace('ward_', ''), 10) : null,
    total_length_km: apiData.data.metadata.total_length_km,
    created_at: apiData.last_computed_at,
    
    // Transform chart_data to by_road_type format
    // chart_data has: { category: "Link Road", total: 1782.5, "0": 0.0057, "1": 319.4, ... }
    // We need: { road_type: "Link Road", total_km: 1782.5, "0": 0.0057, "1": 319.4, ... }
    by_road_type: apiData.data.chart_data.map(item => {
      const { category, total, ...gridcodeValues } = item;
      return {
        road_type: category,
        total_km: total,
        ...gridcodeValues,
      };
    }),
    
    // Build by_gridcode array using centralized legend definitions
    by_gridcode: apiData.data.metadata.gridcodes.map(gc => {
      const gcStr = String(gc);
      // Sum up all lengths for this gridcode across all road types
      const length_km = apiData.data.chart_data.reduce((sum, item) => {
        const value = item[gcStr];
        return sum + (typeof value === 'number' ? value : 0);
      }, 0);
      
      return {
        gridcode: gc,
        gridcode_type: gridcode_types[gcStr],
        length_km: length_km,
        color_code: gridcode_colors[gcStr],
      };
    }),
    
    // Use centrally-defined colors and types instead of API values
    gridcode_colors: gridcode_colors,
    gridcode_types: gridcode_types,
    gridcodes: apiData.data.metadata.gridcodes,
    ward_breakdown: apiData.data.ward_breakdown,
    metadata: apiData.data.metadata,
  };

  // Cache the response
  roadNetworkCache.set(cacheKey, { data: normalizedData, timestamp: Date.now() });
  console.log('💾 [Road Network] Cached data for', cacheKey);

  return normalizedData;
}

/**
 * Clear the road network cache
 */
export function clearRoadNetworkCache(): void {
  roadNetworkCache.clear();
  console.log('🗑️ Road network cache cleared');
}