import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Layers, Minimize2, Maximize2, Flame, Sun, Thermometer, ThermometerSun, Droplets, CloudRain, Wind, Waves, Route, ShieldAlert, Car, Bike, User, AlertTriangle, Home, TreePine, Building2, Mountain, Gauge, Info, Truck, Clock } from 'lucide-react';
import { getUILayerLegend, type LegendEntry } from '../utils/legendLoader';
import { LEGEND_DATA } from '../data/legendDefinitions';
import { getLayerNameForScenario } from '../config/geoserverLayers';
import { ENVIRONMENTAL_LAYERS } from '../config/environmentalLayers';
import { useHazardLayerBreakdown } from '../tourism/useHazardLayerBreakdown';

// Mirror of the CWIS hazard mapping used elsewhere (e.g. TourismAnalyticsPanel).
// Maps a frontend layerId to its full GeoServer WFS typeName so per-class
// percentages can be fetched directly.
const LEGEND_CWIS_HAZARD_LAYERS: Record<string, string> = {
  storm_surge:        'WorldBank_Bohol:StormSurge',
  flood_hazard:       'WorldBank_Bohol:Flood',
  urban_waterlogging: 'WorldBank_Bohol:Flood',
};

interface LegendClass {
  label: string;
  color: string;
  value?: string;
  width?: number;
  km?: string;
  rating?: string;
  outlineStyle?: boolean; // renders an open square (border only) for boundary/region entries
}

interface FloatingLegendPanelProps {
  activeSector: string;
  activeLayerId: string;
  scenario: string; // NEW: Scenario for hazard layers
  activeSubLayers: string[];
  activeInfraLayers: string[];
  activeRoadNetworkIRAPType: string | null;
  activeRoadSafetySubLayers?: string[];
  sectorOpacity: number;
  setSectorOpacity: (opacity: number) => void;
  activeBaseLayers: string[];
  layerOpacities: Record<string, number>;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
  roadNetworkStats?: Record<string, number>;
  roadSafetyStats?: Record<string, number>;
  minimized?: boolean;  // Control minimized state externally
  onMinimizeToggle?: (minimized: boolean) => void;  // Callback when minimized state changes
  isEconomicVulnerabilityActive?: boolean; // Economic Vulnerability layer state
  activeBuildingHeightCategories?: string[]; // Building Height active categories
  activeBuildingAreaCategories?: string[]; // Building Floor Area active categories
  activeBuildingCategories?: string[]; // Building Use layer state
  buildingOpacity?: number; // 0–1, controlled by transparency slider
  onBuildingOpacityChange?: (opacity: number) => void;
  activeGridSewerCategories?: string[]; // Grid sewer feasibility categories for Module 1
  activeSewerCategories?: string[];    // Building sewer feasibility categories for Module 1
  sewerViewMode?: 'grid' | 'buildings'; // Which sewer layer is active
  hasBufferLayer?: boolean; // Whether the 120m buffer zone polygon is currently shown
  activeFleetClasses?: string[]; // Module 3 fleet accessibility active classes
  fleetOpacity?: number; // 0–1, fleet accessibility layer opacity
  onFleetOpacityChange?: (opacity: number) => void;
  activeFstpBands?: string[]; // Module 3 FSTP drive-time active bands
  fstpOpacity?: number; // 0–1, FSTP service area layer opacity
  onFstpOpacityChange?: (opacity: number) => void;
  /** LGU filter from header — scopes per-class % breakdown in legend */
  selectedLguName?: string;
  /** Barangay filter from header — scopes per-class % breakdown in legend */
  selectedWardName?: string;
  children?: React.ReactNode; // Extra legend blocks rendered above the standard legends (e.g., Tourism)
}

