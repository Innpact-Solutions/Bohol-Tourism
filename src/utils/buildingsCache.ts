/**
 * Buildings Data Cache and Preloader
 * 
 * Preloads building footprint data for the entire city and caches it
 * for instant loading when zoom level reaches 14+
 */

const GEOSERVER_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows';
const BUILDINGS_LAYER = 'WorldBank_Bohol:Buildings';

// Global cache for building data
let buildingsCache: any = null;
let isCacheLoading = false;
let cacheLoadPromise: Promise<any> | null = null;

/**
 * Preload building data for the entire city
 * This runs once on app startup to cache all building footprints
 */
export async function preloadBuildingsData(): Promise<void> {
  // If already cached, skip
  if (buildingsCache) {
    console.log('🏢 Buildings data already cached');
    return;
  }

  // If currently loading, wait for the existing promise
  if (isCacheLoading && cacheLoadPromise) {
    console.log('⏳ Buildings data already loading, waiting...');
    await cacheLoadPromise;
    return;
  }

  // Start loading
  isCacheLoading = true;
  console.log('🚀 Starting buildings data preload for entire city...');

  cacheLoadPromise = (async () => {
    try {
      const startTime = performance.now();

      // Build WFS request for all buildings (GeoJSON format)
      const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeName: BUILDINGS_LAYER,
        outputFormat: 'application/json',
        srsName: 'EPSG:4326',
        maxFeatures: '50000', // Limit to prevent overwhelming the browser
      });

      const url = `${GEOSERVER_WFS_URL}?${params.toString()}`;
      console.log('📡 Fetching buildings from:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`WFS request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        console.warn('⚠️ No building features found');
        buildingsCache = { type: 'FeatureCollection', features: [] };
        return;
      }

      // Cache the GeoJSON data
      buildingsCache = data;

      const endTime = performance.now();
      const loadTime = ((endTime - startTime) / 1000).toFixed(2);

      console.log('✅ Buildings data preloaded successfully');
      console.log(`   Total features: ${data.features.length.toLocaleString()}`);
      console.log(`   Load time: ${loadTime}s`);
      console.log(`   Memory size: ~${(JSON.stringify(data).length / 1024 / 1024).toFixed(2)} MB`);

    } catch (error) {
      console.error('❌ Failed to preload buildings data:', error);
      // Set empty cache to prevent repeated failed attempts
      buildingsCache = { type: 'FeatureCollection', features: [] };
    } finally {
      isCacheLoading = false;
    }
  })();

  await cacheLoadPromise;
}

/**
 * Get cached buildings data
 * Returns the preloaded data instantly if available
 */
export function getCachedBuildingsData(): any | null {
  return buildingsCache;
}

/**
 * Get buildings data filtered by barangay name
 * Uses the cached data for instant filtering
 */
export function getBuildingsByWard(brgyName: string): any {
  if (!buildingsCache || !buildingsCache.features) {
    console.warn('⚠️ Buildings cache not available, returning empty collection');
    return { type: 'FeatureCollection', features: [] };
  }

  // If 'all' or not specified, return all buildings
  if (!brgyName || brgyName === 'all') {
    return buildingsCache;
  }

  // Filter buildings by BrgyName
  const filteredFeatures = buildingsCache.features.filter((feature: any) => {
    return feature.properties.BrgyName === brgyName;
  });

  console.log(`🔍 Filtered ${filteredFeatures.length} buildings for Barangay "${brgyName}"`);

  return {
    type: 'FeatureCollection',
    features: filteredFeatures,
  };
}

/**
 * Check if buildings cache is ready
 */
export function isBuildingsCacheReady(): boolean {
  return buildingsCache !== null && !isCacheLoading;
}

/**
 * Clear the buildings cache (for memory management if needed)
 */
export function clearBuildingsCache(): void {
  buildingsCache = null;
  isCacheLoading = false;
  cacheLoadPromise = null;
  console.log('🗑️ Buildings cache cleared');
}