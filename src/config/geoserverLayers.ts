/**
 * GeoServer Layer Configuration
 * 
 * Configure this file with your city-specific GeoServer details.
 * See geoserverLayers.template.ts for detailed documentation.
 */

// IMPORTANT: Update these URLs with your GeoServer instance
export const GEOSERVER_WMS_URL = 'https://your-geoserver.com/geoserver/BOHOL_CWIS/wms';

export interface GeoServerLayer {
  id: string;
  name: string;
  geoserverLayer: string;
  sector: string;
  opacity: number;
}

// Map layer IDs to scenario-specific GeoServer layer names
// UPDATE workspace prefix (e.g., 'YOUR_WORKSPACE:') with your actual workspace
const layerScenarioMap: Record<string, Record<string, string>> = {
  // Heat Stress Layers (with scenario projections)
  heat_hhi: {
    '2015': 'YOUR_WORKSPACE:HHI_2015',
    '2016': 'YOUR_WORKSPACE:HHI_2016',
    '2017': 'YOUR_WORKSPACE:HHI_2017',
    '2018': 'YOUR_WORKSPACE:HHI_2018',
    '2019': 'YOUR_WORKSPACE:HHI_2019',
    '2020': 'YOUR_WORKSPACE:HHI_2020',
    '2021': 'YOUR_WORKSPACE:HHI_2021',
    '2022': 'YOUR_WORKSPACE:HHI_2022',
    '2023': 'YOUR_WORKSPACE:HHI_2023',
    '2024': 'YOUR_WORKSPACE:HHI_2024',
    baseline_2025: 'YOUR_WORKSPACE:HHI_2025',
    ssp1_2040: 'YOUR_WORKSPACE:HHI_2040_SSP1',
    ssp2_2040: 'YOUR_WORKSPACE:HHI_2040_SSP2',
    ssp5_2040: 'YOUR_WORKSPACE:HHI_2040_SSP5',
  },
  heat_lst: {
    '2015': 'YOUR_WORKSPACE:LST_2015',
    '2016': 'YOUR_WORKSPACE:LST_2016',
    '2017': 'YOUR_WORKSPACE:LST_2017',
    '2018': 'YOUR_WORKSPACE:LST_2018',
    '2019': 'YOUR_WORKSPACE:LST_2019',
    '2020': 'YOUR_WORKSPACE:LST_2020',
    '2021': 'YOUR_WORKSPACE:LST_2021',
    '2022': 'YOUR_WORKSPACE:LST_2022',
    '2023': 'YOUR_WORKSPACE:LST_2023',
    '2024': 'YOUR_WORKSPACE:LST_2024',
    baseline_2025: 'YOUR_WORKSPACE:LST_2025',
    ssp1_2040: 'YOUR_WORKSPACE:LST_2040_SSP1',
    ssp2_2040: 'YOUR_WORKSPACE:LST_2040_SSP2',
    ssp5_2040: 'YOUR_WORKSPACE:LST_2040_SSP5',
  },
  heat_ast: {
    '2015': 'YOUR_WORKSPACE:AST_2015',
    '2016': 'YOUR_WORKSPACE:AST_2016',
    '2017': 'YOUR_WORKSPACE:AST_2017',
    '2018': 'YOUR_WORKSPACE:AST_2018',
    '2019': 'YOUR_WORKSPACE:AST_2019',
    '2020': 'YOUR_WORKSPACE:AST_2020',
    '2021': 'YOUR_WORKSPACE:AST_2021',
    '2022': 'YOUR_WORKSPACE:AST_2022',
    '2023': 'YOUR_WORKSPACE:AST_2023',
    '2024': 'YOUR_WORKSPACE:AST_2024',
    baseline_2025: 'YOUR_WORKSPACE:AST_2025',
    ssp1_2040: 'YOUR_WORKSPACE:AST_2040_SSP1',
    ssp2_2040: 'YOUR_WORKSPACE:AST_2040_SSP2',
    ssp5_2040: 'YOUR_WORKSPACE:AST_2040_SSP5',
  },
  heat_wbt: {
    '2015': 'YOUR_WORKSPACE:WBT_2015',
    '2016': 'YOUR_WORKSPACE:WBT_2016',
    '2017': 'YOUR_WORKSPACE:WBT_2017',
    '2018': 'YOUR_WORKSPACE:WBT_2018',
    '2019': 'YOUR_WORKSPACE:WBT_2019',
    '2020': 'YOUR_WORKSPACE:WBT_2020',
    '2021': 'YOUR_WORKSPACE:WBT_2021',
    '2022': 'YOUR_WORKSPACE:WBT_2022',
    '2023': 'YOUR_WORKSPACE:WBT_2023',
    '2024': 'YOUR_WORKSPACE:WBT_2024',
    baseline_2025: 'YOUR_WORKSPACE:WBT_2025',
    ssp1_2040: 'YOUR_WORKSPACE:WBT_2040_SSP1',
    ssp2_2040: 'YOUR_WORKSPACE:WBT_2040_SSP2',
    ssp5_2040: 'YOUR_WORKSPACE:WBT_2040_SSP5',
  },
  heat_wbgt: {
    '2015': 'YOUR_WORKSPACE:WBGT_2015',
    '2016': 'YOUR_WORKSPACE:WBGT_2016',
    '2017': 'YOUR_WORKSPACE:WBGT_2017',
    '2018': 'YOUR_WORKSPACE:WBGT_2018',
    '2019': 'YOUR_WORKSPACE:WBGT_2019',
    '2020': 'YOUR_WORKSPACE:WBGT_2020',
    '2021': 'YOUR_WORKSPACE:WBGT_2021',
    '2022': 'YOUR_WORKSPACE:WBGT_2022',
    '2023': 'YOUR_WORKSPACE:WBGT_2023',
    '2024': 'YOUR_WORKSPACE:WBGT_2024',
    baseline_2025: 'YOUR_WORKSPACE:WBGT_2025',
    ssp1_2040: 'YOUR_WORKSPACE:WBGT_2040_SSP1',
    ssp2_2040: 'YOUR_WORKSPACE:WBGT_2040_SSP2',
    ssp5_2040: 'YOUR_WORKSPACE:WBGT_2040_SSP5',
  },
  heat_uhi: {
    '2015': 'YOUR_WORKSPACE:UHI_2015',
    '2016': 'YOUR_WORKSPACE:UHI_2016',
    '2017': 'YOUR_WORKSPACE:UHI_2017',
    '2018': 'YOUR_WORKSPACE:UHI_2018',
    '2019': 'YOUR_WORKSPACE:UHI_2019',
    '2020': 'YOUR_WORKSPACE:UHI_2020',
    '2021': 'YOUR_WORKSPACE:UHI_2021',
    '2022': 'YOUR_WORKSPACE:UHI_2022',
    '2023': 'YOUR_WORKSPACE:UHI_2023',
    '2024': 'YOUR_WORKSPACE:UHI_2024',
    baseline_2025: 'YOUR_WORKSPACE:UHI_2025',
    ssp1_2040: 'YOUR_WORKSPACE:UHI_2025',
    ssp2_2040: 'YOUR_WORKSPACE:UHI_2025',
    ssp5_2040: 'YOUR_WORKSPACE:UHI_2025',
  },
  heat_rh: {
    '2015': 'YOUR_WORKSPACE:RH_2015',
    '2016': 'YOUR_WORKSPACE:RH_2016',
    '2017': 'YOUR_WORKSPACE:RH_2017',
    '2018': 'YOUR_WORKSPACE:RH_2018',
    '2019': 'YOUR_WORKSPACE:RH_2019',
    '2020': 'YOUR_WORKSPACE:RH_2020',
    '2021': 'YOUR_WORKSPACE:RH_2021',
    '2022': 'YOUR_WORKSPACE:RH_2022',
    '2023': 'YOUR_WORKSPACE:RH_2023',
    '2024': 'YOUR_WORKSPACE:RH_2024',
    baseline_2025: 'YOUR_WORKSPACE:RH_2025',
    ssp1_2040: 'YOUR_WORKSPACE:RH_2025',
    ssp2_2040: 'YOUR_WORKSPACE:RH_2025',
    ssp5_2040: 'YOUR_WORKSPACE:RH_2025',
  },

  // Air Pollution Layers (baseline only)
  air_aqi: {
    baseline_2025: 'YOUR_WORKSPACE:Air_AQI',
    ssp1_2040: 'YOUR_WORKSPACE:Air_AQI',
    ssp2_2040: 'YOUR_WORKSPACE:Air_AQI',
    ssp5_2040: 'YOUR_WORKSPACE:Air_AQI',
  },
  air_co: {
    baseline_2025: 'YOUR_WORKSPACE:Air_CO',
    ssp1_2040: 'YOUR_WORKSPACE:Air_CO',
    ssp2_2040: 'YOUR_WORKSPACE:Air_CO',
    ssp5_2040: 'YOUR_WORKSPACE:Air_CO',
  },
  air_no2: {
    baseline_2025: 'YOUR_WORKSPACE:Air_NO2',
    ssp1_2040: 'YOUR_WORKSPACE:Air_NO2',
    ssp2_2040: 'YOUR_WORKSPACE:Air_NO2',
    ssp5_2040: 'YOUR_WORKSPACE:Air_NO2',
  },
  air_o3: {
    baseline_2025: 'YOUR_WORKSPACE:Air_O3',
    ssp1_2040: 'YOUR_WORKSPACE:Air_O3',
    ssp2_2040: 'YOUR_WORKSPACE:Air_O3',
    ssp5_2040: 'YOUR_WORKSPACE:Air_O3',
  },
  air_pm10: {
    baseline_2025: 'YOUR_WORKSPACE:Air_PM10',
    ssp1_2040: 'YOUR_WORKSPACE:Air_PM10',
    ssp2_2040: 'YOUR_WORKSPACE:Air_PM10',
    ssp5_2040: 'YOUR_WORKSPACE:Air_PM10',
  },
  air_pm25: {
    baseline_2025: 'YOUR_WORKSPACE:Air_PM25',
    ssp1_2040: 'YOUR_WORKSPACE:Air_PM25',
    ssp2_2040: 'YOUR_WORKSPACE:Air_PM25',
    ssp5_2040: 'YOUR_WORKSPACE:Air_PM25',
  },
  air_so2: {
    baseline_2025: 'YOUR_WORKSPACE:Air_SO2',
    ssp1_2040: 'YOUR_WORKSPACE:Air_SO2',
    ssp2_2040: 'YOUR_WORKSPACE:Air_SO2',
    ssp5_2040: 'YOUR_WORKSPACE:Air_SO2',
  },

  // Flood Layer
  flood_fhi: {
    baseline_2025: 'WorldBank_Bohol:Flood_Hazard',
    ssp1_2040: 'WorldBank_Bohol:Flood_Hazard',
    ssp2_2040: 'WorldBank_Bohol:Flood_Hazard',
    ssp5_2040: 'WorldBank_Bohol:Flood_Hazard',
  },

  // Multi-Hazard Assessment
  multihazard_assessment: {
    baseline_2025: 'YOUR_WORKSPACE:Multi_Hazard',
    ssp1_2040: 'YOUR_WORKSPACE:Multi_Hazard',
    ssp2_2040: 'YOUR_WORKSPACE:Multi_Hazard',
    ssp5_2040: 'YOUR_WORKSPACE:Multi_Hazard',
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CWIS CLIMATE HAZARD LAYERS (6 layers for Bohol CWIS Dashboard)
  // ⚠️ IMPORTANT: CWIS layers do NOT use scenario mapping
  // ⚠️ These layers are handled by getCWISLayerWMSUrl() in /config/cwisLayersConfig.ts
  // ⚠️ DO NOT add CWIS layers to layerScenarioMap - they are direct WMS layers
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // ✅ CWIS layers configured in /config/cwisLayersConfig.ts:
  // - storm_surge (ENABLED)
  // - flood_hazard (DISABLED - placeholder)
  // - urban_waterlogging (DISABLED - placeholder)
  // - land_surface_temperature (DISABLED - placeholder)
  // - urban_heat_island (DISABLED - placeholder)
  // - wet_bulb_temperature (DISABLED - placeholder)
  
  /* REMOVED - CWIS layers don't use scenarios
  storm_surge: {
    baseline_2025: 'WorldBank_Bohol:StormSurge',
    ssp1_2040: 'WorldBank_Bohol:StormSurge',
    ssp2_2040: 'WorldBank_Bohol:StormSurge',
    ssp5_2040: 'WorldBank_Bohol:StormSurge',
  },
  */
};

// Layer definitions with opacity
export const geoserverLayers: Record<string, GeoServerLayer> = {
  // Heat Stress Layers
  heat_hhi: {
    id: 'heat_hhi',
    name: 'Heat Stress Hazard Index (HHI)',
    geoserverLayer: 'YOUR_WORKSPACE:HHI_2025',
    sector: 'heat',
    opacity: 0.7,
  },
  heat_lst: {
    id: 'heat_lst',
    name: 'Land Surface Temperature (LST)',
    geoserverLayer: 'YOUR_WORKSPACE:LST_2025',
    sector: 'heat',
    opacity: 0.7,
  },
  heat_ast: {
    id: 'heat_ast',
    name: 'Air Surface Temperature',
    geoserverLayer: 'YOUR_WORKSPACE:AST_2025',
    sector: 'heat',
    opacity: 0.7,
  },
  heat_wbt: {
    id: 'heat_wbt',
    name: 'Wet-Bulb Temperature (WBT)',
    geoserverLayer: 'YOUR_WORKSPACE:WBT_2025',
    sector: 'heat',
    opacity: 0.7,
  },
  heat_wbgt: {
    id: 'heat_wbgt',
    name: 'Wet-Bulb Globe Temperature (WBGT)',
    geoserverLayer: 'YOUR_WORKSPACE:WBGT_2025',
    sector: 'heat',
    opacity: 0.7,
  },
  heat_uhi: {
    id: 'heat_uhi',
    name: 'Urban Heat Island (UHI)',
    geoserverLayer: 'YOUR_WORKSPACE:UHI_2025',
    sector: 'heat',
    opacity: 0.7,
  },
  heat_rh: {
    id: 'heat_rh',
    name: 'Relative Humidity (RH)',
    geoserverLayer: 'YOUR_WORKSPACE:RH_2025',
    sector: 'heat',
    opacity: 0.7,
  },

  // Air Pollution Layers
  air_aqi: {
    id: 'air_aqi',
    name: 'Air Quality Index (AQI)',
    geoserverLayer: 'YOUR_WORKSPACE:Air_AQI',
    sector: 'air',
    opacity: 0.7,
  },
  air_co: {
    id: 'air_co',
    name: 'CO (Carbon Monoxide)',
    geoserverLayer: 'YOUR_WORKSPACE:Air_CO',
    sector: 'air',
    opacity: 0.7,
  },
  air_no2: {
    id: 'air_no2',
    name: 'NO₂ (Nitrogen Dioxide)',
    geoserverLayer: 'YOUR_WORKSPACE:Air_NO2',
    sector: 'air',
    opacity: 0.7,
  },
  air_o3: {
    id: 'air_o3',
    name: 'O₃ (Ozone)',
    geoserverLayer: 'YOUR_WORKSPACE:Air_O3',
    sector: 'air',
    opacity: 0.7,
  },
  air_pm10: {
    id: 'air_pm10',
    name: 'PM10',
    geoserverLayer: 'YOUR_WORKSPACE:Air_PM10',
    sector: 'air',
    opacity: 0.7,
  },
  air_pm25: {
    id: 'air_pm25',
    name: 'PM2.5',
    geoserverLayer: 'YOUR_WORKSPACE:Air_PM25',
    sector: 'air',
    opacity: 0.7,
  },
  air_so2: {
    id: 'air_so2',
    name: 'SO₂ (Sulfur Dioxide)',
    geoserverLayer: 'YOUR_WORKSPACE:Air_SO2',
    sector: 'air',
    opacity: 0.7,
  },

  // Flood Layer
  flood_fhi: {
    id: 'flood_fhi',
    name: 'Urban Flooding',
    geoserverLayer: 'WorldBank_Bohol:Flood_Hazard',
    sector: 'flood',
    opacity: 0.7,
  },

  // Multi-Hazard
  multihazard_assessment: {
    id: 'multihazard_assessment',
    name: 'Multi-Hazard Assessment',
    geoserverLayer: 'YOUR_WORKSPACE:Multi_Hazard',
    sector: 'multihazard',
    opacity: 0.7,
  },

  // Base Layers
  road_network_base: {
    id: 'road_network_base',
    name: 'Road Network',
    geoserverLayer: 'YOUR_WORKSPACE:Road_Network',
    sector: 'base',
    opacity: 1.0,
  },
  slum_settlements: {
    id: 'slum_settlements',
    name: 'Slum',
    geoserverLayer: 'YOUR_WORKSPACE:Slum',
    sector: 'base',
    opacity: 0.7,
  },
  builtup_density: {
    id: 'builtup_density',
    name: 'Built-up Density',
    geoserverLayer: 'WorldBank_Bohol:Grid',
    sector: 'base',
    opacity: 0.7,
  },
  built_up: {
    id: 'built_up',
    name: 'Built-up',
    geoserverLayer: 'YOUR_WORKSPACE:Builtup',
    sector: 'base',
    opacity: 0.7,
  },
  buildings: {
    id: 'buildings',
    name: 'Buildings',
    geoserverLayer: 'WorldBank_Bohol:Buildings',
    sector: 'base',
    opacity: 0.7,
  },
  elevation: {
    id: 'elevation',
    name: 'Elevation',
    geoserverLayer: 'WorldBank_Bohol:Elevation',
    sector: 'base',
    opacity: 0.7,
  },
  ndvi: {
    id: 'ndvi',
    name: 'Green Cover (NDVI)',
    geoserverLayer: 'WorldBank_Bohol:NDVI',
    sector: 'base',
    opacity: 0.7,
  },
  municipal_boundary: {
    id: 'municipal_boundary',
    name: 'Municipal Boundary',
    geoserverLayer: 'YOUR_WORKSPACE:Municipal_Boundary',
    sector: 'base',
    opacity: 1.0,
  },
};

// Helper function to get layer name for a specific scenario
export function getLayerNameForScenario(layerId: string, scenario: string): string | null {
  if (layerScenarioMap[layerId]) {
    if (layerScenarioMap[layerId][scenario]) {
      return layerScenarioMap[layerId][scenario];
    }
  }
  
  return geoserverLayers[layerId]?.geoserverLayer || null;
}

// Helper function to build WMS tile URL
export function getWMSTileUrl(
  layerName: string, 
  wardNumber?: number | null, 
  forceWMS?: boolean, 
  categoryName?: string | null,
  munName?: string | null,
  brgyName?: string | null
): string {
  const wmsUrl = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/wms';
  const wmtsBaseUrl = 'https://geoserver.azure.innpact.ai/geoserver/gwc/service/wmts';
  
  const requiresWMS = layerName.includes('Multi_Hazard');
  
  if (forceWMS || requiresWMS || (wardNumber !== null && wardNumber !== undefined) || (categoryName !== null && categoryName !== undefined) || (munName !== null && munName !== undefined && munName !== 'all') || (brgyName !== null && brgyName !== undefined && brgyName !== 'all')) {
    let url = `${wmsUrl}?service=WMS&version=1.1.0&request=GetMap&layers=${layerName}&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&styles=&format=image/png&transparent=true`;
    
    const filters: string[] = [];
    
    // LGU filter
    if (munName !== null && munName !== undefined && munName !== 'all') {
      const escapedMunName = munName.replace(/'/g, "''");
      filters.push(`MunName='${escapedMunName}'`);
    }
    
    // Barangay filter (more specific than LGU)
    if (brgyName !== null && brgyName !== undefined && brgyName !== 'all') {
      const escapedBrgyName = brgyName.replace(/'/g, "''");
      filters.push(`BrgyName='${escapedBrgyName}'`);
    }
    
    // Ward filter
    if (wardNumber !== null && wardNumber !== undefined) {
      filters.push(`Ward=${wardNumber}`);
    }
    
    // Category filter
    if (categoryName !== null && categoryName !== undefined) {
      const escapedCategory = categoryName.replace(/'/g, "''");
      filters.push(`Type='${escapedCategory}'`);
      console.log('🎯 [getWMSTileUrl] Adding Type filter:', `Type='${escapedCategory}'`);
    }
    
    if (filters.length > 0) {
      const cqlFilter = filters.join(' AND ');
      url += `&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
      console.log('🌐 [getWMSTileUrl] Applied CQL_FILTER:', cqlFilter);
    }
    
    console.log('✅ [getWMSTileUrl] Returning WMS URL:', url);
    return url;
  }
  
  const wmtsUrl = `${wmtsBaseUrl}?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=${layerName}&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=image/png&TILECOL={x}&TILEROW={y}`;
  
  console.log('✅ [getWMSTileUrl] Returning WMTS URL:', wmtsUrl);
  return wmtsUrl;
}