import { X, ChevronDown, ChevronRight, Check, Leaf, TrendingUp, Flame, School, Building2, Route, TreePine, Thermometer, ThermometerSun, Wind, Droplets, Car, Radio, Sun, CloudRain, Waves, AlertTriangle, Activity, Zap, LucideIcon, Bike, User, GraduationCap, BookOpen, Baby, Cross, Home, Heart, Landmark, ShieldAlert, Mail, Phone, ShoppingBag, PlayCircle, Church, Store, Plane, Bus, Fuel, Train, Network, RotateCcw, Mountain, Layers, Warehouse, CircleDot, Building, UserCircle2, Hospital, Gauge, Info, Trees, Eye, EyeOff, Camera, MapPin, Star, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import type { Sector, Scenario } from '../App';
import { InfrastructureRiskPanel } from './InfrastructureRiskPanel';
import { TourismPanel } from '../tourism/TourismPanel';
import { fetchEducationCounts } from '../utils/educationData';
import { fetchHealthcareCounts } from '../utils/healthcareData';
import { fetchPublicAmenitiesCounts } from '../utils/publicAmenitiesData';
import { fetchTransportCounts } from '../utils/transportData';

import { 
  getTotalHealthcareCount,
  getTotalPublicAmenitiesCount,
  getTotalTransportCount 
} from '../utils/infrastructureData';
import { getUILayerLegend, type LegendEntry } from '../utils/legendLoader';

interface LeftDrawerProps {
  activeSector: Sector;
  onSectorChange?: (sector: Sector) => void;
  activeLayerId: string;
  onLayerChange: (layerId: string) => void;
  onScenarioChange: (scenario: Scenario) => void;
  scenario?: Scenario;
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  activeEducationSubLayers: string[];
  setActiveEducationSubLayers: (layers: string[]) => void;
  activeHealthcareSubLayers: string[];
  setActiveHealthcareSubLayers: (layers: string[]) => void;
  activePublicAmenitiesSubLayers: string[];
  setActivePublicAmenitiesSubLayers: (layers: string[]) => void;
  activeTransportSubLayers: string[];
  setActiveTransportSubLayers: (layers: string[]) => void;
  activeRoadNetworkIRAPType: string | null;
  setActiveRoadNetworkIRAPType: (type: string | null) => void;
  activeRoadSafetySubLayers: string[];
  setActiveRoadSafetySubLayers: (layers: string[]) => void;
  roadSafetyStarRatings: Record<string, string | null>;
  setRoadSafetyStarRatings: (ratings: Record<string, string | null>) => void;
  roadSafetyStats: any;
  activeInfraLayers: string[];
  setActiveInfraLayers: (layers: string[]) => void;
  activeSubLayers: string[];
  setActiveSubLayers: (layers: string[]) => void;
  sectorOpacity: number;
  setSectorOpacity: (opacity: number) => void;
  activeBaseLayers: string[];
  setActiveBaseLayers: (layers: string[]) => void;
  selectedWard?: string;
  selectedRoadName?: string;
  currentZoom?: number;
  isQueryActive?: boolean; // NEW: Track if Query Panel is active
  isLayerLoading?: boolean; // Track if hazard layer is loading
  externalRoadSafetyExpanded?: boolean | undefined; // External control for road safety expansion
  externalInfraExpanded?: boolean | undefined; // External control for infrastructure expansion
  onZoomToStarRating?: (layerType: string, starRating: string) => Promise<void>; // Handler to zoom to filtered roads
  onResetMapView?: () => void; // Handler to reset map to home position
  activeBuildingCategories: string[];
  setActiveBuildingCategories: (categories: string[]) => void;
  activeBuildingSubcategories: string[];
  setActiveBuildingSubcategories: (subcategories: string[]) => void;
  previousBuildingCategories: string[];
  setPreviousBuildingCategories: (categories: string[]) => void;
  isEconomicVulnerabilityActive: boolean;
  setIsEconomicVulnerabilityActive: (active: boolean) => void;
  activeBuildingHeightCategories: string[];
  setActiveBuildingHeightCategories: (categories: string[]) => void;
  activeBuildingAreaCategories: string[];
  setActiveBuildingAreaCategories: (categories: string[]) => void;
  selectedLguName?: string;
  selectedWardName?: string;
  isModuleActive?: boolean; // Disable building controls when a CWIS module is open
}

// Each layer now has its own legend configuration
const sectorData = {
  heat: {
    title: 'Heat Stress',
    layers: [] as Array<{ id: string; name: string; unit: string; tooltip?: string; legend?: { classes: Array<{ label: string; color: string; importance?: string }> } }>,
  },
  air: {
    title: 'Air Pollution',
    layers: [
      { 
        id: 'air_aqi', 
        name: 'Air Quality Index (AQI)', 
        unit: 'AQI Index',
        tooltip: 'Overall air pollution severity derived from multiple harmful pollutants.',
        legend: {
          classes: [
            { label: '0-50', color: '#00B050', importance: 'Good' },
            { label: '51-100', color: '#FFFF00', importance: 'Moderate' },
            { label: '101-150', color: '#FF7E00', importance: 'Unhealthy for Sensitive Group' },
            { label: '151-200', color: '#FF0000', importance: 'Unhealthy' },
            { label: '201-300', color: '#8F3F97', importance: 'Very Unhealthy' },
            { label: '301-500', color: '#7E0023', importance: 'Hazardous' },
          ]
        }
      },
      { 
        id: 'air_no2', 
        name: 'NO₂ (Nitrogen Dioxide)', 
        unit: 'µg/m³ (Micrograms per Cubic Meter)',
        tooltip: 'Traffic-related gas that irritates lungs and worsens breathing conditions.',
        legend: {
          classes: [
            { label: '0–40', color: '#2166AC', importance: 'Good' },
            { label: '41–80', color: '#92C5DE', importance: 'Satisfactory' },
            { label: '81–180', color: '#F7FBB1', importance: 'Moderately Polluted' },
            { label: '181–280', color: '#FDD9A0', importance: 'Poor' },
            { label: '281–400', color: '#F46D43', importance: 'Very Poor' },
            { label: '401+', color: '#D73027', importance: 'Severe' },
          ]
        }
      },
      { 
        id: 'air_so2', 
        name: 'SO₂ (Sulfur Dioxide)', 
        unit: 'µg/m³',
        tooltip: 'Combustion pollutant causing respiratory irritation and throat discomfort.',
        legend: {
          classes: [
            { label: '0–40', color: '#FFFF33', importance: 'Good' },
            { label: '41–80', color: '#B2A244', importance: 'Satisfactory' },
            { label: '81–380', color: '#8C8372', importance: 'Moderately Polluted' },
            { label: '381–800', color: '#5C5C5C', importance: 'Poor' },
            { label: '801–1600', color: '#313F73', importance: 'Very Poor' },
            { label: '1601+', color: '#081D58', importance: 'Severe' },
          ]
        }
      },
      { 
        id: 'air_co', 
        name: 'CO (Carbon Monoxide)', 
        unit: 'mg/m³ (Milligrams per Cubic Meter)',
        tooltip: 'Poisonous gas from incomplete combustion that reduces oxygen in blood.',
        legend: {
          classes: [
            { label: '0–1.0', color: '#F7FBFF', importance: 'Good' },
            { label: '1.1–2.0', color: '#C6DBEF', importance: 'Satisfactory' },
            { label: '2.1–10', color: '#6BAED6', importance: 'Moderately Polluted' },
            { label: '10.1–17', color: '#9E77B4', importance: 'Poor' },
            { label: '17.1–34', color: '#7A0177', importance: 'Very Poor' },
            { label: '34.1+', color: '#4A004A', importance: 'Severe' },
          ]
        }
      },
      { 
        id: 'air_o3', 
        name: 'O₃ (Ozone)', 
        unit: 'µg/m³',
        tooltip: 'Secondary pollutant that triggers coughing and breathing discomfort, especially in heat.',
        legend: {
          classes: [
            { label: '0–50', color: '#BFE9FF', importance: 'Good' },
            { label: '51–100', color: '#73C2FF', importance: 'Satisfactory' },
            { label: '101–168', color: '#268DFF', importance: 'Moderately Polluted' },
            { label: '169–208', color: '#005EE3', importance: 'Poor' },
            { label: '209–748', color: '#0040AB', importance: 'Very Poor' },
            { label: '749+', color: '#002673', importance: 'Severe' },
          ]
        }
      },
      { 
        id: 'air_pm25', 
        name: 'PM2.5 (≤2.5 µm)', 
        unit: 'µg/m³',
        tooltip: 'Fine particles that penetrate deep into lungs and bloodstream.',
        legend: {
          classes: [
            { label: '0–30', color: '#FFFF33', importance: 'Good' },
            { label: '31–60', color: '#7FC97F', importance: 'Satisfactory' },
            { label: '61–90', color: '#1B9E77', importance: 'Moderately Polluted' },
            { label: '91–120', color: '#377EB8', importance: 'Poor' },
            { label: '121–250', color: '#4B0082', importance: 'Very Poor' },
            { label: '251+', color: '#6A3D9A', importance: 'Severe' },
          ]
        }
      },
      { 
        id: 'air_pm10', 
        name: 'PM10 (≤10 µm)', 
        unit: 'µg/m³',
        tooltip: 'Coarse particles from dust and construction affecting respiration.',
        legend: {
          classes: [
            { label: '0–50', color: '#1F78B4', importance: 'Good' },
            { label: '51–100', color: '#A6D8A6', importance: 'Satisfactory' },
            { label: '101–250', color: '#FFFF99', importance: 'Moderately Polluted' },
            { label: '251–350', color: '#FFD92F', importance: 'Poor' },
            { label: '351–430', color: '#FB9A06', importance: 'Very Poor' },
            { label: '431+', color: '#E31A1C', importance: 'Severe' },
          ]
        }
      },
    ],
  },
  flood: {
    title: 'Flood',
    layers: [], // layers rendered via Flood Hazard accordion group below
  },
  multihazard: {
    title: 'Multi Hazard',
    layers: [
      { 
        id: 'multihazard_assessment', 
        name: 'Multi Hazard Assessment', 
        unit: 'Combined Risk Score',
        tooltip: 'Shows areas where heat, flood, and air pollution hazards overlap.',
        legend: {
          classes: [
            { label: 'Low', color: '#1A9850', importance: 'Minimal Impact' },
            { label: 'Moderate', color: '#91CF60', importance: 'Manageable Impact' },
            { label: 'High', color: '#F46D43', importance: 'Significant Impact' },
            { label: 'Very High', color: '#D73027', importance: 'Severe Impact' },
          ]
        }
      },
    ],
  },
  roadsafety: {
    title: 'Road Safety',
    layers: [] // Road safety doesn't use hazard layers
  },
  road_old: { // Keep old road config for reference
    title: 'Road Safety Assessment - Old',
    layers: [
      { 
        id: 'road_vehicle', 
        name: 'Vehicle Rating', 
        unit: 'Star Rating (1-5 stars)',
        legend: {
          classes: [
            { label: '★★★★★', color: '#66BB6A', importance: 'Excellent' },
            { label: '★★★★☆', color: '#A3E635', importance: 'Good' },
            { label: '★★★☆☆', color: '#FFEE58', importance: 'Fair' },
            { label: '★★☆☆☆', color: '#FFA726', importance: 'Poor' },
            { label: '★☆☆☆☆', color: '#EF5350', importance: 'Critical' },
          ]
        }
      },
      { 
        id: 'road_motorcycle', 
        name: 'Motorcycle Rating', 
        unit: 'Star Rating (1-5 stars)',
        legend: {
          classes: [
            { label: '★★★★★', color: '#66BB6A', importance: 'Excellent' },
            { label: '★★★★☆', color: '#A3E635', importance: 'Good' },
            { label: '★★★☆☆', color: '#FFEE58', importance: 'Fair' },
            { label: '★★☆☆☆', color: '#FFA726', importance: 'Poor' },
            { label: '★☆☆☆☆', color: '#EF5350', importance: 'Critical' },
          ]
        }
      },
      { 
        id: 'road_bicycle', 
        name: 'Bicycle Rating', 
        unit: 'Star Rating (1-5 stars)',
        legend: {
          classes: [
            { label: '★★★★★', color: '#66BB6A', importance: 'Excellent' },
            { label: '★★★★☆', color: '#A3E635', importance: 'Good' },
            { label: '★★★☆☆', color: '#FFEE58', importance: 'Fair' },
            { label: '★★☆☆☆', color: '#FFA726', importance: 'Poor' },
            { label: '★☆☆☆☆', color: '#EF5350', importance: 'Critical' },
          ]
        }
      },
      { 
        id: 'road_pedestrian', 
        name: 'Pedestrian Rating', 
        unit: 'Star Rating (1-5 stars)',
        legend: {
          classes: [
            { label: '★★★★★', color: '#66BB6A', importance: 'Excellent' },
            { label: '★★★★☆', color: '#A3E635', importance: 'Good' },
            { label: '★★★☆☆', color: '#FFEE58', importance: 'Fair' },
            { label: '★★☆☆☆', color: '#FFA726', importance: 'Poor' },
            { label: '★☆☆☆☆', color: '#EF5350', importance: 'Critical' },
          ]
        }
      },
    ],
  },
  realtime: {
    title: 'Real-Time Data',
    layers: [
      { id: 'realtime_weather', name: 'Current Weather (IMD)', unit: 'Live conditions' },
      { id: 'realtime_forecast', name: 'Weather Forecast', unit: '24h + 7-day' },
      { id: 'realtime_alerts', name: 'Active Alerts', unit: 'IMD alerts' },
    ],
  },
  infra: {
    title: 'Combined Infrastructure Risk',
    layers: [
      { id: 'infra_damage', name: 'Multi-Hazard Composite Risk', unit: 'Combined exposure score' },
    ],
  }
};

const LEGEND_STRIP_CLASS = "mt-1.5 px-2 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md";
const LEGEND_LABEL_CLASS = "text-[9px] text-[#64748B] font-medium flex-shrink-0";

export function LeftDrawer({ 
  activeSector, 
  onSectorChange,
  activeLayerId, 
  onLayerChange, 
  onScenarioChange,
  scenario = 'baseline_2025',
  isOpen, 
  onClose, 
  collapsed = false,
  onToggleCollapse,
  activeEducationSubLayers, 
  setActiveEducationSubLayers, 
  activeHealthcareSubLayers, 
  setActiveHealthcareSubLayers, 
  activePublicAmenitiesSubLayers, 
  setActivePublicAmenitiesSubLayers, 
  activeTransportSubLayers, 
  setActiveTransportSubLayers, 
  activeRoadNetworkIRAPType, 
  setActiveRoadNetworkIRAPType,
  activeRoadSafetySubLayers,
  setActiveRoadSafetySubLayers,
  roadSafetyStarRatings,
  setRoadSafetyStarRatings,
  roadSafetyStats,
  activeInfraLayers,
  setActiveInfraLayers,
  activeSubLayers,
  setActiveSubLayers,
  sectorOpacity,
  setSectorOpacity,
  activeBaseLayers,
  setActiveBaseLayers,
  selectedWard,
  selectedRoadName = 'all',
  currentZoom,
  isQueryActive = false,
  isLayerLoading = false,
  externalRoadSafetyExpanded,
  externalInfraExpanded,
  onZoomToStarRating,
  onResetMapView,
  activeBuildingCategories,
  setActiveBuildingCategories,
  activeBuildingSubcategories,
  setActiveBuildingSubcategories,
  previousBuildingCategories,
  setPreviousBuildingCategories,
  isEconomicVulnerabilityActive,
  setIsEconomicVulnerabilityActive,
  activeBuildingHeightCategories,
  setActiveBuildingHeightCategories,
  activeBuildingAreaCategories,
  setActiveBuildingAreaCategories,
  selectedLguName,
  selectedWardName,
  isModuleActive = false,
}: LeftDrawerProps) {
  // Helper function to get dynamic legend from legendDefinitions.ts
  const getDynamicLegend = (layerId: string): { colors: string[]; minLabel: string; maxLabel: string } | null => {
    try {
      const legendEntries = getUILayerLegend(layerId, scenario);
      if (legendEntries.length > 0) {
        return {
          colors: legendEntries.map(entry => entry.color),
          minLabel: legendEntries[0].label,
          maxLabel: legendEntries[legendEntries.length - 1].label
        };
      }
    } catch (error) {
      console.warn('Could not load legend for', layerId, error);
    }
    return null;
  };

  const [buildingHeightLayerExpanded, setBuildingHeightLayerExpanded] = useState(false);
  const [buildingAreaLayerExpanded, setBuildingAreaLayerExpanded] = useState(false);

  const buildingFloorAreaCategories = [
    { id: 'small',      name: 'Small',      range: '<50 m²',          color: '#93C5FD', desc: 'Compact / informal' },
    { id: 'medium',     name: 'Medium',     range: '50–200 m²',       color: '#6EE7B7', desc: 'Typical residential / commercial' },
    { id: 'large',      name: 'Large',      range: '200–1,000 m²',    color: '#FDE68A', desc: 'Mid scale commercial / institutions' },
    { id: 'very_large', name: 'Very Large', range: '>1,000 m²',       color: '#F9A8D4', desc: 'Major facilities' },
  ];

  const buildingHeightCategories = [
    { id: 'low_rise',       name: 'Low Rise',       floors: '1–2',  color: '#6EE7B7', type: 'Low Generator' },
    { id: 'mid_rise',       name: 'Mid Rise',       floors: '3–4',  color: '#FCD34D', type: 'Moderate Generator' },
    { id: 'high_rise',      name: 'High Rise',      floors: '5–7',  color: '#FB923C', type: 'High Generator' },
    { id: 'very_high_rise', name: 'Very High Rise', floors: '≥8',   color: '#F87171', type: 'Bulk Generator' },
  ];

  const handleHeightSublayerClick = (catId: string) => {
    const allActive = buildingHeightCategories.every(c => activeBuildingHeightCategories.includes(c.id));
    if (allActive) {
      // Isolate this sublayer
      setActiveBuildingHeightCategories([catId]);
    } else {
      const next = activeBuildingHeightCategories.includes(catId)
        ? activeBuildingHeightCategories.filter(id => id !== catId)
        : [...activeBuildingHeightCategories, catId];
      setActiveBuildingHeightCategories(next);
      if (next.length === 0) setBuildingHeightLayerExpanded(false);
    }
  };

  const handleAreaSublayerClick = (catId: string) => {
    const allActive = buildingFloorAreaCategories.every(c => activeBuildingAreaCategories.includes(c.id));
    if (allActive) {
      // Isolate this sublayer
      setActiveBuildingAreaCategories([catId]);
    } else {
      const next = activeBuildingAreaCategories.includes(catId)
        ? activeBuildingAreaCategories.filter(id => id !== catId)
        : [...activeBuildingAreaCategories, catId];
      setActiveBuildingAreaCategories(next);
      if (next.length === 0) setBuildingAreaLayerExpanded(false);
    }
  };

  const [selectedScenario, setSelectedScenario] = useState('baseline_2025');
  const [scenarioDropdownOpen, setScenarioDropdownOpen] = useState(false);
  const [environmentalExpanded, setEnvironmentalExpanded] = useState(true); // Environmental Sensitivity Layers expanded by default
  const [gwInfiltrationExpanded, setGwInfiltrationExpanded] = useState(false); // Ground Water Infiltration sub-group
  const [floodHazardExpanded, setFloodHazardExpanded] = useState(false); // Flood Hazard sub-group
  const [heatStressExpanded, setHeatStressExpanded] = useState(false); // Heat Stress sub-group
  const [infraExpanded, setInfraExpanded] = useState(true); // Infrastructure expanded by default
  const [roadSafetyExpanded, setRoadSafetyExpanded] = useState(false); // Main Road Safety section collapse state
  // Track which road safety layer is expanded to show star ratings (individual accordion states)
  const [roadSafetyLayerExpanded, setRoadSafetyLayerExpanded] = useState<Record<string, boolean>>({
    irap_vehicle: false,
    irap_motorcycle: false,
    irap_bicycle: false,
    irap_pedestrian: false
  });
  const [scenarioExpanded, setScenarioExpanded] = useState(false);
  const [dataLayersExpanded, setDataLayersExpanded] = useState(true);
  const [climateHazardsExpanded, setClimateHazardsExpanded] = useState(true);
  const [baseLayersExpanded, setBaseLayersExpanded] = useState(false);
  const [buildingUseExpanded, setBuildingUseExpanded] = useState(true); // Building Layers section expanded by default
  const [buildingUseLayerExpanded, setBuildingUseLayerExpanded] = useState(true); // Building Use layer expanded by default (on)
  const [expandedBuildingCategories, setExpandedBuildingCategories] = useState<string[]>([]); // Track which building categories are expanded
  const [useSubCounts, setUseSubCounts] = useState<Record<string, number>>({}); // Live counts per use_sub value
  const [roadNetworkLegendExpanded, setRoadNetworkLegendExpanded] = useState(false);
  const [educationCounts, setEducationCounts] = useState<Record<string, number>>({});
  const [healthcareCounts, setHealthcareCounts] = useState<Record<string, number>>({});
  const [publicAmenitiesCounts, setPublicAmenitiesCounts] = useState<Record<string, number>>({});
  const [transportCounts, setTransportCounts] = useState<Record<string, number>>({});
  const [publicAmenitiesCount, setPublicAmenitiesCount] = useState<number>(0);
  const [transportCount, setTransportCount] = useState<number>(0);
  const [roadSafetyLengths, setRoadSafetyLengths] = useState<Record<string, number>>({
    irap_vehicle: 0,
    irap_motorcycle: 0,
    irap_bicycle: 0,
    irap_pedestrian: 0,
  });
  
  // Fetch live use_sub counts from GeoServer WFS whenever admin filter changes
  useEffect(() => {
    const ALL_SUBS = [
      // Residential
      'Other Residential', 'Condominium / Apartment', 'Subdivision / Gated Society',
      // Commercial
      'Food & Beverage', 'Hospitality & Accommodation', 'Offices & Services',
      'Other Commercial', 'Retail & Shopping', 'Entertainment & Recreation',
      'Public Markets', 'Commercial Utilities',
      // Education
      'Elementary Education', 'Secondary Education', 'Technical & Vocational Training',
      'Colleges & Universities',
      // Government
      'Government Administrative Offices',
      'Emergency Services - Police', 'Emergency Services - Fire',
      // Health
      'Pharmacies & Drugstores', 'Clinics & Outpatient Care', 'Hospitals',
      // Industrial
      'Fuel & Energy', 'Warehouses & Storage', 'Food Processing',
      // Religious
      'Place of Worship',
      // Transport
      'Bus Terminals', 'Transport Infrastructure',
    ];

    const adminPart =
      selectedWardName && selectedWardName !== 'all'
        ? `BrgyName='${selectedWardName.replace(/'/g, "''")}'`
        : selectedLguName && selectedLguName !== 'all'
        ? `MunName='${selectedLguName.replace(/'/g, "''")}'`
        : '';

    const wfsUrl = 'https://geoserver.azure.innpact.ai/geoserver/WorldBank_Bohol/ows';

    Promise.all(
      ALL_SUBS.map(async (sub) => {
        const cql = adminPart
          ? `use_sub='${sub.replace(/'/g, "''")}' AND ${adminPart}`
          : `use_sub='${sub.replace(/'/g, "''")}'`;
        const params = new URLSearchParams({
          service: 'WFS', version: '2.0.0', request: 'GetFeature',
          typeName: 'WorldBank_Bohol:Buildings', resultType: 'hits',
          CQL_FILTER: cql,
        });
        try {
          const res = await fetch(`${wfsUrl}?${params.toString()}`);
          const text = await res.text();
          const match = text.match(/numberMatched="(\d+)"/);
          return [sub, match ? parseInt(match[1], 10) : 0] as [string, number];
        } catch {
          return [sub, 0] as [string, number];
        }
      })
    ).then((entries) => {
      setUseSubCounts(Object.fromEntries(entries));
    });
  }, [selectedLguName, selectedWardName]);

  const data = sectorData[activeSector];
  
  const activeLayer = data?.layers?.find(l => l.id === activeLayerId);

  // Debug: Log when activeInfraLayers changes
  React.useEffect(() => {
    console.log('🔍 [LeftDrawer] activeInfraLayers changed:', activeInfraLayers);
  }, [activeInfraLayers]);

  // Update activeSubLayers when activeLayerId changes (for legend panel)
  React.useEffect(() => {
    if (activeLayerId) {
      setActiveSubLayers([activeLayerId]);
    } else {
      setActiveSubLayers([]);
    }
  }, [activeLayerId, setActiveSubLayers]);

  // Fetch education counts when ward changes
  useEffect(() => {
    const loadEducationCounts = async () => {
      const counts = await fetchEducationCounts(selectedWard);
      setEducationCounts(counts);
    };
    loadEducationCounts();
  }, [selectedWard]);

  // Fetch healthcare counts when ward changes
  useEffect(() => {
    const loadHealthcareCounts = async () => {
      const counts = await fetchHealthcareCounts(selectedWard);
      setHealthcareCounts(counts);
    };
    loadHealthcareCounts();
  }, [selectedWard]);

  // Fetch public amenities counts when ward changes
  useEffect(() => {
    const loadPublicAmenitiesCounts = async () => {
      const counts = await fetchPublicAmenitiesCounts(selectedWard);
      setPublicAmenitiesCounts(counts);
    };
    loadPublicAmenitiesCounts();
  }, [selectedWard]);

  // Fetch transport counts when ward changes
  useEffect(() => {
    const loadTransportCounts = async () => {
      const counts = await fetchTransportCounts(selectedWard);
      setTransportCounts(counts);
    };
    loadTransportCounts();
  }, [selectedWard]);

  // Fetch road safety lengths when ward or road name changes
  useEffect(() => {
    const loadRoadSafetyLengths = async () => {
      const lengths = await fetchRoadSafetyLengths(selectedWard, selectedRoadName);
      setRoadSafetyLengths(lengths);
    };
    loadRoadSafetyLengths();
  }, [selectedWard, selectedRoadName]);

  // Sync external road safety expanded state from tutorial
  useEffect(() => {
    if (externalRoadSafetyExpanded !== undefined) {
      setRoadSafetyExpanded(externalRoadSafetyExpanded);
    }
  }, [externalRoadSafetyExpanded]);

  // Sync external infrastructure expanded state from tutorial
  useEffect(() => {
    if (externalInfraExpanded !== undefined) {
      setInfraExpanded(externalInfraExpanded);
    }
  }, [externalInfraExpanded]);

  // Ensure Climate Hazard Layers section is expanded when switching to flood sector
  useEffect(() => {
    if (activeSector === 'flood') {
      setDataLayersExpanded(true);
      setFloodHazardExpanded(true);
    }
  }, [activeSector]);

  // Set Road Safety Assessment default state when switching to Road Safety main panel
  useEffect(() => {
    if (activeSector === 'roadsafety') {
      // Reset to defaults when entering Road Safety main panel
      // Note: The STRICT RULE useEffect below will handle the accordion expansion
      // We just need to ensure the section is expanded
      setRoadSafetyExpanded(true);
      console.log('🔄 [LeftDrawer] Road Safety main panel: Section expanded (accordion will be handled by STRICT RULE)');
    } else {
      // For other hazard panels (Heat, Air, Flood, Multi-Hazard)
      // The STRICT RULE useEffect will auto-expand if there are active layers
      // Here we just handle the section collapse when no active layers
      if (activeRoadSafetySubLayers.length === 0) {
        setRoadSafetyExpanded(prev => {
          if (prev === true) {
            console.log('🔄 [LeftDrawer] Switching from Road Safety to other hazard panel: Collapse Road Safety Assessment section');
            return false;
          }
          return prev;
        });
      }
    }
  }, [activeSector, activeRoadSafetySubLayers]);

  // STRICT RULE: Sync accordion expansion with layer active state
  // Rule: If layer is active on map → section AND accordion MUST be expanded
  //       If layer is NOT active → accordion MUST be collapsed
  useEffect(() => {
    if (activeRoadSafetySubLayers.length > 0) {
      const activeLayerId = activeRoadSafetySubLayers[0];
      
      // Ensure Road Safety Assessment section is expanded when any layer is active
      setRoadSafetyExpanded(true);
      
      // Ensure the active layer's accordion is expanded
      setRoadSafetyLayerExpanded(prev => {
        // Collapse all except the active one
        const newState: Record<string, boolean> = {
          irap_vehicle: activeLayerId === 'irap_vehicle',
          irap_motorcycle: activeLayerId === 'irap_motorcycle',
          irap_bicycle: activeLayerId === 'irap_bicycle',
          irap_pedestrian: activeLayerId === 'irap_pedestrian'
        };
        
        console.log(`📋 [LeftDrawer] STRICT RULE: Layer ${activeLayerId} is active → Expanding section and accordion`);
        return newState;
      });
    } else {
      // No active layers - collapse all accordions
      setRoadSafetyLayerExpanded({
        irap_vehicle: false,
        irap_motorcycle: false,
        irap_bicycle: false,
        irap_pedestrian: false
      });
      console.log('📋 [LeftDrawer] STRICT RULE: No active layers → Collapsing all accordions');
    }
  }, [activeRoadSafetySubLayers]);

  // Calculate infrastructure counts when ward changes
  useEffect(() => {
    const amenitiesCount = getTotalPublicAmenitiesCount(selectedWard);
    const transportInfraCount = getTotalTransportCount(selectedWard);
    
    setPublicAmenitiesCount(amenitiesCount);
    setTransportCount(transportInfraCount);
  }, [selectedWard]);

  // Function to get icon for each layer
  const getLayerIcon = (layerId: string): LucideIcon => {
    // CWIS Hazard Layer icons
    if (layerId === 'flood_hazard') return CloudRain;
    if (layerId === 'storm_surge') return Waves;
    if (layerId === 'urban_waterlogging') return Droplets;
    if (layerId === 'land_surface_temperature') return Thermometer;
    if (layerId === 'urban_heat_island') return ThermometerSun;
    if (layerId === 'wet_bulb_temperature') return Gauge;
    
    // Environmental Sensitivity Layer icons
    if (layerId === 'soil_classification') return Mountain;
    if (layerId === 'groundwater_depth') return Droplets;
    if (layerId === 'geology') return Layers;
    if (layerId === 'sinkhole') return AlertTriangle;
    
    // Heat Stress icons (legacy - kept for backwards compatibility)
    if (layerId.includes('heat_hhi')) return Flame;
    if (layerId.includes('heat_lst')) return Sun;
    if (layerId.includes('heat_ast')) return Thermometer;
    if (layerId.includes('heat_rh')) return Droplets;
    if (layerId.includes('heat_wbgt')) return Gauge;
    if (layerId.includes('heat_wbt')) return ThermometerSun;
    if (layerId.includes('heat_uhi')) return Flame;
    
    // Air Pollution icons
    if (layerId.includes('air')) return Wind;
    
    // Flood icons
    if (layerId.includes('flood')) return Waves;
    
    // Multi Hazard icons
    if (layerId.includes('multihazard')) return AlertTriangle;
    
    // Road Safety icons
    if (layerId.includes('road_vehicle')) return Car;
    if (layerId.includes('road_motorcycle')) return Bike;
    if (layerId.includes('road_bicycle')) return Bike;
    if (layerId.includes('road_pedestrian')) return User;
    
    // Real-Time Data icons
    if (layerId.includes('realtime_weather')) return Activity;
    if (layerId.includes('realtime_forecast')) return Activity;
    if (layerId.includes('realtime_alerts')) return AlertTriangle;
    
    // Infrastructure Risk icons
    if (layerId.includes('infra_damage')) return AlertTriangle;
    
    // Default icon
    return MapPin;
  };

  // Infrastructure overlay layers with actual counts
  const totalEducationCount = Object.values(educationCounts).reduce((sum, count) => sum + count, 0);
  const totalHealthcareCount = Object.values(healthcareCounts).reduce((sum, count) => sum + count, 0);
  const totalPublicAmenitiesCount = Object.values(publicAmenitiesCounts).reduce((sum, count) => sum + count, 0);
  const totalTransportCount = Object.values(transportCounts).reduce((sum, count) => sum + count, 0);
  
  // Environmental Sensitivity Layers - Matching Climate Hazard Layers pattern
  const environmentalLayers = [
    { 
      id: 'soil_classification', 
      name: 'Soil Classification', 
      unit: 'Soil Type',
      tooltip: 'Classification of soil types affecting sanitation infrastructure.',
      legend: {
        type: 'categorical',
        classes: [
          { label: 'Beach Sand', color: '#F5DEB3' },
          { label: 'Bolinao Clay', color: '#D2B48C' },
          { label: 'Faroan Clay', color: '#A0826D' },
          { label: 'Hydrosol', color: '#87CEEB' }
        ]
      }
    },
    { 
      id: 'groundwater_depth', 
      name: 'Groundwater Depth', 
      unit: 'Depth (m)',
      tooltip: 'Depth to groundwater table affecting septic systems and contamination risk.',
      legend: {
        type: 'categorical',
        classes: [
          { label: '0 – 2 m', color: '#8B4513' },
          { label: '2 – 5 m', color: '#D2B48C' },
          { label: '5 – 10 m', color: '#F5DEB3' },
          { label: '10 – 25 m', color: '#B8D4C8' },
          { label: '> 25 m', color: '#5F9EA0' }
        ]
      }
    },
    { 
      id: 'geology', 
      name: 'Geology', 
      unit: 'Geological Type',
      tooltip: 'Geological formations influencing sanitation infrastructure design.',
      legend: {
        type: 'categorical',
        classes: [
          { label: 'Alluvium', color: '#6B7D8C' },
          { label: 'Maribojoc Limestone', color: '#C9A876' }
        ]
      }
    },
    { 
      id: 'sinkhole', 
      name: 'Sinkhole', 
      unit: 'Risk Level',
      tooltip: 'Areas vulnerable to sinkhole formation affecting infrastructure safety.'
    }
  ];

  const infrastructureLayers = [
    // Environmental Sensitivity Layers removed - now separate section like Climate Hazard Layers
  ];

  // Base Layers
  const baseLayers = [
    { 
      id: 'municipal_boundary', 
      name: 'Municipal Boundary', 
      icon: MapPin, 
      color: '#374151'
    },
    { 
      id: 'ward_boundary', 
      name: 'Barangay Boundary', 
      icon: MapPin, 
      color: '#4B5563'
    },
    { 
      id: 'road_network_base', 
      name: 'Road Network', 
      icon: Route, 
      color: '#3B82F6',
      legend: {
        classes: [
          { label: 'National Highway (NH)', color: '#EF4444', width: 4, km: '156 km' },
          { label: 'State Highway (SH)', color: '#F59E0B', width: 3, km: '284 km' },
          { label: 'Major Roads', color: '#3B82F6', width: 2.5, km: '432 km' },
          { label: 'Link Roads', color: '#94A3B8', width: 2, km: '368 km' },
        ]
      }
    },
    { 
      id: 'ndvi', 
      name: 'Green Cover (NDVI)', 
      icon: Trees, 
      color: '#16A34A'
    },
    { 
      id: 'buildings', 
      name: 'Buildings', 
      icon: Building, 
      color: '#6B7280'
    },
  ];

  // Building Use Categories (matching MapCanvas building layer styling)
  // Categories and subcategories derived from use_type / use_sub fields on WorldBank_Bohol:Buildings
  const buildingUseCategories = [
    { 
      id: 'residential', 
      name: 'Residential', 
      icon: Home, 
      color: '#EAB308',
      subcategories: [
        'Other Residential',
        'Subdivision / Gated Society',
        'Condominium / Apartment',
      ]
    },
    { 
      id: 'commercial', 
      name: 'Commercial Establishments', 
      icon: ShoppingBag, 
      color: '#3B82F6',
      subcategories: [
        'Other Commercial',
        'Hospitality & Accommodation',
        'Food & Beverage',
        'Retail & Shopping',
        'Offices & Services',
        'Entertainment & Recreation',
        'Public Markets',
        'Commercial Utilities',
        'Subdivision / Gated Society',
      ]
    },
    { 
      id: 'education', 
      name: 'Educational Institutions', 
      icon: GraduationCap, 
      color: '#06B6D4',
      subcategories: [
        'Elementary Education',
        'Secondary Education',
        'Colleges & Universities',
        'Technical & Vocational Training',
      ]
    },
    { 
      id: 'government', 
      name: 'Government & Civic Services', 
      icon: Landmark, 
      color: '#10B981',
      subcategories: [
        'Government Administrative Offices',
        'Emergency Services - Police',
        'Emergency Services - Fire',
      ]
    },
    { 
      id: 'health', 
      name: 'Health Facilities', 
      icon: Heart, 
      color: '#EF4444',
      subcategories: [
        'Pharmacies & Drugstores',
        'Clinics & Outpatient Care',
        'Hospitals',
      ]
    },
    { 
      id: 'religious', 
      name: 'Religious Places', 
      icon: Church, 
      color: '#F97316',
      subcategories: [
        'Place of Worship',
      ]
    },
    {
      id: 'industrial',
      name: 'Industrial',
      icon: Landmark,
      color: '#94A3B8',
      subcategories: [
        'Warehouses & Storage',
        'Fuel & Energy',
        'Food Processing',
      ]
    },
    {
      id: 'transport',
      name: 'Transport & Logistics',
      icon: Landmark,
      color: '#7C3AED',
      subcategories: [
        'Bus Terminals',
        'Transport Infrastructure',
      ]
    },
  ];

  const toggleInfraLayer = (layerId: string) => {
    if (activeInfraLayers.includes(layerId)) {
      // Deactivate the current layer
      setActiveInfraLayers(activeInfraLayers.filter(id => id !== layerId));
      // Clear road safety sub-layers if deactivating road_safety
      if (layerId === 'road_safety') {
        setActiveRoadSafetySubLayers([]);
        setActiveRoadNetworkIRAPType(null);
      }
      // Clear education sub-layers if deactivating educational
      if (layerId === 'educational') {
        setActiveEducationSubLayers([]);
      }
      // Clear healthcare sub-layers if deactivating healthcare
      if (layerId === 'healthcare') {
        setActiveHealthcareSubLayers([]);
      }
      // Clear public amenities sub-layers if deactivating public_amenities
      if (layerId === 'public_amenities') {
        setActivePublicAmenitiesSubLayers([]);
      }
      // Clear transport sub-layers if deactivating transport_mobility
      if (layerId === 'transport_mobility') {
        setActiveTransportSubLayers([]);
      }
    } else {
      // Activate the layer
      setActiveInfraLayers([...activeInfraLayers, layerId]);
      // Keep education sub-layers empty by default - all points will be shown
      if (layerId === 'educational') {
        setActiveEducationSubLayers([]);
      }
    }
  };

  const toggleEducationSubLayer = (subLayerId: string) => {
    setActiveEducationSubLayers(prev =>
      prev.includes(subLayerId)
        ? prev.filter(id => id !== subLayerId)
        : [...prev, subLayerId]
    );
  };

  const toggleHealthcareSubLayer = (subLayerId: string) => {
    setActiveHealthcareSubLayers(prev =>
      prev.includes(subLayerId)
        ? prev.filter(id => id !== subLayerId)
        : [...prev, subLayerId]
    );
  };

  const togglePublicAmenitiesSubLayer = (subLayerId: string) => {
    setActivePublicAmenitiesSubLayers(prev =>
      prev.includes(subLayerId)
        ? prev.filter(id => id !== subLayerId)
        : [...prev, subLayerId]
    );
  };

  const toggleTransportSubLayer = (subLayerId: string) => {
    setActiveTransportSubLayers(prev =>
      prev.includes(subLayerId)
        ? prev.filter(id => id !== subLayerId)
        : [...prev, subLayerId]
    );
  };

  const resetAllInfrastructureLayers = () => {
    // Reset infrastructure layers but keep road_safety separate
    setActiveInfraLayers(activeInfraLayers.filter(id => id === 'road_safety'));
    setActiveEducationSubLayers([]);
    setActiveHealthcareSubLayers([]);
    setActivePublicAmenitiesSubLayers([]);
    setActiveTransportSubLayers([]);
    // Don't reset road safety layers - they are independent
  };

  const resetAllRoadSafetyLayers = () => {
    setActiveRoadSafetySubLayers([]);
    setActiveRoadNetworkIRAPType(null);
    // Clear all star rating filters
    setRoadSafetyStarRatings({
      irap_vehicle: null,
      irap_motorcycle: null,
      irap_bicycle: null,
      irap_pedestrian: null
    });
    setActiveInfraLayers(activeInfraLayers.filter(id => id !== 'road_safety'));
    // Turn back on the road network base layer
    if (!activeBaseLayers.includes('road_network_base')) {
      setActiveBaseLayers([...activeBaseLayers, 'road_network_base']);
    }
  };

  // Educational institution sub-categories with actual counts
  // Show 0 for unselected categories ONLY when query filters are active from Query Panel
  const educationSubCategories = [
    { id: 'university', label: 'Universities', count: (isQueryActive && activeEducationSubLayers.length > 0 && !activeEducationSubLayers.includes('university')) ? 0 : (educationCounts['university'] || 0), icon: GraduationCap },
    { id: 'college', label: 'Colleges', count: (isQueryActive && activeEducationSubLayers.length > 0 && !activeEducationSubLayers.includes('college')) ? 0 : (educationCounts['college'] || 0), icon: BookOpen },
    { id: 'school', label: 'Schools', count: (isQueryActive && activeEducationSubLayers.length > 0 && !activeEducationSubLayers.includes('school')) ? 0 : (educationCounts['school'] || 0), icon: School },
    { id: 'anganwadi', label: 'Anganwadis', count: (isQueryActive && activeEducationSubLayers.length > 0 && !activeEducationSubLayers.includes('anganwadi')) ? 0 : (educationCounts['anganwadi'] || educationCounts['anganwadis'] || 0), icon: Baby },
  ];

  // Healthcare facility sub-categories with actual counts
  // Actual categories from GeoServer: "Hospital" (32), "Health Centre" (19), "Nursing Home" (9)
  // Show 0 for unselected categories ONLY when query filters are active from Query Panel
  const healthcareSubCategories = [
    { id: 'hospital', label: 'Hospitals', count: (isQueryActive && activeHealthcareSubLayers.length > 0 && !activeHealthcareSubLayers.includes('hospital')) ? 0 : (healthcareCounts['hospital'] || 0), icon: Hospital },
    { id: 'health_centre', label: 'Health Centres', count: (isQueryActive && activeHealthcareSubLayers.length > 0 && !activeHealthcareSubLayers.includes('health_centre')) ? 0 : (healthcareCounts['health centre'] || 0), icon: Heart },
    { id: 'nursing_home', label: 'Nursing Homes', count: (isQueryActive && activeHealthcareSubLayers.length > 0 && !activeHealthcareSubLayers.includes('nursing_home')) ? 0 : (healthcareCounts['nursing home'] || 0), icon: Home },
  ];

  // Public amenities sub-categories with actual counts
  // The counts come from GeoServer with lowercase category names
  // Actual categories from GeoServer: Community Centre, Culture Centre, Fire Station, Government Buildings, 
  // Haat/ Market, Park, Petrol Pump, Playground/Stadium, Police Outpost, Religious, Telephone Exchange, Vending Zones
  // Show 0 for unselected categories ONLY when query filters are active from Query Panel
  const publicAmenitiesSubCategories = [
    { id: 'community_centre', label: 'Community Centres', count: (isQueryActive && activePublicAmenitiesSubLayers.length > 0 && !activePublicAmenitiesSubLayers.includes('community_centre')) ? 0 : (publicAmenitiesCounts['community centre'] || 0), icon: UserCircle2 },
    { id: 'culture_centre', label: 'Culture Centres', count: (isQueryActive && activePublicAmenitiesSubLayers.length > 0 && !activePublicAmenitiesSubLayers.includes('culture_centre')) ? 0 : (publicAmenitiesCounts['culture centre'] || 0), icon: Landmark },
    { id: 'fire_station', label: 'Fire Stations', count: (isQueryActive && activePublicAmenitiesSubLayers.length > 0 && !activePublicAmenitiesSubLayers.includes('fire_station')) ? 0 : (publicAmenitiesCounts['fire station'] || 0), icon: Flame },
    { id: 'government_buildings', label: 'Government Buildings', count: (isQueryActive && activePublicAmenitiesSubLayers.length > 0 && !activePublicAmenitiesSubLayers.includes('government_buildings')) ? 0 : (publicAmenitiesCounts['government buildings'] || 0), icon: Building },
    { id: 'park', label: 'Parks', count: (isQueryActive && activePublicAmenitiesSubLayers.length > 0 && !activePublicAmenitiesSubLayers.includes('park')) ? 0 : (publicAmenitiesCounts['park'] || 0), icon: TreePine },
    { id: 'petrol_pump', label: 'Petrol Pump', count: (isQueryActive && activePublicAmenitiesSubLayers.length > 0 && !activePublicAmenitiesSubLayers.includes('petrol_pump')) ? 0 : (publicAmenitiesCounts['petrol pump'] || 0), icon: Fuel },
    { id: 'playground_stadium', label: 'Playgrounds/Stadiums', count: (isQueryActive && activePublicAmenitiesSubLayers.length > 0 && !activePublicAmenitiesSubLayers.includes('playground_stadium')) ? 0 : (publicAmenitiesCounts['playground/stadium'] || 0), icon: PlayCircle },
    { id: 'police_outpost', label: 'Police Outposts', count: (isQueryActive && activePublicAmenitiesSubLayers.length > 0 && !activePublicAmenitiesSubLayers.includes('police_outpost')) ? 0 : (publicAmenitiesCounts['police outpost'] || 0), icon: ShieldAlert },
    { id: 'religious', label: 'Religious Sites', count: (isQueryActive && activePublicAmenitiesSubLayers.length > 0 && !activePublicAmenitiesSubLayers.includes('religious')) ? 0 : (publicAmenitiesCounts['religious'] || 0), icon: Church },
    { id: 'telephone_exchange', label: 'Telephone Exchanges', count: (isQueryActive && activePublicAmenitiesSubLayers.length > 0 && !activePublicAmenitiesSubLayers.includes('telephone_exchange')) ? 0 : (publicAmenitiesCounts['telephone exchange'] || 0), icon: Phone },
    { id: 'haat_market', label: 'Haats/Markets', count: (isQueryActive && activePublicAmenitiesSubLayers.length > 0 && !activePublicAmenitiesSubLayers.includes('haat_market')) ? 0 : (publicAmenitiesCounts['haat/ market'] || publicAmenitiesCounts['haat market'] || 0), icon: ShoppingBag },
    { id: 'vending_zones', label: 'Vending Zones', count: (isQueryActive && activePublicAmenitiesSubLayers.length > 0 && !activePublicAmenitiesSubLayers.includes('vending_zones')) ? 0 : (publicAmenitiesCounts['vending zones'] || 0), icon: Store },
  ];

  // Transport & mobility infrastructure sub-categories
  // Actual categories from GeoServer: Airport, Bus Stop, Bus Terminal, EV Charging, Railway Station
  // Show 0 for unselected categories ONLY when query filters are active from Query Panel
  const transportSubCategories = [
    { id: 'airport', label: 'Airport', count: (isQueryActive && activeTransportSubLayers.length > 0 && !activeTransportSubLayers.includes('airport')) ? 0 : (transportCounts['airport'] || 0), icon: Plane },
    { id: 'bus_terminal', label: 'Bus Terminals', count: (isQueryActive && activeTransportSubLayers.length > 0 && !activeTransportSubLayers.includes('bus_terminal')) ? 0 : (transportCounts['bus terminal'] || 0), icon: Warehouse },
    { id: 'bus_stop', label: 'Bus Stop', count: (isQueryActive && activeTransportSubLayers.length > 0 && !activeTransportSubLayers.includes('bus_stop')) ? 0 : (transportCounts['bus stop'] || 0), icon: CircleDot },
    { id: 'ev_charging', label: 'EV Charging Stations', count: (isQueryActive && activeTransportSubLayers.length > 0 && !activeTransportSubLayers.includes('ev_charging')) ? 0 : (transportCounts['ev charging'] || 0), icon: Zap },
    { id: 'railway_station', label: 'Railway Stations', count: (isQueryActive && activeTransportSubLayers.length > 0 && !activeTransportSubLayers.includes('railway_station')) ? 0 : (transportCounts['railway station'] || 0), icon: Train },
  ];

  // Road safety sub-categories for iRAP safety ranking (using real length data from GeoServer)
  const roadSafetySubCategories = [
    { id: 'irap_vehicle', label: 'Vehicle Occupant Safety', count: roadSafetyLengths.irap_vehicle, icon: Car, tooltip: 'Indicates road safety levels for car occupants based on road design.' },
    { id: 'irap_motorcycle', label: 'Motorcyclist Safety', count: roadSafetyLengths.irap_motorcycle, icon: Bike, tooltip: 'Evaluates crash risk for two-wheelers from geometry and roadside features.' },
    { id: 'irap_bicycle', label: 'Bicyclist Safety', count: roadSafetyLengths.irap_bicycle, icon: Bike, tooltip: 'Assesses cycling risk based on traffic interaction and road conditions.' },
    { id: 'irap_pedestrian', label: 'Pedestrian Safety', count: roadSafetyLengths.irap_pedestrian, icon: User, tooltip: 'Measures walking safety using speed, crossings, and roadside design.' },
  ];

  // Sector data type descriptions for hazard layers
  const sectorDataTypes: Record<string, string> = {
    heat: 'Climate & Temperature Indices'
  };

  // iRAP Safety Rating Legend (shared across all rating types)
  const irapSafetyLegend = {
    classes: [
      { label: '5 Star (Safest)', color: '#93c060', rating: '5', width: 4 },
      { label: '4 Star', color: '#fdf05e', rating: '4', width: 4 },
      { label: '3 Star', color: '#eda308', rating: '3', width: 4 },
      { label: '2 Star', color: '#e65336', rating: '2', width: 4 },
      { label: '1 Star (High Risk)', color: '#262626', rating: '1', width: 4 },
      { label: 'Not Applicable', color: '#9CA3AF', rating: 'NA', width: 4 },
    ]
  };

  const scenarios = [
    { 
      id: 'baseline_2025', 
      label: '2025 (Baseline Scenario)', 
      icon: Check,
      iconColor: '#2563EB',
      tooltip: 'Current conditions baseline for comparison with future climate scenarios.'
    },
    { 
      id: 'ssp1_2040', 
      label: 'SSP1 - 2040 (Low-Emission / Sustainability Pathway)', 
      icon: Leaf,
      iconColor: '#22C55E',
      tooltip: <><span style={{ fontWeight: 600 }}>Shared Socioeconomic Pathway 1 (Sustainability / Low Emissions)</span> - Low-emission scenario assuming sustainable development, reduced greenhouse gas emissions, and limited warming by 2040.</>
    },
    { 
      id: 'ssp2_2040', 
      label: 'SSP2 - 2040 (Intermediate / Business-as-Usual Pathway)', 
      icon: TrendingUp,
      iconColor: '#F59E0B',
      tooltip: <><span style={{ fontWeight: 600 }}>Shared Socioeconomic Pathway 2 (Intermediate / Business-as-Usual)</span> - Moderate-emission scenario assuming continuation of current development trends and gradual warming by 2040.</>
    },
    { 
      id: 'ssp5_2040', 
      label: 'SSP5 - 2040 (High-Emission Pathway)', 
      icon: Flame,
      iconColor: '#EF4444',
      tooltip: <><span style={{ fontWeight: 600 }}>Shared Socioeconomic Pathway 5 (High Emissions / Fossil-Fuel Intensive)</span> - High-emission scenario assuming fossil fuel–driven growth and significantly higher warming by 2040.</>
    },
  ];

  const selectedScenarioData = scenarios.find(s => s.id === selectedScenario);

  // Tooltip state
  const [tooltipData, setTooltipData] = useState<{ text: string | React.ReactNode; x: number; y: number } | null>(null);

  const handleTooltipShow = (e: React.MouseEvent, text: string | React.ReactNode) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipData({
      text,
      x: rect.right + 8,
      y: rect.top + rect.height / 2
    });
  };

  const handleTooltipHide = () => {
    setTooltipData(null);
  };

  // Tourism is now always rendered at the top of the unified left drawer.

  return (
    <>
    <div
      data-tutorial="left-drawer"
      className="w-72 bg-white border-r border-[#E2E8F0] flex-shrink-0 shadow-lg"
    >
      <div className="h-full flex flex-col">
        {/* Scrollable Content Area */}
          <div 
            className="flex-1 animate-in fade-in duration-300" 
            style={{ overflowY: 'auto', overflowX: 'visible', animationDelay: '150ms' }}
          >
            {/* Tourism Section (always visible at top) */}
            <div className="border-b border-[#E2E8F0]">
              <TourismPanel embedded selectedLgu={selectedLguName} selectedBrgy={selectedWardName} />
            </div>

            {/* Climate Hazards Title Card (collapsible) — blue-tinted to distinguish from Tourism */}
            <div className="w-full px-4 py-3 hover:brightness-[0.98] transition flex items-center gap-3 border-b border-[#E2E8F0] border-l-[3px] border-l-[#2563EB] bg-gradient-to-r from-[#EFF6FF] to-[#F0F9FF]">
              <button
                onClick={() => setClimateHazardsExpanded(!climateHazardsExpanded)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
              >
                <div className="w-7 h-7 rounded-md flex items-center justify-center bg-[#DBEAFE] border border-[#2563EB]/40 shrink-0">
                  <Layers className="w-4 h-4 text-[#1E40AF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#0F172A] truncate">
                    Climate Hazards
                  </div>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveBaseLayers([]);
                  onLayerChange('');
                }}
                disabled={activeBaseLayers.length === 0 && !activeLayerId}
                title="Reset Climate Hazards (clear all layers)"
                className="w-6 h-6 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.25} />
              </button>
              <button
                onClick={() => setClimateHazardsExpanded(!climateHazardsExpanded)}
                className="p-0.5 -m-0.5 cursor-pointer flex-shrink-0"
                title={climateHazardsExpanded ? 'Collapse' : 'Expand'}
              >
                {climateHazardsExpanded ? (
                  <ChevronDown className="w-4 h-4 text-[#64748B]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#64748B]" />
                )}
              </button>
            </div>

            {climateHazardsExpanded && (
            <>
            {/* Infrastructure Risk - Special Content */}
            {activeSector === 'infra' && (
              <InfrastructureRiskPanel 
                activeInfraLayers={activeInfraLayers}
                toggleInfraLayer={toggleInfraLayer}
                infrastructureLayers={infrastructureLayers}
              />
            )}

            {/* Layer List Section - Only show for non-infra sectors */}
            {activeSector !== 'infra' && (
              <>
              {/* Base Layers Section */}
              <div className="border-b border-[#E2E8F0]" data-tutorial="base-layers-section">
                {/* Base Layers Header - Collapsible */}
                <div className="w-full bg-[#F8FAFC] px-4 py-2.5 hover:bg-[#F1F5F9] transition-all duration-200 group flex items-center justify-between">
                  <button
                    onClick={() => setBaseLayersExpanded(!baseLayersExpanded)}
                    className="flex items-start gap-2 flex-1 text-left cursor-pointer"
                  >
                    <div className="w-1 h-3.5 bg-gradient-to-b from-[#64748B] to-[#475569] rounded-full mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <h3 className="text-xs font-semibold text-[#0F172A] text-left">Base Layers</h3>
                    </div>
                  </button>
                  <div className="ml-2 flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveBaseLayers([]); }}
                      disabled={activeBaseLayers.length === 0}
                      title="Reset base layers"
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.25} />
                    </button>
                    <button
                      onClick={() => setBaseLayersExpanded(!baseLayersExpanded)}
                      className="p-0.5 -m-0.5 cursor-pointer"
                      title={baseLayersExpanded ? 'Collapse' : 'Expand'}
                    >
                      {baseLayersExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Base Layers List */}
                {baseLayersExpanded && (
                  <div className="px-3 py-3 bg-white" data-tutorial="base-layers-content">
                    <div className="space-y-1">
                      {baseLayers.map((layer) => {
                        const isActive = activeBaseLayers.includes(layer.id);
                        const LayerIcon = layer.icon;
                        const hasLegend = 'legend' in layer && layer.legend;
                        
                        return (
                          <div key={layer.id}>
                            <button
                              onClick={() => {
                                
                                if (isActive) {
                                  // Remove the current layer
                                  let newLayers = activeBaseLayers.filter(id => id !== layer.id);
                                  
                                  // When watershed is turned OFF, automatically turn barangay boundary back ON
                                  if (layer.id === 'watershed' && !activeBaseLayers.includes('ward_boundary')) {
                                    newLayers = [...newLayers, 'ward_boundary'];
                                  }
                                  
                                  setActiveBaseLayers(newLayers);
                                } else {
                                  // Add the current layer
                                  let newLayers = [...activeBaseLayers, layer.id];
                                  
                                  // When watershed is turned ON, automatically turn barangay boundary OFF
                                  if (layer.id === 'watershed') {
                                    newLayers = newLayers.filter(id => id !== 'ward_boundary');
                                  }
                                  
                                  // If activating road network, deactivate road safety layers
                                  if (layer.id === 'road_network_base') {
                                    setActiveRoadSafetySubLayers([]);
                                    setActiveRoadNetworkIRAPType(null);
                                    setActiveInfraLayers(activeInfraLayers.filter(id => id !== 'road_safety'));
                                  }
                                  
                                  // When elevation is turned ON, turn off any active hazard/environment layer
                                  if (layer.id === 'elevation' && activeLayerId) {
                                    onLayerChange(activeLayerId);
                                  }
                                  
                                  // When builtup_density (Built-up Density) is turned ON, turn off any active thematic layer
                                  if (layer.id === 'builtup_density' && activeLayerId) {
                                    onLayerChange(activeLayerId);
                                  }
                                  
                                  // elevation and builtup_density are mutually exclusive with each other
                                  if (layer.id === 'builtup_density') {
                                    newLayers = newLayers.filter(id => id !== 'elevation');
                                  }
                                  if (layer.id === 'elevation') {
                                    newLayers = newLayers.filter(id => id !== 'builtup_density');
                                  }
                                  
                                  setActiveBaseLayers(newLayers);
                                }
                              }}
                              className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
                                isActive
                                  ? 'bg-[#F1F5F9] border border-[#475569]/40 text-[#0F172A] shadow-sm'
                                  : 'hover:bg-[#F1F5F9] text-[#475569]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <LayerIcon 
                                  className={`w-3.5 h-3.5 flex-shrink-0 ${
                                    isActive ? 'text-[#0E7490]' : 'text-[#64748B]'
                                  }`} 
                                />
                                <div className="flex-1 min-w-0">
                                  <div className={`text-[11px] font-medium leading-tight ${
                                    isActive ? 'text-[#0E7490]' : 'text-[#475569]'
                                  }`}>
                                    {layer.name}
                                  </div>
                                </div>
                                {isActive && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white ml-1.5 flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Building Layers Section - REMOVED PER USER REQUEST */}
              {false && (
              <div className={`border-b border-[#E2E8F0] relative${isModuleActive ? ' pointer-events-none select-none' : ''}`}>
                {isModuleActive && (
                  <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center rounded">
                    <span className="text-[9px] font-semibold text-[#64748B] tracking-wider uppercase px-2 py-1 bg-white/80 rounded">Inactive — Module 1 active</span>
                  </div>
                )}
                {/* Building Layers Header - Collapsible */}
                <div className="w-full bg-[#F8FAFC] px-4 py-2.5 hover:bg-[#F1F5F9] transition-all duration-200 group">
                  <div className="flex items-start justify-between text-left">
                    <button
                      onClick={() => setBuildingUseExpanded(!buildingUseExpanded)}
                      className="flex items-start gap-2 flex-1 text-left cursor-pointer"
                    >
                      <div className="w-1 h-3.5 bg-gradient-to-b from-[#0891B2] to-[#0E7490] rounded-full mt-0.5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-semibold text-[#0F172A] text-left">Building Layers</h3>
                          {/* Reset Button - Shows when any building categories are active */}
                          {(activeBuildingCategories.length > 0 || activeBuildingSubcategories.length > 0) && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveBuildingCategories([]);
                                setActiveBuildingSubcategories([]);
                                setPreviousBuildingCategories([]);
                              }}
                              className="p-0.5 rounded hover:bg-[#F1F5F9] transition-colors group/reset cursor-pointer inline-flex items-center flex-shrink-0"
                              title="Reset all building categories"
                            >
                              <RotateCcw className="w-3 h-3 text-[#64748B] group-hover/reset:text-[#0F172A] group-hover/reset:rotate-180 transition-all duration-300" />
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    <button 
                      onClick={() => setBuildingUseExpanded(!buildingUseExpanded)}
                      className="ml-2 flex-shrink-0 cursor-pointer"
                    >
                      {buildingUseExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Building Layers Content */}
                {buildingUseExpanded && (
                  <div className="px-3 py-3 bg-white">
                    <div className="space-y-1">
                      {/* Economic Vulnerability Layer */}
                      <div>
                        <button
                          onClick={() => {
                            // Toggle Economic Vulnerability on/off
                            if (isEconomicVulnerabilityActive) {
                              // Turn off Economic Vulnerability
                              setIsEconomicVulnerabilityActive(false);
                            } else {
                              // Turn on Economic Vulnerability and turn off Building Use & other building layers
                              setIsEconomicVulnerabilityActive(true);
                              setActiveBuildingCategories([]); // Turn off Building Use
                              setActiveBuildingSubcategories([]);
                              setPreviousBuildingCategories([]);
                              setBuildingUseLayerExpanded(false); // Collapse Building Use
                              setActiveBuildingHeightCategories([]); // Turn off Building Height
                              setActiveBuildingAreaCategories([]); // Turn off Building Floor Area
                            }
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
                            isEconomicVulnerabilityActive /* EV button */
                              ? 'bg-[#ECFEFF] border border-[#0891B2]/40 text-[#0E7490] shadow-sm'
                              : 'hover:bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                              isEconomicVulnerabilityActive ? 'text-[#0E7490]' : 'text-[#0891B2]'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className={`text-[11px] font-medium mb-0.5 leading-tight flex-1 ${
                                  isEconomicVulnerabilityActive ? 'text-[#0E7490]' : 'text-[#475569]'
                                }`}>
                                  Economic Vulnerability
                                </div>
                                <div 
                                  className="flex-shrink-0 p-1 -m-1 cursor-help"
                                  onMouseEnter={(e) => handleTooltipShow(e, 'Displays buildings classified by economic vulnerability status: Economically Vulnerable (Red) and Others (Light Grey).')}
                                  onMouseLeave={handleTooltipHide}
                                >
                                  <Info className={`w-3.5 h-3.5 ${
                                    isEconomicVulnerabilityActive ? 'text-[#0E7490]/80' : 'text-[#64748B]'
                                  }`} />
                                </div>
                              </div>
                              <div className={`text-[9px] leading-tight ${
                                isEconomicVulnerabilityActive ? 'text-[#0E7490]/85' : 'text-[#64748B]'
                              }`}>
                                Economically vulnerable buildings
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Building Height Layer */}
                      <div>
                        <button
                          onClick={() => {
                            const allIds = buildingHeightCategories.map(c => c.id);
                            if (activeBuildingHeightCategories.length > 0) {
                              setActiveBuildingHeightCategories([]);
                              setBuildingHeightLayerExpanded(false);
                            } else {
                              setActiveBuildingHeightCategories(allIds);
                              setActiveBuildingCategories([]);
                              setActiveBuildingSubcategories([]);
                              setPreviousBuildingCategories([]);
                              setBuildingUseLayerExpanded(false);
                              setIsEconomicVulnerabilityActive(false);
                              setActiveBuildingAreaCategories([]);
                              setBuildingHeightLayerExpanded(true);
                            }
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
                            activeBuildingHeightCategories.length > 0
                              ? 'bg-[#ECFEFF] border border-[#0891B2]/40 text-[#0E7490] shadow-sm'
                              : 'hover:bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Layers className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                              activeBuildingHeightCategories.length > 0 ? 'text-[#0E7490]' : 'text-[#0891B2]'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className={`text-[11px] font-medium mb-0.5 leading-tight flex-1 ${
                                  activeBuildingHeightCategories.length > 0 ? 'text-[#0E7490]' : 'text-[#475569]'
                                }`}>
                                  Building Height
                                </div>
                                <div className="flex items-center gap-1">
                                  {activeBuildingHeightCategories.length > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setBuildingHeightLayerExpanded(!buildingHeightLayerExpanded);
                                      }}
                                      className="p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                                    >
                                      {buildingHeightLayerExpanded
                                        ? <ChevronDown className="w-3 h-3 text-[#0E7490]/80" />
                                        : <ChevronRight className="w-3 h-3 text-[#0E7490]/80" />
                                      }
                                    </button>
                                  )}
                                  <div
                                    className="flex-shrink-0 p-1 -m-1 cursor-help"
                                    onMouseEnter={(e) => handleTooltipShow(e, 'Displays buildings classified by floor count: Low Rise (1–2), Mid Rise (3–4), High Rise (5–7), Very High Rise (≥8).')}
                                    onMouseLeave={handleTooltipHide}
                                  >
                                    <Info className={`w-3.5 h-3.5 ${
                                      activeBuildingHeightCategories.length > 0 ? 'text-[#0E7490]/80' : 'text-[#64748B]'
                                    }`} />
                                  </div>
                                </div>
                              </div>
                              <div className={`text-[9px] leading-tight ${
                                activeBuildingHeightCategories.length > 0 ? 'text-[#0E7490]/85' : 'text-[#64748B]'
                              }`}>
                                {activeBuildingHeightCategories.length > 0
                                  ? 'Classify buildings by floor count'
                                  : 'Classify buildings by floor count'}
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Building Height sub-categories */}
                        {buildingHeightLayerExpanded && activeBuildingHeightCategories.length > 0 && (
                          <div className="mt-1.5 ml-4 space-y-0.5">
                            {buildingHeightCategories.map((cat) => {
                              const isActive = activeBuildingHeightCategories.includes(cat.id);
                              return (
                                <button
                                  key={cat.id}
                                  onClick={() => handleHeightSublayerClick(cat.id)}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-md transition-all duration-200 ${
                                    isActive
                                      ? 'bg-[#ECFEFF] border border-[#0891B2]/40 text-[#0E7490]'
                                      : 'text-[#64748B] hover:bg-[#F1F5F9]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: cat.color, opacity: isActive ? 1 : 0.4 }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-[#0E7490]' : 'text-[#64748B]'}`}>
                                          {cat.name}
                                        </span>
                                        <span className={`text-[9px] flex-shrink-0 ${isActive ? 'text-[#0E7490]/70' : 'text-[#64748B]'}`}>
                                          {cat.type}
                                        </span>
                                      </div>
                                      <div className={`text-[9px] ${isActive ? 'text-[#0E7490]/60' : 'text-[#64748B]'}`}>
                                        {cat.floors} floors
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Building Floor Area Layer */}
                      <div>
                        <button
                          onClick={() => {
                            const allIds = buildingFloorAreaCategories.map(c => c.id);
                            if (activeBuildingAreaCategories.length > 0) {
                              setActiveBuildingAreaCategories([]);
                              setBuildingAreaLayerExpanded(false);
                            } else {
                              setActiveBuildingAreaCategories(allIds);
                              setActiveBuildingCategories([]);
                              setActiveBuildingSubcategories([]);
                              setPreviousBuildingCategories([]);
                              setBuildingUseLayerExpanded(false);
                              setIsEconomicVulnerabilityActive(false);
                              setActiveBuildingHeightCategories([]);
                              setBuildingHeightLayerExpanded(false);
                              setBuildingAreaLayerExpanded(true);
                            }
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
                            activeBuildingAreaCategories.length > 0
                              ? 'bg-[#ECFEFF] border border-[#0891B2]/40 text-[#0E7490] shadow-sm'
                              : 'hover:bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Warehouse className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                              activeBuildingAreaCategories.length > 0 ? 'text-[#0E7490]' : 'text-[#0891B2]'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className={`text-[11px] font-medium mb-0.5 leading-tight flex-1 ${
                                  activeBuildingAreaCategories.length > 0 ? 'text-[#0E7490]' : 'text-[#475569]'
                                }`}>
                                  Building Floor Area
                                </div>
                                <div className="flex items-center gap-1">
                                  {activeBuildingAreaCategories.length > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setBuildingAreaLayerExpanded(!buildingAreaLayerExpanded);
                                      }}
                                      className="p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                                    >
                                      {buildingAreaLayerExpanded
                                        ? <ChevronDown className="w-3 h-3 text-[#0E7490]/80" />
                                        : <ChevronRight className="w-3 h-3 text-[#0E7490]/80" />
                                      }
                                    </button>
                                  )}
                                  <div
                                    className="flex-shrink-0 p-1 -m-1 cursor-help"
                                    onMouseEnter={(e) => handleTooltipShow(e, 'Displays buildings classified by total floor area (footprint × floors): Small (<100 m²), Medium (100–500 m²), Large (500–2,000 m²), Very Large (>2,000 m²).')}
                                    onMouseLeave={handleTooltipHide}
                                  >
                                    <Info className={`w-3.5 h-3.5 ${
                                      activeBuildingAreaCategories.length > 0 ? 'text-[#0E7490]/80' : 'text-[#64748B]'
                                    }`} />
                                  </div>
                                </div>
                              </div>
                              <div className={`text-[9px] leading-tight ${
                                activeBuildingAreaCategories.length > 0 ? 'text-[#0E7490]/85' : 'text-[#64748B]'
                              }`}>
                                {activeBuildingAreaCategories.length > 0
                                  ? 'Classify buildings by total floor area'
                                  : 'Classify buildings by total floor area'}
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Building Floor Area sub-categories */}
                        {buildingAreaLayerExpanded && activeBuildingAreaCategories.length > 0 && (
                          <div className="mt-1.5 ml-4 space-y-0.5">
                            {buildingFloorAreaCategories.map((cat) => {
                              const isActive = activeBuildingAreaCategories.includes(cat.id);
                              return (
                                <button
                                  key={cat.id}
                                  onClick={() => handleAreaSublayerClick(cat.id)}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-md transition-all duration-200 ${
                                    isActive
                                      ? 'bg-[#ECFEFF] border border-[#0891B2]/40 text-[#0E7490]'
                                      : 'text-[#64748B] hover:bg-[#F1F5F9]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: cat.color, opacity: isActive ? 1 : 0.4 }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-[#0E7490]' : 'text-[#64748B]'}`}>
                                          {cat.name}
                                        </span>
                                        <span className={`text-[9px] flex-shrink-0 ${isActive ? 'text-[#0E7490]/70' : 'text-[#64748B]'}`}>
                                          {cat.range}
                                        </span>
                                      </div>
                                      <div className={`text-[9px] ${isActive ? 'text-[#0E7490]/60' : 'text-[#64748B]'}`}>
                                        {cat.desc}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Data Layers Section - For heat and flood sectors */}
              {(activeSector === 'heat' || activeSector === 'flood') && (
              <div className="border-b border-[#E2E8F0]" data-tutorial="hazard-layers-section">
                {/* Layer List Section Header - Collapsible */}
                <div className="w-full bg-[#F8FAFC] px-4 py-2.5 hover:bg-[#F1F5F9] transition-all duration-200 group flex items-center justify-between">
                  <button
                    onClick={() => setDataLayersExpanded(!dataLayersExpanded)}
                    className="flex items-start gap-2 flex-1 text-left cursor-pointer"
                  >
                    <div className="w-1 h-3.5 bg-gradient-to-b from-[#2563EB] to-[#1E40AF] rounded-full mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <h3 className="text-xs font-semibold text-[#0F172A] text-left">
                        {(activeSector === 'heat' || activeSector === 'air' || activeSector === 'flood' || activeSector === 'multihazard')
                          ? 'Climate Hazards Layer'
                          : 'Data Layers'}
                      </h3>
                    </div>
                  </button>
                  <div className="ml-2 flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); onLayerChange(''); }}
                      disabled={!activeLayerId}
                      title="Reset hazard layer"
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.25} />
                    </button>
                    <button
                      onClick={() => setDataLayersExpanded(!dataLayersExpanded)}
                      className="p-0.5 -m-0.5 cursor-pointer"
                      title={dataLayersExpanded ? 'Collapse' : 'Expand'}
                    >
                      {dataLayersExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

              {/* Layer List */}
              {dataLayersExpanded && (
                <div className="px-3 py-3 bg-white" data-tutorial="hazard-layers-content">
                  <div className="space-y-1">
                    {data.layers.map((layer) => {
                      const isActive = activeLayerId === layer.id;
                      const hasLegend = 'legend' in layer && layer.legend;
                      const LayerIcon = getLayerIcon(layer.id);
                      
                      return (
                        <div key={layer.id}>
                          {/* Layer Button */}
                          <button
                            onClick={() => !isLayerLoading && onLayerChange(layer.id)}
                            disabled={isLayerLoading}
                            data-tutorial={layer.id === 'flood_waterlogging' ? 'flood-waterlogging-layer' : undefined}
                            className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
                              isActive
                                ? 'bg-[#EFF6FF] border border-[#2563EB]/40 text-[#1E40AF] shadow-sm'
                                : isLayerLoading
                                ? 'bg-[#F8FAFC] text-[#64748B] cursor-not-allowed opacity-60'
                                : 'hover:bg-[#F1F5F9] text-[#475569]'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <LayerIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                                isActive ? 'text-[#1E40AF]' : 'text-[#2563EB]'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className={`text-[11px] font-medium mb-0.5 leading-tight flex-1 ${
                                    isActive ? 'text-[#0E7490]' : 'text-[#475569]'
                                  }`}
                                  >
                                    {layer.name}
                                  </div>
                                  {layer.tooltip && (
                                    <div 
                                      className="flex-shrink-0 p-1 -m-1 cursor-help"
                                      onMouseEnter={(e) => handleTooltipShow(e, layer.tooltip!)}
                                      onMouseLeave={handleTooltipHide}
                                    >
                                      <Info className={`w-3.5 h-3.5 ${
                                        isActive ? 'text-[#0E7490]/80' : 'text-[#64748B]'
                                      }`} />
                                    </div>
                                  )}
                                </div>
                                <div className={`text-[9px] leading-tight ${
                                  isActive ? 'text-[#0E7490]/85' : 'text-[#64748B]'
                                }`}>
                                  {layer.unit}
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })}

                    {/* ── Flood Hazard Group (heat sector: Flood Hazard Index + Urban Flooding + Storm Surge) ── */}
                    {activeSector === 'heat' && (
                      <div>
                        <button
                          onClick={() => {
                            const newExpanded = !floodHazardExpanded;
                            setFloodHazardExpanded(newExpanded);
                            if (!isLayerLoading) {
                              if (newExpanded) {
                                onLayerChange('flood_fhi');
                              } else if (activeLayerId === 'flood_fhi' || activeLayerId === 'flood_hazard' || activeLayerId === 'storm_surge') {
                                onLayerChange(activeLayerId);
                              }
                            }
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 group ${
                            (activeLayerId === 'flood_fhi' || activeLayerId === 'flood_hazard' || activeLayerId === 'storm_surge')
                              ? 'bg-gradient-to-r from-[#2563EB]/20 to-[#1E40AF]/20 border border-[#2563EB]/30'
                              : 'hover:bg-[#F1F5F9]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <Waves className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#2563EB]" />
                              <div>
                                <div className="text-[11px] font-medium text-[#475569]">Flood Hazard</div>
                                <div className="text-[9px] leading-tight text-[#64748B]">Hazard Index · Urban Flooding · Storm Surge</div>
                              </div>
                            </div>
                            {floodHazardExpanded
                              ? <ChevronDown className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                              : <ChevronRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                            }
                          </div>
                        </button>

                        {floodHazardExpanded && (
                          <div className="ml-3 mt-1 space-y-1 border-l border-[#E2E8F0] pl-2">
                            {[
                              { id: 'flood_fhi', name: 'Flood Hazard Index', unit: 'Normalized Composite Hazard Score', tooltip: 'Identifies areas prone to frequent urban flooding and water stagnation.', icon: Droplets },
                              { id: 'flood_hazard', name: 'Urban Flooding', unit: '100-Year Rainfall Scenario', tooltip: 'Areas at risk of flooding during extreme weather events.', icon: CloudRain },
                              { id: 'storm_surge', name: 'Storm Surge Inundation', unit: 'SSA Scenarios', tooltip: 'Coastal areas vulnerable to storm surge inundation.', icon: Waves },
                            ].map((layer) => {
                              const isActive = activeLayerId === layer.id;
                              const LayerIcon = layer.icon;
                              return (
                                <div key={layer.id}>
                                  <button
                                    onClick={() => !isLayerLoading && onLayerChange(layer.id)}
                                    disabled={isLayerLoading}
                                    className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
                                      isActive
                                        ? 'bg-[#EFF6FF] border border-[#2563EB]/40 text-[#1E40AF] shadow-sm'
                                        : isLayerLoading
                                        ? 'bg-[#F8FAFC] text-[#64748B] cursor-not-allowed opacity-60'
                                        : 'hover:bg-[#F1F5F9] text-[#475569]'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <LayerIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isActive ? 'text-[#1E40AF]' : 'text-[#2563EB]'}`} />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className={`text-[11px] font-medium mb-0.5 leading-tight flex-1 ${isActive ? 'text-[#0E7490]' : 'text-[#475569]'}`}>
                                            {layer.name}
                                          </div>
                                          {layer.tooltip && (
                                            <div
                                              className="flex-shrink-0 p-1 -m-1 cursor-help"
                                              onMouseEnter={(e) => handleTooltipShow(e, layer.tooltip!)}
                                              onMouseLeave={handleTooltipHide}
                                            >
                                              <Info className={`w-3.5 h-3.5 ${
                                                isActive ? 'text-[#0E7490]/80' : 'text-[#64748B]'
                                              }`} />
                                            </div>
                                          )}
                                        </div>
                                        <div className={`text-[9px] leading-tight ${
                                          isActive ? 'text-[#0E7490]/85' : 'text-[#64748B]'
                                        }`}>{layer.unit}</div>
                                      </div>
                                    </div>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Flood Hazard Group (flood sector: Flood Hazard Index + Urban Flooding + Storm Surge) ── */}
                    {activeSector === 'flood' && (
                      <div>
                        <button
                          onClick={() => {
                            const newExpanded = !floodHazardExpanded;
                            setFloodHazardExpanded(newExpanded);
                            if (!isLayerLoading && newExpanded && activeLayerId !== 'flood_fhi' && activeLayerId !== 'flood_hazard' && activeLayerId !== 'storm_surge') {
                              onLayerChange('flood_fhi');
                            }
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 group ${
                            (activeLayerId === 'flood_fhi' || activeLayerId === 'flood_hazard' || activeLayerId === 'storm_surge')
                              ? 'bg-gradient-to-r from-[#2563EB]/20 to-[#1E40AF]/20 border border-[#2563EB]/30'
                              : 'hover:bg-[#F1F5F9]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <Waves className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#2563EB]" />
                              <div>
                                <div className="text-[11px] font-medium text-[#475569]">Flood Hazard</div>
                                <div className="text-[9px] leading-tight text-[#64748B]">Hazard Index · Urban Flooding · Storm Surge</div>
                              </div>
                            </div>
                            {floodHazardExpanded
                              ? <ChevronDown className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                              : <ChevronRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                            }
                          </div>
                        </button>

                        {floodHazardExpanded && (
                          <div className="ml-3 mt-1 space-y-1 border-l border-[#E2E8F0] pl-2">
                            {[
                              { id: 'flood_fhi', name: 'Flood Hazard Index', unit: 'Normalized Composite Hazard Score', tooltip: 'Identifies areas prone to frequent urban flooding and water stagnation.', icon: Droplets },
                              { id: 'flood_hazard', name: 'Urban Flooding', unit: '100-Year Rainfall Scenario', tooltip: 'Areas at risk of flooding during extreme weather events.', icon: CloudRain },
                              { id: 'storm_surge', name: 'Storm Surge Inundation', unit: 'SSA Scenarios', tooltip: 'Coastal areas vulnerable to storm surge inundation.', icon: Waves },
                            ].map((layer) => {
                              const isActive = activeLayerId === layer.id;
                              const LayerIcon = layer.icon;
                              return (
                                <div key={layer.id}>
                                  <button
                                    onClick={() => !isLayerLoading && onLayerChange(layer.id)}
                                    disabled={isLayerLoading}
                                    className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
                                      isActive
                                        ? 'bg-[#EFF6FF] border border-[#2563EB]/40 text-[#1E40AF] shadow-sm'
                                        : isLayerLoading
                                        ? 'bg-[#F8FAFC] text-[#64748B] cursor-not-allowed opacity-60'
                                        : 'hover:bg-[#F1F5F9] text-[#475569]'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <LayerIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isActive ? 'text-[#1E40AF]' : 'text-[#2563EB]'}`} />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className={`text-[11px] font-medium mb-0.5 leading-tight flex-1 ${isActive ? 'text-[#0E7490]' : 'text-[#475569]'}`}>
                                            {layer.name}
                                          </div>
                                          {layer.tooltip && (
                                            <div
                                              className="flex-shrink-0 p-1 -m-1 cursor-help"
                                              onMouseEnter={(e) => handleTooltipShow(e, layer.tooltip!)}
                                              onMouseLeave={handleTooltipHide}
                                            >
                                              <Info className={`w-3.5 h-3.5 ${
                                                isActive ? 'text-[#0E7490]/80' : 'text-[#64748B]'
                                              }`} />
                                            </div>
                                          )}
                                        </div>
                                        <div className={`text-[9px] leading-tight ${
                                          isActive ? 'text-[#0E7490]/85' : 'text-[#64748B]'
                                        }`}>{layer.unit}</div>
                                      </div>
                                    </div>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Heat Stress Group (heat sector only) ── */}
                    {activeSector === 'heat' && (
                      <div>
                        <button
                          onClick={() => {
                            const newExpanded = !heatStressExpanded;
                            setHeatStressExpanded(newExpanded);
                            if (!isLayerLoading) {
                              if (newExpanded) {
                                onLayerChange('heat_stress_index');
                              } else if (['heat_stress_index', 'land_surface_temperature', 'urban_heat_island', 'wet_bulb_temperature'].includes(activeLayerId)) {
                                onLayerChange(activeLayerId);
                              }
                            }
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 group ${
                            ['heat_stress_index', 'land_surface_temperature', 'urban_heat_island', 'wet_bulb_temperature'].includes(activeLayerId)
                              ? 'bg-gradient-to-r from-[#F59E0B]/20 to-[#D97706]/20 border border-[#F59E0B]/30'
                              : 'hover:bg-[#F1F5F9]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <Flame className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#F59E0B]" />
                              <div>
                                <div className="text-[11px] font-medium text-[#475569]">Heat Stress</div>
                                <div className="text-[9px] leading-tight text-[#64748B]">HSI · LST · UHI · Wet-Bulb</div>
                              </div>
                            </div>
                            {heatStressExpanded
                              ? <ChevronDown className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                              : <ChevronRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                            }
                          </div>
                        </button>

                        {heatStressExpanded && (
                          <div className="ml-3 mt-1 space-y-1 border-l border-[#E2E8F0] pl-2">
                            {[
                              { id: 'heat_stress_index', name: 'Heat Stress Index', unit: 'Composite Heat Stress Score', tooltip: 'Composite index combining temperature, humidity and urban heat factors to assess heat stress risk.', icon: Flame },
                              { id: 'land_surface_temperature', name: 'Land Surface Temperature', unit: '°C (Degrees Celsius)', tooltip: 'Shows how hot urban surfaces become due to buildings, roads, and low greenery.', icon: Thermometer },
                              { id: 'urban_heat_island', name: 'Urban Heat Island', unit: '°C (Anomaly)', tooltip: 'Shows excess heating caused by dense buildings and paved surfaces.', icon: ThermometerSun },
                              { id: 'wet_bulb_temperature', name: 'Wet Bulb Temperature', unit: '°C (Degrees Celsius)', tooltip: 'Measures human heat tolerance by combining temperature and humidity.', icon: Gauge },
                            ].map((layer) => {
                              const isActive = activeLayerId === layer.id;
                              const LayerIcon = layer.icon;
                              const dynamicLegend = getDynamicLegend(layer.id);
                              return (
                                <div key={layer.id}>
                                  <button
                                    onClick={() => !isLayerLoading && onLayerChange(layer.id)}
                                    disabled={isLayerLoading}
                                    className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
                                      isActive
                                        ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-sm shadow-[#F59E0B]/20'
                                        : isLayerLoading
                                        ? 'bg-[#F8FAFC] text-[#64748B] cursor-not-allowed opacity-60'
                                        : 'hover:bg-[#F1F5F9] text-[#475569]'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <LayerIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#F59E0B]'}`} />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className={`text-[11px] font-medium mb-0.5 leading-tight flex-1 ${isActive ? 'text-[#0E7490]' : 'text-[#475569]'}`}>
                                            {layer.name}
                                          </div>
                                          {layer.tooltip && (
                                            <div
                                              className="flex-shrink-0 p-1 -m-1 cursor-help"
                                              onMouseEnter={(e) => handleTooltipShow(e, layer.tooltip!)}
                                              onMouseLeave={handleTooltipHide}
                                            >
                                              <Info className={`w-3.5 h-3.5 ${
                                                isActive ? 'text-[#0E7490]/80' : 'text-[#64748B]'
                                              }`} />
                                            </div>
                                          )}
                                        </div>
                                        <div className={`text-[9px] leading-tight ${
                                          isActive ? 'text-[#0E7490]/85' : 'text-[#64748B]'
                                        }`}>{layer.unit}</div>
                                      </div>
                                    </div>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* ── Sink Hole layer (sibling of Heat Stress group) ── */}
                        {(() => {
                          const isActive = activeLayerId === 'sinkhole';
                          return (
                            <button
                              onClick={() => !isLayerLoading && onLayerChange('sinkhole')}
                              disabled={isLayerLoading}
                              className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 mt-1 ${
                                isActive
                                  ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-sm shadow-[#F59E0B]/20'
                                  : isLayerLoading
                                  ? 'bg-[#F8FAFC] text-[#64748B] cursor-not-allowed opacity-60'
                                  : 'hover:bg-[#F1F5F9] text-[#475569]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#F59E0B]'}`} />
                                <div>
                                  <div className={`text-[11px] font-medium ${isActive ? 'text-white' : 'text-[#475569]'}`}>Sink Hole</div>
                                  <div className={`text-[9px] leading-tight ${isActive ? 'text-white/85' : 'text-[#64748B]'}`}>Risk Level</div>
                                </div>
                              </div>
                            </button>
                          );
                        })()}
                      </div>
                    )}

                  </div>
                </div>
              )}
              </div>
              )}

              {/* Environmental Sensitivity Layers Section - REMOVED PER USER REQUEST */}
              {false && (activeSector === 'heat') && (
              <div className="border-b border-[#E2E8F0]">
                {/* Environmental Sensitivity Layers Section Header - Collapsible */}
                <button
                  onClick={() => setEnvironmentalExpanded(!environmentalExpanded)}
                  className="w-full bg-[#F8FAFC] px-4 py-2.5 hover:bg-[#F1F5F9] transition-all duration-200 text-left cursor-pointer group"
                >
                <div className="flex items-start justify-between text-left">
                  <div className="flex items-start gap-2 flex-1">
                    <div className="w-1 h-3.5 bg-gradient-to-b from-[#10B981] to-[#059669] rounded-full mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <h3 className="text-xs font-semibold text-[#0F172A] text-left">
                        Environmental Vulnerability
                      </h3>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {environmentalExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                    )}
                  </div>
                </div>
              </button>

              {/* Environmental Layer List */}
              {environmentalExpanded && (
                <div className="px-3 py-3 space-y-1">

                  {/* ── 1. Groundwater Depth – single layer ── */}
                  {(() => {
                    const layer = environmentalLayers.find(l => l.id === 'groundwater_depth')!;
                    const isActive = activeLayerId === layer.id;
                    const LayerIcon = getLayerIcon(layer.id);
                    return (
                      <div>
                        <button
                          onClick={() => !isLayerLoading && onLayerChange(layer.id)}
                          disabled={isLayerLoading}
                          className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-sm shadow-[#10B981]/20'
                              : isLayerLoading
                              ? 'bg-[#F8FAFC] text-[#64748B] cursor-not-allowed opacity-60'
                              : 'hover:bg-[#F1F5F9] text-[#475569]'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <LayerIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                              isActive ? 'text-white' : 'text-[#10B981]'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className={`text-[11px] font-medium mb-0.5 leading-tight flex-1 ${
                                  isActive ? 'text-[#0E7490]' : 'text-[#475569]'
                                }`}>
                                  {layer.name}
                                </div>
                                {layer.tooltip && (
                                  <div
                                    className="flex-shrink-0 p-1 -m-1 cursor-help"
                                    onMouseEnter={(e) => handleTooltipShow(e, layer.tooltip!)}
                                    onMouseLeave={handleTooltipHide}
                                  >
                                    <Info className={`w-3.5 h-3.5 ${
                                      isActive ? 'text-[#0E7490]/80' : 'text-[#64748B]'
                                    }`} />
                                  </div>
                                )}
                              </div>
                              <div className={`text-[9px] leading-tight ${
                                isActive ? 'text-[#0E7490]/85' : 'text-[#64748B]'
                              }`}>
                                {layer.unit}
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })()}

                  {/* ── 2. Ground Water Infiltration – expandable group ── */}
                  <div>
                    <button
                      onClick={() => {
                        const newExpanded = !gwInfiltrationExpanded;
                        setGwInfiltrationExpanded(newExpanded);
                        if (!isLayerLoading && newExpanded && !['groundwater_infiltration_vulnerability', 'soil_classification', 'geology', 'sinkhole'].includes(activeLayerId)) {
                          onLayerChange('groundwater_infiltration_vulnerability');
                        }
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 group ${
                        ['groundwater_infiltration_vulnerability', 'soil_classification', 'geology', 'sinkhole'].includes(activeLayerId)
                          ? 'bg-gradient-to-r from-[#10B981]/20 to-[#059669]/20 border border-[#10B981]/30'
                          : 'hover:bg-[#F1F5F9]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Layers className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#10B981]" />
                          <div>
                            <div className="text-[11px] font-medium text-[#475569]">Ground Water Infiltration</div>
                            <div className="text-[9px] leading-tight text-[#64748B]">Risk · Soil · Geology · Sinkhole</div>
                          </div>
                        </div>
                        {gwInfiltrationExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                          : <ChevronRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0F172A] transition-colors" />
                        }
                      </div>
                    </button>

                    {gwInfiltrationExpanded && (
                      <div className="ml-3 mt-1 space-y-1 border-l border-[#E2E8F0] pl-2">
                        {[
                          { id: 'groundwater_infiltration_vulnerability', name: 'Ground Water Infiltration Risk', unit: 'Vulnerability', tooltip: 'Groundwater infiltration vulnerability affecting sanitation and groundwater contamination risk.' },
                          ...environmentalLayers.filter(l => ['soil_classification', 'geology', 'sinkhole'].includes(l.id))
                        ].map((layer) => {
                            const isActive = activeLayerId === layer.id;
                            const LayerIcon = getLayerIcon(layer.id);
                            return (
                              <div key={layer.id}>
                                <button
                                  onClick={() => !isLayerLoading && onLayerChange(layer.id)}
                                  disabled={isLayerLoading}
                                  className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
                                    isActive
                                      ? 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-sm shadow-[#10B981]/20'
                                      : isLayerLoading
                                      ? 'bg-[#F8FAFC] text-[#64748B] cursor-not-allowed opacity-60'
                                      : 'hover:bg-[#F1F5F9] text-[#475569]'
                                    }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <LayerIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                                      isActive ? 'text-white' : 'text-[#10B981]'
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className={`text-[11px] font-medium mb-0.5 leading-tight flex-1 ${
                                          isActive ? 'text-[#0E7490]' : 'text-[#475569]'
                                        }`}>
                                          {layer.name}
                                        </div>
                                        {layer.tooltip && (
                                          <div
                                            className="flex-shrink-0 p-1 -m-1 cursor-help"
                                            onMouseEnter={(e) => handleTooltipShow(e, layer.tooltip!)}
                                            onMouseLeave={handleTooltipHide}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Info className={`w-3.5 h-3.5 ${
                                              isActive ? 'text-[#0E7490]/80' : 'text-[#64748B]'
                                            }`} />
                                          </div>
                                        )}
                                      </div>
                                      <div className={`text-[9px] leading-tight ${
                                        isActive ? 'text-[#0E7490]/85' : 'text-[#64748B]'
                                      }`}>
                                        {layer.unit}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                                {/* Compact Legend removed — keep panel uncluttered for all layers. */}
                              </div>
                            );
                          })
                        }
                      </div>
                    )}
                  </div>

                </div>
              )}
              </div>
              )}

              {/* Infrastructure Overlay Section - REMOVED PER USER REQUEST */}
              {false && (activeSector === 'heat' || activeSector === 'air' || activeSector === 'flood' || activeSector === 'multihazard') && (
                <div className="border-b border-[#E5E7EB]" data-tutorial="infrastructure-section">
                  {/* Infrastructure Section Header - Consistent Style */}
                  <div className="w-full bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] px-4 py-2.5 hover:from-[#F1F5F9] hover:to-[#E5E7EB] transition-all duration-200 text-left group flex items-start justify-between">
                    <button
                      onClick={() => setInfraExpanded(!infraExpanded)}
                      className="flex items-start gap-2 flex-1 text-left cursor-pointer"
                    >
                      <div className="w-1 h-3.5 bg-gradient-to-b from-[#F59E0B] to-[#D97706] rounded-full mt-0.5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-semibold text-[#0F172A] text-left">Infrastructure Overlay</h3>
                          {/* Reset Button - Shows when any infrastructure sub-layers are active (excluding road_safety) */}
                          {(activeInfraLayers.filter(id => id !== 'road_safety').length > 0 || 
                            activeEducationSubLayers.length > 0 || 
                            activeHealthcareSubLayers.length > 0 || 
                            activePublicAmenitiesSubLayers.length > 0 || 
                            activeTransportSubLayers.length > 0) && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                resetAllInfrastructureLayers();
                              }}
                              className="p-0.5 rounded hover:bg-[#F1F5F9] transition-colors group/reset cursor-pointer inline-flex items-center flex-shrink-0"
                              title="Reset all infrastructure layers"
                            >
                              <RotateCcw className="w-3 h-3 text-[#64748B] group-hover/reset:text-[#475569] group-hover/reset:rotate-180 transition-all duration-300" />
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                    <button 
                      onClick={() => setInfraExpanded(!infraExpanded)}
                      className="ml-2 flex-shrink-0 cursor-pointer"
                    >
                      {infraExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#6B7280] group-hover:text-[#F59E0B] transition-colors" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#F59E0B] transition-colors" />
                      )}
                    </button>
                  </div>

                  {/* Infrastructure Layer List */}
                  {infraExpanded && (
                    <div className="px-3 py-3" data-tutorial="infrastructure-content">
                      <div className="space-y-1">
                        {infrastructureLayers.map((infraLayer) => {
                          const isInfraActive = activeInfraLayers.includes(infraLayer.id);
                          const InfraIcon = infraLayer.icon;
                          const hasInfraLegend = 'legend' in infraLayer && infraLayer.legend;
                          
                          return (
                            <div key={infraLayer.id}>
                              {/* Infrastructure Layer Button - Matching Hazard Layer Style */}
                              <button
                                onClick={() => toggleInfraLayer(infraLayer.id)}
                                data-tutorial={infraLayer.id === 'educational' ? 'educational-layer' : undefined}
                                className={`w-full text-left px-2.5 py-2 rounded-md transition-all duration-200 ${
                                  isInfraActive
                                    ? 'bg-[#F1F5F9] shadow-sm'
                                    : 'hover:bg-[#F8FAFC] text-[#1F2937]'
                                }`}
                                style={{
                                  borderLeft: `3px solid ${isInfraActive ? infraLayer.color : 'transparent'}`,
                                  minHeight: '44px',
                                  maxHeight: '44px'
                                }}
                              >
                                <div className="flex items-start gap-2">
                                  <InfraIcon 
                                    className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0`}
                                    style={{ color: infraLayer.color, opacity: isInfraActive ? 1 : 0.6 }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-[11px] font-medium leading-tight ${
                                      isInfraActive ? 'text-[#0F172A]' : 'text-[#0F172A]'
                                    }`}>
                                      {infraLayer.name}
                                    </div>
                                  </div>
                                </div>
                              </button>

                              {/* Compact Legend for Infrastructure (excluding Road Network) */}
                              {isInfraActive && hasInfraLegend && infraLayer.id !== 'road_network' && (
                                <div className="mt-1.5 px-2 py-1.5 bg-white border border-[#E5E7EB] rounded-md">
                                  <div className="space-y-1">
                                    {infraLayer.legend.classes.map((cls, idx) => (
                                      <div key={idx} className="flex items-center gap-1.5">
                                        <div
                                          className="w-2 h-2 rounded-full shadow-sm flex-shrink-0"
                                          style={{ backgroundColor: cls.color }}
                                        />
                                        <span className="text-[9px] text-[#64748B] font-medium flex-1">
                                          {cls.label}
                                        </span>
                                        <span className="text-[8px] text-[#64748B]">
                                          {cls.km}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                            {/* Educational Institution Sub-Categories - Only show when educational is active */}
                            <div 
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isInfraActive && infraLayer.id === 'educational' ? 'mt-1' : 'max-h-0'
                              }`}
                            >
                              <div className="rounded-md overflow-hidden">
                                {/* Sub-category buttons list - Compact, no header */}
                                <div className="space-y-0.5">
                                  {educationSubCategories.map((subCat) => {
                                    const isSubActive = activeEducationSubLayers.includes(subCat.id);
                                    const SubIcon = subCat.icon;
                                    return (
                                      <button
                                        key={subCat.id}
                                        onClick={() => toggleEducationSubLayer(subCat.id)}
                                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded transition-all duration-200 border border-l-[3px] border-t border-r border-b ${
                                          isSubActive
                                            ? 'bg-[#8B5CF6]/10 border-l-[#8B5CF6] border-t-transparent border-r-transparent border-b-transparent text-[#8B5CF6] shadow-md'
                                            : 'bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#64748B] border-l-transparent border-t-[#E5E7EB] border-r-[#E5E7EB] border-b-[#E5E7EB]'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                                          isSubActive ? 'bg-[#8B5CF6]/25' : 'bg-[#8B5CF6]/10'
                                        }`}>
                                          <SubIcon className={`w-2.5 h-2.5 ${
                                            isSubActive ? 'text-[#8B5CF6]' : 'text-[#8B5CF6]'
                                          }`} />
                                        </div>
                                        <span className="text-[10px] font-medium flex-1 text-left">
                                          {subCat.label}
                                        </span>
                                        <span className={`text-[8px] px-1 py-0.5 rounded ${
                                          isSubActive ? 'bg-[#8B5CF6]/25 text-[#8B5CF6] font-semibold' : 'bg-[#8B5CF6]/10 text-[#8B5CF6]'
                                        }`}>
                                          {subCat.count}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Healthcare Facility Sub-Categories - Only show when healthcare is active */}
                            <div 
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isInfraActive && infraLayer.id === 'healthcare' ? 'mt-1' : 'max-h-0'
                              }`}
                            >
                              <div className="rounded-md overflow-hidden">
                                {/* Sub-category buttons list - Compact, no header */}
                                <div className="space-y-0.5">
                                  {healthcareSubCategories.map((subCat) => {
                                    const isSubActive = activeHealthcareSubLayers.includes(subCat.id);
                                    const SubIcon = subCat.icon;
                                    return (
                                      <button
                                        key={subCat.id}
                                        onClick={() => toggleHealthcareSubLayer(subCat.id)}
                                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded transition-all duration-200 border border-l-[3px] border-t border-r border-b ${
                                          isSubActive
                                            ? 'bg-[#EF4444]/10 border-l-[#EF4444] border-t-transparent border-r-transparent border-b-transparent text-[#EF4444] shadow-md'
                                            : 'bg-[#F8FAFC] hover:bg-[#FEE2E2] text-[#64748B] border-l-transparent border-t-[#E5E7EB] border-r-[#E5E7EB] border-b-[#E5E7EB]'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                                          isSubActive ? 'bg-[#EF4444]/25' : 'bg-[#EF4444]/10'
                                        }`}>
                                          <SubIcon className={`w-2.5 h-2.5 ${
                                            isSubActive ? 'text-[#EF4444]' : 'text-[#EF4444]'
                                          }`} />
                                        </div>
                                        <span className="text-[10px] font-medium flex-1 text-left">
                                          {subCat.label}
                                        </span>
                                        <span className={`text-[8px] px-1 py-0.5 rounded ${
                                          isSubActive ? 'bg-[#EF4444]/25 text-[#EF4444] font-semibold' : 'bg-[#EF4444]/10 text-[#EF4444]'
                                        }`}>
                                          {subCat.count}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Public Amenities Sub-Categories - Only show when public amenities is active */}
                            <div 
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isInfraActive && infraLayer.id === 'public_amenities' ? 'mt-1' : 'max-h-0'
                              }`}
                            >
                              <div className="rounded-md overflow-hidden">
                                {/* Sub-category buttons list - Compact, no header */}
                                <div className="space-y-0.5">
                                  {publicAmenitiesSubCategories.map((subCat) => {
                                    const isSubActive = activePublicAmenitiesSubLayers.includes(subCat.id);
                                    const SubIcon = subCat.icon;
                                    return (
                                      <button
                                        key={subCat.id}
                                        onClick={() => togglePublicAmenitiesSubLayer(subCat.id)}
                                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded transition-all duration-200 border border-l-[3px] border-t border-r border-b ${
                                          isSubActive
                                            ? 'bg-[#06B6D4]/10 border-l-[#06B6D4] border-t-transparent border-r-transparent border-b-transparent text-[#06B6D4] shadow-md'
                                            : 'bg-[#F8FAFC] hover:bg-[#E0F2FE] text-[#64748B] border-l-transparent border-t-[#E5E7EB] border-r-[#E5E7EB] border-b-[#E5E7EB]'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                                          isSubActive ? 'bg-[#06B6D4]/25' : 'bg-[#06B6D4]/10'
                                        }`}>
                                          <SubIcon className={`w-2.5 h-2.5 ${
                                            isSubActive ? 'text-[#06B6D4]' : 'text-[#06B6D4]'
                                          }`} />
                                        </div>
                                        <span className="text-[10px] font-medium flex-1 text-left">
                                          {subCat.label}
                                        </span>
                                        <span className={`text-[8px] px-1 py-0.5 rounded ${
                                          isSubActive ? 'bg-[#06B6D4]/25 text-[#06B6D4] font-semibold' : 'bg-[#06B6D4]/10 text-[#06B6D4]'
                                        }`}>
                                          {subCat.count}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Transport & Mobility Infrastructure Sub-Categories - Only show when transport mobility is active */}
                            <div 
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isInfraActive && infraLayer.id === 'transport_mobility' ? 'mt-1' : 'max-h-0'
                              }`}
                            >
                              <div className="rounded-md overflow-hidden">
                                {/* Sub-category buttons list - Compact, no header */}
                                <div className="space-y-0.5">
                                  {transportSubCategories.map((subCat) => {
                                    const isSubActive = activeTransportSubLayers.includes(subCat.id);
                                    const SubIcon = subCat.icon;
                                    return (
                                      <button
                                        key={subCat.id}
                                        onClick={() => toggleTransportSubLayer(subCat.id)}
                                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded transition-all duration-200 border border-l-[3px] border-t border-r border-b ${
                                          isSubActive
                                            ? 'bg-[#F59E0B]/10 border-l-[#F59E0B] border-t-transparent border-r-transparent border-b-transparent text-[#F59E0B] shadow-md'
                                            : 'bg-[#F8FAFC] hover:bg-[#FEF3C7] text-[#64748B] border-l-transparent border-t-[#E5E7EB] border-r-[#E5E7EB] border-b-[#E5E7EB]'
                                        }`}
                                      >
                                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                                          isSubActive ? 'bg-[#F59E0B]/25' : 'bg-[#F59E0B]/10'
                                        }`}>
                                          <SubIcon className={`w-2.5 h-2.5 ${
                                            isSubActive ? 'text-[#F59E0B]' : 'text-[#F59E0B]'
                                          }`} />
                                        </div>
                                        <span className="text-[10px] font-medium flex-1 text-left">
                                          {subCat.label}
                                        </span>
                                        <span className={`text-[8px] px-1 py-0.5 rounded ${
                                          isSubActive ? 'bg-[#F59E0B]/25 text-[#F59E0B] font-semibold' : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                                        }`}>
                                          {subCat.count}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Road Safety Assessment (iRAP) Section - HIDDEN/REMOVED PER USER REQUEST */}
            {false && (
            <div className="border-b border-[#E5E7EB]" data-tutorial="road-safety-section">
                {/* Road Safety Header */}
                <div 
                  className="w-full bg-gradient-to-r from-[#F8FAFC] to-[#F1F5F9] px-4 py-2.5 flex items-center justify-between cursor-pointer hover:from-[#F1F5F9] hover:to-[#E2E8F0] transition-colors"
                  onClick={() => setRoadSafetyExpanded(!roadSafetyExpanded)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-1 h-3.5 bg-gradient-to-b from-[#14B8A6] to-[#0D9488] rounded-full flex-shrink-0" />
                    <h3 className="text-xs font-semibold text-[#0F172A]">Road Safety Assessment (iRAP)</h3>
                    {/* Reset Button - Shows when any road safety sub-layers are active */}
                    {activeRoadSafetySubLayers.length > 0 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          resetAllRoadSafetyLayers();
                        }}
                        className="p-0.5 rounded hover:bg-[#F1F5F9] transition-colors group/reset cursor-pointer inline-flex items-center flex-shrink-0 ml-auto mr-2"
                        title="Reset road safety layers"
                      >
                        <RotateCcw className="w-3 h-3 text-[#64748B] group-hover/reset:text-[#475569] group-hover/reset:rotate-180 transition-all duration-300" />
                      </span>
                    )}
                  </div>
                  {roadSafetyExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#6B7280] transition-colors" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#6B7280] transition-colors" />
                  )}
                </div>

                {/* Road Safety Content - Collapsible based on roadSafetyExpanded state */}
                {roadSafetyExpanded && (
                  <div className="px-3 py-3" data-tutorial="road-safety-content">
                  <div className="rounded-md overflow-hidden">
                    <div className="space-y-1.5">
                      {roadSafetySubCategories.map((subCat) => {
                        const isSubActive = activeRoadSafetySubLayers.includes(subCat.id);
                        const isLayerExpanded = roadSafetyLayerExpanded[subCat.id];
                        const currentStarRating = roadSafetyStarRatings[subCat.id];
                        const SubIcon = subCat.icon;

                        const handleHeadingClick = () => {
                          const isCurrentlyExpanded = roadSafetyLayerExpanded[subCat.id];
                          const isCurrentlyActive = activeRoadSafetySubLayers.includes(subCat.id);
                          
                          console.log(`🖱️ [LeftDrawer] Accordion clicked: ${subCat.id}, Currently expanded: ${isCurrentlyExpanded}, Currently active: ${isCurrentlyActive}`);
                          
                          if (isCurrentlyExpanded && isCurrentlyActive) {
                            // COLLAPSING: Deactivate the layer
                            console.log(`📋 [LeftDrawer] STRICT RULE: Collapsing ${subCat.id} → Deactivating layer`);
                            
                            // Deactivate this layer
                            setActiveRoadSafetySubLayers([]);
                            setActiveRoadNetworkIRAPType(null);
                            
                            // Clear star rating filter
                            setRoadSafetyStarRatings(prev => ({
                              ...prev,
                              [subCat.id]: null
                            }));
                            
                            // Remove road_safety from activeInfraLayers
                            setActiveInfraLayers(activeInfraLayers.filter(id => id !== 'road_safety'));
                            
                            // TURN BACK ON the road network base layer when road safety is turned off
                            if (!activeBaseLayers.includes('road_network_base')) {
                              setActiveBaseLayers([...activeBaseLayers, 'road_network_base']);
                            }
                            
                            // The accordion will be collapsed by the useEffect that watches activeRoadSafetySubLayers
                          } else {
                            // EXPANDING: Activate the layer
                            console.log(`📋 [LeftDrawer] STRICT RULE: Expanding ${subCat.id} → Activating layer`);
                            
                            // Clear star ratings for all other layers
                            setRoadSafetyStarRatings({
                              irap_vehicle: null,
                              irap_motorcycle: null,
                              irap_bicycle: null,
                              irap_pedestrian: null
                            });
                            
                            // Activate the layer (show all roads of this type)
                            setActiveRoadSafetySubLayers([subCat.id]);
                            setActiveRoadNetworkIRAPType(subCat.id);
                            
                            // Add road_safety to activeInfraLayers if not already there
                            if (!activeInfraLayers.includes('road_safety')) {
                              setActiveInfraLayers([...activeInfraLayers, 'road_safety']);
                            }
                            
                            // Deactivate road network base layer
                            setActiveBaseLayers(activeBaseLayers.filter(id => id !== 'road_network_base'));
                            
                            // The accordion will be expanded by the useEffect that watches activeRoadSafetySubLayers
                          }
                        };

                        const activateLayer = () => {
                          // Activate the layer (show all roads of this type)
                          setActiveRoadSafetySubLayers([subCat.id]);
                          setActiveRoadNetworkIRAPType(subCat.id);
                          // Note: Do NOT clear star rating here - let the caller manage it
                          // This was causing the zoom issue because star rating was being cleared after being set
                          // Add road_safety to activeInfraLayers if not already there
                          if (!activeInfraLayers.includes('road_safety')) {
                            setActiveInfraLayers([...activeInfraLayers, 'road_safety']);
                          }
                          // Deactivate road network base layer
                          setActiveBaseLayers(activeBaseLayers.filter(id => id !== 'road_network_base'));
                        };

                        const deactivateLayer = () => {
                          // Deselect this sub-layer
                          setActiveRoadSafetySubLayers([]);
                          setActiveRoadNetworkIRAPType(null);
                          // Clear star rating filter
                          setRoadSafetyStarRatings(prev => ({
                            ...prev,
                            [subCat.id]: null
                          }));
                          // Remove road_safety from activeInfraLayers
                          setActiveInfraLayers(activeInfraLayers.filter(id => id !== 'road_safety'));
                          // TURN BACK ON the road network base layer when road safety is turned off
                          if (!activeBaseLayers.includes('road_network_base')) {
                            setActiveBaseLayers([...activeBaseLayers, 'road_network_base']);
                          }
                        };

                        const toggleStarRating = async (starRating: string) => {
                          console.log(`⭐ Star rating clicked: ${subCat.id} - ${starRating}`);
                          
                          if (currentStarRating === starRating) {
                            // Clicking the same star rating again - deactivate filter (show all)
                            console.log(`🔄 Deactivating star filter for ${subCat.id}`);
                            setRoadSafetyStarRatings(prev => ({
                              ...prev,
                              [subCat.id]: null
                            }));
                            
                            // Reset map to home position
                            if (onResetMapView) {
                              console.log('🏠 Resetting map view');
                              onResetMapView();
                            }
                          } else {
                            // Select new star rating filter
                            console.log(`✅ Activating star filter: ${subCat.id} = ${starRating}`);
                            setRoadSafetyStarRatings(prev => ({
                              ...prev,
                              [subCat.id]: starRating
                            }));
                            // Make sure the layer is active
                            if (!isSubActive) {
                              console.log(`🔵 Layer ${subCat.id} is not active, activating...`);
                              activateLayer();
                            }
                            
                            // Zoom to filtered roads
                            if (onZoomToStarRating) {
                              console.log(`🔍 Calling onZoomToStarRating for ${subCat.id} ${starRating}`);
                              try {
                                await onZoomToStarRating(subCat.id, starRating);
                                console.log(`✅ Zoom completed for ${subCat.id} ${starRating}`);
                              } catch (error) {
                                console.error(`❌ Error zooming to ${subCat.id} ${starRating}:`, error);
                              }
                            } else {
                              console.warn('⚠️ onZoomToStarRating handler not provided');
                            }
                          }
                        };

                        // Star ratings data (from roadSafetyStats)
                        const layerStats = roadSafetyStats[subCat.id] || {};
                        const starRatings = [
                          { id: '5star', label: '5 Star', starCount: 5, count: layerStats['5star'] || 0, color: '#93c060' },
                          { id: '4star', label: '4 Star', starCount: 4, count: layerStats['4star'] || 0, color: '#fdf05e' },
                          { id: '3star', label: '3 Star', starCount: 3, count: layerStats['3star'] || 0, color: '#eda308' },
                          { id: '2star', label: '2 Star', starCount: 2, count: layerStats['2star'] || 0, color: '#e65336' },
                          { id: '1star', label: '1 Star', starCount: 1, count: layerStats['1star'] || 0, color: '#000000' },
                        ];

                        return (
                          <div key={subCat.id} className="space-y-1">
                            {/* Main Assessment Layer Button */}
                            <button
                              onClick={handleHeadingClick}
                              data-tutorial={subCat.id === 'irap_pedestrian' ? 'pedestrian-layer' : undefined}
                              className={`w-full text-left px-2.5 rounded-md transition-all duration-200 ${
                                isSubActive
                                  ? 'bg-[#F1F5F9] shadow-sm'
                                  : 'hover:bg-[#F8FAFC] text-[#1F2937]'
                              }`}
                              style={{
                                borderLeft: `3px solid ${isSubActive ? '#14B8A6' : 'transparent'}`,
                                minHeight: '44px',
                                maxHeight: '44px'
                              }}
                            >
                              <div className="flex items-center gap-2 h-full py-3">
                                {/* Icon */}
                                <SubIcon 
                                  className="w-3.5 h-3.5 flex-shrink-0"
                                  style={{ color: '#14B8A6', opacity: isSubActive ? 1 : 0.6 }}
                                />
                                {/* Label and Status */}
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className={`text-[11px] font-medium leading-tight flex-1 text-left ${
                                      isSubActive ? 'text-[#0F172A]' : 'text-[#0F172A]'
                                    }`}>
                                      {subCat.label}
                                    </div>
                                    {subCat.tooltip && (
                                      <div 
                                        className="flex-shrink-0 p-1 -m-1 cursor-help"
                                        onMouseEnter={(e) => handleTooltipShow(e, subCat.tooltip!)}
                                        onMouseLeave={handleTooltipHide}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Info className={`w-3.5 h-3.5 ${
                                          isSubActive ? 'text-[#14B8A6]' : 'text-[#64748B]'
                                        }`} />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>

                            {/* Star Rating Sub-Options (Expandable) */}
                            {isLayerExpanded && (
                              <div className="ml-5 space-y-0.5">
                                {starRatings.map((star) => {
                                  const isStarActive = currentStarRating === star.id && isSubActive;
                                  
                                  // Get assessment type label for tooltip
                                  const assessmentTypeLabel = subCat.label.replace(' Safety', '');
                                  
                                  // Generate tooltip based on star rating and assessment type
                                  const getStarTooltip = () => {
                                    const starNum = star.label.split(' ')[0];
                                    
                                    // Determine user group based on assessment type
                                    const userGroup = 
                                      assessmentTypeLabel === 'Vehicle' ? 'vehicle occupants' :
                                      assessmentTypeLabel === 'Motorcycle' ? 'motorcyclists' :
                                      assessmentTypeLabel === 'Bicyclist' ? 'bicyclists' :
                                      assessmentTypeLabel === 'Pedestrian' ? 'pedestrians' :
                                      'road users';
                                    
                                    return `${starNum}★ – ${
                                      starNum === '5' ? `Very low risk of death or serious injury for ${userGroup}` :
                                      starNum === '4' ? `Low risk of death or serious injury for ${userGroup}` :
                                      starNum === '3' ? `Moderate risk of death or serious injury for ${userGroup}` :
                                      starNum === '2' ? `High risk of death or serious injury for ${userGroup}` :
                                      `Very high risk of death or serious injury for ${userGroup}`
                                    }`;
                                  };
                                  
                                  return (
                                    <button
                                      key={star.id}
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        await toggleStarRating(star.id);
                                      }}
                                      className={`w-full text-left px-2 py-1.5 rounded transition-all duration-200 ${
                                        isStarActive
                                          ? 'bg-[#E0F2FE] border-l-2 border-[#14B8A6]'
                                          : 'hover:bg-[#F8FAFC] border-l-2 border-transparent'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                          {/* Single star icon in iRAP color */}
                                          <Star
                                            className="w-3 h-3 flex-shrink-0"
                                            fill={star.color}
                                            stroke={star.color}
                                            strokeWidth={1}
                                          />
                                          <span className={`text-[10px] font-medium ${
                                            isStarActive ? 'text-[#0F172A]' : 'text-[#475569]'
                                          }`}>
                                            {star.label}
                                          </span>
                                          {/* Info icon with tooltip */}
                                          <div 
                                            className="flex-shrink-0 p-0.5 -m-0.5 cursor-help"
                                            onMouseEnter={(e) => handleTooltipShow(e, getStarTooltip())}
                                            onMouseLeave={handleTooltipHide}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Info className={`w-3 h-3 ${
                                              isStarActive ? 'text-[#14B8A6]' : 'text-[#64748B]'
                                            }`} />
                                          </div>
                                        </div>
                                        <div className={`text-[9px] font-medium ${
                                          isStarActive ? 'text-[#14B8A6]' : 'text-[#64748B]'
                                        }`}>
                                          {star.count > 0 ? `${star.count.toFixed(1)} km` : '0 km'}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* End Road Safety Section - HIDDEN */}
            </>
          )}
          </>
          )}
          </div>
          {/* End Scrollable Content Area */}
        </div>
    </div>

    {/* Fixed Tooltip Portal */}
    {tooltipData && (
    <div 
      className="fixed w-72 pointer-events-none animate-in fade-in duration-150"
      style={{
        left: `${tooltipData.x}px`,
        top: `${tooltipData.y}px`,
        transform: 'translateY(-50%)',
        zIndex: 99999
      }}
    >
      <div className="relative">
        {/* Modern compact tooltip */}
        <div 
          className="rounded-lg border"
          style={{
            background: '#FFFFFF',
            borderColor: '#E2E8F0',
            boxShadow: '0 4px 24px -4px rgba(0, 0, 0, 0.1), 0 2px 8px -2px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="px-3 py-2.5">
            <div 
              className="text-[11px] leading-[1.6]"
              style={{ 
                fontWeight: 450,
                fontStyle: 'italic',
                color: '#475569',
                letterSpacing: '-0.005em'
              }}
            >
              {tooltipData.text}
            </div>
          </div>
        </div>
        
        {/* Clean minimal arrow */}
        <div 
          className="absolute"
          style={{
            left: '-5px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
            borderTop: '5px solid transparent',
            borderBottom: '5px solid transparent',
            borderRight: '5px solid #FFFFFF',
          }}
        />
        <div 
          className="absolute"
          style={{
            left: '-6px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 0,
            height: 0,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: '6px solid #E2E8F0'
          }}
        />
      </div>
    </div>
  )}
  </>
);
}