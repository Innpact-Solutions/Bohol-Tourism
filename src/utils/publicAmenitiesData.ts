/**
 * Utility to fetch and manage Public Amenities layer data from GeoServer
 */

import { calculateHazardExposure, type HazardExposure } from './hazardExposure';

const GEOSERVER_BASE_URL = 'https://geoserver.azure.innpact.ai/geoserver/GIZ_BBSR';
const PUBLIC_AMENITIES_LAYER = 'GIZ_BBSR:Public Amenities';

export interface PublicAmenity {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  properties: any;
  hazardExposure?: HazardExposure;
}

/**
 * Fetch all unique public amenities categories from GeoServer
 * This is a diagnostic function to see what categories actually exist in the data
 */
export async function fetchUniquePublicAmenitiesCategories(): Promise<{
  categories: string[];
  categoryCounts: Record<string, number>;
}> {
  try {
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: PUBLIC_AMENITIES_LAYER,
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
    });

    const url = `${GEOSERVER_BASE_URL}/ows?${params.toString()}`;
    console.log('🔍 Fetching all public amenities data to identify unique categories...');

    const response = await fetch(url);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ GeoServer returned non-JSON response:', text.substring(0, 500));
      return { categories: [], categoryCounts: {} };
    }
    
    const data = await response.json();
    
    // Check for WFS exception
    if (data.type === 'ExceptionReport' || data.exceptions) {
      console.error('❌ GeoServer WFS exception:', data);
      return { categories: [], categoryCounts: {} };
    }

    if (!data.features || data.features.length === 0) {
      console.log('⚠️ No public amenities found');
      return { categories: [], categoryCounts: {} };
    }

    // Extract all unique categories
    const categoryCounts: Record<string, number> = {};
    
    data.features.forEach((feature: any) => {
      const category = feature.properties.Category || feature.properties.category || 'Unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const categories = Object.keys(categoryCounts).sort();

    console.log('📋 ===== UNIQUE PUBLIC AMENITIES CATEGORIES FOUND =====');
    console.log(`Total features: ${data.features.length}`);
    console.log(`Unique categories: ${categories.length}`);
    console.log('\nCategory breakdown:');
    categories.forEach(cat => {
      console.log(`  - "${cat}": ${categoryCounts[cat]} amenities`);
    });
    console.log('=================================================');

    return { categories, categoryCounts };
  } catch (error) {
    // Silently handle fetch errors - expected when backend is unavailable
    console.log('ℹ️  Public amenities data not available (backend not connected)');
    return { categories: [], categoryCounts: {} };
  }
}

/**
 * Fetch public amenities from GeoServer
 */
