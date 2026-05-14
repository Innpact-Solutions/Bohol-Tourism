/**
 * Impact Distribution Data Fetching and Aggregation
 * 
 * Fetches hazard legend colors and infrastructure point counts from GeoServer
 * to populate ImpactDistribution charts with real data.
 * 
 * ⚠️ DEPRECATED: Old GIZ_BBSR workspace removed - infrastructure impact analysis disabled until new Bohol layers connected
 */

// ⚠️ PLACEHOLDER: Update this URL when Bohol infrastructure hazard layers are available
const GEOSERVER_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows';

/**
 * Fetch hazard legend colors from a hazard polygon layer
 * Returns a map of gridcode -> color (hex format)
 */
export async function fetchHazardLegend(
  hazardLayerId: string
): Promise<Record<number, string>> {
  try {
    console.log(`🎨 Fetching hazard legend for ${hazardLayerId}...`);
    
    const url = new URL(GEOSERVER_WFS_URL);
    url.searchParams.set('service', 'WFS');
    url.searchParams.set('version', '2.0.0');
    url.searchParams.set('request', 'GetFeature');
    url.searchParams.set('typeName', hazardLayerId);
    url.searchParams.set('propertyName', 'gridcode,color_code');
    url.searchParams.set('outputFormat', 'application/json');
    url.searchParams.set('maxFeatures', '1000');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`WFS request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const features = data.features || [];

    // Build legend map: gridcode -> color
    const legendMap: Record<number, string> = {};
    
    features.forEach((feature: any) => {
      const gridcode = feature.properties?.gridcode;
      const colorCode = feature.properties?.color_code;
      
      if (gridcode !== null && gridcode !== undefined && colorCode) {
        // Ensure color has # prefix
        const color = colorCode.startsWith('#') ? colorCode : `#${colorCode}`;
        legendMap[gridcode] = color;
      }
    });

    console.log(`✅ Loaded ${Object.keys(legendMap).length} legend colors for ${hazardLayerId}:`, legendMap);
    return legendMap;
    
  } catch (error) {
    console.error(`❌ Failed to fetch hazard legend for ${hazardLayerId}:`, error);
    return {};
  }
}

/**
 * Fetch hazard legend labels (names/descriptions) from a hazard polygon layer
 * Returns a map of gridcode -> label
 */
