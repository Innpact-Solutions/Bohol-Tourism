import React, { useState, useEffect } from 'react';
import { Search, MapPin, Download, FileText, X, ChevronDown, ChevronRight, School, Building2, Users, GraduationCap, BookOpen, Baby, Cross, Home, Heart, Landmark, Flame, TreePine, ShieldAlert, Mail, Phone, ShoppingBag, PlayCircle, Church, Store, Plane, Bus, Fuel, Train, Zap, Route, Star, AlertTriangle, Hospital, UserCircle2, Building, Warehouse, CircleDot, Wind, Waves, Layers, Droplets, RotateCcw, ArrowLeft, Car, Bike, User, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { fetchEducationData, fetchEducationCounts, mapSubcategoryIdToCategory as mapEducationId } from '../utils/educationData';
import { fetchHealthcareData, fetchHealthcareCounts, mapSubcategoryIdToCategory as mapHealthcareId } from '../utils/healthcareData';
import { fetchPublicAmenitiesData, fetchPublicAmenitiesCounts, mapSubcategoryIdToCategory as mapPublicAmenitiesId } from '../utils/publicAmenitiesData';
import { fetchTransportData, fetchTransportCounts, mapSubcategoryIdToCategory as mapTransportId } from '../utils/transportData';
import { LEGEND_DATA, LegendEntry } from '../data/legendDefinitions';
import { getHazardInfo, loadLegendDefinitions } from '../utils/legendLoader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QueryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeSector: string;
  selectedWard?: string;
  scenario?: string;
  activeHazardKey?: string; // The current active hazard key (e.g., "HHI_2025", "Air_AQI")
  onQueryResults?: (results: any[], lockedLegendKey?: string) => void; // Pass locked legend key with results
  onEnableInfraLayers?: () => void; // Callback to enable infrastructure layers
  onQueryExecuted?: () => void; // Callback when Apply Query is clicked
  onApplyFilters?: (filters: {
    educationSubLayers: string[];
    healthcareSubLayers: string[];
    publicAmenitiesSubLayers: string[];
    transportSubLayers: string[];
  }) => void; // Callback to apply infrastructure filters
  onZoomToPoint?: (lat: number, lng: long, name: string) => void; // Callback to zoom to a specific point
  onCloseResults?: () => void; // Callback when query results are closed
  onRoadNetworkSelect?: (selection: { category: string; gridcode: string; hazardColor?: string; activeUserType?: string; isStarRating?: boolean } | null) => void; // Callback when a road network result is selected for map highlighting
  onActivateHazardLayer?: (hazardType: 'heat' | 'air' | 'flood' | 'multiHazard') => void; // Callback to activate a hazard layer
  onZoomToWards?: (wardIds: string[]) => void; // Callback to zoom map to fit selected ward(s)
  onZoomToRoadSegment?: (features: any[], category: string, gridcode: string, color: string) => void; // Callback to zoom to and highlight road segment
  // Preloaded infrastructure counts from App.tsx
  educationCounts?: Record<string, number>;
  healthcareCounts?: Record<string, number>;
  publicAmenitiesCounts?: Record<string, number>;
  transportCounts?: Record<string, number>;
  roadNetworkStats?: Record<string, number>; // Road network statistics (km)
  roadSafetyStats?: any; // Road safety statistics with detailed breakdowns per type
}

interface QueryResult {
  id: string;
  name: string;
  type: string;
  ward: string;
  hhi2025?: number;
  airAqi?: number;
  floodHazard?: number;
  multiHazard?: number;
  lat: number;
  lng: number;
  safetyRating?: number;
  safetyType?: string;
}

interface Ward {
  id: string;
  wardNumber: number;
  zone: string;
  population: number;
}

// Infrastructure types with actual sublayers from the system
const INFRASTRUCTURE_TYPES = [
  { 
    id: 'educational', 
    label: 'Educational Institutions', 
    icon: School, 
    color: '#8B5CF6',
    count: 0, // Dynamic count
    subLayers: [
      { id: 'university', label: 'Universities', count: 0, icon: GraduationCap },
      { id: 'college', label: 'Colleges', count: 0, icon: BookOpen },
      { id: 'school', label: 'Schools', count: 0, icon: School },
      { id: 'anganwadi', label: 'Anganwadis', count: 0, icon: Baby },
    ]
  },
  { 
    id: 'healthcare', 
    label: 'Healthcare Facilities', 
    icon: Hospital, 
    color: '#EF4444',
    count: 0, // Dynamic count
    subLayers: [
      { id: 'hospital', label: 'Hospitals', count: 0, icon: Hospital },
      { id: 'health_centre', label: 'Health Centres', count: 0, icon: Heart },
      { id: 'nursing_home', label: 'Nursing Homes', count: 0, icon: Home },
    ]
  },
  { 
    id: 'public_amenities', 
    label: 'Public Amenities & Social Infrastructure', 
    icon: Users, 
    color: '#06B6D4',
    count: 0, // Dynamic count
    subLayers: [
      { id: 'community_centre', label: 'Community Centres', count: 0, icon: UserCircle2 },
      { id: 'culture_centre', label: 'Culture Centres', count: 0, icon: Landmark },
      { id: 'fire_station', label: 'Fire Stations', count: 0, icon: Flame },
      { id: 'government_buildings', label: 'Government Buildings', count: 0, icon: Building },
      { id: 'park', label: 'Parks', count: 0, icon: TreePine },
      { id: 'petrol_pump', label: 'Petrol Pump', count: 0, icon: Fuel },
      { id: 'playground_stadium', label: 'Playgrounds/Stadiums', count: 0, icon: PlayCircle },
      { id: 'police_outpost', label: 'Police Outposts', count: 0, icon: ShieldAlert },
      { id: 'religious', label: 'Religious Sites', count: 0, icon: Church },
      { id: 'telephone_exchange', label: 'Telephone Exchanges', count: 0, icon: Phone },
      { id: 'haat_market', label: 'Haats/Markets', count: 0, icon: ShoppingBag },
      { id: 'vending_zones', label: 'Vending Zones', count: 0, icon: Store },
    ]
  },
  { 
    id: 'transport_mobility', 
    label: 'Transport & Mobility Infrastructure', 
    icon: MapPin, 
    color: '#F59E0B',
    count: 0, // Dynamic count
    subLayers: [
      { id: 'airport', label: 'Airport', count: 0, icon: Plane },
      { id: 'bus_terminal', label: 'Bus Terminals', count: 0, icon: Warehouse },
      { id: 'bus_stop', label: 'Bus Stop', count: 0, icon: CircleDot },
      { id: 'ev_charging', label: 'EV Charging Stations', count: 0, icon: Zap },
      { id: 'railway_station', label: 'Railway Stations', count: 0, icon: Train },
    ]
  },
  { 
    id: 'road_network', 
    label: 'Road Network', 
    icon: Route, 
    color: '#3B82F6',
    count: 0, // Dynamic count
    subLayers: [
      { id: 'national_highway', label: 'National Highway (NH)', count: 0, icon: Route },
      { id: 'state_highway', label: 'State Highway (SH)', count: 0, icon: Route },
      { id: 'major_road', label: 'Major Roads', count: 0, icon: Route },
      { id: 'link_road', label: 'Link Roads', count: 0, icon: Route },
    ]
  },
  { 
    id: 'road_safety', 
    label: 'Road Safety (iRAP)', 
    icon: ShieldCheck, 
    color: '#10B981',
    count: 0, // Dynamic count
    subLayers: [
      { 
        id: 'irap_vehicle', 
        label: 'Vehicle Occupant Safety', 
        count: 0, 
        icon: Car,
        subLayers: [
          { id: 'vehicle_5star', label: '5 Star', count: 0, icon: Star },
          { id: 'vehicle_4star', label: '4 Star', count: 0, icon: Star },
          { id: 'vehicle_3star', label: '3 Star', count: 0, icon: Star },
          { id: 'vehicle_2star', label: '2 Star', count: 0, icon: Star },
          { id: 'vehicle_1star', label: '1 Star', count: 0, icon: Star },
        ]
      },
      { 
        id: 'irap_motorcycle', 
        label: 'Motorcyclist Safety', 
        count: 0, 
        icon: Bike,
        subLayers: [
          { id: 'motorcycle_5star', label: '5 Star', count: 0, icon: Star },
          { id: 'motorcycle_4star', label: '4 Star', count: 0, icon: Star },
          { id: 'motorcycle_3star', label: '3 Star', count: 0, icon: Star },
          { id: 'motorcycle_2star', label: '2 Star', count: 0, icon: Star },
          { id: 'motorcycle_1star', label: '1 Star', count: 0, icon: Star },
        ]
      },
      { 
        id: 'irap_bicycle', 
        label: 'Bicyclist Safety', 
        count: 0, 
        icon: Bike,
        subLayers: [
          { id: 'bicycle_5star', label: '5 Star', count: 0, icon: Star },
          { id: 'bicycle_4star', label: '4 Star', count: 0, icon: Star },
          { id: 'bicycle_3star', label: '3 Star', count: 0, icon: Star },
          { id: 'bicycle_2star', label: '2 Star', count: 0, icon: Star },
          { id: 'bicycle_1star', label: '1 Star', count: 0, icon: Star },
        ]
      },
      { 
        id: 'irap_pedestrian', 
        label: 'Pedestrian Safety', 
        count: 0, 
        icon: User,
        subLayers: [
          { id: 'pedestrian_5star', label: '5 Star', count: 0, icon: Star },
          { id: 'pedestrian_4star', label: '4 Star', count: 0, icon: Star },
          { id: 'pedestrian_3star', label: '3 Star', count: 0, icon: Star },
          { id: 'pedestrian_2star', label: '2 Star', count: 0, icon: Star },
          { id: 'pedestrian_1star', label: '1 Star', count: 0, icon: Star },
        ]
      },
    ]
  }
];

const RISK_LEVELS = ['Low', 'Moderate', 'High', 'Extreme'];
const SAFETY_RATINGS = ['Any Rating', '4 Star', '3 Star', '2 Star', '1 Star'];
const SAFETY_RATING_TYPES = ['Vehicle Rating', 'Motorcycle Rating', 'Bicycle Rating', 'Pedestrian Rating'];

// Hazard layer mapping - maps UI dropdown to actual layer field and legend data
const HAZARD_LAYER_MAPPING = {
  heat: {
    field: 'HHI_2025',
    legendKey: 'HHI_2025',
    label: 'Heat Stress'
  },
  air: {
    field: 'Air_AQI',
    legendKey: 'Air_AQI',
    label: 'Air Pollution'
  },
  flood: {
    field: 'Flood_Hazard',
    legendKey: 'Flood_Hazard',
    label: 'Flood'
  },
  multiHazard: {
    field: 'Multi_Hazard_BBSR',
    legendKey: 'Multi_Hazard_BBSR',
    label: 'Multi-Hazard'
  }
};

// Get legend options for each hazard type
function getLegendOptions(legendKey: string): Array<{ label: string; gridcode: number; value: string }> {
  const legendData = LEGEND_DATA[legendKey];
  if (!legendData) return [];
  
  // Sort by gridcode in ascending order
  const sortedData = [...legendData].sort((a, b) => a.gridcode - b.gridcode);
  
  // Return WITHOUT the "Any" option
  return sortedData.map(entry => ({
    label: `${entry.label.trim()} (${entry.description})`,
    gridcode: entry.gridcode,
    value: `${entry.label.trim()} (${entry.description})`
  }));
}

