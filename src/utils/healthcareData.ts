/**
 * Utility to fetch and manage Healthcare layer data from GeoServer
 */

import { calculateHazardExposure, type HazardExposure } from './hazardExposure';

const GEOSERVER_BASE_URL = 'https://geoserver.azure.innpact.ai/geoserver/GIZ_BBSR';
const HEALTHCARE_LAYER = 'GIZ_BBSR:Health';

export interface HealthcareFacility {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  properties: any;
  hazardExposure?: HazardExposure;
}

/**
 * Fetch all unique healthcare categories from GeoServer
 * This is a diagnostic function to see what categories actually exist in the data
 */
export async function fetchUniqueHealthcareCategories(): Promise<{
  categories: string[];
  categoryCounts: Record<string, number>;
}> {
  try {
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: HEALTHCARE_LAYER,
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
    });

    const url = `${GEOSERVER_BASE_URL}/ows?${params.toString()}`;
    console.log('🔍 Fetching all healthcare data to identify unique categories...');

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
      console.log('⚠️ No healthcare facilities found');
      return { categories: [], categoryCounts: {} };
    }

    // Extract all unique categories
    const categoryCounts: Record<string, number> = {};
    
    data.features.forEach((feature: any) => {
      const category = feature.properties.Category || feature.properties.category || 'Unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const categories = Object.keys(categoryCounts).sort();

    console.log('📋 ===== UNIQUE HEALTHCARE CATEGORIES FOUND =====');
    console.log(`Total features: ${data.features.length}`);
    console.log(`Unique categories: ${categories.length}`);
    console.log('\nCategory breakdown:');
    categories.forEach(cat => {
      console.log(`  - "${cat}": ${categoryCounts[cat]} facilities`);
    });
    console.log('=================================================');

    return { categories, categoryCounts };
  } catch (error) {
    // Silently handle fetch errors - expected when backend is unavailable
    console.log('ℹ️  Healthcare data not available (backend not connected)');
    return { categories: [], categoryCounts: {} };
  }
}

/**
 * Fetch healthcare facilities from GeoServer
 */
export async function fetchHealthcareData(
  selectedBarangayName?: string | string[],
  categories?: string[],
  selectedLguName?: string
): Promise<HealthcareFacility[]> {
  try {
    console.log(`🏥 fetchHealthcareData called with selectedBarangayName:`, selectedBarangayName, ', selectedLguName:', selectedLguName, ', categories:', categories);
    
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: HEALTHCARE_LAYER,
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
    console.log('🏥 Fetching healthcare data:', url);

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
      console.log('⚠️ No healthcare facilities found');
      return [];
    }

    // Transform features to our format
    const facilities: HealthcareFacility[] = data.features.map((feature: any, index: number) => {
      const coords = feature.geometry.coordinates;
      return {
        id: feature.id || `health_${index}`,
        name: feature.properties.Name || feature.properties.name || 'Unknown',
        category: feature.properties.Category || feature.properties.category || 'Unknown',
        lat: coords[1],
        lng: coords[0],
        properties: feature.properties,
      };
    });

    // Log unique categories for debugging in a clear format
    const uniqueCategories = [...new Set(facilities.map(fac => fac.category))].sort();
    const categoryCounts = uniqueCategories.reduce((acc, cat) => {
      acc[cat] = facilities.filter(fac => fac.category === cat).length;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📋 ===== UNIQUE HEALTHCARE CATEGORIES FOUND =====');
    console.log(`Total features: ${facilities.length}`);
    console.log(`Unique categories: ${uniqueCategories.length}`);
    console.log('\nCategory breakdown:');
    uniqueCategories.forEach(cat => {
      console.log(`  - "${cat}": ${categoryCounts[cat]} facilities`);
    });
    console.log('=================================================');
    
    return facilities;
  } catch (error) {
    // Silently handle fetch errors - expected when backend is unavailable
    console.log('ℹ️  Healthcare data not available (backend not connected)');
    return [];
  }
}

/**
 * Get counts of healthcare facilities by category
 */
export async function fetchHealthcareCounts(
  selectedWardId?: string
): Promise<Record<string, number>> {
  try {
    // Fetch all healthcare data
    const facilities = await fetchHealthcareData(selectedWardId);
    
    // Count by category
    const counts: Record<string, number> = {};
    
    // Also track original GeoServer category names for debugging
    const originalCategories: Record<string, string[]> = {};
    
    facilities.forEach(facility => {
      const originalCategory = facility.category;
      const category = facility.category.toLowerCase();
      counts[category] = (counts[category] || 0) + 1;
      
      // Track which original GeoServer categories map to each lowercase key
      if (!originalCategories[category]) {
        originalCategories[category] = [];
      }
      if (!originalCategories[category].includes(originalCategory)) {
        originalCategories[category].push(originalCategory);
      }
    });

    console.log('📊 ===== HEALTHCARE COUNTS BREAKDOWN =====');
    console.log(`Total facilities fetched: ${facilities.length}`);
    console.log('\\nCounts by lowercase category (used in UI):');
    Object.entries(counts).forEach(([key, count]) => {
      const originals = originalCategories[key].join(', ');
      console.log(`  "${key}": ${count} (from GeoServer: ${originals})`);
    });
    console.log('==========================================');

    return counts;
  } catch (error) {
    // Silently handle fetch errors - expected when backend is unavailable
    console.log('ℹ️  Healthcare data not available (backend not connected)');
    return {};
  }
}

/**
 * Map category from GeoServer to UI subcategory ID
 */
export function mapCategoryToSubcategoryId(category: string): string {
  const normalized = category.toLowerCase();
  
  // Map GeoServer categories to our subcategory IDs
  // Actual categories from GeoServer: "Hospital", "Health Centre", "Nursing Home"
  const mapping: Record<string, string> = {
    'hospital': 'hospital',
    'health centre': 'health_centre',
    'nursing home': 'nursing_home',
  };

  return mapping[normalized] || normalized;
}

/**
 * Map subcategory ID to GeoServer category value
 */
export function mapSubcategoryIdToCategory(subcategoryId: string): string {
  const mapping: Record<string, string> = {
    'hospital': 'Hospital',
    'health_centre': 'Health Centre',
    'nursing_home': 'Nursing Home',
  };

  return mapping[subcategoryId] || subcategoryId;
}

/**
 * Get total healthcare facility count
 */
export async function getTotalHealthcareCount(selectedWardId?: string): Promise<number> {
  try {
    const facilities = await fetchHealthcareData(selectedWardId);
    return facilities.length;
  } catch (error) {
    console.error('❌ Error getting healthcare count:', error);
    return 0;
  }
}

/**
 * Get hazard exposure for healthcare facilities
 */
export async function getHealthcareHazardExposure(
  selectedWardId: string | null,
  hazardLayerId: string | null
): Promise<HazardExposure> {
  const total = await getTotalHealthcareCount(selectedWardId || undefined);
  return calculateHazardExposure(total, hazardLayerId, selectedWardId, 4005);
}