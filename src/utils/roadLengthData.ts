/**
 * Utility functions for fetching road length data aggregated by hazard exposure
 * from GeoServer PostGIS tables
 */

const GEOSERVER_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/GIZ_BBSR/ows';

/**
 * Response format for road length data
 */
export interface RoadLengthData {
  road_type: string;
  gridcode: number;
  length_km: number;
}

/**
 * Aggregated chart data structure
 */
export interface RoadLengthChartRow {
  roadType: string;
  segments: Array<{
    gridcode: number;
    lengthKm: number;
    color: string;
  }>;
  totalLength: number;
}

/**
 * Fetch road length data from GeoServer filtered by hazard and ward
 * 
 * @param hazardName - Hazard field name (e.g., 'AST_2025', 'HHI_SSP1_2040')
 * @param wardId - Ward identifier (e.g., 'ward_27' or 'all')
 * @param roadTableName - GeoServer layer name (e.g., 'GIZ_BBSR:Road_Network_Hazard')
 * @returns Array of road length records grouped by road_type and gridcode
 */
export async function fetchRoadLengthByHazard(
  hazardName: string,
  wardId: string = 'all',
  roadTableName: string = 'GIZ_BBSR:Road_Network_Hazard'
): Promise<RoadLengthData[]> {
  try {
    console.log(`📊 Fetching road length data for hazard: ${hazardName}, ward: ${wardId}`);
    
    // Build WFS request
    const url = new URL(GEOSERVER_WFS_URL);
    url.searchParams.set('service', 'WFS');
    url.searchParams.set('version', '2.0.0');
    url.searchParams.set('request', 'GetFeature');
    url.searchParams.set('typeName', roadTableName);
    
    // Request specific fields: road_type, hazard gridcode, length
    url.searchParams.set('propertyName', `road_type,${hazardName},length_m`);
    url.searchParams.set('outputFormat', 'application/json');
    
    // Add ward filter if not 'all'
    if (wardId && wardId !== 'all') {
      const wardNumber = parseInt(wardId.split('_')[1]);
      if (!isNaN(wardNumber)) {
        // CQL filter to filter by ward
        url.searchParams.set('CQL_FILTER', `Ward=${wardNumber}`);
        console.log(`🗺️ Filtering by Ward ${wardNumber}`);
      }
    }
    
    console.log(`🔍 Request URL: ${url.toString()}`);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ WFS request failed:`, errorText);
      throw new Error(`Failed to fetch road length data: ${response.statusText}`);
    }
    
    const data = await response.json();
    const features = data.features || [];
    
    console.log(`✅ Fetched ${features.length} road features`);
    
    // Aggregate data: group by road_type and gridcode, sum lengths
    const aggregated = aggregateRoadLengths(features, hazardName);
    
    return aggregated;
    
  } catch (error) {
    console.error(`❌ Error fetching road length data:`, error);
    return [];
  }
}

/**
 * Aggregate road lengths by road_type and hazard gridcode
 * Converts meters to kilometers
 */
function aggregateRoadLengths(
  features: any[],
  hazardFieldName: string
): RoadLengthData[] {
  // Group by road_type and gridcode
  const grouped: Record<string, Record<number, number>> = {};
  
  features.forEach(feature => {
    const props = feature.properties;
    const roadType = props.road_type || 'Unknown';
    const gridcode = props[hazardFieldName]; // Get gridcode from hazard field
    const lengthMeters = props.length_m || 0;
    
    // Skip if no valid gridcode
    if (gridcode === null || gridcode === undefined) {
      return;
    }
    
    // Initialize road type group
    if (!grouped[roadType]) {
      grouped[roadType] = {};
    }
    
    // Accumulate length
    if (!grouped[roadType][gridcode]) {
      grouped[roadType][gridcode] = 0;
    }
    grouped[roadType][gridcode] += lengthMeters;
  });
  
  // Convert to array format and meters to km
  const result: RoadLengthData[] = [];
  
  Object.keys(grouped).forEach(roadType => {
    Object.keys(grouped[roadType]).forEach(gridcodeStr => {
      const gridcode = parseInt(gridcodeStr);
      const lengthMeters = grouped[roadType][gridcode];
      const lengthKm = lengthMeters / 1000; // Convert to km
      
      result.push({
        road_type: roadType,
        gridcode: gridcode,
        length_km: Math.round(lengthKm * 100) / 100 // Round to 2 decimal places
      });
    });
  });
  
  console.log(`📊 Aggregated data:`, result);
  return result;
}

/**
 * Transform raw data into chart-ready format with colors from legend
 * 
 * @param rawData - Array of RoadLengthData from fetchRoadLengthByHazard
 * @param legendColors - Map of gridcode -> color hex code
 * @returns Chart rows ready for visualization
 */
export function buildRoadLengthChartData(
  rawData: RoadLengthData[],
  legendColors: Record<number, string>
): RoadLengthChartRow[] {
  // Group by road_type
  const grouped: Record<string, RoadLengthChartRow> = {};
  
  rawData.forEach(item => {
    if (!grouped[item.road_type]) {
      grouped[item.road_type] = {
        roadType: item.road_type,
        segments: [],
        totalLength: 0
      };
    }
    
    const color = legendColors[item.gridcode] || '#94A3B8'; // Default gray if no color
    
    grouped[item.road_type].segments.push({
      gridcode: item.gridcode,
      lengthKm: item.length_km,
      color: color
    });
    
    grouped[item.road_type].totalLength += item.length_km;
  });
  
  // Convert to array and sort segments by gridcode
  const chartData = Object.values(grouped);
  chartData.forEach(row => {
    row.segments.sort((a, b) => a.gridcode - b.gridcode);
  });
  
  return chartData;
}

/**
 * Cache for road length data to avoid redundant requests
 */
class RoadLengthCache {
  private cache: Map<string, RoadLengthData[]> = new Map();
  
  getCacheKey(hazardName: string, wardId: string): string {
    return `${hazardName}::${wardId}`;
  }
  
  get(hazardName: string, wardId: string): RoadLengthData[] | null {
    const key = this.getCacheKey(hazardName, wardId);
    return this.cache.get(key) || null;
  }
  
  set(hazardName: string, wardId: string, data: RoadLengthData[]): void {
    const key = this.getCacheKey(hazardName, wardId);
    this.cache.set(key, data);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const roadLengthCache = new RoadLengthCache();
