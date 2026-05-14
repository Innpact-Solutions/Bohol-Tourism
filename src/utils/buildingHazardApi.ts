/**
 * Building Hazard Aggregation API
 * Fetches building counts by hazard severity levels
 */

const API_BASE = 'https://geo-view-x-backend-0-1-gvdsbcb9d5cghqdw.centralindia-01.azurewebsites.net/analysis/building-hazard';

/**
 * Get authentication headers
 */
function getAuthHeaders(): HeadersInit {
  const username = 'admin';
  const password = 'vYLnb)VEhhX7y8+Gbr+CnCUe';
  const credentials = btoa(`${username}:${password}`);
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${credentials}`
  };
}

/**
 * Gridcode bracket data
 */
export interface GridcodeBracket {
  gridcode: number;
  type: string;
  color_code: string;
  building_count: number;
}

/**
 * Ward breakdown data
 */
export interface WardBreakdown {
  ward: string;
  gridcode_counts: Record<number, number>;
  total_count: number;
}

/**
 * Building hazard response
 */
export interface BuildingHazardResponse {
  hazard_table: string;
  building_table: string;
  geo_database: string;
  total_buildings: number;
  by_gridcode: GridcodeBracket[];
  gridcode_types: Record<number, string>;
  gridcode_colors: Record<number, string>;
  ward_filter: string | null;
  ward_breakdown?: WardBreakdown[];
}

/**
 * Bulk response for multiple hazard layers
 */
export interface BulkBuildingHazardResponse {
  geo_database: string;
  building_table: string;
  ward_filter: string | null;
  hazard_tables_processed: number;
  results: Record<string, BuildingHazardResponse>;
}

/**
 * Fetch building hazard aggregation for a single hazard layer
 */
export async function getBuildingHazardData(
  geoDatabase: string,
  hazardTable: string,
  buildingTable: string = 'Buildings',
  ward?: string
): Promise<BuildingHazardResponse> {
  const requestBody = {
    geo_database: geoDatabase,
    hazard_table: hazardTable,
    building_table: buildingTable,
    ward: ward || null
  };

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      // Silently fail - log as warning instead of error
      console.warn('⚠️ [Building Hazard API] HTTP Error:', response.status, errorText);
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [Building Hazard API] Data received:', data);
    
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Silently fail - API timeout (no console output to avoid error spam)
      throw new Error('Request timeout - API is taking too long to respond');
    }
    
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      // Silently fail - Network error (no console output to avoid error spam)
      throw new Error('Network error - Unable to connect to the API server');
    }
    
    throw error;
  }
}

/**
 * Fetch building hazard aggregation for multiple hazard layers (bulk)
 */
export async function getBulkBuildingHazardData(
  geoDatabase: string,
  hazardTables: string[],
  buildingTable: string = 'Buildings',
  ward?: string
): Promise<BulkBuildingHazardResponse> {
  const requestBody = {
    geo_database: geoDatabase,
    hazard_tables: hazardTables,
    building_table: buildingTable,
    ward: ward || null
  };

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(`${API_BASE}/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      // Silently fail - log as warning instead of error
      console.warn('⚠️ [Building Hazard API - Bulk] HTTP Error:', response.status, errorText);
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [Building Hazard API - Bulk] Data received:', data);
    
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Silently fail - API timeout (no console output to avoid error spam)
      throw new Error('Request timeout - API is taking too long to respond');
    }
    
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      // Silently fail - Network error (no console output to avoid error spam)
      throw new Error('Network error - Unable to connect to the API server');
    }
    
    throw error;
  }
}