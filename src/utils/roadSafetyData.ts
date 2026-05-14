/**
 * Utility functions for fetching and calculating road safety data from GeoServer
 */

const GEOSERVER_BASE_URL = 'https://geoserver.azure.innpact.ai/geoserver/GIZ_BBSR/ows';
const ROAD_SAFETY_LAYER = 'GIZ_BBSR:Road_Safety';

interface RoadSafetyLengths {
  irap_vehicle: number;
  irap_motorcycle: number;
  irap_bicycle: number;
  irap_pedestrian: number;
}

interface StarRatingData {
  totalLength: number;
  '5star': number;
  '4star': number;
  '3star': number;
  '2star': number;
  '1star': number;
}

interface RoadSafetyStarRatings {
  irap_vehicle: StarRatingData;
  irap_motorcycle: StarRatingData;
  irap_bicycle: StarRatingData;
  irap_pedestrian: StarRatingData;
}

// NEW: Star rating data aggregated by road name
export interface RoadStarRatingByName {
  road_name: string;
  total_km: number;
  '5star': number;
  '4star': number;
  '3star': number;
  '2star': number;
  '1star': number;
}

/**
 * Fetch road safety lengths from GeoServer and calculate totals
 * Converts meters to kilometers and excludes null/0 values
 * 
 * Note: All road safety data is in ONE layer (Road_Safety) with different rating fields:
 * - Vehicle_St (Vehicle Safety)
 * - Motorcycli (Motorcycle Safety)
 * - Bicyclist_ (Bicycle Safety)
 * - Pedestrian (Pedestrian Safety)
 * 
 * @param selectedWardId - Optional ward ID to filter by (e.g., 'ward_1', 'ward_2', or 'all')
 * @param selectedRoadName - Optional road name to filter by (e.g., specific road or 'all')
 */
export async function fetchRoadSafetyLengths(selectedWardId?: string, selectedRoadName?: string): Promise<RoadSafetyLengths> {
  const results: RoadSafetyLengths = {
    irap_vehicle: 0,
    irap_motorcycle: 0,
    irap_bicycle: 0,
    irap_pedestrian: 0,
  };

  try {
    // Build WFS request parameters
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: ROAD_SAFETY_LAYER,
      outputFormat: 'application/json',
      propertyName: 'Length_m,Vehicle_St,Motorcycli,Bicyclist_,Pedestrian,Ward,Road_name', // Fetch length, all rating fields, Ward, and Road_name
    });

    // Build CQL filters
    const cqlFilters: string[] = [];

    // Add ward filter if provided and not 'all'
    if (selectedWardId && selectedWardId !== 'all') {
      const wardNumber = parseInt(selectedWardId.split('_')[1]);
      if (!isNaN(wardNumber)) {
        cqlFilters.push(`Ward=${wardNumber}`);
        console.log(`🚗 Filtering road safety data for Ward ${wardNumber}`);
      }
    }

    // Add road name filter if provided and not 'all'
    if (selectedRoadName && selectedRoadName !== 'all') {
      const escapedRoadName = selectedRoadName.replace(/'/g, "''");
      cqlFilters.push(`Road_name='${escapedRoadName}'`);
      console.log(`🛣️ Filtering road safety data for Road: ${selectedRoadName}`);
    }

    // Apply combined filters
    if (cqlFilters.length > 0) {
      params.append('CQL_FILTER', cqlFilters.join(' AND '));
    } else {
      console.log(`🚗 Fetching road safety data for all wards and roads`);
    }

    const url = `${GEOSERVER_BASE_URL}?${params.toString()}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch road safety data: ${response.status} ${response.statusText}`);
      return results;
    }

    const data = await response.json();
    
    if (!data.features || !Array.isArray(data.features)) {
      console.warn(`⚠️ No features found in road safety layer`);
      return results;
    }

    console.log(`📊 Processing ${data.features.length} road safety features`);

    // Calculate total length for each safety type
    // For each type, sum up all segments where that rating exists (not null/0)
    let vehicleMeters = 0;
    let motorcycleMeters = 0;
    let bicycleMeters = 0;
    let pedestrianMeters = 0;

    data.features.forEach((feature: any) => {
      const props = feature.properties;
      const lengthM = props?.Length_m;
      
      // Skip if no valid length
      if (lengthM == null || lengthM === 0 || isNaN(lengthM)) {
        return;
      }
      
      const length = parseFloat(lengthM);
      
      // Count this segment for each safety type that has a valid rating
      if (props.Vehicle_St != null && props.Vehicle_St !== 0) {
        vehicleMeters += length;
      }
      if (props.Motorcycli != null && props.Motorcycli !== 0) {
        motorcycleMeters += length;
      }
      if (props.Bicyclist_ != null && props.Bicyclist_ !== 0) {
        bicycleMeters += length;
      }
      if (props.Pedestrian != null && props.Pedestrian !== 0) {
        pedestrianMeters += length;
      }
    });

    // Convert meters to kilometers and round to 1 decimal place
    results.irap_vehicle = Math.round(vehicleMeters / 100) / 10;
    results.irap_motorcycle = Math.round(motorcycleMeters / 100) / 10;
    results.irap_bicycle = Math.round(bicycleMeters / 100) / 10;
    results.irap_pedestrian = Math.round(pedestrianMeters / 100) / 10;

    const wardInfo = selectedWardId && selectedWardId !== 'all' ? `Ward ${selectedWardId.split('_')[1]}` : 'All Wards';
    const roadInfo = selectedRoadName && selectedRoadName !== 'all' ? `Road: ${selectedRoadName}` : 'All Roads';
    console.log(`✅ Road safety lengths calculated (${wardInfo}, ${roadInfo}):`);
    console.log(`  🚗 Vehicle: ${results.irap_vehicle} km (${vehicleMeters.toFixed(0)} m)`);
    console.log(`  🏍️ Motorcycle: ${results.irap_motorcycle} km (${motorcycleMeters.toFixed(0)} m)`);
    console.log(`  🚴 Bicycle: ${results.irap_bicycle} km (${bicycleMeters.toFixed(0)} m)`);
    console.log(`  🚶 Pedestrian: ${results.irap_pedestrian} km (${pedestrianMeters.toFixed(0)} m)`);
    
    return results;
  } catch (error) {
    // Silently handle fetch errors - expected when backend is unavailable
    console.log('ℹ️  Road safety data not available (backend not connected)');
    return results;
  }
}

