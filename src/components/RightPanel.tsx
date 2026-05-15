import React, { useRef, useEffect, useState } from 'react';
import { Download, AlertTriangle, TrendingUp, Building2, Users, School, Heart, Route, MapPin, Droplets, Wind, Flame, Waves, GraduationCap, BookOpen, Baby, Cross, Home, TreePine, ShieldAlert, Mail, Phone, ShoppingBag, PlayCircle, Church, Store, Plane, Bus, Fuel, Train, Network, Car, Bike, User, CircleDot, Zap, Landmark, Leaf, Check, Thermometer, Sun, CloudRain, Cloud, Eye } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import type { Sector, Scenario } from '../App';
import { AreaDistributionChart } from './AreaDistributionChart';
import { fetchEducationCounts, getEducationHazardExposure } from '../utils/educationData';
import { fetchHealthcareCounts, getHealthcareHazardExposure } from '../utils/healthcareData';
import {
  getTotalPublicAmenitiesCount,
  getTotalTransportCount,
  getPublicAmenitiesCounts,
  getTransportCounts,
  getPublicAmenitiesHazardExposure,
  getTransportHazardExposure
} from '../utils/infrastructureData';
import { formatHazardExposure, calculateHazardExposure, type HazardExposure } from '../utils/hazardExposure';
// roadSafetyData removed
import {
  fetchHazardLegend,
  fetchInfrastructurePointCounts,
  buildChartRows,
  impactDataCache,
  type ChartRow
} from '../utils/impactDistributionData';
import { ImpactDistributionDataDriven } from './ImpactDistributionDataDriven';
import { DetailedBreakdownDataDriven } from './DetailedBreakdownDataDriven';
import { useRoadNetworkData } from '../hooks/useRoadNetworkData';
import { RoadNetworkStackedBarChart } from './RoadNetworkStackedBarChart';
// road safety hooks/components removed
import { useKPIAreaData } from '../hooks/useKPIAreaData';
import { useHazardKPI, formatKPIValue, formatKPIPercentage } from '../hooks/useHazardKPI';
import type { Scenario as ScenarioType } from '../utils/hazardKpiConfig';
import { useBuildingHazard } from '../hooks/useBuildingHazard';
import { ClimateScenarioComparison } from './ClimateScenarioComparison';
import { KPI_LABELS, getHazardExposureSubtitle } from '../data/kpiLabels';
import * as HeatStressContent from '../data/heatStressContent';
import * as AirPollutionContent from '../data/airPollutionContent';
import * as FloodContent from '../data/floodContent';
import * as MultiHazardContent from '../data/multiHazardContent';
import { LayerAreaBreakdown } from './LayerAreaBreakdown';

interface RightPanelProps {
  activeSector: Sector;
  activeLayerId: string;
  selectedWard: string | null;
  selectedWardName?: string;
  scenario: Scenario;
  activeInfraLayers: string[];
  activeEducationSubLayers: string[];
  activeHealthcareSubLayers: string[];
  activePublicAmenitiesSubLayers: string[];
  activeTransportSubLayers: string[];
  activeRoadSafetySubLayers: string[];
  activeBaseLayers: string[];
  selectedWardId?: string;
  selectedRoadName?: string;
  activeHazardLayerId?: string;
  activeHazardKey?: string;
  selectedRoadStarSegment?: { roadName: string; starRating: string; vehicleType: string } | null; // NEW
  onRoadStarSegmentSelect?: (segment: { roadName: string; starRating: string; vehicleType: string } | null) => void; // NEW
  onZoomToRoadStarSegment?: (roadName: string, starRating: string, vehicleType: string) => void; // NEW
  onResetBarChartFilters?: () => void; // NEW: Reset all bar chart filters
  selectedDonutCategory?: string | null; // NEW: Selected donut category for map filtering
  onDonutCategorySelect?: (category: string | null) => void; // NEW: Callback to select donut category
  // Infrastructure counts - preloaded from App.tsx
  educationCounts?: Record<string, number>;
  healthcareCounts?: Record<string, number>;
  publicAmenitiesCounts?: Record<string, number>;
  transportCounts?: Record<string, number>;
  roadNetworkStats?: Record<string, number>; // Road network statistics (km)
  selectedLguName?: string; // NEW: Selected LGU name for subtitle
  totalResidentialBuildings?: number; // NEW: Sum of Res_Buildings from loaded barangay boundaries
  totalAreaKm2?: number; // NEW: Sum of Shape_Area converted to km² from loaded barangay boundaries
  totalPopulation2024?: number; // NEW: Sum of Pop_2024 from loaded barangay boundaries
}

// Heat Stress colors
const HEAT_COLORS = {
  low: '#91CF60',
  moderate: '#FFFFBF',
  high: '#FC8D59',
  extreme: '#D73027'
};

// AQI colors
const AQI_COLORS = {
  good: '#00B050',
  moderate: '#FFFF00',
  unhealthySensitive: '#FF7E00',
  unhealthy: '#FF0000',
  veryUnhealthy: '#8F3F97',
  hazardous: '#7E0023'
};

// Flood colors
const FLOOD_COLORS = {
  noRisk: '#FFFFD9',      // No Flood Risk
  low: '#97D6B9',         // Waterlogging Risk
  moderate: '#1F80B8',    // Flood Susceptible Area
  high: '#081D58',        // High Flood Risk
  veryHigh: '#081D58'     // High Flood Risk (same as high)
};

// Multi-Hazard colors
const MULTI_HAZARD_COLORS = {
  low: '#1A9850',         // Minimal Impact
  moderate: '#91CF60',    // Manageable Impact
  high: '#F46D43',        // Significant Impact
  veryHigh: '#D73027'     // Severe Impact
};

// Sub-layer display names mapping
const SUB_LAYER_NAMES: Record<string, string> = {
  // Heat Stress sub-layers
  'heat_hhi': 'Heat Hazard Index',
  'heat_lst': 'Land Surface Temperature',
  'heat_ast': 'Air Surface Temperature',
  'heat_rh': 'Relative Humidity',
  'heat_wbt': 'Wet-Bulb Temperature',
  'heat_wbgt': 'Wet-Bulb Globe Temperature',
  'heat_uhi': 'Urban Heat Island',
  'heat_ndvi': 'NDVI',
  
  // Air Pollution sub-layers
  'air_aqi': 'Air Quality Index',
  'air_no2': 'NO₂ (Nitrogen Dioxide)',
  'air_so2': 'SO₂ (Sulfur Dioxide)',
  'air_co': 'CO (Carbon Monoxide)',
  'air_pm10': 'PM₁₀ (Particulate Matter)',
  'air_pm25': 'PM₂.₅ (Particulate Matter)',
  'air_o3': 'O₃ (Ozone)',
  
  // Flood sub-layers
  'flood_fhi': 'Urban Flooding',
  'flood_susceptibility': 'Flood Susceptibility',
  'flood_waterlogging': 'Waterlogging Risk',
  
  // Multi-Hazard sub-layers
  'multihazard_assessment': 'Multi-Hazard Assessment',
  'multihazard_heatflood': 'Heat-Flood Combined',
  'multihazard_heatair': 'Heat-Air Combined'
};

// Simplified helper function - no longer includes layer name since it's in the main heading
function getBuildingExposureTitle(layerId: string): string {
  return 'Buildings Exposed';
}

// Helper function to map healthcare sublayer IDs to healthcareCounts keys
// Sublayer IDs use underscores (e.g., 'health_centre'), but GeoServer returns keys with spaces (e.g., 'health centre')
const getHealthcareCountKey = (sublayerId: string): string => {
  const mapping: Record<string, string> = {
    'hospital': 'hospital',
    'health_centre': 'health centre',
    'nursing_home': 'nursing home',
  };
  return mapping[sublayerId] || sublayerId;
};

// Helper function to map public amenities sublayer IDs to publicAmenitiesCounts keys
// Sublayer IDs use underscores (e.g., 'community_centre'), but GeoServer returns keys with spaces (e.g., 'community centre')
const getPublicAmenitiesCountKey = (sublayerId: string): string => {
  const mapping: Record<string, string> = {
    'community_centre': 'community centre',
    'culture_centre': 'culture centre',
    'fire_station': 'fire station',
    'government_buildings': 'government buildings',
    'park': 'park',
    'petrol_pump': 'petrol pump',
    'playground_stadium': 'playground/stadium',
    'police_outpost': 'police outpost',
    'religious': 'religious',
    'telephone_exchange': 'telephone exchange',
    'haat_market': 'haat/ market',
    'vending_zones': 'vending zones',
  };
  return mapping[sublayerId] || sublayerId;
};

// Helper function to map transport sublayer IDs to transportCounts keys
// Sublayer IDs use underscores (e.g., 'bus_stop'), but GeoServer returns keys with spaces (e.g., 'bus stop')
const getTransportCountKey = (sublayerId: string): string => {
  const mapping: Record<string, string> = {
    'airport': 'airport',
    'bus_terminal': 'bus terminal',
    'bus_stop': 'bus stop',
    'ev_charging': 'ev charging',
    'railway_station': 'railway station',
  };
  return mapping[sublayerId] || sublayerId;
};

// Scenario Planning Data (only for Heat Stress)
const HEAT_SCENARIO_DATA = {
  baseline_2025: {
    totalArea: 422,
    highExtremeArea: 422,
    buildings: 8245,
    buildingsAtRisk: 2847,
    infrastructure: 824,
    wards: 45,
    roadNetwork: 285,
    avgHeatIndex: 7.2,
    peakTemp: 43.5,
    criticalInfrastructure: 284,
    educationHigh: 89,
    healthcareHigh: 12,
    publicAmenitiesHigh: 67,
    transportHigh: 145,
    exposedPopulation: 1450000,
  },
  ssp1_2040: {
    totalArea: 478,
    highExtremeArea: 478,
    buildings: 9580,
    buildingsAtRisk: 3345,
    infrastructure: 945,
    wards: 52,
    roadNetwork: 312,
    avgHeatIndex: 7.8,
    peakTemp: 44.8,
    criticalInfrastructure: 342,
    educationHigh: 112,
    healthcareHigh: 15,
    publicAmenitiesHigh: 78,
    transportHigh: 168,
    exposedPopulation: 1680000,
  },
  ssp2_2040: {
    totalArea: 534,
    highExtremeArea: 534,
    buildings: 10790,
    buildingsAtRisk: 3912,
    infrastructure: 1067,
    wards: 58,
    roadNetwork: 348,
    avgHeatIndex: 8.4,
    peakTemp: 46.2,
    criticalInfrastructure: 398,
    educationHigh: 134,
    healthcareHigh: 18,
    publicAmenitiesHigh: 89,
    transportHigh: 201,
    exposedPopulation: 1890000,
  },
  ssp5_2040: {
    totalArea: 612,
    highExtremeArea: 612,
    buildings: 12045,
    buildingsAtRisk: 4567,
    infrastructure: 1245,
    wards: 63,
    roadNetwork: 392,
    avgHeatIndex: 9.1,
    peakTemp: 47.9,
    criticalInfrastructure: 478,
    educationHigh: 156,
    healthcareHigh: 23,
    publicAmenitiesHigh: 102,
    transportHigh: 234,
    exposedPopulation: 2150000,
  }
};

// Helper function to get scenario label
function getScenarioLabel(scenario: Scenario): string {
  const labels: Record<Scenario, string> = {
    baseline_2025: '2025 Baseline',
    ssp1_2040: 'SSP1-2040 (Sustainability)',
    ssp2_2040: 'SSP2-2040 (Middle Road)',
    ssp5_2040: 'SSP5-2040 (Fossil-fueled)'
  };
  return labels[scenario];
}

// Helper function to calculate percentage change from baseline
function calculateChange(baselineValue: number, scenarioValue: number): { value: number, isIncrease: boolean } {
  const change = ((scenarioValue - baselineValue) / baselineValue) * 100;
  return {
    value: Math.abs(change),
    isIncrease: change > 0
  };
}

// ==================== Road Safety IRAP View ====================
interface RoadSafetyIRAPViewProps {
  activeSector: Sector;
  scenario: Scenario;
  activeRoadSafetySubLayers: string[];
  activeLayerId: string;
  selectedWardId?: string;
  selectedRoadName?: string;
  selectedRoadStarSegment?: { roadName: string; starRating: string; vehicleType: string } | null;
  onRoadStarSegmentSelect?: (segment: { roadName: string; starRating: string; vehicleType: string } | null) => void;
  onZoomToRoadStarSegment?: (roadName: string, starRating: string, vehicleType: string) => void;
  onResetBarChartFilters?: () => void; // NEW: Reset all bar chart filters
}

