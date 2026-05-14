/**
 * Hazard KPI API Integration
 * Handles fetching and creating KPI data for hazard layers
 */

const API_BASE = 'https://geo-view-x-backend-0-1-gvdsbcb9d5cghqdw.centralindia-01.azurewebsites.net/analysis/hazard-kpi';
const AUTH_USERNAME = 'admin';
const AUTH_PASSWORD = 'vYLnb)VEhhX7y8+Gbr+CnCUe';

// Create HTTP Basic Auth header
const getAuthHeaders = () => {
  const auth = btoa(`${AUTH_USERNAME}:${AUTH_PASSWORD}`);
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`
  };
};

export interface KPIData {
  id: number;
  name: string;
  description?: string;
  geo_database: string;
  hazard_type: string;
  parameter: string;
  hazard_table: string;
  source_tables: string[] | null;
  threshold_gridcodes: number[];
  value: number;
  value_unit: string;
  percentage: number;
  total_hazard_area: number;
  ward?: string | null;
  ward_breakdown?: Array<{
    ward: string;
    value: number;
    percentage: number;
  }> | null;
  created_at: string;
  updated_at?: string | null;
  last_computed_at: string;
}

export interface BulkKPIResponse {
  created: KPIData[];
  total_count: number;
  hazard_type: string;
}

/**
 * Fetch all KPIs with optional filters
 */
export async function fetchKPIs(params?: {
  hazard_type?: string;
  parameter?: string;
  geo_database?: string;
  skip?: number;
  limit?: number;
}): Promise<KPIData[]> {
  const queryParams = new URLSearchParams();
  if (params?.hazard_type) queryParams.append('hazard_type', params.hazard_type);
  if (params?.parameter) queryParams.append('parameter', params.parameter);
  if (params?.geo_database) queryParams.append('geo_database', params.geo_database);
  if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
  if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());

  const url = queryParams.toString() ? `${API_BASE}?${queryParams}` : API_BASE;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch KPIs: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('KPI fetch timeout - returning empty array');
      return []; // Return empty array instead of throwing
    }
    // Suppress network errors in console - return empty array gracefully
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return []; // Network error - return empty array
    }
    throw error;
  }
}

/**
 * Get KPI data for a specific KPI ID with optional ward filtering
 */
export async function getKPIData(kpiId: number, ward?: string): Promise<KPIData> {
  const url = ward 
    ? `${API_BASE}/${kpiId}/data?ward=${ward}`
    : `${API_BASE}/${kpiId}/data`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to get KPI data: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('KPI data fetch timeout');
      // Return a placeholder KPI data object
      throw new Error('Data temporarily unavailable');
    }
    throw error;
  }
}

/**
 * Create bulk KPIs for a hazard layer
 */
export async function createBulkKPIs(params: {
  name_prefix: string;
  description?: string;
  geo_database: string;
  hazard_type: string;
  hazard_table: string;
  threshold: number[];
}): Promise<BulkKPIResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout for bulk creation
  
  try {
    const response = await fetch(`${API_BASE}/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...params,
        tables: {
          building: 'Buildings',
          infra: ['Health', 'Education', 'Transport', 'Public'],
          road_network: 'Road_Network'
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(`Failed to create KPIs: ${errorData.detail || response.statusText}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Bulk KPI creation timeout');
      throw new Error('KPI creation timed out - please try again later');
    }
    throw error;
  }
}

/**
 * Find KPI by name
 */
export async function findKPIByName(name: string, geoDatabase: string = 'bbsr'): Promise<KPIData | null> {
  const allKPIs = await fetchKPIs({ geo_database: geoDatabase, limit: 1000 });
  return allKPIs.find(kpi => kpi.name === name) || null;
}

/**
 * Get or create KPIs for a hazard layer
 * Returns the 4 KPI parameters: coverage, building, infra, road-network
 */
export async function getOrCreateKPIs(
  hazardTable: string,
  hazardType: string,
  threshold: number[],
  geoDatabase: string = 'bbsr'
): Promise<{
  coverage: KPIData;
  building: KPIData;
  infra: KPIData;
  roadNetwork: KPIData;
}> {
  const namePrefix = `${hazardTable}_Analysis`;

  // Try to fetch existing KPIs
  const existingKPIs = await fetchKPIs({ 
    hazard_type: hazardType,
    geo_database: geoDatabase,
    limit: 1000
  });

  const coverage = existingKPIs.find(kpi => 
    kpi.hazard_table === hazardTable && kpi.parameter === 'coverage'
  );
  const building = existingKPIs.find(kpi => 
    kpi.hazard_table === hazardTable && kpi.parameter === 'building'
  );
  const infra = existingKPIs.find(kpi => 
    kpi.hazard_table === hazardTable && kpi.parameter === 'infra'
  );
  const roadNetwork = existingKPIs.find(kpi => 
    kpi.hazard_table === hazardTable && kpi.parameter === 'road-network'
  );

  // If all exist, return them
  if (coverage && building && infra && roadNetwork) {
    return { coverage, building, infra, roadNetwork };
  }

  // Otherwise, create bulk KPIs
  console.log(`Creating KPIs for ${hazardTable}...`);
  const bulkResponse = await createBulkKPIs({
    name_prefix: namePrefix,
    description: `Hazard KPI analysis for ${hazardTable}`,
    geo_database: geoDatabase,
    hazard_type: hazardType,
    hazard_table: hazardTable,
    threshold
  });

  // Map the created KPIs to the return object
  const created = bulkResponse.created;
  return {
    coverage: created.find(kpi => kpi.parameter === 'coverage')!,
    building: created.find(kpi => kpi.parameter === 'building')!,
    infra: created.find(kpi => kpi.parameter === 'infra')!,
    roadNetwork: created.find(kpi => kpi.parameter === 'road-network')!
  };
}