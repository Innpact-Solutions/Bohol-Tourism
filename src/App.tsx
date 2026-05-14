import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { Header } from './components/Header';
import { LeftDrawer } from './components/LeftDrawer';
import { ModuleNavigationTabs, type CWISModule } from './components/ModuleNavigationTabs';
import { ModulePanel, DEFAULT_FSTP_LAYERS } from './components/ModulePanel';
import type { FstpFacilityState } from './components/ModulePanel';
import { FloatingLegendPanel } from './components/FloatingLegendPanel';
import { MapCanvas } from './components/MapCanvas';
import { RightPanelContainer } from './components/RightPanelContainer';
import { WardFilterBar } from './components/WardFilterBar';
import { Footer } from './components/Footer';
import { AlertsPanel } from './components/AlertsPanel';
import { InfoModal } from './components/InfoModal';
import { ComparisonView } from './components/ComparisonView';
import { TutorialOverlay } from './components/TutorialOverlay';
import { Toaster } from './components/ui/sonner';
import { fetchUniqueHealthcareCategories } from './utils/healthcareData';
import { getLayerNameForScenario } from './config/geoserverLayers';
import { HazardDataProvider, useHazardData } from './contexts/HazardDataContext';
import { loadLegendDefinitions } from './utils/legendLoader';
import { fetchEducationCounts } from './utils/educationData';
import { fetchHealthcareCounts } from './utils/healthcareData';
import { fetchPublicAmenitiesCounts } from './utils/publicAmenitiesData';
import { fetchTransportCounts } from './utils/transportData';
import { fetchRoadSafetyStarRatings, fetchRoadSafetyBounds } from './utils/roadSafetyData';
import { fetchRoadNetworkLengths } from './utils/roadNetworkData';

export type Sector = 'heat' | 'air' | 'flood' | 'multihazard' | 'roadsafety' | 'base_layers' | 'climate_hazard' | 'env_vulnerability';
export type Scenario = 'baseline_2025' | 'ssp1_2040' | 'ssp2_2040' | 'ssp5_2040' | '2015' | '2016' | '2017' | '2018' | '2019' | '2020' | '2021' | '2022' | '2023' | '2024';
export type Basemap = 'light' | 'dark' | 'satellite';