/**
 * Fetch bounding box for filtered road safety features
 * Returns [minLng, minLat, maxLng, maxLat] or null if no features found
 * 
 * @param layerType - Road safety layer type (e.g., 'irap_vehicle', 'irap_pedestrian')
 * @param starRating - Star rating filter (e.g., '5star', '4star', etc.)
 * @param selectedWardId - Optional ward ID to filter by
 * @param selectedRoadName - Optional road name to filter by
 */
export async function fetchRoadSafetyBounds(
  layerType: string,
  starRating: string,
  selectedWardId?: string,
  selectedRoadName?: string
): Promise<[number, number, number, number] | null> {
  try {
    // Map layer type to GeoServer field name
    const fieldMap: Record<string, string> = {
      'irap_vehicle': 'Vehicle_St',
      'irap_motorcycle': 'Motorcycli',
      'irap_bicycle': 'Bicyclist_',
      'irap_pedestrian': 'Pedestrian',
    };

    const fieldName = fieldMap[layerType];
    if (!fieldName) {
      console.error(`❌ Unknown road safety layer type: ${layerType}`);
      return null;
    }

    // Extract star number from rating (e.g., '5star' -> 5)
    const starNumber = parseInt(starRating.charAt(0));
    if (isNaN(starNumber) || starNumber < 1 || starNumber > 5) {
      console.error(`❌ Invalid star rating: ${starRating}`);
      return null;
    }

    // Build CQL filters
    const cqlFilters: string[] = [];

    // Add star rating filter
    cqlFilters.push(`${fieldName}=${starNumber}`);
    console.log(`🔍 Star rating filter: ${fieldName}=${starNumber}`);

    // Add ward filter if provided and not 'all'
    if (selectedWardId && selectedWardId !== 'all') {
      const wardNumber = parseInt(selectedWardId.split('_')[1]);
      if (!isNaN(wardNumber)) {
        cqlFilters.push(`Ward=${wardNumber}`);
        console.log(`🏘️ Ward filter: Ward=${wardNumber}`);
      }
    } else {
      console.log(`🌍 No ward filter (showing all wards)`);
    }

    // Add road name filter if provided and not 'all'
    if (selectedRoadName && selectedRoadName !== 'all') {
      const escapedRoadName = selectedRoadName.replace(/'/g, "''");
      cqlFilters.push(`Road_name='${escapedRoadName}'`);
      console.log(`🛣️ Road name filter: Road_name='${escapedRoadName}'`);
    } else {
      console.log(`🌍 No road name filter (showing all roads)`);
    }
    
    console.log(`📋 Combined CQL filter: ${cqlFilters.join(' AND ')}`);

    // Build WFS request for bounding box
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: ROAD_SAFETY_LAYER,
      outputFormat: 'application/json',
      CQL_FILTER: cqlFilters.join(' AND '),
    });

    const url = `${GEOSERVER_BASE_URL}?${params.toString()}`;
    console.log(`🌐 Fetching road safety bounds from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch road safety bounds: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log(`📦 Received ${data.features?.length || 0} features for ${layerType} ${starRating}`);
    
    if (!data.features || data.features.length === 0) {
      console.warn(`⚠️ No features found for ${layerType} ${starRating}`);
      console.log(`   CQL Filter used: ${cqlFilters.join(' AND ')}`);
      return null;
    }

    // Calculate bounding box from features
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;

    data.features.forEach((feature: any) => {
      if (feature.geometry && feature.geometry.coordinates) {
        const coords = feature.geometry.coordinates;
        
        // Handle LineString geometry
        if (feature.geometry.type === 'LineString') {
          coords.forEach(([lng, lat]: [number, number]) => {
            minLng = Math.min(minLng, lng);
            minLat = Math.min(minLat, lat);
            maxLng = Math.max(maxLng, lng);
            maxLat = Math.max(maxLat, lat);
          });
        }
        // Handle MultiLineString geometry
        else if (feature.geometry.type === 'MultiLineString') {
          coords.forEach((lineString: number[][]) => {
            lineString.forEach(([lng, lat]: [number, number]) => {
              minLng = Math.min(minLng, lng);
              minLat = Math.min(minLat, lat);
              maxLng = Math.max(maxLng, lng);
              maxLat = Math.max(maxLat, lat);
            });
          });
        }
      }
    });

    if (minLng === Infinity || minLat === Infinity || maxLng === -Infinity || maxLat === -Infinity) {
      console.warn(`⚠️ Could not calculate bounds for ${layerType} ${starRating}`);
      return null;
    }

    console.log(`✅ Calculated bounds for ${layerType} ${starRating}:`, [minLng, minLat, maxLng, maxLat]);
    return [minLng, minLat, maxLng, maxLat];

  } catch (error) {
    console.error('❌ Error in fetchRoadSafetyBounds:', error);
    return null;
  }
}

/**
 * Fetch road safety star rating breakdown from GeoServer
 * Returns length in kilometers for each star rating (1-5) for each safety type
 * 
 * @param selectedWardId - Optional ward ID to filter by (e.g., 'ward_1', 'ward_2', or 'all')
 * @param selectedRoadName - Optional road name to filter by (e.g., specific road or 'all')
 */
export async function fetchRoadSafetyStarRatings(selectedWardId?: string, selectedRoadName?: string): Promise<RoadSafetyStarRatings> {
  const emptyStarData: StarRatingData = {
    totalLength: 0,
    '5star': 0,
    '4star': 0,
    '3star': 0,
    '2star': 0,
    '1star': 0,
  };

  const results: RoadSafetyStarRatings = {
    irap_vehicle: { ...emptyStarData },
    irap_motorcycle: { ...emptyStarData },
    irap_bicycle: { ...emptyStarData },
    irap_pedestrian: { ...emptyStarData },
  };

  try {
    // Build WFS request parameters
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: ROAD_SAFETY_LAYER,
      outputFormat: 'application/json',
      propertyName: 'Length_m,Vehicle_St,Motorcycli,Bicyclist_,Pedestrian,Ward,Road_name',
    });

    // Build CQL filters
    const cqlFilters: string[] = [];

    // Add ward filter if provided and not 'all'
    if (selectedWardId && selectedWardId !== 'all') {
      const wardNumber = parseInt(selectedWardId.split('_')[1]);
      if (!isNaN(wardNumber)) {
        cqlFilters.push(`Ward=${wardNumber}`);
      }
    }

    // Add road name filter if provided and not 'all'
    if (selectedRoadName && selectedRoadName !== 'all') {
      const escapedRoadName = selectedRoadName.replace(/'/g, "''");
      cqlFilters.push(`Road_name='${escapedRoadName}'`);
    }

    // Apply combined filters
    if (cqlFilters.length > 0) {
      params.append('CQL_FILTER', cqlFilters.join(' AND '));
    }

    const url = `${GEOSERVER_BASE_URL}?${params.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch road safety star ratings: ${response.status} ${response.statusText}`);
      return results;
    }

    const data = await response.json();
    
    if (!data.features || !Array.isArray(data.features)) {
      console.warn(`⚠️ No features found in road safety layer`);
      return results;
    }

    // Initialize counters for each type and star rating (in meters)
    const vehicleStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const motorcycleStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const bicycleStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const pedestrianStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // Process each feature
    data.features.forEach((feature: any) => {
      const props = feature.properties;
      const lengthM = props?.Length_m;
      
      // Skip if no valid length
      if (lengthM == null || lengthM === 0 || isNaN(lengthM)) {
        return;
      }
      
      const length = parseFloat(lengthM);
      
      // Process Vehicle Safety rating
      const vehicleRating = props.Vehicle_St;
      if (vehicleRating >= 1 && vehicleRating <= 5) {
        vehicleStars[vehicleRating as keyof typeof vehicleStars] += length;
      }
      
      // Process Motorcycle Safety rating
      const motorcycleRating = props.Motorcycli;
      if (motorcycleRating >= 1 && motorcycleRating <= 5) {
        motorcycleStars[motorcycleRating as keyof typeof motorcycleStars] += length;
      }
      
      // Process Bicycle Safety rating
      const bicycleRating = props.Bicyclist_;
      if (bicycleRating >= 1 && bicycleRating <= 5) {
        bicycleStars[bicycleRating as keyof typeof bicycleStars] += length;
      }
      
      // Process Pedestrian Safety rating
      const pedestrianRating = props.Pedestrian;
      if (pedestrianRating >= 1 && pedestrianRating <= 5) {
        pedestrianStars[pedestrianRating as keyof typeof pedestrianStars] += length;
      }
    });

    // Convert meters to kilometers and populate results
    const metersToKm = (meters: number) => Math.round(meters / 100) / 10;

    // Vehicle Safety
    results.irap_vehicle['1star'] = metersToKm(vehicleStars[1]);
    results.irap_vehicle['2star'] = metersToKm(vehicleStars[2]);
    results.irap_vehicle['3star'] = metersToKm(vehicleStars[3]);
    results.irap_vehicle['4star'] = metersToKm(vehicleStars[4]);
    results.irap_vehicle['5star'] = metersToKm(vehicleStars[5]);
    results.irap_vehicle.totalLength = Object.values(results.irap_vehicle).reduce((sum, val) => 
      typeof val === 'number' ? sum + val : sum, 0
    );

    // Motorcycle Safety
    results.irap_motorcycle['1star'] = metersToKm(motorcycleStars[1]);
    results.irap_motorcycle['2star'] = metersToKm(motorcycleStars[2]);
    results.irap_motorcycle['3star'] = metersToKm(motorcycleStars[3]);
    results.irap_motorcycle['4star'] = metersToKm(motorcycleStars[4]);
    results.irap_motorcycle['5star'] = metersToKm(motorcycleStars[5]);
    results.irap_motorcycle.totalLength = Object.values(results.irap_motorcycle).reduce((sum, val) => 
      typeof val === 'number' ? sum + val : sum, 0
    );

    // Bicycle Safety
    results.irap_bicycle['1star'] = metersToKm(bicycleStars[1]);
    results.irap_bicycle['2star'] = metersToKm(bicycleStars[2]);
    results.irap_bicycle['3star'] = metersToKm(bicycleStars[3]);
    results.irap_bicycle['4star'] = metersToKm(bicycleStars[4]);
    results.irap_bicycle['5star'] = metersToKm(bicycleStars[5]);
    results.irap_bicycle.totalLength = Object.values(results.irap_bicycle).reduce((sum, val) => 
      typeof val === 'number' ? sum + val : sum, 0
    );

    // Pedestrian Safety
    results.irap_pedestrian['1star'] = metersToKm(pedestrianStars[1]);
    results.irap_pedestrian['2star'] = metersToKm(pedestrianStars[2]);
    results.irap_pedestrian['3star'] = metersToKm(pedestrianStars[3]);
    results.irap_pedestrian['4star'] = metersToKm(pedestrianStars[4]);
    results.irap_pedestrian['5star'] = metersToKm(pedestrianStars[5]);
    results.irap_pedestrian.totalLength = Object.values(results.irap_pedestrian).reduce((sum, val) => 
      typeof val === 'number' ? sum + val : sum, 0
    );

    const wardInfo = selectedWardId && selectedWardId !== 'all' ? `Ward ${selectedWardId.split('_')[1]}` : 'All Wards';
    const roadInfo = selectedRoadName && selectedRoadName !== 'all' ? `Road: ${selectedRoadName}` : 'All Roads';
    console.log(`✅ Road safety star ratings calculated (${wardInfo}, ${roadInfo})`);
    
    return results;
  } catch (error) {
    console.error('❌ Error in fetchRoadSafetyStarRatings:', error);
    return results;
  }
}

/**
 * NEW: Fetch star rating distribution BY ROAD NAME from GeoServer
 * Returns array of roads with their star rating breakdown for a specific vehicle type
 * 
 * @param vehicleType - Vehicle type field name ('Vehicle_St', 'Motorcycli', 'Bicyclist_', 'Pedestrian')
 * @param selectedWardId - Optional ward ID to filter by
 * @param selectedRoadName - Optional road name to filter by
 */
export async function fetchRoadStarRatingsByName(
  vehicleType: 'Vehicle_St' | 'Motorcycli' | 'Bicyclist_' | 'Pedestrian',
  selectedWardId?: string,
  selectedRoadName?: string
): Promise<RoadStarRatingByName[]> {
  try {
    // Build WFS request parameters
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: ROAD_SAFETY_LAYER,
      outputFormat: 'application/json',
      propertyName: `Length_m,${vehicleType},Road_name,Ward`,
    });

    // Build CQL filters
    const cqlFilters: string[] = [];

    // Add ward filter if provided
    if (selectedWardId && selectedWardId !== 'all') {
      const wardNumber = parseInt(selectedWardId.split('_')[1]);
      if (!isNaN(wardNumber)) {
        cqlFilters.push(`Ward=${wardNumber}`);
      }
    }

    // Add road name filter if provided
    if (selectedRoadName && selectedRoadName !== 'all') {
      const escapedRoadName = selectedRoadName.replace(/'/g, "''");
      cqlFilters.push(`Road_name='${escapedRoadName}'`);
    }

    // Apply combined filters
    if (cqlFilters.length > 0) {
      params.append('CQL_FILTER', cqlFilters.join(' AND '));
    }

    const url = `${GEOSERVER_BASE_URL}?${params.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch road star ratings by name: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    if (!data.features || !Array.isArray(data.features)) {
      console.warn(`⚠️ No features found in road safety layer`);
      return [];
    }

    // Aggregate by road name
    const roadMap = new Map<string, { 
      total_m: number;
      stars: Record<number, number>;
    }>();

    data.features.forEach((feature: any) => {
      const props = feature.properties;
      const lengthM = props?.Length_m;
      const roadName = props?.Road_name;
      const starRating = props?.[vehicleType];
      
      // Skip if missing data
      if (!lengthM || !roadName || starRating == null || starRating === 0) {
        return;
      }

      const length = parseFloat(lengthM);
      const rating = parseInt(starRating);

      // Validate star rating
      if (rating < 1 || rating > 5 || isNaN(rating)) {
        return;
      }

      // Initialize road entry if not exists
      if (!roadMap.has(roadName)) {
        roadMap.set(roadName, {
          total_m: 0,
          stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      }

      const roadData = roadMap.get(roadName)!;
      roadData.total_m += length;
      roadData.stars[rating] += length;
    });

    // Convert to array and transform to kilometers
    const results: RoadStarRatingByName[] = [];
    
    roadMap.forEach((data, roadName) => {
      const metersToKm = (meters: number) => Math.round(meters / 100) / 10;
      
      results.push({
        road_name: roadName,
        total_km: metersToKm(data.total_m),
        '5star': metersToKm(data.stars[5]),
        '4star': metersToKm(data.stars[4]),
        '3star': metersToKm(data.stars[3]),
        '2star': metersToKm(data.stars[2]),
        '1star': metersToKm(data.stars[1]),
      });
    });

    console.log(`✅ Fetched star ratings for ${results.length} roads (${vehicleType})`);
    
    return results;
  } catch (error) {
    console.error('❌ Error in fetchRoadStarRatingsByName:', error);
    return [];
  }
}