export function QueryPanel({ isOpen, onClose, activeSector, selectedWard, scenario, activeHazardKey, onQueryResults, onEnableInfraLayers, onQueryExecuted, onApplyFilters, onZoomToPoint, onCloseResults, onRoadNetworkSelect, onActivateHazardLayer, onZoomToWards, onZoomToRoadSegment, educationCounts, healthcareCounts, publicAmenitiesCounts, transportCounts, roadNetworkStats, roadSafetyStats }: QueryPanelProps) {
  const [selectedInfraTypes, setSelectedInfraTypes] = useState<string[]>([]);
  const [selectedSubLayers, setSelectedSubLayers] = useState<string[]>([]);
  const [expandedTypes, setExpandedTypes] = useState<string[]>([]);
  const [expandedSubLayers, setExpandedSubLayers] = useState<string[]>([]); // Track expanded nested sublayers
  const [heatRisk, setHeatRisk] = useState<string[]>([]);
  const [airRisk, setAirRisk] = useState<string[]>([]);
  const [floodRisk, setFloodRisk] = useState<string[]>([]);
  const [multiHazardRisk, setMultiHazardRisk] = useState<string[]>([]);
  const [safetyRatings, setSafetyRatings] = useState<string[]>([]);
  const [safetyRatingType, setSafetyRatingType] = useState('Vehicle Rating');
  const [selectedWards, setSelectedWards] = useState<string[]>(['all']); // Changed to array for multi-selection
  
  const [results, setResults] = useState<QueryResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryError, setQueryError] = useState<Error | null>(null);
  
  // State for selected road network result (for map highlighting)
  const [selectedRoadResult, setSelectedRoadResult] = useState<{category: string, gridcode: string, hazardColor?: string} | null>(null);

  // State for visibility control of road query results
  // Key format: "category:gridcode" -> boolean (true = visible, false = hidden)
  const [roadResultVisibility, setRoadResultVisibility] = useState<Record<string, boolean>>({});
  
  // State for collapsed/expanded categories in road results
  // Key format: "category" -> boolean (true = expanded, false = collapsed)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // State for expanded hazard levels (second level) in Road Safety results
  // Key format: "category:gridcode" -> boolean (true = expanded, false = collapsed)
  const [expandedHazardLevels, setExpandedHazardLevels] = useState<Record<string, boolean>>({});
  
  // Store full road query results for filtering based on visibility
  const [fullRoadResults, setFullRoadResults] = useState<any>(null);
  
  // Store the legend key at the time query was executed (locked, doesn't change when switching layers)
  const [queryExecutionLegendKey, setQueryExecutionLegendKey] = useState<string | null>(null);
  
  // Store active user type for road safety queries (e.g., "vehicle_occupant", "motorcyclist")
  const [activeUserType, setActiveUserType] = useState<string>('');

  // Expanded states for hazard filters and ward filter
  const [heatExpanded, setHeatExpanded] = useState(false);
  const [airExpanded, setAirExpanded] = useState(false);
  const [floodExpanded, setFloodExpanded] = useState(false);
  const [multiHazardExpanded, setMultiHazardExpanded] = useState(false);
  const [wardExpanded, setWardExpanded] = useState(false);

  // State for ward data
  const [wards, setWards] = useState<Ward[]>([]);
  const [isLoadingWards, setIsLoadingWards] = useState(true);
  
  // State for hazard distribution percentages
  const [hazardPercentages, setHazardPercentages] = useState<Record<string, Record<number, number>>>({});
  const [isLoadingHazardPercentages, setIsLoadingHazardPercentages] = useState(false);
  
  // Ensure legend definitions are loaded
  useEffect(() => {
    loadLegendDefinitions().then(() => {
      console.log('[QueryPanel] Legend definitions loaded successfully');
    }).catch((error: Error) => {
      console.error('[QueryPanel] Error loading legend definitions:', error);
    });
  }, []);
  
  // REMOVED: Fetch ward data from GeoServer on mount (for old dashboard version)
  useEffect(() => {
    const fetchWardData = async () => {
      try {
        setIsLoadingWards(true);
        // ⚠️ DEPRECATED: Old GIZ_BBSR:Ward_Boundary removed - CWIS dashboard uses Barangay structure
        console.log('ℹ️ [QueryPanel] Ward data fetching disabled - CWIS dashboard uses Barangay structure instead');
        
        // Fallback to basic ward list (to be replaced with CWIS barangay data)
        const geojson = { features: [] };
        
        if (geojson.features && geojson.features.length > 0) {
          // Parse ward data from GeoJSON features
          const wardList: Ward[] = geojson.features
            .map((feature: any) => {
              const props = feature.properties;
              const wardNumber = props.Ward || props.WARD || props.ward || props.Ward_No || props.WARD_NO || props.ward_no || props.WardNo;
              const zone = props.Zone || props.ZONE || props.zone || 'Unknown Zone';
              const population = props.Pop_2011 || props.POP_2011 || props.pop_2011 || 0;
              
              return {
                id: `ward_${wardNumber}`,
                wardNumber: parseInt(wardNumber),
                zone: zone,
                population: typeof population === 'string' ? parseInt(population.replace(/,/g, '')) : population
              };
            })
            .filter((ward: Ward) => !isNaN(ward.wardNumber)) // Filter out invalid wards
            // Remove duplicates by ward number (keep first occurrence)
            .filter((ward: Ward, index: number, self: Ward[]) => 
              index === self.findIndex((w) => w.wardNumber === ward.wardNumber)
            )
            .sort((a: Ward, b: Ward) => a.wardNumber - b.wardNumber); // Sort by ward number
          
          // Add "All Wards" option at the beginning
          const totalPopulation = wardList.reduce((sum, ward) => sum + ward.population, 0);
          const allWardsOption: Ward = {
            id: 'all',
            wardNumber: 0,
            zone: 'City-wide',
            population: totalPopulation
          };
          
          setWards([allWardsOption, ...wardList]);
          console.log('✅ [QueryPanel] Loaded', wardList.length, 'wards from GeoServer');
        }
        
        setIsLoadingWards(false);
      } catch (error) {
        console.error('❌ [QueryPanel] Failed to fetch ward data:', error);
        // Fallback to basic ward list
        setWards([
          { id: 'all', wardNumber: 0, zone: 'City-wide', population: 0 }
        ]);
        setIsLoadingWards(false);
      }
    };
    
    fetchWardData();
  }, []);

  // Effect to filter road features based on visibility state
  useEffect(() => {
    if (!fullRoadResults || !fullRoadResults.features || !onQueryResults) return;
    
    // Filter features based on visibility - but handle segments with different gridcodes
    const visibleFeatures: any[] = [];
    
    fullRoadResults.features.forEach((feature: any) => {
      const category = feature.properties?.category || '';
      const segments = feature.properties?.segments || [];
      
      // Filter segments based on their individual gridcodes
      const visibleSegments = segments.filter((segment: any) => {
        const gridcode = segment.gridcode || 
                        segment.properties?.gridcode || 
                        segment.properties?.HHI_2025 || 
                        segment.properties?.Air_AQI || 
                        segment.properties?.Flood_Hazard;
        
        // For road safety, check BOTH star rating category AND road name
        const roadNameKey = `${category}:${gridcode}`;
        const starRatingCategory = feature.properties?.starRatingCategory;
        const starRatingKey = starRatingCategory ? `${starRatingCategory}:${gridcode}` : null;
        
        // Check if this specific segment's gridcode is visible
        // For road safety: check star rating key first, then road name key
        // For road network: only check road name key
        let isVisible = true;
        
        if (starRatingKey) {
          // Road Safety: check star rating category visibility
          isVisible = roadResultVisibility[starRatingKey] !== false;
          
          // Debug logging for first few segments when filtering
          if (Object.values(roadResultVisibility).some(v => v === false)) {
            const firstHidden = Object.entries(roadResultVisibility).find(([k, v]) => v === false);
            if (firstHidden && visibleFeatures.length === 0 && segments.indexOf(segment) < 2) {
              console.log(`🔍 [Segment Filter] Road Safety: category="${category}", starRatingCategory="${starRatingCategory}", gridcode="${gridcode}", starRatingKey="${starRatingKey}", isVisible=${isVisible}`);
            }
          }
        } else {
          // Road Network: check road name visibility
          isVisible = roadResultVisibility[roadNameKey] !== false;
          
          // Debug logging for first few segments when filtering
          if (Object.values(roadResultVisibility).some(v => v === false)) {
            const firstHidden = Object.entries(roadResultVisibility).find(([k, v]) => v === false);
            if (firstHidden && visibleFeatures.length === 0 && segments.indexOf(segment) < 2) {
              console.log(`🔍 [Segment Filter] Road Network: category="${category}", gridcode="${gridcode}", roadNameKey="${roadNameKey}", isVisible=${isVisible}`);
            }
          }
        }
        
        return isVisible;
      });
      
      // Only include the feature if it has at least one visible segment
      if (visibleSegments.length > 0) {
        visibleFeatures.push({
          ...feature,
          properties: {
            ...feature.properties,
            segments: visibleSegments
          }
        });
      }
    });
    
    // Detailed logging - count segments, not features
    let totalSegments = 0;
    let visibleSegments = 0;
    const segmentsByKey: Record<string, number> = {};
    
    fullRoadResults.features.forEach((feature: any) => {
      const category = feature.properties?.category || '';
      const segments = feature.properties?.segments || [];
      
      segments.forEach((segment: any) => {
        const gridcode = segment.gridcode || 
                        segment.properties?.gridcode || 
                        segment.properties?.HHI_2025 || 
                        segment.properties?.Air_AQI || 
                        segment.properties?.Flood_Hazard;
        
        const visibilityKey = `${category}:${gridcode}`;
        totalSegments++;
        
        if (roadResultVisibility[visibilityKey] !== false) {
          visibleSegments++;
        }
        
        segmentsByKey[visibilityKey] = (segmentsByKey[visibilityKey] || 0) + 1;
      });
    });
    
    const hiddenKeys = Object.entries(roadResultVisibility)
      .filter(([k, v]) => v === false)
      .map(([k]) => k);
    
    console.log('🔍 [QueryPanel] Segment filtering details:', {
      totalFeatures: fullRoadResults.features.length,
      totalSegments: totalSegments,
      visibleFeaturesWithSegments: visibleFeatures.length,
      visibleSegments: visibleSegments,
      hiddenSegments: totalSegments - visibleSegments,
      hiddenKeys: hiddenKeys,
      segmentCountByKey: segmentsByKey,
      visibilityState: roadResultVisibility
    });
    
    // Pass filtered features to map with locked legend key
    console.log('📤 [QueryPanel] Sending filtered features to map:', visibleFeatures.length, 'features');
    onQueryResults(visibleFeatures, queryExecutionLegendKey || undefined);
  }, [roadResultVisibility, fullRoadResults, queryExecutionLegendKey]);

  // REMOVED: Fetch hazard distribution percentages for all hazard types (for old dashboard version)
  useEffect(() => {
    const fetchHazardPercentages = async () => {
      setIsLoadingHazardPercentages(true);
      try {
        console.log('ℹ️ [QueryPanel] Hazard percentages fetching disabled - to be redeveloped for CWIS dashboard');
        
        // REMOVED API CALL - Old dashboard version
        // All hazard percentage calculation logic removed
        
        // Mock empty data
        const percentages: Record<string, Record<number, number>> = {};
        setHazardPercentages(percentages);
        
      } catch (error) {
        console.error('❌ [QueryPanel] Failed to fetch hazard percentages:', error);
      } finally {
        setIsLoadingHazardPercentages(false);
      }
    };

    fetchHazardPercentages();
  }, []); // Only fetch once on mount - no dependency on selectedWards

  // Check if infrastructure counts are loading
  const isLoadingInfraCounts = !educationCounts && !healthcareCounts && !publicAmenitiesCounts && !transportCounts;

  // Build infrastructure types with dynamic counts from preloaded props
  const infrastructureTypes = INFRASTRUCTURE_TYPES.map(type => {
    if (type.id === 'educational') {
      console.log('[QueryPanel] 🎓 Education counts received:', educationCounts);
      console.log('[QueryPanel] 🎓 Available keys in educationCounts:', educationCounts ? Object.keys(educationCounts) : 'undefined');
      const total = (educationCounts?.['university'] || 0) + 
                    (educationCounts?.['college'] || 0) + 
                    (educationCounts?.['school'] || 0) + 
                    (educationCounts?.['anganwadi'] || educationCounts?.['anganwadis'] || 0);
      console.log('[QueryPanel] 🎓 Education total:', total, '| Breakdown:', {
        university: educationCounts?.['university'] || 0,
        college: educationCounts?.['college'] || 0,
        school: educationCounts?.['school'] || 0,
        anganwadi: educationCounts?.['anganwadi'] || educationCounts?.['anganwadis'] || 0
      });
      return {
        ...type,
        count: total,
        subLayers: [
          { id: 'university', label: 'Universities', count: educationCounts?.['university'] || 0, icon: GraduationCap },
          { id: 'college', label: 'Colleges', count: educationCounts?.['college'] || 0, icon: BookOpen },
          { id: 'school', label: 'Schools', count: educationCounts?.['school'] || 0, icon: School },
          { id: 'anganwadi', label: 'Anganwadis', count: educationCounts?.['anganwadi'] || educationCounts?.['anganwadis'] || 0, icon: Baby },
        ]
      };
    }
    if (type.id === 'healthcare') {
      console.log('[QueryPanel] 🏥 Healthcare counts received:', healthcareCounts);
      console.log('[QueryPanel] 🏥 Available keys in healthcareCounts:', healthcareCounts ? Object.keys(healthcareCounts) : 'undefined');
      const total = (healthcareCounts?.['hospital'] || 0) + 
                    (healthcareCounts?.['health_centre'] || healthcareCounts?.['health_center'] || healthcareCounts?.['health centre'] || 0) + 
                    (healthcareCounts?.['nursing_home'] || healthcareCounts?.['nursing home'] || 0);
      console.log('[QueryPanel] 🏥 Healthcare total:', total, '| Breakdown:', {
        hospital: healthcareCounts?.['hospital'] || 0,
        health_centre: healthcareCounts?.['health_centre'] || healthcareCounts?.['health_center'] || healthcareCounts?.['health centre'] || 0,
        nursing_home: healthcareCounts?.['nursing_home'] || healthcareCounts?.['nursing home'] || 0
      });
      return {
        ...type,
        count: total,
        subLayers: [
          { id: 'hospital', label: 'Hospitals', count: healthcareCounts?.['hospital'] || 0, icon: Hospital },
          { id: 'health_centre', label: 'Health Centres', count: healthcareCounts?.['health_centre'] || healthcareCounts?.['health_center'] || healthcareCounts?.['health centre'] || 0, icon: Heart },
          { id: 'nursing_home', label: 'Nursing Homes', count: healthcareCounts?.['nursing_home'] || healthcareCounts?.['nursing home'] || 0, icon: Home },
        ]
      };
    }
    if (type.id === 'public_amenities') {
      console.log('[QueryPanel] 🏛️ Public Amenities counts received:', publicAmenitiesCounts);
      console.log('[QueryPanel] 🏛️ Available keys in publicAmenitiesCounts:', publicAmenitiesCounts ? Object.keys(publicAmenitiesCounts) : 'undefined');
      const total = Object.values(publicAmenitiesCounts || {}).reduce((sum, count) => sum + count, 0);
      console.log('[QueryPanel] 🏛️ Public Amenities total:', total);
      return {
        ...type,
        count: total,
        subLayers: [
          { id: 'community_centre', label: 'Community Centres', count: publicAmenitiesCounts?.['community_centre'] || publicAmenitiesCounts?.['community centre'] || 0, icon: UserCircle2 },
          { id: 'culture_centre', label: 'Culture Centres', count: publicAmenitiesCounts?.['culture_centre'] || publicAmenitiesCounts?.['culture centre'] || 0, icon: Landmark },
          { id: 'fire_station', label: 'Fire Stations', count: publicAmenitiesCounts?.['fire_station'] || publicAmenitiesCounts?.['fire station'] || 0, icon: Flame },
          { id: 'government_buildings', label: 'Government Buildings', count: publicAmenitiesCounts?.['government_buildings'] || publicAmenitiesCounts?.['government buildings'] || 0, icon: Building },
          { id: 'park', label: 'Parks', count: publicAmenitiesCounts?.['park'] || 0, icon: TreePine },
          { id: 'petrol_pump', label: 'Petrol Pump', count: publicAmenitiesCounts?.['petrol_pump'] || publicAmenitiesCounts?.['petrol pump'] || 0, icon: Fuel },
          { id: 'playground_stadium', label: 'Playgrounds/Stadiums', count: publicAmenitiesCounts?.['playground_stadium'] || publicAmenitiesCounts?.['playground/stadium'] || 0, icon: PlayCircle },
          { id: 'police_outpost', label: 'Police Outposts', count: publicAmenitiesCounts?.['police_outpost'] || publicAmenitiesCounts?.['police outpost'] || 0, icon: ShieldAlert },
          { id: 'religious', label: 'Religious Sites', count: publicAmenitiesCounts?.['religious'] || 0, icon: Church },
          { id: 'telephone_exchange', label: 'Telephone Exchanges', count: publicAmenitiesCounts?.['telephone_exchange'] || publicAmenitiesCounts?.['telephone exchange'] || 0, icon: Phone },
          { id: 'haat_market', label: 'Haats/Markets', count: publicAmenitiesCounts?.['haat_market'] || publicAmenitiesCounts?.['haat/ market'] || publicAmenitiesCounts?.['haat market'] || 0, icon: ShoppingBag },
          { id: 'vending_zones', label: 'Vending Zones', count: publicAmenitiesCounts?.['vending_zones'] || publicAmenitiesCounts?.['vending zones'] || 0, icon: Store },
        ]
      };
    }
    if (type.id === 'transport_mobility') {
      console.log('[QueryPanel] 🚌 Transport counts received:', transportCounts);
      console.log('[QueryPanel] 🚌 Available keys in transportCounts:', transportCounts ? Object.keys(transportCounts) : 'undefined');
      const total = Object.values(transportCounts || {}).reduce((sum, count) => sum + count, 0);
      console.log('[QueryPanel] 🚌 Transport total:', total);
      return {
        ...type,
        count: total,
        subLayers: [
          { id: 'airport', label: 'Airport', count: transportCounts?.['airport'] || 0, icon: Plane },
          { id: 'bus_terminal', label: 'Bus Terminals', count: transportCounts?.['bus_terminal'] || transportCounts?.['bus terminal'] || 0, icon: Warehouse },
          { id: 'bus_stop', label: 'Bus Stop', count: transportCounts?.['bus_stop'] || transportCounts?.['bus stop'] || 0, icon: CircleDot },
          { id: 'ev_charging', label: 'EV Charging Stations', count: transportCounts?.['ev_charging'] || transportCounts?.['ev charging'] || 0, icon: Zap },
          { id: 'railway_station', label: 'Railway Stations', count: transportCounts?.['railway_station'] || transportCounts?.['railway station'] || 0, icon: Train },
        ]
      };
    }
    if (type.id === 'road_network') {
      console.log('[QueryPanel] 🛣️ Road Network stats received:', roadNetworkStats);
      console.log('[QueryPanel] 🛣️ Available keys in roadNetworkStats:', roadNetworkStats ? Object.keys(roadNetworkStats) : 'undefined');
      const total = (roadNetworkStats?.['National Highway'] || 0) + 
                    (roadNetworkStats?.['State Highway'] || 0) + 
                    (roadNetworkStats?.['Major Road'] || 0) + 
                    (roadNetworkStats?.['Link Road'] || 0);
      console.log('[QueryPanel] 🛣️ Road Network total:', total, 'km | Breakdown:', {
        'National Highway': roadNetworkStats?.['National Highway'] || 0,
        'State Highway': roadNetworkStats?.['State Highway'] || 0,
        'Major Road': roadNetworkStats?.['Major Road'] || 0,
        'Link Road': roadNetworkStats?.['Link Road'] || 0
      });
      return {
        ...type,
        count: 4, // Number of subcategories (not km)
        subLayers: [
          { id: 'national_highway', label: 'National Highway (NH)', count: roadNetworkStats?.['National Highway'] || 0, icon: Route },
          { id: 'state_highway', label: 'State Highway (SH)', count: roadNetworkStats?.['State Highway'] || 0, icon: Route },
          { id: 'major_road', label: 'Major Roads', count: roadNetworkStats?.['Major Road'] || 0, icon: Route },
          { id: 'link_road', label: 'Link Roads', count: roadNetworkStats?.['Link Road'] || 0, icon: Route },
        ]
      };
    }
    if (type.id === 'road_safety') {
      console.log('[QueryPanel] 🛡️ Road Safety stats received:', roadSafetyStats);
      
      // Extract data from detailed structure
      const vehicleData = roadSafetyStats?.irap_vehicle || { totalLength: 0, '5star': 0, '4star': 0, '3star': 0, '2star': 0, '1star': 0 };
      const motorcycleData = roadSafetyStats?.irap_motorcycle || { totalLength: 0, '5star': 0, '4star': 0, '3star': 0, '2star': 0, '1star': 0 };
      const bicycleData = roadSafetyStats?.irap_bicycle || { totalLength: 0, '5star': 0, '4star': 0, '3star': 0, '2star': 0, '1star': 0 };
      const pedestrianData = roadSafetyStats?.irap_pedestrian || { totalLength: 0, '5star': 0, '4star': 0, '3star': 0, '2star': 0, '1star': 0 };
      
      // Calculate total km across all types
      const total = vehicleData.totalLength + motorcycleData.totalLength + bicycleData.totalLength + pedestrianData.totalLength;
      
      console.log('[QueryPanel] 🛡️ Road Safety total:', total, 'km | Vehicle:', vehicleData.totalLength, 'Motorcycle:', motorcycleData.totalLength, 'Bicycle:', bicycleData.totalLength, 'Pedestrian:', pedestrianData.totalLength);
      
      return {
        ...type,
        count: 4, // Number of subcategories (not km)
        subLayers: [
          { 
            id: 'irap_vehicle', 
            label: 'Vehicle Occupant Safety', 
            count: vehicleData.totalLength,
            icon: Car,
            subLayers: [
              { id: 'vehicle_5star', label: '5 Star', count: vehicleData['5star'], icon: Star },
              { id: 'vehicle_4star', label: '4 Star', count: vehicleData['4star'], icon: Star },
              { id: 'vehicle_3star', label: '3 Star', count: vehicleData['3star'], icon: Star },
              { id: 'vehicle_2star', label: '2 Star', count: vehicleData['2star'], icon: Star },
              { id: 'vehicle_1star', label: '1 Star', count: vehicleData['1star'], icon: Star },
            ]
          },
          { 
            id: 'irap_motorcycle', 
            label: 'Motorcyclist Safety', 
            count: motorcycleData.totalLength,
            icon: Bike,
            subLayers: [
              { id: 'motorcycle_5star', label: '5 Star', count: motorcycleData['5star'], icon: Star },
              { id: 'motorcycle_4star', label: '4 Star', count: motorcycleData['4star'], icon: Star },
              { id: 'motorcycle_3star', label: '3 Star', count: motorcycleData['3star'], icon: Star },
              { id: 'motorcycle_2star', label: '2 Star', count: motorcycleData['2star'], icon: Star },
              { id: 'motorcycle_1star', label: '1 Star', count: motorcycleData['1star'], icon: Star },
            ]
          },
          { 
            id: 'irap_bicycle', 
            label: 'Bicyclist Safety', 
            count: bicycleData.totalLength,
            icon: Bike,
            subLayers: [
              { id: 'bicycle_5star', label: '5 Star', count: bicycleData['5star'], icon: Star },
              { id: 'bicycle_4star', label: '4 Star', count: bicycleData['4star'], icon: Star },
              { id: 'bicycle_3star', label: '3 Star', count: bicycleData['3star'], icon: Star },
              { id: 'bicycle_2star', label: '2 Star', count: bicycleData['2star'], icon: Star },
              { id: 'bicycle_1star', label: '1 Star', count: bicycleData['1star'], icon: Star },
            ]
          },
          { 
            id: 'irap_pedestrian', 
            label: 'Pedestrian Safety', 
            count: pedestrianData.totalLength,
            icon: User,
            subLayers: [
              { id: 'pedestrian_5star', label: '5 Star', count: pedestrianData['5star'], icon: Star },
              { id: 'pedestrian_4star', label: '4 Star', count: pedestrianData['4star'], icon: Star },
              { id: 'pedestrian_3star', label: '3 Star', count: pedestrianData['3star'], icon: Star },
              { id: 'pedestrian_2star', label: '2 Star', count: pedestrianData['2star'], icon: Star },
              { id: 'pedestrian_1star', label: '1 Star', count: pedestrianData['1star'], icon: Star },
            ]
          },
        ]
      };
    }
    return type;
  });

  // Helper function to get the category of an infrastructure type
  const getInfraCategory = (infraTypeId: string): 'point_data' | 'line_data' | null => {
    if (infraTypeId === 'road_network' || infraTypeId === 'road_safety') return 'line_data';
    if (['educational', 'healthcare', 'public_amenities', 'transport_mobility'].includes(infraTypeId)) {
      return 'point_data';
    }
    return null;
  };

  // Helper function to check if a selection is allowed
  const canSelectInfraType = (infraTypeId: string): boolean => {
    // If nothing is selected, allow any selection
    if (selectedInfraTypes.length === 0 && selectedSubLayers.length === 0) {
      return true;
    }

    // If this type is already selected, allow deselection
    if (selectedInfraTypes.includes(infraTypeId)) {
      return true;
    }

    const newCategory = getInfraCategory(infraTypeId);
    
    // Check if any infrastructure type from a different category is selected
    for (const selectedType of selectedInfraTypes) {
      const selectedCategory = getInfraCategory(selectedType);
      if (selectedCategory !== newCategory) {
        return false; // Different category is already selected (point_data vs line_data)
      }
    }

    // Special case: road_network and road_safety are mutually exclusive with each other
    if (infraTypeId === 'road_network' && selectedInfraTypes.includes('road_safety')) {
      return false;
    }
    if (infraTypeId === 'road_safety' && selectedInfraTypes.includes('road_network')) {
      return false;
    }

    return true;
  };

  // Helper function to get the parent road safety type from a sublayer ID
  const getRoadSafetyParentType = (subLayerId: string): string | null => {
    if (subLayerId.startsWith('vehicle_')) return 'irap_vehicle';
    if (subLayerId.startsWith('motorcycle_')) return 'irap_motorcycle';
    if (subLayerId.startsWith('bicycle_')) return 'irap_bicycle';
    if (subLayerId.startsWith('pedestrian_')) return 'irap_pedestrian';
    // Direct parent types
    if (['irap_vehicle', 'irap_motorcycle', 'irap_bicycle', 'irap_pedestrian'].includes(subLayerId)) {
      return subLayerId;
    }
    return null;
  };

  // Helper function to check if a sublayer can be selected
  const canSelectSubLayer = (subLayerId: string): boolean => {
    // Find which infrastructure type this sublayer belongs to
    const parentInfraType = infrastructureTypes.find(type => 
      type.subLayers.some(sl => {
        if (sl.id === subLayerId) return true;
        if (sl.subLayers) {
          return sl.subLayers.some((nested: any) => nested.id === subLayerId);
        }
        return false;
      })
    );

    if (!parentInfraType) return false;

    // If already selected, allow deselection
    if (selectedSubLayers.includes(subLayerId)) {
      return true;
    }

    // Check category-level mutual exclusivity
    const newCategory = getInfraCategory(parentInfraType.id);
    for (const selectedType of selectedInfraTypes) {
      const selectedCategory = getInfraCategory(selectedType);
      if (selectedCategory && newCategory && selectedCategory !== newCategory) {
        return false; // Different category is already selected
      }
    }

    // Special handling for road safety: only one parent type can be selected at a time
    if (parentInfraType.id === 'road_safety') {
      const newParentType = getRoadSafetyParentType(subLayerId);
      
      // Check if any other road safety parent type is selected
      for (const selectedSublayer of selectedSubLayers) {
        const selectedParentType = getRoadSafetyParentType(selectedSublayer);
        if (selectedParentType && newParentType && selectedParentType !== newParentType) {
          return false; // Different road safety type is already selected
        }
      }
    }

    return true;
  };

  const toggleInfraType = (id: string) => {
    if (selectedInfraTypes.includes(id)) {
      // Deselecting - always allowed
      setSelectedInfraTypes(selectedInfraTypes.filter(t => t !== id));
      const infraType = infrastructureTypes.find(t => t.id === id);
      if (infraType) {
        const subLayerIds = infraType.subLayers.map(sl => sl.id);
        setSelectedSubLayers(selectedSubLayers.filter(sl => !subLayerIds.includes(sl)));
      }
      setExpandedTypes(expandedTypes.filter(t => t !== id));
    } else {
      // Selecting - check if allowed
      if (!canSelectInfraType(id)) {
        console.log('[QueryPanel] ❌ Cannot select', id, '- different category already selected');
        return; // Don't allow selection
      }
      setSelectedInfraTypes([...selectedInfraTypes, id]);
      if (!expandedTypes.includes(id)) {
        setExpandedTypes([...expandedTypes, id]);
      }
    }
  };

  const toggleExpanded = (id: string) => {
    if (expandedTypes.includes(id)) {
      setExpandedTypes(expandedTypes.filter(t => t !== id));
    } else {
      setExpandedTypes([...expandedTypes, id]);
    }
  };

  const toggleSubLayer = (subLayerId: string) => {
    // Check if selection is allowed
    if (!selectedSubLayers.includes(subLayerId) && !canSelectSubLayer(subLayerId)) {
      console.log('[QueryPanel] ❌ Cannot select sublayer', subLayerId, '- different category or road safety type already selected');
      return; // Don't allow selection
    }

    // Find which infrastructure type this sublayer belongs to
    const parentInfraType = infrastructureTypes.find(type => 
      type.subLayers.some(sl => {
        if (sl.id === subLayerId) return true;
        if (sl.subLayers) {
          return sl.subLayers.some((nested: any) => nested.id === subLayerId);
        }
        return false;
      })
    );
    
    if (selectedSubLayers.includes(subLayerId)) {
      // Deselecting a sublayer
      const newSelectedSubLayers = selectedSubLayers.filter(sl => sl !== subLayerId);
      setSelectedSubLayers(newSelectedSubLayers);
      
      // If no more sublayers are selected for this infrastructure type, deselect the parent
      if (parentInfraType) {
        const hasOtherSelectedSubLayers = parentInfraType.subLayers.some(sl => {
          if (sl.id !== subLayerId && newSelectedSubLayers.includes(sl.id)) return true;
          if (sl.subLayers) {
            return sl.subLayers.some((nested: any) => 
              nested.id !== subLayerId && newSelectedSubLayers.includes(nested.id)
            );
          }
          return false;
        });
        if (!hasOtherSelectedSubLayers && selectedInfraTypes.includes(parentInfraType.id)) {
          setSelectedInfraTypes(selectedInfraTypes.filter(t => t !== parentInfraType.id));
        }
      }
    } else {
      // Selecting a sublayer
      setSelectedSubLayers([...selectedSubLayers, subLayerId]);
      
      // Auto-select the parent infrastructure type if not already selected
      if (parentInfraType && !selectedInfraTypes.includes(parentInfraType.id)) {
        setSelectedInfraTypes([...selectedInfraTypes, parentInfraType.id]);
      }
    }
  };

  const toggleAllSubLayers = (infraTypeId: string) => {
    const infraType = infrastructureTypes.find(t => t.id === infraTypeId);
    if (!infraType) return;

    // Collect all sublayer IDs including nested ones (for road safety star ratings)
    const allSubLayerIds: string[] = [];
    infraType.subLayers.forEach(sl => {
      allSubLayerIds.push(sl.id);
      // If this sublayer has nested sublayers (star ratings), add them too
      if (sl.subLayers && sl.subLayers.length > 0) {
        sl.subLayers.forEach((nested: any) => {
          allSubLayerIds.push(nested.id);
        });
      }
    });

    const allSelected = allSubLayerIds.every(id => selectedSubLayers.includes(id));

    if (allSelected) {
      // Deselect all sublayers of this type (including nested ones)
      setSelectedSubLayers(selectedSubLayers.filter(sl => !allSubLayerIds.includes(sl)));
      // Also deselect the parent infrastructure type
      if (selectedInfraTypes.includes(infraTypeId)) {
        setSelectedInfraTypes(selectedInfraTypes.filter(t => t !== infraTypeId));
      }
    } else {
      // Check if selection is allowed
      if (!canSelectInfraType(infraTypeId)) {
        console.log('[QueryPanel] ❌ Cannot select all sublayers for', infraTypeId, '- different category already selected');
        return;
      }

      // For road safety, check if we can select all (this would select multiple types)
      if (infraTypeId === 'road_safety' && selectedSubLayers.length > 0) {
        // Check if any road safety sublayer is already selected
        const hasRoadSafetySelection = selectedSubLayers.some(sl => getRoadSafetyParentType(sl) !== null);
        if (hasRoadSafetySelection) {
          console.log('[QueryPanel] ❌ Cannot select all road safety types - one type is already selected');
          return; // Don't allow selecting all if one type is already selected
        }
      }

      // Select all sublayers of this type (including nested ones)
      const newSelectedSubLayers = [...selectedSubLayers];
      allSubLayerIds.forEach(id => {
        if (!newSelectedSubLayers.includes(id)) {
          newSelectedSubLayers.push(id);
        }
      });
      setSelectedSubLayers(newSelectedSubLayers);
      // Also auto-select the parent infrastructure type
      if (!selectedInfraTypes.includes(infraTypeId)) {
        setSelectedInfraTypes([...selectedInfraTypes, infraTypeId]);
      }
    }
  };

  const toggleSafetyRating = (rating: string) => {
    if (safetyRatings.includes(rating)) {
      setSafetyRatings(safetyRatings.filter(r => r !== rating));
    } else {
      setSafetyRatings([...safetyRatings, rating]);
    }
  };

  const toggleHazardLevel = (hazardType: 'heat' | 'air' | 'flood' | 'multiHazard', value: string) => {
    const stateMap = {
      heat: { get: heatRisk, set: setHeatRisk },
      air: { get: airRisk, set: setAirRisk },
      flood: { get: floodRisk, set: setFloodRisk },
      multiHazard: { get: multiHazardRisk, set: setMultiHazardRisk }
    };
    
    const { get, set } = stateMap[hazardType];
    
    // Check if road network or road safety is selected
    const hasRoadNetworkOrSafety = selectedInfraTypes.includes('road_network') || selectedInfraTypes.includes('road_safety');
    const hasOtherInfra = selectedInfraTypes.some(id => !['road_network', 'road_safety'].includes(id));
    
    // For road network/safety ONLY queries (no other infra), enforce single hazard TYPE selection
    // But allow multiple categories within that hazard type
    if (hasRoadNetworkOrSafety && !hasOtherInfra) {
      // Check if another hazard type has selections
      const otherHazardsHaveSelections = 
        (hazardType !== 'heat' && heatRisk.length > 0) ||
        (hazardType !== 'air' && airRisk.length > 0) ||
        (hazardType !== 'flood' && floodRisk.length > 0) ||
        (hazardType !== 'multiHazard' && multiHazardRisk.length > 0);
      
      // If another hazard type has selections, clear them first
      if (otherHazardsHaveSelections) {
        setHeatRisk([]);
        setAirRisk([]);
        setFloodRisk([]);
        setMultiHazardRisk([]);
        // Then set this value in the current hazard type
        set([value]);
        return;
      }
      
      // Within the same hazard type, allow normal multi-selection toggle
      if (get.includes(value)) {
        const newSelection = get.filter((v: string) => v !== value);
        set(newSelection);
      } else {
        set([...get, value]);
      }
      return;
    }
    
    // Normal multi-selection behavior for non-road queries
    if (get.includes(value)) {
      const newSelection = get.filter((v: string) => v !== value);
      set(newSelection);
    } else {
      set([...get, value]);
    }
  };

  const toggleWard = (wardId: string) => {
    // If clicking on "all", clear all and set only "all"
    if (wardId === 'all') {
      setSelectedWards(['all']);
    }
    // If clicking on another ward while "all" is selected, remove "all" and add the new ward
    else if (selectedWards.includes('all')) {
      setSelectedWards([wardId]);
    }
    // Normal toggle behavior for non-"all" wards
    else {
      if (selectedWards.includes(wardId)) {
        const newSelection = selectedWards.filter(w => w !== wardId);
        // If no wards left after removal, default back to "all"
        setSelectedWards(newSelection.length === 0 ? ['all'] : newSelection);
      } else {
        setSelectedWards([...selectedWards, wardId]);
      }
    }
  };

  const executeQuery = async () => {
    if (selectedInfraTypes.length === 0) return;
    
    console.log('[QueryPanel] Executing query with filters:', {
      selectedInfraTypes,
      selectedSubLayers,
      heatRisk,
      airRisk,
      floodRisk,
      multiHazardRisk,
      selectedWards
    });

    try {
      setIsExecuting(true);
      setQueryError(null);
      
      // Clear previous road results and visibility state when starting new query
      setFullRoadResults(null);
      setRoadResultVisibility({});
      setActiveUserType('');
      
      // Notify parent that query was executed (to close legend panel)
      if (onQueryExecuted) {
        onQueryExecuted();
      }
      
      // Apply infrastructure category filters based on selected sublayers
      // This will enable/disable layers and filter categories
      if (onApplyFilters) {
        // Categorize sublayers by infrastructure type
        const educationSubLayers = selectedSubLayers.filter(id => 
          ['university', 'college', 'school', 'anganwadi'].includes(id)
        );
        const healthcareSubLayers = selectedSubLayers.filter(id => 
          ['hospital', 'health_centre', 'nursing_home'].includes(id)
        );
        const publicAmenitiesSubLayers = selectedSubLayers.filter(id => 
          ['community_centre', 'culture_centre', 'fire_station', 'government_buildings', 
           'park', 'petrol_pump', 'playground_stadium', 'police_outpost', 'religious', 
           'telephone_exchange', 'haat_market', 'vending_zones'].includes(id)
        );
        const transportSubLayers = selectedSubLayers.filter(id => 
          ['airport', 'bus_terminal', 'bus_stop', 'ev_charging', 'railway_station'].includes(id)
        );
        
        console.log('🔍 [QueryPanel] Categorized sublayers:', {
          educationSubLayers,
          healthcareSubLayers,
          publicAmenitiesSubLayers,
          transportSubLayers,
          originalSelectedSubLayers: selectedSubLayers
        });
        
        onApplyFilters({
          educationSubLayers,
          healthcareSubLayers,
          publicAmenitiesSubLayers,
          transportSubLayers
        });
      }
      
      // Check if this query includes road network or road safety
      const hasRoadNetworkOrSafety = selectedInfraTypes.includes('road_network') || selectedInfraTypes.includes('road_safety');
      const hasOtherInfra = selectedInfraTypes.some(id => !['road_network', 'road_safety'].includes(id));
      
      // Store the legend key at query execution time (locked for this query)
      if (activeHazardKey) {
        setQueryExecutionLegendKey(activeHazardKey);
        console.log(`🔒 [QueryPanel] Locked legend key for query: ${activeHazardKey}`);
      }
      
      let apiResults: any;
      let roadResults: any = null;
      
      // If only road network/safety is selected, use the new overlay API
      if (hasRoadNetworkOrSafety && !hasOtherInfra) {
        roadResults = await fetchRoadOverlayQuery({
          selectedInfraTypes,
          selectedSubLayers,
          heatRisk,
          airRisk,
          floodRisk,
          multiHazardRisk,
          safetyRatings,
          safetyRatingType,
          selectedWards
        }, scenario);
        
        // Display road results in a special format
        if (roadResults && roadResults.total_count > 0) {
          console.log('[QueryPanel] Road overlay results:', roadResults);
          setShowResults(true);
          setQueryError(null); // Clear any previous errors since query succeeded
          
          // Determine the safety assessment type from selectedSubLayers
          let safetyAssessmentType = null;
          const isRoadSafety = selectedInfraTypes.includes('road_safety');
          if (isRoadSafety && selectedSubLayers && selectedSubLayers.length > 0) {
            // Check which user type was selected
            if (selectedSubLayers.some(id => id.startsWith('vehicle_'))) {
              safetyAssessmentType = 'Vehicle Occupant Safety';
            } else if (selectedSubLayers.some(id => id.startsWith('motorcycle_'))) {
              safetyAssessmentType = 'Motorcyclist Safety';
            } else if (selectedSubLayers.some(id => id.startsWith('bicycle_'))) {
              safetyAssessmentType = 'Bicyclist Safety';
            } else if (selectedSubLayers.some(id => id.startsWith('pedestrian_'))) {
              safetyAssessmentType = 'Pedestrian Safety';
            }
          }
          
          // Store road results in a special format
          setResults([{
            id: 'road_summary',
            name: isRoadSafety ? 'Road Safety Summary' : 'Road Network Summary',
            type: 'ROAD_DATA',
            ward: 'Multiple Wards',
            roadData: roadResults.categories,
            safetyType: safetyAssessmentType,
            lat: 0,
            lng: 0
          }] as any);
          
          // Store full road results for filtering
          console.log('💾 [QueryPanel] Storing full road results:', {
            total_count: roadResults.total_count,
            features_count: roadResults.features?.length || 0,
            categories_count: roadResults.categories?.length || 0,
            sample_feature_properties: roadResults.features?.[0]?.properties,
            sample_feature_segments: roadResults.features?.[0]?.properties?.segments,
            first_segment: roadResults.features?.[0]?.properties?.segments?.[0]
          });
          setFullRoadResults(roadResults);
          
          // Store active user type for road safety queries
          if (roadResults.activeUserType) {
            setActiveUserType(roadResults.activeUserType);
            console.log('[QueryPanel] Stored active user type:', roadResults.activeUserType);
          }
          
          // Initialize visibility state - all results visible by default
          const initialVisibility: Record<string, boolean> = {};
          
          // FIRST: Add from aggregated categories (these have summary stats)
          if (roadResults.categories && Array.isArray(roadResults.categories)) {
            roadResults.categories.forEach((cat: any) => {
              if (cat && cat.details && typeof cat.details === 'object') {
                Object.keys(cat.details).forEach((gridcode: string) => {
                  const visibilityKey = `${cat.category}:${gridcode}`;
                  initialVisibility[visibilityKey] = true; // All visible by default
                });
              }
            });
          }
          
          // SECOND: Scan actual features to find ALL category:gridcode combinations
          // This ensures we create toggles for segments that weren't in the aggregated summary
          if (roadResults.features && Array.isArray(roadResults.features)) {
            roadResults.features.forEach((feature: any) => {
              const category = feature.properties?.category;
              const segments = feature.properties?.segments || [];
              
              segments.forEach((segment: any) => {
                // Extract gridcode from segment
                const gridcode = segment.gridcode || 
                               segment.properties?.gridcode || 
                               segment.properties?.HHI_2025 || 
                               segment.properties?.Air_AQI || 
                               segment.properties?.Flood_Hazard;
                
                if (category && gridcode) {
                  const visibilityKey = `${category}:${gridcode}`;
                  // Only add if not already present
                  if (!initialVisibility.hasOwnProperty(visibilityKey)) {
                    initialVisibility[visibilityKey] = true;
                    console.log(`✅ [QueryPanel] Added missing toggle for: ${visibilityKey}`);
                  }
                }
              });
            });
          }
          
          setRoadResultVisibility(initialVisibility);
          console.log('[QueryPanel] Initialized visibility state with', Object.keys(initialVisibility).length, 'toggles:', initialVisibility);
          
          // Initialize all categories as expanded by default
          const initialExpanded: Record<string, boolean> = {};
          if (roadResults.categories && Array.isArray(roadResults.categories)) {
            roadResults.categories.forEach((cat: any) => {
              initialExpanded[cat.category] = true; // All expanded by default
            });
          }
          setExpandedCategories(initialExpanded);
          console.log('[QueryPanel] Initialized collapsed state - all categories expanded');
          
          // Pass all road features to map initially (all visible), with locked legend key
          if (onQueryResults && roadResults.features) {
            onQueryResults(roadResults.features, queryExecutionLegendKey || undefined);
          }
          
          // Zoom map to fit selected ward(s) for network level queries
          if (onZoomToWards && selectedWards && selectedWards.length > 0 && !selectedWards.includes('all')) {
            console.log('🎯 [QueryPanel] Zooming to selected wards:', selectedWards);
            onZoomToWards(selectedWards);
          }
          
          // Activate the corresponding hazard layer based on selected risk type
          if (onActivateHazardLayer) {
            if (heatRisk.length > 0) {
              onActivateHazardLayer('heat');
            } else if (airRisk.length > 0) {
              onActivateHazardLayer('air');
            } else if (floodRisk.length > 0) {
              onActivateHazardLayer('flood');
            } else if (multiHazardRisk.length > 0) {
              onActivateHazardLayer('multiHazard');
            }
          }
        } else {
          setResults([]);
          setShowResults(true);
          setQueryError(null); // Clear any previous errors
          if (onQueryResults) {
            onQueryResults([], undefined); // Empty results, no legend key needed
          }
        }
        
        // Early return for road-only queries - successfully completed
        setIsExecuting(false);
        return;
      }
      
      // For POI queries (or mixed queries)
      apiResults = await fetchPOIQuery('bbsr', {
        selectedInfraTypes,
        selectedSubLayers,
        heatRisk,
        airRisk,
        floodRisk,
        multiHazardRisk,
        safetyRatings,
        safetyRatingType,
        selectedWards
      });
      
      if (apiResults && apiResults.results.length > 0) {
        console.log('[QueryPanel] Transforming API results:', apiResults.total_count);
        console.log('[QueryPanel] Sample POI hazards:', apiResults.results[0]?.hazards);
        console.log('[QueryPanel] Sample POI full:', apiResults.results[0]);
        
        // Enable infrastructure layers so points are visible on map
        if (onEnableInfraLayers) {
          console.log('🗺️ [QueryPanel] Auto-enabling infrastructure layers for POI query');
          onEnableInfraLayers();
        }
        
        const transformedResults: QueryResult[] = apiResults.results.map((poi, index) => {
          const hhi = poi.hazards?.HHI_2025 ?? poi.hazards?.hhi_2025 ?? null;
          const air = poi.hazards?.Air_AQI ?? poi.hazards?.air_aqi ?? null;
          const flood = poi.hazards?.Flood_Hazard ?? poi.hazards?.flood_hazard ?? null;
          const multi = poi.hazards?.Multi_Hazard_BBSR ?? poi.hazards?.multi_hazard_bbsr ?? null;
          
          if (index === 0) {
            console.log('[QueryPanel] First POI hazard values:', { hhi, air, flood, multi });
          }
          
          return {
            id: String(poi.id),
            name: poi.name,
            type: poi.category + (poi.subcategory ? ` - ${poi.subcategory}` : ''),
            ward: `Ward ${poi.ward}`,
            hhi2025: hhi,
            airAqi: air,
            floodHazard: flood,
            multiHazard: multi,
            lat: poi.coordinates.lat,
            lng: poi.coordinates.lon,
          };
        });

        setResults(transformedResults);
        setShowResults(true);
        if (onQueryResults) {
          // Pass the full POI data with coordinates and category info for map display
          const mapFeatures = apiResults.results.map((poi) => ({
            ...poi,
            // Add display text for the result panel
            displayText: {
              type: poi.category + (poi.subcategory ? ` - ${poi.subcategory}` : ''),
              ward: `Ward ${poi.ward}`,
              coordinates: `${poi.coordinates.lat.toFixed(4)}°N, ${poi.coordinates.lon.toFixed(4)}°E`
            }
          }));
          onQueryResults(mapFeatures, undefined); // POI results don't use legend key
        }
      } else if (apiResults && apiResults.results.length === 0) {
        // No results found
        setResults([]);
        setShowResults(true);
        if (onQueryResults) {
          onQueryResults([], undefined); // Empty results, no legend key needed
        }
      }
    } catch (error) {
      console.error('[QueryPanel] Query execution failed:', error);
      setQueryError(error as Error);
      setShowResults(false);
    } finally {
      setIsExecuting(false);
    }
  };

  // Generate query description for PDF header
  const generateQueryDescription = (): string[] => {
    const description: string[] = [];
    
    // Helper to format star rating categories
    const formatStarRatingCategory = (sublayer: string): string => {
      // Check if it's a star rating format (e.g., "bicycle_4star", "vehicle_3star")
      const starMatch = sublayer.match(/^(.+?)_(\d)star$/i);
      if (starMatch) {
        const userType = starMatch[1];
        const starRating = starMatch[2];
        
        // Map user types to readable format
        const userTypeMap: Record<string, string> = {
          'vehicle': 'Vehicle Occupant',
          'motorcyclist': 'Motorcyclist',
          'pedestrian': 'Pedestrian',
          'bicyclist': 'Bicyclist',
          'bicycle': 'Bicyclist'
        };
        
        const formattedUserType = userTypeMap[userType.toLowerCase()] || userType.charAt(0).toUpperCase() + userType.slice(1);
        return `${formattedUserType} ${starRating} Star`;
      }
      
      return sublayer;
    };
    
    // Infrastructure types - separate into infrastructure, road network, and road safety
    if (selectedSubLayers.length > 0) {
      const infrastructureLayers: string[] = [];
      const roadNetworkLayers: string[] = [];
      const roadSafetyLayers: string[] = [];
      
      selectedSubLayers.forEach(sublayer => {
        // Check if it's a star rating (road safety)
        if (sublayer.match(/^(.+?)_(\d)star$/i)) {
          roadSafetyLayers.push(formatStarRatingCategory(sublayer));
        }
        // Check if it's a road network category
        else if (['national_highway', 'state_highway', 'major_road', 'link_road'].includes(sublayer)) {
          // Find the label for road network
          for (const infraType of INFRASTRUCTURE_TYPES) {
            if (infraType.id === 'road_network') {
              const sublayerObj = infraType.subLayers.find(sub => sub.id === sublayer);
              if (sublayerObj) {
                roadNetworkLayers.push(sublayerObj.label);
              }
            }
          }
        }
        // Regular infrastructure
        else {
          for (const infraType of INFRASTRUCTURE_TYPES) {
            if (infraType.id !== 'road_network' && infraType.id !== 'road_safety') {
              const sublayerObj = infraType.subLayers.find(sub => sub.id === sublayer);
              if (sublayerObj) {
                infrastructureLayers.push(sublayerObj.label);
                break;
              }
            }
          }
        }
      });
      
      // Add infrastructure line if there are any
      if (infrastructureLayers.length > 0) {
        description.push(`Infrastructure: ${infrastructureLayers.join(', ')}`);
      }
      
      // Determine if current results are road safety or road network
      const isRoadSafetyQuery = fullRoadResults?.features?.some((f: any) => f.properties?.starRatingCategory);
      
      // Add road network line only if there are road network selections AND results are road network
      if (roadNetworkLayers.length > 0 && !isRoadSafetyQuery) {
        description.push(`Road Network: ${roadNetworkLayers.join(', ')}`);
      }
      
      // Add road safety line only if there are road safety selections AND results are road safety
      if (roadSafetyLayers.length > 0 && isRoadSafetyQuery) {
        description.push(`Road Safety: ${roadSafetyLayers.join(', ')}`);
      }
    }
    
    // Heat Risk
    if (heatRisk.length > 0) {
      description.push(`Heat Stress: ${heatRisk.join(', ')}`);
    }
    
    // Air Quality
    if (airRisk.length > 0) {
      description.push(`Air Quality: ${airRisk.join(', ')}`);
    }
    
    // Flood Risk
    if (floodRisk.length > 0) {
      description.push(`Flood Risk: ${floodRisk.join(', ')}`);
    }
    
    // Multi-Hazard
    if (multiHazardRisk.length > 0) {
      description.push(`Multi-Hazard: ${multiHazardRisk.join(', ')}`);
    }
    
    // Ward filter
    if (selectedWards.length > 0 && !selectedWards.includes('all')) {
      const wardNames = selectedWards.map(wardId => {
        const ward = wards.find(w => w.id === wardId);
        return ward ? `Ward ${ward.wardNumber}` : wardId;
      }).join(', ');
      description.push(`Wards: ${wardNames}`);
    }
    
    // Safety ratings
    if (safetyRatings.length > 0) {
      description.push(`Road Safety (${safetyRatingType}): ${safetyRatings.join(', ')}`);
    }
    
    return description;
  };

  // Download PDF Report
  const downloadPDFReport = () => {
    if (results.length === 0 && !fullRoadResults) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add subtle top border with Innpact blue
    doc.setFillColor(37, 99, 235); // Innpact Blue
    doc.rect(0, 0, pageWidth, 3, 'F');
    
    // Title
    doc.setTextColor(15, 23, 42); // Dark slate
    doc.setFontSize(16);
    doc.text('Multi-Hazard Climate Screening & Mobility Exposure Dashboard', 14, 14);
    
    // City name
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139); // Slate gray
    doc.text('Bhubaneswar Municipal Corporation', 14, 20);
    
    // Subtitle - Query Results
    doc.setTextColor(37, 99, 235); // Innpact blue
    doc.setFontSize(13);
    doc.text('Query Results Report', 14, 26);
    
    // Divider line
    doc.setDrawColor(226, 232, 240); // Light gray
    doc.setLineWidth(0.5);
    doc.line(14, 32, pageWidth - 14, 32);
    
    // Query filters applied
    const queryDesc = generateQueryDescription();
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85); // Darker text
    doc.text('Query Filters Applied:', 14, 40);
    
    let yPosition = 47;
    if (queryDesc.length > 0) {
      queryDesc.forEach((line) => {
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`• ${line}`, 14, yPosition);
        yPosition += 5;
      });
    } else {
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text('No filters applied (showing all results)', 14, yPosition);
      yPosition += 5;
    }
    
    yPosition += 3;
    
    // Helper function to format user type for display
    const formatUserType = (userType: string) => {
      const userTypeMap: Record<string, string> = {
        'vehicle_occupant': 'Vehicle Occupant',
        'vehicle': 'Vehicle Occupant',
        'motorcyclist': 'Motorcyclist',
        'pedestrian': 'Pedestrian',
        'bicyclist': 'Bicyclist'
      };
      
      return userTypeMap[userType.toLowerCase()] || userType.charAt(0).toUpperCase() + userType.slice(1);
    };
    
    // Check if we have road results or infrastructure point results
    if (fullRoadResults && fullRoadResults.features && fullRoadResults.features.length > 0) {
      // Road Network/Road Safety Results
      const activeLegendKey = queryExecutionLegendKey || '';
      const activeLegendData = activeLegendKey ? LEGEND_DATA[activeLegendKey] : null;
      
      // Check if this is a road safety query
      const isRoadSafety = fullRoadResults.features.some((f: any) => f.properties?.starRatingCategory);
      const formattedUserType = isRoadSafety && activeUserType ? formatUserType(activeUserType) : 'N/A';
      
      // Group by category
      const categoryMap: Record<string, any> = {};
      fullRoadResults.features.forEach((feature: any) => {
        // For road safety, use starRatingCategory (e.g., "5-Star"); for road network, use category
        const category = feature.properties?.starRatingCategory || feature.properties?.category || 'Unknown';
        if (!categoryMap[category]) {
          categoryMap[category] = {
            features: [],
            lengthByGridcode: {},
            isStarRating: !!feature.properties?.starRatingCategory
          };
        }
        categoryMap[category].features.push(feature);
      });
      
      // Calculate total rows
      let totalRows = 0;
      Object.values(categoryMap).forEach((data: any) => {
        data.features.forEach((feature: any) => {
          const segments = feature.properties?.segments || [];
          segments.forEach((seg: any) => {
            const gridcode = seg.gridcode || seg.properties?.gridcode || seg.properties?.[activeLegendKey];
            if (gridcode !== undefined) {
              if (!data.lengthByGridcode[gridcode]) {
                data.lengthByGridcode[gridcode] = 0;
                totalRows++;
              }
              data.lengthByGridcode[gridcode] += seg.length_meters || 0;
            }
          });
        });
      });
      
      doc.setFontSize(9);
      doc.setTextColor(37, 99, 235); // Blue color
      doc.text(`Total Categories: ${Object.keys(categoryMap).length} | Total Hazard Levels: ${totalRows}`, 14, yPosition);
      
      // Prepare table data
      const tableData: any[] = [];
      Object.entries(categoryMap).forEach(([category, data]: [string, any]) => {
        const categoryTotal = Object.values(data.lengthByGridcode).reduce((sum: number, length: any) => sum + length, 0);
        
        // Determine if this is a star rating category and extract star rating
        const starRating = data.isStarRating ? category : null; // e.g., "5-Star"
        
        Object.entries(data.lengthByGridcode).forEach(([gridcode, length]: [string, any]) => {
          const lengthKm = (length / 1000).toFixed(2);
          const percentage = categoryTotal > 0 ? ((length / categoryTotal) * 100).toFixed(1) : '0';
          
          const legendEntry = activeLegendData?.find(entry => entry.gridcode === Number(gridcode));
          const hazardLabel = legendEntry ? `${legendEntry.label} (${legendEntry.description})` : `Level ${gridcode}`;
          
          // Get ward info
          const wards = new Set<string>();
          data.features.forEach((feature: any) => {
            const ward = feature.properties?.ward || feature.properties?.Ward;
            if (ward) wards.add(ward);
          });
          const wardList = wards.size > 0 ? Array.from(wards).slice(0, 3).join(', ') : 'Multiple';
          
          // Build row based on whether it's road safety or road network
          const row = isRoadSafety 
            ? [
                category,
                'Road Safety',
                starRating || 'N/A',
                formattedUserType,
                wardList,
                hazardLabel,
                lengthKm,
                `${percentage}%`
              ]
            : [
                category,
                'Road Network',
                wardList,
                hazardLabel,
                lengthKm,
                `${percentage}%`
              ];
          
          tableData.push(row);
        });
      });
      
      // Generate table with conditional columns
      const tableHeaders = isRoadSafety
        ? [['Road Category', 'Type', 'Star Rating', 'Safety Type', 'Ward(s)', 'Hazard Level', 'Length', '%']]
        : [['Road Category', 'Type', 'Ward(s)', 'Hazard Level', 'Length', '%']];
      
      const columnStyles = isRoadSafety
        ? {
            0: { cellWidth: 28 }, // Category
            1: { cellWidth: 20 }, // Type
            2: { cellWidth: 15 }, // Star Rating
            3: { cellWidth: 23 }, // Safety Type
            4: { cellWidth: 24 }, // Ward
            5: { cellWidth: 32 }, // Hazard
            6: { cellWidth: 14 }, // Length
            7: { cellWidth: 14 }  // %
          }
        : {
            0: { cellWidth: 35 }, // Category
            1: { cellWidth: 25 }, // Type
            2: { cellWidth: 30 }, // Ward
            3: { cellWidth: 45 }, // Hazard
            4: { cellWidth: 20 }, // Length
            5: { cellWidth: 15 }  // %
          };
      
      autoTable(doc, {
        startY: yPosition + 8,
        head: tableHeaders,
        body: tableData,
        styles: {
          fontSize: 6.5,
          cellPadding: 1.5,
        },
        headStyles: {
          fillColor: [37, 99, 235], // Innpact blue
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: columnStyles,
        margin: { left: 14, right: 14 }
      });
      
    } else {
      // Infrastructure Point Results (existing code)
      doc.setFontSize(9);
      doc.setTextColor(37, 99, 235); // Blue color
      doc.text(`Total Results: ${results.length}`, 14, yPosition);
      
      const tableData = results.map(result => {
        const heatInfo = getHazardInfoFromLegend(result.hhi2025, 'HHI_2025');
        const airInfo = getHazardInfoFromLegend(result.airAqi, 'Air_AQI');
        const floodInfo = getHazardInfoFromLegend(result.floodHazard, 'Flood_Hazard');
        const multiHazardInfo = getHazardInfoFromLegend(result.multiHazard, 'Multi_Hazard_BBSR');
        
        return [
          result.name,
          result.type,
          result.ward,
          `${heatInfo.label}${heatInfo.description ? ' (' + heatInfo.description + ')' : ''}`,
          `${airInfo.label}${airInfo.description ? ' (' + airInfo.description + ')' : ''}`,
          `${floodInfo.label}${floodInfo.description ? ' (' + floodInfo.description + ')' : ''}`,
          `${multiHazardInfo.label}${multiHazardInfo.description ? ' (' + multiHazardInfo.description + ')' : ''}`
        ];
      });
      
      // Generate table
      autoTable(doc, {
        startY: yPosition + 8,
        head: [['Name', 'Type', 'Ward', 'Heat Stress', 'Air Quality', 'Flood Risk', 'Multi-Hazard']],
        body: tableData,
        styles: {
          fontSize: 7,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [37, 99, 235], // Innpact blue
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 30 }, // Name
          1: { cellWidth: 25 }, // Type
          2: { cellWidth: 20 }, // Ward
          3: { cellWidth: 25 }, // Heat
          4: { cellWidth: 25 }, // Air
          5: { cellWidth: 25 }, // Flood
          6: { cellWidth: 25 }  // Multi-Hazard
        },
        margin: { left: 14, right: 14 }
      });
    }
    
    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Download
    doc.save(`Query_Results_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const clearQuery = () => {
    setSelectedInfraTypes([]);
    setSelectedSubLayers([]);
    setExpandedTypes([]);
    setHeatRisk([]);
    setAirRisk([]);
    setFloodRisk([]);
    setMultiHazardRisk([]);
    setSafetyRatings([]);
    setSafetyRatingType('Vehicle Rating');
    setSelectedWards(['all']);
    setResults([]);
    setShowResults(false);
  };

  // Helper function to convert gridcode to readable format "Label (Description)"
  const getHazardLabel = (layerKey: string, gridcode: number | null | undefined): string => {
    if (gridcode === null || gridcode === undefined) {
      return 'N/A';
    }
    
    const legendData = LEGEND_DATA[layerKey];
    if (!legendData) {
      return 'Unknown';
    }
    
    const entry = legendData.find(item => item.gridcode === gridcode);
    if (!entry) {
      return `Unknown (${gridcode})`;
    }
    
    return `${entry.label} (${entry.description})`;
  };

  const exportCSV = () => {
    if (results.length === 0 && !fullRoadResults) return;
    
    // Helper function to format user type for display
    const formatUserType = (userType: string) => {
      const userTypeMap: Record<string, string> = {
        'vehicle_occupant': 'Vehicle Occupant',
        'vehicle': 'Vehicle Occupant',
        'motorcyclist': 'Motorcyclist',
        'pedestrian': 'Pedestrian',
        'bicyclist': 'Bicyclist'
      };
      
      return userTypeMap[userType.toLowerCase()] || userType.charAt(0).toUpperCase() + userType.slice(1);
    };
    
    // Check if we have road results or infrastructure point results
    if (fullRoadResults && fullRoadResults.features && fullRoadResults.features.length > 0) {
      // Export Road Network/Road Safety Results
      const activeLegendKey = queryExecutionLegendKey || '';
      const activeLegendData = activeLegendKey ? LEGEND_DATA[activeLegendKey] : null;
      
      // Check if this is a road safety query by looking at first feature
      const isRoadSafety = fullRoadResults.features.some((f: any) => f.properties?.starRatingCategory);
      const formattedUserType = isRoadSafety && activeUserType ? formatUserType(activeUserType) : 'N/A';
      
      console.log('[QueryPanel] 📊 CSV Export - isRoadSafety:', isRoadSafety);
      
      // Conditional headers based on query type
      const headers = isRoadSafety
        ? ['Road Name/Category', 'Type', 'Star Rating', 'Safety Assessment Type', 'Ward(s)', 'Hazard Level', 'Length (km)', 'Percentage']
        : ['Road Name/Category', 'Type', 'Ward(s)', 'Hazard Level', 'Length (km)', 'Percentage'];
      
      const rows: any[] = [];
      
      // Group by category
      const categoryMap: Record<string, any> = {};
      fullRoadResults.features.forEach((feature: any) => {
        // For road safety, use starRatingCategory (e.g., "5-Star"); for road network, use category
        const category = feature.properties?.starRatingCategory || feature.properties?.category || 'Unknown';
        if (!categoryMap[category]) {
          categoryMap[category] = {
            features: [],
            lengthByGridcode: {},
            isStarRating: !!feature.properties?.starRatingCategory
          };
        }
        categoryMap[category].features.push(feature);
      });
      
      // Process each category
      Object.entries(categoryMap).forEach(([category, data]: [string, any]) => {
        // Calculate lengths by gridcode
        data.features.forEach((feature: any) => {
          const segments = feature.properties?.segments || [];
          segments.forEach((seg: any) => {
            const gridcode = seg.gridcode || seg.properties?.gridcode || seg.properties?.[activeLegendKey];
            if (gridcode !== undefined) {
              if (!data.lengthByGridcode[gridcode]) {
                data.lengthByGridcode[gridcode] = 0;
              }
              data.lengthByGridcode[gridcode] += seg.length_meters || 0;
            }
          });
        });
        
        const categoryTotal = Object.values(data.lengthByGridcode).reduce((sum: number, length: any) => sum + length, 0);
        
        // Determine if this is a star rating category and extract star rating
        const starRating = data.isStarRating ? category : null; // e.g., "5-Star"
        
        // Add rows for each hazard level
        Object.entries(data.lengthByGridcode).forEach(([gridcode, length]: [string, any]) => {
          const lengthKm = (length / 1000).toFixed(2);
          const percentage = categoryTotal > 0 ? ((length / categoryTotal) * 100).toFixed(1) : '0';
          
          const legendEntry = activeLegendData?.find(entry => entry.gridcode === Number(gridcode));
          const hazardLabel = legendEntry ? `${legendEntry.label} (${legendEntry.description})` : `Level ${gridcode}`;
          
          // Get ward info
          const wards = new Set<string>();
          data.features.forEach((feature: any) => {
            const ward = feature.properties?.ward || feature.properties?.Ward;
            if (ward) wards.add(ward);
          });
          const wardList = wards.size > 0 ? Array.from(wards).join(', ') : 'Multiple';
          
          // Build row based on whether it's road safety or road network
          const row = isRoadSafety
            ? [
                category,
                'Road Safety Rating',
                starRating || 'N/A',
                formattedUserType,
                wardList,
                hazardLabel,
                lengthKm,
                `${percentage}%`
              ]
            : [
                category,
                'Road Network',
                wardList,
                hazardLabel,
                lengthKm,
                `${percentage}%`
              ];
          
          rows.push(row);
        });
      });
      
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `\"${cell}\"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `road-query-results-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
    } else {
      // Export Infrastructure Point Results (existing code)
      const headers = ['Name', 'Type', 'Ward', 'Heat Risk (HHI 2025)', 'Air Quality (AQI)', 'Flood Hazard', 'Multi-Hazard Risk', 'Coordinates'];
      const rows = results.map(item => [
        item.name,
        item.type,
        item.ward,
        getHazardLabel('HHI_2025', item.hhi2025),
        getHazardLabel('Air_AQI', item.airAqi),
        getHazardLabel('Flood_Hazard', item.floodHazard),
        getHazardLabel('Multi_Hazard_BBSR', item.multiHazard),
        `${item.lat.toFixed(6)}, ${item.lng.toFixed(6)}`
      ]);
      
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `\"${cell}\"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spatial-query-results-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const exportPDF = () => {
    alert('PDF Report generation would be implemented here');
  };

  // Handle Back button - return to query builder
  const handleBackToQuery = () => {
    console.log('🔙 [QueryPanel] Back to Query clicked - clearing results');
    setResults([]);
    setShowResults(false);
    setQueryExecutionLegendKey(null); // Clear locked legend key
    setFullRoadResults(null); // Clear road results
    setRoadResultVisibility({}); // Clear visibility state
    
    // Clear query results from map
    if (onQueryResults) {
      onQueryResults([], undefined); // Pass empty array to clear map features
    }
    
    if (onCloseResults) {
      onCloseResults();
    }
  };

  // Handle Close button - close entire query panel
  const handleClosePanel = () => {
    console.log('❌ [QueryPanel] Close Panel clicked - clearing results and closing');
    setResults([]);
    setShowResults(false);
    setQueryExecutionLegendKey(null); // Clear locked legend key
    setFullRoadResults(null); // Clear road results
    setRoadResultVisibility({}); // Clear visibility state
    
    // Clear query results from map
    if (onQueryResults) {
      onQueryResults([], undefined); // Pass empty array to clear map features
    }
    
    if (onCloseResults) {
      onCloseResults();
    }
    
    onClose();
  };

  // Get hazard level text and color from legend definitions (matching popup logic)
  const getHazardInfoFromLegend = (
    value: string | number | undefined | null, 
    layerName: string
  ) => {
    console.log(`[QueryPanel] getHazardInfoFromLegend called with value: ${value}, layer: ${layerName}`);
    
    // Handle null, undefined, empty string, and 'N/A' cases
    if (value === null || value === undefined || value === 'N/A' || value === '') {
      return { label: 'N/A', color: '#E5E7EB', description: '' };
    }
    
    const gridcode = typeof value === 'string' ? parseInt(value, 10) : Math.round(value);
    
    // Check if gridcode is valid after conversion
    if (isNaN(gridcode)) {
      console.log(`[QueryPanel] Invalid gridcode conversion from value: ${value}`);
      return { label: 'N/A', color: '#E5E7EB', description: '' };
    }
    
    console.log(`[QueryPanel] Converted to gridcode: ${gridcode}`);
    
    // Get the hazard info from legend definitions
    const hazardInfo = getHazardInfo(layerName, gridcode);
    console.log(`[QueryPanel] Legend lookup result:`, hazardInfo);
    
    if (hazardInfo) {
      return {
        label: hazardInfo.label,
        color: hazardInfo.color,
        description: hazardInfo.description
      };
    }
    
    // Fallback if not found in legend
    return { label: String(value), color: '#64748b', description: '' };
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'extreme': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'moderate': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  // Check if road network or road safety is selected (for single hazard enforcement)
  const hasRoadNetworkOrSafety = selectedInfraTypes.includes('road_network') || selectedInfraTypes.includes('road_safety');
  const hasOtherInfra = selectedInfraTypes.some(id => !['road_network', 'road_safety'].includes(id));
  const isRoadOnlyQuery = hasRoadNetworkOrSafety && !hasOtherInfra;
  
  // For road-only queries, check if any hazard is already selected
  const anyHazardSelected = heatRisk.length > 0 || airRisk.length > 0 || floodRisk.length > 0 || multiHazardRisk.length > 0;

  return (
    <div className="w-[330px] h-full bg-white flex flex-col">
      {/* Query Builder Section - Hidden when showing results */}
      <div className={`flex flex-col flex-1 min-h-0 ${showResults ? 'hidden' : 'flex'}`}>
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-[#E5E7EB] bg-gradient-to-r from-[#F8FAFC] to-white flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Search className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[11px] font-bold text-[#0F172A] truncate">Spatial Query Builder</h2>
              <p className="text-[9px] text-gray-500 mt-0.5">Filter infrastructure by hazard exposure</p>
            </div>
            <button
              onClick={() => {
                clearQuery();
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              title="Close Query Panel"
            >
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Warning notification for API errors */}
        {queryError && (
          <div className="mx-4 mt-4 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-yellow-800 font-medium">API Unavailable</p>
              <p className="text-[10px] text-yellow-700 mt-0.5">
                Unable to connect to the backend API. Please check your connection and try again.
              </p>
            </div>
          </div>
        )}

        {/* Content - Scrollable */}
        <div 
          className="flex-1 query-panel-scroll"
          style={{
            overflowY: 'scroll',
            scrollbarWidth: 'thin',
            scrollbarColor: '#94A3B8 #E2E8F0',
            scrollbarGutter: 'stable',
            minHeight: 0
          }}
        >
          <div className="p-3 space-y-3 overflow-visible">
            
            {/* Step 1: Select Infrastructure Type */}
            <div className="border border-gray-200 rounded-lg overflow-visible bg-white shadow-sm">
              <div className="px-3 py-2.5 bg-gradient-to-r from-blue-50 to-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-gray-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex-shrink-0 shadow-sm">1</span>
                    Select Infrastructure Type
                  </h3>
                  {/* Reset Button */}
                  {selectedInfraTypes.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedInfraTypes([]);
                        setSelectedSubLayers([]);
                        setExpandedTypes([]);
                      }}
                      className="p-1.5 rounded-md hover:bg-blue-100 transition-colors group"
                      title="Reset infrastructure selection"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-600 group-hover:text-blue-700" />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                {isLoadingInfraCounts ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
                    <span className="ml-2 text-[11px] text-gray-500">Loading</span>
                  </div>
                ) : (
                  infrastructureTypes.filter(type => {
                    // Hide road_network with 0 count, but always show road_safety
                    if (type.id === 'road_network' && type.count === 0) {
                      return false;
                    }
                    return true;
                  }).map((type) => {
                  const TypeIcon = type.icon;
                  const isExpanded = expandedTypes.includes(type.id);
                  const isSelected = selectedInfraTypes.includes(type.id);
                  const hasSelectedSubLayers = type.subLayers.some(sl => selectedSubLayers.includes(sl.id));
                  const isActive = isSelected || hasSelectedSubLayers;
                  const isDisabled = !canSelectInfraType(type.id);
                  
                  return (
                    <div key={type.id}>
                      {/* Main Infrastructure Type */}
                      <div 
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed'
                            : 'cursor-pointer group'
                        } ${
                          isActive 
                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 shadow-sm' 
                            : 'hover:bg-gray-50 border border-gray-200'
                        }`}
                        onClick={() => !isDisabled && toggleExpanded(type.id)}
                      >
                        <div 
                          className={`w-4 h-4 rounded flex items-center justify-center transition-all flex-shrink-0 ${
                            isDisabled 
                              ? 'cursor-not-allowed bg-gray-100' 
                              : 'cursor-pointer'
                          } ${
                            isSelected ? 'bg-blue-600 shadow-sm' : 'bg-gray-200 group-hover:bg-gray-300'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isDisabled) toggleInfraType(type.id);
                          }}
                        >
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                        <TypeIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                        <span className={`text-[11px] flex-1 font-medium transition-colors ${isActive ? 'text-blue-900' : 'text-gray-700 group-hover:text-gray-900'}`}>
                          {type.label}
                        </span>
                        {hasSelectedSubLayers && !isExpanded && (
                          <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                            {type.subLayers.filter(sl => selectedSubLayers.includes(sl.id)).length}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500 font-semibold flex-shrink-0">
                          {type.count} {type.id === 'road_network' || type.id === 'road_safety' ? 'types' : ''}
                        </span>
                        {!isDisabled && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(type.id);
                            }}
                            className="p-1 hover:bg-white/60 rounded flex-shrink-0"
                          >
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>

                      {/* Sublayers */}
                      {isExpanded && (
                        <div className="ml-4 mt-1.5 space-y-1 border-l-2 border-blue-200 pl-2.5">
                          {/* Select All Sublayers Option */}
                          {(() => {
                            const subLayerIds = type.subLayers.map(sl => sl.id);
                            const allSubLayersSelected = subLayerIds.length > 0 && subLayerIds.every(id => selectedSubLayers.includes(id));
                            return (
                              <button
                                onClick={() => toggleAllSubLayers(type.id)}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all border ${
                                  allSubLayersSelected
                                    ? 'bg-blue-600 text-white shadow-sm border-blue-700'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 border-dashed'
                                }`}
                              >
                                <Layers className={`w-3.5 h-3.5 flex-shrink-0 ${allSubLayersSelected ? 'text-white' : 'text-blue-600'}`} />
                                <span className="flex-1 text-left text-[10px] font-bold">Select All</span>
                                <span className={`text-[9px] font-semibold flex-shrink-0 ${allSubLayersSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                  {type.subLayers.length} types
                                </span>
                              </button>
                            );
                          })()}
                          
                          {type.subLayers.map((subLayer) => {
                            const SubIcon = subLayer.icon;
                            const isSubSelected = selectedSubLayers.includes(subLayer.id);
                            const hasNestedSubLayers = subLayer.subLayers && subLayer.subLayers.length > 0;
                            const isSubExpanded = expandedSubLayers.includes(subLayer.id);
                            // Check if any nested sublayers (star ratings) are selected
                            const hasSelectedNestedSubLayers = hasNestedSubLayers && subLayer.subLayers.some((nested: any) => selectedSubLayers.includes(nested.id));
                            const isSubActive = isSubSelected || hasSelectedNestedSubLayers;
                            const isSubDisabled = !canSelectSubLayer(subLayer.id);
                            
                            return (
                              <div key={subLayer.id}>
                                <button
                                  onClick={() => {
                                    if (isSubDisabled) return;
                                    if (hasNestedSubLayers) {
                                      // Toggle expand for nested sublayers
                                      if (isSubExpanded) {
                                        setExpandedSubLayers(expandedSubLayers.filter(id => id !== subLayer.id));
                                      } else {
                                        setExpandedSubLayers([...expandedSubLayers, subLayer.id]);
                                      }
                                    } else {
                                      // Regular toggle for non-nested sublayers
                                      toggleSubLayer(subLayer.id);
                                    }
                                  }}
                                  disabled={isSubDisabled}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all border ${
                                    isSubDisabled 
                                      ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200' 
                                      : ''
                                  } ${
                                    isSubActive
                                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 text-blue-900 shadow-sm'
                                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                                  }`}
                                >
                                  <SubIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isSubActive ? 'text-blue-600' : 'text-gray-600'}`} />
                                  <span className={`flex-1 text-left text-[10px] font-medium ${isSubActive ? 'text-blue-900' : ''}`}>{subLayer.label}</span>
                                  {hasSelectedNestedSubLayers && !isSubExpanded && (
                                    <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                                      {subLayer.subLayers.filter((nested: any) => selectedSubLayers.includes(nested.id)).length}
                                    </span>
                                  )}
                                  <span className={`text-[9px] font-semibold flex-shrink-0 ${isSubActive ? 'text-blue-700' : 'text-gray-500'}`}>
                                    {type.id === 'road_network' || type.id === 'road_safety' ? `${subLayer.count.toFixed(1)} km` : subLayer.count}
                                  </span>
                                  {hasNestedSubLayers && !isSubDisabled && (
                                    <ChevronDown className={`w-3.5 h-3.5 ${isSubActive ? 'text-blue-600' : 'text-gray-500'} transition-transform ${isSubExpanded ? 'rotate-180' : ''}`} />
                                  )}
                                </button>
                                
                                {/* Nested Sub-Sublayers (for road safety star ratings) */}
                                {hasNestedSubLayers && isSubExpanded && (
                                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-green-200 pl-2">
                                    {/* Select All for nested sublayers (star ratings) */}
                                    {(() => {
                                      const nestedIds = subLayer.subLayers.map((nested: any) => nested.id);
                                      const allNestedSelected = nestedIds.length > 0 && nestedIds.every((id: string) => selectedSubLayers.includes(id));
                                      // Check if any nested sublayer can be selected (at least one should be selectable)
                                      const canSelectAny = nestedIds.some((id: string) => canSelectSubLayer(id));
                                      return (
                                        <button
                                          onClick={() => {
                                            if (!canSelectAny && !allNestedSelected) return;
                                            if (allNestedSelected) {
                                              // Deselect all nested sublayers
                                              setSelectedSubLayers(selectedSubLayers.filter(sl => !nestedIds.includes(sl)));
                                            } else {
                                              // Select all nested sublayers (only the ones that can be selected)
                                              const newSelectedSubLayers = [...selectedSubLayers];
                                              nestedIds.forEach((id: string) => {
                                                if (canSelectSubLayer(id) && !newSelectedSubLayers.includes(id)) {
                                                  newSelectedSubLayers.push(id);
                                                }
                                              });
                                              setSelectedSubLayers(newSelectedSubLayers);
                                            }
                                          }}
                                          disabled={!canSelectAny && !allNestedSelected}
                                          className={`w-full flex items-center gap-1.5 px-2 py-1 rounded transition-all text-[10px] border ${
                                            !canSelectAny && !allNestedSelected
                                              ? 'opacity-40 cursor-not-allowed'
                                              : ''
                                          } ${
                                            allNestedSelected
                                              ? 'bg-green-600 text-white shadow-sm border-green-700'
                                              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 border-dashed'
                                          }`}
                                        >
                                          <Layers className={`w-2.5 h-2.5 flex-shrink-0 ${allNestedSelected ? 'text-white' : 'text-green-600'}`} />
                                          <span className="flex-1 text-left font-semibold">Select All</span>
                                          <span className={`font-medium flex-shrink-0 ${allNestedSelected ? 'text-green-100' : 'text-gray-500'}`}>
                                            ({subLayer.subLayers.length} ratings)
                                          </span>
                                        </button>
                                      );
                                    })()}
                                    
                                    {subLayer.subLayers.map((nestedSubLayer: any) => {
                                      const NestedIcon = nestedSubLayer.icon;
                                      const isNestedSelected = selectedSubLayers.includes(nestedSubLayer.id);
                                      const isNestedDisabled = !canSelectSubLayer(nestedSubLayer.id);
                                      return (
                                        <button
                                          key={nestedSubLayer.id}
                                          onClick={() => !isNestedDisabled && toggleSubLayer(nestedSubLayer.id)}
                                          disabled={isNestedDisabled}
                                          className={`w-full flex items-center gap-1.5 px-2 py-1 rounded transition-all text-[10px] ${
                                            isNestedDisabled 
                                              ? 'opacity-40 cursor-not-allowed bg-gray-50' 
                                              : ''
                                          } ${
                                            isNestedSelected
                                              ? 'bg-green-600 text-white shadow-sm'
                                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                          }`}
                                        >
                                          <NestedIcon className={`w-2.5 h-2.5 flex-shrink-0 ${isNestedSelected ? 'text-yellow-300' : 'text-gray-500'}`} />
                                          <span className="flex-1 text-left font-medium">{nestedSubLayer.label}</span>
                                          <span className={`font-medium flex-shrink-0 ${isNestedSelected ? 'text-green-100' : 'text-gray-500'}`}>
                                            ({nestedSubLayer.count.toFixed(1)} km)
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                  })
                )}
              </div>
            </div>

            {/* Step 2: Filter by Climate Hazard */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="px-3 py-2.5 bg-gradient-to-r from-orange-50 to-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-gray-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex-shrink-0 shadow-sm">2</span>
                    Filter by Climate Hazard
                  </h3>
                  {/* Reset Button */}
                  {(heatRisk.length > 0 || airRisk.length > 0 || floodRisk.length > 0 || multiHazardRisk.length > 0) && (
                    <button
                      onClick={() => {
                        setHeatRisk([]);
                        setAirRisk([]);
                        setFloodRisk([]);
                        setMultiHazardRisk([]);
                        setHeatExpanded(false);
                        setAirExpanded(false);
                        setFloodExpanded(false);
                        setMultiHazardExpanded(false);
                      }}
                      className="p-1.5 rounded-md hover:bg-orange-100 transition-colors group"
                      title="Reset climate hazard filters"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-orange-600 group-hover:text-orange-700" />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                {/* Heat Stress Accordion */}
                <div>
                  <div 
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all group border ${
                      heatRisk.length > 0 
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-sm cursor-pointer' 
                        : isRoadOnlyQuery && anyHazardSelected
                        ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                        : 'bg-transparent border-gray-200 hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => {
                      // Don't allow expanding if disabled (road-only query with another hazard selected)
                      if (isRoadOnlyQuery && anyHazardSelected && heatRisk.length === 0) return;
                      setHeatExpanded(!heatExpanded);
                      if (!heatExpanded) {
                        setAirExpanded(false);
                        setFloodExpanded(false);
                        setMultiHazardExpanded(false);
                      }
                    }}
                  >
                    <Flame className={`w-4 h-4 flex-shrink-0 ${heatRisk.length > 0 ? 'text-blue-600' : isRoadOnlyQuery && anyHazardSelected ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-[11px] flex-1 font-medium transition-colors ${heatRisk.length > 0 ? 'text-blue-900 font-bold' : isRoadOnlyQuery && anyHazardSelected ? 'text-gray-400' : 'text-gray-700 group-hover:text-gray-900'}`}>
                      Heat Stress
                    </span>
                    {heatRisk.length > 0 && (
                      <span className="text-[9px] font-bold flex-shrink-0 bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        {heatRisk.length}
                      </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${heatRisk.length > 0 ? 'text-blue-600' : isRoadOnlyQuery && anyHazardSelected ? 'text-gray-400' : 'text-gray-500'} ${heatExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {heatExpanded && (
                    <div className="mt-1.5 ml-2.5 border-l-2 border-blue-200 pl-2.5 max-h-40 overflow-y-auto space-y-1">
                      {isLoadingHazardPercentages ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                          <span className="ml-2 text-[10px] text-gray-500">Loading</span>
                        </div>
                      ) : (
                        getLegendOptions(HAZARD_LAYER_MAPPING.heat.legendKey).map((level) => {
                          const isSelected = heatRisk.includes(level.value);
                          const percentage = hazardPercentages['HHI_2025']?.[level.gridcode] ?? 0;
                          return (
                            <button
                              key={level.value}
                              onClick={() => toggleHazardLevel('heat', level.value)}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all border ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-900 border-blue-300 shadow-sm'
                                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                              }`}
                            >
                              {isSelected ? (
                                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M5 13l4 4L19 7"></path>
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0"></div>
                              )}
                              <span className="flex-1 text-[10px] font-medium">{level.label}</span>
                              <span className="text-[9px] text-gray-500 font-semibold ml-auto">{percentage.toFixed(1)}%</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Air Pollution Accordion */}
                <div>
                  <div 
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all group border ${
                      airRisk.length > 0 
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-sm cursor-pointer' 
                        : isRoadOnlyQuery && anyHazardSelected
                        ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                        : 'bg-transparent border-gray-200 hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => {
                      // Don't allow expanding if disabled (road-only query with another hazard selected)
                      if (isRoadOnlyQuery && anyHazardSelected && airRisk.length === 0) return;
                      setAirExpanded(!airExpanded);
                      if (!airExpanded) {
                        setHeatExpanded(false);
                        setFloodExpanded(false);
                        setMultiHazardExpanded(false);
                      }
                    }}
                  >
                    <Wind className={`w-4 h-4 flex-shrink-0 ${airRisk.length > 0 ? 'text-blue-600' : isRoadOnlyQuery && anyHazardSelected ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-[11px] flex-1 font-medium transition-colors ${airRisk.length > 0 ? 'text-blue-900 font-bold' : isRoadOnlyQuery && anyHazardSelected ? 'text-gray-400' : 'text-gray-700 group-hover:text-gray-900'}`}>
                      Air Pollution
                    </span>
                    {airRisk.length > 0 && (
                      <span className="text-[9px] font-bold flex-shrink-0 bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        {airRisk.length}
                      </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${airRisk.length > 0 ? 'text-blue-600' : isRoadOnlyQuery && anyHazardSelected ? 'text-gray-400' : 'text-gray-500'} ${airExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {airExpanded && (
                    <div className="mt-1.5 ml-2.5 border-l-2 border-blue-200 pl-2.5 max-h-40 overflow-y-auto space-y-1">
                      {isLoadingHazardPercentages ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                          <span className="ml-2 text-[10px] text-gray-500">Loading</span>
                        </div>
                      ) : (
                        getLegendOptions(HAZARD_LAYER_MAPPING.air.legendKey).map((level) => {
                          const isSelected = airRisk.includes(level.value);
                          const percentage = hazardPercentages['Air_AQI']?.[level.gridcode] ?? 0;
                          return (
                            <button
                              key={level.value}
                              onClick={() => toggleHazardLevel('air', level.value)}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all border ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-900 border-blue-300 shadow-sm'
                                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                              }`}
                            >
                              {isSelected ? (
                                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M5 13l4 4L19 7"></path>
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0"></div>
                              )}
                              <span className="flex-1 text-[10px] font-medium">{level.label}</span>
                              <span className="text-[9px] text-gray-500 font-semibold ml-auto">{percentage.toFixed(1)}%</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Flood Accordion */}
                <div>
                  <div 
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all group border ${
                      floodRisk.length > 0 
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-sm cursor-pointer' 
                        : isRoadOnlyQuery && anyHazardSelected
                        ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                        : 'bg-transparent border-gray-200 hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => {
                      // Don't allow expanding if disabled (road-only query with another hazard selected)
                      if (isRoadOnlyQuery && anyHazardSelected && floodRisk.length === 0) return;
                      setFloodExpanded(!floodExpanded);
                      if (!floodExpanded) {
                        setHeatExpanded(false);
                        setAirExpanded(false);
                        setMultiHazardExpanded(false);
                      }
                    }}
                  >
                    <Waves className={`w-4 h-4 flex-shrink-0 ${floodRisk.length > 0 ? 'text-blue-600' : isRoadOnlyQuery && anyHazardSelected ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-[11px] flex-1 font-medium transition-colors ${floodRisk.length > 0 ? 'text-blue-900 font-bold' : isRoadOnlyQuery && anyHazardSelected ? 'text-gray-400' : 'text-gray-700 group-hover:text-gray-900'}`}>
                      Flood
                    </span>
                    {floodRisk.length > 0 && (
                      <span className="text-[9px] font-bold flex-shrink-0 bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        {floodRisk.length}
                      </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${floodRisk.length > 0 ? 'text-blue-600' : isRoadOnlyQuery && anyHazardSelected ? 'text-gray-400' : 'text-gray-500'} ${floodExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {floodExpanded && (
                    <div className="mt-1.5 ml-2.5 border-l-2 border-blue-200 pl-2.5 max-h-40 overflow-y-auto space-y-1">
                      {isLoadingHazardPercentages ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                          <span className="ml-2 text-[10px] text-gray-500">Loading</span>
                        </div>
                      ) : (
                        getLegendOptions(HAZARD_LAYER_MAPPING.flood.legendKey).map((level) => {
                          const isSelected = floodRisk.includes(level.value);
                          const percentage = hazardPercentages['Flood_Hazard']?.[level.gridcode] ?? 0;
                          return (
                            <button
                              key={level.value}
                              onClick={() => toggleHazardLevel('flood', level.value)}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all border ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-900 border-blue-300 shadow-sm'
                                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                              }`}
                            >
                              {isSelected ? (
                                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M5 13l4 4L19 7"></path>
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0"></div>
                              )}
                              <span className="flex-1 text-[10px] font-medium">{level.label}</span>
                              <span className="text-[9px] text-gray-500 font-semibold ml-auto">{percentage.toFixed(1)}%</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Multi-Hazard Accordion */}
                <div>
                  <div 
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all group border ${
                      multiHazardRisk.length > 0 
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-sm cursor-pointer' 
                        : isRoadOnlyQuery && anyHazardSelected
                        ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                        : 'bg-transparent border-gray-200 hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => {
                      // Don't allow expanding if disabled (road-only query with another hazard selected)
                      if (isRoadOnlyQuery && anyHazardSelected && multiHazardRisk.length === 0) return;
                      setMultiHazardExpanded(!multiHazardExpanded);
                      if (!multiHazardExpanded) {
                        setHeatExpanded(false);
                        setAirExpanded(false);
                        setFloodExpanded(false);
                      }
                    }}
                  >
                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${multiHazardRisk.length > 0 ? 'text-blue-600' : isRoadOnlyQuery && anyHazardSelected ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-[11px] flex-1 font-medium transition-colors ${multiHazardRisk.length > 0 ? 'text-blue-900 font-bold' : isRoadOnlyQuery && anyHazardSelected ? 'text-gray-400' : 'text-gray-700 group-hover:text-gray-900'}`}>
                      Multi-Hazard
                    </span>
                    {multiHazardRisk.length > 0 && (
                      <span className="text-[9px] font-bold flex-shrink-0 bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        {multiHazardRisk.length}
                      </span>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${multiHazardRisk.length > 0 ? 'text-blue-600' : isRoadOnlyQuery && anyHazardSelected ? 'text-gray-400' : 'text-gray-500'} ${multiHazardExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {multiHazardExpanded && (
                    <div className="mt-1.5 ml-2.5 border-l-2 border-blue-200 pl-2.5 max-h-40 overflow-y-auto space-y-1">
                      {isLoadingHazardPercentages ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                          <span className="ml-2 text-[10px] text-gray-500">Loading</span>
                        </div>
                      ) : (
                        getLegendOptions(HAZARD_LAYER_MAPPING.multiHazard.legendKey).map((level) => {
                          const isSelected = multiHazardRisk.includes(level.value);
                          const percentage = hazardPercentages['Multi_Hazard_BBSR']?.[level.gridcode] ?? 0;
                          return (
                            <button
                              key={level.value}
                              onClick={() => toggleHazardLevel('multiHazard', level.value)}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all border ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-900 border-blue-300 shadow-sm'
                                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                              }`}
                            >
                              {isSelected ? (
                                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M5 13l4 4L19 7"></path>
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0"></div>
                              )}
                              <span className="flex-1 text-[10px] font-medium">{level.label}</span>
                              <span className="text-[9px] text-gray-500 font-semibold ml-auto">{percentage.toFixed(1)}%</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Filter by Location */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="px-3 py-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold text-gray-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex-shrink-0">3</span>
                    Filter by Location
                  </h3>
                  {/* Reset Button */}
                  {!selectedWards.includes('all') && selectedWards.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedWards(['all']);
                        setWardExpanded(false);
                      }}
                      className="p-1 rounded hover:bg-gray-200 transition-colors group"
                      title="Reset location filter"
                    >
                      <RotateCcw className="w-3 h-3 text-gray-500 group-hover:text-gray-900" />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-3 space-y-2">
                {/* Ward Selection Summary Card - Always Visible - FIXED HEIGHT */}
                <div 
                  className={`relative rounded-lg border-2 transition-all cursor-pointer ${
                    wardExpanded 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : 'border-gray-200 hover:border-blue-400 bg-white'
                  }`}
                  onClick={() => setWardExpanded(!wardExpanded)}
                >
                  <div className="flex items-center gap-2 px-2.5 py-2 h-[52px]">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedWards.includes('all') 
                        ? 'bg-gray-100' 
                        : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    }`}>
                      <MapPin className={`w-3.5 h-3.5 ${
                        selectedWards.includes('all') ? 'text-gray-500' : 'text-white'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-gray-900">
                        Ward Filter
                      </div>
                      <div className="text-[10px] text-gray-600 mt-0.5 truncate">
                        {selectedWards.includes('all') ? (
                          <span className="font-medium">All Wards (City-wide)</span>
                        ) : selectedWards.length <= 3 ? (
                          <span className="font-medium text-blue-700">
                            {selectedWards.map(wardId => {
                              const ward = wards.find(w => w.id === wardId);
                              return ward ? `Ward ${ward.wardNumber}` : '';
                            }).filter(Boolean).join(', ')}
                          </span>
                        ) : (
                          <span className="font-medium text-blue-700">
                            {selectedWards.length} Wards Selected
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
                      wardExpanded ? 'rotate-180' : ''
                    }`} />
                  </div>
                </div>

                {/* Ward Selection Panel - Expandable */}
                {wardExpanded && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    {/* Quick Actions Header */}
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-700">
                        {selectedWards.includes('all') ? '67 Wards Available' : `${selectedWards.length} of 67 Selected`}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const allWardIds = wards.filter(w => w.wardNumber !== 0).map(w => w.id);
                            setSelectedWards(allWardIds);
                          }}
                          className="px-2 py-1 text-[9px] font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWards(['all']);
                          }}
                          className="px-2 py-1 text-[9px] font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Ward List - Scrollable */}
                    <div className="max-h-56 overflow-y-auto">
                      {isLoadingWards ? (
                        <div className="py-8 text-center">
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
                          <p className="text-[10px] text-gray-500 mt-2">Loading wards...</p>
                        </div>
                      ) : (
                        <div className="p-2 space-y-0.5">
                          {wards.filter(w => w.wardNumber !== 0).map((w) => {
                            const isSelected = selectedWards.includes(w.id);
                            return (
                              <button
                                key={w.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleWard(w.id);
                                }}
                                className={`w-full flex items-center gap-2.5 px-2.5 rounded-md text-left transition-all h-[36px] ${
                                  isSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 ${
                                  isSelected 
                                    ? 'bg-white border-white' 
                                    : 'bg-white border-gray-300'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                      <path d="M5 13l4 4L19 7"></path>
                                    </svg>
                                  )}
                                </div>
                                <span className={`flex-1 text-[10.5px] font-semibold ${
                                  isSelected ? 'text-white' : 'text-gray-900'
                                }`}>
                                  Ward {w.wardNumber}
                                </span>
                                <span className={`text-[9px] font-medium flex-shrink-0 ${
                                  isSelected ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {w.zone}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Selected Count Footer - ALWAYS SHOWN FOR STABLE HEIGHT */}
                    <div className={`px-3 border-t transition-colors ${
                      !selectedWards.includes('all') && selectedWards.length > 0
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between h-[36px]">
                        <div className={`text-[10px] font-semibold transition-colors ${
                          !selectedWards.includes('all') && selectedWards.length > 0
                            ? 'text-blue-900'
                            : 'text-gray-500'
                        }`}>
                          {!selectedWards.includes('all') && selectedWards.length > 0 ? (
                            <>{selectedWards.length} {selectedWards.length === 1 ? 'Ward' : 'Wards'} Selected</>
                          ) : (
                            <>All Wards Selected</>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWards(['all']);
                          }}
                          className={`text-[9px] font-medium underline transition-all ${
                            !selectedWards.includes('all') && selectedWards.length > 0
                              ? 'text-blue-700 hover:text-blue-900 opacity-100'
                              : 'text-transparent opacity-0 pointer-events-none'
                          }`}
                        >
                          Reset to All
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={executeQuery}
                disabled={selectedInfraTypes.length === 0 || isExecuting}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-[11px] font-semibold flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    Apply Query
                  </>
                )}
              </button>
              <button
                onClick={clearQuery}
                className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all text-[11px] font-semibold shadow-sm"
              >
                Clear
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Results Section - Replaces Query Builder when visible */}
      {showResults && (
        <div className="flex flex-col flex-1 min-h-0 transition-all duration-300 ease-in-out">
          {/* Results Header */}
          <div className="px-4 py-3.5 border-b border-[#E5E7EB] bg-gradient-to-r from-[#F8FAFC] to-white flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <FileText className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[11px] font-bold text-[#0F172A] truncate">Query Results</h2>
                <p className="text-[9px] text-gray-500 mt-0.5">{results.length} {results.length === 1 ? 'result' : 'results'} found</p>
              </div>
              <button
                onClick={downloadPDFReport}
                className="p-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-300 border border-transparent transition-all duration-200 flex-shrink-0"
                title="Download PDF Report"
                disabled={results.length === 0}
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
              </button>
              <button
                onClick={() => {
                  setShowResults(false);
                  setQueryExecutionLegendKey(null); // Clear locked legend key
                  if (onCloseResults) {
                    onCloseResults();
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200 flex-shrink-0"
                title="Close Results"
              >
                <X className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Results Table - Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Applied Ward Filter Info */}
            {!selectedWards.includes('all') && selectedWards.length > 0 && (
              <div className="px-3 pt-3 pb-2 border-b border-gray-200 bg-blue-50">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-blue-900 mb-1">
                      Ward Filter Applied
                    </div>
                    <div className="text-[9px] text-blue-700 leading-relaxed">
                      {selectedWards.length <= 5 ? (
                        <span>
                          {selectedWards.map(wardId => {
                            const ward = wards.find(w => w.id === wardId);
                            return ward ? `Ward ${ward.wardNumber}` : '';
                          }).filter(Boolean).join(', ')}
                        </span>
                      ) : (
                        <span>
                          {selectedWards.slice(0, 4).map(wardId => {
                            const ward = wards.find(w => w.id === wardId);
                            return ward ? `Ward ${ward.wardNumber}` : '';
                          }).filter(Boolean).join(', ')}
                          {' '}and {selectedWards.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="p-3">
              {results.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-xs font-semibold text-gray-600">No results found</p>
                  <p className="text-[10px] text-gray-500 mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {results.map((result) => {
                    // Check if this is road data
                    if (result.type === 'ROAD_DATA' && (result as any).roadData) {
                      const roadData = (result as any).roadData;
                      const categories = Object.values(roadData);
                      
                      // Sort categories based on type
                      // For Road Network: use the defined order
                      // For Road Safety: already sorted by star rating in the API response
                      const isRoadSafety = categories.some((cat: any) => cat.category.includes('-Star'));
                      
                      if (!isRoadSafety) {
                        // Only sort for Road Network
                        const categoryOrder = ['National Highway', 'State Highway', 'Major Roads', 'Link Road'];
                        categories.sort((a: any, b: any) => {
                          const indexA = categoryOrder.indexOf(a.category);
                          const indexB = categoryOrder.indexOf(b.category);
                          // If category not found in order array, put it at the end
                          if (indexA === -1) return 1;
                          if (indexB === -1) return -1;
                          return indexA - indexB;
                        });
                      }
                      // For Road Safety, categories are already ordered from fetchRoadOverlayQuery (5-Star to 1-Star)
                      
                      // Helper function to extract gridcode values from selected hazard filters
                      const getHazardGridcodes = (selectedValues: string[], legendKey: string): number[] | null => {
                        if (!selectedValues || selectedValues.length === 0) {
                          return null; // No filter, show all
                        }
                        
                        const legendEntries = LEGEND_DATA[legendKey];
                        if (!legendEntries || !Array.isArray(legendEntries)) {
                          return null;
                        }
                        
                        console.log('[Road Query] Filtering gridcodes:', {
                          legendKey,
                          selectedValues,
                          availableLabels: legendEntries.map(e => `${e.label.trim()} (${e.description})`)
                        });
                        
                        const gridcodes: number[] = [];
                        selectedValues.forEach(value => {
                          // The value format is "Label (Description)" as created by getLegendOptions
                          const legendEntry = legendEntries.find((entry: LegendEntry) => {
                            const formattedValue = `${entry.label.trim()} (${entry.description})`;
                            return formattedValue === value;
                          });
                          
                          if (legendEntry && legendEntry.gridcode !== undefined) {
                            gridcodes.push(legendEntry.gridcode);
                            console.log(`[Road Query] Matched "${value}" to gridcode ${legendEntry.gridcode}`);
                          } else {
                            console.log(`[Road Query] No match found for "${value}"`);
                          }
                        });
                        
                        console.log('[Road Query] Final gridcodes:', gridcodes);
                        return gridcodes.length > 0 ? gridcodes : null;
                      };
                      
                      // Use the LOCKED legend key from query execution time
                      // This ensures colors don't change when user switches layers after query
                      const activeLegendKey = queryExecutionLegendKey || '';
                      
                      // Determine active hazard name for display
                      let activeHazardName = '';
                      if (activeLegendKey === 'HHI_2025') {
                        activeHazardName = 'Heat Stress';
                      } else if (activeLegendKey === 'Air_AQI') {
                        activeHazardName = 'Air Quality';
                      } else if (activeLegendKey === 'Flood_Hazard') {
                        activeHazardName = 'Flood';
                      } else if (activeLegendKey === 'Multi_Hazard_BBSR') {
                        activeHazardName = 'Multi-Hazard';
                      }
                      
                      // Get legend data for the active hazard type
                      const activeLegendData = activeLegendKey ? LEGEND_DATA[activeLegendKey] : null;
                      
                      // Extract gridcode filters for each hazard type
                      const heatGridcodes = getHazardGridcodes(heatRisk, 'HHI_2025');
                      const airGridcodes = getHazardGridcodes(airRisk, 'Air_AQI');
                      const floodGridcodes = getHazardGridcodes(floodRisk, 'Flood_Hazard');
                      const multiHazardGridcodes = getHazardGridcodes(multiHazardRisk, 'Multi_Hazard_BBSR');
                      
                      // Combine all gridcodes for filtering
                      const allowedGridcodes = new Set<number>();
                      if (heatGridcodes) heatGridcodes.forEach(g => allowedGridcodes.add(g));
                      if (airGridcodes) airGridcodes.forEach(g => allowedGridcodes.add(g));
                      if (floodGridcodes) floodGridcodes.forEach(g => allowedGridcodes.add(g));
                      if (multiHazardGridcodes) multiHazardGridcodes.forEach(g => allowedGridcodes.add(g));
                      
                      console.log('[Road Query] Allowed gridcodes for filtering:', Array.from(allowedGridcodes));
                      
                      // If no filters selected, show all gridcodes
                      const shouldFilterGridcodes = allowedGridcodes.size > 0;
                      
                      console.log('[Road Query] Should filter?', shouldFilterGridcodes, 'Filters:', {
                        heat: heatRisk,
                        air: airRisk,
                        flood: floodRisk,
                        multiHazard: multiHazardRisk
                      });
                      
                      // Log all category:gridcode combinations shown in panel
                      const panelCombinations: string[] = [];
                      categories.forEach((cat: any) => {
                        Object.keys(cat.lengthByGridcode).forEach((gridcode: string) => {
                          panelCombinations.push(`${cat.category}:${gridcode}`);
                        });
                      });
                      console.log('📋 [QueryPanel] Category:gridcode combinations shown in panel:', 
                        panelCombinations.sort()
                      );
                      
                      return (
                        <div key={result.id} className="space-y-4">
                          {/* Title with Safety Assessment Type */}
                          <div className="space-y-2 mb-3 px-1">
                            <div className="text-[10px] font-semibold text-gray-700">
                              {isRoadSafety ? 'Road Safety (iRAP) Analysis by Star Rating & Hazard Level' : 'Road Network Analysis by Category & Hazard Level'}
                            </div>
                            {/* Display Safety Assessment Type if available */}
                            {isRoadSafety && result.safetyType && (
                              <div className="flex items-center gap-2 px-2 py-1.5 bg-gradient-to-r from-emerald-50 to-transparent rounded-md border-l-2 border-emerald-500">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                <span className="text-[10px] font-medium text-emerald-900">
                                  Assessment Type: <span className="font-bold">{result.safetyType}</span>
                                </span>
                              </div>
                            )}
                          </div>
                          {categories.map((cat: any, idx: number) => {
                            console.log('[Road Query] Processing category:', cat.category, 'Original gridcodes:', Object.keys(cat.lengthByGridcode));
                            
                            // STEP 1: Use cat.lengthByGridcode which contains ALL gridcodes from the backend
                            // This is the TRUE total for this category (unfiltered by hazard level selection in UI)
                            const allGridcodesForCategory = cat.lengthByGridcode || {};
                            
                            // STEP 2: Build lengthByGridcode from actual segment data for this category ONLY
                            // This ensures consistency with categoryTotalLength calculation
                            let augmentedLengthByGridcode: Record<string, number> = {};
                            
                            // STEP 3: Scan category features and calculate lengths from segments
                            cat.features.forEach((feature: any) => {
                              const segments = feature.properties?.segments || [];
                              segments.forEach((segment: any) => {
                                const gridcode = segment.gridcode || 
                                               segment.properties?.gridcode || 
                                               segment.properties?.HHI_2025 || 
                                               segment.properties?.Air_AQI || 
                                               segment.properties?.Flood_Hazard;
                                
                                if (gridcode) {
                                  const gridcodeStr = gridcode.toString();
                                  if (!augmentedLengthByGridcode[gridcodeStr]) {
                                    augmentedLengthByGridcode[gridcodeStr] = 0;
                                  }
                                  const segmentLength = segment.length_meters || 0;
                                  augmentedLengthByGridcode[gridcodeStr] += segmentLength;
                                }
                              });
                            });
                            
                            console.log('[Road Query] Recalculated gridcodes from segments:', Object.keys(augmentedLengthByGridcode));
                            
                            // STEP 4: Filter gridcodes based on selected hazard filters
                            const filteredLengthByGridcode = shouldFilterGridcodes
                              ? Object.entries(augmentedLengthByGridcode).reduce((acc: any, [gridcode, length]) => {
                                  const gridcodeNum = Number(gridcode);
                                  const isAllowed = allowedGridcodes.has(gridcodeNum);
                                  console.log(`[Road Query] Gridcode ${gridcode}: allowed=${isAllowed}`);
                                  if (isAllowed) {
                                    acc[gridcode] = length;
                                  }
                                  return acc;
                                }, {})
                              : augmentedLengthByGridcode;
                            
                            console.log('[Road Query] Filtered gridcodes:', Object.keys(filteredLengthByGridcode));
                            
                            // Skip category if no gridcodes match the filter
                            if (Object.keys(filteredLengthByGridcode).length === 0) {
                              return null;
                            }
                            
                            // Calculate FILTERED total length from filteredLengthByGridcode
                            const categoryTotalLength = Object.values(filteredLengthByGridcode).reduce((sum: number, length: any) => sum + length, 0);
                            
                            // Get CITY-WIDE total length for this category from legend panel statistics
                            // This is the TRUE denominator - total road length across entire city/dataset
                            let cityWideCategoryTotal = 0;
                            
                            // Check if this is a Road Safety category (star rating) or Road Network category
                            const isStarRating = cat.category.includes('-Star');
                            
                            if (isStarRating && roadSafetyStats) {
                              // For Road Safety: extract the safety type from category name
                              const safetyType = result.safetyType?.toLowerCase();
                              if (safetyType) {
                                const safetyKey = `irap_${safetyType}`;
                                const safetyData = roadSafetyStats[safetyKey];
                                if (safetyData) {
                                  cityWideCategoryTotal = safetyData.totalLength * 1000; // Convert km to meters
                                }
                              }
                            } else if (roadNetworkStats) {
                              // For Road Network: use category name to look up stats
                              cityWideCategoryTotal = (roadNetworkStats[cat.category] || 0) * 1000; // Convert km to meters
                            }
                            
                            // Fallback: if no city-wide stats available, use ward-level total
                            const categoryOverallTotal = cityWideCategoryTotal > 0 
                              ? cityWideCategoryTotal 
                              : Object.values(allGridcodesForCategory).reduce((sum: number, length: any) => sum + length, 0);
                            
                            // Calculate percentage of CITY-WIDE total category length
                            const categoryPercentage = categoryOverallTotal > 0 
                              ? ((categoryTotalLength / categoryOverallTotal) * 100).toFixed(1)
                              : '100.0';
                            
                            console.log(`[Road Query] ${cat.category} - Percentage calculation: ${categoryTotalLength} / ${categoryOverallTotal} (${cityWideCategoryTotal > 0 ? 'city-wide' : 'ward-level'}) = ${categoryPercentage}%`);
                            
                            // Helper function to get legend entry for a gridcode
                            const getLegendEntry = (gridcode: number) => {
                              if (!activeLegendData) return null;
                              return activeLegendData.find(entry => entry.gridcode === gridcode);
                            };
                            
                            // Group all hazard boxes under one road category header
                            // Check if this category is a star rating
                            const isStarCategory = cat.category.includes('-Star');
                            const categoryIcon = isStarCategory ? Star : Route;
                            const categoryColor = isStarCategory ? 'green' : 'blue';
                            
                            // Check if this category is expanded
                            const isCategoryExpanded = expandedCategories[cat.category] !== false; // Default to true (expanded)
                            
                            return (
                              <div key={idx} className="space-y-2">
                                {/* Road Category Header - Clickable */}
                                <button 
                                  onClick={() => {
                                    setExpandedCategories(prev => ({
                                      ...prev,
                                      [cat.category]: !isCategoryExpanded
                                    }));
                                  }}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 bg-gradient-to-r from-${categoryColor}-50 to-transparent rounded-md border-l-3 border-${categoryColor}-500 hover:from-${categoryColor}-100 transition-all cursor-pointer`}
                                >
                                  {/* Chevron Icon */}
                                  {isCategoryExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                  )}
                                  
                                  {/* Category Icon */}
                                  {isStarCategory ? (
                                    <Star className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <Route className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  )}
                                  
                                  <h4 className="text-[11px] font-bold text-gray-900">{cat.category}</h4>
                                  <span className="ml-auto text-[10px] text-gray-600 flex items-center gap-1.5">
                                    <span className="font-semibold">Total: {(categoryTotalLength / 1000).toFixed(1)} km</span>
                                    <span className="text-gray-500">({categoryPercentage}%)</span>
                                  </span>
                                </button>
                                
                                {/* Modern Horizontal Bar Chart Style - Conditionally Rendered */}
                                {isCategoryExpanded && (
                                  <div className="space-y-1 pl-2">
                                  {Object.entries(filteredLengthByGridcode).map(([gridcode, length]: [string, any]) => {
                                    const lengthKm = (length / 1000).toFixed(1);
                                    const legendEntry = getLegendEntry(Number(gridcode));
                                    
                                    // Use actual legend data for label, description, and color
                                    const hazardLabel = legendEntry ? legendEntry.label : `Level ${gridcode}`;
                                    const hazardDescription = legendEntry ? legendEntry.description : '';
                                    
                                    // Use darker query result colors for better visibility (matching map colors)
                                    const QUERY_RESULT_COLORS: Record<string, Record<number, string>> = {
                                      // Heat Stress (HHI) - all scenarios
                                      'HHI_2025': { 1: '#1B5E20', 2: '#8A7A00', 3: '#C2410C', 4: '#7F0000' },
                                      'HHI_SSP1_2040': { 1: '#1B5E20', 2: '#8A7A00', 3: '#C2410C', 4: '#7F0000' },
                                      'HHI_SSP2_2040': { 1: '#1B5E20', 2: '#8A7A00', 3: '#C2410C', 4: '#7F0000' },
                                      'HHI_SSP5_2040': { 1: '#1B5E20', 2: '#8A7A00', 3: '#C2410C', 4: '#7F0000' },
                                      
                                      // Flood
                                      'Flood_Hazard': { 1: '#2B2B2B', 2: '#0066A6', 3: '#004C99', 4: '#001B7A' },
                                      
                                      // Air AQI
                                      'Air_AQI': { 1: '#1B5E20', 2: '#4C7C1D', 3: '#7A6A00', 4: '#8A4B00', 5: '#7F0000', 6: '#4A0C08' },
                                      
                                      // Multi Hazard
                                      'Multi_Hazard_BBSR': { 1: '#1B5E20', 2: '#8A7A00', 3: '#C2410C', 4: '#7F0000' },
                                    };
                                    
                                    // Use dark query result color if available, otherwise fall back to legend color
                                    const hazardColor = (QUERY_RESULT_COLORS[activeLegendKey] && QUERY_RESULT_COLORS[activeLegendKey][Number(gridcode)])
                                      ? QUERY_RESULT_COLORS[activeLegendKey][Number(gridcode)]
                                      : (legendEntry ? legendEntry.color : '#888888');
                                    
                                    // Create hazard type prefix
                                    let hazardPrefix = '';
                                    if (activeLegendKey === 'HHI_2025') {
                                      hazardPrefix = 'HHI';
                                    } else if (activeLegendKey === 'Air_AQI') {
                                      hazardPrefix = 'AQI';
                                    } else if (activeLegendKey === 'Flood_Hazard') {
                                      hazardPrefix = 'Flood';
                                    } else if (activeLegendKey === 'Multi_Hazard_BBSR') {
                                      hazardPrefix = 'Multi-Hazard';
                                    }
                                    
                                    // Combine prefix with label
                                    const displayLabel = hazardPrefix ? `${hazardPrefix} - ${hazardLabel}` : hazardLabel;
                                    
                                    // Calculate percentage based on overall total from Query Builder stats
                                    const percentage = categoryOverallTotal > 0 
                                      ? (length / categoryOverallTotal) * 100 
                                      : (length / categoryTotalLength) * 100;
                                    
                                    // Check if this result is visible
                                    const visibilityKey = `${cat.category}:${gridcode}`;
                                    const isVisible = roadResultVisibility[visibilityKey] !== false; // Default to true if not set
                                    
                                    // Check if this hazard level is expanded (for Road Safety)
                                    const hazardLevelKey = `${cat.category}:${gridcode}`;
                                    const isHazardExpanded = expandedHazardLevels[hazardLevelKey] === true;
                                    
                                    // For Road Safety: Group features by road name within this gridcode
                                    const roadsByName: Record<string, { length: number; features: any[] }> = {};
                                    if (isStarCategory) {
                                      cat.features.forEach((f: any) => {
                                        const segments = f.properties?.segments || [];
                                        segments.forEach((seg: any) => {
                                          const segGridcode = seg.gridcode || 
                                                             seg.properties?.gridcode || 
                                                             seg.properties?.[activeLegendKey];
                                          
                                          if (Number(segGridcode) === Number(gridcode)) {
                                            const roadName = f.properties?.category || f.properties?.name || f.properties?.road_name || f.properties?.NAME || 'Unnamed Road';
                                            if (!roadsByName[roadName]) {
                                              roadsByName[roadName] = { length: 0, features: [] };
                                            }
                                            roadsByName[roadName].length += seg.length_meters || 0;
                                            roadsByName[roadName].features.push({
                                              type: 'Feature',
                                              geometry: seg.geometry,
                                              properties: {
                                                category: cat.category,
                                                gridcode: segGridcode,
                                                ...seg.properties
                                              }
                                            });
                                          }
                                        });
                                      });
                                    }
                                    
                                    return (
                                      <div key={`${idx}-${gridcode}`} className="space-y-0.5">
                                        <div 
                                          className={`group relative rounded overflow-hidden transition-all ${
                                            isVisible 
                                              ? 'opacity-100' 
                                              : 'opacity-40'
                                          }`}
                                        >
                                          {/* Background Gradient Bar */}
                                          <div 
                                            className="absolute inset-0 opacity-10"
                                            style={{ 
                                              background: `linear-gradient(to right, ${hazardColor} ${percentage}%, transparent ${percentage}%)` 
                                            }}
                                          />
                                          
                                          {/* Content Row */}
                                          <div 
                                            className="relative flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50/50 transition-colors cursor-pointer"
                                            onClick={() => {
                                              if (isStarCategory) {
                                                // For Road Safety: Toggle expansion to show individual roads
                                                setExpandedHazardLevels(prev => ({
                                                  ...prev,
                                                  [hazardLevelKey]: !isHazardExpanded
                                                }));
                                                
                                                // Also trigger highlight for the entire star rating category
                                                const matchingSegments: any[] = [];
                                                
                                                cat.features.forEach((f: any) => {
                                                  const segments = f.properties?.segments || [];
                                                  segments.forEach((seg: any) => {
                                                    const segGridcode = seg.gridcode || 
                                                                       seg.properties?.gridcode || 
                                                                       seg.properties?.[activeLegendKey];
                                                    
                                                    if (Number(segGridcode) === Number(gridcode) && seg.geometry) {
                                                      matchingSegments.push({
                                                        type: 'Feature',
                                                        geometry: seg.geometry,
                                                        properties: {
                                                          category: cat.category,
                                                          gridcode: segGridcode,
                                                          ...seg.properties
                                                        }
                                                      });
                                                    }
                                                  });
                                                });
                                                
                                                if (onZoomToRoadSegment && matchingSegments.length > 0) {
                                                  console.log(`🎯 Zooming to ${cat.category} - ${displayLabel}:`, matchingSegments.length, 'segments with gridcode', gridcode);
                                                  onZoomToRoadSegment(matchingSegments, cat.category, gridcode, hazardColor);
                                                  
                                                  // Trigger road network highlight with multi-layer outline
                                                  if (onRoadNetworkSelect) {
                                                    // Determine the active user type from result.safetyType
                                                    const safetyType = result.safetyType?.toLowerCase();
                                                    const userTypeMapping: Record<string, string> = {
                                                      'vehicle occupant': 'vehicle_occupant',
                                                      'motorcyclist': 'motorcyclist',
                                                      'bicyclist': 'bicyclist',
                                                      'pedestrian': 'pedestrian'
                                                    };
                                                    const activeUserType = safetyType ? userTypeMapping[safetyType] : 'vehicle_occupant';
                                                    
                                                    onRoadNetworkSelect({
                                                      category: cat.category,
                                                      gridcode: gridcode,
                                                      hazardColor: hazardColor,
                                                      activeUserType: activeUserType,
                                                      isStarRating: true
                                                    });
                                                  }
                                                }
                                              } else {
                                                // For Road Network: Zoom to roads as before
                                                const matchingSegments: any[] = [];
                                                
                                                cat.features.forEach((f: any) => {
                                                  const segments = f.properties?.segments || [];
                                                  segments.forEach((seg: any) => {
                                                    const segGridcode = seg.gridcode || 
                                                                       seg.properties?.gridcode || 
                                                                       seg.properties?.[activeLegendKey];
                                                    
                                                    if (Number(segGridcode) === Number(gridcode) && seg.geometry) {
                                                      matchingSegments.push({
                                                        type: 'Feature',
                                                        geometry: seg.geometry,
                                                        properties: {
                                                          category: cat.category,
                                                          gridcode: segGridcode,
                                                          ...seg.properties
                                                        }
                                                      });
                                                    }
                                                  });
                                                });
                                                
                                                if (onZoomToRoadSegment && matchingSegments.length > 0) {
                                                  console.log(`🎯 Zooming to ${cat.category} - ${displayLabel}:`, matchingSegments.length, 'segments with gridcode', gridcode);
                                                  onZoomToRoadSegment(matchingSegments, cat.category, gridcode, hazardColor);
                                                  
                                                  // Trigger road network highlight with multi-layer outline
                                                  if (onRoadNetworkSelect) {
                                                    onRoadNetworkSelect({
                                                      category: cat.category,
                                                      gridcode: gridcode,
                                                      hazardColor: hazardColor,
                                                      isStarRating: false
                                                    });
                                                  }
                                                }
                                              }
                                            }}
                                          >
                                          {/* Chevron Icon (only for Road Safety) */}
                                          {isStarCategory && (
                                            isHazardExpanded ? (
                                              <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                            ) : (
                                              <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                            )
                                          )}
                                          
                                          {/* Color Indicator Strip */}
                                          <div 
                                            className="w-1 h-8 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: hazardColor }}
                                          />
                                          
                                          {/* Text Content */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-1.5">
                                              <span className="text-[10px] font-semibold text-gray-900 leading-tight">
                                                {displayLabel}
                                              </span>
                                              {hazardDescription && (
                                                <span className="text-[9px] text-gray-500 leading-tight truncate">
                                                  {hazardDescription}
                                                </span>
                                              )}
                                            </div>
                                            
                                            {/* Visual Progress Bar */}
                                            <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                              <div 
                                                className="h-full rounded-full transition-all duration-300"
                                                style={{ 
                                                  width: `${percentage}%`,
                                                  backgroundColor: hazardColor
                                                }}
                                              />
                                            </div>
                                          </div>
                                          
                                          {/* Length Value */}
                                          <div className="text-right flex-shrink-0">
                                            <div className="text-[11px] font-bold text-gray-900">
                                              {lengthKm} km
                                            </div>
                                            <div className="text-[8px] text-gray-500">
                                              {percentage.toFixed(1)}%
                                            </div>
                                          </div>
                                          
                                          {/* Eye Toggle Icon */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              
                                              // Toggle visibility - useEffect will handle map update
                                              const newVisibility = !isVisible;
                                              setRoadResultVisibility(prev => ({
                                                ...prev,
                                                [visibilityKey]: newVisibility
                                              }));
                                              
                                              console.log('👁️ Visibility toggled:', { 
                                                category: cat.category, 
                                                gridcode, 
                                                visibilityKey, 
                                                newVisibility 
                                              });
                                            }}
                                            className={`flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors ${
                                              isVisible ? 'text-blue-600' : 'text-gray-400'
                                            }`}
                                            title={isVisible ? 'Hide from map' : 'Show on map'}
                                          >
                                            {isVisible ? (
                                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                              </svg>
                                            ) : (
                                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                              </svg>
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {/* Third Level: Individual Roads (only for Road Safety when expanded) */}
                                      {isStarCategory && isHazardExpanded && (
                                        <div className="ml-6 mt-0.5 space-y-0.5">
                                          {Object.entries(roadsByName)
                                            .sort(([, a], [, b]) => b.length - a.length) // Sort by length descending
                                            .map(([roadName, roadData]) => {
                                              const roadLengthKm = (roadData.length / 1000).toFixed(2);
                                              
                                              return (
                                                <div
                                                  key={`${hazardLevelKey}-${roadName}`}
                                                  className="group relative rounded overflow-hidden hover:bg-gray-50/70 transition-colors cursor-pointer"
                                                  onClick={() => {
                                                    // Zoom to this specific road
                                                    if (onZoomToRoadSegment && roadData.features.length > 0) {
                                                      console.log(`🎯 Zooming to road "${roadName}" in ${cat.category} - ${displayLabel}:`, roadData.features.length, 'segments');
                                                      onZoomToRoadSegment(roadData.features, cat.category, gridcode, hazardColor);
                                                      
                                                      // Trigger road network highlight with multi-layer outline
                                                      if (onRoadNetworkSelect) {
                                                        // Determine the active user type from result.safetyType
                                                        const safetyType = result.safetyType?.toLowerCase();
                                                        const userTypeMapping: Record<string, string> = {
                                                          'vehicle occupant': 'vehicle_occupant',
                                                          'motorcyclist': 'motorcyclist',
                                                          'bicyclist': 'bicyclist',
                                                          'pedestrian': 'pedestrian'
                                                        };
                                                        const activeUserType = safetyType ? userTypeMapping[safetyType] : 'vehicle_occupant';
                                                        
                                                        onRoadNetworkSelect({
                                                          category: cat.category,
                                                          gridcode: gridcode,
                                                          hazardColor: hazardColor,
                                                          activeUserType: activeUserType,
                                                          isStarRating: true
                                                        });
                                                      }
                                                    }
                                                  }}
                                                >
                                                  <div className="flex items-center gap-2 px-2 py-1 border-l-2" style={{ borderColor: hazardColor }}>
                                                    {/* Road Icon */}
                                                    <Route className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                    
                                                    {/* Road Name */}
                                                    <div className="flex-1 min-w-0">
                                                      <div className="text-[9px] font-medium text-gray-800 truncate">
                                                        {roadName}
                                                      </div>
                                                    </div>
                                                    
                                                    {/* Road Length */}
                                                    <div className="text-[9px] font-semibold text-gray-700 flex-shrink-0">
                                                      {roadLengthKm} km
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                        </div>
                                      )}
                                    </div>
                                    );
                                  })}
                                </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    
                    // Regular POI result
                    console.log('[QueryPanel] Rendering result:', result);
                    console.log('[QueryPanel] Hazard values:', {
                      hhi2025: result.hhi2025,
                      airAqi: result.airAqi,
                      floodHazard: result.floodHazard,
                      multiHazard: result.multiHazard
                    });
                    
                    // Pre-calculate hazard info to avoid multiple calls
                    const heatInfo = getHazardInfoFromLegend(result.hhi2025, 'HHI_2025');
                    const airInfo = getHazardInfoFromLegend(result.airAqi, 'Air_AQI');
                    const floodInfo = getHazardInfoFromLegend(result.floodHazard, 'Flood_Hazard');
                    const multiHazardInfo = getHazardInfoFromLegend(result.multiHazard, 'Multi_Hazard_BBSR');
                    
                    console.log('[QueryPanel] Hazard info objects:', {
                      heatInfo,
                      airInfo,
                      floodInfo,
                      multiHazardInfo
                    });
                    
                    return (
                    <div key={result.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-all bg-white shadow-sm cursor-pointer" onClick={() => onZoomToPoint && onZoomToPoint(result.lat, result.lng, result.name)}>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[11px] font-semibold text-gray-900 truncate">{result.name}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">{result.type}</p>
                        </div>
                        <button 
                          className="ml-2 px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 flex-shrink-0 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onZoomToPoint && onZoomToPoint(result.lat, result.lng, result.name);
                          }}
                        >
                          <MapPin className="w-3 h-3" />
                          View
                        </button>
                      </div>

                      {/* Ward Location */}
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="text-[10px] font-medium text-gray-600">{result.ward}</span>
                      </div>

                      {/* Hazard Levels - Matching Popup Style */}
                      <div className="space-y-1.5">
                        {/* Heat Stress */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Flame className="w-3 h-3 text-orange-500" />
                            <span className="text-[9px] text-slate-600 font-medium">Heat Stress</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-right">
                              <span className="text-slate-800 font-semibold">{heatInfo.label}</span>
                              {heatInfo.description && <span className="text-slate-500"> ({heatInfo.description})</span>}
                            </span>
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: heatInfo.color }}
                            />
                          </div>
                        </div>
                        
                        {/* Air Quality */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Wind className="w-3 h-3 text-sky-500" />
                            <span className="text-[9px] text-slate-600 font-medium">Air Quality</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-right">
                              <span className="text-slate-800 font-semibold">{airInfo.label}</span>
                              {airInfo.description && <span className="text-slate-500"> ({airInfo.description})</span>}
                            </span>
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: airInfo.color }}
                            />
                          </div>
                        </div>
                        
                        {/* Flood Risk */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Droplets className="w-3 h-3 text-blue-500" />
                            <span className="text-[9px] text-slate-600 font-medium">Flood Risk</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-right">
                              <span className="text-slate-800 font-semibold">{floodInfo.label}</span>
                              {floodInfo.description && <span className="text-slate-500"> ({floodInfo.description})</span>}
                            </span>
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: floodInfo.color }}
                            />
                          </div>
                        </div>
                        
                        {/* Multi-Hazard */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-purple-500" />
                            <span className="text-[9px] text-slate-600 font-semibold">Multi-Hazard</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-right">
                              <span className="text-slate-800 font-semibold">{multiHazardInfo.label}</span>
                              {multiHazardInfo.description && <span className="text-slate-500"> ({multiHazardInfo.description})</span>}
                            </span>
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: multiHazardInfo.color }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Results Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex-shrink-0 shadow-sm">
            <div className="flex gap-2">
              <button
                onClick={handleBackToQuery}
                className="flex-1 px-3 py-2.5 bg-white border border-[#2563EB] text-[#2563EB] rounded-lg hover:bg-blue-50 hover:border-[#1d4ed8] transition-all text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Query
              </button>
              <button
                onClick={handleClosePanel}
                className="flex-1 px-3 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Fetch real infrastructure data from GeoServer based on filters
async function fetchPOIQuery(city: string, filters: any) {
  console.log('[fetchPOIQuery] Fetching infrastructure with filters:', filters);
  
  const { selectedSubLayers, selectedWards, heatRisk, airRisk, floodRisk, multiHazardRisk } = filters;
  
  if (!selectedSubLayers || selectedSubLayers.length === 0) {
    return { total_count: 0, results: [] };
  }
  
  // Helper function to extract gridcode values from selected hazard filters
  const getHazardGridcodes = (selectedValues: string[], legendKey: string): number[] | null => {
    // If no values, return null (no filter)
    if (!selectedValues || selectedValues.length === 0) {
      return null;
    }
    
    const legendData = LEGEND_DATA[legendKey];
    if (!legendData) return null;
    
    const gridcodes: number[] = [];
    selectedValues.forEach(value => {
      // Find matching entry in legend data
      const entry = legendData.find(e => {
        const expectedValue = `${e.label.trim()} (${e.description})`;
        return expectedValue === value;
      });
      if (entry) {
        gridcodes.push(entry.gridcode);
      }
    });
    
    return gridcodes.length > 0 ? gridcodes : null;
  };
  
  // Extract gridcode filters for each hazard type
  const heatGridcodes = getHazardGridcodes(heatRisk, 'HHI_2025');
  const airGridcodes = getHazardGridcodes(airRisk, 'Air_AQI');
  const floodGridcodes = getHazardGridcodes(floodRisk, 'Flood_Hazard');
  const multiHazardGridcodes = getHazardGridcodes(multiHazardRisk, 'Multi_Hazard_BBSR');
  
  console.log('[fetchPOIQuery] Hazard gridcode filters:', {
    heat: heatGridcodes,
    air: airGridcodes,
    flood: floodGridcodes,
    multiHazard: multiHazardGridcodes
  });
  
  // Categorize sublayers and map to GeoServer category names
  const educationCategories = selectedSubLayers
    .filter((id: string) => ['university', 'college', 'school', 'anganwadi'].includes(id))
    .map((id: string) => mapEducationId(id));
  
  const healthcareCategories = selectedSubLayers
    .filter((id: string) => ['hospital', 'health_centre', 'nursing_home'].includes(id))
    .map((id: string) => mapHealthcareId(id));
  
  const publicAmenitiesCategories = selectedSubLayers
    .filter((id: string) => ['community_centre', 'culture_centre', 'fire_station', 'government_buildings', 'park', 'petrol_pump', 'playground_stadium', 'police_outpost', 'religious', 'telephone_exchange', 'haat_market', 'vending_zones'].includes(id))
    .map((id: string) => mapPublicAmenitiesId(id));
  
  const transportCategories = selectedSubLayers
    .filter((id: string) => ['airport', 'bus_terminal', 'bus_stop', 'ev_charging', 'railway_station'].includes(id))
    .map((id: string) => mapTransportId(id));
  
  // Handle ward filter - determine which wards to query
  let wardFilter: string[] | undefined = undefined;
  if (selectedWards && !selectedWards.includes('all')) {
    // If specific wards are selected, use them for filtering
    wardFilter = selectedWards;
  }
  
  // Fetch data from each category
  const allResults: any[] = [];
  
  try {
    // Fetch Education data
    if (educationCategories.length > 0) {
      const eduData = await fetchEducationData(wardFilter, educationCategories);
      console.log('[fetchPOIQuery] Sample education properties:', eduData[0]?.properties);
      eduData.forEach(inst => {
        allResults.push({
          id: inst.id,
          name: inst.name,
          category: 'Educational Institutions',
          subcategory: inst.category,
          ward: inst.properties.Ward || 'N/A',
          hazards: {
            HHI_2025: inst.properties.HHI_2025,
            Air_AQI: inst.properties.Air_AQI,
            Flood_Hazard: inst.properties.Flood_Hazard,
            Multi_Hazard_BBSR: inst.properties.Multi_Hazard_BBSR
          },
          coordinates: {
            lat: inst.lat,
            lon: inst.lng
          }
        });
      });
    }
    
    // Fetch Healthcare data
    if (healthcareCategories.length > 0) {
      const healthData = await fetchHealthcareData(wardFilter, healthcareCategories);
      healthData.forEach(facility => {
        allResults.push({
          id: facility.id,
          name: facility.name,
          category: 'Healthcare Facilities',
          subcategory: facility.category,
          ward: facility.properties.Ward || 'N/A',
          hazards: {
            HHI_2025: facility.properties.HHI_2025,
            Air_AQI: facility.properties.Air_AQI,
            Flood_Hazard: facility.properties.Flood_Hazard,
            Multi_Hazard_BBSR: facility.properties.Multi_Hazard_BBSR
          },
          coordinates: {
            lat: facility.lat,
            lon: facility.lng
          }
        });
      });
    }
    
    // Fetch Public Amenities data
    if (publicAmenitiesCategories.length > 0) {
      const amenitiesData = await fetchPublicAmenitiesData(wardFilter, publicAmenitiesCategories);
      amenitiesData.forEach(amenity => {
        allResults.push({
          id: amenity.id,
          name: amenity.name,
          category: 'Public Amenities',
          subcategory: amenity.category,
          ward: amenity.properties.Ward || 'N/A',
          hazards: {
            HHI_2025: amenity.properties.HHI_2025,
            Air_AQI: amenity.properties.Air_AQI,
            Flood_Hazard: amenity.properties.Flood_Hazard,
            Multi_Hazard_BBSR: amenity.properties.Multi_Hazard_BBSR
          },
          coordinates: {
            lat: amenity.lat,
            lon: amenity.lng
          }
        });
      });
    }
    
    // Fetch Transport data
    if (transportCategories.length > 0) {
      const transportData = await fetchTransportData(wardFilter, transportCategories);
      transportData.forEach(facility => {
        allResults.push({
          id: facility.id,
          name: facility.name,
          category: 'Transport & Mobility',
          subcategory: facility.category,
          ward: facility.properties.Ward || 'N/A',
          hazards: {
            HHI_2025: facility.properties.HHI_2025,
            Air_AQI: facility.properties.Air_AQI,
            Flood_Hazard: facility.properties.Flood_Hazard,
            Multi_Hazard_BBSR: facility.properties.Multi_Hazard_BBSR
          },
          coordinates: {
            lat: facility.lat,
            lon: facility.lng
          }
        });
      });
    }
    
    console.log(`[fetchPOIQuery] Found ${allResults.length} infrastructure points before hazard filtering`);
    
    // Apply hazard filters
    let filteredResults = allResults;
    
    // Filter by Heat Stress (HHI_2025)
    if (heatGridcodes !== null) {
      filteredResults = filteredResults.filter(result => {
        const hazardValue = result.hazards?.HHI_2025;
        return hazardValue !== null && hazardValue !== undefined && heatGridcodes.includes(hazardValue);
      });
      console.log(`[fetchPOIQuery] After heat filter: ${filteredResults.length} points`);
    }
    
    // Filter by Air Pollution (Air_AQI)
    if (airGridcodes !== null) {
      filteredResults = filteredResults.filter(result => {
        const hazardValue = result.hazards?.Air_AQI;
        return hazardValue !== null && hazardValue !== undefined && airGridcodes.includes(hazardValue);
      });
      console.log(`[fetchPOIQuery] After air filter: ${filteredResults.length} points`);
    }
    
    // Filter by Flood (Flood_Hazard)
    if (floodGridcodes !== null) {
      filteredResults = filteredResults.filter(result => {
        const hazardValue = result.hazards?.Flood_Hazard;
        return hazardValue !== null && hazardValue !== undefined && floodGridcodes.includes(hazardValue);
      });
      console.log(`[fetchPOIQuery] After flood filter: ${filteredResults.length} points`);
    }
    
    // Filter by Multi-Hazard (Multi_Hazard_BBSR)
    if (multiHazardGridcodes !== null) {
      filteredResults = filteredResults.filter(result => {
        const hazardValue = result.hazards?.Multi_Hazard_BBSR;
        return hazardValue !== null && hazardValue !== undefined && multiHazardGridcodes.includes(hazardValue);
      });
      console.log(`[fetchPOIQuery] After multi-hazard filter: ${filteredResults.length} points`);
    }
    
    console.log(`[fetchPOIQuery] Final filtered results: ${filteredResults.length} infrastructure points`);
    
    return {
      total_count: filteredResults.length,
      results: filteredResults
    };
  } catch (error) {
    console.error('[fetchPOIQuery] Error fetching infrastructure data:', error);
    return { total_count: 0, results: [] };
  }
}

// Fetch road network and road safety data with overlay query API
async function fetchRoadOverlayQuery(filters: any, scenario?: string) {
  console.log('[fetchRoadOverlayQuery] Fetching road data with filters:', filters);
  
  const { selectedSubLayers, selectedWards, heatRisk, airRisk, floodRisk, multiHazardRisk, safetyRatings, safetyRatingType } = filters;
  
  if (!selectedSubLayers || selectedSubLayers.length === 0) {
    return { total_count: 0, features: [], categories: {} };
  }
  
  // Helper function to extract gridcode values from selected hazard filters
  const getHazardGridcodes = (selectedValues: string[], legendKey: string): number[] | null => {
    if (!selectedValues || selectedValues.length === 0) {
      return null;
    }
    
    const legendData = LEGEND_DATA[legendKey];
    if (!legendData) return null;
    
    const gridcodes: number[] = [];
    selectedValues.forEach(value => {
      const entry = legendData.find(e => {
        const expectedValue = `${e.label.trim()} (${e.description})`;
        return expectedValue === value;
      });
      if (entry) {
        gridcodes.push(entry.gridcode);
      }
    });
    
    return gridcodes.length > 0 ? gridcodes : null;
  };
  
  // Extract gridcode filters for each hazard type
  const heatGridcodes = getHazardGridcodes(heatRisk, 'HHI_2025');
  const airGridcodes = getHazardGridcodes(airRisk, 'Air_AQI');
  const floodGridcodes = getHazardGridcodes(floodRisk, 'Flood_Hazard');
  const multiHazardGridcodes = getHazardGridcodes(multiHazardRisk, 'Multi_Hazard_BBSR');
  
  // Map hazard types for API
  const hazardTypes: string[] = [];
  if (heatGridcodes) hazardTypes.push('HHI');
  if (airGridcodes) hazardTypes.push('AIR');
  if (floodGridcodes) hazardTypes.push('FLOOD');
  if (multiHazardGridcodes) hazardTypes.push('MULTI');
  
  // Combine all gridcodes for filtering
  const allGridcodes = new Set<number>();
  if (heatGridcodes) heatGridcodes.forEach(g => allGridcodes.add(g));
  if (airGridcodes) airGridcodes.forEach(g => allGridcodes.add(g));
  if (floodGridcodes) floodGridcodes.forEach(g => allGridcodes.add(g));
  if (multiHazardGridcodes) multiHazardGridcodes.forEach(g => allGridcodes.add(g));
  
  const gridcodes = allGridcodes.size > 0 ? Array.from(allGridcodes) : undefined;
  
  // Determine layer types (ROAD_NETWORK or ROAD_SAFETY)
  const layerTypes: string[] = [];
  const roadNetworkCategories: string[] = [];
  
  selectedSubLayers.forEach(id => {
    // Road Network categories
    if (id === 'national_highway') {
      layerTypes.push('ROAD_NETWORK');
      roadNetworkCategories.push('National Highway');
    } else if (id === 'state_highway') {
      layerTypes.push('ROAD_NETWORK');
      roadNetworkCategories.push('State Highway');
    } else if (id === 'major_road') {
      layerTypes.push('ROAD_NETWORK');
      roadNetworkCategories.push('Major Road');
    } else if (id === 'link_road') {
      layerTypes.push('ROAD_NETWORK');
      roadNetworkCategories.push('Link Road');
    }
    
    // Road Safety sublayers - only add to layerTypes (filtering done via star_rating_filters)
    if (id.startsWith('vehicle_') || id.startsWith('motorcycle_') || 
        id.startsWith('bicycle_') || id.startsWith('pedestrian_')) {
      layerTypes.push('ROAD_SAFETY');
    }
  });
  
  // Map scenario to API scenario code
  let scenarioCode = 'BASELINE';
  if (scenario) {
    if (scenario.includes('ssp1')) scenarioCode = 'SSP1';
    else if (scenario.includes('ssp2')) scenarioCode = 'SSP2';
    else if (scenario.includes('ssp5')) scenarioCode = 'SSP5';
  }
  
  // Prepare API request body
  const requestBody: any = {
    city: 1,
    year: 2025,
    layer_types: Array.from(new Set(layerTypes)),
    include_geometry: true,
    include_segments: true,
    scenario_code: scenarioCode,
    page: 1,
    page_size: 5000
  };
  
  // Add category filters - ONLY for Road Network, not Road Safety
  // Road Safety filtering is done entirely through star_rating_filters
  if (roadNetworkCategories.length > 0) {
    requestBody.categories = roadNetworkCategories;
  }
  
  // Add hazard filters
  if (hazardTypes.length > 0) {
    requestBody.hazard_types = hazardTypes;
  }
  if (gridcodes) {
    requestBody.gridcodes = gridcodes;
  }
  
  // Add ward filter if specific wards are selected
  if (selectedWards && !selectedWards.includes('all') && selectedWards.length > 0) {
    // Convert ward IDs to ward numbers (extract number from ID like "ward_23")
    const wardNumbers = selectedWards.map(wardId => {
      const match = wardId.match(/\d+/);
      return match ? parseInt(match[0]) : null;
    }).filter(n => n !== null);
    
    if (wardNumbers.length > 0) {
      requestBody.ward_codes = wardNumbers; // Send all selected wards as array
      console.log('[fetchRoadOverlayQuery] Adding ward filter:', wardNumbers);
    }
  }
  
  // Add star rating filters for Road Safety
  // Build filters from selected sublayers (e.g., "motorcycle_4star", "pedestrian_5star")
  const hasRoadSafety = layerTypes.includes('ROAD_SAFETY');
  if (hasRoadSafety && selectedSubLayers && selectedSubLayers.length > 0) {
    // Map mode to API user_type
    const userTypeMap: Record<string, string> = {
      'vehicle': 'vehicle_occupant',
      'motorcycle': 'motorcyclist',
      'bicycle': 'bicyclist',
      'pedestrian': 'pedestrian'
    };
    
    // Group selected sublayers by user type
    const filtersByUserType: Record<string, number[]> = {};
    
    selectedSubLayers.forEach(id => {
      // Check if this is a road safety sublayer (e.g., "motorcycle_4star")
      if (id.startsWith('vehicle_') || id.startsWith('motorcycle_') || 
          id.startsWith('bicycle_') || id.startsWith('pedestrian_')) {
        const parts = id.split('_');
        if (parts.length >= 2) {
          const mode = parts[0]; // vehicle, motorcycle, bicycle, or pedestrian
          const ratingStr = parts[1]; // 5star, 4star, etc.
          
          // Extract star number (e.g., "4star" -> 4)
          const match = ratingStr.match(/(\d+)star/i);
          if (match) {
            const rating = parseInt(match[1]);
            const userType = userTypeMap[mode];
            
            if (userType && rating >= 1 && rating <= 5) {
              if (!filtersByUserType[userType]) {
                filtersByUserType[userType] = [];
              }
              if (!filtersByUserType[userType].includes(rating)) {
                filtersByUserType[userType].push(rating);
              }
            }
          }
        }
      }
    });
    
    // Build star_rating_filters array
    const starRatingFilters = Object.entries(filtersByUserType).map(([user_type, ratings]) => ({
      user_type,
      ratings: ratings.sort((a, b) => b - a) // Sort descending (5, 4, 3, 2, 1)
    }));
    
    if (starRatingFilters.length > 0) {
      requestBody.star_rating_filters = starRatingFilters;
      console.log('[fetchRoadOverlayQuery] Adding star rating filters:', requestBody.star_rating_filters);
    }
  }
  
  console.log('[fetchRoadOverlayQuery] DISABLED - Old API call removed for CWIS dashboard redevelopment');
  console.log('[fetchRoadOverlayQuery] Request body (not sent):', requestBody);
  
  try {
    // REMOVED API CALL - Old dashboard version
    // const API_BASE = 'https://gvx-prod-api.greenwave-9b4a72de.centralindia.azurecontainerapps.io';
    // const credentials = btoa('admin:Admin123!');
    // const response = await fetch(
    //   `${API_BASE}/api/infrastructure/features/query-overlay/`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Basic ${credentials}`
    //     },
    //     body: JSON.stringify(requestBody)
    //   }
    // );
    // const data = await response.json();
    
    // Mock empty response for now
    const data = { features: [] };
    console.log('[fetchRoadOverlayQuery] Mock response (API disabled):', data);
    
    // Detect if this is a Road Safety query
    const isRoadSafety = hasRoadSafety && roadNetworkCategories.length === 0;
    console.log('[fetchRoadOverlayQuery] Is Road Safety query:', isRoadSafety);
    
    // Process features and group by category (Road Network) or star rating (Road Safety)
    const categorySummaries: Record<string, any> = {};
    
    // Extract selected star ratings from the request for filtering
    const selectedStarRatings = new Set<number>();
    if (requestBody.star_rating_filters) {
      requestBody.star_rating_filters.forEach((filter: any) => {
        filter.ratings?.forEach((rating: number) => selectedStarRatings.add(rating));
      });
    }
    console.log('[fetchRoadOverlayQuery] Selected star ratings:', Array.from(selectedStarRatings));
    
    // Determine active user type for Road Safety queries (needed for visibility filtering)
    let queryActiveUserType = '';
    if (isRoadSafety && requestBody.star_rating_filters && requestBody.star_rating_filters.length > 0) {
      queryActiveUserType = requestBody.star_rating_filters[0].user_type;
    }
    
    data.features?.forEach((feature: any, index: number) => {
      let groupKey: string;
      
      if (isRoadSafety) {
        // For Road Safety: group by star rating from star_ratings property
        // Log first feature properties to debug
        if (index === 0) {
          console.log('[fetchRoadOverlayQuery] First Road Safety feature properties:', feature.properties);
          console.log('[fetchRoadOverlayQuery] Available property keys:', Object.keys(feature.properties));
          console.log('[fetchRoadOverlayQuery] Star ratings object:', feature.properties.star_ratings);
        }
        
        // Determine which user type to use from selected filters
        // Map mode to API user_type
        const userTypeMap: Record<string, string> = {
          'vehicle': 'vehicle_occupant',
          'motorcycle': 'motorcyclist',
          'bicycle': 'bicyclist',
          'pedestrian': 'pedestrian'
        };
        
        // Find which user type is selected from the request body
        let activeUserType = queryActiveUserType;
        
        if (index < 3) {
          console.log(`[fetchRoadOverlayQuery] Active user type:`, activeUserType);
        }
        
        // Extract star rating from star_ratings property based on active user type
        let starRatingNum = 0;
        if (feature.properties.star_ratings && activeUserType) {
          starRatingNum = feature.properties.star_ratings[activeUserType] || 0;
        } else {
          // Fallback to old property names if star_ratings not available
          const starRating = feature.properties.irap_star_rating || 
                            feature.properties.star_rating || 
                            feature.properties.StarRating ||
                            feature.properties.rating;
          starRatingNum = typeof starRating === 'string' ? parseInt(starRating) : starRating;
        }
        
        if (index < 3) {
          console.log(`[fetchRoadOverlayQuery] Feature ${index} star rating for ${activeUserType}:`, starRatingNum, 'Type:', typeof starRatingNum);
        }
        
        // If no star ratings are selected, show all ratings (default behavior)
        // If star ratings are selected, only show matching ratings
        if (selectedStarRatings.size === 0 || (starRatingNum && selectedStarRatings.has(starRatingNum))) {
          groupKey = `${starRatingNum}-Star`;
          // Attach star rating category to feature properties for visibility filtering
          feature.properties.starRatingCategory = groupKey;
        } else {
          if (index < 3) {
            console.log(`[fetchRoadOverlayQuery] Skipping feature ${index} - starRating: ${starRatingNum}, selected: ${Array.from(selectedStarRatings)}`);
          }
          return; // Skip features with unselected star ratings
        }
      } else {
        // For Road Network: group by category
        groupKey = feature.properties.category || 'Unknown';
      }
      
      if (!categorySummaries[groupKey]) {
        categorySummaries[groupKey] = {
          category: groupKey,
          totalFeatures: 0,
          lengthByGridcode: {},
          features: []
        };
      }
      
      categorySummaries[groupKey].totalFeatures += 1;
      categorySummaries[groupKey].features.push(feature);
      
      // Aggregate length by gridcode
      if (feature.properties.length_by_gridcode) {
        Object.entries(feature.properties.length_by_gridcode).forEach(([gridcode, length]) => {
          if (!categorySummaries[groupKey].lengthByGridcode[gridcode]) {
            categorySummaries[groupKey].lengthByGridcode[gridcode] = 0;
          }
          categorySummaries[groupKey].lengthByGridcode[gridcode] += length as number;
        });
      }
    });
    
    console.log('[fetchRoadOverlayQuery] Category summaries after processing:', Object.keys(categorySummaries));
    console.log('[fetchRoadOverlayQuery] Total features processed:', data.features?.length || 0);
    
    // Sort categories for Road Safety (5-Star to 1-Star)
    let sortedCategories = categorySummaries;
    if (isRoadSafety) {
      const starOrder = ['5-Star', '4-Star', '3-Star', '2-Star', '1-Star'];
      const orderedSummaries: Record<string, any> = {};
      starOrder.forEach(starKey => {
        if (categorySummaries[starKey]) {
          orderedSummaries[starKey] = categorySummaries[starKey];
        }
      });
      sortedCategories = orderedSummaries;
      console.log('[fetchRoadOverlayQuery] Sorted Road Safety categories:', Object.keys(sortedCategories));
    }
    
    return {
      total_count: data.pagination?.total_count || data.features?.length || 0,
      features: data.features || [],
      categories: sortedCategories,
      pagination: data.pagination,
      activeUserType: queryActiveUserType // Store active user type for visibility filtering
    };
    
  } catch (error) {
    console.error('[fetchRoadOverlayQuery] Error fetching road overlay data:', error);
    return { total_count: 0, features: [], categories: {} };
  }
}

// Helper function to map hazard values to risk levels
function mapHazardValueToRiskLevel(value: number | null) {
  if (value === null) return 'N/A';
  if (value < 0.2) return 'Low';
  if (value < 0.4) return 'Moderate';
  if (value < 0.6) return 'High';
  return 'Extreme';
}