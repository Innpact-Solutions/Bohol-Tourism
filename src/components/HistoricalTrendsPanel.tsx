/**
 * Historical Trends Panel Component
 * Full MapCanvas functionality with blank right panel for future analytics
 */

import React, { useState, useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl@5.15.0';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Header } from './Header';
import { LocationSearch } from './LocationSearch';
import { FloatingLegendPanel } from './FloatingLegendPanel';
import { WardPopup } from './WardPopup';
import { BuildingPopup } from './BuildingPopup';
import { AreaDistributionChart } from './AreaDistributionChart';
import { getWMSTileUrl } from '../config/geoserverLayers';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { fetchHistoricalTrends, type HistoricalTrendsData } from '../utils/historicalTrendsApi';
import { useIMDHeatAnalytics } from '../hooks/useIMDHeatAnalytics';
import type { Basemap, Sector, Scenario } from '../App';

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

import {
  Home,
  ZoomIn,
  ZoomOut,
  Layers,
  Map,
  Satellite,
  Download,
  Box,
  Play,
  Pause,
  ChevronDown,
  TrendingUp,
  Flame
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IMDHeatCalendar } from './IMDHeatCalendar';

interface HistoricalTrendsPanelProps {
  onClose: () => void;
  sector: string;
  selectedWardId: string;
  onWardSelect: (wardId: string) => void;
}

// Bohol coordinates
const BOHOL_CENTER: [number, number] = [124.1139, 9.8399];
const INITIAL_ZOOM = 11.5;

// Bohol city bounds (Southwest, Northeast corners) for responsive viewport fitting
const BOHOL_BOUNDS: [[number, number], [number, number]] = [
  [123.7, 9.4],    // Southwest corner (lng, lat)
  [124.6, 10.2]    // Northeast corner (lng, lat)
];

// Heat stress layer type mapping with full names
const HEAT_STRESS_LAYERS = [
  { code: 'HHI', name: 'Heat Hazard Index (HHI)' },
  { code: 'LST', name: 'Land Surface Temperature (LST)' },
  { code: 'AST', name: 'Air Surface Temperature (AST)' },
  { code: 'WBT', name: 'Wet-Bulb Temperature (WBT)' },
  { code: 'WBGT', name: 'Wet-Bulb Globe Temperature (WBGT)' }
];

/**
 * Coordinate transformation utility
 * Detects and converts coordinates from Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)
 */
const transformGeoJSONCoordinates = (geojson: any): any => {
  if (!geojson || !geojson.features) return geojson;
  
  // Check first coordinate to detect if data is in Web Mercator
  const firstFeature = geojson.features[0];
  if (!firstFeature || !firstFeature.geometry || !firstFeature.geometry.coordinates) {
    return geojson;
  }
  
  // Get first coordinate pair
  let firstCoord: [number, number] | null = null;
  const geomType = firstFeature.geometry.type;
  
  if (geomType === 'Point') {
    firstCoord = firstFeature.geometry.coordinates;
  } else if (geomType === 'LineString' || geomType === 'MultiPoint') {
    firstCoord = firstFeature.geometry.coordinates[0];
  } else if (geomType === 'Polygon' || geomType === 'MultiLineString') {
    firstCoord = firstFeature.geometry.coordinates[0][0];
  } else if (geomType === 'MultiPolygon') {
    firstCoord = firstFeature.geometry.coordinates[0][0][0];
  }
  
  if (!firstCoord) return geojson;
  
  const [x, y] = firstCoord;
  
  // Check if coordinates are in Web Mercator (very large numbers, typically > 180)
  const isWebMercator = Math.abs(x) > 180 || Math.abs(y) > 90;
  
  if (!isWebMercator) {
    return geojson; // Already in WGS84
  }
  
  console.log('[HistoricalTrends] 🔧 Detected Web Mercator coordinates, transforming to WGS84...');
  
  // Transform function from EPSG:3857 to EPSG:4326
  const transform3857to4326 = (coord: [number, number]): [number, number] => {
    const [x, y] = coord;
    const lng = (x / 20037508.34) * 180;
    let lat = (y / 20037508.34) * 180;
    lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
    return [lng, lat];
  };
  
  // Recursively transform coordinates in geometry
  const transformCoords = (coords: any, depth: number): any => {
    if (depth === 0) {
      return transform3857to4326(coords as [number, number]);
    }
    return coords.map((c: any) => transformCoords(c, depth - 1));
  };
  
  // Transform all features
  const transformedFeatures = geojson.features.map((feature: any) => {
    const geom = feature.geometry;
    let depth = 0;
    
    if (geom.type === 'Point') depth = 0;
    else if (geom.type === 'LineString' || geom.type === 'MultiPoint') depth = 1;
    else if (geom.type === 'Polygon' || geom.type === 'MultiLineString') depth = 2;
    else if (geom.type === 'MultiPolygon') depth = 3;
    
    return {
      ...feature,
      geometry: {
        ...geom,
        coordinates: transformCoords(geom.coordinates, depth)
      }
    };
  });
  
  console.log('[HistoricalTrends] ✅ Coordinate transformation complete');
  
  return {
    ...geojson,
    features: transformedFeatures
  };
};

// Get basemap style
function getBasemapStyle(basemap: Basemap): string | any {
  const styles = {
    light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    satellite: {
      version: 8,
      sources: {
        'satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
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
        }
      ]
    }
  };
  return styles[basemap];
}