function RoadSafetyIRAPView({ 
  activeSector,
  scenario,
  activeRoadSafetySubLayers,
  activeLayerId,
  selectedWardId = 'all',
  selectedRoadName = 'all',
  selectedRoadStarSegment = null,
  onRoadStarSegmentSelect,
  onZoomToRoadStarSegment,
  onResetBarChartFilters // NEW: Accept the reset callback
}: RoadSafetyIRAPViewProps) {
  
  // road safety filters stubbed
  const availableFilters: any = {};
  const appliedFilters: any = {};
  const isLoadingFilters = false;
  const updateFilter = (_k: string, _v: any) => {};
  const resetFilters = () => {};
  const hasActiveFilters = false;
  
  // Auto-update vehicle_type filter based on active road safety sub-layer from left panel
  useEffect(() => {
    // Map iRAP sub-layer IDs to API vehicle_type values
    const vehicleTypeMapping: Record<string, string> = {
      'irap_vehicle': 'vehicle',
      'irap_motorcycle': 'motorcycle',
      'irap_pedestrian': 'pedestrian',
      'irap_bicycle': 'bicyclist' // Note: API uses 'bicyclist' not 'bicycle'
    };
    
    // If a road safety sub-layer is active, automatically set the vehicle_type filter
    if (activeRoadSafetySubLayers.length > 0) {
      const activeSubLayer = activeRoadSafetySubLayers[0]; // Use first active sub-layer
      const vehicleType = vehicleTypeMapping[activeSubLayer];
      
      if (vehicleType && appliedFilters.vehicle_type !== vehicleType) {
        console.log(`🚗 [RightPanel] Auto-setting vehicle_type filter to: ${vehicleType} (from sub-layer: ${activeSubLayer})`);
        updateFilter('vehicle_type', vehicleType);
      }
    } else {
      // If no road safety sub-layer is active, clear the vehicle_type filter
      if (appliedFilters.vehicle_type) {
        console.log('🚗 [RightPanel] Clearing vehicle_type filter (no sub-layer active)');
        updateFilter('vehicle_type', null);
      }
    }
  }, [activeRoadSafetySubLayers, appliedFilters.vehicle_type, updateFilter]);
  
  // Auto-sync road_name filter from Header dropdown to road safety filters
  useEffect(() => {
    // Only sync when road safety layers are active
    if (activeRoadSafetySubLayers.length > 0 && selectedRoadName !== undefined) {
      const roadNameValue = selectedRoadName === 'all' ? null : selectedRoadName;
      
      if (appliedFilters.road_name !== roadNameValue) {
        console.log(`🛣️ [RightPanel] Auto-syncing road_name filter from Header:`, roadNameValue || 'all');
        updateFilter('road_name', roadNameValue);
      }
    }
  }, [selectedRoadName, appliedFilters.road_name, updateFilter, activeRoadSafetySubLayers]);
  
  // Auto-sync ward filter from main app (WardFilterBar) to road safety filters
  useEffect(() => {
    // Only sync when road safety layers are active
    if (activeRoadSafetySubLayers.length > 0 && selectedWardId !== undefined) {
      const wardValue = selectedWardId === 'all' ? null : selectedWardId;
      
      if (appliedFilters.ward !== wardValue) {
        console.log(`📍 [RightPanel] Auto-syncing ward filter from WardFilterBar:`, wardValue || 'all');
        updateFilter('ward', wardValue);
      }
    }
  }, [selectedWardId, appliedFilters.ward, updateFilter, activeRoadSafetySubLayers]);
  
  // Fetch road network hazard analysis data from backend API
  const roadNetworkAnalysisData = useRoadNetworkData(activeLayerId, scenario, selectedWardId);
  
  // Fetch road safety hazard analysis data from backend API with filters
  // For rsMain (Road Safety sector), use a default hazard layer if activeLayerId is empty
  const effectiveLayerId = activeSector === 'roadsafety' && !activeLayerId 
    ? 'heat_ast' // Default to a basic hazard layer for pure star rating analysis
    : activeLayerId;
  const roadSafetyAnalysisData = { data: null, loading: false };
  
  // State for road safety star rating data
  const [roadSafetyData, setRoadSafetyData] = useState({
    irap_vehicle: {
      totalLength: 0,
      '5star': 0,
      '4star': 0,
      '3star': 0,
      '2star': 0,
      '1star': 0
    },
    irap_pedestrian: {
      totalLength: 0,
      '5star': 0,
      '4star': 0,
      '3star': 0,
      '2star': 0,
      '1star': 0
    },
    irap_motorcycle: {
      totalLength: 0,
      '5star': 0,
      '4star': 0,
      '3star': 0,
      '2star': 0,
      '1star': 0
    },
    irap_bicycle: {
      totalLength: 0,
      '5star': 0,
      '4star': 0,
      '3star': 0,
      '2star': 0,
      '1star': 0
    }
  });

  // fetchRoadSafetyStarRatings removed
  
  // Star rating colors
  const STAR_COLORS = {
    '5star': '#93c060',  // Green - Safest
    '4star': '#fdf05e',  // Yellow
    '3star': '#eda308',  // Amber/Orange
    '2star': '#e65336',  // Red
    '1star': '#262626',  // Black - Most dangerous
    'NA': '#9CA3AF'      // Grey - No Data
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      irap_vehicle: 'Vehicle Safety',
      irap_pedestrian: 'Pedestrian Safety',
      irap_motorcycle: 'Motorcycle Safety',
      irap_bicycle: 'Bicycle Safety'
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      irap_vehicle: Car,
      irap_pedestrian: User,
      irap_motorcycle: Bike,
      irap_bicycle: Bike
    };
    return icons[category] || Route;
  };

  return (
    <>
      {/* Road Safety Filters removed */}

      {/* Road Safety Assessment Section Header */}
      <div className="mb-3">
        <SectionHeader 
          icon={Route} 
          title="Road Safety Assessment (iRAP)" 
          color="#2563EB" 
          count="IRAP Analysis"
          variant="subtitle"
        />
      </div>

      {activeRoadSafetySubLayers.map((category) => {
        const data = roadSafetyData[category as keyof typeof roadSafetyData];
        
        // Skip if data doesn't exist for this category
        if (!data) return null;
        
        const CategoryIcon = getCategoryIcon(category);
        
        // Calculate star rating percentages
        const starDistribution = [
          { stars: '5 Star', value: data['5star'], color: STAR_COLORS['5star'], percent: (data['5star'] / data.totalLength) * 100 },
          { stars: '4 Star', value: data['4star'], color: STAR_COLORS['4star'], percent: (data['4star'] / data.totalLength) * 100 },
          { stars: '3 Star', value: data['3star'], color: STAR_COLORS['3star'], percent: (data['3star'] / data.totalLength) * 100 },
          { stars: '2 Star', value: data['2star'], color: STAR_COLORS['2star'], percent: (data['2star'] / data.totalLength) * 100 },
          { stars: '1 Star', value: data['1star'], color: STAR_COLORS['1star'], percent: (data['1star'] / data.totalLength) * 100 }
        ];

        // Chart data
        const chartData = [
          { name: '5★', value: data['5star'], fill: STAR_COLORS['5star'], totalLength: data.totalLength },
          { name: '4★', value: data['4star'], fill: STAR_COLORS['4star'], totalLength: data.totalLength },
          { name: '3★', value: data['3star'], fill: STAR_COLORS['3star'], totalLength: data.totalLength },
          { name: '2★', value: data['2star'], fill: STAR_COLORS['2star'], totalLength: data.totalLength },
          { name: '1★', value: data['1star'], fill: STAR_COLORS['1star'], totalLength: data.totalLength }
        ];

        return (
          <div key={category}>
            {/* Category Header */}
            <div className="flex items-center gap-2 mb-3">
              <CategoryIcon className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-[11px] font-semibold text-[#0F172A]">{getCategoryLabel(category)}</h3>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                <KPITile
                  title={KPI_LABELS.roadSafety.safeRoads.title}
                  value={`${(() => {
                    const val = data['3star'] + data['4star'] + data['5star'];
                    return val % 1 === 0 ? val : val.toFixed(1);
                  })()} km`}
                  subtitle={KPI_LABELS.roadSafety.safeRoads.subtitle}
                  color="#10B981"
                  percentage={`${(() => {
                    if (data.totalLength === 0) return '0';
                    const pct = ((data['3star'] + data['4star'] + data['5star']) / data.totalLength) * 100;
                    return pct % 1 === 0 ? pct : pct.toFixed(1);
                  })()}%`}
                />
                <KPITile
                  title={KPI_LABELS.roadSafety.unsafeRoads.title}
                  value={`${(() => {
                    const val = data['1star'] + data['2star'];
                    return val % 1 === 0 ? val : val.toFixed(1);
                  })()} km`}
                  subtitle={KPI_LABELS.roadSafety.unsafeRoads.subtitle}
                  color="#EF4444"
                  percentage={`${(() => {
                    if (data.totalLength === 0) return '0';
                    const pct = ((data['1star'] + data['2star']) / data.totalLength) * 100;
                    return pct % 1 === 0 ? pct : pct.toFixed(1);
                  })()}%`}
                />
              </div>

            {/* Star Rating Distribution Chart */}
            <div className="border border-[#E5E7EB] rounded-lg p-3 bg-gradient-to-br from-white to-gray-50/50 shadow-sm mb-3 relative overflow-hidden">
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#2563EB]/5 to-transparent rounded-bl-full"></div>
              
              <h3 className="text-[11px] font-semibold text-[#0F172A] mb-2 px-0.5 relative z-10">Star Rating Distribution</h3>
              
              <div className="relative">
                {/* Center Text with total km */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center bg-white/80 backdrop-blur-sm rounded-full w-[70px] h-[70px] flex flex-col items-center justify-center shadow-sm">
                    <div className="text-[16px] font-bold text-[#0F172A] leading-none">
                      {data.totalLength.toFixed(1)}
                    </div>
                    <div className="text-[9px] font-medium text-gray-500 mt-0.5">km</div>
                  </div>
                </div>
                
                {/* Chart wrapper with higher z-index */}
                <div className="relative z-10">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.fill}
                            stroke="#fff"
                            strokeWidth={1}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<RoadSafetyTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Road Network Hazard Analysis from Backend API */}
      <div className="mt-3">
        {/* Loading State */}
        {roadNetworkAnalysisData.loading && (
          <div className="border border-[#E5E7EB] rounded-lg p-6 bg-white shadow-sm mb-3">
            <div className="flex items-start gap-3">
              <div className="relative w-6 h-6 flex-shrink-0 mt-0.5">
                <div className="absolute inset-0 border-2 border-amber-100 rounded-full" />
                <div className="absolute inset-0 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-[10px] text-[#64748B] font-medium">Processing road network spatial analysis...</div>
                <div className="text-[9px] text-[#64748B] mt-1">⏱️ Large dataset processing: This may take 2-5 minutes on first request</div>
                <div className="text-[9px] text-[#2563EB] mt-2 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Tip: Select a specific ward from the filter bar above to speed up processing
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {roadNetworkAnalysisData.error && !roadNetworkAnalysisData.loading && (
          <div className="border border-[#FCA5A5] bg-[#FEF2F2] rounded-lg p-5 shadow-sm mb-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-[#EF4444] mb-1">Failed to load road network data</div>
                <div className="text-[9px] text-[#7F1D1D] mb-2">{roadNetworkAnalysisData.error}</div>
                {roadNetworkAnalysisData.error.includes('timeout') && (
                  <div className="mt-2 p-2 bg-white/50 rounded border border-[#FCA5A5] text-[9px] text-[#7F1D1D]">
                    <div className="font-semibold mb-1">💡 Recommended Actions:</div>
                    <ul className="list-disc list-inside space-y-0.5 ml-1">
                      <li>Wait 30 seconds and refresh the page</li>
                      <li>Select a specific ward to reduce dataset size</li>
                      <li>The backend caches results, so subsequent requests are instant</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Data Display */}
        {roadNetworkAnalysisData.data && !roadNetworkAnalysisData.loading && (
          <>
            {/* Stacked Horizontal Bar Chart - Road Type Breakdown */}
            <RoadNetworkStackedBarChart data={roadNetworkAnalysisData.data} hasActiveRoadSafety={true} />
          </>
        )}
      </div>

      {/* Road Safety Analysis - Different for rsMain vs Cross-Hazard */}
      {activeSector === 'roadsafety' ? (
        // rsMain: Show Road Name Star Rating Distribution
        <div className="mt-3">
          <SectionHeader 
            icon={Route} 
            title="Road Name Star Rating Distribution"
            color="#EF4444"
          />
          
          {/* Road Name Star Rating Distribution Chart - Fetches directly from GeoServer */}
          {/* RoadNameStarRatingChart removed */}
        </div>
      ) : (
        // Cross-Hazard Panels: Show original Road Safety Hazard Analysis
        <div className="mt-3">
          <SectionHeader 
            icon={Route} 
            title="Road Safety Hazard Analysis"
            color="#EF4444"
            count={roadSafetyAnalysisData.data?.total_length_km ? `${roadSafetyAnalysisData.data.total_length_km.toFixed(1)} km` : undefined}
          />
          
          {/* Loading State */}
          {roadSafetyAnalysisData.loading && (
            <div className="border border-[#FEE2E2] bg-[#FFF5F5] rounded-xl p-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="relative w-6 h-6 flex-shrink-0">
                  <div className="absolute inset-0 border-2 border-red-100 rounded-full" />
                  <div className="absolute inset-0 border-2 border-[#EF4444] border-t-transparent rounded-full animate-spin" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-red-700">Analysing road safety…</p>
                  <p className="text-[9px] text-red-600/70 mt-0.5">Computing road-level hazard exposure</p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {roadSafetyAnalysisData.error && !roadSafetyAnalysisData.loading && (
            <div className="border border-[#E5E7EB] rounded-lg p-6 bg-white shadow-sm mb-3 text-center">
              <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
              <div className="text-[10px] text-[#EF4444]">Failed to load road safety data</div>
              <div className="text-[9px] text-[#64748B] mt-1">{roadSafetyAnalysisData.error}</div>
            </div>
          )}

          {/* Data Display */}
          {roadSafetyAnalysisData.data && !roadSafetyAnalysisData.loading && (
            <>
              {/* Stacked Horizontal Bar Chart - Individual Roads with Hazard Breakdown */}
              {/* RoadSafetyStackedBarChart removed */}
            </>
          )}
        </div>
      )}
    </>
  );
}

export function RightPanel({ 
  activeSector, 
  activeLayerId, 
  selectedWard,
  selectedWardName,
  scenario,
  activeInfraLayers,
  activeEducationSubLayers,
  activeHealthcareSubLayers,
  activePublicAmenitiesSubLayers,
  activeTransportSubLayers,
  activeRoadSafetySubLayers,
  activeBaseLayers,
  selectedWardId = 'all',
  selectedRoadName = 'all',
  activeHazardLayerId = '',
  activeHazardKey = '',
  selectedRoadStarSegment = null,
  onRoadStarSegmentSelect,
  onZoomToRoadStarSegment,
  onResetBarChartFilters, // NEW: Accept the reset callback
  selectedDonutCategory = null, // NEW: Selected donut category
  onDonutCategorySelect, // NEW: Callback to select donut category
  educationCounts: propEducationCounts = {},
  healthcareCounts: propHealthcareCounts = {},
  publicAmenitiesCounts: propPublicAmenitiesCounts = {},
  transportCounts: propTransportCounts = {},
  roadNetworkStats: propRoadNetworkStats = {},
  selectedLguName,
  totalResidentialBuildings = 0,
  totalAreaKm2 = 0,
  totalPopulation2024 = 0
}: RightPanelProps) {

  // Debug: Log what we're receiving
  console.log('🏠 [RightPanel] Received totalResidentialBuildings:', totalResidentialBuildings);
  console.log('📐 [RightPanel] Received totalAreaKm2:', totalAreaKm2.toFixed(2), 'km²');
  console.log('👥 [RightPanel] Received totalPopulation2024:', totalPopulation2024.toLocaleString());

  // State for infrastructure counts
  const [educationCounts, setEducationCounts] = useState<Record<string, number>>({});
  const [healthcareCounts, setHealthcareCounts] = useState<Record<string, number>>({});
  const [publicAmenitiesCounts, setPublicAmenitiesCounts] = useState<Record<string, number>>({});
  const [transportCounts, setTransportCounts] = useState<Record<string, number>>({});

  // State for hazard exposure
  const [educationExposure, setEducationExposure] = useState<HazardExposure>({ extreme: 0, high: 0, total: 0 });
  const [healthcareExposure, setHealthcareExposure] = useState<HazardExposure>({ extreme: 0, high: 0, total: 0 });
  const [publicAmenitiesExposure, setPublicAmenitiesExposure] = useState<HazardExposure>({ extreme: 0, high: 0, total: 0 });
  const [transportExposure, setTransportExposure] = useState<HazardExposure>({ extreme: 0, high: 0, total: 0 });

  // Fetch all infrastructure counts in parallel when ward changes
  useEffect(() => {
    let isCancelled = false;
    
    const loadAllInfrastructureCounts = async () => {
      try {
        // Fetch all counts in parallel for better performance
        const [eduCounts, healthCounts, amenitiesCounts, transCounts] = await Promise.all([
          fetchEducationCounts(selectedWardId),
          fetchHealthcareCounts(selectedWardId),
          getPublicAmenitiesCounts(selectedWardId),
          getTransportCounts(selectedWardId)
        ]);
        
        if (!isCancelled) {
          setEducationCounts(eduCounts);
          setHealthcareCounts(healthCounts);
          setPublicAmenitiesCounts(amenitiesCounts);
          setTransportCounts(transCounts);
        }
      } catch (error) {
        console.error('Error loading infrastructure counts:', error);
      }
    };
    
    loadAllInfrastructureCounts();
    
    return () => {
      isCancelled = true;
    };
  }, [selectedWardId]);

  // Calculate hazard exposure when active layer or ward changes
  useEffect(() => {
    let isCancelled = false;
    
    const calculateExposure = async () => {
      // Get the active hazard layer ID (only if a hazard sector is active)
      const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
      
      // Clear stale data immediately when dependencies change
      if (!isCancelled) {
        setEducationExposure({ extreme: 0, high: 0, total: 0 });
        setHealthcareExposure({ extreme: 0, high: 0, total: 0 });
        setPublicAmenitiesExposure({ extreme: 0, high: 0, total: 0 });
        setTransportExposure({ extreme: 0, high: 0, total: 0 });
      }
      
      try {
        // Calculate exposure for each infrastructure type in parallel
        const [eduExposure, healthExposure, amenitiesExposure, transExposure] = await Promise.all([
          getEducationHazardExposure(selectedWardId, hazardLayerId),
          getHealthcareHazardExposure(selectedWardId, hazardLayerId),
          getPublicAmenitiesHazardExposure(selectedWardId, hazardLayerId),
          getTransportHazardExposure(selectedWardId, hazardLayerId)
        ]);
        
        if (!isCancelled) {
          setEducationExposure(eduExposure);
          setHealthcareExposure(healthExposure);
          setPublicAmenitiesExposure(amenitiesExposure);
          setTransportExposure(transExposure);
        }
      } catch (error) {
        // Silently handle fetch errors - expected when backend is unavailable
        console.log('ℹ️  Hazard exposure data not available (backend not connected)');
      }
    };
    
    calculateExposure();
    
    return () => {
      isCancelled = true;
    };
  }, [activeSector, activeLayerId, selectedWardId]);

  // Helper function to get ward name for chart titles
  const getWardDisplayName = (): string => {
    if (!selectedWardId || selectedWardId === 'all') {
      return 'Bhubaneswar';
    }
    const wardNumber = parseInt(selectedWardId.split('_')[1]);
    return `Ward ${wardNumber}`;
  };

  // Determine what to show based on active filters
  const hasActiveRoadSafety = activeRoadSafetySubLayers.length > 0;
  const hasActiveInfra = activeInfraLayers.filter(layer => layer !== 'road_safety').length > 0; // Exclude road_safety from infra check
  const hasActiveEducation = activeInfraLayers.includes('educational');
  const hasActiveHealthcare = activeInfraLayers.includes('healthcare');
  const hasActivePublicAmenities = activeInfraLayers.includes('public_amenities');
  const hasActiveTransport = activeInfraLayers.includes('transport_mobility');
  const hasActiveRoadNetwork = activeInfraLayers.includes('road_network') || activeBaseLayers.includes('road_network_base');
  const hasActiveRoadNetworkBase = activeBaseLayers.includes('road_network_base'); // Base layer only for General Overview

  // Get hazard-specific configuration
  const getHazardConfig = () => {
    // Always use "CWIS Planning Intelligence" for the default right panel
    return {
      title: 'CWIS Planning Intelligence',
      icon: Zap,
      color: '#2563EB',
      layerName: getLayerName(activeLayerId)
    };
  };

  const config = getHazardConfig();
  const HazardIcon = config.icon;

  // Generate panel title - always "CWIS Planning Intelligence" for default panel
  const getPanelTitle = () => {
    return 'CWIS Planning Intelligence';
  };

  const getPanelSubtitle = () => {
    // If a barangay is selected, show "Barangay Name Barangay, LGU Name"
    if (selectedWardName && selectedWardName !== 'all' && selectedLguName && selectedLguName !== 'all') {
      return `${selectedWardName} Barangay, ${selectedLguName}`;
    } else if (selectedWardName && selectedWardName !== 'all') {
      return `${selectedWardName} Barangay`;
    }
    
    // If an LGU is selected, show just the LGU name
    if (selectedLguName && selectedLguName !== 'All LGUs' && selectedLguName !== 'all' && selectedLguName.trim() !== '') {
      return selectedLguName;
    }
    
    // If no filter is applied, show all three LGU names with bullet separator
    return 'Tagbilaran • Dauis • Panglao';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-gradient-to-r from-[#F8FAFC] to-white px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${config.color}15` }}
          >
            <HazardIcon className="w-4 h-4" style={{ color: config.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-semibold text-[#0F172A] truncate">{getPanelTitle()}</h2>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-[#F8FAFC] [scrollbar-gutter:stable]">
        <div className="space-y-4">
          
          {/* Always show main 4 KPIs at top - EXCEPT for Road Safety sector */}
          {activeSector !== 'roadsafety' && (
            <MainKPIs activeSector={activeSector} scenario={scenario} activeLayerId={activeLayerId} selectedWardId={selectedWardId} selectedLguName={selectedLguName} selectedDonutCategory={selectedDonutCategory} onDonutCategorySelect={onDonutCategorySelect} totalResidentialBuildings={totalResidentialBuildings} totalAreaKm2={totalAreaKm2} totalPopulation2024={totalPopulation2024} panelSubtitle={getPanelSubtitle()} />
          )}

          {/* Data Layer Breakdown (Elevation, Building Use, Economic Vulnerability) */}
          {(() => {
            const dataLayerIds = ['elevation', 'building_use', 'economic_vulnerability'];
            const activeDataLayers = activeBaseLayers.filter(layer => dataLayerIds.includes(layer));
            
            if (activeDataLayers.length === 0) return null;
            
            const layerNames: Record<string, string> = {
              'elevation': 'Elevation Analysis',
              'building_use': 'Building Use Distribution',
              'economic_vulnerability': 'Economic Vulnerability'
            };
            
            return (
              <>
                {activeDataLayers.map(layerId => (
                  <div key={layerId}>
                    <LayerAreaBreakdown
                      layerId={layerId}
                      layerName={layerNames[layerId] || layerId}
                      selectedWardId={selectedWardId}
                      selectedLguName={selectedLguName}
                      selectedCategory={selectedDonutCategory}
                      onCategorySelect={onDonutCategorySelect}
                    />
                  </div>
                ))}
              </>
            );
          })()}

          {/* CASE 1: No filters - General Hazard Overview */}
          {!hasActiveInfra && !hasActiveRoadSafety && !selectedWard && (
            <GeneralHazardOverview activeSector={activeSector} activeLayerId={activeLayerId} scenario={scenario} selectedWardId={selectedWardId} hasActiveRoadNetwork={hasActiveRoadNetworkBase} hasActiveRoadSafety={hasActiveRoadSafety} selectedDonutCategory={selectedDonutCategory} onDonutCategorySelect={onDonutCategorySelect} />
          )}

          {/* CASE 2: Infrastructure layers selected, no ward - City-wide Infrastructure Impact */}
          {hasActiveInfra && !selectedWard && (
            <InfrastructureImpactView 
              activeSector={activeSector}
              activeLayerId={activeLayerId}
              scenario={scenario}
              activeInfraLayers={activeInfraLayers}
              hasActiveEducation={hasActiveEducation}
              hasActiveHealthcare={hasActiveHealthcare}
              hasActivePublicAmenities={hasActivePublicAmenities}
              hasActiveTransport={hasActiveTransport}
              hasActiveRoadNetwork={hasActiveRoadNetwork}
              hasActiveRoadSafety={hasActiveRoadSafety}
              activeEducationSubLayers={activeEducationSubLayers}
              activeHealthcareSubLayers={activeHealthcareSubLayers}
              activePublicAmenitiesSubLayers={activePublicAmenitiesSubLayers}
              activeTransportSubLayers={activeTransportSubLayers}
              educationCounts={educationCounts}
              healthcareCounts={healthcareCounts}
              publicAmenitiesCounts={publicAmenitiesCounts}
              transportCounts={transportCounts}
              selectedWardId={selectedWardId}
              educationExposure={educationExposure}
              healthcareExposure={healthcareExposure}
              publicAmenitiesExposure={publicAmenitiesExposure}
              transportExposure={transportExposure}
              activeHazardLayerId={activeHazardLayerId}
              activeHazardKey={activeHazardKey}
            />
          )}

          {/* CASE 2b: Road Safety layers selected, no ward - Road Safety IRAP Analysis */}
          {hasActiveRoadSafety && !hasActiveInfra && !selectedWard && (
            <RoadSafetyIRAPView 
              activeSector={activeSector}
              scenario={scenario}
              activeRoadSafetySubLayers={activeRoadSafetySubLayers}
              activeLayerId={activeLayerId}
              selectedWardId={selectedWardId}
              selectedRoadName={selectedRoadName}
              selectedRoadStarSegment={selectedRoadStarSegment}
              onRoadStarSegmentSelect={onRoadStarSegmentSelect}
              onZoomToRoadStarSegment={onZoomToRoadStarSegment}
              onResetBarChartFilters={onResetBarChartFilters}
            />
          )}

          {/* CASE 3: Ward selected, no infrastructure - Ward-specific Hazard Overview */}
          {!hasActiveInfra && !hasActiveRoadSafety && selectedWard && (
            <WardHazardOverview 
              activeSector={activeSector} 
              wardName={selectedWard}
            />
          )}

          {/* CASE 4: Both infrastructure and ward selected - Ward-specific Infrastructure Impact */}
          {hasActiveInfra && selectedWard && (
            <WardInfrastructureImpact 
              activeSector={activeSector}
              activeLayerId={activeLayerId}
              wardName={selectedWard}
              activeInfraLayers={activeInfraLayers}
              hasActiveEducation={hasActiveEducation}
              hasActiveHealthcare={hasActiveHealthcare}
              hasActivePublicAmenities={hasActivePublicAmenities}
              hasActiveTransport={hasActiveTransport}
              activeEducationSubLayers={activeEducationSubLayers}
              activeHealthcareSubLayers={activeHealthcareSubLayers}
              healthcareCounts={healthcareCounts}
            />
          )}

        </div>
      </div>
    </div>
  );
}

// ==================== Main 4 KPIs (Always Visible) ====================
function MainKPIs({ activeSector, scenario, activeLayerId, selectedWardId, selectedLguName, selectedDonutCategory, onDonutCategorySelect, totalResidentialBuildings = 0, totalAreaKm2 = 0, totalPopulation2024 = 0, panelSubtitle }: { 
  activeSector: Sector, 
  scenario: Scenario,
  activeLayerId: string,
  selectedWardId?: string,
  selectedLguName?: string,
  selectedDonutCategory?: string | null,
  onDonutCategorySelect?: (category: string | null) => void,
  totalResidentialBuildings?: number,
  totalAreaKm2?: number,
  totalPopulation2024?: number,
  panelSubtitle: string
}) {
  // Debug: Log the values we're receiving
  console.log('🏠 [MainKPIs] Received totalResidentialBuildings:', totalResidentialBuildings);
  console.log('📐 [MainKPIs] Received totalAreaKm2:', totalAreaKm2.toFixed(2), 'km²');
  console.log('👥 [MainKPIs] Received totalPopulation2024:', totalPopulation2024.toLocaleString());
  
  // Fetch KPI area data from GeoServer (primary layer only)
  const kpiAreaData = useKPIAreaData(activeSector, scenario, selectedWardId);

  // Convert scenario format for Hazard KPI API
  const convertScenario = (scenario: Scenario): ScenarioType | null => {
    if (scenario === 'baseline_2025') return 'baseline';
    if (scenario === 'ssp1_2040') return 'ssp1';
    if (scenario === 'ssp2_2040') return 'ssp2';
    if (scenario === 'ssp5_2040') return 'ssp5';
    return null;
  };

  // Extract ward number from selectedWardId (e.g., "ward_15" -> "15", "all" -> null)
  const getWardNumber = (wardId?: string): string | null => {
    if (!wardId || wardId === 'all') return null;
    const parts = wardId.split('_');
    return parts.length > 1 ? parts[1] : null;
  };

  // Fetch Hazard KPI data from backend API
  const hazardKPI = useHazardKPI(
    activeSector,
    activeLayerId,
    convertScenario(scenario),
    getWardNumber(selectedWardId)
  );

  // Fetch Building Hazard data from backend API
  const buildingHazard = useBuildingHazard(
    activeSector,
    activeLayerId,
    convertScenario(scenario),
    getWardNumber(selectedWardId)
  );
  
  if (activeSector === 'heat') {
    const isBaseline = scenario === 'baseline_2025';
    
    // Dummy change values for non-baseline scenarios
    const dummyChange = !isBaseline ? { value: 0, isIncrease: true } : null;

    return (
      <>
        {!isBaseline && <ScenarioBanner scenario={scenario} />}
        

        
        {/* Heat Hazard Index Overview Header */}
        <div className="mb-3">
          <SectionHeader 
            icon={MapPin} 
            title={HeatStressContent.SECTION_HEADER.title}
            color={HeatStressContent.SECTION_HEADER.color}
            subtitle={panelSubtitle}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {hazardKPI.loading ? (
            <div className="col-span-2 space-y-2 py-3 px-1">
              <div className="h-[58px] rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-[58px] rounded-xl bg-slate-100 animate-pulse opacity-60" />
            </div>
          ) : (
            <>
              <KPITileWithChange
                title={HeatStressContent.KPI_TILES.roadNetwork.title}
                value={totalPopulation2024 > 0 ? totalPopulation2024.toLocaleString() : 'Loading...'}
                subtitle={HeatStressContent.KPI_TILES.roadNetwork.subtitle}
                color={HEAT_COLORS.high}
                change={dummyChange}
                isDummy={false}
              />
              <KPITileWithChange
                title={HeatStressContent.KPI_TILES.infrastructure.title}
                value={totalAreaKm2 > 0 ? `${totalAreaKm2.toFixed(1)} km²` : 'Loading...'}
                subtitle={HeatStressContent.KPI_TILES.infrastructure.subtitle}
                color={HEAT_COLORS.extreme}
                change={dummyChange}
                isDummy={false}
              />
              <KPITileWithChange
                title={HeatStressContent.KPI_TILES.hotspots.title}
                value={totalResidentialBuildings > 0 ? `~${totalResidentialBuildings.toLocaleString()}` : 'Loading...'}
                subtitle={HeatStressContent.KPI_TILES.hotspots.subtitle}
                color={HEAT_COLORS.extreme}
                change={dummyChange}
                isDummy={false}
              />
              <KPITileWithChange
                title={HeatStressContent.KPI_TILES.buildings.title}
                value="~532"
                subtitle={HeatStressContent.KPI_TILES.buildings.subtitle}
                color={HEAT_COLORS.high}
                change={dummyChange}
                isDummy={false}
              />
            </>
          )}
        </div>

        {/* Environmental Risk Snapshot Section */}
        <div className="mt-4">
          <SectionHeader 
            icon={ShieldAlert} 
            title="Environmental Risk Snapshot"
            color="#DC2626"
          />
          
          <div className="bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] rounded-lg border border-[#E2E8F0] p-2 space-y-1.5 mt-2">
            {/* Buildings Near Water Bodies */}
            <div className="group hover:bg-white/80 rounded-md p-1.5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#0EA5E9]/10 to-[#0EA5E9]/5 flex items-center justify-center">
                    <Droplets className="w-3 h-3 text-[#0EA5E9]" />
                  </div>
                  <span className="text-[10px] font-medium text-[#475569]">Buildings Near Water Bodies</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-bold text-[#0F172A]">5,824</div>
                  <div className="text-[10px] font-medium text-[#64748B]">(10.5%)</div>
                </div>
              </div>
              <p className="text-[9px] text-[#64748B] ml-8 mt-0.5">High groundwater contamination risk</p>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent"></div>

            {/* Hard-to-Access Buildings */}
            <div className="group hover:bg-white/80 rounded-md p-1.5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F59E0B]/10 to-[#F59E0B]/5 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-[#F59E0B]" />
                  </div>
                  <span className="text-[10px] font-medium text-[#475569]">Hard-to-Access Buildings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-bold text-[#0F172A]">8,501</div>
                  <div className="text-[10px] font-medium text-[#64748B]">(15.3%)</div>
                </div>
              </div>
              <p className="text-[9px] text-[#64748B] ml-8 mt-0.5">FSM desludging service constraints</p>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent"></div>

            {/* Storm Surge Exposure */}
            <div className="group hover:bg-white/80 rounded-md p-1.5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3B82F6]/10 to-[#3B82F6]/5 flex items-center justify-center">
                    <Waves className="w-3 h-3 text-[#3B82F6]" />
                  </div>
                  <span className="text-[10px] font-medium text-[#475569]">Storm Surge Exposure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-bold text-[#0F172A]">4,698</div>
                  <div className="text-[10px] font-medium text-[#64748B]">(8.4%)</div>
                </div>
              </div>
              <p className="text-[9px] text-[#64748B] ml-8 mt-0.5">Septic tank overflow & infrastructure damage risk</p>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent"></div>

            {/* Waterlogging Hotspots */}
            <div className="group hover:bg-white/80 rounded-md p-1.5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6366F1]/10 to-[#6366F1]/5 flex items-center justify-center">
                    <CloudRain className="w-3 h-3 text-[#6366F1]" />
                  </div>
                  <span className="text-[10px] font-medium text-[#475569]">Waterlogging Hotspots</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="text-sm font-bold text-[#0F172A]">364</div>
                  <div className="text-[10px] font-medium text-[#64748B]">(0.7%)</div>
                </div>
              </div>
              <p className="text-[9px] text-[#64748B] ml-8 mt-0.5">Poor drainage limits onsite sanitation viability</p>
            </div>
          </div>
        </div>

        {/* Layer Area Breakdown - Show when Climate Hazard or Environmental Layer is selected */}
        {(() => {
          // List of Climate Hazard Layers
          const climateHazardLayers = [
            'flood_hazard', 'storm_surge', 'urban_waterlogging',
            'heat_stress_index', 'land_surface_temperature', 'urban_heat_island', 'wet_bulb_temperature'
          ];
          
          // List of Environmental Sensitivity Layers
          const environmentalLayers = [
            'soil_classification', 'groundwater_depth', 'geology', 'sinkhole'
          ];
          
          // List of Data Layers (Elevation, Building Use, Economic Vulnerability)
          const dataLayers = [
            'elevation', 'building_use', 'economic_vulnerability'
          ];
          
          // Check if current layer is a climate hazard, environmental, or data layer
          const isClimateOrEnvLayer = [...climateHazardLayers, ...environmentalLayers, ...dataLayers].includes(activeLayerId);
          
          console.log('🔍 [RightPanel] Layer check:', { activeLayerId, isClimateOrEnvLayer });
          
          if (!isClimateOrEnvLayer) return null;
          
          // Get layer display name
          const layerNames: Record<string, string> = {
            'soil_classification': 'Soil Classification',
            'groundwater_depth': 'Groundwater Depth',
            'geology': 'Geology',
            'sinkhole': 'Sinkhole Risk',
            'flood_hazard': 'Urban Flooding',
            'storm_surge': 'Storm Surge',
            'urban_waterlogging': 'Urban Waterlogging',
            'heat_stress_index': 'Heat Stress Index',
            'land_surface_temperature': 'Land Surface Temperature',
            'urban_heat_island': 'Urban Heat Island',
            'wet_bulb_temperature': 'Wet-Bulb Temperature',
            'elevation': 'Elevation Analysis',
            'building_use': 'Building Use Distribution',
            'economic_vulnerability': 'Economic Vulnerability'
          };
          
          const layerName = layerNames[activeLayerId] || activeLayerId;
          
          console.log('✅ [RightPanel] Rendering LayerAreaBreakdown:', { activeLayerId, layerName });
          
          return (
            <div className="mt-4">
              <LayerAreaBreakdown
                layerId={activeLayerId}
                layerName={layerName}
                selectedWardId={selectedWardId}
                selectedLguName={selectedLguName}
                selectedCategory={selectedDonutCategory}
                onCategorySelect={onDonutCategorySelect}
              />
            </div>
          );
        })()}
      </>
    );
  }

  if (activeSector === 'air') {
    return (
      <>
        {/* Baseline Scenario Info Card */}
        <div 
          className="rounded-lg p-3 border-l-4 mb-3"
          style={{ 
            backgroundColor: '#f1f5f9',
            borderLeftColor: '#64748B'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ backgroundColor: '#e2e8f0' }}
            >
              <Check className="w-3.5 h-3.5" style={{ color: '#64748B' }} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#0F172A]">{AirPollutionContent.SCENARIO_INFO.title}</div>
              <div className="text-[9px] text-[#64748B] mt-0.5">Based on Air Quality Index | Dec–Feb, 2025</div>
            </div>
          </div>
          <div className="text-[9px] text-[#64748B] mt-2 flex items-center gap-1">
            <span className="font-medium">{AirPollutionContent.SCENARIO_INFO.referenceYearLabel}</span>
            <span>{AirPollutionContent.SCENARIO_INFO.referenceYear}</span>
          </div>
        </div>

        {/* Air Quality Index Overview Header */}
        <div className="mb-3">
          <SectionHeader 
            icon={Wind} 
            title={AirPollutionContent.SECTION_HEADER.title}
            color={AirPollutionContent.SECTION_HEADER.color}
            subtitle={panelSubtitle}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {hazardKPI.loading ? (
            <div className="col-span-2 space-y-2 py-3 px-1">
              <div className="h-[58px] rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-[58px] rounded-xl bg-slate-100 animate-pulse opacity-60" />
            </div>
          ) : (
            <>
              <KPITile
                title={AirPollutionContent.KPI_TILES.poorSevereAreas.title}
                value={hazardKPI.coverage ? formatKPIValue(hazardKPI.coverage.value, hazardKPI.coverage.value_unit) : (kpiAreaData ? `${kpiAreaData.totalAreaKm2.toFixed(1)} km²` : "N/A")}
                subtitle={AirPollutionContent.KPI_TILES.poorSevereAreas.subtitle}
                color={AQI_COLORS.unhealthy}
                percentage={hazardKPI.coverage ? formatKPIPercentage(hazardKPI.coverage.percentage) : (kpiAreaData ? `${kpiAreaData.percentage.toFixed(1)}%` : "N/A")}
                isDummy={false}
              />
              <KPITile
                title={AirPollutionContent.KPI_TILES.buildings.title}
                value={hazardKPI.building ? formatKPIValue(hazardKPI.building.value, hazardKPI.building.value_unit) : "N/A"}
                subtitle={AirPollutionContent.KPI_TILES.buildings.subtitle}
                color={AQI_COLORS.veryUnhealthy}
                percentage={hazardKPI.building ? formatKPIPercentage(hazardKPI.building.percentage) : "N/A"}
                isDummy={false}
              />
              <KPITile
                title={AirPollutionContent.KPI_TILES.infrastructure.title}
                value={hazardKPI.infra ? formatKPIValue(hazardKPI.infra.value, hazardKPI.infra.value_unit) : "N/A"}
                subtitle={AirPollutionContent.KPI_TILES.infrastructure.subtitle}
                color={AQI_COLORS.unhealthy}
                percentage={hazardKPI.infra ? formatKPIPercentage(hazardKPI.infra.percentage) : "N/A"}
                isDummy={false}
              />
              <KPITile
                title={AirPollutionContent.KPI_TILES.roadNetwork.title}
                value={hazardKPI.roadNetwork ? formatKPIValue(hazardKPI.roadNetwork.value, hazardKPI.roadNetwork.value_unit) : "N/A"}
                subtitle={AirPollutionContent.KPI_TILES.roadNetwork.subtitle}
                color={AQI_COLORS.unhealthy}
                percentage={hazardKPI.roadNetwork ? formatKPIPercentage(hazardKPI.roadNetwork.percentage) : "N/A"}
                isDummy={false}
              />
            </>
          )}
        </div>

        {/* Sub-layer specific overview section */}
        {activeLayerId && activeLayerId !== 'air_aqi' && SUB_LAYER_NAMES[activeLayerId] && (
          <div className="mt-4">
            <SectionHeader 
              icon={
                activeLayerId === 'air_no2' ? Cloud :
                activeLayerId === 'air_so2' ? Cloud :
                activeLayerId === 'air_co' ? Cloud :
                activeLayerId === 'air_pm10' ? Wind :
                activeLayerId === 'air_pm25' ? Wind :
                activeLayerId === 'air_o3' ? Wind :
                Wind
              }
              title={`${SUB_LAYER_NAMES[activeLayerId]} Overview`}
              color="#9C27B0"
            />
          </div>
        )}

        {/* Data Layer Breakdown (Elevation, Building Use, Economic Vulnerability) */}
        {(() => {
          const dataLayers = ['elevation', 'building_use', 'economic_vulnerability'];
          const isDataLayer = dataLayers.includes(activeLayerId);
          
          if (!isDataLayer) return null;
          
          const layerNames: Record<string, string> = {
            'elevation': 'Elevation Analysis',
            'building_use': 'Building Use Distribution',
            'economic_vulnerability': 'Economic Vulnerability'
          };
          
          const layerName = layerNames[activeLayerId] || activeLayerId;
          
          return (
            <div className="mt-4">
              <LayerAreaBreakdown
                layerId={activeLayerId}
                layerName={layerName}
                selectedWardId={selectedWardId}
                selectedLguName={selectedLguName}
                selectedCategory={selectedDonutCategory}
                onCategorySelect={onDonutCategorySelect}
              />
            </div>
          );
        })()}
      </>
    );
  }

  if (activeSector === 'flood') {
    return (
      <>
        {/* Baseline Scenario Info Card */}
        <div 
          className="rounded-lg p-3 border-l-4 mb-3"
          style={{ 
            backgroundColor: '#f1f5f9',
            borderLeftColor: '#64748B'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ backgroundColor: '#e2e8f0' }}
            >
              <Check className="w-3.5 h-3.5" style={{ color: '#64748B' }} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#0F172A]">{FloodContent.SCENARIO_INFO.title}</div>
              <div className="text-[9px] text-[#64748B] mt-0.5">{FloodContent.SCENARIO_INFO.description}</div>
            </div>
          </div>
          <div className="text-[9px] text-[#64748B] mt-2 flex items-center gap-1">
            <span className="font-medium">{FloodContent.SCENARIO_INFO.referenceYearLabel}</span>
            <span>{FloodContent.SCENARIO_INFO.referenceYear}</span>
          </div>
        </div>

        {/* Flood Hazard Index Overview Header */}
        <div className="mb-3">
          <SectionHeader 
            icon={Waves} 
            title={FloodContent.SECTION_HEADER.title}
            color={FloodContent.SECTION_HEADER.color}
            subtitle={panelSubtitle}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {hazardKPI.loading ? (
            <div className="col-span-2 space-y-2 py-3 px-1">
              <div className="h-[58px] rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-[58px] rounded-xl bg-slate-100 animate-pulse opacity-60" />
            </div>
          ) : (
            <>
              <KPITile
                title={FloodContent.KPI_TILES.floodProneAreas.title}
                value={hazardKPI.coverage ? formatKPIValue(hazardKPI.coverage.value, hazardKPI.coverage.value_unit) : (kpiAreaData ? `${kpiAreaData.totalAreaKm2.toFixed(1)} km²` : "N/A")}
                subtitle={FloodContent.KPI_TILES.floodProneAreas.subtitle}
                color={FLOOD_COLORS.moderate}
                percentage={hazardKPI.coverage ? formatKPIPercentage(hazardKPI.coverage.percentage) : (kpiAreaData ? `${kpiAreaData.percentage.toFixed(1)}%` : "N/A")}
                isDummy={false}
              />
              <KPITile
                title={FloodContent.KPI_TILES.buildings.title}
                value={hazardKPI.building ? formatKPIValue(hazardKPI.building.value, hazardKPI.building.value_unit) : "N/A"}
                subtitle={FloodContent.KPI_TILES.buildings.subtitle}
                color={FLOOD_COLORS.high}
                percentage={hazardKPI.building ? formatKPIPercentage(hazardKPI.building.percentage) : "N/A"}
                isDummy={false}
              />
              <KPITile
                title={FloodContent.KPI_TILES.infrastructure.title}
                value={hazardKPI.infra ? formatKPIValue(hazardKPI.infra.value, hazardKPI.infra.value_unit) : "N/A"}
                subtitle={FloodContent.KPI_TILES.infrastructure.subtitle}
                color={FLOOD_COLORS.moderate}
                percentage={hazardKPI.infra ? formatKPIPercentage(hazardKPI.infra.percentage) : "N/A"}
                isDummy={false}
              />
              <KPITile
                title={FloodContent.KPI_TILES.roadNetwork.title}
                value={hazardKPI.roadNetwork ? formatKPIValue(hazardKPI.roadNetwork.value, hazardKPI.roadNetwork.value_unit) : "N/A"}
                subtitle={FloodContent.KPI_TILES.roadNetwork.subtitle}
                color={FLOOD_COLORS.high}
                percentage={hazardKPI.roadNetwork ? formatKPIPercentage(hazardKPI.roadNetwork.percentage) : "N/A"}
                isDummy={false}
              />
            </>
          )}
        </div>

        {/* Sub-layer specific overview section */}
        {activeLayerId && activeLayerId !== 'flood_fhi' && SUB_LAYER_NAMES[activeLayerId] && (
          <div className="mt-4">
            <SectionHeader 
              icon={
                activeLayerId === 'flood_susceptibility' ? CloudRain :
                activeLayerId === 'flood_waterlogging' ? Droplets :
                Waves
              }
              title={`${SUB_LAYER_NAMES[activeLayerId]} Overview`}
              color="#3B82F6"
            />
          </div>
        )}

        {/* Data Layer Breakdown (Elevation, Building Use, Economic Vulnerability) */}
        {(() => {
          const dataLayers = ['elevation', 'building_use', 'economic_vulnerability'];
          const isDataLayer = dataLayers.includes(activeLayerId);
          
          if (!isDataLayer) return null;
          
          const layerNames: Record<string, string> = {
            'elevation': 'Elevation Analysis',
            'building_use': 'Building Use Distribution',
            'economic_vulnerability': 'Economic Vulnerability'
          };
          
          const layerName = layerNames[activeLayerId] || activeLayerId;
          
          return (
            <div className="mt-4">
              <LayerAreaBreakdown
                layerId={activeLayerId}
                layerName={layerName}
                selectedWardId={selectedWardId}
                selectedLguName={selectedLguName}
                selectedCategory={selectedDonutCategory}
                onCategorySelect={onDonutCategorySelect}
              />
            </div>
          );
        })()}
      </>
    );
  }

  // Multi-hazard
  return (
    <>
      {/* Baseline Scenario Info Card */}
      <div 
        className="rounded-lg p-3 border-l-4 mb-3"
        style={{ 
          backgroundColor: '#f1f5f9',
          borderLeftColor: '#64748B'
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ backgroundColor: '#e2e8f0' }}
          >
            <Check className="w-3.5 h-3.5" style={{ color: '#64748B' }} />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-[#0F172A]">{MultiHazardContent.SCENARIO_INFO.title}</div>
            <div className="text-[9px] text-[#64748B] mt-0.5">{MultiHazardContent.SCENARIO_INFO.description}</div>
          </div>
        </div>
        <div className="text-[9px] text-[#64748B] mt-2 flex items-center gap-1">
          <span className="font-medium">{MultiHazardContent.SCENARIO_INFO.referenceYearLabel}</span>
          <span>{MultiHazardContent.SCENARIO_INFO.referenceYear}</span>
        </div>
      </div>

      {/* Multi Hazard Overview Header */}
      <div className="mb-3">
        <SectionHeader 
          icon={ShieldAlert} 
          title={MultiHazardContent.SECTION_HEADER.title}
          color={MultiHazardContent.SECTION_HEADER.color}
          subtitle={panelSubtitle}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {hazardKPI.loading ? (
          <div className="col-span-2 space-y-2 py-3 px-1">
            <div className="h-[58px] rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-[58px] rounded-xl bg-slate-100 animate-pulse opacity-60" />
          </div>
        ) : (
          <>
            <KPITile
              title={MultiHazardContent.KPI_TILES.highExposureZones.title}
              value={hazardKPI.coverage ? formatKPIValue(hazardKPI.coverage.value, hazardKPI.coverage.value_unit) : (kpiAreaData ? `${kpiAreaData.totalAreaKm2.toFixed(1)} km²` : "N/A")}
              subtitle={MultiHazardContent.KPI_TILES.highExposureZones.subtitle}
              color={MULTI_HAZARD_COLORS.high}
              percentage={hazardKPI.coverage ? formatKPIPercentage(hazardKPI.coverage.percentage) : (kpiAreaData ? `${kpiAreaData.percentage.toFixed(1)}%` : "N/A")}
              isDummy={false}
            />
            <KPITile
              title={MultiHazardContent.KPI_TILES.buildings.title}
              value={hazardKPI.building ? formatKPIValue(hazardKPI.building.value, hazardKPI.building.value_unit) : "N/A"}
              subtitle={MultiHazardContent.KPI_TILES.buildings.subtitle}
              color={MULTI_HAZARD_COLORS.veryHigh}
              percentage={hazardKPI.building ? formatKPIPercentage(hazardKPI.building.percentage) : "N/A"}
              isDummy={false}
            />
            <KPITile
              title={MultiHazardContent.KPI_TILES.infrastructure.title}
              value={hazardKPI.infra ? formatKPIValue(hazardKPI.infra.value, hazardKPI.infra.value_unit) : "N/A"}
              subtitle={MultiHazardContent.KPI_TILES.infrastructure.subtitle}
              color={MULTI_HAZARD_COLORS.moderate}
              percentage={hazardKPI.infra ? formatKPIPercentage(hazardKPI.infra.percentage) : "N/A"}
              isDummy={false}
            />
            <KPITile
              title={MultiHazardContent.KPI_TILES.roadNetwork.title}
              value={hazardKPI.roadNetwork ? formatKPIValue(hazardKPI.roadNetwork.value, hazardKPI.roadNetwork.value_unit) : "N/A"}
              subtitle={MultiHazardContent.KPI_TILES.roadNetwork.subtitle}
              color={MULTI_HAZARD_COLORS.high}
              percentage={hazardKPI.roadNetwork ? formatKPIPercentage(hazardKPI.roadNetwork.percentage) : "N/A"}
              isDummy={false}
            />
          </>
        )}
      </div>

      {/* Sub-layer specific overview section */}
      {activeLayerId && activeLayerId !== 'multihazard_assessment' && SUB_LAYER_NAMES[activeLayerId] && (
        <div className="mt-4">
          <SectionHeader 
            icon={
              activeLayerId === 'multihazard_heatflood' ? ShieldAlert :
              activeLayerId === 'multihazard_heatair' ? ShieldAlert :
              ShieldAlert
            }
            title={`${SUB_LAYER_NAMES[activeLayerId]} Overview`}
            color="#8B5CF6"
          />
        </div>
      )}

      {/* Data Layer Breakdown (Elevation, Building Use, Economic Vulnerability) */}
      {(() => {
        const dataLayers = ['elevation', 'building_use', 'economic_vulnerability'];
        const isDataLayer = dataLayers.includes(activeLayerId);
        
        if (!isDataLayer) return null;
        
        const layerNames: Record<string, string> = {
          'elevation': 'Elevation Analysis',
          'building_use': 'Building Use Distribution',
          'economic_vulnerability': 'Economic Vulnerability'
        };
        
        const layerName = layerNames[activeLayerId] || activeLayerId;
        
        return (
          <div className="mt-4">
            <LayerAreaBreakdown
              layerId={activeLayerId}
              layerName={layerName}
              selectedWardId={selectedWardId}
              selectedLguName={selectedLguName}
              selectedCategory={selectedDonutCategory}
              onCategorySelect={onDonutCategorySelect}
            />
          </div>
        );
      })()}
    </>
  );
}

// ==================== CASE 1: General Hazard Overview ====================
function GeneralHazardOverview({ activeSector, activeLayerId, scenario, selectedWardId = 'all', hasActiveRoadNetwork, hasActiveRoadSafety, selectedDonutCategory, onDonutCategorySelect }: { activeSector: Sector, activeLayerId: string, scenario: Scenario, selectedWardId?: string, hasActiveRoadNetwork: boolean, hasActiveRoadSafety?: boolean, selectedDonutCategory?: string | null, onDonutCategorySelect?: (category: string | null) => void }) {
  
  // Fetch road network analysis data from backend API
  const roadNetworkData = useRoadNetworkData(activeLayerId, scenario, selectedWardId);

  // Helper function to convert scenario to ScenarioType
  const convertScenario = (scenario: Scenario): ScenarioType | null => {
    if (scenario === 'baseline_2025') return 'baseline';
    if (scenario === 'ssp1_2040') return 'ssp1';
    if (scenario === 'ssp2_2040') return 'ssp2';
    if (scenario === 'ssp5_2040') return 'ssp5';
    return null;
  };

  // Helper function to extract ward number
  const getWardNumber = (wardId: string | null): string | null => {
    if (!wardId || wardId === 'all') return null;
    const parts = wardId.split('_');
    return parts[1] || null;
  };

  // Fetch Building Hazard data from backend API
  const buildingHazard = useBuildingHazard(
    activeSector,
    activeLayerId,
    convertScenario(scenario),
    getWardNumber(selectedWardId)
  );
  
  // Helper function to get ward name for chart titles
  const getWardDisplayName = (): string => {
    if (!selectedWardId || selectedWardId === 'all') {
      return 'Bhubaneswar';
    }
    const wardNumber = parseInt(selectedWardId.split('_')[1]);
    return `Ward ${wardNumber}`;
  };
  
  if (activeSector === 'heat') {
    const scenarioData = HEAT_SCENARIO_DATA[scenario];
    const isBaseline = scenario === 'baseline_2025';
    
    // Safety check
    if (!scenarioData) {
      console.error('❌ Scenario data not found for:', scenario);
      return <GeneralHazardOverview activeSector={activeSector} activeLayerId={activeLayerId} scenario="baseline_2025" selectedWardId={selectedWardId} hasActiveRoadNetwork={false} selectedDonutCategory={selectedDonutCategory} onDonutCategorySelect={onDonutCategorySelect} />;
    }

    return (
      <>
        {/* Scenario Comparison Chart - Only show if not baseline */}
        {!isBaseline && (
          <>
            <ScenarioComparisonChart scenario={scenario} activeSector={activeSector} selectedWardId={selectedWardId} />
          </>
        )}

        {/* Area Distribution - Real data from GeoServer */}
        <AreaDistributionChart
          activeSector={activeSector}
          activeLayerId={activeLayerId}
          scenario={scenario}
          title={`${getWardDisplayName()} - Heat Stress Distribution`}
          selectedWardId={selectedWardId}
          showLabelsInUI={false}
          selectedCategory={selectedDonutCategory}
          onCategorySelect={onDonutCategorySelect}
        />

        {/* Buildings Breakdown - Real data from Building Hazard API */}
        <StatsCard
          title={getBuildingExposureTitle(activeLayerId)}
          stats={buildingHazard.data.map(item => ({
            label: item.type,
            value: item.building_count.toLocaleString(),
            color: item.color_code
          }))}
          isDummy={false}
          loading={buildingHazard.loading}
        />

        {/* Road Network Hazard Analysis from Backend API */}
        {hasActiveRoadNetwork && (
          <>
            {/* Loading State */}
            {roadNetworkData.loading && (
              <div className="border border-[#FEF3C7] bg-[#FFFBEB] rounded-xl p-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-6 h-6 flex-shrink-0">
                    <div className="absolute inset-0 border-2 border-amber-100 rounded-full" />
                    <div className="absolute inset-0 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-amber-700">Analysing road network…</p>
                    <p className="text-[9px] text-amber-600/70 mt-0.5">Computing hazard exposure distribution</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {roadNetworkData.error && !roadNetworkData.loading && (
              <div className="border border-[#E5E7EB] rounded-lg p-6 bg-white shadow-sm mb-3 text-center">
                <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
                <div className="text-[10px] text-[#EF4444]">Failed to load road network data</div>
                <div className="text-[9px] text-[#64748B] mt-1">{roadNetworkData.error}</div>
              </div>
            )}

            {/* Data Display */}
            {roadNetworkData.data && !roadNetworkData.loading && (
              <>
                {/* Stacked Horizontal Bar Chart - Road Type Breakdown */}
                <RoadNetworkStackedBarChart data={roadNetworkData.data} hasActiveRoadSafety={hasActiveRoadSafety} />
              </>
            )}
          </>
        )}
      </>
    );
  }

  if (activeSector === 'air') {
    return (
      <>
        {/* Area Distribution - Real data from GeoServer */}
        <AreaDistributionChart
          activeSector={activeSector}
          activeLayerId={activeLayerId}
          scenario={scenario}
          title={`${getWardDisplayName()} - Air Quality Distribution`}
          selectedWardId={selectedWardId}
          showLabelsInUI={false}
          selectedCategory={selectedDonutCategory}
          onCategorySelect={onDonutCategorySelect}
        />

        <StatsCard
          title={getBuildingExposureTitle(activeLayerId)}
          stats={buildingHazard.data.map(item => ({
            label: item.type,
            value: item.building_count.toLocaleString(),
            color: item.color_code
          }))}
          isDummy={false}
          loading={buildingHazard.loading}
        />

        {/* Road Network Air Pollution Analysis from Backend API */}
        <div className="mt-3">
          {roadNetworkData.loading && (
          <div className="border border-[#FEF3C7] bg-[#FFFBEB] rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="relative w-6 h-6 flex-shrink-0">
                <div className="absolute inset-0 border-2 border-amber-100 rounded-full" />
                <div className="absolute inset-0 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-amber-700">Analysing road network…</p>
                <p className="text-[9px] text-amber-600/70 mt-0.5">Computing hazard exposure distribution</p>
              </div>
            </div>
          </div>
        )}

        {roadNetworkData.error && !roadNetworkData.loading && (
          <div className="border border-[#E5E7EB] rounded-lg p-6 bg-white shadow-sm mb-3 text-center">
            <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
            <div className="text-[10px] text-[#EF4444]">Failed to load road network data</div>
            <div className="text-[9px] text-[#64748B] mt-1">{roadNetworkData.error}</div>
          </div>
        )}

        {roadNetworkData.data && !roadNetworkData.loading && (
          <>
            {/* Stacked Horizontal Bar Chart - Road Type Breakdown */}
            <RoadNetworkStackedBarChart data={roadNetworkData.data} hasActiveRoadSafety={hasActiveRoadSafety} />
          </>
        )}
        </div>
      </>
    );
  }

  if (activeSector === 'flood') {
    return (
      <>
        {/* Area Distribution - Real data from GeoServer */}
        <AreaDistributionChart
          activeSector={activeSector}
          activeLayerId={activeLayerId}
          scenario={scenario}
          title={`${getWardDisplayName()} - Flood Hazard Exposure Distribution`}
          selectedWardId={selectedWardId}
          showLabelsInUI={false}
          selectedCategory={selectedDonutCategory}
          onCategorySelect={onDonutCategorySelect}
        />

        <StatsCard
          title={getBuildingExposureTitle(activeLayerId)}
          stats={buildingHazard.data.map(item => ({
            label: item.type,
            value: item.building_count.toLocaleString(),
            color: item.color_code
          }))}
          isDummy={false}
          loading={buildingHazard.loading}
        />

        {/* Road Network Flood Analysis from Backend API */}
        <div className="mt-3">
          {roadNetworkData.loading && (
          <div className="border border-[#FEF3C7] bg-[#FFFBEB] rounded-xl p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="relative w-6 h-6 flex-shrink-0">
                <div className="absolute inset-0 border-2 border-amber-100 rounded-full" />
                <div className="absolute inset-0 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-amber-700">Analysing road network…</p>
                <p className="text-[9px] text-amber-600/70 mt-0.5">Computing hazard exposure distribution</p>
              </div>
            </div>
          </div>
        )}

        {roadNetworkData.error && !roadNetworkData.loading && (
          <div className="border border-[#E5E7EB] rounded-lg p-6 bg-white shadow-sm mb-3 text-center">
            <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
            <div className="text-[10px] text-[#EF4444]">Failed to load road network data</div>
            <div className="text-[9px] text-[#64748B] mt-1">{roadNetworkData.error}</div>
          </div>
        )}

        {roadNetworkData.data && !roadNetworkData.loading && (
          <>
            {/* Stacked Horizontal Bar Chart - Road Type Breakdown */}
            <RoadNetworkStackedBarChart data={roadNetworkData.data} hasActiveRoadSafety={hasActiveRoadSafety} />
          </>
        )}
        </div>
      </>
    );
  }

  // Multi-hazard
  return (
    <>
      {/* Area Distribution - Real data from GeoServer */}
      <AreaDistributionChart
        activeSector={activeSector}
        activeLayerId={activeLayerId}
        scenario={scenario}
        title={`${getWardDisplayName()} - Multi-Hazard Distribution`}
        selectedWardId={selectedWardId}
        showLabelsInUI={false}
        selectedCategory={selectedDonutCategory}
        onCategorySelect={onDonutCategorySelect}
      />

      <StatsCard
        title={getBuildingExposureTitle(activeLayerId)}
        stats={buildingHazard.data.map(item => ({
          label: item.type,
          value: item.building_count.toLocaleString(),
          color: item.color_code
        }))}
        isDummy={false}
        loading={buildingHazard.loading}
      />

      {/* Road Network Multi Hazard Analysis from Backend API */}
      <div className="mt-3">
        {roadNetworkData.loading && (
        <div className="border border-[#FEF3C7] bg-[#FFFBEB] rounded-xl p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6 flex-shrink-0">
              <div className="absolute inset-0 border-2 border-amber-100 rounded-full" />
              <div className="absolute inset-0 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-amber-700">Analysing road network…</p>
              <p className="text-[9px] text-amber-600/70 mt-0.5">Computing hazard exposure distribution</p>
            </div>
          </div>
        </div>
      )}

      {roadNetworkData.error && !roadNetworkData.loading && (
        <div className="border border-[#E5E7EB] rounded-lg p-6 bg-white shadow-sm mb-3 text-center">
          <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
          <div className="text-[10px] text-[#EF4444]">Failed to load road network data</div>
          <div className="text-[9px] text-[#64748B] mt-1">{roadNetworkData.error}</div>
        </div>
      )}

      {roadNetworkData.data && !roadNetworkData.loading && (
        <>
          {/* Stacked Horizontal Bar Chart - Road Type Breakdown */}
          <RoadNetworkStackedBarChart data={roadNetworkData.data} hasActiveRoadSafety={hasActiveRoadSafety} />
        </>
      )}

      {/* Show message when no data and no error (layer not supported) */}
      {!roadNetworkData.data && !roadNetworkData.loading && !roadNetworkData.error && (
        <div className="border border-[#E5E7EB] rounded-lg p-4 bg-white shadow-sm mb-3 text-center">
          <div className="text-[10px] text-[#64748B]">Multi-hazard road network analysis not available</div>
          <div className="text-[9px] text-[#64748B] mt-1">Select a specific hazard layer to view road network data</div>
        </div>
      )}
      </div>
    </>
  );
}

// ==================== CASE 2: Infrastructure Impact View (City-wide) ====================
interface InfrastructureImpactViewProps {
  activeSector: Sector;
  activeLayerId: string;
  scenario: Scenario;
  activeInfraLayers: string[];
  hasActiveEducation: boolean;
  hasActiveHealthcare: boolean;
  hasActivePublicAmenities: boolean;
  hasActiveTransport: boolean;
  hasActiveRoadNetwork: boolean;
  hasActiveRoadSafety: boolean;
  activeEducationSubLayers: string[];
  activeHealthcareSubLayers: string[];
  activePublicAmenitiesSubLayers: string[];
  activeTransportSubLayers: string[];
  educationCounts: Record<string, number>;
  healthcareCounts: Record<string, number>;
  publicAmenitiesCounts: Record<string, number>;
  transportCounts: Record<string, number>;
  selectedWardId?: string;
  educationExposure: HazardExposure;
  healthcareExposure: HazardExposure;
  publicAmenitiesExposure: HazardExposure;
  transportExposure: HazardExposure;
  activeHazardLayerId?: string;
  activeHazardKey?: string;
}

function InfrastructureImpactView({ 
  activeSector,
  activeLayerId,
  scenario,
  activeInfraLayers,
  hasActiveEducation,
  hasActiveHealthcare,
  hasActivePublicAmenities,
  hasActiveTransport,
  hasActiveRoadNetwork,
  hasActiveRoadSafety,
  activeEducationSubLayers,
  activeHealthcareSubLayers,
  activePublicAmenitiesSubLayers,
  activeTransportSubLayers,
  educationCounts,
  healthcareCounts,
  publicAmenitiesCounts,
  transportCounts,
  selectedWardId = 'all',
  educationExposure,
  healthcareExposure,
  publicAmenitiesExposure,
  transportExposure,
  activeHazardLayerId = '',
  activeHazardKey = ''
}: InfrastructureImpactViewProps) {
  
  // Helper function to convert scenario to ScenarioType
  const convertScenario = (scenario: Scenario): ScenarioType | null => {
    if (scenario === 'baseline_2025') return 'baseline';
    if (scenario === 'ssp1_2040') return 'ssp1';
    if (scenario === 'ssp2_2040') return 'ssp2';
    if (scenario === 'ssp5_2040') return 'ssp5';
    return null;
  };

  // Helper function to extract ward number
  const getWardNumber = (wardId: string | null): string | null => {
    if (!wardId || wardId === 'all') return null;
    const parts = wardId.split('_');
    return parts[1] || null;
  };

  // Fetch Building Hazard data from backend API
  const buildingHazard = useBuildingHazard(
    activeSector,
    activeLayerId,
    convertScenario(scenario),
    getWardNumber(selectedWardId)
  );
  
  // Fetch road network analysis data when road_network layer is active
  const roadNetworkData = useRoadNetworkData(activeLayerId, scenario, selectedWardId);
  
  const isBaseline = scenario === 'baseline_2025';
  const scenarioData = activeSector === 'heat' ? HEAT_SCENARIO_DATA[scenario] : null;
  const baselineData = activeSector === 'heat' ? HEAT_SCENARIO_DATA.baseline_2025 : null;
  
  const getHazardColor = () => {
    if (activeSector === 'heat') return HEAT_COLORS;
    if (activeSector === 'air') return AQI_COLORS;
    if (activeSector === 'flood') return FLOOD_COLORS;
    return MULTI_HAZARD_COLORS;
  };

  const colors = getHazardColor();

  // Helper function to get hazard-specific titles
  const getHazardTitle = (base: string) => {
    if (activeSector === 'heat') return `${base} by Heat Stress Level`;
    if (activeSector === 'air') return `${base} by Air Quality Level`;
    if (activeSector === 'flood') return `${base} by Flood Hazard Level`;
    return `${base} by Multi-Hazard Exposure`;
  };

  return (
    <>
      {/* Always show core 4 sections */}
      {activeSector === 'heat' && (
        <>
          {!hasActiveEducation && !hasActiveHealthcare && !hasActivePublicAmenities && !hasActiveTransport && (
            <>
              <ChartCard title="Area Distribution by Heat Stress Level">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { name: 'Low', value: 156, color: HEAT_COLORS.low },
                { name: 'Moderate', value: 289, color: HEAT_COLORS.moderate },
                { name: 'High', value: 312, color: HEAT_COLORS.high },
                { name: 'Extreme', value: 110, color: HEAT_COLORS.extreme },
              ]}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v} km²`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)'
                  }}
                  labelStyle={{ color: '#FFFFFF', fontSize: 10 }}
                  itemStyle={{ color: '#FFFFFF', fontSize: 10 }}
                  formatter={(value: number) => [`${value} km²`, 'Area']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {[HEAT_COLORS.low, HEAT_COLORS.moderate, HEAT_COLORS.high, HEAT_COLORS.extreme].map((color, idx) => (
                    <Cell key={`cell-${idx}`} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <StatsCard
            title={getBuildingExposureTitle(activeLayerId)}
            stats={buildingHazard.data.map(item => ({
              label: item.type,
              value: item.building_count.toLocaleString(),
              color: item.color_code
            }))}
            isDummy={false}
            loading={buildingHazard.loading}
          />
            </>
          )}
        </>
      )}

      {activeSector === 'air' && (
        <>
          {!hasActiveEducation && !hasActiveHealthcare && !hasActivePublicAmenities && !hasActiveTransport && (
            <>
          <ChartCard title="Area Distribution by Air Quality Level">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { name: 'Good', value: 145, color: AQI_COLORS.good },
                { name: 'Moderate', value: 234, color: AQI_COLORS.moderate },
                { name: 'Unhealthy (S)', value: 312, color: AQI_COLORS.unhealthySensitive },
                { name: 'Unhealthy', value: 178, color: AQI_COLORS.unhealthy },
                { name: 'V.Unhealthy', value: 56, color: AQI_COLORS.veryUnhealthy },
                { name: 'Hazardous', value: 38, color: AQI_COLORS.hazardous },
              ]}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v} km²`} />
                <Tooltip
                  contentStyle={{
                    fontSize: 10,
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}
                  itemStyle={{ color: '#FFFFFF', fontSize: 10 }}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                  formatter={(value: number, name: string, props: any) => {
                    const total = 145 + 234 + 312 + 178 + 56 + 38;
                    const percentage = ((value / total) * 100).toFixed(1);
                    return [`${value} km² (${percentage}%)`, 'Area'];
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {[AQI_COLORS.good, AQI_COLORS.moderate, AQI_COLORS.unhealthySensitive, AQI_COLORS.unhealthy, AQI_COLORS.veryUnhealthy, AQI_COLORS.hazardous].map((color, idx) => (
                    <Cell key={`cell-${idx}`} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <StatsCard
            title={getBuildingExposureTitle(activeLayerId)}
            stats={[
              { label: 'Good', value: '1,245', color: AQI_COLORS.good },
              { label: 'Moderate', value: '2,134', color: AQI_COLORS.moderate },
              { label: 'Unhealthy for Sensitive Groups', value: '3,456', color: AQI_COLORS.unhealthySensitive },
              { label: 'Unhealthy', value: '1,892', color: AQI_COLORS.unhealthy },
              { label: 'Very Unhealthy', value: '734', color: AQI_COLORS.veryUnhealthy },
              { label: 'Hazardous', value: '312', color: AQI_COLORS.hazardous },
            ]}
            isDummy={true}
          />
            </>
          )}
        </>
      )}

      {activeSector === 'flood' && (
        <>
          {!hasActiveEducation && !hasActiveHealthcare && !hasActivePublicAmenities && !hasActiveTransport && (
            <>
          <ChartCard title="Area Distribution by Flood Hazard Level">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { name: 'No Hazard', value: 689, color: FLOOD_COLORS.noRisk },
                { name: 'Low', value: 234, color: FLOOD_COLORS.low },
                { name: 'Moderate', value: 89, color: FLOOD_COLORS.moderate },
                { name: 'High', value: 67, color: FLOOD_COLORS.high },
                { name: 'V.High', value: 21, color: FLOOD_COLORS.veryHigh },
              ]}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    fontSize: 10,
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}
                  itemStyle={{ color: '#FFFFFF', fontSize: 10 }}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                  formatter={(value: number, name: string, props: any) => {
                    const total = 689 + 234 + 89 + 67 + 21;
                    const percentage = ((value / total) * 100).toFixed(1);
                    return [`${value} (${percentage}%)`, 'Area'];
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {[FLOOD_COLORS.noRisk, FLOOD_COLORS.low, FLOOD_COLORS.moderate, FLOOD_COLORS.high, FLOOD_COLORS.veryHigh].map((color, idx) => (
                    <Cell key={`cell-${idx}`} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <StatsCard
            title={getBuildingExposureTitle(activeLayerId)}
            stats={[
              { label: 'No Hazard', value: '4,567', color: FLOOD_COLORS.noRisk },
              { label: 'Low Hazard', value: '1,892', color: FLOOD_COLORS.low },
              { label: 'Moderate Hazard', value: '845', color: FLOOD_COLORS.moderate },
              { label: 'High Hazard', value: '534', color: FLOOD_COLORS.high },
              { label: 'Very High Hazard', value: '289', color: FLOOD_COLORS.veryHigh },
            ]}
            isDummy={true}
          />
            </>
          )}
        </>
      )}

      {activeSector === 'multi' && (
        <>
          {!hasActiveEducation && !hasActiveHealthcare && !hasActivePublicAmenities && !hasActiveTransport && (
            <>
          <ChartCard title="Area Distribution by Multi-Hazard Exposure Level">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { name: 'Low', value: 298, color: MULTI_HAZARD_COLORS.low },
                { name: 'Moderate', value: 412, color: MULTI_HAZARD_COLORS.moderate },
                { name: 'High', value: 178, color: MULTI_HAZARD_COLORS.high },
                { name: 'Very High', value: 56, color: MULTI_HAZARD_COLORS.veryHigh },
              ]}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v} km²`} />
                <Tooltip
                  contentStyle={{
                    fontSize: 10,
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}
                  itemStyle={{ color: '#FFFFFF', fontSize: 10 }}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                  formatter={(value: number, name: string, props: any) => {
                    const total = 298 + 412 + 178 + 56;
                    const percentage = ((value / total) * 100).toFixed(1);
                    return [`${value} km² (${percentage}%)`, 'Area'];
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {[MULTI_HAZARD_COLORS.low, MULTI_HAZARD_COLORS.moderate, MULTI_HAZARD_COLORS.high, MULTI_HAZARD_COLORS.veryHigh].map((color, idx) => (
                    <Cell key={`cell-${idx}`} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <StatsCard
            title={getBuildingExposureTitle(activeLayerId)}
            stats={[
              { label: 'Low Exposure', value: '2,456', color: MULTI_HAZARD_COLORS.low },
              { label: 'Moderate Exposure', value: '3,892', color: MULTI_HAZARD_COLORS.moderate },
              { label: 'High Exposure', value: '1,234', color: MULTI_HAZARD_COLORS.high },
              { label: 'Very High Exposure', value: '678', color: MULTI_HAZARD_COLORS.veryHigh },
            ]}
            isDummy={true}
          />
            </>
          )}
        </>
      )}

      {/* Educational Institutions */}
      {hasActiveEducation && (
        <>
          <SectionHeader 
            icon={School} 
            title="Educational Institutions"
            color="#8B5CF6"
            count={Object.values(educationCounts).reduce((sum, count) => sum + count, 0)}
            variant="subtitle"
          />
          
          <div className="grid grid-cols-2 gap-2">
            {activeEducationSubLayers.length > 0 ? (
              <>
                <KPITile
                  title={KPI_LABELS.education.selectedFacilities.title}
                  value={(() => {
                    const totalCount = Object.values(educationCounts).reduce((sum, count) => sum + count, 0);
                    const selectedCount = activeEducationSubLayers.reduce((sum, layerName) => {
                      return sum + (educationCounts[layerName] || educationCounts[layerName + 's'] || educationCounts[layerName.replace(/s$/, '')] || 0);
                    }, 0);
                    return `${selectedCount}/${totalCount}`;
                  })()}
                  subtitle={KPI_LABELS.education.selectedFacilities.subtitle}
                  color="#8B5CF6"
                  percentage={(() => {
                    const totalCount = Object.values(educationCounts).reduce((sum, count) => sum + count, 0);
                    const selectedCount = activeEducationSubLayers.reduce((sum, layerName) => {
                      return sum + (educationCounts[layerName] || educationCounts[layerName + 's'] || educationCounts[layerName.replace(/s$/, '')] || 0);
                    }, 0);
                    return totalCount > 0 ? `${((selectedCount / totalCount) * 100).toFixed(1)}%` : '0%';
                  })()}
                />
                <KPITile
                  title={KPI_LABELS.education.hazardExposure.title}
                  value={(() => {
                    // Calculate exposure for selected subcategories only
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activeEducationSubLayers.forEach((layerName) => {
                      const count = educationCounts[layerName] || educationCounts[layerName + 's'] || educationCounts[layerName.replace(/s$/, '')] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 1000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return `${totalExtreme + totalHigh}`;
                  })()}
                  subtitle={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activeEducationSubLayers.forEach((layerName) => {
                      const count = educationCounts[layerName] || educationCounts[layerName + 's'] || educationCounts[layerName.replace(/s$/, '')] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 1000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalExtreme === 0 && totalHigh === 0 ? 'No Hazard Data' : `${totalExtreme} in Extreme, ${totalHigh} in High Hazard`;
                  })()}
                  color={activeSector === 'heat' ? HEAT_COLORS.extreme : activeSector === 'air' ? AQI_COLORS.unhealthy : FLOOD_COLORS.high}
                  percentage={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    let totalSelected = 0;
                    
                    activeEducationSubLayers.forEach((layerName) => {
                      const count = educationCounts[layerName] || educationCounts[layerName + 's'] || educationCounts[layerName.replace(/s$/, '')] || 0;
                      totalSelected += count;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 1000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalSelected > 0 ? `${(((totalExtreme + totalHigh) / totalSelected) * 100).toFixed(1)}%` : '0%';
                  })()}
                />
              </>
            ) : (
              <>
                <KPITile
                  title={KPI_LABELS.education.totalFacilities.title}
                  value={String(Object.values(educationCounts).reduce((sum, count) => sum + count, 0))}
                  subtitle={KPI_LABELS.education.totalFacilities.subtitle}
                  color="#8B5CF6"
                  percentage="100%"
                />
                {activeSector === 'heat' && scenarioData && baselineData ? (
                  <KPITileWithChange
                    title={KPI_LABELS.education.highExposureScenario.title}
                    value={`${scenarioData.educationHigh}`}
                    subtitle={KPI_LABELS.education.highExposureScenario.subtitle}
                    color={HEAT_COLORS.extreme}
                    percentage="36.3%"
                    change={!isBaseline ? calculateChange(baselineData.educationHigh, scenarioData.educationHigh) : null}
                  />
                ) : (
                  <KPITile
                    title={KPI_LABELS.education.highHazardExposure.title}
                    value={`${educationExposure.extreme + educationExposure.high + educationExposure.moderate}`}
                    subtitle={KPI_LABELS.education.highHazardExposure.subtitle}
                    color={activeSector === 'heat' ? HEAT_COLORS.extreme : activeSector === 'air' ? AQI_COLORS.unhealthy : activeSector === 'flood' ? FLOOD_COLORS.high : MULTI_HAZARD_COLORS.high}
                    percentage={educationExposure.total > 0 ? `${(((educationExposure.extreme + educationExposure.high + educationExposure.moderate) / educationExposure.total) * 100).toFixed(1)}%` : '0%'}
                  />
                )}
              </>
            )}
          </div>

          {/* Sub-category breakdown if sub-layers are selected */}
          {activeEducationSubLayers.length > 0 ? (
            <DetailedBreakdownDataDriven
              infraKey="educational"
              activeHazardLayerId={activeHazardLayerId}
              activeHazardKey={activeHazardKey}
              selectedWardId={selectedWardId}
              selectedSubtypes={activeEducationSubLayers.map(layer => {
                const mapping: Record<string, string> = {
                  'university': 'University',
                  'college': 'College',
                  'school': 'School',
                  'anganwadi': 'Anganwadi'
                };
                return mapping[layer] || layer;
              })}
              subtypes={[
                { name: 'University', icon: GraduationCap },
                { name: 'College', icon: BookOpen },
                { name: 'School', icon: School },
                { name: 'Anganwadi', icon: Baby }
              ]}
              categoryName="Educational Institutions"
              activeSector={activeSector}
              title="Hazard Exposure Distribution - Selected Categories"
            />
          ) : (
            <ImpactDistributionDataDriven
              infraKey="educational"
              activeHazardLayerId={activeHazardLayerId}
              activeHazardKey={activeHazardKey}
              selectedWardId={selectedWardId}
              subtypes={[
                { name: 'University', icon: GraduationCap },
                { name: 'College', icon: BookOpen },
                { name: 'School', icon: School },
                { name: 'Anganwadi', icon: Baby }
              ]}
              categoryName="Educational Institutions"
              activeSector={activeSector}
              title="Hazard Exposure Distribution"
            />
          )}
        </>
      )}

      {/* Healthcare Facilities */}
      {hasActiveHealthcare && (
        <>
          <SectionHeader 
            icon={Heart} 
            title="Healthcare Facilities"
            color="#EF4444"
            count={Object.values(healthcareCounts).reduce((sum, count) => sum + count, 0)}
            variant="subtitle"
          />
          
          <div className="grid grid-cols-2 gap-2">
            {activeHealthcareSubLayers.length > 0 ? (
              <>
                <KPITile
                  title={KPI_LABELS.healthcare.selectedFacilities.title}
                  value={(() => {
                    const totalCount = Object.values(healthcareCounts).reduce((sum, count) => sum + count, 0);
                    const selectedCount = activeHealthcareSubLayers.reduce((sum, layerName) => {
                      const countKey = getHealthcareCountKey(layerName);
                      return sum + (healthcareCounts[countKey] || 0);
                    }, 0);
                    return `${selectedCount}/${totalCount}`;
                  })()}
                  subtitle={KPI_LABELS.healthcare.selectedFacilities.subtitle}
                  color="#EF4444"
                  percentage={(() => {
                    const totalCount = Object.values(healthcareCounts).reduce((sum, count) => sum + count, 0);
                    const selectedCount = activeHealthcareSubLayers.reduce((sum, layerName) => {
                      const countKey = getHealthcareCountKey(layerName);
                      return sum + (healthcareCounts[countKey] || 0);
                    }, 0);
                    return totalCount > 0 ? `${((selectedCount / totalCount) * 100).toFixed(1)}%` : '0%';
                  })()}
                />
                <KPITile
                  title={KPI_LABELS.healthcare.hazardExposure.title}
                  value={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activeHealthcareSubLayers.forEach((layerName) => {
                      const countKey = getHealthcareCountKey(layerName);
                      const count = healthcareCounts[countKey] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 2000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return `${totalExtreme + totalHigh}`;
                  })()}
                  subtitle={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activeHealthcareSubLayers.forEach((layerName) => {
                      const countKey = getHealthcareCountKey(layerName);
                      const count = healthcareCounts[countKey] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 2000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalExtreme === 0 && totalHigh === 0 ? 'No Hazard Data' : `${totalExtreme} in Extreme, ${totalHigh} in High Hazard`;
                  })()}
                  color={activeSector === 'heat' ? HEAT_COLORS.extreme : activeSector === 'air' ? AQI_COLORS.unhealthy : FLOOD_COLORS.high}
                  percentage={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    let totalSelected = 0;
                    
                    activeHealthcareSubLayers.forEach((layerName) => {
                      const countKey = getHealthcareCountKey(layerName);
                      const count = healthcareCounts[countKey] || 0;
                      totalSelected += count;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 2000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalSelected > 0 ? `${(((totalExtreme + totalHigh) / totalSelected) * 100).toFixed(1)}%` : '0%';
                  })()}
                />
              </>
            ) : (
              <>
                <KPITile
                  title={KPI_LABELS.healthcare.totalFacilities.title}
                  value={String(Object.values(healthcareCounts).reduce((sum, count) => sum + count, 0))}
                  subtitle={KPI_LABELS.healthcare.totalFacilities.subtitle}
                  color="#EF4444"
                  percentage="100%"
                />
                {activeSector === 'heat' && scenarioData && baselineData ? (
                  <KPITileWithChange
                    title={KPI_LABELS.healthcare.highExposureScenario.title}
                    value={`${scenarioData.healthcareHigh}`}
                    subtitle={KPI_LABELS.healthcare.highExposureScenario.subtitle}
                    color={HEAT_COLORS.high}
                    percentage="25.8%"
                    change={!isBaseline ? calculateChange(baselineData.healthcareHigh, scenarioData.healthcareHigh) : null}
                  />
                ) : (
                  <KPITile
                    title={KPI_LABELS.healthcare.highHazardExposure.title}
                    value={`${healthcareExposure.extreme + healthcareExposure.high + healthcareExposure.moderate}`}
                    subtitle={KPI_LABELS.healthcare.highHazardExposure.subtitle}
                    color={activeSector === 'heat' ? HEAT_COLORS.extreme : activeSector === 'air' ? AQI_COLORS.unhealthy : activeSector === 'flood' ? FLOOD_COLORS.high : MULTI_HAZARD_COLORS.high}
                    percentage={healthcareExposure.total > 0 ? `${(((healthcareExposure.extreme + healthcareExposure.high + healthcareExposure.moderate) / healthcareExposure.total) * 100).toFixed(1)}%` : '0%'}
                  />
                )}
              </>
            )}
          </div>

          {activeHealthcareSubLayers.length > 0 ? (
            <DetailedBreakdownDataDriven
              infraKey="healthcare"
              activeHazardLayerId={activeHazardLayerId}
              activeHazardKey={activeHazardKey}
              selectedWardId={selectedWardId}
              selectedSubtypes={activeHealthcareSubLayers.map(layer => {
                const mapping: Record<string, string> = {
                  'hospital': 'Hospital',
                  'health_centre': 'Health Centre',
                  'nursing_home': 'Nursing Home'
                };
                return mapping[layer] || layer;
              })}
              subtypes={[
                { name: 'Hospital', icon: Cross },
                { name: 'Health Centre', icon: Heart },
                { name: 'Nursing Home', icon: Home }
              ]}
              categoryName="Healthcare Facilities"
              activeSector={activeSector}
              title="Hazard Exposure Distribution - Selected Categories"
            />
          ) : (
            <ImpactDistributionDataDriven
              infraKey="healthcare"
              activeHazardLayerId={activeHazardLayerId}
              activeHazardKey={activeHazardKey}
              selectedWardId={selectedWardId}
              subtypes={[
                { name: 'Hospital', icon: Cross },
                { name: 'Health Centre', icon: Heart },
                { name: 'Nursing Home', icon: Home }
              ]}
              categoryName="Healthcare Facilities"
              activeSector={activeSector}
              title="Hazard Exposure Distribution"
            />
          )}
        </>
      )}

      {/* Public Amenities */}
      {hasActivePublicAmenities && (
        <>
          <SectionHeader 
            icon={Users} 
            title="Public Amenities & Social Infrastructure"
            color="#06B6D4"
            count={Object.values(publicAmenitiesCounts).reduce((sum, count) => sum + count, 0)}
            variant="subtitle"
          />
          
          <div className="grid grid-cols-2 gap-2">
            {activePublicAmenitiesSubLayers.length > 0 ? (
              <>
                <KPITile
                  title={KPI_LABELS.publicAmenities.selectedFacilities.title}
                  value={(() => {
                    const totalCount = Object.values(publicAmenitiesCounts).reduce((sum, count) => sum + count, 0);
                    const selectedCount = activePublicAmenitiesSubLayers.reduce((sum, layerName) => {
                      const countKey = getPublicAmenitiesCountKey(layerName);
                      return sum + (publicAmenitiesCounts[countKey] || 0);
                    }, 0);
                    return `${selectedCount}/${totalCount}`;
                  })()}
                  subtitle={KPI_LABELS.publicAmenities.selectedFacilities.subtitle}
                  color="#06B6D4"
                  percentage={(() => {
                    const totalCount = Object.values(publicAmenitiesCounts).reduce((sum, count) => sum + count, 0);
                    const selectedCount = activePublicAmenitiesSubLayers.reduce((sum, layerName) => {
                      const countKey = getPublicAmenitiesCountKey(layerName);
                      return sum + (publicAmenitiesCounts[countKey] || 0);
                    }, 0);
                    return totalCount > 0 ? `${((selectedCount / totalCount) * 100).toFixed(1)}%` : '0%';
                  })()}
                />
                <KPITile
                  title={KPI_LABELS.publicAmenities.hazardExposure.title}
                  value={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activePublicAmenitiesSubLayers.forEach((layerName) => {
                      const countKey = getPublicAmenitiesCountKey(layerName);
                      const count = publicAmenitiesCounts[countKey] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 3000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return `${totalExtreme + totalHigh}`;
                  })()}
                  subtitle={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activePublicAmenitiesSubLayers.forEach((layerName) => {
                      const countKey = getPublicAmenitiesCountKey(layerName);
                      const count = publicAmenitiesCounts[countKey] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 3000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalExtreme === 0 && totalHigh === 0 ? 'No Hazard Data' : `${totalExtreme} in Extreme, ${totalHigh} in High Hazard`;
                  })()}
                  color={activeSector === 'heat' ? HEAT_COLORS.extreme : activeSector === 'air' ? AQI_COLORS.unhealthy : FLOOD_COLORS.high}
                  percentage={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    let totalSelected = 0;
                    
                    activePublicAmenitiesSubLayers.forEach((layerName) => {
                      const countKey = getPublicAmenitiesCountKey(layerName);
                      const count = publicAmenitiesCounts[countKey] || 0;
                      totalSelected += count;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 3000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalSelected > 0 ? `${(((totalExtreme + totalHigh) / totalSelected) * 100).toFixed(1)}%` : '0%';
                  })()}
                />
              </>
            ) : (
              <>
                <KPITile
                  title={KPI_LABELS.publicAmenities.totalFacilities.title}
                  value={String(Object.values(publicAmenitiesCounts).reduce((sum, count) => sum + count, 0))}
                  subtitle={KPI_LABELS.publicAmenities.totalFacilities.subtitle}
                  color="#06B6D4"
                  percentage="100%"
                />
                <KPITile
                  title={KPI_LABELS.publicAmenities.highHazardExposure.title}
                  value={`${publicAmenitiesExposure.extreme + publicAmenitiesExposure.high + publicAmenitiesExposure.moderate}`}
                  subtitle={KPI_LABELS.publicAmenities.highHazardExposure.subtitle}
                  color={activeSector === 'heat' ? HEAT_COLORS.extreme : activeSector === 'air' ? AQI_COLORS.unhealthy : activeSector === 'flood' ? FLOOD_COLORS.high : MULTI_HAZARD_COLORS.high}
                  percentage={publicAmenitiesExposure.total > 0 ? `${(((publicAmenitiesExposure.extreme + publicAmenitiesExposure.high + publicAmenitiesExposure.moderate) / publicAmenitiesExposure.total) * 100).toFixed(1)}%` : '0%'}
                />
              </>
            )}
          </div>

          {activePublicAmenitiesSubLayers.length > 0 ? (
            <DetailedBreakdownDataDriven
              infraKey="public_amenities"
              activeHazardLayerId={activeHazardLayerId}
              activeHazardKey={activeHazardKey}
              selectedWardId={selectedWardId}
              selectedSubtypes={activePublicAmenitiesSubLayers.map(layer => {
                const mapping: Record<string, string> = {
                  'community_centre': 'Community Centre',
                  'culture_centre': 'Culture Centre',
                  'fire_station': 'Fire Station',
                  'government_buildings': 'Government Buildings',
                  'parks': 'Park',
                  'police_outpost': 'Police Outpost',
                  'post_office': 'Post Office',
                  'telephone_exchange': 'Telephone Exchange',
                  'haat_market': 'Haat/ Market',
                  'playground': 'Playground/Stadium',
                  'religious': 'Religious',
                  'vending_zones': 'Vending Zones'
                };
                return mapping[layer] || layer;
              })}
              subtypes={[
                { name: 'Community Centre', icon: Users },
                { name: 'Culture Centre', icon: Landmark },
                { name: 'Fire Station', icon: Flame },
                { name: 'Government Buildings', icon: Building2 },
                { name: 'Park', icon: TreePine },
                { name: 'Police Outpost', icon: ShieldAlert },
                { name: 'Post Office', icon: Mail },
                { name: 'Telephone Exchange', icon: Phone },
                { name: 'Haat/ Market', icon: ShoppingBag },
                { name: 'Playground/Stadium', icon: PlayCircle },
                { name: 'Religious', icon: Church },
                { name: 'Vending Zones', icon: Store }
              ]}
              categoryName="Public Amenities & Social Infrastructure"
              activeSector={activeSector}
              title="Hazard Exposure Distribution - Selected Categories"
            />
          ) : (
            <ImpactDistributionDataDriven
              infraKey="public_amenities"
              activeHazardLayerId={activeHazardLayerId}
              activeHazardKey={activeHazardKey}
              selectedWardId={selectedWardId}
              subtypes={[
                { name: 'Community Centre', icon: Users },
                { name: 'Culture Centre', icon: Landmark },
                { name: 'Fire Station', icon: Flame },
                { name: 'Government Buildings', icon: Building2 },
                { name: 'Park', icon: TreePine },
                { name: 'Police Outpost', icon: ShieldAlert },
                { name: 'Post Office', icon: Mail },
                { name: 'Telephone Exchange', icon: Phone },
                { name: 'Haat/ Market', icon: ShoppingBag },
                { name: 'Playground/Stadium', icon: PlayCircle },
                { name: 'Religious', icon: Church },
                { name: 'Vending Zones', icon: Store }
              ]}
              categoryName="Public Amenities & Social Infrastructure"
              activeSector={activeSector}
              title="Hazard Exposure Distribution"
            />
          )}
        </>
      )}

      {/* Transport & Mobility */}
      {hasActiveTransport && (
        <>
          <SectionHeader 
            icon={MapPin} 
            title="Transport & Mobility Infrastructure"
            color="#F59E0B"
            count={Object.values(transportCounts).reduce((sum, count) => sum + count, 0)}
            variant="subtitle"
          />
          
          <div className="grid grid-cols-2 gap-2">
            {activeTransportSubLayers.length > 0 ? (
              <>
                <KPITile
                  title={KPI_LABELS.transport.selectedFacilities.title}
                  value={(() => {
                    const totalCount = Object.values(transportCounts).reduce((sum, count) => sum + count, 0);
                    const selectedCount = activeTransportSubLayers.reduce((sum, layerName) => {
                      const countKey = getTransportCountKey(layerName);
                      return sum + (transportCounts[countKey] || 0);
                    }, 0);
                    return `${selectedCount}/${totalCount}`;
                  })()}
                  subtitle={KPI_LABELS.transport.selectedFacilities.subtitle}
                  color="#F59E0B"
                  percentage={(() => {
                    const totalCount = Object.values(transportCounts).reduce((sum, count) => sum + count, 0);
                    const selectedCount = activeTransportSubLayers.reduce((sum, layerName) => {
                      const countKey = getTransportCountKey(layerName);
                      return sum + (transportCounts[countKey] || 0);
                    }, 0);
                    return totalCount > 0 ? `${((selectedCount / totalCount) * 100).toFixed(1)}%` : '0%';
                  })()}
                />
                <KPITile
                  title={KPI_LABELS.transport.hazardExposure.title}
                  value={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activeTransportSubLayers.forEach((layerName) => {
                      const countKey = getTransportCountKey(layerName);
                      const count = transportCounts[countKey] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 4000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return `${totalExtreme + totalHigh}`;
                  })()}
                  subtitle={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activeTransportSubLayers.forEach((layerName) => {
                      const countKey = getTransportCountKey(layerName);
                      const count = transportCounts[countKey] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 4000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalExtreme === 0 && totalHigh === 0 ? 'No Hazard Data' : `${totalExtreme} in Extreme, ${totalHigh} in High Hazard`;
                  })()}
                  color={activeSector === 'heat' ? HEAT_COLORS.extreme : activeSector === 'air' ? AQI_COLORS.unhealthy : FLOOD_COLORS.high}
                  percentage={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    let totalSelected = 0;
                    
                    activeTransportSubLayers.forEach((layerName) => {
                      const countKey = getTransportCountKey(layerName);
                      const count = transportCounts[countKey] || 0;
                      totalSelected += count;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 4000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalSelected > 0 ? `${(((totalExtreme + totalHigh) / totalSelected) * 100).toFixed(1)}%` : '0%';
                  })()}
                />
              </>
            ) : (
              <>
                <KPITile
                  title={KPI_LABELS.transport.totalHubs.title}
                  value={String(Object.values(transportCounts).reduce((sum, count) => sum + count, 0))}
                  subtitle={KPI_LABELS.transport.totalHubs.subtitle}
                  color="#F59E0B"
                  percentage="100%"
                />
                <KPITile
                  title={KPI_LABELS.transport.highHazardExposure.title}
                  value={`${transportExposure.extreme + transportExposure.high + transportExposure.moderate}`}
                  subtitle={KPI_LABELS.transport.highHazardExposure.subtitle}
                  color={activeSector === 'heat' ? HEAT_COLORS.extreme : activeSector === 'air' ? AQI_COLORS.unhealthy : activeSector === 'flood' ? FLOOD_COLORS.high : MULTI_HAZARD_COLORS.high}
                  percentage={transportExposure.total > 0 ? `${(((transportExposure.extreme + transportExposure.high + transportExposure.moderate) / transportExposure.total) * 100).toFixed(1)}%` : '0%'}
                />
              </>
            )}
          </div>

          {activeTransportSubLayers.length > 0 ? (
            <DetailedBreakdownDataDriven
              infraKey="transport_mobility"
              activeHazardLayerId={activeHazardLayerId}
              activeHazardKey={activeHazardKey}
              selectedWardId={selectedWardId}
              selectedSubtypes={activeTransportSubLayers.map(layer => {
                const mapping: Record<string, string> = {
                  'airport': 'Airport',
                  'bus_terminals': 'Bus Terminal',
                  'bus_stop': 'Bus Stop',
                  'ev_charging': 'EV Charging Station',
                  'petrol_pump': 'Petrol Pump',
                  'railway_stations': 'Railway Station'
                };
                return mapping[layer] || layer;
              })}
              subtypes={[
                { name: 'Airport', icon: Plane },
                { name: 'Bus Terminal', icon: Bus },
                { name: 'Bus Stop', icon: Bus },
                { name: 'EV Charging Station', icon: Zap },
                { name: 'Petrol Pump', icon: Fuel },
                { name: 'Railway Station', icon: Train }
              ]}
              categoryName="Transport & Mobility Infrastructure"
              activeSector={activeSector}
              title="Hazard Exposure Distribution - Selected Categories"
            />
          ) : (
            <ImpactDistributionDataDriven
              infraKey="transport_mobility"
              activeHazardLayerId={activeHazardLayerId}
              activeHazardKey={activeHazardKey}
              selectedWardId={selectedWardId}
              subtypes={[
                { name: 'Airport', icon: Plane },
                { name: 'Bus Terminal', icon: Bus },
                { name: 'Bus Stop', icon: Bus },
                { name: 'EV Charging Station', icon: Zap },
                { name: 'Petrol Pump', icon: Fuel },
                { name: 'Railway Station', icon: Train }
              ]}
              categoryName="Transport & Mobility Infrastructure"
              activeSector={activeSector}
              title="Hazard Exposure Distribution"
            />
          )}
        </>
      )}

      {/* Road Network */}
      {hasActiveRoadNetwork && (
        <>
          {/* Loading State */}
          {roadNetworkData.loading && (
            <div className="border border-[#FEF3C7] bg-[#FFFBEB] rounded-xl p-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="relative w-6 h-6 flex-shrink-0">
                  <div className="absolute inset-0 border-2 border-amber-100 rounded-full" />
                  <div className="absolute inset-0 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-amber-700">Analysing road network…</p>
                  <p className="text-[9px] text-amber-600/70 mt-0.5">Computing hazard exposure distribution</p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {roadNetworkData.error && !roadNetworkData.loading && (
            <div className="border border-[#E5E7EB] rounded-lg p-6 bg-white shadow-sm mb-3 text-center">
              <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
              <div className="text-[10px] text-[#EF4444]">Failed to load road network data</div>
              <div className="text-[9px] text-[#64748B] mt-1">{roadNetworkData.error}</div>
            </div>
          )}

          {/* Data Display */}
          {roadNetworkData.data && !roadNetworkData.loading && (
            <>
              {/* Stacked Horizontal Bar Chart - Road Type Breakdown */}
              <RoadNetworkStackedBarChart data={roadNetworkData.data} hasActiveRoadSafety={hasActiveRoadSafety} />
            </>
          )}
        </>
      )}


    </>
  );
}

// ==================== CASE 3: Ward Hazard Overview ====================
function WardHazardOverview({ activeSector, wardName }: { activeSector: Sector, wardName: string }) {
  const getColors = () => {
    if (activeSector === 'heat') return HEAT_COLORS;
    if (activeSector === 'air') return AQI_COLORS;
    if (activeSector === 'flood') return FLOOD_COLORS;
    return HEAT_COLORS;
  };

  const colors = getColors();

  if (activeSector === 'heat') {
    return (
      <>
        <div className="grid grid-cols-2 gap-2">
          <KPITile
            title={KPI_LABELS.wardAnalytics.wardArea.title}
            value="6.2 km²"
            subtitle={KPI_LABELS.wardAnalytics.wardArea.subtitle}
            color={HEAT_COLORS.high}
            percentage="78.4%"
          />
          <KPITile
            title={KPI_LABELS.wardAnalytics.population.title}
            value="42,340"
            subtitle={KPI_LABELS.wardAnalytics.population.subtitle}
            color={HEAT_COLORS.extreme}
            percentage="100%"
          />
          <KPITile
            title={KPI_LABELS.wardAnalytics.buildings.title}
            value="3,240"
            subtitle={KPI_LABELS.wardAnalytics.buildings.subtitle}
            color={HEAT_COLORS.high}
            percentage="85.2%"
          />
          <KPITile
            title={KPI_LABELS.wardAnalytics.infraPublicServices.title}
            value="28"
            subtitle={KPI_LABELS.wardAnalytics.infraPublicServices.subtitle}
            color={HEAT_COLORS.extreme}
            percentage="62.2%"
          />
        </div>

        <ChartCard title={`${wardName} - Heat Distribution`}>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Pie
                data={[
                  { name: 'Low', value: 0.8, color: HEAT_COLORS.low },
                  { name: 'Moderate', value: 1.3, color: HEAT_COLORS.moderate },
                  { name: 'High', value: 3.2, color: HEAT_COLORS.high },
                  { name: 'Extreme', value: 0.9, color: HEAT_COLORS.extreme },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value} km²`}
              >
                {[HEAT_COLORS.low, HEAT_COLORS.moderate, HEAT_COLORS.high, HEAT_COLORS.extreme].map((color, idx) => (
                  <Cell key={`cell-${idx}`} fill={color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 10,
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: '#FFFFFF', fontSize: 10 }}
                itemStyle={{ color: '#FFFFFF', fontSize: 10 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <StatsCard
          title="Ward Infra. & Public Services Summary"
          stats={[
            { label: 'Schools', value: '8', color: '#8B5CF6' },
            { label: 'Hospitals', value: '2', color: '#EF4444' },
            { label: 'Community Centers', value: '3', color: '#06B6D4' },
            { label: 'Transit Stops', value: '15', color: '#F59E0B' },
          ]}
          isDummy={true}
        />
      </>
    );
  }

  if (activeSector === 'air') {
    return (
      <>
        <ChartCard title={`${wardName} - Area Distribution by Air Quality`}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={[
              { name: 'Good', value: 0.5, color: AQI_COLORS.good },
              { name: 'Moderate', value: 1.2, color: AQI_COLORS.moderate },
              { name: 'Unhealthy (S)', value: 2.8, color: AQI_COLORS.unhealthySensitive },
              { name: 'Unhealthy', value: 1.4, color: AQI_COLORS.unhealthy },
              { name: 'V.Unhealthy', value: 0.3, color: AQI_COLORS.veryUnhealthy },
              { name: 'Hazardous', value: 0.2, color: AQI_COLORS.hazardous },
            ]}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v} km²`} />
              <Tooltip
                contentStyle={{
                  fontSize: 10,
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: '#FFFFFF', fontSize: 10 }}
                itemStyle={{ color: '#FFFFFF', fontSize: 10 }}
                cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                formatter={(value: number) => [`${value} km²`, 'Area']}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {[AQI_COLORS.good, AQI_COLORS.moderate, AQI_COLORS.unhealthySensitive, AQI_COLORS.unhealthy, AQI_COLORS.veryUnhealthy, AQI_COLORS.hazardous].map((color, idx) => (
                  <Cell key={`cell-${idx}`} fill={color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <StatsCard
          title={getBuildingExposureTitle(activeLayerId)}
          stats={[
            { label: 'Good', value: '412', color: AQI_COLORS.good },
            { label: 'Moderate', value: '856', color: AQI_COLORS.moderate },
            { label: 'Unhealthy for Sensitive Groups', value: '1,234', color: AQI_COLORS.unhealthySensitive },
            { label: 'Unhealthy', value: '567', color: AQI_COLORS.unhealthy },
            { label: 'Very Unhealthy', value: '123', color: AQI_COLORS.veryUnhealthy },
            { label: 'Hazardous', value: '45', color: AQI_COLORS.hazardous },
          ]}
          isDummy={true}
        />
      </>
    );
  }

  if (activeSector === 'flood') {
    return (
      <>
        <ChartCard title={`${wardName} - Area Distribution by Flood Risk`}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={[
              { name: 'No Risk', value: 3.2, color: FLOOD_COLORS.noRisk },
              { name: 'Low', value: 1.8, color: FLOOD_COLORS.low },
              { name: 'Moderate', value: 0.8, color: FLOOD_COLORS.moderate },
              { name: 'High', value: 0.3, color: FLOOD_COLORS.high },
              { name: 'V.High', value: 0.1, color: FLOOD_COLORS.veryHigh },
            ]}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v} km²`} />
              <Tooltip
                contentStyle={{
                  fontSize: 10,
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: '#FFFFFF', fontSize: 10 }}
                itemStyle={{ color: '#FFFFFF', fontSize: 10 }}
                cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                formatter={(value: number) => [`${value} km²`, 'Area']}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {[FLOOD_COLORS.noRisk, FLOOD_COLORS.low, FLOOD_COLORS.moderate, FLOOD_COLORS.high, FLOOD_COLORS.veryHigh].map((color, idx) => (
                  <Cell key={`cell-${idx}`} fill={color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <StatsCard
          title={getBuildingExposureTitle(activeLayerId)}
          stats={[
            { label: 'No Risk', value: '2,145', color: FLOOD_COLORS.noRisk },
            { label: 'Low Risk', value: '734', color: FLOOD_COLORS.low },
            { label: 'Moderate Risk', value: '256', color: FLOOD_COLORS.moderate },
            { label: 'High Risk', value: '89', color: FLOOD_COLORS.high },
            { label: 'Very High Risk', value: '16', color: FLOOD_COLORS.veryHigh },
          ]}
          isDummy={true}
        />
      </>
    );
  }

  // Multi-hazard
  return (
    <>
      <ChartCard title={`${wardName} - Multi-Hazard Risk Level`}>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={[
            { name: 'Low', value: 2.1, color: MULTI_HAZARD_COLORS.low },
            { name: 'Moderate', value: 2.8, color: MULTI_HAZARD_COLORS.moderate },
            { name: 'High', value: 1.1, color: MULTI_HAZARD_COLORS.high },
            { name: 'Very High', value: 0.2, color: MULTI_HAZARD_COLORS.veryHigh },
          ]}
          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v} km²`} />
            <Tooltip
              contentStyle={{
                fontSize: 10,
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                padding: '8px 12px'
              }}
              labelStyle={{ color: '#FFFFFF', fontSize: 10 }}
              itemStyle={{ color: '#FFFFFF', fontSize: 10 }}
              cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
              formatter={(value: number) => [`${value} km²`, 'Area']}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {[MULTI_HAZARD_COLORS.low, MULTI_HAZARD_COLORS.moderate, MULTI_HAZARD_COLORS.high, MULTI_HAZARD_COLORS.veryHigh].map((color, idx) => (
                <Cell key={`cell-${idx}`} fill={color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <StatsCard
        title={getBuildingExposureTitle(activeLayerId)}
        stats={[
          { label: 'Low Risk', value: '1,234', color: MULTI_HAZARD_COLORS.low },
          { label: 'Moderate Risk', value: '1,567', color: MULTI_HAZARD_COLORS.moderate },
          { label: 'High Risk', value: '389', color: MULTI_HAZARD_COLORS.high },
          { label: 'Very High Risk', value: '50', color: MULTI_HAZARD_COLORS.veryHigh },
        ]}
        isDummy={true}
      />
    </>
  );
}

// ==================== CASE 4: Ward Infrastructure Impact ====================
interface WardInfrastructureImpactProps {
  activeSector: Sector;
  activeLayerId: string;
  wardName: string;
  activeInfraLayers: string[];
  hasActiveEducation: boolean;
  hasActiveHealthcare: boolean;
  hasActivePublicAmenities: boolean;
  hasActiveTransport: boolean;
  activeEducationSubLayers: string[];
  activeHealthcareSubLayers: string[];
  healthcareCounts: Record<string, number>;
}

function WardInfrastructureImpact({ 
  activeSector,
  activeLayerId,
  wardName,
  activeInfraLayers,
  hasActiveEducation,
  hasActiveHealthcare,
  hasActivePublicAmenities,
  hasActiveTransport,
  activeEducationSubLayers,
  activeHealthcareSubLayers,
  healthcareCounts
}: WardInfrastructureImpactProps) {
  
  const getColors = () => {
    if (activeSector === 'heat') return HEAT_COLORS;
    if (activeSector === 'air') return AQI_COLORS;
    if (activeSector === 'flood') return FLOOD_COLORS;
    return HEAT_COLORS;
  };

  const colors = getColors();

  return (
    <>
      {/* Ward Context Banner */}
      <div className="bg-gradient-to-r from-[#2563EB]/10 to-[#60A5FA]/10 border border-[#2563EB]/20 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-[#2563EB]" />
          <span className="text-xs font-semibold text-[#0F172A]">{wardName}</span>
        </div>
        <div className="text-[10px] text-[#64748B]">
          Showing infrastructure exposure for selected ward only
        </div>
      </div>

      {/* Always show core 4 sections for ward */}
      {activeSector === 'heat' && (
        <>
          {!hasActiveEducation && !hasActiveHealthcare && !hasActivePublicAmenities && !hasActiveTransport && (
            <>
              <ChartCard title={`${wardName} - Area Distribution by Heat Stress`}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { name: 'Low', value: 0.8, color: HEAT_COLORS.low },
                { name: 'Moderate', value: 1.3, color: HEAT_COLORS.moderate },
                { name: 'High', value: 3.2, color: HEAT_COLORS.high },
                { name: 'Extreme', value: 0.9, color: HEAT_COLORS.extreme },
              ]}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v} km²`} />
                <Tooltip
                  contentStyle={{
                    fontSize: 10,
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: '#FFFFFF', fontSize: 10 }}
                  itemStyle={{ color: '#FFFFFF', fontSize: 10 }}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                  formatter={(value: number) => [`${value} km²`, 'Area']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {[HEAT_COLORS.low, HEAT_COLORS.moderate, HEAT_COLORS.high, HEAT_COLORS.extreme].map((color, idx) => (
                    <Cell key={`cell-${idx}`} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <StatsCard
            title={getBuildingExposureTitle(activeLayerId)}
            stats={[
              { label: 'Low Heat Stress', value: '456', color: HEAT_COLORS.low },
              { label: 'Moderate Heat Stress', value: '1,234', color: HEAT_COLORS.moderate },
              { label: 'High Heat Stress', value: '1,345', color: HEAT_COLORS.high },
              { label: 'Extreme Heat Stress', value: '205', color: HEAT_COLORS.extreme },
            ]}
            isDummy={true}
          />

          <StatsCard
            title={`${wardName} - Road Network`}
            stats={[
              { label: 'National Highway', value: '2.4 km', color: HEAT_COLORS.extreme },
              { label: 'State Highway', value: '3.8 km', color: HEAT_COLORS.high },
              { label: 'District Road', value: '8.6 km', color: HEAT_COLORS.high },
            ]}
            isDummy={true}
          />
            </>
          )}
        </>
      )}

      {activeSector === 'air' && (
        <>
          {!hasActiveEducation && !hasActiveHealthcare && !hasActivePublicAmenities && !hasActiveTransport && (
            <>
              <ChartCard title={`${wardName} - Area Distribution by Air Quality`}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { name: 'Good', value: 0.5, color: AQI_COLORS.good },
                { name: 'Moderate', value: 1.2, color: AQI_COLORS.moderate },
                { name: 'Unhealthy (S)', value: 2.8, color: AQI_COLORS.unhealthySensitive },
                { name: 'Unhealthy', value: 1.4, color: AQI_COLORS.unhealthy },
                { name: 'V.Unhealthy', value: 0.3, color: AQI_COLORS.veryUnhealthy },
                { name: 'Hazardous', value: 0.2, color: AQI_COLORS.hazardous },
              ]}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v} km²`} />
                <Tooltip
                  contentStyle={{
                    fontSize: 10,
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: '#FFFFFF', fontSize: 10 }}
                  itemStyle={{ color: '#FFFFFF', fontSize: 10 }}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                  formatter={(value: number) => [`${value} km²`, 'Area']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {[AQI_COLORS.good, AQI_COLORS.moderate, AQI_COLORS.unhealthySensitive, AQI_COLORS.unhealthy, AQI_COLORS.veryUnhealthy, AQI_COLORS.hazardous].map((color, idx) => (
                    <Cell key={`cell-${idx}`} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <StatsCard
            title={getBuildingExposureTitle(activeLayerId)}
            stats={[
              { label: 'Good', value: '412', color: AQI_COLORS.good },
              { label: 'Moderate', value: '856', color: AQI_COLORS.moderate },
              { label: 'Unhealthy for Sensitive Groups', value: '1,234', color: AQI_COLORS.unhealthySensitive },
              { label: 'Unhealthy', value: '567', color: AQI_COLORS.unhealthy },
              { label: 'Very Unhealthy', value: '123', color: AQI_COLORS.veryUnhealthy },
              { label: 'Hazardous', value: '45', color: AQI_COLORS.hazardous },
            ]}
            isDummy={true}
          />

            </>
          )}
        </>
      )}

      {activeSector === 'flood' && (
        <>
          {!hasActiveEducation && !hasActiveHealthcare && !hasActivePublicAmenities && !hasActiveTransport && (
            <>
              <ChartCard title={`${wardName} - Area Distribution by Flood Risk`}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { name: 'No Risk', value: 3.2, color: FLOOD_COLORS.noRisk },
                { name: 'Low', value: 1.8, color: FLOOD_COLORS.low },
                { name: 'Moderate', value: 0.8, color: FLOOD_COLORS.moderate },
                { name: 'High', value: 0.3, color: FLOOD_COLORS.high },
                { name: 'V.High', value: 0.1, color: FLOOD_COLORS.veryHigh },
              ]}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v} km²`} />
                <Tooltip
                  contentStyle={{
                    fontSize: 10,
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: '#FFFFFF', fontSize: 10 }}
                  itemStyle={{ color: '#FFFFFF', fontSize: 10 }}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                  formatter={(value: number) => [`${value} km²`, 'Area']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {[FLOOD_COLORS.noRisk, FLOOD_COLORS.low, FLOOD_COLORS.moderate, FLOOD_COLORS.high, FLOOD_COLORS.veryHigh].map((color, idx) => (
                    <Cell key={`cell-${idx}`} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <StatsCard
            title={getBuildingExposureTitle(activeLayerId)}
            stats={[
              { label: 'No Risk', value: '2,145', color: FLOOD_COLORS.noRisk },
              { label: 'Low Risk', value: '734', color: FLOOD_COLORS.low },
              { label: 'Moderate Risk', value: '256', color: FLOOD_COLORS.moderate },
              { label: 'High Risk', value: '89', color: FLOOD_COLORS.high },
              { label: 'Very High Risk', value: '16', color: FLOOD_COLORS.veryHigh },
            ]}
            isDummy={true}
          />
            </>
          )}
        </>
      )}

      {activeSector === 'multi' && (
        <>
          {!hasActiveEducation && !hasActiveHealthcare && !hasActivePublicAmenities && !hasActiveTransport && (
            <>
              <ChartCard title={`${wardName} - Multi-Hazard Risk Level`}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[
                { name: 'Low', value: 2.1, color: MULTI_HAZARD_COLORS.low },
                { name: 'Moderate', value: 2.8, color: MULTI_HAZARD_COLORS.moderate },
                { name: 'High', value: 1.1, color: MULTI_HAZARD_COLORS.high },
                { name: 'Very High', value: 0.2, color: MULTI_HAZARD_COLORS.veryHigh },
              ]}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v} km²`} />
                <Tooltip
                  contentStyle={{
                    fontSize: 10,
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: '#FFFFFF', fontSize: 10 }}
                  itemStyle={{ color: '#FFFFFF', fontSize: 10 }}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                  formatter={(value: number) => [`${value} km²`, 'Area']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {[MULTI_HAZARD_COLORS.low, MULTI_HAZARD_COLORS.moderate, MULTI_HAZARD_COLORS.high, MULTI_HAZARD_COLORS.veryHigh].map((color, idx) => (
                    <Cell key={`cell-${idx}`} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <StatsCard
            title={getBuildingExposureTitle(activeLayerId)}
            stats={[
              { label: 'Low Risk', value: '1,234', color: MULTI_HAZARD_COLORS.low },
              { label: 'Moderate Risk', value: '1,567', color: MULTI_HAZARD_COLORS.moderate },
              { label: 'High Risk', value: '389', color: MULTI_HAZARD_COLORS.high },
              { label: 'Very High Risk', value: '50', color: MULTI_HAZARD_COLORS.veryHigh },
            ]}
            isDummy={true}
          />

            </>
          )}
        </>
      )}

      {/* Educational Institutions in Ward */}
      {hasActiveEducation && (
        <>
          <SectionHeader 
            icon={School} 
            title="Educational Institutions"
            color="#8B5CF6"
            count={8}
            variant="subtitle"
          />
          
          <div className="grid grid-cols-2 gap-2">
            {activeEducationSubLayers.length > 0 ? (
              <>
                <KPITile
                  title={KPI_LABELS.wardEducation.selectedFacilities.title}
                  value={(() => {
                    const selectedData = [
                      { name: 'university', count: 1 },
                      { name: 'college', count: 1 },
                      { name: 'school', count: 5 },
                      { name: 'anganwadi', count: 1 },
                    ];
                    const selectedCount = selectedData
                      .filter(item => activeEducationSubLayers.includes(item.name))
                      .reduce((sum, item) => sum + item.count, 0);
                    return `${selectedCount}/8`;
                  })()}
                  subtitle={KPI_LABELS.wardEducation.selectedFacilities.subtitle}
                  color="#8B5CF6"
                  percentage={(() => {
                    const selectedData = [
                      { name: 'university', count: 1 },
                      { name: 'college', count: 1 },
                      { name: 'school', count: 5 },
                      { name: 'anganwadi', count: 1 },
                    ];
                    const selectedCount = selectedData
                      .filter(item => activeEducationSubLayers.includes(item.name))
                      .reduce((sum, item) => sum + item.count, 0);
                    return `${((selectedCount / 8) * 100).toFixed(1)}%`;
                  })()}
                />
                <KPITile
                  title={KPI_LABELS.wardEducation.hazardExposure.title}
                  value={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activeEducationSubLayers.forEach((layerName) => {
                      const count = educationCounts[layerName] || educationCounts[layerName + 's'] || educationCounts[layerName.replace(/s$/, '')] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 1000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return `${totalExtreme + totalHigh}`;
                  })()}
                  subtitle={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activeEducationSubLayers.forEach((layerName) => {
                      const count = educationCounts[layerName] || educationCounts[layerName + 's'] || educationCounts[layerName.replace(/s$/, '')] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 1000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalExtreme === 0 && totalHigh === 0 ? 'No Hazard Data' : `${totalExtreme} in Extreme, ${totalHigh} in High Hazard`;
                  })()}
                  color={colors.extreme || colors.high}
                  percentage={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    let totalSelected = 0;
                    
                    activeEducationSubLayers.forEach((layerName) => {
                      const count = educationCounts[layerName] || educationCounts[layerName + 's'] || educationCounts[layerName.replace(/s$/, '')] || 0;
                      totalSelected += count;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 1000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalSelected > 0 ? `${(((totalExtreme + totalHigh) / totalSelected) * 100).toFixed(1)}%` : '0%';
                  })()}
                />
              </>
            ) : (
              <>
                <KPITile
                  title={KPI_LABELS.wardEducation.inWard.title}
                  value="8"
                  subtitle={KPI_LABELS.wardEducation.inWard.subtitle}
                  color="#8B5CF6"
                  percentage="100%"
                />
                <KPITile
                  title={KPI_LABELS.wardEducation.highRisk.title}
                  value="6"
                  subtitle={KPI_LABELS.wardEducation.highRisk.subtitle}
                  color={colors.extreme || colors.high}
                  percentage="75%"
                />
              </>
            )}
          </div>

          <DetailedList
            items={[
              { name: 'DAV Public School', type: 'School', risk: 'High', students: 1240, color: colors.high },
              { name: 'Kendriya Vidyalaya', type: 'School', risk: 'High', students: 890, color: colors.high },
              { name: 'St. Xavier\'s College', type: 'College', risk: 'Extreme', students: 2340, color: colors.extreme },
              { name: 'Anganwadi Center 42-A', type: 'Anganwadi', risk: 'Moderate', students: 45, color: colors.moderate },
            ]}
          />

          {activeSector === 'heat' && !isBaseline && scenarioData && baselineData && (
            <StatsCard
              title="Scenario Impact Summary"
              stats={[
                { 
                  label: 'Educational Facilities', 
                  value: `+${scenarioData.educationHigh - baselineData.educationHigh} more at risk`, 
                  color: HEAT_COLORS.extreme 
                },
                { 
                  label: 'Healthcare Facilities', 
                  value: `+${scenarioData.healthcareHigh - baselineData.healthcareHigh} more at risk`, 
                  color: HEAT_COLORS.high 
                },
                { 
                  label: 'Total Infra. & Services', 
                  value: `+${scenarioData.infrastructure - baselineData.infrastructure} increase`, 
                  color: HEAT_COLORS.extreme 
                },
              ]}
            />
          )}
        </>
      )}

      {/* Healthcare in Ward */}
      {hasActiveHealthcare && (
        <>
          <SectionHeader 
            icon={Heart} 
            title="Healthcare Facilities"
            color="#EF4444"
            count={2}
            variant="subtitle"
          />
          
          <div className="grid grid-cols-2 gap-2">
            {activeHealthcareSubLayers.length > 0 ? (
              <>
                <KPITile
                  title={KPI_LABELS.wardHealthcare.selectedFacilities.title}
                  value={(() => {
                    const selectedData = [
                      { name: 'hospital', count: 1 },
                      { name: 'dispensary', count: 0 },
                      { name: 'nursing', count: 0 },
                      { name: 'health_centre', count: 1 },
                      { name: 'maternity', count: 0 },
                    ];
                    const selectedCount = selectedData
                      .filter(item => activeHealthcareSubLayers.includes(item.name))
                      .reduce((sum, item) => sum + item.count, 0);
                    return `${selectedCount}/2`;
                  })()}
                  subtitle={KPI_LABELS.wardHealthcare.selectedFacilities.subtitle}
                  color="#EF4444"
                  percentage={(() => {
                    const selectedData = [
                      { name: 'hospital', count: 1 },
                      { name: 'dispensary', count: 0 },
                      { name: 'nursing', count: 0 },
                      { name: 'health_centre', count: 1 },
                      { name: 'maternity', count: 0 },
                    ];
                    const selectedCount = selectedData
                      .filter(item => activeHealthcareSubLayers.includes(item.name))
                      .reduce((sum, item) => sum + item.count, 0);
                    return `${((selectedCount / 2) * 100).toFixed(1)}%`;
                  })()}
                />
                <KPITile
                  title={KPI_LABELS.wardHealthcare.hazardExposure.title}
                  value={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activeHealthcareSubLayers.forEach((layerName) => {
                      const countKey = getHealthcareCountKey(layerName);
                      const count = healthcareCounts[countKey] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 2000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return `${totalExtreme + totalHigh}`;
                  })()}
                  subtitle={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activeHealthcareSubLayers.forEach((layerName) => {
                      const countKey = getHealthcareCountKey(layerName);
                      const count = healthcareCounts[countKey] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 2000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalExtreme === 0 && totalHigh === 0 ? 'No Hazard Data' : `${totalExtreme} in Extreme, ${totalHigh} in High Hazard`;
                  })()}
                  color={colors.extreme || colors.high}
                  percentage={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    let totalSelected = 0;
                    
                    activeHealthcareSubLayers.forEach((layerName) => {
                      const countKey = getHealthcareCountKey(layerName);
                      const count = healthcareCounts[countKey] || 0;
                      totalSelected += count;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 2000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalSelected > 0 ? `${(((totalExtreme + totalHigh) / totalSelected) * 100).toFixed(1)}%` : '0%';
                  })()}
                />
              </>
            ) : (
              <>
                <KPITile
                  title={KPI_LABELS.wardHealthcare.inWard.title}
                  value="2"
                  subtitle={KPI_LABELS.wardHealthcare.inWard.subtitle}
                  color="#EF4444"
                  percentage="100%"
                />
                <KPITile
                  title={KPI_LABELS.wardHealthcare.highRisk.title}
                  value="1"
                  subtitle={KPI_LABELS.wardHealthcare.highRisk.subtitle}
                  color={colors.extreme || colors.high}
                  percentage="50%"
                />
              </>
            )}
          </div>

          <DetailedList
            items={[
              { name: 'Capital Hospital', type: 'Hospital', risk: 'High', students: 450, color: colors.high },
              { name: 'Primary Health Centre', type: 'Health Centre', risk: 'Moderate', students: 120, color: colors.moderate },
            ]}
          />
        </>
      )}

      {/* Public Amenities in Ward */}
      {hasActivePublicAmenities && (
        <>
          <SectionHeader 
            icon={Users} 
            title="Public Amenities & Social Infrastructure"
            color="#06B6D4"
            count={5}
            variant="subtitle"
          />
          
          <div className="grid grid-cols-2 gap-2">
            {activePublicAmenitiesSubLayers.length > 0 ? (
              <>
                <KPITile
                  title={KPI_LABELS.wardPublicAmenities.selectedFacilities.title}
                  value={(() => {
                    const selectedData = [
                      { name: 'community_centre', count: 1 },
                      { name: 'fire_station', count: 0 },
                      { name: 'park', count: 2 },
                      { name: 'police_station', count: 1 },
                      { name: 'post_office', count: 1 },
                    ];
                    const selectedCount = selectedData
                      .filter(item => activePublicAmenitiesSubLayers.includes(item.name))
                      .reduce((sum, item) => sum + item.count, 0);
                    return `${selectedCount}/5`;
                  })()}
                  subtitle={KPI_LABELS.wardPublicAmenities.selectedFacilities.subtitle}
                  color="#06B6D4"
                  percentage={(() => {
                    const selectedData = [
                      { name: 'community_centre', count: 1 },
                      { name: 'fire_station', count: 0 },
                      { name: 'park', count: 2 },
                      { name: 'police_station', count: 1 },
                      { name: 'post_office', count: 1 },
                    ];
                    const selectedCount = selectedData
                      .filter(item => activePublicAmenitiesSubLayers.includes(item.name))
                      .reduce((sum, item) => sum + item.count, 0);
                    return `${((selectedCount / 5) * 100).toFixed(1)}%`;
                  })()}
                />
                <KPITile
                  title={KPI_LABELS.wardPublicAmenities.hazardExposure.title}
                  value={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activePublicAmenitiesSubLayers.forEach((layerName) => {
                      const amenitiesCounts = getPublicAmenitiesCounts(selectedWardId);
                      const count = amenitiesCounts[layerName] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 3000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return `${totalExtreme + totalHigh}`;
                  })()}
                  subtitle={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activePublicAmenitiesSubLayers.forEach((layerName) => {
                      const amenitiesCounts = getPublicAmenitiesCounts(selectedWardId);
                      const count = amenitiesCounts[layerName] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 3000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalExtreme === 0 && totalHigh === 0 ? 'No Hazard Data' : `${totalExtreme} in Extreme, ${totalHigh} in High Hazard`;
                  })()}
                  color={colors.extreme || colors.high}
                  percentage={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    let totalSelected = 0;
                    
                    activePublicAmenitiesSubLayers.forEach((layerName) => {
                      const amenitiesCounts = getPublicAmenitiesCounts(selectedWardId);
                      const count = amenitiesCounts[layerName] || 0;
                      totalSelected += count;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 3000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalSelected > 0 ? `${(((totalExtreme + totalHigh) / totalSelected) * 100).toFixed(1)}%` : '0%';
                  })()}
                />
              </>
            ) : (
              <>
                <KPITile
                  title={KPI_LABELS.wardPublicAmenities.inWard.title}
                  value="5"
                  subtitle={KPI_LABELS.wardPublicAmenities.inWard.subtitle}
                  color="#06B6D4"
                  percentage="100%"
                />
                <KPITile
                  title={KPI_LABELS.wardPublicAmenities.highRisk.title}
                  value="3"
                  subtitle={KPI_LABELS.wardPublicAmenities.highRisk.subtitle}
                  color={colors.extreme || colors.high}
                  percentage="60%"
                />
              </>
            )}
          </div>
          
          {activePublicAmenitiesSubLayers.length === 0 && (
            <StatsCard
              title="Facilities in Ward"
              stats={[
                { label: 'Community Centers', value: '1', color: '#06B6D4' },
                { label: 'Parks', value: '2', color: '#10B981' },
                { label: 'Police Outpost', value: '1', color: '#8B5CF6' },
                { label: 'Post Office', value: '1', color: '#F59E0B' },
              ]}
              isDummy={true}
            />
          )}
        </>
      )}

      {/* Transport in Ward */}
      {hasActiveTransport && (
        <>
          <SectionHeader 
            icon={MapPin} 
            title="Transport & Mobility Infrastructure"
            color="#F59E0B"
            count={15}
            variant="subtitle"
          />
          
          <div className="grid grid-cols-2 gap-2">
            {activeTransportSubLayers.length > 0 ? (
              <>
                <KPITile
                  title={KPI_LABELS.wardTransport.selectedFacilities.title}
                  value={(() => {
                    const selectedData = [
                      { name: 'bus_stop', count: 12 },
                      { name: 'railway_station', count: 0 },
                      { name: 'taxi_stand', count: 2 },
                      { name: 'parking', count: 1 },
                    ];
                    const selectedCount = selectedData
                      .filter(item => activeTransportSubLayers.includes(item.name))
                      .reduce((sum, item) => sum + item.count, 0);
                    return `${selectedCount}/15`;
                  })()}
                  subtitle={KPI_LABELS.wardTransport.selectedFacilities.subtitle}
                  color="#F59E0B"
                  percentage={(() => {
                    const selectedData = [
                      { name: 'bus_stop', count: 12 },
                      { name: 'railway_station', count: 0 },
                      { name: 'taxi_stand', count: 2 },
                      { name: 'parking', count: 1 },
                    ];
                    const selectedCount = selectedData
                      .filter(item => activeTransportSubLayers.includes(item.name))
                      .reduce((sum, item) => sum + item.count, 0);
                    return `${((selectedCount / 15) * 100).toFixed(1)}%`;
                  })()}
                />
                <KPITile
                  title={KPI_LABELS.wardTransport.hazardExposure.title}
                  value={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activeTransportSubLayers.forEach((layerName) => {
                      const count = transportCounts[layerName] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 4000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return `${totalExtreme + totalHigh}`;
                  })()}
                  subtitle={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    
                    activeTransportSubLayers.forEach((layerName) => {
                      const count = transportCounts[layerName] || 0;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 4000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalExtreme === 0 && totalHigh === 0 ? 'No Hazard Data' : `${totalExtreme} in Extreme, ${totalHigh} in High Hazard`;
                  })()}
                  color={colors.extreme || colors.high}
                  percentage={(() => {
                    const hazardLayerId = ['heat', 'air', 'flood', 'multihazard'].includes(activeSector) ? activeLayerId : null;
                    let totalExtreme = 0;
                    let totalHigh = 0;
                    let totalSelected = 0;
                    
                    activeTransportSubLayers.forEach((layerName) => {
                      const count = transportCounts[layerName] || 0;
                      totalSelected += count;
                      if (count > 0 && hazardLayerId) {
                        const exposure = calculateHazardExposure(count, hazardLayerId, selectedWardId, layerName.charCodeAt(0) * 4000);
                        totalExtreme += exposure.extreme;
                        totalHigh += exposure.high;
                      }
                    });
                    
                    return totalSelected > 0 ? `${(((totalExtreme + totalHigh) / totalSelected) * 100).toFixed(1)}%` : '0%';
                  })()}
                />
              </>
            ) : (
              <>
                <KPITile
                  title={KPI_LABELS.wardTransport.inWard.title}
                  value="15"
                  subtitle={KPI_LABELS.wardTransport.inWard.subtitle}
                  color="#F59E0B"
                  percentage="100%"
                />
                <KPITile
                  title={KPI_LABELS.wardTransport.highRisk.title}
                  value="11"
                  subtitle={KPI_LABELS.wardTransport.highRisk.subtitle}
                  color={colors.extreme || colors.high}
                  percentage="73.3%"
                />
              </>
            )}
          </div>
          
          {activeTransportSubLayers.length === 0 && (
            <StatsCard
              title="Transit Points in Ward"
              stats={[
              { label: 'Bus Stops', value: '12', color: '#3B82F6' },
              { label: 'Taxi Stands', value: '2', color: '#F59E0B' },
              { label: 'Parking Areas', value: '1', color: '#06B6D4' },
            ]}
              isDummy={true}
          />
          )}
        </>
      )}
    </>
  );
}

// ==================== HELPER COMPONENTS ====================

function getLayerName(layerId: string): string {
  const layerNames: Record<string, string> = {
    heat_hhi: 'Heat Stress Hazard Index',
    heat_lst: 'Land Surface Temperature',
    heat_ndvi: 'Vegetation Cover (NDVI)',
    heat_vulnerability: 'Heat Vulnerability Index',
    air_aqi: 'Air Quality Index',
    air_pm25: 'PM2.5 Concentration',
    air_pm10: 'PM10 Concentration',
    air_no2: 'NO₂ Levels',
    flood_fhi: 'Urban Flooding',
    flood_susceptibility: 'Flood Susceptibility',
    flood_depth: 'Potential Flood Depth',
    flood_drainage: 'Drainage Capacity',
    multihazard_assessment: 'Composite Risk Assessment',
  };
  return layerNames[layerId] || 'Active Layer';
}

function getInfraLayerShortName(layerId: string): string {
  const names: Record<string, string> = {
    educational: 'Education',
    healthcare: 'Healthcare',
    public_amenities: 'Amenities',
    transport_mobility: 'Transport',
    road_network: 'Roads',
    road_safety: 'Road Safety',
  };
  return names[layerId] || layerId;
}

// Section Header Component
function SectionHeader({ icon: Icon, title, color, count, variant = 'default', subtitle }: { icon: any, title: string, color: string, count?: number | string, variant?: 'default' | 'subtitle', subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-[#E5E7EB]">
      <div 
        className="w-6 h-6 rounded flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="flex-1">
        <h3 className={variant === 'subtitle' ? 'text-[11px] font-medium text-[#0F172A]' : 'text-xs font-semibold text-[#0F172A]'}>{title}</h3>
        {subtitle && (
          <p className="text-[10px] text-[#64748B] mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// KPI Tile Component
interface KPITileProps {
  title: string;
  value: string;
  subtitle: string;
  color: string;
  percentage: string;
  isDummy?: boolean;
}

function KPITile({ title, value, subtitle, color, percentage, isDummy = false }: KPITileProps) {
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const [titleOverflows, setTitleOverflows] = useState(false);
  const [subtitleOverflows, setSubtitleOverflows] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (titleRef.current) {
        setTitleOverflows(titleRef.current.scrollWidth > titleRef.current.clientWidth);
      }
      if (subtitleRef.current) {
        setSubtitleOverflows(subtitleRef.current.scrollWidth > subtitleRef.current.clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [title, subtitle]);

  return (
    <div className="relative border border-[#E5E7EB] rounded-lg p-3 bg-gradient-to-br from-white to-[#F8FAFC] hover:shadow-md transition-all duration-200 group overflow-hidden h-[78px]">
      <div 
        className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -translate-y-8 translate-x-8 opacity-20 group-hover:opacity-30 transition-opacity duration-500"
        style={{ backgroundColor: color }}
      />
      <div className="relative">
        {/* Line 1: Title - Left Aligned (single line, fixed font) */}
        <div className="text-[10px] text-[#64748B] font-medium mb-1.5 overflow-hidden">
          <div 
            ref={titleRef}
            className={`whitespace-nowrap ${titleOverflows ? 'inline-block animate-scroll-text' : ''}`}
          >
            {title}
            {titleOverflows && <span className="inline-block pl-8">{title}</span>}
          </div>
        </div>
        
        {/* Line 2: Value (left) + Percentage (right) - Centered in box */}
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <div 
            className={`font-bold truncate ${isDummy ? 'text-[#E3000F]' : 'text-[#0F172A]'}`} 
            style={{ fontSize: '14px', lineHeight: '18px' }}
          >
            {value}
          </div>
          <div 
            className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
            style={{ 
              backgroundColor: `${color}15`, 
              color: isDummy ? '#E3000F' : color 
            }}
          >
            {percentage}
          </div>
        </div>
        
        {/* Line 3: Footer - Left Aligned (single line) */}
        <div className="text-[9px] text-[#64748B] leading-tight overflow-hidden">
          <div 
            ref={subtitleRef}
            className={`whitespace-nowrap ${subtitleOverflows ? 'inline-block animate-scroll-text' : ''}`}
          >
            {subtitle}
            {subtitleOverflows && <span className="inline-block pl-8">{subtitle}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// KPI Tile with Change Indicator (for scenario comparison)
interface KPITileWithChangeProps {
  title: string;
  value: string;
  subtitle: string;
  color: string;
  percentage?: string;
  change: { value: number; isIncrease: boolean } | null;
  isDummy?: boolean;
}

function KPITileWithChange({ title, value, subtitle, color, percentage, change, isDummy = false }: KPITileWithChangeProps) {
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const [titleOverflows, setTitleOverflows] = useState(false);
  const [subtitleOverflows, setSubtitleOverflows] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (titleRef.current) {
        setTitleOverflows(titleRef.current.scrollWidth > titleRef.current.clientWidth);
      }
      if (subtitleRef.current) {
        setSubtitleOverflows(subtitleRef.current.scrollWidth > subtitleRef.current.clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [title, subtitle]);

  return (
    <div className="relative border border-[#E5E7EB] rounded-lg p-3 bg-gradient-to-br from-white to-[#F8FAFC] hover:shadow-md transition-all duration-200 group overflow-hidden h-[78px]">
      {/* Colored accent bar on left */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: color }}
      />
      <div 
        className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -translate-y-8 translate-x-8 opacity-20 group-hover:opacity-30 transition-opacity duration-500"
        style={{ backgroundColor: color }}
      />
      <div className="relative">
        {/* Line 1: Title - Left Aligned (single line, fixed font) */}
        <div className="text-[10px] text-[#64748B] font-medium mb-1.5 overflow-hidden">
          <div 
            ref={titleRef}
            className={`whitespace-nowrap ${titleOverflows ? 'inline-block animate-scroll-text' : ''}`}
          >
            {title}
            {titleOverflows && <span className="inline-block pl-8">{title}</span>}
          </div>
        </div>
        
        {/* Line 2: Value (left) + Optional Percentage (right) */}
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <div 
            className={`font-bold truncate ${isDummy ? 'text-[#E3000F]' : 'text-[#0F172A]'}`} 
            style={{ fontSize: '14px', lineHeight: '18px' }}
          >
            {value}
          </div>
          {percentage && (
            <div 
              className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{ 
                backgroundColor: `${color}15`, 
                color: isDummy ? '#E3000F' : color 
              }}
            >
              {percentage}
            </div>
          )}
        </div>
        
        {/* Line 3: Footer - Left Aligned (single line) */}
        <div className="text-[9px] text-[#64748B] leading-tight overflow-hidden">
          <div 
            ref={subtitleRef}
            className={`whitespace-nowrap ${subtitleOverflows ? 'inline-block animate-scroll-text' : ''}`}
          >
            {subtitle}
            {subtitleOverflows && (
              <span className="inline-block pl-8">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom Tooltip for Road Safety Chart
function RoadSafetyTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = data.totalLength > 0 ? ((data.value / data.totalLength) * 100).toFixed(1) : '0';
    
    return (
      <div className="bg-white rounded px-2 py-1.5 shadow-lg border border-[#E2E8F0]">
        <div className="flex items-center gap-1.5 mb-0.5">
          <div 
            className="w-2 h-2 rounded-sm flex-shrink-0" 
            style={{ backgroundColor: data.fill }}
          />
          <span className="text-white text-[10px] font-medium">{data.name}</span>
        </div>
        <div className="text-[9px] text-white font-medium pl-3.5">
          {data.value.toFixed(2)} km ({percentage}%)
        </div>
      </div>
    );
  }
  return null;
}

// Scenario Banner Component
function ScenarioBanner({ scenario }: { scenario: Scenario }) {
  const getScenarioColor = () => {
    if (scenario === 'ssp1_2040') return '#10B981'; // Green for sustainability
    if (scenario === 'ssp2_2040') return '#F59E0B'; // Orange for middle road
    if (scenario === 'ssp5_2040') return '#EF5350'; // Red for fossil-fueled
    return '#64748B';
  };

  const getScenarioDescription = () => {
    if (scenario === 'ssp1_2040') return 'Sustainable pathway with reduced emissions';
    if (scenario === 'ssp2_2040') return 'Middle-of-the-road scenario with moderate emissions';
    if (scenario === 'ssp5_2040') return 'High fossil fuel dependence with maximum emissions';
    return '';
  };

  const getScenarioIcon = () => {
    if (scenario === 'ssp1_2040') return Leaf;
    if (scenario === 'ssp2_2040') return TrendingUp;
    if (scenario === 'ssp5_2040') return Flame;
    return Check; // Baseline with tick sign
  };

  const color = getScenarioColor();
  const IconComponent = getScenarioIcon();

  return (
    <div 
      className="rounded-lg p-3 border-l-4 mb-3"
      style={{ 
        backgroundColor: `${color}10`,
        borderLeftColor: color
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div 
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <IconComponent className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-[#0F172A]">{getScenarioLabel(scenario)}</div>
          <div className="text-[9px] text-[#64748B] mt-0.5">{getScenarioDescription()}</div>
        </div>
      </div>
      <div className="text-[9px] text-[#64748B] mt-2 flex items-center gap-1">
        <span className="font-medium">Projection Year:</span>
        <span>2040 (15 years from baseline)</span>
      </div>
    </div>
  );
}

// Scenario Comparison Chart - Real Area Data Driven
function ScenarioComparisonChart({ scenario, activeSector, selectedWardId }: { 
  scenario: Scenario,
  activeSector: Sector,
  selectedWardId?: string
}) {
  // Fetch area data for all scenarios
  const baselineData = useKPIAreaData(activeSector, 'baseline_2025', selectedWardId);
  const ssp1Data = useKPIAreaData(activeSector, 'ssp1_2040', selectedWardId);
  const ssp2Data = useKPIAreaData(activeSector, 'ssp2_2040', selectedWardId);
  const ssp5Data = useKPIAreaData(activeSector, 'ssp5_2040', selectedWardId);

  // Debug logging
  console.log('📊 Scenario Comparison Data:', {
    baseline: baselineData,
    ssp1: ssp1Data,
    ssp2: ssp2Data,
    ssp5: ssp5Data
  });

  // Show loading state while data is being fetched
  if (!baselineData || !ssp1Data || !ssp2Data || !ssp5Data) {
    return (
      <ChartCard title="Climate Scenario Comparison">
        <div className="h-[200px] flex flex-col items-center justify-center gap-3">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-[3px] border-slate-100 rounded-full" />
            <div className="absolute inset-0 border-[3px] border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-[11px] font-medium text-slate-600">Loading scenario data…</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Preparing comparison results</p>
          </div>
        </div>
      </ChartCard>
    );
  }

  const comparisonData = [
    { 
      name: 'Baseline 2025', 
      area: Number(baselineData.totalAreaKm2.toFixed(2)),
      fill: '#94A3B8',
      percentage: Number(baselineData.percentage.toFixed(2))
    },
    { 
      name: 'SSP1 2040', 
      area: Number(ssp1Data.totalAreaKm2.toFixed(2)),
      fill: '#6EE7B7',
      percentage: Number(ssp1Data.percentage.toFixed(2))
    },
    { 
      name: 'SSP2 2040', 
      area: Number(ssp2Data.totalAreaKm2.toFixed(2)),
      fill: '#FCD34D',
      percentage: Number(ssp2Data.percentage.toFixed(2))
    },
    { 
      name: 'SSP5 2040', 
      area: Number(ssp5Data.totalAreaKm2.toFixed(2)),
      fill: '#FCA5A5',
      percentage: Number(ssp5Data.percentage.toFixed(2))
    },
  ];

  return <ClimateScenarioComparison data={comparisonData} sector={activeSector} scenario={scenario} wardId={selectedWardId} />;
}

// Chart Card Component
interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="border border-[#E5E7EB] rounded-lg p-2 bg-white shadow-sm mb-3">
      <h3 className="text-[11px] font-semibold text-[#0F172A] mb-2">{title}</h3>
      {children}
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  stats: Array<{
    label: string;
    value: string;
    color: string;
  }>;
  isDummy?: boolean;
  loading?: boolean;
}

function StatsCard({ title, stats, isDummy = false, loading = false }: StatsCardProps) {
  const [animationKey, setAnimationKey] = useState(0);
  
  // Trigger re-animation when stats change
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [stats]);
  
  return (
    null
  );
}

// Impact Distribution Component
interface ImpactDistributionProps {
  data: Array<{
    category: string;
    [key: string]: number | string | any; // Allow dynamic risk levels
    total: number;
    icon?: any; // Optional icon component
  }>;
  colors: any;
  activeSector: Sector;
  unit?: string; // Optional unit (e.g., "km" for road networks)
  title?: string; // Optional custom title
  categoryName?: string; // Optional parent category name
}

function ImpactDistribution({ data, colors, activeSector, unit = '', title = 'Hazard Exposure Distribution', categoryName }: ImpactDistributionProps) {
  const [hoveredSegment, setHoveredSegment] = React.useState<{ category: string; level: string; value: number; percent: number } | null>(null);
  const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });
  
  // Get the risk classes based on active sector
  const getRiskClasses = () => {
    if (activeSector === 'heat') {
      return [
        { key: 'extreme', label: 'Extreme', color: colors.extreme },
        { key: 'high', label: 'High', color: colors.high },
        { key: 'moderate', label: 'Moderate', color: colors.moderate },
        { key: 'low', label: 'Low', color: colors.low },
      ];
    } else if (activeSector === 'air') {
      return [
        { key: 'hazardous', label: 'Hazardous', color: colors.hazardous },
        { key: 'veryUnhealthy', label: 'Very Unhealthy', color: colors.veryUnhealthy },
        { key: 'unhealthy', label: 'Unhealthy', color: colors.unhealthy },
        { key: 'unhealthySensitive', label: 'Unhealthy for Sensitive Groups', color: colors.unhealthySensitive },
        { key: 'moderate', label: 'Moderate', color: colors.moderate },
        { key: 'good', label: 'Good', color: colors.good },
      ];
    } else if (activeSector === 'flood') {
      return [
        { key: 'veryHigh', label: 'Very High', color: colors.veryHigh },
        { key: 'high', label: 'High', color: colors.high },
        { key: 'moderate', label: 'Moderate', color: colors.moderate },
        { key: 'low', label: 'Low', color: colors.low },
        { key: 'noRisk', label: 'No Risk', color: colors.noRisk },
      ];
    }
    // Default for multi-hazard or unknown
    return [
      { key: 'extreme', label: 'Very High', color: colors.veryHigh || colors.extreme || '#D73027' },
      { key: 'high', label: 'High', color: colors.high || '#F46D43' },
      { key: 'moderate', label: 'Moderate', color: colors.moderate || '#91CF60' },
      { key: 'low', label: 'Low', color: colors.low || '#1A9850' },
    ];
  };

  const riskClasses = getRiskClasses();

  const handleMouseEnter = (e: React.MouseEvent, category: string, label: string, value: number, percent: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: e.clientX, y: rect.top });
    setHoveredSegment({ category, level: label, value, percent });
  };

  const handleMouseLeave = () => {
    setHoveredSegment(null);
  };

  return (
    <div className="border border-[#E5E7EB] rounded-lg p-3 bg-white shadow-sm mb-3">
      <h3 className="text-[11px] font-semibold text-[#0F172A] mb-3">{title}</h3>
      
      {/* Category Name Header */}
      {categoryName && (
        <div className="mb-2 pb-1.5 border-b border-[#E5E7EB]">
          <h4 className="text-[10px] font-semibold text-[#0F172A]">{categoryName}</h4>
        </div>
      )}
      
      {/* Tooltip */}
      {hoveredSegment && (
        <div 
          className="fixed z-[100000] bg-[#F1F5F9] text-white px-2.5 py-1.5 rounded shadow-lg pointer-events-none"
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y - 40}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="text-[10px] font-semibold">{hoveredSegment.category}</div>
          <div className="text-[9px]">{hoveredSegment.level}: {hoveredSegment.value.toFixed(1)}{unit ? ` ${unit}` : ''} ({hoveredSegment.percent.toFixed(1)}%)</div>
        </div>
      )}
      
      <div className="space-y-3">
        {data.map((item, idx) => {
          const Icon = item.icon;
          // Hide icons for road network categories
          const isRoadNetwork = item.category.includes('Highway') || item.category.includes('Road');
          
          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  {Icon && !isRoadNetwork && <Icon className="w-3 h-3 text-[#64748B]" />}
                  <span className="text-[10px] text-[#64748B] font-medium">{item.category}</span>
                </div>
                <span className="text-[10px] text-[#64748B] font-semibold">{Math.round(item.total)}{unit ? ` ${unit}` : ''} total</span>
              </div>
              
              {/* Progress bar showing all risk classes */}
              <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-[#F1F5F9]">
                {riskClasses.map((riskClass) => {
                  const value = (item[riskClass.key] as number) || 0;
                  const percent = (value / item.total) * 100;
                  
                  if (value === 0) return null;
                  
                  return (
                    <div 
                      key={riskClass.key}
                      className="transition-all duration-500 cursor-pointer hover:opacity-80"
                      style={{ 
                        width: `${percent}%`, 
                        backgroundColor: riskClass.color 
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, item.category, riskClass.label, value, percent)}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })}
              </div>
              
              {/* Legend showing all risk classes with values */}
              <div className="flex items-center flex-wrap gap-2 mt-1">
                {riskClasses.map((riskClass) => {
                  const value = (item[riskClass.key] as number) || 0;
                  if (value === 0) return null;
                  
                  return (
                    <div key={riskClass.key} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: riskClass.color }} />
                      <span className="text-[9px] text-[#64748B]">{value.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Detailed Breakdown Component (for sub-layers)
interface DetailedBreakdownProps {
  title: string;
  categoryName?: string; // Optional parent category name
  items: Array<{
    name: string;
    count: number;
    [key: string]: number | string | any; // Allow dynamic risk levels
    icon: any;
  }>;
  colors: any;
  activeSector: Sector;
}

function DetailedBreakdown({ title, categoryName, items, colors, activeSector }: DetailedBreakdownProps) {
  const [hoveredSegment, setHoveredSegment] = React.useState<{ category: string; level: string; value: number; percent: number } | null>(null);
  const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });

  // Get the risk classes based on active sector (same as ImpactDistribution)
  const getRiskClasses = () => {
    if (activeSector === 'heat') {
      return [
        { key: 'extreme', label: 'Extreme', color: colors.extreme },
        { key: 'high', label: 'High', color: colors.high },
        { key: 'moderate', label: 'Moderate', color: colors.moderate },
        { key: 'low', label: 'Low', color: colors.low },
      ];
    } else if (activeSector === 'air') {
      return [
        { key: 'hazardous', label: 'Hazardous', color: colors.hazardous },
        { key: 'veryUnhealthy', label: 'Very Unhealthy', color: colors.veryUnhealthy },
        { key: 'unhealthy', label: 'Unhealthy', color: colors.unhealthy },
        { key: 'unhealthySensitive', label: 'Unhealthy for Sensitive Groups', color: colors.unhealthySensitive },
        { key: 'moderate', label: 'Moderate', color: colors.moderate },
        { key: 'good', label: 'Good', color: colors.good },
      ];
    } else if (activeSector === 'flood') {
      return [
        { key: 'veryHigh', label: 'Very High', color: colors.veryHigh },
        { key: 'high', label: 'High', color: colors.high },
        { key: 'moderate', label: 'Moderate', color: colors.moderate },
        { key: 'low', label: 'Low', color: colors.low },
        { key: 'noRisk', label: 'No Risk', color: colors.noRisk },
      ];
    }
    // Default for multi-hazard or unknown
    return [
      { key: 'extreme', label: 'Very High', color: colors.veryHigh || colors.extreme || '#D73027' },
      { key: 'high', label: 'High', color: colors.high || '#F46D43' },
      { key: 'moderate', label: 'Moderate', color: colors.moderate || '#91CF60' },
      { key: 'low', label: 'Low', color: colors.low || '#1A9850' },
    ];
  };

  const riskClasses = getRiskClasses();

  const handleMouseEnter = (e: React.MouseEvent, category: string, label: string, value: number, percent: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: e.clientX, y: rect.top });
    setHoveredSegment({ category, level: label, value, percent });
  };

  const handleMouseLeave = () => {
    setHoveredSegment(null);
  };

  return (
    <div className="border border-[#E5E7EB] rounded-lg p-3 bg-white shadow-sm mb-3">
      <h3 className="text-[11px] font-semibold text-[#0F172A] mb-3">{title}</h3>
      
      {/* Category Name Header */}
      {categoryName && (
        <div className="mb-2 pb-1.5 border-b border-[#E5E7EB]">
          <h4 className="text-[10px] font-semibold text-[#0F172A]">{categoryName}</h4>
        </div>
      )}
      
      {/* Tooltip */}
      {hoveredSegment && (
        <div 
          className="fixed z-[100000] bg-[#F1F5F9] text-white px-2.5 py-1.5 rounded shadow-lg pointer-events-none"
          style={{ 
            left: `${tooltipPos.x}px`, 
            top: `${tooltipPos.y - 40}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="text-[10px] font-semibold">{hoveredSegment.category}</div>
          <div className="text-[9px]">{hoveredSegment.level}: {hoveredSegment.value} ({hoveredSegment.percent.toFixed(1)}%)</div>
        </div>
      )}
      
      <div className="space-y-3">
        {items.map((item, idx) => {
          const Icon = item.icon;
          
          return (
            <div key={idx}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-3 h-3 text-[#64748B]" />
                <span className="text-[10px] font-semibold text-[#64748B] flex-1">{item.name}</span>
                <span className="text-[10px] text-[#64748B] font-semibold">{item.count} total</span>
              </div>
              
              {/* Progress bar showing all risk classes */}
              <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-[#F1F5F9]">
                {riskClasses.map((riskClass) => {
                  const value = (item[riskClass.key] as number) || 0;
                  const percent = (value / item.count) * 100;
                  
                  if (value === 0) return null;
                  
                  return (
                    <div 
                      key={riskClass.key}
                      className="transition-all duration-500 cursor-pointer hover:opacity-80"
                      style={{ 
                        width: `${percent}%`, 
                        backgroundColor: riskClass.color 
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, item.name, riskClass.label, value, percent)}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })}
              </div>
              
              {/* Legend showing all risk classes with values */}
              <div className="flex items-center flex-wrap gap-2 mt-1">
                {riskClasses.map((riskClass) => {
                  const value = (item[riskClass.key] as number) || 0;
                  if (value === 0) return null;
                  
                  return (
                    <div key={riskClass.key} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: riskClass.color }} />
                      <span className="text-[9px] text-[#64748B]">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Data Table Component
interface DataTableProps {
  title: string;
  headers: string[];
  rows: Array<{
    type: string;
    length: string;
    level: string;
    color: string;
  }>;
}

function DataTable({ title, headers, rows }: DataTableProps) {
  return (
    <div className="border border-[#E5E7EB] rounded-lg overflow-hidden bg-white shadow-sm mb-3">
      <div className="px-3 py-2 bg-[#F8FAFC] border-b border-[#E5E7EB]">
        <h3 className="text-[11px] font-semibold text-[#0F172A]">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} className="px-3 py-2 text-left text-[9px] font-semibold text-[#64748B] uppercase tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-3 py-2 text-[10px] text-[#0F172A] font-medium">{row.type}</td>
                <td className="px-3 py-2 text-[10px] text-[#64748B]">{row.length}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="text-[10px] font-medium" style={{ color: row.color }}>
                      {row.level}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Detailed List Component (for ward-specific facilities)
interface DetailedListProps {
  items: Array<{
    name: string;
    type: string;
    risk: string;
    students: number;
    color: string;
  }>;
}

function DetailedList({ items }: DetailedListProps) {
  return (
    <div className="border border-[#E5E7EB] rounded-lg bg-white shadow-sm overflow-hidden mb-3">
      <div className="divide-y divide-[#F1F5F9]">
        {items.map((item, idx) => (
          <div key={idx} className="p-3 hover:bg-[#F8FAFC] transition-colors">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1">
                <div className="text-[10px] font-semibold text-[#0F172A] mb-0.5">{item.name}</div>
                <div className="text-[9px] text-[#64748B]">{item.type}</div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[9px] font-semibold" style={{ color: item.color }}>
                  {item.risk}
                </span>
              </div>
            </div>
            <div className="text-[9px] text-[#64748B]">
              {item.students > 100 ? `~${item.students} people` : `${item.students} people`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

