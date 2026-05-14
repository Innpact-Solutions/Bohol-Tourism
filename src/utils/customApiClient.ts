/**
 * Custom REST API Client for fetching aggregated tabular data
 * 
 * This module demonstrates calling custom HTTP endpoints that return
 * pure JSON (no GeoJSON/geometry) for dynamic bar charts.
 */

/**
 * Configuration
 * Replace with your actual API base URL
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bohol-cwis-api.azurewebsites.net';

/**
 * Response types for custom API endpoints
 */
export interface RoadHazardLengthResponse {
  hazard: string;
  ward: number | null;
  rows: Array<{
    road_type: string;
    gridcode: number;
    length_km: number;
  }>;
}

export interface InfrastructureCountResponse {
  hazard: string;
  ward: number | null;
  infrastructure_type: string;
  rows: Array<{
    subtype: string;
    gridcode: number;
    count: number;
  }>;
}

/**
 * Generic API request helper with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  console.log(`🔌 API Request: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Response received:`, data);
    
    return data as T;
    
  } catch (error) {
    console.error(`❌ API Request failed for ${url}:`, error);
    throw error;
  }
}

/**
 * Fetch road hazard length data
 * 
 * @param hazard - Hazard field name (e.g., 'AST_2025', 'HHI_SSP1_2040')
 * @param ward - Ward number (27, 28, etc.) or null for all wards
 * @returns Aggregated road length data by road type and gridcode
 */
export async function fetchRoadHazardLength(
  hazard: string,
  ward: number | null = null
): Promise<RoadHazardLengthResponse> {
  const params = new URLSearchParams({ hazard });
  if (ward !== null) {
    params.append('ward', ward.toString());
  }
  
  const endpoint = `/api/road-hazard-length?${params.toString()}`;
  return apiRequest<RoadHazardLengthResponse>(endpoint);
}

/**
 * Fetch infrastructure count data by hazard exposure
 * 
 * @param infrastructureType - Type: 'educational', 'healthcare', 'public_amenities', 'transport_mobility'
 * @param hazard - Hazard field name
 * @param ward - Ward number or null for all wards
 * @returns Infrastructure counts by subtype and gridcode
 */
export async function fetchInfrastructureCount(
  infrastructureType: string,
  hazard: string,
  ward: number | null = null
): Promise<InfrastructureCountResponse> {
  const params = new URLSearchParams({
    infrastructure_type: infrastructureType,
    hazard: hazard,
  });
  if (ward !== null) {
    params.append('ward', ward.toString());
  }
  
  const endpoint = `/api/infrastructure-count?${params.toString()}`;
  return apiRequest<InfrastructureCountResponse>(endpoint);
}

/**
 * Parameter-based request cache with automatic revalidation
 * 
 * Supports:
 * - Caching by parameter combinations (hazard, ward, etc.)
 * - TTL-based expiration (default 5 minutes)
 * - Manual cache invalidation
 */
export class ApiCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number; // Time to live in milliseconds
  
  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000;
  }
  
  /**
   * Generate cache key from parameters
   */
  private getCacheKey(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return sortedParams;
  }
  
  /**
   * Get cached data if valid
   */
  get(params: Record<string, any>): T | null {
    const key = this.getCacheKey(params);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    const age = Date.now() - cached.timestamp;
    if (age > this.ttl) {
      console.log(`🗑️ Cache expired for ${key}`);
      this.cache.delete(key);
      return null;
    }
    
    console.log(`✅ Cache hit for ${key} (age: ${Math.round(age / 1000)}s)`);
    return cached.data;
  }
  
  /**
   * Set cache data
   */
  set(params: Record<string, any>, data: T): void {
    const key = this.getCacheKey(params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    console.log(`💾 Cached data for ${key}`);
  }
  
  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    console.log(`🗑️ Cache cleared`);
  }
  
  /**
   * Clear cache for specific parameters
   */
  invalidate(params: Record<string, any>): void {
    const key = this.getCacheKey(params);
    this.cache.delete(key);
    console.log(`🗑️ Invalidated cache for ${key}`);
  }
}

/**
 * Cached API client for road hazard length data
 */
export class RoadHazardLengthClient {
  private cache = new ApiCache<RoadHazardLengthResponse>(5);
  
  async fetch(hazard: string, ward: number | null = null): Promise<RoadHazardLengthResponse> {
    const params = { hazard, ward };
    
    // Check cache first
    const cached = this.cache.get(params);
    if (cached) {
      return cached;
    }
    
    // Fetch from API
    const data = await fetchRoadHazardLength(hazard, ward);
    
    // Cache the result
    this.cache.set(params, data);
    
    return data;
  }
  
  clearCache(): void {
    this.cache.clear();
  }
  
  invalidate(hazard: string, ward: number | null = null): void {
    this.cache.invalidate({ hazard, ward });
  }
}

/**
 * Global client instances for easy reuse
 */
export const roadHazardLengthClient = new RoadHazardLengthClient();

/**
 * Transform API response to chart-ready format
 * 
 * Converts flat rows into grouped structure for stacked bar charts
 */
export interface ChartRow {
  category: string;      // e.g., "NH", "SH" (road type or subtype)
  segments: Array<{
    gridcode: number;
    value: number;        // length_km or count
    color: string;
    label: string;        // e.g., "Low", "Moderate", "High"
  }>;
  total: number;
}

export function transformToChartData(
  rows: Array<{ road_type?: string; subtype?: string; gridcode: number; length_km?: number; count?: number }>,
  legendColors: Record<number, string>,
  legendLabels: Record<number, string>
): ChartRow[] {
  // Group by road_type or subtype
  const grouped = new Map<string, Map<number, number>>();
  
  rows.forEach(row => {
    const category = row.road_type || row.subtype || 'Unknown';
    const gridcode = row.gridcode;
    const value = row.length_km || row.count || 0;
    
    if (!grouped.has(category)) {
      grouped.set(category, new Map());
    }
    
    const categoryMap = grouped.get(category)!;
    const currentValue = categoryMap.get(gridcode) || 0;
    categoryMap.set(gridcode, currentValue + value);
  });
  
  // Transform to chart format
  const chartData: ChartRow[] = [];
  
  grouped.forEach((gridcodeMap, category) => {
    const segments = Array.from(gridcodeMap.entries())
      .map(([gridcode, value]) => ({
        gridcode,
        value,
        color: legendColors[gridcode] || '#94A3B8',
        label: legendLabels[gridcode] || `Level ${gridcode}`,
      }))
      .sort((a, b) => a.gridcode - b.gridcode);
    
    const total = segments.reduce((sum, seg) => sum + seg.value, 0);
    
    chartData.push({
      category,
      segments,
      total,
    });
  });
  
  // Sort by total descending
  chartData.sort((a, b) => b.total - a.total);
  
  return chartData;
}