export async function fetchPublicAmenitiesData(
  selectedBarangayName?: string | string[],
  categories?: string[],
  selectedLguName?: string
): Promise<PublicAmenity[]> {
  try {
    console.log(`🏛️ fetchPublicAmenitiesData called with selectedBarangayName:`, selectedBarangayName, ', selectedLguName:', selectedLguName, ', categories:', categories);
    
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: PUBLIC_AMENITIES_LAYER,
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
    });

    // Build CQL filter
    const filters: string[] = [];

    // Add barangay filter if provided (using BrgyName field)
    if (selectedBarangayName && selectedBarangayName !== 'all') {
      const escapedBrgyName = String(selectedBarangayName).replace(/'/g, "''");
      filters.push(`BrgyName='${escapedBrgyName}'`);
      console.log(`🏘️ Adding barangay filter: BrgyName='${escapedBrgyName}'`);
    }
    // Add LGU filter if provided and no specific barangay (using MunName field)
    else if (selectedLguName && selectedLguName !== 'all') {
      const escapedLguName = selectedLguName.replace(/'/g, "''");
      filters.push(`MunName='${escapedLguName}'`);
      console.log(`🏛️ Adding municipality filter: MunName='${escapedLguName}'`);
    }

    // Add category filter if provided
    if (categories && categories.length > 0) {
      const categoryFilter = categories.map(cat => `Category='${cat}'`).join(' OR ');
      filters.push(`(${categoryFilter})`);
    }

    // Combine filters
    if (filters.length > 0) {
      params.append('CQL_FILTER', filters.join(' AND '));
    }

    const url = `${GEOSERVER_BASE_URL}/ows?${params.toString()}`;
    console.log('🏛️  Fetching public amenities data:', url);

    const response = await fetch(url);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ GeoServer returned non-JSON response:', text.substring(0, 500));
      return [];
    }
    
    const data = await response.json();
    
    // Check for WFS exception
    if (data.type === 'ExceptionReport' || data.exceptions) {
      console.error('❌ GeoServer WFS exception:', data);
      return [];
    }

    if (!data.features || data.features.length === 0) {
      console.log('⚠️ No public amenities found');
      return [];
    }

    console.log(`✅ Fetched ${data.features.length} public amenities from GeoServer`);

    // Transform features to our format
    const amenities: PublicAmenity[] = data.features.map((feature: any, index: number) => {
      const coords = feature.geometry.coordinates;
      return {
        id: feature.id || `amenity_${index}`,
        name: feature.properties.Name || feature.properties.name || 'Unknown',
        category: feature.properties.Category || feature.properties.category || 'Unknown',
        lat: coords[1],
        lng: coords[0],
        properties: feature.properties,
      };
    });

    // Log unique categories for debugging in a clear format
    const uniqueCategories = [...new Set(amenities.map(am => am.category))].sort();
    const categoryCounts = uniqueCategories.reduce((acc, cat) => {
      acc[cat] = amenities.filter(am => am.category === cat).length;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📋 ===== UNIQUE PUBLIC AMENITIES CATEGORIES FOUND =====');
    console.log(`Total features: ${amenities.length}`);
    console.log(`Unique categories: ${uniqueCategories.length}`);
    console.log('\nCategory breakdown:');
    uniqueCategories.forEach(cat => {
      console.log(`  - "${cat}": ${categoryCounts[cat]} amenities`);
    });
    console.log('=================================================');
    
    return amenities;
  } catch (error) {
    // Silently handle fetch errors - expected when backend is unavailable
    console.log('ℹ️  Public amenities data not available (backend not connected)');
    return [];
  }
}

/**
 * Fetch public amenities counts by category from GeoServer
 * Returns counts with lowercase category names as keys
 */
export async function fetchPublicAmenitiesCounts(selectedWardId?: string): Promise<Record<string, number>> {
  try {
    console.log(`🏛️ Fetching public amenities counts from GeoServer...`);
    
    // Use fetchPublicAmenitiesData which we know works (it's used for map markers)
    const amenities = await fetchPublicAmenitiesData(selectedWardId, undefined);
    
    if (!amenities || amenities.length === 0) {
      console.log('⚠️ No public amenities found');
      return {};
    }

    // Count by category (lowercase)
    const counts: Record<string, number> = {};
    
    // Also track original GeoServer category names for debugging
    const originalCategories: Record<string, string[]> = {};
    
    amenities.forEach((amenity) => {
      const originalCategory = amenity.category || 'Unknown';
      const category = (amenity.category || 'Unknown').toLowerCase();
      counts[category] = (counts[category] || 0) + 1;
      
      // Track which original GeoServer categories map to each lowercase key
      if (!originalCategories[category]) {
        originalCategories[category] = [];
      }
      if (!originalCategories[category].includes(originalCategory)) {
        originalCategories[category].push(originalCategory);
      }
    });

    console.log('📊 ===== PUBLIC AMENITIES COUNTS BREAKDOWN =====');
    console.log(`Total amenities fetched: ${amenities.length}`);
    console.log('\nCounts by lowercase category (used in UI):');
    Object.entries(counts).forEach(([key, count]) => {
      const originals = originalCategories[key].join(', ');
      console.log(`  "${key}": ${count} (from GeoServer: ${originals})`);
    });
    console.log(`Total count: ${Object.values(counts).reduce((sum, count) => sum + count, 0)}`);
    console.log('=========================================');
    
    return counts;
  } catch (error) {
    // Silently handle fetch errors - expected when backend is unavailable
    console.log('ℹ️  Public amenities data not available (backend not connected)');
    return {};
  }
}

/**
 * Map category names to standardized subcategory IDs for filtering
 * This handles the mapping from GeoServer category names to app-level category IDs
 */
export function mapCategoryToSubcategoryId(category: string): string {
  const mapping: Record<string, string> = {
    // Map actual GeoServer categories to subcategory IDs
    'Community Centre': 'community_centre',
    'Culture Centre': 'culture_centre',
    'Fire Station': 'fire_station',
    'Government Buildings': 'government_buildings',
    'Park': 'park',
    'Petrol Pump': 'petrol_pump',
    'Playground/Stadium': 'playground_stadium',
    'Police Outpost': 'police_outpost',
    'Religious': 'religious',
    'Telephone Exchange': 'telephone_exchange',
    'Haat/Market': 'haat_market',
    'Vending Zones': 'vending_zones',
  };
  
  return mapping[category] || category.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_');
}

/**
 * Map subcategory IDs back to GeoServer category names
 * Used to build CQL filters when querying GeoServer
 */
export function mapSubcategoryIdToCategory(subcategoryId: string): string {
  const reverseMapping: Record<string, string> = {
    'community_centre': 'Community Centre',
    'culture_centre': 'Culture Centre',
    'fire_station': 'Fire Station',
    'government_buildings': 'Government Buildings',
    'park': 'Park',
    'petrol_pump': 'Petrol Pump',
    'playground_stadium': 'Playground/Stadium',
    'police_outpost': 'Police Outpost',
    'religious': 'Religious',
    'telephone_exchange': 'Telephone Exchange',
    'haat_market': 'Haat/Market',
    'vending_zones': 'Vending Zones',
  };
  
  return reverseMapping[subcategoryId] || subcategoryId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}