export function HistoricalTrendsPanel({ onClose, sector, selectedWardId, onWardSelect }: HistoricalTrendsPanelProps) {
  const [basemap, setBasemap] = useState<Basemap>('light');
  const [basemapSwitcherOpen, setBasemapSwitcherOpen] = useState(false);
  const [attributionOpen, setAttributionOpen] = useState(true);
  const [is3DMode, setIs3DMode] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(INITIAL_ZOOM);
  const [sectorOpacity, setSectorOpacity] = useState(0.7);
  const [legendMinimized, setLegendMinimized] = useState(false);
  const [isBuildingsLoading, setIsBuildingsLoading] = useState(false); // Track buildings loading state
  
  // Layer opacities - track opacity for each layer type
  const [layerOpacities, setLayerOpacities] = useState<Record<string, number>>({
    heat_hhi: 0.7,
    heat_lst: 0.7,
    heat_ast: 0.7,
    heat_wbt: 0.7,
    heat_wbgt: 0.7,
  });
  
  // Year slider state
  const [selectedYear, setSelectedYear] = useState(2015);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Heat stress layer type selection
  const [selectedLayerType, setSelectedLayerType] = useState<string>('HHI');
  const [layerSelectorOpen, setLayerSelectorOpen] = useState(false);
  
  // 🚀 OPTIMIZATION: Track which years are currently loaded to enable instant year switching
  const loadedYearsRef = useRef<{
    layerType: string;
    years: number[];
  }>({ layerType: '', years: [] });
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Ward popup state (React-based, not MapLibre popup)
  const [wardPopupData, setWardPopupData] = useState<{
    wardName: string;
    wardNumber: string;
    population?: string;
    area?: string;
    density?: string;
    households?: string;
    buildings?: string;
    zone?: string;
    lng: number;
    lat: number;
    x: number;
    y: number;
  } | null>(null);

  // Track the selected ward number for highlighting
  const [selectedWardNumber, setSelectedWardNumber] = useState<string | null>(null);
  
  // Building popup state (React-based, not MapLibre popup)
  const [buildingPopupData, setBuildingPopupData] = useState<{
    buildingUse?: string;
    ward?: string | number;
    floors?: string | number;
    hhi2025?: string | number;
    airAqi?: string | number;
    floodHazard?: string | number;
    multiHazard?: string | number;
    lng: number;
    lat: number;
    x: number;
    y: number;
  } | null>(null);
  
  // Track active base layers (for buildings auto-load)
  const [activeBaseLayers, setActiveBaseLayers] = useState<string[]>([]);
  
  // Track if user manually disabled buildings (to prevent auto-loading)
  const buildingsManuallyDisabledRef = useRef<boolean>(false);
  
  // Track loading state for heat stress layer
  const [isLayerLoading, setIsLayerLoading] = useState(false);
  
  // Historical trends line chart data
  const [historicalTrendsData, setHistoricalTrendsData] = useState<HistoricalTrendsData[]>([]);
  const [isHistoricalDataLoading, setIsHistoricalDataLoading] = useState(false);

  // IMD Heat Analytics data
  const { data: imdHeatData, loading: imdHeatLoading } = useIMDHeatAnalytics(selectedYear);

  // IMD KPI tooltip state
  const [imdTooltip, setImdTooltip] = useState<{
    kpi: string;
    x: number;
    y: number;
  } | null>(null);

  // Ref to store layer reordering interval
  const layerOrderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to track initial mount - prevents basemap useEffect from running on first render
  const isInitialMount = useRef(true);
  
  // Refs to prevent useEffect from running on initial mount
  const isLayerTypeInitialMount = useRef(true);
  const isYearInitialMount = useRef(true);

  // Ref to store ward boundaries GeoJSON data for zoom calculations
  const wardBoundariesDataRef = useRef<any>(null);
  
  // Ref to track previous ward selection (for detecting ward changes)
  const previousWardRef = useRef<string>('all');

  // Log selectedWardId for debugging
  useEffect(() => {
    console.log('[HistoricalTrends] 🔍 Received selectedWardId prop:', selectedWardId);
  }, [selectedWardId]);

  // Fetch historical trends data when layer or ward changes
  useEffect(() => {
    let isCancelled = false;
    
    const loadHistoricalData = async () => {
      setIsHistoricalDataLoading(true);
      
      try {
        // Construct the full layer ID (e.g., 'heat_hhi', 'heat_lst')
        const layerId = `heat_${selectedLayerType.toLowerCase()}`;
        const data = await fetchHistoricalTrends(layerId, selectedWardId);
        
        if (!isCancelled) {
          setHistoricalTrendsData(data);
        }
      } catch (error) {
        console.error('[HistoricalTrends] ❌ Error loading historical data:', error);
        if (!isCancelled) {
          setHistoricalTrendsData([]);
        }
      } finally {
        if (!isCancelled) {
          setIsHistoricalDataLoading(false);
        }
      }
    };
    
    loadHistoricalData();
    
    return () => {
      isCancelled = true;
    };
  }, [selectedLayerType, selectedWardId]);

  // Handler for layer opacity changes from FloatingLegendPanel
  const handleLayerOpacityChange = (layerId: string, opacity: number) => {
    console.log(`[HistoricalTrends] 🎨 Opacity changed for ${layerId}: ${opacity}`);
    
    // Update state
    setLayerOpacities(prev => ({ ...prev, [layerId]: opacity }));
    
    // Apply to currently visible year layer only (others stay at 0)
    if (mapRef.current) {
      const map = mapRef.current;
      
      // Only update opacity for the currently selected year
      const currentYearLayerId = `heat-stress-${selectedYear}`;
      if (map.getLayer(currentYearLayerId)) {
        map.setPaintProperty(currentYearLayerId, 'raster-opacity', opacity);
        console.log(`[HistoricalTrends] ✅ Applied opacity ${opacity} to ${currentYearLayerId}`);
      }
      
      // Fallback to old single-layer format for backward compatibility
      if (map.getLayer('heat-stress')) {
        map.setPaintProperty('heat-stress', 'raster-opacity', opacity);
      }
    }
  };

  // Helper function to hide basemap buildings
  const hideBasemapBuildings = (map: maplibregl.Map) => {
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
  };

  // Helper function to normalize city name case
  const normalizeCityNameCase = (map: maplibregl.Map) => {
    if (!map.getStyle()) return;
    
    const style = map.getStyle();
    const layers = style?.layers;
    
    if (!layers) return;
    
    console.log('[HistoricalTrends] Normalizing label layers...');
    
    layers.forEach((layer: any) => {
      if (layer.type === 'symbol' && layer.layout?.['text-field']) {
        try {
          // Remove text-transform to prevent uppercase
          map.setLayoutProperty(layer.id, 'text-transform', 'none');
          
          const currentTextField = layer.layout['text-field'];
          let fieldName = 'name';
          
          if (typeof currentTextField === 'string') {
            if (currentTextField.startsWith('{') && currentTextField.endsWith('}')) {
              fieldName = currentTextField.slice(1, -1);
            } else {
              return;
            }
          } else if (Array.isArray(currentTextField)) {
            if (currentTextField[0] === 'get' && currentTextField[1]) {
              fieldName = currentTextField[1];
            } else if (currentTextField[0] === 'coalesce') {
              for (let i = 1; i < currentTextField.length; i++) {
                if (Array.isArray(currentTextField[i]) && currentTextField[i][0] === 'get') {
                  fieldName = currentTextField[i][1];
                  break;
                }
              }
            } else {
              return;
            }
          } else {
            return;
          }
          
          // Create title case expression
          const titleCaseExpression = [
            'concat',
            ['upcase', ['slice', ['get', fieldName], 0, 1]],
            ['downcase', ['slice', ['get', fieldName], 1]]
          ];
          
          map.setLayoutProperty(layer.id, 'text-field', titleCaseExpression);
        } catch (error) {
          // Silent fail for individual layers
        }
      }
    });
  };

  // Helper function to move basemap labels to top
  const moveBasemapLabelsToTop = (map: maplibregl.Map) => {
    if (!map || !map.getStyle) return;
    
    const style = map.getStyle();
    const layers = style?.layers;
    
    if (!layers) return;
    
    console.log('[HistoricalTrends] Moving basemap labels to top...');
    
    const basemapLabelLayers: string[] = [];
    
    layers.forEach((layer) => {
      const id = layer.id.toLowerCase();
      
      // Exclude custom data layers
      const isOurCustomLayer = (
        id.startsWith('ward-') || 
        id.startsWith('municipal-') ||
        id.startsWith('heat-') ||
        id.includes('wms') ||
        id.includes('geoserver')
      );
      
      // Include only symbol layers that are basemap labels
      if (!isOurCustomLayer && layer.type === 'symbol') {
        basemapLabelLayers.push(layer.id);
      }
    });
    
    // Move all basemap label layers to the top
    basemapLabelLayers.forEach((layerId) => {
      try {
        map.moveLayer(layerId);
        console.log(`✅ Moved basemap label to top: ${layerId}`);
      } catch (error) {
        // Silent fail
      }
    });
    
    console.log(`[HistoricalTrends] Moved ${basemapLabelLayers.length} label layers to top`);
  };

  // CRITICAL: Function to enforce strict layer ordering - keeps ward labels and municipal boundaries ALWAYS on top
  // Layer stack (bottom to top): basemap → heat stress → waterbody → road network → ward boundaries → municipal boundaries → labels
  const enforceLayerOrder = (map: maplibregl.Map) => {
    if (!map || !map.getStyle || !map.getStyle()) return;
    
    try {
      // Step 1: Move waterbody above heat stress (if exists)
      if (map.getLayer('waterbody')) {
        map.moveLayer('waterbody');
      }
      
      // Step 2: Move road network layers above waterbody/heat stress (below ward boundaries)
      // Order matters: link → major → state → national (bottom to top)
      if (map.getLayer('road_network_link')) {
        map.moveLayer('road_network_link');
      }
      if (map.getLayer('road_network_major')) {
        map.moveLayer('road_network_major');
      }
      if (map.getLayer('road_network_state')) {
        map.moveLayer('road_network_state');
      }
      if (map.getLayer('road_network_national')) {
        map.moveLayer('road_network_national');
      }
      
      // Step 3: Move ward boundary layers to top (above road network and heat stress)
      if (map.getLayer('ward-boundaries-fill')) {
        map.moveLayer('ward-boundaries-fill');
      }
      if (map.getLayer('ward-boundaries')) {
        map.moveLayer('ward-boundaries');
      }
      if (map.getLayer('ward-boundaries-highlight')) {
        map.moveLayer('ward-boundaries-highlight');
      }
      
      // Step 4: Move municipal boundaries to top (above ward boundaries)
      if (map.getLayer('municipal-boundary-border')) {
        map.moveLayer('municipal-boundary-border');
      }
      if (map.getLayer('municipal-boundary')) {
        map.moveLayer('municipal-boundary');
      }
      
      // Step 5: CRITICAL - Move ward labels to the VERY top (above municipal boundaries)
      if (map.getLayer('ward-labels')) {
        map.moveLayer('ward-labels');
      }
      
      // Step 6: Finally, move basemap labels to absolute top
      moveBasemapLabelsToTop(map);
    } catch (error) {
      // Silent fail - layer might not exist yet
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    console.log('[HistoricalTrends] Initializing map...');

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: getBasemapStyle(basemap),
      center: BOHOL_CENTER,
      zoom: INITIAL_ZOOM,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      pitchWithRotate: true,
      dragRotate: true,
      maxPitch: 60,
      preserveDrawingBuffer: true
    });

    // Add scale control
    map.addControl(new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left');

    // Store map reference
    mapRef.current = map;
    
    // CRITICAL: Start recurring interval to enforce layer order - keeps ward labels ALWAYS on top
    // This must be started AFTER map is created to ensure mapRef.current exists
    layerOrderIntervalRef.current = setInterval(() => {
      if (map && map.getStyle && map.getStyle()) {
        enforceLayerOrder(map);
      }
    }, 500);
    console.log('[HistoricalTrends] ✅ Layer order enforcement interval started (500ms)');

    // Track zoom level
    map.on('zoom', () => {
      setCurrentZoom(map.getZoom());
    });

    // Wait for map to fully load
    map.once('load', async () => {
      console.log('[HistoricalTrends] Map loaded event fired');
      
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
            
            console.log('✅ Historical Trends: Municipal_Boundary extent calculated');
            
            map.fitBounds(municipalBounds, {
              padding: 80,
              duration: 0,
              maxZoom: 14
            });
            
            // Store bounds
            (map as any)._municipalBounds = municipalBounds;
            
            console.log('📍 Historical Trends map fitted to Municipal_Boundary extent');
          } else {
            map.fitBounds(BOHOL_BOUNDS, { padding: 80, duration: 0, maxZoom: 14 });
          }
        } else {
          map.fitBounds(BOHOL_BOUNDS, { padding: 80, duration: 0, maxZoom: 14 });
        }
      } catch (error) {
        console.error('❌ Error fetching Municipal_Boundary:', error);
        map.fitBounds(BOHOL_BOUNDS, { padding: 80, duration: 0, maxZoom: 14 });
      }
      
      // CRITICAL: Wait for style to be fully loaded AND idle
      const addLayersWhenReady = () => {
        if (!map.isStyleLoaded()) {
          console.log('[HistoricalTrends] Style not loaded yet, waiting...');
          setTimeout(addLayersWhenReady, 100);
          return;
        }
        
        console.log('[HistoricalTrends] ✅ Style is loaded, applying basemap styling...');
        
        // Apply basemap styling
        hideBasemapBuildings(map);
        normalizeCityNameCase(map);
        
        // Add layers in correct bottom-to-top order
        // STRICT Layer order: basemap → heat stress → waterbody → road network → ward boundaries → municipal boundaries → labels
        console.log('[HistoricalTrends] 🎯 Adding all layers in correct order...');
        addHeatStressLayersForAllYears(map); // 🚀 Preload all 11 years for instant switching
        addWaterbodyLayer(map);
        addRoadNetworkLayer(map);
        addWardBoundariesLayer(map);
        addMunicipalBoundariesLayer(map);
      };
      
      // Start the check
      addLayersWhenReady();
    });

    // Track logged errors to avoid spam
    const loggedErrors = new Set<string>();
    
    map.on('error', (e) => {
      // Suppress repetitive tile loading errors (expected for historical years that don't exist)
      const errorMessage = e.error?.message || e.error?.toString() || 'Unknown error';
      
      // Check if it's a heat stress layer error (WMS/WMTS)
      const isHeatStressError = e.sourceId?.startsWith('heat-stress-source-') || e.sourceId === 'heat-stress-layer';
      
      if (isHeatStressError) {
        // Suppress common expected errors:
        // 1. "Failed to fetch" - network timeouts, missing layers, CORS issues
        // 2. "Bad Request" - layer not in WMTS cache
        // 3. "AJAXError" - network failures
        const isSuppressedError = 
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('AJAXError') ||
          errorMessage.includes('Bad Request') ||
          errorMessage.includes('CORS') ||
          errorMessage.includes('NetworkError');
        
        if (isSuppressedError) {
          // Extract layer name for deduplication
          const layerMatch = errorMessage.match(/layers=([^&]+)/) || errorMessage.match(/LAYER=([^&]+)/);
          const errorKey = layerMatch ? layerMatch[1] : `${e.sourceId}`;
          
          if (!loggedErrors.has(errorKey)) {
            console.warn(`[HistoricalTrends] ⚠️ Layer loading issue (may not exist or network timeout): ${errorKey}`);
            loggedErrors.add(errorKey);
          }
          return; // Don't spam console with tile errors
        }
      }
      
      // Log other unexpected errors once per source
      const errorKey = `${e.sourceId}-${errorMessage}`;
      if (!loggedErrors.has(errorKey)) {
        const errorInfo = {
          type: e.type,
          error: errorMessage,
          sourceId: e.sourceId
        };
        console.error('[HistoricalTrends] Map error:', errorInfo);
        loggedErrors.add(errorKey);
      }
    });

    return () => {
      console.log('[HistoricalTrends] Cleaning up map...');
      
      // Clear the layer order enforcement interval
      if (layerOrderIntervalRef.current) {
        clearInterval(layerOrderIntervalRef.current);
        layerOrderIntervalRef.current = null;
        console.log('[HistoricalTrends] 🗑️  Layer order enforcement interval cleared');
      }
      
      mapRef.current = null;
      map.remove();
    };
  }, []);

  // Handle basemap changes
  useEffect(() => {
    // Skip on initial mount - only run when basemap actually changes
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    console.log('[HistoricalTrends] Changing basemap to:', basemap);
    
    map.setStyle(getBasemapStyle(basemap));
    
    // Re-add layers after style loads
    map.once('styledata', () => {
      console.log('[HistoricalTrends] Basemap changed, re-applying styling...');
      
      map.once('idle', () => {
        // Apply basemap styling
        hideBasemapBuildings(map);
        normalizeCityNameCase(map);
        
        setTimeout(() => {
          // Add layers in correct bottom-to-top order
          // STRICT Layer order: basemap → heat stress → waterbody → road network → ward boundaries → municipal boundaries → labels
          addHeatStressLayersForAllYears(map); // 🚀 Preload all 11 years for instant switching
          addWaterbodyLayer(map);
          addRoadNetworkLayer(map);
          addWardBoundariesLayer(map);
          addMunicipalBoundariesLayer(map);
        }, 100);
      });
    });
  }, [basemap]);

  // Update heat stress layer opacity when layerOpacities changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    const currentLayerId = `heat_${selectedLayerType.toLowerCase()}`;
    const currentOpacity = layerOpacities[currentLayerId] || 0.7;
    
    // Apply opacity only to the currently visible year (others are hidden via visibility: 'none')
    let appliedToAnyLayer = false;
    const currentYearLayerId = `heat-stress-${selectedYear}`;
    if (map.getLayer(currentYearLayerId)) {
      map.setPaintProperty(currentYearLayerId, 'raster-opacity', currentOpacity);
      appliedToAnyLayer = true;
      console.log(`[HistoricalTrends] Applied opacity ${currentOpacity} to visible year ${selectedYear}`);
    }
    
    // Fallback to old single-layer format if needed
    if (!appliedToAnyLayer && map.getLayer('heat-stress')) {
      map.setPaintProperty('heat-stress', 'raster-opacity', currentOpacity);
    }
  }, [layerOpacities, selectedLayerType, selectedYear]);

  // Handle ward filtering and zoom animation from Header dropdown
  useEffect(() => {
    console.log('[HistoricalTrends] 🎯 Ward filter effect triggered:', { selectedWardId, mapExists: !!mapRef.current });
    
    if (!mapRef.current) {
      console.log('[HistoricalTrends] ⏹️ Skipping ward zoom - map not ready');
      return;
    }
    
    const map = mapRef.current;
    
    // Close any open popups when ward filter changes
    setWardPopupData(null);
    setBuildingPopupData(null);
    
    // If "all" wards selected, zoom back to city view
    if (!selectedWardId || selectedWardId === 'all') {
      console.log('[HistoricalTrends] 📍 "All Wards" selected - removing ward filters');
      
      // Detect if we're transitioning FROM a specific ward TO "all wards"
      const wasSpecificWardSelected = previousWardRef.current && previousWardRef.current !== 'all';
      
      if (wasSpecificWardSelected) {
        // User deselected a ward - zoom out to city view
        console.log(`[HistoricalTrends] 📍 Ward deselected (${previousWardRef.current} → All Wards) - zooming out to city view`);
        map.flyTo({
          center: BOHOL_CENTER,
          zoom: INITIAL_ZOOM,
          pitch: 0,
          bearing: 0,
          duration: 1500,
          essential: true
        });
        
        // Update previous ward ref
        previousWardRef.current = 'all';
        
        // Reload heat stress layer and waterbody without ward filter (only when actually transitioning)
        if (map.isStyleLoaded()) {
          addHeatStressLayersForAllYears(map); // 🚀 Reload all years
          addWaterbodyLayer(map);
        } else {
          map.once('styledata', () => {
            addHeatStressLayersForAllYears(map);
            addWaterbodyLayer(map);
          });
        }
      } else {
        // "All Wards" already selected (initial state or no change) - just update filters, don't reload layers
        console.log('[HistoricalTrends] 📍 "All Wards" already selected - skipping layer reload');
        
        // Update previous ward ref
        previousWardRef.current = 'all';
      }
      
      // Remove ward filter from layers (show all wards)
      const wardLayerId = 'ward-boundaries';
      const wardFillLayerId = 'ward-boundaries-fill';
      const wardLabelLayerId = 'ward-labels';
      
      [wardLayerId, wardFillLayerId, wardLabelLayerId].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setFilter(layerId, null); // Remove filter - show all wards
        }
      });
      
      return;
    }
    
    // Extract ward number from selectedWardId (format: "ward_15" -> 15)
    const wardNumber = extractWardNumber(selectedWardId);
    if (wardNumber === null) {
      console.warn('[HistoricalTrends] ⚠️ Invalid ward number:', selectedWardId);
      return;
    }
    
    console.log(`[HistoricalTrends] 📍 Filtering and zooming to Ward ${wardNumber}`);
    
    // Wait for ward boundaries to load
    const waitForWardBoundaries = () => {
      console.log('[HistoricalTrends] ⏰ waitForWardBoundaries() called for Ward', wardNumber);
      const wardLayerId = 'ward-boundaries';
      
      if (!map.getSource(wardLayerId)) {
        console.log('[HistoricalTrends] ⏳ Waiting for ward boundaries source to load...');
        setTimeout(waitForWardBoundaries, 500);
        return;
      }
      
      // Check if the ward boundaries data ref is populated
      if (!wardBoundariesDataRef.current || !wardBoundariesDataRef.current.features) {
        console.log('[HistoricalTrends] ⏳ Waiting for ward boundaries data to be stored in ref...');
        setTimeout(waitForWardBoundaries, 500);
        return;
      }
      
      // Get ward feature from stored GeoJSON data
      const features = wardBoundariesDataRef.current.features;
      console.log(`[HistoricalTrends] 🔍 Searching for Ward ${wardNumber} in ${features.length} features`);
      
      // Log first feature's properties to debug
      if (features.length > 0) {
        console.log('[HistoricalTrends] 📋 Sample ward properties:', features[0].properties);
      }
      
      const wardFeature = features.find((f: any) => {
        const props = f.properties;
        const fWardNumber = props.Ward || props.WARD || props.ward || props.Ward_No || props.WARD_NO || props.ward_no || props.WardNo;
        return parseInt(fWardNumber) === wardNumber;
      });
      
      console.log(`[HistoricalTrends] 🔍 Ward search result:`, wardFeature ? 'Found' : 'Not found');
      
      if (wardFeature && wardFeature.geometry) {
        console.log('[HistoricalTrends] ✅ Found ward feature in stored data, calculating bounds');
        
        // Calculate bounds of the ward
        const bounds = new maplibregl.LngLatBounds();
        
        // Handle different geometry types
        const geometry = wardFeature.geometry as any;
        console.log('[HistoricalTrends] 📐 Ward geometry type:', geometry.type);
        
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
        
        console.log('[HistoricalTrends] 📍 Calculated bounds:', {
          southwest: bounds.getSouthWest().toArray(),
          northeast: bounds.getNorthEast().toArray(),
          center: bounds.getCenter().toArray()
        });
        
        // Fit map to ward bounds with animation
        console.log('[HistoricalTrends] 🚀 Calling map.fitBounds()...');
        map.fitBounds(bounds, {
          padding: { top: 120, bottom: 120, left: 120, right: 120 },
          duration: 1500,
          essential: true,
          maxZoom: 13.5  // Prevent over-zooming for small wards
        });
        
        console.log('[HistoricalTrends] ✅ Zoomed to Ward', wardNumber);
      } else {
        console.warn('[HistoricalTrends] ⚠️ Ward feature not found in stored GeoJSON data for Ward', wardNumber);
      }
      
      // Apply filter to show only selected ward
      const wardFillLayerId = 'ward-boundaries-fill';
      const wardLabelLayerId = 'ward-labels';
      
      const filter = ['==', ['get', 'Ward'], wardNumber];
      
      console.log('[HistoricalTrends] 🔍 Applying ward filter to show only Ward', wardNumber);
      
      // Apply filter to ward boundary layers
      [wardLayerId, wardFillLayerId, wardLabelLayerId].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setFilter(layerId, filter);
          console.log(`[HistoricalTrends] ✅ Filter applied to ${layerId}`);
        }
      });
      
      // Update previous ward ref to track ward changes
      previousWardRef.current = selectedWardId;
      
      // Reload heat stress layer with ward filter
      if (map.isStyleLoaded()) {
        addHeatStressLayersForAllYears(map); // 🚀 Reload all years with ward filter
        addWaterbodyLayer(map); // Also reload waterbody with ward filter
      } else {
        map.once('styledata', () => {
          addHeatStressLayersForAllYears(map);
          addWaterbodyLayer(map);
        });
      }
    };
    
    waitForWardBoundaries();
    
  }, [selectedWardId]);

  // Cleanup play interval on unmount or when stopped
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, []);

  // Reload heat stress layer when layer type changes (skip on initial mount)
  useEffect(() => {
    // Skip on initial mount - layer is loaded by map initialization
    if (isLayerTypeInitialMount.current) {
      isLayerTypeInitialMount.current = false;
      return;
    }
    
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    console.log(`[HistoricalTrends] 🔄 Layer type changed to ${selectedLayerType}, preloading all years...`);
    
    // Reload heat stress layers with new type (all 11 years)
    if (map.isStyleLoaded()) {
      addHeatStressLayersForAllYears(map);
    } else {
      map.once('styledata', () => addHeatStressLayersForAllYears(map));
    }
  }, [selectedLayerType]);

  // Reload heat stress layer when year changes (skip on initial mount)
  useEffect(() => {
    // Skip on initial mount - layer is loaded by map initialization
    if (isYearInitialMount.current) {
      isYearInitialMount.current = false;
      return;
    }
    
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    console.log(`[HistoricalTrends] 📅 Year changed to ${selectedYear}`);
    
    // 🚀 INSTANT YEAR SWITCHING: If all years are configured, just toggle visibility
    if (loadedYearsRef.current.layerType === selectedLayerType && 
        loadedYearsRef.current.years.length === 11) {
      console.log('[HistoricalTrends] ⚡ Switching year via visibility toggle');
      
      const targetLayerId = `heat-stress-${selectedYear}`;
      
      // INSTANT SWAP: Toggle visibility to switch years
      // This loads tiles on-demand only when needed
      if (map.getLayer(targetLayerId)) {
        // Hide all years, show only selected year
        for (let year = 2015; year <= 2025; year++) {
          const layerId = `heat-stress-${year}`;
          if (map.getLayer(layerId)) {
            const visibility = year === selectedYear ? 'visible' : 'none';
            map.setLayoutProperty(layerId, 'visibility', visibility);
          }
        }
        
        console.log(`[HistoricalTrends] ✅ Switched to ${selectedYear} - loading tiles...`);
      }
    } else {
      // Fallback: reload if layers aren't configured (shouldn't happen after first load)
      console.log('[HistoricalTrends] 🔄 Layers not configured, reloading...');
      if (map.isStyleLoaded()) {
        addHeatStressLayersForAllYears(map);
      } else {
        map.once('styledata', () => addHeatStressLayersForAllYears(map));
      }
    }
  }, [selectedYear]);

  // Close layer selector dropdown when clicking outside
  useEffect(() => {
    if (!layerSelectorOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.layer-selector-container')) {
        setLayerSelectorOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [layerSelectorOpen]);

  // ===== BUILDINGS LAYER: AUTO-LOAD WITH MANUAL OVERRIDE =====
  // Auto-loads at zoom 15.3+, but users can manually turn it off
  useEffect(() => {
    if (!mapRef.current || currentZoom === undefined) return;
    
    const BUILDINGS_ZOOM_THRESHOLD = 15.3;
    const isBuildingsActive = activeBaseLayers.includes('buildings');
    
    // Auto-add buildings layer when zooming in to level 15.3 or higher
    // BUT only if user hasn't manually disabled it
    if (currentZoom >= BUILDINGS_ZOOM_THRESHOLD && !isBuildingsActive && !buildingsManuallyDisabledRef.current) {
      console.log(`[HistoricalTrends] 🏢 Auto-loading buildings layer at zoom ${currentZoom}`);
      setActiveBaseLayers(prev => [...prev, 'buildings']);
    }
    
    // When zooming out below threshold:
    // 1. Hide buildings if active
    // 2. Always reset manual flag (even if already hidden)
    // This allows auto-loading again when zooming back in
    if (currentZoom < BUILDINGS_ZOOM_THRESHOLD) {
      if (isBuildingsActive) {
        console.log(`[HistoricalTrends] 🏢 Auto-unloading buildings layer at zoom ${currentZoom}`);
        setActiveBaseLayers(prev => prev.filter(layer => layer !== 'buildings'));
      }
      // Always reset manual flag when below threshold
      if (buildingsManuallyDisabledRef.current) {
        console.log(`[HistoricalTrends] 🔄 Resetting manual buildings flag at zoom ${currentZoom}`);
        buildingsManuallyDisabledRef.current = false;
      }
    }
  }, [currentZoom, activeBaseLayers]);

  // Detect when user manually toggles buildings
  const prevBuildingsActiveRef = useRef<boolean>(false);
  useEffect(() => {
    const BUILDINGS_ZOOM_THRESHOLD = 15.3;
    const isBuildingsActive = activeBaseLayers.includes('buildings');
    const wasBuildingsActive = prevBuildingsActiveRef.current;
    
    // Detect manual disable: buildings went from ON to OFF at high zoom
    if (wasBuildingsActive && !isBuildingsActive && currentZoom !== undefined && currentZoom >= BUILDINGS_ZOOM_THRESHOLD) {
      buildingsManuallyDisabledRef.current = true;
      console.log('[HistoricalTrends] 👤 User manually disabled buildings at high zoom');
    }
    
    // Update previous state
    prevBuildingsActiveRef.current = isBuildingsActive;
  }, [activeBaseLayers, currentZoom]);

  // Update popup positions when map moves (pan/zoom) - keeps popups attached to geographic locations
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    const updatePopupPositions = () => {
      // Update ward popup position
      if (wardPopupData) {
        const point = map.project([wardPopupData.lng, wardPopupData.lat]);
        setWardPopupData(prev => prev ? { ...prev, x: point.x, y: point.y } : null);
      }
      
      // Update building popup position
      if (buildingPopupData) {
        const point = map.project([buildingPopupData.lng, buildingPopupData.lat]);
        setBuildingPopupData(prev => prev ? { ...prev, x: point.x, y: point.y } : null);
      }
    };
    
    // Listen to map move events (pan, zoom, etc.)
    map.on('move', updatePopupPositions);
    map.on('zoom', updatePopupPositions);
    
    return () => {
      map.off('move', updatePopupPositions);
      map.off('zoom', updatePopupPositions);
    };
  }, [wardPopupData, buildingPopupData]);

  // Close popups when clicking outside of them (on UI elements)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Check if any popup is open
      const hasOpenPopup = wardPopupData || buildingPopupData;
      if (!hasOpenPopup) return;

      const target = e.target as HTMLElement;
      
      // Check if the click is inside any popup element
      const isClickInsidePopup = target.closest('.absolute.z-\\[20\\]') !== null || target.closest('.absolute.z-\\[25\\]') !== null;
      
      // If click is outside all popups, close them
      if (!isClickInsidePopup) {
        console.log('[HistoricalTrends] 🔒 Clicked outside popup - closing all popups');
        setWardPopupData(null);
        setBuildingPopupData(null);
        setSelectedWardNumber(null);
      }
    };
    
    // Use capture phase to ensure we catch all clicks
    document.addEventListener('mousedown', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [wardPopupData, buildingPopupData]);

  // Update ward boundary highlight when selected ward changes
  useEffect(() => {
    console.log('[HistoricalTrends] 🔄 Ward highlight useEffect triggered - selectedWardNumber:', selectedWardNumber);
    
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    const highlightLayerId = 'ward-boundaries-highlight';
    
    // Function to apply highlight filter
    const applyHighlightFilter = () => {
      // Validate map style is available
      if (!map || !map.getStyle || !map.getStyle()) {
        return false;
      }
      
      // Check if layer exists
      if (!map.getLayer(highlightLayerId)) {
        return false;
      }
      
      // Layer exists, apply filter
      try {
        if (selectedWardNumber) {
          const wardNum = parseInt(selectedWardNumber);
          const isNumeric = !isNaN(wardNum);
          
          map.setFilter(highlightLayerId, [
            'any',
            ['==', ['get', 'Ward'], selectedWardNumber],
            ['==', ['get', 'WARD'], selectedWardNumber],
            ['==', ['get', 'ward'], selectedWardNumber],
            ['==', ['get', 'Ward_No'], selectedWardNumber],
            ['==', ['get', 'WARD_NO'], selectedWardNumber],
            ['==', ['get', 'ward_no'], selectedWardNumber],
            ['==', ['get', 'WardNo'], selectedWardNumber],
            ['==', ['get', 'WARDNO'], selectedWardNumber],
            ...(isNumeric ? [
              ['==', ['get', 'Ward'], wardNum],
              ['==', ['get', 'WARD'], wardNum],
              ['==', ['get', 'ward'], wardNum],
              ['==', ['get', 'Ward_No'], wardNum],
              ['==', ['get', 'WARD_NO'], wardNum],
              ['==', ['get', 'ward_no'], wardNum],
              ['==', ['get', 'WardNo'], wardNum],
              ['==', ['get', 'WARDNO'], wardNum]
            ] : [])
          ]);
          console.log('[HistoricalTrends] ✅ Ward highlight filter updated for ward:', selectedWardNumber);
        } else {
          map.setFilter(highlightLayerId, ['==', ['get', 'Ward'], '']);
          console.log('[HistoricalTrends] ✅ Ward highlight cleared');
        }
        return true;
      } catch (error) {
        console.warn('[HistoricalTrends] ⚠️ Error applying highlight filter:', error);
        return false;
      }
    };
    
    // Try to apply immediately
    if (applyHighlightFilter()) {
      return; // Success, we're done
    }
    
    // If not successful, start polling
    console.log('[HistoricalTrends] 🔍 Layer not ready, starting polling...');
    
    // Check if highlight layer exists - it may not be loaded yet if WFS is still fetching
    if (!map.getLayer(highlightLayerId)) {
      // Layer not ready yet - wait for it to be added
      const checkLayerInterval = setInterval(() => {
        // Try to apply the filter - it will return true if successful
        if (applyHighlightFilter()) {
          clearInterval(checkLayerInterval);
          console.log('[HistoricalTrends] ✅ Ward highlight applied via polling');
        }
      }, 100);
      
      // Clean up interval after 5 seconds if layer never appears
      setTimeout(() => clearInterval(checkLayerInterval), 5000);
      
      // Return cleanup function
      return () => {
        clearInterval(checkLayerInterval);
      };
    }
    
    // If we reached here, layer exists and filter was already applied by applyHighlightFilter()
    // No need to duplicate the filter setting logic
  }, [selectedWardNumber]);

  // Manage buildings layer based on activeBaseLayers state
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    const isBuildingsActive = activeBaseLayers.includes('buildings');
    
    if (isBuildingsActive) {
      // Add buildings layer if it doesn't exist
      if (!map.getSource('buildings')) {
        addBuildingsLayer(map);
      } else {
        // Layer exists, just make it visible
        setIsBuildingsLoading(true);
        if (map.getLayer('buildings')) {
          map.setLayoutProperty('buildings', 'visibility', 'visible');
        }
        if (map.getLayer('buildings-fill')) {
          map.setLayoutProperty('buildings-fill', 'visibility', is3DMode ? 'none' : 'visible');
        }
        if (map.getLayer('buildings-3d')) {
          map.setLayoutProperty('buildings-3d', 'visibility', is3DMode ? 'visible' : 'none');
        }
        // Hide loading after a short delay
        setTimeout(() => setIsBuildingsLoading(false), 300);
      }
    } else {
      // Hide buildings layer if it exists
      if (map.getLayer('buildings')) {
        map.setLayoutProperty('buildings', 'visibility', 'none');
      }
      if (map.getLayer('buildings-fill')) {
        map.setLayoutProperty('buildings-fill', 'visibility', 'none');
      }
      if (map.getLayer('buildings-3d')) {
        map.setLayoutProperty('buildings-3d', 'visibility', 'none');
      }
      if (map.getLayer('buildings-highlight')) {
        map.setLayoutProperty('buildings-highlight', 'visibility', 'none');
      }
      
      // Close building popup and hide loading when hiding layer
      setBuildingPopupData(null);
      setIsBuildingsLoading(false);
    }
  }, [activeBaseLayers, selectedWardId]);

  // Toggle 3D buildings layer visibility based on is3DMode
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    // Toggle visibility of 2D and 3D building layers
    if (map.getLayer('buildings-fill') && map.getLayer('buildings-3d')) {
      if (is3DMode) {
        // Hide 2D fill, show 3D extrusion
        map.setLayoutProperty('buildings-fill', 'visibility', 'none');
        map.setLayoutProperty('buildings-3d', 'visibility', 'visible');
        console.log('[HistoricalTrends] 🏗️ 3D buildings enabled');
      } else {
        // Show 2D fill, hide 3D extrusion
        map.setLayoutProperty('buildings-fill', 'visibility', 'visible');
        map.setLayoutProperty('buildings-3d', 'visibility', 'none');
        console.log('[HistoricalTrends] 🏢 2D buildings enabled');
      }
    }
  }, [is3DMode]);

  // 🚀 OPTIMIZED: Add all 11 years of heat stress layers at once for instant year switching
  const addHeatStressLayersForAllYears = (map: maplibregl.Map) => {
    if (!map.isStyleLoaded()) {
      console.log('[HistoricalTrends] Waiting for style to load (heat stress all years)...');
      map.once('styledata', () => addHeatStressLayersForAllYears(map));
      return;
    }

    console.log('[HistoricalTrends] 🚀 Preloading all 11 years of heat stress data for instant switching...');
    
    // Set loading state
    setIsLayerLoading(true);

    // Remove all existing year layers if present
    for (let year = 2015; year <= 2025; year++) {
      const layerId = `heat-stress-${year}`;
      const sourceId = `heat-stress-source-${year}`;
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }
    
    // Also remove old single-layer format for backward compatibility
    if (map.getLayer('heat-stress')) map.removeLayer('heat-stress');
    if (map.getSource('heat-stress-layer')) map.removeSource('heat-stress-layer');

    // Extract ward number from selectedWardId if filtering is active
    let wardNumberForFilter: number | null = null;
    if (selectedWardId && selectedWardId !== 'all') {
      wardNumberForFilter = parseInt(selectedWardId.split('_')[1]);
      if (!isNaN(wardNumberForFilter)) {
        console.log(`[HistoricalTrends] 🔍 Applying ward filter: Ward ${wardNumberForFilter}`);
      } else {
        wardNumberForFilter = null;
      }
    }

    // Get the opacity for the current layer type
    const currentLayerId = `heat_${selectedLayerType.toLowerCase()}`;
    const currentOpacity = layerOpacities[currentLayerId] || 0.7;
    
    // Find insertion point (before road network or ward boundaries)
    const roadNetworkLayerId = 'road-network-layer';
    const wardBoundariesLayerId = 'ward-boundaries-fill';
    let beforeLayerId: string | undefined = undefined;
    
    if (map.getLayer(roadNetworkLayerId)) {
      beforeLayerId = roadNetworkLayerId;
      console.log('[HistoricalTrends] Inserting heat stress layers BELOW road network');
    } else if (map.getLayer(wardBoundariesLayerId)) {
      beforeLayerId = wardBoundariesLayerId;
      console.log('[HistoricalTrends] Inserting heat stress layers BELOW ward boundaries');
    }

    // Create all 11 layers (2015-2025)
    // CRITICAL FIX: Only set selected year to visible to avoid overwhelming GeoServer
    // Other years are set to 'none' and loaded on-demand when user switches
    const years = [];
    for (let year = 2015; year <= 2025; year++) {
      const layerId = `heat-stress-${year}`;
      const sourceId = `heat-stress-source-${year}`;
      const layerName = `GIZ_BBSR:${selectedLayerType}_${year}`;
      const wmsUrl = getWMSTileUrl(layerName, wardNumberForFilter, true);
      
      // Add source
      map.addSource(sourceId, {
        type: 'raster',
        tiles: [wmsUrl],
        tileSize: 256,
        scheme: 'xyz'
      });

      // Add layer - only selected year is visible, others are hidden
      // This prevents overwhelming GeoServer with 11 simultaneous tile requests
      const isSelectedYear = year === selectedYear;
      map.addLayer({
        id: layerId,
        type: 'raster',
        source: sourceId,
        layout: {
          visibility: isSelectedYear ? 'visible' : 'none'  // Only load selected year
        },
        paint: {
          'raster-opacity': currentOpacity,
          'raster-fade-duration': 0  // Disable fade-in effect for instant transitions
        }
      }, beforeLayerId);
      
      years.push(year);
      console.log(`[HistoricalTrends] ✅ Added layer for ${selectedLayerType} ${year} (visibility: ${isSelectedYear ? 'visible' : 'none'})`);
    }

    // Update loaded years reference
    loadedYearsRef.current = {
      layerType: selectedLayerType,
      years: years
    };

    console.log(`[HistoricalTrends] 🎉 All 11 years configured! Currently showing: ${selectedYear}`);
    
    // CRITICAL: Enforce complete layer order immediately after adding heat layers
    enforceLayerOrder(map);
    
    // Force labels to top after adding layers with multiple attempts
    [50, 100, 200, 300, 500].forEach(delay => {
      setTimeout(() => {
        enforceLayerOrder(map);
        moveBasemapLabelsToTop(map);
      }, delay);
    });
    
    // Clear loading state only when the SELECTED YEAR tiles are fully visible on screen
    const selectedYearLayerId = `heat-stress-${selectedYear}`;
    const selectedYearSourceId = `heat-stress-source-${selectedYear}`;
    
    // Track if tiles have been loaded and map has finished rendering
    let tilesLoaded = false;
    let mapIsIdle = false;
    let loadingCleared = false; // Prevent multiple clears
    
    const checkAndClearLoading = () => {
      if (loadingCleared) return; // Already cleared
      
      if (tilesLoaded && mapIsIdle) {
        console.log(`[HistoricalTrends] ✨ Selected year ${selectedYear} fully visible on screen`);
        loadingCleared = true;
        setIsLayerLoading(false);
        map.off('idle', onIdle);
        map.off('sourcedata', onSourceData);
      }
    };
    
    // Listen for sourcedata events to detect when tiles are loaded
    const onSourceData = (e: any) => {
      // Check if this is the selected year's source
      if (e.sourceId === selectedYearSourceId) {
        console.log(`[HistoricalTrends] 📦 Source data event for ${selectedYear}:`, {
          sourceId: e.sourceId,
          isSourceLoaded: e.isSourceLoaded,
          dataType: e.dataType
        });
        
        // Mark as loaded when we get the source loaded confirmation
        if (e.isSourceLoaded) {
          tilesLoaded = true;
          console.log(`[HistoricalTrends] ✅ Tiles loaded for ${selectedYear}`);
          checkAndClearLoading();
        }
      }
    };
    
    // Listen for idle event to confirm map has finished rendering
    const onIdle = () => {
      console.log(`[HistoricalTrends] 🎨 Map idle event received`);
      mapIsIdle = true;
      checkAndClearLoading();
    };
    
    map.on('sourcedata', onSourceData);
    map.on('idle', onIdle);
    
    // Fallback: force clear after 8 seconds if events don't fire
    setTimeout(() => {
      if (!loadingCleared) {
        console.log('[HistoricalTrends] ⏱️ Fallback timeout - forcing clear (tilesLoaded:', tilesLoaded, 'mapIsIdle:', mapIsIdle, ')');
        loadingCleared = true;
        setIsLayerLoading(false);
        map.off('sourcedata', onSourceData);
        map.off('idle', onIdle);
      }
    }, 8000);
  };

  const addHeatStressLayer = (map: maplibregl.Map) => {
    if (!map.isStyleLoaded()) {
      console.log('[HistoricalTrends] Waiting for style to load (heat stress)...');
      map.once('styledata', () => addHeatStressLayer(map));
      return;
    }

    console.log('[HistoricalTrends] Adding heat stress layer...');
    
    // Set loading state
    setIsLayerLoading(true);

    const sourceId = 'heat-stress-layer';
    const layerId = 'heat-stress';

    // Remove existing if present
    if (map.getLayer(layerId)) map.removeLayer(layerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    // Extract ward number from selectedWardId if filtering is active
    let wardNumberForFilter: number | null = null;
    if (selectedWardId && selectedWardId !== 'all') {
      wardNumberForFilter = parseInt(selectedWardId.split('_')[1]);
      if (!isNaN(wardNumberForFilter)) {
        console.log(`[HistoricalTrends] 🔍 Applying ward filter: Ward ${wardNumberForFilter}`);
      } else {
        wardNumberForFilter = null;
      }
    }

    // Add selected heat stress layer with optional ward filter
    const layerName = `GIZ_BBSR:${selectedLayerType}_${selectedYear}`;
    const wmsUrl = getWMSTileUrl(layerName, wardNumberForFilter, true); // Force WMS for historical years
    
    console.log(`[HistoricalTrends] Heat stress WMS URL (${selectedLayerType} ${selectedYear}):`, wmsUrl);

    map.addSource(sourceId, {
      type: 'raster',
      tiles: [wmsUrl],
      tileSize: 256,
      scheme: 'xyz'
    });

    // CRITICAL: Add heat stress layer BELOW road network layer to maintain strict ordering
    // Layer stack (bottom to top): basemap → heat stress → road network → ward boundaries → municipal boundaries → labels
    // Find the road network layer to insert heat stress below it
    const roadNetworkLayerId = 'road-network-layer';
    let beforeLayerId: string | undefined = undefined;
    
    if (map.getLayer(roadNetworkLayerId)) {
      // Road network exists - insert heat stress layer below it
      beforeLayerId = roadNetworkLayerId;
      console.log('[HistoricalTrends] Inserting heat stress layer BELOW road network');
    } else {
      // Road network not yet added - check for ward boundaries
      const wardBoundariesLayerId = 'ward-boundaries-fill';
      if (map.getLayer(wardBoundariesLayerId)) {
        beforeLayerId = wardBoundariesLayerId;
        console.log('[HistoricalTrends] Inserting heat stress layer BELOW ward boundaries');
      }
    }
    
    // Get the opacity for the current layer type
    const currentLayerId = `heat_${selectedLayerType.toLowerCase()}`;
    const currentOpacity = layerOpacities[currentLayerId] || 0.7;
    
    map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: {
        'raster-opacity': currentOpacity
      }
    }, beforeLayerId);

    console.log('[HistoricalTrends] Heat stress layer added with opacity', currentOpacity, beforeLayerId ? `before ${beforeLayerId}` : 'at top');
    
    // CRITICAL: Enforce complete layer order immediately after adding heat layer
    // This ensures ward labels and boundaries stay on top
    enforceLayerOrder(map);
    
    // Force labels to top after adding layer with multiple attempts
    [50, 100, 200, 300, 500].forEach(delay => {
      setTimeout(() => {
        enforceLayerOrder(map);
        moveBasemapLabelsToTop(map);
      }, delay);
    });
    
    // Clear loading state after layer is added and tiles start loading
    // Wait for 'idle' event to ensure tiles have started loading
    const clearLoading = () => {
      setIsLayerLoading(false);
      map.off('idle', clearLoading);
    };
    map.once('idle', clearLoading);
    
    // Fallback: clear loading after 2 seconds if idle doesn't fire
    setTimeout(() => {
      setIsLayerLoading(false);
    }, 2000);
  };

  const addWardBoundariesLayer = (map: maplibregl.Map) => {
    // Validate map and style first
    if (!map || !map.getStyle()) {
      console.warn('[HistoricalTrends] ⚠️ Map style not available yet in addWardBoundaryLayer, skipping');
      return;
    }
    
    const wardLayerId = 'ward-boundaries';
    const wardLabelLayerId = 'ward-labels';
    
    console.log('[HistoricalTrends] 🏘️  Adding Ward Boundary layer (WFS vector)...');
    
    // Try WFS (GeoJSON) for vector-based ward boundaries with labels
    const WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Barangay_Boundary&outputFormat=application/json&srsName=EPSG:4326';
    
    console.log('[HistoricalTrends] 📡 Fetching ward boundaries from WFS:', WFS_URL);
    
    fetchWithTimeout(WFS_URL, {
      method: 'GET',
      timeout: 60000
    })
      .then(response => {
        console.log('[HistoricalTrends] 📡 WFS Response status:', response.status);
        if (!response.ok) {
          throw new Error(`WFS request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then(geojson => {
        // Validate geojson
        if (!geojson) {
          console.error('[HistoricalTrends] ❌ Ward boundaries GeoJSON is null or undefined');
          return;
        }
        
        if (!geojson.features) {
          console.error('[HistoricalTrends] ❌ Ward boundaries GeoJSON missing features property');
          return;
        }
        
        console.log('[HistoricalTrends] 📊 Processing ward boundaries - Features count:', geojson.features?.length || 0);
        
        // Store ward boundaries data in ref for zoom calculations
        wardBoundariesDataRef.current = geojson;
        console.log('[HistoricalTrends] 📦 Ward boundaries data stored in ref for zoom calculations');
        
        if (geojson.features && geojson.features.length > 0) {
          console.log('[HistoricalTrends] 🔍 First feature properties:', geojson.features[0].properties);
          
          // Validate map still has style
          if (!map || !map.getStyle || !map.getStyle()) {
            console.log('[HistoricalTrends] ℹ️ Map style not ready during ward boundary processing, will retry on next load');
            return;
          }
          
          // Add ward boundary source as GeoJSON
          try {
            if (!map.getSource(wardLayerId)) {
              map.addSource(wardLayerId, {
                type: 'geojson',
                data: geojson,
                generateId: true,
                tolerance: 0.375,
                buffer: 64,
                lineMetrics: false
              });
              console.log('[HistoricalTrends] ✅ Ward Boundary GeoJSON source added with performance optimizations');
            }
          } catch (error) {
            console.error('[HistoricalTrends] ❌ Error adding ward boundary source:', error);
            return;
          }
          
          // Add ward boundary FILL layer (transparent, for clickability)
          const wardFillLayerId = 'ward-boundaries-fill';
          try {
            if (!map.getLayer(wardFillLayerId)) {
              map.addLayer({
                id: wardFillLayerId,
                type: 'fill',
                source: wardLayerId,
                minzoom: 10,
                paint: {
                  'fill-color': '#2563EB',
                  'fill-opacity': 0.01
                }
              });
              console.log('[HistoricalTrends] ✅ Ward Boundary fill layer added (0.01 opacity for clicks, minzoom: 10)');
            }
          } catch (error) {
            console.error('[HistoricalTrends] ❌ Error adding ward fill layer:', error);
          }
          
          // Add ward boundary line layer (visible outline)
          try {
            if (!map.getLayer(wardLayerId)) {
              map.addLayer({
                id: wardLayerId,
                type: 'line',
                source: wardLayerId,
                minzoom: 10,
                paint: {
                  'line-color': '#374151',
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
                  'line-dasharray': [3, 3]
                }
              });
              console.log('[HistoricalTrends] ✅ Ward Boundary line layer added (dark grey outline, minzoom: 10, zoom-dependent width)');
            }
          } catch (error) {
            console.error('[HistoricalTrends] ❌ Error adding ward line layer:', error);
          }
          
          // Add ward boundary highlight layer (blue line for selected ward)
          const wardHighlightLayerId = 'ward-boundaries-highlight';
          try {
            if (!map.getLayer(wardHighlightLayerId)) {
              map.addLayer({
                id: wardHighlightLayerId,
                type: 'line',
                source: wardLayerId,
                minzoom: 10,
                paint: {
                  'line-color': '#2563EB',
                  'line-width': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    10, 1.5,
                    12, 2,
                    14, 2.5,
                    16, 3
                  ],
                  'line-opacity': 1
                },
                filter: ['==', ['get', 'Ward'], '']
              });
              console.log('[HistoricalTrends] ✅ Ward highlight layer added (blue boundary for selected ward, minzoom: 10, zoom-dependent width)');
            }
          } catch (error) {
            console.error('[HistoricalTrends] ❌ Error adding ward highlight layer:', error);
          }
          
          // Add ward number labels using Ward_Point layer (centroids)
          const wardPointSourceId = 'ward-points';
          const WARD_POINT_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Barangay_Boundary_Point&outputFormat=application/json&srsName=EPSG:4326';
          
          fetchWithTimeout(WARD_POINT_WFS_URL, { timeout: 5000 })
            .then(wardPointResponse => {
              if (!wardPointResponse.ok) {
                console.warn('[HistoricalTrends] ⚠️ Ward_Point WFS request failed, skipping ward labels');
                return;
              }
              return wardPointResponse.json();
            })
            .then(wardPointGeojson => {
              if (!wardPointGeojson) return;
              
              // CRITICAL: Validate map still exists before trying to use it
              if (!map || !map.getStyle || !map.getStyle()) {
                console.warn('[HistoricalTrends] ⚠️ Map no longer exists, skipping Ward_Point labels');
                return;
              }
              
              console.log('[HistoricalTrends] ✅ Ward_Point source data loaded');
              
              // Add Ward_Point source with validation
              try {
                if (map.getSource && !map.getSource(wardPointSourceId)) {
                  map.addSource(wardPointSourceId, {
                    type: 'geojson',
                    data: wardPointGeojson
                  });
                  console.log('[HistoricalTrends] ✅ Ward_Point source added');
                }
              } catch (error) {
                console.error('[HistoricalTrends] ❌ Error adding Ward_Point source:', error);
                return;
              }
              
              // Add ward label layer using Ward_Point source
              if (!map.getLayer(wardLabelLayerId)) {
                map.addLayer({
                  id: wardLabelLayerId,
                  type: 'symbol',
                  source: wardPointSourceId,
                  minzoom: 10,
                  layout: {
                    'text-field': ['get', 'BrgyName'],
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
                    'text-offset': [0, 0]
                  },
                  paint: {
                    'text-color': '#1E293B',
                    'text-halo-color': '#FFFFFF',
                    'text-halo-width': 2,
                    'text-halo-blur': 1
                  }
                } as any);
                console.log('[HistoricalTrends] ✅ Ward labels added using Ward_Point layer (centroids)');
                
                // CRITICAL: Move ward labels to top multiple times with increasing delays
                // This ensures they stay visible regardless of when road network loads
                [100, 300, 500, 1000, 2000, 3000, 5000].forEach(delay => {
                  setTimeout(() => {
                    try {
                      // Check if map and style are still valid
                      if (!map || !map.getStyle || !map.getStyle()) {
                        return;
                      }
                      
                      if (map.getLayer && map.getLayer('ward-labels')) {
                        map.moveLayer('ward-labels');
                        console.log(`[HistoricalTrends] ✅ Moved ward-labels to top (${delay}ms)`);
                      }
                      // Also move municipal boundaries to top
                      if (map.getLayer && map.getLayer('municipal-boundary-border')) {
                        map.moveLayer('municipal-boundary-border');
                        console.log(`[HistoricalTrends] ✅ Moved municipal-boundary-border to top (${delay}ms)`);
                      }
                      if (map.getLayer && map.getLayer('municipal-boundary')) {
                        map.moveLayer('municipal-boundary');
                        console.log(`[HistoricalTrends] ✅ Moved municipal-boundary to top (${delay}ms)`);
                      }
                      
                      // Only call moveBasemapLabelsToTop if map is valid
                      if (map && map.getStyle && map.getStyle()) {
                        moveBasemapLabelsToTop(map);
                      }
                    } catch (error) {
                      // Silently ignore errors in delayed callbacks
                      // This is normal if the map has been cleaned up
                    }
                  }, delay);
                });
              }
            })
            .catch(error => {
              // Only log if it's not a map cleanup issue
              if (map && map.getStyle && map.getStyle()) {
                // Silently handle timeout/network errors - ward labels are optional for visualization
                const errorMsg = error instanceof Error ? error.message : String(error);
                if (!errorMsg.includes('timeout') && !errorMsg.includes('Failed to fetch')) {
                  console.warn('[HistoricalTrends] ⚠️ Ward label loading issue:', errorMsg);
                }
              }
            });
          
          // Add click event for ward popups - using custom React popup instead of MapLibre popup
          // IMPORTANT: Listen to FILL layer for better click detection (larger clickable area)
          map.on('click', wardFillLayerId, (e) => {
            console.log('[HistoricalTrends] 🖱️  Ward clicked at:', e.lngLat);
            
            // Check if a building was also clicked at this point (buildings should take priority)
            const buildingLayerIds = ['buildings-fill', 'buildings-3d'];
            const clickedBuildings = map.queryRenderedFeatures(e.point, {
              layers: buildingLayerIds.filter(id => map.getLayer(id))
            });
            
            // If a building was clicked, don't show ward popup
            if (clickedBuildings && clickedBuildings.length > 0) {
              console.log('[HistoricalTrends] 🏢 Building clicked - skipping ward popup');
              return;
            }
            
            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              const properties = feature.properties;
              
              console.log('[HistoricalTrends] 📋 Ward properties:', properties);
              console.log('[HistoricalTrends] 📋 Available property keys:', Object.keys(properties));
              
              // Extract ward information
              const wardName = properties.Ward_Name || properties.WARD_NAME || properties.ward_name || 
                             properties.Name || properties.NAME || properties.name || 'Unknown Ward';
              const wardNumber = properties.Ward || properties.WARD || properties.ward ||
                               properties.Ward_No || properties.WARD_NO || properties.ward_no ||
                               properties.WardNo || properties.WARDNO || 'N/A';
              
              console.log('[HistoricalTrends] 📍 Extracted wardNumber:', wardNumber, 'Type:', typeof wardNumber);
              
              const population = properties.Population || properties.POPULATION || properties.population ||
                               properties.Pop_2011 || properties.POP_2011 || properties.pop_2011;
              const area = properties.Area || properties.AREA || properties.area;
              const density = properties.Density || properties.DENSITY || properties.density;
              const households = properties.Households || properties.HOUSEHOLDS || properties.households;
              const buildings = properties.Buildings || properties.BUILDINGS || properties.buildings ||
                              properties.Building_Count || properties.BUILDING_COUNT || properties.building_count;
              const zone = properties.Zone || properties.ZONE || properties.zone || 'Bhubaneswar';
              
              // Get both geographic and screen coordinates
              const point = map.project(e.lngLat);
              
              console.log('[HistoricalTrends] 📍 Ward clicked at:', e.lngLat, 'screen:', point);
              
              // Set popup data (React state) - this will trigger rendering of custom popup
              setWardPopupData({
                wardName,
                wardNumber: String(wardNumber),
                population: population ? String(population) : undefined,
                area: area ? String(area) : undefined,
                density: density ? String(density) : undefined,
                households: households ? String(households) : undefined,
                buildings: buildings ? String(buildings) : undefined,
                zone: zone ? String(zone) : undefined,
                lng: e.lngLat.lng,
                lat: e.lngLat.lat,
                x: point.x,
                y: point.y
              });
              
              console.log('[HistoricalTrends] ✅ Ward popup data set');
              
              // Set selected ward number for highlighting
              setSelectedWardNumber(String(wardNumber));
              console.log('[HistoricalTrends] ✅ Ward highlight set for ward:', wardNumber);
            } else {
              console.warn('[HistoricalTrends] ⚠️ Click detected but no features found');
            }
          });
          
          // Change cursor on hover (use fill layer for larger hover area)
          map.on('mouseenter', wardFillLayerId, () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          
          map.on('mouseleave', wardFillLayerId, () => {
            map.getCanvas().style.cursor = '';
          });
          
          console.log('[HistoricalTrends] ✅ Ward click events added');
          
          // Move ward boundary layers to top after adding them
          setTimeout(() => {
            try {
              // Move ward layers above everything (except basemap labels)
              if (map.getLayer('ward-boundaries-fill')) {
                map.moveLayer('ward-boundaries-fill');
                console.log('[HistoricalTrends] ✅ Moved ward-boundaries-fill to top');
              }
              if (map.getLayer('ward-boundaries')) {
                map.moveLayer('ward-boundaries');
                console.log('[HistoricalTrends] ✅ Moved ward-boundaries to top');
              }
              if (map.getLayer('ward-boundaries-highlight')) {
                map.moveLayer('ward-boundaries-highlight');
                console.log('[HistoricalTrends] ✅ Moved ward-boundaries-highlight to top');
              }
              
              // Move basemap labels to top
              moveBasemapLabelsToTop(map);
            } catch (error) {
              console.warn('[HistoricalTrends] ⚠️ Error reordering ward boundary layers:', error);
            }
          }, 100);
          
          console.log('[HistoricalTrends] ✅ Ward boundaries processing complete');
          
        } else {
          console.warn('[HistoricalTrends] ⚠️ No features in WFS response');
        }
      })
      .catch(error => {
        console.error('[HistoricalTrends] ❌ WFS loading failed:', error);
      });
  };

  const addMunicipalBoundariesLayer = (map: maplibregl.Map) => {
    if (!map.isStyleLoaded()) {
      console.log('[HistoricalTrends] Waiting for style to load (municipal boundaries)...');
      map.once('styledata', () => addMunicipalBoundariesLayer(map));
      return;
    }

    // ⚠️ DEPRECATED: Old GIZ_BBSR:Municipal_Boundary removed - using WorldBank_Bohol version instead
    console.warn('[HistoricalTrends] ⚠️ Old GIZ_BBSR Municipal_Boundary reference skipped - using WorldBank_Bohol instead');
    return;
    
    // OLD CODE (GIZ_BBSR reference removed):
    console.log('[HistoricalTrends] Fetching municipal boundaries from WFS...');

    const MUNICIPAL_WFS_URL = '';

    fetchWithTimeout(MUNICIPAL_WFS_URL, { timeout: 10000 })
      .then(response => {
        if (!response.ok) {
          console.warn('[HistoricalTrends] Municipal boundaries WFS request failed');
          return;
        }
        return response.json();
      })
      .then(geojson => {
        if (!geojson || !geojson.features || geojson.features.length === 0) {
          console.warn('[HistoricalTrends] Municipal boundaries GeoJSON is empty or invalid');
          return;
        }

        console.log(`[HistoricalTrends] Municipal boundaries GeoJSON loaded: ${geojson.features.length} features`);

        // Extract only the outer boundary lines
        const boundaryLineFeatures = geojson.features.map((feature: any) => {
          const geometry = feature.geometry;

          if (geometry.type === 'Polygon') {
            return {
              type: 'Feature',
              properties: feature.properties,
              geometry: {
                type: 'LineString',
                coordinates: geometry.coordinates[0]
              }
            };
          } else if (geometry.type === 'MultiPolygon') {
            return {
              type: 'Feature',
              properties: feature.properties,
              geometry: {
                type: 'MultiLineString',
                coordinates: geometry.coordinates.map((polygon: any) => polygon[0])
              }
            };
          }
          return feature;
        });

        const boundaryLineGeoJSON = {
          type: 'FeatureCollection',
          features: boundaryLineFeatures
        };

        const municipalLayerId = 'municipal-boundary';
        const municipalBorderLayerId = 'municipal-boundary-border';

        // Remove existing if present
        if (map.getLayer(municipalLayerId)) map.removeLayer(municipalLayerId);
        if (map.getLayer(municipalBorderLayerId)) map.removeLayer(municipalBorderLayerId);
        if (map.getSource('municipal-boundary')) map.removeSource('municipal-boundary');

        // Add source
        map.addSource('municipal-boundary', {
          type: 'geojson',
          data: boundaryLineGeoJSON as any
        });

        // Add outer border (white/light shadow effect)
        map.addLayer({
          id: municipalBorderLayerId,
          type: 'line',
          source: 'municipal-boundary',
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
            'line-opacity': 0.8
          }
        });

        // Add main line (dark grey - matches main map canvas)
        map.addLayer({
          id: municipalLayerId,
          type: 'line',
          source: 'municipal-boundary',
          minzoom: 9,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#1F2937', // Dark grey (gray-800) - MATCHES MAIN MAP CANVAS
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              9, 1.0,   // Reduced thickness
              12, 1.2,
              14, 1.5,
              16, 1.8
            ],
            'line-opacity': 0.95
          }
        });

        console.log('[HistoricalTrends] Municipal boundaries layers added');
        
        // Force layer order after adding municipal boundaries
        [100, 300, 500, 1000, 2000].forEach(delay => {
          setTimeout(() => {
            enforceLayerOrder(map);
          }, delay);
        });
      })
      .catch(error => {
        console.error('[HistoricalTrends] Error loading municipal boundaries:', error);
      });
  };

  const addRoadNetworkLayer = (map: maplibregl.Map) => {
    if (!map || !map.getStyle()) {
      console.warn('[HistoricalTrends] ⚠️ Map style not available yet in addRoadNetworkLayer, skipping');
      return;
    }

    console.log('[HistoricalTrends] 🛣️  ===== ROAD NETWORK LAYER ACTIVATION STARTED =====');
    console.log('[HistoricalTrends] 🚀 Loading road network from GeoServer MVT (Vector Tiles) - ultra-fast rendering');

    // Remove existing source if it exists (prevent duplicate source error)
    if (map && map.getSource && map.getSource('road_network_base')) {
      console.log('[HistoricalTrends] 🗑️  Removing existing road_network_base source before re-adding');
      // Remove all associated layers first
      ['road_network_link', 'road_network_major', 'road_network_state', 'road_network_national'].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });
      map.removeSource('road_network_base');
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
    if (selectedLguName && selectedLguName !== 'all' && selectedLguName !== 'All LGUs') {
      const escapedLguName = selectedLguName.replace(/'/g, "''");
      cqlFilters.push(`MunName='${escapedLguName}'`);
      console.log(`[HistoricalTrends] 🔍 Applying LGU filter to road network: ${selectedLguName}`);
    }
    
    // Add Barangay filter if selected
    if (selectedWardId && selectedWardId !== 'all') {
      const escapedBrgyId = selectedWardId.replace(/'/g, "''");
      cqlFilters.push(`BrgyID='${escapedBrgyId}'`);
      console.log(`[HistoricalTrends] 🔍 Applying Barangay filter to road network: BrgyID ${selectedWardId}`);
    }
    
    // Apply combined CQL filter if we have any filters
    if (cqlFilters.length > 0) {
      tileUrlRoad += `&CQL_FILTER=${encodeURIComponent(cqlFilters.join(' AND '))}`;
    }

    console.log('[HistoricalTrends] 📍 MVT Tile URL:', tileUrlRoad);

    try {
      // Add MVT (Vector Tile) source
      map.addSource('road_network_base', {
        type: 'vector',
        tiles: [tileUrlRoad],
        minzoom: 0,
        maxzoom: 22
      });

      console.log('[HistoricalTrends] ✅ Road network MVT source added');

      // CRITICAL: Road network layers must be inserted BEFORE ward boundaries to maintain strict layer order
      // Layer order: basemap → heat stress → waterbody → road network → ward boundaries → municipal → labels
      // Find ward boundaries layer as reference point
      const wardBoundariesLayerId = 'ward-boundaries-fill';
      let beforeLayerId: string | undefined = undefined;
      
      if (map.getLayer(wardBoundariesLayerId)) {
        beforeLayerId = wardBoundariesLayerId;
        console.log('[HistoricalTrends] 🎯 Inserting road network layers BEFORE ward boundaries');
      } else {
        console.log('[HistoricalTrends] ⚠️ Ward boundaries not found, adding road network at top (will reorder later)');
      }

      // Layer 1: Link Roads (bottom, most subtle)
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

      console.log('[HistoricalTrends] ✅ Road network layers (4 separate) added with MVT - ultra-fast rendering');
      console.log('[HistoricalTrends] 🛣️  ===== ROAD NETWORK LAYER ACTIVATION COMPLETE =====');
      
      // CRITICAL: Ensure proper layer ordering - ward boundaries and labels ALWAYS on top
      // Layer order: hazard → road network → ward boundaries → municipal boundaries → labels
      setTimeout(() => {
        enforceLayerOrder(map);
      }, 100);
      
      // CRITICAL: Keep enforcing layer order with additional delays
      [300, 500, 1000, 2000, 3000].forEach(delay => {
        setTimeout(() => {
          enforceLayerOrder(map);
        }, delay);
      });
    } catch (error) {
      console.error('[HistoricalTrends] ❌ [Road Network] MVT layer creation failed:', error);
      console.log('[HistoricalTrends] ❌ Failed to add road network MVT layers:', error);
    }
  };

  const addWaterbodyLayer = (map: maplibregl.Map) => {
    if (!map || !map.getStyle || !map.getStyle()) {
      console.warn('[HistoricalTrends] ⚠️ Map style not available yet in addWaterbodyLayer, skipping');
      return;
    }

    // ⚠️ DEPRECATED: Old GIZ_BBSR:Waterbody layer removed
    console.warn('[HistoricalTrends] ⚠️ Waterbody layer not available for Bohol. Layer disabled.');
    return;
    
    // OLD CODE (GIZ_BBSR reference removed):
    console.log('[HistoricalTrends] 💧 Adding waterbody layer as vector layer');

    // Build WFS request for GeoJSON
    const wfsUrl = '';
    let url = `${wfsUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=GIZ_BBSR:Waterbody&outputFormat=application/json&srsName=EPSG:4326`;

    // Add CQL filter for ward if needed
    const wardNumber = parseInt(selectedWardId || '0', 10);
    if (wardNumber > 0) {
      const cqlFilter = `Ward=${wardNumber}`;
      url += `&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
      console.log(`[HistoricalTrends] 🔍 Applying ward filter to waterbody: Ward ${wardNumber}`);
    }

    console.log('[HistoricalTrends] 📡 Fetching waterbody data from:', url);
    
    fetch(url)
      .then(response => response.json())
      .then(geojson => {
        console.log('[HistoricalTrends] ✅ Waterbody data loaded:', geojson.features?.length, 'features');

        // Check if map still exists and has valid style after async fetch
        if (!map || !map.getSource || !map.getStyle || !map.getStyle()) {
          console.log('[HistoricalTrends] ⚠️ Map was destroyed or style lost during waterbody fetch, skipping layer addition');
          return;
        }

        // Remove existing source if it exists (prevent duplicate source error)
        try {
          if (map.getSource('waterbody')) {
            console.log('[HistoricalTrends] 🗑️  Removing existing waterbody source before re-adding');
            if (map.getLayer('waterbody')) {
              map.removeLayer('waterbody');
            }
            map.removeSource('waterbody');
          }
        } catch (error) {
          console.warn('[HistoricalTrends] ⚠️ Error checking/removing existing waterbody layer:', error);
        }

        // Add source
        map.addSource('waterbody', {
          type: 'geojson',
          data: geojson
        });

        // Waterbody layer should be above heat stress but below road network
        // Find road network link layer as the reference point
        const roadLinkLayerId = 'road_network_link';
        const beforeLayerId = map.getLayer(roadLinkLayerId) ? roadLinkLayerId : undefined;

        // Add waterbody layer with fill
        map.addLayer({
          id: 'waterbody',
          type: 'fill',
          source: 'waterbody',
          paint: {
            'fill-color': '#3B82F6', // Blue color
            'fill-opacity': 0.4
          }
        }, beforeLayerId);

        console.log('[HistoricalTrends] ✅ Waterbody layer added');
        
        // Ensure proper layer ordering after adding waterbody
        setTimeout(() => {
          if (map && map.getStyle && map.getStyle()) {
            enforceLayerOrder(map);
          }
        }, 100);
      })
      .catch(error => {
        // Silently handle fetch errors - expected when backend is unavailable
        console.log('[HistoricalTrends] ℹ️  Waterbody layer not available (backend not connected)');
      });
  };

  const addBuildingsLayer = (map: maplibregl.Map) => {
    if (!map || !map.getStyle || !map.getStyle()) {
      console.warn('[HistoricalTrends] ⚠️ Map style not available yet in addBuildingsLayer, skipping');
      return;
    }

    console.log('[HistoricalTrends] 🏢 ===== BUILDINGS LAYER ACTIVATION STARTED =====');
    console.log('[HistoricalTrends] 🚀 Loading buildings from GeoServer MVT (Vector Tiles) - ultra-fast rendering');

    // Remove existing source if it exists
    if (map && map.getSource && map.getSource('buildings')) {
      console.log('[HistoricalTrends] 🗑️  Removing existing buildings source before re-adding');
      
      // Remove all associated layers first
      ['buildings-fill', 'buildings-3d', 'buildings-highlight', 'buildings'].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });
      map.removeSource('buildings');
    }

    // Base URL for GeoServer
    const baseUrl = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/wms';
    
    // Construct MVT tile URL with CQL_FILTER for ward filtering if needed
    let tileUrl = baseUrl + 
      '?service=WMS&version=1.1.0&request=GetMap' +
      '&layers=WorldBank_Bohol:Buildings' +
      '&bbox={bbox-epsg-3857}' +
      '&width=512&height=512' +
      '&srs=EPSG:3857' +
      '&format=application/vnd.mapbox-vector-tile';

    // Add ward filter if needed
    const wardNumber = parseInt(selectedWardId || '0', 10);
    if (wardNumber > 0) {
      const cqlFilter = `Ward=${wardNumber}`;
      tileUrl += `&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
      console.log(`[HistoricalTrends] 🔍 Applying ward filter to buildings: Ward ${wardNumber}`);
    }

    console.log('[HistoricalTrends] 📍 MVT Tile URL:', tileUrl);

    // Set loading state
    setIsBuildingsLoading(true);

    try {
      // Add MVT (Vector Tile) source
      map.addSource('buildings', {
        type: 'vector',
        tiles: [tileUrl],
        minzoom: 15,
        maxzoom: 22
      });

      // Add fill layer for click interaction (Google Maps style with grey fill)
      map.addLayer({
        id: 'buildings-fill',
        type: 'fill',
        source: 'buildings',
        'source-layer': 'Buildings',
        minzoom: 11, // LOD: Show buildings from zoom 11+ (city full scale)
        layout: {
          'visibility': is3DMode ? 'none' : 'visible'
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
        id: 'buildings-3d',
        type: 'fill-extrusion',
        source: 'buildings',
        'source-layer': 'Buildings',
        minzoom: 11, // LOD: Show 3D buildings at city scale for better visualization
        layout: {
          'visibility': is3DMode ? 'visible' : 'none'
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
            ['to-number', ['coalesce', ['get', 'floor'], 1]],
            4 // Each floor is 4 meters
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.7
        }
      });

      // Add outline layer with category-based darker color
      map.addLayer({
        id: 'buildings',
        type: 'line',
        source: 'buildings',
        'source-layer': 'Buildings',
        minzoom: 11, // LOD: Match main buildings layer
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
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

      // Add highlight layer (invisible by default, used for selection)
      map.addLayer({
        id: 'buildings-highlight',
        type: 'line',
        source: 'buildings',
        'source-layer': 'Buildings',
        minzoom: 11, // LOD: Match main buildings layer
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#2563EB',
          'line-width': 3,
          'line-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            1,
            0
          ]
        }
      });

      console.log('[HistoricalTrends] ✅ Buildings layer added successfully');

      // Make buildings clickable
      let hoveredBuildingId: number | null = null;

      // 3D hover effect
      map.on('mousemove', 'buildings-3d', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        if (hoveredBuildingId !== null) {
          map.setFeatureState(
            { source: 'buildings', sourceLayer: 'Buildings', id: hoveredBuildingId },
            { hover: false }
          );
        }
        
        const feature = e.features[0];
        if (feature.id !== undefined) {
          hoveredBuildingId = feature.id as number;
          map.setFeatureState(
            { source: 'buildings', sourceLayer: 'Buildings', id: hoveredBuildingId },
            { hover: true }
          );
        }
      });

      // Clear hover state when mouse leaves 3D buildings
      map.on('mouseleave', 'buildings-3d', () => {
        if (hoveredBuildingId !== null) {
          map.setFeatureState(
            { source: 'buildings', sourceLayer: 'Buildings', id: hoveredBuildingId },
            { hover: false }
          );
        }
        hoveredBuildingId = null;
        map.getCanvas().style.cursor = '';
      });

      // Make the layer clickable
      map.on('click', 'buildings-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        const props = feature.properties;
        
        console.log('[HistoricalTrends] 🏢 Building clicked:', props);
        
        // Close other popups
        setWardPopupData(null);
        
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
          y: point.y
        });
      });

      // Change cursor on hover
      map.on('mouseenter', 'buildings-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'buildings-fill', () => {
        map.getCanvas().style.cursor = '';
      });

      // Make 3D buildings layer clickable (same popup as 2D)
      map.on('click', 'buildings-3d', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        const props = feature.properties;
        
        console.log('[HistoricalTrends] 🏢 3D Building clicked:', props);
        
        // Close other popups
        setWardPopupData(null);
        
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
          y: point.y
        });
      });

      // Cursor for 3D buildings
      map.on('mouseenter', 'buildings-3d', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'buildings-3d', () => {
        map.getCanvas().style.cursor = '';
      });

      // Enforce layer order
      setTimeout(() => {
        if (map && map.getStyle && map.getStyle()) {
          enforceLayerOrder(map);
        }
      }, 100);

      // Hide loading indicator after a short delay (buildings should be rendered)
      setTimeout(() => {
        setIsBuildingsLoading(false);
        console.log('[HistoricalTrends] ✅ Buildings layer loaded and rendered');
      }, 500);

    } catch (error) {
      console.error('[HistoricalTrends] ❌ Error adding buildings layer:', error);
      setIsBuildingsLoading(false);
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: BOHOL_CENTER,
        zoom: INITIAL_ZOOM,
        pitch: 0,
        bearing: 0,
        essential: true
      });
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleToggle3D = () => {
    if (!mapRef.current) return;
    
    const newMode = !is3DMode;
    setIs3DMode(newMode);
    
    mapRef.current.easeTo({
      pitch: newMode ? 45 : 0,
      duration: 600
    });
  };

  const handleLocationSelect = (location: { lat: number; lng: number; name: string }) => {
    if (!mapRef.current) return;
    
    mapRef.current.flyTo({
      center: [location.lng, location.lat],
      zoom: 15,
      essential: true
    });
  };

  const handleDownloadMap = () => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    const canvas = map.getCanvas();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    
    const link = document.createElement('a');
    link.download = `historical-trends-${sector}-${new Date().toISOString().split('T')[0]}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause the animation
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // If at the end (2025), restart from the beginning (2015)
      if (selectedYear === 2025) {
        setSelectedYear(2015);
      }
      
      // Start the animation
      const interval = setInterval(() => {
        // Increment the year
        setSelectedYear(prevYear => {
          const nextYear = prevYear + 1;
          if (nextYear > 2025) {
            // Stop at 2025 and pause
            if (playIntervalRef.current) {
              clearInterval(playIntervalRef.current);
              playIntervalRef.current = null;
            }
            setIsPlaying(false);
            return 2025;
          }
          return nextYear;
        });
      }, 2000); // Change year every 2 seconds
      playIntervalRef.current = interval;
      setIsPlaying(true);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC]">
      {/* Header */}
      <Header
        onReset={() => {}}
        onQueryToggle={undefined}
        isQueryActive={false}
        selectedWardId={selectedWardId}
        onWardSelect={onWardSelect}
        selectedRoadName="all"
        onRoadNameSelect={() => {}}
        activeRoadSafetySubLayers={[]}
        onRoadZoom={() => {}}
        onResetView={handleResetView}
        isComparisonMode={false}
        isHistoricalTrendsMode={true}
        onExitHistoricalTrends={onClose}
      />

      {/* Main Content: Map + Right Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Container */}
        <div className="relative flex-1 h-full bg-[#F1F5F9]">
          {/* MapLibre GL Container */}
          <div 
            ref={mapContainer} 
            className="absolute inset-0 w-full h-full"
          />

          {/* Heat Stress Layer Loading Indicator */}
          {isLayerLoading && (
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

          {/* Buildings Layer Loading Indicator */}
          {isBuildingsLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto cursor-wait bg-black/5 backdrop-blur-[1px]">
              <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-full shadow-xl border border-[#E2E8F0]/50 flex items-center gap-2">
                <div className="relative w-4 h-4">
                  <div className="absolute inset-0 border-2 border-[#2563EB]/20 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span className="text-xs text-slate-600">Loading buildings</span>
              </div>
            </div>
          )}

          {/* Year Slider Panel - Top Left */}
          <div className="absolute top-4 left-4 z-10 bg-white/70 backdrop-blur-md border border-[#E2E8F0] rounded-lg shadow-xl p-2 min-w-[280px]">
            {/* Compact Header Row */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayPause}
                  className={`w-7 h-7 rounded flex items-center justify-center transition-all duration-200 shadow-sm ${
                    isPlaying 
                      ? 'bg-gradient-to-br from-[#2563EB] to-[#1E40AF] hover:shadow-md' 
                      : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-slate-700 ml-0.5" />
                  )}
                </button>
                <span className="text-[11px] font-semibold text-slate-600">Timeline</span>
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-[#2563EB] to-[#1E40AF] bg-clip-text text-transparent">
                {selectedYear}
              </div>
            </div>
            
            {/* Slider */}
            <div className="relative px-0.5">
              <input
                type="range"
                min={2015}
                max={2025}
                step={1}
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, #2563EB 0%, #2563EB ${((selectedYear - 2015) / (2025 - 2015)) * 100}%, #E2E8F0 ${((selectedYear - 2015) / (2025 - 2015)) * 100}%, #E2E8F0 100%)`
                }}
              />
              
              {/* Compact Year Labels */}
              <div className="flex justify-between mt-1 px-0.5 text-[9px] text-slate-400 font-semibold">
                <span>2015</span>
                <span className="opacity-70">2018</span>
                <span className="opacity-70">2021</span>
                <span>2025</span>
              </div>
            </div>
            
            {/* Layer Type Selector */}
            <div className="mt-2 pt-2 border-t border-slate-200/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-slate-600">Heat Stress Layer</span>
              </div>
              <div className="relative layer-selector-container">
                <button
                  onClick={() => setLayerSelectorOpen(!layerSelectorOpen)}
                  className="w-full px-2.5 py-1.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-md shadow-sm hover:shadow-md hover:border-[#2563EB] transition-all duration-200 flex items-center justify-between text-xs text-slate-700 font-medium"
                >
                  <span className="truncate">{HEAT_STRESS_LAYERS.find(l => l.code === selectedLayerType)?.name || selectedLayerType}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 flex-shrink-0 ml-1 ${layerSelectorOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown */}
                {layerSelectorOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-sm border border-[#E2E8F0] rounded-md shadow-lg overflow-hidden z-20">
                    {HEAT_STRESS_LAYERS.map((layer) => (
                      <button
                        key={layer.code}
                        onClick={() => {
                          setSelectedLayerType(layer.code);
                          setLayerSelectorOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 text-left text-xs hover:bg-[#F8FAFC] transition-colors ${
                          selectedLayerType === layer.code ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold' : 'text-slate-700'
                        }`}
                      >
                        {layer.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map Controls - Compact Modern Widget (matching MapCanvas) */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
            {/* Location Search and Home Button Row */}
            <div className="flex items-center gap-2">
              <LocationSearch onLocationSelect={handleLocationSelect} />
              
              {/* Home / Reset View */}
              <button
                onClick={handleResetView}
                className="w-8 h-8 bg-white/95 backdrop-blur-sm border border-[#E2E8F0] rounded-md shadow-sm hover:shadow-md hover:border-[#2563EB] transition-all duration-200 flex items-center justify-center group"
                title="Reset View"
              >
                <Home className="w-3.5 h-3.5 text-slate-600 group-hover:text-[#2563EB] transition-colors" />
              </button>
            </div>

            {/* 3D Toggle Button - Below Home */}
            <div className="flex justify-end">
              <button
                onClick={handleToggle3D}
                className={`w-8 h-8 bg-white/95 backdrop-blur-sm border ${is3DMode ? 'border-[#2563EB] shadow-md' : 'border-[#E2E8F0] shadow-sm'} rounded-md hover:shadow-md hover:border-[#2563EB] transition-all duration-200 flex items-center justify-center group`}
                title={is3DMode ? "Disable 3D View" : "Enable 3D View"}
              >
                <Box className={`w-3.5 h-3.5 ${is3DMode ? 'text-[#2563EB]' : 'text-slate-600'} group-hover:text-[#2563EB] transition-colors`} />
              </button>
            </div>

            {/* Vertical Column for Zoom and Basemap - Aligned to right */}
            <div className="flex flex-col gap-1.5 self-end">
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
                        setBasemap('light');
                        setBasemapSwitcherOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs hover:bg-[#F8FAFC] transition-colors flex items-center gap-2 ${basemap === 'light' ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-slate-700'}`}
                    >
                      <Map className="w-4 h-4" />
                      <span>Grey</span>
                    </button>
                    <button
                      onClick={() => {
                        setBasemap('satellite');
                        setBasemapSwitcherOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs hover:bg-[#F8FAFC] transition-colors flex items-center gap-2 border-t border-[#F1F5F9] ${basemap === 'satellite' ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-slate-700'}`}
                    >
                      <Satellite className="w-4 h-4" />
                      <span>Satellite</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Download Map */}
              <button
                onClick={handleDownloadMap}
                className="w-8 h-8 bg-white/95 backdrop-blur-sm border border-[#E2E8F0] rounded-md shadow-sm hover:shadow-md hover:border-[#2563EB] transition-all duration-200 flex items-center justify-center group"
                title="Download Map (JPG)"
              >
                <Download className="w-4 h-4 text-slate-600 group-hover:text-[#2563EB] transition-colors" />
              </button>
            </div>
          </div>

          {/* Floating Legend Panel - Dynamic based on selected layer type */}
          <FloatingLegendPanel
            activeSector="heat"
            activeLayerId={`heat_${selectedLayerType.toLowerCase()}`}
            scenario="baseline_2025"
            activeSubLayers={[]}
            activeInfraLayers={[]}
            activeRoadNetworkIRAPType={null}
            activeRoadSafetySubLayers={[]}
            sectorOpacity={sectorOpacity}
            setSectorOpacity={setSectorOpacity}
            activeBaseLayers={['ward_boundaries', 'municipal_boundary']}
            layerOpacities={layerOpacities}
            onLayerOpacityChange={handleLayerOpacityChange}
            roadNetworkStats={{}}
            roadSafetyStats={{}}
            minimized={legendMinimized}
            onMinimizeToggle={setLegendMinimized}
          />

          {/* Custom Ward Popup - React-based, not MapLibre */}
          {wardPopupData && (
            <WardPopup
              wardName={wardPopupData.wardName}
              wardNumber={wardPopupData.wardNumber}
              population={wardPopupData.population}
              area={wardPopupData.area}
              density={wardPopupData.density}
              households={wardPopupData.households}
              buildings={wardPopupData.buildings}
              zone={wardPopupData.zone}
              lguName={wardPopupData.lguName}
              x={wardPopupData.x}
              y={wardPopupData.y}
              onClose={() => {
                setWardPopupData(null);
                setSelectedWardNumber(null);
              }}
            />
          )}

          {/* Custom Building Popup - React-based, not MapLibre */}
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
                setBuildingPopupData(null);
              }}
            />
          )}

          {/* Custom Attribution Control - Fixed position, always on top */}
          <div 
            className="absolute bottom-2 right-4 z-50 flex items-center transition-all duration-200"
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
                  background: basemap === 'satellite' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(8px)',
                  textShadow: basemap === 'satellite' ? '0 1px 3px rgba(0, 0, 0, 0.8)' : '0 1px 2px rgba(255, 255, 255, 0.8)',
                  color: basemap === 'satellite' ? '#FFFFFF' : '#64748B',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  marginRight: '3px'
                }}
              >
                &nbsp;<a href="https://tagbilaran.gov.ph/" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: basemap === 'satellite' ? '#FFFFFF' : '#2563EB', fontWeight: 600, textDecoration: 'none' }}>City Government of Tagbilaran</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://dauis.igov.ph/" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: basemap === 'satellite' ? '#FFFFFF' : '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Municipality of Dauis</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://panglaolgu.gov.ph/" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: basemap === 'satellite' ? '#FFFFFF' : '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Municipality of Panglao</a>&nbsp;&nbsp;|&nbsp;&nbsp;Developed by&nbsp;<a href="https://innpactsolutions.com/" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: basemap === 'satellite' ? '#FFFFFF' : '#2563EB', fontWeight: 600, textDecoration: 'none' }}>Innpact Solutions</a>
              </div>
            </div>
            <button
              onClick={() => setAttributionOpen(!attributionOpen)}
              className="flex-shrink-0 flex items-center justify-center transition-all duration-200"
              style={{
                width: '16px',
                height: '16px',
                minWidth: '16px',
                background: basemap === 'satellite' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(37, 99, 235, 0.15)',
                backdropFilter: 'blur(8px)',
                borderRadius: '50%',
                border: basemap === 'satellite' ? '1.5px solid #FFFFFF' : '1.5px solid #2563EB',
                boxShadow: basemap === 'satellite' ? '0 1px 3px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(37, 99, 235, 0.2)',
                cursor: 'pointer',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = basemap === 'satellite' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(37, 99, 235, 0.25)';
                e.currentTarget.style.borderColor = basemap === 'satellite' ? '#E0E7FF' : '#1D4ED8';
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = basemap === 'satellite' ? '0 2px 5px rgba(0, 0, 0, 0.5)' : '0 2px 5px rgba(37, 99, 235, 0.3)';
                const span = e.currentTarget.querySelector('span');
                if (span) span.style.color = basemap === 'satellite' ? '#E0E7FF' : '#1D4ED8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = basemap === 'satellite' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(37, 99, 235, 0.15)';
                e.currentTarget.style.borderColor = basemap === 'satellite' ? '#FFFFFF' : '#2563EB';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = basemap === 'satellite' ? '0 1px 3px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(37, 99, 235, 0.2)';
                const span = e.currentTarget.querySelector('span');
                if (span) span.style.color = basemap === 'satellite' ? '#FFFFFF' : '#2563EB';
              }}
              title="Map Credits"
            >
              <span 
                className="text-[9px] font-bold italic block transition-colors" 
                style={{ 
                  fontFamily: 'Georgia, serif',
                  color: basemap === 'satellite' ? '#FFFFFF' : '#2563EB',
                  lineHeight: 1
                }}
              >
                i
              </span>
            </button>
          </div>
        </div>

        {/* Right Panel - Area Distribution Chart */}
        <div className="w-[330px] bg-white border-l border-[#E5E7EB] flex flex-col flex-shrink-0 shadow-lg overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 pb-3 border-b border-[#E5E7EB]">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center shadow-sm">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Historical Trends Analysis
              </h3>
            </div>
            
            {/* Year and Layer Info Card */}
            <div className="border border-[#E5E7EB] rounded-lg p-3 bg-gradient-to-br from-[#EFF6FF] to-white shadow-sm relative overflow-hidden">
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#2563EB]/10 to-transparent rounded-bl-full"></div>
              
              <div className="relative">
                <div className="text-[9px] font-medium text-[#64748B] uppercase tracking-wide mb-1.5">Active Layer</div>
                <div className="text-xs font-semibold text-[#0F172A] mb-2">
                  {HEAT_STRESS_LAYERS.find(l => l.code === selectedLayerType)?.name || selectedLayerType}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                  <div className="w-1 h-1 rounded-full bg-[#2563EB]"></div>
                  <span>Year: <span className="font-semibold text-[#0F172A]">{selectedYear}</span></span>
                </div>
              </div>
            </div>
            
            {/* Area Distribution Chart - Key includes layer type and ward to force refresh when those change */}
            <AreaDistributionChart
              key={`${selectedLayerType}-${selectedWardId}`}
              activeSector={'heat' as Sector}
              activeLayerId={`heat_${selectedLayerType.toLowerCase()}`}
              scenario={'baseline_2025' as Scenario}
              title="Area Distribution"
              selectedWardId={selectedWardId !== 'all' ? selectedWardId : undefined}
              showLabelsInUI={true}
              year={selectedYear}
              chartType="bar"
            />
            
            {/* Historical Trends Line Chart */}
            <div className="border border-[#E5E7EB] rounded-lg p-3 bg-gradient-to-br from-white to-gray-50/50 shadow-sm relative overflow-hidden">
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#2563EB]/5 to-transparent rounded-bl-full"></div>
              
              <div className="relative">
                <h4 className="text-xs font-semibold text-[#0F172A] mb-1">Hazard Historic Trends (2015-2025)</h4>
                <p className="text-[9px] text-[#64748B] mb-3">Area Percentage By Severity Level Over Time</p>
              
              {isHistoricalDataLoading && (
                <div className="h-48 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] font-medium text-[#64748B]">Loading trends...</span>
                  </div>
                </div>
              )}
              
              {!isHistoricalDataLoading && historicalTrendsData.length === 0 && (
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xs font-medium text-[#64748B]">No historical data available</div>
                    <div className="text-[9px] text-[#94A3B8] mt-1">Select a different layer or ward</div>
                  </div>
                </div>
              )}
              
              {!isHistoricalDataLoading && historicalTrendsData.length > 0 && (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart
                    data={historicalTrendsData}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: '#64748B', fontSize: 10 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis
                      tick={{ fill: '#64748B', fontSize: 10 }}
                      axisLine={{ stroke: '#E2E8F0' }}
                      tickLine={{ stroke: '#E2E8F0' }}
                      domain={[0, 100]}
                      label={{ value: 'Area (%)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748B', fontWeight: 500 } }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        
                        return (
                          <div
                            style={{
                              backgroundColor: 'rgba(15, 23, 42, 0.95)',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              borderRadius: '8px',
                              padding: '8px 10px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                          >
                            <div style={{ fontWeight: 600, marginBottom: '6px', color: '#fff', fontSize: '10px' }}>
                              Year: {label}
                            </div>
                            {payload.map((entry: any, index: number) => {
                              const gridcodeName = entry.name;
                              let gridcodeLabel = gridcodeName;
                              
                              // Get label from historicalTrendsData
                              if (gridcodeName === 'gridcode3' && historicalTrendsData[0]?.gridcode3Label) {
                                gridcodeLabel = historicalTrendsData[0].gridcode3Label;
                              } else if (gridcodeName === 'gridcode4' && historicalTrendsData[0]?.gridcode4Label) {
                                gridcodeLabel = historicalTrendsData[0].gridcode4Label;
                              }
                              
                              return (
                                <div
                                  key={index}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginTop: '4px',
                                    fontSize: '10px',
                                    color: '#fff'
                                  }}
                                >
                                  <div
                                    style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      backgroundColor: entry.color,
                                      flexShrink: 0
                                    }}
                                  />
                                  <span>{gridcodeLabel}: {entry.value.toFixed(1)}%</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '10px', paddingTop: '12px' }}
                      iconType="line"
                      iconSize={14}
                      formatter={(value, entry: any) => {
                        const firstData = historicalTrendsData[0];
                        if (!firstData) return value;
                        if (value === 'gridcode3') return firstData.gridcode3Label;
                        if (value === 'gridcode4') return firstData.gridcode4Label;
                        return value;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="gridcode3"
                      name="gridcode3"
                      stroke={historicalTrendsData[0]?.gridcode3Color || '#FC8D59'}
                      strokeWidth={2}
                      dot={(props: any) => {
                        const isSelected = props.payload.year === selectedYear;
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={isSelected ? 6 : 3}
                            fill={historicalTrendsData[0]?.gridcode3Color || '#FC8D59'}
                            stroke={isSelected ? '#fff' : 'none'}
                            strokeWidth={isSelected ? 2 : 0}
                          />
                        );
                      }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="gridcode4"
                      name="gridcode4"
                      stroke={historicalTrendsData[0]?.gridcode4Color || '#D73027'}
                      strokeWidth={2}
                      dot={(props: any) => {
                        const isSelected = props.payload.year === selectedYear;
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={isSelected ? 6 : 3}
                            fill={historicalTrendsData[0]?.gridcode4Color || '#D73027'}
                            stroke={isSelected ? '#fff' : 'none'}
                            strokeWidth={isSelected ? 2 : 0}
                          />
                        );
                      }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              </div>
            </div>
            
            {/* IMD Heat Analytics Section */}
            <>
              {/* Section Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: '#EF444420' }}
                >
                  <Flame className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-[#0F172A]">IMD Heat Analytics – {selectedYear}</h3>
                </div>
              </div>
              
              {/* KPI Cards - 2x2 Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Card 1: Total heatwave days */}
                    <div 
                      className="relative border border-[#E5E7EB] rounded-lg p-3 bg-gradient-to-br from-white to-[#F8FAFC] overflow-hidden h-[78px] cursor-help"
                      onMouseEnter={(e) => setImdTooltip({ kpi: 'heatwave', x: e.clientX, y: e.clientY })}
                      onMouseMove={(e) => setImdTooltip({ kpi: 'heatwave', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setImdTooltip(null)}
                    >
                      <div 
                        className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -translate-y-8 translate-x-8 opacity-20"
                        style={{ backgroundColor: '#EF4444' }}
                      />
                      <div className="relative">
                        <div className="text-[10px] text-[#64748B] font-medium mb-1.5 overflow-hidden">
                          <div className="whitespace-nowrap">Total Heatwave Days</div>
                        </div>
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <div 
                            className="font-bold truncate text-[#0F172A]" 
                            style={{ fontSize: '14px', lineHeight: '18px' }}
                          >
                            {imdHeatData?.total_heatwave_days ?? 0}
                          </div>
                        </div>
                        <div className="text-[9px] text-[#94A3B8] leading-tight overflow-hidden">
                          <div className="whitespace-nowrap">Total days classified</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card 2: Severe heatwave days */}
                    <div 
                      className="relative border border-[#E5E7EB] rounded-lg p-3 bg-gradient-to-br from-white to-[#F8FAFC] overflow-hidden h-[78px] cursor-help"
                      onMouseEnter={(e) => setImdTooltip({ kpi: 'severe', x: e.clientX, y: e.clientY })}
                      onMouseMove={(e) => setImdTooltip({ kpi: 'severe', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setImdTooltip(null)}
                    >
                      <div 
                        className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -translate-y-8 translate-x-8 opacity-20"
                        style={{ backgroundColor: '#DC2626' }}
                      />
                      <div className="relative">
                        <div className="text-[10px] text-[#64748B] font-medium mb-1.5 overflow-hidden">
                          <div className="whitespace-nowrap">Severe Heatwave Days</div>
                        </div>
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <div 
                            className="font-bold truncate text-[#0F172A]" 
                            style={{ fontSize: '14px', lineHeight: '18px' }}
                          >
                            {imdHeatData?.severe_heatwave_days ?? 0}
                          </div>
                        </div>
                        <div className="text-[9px] text-[#94A3B8] leading-tight overflow-hidden">
                          <div className="whitespace-nowrap">Extreme severity events</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card 3: Longest heatwave spell */}
                    <div 
                      className="relative border border-[#E5E7EB] rounded-lg p-3 bg-gradient-to-br from-white to-[#F8FAFC] overflow-hidden h-[78px] cursor-help"
                      onMouseEnter={(e) => setImdTooltip({ kpi: 'spell', x: e.clientX, y: e.clientY })}
                      onMouseMove={(e) => setImdTooltip({ kpi: 'spell', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setImdTooltip(null)}
                    >
                      <div 
                        className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -translate-y-8 translate-x-8 opacity-20"
                        style={{ backgroundColor: '#F97316' }}
                      />
                      <div className="relative">
                        <div className="text-[10px] text-[#64748B] font-medium mb-1.5 overflow-hidden">
                          <div className="whitespace-nowrap">Longest Heatwave Spell</div>
                        </div>
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <div 
                            className="font-bold truncate text-[#0F172A]" 
                            style={{ fontSize: '14px', lineHeight: '18px' }}
                          >
                            {imdHeatData?.longest_heatwave_spell_days 
                              ? `${imdHeatData.longest_heatwave_spell_days} days`
                              : '0 days'
                            }
                          </div>
                        </div>
                        <div className="text-[9px] text-[#94A3B8] leading-tight overflow-hidden">
                          <div className="whitespace-nowrap">
                            {imdHeatData?.longest_spell_start && imdHeatData?.longest_spell_end
                              ? `${imdHeatData.longest_spell_start} – ${imdHeatData.longest_spell_end}`
                              : 'No spell recorded'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card 4: Total warm nights */}
                    <div 
                      className="relative border border-[#E5E7EB] rounded-lg p-3 bg-gradient-to-br from-white to-[#F8FAFC] overflow-hidden h-[78px] cursor-help"
                      onMouseEnter={(e) => setImdTooltip({ kpi: 'warm', x: e.clientX, y: e.clientY })}
                      onMouseMove={(e) => setImdTooltip({ kpi: 'warm', x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setImdTooltip(null)}
                    >
                      <div 
                        className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -translate-y-8 translate-x-8 opacity-20"
                        style={{ backgroundColor: '#F59E0B' }}
                      />
                      <div className="relative">
                        <div className="text-[10px] text-[#64748B] font-medium mb-1.5 overflow-hidden">
                          <div className="whitespace-nowrap">Total Warm Nights</div>
                        </div>
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <div 
                            className="font-bold truncate text-[#0F172A]" 
                            style={{ fontSize: '14px', lineHeight: '18px' }}
                          >
                            {imdHeatData?.total_warm_nights ?? 0}
                          </div>
                        </div>
                        <div className="text-[9px] text-[#94A3B8] leading-tight overflow-hidden">
                          <div className="whitespace-nowrap">Nighttime heat events</div>
                        </div>
                      </div>
                    </div>
              </div>
            </>
            
            {/* IMD Heat Calendar Section */}
            <IMDHeatCalendar year={selectedYear} />
          </div>
        </div>
      </div>

      {/* IMD KPI Tooltips */}
      {imdTooltip && (
        <div
          className="fixed z-[9999] bg-[#1E293B] text-white rounded-lg shadow-2xl p-3 pointer-events-none max-w-[280px]"
          style={{
            left: `${imdTooltip.x + 12}px`,
            top: `${imdTooltip.y + 12}px`,
          }}
        >
          <div className="text-[10px] leading-relaxed">
            {imdTooltip.kpi === 'heatwave' && (
              <>
                <div className="font-semibold mb-1.5 text-[#FCA5A5]">Total Heatwave Days</div>
                <div className="text-white/90">
                  Declared when maximum temperature is ≥ 40°C and ≥ 4.5°C above normal as per IMD criteria.
                </div>
              </>
            )}
            {imdTooltip.kpi === 'severe' && (
              <>
                <div className="font-semibold mb-1.5 text-[#FCA5A5]">Severe Heatwave Days</div>
                <div className="text-white/90">
                  Declared when maximum temperature is ≥ 47°C or ≥ 6.4°C above normal as per IMD criteria.
                </div>
              </>
            )}
            {imdTooltip.kpi === 'spell' && (
              <>
                <div className="font-semibold mb-1.5 text-[#FCA5A5]">Longest Heatwave Spell</div>
                <div className="text-white/90">
                  Maximum number of consecutive days meeting heatwave criteria in the selected year.
                </div>
              </>
            )}
            {imdTooltip.kpi === 'warm' && (
              <>
                <div className="font-semibold mb-1.5 text-[#FCA5A5]">Total Warm Nights</div>
                <div className="text-white/90">
                  Occurs when minimum temperature is ≥ 4.5°C above normal following a hot day (Tmax ≥ 40°C).
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to find the first label layer in the basemap style
function getFirstLabelLayerId(map: maplibregl.Map): string | undefined {
  // Safety check: Ensure map style is fully loaded
  if (!map || !map.getStyle || !map.getStyle()) {
    return undefined;
  }
  
  const style = map.getStyle();
  const layers = style?.layers;
  if (!layers) return undefined;
  
  // Find the first symbol layer (labels/text) in the basemap
  for (const layer of layers) {
    if (layer.type === 'symbol') {
      console.log('[HistoricalTrends] 🏷️  Found first label layer:', layer.id);
      return layer.id;
    }
  }
  
  console.log('[HistoricalTrends] ⚠️  No label layers found in basemap');
  return undefined;
}