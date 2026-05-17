import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { Header } from './components/Header';
import { LeftDrawer } from './components/LeftDrawer';
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
import { TourismProvider } from './tourism/TourismContext';
import { TourismUIProvider, useTourismUI } from './tourism/tourismStore';
import { TourismLayers } from './tourism/TourismLayers';
import { useTourismPopups } from './tourism/usePopupBinding';
import { TourismLegend } from './tourism/TourismLegend';
import { TourismListPanel } from './tourism/TourismListPanel';
import { loadLegendDefinitions } from './utils/legendLoader';
import { fetchEducationCounts } from './utils/educationData';
import { fetchHealthcareCounts } from './utils/healthcareData';
import { fetchPublicAmenitiesCounts } from './utils/publicAmenitiesData';
import { fetchTransportCounts } from './utils/transportData';

export type Sector = 'heat' | 'air' | 'flood' | 'base_layers' | 'climate_hazard' | 'env_vulnerability' | 'multihazard' | 'roadsafety' | 'tourism';
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
  const tourismUI = useTourismUI();
  
  console.log('🏢 Tutorial building popup prop received:', tutorialBuildingPopup);

  // All useState hooks MUST be called before any returns
  const [activeSector, setActiveSector] = useState<Sector>('heat');
  const [activeLayerPerSector, setActiveLayerPerSector] = useState({
    heat: '',
    air: '',
    flood: '',
    base_layers: '',
    climate_hazard: '',
    env_vulnerability: ''
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
  
  const [activeInfraLayers, setActiveInfraLayers] = useState<string[]>([]);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; name: string; geojson?: any } | null>(null);
  const [currentZoom, setCurrentZoom] = useState(11); // Track current map zoom level
  
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

  // Tourism popups - wire MapLibre clicks to React-rendered popups
  useTourismPopups(mapInstance, true);

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

  // Missing state stubs (kept for prop compatibility)
  const [showQueryPanel, setShowQueryPanel] = useState(false);
  const [activeSubLayers, setActiveSubLayers] = useState<string[]>([]);
  const [activeBuildingCategories, setActiveBuildingCategories] = useState<string[]>([]);
  const [activeBuildingSubcategories, setActiveBuildingSubcategories] = useState<string[]>([]);
  const [previousBuildingCategories, setPreviousBuildingCategories] = useState<string[]>([]);
  const [isEconomicVulnerabilityActive, setIsEconomicVulnerabilityActive] = useState(false);
  const [activeBuildingHeightCategories, setActiveBuildingHeightCategories] = useState<string[]>([]);
  const [activeBuildingAreaCategories, setActiveBuildingAreaCategories] = useState<string[]>([]);

  // Legacy sanitation state stubs (kept for prop compatibility — values are always empty/null)
  const [activeSewerCategories] = useState<string[]>([]);
  const [activeGridSewerCategories] = useState<string[]>([]);
  const [scenarioGridGeoJSON] = useState<any>(null);
  const [scenarioNetworkGids] = useState<number[] | null>(null);
  const [bufferBldgIds] = useState<number[]>([]);
  const [bufferGeoJSON] = useState<any>(null);
  const [excludedBldgIds] = useState<number[]>([]);
  const [scenarioStats] = useState<any>(null);
  const [activeFstpLayers] = useState<any[]>([]);
  const [showFstpBuildings] = useState(false);
  const [activeFleetClasses] = useState<string[]>([]);
  const [fleetOpacity, setFleetOpacity] = useState(0.75);
  const [fstpOpacity, setFstpOpacity] = useState(0.75);
  const [activeRoadNetworkIRAPType, setActiveRoadNetworkIRAPType] = useState<string | null>(null);
  const [activeRoadSafetySubLayers, setActiveRoadSafetySubLayers] = useState<string[]>([]);
  const [roadSafetyStarRatings, setRoadSafetyStarRatings] = useState<Record<string, string | null>>({});
  const [selectedRoadName, setSelectedRoadName] = useState<string>('all');
  const [roadBounds, setRoadBounds] = useState<[number, number, number, number] | null>(null);
  const [selectedRoadStarSegment, setSelectedRoadStarSegment] = useState<any>(null);
  const [selectedDonutCategory, setSelectedDonutCategory] = useState<string | null>(null);
  const [sectorOpacity, setSectorOpacity] = useState(0.8);
  const [activeBaseLayers, setActiveBaseLayers] = useState<string[]>(['ward_boundary', 'waterbody', 'road_network_base', 'municipal_boundary']);
  const handleZoomToStarRating = () => {};
  const handleZoomToRoadStarSegment = () => {};
  const handleZoomToRoadSegment = () => {};
  const handleResetBarChartFilters = () => {};

  const activeLayerId = activeLayerPerSector[activeSector];
  console.log('🔑 [APP] activeLayerId derived from sector:', { activeSector, activeLayerId, activeLayerPerSector });

  // Derive activeHazardLayerId (full GeoServer layer name with scenario)
  const activeHazardLayerId = getLayerNameForScenario(activeLayerId, scenario) || '';
  
  // Derive activeHazardKey (layer name without prefix, e.g., "AST_2025", "Air_PM25")
  const activeHazardKey = activeHazardLayerId.split(':')[1] || '';
  
  console.log(`🔑 [APP] Active Hazard Key: ${activeHazardKey} (from ${activeHazardLayerId})`);
  

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
  const handleActivateHazardLayer = (hazardType: 'heat' | 'air' | 'flood') => {
    console.log('🎯 [APP] Activating hazard layer for query:', hazardType);
    
    // Map hazard type to sector and layer
    const hazardMapping = {
      heat: { sector: 'heat' as Sector, layer: 'heat_hhi' },
      air: { sector: 'air' as Sector, layer: 'air_aqi' },
      flood: { sector: 'flood' as Sector, layer: 'flood_fhi' }
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
      base_layers: '',
      climate_hazard: '',
      env_vulnerability: ''
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

  // ...existing code...

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

  // ...existing code...

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


      <div className="flex-1 flex overflow-hidden">
        <div data-tutorial="left-panel" className="flex">
          <LeftDrawer
            activeSector={activeSector}
            onSectorChange={handleSectorChange}
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
            isModuleActive={false}
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
          scenarioStats={null}
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
            activeFleetClasses={[]}
            fleetOpacity={fleetOpacity}
            onFleetOpacityChange={setFleetOpacity}
            activeFstpBands={[]}
            fstpOpacity={fstpOpacity}
            onFstpOpacityChange={setFstpOpacity}
            selectedLguName={selectedLguName}
            selectedWardName={selectedWardName}
          >
            <TourismLegend />
          </FloatingLegendPanel>
        <TourismLayers
          map={mapInstance}
          visible={true}
          showAnchor={tourismUI.showAnchor}
          showSecondary={tourismUI.showSecondary}
          showSupportive={tourismUI.showSupportive}
          showPremium={tourismUI.showPremium}
          showQuality={tourismUI.showQuality}
          showBookingAccommodations={tourismUI.showBookingAccommodations}
          showClusterPrimary={tourismUI.showClusterPrimary}
          showClusterEmerging={tourismUI.showClusterEmerging}
          showClusterSatellite={tourismUI.showClusterSatellite}
          anchorCategories={Array.from(tourismUI.enabledSiteCategoriesByTier.Anchor)}
          secondaryCategories={Array.from(tourismUI.enabledSiteCategoriesByTier.Secondary)}
          supportiveCategories={Array.from(tourismUI.enabledSiteCategoriesByTier.Supportive)}
          selectedLgu={selectedLguName}
          selectedBrgy={selectedWardName}
        />

        </MapCanvas>

        {/* Floating Tourism Directory list panel (Sites · Hospitality · Clusters) */}
        <TourismListPanel
          selectedLgu={selectedLguName}
          selectedBrgy={selectedWardName}
        />
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
          selectedLguName={selectedLguName}
          totalResidentialBuildings={totalResidentialBuildings}
          totalAreaKm2={totalAreaKm2}
          totalPopulation2024={totalPopulation2024}
          activeBuildingCategories={activeBuildingCategories}
          activeBuildingHeightCategories={activeBuildingHeightCategories}
          activeBuildingAreaCategories={activeBuildingAreaCategories}
          isEconomicVulnerabilityActive={isEconomicVulnerabilityActive}
          scenarioStats={null}
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
      <TourismProvider>
        <TourismUIProvider>
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
        </TourismUIProvider>
      </TourismProvider>
    </HazardDataProvider>
  );
}