function AppContent({
  onCompareModeChange,
  basemap,
  onBasemapChange,
  selectedWardId,
  selectedWardName,
  onSelectedWardIdChange,
  selectedLguId,
  selectedLguName,
  onSelectedLguIdChange,
  compareLeftSector,
  compareLeftLayer,
  compareLeftScenario,
  compareRightSector,
  compareRightLayer,
  compareRightScenario,
  onCompareLeftSectorChange,
  onCompareLeftLayerChange,
  onCompareLeftScenarioChange,
  onCompareRightSectorChange,
  onCompareRightLayerChange,
  onCompareRightScenarioChange,
  showTutorial,
  onTutorialRestart,
  onTutorialClose,
  showTutorialPulse,
  tutorialToggle3D,
  onTutorialToggle3DChange,
  tutorialRoadSafetyExpanded,
  onTutorialRoadSafetyChange,
  tutorialInfraExpanded,
  onTutorialInfraExpandedChange,
  tutorialBuildingPopup,
  onTutorialBuildingPopupChange
}: {
  onCompareModeChange: (mode: boolean) => void;
  basemap: Basemap;
  onBasemapChange: (basemap: Basemap) => void;
  selectedWardId: string;
  selectedWardName: string;
  onSelectedWardIdChange: (wardId: string, wardName: string, munName?: string) => void;
  selectedLguId: string;
  selectedLguName: string;
  onSelectedLguIdChange: (lguId: string, lguName: string) => void;
  compareLeftSector: Sector;
  compareLeftLayer: string;
  compareLeftScenario: Scenario;
  compareRightSector: Sector;
  compareRightLayer: string;
  compareRightScenario: Scenario;
  onCompareLeftSectorChange: (sector: Sector) => void;
  onCompareLeftLayerChange: (layer: string) => void;
  onCompareLeftScenarioChange: (scenario: Scenario) => void;
  onCompareRightSectorChange: (sector: Sector) => void;
  onCompareRightLayerChange: (layer: string) => void;
  onCompareRightScenarioChange: (scenario: Scenario) => void;
  showTutorial?: boolean;
  onTutorialRestart?: () => void;
  onTutorialClose?: () => void;
  showTutorialPulse?: boolean;
  tutorialToggle3D?: boolean | undefined;
  onTutorialToggle3DChange?: (enabled: boolean | undefined) => void;
  tutorialRoadSafetyExpanded?: boolean | undefined;
  onTutorialRoadSafetyChange?: (expanded: boolean | undefined) => void;
  tutorialInfraExpanded?: boolean | undefined;
  onTutorialInfraExpandedChange?: (expanded: boolean | undefined) => void;
  tutorialBuildingPopup?: [number, number] | null;
  onTutorialBuildingPopupChange?: (coords: [number, number] | null) => void;
}) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Check if hazard data is still loading (but don't block UI)
  const { isLoading: hazardDataLoading, isInitialLoad, refreshData } = useHazardData();
  
  console.log('🏢 Tutorial building popup prop received:', tutorialBuildingPopup);

  // All useState hooks MUST be called before any returns
  const [activeSector, setActiveSector] = useState<Sector>('heat');
  const [activeModule, setActiveModule] = useState<CWISModule>(null); // CWIS module state - default is null (no module active)
  const [activeFstpLayers, setActiveFstpLayers] = useState<FstpFacilityState[]>(DEFAULT_FSTP_LAYERS);
  const [showFstpBuildings, setShowFstpBuildings] = useState(false);
  const [activeFleetClasses, setActiveFleetClasses] = useState<string[]>(['10 KL Truck', '5 KL Truck', 'With Booster Pump', 'Hard to Access']);
  const [fleetOpacity, setFleetOpacity] = useState(0.75);
  const [fstpOpacity, setFstpOpacity] = useState(0.75);

  // Mutual exclusivity: fleet accessibility ↔ desludging travel time
  const handleFleetClassesChange = (classes: string[]) => {
    setActiveFleetClasses(classes);
    if (classes.length > 0) {
      setActiveFstpLayers(prev => prev.map(f => ({ ...f, enabled: false })));
      setShowFstpBuildings(false);
    }
  };
  const handleFstpLayersChange = (layers: FstpFacilityState[]) => {
    setActiveFstpLayers(layers);
    if (layers.some(f => f.enabled)) {
      setActiveFleetClasses([]);
    }
  };
  const [activeLayerPerSector, setActiveLayerPerSector] = useState({
    heat: 'heat_hhi',
    air: 'air_aqi',
    flood: 'flood_fhi',
    multihazard: 'multihazard_assessment',
    roadsafety: ''  // Road safety doesn't use hazard layers
  });
  const [scenario, setScenario] = useState<Scenario>('baseline_2025');
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [selectedWardDetails, setSelectedWardDetails] = useState<any>(null);
  const [activeEducationSubLayers, setActiveEducationSubLayers] = useState<string[]>([]);
  const [activeHealthcareSubLayers, setActiveHealthcareSubLayers] = useState<string[]>([]);
  const [activePublicAmenitiesSubLayers, setActivePublicAmenitiesSubLayers] = useState<string[]>([]);
  const [activeTransportSubLayers, setActiveTransportSubLayers] = useState<string[]>([]);
  
  // ROAD SAFETY MAIN PANEL STATE (activeSector === 'roadsafety')
  // Independent state for Road Safety main hazard panel
  const [rsMainActiveLayer, setRsMainActiveLayer] = useState<string[]>([]); // Start empty - only activate when user enters Road Safety sector
  const [rsMainIRAPType, setRsMainIRAPType] = useState<string | null>(null);
  const [rsMainStarRatings, setRsMainStarRatings] = useState<Record<string, string | null>>({
    irap_vehicle: null,
    irap_motorcycle: null,
    irap_bicycle: null,
    irap_pedestrian: null
  });
  
  // Donut chart filter state - for highlighting specific categories on the map
  const [selectedDonutCategory, setSelectedDonutCategory] = useState<string | null>(null);
  
  // CROSS-HAZARD PANELS STATE (Heat, Air, Flood, Multi-Hazard)
  // Shared state across Heat/Air/Flood/Multi-Hazard panels - persists when switching between them
  const [rsXHazardActiveLayer, setRsXHazardActiveLayer] = useState<string[]>([]);
  const [rsXHazardIRAPType, setRsXHazardIRAPType] = useState<string | null>(null);
  const [rsXHazardStarRatings, setRsXHazardStarRatings] = useState<Record<string, string | null>>({
    irap_vehicle: null,
    irap_motorcycle: null,
    irap_bicycle: null,
    irap_pedestrian: null
  });
  
  // DEPRECATED: These will be removed after migration
  const [activeRoadNetworkIRAPType, setActiveRoadNetworkIRAPType] = useState<string | null>(null);
  const [activeRoadSafetySubLayers, setActiveRoadSafetySubLayers] = useState<string[]>([]);
  const [roadSafetyStarRatings, setRoadSafetyStarRatings] = useState<Record<string, string | null>>({
    irap_vehicle: null,
    irap_motorcycle: null,
    irap_bicycle: null,
    irap_pedestrian: null
  }); // Track star rating filter for each road safety layer (1-5 stars or null for all)
  
  const [activeInfraLayers, setActiveInfraLayers] = useState<string[]>([]);
  const [activeSubLayers, setActiveSubLayers] = useState<string[]>([]);
  const [sectorOpacity, setSectorOpacity] = useState(0.7);
  const [showQueryPanel, setShowQueryPanel] = useState(false);
  const [activeBaseLayers, setActiveBaseLayers] = useState<string[]>(['ward_boundary', 'waterbody', 'road_network_base', 'municipal_boundary', 'buildings']); // Added 'buildings' to default layers
  const [activeBuildingCategories, setActiveBuildingCategories] = useState<string[]>(['residential', 'commercial', 'education', 'government', 'health', 'religious', 'industrial', 'transport']); // Building Use layer on by default
  const [activeBuildingSubcategories, setActiveBuildingSubcategories] = useState<string[]>([]); // Active building subcategories (BLDG_USE values)
  const [previousBuildingCategories, setPreviousBuildingCategories] = useState<string[]>([]); // Store previous state before subcategory selection
  const [isEconomicVulnerabilityActive, setIsEconomicVulnerabilityActive] = useState(false); // Economic Vulnerability layer state
  const [activeBuildingHeightCategories, setActiveBuildingHeightCategories] = useState<string[]>([]); // Building Height layer active categories
  const [activeBuildingAreaCategories, setActiveBuildingAreaCategories] = useState<string[]>([]); // Building Floor Area active categories
  const [activeSewerCategories, setActiveSewerCategories] = useState<string[]>([]); // Sewer feasibility categories for Module 1 building filter
  const [activeGridSewerCategories] = useState<string[]>([]); // kept for MapCanvas prop compatibility (unused)
  const [scenarioGridGeoJSON, setScenarioGridGeoJSON] = useState<any | null>(null); // Module 1 scenario result overlay
  const [scenarioNetworkGids, setScenarioNetworkGids] = useState<number[] | null>(null); // Grid GIDs qualifying for network coverage
  const [bufferBldgIds, setBufferBldgIds] = useState<number[]>([]); // Building IDs within 120m buffer zone
  const [bufferGeoJSON, setBufferGeoJSON] = useState<GeoJSON.Geometry | null>(null); // Buffer polygon GeoJSON
  const [excludedBldgIds, setExcludedBldgIds] = useState<number[]>([]); // Building IDs excluded from network (e.g. elevation)
  const [scenarioStats, setScenarioStats] = useState<{
    grid_count: number; area_ha: number;
    network_bldgs: number; onsite_bldgs: number; nonnetwork_bldgs: number; total_bldgs: number;
    by_municipality: Array<{ mun: string; network: number; onsite: number; nonnetwork: number }>;
    buffer_bldgs?: number;
    buffer_area_ha?: number | null;
    density_stop?: number; gwd_stop?: number; gwi_stop?: number; fld_stop?: number;
    zones?: Array<{ cluster_id: number; mun: string; network_bldgs: number; grid_cells: number; area_ha: number; tourism_cells: number; centroid_lng: number; centroid_lat: number; bbox_minlng: number; bbox_minlat: number; bbox_maxlng: number; bbox_maxlat: number; brgy_names: string[]; use_type_pct: Array<{ name: string; pct: number }>; buffer_geom_geojson?: any; buffer_area_ha?: number | null; buffer_bldgs?: number }>;
    zone_breakdown?: {
      network:    { useType: { name: string; value: number }[]; hazard: { name: string; value: number }[] };
      buffer:     { useType: { name: string; value: number }[]; hazard: { name: string; value: number }[] };
      nonNetwork: { useType: { name: string; value: number }[]; hazard: { name: string; value: number }[] };
    } | null;
  } | null>(null); // Module 1 live scenario stats
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; name: string; geojson?: any } | null>(null);
  const [currentZoom, setCurrentZoom] = useState(11); // Track current map zoom level
  const [selectedRoadName, setSelectedRoadName] = useState<string>('all'); // Road filter for iRAP layers
  const [roadBounds, setRoadBounds] = useState<[number, number, number, number] | null>(null); // Bounds for road zoom
  
  // Track total residential buildings (sum of Res_Buildings from loaded barangay boundaries)
  const [totalResidentialBuildings, setTotalResidentialBuildings] = useState<number>(0);
  const [isBuildingsLoading, setIsBuildingsLoading] = useState(false); // Mirrors MapCanvas buildings loading state
  const [isScenarioRunning, setIsScenarioRunning] = useState(false);   // True from Run Scenario click until map fully loads
  
  // Track total area in km² (sum of Shape_Area from loaded barangay boundaries)
  const [totalAreaKm2, setTotalAreaKm2] = useState<number>(0);
  
  // Track total population (sum of Pop_2024 from loaded barangay boundaries)
  const [totalPopulation2024, setTotalPopulation2024] = useState<number>(0);
  
  // Debug: Log when totalResidentialBuildings updates
  useEffect(() => {
    console.log('🏠 [App.tsx] totalResidentialBuildings state updated to:', totalResidentialBuildings);
  }, [totalResidentialBuildings]);
  
  // Debug: Log when totalAreaKm2 updates
  useEffect(() => {
    console.log('📐 [App.tsx] totalAreaKm2 state updated to:', totalAreaKm2.toFixed(2), 'km²');
  }, [totalAreaKm2]);
  
  // Debug: Log when totalPopulation2024 updates
  useEffect(() => {
    console.log('👥 [App.tsx] totalPopulation2024 state updated to:', totalPopulation2024.toLocaleString());
  }, [totalPopulation2024]);
  
  // Query results state - stores filtered infrastructure points from spatial query
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  
  // Store the legend key at the time query was executed (so colors don't change when switching layers)
  const [queryResultsLegendKey, setQueryResultsLegendKey] = useState<string | null>(null);
  
  // Selected road network result for map highlighting
  const [selectedRoadNetworkResult, setSelectedRoadNetworkResult] = useState<{ category: string; gridcode: string; hazardColor?: string; activeUserType?: string; isStarRating?: boolean } | null>(null);

  // Selected road name + star rating for right panel chart click (NEW)
  const [selectedRoadStarSegment, setSelectedRoadStarSegment] = useState<{ roadName: string; starRating: string; vehicleType: string } | null>(null);

  // Track if infrastructure layers were auto-enabled by query panel
  const [infraLayersAutoEnabled, setInfraLayersAutoEnabled] = useState(false);

  // Store the state of infrastructure layers BEFORE query execution (for restoration on "Back to Query")
  const [preQueryInfraState, setPreQueryInfraState] = useState<{
    activeInfraLayers: string[];
    educationSubLayers: string[];
    healthcareSubLayers: string[];
    publicAmenitiesSubLayers: string[];
    transportSubLayers: string[];
  } | null>(null);

  // Trigger to reset map view to default extent
  const [resetMapViewTrigger, setResetMapViewTrigger] = useState(0);

  // Store map instance reference for external zoom control
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

  // Control legend panel minimization state
  const [legendMinimized, setLegendMinimized] = useState(false);

  // Track hazard layer loading state
  const [isHazardLayerLoading, setIsHazardLayerLoading] = useState(false);

  // Left drawer collapse state
  const [leftDrawerCollapsed, setLeftDrawerCollapsed] = useState(false);

  // Opacity state for each hazard layer (default 70%)
  const [layerOpacities, setLayerOpacities] = useState<Record<string, number>>({
    heat_hhi: 0.7,
    heat_lst: 0.7,
    heat_ast: 0.7,
    heat_wbt: 0.7,
    heat_wbgt: 0.7,
    heat_uhi: 0.7,
    heat_rh: 0.7,
    air_aqi: 0.7,
    air_co: 0.7,
    air_no2: 0.7,
    air_o3: 0.7,
    air_pm10: 0.7,
    air_pm25: 0.7,
    air_so2: 0.7,
    flood_fhi: 0.7,
    multihazard_assessment: 0.7,
    elevation: 0.7,
    grid_sewer: 0.75,
  });
  
  // Road network statistics (calculated from actual data)
  const [roadNetworkStats, setRoadNetworkStats] = useState<Record<string, number>>({
    'National Highway': 0,
    'State Highway': 0,
    'Major Road': 0,
    'Link Road': 0
  });

  // Road safety statistics per rating (calculated from actual data)
  const [roadSafetyStats, setRoadSafetyStats] = useState<any>({
    irap_vehicle: { totalLength: 0, '5star': 0, '4star': 0, '3star': 0, '2star': 0, '1star': 0 },
    irap_motorcycle: { totalLength: 0, '5star': 0, '4star': 0, '3star': 0, '2star': 0, '1star': 0 },
    irap_bicycle: { totalLength: 0, '5star': 0, '4star': 0, '3star': 0, '2star': 0, '1star': 0 },
    irap_pedestrian: { totalLength: 0, '5star': 0, '4star': 0, '3star': 0, '2star': 0, '1star': 0 },
  });

  // Infrastructure counts - shared between LeftDrawer and QueryPanel
  const [educationCounts, setEducationCounts] = useState<Record<string, number>>({});
  const [healthcareCounts, setHealthcareCounts] = useState<Record<string, number>>({});
  const [publicAmenitiesCounts, setPublicAmenitiesCounts] = useState<Record<string, number>>({});
  const [transportCounts, setTransportCounts] = useState<Record<string, number>>({});

  const activeLayerId = activeLayerPerSector[activeSector];
  console.log('🔑 [APP] activeLayerId derived from sector:', { activeSector, activeLayerId, activeLayerPerSector });

  // Derive activeHazardLayerId (full GeoServer layer name with scenario)
  const activeHazardLayerId = getLayerNameForScenario(activeLayerId, scenario) || '';
  
  // Derive activeHazardKey (layer name without prefix, e.g., "AST_2025", "Air_PM25")
  const activeHazardKey = activeHazardLayerId.split(':')[1] || '';
  
  console.log(`🔑 [APP] Active Hazard Key: ${activeHazardKey} (from ${activeHazardLayerId})`);
  
  // ALL useEffect HOOKS MUST BE BEFORE ANY CONDITIONAL RETURNS
  // Log module changes and auto-collapse/expand left drawer based on module state
  useEffect(() => {
    console.log('🔧 CWIS Module changed:', activeModule);
    if (activeModule) {
      // Module opened - fit map to the extent of currently filtered barangays
      if (mapInstance) {
        if (selectedWardId && selectedWardId !== 'all') {
          // A single barangay is filtered — zoom to it
          handleZoomToBarangay(selectedWardId, selectedWardName);
        } else if (selectedLguName && selectedLguName !== 'all' && selectedLguName !== 'All LGUs') {
          // An LGU is filtered — zoom to all its barangays
          handleZoomToLgu(selectedLguName);
        } else {
          // No filter — zoom to full study area extent
          const barangayBounds = (mapInstance as any)._barangayBounds;
          if (barangayBounds) {
            mapInstance.fitBounds(barangayBounds, { padding: 80, duration: 1000 });
          }
        }
      }

      // Module opened - collapse left drawer
      setLeftDrawerCollapsed(true);

      // ── Clear all default-panel layers ──────────────────────────────────────
      // Building use / sublayers
      setActiveBuildingCategories([]);
      setActiveBuildingSubcategories([]);
      setPreviousBuildingCategories([]);
      setActiveBuildingHeightCategories([]);
      setActiveBuildingAreaCategories([]);
      setIsEconomicVulnerabilityActive(false);

      // Base layers: keep boundaries/roads/water, remove thematic base layers
      setActiveBaseLayers(prev =>
        prev.filter(id =>
          id === 'ward_boundary' ||
          id === 'waterbody' ||
          id === 'road_network_base' ||
          id === 'municipal_boundary'
        )
      );

      // Turn off active hazard layer
      setActiveLayerPerSector(prev => ({
        ...prev,
        [activeSector]: ''
      }));

      // ── Module 1: start in buildings mode by default ──
      if (activeModule === 'module1_suitability') {
        setActiveSewerCategories(['Sewer Feasible', 'On-site Treatment', 'Non-Sewer']);
        // Lock the map immediately — keeps the overlay covering the amber flash
        // and the auto-load API fetch + render, all in one continuous loader
        setIsScenarioRunning(true);
      }
    } else {
      // Module closed - expand left drawer and restore building use layer
      setLeftDrawerCollapsed(false);
      setActiveBuildingCategories(['residential', 'commercial', 'education', 'government', 'health', 'religious', 'industrial', 'transport']);
      setActiveBaseLayers(prev =>
        prev.includes('buildings') ? prev : [...prev, 'buildings']
      );
    }

    // Clear sewer categories when leaving Module 1
    if (activeModule !== 'module1_suitability') {
      setActiveSewerCategories([]);
      setIsScenarioRunning(false);
      setScenarioGridGeoJSON(null);
      setScenarioNetworkGids(null);
      setBufferBldgIds([]);
      setBufferGeoJSON(null);
      setExcludedBldgIds([]);
      setScenarioStats(null);
    }
  }, [activeModule]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure buildings layer is active when sewer categories are selected (Module 1)
  useEffect(() => {
    if (activeSewerCategories.length > 0) {
      setActiveBaseLayers(prev =>
        prev.includes('buildings') ? prev : [...prev, 'buildings']
      );
    }
  }, [activeSewerCategories]);
  
  // Reset donut category filter when hazard layer changes
  useEffect(() => {
    console.log('🔄 Layer changed, resetting donut category filter');
    setSelectedDonutCategory(null);
  }, [activeLayerId]);
  
  // Refresh hazard data when scenario or ward changes
  useEffect(() => {
    // Only refresh for non-initial loads
    if (scenario !== 'baseline_2025' || selectedWardId !== 'all') {
      refreshData(scenario, selectedWardId);
    }
  }, [scenario, selectedWardId, refreshData]);

  // Set document title
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Multi-Hazard Climate Screening & Mobility Exposure Dashboard';
    }
  }, []);

  // Load legend definitions from CSV on app mount
  useEffect(() => {
    console.log('🚀 [APP] Starting legend load...');
    loadLegendDefinitions()
      .then(() => {
        console.log('✅ [APP] Legend definitions loaded successfully');
      })
      .catch((error) => {
        console.error('❌ [APP] Failed to load legend definitions:', error);
      });
  }, []);

  // Diagnostic: Fetch and log unique healthcare categories on app load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchUniqueHealthcareCategories().then(result => {
        if (result.categories.length > 0) {
          console.log('🏥 Healthcare Categories Diagnostic Report:');
          console.log('Total unique categories:', result.categories.length);
          console.log('Categories:', result.categories);
          console.log('Counts:', result.categoryCounts);
        }
      });
    }
  }, []);

  // Preload infrastructure counts on mount and when ward changes
  useEffect(() => {
    const loadInfrastructureCounts = async () => {
      console.log('🏗️ [APP] Preloading infrastructure counts for ward:', selectedWardId);
      const wardParam = selectedWardId === 'all' ? undefined : selectedWardId;
      
      const [eduCounts, healthCounts, publicCounts, transCounts] = await Promise.all([
        fetchEducationCounts(wardParam),
        fetchHealthcareCounts(wardParam),
        fetchPublicAmenitiesCounts(wardParam),
        fetchTransportCounts(wardParam)
      ]);
      
      setEducationCounts(eduCounts);
      setHealthcareCounts(healthCounts);
      setPublicAmenitiesCounts(publicCounts);
      setTransportCounts(transCounts);
      
      console.log('✅ [APP] Infrastructure counts preloaded successfully');
    };
    loadInfrastructureCounts();
  }, [selectedWardId]);

  // Fetch road safety star ratings when ward changes
  useEffect(() => {
    const loadRoadSafetyStats = async () => {
      console.log('🛡️ [APP] Fetching road safety star ratings for ward:', selectedWardId, 'road:', selectedRoadName);
      const wardParam = selectedWardId === 'all' ? undefined : selectedWardId;
      const roadParam = selectedRoadName === 'all' ? undefined : selectedRoadName;
      
      const stats = await fetchRoadSafetyStarRatings(wardParam, roadParam);
      setRoadSafetyStats(stats);
      
      console.log('✅ [APP] Road safety star ratings loaded:', stats);
    };
    loadRoadSafetyStats();
  }, [selectedWardId, selectedRoadName]);

  // Fetch road network lengths when ward changes
  useEffect(() => {
    const loadRoadNetworkStats = async () => {
      console.log('🛣️ [APP] Fetching road network lengths for ward:', selectedWardId);
      const wardParam = selectedWardId === 'all' ? undefined : selectedWardId;
      
      const stats = await fetchRoadNetworkLengths(wardParam);
      setRoadNetworkStats(stats);
      
      console.log('✅ [APP] Road network lengths loaded:', stats);
    };
    loadRoadNetworkStats();
  }, [selectedWardId]);

  // Auto-adjust background hazard layer opacity when road safety layers or road query results are active
  useEffect(() => {
    // Check BOTH rsMain and rsXHazard for active road safety layers
    const hasRoadSafetyActive = rsMainActiveLayer.length > 0 || rsXHazardActiveLayer.length > 0 || activeRoadSafetySubLayers.length > 0;
    const hasRoadQueryResults = queryResults !== null && queryResults.length > 0;
    const shouldReduceOpacity = hasRoadSafetyActive || hasRoadQueryResults;
    
    if (shouldReduceOpacity) {
      // Road safety layer or road query results are active - reduce background hazard opacity to 40%
      if (activeLayerId && layerOpacities[activeLayerId] !== 0.4) {
        console.log(`🔄 Road overlay active (safety: ${hasRoadSafetyActive}, query: ${hasRoadQueryResults}) - reducing ${activeLayerId} opacity to 40%`);
        setLayerOpacities(prev => ({
          ...prev,
          [activeLayerId]: 0.4
        }));
      }
    } else {
      // Road overlays are off - restore background hazard opacity to default 70%
      if (activeLayerId && layerOpacities[activeLayerId] !== 0.7) {
        console.log(`🔄 Road overlays inactive - restoring ${activeLayerId} opacity to 70%`);
        setLayerOpacities(prev => ({
          ...prev,
          [activeLayerId]: 0.7
        }));
      }
    }
  }, [rsMainActiveLayer, rsXHazardActiveLayer, activeRoadSafetySubLayers, queryResults, activeLayerId]); // Removed layerOpacities from dependencies to allow manual control

  // Buildings layer is now user-controlled via Base Layers panel
  // No auto-activation - user can toggle it manually at any zoom level
  
  // NOTE: Initial loading overlay removed - app starts immediately
  // Background preloading continues via HazardDataContext
  // Loading states handled by individual components showing skeleton states

  // Handler to update layer opacity
  const handleLayerOpacityChange = (layerId: string, opacity: number) => {
    setLayerOpacities(prev => ({
      ...prev,
      [layerId]: opacity
    }));
  };

  // Building layers transparency (controlled via FloatingLegendPanel slider)
  const [buildingOpacity, setBuildingOpacity] = useState(0.7);

  const handleSectorChange = (sector: Sector) => {
    console.log(`🔄 [APP] Sector changing from ${activeSector} to ${sector}`);
    
    // Reset Road Safety selections when switching AWAY from Road Safety sector
    if (activeSector === 'roadsafety' && sector !== 'roadsafety') {
      console.log('🧹 [APP] Leaving Road Safety sector - resetting all Road Safety selections');
      
      // Reset all road safety layer selections
      setActiveRoadSafetySubLayers([]);
      
      // Reset all star rating filters
      setRoadSafetyStarRatings({
        irap_vehicle: null,
        irap_motorcycle: null,
        irap_bicycle: null,
        irap_pedestrian: null
      });
      
      // Reset road network iRAP type
      setActiveRoadNetworkIRAPType(null);
      
      // Reset road name filter
      setSelectedRoadName('all');
      
      // Reset road bounds
      setRoadBounds(null);
      
      // Clear selected road network result
      setSelectedRoadNetworkResult(null);
      
      // Restore road_network_base layer if it was removed
      if (!activeBaseLayers.includes('road_network_base')) {
        setActiveBaseLayers([...activeBaseLayers, 'road_network_base']);
        console.log('✅ [APP] Restored road_network_base layer');
      }
      
      console.log('✅ [APP] Road Safety selections cleared');
    }
    
    // Activate Vehicle Occupant Safety layer when switching TO Road Safety sector
    if (sector === 'roadsafety' && activeSector !== 'roadsafety') {
      console.log('🚗 [APP] Entering Road Safety sector - activating Vehicle Occupant Safety layer by default');
      
      // Clear other infrastructure layers (but not road safety)
      const roadSafetyLayers = activeInfraLayers.filter(layer => layer === 'road_safety');
      setActiveInfraLayers(roadSafetyLayers);
      
      // Clear infrastructure sub-layers
      setActiveEducationSubLayers([]);
      setActiveHealthcareSubLayers([]);
      setActivePublicAmenitiesSubLayers([]);
      setActiveTransportSubLayers([]);
      
      // Activate Vehicle Occupant Safety layer by default
      setActiveRoadSafetySubLayers(['irap_vehicle']);
      setActiveRoadNetworkIRAPType('irap_vehicle');
      
      // Remove road_network_base layer when road safety layers are active
      setActiveBaseLayers(activeBaseLayers.filter(id => id !== 'road_network_base'));
      
      console.log('✅ [APP] Vehicle Occupant Safety layer activated by default');
      console.log('✅ [APP] Non-road infrastructure layers cleared');
    }
    
    setActiveSector(sector);
    setShowAlerts(false);
    setDrawerOpen(true); // Open drawer when changing sector
  };

  const handleLayerChange = (layerId: string) => {
    console.log('🎯🎯🎯 [APP] handleLayerChange called with layerId:', layerId);
    console.log('🎯 [APP] Current activeSector:', activeSector);
    console.log('🎯 [APP] Current activeLayerPerSector:', activeLayerPerSector);
    
    // ✅ Toggle functionality: If clicking on the currently active layer, turn it off
    const currentActiveLayer = activeLayerPerSector[activeSector];
    const newLayerId = currentActiveLayer === layerId ? '' : layerId;
    
    setActiveLayerPerSector({
      ...activeLayerPerSector,
      [activeSector]: newLayerId
    });

    // When activating a layer, turn off elevation and builtup_density base layers (they are mutually exclusive with thematic layers)
    if (newLayerId && (activeBaseLayers.includes('elevation') || activeBaseLayers.includes('builtup_density'))) {
      setActiveBaseLayers(activeBaseLayers.filter(id => id !== 'elevation' && id !== 'builtup_density'));
    }

    console.log('🎯 [APP] Updated activeLayerPerSector[' + activeSector + '] to:', newLayerId);
  };

  // Handler to activate a specific hazard layer (used by network query)
  const handleActivateHazardLayer = (hazardType: 'heat' | 'air' | 'flood' | 'multiHazard') => {
    console.log('🎯 [APP] Activating hazard layer for query:', hazardType);
    
    // Map hazard type to sector and layer
    const hazardMapping = {
      heat: { sector: 'heat' as Sector, layer: 'heat_hhi' },
      air: { sector: 'air' as Sector, layer: 'air_aqi' },
      flood: { sector: 'flood' as Sector, layer: 'flood_fhi' },
      multiHazard: { sector: 'multihazard' as Sector, layer: 'multihazard_assessment' }
    };
    
    const mapping = hazardMapping[hazardType];
    if (mapping) {
      setActiveSector(mapping.sector);
      setActiveLayerPerSector({
        ...activeLayerPerSector,
        [mapping.sector]: mapping.layer
      });
      console.log(`✅ [APP] Activated ${mapping.sector} sector with ${mapping.layer} layer`);
    }
  };

  const handleReset = () => {
    setActiveSector('heat');
    setActiveLayerPerSector({
      heat: 'heat_hhi',
      air: 'air_aqi',
      flood: 'flood_fhi',
      multihazard: 'multihazard_assessment'
    });
    setScenario('baseline_2025');
    onBasemapChange('light');
    setSelectedWard(null);
  };

  const handleViewWardDetails = (wardData: any) => {
    // Set the selected ward details with sector information
    setSelectedWardDetails({
      ...wardData,
      sector: activeSector,
      layerId: activeLayerId,
      scenario: scenario
    });
    // Optionally set the selected ward to highlight it
    setSelectedWard(wardData.name);
  };

  // Comprehensive reset to default application state
  const resetToDefaultState = () => {
    console.log('🔄 [APP] Resetting application to default state');
    
    // Reset sector and layers
    setActiveSector('heat');
    setActiveLayerPerSector({
      heat: 'heat_hhi',
      air: 'air_aqi',
      flood: 'flood_fhi',
      multihazard: 'multihazard_assessment'
    });
    
    // Reset scenario and basemap
    setScenario('baseline_2025');
    onBasemapChange('light');
    
    // Clear all filters
    onSelectedWardIdChange('all');
    setSelectedRoadName('all');
    setSelectedWard(null);
    setSelectedWardDetails(null);
    setSelectedLocation(null);
    
    // Clear all infrastructure layers
    setActiveInfraLayers([]);
    setActiveEducationSubLayers([]);
    setActiveHealthcareSubLayers([]);
    setActivePublicAmenitiesSubLayers([]);
    setActiveTransportSubLayers([]);
    setActiveRoadSafetySubLayers([]);
    setActiveSubLayers([]);
    setActiveRoadNetworkIRAPType(null);
    
    // Reset base layers to default
    setActiveBaseLayers(['ward_boundary', 'waterbody', 'road_network_base', 'municipal_boundary']);
    
    // Reset layer opacities to default 70%
    setLayerOpacities({
      heat_hhi: 0.7,
      heat_lst: 0.7,
      heat_ast: 0.7,
      heat_wbt: 0.7,
      heat_wbgt: 0.7,
      heat_uhi: 0.7,
      heat_rh: 0.7,
      air_aqi: 0.7,
      air_co: 0.7,
      air_no2: 0.7,
      air_o3: 0.7,
      air_pm10: 0.7,
      air_pm25: 0.7,
      air_so2: 0.7,
      flood_fhi: 0.7,
      multihazard_assessment: 0.7,
      elevation: 0.7
    });
    
    // Clear query results
    setQueryResults(null);
    
    // Clear road bounds
    setRoadBounds(null);
    
    // Reset auto-enabled flag and clear saved pre-query state
    setInfraLayersAutoEnabled(false);
    setPreQueryInfraState(null);
    
    // Trigger map view reset to default extent
    setResetMapViewTrigger(prev => prev + 1);
    
    console.log('✅ [APP] Application reset to default state');
  };

  // Handler to enable all 4 infrastructure layers when query is executed
  const handleEnableInfraLayers = () => {
    const infraLayerIds = ['educational', 'healthcare', 'public_amenities', 'transport_mobility'];
    
    // SAVE THE CURRENT STATE before making any changes (for restoration on "Back to Query")
    if (!preQueryInfraState) {
      console.log('💾 [APP] Saving pre-query infrastructure state');
      setPreQueryInfraState({
        activeInfraLayers: [...activeInfraLayers],
        educationSubLayers: [...activeEducationSubLayers],
        healthcareSubLayers: [...activeHealthcareSubLayers],
        publicAmenitiesSubLayers: [...activePublicAmenitiesSubLayers],
        transportSubLayers: [...activeTransportSubLayers]
      });
    }
    
    // Only add layers that aren't already active
    const newLayers = infraLayerIds.filter(id => !activeInfraLayers.includes(id));
    
    if (newLayers.length > 0) {
      setActiveInfraLayers([...activeInfraLayers, ...newLayers]);
      setInfraLayersAutoEnabled(true);
      console.log('🗺️ [APP] Auto-enabled infrastructure layers:', newLayers);
    }
  };

  // Handler to disable infrastructure layers when query panel closes
  const handleDisableInfraLayers = () => {
    if (infraLayersAutoEnabled) {
      const infraLayerIds = ['educational', 'healthcare', 'public_amenities', 'transport_mobility'];
      
      // Remove the auto-enabled layers
      const filteredLayers = activeInfraLayers.filter(id => !infraLayerIds.includes(id));
      
      setActiveInfraLayers(filteredLayers);
      setInfraLayersAutoEnabled(false);
      
      // Also clear all sub-layers
      setActiveEducationSubLayers([]);
      setActiveHealthcareSubLayers([]);
      setActivePublicAmenitiesSubLayers([]);
      setActiveTransportSubLayers([]);
      
      console.log('🗺️ [APP] Auto-disabled infrastructure layers');
    }
  };

  // Enhanced close query handler
  const handleCloseQuery = () => {
    setShowQueryPanel(false);
    // Clear saved pre-query state
    setPreQueryInfraState(null);
    // Reset to default state when closing query panel
    resetToDefaultState();
  };

  // Handler to open query panel with reset
  const handleOpenQueryPanel = () => {
    // Always reset to default state when toggling query panel (both opening and closing)
    resetToDefaultState();
    setShowQueryPanel(!showQueryPanel);
  };

  // Handler to zoom to a specific infrastructure point
  const handleZoomToPoint = (lat: number, lng: number, name: string) => {
    console.log(`🎯 [APP] Zooming to point: ${name} at [${lat}, ${lng}]`);
    // Use selectedLocation but with a flag to indicate zoom level 16.5 and popup should open
    setSelectedLocation({ lat, lng, name, zoom: 16.5, openPopup: true } as any);
  };

  // Handler to zoom back to home view when closing query results (triggered by "Back to Query")
  const handleCloseQueryResults = () => {
    console.log('🏠 [APP] Back to Query clicked - restoring pre-query state');
    
    // Step 1: RESTORE infrastructure layers to their pre-query state
    if (preQueryInfraState) {
      console.log('♻️ [APP] Restoring saved infrastructure state:', preQueryInfraState);
      setActiveInfraLayers(preQueryInfraState.activeInfraLayers);
      setActiveEducationSubLayers(preQueryInfraState.educationSubLayers);
      setActiveHealthcareSubLayers(preQueryInfraState.healthcareSubLayers);
      setActivePublicAmenitiesSubLayers(preQueryInfraState.publicAmenitiesSubLayers);
      setActiveTransportSubLayers(preQueryInfraState.transportSubLayers);
      
      // Clear the saved state
      setPreQueryInfraState(null);
      setInfraLayersAutoEnabled(false);
      
      console.log('✅ [APP] Infrastructure layers restored to pre-query state');
    } else {
      console.log('⚠️ [APP] No pre-query state found - keeping current infrastructure layers');
    }
    
    // Step 2: Clear query results to remove filtered points from map
    setQueryResults(null);
    setQueryResultsLegendKey(null); // Clear locked legend key
    
    // Step 3: Add a small delay before triggering the zoom animation for smoother transition
    setTimeout(() => {
      // Reset to Bohol center with initial zoom
      setSelectedLocation({ lat: 9.8399, lng: 124.1139, name: 'Bohol', zoom: 11.5, openPopup: false, smoothTransition: true } as any);
    }, 150); // Small delay allows the UI to update before map animation starts
  };

  // Handler for when query is executed (placeholder for future functionality)
  const handleQueryExecuted = () => {
    console.log('🔍 [APP] Query executed');
    // Currently no additional action needed - query panel handles its own state
  };

  // Handler to apply infrastructure filters from query panel
  const handleApplyFilters = (filters: {
    educationSubLayers: string[];
    healthcareSubLayers: string[];
    publicAmenitiesSubLayers: string[];
    transportSubLayers: string[];
  }) => {
    console.log('🎯 [APP] Applying infrastructure filters:', filters);
    
    // Update each infrastructure sub-layer state
    setActiveEducationSubLayers(filters.educationSubLayers);
    setActiveHealthcareSubLayers(filters.healthcareSubLayers);
    setActivePublicAmenitiesSubLayers(filters.publicAmenitiesSubLayers);
    setActiveTransportSubLayers(filters.transportSubLayers);
  };

  // Handler to zoom map to fit selected ward(s)
  const handleZoomToWards = (wardIds: string[]) => {
    console.log('🎯 [APP] Zooming to wards:', wardIds);
    
    // Filter out 'all' and create a special location object with ward IDs
    const validWardIds = wardIds.filter(id => id !== 'all');
    
    if (validWardIds.length > 0) {
      // Use a special flag to trigger ward boundary zoom in MapCanvas
      setSelectedLocation({ 
        wardIds: validWardIds,
        name: `Ward ${validWardIds.map(id => id.split('_')[1]).join(', ')}`,
        zoomToWards: true
      } as any);
    }
  };

  // Handler to zoom to and highlight road segment
  const handleZoomToRoadSegment = (features: any[], category: string, gridcode: string, color: string) => {
    console.log('🎯 [APP] Zooming to road segment:', { category, gridcode, color, featureCount: features.length });
    
    if (features.length > 0) {
      // Use a special flag to trigger road segment zoom and highlight in MapCanvas
      setSelectedLocation({ 
        roadFeatures: features,
        roadCategory: category,
        roadGridcode: gridcode,
        roadColor: color,
        name: `${category} - Gridcode ${gridcode}`,
        zoomToRoadSegment: true
      } as any);
    }
  };

  // Handler to zoom to filtered star-rated roads (REBUILT FROM SCRATCH - CLEAN VERSION)
  const handleZoomToStarRating = async (layerType: string, starRating: string) => {
    if (!mapInstance) {
      console.warn('[ZOOM] Map instance not available');
      return;
    }

    console.log(`[ZOOM] Request: ${layerType} - ${starRating}`);
    console.log(`[ZOOM] Current filters - Ward: ${selectedWardId}, Road: ${selectedRoadName}`);
    
    try {
      // Fetch bounds from API
      console.log('[ZOOM] Fetching bounds from API...');
      const bounds = await fetchRoadSafetyBounds(layerType, starRating, selectedWardId, selectedRoadName);

      // Validate API response
      if (!bounds) {
        console.warn('[ZOOM] API returned no bounds - no features match the filters');
        return;
      }

      const [minLng, minLat, maxLng, maxLat] = bounds;
      console.log(`[ZOOM] API returned bounds:`, { minLng, minLat, maxLng, maxLat });
      console.log(`[ZOOM] Bounds size - Width: ${(maxLng - minLng).toFixed(4)}°, Height: ${(maxLat - minLat).toFixed(4)}°`);
      
      // Validate bounds are sensible
      if (minLng >= maxLng || minLat >= maxLat) {
        console.error('[ZOOM] Invalid bounds - minLng >= maxLng or minLat >= maxLat');
        return;
      }

      // Apply smooth zoom animation with minimal padding
      console.log('[ZOOM] Applying fitBounds animation...');
      mapInstance.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]], 
        {
          padding: 50,
          duration: 1500,
          maxZoom: 15
        }
      );
      
      console.log(`[ZOOM] SUCCESS - Zoomed to ${layerType} ${starRating}`);
    } catch (error) {
      console.error('[ZOOM] Error:', error);
    }
  };

  // Handler to reset map to home position
  const handleResetMapView = () => {
    if (!mapInstance) {
      console.warn('⚠️ Map not yet initialized, cannot reset view');
      return;
    }

    // Use the barangay bounds calculated on initial load (same extent as app startup)
    const barangayBounds = (mapInstance as any)._barangayBounds;

    if (barangayBounds) {
      mapInstance.fitBounds(barangayBounds, {
        padding: 80,
        duration: 1000
      });
    } else {
      const BOHOL_CENTER = { lat: 9.8399, lng: 124.1139 };
      mapInstance.flyTo({
        center: [BOHOL_CENTER.lng, BOHOL_CENTER.lat],
        zoom: 11,
        duration: 1000
      });
    }
  };

  // Handler to zoom to LGU extent (NEW - for LGU filter dropdown)
  const handleZoomToLgu = async (lguName: string) => {
    if (!mapInstance) {
      console.warn('⚠️ [LGU-ZOOM] Map not yet initialized');
      return;
    }

    console.log(`🏛️ [LGU-ZOOM] Zooming to LGU: "${lguName}"`);

    // If "All LGUs" is selected, reset to study area extent
    if (lguName === 'All LGUs' || lguName === 'all') {
      handleResetMapView();
      return;
    }

    try {
      // Fetch barangays for the selected LGU
      const escapedLguName = lguName.replace(/'/g, "''");
      const WFS_URL = `https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Barangay_Boundary&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=${encodeURIComponent(`MunName='${escapedLguName}'`)}`;

      console.log(`📡 [LGU-ZOOM] Fetching barangay boundaries for: ${lguName}`);
      const response = await fetch(WFS_URL);
      if (!response.ok) {
        throw new Error(`WFS request failed with status ${response.status}`);
      }

      const geojson = await response.json();
      
      if (!geojson.features || geojson.features.length === 0) {
        console.warn(`⚠️ [LGU-ZOOM] No barangays found for LGU: ${lguName}`);
        return;
      }

      // Calculate bounding box from all barangay features
      let minLng = Infinity, minLat = Infinity;
      let maxLng = -Infinity, maxLat = -Infinity;

      geojson.features.forEach((feature: any) => {
        if (feature.geometry && feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates[0].forEach((coord: number[]) => {
            const [lng, lat] = coord;
            minLng = Math.min(minLng, lng);
            minLat = Math.min(minLat, lat);
            maxLng = Math.max(maxLng, lng);
            maxLat = Math.max(maxLat, lat);
          });
        } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach((polygon: number[][][]) => {
            polygon[0].forEach((coord: number[]) => {
              const [lng, lat] = coord;
              minLng = Math.min(minLng, lng);
              minLat = Math.min(minLat, lat);
              maxLng = Math.max(maxLng, lng);
              maxLat = Math.max(maxLat, lat);
            });
          });
        }
      });

      // Fit map to LGU bounds
      console.log(`✅ [LGU-ZOOM] Zooming to LGU bounds: [${minLng}, ${minLat}] to [${maxLng}, ${maxLat}]`);
      console.log(`   ${geojson.features.length} barangays in ${lguName}`);
      
      mapInstance.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        {
          padding: 80,
          duration: 1000,
          maxZoom: 14
        }
      );
    } catch (error) {
      console.error('❌ [LGU-ZOOM] Error:', error);
    }
  };

  // Handler to zoom to specific barangay (Updated to use BrgyID for unique identification)
  const handleZoomToBarangay = async (brgyId: string, barangayName: string) => {
    if (!mapInstance) {
      console.warn('⚠️ [BARANGAY-ZOOM] Map not yet initialized');
      return;
    }

    console.log(`📍 [BARANGAY-ZOOM] Zooming to Barangay: "${barangayName}"`);

    // If "All Barangays" is selected, zoom to selected LGU or study area
    if (brgyId === 'all' || barangayName === 'All Barangays' || barangayName === 'all') {
      // If an LGU is selected, zoom to that LGU
      if (selectedLguName && selectedLguName !== 'all' && selectedLguName !== 'All LGUs') {
        handleZoomToLgu(selectedLguName);
      } else {
        // Otherwise, reset to study area extent
        handleResetMapView();
      }
      return;
    }

    try {
      // Fetch the specific barangay boundary using BrgyID (unique identifier)
      const escapedBrgyId = String(brgyId).replace(/'/g, "''"); // Ensure brgyId is a string
      const WFS_URL = `https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=WorldBank_Bohol:Barangay_Boundary&outputFormat=application/json&srsName=EPSG:4326&CQL_FILTER=${encodeURIComponent(`BrgyID='${escapedBrgyId}'`)}`;

      console.log(`📡 [BARANGAY-ZOOM] Fetching boundary for: ${barangayName} (BrgyID: ${brgyId})`);
      const response = await fetch(WFS_URL);
      if (!response.ok) {
        throw new Error(`WFS request failed with status ${response.status}`);
      }

      const geojson = await response.json();
      
      if (!geojson.features || geojson.features.length === 0) {
        console.warn(`⚠️ [BARANGAY-ZOOM] No boundary found for Barangay: ${barangayName}`);
        return;
      }

      const feature = geojson.features[0];
      
      // Calculate bounding box from barangay feature
      let minLng = Infinity, minLat = Infinity;
      let maxLng = -Infinity, maxLat = -Infinity;

      if (feature.geometry && feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates[0].forEach((coord: number[]) => {
          const [lng, lat] = coord;
          minLng = Math.min(minLng, lng);
          minLat = Math.min(minLat, lat);
          maxLng = Math.max(maxLng, lng);
          maxLat = Math.max(maxLat, lat);
        });
      } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach((polygon: number[][][]) => {
          polygon[0].forEach((coord: number[]) => {
            const [lng, lat] = coord;
            minLng = Math.min(minLng, lng);
            minLat = Math.min(minLat, lat);
            maxLng = Math.max(maxLng, lng);
            maxLat = Math.max(maxLat, lat);
          });
        });
      }

      // Fit map to barangay bounds
      console.log(`✅ [BARANGAY-ZOOM] Zooming to Barangay bounds: [${minLng}, ${minLat}] to [${maxLng}, ${maxLat}]`);
      
      mapInstance.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        {
          padding: 100,
          duration: 1000,
          maxZoom: 15
        }
      );
      
      // After zoom completes, trigger tile reload to ensure buildings load for new viewport
      setTimeout(() => {
        console.log('🔄 [BARANGAY-ZOOM] Triggering map repaint to load tiles for new viewport');
        mapInstance.triggerRepaint();
      }, 1100); // Slightly after zoom animation completes
    } catch (error) {
      console.error('❌ [BARANGAY-ZOOM] Error:', error);
    }
  };

  // Handler to zoom to and highlight a buffer service region (Module 1 zone card click)
  const handleZoneClick = (zone: { cluster_id: number; bbox_minlng: number; bbox_minlat: number; bbox_maxlng: number; bbox_maxlat: number; mun: string; buffer_geom_geojson?: any }) => {
    if (!mapInstance) return;

    // Fly to zone bounds
    mapInstance.fitBounds(
      [[zone.bbox_minlng, zone.bbox_minlat], [zone.bbox_maxlng, zone.bbox_maxlat]],
      { padding: 100, duration: 900, maxZoom: 15 }
    );

    // Highlight the buffer polygon for this zone
    const HIGHLIGHT_SOURCE = 'scenario-zone-highlight';
    const HIGHLIGHT_FILL   = 'scenario-zone-highlight-fill';
    const HIGHLIGHT_LAYER  = 'scenario-zone-highlight-outline';

    const cleanup = () => {
      try {
        if (mapInstance.getLayer(HIGHLIGHT_LAYER))  mapInstance.removeLayer(HIGHLIGHT_LAYER);
        if (mapInstance.getLayer(HIGHLIGHT_FILL))   mapInstance.removeLayer(HIGHLIGHT_FILL);
        if (mapInstance.getSource(HIGHLIGHT_SOURCE)) mapInstance.removeSource(HIGHLIGHT_SOURCE);
      } catch (_) {}
    };
    cleanup();

    const bufGeom = zone.buffer_geom_geojson;
    if (!bufGeom) return;

    try {
      mapInstance.addSource(HIGHLIGHT_SOURCE, {
        type: 'geojson',
        data: { type: 'Feature', geometry: bufGeom, properties: {} },
      });
      mapInstance.addLayer({
        id: HIGHLIGHT_FILL,
        type: 'fill',
        source: HIGHLIGHT_SOURCE,
        paint: {
          'fill-color': '#FF8C00',
          'fill-opacity': 0.25,
        },
      });
      mapInstance.addLayer({
        id: HIGHLIGHT_LAYER,
        type: 'line',
        source: HIGHLIGHT_SOURCE,
        paint: {
          'line-color': '#FF8C00',
          'line-width': 2.5,
          'line-opacity': 1,
          'line-dasharray': [4, 2],
        },
      });
    } catch (_) { return; }

    // Fade out over 3 s then remove
    let opacity = 1;
    const interval = setInterval(() => {
      opacity -= 0.04;
      if (opacity <= 0) {
        clearInterval(interval);
        cleanup();
        return;
      }
      try {
        if (mapInstance.getLayer(HIGHLIGHT_LAYER)) {
          mapInstance.setPaintProperty(HIGHLIGHT_LAYER, 'line-opacity', opacity);
        }
        if (mapInstance.getLayer(HIGHLIGHT_FILL)) {
          mapInstance.setPaintProperty(HIGHLIGHT_FILL, 'fill-opacity', Math.max(0, opacity * 0.25));
        }
      } catch (_) { clearInterval(interval); cleanup(); }
    }, 100);
  };

  // Handler to zoom to specific road name + star rating segment (NEW)
  const handleZoomToRoadStarSegment = async (roadName: string, starRating: string, vehicleType: string) => {
    if (!mapInstance) {
      console.warn('[ROAD-STAR-ZOOM] Map instance not available');
      return;
    }

    console.log(`[ROAD-STAR-ZOOM] Request: ${roadName} - ${starRating} - ${vehicleType}`);
    console.log(`[ROAD-STAR-ZOOM] Current ward filter: ${selectedWardId}`);

    // Convert vehicleType to layerType
    const layerTypeMap: Record<string, string> = {
      'vehicle': 'irap_vehicle',
      'motorcycle': 'irap_motorcycle',
      'pedestrian': 'irap_pedestrian',
      'bicyclist': 'irap_bicycle',
    };

    const layerType = layerTypeMap[vehicleType];
    if (!layerType) {
      console.error('[ROAD-STAR-ZOOM] Invalid vehicle type:', vehicleType);
      return;
    }

    try {
      // Store the selection state
      setSelectedRoadStarSegment({ roadName, starRating, vehicleType });

      // Fetch bounds from API with road name filter
      console.log('[ROAD-STAR-ZOOM] Fetching bounds from API...');
      const bounds = await fetchRoadSafetyBounds(layerType, starRating, selectedWardId, roadName);

      // Validate API response
      if (!bounds) {
        console.warn('[ROAD-STAR-ZOOM] API returned no bounds - no features match the filters');
        return;
      }

      const [minLng, minLat, maxLng, maxLat] = bounds;
      console.log(`[ROAD-STAR-ZOOM] API returned bounds:`, { minLng, minLat, maxLng, maxLat });

      // Validate bounds are sensible
      if (minLng >= maxLng || minLat >= maxLat) {
        console.error('[ROAD-STAR-ZOOM] Invalid bounds');
        return;
      }

      // Apply smooth zoom animation
      console.log('[ROAD-STAR-ZOOM] Applying fitBounds animation...');
      mapInstance.fitBounds(
        [[minLng, minLat], [maxLng, maxLat]],
        {
          padding: 80,
          duration: 1500,
          maxZoom: 16
        }
      );

      // Activate the appropriate road safety layer if not already active
      if (!activeRoadSafetySubLayers.includes(layerType)) {
        console.log('[ROAD-STAR-ZOOM] Activating layer:', layerType);
        setActiveRoadSafetySubLayers([layerType]);
        setActiveRoadNetworkIRAPType(layerType);
      }

      // Set the road name filter to show ONLY this specific road
      console.log('[ROAD-STAR-ZOOM] Setting road name filter to:', roadName);
      setSelectedRoadName(roadName);

      // Set the star rating filter to show ONLY this specific star rating
      console.log('[ROAD-STAR-ZOOM] Setting star rating filter:', starRating);
      setRoadSafetyStarRatings(prev => ({
        ...prev,
        [layerType]: starRating
      }));

      console.log(`[ROAD-STAR-ZOOM] SUCCESS - Zoomed to ${roadName} ${starRating}`);
    } catch (error) {
      console.error('[ROAD-STAR-ZOOM] Error:', error);
    }
  };

  // Handler to reset all bar chart filters (road name + star rating)
  const handleResetBarChartFilters = () => {
    console.log('[RESET-FILTERS] Resetting all bar chart filters');
    
    // Clear the selected road star segment
    setSelectedRoadStarSegment(null);
    
    // Reset road name filter to 'all'
    setSelectedRoadName('all');
    
    // Reset all star rating filters to null
    setRoadSafetyStarRatings({
      irap_vehicle: null,
      irap_motorcycle: null,
      irap_bicycle: null,
      irap_pedestrian: null
    });
    
    // Reset map view to default
    handleResetMapView();
    
    console.log('[RESET-FILTERS] All filters cleared');
  };

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC]">
      <Header 
        onReset={handleReset} 
        onQueryToggle={handleOpenQueryPanel} 
        isQueryActive={showQueryPanel}
        onCompareToggle={() => onCompareModeChange(true)}
        selectedWardId={selectedWardId}
        onWardSelect={onSelectedWardIdChange}
        selectedLguId={selectedLguId}
        onLguSelect={onSelectedLguIdChange}
        selectedRoadName={selectedRoadName}
        onRoadNameSelect={setSelectedRoadName}
        activeRoadSafetySubLayers={activeRoadSafetySubLayers}
        onRoadZoom={setRoadBounds}
        onResetView={() => setRoadBounds(null)}
        disableWardFilter={showQueryPanel}
        onLguZoom={handleZoomToLgu}
        onBarangayZoom={handleZoomToBarangay}
        onInfoOpen={() => setInfoModalOpen(true)}
        onTutorialOpen={onTutorialRestart}
        showTutorialPulse={showTutorialPulse}
      />

      {/* Module Navigation Tabs - Full Width */}
      <ModuleNavigationTabs
        activeModule={activeModule}
        onModuleChange={setActiveModule}
      />

      <div className="flex-1 flex overflow-hidden">
        <div data-tutorial="left-panel" className="flex">
          <LeftDrawer
            activeSector={activeSector}
            activeLayerId={activeLayerId}
            onLayerChange={handleLayerChange}
            onScenarioChange={setScenario}
            scenario={scenario}
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            collapsed={leftDrawerCollapsed}
            onToggleCollapse={() => setLeftDrawerCollapsed(!leftDrawerCollapsed)}
            activeEducationSubLayers={activeEducationSubLayers}
            setActiveEducationSubLayers={setActiveEducationSubLayers}
            activeHealthcareSubLayers={activeHealthcareSubLayers}
            setActiveHealthcareSubLayers={setActiveHealthcareSubLayers}
            activePublicAmenitiesSubLayers={activePublicAmenitiesSubLayers}
            setActivePublicAmenitiesSubLayers={setActivePublicAmenitiesSubLayers}
            activeTransportSubLayers={activeTransportSubLayers}
            setActiveTransportSubLayers={setActiveTransportSubLayers}
            activeRoadNetworkIRAPType={activeRoadNetworkIRAPType}
            setActiveRoadNetworkIRAPType={setActiveRoadNetworkIRAPType}
            activeRoadSafetySubLayers={activeRoadSafetySubLayers}
            setActiveRoadSafetySubLayers={setActiveRoadSafetySubLayers}
            roadSafetyStarRatings={roadSafetyStarRatings}
            setRoadSafetyStarRatings={setRoadSafetyStarRatings}
            roadSafetyStats={roadSafetyStats}
            activeInfraLayers={activeInfraLayers}
            setActiveInfraLayers={setActiveInfraLayers}
            activeSubLayers={activeSubLayers}
            setActiveSubLayers={setActiveSubLayers}
            sectorOpacity={sectorOpacity}
            setSectorOpacity={setSectorOpacity}
            activeBaseLayers={activeBaseLayers}
            setActiveBaseLayers={setActiveBaseLayers}
            selectedWard={selectedWardId}
            selectedRoadName={selectedRoadName}
            currentZoom={currentZoom}
            isQueryActive={showQueryPanel}
            isLayerLoading={isHazardLayerLoading}
            externalRoadSafetyExpanded={tutorialRoadSafetyExpanded}
            externalInfraExpanded={tutorialInfraExpanded}
            onZoomToStarRating={handleZoomToStarRating}
            onResetMapView={handleResetMapView}
            activeBuildingCategories={activeBuildingCategories}
            setActiveBuildingCategories={setActiveBuildingCategories}
            activeBuildingSubcategories={activeBuildingSubcategories}
            setActiveBuildingSubcategories={setActiveBuildingSubcategories}
            previousBuildingCategories={previousBuildingCategories}
            setPreviousBuildingCategories={setPreviousBuildingCategories}
            isEconomicVulnerabilityActive={isEconomicVulnerabilityActive}
            setIsEconomicVulnerabilityActive={setIsEconomicVulnerabilityActive}
            activeBuildingHeightCategories={activeBuildingHeightCategories}
            setActiveBuildingHeightCategories={setActiveBuildingHeightCategories}
            activeBuildingAreaCategories={activeBuildingAreaCategories}
            setActiveBuildingAreaCategories={setActiveBuildingAreaCategories}
            selectedLguName={selectedLguName}
            selectedWardName={selectedWardName}
            isModuleActive={activeModule !== null}
          />
          
          {/* Module Panel - appears when module is selected */}
          <ModulePanel 
            activeModule={activeModule} 
            onClose={() => { setActiveModule(null); setShowFstpBuildings(false); setActiveFleetClasses([]); }}
            activeSewerCategories={activeSewerCategories}
            onSewerCategoriesChange={(zones) => {
              setActiveSewerCategories(zones);
            }}
            activeGridSewerCategories={activeGridSewerCategories}
            onGridSewerCategoriesChange={() => {}}
            sewerViewMode="buildings"
            onSewerViewModeChange={() => {}}
            onScenarioResult={(geojson, networkGids, bufBldgIds, bufGeomJson, excBldgIds) => {
              setScenarioGridGeoJSON(geojson);
              setScenarioNetworkGids(networkGids ?? null);
              setBufferBldgIds(bufBldgIds ?? []);
              setBufferGeoJSON(bufGeomJson ?? null);
              setExcludedBldgIds(excBldgIds ?? []);
            }}
            onStatsChange={setScenarioStats}
            selectedLguName={selectedLguName}
            selectedWardName={selectedWardName}
            isBuildingsLoading={isBuildingsLoading}
            onScenarioRunningChange={setIsScenarioRunning}
            onUserRun={() => {
              if (selectedWardName && selectedWardName !== 'all' && selectedWardName !== 'All Barangays') {
                handleZoomToBarangay(selectedWardId, selectedWardName);
              } else if (selectedLguName && selectedLguName !== 'all' && selectedLguName !== 'All LGUs') {
                handleZoomToLgu(selectedLguName);
              } else {
                handleResetMapView();
              }
            }}
            activeFstpLayers={activeFstpLayers}
            onFstpLayersChange={handleFstpLayersChange}
            showFstpBuildings={showFstpBuildings}
            onShowFstpBuildingsChange={setShowFstpBuildings}
            activeFleetClasses={activeFleetClasses}
            onFleetClassesChange={handleFleetClassesChange}
          />
        </div>

        {/* Map Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <MapCanvas
          activeSector={activeSector}
          activeLayerId={activeLayerId}
          scenario={scenario}
          basemap={basemap}
          selectedWard={selectedWard}
          selectedWardId={selectedWardId}
          selectedWardName={selectedWardName}
          selectedLguName={selectedLguName}
          selectedRoadName={selectedRoadName}
          onBasemapChange={onBasemapChange}
          onReset={handleReset}
          onCompareToggle={() => onCompareModeChange(true)}
          onScenarioChange={setScenario}
          onWardSelect={setSelectedWard}
          drawerOpen={drawerOpen}
          onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
          onViewWardDetails={handleViewWardDetails}
          activeEducationSubLayers={activeEducationSubLayers}
          activeHealthcareSubLayers={activeHealthcareSubLayers}
          activePublicAmenitiesSubLayers={activePublicAmenitiesSubLayers}
          activeTransportSubLayers={activeTransportSubLayers}
          activeInfraLayers={activeInfraLayers}
          activeRoadNetworkIRAPType={activeRoadNetworkIRAPType}
          activeRoadSafetySubLayers={activeRoadSafetySubLayers}
          roadSafetyStarRatings={roadSafetyStarRatings}
          activeBaseLayers={activeBaseLayers}
          onActiveBaseLayersChange={setActiveBaseLayers}
          activeBuildingCategories={activeBuildingCategories}
          activeBuildingSubcategories={activeBuildingSubcategories}
          isEconomicVulnerabilityActive={isEconomicVulnerabilityActive}
          activeBuildingHeightCategories={activeBuildingHeightCategories}
          activeBuildingAreaCategories={activeBuildingAreaCategories}
          layerOpacities={layerOpacities}
          onLayerOpacityChange={handleLayerOpacityChange}
          onRoadNetworkStatsUpdate={setRoadNetworkStats}
          selectedLocation={selectedLocation}
          onLocationClear={() => setSelectedLocation(null)}
          onLocationSelect={setSelectedLocation}
          currentZoom={currentZoom}
          onZoomChange={setCurrentZoom}
          roadBounds={roadBounds}
          onRoadBoundsChange={setRoadBounds}
          queryResults={queryResults}
          queryResultsLegendKey={queryResultsLegendKey}
          selectedRoadNetworkResult={selectedRoadNetworkResult}
          resetMapViewTrigger={resetMapViewTrigger}
          onLayerLoadingChange={setIsHazardLayerLoading}
          externalToggle3D={tutorialToggle3D}
          triggerBuildingPopup={tutorialBuildingPopup}
          onMapRef={setMapInstance}
          selectedDonutCategory={selectedDonutCategory}
          onResidentialBuildingsUpdate={setTotalResidentialBuildings}
          onTotalAreaUpdate={setTotalAreaKm2}
          onTotalPopulationUpdate={setTotalPopulation2024}
          buildingOpacity={buildingOpacity}
          activeSewerCategories={activeSewerCategories}
          activeGridSewerCategories={activeGridSewerCategories}
          scenarioGridGeoJSON={scenarioGridGeoJSON}
          scenarioNetworkGids={scenarioNetworkGids}
          bufferBldgIds={bufferBldgIds}
          excludedBldgIds={excludedBldgIds}
          bufferGeoJSON={bufferGeoJSON}
          scenarioZones={scenarioStats?.zones ?? null}
          onBuildingsLoadingChange={setIsBuildingsLoading}
          isScenarioRunning={isScenarioRunning}
          activeModule={activeModule}
          scenarioStats={activeModule === 'module1_suitability' ? scenarioStats : null}
          activeFstpLayers={activeFstpLayers}
          showFstpBuildings={showFstpBuildings}
          activeFleetClasses={activeFleetClasses}
          fleetOpacity={fleetOpacity}
          fstpOpacity={fstpOpacity}
        >
          <FloatingLegendPanel
            activeSector={activeSector}
            activeLayerId={activeLayerId}
            scenario={scenario}
            activeSubLayers={activeSubLayers}
            activeInfraLayers={activeInfraLayers}
            activeRoadNetworkIRAPType={activeRoadNetworkIRAPType}
            activeRoadSafetySubLayers={activeRoadSafetySubLayers}
            sectorOpacity={sectorOpacity}
            setSectorOpacity={setSectorOpacity}
            activeBaseLayers={activeBaseLayers}
            layerOpacities={layerOpacities}
            onLayerOpacityChange={handleLayerOpacityChange}
            roadNetworkStats={roadNetworkStats}
            roadSafetyStats={roadSafetyStats}
            minimized={legendMinimized}
            onMinimizeToggle={setLegendMinimized}
            isEconomicVulnerabilityActive={isEconomicVulnerabilityActive}
            activeBuildingHeightCategories={activeBuildingHeightCategories}
            activeBuildingAreaCategories={activeBuildingAreaCategories}
            activeBuildingCategories={activeBuildingCategories}
            buildingOpacity={buildingOpacity}
            onBuildingOpacityChange={setBuildingOpacity}
            activeGridSewerCategories={activeGridSewerCategories}
            activeSewerCategories={activeSewerCategories}
            sewerViewMode="buildings"
            hasBufferLayer={!!bufferGeoJSON}
            activeFleetClasses={activeModule === 'module3_collection' ? activeFleetClasses : []}
            fleetOpacity={fleetOpacity}
            onFleetOpacityChange={setFleetOpacity}
            activeFstpBands={activeModule === 'module3_collection' ? activeFstpLayers.filter(f => f.enabled).flatMap(f => f.activeBands) : []}
            fstpOpacity={fstpOpacity}
            onFstpOpacityChange={setFstpOpacity}
          />
        </MapCanvas>
        </div>

        <RightPanelContainer
          activeSector={activeSector}
          activeLayerId={activeLayerId}
          selectedWard={selectedWard}
          selectedWardName={selectedWardName}
          scenario={scenario}
          activeInfraLayers={activeInfraLayers}
          activeEducationSubLayers={activeEducationSubLayers}
          activeHealthcareSubLayers={activeHealthcareSubLayers}
          activePublicAmenitiesSubLayers={activePublicAmenitiesSubLayers}
          activeTransportSubLayers={activeTransportSubLayers}
          activeRoadSafetySubLayers={activeRoadSafetySubLayers}
          showQueryPanel={showQueryPanel}
          onCloseQuery={handleCloseQuery}
          activeBaseLayers={activeBaseLayers}
          selectedWardId={selectedWardId}
          selectedRoadName={selectedRoadName}
          activeHazardLayerId={activeHazardLayerId}
          activeHazardKey={activeHazardKey}
          onQueryResults={(results, lockedLegendKey) => {
            setQueryResults(results);
            setQueryResultsLegendKey(lockedLegendKey || null);
          }}
          onEnableInfraLayers={handleEnableInfraLayers}
          onQueryExecuted={handleQueryExecuted}
          onApplyFilters={handleApplyFilters}
          onZoomToPoint={handleZoomToPoint}
          onCloseResults={handleCloseQueryResults}
          onRoadNetworkSelect={setSelectedRoadNetworkResult}
          onActivateHazardLayer={handleActivateHazardLayer}
          onZoomToWards={handleZoomToWards}
          onZoomToRoadSegment={handleZoomToRoadSegment}
          educationCounts={educationCounts}
          healthcareCounts={healthcareCounts}
          publicAmenitiesCounts={publicAmenitiesCounts}
          transportCounts={transportCounts}
          roadNetworkStats={roadNetworkStats}
          roadSafetyStats={roadSafetyStats}
          selectedRoadStarSegment={selectedRoadStarSegment}
          onRoadStarSegmentSelect={setSelectedRoadStarSegment}
          onZoomToRoadStarSegment={handleZoomToRoadStarSegment}
          onResetBarChartFilters={handleResetBarChartFilters}
          selectedDonutCategory={selectedDonutCategory}
          onDonutCategorySelect={setSelectedDonutCategory}
          activeModule={activeModule}
          selectedLguName={selectedLguName}
          totalResidentialBuildings={totalResidentialBuildings}
          totalAreaKm2={totalAreaKm2}
          totalPopulation2024={totalPopulation2024}
          activeBuildingCategories={activeBuildingCategories}
          activeBuildingHeightCategories={activeBuildingHeightCategories}
          activeBuildingAreaCategories={activeBuildingAreaCategories}
          isEconomicVulnerabilityActive={isEconomicVulnerabilityActive}
          scenarioStats={activeModule === 'module1_suitability' ? scenarioStats : null}
          isScenarioRunning={isScenarioRunning}
          onZoneClick={handleZoneClick}
          activeFstpLayers={activeFstpLayers}
        />
      </div>

      {showAlerts && <AlertsPanel />}

      <Footer />

      <InfoModal isOpen={infoModalOpen} onClose={() => setInfoModalOpen(false)} />
      
      {showTutorial && (
        <TutorialOverlay 
          isOpen={showTutorial} 
          onClose={() => {
            if (onTutorialClose) {
              onTutorialClose();
            }
          }}
          onSetSector={(sector) => {
            setActiveSector(sector as Sector);
          }}
          onSetLayer={(layerId) => {
            setActiveLayerPerSector(prev => ({
              ...prev,
              [activeSector]: layerId
            }));
          }}
          onOpenDrawer={() => {
            setDrawerOpen(true);
          }}
          onCloseDrawer={() => {
            setDrawerOpen(false);
          }}
          onToggle3D={(enabled) => {
            // Update tutorial 3D toggle state for MapCanvas
            if (onTutorialToggle3DChange) {
              onTutorialToggle3DChange(enabled);
            }
            // Also toggle buildings layer in activeBaseLayers
            setTimeout(() => {
              if (enabled) {
                if (!activeBaseLayers.includes('buildings')) {
                  setActiveBaseLayers([...activeBaseLayers, 'buildings']);
                }
              } else {
                setActiveBaseLayers(activeBaseLayers.filter(l => l !== 'buildings'));
              }
            }, 200); // Small delay to ensure map is ready
          }}
          onToggleQueryTool={() => {
            handleOpenQueryPanel();
          }}
          onToggleComparison={() => {
            onCompareModeChange(true);
          }}
          onZoomTo={(coords, zoom) => {
            // Set location to trigger map zoom - use tutorial flag for clean zoom behavior
            setSelectedLocation({ 
              lat: coords[1], 
              lng: coords[0], 
              name: 'Tutorial Location', 
              zoom,
              isTutorialZoom: true // Special flag for tutorial zoom
            } as any);
          }}
          onToggleRoadSafety={(expanded) => {
            // Update tutorial road safety expanded state for LeftDrawer
            if (onTutorialRoadSafetyChange) {
              onTutorialRoadSafetyChange(expanded);
            }
          }}
          onSetRoadSafetyLayer={(layerId) => {
            console.log('🎯 Tutorial: Setting road safety layer to:', layerId);
            // Toggle road safety sub-layer on/off
            if (layerId) {
              // Select the road safety layer
              console.log('🔵 Activating road safety layer:', layerId);
              setActiveRoadSafetySubLayers([layerId]);
              setActiveRoadNetworkIRAPType(layerId);
              // Add road_safety to activeInfraLayers if not already there
              if (!activeInfraLayers.includes('road_safety')) {
                setActiveInfraLayers([...activeInfraLayers, 'road_safety']);
                console.log('✅ Added road_safety to activeInfraLayers');
              }
              // Deactivate road network base layer
              setActiveBaseLayers(activeBaseLayers.filter(id => id !== 'road_network_base'));
              console.log('✅ Road safety states updated:', {
                activeRoadSafetySubLayers: [layerId],
                activeRoadNetworkIRAPType: layerId,
                activeInfraLayers: [...activeInfraLayers, 'road_safety']
              });
            } else {
              // Deselect the road safety layer
              console.log('🔴 Deactivating road safety layer');
              setActiveRoadSafetySubLayers([]);
              setActiveRoadNetworkIRAPType(null);
              // Remove road_safety from activeInfraLayers
              setActiveInfraLayers(activeInfraLayers.filter(id => id !== 'road_safety'));
              // TURN BACK ON the road network base layer when road safety is turned off
              if (!activeBaseLayers.includes('road_network_base')) {
                setActiveBaseLayers([...activeBaseLayers, 'road_network_base']);
              }
            }
          }}
          onResetToDefault={() => {
            // Reset to default application state during tutorial
            resetToDefaultState();
          }}
          onToggleInfraSection={(expanded) => {
            // Update tutorial infrastructure expanded state for LeftDrawer
            if (onTutorialInfraExpandedChange) {
              onTutorialInfraExpandedChange(expanded);
            }
          }}
          onToggleInfraLayer={(layerId) => {
            console.log('🎯 Tutorial: Setting infrastructure layer to:', layerId);
            // Toggle infrastructure layer on/off
            if (layerId) {
              // Select the infrastructure layer
              console.log('🔵 Activating infrastructure layer:', layerId);
              if (!activeInfraLayers.includes(layerId)) {
                setActiveInfraLayers([...activeInfraLayers, layerId]);
              }
            } else {
              // Deselect the infrastructure layer
              console.log('🔴 Deactivating infrastructure layer');
              setActiveInfraLayers(activeInfraLayers.filter(id => id !== layerId));
            }
          }}
          onToggleRoadSafetySection={(expanded) => {
            // Update tutorial road safety expanded state for LeftDrawer
            if (onTutorialRoadSafetyChange) {
              onTutorialRoadSafetyChange(expanded);
            }
          }}
          onOpenBuildingPopup={(coords) => {
            console.log('🏢 Tutorial: Triggering building popup at:', coords);
            if (onTutorialBuildingPopupChange) {
              onTutorialBuildingPopupChange(coords);
              // Reset after a short delay to allow re-triggering if needed
              setTimeout(() => onTutorialBuildingPopupChange(null), 500);
            }
          }}
        />
      )}
    </div>
  );
}

// Wrap with HazardDataProvider for preloading KPI data
export default function App() {
  // Comparison mode state lifted to App level (outside HazardDataProvider)
  const [compareMode, setCompareMode] = useState(false);
  const [basemap, setBasemap] = useState<Basemap>('light');
  const [selectedWardId, setSelectedWardId] = useState<string>('all');
  const [selectedWardName, setSelectedWardName] = useState<string>('all'); // Store actual Barangay name for filtering
  const [selectedLguId, setSelectedLguId] = useState<string>('all');
  const [selectedLguName, setSelectedLguName] = useState<string>('all'); // Store actual LGU name for filtering

  // Tracks whether the current LGU filter was set explicitly by the user
  // (true) or auto-set as a side effect of selecting a barangay (false).
  // This drives the "clear filter" behaviour:
  //   - If barangay was picked directly (no prior LGU), clearing barangay
  //     also clears LGU → back to the original "all" state.
  //   - If the user picked an LGU first then a barangay, clearing the
  //     barangay should keep the LGU filter active.
  const lguSetByUserRef = useRef<boolean>(false);
  
  // Tutorial state - only starts when user clicks the Guided Tour button
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Tutorial pulse indicator state - shows for 5 minutes or until clicked
  const [showTutorialPulse, setShowTutorialPulse] = useState(true);
  
  // Hide tutorial pulse after 5 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTutorialPulse(false);
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearTimeout(timer);
  }, []);
  
  // Tutorial 3D mode control
  const [tutorialToggle3D, setTutorialToggle3D] = useState<boolean | undefined>(undefined);
  
  // Tutorial road safety control
  const [tutorialRoadSafetyExpanded, setTutorialRoadSafetyExpanded] = useState<boolean | undefined>(undefined);
  
  // Tutorial infrastructure control
  const [tutorialInfraExpanded, setTutorialInfraExpanded] = useState<boolean | undefined>(undefined);
  
  // Tutorial building popup trigger
  const [tutorialBuildingPopup, setTutorialBuildingPopup] = useState<[number, number] | null>(null);
  
  // Comparison mode states
  const [compareLeftSector, setCompareLeftSector] = useState<Sector>('base_layers');
  const [compareLeftLayer, setCompareLeftLayer] = useState<string>('elevation');
  const [compareLeftScenario, setCompareLeftScenario] = useState<Scenario>('baseline_2025');
  const [compareRightSector, setCompareRightSector] = useState<Sector>('climate_hazard');
  const [compareRightLayer, setCompareRightLayer] = useState<string>('flood_hazard');
  const [compareRightScenario, setCompareRightScenario] = useState<Scenario>('baseline_2025');

  // Handle tutorial close
  const handleTutorialClose = () => {
    setShowTutorial(false);
    // Mark tutorial as completed
    if (typeof window !== 'undefined') {
      localStorage.setItem('giz_tutorial_completed', 'true');
    }
  };

  // Handle tutorial restart
  const handleTutorialRestart = () => {
    setShowTutorial(true);
    setShowTutorialPulse(false); // Hide pulse indicator when tutorial is started
  };

  // If in comparison mode, render it directly without HazardDataProvider
  if (compareMode) {
    return (
      <ComparisonView
        onClose={() => setCompareMode(false)}
        basemap={basemap}
        scenario={'baseline_2025'}
        selectedWardId={selectedWardId}
        onWardSelect={(wardId, wardName) => {
          setSelectedWardId(wardId);
          setSelectedWardName(wardName);
        }}
        leftSector={compareLeftSector}
        leftLayer={compareLeftLayer}
        leftScenario={compareLeftScenario}
        onLeftSectorChange={setCompareLeftSector}
        onLeftLayerChange={setCompareLeftLayer}
        onLeftScenarioChange={setCompareLeftScenario}
        rightSector={compareRightSector}
        rightLayer={compareRightLayer}
        rightScenario={compareRightScenario}
        onRightSectorChange={setCompareRightSector}
        onRightLayerChange={setCompareRightLayer}
        onRightScenarioChange={setCompareRightScenario}
      />
    );
  }

  return (
    <HazardDataProvider initialScenario="baseline_2025" selectedWardId="all">
      <AppContent 
        onCompareModeChange={setCompareMode}
        basemap={basemap}
        onBasemapChange={setBasemap}
        selectedWardId={selectedWardId}
        selectedWardName={selectedWardName}
        onSelectedWardIdChange={(wardId, wardName, munName) => {
          const clearingBarangay = wardId === 'all' || wardName === 'all';

          setSelectedWardId(wardId);
          setSelectedWardName(wardName);

          if (!clearingBarangay && munName) {
            // Selecting a specific barangay → ensure matching LGU filter is on.
            // We don't mark this as a user-set LGU; it's an auto side-effect.
            console.log('📍 Barangay selected with LGU:', munName);
            const lguId = munName.toLowerCase().replace(/\s+/g, '_');
            setSelectedLguId(lguId);
            setSelectedLguName(munName);
          } else if (clearingBarangay && !lguSetByUserRef.current) {
            // Barangay cleared and the LGU was NOT explicitly picked by the
            // user → also clear LGU so the map returns to the original state.
            console.log('🧹 Barangay cleared with no user-set LGU → clearing LGU too');
            setSelectedLguId('all');
            setSelectedLguName('all');
          } else if (clearingBarangay) {
            console.log('🧹 Barangay cleared; keeping user-selected LGU filter');
          }
        }}
        selectedLguId={selectedLguId}
        selectedLguName={selectedLguName}
        onSelectedLguIdChange={(lguId, lguName) => {
          const clearingLgu = lguId === 'all' || lguName === 'all';

          setSelectedLguId(lguId);
          setSelectedLguName(lguName);

          if (!clearingLgu) {
            // User explicitly selected an LGU
            lguSetByUserRef.current = true;
            console.log('🏛️ LGU selected by user - resetting Barangay filter to "all"');
            setSelectedWardId('all');
            setSelectedWardName('all');
          } else {
            // Clearing LGU → also clear barangay and reset the "user-set" flag
            lguSetByUserRef.current = false;
            console.log('🧹 LGU cleared → clearing Barangay and resetting LGU origin flag');
            setSelectedWardId('all');
            setSelectedWardName('all');
          }
        }}
        compareLeftSector={compareLeftSector}
        compareLeftLayer={compareLeftLayer}
        compareLeftScenario={compareLeftScenario}
        compareRightSector={compareRightSector}
        compareRightLayer={compareRightLayer}
        compareRightScenario={compareRightScenario}
        onCompareLeftSectorChange={setCompareLeftSector}
        onCompareLeftLayerChange={setCompareLeftLayer}
        onCompareLeftScenarioChange={setCompareLeftScenario}
        onCompareRightSectorChange={setCompareRightSector}
        onCompareRightLayerChange={setCompareRightLayer}
        onCompareRightScenarioChange={setCompareRightScenario}
        showTutorial={showTutorial}
        onTutorialRestart={handleTutorialRestart}
        onTutorialClose={handleTutorialClose}
        showTutorialPulse={showTutorialPulse}
        tutorialToggle3D={tutorialToggle3D}
        onTutorialToggle3DChange={setTutorialToggle3D}
        tutorialRoadSafetyExpanded={tutorialRoadSafetyExpanded}
        onTutorialRoadSafetyChange={setTutorialRoadSafetyExpanded}
        tutorialInfraExpanded={tutorialInfraExpanded}
        onTutorialInfraExpandedChange={setTutorialInfraExpanded}
        tutorialBuildingPopup={tutorialBuildingPopup}
        onTutorialBuildingPopupChange={setTutorialBuildingPopup}
      />
      
      {/* Toast notifications */}
      <Toaster position="top-right" richColors />
    </HazardDataProvider>
  );
}