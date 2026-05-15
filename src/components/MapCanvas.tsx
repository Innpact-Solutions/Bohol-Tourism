/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🗺️ BOHOL CWIS DASHBOARD - MAP CANVAS COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🔒 STRICT LAYER ORDERING SYSTEM (LOCKED AND ENFORCED)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This component implements a CENTRALIZED, IMMUTABLE layer ordering system.
 * 
 * **CRITICAL: Layer Order is STRICTLY CONTROLLED**
 * 
 * 🔒🔒🔒 LAYER ORDER FROZEN AND LOCKED - DO NOT MODIFY 🔒🔒🔒
 * 
 * All map layers MUST follow this order (bottom to top):
 * 
 *   950: Ward Labels (ABSOLUTE TOP - Always visible above everything) 🔒 LOCKED
 *   900: Basemap Labels (includes ALL Carto text/road names) 🔒 LOCKED
 *   800: Road Safety (IRAP layers)
 *   700: Infrastructure Points (Education, Healthcare, Transport, Amenities)
 *   670: Watershed & Watershed Labels (Above all boundaries) 🔒 LOCKED
 *   660-620: Administrative Boundaries (Municipal, Ward Highlight, Outline, Fill) 🔒 LOCKED
 *   615-614: 3D Buildings & Highlight (Above roads in 3D mode)
 *   610: Road Network (includes basemap roads, National, State, Major, Link) 🔒 LOCKED
 *   600: Waterbody
 *   400: Slum Settlements
 *   330-320: 2D Buildings (Fill, Outline - below roads)
 *   200: Hazard Layers (Heat, Air, Flood, Multi-Hazard)
 *   150: Base Data Layers (Elevation, Green Cover, Built-up) 🔒 LOCKED
 *   100: Basemap Detail (Non-road buildings from basemap) 🔒 LOCKED
 *   0: Basemap Base (Background, water, landuse)
 * 
 * ⚠️ THIS LAYER ORDER IS FINAL AND MUST NOT BE CHANGED WITHOUT EXPLICIT APPROVAL
 * 
 * 🔒🔒🔒 LOCKED BASEMAP LABEL FUNCTIONALITY - DO NOT MODIFY 🔒🔒🔒
 * ═══════════════════════════════════════════════════════════════════════════════
 * The following components ensure ALL Carto basemap labels (city names, road names, 
 * place names, POIs, etc.) appear on top of ALL other layers including GeoServer:
 * 
 * 1. getLayerPriority(layerId, layerType) - 🔒 LOCKED
 *    - layerType parameter is CRITICAL for detecting symbol layers
 *    - Assigns priority 900 to ALL basemap symbol layers
 * 
 * 2. moveBasemapLabelsToTop(map) - 🔒 LOCKED
 *    - Detects and moves ALL basemap symbol layers to top
 *    - Includes comprehensive custom layer exclusion logic
 * 
 * 3. Verification timeout settings - 🔒 LOCKED
 *    - maxAttempts: 30, interval: 200ms (6 seconds total)
 *    - Calibrated for layer reordering performance
 * 
 * ⚠️ DO NOT MODIFY THESE COMPONENTS WITHOUT EXPLICIT CLIENT APPROVAL
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * **HOW TO USE:**
 * 
 * After adding ANY layer, call:
 *   enforceStrictLayerOrder(map);
 * 
 * This automatically positions all layers correctly based on their priority.
 * 
 * **TO ADD A NEW LAYER TYPE:**
 * 
 * 1. Add priority constant to LAYER_ORDER_PRIORITY object
 * 2. Update getLayerPriority() function to recognize new layer ID pattern
 * 3. Add layer ID pattern to isDataLayer() function
 * 4. Call enforceStrictLayerOrder(map) after adding the layer
 * 
 * See /LAYER_ORDER_DOCUMENTATION.md for complete details.
 * 
 * ════════════════════════════════���══════════════════════════════════════════════
 */

import React, { useRef, useState, useEffect } from 'react';
import maplibregl from 'maplibre-gl@5.15.0';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Sector, Scenario, Basemap } from '../App';
import { WardPopup } from './WardPopup';
import { EducationPopup } from './EducationPopup';
import { HealthcarePopup } from './HealthcarePopup';
import { PublicAmenitiesPopup } from './PublicAmenitiesPopup';
import { TransportPopup } from './TransportPopup';

import { PanoramaViewerModal } from './PanoramaViewerModal';
import { PANORAMA_GEOJSON } from '../config/panoramaLocations';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { BuildingPopup } from './BuildingPopup';
import { LocationSearch } from './LocationSearch';
import { PrintLayout } from './PrintLayout';
import { toast } from 'sonner@2.0.3';
import irapLogo from 'figma:asset/067ddfa2e72bc87374b143c2af0e56ab8881d1d4.png';
import { LEGEND_DATA } from '../data/legendDefinitions';
import { 
  Activity,
  Baby,
  Bike,
  BookOpen,
  Box,
  Building2,
  Car,
  Church,
  CircleDot,
  Cross,
  Flame,
  Fuel,
  GitCompare,
  GraduationCap,
  Heart,
  Home,
  Landmark,
  Layers,
  Mail,
  Map as MapIcon,
  MapPin,
  Phone,
  Plane,
  PlayCircle,
  Plus,
  Satellite,
  School,
  ShieldAlert,
  ShoppingBag,
  Store,
  Train,
  TreePine,
  Users,
  Warehouse,
  Wind,
  Zap,
  ZoomIn,
  ZoomOut,
  Download,
  Camera
} from 'lucide-react';
import { 
  educationalInstitutions, 
  healthcareFacilities, 
  publicAmenities, 
  transportInfrastructure,
  roadNetworkSegments,
  roadSafetySegments,
  getRiskColor,
  getRatingColor,
} from './infrastructureData';
import { 
  fetchEducationData, 
  mapCategoryToSubcategoryId, 
  mapSubcategoryIdToCategory 
} from '../utils/educationData';
import {
  fetchHealthcareData,
  mapCategoryToSubcategoryId as mapHealthcareCategoryToSubcategoryId,
  mapSubcategoryIdToCategory as mapHealthcareSubcategoryIdToCategory
} from '../utils/healthcareData';
import {
  fetchPublicAmenitiesData,
  mapCategoryToSubcategoryId as mapPublicAmenitiesCategoryToSubcategoryId,
  mapSubcategoryIdToCategory as mapPublicAmenitiesSubcategoryIdToCategory
} from '../utils/publicAmenitiesData';
import {
  fetchTransportData,
  mapSubcategoryIdToCategory as mapTransportSubcategoryIdToCategory,
  mapCategoryToSubcategoryId as mapTransportCategoryToSubcategoryId
} from '../utils/transportData';
import { 
  getLayerNameForScenario, 
  getWMSTileUrl, 
  geoserverLayers 
} from '../config/geoserverLayers';
import { getEnvironmentalLayerWMSUrl, getEnvironmentalLayerConfig } from '../config/environmentalLayers';

// Helper function to get icon component for each infrastructure type
const getInfrastructureIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    // Educational
    'university': GraduationCap,
    'college': BookOpen,
    'school': School,
    'anganwadi': Baby,
    // Healthcare (actual categories: Hospital, Health Centre, Nursing Home)
    'hospital': Building2,
    'health_centre': Heart,
    'nursing_home': Home,
    // Public Amenities
    'community_centre': Users,
    'culture_centre': Landmark,
    'fire_station': Flame,
    'government_buildings': Building2,
    'parks': TreePine,
    'police_outpost': ShieldAlert,
    'post_office': Mail,
    'telephone_exchange': Phone,
    'haat_market': ShoppingBag,
    'playground': PlayCircle,
    'religious': Church,
    'vending_zones': Store,
    // Transport
    'airport': Plane,
    'bus_terminals': Warehouse,
    'bus_stop': CircleDot,
    'ev_charging': Zap,
    'petrol_pump': Fuel,
    'railway_stations': Train,
  };
  
  return iconMap[type] || MapPin;
};

const getRoadSafetyIcon = (type: string) => {
  const iconMap: { [key: string]: any } = {
    'irap_vehicle': Car,
    'irap_motorcycle': Wind,
    'irap_bicycle': Bike,
    'irap_pedestrian': Users,
  };
  return iconMap[type] || Activity;
};

// Get color for education category
const getEducationCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    'university': '#8B5CF6',
    'college': '#A78BFA',
    'school': '#C4B5FD',
    'anganwadi': '#DDD6FE',
  };
  return colorMap[category] || '#8B5CF6';
};

/**
 * Coordinate transformation utility
 * Detects and converts coordinates from Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)
 * This fixes distorted geometries caused by incorrect coordinate systems from GeoServer
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
  // Bohol is approximately: lng: 124.1, lat: 9.8 in WGS84
  // In Web Mercator this would be: x: ~13,800,000, y: ~1,095,000
  const isWebMercator = Math.abs(x) > 180 || Math.abs(y) > 90;
  
  if (!isWebMercator) {
    console.log('✅ Coordinates already in WGS84 (EPSG:4326), no transformation needed');
    return geojson;
  }
  
  console.warn('⚠️ Detected Web Mercator coordinates (EPSG:3857), converting to WGS84 (EPSG:4326)...');
  
  // Web Mercator to WGS84 transformation
  const mercatorToWGS84 = (x: number, y: number): [number, number] => {
    const lng = (x / 20037508.34) * 180;
    const lat = (Math.atan(Math.exp((y / 20037508.34) * Math.PI)) - Math.PI / 4) * 360 / Math.PI;
    return [lng, lat];
  };
  
  // Transform coordinates recursively
  const transformCoords = (coords: any, depth: number): any => {
    if (depth === 0) {
      // Base case: [x, y] coordinate pair
      return mercatorToWGS84(coords[0], coords[1]);
    } else {
      // Recursive case: array of coordinates
      return coords.map((c: any) => transformCoords(c, depth - 1));
    }
  };
  
  // Transform all features
  const transformed = {
    ...geojson,
    features: geojson.features.map((feature: any) => {
      if (!feature.geometry || !feature.geometry.coordinates) {
        return feature;
      }
      
      let depth = 0;
      const geomType = feature.geometry.type;
      
      if (geomType === 'Point') {
        depth = 0;
      } else if (geomType === 'LineString' || geomType === 'MultiPoint') {
        depth = 1;
      } else if (geomType === 'Polygon' || geomType === 'MultiLineString') {
        depth = 2;
      } else if (geomType === 'MultiPolygon') {
        depth = 3;
      }
      
      return {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: transformCoords(feature.geometry.coordinates, depth)
        }
      };
    })
  };
  
  console.log('✅ Coordinate transformation complete');
  return transformed;
};

interface MapCanvasProps {
  activeSector: Sector;
  activeLayerId?: string;  // Single layer ID (not array)
  scenario?: Scenario;  // Called "scenario" not "activeScenario"
  basemap: Basemap;
  showInfrastructure?: boolean;
  showRoadNetwork?: boolean;
  showWardBoundaries?: boolean;
  selectedWard?: string | null;
  selectedWardId?: string;  // Ward filter from Header dropdown (BrgyID)
  selectedWardName?: string;  // Barangay name filter from Header dropdown (BrgyName)
  selectedLguName?: string;  // LGU/Municipality name filter from Header dropdown (MunName)
  selectedRoadName?: string;  // Road name filter from Header dropdown
  onBasemapChange: (basemap: Basemap) => void;
  onReset: () => void;
  onCompareToggle: () => void;
  onScenarioChange: (scenario: Scenario) => void;
  onWardSelect: (ward: string | null) => void;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  onViewWardDetails?: (wardData: any) => void;
  activeEducationSubLayers: string[];
  activeHealthcareSubLayers: string[];
  activePublicAmenitiesSubLayers: string[];
  activeTransportSubLayers: string[];
  activeInfraLayers: string[];
  activeRoadNetworkIRAPType: string | null;
  activeRoadSafetySubLayers: string[];
  roadSafetyStarRatings?: Record<string, string | null>;
  activeBaseLayers: string[];
  onActiveBaseLayersChange?: (layers: string[]) => void; // New prop for auto-managing base layers
  activeBuildingCategories: string[]; // Active building use categories for filtering
  activeBuildingSubcategories: string[]; // Active building subcategories (use_sub values) for filtering
  isEconomicVulnerabilityActive: boolean; // Economic Vulnerability layer state
  activeBuildingHeightCategories: string[]; // Building Height active categories
  activeBuildingAreaCategories: string[]; // Building Floor Area active categories
  children?: React.ReactNode;
  onInfrastructureCountsUpdate?: (counts: any) => void;
  layerOpacities: Record<string, number>;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
  onRoadNetworkStatsUpdate?: (stats: Record<string, number>) => void;
  onRoadSafetyStatsUpdate?: (stats: Record<string, number>) => void;
  selectedLocation?: { lat: number; lng: number; name: string; geojson?: any } | null;
  onLocationClear?: () => void;
  onLocationSelect?: (location: { lat: number; lng: number; name: string; geojson?: any }) => void;
  currentZoom?: number;
  onZoomChange?: (zoom: number) => void;
  roadBounds?: [number, number, number, number] | null;
  onRoadBoundsChange?: (bounds: [number, number, number, number] | null) => void;
  queryResults?: any[] | null;  // Query results from spatial query (null = no query, [] = 0 results, [...] = results)
  queryResultsLegendKey?: string | null;  // Locked legend key from when query was executed (doesn't change when switching layers)
  selectedRoadNetworkResult?: { category: string; gridcode: string; hazardColor?: string; activeUserType?: string; isStarRating?: boolean } | null;  // Selected road network result for highlighting
  resetMapViewTrigger?: number;  // Trigger to reset map view to default extent
  onLayerLoadingChange?: (isLoading: boolean) => void;  // Callback to notify parent about layer loading state
  onBuildingsLoadingChange?: (isLoading: boolean) => void;  // Callback to notify parent about buildings loading state
  isScenarioRunning?: boolean;  // Set true the moment Run Scenario is clicked — shows overlay immediately
  externalToggle3D?: boolean; // Prop to control 3D mode from tutorial
  triggerBuildingPopup?: [number, number] | null; // Coordinates [lng, lat] to trigger a building popup
  onMapRef?: (map: maplibregl.Map | null) => void; // Callback to expose map instance for external zoom control
  selectedDonutCategory?: string | null; // Selected category from donut chart for map filtering
  onResidentialBuildingsUpdate?: (total: number) => void; // Callback to update total residential buildings (sum of Res_Buildings)
  onTotalAreaUpdate?: (totalKm2: number) => void; // Callback to update total area in km² (sum of Shape_Area)
  onTotalPopulationUpdate?: (totalPop: number) => void; // Callback to update total population (sum of Pop_2024)
  buildingOpacity?: number; // 0–1 opacity for all building layers (controlled by legend slider)
  activeSewerCategories?: string[]; // Sewer feasibility categories for Module 1 building filter
  activeGridSewerCategories?: string[]; // Grid sewer feasibility categories for Module 1 Grid layer
  scenarioGridGeoJSON?: any | null; // Module 1 Scenario Creator result — qualifying grid cells GeoJSON
  scenarioNetworkGids?: number[] | null; // Grid GIDs qualifying for network coverage (buildings mode colouring)
  bufferBldgIds?: number[]; // Building IDs within 120m buffer zone (treated as sewer buildings)
  excludedBldgIds?: number[]; // Building IDs excluded from network despite being in qualifying grid cells
  bufferGeoJSON?: GeoJSON.Geometry | null; // Buffer polygon GeoJSON (dashed outline on map)
  scenarioZones?: Array<{ cluster_id: number; mun: string; network_bldgs: number; grid_cells: number; area_ha: number; tourism_cells: number; centroid_lng: number; centroid_lat: number; bbox_minlng: number; bbox_minlat: number; bbox_maxlng: number; bbox_maxlat: number; brgy_names: string[]; use_type_pct: Array<{ name: string; pct: number }>; buffer_geom_geojson?: any; buffer_area_ha?: number | null; buffer_bldgs?: number }> | null;
  activeFstpLayers?: Array<{ facilityId: number; facilityName: string; enabled: boolean; scenario: 'Normal' | 'Peak'; activeBands: string[] }>;
  showFstpBuildings?: boolean;
  activeFleetClasses?: string[];
  fleetOpacity?: number;
  fstpOpacity?: number;
  activeModule?: string | null;
  scenarioStats?: {
    density_stop?: number;
    gwd_stop?: number;
    gwi_stop?: number;
    fld_stop?: number;
    grid_count?: number;
    area_ha?: number;
    total_bldgs?: number;
  } | null;
}

// ─────────────────────────────────────────────────────────────────
// Module 1 scenario driver labels (mirror of DENSITY_STOPS / GWD_STOPS /
// GWI_STOPS / FLD_STOPS in ModulePanel.tsx). 1-indexed to match the
// density_stop / gwd_stop / gwi_stop / fld_stop values returned from
// the scenario-results API.
// ─────────────────────────────────────────────────────────────────
const MODULE1_STOP_LABELS: Record<'density' | 'gwd' | 'gwi' | 'fld', string[]> = {
  density: ['Low Density', 'Medium Density', 'High Density', 'Very High Density'],
  gwd:     ['Deep (> 10 m)', 'Moderate (5–10 m)', 'Shallow (2–5 m)', 'Very Shallow (< 2 m)'],
  gwi:     ['Low Vulnerability', 'Moderate Vulnerability', 'High Vulnerability', 'Very High Vulnerability'],
  fld:     ['No Flood', 'Low', 'Moderate', 'High'],
};

const riskColors = {
  extreme: '#EF5350',
  high: '#FFA726',
  moderate: '#FFEE58',
  low: '#66BB6A',
};

// Helper function to get text color for better contrast on hazard badges
const getHazardTextColor = (riskLevel: string) => {
  return '#0F172A'; // slate-900 for consistent readability
};

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

export function MapCanvas({
  activeSector,
  activeLayerId,
  scenario,
  basemap,
  showInfrastructure,
  showRoadNetwork,
  showWardBoundaries,
  selectedWard,
  selectedWardId = 'all', // Default to 'all' if not provided
  selectedWardName = 'all', // Default to 'all' if not provided
  selectedLguName = 'all', // Default to 'all' if not provided
  selectedRoadName = 'all', // Default to 'all' if not provided
  onBasemapChange,
  onReset,
  onCompareToggle,
  onScenarioChange,
  onWardSelect,
  drawerOpen,
  onToggleDrawer,
  onViewWardDetails,
  activeEducationSubLayers = [],
  activeHealthcareSubLayers = [],
  activePublicAmenitiesSubLayers = [],
  activeTransportSubLayers = [],
  activeInfraLayers = [],
  activeRoadNetworkIRAPType,
  activeRoadSafetySubLayers = [],
  roadSafetyStarRatings = {},
  activeBaseLayers = [],
  onActiveBaseLayersChange,
  activeBuildingCategories = [],
  activeBuildingSubcategories = [],
  isEconomicVulnerabilityActive = false,
  activeBuildingHeightCategories = [],
  activeBuildingAreaCategories = [],
  children,
  onInfrastructureCountsUpdate,
  layerOpacities,
  onLayerOpacityChange,
  onRoadNetworkStatsUpdate,
  onRoadSafetyStatsUpdate,
  selectedLocation,
  onLocationClear,
  onLocationSelect,
  currentZoom,
  onZoomChange,
  roadBounds,
  onRoadBoundsChange,
  queryResults = null,
  queryResultsLegendKey = null,
  selectedRoadNetworkResult = null,
  resetMapViewTrigger = 0,
  onLayerLoadingChange,
  onBuildingsLoadingChange,
  isScenarioRunning = false,
  externalToggle3D,
  triggerBuildingPopup = null,
  onMapRef,
  selectedDonutCategory = null,
  onResidentialBuildingsUpdate,
  onTotalAreaUpdate,
  onTotalPopulationUpdate,
  buildingOpacity = 0.7,
  activeSewerCategories = [],
  activeGridSewerCategories = [],
  scenarioGridGeoJSON = null,
  scenarioNetworkGids = null,
  bufferBldgIds = [],
  excludedBldgIds = [],
  bufferGeoJSON = null,
  scenarioZones = null,
  activeFstpLayers = [],
  showFstpBuildings = false,
  activeFleetClasses = [],
  fleetOpacity = 0.75,
  fstpOpacity = 0.75,
  activeModule = null,
  scenarioStats = null,
}: MapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  
  // Track previous basemap to optimize switching
  const previousBasemapRef = useRef<Basemap>(basemap);
  
  // Track markers for infrastructure layers
  const markersRef = useRef<maplibregl.Marker[]>([]);
  
  // Track location search marker
  const locationMarkerRef = useRef<maplibregl.Marker | null>(null);
  
  // Track selected building ID for persistent highlight
  const selectedBuildingIdRef = useRef<string | number | null>(null);
  
  // Track tile errors to prevent console spam (using plain object to avoid Map constructor conflict)
  const tileErrorTrackerRef = useRef<Record<string, { count: number; lastLogged: number }>>({});
  const MAX_ERRORS_PER_SOURCE = 3; // Only log first 3 errors per source
  const ERROR_RESET_TIME = 60000; // Reset error count after 1 minute
  
  // Track location search boundary layer ID
  const locationBoundaryLayerIdRef = useRef<string | null>(null);
  
  // Store ward boundaries GeoJSON data for direct access (not relying on rendered features)
  const wardBoundariesDataRef = useRef<any>(null);
  
  // Track ward popup - store it so it persists across layer changes
  const wardPopupRef = useRef<maplibregl.Popup | null>(null);
  
  // Track the selected ward number for highlighting
  const [selectedWardNumber, setSelectedWardNumber] = useState<string | null>(null);
  
  // Zoom indicator state
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Attribution control state
  const [attributionOpen, setAttributionOpen] = useState(true);
  
  // Track which ward was used to build the buildings layer (for filtering)
  const buildingsWardRef = useRef<string | null>(null);

  // Track filter key used to build raster base layers (elevation, builtup_density, built_up) - for forced refresh on filter change
  const rasterLayerFilterRef = useRef<Record<string, string>>({});

  // Serialization counter for addBaseLayers — incremented on each invocation so stale async runs self-abort
  const addBaseLayersCounterRef = useRef(0);
  
  // Track buildings viewport reload handler for cleanup
  const buildingsReloadHandlerRef = useRef<(() => void) | null>(null);
  
  // Track if user manually disabled buildings (to prevent auto-loading)
  const buildingsManuallyDisabledRef = useRef<boolean>(false);
  
  // Track if this is the first time buildings are being loaded (initial load)
  const isInitialBuildingsLoad = useRef<boolean>(true);
  
  // Track which ward was used to build the road network layer (for filtering)
  const roadNetworkWardRef = useRef<string | null>(null);
  
  // Track previous ward selection to detect when user deselects a ward
  const previousWardRef = useRef<string | null>(null);
  
  // Track previous LGU selection to detect when user deselects an LGU
  const previousLguRef = useRef<string | null>(null);
  
  // Track ward point GeoJSON data for re-adding labels after basemap changes
  const wardPointDataRef = useRef<any | null>(null);
  
  // Track previous map state before zooming to infrastructure point (for zoom-back on popup close)
  const previousMapStateRef = useRef<{ center: [number, number]; zoom: number } | null>(null);
  
  // Custom ward popup state (React-based, not MapLibre popup)
  const [wardPopupData, setWardPopupData] = useState<{
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
  
  // Education popup state (React-based, not MapLibre popup)
  const [educationPopupData, setEducationPopupData] = useState<{
    name: string;
    category: string;
    categoryType: string;
    subcategory?: string;
    hhi2025?: string | number;
    airAqi?: string | number;
    floodHazard?: string | number;
    multiHazard?: string | number;
    lng: number;
    lat: number;
    x: number;
    y: number;
  } | null>(null);
  
  // Healthcare popup state (React-based, not MapLibre popup)
  const [healthcarePopupData, setHealthcarePopupData] = useState<{
    name: string;
    category: string;
    categoryType: string;
    subcategory?: string;
    hhi2025?: string | number;
    airAqi?: string | number;
    floodHazard?: string | number;
    multiHazard?: string | number;
    lng: number;
    lat: number;
    x: number;
    y: number;
  } | null>(null);
  
  // Public Amenities popup state (React-based, not MapLibre popup)
  const [publicAmenitiesPopupData, setPublicAmenitiesPopupData] = useState<{
    name: string;
    category: string;
    categoryType: string;
    subcategory?: string;
    hhi2025?: string | number;
    airAqi?: string | number;
    floodHazard?: string | number;
    multiHazard?: string | number;
    lng: number;
    lat: number;
    x: number;
    y: number;
  } | null>(null);
  
  // Transport popup state (React-based, not MapLibre popup)
  const [transportPopupData, setTransportPopupData] = useState<{
    name: string;
    category: string;
    categoryType: string;
    subcategory?: string;
    hhi2025?: string | number;
    airAqi?: string | number;
    floodHazard?: string | number;
    multiHazard?: string | number;
    lng: number;
    lat: number;
    x: number;
    y: number;
  } | null>(null);
  
  // Road Safety popup state (React-based, not MapLibre popup)
  const [roadSafetyPopupData, setRoadSafetyPopupData] = useState<{
    roadName: string;
    section: string;
    distance: string;
    vehicleRating: number;
    motorcycleRating: number;
    bicycleRating: number;
    pedestrianRating: number;
    codingLink?: string;
    lng: number;
    lat: number;
    x: number;
    y: number;
  } | null>(null);
  
  // Store previous map view before zooming to road safety feature
  const [previousRoadSafetyView, setPreviousRoadSafetyView] = useState<{
    center: { lng: number; lat: number };
    zoom: number;
  } | null>(null);
  
  // Ref to store previous road safety view (ensures immediate access)
  const previousRoadSafetyViewRef = useRef<{
    center: { lng: number; lat: number };
    zoom: number;
  } | null>(null);
  
  // Building popup state (React-based, not MapLibre popup)
  const [buildingPopupData, setBuildingPopupData] = useState<{
    useType?: string;
    useSub?: string;
    bldgName?: string;
    barangay?: string;
    municipality?: string;
    floors?: string | number;
    heightM?: string | number;
    areaSqm?: string | number;
    econVuln?: string;
    sewerFeas?: string;
    lng: number;
    lat: number;
    x: number;
    y: number;
  } | null>(null);

  // 360° Panorama viewer state
  const [panoramaViewerData, setPanoramaViewerData] = useState<{
    imageUrl: string;
    title: string;
    description?: string;
    thumbnail?: string;
  } | null>(null);
  // Hover label for panorama pins (React DOM, no MapLibre popup)
  const [panoramaHoverLabel, setPanoramaHoverLabel] = useState<{ x: number; y: number; title: string } | null>(null);

  // Print Layout state
  const [showPrintLayout, setShowPrintLayout] = useState(false);
  const [printMapState, setPrintMapState] = useState<{
    center: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
    visibleLayers: string[];
    basemap: string;
    scenario: string;
    fullStyle?: any; // Complete map style JSON
    sector?: string; // Current sector
    activeLayer?: string; // Active layer name
    wardId?: string; // Selected ward ID
    selectedLguName?: string; // Active LGU filter name
    selectedWardName?: string; // Active barangay filter name
    activeBaseLayers?: string[]; // Active base layers
    activeInfraLayers?: string[]; // Active infrastructure layers
    activeRoadSafetySubLayers?: string[]; // Active road safety sub-layers
    roadNetworkStats?: Record<string, number>; // Road network statistics
    roadSafetyStats?: Record<string, number>; // Road safety statistics
    activeBuildingHeightCategories?: string[]; // Active building height classes
    activeBuildingAreaCategories?: string[]; // Active building floor area classes
  } | null>(null);
  
  // Track road network and safety statistics locally
  const [roadNetworkStats, setRoadNetworkStats] = useState<Record<string, number>>({});
  const [roadSafetyStats, setRoadSafetyStats] = useState<Record<string, number>>({});
  
  const [mapReady, setMapReady] = useState(false);
  const [basemapSwitcherOpen, setBasemapSwitcherOpen] = useState(false);
  const [styleLoadCounter, setStyleLoadCounter] = useState(0); // Track basemap style reloads
  const [is3DMode, setIs3DMode] = useState(false); // Track 3D mode state
  const is3DModeRef = useRef(false); // Always-current mirror of is3DMode for use in async / layer-creation callbacks
  const buildingsWasOnBefore3DRef = useRef<boolean>(false); // Remember whether the user had the buildings base layer ON before entering 3D, so we can restore that state on exit.
  const buildingOpacityRef = useRef<number>(0.7); // Always-current building opacity for use in layer-creation callbacks
  const scenarioNetworkGidsRef = useRef<number[] | null>(null); // Always-current mirror of scenarioNetworkGids for buildings load callback
  const bufferBldgIdsRef = useRef<number[]>([]); // Always-current mirror of bufferBldgIds for buildings load callback
  const excludedBldgIdsRef = useRef<number[]>([]); // Always-current mirror of excludedBldgIds for buildings load callback
  const activeSewerCategoriesRef = useRef<string[]>([]); // Always-current mirror of activeSewerCategories for buildings load callback
  const layerOpacitiesRef = useRef<Record<string, number>>({}); // Always-current mirror of layerOpacities for buildings load callback
  const prevBufferIdsRef = useRef<number[]>([]); // Tracks previously applied inBuffer feature states so they can be cleared
  const [isLayerLoading, setIsLayerLoading] = useState(false); // Track layer loading state
  const [isBuildingsLoading, setIsBuildingsLoading] = useState(false); // Track buildings loading state
  const [isLoadingLayers, setIsLoadingLayers] = useState(true); // Track all layers loading from start
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); // Track if initial loading phase is done
  const [buildingsInitialLoadDone, setBuildingsInitialLoadDone] = useState(false); // Track if buildings completed initial load
  const module3LoadingCountRef = useRef(0); // counts concurrent Module 3 fetch ops (service area + building IDs)

  // Cycling messages for Module 1 (sewer scenario) loader overlay
  const SCENARIO_MAP_MSGS = [
    'Initialising scenario parameters…',
    'Scanning built-up density grid cells…',
    'Applying groundwater depth thresholds…',
    'Checking ground infiltration risk scores…',
    'Evaluating flood hazard classifications…',
    'Identifying high tourism priority zones…',
    'Running gap-fill cluster analysis…',
    'Qualifying sewer network grid cells…',
    'Computing 120 m buffer corridor…',
    'Tagging bulk wastewater generators…',
    'Classifying buildings by sewer type…',
    'Compiling sewer coverage statistics…',
  ];
  const [scenarioMsgIdx, setScenarioMsgIdx] = useState(0);
  const isSewerLoading = (isScenarioRunning || isLayerLoading || isBuildingsLoading) && activeSewerCategories.length > 0 || isScenarioRunning;
  useEffect(() => {
    if (!isSewerLoading) { setScenarioMsgIdx(0); return; }
    const iv = setInterval(() => setScenarioMsgIdx((i) => (i + 1) % SCENARIO_MAP_MSGS.length), 900);
    return () => clearInterval(iv);
  }, [isSewerLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent when layer loading state changes
  useEffect(() => {
    if (onLayerLoadingChange) {
      onLayerLoadingChange(isLayerLoading);
    }
  }, [isLayerLoading, onLayerLoadingChange]);

  // Notify parent when buildings loading state changes
  useEffect(() => {
    if (onBuildingsLoadingChange) {
      onBuildingsLoadingChange(isBuildingsLoading);
    }
  }, [isBuildingsLoading, onBuildingsLoadingChange]);

  // Hide initial loading indicator when buildings complete their initial load
  useEffect(() => {
    if (buildingsInitialLoadDone && isLoadingLayers) {
      console.log('✅ Buildings initial load complete - hiding initial loading indicator');
      setIsLoadingLayers(false);
      setInitialLoadComplete(true);
    }
  }, [buildingsInitialLoadDone, isLoadingLayers]);

  // Safety timeout: If initial loading takes too long (e.g., buildings not in activeBaseLayers), hide after 5 seconds
  useEffect(() => {
    if (mapReady && isLoadingLayers) {
      const timeoutId = setTimeout(() => {
        if (isLoadingLayers) {
          console.log('⏱️ Safety timeout - hiding initial loading indicator (buildings may not be in active layers)');
          setIsLoadingLayers(false);
          setInitialLoadComplete(true);
        }
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [mapReady, isLoadingLayers]);

  // Debug: Log loading states
  useEffect(() => {
    console.log('📊 Loading States:', {
      isLoadingLayers,
      isBuildingsLoading,
      isLayerLoading,
      initialLoadComplete,
      buildingsInitialLoadDone,
      shouldShowInitialLoader: isLoadingLayers || (isBuildingsLoading && !initialLoadComplete),
      shouldShowBlockingLoader: (isLayerLoading || isBuildingsLoading) && initialLoadComplete
    });
  }, [isLoadingLayers, isBuildingsLoading, isLayerLoading, initialLoadComplete, buildingsInitialLoadDone]);

  // Log selectedWardId to debug
  useEffect(() => {
    console.log('🔍 MapCanvas received selectedWardId:', selectedWardId, '| mapReady:', mapReady, '| mapExists:', !!mapRef.current);
  }, [selectedWardId, mapReady]);

  // Helper function to reset map to study area extent
  const resetToStudyAreaExtent = (map: any, duration: number = 1500) => {
    const barangayBounds = (map as any)._barangayBounds;
    
    if (barangayBounds) {
      console.log('📍 Resetting to Barangay_Boundary extent (Tagbilaran City, Dauis, Panglao)');
      map.fitBounds(barangayBounds, {
        padding: 80,
        duration: duration,
        pitch: 0,
        bearing: 0,
        essential: true
      });
    } else {
      console.warn('⚠️ Barangay bounds not available for reset');
    }
  };


  // Load custom icons for education markers - modern, small, matching left panel (returns Promise)
  const loadEducationIcons = (map: maplibregl.Map): Promise<void> => {
    const icons = [
      { 
        name: 'edu-university', 
        color: '#8B5CF6', // Same purple as left panel
        // GraduationCap - Lucide icon
        icon: `<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>` 
      },
      { 
        name: 'edu-college', 
        color: '#8B5CF6', // Same purple as left panel
        // BookOpen - Lucide icon
        icon: `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>` 
      },
      { 
        name: 'edu-school', 
        color: '#8B5CF6', // Same purple as left panel
        // School - Lucide icon
        icon: `<path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/>` 
      },
      { 
        name: 'edu-anganwadi', 
        color: '#8B5CF6', // Same purple as left panel
        // Baby - Lucide icon
        icon: `<path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/>` 
      }
    ];

    // Return a Promise that resolves when all icons are loaded
    return Promise.all(
      icons.map(iconData => {
        return new Promise<void>((resolve, reject) => {
          const size = 28; // Slightly larger size for better visibility
          const svg = `
            <svg width="${size}" height="${size}" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="13" fill="${iconData.color}" opacity="1"/>
              <circle cx="14" cy="14" r="13" fill="none" stroke="white" stroke-width="2" opacity="0.8"/>
              <g fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(5, 5) scale(0.75)">
                ${iconData.icon}
              </g>
            </svg>
          `;
          
          const img = new Image(size, size);
          img.onload = () => {
            if (map && map.hasImage && !map.hasImage(iconData.name)) {
              map.addImage(iconData.name, img);
            }
            resolve();
          };
          img.onerror = () => {
            console.error(`❌ Failed to load education icon: ${iconData.name}`);
            reject(new Error(`Failed to load icon: ${iconData.name}`));
          };
          img.src = 'data:image/svg+xml;base64,' + btoa(svg);
        });
      })
    ).then(() => {
      console.log('✅ All education icons loaded');
    });
  };

  // Load custom icons for healthcare markers (returns Promise)
  const loadHealthcareIcons = (map: maplibregl.Map): Promise<void> => {
    const icons = [
      { 
        name: 'health-hospital', 
        color: '#EF4444', // Red for healthcare
        // Hospital - Cross icon
        icon: `<path d="M12 6v12"/><path d="M6 12h12"/>` 
      },
      { 
        name: 'health-clinic', 
        color: '#EF4444',
        // Building2 - Lucide icon
        icon: `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>` 
      },
      { 
        name: 'health-phc', 
        color: '#EF4444',
        // Stethoscope - Lucide icon
        icon: `<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>` 
      },
      { 
        name: 'health-center', 
        color: '#EF4444',
        // Heart - Lucide icon
        icon: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>` 
      },
      { 
        name: 'health-dispensary', 
        color: '#EF4444',
        // Pill - Lucide icon
        icon: `<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>` 
      }
    ];

    // Return a Promise that resolves when all icons are loaded
    return Promise.all(
      icons.map(iconData => {
        return new Promise<void>((resolve, reject) => {
          const size = 28; // Slightly larger size for better visibility
          const svg = `
            <svg width="${size}" height="${size}" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="13" fill="${iconData.color}" opacity="1"/>
              <circle cx="14" cy="14" r="13" fill="none" stroke="white" stroke-width="2" opacity="0.8"/>
              <g fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(5, 5) scale(0.75)">
                ${iconData.icon}
              </g>
            </svg>
          `;
          
          const img = new Image(size, size);
          img.onload = () => {
            if (map && map.hasImage && !map.hasImage(iconData.name)) {
              map.addImage(iconData.name, img);
            }
            resolve();
          };
          img.onerror = () => {
            console.error(`❌ Failed to load healthcare icon: ${iconData.name}`);
            reject(new Error(`Failed to load icon: ${iconData.name}`));
          };
          img.src = 'data:image/svg+xml;base64,' + btoa(svg);
        });
      })
    ).then(() => {
      console.log('✅ All healthcare icons loaded');
    });
  };

  // Load custom icons for public amenities markers (returns Promise)
  const loadPublicAmenitiesIcons = (map: maplibregl.Map): Promise<void> => {
    const icons = [
      { 
        name: 'amenity-community', 
        color: '#06B6D4', // Cyan for public amenities
        // Users icon
        icon: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>` 
      },
      { 
        name: 'amenity-culture', 
        color: '#06B6D4',
        // Landmark icon
        icon: `<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>` 
      },
      { 
        name: 'amenity-fire', 
        color: '#06B6D4',
        // Flame icon
        icon: `<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>` 
      },
      { 
        name: 'amenity-government', 
        color: '#06B6D4',
        // Building2 icon
        icon: `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>` 
      },
      { 
        name: 'amenity-park', 
        color: '#06B6D4',
        // TreePine icon
        icon: `<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/>` 
      },
      { 
        name: 'amenity-police', 
        color: '#06B6D4',
        // ShieldAlert icon
        icon: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="M12 8v4"/><path d="M12 16h.01"/>` 
      },
      { 
        name: 'amenity-post', 
        color: '#06B6D4',
        // Mail icon
        icon: `<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>` 
      },
      { 
        name: 'amenity-market', 
        color: '#06B6D4',
        // ShoppingBag icon
        icon: `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>` 
      },
      { 
        name: 'amenity-default', 
        color: '#06B6D4',
        // MapPin icon
        icon: `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>` 
      }
    ];

    // Return a Promise that resolves when all icons are loaded
    return Promise.all(
      icons.map(iconData => {
        return new Promise<void>((resolve, reject) => {
          const size = 28; // Slightly larger size for better visibility
          const svg = `
            <svg width="${size}" height="${size}" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="13" fill="${iconData.color}" opacity="1"/>
              <circle cx="14" cy="14" r="13" fill="none" stroke="white" stroke-width="2" opacity="0.8"/>
              <g fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(5, 5) scale(0.75)">
                ${iconData.icon}
              </g>
            </svg>
          `;
          
          const img = new Image(size, size);
          img.onload = () => {
            if (map && map.hasImage && !map.hasImage(iconData.name)) {
              map.addImage(iconData.name, img);
            }
            resolve();
          };
          img.onerror = () => {
            console.error(`❌ Failed to load public amenities icon: ${iconData.name}`);
            reject(new Error(`Failed to load icon: ${iconData.name}`));
          };
          img.src = 'data:image/svg+xml;base64,' + btoa(svg);
        });
      })
    ).then(() => {
      console.log('✅ All public amenities icons loaded');
    });
  };

  // Load custom icons for transport markers (returns Promise)
  const loadTransportIcons = (map: maplibregl.Map): Promise<void> => {
    const icons = [
      { 
        name: 'transport-airport', 
        color: '#EA580C',
        icon: '<path d="M17.8 19.2 16 11l3.5-3.5C20 7 21 6 21 4.5c0-1.4-1.4-2.5-2.9-2.5C16.8 2 15.8 3 15.3 3.5L11.8 7 3.6 5.2C2.7 5 1.4 5 1.2 5.8c-.2.8.2 1.8.9 2.3l5.7 3.4-2.4 2.4-2.6-.6C2 13 1.1 13.1.9 13.9s0 1.3.8 1.5l3.2.9.9 3.2c.2.8.7.8 1.5.6.8-.2.9-1.1.6-1.9l-.6-2.6 2.4-2.4 3.4 5.7c.5.7 1.5 1.1 2.3.9.8-.2.8-1.5.6-2.4z"/>'
      },
      { 
        name: 'transport-bus', 
        color: '#FB923C',
        icon: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/>'
      },
      { 
        name: 'transport-station', 
        color: '#FB923C',
        icon: '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="M8 19l-2 3"/><path d="M18 22l-2-3"/><path d="M8 15h0"/><path d="M16 15h0"/>'
      },
      { 
        name: 'transport-ev', 
        color: '#FDBA74',
        icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'
      },
      { 
        name: 'transport-fuel', 
        color: '#FDBA74',
        icon: '<path d="M3 2h10v16H3z"/><path d="M7 13V8"/><path d="M16 4l4 4v8.5a2.5 2.5 0 0 1-5 0V10h-1"/>'
      },
    ];

    console.log('🔄 Starting to load transport icons...');
    
    return Promise.all(
      icons.map(iconData => {
        return new Promise<void>((resolve, reject) => {
          const size = 28; // Slightly larger size for better visibility
          const svg = `
            <svg width="${size}" height="${size}" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="13" fill="${iconData.color}" opacity="1"/>
              <circle cx="14" cy="14" r="13" fill="none" stroke="white" stroke-width="2" opacity="0.8"/>
              <g fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(5, 5) scale(0.75)">
                ${iconData.icon}
              </g>
            </svg>
          `;
          
          const img = new Image(size, size);
          img.onload = () => {
            if (map && map.hasImage && !map.hasImage(iconData.name)) {
              map.addImage(iconData.name, img);
              console.log(`✅ Transport icon loaded: ${iconData.name}`);
            } else if (map && map.hasImage) {
              console.log(`ℹ️ Transport icon already exists: ${iconData.name}`);
            }
            resolve();
          };
          img.onerror = (error) => {
            console.error(`❌ Failed to load transport icon: ${iconData.name}`, error);
            reject(new Error(`Failed to load icon: ${iconData.name}`));
          };
          img.src = 'data:image/svg+xml;base64,' + btoa(svg);
        });
      })
    ).then(() => {
      console.log('✅ All transport icons loaded successfully');
    }).catch((error) => {
      console.error('❌ Error loading transport icons:', error);
      throw error;
    });
  };

  // Prevent any scroll in embedded/published views
  useEffect(() => {
    const preventScroll = (e: Event) => {
      e.preventDefault();
      window.scrollTo(0, 0);
    };
    
    window.addEventListener('scroll', preventScroll, { passive: false });
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('scroll', preventScroll);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create map instance
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getBasemapStyle(basemap),
      center: [122.5, 12.0],  // Philippines country center - will animate to barangay extent
      zoom: 5.5,  // Show full Philippines country initially (Luzon to Mindanao)
      pitch: 0,
      bearing: 0,
      attributionControl: false, // Disable default attribution to add custom one
      pitchWithRotate: true, // Enable 3D pitch with rotation
      dragRotate: true, // Enable map rotation
      maxPitch: 60, // Maximum pitch angle for 3D view
      preserveDrawingBuffer: true, // Enable canvas capture for map export
    });

    // Expose map instance globally for debugging (DEV only)
    if (typeof window !== 'undefined') {
      (window as any).__map = map;
    }

    // Custom attribution is now handled via React component in the JSX (see return statement)
    
    // Add data-basemap attribute to map container for CSS styling
    if (mapContainerRef.current) {
      mapContainerRef.current.setAttribute('data-basemap', basemap);
    }

    // Add scale control only
    map.addControl(new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left');

    // Track zoom changes
    map.on('zoom', () => {
      const zoom = map.getZoom();
      if (onZoomChange) {
        onZoomChange(Math.round(zoom * 10) / 10); // Round to 1 decimal place
      }
      
      // Show zoom indicator
      setShowZoomIndicator(true);
      
      // Clear existing timeout
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current);
      }
      
      // Hide after 2.5 seconds
      zoomIndicatorTimeoutRef.current = setTimeout(() => {
        setShowZoomIndicator(false);
      }, 2500);
    });

    // Wait for initial style to load before marking map as ready
    map.on('load', async () => {
      console.log('🎯 Map fully loaded and ready');
      
      // Fetch Barangay_Boundary extent and fit map to study area (Tagbilaran City, Dauis, Panglao)
      console.log('📡 Fetching Barangay_Boundary extent from GeoServer...');
      
      const BARANGAY_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Barangay_Boundary&outputFormat=application/json&srsName=EPSG:4326';

      // Fallback bounds for Tagbilaran City, Dauis & Panglao (Bohol, Philippines)
      const FALLBACK_BOUNDS: [[number, number], [number, number]] = [[123.7600, 9.5300], [124.0500, 9.7500]];

      let barangayBounds: [[number, number], [number, number]] = FALLBACK_BOUNDS;

      try {
        const response = await fetchWithTimeout(BARANGAY_WFS_URL, { timeout: 30000 });
        const geojson = await response.json();

        // Calculate bounding box from Barangay_Boundary features
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

        if (isFinite(minLng) && isFinite(minLat) && isFinite(maxLng) && isFinite(maxLat)) {
          barangayBounds = [[minLng, minLat], [maxLng, maxLat]];
          console.log('✅ Barangay_Boundary extent calculated:', barangayBounds);
        } else {
          console.warn('⚠️ Could not parse bounds from GeoServer response, using fallback bounds');
        }
      } catch (err) {
        console.warn('⚠️ Barangay_Boundary fetch failed (using fallback bounds for Bohol study area):', err);
      }

      console.log('   Study area: Tagbilaran City, Dauis, Panglao barangays');
      
      // Wait 2 seconds to show full Philippines country before animating to study area
      console.log('⏸️ Showing full Philippines country view for 2 seconds before zooming to study area...');
      setTimeout(() => {
        // Fit map to actual barangay boundary extent with smooth animation
        console.log('🔒 ANIMATING MAP TO BARANGAY EXTENT (Tagbilaran City, Dauis, Panglao)');
        map.fitBounds(barangayBounds, {
          padding: 80,  // 80px padding around bounds
          duration: 3500,  // 3.5 second smooth, slower animation from Philippines to study area
          maxZoom: 14,   // Prevent excessive zoom-in on small areas
          easing: (t) => t * (2 - t) // Ease out quad for smooth deceleration
        });
        console.log('📍 Map animating to Barangay_Boundary extent - SMOOTH ZOOM');
        
        // Clear initial loading state after animation completes (2s delay + 3.5s animation = 5.5s total)
        setTimeout(() => {
          console.log('✅ Initial map animation complete - layers will continue loading');
        }, 3600); // Slightly longer than animation duration to ensure completion
      }, 2000); // 2 second delay to show full Philippines country view
      
      // Store bounds in map instance for later use (reset functions, etc.)
      (map as any)._barangayBounds = barangayBounds;
      (map as any)._barangayBoundsSet = true;  // Flag to prevent accidental overrides
      
      // Set initial zoom (after fitBounds)
      if (onZoomChange) {
        onZoomChange(map.getZoom());
      }
      
      // Load custom icons for education, healthcare, public amenities, and transport markers (wait for all to complete)
      console.log('🔄 Loading all infrastructure icons...');
      await Promise.all([
        loadEducationIcons(map),
        loadHealthcareIcons(map),
        loadPublicAmenitiesIcons(map),
        loadTransportIcons(map)
      ]);
      console.log('✅ All infrastructure icons loaded');
      
      // Wait for style to be fully loaded before adding layers and marking ready
      map.once('idle', () => {
        console.log('🎨 Map style fully loaded and idle');
        
        // Hide building layers from the basemap (Carto basemaps have building layers we want to hide)
        hideBasemapBuildings(map);
        
        // Normalize city name text case (convert ALL CAPS to Title Case)
        normalizeCityNameCase(map);
        
        // Add Ward Boundary layer as permanent overlay (always visible, always on top)
        addWardBoundaryLayer(map, wardPopupRef, setWardPopupData, wardBoundariesDataRef, setEducationPopupData, setHealthcarePopupData, setSelectedWardNumber, onLocationClear, wardPointDataRef, selectedLguName, selectedWardId, setIsLayerLoading, onResidentialBuildingsUpdate, onTotalAreaUpdate, onTotalPopulationUpdate);
        
        // Add Municipal Boundary layer (above ward boundary)
        addMunicipalBoundaryLayer(map, selectedLguName, setIsLayerLoading);
        
        // Now mark map as ready so layers can be added
        setMapReady(true);
        
        // Don't hide loading indicator yet - wait for buildings to load
        // The loading indicator will be hidden when buildings complete their initial load
        console.log('⏳ Map ready - waiting for default layers (buildings, boundaries) to complete initial load...');
      });
    });

    // Store map instance
    mapRef.current = map;

    // Expose map ref to parent
    if (onMapRef) {
      onMapRef(map);
    }

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        // Remove buildings viewport reload event listener before destroying map
        if (buildingsReloadHandlerRef.current) {
          mapRef.current.off('moveend', buildingsReloadHandlerRef.current);
          buildingsReloadHandlerRef.current = null;
          console.log('🗑️ Removed buildings viewport reload handler on cleanup');
        }
        
        mapRef.current.remove();
        mapRef.current = null;
        
        // Notify parent of cleanup
        if (onMapRef) {
          onMapRef(null);
        }
      }
    };
  }, []);

  // Handle map resize when container dimensions change
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    // Also trigger an initial resize after a short delay (fixes race condition on first load)
    const initialResizeTimer = setTimeout(() => {
      if (map && map.resize) {
        map.resize();
        console.log('✅ Initial map resize completed');
      }
    }, 100);
    
    // Cleanup
    return () => {
      clearTimeout(initialResizeTimer);
    };
  }, [mapReady]);

  // Handle map resize when drawer opens/closes - trigger AFTER animation completes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;
    
    // Wait for drawer animation to complete (300ms) before resizing
    const resizeTimer = setTimeout(() => {
      if (map && map.resize) {
        map.resize();
        console.log('🔄 Map resized after drawer animation');
      }
    }, 350); // Wait for animation + small buffer
    
    return () => {
      clearTimeout(resizeTimer);
    };
  }, [drawerOpen, mapReady]);

  // ── 360° Panorama Pins Layer ────────────────────────────────────────
  // Adds a GeoJSON layer of Google-Maps-style teardrop pins, each showing
  // a circular thumbnail of the actual image. Opens PanoramaViewerModal on click.
  // Pins stay upright (viewport-aligned) in both 2D and 3D map modes.
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    const SOURCE_ID       = 'panorama-pins-source';
    const LAYER_ID        = 'panorama-pins-layer';
    const SHADOW_LAYER_ID = 'panorama-pins-shadow';

    const BASE_ICON_SIZE = ['interpolate', ['exponential', 1.5], ['zoom'],
      8, 0.25, 11, 0.45, 13, 0.65, 15, 0.85, 17, 1.1, 19, 1.4,
    ] as unknown as maplibregl.ExpressionSpecification;

    function hoverIconSize(id: string): maplibregl.ExpressionSpecification {
      return ['case', ['==', ['get', 'id'], id],
        ['interpolate', ['exponential', 1.5], ['zoom'],
          8, 0.325, 11, 0.585, 13, 0.845, 15, 1.105, 17, 1.43, 19, 1.82,
        ],
        BASE_ICON_SIZE,
      ] as unknown as maplibregl.ExpressionSpecification;
    }

    // ── Draw a Google Maps-style teardrop pin with a circular thumbnail ──
    function drawPinIcon(thumbImg: HTMLImageElement | null): ImageData {
      const W = 80, H = 108;
      const canvas = document.createElement('canvas');
      canvas.width  = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      const cx   = W / 2;
      const R    = 34;        // circle radius
      const cy   = R + 6;     // circle centre Y (6px top padding)
      const tipY = H - 8;     // tipY of the teardrop point
      const stemW = R * 0.28; // half-width of the stem

      // ── Drop shadow ─────────────────────────────────────────────
      ctx.save();
      ctx.shadowColor   = 'rgba(0,0,0,0.50)';
      ctx.shadowBlur    = 12;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 5;

      // ── Pin head (circle) ────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = '#1E40AF';
      ctx.fill();

      // ── Teardrop stem (two bezier curves to tip) ─────────────────
      ctx.beginPath();
      ctx.moveTo(cx - stemW, cy + R * 0.75);
      ctx.bezierCurveTo(cx - stemW, cy + R + 14, cx - 5, tipY - 8, cx, tipY);
      ctx.bezierCurveTo(cx + 5,     tipY - 8, cx + stemW, cy + R + 14, cx + stemW, cy + R * 0.75);
      ctx.closePath();
      ctx.fillStyle = '#1E40AF';
      ctx.fill();
      ctx.restore();

      // ── Circular thumbnail clip ──────────────────────────────────
      const imgR = R - 5;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, imgR, 0, Math.PI * 2);
      ctx.clip();
      if (thumbImg) {
        const scale = Math.max((imgR * 2) / thumbImg.naturalWidth, (imgR * 2) / thumbImg.naturalHeight);
        const sw = thumbImg.naturalWidth  * scale;
        const sh = thumbImg.naturalHeight * scale;
        ctx.drawImage(thumbImg, cx - sw / 2, cy - sh / 2, sw, sh);
      } else {
        // Gradient fallback with a camera icon
        const grad = ctx.createLinearGradient(cx, cy - imgR, cx, cy + imgR);
        grad.addColorStop(0, '#60A5FA');
        grad.addColorStop(1, '#1D4ED8');
        ctx.fillStyle = grad;
        ctx.fillRect(cx - imgR, cy - imgR, imgR * 2, imgR * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(cx - 12, cy - 7, 24, 14);
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#1D4ED8';
        ctx.fill();
      }
      ctx.restore();

      // ── White border ring ────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(cx, cy, R - 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth   = 4;
      ctx.stroke();

      return ctx.getImageData(0, 0, W, H);
    }

    // ── Enrich GeoJSON features with a per-feature iconId ────────────
    const features = PANORAMA_GEOJSON.features;
    const enrichedFeatures = features.map(f => ({
      ...f,
      properties: { ...f.properties, iconId: `panorama-pin-icon-${f.properties.id}` },
    }));
    const enrichedGeoJSON = { ...PANORAMA_GEOJSON, features: enrichedFeatures };

    // ── Add source + layers (called once all icons are registered) ───
    function tryAddLayers() {
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, { type: 'geojson', data: enrichedGeoJSON });
      }

      // Ground shadow ring – lies flat on the map surface in 3D mode
      if (!map.getLayer(SHADOW_LAYER_ID)) {
        map.addLayer({
          id   : SHADOW_LAYER_ID,
          type : 'circle',
          source: SOURCE_ID,
          layout: {
            'visibility': activeBaseLayers.includes('panorama_images') ? 'visible' : 'none',
          },
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 9, 17, 13],
            'circle-color': 'rgba(0,0,0,0)',
            'circle-stroke-width': 2,
            'circle-stroke-color': 'rgba(30,64,175,0.45)',
            'circle-pitch-alignment': 'map',
            'circle-blur': 0.5,
          },
        });
      }

      // Symbol layer – stays upright (billboard) in both 2D and 3D
      if (!map.getLayer(LAYER_ID)) {
        map.addLayer({
          id    : LAYER_ID,
          type  : 'symbol',
          source: SOURCE_ID,
          layout: {
            'visibility'              : activeBaseLayers.includes('panorama_images') ? 'visible' : 'none',
            'icon-image'              : ['get', 'iconId'],
            'icon-size'               : BASE_ICON_SIZE,
            'icon-allow-overlap'      : true,
            'icon-anchor'             : 'bottom',
            'icon-pitch-alignment'    : 'viewport',
            'icon-rotation-alignment' : 'viewport',
          },
          paint: {
            'icon-opacity': 1,
          },
        });

        enforceStrictLayerOrder(map);
      }

      // ── Hover: enlarge only the hovered pin + React DOM tooltip ──
      let hoveredPinId: string | null = null;

      map.on('mousemove', LAYER_ID, (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties as { id: string; title: string };

        // Enlarge only the hovered pin — single layer, case expression
        if (props.id !== hoveredPinId) {
          hoveredPinId = props.id;
          if (map.getLayer(LAYER_ID)) {
            map.setLayoutProperty(LAYER_ID, 'icon-size', hoverIconSize(hoveredPinId));
          }
        }

        // Flicker-free label: React DOM div positioned at cursor
        setPanoramaHoverLabel({ x: e.point.x, y: e.point.y, title: props.title });
      });

      map.on('mouseleave', LAYER_ID, () => {
        map.getCanvas().style.cursor = '';
        hoveredPinId = null;
        if (map.getLayer(LAYER_ID)) {
          map.setLayoutProperty(LAYER_ID, 'icon-size', BASE_ICON_SIZE);
        }
        setPanoramaHoverLabel(null);
      });

      // ── Click → open 360° viewer ─────────────────────────────────
      map.on('click', LAYER_ID, (e) => {
        e.preventDefault();
        if (e.originalEvent) e.originalEvent.stopPropagation();
        if (!e.features || e.features.length === 0) return;
        const props = e.features[0].properties as {
          id: string; title: string; description: string;
          imageUrl: string; thumbnail: string | null;
        };
        setWardPopupData(null);
        setBuildingPopupData(null);
        setEducationPopupData(null);
        setHealthcarePopupData(null);
        setPublicAmenitiesPopupData(null);
        setTransportPopupData(null);
        setRoadSafetyPopupData(null);
        setPanoramaViewerData({
          imageUrl    : props.imageUrl,
          title       : props.title,
          description : props.description || undefined,
          thumbnail   : props.thumbnail ?? undefined,
        });
      });
    }

    // ── Load each thumbnail → draw pin → register image → add layers ─
    if (features.length === 0) return;

    let loaded = 0;
    const total = features.length;

    features.forEach((feature) => {
      const id     = feature.properties.id;
      const iconId = `panorama-pin-icon-${id}`;
      const thumb  = feature.properties.thumbnail as string | null;

      if (map.hasImage(iconId)) {
        if (++loaded === total) tryAddLayers();
        return;
      }

      const registerIcon = (img: HTMLImageElement | null) => {
        const imageData = drawPinIcon(img);
        if (!map.hasImage(iconId)) map.addImage(iconId, imageData, { pixelRatio: 2 });
        if (++loaded === total) tryAddLayers();
      };

      if (thumb) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload  = () => registerIcon(img);
        img.onerror = () => registerIcon(null);
        img.src     = thumb;
      } else {
        registerIcon(null);
      }
    });

    return () => { /* map.remove() handles cleanup */ };
  }, [mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update basemap when changed — SURGICAL in-place swap only.
  // We replace just the basemap sources/layers underneath the thematic stack so
  // all data layers (hazards, buildings, FSTP bands, scenario grids, etc.) stay
  // mounted and on top. No setStyle(), no reload, no re-fetching of data layers.
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    const map = mapRef.current;
    const previousBasemap = previousBasemapRef.current;
    if (previousBasemap === basemap) return;

    console.log(`🗺️ BASEMAP SWITCH: ${previousBasemap} → ${basemap} (surgical swap, data layers preserved)`);
    switchBasemap(map, basemap, previousBasemap, wardPointDataRef);

    previousBasemapRef.current = basemap;

    if (mapContainerRef.current) {
      mapContainerRef.current.setAttribute('data-basemap', basemap);
    }
  }, [basemap, mapReady]);

  // Update popup positions when map moves (pan/zoom) - keeps popups attached to geographic locations
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;
    
    const updatePopupPositions = () => {
      // Update ward popup position
      if (wardPopupData) {
        const point = map.project([wardPopupData.lng, wardPopupData.lat]);
        setWardPopupData(prev => prev ? { ...prev, x: point.x, y: point.y } : null);
      }
      
      // Update education popup position
      if (educationPopupData) {
        const point = map.project([educationPopupData.lng, educationPopupData.lat]);
        setEducationPopupData(prev => prev ? { ...prev, x: point.x, y: point.y } : null);
      }
      
      // Update healthcare popup position
      if (healthcarePopupData) {
        const point = map.project([healthcarePopupData.lng, healthcarePopupData.lat]);
        setHealthcarePopupData(prev => prev ? { ...prev, x: point.x, y: point.y } : null);
      }
      
      // Update public amenities popup position
      if (publicAmenitiesPopupData) {
        const point = map.project([publicAmenitiesPopupData.lng, publicAmenitiesPopupData.lat]);
        setPublicAmenitiesPopupData(prev => prev ? { ...prev, x: point.x, y: point.y } : null);
      }
      
      // Update transport popup position
      if (transportPopupData) {
        const point = map.project([transportPopupData.lng, transportPopupData.lat]);
        setTransportPopupData(prev => prev ? { ...prev, x: point.x, y: point.y } : null);
      }
      
      // Update road safety popup position
      if (roadSafetyPopupData) {
        const point = map.project([roadSafetyPopupData.lng, roadSafetyPopupData.lat]);
        setRoadSafetyPopupData(prev => prev ? { ...prev, x: point.x, y: point.y } : null);
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
  }, [mapReady, wardPopupData, educationPopupData, healthcarePopupData, publicAmenitiesPopupData, transportPopupData, roadSafetyPopupData, buildingPopupData]);

  // Close popups when clicking outside - attach to map click event
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;
    
    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      // Define all possible interactive layers
      const allInteractiveLayers = [
        'education-clusters',
        'education-unclustered-point',
        'healthcare-clusters',
        'healthcare-unclustered-point',
        'public-amenities-clusters',
        'public-amenities-unclustered-point',
        'transport-clusters',
        'transport-unclustered-point',
        // Barangay (ward) fill/line intentionally excluded — barangay selection
        // and popup are disabled in the Tourism dashboard to avoid conflicting
        // with tourism point popups.
        'irap_vehicle-click',
        'irap_motorcycle-click',
        'irap_bicycle-click',
        'irap_pedestrian-click',
        'buildings-fill'
      ];
      
      // Filter to only include layers that actually exist in the map
      const existingLayers = allInteractiveLayers.filter(layerId => {
        return map.getLayer(layerId) !== undefined;
      });
      
      // Only query if we have existing layers to query
      if (existingLayers.length === 0) {
        // No interactive layers exist, close all popups
        console.log('🔒 Closing all popups - no interactive layers exist');
        setWardPopupData(null);
        setEducationPopupData(null);
        setHealthcarePopupData(null);
        setPublicAmenitiesPopupData(null);
        setTransportPopupData(null);
        setRoadSafetyPopupData(null);
        setBuildingPopupData(null);
        return;
      }
      
      const features = map.queryRenderedFeatures(e.point, { layers: existingLayers });
      
      // If no interactive features clicked, close all popups and clear ward highlight
      if (features.length === 0) {
        console.log('🔒 Closing all popups - clicked outside');
        setWardPopupData(null);
        setSelectedWardNumber(null); // Clear ward highlight too
        setEducationPopupData(null);
        setHealthcarePopupData(null);
        setPublicAmenitiesPopupData(null);
        setTransportPopupData(null);
        
        // Restore view if road safety popup was open
        const savedView = previousRoadSafetyViewRef.current;
        if (roadSafetyPopupData && savedView) {
          map.flyTo({
            center: savedView.center,
            zoom: savedView.zoom,
            duration: 800,
            essential: true,
            easing: (t) => t * (2 - t)
          });
          setPreviousRoadSafetyView(null);
          previousRoadSafetyViewRef.current = null;
          console.log('🏠 Restoring view after closing road safety popup (clicked outside)');
        }
        setRoadSafetyPopupData(null);
        
        setBuildingPopupData(null);
        
        // Clear location search marker and boundary
        if (onLocationClear) {
          console.log('📍 Clearing location search');
          onLocationClear();
        }
      }
    };
    
    map.on('click', handleMapClick);
    
    return () => {
      map.off('click', handleMapClick);
    };
  }, [mapReady, roadSafetyPopupData, previousRoadSafetyView]);

  // Close popups when pressing ESC key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('⌨️ ESC pressed - closing all popups');
        setWardPopupData(null);
        setSelectedWardNumber(null); // Clear ward highlight too
        setEducationPopupData(null);
        setHealthcarePopupData(null);
        setPublicAmenitiesPopupData(null);
        setTransportPopupData(null);
        
        // Restore view if road safety popup was open
        const savedView = previousRoadSafetyViewRef.current;
        if (roadSafetyPopupData && savedView && mapRef.current) {
          mapRef.current.flyTo({
            center: savedView.center,
            zoom: savedView.zoom,
            duration: 800,
            essential: true,
            easing: (t) => t * (2 - t)
          });
          setPreviousRoadSafetyView(null);
          previousRoadSafetyViewRef.current = null;
          console.log('🏠 Restoring view after closing road safety popup (ESC key)');
        }
        setRoadSafetyPopupData(null);
        
        setBuildingPopupData(null);
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [roadSafetyPopupData, previousRoadSafetyView]);

  // Close popups when clicking outside of them (on UI elements like left rail, right panel, header, etc.)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Check if any popup is open
      const hasOpenPopup = wardPopupData || educationPopupData || healthcarePopupData || publicAmenitiesPopupData || transportPopupData || roadSafetyPopupData || buildingPopupData;
      if (!hasOpenPopup) return;

      const target = e.target as HTMLElement;
      
      // Check if the click is inside any popup element (z-20 for ward, z-25 for buildings)
      const isClickInsidePopup = target.closest('.absolute.z-\\[20\\]') !== null || target.closest('.absolute.z-\\[25\\]') !== null;
      
      // If click is outside all popups, close them
      if (!isClickInsidePopup) {
        console.log('🔒 Clicked outside popup - closing all popups');
        setWardPopupData(null);
        setSelectedWardNumber(null);
        setEducationPopupData(null);
        setHealthcarePopupData(null);
        setPublicAmenitiesPopupData(null);
        setTransportPopupData(null);
        
        // Restore view if road safety popup was open
        const savedView = previousRoadSafetyViewRef.current;
        if (roadSafetyPopupData && savedView && mapRef.current) {
          mapRef.current.flyTo({
            center: savedView.center,
            zoom: savedView.zoom,
            duration: 800,
            essential: true,
            easing: (t) => t * (2 - t)
          });
          setPreviousRoadSafetyView(null);
          previousRoadSafetyViewRef.current = null;
          console.log('🏠 Restoring view after closing road safety popup (clicked outside on UI)');
        }
        setRoadSafetyPopupData(null);
        
        setBuildingPopupData(null);
      }
    };
    
    // Use capture phase to ensure we catch all clicks
    document.addEventListener('mousedown', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [wardPopupData, educationPopupData, healthcarePopupData, publicAmenitiesPopupData, transportPopupData, roadSafetyPopupData, buildingPopupData, previousRoadSafetyView]);

  // Update ward boundaries and residential buildings count when LGU or barangay filter changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;
    console.log(`🔄 Filter changed - Updating ward boundaries: LGU="${selectedLguName}", Barangay="${selectedWardId}"`);
    
    // Remove existing ward boundary layers and sources
    const layersToRemove = ['ward-boundaries', 'ward-boundaries-fill', 'ward-boundaries-highlight', 'ward-labels'];
    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
        console.log(`🗑️  Removed layer: ${layerId}`);
      }
    });
    
    // Remove ward boundary source
    if (map.getSource('ward-boundaries')) {
      map.removeSource('ward-boundaries');
      console.log('🗑️  Removed ward-boundaries source');
    }
    
    // Remove ward points source (for labels)
    if (map.getSource('ward-points')) {
      map.removeSource('ward-points');
      console.log('🗑️  Removed ward-points source');
    }
    
    // Re-add ward boundaries with new filters (this will also recalculate residential buildings and total area)
    addWardBoundaryLayer(
      map, 
      wardPopupRef, 
      setWardPopupData, 
      wardBoundariesDataRef, 
      setEducationPopupData, 
      setHealthcarePopupData, 
      setSelectedWardNumber, 
      onLocationClear, 
      wardPointDataRef, 
      selectedLguName, 
      selectedWardId, 
      setIsLayerLoading, 
      onResidentialBuildingsUpdate,
      onTotalAreaUpdate,
      onTotalPopulationUpdate
    );
  }, [selectedLguName, selectedWardId, mapReady]);

  // ===== BUILDINGS LAYER: MANUAL CONTROL ONLY =====
  // Buildings layer is now fully manual - no automatic zoom-based behavior
  // User controls it via the left panel toggle like any other layer

  // Handle GeoServer WMS layers for hazard data
  useEffect(() => {
    console.log('🔥🔥🔥 [LAYER LOAD] useEffect triggered with:', { 
      activeLayerId, 
      activeSector, 
      scenario,
      mapExists: !!mapRef.current, 
      mapReady 
    });
    
    if (!mapRef.current || !mapReady) {
      console.log('⏳ [LAYER LOAD] Waiting for map to be ready...', { mapExists: !!mapRef.current, mapReady });
      return;
    }

    const map = mapRef.current;

    const addGeoServerLayers = () => {
      // Set loading state to true when starting to load layers
      setIsLayerLoading(true);
      
      console.log('🗺️ 🗺️ 🗺️  [LAYER LOAD] Managing GeoServer layers. Sector:', activeSector, 'Layer ID:', activeLayerId, 'Scenario:', scenario);

      // Remove any existing hazard layers
      const layersToRemove = ['heat_hhi', 'heat_lst', 'heat_ast', 'heat_wbt', 'heat_wbgt', 'heat_uhi', 'heat_rh', 
                              'air_aqi', 'air_co', 'air_no2', 'air_o3', 'air_pm10', 'air_pm25', 'air_so2', 
                              'flood_fhi', 'multihazard_assessment',
                              // CWIS Climate Hazard Layers
                              'flood_hazard', 'storm_surge', 'urban_waterlogging', 
                              'heat_stress_index', 'land_surface_temperature', 'urban_heat_island', 'wet_bulb_temperature',
                              // Environmental Sensitivity Layers
                              'soil_classification', 'groundwater_depth', 'geology', 'sinkhole',
                              'groundwater_infiltration_vulnerability'];
      
      console.log('🗑️  [LAYER LOAD] Removing existing hazard layers...');
      layersToRemove.forEach(layerId => {
        if (map && map.getLayer && map.getLayer(layerId)) {
          console.log('🗑️  [LAYER LOAD] Removing layer:', layerId);
          map.removeLayer(layerId);
        }
        if (map && map.getSource && map.getSource(layerId)) {
          console.log('🗑️  [LAYER LOAD] Removing source:', layerId);
          map.removeSource(layerId);
        }
      });

      // If no layers are selected, just return after cleanup
      if (!activeLayerId) {
        console.log('ℹ️  [LAYER LOAD] No layers selected, skipping layer addition');
        setIsLayerLoading(false);
        return;
      }

      // Process each active layer
      const layerId = activeLayerId;
      console.log('🎯 [LAYER LOAD] Processing layer ID:', layerId);
      {
        // Check layer type first
        const isCWISLayer = false; // CWIS layers removed for tourism dashboard
        const isEnvironmentalLayer = ['soil_classification', 'groundwater_depth', 'geology', 'sinkhole', 'groundwater_infiltration_vulnerability'].includes(layerId);

        
        let tileUrl: string | null = null;
        let layerName: string = '';
        
        if (isCWISLayer) {
          // ═══════════════════════════════════════════════════════════════════════════════
          // CWIS LAYER HANDLING (Direct WMS, no scenario support)
          // ═══════════════════════════════════════════════════════════════════════════════
          console.log('🌊 [CWIS LAYER] Processing CWIS layer:', layerId);
          
          const cwisConfig = getCWISLayerConfig(layerId);
          if (!cwisConfig) {
            console.error('❌ [CWIS LAYER] No CWIS config found for:', layerId);
            setIsLayerLoading(false);
            return;
          }
          
          layerName = cwisConfig.name;
          console.log('✅ [CWIS LAYER] CWIS config found:', cwisConfig);
          
          // Get filters
          console.log('🔍 [CWIS LAYER] Filter values from props:', { selectedLguName, selectedWardName });
          const munNameForFilter = (selectedLguName && selectedLguName !== 'all') ? selectedLguName : null;
          const brgyNameForFilter = (selectedWardName && selectedWardName !== 'all') ? selectedWardName : null;
          console.log('🔍 [CWIS LAYER] Processed filters:', { munNameForFilter, brgyNameForFilter });
          
          // Generate CWIS-specific WMS URL (with optional donut category filter)
          const cwisCategoryField = {
            storm_surge: 'Hazard',
            flood_hazard: 'Type',
          }[layerId] ?? null;
          tileUrl = getCWISLayerWMSUrl(
            layerId,
            munNameForFilter,
            brgyNameForFilter,
            selectedDonutCategory ?? null,
            cwisCategoryField
          );
          
          if (!tileUrl) {
            console.warn('⚠️ [CWIS LAYER] Layer not yet connected to GeoServer:', layerId);
            console.warn('⚠️ [CWIS LAYER] This layer will be enabled once GeoServer connection is configured');
            setIsLayerLoading(false);
            return;
          }
          
          console.log('✅ [CWIS LAYER] Generated WMS URL:', tileUrl);
          if (munNameForFilter) {
            console.log(`🔍 [CWIS LAYER] Applying LGU filter: ${munNameForFilter}`);
          }
          if (brgyNameForFilter) {
            console.log(`🔍 [CWIS LAYER] Applying Barangay filter: ${brgyNameForFilter}`);
          }
        } else if (isEnvironmentalLayer) {
          // ═══════════════════════════════════════════════════════════════════════════════
          // ENVIRONMENTAL LAYER HANDLING (Direct WMS, no scenario support)
          // ═══════════════════════════════════════════════════════════════════════════════
          console.log('🌲 [ENVIRONMENTAL LAYER] Processing Environmental layer:', layerId);
          
          const envConfig = getEnvironmentalLayerConfig(layerId);
          if (!envConfig) {
            console.error('❌ [ENVIRONMENTAL LAYER] No Environmental config found for:', layerId);
            setIsLayerLoading(false);
            return;
          }
          
          layerName = envConfig.name;
          console.log('✅ [ENVIRONMENTAL LAYER] Environmental config found:', envConfig);
          
          // Get filters
          const munNameForFilter = (selectedLguName && selectedLguName !== 'all') ? selectedLguName : null;
          const brgyNameForFilter = (selectedWardName && selectedWardName !== 'all') ? selectedWardName : null;
          
          // Generate Environmental-specific WMS URL with MunName, BrgyName, and Category filters
          tileUrl = getEnvironmentalLayerWMSUrl(layerId, munNameForFilter, brgyNameForFilter, selectedDonutCategory);
          
          if (!tileUrl) {
            console.warn('⚠️ [ENVIRONMENTAL LAYER] Layer not yet connected to GeoServer:', layerId);
            console.warn('⚠️ [ENVIRONMENTAL LAYER] This layer will be enabled once GeoServer connection is configured');
            setIsLayerLoading(false);
            return;
          }
          
          console.log('✅ [ENVIRONMENTAL LAYER] Generated WMS URL:', tileUrl);
          if (munNameForFilter) {
            console.log(`🔍 [ENVIRONMENTAL LAYER] Applying LGU filter (MunName): ${munNameForFilter}`);
          }
          if (brgyNameForFilter) {
            console.log(`🔍 [ENVIRONMENTAL LAYER] Applying Barangay filter (BrgyName): ${brgyNameForFilter}`);
          }
          if (selectedDonutCategory) {
            console.log(`🎯 [ENVIRONMENTAL LAYER] Applying Category filter (Type): ${selectedDonutCategory}`);
          }
        } else {
          // ═══════════════════════════════════════════════════════════════════════════════
          // STANDARD LAYER HANDLING (Scenario-based layers)
          // ════════════════════════════════════════════════════════════���══════════════════
          console.log('🔍 [LAYER LOAD] Looking up layer config for:', layerId);
          console.log('🔍 [LAYER LOAD] Available geoserverLayers keys:', Object.keys(geoserverLayers));
          const layerConfig = geoserverLayers[layerId];
          if (!layerConfig) {
            console.error('❌❌❌ [LAYER LOAD] No GeoServer config found for layer:', layerId);
            console.error('❌ [LAYER LOAD] This means the layer is not in geoserverLayers export object!');
            setIsLayerLoading(false);
            return;
          }
          console.log('✅ [LAYER LOAD] Layer config found:', layerConfig);
          layerName = layerConfig.name;

          // Get the scenario-specific layer name
          console.log('🔍 [LAYER LOAD] Getting scenario-specific layer name for:', layerId, scenario);
          const geoserverLayerName = getLayerNameForScenario(layerId, scenario);
          console.log('🔍 [LAYER LOAD] getLayerNameForScenario returned:', geoserverLayerName);
          if (!geoserverLayerName) {
            console.error('❌❌❌ [LAYER LOAD] No GeoServer layer name found for:', layerId, scenario);
            setIsLayerLoading(false);
            return;
          }

          console.log('✅✅✅ [LAYER LOAD] Adding GeoServer layer:', layerId, '→', geoserverLayerName);
          console.log('📊 [LAYER LOAD] Scenario breakdown:', {
            layerId: layerId,
            scenario: scenario,
            geoserverLayer: geoserverLayerName,
            layerName: layerConfig.name
          });

          // Extract ward number from selectedWardId if filtering is active
          let wardNumberForFilter: number | null = null;
          if (selectedWardId && selectedWardId !== 'all') {
            wardNumberForFilter = extractWardNumber(selectedWardId);
            if (wardNumberForFilter !== null) {
              console.log(`🔍 [LAYER LOAD] Applying ward filter: Ward ${wardNumberForFilter}`);
            } else {
              wardNumberForFilter = null;
            }
          }

          // Get the WMS tile URL with optional LGU and ward filters
          // Force WMS for heat stress layers (WMTS cache causes 400 errors)
          const isHeatStressLayer = layerId.startsWith('heat_');
          const munNameForFilter = (selectedLguName && selectedLguName !== 'all') ? selectedLguName : null;
          const brgyNameForFilter = (selectedWardName && selectedWardName !== 'all') ? selectedWardName : null;
          const forceWMS = isHeatStressLayer;
          tileUrl = getWMSTileUrl(geoserverLayerName, wardNumberForFilter, forceWMS, selectedDonutCategory, munNameForFilter, brgyNameForFilter);
          console.log('📡📡📡 [LAYER LOAD] WMS Tile URL:', tileUrl, forceWMS ? '(WMS forced)' : '');
          if (munNameForFilter) {
            console.log(`🔍 [LAYER LOAD] Applying LGU filter: ${munNameForFilter}`);
          }
          if (brgyNameForFilter) {
            console.log(`🔍 [LAYER LOAD] Applying Barangay filter: ${brgyNameForFilter}`);
          }
        }

        // Add raster source
        console.log('➕ [LAYER LOAD] Adding raster source to map:', layerId);
        try {
          map.addSource(layerId, {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 18
          });
          console.log('✅✅✅ [LAYER LOAD] Source added successfully:', layerId);
        } catch (error) {
          console.error('❌❌❌ [LAYER LOAD] Error adding source:', error);
        }

        // Add hazard layer ABOVE all basemap layers (including roads/buildings) but BELOW custom overlays
        // Layer order: basemap (all) → hazard layer (only one) → waterbody → road network → ward boundaries → infrastructure → road safety → basemap labels
        // CRITICAL: Find the lowest non-basemap layer to position hazard before it, ensuring waterbody and ward boundaries ALWAYS stay on top
        const waterbodyLayerId = 'waterbody';
        const roadNetworkLayerId = 'road_network_link';
        const wardBoundariesLayerId = 'ward-boundaries-fill';
        
        console.log('🎯 [LAYER LOAD] Determining layer position...');
        console.log('🎯 [LAYER LOAD] Checking for positioning layers:', {
          hasWaterbody: !!map.getLayer(waterbodyLayerId),
          hasRoadNetwork: !!map.getLayer(roadNetworkLayerId),
          hasWardBoundaries: !!map.getLayer(wardBoundariesLayerId)
        });
        
        // Priority order for positioning: waterbody > road network > ward boundaries > labels (fallback)
        let beforeLayerId = undefined;
        if (map.getLayer(waterbodyLayerId)) {
          beforeLayerId = waterbodyLayerId;
          console.log('🎯 [LAYER LOAD] Positioning hazard layer BEFORE waterbody');
        } else if (map.getLayer(roadNetworkLayerId)) {
          beforeLayerId = roadNetworkLayerId;
          console.log('🎯 [LAYER LOAD] Positioning hazard layer BEFORE road network');
        } else if (map.getLayer(wardBoundariesLayerId)) {
          beforeLayerId = wardBoundariesLayerId;
          console.log('🎯 [LAYER LOAD] Positioning hazard layer BEFORE ward boundaries');
        } else {
          // Fallback: Find the first label layer as a safe positioning point
          beforeLayerId = getFirstLabelLayerId(map);
          console.log('🎯 [LAYER LOAD] Positioning hazard layer BEFORE labels (fallback)');
        }
        
        // Add raster layer with smooth transition
        const opacity = layerOpacities[layerId] || 0.7;
        console.log('➕ [LAYER LOAD] Adding raster layer to map:', { layerId, opacity, beforeLayerId });
        try {
          map.addLayer({
            id: layerId,
            type: 'raster',
            source: layerId,
            paint: {
              'raster-opacity': opacity,
              'raster-opacity-transition': {
                duration: 600,
                delay: 0
              }
            }
          }, beforeLayerId);
          console.log('✅✅✅ [LAYER LOAD] Hazard layer added successfully:', layerId, 'with opacity:', opacity, 'positioned before:', beforeLayerId || 'top');
        } catch (error) {
          console.error('❌❌❌ [LAYER LOAD] Error adding layer:', error);
        }

        // 🔒 ENFORCE STRICT LAYER ORDER - Use the centralized enforcement system
        enforceStrictLayerOrder(map);
        
        console.log('✅ Layer ordering enforced immediately using strict priority system');

        // BACKUP REORDERING - Also run after delay to handle async-loaded basemap layers
        setTimeout(() => {
          try {
            // Safety check: Ensure map and style are still valid
            if (!map || !map.getStyle || !map.getStyle()) {
              console.log('⚠️ Map style not loaded yet for backup reordering, skipping');
              return;
            }
            
            // 🔒 RE-ENFORCE STRICT LAYER ORDER
            enforceStrictLayerOrder(map);
            console.log('✅ Layer ordering re-enforced after 500ms using strict priority system');
          } catch (error) {
            console.warn('⚠️ Error during backup layer reordering:', error);
          }
        }, 500);

        // Add event listeners for debugging tile loading
        map.on('sourcedataloading', (e) => {
          if (e.sourceId === layerId) {
            console.log('🔄 Loading tiles for:', layerId);
          }
        });

        // Track if loading was cleared by event
        let loadingCleared = false;

        // Use 'idle' event — fires only after all tiles in viewport are fetched + painted.
        // This keeps the loader visible until the layer is *visually* complete, not just
        // metadata-loaded (sourcedata fires too early, before tiles are rendered).
        const onLayerIdle = () => {
          if (!loadingCleared) {
            console.log('✅ Layer tiles fully rendered (map idle):', layerId);
            loadingCleared = true;
            setIsLayerLoading(false);
          }
        };
        map.once('idle', onLayerIdle);

        // SAFEGUARD: Force clear loading after 8 seconds even if 'idle' doesn't fire
        const loadingTimeout = setTimeout(() => {
          if (!loadingCleared) {
            console.log('⏱️ Loading timeout reached for:', layerId, '- forcing clear');
            loadingCleared = true;
            setIsLayerLoading(false);
            map.off('idle', onLayerIdle);
          }
        }, 8000);

        // Listen for tile loading errors and auto-remove failed layers
        map.on('error', (e) => {
          const errorMessage = e.error?.message || e.error || '';
          const sourceId = e.sourceId || 'unknown';
          
          // Track errors to prevent console spam from tile loading failures
          const now = Date.now();
          const errorTracker = tileErrorTrackerRef.current;
          const tracked = errorTracker[sourceId];
          
          // Reset counter if enough time has passed
          if (tracked && now - tracked.lastLogged > ERROR_RESET_TIME) {
            delete errorTracker[sourceId];
          }
          
          // Check if this is a tile loading error (AJAX/HTTP errors)
          const isTileError = errorMessage.includes('AJAXError') || 
                             errorMessage.includes('Bad Request') ||
                             errorMessage.includes('Failed to fetch') ||
                             errorMessage.includes('NetworkError') ||
                             errorMessage.includes('CORS') ||
                             errorMessage.includes('404') ||
                             errorMessage.includes('400');
          
          // Only log first few tile errors per source to avoid spam
          if (isTileError) {
            if (!tracked) {
              errorTracker[sourceId] = { count: 1, lastLogged: now };
              console.info(`ℹ️ Layer "${sourceId}" tiles not available from GeoServer (this is normal if layer data hasn't been uploaded yet)`);
              
              // Toast notification removed - layers load fine despite tile errors
              // const layerName = sourceId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              // toast.warning(`Layer "${layerName}" has loading issues`, {
              //   description: 'Some tiles may not display correctly. The layer data may be temporarily unavailable.',
              //   duration: 5000,
              // });
            } else if (tracked.count < MAX_ERRORS_PER_SOURCE) {
              tracked.count++;
              tracked.lastLogged = now;
            }
            // Silently ignore additional tile errors after threshold
          } else {
            // Check if this is an expected error (image decode for placeholder layers)
            if (errorMessage.includes('could not be decoded')) {
              // Suppress these common expected errors
              console.debug('⚠️ Map image decode error (expected):', e.sourceId);
            } else {
              // Log non-tile errors normally (these are usually important)
              console.error('❌ Map error:', {
                type: e.type,
                sourceId: e.sourceId,
                error: errorMessage
              });
            }
          }
          
          // Set loading to false on error
          if (e.sourceId === layerId) {
            loadingCleared = true;
            setIsLayerLoading(false);
            clearTimeout(loadingTimeout);
            map.off('idle', onLayerIdle);
          }
          
          // Handle image decoding errors (common when GeoServer tiles are not available)
          if (e.sourceId && errorMessage.includes('could not be decoded')) {
            // This is expected when GeoServer layer doesn't have data yet OR when using placeholder layer names
            // Silently ignore these errors - they're expected for unconfigured layers
            // Check if this is a placeholder layer (YOUR_WORKSPACE prefix)
            const geoserverLayerName = getLayerNameForScenario(e.sourceId, scenario);
            if (geoserverLayerName && geoserverLayerName.includes('YOUR_WORKSPACE:')) {
              // Suppress warning - these are expected placeholder layers not yet configured
              console.debug(`⚠️ Layer "${e.sourceId}" uses placeholder GeoServer configuration (expected - not yet configured).`);
            } else {
              // Only log info if it's a real layer that's just missing data
              console.debug(`ℹ️ Layer "${e.sourceId}" tiles could not be decoded (data may not be available yet)`);
            }
            // Don't remove the layer - user might want to keep it in the layer list
          } else if (e.sourceId && errorMessage.includes('source')) {
            // Other source errors - only log as debug to reduce console noise
            console.debug(`⚠️ Source error for layer "${e.sourceId}":`, errorMessage);
          }
        });

        // Check if layer is visible in layer list
        setTimeout(() => {
          if (!map || !map.getLayer || !map.isStyleLoaded()) return;
          const layer = map.getLayer(layerId);
          const source = map.getSource(layerId);
          console.log('🔍 Layer check:', {
            layerExists: !!layer,
            sourceExists: !!source,
            layerId: layerId,
            opacity: layer ? map.getPaintProperty(layerId, 'raster-opacity') : 'N/A',
            visibility: layer ? map.getLayoutProperty(layerId, 'visibility') : 'N/A'
          });
        }, 1000);
      }
    };

    // Wait for map style to be loaded before adding layers
    if (map.isStyleLoaded()) {
      addGeoServerLayers();
    } else {
      map.once('styledata', addGeoServerLayers);
    }

  }, [activeSector, activeLayerId, scenario, mapReady, selectedWardId, styleLoadCounter, selectedDonutCategory, selectedLguName, selectedWardName]);

  // Update layer opacity when slider changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;

    // Update opacity for every layer tracked in layerOpacities (hazard layers, elevation, etc.)
    Object.entries(layerOpacities).forEach(([layerId, opacity]) => {
      const layer = map.getLayer(layerId);
      if (layer && layer.type === 'raster') {
        map.setPaintProperty(layerId, 'raster-opacity', opacity);
        console.log(`🎚️  Updated opacity for ${layerId}: ${Math.round(opacity * 100)}%`);
      }
    });
  }, [layerOpacities, mapReady]);

  // Handle base layers (road network, etc.)
  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      console.log('⏳ Waiting for map to be ready for base layers...', { mapExists: !!mapRef.current, mapReady });
      return;
    }

    const map = mapRef.current;

    const addBaseLayers = async () => {
      // Stamp this invocation — if a newer call starts while we await, we bail out
      const myInvocationId = ++addBaseLayersCounterRef.current;
      const isStale = () => myInvocationId !== addBaseLayersCounterRef.current;

      console.log('🗺️  Managing base layers (SMART DIFF):', activeBaseLayers);

      // Define all possible base layers with their associated layers
      const layerGroups: Record<string, string[]> = {
        'road_network_base': [], // Will be populated dynamically from map layers
        'buildings': ['buildings', 'buildings-fill', 'buildings-3d', 'buildings-highlight'],
        'slum_settlements': ['slum_settlements'],
        'waterbody': ['waterbody'],
        'watershed': ['watershed', 'drainage', 'watershed-labels'],
        'builtup_density': ['builtup-density-fill'],
        'built_up': ['built_up'],
        'elevation': ['elevation'],
        'ndvi': ['ndvi']
      };

      // Dynamically detect road network layers (since they're created based on category values)
      if (map && map.getStyle) {
        const allLayers = map.getStyle().layers || [];
        const roadLayers = allLayers
          .filter((layer: any) => layer.id.startsWith('road_network_'))
          .map((layer: any) => layer.id);
        if (roadLayers.length > 0) {
          layerGroups['road_network_base'] = roadLayers;
          console.log(`🛣️  Detected ${roadLayers.length} road network layers:`, roadLayers);
        }
      }

      // For buildings: Use visibility control instead of removal (to enable smooth re-activation)
      // For other layers: Remove them completely
      const layersToRemove: string[] = [];
      const layersToHide: string[] = [];
      
      Object.keys(layerGroups).forEach(baseLayerId => {
        // Special check for buildings: should be active if any building categories or subcategories are selected
        const shouldBuildingsBeActive = baseLayerId === 'buildings' && (activeBuildingCategories.length > 0 || activeBuildingSubcategories.length > 0);
        const isBaseLayerActive = activeBaseLayers.includes(baseLayerId) || shouldBuildingsBeActive;
        
        if (!isBaseLayerActive && baseLayerId !== 'ward_boundary') {
          // Special handling for road_network_base - it doesn't have a source
          // It only controls basemap road visibility
          if (baseLayerId === 'road_network_base') {
            layersToRemove.push(baseLayerId);
          }
          // Check if source exists on map for other layers
          else if (map && map.getSource && map.getSource(baseLayerId)) {
            if (baseLayerId === 'buildings') {
              // Buildings: Hide instead of remove
              layersToHide.push(baseLayerId);
            } else {
              // Other layers: Remove completely
              layersToRemove.push(baseLayerId);
            }
          }
        }
      });

      // Hide buildings layers (don't remove, just set visibility to 'none')
      layersToHide.forEach(baseLayerId => {
        const layerIds = layerGroups[baseLayerId] || [baseLayerId];
        console.log(`👁️  Hiding layer group: ${baseLayerId}`);
        
        layerIds.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'none');
            console.log(`  ✅ Set ${layerId} visibility to none`);
          }
        });
        
        // If hiding buildings, ensure loading indicator is also hidden
        if (baseLayerId === 'buildings') {
          setIsBuildingsLoading(false);
          console.log('  ✅ Buildings loading indicator hidden');
        }
      });

      // Remove only non-buildings layers that should be deactivated
      layersToRemove.forEach(baseLayerId => {
        const layerIds = layerGroups[baseLayerId] || [baseLayerId];
        console.log(`🗑️  Removing deactivated layer group: ${baseLayerId}`);
        
        layerIds.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
        });
        
        if (map && map.getSource && typeof map.getSource === 'function' && map.getSource(baseLayerId)) {
          map.removeSource(baseLayerId);
        }

        // Clear filter stamp for raster layers so they get a fresh URL on re-add
        if (['elevation', 'built_up', 'ndvi'].includes(baseLayerId)) {
          delete rasterLayerFilterRef.current[baseLayerId];
          setIsLayerLoading(false); // ensure loading indicator is cleared on removal
        }
        
        // Special handling for road_network_base - hide basemap roads
        if (baseLayerId === 'road_network_base' && map && map.getStyle) {
          console.log('🛣️  Hiding basemap road layers');
          
          // Hide satellite roads overlay if it exists (for satellite basemap)
          if (map.getLayer('satellite-roads')) {
            map.setLayoutProperty('satellite-roads', 'visibility', 'none');
            console.log('  ✅ Hid satellite roads overlay');
          }
          
          const allLayers = map.getStyle().layers || [];
          const roadLayerPatterns = ['road', 'tunnel', 'bridge', 'highway', 'street', 'path'];
          
          const roadLayers = allLayers.filter((layer: any) => {
            const layerId = layer.id.toLowerCase();
            return roadLayerPatterns.some(pattern => layerId.includes(pattern)) &&
                   !layerId.includes('label') &&
                   !layerId.includes('shield') &&
                   !layerId.startsWith('road_network_') &&
                   !layerId.startsWith('road_query_') &&
                   !layerId.startsWith('road-safety');
          });
          
          roadLayers.forEach((layer: any) => {
            if (map.getLayer(layer.id)) {
              map.setLayoutProperty(layer.id, 'visibility', 'none');
              console.log(`  ✅ Hid basemap road layer: ${layer.id}`);
            }
          });
        }
        
        // Special handling for watershed - also remove watershed-point and drainage sources
        if (baseLayerId === 'watershed') {
          if (map && map.getSource && typeof map.getSource === 'function' && map.getSource('watershed-point')) {
            map.removeSource('watershed-point');
            console.log('🗑️  Removed watershed-point source');
          }
          if (map && map.getSource && typeof map.getSource === 'function') {
            if (map.getLayer('drainage')) {
              map.removeLayer('drainage');
            }
            if (map.getSource('drainage')) {
              map.removeSource('drainage');
              console.log('🗑️  Removed drainage source');
            }
            // Remove drain outfall layers
            if (map.getLayer('drain-outfall-inner')) {
              map.removeLayer('drain-outfall-inner');
            }
            if (map.getLayer('drain-outfall-red')) {
              map.removeLayer('drain-outfall-red');
            }
            if (map.getLayer('drain-outfall-outer')) {
              map.removeLayer('drain-outfall-outer');
            }
            if (map.getLayer('drain-outfall-glow')) {
              map.removeLayer('drain-outfall-glow');
            }
            if (map.getSource('drain-outfall')) {
              map.removeSource('drain-outfall');
              console.log('🗑️  Removed drain-outfall source');
            }
          }
        }
      });

      // Add active base layers (only if they don't already exist)
      // Include 'buildings' if any building categories are selected
      const layersToAdd = [...activeBaseLayers];
      console.log('🔍 DEBUG BUILDINGS: activeBaseLayers =', activeBaseLayers);
      console.log('🔍 DEBUG BUILDINGS: activeBuildingCategories =', activeBuildingCategories);
      console.log('🔍 DEBUG BUILDINGS: activeBuildingSubcategories =', activeBuildingSubcategories);
      console.log('🔍 DEBUG BUILDINGS: layersToAdd BEFORE auto-add =', layersToAdd);
      if ((activeBuildingCategories.length > 0 || activeBuildingSubcategories.length > 0) && !layersToAdd.includes('buildings')) {
        layersToAdd.push('buildings');
        console.log('🏢 Adding buildings to layers list (building categories/subcategories active)');
      }
      console.log('🔍 DEBUG BUILDINGS: layersToAdd AFTER auto-add =', layersToAdd);
      
      for (const layerId of layersToAdd) {
        // Skip ward_boundary - it's handled separately via addWardBoundaryLayer and visibility control
        if (layerId === 'ward_boundary') {
          console.log('⏭️  Skipping ward_boundary (handled separately via visibility control)');
          continue;
        }

        // Skip municipal_boundary - it's handled separately via addMunicipalBoundaryLayer and visibility control
        if (layerId === 'municipal_boundary') {
          console.log('⏭️  Skipping municipal_boundary (handled separately via visibility control)');
          continue;
        }

        // If layer already exists on the map, ensure it's visible instead of re-adding
        if (map && map.getSource && typeof map.getSource === 'function' && map.getSource(layerId)) {
          console.log(`⏭️  Layer ${layerId} already exists, ensuring visibility`);
          
          // For buildings, ensure all 3 layers are visible
          if (layerId === 'buildings') {
            // CRITICAL FIX: Check if ward / LGU / barangay filter has changed - if so, force rebuild.
            // We compose a signature from all three filter inputs so that changing
            // any of them (e.g. picking a different LGU while leaving the
            // barangay alone) causes the MVT source to be re-requested with
            // the updated CQL_FILTER.
            const buildingsFilterSignature = `${selectedLguName ?? ''}|${selectedWardId ?? ''}|${selectedWardName ?? ''}`;
            const wardFilterChanged = buildingsWardRef.current !== buildingsFilterSignature;

            if (wardFilterChanged) {
              console.log(`🔄 Buildings filter changed from "${buildingsWardRef.current}" to "${buildingsFilterSignature}", removing buildings to force rebuild`);
              
              // Remove viewport reload event listener
              if (buildingsReloadHandlerRef.current && map) {
                map.off('moveend', buildingsReloadHandlerRef.current);
                buildingsReloadHandlerRef.current = null;
                console.log('🗑️  Removed buildings viewport reload handler');
              }
              
              // Remove all building layers
              if (map.getLayer('buildings-fill')) {
                map.removeLayer('buildings-fill');
              }
              if (map.getLayer('buildings-3d')) {
                map.removeLayer('buildings-3d');
              }
              if (map.getLayer('buildings-highlight')) {
                map.removeLayer('buildings-highlight');
              }
              if (map.getLayer('buildings')) {
                map.removeLayer('buildings');
              }
              
              // Remove the source
              if (map && map.getSource && map.getSource('buildings')) {
                map.removeSource('buildings');
              }
              
              // Don't continue - let the code below rebuild the layer with new filter
              console.log('✅ Buildings source removed, will rebuild with new ward filter');
            } else {
              // Ward filter hasn't changed - check if layers exist
              const buildingsExist = map.getLayer('buildings') && map.getLayer('buildings-fill') && map.getLayer('buildings-3d') && map.getLayer('buildings-highlight');
              
              if (buildingsExist) {
                // Layers exist, just make them visible (respecting 3D mode state)
                if (map.getLayer('buildings')) {
                  map.setLayoutProperty('buildings', 'visibility', is3DMode ? 'none' : 'visible');
                  console.log(`✅ Set buildings visibility to ${is3DMode ? 'none' : 'visible'}`);
                }
                if (map.getLayer('buildings-fill')) {
                  map.setLayoutProperty('buildings-fill', 'visibility', is3DMode ? 'none' : 'visible');
                  console.log(`✅ Set buildings-fill visibility to ${is3DMode ? 'none' : 'visible'}`);
                }
                if (map.getLayer('buildings-3d')) {
                  map.setLayoutProperty('buildings-3d', 'visibility', is3DMode ? 'visible' : 'none');
                  console.log(`✅ Set buildings-3d visibility to ${is3DMode ? 'visible' : 'none'}`);
                }
                if (map.getLayer('buildings-highlight')) {
                  map.setLayoutProperty('buildings-highlight', 'visibility', 'visible');
                  console.log(`✅ Set buildings-highlight visibility to visible`);
                }
                
                // STRICT ENFORCEMENT: Show loading indicator until buildings are fully rendered
                // Even if layers just became visible, we need to wait for them to render
                console.log('⏳ Buildings made visible - showing loading indicator until map idle (all tiles rendered)');
                setIsBuildingsLoading(true);

                // Wait for map 'idle' — fires only after all tiles in the viewport are
                // fully fetched, decoded, and painted.  This is more reliable than the
                // old metadata-only polling approach which dismissed the loader before
                // tiles were actually rendered.
                let visibilityIdleCleared = false;
                const onVisibilityIdle = () => {
                  if (!visibilityIdleCleared) {
                    visibilityIdleCleared = true;
                    console.log('✅ Buildings visibility toggle: map idle — all tiles rendered');
                    setIsBuildingsLoading(false);
                    map.off('idle', onVisibilityIdle);
                  }
                };
                map.once('idle', onVisibilityIdle);

                // Safety timeout in case 'idle' never fires (e.g. continuous animation)
                setTimeout(() => {
                  if (!visibilityIdleCleared) {
                    console.log('⏱️ Buildings visibility idle timeout (10s) — hiding loader');
                    visibilityIdleCleared = true;
                    setIsBuildingsLoading(false);
                    map.off('idle', onVisibilityIdle);
                  }
                }, 2000);

                // 🔒 CRITICAL: Enforce strict layer order after making buildings visible
                enforceStrictLayerOrder(map);
                console.log('🔄 Buildings layers re-ordered using strict priority system');
                
                // 🔒 FORCE IMMEDIATE TILE REQUEST - Trigger map repaint to ensure tiles are loaded
                map.triggerRepaint();
                console.log('🔄 Forced map repaint after visibility toggle to ensure tiles load immediately');
                
                continue; // Skip rebuild, layer is ready
              } else {
                // Layers don't exist yet, need to build them
                console.log('🏢 Buildings layers do not exist, will build them for the first time');
                // Fall through to building code below
              }
            }
          } else {
            // For other layers (including road_network_base), check if ward filter changed
            if (layerId === 'road_network_base') {
              const wardFilterChanged = roadNetworkWardRef.current !== selectedWardId;
              
              if (wardFilterChanged) {
                console.log(`🔄 Ward filter changed for road network from ${roadNetworkWardRef.current} to ${selectedWardId}, removing to force rebuild`);
                
                // Remove all road network layers dynamically
                if (map && map.getStyle) {
                  const allLayers = map.getStyle().layers || [];
                  const roadLayers = allLayers
                    .filter((layer: any) => layer.id.startsWith('road_network_'))
                    .map((layer: any) => layer.id);
                  
                  roadLayers.forEach(roadLayerId => {
                    if (map.getLayer(roadLayerId)) {
                      map.removeLayer(roadLayerId);
                      console.log(`  🗑️  Removed ${roadLayerId}`);
                    }
                  });
                }
                
                // Remove the source
                if (map && map.getSource && map.getSource('road_network_base')) {
                  map.removeSource('road_network_base');
                }
                
                // Don't continue - let the code below rebuild the layer with new filter
                console.log('✅ Road network source removed, will rebuild with new ward filter');
              } else {
                // Ward filter hasn't changed, just make visible
                const relatedLayers = layerGroups[layerId] || [layerId];
                relatedLayers.forEach(relatedLayerId => {
                  if (map.getLayer(relatedLayerId)) {
                    map.setLayoutProperty(relatedLayerId, 'visibility', 'visible');
                  }
                });
                continue; // Skip rebuild, layer is ready
              }
            } else {
              // For raster base layers (elevation, built_up, ndvi), force refresh if filter changed
              const rasterBaseLayers = ['elevation', 'built_up', 'ndvi'];
              if (rasterBaseLayers.includes(layerId)) {
                const filterKey = `${selectedLguName}|${selectedWardId}|${selectedWardName}`;
                const prevFilterKey = rasterLayerFilterRef.current[layerId] || '';
                if (filterKey !== prevFilterKey) {
                  // Filter changed — remove source/layer so it gets re-added with updated CQL_FILTER URL below
                  console.log(`🔄 Filter changed for raster layer ${layerId}: "${prevFilterKey}" → "${filterKey}", forcing tile refresh`);
                  if (map.getLayer(layerId)) map.removeLayer(layerId);
                  if (map && map.getSource && map.getSource(layerId)) map.removeSource(layerId);
                  // Fall through to re-add code below
                } else {
                  // Filter unchanged — layer already exists, show it with loading indicator
                  if (map.getLayer(layerId)) {
                    setIsLayerLoading(true);
                    map.setLayoutProperty(layerId, 'visibility', 'visible');
                    map.triggerRepaint();
                    let rasterVisTimeout: ReturnType<typeof setTimeout>;
                    const onRasterVisible = () => {
                      clearTimeout(rasterVisTimeout);
                      setIsLayerLoading(false);
                    };
                    map.once('idle', onRasterVisible);
                    rasterVisTimeout = setTimeout(() => {
                      map.off('idle', onRasterVisible);
                      setIsLayerLoading(false);
                    }, 5000);
                  }
                  continue;
                }
              } else {
                // For other layers, just set their visibility
                const relatedLayers = layerGroups[layerId] || [layerId];
                relatedLayers.forEach(relatedLayerId => {
                  if (map.getLayer(relatedLayerId)) {
                    map.setLayoutProperty(relatedLayerId, 'visibility', 'visible');
                  }
                });
                continue;
              }
            }
          }
        }
        
        console.log(`➕ Adding new layer: ${layerId}`);
        
        if (layerId === 'road_network_base') {
          // Control basemap road visibility
          console.log('🛣️  ===== BASEMAP ROAD NETWORK TOGGLE =====');
          console.log('✅ Showing basemap road layers');
          
          // Show satellite roads overlay if it exists (for satellite basemap)
          if (map.getLayer('satellite-roads')) {
            map.setLayoutProperty('satellite-roads', 'visibility', 'visible');
            console.log('  ✅ Showed satellite roads overlay');
          }
          
          // Get all basemap road layers from the current style
          if (map && map.getStyle) {
            const allLayers = map.getStyle().layers || [];
            
            // Common basemap road layer patterns (Carto, Mapbox, etc.)
            const roadLayerPatterns = [
              'road',
              'tunnel',
              'bridge',
              'highway',
              'street',
              'path'
            ];
            
            // Find and show all basemap road-related layers
            const roadLayers = allLayers.filter((layer: any) => {
              const layerId = layer.id.toLowerCase();
              // Match layers that contain road-related keywords
              // Exclude our custom layers and labels
              return roadLayerPatterns.some(pattern => layerId.includes(pattern)) &&
                     !layerId.includes('label') &&
                     !layerId.includes('shield') &&
                     !layerId.startsWith('road_network_') && // Exclude our custom road network layers
                     !layerId.startsWith('road_query_') && // Exclude road query layers
                     !layerId.startsWith('road-safety'); // Exclude road safety layers
            });
            
            console.log(`🔍 Found ${roadLayers.length} basemap road layers`);
            
            roadLayers.forEach((layer: any) => {
              if (map.getLayer(layer.id)) {
                map.setLayoutProperty(layer.id, 'visibility', 'visible');
                console.log(`  ✅ Showed basemap road layer: ${layer.id}`);
              }
            });
            
            console.log('🛣️  ===== BASEMAP ROAD NETWORK TOGGLE COMPLETE =====');
          }
        } else if (layerId === 'buildings') {
          console.log('🏢 ===== BUILDINGS LAYER ACTIVATION STARTED =====');
          console.log('🔍 DEBUG: activeBuildingCategories =', activeBuildingCategories);
          console.log('🔍 DEBUG: activeBuildingSubcategories =', activeBuildingSubcategories);
          console.log('🔍 DEBUG: selectedWardId =', selectedWardId);
          console.log('🚀 Loading buildings from GeoServer MVT (Vector Tiles) - ultra-fast rendering');
          
          // Show loading indicator
          setIsBuildingsLoading(true);

          // Note: Ward filter changes are handled earlier in the code (line 1366-1400)
          // If we reach this point, it means we need to build the layer (either fresh or after ward filter change)
          
          // Remove existing source if it exists (prevent duplicate source error)
          if (map && map.getSource && map.getSource('buildings')) {
            console.log('🗑️  Removing existing buildings source before re-adding');
            
            // Remove viewport reload event listener (not needed for MVT - tiles auto-load on viewport changes)
            if (buildingsReloadHandlerRef.current) {
              map.off('moveend', buildingsReloadHandlerRef.current);
              buildingsReloadHandlerRef.current = null;
              console.log('🗑️  Removed buildings viewport reload handler (not needed for MVT)');
            }
            
            if (map.getLayer('buildings-fill')) {
              map.removeLayer('buildings-fill');
            }
            if (map.getLayer('buildings-highlight')) {
              map.removeLayer('buildings-highlight');
            }
            if (map.getLayer('buildings')) {
              map.removeLayer('buildings');
            }
            map.removeSource('buildings');
          }

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
          
          // Add CQL filter for ward/barangay/LGU if needed (server-side filtering).
          // The Buildings dataset is keyed by MunName + BrgyName (not the old
          // numeric Ward column), so we mirror the same pattern used by other
          // layers (CWIS / Environmental) here. `extractWardNumber()` returns
          // null for the new BrgyID format, which previously dropped the
          // filter entirely and caused all buildings to render.
          const buildingFilters: string[] = [];
          const munNameForBuildings = (selectedLguName && selectedLguName !== 'all') ? selectedLguName : null;
          const brgyNameForBuildings = (selectedWardName && selectedWardName !== 'all') ? selectedWardName : null;
          if (munNameForBuildings) {
            buildingFilters.push(`MunName='${munNameForBuildings.replace(/'/g, "''")}'`);
          }
          if (brgyNameForBuildings) {
            buildingFilters.push(`BrgyName='${brgyNameForBuildings.replace(/'/g, "''")}'`);
          }
          // Legacy fallback: only use the old Ward=N filter if neither name is
          // available (e.g. selection still in the legacy "ward_15_*" format).
          if (buildingFilters.length === 0 && selectedWardId && selectedWardId !== 'all') {
            const wardNumber = extractWardNumber(selectedWardId);
            if (wardNumber !== null) {
              buildingFilters.push(`Ward=${wardNumber}`);
            }
          }
          if (buildingFilters.length > 0) {
            const cql = buildingFilters.join(' AND ');
            tileUrl += `&CQL_FILTER=${encodeURIComponent(cql)}`;
            console.log(`🔍 Applying buildings CQL filter: ${cql}`);
          }
          
          console.log('📡 Using MVT tiles from GeoServer...');
          console.log('📍 Tile URL template:', tileUrl);
          
          // Show loading indicator
          setIsBuildingsLoading(true);
          console.log('⏳ Buildings loading started - showing loading indicator');
          
          // No fetch needed - MVT tiles are loaded automatically by MapLibre GL
          // Just add the source and layers directly
          try {
            // Check if map still exists
            if (!map || !map.getSource) {
              console.log('ℹ️  Map was destroyed, skipping layer addition');
              setIsBuildingsLoading(false);
              return;
            }
            
            // If source and all layers already exist, skip (concurrent request completed first)
            if (map && map.getSource && map.getSource('buildings') && map.getLayer('buildings') && map.getLayer('buildings-fill') && map.getLayer('buildings-3d') && map.getLayer('buildings-highlight')) {
              console.log('⚠️ Buildings source and layers already exist (added by concurrent request), skipping addition');
              setIsBuildingsLoading(false);
              return;
            }
            
            // If source exists but layers don't, remove source first to rebuild everything
            if (map && map.getSource && map.getSource('buildings')) {
              console.log('🔄 Buildings source exists without complete layers, removing and rebuilding...');
              if (map.getLayer('buildings-fill')) map.removeLayer('buildings-fill');
              if (map.getLayer('buildings-3d')) map.removeLayer('buildings-3d');
              if (map.getLayer('buildings-highlight')) map.removeLayer('buildings-highlight');
              if (map.getLayer('buildings')) map.removeLayer('buildings');
              map.removeSource('buildings');
            }
            
            // Add MVT (Vector Tile) source
            console.log('🔍 DEBUG: Adding buildings MVT source with tileUrl:', tileUrl);
            map.addSource('buildings', {
              type: 'vector',
              tiles: [tileUrl],
              minzoom: 0,
              maxzoom: 22
            });
            console.log('✅ Buildings MVT source added successfully');

            // Add fill layer for click interaction with category-based coloring
            // If Module 1 scenario GIDs are already available, apply scenario coloring immediately
            const _initScenarioGids = scenarioNetworkGidsRef.current;
            const _initBufferBldgIds = bufferBldgIdsRef.current;
            const _initExcludedIds = excludedBldgIdsRef.current;
            const _isSewerMode = activeSewerCategoriesRef.current.length > 0;
            const _hasScenario = _isSewerMode
              ? _initScenarioGids !== null  // sewer mode: non-null means loaded (even if empty)
              : ((_initScenarioGids && _initScenarioGids.length > 0) || (_initBufferBldgIds && _initBufferBldgIds.length > 0));
            const _inNetworkGrid: any = _initExcludedIds.length > 0
              ? ['all', ['in', ['get', 'grid_gid'], ['literal', _initScenarioGids ?? []]], ['!', ['in', ['id'], ['literal', _initExcludedIds]]]]
              : ['in', ['get', 'grid_gid'], ['literal', _initScenarioGids ?? []]];
            const _initBuildingFillColor: any = _hasScenario
              ? [
                  'case',
                  [
                    'any',
                    _inNetworkGrid,
                    ['boolean', ['feature-state', 'inBuffer'], false],
                  ],
                  '#14B8A6',
                  '#F59E0B',
                ]
              : _isSewerMode
              ? '#F59E0B'  // sewer mode loading — flat amber, avoids land-use color flash
              : [
                  'match', ['get', 'use_type'],
                  'Residential', '#f6e717',
                  'Commercial Establishments', '#e40021',
                  'Educational Institutions', '#2963ea',
                  'Health Facilities', '#2bdade',
                  'Government & Civic Services', '#29da11',
                  'Religious Places', '#eb7120',
                  'Industrial', '#94A3B8',
                  'Transport & Logistics', '#7C3AED',
                  '#D4D4D8',
                ];
            const _initOpacity = _isSewerMode
              ? (layerOpacitiesRef.current['grid_sewer'] ?? 0.75)
              : buildingOpacityRef.current;
            map.addLayer({
              id: 'buildings-fill',
              type: 'fill',
              source: 'buildings',
              'source-layer': 'Buildings', // MVT source layer name
              minzoom: 0,
              layout: {
                'visibility': is3DModeRef.current ? 'none' : 'visible' // respect current 3D mode
              },
              paint: {
                'fill-color': _initBuildingFillColor,
                'fill-opacity': _initOpacity
              }
            });

            // Add 3D extrusion layer (for 3D mode) - positioned before highlight layer
            map.addLayer({
              id: 'buildings-3d',
              type: 'fill-extrusion',
              source: 'buildings',
              'source-layer': 'Buildings', // MVT source layer name
              minzoom: 0,
              layout: {
                'visibility': is3DModeRef.current ? 'visible' : 'none' // respect current 3D mode
              },
              paint: {
                'fill-extrusion-color': [
                  'case',
                  ['boolean', ['feature-state', 'hover'], false],
                  '#2563EB', // Innpact blue on hover
                  // Category-based coloring for 3D buildings
                  [
                    'match',
                    ['get', 'use_type'],
                    'Residential', '#f6e717',
                    'Commercial Establishments', '#e40021',
                    'Educational Institutions', '#2963ea',
                    'Health Facilities', '#2bdade',
                    'Government & Civic Services', '#29da11',
                    'Religious Places', '#eb7120',
                    'Industrial', '#94A3B8',
                    'Transport & Logistics', '#7C3AED',
                    '#E2E8F0' // Default light slate-200
                  ]
                ],
                'fill-extrusion-height': [
                  '*', 
                  ['to-number', ['coalesce', ['get', 'floors'], 1]], // Ensure it's a number, get floor count from 'floors' attribute, default to 1
                  4 // Each floor is 4 meters
                ],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': buildingOpacityRef.current,
                'fill-extrusion-vertical-gradient': true
              }
            });

            // Add highlight layer for hover effect (semi-transparent blue fill)
            map.addLayer({
              id: 'buildings-highlight',
              type: 'fill',
              source: 'buildings',
              'source-layer': 'Buildings', // MVT source layer name
              minzoom: 0,
              layout: {
                'visibility': 'visible'
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
            // Position it ABOVE ward boundaries and hazard layers
            map.addLayer({
              id: 'buildings',
              type: 'line',
              source: 'buildings',
              'source-layer': 'Buildings', // MVT source layer name
              minzoom: 0,
              layout: {
                'visibility': 'visible'
              },
              paint: {
                // Category-based darker outline color for better visibility
                'line-color': [
                  'match',
                  ['get', 'use_type'],
                  'Residential', '#dfd229',
                  'Commercial Establishments', '#d41a40',
                  'Educational Institutions', '#1d46a6',
                  'Health Facilities', '#1e989a',
                  'Government & Civic Services', '#24bd0f',
                  'Religious Places', '#a24e16',
                  'Industrial', '#6B7280',
                  'Transport & Logistics', '#5B21B6',
                  '#71717A'
                ],
                // LOD: Optimized line width - scales with zoom level for better visibility
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  11, 0.3,  // Visible at city scale
                  13, 0.5,  // Thicker at intermediate zoom
                  15, 0.7,  // Thicker
                  16, 0.8,  // Thicker
                  18, 1.0   // Thick when zoomed in
                ],
                // LOD: Higher opacity for better visibility at all zoom levels
                'line-opacity': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  11, 0.6,  // More visible at city scale
                  13, 0.7,  // More visible
                  15, 0.8,  // More visible
                  17, 0.9   // Full visibility when zoomed in
                ]
              }
            });
            
            console.log('✅ All 4 building layers added successfully (buildings, buildings-fill, buildings-3d, buildings-highlight)');

            // Track hovered and selected features for highlight effect
            let hoveredBuildingId: string | number | null = null;
            let selectedBuildingId: string | number | null = null;

            // Add hover highlighting effect
            map.on('mousemove', 'buildings-fill', (e) => {
              if (e.features && e.features.length > 0) {
                const featureId = e.features[0].id as string | number;
                
                // Don't change hover if this is the selected building
                if (featureId !== selectedBuildingId && hoveredBuildingId !== featureId) {
                  // Clear previous hover
                  if (hoveredBuildingId !== null && hoveredBuildingId !== selectedBuildingId) {
                    map.setFeatureState(
                      { source: 'buildings', sourceLayer: 'Buildings', id: hoveredBuildingId },
                      { hover: false }
                    );
                  }
                  
                  // Set new hover
                  hoveredBuildingId = featureId;
                  map.setFeatureState(
                    { source: 'buildings', sourceLayer: 'Buildings', id: hoveredBuildingId },
                    { hover: true }
                  );
                }
              }
            });

            // Clear hover state when mouse leaves
            map.on('mouseleave', 'buildings-fill', () => {
              if (hoveredBuildingId !== null && hoveredBuildingId !== selectedBuildingId) {
                map.setFeatureState(
                  { source: 'buildings', sourceLayer: 'Buildings', id: hoveredBuildingId },
                  { hover: false }
                );
              }
              hoveredBuildingId = null;
            });

            // Add hover highlighting effect for 3D buildings
            map.on('mousemove', 'buildings-3d', (e) => {
              if (e.features && e.features.length > 0) {
                const featureId = e.features[0].id as string | number;
                
                // Don't change hover if this is the selected building
                if (featureId !== selectedBuildingId && hoveredBuildingId !== featureId) {
                  // Clear previous hover
                  if (hoveredBuildingId !== null && hoveredBuildingId !== selectedBuildingId) {
                    map.setFeatureState(
                      { source: 'buildings', sourceLayer: 'Buildings', id: hoveredBuildingId },
                      { hover: false }
                    );
                  }
                  
                  // Set new hover
                  hoveredBuildingId = featureId;
                  map.setFeatureState(
                    { source: 'buildings', sourceLayer: 'Buildings', id: hoveredBuildingId },
                    { hover: true }
                  );
                }
                
                // Change cursor to pointer
                map.getCanvas().style.cursor = 'pointer';
              }
            });

            // Clear hover state when mouse leaves 3D buildings
            map.on('mouseleave', 'buildings-3d', () => {
              if (hoveredBuildingId !== null && hoveredBuildingId !== selectedBuildingId) {
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
            
            // Check if click also hit an infrastructure point layer (they should take priority)
            const infrastructureLayerIds = [
              'education-clusters',
              'education-unclustered-point',
              'healthcare-clusters',
              'healthcare-unclustered-point',
              'public-amenities-clusters',
              'public-amenities-unclustered-point',
              'transport-clusters',
              'transport-unclustered-point',
              'irap_vehicle-click',
              'irap_motorcycle-click',
              'irap_bicycle-click',
              'irap_pedestrian-click'
            ];
            
            // Query all features at the click point
            const clickedFeatures = map.queryRenderedFeatures(e.point, {
              layers: infrastructureLayerIds.filter(id => map.getLayer(id)) // Only check layers that exist
            });
            
            // If an infrastructure point was clicked, don't show building popup
            if (clickedFeatures && clickedFeatures.length > 0) {
              console.log('🏢 Building click ignored - infrastructure point clicked instead');
              return;
            }
            
            const feature = e.features[0];
            const props = feature.properties;
            
            console.log('🏢 Building clicked:', props);
            
            // Clear previous selected building highlight if it exists
            if (selectedBuildingId !== null) {
              map.setFeatureState(
                { source: 'buildings', sourceLayer: 'Buildings', id: selectedBuildingId },
                { hover: false }
              );
            }
            
            // Set selected building for persistent highlight
            selectedBuildingId = feature.id as string | number;
            selectedBuildingIdRef.current = selectedBuildingId;
            map.setFeatureState(
              { source: 'buildings', sourceLayer: 'Buildings', id: selectedBuildingId },
              { hover: true }
            );
            
            // Close other popups
            setWardPopupData(null);
            setEducationPopupData(null);
            setHealthcarePopupData(null);
            setPublicAmenitiesPopupData(null);
            setTransportPopupData(null);
            setRoadSafetyPopupData(null);
            
            // Get click coordinates
            const point = map.project(e.lngLat);
            
                setBuildingPopupData({
                  useType: props.use_type || 'N/A',
                  useSub: props.use_sub || 'N/A',
                  bldgName: props.bldg_name || undefined,
                  barangay: props.BrgyName || 'N/A',
                  municipality: props.MunName || 'N/A',
                  floors: props.floors || 'N/A',
                  heightM: props.height_m || 'N/A',
                  areaSqm: props.area_sqm || 'N/A',
                  econVuln: props.econ_vuln || undefined,
                  sewerFeas: props.sewer_feas || undefined,
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
            
            // Check if click also hit an infrastructure point layer (they should take priority)
            const infrastructureLayerIds = [
              'education-clusters',
              'education-unclustered-point',
              'healthcare-clusters',
              'healthcare-unclustered-point',
              'public-amenities-clusters',
              'public-amenities-unclustered-point',
              'transport-clusters',
              'transport-unclustered-point',
              'irap_vehicle-click',
              'irap_motorcycle-click',
              'irap_bicycle-click',
              'irap_pedestrian-click'
            ];
            
            // Query all features at the click point
            const clickedFeatures = map.queryRenderedFeatures(e.point, {
              layers: infrastructureLayerIds.filter(id => map.getLayer(id)) // Only check layers that exist
            });
            
            // If an infrastructure point was clicked, don't show building popup
            if (clickedFeatures && clickedFeatures.length > 0) {
              console.log('🏢 3D Building click ignored - infrastructure point clicked instead');
              return;
            }
            
            const feature = e.features[0];
            const props = feature.properties;
            
            console.log('🏗️ 3D Building clicked:', props);
            
            // Clear previous selected building highlight if it exists
            if (selectedBuildingId !== null) {
              map.setFeatureState(
                { source: 'buildings', sourceLayer: 'Buildings', id: selectedBuildingId },
                { hover: false }
              );
            }
            
            // Set selected building for persistent highlight
            selectedBuildingId = feature.id as string | number;
            selectedBuildingIdRef.current = selectedBuildingId;
            map.setFeatureState(
              { source: 'buildings', sourceLayer: 'Buildings', id: selectedBuildingId },
              { hover: true }
            );
            
            // Close other popups
            setWardPopupData(null);
            setEducationPopupData(null);
            setHealthcarePopupData(null);
            setPublicAmenitiesPopupData(null);
            setTransportPopupData(null);
            setRoadSafetyPopupData(null);
            
            // Get click coordinates
            const point = map.project(e.lngLat);
            
                setBuildingPopupData({
                  useType: props.use_type || 'N/A',
                  useSub: props.use_sub || 'N/A',
                  bldgName: props.bldg_name || undefined,
                  barangay: props.BrgyName || 'N/A',
                  municipality: props.MunName || 'N/A',
                  floors: props.floors || 'N/A',
                  heightM: props.height_m || 'N/A',
                  areaSqm: props.area_sqm || 'N/A',
                  econVuln: props.econ_vuln || undefined,
                  sewerFeas: props.sewer_feas || undefined,
                  lng: e.lngLat.lng,
                  lat: e.lngLat.lat,
                  x: point.x,
                  y: point.y
                });
              });

              // Change cursor on hover for 3D buildings
              map.on('mouseenter', 'buildings-3d', () => {
                map.getCanvas().style.cursor = 'pointer';
              });
              map.on('mouseleave', 'buildings-3d', () => {
                map.getCanvas().style.cursor = '';
              });

            console.log('✅ Buildings MVT source and layers added successfully!');
              
            // MVT tiles load asynchronously - listen for map idle event (fires when all tiles are fully rendered)
            // Keep loading indicator active until map is fully idle with all tiles rendered
            let tilesLoaded = false;
            
            // Use 'idle' event which fires when the map has finished loading everything and is fully rendered
            const onMapIdle = () => {
              if (!tilesLoaded) {
                // Add 500ms post-idle delay — WebGL needs extra time to paint after tiles load
                setTimeout(() => {
                  if (!tilesLoaded) {
                    tilesLoaded = true;
                    console.log('✅ Buildings tiles fully loaded and rendered (map idle + 500ms) - hiding loading indicator');
                    setIsBuildingsLoading(false);
                    
                    // Mark buildings initial load as complete (only on first load)
                    if (isInitialBuildingsLoad.current) {
                      setBuildingsInitialLoadDone(true);
                      isInitialBuildingsLoad.current = false;
                      console.log('🎨 Buildings initial load complete - will trigger initialLoadComplete');
                    }
                    
                    map.off('idle', onMapIdle);
                  }
                }, 500);
              }
            };
            
            map.once('idle', onMapIdle);
            
            // Fallback timeout in case tiles don't load (network issues, etc.)
            setTimeout(() => {
              if (!tilesLoaded) {
                console.log('⏱️ Buildings tile loading timeout (6s) - hiding loading indicator anyway');
                tilesLoaded = true;
                setIsBuildingsLoading(false);
                map.off('idle', onMapIdle);
                
                // Mark initial load complete even on timeout
                if (isInitialBuildingsLoad.current) {
                  setBuildingsInitialLoadDone(true);
                  isInitialBuildingsLoad.current = false;
                }
              }
            }, 6000);
              
            // Verify layers were actually added and set visibility
            setTimeout(() => {
              const buildingsLayer = map.getLayer('buildings');
              const buildingsFillLayer = map.getLayer('buildings-fill');
              const buildings3DLayer = map.getLayer('buildings-3d');
              const buildingsHighlightLayer = map.getLayer('buildings-highlight');
              
              if (buildingsLayer && buildingsFillLayer && buildings3DLayer && buildingsHighlightLayer) {
                // Apply initial filter based on activeBuildingCategories and activeBuildingSubcategories
                console.log('🏢 ===== INITIAL FILTER SETUP =====');
                console.log('🏢 activeBuildingCategories:', activeBuildingCategories);
                console.log('🏢 activeBuildingSubcategories:', activeBuildingSubcategories);
                const categoryMap: Record<string, string> = {
                  'residential': 'Residential',
                  'commercial': 'Commercial & Retail',
                  'tourism': 'Tourism & Hospitality',
                  'education': 'Education & Institutional',
                  'healthcare': 'Healthcare',
                  'government': 'Government & Public Services',
                  'religious': 'Religious & Cultural'
                };
                
                // Map category IDs to their use_type values (for category-level filtering)
                const categoryUseTypeMap: Record<string, string> = {
                  'residential': 'Residential',
                  'commercial': 'Commercial Establishments',
                  'education': 'Educational Institutions',
                  'government': 'Government & Civic Services',
                  'health': 'Health Facilities',
                  'religious': 'Religious Places',
                  'industrial': 'Industrial',
                  'transport': 'Transport & Logistics',
                };
                
                let initialFilter: any;
                
                if (activeBuildingCategories.length === 0 && activeBuildingSubcategories.length === 0) {
                  // No categories/subcategories selected. If the Buildings base layer is
                  // active, show ALL buildings (uniform grey via paint effect); otherwise
                  // hide everything.
                  if (activeBaseLayers.includes('buildings')) {
                    initialFilter = null;
                    console.log('✅ Initial filter: Buildings base layer active w/o categories - showing all buildings');
                  } else {
                    initialFilter = ['==', ['get', 'use_type'], 'NONE_SELECTED'];
                    console.log('🚫 Initial filter: No building categories/subcategories selected - hiding all buildings');
                  }
                } else if (activeBuildingSubcategories.length > 0) {
                  // Subcategories are selected - ONLY show those use_sub values (exclusive filtering)
                  initialFilter = ['in', ['get', 'use_sub'], ['literal', activeBuildingSubcategories]];
                  console.log(`🔍 Initial filter: Filtering EXCLUSIVELY by subcategories (use_sub): ${activeBuildingSubcategories.join(', ')}`);
                } else if (activeBuildingCategories.length === 8) {
                  // All categories selected - show all buildings (no filter)
                  initialFilter = null;
                  console.log('✅ Initial filter: All building categories selected - showing all buildings');
                } else {
                  // Some categories selected, no specific subcategories - filter by use_type
                  const activeUseTypes = activeBuildingCategories
                    .map(id => categoryUseTypeMap[id])
                    .filter(Boolean);
                  
                  initialFilter = ['in', ['get', 'use_type'], ['literal', activeUseTypes]];
                  console.log(`🔍 Initial filter: Categories (${activeBuildingCategories.join(', ')}) → use_type values:`, activeUseTypes);
                }
                
                // Apply initial filter to all building layers
                console.log('🎯 Applying initial filter to buildings layers...');
                console.log('🎯 Filter expression:', JSON.stringify(initialFilter));
                map.setFilter('buildings-fill', initialFilter);
                map.setFilter('buildings-3d', initialFilter);
                map.setFilter('buildings-highlight', initialFilter);
                map.setFilter('buildings', initialFilter);
                console.log('✅ Initial category filter applied to all building layers');
                
                // Set visibility based on whether buildings layer is active, categories or subcategories are selected
                const shouldShowBuildings = activeBaseLayers.includes('buildings') || activeBuildingCategories.length > 0 || activeBuildingSubcategories.length > 0;
                console.log('🔍 DEBUG VISIBILITY: shouldShowBuildings =', shouldShowBuildings);
                console.log('🔍 DEBUG VISIBILITY: activeBuildingCategories.length =', activeBuildingCategories.length);
                console.log('🔍 DEBUG VISIBILITY: activeBuildingSubcategories.length =', activeBuildingSubcategories.length);
                console.log('🔍 DEBUG VISIBILITY: is3DMode =', is3DMode);
                
                map.setLayoutProperty('buildings', 'visibility', shouldShowBuildings && !is3DMode ? 'visible' : 'none');
                map.setLayoutProperty('buildings-fill', 'visibility', shouldShowBuildings && !is3DMode ? 'visible' : 'none');
                map.setLayoutProperty('buildings-3d', 'visibility', shouldShowBuildings && is3DMode ? 'visible' : 'none');
                map.setLayoutProperty('buildings-highlight', 'visibility', shouldShowBuildings ? 'visible' : 'none');
                console.log('🔍 DEBUG AFTER VISIBILITY SET:');
                console.log('  buildings visibility:', shouldShowBuildings && !is3DMode ? 'visible' : 'none');
                console.log('  buildings-fill visibility:', shouldShowBuildings && !is3DMode ? 'visible' : 'none');
                console.log('  buildings-3d visibility:', shouldShowBuildings && is3DMode ? 'visible' : 'none');
                console.log('  buildings-highlight visibility:', shouldShowBuildings ? 'visible' : 'none');
                console.log(`✅ Buildings MVT layers verified and visibility set (${is3DMode ? '3D' : '2D'} mode, shouldShow: ${shouldShowBuildings})`);
                
                // 🔒 FORCE IMMEDIATE TILE REQUEST - Trigger map repaint to ensure tiles are loaded
                // This forces MapLibre GL to immediately request tiles for the current viewport
                map.triggerRepaint();
                console.log('🔄 Forced map repaint to trigger immediate tile loading');
                
                // 🔍 DEBUG: Query building features to check MunName and BrgyName values
                setTimeout(() => {
                  // Check if source exists before querying
                  if (!map.getSource('buildings')) {
                    console.warn('⚠️ Buildings source not yet loaded, skipping debug query');
                    return;
                  }
                  
                  try {
                    const features = map.querySourceFeatures('buildings', {
                      sourceLayer: 'Buildings'
                    });
                  if (features.length > 0) {
                    const uniqueMunNames = new Set<string>();
                    const uniqueBrgyNames = new Set<string>();
                    features.forEach(f => {
                      if (f.properties?.MunName) uniqueMunNames.add(f.properties.MunName);
                      if (f.properties?.BrgyName) uniqueBrgyNames.add(f.properties.BrgyName);
                    });
                    console.log('🔍 DEBUG: Unique MunName values in building data:', Array.from(uniqueMunNames).sort());
                    console.log('🔍 DEBUG: ALL BrgyName values in building data:', Array.from(uniqueBrgyNames).sort());
                    console.log('🔍 DEBUG: Total unique barangays:', uniqueBrgyNames.size);
                    console.log('🔍 DEBUG: Total buildings sampled:', features.length);
                    
                    // Check if "Cogon" exists in any form
                    const cogonBuildings = features.filter(f => {
                      const brgy = f.properties?.BrgyName;
                      return brgy && (brgy === 'Cogon' || brgy === 'cogon' || brgy.toLowerCase() === 'cogon');
                    });
                    console.log(`🔍 DEBUG: Buildings with BrgyName="Cogon" (any case): ${cogonBuildings.length}`);
                    if (cogonBuildings.length > 0) {
                      console.log('🔍 DEBUG: Sample Cogon building properties:', cogonBuildings[0].properties);
                    }
                  }
                  } catch (error) {
                    console.warn('⚠️ Error querying building features:', error);
                  }
                }, 3000);
              } else {
                console.error('❌ Buildings layers not found after addition:', {
                  buildings: !!buildingsLayer,
                  buildingsFill: !!buildingsFillLayer,
                  buildings3D: !!buildings3DLayer,
                  buildingsHighlight: !!buildingsHighlightLayer
                });
              }
              
              // 🔒 Ensure proper layer ordering
              enforceStrictLayerOrder(map);
            }, 50);
              
            // Track which filter signature was used to build this layer.
            // Must match the format used in the rebuild check above.
            buildingsWardRef.current = `${selectedLguName ?? ''}|${selectedWardId ?? ''}|${selectedWardName ?? ''}`;
            console.log(`🔖 Buildings MVT layer built with filter signature: ${buildingsWardRef.current}`);
            
            // MVT Note: No viewport reload handler needed - MVT tiles automatically load based on viewport
            // MapLibre GL requests tiles as user pans/zooms automatically
            console.log('🔄 MVT automatic tile loading enabled - tiles load on demand as user navigates');
            
            // Final verification check
            setTimeout(() => {
              console.log('🔍 FINAL VERIFICATION CHECK:');
              console.log('  buildings source exists:', !!map.getSource('buildings'));
              console.log('  buildings layer exists:', !!map.getLayer('buildings'));
              console.log('  buildings-fill layer exists:', !!map.getLayer('buildings-fill'));
              console.log('  buildings-3d layer exists:', !!map.getLayer('buildings-3d'));
              console.log('  buildings-highlight layer exists:', !!map.getLayer('buildings-highlight'));
              
              if (map.getLayer('buildings')) {
                const visibility = map.getLayoutProperty('buildings', 'visibility');
                console.log('  buildings visibility property:', visibility);
              }
              if (map.getLayer('buildings-fill')) {
                const visibility = map.getLayoutProperty('buildings-fill', 'visibility');
                console.log('  buildings-fill visibility property:', visibility);
              }
            }, 100);
            
            console.log('🏢 ===== BUILDINGS LAYER ACTIVATION COMPLETE =====');
          } catch (error) {
            console.error('❌ Failed to add buildings MVT layer:', error);
            
            // Hide loading indicator
            setIsBuildingsLoading(false);
          }
        } else if (layerId === 'slum_settlements') {
          // ⚠️ DEPRECATED: Old GIZ_BBSR:Slum layer removed - not applicable to Bohol
          // Slum settlements layer disabled until Bohol-specific informal settlements data is available
          console.warn('⚠️ Slum settlements layer not available for Bohol. Layer disabled.');
          setIsLayerLoading(false);
          return;
          
          // OLD CODE (GIZ_BBSR reference removed):
          // const wfsUrl = 'https://geoserver.azure.innpact.ai/geoserver/GIZ_BBSR/ows';
          // let url = `${wfsUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=GIZ_BBSR:Slum&outputFormat=application/json&srsName=EPSG:4326`;

          // Add CQL filter for ward if needed
          if (selectedWardId && selectedWardId !== 'all') {
            const wardNumber = extractWardNumber(selectedWardId);
            if (wardNumber !== null) {
              const cqlFilter = `Ward=${wardNumber}`;
              url += `&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
              console.log(`🔍 Applying ward filter to slum: Ward ${wardNumber}`);
            }
          }

          try {
            console.log('📡 Fetching slum data from:', url);
            const response = await fetch(url);
            const geojson = await response.json();
            console.log('✅ Slum data loaded:', geojson.features?.length, 'features');

            if (isStale()) { console.log('⚠️ addBaseLayers: stale after slum fetch, aborting'); return; }

            // Check if map still exists and is ready after async fetch
            if (!map || !map.getSource) {
              console.log('⚠️ Map was destroyed during slum fetch, skipping layer addition');
              return;
            }

            // Remove existing source if it exists (prevent duplicate source error)
            if (map.getSource('slum_settlements')) {
              console.log('🗑️  Removing existing slum_settlements source before re-adding');
              if (map.getLayer('slum_settlements')) {
                map.removeLayer('slum_settlements');
              }
              map.removeSource('slum_settlements');
            }

            // Add source
            map.addSource('slum_settlements', {
              type: 'geojson',
              data: geojson
            });

            // Slum layer should be above hazard layers but below road network
            // Find road_network_link layer as the reference point (lowest road layer)
            const roadNetworkLayerId = 'road_network_link';
            const beforeLayerId = map.getLayer(roadNetworkLayerId) ? roadNetworkLayerId : getFirstLabelLayerId(map);

            // Add slum layer with outline only (no fill)
            map.addLayer({
              id: 'slum_settlements',
              type: 'line',
              source: 'slum_settlements',
              paint: {
                'line-color': '#8B5CF6', // Purple color matching the layer config
                'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 12, 2, 14, 2.5, 16, 3, 18, 3.5],
                'line-opacity': 0.8
              }
            }, beforeLayerId);

            console.log('✅ Slum layer added with outline only');
            
            // 🔒 Ensure proper layer ordering after adding slum
            setTimeout(() => {
              enforceStrictLayerOrder(map);
            }, 100);
          } catch (error) {
            console.error('❌ Error loading slum layer:', error);
          }
        } else if (layerId === 'waterbody') {
          // ⚠️ DEPRECATED: Old GIZ_BBSR:Waterbody layer removed
          // Waterbody layer disabled until Bohol waterbody data is connected
          console.warn('⚠️ Waterbody layer not available for Bohol. Layer disabled. Skipping to next layer.');
          setIsLayerLoading(false);
          continue; // Skip this layer and continue with remaining layers (e.g., buildings)
          
          // OLD CODE (GIZ_BBSR reference removed):
          // const wfsUrl = 'https://geoserver.azure.innpact.ai/geoserver/GIZ_BBSR/ows';
          // let url = `${wfsUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=GIZ_BBSR:Waterbody&outputFormat=application/json&srsName=EPSG:4326`;

          // Add CQL filter for ward if needed
          if (selectedWardId && selectedWardId !== 'all') {
            const wardNumber = extractWardNumber(selectedWardId);
            if (wardNumber !== null) {
              const cqlFilter = `Ward=${wardNumber}`;
              url += `&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
              console.log(`🔍 Applying ward filter to waterbody: Ward ${wardNumber}`);
            }
          }

          try {
            console.log('📡 Fetching waterbody data from:', url);
            const response = await fetch(url);
            const geojson = await response.json();
            console.log('✅ Waterbody data loaded:', geojson.features?.length, 'features');

            if (isStale()) { console.log('⚠️ addBaseLayers: stale after waterbody fetch, aborting'); return; }

            // Check if map still exists and has valid style after async fetch
            if (!map || !map.getSource || !map.getStyle || !map.getStyle()) {
              console.log('⚠️ Map was destroyed or style lost during waterbody fetch, skipping layer addition');
              return;
            }

            // Remove existing source if it exists (prevent duplicate source error)
            try {
              if (map.getSource('waterbody')) {
                console.log('🗑️  Removing existing waterbody source before re-adding');
                if (map.getLayer('waterbody')) {
                  map.removeLayer('waterbody');
                }
                map.removeSource('waterbody');
              }
            } catch (error) {
              console.warn('⚠️ Error checking/removing existing waterbody layer:', error);
            }

            // Add source
            map.addSource('waterbody', {
              type: 'geojson',
              data: geojson
            });

            // Waterbody layer should be just below ward boundary and above hazard layers
            // Find ward-boundaries-fill layer as the reference point
            const wardFillLayerId = 'ward-boundaries-fill';
            const beforeLayerId = map.getLayer(wardFillLayerId) ? wardFillLayerId : getFirstLabelLayerId(map);

            // Add waterbody layer with fill
            map.addLayer({
              id: 'waterbody',
              type: 'fill',
              source: 'waterbody',
              paint: {
                'fill-color': '#3B82F6', // Blue color
                'fill-opacity': 0.5
              }
            }, beforeLayerId);

            console.log('✅ Waterbody layer added');
            
            // 🔒 Ensure proper layer ordering after adding waterbody
            setTimeout(() => {
              if (map && map.getStyle && map.getStyle()) {
                enforceStrictLayerOrder(map);
              }
            }, 100);
          } catch (error) {
            // Silently handle fetch errors - expected when backend is unavailable
            console.log('ℹ️  Waterbody layer not available (backend not connected)');
          }
        } else if (layerId === 'builtup_density') {
          // Load Grid layer as WMS MVT vector tiles, coloured by den_type
          console.log('🟩 Adding built-up density (Grid) layer as WMS MVT');
          try {
            // Clean up any pre-existing layers/source
            if (map.getLayer('builtup-density-fill'))    map.removeLayer('builtup-density-fill');
            if (map.getLayer('builtup-density-outline'))  map.removeLayer('builtup-density-outline');
            if (map.getSource('builtup_density'))          map.removeSource('builtup_density');

            const gridTileUrl =
              'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/wms' +
              '?service=WMS&version=1.1.0&request=GetMap' +
              '&layers=WorldBank_Bohol:Grid' +
              '&bbox={bbox-epsg-3857}' +
              '&width=512&height=512' +
              '&srs=EPSG:3857' +
              '&format=application/vnd.mapbox-vector-tile';

            map.addSource('builtup_density', {
              type: 'vector',
              tiles: [gridTileUrl],
              minzoom: 0,
              maxzoom: 22,
            });

            map.addLayer({
              id: 'builtup-density-fill',
              type: 'fill',
              source: 'builtup_density',
              'source-layer': 'Grid',
              paint: {
                'fill-color': [
                  'match', ['get', 'den_type'],
                  'No Buildings',  '#E2E8F0',
                  'Low Density',   '#86EFAC',
                  'Medium Density','#FCD34D',
                  'High Density',  '#F97316',
                  '#E2E8F0',
                ],
                'fill-opacity': 0.7,
              },
            });

            console.log('✅ Built-up density (Grid) MVT layer added');
            setTimeout(() => {
              if (map && map.getStyle && map.getStyle()) {
                enforceStrictLayerOrder(map);
              }
            }, 100);
          } catch (error) {
            console.error('❌ Failed to add builtup_density Grid MVT layer:', error);
          }
        } else if (layerId === 'watershed') {
          // Handle watershed as vector layer with WFS (blue outline only, no fill)
          console.log('💧 Adding watershed layer as vector layer');

          // Build WFS request for GeoJSON
          const wfsUrl = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows';
          let url = `${wfsUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Watershed&outputFormat=application/json&srsName=EPSG:4326`;

          // Add CQL filter for ward if needed
          if (selectedWardId && selectedWardId !== 'all') {
            const wardNumber = extractWardNumber(selectedWardId);
            if (wardNumber !== null) {
              const cqlFilter = `Ward=${wardNumber}`;
              url += `&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
              console.log(`🔍 Applying ward filter to watershed: Ward ${wardNumber}`);
            }
          }

          try {
            console.log('📡 Fetching watershed data from:', url);
            const response = await fetch(url);
            const geojson = await response.json();
            console.log('✅ Watershed data loaded:', geojson.features?.length, 'features');

            if (isStale()) { console.log('⚠️ addBaseLayers: stale after watershed fetch, aborting'); return; }

            // Check if map still exists and has valid style after async fetch
            if (!map || !map.getSource || !map.getStyle || !map.getStyle()) {
              console.log('⚠️ Map was destroyed or style lost during watershed fetch, skipping layer addition');
              return;
            }

            // Remove existing source if it exists (prevent duplicate source error)
            try {
              if (map.getSource('watershed')) {
                console.log('🗑️  Removing existing watershed source before re-adding');
                if (map.getLayer('watershed-labels')) {
                  map.removeLayer('watershed-labels');
                }
                if (map.getLayer('watershed')) {
                  map.removeLayer('watershed');
                }
                map.removeSource('watershed');
              }
              if (map.getSource('watershed-point')) {
                map.removeSource('watershed-point');
              }
              if (map.getSource('drainage')) {
                if (map.getLayer('drainage')) {
                  map.removeLayer('drainage');
                }
                map.removeSource('drainage');
              }
              if (map.getSource('drain-outfall')) {
                if (map.getLayer('drain-outfall-inner')) {
                  map.removeLayer('drain-outfall-inner');
                }
                if (map.getLayer('drain-outfall-red')) {
                  map.removeLayer('drain-outfall-red');
                }
                if (map.getLayer('drain-outfall-outer')) {
                  map.removeLayer('drain-outfall-outer');
                }
                if (map.getLayer('drain-outfall-glow')) {
                  map.removeLayer('drain-outfall-glow');
                }
                map.removeSource('drain-outfall');
              }
            } catch (error) {
              console.warn('⚠️ Error checking/removing existing watershed layer:', error);
            }

            // Add source
            map.addSource('watershed', {
              type: 'geojson',
              data: geojson
            });

            // Watershed layer should be on top of all layers (including ward/municipal boundaries)
            // Position it right before the first label layer
            const beforeLayerId = getFirstLabelLayerId(map);

            // Add watershed layer with outline only (no fill)
            map.addLayer({
              id: 'watershed',
              type: 'line',
              source: 'watershed',
              paint: {
                'line-color': '#2563EB', // Darker blue - more visible
                'line-width': 1.0,
                'line-opacity': 0.75 // Slightly higher opacity
              }
            }, beforeLayerId);

            console.log('✅ Watershed layer added');
            
            // Fetch drainage data and add as part of watershed base layer
            const drainageUrl = `${wfsUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Drainage&outputFormat=application/json&srsName=EPSG:4326`;
            console.log('📡 Fetching drainage data from:', drainageUrl);
            
            fetch(drainageUrl)
              .then(response => response.json())
              .then(drainageGeojson => {
                if (!drainageGeojson) return;
                
                // Add Drainage source
                if (!map.getSource('drainage')) {
                  map.addSource('drainage', {
                    type: 'geojson',
                    data: drainageGeojson
                  });
                  console.log('✅ Drainage source added');
                }
                
                // Add drainage line layer with data-driven styling based on grid_code
                // grid_code 1-5 represents stream order (1=small streams, 5=major streams)
                if (!map.getLayer('drainage')) {
                  map.addLayer({
                    id: 'drainage',
                    type: 'line',
                    source: 'drainage',
                    paint: {
                      // Color gradient from light blue (small streams) to dark blue (major streams)
                      'line-color': [
                        'match',
                        ['get', 'grid_code'],
                        1, '#B3E5FC', // Very light blue - smallest streams
                        2, '#64B5F6', // Light blue
                        3, '#2196F3', // Medium blue
                        4, '#1E88E5', // Medium-dark blue
                        5, '#1565C0', // Dark blue - major streams
                        '#81D4FA' // Default fallback
                      ],
                      // Line width increases with stream order
                      'line-width': [
                        'match',
                        ['get', 'grid_code'],
                        1, 1.0,  // Thinnest for small streams
                        2, 1.5,
                        3, 2.0,
                        4, 2.5,
                        5, 3.0,  // Thickest for major streams
                        1.5      // Default fallback
                      ],
                      'line-opacity': 0.8
                    }
                  }, beforeLayerId);
                  console.log('✅ Drainage layer added with data-driven styling based on grid_code');
                }
                
                // 🔒 Ensure proper layer ordering after adding drainage
                setTimeout(() => {
                  if (map && map.getStyle && map.getStyle()) {
                    enforceStrictLayerOrder(map);
                  }
                }, 50);
              })
              .catch(error => {
                console.log('ℹ️  Drainage data not available:', error);
              });
            
            // Fetch drain outfall point data
            const drainOutfallUrl = `${wfsUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Drain_Outfall&outputFormat=application/json&srsName=EPSG:4326`;
            console.log('📡 Fetching drain outfall point data from:', drainOutfallUrl);
            
            fetch(drainOutfallUrl)
              .then(response => response.json())
              .then(drainOutfallGeojson => {
                if (!drainOutfallGeojson) return;
                
                // Add Drain_Outfall source
                if (!map.getSource('drain-outfall')) {
                  map.addSource('drain-outfall', {
                    type: 'geojson',
                    data: drainOutfallGeojson
                  });
                  console.log('✅ Drain_Outfall source added');
                }
                
                // Add drain outfall point layer - outer glow (subtle shadow effect)
                // NOTE: Not using beforeLayerId to ensure outfall points appear on top of boundaries
                if (!map.getLayer('drain-outfall-glow')) {
                  map.addLayer({
                    id: 'drain-outfall-glow',
                    type: 'circle',
                    source: 'drain-outfall',
                    paint: {
                      'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        10, 5,    // Bigger at low zoom
                        14, 8,    // Medium
                        18, 11    // Larger at high zoom
                      ],
                      'circle-color': '#DC2626', // Dark red glow
                      'circle-opacity': 0.3,
                      'circle-blur': 0.8
                    }
                  });
                  console.log('✅ Drain outfall glow added');
                }
                
                // Add drain outfall point layer - white outer ring
                if (!map.getLayer('drain-outfall-outer')) {
                  map.addLayer({
                    id: 'drain-outfall-outer',
                    type: 'circle',
                    source: 'drain-outfall',
                    paint: {
                      'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        10, 4,    // Bigger at low zoom
                        14, 6.5,  // Medium
                        18, 9     // Larger at high zoom
                      ],
                      'circle-color': '#FFFFFF', // White outer ring
                      'circle-opacity': 1
                    }
                  });
                  console.log('✅ Drain outfall outer ring added');
                }
                
                // Add drain outfall point layer - main red circle
                if (!map.getLayer('drain-outfall-red')) {
                  map.addLayer({
                    id: 'drain-outfall-red',
                    type: 'circle',
                    source: 'drain-outfall',
                    paint: {
                      'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        10, 3.5,  // Bigger at low zoom
                        14, 5.5,  // Medium
                        18, 7.5   // Larger at high zoom
                      ],
                      'circle-color': '#DC2626', // Darker, richer red
                      'circle-opacity': 1
                    }
                  });
                  console.log('✅ Drain outfall red circle added');
                }
                
                // Add drain outfall point layer - inner highlight dot
                if (!map.getLayer('drain-outfall-inner')) {
                  map.addLayer({
                    id: 'drain-outfall-inner',
                    type: 'circle',
                    source: 'drain-outfall',
                    paint: {
                      'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        10, 1.2,  // Bigger at low zoom
                        14, 1.8,  // Medium
                        18, 2.5   // Larger at high zoom
                      ],
                      'circle-color': '#FCA5A5', // Light red/pink highlight
                      'circle-opacity': 0.9
                    }
                  });
                  console.log('✅ Drain outfall inner highlight added');
                }
                
                // 🔒 Ensure proper layer ordering after adding drain outfall
                setTimeout(() => {
                  if (map && map.getStyle && map.getStyle()) {
                    enforceStrictLayerOrder(map);
                  }
                }, 50);
              })
              .catch(error => {
                console.log('ℹ️  Drain outfall data not available:', error);
              });
            
            // Fetch watershed point data for labels
            const watershedPointUrl = `${wfsUrl}?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Watershed_Point&outputFormat=application/json&srsName=EPSG:4326`;
            console.log('📡 Fetching watershed point data for labels from:', watershedPointUrl);
            
            fetch(watershedPointUrl)
              .then(response => response.json())
              .then(watershedPointGeojson => {
                if (!watershedPointGeojson) return;
                
                // Add Watershed_Point source
                if (!map.getSource('watershed-point')) {
                  map.addSource('watershed-point', {
                    type: 'geojson',
                    data: watershedPointGeojson
                  });
                  console.log('✅ Watershed_Point source added');
                }
                
                // Add watershed label layer using Watershed_Point source
                if (!map.getLayer('watershed-labels')) {
                  map.addLayer({
                    id: 'watershed-labels',
                    type: 'symbol',
                    source: 'watershed-point',
                    minzoom: 10,
                    layout: {
                      'text-field': ['concat', 'Watershed - ', ['get', 'Watershed_ID']], // Concatenate "Watershed - " with Watershed_ID field
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
                      'text-color': '#1E40AF', // Darker blue to match watershed line
                      'text-halo-color': '#FFFFFF',
                      'text-halo-width': 2,
                      'text-halo-blur': 1
                    }
                  }, beforeLayerId);
                  console.log('✅ Watershed labels added');
                }
                
                // 🔒 Ensure proper layer ordering after adding labels
                setTimeout(() => {
                  if (map && map.getStyle && map.getStyle()) {
                    enforceStrictLayerOrder(map);
                  }
                }, 50);
              })
              .catch(error => {
                console.log('ℹ️  Watershed point data not available:', error);
              });
            
            // 🔒 Ensure proper layer ordering after adding watershed
            setTimeout(() => {
              if (map && map.getStyle && map.getStyle()) {
                enforceStrictLayerOrder(map);
              }
            }, 100);
          } catch (error) {
            // Silently handle fetch errors - expected when backend is unavailable
            console.log('ℹ️  Watershed layer not available (backend not connected)');
          }
        } else {
          // Handle other base layers as raster (if any)
          const layerConfig = geoserverLayers[layerId];
          if (!layerConfig) {
            console.warn('❌ No GeoServer config found for base layer:', layerId);
            return;
          }

          const geoserverLayerName = layerConfig.geoserverLayer;
          console.log('✅ Adding base layer:', layerId, '→', geoserverLayerName);

          // Extract ward number from selectedWardId if filtering is active
          let wardNumberForFilter: number | null = null;
          if (selectedWardId && selectedWardId !== 'all') {
            wardNumberForFilter = extractWardNumber(selectedWardId);
            if (wardNumberForFilter !== null) {
              console.log(`🔍 Applying ward filter to base layer: Ward ${wardNumberForFilter}`);
            } else {
              wardNumberForFilter = null;
            }
          }

          // Get the WMS tile URL with optional ward filter, LGU filter, and barangay filter
          const brgyNameForFilter = (selectedWardName && selectedWardName !== 'all') ? selectedWardName : null;
          const tileUrl = getWMSTileUrl(geoserverLayerName, wardNumberForFilter, false, null, selectedLguName, brgyNameForFilter);
          console.log('📡 Base Layer WMS Tile URL:', tileUrl);

          // Add raster source
          map.addSource(layerId, {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
            minzoom: 0,
            maxzoom: 18
          });

          console.log('✅ Base layer source added:', layerId);

          // Find the first label layer to insert base layers below labels
          const firstLabelLayerId = getFirstLabelLayerId(map);

          // Add raster layer below labels
          map.addLayer({
            id: layerId,
            type: 'raster',
            source: layerId,
            paint: {
              'raster-opacity': layerConfig.opacity
            }
          }, firstLabelLayerId);

          console.log('✅ Base layer added to map:', layerId, firstLabelLayerId ? `(below ${firstLabelLayerId})` : '(on top)');

          // Show loading indicator while tiles are fetched from GeoServer
          setIsLayerLoading(true);
          map.triggerRepaint();
          let rasterAddTimeout: ReturnType<typeof setTimeout>;
          const onRasterAdded = () => {
            clearTimeout(rasterAddTimeout);
            setIsLayerLoading(false);
          };
          map.once('idle', onRasterAdded);
          rasterAddTimeout = setTimeout(() => {
            map.off('idle', onRasterAdded);
            setIsLayerLoading(false);
          }, 8000);

          // Stamp the filter key so we can detect changes and force a tile refresh next time
          rasterLayerFilterRef.current[layerId] = `${selectedLguName}|${selectedWardId}|${selectedWardName}`;
          
          // 🔒 ENFORCE STRICT LAYER ORDER - Critical for base layers (elevation, green_cover, built_up)
          // Base layers have priority 150 and must be positioned below road network (610)
          setTimeout(() => {
            if (map && map.getStyle && map.getStyle()) {
              enforceStrictLayerOrder(map);
              console.log('✅ Layer ordering enforced for base layer:', layerId);
            }
          }, 100);
        }
      }
    };

    // Wait for map style to be loaded before adding layers
    if (map.isStyleLoaded()) {
      addBaseLayers();
    } else {
      map.once('styledata', addBaseLayers);
    }

  }, [activeBaseLayers, activeBuildingCategories, activeBuildingSubcategories, mapReady, selectedWardId, selectedWardName, selectedLguName, styleLoadCounter, is3DMode]);

  // Control ward boundary layer visibility based on activeBaseLayers
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;
    const isWardBoundaryActive = activeBaseLayers.includes('ward_boundary');
    
    // Ward boundary layer IDs
    const wardLayerIds = ['ward-boundaries', 'ward-boundaries-fill', 'ward-boundaries-highlight', 'ward-labels'];
    
    wardLayerIds.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', isWardBoundaryActive ? 'visible' : 'none');
      }
    });

    // Carto Positron groups sub-municipal place labels into these three layers.
    // They only contain barangay/village/hamlet/suburb features, so we hide them
    // outright when our ward boundary layer is on. Municipality/city/town
    // labels live in separate layers (place_town, place_city_*) and are kept.
    const SUB_MUNICIPAL_LAYERS = ['place_hamlet', 'place_suburbs', 'place_villages', 'place_suburb', 'place_village', 'place_neighbourhood'];

    const applySubMunicipalVisibility = () => {
      let applied = 0;
      let missing = 0;
      SUB_MUNICIPAL_LAYERS.forEach(id => {
        if (map.getLayer(id)) {
          try {
            map.setLayoutProperty(id, 'visibility', isWardBoundaryActive ? 'none' : 'visible');
            applied++;
          } catch (err) {
            console.warn(`⚠️  Could not toggle visibility on ${id}:`, err);
          }
        } else {
          missing++;
        }
      });
      return { applied, missing };
    };

    const initial = applySubMunicipalVisibility();
    console.log(
      `🗺️  Ward boundary ${isWardBoundaryActive ? 'ON' : 'OFF'}; sub-municipal labels ${isWardBoundaryActive ? 'hidden' : 'shown'} ` +
      `(applied to ${initial.applied} layers, ${initial.missing} not yet in style)`
    );

    // Re-apply whenever the style mutates (other layers being added/removed,
    // basemap switches, idle events after tile loads, etc.). This guarantees
    // the sub-municipal labels stay hidden even if MapLibre internally resets
    // their visibility, and catches the case where the layers weren't yet
    // present on initial run.
    const reapply = () => { applySubMunicipalVisibility(); };
    map.on('styledata', reapply);
    map.on('idle', reapply);

    return () => {
      map.off('styledata', reapply);
      map.off('idle', reapply);
    };
  }, [activeBaseLayers, mapReady, styleLoadCounter]);

  // Control municipal boundary layer visibility based on activeBaseLayers
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;
    const isMunicipalBoundaryActive = activeBaseLayers.includes('municipal_boundary');
    
    // Municipal boundary layer IDs (line and border)
    const municipalLayerId = 'municipal-boundary';
    const municipalBorderLayerId = 'municipal-boundary-border';
    
    if (map.getLayer(municipalLayerId)) {
      map.setLayoutProperty(municipalLayerId, 'visibility', isMunicipalBoundaryActive ? 'visible' : 'none');
    }
    
    // Also control the border layer
    if (map.getLayer(municipalBorderLayerId)) {
      map.setLayoutProperty(municipalBorderLayerId, 'visibility', isMunicipalBoundaryActive ? 'visible' : 'none');
    }
    
    console.log(`🗺️  Municipal boundary layer ${isMunicipalBoundaryActive ? 'shown' : 'hidden'}`);
  }, [activeBaseLayers, mapReady]);

  // Control 360° panorama pins layer visibility based on activeBaseLayers
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;
    const isActive = activeBaseLayers.includes('panorama_images');
    const vis = isActive ? 'visible' : 'none';
    if (map.getLayer('panorama-pins-layer'))  map.setLayoutProperty('panorama-pins-layer',  'visibility', vis);
    if (map.getLayer('panorama-pins-shadow')) map.setLayoutProperty('panorama-pins-shadow', 'visibility', vis);
    // Clear any lingering hover state when toggling off
    if (!isActive) setPanoramaHoverLabel(null);
  }, [activeBaseLayers, mapReady]);

  // Close ward popup when layer changes
  useEffect(() => {
    if (wardPopupRef.current) {
      wardPopupRef.current.remove();
      wardPopupRef.current = null;
      console.log('🗑️  Ward popup closed due to layer change');
    }
    // Also close React-based ward popup and clear highlight
    setWardPopupData(null);
    setSelectedWardNumber(null);
  }, [activeLayerId, activeSector, activeInfraLayers]);

  // Close education popup when layer changes or when educational layer is turned off
  useEffect(() => {
    // Clear React-based education popup data
    setEducationPopupData(null);
    console.log('🗑️  Education popup closed due to layer change');
  }, [activeLayerId, activeSector, activeInfraLayers]);

  // Close healthcare popup when layer changes or when healthcare layer is turned off
  useEffect(() => {
    // Clear React-based healthcare popup data
    setHealthcarePopupData(null);
    console.log('🗑️  Healthcare popup closed due to layer change');
  }, [activeLayerId, activeSector, activeInfraLayers]);

  // Close public amenities popup when layer changes or when public amenities layer is turned off
  useEffect(() => {
    // Clear React-based public amenities popup data
    setPublicAmenitiesPopupData(null);
    console.log('🗑️  Public amenities popup closed due to layer change');
  }, [activeLayerId, activeSector, activeInfraLayers]);

  // Close transport popup when layer changes or when transport layer is turned off
  useEffect(() => {
    // Clear React-based transport popup data
    setTransportPopupData(null);
    console.log('🗑️  Transport popup closed due to layer change');
  }, [activeLayerId, activeSector, activeInfraLayers]);

  // Update ward boundary highlight when selected ward changes
  useEffect(() => {
    console.log('🔄 Ward highlight useEffect triggered - selectedWardNumber:', selectedWardNumber, 'mapReady:', mapReady);
    
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;
    
    // Validate map style is available
    if (!map.getStyle()) {
      console.warn('⚠️ Map style not available yet, skipping ward highlight');
      return;
    }
    
    const highlightLayerId = 'ward-boundaries-highlight';
    
    console.log('🔍 Checking if highlight layer exists:', map.getLayer(highlightLayerId) ? 'YES' : 'NO');
    
    // Check if highlight layer exists - it may not be loaded yet if WFS is still fetching
    if (!map.getLayer(highlightLayerId)) {
      // Layer not ready yet - wait for it to be added
      const checkLayerInterval = setInterval(() => {
        // Validate map still exists and has style
        if (!mapRef.current || !mapRef.current.getStyle()) {
          clearInterval(checkLayerInterval);
          console.warn('⚠️ Map or style lost during ward highlight polling, stopping');
          return;
        }
        
        const currentMap = mapRef.current;
        
        try {
          if (currentMap.getLayer(highlightLayerId)) {
            clearInterval(checkLayerInterval);
            // Layer is now available, apply the filter
            if (selectedWardNumber) {
              // For Bohol, prioritize BrgyID field matching (unique ID prevents duplicate name issues)
              const wardNum = parseInt(selectedWardNumber);
              const isNumeric = !isNaN(wardNum);
              
              currentMap.setFilter(highlightLayerId, [
                'any',
                // PRIORITY 1: Bohol barangay unique ID fields (PRIMARY - prevents duplicate name issues)
                ['==', ['get', 'BrgyID'], selectedWardNumber],
                ['==', ['get', 'Brgy_ID'], selectedWardNumber],
                ['==', ['get', 'BRGYID'], selectedWardNumber],
                ['==', ['get', 'brgy_id'], selectedWardNumber],
                // PRIORITY 2: Barangay code fields
                ['==', ['get', 'BrgyCode'], selectedWardNumber],
                ['==', ['get', 'Brgy_Code'], selectedWardNumber],
                ['==', ['get', 'BRGYCODE'], selectedWardNumber],
                ['==', ['get', 'brgy_code'], selectedWardNumber],
                // PRIORITY 3: Barangay name fields (fallback - may match multiple if duplicate names exist)
                ['==', ['get', 'BrgyName'], selectedWardNumber],
                ['==', ['get', 'Brgy_Name'], selectedWardNumber],
                ['==', ['get', 'BRGYNAME'], selectedWardNumber],
                ['==', ['get', 'brgy_name'], selectedWardNumber],
                // Fallback: Standard ward fields
                ['==', ['get', 'Ward'], selectedWardNumber],
                ['==', ['get', 'WARD'], selectedWardNumber],
                ['==', ['get', 'ward'], selectedWardNumber],
                ['==', ['get', 'Ward_No'], selectedWardNumber],
                ['==', ['get', 'WARD_NO'], selectedWardNumber],
                ['==', ['get', 'ward_no'], selectedWardNumber],
                ['==', ['get', 'WardNo'], selectedWardNumber],
                ['==', ['get', 'WARDNO'], selectedWardNumber],
                // Also try numeric comparison (for backward compatibility)
                ...(isNumeric ? [
                  ['==', ['get', 'BrgyID'], wardNum],
                  ['==', ['get', 'Brgy_ID'], wardNum],
                  ['==', ['get', 'BRGYID'], wardNum],
                  ['==', ['get', 'brgy_id'], wardNum],
                  ['==', ['get', 'BrgyCode'], wardNum],
                  ['==', ['get', 'Brgy_Code'], wardNum],
                  ['==', ['get', 'BRGYCODE'], wardNum],
                  ['==', ['get', 'brgy_code'], wardNum],
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
              console.log('🎨 Ward highlight filter updated (polling) for BrgyID:', selectedWardNumber, '(numeric:', wardNum, ')');
            } else {
              currentMap.setFilter(highlightLayerId, ['==', ['get', 'Ward'], '']);
              console.log('🎨 Ward highlight cleared (polling)');
            }
          }
        } catch (error) {
          console.warn('⚠️ Error checking layer in ward highlight polling:', error);
          clearInterval(checkLayerInterval);
        }
      }, 100);
      
      // Clean up interval after 5 seconds if layer never appears
      setTimeout(() => clearInterval(checkLayerInterval), 5000);
      
      // Return cleanup function
      return () => {
        clearInterval(checkLayerInterval);
      };
    }
    
    // Update filter to show only the selected ward
    if (selectedWardNumber) {
      // For Bohol, prioritize BrgyID field matching (unique ID prevents duplicate name issues)
      // Also try both string and numeric comparisons for backward compatibility
      const wardNum = parseInt(selectedWardNumber);
      const isNumeric = !isNaN(wardNum);
      
      map.setFilter(highlightLayerId, [
        'any',
        // PRIORITY 1: Bohol barangay unique ID fields (PRIMARY - prevents duplicate name issues)
        ['==', ['get', 'BrgyID'], selectedWardNumber],
        ['==', ['get', 'Brgy_ID'], selectedWardNumber],
        ['==', ['get', 'BRGYID'], selectedWardNumber],
        ['==', ['get', 'brgy_id'], selectedWardNumber],
        // PRIORITY 2: Barangay code fields
        ['==', ['get', 'BrgyCode'], selectedWardNumber],
        ['==', ['get', 'Brgy_Code'], selectedWardNumber],
        ['==', ['get', 'BRGYCODE'], selectedWardNumber],
        ['==', ['get', 'brgy_code'], selectedWardNumber],
        // PRIORITY 3: Barangay name fields (fallback - may match multiple if duplicate names exist)
        ['==', ['get', 'BrgyName'], selectedWardNumber],
        ['==', ['get', 'Brgy_Name'], selectedWardNumber],
        ['==', ['get', 'BRGYNAME'], selectedWardNumber],
        ['==', ['get', 'brgy_name'], selectedWardNumber],
        // Fallback: Standard ward fields
        ['==', ['get', 'Ward'], selectedWardNumber],
        ['==', ['get', 'WARD'], selectedWardNumber],
        ['==', ['get', 'ward'], selectedWardNumber],
        ['==', ['get', 'Ward_No'], selectedWardNumber],
        ['==', ['get', 'WARD_NO'], selectedWardNumber],
        ['==', ['get', 'ward_no'], selectedWardNumber],
        ['==', ['get', 'WardNo'], selectedWardNumber],
        ['==', ['get', 'WARDNO'], selectedWardNumber],
        // Also try numeric comparison if ward number is numeric (for backward compatibility)
        ...(isNumeric ? [
          ['==', ['get', 'BrgyID'], wardNum],
          ['==', ['get', 'Brgy_ID'], wardNum],
          ['==', ['get', 'BRGYID'], wardNum],
          ['==', ['get', 'brgy_id'], wardNum],
          ['==', ['get', 'BrgyCode'], wardNum],
          ['==', ['get', 'Brgy_Code'], wardNum],
          ['==', ['get', 'BRGYCODE'], wardNum],
          ['==', ['get', 'brgy_code'], wardNum],
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
      console.log('🎨 Ward highlight filter updated for BrgyID:', selectedWardNumber, '(numeric:', wardNum, ')');
      
      // Verify the filter was applied and check layer visibility
      const appliedFilter = map.getFilter(highlightLayerId);
      const layerStyle = map.getPaintProperty(highlightLayerId, 'line-color');
      console.log('✅ Filter applied:', JSON.stringify(appliedFilter));
      console.log('✅ Layer color:', layerStyle, 'Width:', map.getPaintProperty(highlightLayerId, 'line-width'));
    } else {
      // Clear highlight (show nothing)
      map.setFilter(highlightLayerId, ['==', ['get', 'Ward'], '']);
      console.log('🎨 Ward highlight cleared');
    }
  }, [selectedWardNumber, mapReady]);

  // Reset map view to default extent when resetMapViewTrigger changes
  useEffect(() => {
    if (!mapRef.current || !mapReady || resetMapViewTrigger === 0) {
      return;
    }

    const map = mapRef.current;
    
    console.log('🔄 [MAP] Resetting map view to default extent');
    resetToStudyAreaExtent(map, 1500);
    
    console.log('✅ [MAP] Map view reset complete');
  }, [resetMapViewTrigger, mapReady]);

  // Handle ward filtering and zoom animation from Header dropdown
  useEffect(() => {
    console.log('🎯 Ward filter effect triggered:', { selectedWardId, mapReady, mapExists: !!mapRef.current });
    
    if (!mapRef.current || !mapReady) {
      console.log('⏹️ Skipping ward zoom - map not ready');
      return;
    }
    
    const map = mapRef.current;
    
    // Close any open ward popup when ward filter changes
    if (wardPopupRef.current) {
      wardPopupRef.current.remove();
      wardPopupRef.current = null;
    }
    
    // If "all" wards selected, zoom back to city view
    if (!selectedWardId || selectedWardId === 'all') {
      console.log('📍 "All Wards" selected - removing ward filters');
      
      // Note: Zoom will be handled by the boundary reload useEffect
      // which has the correct/updated barangay data after reload
      
      // Remove ward filter from layers (show all wards)
      const wardLayerId = 'ward-boundaries';
      const wardFillLayerId = 'ward-boundaries-fill';
      const wardLabelLayerId = 'ward-labels';
      
      [wardLayerId, wardFillLayerId, wardLabelLayerId].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setFilter(layerId, null); // Remove filter - show all wards
        }
      });
      
      // Also remove filter from buildings layers (show all buildings)
      ['buildings', 'buildings-fill', 'buildings-3d', 'buildings-highlight'].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setFilter(layerId, null);
          console.log(`✅ Ward filter removed from buildings layer: ${layerId} (showing all buildings)`);
        }
      });

      // NOTE: We intentionally do NOT update buildingsWardRef here.
      // Leaving it as the previous signature causes the addBaseLayers effect
      // (which re-runs because selectedWardId/Name changed) to detect a
      // mismatch and rebuild the buildings MVT source with the updated
      // CQL_FILTER. Updating it here would skip that rebuild and leave the
      // tiles filtered to the previous barangay.

      // Note: Do NOT update previousWardRef here
      // It needs to be updated in the boundary reload useEffect AFTER the zoom happens
      
      return;
    }
    
    // Extract barangay name from selectedWardId
    // Old format: "ward_1_Barangay_Name" -> "Barangay Name"
    // New format: BrgyID (numeric or string) -> Fetch name from GeoServer
    
    // Check if selectedWardId is a string
    if (typeof selectedWardId !== 'string') {
      console.warn('⚠️ selectedWardId is not a string:', selectedWardId, 'Type:', typeof selectedWardId);
      return;
    }
    
    let wardNumber: number | null = null;
    let barangayName: string | null = null;
    
    // Try old format first
    if (selectedWardId.includes('_')) {
      const idParts = selectedWardId.split('_');
      wardNumber = parseInt(idParts[1]);
      barangayName = idParts.slice(2).join(' '); // Reconstruct name with spaces
    }
    
    // For new format (BrgyID), we need to fetch the barangay name from GeoServer
    // For now, skip ward-based filtering (will be handled by BrgyID filtering in future)
    if (!barangayName) {
      console.warn('⚠️ Cannot extract barangay name from BrgyID format:', selectedWardId);
      console.log('ℹ️ Barangay filtering by BrgyID will be implemented separately');
      return;
    }
    
    console.log(`📍 Filtering and zooming to Barangay: ${barangayName} (ID: ${selectedWardId})`);
    
    // Wait for ward boundaries to load
    const waitForWardBoundaries = () => {
      console.log('⏰ waitForWardBoundaries() called for Barangay:', barangayName);
      const wardLayerId = 'ward-boundaries';
      
      if (!map.getSource(wardLayerId)) {
        console.log('⏳ Waiting for ward boundaries source to load...');
        setTimeout(waitForWardBoundaries, 500);
        return;
      }
      
      // Check if the ward boundaries data ref is populated
      if (!wardBoundariesDataRef.current || !wardBoundariesDataRef.current.features) {
        console.log('⏳ Waiting for ward boundaries data to be stored in ref...');
        setTimeout(waitForWardBoundaries, 500);
        return;
      }
      
      // Get barangay feature from stored GeoJSON data (search by barangay name)
      {
        const features = wardBoundariesDataRef.current.features;
        console.log(`🔍 Searching for Barangay "${barangayName}" in ${features.length} features`);
        
        // Log first feature's properties to debug
        if (features.length > 0) {
          console.log('📋 Sample barangay properties:', features[0].properties);
        }
        
        // Search for barangay by name (try multiple field name variations)
        const wardFeature = features.find((f: any) => {
          const props = f.properties;
          const fBarangayName = props.BrgyName || props.brgyname || props.BRGYNAME || props.Barangay_Name || props.Name || props.NAME;
          return fBarangayName === barangayName;
        });
        
        console.log(`🔍 Barangay search result:`, wardFeature ? 'Found' : 'Not found');
        
        if (wardFeature && wardFeature.geometry) {
          console.log('✅ Found barangay feature in stored data, calculating bounds');
          
          // Calculate bounds of the barangay
          const bounds = new maplibregl.LngLatBounds();
          
          // Handle different geometry types
          const geometry = wardFeature.geometry as any;
          console.log('📐 Barangay geometry type:', geometry.type);
          
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
          
          console.log('📍 Calculated bounds:', {
            southwest: bounds.getSouthWest().toArray(),
            northeast: bounds.getNorthEast().toArray(),
            center: bounds.getCenter().toArray()
          });
          
          // Fit map to barangay bounds with animation
          console.log('🚀 Calling map.fitBounds()...');
          map.fitBounds(bounds, {
            padding: { top: 120, bottom: 120, left: 120, right: 120 },
            duration: 1500,
            essential: true,
            maxZoom: 13.5  // Prevent over-zooming for small barangays
          });
          
          console.log('✅ Zoomed to Barangay:', barangayName);
        } else {
          console.warn('⚠️ Barangay feature not found in stored GeoJSON data for:', barangayName);
        }
      }
      
      // Apply filter to show only selected barangay
      const wardFillLayerId = 'ward-boundaries-fill';
      const wardLabelLayerId = 'ward-labels';
      
      // Create filter to match barangay name (try multiple field variations)
      const filter = [
        'any',
        ['==', ['get', 'BrgyName'], barangayName],
        ['==', ['get', 'brgyname'], barangayName],
        ['==', ['get', 'BRGYNAME'], barangayName],
        ['==', ['get', 'Barangay_Name'], barangayName],
        ['==', ['get', 'Name'], barangayName],
        ['==', ['get', 'NAME'], barangayName]
      ];
      
      console.log('🔍 Applying barangay filter to show only:', barangayName);
      
      // Apply filter to ward boundary layers
      [wardLayerId, wardFillLayerId, wardLabelLayerId].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setFilter(layerId, filter);
          console.log(`✅ Filter applied to ${layerId}`);
        }
      });
      
      // Note: Building filters are now handled in the building category filter useEffect
      // which properly combines admin boundary filters with category/subcategory filters

      // NOTE: We intentionally do NOT update buildingsWardRef here. Leaving
      // it as the previous signature lets the addBaseLayers effect detect
      // the change and rebuild the buildings MVT source with the new
      // CQL_FILTER (otherwise the MVT tiles would still contain only the
      // previously-selected barangay's buildings).

      // Update previous ward ref to track ward changes
      previousWardRef.current = selectedWardId;
    };
    
    waitForWardBoundaries();
    
  }, [selectedWardId, mapReady]);

  // Handle LGU filtering - reload boundary layers when LGU changes
  useEffect(() => {
    console.log('🏛️ LGU filter effect triggered:', { selectedLguName, mapReady, mapExists: !!mapRef.current });
    
    if (!mapRef.current || !mapReady) {
      console.log('⏹️ Skipping LGU boundary reload - map not ready');
      return;
    }
    
    const map = mapRef.current;
    
    console.log(`🔄 Reloading boundary layers for LGU: ${selectedLguName || 'all'}, Ward: ${selectedWardId || 'all'}`);
    
    // Remove existing boundary layers
    const wardLayerId = 'ward-boundaries';
    const wardFillLayerId = 'ward-boundaries-fill';
    const wardHighlightLayerId = 'ward-boundaries-highlight';
    const wardLabelLayerId = 'ward-labels';
    const wardPointSourceId = 'ward-points';
    const municipalLayerId = 'municipal-boundary';
    const municipalBorderLayerId = 'municipal-boundary-border';
    
    try {
      // Remove ward boundary layers
      [wardLabelLayerId, wardHighlightLayerId, wardFillLayerId, wardLayerId].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
          console.log(`🗑️ Removed ward boundary layer: ${layerId}`);
        }
      });
      
      // Remove ward boundary source
      if (map.getSource(wardLayerId)) {
        map.removeSource(wardLayerId);
        console.log('🗑️ Removed ward boundary source');
      }
      
      // Remove ward points source (for labels)
      if (map.getSource(wardPointSourceId)) {
        map.removeSource(wardPointSourceId);
        console.log('🗑️ Removed ward points source');
      }
      
      // Remove municipal boundary layers
      if (map.getLayer(municipalLayerId)) {
        map.removeLayer(municipalLayerId);
        console.log('🗑️ Removed municipal boundary layer');
      }
      if (map.getLayer(municipalBorderLayerId)) {
        map.removeLayer(municipalBorderLayerId);
        console.log('🗑️ Removed municipal boundary border layer');
      }
      
      // Remove municipal boundary source
      if (map.getSource(municipalLayerId)) {
        map.removeSource(municipalLayerId);
        console.log('🗑️ Removed municipal boundary source');
      }
      
      // Re-add boundary layers with the new LGU filter
      console.log('🔄 Re-adding boundary layers with LGU filter...');
      addWardBoundaryLayer(map, wardPopupRef, setWardPopupData, wardBoundariesDataRef, setEducationPopupData, setHealthcarePopupData, setSelectedWardNumber, onLocationClear, wardPointDataRef, selectedLguName, selectedWardId, undefined, onResidentialBuildingsUpdate, onTotalAreaUpdate, onTotalPopulationUpdate);
      addMunicipalBoundaryLayer(map, selectedLguName);
      
      console.log('✅ Boundary layers reloaded for LGU:', selectedLguName || 'all', 'Ward:', selectedWardId || 'all');
      
      // Check if we should fit to all barangays after reload
      // Case 1: Barangay cleared (specific barangay → All Barangays)
      const shouldFitFromBarangayClear = (!selectedWardId || selectedWardId === 'all') && previousWardRef.current && previousWardRef.current !== 'all';
      
      // Case 2: LGU cleared (specific LGU → All LGUs) while no specific barangay is selected
      const shouldFitFromLguClear = (!selectedLguName || selectedLguName === 'all') && previousLguRef.current && previousLguRef.current !== 'all' && (!selectedWardId || selectedWardId === 'all');
      
      const shouldFitToAllBarangays = shouldFitFromBarangayClear || shouldFitFromLguClear;
      
      if (shouldFitToAllBarangays) {
        const changeType = shouldFitFromBarangayClear ? 'Barangay' : 'LGU';
        const previousValue = shouldFitFromBarangayClear ? previousWardRef.current : previousLguRef.current;
        console.log(`📍 ${changeType} cleared (${previousValue} → All) - will fit to all visible barangays after data loads`);
        
        // Wait for ward boundaries data to be populated, then fit bounds
        const fitToAllBarangaysAfterLoad = () => {
          if (!wardBoundariesDataRef.current || !wardBoundariesDataRef.current.features) {
            console.log('⏳ Waiting for ward boundaries data to populate...');
            setTimeout(fitToAllBarangaysAfterLoad, 300);
            return;
          }
          
          const features = wardBoundariesDataRef.current.features;
          console.log(`📊 Calculating bounds for ${features.length} barangays after reload`);
          
          if (features.length === 0) {
            console.warn('⚠️ No barangay features found after reload, falling back to study area extent');
            resetToStudyAreaExtent(map, 1500);
            return;
          }
          
          // Calculate combined bounds for all barangays
          const bounds = new maplibregl.LngLatBounds();
          
          features.forEach((feature: any) => {
            const geometry = feature.geometry;
            
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
          });
          
          console.log('📍 Calculated bounds for all barangays after reload:', {
            southwest: bounds.getSouthWest().toArray(),
            northeast: bounds.getNorthEast().toArray(),
            center: bounds.getCenter().toArray(),
            totalFeatures: features.length
          });
          
          // Get current zoom for comparison
          const currentZoom = map.getZoom();
          console.log(`🔍 Current zoom level: ${currentZoom.toFixed(2)}`);
          
          // Fit map to all barangay bounds with animation
          console.log('🚀 Fitting map to all visible barangays after reload...');
          map.fitBounds(bounds, {
            padding: { top: 100, bottom: 100, left: 100, right: 100 },
            duration: 1500,
            essential: true
            // Remove maxZoom to allow proper zoom out
          });
          
          console.log('✅ Fitted to all visible barangays after reload');
        };
        
        // Start waiting for data (give it a small delay to ensure layer is added)
        setTimeout(fitToAllBarangaysAfterLoad, 100);
      }
      
      // Update previous refs to track changes
      previousWardRef.current = selectedWardId || 'all';
      previousLguRef.current = selectedLguName || 'all';
      
    } catch (error) {
      console.error('❌ Error reloading boundary layers:', error);
    }
    
  }, [selectedLguName, selectedWardId, mapReady]);

  // Helper function to close infrastructure popup and zoom back to previous state
  const closeInfrastructurePopupAndZoomBack = (setPopupData: (data: null) => void) => {
    const map = mapRef.current;
    if (map && previousMapStateRef.current) {
      // Zoom back to the previous map state
      map.flyTo({
        center: previousMapStateRef.current.center,
        zoom: previousMapStateRef.current.zoom,
        duration: 800,
        essential: true,
        easing: (t) => t * (2 - t) // Ease out quad for smooth deceleration
      });
      
      // Clear the stored previous state
      previousMapStateRef.current = null;
    }
    
    // Close the popup
    setPopupData(null);
  };

  // Helper function to close road safety popup and zoom back to previous state
  const closeRoadSafetyPopupAndZoomBack = () => {
    const map = mapRef.current;
    const savedView = previousRoadSafetyViewRef.current;
    
    console.log('🔍 [CLOSE] Attempting to close road safety popup and zoom back');
    console.log('🔍 [CLOSE] Map exists:', !!map);
    console.log('🔍 [CLOSE] Saved view from ref exists:', !!savedView);
    console.log('🔍 [CLOSE] Saved view data:', savedView);
    
    if (map && savedView) {
      // Zoom back to the previous map view
      map.flyTo({
        center: savedView.center,
        zoom: savedView.zoom,
        duration: 800,
        essential: true,
        easing: (t) => t * (2 - t) // Ease out quad for smooth deceleration
      });
      
      console.log(`🏠 [CLOSE] Restoring previous map view: center [${savedView.center.lng.toFixed(4)}, ${savedView.center.lat.toFixed(4)}], zoom ${savedView.zoom.toFixed(2)}`);
      
      // Clear the stored previous view
      setPreviousRoadSafetyView(null);
      previousRoadSafetyViewRef.current = null;
    } else {
      console.warn('⚠️ [CLOSE] Cannot restore view - map or savedView is null');
    }
    
    // Close the popup
    setRoadSafetyPopupData(null);
  };

  // Helper function to open infrastructure popup at a location
  const openInfrastructurePopup = (map: maplibregl.Map, location: any, retryCount: number = 0) => {
    console.log('🔍 Opening popup for location:', location.name, location.lat, location.lng, 'Retry:', retryCount);
    
    // Wait for map to be idle and fully rendered
    const tryOpenPopup = () => {
      const point = map.project([location.lng, location.lat]);
      const currentZoom = map.getZoom();
      console.log('📍 Projected point:', point.x, point.y, 'Zoom:', currentZoom);
      
      // Check for cluster layers first to see if point is still clustered
      const clusterLayers = [
        'education-clusters',
        'healthcare-clusters',
        'public-amenities-clusters',
        'transport-clusters'
      ].filter(layerId => map.getLayer(layerId));
      
      if (clusterLayers.length > 0) {
        const bbox: [number, number, number, number] = [
          point.x - 10,
          point.y - 10,
          point.x + 10,
          point.y + 10
        ];
        const clusterFeatures = map.queryRenderedFeatures(bbox, { layers: clusterLayers });
        
        if (clusterFeatures.length > 0 && retryCount < 3) {
          const maxZoom = 20;
          
          if (currentZoom < maxZoom) {
            console.log('⚠️ Point is still clustered at zoom', currentZoom, '- zooming in further');
            // Zoom in more to uncluster
            map.flyTo({
              center: [location.lng, location.lat],
              zoom: Math.min(currentZoom + 2, maxZoom),
              duration: 800,
              essential: true
            });
            
            // Try again after zoom
            setTimeout(() => {
              openInfrastructurePopup(map, location, retryCount + 1);
            }, 900);
            return;
          }
        }
      }
      
      // Query all infrastructure layers at this point with a small buffer
      const infraLayers = [
        'education-unclustered-point',
        'healthcare-unclustered-point', 
        'public-amenities-unclustered-point',
        'transport-unclustered-point'
      ].filter(layerId => {
        const hasLayer = map.getLayer(layerId);
        console.log(`Layer ${layerId}: ${hasLayer ? 'exists' : 'missing'}`);
        return hasLayer;
      });
      
      if (infraLayers.length === 0) {
        // No infrastructure layers active - skip querying
        return;
      }
      
      // Query with a small buffer area around the point (10px radius)
      const bbox: [number, number, number, number] = [
        point.x - 10,
        point.y - 10,
        point.x + 10,
        point.y + 10
      ];
      
      const features = map.queryRenderedFeatures(bbox, { layers: infraLayers });
      console.log(`🔎 Found ${features.length} features in bbox`, bbox);
      
      if (features.length > 0) {
        const feature = features[0];
        const coords = (feature.geometry as any).coordinates;
        const props = feature.properties;
        
        console.log('✅ Found infrastructure feature:', feature.layer.id, props.name);
        
        // Open the appropriate popup based on layer type
        if (feature.layer.id === 'education-unclustered-point') {
          setEducationPopupData({
            name: props.name || 'Unknown Institution',
            category: props.categoryDisplay || 'Unknown',
            categoryType: props.category || 'school',
            subcategory: props.subcategory || undefined,
            hhi2025: props.HHI_2025,
            airAqi: props.Air_AQI,
            floodHazard: props.Flood_Hazard,
            multiHazard: props.Multi_Hazard_BBSR,
            lng: coords[0],
            lat: coords[1],
            x: point.x,
            y: point.y
          });
        } else if (feature.layer.id === 'healthcare-unclustered-point') {
          setHealthcarePopupData({
            name: props.name || 'Unknown Facility',
            category: props.categoryDisplay || 'Unknown',
            categoryType: props.category || 'hospital',
            subcategory: props.subcategory || undefined,
            hhi2025: props.HHI_2025,
            airAqi: props.Air_AQI,
            floodHazard: props.Flood_Hazard,
            multiHazard: props.Multi_Hazard_BBSR,
            lng: coords[0],
            lat: coords[1],
            x: point.x,
            y: point.y
          });
        } else if (feature.layer.id === 'public-amenities-unclustered-point') {
          setPublicAmenitiesPopupData({
            name: props.name || 'Unknown Amenity',
            category: props.categoryDisplay || 'Unknown',
            categoryType: props.category || 'place_of_worship',
            subcategory: props.subcategory || undefined,
            hhi2025: props.HHI_2025,
            airAqi: props.Air_AQI,
            floodHazard: props.Flood_Hazard,
            multiHazard: props.Multi_Hazard_BBSR,
            lng: coords[0],
            lat: coords[1],
            x: point.x,
            y: point.y
          });
        } else if (feature.layer.id === 'transport-unclustered-point') {
          setTransportPopupData({
            name: props.name || 'Unknown Transport',
            category: props.categoryDisplay || 'Unknown',
            categoryType: props.category || 'bus_station',
            subcategory: props.subcategory || undefined,
            hhi2025: props.HHI_2025,
            airAqi: props.Air_AQI,
            floodHazard: props.Flood_Hazard,
            multiHazard: props.Multi_Hazard_BBSR,
            lng: coords[0],
            lat: coords[1],
            x: point.x,
            y: point.y
          });
        }
      } else {
        console.warn('⚠️ No infrastructure features found at clicked point. Available layers:', infraLayers);
      }
    };
    
    // Wait for the map to finish rendering before querying
    if (map.loaded()) {
      tryOpenPopup();
    } else {
      map.once('idle', tryOpenPopup);
    }
  };

  // Handle location search - zoom and add marker or boundary
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedLocation) {
      // Cleanup: Remove marker and boundary when selectedLocation is cleared
      if (map && mapReady && !selectedLocation) {
        console.log('🧹 Cleaning up location search - removing markers and boundaries');
        
        // Remove marker
        if (locationMarkerRef.current) {
          locationMarkerRef.current.remove();
          locationMarkerRef.current = null;
        }

        // Remove boundary layers
        if (locationBoundaryLayerIdRef.current) {
          const sourceId = locationBoundaryLayerIdRef.current;
          if (map.getLayer(`${sourceId}-fill`)) {
            map.removeLayer(`${sourceId}-fill`);
          }
          if (map.getLayer(`${sourceId}-outline`)) {
            map.removeLayer(`${sourceId}-outline`);
          }
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
          locationBoundaryLayerIdRef.current = null;
        }

        // Note: Don't reset map view here - that's handled when a new location is set
      }
      return;
    }

    console.log('📍 Location search: Zooming to', selectedLocation.name, selectedLocation.lat, selectedLocation.lng);
    console.log('🗺️ GeoJSON boundary data:', selectedLocation.geojson ? 'Available' : 'Not available');
    
    // Check if this is a ward zoom request from query panel
    const zoomToWards = (selectedLocation as any).zoomToWards || false;
    const wardIds = (selectedLocation as any).wardIds || [];
    
    if (zoomToWards && wardIds.length > 0) {
      console.log('🎯 Query panel ward zoom - fitting to wards:', wardIds);
      
      // Wait for ward boundaries to be loaded
      const waitForWardBoundariesForQuery = async () => {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
        while (!wardBoundariesDataRef.current && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!wardBoundariesDataRef.current) {
          console.warn('⚠️ Ward boundaries not loaded after timeout');
          return;
        }
        
        const features = wardBoundariesDataRef.current.features;
        console.log('📍 Total ward features available:', features.length);
        
        // Calculate combined bounds for all selected wards
        const combinedBounds = new maplibregl.LngLatBounds();
        let foundWards = 0;
        
        wardIds.forEach((wardId: string) => {
          const wardNumber = parseInt(wardId.split('_')[1]);
          console.log(`🔍 Looking for Ward ${wardNumber}`);
          
          const wardFeature = features.find((f: any) => {
            const props = f.properties;
            const fWardNumber = props.Ward || props.WARD || props.ward || props.Ward_No || props.WARD_NO || props.ward_no || props.WardNo;
            return parseInt(fWardNumber) === wardNumber;
          });
          
          if (wardFeature && wardFeature.geometry) {
            console.log(`✅ Found Ward ${wardNumber}, adding to bounds`);
            foundWards++;
            
            const geometry = wardFeature.geometry as any;
            if (geometry.type === 'Polygon') {
              geometry.coordinates[0].forEach((coord: [number, number]) => {
                combinedBounds.extend(coord);
              });
            } else if (geometry.type === 'MultiPolygon') {
              geometry.coordinates.forEach((polygon: any) => {
                polygon[0].forEach((coord: [number, number]) => {
                  combinedBounds.extend(coord);
                });
              });
            }
          } else {
            console.warn(`⚠️ Ward ${wardNumber} not found in GeoJSON data`);
          }
        });
        
        if (foundWards > 0) {
          console.log(`📍 Calculated combined bounds for ${foundWards} ward(s)`);
          
          // Fit map to combined ward bounds with animation
          map.fitBounds(combinedBounds, {
            padding: { top: 120, bottom: 120, left: 120, right: 120 },
            duration: 1500,
            essential: true,
            maxZoom: 13.5  // Prevent over-zooming
          });
          
          console.log(`✅ Zoomed to ${foundWards} selected ward(s)`);
        }
      };
      
      waitForWardBoundariesForQuery();
      return; // Skip the rest of the location logic
    }
    
    // Check if this is a road segment zoom request from query panel
    const zoomToRoadSegment = (selectedLocation as any).zoomToRoadSegment || false;
    const roadFeatures = (selectedLocation as any).roadFeatures || [];
    const roadColor = (selectedLocation as any).roadColor || '#3B82F6';
    
    if (zoomToRoadSegment && roadFeatures.length > 0) {
      console.log('🎯 Query panel road segment zoom - zooming to features:', roadFeatures.length);
      
      // Calculate combined bounds for all road features
      const combinedBounds = new maplibregl.LngLatBounds();
      
      roadFeatures.forEach((feature: any) => {
        const geometry = feature.geometry;
        if (geometry && geometry.coordinates) {
          if (geometry.type === 'LineString') {
            geometry.coordinates.forEach((coord: [number, number]) => {
              combinedBounds.extend(coord);
            });
          } else if (geometry.type === 'MultiLineString') {
            geometry.coordinates.forEach((line: any) => {
              line.forEach((coord: [number, number]) => {
                combinedBounds.extend(coord);
              });
            });
          }
        }
      });
      
      // Create temporary highlight layer
      const highlightSourceId = 'road-segment-highlight';
      const highlightLayerId = 'road-segment-highlight-layer';
      
      // Remove existing highlight if any
      if (map.getLayer(highlightLayerId)) {
        map.removeLayer(highlightLayerId);
      }
      if (map.getSource(highlightSourceId)) {
        map.removeSource(highlightSourceId);
      }
      
      // Add highlight source and layer
      map.addSource(highlightSourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: roadFeatures
        }
      });
      
      map.addLayer({
        id: highlightLayerId,
        type: 'line',
        source: highlightSourceId,
        paint: {
          'line-color': '#60A5FA', // Light blue highlight color
          'line-width': 8,
          'line-opacity': 0.8
        }
      });
      
      // Fit map to road segment bounds with animation
      map.fitBounds(combinedBounds, {
        padding: { top: 100, bottom: 100, left: 100, right: 100 },
        duration: 1000,
        essential: true,
        maxZoom: 15  // Good zoom level for road segments
      });
      
      // Remove highlight after 1 second
      setTimeout(() => {
        if (map.getLayer(highlightLayerId)) {
          map.removeLayer(highlightLayerId);
        }
        if (map.getSource(highlightSourceId)) {
          map.removeSource(highlightSourceId);
        }
        console.log('✅ Removed road segment highlight');
      }, 1000);
      
      console.log('✅ Zoomed to road segment with highlight');
      return; // Skip the rest of the location logic
    }
    
    // Check if this is a tutorial zoom (simple zoom without marker)
    const isTutorialZoom = (selectedLocation as any).isTutorialZoom || false;
    
    // Check if this is a smooth transition to home view (from closing query results)
    const isSmoothTransition = (selectedLocation as any).smoothTransition || false;
    const isHomeView = selectedLocation.name === 'Bohol' && 
                       selectedLocation.lat === 9.8399 && 
                       selectedLocation.lng === 124.1139;

    // Handle tutorial zoom - simple flyTo without marker
    if (isTutorialZoom) {
      console.log('🎓 Tutorial zoom - flying to location at zoom', (selectedLocation as any).zoom || 11.5);
      
      // Remove previous location marker if exists
      if (locationMarkerRef.current) {
        locationMarkerRef.current.remove();
        locationMarkerRef.current = null;
      }

      // Remove previous boundary layers if they exist
      if (locationBoundaryLayerIdRef.current) {
        const sourceId = locationBoundaryLayerIdRef.current;
        if (map.getLayer(`${sourceId}-fill`)) {
          map.removeLayer(`${sourceId}-fill`);
        }
        if (map.getLayer(`${sourceId}-outline`)) {
          map.removeLayer(`${sourceId}-outline`);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
        locationBoundaryLayerIdRef.current = null;
      }

      // Simple smooth flyTo animation
      map.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: (selectedLocation as any).zoom || 11.5,
        duration: 1500,
        essential: true,
        curve: 1.2,
        speed: 0.9
      });
      
      return; // Skip the rest of the location marker logic
    }

    // Remove previous location marker if exists
    if (locationMarkerRef.current) {
      locationMarkerRef.current.remove();
      locationMarkerRef.current = null;
    }

    // Remove previous boundary layers if they exist
    if (locationBoundaryLayerIdRef.current) {
      const sourceId = locationBoundaryLayerIdRef.current;
      if (map.getLayer(`${sourceId}-fill`)) {
        map.removeLayer(`${sourceId}-fill`);
      }
      if (map.getLayer(`${sourceId}-outline`)) {
        map.removeLayer(`${sourceId}-outline`);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
      locationBoundaryLayerIdRef.current = null;
    }

    // If this is an infrastructure point zoom (from query panel), skip marker creation and just open popup
    if ((selectedLocation as any).openPopup) {
      console.log('🎯 Infrastructure point zoom - skipping marker, opening popup directly');
      
      // Close any existing popups first
      setWardPopupData(null);
      setEducationPopupData(null);
      setHealthcarePopupData(null);
      setPublicAmenitiesPopupData(null);
      setTransportPopupData(null);
      
      // Single smooth continuous animation to target - no pauses
      // Minimum zoom 15, or higher if specified
      const targetZoom = Math.max((selectedLocation as any).zoom || 15, 15);
      
      // Single smooth flyTo animation with gentle curve
      map.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: targetZoom,
        duration: 2000, // Slower for smoother movement
        essential: true,
        curve: 1.2, // Gentler curve for smoother arc
        speed: 0.8 // Slower speed for smoother feel
      });
      
      // Open popup after animation completes
      // The popup function will auto-zoom further if point is still clustered
      setTimeout(() => {
        openInfrastructurePopup(map, selectedLocation, 0);
      }, 2100);
      
      return; // Skip the rest of the location marker logic
    }

    // If this is a smooth transition to home view (from closing query results)
    if (isHomeView && isSmoothTransition) {
      console.log('🏠 Smooth transition to home view');
      
      // Use stored barangay bounds for home view
      const barangayBounds = (map as any)._barangayBounds;
      
      if (barangayBounds) {
        map.fitBounds(barangayBounds, {
          padding: 80,
          duration: 2000, // Longer duration for smoother transition
          pitch: 0,
          bearing: 0,
          essential: true
        });
      } else {
        // Fallback if bounds not available (unlikely)
        map.flyTo({
          center: [selectedLocation.lng, selectedLocation.lat],
          zoom: (selectedLocation as any).zoom || 12.5,
          duration: 2000,
          essential: true,
          curve: 1.2,
          speed: 0.7
        });
      }
      
      return; // Skip marker creation for home view
    }

    // Check if we have geojson boundary data
    const hasBoundary = selectedLocation.geojson && 
                       selectedLocation.geojson.type && 
                       selectedLocation.geojson.coordinates;

    if (hasBoundary) {
      // Display boundary polygon with red outline (like Google Maps)
      console.log('✅ Displaying boundary for:', selectedLocation.name);
      
      const sourceId = `location-boundary-${Date.now()}`;
      locationBoundaryLayerIdRef.current = sourceId;

      // Create GeoJSON feature from the boundary data
      const boundaryFeature = {
        type: 'Feature' as const,
        geometry: selectedLocation.geojson,
        properties: {
          name: selectedLocation.name
        }
      };

      // Add source
      map.addSource(sourceId, {
        type: 'geojson',
        data: boundaryFeature
      });

      // Add fill layer (semi-transparent red)
      map.addLayer({
        id: `${sourceId}-fill`,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': '#E3000F',
          'fill-opacity': 0.1
        }
      });

      // Add outline layer (red border)
      map.addLayer({
        id: `${sourceId}-outline`,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#E3000F',
          'line-width': 2,
          'line-opacity': 0.9
        }
      });

      // Calculate bounds and fit to boundary
      try {
        // Calculate bounding box from the geometry
        const coords = selectedLocation.geojson.coordinates;
        let allCoords: number[][] = [];

        // Flatten coordinates depending on geometry type
        const flattenCoords = (c: any): void => {
          if (Array.isArray(c) && c.length > 0) {
            if (typeof c[0] === 'number') {
              allCoords.push(c as number[]);
            } else {
              c.forEach(flattenCoords);
            }
          }
        };

        flattenCoords(coords);

        if (allCoords.length > 0) {
          const lngs = allCoords.map(c => c[0]);
          const lats = allCoords.map(c => c[1]);
          
          const bounds = new maplibregl.LngLatBounds(
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)]
          );

          map.fitBounds(bounds, {
            padding: 80,
            duration: 1500,
            maxZoom: 13  // Limit zoom level to avoid zooming in too much
          });
        }
      } catch (error) {
        console.error('❌ Error calculating bounds:', error);
        // Fallback to center point
        map.flyTo({
          center: [selectedLocation.lng, selectedLocation.lat],
          zoom: 12,  // Reduced from 14 to 12 for less aggressive zoom
          duration: 1500,
          essential: true
        });
      }

      // Compact tinted location label with close button
      const popup = new maplibregl.Popup({
        offset: 15,
        closeButton: false,
        closeOnClick: false,
        className: 'location-label-v2'
      })
      .setLngLat([selectedLocation.lng, selectedLocation.lat])
      .setHTML(`
        <div class="label-box">
          <span class="label-name">${selectedLocation.name}</span>
          <button class="label-close" onclick="this.closest('.maplibregl-popup').remove()">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      `)
      .addTo(map);

      // Clear location when popup is closed or removed
      popup.on('close', () => {
        console.log('🔄 Location tooltip closed - clearing location');
        if (onLocationClear) {
          onLocationClear();
        }
      });

      locationMarkerRef.current = popup;

    } else {
      // No boundary, just display point marker (original behavior)
      console.log('ℹ️ No boundary data, displaying point marker');

      const markerElement = document.createElement('div');
      markerElement.style.width = '32px';
      markerElement.style.height = '40px';
      markerElement.style.position = 'relative';
      markerElement.style.cursor = 'pointer';
      
      // Create SVG marker (modern Google Maps style - blue for points)
      markerElement.innerHTML = `
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#shadow-blue)">
            <path d="M16 0C9.37258 0 4 5.37258 4 12C4 20.5 16 36 16 36C16 36 28 20.5 28 12C28 5.37258 22.6274 0 16 0Z" fill="#2563EB"/>
            <circle cx="16" cy="12" r="5" fill="white"/>
          </g>
          <defs>
            <filter id="shadow-blue" x="0" y="0" width="32" height="44" filterUnits="userSpaceOnUse">
              <feOffset dy="2"/>
              <feGaussianBlur stdDeviation="2"/>
              <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0"/>
            </filter>
          </defs>
        </svg>
      `;

      const popup = new maplibregl.Popup({
        offset: 20,
        closeButton: false,
        closeOnClick: false,
        className: 'location-label-v2'
      }).setHTML(`
        <div class="label-box">
          <span class="label-name">${selectedLocation.name}</span>
          <button class="label-close" onclick="this.closest('.maplibregl-popup').remove()">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      `);

      // Clear location when popup is closed or removed
      popup.on('close', () => {
        console.log('🔄 Location tooltip closed - clearing location');
        if (onLocationClear) {
          onLocationClear();
        }
      });

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([selectedLocation.lng, selectedLocation.lat])
        .setPopup(popup)
        .addTo(map);

      locationMarkerRef.current = marker;
      marker.togglePopup();

      // Zoom to location
      map.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 12,  // Default zoom for location search
        duration: 1500,
        essential: true
      });
    }

  }, [selectedLocation, mapReady]);

  // Handle road bounds zoom when selected from filter
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    if (roadBounds) {
      // Zoom to the road bounds with appropriate padding
      console.log('🛣️ Zooming to road bounds:', roadBounds);
      
      map.fitBounds(roadBounds, {
        padding: 100, // Add padding around the bounds
        duration: 1500, // Smooth animation
        maxZoom: 13.5 // Don't zoom in too much - keep it reasonable
      });

      // Clear the bounds after zooming to prevent re-triggering
      if (onRoadBoundsChange) {
        // Small delay to allow the zoom animation to complete
        setTimeout(() => {
          onRoadBoundsChange(null);
        }, 1600);
      }
    } else if (selectedRoadName === 'all') {
      // When road filter is cleared (roadBounds is null and selectedRoadName is 'all'), zoom back to home
      console.log('🏠 Road filter cleared, zooming back to study area extent');
      
      // Use stored barangay bounds for reset
      const barangayBounds = (map as any)._barangayBounds;
      
      if (barangayBounds) {
        map.fitBounds(barangayBounds, {
          padding: 80,
          duration: 1500,
          pitch: 0,
          bearing: 0
        });
      } else {
        console.warn('⚠️ Barangay bounds not available for road filter reset');
      }
    }

  }, [roadBounds, selectedRoadName, mapReady]);

  // Handle education layer with clustering
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const sourceId = 'education-institutions';
    const clusterLayerId = 'education-clusters';
    const clusterPulseLayerId = 'education-clusters-pulse';
    const clusterCountLayerId = 'education-cluster-count';
    const unclusteredLayerId = 'education-unclustered-point';

    // Track if component is still mounted
    let isMounted = true;

    // Remove existing layers and source
    if (map.getLayer(unclusteredLayerId)) map.removeLayer(unclusteredLayerId);
    if (map.getLayer(clusterCountLayerId)) map.removeLayer(clusterCountLayerId);
    if (map.getLayer(clusterLayerId)) map.removeLayer(clusterLayerId);
    if (map.getLayer(clusterPulseLayerId)) map.removeLayer(clusterPulseLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (activeInfraLayers.includes('educational')) {
      // Set loading state
      setIsLayerLoading(true);
      
      const loadEducationData = async () => {
        // Map subcategory IDs to GeoServer category values
        const geoserverCategories = activeEducationSubLayers.map(subId => 
          mapSubcategoryIdToCategory(subId)
        );

        // NEW BEHAVIOR: If no sublayers selected, show ALL education points
        // If sublayers are selected, only show those specific categories
        const shouldFetchAll = geoserverCategories.length === 0;
        
        if (shouldFetchAll) {
          console.log('📍 No education sublayers selected - showing ALL education points');
        } else {
          console.log('🔍 Filtering education points by categories:', geoserverCategories);
        }

        // Fetch data from GeoServer with selected categories (or all if none selected)
        const institutions = await fetchEducationData(
          selectedWardName,
          shouldFetchAll ? undefined : geoserverCategories,
          selectedLguName
        );

        // Filter by queryResults if spatial query is active
        let filteredInstitutions = institutions;
        if (queryResults !== null) {
          // Check if this is a road query (has segments property)
          const isRoadQuery = queryResults.some((f: any) => f.properties?.segments !== undefined);
          
          if (!isRoadQuery) {
            // POI query - filter institutions to match query results
            // Query was executed - strictly show only results (even if empty)
            if (queryResults.length > 0) {
              const queryResultIds = new Set(queryResults.map(r => r.id));
              filteredInstitutions = institutions.filter(inst => queryResultIds.has(inst.id));
              console.log(`🔍 Filtered education results: ${filteredInstitutions.length}/${institutions.length} points match spatial query`);
            } else {
              // Query returned 0 results - show NO points
              filteredInstitutions = [];
              console.log(`🔍 Query returned 0 results - hiding all education points`);
            }
          } else {
            // Road query - don't filter infrastructure points, show all
            console.log(`🛣️ Road query active - showing all education points alongside road segments`);
          }
        }

        // Check if component is still mounted before proceeding
        if (!isMounted || !mapRef.current) {
          console.log('⚠️ Education effect unmounted, aborting layer creation');
          return;
        }

        const filterMsg = geoserverCategories.length > 0 
          ? `filtered by [${geoserverCategories.join(', ')}]` 
          : 'showing all categories';
        const queryMsg = queryResults !== null ? ' (spatial query active)' : '';
        console.log(`📍 Loading ${filteredInstitutions.length} education institutions with clustering (${filterMsg}${queryMsg})`);

        // Ensure all education icons are loaded before adding layers
        await loadEducationIcons(map);

        // Check again after async icon loading
        if (!isMounted || !mapRef.current) {
          console.log('⚠️ Education effect unmounted after icon loading, aborting');
          return;
        }

        // Convert to GeoJSON (include hazard fields from GeoServer)
        const geojson: any = {
          type: 'FeatureCollection',
          features: filteredInstitutions.map(inst => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [inst.lng, inst.lat]
            },
            properties: {
              name: inst.name,
              category: mapCategoryToSubcategoryId(inst.category),
              categoryDisplay: inst.category,
              subcategory: inst.properties.SubCategor || inst.properties.subcategory || null,
              // Include hazard gridcodes from GeoServer
              HHI_2025: inst.properties.HHI_2025,
              Air_AQI: inst.properties.Air_AQI,
              Flood_Hazard: inst.properties.Flood_Hazard,
              Multi_Hazard_BBSR: inst.properties.Multi_Hazard_BBSR
            }
          }))
        };

        // Add source with clustering
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 16,
          clusterRadius: 50
        });

        // Add pulsing background for clusters - animated glow effect
        map.addLayer({
          id: `${clusterLayerId}-pulse`,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#8B5CF6',
              10,
              '#7C3AED',
              30,
              '#6D28D9',
              50,
              '#5B21B6'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,
              10,
              22,
              30,
              26,
              50,
              30
            ],
            'circle-opacity': 0.15,
            'circle-blur': 1
          }
        });

        // Add cluster circles layer - smaller and modern
        map.addLayer({
          id: clusterLayerId,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#8B5CF6',
              10,
              '#7C3AED',
              30,
              '#6D28D9',
              50,
              '#5B21B6'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              10,      // Reduced from 12 to 10 for <10 points
              10,
              13,      // Reduced from 16 to 13 for 10-30 points
              30,
              16,      // Reduced from 20 to 16 for 30-50 points
              50,
              19       // Reduced from 24 to 19 for 50+ points
            ],
            'circle-opacity': 0.85,
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.9
          }
        });

        // Add cluster count labels - smaller and modern
        map.addLayer({
          id: clusterCountLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 9,    // Reduced from 10 to 9 for better fit
            'text-allow-overlap': true
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(139, 92, 246, 0.3)',
            'text-halo-width': 1
          }
        });

        // Add unclustered points with icon symbols matching left panel
        map.addLayer({
          id: unclusteredLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': [
              'match',
              ['get', 'category'],
              'university', 'edu-university',
              'college', 'edu-college',
              'school', 'edu-school',
              'anganwadi', 'edu-anganwadi',
              'edu-school' // fallback
            ],
            'icon-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 0.5,   // At zoom 11 (city level), icons are smaller
              14, 0.75,  // At zoom 14 (neighborhood), icons are medium
              17, 1.0    // At zoom 17 (street level), icons are larger
            ],
            'icon-allow-overlap': false,
            'icon-ignore-placement': false,
            'icon-padding': 2
          },
          paint: {
            'icon-opacity': 0.95
          }
        });

        // 🔒 Ensure strict layer ordering after adding education layers
        setTimeout(() => {
          enforceStrictLayerOrder(map);
          // Clear loading state after layers are added
          setIsLayerLoading(false);
        }, 100);

        // Add click handler for clusters to zoom in with smooth animation
        map.on('click', clusterLayerId, async (e) => {
          console.log('🎓 Cluster clicked!');
          e.preventDefault();
          if (e.originalEvent) {
            e.originalEvent.stopPropagation(); // Prevent ward popup
          }
          
          // Close any open ward popup
          setWardPopupData(null);
          setBuildingPopupData(null);
          
          const features = map.queryRenderedFeatures(e.point, {
            layers: [clusterLayerId]
          });
          
          if (!features.length) {
            console.log('⚠️ No cluster features found');
            return;
          }
          
          console.log('🎯 Found cluster with ID:', features[0].properties.cluster_id);
          
          const clusterId = features[0].properties.cluster_id;
          const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
          const coordinates = (features[0].geometry as any).coordinates;
          
          try {
            // Modern async/await pattern (as per MapLibre docs)
            const zoom = await source.getClusterExpansionZoom(clusterId);
            
            console.log('🔍 Zooming to level:', zoom);
            
            // Smooth animated zoom with flyTo
            map.flyTo({
              center: coordinates,
              zoom: zoom + 0.5, // Zoom in slightly more for better view
              duration: 800, // Smooth 800ms animation
              essential: true,
              easing: (t) => t * (2 - t) // Ease out quad for smooth deceleration
            });
          } catch (err) {
            console.error('❌ Error getting cluster expansion zoom:', err);
          }
        });

        // Add popup for unclustered points - using React component
        map.on('click', unclusteredLayerId, (e) => {
          console.log('🎓 Education point clicked!');
          e.preventDefault();
          if (e.originalEvent) {
            e.originalEvent.stopPropagation(); // Prevent ward popup from showing
          }
          
          // Close any open ward or healthcare popup and clear ward highlighting
          setWardPopupData(null);
          setSelectedWardNumber(null); // Clear ward highlighting
          setHealthcarePopupData(null);
          setBuildingPopupData(null);
          
          if (!e.features || e.features.length === 0) return;
          
          const feature = e.features[0];
          const { name, categoryDisplay, category, subcategory, HHI_2025, Air_AQI, Flood_Hazard, Multi_Hazard_BBSR } = feature.properties;
          
          // Get both geographic and screen coordinates
          const coordinates = (feature.geometry as any).coordinates;
          const point = e.point;
          console.log('🎓 Education institution clicked at:', coordinates, 'screen:', point);

          // Clear location search when opening infrastructure popup
          if (onLocationClear) {
            onLocationClear();
          }
          
          // Save current map state before zooming (for zoom-back on popup close)
          previousMapStateRef.current = {
            center: [map.getCenter().lng, map.getCenter().lat],
            zoom: map.getZoom()
          };
          
          // Auto-zoom to the clicked infrastructure point at zoom level 17
          map.flyTo({
            center: coordinates,
            zoom: 17,
            duration: 800,
            essential: true,
            easing: (t) => t * (2 - t) // Ease out quad for smooth deceleration
          });

          // Set education popup data - hazard gridcodes come directly from the feature properties
          setEducationPopupData({
            name: name || 'Unknown Institution',
            category: categoryDisplay || 'Unknown',
            categoryType: category || 'school', // Pass the raw category for icon mapping
            subcategory: subcategory || undefined,
            hhi2025: HHI_2025,
            airAqi: Air_AQI,
            floodHazard: Flood_Hazard,
            multiHazard: Multi_Hazard_BBSR,
            lng: coordinates[0],
            lat: coordinates[1],
            x: point.x,
            y: point.y
          });
        });

        // Hover effects with visual feedback
        let hoverPopup: maplibregl.Popup | null = null;
        
        map.on('mouseenter', clusterLayerId, (e) => {
          map.getCanvas().style.cursor = 'pointer';
          
          // Show cluster info on hover
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const coordinates = (feature.geometry as any).coordinates.slice();
            const pointCount = feature.properties.point_count;
            
            hoverPopup = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              className: 'cluster-hover-popup',
              offset: 10
            })
              .setLngLat(coordinates)
              .setHTML(`
                <div style="padding: 6px 10px; font-family: Inter, sans-serif; font-size: 11px; color: #0F172A; font-weight: 600;">
                  ${pointCount} institutions
                </div>
              `)
              .addTo(map);
          }
        });
        
        map.on('mouseleave', clusterLayerId, () => {
          map.getCanvas().style.cursor = '';
          if (hoverPopup) {
            hoverPopup.remove();
            hoverPopup = null;
          }
        });
        
        map.on('mouseenter', unclusteredLayerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', unclusteredLayerId, () => {
          map.getCanvas().style.cursor = '';
        });
      };

      loadEducationData();
    } else {
      // Clear loading state when layer is turned off
      setIsLayerLoading(false);
      
      // When educational layer is turned off, zoom back to home view (only if no ward is selected)
      if (!selectedWardId) {
        console.log('🏠 Educational layer closed, zooming back to study area view');
        resetToStudyAreaExtent(map, 1500);
      }
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [activeInfraLayers, activeEducationSubLayers, selectedWardId, mapReady, styleLoadCounter, queryResults]);

  // Handle healthcare layer with clustering
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const sourceId = 'healthcare-facilities';
    const clusterLayerId = 'healthcare-clusters';
    const clusterPulseLayerId = 'healthcare-clusters-pulse';
    const clusterCountLayerId = 'healthcare-cluster-count';
    const unclusteredLayerId = 'healthcare-unclustered-point';

    // Track if component is still mounted
    let isMounted = true;

    // Remove existing layers and source
    if (map.getLayer(unclusteredLayerId)) map.removeLayer(unclusteredLayerId);
    if (map.getLayer(clusterCountLayerId)) map.removeLayer(clusterCountLayerId);
    if (map.getLayer(clusterLayerId)) map.removeLayer(clusterLayerId);
    if (map.getLayer(clusterPulseLayerId)) map.removeLayer(clusterPulseLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (activeInfraLayers.includes('healthcare')) {
      // Set loading state
      setIsLayerLoading(true);
      
      const loadHealthcareData = async () => {
        // Map subcategory IDs to GeoServer category values
        const geoserverCategories = activeHealthcareSubLayers.map(subId => 
          mapHealthcareSubcategoryIdToCategory(subId)
        );

        // NEW BEHAVIOR: If no sublayers selected, show ALL healthcare points
        // If sublayers are selected, only show those specific categories
        const shouldFetchAll = geoserverCategories.length === 0;
        
        if (shouldFetchAll) {
          console.log('��� No healthcare sublayers selected - showing ALL healthcare points');
        } else {
          console.log('🔍 Filtering healthcare points by categories:', geoserverCategories);
        }

        // Fetch data from GeoServer with selected categories (or all if none selected)
        const facilities = await fetchHealthcareData(
          selectedWardName,
          shouldFetchAll ? undefined : geoserverCategories,
          selectedLguName
        );

        // Filter by queryResults if spatial query is active
        let filteredFacilities = facilities;
        if (queryResults !== null) {
          // Check if this is a road query (has segments property)
          const isRoadQuery = queryResults.some((f: any) => f.properties?.segments !== undefined);
          
          if (!isRoadQuery) {
            // POI query - filter facilities to match query results
            // Query was executed - strictly show only results (even if empty)
            if (queryResults.length > 0) {
              const queryResultIds = new Set(queryResults.map(r => r.id));
              filteredFacilities = facilities.filter(fac => queryResultIds.has(fac.id));
              console.log(`🔍 Filtered healthcare results: ${filteredFacilities.length}/${facilities.length} points match spatial query`);
            } else {
              // Query returned 0 results - show NO points
              filteredFacilities = [];
              console.log(`🔍 Query returned 0 results - hiding all healthcare points`);
            }
          } else {
            // Road query - don't filter infrastructure points, show all
            console.log(`🛣️ Road query active - showing all healthcare points alongside road segments`);
          }
        }

        // Check if component is still mounted before proceeding
        if (!isMounted || !mapRef.current) {
          console.log('⚠️ Healthcare effect unmounted, aborting layer creation');
          return;
        }

        const filterMsg = geoserverCategories.length > 0 
          ? `filtered by [${geoserverCategories.join(', ')}]` 
          : 'showing all categories';
        const queryMsg = queryResults && queryResults.length > 0 ? ' (spatial query active)' : '';
        console.log(`📍 Loading ${filteredFacilities.length} healthcare facilities with clustering (${filterMsg}${queryMsg})`);

        // Ensure all healthcare icons are loaded before adding layers
        await loadHealthcareIcons(map);

        // Check again after async icon loading
        if (!isMounted || !mapRef.current) {
          console.log('⚠️ Healthcare effect unmounted after icon loading, aborting');
          return;
        }

        // Convert to GeoJSON (include hazard fields from GeoServer)
        const geojson: any = {
          type: 'FeatureCollection',
          features: filteredFacilities.map(facility => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [facility.lng, facility.lat]
            },
            properties: {
              name: facility.name,
              category: mapHealthcareCategoryToSubcategoryId(facility.category),
              categoryDisplay: facility.category,
              subcategory: facility.properties.SubCategor || facility.properties.subcategory || null,
              // Include hazard gridcodes from GeoServer
              HHI_2025: facility.properties.HHI_2025,
              Air_AQI: facility.properties.Air_AQI,
              Flood_Hazard: facility.properties.Flood_Hazard,
              Multi_Hazard_BBSR: facility.properties.Multi_Hazard_BBSR
            }
          }))
        };

        // Add source with clustering
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 16,
          clusterRadius: 50
        });

        // Add pulsing background for clusters
        map.addLayer({
          id: `${clusterLayerId}-pulse`,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#EF4444',
              10,
              '#DC2626',
              30,
              '#B91C1C',
              50,
              '#991B1B'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,
              10,
              22,
              30,
              26,
              50,
              30
            ],
            'circle-opacity': 0.15,
            'circle-blur': 1
          }
        });

        // Add cluster circles layer
        map.addLayer({
          id: clusterLayerId,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#EF4444',
              10,
              '#DC2626',
              30,
              '#B91C1C',
              50,
              '#991B1B'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              10,
              10,
              13,
              30,
              16,
              50,
              19
            ],
            'circle-opacity': 0.85,
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.9
          }
        });

        // Add cluster count labels
        map.addLayer({
          id: clusterCountLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 9,
            'text-allow-overlap': true
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(239, 68, 68, 0.3)',
            'text-halo-width': 1
          }
        });

        // Add unclustered points with icon symbols
        map.addLayer({
          id: unclusteredLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': [
              'match',
              ['get', 'category'],
              'hospital', 'health-hospital',
              'clinic', 'health-clinic',
              'phc', 'health-phc',
              'health_center', 'health-center',
              'dispensary', 'health-dispensary',
              'health-hospital' // fallback
            ],
            'icon-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 0.5,
              14, 0.75,
              17, 1.0
            ],
            'icon-allow-overlap': false,
            'icon-ignore-placement': false,
            'icon-padding': 2
          },
          paint: {
            'icon-opacity': 0.95
          }
        });

        // 🔒 Ensure strict layer ordering after adding healthcare layers
        setTimeout(() => {
          enforceStrictLayerOrder(map);
          // Clear loading state after layers are added
          setIsLayerLoading(false);
        }, 100);

        // Add click handler for clusters to zoom in
        map.on('click', clusterLayerId, async (e) => {
          console.log('🏥 Healthcare cluster clicked!');
          e.preventDefault();
          if (e.originalEvent) {
            e.originalEvent.stopPropagation();
          }
          
          setWardPopupData(null);
          
          const features = map.queryRenderedFeatures(e.point, {
            layers: [clusterLayerId]
          });
          
          if (!features.length) return;
          
          const clusterId = features[0].properties.cluster_id;
          const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
          const coordinates = (features[0].geometry as any).coordinates;
          
          try {
            const zoom = await source.getClusterExpansionZoom(clusterId);
            map.flyTo({
              center: coordinates,
              zoom: zoom + 0.5,
              duration: 800,
              essential: true,
              easing: (t) => t * (2 - t)
            });
          } catch (err) {
            console.error('❌ Error getting cluster expansion zoom:', err);
          }
        });

        // Add popup for unclustered healthcare points - using React component
        map.on('click', unclusteredLayerId, (e) => {
          console.log('🏥 Healthcare point clicked!');
          e.preventDefault();
          if (e.originalEvent) {
            e.originalEvent.stopPropagation(); // Prevent ward popup from showing
          }
          
          // Close any open ward popup and clear ward highlighting
          setWardPopupData(null);
          setSelectedWardNumber(null); // Clear ward highlighting
          setBuildingPopupData(null);
          
          if (!e.features || e.features.length === 0) return;
          
          const feature = e.features[0];
          const { name, categoryDisplay, category, subcategory, HHI_2025, Air_AQI, Flood_Hazard, Multi_Hazard_BBSR } = feature.properties;
          
          // Get both geographic and screen coordinates
          const coordinates = (feature.geometry as any).coordinates;
          const point = e.point;
          console.log('🏥 Healthcare facility clicked at:', coordinates, 'screen:', point);

          // Clear location search when opening infrastructure popup
          if (onLocationClear) {
            onLocationClear();
          }
          
          // Save current map state before zooming (for zoom-back on popup close)
          previousMapStateRef.current = {
            center: [map.getCenter().lng, map.getCenter().lat],
            zoom: map.getZoom()
          };
          
          // Auto-zoom to the clicked infrastructure point at zoom level 17
          map.flyTo({
            center: coordinates,
            zoom: 17,
            duration: 800,
            essential: true,
            easing: (t) => t * (2 - t) // Ease out quad for smooth deceleration
          });

          // Set healthcare popup data - hazard gridcodes come directly from the feature properties
          setHealthcarePopupData({
            name: name || 'Unknown Facility',
            category: categoryDisplay || 'Unknown',
            categoryType: category || 'hospital', // Pass the raw category for icon mapping
            subcategory: subcategory || undefined,
            hhi2025: HHI_2025,
            airAqi: Air_AQI,
            floodHazard: Flood_Hazard,
            multiHazard: Multi_Hazard_BBSR,
            lng: coordinates[0],
            lat: coordinates[1],
            x: point.x,
            y: point.y
          });
        });

        // Hover effects
        let hoverPopup: maplibregl.Popup | null = null;
        
        map.on('mouseenter', clusterLayerId, (e) => {
          map.getCanvas().style.cursor = 'pointer';
          
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const coordinates = (feature.geometry as any).coordinates.slice();
            const pointCount = feature.properties.point_count;
            
            hoverPopup = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              className: 'cluster-hover-popup',
              offset: 10
            })
              .setLngLat(coordinates)
              .setHTML(`
                <div style="padding: 6px 10px; font-family: Inter, sans-serif; font-size: 11px; color: #0F172A; font-weight: 600;">
                  ${pointCount} facilities
                </div>
              `)
              .addTo(map);
          }
        });
        
        map.on('mouseleave', clusterLayerId, () => {
          map.getCanvas().style.cursor = '';
          if (hoverPopup) {
            hoverPopup.remove();
            hoverPopup = null;
          }
        });
        
        map.on('mouseenter', unclusteredLayerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', unclusteredLayerId, () => {
          map.getCanvas().style.cursor = '';
        });
      };

      loadHealthcareData();
    } else {
      // Clear loading state when layer is turned off
      setIsLayerLoading(false);
      
      // When healthcare layer is turned off, zoom back to home view (only if no ward is selected)
      if (!selectedWardId) {
        console.log('🏠 Healthcare layer closed, zooming back to study area view');
        resetToStudyAreaExtent(map, 1500);
      }
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [activeInfraLayers, activeHealthcareSubLayers, selectedWardId, mapReady, styleLoadCounter, queryResults]);

  // Handle public amenities layer with clustering
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const sourceId = 'public-amenities';
    const clusterLayerId = 'public-amenities-clusters';
    const clusterPulseLayerId = 'public-amenities-clusters-pulse';
    const clusterCountLayerId = 'public-amenities-cluster-count';
    const unclusteredLayerId = 'public-amenities-unclustered-point';

    // Track if component is still mounted
    let isMounted = true;

    // Remove existing layers and source
    if (map.getLayer(unclusteredLayerId)) map.removeLayer(unclusteredLayerId);
    if (map.getLayer(clusterCountLayerId)) map.removeLayer(clusterCountLayerId);
    if (map.getLayer(clusterLayerId)) map.removeLayer(clusterLayerId);
    if (map.getLayer(clusterPulseLayerId)) map.removeLayer(clusterPulseLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (activeInfraLayers.includes('public_amenities')) {
      // Set loading state
      setIsLayerLoading(true);
      
      const loadPublicAmenitiesData = async () => {
        // Map subcategory IDs to GeoServer category values
        const geoserverCategories = activePublicAmenitiesSubLayers.map(subId => 
          mapPublicAmenitiesSubcategoryIdToCategory(subId)
        );

        // NEW BEHAVIOR: If no sublayers selected, show ALL public amenities points
        // If sublayers are selected, only show those specific categories
        const shouldFetchAll = geoserverCategories.length === 0;
        
        if (shouldFetchAll) {
          console.log('📍 No public amenities sublayers selected - showing ALL amenities points');
        } else {
          console.log('🔍 Filtering public amenities points by categories:', geoserverCategories);
        }

        // Fetch data from GeoServer with selected categories (or all if none selected)
        const amenities = await fetchPublicAmenitiesData(
          selectedWardName,
          shouldFetchAll ? undefined : geoserverCategories,
          selectedLguName
        );

        // Filter by queryResults if spatial query is active
        let filteredAmenities = amenities;
        if (queryResults !== null) {
          // Check if this is a road query (has segments property)
          const isRoadQuery = queryResults.some((f: any) => f.properties?.segments !== undefined);
          
          if (!isRoadQuery) {
            // POI query - filter amenities to match query results
            // Query was executed - strictly show only results (even if empty)
            if (queryResults.length > 0) {
              const queryResultIds = new Set(queryResults.map(r => r.id));
              filteredAmenities = amenities.filter(am => queryResultIds.has(am.id));
              console.log(`🔍 Filtered public amenities results: ${filteredAmenities.length}/${amenities.length} points match spatial query`);
            } else {
              // Query returned 0 results - show NO points
              filteredAmenities = [];
              console.log(`🔍 Query returned 0 results - hiding all public amenities points`);
            }
          } else {
            // Road query - don't filter infrastructure points, show all
            console.log(`🛣️ Road query active - showing all public amenities points alongside road segments`);
          }
        }

        // Check if component is still mounted before proceeding
        if (!isMounted || !mapRef.current) {
          console.log('⚠️ Public amenities effect unmounted, aborting layer creation');
          return;
        }

        const filterMsg = geoserverCategories.length > 0 
          ? `filtered by [${geoserverCategories.join(', ')}]` 
          : 'showing all categories';
        const queryMsg = queryResults && queryResults.length > 0 ? ' (spatial query active)' : '';
        console.log(`📍 Loading ${filteredAmenities.length} public amenities with clustering (${filterMsg}${queryMsg})`);

        // Ensure all amenity icons are loaded before adding layers
        console.log('🔄 Loading amenity icons before adding layers...');
        await loadPublicAmenitiesIcons(map);
        console.log('✅ Amenity icons loaded, proceeding with layer creation');

        // Check again after async icon loading
        if (!isMounted || !mapRef.current) {
          console.log('⚠️ Public amenities effect unmounted after icon loading, aborting');
          return;
        }

        // Convert to GeoJSON (include hazard fields from GeoServer)
        const geojson: any = {
          type: 'FeatureCollection',
          features: filteredAmenities.map(amenity => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [amenity.lng, amenity.lat]
            },
            properties: {
              name: amenity.name,
              category: mapPublicAmenitiesCategoryToSubcategoryId(amenity.category),
              categoryDisplay: amenity.category,
              subcategory: amenity.properties.SubCategor || amenity.properties.subcategory || null,
              // Include hazard gridcodes from GeoServer
              HHI_2025: amenity.properties.HHI_2025,
              Air_AQI: amenity.properties.Air_AQI,
              Flood_Hazard: amenity.properties.Flood_Hazard,
              Multi_Hazard_BBSR: amenity.properties.Multi_Hazard_BBSR
            }
          }))
        };

        // Add source with clustering
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 16,
          clusterRadius: 50
        });

        // Add pulsing background for clusters
        map.addLayer({
          id: `${clusterLayerId}-pulse`,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#06B6D4',
              10,
              '#0891B2',
              30,
              '#0E7490',
              50,
              '#155E75'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,
              10,
              22,
              30,
              26,
              50,
              30
            ],
            'circle-opacity': 0.15,
            'circle-blur': 1
          }
        });

        // Add cluster circles layer
        map.addLayer({
          id: clusterLayerId,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#06B6D4',
              10,
              '#0891B2',
              30,
              '#0E7490',
              50,
              '#155E75'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              10,
              10,
              13,
              30,
              16,
              50,
              19
            ],
            'circle-opacity': 0.85,
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.9
          }
        });

        // Add cluster count labels
        map.addLayer({
          id: clusterCountLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 9,
            'text-allow-overlap': true
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(6, 182, 212, 0.3)',
            'text-halo-width': 1
          }
        });

        // Add unclustered points with icon symbols
        map.addLayer({
          id: unclusteredLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': [
              'match',
              ['get', 'category'],
              'community_centre', 'amenity-community',
              'culture_centre', 'amenity-culture',
              'fire_station', 'amenity-fire',
              'government_buildings', 'amenity-government',
              'parks', 'amenity-park',
              'police_outpost', 'amenity-police',
              'post_office', 'amenity-post',
              'haat_market', 'amenity-market',
              'amenity-default' // fallback
            ],
            'icon-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 0.5,
              14, 0.75,
              17, 1.0
            ],
            'icon-allow-overlap': false,
            'icon-ignore-placement': false,
            'icon-padding': 2
          },
          paint: {
            'icon-opacity': 0.95
          }
        });

        // 🔒 Ensure strict layer ordering after adding public amenities layers
        setTimeout(() => {
          enforceStrictLayerOrder(map);
          // Clear loading state after layers are added
          setIsLayerLoading(false);
        }, 100);

        // Add click handler for clusters to zoom in
        map.on('click', clusterLayerId, async (e) => {
          console.log('🏛️ Public amenity cluster clicked!');
          e.preventDefault();
          if (e.originalEvent) {
            e.originalEvent.stopPropagation();
          }
          
          setWardPopupData(null);
          
          const features = map.queryRenderedFeatures(e.point, {
            layers: [clusterLayerId]
          });
          
          if (!features.length) return;
          
          const clusterId = features[0].properties.cluster_id;
          const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
          const coordinates = (features[0].geometry as any).coordinates;
          
          try {
            const zoom = await source.getClusterExpansionZoom(clusterId);
            map.flyTo({
              center: coordinates,
              zoom: zoom + 0.5,
              duration: 800,
              essential: true,
              easing: (t) => t * (2 - t)
            });
          } catch (err) {
            console.error('❌ Error getting cluster expansion zoom:', err);
          }
        });

        // Add popup for unclustered public amenity points - using React component
        map.on('click', unclusteredLayerId, (e) => {
          console.log('🏛️ Public amenity point clicked!');
          e.preventDefault();
          if (e.originalEvent) {
            e.originalEvent.stopPropagation(); // Prevent ward popup from showing
          }
          
          // Close any open ward popup and clear ward highlighting
          setWardPopupData(null);
          setSelectedWardNumber(null); // Clear ward highlighting
          setBuildingPopupData(null);
          
          if (!e.features || e.features.length === 0) return;
          
          const feature = e.features[0];
          const { name, categoryDisplay, category, subcategory, HHI_2025, Air_AQI, Flood_Hazard, Multi_Hazard_BBSR } = feature.properties;
          
          // Get both geographic and screen coordinates
          const coordinates = (feature.geometry as any).coordinates;
          const point = e.point;
          console.log('🏛️ Public amenity clicked at:', coordinates, 'screen:', point);

          // Clear location search when opening infrastructure popup
          if (onLocationClear) {
            onLocationClear();
          }
          
          // Save current map state before zooming (for zoom-back on popup close)
          previousMapStateRef.current = {
            center: [map.getCenter().lng, map.getCenter().lat],
            zoom: map.getZoom()
          };
          
          // Auto-zoom to the clicked infrastructure point at zoom level 17
          map.flyTo({
            center: coordinates,
            zoom: 17,
            duration: 800,
            essential: true,
            easing: (t) => t * (2 - t) // Ease out quad for smooth deceleration
          });

          // Set public amenities popup data - hazard gridcodes come directly from the feature properties
          setPublicAmenitiesPopupData({
            name: name || 'Unknown Facility',
            category: categoryDisplay || 'Unknown',
            categoryType: category || 'community_centre', // Pass the raw category for icon mapping
            subcategory: subcategory || undefined,
            hhi2025: HHI_2025,
            airAqi: Air_AQI,
            floodHazard: Flood_Hazard,
            multiHazard: Multi_Hazard_BBSR,
            lng: coordinates[0],
            lat: coordinates[1],
            x: point.x,
            y: point.y
          });
        });

        // Hover effects
        let hoverPopup: maplibregl.Popup | null = null;
        
        map.on('mouseenter', clusterLayerId, (e) => {
          map.getCanvas().style.cursor = 'pointer';
          
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const coordinates = (feature.geometry as any).coordinates.slice();
            const pointCount = feature.properties.point_count;
            
            hoverPopup = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              className: 'cluster-hover-popup',
              offset: 10
            })
              .setLngLat(coordinates)
              .setHTML(`
                <div style="padding: 6px 10px; font-family: Inter, sans-serif; font-size: 11px; color: #0F172A; font-weight: 600;">
                  ${pointCount} amenities
                </div>
              `)
              .addTo(map);
          }
        });
        
        map.on('mouseleave', clusterLayerId, () => {
          map.getCanvas().style.cursor = '';
          if (hoverPopup) {
            hoverPopup.remove();
            hoverPopup = null;
          }
        });
        
        map.on('mouseenter', unclusteredLayerId, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        
        map.on('mouseleave', unclusteredLayerId, () => {
          map.getCanvas().style.cursor = '';
        });
      };

      loadPublicAmenitiesData();
    } else {
      // Clear loading state when layer is turned off
      setIsLayerLoading(false);
      
      // When public amenities layer is turned off, zoom back to home view (only if no ward is selected)
      if (!selectedWardId) {
        console.log('🏠 Public amenities layer closed, zooming back to study area view');
        resetToStudyAreaExtent(map, 1500);
      }
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [activeInfraLayers, activePublicAmenitiesSubLayers, selectedWardId, mapReady, styleLoadCounter, queryResults]);

  // Add transport & mobility infrastructure with clustering (using GeoServer data)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;
    const sourceId = 'transport-source';
    const clusterLayerId = 'transport-clusters';
    const clusterPulseLayerId = 'transport-clusters-pulse';
    const clusterCountLayerId = 'transport-cluster-count';
    const unclusteredLayerId = 'transport-unclustered-point';

    // Track if component is still mounted
    let isMounted = true;

    // Remove existing layers and source
    if (map.getLayer(unclusteredLayerId)) map.removeLayer(unclusteredLayerId);
    if (map.getLayer(clusterCountLayerId)) map.removeLayer(clusterCountLayerId);
    if (map.getLayer(clusterLayerId)) map.removeLayer(clusterLayerId);
    if (map.getLayer(clusterPulseLayerId)) map.removeLayer(clusterPulseLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);

    if (activeInfraLayers.includes('transport_mobility')) {
      // Set loading state
      setIsLayerLoading(true);
      
      const loadTransportDataAsync = async () => {
        // Map subcategory IDs to GeoServer category values
        const geoserverCategories = activeTransportSubLayers.map(subId => 
          mapTransportSubcategoryIdToCategory(subId)
        );

        // NEW BEHAVIOR: If no sublayers selected, show ALL transport points
        // If sublayers are selected, only show those specific categories
        const shouldFetchAll = geoserverCategories.length === 0;
        
        if (shouldFetchAll) {
          console.log('📍 No transport sublayers selected - showing ALL transport points');
        } else {
          console.log('🔍 Filtering transport points by categories:', geoserverCategories);
        }

        // Fetch data from GeoServer with ward filtering and selected categories (or all if none selected)
        const facilities = await fetchTransportData(
          selectedWardName,
          shouldFetchAll ? undefined : geoserverCategories,
          selectedLguName
        );

        // Filter by queryResults if spatial query is active
        let filteredFacilities = facilities;
        if (queryResults !== null) {
          // Check if this is a road query (has segments property)
          const isRoadQuery = queryResults.some((f: any) => f.properties?.segments !== undefined);
          
          if (!isRoadQuery) {
            // POI query - filter facilities to match query results
            // Query was executed - strictly show only results (even if empty)
            if (queryResults.length > 0) {
              const queryResultIds = new Set(queryResults.map(r => r.id));
              filteredFacilities = facilities.filter(fac => queryResultIds.has(fac.id));
              console.log(`🔍 Filtered transport results: ${filteredFacilities.length}/${facilities.length} points match spatial query`);
            } else {
              // Query returned 0 results - show NO points
              filteredFacilities = [];
              console.log(`🔍 Query returned 0 results - hiding all transport points`);
            }
          } else {
            // Road query - don't filter infrastructure points, show all
            console.log(`🛣️ Road query active - showing all transport points alongside road segments`);
          }
        }

        // Check if component is still mounted before proceeding
        if (!isMounted || !mapRef.current) {
          console.log('⚠️ Transport effect unmounted, aborting layer creation');
          return;
        }

        const filterMsg = geoserverCategories.length > 0 
          ? `filtered by [${geoserverCategories.join(', ')}]` 
          : 'showing all categories';
        const queryMsg = queryResults && queryResults.length > 0 ? ' (spatial query active)' : '';
        console.log(`📍 Loading ${filteredFacilities.length} transport facilities with clustering (${filterMsg}${queryMsg})`);

        // Ensure all transport icons are loaded before adding layers
        console.log('🔄 Loading transport icons before adding layers...');
        await loadTransportIcons(map);
        console.log('✅ Transport icons ready, proceeding with layer creation');

        // Convert to GeoJSON (include hazard fields from GeoServer)
        const geojson: any = {
          type: 'FeatureCollection',
          features: filteredFacilities.map(facility => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [facility.lng, facility.lat]
            },
            properties: {
              name: facility.name,
              category: mapTransportCategoryToSubcategoryId(facility.category),
              categoryDisplay: facility.category,
              // Include hazard gridcodes from GeoServer
              HHI_2025: facility.properties.HHI_2025,
              Air_AQI: facility.properties.Air_AQI,
              Flood_Hazard: facility.properties.Flood_Hazard,
              Multi_Hazard_BBSR: facility.properties.Multi_Hazard_BBSR
            }
          }))
        };

        // Double-check source doesn't exist before adding (race condition protection)
        if (map.getSource(sourceId)) {
          console.log('⚠️ Transport source already exists, removing before re-adding');
          map.removeSource(sourceId);
        }

        // Add source with clustering
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 16,
          clusterRadius: 50
        });

        // Add pulsing background for clusters
        map.addLayer({
          id: clusterPulseLayerId,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#EA580C',
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18, 10, 22, 30, 26, 50, 30
            ],
            'circle-opacity': 0.15,
            'circle-blur': 1
          }
        });

        // Add cluster circles layer
        map.addLayer({
          id: clusterLayerId,
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#EA580C', 10, '#DC2626', 30, '#B91C1C', 50, '#991B1B'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              10, 10, 13, 30, 16, 50, 19
            ],
            'circle-opacity': 0.85,
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.9
          }
        });

        // Add cluster count labels
        map.addLayer({
          id: clusterCountLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 9,
            'text-allow-overlap': true
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(234, 88, 12, 0.3)',
            'text-halo-width': 1
          }
        });

        // Add unclustered points with icon symbols
        map.addLayer({
          id: unclusteredLayerId,
          type: 'symbol',
          source: sourceId,
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': [
              'match',
              ['get', 'category'],
              'airport', 'transport-airport',
              'bus_terminals', 'transport-bus',
              'bus_stop', 'transport-bus',
              'ev_charging', 'transport-ev',
              'petrol_pump', 'transport-fuel',
              'railway_stations', 'transport-station',
              'transport-bus'
            ],
            'icon-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              11, 0.5, 14, 0.75, 17, 1.0
            ],
            'icon-allow-overlap': false,
            'icon-ignore-placement': false,
            'icon-padding': 2
          },
          paint: {
            'icon-opacity': 0.95
          }
        });

        // 🔒 Ensure strict layer ordering after adding transport layers
        setTimeout(() => {
          enforceStrictLayerOrder(map);
          // Clear loading state after layers are added
          setIsLayerLoading(false);
        }, 100);

        // Click handler for clusters
        map.on('click', clusterLayerId, async (e) => {
          console.log('🚌 Transport cluster clicked!');
          e.preventDefault();
          if (e.originalEvent) e.originalEvent.stopPropagation();
          setWardPopupData(null);
          
          const features = map.queryRenderedFeatures(e.point, { layers: [clusterLayerId] });
          if (!features.length) {
            console.log('⚠️ No transport cluster features found');
            return;
          }
          
          console.log('🎯 Found transport cluster with ID:', features[0].properties.cluster_id);
          
          const clusterId = features[0].properties.cluster_id;
          const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
          const coordinates = (features[0].geometry as any).coordinates;
          
          try {
            // Modern async/await pattern (same as education/healthcare)
            const zoom = await source.getClusterExpansionZoom(clusterId);
            
            console.log('🔍 Zooming to transport cluster at level:', zoom);
            
            // Smooth animated zoom with flyTo
            map.flyTo({
              center: coordinates,
              zoom: zoom + 0.5, // Zoom in slightly more for better view
              duration: 800, // Smooth 800ms animation
              essential: true,
              easing: (t) => t * (2 - t) // Ease out quad for smooth deceleration
            });
          } catch (err) {
            console.error('❌ Error getting transport cluster expansion zoom:', err);
          }
        });

        // Click handler for unclustered points
        map.on('click', unclusteredLayerId, (e) => {
          e.preventDefault();
          if (e.originalEvent) e.originalEvent.stopPropagation();
          setWardPopupData(null);
          setSelectedWardNumber(null); // Clear ward highlighting
          setBuildingPopupData(null);
          
          const features = map.queryRenderedFeatures(e.point, { layers: [unclusteredLayerId] });
          if (!features.length) return;
          
          const feature = features[0];
          const coordinates = (feature.geometry as any).coordinates;
          const point = map.project(coordinates);
          
          console.log('🚌 Transport facility clicked at:', coordinates, 'screen:', point);
          
          // Clear location search when opening infrastructure popup
          if (onLocationClear) {
            onLocationClear();
          }
          
          // Save current map state before zooming (for zoom-back on popup close)
          previousMapStateRef.current = {
            center: [map.getCenter().lng, map.getCenter().lat],
            zoom: map.getZoom()
          };
          
          // Auto-zoom to the clicked infrastructure point at zoom level 17
          map.flyTo({
            center: coordinates,
            zoom: 17,
            duration: 800,
            essential: true,
            easing: (t) => t * (2 - t) // Ease out quad for smooth deceleration
          });

          // Extract hazard gridcodes directly from feature properties
          const { HHI_2025, Air_AQI, Flood_Hazard, Multi_Hazard_BBSR } = feature.properties;

          setTransportPopupData({
            name: feature.properties.name || 'Unknown Facility',
            category: feature.properties.categoryDisplay || 'Transport',
            categoryType: feature.properties.category || 'transport',
            hhi2025: HHI_2025,
            airAqi: Air_AQI,
            floodHazard: Flood_Hazard,
            multiHazard: Multi_Hazard_BBSR,
            lng: coordinates[0],
            lat: coordinates[1],
            x: point.x,
            y: point.y
          });
        });

        // Cursor changes on hover
        map.on('mouseenter', clusterLayerId, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', clusterLayerId, () => { map.getCanvas().style.cursor = ''; });
        map.on('mouseenter', unclusteredLayerId, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', unclusteredLayerId, () => { map.getCanvas().style.cursor = ''; });

        // Update infrastructure counts
        if (onInfrastructureCountsUpdate) {
          onInfrastructureCountsUpdate({ transport: facilities.length });
        }
      };

      loadTransportDataAsync().catch(err => {
        console.error('❌ Error loading transport data:', err);
        // Clear loading state on error
        setIsLayerLoading(false);
      });
    } else {
      // Clear loading state when layer is turned off
      setIsLayerLoading(false);
      
      // Zoom back to home view when transport layer is turned off (only if no ward is selected)
      if (!selectedWardId) {
        console.log('🚌 Transport layer closed, zooming back to study area view');
        resetToStudyAreaExtent(map, 1500);
      }
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [activeInfraLayers, activeTransportSubLayers, selectedWardId, mapReady, onInfrastructureCountsUpdate, styleLoadCounter, queryResults]);

  // Helper function to attach click handler to a road safety layer
  const attachRoadSafetyClickHandler = (
    map: maplibregl.Map,
    clickLayerId: string, // The layer that receives click events (hit area)
    visibleLayerId: string, // The actual visible layer ID (for logging/debugging)
    fieldName: string,
    starColors: Record<number, string>,
    setWardPopupData: any,
    setEducationPopupData: any,
    setHealthcarePopupData: any
  ) => {
    // Icon SVGs for each safety type (inline SVG for HTML popup)
    const iconSVGs: Record<string, string> = {
      'irap_vehicle': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
      'irap_motorcycle': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.31 9.31 5 21"/><path d="m13 2 2 9.5"/><path d="m10.5 12.5-4-7.5"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
      'irap_bicycle': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>',
      'irap_pedestrian': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
    };
    
    const displayNames: Record<string, string> = {
      'irap_vehicle': 'Vehicle',
      'irap_motorcycle': 'Motorcycle',
      'irap_bicycle': 'Bicycle',
      'irap_pedestrian': 'Pedestrian'
    };
    
    const createCompactStarRatingHTML = (rating: number, ratingType: string, icon: string) => {
      const validRating = rating >= 0 && rating <= 5 ? rating : 0;
      const color = starColors[validRating];
      
      let starsHTML = '';
      for (let i = 1; i <= 5; i++) {
        starsHTML += i <= validRating 
          ? `<span style="color: ${color}; font-size: 11px; line-height: 1;">★</span>`
          : `<span style="color: #E5E7EB; font-size: 11px; line-height: 1;">★</span>`;
      }
      
      return `
        <div style="display: flex; align-items: center; gap: 5px; padding: 3px 0;">
          <div style="color: #64748B; flex-shrink: 0; width: 14px; display: flex; justify-content: center;">${icon}</div>
          <div style="line-height: 1; flex: 1;">${starsHTML}</div>
          <div style="font-size: 8px; color: #94A3B8; font-weight: 600; background: #F8FAFC; padding: 2px 4px; border-radius: 3px; white-space: nowrap;">${validRating}/5</div>
        </div>
      `;
    };
    
    const handleClick = (e: any) => {
      e.preventDefault();
      if (e.originalEvent) e.originalEvent.stopPropagation();
      
      console.log(`🛣️ ROAD SAFETY CLICKED: ${visibleLayerId} (via hit area: ${clickLayerId})`);
      
      // Close other popups
      setWardPopupData(null);
      setEducationPopupData(null);
      setHealthcarePopupData(null);
      setPublicAmenitiesPopupData(null);
      setTransportPopupData(null);
      setBuildingPopupData(null);
      
      // Query ALL 4 road safety layers at the click point to get all ratings
      // BUT only query layers that actually exist on the map
      const allLayers = ['irap_vehicle', 'irap_motorcycle', 'irap_bicycle', 'irap_pedestrian'];
      const existingLayers = allLayers.filter(layerId => map.getLayer(layerId));
      
      console.log(`🔍 Querying existing road safety layers: ${existingLayers.join(', ')}`);
      
      if (existingLayers.length === 0) {
        console.warn('⚠️ No road safety layers found on map');
        return;
      }
      
      const features = map.queryRenderedFeatures(e.point, { layers: existingLayers });
      console.log(`🔍 Features found across ${existingLayers.length} layers: ${features.length}`);
      
      if (!features.length) return;
      
      // Get road info from the first feature
      const properties = features[0].properties;
      const roadName = properties.Road_name || 'Unknown Road';
      const section = properties.Section || 'N/A';
      const distance = properties.Distance || 'N/A';
      const codingLink = properties.Coding_Lin || '';
      
      // Field mapping for each layer
      const fieldMapping: Record<string, string> = {
        'irap_vehicle': 'Vehicle_St',
        'irap_motorcycle': 'Motorcycli',
        'irap_bicycle': 'Bicyclist_',
        'irap_pedestrian': 'Pedestrian',
        'road_vehicle': 'Vehicle_St',
        'road_motorcycle': 'Motorcycli',
        'road_bicycle': 'Bicyclist_',
        'road_pedestrian': 'Pedestrian'
      };
      
      // Get all ratings
      const vehicleRating = properties[fieldMapping['irap_vehicle']] || 0;
      const motorcycleRating = properties[fieldMapping['irap_motorcycle']] || 0;
      const bicycleRating = properties[fieldMapping['irap_bicycle']] || 0;
      const pedestrianRating = properties[fieldMapping['irap_pedestrian']] || 0;
      
      // Get screen coordinates
      const point = map.project(e.lngLat);
      
      // Save current map view before zooming
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();
      const viewToSave = {
        center: { lng: currentCenter.lng, lat: currentCenter.lat },
        zoom: currentZoom
      };
      
      // Save to both state and ref for immediate access
      setPreviousRoadSafetyView(viewToSave);
      previousRoadSafetyViewRef.current = viewToSave;
      
      console.log(`💾 [SAVE] Saved previous map view to state AND ref: center [${currentCenter.lng.toFixed(4)}, ${currentCenter.lat.toFixed(4)}], zoom ${currentZoom.toFixed(2)}`);
      
      // Zoom to the clicked road feature with smooth animation
      // Use a reasonable zoom level (15) - not too close, not too far
      map.flyTo({
        center: [e.lngLat.lng, e.lngLat.lat],
        zoom: 15,
        duration: 1000, // 1 second smooth animation
        essential: true
      });
      
      console.log(`🔍 Zooming to road safety feature at [${e.lngLat.lng.toFixed(4)}, ${e.lngLat.lat.toFixed(4)}]`);
      
      // Set React-based popup data
      setRoadSafetyPopupData({
        roadName,
        section,
        distance,
        vehicleRating,
        motorcycleRating,
        bicycleRating,
        pedestrianRating,
        codingLink,
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        x: point.x,
        y: point.y
      });
        
      console.log('✅ Road safety popup data set!');
      
      // Add blue highlight to the clicked road safety feature
      const highlightLayerId = 'road-safety-click-highlight';
      
      // Remove existing highlight if any
      if (map.getLayer(`${highlightLayerId}-glow`)) {
        map.removeLayer(`${highlightLayerId}-glow`);
      }
      if (map.getLayer(highlightLayerId)) {
        map.removeLayer(highlightLayerId);
      }
      if (map.getSource(highlightLayerId)) {
        map.removeSource(highlightLayerId);
      }
      
      // Add highlight source with the clicked feature's geometry
      map.addSource(highlightLayerId, {
        type: 'geojson',
        data: features[0].toJSON()
      });
      
      // Add outer glow layer (lighter blue, thicker)
      map.addLayer({
        id: `${highlightLayerId}-glow`,
        type: 'line',
        source: highlightLayerId,
        paint: {
          'line-color': '#3B82F6', // Blue-500
          'line-width': 8,
          'line-opacity': 0.4,
          'line-blur': 2
        }
      });
      
      // Add inner highlight layer (bright blue, sharp)
      map.addLayer({
        id: highlightLayerId,
        type: 'line',
        source: highlightLayerId,
        paint: {
          'line-color': '#60A5FA', // Blue-400
          'line-width': 4,
          'line-opacity': 1
        }
      });
      
      console.log('🔵 Blue highlight added to clicked road safety feature');
      
      // Auto-remove highlight after 2 seconds
      setTimeout(() => {
        try {
          if (map && map.getLayer(`${highlightLayerId}-glow`)) {
            map.removeLayer(`${highlightLayerId}-glow`);
          }
          if (map && map.getLayer(highlightLayerId)) {
            map.removeLayer(highlightLayerId);
          }
          if (map && map.getSource(highlightLayerId)) {
            map.removeSource(highlightLayerId);
          }
          console.log('✅ Blue highlight removed after 2 seconds');
        } catch (error) {
          console.log('⚠️ Error removing road safety highlight:', error);
        }
      }, 2000);
    };
    
    // Attach click events to the invisible hit area layer (wider, easier to click)
    map.on('click', clickLayerId, handleClick);
    map.on('mouseenter', clickLayerId, () => { 
      map.getCanvas().style.cursor = 'pointer';
      console.log(`👆 Hover on ${visibleLayerId} (hit area: ${clickLayerId})`);
    });
    map.on('mouseleave', clickLayerId, () => map.getCanvas().style.cursor = '');
    
    console.log(`✅ Road safety layer added WITH click handler: ${visibleLayerId}`);
  };

  // ⚠️ DEPRECATED: Old GIZ_BBSR:Road_Safety (iRAP) layer removed
  // Road Safety layer disabled until Bohol road safety data is connected
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    // Road Safety layer disabled for Bohol - return early
    console.warn('⚠️ Road Safety (iRAP) layer not available for Bohol. Layer disabled.');
    return;
    
    // OLD CODE (GIZ_BBSR reference removed):
    // const ROAD_SAFETY_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/GIZ_BBSR/wfs';
    // const ROAD_SAFETY_LAYER = 'GIZ_BBSR:Road_Safety';
    
    // Mapping of sub-layer IDs to field names in the GeoServer layer
    const fieldMapping: Record<string, string> = {
      'irap_vehicle': 'Vehicle_St',
      'irap_motorcycle': 'Motorcycli',
      'irap_bicycle': 'Bicyclist_',
      'irap_pedestrian': 'Pedestrian',
      'road_vehicle': 'Vehicle_St',
      'road_motorcycle': 'Motorcycli',
      'road_bicycle': 'Bicyclist_',
      'road_pedestrian': 'Pedestrian'
    };
    
    // Star rating colors (iRAP standard)
    const starColors: Record<number, string> = {
      5: '#93c060',  // Green - Safest
      4: '#fdf05e',  // Yellow
      3: '#eda308',  // Amber/Orange
      2: '#e65336',  // Red
      1: '#262626',  // Black - Most dangerous
      0: '#9CA3AF'   // Grey - No Data/NA
    };
    
    // Remove all existing road safety layers (both visible and hit area layers)
    Object.keys(fieldMapping).forEach(layerId => {
      // Remove visible layer
      if (map.getLayer(layerId)) {
        console.log('🗑️  Removing road safety layer:', layerId);
        map.removeLayer(layerId);
      }
      // Remove hit area layer
      const hitAreaLayerId = `${layerId}-hitarea`;
      if (map.getLayer(hitAreaLayerId)) {
        console.log('🗑️  Removing road safety hit area layer:', hitAreaLayerId);
        map.removeLayer(hitAreaLayerId);
      }
      // Remove source
      if (map.getSource(layerId)) {
        map.removeSource(layerId);
      }
    });
    
    // Add active road safety layers
    if (activeRoadSafetySubLayers.length > 0) {
      console.log('🛣️  Adding road safety layers:', activeRoadSafetySubLayers);
      console.log(`🏘️  Ward filter status: ${selectedWardId === 'all' || !selectedWardId ? 'All Wards' : `Ward ${selectedWardId}`}`);
      
      // Use Promise.all to properly handle async operations
      Promise.all(activeRoadSafetySubLayers.map(async (subLayerId) => {
        const fieldName = fieldMapping[subLayerId];
        if (!fieldName) {
          console.warn('⚠️ No field mapping found for:', subLayerId);
          return;
        }
        
        // Build WFS URL to fetch GeoJSON
        let wfsUrl = `${ROAD_SAFETY_WFS_URL}?service=WFS&version=2.0.0&request=GetFeature&typeName=${ROAD_SAFETY_LAYER}&outputFormat=application/json&srsName=EPSG:4326`;
        
        // Build CQL filter combining ward and road name filters
        const cqlFilters: string[] = [];
        
        // Add ward filter if needed
        if (selectedWardId && selectedWardId !== 'all') {
          const wardNumber = extractWardNumber(selectedWardId);
          if (wardNumber !== null) {
            cqlFilters.push(`Ward=${wardNumber}`);
            console.log(`🔍 Applying ward filter to ${subLayerId}: Ward ${wardNumber}`);
          }
        }
        
        // Add road name filter if needed
        if (selectedRoadName && selectedRoadName !== 'all') {
          // Escape single quotes in road name for CQL
          const escapedRoadName = selectedRoadName.replace(/'/g, "''");
          cqlFilters.push(`Road_name='${escapedRoadName}'`);
          console.log(`🛣️ Applying road name filter to ${subLayerId}: ${selectedRoadName}`);
        }
        
        // Add star rating filter if needed
        if (roadSafetyStarRatings && roadSafetyStarRatings[subLayerId]) {
          const starRating = roadSafetyStarRatings[subLayerId];
          // Map star rating to field value (e.g., '5star' -> '5')
          const ratingValue = starRating.replace('star', '');
          cqlFilters.push(`${fieldName}=${ratingValue}`);
          console.log(`⭐ Applying star rating filter to ${subLayerId}: ${starRating} (${fieldName}=${ratingValue})`);
        }
        
        // Combine filters with AND
        if (cqlFilters.length > 0) {
          wfsUrl += `&CQL_FILTER=${cqlFilters.join(' AND ')}`;
        }
        
        console.log(`✅ Fetching road safety data: ${subLayerId} (field: ${fieldName})`);
        
        try {
          // Fetch GeoJSON data from WFS (no auth needed - GeoServer WFS is publicly accessible)
          const response = await fetch(wfsUrl);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const geojsonData = await response.json();
          
          // 🔧 Transform coordinates if needed (fixes distorted geometries)
          const transformedGeojsonData = transformGeoJSONCoordinates(geojsonData);
          const featureCount = transformedGeojsonData.features?.length || 0;
          
          // Build filter status message
          const filterParts: string[] = [];
          if (selectedWardId && selectedWardId !== 'all') {
            filterParts.push(`Ward: ${selectedWardId}`);
          }
          if (selectedRoadName && selectedRoadName !== 'all') {
            filterParts.push(`Road: ${selectedRoadName}`);
          }
          const filterStatus = filterParts.length > 0 ? ` (${filterParts.join(', ')})` : '';
          
          console.log(`📊 Fetched ${featureCount} features for ${subLayerId}${filterStatus}`);
          
          // Only proceed if map still exists
          if (!map || !map.getStyle()) {
            console.warn('⚠️ Map no longer exists, skipping layer add');
            return;
          }
          
          // Update or add source
          if (map.getSource(subLayerId)) {
            // Update existing source with new filtered data
            const source = map.getSource(subLayerId) as maplibregl.GeoJSONSource;
            source.setData(transformedGeojsonData);
            console.log(`🔄 Updated existing source: ${subLayerId}`);
          } else {
            // Add as new GeoJSON source
            map.addSource(subLayerId, {
              type: 'geojson',
              data: transformedGeojsonData
            });
            console.log(`➕ Added new source: ${subLayerId}`);
          }
          
          // Add layer if it doesn't exist
          if (!map.getLayer(subLayerId)) {
            // Find the first label layer to insert road safety layers below labels
            const firstLabelLayerId = getFirstLabelLayerId(map);
            
            // Add line layer with data-driven styling based on star rating
            map.addLayer({
              id: subLayerId,
              type: 'line',
              source: subLayerId,
              layout: {
                'line-join': 'round',
                'line-cap': 'butt'
              },
              paint: {
                'line-color': [
                  'case',
                  ['==', ['get', fieldName], 5], starColors[5],
                  ['==', ['get', fieldName], 4], starColors[4],
                  ['==', ['get', fieldName], 3], starColors[3],
                  ['==', ['get', fieldName], 2], starColors[2],
                  ['==', ['get', fieldName], 1], starColors[1],
                  starColors[0] // Default color for 0 or null
                ],
                'line-width': ['interpolate', ['linear'], ['zoom'], 
                  10, 2,    // At city view (zoom 10), lines are thinner (2px)
                  12, 3,    // Medium zoom
                  14, 5,    // Getting closer
                  16, 6,    // Street level - good width
                  18, 7     // Very zoomed in - slightly thicker
                ] // Zoom-dependent width: thin at city view, wider when zoomed in
              }
            }, firstLabelLayerId);
            
            // Add invisible buffer/hit area layer for easier clicking (wider hitbox)
            const hitAreaLayerId = `${subLayerId}-hitarea`;
            map.addLayer({
              id: hitAreaLayerId,
              type: 'line',
              source: subLayerId, // Same source as visible layer
              layout: {
                'line-join': 'round',
                'line-cap': 'butt'
              },
              paint: {
                'line-color': 'rgba(0, 0, 0, 0)', // Completely transparent
                'line-width': ['interpolate', ['linear'], ['zoom'], 
                  10, 8,    // At city view, 8px buffer (4px on each side of 2px line)
                  12, 12,   // Medium zoom, 12px buffer
                  14, 16,   // Getting closer, 16px buffer
                  16, 20,   // Street level, 20px buffer (10px on each side)
                  18, 24    // Very zoomed in, 24px buffer
                ], // Invisible buffer - much wider for easy clicking
                'line-opacity': 0 // Completely invisible
              }
            }, firstLabelLayerId);
            
            console.log(`✅ Road safety layer added with iRAP star rating colors: ${subLayerId}`);
            
            // Attach click handler to the invisible hit area layer for easier clicking
            attachRoadSafetyClickHandler(map, hitAreaLayerId, subLayerId, fieldName, starColors, setWardPopupData, setEducationPopupData, setHealthcarePopupData);
          }
          
        } catch (error) {
          console.error(`❌ Error fetching/adding road safety layer ${subLayerId}:`, error);
        }
      })).then(async () => {
        // Calculate road safety statistics for the active sub-layer
        if (activeRoadSafetySubLayers.length > 0 && onRoadSafetyStatsUpdate) {
          const activeSubLayerId = activeRoadSafetySubLayers[0]; // Use the first active layer
          const fieldName = fieldMapping[activeSubLayerId];
          
          if (fieldName) {
            // Build WFS URL to fetch GeoJSON for statistics calculation
            let wfsUrl = `${ROAD_SAFETY_WFS_URL}?service=WFS&version=2.0.0&request=GetFeature&typeName=${ROAD_SAFETY_LAYER}&outputFormat=application/json&srsName=EPSG:4326`;
            
            // Build CQL filter combining ward and road name filters
            const cqlFilters: string[] = [];
            
            // Add ward filter if needed
            if (selectedWardId && selectedWardId !== 'all') {
              const wardNumber = extractWardNumber(selectedWardId);
              if (wardNumber !== null) {
                cqlFilters.push(`Ward=${wardNumber}`);
              }
            }
            
            // Add road name filter if needed
            if (selectedRoadName && selectedRoadName !== 'all') {
              // Escape single quotes in road name for CQL
              const escapedRoadName = selectedRoadName.replace(/'/g, "''");
              cqlFilters.push(`Road_name='${escapedRoadName}'`);
            }
            
            // Add star rating filter if needed
            if (roadSafetyStarRatings && roadSafetyStarRatings[activeSubLayerId]) {
              const starRating = roadSafetyStarRatings[activeSubLayerId];
              // Map star rating to field value (e.g., '5star' -> '5')
              const ratingValue = starRating.replace('star', '');
              cqlFilters.push(`${fieldName}=${ratingValue}`);
              console.log(`⭐ Applying star rating filter to stats calculation: ${starRating} (${fieldName}=${ratingValue})`);
            }
            
            // Combine filters with AND
            if (cqlFilters.length > 0) {
              wfsUrl += `&CQL_FILTER=${cqlFilters.join(' AND ')}`;
            }
            
            try {
              const response = await fetch(wfsUrl);
              const geojsonData = await response.json();
              
              // Initialize stats for all ratings
              const stats: Record<string, number> = {
                '5': 0,
                '4': 0,
                '3': 0,
                '2': 0,
                '1': 0,
                '0': 0  // NA/No Data
              };
              
              // Aggregate lengths by rating
              geojsonData.features?.forEach((feature: any) => {
                const rating = feature.properties[fieldName];
                const lengthM = feature.properties.Length_m || 0;
                
                // Convert rating to string key
                const ratingKey = (rating !== null && rating !== undefined) ? String(rating) : '0';
                
                if (stats[ratingKey] !== undefined) {
                  stats[ratingKey] += lengthM;
                }
              });
              
              // Convert meters to kilometers
              Object.keys(stats).forEach(key => {
                stats[key] = Math.round((stats[key] / 1000) * 10) / 10; // Round to 1 decimal
              });
              
              console.log(`📊 Road Safety Stats for ${activeSubLayerId}:`, stats);
              setRoadSafetyStats(stats); // Update local state
              onRoadSafetyStatsUpdate?.(stats); // Update parent
              
            } catch (error) {
              console.error('❌ Error calculating road safety stats:', error);
            }
          }
        }
        
        // 🔒 Ensure proper layer ordering after all road safety layers are added
        if (map && map.getStyle()) {
          setTimeout(() => {
            enforceStrictLayerOrder(map);
          }, 100);
        }
      });
    }
  }, [activeRoadSafetySubLayers, selectedWardId, selectedRoadName, roadSafetyStarRatings, mapReady, layerOpacities, styleLoadCounter]);

  // OLD CLICK HANDLER REMOVED - Now attached directly when layer is added (see attachRoadSafetyClickHandler function above)

  // Toggle 3D buildings layer visibility based on is3DMode - MANDATORY ENFORCEMENT
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;

    // Hide / restore basemap symbol layers (road names, place labels) in 3D mode
    // so they don't float on top of 3D buildings
    const basemapSymbolVisibility = is3DMode ? 'none' : 'visible';
    const OUR_LAYER_PREFIXES = [
      'ward-', 'education-', 'healthcare-', 'public-amenities-', 'transport-',
      'irap_', 'road-safety-', 'heat_', 'air_', 'flood_', 'multihazard_',
      'multi-hazard-', 'slum_', 'buildings', 'road_network', 'geoserver-', 'wms-',
      'building-', 'economic-', 'hillshade', 'panorama-',
    ];
    try {
      const style = map.getStyle();
      if (style?.layers) {
        style.layers.forEach((layer) => {
          if (layer.type === 'symbol') {
            const isOurs = OUR_LAYER_PREFIXES.some(p => layer.id.toLowerCase().startsWith(p));
            if (!isOurs && map.getLayer(layer.id)) {
              map.setLayoutProperty(layer.id, 'visibility', basemapSymbolVisibility);
            }
          }
        });
      }
    } catch (_) { /* ignore if style not loaded */ }

    // Toggle visibility of 2D and 3D building layers - STRICT ENFORCEMENT
    if (map.getLayer('buildings-fill') && map.getLayer('buildings-3d')) {
      if (is3DMode) {
        // MANDATORY: Hide 2D fill, show 3D extrusion
        map.setLayoutProperty('buildings-fill', 'visibility', 'none');
        map.setLayoutProperty('buildings-3d', 'visibility', 'visible');
        console.log('🏗️ MANDATORY: 3D buildings enabled and enforced');
        
        // 🔒 FORCE IMMEDIATE 3D RENDERING - Trigger map repaint
        map.triggerRepaint();
        console.log('🔄 Forced map repaint for 3D mode change');
      } else {
        // Show 2D fill, hide 3D extrusion
        map.setLayoutProperty('buildings-fill', 'visibility', 'visible');
        map.setLayoutProperty('buildings-3d', 'visibility', 'none');
        console.log('🏢 2D buildings enabled');
        
        // 🔒 FORCE IMMEDIATE 2D RENDERING - Trigger map repaint
        map.triggerRepaint();
        console.log('🔄 Forced map repaint for 2D mode change');
      }
    } else if (is3DMode) {
      // Layers don't exist yet (still loading) — retry until they appear
      console.warn('⚠️ 3D mode active but building layers not found - scheduling retries');
      [200, 500, 1000, 2000, 3500].forEach(delay => {
        setTimeout(() => {
          if (!mapRef.current || !is3DModeRef.current) return;
          const m = mapRef.current;
          if (m.getLayer('buildings-fill') && m.getLayer('buildings-3d')) {
            m.setLayoutProperty('buildings-fill', 'visibility', 'none');
            m.setLayoutProperty('buildings-3d', 'visibility', 'visible');
            m.triggerRepaint();
            console.log(`✅ Deferred 3D enforcement applied after ${delay}ms`);
          }
        }, delay);
      });
    }

    // Toggle FSTP building overlay layers (fill ↔ fill-extrusion)
    const BAND_ORDER_3D = ['< 10 min', '10 - 20 min', '20 - 30 min', '> 30 min'];
    const fstpFillId  = (b: string) => `fstp-bldg-band-${b.replace(/[^a-z0-9]/gi,'_').toLowerCase()}`;
    const fstpExtId   = (b: string) => `fstp-bldg-band-3d-${b.replace(/[^a-z0-9]/gi,'_').toLowerCase()}`;
    BAND_ORDER_3D.forEach(band => {
      try {
        if (map.getLayer(fstpFillId(band)))  map.setLayoutProperty(fstpFillId(band),  'visibility', is3DMode ? 'none'    : 'visible');
        if (map.getLayer(fstpExtId(band)))   map.setLayoutProperty(fstpExtId(band),   'visibility', is3DMode ? 'visible' : 'none');
      } catch (_) {}
    });
  }, [is3DMode, mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 3D HILLSHADE: add/remove depending on is3DMode and style reloads ──────
  // styleLoadCounter ensures hillshade is re-added after a basemap switch while
  // 3D mode is already active (setStyle() clears all custom sources/layers).
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    if (is3DMode) {
      // Defer slightly so the map style is guaranteed to be idle
      const t = setTimeout(() => {
        if (mapRef.current) addHillshadeLayer(mapRef.current);
      }, 200);
      return () => clearTimeout(t);
    } else {
      removeHillshadeLayer(map);
    }
  }, [is3DMode, mapReady, styleLoadCounter]);
  // ─────────────────────────────────────────────────────────────────────────

  // Keep scenarioNetworkGids ref always current so buildings load callback can use it
  useEffect(() => {
    scenarioNetworkGidsRef.current = scenarioNetworkGids ?? null;
  }, [scenarioNetworkGids]);

  // Keep activeSewerCategories ref always current so buildings load callback can use it
  useEffect(() => {
    activeSewerCategoriesRef.current = activeSewerCategories;
  }, [activeSewerCategories]);

  // Keep layerOpacities ref always current
  useEffect(() => {
    layerOpacitiesRef.current = layerOpacities;
  }, [layerOpacities]);

  // Keep bufferBldgIds ref always current
  useEffect(() => {
    bufferBldgIdsRef.current = bufferBldgIds;
  }, [bufferBldgIds]);

  // Keep excludedBldgIds ref always current
  useEffect(() => {
    excludedBldgIdsRef.current = excludedBldgIds;
  }, [excludedBldgIds]);

  // Apply / clear 'inBuffer' feature state so buffer buildings render as teal
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;
    if (!map.getSource('buildings')) return;

    // Clear feature state from previously applied IDs
    prevBufferIdsRef.current.forEach(id => {
      map.setFeatureState(
        { source: 'buildings', sourceLayer: 'Buildings', id },
        { inBuffer: false }
      );
    });

    // Apply new buffer feature states
    bufferBldgIds.forEach(id => {
      map.setFeatureState(
        { source: 'buildings', sourceLayer: 'Buildings', id },
        { inBuffer: true }
      );
    });

    prevBufferIdsRef.current = bufferBldgIds;
  }, [bufferBldgIds, mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep ref in sync and apply opacity to all existing building layers whenever slider changes
  useEffect(() => {
    buildingOpacityRef.current = buildingOpacity;
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;
    const op = buildingOpacity;
    const extrusionLayers = [
      'buildings-3d', 'building-height-3d', 'building-area-3d', 'economic-vulnerability-3d',
    ];
    const fillLayers = [
      'buildings-fill', 'building-height-fill', 'building-area-fill', 'economic-vulnerability-fill',
    ];
    extrusionLayers.forEach(id => {
      if (map.getLayer(id)) map.setPaintProperty(id, 'fill-extrusion-opacity', op);
    });
    fillLayers.forEach(id => {
      if (map.getLayer(id)) map.setPaintProperty(id, 'fill-opacity', op);
    });
  }, [buildingOpacity, mapReady]);

  // Handle external 3D toggle from tutorial
  useEffect(() => {
    if (externalToggle3D !== undefined && mapRef.current && mapReady) {
      const map = mapRef.current;
      console.log('🎓 External 3D toggle:', externalToggle3D);
      
      // Update is3DMode state
      is3DModeRef.current = externalToggle3D;
      setIs3DMode(externalToggle3D);
      
      // MANDATORY: Force enable buildings when entering 3D mode
      // Use functional update to avoid dependency on activeBaseLayers
      if (externalToggle3D && onActiveBaseLayersChange) {
        // Remember pre-3D buildings state so we can restore on exit.
        buildingsWasOnBefore3DRef.current = activeBaseLayers.includes('buildings');
        onActiveBaseLayersChange((prevLayers: string[]) => {
          if (!prevLayers.includes('buildings')) {
            console.log('🎓 MANDATORY: Auto-enabling buildings for external 3D toggle');
            return [...prevLayers, 'buildings'];
          }
          return prevLayers;
        });
      }
      
      // Animate pitch if enabling 3D
      if (externalToggle3D) {
        map.easeTo({
          pitch: 60,
          bearing: -20,
          duration: 1000
        });
        
        // Force 3D buildings visibility immediately
        if (map.getLayer('buildings-fill')) {
          map.setLayoutProperty('buildings-fill', 'visibility', 'none');
        }
        if (map.getLayer('buildings-3d')) {
          map.setLayoutProperty('buildings-3d', 'visibility', 'visible');
        }
        
        // 🔒 FORCE IMMEDIATE 3D RENDERING - Trigger map repaint
        map.triggerRepaint();
        console.log('🔄 Forced map repaint for external 3D toggle');
      } else {
        map.easeTo({
          pitch: 0,
          bearing: 0,
          duration: 1000
        });
        
        const buildingsWasOnBefore3D = buildingsWasOnBefore3DRef.current;

        if (buildingsWasOnBefore3D) {
          // Force 2D buildings visibility
          if (map.getLayer('buildings-fill')) {
            map.setLayoutProperty('buildings-fill', 'visibility', 'visible');
          }
          if (map.getLayer('buildings-3d')) {
            map.setLayoutProperty('buildings-3d', 'visibility', 'none');
          }
        } else {
          // Buildings was auto-enabled for 3D; hide it and remove from active layers.
          ['buildings', 'buildings-fill', 'buildings-3d', 'buildings-highlight'].forEach((id) => {
            if (map.getLayer(id)) {
              map.setLayoutProperty(id, 'visibility', 'none');
            }
          });
          if (onActiveBaseLayersChange) {
            onActiveBaseLayersChange((prevLayers: string[]) =>
              prevLayers.filter((l) => l !== 'buildings')
            );
          }
        }
        
        // 🔒 FORCE IMMEDIATE 2D RENDERING - Trigger map repaint
        map.triggerRepaint();
        console.log('🔄 Forced map repaint for external 2D toggle');
      }
    }
  }, [externalToggle3D, mapReady, onActiveBaseLayersChange]);

  // Handle programmatic building popup trigger from tutorial
  useEffect(() => {
    if (triggerBuildingPopup && mapRef.current && mapReady) {
      const map = mapRef.current;
      const [lng, lat] = triggerBuildingPopup;
      
      console.log('🏢 Tutorial: Triggering building popup at:', lng, lat);
      
      // Query for buildings at this location
      const point = map.project([lng, lat]);
      
      // Check both 2D and 3D building layers
      const buildingLayerIds = ['buildings-fill', 'buildings-3d'].filter(id => map.getLayer(id));
      
      if (buildingLayerIds.length === 0) {
        console.warn('🏢 No building layers found');
        return;
      }
      
      // Query features at the center point with a small radius
      const features = map.queryRenderedFeatures(point, {
        layers: buildingLayerIds
      });
      
      if (features && features.length > 0) {
        const feature = features[0];
        const props = feature.properties;
        
        console.log('🏢 Found building:', props);
        
        // Close other popups
        setWardPopupData(null);
        setEducationPopupData(null);
        setHealthcarePopupData(null);
        setPublicAmenitiesPopupData(null);
        setTransportPopupData(null);
        setRoadSafetyPopupData(null);
        
        // Open building popup
        setBuildingPopupData({
          buildingUse: props.Use || 'N/A',
          ward: props.Ward || 'N/A',
          floors: props.Floor || 'N/A',
          hhi2025: props.HHI_2025 || 'N/A',
          airAqi: props.Air_AQI || 'N/A',
          floodHazard: props.Flood_Hazard || 'N/A',
          multiHazard: props.Multi_Hazard_BBSR || 'N/A',
          lng,
          lat,
          x: point.x,
          y: point.y
        });
      } else {
        console.log('🏢 No building found at this location');
      }
    }
  }, [triggerBuildingPopup, mapReady]);

  // Zoom handlers
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

  // Open print layout for map export
  const handleDownloadMap = () => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    
    // Get current map state
    const center = map.getCenter();
    const zoom = map.getZoom();
    const pitch = map.getPitch();
    const bearing = map.getBearing();
    
    // Get the complete map style (includes all sources and layers)
    const mapStyle = map.getStyle();
    
    console.log('🖨️ Capturing complete map style for print');
    
    // Set print map state and show print layout
    setPrintMapState({
      center: [center.lng, center.lat],
      zoom,
      pitch,
      bearing,
      visibleLayers: [], // Not needed when using fullStyle
      basemap: basemap,
      scenario: scenario,
      fullStyle: mapStyle, // Pass the entire map style
      sector: activeSector,
      activeLayer: activeLayerId,
      wardId: selectedWardId !== 'all' ? selectedWardId : undefined,
      selectedLguName: selectedLguName !== 'all' ? selectedLguName : undefined,
      selectedWardName: selectedWardName !== 'all' ? selectedWardName : undefined,
      activeBaseLayers: activeBaseLayers,
      activeInfraLayers: activeInfraLayers,
      activeRoadSafetySubLayers: activeRoadSafetySubLayers,
      roadNetworkStats: roadNetworkStats,
      roadSafetyStats: roadSafetyStats,
      activeBuildingHeightCategories: activeBuildingHeightCategories,
      activeBuildingAreaCategories: activeBuildingAreaCategories,
    });
    setShowPrintLayout(true);
  };

  const handleResetView = () => {
    if (mapRef.current) {
      resetToStudyAreaExtent(mapRef.current, 1500);
      // Reset 3D mode when resetting view
      setIs3DMode(false);
    }
  };

  const handleToggle3D = () => {
    if (mapRef.current) {
      const map = mapRef.current;
      const newIs3D = !is3DMode;
      is3DModeRef.current = newIs3D; // sync ref immediately (before async state settles)
      setIs3DMode(newIs3D);
      
      if (newIs3D) {
        // Enable 3D mode
        map.easeTo({
          pitch: 60,
          bearing: 0,
          duration: 1000
        });
        
        // Remember whether buildings was already on so we can restore that
        // state when the user exits 3D.
        buildingsWasOnBefore3DRef.current = activeBaseLayers.includes('buildings');

        // MANDATORY: Force enable buildings layer when entering 3D mode
        // Use functional update to avoid dependency issues
        if (onActiveBaseLayersChange) {
          onActiveBaseLayersChange((prevLayers: string[]) => {
            if (!prevLayers.includes('buildings')) {
              console.log('🏗️ MANDATORY: Auto-enabling buildings layer for 3D mode');
              return [...prevLayers, 'buildings'];
            }
            return prevLayers;
          });
        }
        
        // MANDATORY: Immediately force buildings to 3D mode
        // Set this right away, don't wait for the effect
        if (map.getLayer('buildings-fill')) {
          map.setLayoutProperty('buildings-fill', 'visibility', 'none');
          console.log('🏗️ FORCED: buildings-fill to NONE for 3D mode');
        }
        if (map.getLayer('buildings-3d')) {
          map.setLayoutProperty('buildings-3d', 'visibility', 'visible');
          console.log('🏗️ FORCED: buildings-3d to VISIBLE for 3D mode');
        }
        
        // 🔒 FORCE IMMEDIATE 3D RENDERING - Trigger map repaint to ensure 3D buildings render
        // This forces MapLibre GL to immediately render the 3D extrusions
        map.triggerRepaint();
        console.log('🔄 Forced map repaint to trigger immediate 3D building rendering');
      } else {
        // Disable 3D mode
        map.easeTo({
          pitch: 0,
          bearing: 0,
          duration: 1000
        });
        
        const buildingsWasOnBefore3D = buildingsWasOnBefore3DRef.current;

        if (buildingsWasOnBefore3D) {
          // User had buildings on before 3D — switch back to 2D buildings.
          if (map.getLayer('buildings-fill')) {
            map.setLayoutProperty('buildings-fill', 'visibility', 'visible');
            console.log('🏢 FORCED: buildings-fill to VISIBLE for 2D mode');
          }
          if (map.getLayer('buildings-3d')) {
            map.setLayoutProperty('buildings-3d', 'visibility', 'none');
            console.log('🏢 FORCED: buildings-3d to NONE for 2D mode');
          }
        } else {
          // Buildings was auto-enabled only because 3D required it. Hide all
          // building layers and remove 'buildings' from active base layers
          // so the panel toggle reflects the actual state.
          ['buildings', 'buildings-fill', 'buildings-3d', 'buildings-highlight'].forEach((id) => {
            if (map.getLayer(id)) {
              map.setLayoutProperty(id, 'visibility', 'none');
            }
          });
          if (onActiveBaseLayersChange) {
            onActiveBaseLayersChange((prevLayers: string[]) =>
              prevLayers.filter((l) => l !== 'buildings')
            );
          }
          console.log('🏢 Buildings auto-disabled on 3D exit (was not on before 3D)');
        }
        
        // 🔒 FORCE IMMEDIATE 2D RENDERING - Trigger map repaint to ensure 2D buildings render
        map.triggerRepaint();
        console.log('🔄 Forced map repaint to trigger immediate 2D building rendering');
      }
    }
  };

  // Render road query segments when queryResults contains road features
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const sourceId = 'query-road-segments';
    const layerId = 'query-road-segments-layer';

    console.log('📥 [MapCanvas] Road query segments effect triggered');
    console.log('📊 [MapCanvas] queryResults summary:', {
      count: queryResults?.length || 0,
      sample: queryResults?.[0]?.properties ? {
        category: queryResults[0].properties.category,
        gridcode: queryResults[0].properties.gridcode,
        segmentCount: queryResults[0].properties.segments?.length || 0
      } : null
    });

    // Check if queryResults contains road features with segments
    // Check if queryResults contains road features with segments
    // Note: Not all features may have segments, so we check if ANY feature has segments
    const hasRoadSegments = queryResults && queryResults.length > 0 && 
                           queryResults.some((f: any) => f.properties?.segments !== undefined);

    console.log('[MapCanvas] hasRoadSegments:', hasRoadSegments, 'queryResults.length:', queryResults?.length);
    if (hasRoadSegments) {
      const featuresWithSegments = queryResults.filter((f: any) => f.properties?.segments !== undefined).length;
      const featuresWithoutSegments = queryResults.length - featuresWithSegments;
      console.log(`[MapCanvas] Features with segments: ${featuresWithSegments}, without segments: ${featuresWithoutSegments}`);
    }

    if (!hasRoadSegments) {
      // Remove road segments layers (both main and casing) if no segments
      const casingLayerId = `${layerId}-casing`;
      if (map.getLayer(layerId)) {
        console.log('[MapCanvas] Removing road query segments layer');
        map.removeLayer(layerId);
      }
      if (map.getLayer(casingLayerId)) {
        console.log('[MapCanvas] Removing road query segments casing layer');
        map.removeLayer(casingLayerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
      return;
    }

    // Extract all segments from all features
    // Preserve parent feature properties (like star_ratings, category, etc.) for each segment
    const allSegments = queryResults.flatMap((feature: any) => {
      const segments = feature.properties?.segments || [];
      // Attach parent feature properties to each segment
      return segments.map((segment: any) => ({
        ...segment,
        parentProperties: feature.properties // Preserve parent feature properties
      }));
    });

    console.log(`[MapCanvas] Rendering ${allSegments.length} road query segments from ${queryResults.length} features`);
    
    // Debug: Log first segment to see structure
    if (allSegments.length > 0) {
      console.log('[MapCanvas] Sample segment structure:', allSegments[0]);
      console.log('[MapCanvas] Sample segment parentProperties:', allSegments[0].parentProperties);
      console.log('[MapCanvas] Sample segment star_ratings:', allSegments[0].parentProperties?.star_ratings);
    } else {
      console.warn('[MapCanvas] WARNING: No segments extracted from features!');
    }

    // Create GeoJSON FeatureCollection from segments
    const geojsonData = {
      type: 'FeatureCollection',
      features: allSegments.map((segment: any, index: number) => {
        // Extract gridcode from segment properties or direct property
        const gridcode = segment.gridcode || 
                        segment.properties?.gridcode || 
                        segment.properties?.HHI_2025 || 
                        segment.properties?.Air_AQI || 
                        segment.properties?.Flood_Hazard || 1;
        
        // Get parent feature properties (contains star_ratings, category, etc.)
        const parentProps = segment.parentProperties || {};
        
        if (index < 3) {
          console.log(`[MapCanvas] Segment ${index} gridcode:`, gridcode, 'star_ratings:', parentProps.star_ratings);
        }
        
        return {
          type: 'Feature',
          geometry: segment.geometry,
          properties: {
            // Include parent feature properties (star_ratings, category, etc.)
            category: parentProps.category,
            star_ratings: parentProps.star_ratings,
            layer_type: parentProps.layer_type,
            // Include segment-specific properties
            segmentIndex: index,
            gridcode: gridcode,
            length_m: segment.length_meters
          }
        };
      })
    };
    
    // Debug: Log gridcode distribution
    const gridcodeCounts = geojsonData.features.reduce((acc: any, f: any) => {
      const code = f.properties.gridcode;
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {});
    console.log('[MapCanvas] Gridcode distribution:', gridcodeCounts);
    
    // Analyze unique category:gridcode combinations being rendered
    const renderedCombinations = new Set();
    geojsonData.features.forEach((f: any) => {
      const combo = `${f.properties.category}:${f.properties.gridcode}`;
      renderedCombinations.add(combo);
    });
    
    console.log('🗺️ [MapCanvas] Unique category:gridcode combinations being rendered:', 
      Array.from(renderedCombinations).sort()
    );

    // Check if source already exists - update data instead of removing/re-adding (prevents flicker)
    const existingSource = map.getSource(sourceId);
    if (existingSource && 'setData' in existingSource) {
      console.log('📝 [MapCanvas] Updating existing road segments source with new data (no flicker)');
      (existingSource as any).setData(geojsonData);
    } else {
      // Remove source if it exists (first time setup)
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }

      // Add source
      console.log('🆕 [MapCanvas] Creating new road segments source');
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData as any
      });
    }

    // Get actual legend colors based on active hazard layer
    // Derive the activeHazardKey from activeLayerId and scenario (same logic as App.tsx)
    
    // Helper function to convert GeoServer layer names to LEGEND_DATA keys
    // GeoServer: 'HHI_2040_SSP1' -> Legend: 'HHI_SSP1_2040'
    // GeoServer: 'AST_2040_SSP2' -> Legend: 'AST_SSP2_2040'
    // GeoServer: 'HHI_2025' -> Legend: 'HHI_2025' (no change)
    // GeoServer: 'Air_AQI' -> Legend: 'Air_AQI' (no change)
    const convertToLegendKey = (geoServerKey: string): string => {
      // Pattern: LAYER_YEAR_SCENARIO -> LAYER_SCENARIO_YEAR
      // Match format like "HHI_2040_SSP1" or "AST_2040_SSP5"
      const match = geoServerKey.match(/^([A-Z]+)_(\d{4})_(SSP\d)$/i);
      if (match) {
        const [, layer, year, scenario] = match;
        const legendKey = `${layer}_${scenario}_${year}`;
        console.log(`🔄 [MapCanvas] Converted GeoServer key "${geoServerKey}" to legend key "${legendKey}"`);
        return legendKey;
      }
      // No conversion needed (baseline layers like 'HHI_2025', 'Air_AQI', 'Flood_Hazard', 'Multi_Hazard_BBSR')
      console.log(`✅ [MapCanvas] Using GeoServer key as-is for legend: "${geoServerKey}"`);
      return geoServerKey;
    };
    
    console.log(`🔍 [MapCanvas] LEGEND DERIVATION - activeLayerId: "${activeLayerId}", scenario: "${scenario}"`);
    
    let legendKey = 'HHI_2025'; // Default to heat stress
    
    // 🔒 Use locked legend key from query execution if available (prevents color change when switching layers)
    if (queryResultsLegendKey) {
      legendKey = queryResultsLegendKey;
      console.log(`🔒 [MapCanvas] Using LOCKED legend key from query execution: ${legendKey}`);
    } else if (activeLayerId && scenario) {
      const activeHazardLayerId = getLayerNameForScenario(activeLayerId, scenario) || '';
      console.log(`🔍 [MapCanvas] getLayerNameForScenario returned: "${activeHazardLayerId}"`);
      const activeHazardKey = activeHazardLayerId.split(':')[1] || '';
      console.log(`🔍 [MapCanvas] activeHazardKey after split: "${activeHazardKey}"`);
      
      if (activeHazardKey) {
        legendKey = convertToLegendKey(activeHazardKey); // Convert to legend format
        console.log(`🎨 [MapCanvas] Derived legend key: ${legendKey} from GeoServer key: ${activeHazardKey} (layer: ${activeLayerId}, scenario: ${scenario})`);
      } else {
        console.warn(`⚠️ [MapCanvas] Could not derive legend key from layer: ${activeLayerId}, scenario: ${scenario}. Using default.`);
      }
    } else {
      console.warn(`⚠️ [MapCanvas] Missing activeLayerId or scenario - activeLayerId: "${activeLayerId}", scenario: "${scenario}". Using default HHI_2025.`);
    }
    
    // Get legend data for the active hazard
    const legendData = LEGEND_DATA[legendKey];
    if (!legendData) {
      console.error(`❌ [MapCanvas] No legend data found for key "${legendKey}". Available keys:`, Object.keys(LEGEND_DATA));
      console.log(`⚠️ [MapCanvas] Falling back to default HHI_2025 legend`);
    }
    const finalLegendData = legendData || LEGEND_DATA['HHI_2025'];
    console.log(`🎨 [MapCanvas] Using legend colors for "${legendKey}":`, finalLegendData);
    
    // Helper function to brighten/saturate colors for better visibility on overlay
    const enhanceColor = (hexColor: string): string => {
      // Convert hex to RGB
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      
      // Convert to HSL for easier manipulation
      const rNorm = r / 255;
      const gNorm = g / 255;
      const bNorm = b / 255;
      
      const max = Math.max(rNorm, gNorm, bNorm);
      const min = Math.min(rNorm, gNorm, bNorm);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
          case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
          case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
        }
      }
      
      // Increase saturation by 25% and brightness by 15% for more vibrant overlay colors
      s = Math.min(1, s * 1.25);
      l = Math.min(0.95, l * 1.15);
      
      // Convert back to RGB
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      let rFinal, gFinal, bFinal;
      if (s === 0) {
        rFinal = gFinal = bFinal = l;
      } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        rFinal = hue2rgb(p, q, h + 1/3);
        gFinal = hue2rgb(p, q, h);
        bFinal = hue2rgb(p, q, h - 1/3);
      }
      
      const rHex = Math.round(rFinal * 255).toString(16).padStart(2, '0');
      const gHex = Math.round(gFinal * 255).toString(16).padStart(2, '0');
      const bHex = Math.round(bFinal * 255).toString(16).padStart(2, '0');
      
      return `#${rHex}${gHex}${bHex}`;
    };
    
    // Build gridcode to color mapping - USE DARK COLORS FOR QUERY RESULTS ONLY
    // Floating legend panels use original colors from LEGEND_DATA
    // Query result layers on map use darker, more visible colors
    const QUERY_RESULT_COLORS: Record<string, Record<number, string>> = {
      // Heat Stress (HHI) - all scenarios
      'HHI_2025': { 1: '#43A047', 2: '#C6A700', 3: '#FF7043', 4: '#C62828' },
      'HHI_SSP1_2040': { 1: '#43A047', 2: '#C6A700', 3: '#FF7043', 4: '#C62828' },
      'HHI_SSP2_2040': { 1: '#43A047', 2: '#C6A700', 3: '#FF7043', 4: '#C62828' },
      'HHI_SSP5_2040': { 1: '#43A047', 2: '#C6A700', 3: '#FF7043', 4: '#C62828' },
      
      // Flood
      'Flood_Hazard': { 1: '#6D6D6D', 2: '#1EA7E1', 3: '#1E88E5', 4: '#3949AB' },
      
      // Air AQI
      'Air_AQI': { 1: '#43A047', 2: '#8BC34A', 3: '#C6A700', 4: '#F57C00', 5: '#C62828', 6: '#8E2424' },
      
      // Multi Hazard
      'Multi_Hazard_BBSR': { 1: '#43A047', 2: '#C6A700', 3: '#FF7043', 4: '#C62828' },
    };
    
    const gridcodeColors: Record<number, string> = {};
    
    // Use dark query result colors if available for this legend key, otherwise fall back to enhanced legend colors
    if (QUERY_RESULT_COLORS[legendKey]) {
      Object.assign(gridcodeColors, QUERY_RESULT_COLORS[legendKey]);
      console.log(`🎨 [MapCanvas] Using DARK QUERY RESULT COLORS for "${legendKey}":`, gridcodeColors);
    } else {
      // Fall back to enhanced legend colors for other hazard types
      finalLegendData.forEach(entry => {
        gridcodeColors[entry.gridcode] = enhanceColor(entry.color);
      });
      console.log(`🎨 [MapCanvas] Using enhanced legend colors for "${legendKey}":`, gridcodeColors);
    }

    // CRITICAL: Remove existing layers BEFORE checking/updating source
    // This prevents "layer already exists" errors
    const casingLayerId = `${layerId}-casing`;
    if (map.getLayer(layerId)) {
      console.log('🗑️ [MapCanvas] Removing existing main layer before recreation');
      map.removeLayer(layerId);
    }
    if (map.getLayer(casingLayerId)) {
      console.log('🗑️ [MapCanvas] Removing existing casing layer before recreation');
      map.removeLayer(casingLayerId);
    }

    // Now re-create the layers (they are now guaranteed not to exist)
    // Place just before road_network_link layer to appear as highlighted roads
    const beforeId = map.getLayer('road_network_link') ? 'road_network_link' : getFirstLabelLayerId(map);
    
    console.log('🆕 [MapCanvas] Creating road segments layers with variable width by road type');
    
    // Add main colored line layer (no white outline/casing)
    // ENHANCED: Enhanced vibrant colors with rounded edges for highlighted appearance
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': [
          'match',
          ['get', 'gridcode'],
          1, gridcodeColors[1] || '#888888',
          2, gridcodeColors[2] || '#888888',
          3, gridcodeColors[3] || '#888888',
          4, gridcodeColors[4] || '#888888',
          5, gridcodeColors[5] || '#888888',
          '#888888' // Default gray for unknown gridcodes
        ],
          // ENHANCED: Variable width based on road type hierarchy - THICKER for prominence
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, [
              'case',
              ['==', ['get', 'category'], 'National Highway'], 5.5,
              ['==', ['get', 'category'], 'State Highway'], 5,
              ['==', ['get', 'category'], 'Major District Road'], 4.5,
              ['==', ['get', 'category'], 'Major Road'], 4.5,
              ['==', ['get', 'category'], 'Link Road'], 3.5,
              4 // Default
            ],
            14, [
              'case',
              ['==', ['get', 'category'], 'National Highway'], 11,
              ['==', ['get', 'category'], 'State Highway'], 10,
              ['==', ['get', 'category'], 'Major District Road'], 9,
              ['==', ['get', 'category'], 'Major Road'], 9,
              ['==', ['get', 'category'], 'Link Road'], 7,
              8 // Default
            ],
            18, [
              'case',
              ['==', ['get', 'category'], 'National Highway'], 19,
              ['==', ['get', 'category'], 'State Highway'], 17,
              ['==', ['get', 'category'], 'Major District Road'], 15,
              ['==', ['get', 'category'], 'Major Road'], 15,
              ['==', ['get', 'category'], 'Link Road'], 11,
              13 // Default
            ]
          ],
        'line-opacity': 1.0 // Full opacity for maximum visibility
      },
      layout: {
        'line-cap': 'round', // Rounded caps for smooth appearance
        'line-join': 'round' // Rounded joins for smooth appearance
      }
    }, beforeId);

    console.log(`✅ [MapCanvas] Road query segments layers added successfully (before: ${beforeId})`);
    
    // 🔒 ENFORCE STRICT LAYER ORDER - Ensure query segments stay just below road network
    setTimeout(() => {
      if (map && map.getStyle && map.getStyle()) {
        enforceStrictLayerOrder(map);
        console.log('✅ Layer ordering enforced for query-road-segments');
      }
    }, 50);

    // Add click handler for road segments
    map.on('click', layerId, (e: any) => {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0];
      const props = feature.properties;
      
      // Create popup content
      const category = props.category || 'Road';
      const gridcode = props.gridcode || 'N/A';
      const lengthKm = props.length_m ? (props.length_m / 1000).toFixed(2) : 'N/A';
      
      const severityLabels: Record<number, string> = {
        1: 'Very Low',
        2: 'Low',
        3: 'Moderate',
        4: 'High',
        5: 'Very High'
      };
      
      const popupContent = `
        <div style="padding: 8px; min-width: 200px;">
          <div style="font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 8px;">
            ${category}
          </div>
          <div style="font-size: 10px; color: #64748B; margin-bottom: 4px;">
            <strong>Length:</strong> ${lengthKm} km
          </div>
          <div style="font-size: 10px; color: #64748B; margin-bottom: 4px;">
            <strong>Hazard Severity:</strong> 
            <span style="padding: 2px 6px; border-radius: 4px; background-color: ${gridcodeColors[gridcode] || '#888'}; color: white; font-weight: 600; margin-left: 4px;">
              ${severityLabels[gridcode] || gridcode}
            </span>
          </div>
        </div>
      `;
      
      new maplibregl.Popup({ closeButton: true, closeOnClick: true })
        .setLngLat(e.lngLat)
        .setHTML(popupContent)
        .addTo(map);
    });

    // Change cursor on hover
    map.on('mouseenter', layerId, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = '';
    });

    // Cleanup
    return () => {
      const cleanupMap = mapRef.current;
      if (cleanupMap && cleanupMap.getLayer && cleanupMap.getLayer(layerId)) {
        cleanupMap.off('click', layerId);
        cleanupMap.off('mouseenter', layerId);
        cleanupMap.off('mouseleave', layerId);
      }
    };

  }, [queryResults, mapReady, activeLayerId, scenario]);

  // Effect: Handle road network result highlighting
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      console.log('⚠️ Map not ready for highlighting');
      return;
    }

    console.log('🎯 Road network selection changed:', selectedRoadNetworkResult);

    // Remove existing highlight layers if they exist (including old layer names)
    const highlightLayers = [
      'road-network-highlight-outer',
      'road-network-highlight-inner',
      'road-network-highlight-glow',
      'road-network-highlight-middle',
      'road-network-highlight-core',
      'road-network-highlight' // Old layer name - remove if exists
    ];
    
    highlightLayers.forEach(layerId => {
      if (map.getLayer(layerId)) {
        console.log(`🗑️ Removing existing layer: ${layerId}`);
        map.removeLayer(layerId);
      }
    });

    // If no selection, we're done
    if (!selectedRoadNetworkResult) {
      console.log('✅ Cleared road network highlighting');
      return;
    }

    const { category, gridcode, hazardColor, activeUserType, isStarRating: isStarRatingFromSelection } = selectedRoadNetworkResult;
    // Use the actual hazard color from the legend (passed from QueryPanel)
    // If not provided, fall back to blue
    const highlightColor = hazardColor || '#2563EB';
    console.log('🎨 Using highlight color:', highlightColor, 'for gridcode:', gridcode);
    
    // Determine which source to use based on the category
    // Both Road Network and Road Safety queries use query-road-segments source
    // because both contain hazard overlay data (gridcode) from backend analysis
    const isStarRating = isStarRatingFromSelection ?? category.includes('-Star');
    const sourceId = 'query-road-segments'; // Always use query segments - they have gridcode data
    
    console.log(`🔦 Highlighting roads: category="${category}", gridcode="${gridcode}", source="${sourceId}", isStarRating=${isStarRating}, activeUserType=${activeUserType}`);

    // Check if the appropriate source exists and is loaded
    const roadSource = map.getSource(sourceId);
    if (!roadSource) {
      console.log(`⚠️ Source "${sourceId}" not found - cannot highlight.`);
      if (isStarRating) {
        console.log('💡 Road safety data not loaded. Execute a road safety query first.');
      } else {
        console.log('💡 Road network data not loaded. Enable Road Network layer first.');
      }
      return;
    }

    // Check if source is loaded
    if (!map.isSourceLoaded(sourceId)) {
      console.log(`⏳ Source "${sourceId}" not fully loaded yet, waiting...`);
      // Wait for source to load
      const onSourceData = (e: any) => {
        if (e.sourceId === sourceId && e.isSourceLoaded && map.isSourceLoaded(sourceId)) {
          console.log(`✅ Source "${sourceId}" loaded, retrying highlight`);
          map.off('sourcedata', onSourceData);
          // Retry the effect by forcing a re-render won't work, but we can directly call the highlight logic
          // For now, just log - user can click again
        }
      };
      map.on('sourcedata', onSourceData);
      return;
    }

    // Add a highlight layer with a filter for the selected category and gridcode
    // For star ratings: filter by star_ratings[activeUserType] property and gridcode
    // For road categories: filter by category and gridcode properties
    let filter;
    if (isStarRating && activeUserType) {
      // Extract star rating number from category (e.g., '3-Star' -> 3)
      const starMatch = category.match(/(\d+)-Star/);
      const starRating = starMatch ? parseInt(starMatch[1]) : null;
      
      if (starRating) {
        // Filter by star_ratings property and gridcode
        // star_ratings is an object like { vehicle_occupant: 3, motorcyclist: 2, ... }
        // Use nested property access: ['get', 'vehicle_occupant', ['get', 'star_ratings']]
        filter = ['all',
          ['==', ['get', activeUserType, ['get', 'star_ratings']], starRating],
          ['==', ['to-string', ['get', 'gridcode']], gridcode]
        ];
        console.log(`🔍 Using star rating filter: starRating=${starRating}, userType=${activeUserType}, gridcode=${gridcode}`);
      } else {
        console.warn(`⚠️ Could not extract star rating from category: ${category}`);
        return;
      }
    } else {
      // Filter by category and gridcode (for road network queries)
      filter = ['all',
        ['==', ['get', 'category'], category],
        ['==', ['to-string', ['get', 'gridcode']], gridcode]
      ];
      console.log(`🔍 Using category filter: category=${category}, gridcode=${gridcode}`);
    }

    // Determine the position for highlight layers: ABOVE query-road-segments-layer
    // This ensures the blue outline appears on top of the colored query results
    // Place it above everything for maximum visibility
    const beforeLayerId = undefined; // Place on top of all layers
    
    // Simple blue line highlight
    map.addLayer({
      id: 'road-network-highlight-outer',
      type: 'line',
      source: sourceId,
      filter: filter,
      paint: {
        'line-color': '#2563EB',
        'line-width': ['interpolate', ['linear'], ['zoom'], 
          10, 5,
          12, 6,
          14, 7,
          16, 8,
          18, 10
        ],
        'line-opacity': 0.9
      }
    }, beforeLayerId);

    console.log('✅ Blue line highlight added');

    // Auto-remove after 3 seconds
    setTimeout(() => {
      try {
        if (map && map.getLayer('road-network-highlight-outer')) {
          map.removeLayer('road-network-highlight-outer');
          console.log('✅ Highlight removed after 3 seconds');
        }
      } catch (error) {
        console.log('⚠️ Error removing highlight layer:', error);
      }
    }, 3000);

    // Optional: Zoom to the highlighted features
    let features = [];
    if (map.getSource('road_network_base')) {
      try {
        features = map.querySourceFeatures('road_network_base', {
          filter: filter,
          sourceLayer: undefined // For GeoJSON sources
        });
      } catch (error) {
        console.warn('⚠️ Error querying road features:', error);
      }
    }

    if (features && features.length > 0) {
      console.log(`📍 Found ${features.length} matching road segments`);
      
      // Calculate bounds of all matching features
      const bounds = new maplibregl.LngLatBounds();
      features.forEach(feature => {
        if (feature.geometry.type === 'LineString') {
          feature.geometry.coordinates.forEach((coord: [number, number]) => {
            bounds.extend(coord);
          });
        } else if (feature.geometry.type === 'MultiLineString') {
          feature.geometry.coordinates.forEach((line: [number, number][]) => {
            line.forEach((coord: [number, number]) => {
              bounds.extend(coord);
            });
          });
        }
      });

      // Fit map to bounds with padding
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: 80,
          maxZoom: 14,
          duration: 800
        });
        console.log('🗺️ Zoomed to highlighted roads');
      }
    } else {
      console.log('⚠️ No matching features found for highlighting');
    }

  }, [selectedRoadNetworkResult, mapReady]);

  // Handle building category filtering based on activeBuildingCategories and activeBuildingSubcategories
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;
    
    // Check if building layers exist
    const buildingsFillLayer = map.getLayer('buildings-fill');
    const buildings3DLayer = map.getLayer('buildings-3d');
    const buildingsHighlightLayer = map.getLayer('buildings-highlight');
    const buildingsBaseLayer = map.getLayer('buildings');
    
    if (!buildingsFillLayer && !buildings3DLayer) {
      console.log('⏭️ Building layers not yet loaded, skipping filter update');
      return;
    }
    
    console.log('🏢 Updating building filter:', {
      categories: activeBuildingCategories,
      subcategories: activeBuildingSubcategories,
      selectedWardName: selectedWardName,
      selectedLguName: selectedLguName,
      hasBarangayFilter: selectedWardName && selectedWardName !== 'all',
      hasLguFilter: selectedLguName && selectedLguName !== 'all'
    });
    
    // Map category IDs to their use_type values in the data
    const categoryUseTypeMap: Record<string, string> = {
      'residential': 'Residential',
      'commercial': 'Commercial Establishments',
      'education': 'Educational Institutions',
      'government': 'Government & Civic Services',
      'health': 'Health Facilities',
      'religious': 'Religious Places',
      'industrial': 'Industrial',
      'transport': 'Transport & Logistics',
    };
    
    // Build filter based on active categories, subcategories, and sewer feasibility
    let categoryFilter: any;
    let sewerPendingLoad = false; // true when sewer mode is active but gids haven't arrived yet
    
    if (activeSewerCategories.length > 0) {
      // Module 1 sewer mode: filter by network zone using grid_gid membership
      const showNetwork    = activeSewerCategories.includes('Sewer Feasible');
      const showOnsite     = activeSewerCategories.includes('On-site Treatment');
      const showNonNetwork = activeSewerCategories.includes('Non-Sewer');
      const gids = scenarioNetworkGidsRef.current;

      if (gids === null) {
        // Scenario GIDs not yet loaded — show all buildings in neutral amber while waiting,
        // no filter applied. Effect re-runs once gids arrive (null → [] or [...ids]).
        console.log('🚰 Sewer mode: waiting for scenario data, showing all buildings temporarily');
        categoryFilter = null; // show everything — colors will update when gids arrive
      } else {

      // Scenario data available — pre-apply 3-way sewer colour expression BEFORE making
      // buildings visible so MapLibre never renders a land-use colour frame on first paint.
      // Network (teal) → buffer/grid | On-site (purple) → bwg_yn=true non-network | Non-network (amber)
      const excIds = excludedBldgIdsRef.current;
      const inNetGrid: any = excIds.length > 0
        ? ['all', ['in', ['get', 'grid_gid'], ['literal', gids]], ['!', ['in', ['id'], ['literal', excIds]]]]
        : ['in', ['get', 'grid_gid'], ['literal', gids]];
      const sewerFillExpr: any = [
        'case',
        ['any',
          inNetGrid,
          ['boolean', ['feature-state', 'inBuffer'], false],
        ],
        '#14B8A6',
        ['==', ['get', 'bwg_yn'], 'Yes'],
        '#8B5CF6',
        '#F59E0B',
      ];
      if (buildingsFillLayer) map.setPaintProperty('buildings-fill', 'fill-color', sewerFillExpr);
      if (buildings3DLayer) {
        map.setPaintProperty('buildings-3d', 'fill-extrusion-color', [
          'case',
          ['boolean', ['feature-state', 'hover'], false], '#2563EB',
          ['any',
            inNetGrid,
            ['boolean', ['feature-state', 'inBuffer'], false],
          ],
          '#14B8A6',
          ['==', ['get', 'bwg_yn'], 'Yes'],
          '#8B5CF6',
          '#F59E0B',
        ]);
      }

      const allThreeSelected = showNetwork && showOnsite && showNonNetwork;
      const bufIds = bufferBldgIdsRef.current;
      // Helper filters — excluded buildings are treated as non-network
      const isNetwork = bufIds.length > 0
        ? ['any', inNetGrid, ['in', ['id'], ['literal', bufIds]]]
        : inNetGrid;
      const isNonNetwork = bufIds.length > 0
        ? ['all', ['!', inNetGrid], ['!', ['in', ['id'], ['literal', bufIds]]]]
        : ['!', inNetGrid];
      const isBwg = ['==', ['get', 'bwg_yn'], 'Yes'];

      if (allThreeSelected) {
        categoryFilter = null;
      } else if (showNetwork && showOnsite && !showNonNetwork) {
        // Network + On-site: hide non-network non-bwg buildings
        categoryFilter = ['any', isNetwork, ['all', isNonNetwork, isBwg]];
      } else if (showNetwork && !showOnsite && showNonNetwork) {
        // Network + Non-network: hide on-site (bwg) non-network buildings
        categoryFilter = ['any', isNetwork, ['all', isNonNetwork, ['!', isBwg]]];
      } else if (!showNetwork && showOnsite && showNonNetwork) {
        // On-site + Non-network: hide network buildings
        categoryFilter = isNonNetwork;
      } else if (showNetwork && !showOnsite && !showNonNetwork) {
        categoryFilter = isNetwork;
      } else if (!showNetwork && showOnsite && !showNonNetwork) {
        categoryFilter = ['all', isNonNetwork, isBwg];
      } else if (!showNetwork && !showOnsite && showNonNetwork) {
        categoryFilter = ['all', isNonNetwork, ['!', isBwg]];
      } else {
        // Nothing selected — hide all buildings
        categoryFilter = ['==', ['get', 'use_type'], 'NONE_SELECTED'];
      }
      console.log(`🚰 Sewer mode: showNetwork=${showNetwork}, showOnsite=${showOnsite}, showNonNetwork=${showNonNetwork}, gidCount=${gids.length}`);
      } // end else (gids available)
    } else if (activeBuildingCategories.length === 0 && activeBuildingSubcategories.length === 0) {
      // No categories/subcategories selected. If the Buildings base layer is active,
      // show ALL buildings (uniform grey via paint effect); otherwise hide everything.
      if (activeBaseLayers.includes('buildings')) {
        categoryFilter = null;
        console.log('✅ Buildings base layer active w/o categories - showing all buildings');
      } else {
        categoryFilter = ['==', ['get', 'use_type'], 'NONE_SELECTED'];
        console.log('🚫 No building categories/subcategories selected - hiding all buildings');
      }
    } else if (activeBuildingSubcategories.length > 0) {
      // Subcategories are selected - ONLY show those use_sub values (exclusive filtering)
      categoryFilter = ['in', ['get', 'use_sub'], ['literal', activeBuildingSubcategories]];
      console.log(`🔍 Filtering EXCLUSIVELY by subcategories (use_sub): ${activeBuildingSubcategories.join(', ')}`);
    } else if (activeBuildingCategories.length === 8) {
      // All categories selected, no subcategories - no category filter needed (show all)
      categoryFilter = null;
      console.log('✅ All building categories selected - showing all buildings');
    } else {
      // Some categories selected, no specific subcategories - filter by use_type
      const activeUseTypes = activeBuildingCategories
        .map(id => categoryUseTypeMap[id])
        .filter(Boolean);
      
      categoryFilter = ['in', ['get', 'use_type'], ['literal', activeUseTypes]];
      console.log(`🔍 Filtering by categories (${activeBuildingCategories.join(', ')}) → use_type values:`, activeUseTypes);
    }
    
    // Build admin boundary filters
    const adminFilters: any[] = [];
    
    // Add Barangay filter if a specific barangay is selected (using BrgyName for matching)
    if (selectedWardName && selectedWardName !== 'all') {
      // Try multiple variations: exact match, lowercase match, and common field variations
      adminFilters.push([
        'any',
        ['==', ['get', 'BrgyName'], selectedWardName],
        ['==', ['downcase', ['get', 'BrgyName']], selectedWardName.toLowerCase()],
        ['==', ['get', 'brgyname'], selectedWardName],
        ['==', ['get', 'BRGYNAME'], selectedWardName]
      ]);
      console.log(`🏘️ Filtering buildings by Barangay (BrgyName):`);
      console.log(`   - Exact match: "${selectedWardName}"`);
      console.log(`   - Lowercase match: "${selectedWardName.toLowerCase()}"`);
      console.log(`   - Field variations: BrgyName, brgyname, BRGYNAME`);
    }
    // Add LGU/Municipality filter if an LGU is selected (and no specific barangay)
    else if (selectedLguName && selectedLguName !== 'all') {
      // Try multiple variations: exact match, lowercase match, and common field variations
      adminFilters.push([
        'any',
        ['==', ['get', 'MunName'], selectedLguName],
        ['==', ['downcase', ['get', 'MunName']], selectedLguName.toLowerCase()],
        ['==', ['get', 'munname'], selectedLguName],
        ['==', ['get', 'MUNNAME'], selectedLguName]
      ]);
      console.log(`🏛️ Filtering buildings by Municipality (MunName): "${selectedLguName}"`);
    }
    
    // Combine category filter and admin filters
    let filter: any;
    console.log('🔧 Filter combination debug:', {
      hasCategoryFilter: !!categoryFilter,
      adminFiltersCount: adminFilters.length,
      categoryFilterValue: categoryFilter
    });
    
    if (categoryFilter && adminFilters.length > 0) {
      // Both category and admin filters exist - combine with AND
      filter = ['all', categoryFilter, ...adminFilters];
      console.log('🔗 Combining category and admin boundary filters');
    } else if (categoryFilter) {
      // Only category filter
      filter = categoryFilter;
      console.log('📦 Applying only category filter');
    } else if (adminFilters.length > 0) {
      // Only admin filters (when all categories are selected)
      filter = adminFilters.length === 1 ? adminFilters[0] : ['all', ...adminFilters];
      console.log('🗺️ Applying only admin boundary filter (no category filter)');
    } else {
      // No filters at all
      filter = null;
      console.log('✅ No filters - showing all buildings');
    }
    
    // Apply filter to all building layers (including the base 'buildings' layer)
    console.log('📋 Final building filter expression:', JSON.stringify(filter, null, 2));
    
    if (buildingsBaseLayer) {
      map.setFilter('buildings', filter);
      console.log('✅ Filter applied to buildings (base layer)');
    }
    
    if (buildingsFillLayer) {
      map.setFilter('buildings-fill', filter);
      console.log('✅ Filter applied to buildings-fill');
    }
    
    if (buildings3DLayer) {
      map.setFilter('buildings-3d', filter);
      console.log('✅ Filter applied to buildings-3d');
    }
    
    if (buildingsHighlightLayer) {
      map.setFilter('buildings-highlight', filter);
      console.log('✅ Filter applied to buildings-highlight');
    }
    
    // 🔍 DEBUG: Check layer visibility after applying filter
    console.log('🔍 DEBUG: Layer visibility after filter:', {
      'buildings-fill': buildingsFillLayer ? map.getLayoutProperty('buildings-fill', 'visibility') : 'layer not found',
      'buildings-3d': buildings3DLayer ? map.getLayoutProperty('buildings-3d', 'visibility') : 'layer not found',
      'is3DMode': is3DMode
    });
    
    // 🔍 DEBUG: Query filtered features to verify filter is working (wait for tiles to load)
    // Check immediately
    setTimeout(() => {
      if (map && map.queryRenderedFeatures) {
        const filteredFeatures = map.queryRenderedFeatures({ layers: ['buildings-fill'] });
        console.log(`🔍 DEBUG: Buildings visible after filter (1.5s): ${filteredFeatures.length}`);
        
        if (selectedWardName && selectedWardName !== 'all') {
          console.log(`🔍 DEBUG: Barangay filter active for: "${selectedWardName}"`);
          console.log(`🔍 DEBUG: Looking for buildings where BrgyName matches: "${selectedWardName}" (or case-insensitive)`);
        }
        
        if (filteredFeatures.length > 0 && (selectedWardName || selectedLguName)) {
          // Sample some features to verify their BrgyName/MunName values
          const sample = filteredFeatures.slice(0, 5);
          console.log('🔍 DEBUG: Sample filtered buildings:', sample.map(f => ({
            BrgyName: f.properties?.BrgyName,
            MunName: f.properties?.MunName,
            Category: f.properties?.Category
          })));
        } else if ((selectedWardName && selectedWardName !== 'all') || (selectedLguName && selectedLguName !== 'all')) {
          console.warn('⚠️ DEBUG: No buildings visible despite filter being active!');
          console.warn('   This could mean:');
          console.warn('   1. Tiles haven\'t loaded for this area yet (zoom to barangay)');
          console.warn('   2. BrgyName/MunName values don\'t match exactly');
          console.warn('   3. No buildings exist in this administrative area');
          
          // Query ALL loaded source features to check if data exists
          let allSourceFeatures = [];
          if (map.getSource('buildings')) {
            try {
              allSourceFeatures = map.querySourceFeatures('buildings', {
                sourceLayer: 'Buildings'
              });
            } catch (error) {
              console.warn('⚠️ Error querying building source:', error);
            }
          }
          
          if (selectedWardName && selectedWardName !== 'all') {
            const matchingFeatures = allSourceFeatures.filter(f => {
              const brgyName = f.properties?.BrgyName;
              return brgyName && (
                brgyName === selectedWardName ||
                brgyName.toLowerCase() === selectedWardName.toLowerCase()
              );
            });
            console.log(`🔍 DEBUG: Found ${matchingFeatures.length} buildings in loaded tiles with BrgyName matching "${selectedWardName}"`);
            if (matchingFeatures.length > 0) {
              console.log(`✅ Data exists! Buildings are filtered correctly but may be outside viewport.`);
              console.log(`   Sample BrgyName values:`, matchingFeatures.slice(0, 3).map(f => f.properties?.BrgyName));
            }
          }
        }
      }
    }, 1500);
    
    // 🔍 DEBUG: Check again after more time for tiles to load
    setTimeout(() => {
        const filteredFeatures = map.queryRenderedFeatures({ layers: ['buildings-fill'] });
        console.log(`🔍 DEBUG: Buildings visible after filter (3.5s - after tiles load): ${filteredFeatures.length}`);
        
        if (selectedWardName && selectedWardName !== 'all') {
          if (filteredFeatures.length > 0) {
            console.log('✅ SUCCESS! Barangay filter is working after tiles loaded!');
            const sample = filteredFeatures.slice(0, 3);
            console.log('   Sample buildings:', sample.map(f => ({
              BrgyName: f.properties?.BrgyName,
              MunName: f.properties?.MunName
            })));
          } else {
            console.error('❌ STILL NO BUILDINGS after 3.5s - filter or data issue!');
            // Check if buildings exist in source but aren't rendering
            let allSourceFeatures = [];
            if (map.getSource('buildings')) {
              try {
                allSourceFeatures = map.querySourceFeatures('buildings', { sourceLayer: 'Buildings' });
              } catch (error) {
                console.warn('⚠️ Error querying building source:', error);
              }
            }
            const matchingInSource = allSourceFeatures.filter(f => {
              const brgy = f.properties?.BrgyName;
              return brgy && (brgy === selectedWardName || brgy.toLowerCase() === selectedWardName.toLowerCase());
            });
            console.log(`   Found ${matchingInSource.length} matching buildings in source (not rendered)`);
          }
        }
    }, 3500);
    
    // Control visibility: show buildings layers if any categories, subcategories, or sewer categories are selected
    const shouldShowBuildings = activeBuildingCategories.length > 0 || activeBuildingSubcategories.length > 0 || activeSewerCategories.length > 0;
    
    if (buildingsBaseLayer) {
      map.setLayoutProperty('buildings', 'visibility', shouldShowBuildings ? 'visible' : 'none');
    }
    
    if (buildingsFillLayer) {
      map.setLayoutProperty('buildings-fill', 'visibility', shouldShowBuildings && !is3DMode ? 'visible' : 'none');
    }
    
    if (buildings3DLayer) {
      map.setLayoutProperty('buildings-3d', 'visibility', shouldShowBuildings && is3DMode ? 'visible' : 'none');
    }
    
    if (buildingsHighlightLayer) {
      map.setLayoutProperty('buildings-highlight', 'visibility', shouldShowBuildings ? 'visible' : 'none');
    }
    
    console.log(`🏢 Building layers ${shouldShowBuildings ? 'visible' : 'hidden'} (${activeBuildingCategories.length} categories, ${activeBuildingSubcategories.length} subcategories active)`);
    
    // 🔄 Show loading indicator while tiles re-render after filter change
    setIsBuildingsLoading(true);

    // Hide loading indicator after filtered tiles are fully rendered
    let filterLoadingCleared = false;
    const onFilterMapIdle = () => {
      if (!filterLoadingCleared) {
        // Add 500ms post-idle delay — WebGL needs extra time to paint after tiles load
        setTimeout(() => {
          if (!filterLoadingCleared) {
            filterLoadingCleared = true;
            console.log('✅ Building filter applied and tiles fully rendered (map idle + 500ms) - hiding loading indicator');
            setIsBuildingsLoading(false);
            map.off('idle', onFilterMapIdle);
          }
        }, 500);
      }
    };
    map.once('idle', onFilterMapIdle);
    
    // SAFEGUARD: Force clear loading after 6 seconds if idle never fires
    const filterLoadingTimeout = setTimeout(() => {
      if (!filterLoadingCleared) {
        filterLoadingCleared = true;
        console.log('⏱️ Building filter loading timeout (6s) - hiding loading indicator anyway');
        setIsBuildingsLoading(false);
        map.off('idle', onFilterMapIdle);
      }
    }, 6000);
    
    // Cleanup function — only cancel listeners; do NOT set loading=false here
    // (setIsBuildingsLoading(false) in cleanup causes a transient false flash that prematurely
    //  dismisses the loader before the next effect run sets it back to true)
    return () => {
      clearTimeout(filterLoadingTimeout);
      map.off('idle', onFilterMapIdle);
      filterLoadingCleared = true; // prevent delayed setTimeout from firing after cleanup
    };
    
  }, [activeBaseLayers, activeBuildingCategories, activeBuildingSubcategories, activeSewerCategories, scenarioNetworkGids, bufferBldgIds, excludedBldgIds, mapReady, buildingsInitialLoadDone, is3DMode, selectedWardName, selectedLguName]);

  // Update building layer colors when toggling sewer feasibility mode (Module 1)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    // When scenario GIDs are available, colour by network membership (buildings mode)
    // Otherwise fall back to use_type colouring (sewer_feas field has been removed)
    //
    // In sewer mode (activeSewerCategories active): treat "scenario loaded" as hasScenario=true
    // even when gids=[] (fully non-network barangay). That way all buildings correctly show
    // the non-network color (#F59E0B) instead of reverting to land-use colors.
    // Outside sewer mode: only true when there are actual qualifying GIDs.
    const hasScenario = activeSewerCategories.length > 0
      ? scenarioNetworkGids !== null  // sewer mode: loaded = show sewer color scheme
      : ((scenarioNetworkGids && scenarioNetworkGids.length > 0) || bufferBldgIds.length > 0);
    const _excIds = excludedBldgIds;
    const _inNetGrid: any = _excIds.length > 0
      ? ['all', ['in', ['get', 'grid_gid'], ['literal', scenarioNetworkGids ?? []]], ['!', ['in', ['id'], ['literal', _excIds]]]]
      : ['in', ['get', 'grid_gid'], ['literal', scenarioNetworkGids ?? []]];
    const buildingFillColor: any = hasScenario
      ? [
          'case',
          // Network: grid_gid in qualifying set (minus excluded) OR feature-state inBuffer → teal
          [
            'any',
            _inNetGrid,
            ['boolean', ['feature-state', 'inBuffer'], false],
          ],
          '#14B8A6',
          // On-site treatment: non-network bulk wastewater generator → purple
          ['==', ['get', 'bwg_yn'], 'Yes'],
          '#8B5CF6',
          // Non-network → amber
          '#F59E0B',
        ]
      : activeSewerCategories.length > 0
      ? '#F59E0B'  // sewer mode loading (gids not yet available) — flat amber to avoid land-use flash
      : [
          'match', ['get', 'use_type'],
          'Residential', '#f6e717',
          'Commercial Establishments', '#e40021',
          'Educational Institutions', '#2963ea',
          'Health Facilities', '#2bdade',
          'Government & Civic Services', '#29da11',
          'Religious Places', '#eb7120',
          'Industrial', '#94A3B8',
          'Transport & Logistics', '#7C3AED',
          '#D4D4D8',
        ];

    const buildingExtrusionColor: any = hasScenario
      ? [
          'case',
          ['boolean', ['feature-state', 'hover'], false], '#2563EB',
          [
            'any',
            _inNetGrid,
            ['boolean', ['feature-state', 'inBuffer'], false],
          ],
          '#14B8A6',
          ['==', ['get', 'bwg_yn'], 'Yes'],
          '#8B5CF6',
          '#F59E0B',
        ]
      : [
          'case',
          ['boolean', ['feature-state', 'hover'], false], '#2563EB',
          ['match', ['get', 'use_type'],
            'Residential', '#f6e717',
            'Commercial Establishments', '#e40021',
            'Educational Institutions', '#2963ea',
            'Health Facilities', '#2bdade',
            'Government & Civic Services', '#29da11',
            'Religious Places', '#eb7120',
            'Industrial', '#94A3B8',
            'Transport & Logistics', '#7C3AED',
            '#E2E8F0',
          ],
        ];

    const useTypeFillColor: any = [
      'match', ['get', 'use_type'],
      'Residential', '#f6e717',
      'Commercial Establishments', '#e40021',
      'Educational Institutions', '#2963ea',
      'Health Facilities', '#2bdade',
      'Government & Civic Services', '#29da11',
      'Religious Places', '#eb7120',
      'Industrial', '#94A3B8',
      'Transport & Logistics', '#7C3AED',
      '#D4D4D8',
    ];
    const useTypeExtrusionColor: any = [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      '#2563EB',
      ['match', ['get', 'use_type'],
        'Residential', '#f6e717',
        'Commercial Establishments', '#e40021',
        'Educational Institutions', '#2963ea',
        'Health Facilities', '#2bdade',
        'Government & Civic Services', '#29da11',
        'Religious Places', '#eb7120',
        'Industrial', '#94A3B8',
        'Transport & Logistics', '#7C3AED',
        '#E2E8F0',
      ],
    ];

    const isSewer = activeSewerCategories.length > 0;
    if (map.getLayer('buildings-fill')) {
      map.setPaintProperty('buildings-fill', 'fill-color', isSewer ? buildingFillColor : useTypeFillColor);
    }
    if (map.getLayer('buildings-3d')) {
      map.setPaintProperty('buildings-3d', 'fill-extrusion-color', isSewer ? buildingExtrusionColor : useTypeExtrusionColor);
    }
    // Keep outline in sync with fill
    if (map.getLayer('buildings')) {
      const outlineColor: any = isSewer
        ? (hasScenario
            ? [
                'case',
                [
                  'any',
                  _inNetGrid,
                  ['boolean', ['feature-state', 'inBuffer'], false],
                ],
                '#0D9488',
                ['==', ['get', 'bwg_yn'], 'Yes'],
                '#7C3AED',
                '#D97706',
              ]
            : '#D97706'  // sewer loading — flat amber outline to avoid land-use flash
           )
        : [
            'match', ['get', 'use_type'],
            'Residential',                '#dfd229',
            'Commercial Establishments',  '#d41a40',
            'Educational Institutions',   '#1d46a6',
            'Health Facilities',          '#1e989a',
            'Government & Civic Services','#24bd0f',
            'Religious Places',           '#a24e16',
            'Industrial',                 '#6B7280',
            'Transport & Logistics',      '#5B21B6',
            '#71717A',
          ];
      map.setPaintProperty('buildings', 'line-color', outlineColor);
    }
  }, [activeSewerCategories, scenarioNetworkGids, bufferBldgIds, excludedBldgIds, mapReady]);

  // Buildings base layer ─ paint uniform grey when the base "Buildings" toggle is
  // active without any specific building category/subcategory selection.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const baseOnly =
      activeBaseLayers.includes('buildings') &&
      activeBuildingCategories.length === 0 &&
      activeBuildingSubcategories.length === 0 &&
      activeSewerCategories.length === 0;
    if (!baseOnly) return;

    const grey = '#B8BCC2';        // light slate grey fill
    const greyEdge = '#7C8089';    // slightly darker grey outline
    const extrusionGrey: any = [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      '#2563EB',
      grey,
    ];
    if (map.getLayer('buildings-fill')) {
      map.setPaintProperty('buildings-fill', 'fill-color', grey);
    }
    if (map.getLayer('buildings-3d')) {
      map.setPaintProperty('buildings-3d', 'fill-extrusion-color', extrusionGrey);
    }
    if (map.getLayer('buildings')) {
      map.setPaintProperty('buildings', 'line-color', greyEdge);
    }
  }, [activeBaseLayers, activeBuildingCategories, activeBuildingSubcategories, activeSewerCategories, mapReady, styleLoadCounter]);

  // Sync buffer layer visibility when sewerCategories toggle changes (buildings mode)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;
    const showBuffer = activeSewerCategories.includes('Sewer Feasible');
    if (map.getLayer('scenario-buffer-fill'))
      map.setLayoutProperty('scenario-buffer-fill', 'visibility', showBuffer ? 'visible' : 'none');
    if (map.getLayer('scenario-buffer-outline'))
      map.setLayoutProperty('scenario-buffer-outline', 'visibility', showBuffer ? 'visible' : 'none');
  }, [activeSewerCategories, mapReady]);

  // Module 1 Grid mode — toggle visibility of scenario layers based on active zone categories
  // (sewer_feas field removed from GeoServer; feasibility comes from precomputed scenario tables)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    const showNetwork    = activeGridSewerCategories.includes('Sewer Feasible');
    const showNonNetwork = activeGridSewerCategories.includes('Non-Sewer');

    if (map.getLayer('scenario-grid-fill'))
      map.setLayoutProperty('scenario-grid-fill', 'visibility', showNetwork ? 'visible' : 'none');
    if (map.getLayer('scenario-grid-outline'))
      map.setLayoutProperty('scenario-grid-outline', 'visibility', showNetwork ? 'visible' : 'none');
    if (map.getLayer('scenario-grid-base-fill'))
      map.setLayoutProperty('scenario-grid-base-fill', 'visibility', showNonNetwork ? 'visible' : 'none');
    // Buffer zone visibility tied to network toggle
    if (map.getLayer('scenario-buffer-fill'))
      map.setLayoutProperty('scenario-buffer-fill', 'visibility', showNetwork ? 'visible' : 'none');
    if (map.getLayer('scenario-buffer-outline'))
      map.setLayoutProperty('scenario-buffer-outline', 'visibility', showNetwork ? 'visible' : 'none');
  }, [activeGridSewerCategories, mapReady]);

  // Update scenario grid layer opacity and buildings-fill opacity when layerOpacities['grid_sewer'] changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;
    const opacity = layerOpacities['grid_sewer'] ?? 0.75;
    if (map.getLayer('scenario-grid-fill'))
      map.setPaintProperty('scenario-grid-fill', 'fill-opacity', opacity);
    if (map.getLayer('scenario-grid-outline'))
      map.setPaintProperty('scenario-grid-outline', 'line-opacity', opacity);
    if (map.getLayer('scenario-grid-base-fill'))
      map.setPaintProperty('scenario-grid-base-fill', 'fill-opacity', Math.max(0, opacity - 0.15));
    // Also apply to buildings fill/extrusion when sewer mode is active
    if (activeSewerCategoriesRef.current.length > 0) {
      if (map.getLayer('buildings-fill'))
        map.setPaintProperty('buildings-fill', 'fill-opacity', opacity);
      if (map.getLayer('buildings-3d'))
        map.setPaintProperty('buildings-3d', 'fill-extrusion-opacity', opacity);
    }
  }, [layerOpacities, mapReady]);

  // Module 1 Scenario Creator — show all grid cells (amber = non-sewer) + qualifying overlay (teal = network)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    const cleanup = () => {
      if (map.getLayer('scenario-grid-labels'))    map.removeLayer('scenario-grid-labels');
      if (map.getSource('scenario-grid-labels'))   map.removeSource('scenario-grid-labels');
      if (map.getLayer('scenario-grid-fill'))      map.removeLayer('scenario-grid-fill');
      if (map.getLayer('scenario-grid-outline'))   map.removeLayer('scenario-grid-outline');
      if (map.getSource('scenario-grid'))          map.removeSource('scenario-grid');
      if (map.getLayer('scenario-grid-base-fill')) map.removeLayer('scenario-grid-base-fill');
      if (map.getSource('scenario-grid-base'))     map.removeSource('scenario-grid-base');
    };

    cleanup();

    if (!scenarioGridGeoJSON || !scenarioGridGeoJSON.features?.length) return;

    const gridTileUrl =
      'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/wms' +
      '?service=WMS&version=1.1.0&request=GetMap' +
      '&layers=WorldBank_Bohol:Grid' +
      '&bbox={bbox-epsg-3857}' +
      '&width=512&height=512' +
      '&srs=EPSG:3857' +
      '&format=application/vnd.mapbox-vector-tile';

    try {
      const showNetwork    = activeGridSewerCategories.includes('Sewer Feasible');
      const showNonNetwork = activeGridSewerCategories.includes('Non-Sewer');
      const gridOpacity = layerOpacities['grid_sewer'] ?? 0.75;

      // Derive network GIDs from the GeoJSON returned by the precomputed scenario API
      const networkGids: number[] = (scenarioGridGeoJSON.features ?? []).map((feat: any) => {
        const fromProps = feat.properties?.gid ?? feat.properties?.id;
        if (fromProps != null) return Number(fromProps);
        const m = String(feat.id ?? '').match(/\.(\d+)$/);
        return m ? Number(m[1]) : null;
      }).filter((g: number | null) => g !== null) as number[];

      // Filter that selects only non-network cells: all GeoServer Grid cells NOT in the network list
      const nonNetworkFilter: any = networkGids.length > 0
        ? ['!', ['in', ['get', 'gid'], ['literal', networkGids]]]
        : true; // no network cells → every cell is non-network

      // 1. Base layer — only non-network grid cells in amber
      map.addSource('scenario-grid-base', {
        type: 'vector',
        tiles: [gridTileUrl],
        minzoom: 0,
        maxzoom: 22,
      });
      map.addLayer({
        id: 'scenario-grid-base-fill',
        type: 'fill',
        source: 'scenario-grid-base',
        'source-layer': 'Grid',
        filter: nonNetworkFilter,
        layout: { 'visibility': showNonNetwork ? 'visible' : 'none' },
        paint: {
          'fill-color': '#F59E0B',
          'fill-opacity': Math.max(0, gridOpacity - 0.15),
        },
      });

      // 2. Overlay — qualifying (network coverage) cells from precomputed scenario table (teal)
      map.addSource('scenario-grid', {
        type: 'geojson',
        data: scenarioGridGeoJSON,
      });
      map.addLayer({
        id: 'scenario-grid-fill',
        type: 'fill',
        source: 'scenario-grid',
        layout: { 'visibility': showNetwork ? 'visible' : 'none' },
        paint: {
          'fill-color': '#14B8A6',
          'fill-opacity': gridOpacity,
        },
      });
      map.addLayer({
        id: 'scenario-grid-outline',
        type: 'line',
        source: 'scenario-grid',
        layout: { 'visibility': showNetwork ? 'visible' : 'none' },
        paint: {
          'line-color': '#0D9488',
          'line-width': 1,
          'line-opacity': gridOpacity,
        },
      });

      // 4. Zone labels — one "Zone N" label per cluster, using precomputed centroid
      if (scenarioZones && scenarioZones.length > 0) {
        const labelFeatures = scenarioZones.map((zone, idx) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [zone.centroid_lng, zone.centroid_lat] },
          properties: { zone_label: `${idx + 1}` },
        }));

        map.addSource('scenario-grid-labels', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: labelFeatures },
        });
        map.addLayer({
          id: 'scenario-grid-labels',
          type: 'symbol',
          source: 'scenario-grid-labels',
          layout: {
            'visibility': 'visible',
            'symbol-sort-key': 999,
            'text-field': ['get', 'zone_label'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 10,
            'text-anchor': 'center',
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#14B8A6',
            'text-halo-color': '#0a0f1e',
            'text-halo-width': 1.5,
          },
        });
      }

      // 5. Buffer zone — handled by dedicated bufferGeoJSON useEffect below

      setTimeout(() => {
        if (map && map.getStyle && map.getStyle()) {
          enforceStrictLayerOrder(map);
        }
      }, 100);
    } catch (err) {
      console.error('❌ Failed to add scenario grid overlay:', err);
    }

    return cleanup;
  }, [scenarioGridGeoJSON, scenarioZones, mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Module 1 Buffer Zone — dedicated effect renders in both grid + buildings modes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    const cleanupBuffer = () => {
      if (map.getLayer('scenario-buffer-fill'))    map.removeLayer('scenario-buffer-fill');
      if (map.getLayer('scenario-buffer-outline')) map.removeLayer('scenario-buffer-outline');
      if (map.getSource('scenario-buffer'))        map.removeSource('scenario-buffer');
    };

    cleanupBuffer();

    if (!bufferGeoJSON) return cleanupBuffer;

    try {
      const showBuffer =
        activeSewerCategories.includes('Sewer Feasible') ||
        activeGridSewerCategories.includes('Sewer Feasible');
      const bufferVisible = showBuffer ? 'visible' : 'none';

      map.addSource('scenario-buffer', {
        type: 'geojson',
        data: { type: 'Feature', geometry: bufferGeoJSON, properties: {} },
      });

      const belowLayer = map.getLayer('scenario-grid-fill') ? 'scenario-grid-fill' : undefined;
      map.addLayer({
        id: 'scenario-buffer-fill',
        type: 'fill',
        source: 'scenario-buffer',
        layout: { 'visibility': bufferVisible },
        paint: {
          'fill-color':   '#14B8A6',
          'fill-opacity': 0.07,
        },
      }, belowLayer);

      map.addLayer({
        id: 'scenario-buffer-outline',
        type: 'line',
        source: 'scenario-buffer',
        layout: { 'visibility': bufferVisible },
        paint: {
          'line-color':   '#14B8A6',
          'line-width':   2.5,
          'line-opacity': 0.9,
        },
      });
    } catch (err) {
      console.error('❌ Failed to add buffer zone overlay:', err);
    }

    return cleanupBuffer;
  }, [bufferGeoJSON, mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── FSTP Service Area & Location layers (Module 3) ─────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    const LOCATIONS_SOURCE   = 'fstp-locations';
    const GEOSERVER_WFS_BASE = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?service=WFS&version=1.0.0&request=GetFeature&outputFormat=application/json&srsName=EPSG:4326';

    const BAND_COLORS: Record<string, string> = {
      '< 10 min':    '#16A34A', // green — immediate service
      '10 - 20 min': '#FACC15', // yellow — routine service
      '20 - 30 min': '#F97316', // orange — extended service
      '> 30 min':    '#DC2626', // deep red — remote service
    };

    // Best-to-worst order (highest priority first)
    const BAND_PRIORITY_ORDER = ['< 10 min', '10 - 20 min', '20 - 30 min', '> 30 min'];

    const bandSourceIds = BAND_PRIORITY_ORDER.map(band =>
      `fstp-band-${band.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
    );
    const bandLayerIds = BAND_PRIORITY_ORDER.flatMap(band => {
      const slug = band.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      // Outline layer intentionally included in cleanup list so any pre-existing
      // outlines from older sessions are removed; new renders only add the fill.
      return [`fstp-band-fill-${slug}`, `fstp-band-outline-${slug}`];
    });
    const allLayerIds = [...bandLayerIds, 'fstp-locations-circle', 'fstp-locations-label'];

    const cleanup = () => {
      allLayerIds.forEach(id => { try { if (map.getLayer(id)) map.removeLayer(id); } catch (e) {} });
      [...bandSourceIds, LOCATIONS_SOURCE].forEach(id => { try { if (map.getSource(id)) map.removeSource(id); } catch (e) {} });
      // Reset Module 3 loading counter and clear spinner when leaving module
      module3LoadingCountRef.current = 0;
      setIsBuildingsLoading(false);
    };

    cleanup();

    if (activeModule !== 'module3_collection') return cleanup;

    const enabledFacilities = activeFstpLayers.filter(f => f.enabled);
    if (enabledFacilities.length === 0) return cleanup;

    // Increment counter and show spinner — will be decremented in finally block
    module3LoadingCountRef.current++;
    setIsBuildingsLoading(true);

    (async () => {
      try {
        const allActiveBands = Array.from(new Set(enabledFacilities.flatMap(f => f.activeBands)));
        if (allActiveBands.length === 0) return;

        // Map facilityId → GeoServer Name field (these are fixed in the shapefile)
        const FSTP_GEOSERVER_NAMES: Record<number, string> = {
          1: 'JAICA FSTP (Tagbilaran)',
          2: 'USAID FSTP (Tagbilaran)',
          3: 'Existing FSTP (Dauis)',
        };

        // Map of sorted facilityId combinations → pre-computed FacilityNm in the shapefile
        const COMBINED_NAME_MAP: Record<string, string> = {
          '1,2':   'JAICA + USAID',
          '1,3':   'Existing + JAICA',
          '2,3':   'Existing + USAID',
          '1,2,3': 'All Three FSTPs',
        };

        let cqlFilter: string;
        if (enabledFacilities.length === 1) {
          // Single facility — filter by FacilityID
          const f = enabledFacilities[0];
          if (f.activeBands.length === 0) return;
          const bandList = f.activeBands.map(b => `'${b}'`).join(',');
          cqlFilter = `FacilityID=${f.facilityId} AND Scenario='${f.scenario}' AND Type IN (${bandList})`;
        } else {
          // Multiple facilities — switch to the pre-computed combined scenario field (FacilityNm)
          const sortedIds = enabledFacilities.map(f => f.facilityId).sort((a, b) => a - b).join(',');
          const combinedName = COMBINED_NAME_MAP[sortedIds];
          if (!combinedName) return; // Unknown combination — skip
          if (allActiveBands.length === 0) return;
          // Scenario is driven by the first enabled facility's toggle
          const scenario = enabledFacilities[0].scenario;
          const bandList = allActiveBands.map(b => `'${b}'`).join(',');
          cqlFilter = `FacilityNm='${combinedName}' AND Scenario='${scenario}' AND Type IN (${bandList})`;
        }

        const saUrl = `${GEOSERVER_WFS_BASE}&typeName=WorldBank_Bohol:FSTP_Service_Area&CQL_FILTER=${encodeURIComponent(cqlFilter)}`;
        const nameList = enabledFacilities.map(f => `'${FSTP_GEOSERVER_NAMES[f.facilityId] ?? f.facilityName}'`).join(',');
        const locUrl = `${GEOSERVER_WFS_BASE}&typeName=WorldBank_Bohol:FSTP_Locations&CQL_FILTER=${encodeURIComponent(`Name IN (${nameList})`)}`;

        const [saRes, locRes] = await Promise.all([fetch(saUrl), fetch(locUrl)]);
        if (!saRes.ok) throw new Error(`FSTP_Service_Area WFS error: ${saRes.status}`);
        if (!locRes.ok) throw new Error(`FSTP_Locations WFS error: ${locRes.status}`);
        const [saGeoJSON, locGeoJSON] = await Promise.all([saRes.json(), locRes.json()]);

        if (!map.getCanvas()) return;

        // Lazy-load turf only when needed (named exports, not default)
        const [{ union: turfUnion }, { difference: turfDifference }, { featureCollection: turfFc }] = await Promise.all([
          import('@turf/union'),
          import('@turf/difference'),
          import('@turf/helpers'),
        ]);

        // Build union polygon for each band (merged across all facilities)
        const bandPolygons: Record<string, any> = {};
        for (const band of BAND_PRIORITY_ORDER) {
          if (!allActiveBands.includes(band)) continue;
          const features = (saGeoJSON.features ?? []).filter((f: any) => f.properties?.Type === band);
          if (features.length === 0) continue;
          try {
            // union() takes a FeatureCollection of all features
            const merged = turfUnion(turfFc(features));
            if (merged) bandPolygons[band] = merged;
          } catch (e) {
            // Fallback: use first feature if union fails
            bandPolygons[band] = features[0];
          }
        }

        // Subtract all higher-priority bands from each band so there is zero overlap
        // Result: each area on the map can only belong to ONE band colour
        const activePriorityBands = BAND_PRIORITY_ORDER.filter(b => bandPolygons[b]);
        const clippedBandPolygons: Record<string, any> = {};

        for (let i = 0; i < activePriorityBands.length; i++) {
          const band = activePriorityBands[i];
          let geom = bandPolygons[band];
          // Subtract every higher-priority band (earlier in the list)
          for (let j = 0; j < i; j++) {
            const higherGeom = clippedBandPolygons[activePriorityBands[j]] ?? bandPolygons[activePriorityBands[j]];
            if (higherGeom) {
              try {
                // difference() takes a FeatureCollection of [base, subtract]
                geom = turfDifference(turfFc([geom, higherGeom])) ?? geom;
              } catch (e) {}
            }
          }
          clippedBandPolygons[band] = geom;
        }

        // Add or update one source+layer per band
        for (const band of activePriorityBands) {
          const geom = clippedBandPolygons[band];
          if (!geom) continue;

          const slug     = band.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const sourceId = `fstp-band-${slug}`;
          const fillId   = `fstp-band-fill-${slug}`;
          const color    = BAND_COLORS[band] ?? '#94A3B8';
          const fc = geom.type === 'FeatureCollection' ? geom : { type: 'FeatureCollection', features: [geom] };

          if (map.getSource(sourceId)) {
            (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(fc);
          } else {
            map.addSource(sourceId, { type: 'geojson', data: fc });
          }
          if (!map.getLayer(fillId)) {
            map.addLayer({ id: fillId, type: 'fill', source: sourceId,
              paint: { 'fill-color': color, 'fill-opacity': 0.45 } });
          }
          // Outline intentionally omitted — fill-only rendering for a softer,
          // overlapping "service area" look (see FSTP Service Coverage UX).
        }

        // Location points
        if (map.getSource(LOCATIONS_SOURCE)) {
          (map.getSource(LOCATIONS_SOURCE) as maplibregl.GeoJSONSource).setData(locGeoJSON);
        } else {
          map.addSource(LOCATIONS_SOURCE, { type: 'geojson', data: locGeoJSON });
        }
        if (!map.getLayer('fstp-locations-circle')) {
          map.addLayer({
            id: 'fstp-locations-circle', type: 'circle', source: LOCATIONS_SOURCE,
            paint: { 'circle-radius': 8,
              'circle-color': ['match', ['get', 'Type'], 'Existing', '#22C55E', '#3B82F6'],
              'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
          });
          map.addLayer({
            id: 'fstp-locations-label', type: 'symbol', source: LOCATIONS_SOURCE,
            layout: {
              'text-field': ['match', ['get', 'Name'],
                'JAICA FSTP (Tagbilaran)', 'FSTP Tagbilaran, Option 1 (Dao)',
                'USAID FSTP (Tagbilaran)', 'FSTP Tagbilaran, Option 2 (Tiptip)',
                ['get', 'Name'] // fallback — keep original for Existing FSTP etc.
              ],
              'text-size': 10,
              'text-anchor': 'top',
              'text-offset': [0, 1.2],
              'text-max-width': 8,
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-allow-overlap': true,
              'text-ignore-placement': true,
              'text-padding': 2,
            },
            paint: {
              'text-color': '#F0F9FF',
              'text-halo-color': '#0C2442',
              'text-halo-width': 3,
            },
          });
        }

        enforceStrictLayerOrder(map);

        console.log('✅ FSTP merged band layers rendered on map');
      } catch (err) {
        console.error('❌ Failed to render FSTP layers:', err);
      } finally {
        // Decrement counter; hide spinner only when all M3 ops are done
        module3LoadingCountRef.current = Math.max(0, module3LoadingCountRef.current - 1);
        if (module3LoadingCountRef.current === 0) setIsBuildingsLoading(false);
      }
    })();

    return cleanup;
  }, [activeFstpLayers, activeModule, mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── FSTP Building Coverage Overlay (Module 3) ───────────────────────────────
  // Adds per-band fill (2D) + fill-extrusion (3D) layers on the buildings MVT source.
  // Only fires when showFstpBuildings is true.
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    const BAND_ORDER = ['< 10 min', '10 - 20 min', '20 - 30 min', '> 30 min'];
    const BAND_COLORS: Record<string, string> = {
      '< 10 min':    '#16A34A',
      '10 - 20 min': '#FACC15',
      '20 - 30 min': '#F97316',
      '> 30 min':    '#DC2626',
    };
    const fillId = (band: string) => `fstp-bldg-band-${band.replace(/[^a-z0-9]/gi,'_').toLowerCase()}`;
    const extId  = (band: string) => `fstp-bldg-band-3d-${band.replace(/[^a-z0-9]/gi,'_').toLowerCase()}`;

    const cleanup = () => {
      BAND_ORDER.forEach(b => {
        try { if (map.getLayer(fillId(b))) map.removeLayer(fillId(b)); } catch (e) {}
        try { if (map.getLayer(extId(b)))  map.removeLayer(extId(b));  } catch (e) {}
      });
      // Loading state is managed by module3LoadingCountRef (reset by service area cleanup)
    };

    cleanup();

    if (activeModule !== 'module3_collection') return cleanup;
    if (!map.getSource('buildings')) return cleanup;
    if (!showFstpBuildings) return cleanup; // Buildings hidden by default — user must toggle on

    const enabled = (activeFstpLayers ?? []).filter((f: any) => f.enabled);
    if (enabled.length === 0) return cleanup;

    const FSTP_GEOSERVER_NAMES: Record<number, string> = {
      1: 'JAICA FSTP (Tagbilaran)',
      2: 'USAID FSTP (Tagbilaran)',
      3: 'Existing FSTP (Dauis)',
    };
    const COMBINED_NAME_MAP: Record<string, string> = {
      '1,2': 'JAICA + USAID', '1,3': 'Existing + JAICA',
      '2,3': 'Existing + USAID', '1,2,3': 'All Three FSTPs',
    };
    let facilityNm: string;
    if (enabled.length === 1) {
      facilityNm = FSTP_GEOSERVER_NAMES[enabled[0].facilityId] ?? enabled[0].facilityName;
    } else {
      const key = enabled.map((f: any) => f.facilityId).sort((a: number, b: number) => a - b).join(',');
      facilityNm = COMBINED_NAME_MAP[key] ?? '';
    }
    if (!facilityNm) return cleanup;

    const allBands = Array.from(new Set(enabled.flatMap((f: any) => f.activeBands as string[])));
    if (allBands.length === 0) return cleanup;

    const scenario: string = enabled[0].scenario ?? 'Normal';
    const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? '';
    const params = new URLSearchParams({ facility_nm: facilityNm, scenario, bands: allBands.join(',') });

    // Add placeholder 2D fill + 3D extrusion layers (empty filter until IDs arrive)
    for (const band of BAND_ORDER) {
      if (!allBands.includes(band)) continue;
      const color = BAND_COLORS[band];

      // 2D fill layer (visible in flat mode)
      if (!map.getLayer(fillId(band))) {
        map.addLayer({
          id: fillId(band),
          type: 'fill',
          source: 'buildings',
          'source-layer': 'Buildings',
          filter: ['in', ['id'], ['literal', []]],
          layout: { visibility: is3DMode ? 'none' : 'visible' },
          paint: { 'fill-color': color, 'fill-opacity': 0.85 },
        });
      }

      // 3D extrusion layer (visible in 3D mode)
      if (!map.getLayer(extId(band))) {
        map.addLayer({
          id: extId(band),
          type: 'fill-extrusion',
          source: 'buildings',
          'source-layer': 'Buildings',
          filter: ['in', ['id'], ['literal', []]],
          layout: { visibility: is3DMode ? 'visible' : 'none' },
          paint: {
            'fill-extrusion-color': color,
            'fill-extrusion-height': ['*', ['to-number', ['coalesce', ['get', 'floors'], 1]], 4],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.9,
            'fill-extrusion-vertical-gradient': true,
          },
        });
      }
    }
    enforceStrictLayerOrder(map);

    // Increment counter and ensure spinner is on while fetching building IDs
    module3LoadingCountRef.current++;
    setIsBuildingsLoading(true);

    const ctrl = new AbortController();
    fetch(`${API_BASE}/api/fstp-building-stats/ids?${params}`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((json: { by_band: Record<string, number[]> }) => {
        if (!map.getCanvas()) return;
        for (const band of BAND_ORDER) {
          if (!allBands.includes(band)) continue;
          const ids = json.by_band[band] ?? [];
          const filter: any = ['in', ['id'], ['literal', ids]];
          if (map.getLayer(fillId(band))) map.setFilter(fillId(band), filter);
          if (map.getLayer(extId(band)))  map.setFilter(extId(band),  filter);
        }
        enforceStrictLayerOrder(map);
        const total = Object.values(json.by_band).reduce((s, a) => s + a.length, 0);
        console.log(`✅ FSTP building overlay: ${total} building footprints colored`);
        module3LoadingCountRef.current = Math.max(0, module3LoadingCountRef.current - 1);
        if (module3LoadingCountRef.current === 0) setIsBuildingsLoading(false);
      })
      .catch(err => {
        if (err?.name !== 'AbortError') console.warn('FSTP building overlay fetch failed:', err);
        module3LoadingCountRef.current = Math.max(0, module3LoadingCountRef.current - 1);
        if (module3LoadingCountRef.current === 0) setIsBuildingsLoading(false);
      });

    return () => {
      ctrl.abort();
      cleanup();
    };
  }, [activeFstpLayers, activeModule, mapReady, buildingsInitialLoadDone, showFstpBuildings]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Fleet Accessibility Overlay (Module 3) ───────────────────────────────────
  // Renders fill layers on the buildings MVT source filtered by dslg_class.
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    const FLEET_CLASSES: Array<{ key: string; color: string }> = [
      { key: '10 KL Truck',       color: '#22C55E' },
      { key: '5 KL Truck',        color: '#3B82F6' },
      { key: 'With Booster Pump', color: '#F59E0B' },
      { key: 'Hard to Access',    color: '#EF4444' },
    ];

    const layerId = (key: string) =>
      `fleet-access-bldg-${key.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

    const cleanup = () => {
      FLEET_CLASSES.forEach(cls => {
        const id = layerId(cls.key);
        try { if (map.getLayer(id)) map.removeLayer(id); } catch (e) {}
      });
    };

    cleanup();

    if (activeModule !== 'module3_collection' || !map.getSource('buildings')) {
      console.log('🚛 Fleet: skipping — activeModule:', activeModule, 'hasBuildings:', !!map.getSource('buildings'));
      return cleanup;
    }
    if (!activeFleetClasses || activeFleetClasses.length === 0) {
      console.log('🚛 Fleet: no active classes');
      return cleanup;
    }

    console.log('🚛 Fleet: adding layers for', activeFleetClasses);

    FLEET_CLASSES.forEach(cls => {
      if (!activeFleetClasses.includes(cls.key)) return;
      const id = layerId(cls.key);
      if (map.getLayer(id)) return;
      console.log('🚛 Fleet: adding layer', id, 'filter:', cls.key);
      map.addLayer({
        id,
        type: 'fill',
        source: 'buildings',
        'source-layer': 'Buildings',
        filter: ['==', ['get', 'dslg_class'], cls.key],
        paint: {
          'fill-color': cls.color,
          'fill-opacity': fleetOpacity,
        },
      });
    });

    enforceStrictLayerOrder(map);
    return cleanup;
  }, [activeFleetClasses, activeModule, mapReady, buildingsInitialLoadDone]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync fleet accessibility layer opacity when slider changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;
    const FLEET_KEYS = ['10 KL Truck', '5 KL Truck', 'With Booster Pump', 'Hard to Access'];
    FLEET_KEYS.forEach(key => {
      const id = `fleet-access-bldg-${key.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
      if (map.getLayer(id)) {
        map.setPaintProperty(id, 'fill-opacity', fleetOpacity);
      }
    });
  }, [fleetOpacity, mapReady]);

  // Sync FSTP service area fill opacity when slider changes
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;
    const BANDS = ['< 10 min', '10 - 20 min', '20 - 30 min', '> 30 min'];
    BANDS.forEach(band => {
      const slug = band.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fillId = `fstp-band-fill-${slug}`;
      const bldgFillId = `fstp-bldg-band-${slug}`;
      if (map.getLayer(fillId)) {
        map.setPaintProperty(fillId, 'fill-opacity', fstpOpacity);
      }
      if (map.getLayer(bldgFillId)) {
        map.setPaintProperty(bldgFillId, 'fill-opacity', fstpOpacity);
      }
    });
  }, [fstpOpacity, mapReady]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    const map = mapRef.current;
    
    console.log('💰 Managing Economic Vulnerability layer:', isEconomicVulnerabilityActive);
    
    // Check if buildings source exists
    if (!map.getSource('buildings')) {
      console.log('⏭️ Buildings source not available, skipping Economic Vulnerability layer');
      return;
    }
    
    if (isEconomicVulnerabilityActive) {
      // Remove existing economic vulnerability layers if they exist
      if (map.getLayer('economic-vulnerability-fill')) {
        map.removeLayer('economic-vulnerability-fill');
      }
      if (map.getLayer('economic-vulnerability-3d')) {
        map.removeLayer('economic-vulnerability-3d');
      }
      if (map.getLayer('economic-vulnerability-outline')) {
        map.removeLayer('economic-vulnerability-outline');
      }
      
      // Create base filter (administrative only - show both Yes and No)
      let economicVulnerabilityFilter: any = ['all'];
      
      // Add administrative filters if needed
      if (selectedWardName && selectedWardName !== 'all') {
        economicVulnerabilityFilter.push(['==', ['get', 'BrgyName'], selectedWardName]);
      } else if (selectedLguName && selectedLguName !== 'all') {
        economicVulnerabilityFilter.push(['==', ['get', 'MunName'], selectedLguName]);
      }
      
      // If no administrative filter, just use true to show all
      if (economicVulnerabilityFilter.length === 1) {
        economicVulnerabilityFilter = true;
      }
      
      console.log('💰 Economic Vulnerability filter:', economicVulnerabilityFilter);
      
      // Add fill layer with conditional coloring (red for Yes, light grey for No)
      map.addLayer({
        id: 'economic-vulnerability-fill',
        type: 'fill',
        source: 'buildings',
        'source-layer': 'Buildings',
        minzoom: 11,
        filter: economicVulnerabilityFilter,
        layout: {
          'visibility': 'visible'
        },
        paint: {
          'fill-color': [
            'match',
            ['get', 'econ_vuln'],
            'Economically Vulnerable', '#DC2626',   // Deep red
            '#E5E7EB'                               // Others / null → light grey
          ],
          'fill-opacity': buildingOpacityRef.current
        }
      });
      
      // Add 3D layer with conditional coloring
      map.addLayer({
        id: 'economic-vulnerability-3d',
        type: 'fill-extrusion',
        source: 'buildings',
        'source-layer': 'Buildings',
        minzoom: 11,
        filter: economicVulnerabilityFilter,
        layout: {
          'visibility': is3DMode ? 'visible' : 'none'
        },
        paint: {
          'fill-extrusion-color': [
            'match',
            ['get', 'econ_vuln'],
            'Economically Vulnerable', '#DC2626',
            '#E5E7EB'
          ],
          'fill-extrusion-height': [
            '*', 
            ['to-number', ['coalesce', ['get', 'floors'], 1]],
            4
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': buildingOpacityRef.current,
          'fill-extrusion-vertical-gradient': true
        }
      });
      
      // Add outline layer with conditional coloring (darker red for Yes, medium grey for No)
      map.addLayer({
        id: 'economic-vulnerability-outline',
        type: 'line',
        source: 'buildings',
        'source-layer': 'Buildings',
        minzoom: 11,
        filter: economicVulnerabilityFilter,
        layout: {
          'visibility': 'visible'
        },
        paint: {
          'line-color': [
            'match',
            ['get', 'econ_vuln'],
            'Economically Vulnerable', '#B91C1C',
            '#D1D5DB'  // Others / null → light grey outline
          ],
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            11, 0.3,  // Match building outline style
            13, 0.5,
            15, 0.7,
            16, 0.8,
            18, 1.0
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            11, 0.6,  // Match building outline style
            13, 0.7,  // More visible
            15, 0.8,  // More visible
            17, 0.9   // Full visibility when zoomed in
          ]
        }
      });
      
      console.log('✅ Economic Vulnerability layers added');
    } else {
      // Remove economic vulnerability layers
      if (map.getLayer('economic-vulnerability-fill')) {
        map.removeLayer('economic-vulnerability-fill');
        console.log('🗑️ Removed economic-vulnerability-fill layer');
      }
      if (map.getLayer('economic-vulnerability-3d')) {
        map.removeLayer('economic-vulnerability-3d');
        console.log('🗑️ Removed economic-vulnerability-3d layer');
      }
      if (map.getLayer('economic-vulnerability-outline')) {
        map.removeLayer('economic-vulnerability-outline');
        console.log('🗑️ Removed economic-vulnerability-outline layer');
      }
    }
    
  }, [isEconomicVulnerabilityActive, mapReady, is3DMode, selectedWardName, selectedLguName]);

  // Handle Building Height layer
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    if (!map.getSource('buildings')) return;

    ['building-height-fill', 'building-height-3d', 'building-height-outline'].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });

    if (activeBuildingHeightCategories.length === 0) return;

    // Build administrative filter
    let adminFilter: any[] = [];
    if (selectedWardName && selectedWardName !== 'all') {
      adminFilter.push(['==', ['get', 'BrgyName'], selectedWardName]);
    } else if (selectedLguName && selectedLguName !== 'all') {
      adminFilter.push(['==', ['get', 'MunName'], selectedLguName]);
    }

    // Build floor-range filter based on active categories
    const floorExpr: any = ['to-number', ['coalesce', ['get', 'floors'], 1]];
    const allCategoryIds = ['low_rise', 'mid_rise', 'high_rise', 'very_high_rise'];
    const allActive = allCategoryIds.every(id => activeBuildingHeightCategories.includes(id));

    const categoryRangeFilters: any[] = [];
    if (activeBuildingHeightCategories.includes('low_rise'))       categoryRangeFilters.push(['all', ['>=', floorExpr, 1], ['<=', floorExpr, 2]]);
    if (activeBuildingHeightCategories.includes('mid_rise'))       categoryRangeFilters.push(['all', ['>=', floorExpr, 3], ['<=', floorExpr, 4]]);
    if (activeBuildingHeightCategories.includes('high_rise'))      categoryRangeFilters.push(['all', ['>=', floorExpr, 5], ['<=', floorExpr, 7]]);
    if (activeBuildingHeightCategories.includes('very_high_rise')) categoryRangeFilters.push(['>=', floorExpr, 8]);

    let filter: any;
    if (adminFilter.length === 0 && allActive) {
      filter = true;
    } else {
      filter = ['all', ...adminFilter];
      if (!allActive) filter.push(['any', ...categoryRangeFilters]);
    }

    // Color by floor count using the defined classes
    const heightColor: any = [
      'step', floorExpr,
      '#6EE7B7',  // 1–2 floors: Low Rise (green)
      3, '#FCD34D', // 3–4 floors: Mid Rise (yellow)
      5, '#FB923C', // 5–7 floors: High Rise (orange)
      8, '#F87171'  // ≥8 floors: Very High Rise (pink-red)
    ];

    const heightOutlineColor: any = [
      'step', floorExpr,
      '#059669',  // Low Rise — darker green
      3, '#D97706', // Mid Rise — darker amber
      5, '#EA580C', // High Rise — darker orange
      8, '#DC2626'  // Very High Rise — darker red
    ];

    const firstLabelLayer = getFirstLabelLayerId(map);

    map.addLayer({
      id: 'building-height-fill',
      type: 'fill',
      source: 'buildings',
      'source-layer': 'Buildings',
      minzoom: 11,
      filter,
      layout: { visibility: 'visible' },
      paint: {
        'fill-color': heightColor,
        'fill-opacity': buildingOpacityRef.current
      }
    }, firstLabelLayer);

    map.addLayer({
      id: 'building-height-3d',
      type: 'fill-extrusion',
      source: 'buildings',
      'source-layer': 'Buildings',
      minzoom: 11,
      filter,
      layout: { visibility: is3DMode ? 'visible' : 'none' },
      paint: {
        'fill-extrusion-color': heightColor,
        'fill-extrusion-height': ['*', floorExpr, 4],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': buildingOpacityRef.current,
        'fill-extrusion-vertical-gradient': true
      }
    }, firstLabelLayer);

    map.addLayer({
      id: 'building-height-outline',
      type: 'line',
      source: 'buildings',
      'source-layer': 'Buildings',
      minzoom: 11,
      filter,
      layout: { visibility: is3DMode ? 'none' : 'visible' },
      paint: {
        'line-color': heightOutlineColor,
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.3, 15, 0.7, 18, 1.0],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 17, 0.9]
      }
    }, firstLabelLayer);

  }, [activeBuildingHeightCategories, mapReady, is3DMode, selectedWardName, selectedLguName]);

  // Handle Building Floor Area layer (Area × Floor)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    if (!map.getSource('buildings')) return;

    ['building-area-fill', 'building-area-3d', 'building-area-outline'].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });

    if (activeBuildingAreaCategories.length === 0) return;

    // Floor area = footprint area × floor count
    // area_sqm is the footprint area field in WorldBank_Bohol:Buildings
    const footprintExpr: any = [
      'to-number',
      ['coalesce', ['get', 'area_sqm'], 0]
    ];
    const floorAreaExpr: any = [
      '*',
      footprintExpr,
      ['to-number', ['coalesce', ['get', 'floors'], 1]]
    ];

    console.log('🏢 Building Floor Area layer activated - using expression: area_sqm × floors');

    // Build administrative filter
    let adminFilter: any[] = [];
    if (selectedWardName && selectedWardName !== 'all') {
      adminFilter.push(['==', ['get', 'BrgyName'], selectedWardName]);
    } else if (selectedLguName && selectedLguName !== 'all') {
      adminFilter.push(['==', ['get', 'MunName'], selectedLguName]);
    }

    const allCategoryIds = ['small', 'medium', 'large', 'very_large'];
    const allActive = allCategoryIds.every(id => activeBuildingAreaCategories.includes(id));

    // Thresholds in m² (floor area = footprint × floors)
    // Small: < 50 m²  |  Medium: 50–200 m²  |  Large: 200–1000 m²  |  Very Large: ≥ 1000 m²
    const categoryRangeFilters: any[] = [];
    if (activeBuildingAreaCategories.includes('small'))      categoryRangeFilters.push(['<',  floorAreaExpr, 50]);
    if (activeBuildingAreaCategories.includes('medium'))     categoryRangeFilters.push(['all', ['>=', floorAreaExpr, 50],   ['<', floorAreaExpr, 200]]);
    if (activeBuildingAreaCategories.includes('large'))      categoryRangeFilters.push(['all', ['>=', floorAreaExpr, 200],  ['<', floorAreaExpr, 1000]]);
    if (activeBuildingAreaCategories.includes('very_large')) categoryRangeFilters.push(['>=', floorAreaExpr, 1000]);

    let filter: any;
    if (adminFilter.length === 0 && allActive) {
      filter = true;
    } else {
      filter = ['all', ...adminFilter];
      if (!allActive) filter.push(['any', ...categoryRangeFilters]);
    }

    const areaColor: any = [
      'step', floorAreaExpr,
      '#93C5FD',   // < 50 m²:   Small
      50,  '#6EE7B7', // 50–200 m²:  Medium
      200, '#FDE68A', // 200–1000 m²: Large
      1000,'#F9A8D4'  // ≥ 1000 m²:  Very Large
    ];

    const areaOutlineColor: any = [
      'step', floorAreaExpr,
      '#2563EB',   // Small — darker blue
      50,  '#059669', // Medium — darker green
      200, '#D97706', // Large — darker amber
      1000,'#DB2777'  // Very Large — darker pink
    ];

    const firstLabelLayer = getFirstLabelLayerId(map);

    map.addLayer({
      id: 'building-area-fill',
      type: 'fill',
      source: 'buildings',
      'source-layer': 'Buildings',
      minzoom: 11,
      filter,
      layout: { visibility: 'visible' },
      paint: {
        'fill-color': areaColor,
        'fill-opacity': buildingOpacityRef.current
      }
    }, firstLabelLayer);

    map.addLayer({
      id: 'building-area-3d',
      type: 'fill-extrusion',
      source: 'buildings',
      'source-layer': 'Buildings',
      minzoom: 11,
      filter,
      layout: { visibility: is3DMode ? 'visible' : 'none' },
      paint: {
        'fill-extrusion-color': areaColor,
        'fill-extrusion-height': ['*', ['to-number', ['coalesce', ['get', 'floors'], 1]], 4],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': buildingOpacityRef.current,
        'fill-extrusion-vertical-gradient': true
      }
    }, firstLabelLayer);

    map.addLayer({
      id: 'building-area-outline',
      type: 'line',
      source: 'buildings',
      'source-layer': 'Buildings',
      minzoom: 11,
      filter,
      layout: { visibility: is3DMode ? 'none' : 'visible' },
      paint: {
        'line-color': areaOutlineColor,
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.3, 15, 0.7, 18, 1.0],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 17, 0.9]
      }
    }, firstLabelLayer);

  }, [activeBuildingAreaCategories, mapReady, is3DMode, selectedWardName, selectedLguName]);

  return (
    <div 
      data-tutorial="map-canvas"
      className="relative flex-1 h-full bg-[#F1F5F9] transition-all duration-300 ease-in-out" 
      style={{ willChange: 'width', transform: 'translateZ(0)' }}
    >
      {/* MapLibre GL Container */}
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0 w-full h-full"
        style={{ 
          transform: 'translateZ(0)',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />

      {/* Module 1 scenario summary is rendered in the right-side
          ModuleAnalyticsPanel (above "Key Findings") instead of on the
          map canvas, to keep the map area uncluttered. */}

      {/* ─────────────────────────────────────────────────────────────
           UNIFIED MAP LOADING OVERLAY
           Displayed for: initial boot, layer switches, buildings load,
           scenario builder.  Always blocks interaction so users cannot
           queue up more layer changes mid-load.
          ───────────────────────────────────────────────────────────── */}
      {(isLoadingLayers || isBuildingsLoading || isLayerLoading || isScenarioRunning) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto cursor-wait bg-black/20 backdrop-blur-[1.5px]">
          <div className="bg-white/85 backdrop-blur-sm rounded-xl shadow-md px-3 py-2 flex items-center gap-2">
            <div className="relative w-4 h-4 flex-shrink-0">
              <div className="absolute inset-0 border-[2px] border-slate-200 rounded-full" />
              <div className="absolute inset-0 border-[2px] border-[#2563EB] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-[10.5px] font-medium text-slate-600 leading-tight">
              {(isScenarioRunning || activeSewerCategories.length > 0)
                ? SCENARIO_MAP_MSGS[scenarioMsgIdx]
                : isBuildingsLoading ? 'Loading buildings…'
                : isLayerLoading    ? 'Loading layer…'
                :                    'Loading map…'}
            </p>
          </div>
        </div>
      )}

      {/* Zoom Level Indicator */}
      {showZoomIndicator && currentZoom !== undefined && (
        <div className="absolute bottom-14 left-4 z-20 pointer-events-none animate-in fade-in duration-300">
          <div className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm">
            <span className="text-[10px] text-slate-700">Zoom Level: {currentZoom.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* Map Controls - Compact Modern Widget */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
        {/* Location Search and Home Button Row */}
        <div className="flex items-center gap-2">
          <LocationSearch onLocationSelect={onLocationSelect} />
          
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
                  onBasemapChange('light');
                  setBasemapSwitcherOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-xs hover:bg-[#F8FAFC] transition-colors flex items-center gap-2 ${basemap === 'light' ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-slate-700'}`}
              >
                <MapIcon className="w-4 h-4" />
                <span>Grey</span>
              </button>
              <button
                onClick={() => {
                  onBasemapChange('satellite');
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

          {/* 360° Images toggle */}
          <button
            onClick={() => {
              if (onActiveBaseLayersChange) {
                onActiveBaseLayersChange(
                  activeBaseLayers.includes('panorama_images')
                    ? activeBaseLayers.filter(id => id !== 'panorama_images')
                    : [...activeBaseLayers, 'panorama_images']
                );
              }
            }}
            className={`w-8 h-8 backdrop-blur-sm border rounded-md transition-all duration-200 flex items-center justify-center group ${
              activeBaseLayers.includes('panorama_images')
                ? 'bg-[#2563EB] border-[#2563EB] shadow-md'
                : 'bg-white/95 border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#2563EB]'
            }`}
            title={activeBaseLayers.includes('panorama_images') ? 'Hide 360° Images' : 'Show 360° Images'}
          >
            <Camera className={`w-3.5 h-3.5 transition-colors ${
              activeBaseLayers.includes('panorama_images')
                ? 'text-white'
                : 'text-slate-600 group-hover:text-[#2563EB]'
            }`} />
          </button>
        </div>
      </div>

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
          onClose={() => setWardPopupData(null)}
        />
      )}

      {/* Custom Education Popup - React-based, not MapLibre */}
      {educationPopupData && (
        <EducationPopup
          name={educationPopupData.name}
          category={educationPopupData.category}
          categoryType={educationPopupData.categoryType}
          subcategory={educationPopupData.subcategory}
          hhi2025={educationPopupData.hhi2025}
          airAqi={educationPopupData.airAqi}
          floodHazard={educationPopupData.floodHazard}
          multiHazard={educationPopupData.multiHazard}
          x={educationPopupData.x}
          y={educationPopupData.y}
          onClose={() => closeInfrastructurePopupAndZoomBack(setEducationPopupData)}
        />
      )}

      {/* Custom Healthcare Popup - React-based, not MapLibre */}
      {healthcarePopupData && (
        <HealthcarePopup
          name={healthcarePopupData.name}
          category={healthcarePopupData.category}
          categoryType={healthcarePopupData.categoryType}
          subcategory={healthcarePopupData.subcategory}
          hhi2025={healthcarePopupData.hhi2025}
          airAqi={healthcarePopupData.airAqi}
          floodHazard={healthcarePopupData.floodHazard}
          multiHazard={healthcarePopupData.multiHazard}
          x={healthcarePopupData.x}
          y={healthcarePopupData.y}
          onClose={() => closeInfrastructurePopupAndZoomBack(setHealthcarePopupData)}
        />
      )}

      {/* Custom Public Amenities Popup - React-based, not MapLibre */}
      {publicAmenitiesPopupData && (
        <PublicAmenitiesPopup
          name={publicAmenitiesPopupData.name}
          category={publicAmenitiesPopupData.category}
          categoryType={publicAmenitiesPopupData.categoryType}
          subcategory={publicAmenitiesPopupData.subcategory}
          hhi2025={publicAmenitiesPopupData.hhi2025}
          airAqi={publicAmenitiesPopupData.airAqi}
          floodHazard={publicAmenitiesPopupData.floodHazard}
          multiHazard={publicAmenitiesPopupData.multiHazard}
          x={publicAmenitiesPopupData.x}
          y={publicAmenitiesPopupData.y}
          onClose={() => closeInfrastructurePopupAndZoomBack(setPublicAmenitiesPopupData)}
        />
      )}

      {/* Custom Transport Popup - React-based, not MapLibre */}
      {transportPopupData && (
        <TransportPopup
          name={transportPopupData.name}
          category={transportPopupData.category}
          categoryType={transportPopupData.categoryType}
          subcategory={transportPopupData.subcategory}
          hhi2025={transportPopupData.hhi2025}
          airAqi={transportPopupData.airAqi}
          floodHazard={transportPopupData.floodHazard}
          multiHazard={transportPopupData.multiHazard}
          x={transportPopupData.x}
          y={transportPopupData.y}
          onClose={() => closeInfrastructurePopupAndZoomBack(setTransportPopupData)}
        />
      )}

      {/* Custom Road Safety Popup - React-based, not MapLibre */}
      {roadSafetyPopupData && (
        <RoadSafetyPopup
          roadName={roadSafetyPopupData.roadName}
          section={roadSafetyPopupData.section}
          distance={roadSafetyPopupData.distance}
          vehicleRating={roadSafetyPopupData.vehicleRating}
          motorcycleRating={roadSafetyPopupData.motorcycleRating}
          bicycleRating={roadSafetyPopupData.bicycleRating}
          pedestrianRating={roadSafetyPopupData.pedestrianRating}
          codingLink={roadSafetyPopupData.codingLink}
          x={roadSafetyPopupData.x}
          y={roadSafetyPopupData.y}
          onClose={closeRoadSafetyPopupAndZoomBack}
        />
      )}

      {/* Custom Building Popup - React-based, not MapLibre */}
      {buildingPopupData && (
        <BuildingPopup
          useType={buildingPopupData.useType}
          useSub={buildingPopupData.useSub}
          bldgName={buildingPopupData.bldgName}
          barangay={buildingPopupData.barangay}
          municipality={buildingPopupData.municipality}
          floors={buildingPopupData.floors}
          heightM={buildingPopupData.heightM}
          areaSqm={buildingPopupData.areaSqm}
          sewerFeas={buildingPopupData.sewerFeas}
          showSewerZone={(activeSewerCategories ?? []).length > 0}
          x={buildingPopupData.x}
          y={buildingPopupData.y}
          onClose={() => {
            // Clear selected building highlight
            if (mapRef.current && selectedBuildingIdRef.current !== null) {
              mapRef.current.setFeatureState(
                { source: 'buildings', sourceLayer: 'Buildings', id: selectedBuildingIdRef.current },
                { hover: false }
              );
              selectedBuildingIdRef.current = null;
            }
            setBuildingPopupData(null);
          }}
        />
      )}

      {/* 360° Panorama Viewer Modal - Full-screen overlay */}
      {panoramaViewerData && (
        <PanoramaViewerModal
          imageUrl={panoramaViewerData.imageUrl}
          title={panoramaViewerData.title}
          description={panoramaViewerData.description}
          thumbnail={panoramaViewerData.thumbnail}
          onClose={() => setPanoramaViewerData(null)}
        />
      )}

      {/* Panorama pin hover label — React DOM, follows mouse, no flicker */}
      {panoramaHoverLabel && (
        <div
          className="absolute z-40 pointer-events-none select-none"
          style={{
            left     : panoramaHoverLabel.x,
            top      : panoramaHoverLabel.y - 14,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div style={{
            background  : 'rgba(15,23,42,0.88)',
            color       : '#fff',
            padding     : '5px 12px',
            borderRadius: '8px',
            fontSize    : '12px',
            fontWeight  : '600',
            fontFamily  : 'Inter, system-ui, sans-serif',
            whiteSpace  : 'nowrap',
            boxShadow   : '0 2px 10px rgba(0,0,0,0.35)',
            letterSpacing: '0.01em',
          }}>
            {panoramaHoverLabel.title}
          </div>
        </div>
      )}

      {/* Custom Attribution Control - Fixed position at bottom right */}
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
            maxWidth: attributionOpen ? '760px' : '0px',
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
              marginRight: '4px'
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

      {/* Floating Legend Panel and other overlays */}
      {children}

      {/* Print Layout Modal */}
      {showPrintLayout && printMapState && (
        <PrintLayout
          mapState={printMapState}
          onClose={() => setShowPrintLayout(false)}
        />
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
      console.log('🏷️  Found first label layer:', layer.id);
      return layer.id;
    }
  }
  
  console.log('⚠️  No label layers found in basemap');
  return undefined;
}

// Helper function to find the first basemap layer that is NOT a road, building, or other detail layer
// This ensures hazard layers go ABOVE all basemap detail layers but BELOW labels
function getFirstBasemapDetailLayerId(map: maplibregl.Map): string | undefined {
  if (!map || !map.getStyle || !map.getStyle()) {
    return undefined;
  }
  
  const style = map.getStyle();
  const layers = style?.layers;
  if (!layers) return undefined;
  
  // Find the first layer that looks like a road, building, or detail layer in the basemap
  // Common Carto basemap layer IDs include: road, highway, street, building, etc.
  for (const layer of layers) {
    const layerId = layer.id.toLowerCase();
    // Check if this is a road/building/detail layer from the basemap
    if (layerId.includes('road') || 
        layerId.includes('highway') || 
        layerId.includes('street') ||
        layerId.includes('building') ||
        layerId.includes('bridge') ||
        layerId.includes('tunnel') ||
        layerId.includes('ferry') ||
        layerId.includes('path')) {
      console.log('🛣️  Found first basemap detail layer:', layer.id);
      return layer.id;
    }
  }
  
  console.log('⚠️  No basemap detail layers found, using label fallback');
  return getFirstLabelLayerId(map);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔒🔒🔒 STRICT LAYER ORDER SYSTEM - FROZEN AND LOCKED - DO NOT MODIFY 🔒🔒🔒
// ═══════════════════════════════════════════════════════════════════════════════
// This defines the ABSOLUTE, UNCHANGEABLE layer order for the entire application.
// Priority numbers are spaced by 100 to allow for future insertions within groups.
// 
// ⚠️ THIS ORDER IS FINAL AND MUST NOT BE CHANGED WITHOUT EXPLICIT APPROVAL ⚠️
// ═════════════════════════════════════════════════════════════════════════════��═

const LAYER_ORDER_PRIORITY = {
  // ═══ TIER 9: BASEMAP LABELS (TOP - Always Visible) ═══
  BASEMAP_LABELS: 900,

  // ═══ TIER 8.5: TOURISM POINTS (Just below basemap labels, on top of everything else) ═══
  TOURISM_POINTS: 850,
  TOURISM_CLUSTERS: 220, // Cluster polygons: above hazard layers, below buildings
  
  // ═══ TIER 9.5: ADMINISTRATIVE LABELS (Absolute Top - Always Visible) ═══
  MUNICIPAL_LABELS: 950, // Municipal labels on top (higher administrative level)
  WARD_LABELS: 940, // Ward/Barangay labels below municipal labels

  // ═══ TIER 9.9: FSTP LOCATION POINTS (Always on top — above all labels and symbols) ═══
  FSTP_LOCATIONS: 990,

  // ═══ TIER 9.8: SCENARIO ZONE LABELS (Above everything — always readable) ═══
  SCENARIO_ZONE_LABELS: 980,
  
  // ═══ TIER 8: ROAD SAFETY (Highest Priority Data) ═══
  ROAD_SAFETY: 800,
  ROAD_SAFETY_HITAREA: 790, // Invisible click targets below visible lines
  
  // ═══ TIER 7: INFRASTRUCTURE POINTS (Clustered POIs) ═══
  INFRASTRUCTURE_CLUSTERS: 700,
  INFRASTRUCTURE_UNCLUSTERED: 690,
  
  // ═══ TIER 6.5: WATERSHED (Above all boundaries and features) 🔒 LOCKED ═══
  WATERSHED: 670, // Watershed & watershed labels on top of municipal and ward boundaries
  
  // ═══ TIER 6: ADMINISTRATIVE BOUNDARIES (Administrative Divisions) ═══
  MUNICIPAL_BOUNDARY: 660, // Municipal boundary above ward boundary
  WARD_HIGHLIGHT: 640,
  WARD_OUTLINE: 630,
  WARD_FILL: 620,
  
  // ═══ TIER 5.1: 3D BUILDINGS (Above roads in 3D mode) ═══
  BUILDINGS_3D: 615, // 3D buildings appear above road network when extruded
  BUILDINGS_HIGHLIGHT: 614, // Building highlight should also be above roads

  // ═══ TIER 5.15: FSTP BUILDING COVERAGE OVERLAY (above FSTP band polygons, below road network) ═══
  FSTP_BUILDING_OVERLAY: 612,
  FSTP_BUILDING_OVERLAY_3D: 613, // 3D extrusion version — just above 2D fill

  // ═══ TIER 5.16: FLEET ACCESSIBILITY OVERLAY (above FSTP building overlay) ═══
  FLEET_ACCESS_OVERLAY: 616,
  
  // ═══ TIER 5: ROAD NETWORK (Transportation Infrastructure - including basemap roads) 🔒 LOCKED ═══
  ROAD_NETWORK: 610, // All road network layers (custom + basemap roads)
  ROAD_QUERY_SEGMENTS: 605, // Road query result segments (highlighted roads below road network)
  WATERBODY: 600, // Waterbody below road network and above hazard layers
  
  // ═══ TIER 4: SLUM SETTLEMENTS (Informal Areas) ═��═
  SLUM_SETTLEMENTS: 400,
  
  // ═══ TIER 3: 2D BUILDINGS (Urban Structure - below roads) ═══
  BUILDINGS_2D: 330,
  BUILDINGS_FILL: 320,
  
  // ═══ TIER 2.5: SCENARIO GRID OVERLAY (Module 1 — above hazard, below buildings) ═══
  SCENARIO_GRID: 250,

  // ═══ TIER 2: HAZARD LAYERS (Climate Risk - One at a Time) ═══
  HAZARD_LAYERS: 200,
  
  // ═══ TIER 1.5: BASE DATA LAYERS (Elevation, Green Cover, Built-up - Below All Boundaries) ═══
  BASE_DATA_LAYERS: 150, // Elevation, green_cover, built_up - below administrative boundaries
  
  // ═══ TIER 1.2: BASEMAP DETAIL (Non-road basemap features like buildings) 🔒 LOCKED ═══
  BASEMAP_DETAIL: 100, // Basemap buildings and other non-road details
  
  // ═══ TIER 1: BASEMAP (Foundation) ═══
  BASEMAP_BASE: 0,     // Background, landuse, base layers

  // ═══ TIER 0.5: 3D HILLSHADE (Between basemap and data layers) ═══
  HILLSHADE: 50,       // Terrain hillshade — displayed above basemap, below all data layers
} as const;

/**
 * 🔒 LOCKED FUNCTION - DO NOT MODIFY WITHOUT EXPLICIT APPROVAL
 * ═══════════════════════════════════════════════════════════════════════════════
 * Determines the priority tier for a given layer ID and type
 * Higher numbers = higher in the stack (closer to user)
 * 
 * 🔒 CRITICAL LOCKED FUNCTIONALITY:
 * - layerType parameter ensures ALL basemap symbol layers (road names, etc.) get top priority
 * - isOurCustomLayer detection prevents our data layers from being treated as basemap labels
 * - This system ensures road names and ALL basemap text labels appear on top of GeoServer layers
 * 
 * ⚠️ DO NOT CHANGE THIS FUNCTION WITHOUT EXPLICIT APPROVAL FROM CLIENT
 * ═══════════════════════════════════��═══════════════════════════════════════════
 */
function getLayerPriority(layerId: string, layerType?: string): number {
  const id = layerId.toLowerCase();
  
  // 🔒 LOCKED: TIER 9 Basemap Labels (TOP) - Symbol layers and explicit label layers
  // CRITICAL: This must be FIRST to ensure labels are always on top
  if (layerId === 'labels' || layerId === 'satellite-labels') {
    return LAYER_ORDER_PRIORITY.BASEMAP_LABELS;
  }

  // TIER 8.5: Tourism layers — point layers ride high (just below labels), cluster polygons sit lower
  if (id.startsWith('tourism-')) {
    if (id.startsWith('tourism-cluster-')) return LAYER_ORDER_PRIORITY.TOURISM_CLUSTERS;
    return LAYER_ORDER_PRIORITY.TOURISM_POINTS;
  }
  
  // 🔒 LOCKED: Custom layer detection - DO NOT MODIFY
  // Check if this is our custom data layer - exclude these from being basemap labels
  const isOurCustomLayer = (
    id.startsWith('ward-') || 
    id.startsWith('fstp-service-') ||
    id.startsWith('fstp-locations-') ||
    id.startsWith('fstp-band-') ||
    id.startsWith('fstp-bldg-band-') || // includes both fill (fstp-bldg-band-*) and extrusion (fstp-bldg-band-3d-*)
    id.startsWith('fleet-access-bldg-') || // Fleet accessibility overlay (Module 3)
    id.startsWith('education-') || 
    id.startsWith('healthcare-') || 
    id.startsWith('public-amenities-') || 
    id.startsWith('transport-') || 
    id.startsWith('irap_') ||
    id.startsWith('road-safety-') ||
    id.startsWith('query-road-segments') ||
    id.startsWith('heat_') ||
    id.startsWith('air_') ||
    id.startsWith('flood_') ||
    id.startsWith('multihazard_') ||
    id.startsWith('multi-hazard-') ||
    id.startsWith('slum_') ||
    id.startsWith('waterbody') ||
    id.startsWith('watershed') ||
    id === 'watershed-labels' ||
    id === 'drainage' ||
    id.startsWith('buildings') ||
    id.startsWith('road_network') ||
    id.startsWith('geoserver-') ||
    id.startsWith('wms-') ||
    id === 'elevation' ||
    id === 'builtup_density' ||
    id === 'built_up' ||
    id === 'ndvi' ||
    id.startsWith('builtup-density-') ||
    id.startsWith('grid-sewer-') ||
    id.startsWith('scenario-grid') && id !== 'scenario-grid-labels' ||
    id === '3d-hillshade' ||
    id.startsWith('panorama-pins') ||
    id.startsWith('tourism-')
  );
  
  // 🔒 LOCKED: Basemap symbol layer detection - DO NOT MODIFY
  // ALL symbol layers from basemap (not our custom layers) should be on top
  // This includes road names, place names, POIs, and all other text labels
  if (!isOurCustomLayer && layerType === 'symbol') {
    console.log(`   🏷️ Basemap symbol layer detected: ${layerId} → Priority ${LAYER_ORDER_PRIORITY.BASEMAP_LABELS}`);
    return LAYER_ORDER_PRIORITY.BASEMAP_LABELS;
  }
  
  // 🔒 LOCKED: Label keyword detection - DO NOT MODIFY
  // Also catch layers with label/text keywords in their name
  if (!isOurCustomLayer && 
      (id.includes('label') || id.includes('text') || id.includes('place') || 
       id.includes('poi'))) {
    return LAYER_ORDER_PRIORITY.BASEMAP_LABELS;
  }
  
  // TIER 8: Road Safety
  if (id.startsWith('irap_')) {
    if (id.includes('hitarea')) {
      return LAYER_ORDER_PRIORITY.ROAD_SAFETY_HITAREA;
    }
    return LAYER_ORDER_PRIORITY.ROAD_SAFETY;
  }
  
  // TIER 7: 360° Panorama Pins (just above other infrastructure points)
  if (id.startsWith('panorama-pins')) {
    return LAYER_ORDER_PRIORITY.INFRASTRUCTURE_CLUSTERS + 5; // 705
  }

  // TIER 7: Infrastructure Points
  if (id.startsWith('education-') || id.startsWith('healthcare-') || 
      id.startsWith('public-amenities-') || id.startsWith('transport-')) {
    if (id.includes('unclustered')) {
      return LAYER_ORDER_PRIORITY.INFRASTRUCTURE_UNCLUSTERED;
    }
    return LAYER_ORDER_PRIORITY.INFRASTRUCTURE_CLUSTERS;
  }

  // TIER 9.9: FSTP location points — always on top of all layers and basemap labels
  if (id.startsWith('fstp-locations-')) {
    return LAYER_ORDER_PRIORITY.FSTP_LOCATIONS;
  }

  // TIER 5.16: Fleet accessibility building overlay
  if (id.startsWith('fleet-access-bldg-')) {
    return LAYER_ORDER_PRIORITY.FLEET_ACCESS_OVERLAY;
  }

  // TIER 5.5: FSTP service area polygons (between hazard layers and ward boundaries)
  if (id.startsWith('fstp-service-') || id.startsWith('fstp-band-')) {
    return LAYER_ORDER_PRIORITY.WATERBODY + 5; // just above waterbody
  }

  // TIER 5.15: FSTP building coverage (above FSTP band polygons)
  if (id === 'fstp-building-coverage-circles' || id.startsWith('fstp-bldg-band-')) {
    return id.includes('-3d-') ? LAYER_ORDER_PRIORITY.FSTP_BUILDING_OVERLAY_3D : LAYER_ORDER_PRIORITY.FSTP_BUILDING_OVERLAY;
  }
  
  // TIER 6.5: Watershed (above all boundaries) - includes watershed boundary, drainage, and labels
  if (id === 'watershed' || id.startsWith('watershed') || id === 'drainage') {
    return LAYER_ORDER_PRIORITY.WATERSHED;
  }
  
  // TIER 6.5: Watershed labels (same priority as watershed layer)
  if (id === 'watershed-labels') {
    return LAYER_ORDER_PRIORITY.WATERSHED;
  }
  
  // TIER 6: Administrative Boundaries (Municipal and Ward)
  if (id === 'municipal-boundary' || id === 'municipal-boundary-border' || id.includes('municipal')) {
    if (id.includes('label')) return LAYER_ORDER_PRIORITY.MUNICIPAL_LABELS;
    return LAYER_ORDER_PRIORITY.MUNICIPAL_BOUNDARY;
  }
  
  if (id.startsWith('ward-') || id === 'ward' || id.includes('ward')) {
    if (id.includes('label')) return LAYER_ORDER_PRIORITY.WARD_LABELS;
    if (id.includes('highlight')) return LAYER_ORDER_PRIORITY.WARD_HIGHLIGHT;
    if (id.includes('outline') || id.includes('boundaries-line')) return LAYER_ORDER_PRIORITY.WARD_OUTLINE;
    if (id.includes('fill') || id === 'ward-boundaries-fill') return LAYER_ORDER_PRIORITY.WARD_FILL;
    return LAYER_ORDER_PRIORITY.WARD_FILL; // Default for ward layers
  }
  
  // TIER 5.5: Waterbody (below ward boundary, above hazard layers)
  if (id === 'waterbody' || id.startsWith('waterbody')) {
    return LAYER_ORDER_PRIORITY.WATERBODY;
  }
  
  // TIER 5: Road Network (including basemap roads)
  if (id.startsWith('road_network')) {
    return LAYER_ORDER_PRIORITY.ROAD_NETWORK;
  }
  
  // TIER 5: Road Query Segments (highlighted roads from query results)
  if (id === 'query-road-segments-layer' || id.includes('query-road-segments')) {
    return LAYER_ORDER_PRIORITY.ROAD_QUERY_SEGMENTS;
  }
  
  // TIER 4: Slum Settlements
  if (id.startsWith('slum_')) {
    return LAYER_ORDER_PRIORITY.SLUM_SETTLEMENTS;
  }
  
  // TIER 3: Buildings
  if (id.startsWith('buildings-') || id === 'buildings') {
    if (id.includes('highlight')) return LAYER_ORDER_PRIORITY.BUILDINGS_HIGHLIGHT;
    if (id.includes('3d')) return LAYER_ORDER_PRIORITY.BUILDINGS_3D;
    if (id === 'buildings') return LAYER_ORDER_PRIORITY.BUILDINGS_2D;
    if (id.includes('fill')) return LAYER_ORDER_PRIORITY.BUILDINGS_FILL;
    return LAYER_ORDER_PRIORITY.BUILDINGS_2D; // Default for building layers
  }
  
  // TIER 2: Hazard Layers (including CWIS climate hazard layers)
  if (id.startsWith('heat_') || id.startsWith('air_') || id.startsWith('flood_') || 
      id.startsWith('multihazard_') || id.startsWith('multi-hazard-') ||
      id === 'storm_surge' || id === 'urban_waterlogging' || 
      id === 'heat_stress_index' || id === 'land_surface_temperature' || id === 'urban_heat_island' || 
      id === 'wet_bulb_temperature') {
    return LAYER_ORDER_PRIORITY.HAZARD_LAYERS;
  }
  
  // TIER 9.8: Scenario zone labels — always on top of everything
  if (id === 'scenario-grid-labels') {
    return LAYER_ORDER_PRIORITY.SCENARIO_ZONE_LABELS;
  }

  // TIER 2.5: Scenario Grid Overlay (Module 1 suitability grid)
  if (id.startsWith('scenario-grid')) {
    return LAYER_ORDER_PRIORITY.SCENARIO_GRID;
  }

  // TIER 1.5: Base Data Layers (elevation, builtup_density, built_up, ndvi - below all boundaries)
  if (id === 'elevation' || id === 'builtup_density' || id === 'built_up' || id === 'ndvi' ||
      id.startsWith('builtup-density-') || id.startsWith('grid-sewer-')) {
    return LAYER_ORDER_PRIORITY.BASE_DATA_LAYERS;
  }

  // TIER 0.5: 3D Hillshade (between basemap and data layers)
  if (id === '3d-hillshade') {
    return LAYER_ORDER_PRIORITY.HILLSHADE;
  }
  
  // TIER 1.2: Basemap Detail (non-road basemap features like buildings)
  if (id.includes('building')) {
    return LAYER_ORDER_PRIORITY.BASEMAP_DETAIL;
  }
  
  // TIER 5: Basemap Road Network (same priority as custom road network)
  if (id.includes('road') || id.includes('highway') || id.includes('street') ||
      id.includes('bridge') || id.includes('tunnel') ||
      id.includes('ferry') || id.includes('path')) {
    return LAYER_ORDER_PRIORITY.ROAD_NETWORK;
  }
  
  // Default: Base basemap layer
  return LAYER_ORDER_PRIORITY.BASEMAP_BASE;
}

/**
 * 🔒 STRICT BUILDINGS VERIFICATION FUNCTION
 * Verifies that buildings are actually loaded, visible, and rendered before hiding loading indicator.
 * Returns true if buildings are fully ready, false otherwise.
 */
function verifyBuildingsAreActuallyVisible(map: maplibregl.Map): boolean {
  console.log('🔍 Starting buildings verification...');
  
  if (!map || !map.getSource || !map.getLayer || typeof map.getSource !== 'function') {
    console.log('❌ Buildings verification failed: Map not available');
    return false;
  }
  
  // Check 1: Source exists
  let buildingsSource: maplibregl.GeoJSONSource | null = null;
  try {
    buildingsSource = map.getSource('buildings') as maplibregl.GeoJSONSource;
    if (!buildingsSource) {
      console.log('❌ Buildings verification failed: Source does not exist');
      return false;
    }
    console.log('  ✓ Source exists');
  } catch (error) {
    console.log('❌ Buildings verification failed: Error accessing source', error);
    return false;
  }
  
  // Check 2: All layers exist
  const buildingsLayer = map.getLayer('buildings');
  const buildingsFillLayer = map.getLayer('buildings-fill');
  const buildings3DLayer = map.getLayer('buildings-3d');
  const buildingsHighlightLayer = map.getLayer('buildings-highlight');
  
  if (!buildingsLayer || !buildingsFillLayer || !buildings3DLayer || !buildingsHighlightLayer) {
    console.log('❌ Buildings verification failed: One or more layers missing', {
      buildings: !!buildingsLayer,
      buildingsFill: !!buildingsFillLayer,
      buildings3D: !!buildings3DLayer,
      buildingsHighlight: !!buildingsHighlightLayer
    });
    return false;
  }
  console.log('  ✓ All 4 layers exist');
  
  // Check 3: At least one layer is visible (either 2D or 3D mode)
  const fillVisible = map.getLayoutProperty('buildings-fill', 'visibility') === 'visible';
  const threeDVisible = map.getLayoutProperty('buildings-3d', 'visibility') === 'visible';
  
  console.log(`  ℹ️  Layer visibility: fill=${fillVisible}, 3D=${threeDVisible}`);
  
  if (!fillVisible && !threeDVisible) {
    console.log('❌ Buildings verification failed: All layers are hidden');
    return false;
  }
  console.log('  ✓ At least one layer is visible');
  
  // Check 4: Map style is loaded (more lenient than full map.loaded())
  try {
    const style = map.getStyle();
    if (!style || !style.layers) {
      console.log('❌ Buildings verification failed: Map style not ready');
      return false;
    }
  } catch (e) {
    console.log('❌ Buildings verification failed: Error checking map style');
    return false;
  }
  console.log('  ✓ Map style is ready');
  
  console.log('✅ Buildings verification PASSED: All checks complete');
  return true;
}

/**
 * 🔒 MASTER LAYER ORDERING ENFORCEMENT FUNCTION
 * This function MUST be called after ANY layer is added or when layer order needs verification.
 * It ensures the strict layer order is ALWAYS maintained, regardless of how layers were added.
 */
function enforceStrictLayerOrder(map: maplibregl.Map) {
  if (!map || !map.getStyle || !map.getStyle()) {
    console.log('⏳ Map style not loaded, skipping layer order enforcement');
    return;
  }
  
  const style = map.getStyle();
  const layers = style?.layers;
  if (!layers || layers.length === 0) {
    console.log('⏳ No layers in map style, skipping layer order enforcement');
    return;
  }
  
  console.log('🔒 ENFORCING STRICT LAYER ORDER - Starting...');
  
  // 🏷️ WARD LABELS TRACKER - Check before layer order enforcement
  const wardLabelsBefore = map.getLayer('ward-labels');
  console.log('🏷️ WARD LABELS TRACKER - Before layer order enforcement');
  console.log(`  Layer exists: ${wardLabelsBefore ? '✓ YES' : '✗ NO'}`);
  if (wardLabelsBefore) {
    const currentLayers = map.getStyle()?.layers?.map(l => l.id) || [];
    const wardLabelsIndex = currentLayers.indexOf('ward-labels');
    console.log(`  Current position: ${wardLabelsIndex} of ${currentLayers.length}`);
  }
  
  // 🔒 LOCKED: Step 1 - Collect all layers with their priorities
  // CRITICAL: layer.type parameter is REQUIRED for basemap symbol layer detection
  const layersWithPriority = layers.map(layer => ({
    id: layer.id,
    priority: getLayerPriority(layer.id, layer.type), // 🔒 DO NOT REMOVE layer.type parameter
    type: layer.type
  }));
  
  // Step 2: Sort by priority (lowest to highest)
  layersWithPriority.sort((a, b) => a.priority - b.priority);
  
  // Step 3: Log the intended order
  console.log('📊 Target layer order (bottom to top):');
  const priorityGroups: { [key: number]: string[] } = {};
  layersWithPriority.forEach(({ id, priority }) => {
    if (!priorityGroups[priority]) {
      priorityGroups[priority] = [];
    }
    priorityGroups[priority].push(id);
  });
  
  Object.entries(priorityGroups)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .forEach(([priorityStr, ids]) => {
      const priority = Number(priorityStr);
      const tierName = Object.entries(LAYER_ORDER_PRIORITY).find(([_, val]) => val === priority)?.[0] || 'UNKNOWN';
      console.log(`   Priority ${priority} (${tierName}): ${ids.join(', ')}`);
    });
  
  // Step 4: Move layers into correct order
  // We need to move layers from top to bottom (highest priority first)
  // This ensures each layer ends up in the correct position
  for (let i = layersWithPriority.length - 1; i >= 0; i--) {
    const currentLayer = layersWithPriority[i];
    
    // Find the layer that should be immediately before this one
    let beforeLayerId: string | undefined = undefined;
    if (i < layersWithPriority.length - 1) {
      beforeLayerId = layersWithPriority[i + 1].id;
    }
    
    try {
      if (map.getLayer(currentLayer.id)) {
        if (beforeLayerId && map.getLayer(beforeLayerId)) {
          map.moveLayer(currentLayer.id, beforeLayerId);
        } else if (!beforeLayerId) {
          // Move to absolute top
          map.moveLayer(currentLayer.id);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not move layer ${currentLayer.id}:`, error);
    }
  }
  
  console.log('✅ STRICT LAYER ORDER ENFORCED - Complete!');
  
  // Step 5: Verify final order
  const finalLayers = map.getStyle().layers?.map(l => l.id) || [];
  console.log('📊 Final layer order:', finalLayers);
  
  // 🏷️ WARD LABELS TRACKER - Check after layer order enforcement
  const wardLabelsAfter = map.getLayer('ward-labels');
  console.log('🏷️ WARD LABELS TRACKER - After layer order enforcement');
  console.log(`  Layer exists: ${wardLabelsAfter ? '✓ YES' : '⏳ NOT YET (loading asynchronously...)'}`);
  if (wardLabelsAfter) {
    const wardLabelsIndex = finalLayers.indexOf('ward-labels');
    const visibility = map.getLayoutProperty('ward-labels', 'visibility');
    console.log(`  Final position: ${wardLabelsIndex} of ${finalLayers.length} (should be near top)`);
    console.log(`  Visibility: ${visibility}`);
  } else {
    console.log('  ℹ️ Ward labels will appear once Barangay_Boundary_Point WFS request completes');
  }
}

/**
 * Identifies if a layer is one of our custom data layers (vs basemap layers)
 * Used during basemap switching to preserve our data while removing basemap
 */
function isDataLayer(layerId: string): boolean {
  const id = layerId.toLowerCase();
  
  const ourLayerPatterns = [
    'ward-',                    // ward-boundary-fill, ward-boundary-outline
    'ward',                     // ward-boundaries-fill (exact match)
    'education-',               // education-marker-*
    'healthcare-',              // healthcare-marker-*
    'public-amenities-',        // public-amenities-marker-*
    'transport-',               // transport-marker-*
    'road_network',             // road_network_link, road_network_major (underscore!)
    'road-safety-',             // road-safety-*
    'query-road-segments',      // query-road-segments-layer (query results)
    'buildings',                // buildings source AND buildings-3d, buildings-fill, buildings-highlight layers
    'heat_',                    // heat_hhi, heat_lst, heat_ast (underscore!)
    'air_',                     // air_aqi, air_co, air_no2 (underscore!)
    'flood_',                   // flood_fhi (underscore!)
    'multihazard_',             // multihazard_assessment (underscore!)
    'multi-hazard-',            // multi-hazard layers (hyphen)
    'slum_',                    // slum_settlements (underscore!)
    'waterbody',                // waterbody layer
    'watershed',                // watershed layer and watershed-labels
    'infrastructure-',          // infrastructure layers
    'geoserver-',               // GeoServer WMS layers
    'wms-',                     // WMS layers
    'irap_',                    // IRAP road safety layers (underscore!)
    'builtup_density',           // builtup_density
    'builtup-density-',          // builtup-density-fill, builtup-density-outline
    'grid-sewer-',               // grid-sewer-fill, grid-sewer-outline (Module 1)
    'scenario-grid-',            // scenario-grid-fill, scenario-grid-outline (Module 1 Scenario Creator)
    'built_up',                 // built_up
    'fstp-service-',             // fstp-service-fill, fstp-service-outline (Module 3)
    'fstp-locations-',           // fstp-locations-circle, fstp-locations-label (Module 3)
    'fstp-band-',                // fstp-band-fill-*, fstp-band-outline-* (Module 3 priority bands)
    'fstp-building-coverage',    // fstp-building-coverage-circles (legacy, kept for safety)
    'fstp-bldg-band-',           // fstp-bldg-band-* (2D fill) and fstp-bldg-band-3d-* (3D extrusion)
    'tourism-',                  // tourism clusters, sites, assets, hover layers
  ];
  
  return ourLayerPatterns.some(pattern => id.startsWith(pattern));
}

// Helper function to ensure basemap detail layers (roads, buildings) are BELOW hazard layers
function moveBasemapDetailLayersToBottom(map: maplibregl.Map, beforeLayerId: string) {
  // CRITICAL: Check if map has a style loaded
  if (!map.getStyle()) {
    console.log('⚠️ Map style not loaded yet, skipping basemap detail layer reordering');
    return;
  }
  
  const style = map.getStyle();
  const layers = style?.layers;
  
  if (!layers) {
    console.log('⚠��� Map style has no layers yet, skipping basemap detail layer reordering');
    return;
  }
  
  // CRITICAL: Check if the target layer (beforeLayerId) actually exists before attempting to move layers
  if (!map.getLayer(beforeLayerId)) {
    console.log(`⚠️ Target layer "${beforeLayerId}" does not exist, skipping basemap detail layer reordering`);
    return;
  }
  
  console.log('🔧 Moving basemap detail layers (roads, buildings) BELOW hazard layers');
  
  // Find all basemap detail layers (roads, buildings, bridges, etc.)
  const basemapDetailLayers: string[] = [];
  layers.forEach((layer) => {
    const layerId = layer.id.toLowerCase();
    // Identify basemap detail layers (but NOT our custom layers and NOT labels)
    const isBasemapDetail = (
      layerId.includes('road') || 
      layerId.includes('highway') || 
      layerId.includes('street') ||
      layerId.includes('building') ||
      layerId.includes('bridge') ||
      layerId.includes('tunnel') ||
      layerId.includes('ferry') ||
      layerId.includes('path')
    );
    
    // Exclude our custom layers
    const isCustomLayer = (
      layerId.includes('ward') || 
      layerId.includes('education') || 
      layerId.includes('healthcare') ||
      layerId.includes('public-amenities') ||
      layerId.includes('transport') ||
      layerId.includes('irap') ||
      layerId.includes('road_network')
    );
    
    // Exclude label layers (we want labels on top)
    const isLabel = layer.type === 'symbol' || layerId.includes('label');
    
    if (isBasemapDetail && !isCustomLayer && !isLabel) {
      basemapDetailLayers.push(layer.id);
    }
  });
  
  // Move each basemap detail layer BEFORE the hazard layer (below it)
  basemapDetailLayers.forEach((layerId) => {
    try {
      map.moveLayer(layerId, beforeLayerId);
      console.log(`✅ Moved basemap detail layer BELOW hazard: ${layerId} → before ${beforeLayerId}`);
    } catch (error) {
      console.warn(`⚠️ Could not move layer ${layerId}:`, error);
    }
  });
  
  if (basemapDetailLayers.length === 0) {
    console.log('ℹ️  No basemap detail layers found to reorder');
  }
}

// 🔒 LOCKED FUNCTION - DO NOT MODIFY WITHOUT EXPLICIT APPROVAL
// ═══════════════════════════════════════════════════════════════════════════════
// Helper function to move all basemap labels to the top
// 
// 🔒 CRITICAL LOCKED FUNCTIONALITY:
// - Detects ALL symbol layers from Carto basemap (including road names)
// - Excludes our custom data layers from being moved
// - Ensures all basemap text labels render on top of GeoServer layers
// 
// ⚠️ DO NOT CHANGE THIS FUNCTION WITHOUT EXPLICIT APPROVAL FROM CLIENT
// ═══════════════════════════════════════════════════════════════════════════════
function moveBasemapLabelsToTop(map: maplibregl.Map) {
  // CRITICAL: Check if map has a style loaded
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
  
  console.log('🏷️ Moving ALL basemap text labels (including road names) to top...');
  
  // 🔒 LOCKED: Collect all basemap label layers
  const basemapLabelLayers: string[] = [];
  
  layers.forEach((layer) => {
    const id = layer.id.toLowerCase();
    
    // 🔒 LOCKED: Custom layer detection - DO NOT MODIFY
    // Check if this is our custom data layer - exclude these
    const isOurCustomLayer = (
      id.startsWith('ward-') || 
      id.startsWith('education-') || 
      id.startsWith('healthcare-') || 
      id.startsWith('public-amenities-') || 
      id.startsWith('transport-') || 
      id.startsWith('irap_') ||
      id.startsWith('road-safety-') ||
      id.startsWith('heat_') ||
      id.startsWith('air_') ||
      id.startsWith('flood_') ||
      id.startsWith('multihazard_') ||
      id.startsWith('multi-hazard-') ||
      id.startsWith('slum_') ||
      id.startsWith('buildings') ||
      id.startsWith('road_network') ||
      id.startsWith('geoserver-') ||
      id.startsWith('wms-') ||
      id.startsWith('tourism-')
    );
    
    // If it's our custom layer, skip it
    if (isOurCustomLayer) {
      return;
    }
    
    // 🔒 LOCKED: Capture ALL basemap label layers - DO NOT MODIFY
    // 1. Explicit label raster layers (satellite basemap)
    if (layer.id === 'labels' || layer.id === 'satellite-labels') {
      basemapLabelLayers.push(layer.id);
    }
    // 2. 🔒 CRITICAL: ALL symbol/text layers from basemap (these include road names, place names, POIs, etc.)
    else if (layer.type === 'symbol') {
      basemapLabelLayers.push(layer.id);
      console.log(`   🏷️ Found basemap symbol layer: ${layer.id}`);
    }
    // 3. Any raster layers with label/text in their name
    else if (id.includes('label') || id.includes('text')) {
      basemapLabelLayers.push(layer.id);
      console.log(`   🏷️ Found basemap label layer: ${layer.id}`);
    }
  });
  
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
  
  // CRITICAL: Move ward labels to ABSOLUTE TOP (above basemap labels)
  // This ensures ward labels are always visible at z-index 950
  if (map.getLayer('ward-labels')) {
    try {
      map.moveLayer('ward-labels');
      console.log('✅ Moved ward-labels to ABSOLUTE TOP (above basemap labels)');
    } catch (error) {
      console.warn('⚠️ Could not move ward-labels to top:', error);
    }
  }
}

// Helper function to hide building layers from the basemap
function hideBasemapBuildings(map: maplibregl.Map) {
  // CRITICAL: Check if map has a style loaded
  if (!map.getStyle()) {
    console.log('⚠️ Map style not loaded yet, skipping basemap building hide');
    return;
  }
  
  const style = map.getStyle();
  const layers = style?.layers;
  
  if (!layers) {
    console.log('⚠️ Map style has no layers yet, skipping basemap building hide');
    return;
  }
  
  // Find all building-related layers in the basemap
  layers.forEach((layer) => {
    if (layer.id.includes('building')) {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
      console.log(`✅ Hidden basemap building layer: ${layer.id}`);
    }
  });
}

// Helper function to normalize city name text case in basemap labels
function normalizeCityNameCase(map: maplibregl.Map) {
  // CRITICAL: Check if map has a style loaded
  if (!map.getStyle()) {
    console.log('⚠️ Map style not loaded yet, skipping label normalization');
    return;
  }
  
  const style = map.getStyle();
  const layers = style?.layers;
  
  if (!layers) {
    console.log('⚠️ Map style has no layers yet, skipping label normalization');
    return;
  }
  
  console.log('🔍 Normalizing ALL label layers in Carto basemap...');
  
  let normalizedCount = 0;
  
  // Target ALL symbol layers (labels) in the basemap
  layers.forEach((layer: any) => {
    // Process all symbol layers that have text-field (these are label layers)
    if (layer.type === 'symbol' && layer.layout?.['text-field']) {
      try {
        const currentTextField = layer.layout['text-field'];
        const currentTransform = layer.layout['text-transform'];
        
        console.log(`🔍 Processing label layer: ${layer.id}`);
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
        console.log(`✅ Applied title case transformation to: ${layer.id}`);
      } catch (error) {
        console.log(`⚠️ Could not modify text case for layer: ${layer.id}`, error);
      }
    }
  });
  
  console.log(`✅ Label normalization complete - transformed ${normalizedCount} layers`);
}

// Helper function to get basemap style URL or style object
// ────────────────────────────────────────────────────────────────────────────
// 3D HILLSHADE HELPERS
// Adds a hillshade layer using AWS terrain DEM tiles when 3D mode is active.
// The hillshade is placed above the basemap but below all data layers, giving
// terrain a convincing 3D depth effect when the map is pitched to 60°.
// ────────────────────────────────────────────────────────────────────────────

function addHillshadeLayer(map: maplibregl.Map): void {
  try {
    if (!map || !map.getStyle || !map.getStyle()) return;

    // ── DEM source (AWS Terrain Tiles, Terrarium encoding — no API key needed) ──
    // maxzoom:9 forces MapLibre to use lower-resolution (smoothed) DEM tiles,
    // which averages out the abrupt land→ocean elevation steps at Bohol's
    // coastline that cause spike/stretch artifacts when terrain is enabled.
    if (!map.getSource('hillshade-dem')) {
      map.addSource('hillshade-dem', {
        type: 'raster-dem',
        tiles: [
          'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        encoding: 'terrarium',
        minzoom: 0,
        maxzoom: 9,
        attribution: '© Mapzen, © OpenStreetMap contributors'
      } as any);
    }

    // ── Hillshade layer for visual shading (placed below data layers) ──────────
    if (!map.getLayer('3d-hillshade')) {
      const style = map.getStyle();
      const firstDataLayer = style?.layers?.find(l => {
        const lid = l.id.toLowerCase();
        return (
          lid.startsWith('heat_') || lid.startsWith('air_') ||
          lid.startsWith('flood_') || lid.startsWith('multihazard_') ||
          lid === 'elevation' || lid === 'builtup_density' || lid === 'built_up' ||
          lid.startsWith('slum_') || lid.startsWith('waterbody') ||
          lid.startsWith('buildings') || lid.startsWith('road_network') ||
          lid.startsWith('ward-')
        );
      });

      map.addLayer({
        id: '3d-hillshade',
        type: 'hillshade',
        source: 'hillshade-dem',
        layout: { visibility: 'visible' },
        paint: {
          // Illumination from NW (335°) — same direction as ESRI World Hillshade 3D
          'hillshade-illumination-direction': 335,
          'hillshade-illumination-anchor': 'map',
          // Low exaggeration + semi-transparent shadow/accent prevents the DEM's
          // sharp land→ocean boundary from rendering as a dark blob at the coast.
          'hillshade-exaggeration': 0.35,
          'hillshade-shadow-color': 'rgba(50, 60, 75, 0.25)',
          'hillshade-highlight-color': 'rgba(255, 255, 255, 0.9)',
          'hillshade-accent-color': 'rgba(74, 106, 138, 0.0)'
        }
      } as any, firstDataLayer?.id);

      console.log('🏔️ 3D Hillshade layer added');
    }

    // NOTE: setTerrain() is intentionally NOT used here.
    // Physical terrain deformation creates concave ocean-boundary artifacts
    // (spikes, dark blobs) at Bohol's coastline due to the DEM encoding ocean
    // as 0 elevation right next to elevated land.
    // The hillshade visual layer alone gives the ESRI-style 3D shading effect
    // at 60° pitch without any mesh deformation artifacts.

  } catch (error) {
    console.warn('⚠️ Error adding 3D hillshade layer:', error);
  }
}

function removeHillshadeLayer(map: maplibregl.Map): void {
  try {
    if (!map || !map.getStyle || !map.getStyle()) return;
    if (map.getLayer('3d-hillshade')) map.removeLayer('3d-hillshade');
    if (map.getSource('hillshade-dem')) map.removeSource('hillshade-dem');
    console.log('🏔️ 3D Hillshade removed');
  } catch (error) {
    console.warn('⚠️ Error removing 3D hillshade layer:', error);
  }
}

// ────────────────────────────────────────────────────────────────────────────

function getBasemapStyle(basemap: Basemap): string | any {
  const styles = {
    light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', // WITH labels
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
        'satellite-roads': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
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
          id: 'satellite-roads',
          type: 'raster',
          source: 'satellite-roads',
          minzoom: 0,
          maxzoom: 22,
          layout: {
            visibility: 'visible'
          }
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

// Helper function to re-add ward labels after basemap switches
function readdWardLabels(map: maplibregl.Map, wardPointData: any) {
  if (!map || !wardPointData) {
    console.log('⏭️ Skipping ward labels re-add: map or data not available');
    return;
  }
  
  // Validate map has a style loaded
  if (!map.getStyle || !map.getStyle()) {
    console.log('⏭️ Skipping ward labels re-add: map style not loaded');
    return;
  }
  
  const wardLabelLayerId = 'ward-labels';
  const wardPointSourceId = 'ward-points';
  
  console.log('🏷️ Re-adding ward labels after basemap switch...');
  console.log(`  Current layers: ${map.getStyle().layers?.map(l => l.id).join(', ')}`);
  
  try {
    // Check if source exists, if yes update data, if no add source
    const existingSource = map.getSource(wardPointSourceId);
    if (existingSource) {
      // Update existing source data
      (existingSource as maplibregl.GeoJSONSource).setData(wardPointData);
      console.log('✅ Ward_Point source data updated');
    } else {
      // Add new source
      map.addSource(wardPointSourceId, {
        type: 'geojson',
        data: wardPointData
      });
      console.log('✅ Ward_Point source re-added');
    }
    
    // Add ward label layer if it doesn't exist
    if (!map.getLayer(wardLabelLayerId)) {
      map.addLayer({
        id: wardLabelLayerId,
        type: 'symbol',
        source: wardPointSourceId,
        minzoom: 10,
        layout: {
          'text-field': ['get', 'BrgyName'],
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'symbol-sort-key': 1,
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
          'visibility': 'visible'
        },
        paint: {
          'text-color': '#1E293B',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 2,
          'text-halo-blur': 1
        }
      } as any);
      console.log('✅ Ward labels layer re-added after basemap switch');
    } else {
      // Layer exists, ensure it's visible
      map.setLayoutProperty(wardLabelLayerId, 'visibility', 'visible');
      console.log('✅ Ward labels layer already exists, ensured visibility');
    }
    
    // Verify the layer was added successfully
    const layerExists = map.getLayer(wardLabelLayerId);
    console.log(`🔍 Ward labels verification: layer exists = ${!!layerExists}`);
    if (layerExists) {
      const visibility = map.getLayoutProperty(wardLabelLayerId, 'visibility');
      console.log(`🔍 Ward labels visibility: ${visibility}`);
    }
  } catch (error) {
    console.warn('⚠️ Error re-adding ward labels:', error);
  }
}

// Smart basemap switching - swaps only basemap sources/layers, keeps all data layers intact
// CRITICAL: This function ONLY touches basemap layers - all data layers remain completely untouched
function switchBasemap(map: maplibregl.Map, basemap: Basemap, previousBasemap?: Basemap, wardPointDataRef?: React.MutableRefObject<any>) {
  if (!map || !map.getStyle()) return;
  
  const currentStyle = map.getStyle();
  if (!currentStyle) return;
  
  console.log(`🔄 Smart basemap switch (${previousBasemap} → ${basemap}): Preserving all data layers...`);
  
  // 🏷️ WARD LABELS TRACKER - COMPREHENSIVE STATUS CHECK
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏷️ WARD LABELS TRACKER - BEFORE BASEMAP SWITCH');
  const wardLabelsLayerBefore = map.getLayer('ward-labels');
  const wardLabelsSourceBefore = map.getSource('ward-points');
  console.log(`  Layer exists: ${wardLabelsLayerBefore ? '✓ YES' : '✗ NO'}`);
  console.log(`  Source exists: ${wardLabelsSourceBefore ? '✓ YES' : '✗ NO'}`);
  if (wardLabelsLayerBefore) {
    const visibility = map.getLayoutProperty('ward-labels', 'visibility');
    const layerType = (wardLabelsLayerBefore as any).type;
    console.log(`  Visibility: ${visibility}`);
    console.log(`  Layer type: ${layerType}`);
  }
  if (wardLabelsSourceBefore) {
    const sourceType = (wardLabelsSourceBefore as any).type;
    console.log(`  Source type: ${sourceType}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Use the centralized isDataLayer function defined above
  
  // For satellite basemap - simple raster swap
  if (basemap === 'satellite') {
    // Step 1: Collect all basemap layers that need to be removed
    const layersToRemove: string[] = [];
    (currentStyle.layers || []).forEach((layer: any) => {
      if (!isDataLayer(layer.id) && layer.id !== 'satellite' && layer.id !== 'labels') {
        layersToRemove.push(layer.id);
      }
    });
    
    // Step 2: Hide layers first (prevents symbol placement during removal)
    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        try {
          map.setLayoutProperty(layerId, 'visibility', 'none');
        } catch (e) {
          console.warn(`⚠️ Could not hide layer ${layerId}:`, e);
        }
      }
    });
    
    // Step 3: Remove all basemap layers first
    requestAnimationFrame(() => {
      console.log(`🗑️ Removing ${layersToRemove.length} basemap layers...`);
      
      layersToRemove.forEach(layerId => {
        if (map.getLayer(layerId)) {
          try {
            map.removeLayer(layerId);
            console.log(`  ✓ Removed layer: ${layerId}`);
          } catch (e) {
            console.warn(`  ⚠️ Could not remove layer ${layerId}:`, e);
          }
        }
      });
      
      // Step 4: ONLY AFTER all layers removed, remove basemap sources
      setTimeout(() => {
        const sourcesToRemove: string[] = [];
        Object.keys(currentStyle.sources || {}).forEach(sourceId => {
          if (!isDataLayer(sourceId) && sourceId !== 'satellite' && sourceId !== 'labels' && sourceId !== 'satellite-roads') {
            sourcesToRemove.push(sourceId);
          }
        });
        
        console.log(`🗑️ Removing ${sourcesToRemove.length} basemap sources...`);
        
        sourcesToRemove.forEach(sourceId => {
          if (map.getSource(sourceId)) {
            try {
              // Double-check no layers are still using this source
              const remainingLayers = (map.getStyle()?.layers || []).filter(
                (layer: any) => layer.source === sourceId
              );
              
              if (remainingLayers.length > 0) {
                console.warn(`  ⚠️ Source ${sourceId} still has ${remainingLayers.length} layers, skipping`);
                return;
              }
              
              map.removeSource(sourceId);
              console.log(`  ✓ Removed source: ${sourceId}`);
            } catch (e) {
              console.warn(`  ⚠️ Could not remove source ${sourceId}:`, e);
            }
          }
        });
        
        // Step 5: After sources removed, add satellite sources and layers
        setTimeout(() => {
          // Add satellite source if it doesn't exist
          if (!map.getSource('satellite')) {
            map.addSource('satellite', {
              type: 'raster',
              tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256
            });
            console.log('  ✓ Added satellite source');
          }
          
          // Add road overlay source if it doesn't exist (for road_network_base layer)
          if (!map.getSource('satellite-roads')) {
            map.addSource('satellite-roads', {
              type: 'raster',
              tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256
            });
            console.log('  ✓ Added satellite roads overlay source');
          }
          
          // Add labels source if it doesn't exist
          if (!map.getSource('labels')) {
            map.addSource('labels', {
              type: 'raster',
              tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
              tileSize: 256
            });
            console.log('  ✓ Added labels source');
          }
          
          // Get first data layer to insert basemap before it
          const currentLayers = map.getStyle()?.layers || [];
          const firstDataLayer = currentLayers.find((layer: any) => isDataLayer(layer.id));
          const beforeId = firstDataLayer?.id;
          
          // Add satellite layer at the bottom
          if (!map.getLayer('satellite')) {
            map.addLayer({
              id: 'satellite',
              type: 'raster',
              source: 'satellite',
              minzoom: 0,
              maxzoom: 22
            }, beforeId);
            console.log('  ✓ Added satellite layer');
          }
          
          // Add road overlay layer (controlled by road_network_base visibility)
          if (!map.getLayer('satellite-roads')) {
            map.addLayer({
              id: 'satellite-roads',
              type: 'raster',
              source: 'satellite-roads',
              minzoom: 0,
              maxzoom: 22,
              layout: {
                visibility: 'visible' // Will be controlled by road_network_base toggle
              }
            }, beforeId);
            console.log('  ✓ Added satellite roads overlay layer');
          }
          
          // Add labels layer
          if (!map.getLayer('labels')) {
            map.addLayer({
              id: 'labels',
              type: 'raster',
              source: 'labels',
              minzoom: 0,
              maxzoom: 22
            }, beforeId);
            console.log('  ✓ Added labels layer');
          }
          
          console.log('✅ Satellite basemap switched (all data layers preserved)');
          
          // Log ward labels status after switch
          const wardLabelsAfter = map.getLayer('ward-labels');
          console.log(`  📊 Ward labels status AFTER switch: ${wardLabelsAfter ? '✓ EXISTS' : '✗ MISSING'}`);
          
          // 🔒 ENFORCE STRICT LAYER ORDER after basemap switch
          setTimeout(() => {
            enforceStrictLayerOrder(map);
            console.log('✅ Layer order enforced after satellite basemap switch');
            
            // Verify ward labels still exist after layer order enforcement
            const wardLabelsFinal = map.getLayer('ward-labels');
            console.log(`  📊 Ward labels status AFTER enforcement: ${wardLabelsFinal ? '✓ EXISTS' : '✗ MISSING'}`);
            
            // 🏷️ RE-ADD WARD LABELS if missing after basemap switch
            if (!wardLabelsFinal && wardPointDataRef?.current) {
              console.log('🔧 Ward labels missing after satellite basemap switch - re-adding...');
              readdWardLabels(map, wardPointDataRef.current);
            }
          }, 100);
        }, 50);
      }, 50);
    });
  } else {
    // For vector basemaps (light) - SURGICAL SWAP, NO STYLE RELOAD
    console.log('🔄 Switching to light basemap, surgical layer swap (NO data layer reload)...');
    
    // Step 1: Remove satellite/labels raster sources and layers (if present)
    const layersToRemove = ['satellite', 'satellite-roads', 'labels'];
    const sourcesToRemove = ['satellite', 'satellite-roads', 'labels'];
    
    // 🏷️ WARD LABELS TRACKER - Verify ward-labels is NOT in removal list
    console.log('🏷️ WARD LABELS TRACKER - Checking removal lists');
    console.log(`  ward-labels in layersToRemove? ${layersToRemove.includes('ward-labels') ? '⚠️ YES - THIS IS A BUG!' : '✓ NO'}`);
    console.log(`  ward-points in sourcesToRemove? ${sourcesToRemove.includes('ward-points') ? '⚠️ YES - THIS IS A BUG!' : '✓ NO'}`);
    
    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        try {
          map.removeLayer(layerId);
          console.log(`  ✓ Removed layer: ${layerId}`);
        } catch (e) {
          console.warn(`  ⚠️ Could not remove layer ${layerId}:`, e);
        }
      }
    });
    
    // Small delay before removing sources
    setTimeout(() => {
      sourcesToRemove.forEach(sourceId => {
        if (map.getSource(sourceId)) {
          try {
            map.removeSource(sourceId);
            console.log(`  ✓ Removed source: ${sourceId}`);
          } catch (e) {
            console.warn(`  ⚠️ Could not remove source ${sourceId}:`, e);
          }
        }
      });
      
      // Step 2: Fetch the new basemap style and add ONLY basemap sources/layers
      const newStyleUrl = getBasemapStyle(basemap) as string;
      
      fetch(newStyleUrl)
        .then(response => response.json())
        .then(newStyle => {
          console.log('📥 Fetched light basemap style');
          
          // Get first data layer to insert basemap before it
          const currentLayers = map.getStyle()?.layers || [];
          const firstDataLayer = currentLayers.find((layer: any) => isDataLayer(layer.id));
          const beforeId = firstDataLayer?.id;
          
          console.log(`🎯 Will insert basemap layers before: ${beforeId || 'top'}`);
          
          // Step 3: Add ONLY basemap sources (skip data sources)
          Object.entries(newStyle.sources || {}).forEach(([id, source]) => {
            if (!map.getSource(id)) {
              try {
                map.addSource(id, source as any);
                console.log(`  ✓ Added basemap source: ${id}`);
              } catch (e) {
                console.warn(`  ⚠️ Could not add source ${id}:`, e);
              }
            }
          });
          
          // Step 4: Add ONLY basemap layers (before data layers)
          (newStyle.layers || []).forEach((layer: any) => {
            if (!map.getLayer(layer.id)) {
              try {
                map.addLayer(layer, beforeId);
                console.log(`  ✓ Added basemap layer: ${layer.id}`);
                
                // 🏷️ WARD LABELS TRACKER - Check after each basemap layer add
                if (layer.type === 'symbol') {
                  const wardLabelsStillExists = map.getLayer('ward-labels');
                  if (!wardLabelsStillExists) {
                    console.error(`🚨 WARD LABELS DISAPPEARED after adding basemap symbol layer: ${layer.id}`);
                  }
                }
              } catch (e) {
                console.warn(`  ⚠️ Could not add layer ${layer.id}:`, e);
              }
            }
          });
          
          console.log('✅ Light basemap switched (all data layers completely untouched)');
          
          // 🏷️ WARD LABELS TRACKER - Check after all basemap layers added
          const wardLabelsAfterAdd = map.getLayer('ward-labels');
          console.log('🏷️ WARD LABELS TRACKER - After adding basemap layers');
          console.log(`  Layer exists: ${wardLabelsAfterAdd ? '✓ YES' : '✗ NO'}`);
          if (wardLabelsAfterAdd) {
            const visibility = map.getLayoutProperty('ward-labels', 'visibility');
            console.log(`  Visibility: ${visibility}`);
          }
          
          // Log ward labels status after switch
          const wardLabelsAfter = map.getLayer('ward-labels');
          console.log(`  📊 Ward labels status AFTER switch: ${wardLabelsAfter ? '✓ EXISTS' : '✗ MISSING'}`);
          
          // Step 5: Post-processing
          setTimeout(() => {
            hideBasemapBuildings(map);
            normalizeCityNameCase(map);
            
            // 🔒 ENFORCE STRICT LAYER ORDER after basemap switch
            setTimeout(() => {
              enforceStrictLayerOrder(map);
              console.log('✅ Layer order enforced after light basemap switch');
              
              // Verify ward labels still exist after layer order enforcement
              const wardLabelsFinal = map.getLayer('ward-labels');
              console.log(`  📊 Ward labels status AFTER enforcement: ${wardLabelsFinal ? '✓ EXISTS' : '✗ MISSING'}`);
              
              // 🏷️ RE-ADD WARD LABELS if missing after basemap switch
              if (!wardLabelsFinal && wardPointDataRef?.current) {
                console.log('🔧 Ward labels missing after light basemap switch - re-adding...');
                readdWardLabels(map, wardPointDataRef.current);
              }
            }, 100);
          }, 50);
        })
      .catch(error => {
        console.error('❌ Failed to fetch new basemap style:', error);
      });
    }, 50);
  }
}

// Helper to get first non-basemap layer ID
function getFirstNonBasemapLayerId(map: maplibregl.Map): string | undefined {
  const basemapLayerIds = ['satellite', 'labels', 'carto-basemap'];
  const layers = map.getStyle()?.layers || [];
  
  for (const layer of layers) {
    if (!basemapLayerIds.includes(layer.id) && !layer.id.includes('background')) {
      return layer.id;
    }
  }
  
  return undefined;
}

// Helper function to create infrastructure markers with popups
function createInfrastructureMarker(data: any, category: string): maplibregl.Marker {
  // Create marker element
  const el = document.createElement('div');
  el.className = 'infrastructure-marker';
  el.style.width = '32px';
  el.style.height = '32px';
  el.style.cursor = 'pointer';
  el.style.transition = 'all 0.2s ease';

  // Get color based on category
  const categoryColors = {
    education: '#9333EA',
    healthcare: '#DC2626',
    public_amenities: '#16A34A',
    transport: '#EA580C',
  };

  const color = categoryColors[category as keyof typeof categoryColors] || '#2563EB';

  // Create marker icon
  el.innerHTML = `
    <div style="
      width: 100%;
      height: 100%;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    ">
      <div style="width: 12px; height: 12px; background: white; border-radius: 50%;"></div>
    </div>
  `;

  // Add hover effect
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.2)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)';
  });

  // Create popup content
  const popupContent = createPopupContent(data, category);

  // Create popup
  const popup = new maplibregl.Popup({
    offset: 25,
    closeButton: true,
    closeOnClick: true,
    maxWidth: '320px',
    className: 'infrastructure-popup'
  }).setHTML(popupContent);

  // Create and return marker
  const marker = new maplibregl.Marker({
    element: el,
    anchor: 'bottom'
  });

  marker.setPopup(popup);

  return marker;
}

// Helper function to create popup content
function createPopupContent(data: any, category: string): string {
  const categoryGradients = {
    education: 'from-purple-600 to-purple-700',
    healthcare: 'from-red-600 to-red-700',
    public_amenities: 'from-green-600 to-green-700',
    transport: 'from-orange-600 to-orange-700',
  };

  const gradient = categoryGradients[category as keyof typeof categoryGradients] || 'from-blue-600 to-blue-700';

  const riskColors = {
    low: '#16A34A',
    moderate: '#EAB308',
    high: '#F97316',
    critical: '#DC2626'
  };

  let riskBadges = '';
  if (data.risks) {
    if (data.risks.heat) {
      riskBadges += `
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1">
            <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${riskColors[data.risks.heat as keyof typeof riskColors]};"></div>
            <span style="font-size: 10px; color: #475569;">Heat Stress</span>
          </div>
          <span style="font-size: 10px; font-weight: 600; text-transform: capitalize; padding: 2px 8px; border-radius: 6px; background-color: ${riskColors[data.risks.heat as keyof typeof riskColors]}40; color: #0F172A;">${data.risks.heat}</span>
        </div>
      `;
    }
    if (data.risks.air) {
      riskBadges += `
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1">
            <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${riskColors[data.risks.air as keyof typeof riskColors]};"></div>
            <span style="font-size: 10px; color: #475569;">Air Pollution</span>
          </div>
          <span style="font-size: 10px; font-weight: 600; text-transform: capitalize; padding: 2px 8px; border-radius: 6px; background-color: ${riskColors[data.risks.air as keyof typeof riskColors]}40; color: #0F172A;">${data.risks.air}</span>
        </div>
      `;
    }
    if (data.risks.flood) {
      riskBadges += `
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1">
            <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${riskColors[data.risks.flood as keyof typeof riskColors]};"></div>
            <span style="font-size: 10px; color: #475569;">Flood</span>
          </div>
          <span style="font-size: 10px; font-weight: 600; text-transform: capitalize; padding: 2px 8px; border-radius: 6px; background-color: ${riskColors[data.risks.flood as keyof typeof riskColors]}40; color: #0F172A;">${data.risks.flood}</span>
        </div>
      `;
    }
    if (data.risks.multi) {
      riskBadges += `
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1">
            <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${riskColors[data.risks.multi as keyof typeof riskColors]};"></div>
            <span style="font-size: 10px; color: #475569;">Multi Hazard</span>
          </div>
          <span style="font-size: 10px; font-weight: 600; text-transform: capitalize; padding: 2px 8px; border-radius: 6px; background-color: ${riskColors[data.risks.multi as keyof typeof riskColors]}40; color: #0F172A;">${data.risks.multi}</span>
        </div>
      `;
    }
  }

  return `
    <div style="background: white; border-radius: 8px; overflow: hidden; font-family: Inter, system-ui, sans-serif;">
      <div style="background: linear-gradient(to right, var(--tw-gradient-stops)); --tw-gradient-from: #${gradient.includes('purple') ? '9333EA' : gradient.includes('red') ? 'DC2626' : gradient.includes('green') ? '16A34A' : 'EA580C'}; --tw-gradient-to: #${gradient.includes('purple') ? '7E22CE' : gradient.includes('red') ? 'B91C1C' : gradient.includes('green') ? '15803D' : 'C2410C'}; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); padding: 8px 12px;">
        <div style="color: white; font-weight: 600; font-size: 12px; margin-bottom: 2px;">${data.name}</div>
        <div style="color: rgba(255,255,255,0.9); font-size: 10px; text-transform: capitalize;">${data.type.replace(/_/g, ' ')}</div>
      </div>
      <div style="padding: 12px;">
        ${data.address ? `<div style="font-size: 10px; color: #64748B; margin-bottom: 8px;">${data.address}</div>` : ''}
        ${data.capacity ? `<div style="font-size: 10px; color: #475569; margin-bottom: 4px;"><strong>Capacity:</strong> ${data.capacity}</div>` : ''}
        ${data.students ? `<div style="font-size: 10px; color: #475569; margin-bottom: 4px;"><strong>Students:</strong> ${data.students}</div>` : ''}
        ${data.beds ? `<div style="font-size: 10px; color: #475569; margin-bottom: 4px;"><strong>Beds:</strong> ${data.beds}</div>` : ''}
        ${data.services ? `<div style="font-size: 10px; color: #475569; margin-bottom: 4px;"><strong>Services:</strong> ${data.services}</div>` : ''}
        ${data.timings ? `<div style="font-size: 10px; color: #475569; margin-bottom: 4px;"><strong>Timings:</strong> ${data.timings}</div>` : ''}
        ${riskBadges ? `<div style="border-top: 1px solid #E5E7EB; margin-top: 8px; padding-top: 8px;">${riskBadges}</div>` : ''}
      </div>
    </div>
  `;
}

// PERFORMANCE: Cache ward boundaries GeoJSON globally to avoid re-fetching
// Cache is now LGU-specific to support filtering
let wardBoundariesCache: Map<string, any> = new Map();
let wardBoundariesFetchPromise: Map<string, Promise<any>> = new Map();

/**
 * Helper function to add Ward Boundary layer (permanent overlay, always on top)
 * 
 * PERFORMANCE OPTIMIZATIONS (v2.0):
 * - Global caching: Fetches GeoJSON once and caches for future calls
 * - Promise deduplication: Prevents duplicate requests if called multiple times
 * - Minzoom restrictions: Layers only render at zoom 10+, labels at zoom 12+
 * - Zoom-dependent styling: Line widths and font sizes scale with zoom level
 * - Geometry simplification: Tolerance and buffer settings reduce render complexity
 * - Progressive loading: Optimized for instant loading on subsequent calls
 */
function addWardBoundaryLayer(
  map: maplibregl.Map, 
  wardPopupRef?: React.MutableRefObject<maplibregl.Popup | null>,
  setWardPopupData?: (data: {
    wardName: string;
    wardNumber: string;
    population?: string;
    area?: string;
    density?: string;
    households?: string;
    buildings?: string;
    zone?: string;
    lguName?: string;
    x: number;
    y: number;
  } | null) => void,
  wardBoundariesDataRef?: React.MutableRefObject<any>,
  setEducationPopupData?: (data: any) => void,
  setHealthcarePopupData?: (data: any) => void,
  setSelectedWardNumber?: (wardNumber: string | null) => void,
  onLocationClear?: () => void,
  wardPointDataRef?: React.MutableRefObject<any>,
  selectedLguName?: string,
  selectedWardId?: string,  // Add selectedWardId parameter for barangay filtering
  setIsLayerLoading?: (isLoading: boolean) => void,  // Loading state setter
  onResidentialBuildingsUpdate?: (total: number) => void,  // Callback to update total residential buildings
  onTotalAreaUpdate?: (totalKm2: number) => void,  // Callback to update total area in km²
  onTotalPopulationUpdate?: (totalPop: number) => void  // Callback to update total population
) {
  // Set loading state
  if (setIsLayerLoading) {
    setIsLayerLoading(true);
  }
  
  // Validate map and style first
  if (!map || !map.getStyle()) {
    console.warn('⚠️ Map style not available yet in addWardBoundaryLayer, skipping');
    if (setIsLayerLoading) {
      setIsLayerLoading(false);
    }
    return;
  }
  
  const wardLayerId = 'ward-boundaries';
  const wardLabelLayerId = 'ward-labels';
  
  console.log('🏘️  Adding Ward Boundary layer (WFS vector)...');
  console.log(`🏛️ Selected LGU Name: "${selectedLguName}" (type: ${typeof selectedLguName})`);
  console.log(`📍 Selected Ward ID (BrgyID): "${selectedWardId}" (type: ${typeof selectedWardId})`);
  console.log(`🔍 Will apply filter: ${selectedLguName && selectedLguName !== 'all' ? 'YES' : 'NO'}`);
  
  
  // Try WFS (GeoJSON) for vector-based ward boundaries with labels (no tile-based duplication)
  // IMPORTANT: Add srsName=EPSG:4326 to request data in lat/lon (not UTM EPSG:32651)
  let WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Barangay_Boundary&outputFormat=application/json&srsName=EPSG:4326';
  
  // Build CQL filter based on selections
  const filters: string[] = [];
  
  // Add barangay filter if a specific barangay is selected
  if (selectedWardId && selectedWardId !== 'all') {
    filters.push(`BrgyID='${selectedWardId}'`);
    console.log(`🔍 Applying Barangay filter (BrgyID): ${selectedWardId}`);
  }
  
  // Add LGU filter if an LGU is selected (and no specific barangay is selected)
  if (selectedLguName && selectedLguName !== 'all' && (!selectedWardId || selectedWardId === 'all')) {
    const escapedLguName = selectedLguName.replace(/'/g, "''");
    filters.push(`MunName='${escapedLguName}'`);
    console.log(`🔍 Applying LGU filter to ward boundaries: ${selectedLguName}`);
  }
  
  // Combine filters with AND
  if (filters.length > 0) {
    const combinedFilter = filters.join(' AND ');
    WFS_URL += `&CQL_FILTER=${encodeURIComponent(combinedFilter)}`;
    console.log(`📡 Filtered WFS URL: ${WFS_URL}`);
  } else {
    console.log(`📡 No filter - fetching all barangay boundaries`);
  }
  
  // Helper function to process ward boundaries GeoJSON
  // IMPORTANT: Declared BEFORE use to avoid TDZ (Temporal Dead Zone) error
  const processWardBoundaries = (geojson: any) => {
    // CRITICAL: Validate geojson exists and has features before accessing properties
    if (!geojson) {
      console.error('❌ Ward boundaries GeoJSON is null or undefined');
      addWardBoundaryAsWMS(map);
      return;
    }
    
    if (!geojson.features) {
      console.error('❌ Ward boundaries GeoJSON missing features property');
      addWardBoundaryAsWMS(map);
      return;
    }
    
    console.log('📊 Processing ward boundaries - Features count:', geojson.features?.length || 0);
    
    if (geojson.features && geojson.features.length > 0) {
      console.log('🔍 First feature properties:', geojson.features[0].properties);
      
      // Log unique MunNames in the fetched data to verify filtering
      const munNames = geojson.features.map((f: any) => f.properties.MunName || f.properties.MUNNAME || f.properties.munname);
      const uniqueMunNames = [...new Set(munNames)];
      console.log(`🏛️ Unique municipality names in fetched barangay data:`, uniqueMunNames);
      console.log(`🎯 Expected to see only: "${selectedLguName || 'all'}"`);
      
        
        // Store GeoJSON data in ref for direct access (not relying on rendered features)
        if (wardBoundariesDataRef) {
          wardBoundariesDataRef.current = geojson;
          console.log('✅ Ward boundaries data stored in ref');
          
          // Calculate sum of Res_Buildings for Module 1 KPI
          if (onResidentialBuildingsUpdate && geojson.features) {
            const totalResBuildings = geojson.features.reduce((sum: number, feature: any) => {
              const resBuildings = feature.properties?.Res_Buildings || 
                                 feature.properties?.res_buildings || 
                                 feature.properties?.RES_BUILDINGS || 0;
              return sum + (typeof resBuildings === 'number' ? resBuildings : parseInt(resBuildings) || 0);
            }, 0);
            console.log(`🏠 [Ward Boundaries] Calculated total residential buildings: ${totalResBuildings.toLocaleString()}`);
            onResidentialBuildingsUpdate(totalResBuildings);
          }
          
          // Calculate sum of Shape_Area for Module 1 KPI (convert to km²)
          if (onTotalAreaUpdate && geojson.features) {
            const totalAreaSqMeters = geojson.features.reduce((sum: number, feature: any) => {
              const shapeArea = feature.properties?.Shape_Area || 
                               feature.properties?.shape_area || 
                               feature.properties?.SHAPE_AREA || 0;
              return sum + (typeof shapeArea === 'number' ? shapeArea : parseFloat(shapeArea) || 0);
            }, 0);
            // Convert from square meters to square kilometers
            const totalAreaKm2 = totalAreaSqMeters / 1_000_000;
            console.log(`📐 [Ward Boundaries] Calculated total area: ${totalAreaKm2.toFixed(2)} km² (${totalAreaSqMeters.toLocaleString()} m²)`);
            onTotalAreaUpdate(totalAreaKm2);
          }
          
          // Calculate sum of Pop_2024 for Module 1 KPI
          if (onTotalPopulationUpdate && geojson.features) {
            const totalPopulation = geojson.features.reduce((sum: number, feature: any) => {
              const pop2024 = feature.properties?.Pop_2024 || 
                             feature.properties?.pop_2024 || 
                             feature.properties?.POP_2024 || 0;
              return sum + (typeof pop2024 === 'number' ? pop2024 : parseInt(pop2024) || 0);
            }, 0);
            console.log(`👥 [Ward Boundaries] Calculated total population: ${totalPopulation.toLocaleString()}`);
            onTotalPopulationUpdate(totalPopulation);
          }
        }
        
        // Validate map still has style (but don't warn - this is expected during basemap changes)
        if (!map || !map.getStyle || !map.getStyle()) {
          console.log('ℹ️ Map style not ready during ward boundary processing, will retry on next load');
          return;
        }
        
        // Add ward boundary source as GeoJSON
        try {
          // Check if source exists and update it if it does, otherwise add it
          const existingSource = map.getSource(wardLayerId) as maplibregl.GeoJSONSource;
          
          if (existingSource) {
            // Source exists - update its data with the new filtered GeoJSON
            console.log(`🔄 Updating existing ward boundary source with filtered data (${geojson.features.length} features)`);
            existingSource.setData(geojson);
            console.log('✅ Ward Boundary source updated with new data');
          } else {
            // Source doesn't exist - add it
            map.addSource(wardLayerId, {
              type: 'geojson',
              data: geojson,
              // PERFORMANCE: Enable feature ID generation for better caching and updates
              generateId: true,
              // PERFORMANCE: Add tolerance for simplified rendering at lower zooms
              tolerance: 0.375,
              // Enable better clustering and performance
              buffer: 64,
              lineMetrics: false
            });
            console.log('✅ Ward Boundary GeoJSON source added with performance optimizations');
          }
        } catch (error) {
          console.error('❌ Error adding ward boundary source:', error);
          return;
        }
        
        // Add ward boundary FILL layer (transparent, for clickability)
        const wardFillLayerId = 'ward-boundaries-fill';
        try {
          if (!map.getLayer(wardFillLayerId)) {
            // Get the first label layer to insert before it
            const labelLayerId = map.getLayer('labels') ? 'labels' : getFirstLabelLayerId(map);
            
            map.addLayer({
              id: wardFillLayerId,
              type: 'fill',
              source: wardLayerId,
              minzoom: 10, // PERFORMANCE: Only render ward boundaries at zoom 10+
              paint: {
                'fill-color': '#2563EB', // Blue fill (barely visible)
                'fill-opacity': 0.01 // Almost invisible but still clickable (0.01 not 0!)
              }
            }, labelLayerId); // Insert BEFORE labels
            console.log(`✅ Ward Boundary fill layer added (0.01 opacity for clicks, minzoom: 10) - positioned before ${labelLayerId || 'top'}`);
          }
        } catch (error) {
          console.error('❌ Error adding ward fill layer:', error);
        }
        
        // Add ward boundary line layer (visible outline)
        try {
          if (!map.getLayer(wardLayerId)) {
            // Get the first label layer to insert before it
            const labelLayerId = map.getLayer('labels') ? 'labels' : getFirstLabelLayerId(map);
          
            map.addLayer({
              id: wardLayerId,
              type: 'line',
              source: wardLayerId,
              minzoom: 10, // PERFORMANCE: Only render ward boundaries at zoom 10+
              paint: {
                'line-color': '#374151', // Dark grey - clean minimal style
                // PERFORMANCE: Zoom-dependent line width - thinner at lower zooms
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 0.5,  // Thin at zoom 10
                  12, 0.8,  // Medium at zoom 12
                  14, 1,    // Normal at zoom 14
                  16, 1.2   // Slightly thicker at zoom 16+
                ],
                'line-opacity': 0.7,
                'line-dasharray': [3, 3] // Dotted line pattern
              }
            }, labelLayerId); // Insert BEFORE labels
            console.log(`✅ Ward Boundary line layer added (dark grey outline, minzoom: 10, zoom-dependent width) - positioned before ${labelLayerId || 'top'}`);
          }
        } catch (error) {
          console.error('❌ Error adding ward line layer:', error);
        }
        
        // Add ward boundary highlight layer (blue line for selected ward)
        const wardHighlightLayerId = 'ward-boundaries-highlight';
        try {
          if (!map.getLayer(wardHighlightLayerId)) {
            // Get the first label layer to insert before it
            const labelLayerId = map.getLayer('labels') ? 'labels' : getFirstLabelLayerId(map);
            
            map.addLayer({
              id: wardHighlightLayerId,
              type: 'line',
              source: wardLayerId,
              minzoom: 10, // PERFORMANCE: Only render ward boundaries at zoom 10+
              paint: {
                'line-color': '#10B981', // Bright green for better visibility (Emerald-500)
                // PERFORMANCE: Zoom-dependent line width for highlight - scales with zoom
                'line-width': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10, 2,    // Thinner at zoom 10
                  12, 2.5,  // Slightly thicker at zoom 12
                  14, 3,    // Medium at zoom 14
                  16, 3.5   // Thicker at zoom 16+
                ],
                'line-opacity': 1
              },
              filter: ['==', ['get', 'Ward'], ''] // Start with no ward selected
            }, labelLayerId);
            console.log('✅ Ward highlight layer added (bright green boundary for selected ward, minzoom: 10, zoom-dependent width)');
          }
        } catch (error) {
          console.error('❌ Error adding ward highlight layer:', error);
        }

        
        // Add ward number labels using Ward_Point layer (centroids)
        const wardLabelLayerId = 'ward-labels';
        const wardPointSourceId = 'ward-points';
        
        // Fetch Ward_Point GeoJSON data (centroids of ward boundaries)
        // Apply the same filters as the boundary layer
        let WARD_POINT_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Barangay_Boundary_Point&outputFormat=application/json&srsName=EPSG:4326';
        
        // Build CQL filter for ward labels (same as boundary filter)
        const labelFilters: string[] = [];
        
        // Add barangay filter if a specific barangay is selected
        if (selectedWardId && selectedWardId !== 'all') {
          labelFilters.push(`BrgyID='${selectedWardId}'`);
          console.log(`🔍 Applying Barangay filter to ward labels (BrgyID): ${selectedWardId}`);
        }
        
        // Add LGU filter to ward point labels if an LGU is selected (and no specific barangay)
        if (selectedLguName && selectedLguName !== 'all' && (!selectedWardId || selectedWardId === 'all')) {
          const escapedLguName = selectedLguName.replace(/'/g, "''");
          labelFilters.push(`MunName='${escapedLguName}'`);
          console.log(`🔍 Applying LGU filter to ward labels: ${selectedLguName}`);
        }
        
        // Combine filters
        if (labelFilters.length > 0) {
          const combinedLabelFilter = labelFilters.join(' AND ');
          WARD_POINT_WFS_URL += `&CQL_FILTER=${encodeURIComponent(combinedLabelFilter)}`;
          console.log(`📡 Filtered Ward Point URL: ${WARD_POINT_WFS_URL}`);
        }
        
        fetchWithTimeout(WARD_POINT_WFS_URL, { timeout: 5000 })
          .then(wardPointResponse => {
            if (!wardPointResponse.ok) {
              console.warn('⚠️ Ward_Point WFS request failed, skipping ward labels');
              return;
            }
            return wardPointResponse.json();
          })
          .then(wardPointGeojson => {
            if (!wardPointGeojson) return;
            
            // Store ward point data in ref for re-adding after basemap changes
            if (wardPointDataRef) {
              wardPointDataRef.current = wardPointGeojson;
            }
            
            // Add Ward_Point source or update if it exists
            const existingPointSource = map.getSource(wardPointSourceId) as maplibregl.GeoJSONSource;
            
            if (existingPointSource) {
              // Source exists - update its data with the new filtered GeoJSON
              console.log(`🔄 Updating existing ward point source with filtered data (${wardPointGeojson.features?.length || 0} features)`);
              existingPointSource.setData(wardPointGeojson);
              console.log('✅ Ward_Point source updated with new data');
            } else {
              // Source doesn't exist - add it
              map.addSource(wardPointSourceId, {
                type: 'geojson',
                data: wardPointGeojson
              });
              console.log('✅ Ward_Point source added');
            }
            
            // Add ward label layer using Ward_Point source
            if (!map.getLayer(wardLabelLayerId)) {
              map.addLayer({
                id: wardLabelLayerId,
                type: 'symbol',
                source: wardPointSourceId, // Use Ward_Point source (centroids)
                minzoom: 10,
                layout: {
                  'text-field': ['get', 'BrgyName'], // Use BrgyName field for barangay labels
                  'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                  'symbol-sort-key': 1,
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
              } as any); // No beforeId - add at current top
              console.log('✅ Ward labels added using Ward_Point layer (centroids)');
            }
          })
          .catch(error => {
            // Silently handle timeout/network errors - ward labels are optional for visualization
            const errorMsg = error instanceof Error ? error.message : String(error);
            if (!errorMsg.includes('timeout') && !errorMsg.includes('Failed to fetch')) {
              console.warn('⚠️ Ward label loading issue:', errorMsg);
            }
          });
        
        // 🔒 CRITICAL: ENFORCE STRICT LAYER ORDER
        // This ensures basemap labels are ALWAYS the topmost layer (priority 900)
        enforceStrictLayerOrder(map);
        console.log('✅ Strict layer order enforced - Basemap labels are topmost');
        
        // Clear loading state after ward boundaries are loaded
        if (setIsLayerLoading) {
          setIsLayerLoading(false);
        }
        
        // Add click event for ward popups - using custom React popup instead of MapLibre popup
        // IMPORTANT: Listen to FILL layer for better click detection (larger clickable area)
        // TOURISM DASHBOARD: Barangay click/popup disabled to prevent conflict with tourism point popups.
        // eslint-disable-next-line no-constant-condition
        if (false) map.on('click', wardFillLayerId, (e) => {
          // CRITICAL: If buildings layer is visible, completely block ward clicks
          // Buildings layer should always be clickable without ward interference
          const buildingsLayer = map.getLayer('buildings');
          if (buildingsLayer && map.getLayoutProperty('buildings', 'visibility') === 'visible') {
            console.log('🚫 Ward clicks disabled - Buildings layer is active');
            return; // Block all ward clicks when buildings are visible
          }
          
          // CRITICAL: If ANY road safety layer exists, completely block ward clicks
          // This ensures road safety lines are always clickable without ward interference
          const roadSafetyLayers = ['irap_vehicle', 'irap_motorcycle', 'irap_bicycle', 'irap_pedestrian'];
          const hasActiveRoadSafety = roadSafetyLayers.some(layerId => map.getLayer(layerId));
          
          if (hasActiveRoadSafety) {
            console.log('🚫 Ward clicks disabled - Road Safety layers are active');
            return; // Block all ward clicks when road safety is active
          }
          
          // Check if we clicked on a cluster or infrastructure point first
          const infrastructureLayers = [];
          if (map.getLayer('education-clusters')) infrastructureLayers.push('education-clusters');
          if (map.getLayer('education-clusters-pulse')) infrastructureLayers.push('education-clusters-pulse');
          if (map.getLayer('education-unclustered-point')) infrastructureLayers.push('education-unclustered-point');
          if (map.getLayer('healthcare-clusters')) infrastructureLayers.push('healthcare-clusters');
          if (map.getLayer('healthcare-clusters-pulse')) infrastructureLayers.push('healthcare-clusters-pulse');
          if (map.getLayer('healthcare-unclustered-point')) infrastructureLayers.push('healthcare-unclustered-point');
          // Tourism layers — clicking a tourism point should open the tourism popup, not the barangay popup
          ['tourism-sites-anchor', 'tourism-sites-secondary', 'tourism-sites-supportive', 'tourism-assets-premium', 'tourism-assets-quality'].forEach((id) => {
            if (map.getLayer(id)) infrastructureLayers.push(id);
          });
          
          if (infrastructureLayers.length > 0) {
            const clusterFeatures = map.queryRenderedFeatures(e.point, {
              layers: infrastructureLayers
            });
            
            // If we clicked on an infrastructure cluster or point, don't show ward popup
            if (clusterFeatures && clusterFeatures.length > 0) {
              console.log('🏥 Infrastructure layer clicked, skipping ward popup');
              return;
            }
          }
          
          console.log('🖱️  Ward clicked at:', e.lngLat);
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const properties = feature.properties;
            
            console.log('📋 Ward properties:', properties);
            console.log('📋 Available property keys:', Object.keys(properties));
            
            // Extract ward information (Bohol uses BrgyID as the unique identifier)
            const wardName = properties.Ward_Name || properties.WARD_NAME || properties.ward_name || 
                           properties.BrgyName || properties.Brgy_Name || properties.BRGYNAME || properties.brgy_name ||
                           properties.Name || properties.NAME || properties.name || 'Unknown Ward';
            // For Bohol, use BrgyID as the PRIMARY unique identifier (prevents duplicate name issues across LGUs)
            const wardNumber = properties.BrgyID || properties.Brgy_ID || properties.BRGYID || properties.brgy_id ||
                             properties.BrgyCode || properties.Brgy_Code || properties.BRGYCODE || properties.brgy_code ||
                             properties.BrgyName || properties.Brgy_Name || properties.BRGYNAME || properties.brgy_name ||
                             properties.Ward || properties.WARD || properties.ward ||
                             properties.Ward_No || properties.WARD_NO || properties.ward_no ||
                             properties.WardNo || properties.WARDNO || 'N/A';
            
            console.log('🔢 Extracted wardNumber (BrgyID):', wardNumber, 'Type:', typeof wardNumber);
            console.log('📛 Extracted wardName:', wardName);
            console.log('🆔 BrgyID from properties:', properties.BrgyID);
            
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
            console.log('🏢 Buildings field check:', {
              rawBuildings: properties.Buildings,
              extractedBuildings: buildings,
              allPropertyKeys: Object.keys(properties)
            });
            
            // Get both geographic and screen coordinates
            const point = map.project(e.lngLat);
            
            console.log('📍 Ward clicked at:', e.lngLat, 'screen:', point);
            
            // Close any open infrastructure popups
            if (setEducationPopupData) setEducationPopupData(null);
            if (setHealthcarePopupData) setHealthcarePopupData(null);
            
            // Clear location search when opening ward popup
            if (onLocationClear) {
              onLocationClear();
            }
            
            // Set popup data (React state) - this will trigger rendering of custom popup
            if (setWardPopupData) {
              setWardPopupData({
                wardName,
                wardNumber: String(wardNumber),
                population: population ? String(population) : undefined,
                area: area ? String(area) : undefined,
                density: density ? String(density) : undefined,
                households: households ? String(households) : undefined,
                buildings: buildings ? String(buildings) : undefined,
                zone: zone ? String(zone) : undefined,
                lguName: lguName ? String(lguName) : undefined,
                lng: e.lngLat.lng,
                lat: e.lngLat.lat,
                x: point.x,
                y: point.y
              });
              
              console.log('✅ Ward popup data set');
            }
            
            // Set selected ward number for highlighting
            if (setSelectedWardNumber) {
              setSelectedWardNumber(String(wardNumber));
              console.log('✅ Ward highlight set for ward:', wardNumber);
            }
          } else {
            console.warn('⚠️ Click detected but no features found');
          }
        });
        
        // Change cursor on hover (use fill layer for larger hover area)
        // TOURISM DASHBOARD: Disabled — barangay is not selectable so do not show pointer.
        // eslint-disable-next-line no-constant-condition
        if (false) map.on('mouseenter', wardFillLayerId, () => {
          // Don't show pointer cursor if buildings layer is visible
          const buildingsLayer = map.getLayer('buildings');
          if (buildingsLayer && map.getLayoutProperty('buildings', 'visibility') === 'visible') {
            return; // Don't change cursor when buildings are visible
          }
          
          // Don't show pointer cursor if road safety layers are active
          const roadSafetyLayers = ['irap_vehicle', 'irap_motorcycle', 'irap_bicycle', 'irap_pedestrian'];
          const hasActiveRoadSafety = roadSafetyLayers.some(layerId => map.getLayer(layerId));
          
          if (!hasActiveRoadSafety) {
            map.getCanvas().style.cursor = 'pointer';
          }
        });
        
        map.on('mouseleave', wardFillLayerId, () => {
          map.getCanvas().style.cursor = '';
        });
        
        console.log('✅ Ward click events added');
      } else {
        console.warn('⚠️ No features in WFS response, falling back to WMS');
        addWardBoundaryAsWMS(map);
      }
  }; // End of processWardBoundaries helper function
  
  // Helper function to handle fetch errors
  const handleError = (error: Error) => {
    const errorMsg = error.message || 'Unknown error';
    
    // Add context for timeout errors
    if (errorMsg.includes('timeout')) {
      console.error('❌ WFS loading failed - Request timed out after 60s');
      console.log('🔄 Falling back to WMS (raster) for ward boundaries...');
    } else {
      console.error('❌ WFS loading failed:', error);
      console.log('🔄 Falling back to WMS (raster) for ward boundaries...');
    }
    
    // Clear loading state on error
    if (setIsLayerLoading) {
      setIsLayerLoading(false);
    }
    
    // Clear the promise reference for this LGU
    const cacheKey = selectedLguName || 'all';
    wardBoundariesFetchPromise.delete(cacheKey);
    addWardBoundaryAsWMS(map);
  };
  
  // Create cache key based on LGU and Ward selection
  const cacheKey = `${selectedLguName || 'all'}_${selectedWardId || 'all'}`;
  console.log(`🔑 Cache key for barangay boundaries: "${cacheKey}"`);
  console.log(`📦 Cache has this key:`, wardBoundariesCache.has(cacheKey));
  console.log(`📦 All cached keys:`, Array.from(wardBoundariesCache.keys()));
  
  // PERFORMANCE: Check cache first before fetching
  if (wardBoundariesCache.has(cacheKey)) {
    console.log(`⚡ Using cached ward boundaries data for LGU: ${cacheKey} (instant load)`);
    processWardBoundaries(wardBoundariesCache.get(cacheKey));
    return;
  }
  
  // If already fetching, reuse the same promise to avoid duplicate requests
  if (wardBoundariesFetchPromise.has(cacheKey)) {
    console.log(`⏳ Ward boundaries fetch already in progress for LGU: ${cacheKey}, waiting...`);
    wardBoundariesFetchPromise.get(cacheKey)!.then(processWardBoundaries).catch(handleError);
    return;
  }
  
  console.log('📡 Fetching ward boundaries from WFS:', WFS_URL);
  
  // Helper function to attempt WFS fetch with retry logic
  const attemptWFSFetch = async (retryCount = 0): Promise<any> => {
    try {
      const response = await fetchWithTimeout(WFS_URL, {
        method: 'GET',
        timeout: 60000, // 60 second timeout for WFS request (increased from 30s)
      });
      
      console.log('📡 WFS Response status:', response.status);
      if (!response.ok) {
        throw new Error(`WFS request failed with status ${response.status}`);
      }
      
      // Parse JSON with error handling
      const geojson = await response.json().catch(jsonError => {
        console.error('❌ Failed to parse WFS response as JSON:', jsonError);
        throw new Error('Invalid WFS response: failed to parse JSON');
      });
      
      console.log('✅ WFS data loaded successfully');
      console.log(`📊 Fetched ${geojson?.features?.length || 0} barangay features for cache key: "${cacheKey}"`);
      
      // Validate the response before processing
      if (!geojson || typeof geojson !== 'object') {
        console.error('❌ WFS returned invalid data (not an object)');
        throw new Error('Invalid WFS response: expected GeoJSON object');
      }
      
      return geojson;
    } catch (error) {
      // Retry once if this is the first attempt and it's a timeout error
      if (retryCount === 0 && error instanceof Error && error.message.includes('timeout')) {
        console.warn('⚠️ First WFS attempt timed out, retrying once...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        return attemptWFSFetch(1);
      }
      throw error;
    }
  };
  
  // Fetch the GeoJSON from WFS with retry logic
  const fetchPromise = attemptWFSFetch()
    .then(geojson => {
      // PERFORMANCE: Cache the GeoJSON for future use with LGU-specific key
      wardBoundariesCache.set(cacheKey, geojson);
      wardBoundariesFetchPromise.delete(cacheKey); // Clear the promise reference
      processWardBoundaries(geojson);
      return geojson; // Return geojson so reused promises get the data
    })
    .catch(handleError);
  
  // Store the fetch promise with LGU-specific key
  wardBoundariesFetchPromise.set(cacheKey, fetchPromise);
}

// Fallback: Add ward boundary as WMS raster layer (without labels)
function addWardBoundaryAsWMS(map: maplibregl.Map) {
  // ⚠️ DEPRECATED: Old GIZ_BBSR:Ward_Boundary layer removed
  // Using Barangay_Boundary instead for Bohol (added via addBarangayBoundaryAsWFS function)
  console.warn('⚠️ Old Ward_Boundary layer disabled. Using Barangay_Boundary for Bohol.');
  return;
  
  // OLD CODE (GIZ_BBSR reference removed):
  // const WARD_BOUNDARY_WMS_URL = 'https://geoserver.azure.innpact.ai/geoserver/GIZ_BBSR/wms';
  // const wardLayerName = 'GIZ_BBSR:Ward_Boundary';
  // const wardLayerId = 'ward-boundaries';
  
  try {
    // Check if layer already exists
    if (map.getLayer(wardLayerId)) {
      console.log('✅ Ward Boundary WMS layer already exists, skipping');
      return;
    }
  } catch (error) {
    console.warn('⚠️ Error checking for existing layer:', error);
    return;
  }
  
  // Build WMS tile URL for ward boundaries
  const wardTileUrl = `${WARD_BOUNDARY_WMS_URL}?service=WMS&version=1.1.0&request=GetMap&layers=${encodeURIComponent(wardLayerName)}&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&styles=&format=image/png&transparent=true`;
  
  console.log('🏘️  Adding Ward Boundary as WMS (raster) layer');
  console.log('📡 WMS URL:', wardTileUrl);
  
  try {
    // Add ward boundary source only if it doesn't exist
    if (!map.getSource(wardLayerId)) {
      map.addSource(wardLayerId, {
        type: 'raster',
        tiles: [wardTileUrl],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 18
      });
      console.log('✅ Ward Boundary WMS source added');
    }
    
    // Add ward boundary layer (will always be on top)
    if (!map.getLayer(wardLayerId)) {
      map.addLayer({
        id: wardLayerId,
        type: 'raster',
        source: wardLayerId,
        minzoom: 10, // Only show at zoom 10+ (match GeoJSON behavior)
        paint: {
          'raster-opacity': 0.6, // Reduce opacity to make it less prominent
        }
      });
      console.log('✅ Ward Boundary WMS layer added (fallback raster mode, opacity 0.6)');
    }
  } catch (error) {
    console.error('❌ Error adding Ward Boundary WMS layer:', error);
    return;
  }
  
  // Add event listeners to monitor tile loading
  map.on('sourcedata', (e) => {
    if (e.sourceId === wardLayerId && e.isSourceLoaded) {
      console.log('✅ Ward Boundary WMS tiles loaded successfully');
    }
  });
  
  map.on('error', (e) => {
    if (e.sourceId === wardLayerId) {
      const errorDetails = {
        message: e.error?.message || 'Unknown error',
        status: e.error?.status || 'N/A',
      };
      console.error('❌ Ward Boundary WMS tile loading error:', errorDetails);
    }
  });
}

/**
 * Helper function to add Municipal Boundary layer (permanent overlay, always on top of ward boundary)
 * Similar to ward boundary but renders above it for administrative hierarchy
 */
function addMunicipalBoundaryLayer(map: maplibregl.Map, selectedLguName?: string, setIsLayerLoading?: (isLoading: boolean) => void) {
  // Set loading state
  if (setIsLayerLoading) {
    setIsLayerLoading(true);
  }
  
  // Validate map and style first
  if (!map || !map.getStyle()) {
    console.warn('⚠️ Map style not available yet in addMunicipalBoundaryLayer, skipping');
    if (setIsLayerLoading) {
      setIsLayerLoading(false);
    }
    return;
  }
  
  const municipalLayerId = 'municipal-boundary';
  const municipalBorderLayerId = 'municipal-boundary-border';
  const municipalLabelLayerId = 'municipal-labels';
  const municipalPointSourceId = 'municipal-points';
  
  console.log('🏛️  Adding Municipal Boundary layer (WFS vector)...');
  
  // Remove any existing layer/source first (in case of reload)
  try {
    if (map.getLayer(municipalLayerId)) {
      map.removeLayer(municipalLayerId);
      console.log('🗑️ Removed existing municipal boundary line layer');
    }
    if (map.getLayer(municipalBorderLayerId)) {
      map.removeLayer(municipalBorderLayerId);
      console.log('🗑️ Removed existing municipal boundary border layer');
    }
    if (map.getLayer(municipalLabelLayerId)) {
      map.removeLayer(municipalLabelLayerId);
      console.log('🗑️ Removed existing municipal labels layer');
    }
    if (map.getSource(municipalLayerId)) {
      map.removeSource(municipalLayerId);
      console.log('🗑️ Removed existing municipal boundary source');
    }
    if (map.getSource(municipalPointSourceId)) {
      map.removeSource(municipalPointSourceId);
      console.log('🗑️ Removed existing municipal points source');
    }
  } catch (e) {
    console.warn('⚠️ Error removing existing municipal boundary:', e);
  }
  
  // Fetch Municipal_Boundary GeoJSON from WFS
  let MUNICIPAL_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Municipal_Boundary&outputFormat=application/json&srsName=EPSG:4326';
  
  // Add LGU filter if an LGU is selected
  if (selectedLguName && selectedLguName !== 'all') {
    const escapedLguName = selectedLguName.replace(/'/g, "''");
    MUNICIPAL_WFS_URL += `&CQL_FILTER=${encodeURIComponent(`MunName='${escapedLguName}'`)}`;
    console.log(`🔍 Applying LGU filter to municipal boundaries: ${selectedLguName}`);
  }
  
  fetchWithTimeout(MUNICIPAL_WFS_URL, { timeout: 10000 })
    .then(response => {
      if (!response.ok) {
        console.warn('⚠️ Municipal Boundary WFS request failed');
        return;
      }
      return response.json();
    })
    .then(geojson => {
      if (!geojson || !geojson.features || geojson.features.length === 0) {
        console.warn('⚠️ Municipal Boundary GeoJSON is empty or invalid');
        return;
      }
      
      console.log(`✅ Municipal Boundary GeoJSON loaded: ${geojson.features.length} features`);
      
      // Extract ONLY the outer boundary line (not fill polygons)
      // Convert polygon features to LineString features to get only the boundary
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
      
      console.log('✅ Municipal Boundary converted to LineString (outer boundary only)');
      
      // Validate map still has style (but don't warn - this is expected during basemap changes)
      if (!map || !map.getStyle || !map.getStyle()) {
        console.log('ℹ️ Map style not ready during municipal boundary processing, will retry on next load');
        return;
      }
      
      // Add municipal boundary source with LINE data only
      if (!map.getSource(municipalLayerId)) {
        map.addSource(municipalLayerId, {
          type: 'geojson',
          data: boundaryLineGeoJSON,
          tolerance: 0.5,
          buffer: 0,
          lineMetrics: false
        });
        console.log('✅ Municipal Boundary source added (vector LineString only - no fill)');
      }
      
      // Add municipal boundary LINE layer only (pure vector, no fill)
      if (!map.getLayer(municipalLayerId)) {
        const labelLayerId = map.getLayer('labels') ? 'labels' : getFirstLabelLayerId(map);
        
        // First, add a white border/outline layer for better visibility on satellite
        const municipalBorderLayerId = municipalLayerId + '-border';
        if (!map.getLayer(municipalBorderLayerId)) {
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
              'line-opacity': 0.8
            }
          }, labelLayerId);
        }
        
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
            'line-opacity': 0.95
          }
        }, labelLayerId);
        console.log(`✅ Municipal Boundary line layer added with white border for satellite visibility`);
      }
      
      // Now fetch and add Municipal Boundary Point labels
      const municipalPointSourceId = 'municipal-points';
      let MUNICIPAL_POINT_WFS_URL = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Municipal_Boundary_Point&outputFormat=application/json&srsName=EPSG:4326';
      
      // Add LGU filter if an LGU is selected
      if (selectedLguName && selectedLguName !== 'all') {
        const escapedLguName = selectedLguName.replace(/'/g, "''");
        MUNICIPAL_POINT_WFS_URL += `&CQL_FILTER=${encodeURIComponent(`MunName='${escapedLguName}'`)}`;
      }
      
      fetchWithTimeout(MUNICIPAL_POINT_WFS_URL, { timeout: 10000 })
        .then(response => {
          if (!response.ok) {
            console.warn('⚠️ Municipal_Boundary_Point WFS request failed, skipping municipal labels');
            return;
          }
          return response.json();
        })
        .then(municipalPointGeoJSON => {
          if (!municipalPointGeoJSON || !municipalPointGeoJSON.features) {
            console.warn('⚠️ Municipal_Boundary_Point GeoJSON is empty or invalid');
            return;
          }
          
          // Validate map still exists before trying to use it
          if (!map || !map.getStyle || !map.getStyle()) {
            console.warn('⚠️ Map no longer exists, skipping Municipal_Boundary_Point labels');
            return;
          }
          
          console.log(`✅ Municipal_Boundary_Point GeoJSON loaded: ${municipalPointGeoJSON.features.length} features`);
          
          // Remove existing municipal point source if it exists
          if (map.getSource(municipalPointSourceId)) {
            if (map.getLayer(municipalLabelLayerId)) {
              map.removeLayer(municipalLabelLayerId);
            }
            map.removeSource(municipalPointSourceId);
          }
          
          // Add Municipal_Boundary_Point source
          if (!map.getSource(municipalPointSourceId)) {
            map.addSource(municipalPointSourceId, {
              type: 'geojson',
              data: municipalPointGeoJSON
            });
          }
          
          // Add municipal label layer using Municipal_Boundary_Point source
          if (!map.getLayer(municipalLabelLayerId)) {
            map.addLayer({
              id: municipalLabelLayerId,
              type: 'symbol',
              source: municipalPointSourceId,
              minzoom: 9,
              layout: {
                'text-field': ['get', 'MunName'], // Use MunName field for labels
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  9, 11,
                  12, 13,
                  14, 15,
                  16, 17
                ],
                'text-anchor': 'center',
                'text-offset': [0, 0],
                'text-allow-overlap': true, // Allow municipal labels to show even if overlapping other labels
                'text-ignore-placement': true // Don't let other labels prevent municipal labels from showing
              },
              paint: {
                'text-color': '#1F2937', // Dark grey text
                'text-halo-color': '#FFFFFF',
                'text-halo-width': 2,
                'text-halo-blur': 1,
                'text-opacity': 1
              }
            } as any);
            console.log('✅ Municipal labels added using Municipal_Boundary_Point layer (centroids)');
          }
        })
        .catch(error => {
          // Silently handle timeout/network errors - municipal labels are optional for visualization
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (!errorMsg.includes('timeout') && !errorMsg.includes('Failed to fetch')) {
            console.warn('⚠️ Municipal label loading issue:', errorMsg);
          }
        });
      
      // Enforce layer order to ensure municipal boundary is above ward boundary
      enforceStrictLayerOrder(map);
      
      // Clear loading state after municipal boundaries are loaded
      if (setIsLayerLoading) {
        setIsLayerLoading(false);
      }
    })
    .catch(error => {
      // Silently handle fetch errors - expected when backend is unavailable
      console.log('ℹ️  Municipal boundary layer not available (backend not connected)');
      
      // Clear loading state on error
      if (setIsLayerLoading) {
        setIsLayerLoading(false);
      }
    });
}

// Helper function to ensure buildings layer stays above hazard layers
function ensureBuildingsAboveHazardLayers(map: maplibregl.Map) {
  const buildingsLayerId = 'buildings';
  const buildingsFillLayerId = 'buildings-fill';
  const buildingsHighlightLayerId = 'buildings-highlight';
  
  // Check if map style is loaded
  if (!map.getStyle() || !map.getStyle().layers) {
    return;
  }
  
  // Only proceed if buildings layers exist
  if (!map.getLayer(buildingsLayerId)) {
    return;
  }
  
  console.log('🔧 ensureBuildingsAboveHazardLayers() called - Moving buildings above hazard layers but below slum/ward/infrastructure');
  
  // Find reference layers for positioning
  // Order should be: hazards → buildings → slum → ward boundaries → infrastructure points → labels
  const slumLayerId = 'slum_settlements';
  const wardFillLayerId = 'ward-boundaries-fill';
  const labelLayerId = map.getLayer('labels') ? 'labels' : getFirstLabelLayerId(map);
  
  // Determine where to position buildings (just before slum, wards, or labels - whichever exists first)
  let beforeLayerId = labelLayerId; // default to labels
  
  // If slum exists, position buildings before slum
  if (map.getLayer(slumLayerId)) {
    beforeLayerId = slumLayerId;
    console.log('📍 Positioning buildings before slum layer');
  }
  // Otherwise if ward boundaries exist, position buildings before wards
  else if (map.getLayer(wardFillLayerId)) {
    beforeLayerId = wardFillLayerId;
    console.log('📍 Positioning buildings before ward boundaries');
  }
  
  if (beforeLayerId) {
    // Move buildings layers to correct position
    // Order: hazards → buildings → slum → wards → infrastructure → labels
    if (map.getLayer(buildingsFillLayerId)) {
      try {
        map.moveLayer(buildingsFillLayerId, beforeLayerId);
        console.log(`✅ Buildings fill layer moved before ${beforeLayerId}`);
      } catch (e) {
        console.warn('⚠️ Could not move buildings fill layer:', e);
      }
    }
    
    if (map.getLayer(buildingsLayerId)) {
      try {
        map.moveLayer(buildingsLayerId, beforeLayerId);
        console.log(`✅ Buildings line layer moved before ${beforeLayerId}`);
      } catch (e) {
        console.warn('⚠️ Could not move buildings line layer:', e);
      }
    }
    
    if (map.getLayer(buildingsHighlightLayerId)) {
      try {
        map.moveLayer(buildingsHighlightLayerId, beforeLayerId);
        console.log(`✅ Buildings highlight layer moved before ${beforeLayerId}`);
      } catch (e) {
        console.warn('⚠️ Could not move buildings highlight layer:', e);
      }
    }
  } else {
    // No reference layer found, move to top
    if (map.getLayer(buildingsFillLayerId)) {
      try {
        map.moveLayer(buildingsFillLayerId);
        console.log(`✅ Buildings fill layer moved to top (no reference layer found)`);
      } catch (e) {
        console.warn('⚠️ Could not move buildings fill layer:', e);
      }
    }
    
    if (map.getLayer(buildingsLayerId)) {
      try {
        map.moveLayer(buildingsLayerId);
        console.log(`✅ Buildings line layer moved to top (no reference layer found)`);
      } catch (e) {
        console.warn('⚠️ Could not move buildings line layer:', e);
      }
    }
    
    if (map.getLayer(buildingsHighlightLayerId)) {
      try {
        map.moveLayer(buildingsHighlightLayerId);
        console.log(`✅ Buildings highlight layer moved to top (no reference layer found)`);
      } catch (e) {
        console.warn('⚠️ Could not move buildings highlight layer:', e);
      }
    }
  }
}

// Helper function to ensure ward boundaries stay below labels but above hazard layers
// CRITICAL: Ward boundaries ALWAYS on top of hazard layers (only one hazard layer loads at a time)
function ensureWardBoundariesOnTop(map: maplibregl.Map) {
  const wardFillLayerId = 'ward-boundaries-fill';
  const wardLayerId = 'ward-boundaries';
  const wardLabelLayerId = 'ward-labels';
  const wardHighlightLayerId = 'ward-boundaries-highlight';
  const roadNetworkLayerIds = ['road_network_link', 'road_network_major', 'road_network_state', 'road_network_national'];
  
  console.log('🔧 ensureWardBoundariesOnTop() called - Ward boundaries ALWAYS above hazard layers');
  
  // Check if map style is loaded
  if (!map.getStyle() || !map.getStyle().layers) {
    console.log('⏸️ Map style not loaded yet, skipping ward boundary repositioning');
    return;
  }
  
  console.log('📊 Current map layers:', map.getStyle().layers?.map(l => l.id) || []);
  
  // Determine the label layer to position ward boundaries before
  // For satellite basemap, use 'labels' raster layer
  // For other basemaps, use first symbol layer
  let labelLayerId = map.getLayer('labels') ? 'labels' : getFirstLabelLayerId(map);
  
  console.log(`🎯 Target label layer: ${labelLayerId || 'NONE'}`);
  console.log(`✅ Ward layers exist: fill=${!!map.getLayer(wardFillLayerId)}, line=${!!map.getLayer(wardLayerId)}, highlight=${!!map.getLayer(wardHighlightLayerId)}, labels=${!!map.getLayer(wardLabelLayerId)}`);
  console.log(`✅ Road network layers exist: ${roadNetworkLayerIds.map(id => !!map.getLayer(id)).join(', ')}`);
  
  // Only reorder if layers actually exist (they load asynchronously via WFS)
  if (map.getLayer(wardFillLayerId) && labelLayerId) {
    // First, ensure all road network layers are positioned just before ward fill (if they exist)
    // This keeps road network above all hazard layers but below ward boundaries
    roadNetworkLayerIds.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.moveLayer(layerId, wardFillLayerId);
        console.log(`✅ Road network layer ${layerId} repositioned just before ward fill`);
      }
    });
    
    // Move fill layer right before labels (for clickability)
    map.moveLayer(wardFillLayerId, labelLayerId);
    console.log(`✅ Ward Boundary fill layer repositioned before ${labelLayerId}`);
    
    // Move line layer right before labels (above fill but below labels)
    if (map.getLayer(wardLayerId)) {
      map.moveLayer(wardLayerId, labelLayerId);
      console.log(`✅ Ward Boundary line layer repositioned before ${labelLayerId}`);
    }
    
    // Move highlight layer right before labels (above line layer, below labels) - THIS IS THE KEY FIX
    if (map.getLayer(wardHighlightLayerId)) {
      map.moveLayer(wardHighlightLayerId, labelLayerId);
      console.log(`✅ Ward highlight layer (blue boundary) repositioned before ${labelLayerId} - NOW ON TOP!`);
    }
    
    // Move ward label layer right before basemap labels
    if (map.getLayer(wardLabelLayerId)) {
      map.moveLayer(wardLabelLayerId, labelLayerId);
      console.log(`✅ Ward label layer repositioned before ${labelLayerId}`);
    }
    
    // Log final layer order
    console.log('📊 Final layer order:', map.getStyle().layers?.map(l => l.id) || []);
  } else if (map.getLayer(wardFillLayerId) && !labelLayerId) {
    // No label layer found, but ward boundaries exist
    // Still ensure road network is below ward boundaries
    roadNetworkLayerIds.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.moveLayer(layerId, wardFillLayerId);
        console.log(`✅ Road network layer ${layerId} repositioned just before ward fill (no label layer)`);
      }
    });
    console.log('ℹ️  Ward boundaries already on top (no label layer to position before)');
    console.log('📊 Current layer order:', map.getStyle().layers?.map(l => l.id) || []);
  } else {
    console.log('⏳ Ward boundaries not yet loaded, skipping reorder');
  }
}

// Helper function to ensure infrastructure layers (education, healthcare, etc.) stay on top
function ensureInfrastructureLayersOnTop(map: maplibregl.Map) {
  // Safety check: Ensure map style is fully loaded
  if (!map || !map.getStyle || !map.getStyle()) {
    console.log('⏳ Map style not yet loaded, skipping infrastructure layer reordering');
    return;
  }

  // Road safety layers - HIGHEST PRIORITY (just below basemap labels)
  const roadSafetyLayerIds = [
    'irap_vehicle',
    'irap_motorcycle',
    'irap_bicycle',
    'irap_pedestrian'
  ];
  
  // Infrastructure cluster layers - ABOVE ward boundaries and road network
  const infrastructureLayerIds = [
    'education-clusters-pulse',
    'education-clusters',
    'education-cluster-count',
    'education-unclustered-point',
    'healthcare-clusters-pulse',
    'healthcare-clusters',
    'healthcare-cluster-count',
    'healthcare-unclustered-point',
    'public-amenities-clusters-pulse',
    'public-amenities-clusters',
    'public-amenities-cluster-count',
    'public-amenities-unclustered-point',
    'transport-clusters-pulse',
    'transport-clusters',
    'transport-cluster-count',
    'transport-unclustered-point'
  ];
  
  console.log('🔧 ensureInfrastructureLayersOnTop() called');
  
  // Find the basemap labels layer first
  const labelLayerId = map.getLayer('labels') ? 'labels' : getFirstLabelLayerId(map);
  
  // STRATEGY: Position infrastructure ABOVE ward boundaries/road network but BELOW road safety/labels
  // Desired order (bottom to top):
  // 1. Basemap + hazard layers
  // 2. Road network
  // 3. Ward boundaries
  // 4. Infrastructure points ← WE WANT THEM HERE
  // 5. Road safety
  // 6. Basemap labels
  
  // Find a reference layer to position infrastructure relative to
  let positionBeforeLayer = labelLayerId; // Default: before labels
  
  // If road safety exists, position infrastructure before it
  const firstRoadSafetyLayer = roadSafetyLayerIds.find(id => map.getLayer(id));
  if (firstRoadSafetyLayer) {
    positionBeforeLayer = firstRoadSafetyLayer;
    console.log(`🎯 Positioning infrastructure before road safety layer: ${firstRoadSafetyLayer}`);
  }
  
  // STEP 1: Move infrastructure clusters ABOVE ward boundaries
  infrastructureLayerIds.forEach(layerId => {
    if (map.getLayer(layerId)) {
      if (positionBeforeLayer) {
        map.moveLayer(layerId, positionBeforeLayer);
        console.log(`✅ Infrastructure layer ${layerId} moved before ${positionBeforeLayer} (ABOVE ward/road)`);
      } else {
        map.moveLayer(layerId);
        console.log(`✅ Infrastructure layer ${layerId} moved to absolute top`);
      }
    }
  });
  
  // STEP 2: Move road safety layers LAST (so they end up just below labels, above everything else)
  roadSafetyLayerIds.forEach(layerId => {
    if (map.getLayer(layerId)) {
      if (labelLayerId) {
        map.moveLayer(layerId, labelLayerId);
        console.log(`✅ Road safety layer ${layerId} moved just before ${labelLayerId} - ALWAYS ON TOP!`);
      } else {
        map.moveLayer(layerId);
        console.log(`✅ Road safety layer ${layerId} moved to absolute top`);
      }
    }
  });
  
  // Log final order to verify layers are correctly positioned
  const allLayers = map.getStyle().layers?.map(l => l.id) || [];
  const wardLabelIndex = allLayers.indexOf('ward-labels');
  const wardFillIndex = allLayers.indexOf('ward-boundaries-fill');
  const eduClusterIndex = allLayers.indexOf('education-clusters');
  const roadSafetyVehicleIndex = allLayers.indexOf('irap_vehicle');
  const basemapLabelIndex = labelLayerId ? allLayers.indexOf(labelLayerId) : -1;
  
  console.log(`📊 Final layer order:`);
  if (wardFillIndex !== -1) console.log(`   - ward-boundaries-fill at index ${wardFillIndex}`);
  if (wardLabelIndex !== -1) console.log(`   - ward-labels at index ${wardLabelIndex}`);
  if (eduClusterIndex !== -1) console.log(`   - education-clusters at index ${eduClusterIndex}`);
  if (roadSafetyVehicleIndex !== -1) console.log(`   - irap_vehicle (road safety) at index ${roadSafetyVehicleIndex}`);
  if (basemapLabelIndex !== -1) console.log(`   - basemap labels at index ${basemapLabelIndex}`);
  
  if (wardFillIndex !== -1 && roadSafetyVehicleIndex !== -1) {
    console.log(`   ${roadSafetyVehicleIndex > wardFillIndex ? '✅ CORRECT: Road safety above ward fill' : '❌ WRONG: Ward fill above road safety - NOT CLICKABLE!'}`);
  }
  
  if (roadSafetyVehicleIndex !== -1 && basemapLabelIndex !== -1) {
    console.log(`   ${roadSafetyVehicleIndex < basemapLabelIndex && basemapLabelIndex - roadSafetyVehicleIndex === 1 ? '✅ PERFECT: Road safety directly below basemap labels!' : 'ℹ️  Road safety position relative to labels'}`);
  }
}

// Helper function to create ward popup content
function createWardPopupContent(properties: any): string {
  // Extract barangay name from various possible field names
  const barangayName = properties.BrgyName || properties.BRGYNAME || properties.brgyname || properties.Barangay || properties.BARANGAY || properties.barangay || 'Unknown';
  const lguName = properties.MunName || properties.MUNNAME || properties.munname || properties.Municipality || 'Unknown';
  const zone = properties.Zone || properties.ZONE || properties.zone || 'Bohol';
  const population2024 = properties.Pop_2024 || properties.POP_2024 || properties.pop_2024 || 'N/A';
  const area = properties.Area || properties.AREA || properties.area || null;
  const households = properties.Households || properties.HOUSEHOLDS || properties.households || null;
  const buildings = properties.Buildings || properties.BUILDINGS || properties.buildings || properties.Building_Count || 'N/A';
  
  // Format population number
  const formatPopulation = (pop: any) => {
    if (pop === null || pop === undefined || pop === 'N/A') return 'N/A';
    const num = typeof pop === 'string' ? parseInt(pop.replace(/,/g, '')) : pop;
    return num.toLocaleString();
  };
  
  return `
    <div style="background: white; border-radius: 8px; overflow: hidden; font-family: Inter, system-ui, sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.08); width: 220px;">
      <div style="padding: 8px 10px; background: linear-gradient(to bottom right, rgba(37, 99, 235, 0.05) 0%, rgba(30, 64, 175, 0.05) 100%); border-bottom: 1px solid #E5E7EB;">
        <!-- Barangay Header -->
        <div style="display: flex; align-items: flex-start; gap: 6px; margin-bottom: 6px;">
          <div style="width: 20px; height: 20px; border-radius: 6px; background: linear-gradient(to bottom right, #2563EB 0%, #1E40AF 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div style="flex: 1; min-width: 0;">
            <h3 style="font-size: 12px; font-weight: 600; color: #0F172A; line-height: 1.2; margin: 0 0 1px 0;">${barangayName}</h3>
            <p style="font-size: 9px; color: #64748B; line-height: 1.2; margin: 0;">${zone}</p>
          </div>
        </div>
        
        <!-- Key Stats - Horizontal Layout -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
          <div style="background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(4px); border-radius: 5px; padding: 5px 7px; border: 1px solid rgba(229, 231, 235, 0.5);">
            <div style="font-size: 8px; color: #64748B; margin-bottom: 2px;">Population - 2024</div>
            <div style="font-size: 11px; font-weight: 600; color: #1F2937; line-height: 1.2;">
              ${formatPopulation(population2024)}
            </div>
          </div>
          <div style="background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(4px); border-radius: 5px; padding: 5px 7px; border: 1px solid rgba(229, 231, 235, 0.5);">
            <div style="font-size: 8px; color: #64748B; margin-bottom: 2px;">Buildings</div>
            <div style="font-size: 11px; font-weight: 600; color: #2563EB; line-height: 1.2;">
              ${typeof buildings === 'number' ? buildings.toLocaleString() : buildings}
            </div>
          </div>
        </div>
      </div>
      ${area || households ? `
        <div style="padding: 8px 10px; font-size: 9px; color: #475569; border-top: 1px solid #F1F5F9;">
          ${area ? `<div style="margin-bottom: 3px;">Area: <span style="font-weight: 600; color: #1E293B;">${area}</span></div>` : ''}
          ${households ? `<div>Households: <span style="font-weight: 600; color: #1E293B;">${households}</span></div>` : ''}
        </div>
      ` : ''}
      <div style="padding: 6px 10px; background: #F8FAFC; border-top: 1px solid #E5E7EB; font-size: 9px; color: #64748B; text-align: center;">
        ${lguName}
      </div>
    </div>
  `;
}
