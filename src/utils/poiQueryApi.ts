/**
 * POI Query API Client
 * 
 * Connects the Query Builder UI to the backend POI Query API
 * Base URL: https://geo-view-x-backend-0-1-gvdsbcb9d5cghqdw.centralindia-01.azurewebsites.net/
 * Authentication: HTTP Basic Auth
 */

const API_BASE_URL = 'https://geo-view-x-backend-0-1-gvdsbcb9d5cghqdw.centralindia-01.azurewebsites.net/';
const API_USERNAME = 'admin';
const API_PASSWORD = 'vYLnb)VEhhX7y8+Gbr+CnCUe';

// Create base64 encoded auth header
const AUTH_HEADER = 'Basic ' + btoa(`${API_USERNAME}:${API_PASSWORD}`);

// Request timeout (10 seconds)
const REQUEST_TIMEOUT = 10000;

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface POICategory {
  category: string;
  count: number;
}

export interface POIWard {
  ward: number;
  ward_name: string;
  poi_count: number;
}

export interface POIZone {
  zone: string;
  poi_count: number;
}

export interface HazardColumn {
  column_name: string;
  display_name: string;
  min_value: number;
  max_value: number;
  description: string;
}

export interface HazardFilter {
  column: string;
  min: number | null;
  max: number | null;
}

export interface POIQueryRequest {
  geo_database: string;
  poi_tables: string[];
  categories?: string[];
  subcategories?: string[];
  wards?: number[];
  zones?: string[];
  hazard_filters?: {
    heat_stress?: HazardFilter;
    air_quality?: HazardFilter;
    flood?: HazardFilter;
    multi_hazard?: HazardFilter;
  };
  limit?: number;
  offset?: number;
}

export interface POIQueryResult {
  poi_table: string;
  id: number;
  name: string;
  category: string;
  subcategory: string | null;
  ward: number;
  zone: string;
  sector: string;
  coordinates: {
    lon: number;
    lat: number;
  };
  hazards: {
    [key: string]: number | null;
  };
}

export interface POIQueryResponse {
  total_count: number;
  query_time_ms: number;
  filters_applied: POIQueryRequest;
  results: POIQueryResult[];
}

// ============================================================================
// Metadata API Calls
// ============================================================================

/**
 * Fetch available categories for a POI table
 */
export async function fetchPOICategories(
  geoDatabase: string = 'bbsr',
  poiTable: string
): Promise<POICategory[]> {
  const url = `${API_BASE_URL}query/poi/metadata/categories?geo_database=${geoDatabase}&poi_table=${poiTable}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      headers: {
        'Authorization': AUTH_HEADER,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.categories || [];
  } catch (error) {
    console.error('[POI Query API] Failed to fetch categories:', error);
    throw error;
  }
}

/**
 * Fetch available wards
 */
export async function fetchPOIWards(
  geoDatabase: string = 'bbsr',
  poiTable?: string
): Promise<POIWard[]> {
  let url = `${API_BASE_URL}query/poi/metadata/wards?geo_database=${geoDatabase}`;
  
  if (poiTable) {
    url += `&poi_table=${poiTable}`;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      headers: {
        'Authorization': AUTH_HEADER,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.wards || [];
  } catch (error) {
    console.error('[POI Query API] Failed to fetch wards:', error);
    throw error;
  }
}

/**
 * Fetch available zones
 */
export async function fetchPOIZones(
  geoDatabase: string = 'bbsr',
  poiTable?: string
): Promise<POIZone[]> {
  let url = `${API_BASE_URL}query/poi/metadata/zones?geo_database=${geoDatabase}`;
  
  if (poiTable) {
    url += `&poi_table=${poiTable}`;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      headers: {
        'Authorization': AUTH_HEADER,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.zones || [];
  } catch (error) {
    console.error('[POI Query API] Failed to fetch zones:', error);
    throw error;
  }
}

/**
 * Fetch available hazard columns for a POI table
 */
export async function fetchHazardColumns(
  geoDatabase: string = 'bbsr',
  poiTable: string
): Promise<HazardColumn[]> {
  const url = `${API_BASE_URL}query/poi/metadata/hazard-columns?geo_database=${geoDatabase}&poi_table=${poiTable}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      headers: {
        'Authorization': AUTH_HEADER,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.hazard_columns || [];
  } catch (error) {
    console.error('[POI Query API] Failed to fetch hazard columns:', error);
    throw error;
  }
}

// ============================================================================
// Main Query API Call
// ============================================================================

/**
 * Execute a POI spatial query
 */
export async function executePOIQuery(
  request: POIQueryRequest
): Promise<POIQueryResponse> {
  const url = `${API_BASE_URL}query/poi`;
  
  console.log('[POI Query API] Executing query:', request);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[POI Query API] Query successful:', {
      total_count: data.total_count,
      query_time_ms: data.query_time_ms,
    });
    
    return data;
  } catch (error) {
    console.error('[POI Query API] Query failed:', error);
    throw error;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map frontend infrastructure types to backend POI tables
 */
export function mapInfraTypeToPOITable(infraType: string): string {
  const mapping: { [key: string]: string } = {
    'educational': 'Education',
    'healthcare': 'Health',
    'public_amenities': 'Public',
    'transport_mobility': 'Transport',
    'road_network': 'Road_Network', // If available
    'road_safety': 'Road_Safety', // If available
  };
  
  return mapping[infraType] || infraType;
}

/**
 * Map frontend risk level to backend hazard value
 */
export function mapRiskLevelToValue(riskLevel: string): number | null {
  const mapping: { [key: string]: number } = {
    'Low': 1,
    'Moderate': 2,
    'High': 3,
    'Extreme': 4,
  };
  
  return mapping[riskLevel] || null;
}

/**
 * Map frontend hazard type to backend column name
 */
export function mapHazardTypeToColumn(hazardType: string, scenario: string = '2025'): string {
  const mapping: { [key: string]: string } = {
    'heat': `AST_${scenario}`,
    'air': 'Air_AQI',
    'flood': 'Flood_Hazard',
    'multi': 'Multi_Hazard_BBSR',
  };
  
  return mapping[hazardType] || hazardType;
}

/**
 * Map backend hazard value to frontend risk level label
 */
export function mapHazardValueToRiskLevel(value: number | null): string {
  if (value === null) return 'Unknown';
  
  if (value >= 4) return 'Extreme';
  if (value >= 3) return 'High';
  if (value >= 2) return 'Moderate';
  return 'Low';
}