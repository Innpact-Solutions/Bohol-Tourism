/**
 * Utility functions for fetching and calculating road network statistics from GeoServer
 * Uses Road_Network_BBSR_v2 layer
 */

const GEOSERVER_BASE_URL = 'https://geoserver.azure.innpact.ai/geoserver/GIZ_BBSR/ows';
const ROAD_NETWORK_LAYER = 'GIZ_BBSR:Road_Network_BBSR_v2';

interface RoadNetworkLengths {
  'National Highway': number;
  'State Highway': number;
  'Major Road': number;
  'Link Road': number;
}

/**
 * Fetch road network lengths from GeoServer and calculate totals by category
 * Converts meters to kilometers and rounds to 1 decimal place
 * 
 * @param selectedWardId - Optional ward ID to filter by (e.g., 'ward_1', 'ward_2', or 'all')
 * @returns Object with total length in km for each road category
 */
export async function fetchRoadNetworkLengths(selectedWardId?: string): Promise<RoadNetworkLengths> {
  const results: RoadNetworkLengths = {
    'National Highway': 0,
    'State Highway': 0,
    'Major Road': 0,
    'Link Road': 0,
  };

  try {
    // Build WFS request parameters
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: ROAD_NETWORK_LAYER,
      outputFormat: 'application/json',
      propertyName: 'length,category,Ward', // Only fetch required fields: length (meters), category, Ward
    });

    // Build CQL filter for ward if provided and not 'all'
    if (selectedWardId && selectedWardId !== 'all') {
      const wardNumber = parseInt(selectedWardId.split('_')[1]);
      if (!isNaN(wardNumber)) {
        params.append('CQL_FILTER', `Ward=${wardNumber}`);
        console.log(`🛣️ Fetching road network data for Ward ${wardNumber}`);
      }
    } else {
      console.log(`🛣️ Fetching road network data for all wards`);
    }

    const url = `${GEOSERVER_BASE_URL}?${params.toString()}`;
    console.log(`📡 Road Network WFS URL: ${url}`);

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch road network data: ${response.status} ${response.statusText}`);
      return results;
    }

    const data = await response.json();
    
    if (!data.features || !Array.isArray(data.features)) {
      console.warn(`⚠️ No features found in road network layer`);
      return results;
    }

    console.log(`📊 Processing ${data.features.length} road network features`);
    
    // Debug: Log first feature to see property names
    if (data.features.length > 0) {
      console.log('🔍 Sample road feature properties:', Object.keys(data.features[0].properties || {}));
      console.log('🔍 Sample feature:', data.features[0].properties);
    }

    // Calculate total length for each category
    let nationalHighwayMeters = 0;
    let stateHighwayMeters = 0;
    let majorRoadMeters = 0;
    let linkRoadMeters = 0;

    data.features.forEach((feature: any) => {
      const props = feature.properties;
      const lengthM = props?.length; // Use lowercase 'length' field
      const category = props?.category;
      
      // Skip if no valid length or category
      if (lengthM == null || lengthM === 0 || isNaN(lengthM) || !category) {
        return;
      }
      
      const length = parseFloat(lengthM);
      
      // Accumulate length by category
      switch (category) {
        case 'National Highway':
          nationalHighwayMeters += length;
          break;
        case 'State Highway':
          stateHighwayMeters += length;
          break;
        case 'Major Road':
          majorRoadMeters += length;
          break;
        case 'Link Road':
          linkRoadMeters += length;
          break;
        default:
          console.warn(`⚠️ Unknown road category: ${category}`);
      }
    });

    // Convert meters to kilometers and round to 1 decimal place
    results['National Highway'] = Math.round(nationalHighwayMeters / 100) / 10;
    results['State Highway'] = Math.round(stateHighwayMeters / 100) / 10;
    results['Major Road'] = Math.round(majorRoadMeters / 100) / 10;
    results['Link Road'] = Math.round(linkRoadMeters / 100) / 10;

    const wardInfo = selectedWardId && selectedWardId !== 'all' ? `Ward ${selectedWardId.split('_')[1]}` : 'All Wards';
    console.log(`✅ Road network lengths calculated (${wardInfo}):`);
    console.log(`  🛣️ National Highway: ${results['National Highway']} km (${nationalHighwayMeters.toFixed(0)} m)`);
    console.log(`  🛣️ State Highway: ${results['State Highway']} km (${stateHighwayMeters.toFixed(0)} m)`);
    console.log(`  🛣️ Major Road: ${results['Major Road']} km (${majorRoadMeters.toFixed(0)} m)`);
    console.log(`  🛣️ Link Road: ${results['Link Road']} km (${linkRoadMeters.toFixed(0)} m)`);
    console.log(`  📊 Total: ${(results['National Highway'] + results['State Highway'] + results['Major Road'] + results['Link Road']).toFixed(1)} km`);
    
    return results;
  } catch (error) {
    // Silently handle fetch errors - expected when backend is unavailable
    console.log('ℹ️  Road network data not available (backend not connected)');
    console.error('Error details:', error);
    return results;
  }
}