export async function fetchHazardLegendLabels(
  hazardLayerId: string
): Promise<Record<number, string>> {
  try {
    console.log(`🏷️ Fetching hazard legend labels for ${hazardLayerId}...`);
    
    const url = new URL(GEOSERVER_WFS_URL);
    url.searchParams.set('service', 'WFS');
    url.searchParams.set('version', '2.0.0');
    url.searchParams.set('request', 'GetFeature');
    url.searchParams.set('typeName', hazardLayerId);
    // Fetch gridcode and Type field (the most common field name for hazard labels)
    url.searchParams.set('propertyName', 'gridcode,Type');
    url.searchParams.set('outputFormat', 'application/json');
    url.searchParams.set('maxFeatures', '1000');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`WFS request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const features = data.features || [];

    // Build label map: gridcode -> label
    const labelMap: Record<number, string> = {};
    
    features.forEach((feature: any) => {
      const gridcode = feature.properties?.gridcode;
      const label = feature.properties?.Type;
      
      if (gridcode !== null && gridcode !== undefined && label) {
        labelMap[gridcode] = String(label);
      }
    });

    console.log(`✅ Loaded ${Object.keys(labelMap).length} legend labels for ${hazardLayerId}:`, labelMap);
    return labelMap;
    
  } catch (error) {
    console.error(`❌ Failed to fetch hazard legend labels for ${hazardLayerId}:`, error);
    // Return empty map instead of throwing
    return {};
  }
}

/**
 * Map infrastructure type to GeoServer typeName
 */
function getInfraTypeName(infraKey: string): string {
  const typeNameMap: Record<string, string> = {
    'educational': 'GIZ_BBSR:Education',
    'healthcare': 'GIZ_BBSR:Health',
    'public_amenities': 'GIZ_BBSR:Public Amenities',
    'transport_mobility': 'GIZ_BBSR:Transport'
  };
  return typeNameMap[infraKey] || '';
}

/**
 * Fetch infrastructure point counts aggregated by subtype and hazard level
 * Returns counts[subtype][gridcode] = count
 */
export async function fetchInfrastructurePointCounts(
  infraKey: string,
  activeHazardKey: string,
  infraTypeField: string = 'Category',
  wardId?: string
): Promise<Record<string, Record<number, number>>> {
  try {
    const typeName = getInfraTypeName(infraKey);
    if (!typeName) {
      console.error(`❌ Unknown infrastructure key: ${infraKey}`);
      return {};
    }

    console.log(`📊 Fetching ${infraKey} counts with hazard field: ${activeHazardKey}...`);
    
    const url = new URL(GEOSERVER_WFS_URL);
    url.searchParams.set('service', 'WFS');
    url.searchParams.set('version', '2.0.0');
    url.searchParams.set('request', 'GetFeature');
    url.searchParams.set('typeName', typeName);
    // Request both the infrastructure category field AND the hazard field
    url.searchParams.set('propertyName', `${infraTypeField},${activeHazardKey}`);
    url.searchParams.set('outputFormat', 'application/json');
    
    // Add ward filter if specified
    if (wardId && wardId !== 'all') {
      // Extract ward number from "ward_3" format
      const wardNumber = parseInt(wardId.split('_')[1]);
      if (!isNaN(wardNumber)) {
        const cqlFilter = `Ward=${wardNumber}`;
        url.searchParams.set('cql_filter', cqlFilter);
      }
    }

    console.log(`🔍 Request URL: ${url.toString()}`);

    let response = await fetch(url.toString());
    let hasHazardField = true;
    
    // If Bad Request, the hazard field might not exist - try without it
    if (!response.ok && response.status === 400) {
      console.warn(`⚠️ Hazard field "${activeHazardKey}" not found in ${typeName}, fetching without hazard data...`);
      hasHazardField = false;
      
      // Retry without the hazard field
      const fallbackUrl = new URL(GEOSERVER_WFS_URL);
      fallbackUrl.searchParams.set('service', 'WFS');
      fallbackUrl.searchParams.set('version', '2.0.0');
      fallbackUrl.searchParams.set('request', 'GetFeature');
      fallbackUrl.searchParams.set('typeName', typeName);
      fallbackUrl.searchParams.set('propertyName', infraTypeField);
      fallbackUrl.searchParams.set('outputFormat', 'application/json');
      
      if (wardId && wardId !== 'all') {
        // Extract ward number from "ward_3" format
        const wardNumber = parseInt(wardId.split('_')[1]);
        if (!isNaN(wardNumber)) {
          const cqlFilter = `Ward=${wardNumber}`;
          fallbackUrl.searchParams.set('cql_filter', cqlFilter);
        }
      }
      
      response = await fetch(fallbackUrl.toString());
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ WFS Bad Request for ${infraKey}:`, errorText);
      throw new Error(`WFS request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const features = data.features || [];

    console.log(`📍 Loaded ${features.length} infrastructure points`);

    // Aggregate counts by subtype AND hazard gridcode
    const counts: Record<string, Record<number, number>> = {};
    
    features.forEach((feature: any) => {
      const subtype = feature.properties?.[infraTypeField];
      const hazardValue = feature.properties?.[activeHazardKey];
      
      if (subtype) {
        if (!counts[subtype]) {
          counts[subtype] = {};
        }
        
        if (hasHazardField && hazardValue !== null && hazardValue !== undefined) {
          // Use the hazard gridcode from the infrastructure point
          const gridcode = Number(hazardValue);
          if (!counts[subtype][gridcode]) {
            counts[subtype][gridcode] = 0;
          }
          counts[subtype][gridcode]++;
        } else if (!hasHazardField) {
          // No hazard field - use gridcode 0 as a placeholder
          if (!counts[subtype][0]) {
            counts[subtype][0] = 0;
          }
          counts[subtype][0]++;
        }
      }
    });

    if (!hasHazardField) {
      console.warn(`⚠️ No hazard breakdown available for ${infraKey} - showing total counts only`);
    }

    console.log(`✅ Aggregated counts for ${Object.keys(counts).length} subtypes with hazard breakdown:`, counts);
    return counts;
    
  } catch (error) {
    console.error(`❌ Failed to fetch infrastructure counts for ${infraKey}:`, error);
    return {};
  }
}

/**
 * Build chart row data from counts and legend
 */
export interface ChartSegment {
  gridcode: number;
  count: number;
  color: string;
}

export interface ChartRow {
  subtype: string;
  segments: ChartSegment[];
  total: number;
  icon?: any;
}

export function buildChartRows(
  subtypeList: Array<{ name: string; icon?: any }>,
  counts: Record<string, Record<number, number>>,
  legendMap: Record<number, string>
): ChartRow[] {
  const rows: ChartRow[] = [];

  subtypeList.forEach(({ name, icon }) => {
    const subtypeCounts = counts[name] || {};
    
    // Get all gridcodes for this subtype, sorted ascending
    const gridcodes = Object.keys(subtypeCounts)
      .map(Number)
      .sort((a, b) => a - b);
    
    // Build segments
    const segments: ChartSegment[] = gridcodes.map(gridcode => ({
      gridcode,
      count: subtypeCounts[gridcode],
      color: legendMap[gridcode] || '#9CA3AF' // Fallback to gray
    }));

    // Calculate total
    const total = segments.reduce((sum, seg) => sum + seg.count, 0);

    rows.push({
      subtype: name,
      segments,
      total,
      icon
    });
  });

  return rows;
}

/**
 * Simple in-memory cache for legend and count data
 */
class DataCache {
  private legendCache: Map<string, Record<number, string>> = new Map();
  private labelCache: Map<string, Record<number, string>> = new Map();
  private countsCache: Map<string, Record<string, Record<number, number>>> = new Map();

  getLegend(key: string): Record<number, string> | null {
    return this.legendCache.get(key) || null;
  }

  setLegend(key: string, data: Record<number, string>): void {
    this.legendCache.set(key, data);
  }

  getLabels(key: string): Record<number, string> | null {
    return this.labelCache.get(key) || null;
  }

  setLabels(key: string, data: Record<number, string>): void {
    this.labelCache.set(key, data);
  }

  getCounts(key: string): Record<string, Record<number, number>> | null {
    return this.countsCache.get(key) || null;
  }

  setCounts(key: string, data: Record<string, Record<number, number>>): void {
    this.countsCache.set(key, data);
  }

  clear(): void {
    this.legendCache.clear();
    this.labelCache.clear();
    this.countsCache.clear();
  }
}

export const impactDataCache = new DataCache();