export function FloatingLegendPanel({
  activeSector,
  activeLayerId,
  scenario,
  activeSubLayers,
  activeInfraLayers,
  activeRoadNetworkIRAPType,
  activeRoadSafetySubLayers = [],
  sectorOpacity,
  setSectorOpacity,
  activeBaseLayers,
  layerOpacities,
  onLayerOpacityChange,
  roadNetworkStats = {},
  roadSafetyStats = {},
  minimized = false,
  onMinimizeToggle,
  isEconomicVulnerabilityActive = false,
  activeBuildingHeightCategories = [],
  activeBuildingAreaCategories = [],
  activeBuildingCategories = [],
  buildingOpacity = 0.7,
  onBuildingOpacityChange,
  activeGridSewerCategories = [],
  hasBufferLayer = false,
  activeSewerCategories = [],
  sewerViewMode = 'buildings',
  activeFleetClasses = [],
  fleetOpacity = 0.75,
  onFleetOpacityChange,
  activeFstpBands = [],
  fstpOpacity = 0.75,
  onFstpOpacityChange,
  selectedLguName,
  selectedWardName,
  children,
}: FloatingLegendPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(minimized);
  const [legendTooltip, setLegendTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const handleLegendTooltipShow = (e: React.MouseEvent, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setLegendTooltip({ text, x: rect.right + 8, y: rect.top + rect.height / 2 });
  };
  const handleLegendTooltipHide = () => setLegendTooltip(null);

  // ── Per-class % area breakdown for the active hazard / environmental layer.
  // Resolves the GeoServer WFS typeName for the active layer (scenario-aware),
  // then applies an optional LGU/Brgy CQL filter from the header. Used to
  // render percentages next to each legend class. Raster layers (heat, NDVI)
  // have no polygon features and will return null data.
  const legendBreakdownLayerName: string | null = (() => {
    if (!activeLayerId) return null;
    if (LEGEND_CWIS_HAZARD_LAYERS[activeLayerId]) return LEGEND_CWIS_HAZARD_LAYERS[activeLayerId];
    const envCfg = ENVIRONMENTAL_LAYERS[activeLayerId];
    if (envCfg) return `${envCfg.workspace}:${envCfg.geoserverLayer}`;
    const scenarioName = getLayerNameForScenario(activeLayerId, scenario);
    return scenarioName ? `WorldBank_Bohol:${scenarioName}` : null;
  })();
  const { data: legendBreakdown } = useHazardLayerBreakdown(legendBreakdownLayerName, {
    munName: selectedLguName,
    brgyName: selectedWardName,
  });
  const legendBreakdownByClass: Record<string, number> = React.useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of legendBreakdown || []) m[String(s.class).toLowerCase()] = s.pct;
    return m;
  }, [legendBreakdown]);

  // Sync external minimized prop with internal state
  useEffect(() => {
    setIsMinimized(minimized);
  }, [minimized]);

  // Function to get icon for each layer
  const getLayerIcon = (layerId: string, infraLayerId?: string) => {
    // Economic Vulnerability
    if (infraLayerId === 'economic_vulnerability') return AlertTriangle;
    
    // Module 3 layers
    if (infraLayerId === 'fleet_accessibility') return Truck;
    if (infraLayerId === 'fstp_travel_time') return Truck;

    // Base layers
    if (infraLayerId === 'buildings') return Building2;
    if (infraLayerId === 'slum_settlements') return Home;
    if (infraLayerId === 'builtup_density') return Building2;
    if (infraLayerId === 'built_up') return Building2;
    if (infraLayerId === 'elevation') return Mountain;
    if (infraLayerId === 'ndvi') return TreePine;
    if (infraLayerId === 'watershed') return Droplets;
    if (infraLayerId === 'road_network_base') return Route;
    
    // Infrastructure layers
    if (infraLayerId === 'road_network') return Route;
    if (infraLayerId === 'road_safety') {
      // Use the specific sub-layer icon if available
      return activeRoadSafetySubLayer ? activeRoadSafetySubLayer.icon : ShieldAlert;
    }
    
    // Heat Stress icons
    if (layerId === 'heat_stress_index') return Flame;
    if (layerId === 'land_surface_temperature') return Sun;
    if (layerId === 'urban_heat_island') return ThermometerSun;
    if (layerId === 'wet_bulb_temperature') return Gauge;
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
    
    // Environmental Sensitivity Layer icons
    if (layerId === 'soil_classification') return Mountain;
    if (layerId === 'groundwater_depth') return Droplets;
    if (layerId === 'geology') return Layers;
    if (layerId === 'sinkhole') return AlertTriangle;
    if (layerId === 'groundwater_infiltration_vulnerability') return Droplets;
    
    // Default icon
    return Layers;
  };

  // Layer names with units mapping for all sectors
  const layerNames: Record<string, string> = {
    // Heat layers
    'heat_hhi': 'Heat Stress Hazard Index (HHI) - Index Score',
    'heat_lst': 'Land Surface Temperature (LST) - °C',
    'heat_ast': 'Air Surface Temperature (AST) - °C',
    'heat_rh': 'Relative Humidity (RH) - %',
    'heat_wbt': 'Wet-Bulb Temperature (WBT) - °C',
    'heat_wbgt': 'Wet-Bulb Globe Temperature (WBGT) - °C',
    'heat_uhi': 'Urban Heat Island (UHI) - °C',
    // Air layers
    'air_aqi': 'Air Quality Index (AQI) - Index Score',
    'air_pm25': 'PM2.5 (Fine Particles) - µg/m³',
    'air_pm10': 'PM10 (Coarse Particles) - µg/m³',
    'air_no2': 'NO₂ (Nitrogen Dioxide) - µg/m³',
    'air_so2': 'SO₂ (Sulfur Dioxide) - µg/m³',
    'air_co': 'CO (Carbon Monoxide) - mg/m³',
    'air_o3': 'O₃ (Ozone) - µg/m³',
    // Flood layers
    'flood_fhi': 'Flood Hazard Index (FHI) - Index Score',
    'flood_depth': 'Flood Depth',
    'flood_velocity': 'Flood Velocity',
    'flood_duration': 'Flood Duration',
    'flood_frequency': 'Flood Frequency',
    'flood_drainage': 'Drainage Capacity',
    // CWIS Climate Hazard Layers
    'storm_surge': 'Storm Surge Inundation',
    'flood_hazard': 'Flood Hazard',
    'heat_stress_index': 'Heat Stress Index (HSI) - Composite Score',
    'land_surface_temperature': 'Land Surface Temperature (LST) - °C',
    'urban_heat_island': 'Urban Heat Island (UHI) - °C Anomaly',
    'wet_bulb_temperature': 'Wet-Bulb Temperature (WBT) - °C',
    // Multi Hazard layers
    'multihazard_assessment': 'Multi-Hazard Climate Risk - Index Score',
    // Environmental Sensitivity Layers
    'soil_classification': 'Soil Classification - Soil Type',
    'groundwater_depth': 'Groundwater Depth - Depth (m)',
    'geology': 'Geology - Geological Type',
    'sinkhole': 'Sinkhole - Risk Level',
    'groundwater_infiltration_vulnerability': 'Ground Water Infiltration - Vulnerability',
  };

  /**
   * Convert CSV LegendEntry[] to LegendClass[] format
   */
  const convertCSVToLegendClasses = (entries: LegendEntry[]): LegendClass[] => {
    return entries.map(entry => ({
      label: entry.label,
      color: entry.color,
      value: entry.description || undefined,
    }));
  };

  /**
   * Get hazard legend from CSV for a specific layer
   */
  const getHazardLegend = (layerId: string): { name: string; type: 'polygon' | 'line'; classes: LegendClass[] } | null => {
    console.log('🔍 Getting hazard legend for:', { layerId, scenario });
    const csvEntries = getUILayerLegend(layerId, scenario);
    console.log('📊 CSV entries received:', csvEntries);
    
    if (csvEntries.length === 0) {
      console.warn(`⚠️ No CSV legend found for layer: ${layerId}, scenario: ${scenario}`);
      return null;
    }

    // For storm surge, omit the "No Storm Surge Inundation" (gridcode 0) entry from the legend
    const displayEntries = layerId === 'storm_surge'
      ? csvEntries.filter(e => e.gridcode !== 0)
      : csvEntries;

    const legend = {
      name: layerNames[layerId] || layerId,
      type: 'polygon' as const,
      classes: convertCSVToLegendClasses(displayEntries),
    };
    
    console.log('✅ Hazard legend created:', legend);
    return legend;
  };

  // Road safety sub-categories mapping
  const roadSafetySubCategories: Record<string, { label: string; icon: any }> = {
    'irap_vehicle': { label: 'Vehicle Safety', icon: Car },
    'irap_motorcycle': { label: 'Motorcycle Safety', icon: Bike },
    'irap_bicycle': { label: 'Bicycle Safety', icon: Bike },
    'irap_pedestrian': { label: 'Pedestrian Safety', icon: User },
  };

  // Get the active road safety sub-layer info
  const activeRoadSafetySubLayer = activeRoadSafetySubLayers.length > 0 
    ? roadSafetySubCategories[activeRoadSafetySubLayers[0]]
    : null;

  // Extract road safety stats for the active sub-layer
  const activeRoadSafetyStats = activeRoadSafetySubLayers.length > 0 && roadSafetyStats
    ? roadSafetyStats[activeRoadSafetySubLayers[0]]
    : {};

  // Infrastructure legends - road_network and road_safety (DYNAMIC KM VALUES)
  const infraLegends: Record<string, { name: string; type: 'polygon' | 'line'; classes: LegendClass[] }> = {
    road_network: {
      name: 'Road Network',
      type: 'line',
      classes: [
        { 
          label: 'National Highway (NH)', 
          color: '#EF4444', 
          width: 4, 
          km: roadNetworkStats['National Highway'] !== undefined
            ? `${roadNetworkStats['National Highway'].toFixed(1)} km` 
            : 'Loading...' 
        },
        { 
          label: 'State Highway (SH)', 
          color: '#F59E0B', 
          width: 3, 
          km: roadNetworkStats['State Highway'] !== undefined
            ? `${roadNetworkStats['State Highway'].toFixed(1)} km` 
            : 'Loading...' 
        },
        { 
          label: 'Major Roads', 
          color: '#3B82F6', 
          width: 2.5, 
          km: roadNetworkStats['Major Road'] !== undefined
            ? `${roadNetworkStats['Major Road'].toFixed(1)} km` 
            : 'Loading...' 
        },
        { 
          label: 'Link Roads', 
          color: '#94A3B8', 
          width: 2, 
          km: roadNetworkStats['Link Road'] !== undefined
            ? `${roadNetworkStats['Link Road'].toFixed(1)} km` 
            : 'Loading...' 
        },
      ],
    },
    road_safety: {
      name: activeRoadSafetySubLayer ? `${activeRoadSafetySubLayer.label} - iRAP Rating` : 'Road Safety iRAP Rating',
      type: 'line',
      classes: [
        { 
          label: '5 Star (Safest)', 
          color: '#93c060', 
          rating: '5', 
          width: 4,
          km: activeRoadSafetyStats['5star'] !== undefined ? `${activeRoadSafetyStats['5star'].toFixed(1)} km` : 'Loading...'
        },
        { 
          label: '4 Star', 
          color: '#fdf05e', 
          rating: '4', 
          width: 4,
          km: activeRoadSafetyStats['4star'] !== undefined ? `${activeRoadSafetyStats['4star'].toFixed(1)} km` : 'Loading...'
        },
        { 
          label: '3 Star', 
          color: '#eda308', 
          rating: '3', 
          width: 4,
          km: activeRoadSafetyStats['3star'] !== undefined ? `${activeRoadSafetyStats['3star'].toFixed(1)} km` : 'Loading...'
        },
        { 
          label: '2 Star', 
          color: '#e65336', 
          rating: '2', 
          width: 4,
          km: activeRoadSafetyStats['2star'] !== undefined ? `${activeRoadSafetyStats['2star'].toFixed(1)} km` : 'Loading...'
        },
        { 
          label: '1 Star (High Risk)', 
          color: '#262626', 
          rating: '1', 
          width: 4,
          km: activeRoadSafetyStats['1star'] !== undefined ? `${activeRoadSafetyStats['1star'].toFixed(1)} km` : 'Loading...'
        },
      ],
    },
  };

  // Base layer legends - dynamically load from LEGEND_DATA where available
  const baseLegends: Record<string, { name: string; type: 'polygon' | 'line'; classes: LegendClass[]; additionalItems?: { name: string; type: 'point' | 'line'; classes: LegendClass[] }[] }> = {
    buildings: {
      name: 'Building Category',
      type: 'polygon',
      classes: [
        { label: 'Residential',                color: '#f6e717' },
        { label: 'Commercial Establishments',  color: '#e40021' },
        { label: 'Educational Institutions',   color: '#2963ea' },
        { label: 'Government & Civic Services',color: '#29da11' },
        { label: 'Health Facilities',          color: '#2bdade' },
        { label: 'Religious Places',           color: '#eb7120' },
        { label: 'Industrial',                 color: '#94A3B8' },
        { label: 'Transport & Logistics',      color: '#7C3AED' },
      ],
    },
    slum_settlements: {
      name: 'Slum',
      type: 'line',
      classes: [
        { label: 'Slum Boundary', color: '#8B5CF6', width: 2.5 },
      ],
    },
    builtup_density: {
      name: 'Built-up Density',
      type: 'polygon',
      classes: [
        { label: 'No Buildings', color: '#E2E8F0', value: 'Grid cell with zero building footprint' },
        { label: 'Low Density', color: '#86EFAC', value: 'Sparse built-up with minimal development' },
        { label: 'Medium Density', color: '#FCD34D', value: 'Moderate building concentration' },
        { label: 'High Density', color: '#F97316', value: 'Dense built-up areas' },
      ],
    },
    grid_sewer: {
      name: 'Grid Sewer Feasibility',
      type: 'polygon',
      classes: [
        { label: 'Sewer Feasible', color: '#14B8A6', value: 'Grid cell suitable for sewer network' },
        { label: 'Non-Sewer', color: '#F59E0B', value: 'Grid cell not suitable for sewer network' },
        { label: 'On-Site Treatment', color: '#8B5CF6', value: 'Grid cell suitable for on-site treatment' },
      ],
    },
    built_up: {
      name: 'Built-up',
      type: 'polygon',
      classes: [
        { label: 'Low (<25%)', color: '#F1F5F9' },
        { label: 'Medium (25-50%)', color: '#CBD5E1' },
        { label: 'High (50-75%)', color: '#64748B' },
        { label: 'Very High (>75%)', color: '#334155' },
      ],
    },
    // Elevation: Dynamically loaded from LEGEND_DATA (synchronized with /config/layerStyles.ts)
    elevation: {
      name: 'Elevation',
      type: 'polygon',
      classes: LEGEND_DATA['elevation'] ? LEGEND_DATA['elevation'].map(entry => ({
        label: entry.label,
        color: entry.color,
        value: entry.description
      })) : [
        { label: 'Low (<20m)', color: '#FEF3C7' },
        { label: 'Medium (20-40m)', color: '#FCD34D' },
        { label: 'High (40-60m)', color: '#F59E0B' },
        { label: 'Very High (>60m)', color: '#B45309' },
      ],
    },
    ndvi: {
      name: 'Green Cover (NDVI)',
      type: 'polygon',
      classes: [
        { label: 'Water / No Vegetation', color: '#2563EB', value: 'NDVI < 0' },
        { label: 'Bare Soil / Built-up', color: '#D6BC8A', value: 'NDVI 0 – 0.2' },
        { label: 'Sparse Vegetation', color: '#FCD34D', value: 'NDVI 0.2 – 0.4' },
        { label: 'Moderate Vegetation', color: '#86EFAC', value: 'NDVI 0.4 – 0.6' },
        { label: 'Dense Vegetation', color: '#15803D', value: 'NDVI > 0.6' },
      ],
    },
    watershed: {
      name: 'Stream Order',
      type: 'line',
      classes: [
        { label: '1st Order', color: '#B3E5FC', width: 1.0 },
        { label: '2nd Order', color: '#81D4FA', width: 1.5 },
        { label: '3rd Order', color: '#4FC3F7', width: 2.0 },
        { label: '4th Order', color: '#29B6F6', width: 2.5 },
        { label: '5th Order', color: '#1565C0', width: 3.0 },
      ],
      additionalItems: [
        {
          name: 'Outfall Location',
          type: 'point',
          classes: [
            { label: 'Drainage Outfall', color: '#DC2626', symbol: 'circle' }
          ]
        }
      ]
    },
    road_network_base: {
      name: 'Road Network',
      type: 'line',
      classes: [
        { 
          label: 'National Highway', 
          color: '#B0B0B0', 
          width: 3, 
          km: roadNetworkStats['National Highway'] !== undefined
            ? `${roadNetworkStats['National Highway'].toFixed(1)} km` 
            : 'Loading...' 
        },
        { 
          label: 'State Highway', 
          color: '#C0C0C0', 
          width: 2.5, 
          km: roadNetworkStats['State Highway'] !== undefined
            ? `${roadNetworkStats['State Highway'].toFixed(1)} km` 
            : 'Loading...' 
        },
        { 
          label: 'Major Road', 
          color: '#D5D5D5', 
          width: 2, 
          km: roadNetworkStats['Major Road'] !== undefined
            ? `${roadNetworkStats['Major Road'].toFixed(1)} km` 
            : 'Loading...' 
        },
        { 
          label: 'Link Road', 
          color: '#F0F0F0', 
          width: 1.5, 
          km: roadNetworkStats['Link Road'] !== undefined
            ? `${roadNetworkStats['Link Road'].toFixed(1)} km` 
            : 'Loading...' 
        },
      ],
    },
  };

  // Get active legends
  const activeLegends: { id: string; legend: { name: string; type: 'polygon' | 'line'; classes: LegendClass[]; additionalItems?: { name: string; type: 'point' | 'line'; classes: LegendClass[] }[] } }[] = [];

  // Add base layer legends first (skip road_network_base - not needed in legend)
  activeBaseLayers.forEach(layerId => {
    // Only show buildings legend when Building Use layer is active (activeBuildingCategories.length > 0)
    if (layerId === 'buildings' && activeBuildingCategories.length === 0) {
      console.log('ℹ️ Skipping buildings legend - Building Use layer not active');
      return;
    }
    
    if (layerId !== 'road_network_base' && baseLegends[layerId]) {
      activeLegends.push({
        id: layerId,
        legend: baseLegends[layerId],
      });
    }
  });

  // Add infrastructure legends (road network)
  activeInfraLayers.forEach(layerId => {
    // Skip road_safety here - it will be added separately below
    if (layerId !== 'road_safety' && infraLegends[layerId]) {
      activeLegends.push({
        id: layerId,
        legend: infraLegends[layerId],
      });
    }
  });

  // Add Economic Vulnerability legend if active
  if (isEconomicVulnerabilityActive) {
    activeLegends.push({
      id: 'economic_vulnerability',
      legend: {
        name: 'Economic Vulnerability',
        type: 'polygon',
        classes: [
          { label: 'Economically Vulnerable', color: '#DC2626' },
          { label: 'Others', color: '#E5E7EB' },
        ],
      },
    });
  }

  // Add Building Height legend for active categories
  if (activeBuildingHeightCategories.length > 0) {
    const heightClassMap: Record<string, { label: string; floors: string; color: string }> = {
      low_rise:       { label: 'Low Rise',       floors: '1–2 floors',  color: '#6EE7B7' },
      mid_rise:       { label: 'Mid Rise',       floors: '3–4 floors',  color: '#FCD34D' },
      high_rise:      { label: 'High Rise',      floors: '5–7 floors',  color: '#FB923C' },
      very_high_rise: { label: 'Very High Rise', floors: '≥8 floors',   color: '#F87171' },
    };
    const orderedIds = ['low_rise', 'mid_rise', 'high_rise', 'very_high_rise'];
    const classes = orderedIds
      .filter(id => activeBuildingHeightCategories.includes(id))
      .map(id => ({ label: `${heightClassMap[id].label} (${heightClassMap[id].floors})`, color: heightClassMap[id].color }));
    activeLegends.push({
      id: 'building_height',
      legend: {
        name: 'Building Height',
        type: 'polygon',
        classes,
      },
    });
  }

  // Add Building Floor Area legend for active categories
  if (activeBuildingAreaCategories.length > 0) {
    const areaClassMap: Record<string, { label: string; range: string; color: string }> = {
      small:      { label: 'Small',      range: '<50 m²',         color: '#93C5FD' },
      medium:     { label: 'Medium',     range: '50–200 m²',      color: '#6EE7B7' },
      large:      { label: 'Large',      range: '200–1,000 m²',   color: '#FDE68A' },
      very_large: { label: 'Very Large', range: '>1,000 m²',      color: '#F9A8D4' },
    };
    const orderedIds = ['small', 'medium', 'large', 'very_large'];
    const classes = orderedIds
      .filter(id => activeBuildingAreaCategories.includes(id))
      .map(id => ({ label: `${areaClassMap[id].label} (${areaClassMap[id].range})`, color: areaClassMap[id].color }));
    activeLegends.push({
      id: 'building_area',
      legend: {
        name: 'Building Floor Area',
        type: 'polygon',
        classes,
      },
    });
  }

  // Sanitation zone display classes (UI-friendly labels keyed by DB value)
  const sewerZoneUIClasses = [
    { dbValue: 'Sewer Feasible',    label: 'Network Coverage',     color: '#14B8A6' },
    { dbValue: 'On-site Treatment', label: 'On-site Treatment',    color: '#8B5CF6' },
    { dbValue: 'Non-Sewer',         label: 'Non-Network Coverage', color: '#F59E0B' },
  ];

  // Add Grid sewer feasibility legend when active (Module 1 - Grid mode)
  // Add buildings sewer legend when active (Module 1 - Buildings mode)
  if (activeSewerCategories.length > 0) {
    const classes: LegendClass[] = sewerZoneUIClasses
      .filter(z => activeSewerCategories.includes(z.dbValue))
      .map(z => ({ label: z.label, color: z.color }));
    if (hasBufferLayer && activeSewerCategories.includes('Sewer Feasible')) {
      classes.push({ label: 'Sewer Suitable Region', color: '#14B8A6', outlineStyle: true });
    }
    activeLegends.push({
      id: 'buildings_sewer',
      legend: { name: 'Sanitation Zones', type: 'polygon' as const, classes },
    });
  }

  // Add Fleet Accessibility legend (Module 3) when any fleet class is active
  if (activeFleetClasses.length > 0) {
    const FLEET_CLASS_DEFS = [
      { key: '10 KL Truck',       label: '10 KL Truck',       color: '#22C55E' },
      { key: '5 KL Truck',        label: '5 KL Truck',        color: '#3B82F6' },
      { key: 'With Booster Pump', label: 'With Booster Pump', color: '#F59E0B' },
      { key: 'Hard to Access',    label: 'Hard to Access',    color: '#EF4444' },
    ];
    const fleetClasses = FLEET_CLASS_DEFS
      .filter(c => activeFleetClasses.includes(c.key))
      .map(c => ({ label: c.label, color: c.color }));
    activeLegends.push({
      id: 'fleet_accessibility',
      legend: { name: 'Fleet Accessibility', type: 'polygon' as const, classes: fleetClasses },
    });
  }

  // Add Truck Service Area legend (Module 3) when any drive-time band is active
  if (activeFstpBands.length > 0) {
    const FSTP_BAND_DEFS = [
      { key: '< 10 min',    label: 'Immediate Service \u00B7 < 10 min',     color: '#16A34A' },
      { key: '10 - 20 min', label: 'Routine Service \u00B7 10\u201320 min',  color: '#FACC15' },
      { key: '20 - 30 min', label: 'Extended Service \u00B7 20\u201330 min', color: '#F97316' },
      { key: '> 30 min',    label: 'Remote Service \u00B7 > 30 min',         color: '#DC2626' },
    ];
    const fstpClasses = FSTP_BAND_DEFS
      .filter(b => activeFstpBands.includes(b.key))
      .map(b => ({ label: b.label, color: b.color }));
    activeLegends.push({
      id: 'fstp_travel_time',
      legend: { name: 'Truck Service Area', type: 'polygon' as const, classes: fstpClasses },
    });
  }

  // Add road safety legend if any road safety sub-layers are active
  if (activeRoadSafetySubLayers.length > 0 && infraLegends['road_safety']) {
    activeLegends.push({
      id: 'road_safety',
      legend: infraLegends['road_safety'],
    });
  }

  // Add main hazard legend from CSV (skip for road safety sector)
  if (activeSector && activeSector !== 'roadsafety' && activeLayerId) {
    console.log('🎯 Attempting to add hazard legend:', { activeSector, activeLayerId, activeSubLayers });
    
    // Skip Heat Stress Hazard Index (HHI) from legend display
    if (activeLayerId !== 'heat_hhi') {
      const hazardLegend = getHazardLegend(activeLayerId);
      if (hazardLegend) {
        console.log('✅ Adding hazard legend to activeLegends');
        activeLegends.push({
          id: 'main',
          legend: hazardLegend,
        });
      } else {
        console.warn('❌ Hazard legend is null, not adding to activeLegends');
      }
    } else {
      console.log('ℹ️ Skipping heat_hhi legend (hidden by user request)');
    }
  } else if (activeSector === 'roadsafety') {
    console.log('ℹ️ Road safety sector - skipping hazard legend (using infrastructure legend instead)');
  } else if (!activeLayerId) {
    console.log('ℹ️ No active layer ID - skipping hazard legend');
  } else {
    console.warn('⚠️ No active sector');
  }

  console.log('📋 Final activeLegends:', activeLegends);

  // Don't render if no active layers (unless extra children are provided)
  if (activeLegends.length === 0 && !children) {
    return null;
  }

  // Minimized state - just a small button
  if (isMinimized) {
    return (
      <div data-floating-legend className="absolute bottom-12 right-4 z-30">
        <button
          onClick={() => {
            setIsMinimized(false);
            if (onMinimizeToggle) onMinimizeToggle(false);
          }}
          className="bg-white/95 backdrop-blur-sm border border-[#E5E7EB] rounded-lg px-3 py-2 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group"
        >
          <Layers className="w-4 h-4 text-[#2563EB]" />
          <span className="text-[10px] font-semibold text-[#0F172A]">Legends</span>
          <Maximize2 className="w-3 h-3 text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    );
  }

  return (
    <>
    <div data-floating-legend className="absolute bottom-12 right-4 z-30 w-56">
      {/* Glassmorphism container */}
      <div className="bg-white/95 backdrop-blur-md border border-[#E5E7EB] rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-white" />
              <h3 className="text-white font-semibold text-[11px]">Legends</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsMinimized(true);
                  if (onMinimizeToggle) onMinimizeToggle(true);
                }}
                className="text-white/80 hover:text-white transition-colors p-0.5"
                title="Minimize"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content - Always Expanded */}
        <div className="max-h-[320px] overflow-y-auto">
          <div className="p-2 space-y-2">
            {children}
            {activeLegends.map(({ id, legend }) => {
                const isPolygon = legend.type === 'polygon';
                const LayerIcon = getLayerIcon(activeLayerId, id);

                return (
                  <div key={id} className="bg-white border border-[#E5E7EB] rounded-md overflow-hidden shadow-sm">
                    {/* Legend Header - Non-clickable */}
                    <div className="bg-gradient-to-r from-[#F8FAFC] to-white px-2.5 py-1.5 border-b border-[#E5E7EB]">
                      <div className="flex items-center gap-1.5">
                        <LayerIcon className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span className="text-[10px] font-semibold text-[#0F172A] truncate">
                          {legend.name}
                        </span>
                      </div>
                    </div>

                    {/* Legend Content - Always Visible */}
                    <div className="px-2.5 py-2 bg-gradient-to-br from-[#FAFBFC] to-white space-y-2">
                      {/* For Polygon (Hazard) Layers - Show Full Item List */}
                      {isPolygon ? (
                        <>
                          <div className="space-y-1.5">
                            {legend.classes.map((cls, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                {(cls as LegendClass).outlineStyle ? (
                                  /* Open square for boundary/region entries (e.g. Sewer Suitable Region) */
                                  <div
                                    className="w-3 h-3 flex-shrink-0"
                                    style={{
                                      border: `2px solid ${cls.color}`,
                                      borderRadius: '2px',
                                      backgroundColor: 'transparent',
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="w-3 h-3 rounded shadow-sm flex-shrink-0"
                                    style={{ backgroundColor: cls.color }}
                                  />
                                )}
                                <div className="flex-1 min-w-0 flex items-center justify-between">
                                  {/* For AQI, show range first, then description */}
                                  {activeLayerId.includes('air') ? (
                                    <>
                                      <span className="text-[9px] text-[#1F2937] font-semibold flex-shrink-0">
                                        {cls.label}
                                      </span>
                                      <span className="text-[9px] text-[#6B7280] flex-shrink-0 ml-2">
                                        {cls.value}
                                      </span>
                                    </>
                                  ) : cls.value ? (
                                    <>
                                      <span className="text-[10px] text-[#1F2937] font-medium truncate flex-1">
                                        {cls.label}
                                      </span>
                                      {legendBreakdownByClass[String(cls.label).toLowerCase()] != null && (
                                        <span className="text-[10px] font-semibold text-[#0F172A] tabular-nums ml-2 flex-shrink-0">
                                          {legendBreakdownByClass[String(cls.label).toLowerCase()].toFixed(1)}%
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-[10px] text-[#1F2937] font-medium truncate flex-1">
                                        {cls.label}
                                      </span>
                                      {legendBreakdownByClass[String(cls.label).toLowerCase()] != null && (
                                        <span className="text-[10px] font-semibold text-[#0F172A] tabular-nums ml-2 flex-shrink-0">
                                          {legendBreakdownByClass[String(cls.label).toLowerCase()].toFixed(1)}%
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Opacity Control - For main hazard layer, elevation, and building layers */}
                          {(id === 'main' || id === 'elevation') && (
                            <div className="pt-1.5 border-t border-[#E5E7EB]">
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={(layerOpacities[id === 'main' ? activeLayerId : id] || 0.7) * 100}
                                  onChange={(e) => onLayerOpacityChange(id === 'main' ? activeLayerId : id, Number(e.target.value) / 100)}
                                  className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2563EB] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm hover:[&::-webkit-slider-thumb]:bg-[#1D4ED8] [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#2563EB] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent"
                                  style={{
                                    background: `linear-gradient(to right, #2563EB 0%, #2563EB ${(layerOpacities[id === 'main' ? activeLayerId : id] || 0.7) * 100}%, #E5E7EB ${(layerOpacities[id === 'main' ? activeLayerId : id] || 0.7) * 100}%, #E5E7EB 100%)`
                                  }}
                                />
                                <span className="text-[9px] font-semibold text-[#2563EB] w-7 text-right flex-shrink-0">
                                  {Math.round((layerOpacities[id === 'main' ? activeLayerId : id] || 0.7) * 100)}%
                                </span>
                              </div>
                            </div>
                          )}
                          {/* Buildings sewer opacity slider — keyed to layerOpacities['grid_sewer'], same UI as hazard sliders */}
                          {id === 'buildings_sewer' && (
                            <div className="pt-1.5 border-t border-[#E5E7EB]">
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={(layerOpacities['grid_sewer'] ?? 0.75) * 100}
                                  onChange={(e) => onLayerOpacityChange('grid_sewer', Number(e.target.value) / 100)}
                                  className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2563EB] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm hover:[&::-webkit-slider-thumb]:bg-[#1D4ED8] [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#2563EB] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent"
                                  style={{
                                    background: `linear-gradient(to right, #2563EB 0%, #2563EB ${(layerOpacities['grid_sewer'] ?? 0.75) * 100}%, #E5E7EB ${(layerOpacities['grid_sewer'] ?? 0.75) * 100}%, #E5E7EB 100%)`
                                  }}
                                />
                                <span className="text-[9px] font-semibold text-[#2563EB] w-7 text-right flex-shrink-0">
                                  {Math.round((layerOpacities['grid_sewer'] ?? 0.75) * 100)}%
                                </span>
                              </div>
                            </div>
                          )}
                          {/* Building opacity slider — shown inside building legend cards */}
                          {(id === 'buildings' || id === 'building_height' || id === 'building_area' || id === 'economic_vulnerability') && (
                            <div className="pt-1.5 border-t border-[#E5E7EB]">
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={Math.round(buildingOpacity * 100)}
                                  onChange={(e) => onBuildingOpacityChange?.(Number(e.target.value) / 100)}
                                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2563EB] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm hover:[&::-webkit-slider-thumb]:bg-[#1D4ED8] [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#2563EB] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent"
                                  style={{
                                    background: `linear-gradient(to right, #2563EB 0%, #2563EB ${Math.round(buildingOpacity * 100)}%, #E5E7EB ${Math.round(buildingOpacity * 100)}%, #E5E7EB 100%)`
                                  }}
                                />
                                <span className="text-[9px] font-semibold text-[#2563EB] w-7 text-right flex-shrink-0">
                                  {Math.round(buildingOpacity * 100)}%
                                </span>
                              </div>
                            </div>
                          )}                          {/* Fleet Accessibility opacity slider (Module 3) */}
                          {id === 'fleet_accessibility' && (
                            <div className="pt-1.5 border-t border-[#E5E7EB]">
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={Math.round(fleetOpacity * 100)}
                                  onChange={(e) => onFleetOpacityChange?.(Number(e.target.value) / 100)}
                                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2563EB] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm hover:[&::-webkit-slider-thumb]:bg-[#1D4ED8] [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#2563EB] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent"
                                  style={{
                                    background: `linear-gradient(to right, #2563EB 0%, #2563EB ${Math.round(fleetOpacity * 100)}%, #E5E7EB ${Math.round(fleetOpacity * 100)}%, #E5E7EB 100%)`
                                  }}
                                />
                                <span className="text-[9px] font-semibold text-[#2563EB] w-7 text-right flex-shrink-0">
                                  {Math.round(fleetOpacity * 100)}%
                                </span>
                              </div>
                            </div>
                          )}
                          {/* FSTP Travel Time opacity slider (Module 3) */}
                          {id === 'fstp_travel_time' && (
                            <div className="pt-1.5 border-t border-[#E5E7EB]">
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={Math.round(fstpOpacity * 100)}
                                  onChange={(e) => onFstpOpacityChange?.(Number(e.target.value) / 100)}
                                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#2563EB] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm hover:[&::-webkit-slider-thumb]:bg-[#1D4ED8] [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#2563EB] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent"
                                  style={{
                                    background: `linear-gradient(to right, #2563EB 0%, #2563EB ${Math.round(fstpOpacity * 100)}%, #E5E7EB ${Math.round(fstpOpacity * 100)}%, #E5E7EB 100%)`
                                  }}
                                />
                                <span className="text-[9px] font-semibold text-[#2563EB] w-7 text-right flex-shrink-0">
                                  {Math.round(fstpOpacity * 100)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        /* For Line Layers (Road Network) - Show Item List */
                        <div className="space-y-1.5">
                          {legend.classes.map((cls, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="w-8 flex items-center justify-center flex-shrink-0">
                                <div
                                  className="w-full rounded-full"
                                  style={{ 
                                    backgroundColor: cls.color,
                                    height: `${cls.width}px`
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0 flex items-center justify-between">
                                <span className="text-[10px] text-[#1F2937] font-medium truncate">
                                  {cls.label}
                                </span>
                                {cls.km && (
                                  <span className="text-[9px] text-[#6B7280] flex-shrink-0 ml-2">
                                    {cls.km}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {/* Render additional items if they exist */}
                          {legend.additionalItems && legend.additionalItems.map((item, itemIdx) => (
                            <div key={`additional-${itemIdx}`} className="pt-1.5 mt-1.5 border-t border-[#E5E7EB]">
                              {/* Additional item classes - no header title */}
                              <div className="space-y-1">
                                {item.classes.map((cls, clsIdx) => (
                                  <div key={clsIdx} className="flex items-center gap-2">
                                    {item.type === 'point' && cls.symbol === 'circle' ? (
                                      <div className="w-8 flex items-center justify-center flex-shrink-0">
                                        <div
                                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                                          style={{ backgroundColor: cls.color }}
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-8 flex items-center justify-center flex-shrink-0">
                                        <div
                                          className="w-full rounded-full"
                                          style={{ 
                                            backgroundColor: cls.color,
                                            height: `${cls.width || 2}px`
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <span className="text-[10px] text-[#1F2937] font-medium truncate">
                                        {cls.label}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>

    {/* Floating tooltip portal */}
    {legendTooltip && (
      <div
        className="fixed pointer-events-none w-56"
        style={{ left: legendTooltip.x, top: legendTooltip.y, transform: 'translateY(-50%)', zIndex: 99999 }}
      >
        <div
          className="rounded-lg border px-3 py-2"
          style={{
            background: '#FFFFFF',
            borderColor: '#E2E8F0',
            boxShadow: '0 4px 24px -4px rgba(0,0,0,0.1), 0 2px 8px -2px rgba(0,0,0,0.06)',
          }}
        >
          <div className="text-[11px] leading-relaxed" style={{ fontWeight: 450, fontStyle: 'italic', color: '#475569' }}>
            {legendTooltip.text}
          </div>
        </div>
      </div>
    )}
  </>
  );
}