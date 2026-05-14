/**
 * Utility to fetch and manage Education layer data from GeoServer
 */

import { calculateHazardExposure, type HazardExposure } from './hazardExposure';

const GEOSERVER_BASE_URL = 'https://geoserver.azure.innpact.ai/geoserver/GIZ_BBSR';
const EDUCATION_LAYER = 'GIZ_BBSR:Education';

export interface EducationInstitution {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  properties: any;
  hazardExposure?: HazardExposure;
}

/**
 * Fetch education institutions from GeoServer
 */
export async function fetchEducationData(
  selectedBarangayName?: string | string[],
  categories?: string[],
  selectedLguName?: string
): Promise<EducationInstitution[]> {
  try {
    console.log(`🏫 fetchEducationData called with selectedBarangayName:`, selectedBarangayName, ', selectedLguName:', selectedLguName, ', categories:', categories);
    
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: EDUCATION_LAYER,
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
    console.log('🏫 Fetching education data:', url);

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
      console.log('⚠️ No education institutions found');
      return [];
    }

    // Transform features to our format
    const institutions: EducationInstitution[] = data.features.map((feature: any, index: number) => {
      const coords = feature.geometry.coordinates;
      return {
        id: feature.id || `edu_${index}`,
        name: feature.properties.Name || feature.properties.name || 'Unknown',
        category: feature.properties.Category || feature.properties.category || 'Unknown',
        lat: coords[1],
        lng: coords[0],
        properties: feature.properties,
      };
    });

    // Log unique categories for debugging in a clear format
    const uniqueCategories = [...new Set(institutions.map(inst => inst.category))].sort();
    const categoryCounts = uniqueCategories.reduce((acc, cat) => {
      acc[cat] = institutions.filter(inst => inst.category === cat).length;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📋 ===== UNIQUE EDUCATION CATEGORIES FOUND =====');
    console.log(`Total features: ${institutions.length}`);
    console.log(`Unique categories: ${uniqueCategories.length}`);
    console.log('\nCategory breakdown:');
    uniqueCategories.forEach(cat => {
      console.log(`  - "${cat}": ${categoryCounts[cat]} institutions`);
    });
    console.log('=================================================');
    
    return institutions;
  } catch (error) {
    console.error('❌ Error fetching education data:', error);
    return [];
  }
}

/**
 * Get counts of education institutions by category
 */
export async function fetchEducationCounts(
  selectedWardId?: string
): Promise<Record<string, number>> {
  try {
    // Fetch all education data
    const institutions = await fetchEducationData(selectedWardId);
    
    // Count by category
    const counts: Record<string, number> = {};
    
    // Also track original GeoServer category names for debugging
    const originalCategories: Record<string, string[]> = {};
    
    institutions.forEach(inst => {
      const originalCategory = inst.category;
      const category = inst.category.toLowerCase();
      counts[category] = (counts[category] || 0) + 1;
      
      // Track which original GeoServer categories map to each lowercase key
      if (!originalCategories[category]) {
        originalCategories[category] = [];
      }
      if (!originalCategories[category].includes(originalCategory)) {
        originalCategories[category].push(originalCategory);
      }
    });

    console.log('📊 ===== EDUCATION COUNTS BREAKDOWN =====');
    console.log(`Total institutions fetched: ${institutions.length}`);
    console.log('\\nCounts by lowercase category (used in UI):');
    Object.entries(counts).forEach(([key, count]) => {
      const originals = originalCategories[key].join(', ');
      console.log(`  "${key}": ${count} (from GeoServer: ${originals})`);
    });
    console.log('==========================================');
    
    return counts;
  } catch (error) {
    console.error('❌ Error fetching education counts:', error);
    return {};
  }
}

/**
 * Map category from GeoServer to UI subcategory ID
 */
export function mapCategoryToSubcategoryId(category: string): string {
  const normalized = category.toLowerCase();
  
  // Map GeoServer categories to our subcategory IDs
  const mapping: Record<string, string> = {
    'university': 'university',
    'college': 'college',
    'school': 'school',
    'anganwadi': 'anganwadi',
    'anganwadis': 'anganwadi',
  };

  return mapping[normalized] || normalized;
}

/**
 * Map subcategory ID to GeoServer category value
 */
export function mapSubcategoryIdToCategory(subcategoryId: string): string {
  const mapping: Record<string, string> = {
    'university': 'University',
    'college': 'College',
    'school': 'School',
    'anganwadi': 'Anganwadi',
  };

  return mapping[subcategoryId] || subcategoryId;
}

/**
 * Get total education institution count
 */
export async function getTotalEducationCount(selectedWardId?: string): Promise<number> {
  try {
    const institutions = await fetchEducationData(selectedWardId);
    return institutions.length;
  } catch (error) {
    console.error('❌ Error getting education count:', error);
    return 0;
  }
}

/**
 * Get hazard exposure for education institutions
 */
export async function getEducationHazardExposure(
  selectedWardId: string | null,
  hazardLayerId: string | null
): Promise<HazardExposure> {
  const total = await getTotalEducationCount(selectedWardId || undefined);
  return calculateHazardExposure(total, hazardLayerId, selectedWardId, 4004);
}