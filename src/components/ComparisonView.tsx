/**
 * Comparison View Component
 * Split-screen comparison with vertical swipe divider
 * Synced zoom and pan between left and right maps
 * Full layer system matching main application
 */

import React, { useState, useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl@5.15.0';
import 'maplibre-gl/dist/maplibre-gl.css';
import { X, Flame, Wind, Droplets, AlertTriangle, ChevronDown, Maximize2, Minimize2, Layers, Loader2, Home, ZoomIn, ZoomOut, Map, Satellite, Info, Box, Building2 } from 'lucide-react';
import type { Sector, Scenario, Basemap } from '../App';
import { getLayerNameForScenario, getWMSTileUrl } from '../config/geoserverLayers';
import { getCWISLayerWMSUrl } from '../config/cwisLayersConfig';
import { getEnvironmentalLayerWMSUrl } from '../config/environmentalLayers';
import { getUILayerLegend, type LegendEntry } from '../utils/legendLoader';
import { Header } from './Header';
import { BuildingPopup } from './BuildingPopup';
import { WardPopup } from './WardPopup';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { fetchAreaDistribution, type AreaDistributionData } from '../utils/areaCalculation';

/**
 * Helper function to safely extract ward number from selectedWardId
 * Handles both old format (ward_15_Name) and new format (BrgyID)
 * Returns null if ward number cannot be extracted
 */
const extractWardNumber = (selectedWardId: string | null): number | null => {
  if (!selectedWardId || selectedWardId === 'all') {
    return null;
  }
  
  // Check if selectedWardId is a string (defensive programming)
  if (typeof selectedWardId !== 'string') {
    console.warn('⚠️ selectedWardId is not a string:', selectedWardId, 'Type:', typeof selectedWardId);
    return null;
  }
  
  // Try to extract ward number from old format: "ward_15_Barangay_Name" -> 15
  if (selectedWardId.includes('_')) {
    const parts = selectedWardId.split('_');
    if (parts.length >= 2) {
      const wardNum = parseInt(parts[1]);
      if (!isNaN(wardNum)) {
        return wardNum;
      }
    }
  }
  
  // New format (BrgyID): Cannot extract ward number, return null
  // Barangay filtering should be done by BrgyID instead of Ward number
  console.warn('⚠️ Cannot extract ward number from BrgyID format:', selectedWardId);
  return null;
};

interface ComparisonViewProps {
  onClose: () => void;
  basemap: Basemap;
  scenario: Scenario;
  selectedWardId: string;
  onWardSelect: (wardId: string, wardName: string) => void;
  
  // Left side
  leftSector: Sector;
  leftLayer: string;
  leftScenario: Scenario;
  onLeftSectorChange: (sector: Sector) => void;
  onLeftLayerChange: (layer: string) => void;
  onLeftScenarioChange: (scenario: Scenario) => void;
  
  // Right side
  rightSector: Sector;
  rightLayer: string;
  rightScenario: Scenario;
  onRightSectorChange: (sector: Sector) => void;
  onRightLayerChange: (layer: string) => void;
  onRightScenarioChange: (scenario: Scenario) => void;
}

// Building popup data interface
interface BuildingPopupData {
  buildingUse: string;
  ward: string;
  floors: string;
  hhi2025: string;
  airAqi: string;
  floodHazard: string;
  multiHazard: string;
  lng: number;
  lat: number;
  x: number;
  y: number;
  mapSide: string;
}

// Sector configurations (3 groups for Bohol CWIS)
const SECTORS = [
  { id: 'base_layers' as Sector, name: 'Base Layers', icon: Map, color: '#64748B' },
  { id: 'climate_hazard' as Sector, name: 'Climate Hazard Layers', icon: AlertTriangle, color: '#3B82F6' },
  { id: 'env_vulnerability' as Sector, name: 'Environmental Vulnerability', icon: Layers, color: '#10B981' },
];

// Layer configurations per sector
const SECTOR_LAYERS: Partial<Record<Sector, Array<{ id: string; name: string }>>> = {
  base_layers: [
    { id: 'elevation',      name: 'Elevation' },
    { id: 'builtup_density', name: 'Built-up Density' },
  ],
  climate_hazard: [
    { id: 'flood_fhi',    name: 'Flood Hazard Index' },
    { id: 'flood_hazard', name: 'Urban Flooding' },
    { id: 'storm_surge',  name: 'Storm Surge' },
  ],
  env_vulnerability: [
    { id: 'soil_classification',                 name: 'Soil Classification' },
    { id: 'groundwater_depth',                   name: 'Groundwater Depth' },
    { id: 'geology',                             name: 'Geology' },
    { id: 'sinkhole',                            name: 'Sinkhole' },
    { id: 'groundwater_infiltration_vulnerability', name: 'Groundwater Infiltration' },
  ],
};

/**
 * Route a comparison layer ID + sector to the correct WMS tile URL.
 * Handles base layers (WMS direct), CWIS climate hazard layers, and
 * environmental vulnerability layers each via their own config.
 */
function getComparisonLayerTileUrl(sector: string, layerId: string): string | null {
  if (sector === 'base_layers') {
    const names: Record<string, string> = {
      elevation: 'WorldBank_Bohol:Elevation',
      builtup_density: 'WorldBank_Bohol:Builtup_Density',
    };
    const ln = names[layerId];
    return ln ? getWMSTileUrl(ln) : null;
  }
  if (sector === 'climate_hazard') {
    // flood_fhi goes through the standard scenario GeoServer layer
    if (layerId === 'flood_fhi') {
      const ln = getLayerNameForScenario(layerId, 'baseline_2025');
      return ln ? getWMSTileUrl(ln) : null;
    }
    // flood_hazard and storm_surge use the CWIS WMS URL
    return getCWISLayerWMSUrl(layerId) ?? null;
  }
  if (sector === 'env_vulnerability') {
    return getEnvironmentalLayerWMSUrl(layerId) ?? null;
  }
  // Fallback for legacy sector IDs
  const ln = getLayerNameForScenario(layerId, 'baseline_2025');
  return ln ? getWMSTileUrl(ln) : null;
}

// Bohol coordinates
const BOHOL_CENTER: [number, number] = [124.1139, 9.8399];
const INITIAL_ZOOM = 11.5;

// Bohol city bounds (Southwest, Northeast corners) for responsive viewport fitting
const BOHOL_BOUNDS: [[number, number], [number, number]] = [
  [123.7, 9.4],    // Southwest corner (lng, lat)
  [124.6, 10.2]    // Northeast corner (lng, lat)
];

// Get basemap style
function getBasemapStyle(basemap: Basemap): string | any {
  const styles = {
    light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', // WITH labels
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', // WITH labels
    satellite: {
      version: 8,
      sources: {
        'satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256
        },
        'labels': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256
        }
      },
      layers: [
        {
          id: 'satellite',
          type: 'raster',
          source: 'satellite',
          minzoom: 0,
          maxzoom: 22
        },
        {
          id: 'labels',
          type: 'raster',
          source: 'labels',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    }
  };
  
  return basemap === 'satellite' ? styles.satellite : (styles[basemap] || styles.light);
}

/**
 * 🔒 STRICT BUILDINGS VERIFICATION FUNCTION (COMPARISON VIEW)
 * Verifies that buildings are actually loaded, visible, and rendered before hiding loading indicator.
 * Returns true if buildings are fully ready, false otherwise.
 */
function verifyBuildingsAreActuallyVisible(map: maplibregl.Map, mapSide: string): boolean {
  console.log(`🔍 [${mapSide}] Starting buildings verification...`);
  
  // Enhanced map validity checks - map might be destroyed during async operations
  if (!map || !map.getSource || !map.getLayer) {
    console.log(`❌ [${mapSide}] Buildings verification failed: Map not available`);
    return false;
  }
  
  try {
    // Use the correct source ID with map side suffix
    const buildingsSourceId = `buildings_${mapSide.toLowerCase()}`;
    
    // Check 1: Source exists
    const buildingsSource = map.getSource(buildingsSourceId) as maplibregl.GeoJSONSource;
    if (!buildingsSource) {
      console.log(`❌ [${mapSide}] Buildings verification failed: Source "${buildingsSourceId}" does not exist`);
      return false;
    }
    console.log(`  ✓ [${mapSide}] Source exists`);
    
    // Check 2: All layers exist (with map side suffix)
    const mapSideLower = mapSide.toLowerCase();
    const buildingsLayer = map.getLayer(`buildings_${mapSideLower}`);
    const buildingsFillLayer = map.getLayer(`buildings-fill_${mapSideLower}`);
    const buildings3DLayer = map.getLayer(`buildings-3d_${mapSideLower}`);
    const buildingsHighlightLayer = map.getLayer(`buildings-highlight_${mapSideLower}`);
    
    if (!buildingsLayer || !buildingsFillLayer || !buildings3DLayer || !buildingsHighlightLayer) {
      console.log(`❌ [${mapSide}] Buildings verification failed: One or more layers missing`, {
        buildings: !!buildingsLayer,
        buildingsFill: !!buildingsFillLayer,
        buildings3D: !!buildings3DLayer,
        buildingsHighlight: !!buildingsHighlightLayer
      });
      return false;
    }
    console.log(`  ✓ [${mapSide}] All 4 layers exist`);
    
    // Check 3: At least one layer is visible (either 2D or 3D mode)
    const fillVisible = map.getLayoutProperty(`buildings-fill_${mapSideLower}`, 'visibility') === 'visible';
    const threeDVisible = map.getLayoutProperty(`buildings-3d_${mapSideLower}`, 'visibility') === 'visible';
    
    console.log(`  ℹ️  [${mapSide}] Layer visibility: fill=${fillVisible}, 3D=${threeDVisible}`);
    
    if (!fillVisible && !threeDVisible) {
      console.log(`❌ [${mapSide}] Buildings verification failed: All layers are hidden`);
      return false;
    }
    console.log(`  ✓ [${mapSide}] At least one layer is visible`);
    
    // Check 4: Map style is loaded (LENIENT - only for initial verification, not for viewport updates)
    // During panning/zooming, the style might be actively rendering, so we skip this check
    // if the basic layer checks passed (source exists + layers exist + layers visible)
    try {
      if (!map.isStyleLoaded || !map.isStyleLoaded()) {
        console.log(`⚠️  [${mapSide}] Style not fully loaded, but layers exist and are visible - PASSING anyway`);
        // Don't fail - if layers exist and are visible, that's sufficient
      } else {
        console.log(`  ✓ [${mapSide}] Style is loaded`);
      }
    } catch (error) {
      console.log(`⚠️  [${mapSide}] Could not check style loaded state, but layers exist - PASSING anyway`);
      // Continue anyway - if layers exist and are visible, that's good enough
    }
    
    console.log(`✅ [${mapSide}] Buildings verification PASSED: All checks complete`);
    return true;
  } catch (error) {
    console.log(`❌ [${mapSide}] Buildings verification failed with error (map may be destroyed):`, error);
    return false;
  }
}

export function ComparisonView(props: ComparisonViewProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftMapRef = useRef<maplibregl.Map | null>(null);
  const rightMapRef = useRef<maplibregl.Map | null>(null);
  const leftMapContainerRef = useRef<HTMLDivElement>(null);
  const rightMapContainerRef = useRef<HTMLDivElement>(null);
  const [mapsReady, setMapsReady] = useState({ left: false, right: false });
  const [layersFullyLoaded, setLayersFullyLoaded] = useState({ left: false, right: false });
  const syncingRef = useRef(false);
  const previousWardRef = useRef<string>('all'); // Track previous ward selection
  const wardBoundariesDataRef = useRef<any>(null); // Store ward boundaries GeoJSON
  
  // Track selected building IDs for persistent highlight
  const selectedBuildingIdRefLeft = useRef<string | number | null>(null);
  const selectedBuildingIdRefRight = useRef<string | number | null>(null);

  // Layer opacity states (matching main app)
  const [leftOpacity, setLeftOpacity] = useState(0.7);
  const [rightOpacity, setRightOpacity] = useState(0.7);

  // Basemap state - single basemap for both maps
  const [currentBasemap, setCurrentBasemap] = useState<Basemap>('light');
  const [basemapSwitcherOpen, setBasemapSwitcherOpen] = useState(false);
  const [attributionOpen, setAttributionOpen] = useState(true);
  const [is3DMode, setIs3DMode] = useState(false); // Track 3D mode state
  const [showBuildings, setShowBuildings] = useState(false); // Toggle building use layer visibility

  // Building popup states
  const [buildingPopupData, setBuildingPopupData] = useState<BuildingPopupData | null>(null);
  
  // Ward popup states
  const [leftWardPopupData, setLeftWardPopupData] = useState<{
    wardName: string;
    wardNumber: string;
    population?: string;
    area?: string;
    density?: string;
    households?: string;
    buildings?: string;
    zone?: string;
    lguName?: string;
    lng: number;
    lat: number;
    x: number;
    y: number;
  } | null>(null);
  
  const [rightWardPopupData, setRightWardPopupData] = useState<{
    wardName: string;
    wardNumber: string;
    population?: string;
    area?: string;
    density?: string;
    households?: string;
    buildings?: string;
    zone?: string;
    lguName?: string;
    lng: number;
    lat: number;
    x: number;
    y: number;
  } | null>(null);
  
  // Track current zoom for buildings layer - separate for each map
  const [leftZoom, setLeftZoom] = useState<number>(INITIAL_ZOOM);
  const [rightZoom, setRightZoom] = useState<number>(INITIAL_ZOOM);
  
  // Track buildings loading state - SEPARATE for each map to ensure both load together
  const [isBuildingsLoadingLeft, setIsBuildingsLoadingLeft] = useState(false);
  const [isBuildingsLoadingRight, setIsBuildingsLoadingRight] = useState(false);
  
  // Track hazard layer loading state - SEPARATE for each map
  const [isHazardLayerLoadingLeft, setIsHazardLayerLoadingLeft] = useState(false);
  const [isHazardLayerLoadingRight, setIsHazardLayerLoadingRight] = useState(false);
  
  // Store references to viewport reload handlers so we can clean them up
  const leftReloadHandlerRef = useRef<(() => void) | null>(null);
  const rightReloadHandlerRef = useRef<(() => void) | null>(null);
  
  // Combined loading state - show indicator when EITHER map is loading (buildings OR hazard layers)
  const isBuildingsLoading = isBuildingsLoadingLeft || isBuildingsLoadingRight;
  const isHazardLayerLoading = isHazardLayerLoadingLeft || isHazardLayerLoadingRight;
  
  // Log buildings loading state changes for debugging and ensure synchronized loading
  useEffect(() => {
    if (isBuildingsLoadingLeft && isBuildingsLoadingRight) {
      console.log(`🔄 BOTH MAPS: Buildings loading started simultaneously`);
    } else if (!isBuildingsLoadingLeft && !isBuildingsLoadingRight && !isBuildingsLoading) {
      console.log(`✅ BOTH MAPS: Buildings loading complete - synchronized!`);
    } else if (isBuildingsLoadingLeft && !isBuildingsLoadingRight) {
      console.log(`⏳ LEFT ONLY: Buildings loading (waiting for RIGHT map)`);
    } else if (!isBuildingsLoadingLeft && isBuildingsLoadingRight) {
      console.log(`⏳ RIGHT ONLY: Buildings loading (waiting for LEFT map)`);
    }
    console.log(`   State: LEFT=${isBuildingsLoadingLeft}, RIGHT=${isBuildingsLoadingRight}, COMBINED=${isBuildingsLoading}`);
  }, [isBuildingsLoadingLeft, isBuildingsLoadingRight, isBuildingsLoading]);

  // Debug props on mount and when they change
  useEffect(() => {
    console.log('🔍 COMPARISON VIEW PROPS:', {
      left: { sector: props.leftSector, layer: props.leftLayer, scenario: props.leftScenario },
      right: { sector: props.rightSector, layer: props.rightLayer, scenario: props.rightScenario }
    });
  }, [props.leftSector, props.leftLayer, props.leftScenario, props.rightSector, props.rightLayer, props.rightScenario]);

  // Initialize maps
  useEffect(() => {
    if (!leftMapContainerRef.current || !rightMapContainerRef.current) return;

    // Reset maps ready state when basemap changes
    setMapsReady({ left: false, right: false });
    setLayersFullyLoaded({ left: false, right: false });

    const leftMap = new maplibregl.Map({
      container: leftMapContainerRef.current,
      style: getBasemapStyle(currentBasemap),
      center: BOHOL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: false,
    });

    const rightMap = new maplibregl.Map({
      container: rightMapContainerRef.current,
      style: getBasemapStyle(currentBasemap),
      center: BOHOL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: false,
    });

    leftMapRef.current = leftMap;
    rightMapRef.current = rightMap;

    // Track logged errors to avoid spam (separate for each map)
    const leftLoggedErrors = new Set<string>();
    const rightLoggedErrors = new Set<string>();

    leftMap.on('load', async () => {
      console.log('🗺️ Left comparison map loaded');
      
      // Fetch Municipal_Boundary extent and fit map to study area (Tagbilaran City, Dauis, Panglao)
      try {
        const MUNICIPAL_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Municipal_Boundary&outputFormat=application/json&srsName=EPSG:4326';
        
        const response = await fetch(MUNICIPAL_WFS_URL);
        
        if (response.ok) {
          const geojson = await response.json();
          
          if (geojson && geojson.features && geojson.features.length > 0) {
            // Calculate bounding box
            let minLng = Infinity, minLat = Infinity;
            let maxLng = -Infinity, maxLat = -Infinity;
            
            geojson.features.forEach((feature: any) => {
              if (feature.geometry && feature.geometry.type === 'Polygon') {
                feature.geometry.coordinates[0].forEach((coord: [number, number]) => {
                  const [lng, lat] = coord;
                  minLng = Math.min(minLng, lng);
                  minLat = Math.min(minLat, lat);
                  maxLng = Math.max(maxLng, lng);
                  maxLat = Math.max(maxLat, lat);
                });
              } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates.forEach((polygon: any) => {
                  polygon[0].forEach((coord: [number, number]) => {
                    const [lng, lat] = coord;
                    minLng = Math.min(minLng, lng);
                    minLat = Math.min(minLat, lat);
                    maxLng = Math.max(maxLng, lng);
                    maxLat = Math.max(maxLat, lat);
                  });
                });
              }
            });
            
            const municipalBounds: [[number, number], [number, number]] = [[minLng, minLat], [maxLng, maxLat]];
            
            console.log('✅ Left map: Municipal_Boundary extent calculated');
            
            leftMap.fitBounds(municipalBounds, {
              padding: 80,
              duration: 0,
              maxZoom: 14
            });
            
            // Store bounds in both maps
            (leftMap as any)._municipalBounds = municipalBounds;
            if (rightMapRef.current) {
              (rightMapRef.current as any)._municipalBounds = municipalBounds;
            }
            
            console.log('📍 Left map fitted to Municipal_Boundary extent');
          } else {
            leftMap.fitBounds(BOHOL_BOUNDS, { padding: 80, duration: 0, maxZoom: 14 });
          }
        } else {
          leftMap.fitBounds(BOHOL_BOUNDS, { padding: 80, duration: 0, maxZoom: 14 });
        }
      } catch (error) {
        console.error('❌ Error fetching Municipal_Boundary:', error);
        leftMap.fitBounds(BOHOL_BOUNDS, { padding: 80, duration: 0, maxZoom: 14 });
      }
      
      hideBasemapBuildings(leftMap);
      normalizeCityNameCase(leftMap, 'LEFT');
      moveBasemapLabelsToTop(leftMap, currentBasemap);
      
      // Add scale control (matches main application)
      leftMap.addControl(new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
      }), 'bottom-left');
      
      setMapsReady(prev => ({ ...prev, left: true }));
    });
    
    // LEFT Map: Suppress tile loading errors
    leftMap.on('error', (e) => {
      const errorMessage = e.error?.message || e.error?.toString() || 'Unknown error';
      
      // Check if it's a hazard/heat stress layer error (WMS/WMTS)
      const isHazardLayerError = e.sourceId?.startsWith('heat-stress-') || 
                                e.sourceId?.startsWith('left-hazard-') ||
                                e.sourceId === 'heat-stress-layer' ||
                                e.sourceId === 'hazard_layer_left';
      
      if (isHazardLayerError) {
        // Suppress common expected errors
        const isSuppressedError = 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('AJAXError') ||
          errorMessage.includes('Bad Request') ||
          errorMessage.includes('CORS') ||
          errorMessage.includes('NetworkError');
        
        if (isSuppressedError) {
          // Extract layer name for deduplication
          const layerMatch = errorMessage.match(/LAYER=([^&]+)/) || errorMessage.match(/layers=([^&]+)/);
          const errorKey = layerMatch ? layerMatch[1] : `${e.sourceId}`;
          
          if (!leftLoggedErrors.has(errorKey)) {
            console.warn(`[LEFT] ⚠️ Layer loading issue (may not exist or network timeout): ${errorKey}`);
            leftLoggedErrors.add(errorKey);
          }
          return; // Don't spam console with tile errors
        }
      }
      
      // Log other unexpected errors once per source
      const errorKey = `${e.sourceId}-${errorMessage}`;
      if (!leftLoggedErrors.has(errorKey)) {
        const errorInfo = {
          type: e.type,
          error: errorMessage,
          sourceId: e.sourceId
        };
        console.error('[LEFT] Map error:', errorInfo);
        leftLoggedErrors.add(errorKey);
      }
    });

    rightMap.on('load', () => {
      console.log('🗺️ Right comparison map loaded');
      
      // Use stored municipal bounds from left map if available
      const municipalBounds = leftMapRef.current ? (leftMapRef.current as any)._municipalBounds : null;
      
      if (municipalBounds) {
        console.log('📍 Right map: Using Municipal_Boundary extent from left map');
        rightMap.fitBounds(municipalBounds, {
          padding: 80,
          duration: 0,
          maxZoom: 14
        });
        (rightMap as any)._municipalBounds = municipalBounds;
      } else {
        console.log('📍 Right map: Using fallback bounds');
        rightMap.fitBounds(BOHOL_BOUNDS, {
          padding: 80,
          duration: 0,
          maxZoom: 14
        });
      }
      console.log('📍 Right map fitted to extent');
      
      hideBasemapBuildings(rightMap);
      normalizeCityNameCase(rightMap, 'RIGHT');
      moveBasemapLabelsToTop(rightMap, currentBasemap);
      setMapsReady(prev => ({ ...prev, right: true }));
    });
    
    // RIGHT Map: Suppress tile loading errors
    rightMap.on('error', (e) => {
      const errorMessage = e.error?.message || e.error?.toString() || 'Unknown error';
      
      // Check if it's a hazard/heat stress layer error (WMS/WMTS)
      const isHazardLayerError = e.sourceId?.startsWith('heat-stress-') || 
                                e.sourceId?.startsWith('right-hazard-') ||
                                e.sourceId === 'heat-stress-layer' ||
                                e.sourceId === 'hazard_layer_right';
      
      if (isHazardLayerError) {
        // Suppress common expected errors
        const isSuppressedError = 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('AJAXError') ||
          errorMessage.includes('Bad Request') ||
          errorMessage.includes('CORS') ||
          errorMessage.includes('NetworkError');
        
        if (isSuppressedError) {
          // Extract layer name for deduplication
          const layerMatch = errorMessage.match(/LAYER=([^&]+)/) || errorMessage.match(/layers=([^&]+)/);
          const errorKey = layerMatch ? layerMatch[1] : `${e.sourceId}`;
          
          if (!rightLoggedErrors.has(errorKey)) {
            console.warn(`[RIGHT] ⚠️ Layer loading issue (may not exist or network timeout): ${errorKey}`);
            rightLoggedErrors.add(errorKey);
          }
          return; // Don't spam console with tile errors
        }
      }
      
      // Log other unexpected errors once per source
      const errorKey = `${e.sourceId}-${errorMessage}`;
      if (!rightLoggedErrors.has(errorKey)) {
        const errorInfo = {
          type: e.type,
          error: errorMessage,
          sourceId: e.sourceId
        };
        console.error('[RIGHT] Map error:', errorInfo);
        rightLoggedErrors.add(errorKey);
      }
    });

    // Sync zoom and pan
    leftMap.on('move', () => {
      if (syncingRef.current || !rightMapRef.current) return;
      syncingRef.current = true;
      rightMapRef.current.jumpTo({
        center: leftMap.getCenter(),
        zoom: leftMap.getZoom(),
        bearing: leftMap.getBearing(),
        pitch: leftMap.getPitch(),
      });
      setTimeout(() => { syncingRef.current = false; }, 0);
    });

    rightMap.on('move', () => {
      if (syncingRef.current || !leftMapRef.current) return;
      syncingRef.current = true;
      leftMapRef.current.jumpTo({
        center: rightMap.getCenter(),
        zoom: rightMap.getZoom(),
        bearing: rightMap.getBearing(),
        pitch: rightMap.getPitch(),
      });
      setTimeout(() => { syncingRef.current = false; }, 0);
    });

    // Track zoom and viewport changes for buildings layer (moveend captures both pan and zoom)
    leftMap.on('moveend', () => {
      const currentZoom = leftMap.getZoom();
      setLeftZoom(currentZoom);
      console.log(`🗺️ Left map moveend - zoom: ${currentZoom.toFixed(2)}`);
    });

    rightMap.on('moveend', () => {
      const currentZoom = rightMap.getZoom();
      setRightZoom(currentZoom);
      console.log(`🗺️ Right map moveend - zoom: ${currentZoom.toFixed(2)}`);
    });

    return () => {
      leftMap.remove();
      rightMap.remove();
    };
  }, [currentBasemap]);



  // Add ward boundaries to both maps
  useEffect(() => {
    if (!mapsReady.left || !mapsReady.right) return;
    if (!leftMapRef.current || !rightMapRef.current) return;

    const addWaterbodyLayer = async (map: maplibregl.Map, mapSide: string) => {
      const waterbodyLayerId = 'waterbody_compare';
      
      // Remove existing layer if it exists
      if (map.getLayer(waterbodyLayerId)) {
        map.removeLayer(waterbodyLayerId);
      }
      if (map.getSource(waterbodyLayerId)) {
        map.removeSource(waterbodyLayerId);
      }

      // ⚠️ DEPRECATED: Old GIZ_BBSR:Waterbody layer removed
      console.warn(`⚠️ ${mapSide} Waterbody layer not available for Bohol. Layer disabled.`);
      return;
      
      // OLD CODE (GIZ_BBSR reference removed):
      // const WATERBODY_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/GIZ_BBSR/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=GIZ_BBSR:Waterbody&outputFormat=application/json&srsName=EPSG:4326';
      try {
        const WATERBODY_WFS_URL = '';
        
        console.log(`📡 ${mapSide} Fetching waterbody data from:`, WATERBODY_WFS_URL);
        const response = await fetchWithTimeout(WATERBODY_WFS_URL, { timeout: 15000 });
        
        if (!response.ok) {
          console.warn(`⚠️ ${mapSide} Waterbody WFS request failed:`, response.status);
          return;
        }
        
        const geojson = await response.json();
        console.log(`✅ ${mapSide} Waterbody data loaded:`, geojson.features?.length, 'features');

        // Check if map still exists after async fetch
        if (!map || !map.getSource) {
          console.log(`⚠️ ${mapSide} Map was destroyed during waterbody fetch, skipping layer addition`);
          return;
        }

        // Add waterbody source
        map.addSource(waterbodyLayerId, {
          type: 'geojson',
          data: geojson
        });

        // Waterbody layer should be just below ward boundary and above hazard layers
        // Find ward-boundaries-fill layer as the reference point
        const wardFillLayerId = 'ward_boundaries_fill_compare';
        const beforeLayerId = map.getLayer(wardFillLayerId) ? wardFillLayerId : undefined;

        // Add waterbody layer with fill
        map.addLayer({
          id: waterbodyLayerId,
          type: 'fill',
          source: waterbodyLayerId,
          paint: {
            'fill-color': '#3B82F6', // Blue color
            'fill-opacity': 0.5
          }
        }, beforeLayerId);

        console.log(`✅ ${mapSide} Waterbody layer added`);
        
        // Ensure basemap labels stay on top
        moveBasemapLabelsToTop(map, currentBasemap);
      } catch (error) {
        // Silently handle fetch errors - expected when backend is unavailable
        console.log(`ℹ️  ${mapSide} Waterbody layer not available (backend not connected)`);
      }
    };

    const addWardBoundaries = async (map: maplibregl.Map, mapSide: string) => {
      const wardLayerId = 'ward_boundaries_compare';
      const wardFillLayerId = 'ward_boundaries_fill_compare';
      const wardLabelLayerId = 'ward_labels_compare';
      
      // Remove existing layers
      [wardLabelLayerId, wardFillLayerId, wardLayerId].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      
      if (map.getSource(wardLayerId)) map.removeSource(wardLayerId);

      // Fetch WFS GeoJSON for vector rendering (no tile-based label duplication)
      try {
        const WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Barangay_Boundary&outputFormat=application/json&srsName=EPSG:4326';
        
        const response = await fetchWithTimeout(WFS_URL, { timeout: 15000 });
        if (!response.ok) throw new Error(`WFS request failed: ${response.status}`);
        
        const geojson = await response.json();
        if (!geojson || !geojson.features) throw new Error('Invalid GeoJSON response');

        console.log(`✅ ${mapSide} Ward boundaries loaded: ${geojson.features.length} features`);

        // Store ward boundaries data in ref for zooming (only once)
        if (!wardBoundariesDataRef.current) {
          wardBoundariesDataRef.current = geojson;
          console.log('📦 Ward boundaries data stored in ref for zooming');
        }

        // Add GeoJSON source
        map.addSource(wardLayerId, {
          type: 'geojson',
          data: geojson,
          generateId: true,
          tolerance: 0.375,
          buffer: 64,
        });

        // Get first label layer to insert ward layers before it
        const firstLabelLayer = getFirstLabelLayerId(map);

        // Add fill layer (for clickability)
        map.addLayer({
          id: wardFillLayerId,
          type: 'fill',
          source: wardLayerId,
          minzoom: 10,
          paint: {
            'fill-color': '#2563EB',
            'fill-opacity': 0.01,
          },
        }, firstLabelLayer);

        // Add line layer (visible boundaries - dotted dark grey)
        map.addLayer({
          id: wardLayerId,
          type: 'line',
          source: wardLayerId,
          minzoom: 10,
          paint: {
            'line-color': '#374151', // Dark grey
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 0.5,
              12, 0.8,
              14, 1,
              16, 1.2
            ],
            'line-opacity': 0.7,
            'line-dasharray': [3, 3] // Dotted line pattern
          },
        }, firstLabelLayer);

        // Add ward number labels using Ward_Point layer (centroids)
        const wardLabelLayerId = 'ward_labels_compare';
        const wardPointSourceId = 'ward_points_compare';
        
        // Fetch Ward_Point GeoJSON data
        try {
          const WARD_POINT_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Barangay_Boundary_Point&outputFormat=application/json&srsName=EPSG:4326';
          
          const wardPointResponse = await fetchWithTimeout(WARD_POINT_WFS_URL, { timeout: 15000 });
          if (wardPointResponse.ok) {
            const wardPointGeojson = await wardPointResponse.json();
            
            // Add Ward_Point source
            if (!map.getSource(wardPointSourceId)) {
              map.addSource(wardPointSourceId, {
                type: 'geojson',
                data: wardPointGeojson
              });
            }
            
            // Add ward labels using Ward_Point source
            map.addLayer({
              id: wardLabelLayerId,
              type: 'symbol',
              source: wardPointSourceId, // Use Ward_Point source (centroids)
              minzoom: 10,
              layout: {
                'text-field': ['get', 'BrgyName'], // Use BrgyName field for barangay labels
                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                'text-size': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 8,
                  12, 10,
                  14, 11,
                  16, 12,
                  18, 13
                ],
                'text-anchor': 'center',
                'text-offset': [0, 0],
              },
              paint: {
                'text-color': '#1E293B',
                'text-halo-color': '#FFFFFF',
                'text-halo-width': 2,
                'text-halo-blur': 1
              }
            } as any, firstLabelLayer);
            
            console.log(`✅ ${mapSide} Ward labels added using Ward_Point layer`);
          }
        } catch (error) {
          // Silently handle timeout/network errors - ward labels are optional for visualization
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (!errorMsg.includes('timeout') && !errorMsg.includes('Failed to fetch')) {
            console.warn(`⚠️ ${mapSide} Ward label loading issue:`, errorMsg);
          }
        }

        // STRICTLY enforce basemap labels on top
        moveBasemapLabelsToTop(map, currentBasemap);

        console.log(`✅ ${mapSide} Ward boundaries added`);
        
        // Add waterbody layer (should be below ward boundaries and above hazard layers)
        await addWaterbodyLayer(map, mapSide);
        
        // Add click handler for ward popups
        const setWardPopup = mapSide === 'Left' ? setLeftWardPopupData : setRightWardPopupData;
        
        map.on('click', wardFillLayerId, (e) => {
          // Check if buildings layer is visible - if so, skip ward popup
          if (map.getZoom() >= 15.3) {
            console.log(`🚫 ${mapSide} Ward clicks disabled - Buildings layer is active`);
            return;
          }
          
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const properties = feature.properties;
            
            // Extract ward information
            const wardName = properties.Ward_Name || properties.WARD_NAME || properties.ward_name || 
                           properties.Name || properties.NAME || properties.name || 'Unknown Ward';
            const wardNumber = properties.Ward || properties.WARD || properties.ward ||
                             properties.Ward_No || properties.WARD_NO || properties.ward_no ||
                             properties.WardNo || properties.WARDNO || 'N/A';
            const population = properties.Population || properties.POPULATION || properties.population ||
                             properties.Pop_2024 || properties.POP_2024 || properties.pop_2024 ||
                             properties.Pop_2011 || properties.POP_2011 || properties.pop_2011;
            const area = properties.Area || properties.AREA || properties.area;
            const density = properties.Density || properties.DENSITY || properties.density;
            const households = properties.Households || properties.HOUSEHOLDS || properties.households;
            const buildings = properties.Buildings || properties.BUILDINGS || properties.buildings ||
                            properties.Building_Count || properties.BUILDING_COUNT || properties.building_count;
            const zone = properties.Zone || properties.ZONE || properties.zone || 'Bohol';
            const lguName = properties.MunName || properties.MUNNAME || properties.munname || properties.Municipality || undefined;
            
            // DEBUG: Log Buildings field specifically
            console.log(`🏢 ${mapSide} Buildings field check:`, {
              rawBuildings: properties.Buildings,
              extractedBuildings: buildings,
              allPropertyKeys: Object.keys(properties)
            });
            
            // Get screen coordinates
            const point = map.project(e.lngLat);
            
            console.log(`📍 ${mapSide} Ward clicked:`, wardNumber, 'at screen position:', point);
            
            // Close other ward popup
            const otherPopupSetter = mapSide === 'Left' ? setRightWardPopupData : setLeftWardPopupData;
            otherPopupSetter(null);
            
            // Close building popup
            setBuildingPopupData(null);
            
            // Show ward popup
            setWardPopup({
              wardName,
              wardNumber: String(wardNumber),
              population,
              area,
              density,
              households,
              buildings,
              zone,
              lguName,
              lng: e.lngLat.lng,
              lat: e.lngLat.lat,
              x: point.x,
              y: point.y
            });
          }
        });
        
        // Change cursor on hover
        map.on('mouseenter', wardFillLayerId, () => {
          if (map.getZoom() < 15.3) {
            map.getCanvas().style.cursor = 'pointer';
          }
        });
        
        map.on('mouseleave', wardFillLayerId, () => {
          map.getCanvas().style.cursor = '';
        });
      } catch (error) {
        console.error(`❌ ${mapSide} Failed to load ward boundaries:`, error);
      }
    };

    const addMunicipalBoundaries = async (map: maplibregl.Map, mapSide: string) => {
      const municipalLayerId = 'municipal_boundary_compare';
      const municipalBorderLayerId = municipalLayerId + '-border';
      
      // Remove existing layer/source
      if (map.getLayer(municipalLayerId)) map.removeLayer(municipalLayerId);
      if (map.getLayer(municipalBorderLayerId)) map.removeLayer(municipalBorderLayerId);
      if (map.getSource(municipalLayerId)) map.removeSource(municipalLayerId);

      // ⚠️ DEPRECATED: Old GIZ_BBSR:Municipal_Boundary removed - using WorldBank_Bohol version instead
      // Municipal boundaries already loaded via WorldBank_Bohol:Municipal_Boundary earlier in the code
      console.warn('⚠️ Old GIZ_BBSR Municipal_Boundary reference skipped - using WorldBank_Bohol instead');
      return;
      
      // OLD CODE (GIZ_BBSR reference removed):
      // Fetch Municipal Boundary WFS GeoJSON
      try {
        const MUNICIPAL_WFS_URL = '';
        
        const response = await fetchWithTimeout(MUNICIPAL_WFS_URL, { timeout: 15000 });
        if (!response.ok) throw new Error(`Municipal WFS request failed: ${response.status}`);
        
        const geojson = await response.json();
        if (!geojson || !geojson.features) throw new Error('Invalid Municipal GeoJSON response');

        console.log(`✅ ${mapSide} Municipal boundary loaded: ${geojson.features.length} features`);

        // Extract ONLY the outer boundary line (not fill polygons)
        // Convert polygon features to LineString features
        const boundaryLineFeatures = geojson.features.map((feature: any) => {
          const geometry = feature.geometry;
          
          if (geometry.type === 'Polygon') {
            // Extract only the outer ring (first ring is outer, rest are holes)
            return {
              type: 'Feature',
              properties: feature.properties,
              geometry: {
                type: 'LineString',
                coordinates: geometry.coordinates[0] // Outer ring only
              }
            };
          } else if (geometry.type === 'MultiPolygon') {
            // For MultiPolygon, extract all outer rings
            return {
              type: 'Feature',
              properties: feature.properties,
              geometry: {
                type: 'MultiLineString',
                coordinates: geometry.coordinates.map((polygon: any) => polygon[0]) // Outer ring of each polygon
              }
            };
          }
          
          return feature; // Keep as-is if already a line
        });
        
        const boundaryLineGeoJSON = {
          type: 'FeatureCollection',
          features: boundaryLineFeatures
        };
        
        console.log(`✅ ${mapSide} Municipal boundary converted to LineString (outer boundary only)`);

        // Add GeoJSON source with LINE data only
        map.addSource(municipalLayerId, {
          type: 'geojson',
          data: boundaryLineGeoJSON,
          tolerance: 0.5,
          buffer: 0,
          lineMetrics: false
        });

        // Get first label layer to insert before it
        const firstLabelLayer = getFirstLabelLayerId(map);

        // First, add a white border/outline layer for better visibility on satellite
        const municipalBorderLayerId = municipalLayerId + '-border';
        map.addLayer({
          id: municipalBorderLayerId,
          type: 'line',
          source: municipalLayerId,
          minzoom: 9,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#FFFFFF', // White border for visibility on satellite
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              9, 2.0,   // Reduced thickness for border
              12, 2.2,
              14, 2.5,
              16, 2.8
            ],
            'line-opacity': 0.8,
          },
        }, firstLabelLayer);

        // Then add the main dark line on top
        map.addLayer({
          id: municipalLayerId,
          type: 'line',
          source: municipalLayerId,
          minzoom: 9,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#1F2937', // Dark grey (gray-800)
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              9, 1.0,   // Reduced thickness
              12, 1.2,
              14, 1.5,
              16, 1.8
            ],
            'line-opacity': 0.95,
          },
        }, firstLabelLayer);

        // STRICTLY enforce basemap labels on top
        moveBasemapLabelsToTop(map, currentBasemap);

        console.log(`✅ ${mapSide} Municipal boundary added with white border for satellite visibility`);
        
      } catch (error) {
        // Silently handle timeout/network errors - municipal boundary is optional for visualization
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (!errorMsg.includes('timeout') && !errorMsg.includes('Failed to fetch')) {
          console.warn(`⚠️ ${mapSide} Municipal boundary loading issue:`, errorMsg);
        }
      }
    };

    addWardBoundaries(leftMapRef.current, 'Left');
    addWardBoundaries(rightMapRef.current, 'Right');
    
    addMunicipalBoundaries(leftMapRef.current, 'Left');
    addMunicipalBoundaries(rightMapRef.current, 'Right');

    // Enforce basemap labels on top after ward boundaries are added
    setTimeout(() => {
      if (leftMapRef.current) moveBasemapLabelsToTop(leftMapRef.current, currentBasemap);
      if (rightMapRef.current) moveBasemapLabelsToTop(rightMapRef.current, currentBasemap);
    }, 100);
  }, [mapsReady]);

  // Close popups when pressing ESC key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('⌨️ ESC pressed - closing all popups in comparison view');
        setLeftWardPopupData(null);
        setRightWardPopupData(null);
        setBuildingPopupData(null);
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, []);
  
  // Close popups when clicking outside of them (on UI elements)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Check if any popup is open
      const hasOpenPopup = leftWardPopupData || rightWardPopupData || buildingPopupData;
      if (!hasOpenPopup) return;

      const target = e.target as HTMLElement;
      
      // Check if the click is inside any popup element (z-20 for ward, z-25 for buildings)
      const isClickInsidePopup = target.closest('.absolute.z-\\[20\\]') !== null || target.closest('.absolute.z-\\[25\\]') !== null;
      
      // Check if click is on the map canvas (don't close, let map handlers deal with it)
      const isClickOnMap = target.tagName === 'CANVAS' || target.classList.contains('maplibregl-canvas');
      
      // If click is outside all popups AND not on map, close them
      if (!isClickInsidePopup && !isClickOnMap) {
        console.log('🔒 Clicked outside popup in comparison view - closing all popups');
        setLeftWardPopupData(null);
        setRightWardPopupData(null);
        setBuildingPopupData(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [leftWardPopupData, rightWardPopupData, buildingPopupData]);

  // Update popup positions when map moves
  useEffect(() => {
    if (!mapsReady.left || !mapsReady.right) return;
    if (!leftMapRef.current || !rightMapRef.current) return;

    const leftMap = leftMapRef.current;
    const rightMap = rightMapRef.current;

    const updatePopupPositions = () => {
      // Update left ward popup
      if (leftWardPopupData) {
        const point = leftMap.project([leftWardPopupData.lng, leftWardPopupData.lat]);
        setLeftWardPopupData(prev => prev ? { ...prev, x: point.x, y: point.y } : null);
      }
      
      // Update right ward popup
      if (rightWardPopupData) {
        const point = rightMap.project([rightWardPopupData.lng, rightWardPopupData.lat]);
        setRightWardPopupData(prev => prev ? { ...prev, x: point.x, y: point.y } : null);
      }
      
      // Update building popup
      if (buildingPopupData) {
        const popupMap = buildingPopupData.mapSide === 'left' ? leftMap : rightMap;
        const point = popupMap.project([buildingPopupData.lng, buildingPopupData.lat]);
        setBuildingPopupData(prev => prev ? { ...prev, x: point.x, y: point.y } : null);
      }
    };

    leftMap.on('move', updatePopupPositions);
    rightMap.on('move', updatePopupPositions);

    return () => {
      leftMap.off('move', updatePopupPositions);
      rightMap.off('move', updatePopupPositions);
    };
  }, [mapsReady, leftWardPopupData, rightWardPopupData, buildingPopupData]);

  // Close popups when clicking on map outside interactive layers
  useEffect(() => {
    if (!mapsReady.left || !mapsReady.right) return;
    if (!leftMapRef.current || !rightMapRef.current) return;

    const leftMap = leftMapRef.current;
    const rightMap = rightMapRef.current;

    const handleLeftMapClick = (e: maplibregl.MapMouseEvent) => {
      // Define all possible interactive layers for left map
      const allInteractiveLayers = [
        'ward_boundaries_fill_compare',
        'buildings-fill_left',
        'buildings-3d_left'
      ];
      
      // Filter to only include layers that actually exist
      const existingLayers = allInteractiveLayers.filter(layerId => leftMap.getLayer(layerId) !== undefined);
      
      // If no interactive layers exist, close all popups
      if (existingLayers.length === 0) {
        console.log('🔒 Left map: Closing all popups - no interactive layers exist');
        setLeftWardPopupData(null);
        setRightWardPopupData(null);
        setBuildingPopupData(null);
        return;
      }
      
      const features = leftMap.queryRenderedFeatures(e.point, { layers: existingLayers });
      
      // If no interactive features clicked, close all popups
      if (features.length === 0) {
        console.log('🔒 Left map: Closing all popups - clicked outside');
        setLeftWardPopupData(null);
        setRightWardPopupData(null);
        setBuildingPopupData(null);
      }
    };

    const handleRightMapClick = (e: maplibregl.MapMouseEvent) => {
      // Define all possible interactive layers for right map
      const allInteractiveLayers = [
        'ward_boundaries_fill_compare',
        'buildings-fill_right',
        'buildings-3d_right'
      ];
      
      // Filter to only include layers that actually exist
      const existingLayers = allInteractiveLayers.filter(layerId => rightMap.getLayer(layerId) !== undefined);
      
      // If no interactive layers exist, close all popups
      if (existingLayers.length === 0) {
        console.log('🔒 Right map: Closing all popups - no interactive layers exist');
        setLeftWardPopupData(null);
        setRightWardPopupData(null);
        setBuildingPopupData(null);
        return;
      }
      
      const features = rightMap.queryRenderedFeatures(e.point, { layers: existingLayers });
      
      // If no interactive features clicked, close all popups
      if (features.length === 0) {
        console.log('🔒 Right map: Closing all popups - clicked outside');
        setLeftWardPopupData(null);
        setRightWardPopupData(null);
        setBuildingPopupData(null);
      }
    };

    leftMap.on('click', handleLeftMapClick);
    rightMap.on('click', handleRightMapClick);

    return () => {
      leftMap.off('click', handleLeftMapClick);
      rightMap.off('click', handleRightMapClick);
    };
  }, [mapsReady]);

  // Add road network layer to both maps
  useEffect(() => {
    if (!mapsReady.left || !mapsReady.right) {
      console.log('⏸️  Road network: Maps not ready yet', { left: mapsReady.left, right: mapsReady.right });
      return;
    }
    if (!leftMapRef.current || !rightMapRef.current) {
      console.log('⏸️  Road network: Map refs not available');
      return;
    }
    
    console.log('🚀 Road network: Starting initialization for both maps');

    const addRoadNetwork = async (map: maplibregl.Map, mapSide: string) => {
      // Each map instance has its own layer registry, so we can use the same IDs
      const roadLayerIds = ['road_network_link', 'road_network_major', 'road_network_state', 'road_network_national'];
      
      // Remove existing road network layers
      roadLayerIds.forEach(layerId => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
      });
      if (map.getSource('road_network_base')) map.removeSource('road_network_base');

      try {
        // Check if map still exists
        if (!map || !map.getSource) {
          console.log(`ℹ️  ${mapSide} Map was destroyed, skipping road network layer addition`);
          return;
        }
        
        // Base URL for GeoServer
        const baseUrl = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/wms';
        
        // Construct MVT tile URL with CQL_FILTER for LGU and Barangay filtering if needed
        let tileUrlRoad = baseUrl + 
          '?service=WMS&version=1.1.0&request=GetMap' +
          '&layers=WorldBank_Bohol:Road_Network' +
          '&bbox={bbox-epsg-3857}' +
          '&width=512&height=512' +
          '&srs=EPSG:3857' +
          '&format=application/vnd.mapbox-vector-tile';

        // Build CQL_FILTER based on LGU and Barangay selections
        const cqlFilters: string[] = [];
        
        // Add LGU filter if selected
        if (props.selectedLguName && props.selectedLguName !== 'all' && props.selectedLguName !== 'All LGUs') {
          const escapedLguName = props.selectedLguName.replace(/'/g, "''");
          cqlFilters.push(`MunName='${escapedLguName}'`);
          console.log(`🔍 ${mapSide} Road Network: Applying LGU filter: ${props.selectedLguName}`);
        }
        
        // Add Barangay filter if selected  
        if (props.selectedWardId && props.selectedWardId !== 'all') {
          const escapedBrgyId = props.selectedWardId.replace(/'/g, "''");
          cqlFilters.push(`BrgyID='${escapedBrgyId}'`);
          console.log(`🔍 ${mapSide} Road Network: Applying Barangay filter: BrgyID ${props.selectedWardId}`);
        }
        
        // Apply combined CQL filter if we have any filters
        if (cqlFilters.length > 0) {
          tileUrlRoad += `&CQL_FILTER=${encodeURIComponent(cqlFilters.join(' AND '))}`;
        }

        console.log(`🚀 ${mapSide} Loading road network from GeoServer MVT (Vector Tiles)...`);

        // Add MVT (Vector Tile) source
        map.addSource('road_network_base', {
          type: 'vector',
          tiles: [tileUrlRoad],
          minzoom: 0,
          maxzoom: 22
        });
        
        console.log(`✅ ${mapSide} Road network MVT source added`);

        // Get first label layer to insert before it
        const firstLabelLayerId = getFirstLabelLayerId(map);
        const wardBoundariesLayerId = 'ward_boundaries_fill_compare';
        const beforeLayerId = map.getLayer(wardBoundariesLayerId) ? wardBoundariesLayerId : firstLabelLayerId;

        // Layer 1: Link Roads (bottom, most subtle) - Gray
        map.addLayer({
          id: 'road_network_link',
          type: 'line',
          source: 'road_network_base',
          'source-layer': 'Road_Network', // MVT source layer name
          filter: ['==', ['get', 'category'], 'Link Road'],
          paint: {
            'line-color': '#F0F0F0',
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 12, 0.8, 14, 1.2, 16, 1.5, 18, 2],
            'line-opacity': 0.6
          }
        }, beforeLayerId);

        // Layer 2: Major Roads
        map.addLayer({
          id: 'road_network_major',
          type: 'line',
          source: 'road_network_base',
          'source-layer': 'Road_Network', // MVT source layer name
          filter: ['==', ['get', 'category'], 'Major Road'],
          paint: {
            'line-color': '#D5D5D5',
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 12, 1.5, 14, 2.5, 16, 3.5, 18, 4.5],
            'line-opacity': 0.7
          }
        }, beforeLayerId);

        // Layer 3: State Highways
        map.addLayer({
          id: 'road_network_state',
          type: 'line',
          source: 'road_network_base',
          'source-layer': 'Road_Network', // MVT source layer name
          filter: ['==', ['get', 'category'], 'State Highway'],
          paint: {
            'line-color': '#C0C0C0',
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.2, 12, 2, 14, 3, 16, 4, 18, 5],
            'line-opacity': 0.75
          }
        }, beforeLayerId);

        // Layer 4: National Highways (top, most prominent)
        map.addLayer({
          id: 'road_network_national',
          type: 'line',
          source: 'road_network_base',
          'source-layer': 'Road_Network', // MVT source layer name
          filter: ['==', ['get', 'category'], 'National Highway'],
          paint: {
            'line-color': '#B0B0B0',
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 12, 2.5, 14, 3.5, 16, 4.5, 18, 5.5],
            'line-opacity': 0.8
          }
        }, beforeLayerId);

        console.log(`✅ ${mapSide} Road network layers added with MVT - ultra-fast rendering (positioned before ${beforeLayerId || 'top'})`)
        console.log(`✅ ${mapSide} Road network layers:`, roadLayerIds);
        
        // CRITICAL: After adding road network, ensure it's positioned ABOVE any hazard layers
        // Position road networks just before waterbody (if exists) or ward boundaries
        // This ensures: hazard → road networks → waterbody → ward boundaries
        const waterbodyLayerId = 'waterbody_compare';
        const wardFillLayerId = 'ward_boundaries_fill_compare';
        
        let roadPositionBeforeLayerId = undefined;
        if (map.getLayer(waterbodyLayerId)) {
          roadPositionBeforeLayerId = waterbodyLayerId;
          console.log(`🎯 ${mapSide}: Positioning road networks BEFORE waterbody (above hazard)`);
        } else if (map.getLayer(wardFillLayerId)) {
          roadPositionBeforeLayerId = wardFillLayerId;
          console.log(`🎯 ${mapSide}: Positioning road networks BEFORE ward boundaries (above hazard)`);
        }
        
        roadLayerIds.forEach(roadLayerId => {
          if (map.getLayer(roadLayerId) && roadPositionBeforeLayerId) {
            map.moveLayer(roadLayerId, roadPositionBeforeLayerId);
            console.log(`🔧 ${mapSide}: Road network layer ${roadLayerId} repositioned above hazard layer`);
          }
        });
        
        // Move basemap labels to top after adding road layers
        moveBasemapLabelsToTop(map, currentBasemap);
      } catch (error) {
        console.error(`❌ ${mapSide} Failed to load road network:`, error);
      }
    };

    addRoadNetwork(leftMapRef.current, 'Left');
    addRoadNetwork(rightMapRef.current, 'Right');
  }, [mapsReady, props.selectedWardId, currentBasemap]);

  // Add/update hazard layer for LEFT map
  useEffect(() => {
    if (!mapsReady.left || !leftMapRef.current) return;

    const map = leftMapRef.current;
    const layerId = 'hazard_layer_left'; // UNIQUE ID for left map
    const tileUrl = getComparisonLayerTileUrl(props.leftSector as string, props.leftLayer);

    console.log(`🔄 LEFT MAP: Updating to ${props.leftLayer} (${props.leftSector}) → ${tileUrl ? 'URL ok' : 'null'}`);
    
    // Set loading state to true when starting to load layer
    setIsHazardLayerLoadingLeft(true);
    
    // Reset loading state when layer changes
    setLayersFullyLoaded(prev => ({ ...prev, left: false }));

    // Remove existing
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
      console.log('🗑️ Left: Removed old layer');
    }
    if (map.getSource(layerId)) {
      map.removeSource(layerId);
      console.log('🗑️ Left: Removed old source');
    }

    if (tileUrl) {
      
      map.addSource(layerId, {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 18,
      });

      // Position hazard layer below waterbody (if exists), otherwise below ward boundaries
      const waterbodyLayerId = 'waterbody_compare';
      const wardBoundariesLayerId = 'ward_boundaries_fill_compare';
      let beforeLayerId = undefined;
      
      if (map.getLayer(waterbodyLayerId)) {
        beforeLayerId = waterbodyLayerId;
        console.log('🎯 LEFT: Positioning hazard layer BEFORE waterbody');
      } else if (map.getLayer(wardBoundariesLayerId)) {
        beforeLayerId = wardBoundariesLayerId;
        console.log('🎯 LEFT: Positioning hazard layer BEFORE ward boundaries');
      }
      
      map.addLayer({
        id: layerId,
        type: 'raster',
        source: layerId,
        paint: {
          'raster-opacity': leftOpacity,
        },
      }, beforeLayerId);
      
      console.log(`✅ LEFT: Layer added: ${props.leftLayer}`);
      
      // CRITICAL: Reposition road network layers ABOVE hazard layer
      // Road network must always be visible on top of hazard layers
      const roadNetworkLayerIds = ['road_network_link', 'road_network_major', 'road_network_state', 'road_network_national'];
      
      // Determine the correct positioning: just before waterbody (if exists) or ward boundaries
      // This ensures: hazard → road networks → waterbody → ward boundaries
      let roadPositionBeforeLayerId = undefined;
      if (map.getLayer(waterbodyLayerId)) {
        roadPositionBeforeLayerId = waterbodyLayerId;
        console.log('🎯 LEFT: Positioning road networks BEFORE waterbody (above hazard)');
      } else if (map.getLayer(wardBoundariesLayerId)) {
        roadPositionBeforeLayerId = wardBoundariesLayerId;
        console.log('🎯 LEFT: Positioning road networks BEFORE ward boundaries (above hazard)');
      }
      
      // Move each road network layer to the correct position
      roadNetworkLayerIds.forEach(roadLayerId => {
        if (map.getLayer(roadLayerId)) {
          if (roadPositionBeforeLayerId) {
            map.moveLayer(roadLayerId, roadPositionBeforeLayerId);
            console.log(`✅ LEFT: Road network layer ${roadLayerId} repositioned above hazard layer`);
          } else {
            // If no reference layers, move to top (before labels)
            const firstLabelLayerId = getFirstLabelLayerId(map);
            if (firstLabelLayerId) {
              map.moveLayer(roadLayerId, firstLabelLayerId);
              console.log(`✅ LEFT: Road network layer ${roadLayerId} repositioned before labels`);
            }
          }
        }
      });
      
      // Move basemap labels to top to ensure they're above hazard layers
      moveBasemapLabelsToTop(map, currentBasemap);
      
      // Track if loading was cleared by event
      let loadingCleared = false;

      // Listen for tiles loaded event
      const onSourceDataLoaded = (e: any) => {
        if (e.sourceId === layerId && e.isSourceLoaded) {
          console.log('✅ LEFT: Tiles loaded for:', layerId);
          loadingCleared = true;
          setIsHazardLayerLoadingLeft(false);
          map.off('sourcedata', onSourceDataLoaded);
        }
      };
      map.on('sourcedata', onSourceDataLoaded);

      // SAFEGUARD: Force clear loading after 3 seconds even if event doesn't fire
      const loadingTimeout = setTimeout(() => {
        if (!loadingCleared) {
          console.log('⏱️ LEFT: Loading timeout reached - forcing clear');
          setIsHazardLayerLoadingLeft(false);
          map.off('sourcedata', onSourceDataLoaded);
        }
      }, 3000);

      // Listen for errors (errors are already logged by global error handler)
      const onError = (e: any) => {
        if (e.sourceId === layerId) {
          // Don't log error here - global error handler will log it
          loadingCleared = true;
          setIsHazardLayerLoadingLeft(false);
          clearTimeout(loadingTimeout);
          map.off('sourcedata', onSourceDataLoaded);
          map.off('error', onError);
        }
      };
      map.on('error', onError);
      
      // Wait for tiles to load before marking as fully loaded
      map.once('idle', () => {
        console.log(`✅ LEFT: Map fully idle with hazard layer loaded`);
        setLayersFullyLoaded(prev => ({ ...prev, left: true }));
      });
    } else {
      console.warn(`⚠️ LEFT: No tile URL for sector=${props.leftSector} layer=${props.leftLayer}`);
      setIsHazardLayerLoadingLeft(false);
    }
  }, [props.leftSector, props.leftLayer, props.selectedWardId, mapsReady.left]);

  // Add/update hazard layer for RIGHT map
  useEffect(() => {
    if (!mapsReady.right || !rightMapRef.current) return;

    const map = rightMapRef.current;
    const layerId = 'hazard_layer_right'; // UNIQUE ID for right map
    const tileUrl = getComparisonLayerTileUrl(props.rightSector as string, props.rightLayer);

    console.log(`🔄 RIGHT MAP: Updating to ${props.rightLayer} (${props.rightSector}) → ${tileUrl ? 'URL ok' : 'null'}`);
    
    // Set loading state to true when starting to load layer
    setIsHazardLayerLoadingRight(true);
    
    // Reset loading state when layer changes
    setLayersFullyLoaded(prev => ({ ...prev, right: false }));

    // Remove existing
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
      console.log('🗑️ Right: Removed old layer');
    }
    if (map.getSource(layerId)) {
      map.removeSource(layerId);
      console.log('🗑️ Right: Removed old source');
    }

    if (tileUrl) {
      
      map.addSource(layerId, {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 18,
      });

      // Position hazard layer below waterbody (if exists), otherwise below ward boundaries
      const waterbodyLayerId = 'waterbody_compare';
      const wardBoundariesLayerId = 'ward_boundaries_fill_compare';
      let beforeLayerId = undefined;
      
      if (map.getLayer(waterbodyLayerId)) {
        beforeLayerId = waterbodyLayerId;
        console.log('🎯 RIGHT: Positioning hazard layer BEFORE waterbody');
      } else if (map.getLayer(wardBoundariesLayerId)) {
        beforeLayerId = wardBoundariesLayerId;
        console.log('🎯 RIGHT: Positioning hazard layer BEFORE ward boundaries');
      }
      
      map.addLayer({
        id: layerId,
        type: 'raster',
        source: layerId,
        paint: {
          'raster-opacity': rightOpacity,
        },
      }, beforeLayerId);
      
      console.log(`✅ RIGHT: Layer added: ${props.rightLayer}`);
      
      // CRITICAL: Reposition road network layers ABOVE hazard layer
      // Use setTimeout to ensure this runs after the layer is fully added to the map
      setTimeout(() => {
        const roadNetworkLayerIds = ['road_network_link', 'road_network_major', 'road_network_state', 'road_network_national'];
        
        // Determine the correct positioning: just before waterbody (if exists) or ward boundaries
        // This ensures: hazard → road networks → waterbody → ward boundaries
        let roadPositionBeforeLayerId = undefined;
        if (map.getLayer(waterbodyLayerId)) {
          roadPositionBeforeLayerId = waterbodyLayerId;
          console.log('🎯 RIGHT: Positioning road networks BEFORE waterbody (above hazard)');
        } else if (map.getLayer(wardBoundariesLayerId)) {
          roadPositionBeforeLayerId = wardBoundariesLayerId;
          console.log('🎯 RIGHT: Positioning road networks BEFORE ward boundaries (above hazard)');
        }
        
        // Move each road network layer to the correct position
        roadNetworkLayerIds.forEach(roadLayerId => {
          if (map.getLayer(roadLayerId)) {
            if (roadPositionBeforeLayerId) {
              map.moveLayer(roadLayerId, roadPositionBeforeLayerId);
              console.log(`✅ RIGHT: Road network layer ${roadLayerId} repositioned above hazard layer`);
            } else {
              // If no reference layers, move to top (before labels)
              const firstLabelLayerId = getFirstLabelLayerId(map);
              if (firstLabelLayerId) {
                map.moveLayer(roadLayerId, firstLabelLayerId);
                console.log(`✅ RIGHT: Road network layer ${roadLayerId} repositioned before labels`);
              }
            }
          } else {
            console.warn(`⚠️ RIGHT: Road network layer ${roadLayerId} not found on map - cannot reposition`);
          }
        });
        
        // Move basemap labels to top to ensure they're above hazard layers
        moveBasemapLabelsToTop(map, currentBasemap);
      }, 100);
      
      // Track if loading was cleared by event
      let loadingCleared = false;

      // Listen for tiles loaded event
      const onSourceDataLoaded = (e: any) => {
        if (e.sourceId === layerId && e.isSourceLoaded) {
          console.log('✅ RIGHT: Tiles loaded for:', layerId);
          loadingCleared = true;
          setIsHazardLayerLoadingRight(false);
          map.off('sourcedata', onSourceDataLoaded);
        }
      };
      map.on('sourcedata', onSourceDataLoaded);

      // SAFEGUARD: Force clear loading after 3 seconds even if event doesn't fire
      const loadingTimeout = setTimeout(() => {
        if (!loadingCleared) {
          console.log('⏱️ RIGHT: Loading timeout reached - forcing clear');
          setIsHazardLayerLoadingRight(false);
          map.off('sourcedata', onSourceDataLoaded);
        }
      }, 3000);

      // Listen for errors (errors are already logged by global error handler)
      const onError = (e: any) => {
        if (e.sourceId === layerId) {
          // Don't log error here - global error handler will log it
          loadingCleared = true;
          setIsHazardLayerLoadingRight(false);
          clearTimeout(loadingTimeout);
          map.off('sourcedata', onSourceDataLoaded);
          map.off('error', onError);
        }
      };
      map.on('error', onError);
      
      // Wait for tiles to load before marking as fully loaded
      map.once('idle', () => {
        console.log(`✅ RIGHT: Map fully idle with hazard layer loaded`);
        setLayersFullyLoaded(prev => ({ ...prev, right: true }));
      });
    } else {
      console.warn(`⚠️ RIGHT: No tile URL for sector=${props.rightSector} layer=${props.rightLayer}`);
      setIsHazardLayerLoadingRight(false);
    }
  }, [props.rightSector, props.rightLayer, props.selectedWardId, mapsReady.right]);

  // Update LEFT layer opacity
  useEffect(() => {
    if (!leftMapRef.current || !mapsReady.left) return;
    const map = leftMapRef.current;
    if (map.getLayer('hazard_layer_left')) {
      map.setPaintProperty('hazard_layer_left', 'raster-opacity', leftOpacity);
    }
  }, [leftOpacity, mapsReady.left]);

  // Update RIGHT layer opacity
  useEffect(() => {
    if (!rightMapRef.current || !mapsReady.right) return;
    const map = rightMapRef.current;
    if (map.getLayer('hazard_layer_right')) {
      map.setPaintProperty('hazard_layer_right', 'raster-opacity', rightOpacity);
    }
  }, [rightOpacity, mapsReady.right]);

  // Handle ward filtering and zoom animation
  useEffect(() => {
    console.log('🎯 Comparison Ward filter effect triggered:', { selectedWardId: props.selectedWardId, mapsReady });
    
    if (!leftMapRef.current || !rightMapRef.current) return;
    if (!mapsReady.left || !mapsReady.right) return;

    const leftMap = leftMapRef.current;
    const rightMap = rightMapRef.current;

    // If "all" wards selected, zoom back to city view
    if (!props.selectedWardId || props.selectedWardId === 'all') {
      const wasSpecificWardSelected = previousWardRef.current && previousWardRef.current !== 'all';
      
      if (wasSpecificWardSelected) {
        console.log(`📍 Comparison: Ward deselected (${previousWardRef.current} → All Wards) - zooming out to city view`);
        
        // Disable syncing temporarily
        syncingRef.current = true;
        
        // Zoom both maps to study area view
        const municipalBounds = (leftMap as any)._municipalBounds;
        
        if (municipalBounds) {
          leftMap.fitBounds(municipalBounds, {
            padding: 80,
            duration: 1500,
            pitch: 0,
            bearing: 0,
            essential: true
          });

          rightMap.fitBounds(municipalBounds, {
            padding: 80,
            duration: 1500,
            pitch: 0,
            bearing: 0,
            essential: true
          });
        } else {
          leftMap.flyTo({
            center: BOHOL_CENTER,
            zoom: INITIAL_ZOOM,
            pitch: 0,
            bearing: 0,
            duration: 1500,
            essential: true
          });

          rightMap.flyTo({
            center: BOHOL_CENTER,
            zoom: INITIAL_ZOOM,
            pitch: 0,
            bearing: 0,
            duration: 1500,
            essential: true
          });
        }

        // Re-enable syncing after animation
        setTimeout(() => {
          syncingRef.current = false;
        }, 1600);
      }
      
      previousWardRef.current = 'all';
      return;
    }

    // Extract ward number
    const wardNumber = extractWardNumber(props.selectedWardId);
    if (wardNumber === null) {
      console.warn('⚠️ Comparison: Invalid ward number:', props.selectedWardId);
      return;
    }

    console.log(`📍 Comparison: Filtering and zooming to Ward ${wardNumber}`);

    // Wait for ward boundaries data to be loaded
    const zoomToWard = () => {
      if (!wardBoundariesDataRef.current || !wardBoundariesDataRef.current.features) {
        console.log('⏳ Comparison: Waiting for ward boundaries data...');
        setTimeout(zoomToWard, 500);
        return;
      }

      const features = wardBoundariesDataRef.current.features;
      console.log(`🔍 Comparison: Searching for Ward ${wardNumber} in ${features.length} features`);

      const wardFeature = features.find((f: any) => {
        const props = f.properties;
        const fWardNumber = props.Ward || props.WARD || props.ward || props.Ward_No || props.WARD_NO || props.ward_no || props.WardNo;
        return parseInt(fWardNumber) === wardNumber;
      });

      if (wardFeature && wardFeature.geometry) {
        console.log('✅ Comparison: Found ward feature, calculating bounds');

        const bounds = new maplibregl.LngLatBounds();
        const geometry = wardFeature.geometry as any;

        if (geometry.type === 'Polygon') {
          geometry.coordinates[0].forEach((coord: [number, number]) => {
            bounds.extend(coord);
          });
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach((polygon: any) => {
            polygon[0].forEach((coord: [number, number]) => {
              bounds.extend(coord);
            });
          });
        }

        console.log('📍 Comparison: Calculated bounds:', {
          southwest: bounds.getSouthWest().toArray(),
          northeast: bounds.getNorthEast().toArray(),
        });

        // Disable syncing temporarily
        syncingRef.current = true;

        // Fit both maps to ward bounds with animation
        console.log('🚀 Comparison: Zooming both maps to Ward', wardNumber);
        
        leftMap.fitBounds(bounds, {
          padding: { top: 120, bottom: 120, left: 120, right: 120 },
          duration: 1500,
          essential: true,
          maxZoom: 13.5
        });

        rightMap.fitBounds(bounds, {
          padding: { top: 120, bottom: 120, left: 120, right: 120 },
          duration: 1500,
          essential: true,
          maxZoom: 13.5
        });

        // Re-enable syncing after animation
        setTimeout(() => {
          syncingRef.current = false;
        }, 1600);

        console.log('✅ Comparison: Zoomed to Ward', wardNumber);
      } else {
        console.warn('⚠️ Comparison: Ward feature not found for Ward', wardNumber);
      }
    };

    zoomToWard();
    previousWardRef.current = props.selectedWardId;
  }, [props.selectedWardId, mapsReady]);

  // Handle slider drag
  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(20, Math.min(80, percentage)));
  };

  useEffect(() => {
    if (isDragging) {
      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // ===== SYNCHRONIZED BUILDINGS LOADING FOR BOTH MAPS =====
  // 🔒 STRICT: Load BOTH maps simultaneously to ensure synchronized building appearance
  // The loading indicator only hides when BOTH maps have finished loading and verification.
  
  // Load buildings layer for LEFT map at all zoom levels
  useEffect(() => {
    // Wait for BOTH maps to be ready before loading buildings on either side
    if (!mapsReady.left || !mapsReady.right) return;
    if (!leftMapRef.current) return;
    
    const loadBuildingsForMap = async (map: maplibregl.Map, mapSide: string, currentZoom: number) => {
      const buildingsSourceId = `buildings_${mapSide.toLowerCase()}`;
      
      // Ensure map style is loaded before checking sources
      if (!map.isStyleLoaded || !map.isStyleLoaded()) {
        console.log(`⏳ ${mapSide}: Map style not loaded yet, skipping buildings check`);
        return;
      }

      
      // STRICT ENFORCEMENT: If buildings already loaded AND map is idle, skip
      // Otherwise show loading indicator until buildings are fully rendered
      if (map.getSource(buildingsSourceId)) {
        // Buildings exist, but check if they're fully rendered
        if (map.loaded() && !map.isMoving()) {
          console.log(`✅ ${mapSide}: Buildings already loaded and fully rendered`);
          setIsBuildingsLoadingLeft(false); // Ensure indicator is hidden for LEFT map
          return;
        } else {
          // Buildings exist but map is still loading/moving - show indicator until idle
          console.log(`⏳ ${mapSide}: Buildings exist but map is loading/moving - showing indicator`);
          setIsBuildingsLoadingLeft(true);
          
          // Wait for idle
          const onMapIdle = () => {
            console.log(`🎨 ${mapSide}: Map is now idle - buildings fully visible`);
            setIsBuildingsLoadingLeft(false);
            map.off('idle', onMapIdle);
          };
          map.once('idle', onMapIdle);
          return;
        }
      }
      
      console.log(`🏢 ${mapSide}: Loading buildings layer at all zoom levels`);
      
      // Show loading indicator for LEFT map  
      if (mapSide === 'Left') {
        setIsBuildingsLoadingLeft(true);
      }
      
      try {
        // Build MVT (Mapbox Vector Tile) URL template
        // MVT tiles are automatically requested by MapLibre GL based on zoom/pan
        // This provides ultra-fast rendering with automatic viewport management
        const baseUrl = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/wms';
        
        // Construct MVT tile URL with CQL_FILTER for ward filtering if needed
        let tileUrl = baseUrl + 
          '?service=WMS&version=1.1.0&request=GetMap' +
          '&layers=WorldBank_Bohol:Buildings' +
          '&bbox={bbox-epsg-3857}' +
          '&width=512&height=512' +
          '&srs=EPSG:3857' +
          '&format=application/vnd.mapbox-vector-tile';
        
        // Add CQL filter for ward if needed (server-side filtering)
        if (props.selectedWardId && props.selectedWardId !== 'all') {
          const wardNumber = extractWardNumber(props.selectedWardId);
          if (wardNumber !== null) {
            tileUrl += `&CQL_FILTER=Ward=${wardNumber}`;
            console.log(`🔍 ${mapSide}: Applying ward filter to MVT tiles: Ward ${wardNumber}`);
          }
        }
        
        console.log(`📡 ${mapSide}: Using MVT tiles from GeoServer...`);
        console.log(`📍 ${mapSide}: Tile URL template:`, tileUrl);
        
        // No fetch needed - MVT tiles are loaded automatically by MapLibre GL
        // Just add the source and layers directly
        
        // Check if map still exists
        if (!map || !map.getSource) {
          console.log(`ℹ️  ${mapSide}: Map was destroyed, skipping layer addition`);
          if (mapSide === 'Left') setIsBuildingsLoadingLeft(false);
          return;
        }
        
        // If source and all layers already exist, skip (concurrent request completed first)
        if (map.getSource(buildingsSourceId) && 
            map.getLayer(`buildings_${mapSide.toLowerCase()}`) && 
            map.getLayer(`buildings-fill_${mapSide.toLowerCase()}`) && 
            map.getLayer(`buildings-3d_${mapSide.toLowerCase()}`) && 
            map.getLayer(`buildings-highlight_${mapSide.toLowerCase()}`)) {
          console.log(`⚠️ ${mapSide}: Buildings source and layers already exist (added by concurrent request), skipping addition`);
          if (mapSide === 'Left') setIsBuildingsLoadingLeft(false);
          return;
        }
        
        // If source exists but layers don't, remove source first to rebuild everything
        if (map.getSource(buildingsSourceId)) {
          console.log(`🔄 ${mapSide}: Buildings source exists without complete layers, removing and rebuilding...`);
          if (map.getLayer(`buildings-fill_${mapSide.toLowerCase()}`)) map.removeLayer(`buildings-fill_${mapSide.toLowerCase()}`);
          if (map.getLayer(`buildings-3d_${mapSide.toLowerCase()}`)) map.removeLayer(`buildings-3d_${mapSide.toLowerCase()}`);
          if (map.getLayer(`buildings-highlight_${mapSide.toLowerCase()}`)) map.removeLayer(`buildings-highlight_${mapSide.toLowerCase()}`);
          if (map.getLayer(`buildings_${mapSide.toLowerCase()}`)) map.removeLayer(`buildings_${mapSide.toLowerCase()}`);
          map.removeSource(buildingsSourceId);
        }
        
        // Add MVT (Vector Tile) source
        map.addSource(buildingsSourceId, {
          type: 'vector',
          tiles: [tileUrl],
          minzoom: 0,
          maxzoom: 22
        });
        
        // Add fill layer for click interaction with category-based coloring
        map.addLayer({
          id: `buildings-fill_${mapSide.toLowerCase()}`,
          type: 'fill',
          source: buildingsSourceId,
          'source-layer': 'Buildings_v2', // MVT source layer name
          minzoom: 0,
          layout: {
            'visibility': showBuildings && !is3DMode ? 'visible' : 'none'
          },
          paint: {
            // Category-based coloring
            'fill-color': [
              'match',
              ['get', 'Category'],
              'Residential', '#f6e717',
              'Commercial & Retail', '#e40021',
              'Tourism & Hospitality', '#de36dd',
              'Education & Institutional', '#2963ea',
              'Healthcare', '#2bdade',
              'Government & Public Services', '#29da11',
              'Religious & Cultural', '#eb7120',
              '#D4D4D8' // Default
            ],
            'fill-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 0.4,
              13, 0.5,
              15, 0.6,
              17, 0.7
            ]
          }
        });
        
        // Add 3D extrusion layer (for 3D mode)
        map.addLayer({
          id: `buildings-3d_${mapSide.toLowerCase()}`,
          type: 'fill-extrusion',
          source: buildingsSourceId,
          'source-layer': 'Buildings_v2', // MVT source layer name
          minzoom: 0,
          layout: {
            'visibility': showBuildings && is3DMode ? 'visible' : 'none'
          },
          paint: {
            'fill-extrusion-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#2563EB', // Innpact blue on hover
              // Category-based coloring for 3D buildings
              [
                'match',
                ['get', 'Category'],
                'Residential', '#f6e717',
                'Commercial & Retail', '#e40021',
                'Tourism & Hospitality', '#de36dd',
                'Education & Institutional', '#2963ea',
                'Healthcare', '#2bdade',
                'Government & Public Services', '#29da11',
                'Religious & Cultural', '#eb7120',
                '#E2E8F0' // Default
              ]
            ],
            'fill-extrusion-height': [
              '*',
              ['to-number', ['coalesce', ['get', 'floor'], 1]], // Ensure it's a number, get floor count, default to 1
              4 // Each floor is 4 meters
            ],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.7, // More transparent for modern look
            'fill-extrusion-vertical-gradient': true // Add gradient for depth and modern appearance
          }
        });
        
        // Add highlight layer for hover effect (semi-transparent blue fill)
        map.addLayer({
          id: `buildings-highlight_${mapSide.toLowerCase()}`,
          type: 'fill',
          source: buildingsSourceId,
          'source-layer': 'Buildings_v2', // MVT source layer name
          minzoom: 0,
          layout: {
            'visibility': showBuildings ? 'visible' : 'none'
          },
          paint: {
            'fill-color': '#2563EB', // Innpact blue
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.3, // 30% opacity on hover for better visibility
              0 // invisible otherwise
            ]
          }
        });
        
        // Add buildings layer with category-based darker outline
        map.addLayer({
          id: `buildings_${mapSide.toLowerCase()}`,
          type: 'line',
          source: buildingsSourceId,
          'source-layer': 'Buildings_v2', // MVT source layer name
          minzoom: 0,
          layout: {
            'visibility': showBuildings ? 'visible' : 'none'
          },
          paint: {
            // Category-based darker outline color for better visibility
            'line-color': [
              'match',
              ['get', 'Category'],
              'Residential', '#dfd229', // Darker Yellow
              'Commercial & Retail', '#d41a40', // Darker Red
              'Tourism & Hospitality', '#aa29aa', // Darker Magenta
              'Education & Institutional', '#1d46a6', // Darker Blue
              'Healthcare', '#1e989a', // Darker Cyan
              'Government & Public Services', '#24bd0f', // Darker Green
              'Religious & Cultural', '#a24e16', // Darker Orange
              '#71717A' // Darker grey
            ],
            // LOD: Optimized line width - scales with zoom level
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 0.3,
              13, 0.5,
              15, 0.7,
              16, 0.8,
              18, 1.0
            ],
            // LOD: Higher opacity for better visibility
            'line-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 0.6,
              13, 0.7,
              15, 0.8,
              17, 0.9
            ]
          }
        });
        
        // Move basemap labels to top after adding building layers
        moveBasemapLabelsToTop(map, currentBasemap);
        
        // Track hovered and selected building for highlight effect
        let hoveredBuildingId: string | number | null = null;
        let selectedBuildingId: string | number | null = null;
        
        // Add hover highlighting effect for fill layer
        map.on('mousemove', `buildings-fill_${mapSide.toLowerCase()}`, (e) => {
          if (e.features && e.features.length > 0) {
            const featureId = e.features[0].id as string | number;
            
            // Don't change hover if this is the selected building
            if (featureId !== selectedBuildingId && hoveredBuildingId !== featureId) {
              // Clear previous hover
              if (hoveredBuildingId !== null && hoveredBuildingId !== selectedBuildingId) {
                map.setFeatureState(
                  { source: buildingsSourceId, sourceLayer: 'Buildings', id: hoveredBuildingId },
                  { hover: false }
                );
              }
              
              // Set new hover
              hoveredBuildingId = featureId;
              map.setFeatureState(
                { source: buildingsSourceId, sourceLayer: 'Buildings', id: hoveredBuildingId },
                { hover: true }
              );
            }
          }
        });
        
        // Clear hover state when mouse leaves
        map.on('mouseleave', `buildings-fill_${mapSide.toLowerCase()}`, () => {
          if (hoveredBuildingId !== null && hoveredBuildingId !== selectedBuildingId) {
            map.setFeatureState(
              { source: buildingsSourceId, sourceLayer: 'Buildings', id: hoveredBuildingId },
              { hover: false }
            );
          }
          hoveredBuildingId = null;
        });
        
        // Add click handler for popup
        map.on('click', `buildings-fill_${mapSide.toLowerCase()}`, (e) => {
          if (!e.features || e.features.length === 0) return;
          
          const feature = e.features[0];
          const props = feature.properties;
          
          console.log(`🏢 ${mapSide}: Building clicked:`, props);
          
          // Clear previous selected building highlight if it exists
          if (selectedBuildingId !== null) {
            map.setFeatureState(
              { source: buildingsSourceId, sourceLayer: 'Buildings', id: selectedBuildingId },
              { hover: false }
            );
          }
          
          // Set selected building for persistent highlight
          selectedBuildingId = feature.id as string | number;
          selectedBuildingIdRefLeft.current = selectedBuildingId;
          map.setFeatureState(
            { source: buildingsSourceId, sourceLayer: 'Buildings', id: selectedBuildingId },
            { hover: true }
          );
          
          // Close ward popups when building is clicked
          setLeftWardPopupData(null);
          setRightWardPopupData(null);
          
          // Get click coordinates
          const point = map.project(e.lngLat);
          
          setBuildingPopupData({
            buildingUse: props.Use || 'N/A',
            ward: props.Ward || 'N/A',
            floors: props.floor || 'N/A',
            hhi2025: props.HHI_2025 || 'N/A',
            airAqi: props.Air_AQI || 'N/A',
            floodHazard: props.Flood_Hazard || 'N/A',
            multiHazard: props.Multi_Hazard_BBSR || 'N/A',
            lng: e.lngLat.lng,
            lat: e.lngLat.lat,
            x: point.x,
            y: point.y,
            mapSide: mapSide.toLowerCase()
          });
        });
        
        // Change cursor on hover
        map.on('mouseenter', `buildings-fill_${mapSide.toLowerCase()}`, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', `buildings-fill_${mapSide.toLowerCase()}`, () => {
          map.getCanvas().style.cursor = '';
        });
        
        // Add click handler for 3D buildings (same popup as 2D)
        map.on('click', `buildings-3d_${mapSide.toLowerCase()}`, (e) => {
          if (!e.features || e.features.length === 0) return;
          
          const feature = e.features[0];
          const props = feature.properties;
          
          console.log(`🏗️ ${mapSide}: 3D Building clicked:`, props);
          
          // Clear previous selected building highlight if it exists
          if (selectedBuildingId !== null) {
            map.setFeatureState(
              { source: buildingsSourceId, sourceLayer: 'Buildings', id: selectedBuildingId },
              { hover: false }
            );
          }
          
          // Set selected building for persistent highlight
          selectedBuildingId = feature.id as string | number;
          selectedBuildingIdRefLeft.current = selectedBuildingId;
          map.setFeatureState(
            { source: buildingsSourceId, sourceLayer: 'Buildings', id: selectedBuildingId },
            { hover: true }
          );
          
          // Close ward popups when building is clicked
          setLeftWardPopupData(null);
          setRightWardPopupData(null);
        });
        
        // Add click handler for 3D buildings (same popup as 2D)
        map.on('click', `buildings-3d_${mapSide.toLowerCase()}`, (e) => {
          if (!e.features || e.features.length === 0) return;
          
          const feature = e.features[0];
          const props = feature.properties;
          
          console.log(`🏗️ ${mapSide}: 3D Building clicked:`, props);
          
          // Close ward popups when building is clicked
          setLeftWardPopupData(null);
          setRightWardPopupData(null);
          
          // Get click coordinates
          const point = map.project(e.lngLat);
          
          setBuildingPopupData({
            buildingUse: props.Use || 'N/A',
            ward: props.Ward || 'N/A',
            floors: props.floor || 'N/A',
            hhi2025: props.HHI_2025 || 'N/A',
            airAqi: props.Air_AQI || 'N/A',
            floodHazard: props.Flood_Hazard || 'N/A',
            multiHazard: props.Multi_Hazard_BBSR || 'N/A',
            lng: e.lngLat.lng,
            lat: e.lngLat.lat,
            x: point.x,
            y: point.y,
            mapSide: mapSide.toLowerCase()
          });
        });
        
        // Change cursor on hover for 3D buildings
        map.on('mouseenter', `buildings-3d_${mapSide.toLowerCase()}`, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', `buildings-3d_${mapSide.toLowerCase()}`, () => {
          map.getCanvas().style.cursor = '';
        });
        
        console.log(`✅ ${mapSide}: Buildings layers added successfully`);
        
        // MVT tiles don't need viewport-based reloading - MapLibre GL handles this automatically
        console.log(`📍 ${mapSide}: MVT tiles will auto-load on pan/zoom`);
        
        // STRICT ENFORCEMENT: Verify buildings are actually visible before hiding loading indicator
        // Use polling with retry logic instead of idle events
        let verificationAttempts = 0;
        const maxAttempts = 60; // 60 attempts * 150ms = 9 seconds max (increased for comparison view reliability)
        
        const tryVerification = () => {
          verificationAttempts++;
          const isActuallyVisible = verifyBuildingsAreActuallyVisible(map, mapSide);
          
          if (isActuallyVisible) {
            console.log(`🎨 [${mapSide}] Buildings VERIFIED as visible (attempt ${verificationAttempts}) - hiding loading indicator`);
            setIsBuildingsLoadingLeft(false);
          } else if (verificationAttempts < maxAttempts) {
            console.log(`🔄 [${mapSide}] Buildings not yet visible (attempt ${verificationAttempts}/${maxAttempts}), retrying...`);
            setTimeout(tryVerification, 150); // Retry every 150ms (increased interval)
          } else {
            console.log(`✅ [${mapSide}] Buildings verification timeout reached - layers added successfully, hiding loading indicator`);
            setIsBuildingsLoadingLeft(false);
          }
        };
        
        // Start verification after a brief delay to let layers initialize
        requestAnimationFrame(() => {
          setTimeout(tryVerification, 50);
        });
      } catch (error) {
        console.error(`❌ ${mapSide}: Failed to load buildings:`, error);
        
        // Hide loading indicator on error for LEFT map
        setIsBuildingsLoadingLeft(false);
      }
    };
    
    // Load left map buildings
    if (leftMapRef.current) {
      loadBuildingsForMap(leftMapRef.current, 'Left', leftZoom);
    }
  }, [leftZoom, rightZoom, mapsReady.left, mapsReady.right, props.selectedWardId, is3DMode, setBuildingPopupData, setLeftWardPopupData, setRightWardPopupData]);

  // Load buildings layer for RIGHT map at all zoom levels
  useEffect(() => {
    // Wait for BOTH maps to be ready before loading buildings on either side
    if (!mapsReady.left || !mapsReady.right) return;
    if (!rightMapRef.current) return;
    
    const loadBuildingsForMap = async (map: maplibregl.Map, mapSide: string, currentZoom: number) => {
      const buildingsSourceId = `buildings_${mapSide.toLowerCase()}`;
      
      // Ensure map style is loaded before checking sources
      if (!map.isStyleLoaded || !map.isStyleLoaded()) {
        console.log(`⏳ ${mapSide}: Map style not loaded yet, skipping buildings check`);
        return;
      }

      
      // STRICT ENFORCEMENT: If buildings already loaded AND map is idle, skip
      // Otherwise show loading indicator until buildings are fully rendered
      if (map.getSource(buildingsSourceId)) {
        // Buildings exist, but check if they're fully rendered
        if (map.loaded() && !map.isMoving()) {
          console.log(`✅ ${mapSide}: Buildings already loaded and fully rendered`);
          setIsBuildingsLoadingRight(false); // Ensure indicator is hidden for RIGHT map
          return;
        } else {
          // Buildings exist but map is still loading/moving - show indicator until idle
          console.log(`⏳ ${mapSide}: Buildings exist but map is loading/moving - showing indicator`);
          setIsBuildingsLoadingRight(true);
          
          // Wait for idle
          const onMapIdle = () => {
            console.log(`🎨 ${mapSide}: Map is now idle - buildings fully visible`);
            setIsBuildingsLoadingRight(false);
            map.off('idle', onMapIdle);
          };
          map.once('idle', onMapIdle);
          return;
        }
      }
      
      console.log(`🏢 ${mapSide}: Loading buildings layer at all zoom levels`);
      
      // Show loading indicator for RIGHT map
      if (mapSide === 'Right') {
        setIsBuildingsLoadingRight(true);
      }
      
      try {
        // Build MVT (Mapbox Vector Tile) URL template
        // MVT tiles are automatically requested by MapLibre GL based on zoom/pan
        // This provides ultra-fast rendering with automatic viewport management
        const baseUrl = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/wms';
        
        // Construct MVT tile URL with CQL_FILTER for ward filtering if needed
        let tileUrl = baseUrl + 
          '?service=WMS&version=1.1.0&request=GetMap' +
          '&layers=WorldBank_Bohol:Buildings' +
          '&bbox={bbox-epsg-3857}' +
          '&width=512&height=512' +
          '&srs=EPSG:3857' +
          '&format=application/vnd.mapbox-vector-tile';
        
        // Add CQL filter for ward if needed (server-side filtering)
        if (props.selectedWardId && props.selectedWardId !== 'all') {
          const wardNumber = extractWardNumber(props.selectedWardId);
          if (wardNumber !== null) {
            tileUrl += `&CQL_FILTER=Ward=${wardNumber}`;
            console.log(`🔍 ${mapSide}: Applying ward filter to MVT tiles: Ward ${wardNumber}`);
          }
        }
        
        console.log(`📡 ${mapSide}: Using MVT tiles from GeoServer...`);
        console.log(`📍 ${mapSide}: Tile URL template:`, tileUrl);
        
        // No fetch needed - MVT tiles are loaded automatically by MapLibre GL
        // Just add the source and layers directly
        
        // Check if map still exists
        if (!map || !map.getSource) {
          console.log(`ℹ️  ${mapSide}: Map was destroyed, skipping layer addition`);
          setIsBuildingsLoadingRight(false);
          return;
        }
        
        // If source and all layers already exist, skip (concurrent request completed first)
        if (map.getSource(buildingsSourceId) && 
            map.getLayer(`buildings_${mapSide.toLowerCase()}`) && 
            map.getLayer(`buildings-fill_${mapSide.toLowerCase()}`) && 
            map.getLayer(`buildings-3d_${mapSide.toLowerCase()}`) && 
            map.getLayer(`buildings-highlight_${mapSide.toLowerCase()}`)) {
          console.log(`⚠️ ${mapSide}: Buildings source and layers already exist (added by concurrent request), skipping addition`);
          setIsBuildingsLoadingRight(false);
          return;
        }
        
        // If source exists but layers don't, remove source first to rebuild everything
        if (map.getSource(buildingsSourceId)) {
          console.log(`🔄 ${mapSide}: Buildings source exists without complete layers, removing and rebuilding...`);
          if (map.getLayer(`buildings-fill_${mapSide.toLowerCase()}`)) map.removeLayer(`buildings-fill_${mapSide.toLowerCase()}`);
          if (map.getLayer(`buildings-3d_${mapSide.toLowerCase()}`)) map.removeLayer(`buildings-3d_${mapSide.toLowerCase()}`);
          if (map.getLayer(`buildings-highlight_${mapSide.toLowerCase()}`)) map.removeLayer(`buildings-highlight_${mapSide.toLowerCase()}`);
          if (map.getLayer(`buildings_${mapSide.toLowerCase()}`)) map.removeLayer(`buildings_${mapSide.toLowerCase()}`);
          map.removeSource(buildingsSourceId);
        }
        
        // Add MVT (Vector Tile) source
        map.addSource(buildingsSourceId, {
          type: 'vector',
          tiles: [tileUrl],
          minzoom: 0,
          maxzoom: 22
        });
        
        // Add fill layer for click interaction with category-based coloring
        map.addLayer({
          id: `buildings-fill_${mapSide.toLowerCase()}`,
          type: 'fill',
          source: buildingsSourceId,
          'source-layer': 'Buildings_v2', // MVT source layer name
          minzoom: 0,
          layout: {
            'visibility': showBuildings && !is3DMode ? 'visible' : 'none'
          },
          paint: {
            // Category-based coloring
            'fill-color': [
              'match',
              ['get', 'Category'],
              'Residential', '#f6e717',
              'Commercial & Retail', '#e40021',
              'Tourism & Hospitality', '#de36dd',
              'Education & Institutional', '#2963ea',
              'Healthcare', '#2bdade',
              'Government & Public Services', '#29da11',
              'Religious & Cultural', '#eb7120',
              '#D4D4D8' // Default
            ],
            'fill-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 0.4,
              13, 0.5,
              15, 0.6,
              17, 0.7
            ]
          }
        });
        
        // Add 3D extrusion layer (for 3D mode)
        map.addLayer({
          id: `buildings-3d_${mapSide.toLowerCase()}`,
          type: 'fill-extrusion',
          source: buildingsSourceId,
          'source-layer': 'Buildings_v2', // MVT source layer name
          minzoom: 0,
          layout: {
            'visibility': showBuildings && is3DMode ? 'visible' : 'none'
          },
          paint: {
            'fill-extrusion-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#2563EB', // Innpact blue on hover
              [
                'match',
                ['get', 'Category'],
                'Residential', '#f6e717',
                'Commercial & Retail', '#e40021',
                'Tourism & Hospitality', '#de36dd',
                'Education & Institutional', '#2963ea',
                'Healthcare', '#2bdade',
                'Government & Public Services', '#29da11',
                'Religious & Cultural', '#eb7120',
                '#E2E8F0' // Default
              ]
            ],
            'fill-extrusion-height': [
              '*',
              ['to-number', ['coalesce', ['get', 'floor'], 1]],
              4
            ],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.7,
            'fill-extrusion-vertical-gradient': true
          }
        });
        
        // Add highlight layer for hover effect (semi-transparent blue fill)
        map.addLayer({
          id: `buildings-highlight_${mapSide.toLowerCase()}`,
          type: 'fill',
          source: buildingsSourceId,
          'source-layer': 'Buildings_v2', // MVT source layer name
          minzoom: 0,
          layout: {
            'visibility': showBuildings ? 'visible' : 'none'
          },
          paint: {
            'fill-color': '#2563EB', // Innpact blue
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.3, // 30% opacity on hover
              0 // invisible otherwise
            ]
          }
        });
        
        // Add buildings layer with category-based darker outline
        map.addLayer({
          id: `buildings_${mapSide.toLowerCase()}`,
          type: 'line',
          source: buildingsSourceId,
          'source-layer': 'Buildings_v2', // MVT source layer name
          minzoom: 0,
          layout: {
            'visibility': showBuildings ? 'visible' : 'none'
          },
          paint: {
            // Category-based darker outline color for better visibility
            'line-color': [
              'match',
              ['get', 'Category'],
              'Residential', '#dfd229',
              'Commercial & Retail', '#d41a40',
              'Tourism & Hospitality', '#aa29aa',
              'Education & Institutional', '#1d46a6',
              'Healthcare', '#1e989a',
              'Government & Public Services', '#24bd0f',
              'Religious & Cultural', '#a24e16',
              '#71717A'
            ],
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 0.3,
              13, 0.5,
              15, 0.7,
              16, 0.8,
              18, 1.0
            ]
          }
        });
        
        // Move basemap labels to top after adding building layers
        moveBasemapLabelsToTop(map, currentBasemap);
        
        // Track hovered building for highlight effect
        let hoveredBuildingId: string | number | null = null;
        let selectedBuildingId: string | number | null = null;
        
        // Add hover highlighting effect for fill layer
        map.on('mousemove', `buildings-fill_${mapSide.toLowerCase()}`, (e) => {
          if (e.features && e.features.length > 0) {
            const featureId = e.features[0].id as string | number;
            
            // Don't change hover if this is the selected building
            if (featureId !== selectedBuildingId && hoveredBuildingId !== featureId) {
              // Clear previous hover
              if (hoveredBuildingId !== null && hoveredBuildingId !== selectedBuildingId) {
                map.setFeatureState(
                  { source: buildingsSourceId, sourceLayer: 'Buildings', id: hoveredBuildingId },
                  { hover: false }
                );
              }
              
              // Set new hover
              hoveredBuildingId = featureId;
              map.setFeatureState(
                { source: buildingsSourceId, sourceLayer: 'Buildings', id: hoveredBuildingId },
                { hover: true }
              );
            }
          }
        });
        
        // Clear hover state when mouse leaves
        map.on('mouseleave', `buildings-fill_${mapSide.toLowerCase()}`, () => {
          if (hoveredBuildingId !== null && hoveredBuildingId !== selectedBuildingId) {
            map.setFeatureState(
              { source: buildingsSourceId, sourceLayer: 'Buildings', id: hoveredBuildingId },
              { hover: false }
            );
          }
          hoveredBuildingId = null;
        });
        
        // Add hover highlighting effect for 3D layer
        map.on('mousemove', `buildings-3d_${mapSide.toLowerCase()}`, (e) => {
          if (e.features && e.features.length > 0) {
            const featureId = e.features[0].id as string | number;
            
            // Don't change hover if this is the selected building
            if (featureId !== selectedBuildingId && hoveredBuildingId !== featureId) {
              // Clear previous hover
              if (hoveredBuildingId !== null && hoveredBuildingId !== selectedBuildingId) {
                map.setFeatureState(
                  { source: buildingsSourceId, sourceLayer: 'Buildings', id: hoveredBuildingId },
                  { hover: false }
                );
              }
              
              // Set new hover
              hoveredBuildingId = featureId;
              map.setFeatureState(
                { source: buildingsSourceId, sourceLayer: 'Buildings', id: hoveredBuildingId },
                { hover: true }
              );
            }
          }
        });
        
        // Clear hover state when mouse leaves 3D layer
        map.on('mouseleave', `buildings-3d_${mapSide.toLowerCase()}`, () => {
          if (hoveredBuildingId !== null && hoveredBuildingId !== selectedBuildingId) {
            map.setFeatureState(
              { source: buildingsSourceId, sourceLayer: 'Buildings', id: hoveredBuildingId },
              { hover: false }
            );
          }
          hoveredBuildingId = null;
        });
        
        // Add click handler for popup
        map.on('click', `buildings-fill_${mapSide.toLowerCase()}`, (e) => {
          if (!e.features || e.features.length === 0) return;
          
          const feature = e.features[0];
          const props = feature.properties;
          
          console.log(`🏢 ${mapSide}: Building clicked:`, props);
          
          // Clear previous selected building highlight if it exists
          if (selectedBuildingId !== null) {
            map.setFeatureState(
              { source: buildingsSourceId, sourceLayer: 'Buildings', id: selectedBuildingId },
              { hover: false }
            );
          }
          
          // Set selected building for persistent highlight
          selectedBuildingId = feature.id as string | number;
          selectedBuildingIdRefRight.current = selectedBuildingId;
          map.setFeatureState(
            { source: buildingsSourceId, sourceLayer: 'Buildings', id: selectedBuildingId },
            { hover: true }
          );
          
          // Close ward popups when building is clicked
          setLeftWardPopupData(null);
          setRightWardPopupData(null);
          
          // Get click coordinates
          const point = map.project(e.lngLat);
          
          setBuildingPopupData({
            buildingUse: props.Use || 'N/A',
            ward: props.Ward || 'N/A',
            floors: props.floor || 'N/A',
            hhi2025: props.HHI_2025 || 'N/A',
            airAqi: props.Air_AQI || 'N/A',
            floodHazard: props.Flood_Hazard || 'N/A',
            multiHazard: props.Multi_Hazard_BBSR || 'N/A',
            lng: e.lngLat.lng,
            lat: e.lngLat.lat,
            x: point.x,
            y: point.y,
            mapSide: mapSide.toLowerCase()
          });
        });
        
        // Change cursor on hover
        map.on('mouseenter', `buildings-fill_${mapSide.toLowerCase()}`, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', `buildings-fill_${mapSide.toLowerCase()}`, () => {
          map.getCanvas().style.cursor = '';
        });
        
        // Add click handler for 3D buildings (same popup as 2D)
        map.on('click', `buildings-3d_${mapSide.toLowerCase()}`, (e) => {
          if (!e.features || e.features.length === 0) return;
          
          const feature = e.features[0];
          const props = feature.properties;
          
          console.log(`🏗️ ${mapSide}: 3D Building clicked:`, props);
          
          // Clear previous selected building highlight if it exists
          if (selectedBuildingId !== null) {
            map.setFeatureState(
              { source: buildingsSourceId, sourceLayer: 'Buildings', id: selectedBuildingId },
              { hover: false }
            );
          }
          
          // Set selected building for persistent highlight
          selectedBuildingId = feature.id as string | number;
          selectedBuildingIdRefRight.current = selectedBuildingId;
          map.setFeatureState(
            { source: buildingsSourceId, sourceLayer: 'Buildings', id: selectedBuildingId },
            { hover: true }
          );
          
          // Close ward popups when building is clicked
          setLeftWardPopupData(null);
          setRightWardPopupData(null);
          
          // Get click coordinates
          const point = map.project(e.lngLat);
          
          setBuildingPopupData({
            buildingUse: props.Use || 'N/A',
            ward: props.Ward || 'N/A',
            floors: props.floor || 'N/A',
            hhi2025: props.HHI_2025 || 'N/A',
            airAqi: props.Air_AQI || 'N/A',
            floodHazard: props.Flood_Hazard || 'N/A',
            multiHazard: props.Multi_Hazard_BBSR || 'N/A',
            lng: e.lngLat.lng,
            lat: e.lngLat.lat,
            x: point.x,
            y: point.y,
            mapSide: mapSide.toLowerCase()
          });
        });
        
        // Change cursor on hover for 3D buildings
        map.on('mouseenter', `buildings-3d_${mapSide.toLowerCase()}`, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', `buildings-3d_${mapSide.toLowerCase()}`, () => {
          map.getCanvas().style.cursor = '';
        });
        
        console.log(`✅ ${mapSide}: Buildings layers added successfully`);
        
        // MVT tiles don't need viewport-based reloading - MapLibre GL handles this automatically
        console.log(`📍 ${mapSide}: MVT tiles will auto-load on pan/zoom`);
        
        // STRICT ENFORCEMENT: Verify buildings are actually visible before hiding loading indicator
        // Use polling with retry logic instead of idle events
        let verificationAttempts = 0;
        const maxAttempts = 60; // 60 attempts * 150ms = 9 seconds max (increased for comparison view reliability)
        
        const tryVerification = () => {
          verificationAttempts++;
          const isActuallyVisible = verifyBuildingsAreActuallyVisible(map, mapSide);
          
          if (isActuallyVisible) {
            console.log(`🎨 [${mapSide}] Buildings VERIFIED as visible (attempt ${verificationAttempts}) - hiding loading indicator`);
            setIsBuildingsLoadingRight(false);
          } else if (verificationAttempts < maxAttempts) {
            console.log(`🔄 [${mapSide}] Buildings not yet visible (attempt ${verificationAttempts}/${maxAttempts}), retrying...`);
            setTimeout(tryVerification, 150); // Retry every 150ms (increased interval)
          } else {
            console.log(`✅ [${mapSide}] Buildings verification timeout reached - layers added successfully, hiding loading indicator`);
            setIsBuildingsLoadingRight(false);
          }
        };
        
        // Start verification after a brief delay to let layers initialize
        requestAnimationFrame(() => {
          setTimeout(tryVerification, 50);
        });
      } catch (error) {
        console.error(`❌ ${mapSide}: Failed to load buildings:`, error);
        
        // Hide loading indicator on error for RIGHT map
        setIsBuildingsLoadingRight(false);
      }
    };
    
    // Load right map buildings
    if (rightMapRef.current) {
      loadBuildingsForMap(rightMapRef.current, 'Right', rightZoom);
    }
  }, [leftZoom, rightZoom, mapsReady.left, mapsReady.right, props.selectedWardId, is3DMode, setBuildingPopupData, setLeftWardPopupData, setRightWardPopupData]);

  // Zoom and navigation handlers
  const handleZoomIn = () => {
    if (leftMapRef.current) leftMapRef.current.zoomIn();
    if (rightMapRef.current) rightMapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (leftMapRef.current) leftMapRef.current.zoomOut();
    if (rightMapRef.current) rightMapRef.current.zoomOut();
  };

  const handleResetView = () => {
    const municipalBounds = leftMapRef.current ? (leftMapRef.current as any)._municipalBounds : null;
    
    if (leftMapRef.current) {
      if (municipalBounds) {
        leftMapRef.current.fitBounds(municipalBounds, {
          padding: 80,
          duration: 1500,
          pitch: 0,
          bearing: 0
        });
      } else {
        leftMapRef.current.flyTo({
          center: BOHOL_CENTER,
          zoom: INITIAL_ZOOM,
          pitch: 0,
          bearing: 0,
          duration: 1500
        });
      }
    }
    if (rightMapRef.current) {
      if (municipalBounds) {
        rightMapRef.current.fitBounds(municipalBounds, {
          padding: 80,
          duration: 1500,
          pitch: 0,
          bearing: 0
        });
      } else {
        rightMapRef.current.flyTo({
          center: BOHOL_CENTER,
          zoom: INITIAL_ZOOM,
          pitch: 0,
          bearing: 0,
          duration: 1500
        });
      }
    }
    // Reset 3D mode when resetting view
    setIs3DMode(false);
  };

  const handleToggle3D = () => {
    const newIs3D = !is3DMode;
    setIs3DMode(newIs3D);
    
    if (newIs3D) {
      // Enable 3D mode on both maps
      if (leftMapRef.current) {
        leftMapRef.current.easeTo({
          pitch: 60,
          bearing: 0,
          duration: 1000
        });
      }
      if (rightMapRef.current) {
        rightMapRef.current.easeTo({
          pitch: 60,
          bearing: 0,
          duration: 1000
        });
      }
    } else {
      // Disable 3D mode on both maps
      if (leftMapRef.current) {
        leftMapRef.current.easeTo({
          pitch: 0,
          bearing: 0,
          duration: 1000
        });
      }
      if (rightMapRef.current) {
        rightMapRef.current.easeTo({
          pitch: 0,
          bearing: 0,
          duration: 1000
        });
      }
    }
  };

  // Toggle 3D buildings layer visibility based on is3DMode
  useEffect(() => {
    // Handle left map
    if (leftMapRef.current) {
      const leftMap = leftMapRef.current;
      if (leftMap.getLayer('buildings-fill_left') && leftMap.getLayer('buildings-3d_left')) {
        if (is3DMode) {
          // Hide 2D fill, show 3D extrusion
          leftMap.setLayoutProperty('buildings-fill_left', 'visibility', 'none');
          leftMap.setLayoutProperty('buildings-3d_left', 'visibility', 'visible');
        } else {
          // Show 2D fill, hide 3D extrusion
          leftMap.setLayoutProperty('buildings-fill_left', 'visibility', 'visible');
          leftMap.setLayoutProperty('buildings-3d_left', 'visibility', 'none');
        }
      }
    }
    
    // Handle right map
    if (rightMapRef.current) {
      const rightMap = rightMapRef.current;
      if (rightMap.getLayer('buildings-fill_right') && rightMap.getLayer('buildings-3d_right')) {
        if (is3DMode) {
          // Hide 2D fill, show 3D extrusion
          rightMap.setLayoutProperty('buildings-fill_right', 'visibility', 'none');
          rightMap.setLayoutProperty('buildings-3d_right', 'visibility', 'visible');
        } else {
          // Show 2D fill, hide 3D extrusion
          rightMap.setLayoutProperty('buildings-fill_right', 'visibility', 'visible');
          rightMap.setLayoutProperty('buildings-3d_right', 'visibility', 'none');
        }
      }
    }
  }, [is3DMode]);

  // Toggle building use layer visibility on both maps
  useEffect(() => {
    const maps = [
      { ref: leftMapRef.current, side: 'left' },
      { ref: rightMapRef.current, side: 'right' },
    ];
    maps.forEach(({ ref: map, side }) => {
      if (!map) return;
      const vis = showBuildings ? 'visible' : 'none';
      const fillId = `buildings-fill_${side}`;
      const threeDId = `buildings-3d_${side}`;
      const lineId = `buildings_${side}`;
      const highlightId = `buildings-highlight_${side}`;
      if (map.getLayer(fillId)) map.setLayoutProperty(fillId, 'visibility', showBuildings && !is3DMode ? 'visible' : 'none');
      if (map.getLayer(threeDId)) map.setLayoutProperty(threeDId, 'visibility', showBuildings && is3DMode ? 'visible' : 'none');
      if (map.getLayer(lineId)) map.setLayoutProperty(lineId, 'visibility', vis);
      if (map.getLayer(highlightId)) map.setLayoutProperty(highlightId, 'visibility', vis);
    });
  }, [showBuildings, is3DMode]);

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC]">
      <Header 
        onReset={() => {}}
        onQueryToggle={() => {}}
        isQueryActive={false}
        selectedWardId={props.selectedWardId}
        onWardSelect={props.onWardSelect}
        selectedRoadName="all"
        onRoadNameSelect={() => {}}
        activeRoadSafetySubLayers={[]}
        onRoadZoom={() => {}}
        onResetView={() => {}}
        isComparisonMode={true}
        onExitComparison={props.onClose}
      />

      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {/* Buildings Loading Indicator (appears at zoom >= 15.3) - SYNCHRONIZED for both maps */}
        {isBuildingsLoading && ((leftZoom !== undefined && leftZoom >= 15.3) || (rightZoom !== undefined && rightZoom >= 15.3)) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-full shadow-xl border border-[#E2E8F0]/50 flex items-center gap-2">
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 border-2 border-[#2563EB]/20 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <span className="text-xs text-slate-600">Loading buildings</span>
            </div>
          </div>
        )}
        
        {/* Hazard Layer Loading Indicator (blocks interaction) */}
        {isHazardLayerLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto cursor-wait bg-black/5 backdrop-blur-[1px]">
            <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-full shadow-xl border border-[#E2E8F0]/50 flex items-center gap-2">
              <div className="relative w-4 h-4">
                <div className="absolute inset-0 border-2 border-[#2563EB]/20 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <span className="text-xs text-slate-600">Loading layer</span>
            </div>
          </div>
        )}
        
        {/* Right Map (full, behind) */}
        <div className="absolute inset-0 z-10">
          <div ref={rightMapContainerRef} className="w-full h-full" />
        </div>

        {/* Left Map (clipped, on top) */}
        <div 
          className="absolute inset-0 z-20"
          style={{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        >
          <div ref={leftMapContainerRef} className="w-full h-full" data-comparison-map="left" />
        </div>

        {/* Vertical Divider */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-40"
          style={{
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)',
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center border border-white/60 hover:bg-white/90 hover:scale-105 transition-all duration-200 cursor-grab active:cursor-grabbing">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-4 bg-gradient-to-b from-[#2563EB]/60 via-[#2563EB] to-[#2563EB]/60 rounded-full" />
              <div className="w-0.5 h-4 bg-gradient-to-b from-[#2563EB]/60 via-[#2563EB] to-[#2563EB]/60 rounded-full" />
            </div>
          </div>
        </div>

        {/* Left Panel - Layer Selector */}
        <LayerSelector
          side="left"
          sector={props.leftSector}
          layer={props.leftLayer}
          scenario={props.leftScenario}
          onSectorChange={props.onLeftSectorChange}
          onLayerChange={props.onLeftLayerChange}
          onScenarioChange={props.onLeftScenarioChange}
        />

        {/* Right Panel - Layer Selector */}
        <LayerSelector
          side="right"
          sector={props.rightSector}
          layer={props.rightLayer}
          scenario={props.rightScenario}
          onSectorChange={props.onRightSectorChange}
          onLayerChange={props.onRightLayerChange}
          onScenarioChange={props.onRightScenarioChange}
        />

        {/* Map Navigation Controls */}
        <div className="absolute top-4 right-[264px] z-30 flex flex-col gap-1.5">
          {/* Home / Reset View */}
          <button
            onClick={handleResetView}
            className="w-8 h-8 bg-white/95 backdrop-blur-sm border border-[#E2E8F0] rounded-md shadow-sm hover:shadow-md hover:border-[#2563EB] transition-all duration-200 flex items-center justify-center group"
            title="Reset View"
          >
            <Home className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#2563EB] transition-colors" />
          </button>

          {/* 3D Toggle Button */}
          <button
            onClick={handleToggle3D}
            className={`w-8 h-8 bg-white/95 backdrop-blur-sm border ${is3DMode ? 'border-[#2563EB] shadow-md' : 'border-[#E2E8F0] shadow-sm'} rounded-md hover:shadow-md hover:border-[#2563EB] transition-all duration-200 flex items-center justify-center group`}
            title={is3DMode ? "Disable 3D View" : "Enable 3D View"}
          >
            <Box className={`w-3.5 h-3.5 ${is3DMode ? 'text-[#2563EB]' : 'text-slate-600'} group-hover:text-[#2563EB] transition-colors`} />
          </button>

          {/* Building Use Layer Toggle */}
          <button
            onClick={() => setShowBuildings(prev => !prev)}
            className={`w-8 h-8 bg-white/95 backdrop-blur-sm border ${showBuildings ? 'border-[#2563EB] shadow-md' : 'border-[#E2E8F0] shadow-sm'} rounded-md hover:shadow-md hover:border-[#2563EB] transition-all duration-200 flex items-center justify-center group`}
            title={showBuildings ? "Hide Building Use Layer" : "Show Building Use Layer"}
          >
            <Building2 className={`w-3.5 h-3.5 ${showBuildings ? 'text-[#2563EB]' : 'text-slate-600'} group-hover:text-[#2563EB] transition-colors`} />
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 bg-white/95 backdrop-blur-sm border border-[#E2E8F0] rounded-md shadow-sm hover:shadow-md hover:border-[#2563EB] transition-all duration-200 flex items-center justify-center group"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-slate-600 group-hover:text-[#2563EB] transition-colors" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 bg-white/95 backdrop-blur-sm border border-[#E2E8F0] rounded-md shadow-sm hover:shadow-md hover:border-[#2563EB] transition-all duration-200 flex items-center justify-center group"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-slate-600 group-hover:text-[#2563EB] transition-colors" />
          </button>

          {/* Basemap Switcher */}
          <div className="relative">
            <button
              onClick={() => setBasemapSwitcherOpen(!basemapSwitcherOpen)}
              className={`w-8 h-8 bg-white/95 backdrop-blur-sm border ${basemapSwitcherOpen ? 'border-[#2563EB] shadow-md' : 'border-[#E2E8F0] shadow-sm'} rounded-md hover:shadow-md hover:border-[#2563EB] transition-all duration-200 flex items-center justify-center group`}
              title="Basemap"
            >
              <Layers className={`w-4 h-4 ${basemapSwitcherOpen ? 'text-[#2563EB]' : 'text-slate-600'} group-hover:text-[#2563EB] transition-colors`} />
            </button>

            {/* Basemap Dropdown */}
            {basemapSwitcherOpen && (
              <div className="absolute top-0 right-full mr-2 bg-white/95 backdrop-blur-sm border border-[#E2E8F0] rounded-md shadow-lg overflow-hidden min-w-[120px]">
                <button
                  onClick={() => {
                    setCurrentBasemap('light');
                    setBasemapSwitcherOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-[#F8FAFC] transition-colors flex items-center gap-2 ${currentBasemap === 'light' ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-slate-700'}`}
                >
                  <Map className="w-4 h-4" />
                  <span>Grey</span>
                </button>
                <button
                  onClick={() => {
                    setCurrentBasemap('satellite');
                    setBasemapSwitcherOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-[#F8FAFC] transition-colors flex items-center gap-2 border-t border-[#F1F5F9] ${currentBasemap === 'satellite' ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-slate-700'}`}
                >
                  <Satellite className="w-4 h-4" />
                  <span>Satellite</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Custom Attribution Control - Fixed position, always on top */}
        <div 
          className="absolute bottom-2 right-[248px] z-50 flex items-center transition-all duration-200"
          style={{
            height: '24px',
            minHeight: '24px',
            gap: '0'
          }}
        >
          <div 
            className="flex items-center overflow-hidden transition-all duration-200 ease-in-out"
            style={{
              maxWidth: attributionOpen ? '500px' : '0px',
              opacity: attributionOpen ? 1 : 0,
              marginRight: attributionOpen ? '0px' : '0px'
            }}
          >
            <div 
              className="text-[9px] font-medium whitespace-nowrap px-2.5 py-1 rounded-sm"
              style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                letterSpacing: '0.01em',
                lineHeight: '1.5',
                background: currentBasemap === 'satellite' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(8px)',
                textShadow: currentBasemap === 'satellite' ? '0 1px 3px rgba(0, 0, 0, 0.8)' : '0 1px 2px rgba(255, 255, 255, 0.8)',
                color: currentBasemap === 'satellite' ? '#FFFFFF' : '#64748B',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                marginRight: '3px'
              }}
            >
              &nbsp;<a href="https://tagbilaran.gov.ph/" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: currentBasemap === 'satellite' ? '#FFFFFF' : '#2563EB', fontWeight: 600, textDecoration: 'none' }}>City Government of Tagbilaran</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://dauis.igov.ph/" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: currentBasemap === 'satellite' ? '#FFFFFF' : '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Municipality of Dauis</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://panglaolgu.gov.ph/" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: currentBasemap === 'satellite' ? '#FFFFFF' : '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Municipality of Panglao</a>&nbsp;&nbsp;|&nbsp;&nbsp;Developed by&nbsp;<a href="https://innpactsolutions.com/" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: currentBasemap === 'satellite' ? '#FFFFFF' : '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Innpact Solutions</a>
            </div>
          </div>
          <button
            onClick={() => setAttributionOpen(!attributionOpen)}
            className="flex-shrink-0 flex items-center justify-center transition-all duration-200"
            style={{
              width: '16px',
              height: '16px',
              minWidth: '16px',
              background: currentBasemap === 'satellite' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(37, 99, 235, 0.15)',
              backdropFilter: 'blur(8px)',
              borderRadius: '50%',
              border: currentBasemap === 'satellite' ? '1.5px solid #FFFFFF' : '1.5px solid #2563EB',
              boxShadow: currentBasemap === 'satellite' ? '0 1px 3px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(37, 99, 235, 0.2)',
              cursor: 'pointer',
              padding: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = currentBasemap === 'satellite' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(37, 99, 235, 0.25)';
              e.currentTarget.style.borderColor = currentBasemap === 'satellite' ? '#E0E7FF' : '#1D4ED8';
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = currentBasemap === 'satellite' ? '0 2px 5px rgba(0, 0, 0, 0.5)' : '0 2px 5px rgba(37, 99, 235, 0.3)';
              const span = e.currentTarget.querySelector('span');
              if (span) span.style.color = currentBasemap === 'satellite' ? '#E0E7FF' : '#1D4ED8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = currentBasemap === 'satellite' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(37, 99, 235, 0.15)';
              e.currentTarget.style.borderColor = currentBasemap === 'satellite' ? '#FFFFFF' : '#2563EB';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = currentBasemap === 'satellite' ? '0 1px 3px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(37, 99, 235, 0.2)';
              const span = e.currentTarget.querySelector('span');
              if (span) span.style.color = currentBasemap === 'satellite' ? '#FFFFFF' : '#2563EB';
            }}
            title="Map Credits"
          >
            <span 
              className="text-[9px] font-bold italic block transition-colors" 
              style={{ 
                fontFamily: 'Georgia, serif',
                color: currentBasemap === 'satellite' ? '#FFFFFF' : '#2563EB',
                lineHeight: 1
              }}
            >
              i
            </span>
          </button>
        </div>

        {/* Zoom Level Indicator - Above Scale Bar */}
        {leftZoom !== undefined && (
          <div className="absolute bottom-14 left-[260px] z-40 pointer-events-none animate-in fade-in duration-300">
            <div className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm">
              <span className="text-[10px] text-slate-700">Zoom: {leftZoom.toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* Left Legend Panel */}
        <ComparisonLegendPanel
          side="left"
          sector={props.leftSector}
          layerId={props.leftLayer}
          scenario={props.leftScenario}
          opacity={leftOpacity}
          onOpacityChange={setLeftOpacity}
          selectedWardId={props.selectedWardId}
        />

        {/* Right Legend Panel */}
        <ComparisonLegendPanel
          side="right"
          sector={props.rightSector}
          layerId={props.rightLayer}
          scenario={props.rightScenario}
          opacity={rightOpacity}
          onOpacityChange={setRightOpacity}
          selectedWardId={props.selectedWardId}
        />

        {/* Building Popup */}
        {buildingPopupData && (
          <BuildingPopup
            buildingUse={buildingPopupData.buildingUse}
            ward={buildingPopupData.ward}
            floors={buildingPopupData.floors}
            hhi2025={buildingPopupData.hhi2025}
            airAqi={buildingPopupData.airAqi}
            floodHazard={buildingPopupData.floodHazard}
            multiHazard={buildingPopupData.multiHazard}
            x={buildingPopupData.x}
            y={buildingPopupData.y}
            onClose={() => {
              // Clear selected building highlight from the appropriate map
              if (buildingPopupData.mapSide === 'left' && leftMapRef.current && selectedBuildingIdRefLeft.current !== null) {
                leftMapRef.current.setFeatureState(
                  { source: 'buildings_left', sourceLayer: 'Buildings', id: selectedBuildingIdRefLeft.current },
                  { hover: false }
                );
                selectedBuildingIdRefLeft.current = null;
              } else if (buildingPopupData.mapSide === 'right' && rightMapRef.current && selectedBuildingIdRefRight.current !== null) {
                rightMapRef.current.setFeatureState(
                  { source: 'buildings_right', sourceLayer: 'Buildings', id: selectedBuildingIdRefRight.current },
                  { hover: false }
                );
                selectedBuildingIdRefRight.current = null;
              }
              setBuildingPopupData(null);
            }}
          />
        )}
        
        {/* Left Ward Popup */}
        {leftWardPopupData && (
          <WardPopup
            wardName={leftWardPopupData.wardName}
            wardNumber={leftWardPopupData.wardNumber}
            population={leftWardPopupData.population}
            area={leftWardPopupData.area}
            density={leftWardPopupData.density}
            households={leftWardPopupData.households}
            buildings={leftWardPopupData.buildings}
            zone={leftWardPopupData.zone}
            lguName={leftWardPopupData.lguName}
            x={leftWardPopupData.x}
            y={leftWardPopupData.y}
            onClose={() => setLeftWardPopupData(null)}
          />
        )}
        
        {/* Right Ward Popup */}
        {rightWardPopupData && (
          <WardPopup
            wardName={rightWardPopupData.wardName}
            wardNumber={rightWardPopupData.wardNumber}
            population={rightWardPopupData.population}
            area={rightWardPopupData.area}
            density={rightWardPopupData.density}
            households={rightWardPopupData.households}
            buildings={rightWardPopupData.buildings}
            zone={rightWardPopupData.zone}
            lguName={rightWardPopupData.lguName}
            x={rightWardPopupData.x}
            y={rightWardPopupData.y}
            onClose={() => setRightWardPopupData(null)}
          />
        )}
      </div>
    </div>
  );
}

// Layer Selector Component
interface LayerSelectorProps {
  side: 'left' | 'right';
  sector: Sector;
  layer: string;
  scenario: Scenario;
  onSectorChange: (sector: Sector) => void;
  onLayerChange: (layer: string) => void;
  onScenarioChange: (scenario: Scenario) => void;
}

function LayerSelector({ side, sector, layer, scenario, onSectorChange, onLayerChange, onScenarioChange }: LayerSelectorProps) {
  const [sectorOpen, setSectorOpen] = useState(false);
  const [layerOpen, setLayerOpen] = useState(false);

  const currentSector = SECTORS.find(s => s.id === sector);
  const currentLayers = SECTOR_LAYERS[sector] || [];
  const currentLayer = currentLayers.find(l => l.id === layer);
  const SectorIcon = currentSector?.icon || Flame;

  // Auto-select first layer when sector changes
  useEffect(() => {
    const firstLayer = (SECTOR_LAYERS[sector] || [])[0];
    if (firstLayer && firstLayer.id !== layer) {
      onLayerChange(firstLayer.id);
    }
  }, [sector]);

  return (
    <div 
      className={`absolute top-4 ${side === 'left' ? 'left-4' : 'right-4'} z-30`}
      style={{ width: '240px' }}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-[#E5E7EB]">
        {/* Compact Header */}
        <div 
          className="px-3 py-2 border-b border-[#E5E7EB]/50 rounded-t-lg"
          style={{ backgroundColor: currentSector?.color + '08' }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ backgroundColor: currentSector?.color }}
            >
              <SectorIcon className="w-3 h-3 text-white" />
            </div>
            <h3 className="text-[10px] font-bold text-[#0F172A] uppercase tracking-wide">
              {side === 'left' ? 'Left' : 'Right'} View
            </h3>
          </div>
        </div>

        {/* Sector Dropdown - Compact */}
        <div className="px-2.5 pt-2.5 pb-2">
          <label className="block text-[9px] font-semibold text-[#64748B] mb-1 uppercase tracking-wide">Sector</label>
          <div className="relative">
            <button
              onClick={() => setSectorOpen(!sectorOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-md hover:border-[#2563EB] hover:bg-white transition-all text-left group"
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <SectorIcon className="w-3 h-3 flex-shrink-0" style={{ color: currentSector?.color }} />
                <span className="text-[11px] text-[#0F172A] font-medium truncate">{currentSector?.name}</span>
              </div>
              <ChevronDown className={`w-3 h-3 text-[#94A3B8] flex-shrink-0 transition-transform ${sectorOpen ? 'rotate-180' : ''}`} />
            </button>

            {sectorOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-[90]" onClick={() => setSectorOpen(false)} />
                
                {/* Dropdown */}
                <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-md shadow-xl z-[100] max-h-56 overflow-y-auto">
                  {SECTORS.map(s => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          onSectorChange(s.id);
                          setSectorOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#F1F5F9] transition-colors text-left border-b border-[#F1F5F9] last:border-0 ${
                          s.id === sector ? 'bg-[#EFF6FF]' : ''
                        }`}
                      >
                        <Icon className="w-3 h-3 flex-shrink-0" style={{ color: s.color }} />
                        <span className="text-[11px] text-[#0F172A] font-medium">{s.name}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Layer Dropdown - Compact */}
        <div className="px-2.5 pb-2.5 rounded-b-lg">
          <label className="block text-[9px] font-semibold text-[#64748B] mb-1 uppercase tracking-wide">Layer</label>
          <div className="relative">
            <button
              onClick={() => setLayerOpen(!layerOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-md hover:border-[#2563EB] hover:bg-white transition-all text-left group"
            >
              <span className="text-[11px] text-[#0F172A] font-medium truncate flex-1 min-w-0">{currentLayer?.name}</span>
              <ChevronDown className={`w-3 h-3 text-[#94A3B8] flex-shrink-0 transition-transform ${layerOpen ? 'rotate-180' : ''}`} />
            </button>

            {layerOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-[90]" onClick={() => setLayerOpen(false)} />
                
                {/* Dropdown */}
                <div className="absolute left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-md shadow-xl z-[100] max-h-56 overflow-y-auto">
                  {currentLayers.map(l => (
                    <button
                      key={l.id}
                      onClick={() => {
                        onLayerChange(l.id);
                        setLayerOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 hover:bg-[#F1F5F9] transition-colors text-left border-b border-[#F1F5F9] last:border-0 ${
                        l.id === layer ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#0F172A]'
                      }`}
                    >
                      <span className="text-[11px] font-medium">{l.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}

// Comparison Legend Panel Component
interface ComparisonLegendPanelProps {
  side: 'left' | 'right';
  sector: Sector;
  layerId: string;
  scenario: string;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  selectedWardId?: string;
}

function ComparisonLegendPanel({ side, sector, layerId, scenario, opacity, onOpacityChange, selectedWardId }: ComparisonLegendPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [areaData, setAreaData] = useState<AreaDistributionData[]>([]);
  const [isLoadingArea, setIsLoadingArea] = useState(true);

  // Get legend from CSV
  const csvEntries = getUILayerLegend(layerId, scenario);
  const hasLegend = csvEntries.length > 0;

  // Fetch area distribution data
  useEffect(() => {
    let isCancelled = false;
    
    setIsLoadingArea(true);
    setAreaData([]);

    fetchAreaDistribution(sector, layerId, scenario as Scenario, selectedWardId)
      .then(data => {
        if (isCancelled) return;
        
        // Calculate total area and percentages
        const total = data.reduce((sum, item) => sum + item.value, 0);
        const dataWithPercentage = data
          .sort((a, b) => (a.gridcode || 0) - (b.gridcode || 0))
          .map(item => ({
            ...item,
            percentage: ((item.value / total) * 100)
          }));
        
        setAreaData(dataWithPercentage);
        setIsLoadingArea(false);
      })
      .catch(err => {
        if (isCancelled) return;
        console.error('❌ ComparisonLegendPanel: Error fetching area data:', err);
        setIsLoadingArea(false);
      });
    
    return () => {
      isCancelled = true;
    };
  }, [sector, layerId, scenario, selectedWardId]);

  if (!hasLegend) {
    console.warn(`⚠️ No legend found for ${layerId}/${scenario}`);
    return null;
  }

  const layerNames: Record<string, string> = {
    'elevation': 'Elevation',
    'builtup_density': 'Built-up Density',
    'flood_fhi': 'Flood Hazard Index (FHI)',
    'flood_hazard': 'Urban Flooding',
    'storm_surge': 'Storm Surge',
    'soil_classification': 'Soil Classification',
    'groundwater_depth': 'Groundwater Depth',
    'geology': 'Geology',
    'sinkhole': 'Sinkhole',
    'groundwater_infiltration_vulnerability': 'Groundwater Infiltration Vulnerability',
  };

  const layerName = layerNames[layerId] || layerId;

  // If minimized, show small button
  if (isMinimized) {
    return (
      <div className={`absolute bottom-4 ${side === 'left' ? 'left-4' : 'right-4'} z-30`}>
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-white/95 backdrop-blur-sm border border-[#E5E7EB] rounded-lg px-3 py-2 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
          <span className="text-[10px] font-semibold text-[#0F172A]">Legend</span>
          <Maximize2 className="w-3 h-3 text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`absolute bottom-4 ${side === 'left' ? 'left-4' : 'right-4'} z-30 w-56`}
    >
      {/* Glassmorphism container */}
      <div className="bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-white" />
              <h3 className="text-white font-semibold text-[11px]">Legend</h3>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-white/80 hover:text-white transition-colors p-0.5"
              title="Minimize"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[400px] overflow-y-auto">
          <div className="p-2 space-y-2">
            <div className="bg-white border border-[#E5E7EB] rounded-md overflow-hidden shadow-sm">
              {/* Legend Header */}
              <div className="bg-gradient-to-r from-[#F8FAFC] to-white px-2.5 py-1.5 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span className="text-[10px] font-semibold text-[#0F172A] truncate">
                    {layerName}
                  </span>
                </div>
              </div>

              {/* Legend Content */}
              <div className="px-2.5 py-2 bg-gradient-to-br from-[#FAFBFC] to-white space-y-2">
                <div className="space-y-2">
                  {csvEntries.map((entry, idx) => {
                    // Find matching area data by name first (more reliable), then fallback to color
                    const areaInfo = areaData.find(a => 
                      a.name.toLowerCase() === entry.label.toLowerCase() || 
                      a.color.toLowerCase() === entry.color.toLowerCase()
                    );
                    const percentage = areaInfo?.percentage || 0;
                    
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded shadow-md flex-shrink-0 border border-white/50"
                            style={{ backgroundColor: entry.color }}
                          />
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                            {/* Label on left, description on right */}
                            {layerId.includes('air') ? (
                              <>
                                <span className="text-[10px] text-[#1F2937] font-bold flex-shrink-0">
                                  {entry.label}
                                </span>
                                <span className="text-[9px] text-[#6B7280] flex-shrink-0 ml-2">
                                  {entry.description}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-[10px] text-[#0F172A] font-semibold truncate">
                                  {entry.label}
                                </span>
                                {entry.description && (
                                  <span className="text-[9px] text-[#6B7280] flex-shrink-0 ml-2">
                                    {entry.description}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Inline Progress Bar with Percentage - Always show */}
                        {!isLoadingArea && (
                          <div className="flex items-center gap-2 pl-6">
                            <div className="flex-1 h-3 bg-gradient-to-r from-[#E5E7EB] to-[#D1D5DB] rounded-full overflow-hidden shadow-inner border border-[#CBD5E1]">
                              <div 
                                className="h-full rounded-full transition-all duration-700 shadow-sm relative"
                                style={{ 
                                  backgroundColor: entry.color,
                                  width: `${percentage}%`,
                                  boxShadow: `inset 0 1px 3px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)`
                                }}
                              >
                                <div 
                                  className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full"
                                />
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-[#0F172A] w-12 text-right flex-shrink-0">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Opacity Control - Matching main app style */}
                <div className="pt-1.5 border-t border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={opacity * 100}
                      onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
                      className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2563EB] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm hover:[&::-webkit-slider-thumb]:bg-[#1D4ED8] [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#2563EB] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent"
                      style={{
                        background: `linear-gradient(to right, #2563EB 0%, #2563EB ${opacity * 100}%, #E5E7EB ${opacity * 100}%, #E5E7EB 100%)`
                      }}
                    />
                    <span className="text-[9px] font-semibold text-[#2563EB] w-7 text-right flex-shrink-0">
                      {Math.round(opacity * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Find first label layer to insert before it
function getFirstLabelLayerId(map: maplibregl.Map): string | undefined {
  const layers = map.getStyle().layers;
  if (!layers) return undefined;
  
  // Find the first label or symbol layer
  for (const layer of layers) {
    if (layer.type === 'symbol' || layer.id.includes('label') || layer.id.includes('place') || layer.id === 'labels') {
      return layer.id;
    }
  }
  return undefined;
}

// Move basemap labels to the top (STRICT ENFORCEMENT)
function moveBasemapLabelsToTop(map: maplibregl.Map, currentBasemap?: Basemap) {
  if (!map.getStyle()) {
    console.log('⚠️ Map style not loaded yet, skipping basemap label reordering');
    return;
  }
  
  const style = map.getStyle();
  const layers = style?.layers;
  
  if (!layers) {
    console.log('⚠️ Map style has no layers yet, skipping basemap label reordering');
    return;
  }
  
  const basemapLabelLayers: string[] = [];
  
  // For satellite basemap, explicitly handle the 'labels' layer
  if (currentBasemap === 'satellite') {
    if (map.getLayer('labels')) {
      basemapLabelLayers.push('labels');
    }
  } else {
    // For grey basemap (Carto Positron), identify all label layers
    layers.forEach((layer) => {
      const id = layer.id;
      
      // Skip our custom layers
      if (id.includes('ward_') || 
          id.includes('road_network_') || 
          id.includes('hazard_layer_') ||
          id.includes('buildings')) {
        return;
      }
      
      // 1. Explicit label/symbol layers from basemap
      if (layer.type === 'symbol') {
        basemapLabelLayers.push(layer.id);
      }
      // 2. Layers with 'label', 'text', 'place', or 'poi' in their name
      else if (id.includes('label') || id.includes('text') || id.includes('place') || id.includes('poi')) {
        basemapLabelLayers.push(layer.id);
      }
    });
  }
  
  // Move all basemap label layers to the top (in order)
  basemapLabelLayers.forEach((layerId) => {
    try {
      map.moveLayer(layerId);
      console.log(`✅ Moved basemap label to top: ${layerId}`);
    } catch (error) {
      console.warn(`⚠️ Could not move label layer ${layerId}:`, error);
    }
  });
  
  console.log(`🏷️ Moved ${basemapLabelLayers.length} basemap label layers to top`);
}

// Helper function to hide basemap buildings
function hideBasemapBuildings(map: maplibregl.Map) {
  if (!map.getStyle()) return;
  
  const style = map.getStyle();
  const layers = style?.layers;
  
  if (!layers) return;
  
  layers.forEach((layer) => {
    if (layer.id.includes('building')) {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
      console.log(`✅ Hidden basemap building layer: ${layer.id}`);
    }
  });
}

// 🔒 LOCKED FUNCTION - DO NOT MODIFY WITHOUT EXPLICIT APPROVAL
// ═══════════════════════════════════════════════════════════════════════════════
// Helper function to normalize city name text case in basemap labels
// Converts ALL CAPS labels (BHUBANESWAR) to Title Case (Bhubaneswar)
// 
// 🔒 CRITICAL LOCKED FUNCTIONALITY:
// - Processes ALL symbol layers with text-field property
// - Removes uppercase text-transform
// - Applies title case transformation using MapLibre expressions
// 
// ⚠️ DO NOT CHANGE THIS FUNCTION WITHOUT EXPLICIT APPROVAL FROM CLIENT
// ═══════════════════════════════════════════════════════════════════════════════
function normalizeCityNameCase(map: maplibregl.Map, mapSide: string) {
  // CRITICAL: Check if map has a style loaded
  if (!map.getStyle()) {
    console.log(`⚠️ ${mapSide}: Map style not loaded yet, skipping label normalization`);
    return;
  }
  
  const style = map.getStyle();
  const layers = style?.layers;
  
  if (!layers) {
    console.log(`⚠️ ${mapSide}: Map style has no layers yet, skipping label normalization`);
    return;
  }
  
  console.log(`🔍 ${mapSide}: Normalizing ALL label layers in Carto basemap...`);
  
  let normalizedCount = 0;
  
  // Target ALL symbol layers (labels) in the basemap
  layers.forEach((layer: any) => {
    // Process all symbol layers that have text-field (these are label layers)
    if (layer.type === 'symbol' && layer.layout?.['text-field']) {
      try {
        const currentTextField = layer.layout['text-field'];
        const currentTransform = layer.layout['text-transform'];
        
        console.log(`🔍 ${mapSide}: Processing label layer: ${layer.id}`);
        console.log(`   text-field:`, JSON.stringify(currentTextField));
        console.log(`   text-transform:`, currentTransform);
        
        // First, remove any text-transform that might be forcing uppercase
        map.setLayoutProperty(layer.id, 'text-transform', 'none');
        
        // Extract the field name from the text-field property
        let fieldName = 'name'; // default field name
        
        if (typeof currentTextField === 'string') {
          // Handle simple string fields like "{name}" or "name"
          if (currentTextField.startsWith('{') && currentTextField.endsWith('}')) {
            fieldName = currentTextField.slice(1, -1);
          } else {
            // Plain string, not a field reference - skip transformation
            console.log(`   ⏩ Skipping static text: ${layer.id}`);
            return;
          }
        } else if (Array.isArray(currentTextField)) {
          // Handle MapLibre expressions
          if (currentTextField[0] === 'get' && currentTextField[1]) {
            fieldName = currentTextField[1];
          } else if (currentTextField[0] === 'coalesce') {
            // Handle coalesce expressions - extract first field
            for (let i = 1; i < currentTextField.length; i++) {
              if (Array.isArray(currentTextField[i]) && currentTextField[i][0] === 'get') {
                fieldName = currentTextField[i][1];
                break;
              }
            }
          } else if (currentTextField[0] === 'format' || currentTextField[0] === 'concat') {
            // Complex expression - try to preserve it but just disable text-transform
            console.log(`   ⏩ Complex expression, only disabled text-transform: ${layer.id}`);
            normalizedCount++;
            return;
          } else {
            console.log(`   ⏩ Unsupported expression type: ${layer.id}`);
            return;
          }
        } else {
          console.log(`   ⏩ Unknown text-field type: ${layer.id}`);
          return;
        }
        
        console.log(`   Using field name: ${fieldName}`);
        
        // Create a title case expression using MapLibre's string functions
        // This capitalizes the first letter and lowercases the rest
        const titleCaseExpression = [
          'concat',
          ['upcase', ['slice', ['get', fieldName], 0, 1]],
          ['downcase', ['slice', ['get', fieldName], 1]]
        ];
        
        map.setLayoutProperty(layer.id, 'text-field', titleCaseExpression);
        normalizedCount++;
        console.log(`✅ ${mapSide}: Applied title case transformation to: ${layer.id}`);
      } catch (error) {
        console.log(`⚠️ ${mapSide}: Could not modify text case for layer: ${layer.id}`, error);
      }
    }
  });
  
  console.log(`✅ ${mapSide}: Label normalization complete - transformed ${normalizedCount} layers`);
}